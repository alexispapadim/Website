/**
 * Enquiry API for papadimitriou.uk
 *
 * POST /api/enquiry  (JSON, same-origin only)
 *  - validates and sanitises every field on the server
 *  - checks Cloudflare Turnstile (bot protection)
 *  - rate-limits per visitor and per recipient address
 *  - emails the enquiry to Alexis and a confirmation to the visitor (via Resend)
 *
 * GET /el/  – the Greek page, pre-rendered in Greek for search engines
 *
 * Everything else is served from the static files (index.html, app.js, …).
 *
 * Secrets (Cloudflare dashboard → Workers → website → Settings → Variables and Secrets):
 *   RESEND_API_KEY     – from resend.com
 *   TURNSTILE_SECRET   – from Cloudflare Turnstile
 * Plain variables live in wrangler.jsonc.
 */

import { I18N } from './i18n.js';

const LIMITS = { name: 80, email: 254, phone: 32, message: 3000 };
const LOCATIONS = ['Athens', 'Elsewhere in Greece', 'London', 'Other'];
const OCCASIONS = ['Private dinner', 'Celebration', 'Event / catering', 'Villa / retreat', 'Other'];
const MAX_BODY = 12_000;          // bytes
const MIN_FILL_MS = 2_500;        // faster than this = almost certainly a bot
const IP_WINDOW_S = 30;           // one enquiry per visitor per 30 s
const CONFIRM_WINDOW_S = 600;     // one confirmation email per address per 10 min

const L10N = {
  en: {
    loc: { 'Athens': 'Athens', 'Elsewhere in Greece': 'Elsewhere in Greece', 'London': 'London', 'Other': 'Other' },
    occ: { 'Private dinner': 'Private dinner', 'Celebration': 'Celebration', 'Event / catering': 'Event / catering', 'Villa / retreat': 'Villa / retreat', 'Other': 'Other' },
    subject: 'We’ve received your enquiry — Alexis Papadimitriou',
    hello: n => (n ? `Dear ${n},` : 'Hello,'),
    intro: 'Thank you for getting in touch. Your enquiry has been received, and Alexis will reply to you personally soon.',
    summary: 'Your enquiry',
    date: 'Event date', guests: 'Guests', location: 'Location', occasion: 'Occasion', tbc: 'To be confirmed',
    change: 'If anything changes in the meantime, simply reply to this email.',
    sign: 'Alexis Papadimitriou<br>Private Chef &amp; Catering',
    footer: 'You are receiving this one-off email because this address was entered in the enquiry form at papadimitriou.uk. If that wasn’t you, please ignore it — you won’t hear from us again.',
    privacy: 'Privacy Policy'
  },
  el: {
    loc: { 'Athens': 'Αθήνα', 'Elsewhere in Greece': 'Αλλού στην Ελλάδα', 'London': 'Λονδίνο', 'Other': 'Άλλο' },
    occ: { 'Private dinner': 'Ιδιωτικό δείπνο', 'Celebration': 'Γιορτή', 'Event / catering': 'Εκδήλωση / catering', 'Villa / retreat': 'Βίλα / retreat', 'Other': 'Άλλο' },
    subject: 'Λάβαμε το αίτημά σας — Alexis Papadimitriou',
    hello: n => (n ? `Αγαπητέ/ή ${n},` : 'Γεια σας,'),
    intro: 'Σας ευχαριστούμε για την επικοινωνία. Το αίτημά σας παραλήφθηκε και ο Αλέξης θα σας απαντήσει προσωπικά σύντομα.',
    summary: 'Το αίτημά σας',
    date: 'Ημερομηνία', guests: 'Άτομα', location: 'Τοποθεσία', occasion: 'Περίσταση', tbc: 'Θα επιβεβαιωθεί',
    change: 'Αν αλλάξει κάτι στο μεταξύ, απλώς απαντήστε σε αυτό το email.',
    sign: 'Αλέξης Παπαδημητρίου<br>Ιδιωτικός Σεφ &amp; Catering',
    footer: 'Λαμβάνετε αυτό το μεμονωμένο email επειδή η διεύθυνση αυτή καταχωρήθηκε στη φόρμα επικοινωνίας του papadimitriou.uk. Αν δεν ήσασταν εσείς, αγνοήστε το — δεν θα σας ξαναστείλουμε.',
    privacy: 'Πολιτική Απορρήτου'
  }
};

/* ------------------------------------------------------------------ */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/api/enquiry') {
      try {
        return await handleEnquiry(request, env, ctx, url);
      } catch (err) {
        console.error('enquiry: unhandled', err && err.message);
        return json({ ok: false, error: 'server' }, 500);
      }
    }
    if (url.pathname.startsWith('/api/')) return json({ ok: false, error: 'not_found' }, 404);
    if (url.pathname === '/el' || url.pathname === '/el/index.html') {
      return Response.redirect(url.origin + '/el/' + url.search, 301);
    }
    if (url.pathname === '/el/' && (request.method === 'GET' || request.method === 'HEAD')) {
      return greekPage(env, url);
    }
    return env.ASSETS.fetch(request);
  }
};

async function handleEnquiry(request, env, ctx, url) {
  if (request.method !== 'POST') {
    return json({ ok: false, error: 'method' }, 405, { Allow: 'POST' });
  }

  // Same-origin only: browsers always send Origin on POST fetches.
  const allowed = allowedOrigins(env, url);
  const origin = request.headers.get('Origin') || '';
  if (!allowed.includes(origin)) return json({ ok: false, error: 'forbidden' }, 403);

  const ctype = (request.headers.get('Content-Type') || '').toLowerCase();
  if (!ctype.startsWith('application/json')) return json({ ok: false, error: 'invalid' }, 415);

  const declared = Number(request.headers.get('Content-Length') || 0);
  if (declared > MAX_BODY) return json({ ok: false, error: 'invalid' }, 413);
  const raw = await request.text();
  if (raw.length > MAX_BODY) return json({ ok: false, error: 'invalid' }, 413);

  let body;
  try { body = JSON.parse(raw); } catch { return json({ ok: false, error: 'invalid' }, 400); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ ok: false, error: 'invalid' }, 400);

  // Bots: hidden honeypot field filled in, or form "filled" impossibly fast.
  // Pretend success so they don't learn anything.
  if (str(body.website) !== '' || (typeof body.t === 'number' && body.t < MIN_FILL_MS)) {
    return json({ ok: true });
  }

  const { data, bad } = validate(body);
  if (bad.length) return json({ ok: false, error: 'invalid', fields: bad }, 422);

  const ip = request.headers.get('CF-Connecting-IP') || '';
  const dev = isDev(env, url);

  // Bot check (fails closed).
  const human = dev && body.token === 'dev-pass' ? true : await verifyTurnstile(env, str(body.token, 2048), ip, allowed);
  if (!human) return json({ ok: false, error: 'captcha' }, 403);

  // Per-visitor rate limit.
  if (ip && await limited('ip:' + ip, IP_WINDOW_S)) return json({ ok: false, error: 'rate' }, 429);

  // 1) Enquiry to Alexis (must succeed).
  const sent = await sendEmail(env, dev, ownerEmail(env, data));
  if (!sent) return json({ ok: false, error: 'server' }, 502);

  // 2) Confirmation to the visitor — at most once per address per window,
  //    so the form can't be used to flood someone else's inbox.
  ctx.waitUntil((async () => {
    if (await limited('to:' + data.email.toLowerCase(), CONFIRM_WINDOW_S)) return;
    await sendEmail(env, dev, confirmationEmail(env, data));
  })());

  return json({ ok: true });
}

/* ---------------- validation ---------------- */

const CTRL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F​-‏‪-‮⁠-⁩﻿]/g;

function str(v, max = 500) {
  return typeof v === 'string' ? v.slice(0, max) : '';
}
function oneLine(v, max) {
  return str(v, max * 2).replace(CTRL, '').replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
}
function multiLine(v, max) {
  return str(v, max * 2).replace(/\r\n?/g, '\n').replace(CTRL, '').replace(/\n{4,}/g, '\n\n\n').trim();
}

const EMAIL_RE = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+(?:[A-Za-z]{2,63}|xn--[A-Za-z0-9-]{1,59})$/;

function validate(b) {
  const bad = [];
  const name = oneLine(b.name, LIMITS.name);
  if (name.length < 2 || name.length > LIMITS.name) bad.push('name');

  const email = oneLine(b.email, LIMITS.email);
  if (email.length > LIMITS.email || !EMAIL_RE.test(email) || email.includes('..')) bad.push('email');

  const phone = oneLine(b.phone, LIMITS.phone);
  if (phone && !/^[+0-9 ()./-]{5,32}$/.test(phone)) bad.push('phone');

  let event_date = oneLine(b.event_date, 10);
  if (event_date) {
    const ok = /^\d{4}-\d{2}-\d{2}$/.test(event_date) && !isNaN(Date.parse(event_date + 'T00:00:00Z'));
    const d = ok ? Date.parse(event_date + 'T00:00:00Z') : 0;
    const today = Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate());
    if (!ok || d < today - 86_400_000 || d > today + 3 * 365 * 86_400_000) bad.push('event_date');
  }

  let guests = '';
  if (b.guests !== undefined && b.guests !== null && b.guests !== '') {
    const n = Number(b.guests);
    if (!Number.isInteger(n) || n < 1 || n > 1000) bad.push('guests'); else guests = String(n);
  }

  const location = LOCATIONS.includes(b.location) ? b.location : (b.location ? (bad.push('location'), '') : '');
  const occasion = OCCASIONS.includes(b.occasion) ? b.occasion : (b.occasion ? (bad.push('occasion'), '') : '');

  const message = multiLine(b.message, LIMITS.message);
  if (message.length > LIMITS.message) bad.push('message');

  const lang = b.lang === 'el' ? 'el' : 'en';
  return { data: { name, email, phone, event_date, guests, location, occasion, message, lang }, bad };
}

/* ---------------- bot check & rate limit ---------------- */

async function verifyTurnstile(env, token, ip, allowedOrigins) {
  if (!token || !env.TURNSTILE_SECRET) return false;
  try {
    const form = new FormData();
    form.append('secret', env.TURNSTILE_SECRET);
    form.append('response', token);
    if (ip) form.append('remoteip', ip);
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
    if (!r.ok) return false;
    const d = await r.json();
    if (d.success !== true) return false;
    // Token must have been issued on our own site.
    const hosts = allowedOrigins.map(o => { try { return new URL(o).hostname; } catch { return ''; } });
    return !d.hostname || hosts.includes(d.hostname);
  } catch (err) {
    console.error('turnstile: verify failed', err && err.message);
    return false;
  }
}

async function limited(key, ttl) {
  try {
    const id = await sha256(key);
    const req = new Request('https://rate-limit.invalid/' + id);
    const cache = caches.default;
    if (await cache.match(req)) return true;
    await cache.put(req, new Response('1', { headers: { 'Cache-Control': `max-age=${ttl}` } }));
    return false;
  } catch {
    return false; // never block real people because the cache misbehaved
  }
}

async function sha256(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('ap-site:' + s));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

/* ---------------- email ---------------- */

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function ownerEmail(env, d) {
  const isEl = d.lang === 'el';
  const first = (d.name.split(' ')[0] || '').replace(/[^\p{L}\p{M}'’-]/gu, '').slice(0, 30);
  const TZ = 'Europe/Athens';
  const received = new Date().toLocaleString('en-GB', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  let dateTxt = 'To be confirmed', dateHint = '';
  if (d.event_date) {
    const ev = new Date(d.event_date + 'T12:00:00Z');
    dateTxt = ev.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
    const today = new Date(new Date().toLocaleDateString('en-CA', { timeZone: TZ }) + 'T12:00:00Z');
    const days = Math.round((ev - today) / 86_400_000);
    dateHint = days <= 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`;
  }
  const facts = [
    ['Date', dateTxt, dateHint],
    ['Guests', d.guests || '—', d.guests ? (Number(d.guests) === 1 ? 'person' : 'people') : ''],
    ['Location', d.location || '—', ''],
    ['Occasion', d.occasion || '—', '']
  ];

  // Buttons — every URL is built only from validated values.
  const replySubject = isEl ? 'Το αίτημά σας — Alexis Papadimitriou' : 'Your enquiry — Alexis Papadimitriou';
  const replyBody = isEl ? `Αγαπητέ/ή ${first},\n\n` : `Dear ${first || d.name},\n\n`;
  const mailto = `mailto:${d.email}?subject=${encodeURIComponent(replySubject)}&body=${encodeURIComponent(replyBody)}`;
  const digits = d.phone.replace(/\D/g, '');
  const intl = d.phone.trim().startsWith('+') || d.phone.trim().startsWith('00');
  const buttons = [['Reply by email', mailto, true]];
  if (digits.length >= 8) {
    if (intl) buttons.push(['WhatsApp', `https://wa.me/${digits.replace(/^00/, '')}`, false]);
    buttons.push(['Call', `tel:${intl ? '+' + digits.replace(/^00/, '') : digits}`, false]);
  }

  const btn = ([label, href, primary]) =>
    `<a href="${esc(href)}" style="display:inline-block;white-space:nowrap;margin:0 8px 10px 0;padding:13px 22px;border-radius:999px;font:600 13px Arial,Helvetica,sans-serif;letter-spacing:.06em;text-decoration:none;${primary ? 'background:#20251a;color:#f4eee5;border:1px solid #20251a' : 'background:#ffffff;color:#20251a;border:1px solid #b8914f'}">${esc(label)}</a>`;

  const fact = ([k, v, hint]) => `
    <td width="50%" valign="top" style="padding:6px">
      <div style="background:#f6f1e8;border-radius:12px;padding:14px 16px">
        <div style="font:600 10px Arial,Helvetica,sans-serif;letter-spacing:.22em;text-transform:uppercase;color:#b8914f">${esc(k)}</div>
        <div style="font:400 19px/1.3 Georgia,'Times New Roman',serif;color:#20251a;margin-top:6px">${esc(v)}</div>
        ${hint ? `<div style="font:12px Arial,Helvetica,sans-serif;color:#7a7f68;margin-top:3px">${esc(hint)}</div>` : ''}
      </div>
    </td>`;

  const contactRow = (label, value, href) => `
    <tr>
      <td style="padding:9px 0;border-bottom:1px solid #ece4d8;font:12px Arial,Helvetica,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#7a7f68;width:90px">${esc(label)}</td>
      <td style="padding:9px 0;border-bottom:1px solid #ece4d8;font:15px Arial,Helvetica,sans-serif;color:#20251a">${href ? `<a href="${esc(href)}" style="color:#20251a;text-decoration:none;border-bottom:1px solid #d6b679">${esc(value)}</a>` : esc(value)}</td>
    </tr>`;

  const headline = [d.occasion, d.guests ? `${d.guests} guests` : '', d.location].filter(Boolean).join(' · ') || 'New enquiry';
  const preheader = [d.name, d.guests ? `${d.guests} guests` : '', d.event_date ? dateTxt : '', d.location].filter(Boolean).join(' · ');

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>New enquiry</title></head>
<body style="margin:0;padding:0;background:#ece4d8;-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#ece4d8">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ece4d8"><tr><td align="center" style="padding:28px 12px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fffdf9;border-radius:18px;overflow:hidden">
    <tr><td style="background:#20251a;padding:30px 32px 26px" align="center">
      <div style="font:400 34px Georgia,'Times New Roman',serif;color:#d6b679;letter-spacing:.02em;line-height:1">AP</div>
      <div style="width:120px;height:1px;background:#b8914f;margin:14px auto"></div>
      <div style="font:600 11px Arial,Helvetica,sans-serif;letter-spacing:.34em;text-transform:uppercase;color:#d6b679">New enquiry</div>
      <div style="font:12px Arial,Helvetica,sans-serif;color:#a9ad97;margin-top:6px">${esc(received)} · Athens time</div>
    </td></tr>

    <tr><td style="padding:30px 32px 6px">
      <div style="font:400 30px/1.15 Georgia,'Times New Roman',serif;color:#20251a">${esc(d.name)}</div>
      <div style="font:italic 17px/1.4 Georgia,'Times New Roman',serif;color:#8a6a35;margin-top:6px">${esc(headline)}</div>
      ${isEl ? `<div style="display:inline-block;margin-top:12px;padding:4px 10px;border-radius:999px;background:#f6f1e8;font:600 11px Arial,Helvetica,sans-serif;letter-spacing:.12em;color:#5b6640">WROTE IN GREEK · ΕΛΛΗΝΙΚΑ</div>` : ''}
    </td></tr>

    <tr><td style="padding:14px 26px 4px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>${fact(facts[0])}${fact(facts[1])}</tr>
        <tr>${fact(facts[2])}${fact(facts[3])}</tr>
      </table>
    </td></tr>

    <tr><td style="padding:22px 32px 4px">
      <div style="font:600 10px Arial,Helvetica,sans-serif;letter-spacing:.22em;text-transform:uppercase;color:#b8914f;margin-bottom:10px">Their message</div>
      <div style="border-left:3px solid #d6b679;background:#f6f1e8;border-radius:0 12px 12px 0;padding:16px 18px;font:16px/1.65 Georgia,'Times New Roman',serif;color:#20251a;white-space:pre-wrap">${d.message ? esc(d.message) : '<span style="color:#7a7f68;font-style:italic">No message added.</span>'}</div>
    </td></tr>

    <tr><td style="padding:24px 32px 4px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${contactRow('Email', d.email, 'mailto:' + d.email)}
        ${d.phone ? contactRow('Phone', d.phone, digits.length >= 8 ? `tel:${intl ? '+' + digits.replace(/^00/, '') : digits}` : '') : ''}
      </table>
    </td></tr>

    <tr><td style="padding:22px 32px 30px">
      <div>${buttons.map(btn).join('')}</div>
      <div style="font:12px/1.6 Arial,Helvetica,sans-serif;color:#7a7f68;margin-top:8px">Tip: hitting Reply in your inbox also answers ${esc(first || d.name)} directly.</div>
    </td></tr>

    <tr><td style="background:#f6f1e8;padding:18px 32px;font:11px/1.6 Arial,Helvetica,sans-serif;color:#7a7f68;text-align:center">
      Sent from the enquiry form at papadimitriou.uk · Keep or delete this email in line with your Privacy Policy (enquiries without a booking: within 24 months).
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;

  const text = [
    `NEW ENQUIRY — ${received} (Athens time)`, '',
    d.name, headline, '',
    ...facts.map(([k, v, h]) => `${k}: ${v}${h ? ` (${h})` : ''}`), '',
    `Email: ${d.email}`, d.phone ? `Phone: ${d.phone}` : '', `Language: ${isEl ? 'Greek' : 'English'}`, '',
    'Message:', d.message || '—'
  ].filter(l => l !== null).join('\n');

  return {
    from: `Website enquiries <${env.FROM_EMAIL}>`,
    to: [env.TO_EMAIL],
    reply_to: d.email,
    subject: `New enquiry: ${d.name}${d.guests ? ` · ${d.guests} guests` : ''}${d.event_date ? ` · ${dateTxt}` : ''}`.slice(0, 150),
    html, text
  };
}

function confirmationEmail(env, d) {
  const t = L10N[d.lang] || L10N.en;
  // Greet by first name only, letters only — nothing a spammer could use to carry a message.
  const first = (d.name.split(' ')[0] || '').replace(/[^\p{L}\p{M}'’-]/gu, '').slice(0, 30);
  const fmtDate = d.event_date
    ? new Date(d.event_date + 'T12:00:00Z').toLocaleDateString(d.lang === 'el' ? 'el-GR' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    : t.tbc;
  const rows = [
    [t.date, fmtDate], [t.guests, d.guests || t.tbc],
    [t.location, d.location ? t.loc[d.location] : t.tbc], [t.occasion, d.occasion ? t.occ[d.occasion] : t.tbc]
  ];
  const site = env.SITE_URL || 'https://papadimitriou.uk';
  const html = shell(`
    <p style="font:16px/1.6 Georgia,serif;color:#20251a;margin:0 0 14px">${esc(t.hello(first))}</p>
    <p style="font:16px/1.6 Georgia,serif;color:#20251a;margin:0 0 22px">${esc(t.intro)}</p>
    <p style="font:12px Arial,sans-serif;color:#b8914f;margin:0 0 8px;text-transform:uppercase;letter-spacing:.2em">${esc(t.summary)}</p>
    <table role="presentation" style="border-collapse:collapse;width:100%;font:15px/1.5 Arial,sans-serif;color:#20251a">
      ${rows.map(([k, v]) => `<tr><td style="padding:8px 12px 8px 0;color:#5b6640">${esc(k)}</td><td style="padding:8px 0;border-bottom:1px solid #e2d7c6">${esc(v)}</td></tr>`).join('')}
    </table>
    <p style="font:16px/1.6 Georgia,serif;color:#20251a;margin:22px 0">${esc(t.change)}</p>
    <p style="font:italic 17px/1.5 Georgia,serif;color:#20251a;margin:0">${t.sign}</p>
    <p style="font:12px/1.6 Arial,sans-serif;color:#8a8f7a;margin:30px 0 0">${esc(t.footer)} <a href="${esc(site)}/#privacy" style="color:#8a6a35">${esc(t.privacy)}</a></p>`, d.lang);
  const text = `${t.hello(first)}\n\n${t.intro}\n\n${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\n${t.change}\n\n${t.sign.replace('<br>', '\n').replace('&amp;', '&')}\n\n${t.footer}\n${site}/#privacy`;
  return {
    from: `Alexis Papadimitriou <${env.FROM_EMAIL}>`,
    to: [d.email],
    reply_to: env.TO_EMAIL,
    subject: t.subject,
    html, text
  };
}

function shell(inner, lang = 'en') {
  return `<!doctype html><html lang="${lang === 'el' ? 'el' : 'en'}"><body style="margin:0;background:#ece4d8;padding:24px 12px">
  <div style="max-width:560px;margin:0 auto;background:#fffdf9;border-radius:14px;overflow:hidden">
    <div style="background:#20251a;padding:22px 28px;text-align:center;font:400 26px Georgia,serif;color:#d6b679;letter-spacing:.04em">AP</div>
    <div style="padding:28px">${inner}</div>
  </div></body></html>`;
}

async function sendEmail(env, dev, msg) {
  if (dev && env.DRY_RUN === '1') {
    console.log('DRY_RUN email', JSON.stringify(msg));
    return true;
  }
  if (!env.RESEND_API_KEY || !env.FROM_EMAIL || !env.TO_EMAIL) {
    console.error('email: missing configuration');
    return false;
  }
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(msg)
    });
    if (!r.ok) {
      console.error('email: provider rejected', r.status, (await r.text()).slice(0, 300));
      return false;
    }
    return true;
  } catch (err) {
    console.error('email: send failed', err && err.message);
    return false;
  }
}

/* ---------------- helpers ---------------- */

function allowedOrigins(env, url) {
  const list = String(env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (isDev(env, url)) list.push(url.origin);
  return list;
}

function isDev(env, url) {
  // Development shortcuts only ever apply on localhost, never on the live domain.
  return env.DEV === '1' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1');
}

function json(obj, status = 200, extra = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...extra
    }
  });
}

/* ---------------- Greek page (/el/) ---------------- */

// Same security headers as the _headers file (that file only covers static files).
const SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.bunny.net; font-src https://fonts.bunny.net; img-src 'self' data:; connect-src 'self'; frame-src https://challenges.cloudflare.com; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'; upgrade-insecure-requests",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Cross-Origin-Opener-Policy': 'same-origin'
};

async function greekPage(env, url) {
  const base = await env.ASSETS.fetch(new Request(new URL('/', url)));
  if (!base.ok) return base;
  const el = I18N.el;
  const site = (env.SITE_URL || url.origin).replace(/\/$/, '');
  const pageUrl = site + '/el/';
  const setAttr = (name, value) => ({ element(e) { e.setAttribute(name, value); } });

  const out = new HTMLRewriter()
    .on('html', setAttr('lang', 'el'))
    .on('title', { element(e) { e.setInnerContent(el.title); } })
    .on('meta[name="description"]', setAttr('content', el['meta.desc']))
    .on('link[rel="canonical"]', setAttr('href', pageUrl))
    .on('meta[property="og:url"]', setAttr('content', pageUrl))
    .on('meta[property="og:title"]', setAttr('content', el.title))
    .on('meta[property="og:description"]', setAttr('content', el['meta.desc']))
    .on('meta[property="og:locale"]', setAttr('content', 'el_GR'))
    .on('meta[property="og:locale:alternate"]', setAttr('content', 'en_GB'))
    // All visible text in Greek, so search engines index it without running scripts.
    .on('[data-i18n]', { element(e) {
      const v = el[e.getAttribute('data-i18n')];
      if (v != null) e.setInnerContent(v, { html: true });
    } })
    .on('[data-i18n-ph]', { element(e) {
      const v = el[e.getAttribute('data-i18n-ph')];
      if (v != null) e.setAttribute('placeholder', v);
    } })
    .transform(base);

  const headers = new Headers(out.headers);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) headers.set(k, v);
  headers.set('Content-Language', 'el');
  headers.delete('ETag');
  return new Response(out.body, { status: 200, headers });
}

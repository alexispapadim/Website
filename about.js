/* ============================================================
   ABOUT PAGE: language, header and the scroll effects for his story.
   The text itself is in i18n.js (ab.*, j1–j12, jt.*, ap.*).
   ============================================================ */
import { I18N } from './i18n.js?v=52';
import { LEGAL_KEYS } from './details.js?v=52';
import * as CU from './curtain.js?v=52';

const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (RM) document.documentElement.classList.add('rm');

/* ---- language: / and /about are English, /el/ and /el/about/ are Greek ---- */
let lang = 'en';
const hdr = $('#hdr'), langBox = $('.lang');
const ind = document.createElement('span'); ind.className = 'lang-ind'; ind.style.transition = 'none'; langBox.prepend(ind);
function placeInd(){
  const b = $('.lang button[aria-pressed="true"]'); if (!b) return;
  ind.style.width = b.offsetWidth + 'px'; ind.style.transform = `translateX(${b.offsetLeft - 3}px)`;
}
function setLang(l){
  lang = I18N[l] ? l : 'en';
  const T = I18N[lang];
  document.documentElement.lang = lang;
  document.title = T['ap.title'];
  const md = $('meta[name="description"]'); if (md) md.setAttribute('content', T['ap.desc']);
  const path = lang === 'el' ? '/el/about/' : '/about';
  if (location.pathname !== path){
    const q = new URLSearchParams(location.search); q.delete('lang'); const qs = q.toString();
    try { history.replaceState(history.state, '', path + (qs ? '?' + qs : '') + location.hash); } catch (_) {}
  }
  $$('[data-i18n]').forEach(e => { const v = T[e.dataset.i18n]; if (v != null) e.innerHTML = v; });
  $$('[data-i18n-aria]').forEach(e => e.setAttribute('aria-label', T[e.dataset.i18nAria]));
  $$('[data-i18n-alt]').forEach(e => e.setAttribute('alt', T[e.dataset.i18nAlt]));
  $$('a[data-home]').forEach(a => a.setAttribute('href', (lang === 'el' ? '/el/' : '/') + a.dataset.home));
  $$('.lang button').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === lang));
  placeInd();
  try { localStorage.setItem('ap-lang', lang); } catch (e) {}
  legal.refresh();
  measure(); tick();
}
/* the same curtain as the home page: the language name morphs from one alphabet to the other */
const LNAME = { en: 'English', el: 'Ελληνικά' };
function switchLang(l){
  if (l === lang || CU.busy) return;
  $$('.lang button').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === l)); placeInd();
  const html = document.documentElement;
  CU.swap({ word: LNAME[lang], toWord: LNAME[l], from: LNAME[lang], to: LNAME[l], change: () => setLang(l),
    onLift: () => { html.classList.add('lang-in'); setTimeout(() => html.classList.remove('lang-in'), 700); } });
}
$$('.lang button').forEach(b => b.addEventListener('click', () => switchLang(b.dataset.lang)));

/* ---- links back to the home page close the curtain here, and the home page opens out of it;
        the legal pages open over this page and close back to the same spot ---- */
const T = k => I18N[lang][k];
const legal = CU.legalSheet({ lang: () => lang, here: () => T('tr.story'),
  words: () => ({ privacy: T('tr.privacy'), cookies: T('tr.cookies'), terms: T('tr.terms'), legal: T('tr.legal') }) });
const DEST = { '#contact': 'tr.dinner', '#occasions': 'tr.menus' };
document.addEventListener('click', e => {
  const a = e.target.closest('a[data-home]');
  if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  if (a.classList.contains('brand')){ if (!RM && !CU.busy){ e.preventDefault(); homecoming(a); } return; }
  const h = a.dataset.home, k = h.slice(1);
  if (LEGAL_KEYS.includes(k)){ e.preventDefault(); legal.open(k); return; }
  if (!(h in DEST)) return;
  e.preventDefault();
  CU.leaveTo(a.href, { word: T(DEST[h]), from: T('tr.story'), to: T(DEST[h]) });
});

/* ---- the AP logo: the same homecoming as on the home page. A cream circle blooms out of the logo and the
        monogram lifts out of the menu bar and grows to the centre; the home page opens under that cream
        (arrive.js + index.html .hc-in) and lands the monogram on its opening monogram (app.js homeArrival). ---- */
let homeBusy = false;
async function homecoming(link){
  if (homeBusy) return; homeBusy = true;
  const href = link.href;
  const pf = document.createElement('link'); pf.rel = 'prefetch'; pf.href = href; document.head.appendChild(pf);
  const from = link.getBoundingClientRect();
  const cx = from.left + Math.min(from.width, 44) / 2, cy = from.top + from.height / 2;
  const rad = Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy)) + 4;
  const wrapEl = document.createElement('div'); wrapEl.className = 'hc'; wrapEl.setAttribute('aria-hidden', 'true');
  const disc = document.createElement('i'); disc.className = 'hc-disc';
  const ring = document.createElement('i'); ring.className = 'hc-ring';
  for (const n of [disc, ring]) Object.assign(n.style, { width: rad * 2 + 'px', height: rad * 2 + 'px', left: (cx - rad) + 'px', top: (cy - rad) + 'px' });
  const fly = document.createElement('span'); fly.className = 'hc-ap'; fly.innerHTML = 'A<span>P</span>';
  wrapEl.append(disc, ring, fly); document.body.append(wrapEl);
  // drawn at the home page's opening size (#mono: clamp(78px,15vw,170px)) and scaled down, so it stays sharp
  const fs0 = parseFloat(getComputedStyle(link).fontSize) || 26;
  const tfs = Math.min(170, Math.max(78, innerWidth * .15)), k = tfs / fs0;
  Object.assign(fly.style, { fontSize: tfs + 'px', left: from.left + 'px', top: from.top + 'px', transformOrigin: '0 0' });
  const nat = fly.getBoundingClientRect(), w0 = nat.width / k, h0 = nat.height / k;
  const E1 = 'cubic-bezier(.7,0,.2,1)';
  const S0 = `translate3d(0,0,0) scale(${(1 / k).toFixed(5)})`;
  const MID = `translate3d(${(innerWidth / 2 - from.left - w0 * 1.8).toFixed(1)}px,${(innerHeight * .42 - from.top - h0 * 1.8).toFixed(1)}px,0) scale(${(3.6 / k).toFixed(5)})`;
  fly.style.transform = S0; link.style.visibility = 'hidden';
  disc.animate([{ transform: 'scale(0)' }, { transform: 'scale(1)' }], { duration: 820, easing: E1, fill: 'forwards' });
  ring.animate([{ transform: 'scale(0)', opacity: 1 }, { transform: 'scale(1.02)', opacity: 0 }], { duration: 1000, delay: 60, easing: E1, fill: 'forwards' });
  await fly.animate([{ transform: S0 }, { transform: MID }], { duration: 820, easing: E1, fill: 'forwards' }).finished;
  try { sessionStorage.setItem('ap-home', JSON.stringify({ t: Date.now() })); } catch (_) {}
  location.href = href;
  // back button into this page from the browser's memory: put it back as it was
  addEventListener('pageshow', ev => { if (ev.persisted){ wrapEl.remove(); link.style.visibility = ''; homeBusy = false; } }, { once: true });
}

/* ---- scroll effects: measured once per layout, each frame only writes transforms ---- */
const jyList = $('#jy'), jyLine = $('#jyl'), wm = $('#wm'), about = $('#about');
const phs = $$('[data-ph]').map(el => ({ el, img: el.querySelector('img') }));
const themed = $$('[data-theme]');
const docTop = el => el.getBoundingClientRect().top + scrollY;
const M = { vh: innerHeight, w: innerWidth, jy: null, about: null, themes: [] };
function measure(){
  M.vh = innerHeight; M.w = innerWidth;
  if (jyList) M.jy = { top: docTop(jyList), h: jyList.offsetHeight };
  if (about) M.about = { top: docTop(about) };
  phs.forEach(p => { p.top = docTop(p.el); p.h = p.el.offsetHeight; });
  M.themes = themed.map(s => { const t = docTop(s); return { top: t, bottom: t + s.offsetHeight, dark: s.dataset.theme === 'dark' }; });
}
const last = {};
const put = (key, el, prop, val) => { if (last[key] !== val){ last[key] = val; el.style[prop] = val; } };
function render(y){
  if (!RM){
    if (M.jy) put('jyl', jyLine, 'transform', `scaleY(${clamp((y + M.vh * .6 - M.jy.top) / M.jy.h).toFixed(4)})`);
    // the photo drifts inside its frame, and on desktop the frame trails the text a little
    phs.forEach((p, i) => { const t = clamp((y + M.vh - p.top) / (M.vh + p.h)) - .5;
      put('phi' + i, p.img, 'transform', `translate3d(0,${(t * -14).toFixed(2)}%,0)`);
      put('phf' + i, p.el, 'transform', M.w >= 1024 ? `translate3d(0,${(t * -56).toFixed(1)}px,0)` : 'none'); });
    if (wm && M.about) put('wm', wm, 'transform', `translate3d(0,calc(-50% + ${((M.about.top - y) * -.18).toFixed(1)}px),0)`);
  }
  let dark = false; const hy = y + 40;
  for (const s of M.themes){ if (s.top <= hy && s.bottom > hy){ dark = s.dark; break; } }
  hdr.classList.toggle('dark', dark);
  hdr.classList.toggle('scrolled', y > 40);
}
let queued = false;
function tick(){ if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; render(scrollY); }); }
addEventListener('scroll', tick, { passive: true });
let rzT = 0;
addEventListener('resize', () => { clearTimeout(rzT); rzT = setTimeout(() => { if (innerWidth !== M.w){ measure(); tick(); placeInd(); } }, 120); });
addEventListener('load', () => { measure(); tick(); });
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { measure(); tick(); });

/* ---- photos: a soft travelling light holds their place until they arrive, then they fade in ---- */
$$('.ph-frame img').forEach(im => {
  if (im.complete && im.naturalWidth) return;
  const f = im.closest('.ph-frame'), done = () => f.classList.remove('ld');
  f.classList.add('ld'); im.addEventListener('load', done); im.addEventListener('error', done);
});

/* ---- reveals start once the opening veil has lifted ---- */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .18, rootMargin: '0px 0px -6% 0px' });
const startReveals = () => $$('[data-reveal],[data-reveal-group],[data-ph],.jy-i').forEach(e => io.observe(e));

/* ---- init ---- */
let start = '';
try { start = new URLSearchParams(location.search).get('lang') || ''; } catch (e) {}
if (!start && location.pathname.startsWith('/el')) start = 'el';
if (!start){ try { start = localStorage.getItem('ap-lang') || ''; } catch (e) {} }
if (!start) start = (navigator.language || '').toLowerCase().startsWith('el') ? 'el' : 'en';
setLang(start);
{ const k = location.hash.slice(1); if (LEGAL_KEYS.includes(k)){ try { history.replaceState(null, '', location.pathname + location.search); } catch (_) {} legal.open(k); } }
requestAnimationFrame(() => { placeInd(); requestAnimationFrame(() => { ind.style.transition = ''; }); });
// the headline font, or a short wait: the page never opens in a stand-in face
const fontIn = Promise.race([document.fonts ? document.fonts.load('300 1em "Cormorant Garamond"') : 0, new Promise(r => setTimeout(r, 1500))]).catch(() => {});
// arriving from the home page through the curtain: it lifts once the font is in, and the reveals follow it;
// otherwise the opening veil lifts on its own and the reveals start just after
if (CU.arrival()){
  document.body.classList.add('loaded');
  fontIn.then(() => CU.wait(150)).then(() => CU.lift(() => setTimeout(startReveals, 250)));
} else {
  setTimeout(startReveals, RM ? 0 : 650);
  fontIn.then(() => requestAnimationFrame(() => document.body.classList.add('loaded')));
}

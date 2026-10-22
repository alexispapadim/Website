/* ============================================================
   ABOUT PAGE: language, header and the scroll effects for his story.
   The text itself is in i18n.js (ab.*, jy.*, j1–j12, jt.*, ap.*).
   ============================================================ */
import { I18N } from './i18n.js?v=39';

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
  measure(); tick();
}
let langBusy = false;
async function switchLang(l){
  if (l === lang || langBusy) return;
  if (RM){ setLang(l); return; }
  langBusy = true;
  const html = document.documentElement;
  $$('.lang button').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === l)); placeInd();
  html.classList.add('lang-out');
  await new Promise(r => setTimeout(r, 240));
  setLang(l);
  html.classList.remove('lang-out'); html.classList.add('lang-in');
  setTimeout(() => { html.classList.remove('lang-in'); langBusy = false; }, 700);
}
$$('.lang button').forEach(b => b.addEventListener('click', () => switchLang(b.dataset.lang)));

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

/* ---- reveals start once the opening veil has lifted ---- */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .18, rootMargin: '0px 0px -6% 0px' });
setTimeout(() => $$('[data-reveal],[data-reveal-group],[data-ph],.jy-i').forEach(e => io.observe(e)), RM ? 0 : 650);

/* ---- init ---- */
let start = '';
try { start = new URLSearchParams(location.search).get('lang') || ''; } catch (e) {}
if (!start && location.pathname.startsWith('/el')) start = 'el';
if (!start){ try { start = localStorage.getItem('ap-lang') || ''; } catch (e) {} }
if (!start) start = (navigator.language || '').toLowerCase().startsWith('el') ? 'el' : 'en';
setLang(start);
requestAnimationFrame(() => { document.body.classList.add('loaded'); placeInd(); requestAnimationFrame(() => { ind.style.transition = ''; }); });

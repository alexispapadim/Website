/* ============================================================
   THE CURTAIN: one liquid curtain for every big change on the site, shared by both pages.
   - the language switch (the name morphs from one alphabet to the other)
   - moving between pages (the About page's buttons back to the menus or the enquiry form)
   - opening and closing the legal pages, which return you to exactly where you were
   ============================================================ */
import { legalPages, LEGAL_KEYS } from './details.js?v=44';

const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const wait = ms => new Promise(r => setTimeout(r, ms));
const EASE_IO = 'cubic-bezier(.76,0,.24,1)', EASE_OUT = 'cubic-bezier(.16,1,.3,1)';
const GLYPHS = 'ΑΒΓΔΘΛΞΠΣΦΨΩαβγδεζηθλμξπσφψωAEGKMNRSWXZ';
const ARRIVE = 'ap-arrive';

const el = document.createElement('div'); el.id = 'lswap'; el.setAttribute('aria-hidden', 'true');
el.innerHTML = '<div class="ls-panel"><i class="ls-bulge ls-top"></i><i class="ls-bulge ls-bot"></i>' +
  '<div class="ls-inner"><span class="ls-ap">A<span>P</span></span><div class="ls-word"></div><i class="ls-rule"></i>' +
  '<div class="ls-sub"><b></b><em></em><b></b></div></div></div>';
document.body.appendChild(el);
const LS = { panel: el.querySelector('.ls-panel'), top: el.querySelector('.ls-top'), bot: el.querySelector('.ls-bot'),
  inner: el.querySelector('.ls-inner'), word: el.querySelector('.ls-word'), rule: el.querySelector('.ls-rule'),
  ap: el.querySelector('.ls-ap'), sub: el.querySelector('.ls-sub'), subs: [...el.querySelectorAll('.ls-sub b')] };

export let busy = false;
const setWord = w => { LS.word.textContent = w; LS.word.classList.toggle('long', w.length > 9); };

export function scramble(to, dur = 620){
  const from = LS.word.textContent;
  LS.word.classList.toggle('long', Math.max(from.length, to.length) > 9);
  return new Promise(res => {
    const L = Math.max(from.length, to.length), t0 = performance.now(); let lastSwap = 0, noise = [];
    const step = now => {
      const t = Math.min(1, (now - t0) / dur);
      if (now - lastSwap > 45){ lastSwap = now; noise = [...Array(L)].map(() => GLYPHS[(Math.random() * GLYPHS.length) | 0]); }
      let s = '';
      for (let i = 0; i < L; i++){ const r = t * (L + 5) - i; s += r >= 5 ? (to[i] || '') : r > 0 ? noise[i] : (from[i] || ''); }
      LS.word.textContent = s;
      if (t < 1) requestAnimationFrame(step); else { setWord(to); res(); }
    };
    requestAnimationFrame(step);
  });
}

function label(word, from, to){
  setWord(word);
  LS.subs[0].textContent = from; LS.subs[1].textContent = to;
  LS.subs[0].classList.remove('on'); LS.subs[1].classList.add('on');
}
const PARTS = () => [LS.panel, LS.top, LS.bot, LS.inner, LS.ap, LS.word, LS.rule, LS.sub];
function reset(){
  el.style.visibility = 'hidden';
  el.querySelectorAll('*').forEach(e => e.getAnimations().forEach(an => an.cancel()));
  PARTS().forEach(n => { n.style.transform = n.style.opacity = ''; });
  busy = false;
}

/* 1. the curtain sweeps up, its leading edge bulging then flattening like liquid */
export async function cover(word, from, to){
  busy = true; label(word, from, to);
  el.style.visibility = 'visible';
  const inA = LS.panel.animate([{ transform: 'translate3d(0,100%,0)' }, { transform: 'translate3d(0,0,0)' }], { duration: 700, easing: EASE_IO, fill: 'forwards' });
  LS.top.animate([{ transform: 'scaleY(1)' }, { transform: 'scaleY(1)', offset: .35 }, { transform: 'scaleY(0)' }], { duration: 700, easing: EASE_IO, fill: 'forwards' });
  LS.bot.animate([{ transform: 'scaleY(0)' }, { transform: 'scaleY(0)' }], { duration: 10, fill: 'forwards' });
  LS.ap.animate([{ opacity: 0, transform: 'translate3d(0,30px,0) scale(.9)' }, { opacity: 1, transform: 'none' }], { duration: 700, delay: 300, easing: EASE_OUT, fill: 'both' });
  LS.word.animate([{ opacity: 0, transform: 'translate3d(0,60px,0)', letterSpacing: '.3em' }, { opacity: 1, transform: 'none', letterSpacing: '.02em' }], { duration: 900, delay: 320, easing: EASE_OUT, fill: 'both' });
  LS.rule.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 900, delay: 450, easing: EASE_OUT, fill: 'both' });
  LS.sub.animate([{ opacity: 0, transform: 'translate3d(0,14px,0)' }, { opacity: 1, transform: 'none' }], { duration: 700, delay: 520, easing: EASE_OUT, fill: 'both' });
  await inA.finished;
}
/* already closed: used when a page opens straight into the curtain (arriving from the other page).
   Set as plain styles, not animations, so it is in place in the very frame the cover from arrive.js is removed. */
export function covered(word, from, to){
  busy = true; label(word, from, to);
  for (const n of [LS.panel, LS.ap, LS.word, LS.sub]){ n.style.transform = 'none'; n.style.opacity = '1'; }
  LS.top.style.transform = LS.bot.style.transform = 'scaleY(0)';
  LS.rule.style.transform = 'scaleX(1)';
  el.style.visibility = 'visible';
  document.documentElement.classList.add('curtain-in');
  document.documentElement.classList.remove('arriving');
}
/* 3. the curtain lifts away, its trailing edge curling. onLift runs first, while the page is still
      fully covered, so anything it hides to animate in is hidden before a single pixel shows through. */
export async function lift(onLift){
  if (onLift) onLift();
  const out = [
    LS.panel.animate([{ transform: 'translate3d(0,0,0)' }, { transform: 'translate3d(0,-100%,0)' }], { duration: 800, easing: EASE_IO, fill: 'forwards' }),
    LS.bot.animate([{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)', offset: .55 }, { transform: 'scaleY(.2)' }], { duration: 800, easing: EASE_IO, fill: 'forwards' }),
    LS.inner.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translate3d(0,-80px,0)' }], { duration: 520, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' })
  ];
  await out[0].finished;
  reset();
}
/* the whole move: cover, change the page underneath while the word morphs, lift */
export async function swap({ word, from, to, toWord, change, onLift }){
  if (busy) return;
  if (RM){ change && change(); return; }
  await cover(word, from, to);
  const y = scrollY; change && change(); if (Math.abs(scrollY - y) > 1) scrollTo(0, y);
  await wait(120);
  if (toWord && toWord !== word) await scramble(toWord);
  await wait(260);
  await lift(onLift);
}

/* ---- between pages: close the curtain here, and the next page opens out of it ---- */
export async function leaveTo(href, { word, from, to }){
  if (busy) return;
  if (RM){ location.href = href; return; }
  // start fetching the next page while the curtain closes (slow connections thank us)
  const pf = document.createElement('link'); pf.rel = 'prefetch'; pf.href = href; document.head.appendChild(pf);
  try { sessionStorage.setItem(ARRIVE, JSON.stringify({ word, from, to, t: Date.now() })); } catch (_) {}
  await cover(word, from, to);
  location.href = href;
}
/* on the page we arrive at: returns the curtain's words if we came through it (arrive.js already hid the page) */
export function arrival(){
  let a = null;
  try { a = JSON.parse(sessionStorage.getItem(ARRIVE) || 'null'); sessionStorage.removeItem(ARRIVE); } catch (_) {}
  if (!document.documentElement.classList.contains('arriving') || !a || Date.now() - a.t > 30000 || performance.now() > 7000){
    document.documentElement.classList.remove('arriving'); return null;
  }
  covered(a.word, a.from, a.to);
  return a;
}
// coming back with the browser's back button to a page that left through the curtain: open it again
addEventListener('pageshow', e => { if (e.persisted && busy) lift(); });

/* ---- legal pages: a sheet over the page, opened and closed through the curtain.
        The page underneath never moves, so closing lands you exactly where you were. ---- */
export function legalSheet({ lang, here, words }){
  const sheet = document.getElementById('sheet'), body = document.getElementById('sheet-body'), x = document.getElementById('sheet-x');
  const root = document.documentElement;
  let key = '', opener = null, y = 0;
  const fill = () => { body.innerHTML = legalPages(lang())[key]; };
  // the sheet has its own EN / ΕΛ pill (the page's language switch drives it); its gold marker follows the choice
  const pill = sheet.querySelector('.lang'), mark = pill && document.createElement('span');
  if (pill){ mark.className = 'lang-ind'; pill.prepend(mark); pill.addEventListener('click', () => placePill()); }
  function placePill(instant){
    const b = pill && pill.querySelector('button[aria-pressed="true"]'); if (!b || !b.offsetWidth) return;
    if (instant) mark.style.transition = 'none';
    mark.style.width = b.offsetWidth + 'px'; mark.style.transform = `translateX(${b.offsetLeft - 3}px)`;
    if (instant) requestAnimationFrame(() => requestAnimationFrame(() => { mark.style.transition = ''; }));
  }
  function show(k){
    key = k; fill();
    if (sheet.hidden){ opener = document.activeElement; y = scrollY; sheet.hidden = false; root.classList.add('locked'); }
    sheet.scrollTop = 0; placePill(true);
    x.focus({ preventScroll: true });
  }
  function hide(){
    sheet.hidden = true; sheet.classList.remove('quiet'); key = ''; root.classList.remove('locked');
    if (Math.abs(scrollY - y) > 1) scrollTo(0, y);
    if (opener && opener.focus) opener.focus({ preventScroll: true });
  }
  async function open(k, push = true){
    if (!LEGAL_KEYS.includes(k)) return;
    if (push) try { history.pushState({ legal: k }, '', '#' + k); } catch (_) {}
    if (!sheet.hidden || RM || busy){ show(k); return; }
    // the sheet's own fade-in stays off while it opens under the curtain (turning it back on would replay it)
    const w = words(); sheet.classList.add('quiet');
    await swap({ word: w[k], from: here(), to: w[k], change: () => show(k) });
  }
  async function close(fromPop = false){
    if (sheet.hidden) return;
    if (!fromPop) try { history.replaceState(null, '', location.pathname + location.search); } catch (_) {}
    if (RM || busy){ hide(); return; }
    const w = words()[key];
    await swap({ word: w, from: w, to: here(), toWord: here(), change: hide });
  }
  x.addEventListener('click', () => close());
  addEventListener('keydown', e => { if (e.key === 'Escape' && !sheet.hidden) close(); });
  addEventListener('popstate', () => { const k = location.hash.slice(1); if (LEGAL_KEYS.includes(k)) open(k, false); else close(true); });
  return { open, close, refresh(){ if (key){ fill(); placePill(); } }, get key(){ return key; } };
}

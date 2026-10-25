import { I18N } from './i18n.js?v=46';
import * as GAL from './gallery.js?v=46';
import * as SEA from './seasons.js?v=46';
import { CONFIG, LEGAL_KEYS } from './details.js?v=46';
import * as CU from './curtain.js?v=46';
const GALLERY=GAL.GALLERY||[], PRODUCE=GAL.PRODUCE||[];

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (RM) document.documentElement.classList.add('rm');
// a slow or data-saving connection (Chrome and Android tell us; other browsers count as fast)
const SLOW=(()=>{ try{ const c=navigator.connection; return !!c&&(!!c.saveData||/2g|3g/.test(c.effectiveType||'')); }catch(_){ return false; } })();
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const seg=(p,a,b)=>clamp((p-a)/(b-a));
const ease=t=>1-Math.pow(1-t,3);
const prog=el=>{const r=el.getBoundingClientRect(),t=el.offsetHeight-innerHeight;return t>0?clamp(-r.top/t):(r.top<0?1:0)};
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const IS_LOCAL=['localhost','127.0.0.1'].includes(location.hostname);
const PAGE_START=Date.now();

/* ---- olive branch, drawn in SVG (matches the card) ---- */
function branch(){
  const L=[[92,180,-70,.8],[88,168,55,.85],[82,156,-62,.9],[77,142,48,.9],[72,130,-55,.95],[67,116,40,.9],
           [63,104,-48,.95],[59,90,32,.85],[56,78,-40,.9],[52,64,25,.8],[50,54,-32,.8],[47,40,18,.7],[45,32,-25,.7],[42,14,-5,.65]];
  const leaf='M0 0C8-12 8-34 0-48C-8-34-8-12 0 0Z';
  let s='<svg viewBox="0 0 120 210" aria-hidden="true"><path class="stem" d="M104 204C74 160 54 104 42 12" fill="none" stroke="#4a5233" stroke-width="1.6" stroke-linecap="round"/>';
  s+='<path d="M86 184Q74 188 64 194" fill="none" stroke="#4a5233" stroke-width="1.2"/>';
  L.forEach(([x,y,r,k],i)=>{s+=`<g transform="translate(${x} ${y}) rotate(${r}) scale(${k})"><path class="lf" style="--i:${i}" d="${leaf}" fill="url(#lg)"/></g>`});
  s+=`<ellipse class="lf" style="--i:14" cx="62" cy="196" rx="8" ry="6" transform="rotate(-18 62 196)" fill="url(#og)"/>`;
  s+=`<ellipse class="lf" style="--i:15" cx="74" cy="198" rx="7.5" ry="5.6" transform="rotate(12 74 198)" fill="url(#og)"/>`;
  return s+'</svg>';
}
$$('.olive').forEach(e=>e.innerHTML=branch());

/* ---- contact links ---- */
$('#lnk-tel').href='tel:'+CONFIG.phone; $('#tel-txt').textContent=CONFIG.phoneDisplay;
$('#lnk-wa').href='https://wa.me/'+CONFIG.whatsapp.replace(/\D/g,'');
$('#lnk-mail').href='mailto:'+CONFIG.email; $('#mail-txt').textContent=CONFIG.email;

/* legal pages open over the page through the curtain, and close back to the same spot (curtain.js) */
const legal=CU.legalSheet({ lang:()=>lang, here:()=>I18N[lang]['tr.home'],
  words:()=>{ const T=I18N[lang]; return {privacy:T['tr.privacy'],cookies:T['tr.cookies'],terms:T['tr.terms'],legal:T['tr.legal']}; } });
const sheet=$('#sheet');

/* ---- language ---- */
let lang='en';
let words=[], wGen=0;
function buildStatement(){
  const tmp=document.createElement('div'); tmp.innerHTML=I18N[lang]['st.text'];
  const out=[];
  tmp.childNodes.forEach(n=>{
    const em=n.nodeType===1;
    n.textContent.split(/\s+/).filter(Boolean).forEach(w=>out.push(em?`<em class="w">${esc(w)}</em>`:`<span class="w">${esc(w)}</span>`));
  });
  $('#stmt').innerHTML=out.join(' ');
  words=$$('#stmt .w'); wGen++;
  $('#tap').classList.remove('gone');
}
function setLang(l){
  lang=I18N[l]?l:'en';
  document.documentElement.lang=lang;
  document.title=I18N[lang].title;
  const md=document.querySelector('meta[name="description"]'); if(md) md.setAttribute('content',I18N[lang]['meta.desc']);
  // Keep the address bar in step with the language: / (English) or /el/ (Greek)
  if(location.pathname==='/'||location.pathname==='/el/'){
    const path=lang==='el'?'/el/':'/';
    if(location.pathname!==path){
      const q=new URLSearchParams(location.search); q.delete('lang'); const qs=q.toString();
      try{history.replaceState(history.state,'',path+(qs?'?'+qs:'')+location.hash)}catch(_){}
    }
  }
  $$('[data-i18n]').forEach(e=>{const v=I18N[lang][e.dataset.i18n]; if(v!=null) e.innerHTML=v});
  $$('[data-i18n-ph]').forEach(e=>e.placeholder=I18N[lang][e.dataset.i18nPh]);
  $$('[data-i18n-aria]').forEach(e=>e.setAttribute('aria-label',I18N[lang][e.dataset.i18nAria]));
  $$('[data-i18n-alt]').forEach(e=>e.setAttribute('alt',I18N[lang][e.dataset.i18nAlt]));
  $$('a[data-about]').forEach(a=>a.setAttribute('href',lang==='el'?'/el/about/':'/about'));
  if(typeof renderGallery==='function') renderGallery();
  if(typeof langExtras==='function') langExtras();
  $$('.lang button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.lang===lang));
  if(typeof placeInd==='function') placeInd();
  buildStatement(); setStatus('','');
  legal.refresh();
  if(tsWidget!==null) renderTurnstile();
  try{localStorage.setItem('ap-lang',lang)}catch(e){}
  layout(); tick();
}
const langBox=$('.lang');
const ind=document.createElement('span'); ind.className='lang-ind'; ind.style.transition='none'; langBox.prepend(ind);
function placeInd(){
  const b=$('.lang button[aria-pressed="true"]'); if(!b) return;
  ind.style.width=b.offsetWidth+'px'; ind.style.transform=`translateX(${b.offsetLeft-3}px)`;
}
/* ---- language switch: the curtain sweeps up, the language name morphs letter by letter
        from one alphabet to the other, then the curtain lifts away and the new text cascades in ---- */
const LNAME={en:'English',el:'Ελληνικά'};
const EASE_OUT='cubic-bezier(.16,1,.3,1)', wait=CU.wait;
function cascadeIn(base=0){
  // Only animate text that is actually visible right now, and only up to its current opacity —
  // so things the scroll scenes are keeping hidden (e.g. the hero tagline) never flash.
  const effOpacity=el=>{ let o=1; for(let n=el;n&&n.nodeType===1;n=n.parentElement){ const cs=getComputedStyle(n);
      if(cs.visibility==='hidden'||cs.display==='none') return 0; o*=parseFloat(cs.opacity); if(o<.05) return 0; } return o; };
  const coveredByHeroDisc=el=>{ if(!el.closest('#hero')) return false; return M.hero&&pin(M.hero,scrollY)<.8; };
  const vis=[];
  for(const el of $$('main [data-i18n], header [data-i18n], #stmt')){
    if(vis.length>=26) break;
    const r=el.getBoundingClientRect();
    if(!r.width||r.bottom<=0||r.top>=innerHeight) continue;
    if(coveredByHeroDisc(el)) continue;
    const eo=effOpacity(el); if(eo<.6) continue;
    vis.push({el,o:parseFloat(getComputedStyle(el).opacity)||1});
  }
  vis.sort((a,b)=>a.el.getBoundingClientRect().top-b.el.getBoundingClientRect().top);
  // hide them straight away with a plain style: a new animation can take a frame or two to apply,
  // and with the curtain already lifting that would let the old text show for a moment
  vis.forEach(({el,o},i)=>{ const prev=el.style.opacity; el.style.opacity='0';
    const an=el.animate(
      [{opacity:0,transform:'translate3d(0,34px,0)',filter:'blur(8px)'},{opacity:o,transform:'none',filter:'blur(0)'}],
      {duration:850,delay:base+120+i*55,easing:EASE_OUT,fill:'backwards'});
    an.ready.then(()=>{ if(el.style.opacity==='0') el.style.opacity=prev; }); });
}
function switchLang(l){
  if(l===lang||CU.busy) return;
  $$('.lang button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.lang===l)); placeInd();
  CU.swap({word:LNAME[lang],toWord:LNAME[l],from:LNAME[lang],to:LNAME[l],change:()=>setLang(l),onLift:()=>cascadeIn(230)});
}
$$('.lang button').forEach(b=>b.addEventListener('click',()=>switchLang(b.dataset.lang)));

/* ===================== chef scene (pinned, layered) =====================
   Layers inside the box: outline word · gold line · arch with studio backdrop · filled word · cut-out of Alexis.
   As you scroll: the scene rises in, he lifts up and breaks out over the top of the arch while the arch
   settles back, his name glides through the scene behind him, then the caption draws in.            */
const C={sec:$('#chef'), box:$('#cbox')};
if(C.box){
  C.arch=C.box.querySelector('.c-arch'); C.archImg=C.arch.querySelector('img');
  C.cut=C.box.querySelector('.c-cut img'); C.line=C.box.querySelector('.c-line');
  C.front=C.box.querySelector('.c-word-front');
  C.words=[...C.box.querySelectorAll('.c-word span')];
  C.cap=$('.c-cap'); C.rules=$$('.c-rule'); C.badge=C.box.querySelector('.c-badge');
}
function renderChef(y){
  if(!C.box||!M.chef) return;
  const bh=M.bh||600;
  const enter=easeOutQ(clamp((y+M.vh-M.chef.top)/M.vh));      // section rising into view
  const p=pin(M.chef,y);                                        // progress while pinned
  const lift=easeIO(seg(p,.04,.62));                            // he rises out of the arch
  const grow=easeOutQ(seg(p,0,.32)), settle=easeIO(seg(p,.42,.86));
  // whole scene entrance
  put('cbT',C.box,'transform',`translate3d(0,${((1-enter)*70).toFixed(1)}px,0)`);
  put('cbO',C.box,'opacity',seg(enter,.15,.7).toFixed(3));
  // arch: grows in, then quietly recedes as he steps forward
  const as=(.9+.1*grow-.06*settle).toFixed(4);
  put('caT',C.arch,'transform',`scale(${as})`);
  put('cfT',C.front,'transform',`scale(${as})`);
  put('caI',C.archImg,'transform',`translate3d(0,${((p-.5)*-bh*.06).toFixed(1)}px,0) scale(1.08)`);
  // Alexis: starts low inside the arch, lifts and breaks out over the top
  const ty=((1-lift)*bh*.24+(1-enter)*bh*.06).toFixed(1), sc=(.94+.1*lift).toFixed(4);
  put('ccT',C.cut,'transform',`translate3d(0,${ty}px,0) scale(${sc})`);
  // his name glides through the scene, behind him
  const wx=((.5-p)*bh*1.5).toFixed(1), wo=(seg(p,.1,.3)*(1-.5*seg(p,.92,1))).toFixed(3);
  C.words.forEach((s,i)=>{ put('cwT'+i,s,'transform',`translate3d(calc(-50% + ${wx}px),-50%,0)`); put('cwO'+i,s,'opacity',wo); });
  // gold outline drifts out from behind the arch
  const lo=seg(p,.3,.58), le=easeOutQ(lo);
  put('clT',C.line,'transform',`translate3d(${(le*bh*.028).toFixed(1)}px,${(le*bh*.028).toFixed(1)}px,0) scale(${as})`);
  put('clO',C.line,'opacity',(lo*.85).toFixed(3));
  // caption
  const cp=easeOutQ(seg(p,.62,.82));
  put('ccpO',C.cap,'opacity',cp.toFixed(3));
  put('ccpT',C.cap,'transform',`translate3d(0,${((1-cp)*12).toFixed(1)}px,0)`);
  const rs=easeOutQ(seg(p,.68,.9)).toFixed(4); C.rules.forEach((r,i)=>put('crT'+i,r,'transform',`scaleX(${rs})`));
  // the seal to his story rolls onto the arch once he has stepped out, settling with a soft overshoot
  if(C.badge){ const bp=seg(p,.38,.6), bs=bp<1?.6+.4*(1-Math.pow(1-bp,3))*(1+.14*Math.sin(bp*Math.PI)):1;
    put('cbgO',C.badge,'opacity',seg(bp,0,.5).toFixed(3));
    put('cbgT',C.badge,'transform',`scale(${bs.toFixed(4)}) rotate(${((1-bp)*-60).toFixed(1)}deg)`);
    if(C.badge.classList.contains('in')!==bp>=1) C.badge.classList.toggle('in',bp>=1); }
}
const easeOutQ=t=>1-Math.pow(1-t,3);

/* ---- scroll scenes ----
   Performance rules (this is what keeps it smooth on phones):
   - section positions are measured once (on load / width change), never during scroll
   - each frame only reads scrollY and writes transforms/opacity (GPU-friendly)
   - the iPhone address bar showing/hiding does NOT trigger a re-layout            */
const hero=$('#hero'), mono=$('#mono'), back=$('#back'), hint=$('#hint'), rules=$$('.rule'), names=$$('.back .n');
(()=>{ const st=document.createElement('style'); st.textContent=`
  #back{background:transparent!important;clip-path:none!important;overflow:hidden}
  #back>*:not(#disc){position:relative}
  #disc{position:absolute;left:50%;top:52%;border-radius:50%;background:radial-gradient(circle at 50% 45%,#353c2b,#20251a 55%);transform:scale(0);will-change:transform;pointer-events:none;backface-visibility:hidden}
  .big .w{transition:color .5s ease,text-shadow .7s ease}
  .big .w.on{transition:opacity .35s ease,color .5s ease,text-shadow .7s ease}
  html:not(.rm) #hw{overflow:hidden;touch-action:pan-y;-webkit-user-select:none;user-select:none}
  #track{will-change:transform;backface-visibility:hidden}
  .rm #disc{transform:none}
  /* the pass: contact-sheet gallery */
  #kitchen{background:radial-gradient(ellipse at 50% 0%,#2a3022 0%,#1a1e15 55%,#14170f 100%)!important;color:var(--cream)}
  :is(#kitchen,#produce) .kitchen-head{margin-bottom:clamp(36px,6vh,64px)}
  #produce{background:linear-gradient(180deg,var(--cream-2,#e9e1d4),var(--paper,#f1ebe1))}
  #produce .g-hint{color:var(--leaf)}
  #produce .gallery.csheet{box-shadow:inset 0 0 0 1px rgba(214,182,121,.16),inset 0 1px 0 rgba(255,255,255,.04),0 50px 90px -46px rgba(32,37,26,.75)}
  #kitchen h2{color:var(--cream)}
  #kitchen .g-hint{color:rgba(214,182,121,.7)}
  .gallery.csheet{columns:auto!important;display:flex!important;flex-wrap:wrap;justify-content:center;align-items:flex-start;--n:2;--cg:clamp(12px,2.4vw,30px);gap:clamp(18px,3vw,34px) var(--cg);
    max-width:1120px;margin:0 auto;padding:clamp(16px,3vw,36px);position:relative;border-radius:6px;
    background:
      repeating-linear-gradient(90deg,rgba(255,255,255,.012) 0 1px,transparent 1px 3px),
      repeating-linear-gradient(0deg,rgba(0,0,0,.05) 0 1px,transparent 1px 4px),
      linear-gradient(160deg,#20251a,#171a12);
    box-shadow:inset 0 0 0 1px rgba(214,182,121,.16),inset 0 1px 0 rgba(255,255,255,.04),0 40px 80px -40px rgba(0,0,0,.6)}
  @media(min-width:900px){.gallery.csheet{--n:3}}
  .sh-item{margin:0!important;min-width:0;will-change:opacity;flex:0 0 auto;width:calc((100% - (var(--n) - 1) * var(--cg)) / var(--n))}
  .sh-frame{all:unset;display:block;width:100%;aspect-ratio:4/5;position:relative;overflow:hidden;border-radius:2px;cursor:zoom-in;background:#0d0f0a;
    box-shadow:0 0 0 1px rgba(236,228,216,.07),0 22px 40px -26px rgba(0,0,0,.85);-webkit-mask-image:-webkit-radial-gradient(white,black)}
  .sh-frame:focus-visible{outline:2px solid #d6b679;outline-offset:4px}
  .sh-frame img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;will-change:transform}
  .sh-bw{filter:grayscale(1) contrast(.92) brightness(.5) sepia(.18)}
  /* still loading (slow connection): a soft band of warm light drifts across the empty frame, then the photo fades in */
  .sh-frame img{transition:opacity .9s ease}
  .sh-frame.ld img{opacity:0}
  .sh-frame::before,.vw-slide.ld img{background:linear-gradient(100deg,transparent 35%,rgba(214,182,121,.09) 50%,transparent 65%) 0 0/300% 100% no-repeat,#12140e}
  .sh-frame::before{content:"";position:absolute;inset:0;opacity:0;transition:opacity .6s ease}
  .sh-frame.ld::before{opacity:1;animation:shLight 1.9s cubic-bezier(.45,0,.55,1) infinite}
  .vw-slide.ld img{animation:shLight 1.9s cubic-bezier(.45,0,.55,1) infinite}
  @keyframes shLight{from{background-position:100% 0,0 0}to{background-position:0 0,0 0}}
  .rm .sh-frame.ld::before,.rm .vw-slide.ld img{animation:none}
  .sh-col{clip-path:inset(0 0 100% 0);will-change:transform,clip-path}
  .rm .sh-col{clip-path:none}
  .sh-lamp{position:absolute;left:-10%;right:-10%;top:-12%;height:24%;pointer-events:none;opacity:0;will-change:transform,opacity;
    background:radial-gradient(ellipse 60% 50% at 50% 50%,rgba(255,226,170,.55),rgba(255,200,120,.18) 45%,transparent 72%);
    box-shadow:0 0 0 0 transparent}
  .sh-lamp::after{content:"";position:absolute;left:10%;right:10%;top:50%;height:1px;background:linear-gradient(90deg,transparent,rgba(255,232,190,.9),transparent)}
  .sh-corners{position:absolute;inset:8px;pointer-events:none;
    background:
      linear-gradient(#d6b679,#d6b679) top left/12px 1px no-repeat,linear-gradient(#d6b679,#d6b679) top left/1px 12px no-repeat,
      linear-gradient(#d6b679,#d6b679) top right/12px 1px no-repeat,linear-gradient(#d6b679,#d6b679) top right/1px 12px no-repeat,
      linear-gradient(#d6b679,#d6b679) bottom left/12px 1px no-repeat,linear-gradient(#d6b679,#d6b679) bottom left/1px 12px no-repeat,
      linear-gradient(#d6b679,#d6b679) bottom right/12px 1px no-repeat,linear-gradient(#d6b679,#d6b679) bottom right/1px 12px no-repeat;opacity:.75}
  @media(hover:hover){.sh-frame:hover .sh-corners{opacity:1}}
  .sh-item figcaption{margin-top:12px;display:grid;gap:2px;opacity:0;pointer-events:none;position:static!important;background:none!important;padding:0!important}
  .sh-meta{display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px solid rgba(214,182,121,.22);padding-bottom:6px;margin-bottom:6px}
  .sh-no{font:500 9.5px var(--sans);letter-spacing:.24em;color:rgba(214,182,121,.7)}
  .sh-item .g-n{font:italic 400 16px var(--serif);color:#d6b679}
  .sh-item .g-t{font:400 clamp(19px,2.2vw,24px)/1.15 var(--serif);color:#f4eee5}
  .sh-item .g-p{font:500 9.5px var(--sans);letter-spacing:.18em;text-transform:uppercase;color:rgba(236,228,216,.55);line-height:1.7}
  .rm .sh-item figcaption{opacity:1}
  /* full-screen viewer */
  .vw{position:fixed;inset:0;z-index:120;display:flex;flex-direction:column;align-items:center;justify-content:center;touch-action:none;
    padding:max(64px,calc(env(safe-area-inset-top) + 56px)) 0 max(18px,env(safe-area-inset-bottom))}
  .vw-bg{position:absolute;inset:0;background:#14170f;opacity:0}
  .vw-stage{position:relative;width:100%;flex:1;min-height:0;max-height:820px}
  .vw-slide{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;will-change:transform,opacity;padding:0 16px}
  .vw-slide img{max-width:min(100%,900px);max-height:100%;object-fit:contain;border-radius:6px;box-shadow:0 30px 80px -30px rgba(0,0,0,.7);-webkit-user-drag:none;user-select:none}
  .vw-ui{position:relative;display:grid;justify-items:center;gap:16px;margin-top:18px;opacity:0;padding:0 16px;text-align:center;max-width:100%}
  .vw-cap{display:grid;gap:2px}
  .vw-cap .g-t{color:#f4eee5;font-size:clamp(22px,3vw,30px)}.vw-cap .g-p{color:rgba(236,228,216,.6)}
  .vw-thumbs{display:flex;gap:8px;overflow-x:auto;max-width:min(92vw,620px);padding:5px 4px;scrollbar-width:none}
  .vw-thumbs::-webkit-scrollbar{display:none}
  .vw-thumbs button{all:unset;cursor:pointer;width:42px;height:52px;border-radius:4px;overflow:hidden;opacity:.4;flex:none;transition:opacity .35s ease,transform .35s cubic-bezier(.16,1,.3,1),box-shadow .35s ease}
  .vw-thumbs button.on{opacity:1;transform:translateY(-3px);box-shadow:0 0 0 1px #d6b679}
  .vw-thumbs button:focus-visible{outline:1px solid #d6b679;outline-offset:2px}
  .vw-thumbs img{width:100%;height:100%;object-fit:cover}
  .vw-btn{position:absolute;z-index:3;width:46px;height:46px;border-radius:50%;border:1px solid rgba(214,182,121,.5);background:rgba(32,37,26,.55);color:#d6b679;cursor:pointer;display:grid;place-items:center;font-size:16px;opacity:0}
  .vw-btn:focus-visible{outline:2px solid #d6b679;outline-offset:2px}
  .vw-x{top:max(12px,calc(env(safe-area-inset-top) + 8px));right:14px}
  .vw-prev{left:16px;top:45%}.vw-next{right:16px;top:45%}
  @media(max-width:700px){.vw-prev,.vw-next{display:none}}
  .vw-count{position:absolute;top:max(26px,calc(env(safe-area-inset-top) + 22px));left:20px;font:500 11px var(--sans);letter-spacing:.25em;color:rgba(236,228,216,.6);opacity:0}
  /* gallery — masonry columns that drift at different speeds */
  .gallery{columns:auto!important;display:flex;gap:14px;align-items:flex-start}
  @media(min-width:900px){.gallery{gap:22px}}
  .g-col{flex:1;min-width:0;will-change:transform}
  .g-col:nth-child(2){margin-top:56px}
  .g-col:nth-child(3){margin-top:22px}
  html:not(.rm) .g-item{opacity:0;transform:none;transition:none}
  .g-item{will-change:transform,opacity}
  .g-item img{will-change:transform;transform-origin:50% 60%}
  html:not(.rm) .g-item:hover img{transform:none}
  .g-item figcaption{transition:none}
  /* lightbox: photo flies out of the grid */
  .lightbox{background:transparent!important;animation:none!important}
  .lightbox::before{content:"";position:absolute;inset:0;background:rgba(14,16,11,.96);opacity:0;transition:opacity .45s ease}
  .lightbox.open::before{opacity:1}
  .lightbox>*{position:relative}
  .lightbox .lb-x,.lightbox .lb-nav,.lightbox .lb-count,.lightbox figcaption{opacity:0;transition:opacity .35s ease .15s}
  .lightbox.open .lb-x,.lightbox.open .lb-nav,.lightbox.open .lb-count,.lightbox.open figcaption{opacity:1}
  .lightbox .lb-x,.lightbox .lb-nav,.lightbox .lb-count{position:absolute}`; document.head.appendChild(st); })();
let disc=$('#disc');
if(!disc){ disc=document.createElement('div'); disc.id='disc'; disc.className='disc'; back.prepend(disc); }
const stmt=$('#statement'), occ=$('#occasions'), hw=$('#hw'), track=$('#track'), bar=$('#bar');
const steps=$('#steps'), pline=$('#pline'), wm=$('#wm'), about=$('#about'), hdr=$('#hdr');
const themed=$$('[data-theme]');
const docTop=el=>el.getBoundingClientRect().top+scrollY;
const probe=document.createElement('div');
probe.style.cssText='position:fixed;top:0;left:-9999px;width:1px;height:100vh;height:100svh;pointer-events:none;visibility:hidden';
document.body.appendChild(probe);

const M={vh:innerHeight,w:0,hero:{},stmt:{},occ:{},steps:{},about:{},themes:[]};
let hDist=0, cardStep=1;
function measure(){
  M.vh=probe.offsetHeight||innerHeight; M.w=innerWidth;
  if(typeof layoutDeck==='function') layoutDeck();
  const d=Math.ceil(Math.hypot(innerWidth,M.vh*1.04)*1.02);
  disc.style.width=disc.style.height=d+'px'; disc.style.margin=`${-d/2}px 0 0 ${-d/2}px`;
  hDist=Math.max(0,track.scrollWidth-hw.clientWidth);
  const c=track.children[0]; cardStep=c?c.offsetWidth+parseFloat(getComputedStyle(track).columnGap||0):1;
  if(!RM) occ.style.height=Math.round(M.vh+hDist*1.15)+'px'; else occ.style.height='auto';
  const box=el=>{const t=docTop(el);return{top:t,h:el.offsetHeight,span:Math.max(1,el.offsetHeight-M.vh)}};
  if(typeof measureSeasons==='function') measureSeasons();
  M.hero=box(hero); M.stmt=box(stmt); M.occ=box(occ); M.steps=box(steps); M.about=box(about);
  M.themes=themed.map(s=>{const b=box(s);return{top:b.top,bottom:b.top+b.h,dark:s.dataset.theme==='dark',hero:s===hero}});
  if(C.sec){ M.chef=box(C.sec); M.bh=C.box.offsetHeight; }
  M.gal=null;
  if(kitchen&&!kitchen.hidden&&D.on){ M.gal=box(kitchen); }
  else if(GI.length){
    M.gal={items:GI.map(it=>(it.gone||it.el.hidden)?null:({top:docTop(it.el),h:it.el.offsetHeight}))};
  }
}
const layout=measure;
const pin=(b,y)=>clamp((y-b.top)/b.span);

/* ---- horizontal cards ----
   Card position = page-scroll part + swipe part. You can swipe/drag them whenever they're on
   screen, and scrolling the page still glides them through the pinned section. */
let curLeft=0, off=0, offAnim=0, cardSnapT=0;
const baseLeft=y=>pin(M.occ,y)*hDist;
function setCards(left,raw){
  curLeft=clamp(left,0,hDist);
  track.style.transform=`translate3d(${-(raw??curLeft)}px,0,0)`;
  if(typeof renderSeasons==='function') renderSeasons();
  bar.style.transform=`scaleX(${hDist?curLeft/hDist:0})`;
}
function applyCards(y){ const b=baseLeft(y); off=clamp(off,-b,hDist-b); setCards(b+off); }
function animOff(target,dur=560){
  cancelAnimationFrame(offAnim);
  const from=off, t0=performance.now();
  const step=now=>{ const t=clamp((now-t0)/dur); off=from+(target-from)*easeOut(t); applyCards(sy);
    offAnim=t<1?requestAnimationFrame(step):0; if(!offAnim) bakeOff(); };
  offAnim=requestAnimationFrame(step);
}
/* After a swipe settles while the section is pinned, move the page's scroll position to the point
   that shows the same card, and clear the swipe offset. The cards don't move, but from then on
   scrolling carries on smoothly from where you swiped to (no tug-of-war between the two). */
function bakeOff(){
  return;   // (retired: moving the page scroll under the user's finger caused jumps)
  if(RM||!off||sw||!hDist) return;
  const y=scrollY, b=M.occ; if(y<b.top-2||y>b.top+b.span+2) return;
  const ny=Math.round(b.top+clamp(curLeft/hDist)*b.span);
  if(Math.abs(ny-y)<1){ off=0; return; }
  stopAnim(); off=0; sy=ny; scrollTo(0,ny); applyCards(ny); tick();
}
const snapLeft=left=>clamp(Math.round(left/cardStep)*cardStep,0,hDist);
let sw=null, lastDragEnd=0;
hw.addEventListener('pointerdown',e=>{
  if(RM||(e.pointerType==='mouse'&&e.button!==0)) return;
  cancelAnimationFrame(offAnim); offAnim=0;
  sw={id:e.pointerId,x:e.clientX,y:e.clientY,mode:'',start:curLeft,lx:e.clientX,lt:performance.now(),v:0};
});
hw.addEventListener('pointermove',e=>{
  if(!sw||e.pointerId!==sw.id) return;
  const dx=e.clientX-sw.x, dy=e.clientY-sw.y;
  if(!sw.mode){
    if(Math.abs(dx)<7&&Math.abs(dy)<7) return;
    sw.mode=Math.abs(dx)>Math.abs(dy)*1.1?'h':'v';
    if(sw.mode==='h'){ try{hw.setPointerCapture(e.pointerId)}catch(_){} hw.classList.add('drag'); sw.x=e.clientX; sw.start=curLeft; }
  }
  if(sw.mode!=='h') return;
  const now=performance.now(), dt=Math.max(1,now-sw.lt);
  sw.v=.75*((e.clientX-sw.lx)/dt)+.25*sw.v; sw.lx=e.clientX; sw.lt=now;
  let raw=sw.start-(e.clientX-sw.x);
  if(raw<0) raw*=.35; else if(raw>hDist) raw=hDist+(raw-hDist)*.35;   // soft edges
  off=clamp(raw,0,hDist)-baseLeft(sy);
  setCards(raw,raw);
});
function endSwipe(e){
  if(!sw||(e&&e.pointerId!==sw.id)) return;
  const was=sw; sw=null; hw.classList.remove('drag');
  if(was.mode!=='h') return;
  lastDragEnd=performance.now();
  const target=snapLeft(curLeft-was.v*280);       // fling, then settle on a card
  animOff(target-baseLeft(sy));
}
hw.addEventListener('pointerup',endSwipe); hw.addEventListener('pointercancel',endSwipe);
hw.addEventListener('wheel',e=>{
  if(RM||Math.abs(e.deltaX)<=Math.abs(e.deltaY)) return;
  e.preventDefault(); cancelAnimationFrame(offAnim); offAnim=0;
  off=clamp(curLeft+e.deltaX,0,hDist)-baseLeft(sy); applyCards(sy);
  clearTimeout(cardSnapT); cardSnapT=setTimeout(()=>animOff(snapLeft(curLeft)-baseLeft(sy),420),140);
},{passive:false});
function stepCards(dir){
  const target=clamp(Math.round(curLeft/cardStep+dir)*cardStep,0,hDist);
  if(RM){hw.scrollTo({left:target,behavior:'smooth'});return}
  animOff(target-baseLeft(sy),620);
}
$('#prev').addEventListener('click',()=>stepCards(-1));
$('#next').addEventListener('click',()=>stepCards(1));

/* ---- snappy animated scrolling for nav links ---- */
let anim=0;
function stopAnim(){if(anim){cancelAnimationFrame(anim);anim=0}}
const easeIO=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
const easeOut=t=>1-Math.pow(1-t,4);
function animScroll(to,dur,done,fn=easeIO){
  stopAnim();
  to=clamp(to,0,document.documentElement.scrollHeight-M.vh);
  if(RM){scrollTo(0,to);done&&done();return}
  const from=scrollY, d=to-from, t0=performance.now();
  if(Math.abs(d)<1){done&&done();return}
  dur=dur||Math.min(950,Math.max(600,Math.abs(d)*.6));
  const step=now=>{const t=clamp((now-t0)/dur);scrollTo(0,from+d*fn(t));if(t<1)anim=requestAnimationFrame(step);else{anim=0;done&&done()}};
  anim=requestAnimationFrame(step);
}
addEventListener('wheel',stopAnim,{passive:true});
addEventListener('touchstart',e=>{if(!(e.target instanceof Node)||!hw.contains(e.target))stopAnim()},{passive:true});
addEventListener('keydown',stopAnim);

// Only accept simple, known-safe fragment ids (never pass URL text to querySelector).
function elForHash(h){ return /^#[A-Za-z][\w-]{0,40}$/.test(h||'') ? document.getElementById(h.slice(1)) : null; }
const veil=document.createElement('div');
veil.id='veil'; veil.setAttribute('aria-hidden','true');
veil.innerHTML='<div class="veil-in"><span class="veil-ap">A<span>P</span></span><i></i></div>';
document.body.appendChild(veil);
let navBusy=false;
function goTo(hash,instant){
  const el=hash==='#top'?null:elForHash(hash);
  if(hash!=='#top'&&!el) return;
  const y=Math.min(el?docTop(el):0, document.documentElement.scrollHeight-M.vh);
  const after=()=>{if(hash==='#contact'){loadTurnstile();const f=$('#form');f.classList.remove('arrive');void f.offsetWidth;f.classList.add('arrive');$$('#contact [data-reveal],#contact [data-reveal-group]').forEach(e=>e.classList.add('in'))}};
  if(instant||RM){scrollTo(0,y);tick();after();return}
  if(Math.abs(y-scrollY)<M.vh*1.3){ animScroll(y,0,after); return; }   // short hop: gentle glide
  // Long jump: fade to the brand colour, move while hidden, then reveal — calm instead of racing past every section.
  if(navBusy) return; navBusy=true; stopAnim();
  veil.classList.add('on');
  setTimeout(()=>{
    scrollTo(0,y); tick();
    setTimeout(()=>{ veil.classList.remove('on'); setTimeout(after,180); navBusy=false; },260);
  },520);
}
/* ---- logo click: "homecoming" ----
   A cream circle blooms out of the logo and fills the screen; the AP monogram lifts out of the
   menu bar, grows and flies to the centre; behind the cream we return to the top; the monogram
   lands exactly on the opening monogram, the olive branch regrows and the cream melts away.   */
let homeBusy=false;
async function homecoming(link){
  if(homeBusy||navBusy) return;
  if(RM||scrollY<8){ goTo('#top'); return; }
  homeBusy=true; stopAnim();
  const from=link.getBoundingClientRect();
  const cx=from.left+Math.min(from.width,44)/2, cy=from.top+from.height/2;
  const rad=Math.hypot(Math.max(cx,innerWidth-cx),Math.max(cy,innerHeight-cy))+4;
  const wrapEl=document.createElement('div'); wrapEl.className='hc'; wrapEl.setAttribute('aria-hidden','true');
  const disc=document.createElement('i'); disc.className='hc-disc';
  Object.assign(disc.style,{width:rad*2+'px',height:rad*2+'px',left:(cx-rad)+'px',top:(cy-rad)+'px'});
  const ring=document.createElement('i'); ring.className='hc-ring';
  Object.assign(ring.style,{width:rad*2+'px',height:rad*2+'px',left:(cx-rad)+'px',top:(cy-rad)+'px'});
  const fly=document.createElement('span'); fly.className='hc-ap'; fly.innerHTML='A<span>P</span>';
  wrapEl.append(disc,ring,fly); document.body.append(wrapEl);
  // The flying monogram is drawn at its final (large) size and scaled DOWN to start, so the text is
  // rendered sharp at every moment instead of being a small bitmap stretched up.
  const fs0=parseFloat(getComputedStyle(link).fontSize)||26;
  const target=document.querySelector('#mono .ap')||document.querySelector('#mono');
  const tfs=parseFloat(getComputedStyle(target).fontSize)||120;
  const k=tfs/fs0;
  fly.style.fontSize=tfs+'px'; fly.style.left=from.left+'px'; fly.style.top=from.top+'px';
  fly.style.transformOrigin='0 0';
  const nat=fly.getBoundingClientRect(), w0=nat.width/k, h0=nat.height/k;   // size at menu-bar scale
  const E1='cubic-bezier(.7,0,.2,1)', E2='cubic-bezier(.16,1,.3,1)';
  const S0=`translate3d(0,0,0) scale(${(1/k).toFixed(5)})`;
  const MID=`translate3d(${(innerWidth/2-from.left-w0*1.8).toFixed(1)}px,${(innerHeight*.42-from.top-h0*1.8).toFixed(1)}px,0) scale(${(3.6/k).toFixed(5)})`;
  fly.style.transform=S0;
  link.style.visibility='hidden';
  disc.animate([{transform:'scale(0)'},{transform:'scale(1)'}],{duration:820,easing:E1,fill:'forwards'});
  ring.animate([{transform:'scale(0)',opacity:1},{transform:'scale(1.02)',opacity:.0}],{duration:1000,delay:60,easing:E1,fill:'forwards'});
  // phase 1: lift and grow towards the centre
  const mid=fly.animate([{transform:S0},{transform:MID}],{duration:820,easing:E1,fill:'forwards'});
  await mid.finished;
  // behind the cream: back to the top, restart the opening monogram
  scrollTo(0,0); sy=0; tick();
  document.body.classList.remove('loaded'); void document.body.offsetWidth;
  await wait(40);
  const t=target.getBoundingClientRect();
  // phase 2: land on the opening monogram (scale 1 = exactly its size)
  const land=fly.animate([{transform:MID},
    {transform:`translate3d(${(t.left-from.left).toFixed(1)}px,${(t.bottom-nat.height-from.top).toFixed(1)}px,0) scale(1)`}],
    {duration:760,easing:E2,fill:'forwards'});
  setTimeout(()=>document.body.classList.add('loaded'),260);    // olive branch regrows, letters rise
  await wait(380);
  disc.animate([{opacity:1},{opacity:0}],{duration:700,easing:'ease',fill:'forwards'});
  await land.finished;
  fly.animate([{opacity:1},{opacity:0}],{duration:500,easing:'ease',fill:'forwards'});
  link.style.visibility='';
  try{history.replaceState(null,'',location.pathname+location.search)}catch(_){}
  await wait(520);
  wrapEl.remove(); homeBusy=false;
}
// His story lives on its own page: the curtain closes over this page, and the About page opens out of it
document.addEventListener('click',e=>{
  const a=e.target.closest('a[data-about]'); if(!a||RM||e.defaultPrevented||e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey) return;
  e.preventDefault(); const T=I18N[lang]; CU.leaveTo(a.href,{word:T['tr.story'],from:T['tr.home'],to:T['tr.story']});
});
addEventListener('pageshow',e=>{ if(e.persisted) veil.classList.remove('on'); });
document.addEventListener('click',e=>{
  const a=e.target.closest('a[href^="#"]'); if(!a)return;
  const h=a.getAttribute('href'), key=h.slice(1);
  if(LEGAL_KEYS.includes(key)){ e.preventDefault(); legal.open(key, sheet.hidden); return; }
  if(h.length<2)return;
  e.preventDefault(); if(!sheet.hidden) legal.close();
  if(h==='#top'&&a.classList.contains('brand')) homecoming(a); else goTo(h);
  try{history.replaceState(null,'',h==='#top'?location.pathname+location.search:h)}catch(_){}
});

/* ---- statement: tap to light up (temporary, so the scroll effect keeps working) ---- */
let lightTimer=0;
$('#stmt').addEventListener('click',e=>{
  const w=e.target.closest('.w'), idx=w?words.indexOf(w):0, set=words;
  $('#tap').classList.add('gone');
  clearTimeout(lightTimer);
  set.forEach((el,i)=>setTimeout(()=>{
    if(words!==set) return;
    el.classList.add('on','flash');
    setTimeout(()=>el.classList.remove('flash'),i===idx?900:420);
  },Math.abs(i-idx)*32));
  const span=Math.max(idx,set.length-1-idx)*32;
  lightTimer=setTimeout(()=>set.forEach((el,i)=>setTimeout(()=>el.classList.remove('on'),Math.abs(i-idx)*24)),span+2600);
});

/* ---- one frame: read scrollY, write styles ---- */
const last={};
const put=(key,el,prop,val)=>{ if(last[key]!==val){ last[key]=val; el.style[prop]=val; } };
function render(y,realY){
  const p=RM?1:pin(M.hero,y);
  if(!RM){
    const z=ease(seg(p,0,.55));
    put('mono',mono,'transform',`scale(${(1+z*1.6).toFixed(4)})`);
    put('monoO',mono,'opacity',(1-seg(p,.18,.45)).toFixed(3));
    const rs=`scaleX(${(1-ease(seg(p,0,.28))).toFixed(4)})`; rules.forEach((r,i)=>put('rule'+i,r,'transform',rs));
    put('disc',disc,'transform',`scale(${ease(seg(p,.12,.58)).toFixed(4)})`);
    names.forEach((n,i)=>{const t=ease(seg(p,.45+i*.06,.7+i*.06));put('nO'+i,n,'opacity',t.toFixed(3));put('nT'+i,n,'transform',`translate3d(0,${((1-t)*48).toFixed(1)}px,0)`)});
    put('hint',hint,'opacity',(1-seg(p,0,.06)).toFixed(3));
  }
  const lit=(RM?1:seg(pin(M.stmt,y),.08,.82))*words.length;
  for(let i=0;i<words.length;i++) put('w'+wGen+'_'+i,words[i],'opacity',(.14+.86*clamp(lit-i)).toFixed(3));
  if(!RM&&!(sw&&sw.mode==='h')) applyCards(y);
  if(!RM){
    put('pline',pline,'transform',`scaleY(${clamp((y+M.vh*.62-M.steps.top)/M.steps.h).toFixed(4)})`);
    put('wm',wm,'transform',`translate3d(0,calc(-50% + ${((M.about.top-y)*-.18).toFixed(1)}px),0)`);
  }
  let dark=false; const hy=realY+40;
  for(const s of M.themes){ if(s.top<=hy&&s.bottom>hy){ dark=s.hero?p>.42:s.dark; break; } }
  hdr.classList.toggle('dark',dark);
  hdr.classList.toggle('scrolled',realY>M.vh*.9);
  if(!RM) renderChef(y);
  if(!RM) renderGallery3D(y);
}

/* Smoothing: animations glide towards the scroll position instead of copying it.
   iPhone Safari reports scroll positions unevenly, which made direct mapping look steppy. */
let sy=scrollY, loop=0, lastT=0;
function frame(t){
  const dt=lastT?Math.min(64,t-lastT):16.7; lastT=t;
  const ty=scrollY, k=1-Math.pow(1-.3,dt/16.7), prev=sy;
  sy+=(ty-sy)*k; if(Math.abs(ty-sy)<.35) sy=ty;
  // While the section is pinned, page scrolling gradually hands the cards back to the scroll.
  // outside the pinned stretch a leftover swipe offset eases out gently as you scroll
  if(off&&!sw&&!offAnim&&!(sy>M.occ.top-2&&sy<M.occ.top+M.occ.span+2)) off*=Math.exp(-Math.abs(sy-prev)/600);
  render(sy,ty);
  if(sy!==ty) loop=requestAnimationFrame(frame); else { loop=0; lastT=0; }
}
function tick(){ sy=scrollY; render(sy,sy); }          // instant sync (load, resize, language)
addEventListener('scroll',()=>{ if(!loop) loop=requestAnimationFrame(frame); },{passive:true});
/* plate stack: when scrolling stops mid-way, glide to the nearest plate (or the final fan) */
let snapT=0, touching=false;
addEventListener('touchstart',()=>{touching=true; clearTimeout(snapT);},{passive:true});
addEventListener('touchend',()=>{touching=false; queueSnap(180);},{passive:true});
addEventListener('scroll',()=>queueSnap(170),{passive:true});
function queueSnap(ms){ clearTimeout(snapT); snapT=setTimeout(deckSnap,ms); }
function deckSnap(){
  return; // gallery is no longer pinned
  if(RM||!D.on||!M.gal||touching||anim||sw||navBusy) return;
  const y=scrollY, top=M.gal.top, span=M.gal.span;
  if(y<=top+2||y>=top+span-2) return;
  const N=PHOTOS.length, T=deckPhases(N).T;
  const pts=[]; for(let k=0;k<N;k++) pts.push(Math.min(1,k/T)); pts.push(1);
  const p=(y-top)/span; let best=pts[0];
  for(const q of pts) if(Math.abs(q-p)<Math.abs(best-p)) best=q;
  const ty=top+best*span;
  if(Math.abs(ty-y)<3) return;
  animScroll(ty,Math.min(700,Math.max(380,Math.abs(ty-y)*.9)),null,easeOut);
}
// Re-measure only when the width really changes (rotation, desktop resize) — not when
// the mobile address bar slides in/out, which is what caused the jumping.
let rzT=0;
addEventListener('resize',()=>{clearTimeout(rzT);rzT=setTimeout(()=>{
  if(innerWidth!==M.w||Math.abs((probe.offsetHeight||innerHeight)-M.vh)>120){measure();tick()}
},120)});
addEventListener('load',()=>{measure();tick()});

const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.18,rootMargin:'0px 0px -6% 0px'});
$$('[data-reveal],[data-reveal-group],[data-ph]').forEach(e=>io.observe(e));

/* ===================== form ===================== */
const form=$('#form'), status=$('#status'), send=$('#send');
let busy=false;

/* Cloudflare Turnstile — loaded only when the form comes near the screen */
let tsLoaded=false, tsWidget=null, tsToken='';
const TS_TEST_KEY='1x00000000000000000000AA';
const siteKey=()=>/^REPLACE/.test(CONFIG.turnstileSiteKey)?TS_TEST_KEY:CONFIG.turnstileSiteKey;
function loadTurnstile(){
  if(tsLoaded) return; tsLoaded=true;
  window.onTurnstileReady=renderTurnstile;
  const s=document.createElement('script');
  s.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileReady';
  s.async=true; s.defer=true;
  document.head.appendChild(s);
}
function renderTurnstile(){
  if(!window.turnstile) return;
  if(tsWidget!==null){ try{window.turnstile.remove(tsWidget)}catch(_){} }
  tsToken='';
  tsWidget=window.turnstile.render('#ts',{
    sitekey:siteKey(), action:'enquiry', theme:'light', size:'flexible', language:lang==='el'?'el':'en',
    callback:t=>{tsToken=t}, 'expired-callback':()=>{tsToken=''}, 'error-callback':()=>{tsToken=''}
  });
}
new IntersectionObserver((es,o)=>{if(es.some(e=>e.isIntersecting)){loadTurnstile();o.disconnect()}},{rootMargin:'900px 0px'}).observe($('#contact'));
form.addEventListener('focusin',loadTurnstile,{once:true});

function setStatus(kind,key,withMail){
  status.className='status'+(kind?' '+kind:'');
  status.textContent=key?I18N[lang][key]:'';
  if(withMail){
    const a=document.createElement('a'); a.href='mailto:'+CONFIG.email; a.textContent=CONFIG.email;
    status.append(' ',a);
  }
}
function markBad(fields){
  $$('#form .f.bad').forEach(f=>f.classList.remove('bad'));
  const map={name:'f-name',email:'f-email',phone:'f-phone',event_date:'f-date',guests:'f-guests',location:'f-loc',occasion:'f-occ',message:'f-msg'};
  (fields||[]).forEach(k=>{const el=map[k]&&document.getElementById(map[k]); if(el) el.closest('.f').classList.add('bad')});
  const first=$('#form .f.bad input:not([type=hidden]), #form .f.bad .dp-btn, #form .f.bad .cs-btn, #form .f.bad textarea'); if(first) first.focus();
}
const EMAIL_RE=/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+(?:[A-Za-z]{2,63}|xn--[A-Za-z0-9-]{1,59})$/;

form.addEventListener('submit',async e=>{
  e.preventDefault();
  if(busy) return;
  const v=n=>(form.elements[n]?form.elements[n].value:'').trim();
  const data={
    name:v('name'), email:v('email'), phone:PHONE?PHONE.value():v('phone'), event_date:v('event_date'),
    guests:v('guests')===''?'':Number(v('guests')), location:v('location'), occasion:v('occasion'),
    message:v('message'), lang, website:v('website'), t:Date.now()-PAGE_START
  };
  const bad=[];
  if(data.name.length<2) bad.push('name');
  if(!EMAIL_RE.test(data.email)) bad.push('email');
  if(data.phone && (!/^[+0-9 ()./-]{5,32}$/.test(data.phone) || (PHONE&&!PHONE.valid()))) bad.push('phone');
  if(data.guests!=='' && !(Number.isInteger(data.guests)&&data.guests>=1&&data.guests<=1000)) bad.push('guests');
  if(bad.length){ markBad(bad); setStatus('err','s.req'); return; }
  markBad([]);

  data.token=tsToken || (IS_LOCAL?'dev-pass':'');
  if(!data.token){ loadTurnstile(); setStatus('err','s.captcha'); return; }

  busy=true; send.disabled=true; setStatus('','s.sending');
  try{
    const res=await fetch(CONFIG.api,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),credentials:'same-origin',cache:'no-store'});
    const j=await res.json().catch(()=>({}));
    if(res.ok&&j.ok){
      form.reset(); setStatus('ok','s.ok');
      busy=true; setTimeout(()=>{busy=false;send.disabled=false},15000);
      return;
    }
    if(j.error==='invalid'){ markBad(j.fields); setStatus('err','s.req'); }
    else if(j.error==='captcha') setStatus('err','s.captcha');
    else if(j.error==='rate') setStatus('err','s.rate');
    else setStatus('err','s.err',true);
  }catch(_){
    setStatus('err','s.err',true);
  }finally{
    if(window.turnstile&&tsWidget!==null){ try{window.turnstile.reset(tsWidget)}catch(_){} }
    tsToken='';
    if(!status.classList.contains('ok')){ busy=false; send.disabled=false; }
  }
});


/* ===================== food gallery ===================== */
const kitchen=$('#kitchen'), galleryEl=$('#gallery'), lb=$('#lightbox'), lbImg=$('#lb-img'), lbCap=$('#lb-cap'), lbCount=$('#lb-count');
const okPhotos=list=>(Array.isArray(list)?list:[]).filter(g=>g&&typeof g.file==='string'&&/^[\w.\- ]+\.(jpe?g|png|webp|avif)$/i.test(g.file));
const PHOTOS=okPhotos(GALLERY);
const SETS=[{sec:$('#produce'),el:$('#produce-gallery'),photos:okPhotos(typeof PRODUCE==='undefined'?[]:PRODUCE),items:[]},
            {sec:kitchen,el:galleryEl,photos:PHOTOS,items:[]}].filter(s=>s.sec&&s.el);
const capOf=g=>String((lang==='el'?g.el:g.en)||g.en||'');
const srcOf=g=>'/'+encodeURIComponent(g.file);
/* phone-sized copy of a photo (sm/<name>.webp, made by tools/small-photos.py). The grid and the
   viewer's thumbnails use it, which is about three times lighter on a slow connection; a photo
   without one simply falls back to the full file. */
const smOf=g=>'/sm/'+encodeURIComponent(g.file.replace(/\.[^.]+$/,''))+'.webp';
function smallImg(im,g,onFail){ im.src=smOf(g);
  im.addEventListener('error',()=>{ if(im.src.includes('/sm/')){ im.src=srcOf(g); if(onFail) im.addEventListener('error',onFail,{once:true}); } else if(onFail) onFail(); },{once:true}); }
/* a frame shows a soft travelling light until its photo has arrived, then the photo fades in */
function whenLoaded(im,box){ if(im.complete&&im.naturalWidth) return; box.classList.add('ld');
  const done=()=>box.classList.remove('ld'); im.addEventListener('load',done); im.addEventListener('error',done); }
let GI=[], galCols=0, galT=0;

/* ===================== food gallery: the drifting grid =====================
   Every dish at once in staggered columns (2 on phones, 3 on wider screens). As you scroll, the
   columns drift at slightly different speeds and each dish rises into place while its photo eases
   out of a soft zoom. Tap any dish to open the full-screen gallery.                              */
const D={on:false};                                   // (old pinned scenes are retired)
function layoutDeck(){} function renderDeck(){} function deckPhases(){return {T:1};}
function splitDish(t){ const k=t.indexOf(','); return k<0?{title:t,parts:''}:{title:t.slice(0,k).trim(),parts:t.slice(k+1).split(',').map(s=>s.trim()).filter(Boolean).join(' · ')}; }
const ROMAN=['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX','XXI','XXII','XXIII','XXIV','XXV','XXVI','XXVII','XXVIII','XXIX','XXX'];
const numOf=i=>ROMAN[i]||String(i+1);
const colCount=()=>innerWidth>=900?3:2;
/* ===================== food gallery: the pass (contact-sheet style) =====================
   Dishes laid out like a photographer's contact sheet on dark slate, each frame labelled like a
   course on a tasting menu. As you scroll, a warm band of light (the pass lamps) sweeps down each
   frame and the dish develops from a dim black-and-white print into full colour.                */
function renderMasonry(){
  const n=colCount(); galCols=n;
  GI=[];
  SETS.forEach(set=>{
    set.el.textContent=''; set.items=[];
    set.el.className='gallery csheet';
    // each frame is a few hundred pixels wide, so the phone-sized copies are sharp enough unless the screen is large
    const small=((set.el.clientWidth||innerWidth)/n)*Math.min(2,devicePixelRatio||1)<=720;
    set.photos.forEach((g,li)=>{
      const fig=document.createElement('figure'); fig.className='sh-item';
      const btn=document.createElement('button'); btn.type='button'; btn.className='sh-frame';
      const bw=document.createElement('img'); bw.className='sh-bw'; bw.alt=''; bw.decoding='async'; bw.loading='lazy';
      const img=document.createElement('img'); img.className='sh-col'; img.alt=capOf(g); img.decoding='async'; img.loading='lazy';
      const gone=()=>{ console.warn('Gallery photo not found:',g.file); it.gone=true; fig.remove(); clearTimeout(galT); galT=setTimeout(()=>{measure();tick();},80); };
      if(small){ smallImg(bw,g); smallImg(img,g,gone); } else { bw.src=img.src=srcOf(g); img.addEventListener('error',gone,{once:true}); }
      whenLoaded(img,btn);
      if(g.pos) bw.style.objectPosition=img.style.objectPosition=g.pos;
      const lamp=document.createElement('i'); lamp.className='sh-lamp';
      const corners=document.createElement('i'); corners.className='sh-corners';
      const it={el:fig,btn,img,bw,lamp,cap:null,g,i:li,set,gone:false};
      btn.append(bw,img,lamp,corners); btn.setAttribute('aria-label',capOf(g)||('Photo '+(li+1)));
      btn.addEventListener('click',()=>openViewer(set,set.items.filter(x=>!x.gone).indexOf(it),img));
      const cap=document.createElement('figcaption'); it.cap=cap;
      cap.innerHTML='<div class="sh-meta"><span class="sh-no"></span><span class="g-n"></span></div><span class="g-t"></span><span class="g-p"></span>';
      fig.append(btn,cap); set.el.append(fig);
      set.items.push(it); GI.push(it);
    });
    // "Show all" — the first three rows show; the rest open on request
    const mb=document.createElement('div'); mb.className='g-more';
    mb.innerHTML='<button type="button" aria-expanded="false"><span></span><i aria-hidden="true"></i></button>';
    set.el.append(mb); set.more=mb; set.moreBtn=mb.querySelector('button');
    if(set.collapsed===undefined) set.collapsed=true;
    set.moreBtn.addEventListener('click',()=>toggleMore(set));
    applyLimit(set);
  });
  fillGalleryText();
  for(const k in last) if(k.startsWith('g')) delete last[k];
  if(RM) GI.forEach(it=>{ it.img.style.clipPath='none'; it.cap.style.opacity=1; it.el.style.opacity=1; });
}
function galLimit(){ return colCount()*3; }
function applyLimit(set){
  const live=set.items.filter(it=>!it.gone), lim=galLimit(), need=live.length>lim+1;
  live.forEach((it,k)=>{ it.el.hidden=need&&set.collapsed&&k>=lim; });
  if(set.more){ set.more.hidden=!need; set.moreBtn.setAttribute('aria-expanded',String(!set.collapsed));
    set.moreBtn.querySelector('span').textContent=set.collapsed?tr('g.more',{n:live.length}):tr('g.less'); }
}
function toggleMore(set){
  const btn=set.moreBtn, before=btn.getBoundingClientRect().top;
  set.collapsed=!set.collapsed; applyLimit(set);
  if(set.collapsed){ const after=btn.getBoundingClientRect().top; scrollTo(0,scrollY+after-before); }   // keep the button where it was
  else if(!RM){ const lim=galLimit(); set.items.filter(it=>!it.gone).slice(lim,lim+3).forEach((it,k)=>it.el.animate([{opacity:0,transform:'translate3d(0,24px,0)'},{opacity:1,transform:'none'}],{duration:700,delay:k*70,easing:'cubic-bezier(.16,1,.3,1)'})); }
  for(const k in last) if(k.startsWith('g')) delete last[k];
  measure(); tick();
}
function fillGalleryText(){
  SETS.forEach(s=>{ if(s.more) applyLimit(s); });
  GI.forEach(it=>{ const d=splitDish(capOf(it.g));
    it.cap.querySelector('.sh-no').textContent='Nº '+String(it.i+1).padStart(2,'0');
    it.cap.querySelector('.g-n').textContent=numOf(it.i);
    it.cap.querySelector('.g-t').textContent=d.title;
    it.cap.querySelector('.g-p').textContent=d.parts;
    it.img.alt=capOf(it.g); it.btn.setAttribute('aria-label',capOf(it.g)); });
}
function renderGallery(){
  if(!SETS.length) return;
  SETS.forEach(s=>{ s.sec.hidden=!s.photos.length; });
  if(!GI.length) renderMasonry(); else fillGalleryText();
}
addEventListener('resize',()=>{ if(GI.length&&colCount()!==galCols){ galCols=colCount(); SETS.forEach(s=>s.more&&applyLimit(s)); measure(); tick(); } });
function renderGallery3D(y){
  if(!M.gal||!M.gal.items) return;
  const vh=M.vh;
  GI.forEach((it,i)=>{
    const b=M.gal.items[i]; if(!b||it.gone) return;
    const t=clamp((y+vh-b.top)/(vh*.6));                     // 0 entering … 1 fully developed
    const e=easeOutQ(seg(t,.12,1));
    put('gm'+i,it.img,'clipPath',e>=.999?'none':`inset(0 0 ${((1-e)*100).toFixed(2)}% 0)`);
    const sc=(1.08-.08*e).toFixed(4);
    put('gi'+i,it.img,'transform',`scale(${sc})`); put('gb'+i,it.bw,'transform',`scale(${sc})`);
    put('gl'+i,it.lamp,'opacity',(Math.sin(Math.PI*Math.min(1,e*1.02))*.95).toFixed(3));
    put('gl2'+i,it.lamp,'transform',`translate3d(0,${(e*100/.24).toFixed(1)}%,0)`);
    put('go'+i,it.el,'opacity',(.35+.65*seg(t,0,.3)).toFixed(3));
    put('gk'+i,it.cap,'opacity',seg(t,.45,.95).toFixed(3));
    put('gt'+i,it.cap,'transform',`translate3d(0,${((1-seg(t,.45,.95))*10).toFixed(1)}px,0)`);
  });
}

/* ===================== full-screen gallery viewer =====================
   The tapped photo flies out of the grid to full screen. Swipe (the photo follows your finger),
   use the arrows or tap the small photos along the bottom. Closing flies it back into the grid. */
let viewer=null;
function openLightbox(i){ const s=SETS.find(x=>x.el===galleryEl)||SETS[0]; if(s) openViewer(s,i,s.items[i]&&s.items[i].img); }
function openViewer(set,i,fromImg){
  const live=set.items.filter(it=>!it.gone), P=live.map(it=>it.g);
  if(viewer||!P.length) return; if(i<0) i=0;
  const N=P.length, E1='cubic-bezier(.2,.8,.2,1)';
  const v=document.createElement('div'); v.className='vw'; v.setAttribute('role','dialog'); v.setAttribute('aria-modal','true');
  const closeL=I18N[lang]['lg.close']||'Close';
  v.innerHTML=`<div class="vw-bg"></div><div class="vw-count"></div><button type="button" class="vw-btn vw-x" aria-label="${esc(closeL)}">✕</button>
    <button type="button" class="vw-btn vw-prev" aria-label="Previous">←</button><button type="button" class="vw-btn vw-next" aria-label="Next">→</button>
    <div class="vw-stage"></div><div class="vw-ui"><div class="vw-cap"><span class="g-n"></span><span class="g-t"></span><span class="g-p"></span></div><div class="vw-thumbs"></div></div>`;
  document.body.append(v); document.documentElement.classList.add('locked');
  const stage=v.querySelector('.vw-stage'), bg=v.querySelector('.vw-bg'), ui=v.querySelector('.vw-ui'), cnt=v.querySelector('.vw-count');
  const capN=v.querySelector('.vw-cap .g-n'), capT=v.querySelector('.vw-cap .g-t'), capP=v.querySelector('.vw-cap .g-p');
  const btns=[...v.querySelectorAll('.vw-btn')], thumbs=v.querySelector('.vw-thumbs');
  /* photos load only as you reach them: the light copy first (usually already on screen in the grid),
     then the full photo swaps in once it has arrived */
  const slides=P.map(g=>{ const s=document.createElement('div'); s.className='vw-slide';
    const im=document.createElement('img'); im.alt=capOf(g); im.decoding='async'; s.append(im); stage.append(s); return s; });
  const want=k=>{ const s=slides[k]; if(!s||s._want) return; s._want=1; const im=s.firstChild, g=P[k];
    smallImg(im,g); whenLoaded(im,s);
    const full=new Image(); full.src=srcOf(g); (full.decode?full.decode():Promise.reject()).then(()=>{ im.src=full.src; s.classList.remove('ld'); },()=>{}); };
  const fitImgs=()=>{ const mw=Math.min(stage.clientWidth-32,900), mh=stage.clientHeight;
    slides.forEach((s,k)=>{ const g=P[k], im=s.firstChild; if(!(g.w&&g.h)||!mw||!mh) return; const sc=Math.min(mw/g.w,mh/g.h);
      im.style.width=Math.round(g.w*sc)+'px'; im.style.height=Math.round(g.h*sc)+'px'; }); };
  const th=P.map((g,k)=>{ const b=document.createElement('button'); b.type='button'; b.setAttribute('aria-label',capOf(g));
    const im=document.createElement('img'); im.alt=''; im.loading='lazy'; smallImg(im,g); b.append(im); b.onclick=()=>go(k); thumbs.append(b); return b; });
  let cur=i, W=stage.clientWidth, drag=0, capI=-1;
  const place=anim=>slides.forEach((s,k)=>{ if(Math.abs(k-cur)<=1) want(k); const off=(k-cur)*W*1.04+drag, d=Math.min(1,Math.abs(off)/W);
    s.style.transition=anim?'transform .65s cubic-bezier(.16,1,.3,1),opacity .65s ease':'none';
    s.style.transform=`translate3d(${off.toFixed(1)}px,0,0) scale(${(1-.12*d).toFixed(4)})`;
    s.style.opacity=(1-.65*d).toFixed(3); s.style.visibility=(Math.abs(k-cur)<=1||anim)?'visible':'hidden'; });
  const setCapV=()=>{ if(capI===cur) return; const first=capI<0; capI=cur; const d=splitDish(capOf(P[cur]));
    capN.textContent=numOf(cur); capT.textContent=d.title; capP.textContent=d.parts;
    if(!first&&!RM) [capN,capT,capP].forEach((el,k)=>el.animate([{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'none'}],{duration:600,delay:k*60,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'})); };
  const update=anim=>{ place(anim); setCapV(); cnt.textContent=`${cur+1} / ${N}`;
    th.forEach((b,k)=>b.classList.toggle('on',k===cur)); try{ th[cur].scrollIntoView({inline:'center',block:'nearest',behavior:'smooth'}); }catch(_){} };
  const go=k=>{ cur=clamp(k,0,N-1); drag=0; update(!RM); };
  update(false); fitImgs();              // sized once the caption is in, so the photo never changes size as it sharpens
  viewer={close};
  const target=slides[cur].querySelector('img');
  const flyIn=()=>{
    bg.animate([{opacity:0},{opacity:1}],{duration:RM?1:480,fill:'forwards'});
    [ui,cnt,...btns].forEach(el=>el.animate([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'none'}],{duration:RM?1:480,delay:RM?0:260,easing:'cubic-bezier(.16,1,.3,1)',fill:'forwards'}));
    if(RM||!fromImg) return;
    const a=fromImg.getBoundingClientRect(), b=target.getBoundingClientRect(); if(!a.width||!b.width) return;
    target.animate([{transform:`translate(${a.left+a.width/2-(b.left+b.width/2)}px,${a.top+a.height/2-(b.top+b.height/2)}px) scale(${a.width/b.width},${a.height/b.height})`},{transform:'none'}],{duration:640,easing:E1});
  };
  (target.complete&&target.naturalWidth)?flyIn():target.addEventListener('load',flyIn,{once:true});
  function close(){
    if(!viewer) return; viewer=null;
    const img=slides[cur].querySelector('img'), back=live[cur]&&live[cur].img, b=img.getBoundingClientRect();
    [ui,cnt,...btns].forEach(el=>el.animate([{opacity:1},{opacity:0}],{duration:180,fill:'forwards'}));
    bg.animate([{opacity:1},{opacity:0}],{duration:RM?1:440,fill:'forwards'});
    const a=back&&back.getBoundingClientRect();
    if(!RM&&a&&a.width&&a.bottom>0&&a.top<innerHeight)
      img.animate([{transform:'none'},{transform:`translate(${a.left+a.width/2-(b.left+b.width/2)}px,${a.top+a.height/2-(b.top+b.height/2)}px) scale(${a.width/b.width},${a.height/b.height})`}],{duration:500,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'});
    else img.animate([{opacity:1},{opacity:0}],{duration:RM?1:280,fill:'forwards'});
    setTimeout(()=>{ v.remove(); document.documentElement.classList.remove('locked'); removeEventListener('keydown',key); removeEventListener('resize',rs);
      if(back) back.closest('button').focus({preventScroll:true}); },RM?20:510);
  }
  v.querySelector('.vw-x').onclick=close;
  v.querySelector('.vw-prev').onclick=()=>go(cur-1); v.querySelector('.vw-next').onclick=()=>go(cur+1);
  bg.onclick=close;
  function key(e){ if(e.key==='Escape') close(); else if(e.key==='ArrowRight') go(cur+1); else if(e.key==='ArrowLeft') go(cur-1); }
  function rs(){ W=stage.clientWidth; fitImgs(); place(false); }
  addEventListener('keydown',key); addEventListener('resize',rs);
  let sx=null, sy0=0, t0=0;
  stage.addEventListener('pointerdown',e=>{ sx=e.clientX; sy0=e.clientY; t0=performance.now(); try{stage.setPointerCapture(e.pointerId)}catch(_){} });
  stage.addEventListener('pointermove',e=>{ if(sx===null) return; drag=e.clientX-sx; if((cur===0&&drag>0)||(cur===N-1&&drag<0)) drag*=.35; place(false); });
  const up=e=>{ if(sx===null) return; const dx=e.clientX-sx, dy=e.clientY-sy0, fast=Math.abs(dx)/Math.max(1,performance.now()-t0)>.5; sx=null;
    if(Math.abs(dx)<6&&Math.abs(dy)<6){ drag=0; place(true); return; }
    if(dy>110&&Math.abs(dy)>Math.abs(dx)*1.3){ drag=0; return close(); }
    go(cur+((dx<-W*.18||(fast&&dx<-30))?1:(dx>W*.18||(fast&&dx>30))?-1:0)); };
  stage.addEventListener('pointerup',up); stage.addEventListener('pointercancel',up);
  v.querySelector('.vw-x').focus({preventScroll:true});
}

/* ===================== seasonal menus =====================
   Four season cards (photos and menus come from seasons.js). Tapping a card lifts its menu out of
   the card to full screen; tap the menu to zoom in, swipe between menus, and "Plan a menu like
   this" drops a note into the enquiry form.                                                    */
const SPRIG='<svg viewBox="0 0 16 20" aria-hidden="true"><path d="M8 19V8" stroke="currentColor" stroke-width="1.1" fill="none"/><path d="M8 9C8 5 9.5 2.5 8 0.5C6.5 2.5 8 5 8 9Z" fill="currentColor"/><path d="M8 12C5.5 11 3 9 2.5 6C5 6.5 7 8.5 8 12Z" fill="currentColor"/><path d="M8 12C10.5 11 13 9 13.5 6C11 6.5 9 8.5 8 12Z" fill="currentColor"/></svg>';
const SEASON_DATA=(SEA&&SEA.SEASONS)||{};
const okImg=f=>typeof f==='string'&&/^[\w.\- ]+\.(jpe?g|png|webp|avif)$/i.test(f);
const tr=(k,o={})=>String((I18N[lang]&&I18N[lang][k])??I18N.en[k]??'').replace(/\{(\w+)\}/g,(_,x)=>o[x]??'');
const mTitle=m=>String((lang==='el'?m.el:m.en)||m.en||'');
const seasonCards=()=>$$('#track .card.season');
const MENU_RATIO=1055/1491;
(function injectSeasonCSS(){
  const st=document.createElement('style'); st.textContent=`
  #occasions .stage{gap:clamp(16px,3.4vh,48px);box-sizing:border-box;padding-top:max(58px,calc(env(safe-area-inset-top) + 50px));padding-bottom:max(10px,env(safe-area-inset-bottom))}
  #occasions .hctl{flex:none}
  .oc-sub{font-family:var(--serif);font-size:clamp(16px,1.5vw,19px);line-height:1.5;color:rgba(236,228,216,.72);max-width:48ch;margin-top:12px}
  .oc-hint{display:inline-flex;align-items:center;gap:10px;margin-top:14px;font:500 10.5px var(--sans);letter-spacing:.22em;text-transform:uppercase;color:#d6b679}
  .oc-hint i{width:20px;height:20px;border-radius:50%;border:1px solid rgba(214,182,121,.6);position:relative;flex:none}
  .oc-hint i::after{content:"";position:absolute;inset:5px;border-radius:50%;background:#d6b679;animation:ocPulse 2.2s ease-in-out infinite}
  @keyframes ocPulse{0%,100%{transform:scale(.55);opacity:.45}50%{transform:scale(1);opacity:1}}
  .rm .oc-hint i::after{animation:none}
  @media(max-width:600px){#occasions h2{font-size:clamp(32px,9vw,40px)}}
  @media(max-height:980px){.oc-sub{display:none!important}}
  /* season cards: the original card, with the menu's hand-drawn produce in gold */
  .card.season{cursor:pointer;flex:none;isolation:isolate;position:relative;padding:0;min-height:0;height:clamp(330px,56vh,520px);overflow:hidden;
    transition:border-color .5s ease,background .5s ease,transform .7s cubic-bezier(.16,1,.3,1)}
  .card.season .olive{display:none}
  .s-art{position:absolute;inset:0 0 auto 0;height:74%;overflow:hidden;z-index:0;pointer-events:none;
    -webkit-mask-image:linear-gradient(180deg,#000 55%,transparent 100%);mask-image:linear-gradient(180deg,#000 55%,transparent 100%);transition:opacity .6s ease,transform .8s cubic-bezier(.16,1,.3,1)}
  .s-mask{position:absolute;display:block;aspect-ratio:900/1272;background:#d6b679;opacity:.6;transition:opacity .6s ease,background-color .6s ease;will-change:transform,clip-path;
    -webkit-mask-size:100% 100%;mask-size:100% 100%;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat}
  .card.season > .num{position:absolute;top:clamp(20px,2.6vw,30px);left:clamp(22px,2.4vw,30px);z-index:2}
  .card.season > .s-rule{position:absolute;top:calc(clamp(20px,2.6vw,30px) + 34px);left:clamp(22px,2.4vw,30px);z-index:2}
  .s-sprig{position:absolute;left:50%;top:44%;width:34%;transform:translate(-50%,-50%);color:#d6b679;opacity:.5}.s-sprig svg{width:100%;height:auto;display:block}
  .s-rule{display:block;height:1px;width:56px;background:linear-gradient(90deg,#d6b679,rgba(214,182,121,0));transform-origin:0 50%}
  .s-copy{position:absolute;left:0;right:0;bottom:0;z-index:1;display:flex;flex-direction:column;padding:56px clamp(22px,2.4vw,30px) clamp(18px,2.2vw,26px);
    background:linear-gradient(180deg,rgba(32,37,26,0) 0,rgba(32,37,26,.86) 48px,#20251a 100%)}
  .card.season h3{margin:0 0 6px}
  .card.season .s-menu{font:italic 400 17px/1.35 var(--serif);color:#d6b679;opacity:1;max-width:none;margin:0}
  .s-note{display:grid;grid-template-rows:0fr;transition:grid-template-rows .6s cubic-bezier(.16,1,.3,1)}
  .s-note > div{overflow:hidden;min-height:0}
  .card.season .s-desc{font-size:14.5px;line-height:1.62;opacity:.82;max-width:40ch;margin:0;padding-top:12px}
  .card.season.note-open .s-note{grid-template-rows:1fr}
  .s-copy{max-height:100%;box-sizing:border-box;transition:padding-top .5s cubic-bezier(.16,1,.3,1)}
  .s-copy > *{flex:none}
  .card.season .s-note{flex:0 1 auto;min-height:0}
  .s-note > div{overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:rgba(214,182,121,.4) transparent}
  .card.season.note-open .s-note > div{overflow-y:auto}
  .card.season.note-open .s-copy{padding-top:26px;background:linear-gradient(180deg,rgba(32,37,26,0) 0,rgba(32,37,26,.92) 22px,#20251a 100%)}
  .card.season.note-open > .num,.card.season.note-open > .s-rule{visibility:hidden}
  .card.season.note-open .s-art{opacity:.35;transform:translateY(-6%)}
  .s-note .s-desc{opacity:0;transform:translateY(10px);transition:opacity .4s ease,transform .6s cubic-bezier(.16,1,.3,1)}
  .card.season.note-open .s-note .s-desc{opacity:.82;transform:none;transition-delay:.12s}
  .s-actions{display:flex;align-items:center;gap:10px;margin-top:10px}
  .s-cta-t{white-space:nowrap}
  .card.season .s-more{align-self:flex-start;margin-top:6px;min-height:38px}
  .s-more{all:unset;box-sizing:border-box;display:inline-flex;align-items:center;gap:9px;min-height:44px;cursor:pointer;color:rgba(236,228,216,.75);font:500 10px var(--sans);letter-spacing:.2em;text-transform:uppercase;-webkit-tap-highlight-color:transparent;transition:color .3s}
  .s-more i{position:relative;width:22px;height:22px;border-radius:50%;border:1px solid rgba(236,228,216,.35);flex:none;transition:transform .5s cubic-bezier(.16,1,.3,1),border-color .3s}
  .s-more i::before,.s-more i::after{content:"";position:absolute;left:50%;top:50%;width:9px;height:1px;margin:-.5px 0 0 -4.5px;background:currentColor}
  .s-more i::after{transform:rotate(90deg)}
  .note-open .s-more i{transform:rotate(45deg)}
  .s-more:hover{color:#f4eee5}.s-more:hover i{border-color:#d6b679}
  .s-more:focus-visible{outline:2px solid #d6b679;outline-offset:3px;border-radius:4px}
  .s-cta{all:unset;box-sizing:border-box;display:inline-flex;align-items:center;gap:12px;min-height:44px;cursor:pointer;
    font:600 10.5px var(--sans);letter-spacing:.22em;text-transform:uppercase;color:#d6b679;-webkit-tap-highlight-color:transparent}
  .s-cta i{position:relative;display:block;width:34px;height:34px;border-radius:50%;border:1px solid rgba(214,182,121,.6);flex:none;color:#d6b679;transition:background .45s ease,border-color .45s ease,color .45s,transform .6s cubic-bezier(.16,1,.3,1)}
  .s-cta i::before{content:"";position:absolute;left:10px;right:10px;top:50%;height:1px;background:currentColor}
  .s-cta i::after{content:"";position:absolute;right:10px;top:50%;width:6px;height:6px;border-top:1px solid currentColor;border-right:1px solid currentColor;transform:translate(0,-50%) rotate(45deg)}
  .s-cta-t{position:relative;padding-bottom:3px}
  .s-cta-t::after{content:"";position:absolute;left:0;right:0;bottom:0;height:1px;background:currentColor;transform:scaleX(.25);transform-origin:0 50%;transition:transform .6s cubic-bezier(.16,1,.3,1)}
  .s-cta:focus-visible{outline:2px solid #d6b679;outline-offset:4px;border-radius:4px}
  .s-cta[hidden]{display:none!important}
  .card.season:active{transform:scale(.985)}
  @media(hover:hover){
    .card.season:hover{border-color:rgba(214,182,121,.65)}
    .card.season:hover .s-mask{opacity:.85}
    .card.season:hover .s-cta-t::after{transform:scaleX(1)}
    .card.season:hover .s-cta i{background:#d6b679;border-color:#d6b679;color:#20251a;transform:translateX(4px)}
  }
  @media(min-width:1024px){.card.season{width:max(270px,calc((var(--wrap) - 3 * clamp(16px,2.4vw,32px)) / 4));height:clamp(380px,56vh,540px)}}

  /* form controls: one look in every browser */
  #form input:-webkit-autofill,#form input:-webkit-autofill:hover,#form input:-webkit-autofill:focus,#form textarea:-webkit-autofill{
    -webkit-box-shadow:0 0 0 60px var(--paper) inset;box-shadow:0 0 0 60px var(--paper) inset;-webkit-text-fill-color:var(--olive);caret-color:var(--olive);transition:background-color 9999s}
  #form input,#form textarea,#form button{-webkit-tap-highlight-color:transparent}
  #form textarea{resize:vertical;min-height:110px}
  #form input[type=number]{-moz-appearance:textfield;appearance:textfield}
  #form input[type=number]::-webkit-inner-spin-button,#form input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
  .cs-native{position:absolute!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none!important;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);border:0!important;padding:0!important;margin:-1px!important}
  .cs-f,.st-f{position:relative}.cs-f.open{z-index:6}
  .cs-btn{all:unset;box-sizing:border-box;width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:44px;padding:10px 0;
    border-bottom:1px solid rgba(32,37,26,.25);font:400 16px var(--sans);color:var(--olive);cursor:pointer;transition:border-color .3s;-webkit-tap-highlight-color:transparent}
  .cs-btn:hover,.cs-btn[aria-expanded="true"],.cs-btn:focus-visible{border-bottom-color:var(--gold)}
  .cs-btn:focus-visible{box-shadow:0 1px 0 var(--gold)}
  .cs-val{display:inline-block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .cs-chev{flex:none;color:var(--gold);transition:transform .5s cubic-bezier(.16,1,.3,1)}
  .cs-btn[aria-expanded="true"] .cs-chev{transform:rotate(180deg)}
  .f.bad .cs-btn{border-bottom-color:#a3402a}
  .cs{position:absolute;top:calc(100% + 10px);left:0;right:0;min-width:220px;z-index:40;box-sizing:border-box;background:var(--paper);color:var(--olive);border-radius:16px;padding:8px;
    box-shadow:0 34px 70px -24px rgba(20,23,15,.6),0 0 0 1px rgba(184,145,79,.28);transform-origin:top center;list-style:none;margin:0;outline:none}
  .cs.cs-sheet{position:fixed;top:auto;left:0;right:0;bottom:0;min-width:0;border-radius:24px 24px 0 0;padding:10px 12px max(16px,calc(env(safe-area-inset-bottom) + 8px));z-index:131}
  .cs-sheet::before{content:"";display:block;width:40px;height:4px;border-radius:2px;background:rgba(32,37,26,.18);margin:0 auto 10px}
  .cs-title{font:500 10px var(--sans);letter-spacing:.24em;text-transform:uppercase;color:var(--leaf);text-align:center;margin:0 0 6px}
  .cs:not(.cs-sheet) .cs-title{display:none}
  .cs-o{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:46px;padding:0 14px;border-radius:10px;cursor:pointer;font:400 16px var(--sans);
    transition:background .25s,color .25s;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none}
  .cs-o.act{background:rgba(184,145,79,.14)}
  .cs-o[aria-selected="true"]{color:var(--olive);font-weight:500}
  .cs-tick{width:18px;height:18px;flex:none;color:var(--gold);opacity:0;transform:scale(.4);transition:opacity .3s,transform .45s cubic-bezier(.16,1,.3,1)}
  .cs-o[aria-selected="true"] .cs-tick{opacity:1;transform:none}
  .cs-tick path{stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset .45s cubic-bezier(.16,1,.3,1) .05s}
  .cs-o[aria-selected="true"] .cs-tick path{stroke-dashoffset:0}
  .st-wrap{display:flex;align-items:center;gap:8px;border-bottom:1px solid rgba(32,37,26,.25);transition:border-color .3s}
  .st-wrap:focus-within,.st-wrap:hover{border-bottom-color:var(--gold)}
  .f.bad .st-wrap{border-bottom-color:#a3402a}
  .st-wrap input{border-bottom:0!important;flex:1;min-width:0}
  .st-b{all:unset;box-sizing:border-box;width:34px;height:34px;border-radius:50%;flex:none;display:grid;place-items:center;cursor:pointer;color:var(--gold);border:1px solid rgba(184,145,79,.42);
    transition:background .3s,transform .3s cubic-bezier(.16,1,.3,1),opacity .3s;-webkit-tap-highlight-color:transparent}
  .st-b:hover{background:rgba(184,145,79,.13)}.st-b:active{transform:scale(.88)}.st-b:disabled{opacity:.3;cursor:default}
  .st-b:focus-visible{outline:2px solid var(--gold);outline-offset:2px}
  .g-more{flex:0 0 100%;display:flex;justify-content:center;padding-top:clamp(6px,1.4vw,14px)}
  .g-more[hidden]{display:none}
  .g-more button{all:unset;box-sizing:border-box;display:inline-flex;align-items:center;gap:12px;min-height:46px;padding:12px 22px;border-radius:999px;cursor:pointer;
    border:1px solid rgba(214,182,121,.55);color:#d6b679;font:600 10.5px var(--sans);letter-spacing:.2em;text-transform:uppercase;-webkit-tap-highlight-color:transparent;
    transition:background .4s ease,color .4s ease,border-color .4s ease}
  .g-more i{position:relative;width:9px;height:9px;flex:none;transition:transform .5s cubic-bezier(.16,1,.3,1)}
  .g-more i::before{content:"";position:absolute;inset:0;border-right:1.3px solid currentColor;border-bottom:1.3px solid currentColor;transform:translateY(-25%) rotate(45deg)}
  .g-more button[aria-expanded="true"] i{transform:rotate(180deg)}
  .g-more button:focus-visible{outline:2px solid #d6b679;outline-offset:3px}
  @media(hover:hover){.g-more button:hover{background:#d6b679;color:#20251a;border-color:#d6b679}}
  /* menu viewer: the menus are drawn in HTML, sized for each screen */
  .mv{position:fixed;inset:0;z-index:120;display:flex;flex-direction:column;color:#f4eee5}
  .mv-bg{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 30%,#2a3022 0%,#14170f 72%);opacity:0;will-change:clip-path}
  .mv-top{position:relative;z-index:3;display:flex;justify-content:space-between;align-items:center;gap:12px;padding:max(10px,calc(env(safe-area-inset-top) + 4px)) 14px 6px 20px;opacity:0}
  .mv-t{display:flex;gap:14px;align-items:baseline;min-width:0}
  .mv-season{font:italic 400 24px var(--serif);color:#d6b679}
  .mv-count{font:500 11px var(--sans);letter-spacing:.25em;color:rgba(236,228,216,.6)}
  .mv-x,.mv-arw{width:46px;height:46px;border-radius:50%;border:1px solid rgba(214,182,121,.5);background:rgba(32,37,26,.6);color:#d6b679;cursor:pointer;display:grid;place-items:center;font-size:16px;flex:none;transition:background .3s,opacity .3s}
  .mv-x:hover,.mv-arw:hover{background:rgba(214,182,121,.18)}
  .mv-x:focus-visible,.mv-arw:focus-visible,.mv-plan:focus-visible,.mv-dots button:focus-visible{outline:2px solid #d6b679;outline-offset:2px}
  .mv-arw{position:absolute;top:46%;z-index:4;opacity:0}.mv-prev{left:18px}.mv-next{right:18px}.mv-arw:disabled{opacity:.25!important;cursor:default}
  @media(max-width:760px){.mv-arw{display:none}}
  .mv-rail{position:relative;z-index:2;flex:1;min-height:0;overflow:hidden;touch-action:pan-y}
  .mv-slide{position:absolute;inset:0;overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;touch-action:pan-y;scrollbar-width:none;will-change:transform}
  .mv-slide::-webkit-scrollbar{display:none}
  .mv-page{display:flex;min-height:100%;box-sizing:border-box;padding:6px 12px 14px}
  /* the paper */
  .mp{position:relative;container-type:inline-size;width:var(--pw,360px);min-height:var(--ph,500px);margin:auto;box-sizing:border-box;overflow:hidden;border-radius:4px;
    background:radial-gradient(ellipse at 50% 42%,#f8f4ec 0%,#f2ecdf 70%,#ebe3d2 100%);color:#22261b;text-align:center;
    box-shadow:0 40px 90px -30px rgba(0,0,0,.85),0 0 0 1px rgba(214,182,121,.14);display:flex;flex-direction:column;justify-content:center;padding:clamp(28px,8cqw,56px) clamp(18px,7cqw,48px) clamp(20px,5cqw,36px)}
  /* readability: the drawing stays at the edges of the page; behind the words a soft wash of paper
     lifts the text clear of the lines, and every line of text carries a faint paper halo */
  .mp{--art-o:.6;--paper:247,243,234}
  .mp::after{content:"";position:absolute;inset:0;z-index:0;pointer-events:none;
    background:radial-gradient(ellipse 50% 56% at 50% 50%,rgba(var(--paper),.82) 0%,rgba(var(--paper),.66) 52%,rgba(var(--paper),0) 100%)}
  .mp-in{text-shadow:0 0 1px rgba(var(--paper),1),0 0 4px rgba(var(--paper),1),0 0 10px rgba(var(--paper),.95),0 0 18px rgba(var(--paper),.8)}
  @media(max-width:620px){.mp{--art-o:.66}.mp::after{background:linear-gradient(90deg,rgba(var(--paper),.12) 0%,rgba(var(--paper),.62) 16%,rgba(var(--paper),.7) 50%,rgba(var(--paper),.62) 84%,rgba(var(--paper),.12) 100%)}}
  .mp-art{position:absolute;left:0;top:50%;width:100%;aspect-ratio:900/1272;transform:translateY(-50%);background:#a9a487;opacity:var(--art-o);pointer-events:none;
    -webkit-mask-size:100% 100%;mask-size:100% 100%;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat}
  .mp-in{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center}
  .mp-season{font:500 clamp(11px,2.3cqw,15px)/1 var(--serif);letter-spacing:.34em;text-transform:uppercase;padding-left:.34em}
  .mp-orn{display:flex;align-items:center;justify-content:center;gap:8px;color:#b8914f;width:min(100%,60cqw);margin:clamp(8px,2cqw,14px) 0}
  .mp-orn::before,.mp-orn::after{content:"";flex:1;height:1px;background:currentColor;opacity:.8;transform-origin:var(--o,right) 50%}
  .mp-orn::after{--o:left}
  .mp-orn svg{width:clamp(11px,2.4cqw,15px);height:auto;flex:none}
  .mp-orn.sm{width:min(100%,24cqw);margin:clamp(5px,1.2cqw,9px) 0 clamp(8px,2cqw,13px)}
  .mp-orn.sm svg{width:clamp(8px,1.6cqw,10px)}
  .mp-title{font:italic 400 clamp(32px,9.4cqw,62px)/1.04 var(--serif);color:#1d2116;margin:0;letter-spacing:-.01em}
  .mp-c{margin-top:clamp(12px,3cqw,22px);width:100%;display:flex;flex-direction:column;align-items:center}
  .mp-c h4{font:500 clamp(11px,2.3cqw,14.5px)/1.2 var(--serif);letter-spacing:.3em;text-transform:uppercase;margin:0;padding-left:.3em}
  .mp-d{margin:0 auto clamp(8px,2cqw,14px);max-width:92%}
  .mp-d:last-child{margin-bottom:0}
  .mp-or{font:italic 400 clamp(13px,2.4cqw,16px)/1 var(--serif);color:#97733a;margin:calc(-1 * clamp(2px,.8cqw,6px)) 0 clamp(6px,1.6cqw,11px);letter-spacing:.06em}
  .mp-c.nohead{margin-top:clamp(8px,2cqw,14px)}
  .mp-ch{margin-top:10px;font:italic 400 clamp(11px,1.8cqw,12.5px)/1.45 var(--serif);color:#55583f;max-width:46ch}
  .mp-d b{display:block;font:400 clamp(17px,3.5cqw,23px)/1.22 var(--serif);color:#1d2116}
  .mp-d i{display:block;font:italic 400 clamp(14px,2.65cqw,17.5px)/1.35 var(--serif);color:#3b3f2f;margin-top:2px}
  .mp-f{margin-top:clamp(16px,4cqw,28px);font:italic 400 clamp(12px,2cqw,13.5px)/1.5 var(--serif);color:#3b3f2f}
  .mp-url{margin-top:8px;font:500 clamp(10px,1.8cqw,12px)/1 var(--serif);letter-spacing:.3em;color:#22261b}
  .mp-grow{position:absolute;left:0;top:50%;width:100%;aspect-ratio:900/1272;transform:translateY(-50%);opacity:var(--art-o);pointer-events:none}
  /* footer */
  .mv-foot{position:relative;z-index:3;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:8px 16px max(14px,calc(env(safe-area-inset-bottom) + 6px)) 20px;opacity:0}
  .mv-meta{display:grid;gap:6px;min-width:0}
  .mv-dots{display:flex;gap:10px;min-height:7px}
  .mv-dots button{all:unset;width:7px;height:7px;border-radius:50%;background:rgba(236,228,216,.3);cursor:pointer;transition:background .35s,transform .35s cubic-bezier(.16,1,.3,1)}
  .mv-dots button.on{background:#d6b679;transform:scale(1.35)}
  .mv-hint{font:500 9.5px var(--sans);letter-spacing:.2em;text-transform:uppercase;color:rgba(236,228,216,.55);margin:0}
  .mv-plan{all:unset;box-sizing:border-box;cursor:pointer;display:inline-flex;gap:12px;align-items:center;min-height:46px;background:#d6b679;color:#20251a;font:600 10.5px var(--sans);letter-spacing:.18em;text-transform:uppercase;padding:13px 20px;border-radius:999px;transition:background .35s;flex:none;white-space:nowrap}
  .mv-plan i{font-style:normal;letter-spacing:0;font-size:13px;transition:transform .45s cubic-bezier(.16,1,.3,1)}
  @media(hover:hover){.mv-plan:hover{background:#e4c890}.mv-plan:hover i{transform:translateX(4px)}}
  @media(min-width:900px){.mv-foot{padding-left:32px;padding-right:32px}}
  @media(max-width:480px){.mv-hint.solo{display:none}}
  /* date picker */
  .dp-f{position:relative}
  .dp-f.open{z-index:6}
  .dp-btn{all:unset;box-sizing:border-box;width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:44px;padding:10px 0;
    border-bottom:1px solid rgba(32,37,26,.25);font:400 16px var(--sans);color:var(--olive);cursor:pointer;transition:border-color .3s}
  .dp-btn:hover,.dp-btn[aria-expanded="true"],.dp-btn:focus-visible{border-bottom-color:var(--gold)}
  .dp-btn:focus-visible{box-shadow:0 1px 0 var(--gold)}
  .dp-val{display:inline-block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .dp-val.is-ph{color:rgba(32,37,26,.45)}
  .dp-ico{color:var(--gold);flex:none;transition:transform .5s cubic-bezier(.16,1,.3,1)}
  .dp-btn[aria-expanded="true"] .dp-ico{transform:rotate(-10deg) scale(1.1)}
  .f.bad .dp-btn{border-bottom-color:#a3402a}
  .dp{position:absolute;top:calc(100% + 10px);left:0;z-index:40;width:328px;max-width:calc(100vw - 32px);box-sizing:border-box;background:var(--paper);color:var(--olive);
    border-radius:18px;padding:16px 14px 10px;box-shadow:0 34px 70px -24px rgba(20,23,15,.6),0 0 0 1px rgba(184,145,79,.28);transform-origin:top left}
  .dp.dp-r{left:auto;right:0;transform-origin:top right}
  .dp.up{top:auto;bottom:calc(100% + 10px);transform-origin:bottom left}.dp.dp-r.up{transform-origin:bottom right}
  .cs.up{top:auto;bottom:calc(100% + 10px);transform-origin:bottom center}
  .dp.dp-sheet{position:fixed;top:auto;left:0;right:0;bottom:0;width:auto;max-width:none;border-radius:24px 24px 0 0;padding:10px 18px max(16px,calc(env(safe-area-inset-bottom) + 8px));z-index:131}
  .dp-sheet::before{content:"";display:block;width:40px;height:4px;border-radius:2px;background:rgba(32,37,26,.18);margin:0 auto 12px}
  .dp-scrim{position:fixed;inset:0;z-index:130;background:rgba(20,23,15,.55)}
  .dp-title{font:500 10px var(--sans);letter-spacing:.24em;text-transform:uppercase;color:var(--leaf);text-align:center;margin-bottom:6px}
  .dp:not(.dp-sheet) .dp-title{display:none}
  .dp-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px}
  .dp-mwrap{position:relative;overflow:hidden;flex:1;height:32px}
  .dp-month{position:absolute;inset:0;text-align:center;font:400 21px/32px var(--serif);white-space:nowrap}
  .dp-nav{all:unset;box-sizing:border-box;width:38px;height:38px;border-radius:50%;display:grid;place-items:center;cursor:pointer;color:var(--gold);border:1px solid rgba(184,145,79,.38);transition:background .3s,opacity .3s;flex:none}
  .dp-nav:hover:not(:disabled){background:rgba(184,145,79,.13)}.dp-nav:disabled{opacity:.28;cursor:default}
  .dp-nav:focus-visible,.dp-foot button:focus-visible{outline:2px solid var(--gold);outline-offset:2px}
  .dp-wd{display:grid;grid-template-columns:repeat(7,1fr);font:500 10px var(--sans);letter-spacing:.1em;text-transform:uppercase;color:var(--leaf);text-align:center;padding:6px 0 4px}
  .dp-gwrap{position:relative;overflow:hidden}
  .dp-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:2px 0}
  .dp-grid.leaving{position:absolute;inset:0}
  .dp-d,.dp-e{height:42px}
  .dp-d{all:unset;box-sizing:border-box;height:42px;display:grid;place-items:center;position:relative;cursor:pointer;font:400 15px var(--sans);font-variant-numeric:tabular-nums}
  .dp-d span{position:relative;z-index:1}
  .dp-d::before{content:"";position:absolute;width:38px;height:38px;left:50%;top:50%;margin:-19px 0 0 -19px;border-radius:50%;transform:scale(.5);opacity:0;background:rgba(184,145,79,.16);transition:transform .35s cubic-bezier(.16,1,.3,1),opacity .3s,background .3s}
  .dp-d:hover:not(:disabled)::before,.dp-d:focus-visible::before{transform:scale(1);opacity:1}
  .dp-d:focus-visible::before{box-shadow:0 0 0 1.5px var(--gold)}
  .dp-d:disabled{opacity:.26;cursor:default}
  .dp-d.today::after{content:"";position:absolute;bottom:5px;left:50%;width:4px;height:4px;margin-left:-2px;border-radius:50%;background:var(--gold);z-index:1}
  .dp-d.sel{color:var(--paper)}
  .dp-d.sel::before{transform:scale(1);opacity:1;background:var(--olive)}
  .dp-d.sel::after{background:#d6b679}
  .dp-foot{display:flex;justify-content:space-between;margin-top:6px;padding-top:6px;border-top:1px solid rgba(32,37,26,.1)}
  .dp-foot button{all:unset;cursor:pointer;font:600 10.5px var(--sans);letter-spacing:.2em;text-transform:uppercase;color:var(--leaf);padding:10px 8px;transition:color .3s}
  .dp-foot button:hover{color:var(--gold)}
  `; document.head.append(st);
})();

/* line drawings of each season's produce (stroked, so they can draw themselves on scroll) */
/* the hand-drawn produce from each season's menu (text removed), and where on the card to frame it:
   fx/fy = point of the drawing to centre on (0–1), s = how large the drawing is relative to the card */
const SEASON_ART={
  summer:{img:'art-summer.webp',fx:.80,fy:.66,s:2.0},
  autumn:{img:'art-autumn.webp',fx:.36,fy:.56,s:1.55},
  winter:{img:'art-winter.webp',fx:.82,fy:.68,s:2.0},
  spring:{img:'art-spring.webp',fx:.30,fy:.42,s:1.5},
  events:{img:'art-events.webp',fx:.27,fy:.68,s:1.95}
};
/* the drawings are only fetched once the menus come near, so they never hold up the top of the page */
const nearMenus=(()=>{ const q=[]; let near=false;
  const sec=document.getElementById('occasions');
  const go=()=>{ near=true; q.splice(0).forEach(f=>f()); };
  if(!sec||!('IntersectionObserver' in window)) setTimeout(go,2500);
  else { const io=new IntersectionObserver(es=>{ if(es.some(e=>e.isIntersecting)){ io.disconnect(); go(); } },{rootMargin:'1200px 0px'}); io.observe(sec); }
  return f=>near?f():q.push(f); })();
var SEAS=null;                          // set once the cards are built (render may run before that)
function buildSeasons(){
  SEAS=seasonCards().map((card,i)=>{
    const key=card.dataset.season, S=SEASON_DATA[key], A=SEASON_ART[key]||null;
    const menus=S&&Array.isArray(S.menus)?S.menus.filter(m=>m&&Array.isArray(m.courses)):[];
    card._menus=menus;
    const mask=card.querySelector('.s-mask');
    if(mask&&A) nearMenus(()=>{ const u=`url("/${A.img}")`; mask.style.webkitMaskImage=u; mask.style.maskImage=u; });
    else if(mask&&!card.querySelector('.s-sprig')){ mask.style.display='none'; const sp=document.createElement('div'); sp.className='s-sprig'; sp.innerHTML=SPRIG; mask.after(sp); }
    card.classList.toggle('no-menu',!menus.length);
    card.querySelector('.s-cta').hidden=!menus.length;
    const more=card.querySelector('.s-more');
    if(more&&!more._b){ more._b=1; more.addEventListener('click',e=>{ e.stopPropagation();
      const open=!card.classList.contains('note-open'); card.classList.toggle('note-open',open); more.setAttribute('aria-expanded',String(open)); }); }
    return {card,i,A,mask,box:card.querySelector('.s-art'),rule:card.querySelector('.s-rule'),
      parts:[card.querySelector('.num'),...card.querySelectorAll('.s-copy > *')],l:0,w:1,mw:0,mh:0};
  });
  measureSeasons();
}
function measureSeasons(){
  if(!SEAS) return;
  M.hwL=hw.getBoundingClientRect().left;
  SEAS.forEach(s=>{ s.l=s.card.offsetLeft; s.w=s.card.offsetWidth||1;
    if(s.mask&&s.A&&s.box){ const bw=s.box.offsetWidth, bh=s.box.offsetHeight, mw=bw*s.A.s, mh=mw*1272/900;
      s.mw=mw; s.mh=mh; s.mask.style.width=mw.toFixed(1)+'px';
      s.mask.style.left=(bw*.62-s.A.fx*mw).toFixed(1)+'px'; s.mask.style.top=(bh*.46-s.A.fy*mh).toFixed(1)+'px'; } });
}
/* Each card has its own progress: how far the section has come up the screen and how far the
   card has slid in from the right. That reveals the drawing (an ink circle opening from the
   produce), grows the gold rule and lifts the text in. */
function renderSeasons(){
  if(!SEAS||RM) return;
  const vw=innerWidth, vh=M.vh, y=sy;
  const enter=clamp((y+vh-M.occ.top)/(vh*.95));
  SEAS.forEach((s,i)=>{
    const x=M.hwL+s.l-curLeft;
    const vis=clamp((vw-x)/(s.w*.75));
    s.p=Math.max(s.p||0,Math.min(seg(enter,.1+i*.06,.7+i*.06),vis));      // latch: once shown, never fades back while swiping
    if(enter<.02) s.p=0;                                                  // reset only when the section is fully off-screen below
    const d=s.p, e=ease(d);
    const drift=((x+s.w/2)-vw/2)/vw;
    if(s.mask&&s.A){
      put('sc'+i,s.mask,'clipPath',e>=.999?'none':`circle(${(e*78).toFixed(2)}% at ${(s.A.fx*100).toFixed(1)}% ${(s.A.fy*100).toFixed(1)}%)`);
      put('si'+i,s.mask,'transform',`translate3d(${(drift*-30).toFixed(1)}px,${((1-e)*30).toFixed(1)}px,0) scale(${(1.12-.12*e).toFixed(4)})`);
    }
    if(s.rule) put('sr'+i,s.rule,'transform',`scaleX(${e.toFixed(3)})`);
    s.parts.forEach((el,k)=>{ if(!el) return; const t=ease(seg(d,.25+k*.09,.68+k*.09));
      put('so'+i+'_'+k,el,'opacity',t.toFixed(3)); put('st'+i+'_'+k,el,'transform',`translate3d(0,${((1-t)*22).toFixed(1)}px,0)`); });
  });
}
function refreshSeasons(){
  seasonCards().forEach(card=>{
    const menus=card._menus||[], n=menus.length, name=tr('sn.'+card.dataset.season), view=n>1?tr('sn.views',{n}):tr('sn.view');
    const mt=card.querySelector('.s-more-t'); if(mt) mt.textContent=tr('sn.note');
    card.querySelector('.s-menu').textContent=menus.map(mTitle).join(' · ');
    card.querySelector('.s-cta-t').textContent=view;
    const cta=card.querySelector('.s-cta'); cta.setAttribute('aria-label',`${view} — ${name}`); cta.setAttribute('aria-haspopup','dialog');
  });
}
buildSeasons();
(function(){ // fetch the growth frames once the seasonal menus come near, so the opening never waits
  // on a slow connection only the drawings are fetched; the frame-by-frame growth sheets (several MB) are skipped
  const go=()=>{ try{ const vals=SLOW?[]:Object.values(GROWSEQ); vals.forEach(s=>(s.parts||[s.sheet]).forEach(f=>loadImg('/'+f))); Object.keys(GROWMAP).forEach(f=>loadImg('/'+f));
    setTimeout(()=>vals.forEach(s=>{ if(s.end) loadImg('/'+s.end.sheet); }),1500); }catch(_){} };
  const sec=$('#occasions'); if(!sec||!('IntersectionObserver' in window)){ setTimeout(go,3000); return; }
  const io=new IntersectionObserver(es=>{ if(es.some(e=>e.isIntersecting)){ io.disconnect(); go(); } },{rootMargin:'1200px 0px'}); io.observe(sec);
})();
$('#track').addEventListener('click',e=>{
  if(e.target.closest('.s-more')) return;
  const card=e.target.closest('.card.season'); if(!card||!(card._menus&&card._menus.length)) return;
  if(performance.now()-lastDragEnd<400) return;          // that was a swipe, not a tap
  if(menuV||viewer||openT) return;
  const shift=cardShift(card);
  if(Math.abs(shift)<2||RM){ if(shift) nudgeCards(shift); openMenu(card); return; }
  animOff(off+shift,380); openT=setTimeout(()=>{ openT=0; openMenu(card); },400);
});
/* how far the cards must slide for this one to sit wholly inside the strip (0 if it already does) */
function cardShift(card){
  const r=card.getBoundingClientRect(), h=hw.getBoundingClientRect(), pad=Math.min(16,Math.max(0,(h.width-r.width)/2));
  const lo=h.left+pad, hi=h.right-pad;
  const s=r.left<lo?r.left-lo:r.right>hi?r.right-hi:0;
  return clamp(curLeft+s,0,hDist)-curLeft;
}
function nudgeCards(shift){ cancelAnimationFrame(offAnim); offAnim=0; off+=shift; applyCards(sy); }
let openT=0;

let menuV=null;
/* ---- the card ⇄ menu flip ----
   The season card is the front of the menu, the menu its back. Keyframes for the page moving
   between the card's rectangle and its own, turning over in 3D on the way: dark olive card face
   while it faces away, cream paper once it has turned past edge-on (the switch happens exactly at
   90°, where the page is invisible). */
const CARD_FACE='#262b1f', PAGE_FACE='#f2ecdf';
function flipKeys(cr,pr,from,start){
  const cx=cr.left+cr.width/2-(pr.left+pr.width/2), cy=cr.top+cr.height/2-(pr.top+pr.height/2);
  const sx=cr.width/pr.width, sy=cr.height/pr.height, ms=Math.sqrt(sx*sy);
  const persp=`perspective(${Math.round(Math.max(pr.width,pr.height)*2.4)}px)`;
  const T=(f,ry,rz,lift)=>{ const s=v=>v.toFixed(4);
    const kx=1+(sx-1)*(1-f), ky=1+(sy-1)*(1-f), k=lift*(1-Math.abs(f-.5)*2);
    return `${persp} translate3d(${(cx*(1-f)).toFixed(1)}px,${(cy*(1-f)-k*40).toFixed(1)}px,${(k*120).toFixed(1)}px) rotateX(0deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${s(kx)},${s(ky)})`; };
  const card={background:CARD_FACE,boxShadow:'0 0 0 1px rgba(214,182,121,.55),0 20px 40px -20px rgba(0,0,0,.6)'};
  const page={background:PAGE_FACE,boxShadow:'0 40px 90px -30px rgba(0,0,0,.85),0 0 0 1px rgba(214,182,121,.14)'};
  const rad=f=>{ const kx=1+(sx-1)*(1-f), ky=1+(sy-1)*(1-f); return `${(22/kx).toFixed(1)}px / ${(22/ky).toFixed(1)}px`; };
  const keys=[
    {transform:T(0,0,0,0),borderRadius:rad(0),...card,offset:0},
    {transform:T(.32,-62,-2.5,1),borderRadius:rad(.32),...card,offset:.36},
    {transform:T(.48,-90,-1.5,1),borderRadius:rad(.48),...card,offset:.5},
    {transform:T(.48,-90,-1.5,1),borderRadius:rad(.48),...page,offset:.5001},
    {transform:T(.7,-150,.8,1),borderRadius:rad(.7),...page,offset:.7},
    {transform:T(1,-180,0,0),borderRadius:'4px',...page,offset:1}];
  // the page's own face is the one that ends up towards the viewer: undo the final half-turn by
  // mirroring the second half (rotateY -180 shows the page reversed), so use 180-θ after the switch
  keys[3].transform=T(.48,90,1.5,1); keys[4].transform=T(.7,30,.8,1); keys[5].transform=T(1,0,0,0);
  if(from==='card') return keys;
  const back=keys.slice().reverse().map(k=>({...k,offset:1-k.offset}));
  // closing from wherever the page is now (scrolled down the menu, or pulled down by a finger)
  if(start) back[0]={...back[0],transform:`${persp} translate3d(${start.dx.toFixed(1)}px,${start.dy.toFixed(1)}px,0) rotateX(${(start.rx||0).toFixed(2)}deg) rotateY(0deg) rotateZ(0deg) scale(${start.k.toFixed(4)},${start.k.toFixed(4)})`};
  return back;
}
/* the card's real face for the first half of the flip (its drawing and words turning away) */
function cardFace(card,cr,pr,host,dir,dur,delay,E){
  const f=card.cloneNode(true); f.setAttribute('aria-hidden','true'); f.removeAttribute('id');
  f.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));
  Object.assign(f.style,{position:'fixed',left:cr.left+'px',top:cr.top+'px',width:cr.width+'px',height:cr.height+'px',margin:0,zIndex:3,pointerEvents:'none',
    transform:'none',backfaceVisibility:'hidden',transformOrigin:'50% 50%'});
  f.querySelectorAll('*').forEach(n=>{ if(n.style){ n.style.opacity=''; if(!n.classList.contains('s-mask')) n.style.transform=''; } });
  f.querySelectorAll('.s-mask').forEach(n=>{ n.style.visibility=''; n.style.opacity='.6'; n.getAnimations&&n.getAnimations().forEach(x=>x.cancel()); });
  if(dir==='open'){ const h=f.querySelector('h3'); if(h) h.style.visibility='hidden'; }   // the title flies on its own
  host.append(f);
  const dx=(pr.left+pr.width/2)-(cr.left+cr.width/2), dy=(pr.top+pr.height/2)-(cr.top+cr.height/2);
  const sx=pr.width/cr.width, sy=pr.height/cr.height, persp=`perspective(${Math.round(Math.max(pr.width,pr.height)*2.4)}px)`;
  const T=(g,ry,rz,lift)=>{ const kx=1+(sx-1)*g, ky=1+(sy-1)*g, k=lift*(1-Math.abs(g-.5)*2);
    return `${persp} translate3d(${(dx*g).toFixed(1)}px,${(dy*g-k*40).toFixed(1)}px,${(k*120).toFixed(1)}px) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${kx.toFixed(4)},${ky.toFixed(4)})`; };
  let keys=[{transform:T(0,0,0,0),opacity:1,offset:0},{transform:T(.32,-62,-2.5,1),opacity:1,offset:.36},{transform:T(.48,-90,-1.5,1),opacity:1,offset:.5},{transform:T(.48,-90,-1.5,1),opacity:0,offset:.5001},{transform:T(.48,-90,-1.5,1),opacity:0,offset:1}];
  if(dir==='close') keys=keys.slice().reverse().map(k=>({...k,offset:1-k.offset}));
  f.animate(keys,{duration:dur,delay,easing:E,fill:'both'}).finished.then(()=>f.remove(),()=>f.remove());
  return f;
}
/* a ring of gold light riding the edge of the backdrop as it blooms out of (or back into) the card */
function goldRing(host,cx,cy,r0,r1,dur,inward){
  const ring=document.createElement('i'); ring.setAttribute('aria-hidden','true');
  Object.assign(ring.style,{position:'absolute',left:(cx-r1)+'px',top:(cy-r1)+'px',width:(r1*2)+'px',height:(r1*2)+'px',borderRadius:'50%',
    border:'1.5px solid rgba(214,182,121,.9)',boxShadow:'0 0 40px 6px rgba(214,182,121,.25), inset 0 0 40px 6px rgba(214,182,121,.18)',pointerEvents:'none',zIndex:1});
  host.append(ring);
  const a=[{transform:`scale(${(r0/r1).toFixed(4)})`,opacity:inward?0:.95},{transform:'scale(1)',opacity:inward?.95:0}];
  ring.animate(inward?a.reverse().map((k,i)=>({...k,opacity:i?0:.95})):a,{duration:dur,easing:'cubic-bezier(.7,0,.2,1)',fill:'forwards'}).finished.then(()=>ring.remove(),()=>ring.remove());
}
/* one menu, written out as text on a sheet of paper with its drawing behind */
function menuHTML(m,key){
  const orn=(sm)=>`<div class="mp-orn${sm?' sm':''} mp-a" aria-hidden="true">${SPRIG}</div>`;
  let h=`<div class="mp-art" aria-hidden="true"></div><div class="mp-in">`;
  h+=`<p class="mp-season mp-a">${esc(tr('sn.'+key))}</p>${orn()}<h3 class="mp-title mp-a">${esc(mTitle(m))}</h3>${orn()}`;
  m.courses.forEach((c,ci)=>{
    const head=lang==='el'?(c.el||c.en):c.en;
    h+=`<section class="mp-c${head?'':' nohead'}">`+(head?`<h4 class="mp-a">${esc(head)}</h4>${orn(1)}`:(ci?orn(1):''));
    (c.dishes||[]).forEach(d=>{
      if(d.or){ h+=`<p class="mp-or mp-a">${esc(tr('mn.or'))}</p>`; return; }
      const n=lang==='el'?(d.el||d.en):d.en, ds=lang==='el'?(d.elD||d.enD):d.enD;
      h+=`<div class="mp-d mp-a"><b>${esc(n)}</b>${ds?`<i>${esc(ds)}</i>`:''}</div>`; });
    h+=`</section>`;
  });
  h+=`<p class="mp-f mp-a">${esc(tr('mn.f1'))}<br>${esc(tr('mn.f2'))}</p><p class="mp-ch mp-a">${esc(tr('mn.charity'))}</p><p class="mp-url mp-a">papadimitriou.uk</p></div>`;
  return h;
}
function revealMenu(paper,delay=0){   // the text settles onto the page line by line
  if(RM) return;
  [...paper.querySelectorAll('.mp-a')].forEach((el,k)=>{
    const d=delay+k*20, EZ='cubic-bezier(.16,1,.3,1)';
    if(el.classList.contains('mp-orn')){
      el.animate([{opacity:0},{opacity:1}],{duration:360,delay:d,fill:'backwards'});
      el.animate([{transform:'scaleX(.2)'},{transform:'none'}],{duration:560,delay:d,easing:EZ,fill:'backwards'});
    } else el.animate([{opacity:0,transform:'translate3d(0,8px,0)'},{opacity:1,transform:'none'}],{duration:480,delay:d,easing:EZ,fill:'backwards'});
  });
}
/* ---- growing the drawing ----
   Each menu's drawing is revealed the way the plant grows: along its stems from the ground or the
   branch, leaves unfurling as the growth passes them, fruit swelling last. A path is a list of
   points [x, y, size] (fractions of the drawing); points open one after another along the path.
   Fruit points (4th value = 1) bloom with a soft overshoot. Anything the paths miss fades in at
   the end, so the finished drawing is always exactly the menu's.                               */
const GROW={
  'art-summer.webp':[ // olive branch rises from the bottom left; peach branch reaches in from the top right
    {at:0,   pts:[[.07,.88,.09],[.08,.79,.12],[.07,.69,.14],[.08,.59,.14],[.09,.49,.14],[.1,.39,.14],[.11,.29,.14],[.12,.2,.13],[.14,.12,.1]]},
    {at:220, pts:[[.99,.3,.08],[.93,.34,.11],[.86,.38,.12],[.76,.34,.11],[.7,.42,.1],[.84,.47,.15,1],[.74,.61,.16,1],[.88,.72,.15,1],[.85,.82,.12]]}],
  'art-summer-2.webp':[ // two peach branches grow in from either side, the peaches swell
    {at:0,   pts:[[.01,.44,.09],[.09,.39,.12],[.16,.3,.13],[.2,.19,.12],[.24,.11,.1],[.3,.4,.12],[.42,.48,.1],[.08,.74,.12],[.12,.88,.1],[.22,.62,.21,1]]},
    {at:240, pts:[[.99,.3,.08],[.9,.35,.12],[.8,.42,.12],[.72,.4,.1],[.76,.55,.17,1],[.83,.76,.16,1],[.8,.88,.1]]}],
  'art-autumn.webp':[ // the squash grows up from the ground, its vine and tendrils curl out
    {at:0,   pts:[[.26,.92,.12],[.27,.82,.14],[.28,.71,.15],[.28,.6,.15],[.27,.49,.14],[.26,.39,.13],[.26,.29,.12],[.24,.21,.1],[.16,.17,.08],[.06,.17,.08],[.06,.32,.11],[.09,.68,.13],[.06,.55,.1]]},
    {at:260, pts:[[.72,.92,.12],[.72,.8,.16],[.72,.68,.19,1],[.8,.56,.12],[.7,.47,.1],[.88,.45,.1],[.94,.6,.1]]}],
  'art-winter.webp':[
    {at:0,   pts:[[.01,.44,.09],[.09,.39,.12],[.16,.3,.13],[.2,.19,.12],[.24,.11,.1],[.08,.74,.12],[.12,.88,.1],[.18,.62,.2,1]]},
    {at:240, pts:[[.99,.3,.08],[.9,.35,.12],[.8,.42,.12],[.72,.4,.1],[.76,.55,.17,1],[.81,.76,.16,1],[.8,.88,.1]]}],
  'art-spring.webp':[ // the artichoke rises up its stem, leaves open, then the head blooms
    {at:0,   pts:[[.15,.99,.08],[.15,.9,.1],[.15,.81,.11],[.06,.8,.11],[.26,.82,.11],[.15,.71,.11],[.16,.6,.13],[.16,.44,.25,1],[.19,.27,.13,1]]},
    {at:300, pts:[[.82,.92,.08],[.8,.8,.12],[.76,.72,.11],[.82,.65,.12],[.86,.55,.12],[.9,.45,.11]]}],
  'art-events.webp':[ // the two glasses rise from their feet and meet; the vine reaches in and the grapes swell; an olive sprig
    {at:0,   pts:[[.07,.92,.08],[.09,.84,.08],[.11,.75,.09],[.13,.67,.1],[.17,.6,.1],[.4,.82,.08],[.37,.74,.08],[.33,.67,.09],[.27,.62,.12],[.2,.55,.1,1]]},
    {at:200, pts:[[.99,.18,.09],[.92,.12,.13],[.84,.17,.11],[.76,.2,.1],[.72,.27,.09],[.66,.31,.09],[.98,.3,.13],[.94,.36,.13],[.79,.38,.15,1],[.78,.47,.16,1],[.8,.56,.12,1]]},
    {at:500, pts:[[.99,.95,.07],[.93,.92,.09],[.87,.89,.1],[.82,.85,.09]]}]
};
const artImgs={};
function artImage(file){ if(!artImgs[file]){ const im=new Image(); im.decoding='async'; im.src='/'+file; artImgs[file]=im.decode?im.decode().then(()=>im,()=>im):Promise.resolve(im); } return artImgs[file]; }
function growArt(paper,file,delay=0){
  const art=paper.querySelector('.mp-art'), plan=GROW[file];
  if(!art||RM||!plan) return Promise.resolve();
  art.style.visibility='hidden';
  const cv=document.createElement('canvas'); cv.className='mp-grow'; cv.setAttribute('aria-hidden','true'); paper.prepend(cv);
  const show=()=>{ art.style.visibility=''; cv.remove(); };
  return artImage(file).then(im=>new Promise(res=>{
    const w=art.offsetWidth, h=art.offsetHeight, dpr=Math.min(2,devicePixelRatio||1);
    if(!w||!h||!im.naturalWidth){ show(); return res(); }
    cv.width=Math.round(w*dpr); cv.height=Math.round(h*dpr);
    const ctx=cv.getContext('2d'), W=cv.width, H=cv.height;
    const STEP=95, DUR=620, BLOOM=900;
    const spots=[]; plan.forEach(g=>g.pts.forEach((p,k)=>spots.push({x:p[0]*W,y:p[1]*H,r:p[2]*W,fruit:!!p[3],t:g.at+k*STEP})));
    const end=Math.max(...spots.map(s=>s.t+(s.fruit?BLOOM:DUR))), t0=performance.now()+delay;
    const back=t=>{ const c=1.5; return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2); };
    const frame=now=>{
      const t=now-t0; if(t<0){ requestAnimationFrame(frame); return; }
      ctx.globalCompositeOperation='source-over'; ctx.clearRect(0,0,W,H);
      for(const s of spots){ const p=clamp((t-s.t)/(s.fruit?BLOOM:DUR)); if(p<=0) continue;
        const r=s.r*(s.fruit?back(p):1-Math.pow(1-p,3)); if(r<=1) continue;
        const gr=ctx.createRadialGradient(s.x,s.y,r*.45,s.x,s.y,r); gr.addColorStop(0,'rgba(0,0,0,1)'); gr.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(s.x,s.y,r,0,Math.PI*2); ctx.fill(); }
      const tail=clamp((t-end+260)/520);           // whatever the paths missed settles in at the end
      if(tail>0){ ctx.globalAlpha=tail; ctx.fillStyle='#000'; ctx.fillRect(0,0,W,H); ctx.globalAlpha=1; }
      ctx.globalCompositeOperation='source-in'; ctx.drawImage(im,0,0,W,H);
      ctx.fillStyle='#a9a487'; ctx.fillRect(0,0,W,H);
      if(t<end+300) requestAnimationFrame(frame); else { show(); res(); }
    };
    requestAnimationFrame(frame);
  }),()=>{ show(); });
}
/* ---- the living drawing (WebGL) ----
   Each drawing has a growth map (*-grow.png): red = when each line of the drawing grows, measured
   along the drawn stems from the plant's roots; green = which fruit a pixel belongs to. The shader
   reveals the drawing in that order — the growing tips push forward with a glint of gold sap,
   leaves unfurl outward from where they join the stem, and when the growth reaches a fruit's
   stalk the fruit buds, swells with a spring and sways on its stem. It finishes on the exact
   drawing, then hands over to the static image.                                                 */
const GROWMAP={"art-summer.webp": {"map": "art-summer-grow.png", "fruits": [{"a": [0.13, 0.33], "t": 0.72}, {"a": [0.09, 0.53], "t": 0.463}, {"a": [0.17, 0.74], "t": 0.248}, {"a": [0.88, 0.38], "t": 0.293}, {"a": [0.8, 0.58], "t": 0.525}, {"a": [0.86, 0.7], "t": 0.644}]}, "art-summer-2.webp": {"map": "art-summer-2-grow.png", "fruits": [{"a": [0.17, 0.57], "t": 0.162}, {"a": [0.84, 0.46], "t": 0.404}, {"a": [0.79, 0.7], "t": 0.688}]}, "art-autumn.webp": {"map": "art-autumn-grow.png", "fruits": [{"a": [0.24, 0.84], "t": 0.2}, {"a": [0.74, 0.88], "t": 0.34}]}, "art-winter.webp": {"map": "art-winter-grow.png", "fruits": [{"a": [0.18, 0.58], "t": 0.251}, {"a": [0.84, 0.46], "t": 0.406}, {"a": [0.79, 0.7], "t": 0.681}]}, "art-spring.webp": {"map": "art-spring-grow.png", "fruits": [{"a": [0.21, 0.6], "t": 0.514}]}};
const GL_VS=`attribute vec2 p;varying vec2 uv;void main(){uv=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}`;
const GL_FS=`precision highp float;varying vec2 uv;
uniform sampler2D art,tmap,lab;uniform float t,asp;uniform vec2 px;
uniform vec4 fr[6];uniform vec2 fa[6];uniform int nf;
const vec3 ink=vec3(.663,.643,.529);const vec3 gold=vec3(.86,.68,.36);
float T(vec2 q){vec4 m=texture2D(tmap,q);return m.r>.995?9.:m.r*1.0039;}
float L(vec2 q){return floor(texture2D(lab,q).g*255./40.+.5);}
void main(){
  vec3 col=vec3(0.);float al=0.;
  float lb=L(uv);
  if(lb<.5){
    float tm=T(uv),e=t-tm;
    if(e>0.){
      // unfurl: freshly grown ink is drawn slightly back along the direction of growth, then slides out
      vec2 g=vec2(T(uv+vec2(px.x,0.))-T(uv-vec2(px.x,0.)),(T(uv+vec2(0.,px.y))-T(uv-vec2(0.,px.y))));
      float gl=length(g);vec2 dir=gl>1e-5&&gl<1.?g/gl:vec2(0.);
      // unfurl: new growth starts folded back towards where it joins the stem and slowly opens out,
      // turning slightly as it opens, like a leaf uncurling from its bud
      float k=1.-smoothstep(0.,.2,e); k=k*k;
      float ang=k*.55; vec2 dr=vec2(cos(ang)*dir.x-sin(ang)*dir.y,sin(ang)*dir.x+cos(ang)*dir.y);
      vec2 q=uv-dr*k*.045*vec2(1.,asp);
      float a=texture2D(art,q).a*smoothstep(0.,.09,e);
      float sap=1.-smoothstep(0.,.12,e);
      col=mix(ink,gold,sap*.28);al=a;
    }
  }
  for(int i=0;i<6;i++){ if(i>=nf)break;
    vec4 f=fr[i];  // f.x=progress, f.y=scale, f.z=angle, f.w=glow
    if(f.x<=0.)continue;
    vec2 an=fa[i];vec2 d=(uv-an)*vec2(1.,asp);
    float c=cos(-f.z),s=sin(-f.z);d=vec2(c*d.x-s*d.y,s*d.x+c*d.y)/max(f.y,.001);
    vec2 q=an+d*vec2(1.,1./asp);
    if(q.x<0.||q.y<0.||q.x>1.||q.y>1.)continue;
    if(abs(L(q)-float(i+1))>.5)continue;
    float a=texture2D(art,q).a*smoothstep(0.,.3,f.x);
    if(a>al){al=a;col=mix(ink,gold,f.w);}
  }
  gl_FragColor=vec4(col*al,al);
}`;
const imgCache={};
function loadImg(src){ if(!imgCache[src]){ const im=new Image(); im.decoding='async'; im.src=src; const p=(im.decode?im.decode():new Promise((r,j)=>{im.onload=r;im.onerror=j;})).then(()=>im,e=>{ delete imgCache[src]; throw e; }); p.catch(()=>{}); imgCache[src]=p; } return imgCache[src]; }
function growArtGL(paper,file,delay=0,quick=false){
  const art=paper.querySelector('.mp-art'), G=GROWMAP[file];
  if(!art||RM||!G) return null;
  const cv=document.createElement('canvas'); cv.className='mp-grow'; cv.setAttribute('aria-hidden','true');
  const gl=cv.getContext('webgl',{premultipliedAlpha:true,alpha:true,antialias:false});
  if(!gl) return null;
  art.style.visibility='hidden'; paper.prepend(cv);
  const show=()=>{ art.style.visibility=''; cv.remove(); try{ const x=gl.getExtension('WEBGL_lose_context'); x&&x.loseContext(); }catch(_){} };
  return Promise.all([loadImg('/'+file),loadImg('/'+G.map)]).then(([im,mp])=>new Promise(res=>{
    const w=art.offsetWidth, h=art.offsetHeight, dpr=Math.min(2,devicePixelRatio||1);
    if(!w||!h){ show(); return res(); }
    cv.width=Math.round(w*dpr); cv.height=Math.round(h*dpr); gl.viewport(0,0,cv.width,cv.height);
    const sh=(type,src)=>{ const s=gl.createShader(type); gl.shaderSource(s,src); gl.compileShader(s); if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    const pr=gl.createProgram(); gl.attachShader(pr,sh(gl.VERTEX_SHADER,GL_VS)); gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,GL_FS)); gl.linkProgram(pr); gl.useProgram(pr);
    const buf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buf); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    const loc=gl.getAttribLocation(pr,'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    const tex=(unit,img,filt,name)=>{ const tx=gl.createTexture(); gl.activeTexture(gl.TEXTURE0+unit); gl.bindTexture(gl.TEXTURE_2D,tx);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,filt); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,filt);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img); gl.uniform1i(gl.getUniformLocation(pr,name),unit); };
    tex(0,im,gl.LINEAR,'art'); tex(1,mp,gl.LINEAR,'tmap'); tex(2,mp,gl.NEAREST,'lab');
    const U=n=>gl.getUniformLocation(pr,n);
    gl.uniform1f(U('asp'),h/w); gl.uniform2f(U('px'),1.5/mp.naturalWidth,1.5/mp.naturalHeight);
    const F=G.fruits.slice(0,6); gl.uniform1i(U('nf'),F.length);
    gl.uniform2fv(U('fa'),new Float32Array(F.flatMap(f=>f.a)));
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    // a short time-lapse: the plant starts slowly, gathers pace and eases to rest; each fruit grows
    // from a small bud on its stalk to full size once the growth reaches it
    const slow=quick||file==='art-autumn.webp';
    const GROW=slow?3600:1900, FRUIT=slow?1900:1000;
    const ease=quick?(x=>1-Math.pow(1-x,2.2)):(x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2), eo=x=>1-Math.pow(1-x,3);
    const t0=performance.now()+delay, fv=new Float32Array(24), fs=F.map(()=>-1);
    let doneAt=0;
    const frame=now=>{
      const ms=now-t0; if(ms<0){ requestAnimationFrame(frame); return; }
      const tt=ease(Math.min(1,ms/GROW))*1.12;
      gl.uniform1f(U('t'),tt);
      F.forEach((f,i)=>{ if(fs[i]<0&&tt>=f.t*.97) fs[i]=ms;
        const q=fs[i]<0?0:clamp((ms-fs[i])/FRUIT), g=eo(q);
        fv[i*4]=q; fv[i*4+1]=q<=0?0:.14+.86*g;
        fv[i*4+2]=q<=0?0:(i%2?1:-1)*.06*(1-g);       // a gentle turn as it fills out on the stem
        fv[i*4+3]=(1-g)*.22; });
      gl.uniform4fv(U('fr'),fv);
      gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
      const allDone=ms>=GROW&&fs.every(s=>s>=0&&ms-s>=FRUIT);
      if(allDone&&!doneAt) doneAt=ms;
      if(!doneAt||ms-doneAt<120) requestAnimationFrame(frame); else { show(); res(); }
    };
    requestAnimationFrame(frame);
  })).catch(e=>{ console.warn('grow',e); show(); });
}
const smoothstepJS=(a,b,x)=>{ const t=clamp((x-a)/(b-a)); return t*t*(3-2*t); };
/* ---- grown from seed (frame-by-frame) ----
   For menus that have a drawn growth sequence: the plant is drawn stage by stage — seed, root,
   sprout, first leaves, bud, full plant — each stage dissolving into the next like a time-lapse,
   standing on the same spot in the soil. The last stage then settles into the menu's own drawing,
   which rises up from the ground, so it ends exactly as the menu.                                 */
const GROWSEQ={'art-spring.webp':{"sheet": "grow-spring.webp", "cell": [357, 367], "cols": 9, "n": 45, "anchor": [186.59122807017545, 357.0], "stage": [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75, 4, 4.25, 4.5, 4.75, 5, 5.25, 5.5, 5.75, 6, 6.25, 6.5, 6.75, 7, 7.25, 7.5, 7.75, 8, 8.25, 8.5, 8.75, 9, 9.25, 9.5, 9.75, 10, 10.25, 10.5, 10.75, 11], "ground": [0.27, 0.8239], "k": 0.002222, "end": {"sheet": "grow-spring-end.webp", "cell": [450, 636], "cols": 5, "n": 13, "ground": [0.3018, 0.9071], "k": 0.0026667}},'art-autumn.webp':{"sheet": "grow-autumn-1.webp", "parts": ["grow-autumn-1.webp", "grow-autumn-2.webp", "grow-autumn-3.webp"], "per": 24, "cell": [608, 607], "cols": 6, "n": 67, "anchor": [262.0, 545.5], "stage": [0, 0.167, 0.333, 0.5, 0.667, 0.833, 1, 1.167, 1.333, 1.5, 1.667, 1.833, 2, 2.167, 2.333, 2.5, 2.667, 2.833, 3, 3.167, 3.333, 3.5, 3.667, 3.833, 4, 4.167, 4.333, 4.5, 4.667, 4.833, 5, 5.167, 5.333, 5.5, 5.667, 5.833, 6, 6.167, 6.333, 6.5, 6.667, 6.833, 7, 7.167, 7.333, 7.5, 7.667, 7.833, 8, 8.167, 8.333, 8.5, 8.667, 8.833, 9, 9.167, 9.333, 9.5, 9.667, 9.833, 10, 10.167, 10.333, 10.5, 10.667, 10.833, 11], "end": {"sheet": "grow-autumn-end.webp", "cell": [450, 636], "cols": 5, "n": 29, "ground": [0.4307, 0.8656], "k": 0.0019259}, "ground": [0.42, 0.83], "k": 0.0014074},'art-winter.webp':{"sheet": "grow-peach-1.webp", "parts": ["grow-peach-1.webp", "grow-peach-2.webp", "grow-peach-3.webp"], "per": 24, "cell": [427, 507], "cols": 6, "n": 67, "anchor": [19.0, 442.0], "stage": [0, 0.167, 0.333, 0.5, 0.667, 0.833, 1, 1.167, 1.333, 1.5, 1.667, 1.833, 2, 2.167, 2.333, 2.5, 2.667, 2.833, 3, 3.167, 3.333, 3.5, 3.667, 3.833, 4, 4.167, 4.333, 4.5, 4.667, 4.833, 5, 5.167, 5.333, 5.5, 5.667, 5.833, 6, 6.167, 6.333, 6.5, 6.667, 6.833, 7, 7.167, 7.333, 7.5, 7.667, 7.833, 8, 8.167, 8.333, 8.5, 8.667, 8.833, 9, 9.167, 9.333, 9.5, 9.667, 9.833, 10, 10.167, 10.333, 10.5, 10.667, 10.833, 11], "end": {"sheet": "grow-peach-winter-end.webp", "cell": [450, 636], "cols": 5, "n": 29, "ground": [0.4776, 0.7322], "k": 0.0015222}, "ground": [0.4776, 0.7322], "k": 0.0012482},'art-summer-2.webp':{"sheet": "grow-peach-1.webp", "parts": ["grow-peach-1.webp", "grow-peach-2.webp", "grow-peach-3.webp"], "per": 24, "cell": [427, 507], "cols": 6, "n": 67, "anchor": [19.0, 442.0], "stage": [0, 0.167, 0.333, 0.5, 0.667, 0.833, 1, 1.167, 1.333, 1.5, 1.667, 1.833, 2, 2.167, 2.333, 2.5, 2.667, 2.833, 3, 3.167, 3.333, 3.5, 3.667, 3.833, 4, 4.167, 4.333, 4.5, 4.667, 4.833, 5, 5.167, 5.333, 5.5, 5.667, 5.833, 6, 6.167, 6.333, 6.5, 6.667, 6.833, 7, 7.167, 7.333, 7.5, 7.667, 7.833, 8, 8.167, 8.333, 8.5, 8.667, 8.833, 9, 9.167, 9.333, 9.5, 9.667, 9.833, 10, 10.167, 10.333, 10.5, 10.667, 10.833, 11], "end": {"sheet": "grow-peach-lunch-end.webp", "cell": [450, 637], "cols": 5, "n": 29, "ground": [0.4765, 0.7428], "k": 0.0015222}, "ground": [0.4765, 0.7428], "k": 0.0012482},'art-summer.webp':{"sheet": "grow-peach-1.webp", "parts": ["grow-peach-1.webp", "grow-peach-2.webp", "grow-peach-3.webp"], "per": 24, "cell": [427, 507], "cols": 6, "n": 67, "anchor": [19.0, 442.0], "stage": [0, 0.167, 0.333, 0.5, 0.667, 0.833, 1, 1.167, 1.333, 1.5, 1.667, 1.833, 2, 2.167, 2.333, 2.5, 2.667, 2.833, 3, 3.167, 3.333, 3.5, 3.667, 3.833, 4, 4.167, 4.333, 4.5, 4.667, 4.833, 5, 5.167, 5.333, 5.5, 5.667, 5.833, 6, 6.167, 6.333, 6.5, 6.667, 6.833, 7, 7.167, 7.333, 7.5, 7.667, 7.833, 8, 8.167, 8.333, 8.5, 8.667, 8.833, 9, 9.167, 9.333, 9.5, 9.667, 9.833, 10, 10.167, 10.333, 10.5, 10.667, 10.833, 11], "end": {"sheet": "grow-peach-aegean-end.webp", "cell": [450, 636], "cols": 5, "n": 29, "ground": [0.5076, 0.6827], "k": 0.0015222}, "ground": [0.5076, 0.6827], "k": 0.0012482}};
/* one moment of the growth: the morph frames are blended, so the plant moves continuously */
function seqDraw(ctx,sheet,S,f,gx,gy,k,alpha=1){
  const [cw,ch]=S.cell, i0=Math.floor(f), fr=f-i0;
  const one=(i,al)=>{ if(al<=.003||i<0||i>=S.n) return;
    const per=S.per||S.n, img=Array.isArray(sheet)?sheet[Math.floor(i/per)]:sheet, j=i%per, r=Math.floor(j/S.cols), c=j%S.cols;
    if(!img) return;
    ctx.globalAlpha=al*alpha; ctx.drawImage(img,c*cw,r*ch,cw,ch,gx-S.anchor[0]*k,gy-S.anchor[1]*k,cw*k,ch*k); };
  // frames are blended additively: a(1-t) + a·t = a, so the drawing never thins out between frames
  const op=ctx.globalCompositeOperation; ctx.globalCompositeOperation='lighter';
  one(i0,1-fr); one(i0+1,fr); ctx.globalAlpha=1; ctx.globalCompositeOperation=op;
}
function growSeq(paper,file,delay=0){
  const art=paper.querySelector('.mp-art'), S=GROWSEQ[file];
  if(!art||RM||!S) return null;
  const cv=document.createElement('canvas'); cv.className='mp-grow'; cv.setAttribute('aria-hidden','true');
  const ctx=cv.getContext('2d'); if(!ctx) return null;
  art.style.visibility='hidden'; paper.prepend(cv);
  const finish=()=>{ art.style.visibility=''; cv.remove(); };
  const E=S.end;
  const sheets=Promise.all((S.parts||[S.sheet]).map(f=>loadImg('/'+f)));
  return Promise.all([sheets,E?loadImg('/'+E.sheet):null,loadImg('/'+file)]).then(([sheet,endSheet,artIm])=>new Promise(res=>{
    const w=art.offsetWidth, h=art.offsetHeight, dpr=Math.min(2,devicePixelRatio||1);
    if(!w||!h){ finish(); return res(); }
    cv.width=Math.round(w*dpr); cv.height=Math.round(h*dpr);
    const W=cv.width, H=cv.height;
    let tint=null;   // the menu's drawing in its ink colour, at this canvas's resolution
    const tinted=()=>{ if(!tint){ tint=document.createElement('canvas'); tint.width=W; tint.height=H; const t=tint.getContext('2d'); t.imageSmoothingQuality='high';
      t.drawImage(artIm,0,0,W,H); t.globalCompositeOperation='source-in'; t.fillStyle=getComputedStyle(art).backgroundColor||'#a9a487'; t.fillRect(0,0,W,H); } return tint; };
    /* 1. seed → full plant (~5s), the camera easing in over the last stretch so the plant comes to
          stand exactly where the menu's artichoke is;
       2. the plant then reshapes, frame by frame, into the menu's own drawing (~1.6s);
       3. the crisp menu drawing takes over invisibly. */
    const GROW=5200, ZOOM=1600, MORPH=E&&E.n>20?2600:1600, HAND=420, last=S.n-1, t0=performance.now()+delay;
    const pace=p=>1-Math.pow(1-p,1.25), sm=x=>x*x*(3-2*x), eio=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
    const g0=S.ground, k0=S.k, g1=E?E.ground:g0, k1=E?E.k:k0;
    const frame=now=>{
      const ms=Math.max(0,now-t0); ctx.clearRect(0,0,W,H);
      if(ms<GROW+120||!E){
        const p=clamp(ms/GROW), z=eio(clamp((ms-(GROW-ZOOM))/ZOOM));
        const gx=(g0[0]+(g1[0]-g0[0])*z)*W, gy=(g0[1]+(g1[1]-g0[1])*z)*H, k=(k0+(k1-k0)*z)*W;
        const out=E?sm(clamp((ms-GROW)/120)):0;
        seqDraw(ctx,sheet,S,pace(p)*last,gx,gy,k,(ms<180?sm(ms/180):1)*(1-out));
      }
      if(E&&ms>=GROW){
        const q=clamp((ms-GROW)/MORPH), f=eio(q)*(E.n-1), i0=Math.floor(f), fr=f-i0, [cw,ch]=E.cell;
        const one=(i,al)=>{ if(al<=.003||i>=E.n) return; const r=Math.floor(i/E.cols), c=i%E.cols;
          ctx.globalAlpha=al; ctx.drawImage(endSheet,c*cw,r*ch,cw,ch,0,0,W,H); };
        const fadeIn=sm(clamp((ms-GROW)/120)), handOut=sm(clamp((ms-GROW-MORPH)/HAND));
        // the last morph frame dissolves into the menu's own drawing inside this canvas (added, not
        // layered, so nothing dips or doubles); the canvas then ends identical to the drawing and
        // swaps for it without a visible change
        ctx.save(); ctx.globalCompositeOperation='lighter';
        one(i0,(1-fr)*fadeIn*(1-handOut)); one(i0+1,fr*fadeIn*(1-handOut));
        if(handOut>0){ ctx.globalAlpha=handOut; ctx.drawImage(tinted(),0,0,W,H); }
        ctx.restore();
      }
      if(ms<GROW+(E?MORPH+HAND:0)) requestAnimationFrame(frame); else { finish(); res(); }
    };
    frame(performance.now()); requestAnimationFrame(frame);
  })).catch(e=>{ console.warn('grow',e); finish(); });
}

/* ---- seed to seedling, then the menu's own plant grows out of it ----
   For plants grown from seed (the squash): the seed, its root, the shoot and the first two seed
   leaves are drawn stage by stage (the same pencil stages as the artichoke), standing where the
   plant meets the soil. As the seed leaves open, the menu's drawing takes over and grows up out of
   the seedling — vine, leaves and tendrils unfurling, the fruit swelling from the ground — ending
   exactly on the menu.                                                                             */
const SPROUT={};   // (the squash now grows from its own drawing; a drawn growth sheet can be added here later)
function growSprout(paper,file,delay=0){
  const art=paper.querySelector('.mp-art'), P=SPROUT[file], S=GROWSEQ['art-spring.webp'];
  if(!art||RM||!P||!S||!GROWMAP[file]) return null;
  const cv=document.createElement('canvas'); cv.className='mp-grow'; cv.setAttribute('aria-hidden','true');
  const ctx=cv.getContext('2d'); if(!ctx) return null;
  art.style.opacity='0'; paper.prepend(cv);
  const END=S.stage.indexOf(3);                  // seed → root → shoot → two seed leaves
  const LEAD=2200, OUT=900, HAND=LEAD-500;
  return loadImg('/'+S.sheet).then(sheet=>new Promise(res=>{
    const w=art.offsetWidth, h=art.offsetHeight, dpr=Math.min(2,devicePixelRatio||1);
    if(!w||!h){ art.style.opacity=''; cv.remove(); return res(); }
    cv.width=Math.round(w*dpr); cv.height=Math.round(h*dpr);
    const W=cv.width, H=cv.height, gx=P.ground[0]*W, gy=P.ground[1]*H, k=P.k*W;
    const sm=x=>x*x*(3-2*x), t0=performance.now()+delay; let handed=false;
    const frame=now=>{
      const ms=Math.max(0,now-t0); ctx.clearRect(0,0,W,H);
      const p=clamp(ms/LEAD), out=sm(clamp((ms-HAND)/OUT));
      seqDraw(ctx,sheet,S,(1-Math.pow(1-p,1.3))*END,gx,gy,k,(ms<180?sm(ms/180):1)*(1-out));
      if(!handed&&ms>=HAND){ handed=true; art.style.opacity=''; growArtGL(paper,file,0,true)||growArt(paper,file,0); }
      if(ms<HAND+OUT) requestAnimationFrame(frame); else { cv.remove(); res(); }
    };
    frame(performance.now()); requestAnimationFrame(frame);
  })).catch(e=>{ console.warn('grow',e); art.style.opacity=''; cv.remove(); });
}
function growArtAny(paper,file,delay){ return (!SLOW&&(growSprout(paper,file,delay)||growSeq(paper,file,delay)))||growArtGL(paper,file,delay)||growArt(paper,file,delay); }
const growLen=file=>{ const S=GROWSEQ[file]; if(!S) return 3000; let t=0; S.frames.forEach((_,i)=>t+=300+i*22+420); return t+600; };
function openMenu(card){
  if(menuV||viewer) return;
  cancelAnimationFrame(offAnim); offAnim=0;
  const menus=card._menus, N=menus.length, key=card.dataset.season;
  const v=document.createElement('div'); v.className='mv'; v.setAttribute('role','dialog'); v.setAttribute('aria-modal','true');
  v.setAttribute('aria-label',tr('sn.'+key));
  v.innerHTML=`<div class="mv-bg"></div>
    <div class="mv-top"><div class="mv-t"><span class="mv-season"></span><span class="mv-count"></span></div><button type="button" class="mv-x" aria-label="${esc(tr('lg.close'))}">✕</button></div>
    <div class="mv-rail"></div>
    ${N>1?'<button type="button" class="mv-arw mv-prev" aria-label="Previous">←</button><button type="button" class="mv-arw mv-next" aria-label="Next">→</button>':''}
    <div class="mv-foot"><div class="mv-meta"><div class="mv-dots"></div><p class="mv-hint"></p></div><button type="button" class="mv-plan"><span></span><i aria-hidden="true">→</i></button></div>`;
  const rail=v.querySelector('.mv-rail'), bg=v.querySelector('.mv-bg'), top=v.querySelector('.mv-top'), foot=v.querySelector('.mv-foot');
  const seasonEl=v.querySelector('.mv-season'), countEl=v.querySelector('.mv-count'), hintEl=v.querySelector('.mv-hint');
  const dotsEl=v.querySelector('.mv-dots'), plan=v.querySelector('.mv-plan'), prev=v.querySelector('.mv-prev'), next=v.querySelector('.mv-next');
  const slides=menus.map((m,k)=>{ const s=document.createElement('div'); s.className='mv-slide';
    const p=document.createElement('div'); p.className='mv-page';
    const paper=document.createElement('article'); paper.className='mp'; paper.setAttribute('aria-label',mTitle(m)); paper.innerHTML=menuHTML(m,key);
    const art=paper.querySelector('.mp-art'), A=m.art&&okImg(m.art)?`url("/${m.art}")`:'';
    if(A){ art.style.webkitMaskImage=A; art.style.maskImage=A; if(!RM) art.style.visibility='hidden'; } else art.remove();
    p.append(paper); s.append(p); rail.append(s); return {s,p,paper,art:A?art:null,seen:k===0}; });
  const dots=N>1?menus.map((m,k)=>{ const b=document.createElement('button'); b.type='button'; b.setAttribute('aria-label',mTitle(m)); b.onclick=()=>go(k); dotsEl.append(b); return b; }):[];
  let cur=0;
  const setUI=()=>{ seasonEl.textContent=tr('sn.'+key); countEl.textContent=N>1?`${cur+1} / ${N}`:'';
    hintEl.textContent=N>1?tr('mv.swipe'):tr('mv.note'); hintEl.classList.toggle('solo',N<2); plan.querySelector('span').textContent=tr('mv.plan');
    dots.forEach((d,k)=>d.classList.toggle('on',k===cur)); if(prev){ prev.disabled=cur===0; next.disabled=cur===N-1; }
    slides.forEach((sl,k)=>sl.s.setAttribute('aria-hidden',String(k!==cur))); };
  /* paper size: on wide screens a full menu page that fits the height; on phones the full width,
     growing taller (and scrolling) so the text never gets small */
  const fit=()=>{ const w=rail.clientWidth, h=rail.clientHeight;
    const pw=w<620?w-24:Math.min(w-48,640,(h-20)*MENU_RATIO);
    v.style.setProperty('--pw',pw.toFixed(1)+'px'); v.style.setProperty('--ph',(pw/MENU_RATIO).toFixed(1)+'px'); };
  /* paging: drag follows the finger, letting go settles on the nearest menu */
  let dragX=0, wheelT=null;
  const place=(px,anim)=>{ const W=rail.clientWidth;
    slides.forEach((sl,k)=>{ const x=(k-cur)*W+px, to=`translate3d(${x.toFixed(1)}px,0,0)`;
      if(anim&&!RM) sl.s.animate([{transform:sl.s.style.transform||'none'},{transform:to}],{duration:560,easing:'cubic-bezier(.16,1,.3,1)'});
      sl.s.style.transform=to; }); };
  function go(k){ k=clamp(k,0,N-1); const was=cur; cur=k; place(0,was!==k||dragX!==0); dragX=0; setUI();
    const sl=slides[cur]; if(!sl.seen){ sl.seen=true; growArtAny(sl.paper,menus[cur].art,0); revealMenu(sl.paper,120); } }
  let ds=null, dragged=false;
  rail.addEventListener('pointerdown',e=>{ if(e.pointerType==='mouse'&&e.button!==0) return;
    ds={id:e.pointerId,x:e.clientX,y:e.clientY,t:performance.now(),mode:''}; dragged=false; });
  rail.addEventListener('pointermove',e=>{ if(!ds||e.pointerId!==ds.id) return;
    const dx=e.clientX-ds.x, dy=e.clientY-ds.y;
    if(!ds.mode){ if(Math.abs(dx)<8&&Math.abs(dy)<8) return; ds.mode=Math.abs(dx)>Math.abs(dy)?(N>1?'h':'x'):'v';
      if(ds.mode==='v'&&e.pointerType==='mouse'&&dy>0&&slides[cur].s.scrollTop<=0) ds.mode='d';
      if(ds.mode==='h'||ds.mode==='d'){ try{rail.setPointerCapture(e.pointerId)}catch(_){} } }
    if(ds.mode==='d'){ dragged=true; pull(dy); return; }
    if(ds.mode!=='h') return;
    dragged=true; dragX=dx; if((cur===0&&dx>0)||(cur===N-1&&dx<0)) dragX=dx*.35; place(dragX,false); });
  const endDrag=e=>{ if(!ds||(e&&e.pointerId!==ds.id)) return; const s=ds; ds=null;
    if(s.mode==='d'){ release(pullY/Math.max(1,performance.now()-s.t)); setTimeout(()=>dragged=false,60); return; }
    if(s.mode!=='h') return;
    const W=rail.clientWidth, vel=dragX/Math.max(1,performance.now()-s.t), fast=Math.abs(vel)>.45&&Math.abs(dragX)>30;
    go(cur+((dragX<-W*.2||(fast&&dragX<0))?1:(dragX>W*.2||(fast&&dragX>0))?-1:0)); setTimeout(()=>dragged=false,60); };
  rail.addEventListener('pointerup',endDrag); rail.addEventListener('pointercancel',endDrag);
  /* swipe down to close: the menu follows your finger down, shrinking a touch, and the dark
     backdrop thins so the page shows through; let go past the threshold (or flick) to close,
     otherwise it springs back. Works when the menu is scrolled to its top. */
  let pullY=0;
  const pull=dy=>{ pullY=Math.max(0,dy); const r=pullY>0?pullY*(1-Math.min(.5,pullY/(innerHeight*2.2))):0, k=Math.min(1,r/(innerHeight*.6));
    const P=slides[cur].paper; P.style.transformOrigin='50% 0%';
    P.style.transform=`perspective(1400px) translate3d(0,${r.toFixed(1)}px,0) rotateX(${(k*22).toFixed(2)}deg) scale(${(1-.16*k).toFixed(4)})`;
    P.style.boxShadow=`0 ${(40+k*60).toFixed(0)}px ${(90+k*60).toFixed(0)}px -30px rgba(0,0,0,${(.85).toFixed(2)})`;
    bg.style.opacity=(1-.55*k).toFixed(3); top.style.opacity=foot.style.opacity=(1-k*1.6).toFixed(3); };
  const release=vel=>{ const p=slides[cur].paper;
    if(pullY>Math.min(140,innerHeight*.18)||vel>.6&&pullY>40){ close(false,true); return; }
    const from=p.style.transform||'none'; p.style.transform=''; p.style.boxShadow=''; bg.style.opacity=''; top.style.opacity=foot.style.opacity='';
    if(!RM) p.animate([{transform:from},{transform:'none'}],{duration:520,easing:'cubic-bezier(.16,1,.3,1)'});
    pullY=0; };
  let ts=null;
  rail.addEventListener('touchstart',e=>{ if(e.touches.length!==1) return; const t=e.touches[0];
    ts={x:t.clientX,y:t.clientY,t:performance.now(),mode:'',top:slides[cur].s.scrollTop<=0}; },{passive:true});
  rail.addEventListener('touchmove',e=>{ if(!ts) return; const t=e.touches[0], dx=t.clientX-ts.x, dy=t.clientY-ts.y;
    if(!ts.mode){ if(Math.abs(dx)<8&&Math.abs(dy)<8) return; ts.mode=(dy>0&&dy>Math.abs(dx)*1.2&&ts.top&&slides[cur].s.scrollTop<=0)?'d':'-'; }
    if(ts.mode!=='d') return; e.preventDefault(); dragged=true; pull(dy); },{passive:false});
  const tEnd=()=>{ if(!ts) return; const s=ts; ts=null; if(s.mode==='d'){ release(pullY/Math.max(1,performance.now()-s.t)); setTimeout(()=>dragged=false,60); } };
  rail.addEventListener('touchend',tEnd); rail.addEventListener('touchcancel',tEnd);
  rail.addEventListener('wheel',e=>{ if(N<2||Math.abs(e.deltaX)<=Math.abs(e.deltaY)||Math.abs(e.deltaX)<18) return; e.preventDefault();
    if(wheelT) return; wheelT=setTimeout(()=>wheelT=null,560); go(cur+(e.deltaX>0?1:-1)); },{passive:false});
  slides.forEach(sl=>sl.p.addEventListener('click',e=>{ if(e.target===sl.p&&!dragged) close(); }));
  if(prev){ prev.onclick=()=>go(cur-1); next.onclick=()=>go(cur+1); }
  v.querySelector('.mv-x').onclick=()=>close();
  plan.onclick=()=>{
    const msg=$('#f-msg'), txt=tr('mv.msg',{t:mTitle(menus[cur]),s:tr('sn.'+key)});
    if(msg&&(!msg.value.trim()||msg.value===msg.dataset.auto)){ msg.value=txt; msg.dataset.auto=txt; }
    close(true,false,()=>goTo('#contact'));
  };
  function key2(e){ if(e.key==='Escape') close(); else if(e.key==='ArrowRight') go(cur+1); else if(e.key==='ArrowLeft') go(cur-1);
    else if(e.key==='Tab'){ const f=[...v.querySelectorAll('button:not([disabled])')].filter(b=>b.offsetParent); if(!f.length) return;
      const i=f.indexOf(document.activeElement); if(e.shiftKey&&i<=0){ e.preventDefault(); f[f.length-1].focus(); } else if(!e.shiftKey&&i===f.length-1){ e.preventDefault(); f[0].focus(); } } }
  const onResize=()=>{ fit(); place(0,false); };
  addEventListener('keydown',key2); addEventListener('resize',onResize);

  document.body.append(v); document.documentElement.classList.add('locked'); menuV={close};
  fit(); place(0,false); setUI();
  const cr=card.getBoundingClientRect(), E1='cubic-bezier(.2,.8,.2,1)';
  const cardClip=r=>`inset(${r.top.toFixed(1)}px ${(innerWidth-r.right).toFixed(1)}px ${(innerHeight-r.bottom).toFixed(1)}px ${r.left.toFixed(1)}px round 22px)`;
  /* the opening, choreographed like the rest of the site:
     1. the dark backdrop blooms out in a circle from the card,
     2. the card itself lifts and unfolds into the menu paper — growing from the card's exact size and
        place, its corners sharpening and its dark olive turning to cream,
     3. the season's name flies from the card up to the top of the screen,
     4. a gold hairline draws around the page while the produce grows and the menu is written in. */
  const cx=cr.left+cr.width/2, cy=cr.top+cr.height/2, R=Math.hypot(Math.max(cx,innerWidth-cx),Math.max(cy,innerHeight-cy))+20;
  if(RM) bg.animate([{opacity:0},{opacity:1}],{duration:1,fill:'forwards'});
  else { const r0=Math.min(cr.width,cr.height)*.42;
    bg.animate([{clipPath:`circle(${r0}px at ${cx}px ${cy}px)`,opacity:.85},{clipPath:`circle(${R}px at ${cx}px ${cy}px)`,opacity:1}],{duration:820,easing:'cubic-bezier(.7,0,.2,1)',fill:'forwards'});
    goldRing(v,cx,cy,r0,R,820,false); }
  [foot,prev,next].filter(Boolean).forEach(el=>el.animate([{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'none'}],{duration:RM?1:520,delay:RM?0:560,easing:'cubic-bezier(.16,1,.3,1)',fill:'forwards'}));
  top.animate([{opacity:0},{opacity:1}],{duration:RM?1:300,delay:RM?0:420,fill:'forwards'});
  if(!RM){
    // the season's name flies from the card to the top bar
    const h3=card.querySelector('h3'), hr=h3&&h3.getBoundingClientRect(), tr2=seasonEl.getBoundingClientRect();
    if(hr&&hr.width&&tr2.width){
      const fl=document.createElement('span'); fl.textContent=h3.textContent; fl.setAttribute('aria-hidden','true');
      const fs=parseFloat(getComputedStyle(h3).fontSize), ts=parseFloat(getComputedStyle(seasonEl).fontSize);
      Object.assign(fl.style,{position:'fixed',left:tr2.left+'px',top:tr2.top+'px',zIndex:4,font:getComputedStyle(seasonEl).font,color:'#d6b679',fontStyle:'italic',transformOrigin:'0 0',pointerEvents:'none',whiteSpace:'nowrap',lineHeight:getComputedStyle(seasonEl).lineHeight});
      v.append(fl); seasonEl.style.opacity='0';
      const k0=fs/ts;
      fl.animate([{transform:`translate(${(hr.left-tr2.left).toFixed(1)}px,${(hr.top-tr2.top).toFixed(1)}px) scale(${k0.toFixed(3)})`,color:'#f4eee5',fontStyle:'normal'},
                  {transform:'none',color:'#d6b679'}],{duration:820,delay:60,easing:'cubic-bezier(.65,0,.2,1)',fill:'backwards'})
        .finished.then(()=>{ seasonEl.style.opacity=''; fl.remove(); },()=>{ seasonEl.style.opacity=''; fl.remove(); });
    }
  }
  // the opening: paper settles, the card's drawing lifts out and lands on it, then the menu is written in
  // the opening: the card opens out, a sheet of menu paper settles, the season's produce grows on it
  // from the ground or the branch, then the menu is written in
  const S0=SEAS&&SEAS.find(s=>s.card===card), srcM=S0&&S0.mask, first=slides[0];
  if(RM) first.paper.animate([{opacity:0},{opacity:1}],{duration:1});
  else {
    // the card lifts, flies to the centre and turns over into the page
    const p=first.paper, pr=p.getBoundingClientRect();
    p.style.backfaceVisibility='hidden'; p.style.willChange='transform';
    const EF='cubic-bezier(.55,0,.2,1)';
    p.animate(flipKeys(cr,pr,'card'),{duration:1050,delay:30,easing:EF,fill:'backwards'})
      .finished.then(()=>{ p.style.willChange=''; },()=>{});
    p.animate([{opacity:0,offset:0},{opacity:0,offset:.5},{opacity:1,offset:.5001},{opacity:1,offset:1}],{duration:1050,delay:30,easing:EF,fill:'backwards'});
    cardFace(card,cr,pr,v,'open',1050,30,EF);
    card.style.visibility='hidden'; setTimeout(()=>{ if(menuV) card.style.visibility=''; },1100);
    // the page's contents fade up as it opens, so the seed is there the moment the page is
    [...p.children].filter(c=>!c.classList.contains('mp-art')&&!c.classList.contains('mp-grow')).forEach(c=>c.animate([{opacity:0},{opacity:1}],{duration:460,delay:640,easing:'ease',fill:'backwards'}));
    // a gold hairline draws around the page, then fades
    setTimeout(()=>{ if(!menuV) return; const r=pr, vr=rail.getBoundingClientRect();
      const ns='http://www.w3.org/2000/svg', s=document.createElementNS(ns,'svg'), rc=document.createElementNS(ns,'rect');
      Object.assign(s.style,{position:'fixed',left:(r.left-6)+'px',top:(Math.max(r.top,vr.top)-6)+'px',width:(r.width+12)+'px',height:(Math.min(r.bottom,innerHeight)-Math.max(r.top,vr.top)+12)+'px',zIndex:3,pointerEvents:'none',overflow:'visible'});
      rc.setAttribute('x','.5'); rc.setAttribute('y','.5'); rc.setAttribute('width',r.width+11); rc.setAttribute('height',Math.min(r.bottom,innerHeight)-Math.max(r.top,vr.top)+11);
      rc.setAttribute('rx','6'); rc.setAttribute('fill','none'); rc.setAttribute('stroke','#d6b679'); rc.setAttribute('stroke-width','1'); rc.setAttribute('pathLength','1');
      rc.style.strokeDasharray='1'; s.setAttribute('class','mv-line'); s.setAttribute('aria-hidden','true'); s.append(rc); v.append(s);
      rc.animate([{strokeDashoffset:1},{strokeDashoffset:0}],{duration:900,easing:'cubic-bezier(.65,0,.35,1)',fill:'forwards'});
      s.animate([{opacity:1,offset:0},{opacity:1,offset:.6},{opacity:0,offset:1}],{duration:1500,fill:'forwards'}).finished.then(()=>s.remove(),()=>s.remove());
    },980);
  }
  if(srcM&&!RM) srcM.animate([{opacity:.6},{opacity:0}],{duration:260,fill:'forwards'}).finished.then(()=>srcM.getAnimations().forEach(x=>x.cancel()),()=>{});
  if(RM) revealMenu(first.paper,0);
  else { growArtAny(first.paper,menus[0].art,620); revealMenu(first.paper,820); }
  v.querySelector('.mv-x').focus({preventScroll:true});

  /* closing: the text lifts away, then the page itself glides back down into its card, shrinking
     to the card's shape as the dark backdrop folds back into the card's outline. The card's own
     drawing takes over as the page lands, and the card's border glows briefly. */
  /* closing — the same move in reverse, whether from ✕, Esc or a swipe down: the menu text lifts
     away, the page flies home turning back over into the dark card, the backdrop collapses into
     the card with the gold ring closing in, and the card glows as it lands. */
  function close(quiet,fromPull,then){
    const plan=!!then;
    if(!menuV) return; menuV=null;
    v.querySelectorAll(':scope > .card').forEach(n=>n.remove());          // a stand-in still flying from the opening
    const sl=slides[cur], p=sl.paper; card.style.visibility='';
    slides.forEach(x=>x.paper.getAnimations().forEach(an=>{ if(an.effect&&an.effect.getKeyframes().some(k=>k.transform)) an.finish(); }));
    bg.getAnimations().forEach(an=>an.finish());
    removeEventListener('keydown',key2); removeEventListener('resize',onResize);
    if(!RM){ const sh=cardShift(card); if(sh) nudgeCards(sh); }   // unseen: the backdrop still covers the page
    const a=card.getBoundingClientRect();
    const onScreen=!plan&&a.width&&a.top>-a.height*.25&&a.bottom<innerHeight+a.height*.25&&a.right>0&&a.left<innerWidth;
    v.style.pointerEvents='none';
    [top,foot,prev,next].filter(Boolean).forEach(el=>el.animate([{opacity:getComputedStyle(el).opacity},{opacity:0}],{duration:220,fill:'forwards'}));
    const done=()=>{ v.remove(); card.style.visibility=''; document.documentElement.classList.remove('locked');
      if(!quiet) card.querySelector('.s-cta').focus({preventScroll:true}); if(then) then(); };
    if(RM||!onScreen){
      p.animate([{opacity:1},{opacity:0}],{duration:RM?1:300,fill:'forwards'});
      bg.animate([{opacity:getComputedStyle(bg).opacity},{opacity:0}],{duration:RM?1:420,fill:'forwards'}).finished.then(done,done); return; }
    // 1) the writing lifts off the page
    [...p.children].forEach(c=>c.animate([{opacity:1,transform:'none'},{opacity:0,transform:'translate3d(0,-10px,0)'}],{duration:220,easing:'ease',fill:'forwards'}));
    // 2) the page flies home and turns back into the card — from wherever it is (pulled down or not)
    const pulled=fromPull?pullY:0, rx=fromPull?Math.min(1,(pulled*(1-Math.min(.5,pulled/(innerHeight*2.2))))/(innerHeight*.6))*22:0;
    const now=p.getBoundingClientRect();
    p.style.transform=''; p.style.boxShadow=''; p.style.transformOrigin='';
    sl.s.style.overflow='visible'; rail.style.overflow='visible'; sl.s.scrollTop=0;
    const base=p.getBoundingClientRect();
    p.style.backfaceVisibility='hidden';
    // start exactly where the page is on screen: scrolled down a long menu, or pulled down by a finger
    const ks=now.width/base.width;
    const keys=flipKeys(a,base,'page',{dx:now.left+now.width/2-(base.left+base.width/2),dy:now.top+now.height/2-(base.top+base.height/2),k:ks,rx});
    const D=900, E='cubic-bezier(.55,0,.2,1)';
    const fly=p.animate(keys,{duration:D,delay:90,easing:E,fill:'both'});
    p.animate([{opacity:1,offset:0},{opacity:1,offset:.4999},{opacity:0,offset:.5},{opacity:0,offset:1}],{duration:D,delay:90,easing:E,fill:'both'});
    const face=cardFace(card,a,base,v,'close',D,90,E); card.style.visibility='hidden';
    // 3) the backdrop collapses into the card, a gold ring closing in with it
    const cx=a.left+a.width/2, cy=a.top+a.height/2, R=Math.hypot(Math.max(cx,innerWidth-cx),Math.max(cy,innerHeight-cy))+20, r0=Math.min(a.width,a.height)*.42;
    bg.animate([{clipPath:`circle(${R}px at ${cx}px ${cy}px)`,opacity:getComputedStyle(bg).opacity},{clipPath:`circle(${r0}px at ${cx}px ${cy}px)`,opacity:.85,offset:.92},{clipPath:`circle(${r0}px at ${cx}px ${cy}px)`,opacity:0}],
      {duration:D+60,delay:120,easing:'cubic-bezier(.6,0,.3,1)',fill:'forwards'});
    goldRing(v,cx,cy,r0,R,D,true);
    // 4) the card glows as the page lands back in it
    setTimeout(()=>card.animate([{borderColor:'rgba(214,182,121,.95)',boxShadow:'0 0 0 1px rgba(214,182,121,.55),0 30px 70px -30px rgba(214,182,121,.45)'},{borderColor:'',boxShadow:'none'}],{duration:900,easing:'ease-out'}),D+40);
    fly.finished.then(done,done);
  }
}

/* ===================== date picker =====================
   A calendar in the site's own style: opens under the field on larger screens and as a sheet
   from the bottom on phones. Months slide, days ease in, past dates are disabled. The chosen
   date is stored as YYYY-MM-DD in a hidden field, exactly what the enquiry API expects.     */
const dpBtn=$('#f-date'), dpVal=dpBtn.querySelector('.dp-val'), dpInput=$('#f-date-v'), dpField=dpBtn.closest('.f');
let dp=null, dpSel=null;
const ymd=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const today0=()=>{ const t=new Date(); t.setHours(0,0,0,0); return t; };
const dpMax=()=>{ const t=today0(); t.setFullYear(t.getFullYear()+3); t.setDate(t.getDate()-2); return t; };
const dpLoc=()=>lang==='el'?'el-GR':'en-GB';
const sameDay=(a,b)=>a&&b&&a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
function dpLabel(anim){
  dpVal.textContent=dpSel?new Intl.DateTimeFormat(dpLoc(),{weekday:'short',day:'numeric',month:'long',year:'numeric'}).format(dpSel):tr('dp.ph');
  dpVal.classList.toggle('is-ph',!dpSel);
  if(anim&&!RM) dpVal.animate([{opacity:0,transform:'translateY(9px)'},{opacity:1,transform:'none'}],{duration:520,easing:'cubic-bezier(.16,1,.3,1)'});
}
function dpSet(d,anim=true){ dpSel=d; dpInput.value=d?ymd(d):''; dpLabel(anim); if(d) dpField.classList.remove('bad'); }
form.addEventListener('reset',()=>{ dpSet(null,false); const m=$('#f-msg'); if(m) delete m.dataset.auto; });
dpBtn.addEventListener('click',()=>dp?dpClose(true):dpOpen());
dpBtn.addEventListener('keydown',e=>{ if(e.key==='ArrowDown'&&!dp){ e.preventDefault(); dpOpen(); } });

/* A popup opens downwards, or upwards when there isn't room below it on screen. */
function fitPopup(panel,field){
  const fr=field.getBoundingClientRect(), ph=panel.offsetHeight, below=innerHeight-fr.bottom-12, above=fr.top-70;
  if(ph>below&&above>below){ panel.classList.add('up'); return true; } return false;
}
/* Popups (dropdowns, date picker) close if the page is scrolled underneath them — after a small,
   deliberate scroll, so a tiny nudge or the browser settling doesn't shut them. */
const SCROLL_CLOSE=56;
function closeOnScroll(close){
  let y0=scrollY, armed=false; const arm=setTimeout(()=>{ armed=true; y0=scrollY; },300);
  const on=()=>{ if(armed&&Math.abs(scrollY-y0)>SCROLL_CLOSE) close(); };
  addEventListener('scroll',on,{passive:true});
  return ()=>{ clearTimeout(arm); removeEventListener('scroll',on); };
}
function dpOpen(){
  if(dp) return;
  if(typeof CS!=='undefined') CS.forEach(o=>csClose(o,false));
  const sheet=innerWidth<600;
  const w=document.createElement('div'); w.className='dp'+(sheet?' dp-sheet':''); w.setAttribute('role','dialog'); w.setAttribute('aria-label',tr('dp.title'));
  if(sheet) w.setAttribute('aria-modal','true');
  w.innerHTML=`<div class="dp-title">${esc(tr('dp.title'))}</div>
    <div class="dp-head"><button type="button" class="dp-nav dp-p" aria-label="${esc(tr('dp.prev'))}"><svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M9 2L4 7l5 5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button>
    <div class="dp-mwrap"><div class="dp-month" aria-live="polite"></div></div>
    <button type="button" class="dp-nav dp-n" aria-label="${esc(tr('dp.next'))}"><svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M5 2l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button></div>
    <div class="dp-wd" aria-hidden="true"></div><div class="dp-gwrap"></div>
    <div class="dp-foot"><button type="button" class="dp-today">${esc(tr('dp.today'))}</button><button type="button" class="dp-clear">${esc(tr('dp.clear'))}</button></div>`;
  const wd=w.querySelector('.dp-wd'), gwrap=w.querySelector('.dp-gwrap'), mwrap=w.querySelector('.dp-mwrap');
  const pBtn=w.querySelector('.dp-p'), nBtn=w.querySelector('.dp-n');
  const wdf=new Intl.DateTimeFormat(dpLoc(),{weekday:'short'});
  for(let i=0;i<7;i++){ const s=document.createElement('span'); s.textContent=wdf.format(new Date(2024,0,1+i)).replace('.','').slice(0,lang==='el'?3:2); wd.append(s); }
  let scrim=null;
  if(sheet){ scrim=document.createElement('div'); scrim.className='dp-scrim'; scrim.onclick=()=>dpClose(true); document.body.append(scrim,w); }
  else { dpField.append(w); dpField.classList.add('open');
    const fr=form.getBoundingClientRect(), wr=w.getBoundingClientRect(); if(wr.right>fr.right-6) w.classList.add('dp-r'); }
  const t0=today0(), mx=dpMax();
  let view=new Date((dpSel||t0).getFullYear(),(dpSel||t0).getMonth(),1), focusD=dpSel||t0, grid=null;
  const monthName=d=>{ const s=new Intl.DateTimeFormat(dpLoc(),{month:'long',year:'numeric'}).format(d); return s.charAt(0).toUpperCase()+s.slice(1); };
  const longFmt=new Intl.DateTimeFormat(dpLoc(),{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  function build(dir){
    const g=document.createElement('div'); g.className='dp-grid'; g.setAttribute('role','group'); g.setAttribute('aria-label',monthName(view));
    const lead=(new Date(view.getFullYear(),view.getMonth(),1).getDay()+6)%7, days=new Date(view.getFullYear(),view.getMonth()+1,0).getDate();
    for(let i=0;i<42;i++){
      const n=i-lead+1;
      if(n<1||n>days){ const e=document.createElement('span'); e.className='dp-e'; g.append(e); continue; }
      const d=new Date(view.getFullYear(),view.getMonth(),n), b=document.createElement('button');
      b.type='button'; b.className='dp-d'; b.innerHTML=`<span>${n}</span>`; b.dataset.d=ymd(d); b.tabIndex=-1;
      b.setAttribute('aria-label',longFmt.format(d));
      if(d<t0||d>mx) b.disabled=true;
      if(sameDay(d,t0)){ b.classList.add('today'); b.setAttribute('aria-current','date'); }
      if(sameDay(d,dpSel)){ b.classList.add('sel'); b.setAttribute('aria-pressed','true'); }
      g.append(b);
    }
    const old=grid; grid=g; gwrap.append(g);
    const label=document.createElement('div'); label.className='dp-month'; label.textContent=monthName(view);
    const oldL=mwrap.querySelector('.dp-month'); mwrap.append(label);
    pBtn.disabled=view.getFullYear()*12+view.getMonth()<=t0.getFullYear()*12+t0.getMonth();
    nBtn.disabled=view.getFullYear()*12+view.getMonth()>=mx.getFullYear()*12+mx.getMonth();
    const EZ='cubic-bezier(.16,1,.3,1)';
    if(old){
      old.classList.add('leaving');
      if(RM){ old.remove(); oldL&&oldL.remove(); }
      else {
        old.animate([{transform:'none',opacity:1},{transform:`translateX(${-dir*28}%)`,opacity:0}],{duration:300,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'}).finished.then(()=>old.remove(),()=>old.remove());
        g.animate([{transform:`translateX(${dir*28}%)`,opacity:0},{transform:'none',opacity:1}],{duration:460,easing:EZ});
        if(oldL){ oldL.animate([{transform:'none',opacity:1},{transform:`translateY(${-dir*100}%)`,opacity:0}],{duration:280,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'}).finished.then(()=>oldL.remove(),()=>oldL.remove());
          label.animate([{transform:`translateY(${dir*100}%)`,opacity:0},{transform:'none',opacity:1}],{duration:440,easing:EZ}); }
      }
    } else {
      oldL&&oldL.remove();
      if(!RM) [...g.children].forEach((c,i)=>c.animate([{opacity:0,transform:'translateY(6px) scale(.9)'},{opacity:1,transform:'none'}],{duration:420,delay:120+Math.floor(i/7)*34+(i%7)*8,easing:EZ,fill:'backwards'}));
    }
    rove();
  }
  function rove(){ // one day is tabbable: the focused / selected / first available day
    const btns=[...grid.querySelectorAll('.dp-d')]; let b=btns.find(x=>x.dataset.d===ymd(focusD)&&!x.disabled)||btns.find(x=>x.classList.contains('sel'))||btns.find(x=>!x.disabled);
    btns.forEach(x=>x.tabIndex=-1); if(b) b.tabIndex=0; return b;
  }
  function shift(dm){ const nv=new Date(view.getFullYear(),view.getMonth()+dm,1);
    if(nv.getFullYear()*12+nv.getMonth()<t0.getFullYear()*12+t0.getMonth()||nv>mx) return false;
    view=nv; build(dm>0?1:-1); return true; }
  function moveFocus(d){ if(d<t0) d=new Date(t0); if(d>mx) d=new Date(mx); focusD=d;
    if(d.getMonth()!==view.getMonth()||d.getFullYear()!==view.getFullYear()){ const dir=d>view?1:-1; view=new Date(d.getFullYear(),d.getMonth(),1); build(dir); }
    const b=rove(); if(b) b.focus(); }
  pBtn.onclick=()=>shift(-1); nBtn.onclick=()=>shift(1);
  w.querySelector('.dp-today').onclick=()=>{ focusD=t0; if(view.getMonth()!==t0.getMonth()||view.getFullYear()!==t0.getFullYear()){ const dir=t0>view?1:-1; view=new Date(t0.getFullYear(),t0.getMonth(),1); build(dir); }
    const b=rove(); if(b) b.focus(); };
  w.querySelector('.dp-clear').onclick=()=>{ dpSet(null); dpClose(true); };
  gwrap.addEventListener('click',e=>{ const b=e.target.closest('.dp-d'); if(!b||b.disabled) return;
    const [y,m,d]=b.dataset.d.split('-').map(Number);
    grid.querySelectorAll('.dp-d.sel').forEach(x=>{x.classList.remove('sel');x.removeAttribute('aria-pressed')});
    b.classList.add('sel'); b.setAttribute('aria-pressed','true');
    if(!RM) b.animate([{transform:'scale(.82)'},{transform:'scale(1.08)'},{transform:'none'}],{duration:420,easing:'cubic-bezier(.16,1,.3,1)'});
    dpSet(new Date(y,m-1,d)); setTimeout(()=>dpClose(true),RM?0:300); });
  gwrap.addEventListener('keydown',e=>{
    const b=e.target.closest('.dp-d'); if(!b) return; const [y,m,d]=b.dataset.d.split('-').map(Number), cd=new Date(y,m-1,d);
    const mv={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7}[e.key];
    if(mv){ e.preventDefault(); moveFocus(new Date(y,m-1,d+mv)); }
    else if(e.key==='PageUp'||e.key==='PageDown'){ e.preventDefault(); moveFocus(new Date(y,m-1+(e.key==='PageDown'?1:-1),Math.min(d,28))); }
    else if(e.key==='Home'||e.key==='End'){ e.preventDefault(); const wd0=(cd.getDay()+6)%7; moveFocus(new Date(y,m-1,d+(e.key==='Home'?-wd0:6-wd0))); }
  });
  function onKey(e){ if(e.key==='Escape'){ e.stopPropagation(); dpClose(true); }
    else if(e.key==='Tab'&&sheet){ const f=[...w.querySelectorAll('button')].filter(x=>!x.disabled&&(x.tabIndex>=0)); const i=f.indexOf(document.activeElement);
      if(e.shiftKey&&i<=0){ e.preventDefault(); f[f.length-1].focus(); } else if(!e.shiftKey&&i===f.length-1){ e.preventDefault(); f[0].focus(); } } }
  function onDown(e){ if(!w.contains(e.target)&&!dpBtn.contains(e.target)) dpClose(false); }
  w.addEventListener('keydown',onKey);
  setTimeout(()=>document.addEventListener('pointerdown',onDown,true),0);
  build(0);
  const up=!sheet&&fitPopup(w,dpBtn);
  dpBtn.setAttribute('aria-expanded','true');
  const EZ='cubic-bezier(.16,1,.3,1)';
  if(!RM){
    if(sheet){ scrim.animate([{opacity:0},{opacity:1}],{duration:380,fill:'backwards'}); w.animate([{transform:'translateY(100%)'},{transform:'none'}],{duration:520,easing:EZ}); }
    else w.animate([{opacity:0,transform:`translateY(${up?10:-10}px) scale(.96)`},{opacity:1,transform:'none'}],{duration:420,easing:EZ});
  }
  (rove()||pBtn).focus({preventScroll:true});
  dp={w,scrim,sheet,onDown,unScroll:closeOnScroll(()=>dpClose(false))};
}
function dpClose(refocus){
  if(!dp) return; const {w,scrim,sheet,onDown,unScroll}=dp; dp=null; unScroll&&unScroll();
  document.removeEventListener('pointerdown',onDown,true);
  dpBtn.setAttribute('aria-expanded','false');
  const done=()=>{ w.remove(); scrim&&scrim.remove(); dpField.classList.remove('open'); };
  if(RM) done();
  else {
    if(sheet){ scrim.animate([{opacity:1},{opacity:0}],{duration:300,fill:'forwards'}); w.animate([{transform:'none'},{transform:'translateY(100%)'}],{duration:340,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'}).finished.then(done,done); }
    else w.animate([{opacity:1,transform:'none'},{opacity:0,transform:'translateY(-8px) scale(.97)'}],{duration:220,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'}).finished.then(done,done);
  }
  if(refocus) dpBtn.focus({preventScroll:true});
}

/* ===================== custom dropdowns =====================
   The real <select> stays in the form (it holds the value), hidden; a styled button and list sit
   on top so the dropdown looks and moves the same in Safari, Chrome, Firefox and on phones.  */
const CS=[];
function makeSelect(sel){
  const f=sel.closest('.f'); f.classList.add('cs-f');
  sel.classList.add('cs-native'); sel.tabIndex=-1; sel.setAttribute('aria-hidden','true');
  const btn=document.createElement('button'); btn.type='button'; btn.className='cs-btn'; btn.id=sel.id+'-btn';
  btn.setAttribute('aria-haspopup','listbox'); btn.setAttribute('aria-expanded','false');
  btn.innerHTML='<span class="cs-val"></span><svg class="cs-chev" width="12" height="8" viewBox="0 0 12 8" aria-hidden="true"><path d="M1 1.5l5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';
  sel.after(btn);
  // a select with its own aria-label (the phone's country code) leaves the field's label to the input beside it
  const lab=sel.hasAttribute('aria-label')?null:f.querySelector('label'); if(lab){ lab.htmlFor=btn.id; if(!lab.id) lab.id=sel.id+'-lab'; btn.setAttribute('aria-labelledby',lab.id+' '+btn.id); }
  const val=btn.querySelector('.cs-val');
  const o={sel,btn,f,panel:null,scrim:null,act:0,
    label(anim){ const op=sel.options[sel.selectedIndex]; val.textContent=op?(op.dataset.short||(op.dataset.shortKey&&tr(op.dataset.shortKey))||op.textContent):'';
      if(!lab) btn.setAttribute('aria-label',sel.getAttribute('aria-label')+': '+(op?op.textContent:''));
      if(anim&&!RM) val.animate([{opacity:0,transform:'translateY(9px)'},{opacity:1,transform:'none'}],{duration:520,easing:'cubic-bezier(.16,1,.3,1)'}); }};
  o.label(false);
  btn.addEventListener('click',()=>o.panel?csClose(o,true):csOpen(o));
  btn.addEventListener('keydown',e=>{ if(['ArrowDown','ArrowUp'].includes(e.key)&&!o.panel){ e.preventDefault(); csOpen(o); } });
  sel.addEventListener('change',()=>o.label(false));
  CS.push(o); return o;
}
function csOpen(o){
  CS.forEach(x=>x!==o&&csClose(x,false)); if(dp) dpClose(false);
  const sheet=innerWidth<600, {sel,btn,f}=o;
  const ul=document.createElement('ul'); ul.className='cs'+(sheet?' cs-sheet':''); ul.setAttribute('role','listbox'); ul.tabIndex=-1;
  ul.id=sel.id+'-list'; btn.setAttribute('aria-controls',ul.id);
  const own=sel.getAttribute('aria-label'), lab=own?null:f.querySelector('label'); if(lab) ul.setAttribute('aria-labelledby',lab.id); else ul.setAttribute('aria-label',own);
  if(sheet){ const t=document.createElement('li'); t.className='cs-title'; t.setAttribute('role','presentation'); t.textContent=lab?lab.textContent:own; ul.append(t); }
  const items=[...sel.options].map((op,i)=>{ const li=document.createElement('li'); li.className='cs-o'; li.setAttribute('role','option'); li.id=ul.id+'-'+i;
    li.setAttribute('aria-selected',String(i===sel.selectedIndex));
    li.innerHTML=`<span>${esc(op.textContent)}${op.dataset.code?` <em class="cs-aux">${esc(op.dataset.code)}</em>`:''}</span><svg class="cs-tick" viewBox="0 0 18 18" aria-hidden="true"><path pathLength="1" d="M3.5 9.5l3.5 3.5 7.5-8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    li.addEventListener('pointermove',()=>setAct(i));
    li.addEventListener('click',()=>pick(i));
    ul.append(li); return li; });
  function setAct(i){ o.act=clamp(i,0,items.length-1); items.forEach((li,k)=>li.classList.toggle('act',k===o.act)); ul.setAttribute('aria-activedescendant',items[o.act].id);
    const li=items[o.act]; if(li.offsetTop<ul.scrollTop||li.offsetTop+li.offsetHeight>ul.scrollTop+ul.clientHeight) li.scrollIntoView({block:'nearest'}); }
  function pick(i){ items.forEach((li,k)=>li.setAttribute('aria-selected',String(k===i)));
    if(sel.selectedIndex!==i){ sel.selectedIndex=i; sel.dispatchEvent(new Event('change',{bubbles:true})); o.label(true); }
    f.classList.remove('bad'); setTimeout(()=>csClose(o,true),RM?0:240); }
  let typed='', typedT=0;
  ul.addEventListener('keydown',e=>{
    if(e.key==='ArrowDown'){ e.preventDefault(); setAct(o.act+1); } else if(e.key==='ArrowUp'){ e.preventDefault(); setAct(o.act-1); }
    else if(e.key==='Home'){ e.preventDefault(); setAct(0); } else if(e.key==='End'){ e.preventDefault(); setAct(items.length-1); }
    else if(e.key==='Enter'||e.key===' '){ e.preventDefault(); pick(o.act); }
    else if(e.key==='Escape'){ e.preventDefault(); e.stopPropagation(); csClose(o,true); }
    else if(e.key==='Tab'){ csClose(o,false); }
    else if(e.key.length===1){ clearTimeout(typedT); typed+=e.key.toLowerCase(); typedT=setTimeout(()=>typed='',600);
      const k=[...sel.options].findIndex(op=>op.textContent.trim().toLowerCase().startsWith(typed)); if(k>=0) setAct(k); }
  });
  if(sheet){ o.scrim=document.createElement('div'); o.scrim.className='dp-scrim'; o.scrim.onclick=()=>csClose(o,true); document.body.append(o.scrim,ul); }
  else { f.append(ul); f.classList.add('open'); }
  o.panel=ul; btn.setAttribute('aria-expanded','true'); setAct(Math.max(0,sel.selectedIndex));
  const up=!sheet&&fitPopup(ul,btn);
  const EZ='cubic-bezier(.16,1,.3,1)';
  if(!RM){
    if(sheet){ o.scrim.animate([{opacity:0},{opacity:1}],{duration:380}); ul.animate([{transform:'translateY(100%)'},{transform:'none'}],{duration:520,easing:EZ}); }
    else ul.animate([{opacity:0,transform:`translateY(${up?10:-10}px) scale(.97)`},{opacity:1,transform:'none'}],{duration:420,easing:EZ});
    items.forEach((li,k)=>li.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:420,delay:80+k*40,easing:EZ,fill:'backwards'}));
  }
  ul.focus({preventScroll:true});
  o.down=e=>{ if(!ul.contains(e.target)&&!btn.contains(e.target)) csClose(o,false); };
  setTimeout(()=>document.addEventListener('pointerdown',o.down,true),0);
  o.unScroll=closeOnScroll(()=>csClose(o,false));
}
function csClose(o,refocus){
  if(!o.panel) return; const ul=o.panel, scrim=o.scrim; o.panel=null; o.scrim=null; if(o.unScroll){ o.unScroll(); o.unScroll=null; }
  document.removeEventListener('pointerdown',o.down,true); o.btn.setAttribute('aria-expanded','false');
  const done=()=>{ ul.remove(); scrim&&scrim.remove(); o.f.classList.remove('open'); };
  if(RM) done();
  else if(scrim){ scrim.animate([{opacity:1},{opacity:0}],{duration:300,fill:'forwards'}); ul.animate([{transform:'none'},{transform:'translateY(100%)'}],{duration:340,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'}).finished.then(done,done); }
  else ul.animate([{opacity:1,transform:'none'},{opacity:0,transform:'translateY(-8px) scale(.97)'}],{duration:200,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'}).finished.then(done,done);
  if(refocus) o.btn.focus({preventScroll:true});
}
$$('#form select').forEach(makeSelect);
form.addEventListener('reset',()=>setTimeout(()=>CS.forEach(o=>o.label(false)),0));

/* guests: − / + buttons instead of the browser's tiny spinners */
(function guests(){
  const inp=$('#f-guests'); if(!inp) return;
  const f=inp.closest('.f'); f.classList.add('st-f');
  const wrap=document.createElement('div'); wrap.className='st-wrap'; inp.before(wrap); wrap.append(inp);
  const mk=(d,lab)=>{ const b=document.createElement('button'); b.type='button'; b.className='st-b'; b.setAttribute('aria-label',lab);
    b.innerHTML=`<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 6h8${d>0?'M6 2v8':''}" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;
    b.addEventListener('click',()=>{ const n=parseInt(inp.value,10); const v=clamp((isNaN(n)?(d>0?0:2):n)+d,1,1000); inp.value=v; f.classList.remove('bad');
      if(!RM) inp.animate([{transform:`translateY(${d>0?8:-8}px)`,opacity:0},{transform:'none',opacity:1}],{duration:380,easing:'cubic-bezier(.16,1,.3,1)'}); sync(); });
    wrap.append(b); return b; };
  const minus=mk(-1,'−'), plus=mk(1,'+');
  const sync=()=>{ const n=parseInt(inp.value,10); minus.disabled=!(n>1); plus.disabled=n>=1000; };
  inp.addEventListener('input',sync); form.addEventListener('reset',()=>setTimeout(sync,0)); sync();
})();
/* phone: a country-code dropdown (Greece, UK, other) beside the number. Greek and UK numbers are
   spaced as you type (694 123 4567, 7700 900123); for any other country the number is written in
   full with its own code (+61 412 345 678). The form sends one value, e.g. "+30 694 123 4567". */
const PHONE=(function phone(){
  const inp=$('#f-phone'), cc=$('#f-cc'); if(!inp||!cc) return null;
  const f=inp.closest('.f');
  const CODES={GR:'30',GB:'44'};
  const PH={GR:'694 123 4567',GB:'7700 900123',XX:'+61 412 345 678'};
  const group=(d,sizes)=>{ const out=[]; let i=0; for(const n of sizes){ if(i>=d.length) break; out.push(d.slice(i,i+n)); i+=n; } if(i<d.length) out.push(d.slice(i)); return out.join(' '); };
  const fmt={
    GR:d=>group(d.slice(0,10),[3,3,4]),
    GB:d=>{ d=d.replace(/^0/,'').slice(0,10); return group(d,d[0]==='2'?[2,4,4]:/^[3589]/.test(d)?[3,3,4]:[4,6]); },
    XX:t=>{ t=t.replace(/^\s*\+?\s*00/,'').replace(/[^\d ]/g,'').replace(/\s+/g,' ').replace(/^\s/,''); return t?'+'+t.slice(0,22):''; }
  };
  const country=()=>cc.value in fmt?cc.value:'GR';
  let auto=false; // set while the number itself picks the country, so the change below leaves the number alone
  const setCountry=k=>{ if(cc.value===k) return; cc.value=k; auto=true; cc.dispatchEvent(new Event('change')); auto=false; };
  // A number typed or autofilled with its code (+44…, 0030…) picks its country. Returns the digits
  // after the code, or null while a lone "+3" could still become +30 (left as typed until then).
  function detect(t){
    if(!/^\s*(\+|00)/.test(t)) return t;
    const d=t.trim().replace(/^00/,'').replace(/\D/g,'');
    for(const k in CODES){ const c=CODES[k];
      if(d.startsWith(c)&&d.length>c.length){ setCountry(k); return d.slice(c.length); }
      if(c.startsWith(d)) return null; }
    setCountry('XX'); return t;
  }
  // re-space the number, keeping the caret after the same digit
  function reformat(){
    const k0=country(), cur=inp.value, at=inp.selectionStart??cur.length, nat=detect(cur), k=country();
    let next;
    if(nat===null) next=cur.replace(/[^\d+]/g,'');
    else next=k==='XX'?fmt.XX(nat):fmt[k](nat.replace(/\D/g,''));
    if(next===inp.value&&k===k0) return;
    inp.value=next;
    if(document.activeElement!==inp) return;
    let p=next.length;
    if(k===k0&&nat!==null){
      let before=cur.slice(0,at).replace(/\D/g,'').length;
      if(k==='GB'&&/^\s*0/.test(cur)) before=Math.max(0,before-1);
      p=0; for(let n=0;p<next.length&&n<before;p++) if(/\d/.test(next[p])) n++;
    }
    try{ inp.setSelectionRange(p,p); }catch(_){}
  }
  inp.addEventListener('input',()=>{ f.classList.remove('bad'); reformat(); });
  // backspace just after one of our spaces removes the digit before it, not only the space
  inp.addEventListener('keydown',e=>{
    if(e.key!=='Backspace'||country()==='XX') return;
    const a=inp.selectionStart, z=inp.selectionEnd; if(a!==z||!a||inp.value[a-1]!==' ') return;
    e.preventDefault(); inp.setRangeText('',a-2,a,'end'); reformat();
  });
  // switching country carries the number across: Greece → Other keeps "+30 …" so only the code needs changing
  let last=country();
  cc.addEventListener('change',()=>{
    const k=country(), from=last; last=k; inp.placeholder=PH[k];
    let d=inp.value.replace(/\D/g,'');
    if(d&&!auto){
      if(k==='XX') inp.value=from==='XX'?inp.value:'+'+CODES[from]+' '+inp.value;
      else{ if(from==='XX'){ const c=Object.values(CODES).find(c=>d.startsWith(c)); if(c) d=d.slice(c.length); } inp.value=fmt[k](d); }
    }
    f.classList.remove('bad');
  });
  form.addEventListener('reset',()=>setTimeout(()=>{ cc.value='GR'; last='GR'; inp.placeholder=PH.GR; },0));
  inp.placeholder=PH[country()];
  return {
    // the full number to send, '' when left empty
    value(){ const k=country(), t=inp.value.trim(); if(!t.replace(/\D/g,'')) return '';
      return k==='XX'?fmt.XX(t):'+'+CODES[k]+' '+fmt[k](t.replace(/\D/g,'')); },
    valid(){ const k=country(), d=inp.value.replace(/\D/g,''); if(!d) return true;
      return k==='GR'?d.length===10:k==='GB'?/^0?\d{9,10}$/.test(d)&&d.replace(/^0/,'').length>=9:d.length>=7&&d.length<=15; }
  };
})();
function langExtras(){ refreshSeasons(); dpLabel(false); if(dp) dpClose(false); if(typeof CS!=='undefined') CS.forEach(o=>{ csClose(o,false); o.label(false); }); }

/* ---- init ---- */
let start='';
try{start=new URLSearchParams(location.search).get('lang')||''}catch(e){}
if(!start && location.pathname.startsWith('/el')) start='el';
if(!start){ try{start=localStorage.getItem('ap-lang')||''}catch(e){} }
if(!start) start=(navigator.language||'').toLowerCase().startsWith('el')?'el':'en';
setLang(start);
requestAnimationFrame(()=>{placeInd(); requestAnimationFrame(()=>{ind.style.transition=''});});
// the opening waits briefly for the monogram's font, so on a slow connection the letters never rise in a stand-in face
Promise.race([document.fonts?document.fonts.load('400 1em "Cormorant Garamond"'):0,new Promise(r=>setTimeout(r,1500))]).catch(()=>{})
  .then(()=>requestAnimationFrame(()=>{ document.body.classList.add('loaded'); setTimeout(()=>{ const b=$('.boot'); if(b) b.remove(); },600); }));
const initHash=location.hash;
const landLegal=LEGAL_KEYS.includes(initHash.slice(1));
const landHash=!landLegal&&elForHash(initHash)?initHash:'';
if(landHash){history.scrollRestoration='manual';goTo(landHash,true)}
if(landLegal){try{history.replaceState(null,'',location.pathname+location.search)}catch(_){} legal.open(initHash.slice(1))}
const arrived=CU.arrival();   // came from the About page through the curtain: it lifts once we're in place
const fontsIn=(document.fonts?document.fonts.ready:Promise.resolve()).then(()=>{layout();tick();if(landHash)goTo(landHash,true)});
if(arrived) Promise.race([fontsIn,wait(2500)]).then(()=>wait(200)).then(()=>{ if(landHash) goTo(landHash,true); CU.lift(()=>cascadeIn(230)); });

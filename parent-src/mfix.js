/* ===================== PHONE: chat that survives the keyboard · floating person switch =====================
   1) An open chat is one fixed column sized to the *visible* screen (visualViewport), so when the keyboard
      opens the header with the person's / group's name stays on top and the messages stay in view.
   2) The top header is gone on phones; a small floating avatar (bottom-left) opens "Switch person". */
(function(){const set=()=>{const v=window.visualViewport,r=document.documentElement;if(!v)return;const kb=v.height<window.innerHeight-120,top=kb?Math.max(0,v.offsetTop):0;r.style.setProperty('--vvh',kb?v.height+'px':'100%');r.style.setProperty('--vvt',top+'px');r.style.setProperty('--vvb',kb?Math.max(0,window.innerHeight-v.height-top)+'px':'0px');
  if(r.classList.contains('mconvon')){const t=document.getElementById('thr');if(t)t.scrollTop=t.scrollHeight}};
 if(window.visualViewport){visualViewport.addEventListener('resize',set);visualViewport.addEventListener('scroll',set)}window.addEventListener('resize',set);window.addEventListener('orientationchange',()=>setTimeout(set,300));set()})();
const _rFix=render;render=function(){_rFix.apply(this,arguments);if(!isMob())return;
 let b=document.getElementById('mwho');if(!b){document.body.insertAdjacentHTML('beforeend','<button id="mwho" class="mwho" data-a="whoSheet" aria-label="Switch person"></button>');b=document.getElementById('mwho')}
 const p=(D.photos||{})[S.me];b.innerHTML=p?`<img src="${p}" alt="">`:h(ini(nmF(S.me)||'?'));b.style.background=p?'#fff':colr(nm(S.me));b.title=nmF(S.me)+' · switch person';
 const t=document.getElementById('thr');if(t&&document.documentElement.classList.contains('mconvon'))t.scrollTop=t.scrollHeight};
/* compact switch sheet with search */
const _whoFix=A.whoSheet;A.whoSheet=e=>{_whoFix(e);if(!isMob())return;const s=document.querySelector('.sheet');if(!s||s.querySelector('#mwq'))return;
 const h2=[...s.querySelectorAll('h2')].find(x=>/Switch person/.test(x.textContent));if(!h2)return;
 h2.insertAdjacentHTML('afterend','<div class="mwq"><input id="mwq" placeholder="Search a person…" autocomplete="off"></div>');const p=h2.nextElementSibling.nextElementSibling;if(p&&p.tagName==='P')p.remove();
 s.querySelector('#mwq').addEventListener('input',ev=>{const q=ev.target.value.toLowerCase();s.querySelectorAll('button.li[data-a="whoSet"]').forEach(r=>{r.style.display=((r.querySelector('b')||r).textContent).toLowerCase().includes(q)?'':'none'});s.querySelectorAll('.xs.mut').forEach(x=>{if(x.nextElementSibling&&x.nextElementSibling.dataset&&x.nextElementSibling.dataset.a==='whoSet')x.style.display=q?'none':''})})};
document.head.insertAdjacentHTML('beforeend',`<style>
.mwho{display:none}
@media(max-width:820px){
 html.mob header.hd{display:none!important}
 html.mob .mwho{display:grid;place-items:center;position:fixed;left:12px;bottom:calc(78px + env(safe-area-inset-bottom));z-index:44;width:42px;height:42px;border-radius:50%;border:3px solid #fff;color:#fff;font-weight:800;font-size:14px;box-shadow:0 6px 16px rgba(16,24,40,.25);padding:0;overflow:hidden}
 html.mob .mwho img{width:100%;height:100%;object-fit:cover}
 html.mob.mconvon .mwho,html.mob.mmailread .mwho,html.mob body:has(.mg-cmp) .mwho,html.mob body:has(.mg-read) .mwho{display:none}
 html.mob #main{padding-top:calc(14px + env(safe-area-inset-top))!important}
 /* open chat = one column sized to the visible screen (keyboard-safe) */
 html.mob #main.mconv{position:fixed!important;left:0;right:0;top:var(--vvt,0px);bottom:var(--vvb,0px);height:auto;display:flex;flex-direction:column;padding:0!important;margin:0!important;max-width:none!important;overflow:hidden;z-index:46;background:#EFEAE2}
 html.mob #main.mconv>*:not(.wahd):not(.thread):not(.compose):not(.emo):not(.ment-s):not(.rbar){display:none!important}
 html.mob #main.mconv .wahd{position:relative!important;top:auto!important;flex:none;padding-top:calc(10px + env(safe-area-inset-top))!important}
 html.mob #main.mconv .thread{position:relative!important;top:auto!important;bottom:auto!important;flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch}
 html.mob #main.mconv .rbar{flex:none}
 html.mob #main.mconv .compose{position:relative!important;bottom:auto!important;flex:none;z-index:2;padding-bottom:calc(8px + env(safe-area-inset-bottom))!important;background:#fff}
 html.mob #main.mconv .emo,html.mob #main.mconv .ment-s{position:absolute!important;bottom:70px}
 /* switch sheet: compact */
 .mwq{margin:6px 0 10px}.mwq input{width:100%;min-height:44px;border-radius:12px}
 html.mob .sheet button.li[data-a="whoSet"]{padding:8px 10px;min-height:0}html.mob .sheet button.li[data-a="whoSet"] .av{width:34px;height:34px;font-size:12px}
 html.mob .sheet button.li[data-a="whoSet"] .tx b{font-size:14.5px}html.mob .sheet button.li[data-a="whoSet"] .tx .m,html.mob .sheet button.li[data-a="whoSet"] .tx small{font-size:12px}
}
</style>`);

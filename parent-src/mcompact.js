/* ===================== PHONE: compact everything =====================
   Page headers: title + small action buttons, no long subtitles. Filters become one swipeable chip row.
   Lists become tight rows with call / WhatsApp on the right. Long forms keep the must-fill fields on top
   and fold the optional ones under "More details". */

/* fold optional form fields into a collapsible block (used by sheets) */
function mFold(box,ids,label){if(!isMob()||!box)return;const d=document.createElement('details');d.className='mfold';d.innerHTML=`<summary>${label||'More details'}<span>optional</span></summary>`;let moved=0;
 ids.forEach(id=>{const el=box.querySelector('#'+id);if(!el)return;let blk=el;while(blk.parentElement&&blk.parentElement!==box&&!blk.parentElement.classList.contains('sheet')&&blk.parentElement.children.length<=2&&!blk.parentElement.classList.contains('grid'))blk=blk.parentElement;
  const lab=box.querySelector(`label[for="${id}"]`)||(blk.previousElementSibling&&blk.previousElementSibling.tagName==='LABEL'?blk.previousElementSibling:null);
  const nx=blk.nextElementSibling&&blk.nextElementSibling.classList&&blk.nextElementSibling.classList.contains('row')&&blk.nextElementSibling.querySelector('#crfn')?blk.nextElementSibling:null;
  if(lab&&lab.parentElement===blk.parentElement)d.appendChild(lab);d.appendChild(blk);if(nx)d.appendChild(nx);moved++});
 if(!moved)return;const btn=[...box.querySelectorAll('button.btn.w, .row:last-child')].pop();if(btn&&btn.parentElement)btn.parentElement.insertBefore(d,btn);else box.appendChild(d)}
const mSheet=()=>document.querySelector('.sheet:last-of-type, .sheet');
/* Creative Library add / edit: title, company, type and who-can-see stay; the rest folds */
['crlNew','crlEdit'].forEach(k=>{const f=A[k];A[k]=e=>{f(e);const s=mSheet();if(!s||!isMob())return;
 const g=s.querySelector('#crw');if(g){const grid=g.closest('.grid');if(grid){const cc=grid.querySelector('#crc');if(cc){const lab=cc.previousElementSibling;grid.before(lab,cc);}}}
 mFold(s,['crw','crtg','crp','crs','cra','crl2','crcap'],'More details · date, tags, people, link, caption');
 const v=s.querySelector('#crv');if(v){const d=s.querySelector('.mfold');const lab=v.previousElementSibling;if(d){d.before(lab,v)}}
 s.querySelectorAll('p.mut.sm, .xs.mut').forEach(x=>{if(/Tool Section|Packaging<\/b>|Boxes, labels/.test(x.innerHTML))x.remove()})}});
/* other long forms: tasks, CRM customer, campaign plan, IT project */
const M_FOLD={tNew:[],pmNew:['pmf','pmto','pmn'],itNew:['itl','itn']};
Object.entries(M_FOLD).forEach(([k,ids])=>{const f=A[k];if(!f||!ids.length)return;A[k]=e=>{f(e);const s=mSheet();if(s)mFold(s,ids)}});

document.head.insertAdjacentHTML('beforeend',`<style>
@media(max-width:820px){
 /* page headers */
 html.mob #main>.row.nw:first-child{margin-bottom:10px!important;align-items:center}
 html.mob #main>.row.nw:first-child h1{font-size:24px;margin:0}
 html.mob #main>.row.nw:first-child p.mut,html.mob #main>.row.nw:first-child .sub{display:none}
 html.mob #main>.row.nw:first-child .btn{min-height:40px;padding:0 12px;font-size:13px;border-radius:12px}
 html.mob #main>.row.nw:first-child .btn.sec{width:40px;padding:0;justify-content:center;font-size:0;gap:0}html.mob #main>.row.nw:first-child .btn.sec svg{margin:0}
 /* chips everywhere: smaller */
 html.mob .chips button,html.mob .chips .chip{padding:6px 12px;min-height:34px;font-size:13px}
 /* folding forms */
 .mfold{border:1px solid var(--line);border-radius:14px;padding:0 12px;margin:14px 0 4px;background:#FAFBFC}
 .mfold summary{list-style:none;cursor:pointer;padding:12px 0;font-weight:700;font-size:14px;display:flex;justify-content:space-between;align-items:center}.mfold summary::-webkit-details-marker{display:none}
 .mfold summary span{font-size:11px;font-weight:600;color:var(--mut);background:#F2F4F7;border-radius:999px;padding:2px 8px}.mfold[open]{padding-bottom:12px}
 /* ---------- Contacts ---------- */
 html.mob #main[data-v="contacts"] .mtool{display:block}
 html.mob #main[data-v="contacts"] .mtool .seg{display:flex;flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;background:none;padding:0;gap:6px;margin:0 -16px 8px;padding:0 16px;border:0;box-shadow:none}
 html.mob #main[data-v="contacts"] .mtool .seg::-webkit-scrollbar{display:none}
 html.mob #main[data-v="contacts"] .mtool .seg button{flex:none;border:1px solid var(--line);background:#fff;border-radius:999px;padding:7px 14px;font-size:13px;min-height:0}
 html.mob #main[data-v="contacts"] .mtool .seg button.on{background:var(--navy);color:#fff;border-color:var(--navy)}html.mob #main[data-v="contacts"] .mtool .seg button svg{display:none}
 html.mob #main[data-v="contacts"] .mtool .sp{display:none}html.mob #main[data-v="contacts"] .msearch{width:100%;max-width:none;margin:0}
 html.mob #main[data-v="contacts"] .cgrid{display:block}
 html.mob #main[data-v="contacts"] .cside{display:flex;flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;gap:6px;background:none;border:0;box-shadow:none;padding:10px 16px 6px;margin:0 -16px;position:static}
 html.mob #main[data-v="contacts"] .cside::-webkit-scrollbar{display:none}html.mob #main[data-v="contacts"] .cside .cs-h{display:none}
 html.mob #main[data-v="contacts"] .cside button{flex:none;display:inline-flex;align-items:center;gap:6px;width:auto;border:1px solid var(--line);background:#fff;border-radius:999px;padding:6px 12px;margin:0;font-size:13px;min-height:0}
 html.mob #main[data-v="contacts"] .cside button i{width:8px;height:8px;border-radius:50%}html.mob #main[data-v="contacts"] .cside button i svg{display:none}
 html.mob #main[data-v="contacts"] .cside button em{font-style:normal;font-size:11px;background:#F2F4F7;border-radius:999px;padding:0 6px}
 html.mob #main[data-v="contacts"] .cside button.on{background:#E7EEFF;border-color:#B9C8F5;color:var(--navy)}
 html.mob #main[data-v="contacts"] .cside select{flex:none;width:auto;min-height:34px;border-radius:999px;padding:0 30px 0 12px;font-size:13px;margin:0}
 html.mob #main[data-v="contacts"] .xsheet{overflow:visible;border:0!important;background:#fff!important;border-radius:18px!important;box-shadow:0 1px 2px rgba(16,24,40,.05)!important}
 html.mob #main[data-v="contacts"] .xsheet table,html.mob #main[data-v="contacts"] .xsheet tbody{display:block;width:100%}html.mob #main[data-v="contacts"] .xsheet thead{display:none}
 html.mob #main[data-v="contacts"] .xsheet tr{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid #F0F2F5}
 html.mob #main[data-v="contacts"] .xsheet td{display:none;border:0!important;padding:0!important;position:static!important;box-shadow:none!important;background:none!important;min-width:0!important}
 html.mob #main[data-v="contacts"] .xsheet td.stk{display:block;flex:1;min-width:0}html.mob #main[data-v="contacts"] .xsheet td.stk button{width:100%;text-align:left}
 html.mob #main[data-v="contacts"] .xsheet td.stk b{display:block;font-size:14.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}html.mob #main[data-v="contacts"] .xsheet td.stk span{font-size:12px}
 html.mob #main[data-v="contacts"] .xsheet td:last-child{display:block}html.mob #main[data-v="contacts"] .actg{display:flex;gap:6px}
 html.mob #main[data-v="contacts"] .actg>*{width:38px;height:38px;border-radius:50%}html.mob #main[data-v="contacts"] .actg>button{display:none}
 /* ---------- Creative Library ---------- */
 html.mob #main[data-v="crl"] .search{min-width:0!important}
 html.mob #main[data-v="crl"] [data-a="crlNew"]{width:46px;height:46px;padding:0;font-size:0;gap:0;justify-content:center;border-radius:14px;flex:none}html.mob #main[data-v="crl"] [data-a="crlNew"] svg{width:20px;height:20px;margin:0}
 html.mob #main[data-v="crl"] .chips{margin:0 -16px;padding:0 16px}
 html.mob #main[data-v="crl"] .crg{grid-template-columns:repeat(3,1fr);gap:8px}
 html.mob #main[data-v="crl"] .crt{border-radius:12px}html.mob #main[data-v="crl"] .crt .im{padding:6px;font-size:11px}html.mob #main[data-v="crl"] .crt .im>span{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
 html.mob #main[data-v="crl"] .crt .bd{padding:6px 8px}html.mob #main[data-v="crl"] .crt .bd b{font-size:12px}html.mob #main[data-v="crl"] .crt .bd small{font-size:10.5px}
 html.mob #main[data-v="crl"] .crt .im:has(>span) + .bd b{display:none}

 /* ---------- company pages ---------- */
 html.mob .cohead{padding:12px 14px!important;border-radius:18px!important;gap:10px!important;margin-bottom:10px!important}
 html.mob .cohead h1{font-size:20px!important}html.mob .cohead p{font-size:12px!important}
 html.mob .cohead .cobk,html.mob .cohead>button:first-child{width:36px!important;height:36px!important;min-height:0!important}
 html.mob .cohead>i,html.mob .cohead .coic{width:40px!important;height:40px!important}
 html.mob .stbar{padding:8px 10px;gap:10px;border-radius:14px}html.mob .stbar>i{width:34px;height:34px}html.mob .stbar .btn{font-size:0;width:38px;padding:0;justify-content:center;gap:0}html.mob .stbar .btn svg{margin:0}
 html.mob .stkp{display:flex;overflow-x:auto;scrollbar-width:none;gap:8px;margin:10px -16px 0;padding:0 16px}html.mob .stkp::-webkit-scrollbar{display:none}
 html.mob .stkp>div{flex:none;min-width:118px;padding:9px 12px;border-radius:12px}html.mob .stkp span{font-size:11px}html.mob .stkp b{font-size:18px}
 /* tables in Studios → cards */
 html.mob .sttw{overflow:visible;border:0;background:none}
 html.mob .sttbl,html.mob .sttbl tbody{display:block}html.mob .sttbl thead{display:none}
 html.mob .sttbl tr{display:flex;flex-wrap:wrap;gap:4px 10px;align-items:center;background:#fff;border-radius:14px;padding:11px 13px;margin-bottom:8px;box-shadow:0 1px 2px rgba(16,24,40,.05)}
 html.mob .sttbl td{border:0!important;padding:0!important;font-size:12.5px;color:#667085}html.mob .sttbl td:first-child{flex:1 1 100%;color:#101828}html.mob .sttbl td:first-child b{font-size:14.5px}
 html.mob .sttbl td.n{text-align:left}
 /* IT board: swipe columns */
 html.mob .itb{grid-template-columns:repeat(5,78vw);scroll-snap-type:x mandatory;margin:0 -16px;padding:0 16px 6px}html.mob .itcol{scroll-snap-align:start}
 /* KPI rows that are 2-3 big cards → swipe row */
 html.mob .kpis,html.mob .kgrid{display:flex!important;overflow-x:auto;scrollbar-width:none;gap:8px}html.mob .kpis>*,html.mob .kgrid>*{flex:none;min-width:130px}
 /* explanations take space on a phone: hide the grey help notes and descriptive lines on pages */
 html.mob #main .note,html.mob #main .row>.mut.sm{display:none}
 .sheet .crdrop{padding:12px}.sheet .crdrop span{display:none}
}
</style>`);

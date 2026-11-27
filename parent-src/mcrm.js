/* ===================== PHONE: CRM, rebuilt =====================
   Top: every CRM as a swipeable chip (lead count + unread) — jump between CRMs in one tap.
   Then one row: search · dialer. Then one row: Leads | WhatsApp | Calls · owner filter.
   Leads view: stage funnel bar + stage chips + dense lead rows (name, number, stage, 2 tags, owner, last
   activity, call / WhatsApp). Tap a lead = full screen with history. Round + adds a lead. */
const mCrmList=()=>{const out=[];crmCosNV().forEach(co=>{const S0=(SEG_NM[co]&&segMine(co))||[null];S0.forEach(sg=>out.push([co,sg]))});return out};
const mCrmLeads=(co,sg)=>D.wa.filter(c=>cmTeams(co).includes(c.team)&&(!sg||cmSegOf(c)===sg));
const mCrmName=(co,sg)=>sg&&SEG_NM[co]?SEG_NM[co][sg][0].replace('JDAC ',''):(cmInfo(co)[1]||'').replace('JDAC ','');
const _vCrmMob=V.crm;V.crm=()=>{const o=_vCrmMob();if(!isMob())return o;
 const t=document.createElement('template');t.innerHTML=o;const hd=t.content.querySelector('.c5h');
 const q=hd&&hd.querySelector('#cmq');
 const chips=mCrmList().map(([co,sg])=>{const L=mCrmLeads(co,sg),un=L.reduce((a,c)=>a+(c.unread||0),0),on=S.cmco===co&&(!sg||S.cmseg===sg),f=cmInfo(co);
  return `<button class="mcr ${on?'on':''}" data-a="cmCo" data-k="${co}" ${sg?`data-seg="${sg}"`:''} style="--cc:${f[4]}"><b>${h(mCrmName(co,sg))}</b><span>${L.length} leads${un?` · <em>${un} new</em>`:''}</span></button>`}).join('');
 const bar=`<div class="mcrh"><div class="mcrs">${chips}</div><div class="mcrq">${ic('search')}${q?q.outerHTML.replace(/placeholder="[^"]*"/,'placeholder="Search name, number, chat…"'):''}<button data-a="cmPad" aria-label="Dialer">${ic('phone')}</button></div></div>`;
 if(hd)hd.outerHTML=bar;else t.content.prepend(document.createRange().createContextualFragment(bar));
 const b=t.content.querySelector('.cmbar');if(b){b.querySelectorAll('[data-a="cmPad"]').forEach(x=>x.remove());const lead=b.querySelector('[data-t="board"] span');if(lead)lead.textContent='Leads'}
 const nw=t.content.querySelector('[data-a="waNew"]');if(nw){nw.setAttribute('aria-label',nw.textContent.trim());nw.classList.add('mcrfab')}
 setTimeout(()=>{const a=document.querySelector('.mcr.on'),w=document.querySelector('.mcrs');if(a&&w)w.scrollLeft=a.offsetLeft-16},0);
 return t.innerHTML};
/* stage funnel bar above the stage chips */
const _boardMcrm=boardView;boardView=function(L){const o=_boardMcrm(L);if(!isMob())return o;const tot=L.length||1;
 const seg=CM_COL.map(([k,l,,c])=>{const n=L.filter(x=>cmColOf(x)===k).length;return n?`<i style="flex:${n};background:${c}" title="${h(l)} ${n}"></i>`:''}).join('');
 const hot=L.filter(c=>(c.tags||[]).some(t=>/hot/i.test(t))).length,un=L.filter(c=>!c.to).length,today=L.filter(c=>c.at===TODAY).length;
 return `<div class="mfun"><div class="mfunb">${seg}</div><div class="mfuns"><span><b>${L.length}</b> leads</span><span><b>${today}</b> today</span><span class="hot"><b>${hot}</b> 🔥 hot</span><span class="${un?'bad':''}"><b>${un}</b> unassigned</span></div></div>`+o};
document.head.insertAdjacentHTML('beforeend',`<style>
@media(max-width:820px){
 html.mob #main[data-v="crm"] .cmwrap{margin-top:0}
 .mcrh{margin:0 0 10px}
 .mcrs{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;margin:0 -16px 10px;padding:2px 16px}.mcrs::-webkit-scrollbar{display:none}
 .mcr{flex:none;display:flex;flex-direction:column;align-items:flex-start;gap:1px;border:1px solid var(--line);background:#fff;border-radius:14px;padding:8px 12px 8px 14px;font:inherit;text-align:left;position:relative;min-width:118px}
 .mcr:before{content:'';position:absolute;left:0;top:10px;bottom:10px;width:3px;border-radius:0 3px 3px 0;background:var(--cc)}
 .mcr b{font-size:13.5px;color:#101828;white-space:nowrap}.mcr span{font-size:11.5px;color:var(--mut);white-space:nowrap}.mcr em{font-style:normal;color:#1F9D55;font-weight:700}
 .mcr.on{background:var(--cc);border-color:var(--cc)}.mcr.on b,.mcr.on span,.mcr.on em{color:#fff}.mcr.on:before{display:none}
 .mcrq{display:flex;align-items:center;gap:8px;background:#fff;border:1px solid var(--line);border-radius:14px;padding:0 6px 0 12px;min-height:46px}.mcrq>svg{width:18px;height:18px;color:var(--mut);flex:none}
 .mcrq input{flex:1;border:0!important;outline:none;background:none!important;font:inherit;font-size:15px;padding:0!important;min-height:44px;box-shadow:none!important}
 .mcrq button{width:38px;height:38px;border-radius:12px;border:0;background:#E7F6EE;color:#1F9D55;display:grid;place-items:center;flex:none}.mcrq button svg{width:19px;height:19px}
 html.mob .cmbar{flex-wrap:nowrap!important;gap:8px!important;margin:0 0 10px}html.mob .cmbar .cseg{flex:1 1 auto!important;min-width:0;padding:3px;border-radius:12px}
 html.mob .cmbar .cseg button{padding:7px 4px;font-size:12.5px;min-height:0;gap:4px}html.mob .cmbar .cseg button svg{width:15px;height:15px}
 html.mob .cmbar .t4sel{flex:0 0 92px!important;min-height:38px!important;font-size:12.5px;padding:0 22px 0 8px;border-radius:12px}
 html.mob .cmbar .mcrfab{position:fixed!important;right:16px;bottom:calc(84px + env(safe-area-inset-bottom));width:56px;height:56px;min-height:0!important;padding:0!important;border-radius:18px!important;font-size:0!important;gap:0!important;justify-content:center;z-index:44}
 html.mob .cmbar .mcrfab svg{width:24px;height:24px;margin:0}
 .mfun{width:100%;box-sizing:border-box;background:#fff;border-radius:14px;padding:10px 12px;margin:0 0 10px;box-shadow:0 1px 2px rgba(16,24,40,.05)}
 .mfunb{display:flex;height:8px;border-radius:99px;overflow:hidden;gap:2px;background:#F2F4F7}.mfunb i{display:block;min-width:6px}
 .mfuns{display:flex;justify-content:space-between;margin-top:8px;font-size:11.5px;color:var(--mut);font-weight:600}.mfuns b{color:#101828;font-size:14px;margin-right:2px}.mfuns .bad b{color:#D92D20}
 html.mob .mstg,html.mob .mleads{width:100%}
 html.mob #main[data-v="crm"] .kchips,html.mob #main[data-v="crm"] .wachips,html.mob #main[data-v="crm"] .chips{flex-wrap:nowrap!important;overflow-x:auto;scrollbar-width:none}html.mob .mstg{padding-bottom:8px}html.mob .mstg button{padding:6px 11px;font-size:12.5px}
 /* dense lead rows */
 html.mob .mleads{gap:8px}
 html.mob .mleads .cmc2{display:grid!important;grid-template-columns:1fr auto;grid-template-areas:"top act" "tags act" "foot act";gap:4px 10px;padding:10px 12px!important;border-radius:14px!important}
 html.mob .mleads .cmc2 .mstgtag{grid-area:foot;justify-self:end;align-self:center;margin:0!important;font-size:10px!important}html.mob .mleads .cmc2 .cmo{justify-self:start}
 html.mob .mleads .cmc2 .cmt2{grid-area:top;padding-right:0!important}html.mob .mleads .cmc2 .cmt2 .sfav{width:36px!important;height:36px!important;font-size:12px!important}
 html.mob .mleads .cmc2 .cmn b{font-size:14.5px}html.mob .mleads .cmc2 .cmn small{font-size:12px!important}
 html.mob .mleads .cmc2 .cmu{position:static!important;margin-left:4px}
 html.mob .mleads .cmc2 .cmtg{grid-area:tags;margin:0 0 0 46px!important;display:flex;flex-wrap:nowrap;overflow:hidden;gap:4px}
 html.mob .mleads .cmc2 .cmtg>*{flex:none;font-size:10.5px!important;padding:1px 7px!important}html.mob .mleads .cmc2 .cmtg>*:nth-child(n+4){display:none}
 html.mob .mleads .cmc2 .cmf{display:contents}
 html.mob .mleads .cmc2 .cmo{grid-area:foot;margin-left:46px;font-size:12px}html.mob .mleads .cmc2 .cmo .av{width:18px!important;height:18px!important;font-size:8px!important}
 html.mob .mleads .cmc2 .sp{display:none}
 html.mob .mleads .cmc2 .cmb{grid-area:act;width:38px!important;height:38px!important}
 html.mob .mleads .cmc2 .cmb.wa{grid-row:1;grid-column:2}html.mob .mleads .cmc2 .cmb.call{grid-row:2/4;grid-column:2;align-self:start}
}
</style>`);

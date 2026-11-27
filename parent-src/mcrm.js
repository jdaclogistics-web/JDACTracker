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
 const dd=hd&&hd.querySelector('.ccdd'),q=hd&&hd.querySelector('#cmq');
 const bar=`<div class="mcrh">${dd?dd.outerHTML:''}<div class="mcrq">${ic('search')}${q?q.outerHTML.replace(/placeholder="[^"]*"/,'placeholder="Search name, number, chat…"'):''}<button data-a="cmPad" aria-label="Dialer">${ic('phone')}</button></div></div>`;
 if(hd)hd.outerHTML=bar;else t.content.prepend(document.createRange().createContextualFragment(bar));
 const b=t.content.querySelector('.cmbar');
 if(b){b.querySelectorAll('[data-a="cmPad"]').forEach(x=>x.remove());const v=S.cmv||'board';
  const L=D.wa.filter(c=>cmTeams(cmCo()).includes(c.team)&&(!cmSegs(cmCo())||cmSegOf(c)===cmSeg())),un=L.reduce((a,c)=>a+(c.unread||0),0);
  const seg=b.querySelector('.cseg');if(seg)seg.outerHTML=`<div class="mtabs">${[['board','Leads','grid',L.length],['wa','WhatsApp','chat',un],['calls','Calls','phone',0]].map(([k,l,i,n])=>`<button class="${v===k?'on':''}" data-a="cmV" data-t="${k}">${ic(i)}<span>${l}</span>${n?`<em>${n}</em>`:''}</button>`).join('')}</div>`;
  const sel=b.querySelector('.t4sel');if(sel){sel.remove();b.insertAdjacentHTML('afterend',`<div class="mown">${ic('user')}${sel.outerHTML}</div>`)}}
 const nw=t.content.querySelector('[data-a="waNew"]');if(nw){nw.setAttribute('aria-label',nw.textContent.trim());nw.classList.add('mcrfab')}
 return t.innerHTML};
/* pipeline card: stage bar with legend + 4 clear tiles */
const _boardMcrm=boardView;boardView=function(L){const o=_boardMcrm(L);if(!isMob())return o;
 const st=CM_COL.map(([k,l,,c])=>[k,l,c,L.filter(x=>cmColOf(x)===k).length]).filter(x=>x[3]);
 const hot=L.filter(c=>(c.tags||[]).some(t=>/hot/i.test(t))).length,un=L.filter(c=>!c.to).length,today=L.filter(c=>c.at===TODAY).length,won=L.filter(c=>cmColOf(c)==='done').length;
 const tile=(n,l,c,bg)=>`<div class="mpt" style="--c:${c};--b:${bg}"><b>${n}</b><span>${l}</span></div>`;
 return `<div class="mpipe"><div class="mpiph"><b>Pipeline</b><span>${L.length} lead${L.length===1?'':'s'}</span></div>
 <div class="mfunb">${st.map(([k,l,c,n])=>`<i style="flex:${n};background:${c}"></i>`).join('')||'<i style="flex:1;background:#E4E7EC"></i>'}</div>
 <div class="mleg">${st.map(([k,l,c,n])=>`<span><i style="background:${c}"></i>${h(l)} <b>${n}</b></span>`).join('')}</div>
 <div class="mpts">${tile(today,'New today','#2563C9','#EFF4FF')}${tile(hot,'🔥 Hot','#C2410C','#FFF4ED')}${tile(un,'Unassigned',un?'#D92D20':'#667085',un?'#FEF3F2':'#F2F4F7')}${tile(won,'Won','#1F9D55','#ECFDF3')}</div></div>`+o};
document.head.insertAdjacentHTML('beforeend',`<style>
@media(max-width:820px){
 html.mob #main[data-v="crm"] .cmwrap{margin-top:0}

 .mcrh{display:flex;flex-direction:column;gap:8px;margin:0 0 10px}
 .mcrh .ccdd{position:relative}.mcrh .ccbtn{width:100%;display:flex;align-items:center;gap:10px;background:#fff!important;border:1px solid var(--line)!important;border-left:4px solid var(--cc)!important;border-radius:14px!important;padding:8px 12px!important;color:#101828!important;box-shadow:0 1px 2px rgba(16,24,40,.05)}
 .mcrh .ccav{width:36px!important;height:36px!important;border-radius:10px!important;background:var(--cc)!important;color:#fff!important;font-size:12px!important;flex:none}
 .mcrh .cctx{flex:1;min-width:0;text-align:left}.mcrh .cctx b{display:block;font-size:15px;color:#101828!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mcrh .cctx small{color:var(--mut)!important;font-size:12px}
 .mcrh .ccchev{color:#475467!important;font-size:16px}
 .mcrh .ccmenu{position:absolute!important;left:0;right:0;top:calc(100% + 6px);z-index:60;max-height:60vh;overflow-y:auto;border-radius:16px!important;box-shadow:0 16px 40px rgba(16,24,40,.22)!important}
 .mtabs{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;background:#E9ECF2;border-radius:14px;padding:4px;flex:1 1 100%}
 .mtabs button{display:flex;align-items:center;justify-content:center;gap:6px;border:0;background:none;border-radius:11px;padding:9px 4px;font:inherit;font-size:13px;font-weight:700;color:#475467;min-width:0;white-space:nowrap}
 .mtabs button svg{width:15px;height:15px;flex:none}@media(max-width:420px){.mtabs button svg{display:none}}.mtabs button em{font-style:normal;font-size:10.5px;background:#D0D5DD;color:#344054;border-radius:999px;padding:0 6px}
 .mtabs button.on{background:#fff;color:var(--navy);box-shadow:0 1px 3px rgba(16,24,40,.14)}.mtabs button.on em{background:var(--navy);color:#fff}
 html.mob .cmbar{display:block!important;margin:0 0 8px!important}html.mob .cmbar .cseg{display:none!important}
 .mown{display:inline-flex;align-items:center;gap:6px;background:#fff;border:1px solid var(--line);border-radius:999px;padding:0 4px 0 10px;margin:0 0 10px}.mown svg{width:15px;height:15px;color:var(--mut)}
 .mown select{border:0!important;background-color:transparent!important;min-height:34px!important;font-size:13px!important;font-weight:600;padding:0 26px 0 0!important;width:auto!important;box-shadow:none!important}
 .mpipe{background:#fff;border-radius:16px;padding:12px;margin:0 0 12px;box-shadow:0 1px 2px rgba(16,24,40,.05);width:100%;box-sizing:border-box}
 .mpiph{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px}.mpiph b{font-size:15px}.mpiph span{font-size:12px;color:var(--mut);font-weight:600}
 .mpipe .mfunb{display:flex;height:10px;border-radius:99px;overflow:hidden;gap:2px}.mpipe .mfunb i{display:block;min-width:8px}
 .mleg{display:flex;flex-wrap:wrap;gap:4px 12px;margin:8px 0 10px;font-size:11.5px;color:#475467}.mleg span{display:inline-flex;align-items:center;gap:5px}.mleg i{width:8px;height:8px;border-radius:50%}.mleg b{color:#101828}
 .mpts{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.mpt{background:var(--b);border-radius:12px;padding:8px 4px;text-align:center}.mpt b{display:block;font-size:20px;color:var(--c);line-height:1.1}.mpt span{font-size:10.5px;font-weight:700;color:#475467}

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

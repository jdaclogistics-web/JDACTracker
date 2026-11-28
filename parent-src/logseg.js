/* ===== CRM: companies with two CRMs show them as two entries in the company picker (no tabs inside the board)
   · JDAC Logistics → Sellers (CSEs) and Vendors (operations)
   · HR Consultancy → Company (client companies) and Employees (job seekers) ===== */
CM_SEGS.log=[['cu','Sellers'],['tr','Vendors']];CM_FUN['log:cu'].n='Sellers';CM_FUN['log:tr'].n='Vendors';
CM_SEGS.hr=[['cl','Company'],['js','Employees']];CM_FUN['hr:cl'].n='Company CRM';CM_FUN['hr:js'].n='Employees CRM';
const SEG_NM={log:{cu:['JDAC Logistics · Sellers','LS'],tr:['JDAC Logistics · Vendors','LV']},hr:{cl:['HR Consultancy · Company','HC'],js:['HR Consultancy · Employees','HE']}};
const LOG_SEG={imran:'cu',neetu:'cu',balaji:'cu',shubham:'tr',mohin:'tr',omadsul:'tr'};
const segMine=co=>{const L=(cmSegs(co)||[]).map(x=>x[0]);if(co==='log'&&!isAdm()&&LOG_SEG[S.me])return [LOG_SEG[S.me]];return L};
/* operations people get the Logistics CRM too (Vendors) */
const _cmExLS=cmExtraCos;cmExtraCos=function(){const L=_cmExLS();return LOG_SEG[S.me]&&!L.includes('log')?[...L,'log']:L};
const _myWaLS=myWaTeams;myWaTeams=function(){const T=_myWaLS();if((S.v==='crm'||S.v==='chat')&&LOG_SEG[S.me]&&cmCo()==='log')return [...new Set([...T,...cmTeams('log')])];return T};
const segFix=()=>{const co=S.cmco;if(SEG_NM[co]){const M=segMine(co);if(!M.includes(S.cmseg))S.cmseg=M[0]}};
const _vCrmLS=V.crm;V.crm=()=>{segFix();return _vCrmLS()};
const _cmCoLS=A.cmCo;A.cmCo=e=>{if(e.dataset&&e.dataset.seg)S.cmseg=e.dataset.seg;_cmCoLS(e);segFix()};
const _chHeadLS=chatHead;chatHead=function(){const o=_chHeadLS.apply(this,arguments);if(S.v!=='crm')return o;segFix();
 const t=document.createElement('template');t.innerHTML=o;
 Object.keys(SEG_NM).forEach(co=>{const opt=t.content.querySelector(`.ccmenu [data-a="cmCo"][data-k="${co}"]`);if(!opt)return;
  segMine(co).slice().reverse().forEach(sg=>{const b=opt.cloneNode(true),on=S.cmco===co&&S.cmseg===sg;b.dataset.seg=sg;b.classList.toggle('on',on);b.setAttribute('aria-selected',on);const nb=b.querySelector('.cctx b');if(nb)nb.textContent=SEG_NM[co][sg][0];const av=b.querySelector('.ccav');if(av)av.textContent=SEG_NM[co][sg][1];opt.after(b)});opt.remove()});
 const cur=SEG_NM[S.cmco]&&SEG_NM[S.cmco][S.cmseg];if(cur){const hb=t.content.querySelector('.ccbtn .cctx b');if(hb)hb.textContent=cur[0];const av=t.content.querySelector('.ccbtn .ccav');if(av)av.textContent=cur[1]}
 return t.innerHTML};
const _cmToolsLS=cmTools;cmTools=function(){let o=_cmToolsLS.apply(this,arguments);const co=cmCo();if(!SEG_NM[co])return o;
 o=o.replace(/<div class="cseg cmseg" role="tablist">[\s\S]*?<\/div>/,'');
 const nw=co==='log'?(cmSeg()==='tr'?'New vendor':'New seller'):(cmSeg()==='js'?'New employee':'New company');
 return o.replace(/(data-a="waNew">[\s\S]*?)New [a-z ]+?(<\/button>)/,'$1'+nw+'$2')};
/* HR Desk → Employee Master: the group button itself opens the employee list, so no second "Employee master" button in the row */
const _peopleNM=V.people;V.people=()=>{const o=_peopleNM();return o.replace(/(<div class="chips hrsub"[^>]*>)([\s\S]*?)(<\/div>)/,(m,a,b,c)=>a+b.replace(/<button[^>]*data-t="master"[\s\S]*?<\/button>/,'')+c)};
/* CRM board cards: name (or "New CX" when we have no name), number, tags (hot lead etc.), owner, WhatsApp + call. Whole card opens the customer. */
const cxName=c=>{const n=String(c.n||'').trim();return !n||/^[+\d\s\-()]+$/.test(n)||/^[^a-z]*$/i.test(n.replace(/[@!$#.]/g,''))&&n.replace(/\D/g,'').length>5?'':n};
const cmCard2=c=>{const nm0=cxName(c);return `<div class="cmc cmc2 ${c.unread?'un':''} ${S.cmd===c.id?'sel':''}" draggable="true" data-cid="${c.id}" data-a="cmOpen" data-id="${c.id}" tabindex="0">
 <div class="cmt2"><span class="sfav ${c.unread?'ring':''}">${nm0?sfIni(nm0):'CX'}</span><span class="cmn"><b class="${nm0?'':'cxnew'}">${h(nm0||'New CX')}</b><small>${h(c.ph)}</small></span>${c.unread?`<span class="cmu">${c.unread}</span>`:''}</div>
 ${cmTagRow(c)}<div class="cmf">${c.to?`<span class="cmo">${av(nm(c.to),'s')}${h(nmF(c.to))}</span>`:'<span class="cmo none">Unassigned</span>'}<span class="sp"></span><button class="cmb wa" data-a="cmOpen" data-id="${c.id}" data-tab="chat" title="WhatsApp chat">${ic('chat')}</button><button class="cmb call" data-a="cmCall" data-id="${c.id}" title="Call from company number">${ic('phone')}</button></div></div>`};
boardView=function(L){return `<div class="cmboard">${CM_COL.map(([k,l,,col])=>{const C=L.filter(c=>cmColOf(c)===k).sort((a,b)=>(b.at>a.at?1:b.at<a.at?-1:(waLast(b).at||'').localeCompare(waLast(a).at||'')));
 return `<div class="cmcol" style="--c:${col}" data-col="${k}"><div class="cmh"><i></i><b>${l}</b><span>${C.length}</span></div>${C.map(cmCard2).join('')||'<div class="cmdrop">Drop here</div>'}</div>`}).join('')}</div>`};
document.head.insertAdjacentHTML('beforeend',`<style>.cmc2{cursor:pointer}.cmt2{display:flex;align-items:center;gap:10px;min-width:0}.cmt2 .cmn{min-width:0;flex:1}.cmt2 .cmn b{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cmt2 .cmn small{display:block}.cmn b.cxnew{color:var(--mut);font-style:italic}.cmc2 .cmtg{margin:8px 0 4px}</style>`);
document.head.insertAdjacentHTML('beforeend',`<style>.cmc2{position:relative}.cmc2 .cmt2 .sfav{width:28px!important;height:28px!important;font-size:11px!important;flex:none}.cmc2 .cmn small{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:11.5px}.cmc2 .cmu{position:absolute;top:6px;right:6px}.cmc2 .cmt2{padding-right:14px}.cmc2 .cmo{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}</style>`);
/* lead cards: slight zoom on hover and on the open card, soft premium shadow */
document.head.insertAdjacentHTML('beforeend',`<style>.cmc2{transition:transform .18s ease,box-shadow .18s ease;transform-origin:center;will-change:transform}.cmc2:hover{transform:scale(1.035);box-shadow:0 10px 24px rgba(16,24,40,.12);z-index:2}.cmc2.sel{transform:scale(1.035);box-shadow:0 0 0 2px var(--navy),0 10px 24px rgba(16,24,40,.14);z-index:3}@media (prefers-reduced-motion:reduce){.cmc2,.cmc2:hover,.cmc2.sel{transition:none;transform:none}}</style>`);

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

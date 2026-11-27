/* ===== HR Desk polish: Employee Master sub-sections as cards · org chart with Admin, CSE, Warehouse panels · compact Work access ===== */
Object.assign(I,{key:'<circle cx="7.5" cy="15.5" r="4.5"/><path d="M10.7 12.3L21 2M16 7l3 3M14 9l2 2"/>',tree:'<rect x="9" y="2" width="6" height="5" rx="1"/><rect x="2" y="17" width="6" height="5" rx="1"/><rect x="16" y="17" width="6" height="5" rx="1"/><path d="M12 7v5M5 17v-3h14v3"/>'});
/* sub-sections under Employee Master: premium cards, not plain chips */
const HR_SUB={org:['Org chart','Who reports to whom','tree'],login:['Login credentials','User IDs & passwords','key'],wacc:['Work access','Who can open what','lock']};
const _peopleHU=V.people;V.people=()=>{const o=_peopleHU();if(!['master','org','login','wacc'].includes(S.ptab))return o;
 return o.replace(/<div class="chips hrsub"[^>]*>[\s\S]*?<\/div>/,()=>`<div class="hrcards">${Object.entries(HR_SUB).filter(([k])=>k!=='wacc'||isTop()).map(([k,[t,s,i]])=>`<button class="hrcard ${S.ptab===k?'on':''}" data-a="ptab" data-t="${k}" aria-pressed="${S.ptab===k}"><i>${ic(i)}</i><span><b>${t}</b><small>${s}</small></span></button>`).join('')}${S.ptab!=='master'?`<button class="hrback" data-a="ptab" data-t="master">${ic('back')}Employee list</button>`:''}</div>`)};
/* org chart: Admin · Operations · CSE · Marketing · Warehouse · Goa Team · Accounts */
const ORG_LBL={'Customer Success':'CSE','Warehouse · Pune':'Warehouse','HR':'Admin'};
pOrg=function(){const A0=D.emp.filter(e=>e.st==='Active'),DC=Object.fromEntries(DEPTS);
 const card=(n,role,id,c,eid)=>`<button class="ocard" ${eid?`data-a="empView" data-id="${eid}"`:''} style="--oc:${c}">${av(n)}<div><b>${h(n)}</b><span>${h(role)}</span>${id?`<em>${id}</em>`:''}</div></button>`;
 const ORD=['nameera','snehalb','omadsul','mohin','shubham','neetu','balaji','imran','swapnil','omparvate','himanshu','zubair','mustafa','samadhan','abrar','atmaram','yogesh','snehalz'],rk=e=>{const i=ORD.indexOf(e.k);return i<0?99:i};
 const dept=d=>{const mem=A0.filter(e=>e.unit===d).sort((a,b)=>rk(a)-rk(b)||String(a.id).localeCompare(String(b.id)));if(!mem.length)return '';return `<li><div class="odept" style="--oc:${DC[d]}">${h(ORG_LBL[d]||d)}<small>${mem.length}</small></div><div class="oladder" style="--oc:${DC[d]}">${mem.map(e=>card(e.n,e.desig,e.id,DC[d],e.id)).join('')}</div></li>`};
 setTimeout(()=>{try{const c=document.querySelector('.ochart'),u=c&&c.firstElementChild;if(!u)return;u.style.zoom=1;u.style.zoom=Math.min(1,(c.clientWidth-32)/u.scrollWidth)}catch(x){}},0);
 return `<div class="ochart"><ul><li>${card('Darshan Soni','Director','','#24408E','')}<ul>${['HR','Operations','Customer Success','Marketing','Warehouse · Pune','Goa Team','Accounts'].map(dept).join('')}</ul></li></ul></div><div class="note">Every team reports to Darshan. Admin is Nameera (HR Manager) with Snehal B; CSE is Neetu, Balaji and Imran; Warehouse is Zubair (manager) with Mustafa, Samadhan and Abrar. Tap anyone to open their profile; change a department with ✎ in the employee list.</div>`};
/* Work access: one line per person, name only */
WKacc=function(){const E=(D.emp||[]).filter(e=>e.st==='Active'&&e.k&&!TOP.includes(e.k)).sort((a,b)=>String(a.n).localeCompare(String(b.n)));
 const cell=(e,k)=>{const a=wkOf(e.k),T=CTABS[k].filter(x=>a[k+':'+x[0]]);if(!T.length)return '<span class="wk0">—</span>';const ne=T.filter(x=>a[k+':'+x[0]]==='edit').length,nv=T.length-ne;if(T.length===CTABS[k].length||T.length>3||T.reduce((n,x)=>n+x[1].length,0)>30)return (ne?`<span class="wk edit" title="${h(T.filter(x=>a[k+':'+x[0]]==='edit').map(x=>x[1]).join(', '))}">${T.length===CTABS[k].length&&!nv?'All tabs':ne+' edit'}</span>`:'')+(nv?`<span class="wk view" title="${h(T.filter(x=>a[k+':'+x[0]]==='view').map(x=>x[1]).join(', '))}">${T.length===CTABS[k].length&&!ne?'All tabs':nv+' view'}</span>`:'');return T.map(x=>`<span class="wk ${a[k+':'+x[0]]}" title="${a[k+':'+x[0]]==='view'?'View only':'Can edit'}">${h(x[1])}</span>`).join('')};
 return `<div class="wahead"><span><i class="wk edit">Edit</i> can work in it</span><span><i class="wk view">View</i> can only look</span><span class="mut">Everyone always has Dashboard, Tasks, CRM, Communication and Tool Section.</span></div>
 <div class="wawrap"><table class="watab"><thead><tr><th>Employee</th>${COK.map(k=>`<th><span class="stdot" style="background:${CO[k].c}"></span>${h(coShort(k))}</th>`).join('')}<th></th></tr></thead><tbody>${E.map(e=>`<tr data-a="waOpen" data-k="${e.k}" tabindex="0"><td class="wan">${av(e.n)}<b>${h(e.n)}</b></td>${COK.map(k=>`<td><div class="wkl">${cell(e,k)}</div></td>`).join('')}<td class="wago">${ic('right')}</td></tr>`).join('')}</tbody></table></div>`};
document.head.insertAdjacentHTML('beforeend',`<style>
.hrcards{display:flex;flex-wrap:wrap;gap:10px;margin:4px 0 14px;align-items:stretch}
.hrcard{display:flex;align-items:center;gap:12px;min-width:220px;background:#fff;border:1px solid var(--line);border-radius:16px;padding:12px 16px;cursor:pointer;font:inherit;text-align:left;transition:box-shadow .15s,border-color .15s}
.hrcard:hover{box-shadow:0 8px 22px rgba(20,30,50,.08)}.hrcard>i{width:40px;height:40px;border-radius:12px;background:#EEF2FB;color:var(--navy);display:grid;place-items:center;flex:none}.hrcard>i svg{width:20px;height:20px}
.hrcard b{display:block;font-size:14.5px}.hrcard small{display:block;font-size:12px;color:var(--mut)}.hrcard.on{border-color:var(--navy);box-shadow:0 0 0 2px var(--navy) inset}.hrcard.on>i{background:var(--navy);color:#fff}
.hrback{display:inline-flex;align-items:center;gap:6px;margin-left:auto;border:0;background:none;color:var(--navy);font:600 13.5px inherit;cursor:pointer}.hrback svg{width:16px;height:16px}
.ocard b,.odept{font-family:inherit!important}.ocard b{font-weight:700}
.xsheet.master td.stk{white-space:nowrap;min-width:230px}.xsheet.master td.stk>div{border:0!important;box-shadow:none!important;background:none!important;padding:0!important;margin:0!important;gap:8px!important}.xsheet.master td.stk b{white-space:nowrap;font-weight:600}
.xsheet.master .stk{min-width:230px!important}.xsheet.master td{white-space:nowrap}
.wahead{display:flex;flex-wrap:wrap;gap:16px;align-items:center;font-size:12.5px;margin:2px 0 10px}.wahead i{font-style:normal}
.wawrap{background:#fff;border:1px solid var(--line);border-radius:16px;overflow:auto}
.watab{width:100%;border-collapse:collapse;font-size:13px}.watab th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--mut);padding:10px 12px;background:#F7F8FA;border-bottom:1px solid var(--line);white-space:nowrap}
.watab td{padding:8px 12px;border-bottom:1px solid var(--line);vertical-align:middle}.watab tr:last-child td{border-bottom:0}.watab tbody tr{cursor:pointer}.watab tbody tr:hover td{background:#FAFBFD}
.watab .wan{white-space:nowrap;display:flex;align-items:center;gap:9px}.watab .wan .av{width:28px;height:28px;font-size:11px}.watab .wan b{font-weight:600}
.wkl{display:flex;flex-wrap:nowrap;gap:4px;white-space:nowrap}.wk{display:inline-flex;align-items:center;gap:4px;font-size:11.5px;font-weight:600;padding:2px 8px;border-radius:999px}
.wk.edit{background:#E7F6EE;color:#13804B}.wk.view{background:#FFF4E5;color:#8A5300}.wk0{color:#C3C8D2}.wago{width:24px;color:var(--mut)}.wago svg{width:16px;height:16px}
</style>`);

/* JDAC Logistics header: "Dedicated & Committed" on the right */
const _coHeadHU=coHead;coHead=function(k){const o=_coHeadHU(k);if(k!=='log')return o;const i=o.lastIndexOf('</div>');return o.slice(0,i)+'<div class="cotag">Just Dedicated &amp; Committed</div>'+o.slice(i)};
document.head.insertAdjacentHTML('beforeend',`<style>.cohead{position:relative}.cotag{margin-left:auto;align-self:center;font:italic 600 18px Georgia,'Times New Roman',serif;letter-spacing:.02em;color:#fff;opacity:.95;padding-left:16px;white-space:nowrap}@media(max-width:700px){.cotag{font-size:13px}}</style>`);

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
 const ORD=['nameera','snehalb','omadsul','mohin','neetu','balaji','imran','swapnil','omparvate','himanshu','zubair','shubham','abrar','mustafa','samadhan','atmaram','yogesh','snehalz'],rk=e=>{const i=ORD.indexOf(e.k);return i<0?99:i};
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
.hrback{display:inline-flex;align-items:center;gap:6px;margin-left:auto;border:0;background:none;color:var(--navy);font-weight:600;font-size:13.5px;font-family:inherit;cursor:pointer}.hrback svg{width:16px;height:16px}
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
/* Employee list: spreadsheet look — grid lines, compact rows, grey header, frozen ID + name */
document.head.insertAdjacentHTML('beforeend',`<style>
.xsheet.master{border:1px solid #D0D5DD!important;border-radius:10px!important;background:#fff;box-shadow:none!important}
.xsheet.master table{border-collapse:separate!important;border-spacing:0!important;font-variant-numeric:tabular-nums}
.xsheet.master th{background:#F3F4F6!important;color:#374151!important;font-weight:600!important;font-size:11.5px!important;font-family:inherit;text-transform:none!important;letter-spacing:0!important;padding:7px 10px!important;border-right:1px solid #E1E4E8!important;border-bottom:1px solid #D0D5DD!important;position:sticky;top:0;z-index:2;white-space:nowrap}
.xsheet.master td{padding:5px 10px!important;font-size:12.5px!important;border-right:1px solid #ECEEF1!important;border-bottom:1px solid #ECEEF1!important;height:34px;background:#fff}
.xsheet.master tbody tr:nth-child(even) td{background:#FAFBFC}.xsheet.master tbody tr:hover td{background:#EEF4FF!important}
.xsheet.master td.stk0,.xsheet.master td.stk{background:#fff}.xsheet.master tbody tr:nth-child(even) td.stk0,.xsheet.master tbody tr:nth-child(even) td.stk{background:#FAFBFC}
.xsheet.master th.stk0,.xsheet.master th.stk{z-index:4!important;background:#F3F4F6!important}
.xsheet.master .stk{box-shadow:2px 0 0 #D0D5DD}
.xsheet.master .eid{font:600 11.5px ui-monospace,Menlo,monospace!important;background:none!important;color:#1F3A93!important;padding:0!important}
.xsheet.master td.stk .av{width:22px!important;height:22px!important;font-size:9.5px!important}.xsheet.master td.stk b{font-size:12.5px;font-weight:600}
.xsheet.master .pill,.xsheet.master .dpt{font-size:11px!important;padding:1px 8px!important;min-width:0!important}
.xsheet.master .tgl{padding:2px 8px!important;font-size:11px!important;min-height:0!important;border-radius:6px!important}
.xsheet.master .actg button{width:26px!important;height:26px!important}
.watab td{padding:7px 10px}.watab th{padding:9px 10px}
</style>`);
/* premium finish on the spreadsheet: soft lines, one-line cells, aligned name column */
document.head.insertAdjacentHTML('beforeend',`<style>
.xsheet.master{border:1px solid #E4E7EC!important;border-radius:14px!important;box-shadow:0 1px 2px rgba(16,24,40,.04),0 6px 20px rgba(16,24,40,.05)!important}
.xsheet.master th{background:#F8FAFC!important;color:#667085!important;font-weight:600!important;font-size:11px!important;font-family:inherit;text-transform:uppercase!important;letter-spacing:.06em!important;padding:11px 12px!important;border-right:0!important;border-bottom:1px solid #E4E7EC!important}
.xsheet.master td{padding:0 12px!important;height:44px;border-right:0!important;border-bottom:1px solid #F0F2F5!important;white-space:nowrap!important;vertical-align:middle!important;font-size:13px!important;color:#1D2939}
.xsheet.master tbody tr:nth-child(even) td{background:#fff}.xsheet.master tbody tr:nth-child(even) td.stk0,.xsheet.master tbody tr:nth-child(even) td.stk{background:#fff}
.xsheet.master tbody tr:hover td,.xsheet.master tbody tr:hover td.stk0,.xsheet.master tbody tr:hover td.stk{background:#F5F8FF!important}
.xsheet.master .stk{box-shadow:1px 0 0 #E4E7EC}
.xsheet.master td.stk>div{display:flex!important;align-items:center!important;height:100%}.xsheet.master td.stk .av{display:inline-grid!important;place-items:center;width:26px!important;height:26px!important;font-size:10px!important;margin:0!important}
.xsheet.master td.stk span.av{display:inline-grid!important}.xsheet.master td.stk b{font-size:13px;font-weight:600;line-height:1}
.xsheet.master .eid{color:#475467!important;font-weight:600!important}
.xsheet.master td:nth-child(5),.xsheet.master th:nth-child(5){min-width:210px}.xsheet.master td{overflow:visible}
.xsheet.master .pill,.xsheet.master .dpt{font-size:11.5px!important;padding:2px 10px!important;border-radius:999px!important}
</style>`);
/* Org chart: CSE = Neetu, Balaji, Imran · Camp Warehouse = Zubair (Warehouse Manager) with Shubham, Abrar, Mustafa, Samadhan */
ORG_LBL['Warehouse · Pune']='Camp Warehouse';
function orgFix3(){if(!D.emp)return;let ch=0;const set=(k,o)=>{const e=D.emp.find(x=>x.k===k||new RegExp('^'+k+'\\b','i').test(x.n||''));if(!e)return;Object.keys(o).forEach(f=>{if(e[f]!==o[f]){e[f]=o[f];ch=1}})};
 ['neetu','balaji','imran'].forEach(k=>set(k,{unit:'Customer Success'}));
 set('zubair',{unit:'Warehouse · Pune',desig:'Warehouse Manager'});['shubham','abrar','mustafa','samadhan'].forEach(k=>set(k,{unit:'Warehouse · Pune',lead:'zubair'}));
 if(ch)save()}
orgFix3();
const _pOrg3=pOrg;pOrg=function(){orgFix3();
 const o=_pOrg3().replace(/Warehouse is Zubair \(manager\) with Mustafa, Samadhan and Abrar/,'Camp Warehouse is Zubair (Warehouse Manager) with Shubham, Abrar, Mustafa and Samadhan');
 if(!isMob())return o;
 /* phone: one drop-down per department instead of a tiny zoomed chart */
 const A0=D.emp.filter(e=>e.st==='Active'),DC=Object.fromEntries(DEPTS),ORD=['nameera','snehalb','omadsul','mohin','neetu','balaji','imran','swapnil','omparvate','himanshu','zubair','shubham','abrar','mustafa','samadhan','atmaram','yogesh','snehalz'],rk=e=>{const i=ORD.indexOf(e.k);return i<0?99:i};
 S.orgO=S.orgO||{};
 const dep=d=>{const M=A0.filter(e=>e.unit===d).sort((a,b)=>rk(a)-rk(b));if(!M.length)return '';const op=!!S.orgO[d];
  return `<div class="omd" style="--oc:${DC[d]}"><button class="omdh" data-a="orgTg" data-k="${h(d)}" aria-expanded="${op}"><i></i><b>${h(ORG_LBL[d]||d)}</b><span>${M.length}</span><em>${M.map(e=>h(nmF(e.k)||e.n.split(' ')[0])).join(', ')}</em><u>${op?'▴':'▾'}</u></button>${op?`<div class="omdl">${M.map((e,i)=>`<button class="omdp ${i===0&&/manager|incharge/i.test(e.desig||'')?'lead':''}" data-a="empView" data-id="${e.id}">${av(e.n)}<span><b>${h(e.n)}</b><small>${h(e.desig||'')}</small></span><em>${h(e.id||'')}</em></button>`).join('')}</div>`:''}</div>`};
 return `<div class="omtop">${av('Darshan Soni')}<span><b>Darshan Soni</b><small>Director · every team reports here</small></span></div><div class="oml">${['HR','Operations','Customer Success','Marketing','Warehouse · Pune','Goa Team','Accounts'].map(dep).join('')}</div>`};
A.orgTg=e=>{const k=e.dataset.k;S.orgO=S.orgO||{};S.orgO[k]=!S.orgO[k];render()};
document.head.insertAdjacentHTML('beforeend',`<style>
.omtop{display:flex;align-items:center;gap:10px;background:#24408E;color:#fff;border-radius:14px;padding:10px 12px;margin-bottom:8px}.omtop b{display:block;font-size:14px}.omtop small{font-size:11.5px;opacity:.85}
.oml{display:flex;flex-direction:column;gap:6px}
.omd{background:#fff;border:1px solid var(--line);border-left:4px solid var(--oc);border-radius:12px;overflow:hidden}
.omdh{display:grid;grid-template-columns:auto auto 1fr auto;grid-template-rows:auto auto;column-gap:8px;align-items:center;width:100%;border:0;background:none;padding:9px 12px;font:inherit;text-align:left;cursor:pointer}
.omdh i{display:none}.omdh b{font-size:14px;grid-column:1}.omdh span{grid-column:2;font-size:11px;font-weight:700;background:var(--oc);color:#fff;border-radius:999px;padding:0 7px}
.omdh u{grid-column:4;grid-row:1/3;text-decoration:none;color:var(--mut);font-size:13px}
.omdh em{grid-column:1/4;grid-row:2;font-style:normal;font-size:11.5px;color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.omdl{border-top:1px solid var(--line)}
.omdp{display:flex;align-items:center;gap:9px;width:100%;border:0;border-bottom:1px solid #F0F1F4;background:none;padding:8px 12px;font:inherit;text-align:left;cursor:pointer}.omdp:last-child{border-bottom:0}
.omdp .av{width:30px;height:30px;font-size:11px}.omdp span{flex:1;min-width:0}.omdp b{display:block;font-size:13px}.omdp small{font-size:11.5px;color:var(--mut)}.omdp em{font-style:normal;font-size:10.5px;color:var(--mut)}
.omdp.lead{background:#F6F8FD}.omdp.lead small{color:var(--oc);font-weight:700}
</style>`);

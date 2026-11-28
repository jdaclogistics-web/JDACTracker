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
/* ===== HR Desk premium colours: every section and sub-tab has its own colour ===== */
document.head.insertAdjacentHTML('beforeend',`<style>
#main .hrg{gap:10px;background:none!important;padding:0!important}
#main .hrg button{--c1:#0F766E;--c2:#14B8A6;--t:#E6F7F4;border-radius:14px!important;border:1px solid color-mix(in srgb,var(--c2) 35%,#fff)!important;background:var(--t)!important;color:var(--c1)!important;font-weight:700!important;transition:transform .12s,box-shadow .15s}
#main .hrg button[data-t="ge"]{--c1:#1E3A8A;--c2:#6366F1;--t:#EEF0FF}
#main .hrg button[data-t="gp"]{--c1:#581C87;--c2:#9333EA;--t:#F5EDFF}
#main .hrg button:hover{transform:translateY(-1px);box-shadow:0 6px 16px color-mix(in srgb,var(--c2) 25%,transparent)}
#main .hrg button.on{background:linear-gradient(135deg,var(--c1),var(--c2))!important;color:#fff!important;border-color:transparent!important;box-shadow:0 8px 20px color-mix(in srgb,var(--c1) 35%,transparent)}
#main .hrsub{gap:8px!important}
#main .hrsub button{--c1:#0F766E;--c2:#14B8A6;--t:#E9F8F5;background:var(--t)!important;color:var(--c1)!important;border:1px solid color-mix(in srgb,var(--c2) 35%,#fff)!important;font-weight:600!important}
#main .hrsub button[data-t="att"]{--c1:#3730A3;--c2:#6366F1;--t:#EEEFFE}
#main .hrsub button[data-t="leave"]{--c1:#9F1239;--c2:#E11D48;--t:#FFF0F3}
#main .hrsub button[data-t="hol"]{--c1:#92400E;--c2:#F59E0B;--t:#FFF6E5}
#main .hrsub button[data-t="pay"]{--c1:#065F46;--c2:#10B981;--t:#E8F8F1}
#main .hrsub button[data-t="inc"]{--c1:#075985;--c2:#0EA5E9;--t:#EAF6FD}
#main .hrsub button[data-t="appr"]{--c1:#9D174D;--c2:#DB2777;--t:#FDEEF5}
#main .hrsub button.on{background:linear-gradient(135deg,var(--c1),var(--c2))!important;color:#fff!important;border-color:transparent!important;box-shadow:0 6px 14px color-mix(in srgb,var(--c1) 30%,transparent)}
#main .hrcard{--c1:#5B21B6;--c2:#8B5CF6;--t:#F5F0FF;background:linear-gradient(135deg,#fff 40%,var(--t))!important;border-color:color-mix(in srgb,var(--c2) 30%,#fff)!important}
#main .hrcard[data-t="login"]{--c1:#92400E;--c2:#D4A017;--t:#FFF7E3}
#main .hrcard[data-t="wacc"]{--c1:#065F46;--c2:#10B981;--t:#E9F9F2}
#main .hrcard>i{background:linear-gradient(135deg,var(--c1),var(--c2))!important;color:#fff!important;box-shadow:0 4px 10px color-mix(in srgb,var(--c1) 30%,transparent)}
#main .hrcard b{color:var(--c1)}
#main .hrcard.on{border-color:var(--c1)!important;box-shadow:0 0 0 2px var(--c1) inset,0 8px 20px color-mix(in srgb,var(--c1) 20%,transparent)!important;background:linear-gradient(135deg,var(--t),#fff)!important}
#main .stats>*{border-top:3px solid #CBD5E1}
#main .stats>*:nth-child(5n+1){border-top-color:#10B981;background:linear-gradient(180deg,#F0FBF6,#fff)}
#main .stats>*:nth-child(5n+2){border-top-color:#E11D48;background:linear-gradient(180deg,#FFF3F5,#fff)}
#main .stats>*:nth-child(5n+3){border-top-color:#6366F1;background:linear-gradient(180deg,#F2F3FF,#fff)}
#main .stats>*:nth-child(5n+4){border-top-color:#D4A017;background:linear-gradient(180deg,#FFF9EC,#fff)}
#main .stats>*:nth-child(5n+5){border-top-color:#1E3A8A;background:linear-gradient(180deg,#F1F4FB,#fff)}
.watab th{background:linear-gradient(135deg,#0F2A5F,#1E3A8A)!important;color:#E7ECF8!important}
.watab th .stdot{box-shadow:0 0 0 2px rgba(255,255,255,.6)}
.watab tbody tr:nth-child(even) td{background:#FAFBFF}
.watab tbody tr:hover td{background:#EEF2FF!important}
.watab .wan b{color:#1E3A8A}
.wk.edit{background:linear-gradient(135deg,#D1FAE5,#A7F3D0)!important;color:#065F46!important}
.wk.view{background:linear-gradient(135deg,#FEF3C7,#FDE68A)!important;color:#92400E!important}
.wawrap{border-color:#C7D2FE!important;box-shadow:0 6px 18px rgba(30,58,138,.07)}
</style>`);
document.head.insertAdjacentHTML('beforeend',`<style>
html.mob #main .hrcards{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
html.mob #main .hrcard{min-width:0;flex-direction:column;align-items:flex-start;gap:6px;padding:9px 10px;border-radius:13px}
html.mob #main .hrcard>i{width:30px;height:30px;border-radius:9px}html.mob #main .hrcard>i svg{width:16px;height:16px}
html.mob #main .hrcard b{font-size:12.5px;line-height:1.2}html.mob #main .hrcard small{display:none}
html.mob #main .hrback{grid-column:1/-1;margin-left:0;font-size:12.5px}
</style>`);
/* "Just Dedicated & Committed": soft fade in / fade out, no zoom */
document.head.insertAdjacentHTML('beforeend',`<style>@keyframes cotagFade{0%,100%{opacity:0}18%,72%{opacity:1}}.cotag{animation:cotagFade 4.5s ease-in-out infinite!important;transform:none!important}html.mob .cotag{animation:cotagFade 4.5s ease-in-out infinite!important}@media (prefers-reduced-motion:reduce){.cotag{animation:none!important;opacity:1}}</style>`);
/* ===== HR Consultancy → Add client: premium pop-up with designation + login details ===== */
const pcfPw=()=>{const a='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';let s='';for(let i=0;i<10;i++)s+=a[Math.floor(Math.random()*a.length)];return s};
A.hrCoNew=()=>sheet(`<div class="pcf">
 <div class="pcfh"><i>${ic('users')}</i><div><h2>Add client</h2><small>Creates the client company and their own login</small></div></div>
 <div class="pcfs"><div class="pcft"><span>1</span>Company</div>
  <label for="hcn">Company name *</label><input id="hcn" placeholder="e.g. Gupta Freight Movers">
  <div class="grid g2"><div><label for="hcc">City *</label><input id="hcc" placeholder="Pune"></div><div><label for="hci">Industry</label><input id="hci" placeholder="Logistics, Retail…"></div></div></div>
 <div class="pcfs"><div class="pcft"><span>2</span>Contact person</div>
  <div class="grid g2"><div><label for="hcp">Full name *</label><input id="hcp" placeholder="Name"></div><div><label for="hcd">Designation *</label><input id="hcd" list="hcdl" placeholder="HR Manager"><datalist id="hcdl">${['HR Manager','HR Executive','Talent Acquisition','Owner / Director','Operations Manager','Admin Manager','Accounts Manager'].map(x=>`<option value="${x}">`).join('')}</datalist></div></div>
  <label for="hcm">Mobile</label><input id="hcm" inputmode="tel" placeholder="+91"></div>
 <div class="pcfs pcfl"><div class="pcft"><span>3</span>Login details</div>
  <label for="hce">Login ID (email) *</label><input id="hce" type="email" placeholder="hr@company.com" autocomplete="off">
  <label for="hcw">Password *</label><div class="pcfpw"><input id="hcw" type="password" value="${pcfPw()}" autocomplete="new-password"><button type="button" data-a="pcfEye" title="Show / hide">${ic('eye')}</button><button type="button" data-a="pcfGen" title="New password">↻</button></div>
  <div class="pcfchk"><label><input type="checkbox" id="hcx" checked> Ask them to change the password at first login</label><label><input type="checkbox" id="hcy" checked> Email the login details to them</label></div></div>
 <div class="pcfs"><div class="pcft"><span>4</span>Billing</div>
  <label>Hiring fee (% of one month's salary)</label>${opts('hcf',['50','75','100'],'100')}
  <div class="grid g2"><div><label for="hca1">1st payment day</label><input id="hca1" type="number" value="7"></div><div><label for="hcb1">2nd payment day</label><input id="hcb1" type="number" value="45"></div></div></div>
 <button class="btn w pcfgo" data-a="hrCoSave">${ic('check')}Create client & login</button></div>`);
A.pcfEye=()=>{const i=document.getElementById('hcw');if(i)i.type=i.type==='password'?'text':'password'};
A.pcfGen=()=>{const i=document.getElementById('hcw');if(i){i.value=pcfPw();i.type='text'}};
const _hrCoSave2=A.hrCoSave;A.hrCoSave=()=>{const g=id=>{const x=document.getElementById(id);return x?x.value.trim():''},pw=g('hcw'),ds=g('hcd'),nm0=g('hcp');
 if(document.getElementById('hcw')){if(!nm0||!ds)return toast('Contact name and designation are needed');if(pw.length<6)return toast('Password needs at least 6 characters')}
 const n0=HR.C.length,mail=document.getElementById('hcy')&&document.getElementById('hcy').checked,chg=document.getElementById('hcx')&&document.getElementById('hcx').checked,em=g('hce').toLowerCase();
 _hrCoSave2();if(HR.C.length===n0)return;const c=HR.C[HR.C.length-1];
 Object.assign(c,{desig:ds||'—',pass:pw,mustChange:!!chg,login:mail?'Invite sent':'Active'});save();render();toast(`Login created for ${em}${mail?' · details emailed':''}`)};
document.head.insertAdjacentHTML('beforeend',`<style>
.pcf{margin:-4px -2px 0}
.pcfh{display:flex;align-items:center;gap:12px;margin:-6px -6px 14px;padding:16px;border-radius:18px;background:linear-gradient(135deg,#0B2E4F,#0B4F6C 55%,#0E8C9A);color:#fff;box-shadow:0 10px 24px rgba(11,79,108,.25)}
.pcfh>i{width:44px;height:44px;border-radius:13px;background:rgba(255,255,255,.16);display:grid;place-items:center;flex:none;box-shadow:inset 0 0 0 1px rgba(255,255,255,.25)}.pcfh>i svg{width:22px;height:22px}
.pcfh h2{margin:0;color:#fff;font-size:19px}.pcfh small{opacity:.85;font-size:12.5px}
.pcfs{background:linear-gradient(180deg,#FFFFFF,#F7FAFC);border:1px solid #E2E8F0;border-radius:16px;padding:12px 14px 14px;margin-bottom:10px}
.pcfl{background:linear-gradient(180deg,#F3FBFC,#EAF6F8);border-color:#BFE3EA}
.pcft{display:flex;align-items:center;gap:8px;font:700 12px Inter,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#0B4F6C;margin-bottom:2px}
.pcft span{width:20px;height:20px;border-radius:999px;background:linear-gradient(135deg,#0B4F6C,#0E8C9A);color:#fff;display:grid;place-items:center;font-size:11px;letter-spacing:0}
.pcf label{font-weight:600;color:#334155}
.pcf input:not([type=checkbox]),.pcf select{border-radius:11px!important;border:1px solid #D5DEE8!important;background:#fff!important;transition:border-color .15s,box-shadow .15s}
.pcf input:focus{border-color:#0E8C9A!important;box-shadow:0 0 0 3px rgba(14,140,154,.15)!important;outline:0}
.pcfpw{display:flex;gap:6px;align-items:center}.pcfpw input{flex:1;font-family:ui-monospace,Menlo,monospace!important;letter-spacing:.04em}
.pcfpw button{width:40px;height:40px;flex:none;border:1px solid #D5DEE8;background:#fff;border-radius:11px;display:grid;place-items:center;cursor:pointer;color:#0B4F6C;font-size:16px}.pcfpw button svg{width:17px;height:17px}
.pcfchk{display:flex;flex-direction:column;gap:6px;margin-top:10px}.pcfchk input{width:17px!important;height:17px!important;min-height:0!important;flex:none;margin:0!important;padding:0!important;accent-color:#0E8C9A}.pcfchk label{justify-content:flex-start;text-align:left;width:100%}.pcfchk label{display:flex;gap:8px;align-items:center;font-weight:500!important;font-size:12.5px;margin:0}
.pcfgo{background:linear-gradient(135deg,#0B2E4F,#0B4F6C 50%,#0E8C9A)!important;border:0!important;height:48px;font-size:15px!important;box-shadow:0 10px 22px rgba(11,79,108,.3);display:flex;align-items:center;justify-content:center;gap:8px}.pcfgo svg{width:18px;height:18px}
</style>`);

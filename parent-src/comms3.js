/* ================= Communication v4 =================
   · Add company / CRM: every WhatsApp + calling number is one entry in the company picker. One number can carry
     several CRMs (like HR Consultancy: Clients + Job seekers); a second number becomes its own entry.
   · Test leads in every company and CRM.
   · Board and WhatsApp fill the screen; no scrollbars on show (still scrolls with wheel, trackpad or touch). */
(()=>{const s=CM_CO.find(x=>x[0]==='studios');if(s&&!s[2].length)s[2].push('studios');WACO.studios='studios';WATEAM.studios='JDAC Studios'})();
const CM_PAL=['#2F6BE0','#0B6E8A','#B8860B','#7A2E8E','#0796A6','#E8772E','#1F9D55','#C0392B'];
const cmStagesCols=L=>L.map((n,i)=>[i===0?'new':i===L.length-1?'lost':i===L.length-2?'done':'s'+i,n,[n],i===L.length-1?'#C0392B':i===L.length-2?'#1F9D55':CM_PAL[i%6]]);
function cmLinesLoad(){(D.cmLines||[]).forEach(l=>{if(CM_CO.some(x=>x[0]===l.k))return;
 CM_CO.push([l.k,l.n,[l.k],l.short||l.n.slice(0,12),l.color||'#24408E']);WATEAM[l.k]=l.n;WACO[l.k]=l.k;D.comNums[l.k]=D.comNums[l.k]||{wa:l.num,vn:l.num};
 if(l.crms.length>1){CM_SEGS[l.k]=l.crms.map(c=>[c.k,c.n]);l.crms.forEach(c=>{CM_FUN[l.k+':'+c.k]={n:c.n,cols:cmStagesCols(c.stages)}})}else if(l.crms[0])CM_FUN[l.k]={n:l.crms[0].n,cols:cmStagesCols(l.crms[0].stages)}})}
cmLinesLoad();

/* picker: "Add company / CRM" next to "Edit company numbers" */
const _chHeadV4=chatHead;chatHead=function(){return _chHeadV4.apply(this,arguments).replace('<button class="ccedit" data-a="cmNums">Edit company numbers</button>','<div class="ccacts"><button class="ccedit" data-a="cmAddCo">+ Add company / CRM</button><button class="ccedit" data-a="cmNums">Edit numbers</button></div>')};
const CM_DEF_ST='New lead, Contacted, In discussion, Proposal / quote sent, Won, Lost';
A.cmAddCo=()=>{S.cmdd=false;const L=D.cmLines||[];sheet(`<h2>Add company / CRM</h2><p class="xs mut">Each WhatsApp + calling number shows as one company in Communication. If one number talks to two kinds of people (e.g. clients and job seekers), add two CRMs on the same number. If they use different numbers, add each number separately.</p>
 <label for="acn">Name shown in Communication</label><input id="acn" placeholder="e.g. HR Consultancy · Recruiter, JDAC Logistics · Transport">
 <label for="acp">WhatsApp / calling number</label><input id="acp" inputmode="tel" placeholder="+91 9xxxx xxxxx">
 <label>Colour</label>${opts('acc',[['#02496A','Navy'],['#0B4F6C','Teal'],['#7A2E8E','Purple'],['#7a4a26','Brown'],['#137a50','Green'],['#0796A6','Cyan'],['#C2410C','Orange']],'#0B4F6C')}
 ${[1,2,3].map(i=>`<div class="accrm"><b>CRM ${i}${i>1?' <span class="xs mut">(optional · same number)</span>':''}</b><label for="acr${i}">CRM name</label><input id="acr${i}" placeholder="${i===1?'e.g. Clients CRM':i===2?'e.g. Job seekers CRM':''}"><label for="acs${i}">Stages, in order (comma separated)</label><input id="acs${i}" value="${i===1?CM_DEF_ST:''}" placeholder="${CM_DEF_ST}"></div>`).join('')}
 <button class="btn w" style="margin-top:14px" data-a="cmAddCoGo">Add to Communication</button>
 ${L.length?`<div class="cmdl" style="margin-top:16px">Added by you</div><div class="list">${L.map(l=>`<div class="li"><div class="tx"><b>${h(l.n)}</b><div class="m">${h(l.num||'')} · ${l.crms.map(c=>h(c.n)).join(' + ')}</div></div><button class="btn sm sec" data-a="cmLineDel" data-k="${l.k}">Remove</button></div>`).join('')}</div>`:''}`)};
A.cmAddCoGo=()=>{const n=val('acn').trim(),num=val('acp').trim();if(!n)return toast('Enter a name');
 const crms=[1,2,3].map(i=>({k:'c'+i,n:val('acr'+i).trim(),stages:val('acs'+i).split(',').map(x=>x.trim()).filter(Boolean)})).filter((c,i)=>i===0||c.n);
 if(!crms[0].n)crms[0].n='Customers';if(crms.some(c=>c.stages.length<3))return toast('Give at least 3 stages for each CRM');
 const l={k:'x'+Date.now().toString(36),n,num,color:pick1('acc')||'#0B4F6C',short:n.split(/[·\-]/).pop().trim().slice(0,12),crms};
 D.cmLines=D.cmLines||[];D.cmLines.push(l);cmLinesLoad();save();closeM();S.cmco=l.k;S.cmseg=null;S.cmv='board';render();toast(n+' added')};
A.cmLineDel=e=>{const k=e.dataset.k;if(D.wa.some(c=>c.team===k)&&!confirm('Customers exist on this line. Remove the line anyway? (customers are kept)'))return;
 D.cmLines=(D.cmLines||[]).filter(l=>l.k!==k);const i=CM_CO.findIndex(x=>x[0]===k);if(i>=0)CM_CO.splice(i,1);delete WATEAM[k];if(S.cmco===k)S.cmco='log';save();A.cmAddCo()};

/* test leads: a few in every company and CRM, so each screen can be tried out */
if(!D.cmDemo4){D.cmDemo4=1;const T=(a,b)=>`${String(a).padStart(2,'0')}:${String(b).padStart(2,'0')}`;let i=0;
 const add=(team,seg,n,ph,stg,to,tags,ms,o={})=>{D.wa.push({id:'wd'+(++i)+Date.now().toString(36).slice(-3),n,ph,team,seg,stg,to,tags:['Test lead',...tags],unread:o.un||0,at:o.at||TODAY,src:o.src||'WhatsApp',created:o.cr||dAgo(5),info:o.info||'',ms:ms.map(([f,t,at])=>({f,t,at})),log:[{at:o.at||TODAY,tm:'10:00',t:'Stage → '+stg,by:to||'darshan'}]})};
 /* JDAC Logistics · Transport partners */
 add('ops','tr','Shree Sai Roadlines','98220 41010','New transporter',null,['FTL'],[['c','Namaste, we run 14 ft & 19 ft trucks Pune–Delhi daily. Need loads.',T(9,40)]],{un:1});
 add('ops','tr','Maruti Cargo Movers','97650 22019','Rates received','mohin',['LTL','Pune–Bangalore'],[['mohin','Please share your per-kg rate Pune to Bangalore for LTL.',T(11,5)],['c','₹9/kg, min 500 kg. Transit 3 days.',T(11,40)]]);
 add('ops','tr','Om Logistics Nashik','90110 77231','Active partner','omadsul',['FTL','Nashik'],[['c','Truck placed at your warehouse.',T(8,15)],['omadsul','Received, thanks 🙏',T(8,20)]],{at:dAgo(1)});
 /* GovaaBazaar */
 add('gb','','Shree Ganesh Stores','98230 77881','Order placed','atmaram',['Retailer','Goa'],[['atmaram','Order of 6 cartons choconut confirmed. Delivery Friday.',T(10,22)],['c','Ok 👍',T(10,30)]]);
 add('gb','','Fresh Mart Panjim','93250 11880','Catalogue / sample sent','atmaram',['Retailer'],[['atmaram','Sharing our catalogue and price list.',T(12,10)],['c','Can you send 2 samples?',T(12,45)]],{un:1});
 add('gb','','Nashik Kirana House','99702 33114','New lead',null,['Distributor'],[['c','Want distributorship for Nashik. What margin?',T(16,2)]],{un:2});
 add('gb','','Coastal Supermarket','98500 44211','Payment due','atmaram',['Retailer','Credit 15d'],[['atmaram','Invoice ₹18,400 due on 30 Nov.',T(9,0)]],{at:dAgo(2)});
 /* Jupiter */
 add('jup','','Mrs. Kulkarni (patient)','98220 66019','New enquiry',null,['Hospital bed'],[['c','Need a hospital bed for 1 month in Kothrud.',T(13,12)]],{un:1});
 add('jup','','Sahyadri Home Care','97300 55120','Quote sent','zubair',['Oxygen concentrator'],[['zubair','5L concentrator ₹4,500/month + ₹2,000 deposit.',T(11,0)],['c','Ok, will confirm by evening',T(11,25)]]);
 add('jup','','Mr. Deshpande','90280 44101','On rent','zubair',['Wheelchair','Renewal 5 Dec'],[['zubair','Rent renewal due on 5 Dec.',T(10,0)]],{at:dAgo(3)});
 /* HR Consultancy · Clients and Job seekers */
 add('hr','cl','Q-Mart Retail','98810 77001','Meeting','nameera',['Employer','10 openings'],[['nameera','Meeting confirmed for Friday 11 am at your office.',T(15,20)],['c','Done 👍',T(15,40)]]);
 add('hr','cl','Sunrise Hospital','99670 55120','Proposal sent','nameera',['Employer','Nurses'],[['nameera','Proposal shared: 8.33% of CTC, 90-day replacement.',T(12,0)]],{at:dAgo(1)});
 add('hr','cl','Pune Textiles Pvt Ltd','98901 33221','New lead',null,['Employer'],[['c','Need 5 helpers urgently for warehouse.',T(17,5)]],{un:1});
 add('hr','js','Rahul Patil','90110 22334','Interview','snehalb',['Job seeker','Warehouse'],[['snehalb','Interview at Q-Mart tomorrow 11 am.',T(14,0)],['c','Ok ma\'am, I will come.',T(14,10)]]);
 add('hr','js','Pooja Shinde','93700 88115','Registered','snehalb',['Job seeker','Nurse'],[['c','Uploaded my resume. Any nursing job in Pune?',T(10,40)]],{un:1});
 add('hr','js','Akash More','97650 99102','New',null,['Job seeker','Driver'],[['c','Driver job hai kya? Licence hai mere paas.',T(18,1)]],{un:1});
 add('hr','js','Sneha Jadhav','98220 10443','Joined','snehalb',['Job seeker','Day 7 check-in'],[['snehalb','Congratulations on joining! Day 7 check-in on Monday.',T(9,30)]],{at:dAgo(4)});
 /* Studios */
 add('studios','','Dharitri Water','98230 55661','Proposal sent','swapnil',['Social media','₹35k/mo'],[['swapnil','Shared the 3-month social media proposal.',T(16,0)]]);
 add('studios','','Bahiram Events','90280 11220','Active client','himanshu',['Website'],[['c','Landing page looks great 👏',T(12,30)]],{at:dAgo(1)});
 add('studios','','Café Mocha Pune','99210 88331','New lead',null,['Instagram ads'],[['c','Need Instagram ads for our new outlet.',T(19,10)]],{un:1});
 D.callLog=D.callLog||[];[['mohin','log','Maruti Cargo Movers','97650 22019','out','11:02','2:40','Connected'],['atmaram','gb','Fresh Mart Panjim','93250 11880','out','12:05','1:15','Connected'],['zubair','jup','Sahyadri Home Care','97300 55120','in','10:50','3:05','Connected'],['nameera','hr','Q-Mart Retail','98810 77001','out','15:10','4:20','Connected'],['snehalb','hr','Akash More','97650 99102','in','18:03','—','Missed']].forEach((c,j)=>D.callLog.push({id:'cld'+j,k:c[0],co:c[1],to:c[2],ph:c[3],dir:c[4],at:c[5],d:TODAY,dur:c[6],st:c[7]}));
 save()}

/* fit the screen, hide scrollbars */
document.head.insertAdjacentHTML('beforeend',`<style>
html.fit-centre body.cmmode .wrap,body.cmmode .wrap{max-width:none!important}
.cmwrap *{scrollbar-width:none}.cmwrap *::-webkit-scrollbar{display:none;width:0;height:0}
.cmboard{overflow-x:auto;gap:8px}.cmcol{flex:1 1 0!important;min-width:156px;padding:6px!important;max-height:calc(100vh - 205px)!important;overflow-y:auto}
.cmlay.open .cmd{max-height:calc(100vh - 205px);overflow-y:auto}
.ccacts{display:flex;gap:4px;border-top:1px solid #E6E9EF;margin-top:4px}.ccacts .ccedit{flex:1;border-top:0!important}
.cmseg button{padding-left:12px!important;padding-right:12px!important}.cmbar .t4sel{max-width:170px}
.cmc .sfav{width:34px!important;height:34px!important;font-size:12px!important;flex:none}.cmc .cmn b{font-size:13.5px}.cmc .cmn small{white-space:nowrap}
.accrm{border:1px solid var(--line);border-radius:12px;padding:10px 12px;margin-top:12px}.accrm label{margin-top:6px}
@media(max-width:820px){.cmcol{flex:0 0 82vw!important}}
</style>`);

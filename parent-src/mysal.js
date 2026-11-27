/* ===== My salary — each person sees their own month-wise salary breakup in their own panel =====
   Days and ₹ side by side: present, paid leave / week offs / holidays, half days, late marks, absent → payable days,
   then earnings (salary, DA, TA, mobile, incentives, last month carry), deductions (advance, late, absent) and net pay. */
function msRows(x,m){const k=payCalc(x,m),c=k.c,pd=k.pd,{L,H}=lateInfo(x,m),lateHD=H.length,ownHD=Math.max(0,c.HD-lateHD),paidOff=c.L+c.WO+c.H,
 full=k.full,half=k.half,earned=Math.round(full*pd+half*pd/2);
 return {k,c,pd,L,lateHD,ownHD,paidOff,full,half,earned,payDays:full+half/2,
  cutAbsent:Math.round(c.A*pd),cutHalf:Math.round(ownHD*pd/2),cutLate:Math.round(lateHD*pd/2),
  extras:k.A.slice(2).filter(a=>Math.round(a[3])),totA:k.totA,totB:k.totB,net:k.net}}
function mySalary(){const x=(D.emp||[]).find(e=>e.k===S.me);if(!x)return '';const cur=monStart(TODAY);S.msm=S.msm||(TODAY.slice(8)<'11'?mAdd(cur,-1):cur);const m=S.msm;
 const mon=new Date(m+'T12:00:00').toLocaleDateString('en-IN',{month:'long',year:'numeric'}),st=(D.payst||{})[m]||'Draft',fin=monEnd(m)<TODAY;
 const nav=`<div class="msnav"><button class="ib" data-a="msM" data-n="-1" aria-label="Previous month">‹</button><b>${mon}</b><button class="ib" data-a="msM" data-n="1" aria-label="Next month" ${m>=cur?'disabled':''}>›</button></div>`;
 if(!x.sal)return `<section class="mysal"><div class="msh"><div><h3>My salary</h3><span>Month-wise breakup</span></div>${nav}</div><div class="note">Your salary isn't set up yet. Please ask HR (Nameera).</div></section>`;
 if(x.doj>monEnd(m))return `<section class="mysal"><div class="msh"><div><h3>My salary</h3><span>Month-wise breakup</span></div>${nav}</div><div class="note">You joined on ${fmt(x.doj)} — no salary for this month.</div></section>`;
 const r=msRows(x,m),z=n=>inr(Math.round(n)),pill={Draft:['Being prepared by HR','#B8860B'],Checked:['With Darshan for approval','#B8860B'],Approved:['Approved','#1F9D55'],Sent:['Sent for payment','#24408E'],Paid:['Paid','#1F9D55']}[st]||[st,'#667'];
 const dayRow=(l,d,amt,sign,note)=>`<tr><td>${l}${note?`<small>${note}</small>`:''}</td><td class="n">${d}</td><td class="n ${sign==='-'?'neg':sign==='+'?'pos':'mutd'}">${amt==null?'—':sign==='0'?z(amt)+'<small>not paid</small>':(sign==='-'?'− ':'')+z(amt)}</td></tr>`;
 return `<section class="mysal"><div class="msh"><div><h3>My salary</h3><span>${fin?'Final for the month':'Up to today · '+fmt(TODAY)}</span></div>${nav}</div>
 <div class="mskp"><div><span>Monthly in-hand</span><b>${z(x.sal)}</b><small>${z(r.pd)} per day · 30-day month</small></div><div><span>Payable days</span><b>${r.payDays}<em>/30</em></b><small>${r.c.A?r.c.A+' absent':'no absents'}${r.lateHD?' · '+r.lateHD+' late half day'+(r.lateHD>1?'s':''):''}</small></div><div class="net"><span>Net pay</span><b>${z(r.net)}</b><small><i style="background:${pill[1]}"></i>${pill[0]}</small></div></div>
 <div class="msg2"><div class="msb"><div class="msbh">Attendance → days and amount</div><table><thead><tr><th>Particular</th><th class="n">Days</th><th class="n">Amount</th></tr></thead><tbody>
  ${dayRow('Present',r.c.P,r.c.P*r.pd,'+')}
  ${dayRow('Paid leave, week offs &amp; holidays',r.paidOff,r.paidOff*r.pd,'+','Approved leave '+r.c.L+' · week off '+r.c.WO+' · holiday '+r.c.H)}
  ${dayRow('Half days',r.ownHD,r.ownHD*r.pd/2,'+',r.ownHD?'Half pay · '+z(r.cutHalf)+' cut':'None')}
  ${dayRow('Late marks',r.L.length,r.lateHD*r.pd/2,'+',r.L.length?`Every 3 lates = 1 half day · ${r.lateHD} half day${r.lateHD===1?'':'s'}${r.lateHD?' · '+z(r.cutLate)+' cut':''} · late on ${r.L.map(d=>+d.slice(8)).join(', ')}`:'On time every day 👏')}
  ${dayRow('Absent',r.c.A,r.cutAbsent,'0','Unpaid days')}
  ${(()=>{const adj=r.earned-Math.round((r.c.P+r.paidOff)*r.pd+r.ownHD*r.pd/2+r.lateHD*r.pd/2);const dm=+monEnd(m).slice(8);return Math.abs(adj)>1?dayRow(dm+'-day month counted as 30',dm>30?'−'+(dm-30):'+'+(30-dm),Math.abs(adj),adj<0?'-':'+','Salary is always paid on 30 days'):''})()}
  <tr class="tot"><td>Payable days</td><td class="n">${r.payDays}</td><td class="n">${z(r.earned)}</td></tr></tbody></table></div>
 <div class="msb"><div class="msbh">Earnings and deductions</div><table><tbody>
  <tr><td>Salary earned<small>${z(r.pd)} × ${r.payDays} days</small></td><td class="n pos">${z(r.earned)}</td></tr>
  ${r.extras.map(a=>`<tr><td>${h(a[0])}${a[1]!=null&&a[2]!=null?`<small>${a[1]} × ${z(a[2])}</small>`:''}</td><td class="n pos">${z(a[3])}</td></tr>`).join('')}
  <tr class="sub"><td>Total earnings (A)</td><td class="n">${z(r.totA)}</td></tr>
  <tr><td>Advance / other deduction</td><td class="n neg">${r.totB?'− '+z(r.totB):'—'}</td></tr>
  ${r.k.forfeit?`<tr><td>Held — notice period not served</td><td class="n neg">− ${z(r.k.forfeit)}</td></tr>`:''}
  <tr class="tot"><td>Net pay (A − B)</td><td class="n">${z(r.net)}</td></tr></tbody></table>
  ${r.k.pend>0?`<div class="xs mut" style="margin-top:8px">Advance still to repay: <b>${z(r.k.pend)}</b></div>`:''}</div></div>
 <p class="xs mut" style="margin:10px 2px 0">Salary is worked out on a 30-day month. ${st==='Paid'?'This month is paid.':'Final amount is confirmed when HR closes the month.'} Any question? Ask Nameera.</p></section>`}
A.msM=e=>{S.msm=mAdd(S.msm||monStart(TODAY),+e.dataset.n);if(S.msm>monStart(TODAY))S.msm=monStart(TODAY);render()};
const _meMS=V.me;V.me=()=>{const o=_meMS(),s=mySalary();if(!s)return o;let i=o.search(/<div class="(grid|mecal|me2|mg)[ "]/);if(i<0)i=o.indexOf('<div class="card');return i>0?o.slice(0,i)+s+o.slice(i):o+s};
document.head.insertAdjacentHTML('beforeend',`<style>
.mysal{background:#fff;border:1px solid var(--line);border-radius:18px;padding:18px 20px;margin:0 0 16px;box-shadow:0 6px 20px -14px rgba(16,24,40,.25)}
.msh{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px}.msh h3{margin:0;font:800 19px Outfit,Inter,sans-serif;color:#0B1F3A}.msh span{font-size:12.5px;color:var(--mut)}.msh>div:first-child{flex:1}
.msnav{display:flex;align-items:center;gap:8px;background:#F4F6FA;border-radius:999px;padding:3px}.msnav b{min-width:130px;text-align:center;font-size:14px}.msnav .ib{width:32px;height:32px;border-radius:50%;background:#fff;border:1px solid var(--line);font-size:18px;cursor:pointer}.msnav .ib[disabled]{opacity:.35;cursor:default}
.mskp{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}@media(max-width:700px){.mskp{grid-template-columns:1fr}}
.mskp>div{border:1px solid var(--line);border-radius:14px;padding:12px 14px;background:#FBFCFE}.mskp span{display:block;font-size:12px;color:var(--mut);font-weight:600}.mskp b{display:block;font:800 24px Outfit,Inter,sans-serif;color:#0B1F3A;margin:2px 0}.mskp b em{font-style:normal;font-size:14px;color:var(--mut);font-weight:600}.mskp small{font-size:12px;color:var(--mut);display:flex;align-items:center;gap:6px}.mskp small i{width:8px;height:8px;border-radius:50%;display:inline-block}
.mskp .net{background:linear-gradient(135deg,#1D3378,#2F4FB8);border:0}.mskp .net span,.mskp .net small{color:#D6DEF7}.mskp .net b{color:#fff}
.msg2{display:grid;grid-template-columns:1.25fr 1fr;gap:12px}@media(max-width:900px){.msg2{grid-template-columns:1fr}}
.msb{border:1px solid var(--line);border-radius:14px;padding:12px 14px}.msbh{font:700 13px Inter,sans-serif;color:#24408E;text-transform:uppercase;letter-spacing:.04em;margin-bottom:8px}
.msb table{width:100%;border-collapse:collapse;font-size:13.5px}.msb th{font-size:11px;color:var(--mut);text-transform:uppercase;letter-spacing:.04em;text-align:left;padding:6px 4px;border-bottom:1px solid var(--line)}.msb th.n,.msb td.n{text-align:right;white-space:nowrap}
.msb td{padding:8px 4px;border-bottom:1px dashed #EEF0F4;vertical-align:top}.msb td small{display:block;font-size:11.5px;color:var(--mut);margin-top:2px;font-weight:400}
.msb td.mutd{color:#9AA1AE}.msb td.n small{display:block;font-size:10.5px;color:#9AA1AE}.msb td.pos{color:#1F7A45;font-weight:600}.msb td.neg{color:#C0392B;font-weight:600}.msb tr.sub td{font-weight:700;border-top:1px solid var(--line)}.msb tr.tot td{font-weight:800;font-size:14.5px;border-bottom:0;border-top:2px solid #0B1F3A;color:#0B1F3A}
</style>`);

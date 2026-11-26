/* ================= Company dashboards · JDAC Logistics =================
   Business view of the company: bookings, money, who booked how much, carriers, shipments after booking
   and what needs attention. Leads and follow-ups live in Communication, so they are not repeated here. */

/* test bookings for the last 30 days, so the dashboard has something to show */
if(!D.shipDemo2){D.shipDemo2=1;const CS=['neetu','balaji','imran'],CR=[['Delhivery',5],['DP World',2],['ShipMozo',2],['Routx',1]],CT=['Delhi','Bengaluru','Hyderabad','Chennai','Kolkata','Jaipur','Ahmedabad','Lucknow','Indore','Patna'],NM=['Patil Traders','Kulkarni Exports','Ravi Traders','Shree Textiles','Om Furniture','Ayur Naturals','Sai Electronics','Mehta Machines','Green Leaf D2C','Joshi Home Shifting','Pune Spares','Bliss Garments'];
 let n=55100,seed=7;const r=()=>(seed=(seed*9301+49297)%233280)/233280;const pick=a=>a[Math.floor(r()*a.length)];
 const car=()=>{const t=CR.reduce((a,x)=>a+x[1],0);let v=r()*t;for(const x of CR){if((v-=x[1])<0)return x[0]}return 'Delhivery'};
 for(let d=29;d>=0;d--){const k=1+Math.floor(r()*(d<7?5:4));for(let j=0;j<k;j++){const web=r()<.3,wt=Math.round(5+r()*180),amt=Math.round((wt*(18+r()*14)+150)/10)*10,age=d;
  const st=age<=1?(r()<.6?'Booked':'In transit'):age<=4?pick(['In transit','In transit','Payment pending','Booked','NDR']):pick(['Delivered','Delivered','Delivered','Delivered','In transit','RTO','NDR','Payment pending']);
  const pay=st==='Payment pending'?'Pending':st==='Booked'?(r()<.5?'Paid':'Pending'):r()<.85?'Paid':'Pending';
  D.ship.push({id:'JL-'+(++n),cse:web?null:pick(CS),src:web?'web':'cse',carrier:car(),awb:'',bk:dAgo(d),st,day:Math.min(3,age+1),pay,amt,wt,from:'Pune',to:pick(CT),cust:pick(NM),demo:1})}}
 D.ship.forEach(s=>{if(s.amt==null){s.amt=Math.round((1500+((s.id.charCodeAt(s.id.length-1)*97)%4000))/10)*10;s.src=s.src||(s.cse?'cse':'web')}});save()}

const LD_P=[['today','Today'],['yest','Yesterday'],['7d','7 days'],['month','This month'],['30d','30 days']];
const ldRange=p=>{const m=TODAY.slice(0,7);return p==='today'?s=>s.bk===TODAY:p==='yest'?s=>s.bk===addD(TODAY,-1):p==='7d'?s=>s.bk>=addD(TODAY,-6):p==='month'?s=>(s.bk||'').slice(0,7)===m:s=>s.bk>=addD(TODAY,-29)};
const ldSum=(L,f)=>L.reduce((a,s)=>a+(f?f(s):s.amt||0),0);
const LD_ST=[['Booked','Booked · pickup due','#2F6BE0'],['In transit','In transit','#0796A6'],['Payment pending','Payment pending','#E8772E'],['NDR','NDR · delivery failed','#B8860B'],['RTO','RTO · returning','#C0392B'],['Delivered','Delivered','#1F9D55']];

function ldOps(){const p=S.ldp||'7d',all=D.ship,L=all.filter(ldRange(p));
 const val=ldSum(L),paid=ldSum(L.filter(s=>s.pay==='Paid')),pend=val-paid,avg=L.length?Math.round(val/L.length):0,web=L.filter(s=>s.src==='web');
 const prev=(()=>{const n={today:1,yest:1,'7d':7,month:0,'30d':30}[p];if(!n)return null;const a=p==='yest'?-2:-n,b=p==='yest'?-2:-1;const from=addD(p==='yest'?TODAY:TODAY,p==='yest'?-2:-(2*n-1)),to=addD(TODAY,p==='yest'?-2:-n);return all.filter(s=>s.bk>=from&&s.bk<=to)})();
 const dlt=(a,b)=>b==null||!b?'':(()=>{const d=Math.round((a-b)/b*100);return `<em class="${d>=0?'up':'dn'}">${d>=0?'▲':'▼'} ${Math.abs(d)}%</em>`})();
 const kpi=(l,v,sub,c)=>`<div class="ldk" style="--k:${c}"><span>${l}</span><b>${v}</b><small>${sub||''}</small></div>`;
 /* 14-day trend */
 const days=[...Array(14)].map((_,i)=>addD(TODAY,i-13)),dv=days.map(d=>{const X=all.filter(s=>s.bk===d);return [d,X.length,ldSum(X)]}),mx=Math.max(1,...dv.map(x=>x[2]));
 /* by CSE / website */
 const wk=s=>s.src==='web'?'web':s.cse||'none';const who=[...new Set(L.map(wk))].map(k=>{const X=L.filter(s=>wk(s)===k);return [k,X.length,ldSum(X),ldSum(X.filter(s=>s.pay==='Paid'))]}).sort((a,b)=>b[2]-a[2]),wm=Math.max(1,...who.map(x=>x[2]));
 const car=[...new Set(L.map(s=>s.carrier))].map(c=>{const X=L.filter(s=>s.carrier===c);return [c,X.length,ldSum(X),X.filter(s=>s.st==='Delivered').length,X.filter(s=>['NDR','RTO'].includes(s.st)).length]}).sort((a,b)=>b[1]-a[1]);
 const open=all.filter(s=>s.st!=='Delivered');
 const late=all.filter(s=>s.st==='Booked'&&s.bk<=addD(TODAY,-2)),unpaid=all.filter(s=>s.pay!=='Paid'&&s.st!=='Booked'),ndr=all.filter(s=>s.st==='NDR'),rto=all.filter(s=>s.st==='RTO');
 const att=[[late.length,'Pickups pending 2+ days','#C0392B','pick'],[unpaid.length,`Unpaid · ${inr(ldSum(unpaid))}`,'#E8772E','money'],[ndr.length,'NDR · needs a call','#B8860B','ship'],[rto.length,'RTO · coming back','#7A2E8E','ship']];
 return `<div class="ldsec"><b>Bookings &amp; shipments</b><span class="sp"></span>${chips(LD_P,p,'ldP')}</div>
 <div class="ldkpis">${kpi('Bookings',L.length,dlt(L.length,prev&&prev.length)+` ${web.length} from website`,'#24408E')}${kpi('Booking value',inr(val),dlt(val,prev&&ldSum(prev))+` avg ${inr(avg)}`,'#0B6E8A')}${kpi('Collected',inr(paid),val?Math.round(paid/val*100)+'% of value':'','#1F9D55')}${kpi('To collect',inr(pend),L.filter(s=>s.pay!=='Paid').length+' bookings','#E8772E')}${kpi('Weight shipped',Math.round(ldSum(L,s=>s.wt||0)).toLocaleString('en-IN')+' kg','','#7A2E8E')}</div>
 <div class="ldg2">
  <div class="card ldc"><div class="ldh"><b>Bookings · last 14 days</b><span class="xs mut">bar = value · number = bookings</span></div><div class="ldtr">${dv.map(([d,n,v])=>`<div class="ldtb ${d===TODAY?'on':''}" title="${fmt(d)} · ${n} bookings · ${inr(v)}"><span>${n||''}</span><i style="height:${Math.max(3,v/mx*100)}%"></i><small>${d.slice(8)}</small></div>`).join('')}</div></div>
  <div class="card ldc"><div class="ldh"><b>Needs attention</b></div>${att.map(a=>`<button class="ldat" data-a="tab" data-t="${a[3]}" style="--a:${a[2]}"><b>${a[0]}</b><span>${a[1]}</span><i>›</i></button>`).join('')}</div></div>
 <div class="card ldc"><div class="ldh"><b>After booking · where every open shipment is</b><span class="xs mut">${open.length} open · all dates</span></div>
  <div class="ldpipe">${LD_ST.map(([k,l,c])=>{const X=all.filter(s=>s.st===k&&(k!=='Delivered'||ldRange(p)(s)));return `<button class="ldps" data-a="tab" data-t="ship" style="--c:${c}"><b>${X.length}</b><span>${l}${k==='Delivered'?' <em>(period)</em>':''}</span><small>${inr(ldSum(X))}</small></button>`}).join('<i class="ldar">›</i>')}</div></div>
 <div class="ldg2">
  <div class="card ldc"><div class="ldh"><b>Who booked</b><span class="xs mut">${LD_P.find(x=>x[0]===p)[1]}</span></div>${who.map(([k,n,v,pd])=>`<div class="ldw">${k==='web'?'<span class="ldwi">🌐</span>':k==='none'?'<span class="ldwi">?</span>':av(nm(k),'s')}<div class="ldwb"><div class="row nw"><b>${k==='web'?'Website (self-booked)':k==='none'?'Not assigned':h(nmF(k))}</b><span class="sp"></span><b>${inr(v)}</b></div><div class="ldbarx"><i style="width:${v/wm*100}%"></i></div><div class="xs mut">${n} bookings · collected ${inr(pd)} · pending ${inr(v-pd)}</div></div></div>`).join('')||'<div class="xs mut">No bookings in this period</div>'}</div>
  <div class="card ldc"><div class="ldh"><b>Carriers</b></div><div class="xsheet" style="box-shadow:none;border:0"><table><thead><tr><th>Carrier</th><th class="n">Bookings</th><th class="n">Value</th><th class="n">Delivered</th><th class="n">NDR / RTO</th></tr></thead><tbody>${car.map(c=>`<tr><td><b>${h(c[0])}</b></td><td class="n">${c[1]}</td><td class="n">${inr(c[2])}</td><td class="n">${c[3]}</td><td class="n" style="color:${c[4]?'#C0392B':'inherit'}">${c[4]}</td></tr>`).join('')||'<tr><td colspan="5" class="mut">—</td></tr>'}</tbody></table></div></div></div>
 <div class="card ldc"><div class="ldh"><b>Latest bookings</b><button class="lnk" data-a="tab" data-t="ship">All shipments ›</button></div><div class="xsheet" style="box-shadow:none;border:0"><table><thead><tr><th>Booking</th><th>Date</th><th>Customer</th><th>Route</th><th>Booked by</th><th>Carrier</th><th class="n">Weight</th><th class="n">Amount</th><th>Status</th><th>Payment</th></tr></thead><tbody>
  ${L.slice().sort((a,b)=>(b.bk||'').localeCompare(a.bk||'')).slice(0,10).map(s=>{const st=LD_ST.find(x=>x[0]===s.st)||['', s.st,'#667'];return `<tr><td><b>${h(s.id)}</b></td><td>${fmt(s.bk)}</td><td>${h(s.cust||'—')}</td><td>${h((s.from||'Pune')+' → '+(s.to||'—'))}</td><td>${s.src==='web'?'🌐 Website':s.cse?h(nmF(s.cse)):'<span class="mut">Not assigned</span>'}</td><td>${h(s.carrier)}</td><td class="n">${s.wt?s.wt+' kg':'—'}</td><td class="n">${inr(s.amt||0)}</td><td><span class="stgp" style="--c:${st[2]}">${h(s.st)}</span></td><td><span class="stgp" style="--c:${s.pay==='Paid'?'#1F9D55':'#E8772E'}">${h(s.pay==='Paid'?'Paid':'Pending')}</span></td></tr>`}).join('')||'<tr><td colspan="10" class="mut" style="text-align:center;padding:16px">No bookings in this period</td></tr>'}</tbody></table></div></div>`}
A.ldP=e=>{S.ldp=e.dataset.t;render()};

document.head.insertAdjacentHTML('beforeend',`<style>
.ldbar{display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap}
.ldkpis{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:14px}@media(max-width:1100px){.ldkpis{grid-template-columns:repeat(2,1fr)}}
.ldk{background:#fff;border:1px solid var(--line);border-radius:16px;padding:14px 16px;border-top:4px solid var(--k)}.ldk span{font-size:12.5px;color:var(--mut);font-weight:600}.ldk b{display:block;font:800 26px Outfit,sans-serif;margin:4px 0 2px;letter-spacing:-.3px}.ldk small{font-size:12px;color:var(--mut)}
.ldk em{font-style:normal;font-weight:700;margin-right:4px}.ldk em.up{color:#1F9D55}.ldk em.dn{color:#C0392B}
.ldg2{display:grid;grid-template-columns:1.5fr 1fr;gap:14px}@media(max-width:1000px){.ldg2{grid-template-columns:1fr}}
.ldc{margin:0 0 14px;padding:16px 18px}.ldh{display:flex;align-items:center;gap:10px;margin-bottom:12px}.ldh b{font-size:15px}.ldh>:last-child:not(b){margin-left:auto}
.ldtr{display:flex;align-items:flex-end;gap:6px;height:180px}.ldtb{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;gap:4px}.ldtb i{width:100%;max-width:34px;background:#B9C7E8;border-radius:6px 6px 2px 2px}.ldtb.on i{background:#24408E}.ldtb span{font-size:11.5px;font-weight:700;color:#3B4252}.ldtb small{font-size:11px;color:var(--mut)}
.ldat{display:flex;align-items:center;gap:12px;width:100%;border:1px solid var(--line);background:#fff;border-left:4px solid var(--a);border-radius:12px;padding:12px 14px;margin-bottom:8px;cursor:pointer;text-align:left;font:inherit}.ldat:hover{background:#F6F8FB}.ldat b{font:800 22px Outfit,sans-serif;color:var(--a);min-width:34px}.ldat span{flex:1;font-weight:600}.ldat i{font-style:normal;color:var(--mut);font-size:20px}
.ldpipe{display:flex;align-items:stretch;gap:6px;overflow-x:auto;scrollbar-width:none}.ldpipe::-webkit-scrollbar{display:none}.ldps{flex:1;min-width:130px;border:1px solid var(--line);border-top:4px solid var(--c);background:#fff;border-radius:12px;padding:12px;text-align:left;cursor:pointer;font:inherit}.ldps:hover{background:#F6F8FB}
.ldps b{display:block;font:800 26px Outfit,sans-serif;color:var(--c)}.ldps span{display:block;font-weight:600;font-size:13px}.ldps em{font-style:normal;color:var(--mut);font-weight:500}.ldps small{color:var(--mut);font-size:12px}.ldar{align-self:center;color:#B6BDCB;font-style:normal;font-size:20px}
.ldw{display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid #F0F2F5}.ldw:last-child{border-bottom:0}.ldwi{width:32px;height:32px;display:grid;place-items:center;border-radius:50%;background:#EEF2FB}.ldwb{flex:1;min-width:0}.ldbarx{height:7px;background:#EEF1F6;border-radius:6px;margin:5px 0 3px;overflow:hidden}.ldbarx i{display:block;height:100%;background:#24408E;border-radius:6px}
</style>`);

/* ===================== WALLET (own menu item) + HR invoices: status Paid / Pending / Void, generate, download PDF =====================
   One wallet per customer across all companies (today: HR Consultancy clients). Recharge with 100% cashback (HR offer, up to ₹10,000),
   hiring fees deducted, adjustments, statement download. Invoices open in a side panel with a proper tax-invoice preview. */
I.wallet=I.wallet||'<path d="M3 7a2 2 0 0 1 2-2h12v4"/><path d="M3 7v10a2 2 0 0 0 2 2h14V9H5a2 2 0 0 1-2-2z"/><circle cx="16" cy="14" r="1.3"/>';
const WCO=[['hr','HR Consultancy','#7A2E8E'],['log','Logistics','#02496A'],['gb','GovaaBazaar','#7a4a26'],['jup','Jupiter','#139B5F'],['studios','Studios','#0796A6']];
const canWallet=()=>isAdm()||K()==='acc';
const _tabsW=tabsFor;tabsFor=function(who){const T=_tabsW(who),k=(P[who||S.me]||{}).kind;if((k==='boss'||k==='hr'||k==='acc')&&!T.some(x=>x[0]==='wallet')){const i=T.findIndex(x=>x[0]==='money');T.splice(i>=0?i+1:T.length,0,['wallet','Wallet','wallet'])}return T};
const _allowedW=allowed;allowed=function(v){if(v==='wallet')return canWallet();return _allowedW(v)};
if(!D.invCfg)D.invCfg={gstin:'',pan:'',bank:'',acc:'',ifsc:'',upi:'',addr:'KPCT Mall, A Wing, 3rd Floor, Office 321–322, Vitthal Rao Shivarkar Road, Fatima Nagar, Wanowrie, Pune 411013',email:'hr@jdac.in',phone:''};
HR.void=HR.void||{};HR.minv=HR.minv||[];

/* ---------- wallet maths ---------- */
const wKind=w=>w.kind||(w.amt<0?'fee':/cashback/i.test(w.t||'')?'rc+cb':'recharge');
function wStats(cid){const L=(HR.walletLog||[]).filter(w=>w.co===cid);let rc=0,cb=0,used=0,adj=0;L.forEach(w=>{const k=wKind(w);if(k==='rc+cb'){rc+=w.amt/2;cb+=w.amt/2}else if(k==='recharge')rc+=w.amt;else if(k==='cashback')cb+=w.amt;else if(k==='adjust')adj+=w.amt;else used+=-w.amt});
 const last=L.slice().sort((a,b)=>(b.d||'').localeCompare(a.d||''))[0];return {L,rc,cb,used,adj,last}}
const wClients=()=>HR.C.filter(c=>(!c.internal&&!c.group)||(c.wallet||0)!==0||(HR.walletLog||[]).some(w=>w.co===c.id));
V.wallet=()=>{if(!canWallet())return page('Wallet')+empty('Not for your login');
 const co=S.wco||'all',q=(S.wq||'').toLowerCase(),C=wClients().map(c=>({c,co:'hr',s:wStats(c.id)}));const L=C.filter(x=>(co==='all'||x.co===co)&&(!q||x.c.n.toLowerCase().includes(q)));
 const m=TODAY.slice(0,7),all=(HR.walletLog||[]),mon=all.filter(w=>(w.d||'').slice(0,7)===m);
 const sum=f=>C.reduce((a,x)=>a+f(x),0),bal=sum(x=>x.c.wallet||0);
 const k=(v,l,c)=>`<div class="ck ${c}" style="cursor:default"><b>${v}</b><span>${l}</span></div>`;
 return page('Wallet','One wallet per customer, across all companies · recharges, cashback, hiring fees and refunds',`<div class="row hide-m"><button class="btn sec" data-a="wDl">${ic('dl')}Download all statements</button><button class="btn" data-a="wRc">${ic('plus')}Add recharge</button></div>`)+
 `<div class="ckpi">${k(inr(bal),'Total balance with customers','b')}${k(inr(sum(x=>x.s.rc)),'Recharged (all time)','g')}${k(inr(sum(x=>x.s.cb)),'Cashback given','p')}${k(inr(sum(x=>x.s.used)),'Used for fees','o')}${k(inr(mon.filter(w=>w.amt>0).reduce((a,w)=>a+w.amt,0)),'Added this month','b')}</div>
 <div class="cmbar">${chips([['all','All companies',C.length],...WCO.map(x=>[x[0],x[1],C.filter(y=>y.co===x[0]).length])],co,'wCo')}<span class="sp"></span><div class="sfq" style="background:#fff;border:1px solid var(--line);min-width:240px">${sfi('search',16)}<label class="sr" for="wq">Search</label><input id="wq" value="${h(S.wq||'')}" placeholder="Search customer"></div></div>
 <div class="xsheet"><table><thead><tr><th class="stk">Customer</th><th>Company</th><th class="n">Balance</th><th class="n">Recharged</th><th class="n">Cashback</th><th class="n">Used for fees</th><th class="n">Adjustments</th><th>Last activity</th><th></th></tr></thead><tbody>
 ${L.map(x=>`<tr><td class="stk"><button class="lnk" data-a="wOpen" data-id="${x.c.id}"><b>${h(x.c.n)}</b></button><span>${h(x.c.city||'')}</span></td><td><span class="cmco" style="--cc:#7A2E8E;margin:0">HR Consultancy</span></td><td class="n"><b style="color:${(x.c.wallet||0)<0?'var(--r)':'inherit'}">${inr(x.c.wallet||0)}</b></td><td class="n">${inr(x.s.rc)}</td><td class="n">${inr(x.s.cb)}</td><td class="n">${inr(x.s.used)}</td><td class="n">${x.s.adj?inr(x.s.adj):'—'}</td><td>${x.s.last?fmt(x.s.last.d)+' · '+h((x.s.last.t||'').slice(0,34)):'—'}</td><td><button class="btn sm sec" data-a="wOpen" data-id="${x.c.id}">Statement</button></td></tr>`).join('')||`<tr><td colspan="9" class="mut" style="text-align:center;padding:24px">${co==='all'?'No wallets yet':'No wallets in this company yet · wallets appear here as soon as a customer recharges'}</td></tr>`}
 </tbody></table></div>
 <p class="xs mut" style="margin-top:8px">HR Consultancy offer: 100% cashback on recharge, up to ₹10,000 in total per client. Wallet money can be used only for hiring fees and is not refundable in cash.</p>`};
A.wCo=e=>{S.wco=e.dataset.t;render()};
document.addEventListener('input',e=>{if(e.target.id==='wq'){S.wq=e.target.value;const p=e.target.selectionStart;render();const i=document.getElementById('wq');if(i){i.focus();i.setSelectionRange(p,p)}}});
A.wOpen=e=>{const c=hC(e.dataset.id),s=wStats(c.id);let run=0;const L=s.L.slice().sort((a,b)=>(a.d||'').localeCompare(b.d||'')).map(w=>({...w,bal:(run+=w.amt)})).reverse();
 sheet(`<div class="row nw">${av(c.n)}<div style="flex:1"><h2>${h(c.n)}</h2><div class="xs mut">Wallet · HR Consultancy · ${h(c.city||'')}</div></div><b style="font-size:24px;color:${(c.wallet||0)<0?'var(--r)':'#1F9D55'}">${inr(c.wallet||0)}</b></div>
 <div class="row" style="gap:8px;margin:12px 0"><button class="btn sm" data-a="wRc" data-id="${c.id}">${ic('plus')}Add recharge</button><button class="btn sm sec" data-a="wAdj" data-id="${c.id}">Adjust / refund</button><button class="btn sm sec" data-a="wDl" data-id="${c.id}">${ic('dl')}Statement</button><button class="btn sm sec" data-a="hrBill" data-id="${c.id}">Billing & MIS</button></div>
 <div class="grid g2" style="gap:8px;margin-bottom:10px">${[['Recharged',s.rc],['Cashback',s.cb],['Used for fees',s.used],['Adjustments',s.adj]].map(x=>`<div class="card" style="margin:0;padding:10px 12px"><div class="xs mut">${x[0]}</div><b>${inr(x[1])}</b></div>`).join('')}</div>
 <div class="xsheet"><table><thead><tr><th>Date</th><th>Particulars</th><th class="n">Credit</th><th class="n">Debit</th><th class="n">Balance</th></tr></thead><tbody>${L.map(w=>`<tr><td>${fmt(w.d)}</td><td>${h(w.t)}${w.mode?` <span class="xs mut">· ${h(w.mode)}${w.ref?' '+h(w.ref):''}</span>`:''}</td><td class="n" style="color:#1F9D55">${w.amt>0?inr(w.amt):''}</td><td class="n" style="color:var(--r)">${w.amt<0?inr(-w.amt):''}</td><td class="n">${inr(w.bal)}</td></tr>`).join('')||'<tr><td colspan="5" class="mut" style="text-align:center;padding:16px">No activity yet</td></tr>'}</tbody></table></div>`);const sh=document.querySelector('.sheet');if(sh&&sh.style)sh.style.maxWidth='860px'};
A.wRc=e=>{const id=e&&e.dataset&&e.dataset.id,C=wClients();sheet(`<h2>Add recharge</h2><label for="wrc">Customer</label><select id="wrc">${C.map(c=>`<option value="${c.id}" ${id===c.id?'selected':''}>${h(c.n)} · balance ${inr(c.wallet||0)}</option>`).join('')}</select>
 <label for="wra">Amount received (₹)</label><input id="wra" type="number" inputmode="numeric" placeholder="e.g. 5000"><label>Paid by</label>${opts('wrm',[['UPI','UPI'],['Bank transfer','Bank transfer'],['Cheque','Cheque'],['Cash','Cash'],['Razorpay','Razorpay']],'UPI')}
 <label for="wrr">Reference / UTR (optional)</label><input id="wrr" placeholder="UTR, cheque no. …">
 <label class="row nw" style="color:var(--ink);font-weight:600;margin-top:10px"><input type="checkbox" id="wcb" checked style="width:20px;min-height:20px"> Add 100% cashback (HR offer, up to ₹10,000 per client)</label>
 <button class="btn w" style="margin-top:14px" data-a="wRcGo">Add to wallet</button>`)};
A.wRcGo=()=>{const c=hC(val('wrc')),a=Math.round(+val('wra')||0);if(!c||a<=0)return toast('Enter the amount');const s=wStats(c.id),cb=document.getElementById('wcb').checked?Math.max(0,Math.min(a,10000-s.cb)):0,mode=pick1('wrm')||'UPI',ref=val('wrr');
 HR.walletLog=HR.walletLog||[];HR.walletLog.push({co:c.id,d:TODAY,t:'Recharge '+inr(a),amt:a,kind:'recharge',mode,ref,by:S.me});if(cb)HR.walletLog.push({co:c.id,d:TODAY,t:'100% cashback on recharge',amt:cb,kind:'cashback',by:S.me});
 c.wallet=(c.wallet||0)+a+cb;save();closeM();render();toast(`${inr(a)} added${cb?' + '+inr(cb)+' cashback':''} · new balance ${inr(c.wallet)}`)};
A.wAdj=e=>{const c=hC(e.dataset.id);sheet(`<h2>Adjust · ${h(c.n)}</h2><p class="xs mut">Use for refunds, corrections or a fee paid from the wallet. Balance now ${inr(c.wallet||0)}.</p>${opts('wjt',[['debit','Take out (debit)'],['credit','Add (credit)']],'debit')}<label for="wja">Amount (₹)</label><input id="wja" type="number" inputmode="numeric"><label for="wjr">Reason</label><input id="wjr" placeholder="e.g. Hiring fee · 2nd half · Rahul Patil"><button class="btn w" style="margin-top:14px" data-a="wAdjGo" data-id="${c.id}">Save</button>`)};
A.wAdjGo=e=>{const c=hC(e.dataset.id),a=Math.round(+val('wja')||0),r=val('wjr');if(a<=0||!r)return toast('Amount and reason please');const amt=pick1('wjt')==='credit'?a:-a;
 HR.walletLog.push({co:c.id,d:TODAY,t:r,amt,kind:/fee/i.test(r)&&amt<0?'fee':'adjust',by:S.me});c.wallet=(c.wallet||0)+amt;save();closeM();render();toast('Saved · balance '+inr(c.wallet))};
A.wDl=async e=>{const id=e&&e.dataset&&e.dataset.id,W=(HR.walletLog||[]).filter(w=>!id||w.co===id).slice().sort((a,b)=>(a.d||'').localeCompare(b.d||''));
 await saveFile('Wallet_'+(id?hC(id).n.replace(/\W+/g,'_'):'all')+'_'+TODAY+'.csv',csv([['Date','Customer','Company','Particulars','Mode','Reference','Credit','Debit'],...W.map(w=>[w.d,(hC(w.co)||{}).n,'HR Consultancy',w.t,w.mode||'',w.ref||'',w.amt>0?w.amt:'',w.amt<0?-w.amt:''])]))};

/* ---------- invoices: status, preview, PDF ---------- */
const _hrBillW=hrBill;hrBill=function(cid){return _hrBillW(cid).map(r=>HR.void[r.k]?{...r,paid:null,st:'Void',void:1}:r)};
const _misRowsW=misRows;misRows=function(){return _misRowsW().filter(r=>!r.void)};
const words=n=>{n=Math.round(n);const a=['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'],b=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
 const two=x=>x<20?a[x]:b[Math.floor(x/10)]+(x%10?' '+a[x%10]:''),three=x=>(x>=100?a[Math.floor(x/100)]+' Hundred'+(x%100?' ':''):'')+(x%100?two(x%100):'');
 if(!n)return 'Zero';let s='';const cr=Math.floor(n/1e7),l=Math.floor(n/1e5)%100,t=Math.floor(n/1e3)%100,r=n%1000;if(cr)s+=two(cr)+' Crore ';if(l)s+=two(l)+' Lakh ';if(t)s+=two(t)+' Thousand ';if(r)s+=three(r);return s.trim()};
function invData(k,cid){const m=HR.minv.find(x=>x.k===k);if(m){const c=hC(m.c);return {k,c,inv:m.inv,date:m.date,due:addD(m.date,7),lines:[{d:m.desc,sac:'998512',amt:m.base}],base:m.base,gst:m.gst,tot:m.tot,paid:HR.paid[k],void:HR.void[k],manual:1}}
 const r=hrBill(cid).find(x=>x.k===k);if(!r)return null;const c=hC(cid);
 return {k,c,r,inv:r.inv,date:r.due,due:addD(r.due,7),lines:[{d:`Recruitment / hiring fee — ${r.n===1?'1st':'2nd'} instalment (50%) of ${c.plan.fee}% of one month's salary<br><small>Candidate: <b>${h(r.p.n||'')}</b> · Role: ${h(r.j.role||'—')} · Joined: ${fmtY(r.l.join)} · Monthly salary: ${inr(r.l.sal)} · Instalment due on Day ${r.n===1?c.plan.a:c.plan.b} of joining</small>`,sac:'998512',amt:r.base}],base:r.base,gst:r.gst,tot:r.tot,paid:r.paid,void:r.void}}
const invSt=d=>d.void?'Void':d.paid?'Paid':'Pending';
function invHTML(d,forPrint){const c=d.c,cf=D.invCfg,inter=c.state&&!/maharashtra/i.test(c.state),half=Math.round(d.gst/2);
 const css=`.iv{font-family:Inter,Arial,sans-serif;color:#1b1e24;font-size:12.5px;line-height:1.45;background:#fff;${forPrint?'max-width:780px;margin:24px auto;':''}padding:22px;border:1px solid #E3E7EF;border-radius:${forPrint?0:12}px}
 .iv h1{font-size:20px;color:#24408E;margin:0}.iv .top{display:flex;justify-content:space-between;gap:16px;border-bottom:3px solid #F28C28;padding-bottom:12px}
 .iv .tt{text-align:right}.iv .tt b{font-size:18px;letter-spacing:.08em}.iv .two{display:flex;gap:16px;margin:14px 0}.iv .two>div{flex:1;background:#F7F8FB;border-radius:8px;padding:10px 12px}
 .iv small{color:#5b6475}.iv table{width:100%;border-collapse:collapse;margin-top:6px}.iv th{background:#24408E;color:#fff;text-align:left;padding:7px 8px;font-size:11.5px}.iv td{border-bottom:1px solid #E6E9EF;padding:8px;vertical-align:top}
 .iv .r{text-align:right}.iv .tot td{font-weight:700}.iv .grand td{background:#FFF4E8;font-size:14px;font-weight:800}.iv .st{display:inline-block;border-radius:6px;padding:2px 10px;font-weight:800;font-size:11px;color:#fff;background:${d.void?'#8A93A3':d.paid?'#1F9D55':'#E8772E'}}
 .iv ol{margin:4px 0 0 16px;padding:0}.iv li{margin:2px 0}.iv .ft{display:flex;justify-content:space-between;gap:16px;margin-top:16px}.iv .void{color:#C0392B;font-weight:800;font-size:13px}`;
 return `<style>${css}</style><div class="iv">${d.void?'<div class="void">VOID — this invoice is cancelled and not payable</div>':''}
 <div class="top"><div>${cf.logo?`<img src="${cf.logo}" alt="JDAC HR Consultancy" style="max-height:62px;max-width:220px;display:block;margin-bottom:6px">`:''}<h1>JDAC HR Consultancy</h1><div>A unit of JDAC Sales Pvt Ltd</div><small>${h(cf.addr)}<br>${cf.gstin?'GSTIN: '+h(cf.gstin):'GSTIN: (add in Wallet → Invoice settings)'}${cf.pan?' · PAN: '+h(cf.pan):''}<br>${h(cf.email)}${cf.phone?' · '+h(cf.phone):''}</small></div>
 <div class="tt"><b>TAX INVOICE</b><div>Invoice no. <b>${h(d.inv)}</b></div><div>Invoice date: ${fmtY(d.date)}</div><div>Payment due: ${fmtY(d.due)}</div><div style="margin-top:4px"><span class="st">${invSt(d).toUpperCase()}${d.paid&&!d.void?' · '+fmtY(d.paid):''}</span></div></div></div>
 <div class="two"><div><small>BILL TO</small><div><b>${h(c.n)}</b></div><div>${h(c.addr||c.city||'')}</div>${c.gstno?`<div>GSTIN: ${h(c.gstno)}</div>`:''}${c.email?`<div>${h(c.email)}</div>`:''}</div><div><small>PLACE OF SUPPLY</small><div>${h(c.state||'Maharashtra')}</div><small style="display:block;margin-top:6px">SERVICE</small><div>Recruitment & placement services</div></div></div>
 <table><thead><tr><th style="width:28px">#</th><th>Description</th><th>SAC</th><th class="r">Amount</th></tr></thead><tbody>${d.lines.map((l,i)=>`<tr><td>${i+1}</td><td>${l.d}</td><td>${l.sac}</td><td class="r">${inr(l.amt)}</td></tr>`).join('')}
 <tr class="tot"><td></td><td class="r" colspan="2">Taxable value</td><td class="r">${inr(d.base)}</td></tr>
 ${d.gst?(inter?`<tr><td></td><td class="r" colspan="2">IGST 18%</td><td class="r">${inr(d.gst)}</td></tr>`:`<tr><td></td><td class="r" colspan="2">CGST 9%</td><td class="r">${inr(half)}</td></tr><tr><td></td><td class="r" colspan="2">SGST 9%</td><td class="r">${inr(d.gst-half)}</td></tr>`):''}
 <tr class="grand"><td></td><td class="r" colspan="2">Total payable</td><td class="r">${inr(d.tot)}</td></tr></tbody></table>
 <div style="margin-top:6px"><small>Amount in words:</small> <b>Rupees ${words(d.tot)} only</b></div>
 <div class="ft"><div style="flex:1"><small>PAYMENT DETAILS</small><div>${cf.bank?`Bank: ${h(cf.bank)}<br>A/c no.: ${h(cf.acc)}<br>IFSC: ${h(cf.ifsc)}`:'Bank details: (add in Wallet → Invoice settings)'}${cf.upi?`<br>UPI: ${h(cf.upi)}`:''}</div><div style="margin-top:4px">Please mention the invoice number with your payment. Wallet balance can be used against this invoice.</div></div>
 <div style="flex:1.4"><small>TERMS & CONDITIONS</small><ol>
  <li>Fee: ${d.manual?'as agreed with the client':`${c.plan.fee}% of the candidate's first month salary, billed in two equal instalments — on Day ${c.plan.a} and Day ${c.plan.b} from joining`}.</li>
  <li>Payment is due within 7 days of the invoice date.</li>
  ${d.manual?'':`<li>The 2nd instalment is payable only if the candidate is still working on Day ${c.plan.b}; if the candidate leaves earlier, no further amount is billed.</li><li>No replacement guarantee is included in this fee.</li>`}
  <li>Wallet money (recharge and cashback) can be used only against hiring fees and is not refundable in cash.</li>
  <li>GST at 18% is charged as applicable. Payments delayed beyond 30 days may put new hiring work on hold.</li>
  <li>Subject to Pune jurisdiction. This is a computer-generated invoice and needs no signature.</li></ol></div></div></div>`}
A.hrInv=e=>{const d=invData(e.dataset.k,e.dataset.c);if(!d)return;S.invK=d.k;S.invC=e.dataset.c;
 sheet(`<div class="row nw"><div style="flex:1"><h2>${h(d.inv)}</h2><div class="xs mut">${h(d.c.n)} · ${inr(d.tot)} incl. GST · due ${fmtY(d.due)}</div></div></div>
 <div class="ivsw" role="radiogroup" aria-label="Invoice status">${['Pending','Paid','Void'].map(s=>`<button role="radio" aria-checked="${invSt(d)===s}" class="${invSt(d)===s?'on':''} ${s.toLowerCase()}" data-a="invSt" data-s="${s}" ${isAdm()||K()==='acc'?'':'disabled'}>${s}</button>`).join('')}</div>
 <div class="row" style="gap:8px;margin:12px 0"><button class="btn" data-a="invPdf">${ic('dl')}Download PDF</button><button class="btn sec" data-a="invPrint">Print</button></div>
 <div class="ivwrap">${invHTML(d,false)}</div>`);const sh=document.querySelector('.sheet');if(sh&&sh.style)sh.style.maxWidth='900px'};
A.invSt=e=>{const s=e.dataset.s,k=S.invK;if(s==='Paid'){HR.paid[k]=HR.paid[k]||TODAY;delete HR.void[k]}else if(s==='Void'){HR.void[k]=TODAY;delete HR.paid[k]}else{delete HR.paid[k];delete HR.void[k]}save();render();A.hrInv({dataset:{k,c:S.invC}});toast('Invoice marked '+s)};
const invDoc=d=>`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${h(d.inv)} · ${h(d.c.n)}</title><style>@page{size:A4;margin:12mm}body{margin:0;background:#fff}@media print{.iv{border:0!important;margin:0!important}}</style></head><body>${invHTML(d,true)}</body></html>`;
A.invPdf=async()=>{const d=invData(S.invK,S.invC);if(!d)return;const html=invDoc(d);
 if(DLNS){ALLOWDL=true;try{await DLNS.save({filename:d.inv+'.html',data:new Blob([html],{type:'text/html'})});toast('Saved '+d.inv)}finally{ALLOWDL=false}return}
 const w=window.open('','_blank');if(!w){toast('Allow pop-ups for this site to download the invoice');return}w.document.write(html+'<script>setTimeout(function(){print()},350)<\/script>');w.document.close();toast('Choose “Save as PDF” in the print window')};
A.invPrint=A.invPdf;
/* generate a new invoice (anything not auto-billed from a placement) */
A.invNew=()=>sheet(`<h2>Generate invoice</h2><label for="inc">Client</label><select id="inc">${HR.C.map(c=>`<option value="${c.id}">${h(c.n)}</option>`).join('')}</select>
 <label for="ind">Description</label><input id="ind" placeholder="e.g. Recruitment fee · 3 delivery executives"><label for="ina">Amount before GST (₹)</label><input id="ina" type="number" inputmode="numeric">
 <label class="row nw" style="color:var(--ink);font-weight:600;margin-top:10px"><input type="checkbox" id="ing" checked style="width:20px;min-height:20px"> Add GST 18%</label>
 <label for="int">Invoice date</label><input id="int" type="date" value="${TODAY}"><button class="btn w" style="margin-top:14px" data-a="invNewGo">Generate</button>`);
A.invNewGo=()=>{const c=val('inc'),d=val('ind'),a=Math.round(+val('ina')||0),dt=val('int')||TODAY;if(!d||a<=0)return toast('Description and amount please');const g=document.getElementById('ing').checked?Math.round(a*.18):0;
 const n=HR.minv.length+1,k='m'+Date.now().toString(36),inv='INV-HR-'+dt.slice(2,4)+dt.slice(5,7)+'-M'+String(n).padStart(2,'0');HR.minv.push({k,c,desc:h(d),base:a,gst:g,tot:a+g,date:dt,inv,by:S.me});save();closeM();render();A.hrInv({dataset:{k,c}});toast('Invoice '+inv+' generated')};
/* MIS page: Generate invoice button, other invoices + void invoices listed under the detail */
const _cpMisW=CP['hr:mis'];CP['hr:mis']=()=>{let o=_cpMisW();
 if(isAdm()||K()==='acc')o=o.replace('<span style="flex:1"></span>','<span style="flex:1"></span><button class="btn sec" data-a="invNew">'+ic('plus')+'Generate invoice</button>');
 const M=HR.minv.filter(m=>!S.misC||m.c===S.misC),Vd=HR.C.flatMap(c=>hrBill(c.id).filter(r=>r.void).map(r=>({...r,c})));
 const row=(k,c,inv,d,desc,tot,st)=>`<tr><td class="stk"><button class="lnk" data-a="hrInv" data-k="${k}" data-c="${c.id}">${h(inv)}</button></td><td>${h(c.n)}</td><td>${desc}</td><td>${fmt(d)}</td><td class="n"><b>${inr(tot)}</b></td><td>${pill(st,st==='Paid'?'g':st==='Void'?'':'a')}</td></tr>`;
 const extra=(M.length?`<div class="mish">Other invoices (generated)</div><div class="xsheet"><table><thead><tr><th class="stk">Invoice</th><th>Client</th><th>Description</th><th>Date</th><th class="n">Total</th><th>Status</th></tr></thead><tbody>${M.map(m=>row(m.k,hC(m.c),m.inv,m.date,m.desc,m.tot,HR.void[m.k]?'Void':HR.paid[m.k]?'Paid':'Pending')).join('')}</tbody></table></div>`:'')
  +(Vd.length?`<div class="mish">Void invoices (not counted in totals)</div><div class="xsheet"><table><thead><tr><th class="stk">Invoice</th><th>Client</th><th>Employee</th><th>Due</th><th class="n">Total</th><th>Status</th></tr></thead><tbody>${Vd.map(r=>row(r.k,r.c,r.inv,r.due,h(r.p.n||''),r.tot,'Void')).join('')}</tbody></table></div>`:'');
 const i=o.lastIndexOf('<p class="xs mut" style="margin-top:10px">');return i>0?o.slice(0,i)+extra+o.slice(i):o+extra};
/* invoice settings (GSTIN, bank) — on the Wallet page for admins */
A.invCfg=()=>{const f=D.invCfg;sheet(`<h2>Invoice settings</h2><p class="xs mut">Printed on every HR Consultancy invoice.</p><label>Logo (JDAC HR Consultancy)</label><div class="row nw" style="gap:10px">${f.logo?`<img src="${f.logo}" alt="Logo" style="max-height:48px;max-width:160px;border:1px solid var(--line);border-radius:8px;padding:4px;background:#fff">`:'<span class="xs mut">No logo yet</span>'}<label class="btn sm sec" style="margin:0;cursor:pointer">Upload logo<input type="file" accept="image/*" data-ch="invLogo" hidden></label>${f.logo?'<button class="btn sm sec" data-a="invLogoX">Remove</button>':''}</div>${[['gstin','GSTIN'],['pan','PAN'],['addr','Address'],['email','Email'],['phone','Phone'],['bank','Bank name'],['acc','Account number'],['ifsc','IFSC'],['upi','UPI ID']].map(([k,l])=>`<label for="ic-${k}">${l}</label><input id="ic-${k}" value="${h(f[k]||'')}">`).join('')}<button class="btn w" style="margin-top:14px" data-a="invCfgGo">Save</button>`)};
A.invCfgGo=()=>{['gstin','pan','addr','email','phone','bank','acc','ifsc','upi'].forEach(k=>{D.invCfg[k]=val('ic-'+k)});save();closeM();toast('Invoice settings saved')};
document.addEventListener('change',e=>{const t=e.target;if(!t||!t.dataset||t.dataset.ch!=='invLogo'||!t.files||!t.files[0])return;const f=t.files[0];if(f.size>600000)return toast('Logo too large — please use an image under 600 KB');const r=new FileReader();r.onload=()=>{D.invCfg.logo=r.result;save();toast('Logo saved · it prints on every invoice');A.invCfg()};r.readAsDataURL(f)});
A.invLogoX=()=>{delete D.invCfg.logo;save();A.invCfg()};
/* the invoice panel also offers the logo upload when none is set */
const _hrInvL=A.hrInv;A.hrInv=e=>{_hrInvL(e);if(!D.invCfg.logo&&(isAdm()||K()==='acc')){const s2=document.querySelector('.sheet .row[style*="margin:12px 0"]');if(s2)s2.insertAdjacentHTML('beforeend','<button class="btn sec" data-a="invCfg">Add logo &amp; bank details</button>')}};
const _vWal=V.wallet;V.wallet=()=>{const o=_vWal();return isAdm()?o.replace('<button class="btn sec" data-a="wDl">','<button class="btn sec" data-a="invCfg">Invoice settings</button><button class="btn sec" data-a="wDl">'):o};

document.head.insertAdjacentHTML('beforeend',`<style>
.hrtabs{width:100%}.hrmis{margin-left:auto!important;order:99}
.ivsw{display:inline-flex;background:#EEF1F6;border-radius:999px;padding:4px;gap:2px;margin-top:12px}
.ivsw button{border:0;background:transparent;border-radius:999px;padding:8px 20px;font:800 13px Inter,sans-serif;color:#4A5468;cursor:pointer;transition:all .18s}
.ivsw button.on.pending{background:#E8772E;color:#fff}.ivsw button.on.paid{background:#1F9D55;color:#fff}.ivsw button.on.void{background:#8A93A3;color:#fff}.ivsw button:disabled{cursor:not-allowed;opacity:.7}
.ivwrap{max-height:62vh;overflow:auto;border-radius:12px;background:#F4F6FA;padding:10px}
</style>`);
if(!isAdm()&&K()!=='acc'&&S.v==='wallet')S.v=tabsFor()[0][0];
render();

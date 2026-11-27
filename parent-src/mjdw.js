/* ===== JD Wallet v2 (phone): one wallet per customer across every JDAC company — PhonePe-style passbook.
   Same data as before (HR client ledgers + D.jdw on the server); this is the new face plus demo holders for testing. ===== */
(function(){if(typeof jwLive==='function'&&jwLive())return;const W=jwD();if(W.demo3)return;W.demo3=1;W.acc=W.acc.filter(a=>!/^jwd/.test(a.id));W.log=W.log.filter(t=>!/^jwd/.test(t.acc));
 const P=[['Gupta Freight Movers','9881077334','Pune','log'],['Shree Ganesh Traders','9822011122','Pune','log'],['Patil Furniture','9765432109','Kolhapur','log'],['Om Sai Electricals','9823345566','Nashik','log'],['Mehta Textiles','9930011223','Surat','log'],['Sharma Packers','9850022113','Mumbai','log'],
  ['Fernandes General Store','9823198231','Panaji','gb'],['Coastal Mart','9422012345','Margao','gb'],['Rhea D’Souza','9890045671','Mapusa','gb'],['Aarav Kamat','9767011890','Vasco','gb'],['Sea View Supermarket','9545012399','Calangute','gb'],
  ['Kothrud Care Home','9970012211','Pune','jup'],['Mrs. Kulkarni','9822500700','Pune','jup'],
  ['Balaji Retail Mart','9011223344','Pune','rb'],['Studio Bahiram','9604455667','Pune','studios']];
 const co=['log','gb','jup','hr','rb','studios'];let s=7;const r=()=>(s=(s*9301+49297)%233280)/233280;
 P.forEach(([n,ph,city,home],i)=>{const id='jwd'+i;if(W.acc.some(a=>a.ph===ph))return;W.acc.push({id,n,ph,city,home,at:dAgo(40-i)});
  const add=[5000,2000,10000,3000,7500,4000][i%6];W.log.push({id:id+'a',acc:id,d:dAgo(38-i),co:'jdw',kind:'add',amt:add,t:'Top-up',mode:['UPI','Bank','Cash'][i%3],ts:1});
  if(add>=2000)W.log.push({id:id+'b',acc:id,d:dAgo(38-i),co:'jdw',kind:'cashback',amt:Math.round(add*.05),t:'Bonus on top-up',ts:2});
  let bal=add,k=0;for(let j=0;j<2+i%3;j++){const c=r()<.55?home:co[Math.floor(r()*co.length)],amt=Math.min(bal,Math.round((200+r()*900)/10)*10);if(amt<=0)break;bal-=amt;
   W.log.push({id:id+'p'+j,acc:id,d:dAgo(Math.max(0,30-i-j*6)),co:c,kind:'pay',amt:-amt,t:{log:'Shipment booking',gb:'Order · Choconut box',jup:'Equipment rent',hr:'Hiring fee',rb:'Retail order',studios:'Design work'}[c],ts:3+j});k++}
  if(i%5===2)W.log.push({id:id+'r',acc:id,d:dAgo(3),co:home,kind:'refund',amt:150,t:'Refund · cancelled order',ts:9})});
 try{save()}catch(e){}})();

const jwInit=n=>String(n).replace(/[^A-Za-z ]/g,'').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'JD';
const jwCol=k=>jwCo(k)[2];
const jwIco={add:'↓',cashback:'★',pay:'↑',refund:'↺',adjust:'±'};
function jwStats(per){const T=jwTx(),f=jwPer(per),H=jwHolders();return {H,T,tot:H.reduce((a,x)=>a+x.bal,0),add:jwSum(T,t=>f(t)&&t.kind==='add'),bon:jwSum(T,t=>f(t)&&t.kind==='cashback'),paid:-jwSum(T,t=>f(t)&&t.kind==='pay'),ref:jwSum(T,t=>f(t)&&t.kind==='refund'),f}}
function jwMob(){const per=S.jwp||'month',st=jwStats(per),tab=S.jwt2||'w',q=(S.jwq||'').toLowerCase(),hc=S.jwhc||'all',so=S.jwso||'bal';
 const spent={};st.T.filter(t=>st.f(t)&&t.kind==='pay').forEach(t=>spent[t.co]=(spent[t.co]||0)-t.amt);const sp=Object.entries(spent).sort((a,b)=>b[1]-a[1]),spT=sp.reduce((a,x)=>a+x[1],0)||1;
 const hero=`<div class="jw2h"><div class="jw2t"><span>JD Wallet</span><em>One wallet · every JDAC company</em></div><small>Money in all customer wallets</small><b class="jw2b">${inr(st.tot)}</b>
  <div class="jw2s"><div><b>${st.H.length}</b><span>wallets</span></div><div><b>${st.H.filter(x=>x.bal>0).length}</b><span>with balance</span></div><div><b>${new Set(st.T.filter(t=>st.f(t)).map(t=>t.acc)).size}</b><span>active</span></div></div></div>`;
 const pers=`<div class="jw2p">${[['today','Today'],['7d','7 days'],['month','This month'],['all','All time']].map(([k,l])=>`<button class="${per===k?'on':''}" data-a="jwP" data-t="${k}">${l}</button>`).join('')}</div>`;
 const flow=`<div class="jw2f"><div class="in"><span>Added</span><b>+${inr(st.add)}</b></div><div class="bo"><span>Bonus given</span><b>+${inr(st.bon)}</b></div><div class="out"><span>Paid at companies</span><b>−${inr(st.paid)}</b></div><div class="rf"><span>Refunds</span><b>+${inr(st.ref)}</b></div></div>`;
 const where=sp.length?`<div class="jw2c"><div class="jw2ch"><b>Where wallets were used</b><span>${inr(st.paid)}</span></div><div class="jw2bar">${sp.map(([k,v])=>`<i style="flex:${v};background:${jwCol(k)}"></i>`).join('')}</div><div class="jw2leg">${sp.map(([k,v])=>`<span><i style="background:${jwCol(k)}"></i>${h(jwCo(k)[1])} <b>${inr(v)}</b></span>`).join('')}</div></div>`:'';
 const acts=`<div class="jw2a"><button data-a="jwNew"><i>${ic('plus')}</i>New wallet</button><button data-a="wRc"><i>↓</i>Add money</button><button data-a="jw2Pay"><i>↑</i>Pay / deduct</button><button data-a="jwCsv"><i>${ic('down')}</i>Statement</button></div>`;
 const tabs=`<div class="jw2tb"><button class="${tab==='w'?'on':''}" data-a="jw2T" data-t="w">Wallets <span>${st.H.length}</span></button><button class="${tab==='t'?'on':''}" data-a="jw2T" data-t="t">Passbook <span>${st.T.filter(st.f).length}</span></button></div>`;
 let body='';
 if(tab==='w'){const L=st.H.filter(x=>(hc==='all'||x.home===hc||(hc==='zero'&&x.bal<=0))&&(!q||(x.n+' '+x.ph+' '+x.wid+' '+x.city).toLowerCase().includes(q))),last={};st.T.forEach(t=>{if(!last[t.acc])last[t.acc]=t});
  L.sort((a,b)=>so==='bal'?b.bal-a.bal:so==='name'?a.n.localeCompare(b.n):String((last[b.id]||{}).d||'').localeCompare(String((last[a.id]||{}).d||'')));
  body=`<div class="jw2q">${sfi('search',15)}<input id="jwq2" value="${h(S.jwq||'')}" placeholder="Name, mobile, wallet ID, city" aria-label="Search wallets"><select data-ch="jwso" aria-label="Sort"><option value="bal" ${so==='bal'?'selected':''}>Highest balance</option><option value="recent" ${so==='recent'?'selected':''}>Recently used</option><option value="name" ${so==='name'?'selected':''}>Name</option></select></div>
  <div class="jw2k">${[['all','All',st.H.length,'#14213D'],...JW_CO.map(([k,l,c])=>[k,l,st.H.filter(x=>x.home===k).length,c]).filter(x=>x[2]),['zero','Zero balance',st.H.filter(x=>x.bal<=0).length,'#98A2B3']].map(([k,l,n,c])=>`<button class="${hc===k?'on':''}" style="--c:${c}" data-a="jw2Hc" data-t="${k}">${h(l)} <span>${n}</span></button>`).join('')}</div>
  ${L.map(x=>{const lt=last[x.id],used=[...new Set(st.T.filter(t=>t.acc===x.id&&t.kind==='pay').map(t=>t.co))];return `<button class="jw2r" data-a="jw2Open" data-id="${x.id}"><span class="jw2av" style="background:${jwCol(x.home)}">${h(jwInit(x.n))}</span><div class="tx"><b>${h(x.n)}</b><small>${h(x.wid)} · ${h(x.ph)}${x.city?' · '+h(x.city):''}</small><div class="jw2u">${jwBadge(x.home)}${used.filter(c=>c!==x.home).map(c=>`<i title="${h(jwCo(c)[1])}" style="background:${jwCol(c)}"></i>`).join('')}${lt?`<em>${lt.amt>0?'+':'−'}${inr(Math.abs(lt.amt))} · ${fmt(lt.d)}</em>`:''}</div></div><b class="jw2bal ${x.bal<=0?'z':''}">${inr(x.bal)}</b></button>`}).join('')||'<div class="mempty"><b>No wallets found</b></div>'}`}
 else body=jwPass(st.T.filter(st.f),true);
 return `<div class="jw2">${hero}${acts}${pers}${flow}${where}${tabs}${body}</div>`}
function jwPass(L,who){const HN=Object.fromEntries(jwHolders().map(x=>[x.id,x]));let last='';const RB={};if(!who){let run=0;L.slice().reverse().forEach(t=>{run+=t.amt;RB[t.i||t.id||t.ts]=run})}
 return `<div class="jw2pb">${L.slice(0,150).map(t=>{const day=t.d===TODAY?'Today':t.d===addD(TODAY,-1)?'Yesterday':fmt(t.d),sep=day!==last?`<div class="jw2d">${day}</div>`:'';last=day;const x=HN[t.acc]||{n:t.acc};
  return sep+`<div class="jw2tx k-${t.kind}"><i>${jwIco[t.kind]||'•'}</i><div class="tx"><b>${who?h(x.n):h(t.t||JW_TYPE[t.kind]||'')}</b><small>${who?h(t.t||JW_TYPE[t.kind]||''):h(JW_TYPE[t.kind]||'')}${t.mode?' · '+h(t.mode):''}</small>${t.co&&t.co!=='jdw'?jwBadge(t.co):''}</div><div class="jw2am"><b class="${t.amt<0?'neg':'pos'}">${t.amt<0?'−':'+'}${inr(Math.abs(t.amt))}</b>${!who&&RB[t.i||t.id||t.ts]!=null?`<small>bal ${inr(RB[t.i||t.id||t.ts])}</small>`:''}</div></div>`}).join('')||'<div class="mempty"><b>No transactions in this period</b></div>'}</div>`}
A.jw2T=e=>{S.jwt2=e.dataset.t;render()};A.jw2Hc=e=>{S.jwhc=e.dataset.t;render()};
document.addEventListener('change',e=>{if(e.target.dataset&&e.target.dataset.ch==='jwso'){S.jwso=e.target.value;render()}});
document.addEventListener('input',e=>{if(e.target.id==='jwq2'){S.jwq=e.target.value;const p=e.target.selectionStart;render();const i=document.getElementById('jwq2');if(i){i.focus();i.setSelectionRange(p,p)}}});
/* one customer's wallet — like opening a PhonePe wallet */
A.jw2Open=e=>{const x=jwH(e.dataset.id);if(!x)return;const T=jwTx().filter(t=>t.acc===x.id),inA=jwSum(T,t=>t.amt>0),out=-jwSum(T,t=>t.amt<0),by={};T.filter(t=>t.kind==='pay').forEach(t=>by[t.co]=(by[t.co]||0)-t.amt);
 sheet(`<div class="jw2card" style="--c:${jwCol(x.home)}"><div class="jw2ct"><span>JD Wallet</span><em>${h(x.wid)}</em></div><b>${inr(x.bal)}</b><small>Available balance</small><div class="jw2cn"><span>${h(x.n)}</span><span>${h(x.ph)}${x.city?' · '+h(x.city):''}</span></div></div>
 <div class="jw2a in"><button data-a="wRc" data-id="${x.id}"><i>↓</i>Add money</button><button data-a="jw2Pay" data-id="${x.id}"><i>↑</i>Pay</button><button data-a="wAdj" data-id="${x.id}"><i>↺</i>Refund</button><a href="https://wa.me/91${h(String(x.ph).replace(/\D/g,'').slice(-10))}?text=${encodeURIComponent('Your JD Wallet balance is '+inr(x.bal)+' ('+x.wid+'). Use it in any JDAC company.')}" target="_blank" rel="noopener"><i>${ic('chat')}</i>WhatsApp</a></div>
 <div class="jw2f sm"><div class="in"><span>Total in</span><b>+${inr(inA)}</b></div><div class="out"><span>Total spent</span><b>−${inr(out)}</b></div></div>
 ${Object.keys(by).length?`<div class="jw2c"><div class="jw2ch"><b>Used in</b></div>${Object.entries(by).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="jw2ub"><span>${jwBadge(k)}</span><div><i style="width:${v/out*100}%;background:${jwCol(k)}"></i></div><b>${inr(v)}</b></div>`).join('')}</div>`:''}
 <div class="row nw" style="margin:14px 2px 4px"><b>Passbook</b><span class="sp"></span><button class="lnk" data-a="wDl" data-id="${x.id}">Download</button></div>${jwPass(T,false)}`)};
/* take payment from a wallet at any company counter */
A.jw2Pay=e=>{const id=e&&e.dataset&&e.dataset.id;sheet(`<h2>Pay with JD Wallet</h2><p class="xs mut">Deduct from the customer's wallet for a bill in any company</p><label for="wrc">Customer</label>${jwSel('wrc',id)}
 <label>Company</label>${opts('jpc',JW_CO.map(c=>[c[0],c[1]]),id&&jwH(id)?jwH(id).home:'log')}<div class="grid g2"><div><label for="jpa">Amount ₹</label><input id="jpa" type="number" inputmode="numeric"></div><div><label for="jpf">For</label><input id="jpf" placeholder="e.g. Booking JL-55021"></div></div>
 <button class="btn w" style="margin-top:12px" data-a="jw2PayGo">Deduct from wallet</button>`)};
A.jw2PayGo=()=>{const r=jdWallet.pay(val('wrc'),pick1('jpc'),val('jpa'),val('jpf')||'Payment');if(!r.ok)return toast(r.msg||'Could not pay');closeM();render();toast('Paid · balance now '+inr(r.bal))};
const _vWalJ=V.wallet;V.wallet=()=>{if(!isMob()||!canWallet())return _vWalJ();if(!S.jwSync)setTimeout(jwSync,0);return jwMob()};
document.head.insertAdjacentHTML('beforeend',`<style>
.jw2h{position:relative;overflow:hidden;background:radial-gradient(120% 140% at 100% 0,#5f3dc4 0,#3b2a8a 35%,#14213D 100%);color:#fff;border-radius:22px;padding:16px 16px 14px;margin-bottom:12px}
.jw2t{display:flex;align-items:center;justify-content:space-between;gap:8px}.jw2t span{font:800 17px Inter,sans-serif}.jw2t em{font-style:normal;font-size:11px;background:rgba(255,255,255,.15);border-radius:99px;padding:4px 9px}
.jw2h small{display:block;margin-top:12px;font-size:12px;opacity:.8}.jw2b{display:block;font-size:34px;letter-spacing:-.02em;line-height:1.1}
.jw2s{display:grid;grid-template-columns:repeat(3,1fr);margin-top:12px;border-top:1px solid rgba(255,255,255,.18);padding-top:10px}.jw2s b{display:block;font-size:17px}.jw2s span{font-size:11px;opacity:.75}
.jw2a{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;background:#fff;border:1px solid var(--line);border-radius:18px;padding:12px 6px;margin-bottom:12px}
.jw2a button,.jw2a a{border:0;background:none;display:flex;flex-direction:column;align-items:center;gap:6px;font:600 11.5px Inter,sans-serif;color:#344054;cursor:pointer;text-decoration:none}
.jw2a i{width:44px;height:44px;border-radius:14px;background:#F1ECFF;color:#5f3dc4;display:grid;place-items:center;font-style:normal;font-size:19px;font-weight:800}.jw2a i svg{width:20px;height:20px}
.jw2a.in{margin-top:12px}
.jw2p{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin-bottom:8px}.jw2p::-webkit-scrollbar{display:none}.jw2p button{flex:none;border:1px solid var(--line);background:#fff;border-radius:99px;padding:6px 12px;font:600 12.5px Inter,sans-serif;cursor:pointer}.jw2p button.on{background:#14213D;color:#fff;border-color:#14213D}
.jw2f{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px}.jw2f div{background:#fff;border:1px solid var(--line);border-radius:14px;padding:9px 11px}.jw2f span{display:block;font-size:11px;color:var(--mut)}.jw2f b{font-size:16px}
.jw2f .in b{color:#1F9D55}.jw2f .bo b{color:#7A2E8E}.jw2f .out b{color:#C2410C}.jw2f .rf b{color:#0E8C9A}.jw2f.sm{margin-top:10px}
.jw2c{background:#fff;border:1px solid var(--line);border-radius:16px;padding:11px 12px;margin-bottom:10px}.jw2ch{display:flex;justify-content:space-between;align-items:baseline}.jw2ch b{font-size:14px}.jw2ch span{font-size:12px;color:var(--mut)}
.jw2bar{display:flex;gap:2px;height:9px;border-radius:5px;overflow:hidden;margin:9px 0 8px}.jw2bar i{display:block}
.jw2leg{display:flex;flex-wrap:wrap;gap:6px 12px}.jw2leg span{font-size:11.5px;color:#475467;display:flex;align-items:center;gap:5px}.jw2leg i{width:8px;height:8px;border-radius:50%}.jw2leg b{color:#101828}
.jw2tb{display:flex;border-bottom:1px solid var(--line);margin:4px 0 10px}.jw2tb button{flex:1;border:0;background:none;padding:10px 0;font:700 14px Inter,sans-serif;color:var(--mut);border-bottom:2.5px solid transparent;cursor:pointer}.jw2tb button.on{color:#14213D;border-color:#5f3dc4}.jw2tb span{color:var(--mut);font-weight:600}
.jw2q{display:flex;align-items:center;gap:8px;background:#fff;border:1px solid var(--line);border-radius:12px;padding:0 6px 0 12px;margin-bottom:8px}.jw2q input{flex:1;min-width:0;border:0;outline:0;background:none;padding:10px 0;font:14px Inter,sans-serif}.jw2q select{width:auto;border:0;background:#F2F4F7;border-radius:9px;min-height:32px;padding:2px 8px;font-size:12px}
.jw2k{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin-bottom:8px}.jw2k::-webkit-scrollbar{display:none}.jw2k button{flex:none;border:1px solid var(--line);background:#fff;border-radius:99px;padding:6px 11px;font:600 12px Inter,sans-serif;cursor:pointer;color:#344054}.jw2k span{color:var(--mut)}.jw2k button.on{background:var(--c);border-color:var(--c);color:#fff}.jw2k button.on span{color:rgba(255,255,255,.8)}
.jw2r{width:100%;display:flex;align-items:center;gap:10px;background:#fff;border:1px solid var(--line);border-radius:14px;padding:10px 12px;margin-bottom:6px;text-align:left;cursor:pointer;font:inherit;color:inherit}
.jw2av{width:40px;height:40px;border-radius:13px;color:#fff;display:grid;place-items:center;font:800 13px Inter,sans-serif;flex:none}
.jw2r .tx{flex:1;min-width:0;display:flex;flex-direction:column}.jw2r .tx b{font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.jw2r small{font-size:11.5px;color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.jw2u{display:flex;align-items:center;gap:4px;margin-top:4px;flex-wrap:wrap}.jw2u>i{width:8px;height:8px;border-radius:50%}.jw2u em{font-style:normal;font-size:11px;color:#475467;margin-left:4px}
.jw2bal{font-size:16px;white-space:nowrap;color:#14213D}.jw2bal.z{color:#98A2B3}
.jw2pb{background:#fff;border:1px solid var(--line);border-radius:16px;padding:4px 12px}
.jw2d{font:800 11px Inter,sans-serif;letter-spacing:.05em;text-transform:uppercase;color:var(--mut);padding:10px 0 4px}
.jw2tx{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid #F2F4F7}.jw2tx:last-child{border:0}
.jw2tx>i{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-weight:800;flex:none}
.jw2tx.k-add>i{background:#ECFDF3;color:#1F9D55}.jw2tx.k-cashback>i{background:#F4EBFF;color:#7A2E8E}.jw2tx.k-pay>i{background:#FFF1E6;color:#C2410C}.jw2tx.k-refund>i{background:#E6F7F8;color:#0E8C9A}.jw2tx.k-adjust>i{background:#F2F4F7;color:#475467}
.jw2tx .tx{flex:1;min-width:0;display:flex;flex-direction:column;align-items:flex-start;gap:2px}.jw2tx .tx b{font-size:13.5px}.jw2tx small{font-size:11.5px;color:var(--mut)}
.jw2am{display:flex;flex-direction:column;align-items:flex-end}.jw2am b{font-size:14px;white-space:nowrap}.jw2am small{font-size:10.5px;color:var(--mut)}.jw2tx .pos{color:#1F9D55}.jw2tx .neg{color:#101828}
.jw2card{background:linear-gradient(135deg,var(--c),#14213D);color:#fff;border-radius:20px;padding:16px;margin-top:4px}.jw2ct{display:flex;justify-content:space-between;font-size:12px;opacity:.9}.jw2ct span{font-weight:800}
.jw2card>b{display:block;font-size:32px;margin-top:12px;letter-spacing:-.02em}.jw2card>small{font-size:11.5px;opacity:.8}.jw2cn{display:flex;justify-content:space-between;margin-top:14px;font-size:12.5px;gap:8px}.jw2cn span:first-child{font-weight:700}
.jw2ub{display:grid;grid-template-columns:auto 1fr auto;gap:8px;align-items:center;margin-top:8px}.jw2ub>div{height:6px;background:#EEF0F4;border-radius:3px;overflow:hidden}.jw2ub>div i{display:block;height:100%}.jw2ub b{font-size:13px}
</style>`);

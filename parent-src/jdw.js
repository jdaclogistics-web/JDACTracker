/* ================= JD Wallet =================
   One wallet per customer for the whole JDAC group (like Paytm): the same balance is used in
   Logistics, HR Consultancy, GovaaBazaar, Retailer Bazaar, Jupiter and Studios.
   HR Consultancy clients keep their existing ledger (HR.walletLog + c.wallet); other holders live in D.jdw. */
const JW_CO=[['log','JDAC Logistics','#02496A'],['hr','HR Consultancy','#0B4F6C'],['gb','GovaaBazaar','#7a4a26'],['rb','Retailer Bazaar','#B4532A'],['jup','Jupiter','#137a50'],['studios','Studios','#0796A6']];
const jwCo=k=>JW_CO.find(x=>x[0]===k)||['other','Other','#667'];
const jwBadge=k=>{const c=jwCo(k);return `<span class="jwco" style="--cc:${c[2]}">${c[1]}</span>`};
const JW_KIND={add:['Money added','#1F9D55'],cashback:['Cashback','#7A2E8E'],pay:['Paid from wallet','#C2410C'],refund:['Refund to wallet','#0E8C9A'],adjust:['Adjustment','#667085']};
function jwD(){D.jdw=D.jdw||{acc:[],log:[]};return D.jdw}
const jwId=x=>'JDW-'+String((x.ph||'').replace(/\D/g,'').slice(-6)||(x.id||'').replace(/\D/g,'').padStart(6,'0')).padStart(6,'0');
/* everyone who holds a JD Wallet */
function jwHolders(){
 const A=wClients().map(c=>({id:c.id,n:c.n,ph:c.mob||'',city:c.city||'',home:'hr',src:'hr',bal:c.wallet||0}));
 const W=jwD();W.acc.forEach(a=>A.push({id:a.id,n:a.n,ph:a.ph||'',city:a.city||'',home:a.home||'log',src:'jd',bal:W.log.filter(t=>t.acc===a.id).reduce((s,t)=>s+t.amt,0)}));
 return A.map(x=>({...x,wid:jwId(x)}))}
const jwH=id=>jwHolders().find(x=>x.id===id);
/* every wallet movement, in one shape */
function jwTx(){
 const k=w=>{const x=wKind(w);return x==='recharge'||x==='rc+cb'?'add':x==='cashback'?'cashback':x==='fee'?'pay':w.kind==='refund'?'refund':w.kind==='pay'?'pay':'adjust'};
 const T=[];(HR.walletLog||[]).forEach((w,i)=>{const kk=k(w);if(wKind(w)==='rc+cb'){T.push({acc:w.co,d:w.d,co:'jdw',kind:'add',amt:w.amt/2,t:w.t,mode:w.mode,ref:w.ref,by:w.by,i:'h'+i});T.push({acc:w.co,d:w.d,co:'jdw',kind:'cashback',amt:w.amt/2,t:'Cashback',by:w.by,i:'h'+i+'c'})}else T.push({acc:w.co,d:w.d,co:w.cc||((w.jk||kk)==='pay'||(w.jk||kk)==='refund'?'hr':'jdw'),kind:w.jk||kk,amt:w.amt,t:w.t,mode:w.mode,ref:w.ref,by:w.by,i:'h'+i})});
 jwD().log.forEach(t=>T.push({...t,i:t.id}));return T.sort((a,b)=>(b.d||'').localeCompare(a.d||'')||(b.ts||0)-(a.ts||0))}
function jwPost(hid,t){const x=jwH(hid);if(!x)return;t={...t,d:t.d||TODAY,by:S.me,ts:Date.now()};
 if(x.src==='hr'){const c=hC(hid);HR.walletLog=HR.walletLog||[];HR.walletLog.push({co:hid,d:t.d,t:t.t,amt:t.amt,kind:t.kind==='add'?'recharge':t.kind==='cashback'?'cashback':t.kind==='pay'?'fee':'adjust',jk:t.kind,cc:t.co,mode:t.mode,ref:t.ref,by:t.by});c.wallet=(c.wallet||0)+t.amt}
 else{const r={id:'jt'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),acc:hid,...t};jwD().log.push(r);jwUp('jdw_tx',r)}save()}
/* shared on the server (append-only, audited) so every login sees the same balances */
const jwLive=()=>typeof LV!=='undefined'&&LV.ok&&LV.tok;
async function jwSync(force){if(!jwLive()||(S.jwSync&&!force))return;S.jwSync=1;try{const [a,t]=await Promise.all(['jdw_acc','jdw_tx'].map(tb=>lapi('GET','/api/legacy/rows?tbl='+tb+'&limit=1000')));
 const W=jwD(),A=a.rows.map(r=>({...r,id:r.key})),Tx=t.rows.map(r=>({...r,id:r.key,amt:+r.amt||0}));
 W.acc.filter(x=>!x.srv).forEach(x=>{if(!A.some(y=>y.id===x.id))jwUp('jdw_acc',x)});W.log.filter(x=>!x.srv).forEach(x=>{if(!Tx.some(y=>y.id===x.id))jwUp('jdw_tx',x)});
 const seen=new Set([...A,...Tx].map(x=>x.id));W.acc=[...A.map(x=>({...x,srv:1})),...W.acc.filter(x=>!seen.has(x.id))];W.log=[...Tx.map(x=>({...x,srv:1})),...W.log.filter(x=>!seen.has(x.id))];_saveJW();if(S.v==='wallet')render()}catch(x){S.jwSync=0}}
async function jwUp(tb,x){if(!jwLive())return;const {srv,createdAt,createdBy_name,_rid,...d}=x;try{await lapi('POST','/api/legacy/rows',{tbl:tb,data:{...d,key:x.id}});x.srv=1;_saveJW()}catch(e){toast('Not saved on server: '+e.message)}}
const _saveJW=()=>{try{save()}catch(x){}};
const jwSum=(L,f)=>L.filter(f).reduce((s,t)=>s+t.amt,0);
const jwPer=p=>{const m=TODAY.slice(0,7);return p==='today'?t=>t.d===TODAY:p==='7d'?t=>t.d>=dAgo(6):p==='month'?t=>(t.d||'').slice(0,7)===m:()=>true};

/* ---------- page ----------
   JD Wallet is its own entity (like Paytm). Customers add money to the wallet itself; each JDAC company only
   ACCEPTS it at payment (checkout). This page is the wallet's own back office: every holder, every rupee in and out. */
const JW_TYPE={add:'Money added',cashback:'Bonus / cashback',pay:'Payment',refund:'Refund',adjust:'Adjustment'};
const jwWhere=t=>t.kind==='pay'||t.kind==='refund'?jwBadge(t.co):'<span class="xs mut">JD Wallet</span>';
V.wallet=()=>{if(!canWallet())return page('JD Wallet')+empty('Not for your login');if(!S.jwSync)setTimeout(jwSync,0);
 const H=jwHolders(),T=jwTx(),tab=S.jwt==='hist'?'hist':'holders',m=TODAY.slice(0,7),TM=T.filter(t=>(t.d||'').slice(0,7)===m);
 const tot=H.reduce((s,x)=>s+x.bal,0);
 const card=`<div class="jwhero1"><div class="jwcard"><div class="row nw"><b class="jwbrand">JD<span>Wallet</span></b><span class="sp"></span><span class="jwchip">Accepted in every JDAC company</span></div>
  <div class="jwlbl">Money in customer wallets</div><div class="jwbig">${inr(tot)}</div>
  <div class="jwrow"><div><span>Wallet holders</span><b>${H.length}</b></div><div><span>Added this month</span><b>${inr(jwSum(TM,t=>t.kind==='add'))}</b></div><div><span>Paid with wallet this month</span><b>${inr(-jwSum(TM,t=>t.kind==='pay'))}</b></div><div><span>Bonus given this month</span><b>${inr(jwSum(TM,t=>t.kind==='cashback'))}</b></div></div></div>
  <div class="card jwhow"><b>How JD Wallet works</b><ol><li><b>Add money</b> — the customer tops up their JD Wallet (UPI, bank, cash). It belongs to no company.</li><li><b>Pay anywhere</b> — at payment in Logistics, HR Consultancy, GovaaBazaar, Retailer Bazaar, Jupiter or Studios, the customer sees “JD Wallet · ₹ balance” and pays with it.</li><li><b>One statement</b> — every top-up and every payment, with where it was spent, shows here per customer.</li></ol></div></div>`;
 const head=page('JD Wallet','One wallet per customer · usable in every JDAC company',`<div class="row hide-m">${isAdm()?'<button class="btn sec" data-a="invCfg">Invoice settings</button>':''}<button class="btn sec" data-a="jwNew">${ic('plus')}New wallet</button><button class="btn" data-a="wRc">${ic('plus')}Add money</button></div>`);
 const tabs=`<div class="cmbar">${chips([['holders','Wallet holders',H.length],['hist','All transactions',T.length]],tab,'jwTab')}<span class="sp"></span><div class="sfq" style="background:#fff;border:1px solid var(--line);min-width:240px">${sfi('search',16)}<label class="sr" for="jwq">Search</label><input id="jwq" value="${h(S.jwq||'')}" placeholder="Name, mobile, wallet ID, city"></div></div>`;
 const q=(S.jwq||'').toLowerCase(),hit=x=>!q||[x.n,x.ph,x.wid,x.city].join(' ').toLowerCase().includes(q);
 let body='';
 if(tab==='holders'){const L=H.filter(hit).sort((a,b)=>b.bal-a.bal);
  body=`<div class="xsheet"><table><thead><tr><th class="stk">Customer</th><th>Wallet ID</th><th class="n">Balance</th><th class="n">Added</th><th class="n">Bonus</th><th class="n">Paid with wallet</th><th>Spent at</th><th>Last activity</th><th></th></tr></thead><tbody>
  ${L.map(x=>{const M=T.filter(t=>t.acc===x.id),at=[...new Set(M.filter(t=>t.kind==='pay').map(t=>t.co))],last=M[0];
   return `<tr><td class="stk"><button class="lnk" data-a="wOpen" data-id="${x.id}"><b>${h(x.n)}</b></button><span>${h([x.ph,x.city].filter(Boolean).join(' · '))}</span></td><td><code class="jwid">${x.wid}</code></td><td class="n"><b style="color:${x.bal<0?'var(--r)':'#1F9D55'}">${inr(x.bal)}</b></td><td class="n">${inr(jwSum(M,t=>t.kind==='add'))}</td><td class="n">${inr(jwSum(M,t=>t.kind==='cashback'))}</td><td class="n">${inr(-jwSum(M,t=>t.kind==='pay'))}</td><td>${at.map(jwBadge).join(' ')||'<span class="xs mut">—</span>'}</td><td>${last?fmt(last.d)+' · '+h(JW_TYPE[last.kind]||''):'—'}</td><td><button class="btn sm sec" data-a="wOpen" data-id="${x.id}">Open wallet</button></td></tr>`}).join('')||`<tr><td colspan="9" class="mut" style="text-align:center;padding:18px">No wallet found. Use <b>New wallet</b> to open one.</td></tr>`}</tbody></table></div>`}
 else{const ty=S.jwk||'all',pr=S.jwp||'month',HN=Object.fromEntries(H.map(x=>[x.id,x]));
  const L=T.filter(t=>(ty==='all'||t.kind===ty)&&jwPer(pr)(t)&&(!q||hit(HN[t.acc]||{})||(t.t||'').toLowerCase().includes(q)));
  body=`<div class="jwfil">${chips([['today','Today'],['7d','7 days'],['month','This month'],['all','All time']],pr,'jwP')}${chips([['all','All types'],...Object.entries(JW_TYPE)],ty,'jwK')}<span class="sp"></span><button class="btn sm sec" data-a="jwCsv">${ic('dl')}Download</button></div>
  <div class="ckpi">${[[inr(jwSum(L,t=>t.kind==='add')),'Money added','g'],[inr(-jwSum(L,t=>t.kind==='pay')),'Paid with wallet','o'],[inr(jwSum(L,t=>t.kind==='cashback')),'Bonus / cashback','p'],[inr(jwSum(L,t=>t.kind==='refund')),'Refunds','b'],[L.length,'Transactions','b']].map(k=>`<div class="ck ${k[2]}" style="cursor:default"><b>${k[0]}</b><span>${k[1]}</span></div>`).join('')}</div>
  <div class="xsheet"><table><thead><tr><th>Date</th><th class="stk">Customer</th><th>Type</th><th>Where</th><th>Details</th><th class="n">In</th><th class="n">Out</th></tr></thead><tbody>
  ${L.slice(0,500).map(t=>{const x=HN[t.acc]||{n:'—'};return `<tr><td>${fmt(t.d)}</td><td class="stk"><button class="lnk" data-a="wOpen" data-id="${t.acc}"><b>${h(x.n)}</b></button><span>${x.wid||''}</span></td><td><span class="jwk" style="--kc:${(JW_KIND[t.kind]||JW_KIND.adjust)[1]}">${JW_TYPE[t.kind]||'Adjustment'}</span></td><td>${jwWhere(t)}</td><td>${h(t.t||'')}${t.mode?` <span class="xs mut">· ${h(t.mode)}${t.ref?' '+h(t.ref):''}</span>`:''}</td><td class="n" style="color:#1F9D55">${t.amt>0?inr(t.amt):''}</td><td class="n" style="color:#C2410C">${t.amt<0?inr(-t.amt):''}</td></tr>`}).join('')||'<tr><td colspan="7" class="mut" style="text-align:center;padding:18px">Nothing in this period</td></tr>'}</tbody></table></div>`}
 return head+card+tabs+body};
A.jwTab=e=>{S.jwt=e.dataset.t;render()};A.jwP=e=>{S.jwp=e.dataset.t;render()};A.jwK=e=>{S.jwk=e.dataset.t;render()};
document.addEventListener('input',e=>{if(e.target.id==='jwq'){S.jwq=e.target.value;const p=e.target.selectionStart;render();const i=document.getElementById('jwq');if(i){i.focus();i.setSelectionRange(p,p)}}});

/* ---------- one customer's wallet ---------- */
A.wOpen=e=>{const x=jwH(e.dataset.id);if(!x)return toast('Wallet not found');const M=jwTx().filter(t=>t.acc===x.id);let run=0;const L=M.slice().reverse().map(t=>({...t,bal:(run+=t.amt)})).reverse();
 const spent=JW_CO.map(c=>[c,-jwSum(M,t=>t.co===c[0]&&t.kind==='pay'),jwSum(M,t=>t.co===c[0]&&t.kind==='refund')]).filter(r=>r[1]||r[2]),tp=spent.reduce((s,r)=>s+r[1],0)||1;
 sheet(`<div class="jwcard sm"><div class="row nw"><b class="jwbrand">JD<span>Wallet</span></b><span class="sp"></span><code>${x.wid}</code></div><div class="jwlbl">${h(x.n)}${x.ph?' · '+h(x.ph):''}${x.city?' · '+h(x.city):''}</div><div class="jwbig">${inr(x.bal)}</div><div class="xs" style="opacity:.8">Available balance · accepted in every JDAC company</div></div>
 <div class="row" style="gap:8px;margin:12px 0"><button class="btn sm" data-a="wRc" data-id="${x.id}">${ic('plus')}Add money</button><button class="btn sm sec" data-a="wAdj" data-id="${x.id}">Refund / adjust</button><button class="btn sm sec" data-a="wDl" data-id="${x.id}">${ic('dl')}Statement</button></div>
 <div class="grid g2" style="gap:8px;margin-bottom:10px">${[['Money added',jwSum(M,t=>t.kind==='add')],['Bonus / cashback',jwSum(M,t=>t.kind==='cashback')],['Paid with wallet',-jwSum(M,t=>t.kind==='pay')],['Refunds',jwSum(M,t=>t.kind==='refund')]].map(r=>`<div class="card" style="margin:0;padding:10px 12px"><div class="xs mut">${r[0]}</div><b>${inr(r[1])}</b></div>`).join('')}</div>
 <div class="card" style="margin:0 0 10px;padding:12px 14px"><b style="font-size:13.5px">Where the money was spent</b>${spent.length?spent.map(r=>`<div class="jwsp"><span>${jwBadge(r[0][0])}</span><div class="jwbars"><i style="width:${r[1]/tp*100}%;background:${r[0][2]}"></i></div><b>${inr(r[1])}</b>${r[2]?`<span class="xs" style="color:#0E8C9A">+${inr(r[2])} refund</span>`:''}</div>`).join(''):'<div class="xs mut" style="margin-top:6px">Not used for any payment yet</div>'}</div>
 <div class="xsheet"><table><thead><tr><th>Date</th><th>Type</th><th>Where</th><th>Details</th><th class="n">In</th><th class="n">Out</th><th class="n">Balance</th></tr></thead><tbody>${L.map(t=>`<tr><td>${fmt(t.d)}</td><td><span class="jwk" style="--kc:${(JW_KIND[t.kind]||JW_KIND.adjust)[1]}">${JW_TYPE[t.kind]||'Adjustment'}</span></td><td>${jwWhere(t)}</td><td>${h(t.t||'')}${t.mode?` <span class="xs mut">· ${h(t.mode)}${t.ref?' '+h(t.ref):''}</span>`:''}</td><td class="n" style="color:#1F9D55">${t.amt>0?inr(t.amt):''}</td><td class="n" style="color:#C2410C">${t.amt<0?inr(-t.amt):''}</td><td class="n">${inr(t.bal)}</td></tr>`).join('')||'<tr><td colspan="7" class="mut" style="text-align:center;padding:16px">No activity yet</td></tr>'}</tbody></table></div>`);
 const sh=document.querySelector('.sheet');if(sh&&sh.style)sh.style.maxWidth='900px'};

/* ---------- open a wallet (belongs to the customer, not to a company) ---------- */
A.jwNew=()=>sheet(`<h2>New JD Wallet</h2><p class="xs mut">One wallet per mobile number. It can be used in every JDAC company.</p>
 <label for="jwn">Customer / business name</label><input id="jwn"><label for="jwph">Mobile number</label><input id="jwph" type="tel" inputmode="numeric" maxlength="10"><label for="jwc">City</label><input id="jwc">
 <button class="btn w" style="margin-top:14px" data-a="jwNewGo">Open wallet</button>`);
A.jwNewGo=()=>{const n=val('jwn').trim(),ph=val('jwph').replace(/\D/g,'');if(!n||ph.length!==10)return toast('Name and 10-digit mobile please');
 const ex=jwHolders().find(x=>(x.ph||'').replace(/\D/g,'').slice(-10)===ph);if(ex){closeM();toast('This mobile already has a JD Wallet');return A.wOpen({dataset:{id:ex.id}})}
 const a={id:'jw'+Date.now().toString(36),n,ph,city:val('jwc').trim(),since:TODAY};jwD().acc.push(a);save();jwUp('jdw_acc',a);closeM();render();A.wOpen({dataset:{id:a.id}});toast('Wallet opened · '+jwId(a))};

/* ---------- add money (top-up into the wallet itself) ---------- */
const jwSel=(id,cur)=>`<select id="${id}">${jwHolders().sort((a,b)=>a.n.localeCompare(b.n)).map(x=>`<option value="${x.id}" ${cur===x.id?'selected':''}>${h(x.n)} · ${x.wid} · ${inr(x.bal)}</option>`).join('')}</select>`;
A.wRc=e=>{const id=e&&e.dataset&&e.dataset.id;sheet(`<h2>Add money to JD Wallet</h2><label for="wrc">Customer</label>${jwSel('wrc',id)}
 <label for="wra">Amount received (₹)</label><input id="wra" type="number" inputmode="numeric" placeholder="e.g. 5000"><label>Paid by</label>${opts('wrm',[['UPI','UPI'],['Bank transfer','Bank transfer'],['Cheque','Cheque'],['Cash','Cash'],['Razorpay','Razorpay']],'UPI')}
 <label for="wrr">Reference / UTR (optional)</label><input id="wrr" placeholder="UTR, cheque no. …">
 <label for="wcba">Bonus / cashback (₹, optional)</label><div class="row nw" style="gap:8px"><input id="wcba" type="number" inputmode="numeric" placeholder="0" style="flex:1"><button type="button" class="btn sm sec" data-a="jwOffer">HR offer · 100%</button></div><p class="xs mut">HR Consultancy employer offer: 100% bonus, up to ₹10,000 per customer.</p>
 <button class="btn w" style="margin-top:14px" data-a="wRcGo">Add to wallet</button>`)};
A.jwOffer=()=>{const id=val('wrc'),a=Math.round(+val('wra')||0);if(a<=0)return toast('Enter the amount first');const had=jwSum(jwTx(),t=>t.acc===id&&t.kind==='cashback');const i=document.getElementById('wcba');if(i)i.value=Math.max(0,Math.min(a,10000-had))};
A.wRcGo=()=>{const id=val('wrc'),x=jwH(id),a=Math.round(+val('wra')||0);if(!x||a<=0)return toast('Enter the amount');
 const mode=pick1('wrm')||'UPI',ref=val('wrr'),cb=Math.max(0,Math.round(+val('wcba')||0));
 jwPost(id,{co:'jdw',kind:'add',amt:a,t:'Top-up',mode,ref});if(cb>0)jwPost(id,{co:'jdw',kind:'cashback',amt:cb,t:'Bonus on top-up'});
 closeM();render();toast(`${inr(a)} added${cb?' + '+inr(cb)+' bonus':''} · balance ${inr(jwH(id).bal)}`)};

/* ---------- used by each company's checkout: pay with JD Wallet ---------- */
window.jdWallet={
 find:ph=>jwHolders().find(x=>(x.ph||'').replace(/\D/g,'').slice(-10)===String(ph||'').replace(/\D/g,'').slice(-10)),
 balance:id=>(jwH(id)||{}).bal||0,
 pay:(id,co,amt,forWhat)=>{const x=jwH(id);amt=Math.round(+amt||0);if(!x||amt<=0)return {ok:false,msg:'Wallet not found'};if(amt>x.bal)return {ok:false,msg:'Only '+inr(x.bal)+' in JD Wallet'};jwPost(id,{co,kind:'pay',amt:-amt,t:forWhat||'Payment'});return {ok:true,bal:jwH(id).bal}},
 refund:(id,co,amt,forWhat)=>{amt=Math.round(+amt||0);if(!jwH(id)||amt<=0)return {ok:false};jwPost(id,{co,kind:'refund',amt,t:forWhat||'Refund'});return {ok:true,bal:jwH(id).bal}}};

/* ---------- refund / adjust ---------- */
A.wAdj=e=>{const x=jwH(e.dataset.id);sheet(`<h2>Refund / adjust · ${h(x.n)}</h2><p class="xs mut">Balance now ${inr(x.bal)}.</p>${opts('wjt',[['refund','Refund of a payment'],['credit','Add (correction)'],['debit','Take out (correction)']],'refund')}
 <label>Refund from (company where it was paid)</label>${opts('wjco',JW_CO.map(c=>[c[0],c[1]]),'log')}<label for="wja">Amount (₹)</label><input id="wja" type="number" inputmode="numeric"><label for="wjr">Reason</label><input id="wjr">
 <button class="btn w" style="margin-top:14px" data-a="wAdjGo" data-id="${x.id}">Save</button>`)};
A.wAdjGo=e=>{const id=e.dataset.id,a=Math.round(+val('wja')||0),r=val('wjr').trim(),ty=pick1('wjt');if(a<=0||!r)return toast('Amount and reason please');
 jwPost(id,{co:ty==='refund'?(pick1('wjco')||'log'):'jdw',kind:ty==='refund'?'refund':'adjust',amt:ty==='debit'?-a:a,t:r});closeM();render();toast('Saved · balance '+inr(jwH(id).bal))};

/* ---------- downloads ---------- */
const jwRows=L=>{const HN=Object.fromEntries(jwHolders().map(x=>[x.id,x]));return [['Date','Customer','Wallet ID','Mobile','Where','Type','Particulars','Mode','Reference','In','Out'],...L.map(t=>{const x=HN[t.acc]||{};return [t.d,x.n||'',x.wid||'',x.ph||'',(t.kind==='pay'||t.kind==='refund'?jwCo(t.co)[1]:'JD Wallet'),(JW_KIND[t.kind]||[''])[0],t.t||'',t.mode||'',t.ref||'',t.amt>0?t.amt:'',t.amt<0?-t.amt:'']})]};
A.wDl=async e=>{const id=e&&e.dataset&&e.dataset.id,L=jwTx().filter(t=>!id||t.acc===id).reverse();await saveFile('JD_Wallet_'+(id?(jwH(id).n||'').replace(/\W+/g,'_'):'all')+'_'+TODAY+'.csv',csv(jwRows(L)))};
A.jwCsv=async()=>{const co='all',ty=S.jwk||'all',pr=S.jwp||'month';await saveFile('JD_Wallet_history_'+TODAY+'.csv',csv(jwRows(jwTx().filter(t=>(co==='all'||t.co===co)&&(ty==='all'||t.kind===ty)&&jwPer(pr)(t)).reverse())))};

/* sidebar label */
const _tabsJW=tabsFor;tabsFor=function(who){return _tabsJW(who).map(x=>x[0]==='wallet'?[x[0],'JD Wallet',x[2]]:x)};

document.head.insertAdjacentHTML('beforeend',`<style>
.jwhero1{display:grid;grid-template-columns:minmax(320px,1.1fr) 1fr;gap:14px;margin:4px 0 14px}@media(max-width:900px){.jwhero1{grid-template-columns:1fr}}
.jwhow{margin:0;padding:16px 18px}.jwhow ol{margin:8px 0 0;padding-left:18px;display:flex;flex-direction:column;gap:8px;font-size:13.5px;color:#3B4252}
.jwsp{display:grid;grid-template-columns:150px 1fr auto auto;gap:10px;align-items:center;margin-top:8px}
.jwhero{display:grid;grid-template-columns:minmax(300px,1.1fr) 1.4fr;gap:14px;margin:4px 0 14px}@media(max-width:900px){.jwhero1{display:grid;grid-template-columns:minmax(320px,1.1fr) 1fr;gap:14px;margin:4px 0 14px}@media(max-width:900px){.jwhero1{grid-template-columns:1fr}}
.jwhow{margin:0;padding:16px 18px}.jwhow ol{margin:8px 0 0;padding-left:18px;display:flex;flex-direction:column;gap:8px;font-size:13.5px;color:#3B4252}
.jwsp{display:grid;grid-template-columns:150px 1fr auto auto;gap:10px;align-items:center;margin-top:8px}
.jwhero{grid-template-columns:1fr}}
.jwcard{background:radial-gradient(120% 140% at 100% 0%,#1d6fa0 0%,#0a3a5c 45%,#061f33 100%);color:#fff;border-radius:20px;padding:20px 22px;box-shadow:0 14px 30px -14px rgba(6,31,51,.55);position:relative;overflow:hidden}
.jwcard:after{content:"";position:absolute;right:-60px;bottom:-80px;width:220px;height:220px;border-radius:50%;background:rgba(255,255,255,.06)}
.jwcard.sm{padding:16px 18px;border-radius:16px}.jwcard code{background:rgba(255,255,255,.14);padding:3px 8px;border-radius:8px;font-size:12px;letter-spacing:.5px}
.jwbrand{font:800 20px Outfit,sans-serif;letter-spacing:.3px}.jwbrand span{font-weight:500;opacity:.85;margin-left:4px}
.jwchip{font-size:11px;background:rgba(255,255,255,.14);padding:4px 10px;border-radius:99px}
.jwlbl{margin-top:16px;font-size:12.5px;opacity:.8}.jwbig{font:800 36px Outfit,sans-serif;margin:2px 0 6px;letter-spacing:-.5px}
.jwrow{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:10px;border-top:1px solid rgba(255,255,255,.15);padding-top:12px}.jwrow span{display:block;font-size:11px;opacity:.75}.jwrow b{font-size:15px}
@media(max-width:560px){.jwrow{grid-template-columns:repeat(2,1fr)}}
.jwflow{margin:0;padding:16px 18px}.jwfl{display:grid;grid-template-columns:12px 130px 1fr auto;gap:10px;align-items:center;padding:7px 0;border-bottom:1px dashed var(--line)}.jwfl:last-of-type{border-bottom:0}
.jwdot{width:10px;height:10px;border-radius:50%;display:inline-block}.jwn{font-weight:600;font-size:13.5px}.jwbars{display:flex;flex-direction:column;gap:3px}.jwbars i{display:block;height:6px;border-radius:6px;min-width:2px}.jwv{font-size:12px;white-space:nowrap}
@media(max-width:560px){.jwfl{grid-template-columns:12px 1fr auto}.jwbars{display:none}}
.jwco{display:inline-block;font-size:11px;font-weight:700;color:var(--cc);background:color-mix(in srgb,var(--cc) 12%,#fff);border:1px solid color-mix(in srgb,var(--cc) 30%,#fff);padding:2px 8px;border-radius:99px;margin:1px 0;white-space:nowrap}
.jwk{font-size:11.5px;font-weight:700;color:var(--kc)}.jwid{font-size:12px;background:#EEF2FB;color:#0a3a5c;padding:2px 7px;border-radius:6px}
.jwfil{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px}
.jwcos{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}.jwcoc{margin:0;text-align:left;cursor:pointer;border-top:4px solid var(--cc)!important;font:inherit}.jwcoc:hover{box-shadow:0 8px 20px -10px rgba(0,0,0,.25)}
.jwcog{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:12px}.jwcog span{display:block;font-size:11.5px;color:var(--mut)}.jwcog b{font-size:16px}
</style>`);

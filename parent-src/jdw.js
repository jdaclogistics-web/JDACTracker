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
 const T=[];(HR.walletLog||[]).forEach((w,i)=>{const kk=k(w);if(wKind(w)==='rc+cb'){T.push({acc:w.co,d:w.d,co:w.cc||'hr',kind:'add',amt:w.amt/2,t:w.t,mode:w.mode,ref:w.ref,by:w.by,i:'h'+i});T.push({acc:w.co,d:w.d,co:w.cc||'hr',kind:'cashback',amt:w.amt/2,t:'Cashback',by:w.by,i:'h'+i+'c'})}else T.push({acc:w.co,d:w.d,co:w.cc||'hr',kind:w.jk||kk,amt:w.amt,t:w.t,mode:w.mode,ref:w.ref,by:w.by,i:'h'+i})});
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

/* ---------- page ---------- */
V.wallet=()=>{if(!canWallet())return page('JD Wallet')+empty('Not for your login');if(!S.jwSync)setTimeout(jwSync,0);
 const H=jwHolders(),T=jwTx(),tab=S.jwt||'holders',m=TODAY.slice(0,7),TM=T.filter(t=>(t.d||'').slice(0,7)===m);
 const tot=H.reduce((s,x)=>s+x.bal,0),inM=jwSum(TM,t=>t.amt>0&&t.kind!=='cashback'),cbM=jwSum(TM,t=>t.kind==='cashback'),outM=-jwSum(TM,t=>t.amt<0);
 const used=k=>-jwSum(TM,t=>t.co===k&&t.amt<0),added=k=>jwSum(TM,t=>t.co===k&&t.amt>0),mx=Math.max(1,...JW_CO.map(c=>Math.max(used(c[0]),added(c[0]))));
 const hero=`<div class="jwhero"><div class="jwcard"><div class="row nw"><b class="jwbrand">JD<span>Wallet</span></b><span class="sp"></span><span class="jwchip">One balance · all JDAC companies</span></div>
  <div class="jwlbl">Total money in customer wallets</div><div class="jwbig">${inr(tot)}</div>
  <div class="jwrow"><div><span>Wallet holders</span><b>${H.length}</b></div><div><span>Added this month</span><b>${inr(inM)}</b></div><div><span>Cashback this month</span><b>${inr(cbM)}</b></div><div><span>Spent this month</span><b>${inr(outM)}</b></div></div></div>
  <div class="card jwflow"><div class="row nw"><b>Where wallet money moved · ${new Date(TODAY).toLocaleString('en-IN',{month:'long'})}</b></div>
  ${JW_CO.map(c=>`<div class="jwfl"><span class="jwdot" style="background:${c[2]}"></span><span class="jwn">${c[1]}</span><div class="jwbars"><i style="width:${added(c[0])/mx*100}%;background:#1F9D55"></i><i style="width:${used(c[0])/mx*100}%;background:#C2410C"></i></div><span class="jwv"><b style="color:#1F9D55">+${inr(added(c[0]))}</b> <b style="color:#C2410C">−${inr(used(c[0]))}</b></span></div>`).join('')}
  <div class="xs mut" style="margin-top:6px"><span style="color:#1F9D55">●</span> added in that company &nbsp; <span style="color:#C2410C">●</span> spent in that company</div></div></div>`;
 const head=page('JD Wallet','One wallet per customer — the same balance works in every JDAC company',`<div class="row hide-m">${isAdm()?'<button class="btn sec" data-a="invCfg">Invoice settings</button>':''}<button class="btn sec" data-a="jwNew">${ic('plus')}New wallet</button><button class="btn sec" data-a="jwPay">Pay from wallet</button><button class="btn" data-a="wRc">${ic('plus')}Add money</button></div>`);
 const tabs=`<div class="cmbar">${chips([['holders','Wallet holders',H.length],['hist','History',T.length],['cos','By company',JW_CO.length]],tab,'jwTab')}<span class="sp"></span><div class="sfq" style="background:#fff;border:1px solid var(--line);min-width:240px">${sfi('search',16)}<label class="sr" for="jwq">Search</label><input id="jwq" value="${h(S.jwq||'')}" placeholder="Name, phone, wallet ID, city"></div></div>`;
 const q=(S.jwq||'').toLowerCase(),hit=x=>!q||[x.n,x.ph,x.wid,x.city].join(' ').toLowerCase().includes(q);
 let body='';
 if(tab==='holders'){const L=H.filter(hit).sort((a,b)=>b.bal-a.bal);
  body=`<div class="xsheet"><table><thead><tr><th class="stk">Customer</th><th>Wallet ID</th><th class="n">Balance</th><th class="n">Added</th><th class="n">Cashback</th><th class="n">Spent</th><th>Used in</th><th>Last activity</th><th></th></tr></thead><tbody>
  ${L.map(x=>{const M=T.filter(t=>t.acc===x.id),cos=[...new Set(M.map(t=>t.co).concat(x.home))],last=M[0];
   return `<tr><td class="stk"><button class="lnk" data-a="wOpen" data-id="${x.id}"><b>${h(x.n)}</b></button><span>${h([x.ph,x.city].filter(Boolean).join(' · '))}</span></td><td><code class="jwid">${x.wid}</code></td><td class="n"><b style="color:${x.bal<0?'var(--r)':'#1F9D55'}">${inr(x.bal)}</b></td><td class="n">${inr(jwSum(M,t=>t.kind==='add'))}</td><td class="n">${inr(jwSum(M,t=>t.kind==='cashback'))}</td><td class="n">${inr(-jwSum(M,t=>t.amt<0))}</td><td>${cos.map(jwBadge).join(' ')}</td><td>${last?fmt(last.d)+' · '+h((last.t||'').slice(0,30)):'—'}</td><td><button class="btn sm sec" data-a="wOpen" data-id="${x.id}">Open</button></td></tr>`}).join('')||`<tr><td colspan="9" class="mut" style="text-align:center;padding:18px">No wallet found. Use <b>New wallet</b> to open one.</td></tr>`}</tbody></table></div>`}
 else if(tab==='hist'){const co=S.jwco||'all',ty=S.jwk||'all',pr=S.jwp||'month',HN=Object.fromEntries(H.map(x=>[x.id,x]));
  const L=T.filter(t=>(co==='all'||t.co===co)&&(ty==='all'||t.kind===ty)&&jwPer(pr)(t)&&(!q||hit(HN[t.acc]||{})||(t.t||'').toLowerCase().includes(q)));
  body=`<div class="jwfil">${chips([['today','Today'],['7d','7 days'],['month','This month'],['all','All time']],pr,'jwP')}${chips([['all','All companies'],...JW_CO.map(c=>[c[0],c[1]])],co,'jwCoF')}${chips([['all','All types'],...Object.entries(JW_KIND).map(([k,v])=>[k,v[0]])],ty,'jwK')}<span class="sp"></span><button class="btn sm sec" data-a="jwCsv">${ic('dl')}Download</button></div>
  <div class="ckpi">${[[inr(jwSum(L,t=>t.kind==='add')),'Added','g'],[inr(jwSum(L,t=>t.kind==='cashback')),'Cashback','p'],[inr(-jwSum(L,t=>t.amt<0)),'Spent','o'],[inr(jwSum(L,t=>t.kind==='refund')),'Refunds','b'],[L.length,'Entries','b']].map(k=>`<div class="ck ${k[2]}" style="cursor:default"><b>${k[0]}</b><span>${k[1]}</span></div>`).join('')}</div>
  <div class="xsheet"><table><thead><tr><th>Date</th><th class="stk">Customer</th><th>Company</th><th>Type</th><th>Particulars</th><th class="n">In</th><th class="n">Out</th><th>By</th></tr></thead><tbody>
  ${L.slice(0,400).map(t=>{const x=HN[t.acc]||{n:'—'},K=JW_KIND[t.kind]||JW_KIND.adjust;return `<tr><td>${fmt(t.d)}</td><td class="stk"><button class="lnk" data-a="wOpen" data-id="${t.acc}"><b>${h(x.n)}</b></button><span>${x.wid||''}</span></td><td>${jwBadge(t.co)}</td><td><span class="jwk" style="--kc:${K[1]}">${K[0]}</span></td><td>${h(t.t||'')}${t.mode?` <span class="xs mut">· ${h(t.mode)}${t.ref?' '+h(t.ref):''}</span>`:''}</td><td class="n" style="color:#1F9D55">${t.amt>0?inr(t.amt):''}</td><td class="n" style="color:#C2410C">${t.amt<0?inr(-t.amt):''}</td><td class="xs">${h((P[t.by]||{}).n||t.by||'')}</td></tr>`}).join('')||'<tr><td colspan="8" class="mut" style="text-align:center;padding:18px">Nothing in this period</td></tr>'}</tbody></table></div>`}
 else {body=`<div class="jwcos">${JW_CO.map(c=>{const M=T.filter(t=>t.co===c[0]),ppl=new Set(M.map(t=>t.acc)).size;return `<button class="card jwcoc" data-a="jwGoCo" data-k="${c[0]}" style="--cc:${c[2]}"><div class="row nw"><span class="jwdot" style="background:${c[2]}"></span><b>${c[1]}</b><span class="sp"></span><span class="xs mut">${ppl} customers</span></div>
  <div class="jwcog"><div><span>Added here</span><b style="color:#1F9D55">${inr(jwSum(M,t=>t.kind==='add'))}</b></div><div><span>Cashback</span><b style="color:#7A2E8E">${inr(jwSum(M,t=>t.kind==='cashback'))}</b></div><div><span>Spent here</span><b style="color:#C2410C">${inr(-jwSum(M,t=>t.amt<0))}</b></div><div><span>This month</span><b>${inr(jwSum(TM,t=>t.co===c[0]))}</b></div></div></button>`}).join('')}</div>
  <p class="xs mut" style="margin-top:8px">Money added in one company can be spent in any other company — the customer sees one JD Wallet balance everywhere. Click a company to see its history.</p>`}
 return head+hero+tabs+body+`<p class="xs mut" style="margin-top:10px">HR Consultancy offer: 100% cashback on money added in HR Consultancy, up to ₹10,000 per customer. Wallet money is not refundable in cash.</p>`};
A.jwTab=e=>{S.jwt=e.dataset.t;render()};A.jwP=e=>{S.jwp=e.dataset.t;render()};A.jwCoF=e=>{S.jwco=e.dataset.t;render()};A.jwK=e=>{S.jwk=e.dataset.t;render()};
A.jwGoCo=e=>{S.jwt='hist';S.jwco=e.dataset.k;S.jwp='all';render()};
document.addEventListener('input',e=>{if(e.target.id==='jwq'){S.jwq=e.target.value;const p=e.target.selectionStart;render();const i=document.getElementById('jwq');if(i){i.focus();i.setSelectionRange(p,p)}}});

/* ---------- one customer's wallet ---------- */
A.wOpen=e=>{const x=jwH(e.dataset.id);if(!x)return toast('Wallet not found');const M=jwTx().filter(t=>t.acc===x.id);let run=0;const L=M.slice().reverse().map(t=>({...t,bal:(run+=t.amt)})).reverse();
 const cos=JW_CO.map(c=>[c,jwSum(M,t=>t.co===c[0]&&t.amt>0),-jwSum(M,t=>t.co===c[0]&&t.amt<0)]).filter(r=>r[1]||r[2]);
 sheet(`<div class="jwcard sm"><div class="row nw"><b class="jwbrand">JD<span>Wallet</span></b><span class="sp"></span><code>${x.wid}</code></div><div class="jwlbl">${h(x.n)}${x.ph?' · '+h(x.ph):''}${x.city?' · '+h(x.city):''}</div><div class="jwbig">${inr(x.bal)}</div><div class="xs" style="opacity:.8">Usable in every JDAC company · opened via ${jwCo(x.home)[1]}</div></div>
 <div class="row" style="gap:8px;margin:12px 0"><button class="btn sm" data-a="wRc" data-id="${x.id}">${ic('plus')}Add money</button><button class="btn sm sec" data-a="jwPay" data-id="${x.id}">Pay from wallet</button><button class="btn sm sec" data-a="wAdj" data-id="${x.id}">Refund / adjust</button><button class="btn sm sec" data-a="wDl" data-id="${x.id}">${ic('dl')}Statement</button>${x.src==='hr'?`<button class="btn sm sec" data-a="hrBill" data-id="${x.id}">HR billing</button>`:''}</div>
 <div class="grid g2" style="gap:8px;margin-bottom:10px">${[['Added',jwSum(M,t=>t.kind==='add')],['Cashback',jwSum(M,t=>t.kind==='cashback')],['Spent',-jwSum(M,t=>t.amt<0)],['Refunds',jwSum(M,t=>t.kind==='refund')]].map(r=>`<div class="card" style="margin:0;padding:10px 12px"><div class="xs mut">${r[0]}</div><b>${inr(r[1])}</b></div>`).join('')}</div>
 ${cos.length?`<div class="card" style="margin:0 0 10px;padding:10px 12px"><div class="xs mut" style="margin-bottom:6px">Company-wise</div>${cos.map(r=>`<div class="row nw" style="padding:3px 0">${jwBadge(r[0][0])}<span class="sp"></span><span class="xs" style="color:#1F9D55">+${inr(r[1])}</span>&nbsp;&nbsp;<span class="xs" style="color:#C2410C">−${inr(r[2])}</span></div>`).join('')}</div>`:''}
 <div class="xsheet"><table><thead><tr><th>Date</th><th>Company</th><th>Particulars</th><th class="n">In</th><th class="n">Out</th><th class="n">Balance</th></tr></thead><tbody>${L.map(t=>`<tr><td>${fmt(t.d)}</td><td>${jwBadge(t.co)}</td><td>${h(t.t||(JW_KIND[t.kind]||[''])[0])}${t.mode?` <span class="xs mut">· ${h(t.mode)}${t.ref?' '+h(t.ref):''}</span>`:''}</td><td class="n" style="color:#1F9D55">${t.amt>0?inr(t.amt):''}</td><td class="n" style="color:#C2410C">${t.amt<0?inr(-t.amt):''}</td><td class="n">${inr(t.bal)}</td></tr>`).join('')||'<tr><td colspan="6" class="mut" style="text-align:center;padding:16px">No activity yet</td></tr>'}</tbody></table></div>`);
 const sh=document.querySelector('.sheet');if(sh&&sh.style)sh.style.maxWidth='880px'};

/* ---------- open a wallet ---------- */
A.jwNew=()=>sheet(`<h2>New JD Wallet</h2><p class="xs mut">One wallet per customer, found by mobile number. It works in every JDAC company.</p>
 <label for="jwn">Customer / business name</label><input id="jwn"><label for="jwph">Mobile number</label><input id="jwph" type="tel" inputmode="numeric" maxlength="10"><label for="jwc">City</label><input id="jwc">
 <label>Opened in</label>${opts('jwh',JW_CO.filter(c=>c[0]!=='hr').map(c=>[c[0],c[1]]),'log')}<p class="xs mut">HR Consultancy clients already have their wallet from the Clients list.</p>
 <button class="btn w" style="margin-top:14px" data-a="jwNewGo">Open wallet</button>`);
A.jwNewGo=()=>{const n=val('jwn').trim(),ph=val('jwph').replace(/\D/g,'');if(!n||ph.length!==10)return toast('Name and 10-digit mobile please');
 const ex=jwHolders().find(x=>(x.ph||'').replace(/\D/g,'').slice(-10)===ph);if(ex){closeM();toast('This mobile already has a JD Wallet');return A.wOpen({dataset:{id:ex.id}})}
 const a={id:'jw'+Date.now().toString(36),n,ph,city:val('jwc').trim(),home:pick1('jwh')||'log',since:TODAY};jwD().acc.push(a);save();jwUp('jdw_acc',a);closeM();render();A.wOpen({dataset:{id:a.id}});toast('Wallet opened · '+jwId(a))};

/* ---------- add money ---------- */
const jwSel=(id,cur)=>`<select id="${id}">${jwHolders().sort((a,b)=>a.n.localeCompare(b.n)).map(x=>`<option value="${x.id}" ${cur===x.id?'selected':''}>${h(x.n)} · ${x.wid} · ${inr(x.bal)}</option>`).join('')}</select>`;
A.wRc=e=>{const id=e&&e.dataset&&e.dataset.id,x=id&&jwH(id);sheet(`<h2>Add money to JD Wallet</h2><label for="wrc">Customer</label>${jwSel('wrc',id)}
 <label>Collected by</label>${opts('wrco',JW_CO.map(c=>[c[0],c[1]]),(x&&x.home)||'log')}
 <label for="wra">Amount received (₹)</label><input id="wra" type="number" inputmode="numeric" placeholder="e.g. 5000"><label>Paid by</label>${opts('wrm',[['UPI','UPI'],['Bank transfer','Bank transfer'],['Cheque','Cheque'],['Cash','Cash'],['Razorpay','Razorpay']],'UPI')}
 <label for="wrr">Reference / UTR (optional)</label><input id="wrr" placeholder="UTR, cheque no. …">
 <label for="wcba">Cashback (₹, optional)</label><input id="wcba" type="number" inputmode="numeric" placeholder="0"><p class="xs mut">For HR Consultancy, 100% cashback is added automatically (up to ₹10,000 per customer) — leave blank.</p>
 <button class="btn w" style="margin-top:14px" data-a="wRcGo">Add to wallet</button>`)};
A.wRcGo=()=>{const id=val('wrc'),x=jwH(id),a=Math.round(+val('wra')||0),co=pick1('wrco')||'log';if(!x||a<=0)return toast('Enter the amount');
 const mode=pick1('wrm')||'UPI',ref=val('wrr');let cb=Math.round(+val('wcba')||0);
 if(co==='hr'&&!cb){const had=jwSum(jwTx(),t=>t.acc===id&&t.kind==='cashback'&&t.co==='hr');cb=Math.max(0,Math.min(a,10000-had))}
 jwPost(id,{co,kind:'add',amt:a,t:'Money added · '+jwCo(co)[1],mode,ref});if(cb>0)jwPost(id,{co,kind:'cashback',amt:cb,t:(co==='hr'?'100% cashback (HR offer)':'Cashback')});
 closeM();render();toast(`${inr(a)} added${cb?' + '+inr(cb)+' cashback':''} · balance ${inr(jwH(id).bal)}`)};

/* ---------- pay from wallet (any company) ---------- */
A.jwPay=e=>{const id=e&&e.dataset&&e.dataset.id,x=id&&jwH(id);sheet(`<h2>Pay from JD Wallet</h2><label for="jpc">Customer</label>${jwSel('jpc',id)}
 <label>Paid to</label>${opts('jpco',JW_CO.map(c=>[c[0],c[1]]),(x&&x.home)||'log')}<label for="jpa">Amount (₹)</label><input id="jpa" type="number" inputmode="numeric"><label for="jpt">For</label><input id="jpt" placeholder="e.g. AWB 12345 freight, GB order #88, hiring fee">
 <button class="btn w" style="margin-top:14px" data-a="jwPayGo">Pay</button>`)};
A.jwPayGo=()=>{const id=val('jpc'),x=jwH(id),a=Math.round(+val('jpa')||0),co=pick1('jpco')||'log',t=val('jpt').trim();if(!x||a<=0||!t)return toast('Amount and purpose please');
 if(a>x.bal)return toast(`Only ${inr(x.bal)} in wallet`);jwPost(id,{co,kind:'pay',amt:-a,t:t+' · '+jwCo(co)[1]});closeM();render();toast(`${inr(a)} paid · balance ${inr(jwH(id).bal)}`)};

/* ---------- refund / adjust ---------- */
A.wAdj=e=>{const x=jwH(e.dataset.id);sheet(`<h2>Refund / adjust · ${h(x.n)}</h2><p class="xs mut">Balance now ${inr(x.bal)}.</p>${opts('wjt',[['refund','Refund into wallet'],['credit','Add (correction)'],['debit','Take out (correction)']],'refund')}
 <label>Company</label>${opts('wjco',JW_CO.map(c=>[c[0],c[1]]),x.home)}<label for="wja">Amount (₹)</label><input id="wja" type="number" inputmode="numeric"><label for="wjr">Reason</label><input id="wjr">
 <button class="btn w" style="margin-top:14px" data-a="wAdjGo" data-id="${x.id}">Save</button>`)};
A.wAdjGo=e=>{const id=e.dataset.id,a=Math.round(+val('wja')||0),r=val('wjr').trim(),ty=pick1('wjt'),co=pick1('wjco')||'log';if(a<=0||!r)return toast('Amount and reason please');
 jwPost(id,{co,kind:ty==='refund'?'refund':'adjust',amt:ty==='debit'?-a:a,t:r});closeM();render();toast('Saved · balance '+inr(jwH(id).bal))};

/* ---------- downloads ---------- */
const jwRows=L=>{const HN=Object.fromEntries(jwHolders().map(x=>[x.id,x]));return [['Date','Customer','Wallet ID','Mobile','Company','Type','Particulars','Mode','Reference','In','Out'],...L.map(t=>{const x=HN[t.acc]||{};return [t.d,x.n||'',x.wid||'',x.ph||'',jwCo(t.co)[1],(JW_KIND[t.kind]||[''])[0],t.t||'',t.mode||'',t.ref||'',t.amt>0?t.amt:'',t.amt<0?-t.amt:'']})]};
A.wDl=async e=>{const id=e&&e.dataset&&e.dataset.id,L=jwTx().filter(t=>!id||t.acc===id).reverse();await saveFile('JD_Wallet_'+(id?(jwH(id).n||'').replace(/\W+/g,'_'):'all')+'_'+TODAY+'.csv',csv(jwRows(L)))};
A.jwCsv=async()=>{const co=S.jwco||'all',ty=S.jwk||'all',pr=S.jwp||'month';await saveFile('JD_Wallet_history_'+TODAY+'.csv',csv(jwRows(jwTx().filter(t=>(co==='all'||t.co===co)&&(ty==='all'||t.kind===ty)&&jwPer(pr)(t)).reverse())))};

/* sidebar label */
const _tabsJW=tabsFor;tabsFor=function(who){return _tabsJW(who).map(x=>x[0]==='wallet'?[x[0],'JD Wallet',x[2]]:x)};

document.head.insertAdjacentHTML('beforeend',`<style>
.jwhero{display:grid;grid-template-columns:minmax(300px,1.1fr) 1.4fr;gap:14px;margin:4px 0 14px}@media(max-width:900px){.jwhero{grid-template-columns:1fr}}
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

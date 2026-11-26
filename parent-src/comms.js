/* ===================== COMMUNICATION = CRM communication, company-wise =====================
   Top bar:  [Company ▸ Logistics | GovaaBazaar | Jupiter | HR | Studios]   CRM · WhatsApp · Calls   |   Personal: Email · Chat
   • CRM, WhatsApp and Calls follow the company you pick (each company has its own number). Shared inbox: everyone in the
     company sees every customer and who replied last.  • Email and Chat are personal (your own mailbox, internal groups).
   • Staff land on their own company (Neetu → Logistics). Google Meet / notetaker tab removed from here. */
const CM_CO=[['log','JDAC Logistics',['cse','ops'],'Logistics','#02496A'],['gb','GovaaBazaar',['gb'],'GovaaBazaar','#7a4a26'],['jup','Jupiter Pune',['jup'],'Jupiter','#139B5F'],['hr','HR Consultancy',['hr'],'HR','#7A2E8E'],['studios','JDAC Studios',[],'Studios','#0796A6']];
const cmInfo=k=>k==='all'?['all','All companies',CM_CO.flatMap(x=>x[2]),'All','#24408E']:(CM_CO.find(x=>x[0]===k)||CM_CO[0]);
const cmCos=()=>isAdm()?['all',...CM_CO.map(x=>x[0])]:[TEAMCO[(P[S.me]||{}).team]||'log',...cmExtraCos()].filter((k,i,A)=>CM_CO.some(x=>x[0]===k)&&A.indexOf(k)===i);
const cmCo=()=>{const L=cmCos();if(!L.includes(S.cmco))S.cmco=L[0]||'log';return S.cmco};
const cmTeams=co=>cmInfo(co)[2];
const cmNum=co=>D.comNums[co]||{};
const coOfTeam=t=>(CM_CO.find(x=>x[2].includes(t))||CM_CO[0]);
/* WhatsApp inbox shows only the chosen company's number(s) */
const _myWaCM=myWaTeams;myWaTeams=function(){const T=_myWaCM();return S.v==='chat'?T.filter(t=>cmTeams(cmCo()).includes(t)):T};

/* stages → CRM columns (Superfone flow) */
const CM_COL=[['new','New lead',['Open'],'#2F6BE0'],['con','Contacted',['Contacted'],'#0B6E8A'],['quo','Quotation & chase',['Quotation sent','Q Chase 1','Q Chase 2'],'#B8860B'],
 ['pick','Booking · pickup',['Pickup'],'#7A2E8E'],['pay','Payment',['Payment pending','Payment paid'],'#E8772E'],['done','Delivered / closed',['Delivered','Closed'],'#1F9D55'],['lost','Lost / irrelevant',['LSRATE','LSUN'],'#C0392B']];
const cmColOf=c=>(CM_COL.find(x=>x[2].includes(c.stg))||CM_COL[0])[0];

/* ================= ONE CRM: Board · Inbox · Calls are three views of the SAME customers =================
   Universal search (name, number, any word ever said in a chat, notes, tags, call log) · customer panel opens on the
   same page with summary, WhatsApp chat, full timeline (messages + calls + changes) and details. Email/Team chat personal. */
const cmWA=()=>D.wa.filter(c=>myWaTeams().includes(c.team));
const telN=s=>String(s||'').replace(/\D/g,'').slice(-10);
const cmCallsOf=c=>D.callLog.filter(x=>telN(x.ph)===telN(c.ph));
chatHead=function(){if(S.chm==='wa'){S.chm='crm';S.cmv='inbox'}if(S.chm==='call'){S.chm='crm';S.cmv='calls'}
 const m=S.chm,co=cmCo(),cos=cmCos(),G=myGroups(),unT=G.reduce((a,g)=>a+unreadG(g),0),inf=cmInfo(co),T=myWaTeams();
 const n=cmNum(co),nums=co==='all'?CM_CO.map(x=>[x[3],cmNum(x[0])]).filter(x=>x[1].wa||x[1].vn):[];
 const pers=(k,l,i,c)=>`<button class="cpb ${m===k?'on':''}" data-a="chm" data-t="${k}" title="${l}">${ic(i)}<span>${l}</span>${c?`<em>${c}</em>`:''}</button>`;
 const crmOn=m==='crm';
 return `<div class="cmh2"><div class="cmh2-l">
   <div class="ccsel ${crmOn?'':'dim'}" style="--cc:${inf[4]}"><i></i><div><small>Company CRM</small>${cos.length>1?`<select data-ch="cmCoSel" aria-label="Company">${cos.map(k=>`<option value="${k}" ${co===k?'selected':''}>${h(cmInfo(k)[1])}</option>`).join('')}</select>`:`<b>${h(inf[1])}</b>`}</div></div>
   <div class="cnum2" title="WhatsApp and calls for this company go out from this number">${ic('phone')}<div><small>${co==='all'?'Company numbers':'WhatsApp &amp; calling number'}</small><b>${co==='all'?(nums.length?nums.map(x=>h(x[0])+' '+h(x[1].wa||x[1].vn)).join(' · '):'none added yet'):(n.wa||n.vn?h(n.wa||n.vn):'<span class="mut">to be added</span>')}</b></div>${isAdm()?`<button class="lnk xs" data-a="cmNums">Edit</button>`:''}</div>
   <div class="usq ${S.cmq?'on':''}">${sfi('search',17)}<label class="sr" for="cmq">Search customers</label><input id="cmq" value="${h(S.cmq||'')}" placeholder="Search any customer: name, number, or anything said in chat (e.g. Shimla)" autocomplete="off">${S.cmq?`<button class="ib" data-a="cmQx" aria-label="Clear search">✕</button>`:''}</div></div>
  <div class="cmh2-r"><button class="cpb ${crmOn?'on':''}" data-a="chm" data-t="crm">${ic('users')}<span>CRM</span>${T.length&&cmWA().filter(c=>c.unread).length?`<em>${cmWA().filter(c=>c.unread).length}</em>`:''}</button><span class="cpl">Personal</span>${pers('email','Email','mail',0)}${pers('team','Team chat','chat',unT)}</div></div>`};
document.addEventListener('change',e=>{const d=e.target&&e.target.dataset;if(d&&d.ch==='cmCoSel'){A.cmCo({dataset:{k:e.target.value}})}});
A.cmCo=e=>{S.cmco=e.dataset.k;S.wat='';S.wac=null;S.cmd=null;S.cco=e.dataset.k==='all'?'log':e.dataset.k;S.chm='crm';render()};
A.cmQx=()=>{S.cmq='';render()};
A.cmNums=()=>sheet(`<h2>Company numbers</h2><p class="mut sm">One number per company for WhatsApp Business and for calls. Customers only ever see this number, never staff's personal numbers.</p><div class="xsheet"><table><thead><tr><th>Company</th><th>Calling number</th><th>WhatsApp number</th></tr></thead><tbody>${CM_CO.map(x=>{const v=cmNum(x[0]);return `<tr><td><b>${h(x[1])}</b></td><td><input value="${h(v.vn||'')}" data-ch="cnum" data-k="${x[0]}" data-f="vn" placeholder="+91 …" style="min-height:36px"></td><td><input value="${h(v.wa||'')}" data-ch="cnum" data-k="${x[0]}" data-f="wa" placeholder="+91 …" style="min-height:36px"></td></tr>`}).join('')}</tbody></table></div><button class="btn w" style="margin-top:12px" data-a="cmNumsDone">Done</button>`);
A.cmNumsDone=()=>{closeM();render()};

/* ---------- universal search ---------- */
const hiQ=(t,q)=>{const s=String(t||''),i=s.toLowerCase().indexOf(q);if(i<0)return h(s.slice(0,90));const a=Math.max(0,i-40);return (a?'…':'')+h(s.slice(a,i))+'<mark>'+h(s.slice(i,i+q.length))+'</mark>'+h(s.slice(i+q.length,i+q.length+60))+'…'};
function cmSearch(q){q=q.toLowerCase().trim();const qd=q.replace(/\D/g,'');const R=[];
 cmWA().forEach(c=>{const hits=[];
  if(c.n.toLowerCase().includes(q))hits.push(['Name',h(c.n)]);
  if(qd.length>=3&&telN(c.ph).includes(qd))hits.push(['Number','+91 '+h(c.ph)]);
  (c.tags||[]).forEach(t=>{if(t.toLowerCase().includes(q))hits.push(['Tag',h(t)])});
  if((c.info||'').toLowerCase().includes(q))hits.push(['Info',hiQ(c.info,q)]);
  c.ms.forEach(m=>{if((m.t||'').toLowerCase().includes(q))hits.push([m.f==='note'?'Note · '+nmF(m.by):m.f==='c'?'Customer said':nmF(m.f)+' said',hiQ(m.t,q)+(m.at?` <span class="mut">· ${m.at}</span>`:'')])});
  cmCallsOf(c).forEach(x=>{if((x.note||'').toLowerCase().includes(q))hits.push(['Call note',hiQ(x.note,q)])});
  if(hits.length)R.push({c,hits})});
 return R.sort((a,b)=>b.hits.length-a.hits.length)}
function searchView(){const q=S.cmq.trim(),R=q.length<2?[]:cmSearch(q);
 return `<div class="cmsr"><div class="cmsrh"><b>${q.length<2?'Type at least 2 letters':R.length+' customer'+(R.length===1?'':'s')+' found'}</b><span class="xs mut">for “${h(q)}” in ${h(cmInfo(cmCo())[1])} · names, numbers, tags, every WhatsApp message and note</span></div>
 ${R.map(({c,hits})=>{const ci=coOfTeam(c.team);return `<button class="cmsri" data-a="cmOpen" data-id="${c.id}" data-tab="${hits.some(x=>/said|Note/.test(x[0]))?'chat':'sum'}"><span class="sfav">${sfIni(c.n)}</span><div class="cmsrb"><div class="row nw" style="gap:8px"><b>${h(c.n)}</b><span class="xs mut">+91 ${h(c.ph)}</span><span class="cmco" style="--cc:${ci[4]};margin:0">${h(ci[3])}</span><span class="stgp">${h(c.stg)}</span>${c.to?`<span class="xs mut">· ${h(nmF(c.to))}</span>`:''}</div>${hits.slice(0,3).map(x=>`<div class="cmhit"><span>${x[0]}</span>${x[1]}</div>`).join('')}${hits.length>3?`<div class="xs mut">+${hits.length-3} more matches</div>`:''}</div></button>`}).join('')||(q.length>=2?empty('No customer found','Try another word, part of the number, or switch Company to All companies'):'')}</div>`}

/* ---------- views ---------- */
const cmFilt=L=>{const who=S.cmw||'all',F={new:c=>cmColOf(c)==='new',wait:c=>waLast(c).f==='c'&&!['done','lost'].includes(cmColOf(c)),un:c=>!c.to,pay:c=>c.stg==='Payment pending',pick:c=>cmColOf(c)==='pick'}[S.cmf];
 L=L.filter(c=>who==='all'?true:who==='un'?!c.to:c.to===who);return F?L.filter(F):L};
function cmKpi(all){const k=(v,l,c,f)=>`<button class="ck ${c} ${S.cmf===f?'on':''}" data-a="cmF" data-f="${f}"><b>${v}</b><span>${l}</span></button>`;
 return `<div class="ckpi">${k(all.filter(c=>cmColOf(c)==='new').length,'New leads','b','new')}${k(all.filter(c=>waLast(c).f==='c'&&!['done','lost'].includes(cmColOf(c))).length,'Waiting for our reply','o','wait')}${k(all.filter(c=>!c.to).length,'Not assigned','r','un')}${k(all.filter(c=>c.stg==='Payment pending').length,'Payment pending','p','pay')}${k(all.filter(c=>cmColOf(c)==='pick').length,'Booked · pickup','g','pick')}</div>`}
function cmTools(all,extra){const who=S.cmw||'all',own=[...new Set(all.map(c=>c.to).filter(Boolean))],v=S.cmv||'board';
 return `<div class="cmbar"><div class="cseg" role="tablist">${[['board','Board','t_kan'],['inbox','Inbox','chat'],['calls','Calls','phone']].map(([k,l,i])=>`<button class="${v===k?'on':''}" data-a="cmV" data-t="${k}" role="tab" aria-selected="${v===k}">${ic(i)}<span>${l}</span></button>`).join('')}</div>
  ${v!=='calls'?`<select class="t4sel" data-ch="cmw" aria-label="Lead owner"><option value="all">Everyone's customers</option><option value="un" ${who==='un'?'selected':''}>Not assigned</option>${own.map(x=>`<option value="${x}" ${who===x?'selected':''}>${h(nmF(x))}</option>`).join('')}</select>`:''}
  ${S.cmf&&v!=='calls'?`<button class="tclr" data-a="cmF" data-f="${S.cmf}">✕ Clear filter</button>`:''}<span class="sp"></span>${extra||''}<button class="btn sm" data-a="waNew">${ic('plus')}New customer</button></div>`}
const cmCard=c=>{const l=waLast(c),by=l.f&&l.f!=='c'?nmF(l.f).split(' ')[0]:'Customer',ci=coOfTeam(c.team);
 return `<div class="cmc ${c.unread?'un':''} ${S.cmd===c.id?'sel':''}" draggable="true" data-cid="${c.id}"><button class="cmt" data-a="cmOpen" data-id="${c.id}"><span class="sfav ${c.unread?'ring':''}">${sfIni(c.n)}</span><span class="cmn"><b>${h(c.n)}</b><small>+91 ${h(c.ph)}</small></span>${c.unread?`<span class="cmu">${c.unread}</span>`:''}</button>
  ${cmCo()==='all'?`<span class="cmco" style="--cc:${ci[4]}">${h(ci[3])}</span>`:''}<div class="cml"><b>${h(by)}:</b> ${h((l.t||'').slice(0,70))}<span>${waTime(c)} · ${h(c.stg)}</span></div>
  <div class="cmf">${c.to?`<span class="cmo">${av(nm(c.to),'s')}${h(nmF(c.to).split(' ')[0])}</span>`:'<span class="cmo none">Not assigned</span>'}<span class="sp"></span><button class="cmb wa" data-a="cmOpen" data-id="${c.id}" data-tab="chat" title="WhatsApp chat">${ic('chat')}</button><button class="cmb call" data-a="cmCall" data-id="${c.id}" title="Call from company number">${ic('phone')}</button></div></div>`};
function boardView(L){return `<div class="cmboard">${CM_COL.map(([k,l,,col])=>{const C=L.filter(c=>cmColOf(c)===k).sort((a,b)=>(b.at>a.at?1:b.at<a.at?-1:(waLast(b).at||'').localeCompare(waLast(a).at||'')));
 return `<div class="cmcol" style="--c:${col}" data-col="${k}"><div class="cmh"><i></i><b>${l}</b><span>${C.length}</span></div>${C.map(cmCard).join('')||'<div class="cmdrop">Drop here</div>'}</div>`}).join('')}</div>`}
function inboxView(L){L=L.slice().sort((a,b)=>(b.at>a.at?1:b.at<a.at?-1:(waLast(b).at||'').localeCompare(waLast(a).at||'')));
 return `<div class="cmin">${L.map(c=>{const l=waLast(c),me=l.f&&l.f!=='c',ci=coOfTeam(c.team);return `<button class="cmir ${S.cmd===c.id?'on':''} ${c.unread?'un':''}" data-a="cmOpen" data-id="${c.id}" data-tab="chat"><span class="sfav ${c.unread?'ring':''}">${sfIni(c.n)}</span><div class="cmib"><div class="cmit"><b>${h(c.n)}</b><span>${waTime(c)}</span></div><div class="cmim">${me?`<em>${h(nmF(l.f).split(' ')[0])}:</em> `:''}${h((l.t||'').slice(0,80))}</div><div class="cmitg"><span class="stgp" style="--c:${(CM_COL.find(x=>x[0]===cmColOf(c))||[])[3]}">${h(c.stg)}</span>${cmCo()==='all'?`<span class="cmco" style="--cc:${ci[4]};margin:0">${h(ci[3])}</span>`:''}${c.to?`<span class="xs mut">${h(nmF(c.to).split(' ')[0])}</span>`:'<span class="xs" style="color:#C0392B">Not assigned</span>'}</div></div>${c.unread?`<span class="cmu">${c.unread}</span>`:''}</button>`}).join('')||empty('No customers here')}</div>`}
const durS=d=>{const m=String(d||'').match(/^(\d+):(\d+)$/);return m?+m[1]*60+ +m[2]:0};
const durT=s=>s>=3600?Math.floor(s/3600)+'h '+Math.floor(s%3600/60)+'m':Math.floor(s/60)+'m '+(s%60)+'s';
function callsView2(){const co=cmCo(),r=S.cmcr||'today',from={today:TODAY,yest:addD(TODAY,-1),'7d':addD(TODAY,-6),'30d':addD(TODAY,-29)}[r],to=r==='yest'?addD(TODAY,-1):TODAY;
 const all=D.callLog.filter(x=>co==='all'||x.co===co).filter(x=>isAdm()||x.k===S.me),L=all.filter(x=>(x.d||TODAY)>=from&&(x.d||TODAY)<=to).slice().sort((a,b)=>(b.d||'').localeCompare(a.d||'')||(b.at||'').localeCompare(a.at||''));
 const out=L.filter(x=>x.dir==='out'),inn=L.filter(x=>x.dir==='in'),miss=L.filter(x=>x.st==='Missed'),con=L.filter(x=>x.st==='Connected'),talk=L.reduce((a,x)=>a+durS(x.dur),0);
 const k=(v,l,c)=>`<div class="ck ${c}" style="cursor:default"><b>${v}</b><span>${l}</span></div>`;
 const custOf=x=>cmWA().find(c=>telN(c.ph)===telN(x.ph));
 const people=[...new Set(L.map(x=>x.k))];
 return `<div class="cmcr">${chips([['today','Today'],['yest','Yesterday'],['7d','Last 7 days'],['30d','Last 30 days']],r,'cmCr')}<span class="sp"></span><div class="cdial"><input id="cmdial" inputmode="tel" placeholder="Dial a number"><button class="btn sm" style="background:#1F9D55;border-color:#1F9D55" data-a="cmDial">${ic('phone')}Call</button></div></div>
 <div class="ckpi">${k(L.length,'Total calls','b')}${k(out.length,'Outgoing','g')}${k(inn.length,'Incoming','p')}${k(miss.length,'Missed','r')}${k(durT(talk),'Talk time','o')}</div>
 ${isAdm()&&people.length?`<div class="cmppl">${people.map(p=>{const P2=L.filter(x=>x.k===p);return `<div class="cmpp">${av(nm(p),'s')}<b>${h(nmF(p).split(' ')[0])}</b><span>${P2.length} calls · ${P2.filter(x=>x.st==='Connected').length} connected · ${durT(P2.reduce((a,x)=>a+durS(x.dur),0))}</span></div>`}).join('')}</div>`:''}
 <div class="xsheet cmct"><table><thead><tr><th>When</th><th>Customer</th><th>Number</th><th></th><th>Staff</th><th>Company</th><th>Duration</th><th>Status</th><th>Recording</th><th></th></tr></thead><tbody>${L.map(x=>{const c=custOf(x);return `<tr><td>${x.d===TODAY?'Today':x.d===addD(TODAY,-1)?'Yesterday':fmt(x.d||TODAY)} ${h(x.at||'')}</td><td>${c?`<button class="lnk" data-a="cmOpen" data-id="${c.id}" data-tab="time">${h(c.n)}</button>`:h(x.to||'')}</td><td>+91 ${h(x.ph||'')}</td><td><span class="cdir ${x.st==='Missed'?'miss':x.dir}">${x.dir==='in'?'↙ In':'↗ Out'}</span></td><td>${h(P[x.k]?nmF(x.k):(x.k||''))}</td><td>${h(cmInfo(x.co||'log')[3])}</td><td>${h(x.dur||'—')}</td><td><span class="stgp" style="--c:${x.st==='Missed'?'#C0392B':x.st==='Connected'?'#1F9D55':'#B8860B'}">${h(x.st||'')}</span></td>
  <td>${x.rec?`<audio controls src="${h(x.rec)}" style="height:30px"></audio> <a class="lnk" href="${h(x.rec)}" download>Download</a>`:`<span class="xs mut" title="Recordings start once the calling service is connected">${x.st==='Connected'?'After calling goes live':'—'}</span>`}</td><td><button class="cmb call" data-a="cmCallNo" data-ph="${h(x.ph)}" data-co="${x.co}" title="Call back">${ic('phone')}</button></td></tr>`}).join('')||`<tr><td colspan="10" style="text-align:center;padding:26px" class="mut">No calls in this period</td></tr>`}</tbody></table></div>
 <p class="xs mut">Calls are made from the company number. Every call, its duration and its recording (once the calling service is connected) show here and on the customer's timeline.</p>`}

/* ---------- customer panel (same page) ---------- */
function cmSummary(c){const calls=cmCallsOf(c),quote=[...c.ms].reverse().map(m=>(m.t||'').match(/₹\s?[\d,]+(?:\.\d+)?/)).find(Boolean),lc=waLastC(c),l=waLast(c),open=(D.tasks||[]).filter(t=>t.wa===c.id&&t.st!=='Done');
 const wait=l.f==='c'&&!['done','lost'].includes(cmColOf(c));
 const lines=[['First contact',`${fmt(c.created||c.at)} · ${h(c.src||'WhatsApp')}`],['Talking about',h((c.info||(c.ms.find(m=>m.f==='c')||{}).t||'—').slice(0,110))],['Last quote',quote?h(quote[0]):'<span class="mut">none yet</span>'],
  ['Last message',l.t?`${l.f==='c'?'Customer':h(nmF(l.f))} · ${waTime(c)}`:'—'],['Calls',calls.length?`${calls.length} · last ${h(calls[calls.length-1].st)} ${calls[calls.length-1].d===TODAY?'today':fmt(calls[calls.length-1].d||TODAY)}`:'<span class="mut">no calls yet</span>'],
  ['Next step',wait?'<b style="color:#E8772E">Reply to the customer</b>':c.stg==='Payment pending'?'<b style="color:#7A2E8E">Collect payment</b>':c.next?'Follow up '+fmt(c.next):open.length?h(open[0].t):cmColOf(c)==='done'?'Done':'Follow up']];
 return `<div class="cmsum">${lines.map(x=>`<div><span>${x[0]}</span><div>${x[1]}</div></div>`).join('')}</div>`}
function cmTimeline(c){const E=[];c.ms.forEach(m=>E.push({d:c.at,tm:m.at||'',k:m.f==='note'?'note':'wa',who:m.f==='c'?'Customer':m.f==='note'?nmF(m.by):nmF(m.f),t:m.t||(m.kind?'📎 '+m.kind:'')}));
 cmCallsOf(c).forEach(x=>E.push({d:x.d||TODAY,tm:x.at||'',k:'call',who:P[x.k]?nmF(x.k):'',t:`${x.dir==='in'?'Incoming':'Outgoing'} call · ${x.st}${x.dur&&x.dur!=='—'?' · '+x.dur:''}`,rec:x.rec}));
 (c.log||[]).forEach(x=>E.push({d:x.at,tm:x.tm||'',k:'log',who:x.by?nmF(x.by):'',t:x.t}));
 E.sort((a,b)=>(b.d||'').localeCompare(a.d||'')||(b.tm||'').localeCompare(a.tm||''));let last='';
 return `<div class="cmtl">${E.map(e=>{const day=e.d===TODAY?'Today':e.d===addD(TODAY,-1)?'Yesterday':fmt(e.d);const sep=day!==last?`<div class="cmtd">${day}</div>`:'';last=day;
  return sep+`<div class="cmte ${e.k}"><i>${{wa:'💬',note:'📝',call:'📞',log:'•'}[e.k]}</i><div><b>${h(e.who||'')}</b> <span class="xs mut">${h(e.tm)}</span><div>${h(e.t)}</div>${e.k==='call'?(e.rec?`<audio controls src="${h(e.rec)}" style="height:30px;margin-top:4px"></audio>`:'<div class="xs mut">Recording: after calling goes live</div>'):''}</div></div>`}).join('')||'<div class="xs mut">No history yet</div>'}</div>`}
function cmDrawer(c){const ci=coOfTeam(c.team),own=STAFF.filter(k=>isAdm()?!isZen(k):(P[k]||{}).team===(P[S.me]||{}).team),tab=S.cmtab||'sum',n=cmNum(WACO[c.team]||'log');
 const tabs=[['sum','Summary'],['chat','WhatsApp'],['time','Timeline'],['info','Details']];
 let body='';
 if(tab==='sum')body=cmSummary(c)+`<div class="cmdl">Latest messages</div><div class="cmdm">${c.ms.filter(m=>m.f!=='note').slice(-3).map(m=>`<div class="cmbb ${m.f!=='c'?'me':''}">${m.f!=='c'?`<b>${h(nmF(m.f).split(' ')[0])}</b>`:''}${h(m.t||'')}<span>${m.at||''}</span></div>`).join('')||'<div class="xs mut">No messages yet</div>'}</div><button class="lnk" style="margin-top:6px" data-a="cmTab" data-t="chat">Open the full WhatsApp chat →</button>`;
 if(tab==='chat'){const w=waWin(c);body=`<div class="cmdm big" id="cmthr"><div class="dsep">${c.at===TODAY?'Today':fmt(c.at)}</div>${c.ms.map(m=>m.f==='note'?`<div class="wnote"><b>Internal note · ${h(nmF(m.by))}</b>${h(m.t)}<span>${m.at}</span></div>`:`<div class="cmbb ${m.f!=='c'?'me':''}">${m.f!=='c'?`<b>${h(nmF(m.f).split(' ')[0])}</b>`:''}${h(m.t||'')}<span>${m.at||''}</span></div>`).join('')}</div>
  <div class="cmwin ${w?'':'off'}">${w?`Reply window open · ${w}h left`:'24-hour window closed · start with a template'}</div>
  <div class="cmdr2 ${S.waNote?'note':''}"><textarea id="msg" rows="2" placeholder="${S.waNote?'Internal note (customer does not see this)…':'Reply on WhatsApp from '+h(n.n||'company number')+'…'}"></textarea><div class="row nw" style="gap:6px"><button class="ib" data-a="tplOpen" title="Quick replies">${sfi('bolt',18)}</button><button class="tclr ${S.waNote?'on':''}" data-a="cmNoteT">${S.waNote?'Note ✓':'Note'}</button><span class="sp"></span><button class="btn sm" data-a="cmSend" data-id="${c.id}">Send</button></div></div>`}
 if(tab==='time')body=cmTimeline(c);
 if(tab==='info')body=`<div class="cmsum">${[['Name',h(c.n)],['Mobile','+91 '+h(c.ph)],['Company',h(ci[1])],['Number used',h(n.wa||n.vn||'to be added')],['Source',h(c.src||'WhatsApp')],['Customer since',fmt(c.created||c.at)],['Info',h(c.info||'—')]].map(x=>`<div><span>${x[0]}</span><div>${x[1]}</div></div>`).join('')}</div><div class="cmdl">Tags</div><div class="sftg">${(c.tags||[]).map(waTag).join('')}<button class="sfmt" data-a="waTags" data-id="${c.id}">${sfi('tag',13)}Manage tags</button></div>`;
 return `<aside class="cmd" aria-label="Customer"><div class="cmdh"><span class="sfav big">${sfIni(c.n)}</span><div style="flex:1;min-width:0"><b>${h(c.n)}</b><div class="xs mut">+91 ${h(c.ph)} · <span style="color:${ci[4]};font-weight:700">${h(ci[1])}</span></div></div><button class="ib" data-a="cmX" aria-label="Close">✕</button></div>
  <div class="cmda"><button class="btn sm" style="background:#1F9D55;border-color:#1F9D55" data-a="cmCall" data-id="${c.id}">${ic('phone')}Call</button><button class="btn sm sec" data-a="cmTab" data-t="chat">${ic('chat')}WhatsApp</button></div>
  <div class="cmdg"><label>Stage<select data-ch="cmStg" data-id="${c.id}">${WASTG.map(s=>`<option ${c.stg===s?'selected':''}>${s}</option>`).join('')}</select></label>
   <label>Owner<select data-ch="waTo" data-id="${c.id}"><option value="">Not assigned</option>${own.map(k=>`<option value="${k}" ${c.to===k?'selected':''}>${h(nmF(k))}</option>`).join('')}</select></label></div>
  <div class="cmdt" role="tablist">${tabs.map(([k,l])=>`<button class="${tab===k?'on':''}" data-a="cmTab" data-t="${k}">${l}</button>`).join('')}</div>${body}</aside>`}
function crmView(){const T=myWaTeams(),v=S.cmv||'board';
 if(S.cmq)return searchView()+(()=>{const d=S.cmd&&D.wa.find(x=>x.id===S.cmd&&T.includes(x.team));return d?`<div class="cmover">${cmDrawer(d)}</div>`:''})();
 if(v==='calls')return cmTools(cmWA())+callsView2()+(()=>{const d=S.cmd&&D.wa.find(x=>x.id===S.cmd);return d?`<div class="cmover">${cmDrawer(d)}</div>`:''})();
 if(!T.length)return cmTools([])+`<div class="list">${empty('No customer inbox for this company yet','Customers show here once this company has its WhatsApp number')}</div>`;
 const all=cmWA(),L=cmFilt(all);const d=S.cmd&&D.wa.find(x=>x.id===S.cmd&&T.includes(x.team));if(!d)S.cmd=null;
 return cmTools(all,v==='board'?'<span class="xs mut hide-m">Drag a card to change its stage</span>':'')+`<div class="cmlay ${d?'open':''} ${v}">${v==='board'?boardView(L):inboxView(L)}${d?cmDrawer(d):''}</div>`}

A.cmV=e=>{S.cmv=e.dataset.t;render()};
A.cmCr=e=>{S.cmcr=e.dataset.t;render()};
A.cmOpen=e=>{const id=e.dataset.id;S.cmtab=e.dataset.tab||(S.cmd===id?S.cmtab:'sum');S.cmd=id;const c=D.wa.find(x=>x.id===id);if(c)c.unread=0;save();render();cmScroll()};
const cmScroll=()=>setTimeout(()=>{const t=document.getElementById('cmthr');if(t)t.scrollTop=t.scrollHeight},20);
A.cmTab=e=>{S.cmtab=e.dataset.t;render();cmScroll()};
A.cmX=()=>{S.cmd=null;render()};
A.cmChat=e=>A.cmOpen({dataset:{id:e.dataset.id,tab:'chat'}});
A.cmF=e=>{S.cmf=S.cmf===e.dataset.f?null:e.dataset.f;render()};
A.cmNoteT=()=>{S.waNote=!S.waNote;render();cmScroll()};
A.cmSend=e=>{const c=D.wa.find(x=>x.id===(e&&e.dataset&&e.dataset.id||S.cmd));const t=val('msg');if(!c||!t)return;
 if(S.waNote)c.ms.push({f:'note',by:S.me,t,at:nowT()});else{c.ms.push({f:S.me,t,at:nowT()});if(!c.to)c.to=S.me;c.at=TODAY;if(c.stg==='Open'){c.stg='Contacted';waLog(c,'Stage → Contacted')}}
 save();render();cmScroll();if(!S.waNote)toast('Sent on WhatsApp'+((cmNum(WACO[c.team])||{}).wa?'':' · goes out once the WhatsApp API is connected'))};
const cmDoCall=(co,to,ph,c)=>{const n=cmNum(co);D.callLog.push({id:nid('cl'),k:S.me,co,to,ph,dir:'out',at:nowT(),d:TODAY,dur:'—',st:'Calling'});if(c)waLog(c,'Call to customer from '+(n.n||'company number'));save();render();
 toast(`Calling ${to} from ${n.n||'company'}${n.vn?' ('+n.vn+')':''} — the call connects once the calling service is linked`)};
A.cmCall=e=>{const c=D.wa.find(x=>x.id===e.dataset.id);if(c)cmDoCall(WACO[c.team]||'log',c.n,c.ph,c)};
A.cmCallNo=e=>{const c=cmWA().find(x=>telN(x.ph)===telN(e.dataset.ph));cmDoCall(e.dataset.co||'log',c?c.n:e.dataset.ph,e.dataset.ph,c)};
A.cmDial=()=>{const p=val('cmdial');if(telN(p).length<10)return toast('Enter a 10-digit number');const c=cmWA().find(x=>telN(x.ph)===telN(p)),co=cmCo()==='all'?'log':cmCo();cmDoCall(co,c?c.n:p,p,c)};
const cmSetStg=(c,s)=>{if(!c||c.stg===s)return;c.stg=s;waLog(c,'Stage → '+s);save();render();toast(`${c.n} → ${s}`)};
/* a new chat started from "New customer" opens in the panel */
const _waNewGoCM=A.waNewGo;A.waNewGo=()=>{_waNewGoCM();if(S.v==='chat'&&S.wac){S.cmd=S.wac;S.cmtab='chat';render();cmScroll()}};
document.addEventListener('change',e=>{const d=e.target&&e.target.dataset;if(!d)return;if(d.ch==='cmw'){S.cmw=e.target.value;render()}if(d.ch==='cmStg'){cmSetStg(D.wa.find(x=>x.id===d.id),e.target.value)}});
document.addEventListener('input',e=>{if(e.target.id==='cmq'){S.cmq=e.target.value;const p=e.target.selectionStart;render();const i=document.getElementById('cmq');if(i){i.focus();i.setSelectionRange(p,p)}}});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&e.target&&e.target.id==='msg'&&S.v==='chat'&&S.cmd){e.preventDefault();A.cmSend({dataset:{id:S.cmd}})}if(e.key==='Escape'&&S.v==='chat'&&S.cmd){S.cmd=null;render()}});
document.addEventListener('dragstart',e=>{const c=e.target.closest&&e.target.closest('.cmc');if(c){e.dataTransfer.setData('text/plain',c.dataset.cid);c.classList.add('drag')}});
document.addEventListener('dragend',e=>{const c=e.target.closest&&e.target.closest('.cmc');if(c)c.classList.remove('drag');document.querySelectorAll('.cmcol.over').forEach(x=>x.classList.remove('over'))});
document.addEventListener('dragover',e=>{const col=e.target.closest&&e.target.closest('.cmcol');if(col){e.preventDefault();document.querySelectorAll('.cmcol.over').forEach(x=>x!==col&&x.classList.remove('over'));col.classList.add('over')}});
document.addEventListener('drop',e=>{const col=e.target.closest&&e.target.closest('.cmcol');if(!col)return;e.preventDefault();const id=e.dataTransfer.getData('text/plain'),c=D.wa.find(x=>x.id===id),k=col.dataset.col,stg=(CM_COL.find(x=>x[0]===k)||[])[2];if(c&&stg&&cmColOf(c)!==k)cmSetStg(c,stg[0]);else render()});

const _vChatCM=V.chat;V.chat=()=>{if(['meet','notes'].includes(S.chm)||!S.chm)S.chm='crm';if(S.chm==='wa'){S.chm='crm';S.cmv='inbox'}if(S.chm==='call'){S.chm='crm';S.cmv='calls'}
 S.cco=cmCo()==='all'?'log':cmCo();
 if(S.chm==='crm')return `<div class="cmwrap">${chatHead()}${crmView()}</div>`;
 return _vChatCM()};
const _rCM=render;render=function(){_rCM.apply(this,arguments);try{document.body.classList.toggle('cmmode',S.v==='chat')}catch(x){}};

document.head.insertAdjacentHTML('beforeend',`<style>
@media(min-width:761px){body.cmmode header.hd{display:none!important}}
body.cmmode .ctabs.cdock{display:none!important}
.cmh2{display:flex;align-items:center;gap:12px;background:#fff;border:1px solid var(--line);border-radius:16px;padding:8px 10px;margin:0 0 8px;box-shadow:0 1px 2px rgba(16,24,40,.04)}
.cmh2-l{display:flex;align-items:center;gap:12px;flex:1;min-width:0}
.ccsel{display:flex;align-items:center;gap:10px;background:#F7F8FB;border:1px solid #E3E7EF;border-radius:12px;padding:5px 12px 5px 10px;min-width:220px}
.ccsel>i{width:10px;height:10px;border-radius:50%;background:var(--cc);box-shadow:0 0 0 3px color-mix(in srgb,var(--cc) 20%,#fff);flex:none}
.ccsel>div{display:flex;flex-direction:column;min-width:0;flex:1}.ccsel small{font-size:10.5px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:var(--mut)}
.ccsel select,.ccsel b{border:0;background:transparent;font:800 15px Inter,sans-serif;color:var(--ink);padding:0;min-height:0;cursor:pointer;outline:none;width:100%}
.cseg{display:inline-flex;background:#EEF1F6;border-radius:12px;padding:3px;gap:2px}
.cseg button{display:inline-flex;align-items:center;gap:7px;border:0;background:transparent;border-radius:9px;padding:8px 16px;font:700 13.5px Inter,sans-serif;color:#4A5468;cursor:pointer}
.cseg button .ico{width:16px;height:16px}.cseg button.on{background:#fff;color:#24408E;box-shadow:0 1px 3px rgba(16,24,40,.15)}
.cseg em,.cpb em{font-style:normal;background:#E5484D;color:#fff;border-radius:999px;font-size:10.5px;font-weight:800;padding:0 6px}
.cmh2-r{display:flex;align-items:center;gap:4px;border-left:1px solid var(--line);padding-left:12px}
.cpl{font-size:10.5px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:var(--mut);margin-right:4px}
.cpb{display:inline-flex;align-items:center;gap:6px;border:1px solid transparent;background:none;border-radius:10px;padding:8px 11px;font:700 13px Inter,sans-serif;color:#4A5468;cursor:pointer}
.cpb .ico{width:16px;height:16px}.cpb:hover{background:#F4F6FA}.cpb.on{background:#FFF4E8;border-color:#F28C28;color:#B4570B}
.cnum{display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:12.5px;margin:0 4px 10px;color:#3B4456}.cdot{width:8px;height:8px;border-radius:50%;background:#1F9D55}
.sfwrap2 .sf{height:calc(100vh - 150px)!important}
.ckpi{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-bottom:10px}
.ck{text-align:left;background:#fff;border:1px solid var(--line);border-left:4px solid var(--c);border-radius:12px;padding:10px 12px;cursor:pointer;font:inherit;color:var(--ink)}.ck b{display:block;font-size:22px}.ck span{font-size:12px;color:var(--mut);font-weight:600}
.ck:hover{background:#FAFBFC}.ck.on{background:color-mix(in srgb,var(--c) 8%,#fff);box-shadow:inset 0 0 0 1px var(--c)}
.ck.b{--c:#2F6BE0}.ck.o{--c:#E8772E}.ck.r{--c:#C0392B}.ck.p{--c:#7A2E8E}.ck.g{--c:#1F9D55}
.cmbar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px}.cmbar .sfq{min-width:260px;background:#fff;border:1px solid var(--line)}
.tclr{border:0;background:#EEF1F6;border-radius:999px;padding:6px 12px;font-weight:700;font-size:12.5px;cursor:pointer;color:var(--ink)}
.cmlay{display:flex;gap:12px;align-items:flex-start}.cmlay .cmboard{flex:1;min-width:0}
.cmboard{display:flex;gap:10px;overflow-x:auto;padding-bottom:10px;align-items:flex-start}
.cmcol{flex:0 0 250px;background:#F4F6FA;border-radius:14px;padding:8px;max-height:calc(100vh - 330px);overflow-y:auto;transition:background .15s}
.cmcol.over{background:color-mix(in srgb,var(--c) 14%,#F4F6FA);box-shadow:inset 0 0 0 2px var(--c)}
.cmh{display:flex;align-items:center;gap:7px;padding:4px 4px 8px;position:sticky;top:-8px;background:inherit;z-index:1}.cmh i{width:9px;height:9px;border-radius:50%;background:var(--c)}.cmh b{font-size:13px}.cmh span{margin-left:auto;font-size:12px;font-weight:700;background:#fff;border-radius:999px;padding:0 8px}
.cmdrop{border:1.5px dashed #CBD2DE;border-radius:10px;padding:14px;text-align:center;font-size:12px;color:var(--mut)}
.cmc{background:#fff;border:1px solid #E6E9EF;border-left:3px solid var(--c);border-radius:12px;padding:9px 10px;margin-bottom:8px;cursor:grab}.cmc.un{box-shadow:0 0 0 1px #2F6BE0 inset}.cmc.sel{box-shadow:0 0 0 2px #24408E}.cmc.drag{opacity:.5}
.cmt{display:flex;align-items:center;gap:8px;width:100%;border:0;background:none;padding:0;text-align:left;cursor:pointer;font:inherit;color:var(--ink)}
.cmn{display:flex;flex-direction:column;min-width:0;flex:1}.cmn b{font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cmn small{font-size:11.5px;color:var(--mut)}
.cmu{background:#1F9D55;color:#fff;border-radius:999px;font-size:11px;font-weight:800;padding:1px 7px}
.cmco{display:inline-block;margin-top:6px;font-size:10.5px;font-weight:800;color:var(--cc);background:color-mix(in srgb,var(--cc) 10%,#fff);border-radius:6px;padding:1px 7px}
.cml{font-size:12.5px;color:#3B4456;margin:7px 0}.cml span{display:block;font-size:11px;color:var(--mut);margin-top:2px}
.cmf{display:flex;align-items:center;gap:6px}.cmo{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:700}.cmo.none{color:#C0392B}
.cmb{width:32px;height:32px;border-radius:9px;border:1px solid var(--line);background:#fff;display:inline-flex;align-items:center;justify-content:center;cursor:pointer}.cmb .ico{width:16px;height:16px}
.cmb.wa{color:#1F9D55}.cmb.call{color:#24408E}.cmb:hover{background:#F4F6FA}
.cmd{flex:0 0 360px;background:#fff;border:1px solid var(--line);border-radius:16px;padding:14px;position:sticky;top:10px;max-height:calc(100vh - 40px);overflow-y:auto;box-shadow:0 8px 24px rgba(16,24,40,.08)}
.cmdh{display:flex;align-items:center;gap:10px;margin-bottom:12px}.cmdh b{font-size:16px}
.cmda{display:flex;gap:8px;margin-bottom:12px}.cmda .btn{flex:1;justify-content:center}
.cmdg{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px}.cmdg label{font-size:11px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--mut);display:flex;flex-direction:column;gap:4px;margin:0}
.cmdg select{min-height:36px;font-size:13px;text-transform:none;letter-spacing:0;font-weight:600;color:var(--ink)}
.cmdl{font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--mut);margin:12px 0 6px}
.cmdm{background:#EFEAE2;border-radius:12px;padding:8px;display:flex;flex-direction:column;gap:6px;max-height:260px;overflow-y:auto}
.cmbb{align-self:flex-start;max-width:85%;background:#fff;border-radius:10px;padding:6px 9px;font-size:13px;box-shadow:0 1px 1px rgba(0,0,0,.06)}.cmbb.me{align-self:flex-end;background:#D9FDD3}.cmbb b{display:block;font-size:11px;color:#1F7A45}.cmbb span{display:block;text-align:right;font-size:10.5px;color:var(--mut)}
.cmdr{display:flex;gap:6px;margin-top:8px}.cmdr input{flex:1;min-height:38px}
.cmdlog{font-size:12.5px;display:flex;flex-direction:column;gap:5px}.cmdlog span{color:var(--mut);margin-right:6px;font-size:11.5px}
@media(max-width:1100px){.cmlay.open .cmboard{display:none}.cmd{flex:1;position:static;max-height:none}}
@media(max-width:760px){.cmh2{flex-wrap:wrap;gap:8px}.cmh2-l{flex-wrap:wrap}.ccsel{min-width:0;flex:1 1 100%}.cmh2-r{border:0;padding:0;width:100%}.cpl{display:none}.cnum span.mut{display:none}
 .ckpi{display:flex;overflow-x:auto;gap:8px}.ck{flex:0 0 120px;padding:8px 10px}.ck b{font-size:18px}.cmbar .sfq{min-width:0;flex:1 1 100%}.cmcol{flex-basis:240px;max-height:none}}
</style>`);
document.head.insertAdjacentHTML('beforeend',`<style>
.cnum2{display:flex;align-items:center;gap:8px;padding:4px 10px;border-left:1px solid var(--line);min-width:0}.cnum2>.ico{width:16px;height:16px;color:#1F9D55;flex:none}
.cnum2>div{display:flex;flex-direction:column;min-width:0}.cnum2 small{font-size:10.5px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:var(--mut)}.cnum2 b{font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:300px}
.ccsel.dim{opacity:.55}
.usq{order:9;flex:1 1 100%;min-width:220px;display:flex;align-items:center;gap:8px;background:#F4F6FA;border:1.5px solid #E3E7EF;border-radius:12px;padding:0 10px;height:44px}
.usq:focus-within,.usq.on{border-color:#24408E;background:#fff;box-shadow:0 0 0 3px rgba(36,64,142,.1)}.usq input{flex:1;border:0;background:transparent;outline:none;font:500 14px Inter,sans-serif;min-height:0;padding:0}
.cmh2{flex-wrap:wrap}.cmh2-l{flex-wrap:wrap}
.cmsr{background:#fff;border:1px solid var(--line);border-radius:14px;padding:6px}.cmsrh{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;padding:8px 10px}
.cmsri{display:flex;gap:10px;width:100%;text-align:left;border:0;border-top:1px solid #F0F2F5;background:none;padding:10px;cursor:pointer;font:inherit;color:var(--ink);border-radius:10px}.cmsri:hover{background:#F7F8FB}
.cmsrb{flex:1;min-width:0}.cmhit{font-size:12.5px;color:#3B4456;margin-top:4px}.cmhit span{display:inline-block;min-width:96px;font-size:11px;font-weight:800;color:var(--mut);text-transform:uppercase;letter-spacing:.04em;margin-right:6px}
.cmsr mark{background:#FFE58F;border-radius:3px;padding:0 2px}
.stgp{display:inline-block;font-size:11px;font-weight:800;color:var(--c,#4A5468);background:color-mix(in srgb,var(--c,#4A5468) 10%,#fff);border-radius:6px;padding:1px 7px}
.cmin{flex:1;min-width:0;background:#fff;border:1px solid var(--line);border-radius:14px;overflow:hidden;max-height:calc(100vh - 300px);overflow-y:auto}
.cmir{display:flex;gap:10px;width:100%;border:0;border-bottom:1px solid #F0F2F5;background:#fff;padding:10px 12px;text-align:left;cursor:pointer;font:inherit;color:var(--ink);align-items:flex-start}.cmir:hover{background:#F7F8FB}.cmir.on{background:#EEF2FB}
.cmib{flex:1;min-width:0}.cmit{display:flex;gap:8px}.cmit b{flex:1;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cmit span{font-size:11.5px;color:var(--mut)}.cmir.un .cmit span{color:#1F9D55;font-weight:700}
.cmim{font-size:12.5px;color:#4A5468;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:2px 0 5px}.cmim em{font-style:normal;font-weight:700}.cmitg{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.cmcr{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px}.cdial{display:flex;gap:6px}.cdial input{min-height:38px;width:170px}
.cmppl{display:flex;gap:8px;overflow-x:auto;margin-bottom:10px}.cmpp{flex:none;display:flex;align-items:center;gap:8px;background:#fff;border:1px solid var(--line);border-radius:12px;padding:8px 12px;font-size:12.5px}.cmpp span{color:var(--mut)}
.cmct td,.cmct th{white-space:nowrap}.cdir{font-size:12px;font-weight:700}.cdir.out{color:#1F9D55}.cdir.in{color:#7A2E8E}.cdir.miss{color:#C0392B}
.cmover{position:fixed;top:12px;right:12px;bottom:12px;z-index:70;display:flex}.cmover .cmd{max-height:none;height:100%;flex:0 0 400px;box-shadow:0 16px 40px rgba(16,24,40,.22)}
.cmd{flex:0 0 400px}
.cmdt{display:flex;gap:2px;border-bottom:1px solid var(--line);margin:4px 0 10px}.cmdt button{border:0;background:none;padding:8px 10px;font:700 13px Inter,sans-serif;color:var(--mut);border-bottom:2px solid transparent;cursor:pointer;margin-bottom:-1px}.cmdt button.on{color:#24408E;border-bottom-color:#F28C28}
.cmsum{display:flex;flex-direction:column;gap:7px;background:#F7F8FB;border-radius:12px;padding:10px 12px}.cmsum>div{display:grid;grid-template-columns:104px 1fr;gap:8px;font-size:13px}.cmsum span{font-size:11px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--mut);padding-top:2px}
.cmdm.big{max-height:calc(100vh - 470px);min-height:200px}.cmdm .dsep{align-self:center;font-size:11px;background:#fff;border-radius:6px;padding:2px 8px;color:var(--mut)}.cmdm .wnote{background:#FFF7D6;border-radius:8px;padding:6px 9px;font-size:12.5px}.cmdm .wnote b{display:block;font-size:11px}.cmdm .wnote span{display:block;font-size:10.5px;color:var(--mut)}
.cmwin{font-size:11.5px;color:#1F7A45;margin:6px 0}.cmwin.off{color:#C0392B}
.cmdr2{border:1px solid var(--line);border-radius:12px;padding:6px;display:flex;flex-direction:column;gap:6px}.cmdr2 textarea{border:0;resize:none;outline:none;min-height:44px;font:14px Inter,sans-serif}.cmdr2.note{background:#FFFBEA}.tclr.on{background:#FFE58F}
.cmtl{display:flex;flex-direction:column;gap:2px}.cmtd{font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--mut);margin:10px 0 4px}
.cmte{display:flex;gap:8px;font-size:13px;padding:6px 0;border-bottom:1px solid #F3F4F7}.cmte>i{font-style:normal;width:20px;flex:none;text-align:center}.cmte.call{background:#F2FAF5;border-radius:8px;padding:6px}.cmte.log{color:#4A5468;font-size:12px}
@media(max-width:1100px){.cmlay.open .cmboard,.cmlay.open .cmin{display:none}.cmd{flex:1}}
@media(max-width:760px){.cnum2{border:0;padding:0;width:100%}.usq{flex:1 1 100%}.cmover{inset:0}.cmover .cmd{flex:1;border-radius:0}.cmsum>div{grid-template-columns:90px 1fr}}
</style>`);

/* ===== Campaigns live inside JDAC Studios (Clients · Ad accounts · Campaigns), not in the main menu for Darshan sir / Nameera ===== */
CTABS.studios=[['clients','Clients'],['ads','Ad accounts'],['camp','Campaigns']];
const _tabsCampX=tabsFor;tabsFor=function(who){const T=_tabsCampX(who),k=(P[who||S.me]||{}).kind;return (k==='boss'||k==='hr')?T.filter(x=>x[0]!=='camp'):T};
CP['studios:camp']=()=>{const o=V.camp();return o.replace(/<h1>Campaigns<\/h1>(<p class="mut sm"[^>]*>[\s\S]*?<\/p>)?/,'')};
if(S.v==='camp'&&isAdm()){S.v='co';S.co='studios';S.tab='camp'}

/* ===== Who sees what (26 Nov): App blueprint, Training, KPIs, Contacts only for Darshan sir & Nameera.
   Content only for admins and the marketing team (it is their daily work). Settings for everyone,
   but "Who sees what" and "Connections" inside Settings only for Darshan sir & Nameera. ===== */
const ADM_ONLY=['blueprint','training','kpi','contacts'];
const _allowedWS=allowed;allowed=function(v){if(isAdm())return _allowedWS(v);if(ADM_ONLY.includes(v))return false;if(v==='settings')return K()!=='partner';if(v==='content')return ['swapnil','omparvate','himanshu'].includes(S.me)&&_allowedWS(v);return _allowedWS(v)};
const _tabsWS=tabsFor;tabsFor=function(who){const T=_tabsWS(who),k=(P[who||S.me]||{}).kind;if(k==='boss'||k==='hr')return T;return T.filter(x=>!ADM_ONLY.includes(x[0]))};
const _stWS=V.settings;V.settings=()=>{let o=_stWS();if(isAdm())return o;
 return o.replace(/<details class="bpsec bpdd"[^>]*><summary class="bph" data-a="stO" data-k="[wc]">[\s\S]*?<\/details>/g,'')};
if(!isAdm()&&!allowed(S.v))S.v=tabsFor()[0][0];
render();


/* ================= Communication v3 =================
   · One company at a time (no "All companies"): each company has its own funnel. HR Consultancy has two CRMs: Clients and Job seekers.
     A new company only needs an entry in CM_FUN — the screen stays the same.
   · Staff see only their company; executives see only the customers assigned to them.
   · Views: Board (funnel, with tags on cards) · WhatsApp (full WhatsApp Business panel with the 24-hour window) · Calls (log + dialer).
   · Customer panel: Summary · WhatsApp · Calls · Timeline · Details. */
const CM_LOGCOL=CM_COL.map(x=>[x[0],x[1],x[2].slice(),x[3]]);
const cmMk=L=>L.map(([k,l,c])=>[k,l,[l],c]);
const CM_FUN={
 log:{n:'Customers',cols:CM_LOGCOL},
 gb:{n:'Retailers',cols:cmMk([['new','New lead','#2F6BE0'],['con','Contacted','#0B6E8A'],['cat','Catalogue / sample sent','#B8860B'],['ord','Order placed','#7A2E8E'],['dsp','Dispatched','#0796A6'],['pay','Payment due','#E8772E'],['done','Repeat customer','#1F9D55'],['lost','Lost','#C0392B']])},
 jup:{n:'Rental customers',cols:cmMk([['new','New enquiry','#2F6BE0'],['con','Contacted','#0B6E8A'],['quo','Quote sent','#B8860B'],['bk','Booked · delivery','#7A2E8E'],['rent','On rent','#0796A6'],['done','Returned / closed','#1F9D55'],['lost','Lost','#C0392B']])},
 'hr:cl':{n:'Client CRM',cols:cmMk([['new','New lead','#2F6BE0'],['con','Contacted','#0B6E8A'],['meet','Meeting','#B8860B'],['prop','Proposal sent','#7A2E8E'],['sign','Agreement signed','#0796A6'],['done','Active client','#1F9D55'],['lost','Lost','#C0392B']])},
 'hr:js':{n:'Job seekers CRM',cols:cmMk([['new','New','#2F6BE0'],['con','Called','#0B6E8A'],['reg','Registered','#B8860B'],['int','Interview','#7A2E8E'],['sel','Selected','#0796A6'],['done','Joined','#1F9D55'],['lost','Not suitable','#C0392B']])},
 studios:{n:'Clients',cols:cmMk([['new','New lead','#2F6BE0'],['con','Contacted','#0B6E8A'],['prop','Proposal sent','#B8860B'],['onb','Onboarded','#7A2E8E'],['done','Active client','#1F9D55'],['lost','Lost','#C0392B']])}};
const CM_SEGS={log:[['cu','Customers CRM'],['tr','Transport partners CRM']],hr:[['cl','Clients CRM'],['js','Job seekers CRM']]};
CM_FUN['log:cu']=CM_FUN.log;CM_FUN['log:tr']={n:'Transport partners',cols:cmMk([['new','New transporter','#2F6BE0'],['con','Contacted','#0B6E8A'],['rate','Rates received','#B8860B'],['ver','Documents · verification','#7A2E8E'],['done','Active partner','#1F9D55'],['lost','Not suitable','#C0392B']])};
const cmSegs=co=>CM_SEGS[co]||null;
const cmSeg=()=>{const L=cmSegs(cmCo());if(!L)return '';return L.some(x=>x[0]===S.cmseg)?S.cmseg:L[0][0]};
const cmFk=()=>{const co=cmCo();return cmSegs(co)?co+':'+cmSeg():co};
const CM_GEN=cmMk([['new','New lead','#2F6BE0'],['con','Contacted','#0B6E8A'],['prog','In progress','#B8860B'],['done','Won','#1F9D55'],['lost','Lost','#C0392B']]);
const cmFunApply=k=>{const F=CM_FUN[k]||CM_FUN[String(k).split(':')[0]]||{cols:CM_GEN};CM_COL.splice(0,CM_COL.length,...F.cols.map(x=>[x[0],x[1],x[2].slice(),x[3]]));WASTG.splice(0,WASTG.length,...F.cols.flatMap(x=>x[2]))};
const cmSegOf=c=>{const co=(CM_CO.find(x=>x[2].includes(c.team))||[])[0],L=cmSegs(co);if(!L)return '';if(c.seg&&L.some(x=>x[0]===c.seg))return c.seg;return co==='hr'&&(c.tags||[]).some(t=>/job ?seeker|candidate/i.test(t))?'js':L[0][0]};
const cmJunior=()=>!isAdm()&&!/lead|manager|head/i.test((P[S.me]||{}).r||'');
function cmList(){const co=cmCo();return D.wa.filter(c=>myWaTeams().includes(c.team)&&(!cmSegs(co)||cmSegOf(c)===cmSeg())&&(!cmJunior()||c.to===S.me))}

/* company picker: never "All companies" */
const _chatHeadV3=chatHead;chatHead=function(){if(!S.cmco||S.cmco==='all')S.cmco=cmCos().find(k=>k!=='all')||'log';
 return _chatHeadV3.apply(this,arguments).replace(/<button role="option"[^>]*data-k="all"[\s\S]*?<\/span><\/button>/,'')};

/* toolbar */
cmTools=function(all,extra){const who=S.cmw||'all',own=[...new Set(all.map(c=>c.to).filter(Boolean))],v=S.cmv||'board';
 const seg=cmSegs(cmCo())?`<div class="cseg cmseg" role="tablist">${cmSegs(cmCo()).map(([k,l])=>`<button class="${cmSeg()===k?'on':''}" data-a="cmSegT" data-t="${k}" title="${h(l)}">${h(l.replace(/ CRM$/,''))}</button>`).join('')}</div>`:'';
 return `<div class="cmbar">${seg}<div class="cseg" role="tablist">${[['board','Board','t_kan'],['wa','WhatsApp','chat'],['calls','Calls','phone']].map(([k,l,i])=>`<button class="${v===k?'on':''}" data-a="cmV" data-t="${k}" role="tab" aria-selected="${v===k}">${ic(i)}<span>${l}</span></button>`).join('')}</div>
  ${v==='board'&&!cmJunior()?`<select class="t4sel" data-ch="cmw" aria-label="Lead owner"><option value="all">Everyone's customers</option><option value="un" ${who==='un'?'selected':''}>Not assigned</option>${own.map(x=>`<option value="${x}" ${who===x?'selected':''}>${h(nmF(x))}</option>`).join('')}</select>`:''}
  ${S.cmf&&v==='board'?`<button class="tclr" data-a="cmF" data-f="${S.cmf}">✕ Clear filter</button>`:''}<span class="sp"></span>${extra||''}<button class="btn sm sec" data-a="cmPad">${ic('phone')}Dialer</button><button class="btn sm" data-a="waNew">${ic('plus')}New ${cmCo()==='hr'&&cmSeg()==='js'?'job seeker':cmCo()==='log'&&cmSeg()==='tr'?'transporter':'customer'}</button></div>`};
A.cmSegT=e=>{S.cmseg=e.dataset.t;S.cmd=null;render()};

/* board: tags on every card */
const cmTagRow=c=>(c.tags||[]).length?`<div class="cmtg">${c.tags.slice(0,4).map(waTag).join('')}${c.tags.length>4?`<span class="xs mut">+${c.tags.length-4}</span>`:''}</div>`:'';
boardView=function(L){return `<div class="cmboard">${CM_COL.map(([k,l,,col])=>{const C=L.filter(c=>cmColOf(c)===k).sort((a,b)=>(b.at>a.at?1:b.at<a.at?-1:(waLast(b).at||'').localeCompare(waLast(a).at||'')));
 return `<div class="cmcol" style="--c:${col}" data-col="${k}"><div class="cmh"><i></i><b>${l}</b><span>${C.length}</span></div>${C.map(c=>cmCard(c).replace('<div class="cmf">',cmTagRow(c)+'<div class="cmf">')).join('')||'<div class="cmdrop">Drop here</div>'}</div>`}).join('')}</div>`};

/* composer that respects the WhatsApp Business 24-hour window */
function cmComposer(c){const w=waWin(c),n=cmNum(WACO[c.team]||'log'),lc=waLastC(c);
 if(!w&&!S.waNote)return `<div class="wa3lock"><div><b>24-hour reply window is closed</b><span>${lc?'Customer last wrote '+(c.at===TODAY?'today':fmt(c.at))+' at '+h(lc.at||''):'The customer has not written yet'}. WhatsApp allows only an approved template until they reply.</span></div><div class="row nw" style="gap:6px"><button class="tclr" data-a="cmNoteT">Note</button><button class="btn sm" data-a="cmTpl" data-id="${c.id}">Send template</button></div></div>`;
 return `${w?`<div class="cmwin">Reply window open · ${w}h left</div>`:''}<div class="cmdr2 ${S.waNote?'note':''}"><textarea id="msg" rows="2" placeholder="${S.waNote?'Internal note (customer does not see this)…':'Reply on WhatsApp from '+h(n.wa||n.n||'company number')+'…'}"></textarea><div class="row nw" style="gap:6px"><button class="ib" data-a="tplOpen" title="Quick replies">${sfi('bolt',18)}</button><button class="tclr ${S.waNote?'on':''}" data-a="cmNoteT">${S.waNote?'Note ✓':'Note'}</button><span class="sp"></span><button class="btn sm" data-a="cmSend" data-id="${c.id}">${S.waNote?'Save note':'Send'}</button></div></div>`}
const cmMsgs=c=>`<div class="dsep">${c.at===TODAY?'Today':fmt(c.at)}</div>${c.ms.map(m=>m.f==='note'?`<div class="wnote"><b>Internal note · ${h(nmF(m.by))}</b>${h(m.t)}<span>${m.at}</span></div>`:`<div class="cmbb ${m.f!=='c'?'me':''}">${m.f!=='c'?`<b>${h(nmF(m.f))}${m.tpl?' · template':''}</b>`:''}${h(m.t||'')}<span>${m.at||''}${m.f!=='c'?' ✓✓':''}</span></div>`).join('')}`;
const _cmSendV3=A.cmSend;A.cmSend=e=>{const c=D.wa.find(x=>x.id===(e&&e.dataset&&e.dataset.id||S.cmd));if(c&&!S.waNote&&!waWin(c))return toast('Window closed — send a template');_cmSendV3(e)};
A.cmTpl=e=>{const id=e.dataset.id;sheet(`<h2>Send a template</h2><p class="mut sm">Approved WhatsApp templates can be sent any time. Once the customer replies, the 24-hour window opens again.</p><div class="list">${D.waTpl.map((t,i)=>`<button class="li" data-a="cmTplGo" data-id="${id}" data-i="${i}"><div class="tx"><b>${h(t[0])}</b><div class="m">${h(t[1])}</div></div></button>`).join('')}</div>`)};
A.cmTplGo=e=>{const c=D.wa.find(x=>x.id===e.dataset.id),t=D.waTpl[+e.dataset.i];if(!c||!t)return;c.ms.push({f:S.me,t:t[1],at:nowT(),tpl:t[0]});if(!c.to)c.to=S.me;waLog(c,'Template sent · '+t[0]);save();closeM();render();cmScroll();toast('Template sent')};

/* calls of one customer */
function cmCallsTab(c){const L=cmCallsOf(c).slice().sort((a,b)=>(b.d||'').localeCompare(a.d||'')||(b.at||'').localeCompare(a.at||'')),con=L.filter(x=>x.st==='Connected'),talk=L.reduce((a,x)=>a+durS(x.dur),0);
 return `<div class="cmcs"><div><b>${L.length}</b><span>calls</span></div><div><b>${con.length}</b><span>connected</span></div><div><b>${L.filter(x=>x.st==='Missed').length}</b><span>missed</span></div><div><b>${durT(talk)}</b><span>talk time</span></div></div>
 <div class="cmcl">${L.map(x=>`<div class="cmcr2"><span class="cdir ${x.st==='Missed'?'miss':x.dir}">${x.dir==='in'?'↙':'↗'}</span><div style="flex:1;min-width:0"><b>${x.dir==='in'?'Incoming':'Outgoing'} · ${h(x.st||'')}</b><div class="xs mut">${x.d===TODAY?'Today':x.d===addD(TODAY,-1)?'Yesterday':fmt(x.d||TODAY)} ${h(x.at||'')} · ${h(P[x.k]?nmF(x.k):'')}${x.dur&&x.dur!=='—'?' · '+h(x.dur):''}</div>
  ${x.rec?`<div class="row nw" style="gap:6px;margin-top:4px"><audio controls src="${h(x.rec)}" style="height:30px;max-width:220px"></audio><a class="lnk" href="${h(x.rec)}" download>Download</a></div>`:`<div class="xs mut">Recording: after calling goes live</div>`}</div></div>`).join('')||'<div class="xs mut" style="padding:14px 0">No calls yet with this customer</div>'}</div>`}

/* timeline: every message, call, stage change and note in date order */
cmTimeline=function(c){const f=S.cmtf||'all',E=[];
 c.ms.forEach(m=>E.push({d:m.d||c.at,tm:m.at||'',k:m.f==='note'?'note':'wa',who:m.f==='c'?h(c.n):m.f==='note'?nmF(m.by):nmF(m.f),t:m.tpl?'Template · '+m.tpl:(m.t||(m.kind?'📎 '+m.kind:'')),sub:m.f==='c'?'WhatsApp received':m.f==='note'?'Internal note':'WhatsApp sent'}));
 cmCallsOf(c).forEach(x=>E.push({d:x.d||TODAY,tm:x.at||'',k:'call',who:P[x.k]?nmF(x.k):'',t:`${x.st||''}${x.dur&&x.dur!=='—'?' · '+x.dur:''}`,sub:x.dir==='in'?'Incoming call':'Outgoing call',rec:x.rec}));
 (c.log||[]).forEach(x=>E.push({d:x.at,tm:x.tm||'',k:/^stage/i.test(x.t||'')?'stage':'log',who:x.by?nmF(x.by):'',t:(x.t||'').replace(/^Stage → /,''),sub:/^stage/i.test(x.t||'')?'Stage changed':'Update'}));
 E.push({d:c.created||c.at,tm:'',k:'log',who:'',t:'Came in via '+(c.src||'WhatsApp'),sub:'First contact',first:1});
 const L=E.filter(e=>f==='all'||e.k===f||(f==='log'&&e.k==='stage')).sort((a,b)=>(b.d||'').localeCompare(a.d||'')||(b.tm||'').localeCompare(a.tm||'')||(a.first?1:0)-(b.first?1:0));let last='';
 const cnt=k=>E.filter(e=>e.k===k).length;
 return `<div class="cmtf">${[['all','All',E.length],['wa','WhatsApp',cnt('wa')],['call','Calls',cnt('call')],['stage','Stage',cnt('stage')],['note','Notes',cnt('note')]].map(([k,l,n])=>`<button class="${f===k?'on':''}" data-a="cmTf" data-t="${k}">${l} <span>${n}</span></button>`).join('')}</div>
 <div class="cmtl2">${L.map(e=>{const day=e.d===TODAY?'Today':e.d===addD(TODAY,-1)?'Yesterday':fmt(e.d);const sep=day!==last?`<div class="cmtd">${day} · ${L.filter(x=>x.d===e.d).length}</div>`:'';last=day;
  return sep+`<div class="cmte2 ${e.k}"><i>${{wa:ic('chat'),note:'📝',call:ic('phone'),stage:'➜',log:'•'}[e.k]}</i><div class="b"><div class="row nw"><b>${e.sub}</b><span class="sp"></span><span class="xs mut">${h(e.tm)}</span></div><div class="t">${e.k==='stage'?`<span class="stgp" style="--c:${(CM_COL.find(x=>x[2].includes(e.t))||[0,0,0,'#667'])[3]}">${h(e.t)}</span>`:h(e.t)}</div>${e.who?`<div class="xs mut">${e.k==='wa'&&e.sub==='WhatsApp received'?'':'by '}${h(e.who)}</div>`:''}${e.k==='call'?(e.rec?`<audio controls src="${h(e.rec)}" style="height:30px;margin-top:4px"></audio>`:''):''}</div></div>`}).join('')||'<div class="xs mut">Nothing here</div>'}</div>`};
A.cmTf=e=>{S.cmtf=e.dataset.t;render()};

/* customer panel */
const cmOwners=()=>STAFF.filter(k=>isAdm()?!isZen(k):(P[k]||{}).team===(P[S.me]||{}).team);
const cmStgSel=c=>`<label>Stage<select data-ch="cmStg" data-id="${c.id}">${CM_COL.map(x=>`<optgroup label="${h(x[1])}">${x[2].map(s=>`<option ${c.stg===s?'selected':''} value="${h(s)}">${h(s)}</option>`).join('')}</optgroup>`).join('')}</select></label>`;
const cmOwnSel=c=>`<label>Owner<select data-ch="waTo" data-id="${c.id}" ${cmJunior()?'disabled':''}><option value="">Not assigned</option>${cmOwners().map(k=>`<option value="${k}" ${c.to===k?'selected':''}>${h(nmF(k))}</option>`).join('')}</select></label>`;
cmDrawer=function(c){const ci=coOfTeam(c.team),tab=S.cmtab||'sum',n=cmNum(WACO[c.team]||'log');
 const tabs=[['sum','Summary'],['chat','WhatsApp'],['calls','Calls'],['time','Timeline'],['info','Details']];let body='';
 if(tab==='sum')body=cmSummary(c)+`${(c.tags||[]).length?`<div class="cmdl">Tags</div>${cmTagRow(c)}`:''}<div class="cmdl">Latest messages</div><div class="cmdm">${c.ms.filter(m=>m.f!=='note').slice(-3).map(m=>`<div class="cmbb ${m.f!=='c'?'me':''}">${m.f!=='c'?`<b>${h(nmF(m.f))}</b>`:''}${h(m.t||'')}<span>${m.at||''}</span></div>`).join('')||'<div class="xs mut">No messages yet</div>'}</div><button class="lnk" style="margin-top:6px" data-a="cmTab" data-t="chat">Open the full WhatsApp chat →</button>`;
 if(tab==='chat')body=`<div class="cmdm big" id="cmthr">${cmMsgs(c)}</div>${cmComposer(c)}`;
 if(tab==='calls')body=cmCallsTab(c);
 if(tab==='time')body=cmTimeline(c);
 if(tab==='info')body=`<div class="cmsum">${[['Name',h(c.n)],['Mobile','+91 '+h(c.ph)],['Company',h(ci[1])+(cmSegOf(c)?' · '+h(((cmSegs(cmCo())||[]).find(x=>x[0]===cmSegOf(c))||['',''])[1]):'')],['Number used',h(n.wa||n.vn||'to be added')],['Source',h(c.src||'WhatsApp')],['Customer since',fmt(c.created||c.at)],['Info',h(c.info||'—')]].map(x=>`<div><span>${x[0]}</span><div>${x[1]}</div></div>`).join('')}</div><div class="cmdl">Tags</div><div class="sftg">${(c.tags||[]).map(waTag).join('')}<button class="sfmt" data-a="waTags" data-id="${c.id}">${sfi('tag',13)}Manage tags</button></div>`;
 return `<aside class="cmd" aria-label="Customer"><div class="cmdh"><span class="sfav big">${sfIni(c.n)}</span><div style="flex:1;min-width:0"><b>${h(c.n)}</b><div class="xs mut">+91 ${h(c.ph)} · <span style="color:${ci[4]};font-weight:700">${h(ci[1])}</span></div></div><button class="ib" data-a="cmX" aria-label="Close">✕</button></div>
  <div class="cmda"><button class="btn sm" style="background:#1F9D55;border-color:#1F9D55" data-a="cmCall" data-id="${c.id}">${ic('phone')}Call</button><button class="btn sm sec" data-a="cmTab" data-t="chat">${ic('chat')}WhatsApp</button></div>
  <div class="cmdg">${cmStgSel(c)}${cmOwnSel(c)}</div>
  <div class="cmdt" role="tablist">${tabs.map(([k,l])=>`<button class="${tab===k?'on':''}" data-a="cmTab" data-t="${k}">${l}</button>`).join('')}</div>${body}</aside>`};

/* WhatsApp: the full WhatsApp Business panel — chats · conversation · customer */
function waView(L){const f=S.waf||'all',q=(S.waq||'').toLowerCase();
 const F={un:c=>c.unread,wait:c=>waLast(c).f==='c'&&!['done','lost'].includes(cmColOf(c)),open:c=>waWin(c)>0}[f];
 const R=L.filter(c=>(!F||F(c))&&(!q||(c.n+' '+c.ph+' '+c.ms.map(m=>m.t).join(' ')).toLowerCase().includes(q))).sort((a,b)=>(b.at>a.at?1:b.at<a.at?-1:(waLast(b).at||'').localeCompare(waLast(a).at||'')));
 let c=S.cmd&&L.find(x=>x.id===S.cmd);if(!c&&!matchMedia('(max-width:820px)').matches){c=R[0];if(c)S.cmd=c.id}
 const list=`<div class="wa3l"><div class="wa3s">${sfi('search',15)}<label class="sr" for="waq3">Search chats</label><input id="waq3" value="${h(S.waq||'')}" placeholder="Search chats"></div>
  <div class="wa3f">${[['all','All',L.length],['un','Unread',L.filter(x=>x.unread).length],['wait','Waiting reply',L.filter(x=>waLast(x).f==='c'&&!['done','lost'].includes(cmColOf(x))).length],['open','24h open',L.filter(x=>waWin(x)>0).length]].map(([k,l,n])=>`<button class="${f===k?'on':''}" data-a="waF3" data-t="${k}">${l}${n?` <span>${n}</span>`:''}</button>`).join('')}</div>
  <div class="wa3ls">${R.map(x=>{const l=waLast(x),me=l.f&&l.f!=='c',w=waWin(x);return `<button class="wa3i ${c&&c.id===x.id?'on':''} ${x.unread?'un':''}" data-a="waPick" data-id="${x.id}"><span class="sfav">${sfIni(x.n)}${w?'<em class="wdot" title="24-hour window open"></em>':''}</span><div class="b"><div class="r1"><b>${h(x.n)}</b><span>${waTime(x)}</span></div><div class="r2">${me?'✓✓ ':''}${h((l.t||'').slice(0,60))}</div><div class="r3"><span class="stgp" style="--c:${(CM_COL.find(y=>y[0]===cmColOf(x))||[])[3]}">${h(x.stg)}</span>${(x.tags||[]).slice(0,2).map(waTag).join('')}</div></div>${x.unread?`<span class="cmu">${x.unread}</span>`:''}</button>`}).join('')||'<div class="xs mut" style="padding:20px;text-align:center">No chats</div>'}</div></div>`;
 if(!c)return `<div class="wa3 nochat">${list}<div class="wa3c empty"><div>${ic('chat')}<b>Select a chat</b><span>All WhatsApp chats of this company show on the left.</span></div></div></div>`;
 if(c.unread){c.unread=0;save()}
 const w=waWin(c),rt=S.wart||'info';
 const conv=`<div class="wa3c"><div class="wa3h"><button class="ib wa3bk" data-a="waBack" aria-label="Back">‹</button><span class="sfav">${sfIni(c.n)}</span><div style="flex:1;min-width:0"><b>${h(c.n)}</b><div class="xs mut">+91 ${h(c.ph)} · <span class="wwin ${w?'on':''}">${w?`24h window open · ${w}h left`:'24h window closed'}</span></div></div><button class="btn sm" style="background:#1F9D55;border-color:#1F9D55" data-a="cmCall" data-id="${c.id}">${ic('phone')}<span class="hide-m">Call</span></button></div>
  <div class="wa3m" id="cmthr">${cmMsgs(c)}</div>${cmComposer(c)}</div>`;
 const side=`<aside class="wa3r"><div class="cmdg">${cmStgSel(c)}${cmOwnSel(c)}</div><div class="cmdl">Tags</div><div class="sftg">${(c.tags||[]).map(waTag).join('')}<button class="sfmt" data-a="waTags" data-id="${c.id}">${sfi('tag',13)}Manage</button></div>
  <div class="cmdt" role="tablist">${[['info','Summary'],['calls','Calls'],['time','Timeline']].map(([k,l])=>`<button class="${rt===k?'on':''}" data-a="waRt" data-t="${k}">${l}</button>`).join('')}</div>${rt==='info'?cmSummary(c):rt==='calls'?cmCallsTab(c):cmTimeline(c)}</aside>`;
 return `<div class="wa3 ${S.cmd?'sel':''}">${list}${conv}${side}</div>`}
A.waF3=e=>{S.waf=e.dataset.t;render()};A.waRt=e=>{S.wart=e.dataset.t;render()};
A.waPick=e=>{S.cmd=e.dataset.id;S.waNote=false;render();cmScroll()};A.waBack=()=>{S.cmd=null;render()};
document.addEventListener('input',e=>{if(e.target.id==='waq3'){S.waq=e.target.value;const p=e.target.selectionStart;render();const i=document.getElementById('waq3');if(i){i.focus();i.setSelectionRange(p,p)}}});

/* dialer */
A.cmPad=()=>{const n=cmNum(cmCo());sheet(`<h2>Dialer</h2><p class="xs mut">Calls go out from ${h(cmInfo(cmCo())[1])}${n.vn||n.wa?' · '+h(n.vn||n.wa):''}</p>
 <div class="pad"><input id="cmdial" inputmode="tel" placeholder="Enter number" autocomplete="off"><div class="padk">${['1','2','3','4','5','6','7','8','9','+','0','⌫'].map(k=>`<button type="button" data-a="cmKey" data-k="${k}">${k}</button>`).join('')}</div>
 <button class="btn w" style="background:#1F9D55;border-color:#1F9D55;margin-top:12px" data-a="cmPadGo">${ic('phone')}Call</button></div>`);setTimeout(()=>{const i=document.getElementById('cmdial');if(i)i.focus()},50)};
A.cmKey=e=>{const i=document.getElementById('cmdial');if(!i)return;i.value=e.dataset.k==='⌫'?i.value.slice(0,-1):i.value+e.dataset.k;i.focus()};
A.cmPadGo=()=>{const p=val('cmdial');if(telN(p).length<10)return toast('Enter a 10-digit number');closeM();const c=D.wa.find(x=>telN(x.ph)===telN(p));cmDoCall(cmCo(),c?c.n:p,p,c)};
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target&&e.target.id==='cmdial'&&document.querySelector('.pad')){e.preventDefault();A.cmPadGo()}});
const _callsV3=callsView2;callsView2=function(){return _callsV3().replace(/<div class="cdial">[\s\S]*?<\/div>/,'').replace(/<td><span class="cdir/g,'<td><span class="cdir')};

/* main CRM area */
crmView=function(){const T=myWaTeams();let v=S.cmv||'board';if(v==='inbox')v=S.cmv='wa';
 if(S.cmq)return searchView()+(()=>{const d=S.cmd&&D.wa.find(x=>x.id===S.cmd&&T.includes(x.team));return d?`<div class="cmover">${cmDrawer(d)}</div>`:''})();
 const all=cmList();
 if(v==='calls')return cmTools(all)+callsView2()+(()=>{const d=S.cmd&&D.wa.find(x=>x.id===S.cmd);return d?`<div class="cmover">${cmDrawer(d)}</div>`:''})();
 if(!T.length)return cmTools([])+`<div class="list">${empty('No customer inbox for this company yet','Customers show here once this company has its WhatsApp number')}</div>`;
 if(v==='wa')return cmTools(all)+waView(all);
 const L=cmFilt(all);const d=S.cmd&&all.find(x=>x.id===S.cmd);if(!d)S.cmd=null;
 return cmTools(all,'<span class="xs mut hide-m">Drag a card to change its stage</span>')+`<div class="cmlay ${d?'open':''} board">${boardView(L)}${d?cmDrawer(d):''}</div>`};

/* funnel follows the selected company; new HR contacts land in the CRM you are on */
const _vChatV3=V.chat;V.chat=()=>{if(!S.cmco||S.cmco==='all')S.cmco=cmCos().find(k=>k!=='all')||'log';cmFunApply(cmFk());return _vChatV3()};
const _rV3=render;render=function(){if((S.v!=='chat'&&S.v!=='crm'))cmFunApply('log');return _rV3.apply(this,arguments)};
const _waNewV3=A.waNewGo;A.waNewGo=()=>{const n=D.wa.length;_waNewV3();if((S.v==='chat'||S.v==='crm')&&D.wa.length>n&&cmSegs(cmCo())){D.wa[D.wa.length-1].seg=cmSeg();save()}};
const _cmCoV3=A.cmCo;A.cmCo=e=>{_cmCoV3(e);if(S.cmv==='inbox')S.cmv='wa'};

document.head.insertAdjacentHTML('beforeend',`<style>
.cmseg button{font-weight:700}.cmtg{display:flex;flex-wrap:wrap;gap:4px;margin:6px 0 2px}.cmtg .sft{font-size:10.5px;padding:2px 7px}
.wa3{display:grid;grid-template-columns:330px minmax(0,1fr) 300px;height:calc(100vh - 210px);min-height:520px;background:#fff;border:1px solid var(--line);border-radius:16px;overflow:hidden}
.wa3l{border-right:1px solid var(--line);display:flex;flex-direction:column;min-height:0;background:#fff}
.wa3s{display:flex;align-items:center;gap:8px;margin:12px 12px 8px;padding:0 12px;border:1px solid var(--line);border-radius:10px;background:#F6F8FB}.wa3s input{border:0;background:none;height:38px;flex:1;outline:none;font:inherit;min-width:0}
.wa3f{display:flex;gap:6px;padding:0 12px 10px;flex-wrap:wrap}.wa3f button{border:1px solid var(--line);background:#fff;border-radius:99px;padding:5px 10px;font-size:12.5px;font-weight:600;cursor:pointer;color:#4A5160}.wa3f button.on{background:#0B6E4F;border-color:#0B6E4F;color:#fff}.wa3f span{opacity:.75}
.wa3ls{overflow-y:auto;flex:1}.wa3i{display:flex;gap:10px;width:100%;text-align:left;border:0;border-bottom:1px solid #F0F2F5;background:#fff;padding:11px 12px;cursor:pointer;align-items:flex-start;font:inherit}
.wa3i:hover{background:#F6F8FB}.wa3i.on{background:#E9F6EF}.wa3i .sfav{position:relative;flex:none}.wdot{position:absolute;right:-1px;bottom:-1px;width:11px;height:11px;border-radius:50%;background:#25D366;border:2px solid #fff}
.wa3i .b{flex:1;min-width:0}.wa3i .r1{display:flex;gap:6px}.wa3i .r1 b{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.wa3i .r1 span{font-size:11.5px;color:var(--mut);flex:none}
.wa3i .r2{font-size:13px;color:#5B6372;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin:2px 0 4px}.wa3i.un .r2{color:var(--ink);font-weight:600}.wa3i .r3{display:flex;gap:4px;flex-wrap:wrap}.wa3i .r3 .sft,.wa3i .r3 .stgp{font-size:10.5px}
.wa3c{display:flex;flex-direction:column;min-height:0;background:#EFEAE2}.wa3c.empty{display:grid;place-items:center;color:var(--mut);text-align:center}.wa3c.empty div{display:flex;flex-direction:column;gap:6px;align-items:center}.wa3c.empty svg{width:36px;height:36px}
.wa3h{display:flex;align-items:center;gap:10px;padding:10px 14px;background:#fff;border-bottom:1px solid var(--line)}.wa3bk{display:none}
.wwin{font-weight:700;color:#C0392B}.wwin.on{color:#0B6E4F}
.wa3m{flex:1;overflow-y:auto;padding:16px 6%;display:flex;flex-direction:column;gap:6px}.wa3m .cmbb{max-width:72%}
.wa3c .cmwin,.wa3c .cmdr2,.wa3c .wa3lock{margin:0;border-radius:0;background:#fff}.wa3c .cmdr2{border-top:1px solid var(--line);padding:10px 12px}
.wa3lock{display:flex;gap:12px;align-items:center;padding:12px 14px;border-top:1px solid var(--line);background:#FFF8EC!important}.wa3lock>div:first-child{flex:1}.wa3lock b{display:block;color:#9A5B00}.wa3lock span{font-size:12.5px;color:#6B5A3A}
.cmd .wa3lock{border:1px solid #F3D9A6;border-radius:12px;margin-top:8px}
.wa3r{border-left:1px solid var(--line);overflow-y:auto;padding:14px;background:#fff}.wa3r .cmdg{display:grid;grid-template-columns:1fr;gap:8px}
.cmcs{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:10px 0}.cmcs div{background:#F6F8FB;border-radius:10px;padding:8px;text-align:center}.cmcs b{display:block;font-size:15px}.cmcs span{font-size:11px;color:var(--mut)}
.cmcr2{display:flex;gap:10px;padding:10px 0;border-bottom:1px solid #F0F2F5;align-items:flex-start}.cmcr2 .cdir{flex:none;width:28px;height:28px;display:grid;place-items:center;border-radius:50%;padding:0}
.cmtf{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0}.cmtf button{border:1px solid var(--line);background:#fff;border-radius:99px;padding:4px 10px;font-size:12px;font-weight:600;cursor:pointer}.cmtf button.on{background:#24408E;color:#fff;border-color:#24408E}.cmtf span{opacity:.7}
.cmtl2{position:relative}.cmtl2 .cmtd{font-size:11.5px;font-weight:800;color:var(--mut);text-transform:uppercase;letter-spacing:.4px;margin:12px 0 6px}
.cmte2{display:flex;gap:10px;position:relative;padding-bottom:12px}.cmte2:before{content:"";position:absolute;left:13px;top:28px;bottom:0;width:2px;background:#E6E9EF}
.cmte2>i{flex:none;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-size:13px;background:#EEF2FB;color:#24408E;z-index:1}.cmte2>i svg{width:14px;height:14px}
.cmte2.wa>i{background:#E6F7EE;color:#0B6E4F}.cmte2.call>i{background:#FFF1E6;color:#C2410C}.cmte2.stage>i{background:#F3E8F7;color:#7A2E8E}.cmte2.note>i{background:#FFF8DB}
.cmte2 .b{flex:1;min-width:0;background:#fff;border:1px solid #EEF0F4;border-radius:10px;padding:8px 10px}.cmte2 .b b{font-size:12.5px}.cmte2 .t{font-size:13.5px;margin:2px 0}
.pad{max-width:300px;margin:0 auto}.pad input{font-size:24px;text-align:center;letter-spacing:1px;font-weight:700}.padk{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px}
.padk button{height:58px;border-radius:50%;width:58px;justify-self:center;border:1px solid var(--line);background:#F6F8FB;font:700 22px Outfit,sans-serif;cursor:pointer}.padk button:hover{background:#E9EEF8}
@media(max-width:1200px){.wa3{grid-template-columns:300px minmax(0,1fr)}.wa3r{display:none}}
@media(max-width:820px){.wa3{grid-template-columns:1fr;height:calc(100vh - 190px)}.wa3.sel .wa3l{display:none}.wa3:not(.sel) .wa3c{display:none}.wa3bk{display:grid}.wa3m{padding:12px}}
</style>`);

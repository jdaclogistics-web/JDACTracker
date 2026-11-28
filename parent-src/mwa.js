/* ===== WhatsApp CRM v4: one filter button (stage · owner · 24h window · follow-up), owner on every chat,
   lead actions inside the chat (stage, owner, tags, note, follow-up task) ===== */
const waFx=()=>{S.waX=S.waX||{col:[],to:[],win:'',fu:''};return S.waX};
const waFxN=()=>{const x=waFx();return x.col.length+x.to.length+(x.win?1:0)+(x.fu?1:0)};
const waFuSt=c=>{const f=c.fu;if(!f||f.done)return '';return f.d<TODAY?'late':f.d===TODAY?'today':'later'};
const waFuTx=c=>{const f=c.fu,s=waFuSt(c);if(!s)return '';const d=f.d===TODAY?'Today':f.d===addD(TODAY,1)?'Tomorrow':fmt(f.d);return (s==='late'?'Overdue · ':'')+d+(f.tm?' '+f.tm:'')};
const waOwnP=c=>c.to?`<span class="waown"><i>${h(sfIni(nmF(c.to)))}</i>${h(nmF(c.to))}</span>`:`<span class="waown no"><i>?</i>Not assigned</span>`;
const waFuP=c=>{const s=waFuSt(c);return s?`<span class="wafu ${s}">⏰ ${h(waFuTx(c))}</span>`:''};
function waFxApply(L){const x=waFx();return L.filter(c=>(!x.col.length||x.col.includes(cmColOf(c)))&&(!x.to.length||x.to.includes(c.to||'_none'))&&(!x.win||(x.win==='open')===(waWin(c)>0))&&(!x.fu||(x.fu==='none'?!waFuSt(c):x.fu==='due'?['late','today'].includes(waFuSt(c)):waFuSt(c)===x.fu)))}

waView=function(L0){const f=S.waf||'all',q=(S.waq||'').toLowerCase(),L=waFxApply(L0),nF=waFxN();
 const F={un:c=>c.unread,wait:c=>waLast(c).f==='c'&&!['done','lost'].includes(cmColOf(c)),open:c=>waWin(c)>0,fu:c=>['late','today'].includes(waFuSt(c))}[f];
 const R=L.filter(c=>(!F||F(c))&&(!q||(c.n+' '+c.ph+' '+nmF(c.to||'')+' '+c.ms.map(m=>m.t).join(' ')).toLowerCase().includes(q))).sort((a,b)=>(b.at>a.at?1:b.at<a.at?-1:(waLast(b).at||'').localeCompare(waLast(a).at||'')));
 let c=S.cmd&&L0.find(x=>x.id===S.cmd);if(!c&&!matchMedia('(max-width:820px)').matches){c=R[0];if(c)S.cmd=c.id}
 const x=waFx(),chipsOn=[...x.col.map(k=>['col',k,(CM_COL.find(y=>y[0]===k)||[0,k])[1]]),...x.to.map(k=>['to',k,k==='_none'?'Not assigned':nmF(k)]),...(x.win?[['win',x.win,x.win==='open'?'24h open':'24h closed']]:[]),...(x.fu?[['fu',x.fu,{due:'Follow-up due',late:'Overdue',later:'Follow-up later',none:'No follow-up'}[x.fu]]]:[])];
 const list=`<div class="wa3l"><div class="wa4s"><div class="wa3s">${sfi('search',15)}<label class="sr" for="waq3">Search chats</label><input id="waq3" value="${h(S.waq||'')}" placeholder="Search name, number, owner…"></div><button class="wa4fb ${nF?'on':''}" data-a="waFx" aria-label="Filters">${sfi('filter',18)}${nF?`<em>${nF}</em>`:''}</button></div>
  <div class="wa3f">${[['all','All',L.length],['un','Unread',L.filter(x=>x.unread).length],['wait','Waiting',L.filter(x=>waLast(x).f==='c'&&!['done','lost'].includes(cmColOf(x))).length],['open','24h open',L.filter(x=>waWin(x)>0).length],['fu','Follow-up',L.filter(x=>['late','today'].includes(waFuSt(x))).length]].map(([k,l,n])=>`<button class="${f===k?'on':''}" data-a="waF3" data-t="${k}">${l}${n?` <span>${n}</span>`:''}</button>`).join('')}</div>
  ${chipsOn.length?`<div class="wa4on">${chipsOn.map(([g,k,l])=>`<button data-a="waFxRm" data-g="${g}" data-k="${h(k)}">${h(l)} ✕</button>`).join('')}<button class="clr" data-a="waFxClr">Clear all</button></div>`:''}
  <div class="wa3ls">${R.map(x=>{const l=waLast(x),me=l.f&&l.f!=='c',w=waWin(x);return `<button class="wa3i ${c&&c.id===x.id?'on':''} ${x.unread?'un':''}" data-a="waPick" data-id="${x.id}"><span class="sfav">${sfIni(x.n)}${w?'<em class="wdot" title="24-hour window open"></em>':''}</span><div class="b"><div class="r1"><b>${h(x.n)}</b><span>${waTime(x)}</span></div><div class="r2">${me?'✓✓ ':''}${h((l.t||'').slice(0,60))}</div><div class="r3"><span class="stgp" style="--c:${(CM_COL.find(y=>y[0]===cmColOf(x))||[])[3]}">${h(x.stg)}</span>${waOwnP(x)}${waFuP(x)}${(x.tags||[]).slice(0,1).map(waTag).join('')}</div></div>${x.unread?`<span class="cmu">${x.unread}</span>`:''}</button>`}).join('')||`<div class="mempty"><b>No chats match</b>${nF?'<button class="lnk" data-a="waFxClr">Clear filters</button>':''}</div>`}</div></div>`;
 if(!c)return `<div class="wa3 nochat">${list}<div class="wa3c empty"><div>${ic('chat')}<b>Select a chat</b><span>All WhatsApp chats of this company show on the left.</span></div></div></div>`;
 if(c.unread){c.unread=0;save()}
 const w=waWin(c),rt=S.wart||'info',col=(CM_COL.find(y=>y[0]===cmColOf(c))||[])[3]||'#667';
 const bar=`<div class="wa4bar"><button class="wa4stg" style="--c:${col}" data-a="waStgS" data-id="${c.id}"><i></i>${h(c.stg)} ▾</button><button class="wa4p" data-a="waOwnS" data-id="${c.id}" ${cmJunior()?'disabled':''}>${waOwnP(c)}</button>${waFuSt(c)?`<button class="wa4p" data-a="waFuS" data-id="${c.id}">${waFuP(c)}</button>`:''}${(c.tags||[]).map(waTag).join('')}</div>
  <div class="wa4act"><button data-a="waFuS" data-id="${c.id}">${sfi('bell',16)}Follow-up</button><button data-a="waTaskS" data-id="${c.id}">${ic('task')}Task</button><button data-a="waNoteGo"><span>📝</span>Note</button><button data-a="waTags" data-id="${c.id}">${sfi('tag',16)}Tags</button><button data-a="waRt" data-t="time" data-m="1"><span>🕘</span>History</button></div>`;
 const hist=S.waHist?`<div class="wa4hist"><div class="row nw"><b>History</b><span class="sp"></span><button class="ib" data-a="waHistX" aria-label="Close history">✕</button></div>${cmTimeline(c)}</div>`:'';
 const conv=`<div class="wa3c"><div class="wa3h"><button class="ib wa3bk" data-a="waBack" aria-label="Back">‹</button><span class="sfav">${sfIni(c.n)}</span><div style="flex:1;min-width:0"><b>${h(c.n)}</b><div class="xs mut">+91 ${h(c.ph)} · <span class="wwin ${w?'on':''}">${w?`● ${w}h left to reply`:'● Window closed'}</span></div></div><a class="ib wa4wa" href="https://wa.me/91${h(telN(c.ph).slice(-10))}" target="_blank" rel="noopener" aria-label="Open in WhatsApp">${ic('chat')}</a><button class="btn sm" style="background:#1F9D55;border-color:#1F9D55" data-a="cmCall" data-id="${c.id}">${ic('phone')}<span class="hide-m">Call</span></button></div>
  ${bar}${hist}<div class="wa3m" id="cmthr">${cmMsgs(c)}</div>${cmComposer(c)}</div>`;
 const side=`<aside class="wa3r"><div class="cmdg">${cmStgSel(c)}${cmOwnSel(c)}</div><div class="cmdl">Follow-up</div>${waFuSt(c)?`<div class="row nw" style="gap:6px">${waFuP(c)}<span class="sp"></span><button class="lnk" data-a="waFuDone" data-id="${c.id}">Mark done</button></div>`:`<button class="sfmt" data-a="waFuS" data-id="${c.id}">${sfi('bell',13)}Set follow-up</button>`}<div class="cmdl">Tags</div><div class="sftg">${(c.tags||[]).map(waTag).join('')}<button class="sfmt" data-a="waTags" data-id="${c.id}">${sfi('tag',13)}Manage</button></div>
  <div class="cmdt" role="tablist">${[['info','Summary'],['calls','Calls'],['time','Timeline']].map(([k,l])=>`<button class="${rt===k?'on':''}" data-a="waRt" data-t="${k}">${l}</button>`).join('')}</div>${rt==='info'?cmSummary(c):rt==='calls'?cmCallsTab(c):cmTimeline(c)}</aside>`;
 return `<div class="wa3 wa4 ${S.cmd?'sel':''}">${list}${conv}${side}</div>`};

/* filter sheet */
const waNm=(k,L)=>{const n=nmF(k);return L.filter(j=>nmF(j)===n).length>1?n+' · '+((P[k]||{}).r||'').split(' ')[0]:n};
A.waFx=()=>{const x=waFx(),o0=[...new Set(cmList().map(c=>c.to).filter(Boolean))].sort((a,b)=>nmF(a).localeCompare(nmF(b))),own=[...o0,'_none'];
 const grp=(t,g,items)=>`<div class="wa4g"><div class="cmdl">${t}</div><div class="wa4ch">${items.map(([k,l,c])=>`<button class="${(Array.isArray(x[g])?x[g].includes(k):x[g]===k)?'on':''}" ${c?`style="--c:${c}"`:''} data-a="waFxT" data-g="${g}" data-k="${h(k)}">${c?'<i></i>':''}${h(l)}</button>`).join('')}</div></div>`;
 sheet(`<h2>Filter chats</h2>${grp('Lead stage','col',CM_COL.map(y=>[y[0],y[1],y[3]]))}${cmJunior()?'':grp('Assigned to','to',own.map(k=>[k,k==='_none'?'Not assigned':waNm(k,o0)]))}${grp('24-hour window','win',[['open','Open · can reply'],['closed','Closed · template only']])}${grp('Follow-up','fu',[['due','Due today or late'],['late','Overdue'],['later','Upcoming'],['none','No follow-up']])}
  <div class="row nw" style="gap:8px;margin-top:16px"><button class="btn sec" style="flex:1" data-a="waFxClr">Clear</button><button class="btn" style="flex:2" data-a="closeM">Show ${waFxApply(cmList()).length} chats</button></div>`)};
A.waFxT=e=>{const x=waFx(),g=e.dataset.g,k=e.dataset.k;if(Array.isArray(x[g])){const i=x[g].indexOf(k);i<0?x[g].push(k):x[g].splice(i,1)}else x[g]=x[g]===k?'':k;render();A.waFx()};
A.waFxRm=e=>{const x=waFx(),g=e.dataset.g;if(Array.isArray(x[g]))x[g]=x[g].filter(k=>k!==e.dataset.k);else x[g]='';render()};
A.waFxClr=()=>{S.waX={col:[],to:[],win:'',fu:''};closeM();render()};

/* lead actions inside the chat */
const waC=e=>D.wa.find(x=>x.id===(e.dataset.id||S.cmd));
A.waStgS=e=>{const c=waC(e);sheet(`<h2>Lead stage</h2><p class="mut sm">${h(c.n)}</p>${CM_COL.map(y=>`<div class="wa4g"><div class="cmdl" style="color:${y[3]}">${h(y[1])}</div><div class="wa4ch">${y[2].map(s=>`<button class="${c.stg===s?'on':''}" style="--c:${y[3]}" data-a="waStgGo" data-id="${c.id}" data-s="${h(s)}"><i></i>${h(s)}</button>`).join('')}</div></div>`).join('')}`)};
A.waStgGo=e=>{const c=waC(e);closeM();cmSetStg(c,e.dataset.s)};
A.waOwnS=e=>{const c=waC(e);sheet(`<h2>Assign lead</h2><p class="mut sm">${h(c.n)}</p><div class="list">${[...cmOwners(),''].map(k=>`<button class="li" data-a="waOwnGo" data-id="${c.id}" data-k="${k}"><span class="sfav">${k?h(sfIni(nmF(k))):'?'}</span><div class="tx"><b>${k?h(nmF(k)):'Not assigned'}</b>${k?`<div class="m">${h((P[k]||{}).r||'')}</div>`:''}</div>${(c.to||'')===k?'<b style="color:var(--ok,#1F9D55)">✓</b>':''}</button>`).join('')}</div>`)};
A.waOwnGo=e=>{const c=waC(e),k=e.dataset.k||null;closeM();if(c.to===k)return;c.to=k;waLog(c,k?'Assigned to '+nmF(k):'Unassigned');save();render();toast(k?'Assigned to '+nmF(k):'Unassigned')};
A.waNoteGo=()=>{S.waNote=true;render();cmScroll();setTimeout(()=>{const m=document.getElementById('msg');if(m)m.focus()},60)};
A.waHistX=()=>{S.waHist=false;render()};
const _waRt4=A.waRt;A.waRt=e=>{if(e.dataset.m){S.waHist=!S.waHist;render();return}_waRt4(e)};
const _waPick4=A.waPick;A.waPick=e=>{S.waHist=false;_waPick4(e)};

/* follow-up = a dated task for the lead owner, also shown on the chat */
function waTaskSheet(c,fu){const own=c.to||S.me,d1=addD(TODAY,1),cur=fu&&c.fu&&!c.fu.done?c.fu:null;
 const dates=[[TODAY,'Today'],[d1,'Tomorrow'],[addD(TODAY,3),'In 3 days'],[addD(TODAY,7),'Next week']];
 sheet(`<h2>${fu?'Follow-up':'New task'}</h2><p class="mut sm">${h(c.n)} · +91 ${h(c.ph)}</p>
  <label for="wft">What to do</label><input id="wft" value="${h(cur?cur.t:(fu?'Follow up with ':'Call ')+c.n)}">
  <label>When</label><div class="wa4ch" id="wfdc">${dates.map(([d,l],i)=>`<button type="button" class="${(cur?cur.d===d:i===1)?'on':''}" data-a="waFuD" data-d="${d}">${l}</button>`).join('')}</div>
  <div class="row nw" style="gap:8px;margin-top:8px"><input type="date" id="wfd" value="${cur?cur.d:d1}" style="flex:1" aria-label="Date"><input type="time" id="wftm" value="${cur?cur.tm||'':'11:00'}" style="flex:1" aria-label="Time"></div>
  <label for="wfo">Assign to</label><select id="wfo" ${cmJunior()?'disabled':''}>${[...new Set([own,...cmOwners()])].map(k=>`<option value="${k}" ${k===own?'selected':''}>${h(nmF(k))}</option>`).join('')}</select>
  ${fu?'':'<label for="wfn">Details (optional)</label><textarea id="wfn" rows="2"></textarea>'}
  <div class="row nw" style="gap:8px;margin-top:14px">${cur?`<button class="btn sec" style="flex:1" data-a="waFuDone" data-id="${c.id}">Mark done</button>`:''}<button class="btn" style="flex:2" data-a="waTaskGo" data-id="${c.id}" data-fu="${fu?1:''}">${fu?'Save follow-up':'Create task'}</button></div>`)}
A.waFuS=e=>waTaskSheet(waC(e),1);A.waTaskS=e=>waTaskSheet(waC(e),0);
A.waFuD=e=>{const i=document.getElementById('wfd');if(i)i.value=e.dataset.d;document.querySelectorAll('#wfdc button').forEach(b=>b.classList.toggle('on',b===e))};
A.waTaskGo=e=>{const c=waC(e),t=val('wft').trim(),d=val('wfd')||addD(TODAY,1),tm=val('wftm'),o=(document.getElementById('wfo')||{}).value||c.to||S.me,fu=!!e.dataset.fu;if(!t)return toast('Write what to do');
 const tk={id:nid('k'),t,o,by:S.me,proj:((D.projects||[])[0]||{}).id,due:d,tm,st:'To do',pri:'Normal',type:'One-time',tags:[fu?'Follow-up':'Lead','WhatsApp'],desc:`Lead: ${c.n} · +91 ${c.ph}\nStage: ${c.stg}${fu?'':'\n'+(val('wfn')||'')}`,check:[],lead:c.id};
 if(fu){const old=c.fu&&!c.fu.done&&(D.tasks||[]).find(x=>x.id===c.fu.task);if(old){Object.assign(old,{t,o,due:d,tm});tk.id=old.id}else D.tasks.unshift(tk);c.fu={d,tm,t,by:S.me,o,task:tk.id}}else D.tasks.unshift(tk);
 waLog(c,(fu?'Follow-up set · ':'Task added · ')+t+' · '+(d===TODAY?'today':fmt(d))+(tm?' '+tm:'')+(o!==S.me?' · '+nmF(o):''));save();closeM();render();toast(fu?'Follow-up saved':'Task created for '+nmF(o))};
A.waFuDone=e=>{const c=waC(e);if(!c.fu)return;c.fu.done=1;const t=(D.tasks||[]).find(x=>x.id===c.fu.task);if(t)t.st='Done';waLog(c,'Follow-up done · '+c.fu.t);save();closeM();render();toast('Follow-up done')};

/* demo: keep a few chats inside the live 24-hour window so replies can be tested */
(function(){if(typeof fmLive==='function'&&fmLive())return;if(!D||!Array.isArray(D.wa))return;const ago=m=>{const n=new Date(Date.now()-m*60000);return n.toTimeString().slice(0,5)};
 const seed=[['wl1','Priya Enterprises','98220 41763','imran','New lead',['Hot lead'],[['c','Hi, I want to send 3 parcels to Bangalore daily. Rates?',52]],'Meta ad'],
  ['wl2','Kunal Shah','99870 55120','neetu','Quotation sent',['B2C'],[['neetu','Sir ₹540 for 5 kg to Delhi, pickup tomorrow 11 am',95],['c','Can you do ₹500? Then confirm',38]],'WhatsApp'],
  ['wl3','Om Sai Handicrafts','90110 23458','',  'New lead',[],[['c','Need COD shipping for my Instagram store',12]],'Website']];
 const T=(D.wa.find(x=>x.id==='w14')||D.wa[0]||{}).team||'cse';let ch=0;
 seed.forEach(([id,n,ph,to,stg,tags,ms,src])=>{let c=D.wa.find(x=>x.id===id);const fresh=ms.map(([f,t,m])=>({f,t,at:ago(m)}));
  if(!c){c={id,n,ph,team:T,to:to||null,stg,tags,lab:[],unread:ms.filter(m=>m[0]==='c').length,at:TODAY,src,created:TODAY,log:[{at:TODAY,t:'Lead created from '+src}],ms:fresh};D.wa.unshift(c);ch=1}
  else if(c.at!==TODAY){c.at=TODAY;c.ms=c.ms.filter(m=>m.f==='note').concat(fresh);ch=1}});
 const j=D.wa.find(x=>x.id==='w14');if(j&&!j.fu){j.fu={d:TODAY,tm:'17:00',t:'Share delivery timeline with Jagdambika',by:'balaji',o:'balaji'};ch=1}
 if(ch)save()})();

document.head.insertAdjacentHTML('beforeend',`<style>.wa4s{display:flex;gap:8px;align-items:center;padding:10px 12px 0}.wa4s .wa3s{flex:1;min-width:0;margin:0!important}
.wa4fb{position:relative;flex:none;width:42px;height:42px;border-radius:12px;border:1px solid var(--line);background:#fff;display:grid;place-items:center;color:var(--ink);cursor:pointer}.wa4fb.on{background:#E8F3EE;border-color:#1F9D55;color:#147a43}
.wa4fb em{position:absolute;top:-6px;right:-6px;min-width:18px;height:18px;border-radius:9px;background:#1F9D55;color:#fff;font:700 11px/18px Inter,sans-serif;font-style:normal;text-align:center;padding:0 4px}
.wa3l .wa3f{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none}.wa3l .wa3f::-webkit-scrollbar{display:none}.wa3l .wa3f button{flex:none;white-space:nowrap}
.wa4on{display:flex;gap:6px;overflow-x:auto;padding:2px 0 8px;scrollbar-width:none}.wa4on button{flex:none;border:0;border-radius:99px;background:#E8F3EE;color:#147a43;font:600 12px Inter,sans-serif;padding:5px 10px;cursor:pointer;white-space:nowrap}.wa4on .clr{background:none;color:var(--mut);text-decoration:underline}
.waown{display:inline-flex;align-items:center;gap:4px;font:600 11px Inter,sans-serif;color:#33415C;background:#EEF1F7;border-radius:99px;padding:2px 8px 2px 2px;white-space:nowrap}.waown i{width:16px;height:16px;border-radius:50%;background:#24408E;color:#fff;font:700 8px/16px Inter,sans-serif;font-style:normal;text-align:center}.waown.no{background:#FDECEC;color:#B42318}.waown.no i{background:#B42318}
.wafu{display:inline-flex;align-items:center;gap:3px;font:600 11px Inter,sans-serif;border-radius:99px;padding:2px 8px;white-space:nowrap;background:#EEF4FF;color:#2F5BC4}.wafu.today{background:#FFF4E0;color:#A15C00}.wafu.late{background:#FDECEC;color:#B42318}
.wa3i .r3{display:flex;gap:4px;flex-wrap:wrap;align-items:center}
.wa4bar{display:flex;gap:6px;align-items:center;padding:8px 12px;background:#fff;border-bottom:1px solid var(--line);overflow-x:auto;scrollbar-width:none}.wa4bar::-webkit-scrollbar{display:none}.wa4bar>*{flex:none}
.wa4stg{display:inline-flex;align-items:center;gap:6px;border:1.5px solid var(--c);color:var(--c);background:#fff;border-radius:99px;padding:4px 10px;font:700 12px Inter,sans-serif;cursor:pointer}.wa4stg i,.wa4ch i{width:8px;height:8px;border-radius:50%;background:var(--c);display:inline-block}
.wa4p{border:0;background:none;padding:0;cursor:pointer}.wa4p:disabled{cursor:default}
.wa4act{display:flex;gap:6px;padding:6px 12px 8px;background:#fff;border-bottom:1px solid var(--line);overflow-x:auto;scrollbar-width:none}.wa4act::-webkit-scrollbar{display:none}
.wa4act button{flex:1 1 0;min-width:58px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;border:1px solid var(--line);background:#F7F8FB;border-radius:12px;padding:7px 4px;font:600 11px Inter,sans-serif;color:#33415C;cursor:pointer;white-space:nowrap}.wa4act button svg{width:15px;height:15px}
.wa4hist{background:#fff;border-bottom:1px solid var(--line);padding:10px 12px;max-height:45vh;overflow-y:auto}
.wa4g{margin-top:12px}.wa4ch{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}.wa4ch button{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);background:#fff;border-radius:99px;padding:7px 12px;font:600 13px Inter,sans-serif;color:var(--ink);cursor:pointer}
.wa4ch button.on{background:#24408E;border-color:#24408E;color:#fff}.wa4ch button.on i{background:#fff}
.wa4wa{color:#1F9D55}.wa4 .wa3bk{border:0!important;background:none!important;font-size:28px;width:28px;padding:0}.wa4 .cmwin{padding:4px 12px!important;font-size:11.5px}.wa4 .cmdr2 .ib{border:0;background:#F2F4F7;border-radius:10px}.wa4 .wa3h .sfav{box-shadow:none}
@media(min-width:1201px){.wa4 .wa4bar,.wa4 .wa4act,.wa4 .wa4hist{display:none}}
@media(max-width:820px){
 html.mob:has(.wa4.sel) .ov{z-index:400}
 html.mob .wa4.sel{position:fixed;inset:0;z-index:300;height:auto!important;border-radius:0;margin:0;background:#EFEAE2;padding-top:env(safe-area-inset-top)}
 html.mob .wa4.sel .wa3c{height:100%;display:flex}
 html.mob:has(.wa4.sel) .mcrfab,html.mob:has(.wa4.sel) #mwho{display:none!important}
 html.mob .wa4 .wa3h{padding:8px 10px}
 html.mob .wa4 .wa3lock{gap:8px;padding:10px 12px;flex-wrap:nowrap}html.mob .wa4 .wa3lock b{font-size:13px}html.mob .wa4 .wa3lock span{font-size:11.5px;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
 html.mob .wa4 .wa3lock>div:first-child{min-width:0}html.mob .wa4 .wa3lock .btn{white-space:nowrap}
 html.mob .wa4 .wa3m{flex:1;min-height:0;overflow-y:auto}
}</style>`);
/* lead panel: tabs and history filters each stay on one scrolling row; history grouped by date */
document.head.insertAdjacentHTML('beforeend',`<style>
.cmdt,.cmtf{flex-wrap:nowrap!important;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch}.cmdt::-webkit-scrollbar,.cmtf::-webkit-scrollbar{display:none}
.cmdt button,.cmtf button{flex:none;white-space:nowrap}
.cmtf{margin:8px 0 4px!important;padding-bottom:2px}.cmtf button{padding:5px 11px!important}
.cmtl2 .cmtd{position:sticky;top:0;z-index:2;background:linear-gradient(#fff 75%,rgba(255,255,255,0));padding:6px 0 4px;margin:6px 0 2px!important}
.cmte2{padding-bottom:8px!important}.cmte2 .b{padding:7px 10px!important}.cmte2 .t{font-size:13px!important}
.cmdh .ib[data-a="cmX"]{border:0!important;background:#F2F4F7!important;border-radius:50%;width:36px;height:36px}
@media(max-width:820px){.cmd .cmdh .sfav.big{width:44px;height:44px;font-size:15px}.cmd .cmdh{margin-bottom:8px}.cmd .cmda .btn{min-height:42px}.cmd .cmdg{gap:8px}.cmd .cmdg select{min-height:42px}}
</style>`);

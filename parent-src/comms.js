/* ===================== COMMUNICATION = CRM communication, company-wise =====================
   Top bar:  [Company ▸ Logistics | GovaaBazaar | Jupiter | HR | Studios]   CRM · WhatsApp · Calls   |   Personal: Email · Chat
   • CRM, WhatsApp and Calls follow the company you pick (each company has its own number). Shared inbox: everyone in the
     company sees every customer and who replied last.  • Email and Chat are personal (your own mailbox, internal groups).
   • Staff land on their own company (Neetu → Logistics). Google Meet / notetaker tab removed from here. */
const CM_CO=[['log','JDAC Logistics',['cse','ops'],'Logistics','#02496A'],['gb','GovaaBazaar',['gb'],'GovaaBazaar','#7a4a26'],['jup','Jupiter Pune',['jup'],'Jupiter','#139B5F'],['hr','HR Consultancy',['hr'],'HR','#7A2E8E'],['studios','JDAC Studios',[],'Studios','#0796A6']];
const cmInfo=k=>k==='all'?['all','All companies',CM_CO.flatMap(x=>x[2]),'All','#24408E']:(CM_CO.find(x=>x[0]===k)||CM_CO[0]);
const cmCos=()=>isAdm()?['all',...CM_CO.map(x=>x[0])]:[TEAMCO[(P[S.me]||{}).team]||'log'].filter(k=>CM_CO.some(x=>x[0]===k));
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

chatHead=function(){const m=S.chm,co=cmCo(),cos=cmCos(),T=myWaTeams(),G=myGroups(),unT=G.reduce((a,g)=>a+unreadG(g),0),waN=D.wa.filter(c=>T.includes(c.team)&&c.unread).length,inf=cmInfo(co);
 const nums=co==='all'?CM_CO.map(x=>cmNum(x[0])).filter(n=>n.wa||n.vn).length:0,n=cmNum(co);
 const seg=(k,l,i,c)=>`<button class="${m===k?'on':''}" data-a="chm" data-t="${k}" role="tab" aria-selected="${m===k}">${ic(i)}<span>${l}</span>${c?`<em>${c}</em>`:''}</button>`;
 const pers=(k,l,i,c)=>`<button class="cpb ${m===k?'on':''}" data-a="chm" data-t="${k}" title="${l}">${ic(i)}<span>${l}</span>${c?`<em>${c}</em>`:''}</button>`;
 return `<div class="cmh2"><div class="cmh2-l">
   <div class="ccsel" style="--cc:${inf[4]}"><i></i><div><small>Company</small>${cos.length>1?`<select data-ch="cmCoSel" aria-label="Company">${cos.map(k=>`<option value="${k}" ${co===k?'selected':''}>${h(cmInfo(k)[1])}</option>`).join('')}</select>`:`<b>${h(inf[1])}</b>`}</div></div>
   <div class="cseg" role="tablist">${T.length?seg('crm','CRM','users',0)+seg('wa','WhatsApp','chat',waN):''}${seg('call','Calls','phone',0)}</div></div>
  <div class="cmh2-r"><span class="cpl">Personal</span>${pers('email','Email','mail',0)}${pers('team','Team chat','chat',unT)}</div></div>
  ${['crm','wa','call'].includes(m)?`<div class="cnum"><span class="cdot"></span>${co==='all'?`All company numbers · ${nums} of ${CM_CO.length} connected`:`Customers reach <b>${h(n.n||inf[1])}</b> on ${n.wa||n.vn?`<b>${h(n.wa||n.vn)}</b>`:'<span class="mut">number to be added</span>'}`}<span class="mut"> · shared inbox — the team sees every customer and who replied</span></div>`:''}`};
document.addEventListener('change',e=>{const d=e.target&&e.target.dataset;if(d&&d.ch==='cmCoSel'){A.cmCo({dataset:{k:e.target.value}})}});
A.cmCo=e=>{S.cmco=e.dataset.k;S.wat='';S.wac=null;S.cmd=null;S.cco=e.dataset.k==='all'?'log':e.dataset.k;if(!myWaTeams().length&&['crm','wa'].includes(S.chm))S.chm='call';render()};

function crmView(){const co=cmCo(),T=myWaTeams();if(!T.length)return `<div class="list">${empty('No customer inbox for this company yet','WhatsApp leads show here once this company has its WhatsApp number')}</div>`;
 const q=(S.cmq||'').toLowerCase(),who=S.cmw||'all';
 const all=D.wa.filter(c=>T.includes(c.team)),own=[...new Set(all.map(c=>c.to).filter(Boolean))];
 const L=all.filter(c=>who==='all'?true:who==='un'?!c.to:c.to===who).filter(c=>!q||c.n.toLowerCase().includes(q)||String(c.ph).replace(/\s/g,'').includes(q.replace(/\s/g,'')));
 const k=(v,l,c,f)=>`<button class="ck ${c} ${S.cmf===f?'on':''}" data-a="cmF" data-f="${f}"><b>${v}</b><span>${l}</span></button>`;
 const waitF=c=>waLast(c).f==='c'&&!['done','lost'].includes(cmColOf(c));
 const kpi=`<div class="ckpi">${k(all.filter(c=>cmColOf(c)==='new').length,'New leads','b','new')}${k(all.filter(waitF).length,'Waiting for our reply','o','wait')}${k(all.filter(c=>!c.to).length,'Not assigned','r','un')}${k(all.filter(c=>c.stg==='Payment pending').length,'Payment pending','p','pay')}${k(all.filter(c=>cmColOf(c)==='pick').length,'Booked · pickup','g','pick')}</div>`;
 const F={new:c=>cmColOf(c)==='new',wait:waitF,un:c=>!c.to,pay:c=>c.stg==='Payment pending',pick:c=>cmColOf(c)==='pick'}[S.cmf];
 const LL=F?L.filter(F):L;
 const bar=`<div class="cmbar"><div class="sfq">${sfi('search',16)}<label class="sr" for="cmq">Search customers</label><input id="cmq" value="${h(S.cmq||'')}" placeholder="Search name or number"></div>
  <select class="t4sel" data-ch="cmw" aria-label="Lead owner"><option value="all">Everyone's leads</option><option value="un" ${who==='un'?'selected':''}>Not assigned</option>${own.map(x=>`<option value="${x}" ${who===x?'selected':''}>${h(nmF(x))}</option>`).join('')}</select>
  ${S.cmf?`<button class="tclr" data-a="cmF" data-f="${S.cmf}">✕ Clear filter</button>`:''}<span class="sp"></span><span class="xs mut hide-m">Drag a card to change its stage</span><button class="btn sm" data-a="waNew">${ic('plus')}New lead</button></div>`;
 const card=c=>{const l=waLast(c),by=l.f&&l.f!=='c'?nmF(l.f).split(' ')[0]:'Customer',ci=coOfTeam(c.team);
  return `<div class="cmc ${c.unread?'un':''} ${S.cmd===c.id?'sel':''}" draggable="true" data-cid="${c.id}"><button class="cmt" data-a="cmOpen" data-id="${c.id}"><span class="sfav ${c.unread?'ring':''}">${sfIni(c.n)}</span><span class="cmn"><b>${h(c.n)}</b><small>+91 ${h(c.ph)}</small></span>${c.unread?`<span class="cmu">${c.unread}</span>`:''}</button>
   ${co==='all'?`<span class="cmco" style="--cc:${ci[4]}">${h(ci[3])}</span>`:''}<div class="cml"><b>${h(by)}:</b> ${h((l.t||'').slice(0,70))}<span>${waTime(c)} · ${h(c.stg)}</span></div>
   <div class="cmf">${c.to?`<span class="cmo">${av(nm(c.to),'s')}${h(nmF(c.to).split(' ')[0])}</span>`:'<span class="cmo none">Not assigned</span>'}<span class="sp"></span><button class="cmb wa" data-a="cmChat" data-id="${c.id}" title="Open WhatsApp chat">${ic('chat')}</button><button class="cmb call" data-a="cmCall" data-id="${c.id}" title="Call from company number">${ic('phone')}</button></div></div>`};
 const board=`<div class="cmboard">${CM_COL.map(([k,l,,col])=>{const C=LL.filter(c=>cmColOf(c)===k).sort((a,b)=>(b.at>a.at?1:b.at<a.at?-1:(waLast(b).at||'').localeCompare(waLast(a).at||'')));
  return `<div class="cmcol" style="--c:${col}" data-col="${k}"><div class="cmh"><i></i><b>${l}</b><span>${C.length}</span></div>${C.map(card).join('')||'<div class="cmdrop">Drop here</div>'}</div>`}).join('')}</div>`;
 const d=S.cmd&&D.wa.find(x=>x.id===S.cmd&&T.includes(x.team));if(!d)S.cmd=null;
 return kpi+bar+`<div class="cmlay ${d?'open':''}">${board}${d?cmDrawer(d):''}</div>`}

/* lead drawer: everything about the customer without leaving the CRM */
function cmDrawer(c){const ci=coOfTeam(c.team),M=c.ms.slice(-6),own=STAFF.filter(k=>isAdm()?!isZen(k):(P[k]||{}).team===(P[S.me]||{}).team);
 return `<aside class="cmd" aria-label="Lead details"><div class="cmdh"><span class="sfav big">${sfIni(c.n)}</span><div style="flex:1;min-width:0"><b>${h(c.n)}</b><div class="xs mut">+91 ${h(c.ph)} · <span style="color:${ci[4]};font-weight:700">${h(ci[1])}</span></div></div><button class="ib" data-a="cmX" aria-label="Close">✕</button></div>
  <div class="cmda"><button class="btn sm" style="background:#1F9D55;border-color:#1F9D55" data-a="cmCall" data-id="${c.id}">${ic('phone')}Call</button><button class="btn sm sec" data-a="cmChat" data-id="${c.id}">${ic('chat')}Open full chat</button></div>
  <div class="cmdg"><label>Stage<select data-ch="cmStg" data-id="${c.id}">${WASTG.map(s=>`<option ${c.stg===s?'selected':''}>${s}</option>`).join('')}</select></label>
   <label>Lead owner<select data-ch="waTo" data-id="${c.id}"><option value="">Not assigned</option>${own.map(k=>`<option value="${k}" ${c.to===k?'selected':''}>${h(nmF(k))}</option>`).join('')}</select></label></div>
  ${c.tags&&c.tags.length?`<div class="sftg" style="margin:0 0 10px">${c.tags.map(waTag).join('')}</div>`:''}
  <div class="cmdl">Recent messages</div><div class="cmdm">${M.map(m=>m.f==='note'?`<div class="wnote"><b>Note · ${h(nmF(m.by))}</b>${h(m.t)}</div>`:`<div class="cmbb ${m.f!=='c'?'me':''}">${m.f!=='c'?`<b>${h(nmF(m.f).split(' ')[0])}</b>`:''}${h(m.t||'')}<span>${m.at||''}</span></div>`).join('')||'<div class="xs mut">No messages yet</div>'}</div>
  <div class="cmdr"><input id="cmrep" placeholder="Reply on WhatsApp…" data-enter="cmSend"><button class="btn sm" data-a="cmSend" data-id="${c.id}">Send</button></div>
  <div class="cmdl">Activity</div><div class="cmdlog">${(c.log||[]).slice(0,6).map(x=>`<div><span>${fmt(x.at)}${x.tm?' '+x.tm:''}</span>${h(x.t)}${x.by?' · '+h(nmF(x.by)):''}</div>`).join('')||'<div class="xs mut">—</div>'}</div></aside>`}
A.cmOpen=e=>{S.cmd=S.cmd===e.dataset.id?null:e.dataset.id;const c=D.wa.find(x=>x.id===S.cmd);if(c)c.unread=0;save();render()};
A.cmX=()=>{S.cmd=null;render()};
A.cmChat=e=>{S.chm='wa';S.wac=e.dataset.id;S.wat='';render();const t=document.getElementById('thr');if(t)t.scrollTop=1e6};
A.cmF=e=>{S.cmf=S.cmf===e.dataset.f?null:e.dataset.f;render()};
A.cmSend=e=>{const c=D.wa.find(x=>x.id===(e&&e.dataset&&e.dataset.id||S.cmd));const t=val('cmrep');if(!c||!t)return;c.ms.push({f:S.me,t,at:nowT()});if(!c.to)c.to=S.me;c.at=TODAY;if(c.stg==='Open'){c.stg='Contacted';waLog(c,'Stage → Contacted')}save();render();toast('Sent on WhatsApp'+((cmNum(WACO[c.team])||{}).wa?'':' · goes out once the WhatsApp API is connected'))};
A.cmCall=e=>{const c=D.wa.find(x=>x.id===e.dataset.id);if(!c)return;const co=WACO[c.team]||'log',n=cmNum(co);
 D.callLog.push({id:nid('cl'),k:S.me,co,to:c.n,ph:c.ph,dir:'out',at:nowT(),d:TODAY,dur:'—',st:'Calling'});waLog(c,'Call to customer from '+(n.n||'company number'));save();render();
 toast(`Calling ${c.n} from ${n.n||'company'}${n.vn?' ('+n.vn+')':''} — the call connects once the calling service is linked`)};
const cmSetStg=(c,s)=>{if(!c||c.stg===s)return;c.stg=s;waLog(c,'Stage → '+s);save();render();toast(`${c.n} → ${s}`)};
document.addEventListener('change',e=>{const d=e.target&&e.target.dataset;if(!d)return;if(d.ch==='cmw'){S.cmw=e.target.value;render()}if(d.ch==='cmStg'){cmSetStg(D.wa.find(x=>x.id===d.id),e.target.value)}});
document.addEventListener('input',e=>{if(e.target.id==='cmq'){S.cmq=e.target.value;const p=e.target.selectionStart;render();const i=document.getElementById('cmq');if(i){i.focus();i.setSelectionRange(p,p)}}});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target&&e.target.id==='cmrep'){e.preventDefault();A.cmSend({dataset:{id:S.cmd}})}});
/* drag a card to another column = change stage */
document.addEventListener('dragstart',e=>{const c=e.target.closest&&e.target.closest('.cmc');if(c){e.dataTransfer.setData('text/plain',c.dataset.cid);c.classList.add('drag')}});
document.addEventListener('dragend',e=>{const c=e.target.closest&&e.target.closest('.cmc');if(c)c.classList.remove('drag');document.querySelectorAll('.cmcol.over').forEach(x=>x.classList.remove('over'))});
document.addEventListener('dragover',e=>{const col=e.target.closest&&e.target.closest('.cmcol');if(col){e.preventDefault();document.querySelectorAll('.cmcol.over').forEach(x=>x!==col&&x.classList.remove('over'));col.classList.add('over')}});
document.addEventListener('drop',e=>{const col=e.target.closest&&e.target.closest('.cmcol');if(!col)return;e.preventDefault();const id=e.dataTransfer.getData('text/plain'),c=D.wa.find(x=>x.id===id),k=col.dataset.col,stg=(CM_COL.find(x=>x[0]===k)||[])[2];if(c&&stg&&cmColOf(c)!==k)cmSetStg(c,stg[0]);else render()});

const _vChatCM=V.chat;V.chat=()=>{if(['meet','notes'].includes(S.chm)||!S.chm)S.chm=myWaTeams().length?'crm':'team';if(['crm','wa'].includes(S.chm)&&!myWaTeams().length)S.chm='call';
 S.cco=cmCo();
 if(S.chm==='crm')return `<div class="cmwrap">${chatHead()}${crmView()}</div>`;
 let o=_vChatCM();
 /* the Call button inside a WhatsApp chat calls from the company number, not the phone's own SIM */
 o=o.replace(/<a class="sfcall" href="tel:[^"]*" data-a="waCallLog" data-id="([^"]+)">/g,'<a class="sfcall" href="#" data-a="cmCall" data-id="$1">');
 return o};
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

/* ===== Campaigns live inside JDAC Studios (Clients · Ad accounts · Campaigns), not in the main menu for Darshan sir / Nameera ===== */
CTABS.studios=[['clients','Clients'],['ads','Ad accounts'],['camp','Campaigns']];
const _tabsCampX=tabsFor;tabsFor=function(who){const T=_tabsCampX(who),k=(P[who||S.me]||{}).kind;return (k==='boss'||k==='hr')?T.filter(x=>x[0]!=='camp'):T};
CP['studios:camp']=()=>{const o=V.camp();return o.replace(/<h1>Campaigns<\/h1>(<p class="mut sm"[^>]*>[\s\S]*?<\/p>)?/,'')};
if(S.v==='camp'&&isAdm()){S.v='co';S.co='studios';S.tab='camp'}
render();


/* ===================== COMMUNICATION = CRM communication, company-wise =====================
   Top bar:  [Company ▸ Logistics | GovaaBazaar | Jupiter | HR | Studios]   CRM · WhatsApp · Calls   |   Personal: Email · Chat
   • CRM, WhatsApp and Calls follow the company you pick (each company has its own number). Shared inbox: everyone in the
     company sees every customer and who replied last.  • Email and Chat are personal (your own mailbox, internal groups).
   • Staff land on their own company (Neetu → Logistics). Google Meet / notetaker tab removed from here. */
const CM_CO=[['log','JDAC Logistics',['cse','ops'],'Logistics'],['gb','GovaaBazaar',['gb'],'GovaaBazaar'],['jup','Jupiter Pune',['jup'],'Jupiter'],['hr','HR Consultancy',['hr'],'HR'],['studios','JDAC Studios',[],'Studios']];
const cmCos=()=>isAdm()?CM_CO.map(x=>x[0]):[TEAMCO[(P[S.me]||{}).team]||'log'].filter(k=>CM_CO.some(x=>x[0]===k));
const cmCo=()=>{const L=cmCos();if(!L.includes(S.cmco))S.cmco=L[0]||'log';return S.cmco};
const cmTeams=co=>(CM_CO.find(x=>x[0]===co)||[,,[]])[2];
const cmNum=co=>D.comNums[co]||{};
/* WhatsApp inbox shows only the chosen company's number(s) */
const _myWaCM=myWaTeams;myWaTeams=function(){const T=_myWaCM();return S.v==='chat'?T.filter(t=>cmTeams(cmCo()).includes(t)):T};

/* stages → CRM columns (Superfone flow) */
const CM_COL=[['new','New lead',['Open'],'#2F6BE0'],['con','Contacted',['Contacted'],'#0B6E8A'],['quo','Quotation & chase',['Quotation sent','Q Chase 1','Q Chase 2'],'#B8860B'],
 ['pick','Booking · pickup',['Pickup'],'#7A2E8E'],['pay','Payment',['Payment pending','Payment paid'],'#E8772E'],['done','Delivered / closed',['Delivered','Closed'],'#1F9D55'],['lost','Lost / irrelevant',['LSRATE','LSUN'],'#C0392B']];
const cmColOf=c=>(CM_COL.find(x=>x[2].includes(c.stg))||CM_COL[0])[0];

chatHead=function(){const m=S.chm,co=cmCo(),cos=cmCos(),T=myWaTeams(),n=cmNum(co),G=myGroups(),unT=G.reduce((a,g)=>a+unreadG(g),0),waN=D.wa.filter(c=>T.includes(c.team)&&c.unread).length;
 const tb=(k,l,i,c)=>`<button class="${m===k?'on':''}" data-a="chm" data-t="${k}">${ic(i)}${l}${c?`<span class="n">${c}</span>`:''}</button>`;
 return `<div class="cbar"><div class="cbg cco"><span class="cbl">Company</span>${cos.length>1?cos.map(k=>`<button class="ccp ${co===k?'on':''}" data-a="cmCo" data-k="${k}" title="${h((CM_CO.find(x=>x[0]===k)||[,k])[1])}">${h((CM_CO.find(x=>x[0]===k)||[,,,k])[3])}</button>`).join(''):`<b class="ccone">${h((CM_CO.find(x=>x[0]===co)||[,co])[1])}</b>`}</div>
  <div class="cbg ctab">${T.length?tb('crm','CRM','users',0)+tb('wa','WhatsApp','chat',waN):''}${tb('call','Calls','phone',0)}</div>
  <span class="sp"></span><div class="cbg ctab me"><span class="cbl">Personal</span>${tb('email','Email','mail',0)}${tb('team','Chat','chat',unT)}</div></div>
  ${['crm','wa','call'].includes(m)?`<div class="cnum">${ic('phone')}WhatsApp &amp; calls go out from <b>${h(n.n||'')}</b> · ${n.wa||n.vn?h(n.wa||n.vn):'<span class="mut">company number to be added</span>'}<span class="mut"> · shared: everyone in ${h((CM_CO.find(x=>x[0]===co)||[,''])[1])} sees every customer and who replied</span></div>`:''}`};
A.cmCo=e=>{S.cmco=e.dataset.k;S.wat='';S.wac=null;S.cco=e.dataset.k;if(!myWaTeams().length&&['crm','wa'].includes(S.chm))S.chm='call';render()};

function crmView(){const co=cmCo(),T=myWaTeams();if(!T.length)return `<div class="list">${empty('No customer inbox for this company yet','WhatsApp leads show here once this company has its WhatsApp number')}</div>`;
 const q=(S.cmq||'').toLowerCase(),who=S.cmw||'all';
 let L=D.wa.filter(c=>T.includes(c.team)).filter(c=>who==='all'?true:who==='un'?!c.to:c.to===who).filter(c=>!q||c.n.toLowerCase().includes(q)||String(c.ph).replace(/\s/g,'').includes(q.replace(/\s/g,'')));
 const all=D.wa.filter(c=>T.includes(c.team)),own=[...new Set(all.map(c=>c.to).filter(Boolean))];
 const k=(v,l,c)=>`<div class="ck ${c}"><b>${v}</b><span>${l}</span></div>`;
 const kpi=`<div class="ckpi">${k(all.filter(c=>cmColOf(c)==='new').length,'New leads','b')}${k(all.filter(c=>waLast(c).f==='c'&&!['done','lost'].includes(cmColOf(c))).length,'Waiting for our reply','o')}${k(all.filter(c=>!c.to).length,'Not assigned','r')}${k(all.filter(c=>c.stg==='Payment pending').length,'Payment pending','p')}${k(all.filter(c=>cmColOf(c)==='pick').length,'Booked · pickup','g')}</div>`;
 const bar=`<div class="cmbar"><div class="sfq">${sfi('search',16)}<label class="sr" for="cmq">Search customers</label><input id="cmq" value="${h(S.cmq||'')}" placeholder="Search name or number"></div>
  <select class="t4sel" data-ch="cmw" aria-label="Lead owner"><option value="all">Everyone's leads</option><option value="un" ${who==='un'?'selected':''}>Not assigned</option>${own.map(x=>`<option value="${x}" ${who===x?'selected':''}>${h(nmF(x))}</option>`).join('')}</select>
  <span class="sp"></span><button class="btn sm" data-a="waNew">${ic('plus')}New lead</button></div>`;
 const card=c=>{const l=waLast(c),by=l.f&&l.f!=='c'?nmF(l.f).split(' ')[0]:'Customer';
  return `<div class="cmc ${c.unread?'un':''}"><button class="cmt" data-a="cmOpen" data-id="${c.id}"><span class="sfav ${c.unread?'ring':''}">${sfIni(c.n)}</span><span class="cmn"><b>${h(c.n)}</b><small>+91 ${h(c.ph)} · ${h(c.stg)}</small></span>${c.unread?`<span class="cmu">${c.unread}</span>`:''}</button>
   <div class="cml"><b>${h(by)}:</b> ${h((l.t||'').slice(0,70))}<span>${waTime(c)}</span></div>
   <div class="cmf">${c.to?`<span class="cmo">${av(nm(c.to),'s')}${h(nmF(c.to).split(' ')[0])}</span>`:'<span class="cmo none">Not assigned</span>'}<span class="sp"></span><button class="cmb wa" data-a="cmOpen" data-id="${c.id}" title="WhatsApp">${ic('chat')}</button><button class="cmb call" data-a="cmCall" data-id="${c.id}" title="Call from company number">${ic('phone')}</button></div></div>`};
 return kpi+bar+`<div class="cmboard">${CM_COL.map(([k,l,,col])=>{const C=L.filter(c=>cmColOf(c)===k).sort((a,b)=>(b.at>a.at?1:b.at<a.at?-1:(waLast(b).at||'').localeCompare(waLast(a).at||'')));
  return `<div class="cmcol" style="--c:${col}"><div class="cmh"><i></i><b>${l}</b><span>${C.length}</span></div>${C.map(card).join('')||'<div class="t4none">—</div>'}</div>`}).join('')}</div>`}
A.cmOpen=e=>{S.chm='wa';S.wac=e.dataset.id;const c=D.wa.find(x=>x.id===e.dataset.id);if(c)S.wat='';render();const t=document.getElementById('thr');if(t)t.scrollTop=1e6};
A.cmCall=e=>{const c=D.wa.find(x=>x.id===e.dataset.id);if(!c)return;const co=WACO[c.team]||cmCo(),n=cmNum(co);
 D.callLog.push({id:nid('cl'),k:S.me,co,to:c.n,ph:c.ph,dir:'out',at:nowT(),d:TODAY,dur:'—',st:'Calling'});waLog(c,'Call to customer from '+(n.n||'company number'));save();render();
 toast(`Calling ${c.n} from ${n.n||'company'}${n.vn?' ('+n.vn+')':''} — the call connects once the calling service is linked`)};
document.addEventListener('change',e=>{const d=e.target&&e.target.dataset;if(d&&d.ch==='cmw'){S.cmw=e.target.value;render()}});
document.addEventListener('input',e=>{if(e.target.id==='cmq'){S.cmq=e.target.value;const p=e.target.selectionStart;render();const i=document.getElementById('cmq');if(i){i.focus();i.setSelectionRange(p,p)}}});

const _vChatCM=V.chat;V.chat=()=>{if(['meet','notes'].includes(S.chm)||!S.chm)S.chm=myWaTeams().length?'crm':'team';if(['crm','wa'].includes(S.chm)&&!myWaTeams().length)S.chm='call';
 S.cco=cmCo();
 if(S.chm==='crm')return `<div class="cmwrap">${chatHead()}${crmView()}</div>`;
 let o=_vChatCM();
 /* the Call button inside a WhatsApp chat calls from the company number, not the phone's own SIM */
 o=o.replace(/<a class="sfcall" href="tel:[^"]*" data-a="waCallLog" data-id="([^"]+)">/g,'<a class="sfcall" href="#" data-a="cmCall" data-id="$1">');
 return o};
const _rCM=render;render=function(){_rCM.apply(this,arguments);try{document.body.classList.toggle('cmmode',S.v==='chat')}catch(x){}};

document.head.insertAdjacentHTML('beforeend',`<style>
.cbar{display:flex;align-items:center;gap:8px;flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;background:#fff;border:1px solid var(--line);border-radius:14px;padding:8px 10px;margin:0 0 8px}
.cbg{display:flex;align-items:center;gap:3px;flex:none}.cbg>*{flex:none;white-space:nowrap}
@media(min-width:761px){body.cmmode header.hd{display:none!important}}
.cbl{font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--mut);padding:0 6px 0 4px}
.cco{background:#F4F6FA;border-radius:12px;padding:4px}
.ccp{border:0;background:transparent;border-radius:9px;padding:7px 11px;font:700 13px Inter,sans-serif;color:#4A5468;cursor:pointer}
.ccp.on{background:#24408E;color:#fff}.ccone{font-size:14px;padding:6px 10px;color:#24408E}
.ctab button{display:inline-flex;align-items:center;gap:6px;border:1px solid transparent;background:none;border-radius:10px;padding:8px 11px;font:700 13.5px Inter,sans-serif;color:var(--mut);cursor:pointer}
.ctab button .ico{width:16px;height:16px}.ctab button:hover{background:#F4F6FA;color:var(--ink)}
.ctab button.on{background:#FFF4E8;border-color:#F28C28;color:#B4570B}
.ctab .n{background:#E5484D;color:#fff;border-radius:999px;font-size:11px;padding:0 6px;margin-left:2px}
.ctab.me{border-left:1px solid var(--line);padding-left:8px}
.cnum{display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:12.5px;margin:0 2px 10px}.cnum .ico{width:14px;height:14px;color:#1F9D55}
body.cmmode .ctabs.cdock{display:none!important}
.sfwrap2 .sf{height:calc(100vh - 150px)!important}
.ckpi{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:10px}
.ck{background:#fff;border:1px solid var(--line);border-left:4px solid var(--c);border-radius:12px;padding:10px 12px}.ck b{display:block;font-size:22px}.ck span{font-size:12px;color:var(--mut);font-weight:600}
.ck.b{--c:#2F6BE0}.ck.o{--c:#E8772E}.ck.r{--c:#C0392B}.ck.p{--c:#7A2E8E}.ck.g{--c:#1F9D55}
.cmbar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px}.cmbar .sfq{min-width:240px;background:#fff;border:1px solid var(--line)}
.cmboard{display:flex;gap:10px;overflow-x:auto;padding-bottom:10px;align-items:flex-start}
.cmcol{flex:0 0 260px;background:#F4F6FA;border-radius:14px;padding:8px;max-height:calc(100vh - 300px);overflow-y:auto}
.cmh{display:flex;align-items:center;gap:7px;padding:4px 4px 8px;position:sticky;top:-8px;background:#F4F6FA;z-index:1}.cmh i{width:9px;height:9px;border-radius:50%;background:var(--c)}.cmh b{font-size:13px}.cmh span{margin-left:auto;font-size:12px;font-weight:700;background:#fff;border-radius:999px;padding:0 8px}
.cmc{background:#fff;border:1px solid #E6E9EF;border-left:3px solid var(--c);border-radius:12px;padding:9px 10px;margin-bottom:8px}.cmc.un{box-shadow:0 0 0 1px #2F6BE0 inset}
.cmt{display:flex;align-items:center;gap:8px;width:100%;border:0;background:none;padding:0;text-align:left;cursor:pointer;font:inherit;color:var(--ink)}
.cmn{display:flex;flex-direction:column;min-width:0;flex:1}.cmn b{font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cmn small{font-size:11.5px;color:var(--mut)}
.cmu{background:#1F9D55;color:#fff;border-radius:999px;font-size:11px;font-weight:800;padding:1px 7px}
.cml{font-size:12.5px;color:#3B4456;margin:7px 0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.cml span{display:block;font-size:11px;color:var(--mut)}
.cmf{display:flex;align-items:center;gap:6px}.cmo{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:700}.cmo.none{color:#C0392B}
.cmb{width:32px;height:32px;border-radius:9px;border:1px solid var(--line);background:#fff;display:inline-flex;align-items:center;justify-content:center;cursor:pointer}.cmb .ico{width:16px;height:16px}
.cmb.wa{color:#1F9D55}.cmb.call{color:#24408E}.cmb:hover{background:#F4F6FA}
@media(max-width:760px){.cbl{display:none}.ctab.me{padding-left:4px}.cmcol{flex-basis:240px;max-height:none}.cnum span.mut{display:none}.ckpi{display:flex;overflow-x:auto;gap:8px}.ck{flex:0 0 120px;padding:8px 10px}.ck b{font-size:18px}.cmbar .sfq{min-width:0;flex:1 1 100%}}
</style>`);
render();

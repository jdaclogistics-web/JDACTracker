/* ===================== JDAC STUDIOS · three departments + Creative Library =====================
   Studios works for every company as a client (like the CRMs in Communication: pick a client, work in it):
   · Performance marketing — campaign plan per client, ad results, ad accounts (Om Parvate)
   · Social media — the post calendar and series (moved here from Tool Section → Content) (Swapnil)
   · IT & development — websites, landing pages, apps per client (Himanshu)
   · Creative library — photos, posts and videos Swapnil adds; every employee sees, in Tool Section,
     only their own company's items and the ones they are in (or that Swapnil shares with them). */
Object.assign(I,{code:'<path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/>',pic:'<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',dl:'<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',share:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>',mega:'<path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>'});
const ST_TEAM=['swapnil','omparvate','himanshu'];
const isStT=()=>isTop()||ST_TEAM.includes(S.me);
const canCrl=()=>isTop()||ST_TEAM.includes(S.me);
const stLive=()=>typeof LV!=='undefined'&&LV.ok&&typeof lapi==='function';
const stBrand=k=>(D.brands||[]).find(b=>b.k===k)||{k,n:k,c:'#6B6E7A',parent:k};
const stNm=k=>(P[k]||{}).n||nmF(k);
const stFace=k=>typeof faceName==='function'?faceName(k):nmF(k);

/* ---------- data: kept on the server when live (everyone sees the same), sample data in the prototype ---------- */
if(!D.st)D.st={crl:[],itp:[],pmp:[]};
if(!D.stV1){const m=n=>{const d=new Date();d.setMonth(d.getMonth()-n);return iso(d).slice(0,7)};
 D.st.crl=(D.lib||[]).map(x=>({id:nid('c'),t:x.t,co:x.co,type:x.type==='Video'?'Reel / video':x.type==='Static'?'Post / static':x.type,when:String(x.at||TODAY).slice(0,7),people:(x.tags||[]).slice(),vis:'company',also:[],thumb:x.thumb||'',link:x.link&&x.link!=='#'?x.link:'',drive:x.drive||'',cap:x.cap||'',by:x.by||'swapnil',shot:''}));
 [['Pune warehouse team photo','log','Photo',m(11),['zubair','mustafa','samadhan','abrar'],'company'],['GovaaBazaar Christmas box shoot','gb','Photo',m(1),[],'company'],['JDAC Logistics logo pack','log','Logo & brand',m(6),[],'all'],['Diwali celebration 2025','studios','Photo',m(13),['neetu','balaji','swapnil','nameera'],'all']].forEach(r=>D.st.crl.push({id:nid('c'),t:r[0],co:r[1],type:r[2],when:r[3],people:r[4],vis:r[5],also:[],thumb:'',link:'',drive:'',cap:'',by:'swapnil',shot:''}));
 const d=n=>addD(TODAY,n);
 D.st.itp=[['JDAC Logistics website refresh','log','Website','Build',d(10)],['GOVAA “Pick Any 6” landing page','gb','Landing page','Live',d(-20)],['Bahiram site · admin panel + login','bah','Website','Design',d(14)],['HR Consultancy job-seeker form','hr','Landing page','Brief',d(21)],['Jupiter Pune rental enquiry page','jup','Landing page','Testing',d(3)]].map(r=>({id:nid('i'),t:r[0],co:r[1],kind:r[2],st:r[3],due:r[4],o:'himanshu',link:'',notes:''}));
 D.st.pmp=[['Pune ₹10 parcel offer','log','Leads','Meta',800,'Live',d(-25),d(5)],['Christmas boxes · Pick Any 6','gb','Sales','Meta',1200,'Planned',d(3),d(28)],['Employer leads','hr','Leads','Meta',500,'Paused',d(-40),d(-5)],['Bed & oxygen rental Pune','jup','Leads','Google',600,'Live',d(-12),d(18)],['Bahiram launch awareness','bah','Awareness','Meta',1000,'Planned',d(7),d(37)]].map(r=>({id:nid('p'),t:r[0],co:r[1],obj:r[2],plat:r[3],bud:r[4],st:r[5],from:r[6],to:r[7],o:'omparvate',notes:''}));
 D.stV1=1;save()}
const STIMG={};
async function stPull(kind){if(!stLive())return;try{const r=await lapi('GET','/api/studio?kind='+kind);const srv=(r.rows||[]).map(x=>({...x,srv:1}));const keep=(D.st[kind]||[]).filter(x=>!x.srv&&!srv.some(s=>s.id===x.id));D.st[kind]=[...srv,...keep];save();render()}catch(x){}}
async function stPush(kind,row){if(!stLive())return;const {srv,updatedBy,updatedAt,...d}=row;try{await lapi('POST','/api/studio',{kind,row:d});row.srv=1;save()}catch(e){toast('Not saved on server: '+e.message)}}
const stPullAll=()=>{if(S.stPulled)return;S.stPulled=1;setTimeout(()=>['crl','itp','pmp'].forEach(stPull),0)};
const stRows=kind=>(D.st[kind]||[]).filter(x=>!x.deleted);
const stInC=x=>!S.stC||x.co===S.stC;

/* ---------- client switcher (same idea as the CRM picker) ---------- */
function stBar(){const B=D.brands||[],o=(kd,l)=>`<optgroup label="${l}">${B.filter(b=>b.kind===kd).map(b=>`<option value="${b.k}" ${S.stC===b.k?'selected':''}>${h(b.n)}</option>`).join('')}</optgroup>`,b=S.stC?stBrand(S.stC):null;
 return `<div class="stbar"><i style="background:${b?b.c:'var(--navy)'}">${b?h(ini(b.n)):ic('users')}</i><div><small>Working for</small><select data-ch="stC" aria-label="Client"><option value="">All clients · ${B.length}</option>${o('Internal','Our companies')}${o('Client','Outside clients')}</select></div>${isTop()||isMkt()?`<button class="btn sm sec" data-a="brNew">${ic('plus')}Add client</button>`:''}</div>`}
document.addEventListener('change',e=>{const k=e.target&&e.target.dataset&&e.target.dataset.ch;if(k==='stC'){S.stC=e.target.value;S.cb=S.stC;render()}if(k==='crlf')crlFiles(e.target.files)});

/* ---------- Performance marketing ---------- */
const PM_ST=['Planned','Live','Paused','Ended'];
const PM_RX={log:/logistic/i,gb:/govaa/i,rb:/retailer/i,db:/distributor/i,hr:/\bhr\b|consult/i,jup:/jupiter(?!.*mumbai)/i,jmum:/mumbai/i,studios:/studio/i,bah:/bahiram/i};
const pmMatch=(k,co)=>(PM_RX[k]||new RegExp(stBrand(k).n.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i')).test(co||'');
function pmView(){const t=S.pmT||'plan',L=stRows('pmp').filter(stInC),live=L.filter(x=>x.st==='Live');
 if(typeof CAMP!=='undefined'&&!CAMP&&typeof campLoad==='function')campLoad();
 let ads='';if(typeof CAMP!=='undefined'&&CAMP&&!CAMP.err){const ids=new Set(CAMP.c.filter(c=>!S.stC||pmMatch(S.stC,c.company)).map(c=>String(c.id))),f=addD(TODAY,-29);let sp=0,ld=0;CAMP.m.forEach(m=>{if(ids.has(String(m.campaignId))&&m.date>=f)sp+=+m.spend||0});CAMP.l.forEach(l=>{if(ids.has(String(l.campaignId))&&l.date>=f)ld++});ads=`<div><span>Ad spend · 30 days</span><b>${inr(Math.round(sp))}</b></div><div><span>Leads · 30 days</span><b>${ld}</b></div><div><span>Cost per lead</span><b>${ld?inr(Math.round(sp/ld)):'—'}</b></div>`}
 const kp=`<div class="stk"><div><span>Live campaigns</span><b>${live.length}</b></div><div><span>Planned</span><b>${L.filter(x=>x.st==='Planned').length}</b></div><div><span>Live budget / day</span><b>${inr(live.reduce((a,x)=>a+(+x.bud||0),0))}</b></div>${ads}</div>`;
 const sub=`<div class="row" style="margin:12px 0">${chips([['plan','Campaign plan',L.length],['res','Ad results'],['acc','Ad accounts']],t,'pmT')}<span class="sp"></span>${isStT()&&t==='plan'?`<button class="btn sm" data-a="pmNew">${ic('plus')}Plan a campaign</button>`:''}</div>`;
 if(t==='res'){if(typeof CAMP!=='undefined'&&CAMP&&S.stC){const c=CAMP.c.find(x=>pmMatch(S.stC,x.company));S.cpC=c?c.company:''}else S.cpC='';
  const o=typeof V.camp==='function'?V.camp().replace(/<div class="row nw" style="margin-bottom:14px">[\s\S]*?<\/h1>[\s\S]*?<\/div>/,''):'';return kp+sub+o}
 if(t==='acc')return kp+sub+`<div class="list">${(D.brands||[]).filter(stInC).map(b=>{const n=stRows('pmp').filter(x=>x.co===b.k&&x.st==='Live').length,nc=/Not connected/.test(b.ad||'Not connected');return `<div class="li"><div class="av" style="background:${b.c};border-radius:12px">${h(ini(b.n))}</div><div class="tx"><b>${h(b.n)}</b><div class="m">${h(b.ad||'Not connected')} · ${n} live campaign${n===1?'':'s'} · Om Parvate</div></div>${pill(nc?'Connect Meta':'Own account',nc?'':'b')}</div>`}).join('')}</div><div class="note">Every client keeps its own ad account, so spend and leads never mix between companies.</div>`;
 const row=x=>{const b=stBrand(x.co),late=x.st==='Live'&&x.to&&x.to<TODAY;return `<tr data-a="pmOpen" data-id="${x.id}" tabindex="0"><td><b>${h(x.t)}</b><small>${h(x.obj)} · ${h(x.plat)}</small></td><td><span class="stdot" style="background:${b.c}"></span>${h(b.n)}</td><td class="n">${inr(+x.bud||0)}</td><td>${x.from?fmt(x.from):'—'} → ${x.to?fmt(x.to):'—'}${late?' '+pill('ended?','r'):''}</td><td>${h(stNm(x.o))}</td><td>${pill(x.st,x.st==='Live'?'g':x.st==='Planned'?'b':x.st==='Paused'?'a':'')}</td></tr>`};
 return kp+sub+(L.length?`<div class="sttw"><table class="sttbl"><thead><tr><th>Campaign</th><th>Client</th><th class="n">Budget / day</th><th>Runs</th><th>Owner</th><th>Status</th></tr></thead><tbody>${['Live','Planned','Paused','Ended'].map(s=>L.filter(x=>x.st===s).sort((a,b)=>String(a.from).localeCompare(String(b.from))).map(row).join('')).join('')}</tbody></table></div>`:`<div class="list">${empty('No campaigns planned',isStT()?'Tap “Plan a campaign” to add one':'')}</div>`)}
['pmT','itT','crT'].forEach(k=>A[k]=e=>{S[k]=e.dataset.t;render()});
const pmForm=x=>{x=x||{};return `<label for="pmt">Campaign name *</label><input id="pmt" value="${h(x.t||'')}" placeholder="e.g. Diwali parcel offer · Pune">
 <label>Client</label>${opts('pmc',(D.brands||[]).map(b=>[b.k,b.n]),x.co||S.stC||'log')}
 <div class="grid g2"><div><label>Objective</label>${opts('pmo',['Leads','Sales','Awareness','Traffic','App installs'],x.obj||'Leads')}</div><div><label>Platform</label>${opts('pmpl',['Meta','Google','YouTube','LinkedIn'],x.plat||'Meta')}</div></div>
 <div class="grid g2"><div><label for="pmb">Budget per day (₹)</label><input id="pmb" type="number" min="0" value="${x.bud||''}"></div><div><label>Owner</label>${opts('pmow',[...new Set([...ST_TEAM,x.o].filter(Boolean))].map(k=>[k,stNm(k)]),x.o||'omparvate')}</div></div>
 <div class="grid g2"><div><label for="pmf">Starts</label><input id="pmf" type="date" value="${x.from||TODAY}"></div><div><label for="pmto">Ends</label><input id="pmto" type="date" value="${x.to||addD(TODAY,30)}"></div></div>
 <label>Status</label>${opts('pms',PM_ST,x.st||'Planned')}<label for="pmn">Audience, offer & notes</label><textarea id="pmn" placeholder="Who we target, the offer, creatives needed, landing page">${h(x.notes||'')}</textarea>`};
const pmRead=x=>Object.assign(x,{t:val('pmt'),co:pick1('pmc')||x.co||'log',obj:pick1('pmo')||'Leads',plat:pick1('pmpl')||'Meta',bud:+val('pmb')||0,o:pick1('pmow')||'omparvate',from:val('pmf'),to:val('pmto'),st:pick1('pms')||'Planned',notes:val('pmn')});
A.pmNew=()=>sheet(`<h2>Plan a campaign</h2>${pmForm()}<button class="btn w" style="margin-top:14px" data-a="pmSave">Add to plan</button>`);
A.pmOpen=e=>{const x=stRows('pmp').find(r=>r.id===e.dataset.id);if(!x)return;if(!isStT())return sheet(`<h2>${h(x.t)}</h2><p class="mut sm">${h(stBrand(x.co).n)} · ${h(x.obj)} · ${h(x.plat)} · ${inr(+x.bud||0)}/day · ${x.st}</p>${x.notes?`<p class="sm">${h(x.notes)}</p>`:''}`);
 sheet(`<h2>${h(x.t)}</h2>${pmForm(x)}<div class="row" style="margin-top:14px"><button class="btn" style="flex:1" data-a="pmSave" data-id="${x.id}">Save</button><button class="btn sec" data-a="stDel" data-k="pmp" data-id="${x.id}" aria-label="Delete campaign">${ic('trash')}</button></div>`)};
A.pmSave=e=>{if(!val('pmt'))return toast('Name the campaign');const id=e.dataset.id;let x=id&&D.st.pmp.find(r=>r.id===id);if(!x){x={id:nid('p')};D.st.pmp.unshift(x)}pmRead(x);save();closeM();render();toast(id?'Saved':'Added to the plan');stPush('pmp',x)};
A.stDel=e=>sheet(`<h2>Delete this?</h2><p class="mut sm">It goes for everyone.</p><div class="row" style="margin-top:14px"><button class="btn r" style="flex:1" data-a="stDelOk" data-k="${e.dataset.k}" data-id="${e.dataset.id}">Delete</button><button class="btn sec" data-a="closeM">Keep</button></div>`);
A.stDelOk=e=>{const k=e.dataset.k,x=(D.st[k]||[]).find(r=>r.id===e.dataset.id);if(x){x.deleted=1;stPush(k,x).then(()=>{D.st[k]=D.st[k].filter(r=>r!==x);save();render()})}closeM();render();toast('Deleted')};

/* ---------- IT & development ---------- */
const IT_ST=['Brief','Design','Build','Testing','Live'];
function itView(){const L=stRows('itp').filter(stInC);
 const card=x=>{const b=stBrand(x.co),late=x.st!=='Live'&&x.due&&x.due<TODAY;return `<button class="itc" data-a="itOpen" data-id="${x.id}"><div class="row" style="gap:5px"><span class="pill" style="background:${b.c}1a;color:${b.c}">${h(b.n)}</span>${pill(x.kind)}</div><b>${h(x.t)}</b><div class="xs mut">${h(stNm(x.o))}${x.due?' · '+(x.st==='Live'?'live':'due')+' '+fmt(x.due):''}${late?` · <span style="color:var(--r);font-weight:700">${-daysTo(x.due)}d late</span>`:''}</div></button>`};
 return `<div class="stk"><div><span>Projects</span><b>${L.length}</b></div><div><span>In progress</span><b>${L.filter(x=>!['Live','Brief'].includes(x.st)).length}</b></div><div><span>Live</span><b>${L.filter(x=>x.st==='Live').length}</b></div><div><span>Late</span><b style="color:${L.some(x=>x.st!=='Live'&&x.due&&x.due<TODAY)?'var(--r)':''}">${L.filter(x=>x.st!=='Live'&&x.due&&x.due<TODAY).length}</b></div></div>
 <div class="row" style="margin:12px 0"><span class="mut sm">Websites, landing pages and apps for every client · Brief → Design → Build → Testing → Live</span><span class="sp"></span>${isStT()?`<button class="btn sm" data-a="itNew">${ic('plus')}New project</button>`:''}</div>
 <div class="itb">${IT_ST.map(s=>{const C=L.filter(x=>x.st===s);return `<div class="itcol"><div class="itch">${s}<span>${C.length}</span></div>${C.map(card).join('')||'<div class="empty xs">—</div>'}</div>`}).join('')}</div>`}
const itForm=x=>{x=x||{};return `<label for="itt">Project *</label><input id="itt" value="${h(x.t||'')}" placeholder="e.g. Diwali offer landing page">
 <label>Client</label>${opts('itc',(D.brands||[]).map(b=>[b.k,b.n]),x.co||S.stC||'log')}<label>Type</label>${opts('itk',['Website','Landing page','App','Integration / API','Fix / change'],x.kind||'Landing page')}
 <div class="grid g2"><div><label>Owner</label>${opts('ito',[...new Set(['himanshu','swapnil','omparvate',x.o].filter(Boolean))].map(k=>[k,stNm(k)]),x.o||'himanshu')}</div><div><label for="itd">Due date</label><input id="itd" type="date" value="${x.due||addD(TODAY,7)}"></div></div>
 <label>Stage</label>${opts('its',IT_ST,x.st||'Brief')}<label for="itl">Live / preview link</label><input id="itl" value="${h(x.link||'')}" placeholder="https://"><label for="itn">Brief & notes</label><textarea id="itn" placeholder="What it must do, pages, forms, who approves">${h(x.notes||'')}</textarea>`};
A.itNew=()=>sheet(`<h2>New IT project</h2>${itForm()}<button class="btn w" style="margin-top:14px" data-a="itSave">Add project</button>`);
A.itOpen=e=>{const x=stRows('itp').find(r=>r.id===e.dataset.id);if(!x)return;const ln=/^https:\/\//.test(x.link||'')?`<a class="btn sm sec" href="${h(x.link)}" target="_blank" rel="noopener">Open link ↗</a>`:'';
 if(!isStT())return sheet(`<h2>${h(x.t)}</h2><p class="mut sm">${h(stBrand(x.co).n)} · ${h(x.kind)} · ${x.st} · ${h(nmF(x.o))}</p>${x.notes?`<p class="sm">${h(x.notes)}</p>`:''}${ln}`);
 const i=IT_ST.indexOf(x.st);sheet(`<h2>${h(x.t)}</h2>${mini(IT_ST.length,i+1)}${i<IT_ST.length-1?`<button class="btn w" style="margin:10px 0" data-a="itNext" data-id="${x.id}">Move to ${IT_ST[i+1]} ✓</button>`:''}${ln}${itForm(x)}<div class="row" style="margin-top:14px"><button class="btn" style="flex:1" data-a="itSave" data-id="${x.id}">Save</button><button class="btn sec" data-a="stDel" data-k="itp" data-id="${x.id}" aria-label="Delete project">${ic('trash')}</button></div>`)};
A.itNext=e=>{const x=D.st.itp.find(r=>r.id===e.dataset.id);x.st=IT_ST[Math.min(IT_ST.length-1,IT_ST.indexOf(x.st)+1)];save();closeM();render();toast(x.t+' → '+x.st);stPush('itp',x)};
A.itSave=e=>{if(!val('itt'))return toast('Name the project');const id=e.dataset.id;let x=id&&D.st.itp.find(r=>r.id===id);if(!x){x={id:nid('i')};D.st.itp.unshift(x)}Object.assign(x,{t:val('itt'),co:pick1('itc')||'log',kind:pick1('itk')||'Landing page',o:pick1('ito')||'himanshu',due:val('itd'),st:pick1('its')||'Brief',link:val('itl'),notes:val('itn')});save();closeM();render();toast(id?'Saved':'Project added');stPush('itp',x)};

/* ---------- Social media: the calendar & series (was Tool Section → Content) ---------- */
const _vContentST=V.content;
function smView(){if(!['cal','series'].includes(S.ct))S.ct='cal';S.cb=S.stC||'';
 const t=document.createElement('template');t.innerHTML=_vContentST();
 const h1=t.content.querySelector('h1');if(h1&&h1.closest('.row'))h1.closest('.row').remove();
 t.content.querySelectorAll('[data-a="ct"],[data-a="cb"]').forEach(b=>{const c=b.closest('.chips');if(!c)return;const w=c.parentElement;(w&&w.tagName==='DIV'&&w.getAttribute('style')==='margin:10px 0 12px'?w:c).remove()});
 return `<div class="row" style="margin:12px 0">${chips([['cal','Post calendar'],['series','Parivaar series']],S.ct,'ct')}<span class="sp"></span>${canEditPost()?`<button class="btn sm" data-a="pNew">${ic('plus')}Plan a post</button>`:''}</div>`+t.innerHTML}

/* ---------- Creative library ---------- */
const CRL_TY=['Photo','Product photo','Packaging','Logo & brand','Company asset','Post / static','Reel / video','Carousel','Poster / banner'];
const CRL_HINT={'Packaging':'Boxes, labels, wrappers, dielines','Logo & brand':'Logos, colours, fonts, brand guide','Company asset':'Letterhead, visiting card, stamps, signage, profile'};
const crlCos=k=>{const L=[TEAMCO[(P[k]||{}).team]||'log'];if(k===S.me&&typeof cmExtraCos==='function')try{L.push(...cmExtraCos())}catch(x){}return L};
const crlSees=x=>isStT()||(x.people||[]).includes(S.me)||(x.also||[]).includes(S.me)||x.vis==='all'||(x.vis==='company'&&crlCos(S.me).includes(stBrand(x.co).parent||x.co));
const crlVis=x=>x.vis==='all'?'Every employee':x.vis==='people'?'Only people in it':(stBrand(x.co).n+' team');
function crlView(manage){const q=(S.crQ||'').toLowerCase(),ty=S.crT||'',mine=S.crM==='me';
 let L=stRows('crl').filter(crlSees);if(manage)L=L.filter(stInC);const cos=[...new Set(L.map(x=>x.co))],L0=L.slice();
 if(!manage&&S.crC&&cos.includes(S.crC))L=L.filter(x=>x.co===S.crC);
 if(ty)L=L.filter(x=>x.type===ty);if(mine)L=L.filter(x=>(x.people||[]).includes(S.me));
 if(q)L=L.filter(x=>[x.t,x.type,x.cap,x.shot,x.tags,stBrand(x.co).n,...(x.people||[]).map(stFace)].join(' ').toLowerCase().includes(q));
 L=L.sort((a,b)=>String(b.when||'').localeCompare(String(a.when||'')));
 const tile=x=>{const b=stBrand(x.co);return `<button class="crt" data-a="crlOpen" data-id="${x.id}" aria-label="${h(x.t)}"><div class="im" style="background:${x.thumb?`center/cover url(${x.thumb})`:`linear-gradient(160deg,${b.c},${b.c}aa)`}">${x.thumb?'':`<span>${h(x.t)}</span>`}${/video/i.test(x.type)?`<em>${ic('play')}</em>`:''}</div><div class="bd"><b>${h(x.t)}</b><small>${h(b.n)} · ${x.when?new Date(x.when+'-01T12:00:00').toLocaleDateString('en-IN',{month:'short',year:'numeric'}):h(x.type)}</small>${manage?`<small class="vis">${h(crlVis(x))}</small>`:''}</div></button>`};
 return `<div class="row" style="gap:8px;margin:${manage?'12px':'0'} 0 10px"><div class="search" style="flex:1;min-width:220px;margin:0"><span aria-hidden="true">${ic('search')}</span><label class="sr" for="crq">Search creatives</label><input id="crq" data-in="crQ" value="${h(S.crQ||'')}" placeholder="Search “packaging”, “logo”, “choconut box”, “Neetu”…"></div>${canCrl()?`<button class="btn" data-a="crlNew">${ic('up')}Add creatives</button>`:''}</div>
 ${chips([['','All',L0.length],...CRL_TY.map(x=>[x,x,L0.filter(r=>r.type===x).length||''])],ty,'crT')}
 <div class="row" style="margin:10px 0 12px;gap:8px">${!manage&&cos.length>1?chips([['','All companies'],...cos.map(k=>[k,stBrand(k).n])],S.crC||'','crC'):''}<span class="sp"></span><button class="chipx ${mine?'on':''}" data-a="crM">${ic('user')}Photos with me</button><span class="xs mut">${L.length} item${L.length===1?'':'s'}</span></div>
 <div class="crg">${L.map(tile).join('')||`<div style="grid-column:1/-1">${empty('Nothing here yet',canCrl()?'Add photos, posts and videos with “Add creatives”':'Swapnil adds your company’s photos and posts here')}</div>`}</div>`}
A.crC=e=>{S.crC=e.dataset.t;render()};A.crM=()=>{S.crM=S.crM==='me'?'':'me';render()};
V.crl=()=>{stPullAll();return page('Creative Library','Photos, posts and videos of your company · download or share them · managed by JDAC Studios')+crlView(false)};

/* add / edit */
let CRLNEW=[];
const CRL_MAX=100;
function stShrink(file,max,q,png){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const s=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*s);c.height=Math.round(im.height*s);const g=c.getContext('2d');if(!png){g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height)}g.drawImage(im,0,0,c.width,c.height);res(png?c.toDataURL('image/png'):c.toDataURL('image/jpeg',q))};im.onerror=rej;im.src=r.result};r.onerror=rej;r.readAsDataURL(file)})}
async function crlFiles(fl){const all=[...(fl||[])].filter(f=>/^image\/(jpeg|png|webp)$/.test(f.type)),F=all.slice(0,CRL_MAX);if(!F.length)return toast('No JPG / PNG / WEBP images found');if(all.length>CRL_MAX)toast('Taking the first '+CRL_MAX+' of '+all.length+'. Add the rest in a second round.');const o=document.getElementById('crl-f');if(o)o.textContent='Preparing '+F.length+'…';
 CRLNEW=[];let i=0;for(const f of F){i++;if(o&&i%5===0)o.textContent='Preparing '+i+' of '+F.length+'…';const png=f.type==='image/png';try{let full=await stShrink(f,1600,.82,png);if(full.length>880000)full=await stShrink(f,1200,.75);if(full.length>880000)full=await stShrink(f,900,.7);CRLNEW.push({thumb:await stShrink(f,300,.68,png&&f.size<400000),full,name:f.name.replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ').trim()})}catch(x){}}
 if(o)o.innerHTML=CRLNEW.map(x=>`<img src="${x.thumb}" alt="">`).join('')+`<div class="xs mut">${CRLNEW.length} photo${CRLNEW.length===1?'':'s'} ready</div>`;const t=document.getElementById('crt');if(t&&!t.value&&CRLNEW.length===1)t.value=CRLNEW[0].name}
const crlForm=x=>{x=x||{};const faces=[...STAFF.map(k=>[k,nmF(k)]),...(D.faces||[]).map(f=>[f.k,f.n])];
 return `${x.id?`<label class="btn sec w" style="cursor:pointer">${ic('pic')}Replace image<input type="file" accept="image/*" class="sr" data-ch="crlf"></label>`:`<div class="crdrop" id="crdrop"><b>${ic('up')} Bulk import · drop files or a folder here</b><span>JPG, PNG, WEBP · up to ${CRL_MAX} at once · file names become titles</span><div class="row" style="justify-content:center;margin-top:8px"><label class="btn sm" style="cursor:pointer">Choose files<input type="file" accept="image/*" multiple class="sr" data-ch="crlf"></label><label class="btn sm sec" style="cursor:pointer">Choose a folder<input type="file" webkitdirectory multiple class="sr" data-ch="crlf"></label></div></div>`}<div class="crlp" id="crl-f">${x.thumb?`<img src="${x.thumb}" alt="">`:''}</div>
 <label for="crt">Title ${x.id?'*':'· optional for bulk (file names are used)'}</label><input id="crt" value="${h(x.t||'')}" placeholder="e.g. Diwali celebration at Pune office">
 <div class="grid g2"><div><label>Company / client</label>${opts('crc',(D.brands||[]).map(b=>[b.k,b.n]),x.co||S.stC||'log')}</div><div><label for="crw">Month taken · leave empty if not known</label><input id="crw" type="month" value="${x.id?(x.when||''):''}"></div></div>
 <label>Type</label>${opts('cty',CRL_TY,x.type||'Photo')}<div class="xs mut" style="margin-top:4px">${Object.entries(CRL_HINT).map(([k,v])=>`<b>${k}</b>: ${v}`).join(' · ')}</div>
 <label for="crtg">Search tags</label><input id="crtg" value="${h(x.tags||'')}" placeholder="e.g. choconut, box, front, 2025 range">
 <label>People in it · they always see it</label>${opts('crp',faces,x.people||[],true)}<div class="row nw" style="margin-top:8px"><label class="sr" for="crfn">New person</label><input id="crfn" placeholder="+ Someone not in the team (client, customer…)" style="flex:1"><button class="btn sm sec" type="button" data-a="crFace">Add</button></div>
 <label for="crs">Shot by / camera</label><input id="crs" value="${h(x.shot||'')}" placeholder="e.g. Swapnil · iPhone 15 / Sony A7">
 <label>Who can see it</label>${opts('crv',[['company','Team of this company'],['people','Only people in it'],['all','Every employee']],x.vis||'company')}
 <label>Also share with</label>${opts('cra',STAFF.map(k=>[k,nmF(k)]),x.also||[],true)}
 <label for="crl2">Video / post / Drive link</label><input id="crl2" value="${h(x.link||x.drive||'')}" placeholder="https://"><label for="crcap">Caption to share with it</label><textarea id="crcap" placeholder="Ready text people can send with the photo">${h(x.cap||'')}</textarea>`};
A.crFace=()=>{const n=val('crfn');if(!n)return toast('Type a name');const k='f'+Date.now().toString(36);D.faces=D.faces||[];D.faces.push({k,n});save();const box=document.getElementById('crp');if(box){const b=document.createElement('button');b.type='button';b.dataset.a='pick';b.dataset.k=k;b.className='on';b.setAttribute('aria-pressed','true');b.textContent=n;box.appendChild(b)}document.getElementById('crfn').value=''};
A.crlNew=()=>{if(!canCrl())return;CRLNEW=[];sheet(`<h2>Add to Creative Library</h2><p class="mut sm">Old or new photos, posts, posters and videos. People see them in Tool Section → Creative Library, as you set below.</p>${crlForm()}<button class="btn w" style="margin-top:14px" data-a="crlSave">Add to library</button>`)};
async function crlPushOne(x,full){await stPush('crl',x);if(full&&stLive())try{await lapi('POST','/api/studio/img',{id:x.id,img:full})}catch(e){toast('Image not saved on server: '+e.message)}}
A.crlSave=e=>{const t=val('crt'),id=e.dataset.id;const link=val('crl2');if(!t&&(id||!CRLNEW.length))return toast('Add a title');
 const base={t,co:pick1('crc')||'log',when:val('crw'),type:pick1('cty')||'Photo',people:pickN('crp'),tags:val('crtg'),shot:val('crs'),vis:pick1('crv')||'company',also:pickN('cra'),link,cap:val('crcap')};
 if(id){const x=D.st.crl.find(r=>r.id===id);Object.assign(x,base);const n=CRLNEW[0];if(n){x.thumb=n.thumb;STIMG[x.id]=n.full}CRLNEW=[];save();closeM();render();toast('Saved');crlPushOne(x,n&&n.full);return}
 if(!CRLNEW.length&&!link)return toast('Choose photos or add a link');
 const items=(CRLNEW.length?CRLNEW:[null]).map((n,i,A2)=>({id:nid('c'),...base,t:n&&(A2.length>1||!t)?(t?t+' · ':'')+n.name:t,thumb:n?n.thumb:'',by:S.me,at:TODAY,_full:n&&n.full}));
 const jobs=items.slice().reverse().map(x=>{const f=x._full;delete x._full;if(f)STIMG[x.id]=f;D.st.crl.unshift(x);return [x,f]});CRLNEW=[];try{save()}catch(z){}closeM();render();toast(items.length+' added · '+crlVis(items[0]));
 if(stLive())(async()=>{let n=0;for(const [x,f] of jobs.slice().reverse()){await crlPushOne(x,f);n++;if(jobs.length>3&&n%10===0)toast('Uploading '+n+' of '+jobs.length+'…')}if(jobs.length>3)toast('All '+jobs.length+' uploaded ✓')})()};
A.crlOpen=e=>{const x=stRows('crl').find(r=>r.id===e.dataset.id);if(!x)return;const b=stBrand(x.co),src=STIMG[x.id]||x.thumb,ln=/^https:\/\//.test(x.link||'')?x.link:'';
 sheet(`<div class="crbig" style="background:${src?'#111':`linear-gradient(160deg,${b.c},${b.c}aa)`}">${src?`<img id="crimg" src="${src}" alt="${h(x.t)}">`:`<span>${h(x.t)}</span>`}</div>
 <div class="row" style="gap:6px;margin-top:10px"><span class="pill" style="background:${b.c}1a;color:${b.c}">${h(b.n)}</span>${pill(x.type)}${x.when?pill(new Date(x.when+'-01T12:00:00').toLocaleDateString('en-IN',{month:'long',year:'numeric'})):''}${isStT()?pill(crlVis(x),'b'):''}</div>
 <h2 style="margin-top:8px">${h(x.t)}</h2>${(x.people||[]).length?`<p class="mut sm">With ${x.people.map(stFace).map(h).join(', ')}</p>`:''}${x.shot?`<p class="xs mut">Shot by ${h(x.shot)}</p>`:''}${x.cap?`<p class="sm" style="background:var(--bg);border-radius:12px;padding:10px 12px;white-space:pre-wrap">${h(x.cap)}</p>`:''}
 <div class="grid g2" style="margin-top:10px">${src?`<button class="btn" data-a="crlDl" data-id="${x.id}">${ic('dl')}Download</button><button class="btn sec" data-a="crlShare" data-id="${x.id}">${ic('share')}Share</button>`:''}${ln?`<a class="btn sec" href="${h(ln)}" target="_blank" rel="noopener">Open video / post ↗</a>`:''}${x.cap?`<button class="btn sec" data-a="crlCopy" data-id="${x.id}">Copy caption</button>`:''}</div>
 ${canCrl()?`<div class="row" style="margin-top:12px"><button class="btn sec" style="flex:1" data-a="crlEdit" data-id="${x.id}">Edit details & who sees it</button><button class="btn sec" data-a="stDel" data-k="crl" data-id="${x.id}" aria-label="Delete">${ic('trash')}</button></div>`:''}`);
 if(!STIMG[x.id]&&x.thumb&&stLive())lapi('GET','/api/studio/img?id='+x.id).then(r=>{if(r.img){STIMG[x.id]=r.img;const i=document.getElementById('crimg');if(i)i.src=r.img}}).catch(()=>{})};
A.crlEdit=e=>{const x=D.st.crl.find(r=>r.id===e.dataset.id);CRLNEW=[];sheet(`<h2>Edit · ${h(x.t)}</h2>${crlForm(x)}<button class="btn w" style="margin-top:14px" data-a="crlSave" data-id="${x.id}">Save</button>`)};
const crlSrc=x=>STIMG[x.id]||x.thumb;
A.crlDl=e=>{const x=D.st.crl.find(r=>r.id===e.dataset.id),a=document.createElement('a');a.href=crlSrc(x);a.download=(x.t||'creative').replace(/[^\w\- ]+/g,'').trim()+'.jpg';document.body.appendChild(a);a.click();a.remove()};
A.crlCopy=e=>{const x=D.st.crl.find(r=>r.id===e.dataset.id);try{navigator.clipboard.writeText(x.cap||x.t);toast('Caption copied')}catch(z){toast('Copy not allowed here')}};
A.crlShare=async e=>{const x=D.st.crl.find(r=>r.id===e.dataset.id);try{const bl=await (await fetch(crlSrc(x))).blob(),f=new File([bl],(x.t||'creative')+'.jpg',{type:'image/jpeg'});if(navigator.canShare&&navigator.canShare({files:[f]}))return await navigator.share({files:[f],text:x.cap||x.t})}catch(z){if(z&&z.name==='AbortError')return}
 A.crlDl(e);window.open('https://wa.me/?text='+encodeURIComponent((x.cap||x.t)+(x.link?'\n'+x.link:'')),'_blank','noopener');toast('Photo downloaded · attach it in WhatsApp')};
/* posted content goes into the library by itself */
const _pPostST=A.pPost;A.pPost=e=>{_pPostST(e);const p=D.posts.find(x=>x.id===e.dataset.id);if(!p||D.st.crl.some(x=>x.post===p.id))return;const x={id:nid('c'),t:p.t,co:p.co,type:['Static','Carousel'].includes(p.type)?(p.type==='Carousel'?'Carousel':'Post / static'):'Reel / video',when:TODAY.slice(0,7),people:(p.face||[]).slice(),vis:'company',also:[],thumb:p.thumb||'',link:(Object.values(p.links||{}).find(u=>/^https:\/\//.test(u))||''),drive:p.drive||'',cap:p.cap||'',by:S.me,shot:'',post:p.id};D.st.crl.unshift(x);save();if(canCrl())stPush('crl',x)};

/* ---------- Studios panel: departments as header tabs, client switcher on top ---------- */
const ST_DEPT=[['pm','Performance marketing'],['sm','Social media'],['it','IT & development'],['crl','Creative library']];
CTABS.studios=[['dash','Dashboard'],...ST_DEPT,['clients','Clients'],['inv','Invoices'],['pur','Purchases & expenses']];
CP['studios:pm']=()=>{stPullAll();return stBar()+pmView()};
CP['studios:sm']=()=>stBar()+smView();
CP['studios:it']=()=>{stPullAll();return stBar()+itView()};
CP['studios:crl']=()=>{stPullAll();return stBar()+`<div class="note" style="margin-top:12px">Everything here shows in <b>Tool Section → Creative Library</b>: each person sees only their company's items, the ones they are in, and what you share with them. The Studios team (Swapnil, Om Parvate, Himanshu) and Darshan / Nameera can add or change items.</div>`+crlView(true)};
/* Swapnil, Om Parvate and Himanshu: their own Studios page with the four departments */
V.studio=()=>{S.co='studios';if(!ST_DEPT.some(x=>x[0]===S.tab))S.tab=S.me==='himanshu'?'it':S.me==='omparvate'?'pm':'sm';return coHead('studios')+chips(ST_DEPT,S.tab,'tab')+`<div style="margin-top:12px">${CP['studios:'+S.tab]()}</div>`};
/* old Tool Section → Content opens Studios → Social media */
V.content=()=>{if(isTop()){S.v='co';S.co='studios';S.tab='sm';return V.co()}S.tab='sm';return V.studio()};
/* who sees what */
const _allowedST=allowed;allowed=function(v){if(v==='crl')return !(typeof isExt==='function'&&isExt())&&K()!=='partner';if(v==='studio'||v==='content')return isStT();return _allowedST(v)};
const _tabsST=tabsFor;tabsFor=function(who){const me0=who||S.me;let T=_tabsST(who);const i=T.findIndex(x=>x[0]==='content');T=T.filter(x=>x[0]!=='content');
 if(ST_TEAM.includes(me0)&&!TOP.includes(me0)&&!T.some(x=>x[0]==='studio'))T.splice(Math.min(1,T.length),0,['studio','Studios','film']);
 if(K()!=='partner'&&!T.some(x=>x[0]==='crl')){const at=i>=0?i:T.findIndex(x=>x[0]==='more');T.splice(at>=0?at:T.length,0,['crl','Creative Library','pic'])}return T};
const _moreST=V.more;V.more=()=>{let o=_moreST().replace(/<button class="tile" data-a="go" data-v="content">[\s\S]*?<\/button>/,'');if(allowed('crl')&&!/data-v="crl"/.test(o))o=o.replace('<div class="tiles">',`<div class="tiles"><button class="tile" data-a="go" data-v="crl"><i style="background:#0796A61a;color:#0796A6">${ic('pic')}</i>Creative Library</button>`);return o};

document.head.insertAdjacentHTML('beforeend',`<style>
.stbar{display:flex;align-items:center;gap:12px;background:#fff;border:1px solid var(--line);border-radius:16px;padding:10px 14px;margin-top:12px}
.stbar>i{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;color:#fff;font:800 13px inherit;font-style:normal;flex:none}.stbar>i svg{width:20px;height:20px}
.stbar>div{flex:1;min-width:0}.stbar small{display:block;font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--mut)}
.stbar select{border:0;padding:0;margin:0;min-height:0;font:700 16px inherit;background:transparent;width:auto;max-width:100%;cursor:pointer}
.stk{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-top:12px}.stk>div{background:#fff;border:1px solid var(--line);border-radius:14px;padding:12px 14px}.stk span{display:block;font-size:12px;color:var(--mut);font-weight:600}.stk b{font:800 22px inherit}
.sttw{background:#fff;border:1px solid var(--line);border-radius:16px;overflow:auto}.sttbl{width:100%;border-collapse:collapse;font-size:13.5px}.sttbl th{text-align:left;font-size:11.5px;text-transform:uppercase;letter-spacing:.04em;color:var(--mut);padding:10px 12px;border-bottom:1px solid var(--line);white-space:nowrap}
.sttbl td{padding:11px 12px;border-bottom:1px solid var(--line);vertical-align:middle}.sttbl tr:last-child td{border-bottom:0}.sttbl tbody tr{cursor:pointer}.sttbl tbody tr:hover{background:var(--bg)}.sttbl td small{display:block;color:var(--mut);font-size:12px;margin-top:2px}.sttbl .n{text-align:right;white-space:nowrap}
.stdot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:7px;vertical-align:middle}
.itb{display:grid;grid-template-columns:repeat(5,minmax(200px,1fr));gap:10px;overflow-x:auto;padding-bottom:6px}.itcol{background:var(--bg);border-radius:16px;padding:8px;min-height:120px}.itch{display:flex;justify-content:space-between;font:700 13px inherit;padding:6px 6px 10px}.itch span{color:var(--mut)}
.itc{display:block;width:100%;text-align:left;background:#fff;border:1px solid var(--line);border-radius:12px;padding:10px;margin-bottom:8px;cursor:pointer;font:inherit}.itc b{display:block;margin:7px 0 4px;font-size:14px}.itc:hover{border-color:var(--o)}
.crg{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px}.crt{background:#fff;border:1px solid var(--line);border-radius:14px;overflow:hidden;padding:0;text-align:left;cursor:pointer;font:inherit}.crt:hover{box-shadow:0 6px 18px rgba(0,0,0,.08)}
.crt .im{aspect-ratio:1;position:relative;display:flex;align-items:flex-end;padding:10px;color:#fff;font:700 14px inherit}.crt .im em{position:absolute;top:8px;right:8px;width:28px;height:28px;border-radius:50%;background:rgba(0,0,0,.45);display:grid;place-items:center}.crt .im em svg{width:14px;height:14px}
.crt .bd{padding:9px 11px}.crt .bd b{display:block;font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.crt .bd small{display:block;font-size:11.5px;color:var(--mut)}.crt .bd small.vis{color:var(--b,#2563C9);font-weight:600}
.chipx{border:1px solid var(--line);background:#fff;border-radius:999px;padding:6px 12px;font:600 13px inherit;display:inline-flex;gap:6px;align-items:center;cursor:pointer}.chipx svg{width:14px;height:14px}.chipx.on{background:var(--navy);color:#fff;border-color:var(--navy)}
.crbig{border-radius:16px;min-height:220px;max-height:62vh;display:flex;align-items:center;justify-content:center;overflow:hidden;color:#fff;font:700 18px inherit;padding:0}.crbig img{max-width:100%;max-height:62vh;display:block}
.crdrop{border:2px dashed var(--line);border-radius:16px;padding:16px;text-align:center;background:var(--bg)}.crdrop.on{border-color:var(--o);background:#fff7f0}.crdrop b{display:flex;gap:6px;justify-content:center;align-items:center}.crdrop b svg{width:18px;height:18px}.crdrop span{display:block;font-size:12px;color:var(--mut);margin-top:4px}.crdrop label.btn{color:inherit}.crdrop label.btn:not(.sec){color:#fff}
.crlp{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}.crlp{max-height:180px;overflow:auto}.crlp img{height:56px;border-radius:8px;background:repeating-conic-gradient(#eee 0 25%,#fff 0 50%) 0/12px 12px}
</style>`);

/* drag & drop files or whole folders onto the bulk import box */
async function crlWalk(entry,out){if(entry.isFile)return new Promise(r=>entry.file(f=>{out.push(f);r()},()=>r()));if(entry.isDirectory){const rd=entry.createReader();let batch;do{batch=await new Promise(r=>rd.readEntries(r,()=>r([])));for(const e of batch)await crlWalk(e,out)}while(batch.length)}}
['dragover','dragleave','drop'].forEach(ev=>document.addEventListener(ev,async e=>{const z=e.target&&e.target.closest&&e.target.closest('#crdrop');if(!z)return;e.preventDefault();if(ev==='dragover')return z.classList.add('on');z.classList.remove('on');if(ev!=='drop')return;
 const items=[...(e.dataTransfer.items||[])].map(i=>i.webkitGetAsEntry&&i.webkitGetAsEntry()).filter(Boolean),out=[];if(items.length){for(const it of items)await crlWalk(it,out)}else out.push(...e.dataTransfer.files);crlFiles(out)}));

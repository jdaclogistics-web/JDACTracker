/* ===== Menu clean-up =====
   · KPIs removed: each person's task score lives in Tasks.
   · App blueprint only for Darshan and Nameera. */
const _allowedM2=allowed;allowed=function(v){if(v==='kpi')return false;if(v==='blueprint')return ['darshan','nameera'].includes(S.me);return _allowedM2(v)};
const _tabsM2=tabsFor;tabsFor=function(who){return _tabsM2(who).filter(x=>x[0]!=='kpi'&&(x[0]!=='blueprint'||['darshan','nameera'].includes(who||S.me)))};
const _renderM2=render;render=function(){if(S.v==='kpi')S.v='tasks';if(S.v==='blueprint'&&!['darshan','nameera'].includes(S.me))S.v='home';const r=_renderM2.apply(this,arguments);try{vtAttach()}catch(x){}return r};

/* ===== Voice typing in every chat box (Team chat, announcements, WhatsApp, notes) =====
   Uses the browser's speech recognition (Chrome / Edge / Android Chrome). English or Hindi. */
const VT={rec:null,on:false,base:'',lang:(()=>{try{return localStorage.getItem('vtLang')||'en-IN'}catch(x){return 'en-IN'}})()};
const vtSupported=()=>!!(window.SpeechRecognition||window.webkitSpeechRecognition);
function vtBoxes(){return [...document.querySelectorAll('textarea#msg, textarea#gmTx, #tcMsg, textarea[data-vt-ok]')]}
function vtAttach(){vtBoxes().forEach(ta=>{if(ta.dataset.vt)return;ta.dataset.vt='1';const w=document.createElement('span');w.className='vtw';
 w.innerHTML=`<button type="button" class="vtl" title="Voice typing language">${VT.lang==='hi-IN'?'हिं':'EN'}</button><button type="button" class="vtb ${VT.on?'on':''}" title="Voice typing — tap and speak" aria-label="Voice typing">${VT.on?'■':'🎤'}</button>`;
 const box=document.createElement('span');box.className='vtbox';ta.parentNode.insertBefore(box,ta);box.appendChild(ta);ta.classList.add('vtpad');box.appendChild(w);
 w.querySelector('.vtb').onclick=()=>vtToggle();w.querySelector('.vtl').onclick=()=>{VT.lang=VT.lang==='hi-IN'?'en-IN':'hi-IN';try{localStorage.setItem('vtLang',VT.lang)}catch(x){}document.querySelectorAll('.vtl').forEach(b=>b.textContent=VT.lang==='hi-IN'?'हिं':'EN');toast(VT.lang==='hi-IN'?'Voice typing: Hindi':'Voice typing: English');if(VT.on){vtStop();vtToggle()}}})}
const vtBox=()=>vtBoxes()[0];
function vtUi(){document.querySelectorAll('.vtb').forEach(b=>{b.classList.toggle('on',VT.on);b.textContent=VT.on?'■':'🎤'})}
function vtStop(){VT.on=false;try{VT.rec&&VT.rec.stop()}catch(x){}VT.rec=null;vtUi()}
function vtToggle(){if(VT.on)return vtStop();if(!vtSupported())return toast('Voice typing works in Chrome or Edge');const ta=vtBox();if(!ta)return;
 const R=new (window.SpeechRecognition||window.webkitSpeechRecognition)();R.lang=VT.lang;R.continuous=true;R.interimResults=true;VT.base=ta.value?ta.value.replace(/\s*$/,' '):'';let fin='';
 R.onresult=ev=>{let tmp='';for(let i=ev.resultIndex;i<ev.results.length;i++){const t=ev.results[i][0].transcript;if(ev.results[i].isFinal)fin+=t+' ';else tmp+=t}const b=vtBox();if(b){b.value=VT.base+fin+tmp;b.dispatchEvent(new Event('input',{bubbles:true}))}};
 R.onerror=e=>{if(e.error==='not-allowed')toast('Allow the microphone for this site to use voice typing');vtStop()};R.onend=()=>{if(VT.on){vtStop()}};
 try{R.start();VT.rec=R;VT.on=true;vtUi();toast('Listening… tap ■ to stop')}catch(x){toast('Could not start the microphone')}}
document.addEventListener('click',e=>{if(VT.on&&e.target.closest&&e.target.closest('[data-a="cmSend"],[data-a="send"],[data-a="tcSend"],[data-a="gSend"]'))vtStop()},true);
setTimeout(()=>{try{vtAttach()}catch(x){}},1200);
document.head.insertAdjacentHTML('beforeend',`<style>.vtbox{position:relative;display:flex;flex:1 1 auto;min-width:0;align-self:stretch}.vtbox>textarea{flex:1;width:100%}.vtw{position:absolute;right:8px;top:50%;transform:translateY(-50%);display:flex;gap:4px;z-index:2}.vtpad{padding-right:84px!important}
.vtb,.vtl{border:1px solid var(--line);background:#fff;border-radius:99px;height:30px;min-width:30px;padding:0 8px;cursor:pointer;font:600 12px Inter,sans-serif;display:grid;place-items:center}.vtb{font-size:15px}
.vtb.on{background:#C0392B;color:#fff;border-color:#C0392B;animation:vtp 1.2s infinite}@keyframes vtp{0%{box-shadow:0 0 0 0 rgba(192,57,43,.45)}100%{box-shadow:0 0 0 10px rgba(192,57,43,0)}}</style>`);

/* ===== Incentives: only Balaji, Imran, Neetu (CSE) and Snehal B (HR recruiter) ===== */
const INC_OK=['balaji','imran','neetu','snehalb'];
let incOk=k=>INC_OK.includes(k);
const _myIncC2=myIncCard;myIncCard=function(k){return incOk(k)?_myIncC2(k):''};
['home','me'].forEach(v=>{const f=V[v];if(!f)return;V[v]=function(){if(incOk(S.me))return f.apply(this,arguments);const L=D.ledger;D.ledger=L.filter(l=>l.k!==S.me);try{return f.apply(this,arguments)}finally{D.ledger=L}}});

/* ===== Tasks → Scoreboard: every person's task score in one place ===== */
const _tHeadSB=taskHead;taskHead=function(me){return _tHeadSB(me).replace(/(<button[^>]*data-t="time"[\s\S]*?<\/button>)/,`$1<button class="${S.ttab==='score'?'on':''}" data-a="ttab" data-t="score" ${S.ttab==='score'?'aria-current="page"':''}>${ic('star')}<span>Scoreboard</span></button>`)};
function sbRows(p){const m=TODAY.slice(0,7),inP=t=>!t.due?p==='all':p==='all'?true:p==='week'?t.due>=addD(TODAY,-6)&&t.due<=addD(TODAY,7):t.due.slice(0,7)===m;
 const who=STAFF.filter(k=>k!=='darshan'&&!isZen(k)&&(P[k]||{}).kind!=='boss');
 return who.map(k=>{const T=D.tasks.filter(t=>t.o===k&&inP(t)),done=T.filter(t=>t.st==='Done'),dueNow=T.filter(t=>t.due&&t.due<=TODAY),late=T.filter(t=>t.st!=='Done'&&t.due&&t.due<TODAY),
  onTime=done.filter(t=>!t.doneAt||!t.due||t.doneAt.slice(0,10)<=t.due).length,base=Math.max(1,dueNow.length);
  const s=T.length?Math.round(Math.min(100,(onTime/base)*70+(done.length/T.length)*30)):null;return {k,n:T.length,done:done.length,open:T.length-done.length,late:late.length,onTime,s}}).filter(r=>r.n).sort((a,b)=>(b.s??-1)-(a.s??-1))}
const _vtSB=V.tasks;V.tasks=()=>{if(S.ttab!=='score')return _vtSB();const me=ME()||{n:''},p=S.sbp||'month';let R=sbRows(p);const adm=['darshan','nameera'].includes(S.me);if(!adm)R=R.filter(r=>r.k===S.me);
 const team=k=>(P[k]||{}).r||'';
 return taskHead(me)+`<div class="sbbar">${chips([['week','This week'],['month','This month'],['all','All time']],p,'sbP')}<span class="sp"></span><span class="xs mut">${adm?'Everyone':'Only you can see your score'} · Score = 70% tasks done by their due date + 30% tasks finished</span></div>
 <div class="xsheet"><table><thead><tr><th>#</th><th class="stk">Person</th><th class="n">Tasks</th><th class="n">Done</th><th class="n">On time</th><th class="n">Open</th><th class="n">Overdue</th><th style="min-width:220px">Score</th></tr></thead><tbody>
 ${R.map((r,i)=>`<tr><td>${i+1}</td><td class="stk"><div class="row nw" style="gap:8px">${av(nm(r.k))}<div><b>${h(nmF(r.k))}</b><span class="xs mut" style="display:block">${h(team(r.k))}</span></div></div></td><td class="n">${r.n}</td><td class="n">${r.done}</td><td class="n">${r.onTime}</td><td class="n">${r.open}</td><td class="n" style="color:${r.late?'#C0392B':'inherit'};font-weight:${r.late?700:400}">${r.late}</td>
  <td><div class="sbsc"><div class="sbb"><i style="width:${r.s||0}%;background:${r.s>=75?'#1F9D55':r.s>=50?'#E8A317':'#C0392B'}"></i></div><b>${r.s??'—'}</b></div></td></tr>`).join('')||'<tr><td colspan="8" class="mut" style="text-align:center;padding:18px">No tasks in this period</td></tr>'}</tbody></table></div>`};
A.sbP=e=>{S.sbp=e.dataset.t;render()};
/* remember when a task is finished, so "on time" is exact */
document.addEventListener('click',()=>setTimeout(()=>{let ch=0;(D.tasks||[]).forEach(t=>{if(t.st==='Done'&&!t.doneAt){t.doneAt=TODAY;ch=1}});if(ch)try{save()}catch(x){}},400),true);
document.head.insertAdjacentHTML('beforeend',`<style>.sbbar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:12px 0}.sbsc{display:flex;align-items:center;gap:10px}.sbb{flex:1;height:9px;background:#EEF1F6;border-radius:6px;overflow:hidden}.sbb i{display:block;height:100%;border-radius:6px}.sbsc b{min-width:28px;text-align:right}</style>`);
/* motivational line: highlighted, with a soft shine */
document.head.insertAdjacentHTML('beforeend',`<style>.dctx{text-align:left}
.g5 .gline{display:inline-flex!important;align-items:center;gap:8px;font:700 15px Outfit,Inter,sans-serif!important;font-style:normal!important;letter-spacing:.01em;padding:8px 16px 8px 12px;border-radius:999px;color:#fff!important;
 background:linear-gradient(100deg,#1D3378 0%,#2F4FB8 45%,#5B78E0 52%,#2F4FB8 60%,#1D3378 100%);background-size:240% 100%;border:1px solid #1D3378;box-shadow:0 6px 16px -6px rgba(36,64,142,.55);animation:glshine 4.5s ease-in-out infinite}
.g5 .gline:before{content:"✦";color:#FFB547;font-size:14px;animation:glstar 2.4s ease-in-out infinite}
@keyframes glshine{0%,100%{background-position:100% 0}50%{background-position:0 0}}@keyframes glstar{0%,100%{transform:scale(1) rotate(0);opacity:.8}50%{transform:scale(1.25) rotate(20deg);opacity:1}}
@media (prefers-reduced-motion:reduce){.g5 .gline,.g5 .gline:before{animation:none}}</style>`);

/* ===== Settings: more options ===== */
const ST_LS=(k,v)=>{try{if(v===undefined)return localStorage.getItem('jdst_'+k);localStorage.setItem('jdst_'+k,v)}catch(x){}};
const stSec=(k,ico,title,cur,body)=>`<details class="bpsec bpdd" ${(S.stO||{})[k]?'open':''}><summary class="bph" data-a="stO" data-k="${k}"><span class="bpsi">${ico}</span>${title}${cur?` <span class="bpcount">${cur}</span>`:''}</summary><div style="padding:12px 14px">${body}</div></details>`;
const stOpt=(a,v,l,d,on,ico)=>`<button class="uio ${on?'on':''}" data-a="${a}" data-v="${v}" aria-pressed="${on}"><span class="uii">${ico||''}</span><b>${l}</b>${d?`<span>${d}</span>`:''}</button>`;
const ST_PAGES=[['home','Dashboard','📊'],['tasks','Tasks','✅'],['chat','Communication','💬'],['people','HR Desk','🧑‍💼'],['money','Accounts','₹'],['wallet','JD Wallet','👛']];
const _stMore=V.settings;V.settings=()=>{let o=_stMore();const me=P[S.me]||{},live=typeof LV!=='undefined'&&LV.ok,start=ST_LS('start')||'home',sb=ST_LS('sb')||'open',adm=['darshan','nameera'].includes(S.me);
 const acct=stSec('sAcc','👤','My account',h(nmF(S.me)),`<div class="stacc">${av(nm(S.me))}<div><b>${h(nmF(S.me))}</b><div class="xs mut">${h(me.r||'')}${live&&LV.me&&LV.me.username?' · User ID '+h(LV.me.username):''}</div></div></div>
  <div class="row" style="gap:8px;margin-top:12px">${live?`${adm?'<button class="btn sm sec" data-a="stPw">Change password</button>':''}<button class="btn sm sec" data-a="lvOut">Sign out</button>`:''}</div>`);
 const startS=stSec('sStart','🏠','Start page',h((ST_PAGES.find(x=>x[0]===start)||[0,'Dashboard'])[1]),`<p class="xs mut" style="margin:0 0 10px">The page that opens first when you open the panel.</p><div class="uiopts">${ST_PAGES.filter(x=>allowed(x[0])).map(([k,l,i])=>stOpt('stStart',k,l,'',start===k,i)).join('')}</div>`);
 const menuS=stSec('sMenu','📌','Side menu',sb==='closed'?'Small':'Full',`<div class="uiopts">${stOpt('stSb','open','Full menu','Names and icons',sb!=='closed','📖')}${stOpt('stSb','closed','Small menu','Icons only, more space',sb==='closed','📏')}</div>`);
 const voiceS=stSec('sVoice','🎤','Voice typing',VT.lang==='hi-IN'?'Hindi':'English',`<p class="xs mut" style="margin:0 0 10px">Tap 🎤 in any chat box and speak. Works in Chrome and Edge.</p><div class="uiopts">${stOpt('stVt','en-IN','English','',VT.lang==='en-IN','🇬🇧')}${stOpt('stVt','hi-IN','हिंदी · Hindi','',VT.lang==='hi-IN','🇮🇳')}</div>`);
 const cos=(typeof cmCos==='function'?cmCos():[]).filter(k=>k!=='all'),dco=ST_LS('cmco')||cos[0];
 const commS=cos.length>1?stSec('sComm','💬','Communication','Opens '+h(cmInfo(dco)[1]),`<p class="xs mut" style="margin:0 0 10px">Company that opens first in Communication.</p><div class="uiopts">${cos.map(k=>stOpt('stCo',k,cmInfo(k)[1],'',dco===k,'🏢')).join('')}</div>`):'';
 const incS=adm?stSec('sInc','🎯','Incentives · who is eligible',incList().length+' people',`<p class="xs mut" style="margin:0 0 10px">Only these people see incentives and can be given one.</p><div class="uiopts">${STAFF.filter(k=>!['darshan'].includes(k)&&!isZen(k)).map(k=>stOpt('stInc',k,nmF(k),(P[k]||{}).r||'',incOk(k),incOk(k)?'✅':'➖')).join('')}</div>`):'';
 const bdS=adm?stSec('sBday','🎂','Birthday reminders',D.bdayOff?'Off':'On · to Nameera',`<p class="xs mut" style="margin:0 0 10px">Nameera gets a reminder one day before every employee's birthday.</p><div class="uiopts">${stOpt('stBd','on','On','',!D.bdayOff,'🔔')}${stOpt('stBd','off','Off','',!!D.bdayOff,'🔕')}</div>`):'';
 const appS=stSec('sApp','🔄','App',`updated ${new Date(document.lastModified).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}`,`<p class="xs mut" style="margin:0 0 10px">If something looks old, load the latest version.</p><button class="btn sm" data-a="stReload">Load latest version</button> <a class="btn sm sec" href="https://github.com/jdaclogistics-web/JDACTracker/releases/download/apk-latest/JDAC-Tracker.apk" target="_blank" rel="noopener">Download phone app</a>`);
 return o+`<div class="stmore">${acct}${bdS}${appS}</div>`};
A.stStart=e=>{ST_LS('start',e.dataset.v);render();toast('Start page saved')};
A.stSb=e=>{ST_LS('sb',e.dataset.v);S.sbc=e.dataset.v==='closed';render()};
A.stVt=e=>{VT.lang=e.dataset.v;try{localStorage.setItem('vtLang',VT.lang)}catch(x){}render()};
A.stCo=e=>{ST_LS('cmco',e.dataset.v);S.cmco=e.dataset.v;render();toast('Saved')};
A.stBd=e=>{D.bdayOff=e.dataset.v==='off';save();render()};
A.stInc=e=>{const k=e.dataset.v,L=incList();D.incOk=L.includes(k)?L.filter(x=>x!==k):[...L,k];save();render()};
A.stReload=()=>{location.reload()};
A.stPw=()=>sheet(`<h2>Change password</h2><label for="stp0">Current password</label><input id="stp0" type="password" autocomplete="current-password"><label for="stp1">New password</label><input id="stp1" type="password" autocomplete="new-password" placeholder="At least 6 characters"><label for="stp2">New password again</label><input id="stp2" type="password" autocomplete="new-password"><button class="btn w" style="margin-top:14px" data-a="stPwGo">Change password</button>`);
A.stPwGo=async()=>{const a=val('stp0'),b=val('stp1'),c=val('stp2');if(!a||b.length<6)return toast('New password needs at least 6 characters');if(b!==c)return toast('The two new passwords do not match');
 try{await lapi('POST','/api/me/password',{current:a,password:b});closeM();toast('Password changed')}catch(e){toast(e.message||'Could not change password')}};
/* incentives list is editable in Settings */
function incList(){return Array.isArray(D.incOk)?D.incOk:INC_OK}
incOk=k=>incList().includes(k);
/* apply saved start page, side menu and default company once on load */
(()=>{const st=ST_LS('start'),sb=ST_LS('sb'),co=ST_LS('cmco');if(sb)S.sbc=sb==='closed';if(co)S.cmco=co;let first=false;try{first=!sessionStorage.getItem('jdOpened');sessionStorage.setItem('jdOpened','1')}catch(x){}if(st&&first)setTimeout(()=>{if(allowed(st)){S.v=st;render()}},300)})();
/* birthday reminder can be turned off */
document.head.insertAdjacentHTML('beforeend',`<style>.stmore{margin-top:2px}.stacc{display:flex;align-items:center;gap:12px}.stacc b{font-size:15px}</style>`);

/* ===== Profile photos: everyone can add their own (Settings → My account) ===== */
D.photos=D.photos||{};
const phByName=()=>{const M={};Object.keys(P).forEach(k=>{[P[k].n,nm(k),nmF(k)].forEach(x=>{if(x)M[x]=k})});(D.emp||[]).forEach(e=>{if(e.k&&e.n)M[e.n]=e.k});return M};
let PHN=null;avPhoto=function(n){if(!PHN)PHN=phByName();const k=PHN[n];return k&&D.photos[k]||null};
async function phPull(){if(!(typeof LV!=='undefined'&&LV.ok))return;try{const r=await lapi('GET','/api/photos');let ch=0;r.photos.forEach(p=>{if(D.photos[p.key]!==p.img){D.photos[p.key]=p.img;ch=1}});if(ch){save();render()}}catch(x){}}
setTimeout(phPull,3000);setInterval(()=>{if(document.visibilityState==='visible')phPull()},600000);
function phShrink(file){return new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const z=192,c=document.createElement('canvas');c.width=c.height=z;const g=c.getContext('2d'),m=Math.min(im.width,im.height);g.drawImage(im,(im.width-m)/2,(im.height-m)/2,m,m,0,0,z,z);ok(c.toDataURL('image/jpeg',.82))};im.onerror=no;im.src=r.result};r.onerror=no;r.readAsDataURL(file)})}
async function phSave(img){D.photos[S.me]=img||undefined;if(!img)delete D.photos[S.me];PHN=null;save();render();
 if(typeof LV!=='undefined'&&LV.ok){try{await lapi('POST','/api/me/photo',{key:S.me,img:img||''});toast(img?'Photo saved · everyone sees it':'Photo removed')}catch(e){toast('Saved here only: '+e.message)}}else toast(img?'Photo saved':'Photo removed')}
document.addEventListener('change',async e=>{if(e.target&&e.target.id==='phIn'&&e.target.files[0]){const f=e.target.files[0];if(!/^image\//.test(f.type))return toast('Choose a photo');try{await phSave(await phShrink(f))}catch(x){toast('Could not read that photo')}}});
A.phDel=()=>phSave('');
const _stPh=V.settings;V.settings=()=>{const o=_stPh(),my=D.photos[S.me];
 return o.replace('<div class="row" style="gap:8px;margin-top:12px">',m=>`<div class="phrow"><label class="btn sm" for="phIn" style="cursor:pointer">${ic('plus')}${my?'Change photo':'Add my photo'}</label><input id="phIn" type="file" accept="image/*" hidden>${my?'<button class="btn sm sec" data-a="phDel">Remove photo</button>':''}<span class="xs mut">Shows next to your name everywhere in the panel.</span></div>`+m)};
document.head.insertAdjacentHTML('beforeend',`<style>.av.avp{background:#E9EDF5;padding:0;overflow:hidden}.av.avp img{width:100%;height:100%;object-fit:cover;display:block;border-radius:inherit}.stacc .av{width:56px!important;height:56px!important;font-size:18px!important}.phrow{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:12px}</style>`);
/* daily line in an elegant serif italic */
document.head.insertAdjacentHTML('beforeend',`<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,600;1,700&display=swap"><style>.g5 .gline{font-family:'Playfair Display',Georgia,serif!important;font-style:italic!important;font-weight:600!important;font-size:16.5px!important;letter-spacing:.015em;padding:8px 18px 8px 14px}.g5 .gline:before{font-style:normal}</style>`);

/* ===== Settings → Login details (Darshan and Nameera): copy or WhatsApp each person's login ===== */
const LG_URL='https://jdaclogistics-web.github.io/JDACTracker/',LG_APK='https://github.com/jdaclogistics-web/JDACTracker/releases/download/apk-latest/JDAC-Tracker.apk';
S.lgPw=S.lgPw||{};
async function lgLoad(){if(S.lgBusy)return;S.lgBusy=1;try{const r=await lapi('GET','/api/admin/employees');S.lgList=r.employees.filter(e=>e.active!==0&&e.active!==false);}catch(e){S.lgErr=e.message}S.lgBusy=0;if(S.v==='settings')render()}
const lgPwText=e=>S.lgPw[e.id]?S.lgPw[e.id]:e.pw_phone?(e.phone?String(e.phone).replace(/\D/g,'').slice(-10):'their mobile number'):null;
const lgMsg=e=>{const pw=lgPwText(e);return `JDAC Team App login\n\nName: ${e.name}\nUser ID: ${e.username}\nPassword: ${pw||'(the password they set)'}\n\nOpen on computer: ${LG_URL}\nPhone app: ${LG_APK}\n\nPlease change your password after first login (Tool Section → Settings → My account).`};
const _stLogin=V.settings;V.settings=()=>{const o=_stLogin();if(!['darshan','nameera'].includes(S.me))return o;const live=typeof LV!=='undefined'&&LV.ok;
 if(live&&!S.lgList&&!S.lgBusy&&(S.stO||{}).sLogin)setTimeout(lgLoad,0);const L=S.lgList||[],q=(S.lgQ||'').toLowerCase();
 const body=!live?'<p class="xs mut">Sign in with your User ID to see everyone\'s login details.</p>':!S.lgList?'<p class="xs mut">Loading…</p>':`<div class="sfq" style="background:#fff;border:1px solid var(--line);max-width:320px;margin-bottom:10px">${sfi('search',15)}<label class="sr" for="lgq">Search</label><input id="lgq" value="${h(S.lgQ||'')}" placeholder="Search name or User ID"></div>
  <div class="xsheet"><table><thead><tr><th class="stk">Person</th><th>User ID</th><th>Password</th><th></th></tr></thead><tbody>${L.filter(e=>!q||(e.name+' '+e.username).toLowerCase().includes(q)).map(e=>{const pw=lgPwText(e);return `<tr><td class="stk"><b>${h(e.name)}</b><span>${h(e.designation||e.role||'')}</span></td><td><code class="jwid">${h(e.username)}</code></td><td>${pw?`<code class="jwid">${h(pw)}</code>${e.pw_phone&&!S.lgPw[e.id]?' <span class="xs mut">(mobile no.)</span>':''}`:'<span class="xs mut">Set by them</span>'}</td>
   <td><div class="row nw" style="gap:6px"><button class="btn sm sec" data-a="lgCopy" data-id="${e.id}">Copy</button>${e.phone?`<button class="btn sm sec" data-a="lgWa" data-id="${e.id}">WhatsApp</button>`:''}<button class="btn sm sec" data-a="lgReset" data-id="${e.id}">New password</button></div></td></tr>`}).join('')}</tbody></table></div>
  <p class="xs mut" style="margin-top:8px">Passwords people set themselves can't be seen by anyone. Use <b>New password</b> to make a fresh one, then copy or send it.</p>`;
 return o;stSec('sLogin','🔑','Login details',live&&S.lgList?L.length+' people':'',body)};
const lgFind=id=>(S.lgList||[]).find(e=>String(e.id)===String(id));
A.lgCopy=async e=>{const x=lgFind(e.dataset.id);if(!x)return;try{await navigator.clipboard.writeText(lgMsg(x));toast('Login details copied')}catch(err){sheet(`<h2>Copy login</h2><textarea rows="10" style="width:100%">${h(lgMsg(x))}</textarea>`)}};
A.lgWa=e=>{const x=lgFind(e.dataset.id);if(!x)return;const ph=String(x.phone||'').replace(/\D/g,'').slice(-10);window.open('https://wa.me/91'+ph+'?text='+encodeURIComponent(lgMsg(x)),'_blank')};
A.lgReset=async e=>{const x=lgFind(e.dataset.id);if(!x)return;if(!confirm(`Make a new password for ${x.name}? Their old password will stop working.`))return;
 const pw='Jd'+Math.random().toString(36).slice(2,6)+Math.floor(10+Math.random()*89);try{await lapi('PATCH','/api/admin/employees/'+x.id,{new_password:pw});S.lgPw[x.id]=pw;render();toast('New password ready · copy or send it')}catch(err){toast(err.message||'Could not change the password')}};
document.addEventListener('input',e=>{if(e.target.id==='lgq'){S.lgQ=e.target.value;const p=e.target.selectionStart;render();const i=document.getElementById('lgq');if(i){i.focus();i.setSelectionRange(p,p)}}});

/* ===== HR Desk → Employee Master → Login credentials (Darshan and Nameera) =====
   User ID = Emp ID (JD1001), password = their mobile number. Only Darshan and Nameera can change a password. */
const lcPh=e=>String(e.ph||'').replace(/\D/g,'').slice(-10);
const lcPw=e=>(S.lcPw||{})[e.id]||lcPh(e)||'—';
const lcMsg=e=>`JDAC Team App login\n\nName: ${e.n}\nUser ID: ${e.id}\nPassword: ${lcPw(e)}\n\nOpen on computer: ${LG_URL}\nPhone app: ${LG_APK}`;
function pLogin(){if(!['darshan','nameera'].includes(S.me))return empty('Only Darshan and Nameera can see login credentials');const q=(S.lcQ||'').toLowerCase(),L=D.emp.filter(e=>e.st==='Active'&&(!q||(e.n+' '+e.id+' '+e.ph).toLowerCase().includes(q))).sort((a,b)=>String(a.id).localeCompare(String(b.id)));
 return `<div class="row" style="gap:8px;margin-bottom:10px"><div class="sfq" style="background:#fff;border:1px solid var(--line);min-width:260px">${sfi('search',15)}<label class="sr" for="lcq">Search</label><input id="lcq" value="${h(S.lcQ||'')}" placeholder="Search name, ID or phone"></div><span class="sp"></span><button class="btn sm sec" data-a="lcAll">${ic('dl')}Copy all</button></div>
 <div class="xsheet"><table><thead><tr><th class="stk">Employee</th><th>User ID</th><th>Password</th><th>Share</th><th>Change</th></tr></thead><tbody>${L.map(e=>`<tr><td class="stk"><b>${h(e.n)}</b><span>${h(e.desig||'')}</span></td><td><code class="jwid">${h(e.id)}</code></td><td><code class="jwid">${h(lcPw(e))}</code>${(S.lcPw||{})[e.id]?' <span class="xs" style="color:#1F9D55">new</span>':' <span class="xs mut">mobile no.</span>'}</td>
  <td><div class="row nw" style="gap:6px"><button class="btn sm sec" data-a="lcCopy" data-id="${e.id}">Copy</button>${lcPh(e)?`<button class="btn sm sec" data-a="lcWa" data-id="${e.id}">WhatsApp</button>`:''}</div></td><td><button class="btn sm sec" data-a="lcSet" data-id="${e.id}">Change password</button></td></tr>`).join('')}</tbody></table></div>
 <p class="xs mut" style="margin-top:8px">Staff can't change their own password — only Darshan and Nameera can, from here.</p>`}
const lcE=id=>D.emp.find(e=>e.id===id);
A.lcCopy=async e=>{const x=lcE(e.dataset.id);try{await navigator.clipboard.writeText(lcMsg(x));toast('Copied · '+x.n)}catch(err){sheet(`<h2>Copy login</h2><textarea rows="9" style="width:100%">${h(lcMsg(x))}</textarea>`)}};
A.lcAll=async()=>{const t=D.emp.filter(e=>e.st==='Active').map(e=>`${e.n} — User ID: ${e.id} · Password: ${lcPw(e)}`).join('\n');try{await navigator.clipboard.writeText('JDAC Team App logins\n'+LG_URL+'\n\n'+t);toast('All logins copied')}catch(err){sheet(`<h2>All logins</h2><textarea rows="14" style="width:100%">${h(t)}</textarea>`)}};
A.lcWa=e=>{const x=lcE(e.dataset.id);window.open('https://wa.me/91'+lcPh(x)+'?text='+encodeURIComponent(lcMsg(x)),'_blank')};
A.lcSet=e=>{const x=lcE(e.dataset.id);sheet(`<h2>Change password · ${h(x.n)}</h2><p class="xs mut">User ID ${h(x.id)}. Their old password stops working.</p><label for="lcp">New password</label><input id="lcp" value="${h(lcPh(x))}" placeholder="At least 6 characters"><p class="xs mut">Leave it as their mobile number to reset to the default.</p><button class="btn w" style="margin-top:12px" data-a="lcSetGo" data-id="${x.id}">Save password</button>`)};
A.lcSetGo=async e=>{const x=lcE(e.dataset.id),pw=val('lcp').trim();if(pw.length<6)return toast('At least 6 characters');
 if(!(typeof LV!=='undefined'&&LV.ok))return toast('Sign in with your User ID first');
 try{if(!S.lgList){const r=await lapi('GET','/api/admin/employees');S.lgList=r.employees}const ph=lcPh(x),sv=S.lgList.find(s=>String(s.username).toLowerCase()===String(x.id).toLowerCase())||S.lgList.find(s=>ph&&String(s.phone||'').replace(/\D/g,'').slice(-10)===ph);
  if(!sv)return toast('No login found for '+x.n+' on the server');
  await lapi('PATCH','/api/admin/employees/'+sv.id,pw===ph&&sv.phone?{password_phone:true}:{new_password:pw});S.lcPw=S.lcPw||{};S.lcPw[x.id]=pw;closeM();render();toast('Password changed · '+x.n)}catch(err){toast(err.message||'Could not change the password')}};
document.addEventListener('input',e=>{if(e.target.id==='lcq'){S.lcQ=e.target.value;const p=e.target.selectionStart;render();const i=document.getElementById('lcq');if(i){i.focus();i.setSelectionRange(p,p)}}});

/* ===== HR Desk → Incentives: who is eligible (moved here from Settings) ===== */
const _pIncM2=pInc;pInc=function(){const o=_pIncM2();if(!['darshan','nameera'].includes(S.me))return o;
 return `<div class="card" style="margin:0 0 12px;padding:12px 14px"><div class="row nw" style="margin-bottom:8px"><b>Who is eligible for incentives</b><span class="sp"></span><span class="xs mut">${incList().length} people · tap to add or remove</span></div><div class="incel">${STAFF.filter(k=>!['darshan'].includes(k)&&!isZen(k)&&P[k]&&(P[k].kind||'')!=='partner').map(k=>`<button class="${incOk(k)?'on':''}" data-a="stInc" data-v="${k}">${incOk(k)?'✓ ':''}${h(P[k].n||nmF(k))}</button>`).join('')}</div></div>`+o};
document.head.insertAdjacentHTML('beforeend',`<style>.incel{display:flex;flex-wrap:wrap;gap:6px}.incel button{border:1px solid var(--line);background:#fff;border-radius:99px;padding:6px 12px;font:600 12.5px Inter,sans-serif;cursor:pointer}.incel button.on{background:#1F9D55;border-color:#1F9D55;color:#fff}</style>`);

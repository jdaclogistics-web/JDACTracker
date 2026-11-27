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
const _vtSB=V.tasks;V.tasks=()=>{if(S.ttab!=='score')return _vtSB();const me=ME()||{n:''},p=S.sbp||'month';let R=sbRows(p);const adm=isAdm();if(!adm)R=R.filter(r=>r.k===S.me);
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
.g5 .gline{display:inline-flex!important;align-items:center;gap:8px;font:700 15px Outfit,Inter,sans-serif!important;font-style:normal!important;letter-spacing:.01em;padding:8px 16px 8px 12px;border-radius:999px;color:#7A3E00!important;
 background:linear-gradient(100deg,#FFF3D6 0%,#FFE1A8 45%,#FFF6E2 55%,#FFE1A8 100%);background-size:220% 100%;border:1px solid #F6C46B;box-shadow:0 4px 14px -6px rgba(242,140,40,.55);animation:glshine 4.5s ease-in-out infinite}
.g5 .gline:before{content:"✦";color:#F28C28;font-size:14px;animation:glstar 2.4s ease-in-out infinite}
@keyframes glshine{0%,100%{background-position:100% 0}50%{background-position:0 0}}@keyframes glstar{0%,100%{transform:scale(1) rotate(0);opacity:.8}50%{transform:scale(1.25) rotate(20deg);opacity:1}}
@media (prefers-reduced-motion:reduce){.g5 .gline,.g5 .gline:before{animation:none}}</style>`);

/* ===== Settings: more options ===== */
const ST_LS=(k,v)=>{try{if(v===undefined)return localStorage.getItem('jdst_'+k);localStorage.setItem('jdst_'+k,v)}catch(x){}};
const stSec=(k,ico,title,cur,body)=>`<details class="bpsec bpdd" ${(S.stO||{})[k]?'open':''}><summary class="bph" data-a="stO" data-k="${k}"><span class="bpsi">${ico}</span>${title}${cur?` <span class="bpcount">${cur}</span>`:''}</summary><div style="padding:12px 14px">${body}</div></details>`;
const stOpt=(a,v,l,d,on,ico)=>`<button class="uio ${on?'on':''}" data-a="${a}" data-v="${v}" aria-pressed="${on}"><span class="uii">${ico||''}</span><b>${l}</b>${d?`<span>${d}</span>`:''}</button>`;
const ST_PAGES=[['home','Dashboard','📊'],['tasks','Tasks','✅'],['chat','Communication','💬'],['people','HR Desk','🧑‍💼'],['money','Accounts','₹'],['wallet','JD Wallet','👛']];
const _stMore=V.settings;V.settings=()=>{let o=_stMore();const me=P[S.me]||{},live=typeof LV!=='undefined'&&LV.ok,start=ST_LS('start')||'home',sb=ST_LS('sb')||'open',adm=['darshan','nameera'].includes(S.me);
 const acct=stSec('sAcc','👤','My account',h(nmF(S.me)),`<div class="stacc">${av(nm(S.me))}<div><b>${h(nmF(S.me))}</b><div class="xs mut">${h(me.r||'')}${live&&LV.me&&LV.me.username?' · User ID '+h(LV.me.username):''}</div></div></div>
  <div class="row" style="gap:8px;margin-top:12px">${live?`<button class="btn sm sec" data-a="stPw">Change password</button><button class="btn sm sec" data-a="lvOut">Sign out</button>`:'<span class="xs mut">Sign in with your User ID to change your password.</span>'}</div>`);
 const startS=stSec('sStart','🏠','Start page',h((ST_PAGES.find(x=>x[0]===start)||[0,'Dashboard'])[1]),`<p class="xs mut" style="margin:0 0 10px">The page that opens first when you open the panel.</p><div class="uiopts">${ST_PAGES.filter(x=>allowed(x[0])).map(([k,l,i])=>stOpt('stStart',k,l,'',start===k,i)).join('')}</div>`);
 const menuS=stSec('sMenu','📌','Side menu',sb==='closed'?'Small':'Full',`<div class="uiopts">${stOpt('stSb','open','Full menu','Names and icons',sb!=='closed','📖')}${stOpt('stSb','closed','Small menu','Icons only, more space',sb==='closed','📏')}</div>`);
 const voiceS=stSec('sVoice','🎤','Voice typing',VT.lang==='hi-IN'?'Hindi':'English',`<p class="xs mut" style="margin:0 0 10px">Tap 🎤 in any chat box and speak. Works in Chrome and Edge.</p><div class="uiopts">${stOpt('stVt','en-IN','English','',VT.lang==='en-IN','🇬🇧')}${stOpt('stVt','hi-IN','हिंदी · Hindi','',VT.lang==='hi-IN','🇮🇳')}</div>`);
 const cos=(typeof cmCos==='function'?cmCos():[]).filter(k=>k!=='all'),dco=ST_LS('cmco')||cos[0];
 const commS=cos.length>1?stSec('sComm','💬','Communication','Opens '+h(cmInfo(dco)[1]),`<p class="xs mut" style="margin:0 0 10px">Company that opens first in Communication.</p><div class="uiopts">${cos.map(k=>stOpt('stCo',k,cmInfo(k)[1],'',dco===k,'🏢')).join('')}</div>`):'';
 const incS=adm?stSec('sInc','🎯','Incentives · who is eligible',incList().length+' people',`<p class="xs mut" style="margin:0 0 10px">Only these people see incentives and can be given one.</p><div class="uiopts">${STAFF.filter(k=>!['darshan'].includes(k)&&!isZen(k)).map(k=>stOpt('stInc',k,nmF(k),(P[k]||{}).r||'',incOk(k),incOk(k)?'✅':'➖')).join('')}</div>`):'';
 const bdS=adm?stSec('sBday','🎂','Birthday reminders',D.bdayOff?'Off':'On · to Nameera',`<p class="xs mut" style="margin:0 0 10px">Nameera gets a reminder one day before every employee's birthday.</p><div class="uiopts">${stOpt('stBd','on','On','',!D.bdayOff,'🔔')}${stOpt('stBd','off','Off','',!!D.bdayOff,'🔕')}</div>`):'';
 const appS=stSec('sApp','🔄','App',`updated ${new Date(document.lastModified).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}`,`<p class="xs mut" style="margin:0 0 10px">If something looks old, load the latest version.</p><button class="btn sm" data-a="stReload">Load latest version</button> <a class="btn sm sec" href="https://github.com/jdaclogistics-web/JDACTracker/releases/download/apk-latest/JDAC-Tracker.apk" target="_blank" rel="noopener">Download phone app</a>`);
 return o+`<div class="stmore">${acct}${startS}${menuS}${voiceS}${commS}${bdS}${incS}${appS}</div>`};
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

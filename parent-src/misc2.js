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

/* ===================== VOICE (Caps Lock dictation) · JDAC NOTETAKER auto-on for Google Meet · DEMO TOUR ===================== */
I.mic='<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5M8 22h8"/>';
const VDEF={lang:'en-IN',mode:'toggle',punct:true,sound:true,notes:true,idle:true};
const vCfg=()=>{try{return Object.assign({},VDEF,JSON.parse(localStorage.getItem('jdac-voice')||'{}'))}catch(e){return Object.assign({},VDEF)}};
const isBossLive=()=>{const r=(typeof LV!=='undefined'&&LV.me&&LV.me.role)||'';return ['boss','developer'].includes(r)||(!r&&typeof K==='function'&&K()==='boss')};
const vPush=()=>{try{const c=vCfg();c.boss=isBossLive();window.postMessage({type:'jdac-cfg',cfg:c},location.origin)}catch(e){}};

/* ---- Voice core: same code runs in the tracker and (via the extension) on every website ---- */
function JDACVoice(getCfg,isOff){
 if(window.__jdacVoice)return;window.__jdacVoice=1;const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)return;
 let rec=null,on=false,target=null,interim='',hideT=0;const pill=document.createElement('div');pill.id='jdac-vpill';
 pill.style.cssText='position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:2147483647;display:none;align-items:center;gap:8px;background:#111827;color:#fff;border-radius:999px;padding:8px 14px;font:500 13px/1.3 system-ui,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.3);max-width:70vw;cursor:pointer;transition:all .15s';
 pill.innerHTML='<span id="jdac-vdot" style="width:10px;height:10px;border-radius:50%;background:#9CA3AF;flex:none"></span><span id="jdac-vtx" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Caps Lock to talk</span>';
 const mount=()=>{if(!document.body)return setTimeout(mount,300);document.body.appendChild(pill);idle()};mount();
 const dot=()=>pill.querySelector('#jdac-vdot'),tx=()=>pill.querySelector('#jdac-vtx');
 function idle(){const c=getCfg();if(on)return;if(c.idle){pill.style.display='flex';pill.style.opacity='.55';pill.style.padding='5px 10px';dot().style.background='#9CA3AF';tx().textContent='🎙 Caps Lock';}else pill.style.display='none'}
 function beep(f){try{if(!getCfg().sound)return;const a=new (window.AudioContext||window.webkitAudioContext)(),o=a.createOscillator(),g=a.createGain();o.frequency.value=f;g.gain.value=.05;o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+.08)}catch(e){}}
 function clean(t,c){t=t.trim();if(!t)return'';if(c.punct){t=t.replace(/\s*\b(comma)\b/gi,',').replace(/\s*\b(full stop|period)\b/gi,'.').replace(/\s*\bquestion mark\b/gi,'?').replace(/\s*\bexclamation mark\b/gi,'!').replace(/\s*\bnew line\b\s*/gi,'\n');t=t.charAt(0).toUpperCase()+t.slice(1)}return t+' '}
 function put(text){if(!text)return;const el=target&&document.contains(target)?target:document.activeElement;
  const ok=el&&(el.isContentEditable||/^(TEXTAREA)$/.test(el.tagName)||(el.tagName==='INPUT'&&/^(text|search|email|url|tel|)$/.test(el.type||'')));
  if(ok){el.focus();let done=false;try{done=document.execCommand('insertText',false,text)}catch(e){}if(!done&&'value' in el){const s=el.selectionStart??el.value.length;el.value=el.value.slice(0,s)+text+el.value.slice(el.selectionEnd??s);el.selectionStart=el.selectionEnd=s+text.length;el.dispatchEvent(new Event('input',{bubbles:true}))}}
  else{try{navigator.clipboard.writeText(text.trim())}catch(e){}tx().textContent='Copied · press Ctrl+V to paste';clearTimeout(hideT);hideT=setTimeout(idle,2500)}}
 function start(){if(on||isOff())return;const c=getCfg();target=document.activeElement;on=true;interim='';rec=new SR();rec.lang=c.lang||'en-IN';rec.continuous=true;rec.interimResults=true;
  rec.onresult=ev=>{let fin='';interim='';for(let i=ev.resultIndex;i<ev.results.length;i++){const r=ev.results[i];if(r.isFinal)fin+=r[0].transcript;else interim+=r[0].transcript}if(fin)put(clean(fin,getCfg()));tx().textContent=interim||'Listening…'};
  rec.onerror=e=>{if(e.error==='not-allowed'){tx().textContent='Allow the microphone for this site';on=false;setTimeout(idle,3000)}};
  rec.onend=()=>{if(on)try{rec.start()}catch(e){}};try{rec.start()}catch(e){}
  pill.style.display='flex';pill.style.opacity='1';pill.style.padding='8px 14px';dot().style.background='#EF4444';tx().textContent='Listening… Caps Lock to stop';beep(880)}
 function stop(){if(!on)return;on=false;try{rec.stop()}catch(e){}beep(520);tx().textContent='Done';setTimeout(idle,700)}
 pill.addEventListener('mousedown',e=>e.preventDefault());pill.addEventListener('click',()=>on?stop():start());
 addEventListener('keydown',e=>{if(e.key!=='CapsLock'||e.repeat||isOff())return;const c=getCfg();if(c.mode==='hold')start();else on?stop():start()},true);
 addEventListener('keyup',e=>{if(e.key!=='CapsLock'||isOff())return;if(getCfg().mode==='hold')stop()},true);
 window.__jdacVoiceIdle=idle}

/* ---- Extension: Google Meet notetaker (runs on meet.google.com, only after Darshan / Boss logs in to the tracker) ---- */
function JDACMeet(){
 const st=chrome.storage.local;let cfg={},ses=null,rec=null,badge=null,lastCap='',pend='',pendN=0;
 const code=()=>(location.pathname.match(/^\/([a-z]{3}-[a-z]{4}-[a-z]{3})/)||[])[1];
 const inCall=()=>!!document.querySelector('[aria-label*="Leave call" i],[aria-label*="leave call" i],[data-tooltip*="Leave call" i]');
 const clock=()=>{const s=Math.floor((Date.now()-ses.st)/1000);return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};
 const save=()=>{if(!ses)return;st.get('sessions',o=>{const S=o.sessions||{};S[ses.key]=ses;st.set({sessions:S})})};
 const add=(t,who)=>{t=String(t||'').trim();if(!t||!ses)return;const L=ses.tr[ses.tr.length-1];if(L&&L.t===t)return;ses.tr.push({t:(who?who+': ':'')+t,at:clock()});save()};
 function showBadge(){if(badge)return;badge=document.createElement('div');badge.style.cssText='position:fixed;top:10px;left:50%;transform:translateX(-50%);z-index:2147483647;background:#1E3A8A;color:#fff;border-radius:999px;padding:6px 14px;font:600 12px system-ui,sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.3)';badge.innerHTML='● JDAC Notetaker is on <button style="margin-left:8px;background:#fff;color:#1E3A8A;border:0;border-radius:999px;padding:2px 10px;font:600 11px system-ui;cursor:pointer">Stop</button>';badge.querySelector('button').onclick=()=>{end();cfg.paused=code()};document.body.appendChild(badge)}
 function mic(){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR||rec)return;rec=new SR();rec.lang=cfg.lang||'en-IN';rec.continuous=true;rec.interimResults=false;rec.onresult=e=>{if(capRegion())return;for(let i=e.resultIndex;i<e.results.length;i++)if(e.results[i].isFinal)add(e.results[i][0].transcript,'')};rec.onend=()=>{if(ses&&rec)try{rec.start()}catch(x){}};try{rec.start()}catch(x){}}
 const capRegion=()=>document.querySelector('[role="region"][aria-label*="aption" i]');
 function caps(){const r=capRegion();if(!r)return;const t=r.innerText.trim();if(!t)return;const last=t.split('\n').filter(Boolean).slice(-2).join(': ');if(last===lastCap){if(pend&&++pendN>=2){add(pend,'');pend='';pendN=0}return}if(pend&&!last.startsWith(pend.slice(0,20)))add(pend,'');pend=last;pendN=0;lastCap=last}
 function begin(){const c=code();ses={key:c+'@'+Date.now(),code:c,title:(document.title||'').replace(/^Meet\s*[-–]\s*/,'')||c,st:Date.now(),end:null,tr:[]};save();showBadge();mic()}
 function end(){if(!ses)return;if(pend)add(pend,'');ses.end=Date.now();save();ses=null;try{rec&&rec.stop()}catch(x){}rec=null;if(badge){badge.remove();badge=null}}
 setInterval(()=>{st.get('cfg',o=>{cfg=o.cfg||{};const ok=cfg.boss&&cfg.notes!==false&&cfg.paused!==code();if(ok&&code()&&inCall()&&!ses)begin();else if(ses&&(!inCall()||!ok))end();if(ses)caps()})},1500);
 addEventListener('beforeunload',end)}

/* ---- Extension: bridge on the tracker page (settings in, meeting notes out) ---- */
function JDACBridge(){
 document.documentElement.dataset.jdacExt='1';const st=chrome.storage.local;
 const send=()=>st.get('sessions',o=>window.postMessage({type:'jdac-sessions',sessions:o.sessions||{}},location.origin));
 addEventListener('message',e=>{if(e.source!==window||!e.data)return;if(e.data.type==='jdac-cfg')st.set({cfg:e.data.cfg});if(e.data.type==='jdac-ack')st.get('sessions',o=>{const S=o.sessions||{};(e.data.keys||[]).forEach(k=>{if(S[k]&&S[k].end)delete S[k]});st.set({sessions:S})});if(e.data.type==='jdac-pull')send()});
 chrome.storage.onChanged.addListener(c=>{if(c.sessions)send()});setTimeout(send,1500)}

/* ---- Extension zip (built in the browser) ---- */
function extZip(){const enc=new TextEncoder(),T=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;T[n]=c>>>0}
 const crc=b=>{let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=T[(c^b[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0};
 const man={manifest_version:3,name:'JDAC Notetaker & Voice',version:'1.0.0',description:'JDAC Tracker: Caps Lock voice typing on every site and automatic Google Meet notes for Darshan.',permissions:['storage'],host_permissions:['https://meet.google.com/*','https://jdaclogistics-web.github.io/*'],
  content_scripts:[{matches:['<all_urls>'],exclude_matches:['https://jdaclogistics-web.github.io/*'],js:['voice.js'],run_at:'document_idle'},{matches:['https://meet.google.com/*'],js:['meet.js'],run_at:'document_idle'},{matches:['https://jdaclogistics-web.github.io/*'],js:['bridge.js'],run_at:'document_start'}]};
 const voice=`let C={lang:'en-IN',mode:'toggle',punct:true,sound:true,idle:true};chrome.storage.local.get('cfg',o=>{Object.assign(C,o.cfg||{});window.__jdacVoiceIdle&&window.__jdacVoiceIdle()});chrome.storage.onChanged.addListener(c=>{if(c.cfg){Object.assign(C,c.cfg.newValue||{});window.__jdacVoiceIdle&&window.__jdacVoiceIdle()}});\n(${JDACVoice.toString()})(()=>C,()=>C.voice===false);`;
 const files=[['manifest.json',JSON.stringify(man,null,2)],['voice.js',voice],['meet.js',`(${JDACMeet.toString()})();`],['bridge.js',`(${JDACBridge.toString()})();`],['README.txt','JDAC Notetaker & Voice\n\n1. Unzip this folder.\n2. Chrome → chrome://extensions → turn on Developer mode (top right).\n3. Load unpacked → pick the unzipped folder.\n4. Open the JDAC Tracker once and log in as Darshan, so the notetaker turns on.\n\nCaps Lock = start / stop voice typing on any website.\nJoin a Google Meet = JDAC Notetaker starts by itself. Turn on Meet captions (CC) so every speaker is written down.\n']];
 const parts=[],cd=[];let off=0;files.forEach(([name,str])=>{const nb=enc.encode('jdac-notetaker/'+name),db=enc.encode(str),cr=crc(db),lh=new DataView(new ArrayBuffer(30));lh.setUint32(0,0x04034b50,true);lh.setUint16(4,20,true);lh.setUint16(6,0x0800,true);lh.setUint32(14,cr,true);lh.setUint32(18,db.length,true);lh.setUint32(22,db.length,true);lh.setUint16(26,nb.length,true);parts.push(new Uint8Array(lh.buffer),nb,db);
  const ch=new DataView(new ArrayBuffer(46));ch.setUint32(0,0x02014b50,true);ch.setUint16(4,20,true);ch.setUint16(6,20,true);ch.setUint16(8,0x0800,true);ch.setUint32(16,cr,true);ch.setUint32(20,db.length,true);ch.setUint32(24,db.length,true);ch.setUint16(28,nb.length,true);ch.setUint32(42,off,true);cd.push(new Uint8Array(ch.buffer),nb);off+=30+nb.length+db.length});
 const cdl=cd.reduce((a,b)=>a+b.length,0),e=new DataView(new ArrayBuffer(22));e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,cdl,true);e.setUint32(16,off,true);return new Blob([...parts,...cd,new Uint8Array(e.buffer)],{type:'application/zip'})}
A.extDl=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(extZip());a.download='jdac-notetaker.zip';document.body.appendChild(a);a.click();a.remove();toast('Downloaded · follow the 4 steps to install')};

/* ---- Tracker: voice pill (when the extension is not installed) + receive Meet notes ---- */
const extOn=()=>!!(document.documentElement&&document.documentElement.dataset&&document.documentElement.dataset.jdacExt==='1');
try{JDACVoice(vCfg,()=>extOn()||vCfg().voice===false)}catch(e){}
addEventListener('message',e=>{if(e.source!==window||!e.data||e.data.type!=='jdac-sessions'||!isBossLive())return;const SS=e.data.sessions||{},ack=[];let ch=false,started=null;D.meet=D.meet||[];
 Object.values(SS).forEach(s=>{let m=D.meet.find(x=>x.ext===s.key);if(!m){m={id:nid('M'),ext:s.key,t:'Google Meet · '+(s.title||s.code),dt:new Date(s.st).toISOString().slice(0,10),when:'Notes',time:nowT(),with:[S.me],notes:'',acts:[],link:'https://meet.google.com/'+s.code,log:[],tr:[],st:s.st,end:null};D.meet.push(m);ch=true;if(!s.end)started=m}
  if((s.tr||[]).length!==(m.tr||[]).length){m.tr=s.tr.slice();ch=true}
  if(s.end&&!m.end){m.end=s.end;m.dur=Math.max(1,Math.round((s.end-s.st)/60000));m.log=m.log||[];if(!m.log.length&&m.tr.length)m.log.push({k:'note',t:'Transcript saved automatically by JDAC Notetaker ('+m.tr.length+' lines)',at:'00:00'});ch=true}
  if(s.end)ack.push(s.key)});
 if(ch){save();if(started){S.gmN=started.id;toast('JDAC Notetaker started for your Google Meet')}render()}if(ack.length)window.postMessage({type:'jdac-ack',keys:ack},location.origin)});
setTimeout(vPush,2500);

/* ---- Mic & Notetaker settings ---- */
const _tabsMic=tabsFor;tabsFor=function(who){const T=_tabsMic(who);if(!T.some(x=>x[0]==='mic'))T.splice(Math.max(0,T.length-1),0,['mic','Mic & Notetaker','mic']);return T};
V.mic=()=>{const c=vCfg(),boss=isBossLive(),sel=(id,v,o)=>`<select id="${id}" data-ch="vset" data-k="${id.slice(2)}">${o.map(([a,b])=>`<option value="${a}" ${String(v)===String(a)?'selected':''}>${b}</option>`).join('')}</select>`;
 const tg=(k,l,d)=>`<label class="vtg"><input type="checkbox" data-ch="vset" data-k="${k}" ${c[k]!==false?'checked':''}><span><b>${l}</b><small>${d}</small></span></label>`;
 return page('Mic & Notetaker','Voice typing with Caps Lock · JDAC Notetaker for Google Meet',`<button class="btn sec" data-a="tourGo">Take the tour</button>`)+
 `<div class="vgrid"><div class="card"><h3 style="margin-top:0">🎙 Voice typing (like Wispr Flow)</h3><p class="sm mut">Press <kbd>Caps Lock</kbd> anywhere, speak, press it again. Text is typed where your cursor is. No text box selected? It is copied so you can paste it. The pill sits at the bottom center.</p>
 <label for="v_lang">Language</label>${sel('v_lang',c.lang,[['en-IN','English (India)'],['hi-IN','Hindi'],['mr-IN','Marathi'],['gu-IN','Gujarati'],['en-US','English (US)']])}
 <label for="v_mode">Caps Lock works as</label>${sel('v_mode',c.mode,[['toggle','Press once to start, again to stop'],['hold','Hold to talk, release to stop']])}
 ${tg('voice','Voice typing on','Caps Lock starts the mic')}${tg('punct','Smart punctuation','Capital first letter; say “comma”, “full stop”, “question mark”, “new line”')}${tg('sound','Start / stop sound','Short beep')}${tg('idle','Show the small mic pill','Bottom center of the screen')}
 <label for="vtest">Try it here</label><textarea id="vtest" rows="3" placeholder="Click here, press Caps Lock and speak…"></textarea></div>
 <div class="card"><h3 style="margin-top:0">📝 JDAC Notetaker for Google Meet</h3>${boss?`<p class="sm mut">When Darshan is logged in here and joins a Google Meet in Chrome, the notetaker turns on by itself: every line is written with time, the meeting widget opens here, and the notes are saved under Communication → JDAC Notetaker.</p>${tg('notes','Start automatically in every Google Meet','You can stop it from the blue badge in Meet')}`:`<p class="sm mut">Automatic Meet notes are on for Darshan (Boss) only. You can still use voice typing.</p>`}
 <div class="mish" style="margin-top:12px">Chrome extension ${extOn()?pill('Installed ✓','g'):pill('Not installed','a')}</div><p class="sm mut">Needed for Meet notes and for Caps Lock voice typing on other websites (Gmail, WhatsApp Web, Meet chat…). Inside this tracker voice typing works without it.</p>
 <button class="btn w" data-a="extDl">${ic('dl')}Download JDAC Notetaker extension</button>
 <ol class="sm vsteps"><li>Unzip <b>jdac-notetaker.zip</b>.</li><li>Open <code>chrome://extensions</code> and turn on <b>Developer mode</b>.</li><li>Press <b>Load unpacked</b> and pick the <b>jdac-notetaker</b> folder.</li><li>Reload this tracker. In Meet, turn on captions (CC) so every speaker is written, not only your mic.</li></ol></div></div>`};
document.addEventListener('change',e=>{if(!(e.target.dataset&&e.target.dataset.ch==='vset'))return;const c=vCfg(),k=e.target.dataset.k;c[k]=e.target.type==='checkbox'?e.target.checked:e.target.value;localStorage.setItem('jdac-voice',JSON.stringify(c));vPush();window.__jdacVoiceIdle&&window.__jdacVoiceIdle();toast('Saved')});

/* ---- Demo tour: first login on a new device (Darshan / Boss), or "Take the tour" ---- */
const TOURD={home:'Your dashboard: today’s attendance, tasks due, alerts and money at a glance.',tasks:'Give and track tasks for every person, with due dates and checklists.',people:'HR Desk: staff list, attendance sheet, leaves, salary slips and hikes.',chat:'Communication: WhatsApp inbox, mail, calls, team chats, Google Meet and JDAC Notetaker.',money:'Accounts: income, expenses, invoices and pending payments.',leads:'Lead Centre: every lead from every company and campaign in one place, with Excel import and export.',camp:'Campaigns: Meta ads for JDAC Logistics, GovaaBazaar and HR Consultancy — today, yesterday, 7 and 30 days, with Marketing compare.',social:'Social Media: brand pages, post log and each brand’s Google Drive folders.',drive:'Google Drive: open the whole Drive here, with sub-folders, copy, cut, move and delete.',onboard:'Logins & Register: share the login and register links, approve new joinees, send each person their login on WhatsApp.',content:'Content calendar: plan and track posts and shoots.',mic:'Mic & Notetaker: Caps Lock voice typing and automatic Google Meet notes.',co:'Companies: each business with its own tabs — Logistics call audit, HR MIS billing and more.',kpi:'KPIs for each person and team.',settings:'Settings for the tracker.'};
let TOUR=null;
function tourSteps(){const T=tabsFor().filter(x=>x[0]!=='more');const st=[{v:T[0][0],t:'Welcome to JDAC Tracker 👋',d:'A 1-minute walk through the whole web app. Use Next, or press → on the keyboard.'}];T.forEach(x=>st.push({v:x[0],t:x[1],d:TOURD[x[0]]||('Open '+x[1]+' from the menu on the left.')}));st.push({v:'mic',t:'Voice + Meet notes',d:'Press Caps Lock anywhere to type with your voice. Install the JDAC Notetaker extension and your Google Meets are noted automatically.'});st.push({v:T[0][0],t:'You are all set ✓',d:'Restart this tour any time from Mic & Notetaker → Take the tour, or from your name at the bottom left.'});return st}
function tourShow(){document.querySelectorAll('.tourhi').forEach(x=>x.classList.remove('tourhi'));let b=document.getElementById('tourBox');if(!TOUR){if(b)b.remove();return}
 const s=TOUR.s[TOUR.i],n=TOUR.s.length;if(!b){b=document.createElement('div');b.id='tourBox';b.setAttribute('role','dialog');b.setAttribute('aria-label','Tour');document.body.appendChild(b)}
 b.innerHTML=`<div class="tourp">${TOUR.i+1} / ${n}</div><b>${h(s.t)}</b><p>${h(s.d)}</p><div class="tourb"><button class="lnk" data-a="tourX">Skip tour</button><span style="flex:1"></span>${TOUR.i?'<button class="btn sm sec" data-a="tourB">Back</button>':''}<button class="btn sm" data-a="tourN">${TOUR.i===n-1?'Finish':'Next'}</button></div><div class="tourbar"><i style="width:${Math.round((TOUR.i+1)/n*100)}%"></i></div>`;
 const el=document.querySelector(`.sb-nav [data-a="go"][data-v="${s.v}"]`);if(el){el.classList.add('tourhi');el.scrollIntoView({block:'nearest'})}}
function tourAt(i){TOUR.i=i;const s=TOUR.s[i];if(s.v&&S.v!==s.v){S.v=s.v;if(!document.querySelector(`.sb-nav [data-a="go"][data-v="${s.v}"]`))S.sbm=true;render()}else tourShow()}
A.tourGo=()=>{closeM();TOUR={s:tourSteps(),i:0};tourAt(0)};A.tourN=()=>{if(TOUR.i>=TOUR.s.length-1)return A.tourX();tourAt(TOUR.i+1)};A.tourB=()=>tourAt(Math.max(0,TOUR.i-1));
addEventListener('keydown',e=>{if(!TOUR||/INPUT|TEXTAREA|SELECT/.test((e.target||{}).tagName||''))return;if(e.key==='ArrowRight')A.tourN();if(e.key==='ArrowLeft')A.tourB();if(e.key==='Escape')A.tourX()});
/* New-laptop detection: screen size + pixel ratio + platform. A laptop/desktop (wide screen) that has not seen the demo gets it, even if someone logged in there before. */
const devKey=()=>{try{const sc=window.screen||{};return [sc.width,sc.height,window.devicePixelRatio||1,(navigator.userAgentData&&navigator.userAgentData.platform)||navigator.platform||''].join('x')}catch(e){return 'x'}};
const isLaptop=()=>{try{return (window.screen?Math.max(screen.width,screen.height):1400)>=1024&&!/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent||'')}catch(e){return false}};
const tourSeen=u=>{try{return (JSON.parse(localStorage.getItem('jdac-tour-devs')||'{}')[u]||[]).includes(devKey())}catch(e){return false}};
const tourMark=u=>{try{const o=JSON.parse(localStorage.getItem('jdac-tour-devs')||'{}');o[u]=[...new Set([...(o[u]||[]),devKey()])];localStorage.setItem('jdac-tour-devs',JSON.stringify(o))}catch(e){}};
A.tourX=()=>{const u=(typeof LV!=='undefined'&&LV.me&&LV.me.username)||S.me;tourMark(u);const last=TOUR&&TOUR.i>=TOUR.s.length-1;TOUR=null;tourShow();if(isLaptop()&&isBossLive()&&!extOn()&&!sessionStorage.getItem('jdac-ext-ask'))setTimeout(A.extAsk,last?300:600)};
A.extAsk=()=>{sessionStorage.setItem('jdac-ext-ask','1');sheet(`<h2>📝 Install JDAC Notetaker on this laptop</h2><p class="sm">New laptop detected. Add the Chrome extension so your Google Meets are noted automatically and Caps Lock voice typing works on every website.</p><button class="btn w" data-a="extDl">${ic('dl')}Download JDAC Notetaker</button><ol class="sm vsteps"><li>Unzip <b>jdac-notetaker.zip</b>.</li><li>Open <code>chrome://extensions</code> → turn on <b>Developer mode</b>.</li><li><b>Load unpacked</b> → pick the <b>jdac-notetaker</b> folder.</li><li>Reload the tracker.</li></ol><button class="btn sec w" style="margin-top:8px" data-a="closeM">Later</button>`)};
const _rTour=render;render=function(){_rTour.apply(this,arguments);if(TOUR)tourShow();
 if(!TOUR&&typeof LV!=='undefined'&&LV.ok&&LV.me&&['boss','developer'].includes(LV.me.role)&&isLaptop()&&!tourSeen(LV.me.username)&&!window.__tourAuto){window.__tourAuto=1;setTimeout(()=>{A.tourGo();vPush()},800)}
 else if(!TOUR&&typeof LV!=='undefined'&&LV.ok&&isBossLive()&&isLaptop()&&!window.__extAuto&&tourSeen(LV.me.username)){window.__extAuto=1;setTimeout(()=>{if(!extOn()&&!sessionStorage.getItem('jdac-ext-ask')&&!document.querySelector('.sheet'))A.extAsk()},4000)}};
const _whoTour=A.whoSheet;A.whoSheet=()=>{_whoTour();const s=document.querySelector('.sheet');if(s)s.insertAdjacentHTML('beforeend','<button class="btn sec w" style="margin-top:8px" data-a="tourGo">Take the tour of the whole app</button>')};
render();

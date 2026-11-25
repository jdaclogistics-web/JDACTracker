/* ===================== Floating meeting widget (works on every page) + pop-out window over Google Meet ===================== */
let PIPW=null;
const gmActive=()=>(D.meet||[]).find(m=>m.st&&!m.end);
function gmStartSession(m){m.st=m.st||Date.now();m.end=null;m.log=m.log||[];m.tr=m.tr||[];S.gmN=m.id;S.mwMin=false;save();gmTick()}
function mwHTML(m,pip){const c=meetCode(m.link),L=m.log||[],ty=S.gmTy||'note';
 return `<div class="mwh" ${pip?'':'data-drag="mw"'}><span class="mwdot"></span><b title="${h(m.t)}">${h(m.t)}</b><span class="mwclk">${gmClock(m)}</span>${pip?'':`<button data-a="mwMin" title="${S.mwMin?'Expand':'Minimise'}">${S.mwMin?'▢':'–'}</button>`}</div>
 ${S.mwMin&&!pip?'':`<div class="mwb"><div class="mwbtn">${c?`<a href="${meetUrl(c)}" target="_blank" rel="noopener" class="mwa">${ic('video')}Meet</a>`:`<a href="https://meet.google.com/new" target="_blank" rel="noopener" class="mwa">${ic('video')}New Meet</a>`}<button data-a="gmMic" class="${GMREC?'on':''}">${ic('mic')}${GMREC?'Listening':'Transcript'}</button>${pip?'':`<button data-a="mwPop" title="Keep this widget on top of Google Meet">⧉ Pop out</button>`}</div>
 <div class="mwty">${[['note','Note'],['dec','Decision'],['act','Action']].map(([k,l])=>`<button class="${ty===k?'on':''}" data-a="mwTy" data-t="${k}">${l}</button>`).join('')}</div>
 <div class="mwin"><input id="mwTx" placeholder="${ty==='act'?'Action point…':ty==='dec'?'Decision…':'Quick note…'}">${ty==='act'?`<select id="mwO">${STAFF.filter(k=>P[k]).map(k=>`<option value="${k}">${h(nmF(k).split(' ')[0])}</option>`).join('')}</select>`:''}<button data-a="mwAdd">Add</button></div>
 <div class="mwlast">${L.slice(-3).reverse().map(x=>`<div><i>${x.at}</i>${x.k==='act'?'⚑ ':x.k==='dec'?'✔ ':''}${h(x.t)}</div>`).join('')||'<div class="mwm">No points yet</div>'}${GMREC&&(m.tr||[]).length?`<div class="mwm">“${h(m.tr[m.tr.length-1].t.slice(0,90))}”</div>`:''}</div>
 <div class="mwft"><button data-a="mwOpen">Open notes</button><button data-a="mwEnd" class="mwend">End &amp; save</button></div></div>`}`}
function mwPaint(){const m=gmActive(),inNotes=S.v==='chat'&&S.chm==='notes'&&S.gmN===(m&&m.id);let w=document.getElementById('mw');
 if(!m||PANE){if(w)w.remove();if(PIPW&&!m){try{PIPW.close()}catch(x){}PIPW=null}return}
 if(PIPW){mwPipPaint();if(w)w.remove();return}
 if(inNotes){if(w)w.remove();return}
 if(!w){w=document.createElement('div');w.id='mw';w.className='mw';document.body.appendChild(w);const pos=S.mwPos;if(pos){w.style.left=pos[0]+'px';w.style.top=pos[1]+'px';w.style.right='auto';w.style.bottom='auto'}}
 w.classList.toggle('min',!!S.mwMin);w.innerHTML=mwHTML(m,false)}
const _rMW=render;render=function(){_rMW.apply(this,arguments);try{mwPaint()}catch(x){}};
setInterval(()=>{const m=gmActive();if(!m)return;const t=gmClock(m);document.querySelectorAll('#mw .mwclk').forEach(e=>e.textContent=t);if(PIPW)try{PIPW.document.querySelectorAll('.mwclk').forEach(e=>e.textContent=t)}catch(x){}},1000);
/* drag the widget by its header */
document.addEventListener('pointerdown',e=>{const hd=e.target.closest&&e.target.closest('[data-drag="mw"]');if(!hd||e.target.closest('button'))return;const w=document.getElementById('mw'),r=w.getBoundingClientRect(),dx=e.clientX-r.left,dy=e.clientY-r.top;e.preventDefault();
 const mv=ev=>{const x=Math.max(4,Math.min(innerWidth-r.width-4,ev.clientX-dx)),y=Math.max(4,Math.min(innerHeight-40,ev.clientY-dy));w.style.left=x+'px';w.style.top=y+'px';w.style.right='auto';w.style.bottom='auto';S.mwPos=[x,y]};
 const up=()=>{removeEventListener('pointermove',mv);removeEventListener('pointerup',up);saveS()};addEventListener('pointermove',mv);addEventListener('pointerup',up)});
A.mwMin=()=>{S.mwMin=!S.mwMin;saveS();mwPaint()};
A.mwTy=e=>{S.gmTy=e.dataset.t;mwPaint();mwPipPaint();const d=PIPW?PIPW.document:document,i=d.getElementById('mwTx');if(i)i.focus()};
A.mwAdd=e=>{const m=gmActive();if(!m)return;const d=(e&&e.ownerDocument)||document,t=(d.getElementById('mwTx')||{}).value||'';if(!t.trim())return;const k=S.gmTy||'note',x={k,t:t.trim(),at:gmClock(m)};if(k==='act'){x.o=(d.getElementById('mwO')||{}).value||S.me;x.due=addD(TODAY,1)}m.log.push(x);save();S.gmN=m.id;render();mwPipPaint();const i=d.getElementById('mwTx');if(i)i.focus()};
A.mwOpen=()=>{const m=gmActive();if(!m)return;S.v='chat';S.chm='notes';S.gmN=m.id;render();scrollTo(0,0);try{window.focus()}catch(x){}};
A.mwEnd=()=>{const m=gmActive();if(!m)return;S.gmN=m.id;A.gmEnd();S.v='chat';S.chm='notes';render();if(PIPW){try{PIPW.close()}catch(x){}PIPW=null}};
/* make sure mic + add work from the widget even when another page is open */
const _gmMicMW=A.gmMic;A.gmMic=()=>{const m=gmActive();if(m)S.gmN=m.id;_gmMicMW();setTimeout(()=>{mwPaint();mwPipPaint()},50)};
/* start a meeting session when a meeting is opened */
const _gmJoinMW=A.gmJoin;A.gmJoin=()=>{const c=meetCode(val('gmj'));if(!c)return toast('Enter a code like abc-defg-hij');let m=(D.meet||[]).find(x=>meetCode(x.link)===c);if(!m){m={id:nid('M'),t:'Meeting '+nowT(),dt:TODAY,when:'Notes',time:nowT(),with:[S.me],notes:'',acts:[],link:meetUrl(c),log:[],tr:[]};D.meet.push(m)}gmStartSession(m);window.open(meetUrl(c),'_blank','noopener');render()};
A.gmNew=()=>{const m={id:nid('M'),t:'Meeting '+nowT(),dt:TODAY,when:'Notes',time:nowT(),with:[S.me],notes:'',acts:[],link:'',log:[],tr:[]};D.meet.push(m);gmStartSession(m);setTimeout(render,50);toast('Meeting started · widget is on screen, paste the Meet link in Open notes')};
document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('a.btn[href*="meet.google.com/"]');if(!a||a.dataset.a==='gmNew')return;const c=meetCode(a.getAttribute('href'));if(!c)return;const m=(D.meet||[]).find(x=>meetCode(x.link)===c);if(m&&!gmActive()){gmStartSession(m);setTimeout(render,50)}},true);
/* pop-out: Document Picture-in-Picture keeps the widget on top of other windows (Chrome 116+) */
A.mwPop=async()=>{if(!('documentPictureInPicture' in window))return toast('Pop-out needs Chrome 116 or newer — the widget stays on this page');
 try{PIPW=await documentPictureInPicture.requestWindow({width:340,height:430});
  [...document.querySelectorAll('style,link[rel=stylesheet]')].forEach(s=>PIPW.document.head.appendChild(s.cloneNode(true)));
  PIPW.document.body.className='mwpip';PIPW.document.title='JDAC meeting';
  PIPW.document.addEventListener('click',ev=>{const t=ev.target.closest('[data-a]');if(!t)return;const f=A[t.dataset.a];if(!f||t.tagName==='A')return;ev.preventDefault();f(t)});
  PIPW.document.addEventListener('keydown',ev=>{if(ev.key==='Enter'&&ev.target.id==='mwTx'){ev.preventDefault();A.mwAdd(ev.target)}});
  PIPW.addEventListener('pagehide',()=>{PIPW=null;mwPaint()});mwPipPaint();mwPaint()}catch(x){PIPW=null;toast('Could not pop out: '+x.message)}};
function mwPipPaint(){if(!PIPW)return;const m=gmActive();if(!m){try{PIPW.close()}catch(x){}PIPW=null;return}const keep=(PIPW.document.getElementById('mwTx')||{}).value;PIPW.document.body.innerHTML=`<div class="mw pip">${mwHTML(m,true)}</div>`;const i=PIPW.document.getElementById('mwTx');if(i&&keep)i.value=keep}
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='mwTx'){e.preventDefault();A.mwAdd(e.target)}});

/* ===================== Split view: drag to resize ===================== */
const spW=()=>Math.max(320,Math.min(innerWidth-420,S.spW||Math.min(innerWidth*0.48,760)));
const _rSpW=render;render=function(){_rSpW.apply(this,arguments);if(PANE)return;try{document.documentElement.style.setProperty('--spw',spW()+'px');const pn=document.getElementById('spPane');if(pn&&!pn.querySelector('.spdrag')){const d=document.createElement('div');d.className='spdrag';d.title='Drag to resize';pn.appendChild(d)}}catch(x){}};
document.addEventListener('pointerdown',e=>{if(!e.target.classList||!e.target.classList.contains('spdrag'))return;e.preventDefault();const fr=document.getElementById('spFrame');if(fr)fr.style.pointerEvents='none';document.body.classList.add('spdragging');
 const mv=ev=>{S.spW=Math.max(320,Math.min(innerWidth-420,innerWidth-ev.clientX));document.documentElement.style.setProperty('--spw',S.spW+'px')};
 const up=()=>{removeEventListener('pointermove',mv);removeEventListener('pointerup',up);if(fr)fr.style.pointerEvents='';document.body.classList.remove('spdragging');saveS()};addEventListener('pointermove',mv);addEventListener('pointerup',up)});
addEventListener('resize',()=>{if(S.split)document.documentElement.style.setProperty('--spw',spW()+'px')});

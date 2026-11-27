/* ===== Team chat attachments, WhatsApp style: the file itself is kept (IndexedDB on this device),
   tap opens a full-screen viewer with Forward · Save · Share · Delete; long-press menu gets the same ===== */
const FDB={db:null,open(){return this.db||(this.db=new Promise((ok,no)=>{try{const r=indexedDB.open('jdac_files',1);r.onupgradeneeded=()=>r.result.createObjectStore('f');r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)}catch(e){no(e)}}))},
 async put(k,v){const d=await this.open();return new Promise((ok,no)=>{const t=d.transaction('f','readwrite');t.objectStore('f').put(v,k);t.oncomplete=ok;t.onerror=()=>no(t.error)})},
 async get(k){const d=await this.open();return new Promise(ok=>{const q=d.transaction('f').objectStore('f').get(k);q.onsuccess=()=>ok(q.result||null);q.onerror=()=>ok(null)})}};
const fKB=n=>!n?'':n<1024?n+' B':n<1048576?Math.round(n/1024)+' KB':(n/1048576).toFixed(1)+' MB';
const fExt=n=>(String(n||'').match(/\.([a-z0-9]{1,5})$/i)||[0,'file'])[1].toUpperCase();
const fCol=x=>({PDF:'#D93025',XLS:'#1E8E3E',XLSX:'#1E8E3E',CSV:'#1E8E3E',DOC:'#1A73E8',DOCX:'#1A73E8',PPT:'#E37400',PPTX:'#E37400',ZIP:'#5F6368'})[x]||'#5F6368';
const fKey=m=>m.fk||m.id;

/* sending: keep the real file (capture phase, so the old name-only handler never runs for team chat) */
document.addEventListener('change',e=>{const t=e.target;if(!t||!t.dataset||t.dataset.ch!=='chatFile'||t.dataset.kind==='wa')return;e.stopImmediatePropagation();
 const f=t.files&&t.files[0];if(!f)return;if(f.size>25*1048576){toast('File is over 25 MB');return}
 const id=nid('m'),img=/^image\//.test(f.type);
 const push=src=>{D.msgs.push({id,g:S.chat,f:S.me,kind:img?'img':'file',src:src||undefined,name:f.name,size:f.size,type:f.type,fk:id,at:nowT(),d:TODAY});try{save()}catch(x){}render();const th=document.getElementById('thr');if(th)th.scrollTop=1e6};
 FDB.put(id,f).catch(()=>toast('Could not keep the file on this device')).then(()=>{img?makeThumb(f,push):push(null)});t.value=''},true);

/* the document bubble, like WhatsApp */
const _bubF=bubble;bubble=function(m,G){const o=_bubF(m,G);if(m.kind!=='file'&&m.kind!=='img')return o;
 if(m.kind==='img')return o.replace(/<img src="([^"]*)" alt="" class="bimg">/,`<button class="fimg" data-a="fOpen" data-id="${m.id}" aria-label="Open photo"><img src="$1" alt="" class="bimg"></button>`);
 const x=fExt(m.name);return o.replace(/<div class="bfile">[\s\S]*?<\/div>/,`<button class="fdoc" data-a="fOpen" data-id="${m.id}"><span class="fic" style="--c:${fCol(x)}">${h(x.slice(0,4))}</span><span class="fnm"><b>${h(m.name||'File')}</b><small>${[x,fKB(m.size)].filter(Boolean).join(' · ')}</small></span>${ic('down')}</button>`)};

/* full-screen viewer */
let FURL=null;
A.fOpen=async e=>{const m=D.msgs.find(x=>x.id===e.dataset.id);if(!m)return;const blob=await FDB.get(fKey(m)).catch(()=>null);
 if(FURL){URL.revokeObjectURL(FURL);FURL=null}const src=blob?(FURL=URL.createObjectURL(blob)):(m.kind==='img'?m.src:null),x=fExt(m.name),pdf=x==='PDF',phone=isMob();
 const body=!src?`<div class="fvno">${ic('doc')}<b>This file is not on this device</b><span>It was sent before files were saved, or from another phone. Ask ${h(nmF(m.f).split(' ')[0])} to send it again.</span></div>`
  :m.kind==='img'?`<img src="${src}" alt="${h(m.name||'Photo')}" class="fvimg">`
  :pdf&&!phone?`<iframe src="${src}" title="${h(m.name)}" class="fvpdf"></iframe>`
  :`<div class="fvcard"><span class="fic big" style="--c:${fCol(x)}">${h(x.slice(0,4))}</span><b>${h(m.name)}</b><small>${[x,fKB(m.size)].filter(Boolean).join(' · ')}</small><button class="btn" data-a="fOpenExt" data-id="${m.id}">${ic('doc')}Open ${pdf?'PDF':'file'}</button></div>`;
 closeM();const o=document.createElement('div');o.className='fv';o.id='fv';o.innerHTML=`<div class="fvh"><button class="ib" data-a="fClose" aria-label="Back">‹</button><div class="fvt"><b>${h(m.name||'Photo')}</b><small>${h(nmF(m.f))} · ${fmt(m.d||TODAY)} ${h(m.at||'')}</small></div></div><div class="fvb">${body}</div>
  <div class="fvf"><button data-a="fFwd" data-id="${m.id}">${ic('send')}<span>Forward</span></button><button data-a="fSave" data-id="${m.id}" ${src?'':'disabled'}>${ic('down')}<span>Save</span></button><button data-a="fShare" data-id="${m.id}" ${src?'':'disabled'}>${sfi('copy',20)}<span>Share</span></button>${m.f===S.me||isAdm()?`<button data-a="fDel" data-id="${m.id}">${ic('trash')}<span>Delete</span></button>`:''}</div>`;document.body.appendChild(o)};
A.fClose=()=>{const v=document.getElementById('fv');if(v)v.remove();if(FURL){URL.revokeObjectURL(FURL);FURL=null}};
const fBlob=async m=>(await FDB.get(fKey(m)).catch(()=>null))||(m.src?await (await fetch(m.src)).blob():null);
A.fOpenExt=async e=>{const m=D.msgs.find(x=>x.id===e.dataset.id),b=m&&await fBlob(m);if(!b)return toast('File not on this device');const u=URL.createObjectURL(b);const w=window.open(u,'_blank');if(!w){const a=document.createElement('a');a.href=u;a.download=m.name||'file';a.click()}setTimeout(()=>URL.revokeObjectURL(u),60000)};
A.fSave=async e=>{const m=D.msgs.find(x=>x.id===e.dataset.id),b=m&&await fBlob(m);if(!b)return toast('File not on this device');const u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=m.name||'photo.jpg';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),30000);toast('Saved to Downloads')};
A.fShare=async e=>{const m=D.msgs.find(x=>x.id===e.dataset.id),b=m&&await fBlob(m);if(!b)return toast('File not on this device');const f=new File([b],m.name||'photo.jpg',{type:b.type||m.type||''});
 if(navigator.canShare&&navigator.canShare({files:[f]})){try{await navigator.share({files:[f],title:m.name})}catch(x){}}else{toast('Sharing not supported here — saving instead');A.fSave(e)}};
A.fFwd=e=>{const m=D.msgs.find(x=>x.id===e.dataset.id);if(!m)return;S.fwdSel=[];const G=myGroups().filter(g=>g.id!==m.g);A.fClose();
 sheet(`<h2>Forward to…</h2><p class="mut sm">${h(m.kind==='file'||m.kind==='img'?(m.name||'Photo'):String(m.t||'').slice(0,80))}</p><div class="list fwdl">${G.map(g=>`<button class="li" data-a="fFwdT" data-g="${g.id}"><span class="sfav">${h(sfIni(g.n))}</span><div class="tx"><b>${h(g.n)}</b><div class="m">${(g.m||[]).length} members</div></div><span class="fck"></span></button>`).join('')}</div><button class="btn w" style="margin-top:12px" data-a="fFwdGo" data-id="${m.id}">Send</button>`)};
A.fFwdT=e=>{const g=e.dataset.g,L=S.fwdSel||(S.fwdSel=[]),i=L.indexOf(g);i<0?L.push(g):L.splice(i,1);e.classList.toggle('on',i<0)};
A.fFwdGo=e=>{const m=D.msgs.find(x=>x.id===e.dataset.id),L=S.fwdSel||[];if(!L.length)return toast('Pick at least one chat');
 L.forEach(g=>{const {id,g:_,f,at,d,re,reac,react,...rest}=m;D.msgs.push({...rest,id:nid('m'),g,f:S.me,at:nowT(),d:TODAY,fwd:1,fk:fKey(m)})});save();closeM();render();toast('Forwarded to '+L.length+' chat'+(L.length>1?'s':''))};
A.fDel=e=>{A.fClose();A.msgDel(e)};

/* long-press / right-click menu: WhatsApp order, file actions first, reactions kept small */
const _msgActF=A.msgAct;A.msgAct=e=>{const m=D.msgs.find(x=>x.id===e.dataset.id);if(!m||m.kind==='del'||m.kind==='poll')return _msgActF(e);
 const file=m.kind==='file'||m.kind==='img',row=(a,i,l,cls)=>`<button class="li" data-a="${a}" data-id="${m.id}">${i}<div class="tx"><b ${cls?'style="color:var(--r)"':''}>${l}</b></div></button>`;
 sheet(`<div class="emo">${['👍','❤️','😂','🙏','🎯','✅'].map(x=>`<button data-a="react" data-id="${m.id}" data-e="${x}">${x}</button>`).join('')}</div><div class="list" style="margin-top:10px">
  ${file?row('fOpen',ic('doc'),m.kind==='img'?'View photo':'Open'):''}${row('repSet',ic('reply'),'Reply')}${row('fFwd',ic('send'),'Forward')}
  ${file?row('fSave',ic('down'),'Save to phone')+row('fShare',sfi('copy',18),'Share'):row('msgCopy',ic('doc'),'Copy text')}
  ${row('msgTask',ic('task'),'Make it a task')}${m.f===S.me||isAdm()?row('msgDel',ic('trash'),'Delete for everyone',1):''}</div>`)};

/* forwarded label */
const _bubF2=bubble;bubble=function(m,G){const o=_bubF2(m,G);return m.fwd?o.replace(/(<div class="bub[^>]*>)/,'$1<div class="ffw">↪ Forwarded</div>'):o};

document.head.insertAdjacentHTML('beforeend',`<style>
.fdoc{display:flex;align-items:center;gap:10px;width:100%;min-width:220px;max-width:300px;border:0;background:rgba(0,0,0,.05);border-radius:10px;padding:10px;cursor:pointer;text-align:left;color:inherit;font:inherit}
.fdoc>svg{width:20px;height:20px;flex:none;color:#54656F;border:1.5px solid #8696A0;border-radius:50%;padding:3px}
.fic{flex:none;width:36px;height:42px;border-radius:5px;background:var(--c);color:#fff;font:800 10px Inter,sans-serif;display:grid;place-items:end center;padding-bottom:6px;position:relative;clip-path:polygon(0 0,70% 0,100% 22%,100% 100%,0 100%)}
.fic.big{width:72px;height:86px;font-size:16px;padding-bottom:12px}
.fnm{flex:1;min-width:0;display:flex;flex-direction:column}.fnm b{font-size:13.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;word-break:break-all}.fnm small{font-size:11.5px;color:#667781;margin-top:2px}
.fimg{border:0;padding:0;background:none;display:block;cursor:pointer}
.ffw{font-size:11.5px;font-style:italic;color:#667781;margin-bottom:2px}
.fv{position:fixed;inset:0;z-index:900;background:#0B141A;display:flex;flex-direction:column;color:#E9EDEF}
.fvh{display:flex;align-items:center;gap:8px;padding:calc(8px + env(safe-area-inset-top)) 10px 8px;background:#1F2C34}.fvh .ib{background:none;border:0;color:#E9EDEF;font-size:30px;width:40px}
.fvt{min-width:0;display:flex;flex-direction:column}.fvt b{font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.fvt small{font-size:12px;color:#8696A0}
.fvb{flex:1;min-height:0;display:grid;place-items:center;overflow:auto}.fvimg{max-width:100%;max-height:100%;object-fit:contain}.fvpdf{width:100%;height:100%;border:0;background:#fff}
.fvcard,.fvno{display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center;padding:24px;max-width:320px}.fvcard b{font-size:15px;word-break:break-all}.fvcard small,.fvno span{color:#8696A0;font-size:13px}.fvcard .btn{margin-top:8px}.fvno svg{width:44px;height:44px;color:#8696A0}
.fvf{display:flex;justify-content:space-around;padding:10px 6px calc(10px + env(safe-area-inset-bottom));background:#1F2C34}.fvf button{display:flex;flex-direction:column;align-items:center;gap:4px;border:0;background:none;color:#E9EDEF;font:600 12px Inter,sans-serif;cursor:pointer;min-width:64px}.fvf button svg{width:22px;height:22px}.fvf button:disabled{opacity:.35}
.fwdl .li.on{background:#E8F3EE}.fwdl .fck{width:20px;height:20px;border-radius:50%;border:2px solid #8696A0;flex:none}.fwdl .li.on .fck{background:#1F9D55;border-color:#1F9D55;box-shadow:inset 0 0 0 3px #fff}
</style>`);

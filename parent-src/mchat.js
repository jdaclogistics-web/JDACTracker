/* ===================== PHONE: Chat + Mail =====================
   Chat  — WhatsApp-style list: tabs (Chats | Mail), pulse indicators (unread, mentions, active, polls),
           filter chips, pinned Announcement; inside a chat: polls and a "Catch up" summary.
   Mail  — like the Gmail app: search bar with folder menu, list with avatars, snippets and attachment chips,
           floating Compose; an open email fills the screen (HTML emailers fit the width, images and PDFs open). */

/* ---------- mail: attachments + HTML emailers (sample data shows both) ---------- */
const INV_PDF='data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCA1OTUgODQyXSAvQ29udGVudHMgNCAwIFIgL1Jlc291cmNlcyA8PCAvRm9udCA8PCAvRjEgNSAwIFIgPj4gPj4gPj4KZW5kb2JqCjQgMCBvYmoKPDwgL0xlbmd0aCAxNzIgPj4Kc3RyZWFtCkJUIC9GMSAxOCBUZiA2MCA3NjAgVGQgKERlbGhpdmVyeSAtIEludm9pY2UgREwtMjYxMS04ODIpIFRqIDAgLTMwIFRkIC9GMSAxMyBUZiAoSkRBQyBMb2dpc3RpY3MgLSBOb3ZlbWJlciBzaGlwbWVudHMpIFRqIDAgLTI0IFRkIChBbW91bnQgZHVlOiBScyA0OCwzMjAgYnkgNSBEZWMgMjAyNikgVGogRVQKZW5kc3RyZWFtCmVuZG9iago1IDAgb2JqCjw8IC9UeXBlIC9Gb250IC9TdWJ0eXBlIC9UeXBlMSAvQmFzZUZvbnQgL0hlbHZldGljYSA+PgplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTggMDAwMDAgbiAKMDAwMDAwMDExNSAwMDAwMCBuIAowMDAwMDAwMjQxIDAwMDAwIG4gCjAwMDAwMDA0NjQgMDAwMDAgbiAKdHJhaWxlcgo8PCAvU2l6ZSA2IC9Sb290IDEgMCBSID4+CnN0YXJ0eHJlZgo1MzQKJSVFT0Y=';
if(!D.mailV2){const m2=(D.mail||[]).find(m=>m.id==='m2');if(m2&&!m2.att)m2.att=[{n:'Invoice DL-2611-882.pdf',type:'application/pdf',size:716,src:INV_PDF}];
 if(!(D.mail||[]).some(m=>m.id==='m6'))D.mail.push({id:'m6',from:'ext:updates@delhivery.com',to:['darshan'],cc:[],s:'December rate card · new zones live',b:'New zones are live from 1 Dec. See the rate card inside.',
  html:'<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #eee;border-radius:12px;overflow:hidden"><div style="background:#E51F28;color:#fff;padding:22px 24px;font-size:22px;font-weight:bold">DELHIVERY · December update</div><div style="padding:20px 24px;color:#222;font-size:15px;line-height:1.6"><p>Dear partner,</p><p>From <b>1 December</b> we are adding <b>42 new pin-code zones</b> across Maharashtra and Goa.</p><table style="width:100%;border-collapse:collapse;margin:14px 0"><tr style="background:#f6f6f6"><th style="text-align:left;padding:8px">Zone</th><th style="text-align:right;padding:8px">0.5 kg</th></tr><tr><td style="padding:8px;border-top:1px solid #eee">Within city</td><td style="padding:8px;border-top:1px solid #eee;text-align:right">₹38</td></tr><tr><td style="padding:8px;border-top:1px solid #eee">Within state</td><td style="padding:8px;border-top:1px solid #eee;text-align:right">₹46</td></tr><tr><td style="padding:8px;border-top:1px solid #eee">Metro to metro</td><td style="padding:8px;border-top:1px solid #eee;text-align:right">₹58</td></tr></table><a href="https://www.delhivery.com" style="display:inline-block;background:#111;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">View full rate card</a></div></div>',
  att:[{n:'Rate card Dec 2026.pdf',type:'application/pdf',size:716,src:INV_PDF}],at:TODAY+'T08:20',read:{},star:{},del:{},sample:1});
 D.mailV2=1;save()}
const mAttIcon=a=>/pdf/.test(a.type)?['PDF','#D92D20']:/image/.test(a.type)?['IMG','#1F9D55']:/sheet|excel|csv/.test(a.type)?['XLS','#1F7A3D']:/word|doc/.test(a.type)?['DOC','#2563C9']:['FILE','#667085'];
const mSize=n=>n>1048576?(n/1048576).toFixed(1)+' MB':Math.max(1,Math.round(n/1024))+' KB';
A.mAttOpen=e=>{const m=D.mail.find(x=>x.id===e.dataset.id),a=m&&(m.att||[])[+e.dataset.i];if(!a)return;
 if(/image/.test(a.type))return sheet(`<img src="${a.src}" alt="" style="width:100%;border-radius:12px"><a class="btn w" style="margin-top:12px" href="${a.src}" download="${h(a.n)}">${ic('dl')}Download</a>`);
 fetch(a.src).then(r=>r.blob()).then(b=>{const u=URL.createObjectURL(b);const w=window.open(u,'_blank','noopener');if(!w){const l=document.createElement('a');l.href=u;l.download=a.n;l.click()}}).catch(()=>toast('Could not open the file'))};
/* compose: attach files (photos, PDFs, sheets) */
let MATT=[];
const _mNewMC=A.mNew;A.mNew=e=>{MATT=[];_mNewMC(e);const b=document.getElementById('mc-b');if(b&&!document.getElementById('mc-att'))b.insertAdjacentHTML('afterend',`<label class="btn sm sec" style="margin-top:8px;cursor:pointer">${ic('clip')}Attach files<input id="mc-att" type="file" multiple class="sr" data-ch="mcAtt"></label><div id="mc-attl" class="mattl"></div>`)};
document.addEventListener('change',async e=>{if(!e.target||e.target.dataset.ch!=='mcAtt')return;for(const f of [...e.target.files].slice(0,8)){if(f.size>3e6){toast(f.name+' is over 3 MB · share a Drive link instead');continue}const src=await new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result);fr.readAsDataURL(f)});MATT.push({n:f.name,type:f.type||'application/octet-stream',size:f.size,src})}
 const l=document.getElementById('mc-attl');if(l)l.innerHTML=MATT.map(a=>{const [t,c]=mAttIcon(a);return `<span class="matt"><i style="background:${c}">${t}</i>${h(a.n)}</span>`}).join('');e.target.value=''});
const _mCollectMC=mCollect;mCollect=function(){const c=_mCollectMC();if(MATT.length)c.att=MATT.slice();return c};

/* ---------- mail on a phone ---------- */
function mMail(){const me=S.me;S.mf2=S.mf2||'in';const F={in:mIn(me),star:D.mail.filter(m=>(m.star||{})[me]&&!(m.del||{})[me]),sent:D.mail.filter(m=>m.from===me&&!m.draft&&!(m.del||{})[me]),draft:D.mail.filter(m=>m.from===me&&m.draft),trash:D.mail.filter(m=>(m.del||{})[me])};
 const FN={in:'Inbox',star:'Starred',sent:'Sent',draft:'Drafts',trash:'Trash'},tm=a=>a.slice(0,10)===TODAY?a.slice(11,16):fmt(a.slice(0,10));
 const cur=S.mid&&D.mail.find(m=>m.id===S.mid);
 if(cur){if(!(cur.read||{})[me]){cur.read=cur.read||{};cur.read[me]=1;save()}const st=(cur.star||{})[me];
  const att=(cur.att||[]).map((a,i)=>{const [t,c]=mAttIcon(a);return /image/.test(a.type)?`<button class="mat img" data-a="mAttOpen" data-id="${cur.id}" data-i="${i}"><img src="${a.src}" alt=""><span>${h(a.n)}</span></button>`:`<button class="mat" data-a="mAttOpen" data-id="${cur.id}" data-i="${i}"><i style="background:${c}">${t}</i><span><b>${h(a.n)}</b><small>${mSize(a.size||0)}</small></span>${ic('dl')}</button>`}).join('');
  const body=cur.html?`<iframe class="mhtml" sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin" srcdoc="${h('<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><base target="_blank"><style>body{margin:0;padding:4px;font-family:-apple-system,Roboto,Arial,sans-serif;word-wrap:break-word}img,table{max-width:100%!important;height:auto}*{max-width:100%;box-sizing:border-box}</style>'+cur.html)}" onload="try{this.style.height=this.contentDocument.documentElement.scrollHeight+'px'}catch(e){}"></iframe>`:`<div class="mtext">${h(cur.b).replace(/(https?:\/\/[^\s<]+)/g,'<a href="$1" target="_blank" rel="noopener">$1</a>')}</div>`;
  return `<div class="mmr"><div class="mmrbar"><button class="mback2" data-a="mMailBack" aria-label="Back">${ic('back')}</button><span class="sp"></span><button data-a="mDel" data-id="${cur.id}" aria-label="Delete">${ic('trash')}</button><button data-a="mStar" data-id="${cur.id}" aria-label="Star" class="${st?'on':''}">${ic('star')}</button></div>
  <h1 class="mmsub">${h(cur.s||'(no subject)')} <span class="mfold">${FN[S.mf2]}</span></h1>
  <div class="mmfrom">${av(mName(cur.from))}<div><b>${h(mName(cur.from))}</b><small>${h(cur.from.startsWith('ext:')?cur.from.slice(4):MADDR(cur.from))} · ${tm(cur.at)}</small><small>to ${h(cur.to.map(x=>x===me?'me':x.startsWith('ext:')?x.slice(4):nmF(x)).join(', '))}${cur.cc.length?' · cc '+h(cur.cc.map(nmF).join(', ')):''}</small></div><button class="mrep" data-a="mReply" data-id="${cur.id}" aria-label="Reply">↩</button></div>
  ${body}${att?`<div class="mats"><div class="msec">${(cur.att||[]).length} attachment${(cur.att||[]).length===1?'':'s'}</div>${att}</div>`:''}
  <div class="mmact"><button data-a="mReply" data-id="${cur.id}">↩ Reply</button><button data-a="mFwd" data-id="${cur.id}">↪ Forward</button></div></div>`}
 const q=(S.mq2||'').toLowerCase(),fl=S.mfl||'all';let L=F[S.mf2].filter(m=>!q||(m.s+m.b+m.from+m.to.join(' ')+(m.att||[]).map(a=>a.n).join(' ')).toLowerCase().includes(q));
 if(fl==='un')L=L.filter(m=>!(m.read||{})[me]);if(fl==='att')L=L.filter(m=>(m.att||[]).length);if(fl==='ext')L=L.filter(m=>m.from.startsWith('ext:'));
 L=L.sort((a,b)=>b.at.localeCompare(a.at));
 const row=m=>{const un=S.mf2==='in'&&!(m.read||{})[me],who=S.mf2==='sent'||S.mf2==='draft'?'To: '+m.to.map(x=>x.startsWith('ext:')?x.slice(4):nmF(x)).join(', '):mName(m.from),A0=m.att||[];
  return `<div class="mmrow ${un?'un':''}" data-a="mOpen" data-id="${m.id}" role="button" tabindex="0">${av(mName(m.from))}<div class="mmtx"><div class="mm1"><b>${h(who)}</b><span>${tm(m.at)}</span></div><div class="mm2">${h(m.s||'(no subject)')}</div><div class="mm3">${h((m.b||'').replace(/\n+/g,' ').slice(0,110))}</div>${A0.length?`<div class="mmatt">${A0.slice(0,2).map(a=>{const [t,c]=mAttIcon(a);return `<span><i style="background:${c}">${t}</i>${h(a.n)}</span>`}).join('')}${A0.length>2?`<span>+${A0.length-2}</span>`:''}</div>`:''}</div><button class="mmst ${(m.star||{})[me]?'on':''}" data-a="mStar" data-id="${m.id}" aria-label="Star">${ic('star')}</button></div>`};
 return `<div class="mmsearch"><button data-a="mFolders" aria-label="Folders">${ic('menu')}</button><input data-in="mq2" value="${h(S.mq2||'')}" placeholder="Search in mail" aria-label="Search in mail">${av(nmF(me))}</div>
 <div class="mmchips">${[['all',FN[S.mf2]],['un','Unread'],['att','Attachments'],['ext','Outside']].map(([k,l])=>`<button class="${fl===k?'on':''}" data-a="mFl" data-t="${k}">${l}</button>`).join('')}</div>
 <div class="msec">${FN[S.mf2]}${S.mf2==='in'&&mUnread(me)?' · '+mUnread(me)+' unread':''}</div>
 <div class="mml">${L.map(row).join('')||`<div class="mempty">${ic('mail')}<b>Nothing here</b><small>${q?'No mail matches your search':'Your '+FN[S.mf2].toLowerCase()+' is empty'}</small></div>`}</div>
 <button class="mcompose" data-a="mNew">${ic('edit')}Compose</button>`}
A.mMailBack=()=>{S.mid=null;render();scrollTo(0,0)};A.mFl=e=>{S.mfl=e.dataset.t;render()};
A.mFolders=()=>{const me=S.me,c={in:mUnread(me),draft:D.mail.filter(m=>m.from===me&&m.draft).length};sheet(`<div class="xs mut" style="margin-bottom:6px">${h(MADDR(me))} · only you can see this mailbox</div><div class="list">${[['in','Inbox','mail'],['star','Starred','star'],['sent','Sent','send'],['draft','Drafts','doc'],['trash','Trash','trash']].map(([k,n,i])=>`<button class="li" data-a="mFoldGo" data-t="${k}">${ic(i)}<div class="tx"><b>${n}</b></div>${c[k]?pill(c[k],'b'):''}${S.mf2===k?ic('check'):''}</button>`).join('')}</div>`)};
A.mFoldGo=e=>{S.mf2=e.dataset.t;S.mid=null;closeM();render()};
const _mOpenMC=A.mOpen;A.mOpen=e=>{_mOpenMC(e);if(isMob())scrollTo(0,0)};

/* ---------- chat polls (seen everywhere, created from the phone composer) ---------- */
const _bubMC=bubble;bubble=function(m,G){if(m.kind!=='poll')return _bubMC(m,G);const me=m.f===S.me,V0=m.votes||{},tot=Object.values(V0).reduce((a,v)=>a+v.length,0),mine=Object.keys(V0).find(k=>(V0[k]||[]).includes(S.me));
 return `<div class="bub ${me?'me':''} bpoll">${!me&&G?`<div class="w" style="color:${colr(nm(m.f))}">${h(nmF(m.f))}</div>`:''}<div class="pq">📊 ${h(m.q)}</div>${m.opts.map((o,i)=>{const n=(V0[i]||[]).length,p=tot?Math.round(n*100/tot):0;return `<button class="popt ${mine==String(i)?'on':''}" data-a="pollVote" data-id="${m.id}" data-o="${i}"><span class="pbar" style="width:${p}%"></span><span class="ptx">${mine==String(i)?'✓ ':''}${h(o)}</span><b>${n}</b></button>`}).join('')}<div class="t">${tot} vote${tot===1?'':'s'} · ${m.at}</div></div>`};
A.pollVote=e=>{const m=D.msgs.find(x=>x.id===e.dataset.id);if(!m)return;m.votes=m.votes||{};Object.keys(m.votes).forEach(k=>m.votes[k]=m.votes[k].filter(x=>x!==S.me));const o=e.dataset.o;m.votes[o]=[...(m.votes[o]||[]),S.me];save();render()};
A.pollNew=()=>sheet(`<h2>New poll</h2><label for="pq">Question</label><input id="pq" placeholder="e.g. Team lunch on Saturday?"><label>Options</label><div id="popts">${[1,2,3].map(i=>`<input class="popi" placeholder="Option ${i}" style="margin-bottom:8px">`).join('')}</div><button class="lnk" data-a="pollAddOpt">+ Add option</button><button class="btn w" style="margin-top:14px" data-a="pollSend">Send poll</button>`);
A.pollAddOpt=()=>{const d=document.getElementById('popts');if(d&&d.children.length<8)d.insertAdjacentHTML('beforeend',`<input class="popi" placeholder="Option ${d.children.length+1}" style="margin-bottom:8px">`)};
A.pollSend=()=>{const q=val('pq'),o=[...document.querySelectorAll('.popi')].map(x=>x.value.trim()).filter(Boolean);if(!q)return toast('Write the question');if(o.length<2)return toast('Add at least 2 options');D.msgs.push({id:nid('m'),g:S.chat,f:S.me,kind:'poll',q,opts:o,votes:{},t:'📊 Poll: '+q,at:nowT()});save();closeM();render();setTimeout(()=>{const t=document.getElementById('thr');if(t)t.scrollTop=t.scrollHeight},30)};
/* catch up: a quick summary of the conversation */
A.chatCatch=()=>{const g=D.groups.find(x=>x.id===S.chat);if(!g)return;const M=D.msgs.filter(m=>m.g===g.id&&m.kind!=='del'),last=M.slice(-30),by={};last.forEach(m=>{by[m.f]=(by[m.f]||0)+1});
 const ment=M.filter(m=>String(m.t||'').toLowerCase().includes('@'+String(nmF(S.me)).split(' ')[0].toLowerCase())).slice(-5),polls=M.filter(m=>m.kind==='poll'),media=M.filter(m=>['img','file','voice'].includes(m.kind));
 const top=Object.entries(by).sort((a,b)=>b[1]-a[1]);
 sheet(`<h2>✨ Catch up · ${h(g.n)}</h2><div class="mcu"><div><b>${M.length}</b><span>messages</span></div><div><b>${top.length}</b><span>people talking</span></div><div><b>${polls.length}</b><span>polls</span></div><div><b>${media.length}</b><span>photos & files</span></div></div>
 ${ment.length?`<div class="msec">Mentions of you</div><div class="list">${ment.map(m=>`<div class="li"><div class="tx"><b>${h(nmF(m.f))}</b><div class="m">${h(String(m.t).slice(0,120))}</div></div><span class="xs mut">${m.at}</span></div>`).join('')}</div>`:''}
 <div class="msec">Who said what · latest</div><div class="list">${top.slice(0,6).map(([k,n])=>{const lm=last.filter(m=>m.f===k).slice(-1)[0];return `<div class="li">${av(nm(k))}<div class="tx"><b>${h(nmF(k))} · ${n} msg${n===1?'':'s'}</b><div class="m">${h(String(lm.t||lm.q||'📎').slice(0,110))}</div></div></div>`}).join('')||'<div class="empty xs">No messages yet</div>'}</div>
 ${polls.length?`<div class="msec">Polls</div><div class="list">${polls.slice(-3).map(p=>{const V0=p.votes||{},tot=Object.values(V0).reduce((a,v)=>a+v.length,0),bi=p.opts.map((o,i)=>[(V0[i]||[]).length,o]).sort((a,b)=>b[0]-a[0])[0];return `<div class="li"><div class="tx"><b>${h(p.q)}</b><div class="m">${tot} votes · leading: ${h(bi[1])}</div></div></div>`}).join('')}</div>`:''}`)};

/* ---------- chat + mail screens on a phone ---------- */
const _vChatMC=V.chat;V.chat=()=>{if(!isMob()||S.v!=='chat')return _vChatMC();
 if(S.chm==='email')return (S.mid?'':mTabs())+mMail();
 const o=_vChatMC();
 if(/class="wahd"/.test(o))return o.replace(/(<button class="gmem")/,'<button class="mcatch" data-a="chatCatch" aria-label="Catch up">✨</button>$1')
  .replace('<label class="cb" style="cursor:pointer" aria-label="Attach">','<button class="cb" data-a="pollNew" aria-label="Poll">📊</button><label class="cb" style="cursor:pointer" aria-label="Attach">');
 /* chat list */
 const t=document.createElement('template');t.innerHTML=o;t.content.querySelectorAll('.c5h,.tteam').forEach(x=>x.remove());
 const G=(D.groups||[]).filter(g=>t.content.querySelector(`[data-id="${g.id}"]`)),un=G.reduce((a,g)=>a+unreadG(g),0),first=String(nmF(S.me)).split(' ')[0].toLowerCase();
 const ment=D.msgs.filter(m=>G.some(g=>g.id===m.g)&&m.f!==S.me&&String(m.t||'').toLowerCase().includes('@'+first)).length,act=G.filter(g=>D.msgs.some(m=>m.g===g.id&&m.at&&String(m.d||TODAY)===TODAY)).length,polls=D.msgs.filter(m=>m.kind==='poll'&&G.some(g=>g.id===m.g)&&!Object.values(m.votes||{}).some(v=>v.includes(S.me))).length;
 const fl=S.mcf||'all';t.content.querySelectorAll('.chor').forEach(r=>{const g=D.groups.find(x=>x.id===r.dataset.id);if(!g)return;const keep=fl==='all'||(fl==='un'&&unreadG(g)>0)||(fl==='ann'&&g.id==='ann')||(fl==='mine'&&(g.m||g.who||[]).includes(S.me));if(!keep)r.remove()});
 const head=`${mTabs()}<div class="mpulse"><button data-a="mcF" data-t="un"><b>${un}</b><span>unread</span></button><button data-a="mcF" data-t="all"><b>${ment}</b><span>mentions</span></button><button data-a="mcF" data-t="all"><b>${G.length}</b><span>chats</span></button><button data-a="mcF" data-t="all"><b>${polls}</b><span>polls to vote</span></button></div>
 <div class="mmchips">${[['all','All'],['un','Unread'],['ann','📣 Announcements'],['mine','My teams']].map(([k,l])=>`<button class="${fl===k?'on':''}" data-a="mcF" data-t="${k}">${l}</button>`).join('')}</div>`;
 return head+t.innerHTML};
const mTabs=()=>`<div class="mctop"><h1>${S.chm==='email'?'Mail':'Chats'}</h1><div class="mctabs"><button class="${S.chm!=='email'?'on':''}" data-a="mcTab" data-t="team">${ic('chat')}Chats${(D.groups||[]).reduce((a,g)=>a+unreadG(g),0)?`<em>${(D.groups||[]).reduce((a,g)=>a+unreadG(g),0)}</em>`:''}</button><button class="${S.chm==='email'?'on':''}" data-a="mcTab" data-t="email">${ic('mail')}Mail${mUnread(S.me)?`<em>${mUnread(S.me)}</em>`:''}</button></div>${S.chm!=='email'&&isAdm()?`<button class="mnewg" data-a="grpNew" aria-label="New group">${ic('plus')}</button>`:''}</div>`;
A.mcTab=e=>{S.chm=e.dataset.t;S.chat=null;S.mid=null;render();scrollTo(0,0)};A.mcF=e=>{S.mcf=e.dataset.t;render()};
const _rMC=render;render=function(){_rMC.apply(this,arguments);if(!isMob())return;const r=S.v==='chat'&&S.chm==='email'&&!!S.mid;document.documentElement.classList.toggle('mmailread',r)};

document.head.insertAdjacentHTML('beforeend',`<style>
/* polls (everywhere) */
.bpoll{min-width:230px}.bpoll .pq{font-weight:700;margin-bottom:8px}
.popt{position:relative;display:flex;align-items:center;gap:8px;width:100%;border:1px solid rgba(0,0,0,.08);background:rgba(255,255,255,.7);border-radius:10px;padding:9px 10px;margin:0 0 6px;font:inherit;text-align:left;overflow:hidden;cursor:pointer}
.popt .pbar{position:absolute;left:0;top:0;bottom:0;background:rgba(36,64,142,.12);transition:width .3s}.popt.on .pbar{background:rgba(31,157,85,.2)}.popt .ptx{position:relative;flex:1}.popt b{position:relative;font-size:12px}
.mattl{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.matt{display:inline-flex;align-items:center;gap:6px;background:#F2F4F7;border-radius:8px;padding:4px 8px;font-size:12px}.matt i{font-style:normal;color:#fff;font-size:9px;font-weight:800;border-radius:4px;padding:2px 4px}
@media(max-width:820px){
 .mctop{display:flex;align-items:center;gap:10px;margin:0 0 12px}.mctop h1{margin:0;font-size:26px;flex:1}
 .mctabs{display:flex;background:#E9ECF2;border-radius:14px;padding:3px}.mctabs button{border:0;background:none;display:inline-flex;align-items:center;gap:6px;padding:8px 12px;border-radius:11px;font:inherit;font-size:13px;font-weight:700;color:#475467}.mctabs button svg{width:16px;height:16px}
 .mctabs button.on{background:#fff;color:var(--navy);box-shadow:0 1px 3px rgba(16,24,40,.12)}.mctabs em{font-style:normal;background:#E8590C;color:#fff;border-radius:999px;font-size:10.5px;padding:1px 6px}
 .mnewg{width:40px;height:40px;border-radius:13px;border:0;background:var(--navy);color:#fff;display:grid;place-items:center}.mnewg svg{width:20px;height:20px}
 .mpulse{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:0 0 12px}.mpulse button{border:0;background:#fff;border-radius:16px;padding:10px 4px;font:inherit;display:flex;flex-direction:column;align-items:center;box-shadow:0 1px 2px rgba(16,24,40,.05)}
 .mpulse b{font-size:20px;color:var(--navy)}.mpulse span{font-size:10.5px;color:var(--mut);font-weight:600;text-align:center;line-height:1.2}
 .mmchips{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;margin:0 -16px 10px;padding:0 16px}.mmchips::-webkit-scrollbar{display:none}
 .mmchips button{flex:none;border:1px solid var(--line);background:#fff;border-radius:999px;padding:7px 14px;font:inherit;font-size:13px;font-weight:600;color:#344054}.mmchips button.on{background:#E7EEFF;border-color:#B9C8F5;color:var(--navy)}
 html.mob #main[data-v="chat"] .chov{border-radius:18px;overflow:hidden}
 html.mob #main.mconv .wahd .gmem{font-size:0!important;width:38px;height:38px;padding:0!important;display:grid;place-items:center;border-radius:50%}html.mob #main.mconv .wahd .gmem svg{width:18px;height:18px;margin:0}
 .mcatch{border:0;background:rgba(255,255,255,.15);color:#fff;width:36px;height:36px;border-radius:50%;font-size:17px;flex:none}
 .mcu{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:6px 0 4px}.mcu div{background:#F5F7FB;border-radius:14px;padding:10px 4px;text-align:center}.mcu b{display:block;font-size:20px;color:var(--navy)}.mcu span{font-size:10.5px;color:var(--mut);font-weight:600}
 /* mail list */
 .mmsearch{display:flex;align-items:center;gap:10px;background:#EEF2F8;border-radius:28px;padding:6px 8px 6px 12px;margin:0 0 10px}.mmsearch>button{border:0;background:none;width:36px;height:36px;display:grid;place-items:center;color:#344054}.mmsearch>button svg{width:22px;height:22px}
 .mmsearch input{flex:1;border:0;background:none;font:inherit;font-size:15px;min-height:36px;padding:0;outline:none}.mmsearch .av{width:32px!important;height:32px!important;font-size:12px!important}
 .mml{background:#fff;border-radius:18px;overflow:hidden}
 .mmrow{display:flex;gap:12px;padding:12px 12px 12px 14px;border-bottom:1px solid #F0F2F5;cursor:pointer;align-items:flex-start}.mmrow:last-child{border-bottom:0}.mmrow:active{background:#F5F7FB}
 .mmrow>.av{width:40px!important;height:40px!important;font-size:14px!important;flex:none;margin-top:2px}.mmtx{flex:1;min-width:0}
 .mm1{display:flex;gap:8px}.mm1 b{flex:1;font-size:14.5px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#344054}.mm1 span{font-size:12px;color:var(--mut)}
 .mm2{font-size:14px;color:#344054;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mm3{font-size:13px;color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
 .mmrow.un .mm1 b,.mmrow.un .mm2{font-weight:800;color:#101828}.mmrow.un .mm1 span{color:var(--navy);font-weight:700}
 .mmatt{display:flex;gap:6px;margin-top:7px;flex-wrap:wrap}.mmatt span{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);border-radius:999px;padding:4px 10px 4px 5px;font-size:12px;font-weight:600;color:#344054;max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
 .mmatt i{font-style:normal;color:#fff;font-size:8.5px;font-weight:800;border-radius:4px;padding:2px 4px;flex:none}
 .mmst{border:0;background:none;color:#C3C8D2;width:32px;height:32px;display:grid;place-items:center;flex:none}.mmst svg{width:19px;height:19px}.mmst.on{color:#E8A33D}.mmst.on svg{fill:#E8A33D}
 .mcompose{position:fixed;right:16px;bottom:calc(84px + env(safe-area-inset-bottom));z-index:44;border:0;background:#C9DBFF;color:#0B2A6F;border-radius:18px;padding:16px 20px;font:inherit;font-size:15px;font-weight:700;display:flex;gap:10px;align-items:center;box-shadow:0 6px 18px rgba(16,24,40,.18)}.mcompose svg{width:20px;height:20px}
 /* mail reader */
 html.mob.mmailread .bnav{display:none!important}
 .mmr{margin:-14px -16px 0;background:#fff;min-height:100vh;padding:0 16px 90px}
 .mmrbar{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:4px;background:#fff;padding:8px 0;margin:0 -4px}.mmrbar button{border:0;background:none;width:42px;height:42px;border-radius:50%;display:grid;place-items:center;color:#344054}.mmrbar button svg{width:21px;height:21px}.mmrbar button.on{color:#E8A33D}.mmrbar button.on svg{fill:#E8A33D}
 .mmsub{font-size:21px;line-height:1.3;margin:4px 0 14px;font-weight:500}.mfold{display:inline-block;vertical-align:middle;font-size:11px;font-weight:600;background:#F2F4F7;color:#475467;border-radius:6px;padding:2px 7px}
 .mmfrom{display:flex;gap:12px;align-items:flex-start;margin:0 0 16px}.mmfrom .av{width:40px!important;height:40px!important;flex:none}.mmfrom>div{flex:1;min-width:0}.mmfrom b{display:block;font-size:15px}.mmfrom small{display:block;font-size:12px;color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
 .mrep{border:0;background:#F2F4F7;width:40px;height:40px;border-radius:50%;font-size:18px}
 .mtext{white-space:pre-wrap;font-size:15px;line-height:1.6;color:#1D2939;word-wrap:break-word}.mtext a{color:#1A56DB}
 .mhtml{width:100%;border:0;min-height:300px;display:block}
 .mats{margin-top:18px}.mat{display:flex;align-items:center;gap:12px;width:100%;border:1px solid var(--line);background:#fff;border-radius:14px;padding:10px 12px;margin-bottom:8px;font:inherit;text-align:left}
 .mat>i{font-style:normal;color:#fff;font-weight:800;font-size:11px;width:40px;height:40px;border-radius:10px;display:grid;place-items:center;flex:none}.mat>span{flex:1;min-width:0}.mat b{display:block;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mat small{color:var(--mut);font-size:12px}.mat>svg{width:20px;height:20px;color:#475467}
 .mat.img{display:block;padding:0;overflow:hidden}.mat.img img{width:100%;display:block;max-height:240px;object-fit:cover}.mat.img span{display:block;padding:8px 12px;font-size:13px}
 .mmact{position:fixed;left:0;right:0;bottom:0;z-index:30;display:flex;gap:10px;padding:10px 16px calc(10px + env(safe-area-inset-bottom));background:#fff;box-shadow:0 -4px 14px rgba(16,24,40,.06)}.mmact button{flex:1;border:1px solid var(--line);background:#fff;border-radius:999px;padding:12px;font:inherit;font-weight:700;font-size:14px;color:#344054}
}
</style>`);

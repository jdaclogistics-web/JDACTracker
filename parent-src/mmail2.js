/* ===================== PHONE MAIL v2 — Gmail-like =====================
   Slim Chats|Mail switch · search bar (☰ opens the folder drawer) · quick filters · flat list with
   highlighted search hits · full-screen reader · full-screen compose (From / To / Subject / body,
   📎 and ➤ on top), like the Gmail app. */
const mHi=(t,q)=>{t=h(t||'');if(!q)return t;const r=q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');return t.replace(new RegExp('('+r+')','ig'),'<mark>$1</mark>')};
const mBox=me=>({in:mIn(me),un:mIn(me).filter(m=>!(m.read||{})[me]),star:D.mail.filter(m=>(m.star||{})[me]&&!(m.del||{})[me]),att:D.mail.filter(m=>(m.att||[]).length&&!(m.del||{})[me]&&(m.from===me||m.to.includes(me)||m.cc.includes(me))),sent:D.mail.filter(m=>m.from===me&&!m.draft&&!(m.del||{})[me]),draft:D.mail.filter(m=>m.from===me&&m.draft),trash:D.mail.filter(m=>(m.del||{})[me])});
const MBN={in:['Inbox','mail'],un:['Unread','mail'],star:['Starred','star'],att:['With attachments','clip'],sent:['Sent','send'],draft:['Drafts','doc'],trash:['Trash','trash']};
mMail=function(){const me=S.me;if(!MBN[S.mf2])S.mf2='in';const B=mBox(me),tm=a=>a.slice(0,10)===TODAY?a.slice(11,16):fmt(a.slice(0,10));
 const cur=S.mid&&D.mail.find(m=>m.id===S.mid);
 if(cur){if(!(cur.read||{})[me]){cur.read=cur.read||{};cur.read[me]=1;save()}const st=(cur.star||{})[me];
  const att=(cur.att||[]).map((a,i)=>{const [t,c]=mAttIcon(a);return /image/.test(a.type)?`<button class="mat img" data-a="mAttOpen" data-id="${cur.id}" data-i="${i}"><img src="${a.src}" alt=""><span>${h(a.n)}</span></button>`:`<button class="mat" data-a="mAttOpen" data-id="${cur.id}" data-i="${i}"><i style="background:${c}">${t}</i><span><b>${h(a.n)}</b><small>${mSize(a.size||0)}</small></span>${ic('dl')}</button>`}).join('');
  const body=cur.html?`<iframe class="mhtml" sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin" srcdoc="${h('<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><base target="_blank"><style>body{margin:0;font-family:-apple-system,Roboto,Arial,sans-serif;word-wrap:break-word}img,table{max-width:100%!important;height:auto}*{max-width:100%;box-sizing:border-box}</style>'+cur.html)}" onload="try{this.style.height=this.contentDocument.documentElement.scrollHeight+'px'}catch(e){}"></iframe>`:`<div class="mtext">${h(cur.b).replace(/(https?:\/\/[^\s<]+)/g,'<a href="$1" target="_blank" rel="noopener">$1</a>')}</div>`;
  return `<div class="mg-read"><div class="mg-rbar"><button data-a="mMailBack" aria-label="Back">${ic('back')}</button><span class="sp"></span><button data-a="mDel" data-id="${cur.id}" aria-label="Delete">${ic('trash')}</button><button data-a="mUnreadSet" data-id="${cur.id}" aria-label="Mark unread">${ic('mail')}</button></div>
  <div class="mg-sub"><h1>${h(cur.s||'(no subject)')} <span>${MBN[S.mf2][0]}</span></h1><button class="mg-star ${st?'on':''}" data-a="mStar" data-id="${cur.id}" aria-label="Star">${ic('star')}</button></div>
  <div class="mg-from">${av(mName(cur.from))}<div><b>${h(mName(cur.from))}</b> <small>${tm(cur.at)}</small><button class="mg-to" data-a="mToggleHd">to ${h(cur.to.map(x=>x===me?'me':x.startsWith('ext:')?x.slice(4):nmF(x)).join(', '))} ▾</button>${S.mhd?`<div class="mg-hd">From: ${h(cur.from.startsWith('ext:')?cur.from.slice(4):MADDR(cur.from))}<br>To: ${h(cur.to.map(x=>x.startsWith('ext:')?x.slice(4):MADDR(x)).join(', '))}${cur.cc.length?'<br>Cc: '+h(cur.cc.map(MADDR).join(', ')):''}<br>Date: ${h(cur.at.replace('T',' '))}</div>`:''}</div><button class="mg-rp" data-a="mReply" data-id="${cur.id}" aria-label="Reply">${ic('reply')}</button></div>
  <div class="mg-body">${body}</div>${att?`<div class="mats"><div class="msec">${(cur.att||[]).length} attachment${(cur.att||[]).length===1?'':'s'}</div>${att}</div>`:''}
  <div class="mg-act"><button data-a="mReply" data-id="${cur.id}">${ic('reply')}Reply</button><button data-a="mFwd" data-id="${cur.id}">${ic('send')}Forward</button></div></div>`}
 const q=(S.mq2||'').trim().toLowerCase();let L=B[S.mf2];
 if(q)L=[...new Set([...B.in,...B.sent,...B.draft])].filter(m=>(mName(m.from)+' '+m.from+' '+m.to.join(' ')+' '+m.s+' '+m.b+' '+(m.att||[]).map(a=>a.n).join(' ')).toLowerCase().includes(q));
 L=L.slice().sort((a,b)=>b.at.localeCompare(a.at));
 const row=m=>{const un=!(m.read||{})[me]&&m.from!==me,who=m.from===me?'To: '+m.to.map(x=>x.startsWith('ext:')?x.slice(4):nmF(x)).join(', '):mName(m.from),A0=m.att||[];
  const hit=q&&!(m.s+mName(m.from)).toLowerCase().includes(q)?(()=>{const t=(m.b||'').replace(/\n+/g,' '),i=t.toLowerCase().indexOf(q);return i<0?t.slice(0,110):'…'+t.slice(Math.max(0,i-30),i+80)})():(m.b||'').replace(/\n+/g,' ').slice(0,110);
  return `<div class="mg-row ${un?'un':''}" data-a="mOpen" data-id="${m.id}" role="button" tabindex="0">${av(mName(m.from))}<div class="mg-tx"><div class="mg-1"><b>${mHi(who,q)}</b>${m.draft?'<em>Draft</em>':''}<span>${tm(m.at)}</span></div><div class="mg-2">${mHi(m.s||'(no subject)',q)}</div><div class="mg-3">${mHi(hit,q)}</div>${A0.length?`<div class="mmatt">${A0.slice(0,2).map(a=>{const [t,c]=mAttIcon(a);return `<span><i style="background:${c}">${t}</i><u>${mHi(a.n,q)}</u></span>`}).join('')}${A0.length>2?`<span>+${A0.length-2}</span>`:''}</div>`:''}</div><button class="mg-st ${(m.star||{})[me]?'on':''}" data-a="mStar" data-id="${m.id}" aria-label="Star">${ic('star')}</button></div>`};
 const quick=[['in','All'],['un','Unread'],['star','Starred'],['att','Attachments'],['sent','Sent']];
 return `<div class="mg-search ${q?'q':''}"><button data-a="mDrawer" aria-label="Folders">${ic('menu')}</button><input data-in="mq2" value="${h(S.mq2||'')}" placeholder="Search in mail" aria-label="Search in mail" enterkeyhint="search">${q?`<button data-a="mQx" aria-label="Clear search">×</button>`:av(nmF(me))}</div>
 ${q?`<div class="mg-qinfo">${L.length} result${L.length===1?'':'s'} for “${h(S.mq2)}” · searching sender, subject, message and attachment names</div>`:`<div class="mmchips">${quick.map(([k,l])=>`<button class="${S.mf2===k?'on':''}" data-a="mFoldGo" data-t="${k}">${l}${k==='un'&&B.un.length?` <b>${B.un.length}</b>`:''}</button>`).join('')}</div><div class="msec">${MBN[S.mf2][0]}</div>`}
 <div class="mg-list">${L.map(row).join('')||`<div class="mempty">${ic(q?'search':'mail')}<b>${q?'No mail found':'Nothing here'}</b><small>${q?'Try a name, a word from the subject or a file name':''}</small></div>`}</div>
 <button class="mcompose" data-a="mNew">${ic('edit')}Compose</button>`};
A.mQx=()=>{S.mq2='';render()};A.mToggleHd=()=>{S.mhd=!S.mhd;render()};
A.mUnreadSet=e=>{const m=D.mail.find(x=>x.id===e.dataset.id);if(m){m.read=m.read||{};delete m.read[S.me];save()}S.mid=null;render();toast('Marked unread')};
A.mDrawer=()=>{const me=S.me,B=mBox(me);document.getElementById('mgdr')&&document.getElementById('mgdr').remove();
 document.body.insertAdjacentHTML('beforeend',`<div id="mgdr" class="mg-dr" data-a="mDrawerX"><nav onclick="event.stopPropagation()"><div class="mg-drh"><b>JDAC Mail</b><small>${h(MADDR(me))}</small></div>${Object.entries(MBN).map(([k,[n,i]])=>{const c=k==='in'||k==='un'?B.un.length:k==='draft'?B.draft.length:k==='att'?B.att.length:0;return `<button class="${S.mf2===k?'on':''}" data-a="mDrGo" data-t="${k}">${ic(i)}<span>${n}</span>${c?`<em>${c}</em>`:''}</button>`}).join('')}<div class="mg-drf">Only you can see this mailbox</div></nav></div>`)};
A.mDrawerX=()=>{const d=document.getElementById('mgdr');if(d)d.remove()};A.mDrGo=e=>{A.mDrawerX();S.mf2=e.dataset.t;S.mid=null;S.mq2='';render();scrollTo(0,0)};

/* full-screen compose on a phone */
const _mNewM2=A.mNew;A.mNew=e=>{_mNewM2(e);if(!isMob())return;const sh=document.querySelector('.sheet');if(!sh)return;
 const g=id=>(sh.querySelector('#'+id)||{}).value||'',dl=sh.querySelector('datalist'),sb=sh.querySelector('[data-a="mSend"]'),d=sb&&sb.dataset.d||'',ttl=(sh.querySelector('h2')||{}).textContent||'New email';
 const to=g('mc-to'),cc=g('mc-cc'),su=g('mc-s'),bo=g('mc-b');closeM();document.getElementById('mcmp')&&document.getElementById('mcmp').remove();
 document.body.insertAdjacentHTML('beforeend',`<div id="mcmp" class="mg-cmp"><div class="mg-cbar"><button data-a="mCmpX" aria-label="Close">${ic('back')}</button><b>${h(ttl)}</b><span class="sp"></span><label aria-label="Attach">${ic('clip')}<input id="mc-att" type="file" multiple class="sr" data-ch="mcAtt"></label><button class="snd" data-a="mSend" ${d?`data-d="${d}"`:''} aria-label="Send">${ic('send')}</button><button data-a="mDraft" ${d?`data-d="${d}"`:''} aria-label="Save draft">${ic('doc')}</button></div>
 <div class="mg-f"><span>From</span><div>${h(MADDR(S.me))}</div></div>
 <div class="mg-f"><span>To</span><input id="mc-to" list="mc-list" value="${h(to)}" autocomplete="off"><button class="mg-ccb" data-a="mCcT">Cc</button></div>${dl?dl.outerHTML:''}
 <div class="mg-f" id="mg-ccrow" ${cc?'':'hidden'}><span>Cc</span><input id="mc-cc" list="mc-list" value="${h(cc)}"></div>
 <div class="mg-f"><input id="mc-s" value="${h(su)}" placeholder="Subject"></div>
 <div id="mc-attl" class="mattl" style="padding:0 16px"></div>
 <textarea id="mc-b" placeholder="Compose email">${h(bo)}</textarea></div>`);
 setTimeout(()=>{const x=document.getElementById(to?'mc-b':'mc-to');if(x)x.focus()},50)};
A.mCmpX=()=>{const c=document.getElementById('mcmp');if(c)c.remove()};A.mCcT=()=>{const r=document.getElementById('mg-ccrow');if(r)r.hidden=!r.hidden};
['mSend','mDraft'].forEach(k=>{const f=A[k];A[k]=e=>{const ok=document.getElementById('mcmp');f(e);if(ok&&!document.querySelector('.toast.err'))A.mCmpX()}});

/* chat typing bar on a phone: [+] · message · send/mic — the rest sits behind + */
const _vChatM2=V.chat;V.chat=()=>{const o=_vChatM2();if(!isMob()||S.v!=='chat'||!/class="compose wa"/.test(o))return o;
 return o.replace('<div class="compose wa">','<div class="compose wa"><button class="cb mplus" data-a="mPlus" aria-label="More: photo, file, poll, emoji, voice typing">'+ic('plus')+'</button>').replace(/placeholder="Message · type @ to mention"/,'placeholder="Message"')};
A.mPlus=()=>sheet(`<div class="mplusg">${[['📷','Photo or file','mPlusFile'],['📊','Poll','pollNew'],['😊','Emoji','mPlusEmo'],['🎤','Voice typing','mPlusVt'],['🌐','Typing language','mPlusLang'],['✨','Catch up','chatCatch']].map(([i,l,a])=>`<button data-a="${a}"><i>${i}</i><span>${l}</span></button>`).join('')}</div><p class="xs mut" style="text-align:center;margin-top:10px">Tip: type @ to mention someone</p>`);
A.mPlusFile=()=>{closeM();const i=document.querySelector('.compose input[type=file]');if(i)i.click()};
A.mPlusEmo=()=>{closeM();setTimeout(()=>A.emoT&&A.emoT({dataset:{}}),60)};
A.mPlusVt=()=>{closeM();const b=document.querySelector('.compose .vtb');if(b)b.click()};
A.mPlusLang=()=>{closeM();const b=document.querySelector('.compose .vtl');if(b){b.click();toast('Typing language: '+b.textContent)}};

document.head.insertAdjacentHTML('beforeend',`<style>
.mg-cmp,.mg-dr{display:none}
@media(max-width:820px){
 /* top switch slimmer */
 html.mob #main[data-v="chat"] .mctop{margin:0 0 10px}html.mob #main[data-v="chat"] .mctop h1{font-size:22px}
 /* search */
 .mg-search{display:flex;align-items:center;gap:8px;background:#EDF1F7;border-radius:28px;padding:4px 6px 4px 8px;margin:0 0 10px;transition:box-shadow .15s}
 .mg-search:focus-within{background:#fff;box-shadow:0 2px 10px rgba(16,24,40,.12)}
 .mg-search>button{border:0;background:none;width:40px;height:40px;border-radius:50%;display:grid;place-items:center;color:#344054;font-size:22px}.mg-search>button svg{width:22px;height:22px}
 .mg-search input{flex:1;border:0;background:none;font:inherit;font-size:16px;min-height:40px;padding:0;outline:none}.mg-search .av{width:32px!important;height:32px!important;font-size:12px!important;margin-right:4px}
 .mg-qinfo{font-size:12.5px;color:var(--mut);margin:-2px 4px 10px}
 .mmchips button b{font-size:11px;background:var(--navy);color:#fff;border-radius:999px;padding:0 6px;margin-left:2px}
 /* list: flat like Gmail */
 .mg-list{margin:0 -16px;background:#fff;border-top:1px solid #F0F2F5}
 .mg-row{display:flex;gap:12px;padding:12px 10px 12px 16px;border-bottom:1px solid #F2F4F7;align-items:flex-start;cursor:pointer}.mg-row:active{background:#EEF3FF}
 .mg-row>.av{width:40px!important;height:40px!important;font-size:15px!important;flex:none}
 .mg-tx{flex:1;min-width:0}.mg-1{display:flex;align-items:baseline;gap:6px}.mg-1 b{flex:1;font-size:15px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#3C4043}.mg-1 em{font-style:normal;color:#D93025;font-size:12px}.mg-1 span{font-size:12px;color:#5F6368;flex:none}
 .mg-2{font-size:14px;color:#3C4043;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px}.mg-3{font-size:13.5px;color:#5F6368;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px}
 .mg-row.un .mg-1 b,.mg-row.un .mg-2{font-weight:800;color:#202124}.mg-row.un .mg-1 span{font-weight:800;color:#202124}
 .mg-row mark{background:#FDE68A;color:inherit;border-radius:3px;padding:0 1px}
 .mg-st{border:0;background:none;color:#80868B;width:36px;height:36px;display:grid;place-items:center;flex:none;margin-top:6px}.mg-st svg{width:20px;height:20px}.mg-st.on{color:#F4B400}.mg-st.on svg{fill:#F4B400}
 /* drawer */
 .mg-dr{display:block;position:fixed;inset:0;z-index:90;background:rgba(16,24,40,.45);animation:mgfade .15s}
 .mg-dr nav{position:absolute;left:0;top:0;bottom:0;width:min(82vw,320px);background:#fff;border-radius:0 20px 20px 0;padding:calc(18px + env(safe-area-inset-top)) 10px 20px;overflow-y:auto;animation:mgslide .2s ease-out}
 .mg-drh{padding:4px 14px 16px;border-bottom:1px solid #F0F2F5;margin-bottom:8px}.mg-drh b{display:block;font-size:20px;color:#D93025}.mg-drh small{color:var(--mut)}
 .mg-dr button{display:flex;align-items:center;gap:16px;width:100%;border:0;background:none;padding:13px 14px;border-radius:0 24px 24px 0;font:inherit;font-size:15px;font-weight:600;color:#3C4043;text-align:left}
 .mg-dr button svg{width:20px;height:20px}.mg-dr button span{flex:1}.mg-dr button em{font-style:normal;font-size:12.5px;font-weight:700}
 .mg-dr button.on{background:#D3E3FD;color:#041E49}.mg-drf{font-size:12px;color:var(--mut);padding:16px 14px}
 @keyframes mgslide{from{transform:translateX(-100%)}to{transform:none}}@keyframes mgfade{from{opacity:0}}
 /* reader: full screen */
 .mg-read{position:fixed;inset:0;z-index:55;background:#fff;overflow-y:auto;padding:0 16px calc(84px + env(safe-area-inset-bottom))}
 .mg-rbar{position:sticky;top:0;z-index:3;display:flex;align-items:center;background:#fff;padding:calc(6px + env(safe-area-inset-top)) 0 6px;margin:0 -8px}
 .mg-rbar button{border:0;background:none;width:44px;height:44px;border-radius:50%;display:grid;place-items:center;color:#3C4043}.mg-rbar button svg{width:22px;height:22px}
 .mg-sub{display:flex;gap:8px;align-items:flex-start;margin:4px 0 14px}.mg-sub h1{flex:1;font-size:21px;font-weight:500;line-height:1.3;margin:0}.mg-sub h1 span{display:inline-block;vertical-align:middle;font-size:11.5px;font-weight:500;background:#E8EAED;color:#3C4043;border-radius:4px;padding:1px 6px}
 .mg-star{border:0;background:none;width:40px;height:40px;color:#80868B;flex:none}.mg-star svg{width:22px;height:22px}.mg-star.on{color:#F4B400}.mg-star.on svg{fill:#F4B400}
 .mg-from{display:flex;gap:12px;align-items:flex-start;margin:0 0 16px}.mg-from .av{width:40px!important;height:40px!important;flex:none}.mg-from>div{flex:1;min-width:0}.mg-from b{font-size:15px}.mg-from small{color:#5F6368;font-size:12px;margin-left:4px}
 .mg-to{display:block;border:0;background:none;padding:0;font:inherit;font-size:13px;color:#5F6368;text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
 .mg-hd{margin-top:6px;font-size:12.5px;color:#3C4043;background:#F8F9FA;border-radius:10px;padding:8px 10px;line-height:1.6;word-break:break-all}
 .mg-rp{border:0;background:none;width:40px;height:40px;border-radius:50%;color:#3C4043;display:grid;place-items:center;flex:none}.mg-rp svg{width:20px;height:20px}
 .mg-act{position:fixed;left:0;right:0;bottom:0;z-index:56;display:flex;gap:10px;padding:10px 16px calc(10px + env(safe-area-inset-bottom));background:#fff;border-top:1px solid #F0F2F5}
 .mg-act button{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;border:1px solid #DADCE0;background:#fff;border-radius:999px;padding:11px;font:inherit;font-weight:600;font-size:14px;color:#3C4043}.mg-act svg{width:18px;height:18px}
 html.mob.mmailread .bnav{display:none!important}
 /* compose: full screen */
 .mg-cmp{display:flex;flex-direction:column;position:fixed;inset:0;z-index:95;background:#fff;padding-top:env(safe-area-inset-top)}
 .mg-cbar{display:flex;align-items:center;gap:2px;padding:6px 6px;border-bottom:1px solid #F0F2F5}.mg-cbar b{font-size:16px;margin-left:4px}
 .mg-cbar>button,.mg-cbar>label{border:0;background:none;width:44px;height:44px;border-radius:50%;display:grid;place-items:center;color:#3C4043;cursor:pointer}.mg-cbar svg{width:22px;height:22px}.mg-cbar .snd{color:#0B57D0}
 .mg-f{display:flex;align-items:center;gap:12px;padding:0 16px;border-bottom:1px solid #F0F2F5;min-height:54px}.mg-f>span{color:#5F6368;font-size:15px;width:44px}.mg-f>div{font-size:15px;color:#202124}
 .mg-f input{flex:1;border:0;outline:none;font:inherit;font-size:16px;min-height:52px;padding:0;background:none}
 .mg-f[hidden]{display:none!important}.mg-f input::-webkit-calendar-picker-indicator{display:none!important;opacity:0}
 .mmatt span u{text-decoration:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
 .mg-ccb{border:0;background:none;color:#5F6368;font:inherit;font-size:14px}
 .mg-cmp textarea{flex:1;border:0;outline:none;resize:none;padding:14px 16px;font:inherit;font-size:16px;line-height:1.5}
 /* chat typing bar */
 html.mob .compose.wa .cb[data-a="emoT"],html.mob .compose.wa .cb[data-a="pollNew"],html.mob .compose.wa label.cb,html.mob .compose.wa .vtw{display:none!important}
 html.mob .compose.wa{display:flex;align-items:flex-end;gap:8px}
 html.mob .compose.wa .mplus{display:grid;place-items:center;width:42px;height:42px;border-radius:50%;background:#F2F4F7;color:#344054;flex:none}.compose.wa .mplus svg{width:22px;height:22px}
 html.mob .compose.wa .vtbox{flex:1;min-width:0}html.mob .compose.wa textarea{width:100%;min-height:42px;max-height:120px;border-radius:22px;padding:10px 16px!important;font-size:16px;background:#F2F4F7;border:0;line-height:1.35}
 html.mob .compose.wa .snd{width:44px;height:44px;flex:none}
 .mplusg{display:grid;grid-template-columns:repeat(3,1fr);gap:14px 8px;padding-top:6px}.mplusg button{border:0;background:none;display:flex;flex-direction:column;align-items:center;gap:8px;font:inherit;font-size:12.5px;font-weight:600;color:#344054}
 .mplusg i{font-style:normal;width:56px;height:56px;border-radius:18px;background:#F2F4F7;display:grid;place-items:center;font-size:26px}
}
</style>`);

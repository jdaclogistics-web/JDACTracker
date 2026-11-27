/* ===================== CRM in the navigation panel =====================
   CRM is its own menu item with every company under it (same screens as before: board, inbox, calls).
   Communication keeps only the personal tools: Email and Team chat. */
const _chHeadNV=chatHead;chatHead=function(){const o=_chHeadNV.apply(this,arguments);if(S.v!=='crm'&&S.v!=='chat')return o;
 const t=document.createElement('template');t.innerHTML=o;
 if(S.v==='crm')t.content.querySelectorAll('.c5nav,.cmh2-r').forEach(x=>x.remove());
 else t.content.querySelectorAll('.c5nav [data-t="crm"],.cmh2-r [data-t="crm"]').forEach(x=>x.remove());
 return t.innerHTML};
const _vChatNV=V.chat;
V.crm=()=>{S.chm='crm';const o=_vChatNV();return o};
V.chat=()=>{if(['crm','wa','call'].includes(S.chm)){S.v='crm';return V.crm()}if(!S.chm||!['team','email','meet','notes'].includes(S.chm))S.chm='team';return _vChatNV()};
const _goNV=A.go;A.go=e=>{if(e.dataset.v==='chat'&&!['team','email'].includes(S.chm))S.chm='team';_goNV(e)};
const crmCosNV=()=>(typeof cmCos==='function'?cmCos():[]).filter(k=>k!=='all');
A.crmCo=e=>{S.v='crm';S.sbcrm=true;A.cmCo(e);scrollTo(0,0)};
A.sbCrm=e=>{S.sbcrm=!(e.getAttribute&&e.getAttribute('aria-expanded')==='true');render()};
const _allowedNV=allowed;allowed=function(v){if(v==='crm')return _allowedNV('chat')&&crmCosNV().length>0;return _allowedNV(v)};
const _tabsNV=tabsFor;tabsFor=function(who){const T=_tabsNV(who);if(T.some(x=>x[0]==='chat')&&!T.some(x=>x[0]==='crm')&&(!who||who===S.me?allowed('crm'):true)){const i=T.findIndex(x=>x[0]==='chat');T.splice(i,0,['crm','CRM','users'])}return T};
const _renderNV=render;render=function(){_renderNV.apply(this,arguments);try{document.body.classList.toggle('cmmode',S.v==='chat'||S.v==='crm');
 const nav=document.querySelector('.sb-nav');if(!nav)return;if(!allowed('crm'))return;const old=nav.querySelector('[data-v="crm"]');if(old)old.remove();
 const sub=nav.querySelector('.sb-sub');if(sub&&!sub.children.length)sub.remove();
 const L=crmCosNV(),open=S.sbcrm==null?S.v==='crm':S.sbcrm,co=S.cmco;
 const html=`<button class="sb-more ${open?'op':''} ${S.v==='crm'&&!open?'on':''}" data-a="sbCrm" aria-expanded="${open}" title="CRM">${ic('users')}<span>CRM</span><i class="chev">${ic('right')}</i></button>${open?`<div class="sb-sub">${L.map(k=>{const f=cmInfo(k);return `<button data-a="crmCo" data-k="${k}" class="${S.v==='crm'&&co===k?'on':''}" title="${h(f[1])} CRM"><span class="cdot" style="background:${f[4]};width:10px;height:10px;border-radius:50%;display:inline-block;flex:none"></span><span>${h(f[3]==='HR'?'HR Consultancy':f[3])}</span></button>`}).join('')}</div>`:''}`;
 const ch=nav.querySelector(':scope>[data-v="chat"]');if(ch)ch.insertAdjacentHTML('beforebegin',html);else nav.insertAdjacentHTML('afterbegin',html)}catch(x){}};

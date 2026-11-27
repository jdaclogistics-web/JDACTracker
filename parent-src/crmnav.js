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
const _allowedNV=allowed;allowed=function(v){if(v==='crm')return _allowedNV('chat')&&crmCosNV().length>0;return _allowedNV(v)};
const _tabsNV=tabsFor;tabsFor=function(who){const T=_tabsNV(who);if(T.some(x=>x[0]==='chat')&&!T.some(x=>x[0]==='crm')&&(!who||who===S.me?allowed('crm'):true)){const i=T.findIndex(x=>x[0]==='chat');T.splice(i,0,['crm','CRM','users'])}return T};
const _renderNV=render;render=function(){_renderNV.apply(this,arguments);try{document.body.classList.toggle('cmmode',S.v==='chat'||(S.v==='crm'&&!!S.crmIn));
 const nav=document.querySelector('.sb-nav');if(!nav||!allowed('crm'))return;const old=nav.querySelector('[data-v="crm"]');if(old)old.remove();
 const sub=nav.querySelector('.sb-sub');if(sub&&!sub.children.length)sub.remove();
 const html=`<button data-a="go" data-v="crm" class="${S.v==='crm'?'on':''}" ${S.v==='crm'?'aria-current="page"':''} title="CRM">${ic('users')}<span>CRM</span></button>`;
 const ch=nav.querySelector(':scope>[data-v="chat"]');if(ch)ch.insertAdjacentHTML('beforebegin',html);else nav.insertAdjacentHTML('afterbegin',html)}catch(x){}};
/* CRM page: first the list of companies, then the chosen company's CRM */

const _vCrmNV=V.crm;V.crm=()=>{const L=crmCosNV();/* opens straight on the CRM board; switch company from the picker at the top */if(!S.crmIn||!L.includes(S.crmIn))S.crmIn=L.includes(S.cmco)?S.cmco:L[0];
 if(!S.crmIn){const cnt=k=>D.wa.filter(c=>cmTeams(k).includes(c.team)),num=k=>{const v=cmNum(k);return v.wa||v.vn||'Number to be added'},segs=k=>(typeof cmSegs==='function'&&cmSegs(k))||[];
  return page('CRM','Pick a company to open its customers, WhatsApp and calls')+`<div class="crmgrid">${L.map(k=>{const f=cmInfo(k),C=cnt(k),un=C.filter(c=>c.unread).length;return `<button class="crmco" data-a="crmCo" data-k="${k}" style="--cc:${f[4]}"><span class="crmav">${h(f[3].slice(0,2).toUpperCase())}</span><span class="crmtx"><b>${h(f[1])}</b><small>${h(num(k))}</small>${segs(k).length?`<small class="crmseg">${segs(k).map(x=>h(x[1])).join(' · ')}</small>`:''}</span><span class="crmn"><b>${C.length}</b><small>customers</small>${un?`<em>${un} unread</em>`:''}</span></button>`}).join('')}</div>`}
 if(S.cmco!==S.crmIn){S.cmco=S.crmIn}
 return _vCrmNV()};
A.crmCo=e=>{S.v='crm';S.crmIn=e.dataset.k;A.cmCo(e);scrollTo(0,0)};
A.crmBack=()=>{S.crmIn=null;render()};
const _cmCoNV=A.cmCo;A.cmCo=e=>{if(S.v==='crm'&&e.dataset.k&&e.dataset.k!=='all')S.crmIn=e.dataset.k;_cmCoNV(e)};
document.head.insertAdjacentHTML('beforeend',`<style>
.crmgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}
.crmco{display:flex;align-items:center;gap:14px;background:#fff;border:1px solid var(--line);border-left:5px solid var(--cc);border-radius:16px;padding:16px;text-align:left;cursor:pointer;font:inherit}.crmco:hover{box-shadow:0 8px 22px rgba(0,0,0,.08)}
.crmav{width:46px;height:46px;border-radius:14px;background:var(--cc);color:#fff;display:grid;place-items:center;font-weight:800;flex:none}
.crmtx{flex:1;min-width:0}.crmtx b{display:block;font-size:16px}.crmtx small{display:block;font-size:12.5px;color:var(--mut)}.crmtx .crmseg{color:var(--cc);font-weight:600;margin-top:2px}
.crmn{text-align:right}.crmn b{display:block;font-size:22px}.crmn small{font-size:11.5px;color:var(--mut)}.crmn em{display:block;font-style:normal;font-size:11.5px;font-weight:700;color:#fff;background:var(--g,#1F9D55);border-radius:999px;padding:1px 8px;margin-top:4px}
.crmback{display:inline-flex;align-items:center;gap:6px;border:0;background:none;color:var(--navy);font-weight:600;font-size:14px;font-family:inherit;cursor:pointer;margin:0 0 8px;padding:4px 0}.crmback svg{width:16px;height:16px}
</style>`);

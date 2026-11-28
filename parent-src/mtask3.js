/* ===================== Scoreboard (phone) · Meet moved to Communication ===================== */
/* ---- scoreboard ---- */
function mScore(){const p=S.sbp||'month',adm=['darshan','nameera'].includes(S.me);let R=sbRows(p);if(!adm)R=R.filter(r=>r.k===S.me);
 const col=s=>s==null?'#98A2B3':s>=80?'#1F9D55':s>=60?'#2563C9':s>=40?'#C2410C':'#D92D20';
 const ring=(s,z)=>`<span class="scr" style="--p:${s||0};--c:${col(s)};width:${z}px;height:${z}px"><b>${s==null?'—':s}</b></span>`;
 const per=`<div class="mstc">${[['week','This week'],['month','This month'],['all','All time']].map(([k,l])=>`<button class="${p===k?'on':''}" data-a="sbP" data-t="${k}" style="--c:#24408E">${l}</button>`).join('')}</div>`;
 const stat=r=>`<div class="scst"><span><b>${r.done}</b>done</span><span><b>${r.onTime}</b>on time</span><span class="${r.late?'bad':''}"><b>${r.late}</b>late</span><span><b>${r.open}</b>open</span></div>`;
 if(!R.length)return per+'<div class="mempty"><b>No tasks in this period</b></div>';
 if(!adm){const r=R[0];return per+`<div class="scme">${ring(r.s,120)}<b>Your score</b><small>${r.n} task${r.n===1?'':'s'} in this period</small>${stat(r)}<p class="xs mut">Score = 70% tasks done by their due date + 30% tasks finished</p></div>`}
 const top=R.slice(0,3),pod=[top[1],top[0],top[2]].filter(Boolean),avg=Math.round(R.filter(r=>r.s!=null).reduce((a,r)=>a+r.s,0)/Math.max(1,R.filter(r=>r.s!=null).length));
 return per+`<div class="scteam"><div><b>${avg}</b><span>team average</span></div><div><b>${R.reduce((a,r)=>a+r.done,0)}</b><span>tasks done</span></div><div class="${R.reduce((a,r)=>a+r.late,0)?'bad':''}"><b>${R.reduce((a,r)=>a+r.late,0)}</b><span>running late</span></div></div>
 <div class="scpod">${pod.map(r=>{const i=R.indexOf(r);return `<div class="scp p${i+1}"><span class="scmd">${['🥇','🥈','🥉'][i]}</span>${av(nm(r.k))}<b>${h(nmF(r.k))}</b>${ring(r.s,54)}<div class="scbar"></div></div>`}).join('')}</div>
 <div class="msec">Everyone · ranked</div><div class="scl">${R.map((r,i)=>`<div class="scrw"><span class="scn">${i+1}</span>${av(nm(r.k))}<div class="sctx"><b>${h(nmF(r.k))}</b><small>${h((P[r.k]||{}).r||'')}</small><div class="scb"><i style="width:${r.s||0}%;background:${col(r.s)}"></i></div>${stat(r)}</div>${ring(r.s,46)}</div>`).join('')}</div>
 <p class="xs mut" style="margin-top:8px">Score = 70% tasks done by their due date + 30% tasks finished</p>`}
const _vTasksSc=V.tasks;V.tasks=()=>{if(isMob()&&S.ttab==='score')return mtTabs()+mScore();return _vTasksSc()};
/* ---- Meet lives in Communication, not in Tasks ---- */
const _tHeadMT=taskHead;taskHead=function(me){return _tHeadMT(me).replace(/<button[^>]*data-t="meet"[\s\S]*?<\/button>/,'')};
if(S.ttab==='meet')S.ttab='proj';
const _vTasksMt=V.tasks;V.tasks=()=>{if(S.ttab==='meet'){S.v='chat';S.chm='meet';return V.chat()}return _vTasksMt()};
/* web: Meet button in the Communication switch */
const _chHeadMT=chatHead;chatHead=function(){const o=_chHeadMT.apply(this,arguments);if(S.v!=='chat'||/data-t="meet"/.test(o))return o;
 return o.replace(/(<nav class="c5nav"[^>]*>)([\s\S]*?)(<\/nav>)/,(m,a,b,c)=>{const B={},rest=b.replace(/<button[^>]*data-t="(\w+)"[\s\S]*?<\/button>/g,(x,k)=>{B[k]=x;return ''});
  B.meet=`<button class="c5n ${S.chm==='meet'||S.chm==='notes'?'on':''}" data-a="chm" data-t="meet">${ic('video')}<span>Meet</span></button>`;
  return a+['team','email','meet'].map(k=>B[k]||'').join('')+Object.keys(B).filter(k=>!['team','email','meet'].includes(k)).map(k=>B[k]).join('')+rest+c})};
/* Communication always opens on Chats, for every login */
const _goChat=A.go;A.go=e=>{if(e&&e.dataset&&e.dataset.v==='chat'&&S.v!=='chat'){S.chm='team';S.mid=null}_goChat(e)};
S.chm='team';
/* phone: Meet · Chats · Mail */
mTabs=()=>{const un=(D.groups||[]).reduce((a,g)=>a+unreadG(g),0),mu=mUnread(S.me),cur=S.chm==='email'?'email':['meet','notes'].includes(S.chm)?'meet':'team';
 return `<div class="mctop3">${[['team','Chats','chat',un],['email','Mail','mail',mu],['meet','Meet','video',0]].map(([k,l,i,n])=>`<button class="${cur===k?'on':''}" data-a="mcTab" data-t="${k}">${ic(i)}<span>${l}</span>${n?`<em>${n}</em>`:''}</button>`).join('')}</div>`};
function mMeetHome(){const M=(D.meet||[]).slice().sort((a,b)=>String(b.dt||'').localeCompare(String(a.dt||'')));
 const card=m=>{const acts=(m.acts||[]).length,tk=(m.acts||[]).filter(a=>a.k).length;return `<button class="mmh" data-a="gmOpenN" data-id="${m.id}"><div class="mmh1"><i>${ic('video')}</i><div><b>${h(m.t)}</b><small>${h(m.when||'')}${m.dt?' · '+fmt(m.dt):''}${(m.with||[]).length?' · '+m.with.length+' people':''}</small></div></div>${m.notes?`<p>${h(String(m.notes).slice(0,140))}${String(m.notes).length>140?'…':''}</p>`:'<p class="mut">No notes yet · tap to take notes</p>'}${acts?`<div class="mmh2"><span>✓ ${acts} action item${acts===1?'':'s'}</span>${tk?`<span class="ok">${tk} added as tasks</span>`:acts?'<span class="todo">tap to turn into tasks</span>':''}</div>`:''}</button>`};
 return mMeet().replace('<div class="msec">Meetings','<div class="msec" hidden>Meetings').replace(/<div class="mtl">[\s\S]*$/,'')+`<div class="msec">History · notes & action items</div><div class="mtl">${M.map(card).join('')||'<div class="mempty"><b>No meetings yet</b></div>'}</div>`}
const _vChatMT=V.chat;V.chat=()=>{if(!isMob()||S.v!=='chat')return _vChatMT();
 if(S.chm==='meet')return mTabs()+mMeetHome();
 if(S.chm==='notes'){if(!S.gmN)return mTabs()+mMeetHome();return `<button class="crmback" data-a="mcTab" data-t="meet">${ic('back')}All meetings</button>`+noteView()}
 const o0=_vChatMT(),o=isAdm()&&S.chm!=='email'?o0.replace('<div class="mmchips">','<div class="mmchips"><button data-a="grpNew">＋ New group</button>'):o0;return o.replace(/<div class="mctop">[\s\S]*?<\/div><\/div>(<button class="mnewg"[^>]*>[\s\S]*?<\/button>)?<\/div>/,m=>mTabs())};
document.head.insertAdjacentHTML('beforeend',`<style>
.scr{position:relative;display:grid;place-items:center;border-radius:50%;background:conic-gradient(var(--c) calc(var(--p)*1%),#EAECF0 0);flex:none}.scr:before{content:'';position:absolute;inset:5px;border-radius:50%;background:#fff}.scr b{position:relative;font-size:14px;color:var(--c)}
.scme{background:#fff;border-radius:20px;padding:22px 16px;display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center}.scme .scr b{font-size:30px}.scme>b{font-size:18px;margin-top:6px}
.scteam{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:0 0 12px}.scteam div{background:#fff;border-radius:14px;padding:10px;text-align:center}.scteam b{display:block;font-size:22px;color:var(--navy)}.scteam span{font-size:11px;font-weight:700;color:var(--mut)}.scteam .bad b{color:#D92D20}
.scpod{display:flex;align-items:flex-end;justify-content:center;gap:8px;margin:6px 0 14px}.scp{flex:1;max-width:120px;display:flex;flex-direction:column;align-items:center;gap:5px;position:relative}
.scp .av{width:48px!important;height:48px!important;font-size:16px!important;box-shadow:0 0 0 3px #fff,0 4px 12px rgba(16,24,40,.15)}.scp.p1 .av{width:60px!important;height:60px!important}.scp>b{font-size:13.5px}.scmd{font-size:22px}
.scbar{width:100%;border-radius:12px 12px 0 0;background:linear-gradient(180deg,#E0E7FF,#F5F7FF)}.scp.p1 .scbar{height:70px;background:linear-gradient(180deg,#FDE68A,#FFFBEB)}.scp.p2 .scbar{height:46px}.scp.p3 .scbar{height:32px;background:linear-gradient(180deg,#FED7AA,#FFF7ED)}
.scl{display:flex;flex-direction:column;gap:8px}.scrw{display:flex;align-items:center;gap:10px;background:#fff;border-radius:14px;padding:10px 12px}.scn{width:20px;font-weight:800;color:var(--mut);text-align:center}.scrw>.av{width:36px!important;height:36px!important;flex:none}
.sctx{flex:1;min-width:0}.sctx b{font-size:14px}.sctx small{display:block;font-size:11.5px;color:var(--mut)}.scb{height:5px;background:#F2F4F7;border-radius:9px;margin:5px 0;overflow:hidden}.scb i{display:block;height:100%;border-radius:9px}
.scst{display:flex;gap:10px;font-size:11px;color:var(--mut)}.scst b{color:#101828;margin-right:3px;font-size:12.5px}.scst .bad b{color:#D92D20}
.mctop3{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;background:#E9ECF2;border-radius:14px;padding:4px;margin:0 0 12px}
.mctop3 button{display:flex;align-items:center;justify-content:center;gap:6px;border:0;background:none;border-radius:11px;padding:10px 4px;font:inherit;font-size:14px;font-weight:700;color:#475467;cursor:pointer}.mctop3 svg{width:17px;height:17px}
.mctop3 button.on{background:#fff;color:var(--navy);box-shadow:0 1px 3px rgba(16,24,40,.14)}.mctop3 em{font-style:normal;font-size:10.5px;background:#E8590C;color:#fff;border-radius:999px;padding:0 6px}
.mmh{display:block;width:100%;text-align:left;border:0;background:#fff;border-radius:16px;padding:12px;font:inherit;cursor:pointer}.mmh1{display:flex;gap:10px;align-items:center}.mmh1 i{width:38px;height:38px;border-radius:12px;background:#E8F0FE;color:#0B57D0;display:grid;place-items:center;flex:none}.mmh1 i svg{width:18px;height:18px}
.mmh1 b{display:block;font-size:14.5px}.mmh1 small{font-size:12px;color:var(--mut)}.mmh p{margin:8px 0 0;font-size:13px;color:#344054;line-height:1.45}.mmh2{display:flex;gap:10px;margin-top:8px;font-size:12px;font-weight:700;color:#475467}.mmh2 .ok{color:#1F9D55}.mmh2 .todo{color:#C2410C}
</style>`);

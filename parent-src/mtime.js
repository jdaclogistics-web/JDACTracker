/* ===== Phone timeline v3: first filter = Today · Week · Month · Year (dropdown), then person and project.
   Today = agenda · Week = 7-day bars that fit the screen · Month = calendar with day dots · Year = 12 months with milestones ===== */
const TLR=[['day','Today','sun'],['week','This week','cal'],['month','This month','grid'],['year','This year','star']];
const tlA=()=>S.mtlA||TODAY;
const tlD=d=>new Date(d+'T12:00:00');
const tlIso=x=>{const y=x.getFullYear(),m=String(x.getMonth()+1).padStart(2,'0'),d=String(x.getDate()).padStart(2,'0');return `${y}-${m}-${d}`};
const tlWeek=a=>{const x=tlD(a),k=(x.getDay()+6)%7;return addD(a,-k)};
const tlSt=t=>t.start||t.s||t.from||mtDue(t),tlEn=t=>mtDue(t)||tlSt(t);
const tlMile=t=>(t.tags||[]).some(x=>/milestone/i.test(x))||/milestone/i.test(t.type||'')||t.g||['High','Urgent'].includes(t.pri);
function tlTasks(){const all=myTasks(),who=S.mtw||'all',pj=S.mtp||'';return all.filter(t=>(who==='all'||t.o===(who==='me'?S.me:who))&&(!pj||t.proj===pj)&&tlEn(t))}
function tlRange(){const r=S.mtlR||'day',a=tlA();if(r==='day')return [a,a];if(r==='week'){const s=tlWeek(a);return [s,addD(s,6)]}
 const x=tlD(a);if(r==='month'){const s=tlIso(new Date(x.getFullYear(),x.getMonth(),1)),e=tlIso(new Date(x.getFullYear(),x.getMonth()+1,0));return [s,e]}return [x.getFullYear()+'-01-01',x.getFullYear()+'-12-31']}
function tlLabel(){const r=S.mtlR||'day',[s,e]=tlRange(),x=tlD(s);if(r==='day')return s===TODAY?'Today':s===addD(TODAY,1)?'Tomorrow':s===addD(TODAY,-1)?'Yesterday':x.toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'});
 if(r==='week')return fmt(s)+' – '+fmt(e);if(r==='month')return x.toLocaleDateString('en-IN',{month:'long',year:'numeric'});return String(x.getFullYear())}
const tlCol=t=>MT_COL[t.st]||'#8A93A3';
const tlRow=t=>{const late=t.st!=='Done'&&mtDue(t)<TODAY;return `<button class="tlr" data-a="tOpen" data-id="${t.id}" style="--c:${tlCol(t)}"><i></i><div class="tx"><b>${tlMile(t)?'◆ ':''}${h(t.t)}</b><span>${t.o?h(nmF(t.o))+' · ':''}${h(t.st)}${late?' · <em>late</em>':''}${mtDue(t)?' · due '+fmt(mtDue(t)):''}</span></div>${t.o?av(nm(t.o)):''}</button>`};

mTimeline=function(){const r=S.mtlR||'day',[s,e]=tlRange(),T=tlTasks(),inR=t=>tlSt(t)<=e&&tlEn(t)>=s,R=T.filter(inR),cur=TLR.find(x=>x[0]===r);
 const who=S.mtw||'all',pj=S.mtp||'',pjL=(D.projects||[]).filter(p=>myTasks().some(t=>t.proj===p.id)),whoL=who==='all'?'Everyone':who==='me'?'Me':nmF(who);
 const done=R.filter(t=>t.st==='Done').length,late=R.filter(t=>t.st!=='Done'&&mtDue(t)<TODAY).length;
 const top=`<div class="tlbar"><button class="tlrange" data-a="tlPick">${({day:'Today',week:'Week',month:'Month',year:'Year'})[r]}<span>▾</span></button><div class="tlnav"><button data-a="tlN" data-n="-1" aria-label="Previous">‹</button><b>${h(tlLabel())}</b><button data-a="tlN" data-n="1" aria-label="Next">›</button></div></div>
  <div class="mfl tlf">${isAdm()?`<button class="mpill ${who!=='all'?'on':''}" data-a="mtWho">${ic('users')}${h(whoL)}${ic('down')}</button>`:''}<button class="mpill ${pj?'on':''}" data-a="mtPj">${ic('grid')}${h(pj?((pjL.find(p=>p.id===pj)||{}).n||'Project'):'All projects')}${ic('down')}</button>${tlA()!==TODAY||(r!=='day')?`<button class="mpill" data-a="tlToday">Today</button>`:''}</div>
  <div class="tlsum"><div><b>${R.length}</b><span>tasks</span></div><div class="g"><b>${done}</b><span>done</span></div><div class="${late?'r':''}"><b>${late}</b><span>late</span></div><div><b>${R.length?Math.round(done/R.length*100):0}%</b><span>complete</span></div></div>`;
 let body='';
 if(r==='day'){const od=s===TODAY?T.filter(t=>t.st!=='Done'&&mtDue(t)<TODAY):[],due=R.filter(t=>mtDue(t)===s),span=R.filter(t=>mtDue(t)!==s);
  body=(od.length?`<div class="tlh r">Overdue · ${od.length}</div>`+od.map(tlRow).join(''):'')+`<div class="tlh">Due ${s===TODAY?'today':'this day'} · ${due.length}</div>`+(due.map(tlRow).join('')||'<div class="tle">Nothing due</div>')+(span.length?`<div class="tlh">Running · ${span.length}</div>`+span.map(tlRow).join(''):'')}
 if(r==='week'){const days=Array.from({length:7},(_,i)=>addD(s,i));
  body=`<div class="tlwk"><div class="tlwh">${days.map(d=>{const x=tlD(d);return `<button class="${d===TODAY?'tdy':''}" data-a="tlDay" data-d="${d}"><span>${x.toLocaleDateString('en-IN',{weekday:'narrow'})}</span><b>${x.getDate()}</b><i>${R.filter(t=>mtDue(t)===d).length||''}</i></button>`}).join('')}</div>
   ${R.sort((a,b)=>String(tlSt(a)).localeCompare(tlSt(b))).map(t=>{const a=Math.max(0,days.indexOf(tlSt(t)<s?s:tlSt(t))),b=Math.max(a,days.indexOf(tlEn(t)>e?e:tlEn(t))),lt=t.st!=='Done'&&mtDue(t)<TODAY;
    return `<button class="tlwr" data-a="tOpen" data-id="${t.id}"><span class="tlwb ${lt?'late':''}" style="left:calc(${a}*100%/7 + 2px);width:calc(${b-a+1}*100%/7 - 4px);background:${tlCol(t)}"></span><span class="tlwt" style="padding-left:calc(${Math.min(a,4)}*100%/7 + 4px)">${tlMile(t)?'◆ ':''}${h(t.t)} <em>· ${h(t.o?nmF(t.o):'')}</em></span></button>`}).join('')||'<div class="tle">No tasks this week</div>'}</div>`}
 if(r==='month'){const x=tlD(s),pad=(x.getDay()+6)%7,n=tlD(e).getDate(),sel=S.mtlDay&&S.mtlDay>=s&&S.mtlDay<=e?S.mtlDay:(TODAY>=s&&TODAY<=e?TODAY:s);
  const cell=d=>{const L=T.filter(t=>mtDue(t)===d),lt=L.some(t=>t.st!=='Done'&&d<TODAY),mi=L.some(tlMile);return `<button class="${d===sel?'on':''} ${d===TODAY?'tdy':''}" data-a="tlDay" data-d="${d}" data-k="1"><b>${tlD(d).getDate()}</b><span>${L.slice(0,3).map(t=>`<i style="background:${tlCol(t)}"></i>`).join('')}</span>${mi?'<em>◆</em>':''}${lt?'<u></u>':''}</button>`};
  const L=T.filter(t=>mtDue(t)===sel);
  body=`<div class="tlmo"><div class="tlmh">${['M','T','W','T','F','S','S'].map(d=>`<span>${d}</span>`).join('')}</div><div class="tlmg">${'<span></span>'.repeat(pad)}${Array.from({length:n},(_,i)=>cell(addD(s,i))).join('')}</div></div><div class="tlh">${fmt(sel)} · ${L.length} task${L.length===1?'':'s'}</div>${L.map(tlRow).join('')||'<div class="tle">Nothing due this day</div>'}`}
 if(r==='year'){const y=tlD(s).getFullYear(),G=(D.goals||[]).filter(g=>String(g.by||'').startsWith(String(y)));
  body=`<div class="tlyr">${Array.from({length:12},(_,m)=>{const ms=tlIso(new Date(y,m,1)),me=tlIso(new Date(y,m+1,0)),L=T.filter(t=>mtDue(t)>=ms&&mtDue(t)<=me),dn=L.filter(t=>t.st==='Done').length,lt=L.filter(t=>t.st!=='Done'&&mtDue(t)<TODAY).length,M=L.filter(tlMile),g=G.filter(x=>x.by>=ms&&x.by<=me),cur=TODAY>=ms&&TODAY<=me;
   return `<button class="tlym ${cur?'cur':''} ${ms>TODAY?'fut':''}" data-a="tlMon" data-d="${ms}"><div class="tlym1"><b>${tlD(ms).toLocaleDateString('en-IN',{month:'short'})}</b><span>${L.length?`${dn}/${L.length} done${lt?` · <em>${lt} late</em>`:''}`:'—'}</span></div>${L.length?`<div class="tlymb"><i style="width:${dn/L.length*100}%"></i></div>`:''}${g.length||M.length?`<div class="tlymm">${g.map(x=>`<span class="tlgl">🎯 ${h(x.t)} · ${fmt(x.by)}</span>`).join('')}${M.slice(0,3).map(t=>`<span style="--c:${tlCol(t)}">◆ ${h(t.t)}</span>`).join('')}${M.length>3?`<span class="more">+${M.length-3} more</span>`:''}</div>`:''}</button>`}).join('')}</div><p class="xs mut" style="margin:8px 2px">◆ milestones = goals, high-priority and milestone-tagged tasks · tap a month to open it</p>`}
 return top+body+`<div class="mleg" style="margin-top:10px">${Object.entries(MT_COL).map(([k,c])=>`<span><i style="background:${c}"></i>${k}</span>`).join('')}</div>`};
A.tlPick=()=>sheet(`<h2>Show timeline for</h2><div class="tlpk">${TLR.map(([k,l,i])=>`<button class="${(S.mtlR||'day')===k?'on':''}" data-a="tlSet" data-t="${k}"><b>${l}</b><span>${{day:'Agenda of the day',week:'7 days side by side',month:'Calendar with tasks per day',year:'Month by month with milestones'}[k]}</span></button>`).join('')}</div>`);
A.tlSet=e=>{S.mtlR=e.dataset.t;S.mtlA=TODAY;S.mtlDay=null;closeM();render()};
A.tlN=e=>{const n=+e.dataset.n,r=S.mtlR||'day',a=tlA();if(r==='day')S.mtlA=addD(a,n);else if(r==='week')S.mtlA=addD(a,7*n);else{const x=tlD(a);S.mtlA=tlIso(r==='month'?new Date(x.getFullYear(),x.getMonth()+n,1):new Date(x.getFullYear()+n,0,1))}S.mtlDay=null;render()};
A.tlToday=()=>{S.mtlR='day';S.mtlA=TODAY;S.mtlDay=null;render()};
A.tlDay=e=>{if(e.dataset.k){S.mtlDay=e.dataset.d;render();return}S.mtlR='day';S.mtlA=e.dataset.d;render()};
A.tlMon=e=>{S.mtlR='month';S.mtlA=e.dataset.d;S.mtlDay=null;render()};
document.head.insertAdjacentHTML('beforeend',`<style>
.tlbar{display:flex;gap:8px;align-items:center;margin-bottom:8px}
.tlrange{flex:none;display:flex;align-items:center;gap:6px;border:0;background:#14213D;color:#fff;border-radius:12px;padding:10px 14px;font:700 14px Inter,sans-serif;cursor:pointer}.tlrange span{opacity:.7;font-size:11px}
.tlnav{flex:1;min-width:0;display:flex;align-items:center;background:#fff;border:1px solid var(--line);border-radius:12px;overflow:hidden}.tlnav button{border:0;background:none;width:38px;height:40px;font-size:20px;color:#344054;cursor:pointer;flex:none}.tlnav b{flex:1;text-align:center;font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tlf{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;margin-bottom:8px}.tlf::-webkit-scrollbar{display:none}.tlf .mpill{flex:none}
.tlsum{display:grid;grid-template-columns:repeat(4,1fr);background:#fff;border:1px solid var(--line);border-radius:14px;padding:8px 0;margin-bottom:10px}.tlsum div{text-align:center;border-right:1px solid var(--line)}.tlsum div:last-child{border:0}.tlsum b{display:block;font-size:17px;color:#0B3D5C}.tlsum span{font-size:10.5px;color:var(--mut)}.tlsum .g b{color:#1F9D55}.tlsum .r b{color:#D92D20}
.tlh{font:800 11px Inter,sans-serif;letter-spacing:.05em;text-transform:uppercase;color:var(--mut);margin:12px 2px 6px}.tlh.r{color:#D92D20}
.tle{background:#fff;border:1px dashed var(--line);border-radius:12px;padding:14px;text-align:center;font-size:12.5px;color:var(--mut)}
.tlr{width:100%;display:flex;align-items:center;gap:10px;background:#fff;border:1px solid var(--line);border-radius:12px;padding:9px 10px;margin-bottom:6px;text-align:left;cursor:pointer;font:inherit;color:inherit}.tlr>i{width:4px;align-self:stretch;border-radius:2px;background:var(--c);flex:none}.tlr .tx{flex:1;min-width:0;display:flex;flex-direction:column}.tlr b{font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.tlr span{font-size:11.5px;color:var(--mut)}.tlr em{color:#D92D20;font-style:normal;font-weight:700}.tlr .av{width:26px;height:26px;font-size:10px;flex:none}
.tlwk{background:#fff;border:1px solid var(--line);border-radius:14px;overflow:hidden}
.tlwh{display:grid;grid-template-columns:repeat(7,1fr);border-bottom:1px solid var(--line)}.tlwh button{border:0;background:none;padding:7px 0;display:flex;flex-direction:column;align-items:center;gap:1px;cursor:pointer;position:relative}.tlwh span{font-size:10.5px;color:var(--mut);font-weight:700}.tlwh b{font-size:15px}.tlwh i{font-style:normal;font-size:10px;color:#2563C9;font-weight:700;min-height:12px}
.tlwh button.tdy b{background:#14213D;color:#fff;border-radius:50%;width:26px;height:26px;display:grid;place-items:center}
.tlwr{position:relative;display:block;width:100%;height:46px;border:0;border-bottom:1px solid #F2F4F7;background:repeating-linear-gradient(90deg,transparent 0,transparent calc(100%/7 - 1px),#F2F4F7 calc(100%/7 - 1px),#F2F4F7 calc(100%/7));cursor:pointer;padding:0;text-align:left}
.tlwb{position:absolute;bottom:8px;height:8px;border-radius:5px}.tlwb.late{box-shadow:0 0 0 2px #D92D20}
.tlwt{position:absolute;top:6px;left:0;right:0;display:block;line-height:16px;font:600 12px Inter,sans-serif;color:#1D2939;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-right:6px}.tlwt em{color:var(--mut)}.tlwt em{font-style:normal;opacity:.85;font-weight:500}
.tlmo{background:#fff;border:1px solid var(--line);border-radius:14px;padding:8px}
.tlmh,.tlmg{display:grid;grid-template-columns:repeat(7,1fr);gap:3px}.tlmh span{text-align:center;font:700 10.5px Inter,sans-serif;color:var(--mut);padding:2px 0 4px}
.tlmg button{position:relative;border:0;background:#F7F8FA;border-radius:9px;min-height:46px;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:3px;padding:5px 0;cursor:pointer}.tlmg b{font-size:13px}.tlmg button span{display:flex;gap:2px}.tlmg button span i{width:6px;height:6px;border-radius:50%}
.tlmg button em{position:absolute;top:2px;right:4px;font-style:normal;font-size:9px;color:#7A2E8E}.tlmg button u{position:absolute;bottom:3px;left:30%;right:30%;height:2px;background:#D92D20;border-radius:1px;text-decoration:none}
.tlmg button.tdy{box-shadow:inset 0 0 0 1.5px #14213D}.tlmg button.on{background:#14213D;color:#fff}
.tlyr{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.tlym:not(:has(.tlymb)){padding:8px 10px}.tlym{display:flex;flex-direction:column;gap:6px;background:#fff;border:1px solid var(--line);border-radius:14px;padding:10px;text-align:left;cursor:pointer;min-width:0}.tlym.cur{border-color:#14213D;box-shadow:0 0 0 1px #14213D}.tlym.fut{background:#FBFCFE}
.tlym1{display:flex;align-items:baseline;justify-content:space-between;gap:4px}.tlym1 b{font-size:15px}.tlym1 span{font-size:11px;color:var(--mut)}.tlym1 em{color:#D92D20;font-style:normal;font-weight:700}
.tlymb{height:5px;border-radius:3px;background:#EEF0F4;overflow:hidden}.tlymb i{display:block;height:100%;background:#1F9D55}
.tlymm{display:flex;flex-direction:column;gap:3px}.tlymm span{font-size:11px;color:#344054;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.tlymm span[style]{color:var(--c)}.tlymm .tlgl{color:#B54708;font-weight:700}.tlymm .more{color:var(--mut)}
.tlpk{display:flex;flex-direction:column;gap:8px;margin-top:10px}.tlpk button{display:flex;flex-direction:column;align-items:flex-start;border:1.5px solid var(--line);background:#fff;border-radius:14px;padding:12px 14px;cursor:pointer;text-align:left}.tlpk b{font-size:15px}.tlpk span{font-size:12px;color:var(--mut)}.tlpk button.on{border-color:#14213D;background:#F3F5FA}
</style>`);

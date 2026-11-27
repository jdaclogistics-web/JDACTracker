/* ===== Phone: company dashboard compact (scrollable 6-month chart), IT & development as a stage pipeline + one list ===== */
const IT_COL={Brief:'#8A93A3',Design:'#7A4CC2',Build:'#2563C9',Testing:'#C2410C',Live:'#1F9D55'};
const _itViewM=itView;itView=function(){if(!isMob())return _itViewM();const L=stRows('itp').filter(stInC),cur=S.itSt||'all',late=x=>x.st!=='Live'&&x.due&&x.due<TODAY;
 const R=L.filter(x=>cur==='all'||(cur==='late'?late(x):x.st===cur)).sort((a,b)=>(IT_ST.indexOf(a.st)-IT_ST.indexOf(b.st))||String(a.due||'9').localeCompare(String(b.due||'9')));
 const bar=`<div class="itp"><div class="itph"><b>Pipeline</b><span>${L.length} projects${L.filter(late).length?` · <em>${L.filter(late).length} late</em>`:''}</span>${isStT()?`<button class="itpn" data-a="itNew" aria-label="New project">${ic('plus')}</button>`:''}</div>
  <div class="itpb">${IT_ST.map(s=>{const n=L.filter(x=>x.st===s).length;return n?`<i style="flex:${n};background:${IT_COL[s]}"></i>`:''}).join('')||'<i style="flex:1;background:#E4E7EC"></i>'}</div>
  <div class="itps">${[['all','All',L.length,'#14213D'],...IT_ST.map(s=>[s,s,L.filter(x=>x.st===s).length,IT_COL[s]]),['late','Late',L.filter(late).length,'#D92D20']].map(([k,l,n,c])=>`<button class="${cur===k?'on':''}" style="--c:${c}" data-a="itSt" data-t="${k}"><i></i>${l}<span>${n}</span></button>`).join('')}</div></div>`;
 const card=x=>{const b=stBrand(x.co),c=IT_COL[x.st]||'#8A93A3',i=IT_ST.indexOf(x.st),nx=IT_ST[i+1];return `<div class="itr" style="--c:${c}"><button class="itrm" data-a="itOpen" data-id="${x.id}"><div class="itr1"><span class="itcl" style="background:${b.c}">${h(ini(b.n))}</span><b>${h(x.t)}</b></div>
  <div class="itr2"><span>${h(b.n)}</span><span>${h(x.kind||'')}</span><span>${h(stNm(x.o))}</span></div>
  <div class="itr3">${IT_ST.map((s,j)=>`<i class="${j<=i?'on':''}"></i>`).join('')}<span>${x.due?(x.st==='Live'?'Live ':'Due ')+fmt(x.due):'No date'}${late(x)?` · <em>${-daysTo(x.due)}d late</em>`:''}</span></div></button>
  ${nx&&isStT()?`<button class="itnx" data-a="itMove" data-id="${x.id}" data-t="${nx}">→ ${nx}</button>`:`<span class="itst">${x.st}</span>`}</div>`};
 return bar+(R.map(card).join('')||'<div class="mempty"><b>No projects here</b></div>')};
A.itSt=e=>{S.itSt=e.dataset.t;render()};
A.itMove=e=>{const x=D.st.itp.find(r=>r.id===e.dataset.id);if(!x)return;x.st=e.dataset.t;save();render();toast(x.t+' → '+x.st);stPush('itp',x)};
document.head.insertAdjacentHTML('beforeend',`<style>
.itp{background:#fff;border:1px solid var(--line);border-radius:18px;padding:12px;margin-bottom:10px}
.itph{display:flex;align-items:center;gap:8px}.itph b{font-size:15px}.itph span{flex:1;font-size:12px;color:var(--mut)}.itph em{color:#D92D20;font-style:normal;font-weight:700}
.itpn{width:36px;height:36px;border-radius:11px;border:0;background:#14213D;color:#fff;display:grid;place-items:center;cursor:pointer}.itpn svg{width:18px;height:18px}
.itpb{display:flex;gap:2px;height:8px;border-radius:4px;overflow:hidden;margin:10px 0}.itpb i{display:block}
.itps{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none}.itps::-webkit-scrollbar{display:none}
.itps button{flex:none;display:flex;align-items:center;gap:5px;border:1px solid var(--line);background:#fff;border-radius:99px;padding:6px 11px;font:600 12.5px Inter,sans-serif;color:#344054;cursor:pointer}.itps i{width:7px;height:7px;border-radius:50%;background:var(--c)}.itps span{color:var(--mut)}
.itps button.on{background:var(--c);border-color:var(--c);color:#fff}.itps button.on i{background:#fff}.itps button.on span{color:rgba(255,255,255,.8)}
.itr{display:flex;align-items:stretch;background:#fff;border:1px solid var(--line);border-left:4px solid var(--c);border-radius:14px;margin-bottom:7px;overflow:hidden}
.itrm{flex:1;min-width:0;border:0;background:none;text-align:left;padding:10px 11px;cursor:pointer;font:inherit;color:inherit}
.itr1{display:flex;gap:8px;align-items:center}.itr1 b{font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.itcl{width:24px;height:24px;border-radius:7px;color:#fff;font:800 9.5px/24px Inter,sans-serif;text-align:center;flex:none}
.itr2{display:flex;gap:8px;flex-wrap:wrap;font-size:11.5px;color:var(--mut);margin-top:4px}
.itr3{display:flex;gap:3px;align-items:center;margin-top:7px}.itr3 i{width:16px;height:4px;border-radius:2px;background:#E4E7EC}.itr3 i.on{background:var(--c)}.itr3 span{margin-left:6px;font-size:11.5px;color:#475467}.itr3 em{color:#D92D20;font-style:normal;font-weight:700}
.itnx{border:0;border-left:1px solid var(--line);background:#F7F8FA;padding:0 12px;font:700 12px Inter,sans-serif;color:#24408E;cursor:pointer;white-space:nowrap}.itst{display:grid;place-items:center;padding:0 12px;font:700 12px Inter,sans-serif;color:var(--c)}
@media(max-width:820px){
 .ldsec{flex-wrap:wrap;gap:6px}.ldsec .btn{font-size:12px;padding:6px 10px;min-height:0}
 .ldkpis{display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important}
 .ldkpis .ldk{padding:10px 12px!important;min-height:0!important}.ldkpis .ldk b,.ldkpis .ldk strong{font-size:19px!important;line-height:1.2}.ldkpis .ldk span,.ldkpis .ldk small,.ldkpis .ldk div{font-size:11.5px!important}
 .ldkpis>*:last-child:nth-child(odd){grid-column:1/-1}
 .cpch{overflow-x:auto;justify-content:flex-start!important;gap:6px!important;height:180px!important;padding-bottom:4px;scrollbar-width:thin}
 .cpcm{flex:0 0 74px!important;min-width:74px}.cpcm b{font-size:10.5px!important;white-space:nowrap}.cpcm small{font-size:11px}
 .ldg2{grid-template-columns:1fr!important}
 .cprw{flex-wrap:wrap;row-gap:4px}.cprw>div:first-child{flex:1 1 60%;min-width:0}.cprw b[style*="min-width"]{min-width:0!important}
}
</style>`);
/* show the latest month first in the scrollable chart */
const _rCpch=render;render=function(){const o=_rCpch.apply(this,arguments);if(isMob())document.querySelectorAll('.cpch').forEach(c=>{c.scrollLeft=c.scrollWidth});return o};

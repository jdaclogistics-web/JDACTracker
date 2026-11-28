/* ===== Tasks: delete completed tasks → Recovery bin (next to Add task) · restore or delete forever ===== */
Object.assign(I,{rbin:'<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/><path d="M9.5 13.5l2.5-2.5 2.5 2.5M12 11v6"/>'});
D.trash=D.trash||[];
const tbCan=t=>t&&t.st==='Done'&&(isAdm()||t.by===S.me||t.o===S.me);
const tbMine=()=>(D.trash||[]).filter(x=>isAdm()||x.delBy===S.me||x.t.o===S.me||x.t.by===S.me).sort((a,b)=>String(b.at).localeCompare(a.at));
const tbBtn=t=>`<button class="tbdel" data-a="tbDel" data-id="${t.id}" title="Delete this completed task (goes to Recovery)" aria-label="Delete task">${ic('trash')}</button>`;
/* web board: dustbin on Completed cards */
const _kCardTB=kCard;kCard=function(t,c){const o=_kCardTB(t,c);if(!tbCan(t))return o;return o.replace(/<\/div>$/,tbBtn(t)+'</div>')};
/* list / phone table rows: dustbin on Completed rows; Recovery button right after Add task */
const _vTasksTB=V.tasks;V.tasks=()=>{let o=_vTasksTB();
 o=o.replace(/(<tr class="tap" data-a="tOpen" data-id="([^"]+)"[\s\S]*?)(<\/td><\/tr>)/g,(m,a,id,z)=>{const t=D.tasks.find(x=>x.id===id);return tbCan(t)?a+tbBtn(t)+z:m});
 const n=tbMine().length;
 o=o.replace(/(<button class="btn sm" data-a="tNew">[\s\S]*?Add task<\/button>)/,`$1<button class="btn sm tbrec" data-a="tbOpen" title="Deleted tasks">${ic('rbin')}Recovery${n?`<span>${n}</span>`:''}</button>`);
 return o};
A.tbDel=e=>{const t=D.tasks.find(x=>x.id===e.dataset.id);if(!tbCan(t))return;D.tasks=D.tasks.filter(x=>x!==t);D.trash.push({t,at:new Date().toISOString(),delBy:S.me});save();render();
 toast(`Moved to Recovery: ${t.t.length>34?t.t.slice(0,34)+'…':t.t}`)};
const tbWhen=s=>{const d=s.slice(0,10);return (d===TODAY?'Today':fmt(d))+' '+new Date(s).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})};
A.tbOpen=()=>{const L=tbMine();sheet(`<div class="tbh"><h2>Recovery</h2><span class="xs mut">${L.length} deleted task${L.length===1?'':'s'}</span></div>
 <p class="xs mut" style="margin:2px 0 10px">Completed tasks you delete wait here. Restore puts them back in Completed.</p>
 <div class="tbl">${L.map(x=>`<div class="tbi"><div class="tx"><b>${h(x.t.t)}</b><span>${h(projN(x.t.proj)||'')}${x.t.o?' · '+h(nmF(x.t.o)):''} · deleted ${tbWhen(x.at)} by ${h(nmF(x.delBy))}</span></div><button class="btn sm sec" data-a="tbRes" data-id="${x.t.id}">Restore</button><button class="tbx" data-a="tbKill" data-id="${x.t.id}" title="Delete forever" aria-label="Delete forever">${ic('trash')}</button></div>`).join('')||'<div class="tbe">Nothing in Recovery</div>'}</div>
 ${L.length?`<div class="tbf"><button class="btn sec" data-a="tbResAll">Restore all</button><button class="btn tbkill" data-a="tbKillAsk">${ic('trash')}Delete all permanently</button></div>`:''}`)};
const tbTake=id=>{const x=(D.trash||[]).find(y=>y.t.id===id);if(x)D.trash=D.trash.filter(y=>y!==x);return x};
A.tbRes=e=>{const x=tbTake(e.dataset.id);if(x){D.tasks.push(x.t);save();toast('Restored to Completed')}render();A.tbOpen()};
A.tbResAll=()=>{tbMine().forEach(x=>{tbTake(x.t.id);D.tasks.push(x.t)});save();closeM();render();toast('All tasks restored')};
A.tbKill=e=>{tbTake(e.dataset.id);save();render();A.tbOpen();toast('Deleted forever')};
A.tbKillAsk=()=>{const n=tbMine().length;sheet(`<h2>Delete ${n} task${n===1?'':'s'} forever?</h2><p class="mut" style="margin:6px 0 14px">They can't be recovered after this.</p><div class="tbf"><button class="btn sec" data-a="tbOpen">Cancel</button><button class="btn tbkill" data-a="tbKillAll">${ic('trash')}Yes, delete forever</button></div>`)};
A.tbKillAll=()=>{const n=tbMine().length;tbMine().forEach(x=>tbTake(x.t.id));save();closeM();render();toast(`${n} task${n===1?'':'s'} deleted forever`)};
document.head.insertAdjacentHTML('beforeend',`<style>
.kc{position:relative}
.tbdel{border:0;background:#FEF2F2;color:#DC2626;width:28px;height:28px;border-radius:8px;display:inline-grid;place-items:center;cursor:pointer;flex:none;vertical-align:middle;margin-left:6px}
.tbdel:hover{background:#DC2626;color:#fff}.tbdel svg{width:15px;height:15px}
.kc .tbdel{position:absolute;right:8px;bottom:8px;margin:0}
.tbrec{background:#fff!important;color:#B91C1C!important;border:1px solid #FECACA!important;display:inline-flex;align-items:center;gap:6px}
.tbrec svg{width:15px;height:15px}.tbrec span{background:#DC2626;color:#fff;border-radius:999px;font-size:11px;padding:0 6px;line-height:17px}
.tbh{display:flex;align-items:baseline;gap:10px}
.tbl{display:flex;flex-direction:column;gap:6px;max-height:55vh;overflow:auto}
.tbi{display:flex;align-items:center;gap:8px;border:1px solid var(--line);border-radius:12px;padding:9px 10px}
.tbi .tx{flex:1;min-width:0}.tbi b{display:block;font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.tbi span{font-size:11.5px;color:var(--mut)}
.tbx{border:0;background:#FEF2F2;color:#DC2626;width:32px;height:32px;border-radius:9px;display:grid;place-items:center;cursor:pointer;flex:none}.tbx svg{width:16px;height:16px}
.tbe{padding:24px;text-align:center;color:var(--mut)}
.tbf{display:flex;gap:8px;justify-content:flex-end;margin-top:12px;flex-wrap:wrap}
.tbkill{background:#DC2626!important;color:#fff!important;display:inline-flex;align-items:center;gap:6px}.tbkill svg{width:15px;height:15px}
</style>`);
document.head.insertAdjacentHTML('beforeend',`<style>html.mob .ktool .btn.sm{padding-left:10px!important;padding-right:10px!important;white-space:nowrap}html.mob .tbrec span{display:none}</style>`);

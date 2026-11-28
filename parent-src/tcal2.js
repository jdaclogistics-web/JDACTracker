/* ===== Tasks → Calendar: one premium navy/indigo look with light and dark effects ===== */
const _taskCal2=taskCal;taskCal=function(){return _taskCal2().replace(/<div class="tcx ([^"]*)"><div class="tcd">(\d+)<\/div>(?=<button class="tcc")/g,(m,c,d)=>`<div class="tcx ${c} has"><div class="tcd">${d}</div>`).replace(/<div class="tcal">/,'<div class="tcal tcal2">').replace(/<span class="sp"><\/span>[\s\S]*?<\/div>\s*<div class="tcal/,'<span class="sp"></span></div><div class="tcal')};
document.head.insertAdjacentHTML('beforeend',`<style>
.tcal2{gap:8px!important;background:linear-gradient(180deg,#F7F9FE,#EEF2FB);padding:10px;border-radius:18px;border:1px solid #DFE5F3;box-shadow:0 10px 30px rgba(30,58,138,.06)}
.tcal2 .tch{background:linear-gradient(135deg,#0F2A5F,#1E3A8A);color:#E6ECFA!important;font-weight:700;letter-spacing:.06em;text-transform:uppercase;font-size:11px!important;padding:9px 0!important;border-radius:10px;text-align:center}
.tcal2 .tcx{background:linear-gradient(180deg,#FFFFFF,#F8FAFF)!important;border:1px solid #E3E8F4!important;border-radius:14px!important;transition:transform .15s,box-shadow .15s;min-height:104px}
.tcal2 .tcx.out{background:transparent!important;border:0!important}
.tcal2 .tcx.past:not(.has){opacity:.6}
.tcal2 .tcx:nth-child(7n+6):not(.out),.tcal2 .tcx:nth-child(7n+7):not(.out){background:linear-gradient(180deg,#FBFCFF,#F2F5FC)!important}
.tcal2 .tcx.has{background:linear-gradient(160deg,#FFFFFF 30%,#EAF0FF)!important;border-color:#C9D5F2!important;box-shadow:0 4px 14px rgba(30,58,138,.08)}
.tcal2 .tcx:not(.out):hover{transform:translateY(-2px);box-shadow:0 10px 22px rgba(30,58,138,.14)}
.tcal2 .tcd{font-weight:700;color:#64748B}
.tcal2 .tcx.has .tcd{color:#1E3A8A}
.tcal2 .tcx.td{border:0!important;background:linear-gradient(160deg,#EEF3FF,#DCE6FF)!important;box-shadow:0 0 0 2px #1E3A8A,0 10px 24px rgba(30,58,138,.22)}
.tcal2 .tcx.td .tcd{display:inline-grid;width:fit-content;padding:0 7px;justify-self:start;align-self:start;place-items:center;min-width:26px;height:26px;border-radius:999px;background:linear-gradient(135deg,#0F2A5F,#3B5BDB);color:#fff;font-size:12.5px}
.tcal2 .tcc{position:relative;display:block;width:100%;margin-top:5px;border:0!important;border-radius:9px!important;padding:6px 8px 6px 18px!important;text-align:left;font:600 11.5px Inter,sans-serif;color:#fff!important;background:linear-gradient(135deg,#1E3A8A,#3B5BDB 60%,#6D83F2)!important;box-shadow:0 3px 8px rgba(30,58,138,.25),inset 0 1px 0 rgba(255,255,255,.25);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer;transition:filter .15s,transform .15s}
.tcal2 .tcc::before{content:'';position:absolute;left:7px;top:50%;width:6px;height:6px;margin-top:-3px;border-radius:50%;background:#fff;opacity:.9}
.tcal2 .tcc:hover{filter:brightness(1.12);transform:translateX(1px)}
.tcal2 .tcx.past .tcc{background:linear-gradient(135deg,#5B74C9,#8FA3E6)!important}
html.mob .tcal2{gap:4px!important;padding:6px}html.mob .tcal2 .tcx{min-height:64px;border-radius:10px!important}html.mob .tcal2 .tcc{padding:4px 4px 4px 13px!important;font-size:10px;border-radius:7px!important}html.mob .tcal2 .tcc::before{left:4px;width:5px;height:5px}
</style>`);
/* Company dashboards: Money KPIs (revenue, collected, to collect, purchase, profit) first, then the business panel, then the money details */
for(const k of cpCos())CP[k+':dash']=()=>{const f=cpFinance(k),ops=(CP_OPS[k]||(()=>''))(),i=f.indexOf('<div class="ldg2">');return `<div class="cpdash">${i<0?f+ops:f.slice(0,i)+ops+f.slice(i)}</div>`};

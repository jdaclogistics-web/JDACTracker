/* ===================== Tasks page header: three clearly different rows =====================
   Row 1  SECTIONS  · Projects / Forms / Calendar / Timeline / Meetings  → page tabs with icons + orange underline
   Row 2  TEAMS     · All projects / Bahiram / OPS / … (project = team)  → coloured soft pills with a "Teams" label
   Row 3  TOOLBAR   · List|Kanban · Person · + Project · + Add task      → one grey control strip              */
Object.assign(I,{
 t_proj:'<rect x="3" y="4" width="7" height="16" rx="2"/><rect x="14" y="4" width="7" height="10" rx="2"/>',
 t_form:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>',
 t_cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
 t_time:'<path d="M4 6h10M8 12h12M4 18h8"/>',
 t_meet:'<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3"/>',
 t_list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
 t_kan:'<rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="10" y="4" width="5" height="10" rx="1.5"/><rect x="17" y="4" width="4" height="13" rx="1.5"/>',
 t_info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'
});
const TPAL=['#2F6BE0','#E8772E','#7A2E8E','#1F9D55','#0B6E8A','#C0392B','#B8860B','#3D5AFE','#00897B','#AD1457'];
const projCol=id=>{if(id==='all')return '#24408E';const i=(D.projects||[]).findIndex(p=>p.id===id);return TPAL[(i<0?0:i)%TPAL.length]};

taskHead=function(me){const T=[['proj','Projects','t_proj'],['forms','Forms','t_form'],['cal','Calendar','t_cal'],['time','Timeline','t_time'],...(isAdm()||['mohin','omadsul','himanshu'].includes(S.me)?[['meet','Meetings','t_meet']]:[])];
 return `<div class="tcrumb"><span class="mut">Tasks</span> / <b>${{proj:'Projects',forms:'Forms',cal:'Calendar',time:'Timeline',meet:'Meetings'}[S.ttab]}</b><span class="sp"></span><span class="tpill">${new Date().toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',year:'numeric'})}</span><span class="tpill">${av(me.n)}<span><b>${h(nmF(S.me))}</b><small>${h(me.r||'')}</small></span></span></div><h1 class="ttl">Tasks</h1>
 <nav class="tsec" aria-label="Task sections">${T.map(([k,n,i])=>`<button class="${S.ttab===k?'on':''}" data-a="ttab" data-t="${k}" ${S.ttab===k?'aria-current="page"':''}>${ic(i)}<span>${n}</span></button>`).join('')}</nav>`};

projBar=function(){const PR=myProjects(),T=myTasks();S.kp=S.kp||'all';
 return `<div class="tteam"><div class="tlbl">${ic('users')}Teams</div><div class="kchips">${[['all','All projects'],...PR.map(p=>[p.id,p.n])].map(([id,n])=>`<button class="kchip ${S.kp===id?'on':''}" style="--pc:${projCol(id)}" data-a="kp" data-t="${id}" ${id!=='all'?`data-pid="${id}"`:''}><i></i>${h(n)} <span>${T.filter(t=>(id==='all'||t.proj===id)&&t.st!=='Done').length}</span></button>`).join('')}</div></div>`};

/* Projects tab: swap the old chip row for the Teams row, and turn the tool row into the grey toolbar */
const _kbUI=kanban;kanban=function(){let o=_kbUI();
 o=o.replace(/<div class="kchips">[\s\S]*?<\/div>/,projBar());
 o=o.replace('<div class="ktool">','<div class="ktool tbar"><span class="tlbl2">View</span>')
  .replace('☰ List',ic('t_list')+'List').replace('▦ Kanban',ic('t_kan')+'Kanban')
  .replace(/<span class="xs mut hide-m" style="flex:1">([\s\S]*?)<\/span>/,(m,t)=>`<span class="tsp"></span><span class="thint hide-m" tabindex="0" title="${t.replace(/"/g,'&quot;')}">${ic('t_info')}How to use</span>`);
 return o};

document.head.insertAdjacentHTML('beforeend',`<style>
/* Row 1 · sections: page tabs, underline, icons */
.tsec{display:flex;gap:4px;border-bottom:2px solid var(--line);margin:4px 0 18px;overflow-x:auto;scrollbar-width:none}
.tsec button{flex:none;display:inline-flex;align-items:center;gap:8px;border:0;background:none;padding:12px 18px 13px;margin-bottom:-2px;border-bottom:3px solid transparent;font-weight:700;font-size:15px;color:var(--mut);cursor:pointer;border-radius:10px 10px 0 0}
.tsec button .ico{width:18px;height:18px}
.tsec button:hover{color:var(--ink);background:#F4F6FA}
.tsec button.on{color:#24408E;border-bottom-color:#F28C28;background:none}
/* Row 2 · teams: labelled soft pills with colour dots */
.tteam{display:flex;align-items:center;gap:12px;background:#fff;border:1px solid var(--line);border-radius:16px;padding:8px 10px 8px 14px;margin-bottom:12px}
.tlbl{flex:none;display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--mut);padding-right:12px;border-right:1px solid var(--line)}
.tlbl .ico{width:16px;height:16px}
.tteam .kchips{padding:2px 0;flex:1;min-width:0}
.tteam .kchip{background:#F7F8FB;border:1px solid transparent;border-radius:999px;padding:7px 14px 7px 11px;font-size:13.5px}
.tteam .kchip i{width:9px;height:9px;border-radius:50%;background:var(--pc);flex:none}
.tteam .kchip:hover{border-color:var(--line);background:#fff}
.tteam .kchip.on{background:color-mix(in srgb,var(--pc) 12%,#fff);border-color:var(--pc);color:var(--pc)}
.tteam .kchip.on span{background:var(--pc);color:#fff}
/* Row 3 · toolbar: one grey strip, iOS-style segmented view switch */
.tbar{background:#EEF1F6;border-radius:14px;padding:8px 10px;margin:0 0 16px;gap:10px}
.tlbl2{font-size:11.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--mut);padding:0 2px 0 4px}
.tbar .vsw{background:#DDE2EB;border:0;padding:3px}
.tbar .vsw button{display:inline-flex;align-items:center;gap:6px;color:#4A5468;padding:7px 14px}
.tbar .vsw button .ico{width:16px;height:16px}
.tbar .vsw button.on{background:#fff;color:#24408E;box-shadow:0 1px 3px rgba(16,24,40,.15)}
.tbar .ksel{background:#fff;border:1px solid #D5DAE3;min-height:38px;min-width:170px}
.tsp{flex:1}
.thint{display:inline-flex;align-items:center;gap:5px;font-size:12.5px;font-weight:600;color:var(--mut);cursor:help;padding:6px 8px;border-radius:8px}
.thint .ico{width:16px;height:16px}.thint:hover,.thint:focus{background:#fff;color:var(--ink)}
.tbar .btn.sm{min-height:38px}
@media(max-width:760px){.tsec button{padding:10px 12px 11px;font-size:14px}.tteam{flex-direction:column;align-items:stretch;gap:6px;padding:8px}.tlbl{border-right:0;padding:0}.tlbl2{display:none}.tbar .thint,.tbar .tsp{display:none}.tbar .ksel{min-width:130px;flex:1}.tbar .btn.sm{flex:1;justify-content:center}}
</style>`);

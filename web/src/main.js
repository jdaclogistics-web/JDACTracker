import '@shared/theme.css'
import 'leaflet/dist/leaflet.css'
import './web.css'
import L from 'leaflet'
import { auth, login, logout, get, post, patch, photoUrl } from '@shared/api.js'
import { viewCC, viewCompany, viewDesk, viewTasks2, viewChat, viewDesks, viewDeskAdmin, viewPeople2, viewAccounts, viewCommand, viewTeam, viewHR } from './cc.js'
import { esc, istDate, fmtTime, fmtDate, duration, agoText, toast, ic, initials, avColor, downloadCsv, minsAgo } from '@shared/util.js'

const app = document.getElementById('app')
let me = null, tab = 'home', tabArg = null, tabOpts = {}, timer = null, map = null
const ROLE_TABS = {
  hr: [['home', 'Dashboard', 'grid'], ['tasks', 'Tasks', 'task'], ['chat', 'Chat', 'chat', 0, 1], ['team', 'Team', 'users'], ['logout', 'Logout', 'logout'], ['people', 'Attendance', 'cal', 1], ['live', 'Live map', 'pin', 1], ['leaves', 'Leave', 'check', 1], ['staff', 'Employees', 'users', 1], ['report', 'Month sheet', 'download', 1], ['old', 'HR records', 'grid', 1]],
  boss: [['home', 'Dashboard', 'grid'], ['tasks', 'Tasks', 'task'], ['chat', 'Chat', 'chat', 0, 1], ['team', 'Team', 'users'], ['logout', 'Logout', 'logout'], ['accounts', 'Accounts', 'wallet', 1], ['desks', 'Desks', 'grid', 1], ['live', 'Live map', 'pin', 1], ['staff', 'Staff & logins', 'lock', 1], ['report', 'Insights', 'download', 1], ['old', 'Records', 'grid', 1], ['audit', 'Audit', 'shield', 1]],
  developer: [['home', 'Dashboard', 'grid'], ['tasks', 'Tasks', 'task'], ['chat', 'Chat', 'chat', 0, 1], ['team', 'Team', 'users'], ['logout', 'Logout', 'logout'], ['accounts', 'Accounts', 'wallet', 1], ['desks', 'Desks', 'grid', 1], ['live', 'Live map', 'pin', 1], ['staff', 'Logins', 'lock', 1], ['report', 'Insights', 'download', 1], ['old', 'Records', 'grid', 1], ['system', 'System', 'grid', 1], ['audit', 'Audit', 'shield', 1]],
}
const ROLE_LABEL = { hr: 'HR panel', boss: 'Boss panel', developer: 'Developer · main access' }
const ROLE_ACCENT = { hr: '#7C3AED', boss: '#059669', developer: '#0E7490' }

window.addEventListener('jdac-logout', () => { me = null; renderLogin('Session expired — login again') })

const navStack = []
function goBack() { const p = navStack.pop(); if (p) { tab = p.tab; tabArg = p.tabArg; tabOpts = p.tabOpts } else { tab = 'home'; tabArg = null; tabOpts = {} } render(); window.scrollTo(0, 0) }
window.addEventListener('popstate', () => { if (me) goBack() })
function doLogout() { logout(); me = null; tab = 'home'; renderLogin() }
function cleanup() { clearInterval(timer); timer = null; if (map) { map.remove(); map = null } }

async function boot() {
  if (!auth.token) return renderLogin()
  me = auth.me
  try { me = (await get('/api/me')).me } catch { /* */ }
  if (!me) return renderLogin()
  if (!ROLE_TABS[me.role]) { if (window.JDAC_IN_APP) { location.replace('./index.html?staff=1'); return } logout(); return renderLogin('This login is for the employee app. Admin panel is for HR / Boss / Developer.') }
  render()
}

function renderLogin(err = '') {
  cleanup()
  app.innerHTML = `<div class="wlogin"><form class="card" id="lf">
    <div class="wbrand"><img src="./jdac-logo-color.png" alt="JDAC — The Logistics Aggregator"><div class="sub">Tracker Admin panel — HR · Boss · Developer</div></div>
    <label class="f" style="margin-top:18px">User ID (Employee ID)<input class="inp" id="lm" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="e.g. JD1001" required></label>
    <label class="f" style="margin-top:10px">Password<span class="pwrap"><input class="inp" id="lp" type="password" autocomplete="current-password" required><button type="button" class="eye" id="le" aria-label="Show password">${ic('eye', 18)}</button></span></label>
    ${err ? `<div class="err" style="margin-top:10px">${esc(err)}</div>` : ''}
    <button class="btn pri" id="lb" style="margin-top:14px">Login</button></form></div>`
  document.getElementById('le').onclick = () => {
    const p = document.getElementById('lp'), b = document.getElementById('le'), show = p.type === 'password'
    p.type = show ? 'text' : 'password'; b.innerHTML = ic(show ? 'eyeoff' : 'eye', 18)
  }
  document.getElementById('lf').onsubmit = async (e) => {
    e.preventDefault()
    const b = document.getElementById('lb'); b.disabled = true; b.textContent = 'Logging in…'
    try { me = await login(document.getElementById('lm').value.trim(), document.getElementById('lp').value.trim(), 'web'); await boot() }
    catch (er) { renderLogin(er.message) }
  }
}

function render() {
  cleanup()
  document.body.classList.add('cmdmode')
  const tabs = ROLE_TABS[me.role]
  if (!tabs.some((t) => t[0] === tab) && !((['desk', 'leaves', 'hr', 'people', 'desks'].includes(tab)) || (['company', 'deskadmin', 'biz', 'accounts'].includes(tab) && me.role !== 'hr'))) tab = 'home'
  const acc = ROLE_ACCENT[me.role]
  app.innerHTML = `
  <header class="bar"><img class="blogo" src="./jdac-logo.png" alt="JDAC">
    ${false ? ''
      : `<div class="bt"><b>JDAC SALES PVT LTD</b><span>${fmtDate(istDate(), { day: 'numeric', month: 'short', year: 'numeric' })} <i class="parent">parent</i></span></div>`}
    <button class="ibtn" id="out" aria-label="Logout">${ic('logout', 18)}</button></header>
  <div class="shell cmd"><nav class="nav side" aria-label="Panel">${tabs.map(([k, l, i, more, big]) => `<button data-tab="${k}" class="${tab === k ? 'on' : ''} ${more ? 'more' : ''} ${big ? 'big' : ''}" style="${tab === k && !big ? `color:${acc}` : ''}">${big ? `<span class="fab">${ic(i, 26, '#fff')}</span>` : ic(i, 22)}<span>${l}</span></button>`).join('')}</nav>
  <main class="main" id="view"></main></div>`
  document.getElementById('out').onclick = doLogout
  app.querySelectorAll('.nav button').forEach((b) => (b.onclick = () => { if (b.dataset.tab === 'logout') return doLogout(); navStack.length = 0; tab = b.dataset.tab; tabArg = null; tabOpts = {}; render() }))
  const v0 = document.getElementById('view')
  const go = (t, arg = null, opts = {}) => {
    navStack.push({ tab, tabArg, tabOpts }); if (navStack.length > 30) navStack.shift()
    try { history.pushState({ jdac: navStack.length }, '') } catch { /* */ }
    tab = t; tabArg = arg; tabOpts = opts || {}; render(); window.scrollTo(0, 0)
  }
  // Tools / अंदर के pages पर "← Back" — जहाँ से आए थे वहीं लौटो
  const FOOT = ['home', 'tasks', 'chat', 'team'], OWN_BACK = ['company', 'hr', 'desk', 'deskadmin']
  let v = v0
  if (!FOOT.includes(tab) && !OWN_BACK.includes(tab) && !(tab === 'desks' && (tabOpts.desk || tabOpts.create))) {
    v0.insertAdjacentHTML('afterbegin', `<div class="bk-bar"><button id="bk">← Back</button></div><div id="view2" class="stack"></div>`)
    v = document.getElementById('view2')
    document.getElementById('bk').onclick = goBack
  }
  const X = { setTimer: (t) => { timer = t }, openRoute }
  const boss = me.role !== 'hr'
  if (tab === 'home') return viewCommand(v, go, me.role)
  if (tab === 'team') return viewTeam(v, go, X, tabOpts)
  if (tab === 'hr') return viewHR(v, go, tabOpts)
  if (tab === 'company') return viewCompany(v, go, tabArg, tabOpts)
  if (tab === 'desk') return viewDesk(v, go, tabArg)
  if (tab === 'desks') return viewDesks(v, go, tabOpts)
  if (tab === 'deskadmin') return viewDeskAdmin(v, go, tabArg, tabOpts)
  if (tab === 'accounts') return viewAccounts(v, go, { ...tabOpts, X }, viewBiz)
  if (tab === 'people' && boss) return viewPeople2(v, go, X, tabOpts)
  if (tab === 'tasks') return viewTasks2(v, go, tabOpts)
  if (tab === 'chat') return viewChat(v)
  if (tab === 'attendance') return viewAttendance(v, tabOpts, X)
  if (tab === 'dailyreports') return viewDailyReports(v, tabOpts)
  if (tab === 'old' && tabArg) return viewOld(v, tabArg)
  ;({ home: viewHome, people: viewPeople, live: viewLive, leaves: viewLeaves, staff: viewStaff, report: viewReport, biz: viewBiz, old: viewOld, system: viewSystem, audit: viewAudit }[tab])(v)
}
const loading = (v) => { v.innerHTML = '<div class="skel"></div><div class="skel"></div><div class="skel"></div>' }
const fail = (v, e) => { v.innerHTML = `<div class="err">${esc(e.message)}</div>` }

// ── status helpers ──────────────────────────────────────────────────────
const ST = { off: ['Week off', 'n', '#94A3B8'], on_duty: ['On duty', 'g', '#10B981'], no_signal: ['No signal', 'o', '#F59E0B'], closed: ['Closed', 'b', '#3B82F6'], leave: ['Leave', 'p', '#8B5CF6'], marked: ['Marked', 'n', '#94A3B8'], absent: ['Not in', 'r', '#EF4444'] }
function personRow(r) {
  const [label, k] = ST[r.status]
  const sub = [r.emp.designation, r.emp.work_location, r.session ? `In ${fmtTime(r.session.start_at)}` : null].filter(Boolean).join(' · ')
  const extra = r.status === 'no_signal' && r.last_min != null ? ` ${r.last_min}m` : ''
  return `<button class="li" data-emp="${r.emp.id}"><div class="av" style="background:${avColor(r.emp.id)}1A;color:${avColor(r.emp.id)}">${esc(initials(r.emp.name))}</div>
    <div class="nm"><b>${esc(r.emp.name)}</b><span>${esc(sub)}${r.late ? ' · <b style="color:#B45309;display:inline">LATE</b>' : ''}</span></div>
    <div class="rc"><span class="pill ${k}">${label}${extra}</span>${r.session ? `<span class="km">${(r.session.total_km || 0).toFixed(1)} km</span>` : ''}</div></button>`
}

// ── Home ────────────────────────────────────────────────────────────────
async function viewHome(v) {
  loading(v)
  const load = async () => {
    try {
      const [t, lv, al, rep] = await Promise.all([get('/api/admin/today'), get('/api/admin/leaves?status=Pending'), get('/api/admin/alerts'), me.role === 'hr' ? null : get('/api/admin/report?month=' + istDate().slice(0, 7)).catch(() => null)])
      const s = t.summary
      const live = t.rows.filter((r) => (r.emp.team === 'Warehouse' || r.emp.live_track) && r.session && !r.session.end_at)
      const pct = s.total ? Math.round((s.in / s.total) * 100) : 0
      const acc = ROLE_ACCENT[me.role]
      v.innerHTML = `
      <section class="card hero" style="background:${me.role === 'hr' ? '#2E1065' : '#0B1220'}">
        <div class="hl">Attendance today · ${s.total} employees</div>
        <div class="hv">${s.in} in <span>· ${pct}%</span></div>
        <div class="tiles"><div class="tile hd"><b>${s.in - s.late}</b><span>On time</span></div><div class="tile hd"><b>${s.late}</b><span>Late</span></div><div class="tile hd"><b>${s.leave}</b><span>Leave</span></div><div class="tile hd"><b>${s.absent}</b><span>Not in</span></div></div>
      </section>
      <section class="card"><div class="row"><h2 class="h3">Teams</h2></div><div class="list" style="margin-top:4px">
        <button class="li" data-go="people"><span class="tic" style="background:#FEF3C7;color:#B45309">${ic('grid', 18)}</span><div class="nm"><b>Warehouse team</b><span>live GPS tracking</span></div><b>${s.warehouse.in} / ${s.warehouse.total} in</b></button>
        <button class="li" data-go="people"><span class="tic" style="background:#ECFDF5;color:#047857">${ic('users', 18)}</span><div class="nm"><b>Office team</b><span>check-in location</span></div><b>${s.office.in} / ${s.office.total} in</b></button></div>
        <button class="golive" data-go="live"><span class="dot" style="background:#10B981;box-shadow:0 0 0 4px #A7F3D0"></span><span>${live.length} warehouse staff live on map${s.no_signal ? ` · ${s.no_signal} no signal` : ''}</span>${ic('chev', 18)}</button></section>
      ${lv.leaves.length || al.alerts.length ? `<section class="card"><div class="row"><h2 class="h3">Waiting on you</h2><span class="sp"></span><span class="pill o">${lv.leaves.length + al.alerts.length}</span></div><div class="list" style="margin-top:4px">
        ${lv.leaves.length ? `<button class="li" data-go="leaves"><span class="dot" style="background:#7C3AED"></span><b style="width:22px">${lv.leaves.length}</b><span class="sp" style="font-size:13.5px;color:#3A4558">leave requests to approve</span>${ic('chev', 18, '#9AA4B5')}</button>` : ''}
        ${al.alerts.map((a) => a.kind === 'auto_logout'
          ? `<button class="li" data-go="live"><span class="dot" style="background:#EF4444"></span><span class="sp" style="font-size:13.5px;color:#3A4558"><b style="display:inline">${esc(a.name)}</b> — 24 hours done, auto logged out of the app (${fmtTime(a.opened_at)}). Needs to log in again</span>${ic('chev', 18, '#9AA4B5')}</button>`
          : `<button class="li" data-go="live"><span class="dot" style="background:#F59E0B"></span><span class="sp" style="font-size:13.5px;color:#3A4558"><b style="display:inline">${esc(a.name)}</b> — no GPS signal since ${fmtTime(a.detail?.replace('last GPS ', '')) || '—'}</span>${ic('chev', 18, '#9AA4B5')}</button>`).join('')}</div></section>` : ''}
      ${rep ? monthSummary(rep) : ''}
      <section class="card"><div class="row"><h2 class="h3">Late / not in</h2><span class="sp"></span><button class="link" data-go="people" style="color:${acc}">All ${ic('chev', 16)}</button></div>
        <div class="list" style="margin-top:4px">${t.rows.filter((r) => r.late || r.status === 'absent').slice(0, 8).map(personRow).join('') || '<div class="empty">Everyone is in on time 🎉</div>'}</div></section>`
      v.querySelectorAll('[data-go]').forEach((b) => (b.onclick = () => { tab = b.dataset.go; render() }))
      v.querySelectorAll('[data-emp]').forEach((b) => (b.onclick = () => openRoute(v, Number(b.dataset.emp), istDate())))
    } catch (e) { fail(v, e) }
  }
  await load()
  timer = setInterval(load, 30_000)
}

// ── Boss: इस महीने का summary ─────────────────────────────────────────────
function monthSummary(r) {
  const emps = r.employees.filter((e) => e.active && e.role !== 'boss' && e.role !== 'developer')
  const today = istDate(), month = today.slice(0, 7)
  let workDays = 0
  for (let d = 1; d <= Number(today.slice(8, 10)); d++) if (new Date(`${month}-${String(d).padStart(2, '0')}T12:00:00Z`).getUTCDay() !== 0) workDays++
  const S = new Map(); for (const s of r.sessions) S.set(`${s.emp_id}|${s.date}`, s)
  const M = new Map(); for (const x of r.marks) M.set(`${x.emp_id}|${x.date}`, x.status)
  const stats = emps.map((e) => {
    let p = 0, late = 0, lv = 0, km = 0
    const [sh, sm] = (e.shift_start || '10:00').split(':').map(Number)
    for (let d = 1; d <= Number(today.slice(8, 10)); d++) {
      const k = `${e.id}|${month}-${String(d).padStart(2, '0')}`, s = S.get(k), mk = M.get(k)
      if (s) { km += s.total_km || 0; const t = new Date(Date.parse(s.start_at) + 330 * 60000); if (t.getUTCHours() * 60 + t.getUTCMinutes() > sh * 60 + sm + 15) late++ }
      if (mk === 'Present' || (!mk && s)) p++; else if (mk === 'Half Day') p += 0.5; else if (mk === 'Leave') lv++
    }
    return { e, p, late, lv, km, pct: workDays ? Math.round((p / workDays) * 100) : 0 }
  })
  const tot = stats.reduce((a, x) => ({ p: a.p + x.p, late: a.late + x.late, lv: a.lv + x.lv, km: a.km + x.km }), { p: 0, late: 0, lv: 0, km: 0 })
  const avg = stats.length ? Math.round(stats.reduce((a, x) => a + x.pct, 0) / stats.length) : 0
  const low = [...stats].sort((a, b) => a.pct - b.pct).slice(0, 5)
  const topKm = [...stats].filter((x) => x.km > 0).sort((a, b) => b.km - a.km).slice(0, 5)
  return `<section class="card"><div class="row"><h2 class="h3">This month · ${fmtDate(month + '-01', { month: 'long', year: 'numeric' })}</h2><span class="sp"></span><button class="link" data-go="report">Sheet ${ic('chev', 16)}</button></div>
    <div class="tiles" style="margin-top:8px"><div class="tile wb"><b style="color:#047857">${avg}%</b><span>Avg attendance</span></div><div class="tile wb"><b style="color:#B45309">${tot.late}</b><span>Late days</span></div><div class="tile wb"><b style="color:#6D28D9">${tot.lv}</b><span>Leave days</span></div><div class="tile wb"><b>${Math.round(tot.km)}</b><span>Total KM</span></div></div>
    <div class="two" style="margin-top:12px;align-items:start"><div><h3 class="lbl">Lowest attendance</h3><div class="list">${low.map((x) => `<div class="li"><div class="nm"><b>${esc(x.e.name)}</b><span>${x.p} / ${workDays} days · ${x.late} late</span></div><span class="pill ${x.pct >= 90 ? 'g' : x.pct >= 70 ? 'o' : 'r'}">${x.pct}%</span></div>`).join('')}</div></div>
    <div><h3 class="lbl">Most KM (warehouse)</h3><div class="list">${topKm.map((x) => `<div class="li"><div class="nm"><b>${esc(x.e.name)}</b><span>${esc(x.e.work_location || '')}</span></div><b>${Math.round(x.km)} km</b></div>`).join('') || '<div class="empty">No KM yet</div>'}</div></div></div>
    <p class="sub">Working days so far: ${workDays} (Sundays off)</p></section>`
}

// ── Business (Boss): Sales, खर्च, Profit — Records → Vittiya (finance) से ────────
const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN')
async function viewBiz(v) {
  loading(v)
  try {
    const all = async (tbl) => { const out = []; for (let o = 0; ; o += 1000) { const r = await get(`/api/legacy/rows?tbl=${tbl}&limit=1000&offset=${o}`); out.push(...r.rows); if (out.length >= r.total) return out } }
    const [vit, bank, hrinv, ads] = await Promise.all([all('vittiya_entries'), all('bank_recon').catch(() => []), all('hr_invoices').catch(() => []), all('ad_metrics').catch(() => [])])
    const months = [...new Set(vit.map((x) => x.month).filter(Boolean))].sort()
    const sum = (sec, m) => vit.filter((x) => x.section === sec && (!m || x.month === m)).reduce((a, x) => a + Number(x.amount || 0), 0)
    const rows = months.map((m) => { const sales = sum('sales', m), direct = sum('direct', m), fixed = sum('fixed', m); return { m, sales, direct, fixed, gross: sales - direct, net: sales - direct - fixed } })
    const T = rows.reduce((a, x) => ({ sales: a.sales + x.sales, direct: a.direct + x.direct, fixed: a.fixed + x.fixed, net: a.net + x.net }), { sales: 0, direct: 0, fixed: 0, net: 0 })
    const mlabel = (m) => fmtDate(m + '-01', { month: 'short', year: '2-digit' })
    const max = Math.max(1, ...rows.map((x) => Math.max(x.sales, x.direct + x.fixed)))
    const parts = (sec) => { const by = {}; vit.filter((x) => x.section === sec).forEach((x) => (by[x.particular] = (by[x.particular] || 0) + Number(x.amount || 0))); return Object.entries(by).sort((a, b) => b[1] - a[1]) }
    const hrDue = hrinv.filter((x) => String(x.status).toLowerCase() !== 'paid').reduce((a, x) => a + Number(x.total || 0), 0)
    const adSpend = ads.reduce((a, x) => a + Number(x.spend || 0), 0), adLeads = ads.reduce((a, x) => a + Number(x.leadsReceived || 0), 0)
    v.innerHTML = `
      <section class="card hero" style="background:#052e1c"><div class="hl">Net profit · ${months.length ? mlabel(months[0]) + ' – ' + mlabel(months[months.length - 1]) : '—'}</div>
        <div class="hv">${inr(T.net)} <span>· ${T.sales ? Math.round((T.net / T.sales) * 100) : 0}% margin</span></div>
        <div class="tiles"><div class="tile hd"><b>${inr(T.sales)}</b><span>Sales</span></div><div class="tile hd"><b>${inr(T.direct)}</b><span>Direct cost</span></div><div class="tile hd"><b>${inr(T.fixed)}</b><span>Fixed cost</span></div><div class="tile hd"><b>${inr(T.sales - T.direct)}</b><span>Gross profit</span></div></div></section>
      <section class="card"><h2 class="h3">Month by month</h2>
        <div class="bars">${rows.map((x) => `<div class="bm"><div class="bb"><i class="s" style="height:${(x.sales / max) * 100}%" title="Sales ${inr(x.sales)}"></i><i class="c" style="height:${((x.direct + x.fixed) / max) * 100}%" title="Cost ${inr(x.direct + x.fixed)}"></i></div><b class="${x.net >= 0 ? 'pos' : 'neg'}">${inr(x.net)}</b><span>${mlabel(x.m)}</span></div>`).join('')}</div>
        <div class="legend"><span><i class="dot" style="background:#10B981"></i>Sales</span><span><i class="dot" style="background:#F87171"></i>Total cost</span><span>Bottom number = Net profit</span></div>
        <div class="sheet old" style="margin-top:10px"><table><thead><tr><th>Month</th><th>Sales</th><th>Direct</th><th>Gross profit</th><th>Fixed</th><th>Net profit</th><th>Margin</th></tr></thead><tbody>
        ${rows.map((x) => `<tr><td>${mlabel(x.m)}</td><td>${inr(x.sales)}</td><td>${inr(x.direct)}</td><td>${inr(x.gross)}</td><td>${inr(x.fixed)}</td><td><b class="${x.net >= 0 ? 'pos' : 'neg'}">${inr(x.net)}</b></td><td>${x.sales ? Math.round((x.net / x.sales) * 100) : 0}%</td></tr>`).join('')}</tbody></table></div></section>
      <div class="two" style="align-items:start">
        <section class="card"><h2 class="h3">Sales by business</h2><div class="list">${parts('sales').map(([k, n]) => `<div class="li"><div class="nm"><b>${esc(k)}</b><span>${T.sales ? Math.round((n / T.sales) * 100) : 0}% of sales</span></div><b>${inr(n)}</b></div>`).join('')}</div></section>
        <section class="card"><h2 class="h3">Biggest costs</h2><div class="list">${[...parts('direct'), ...parts('fixed')].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, n]) => `<div class="li"><div class="nm"><b>${esc(k)}</b></div><b>${inr(n)}</b></div>`).join('')}</div></section></div>
      <div class="tiles"><div class="tile wb"><b>${inr(hrDue)}</b><span>HR invoices unpaid</span></div><div class="tile wb"><b>${inr(adSpend)}</b><span>Ad spend</span></div><div class="tile wb"><b>${adLeads}</b><span>Ad leads</span></div><div class="tile wb"><b>${bank.length}</b><span>Bank recon months</span></div></div>
      <p class="sub">Data: Records → Vittiya (finance). To add a new month: Records → Vittiya (finance) → Add: section = sales / direct / fixed, particular, month (2026-09), amount.</p>`
  } catch (e) { fail(v, e) }
}

// ── Old data: पुराने system के modules ─────────────────────────────────
const OLD_LABEL = { tasks: 'Tasks', task_checklist: 'Task checklist', task_events: 'Task history', task_comments: 'Task comments', projects: 'Projects', project_members: 'Project members', daily_reports: 'Daily reports', day_entries: 'Day entries', notices: 'Notices', notice_reads: 'Notice replies', ad_leads: 'Ad leads', ad_campaigns: 'Ad campaigns', ad_sets: 'Ad sets', ad_metrics: 'Ad metrics', salary_records: 'Salary', expense_claims: 'Expense claims', company_expenses: 'Company expenses', invoices: 'Invoices', receivables: 'Receivables', hr_invoices: 'HR invoices', hr_invoice_lines: 'HR invoice lines', hr_companies: 'HR companies', hr_employees: 'HR employees', hr_activity_log: 'HR activity', inventory: 'Inventory', equipment_orders: 'Equipment orders', cargo_orders: 'Cargo orders', cargo_quotes: 'Cargo quotes', daily_bookings: 'Daily bookings', cse_targets: 'CSE targets', cse_call_logs: 'CSE call logs', incentive_rules: 'Incentive rules', vittiya_entries: 'Vittiya (finance)', bank_recon: 'Bank recon', social_posts: 'Social posts', chat_messages: 'Chat', desks: 'Desks', employee_desks: 'Employee desks', fmcg_products: 'FMCG products', form_defs: 'Forms', quiz_attempts: 'Quiz' }
async function viewOld(v, tbl = null, q = '', offset = 0) {
  loading(v)
  try {
    const { tables } = await get('/api/legacy/tables')
    if (!tables.length) { v.innerHTML = '<section class="card empty">Old data not imported yet</section>'; return }
    tbl = tbl || tables[0].tbl
    const r = await get(`/api/legacy/rows?tbl=${encodeURIComponent(tbl)}&q=${encodeURIComponent(q)}&offset=${offset}&limit=200`)
    const cols = [...new Set(r.rows.flatMap((x) => Object.keys(x)))].filter((c) => !['orgKey'].includes(c))
    const cell = (val) => { if (val == null) return ''; const t = typeof val === 'object' ? JSON.stringify(val) : String(val); return esc(t.length > 140 ? t.slice(0, 140) + '…' : t) }
    v.innerHTML = `
      <div class="chips" style="flex-wrap:wrap">${tables.map((t) => `<button class="chip ${t.tbl === tbl ? 'on' : ''}" data-t="${esc(t.tbl)}">${esc(OLD_LABEL[t.tbl] || t.tbl)} ${t.n}</button>`).join('')}</div>
      <div class="row wrap" style="margin-top:8px"><input class="inp" id="oq" placeholder="Search…" value="${esc(q)}" style="max-width:280px"><span class="sub" style="margin:0">${r.total} records${r.total > 200 ? ` · ${offset + 1}–${Math.min(offset + 200, r.total)}` : ''}</span><span class="sp"></span>
        ${offset > 0 ? '<button class="btn ghost sm" id="op">‹ Prev</button>' : ''}${offset + 200 < r.total ? '<button class="btn ghost sm" id="on">Next ›</button>' : ''}<button class="btn pri sm" id="oadd">${ic('plus', 16, '#fff')} Add</button><button class="btn ghost sm" id="ocsv">${ic('download', 16)} CSV</button></div>
      <section class="card sheet old"><table><thead><tr>${cols.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>
      ${r.rows.map((x, i) => `<tr class="orow" data-i="${i}">${cols.map((c) => `<td>${cell(x[c])}</td>`).join('')}</tr>`).join('')}</tbody></table></section>
      <p class="sub">Old JDAC tracker data + new records. Click any row to change it, or <b>Add</b> to add new. Every change is logged in Audit under your name.</p>
      <div id="oform"></div>`
    const SKIP = new Set(['id', '_rid', 'orgKey', 'createdAt', 'updatedAt', 'createdBy_name', 'updatedBy_name'])
    const formCols = cols.filter((c) => !SKIP.has(c) && !c.endsWith('_name'))
    const openForm = (row) => {
      const f = v.querySelector('#oform')
      f.innerHTML = `<section class="card"><div class="row"><h2 class="h3">${row ? 'Edit record' : 'New record'} · ${esc(OLD_LABEL[tbl] || tbl)}</h2><span class="sp"></span><button class="link" id="ofx">Close</button></div>
        <form class="cform" id="off">${formCols.map((c) => { const val = row?.[c]; const t = val == null ? '' : typeof val === 'object' ? JSON.stringify(val) : String(val); return `<label class="f">${esc(c)}${t.length > 60 ? `<textarea class="inp" name="${esc(c)}" rows="3">${esc(t)}</textarea>` : `<input class="inp" name="${esc(c)}" value="${esc(t)}">`}</label>` }).join('')}
        <button class="btn pri" style="grid-column:1/-1">${row ? 'Save changes' : 'Add record'}</button></form></section>`
      f.scrollIntoView({ behavior: 'smooth' })
      f.querySelector('#ofx').onclick = () => (f.innerHTML = '')
      f.querySelector('#off').onsubmit = async (ev) => {
        ev.preventDefault()
        const data = {}
        for (const [k, val] of new FormData(ev.target)) { const n = Number(val); data[k] = val === '' ? null : (val.trim() !== '' && !isNaN(n) && !/^0\d/.test(val) && typeof row?.[k] !== 'string') ? n : val }
        try {
          if (row) await patch('/api/legacy/rows', { tbl, id: row._rid, data }); else await post('/api/legacy/rows', { tbl, data })
          toast(row ? 'Saved' : 'Added'); viewOld(v, tbl, q, offset)
        } catch (er) { toast(er.message, 'bad') }
      }
    }
    v.querySelector('#oadd').onclick = () => openForm(null)
    v.querySelectorAll('.orow').forEach((tr) => (tr.onclick = () => openForm(r.rows[Number(tr.dataset.i)])))
    v.querySelectorAll('[data-t]').forEach((b) => (b.onclick = () => viewOld(v, b.dataset.t)))
    v.querySelector('#oq').onchange = (e) => viewOld(v, tbl, e.target.value)
    v.querySelector('#op')?.addEventListener('click', () => viewOld(v, tbl, q, offset - 200))
    v.querySelector('#on')?.addEventListener('click', () => viewOld(v, tbl, q, offset + 200))
    v.querySelector('#ocsv').onclick = async () => {
      const all = []; for (let o = 0; o < r.total; o += 500) all.push(...(await get(`/api/legacy/rows?tbl=${encodeURIComponent(tbl)}&q=${encodeURIComponent(q)}&offset=${o}&limit=500`)).rows)
      const cs = [...new Set(all.flatMap((x) => Object.keys(x)))]
      downloadCsv(`JDAC-old-${tbl}.csv`, [cs, ...all.map((x) => cs.map((c) => (x[c] == null ? '' : typeof x[c] === 'object' ? JSON.stringify(x[c]) : x[c])))])
    }
  } catch (e) { fail(v, e) }
}

// ── People / attendance today ───────────────────────────────────────────
async function viewPeople(v, date = istDate(), team = 'All') {
  loading(v)
  try {
    const t = await get('/api/admin/today?date=' + date)
    const rows = t.rows.filter((r) => team === 'All' || r.emp.team === team)
    const group = (tm) => rows.filter((r) => r.emp.team === tm)
    const section = (tm) => { const g = group(tm); return g.length ? `<div class="grp"><b>${tm} team · ${g.length}</b></div>${g.map(personRow).join('')}` : '' }
    v.innerHTML = `
      <div class="row wrap"><input class="inp" type="date" id="pd" value="${date}" max="${istDate()}" style="max-width:190px">
        <div class="chips">${['All', 'Warehouse', 'Office'].map((x) => `<button class="chip ${team === x ? 'on' : ''}" data-team="${x}">${x} ${x === 'All' ? t.rows.length : t.rows.filter((r) => r.emp.team === x).length}</button>`).join('')}</div></div>
      <div class="tiles"><div class="tile wb"><b style="color:#047857">${t.summary.in}</b><span>In</span></div><div class="tile wb"><b style="color:#B45309">${t.summary.late}</b><span>Late</span></div><div class="tile wb"><b style="color:#B91C1C">${t.summary.absent}</b><span>Not in</span></div><div class="tile wb"><b style="color:#6D28D9">${t.summary.leave}</b><span>Leave</span></div></div>
      <section class="card" style="padding:4px 14px"><div class="list">${section('Warehouse')}${section('Office')}</div></section>`
    v.querySelector('#pd').onchange = (e) => viewPeople(v, e.target.value, team)
    v.querySelectorAll('[data-team]').forEach((b) => (b.onclick = () => viewPeople(v, date, b.dataset.team)))
    v.querySelectorAll('[data-emp]').forEach((b) => (b.onclick = () => openRoute(v, Number(b.dataset.emp), date)))
  } catch (e) { fail(v, e) }
}

// ── Route detail ───────────────────────────────────────────────────────
async function openRoute(v, empId, date) {
  cleanup(); loading(v)
  try {
    const r = await get(`/api/admin/trail?emp=${empId}&date=${date}`)
    const s = r.session
    v.innerHTML = `
      <button class="link" id="bk">${ic('back', 16)} Back</button>
      <section class="card"><div class="row"><div class="av" style="background:${avColor(empId)};color:#fff">${esc(initials(r.emp.name))}</div><div class="nm"><b style="font-size:16px">${esc(r.emp.name)}</b><span>${esc([r.emp.designation, r.emp.work_location, fmtDate(date)].filter(Boolean).join(' · '))}</span></div></div>
        ${s ? `<div class="sf" id="sf"></div><div class="tiles" style="margin-top:12px"><div class="tile"><b>${fmtTime(s.start_at)}</b><span>In</span></div><div class="tile"><b>${fmtTime(s.end_at)}</b><span>Out${s.auto_closed ? ' (auto)' : ''}</span></div><div class="tile"><b>${duration(s.start_at, s.end_at || Date.now())}</b><span>Hours</span></div><div class="tile"><b style="color:#047857">${(s.total_km || 0).toFixed(1)}</b><span>KM</span></div></div>
        ${s.manual_km ? `<p class="sub">Employee declared ${s.manual_km} km — ${esc(s.manual_km_note || '')}</p>` : ''}` : '<p class="sub">Day not started on this date.</p>'}</section>
      ${s ? `<section class="card" style="padding:10px"><div id="rmap" class="map"></div><div class="sub" id="rinfo" style="margin-top:8px"></div></section>
      <section class="card"><h2 class="h3">HR correction</h2><form id="cf" class="cform"><label class="f">Out time<input class="inp" type="datetime-local" id="co"></label><label class="f">KM<input class="inp" type="number" step="0.1" id="ck" value="${s.manual_km || ''}"></label><label class="f" style="grid-column:1/-1">Reason (required)<input class="inp" id="cr" required minlength="3"></label><button class="btn ghost" style="grid-column:1/-1">Save correction</button></form><p class="sub">Every correction is saved in the audit log with your name.</p></section>` : ''}`
    v.querySelector('#bk').onclick = () => render()
    if (!s) return
    Promise.all([photoUrl(s.start_photo).catch(() => null), photoUrl(s.end_photo).catch(() => null)]).then(([a, b]) => {
      const el = v.querySelector('#sf'); if (!el) return
      el.innerHTML = [a && `<figure><img src="${a}" alt="Start selfie"><figcaption>IN ${fmtTime(s.start_at)}</figcaption></figure>`, b && `<figure><img src="${b}" alt="End selfie"><figcaption>OUT ${fmtTime(s.end_at)}</figcaption></figure>`].filter(Boolean).join('')
    })
    map = L.map('rmap')
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map)
    const pts = r.pings
    if (!pts.length) { map.setView([s.start_lat || 18.52, s.start_lng || 73.85], 14); v.querySelector('#rinfo').textContent = 'No GPS points'; }
    else {
      // offline में भेजे points (created_at, recorded_at से 3+ मिनट बाद) अलग रंग में
      for (let i = 1; i < pts.length; i++) {
        const late = (Date.parse(pts[i].created_at) - Date.parse(pts[i].recorded_at)) > 180000
        L.polyline([[pts[i - 1].lat, pts[i - 1].lng], [pts[i].lat, pts[i].lng]], { color: late ? '#F59E0B' : '#2563EB', weight: 4, dashArray: late ? '4 8' : null }).addTo(map)
      }
      L.circleMarker([pts[0].lat, pts[0].lng], { radius: 8, color: '#fff', weight: 3, fillColor: '#059669', fillOpacity: 1 }).addTo(map).bindPopup('Start ' + fmtTime(pts[0].recorded_at))
      const e = pts[pts.length - 1]
      L.circleMarker([e.lat, e.lng], { radius: 8, color: '#fff', weight: 3, fillColor: '#DC2626', fillOpacity: 1 }).addTo(map).bindPopup('Last ' + fmtTime(e.recorded_at))
      map.fitBounds(L.latLngBounds(pts.map((p) => [p.lat, p.lng])).pad(0.15))
      v.querySelector('#rinfo').innerHTML = `${pts.length} GPS points · ${fmtTime(pts[0].recorded_at)} – ${fmtTime(e.recorded_at)} · <span style="color:#2563EB">━ live</span> <span style="color:#F59E0B">┅ sent later (no network)</span>`
    }
    v.querySelector('#cf').onsubmit = async (ev) => {
      ev.preventDefault()
      const body = { reason: v.querySelector('#cr').value }
      const out = v.querySelector('#co').value; if (out) body.end_at = new Date(out + ':00+05:30').toISOString()
      const km = v.querySelector('#ck').value; if (km !== '' && Number(km) !== s.manual_km) body.manual_km = Number(km)
      try { await post(`/api/admin/day/${s.id}/correct`, body); toast('Correction saved'); openRoute(v, empId, date) } catch (er) { toast(er.message, 'bad') }
    }
  } catch (e) { fail(v, e) }
}

// ── Live map ────────────────────────────────────────────────────────────
async function viewLive(v) {
  v.innerHTML = `<section class="card" style="padding:10px"><div id="lmap" class="map tall"></div>
    <div class="legend"><span><i class="dot" style="background:#10B981"></i>Live</span><span><i class="dot" style="background:#F59E0B"></i>No signal 10+ min</span><span><i class="dot" style="background:#3B82F6"></i>Closed</span><span class="sub" id="upd" style="margin:0"></span></div></section>
    <section class="card" style="padding:4px 14px"><div class="list" id="ll"><div class="skel"></div></div></section>`
  map = L.map('lmap').setView([18.52, 73.85], 11)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map)
  const layer = L.layerGroup().addTo(map)
  let fitted = false
  const load = async () => {
    try {
      const t = await get('/api/admin/today')
      const rows = t.rows.filter((r) => (r.emp.team === 'Warehouse' || r.emp.live_track) && r.session && r.last)
      layer.clearLayers()
      for (const r of rows) {
        const c = ST[r.status]?.[2] || '#94A3B8'
        L.marker([r.last.lat, r.last.lng], { icon: L.divIcon({ className: '', html: `<div class="pin" style="background:${c}">${esc(initials(r.emp.name))}</div>`, iconSize: [36, 36], iconAnchor: [18, 18] }) })
          .addTo(layer).bindPopup(`<b>${esc(r.emp.name)}</b><br>${ST[r.status][0]} · ${agoText(r.last.recorded_at)}<br>${(r.session.total_km || 0).toFixed(1)} km${r.last.kind === 'field' ? '<br>Delivery mode' : ''}`)
      }
      if (rows.length && !fitted) { map.fitBounds(L.latLngBounds(rows.map((r) => [r.last.lat, r.last.lng])).pad(0.3)); fitted = true }
      const el = v.querySelector('#ll'); if (!el) return
      el.innerHTML = t.rows.filter((r) => r.emp.team === 'Warehouse' || r.emp.live_track).map(personRow).join('') || '<div class="empty">No tracked staff</div>'
      el.querySelectorAll('[data-emp]').forEach((b) => (b.onclick = () => openRoute(v, Number(b.dataset.emp), istDate())))
      v.querySelector('#upd').textContent = 'updated ' + fmtTime(new Date())
    } catch (e) { toast(e.message, 'bad') }
  }
  await load()
  timer = setInterval(load, 10_000)
}

// ── Leaves ──────────────────────────────────────────────────────────────
async function viewLeaves(v) {
  loading(v)
  try {
    const { leaves } = await get('/api/admin/leaves')
    const pend = leaves.filter((l) => l.status === 'Pending'), done = leaves.filter((l) => l.status !== 'Pending')
    const k = { Approved: 'g', Rejected: 'r', Cancelled: 'n' }
    v.innerHTML = `
      ${pend.map((l) => `<section class="card"><div class="row"><div class="av" style="background:${avColor(l.emp_id)}1A;color:${avColor(l.emp_id)}">${esc(initials(l.name))}</div><div class="nm"><b>${esc(l.name)}</b><span>${esc(l.designation || '')} · ${esc(l.kind)} · ${fmtDate(l.date)}</span></div><span class="pill o">Pending</span></div>
        <p class="reason">${esc(l.reason)}</p><div class="two"><button class="btn ghost sm" style="width:100%;color:#B91C1C" data-no="${l.id}">${ic('x', 16)} Reject</button><button class="btn pri sm" style="width:100%" data-ok="${l.id}">${ic('check', 16, '#fff')} Approve</button></div></section>`).join('') || '<section class="card empty">No pending requests</section>'}
      <h3 class="lbl" style="margin:6px 4px 0">Decided</h3>
      <section class="card" style="padding:4px 14px"><div class="list">${done.slice(0, 40).map((l) => `<div class="li"><div class="nm"><b>${esc(l.name)}</b><span>${esc(l.kind)} · ${fmtDate(l.date)} · ${esc(l.reason)}</span></div><span class="pill ${k[l.status]}">${l.status}</span></div>`).join('') || '<div class="empty">—</div>'}</div></section>`
    v.querySelectorAll('[data-ok],[data-no]').forEach((b) => (b.onclick = async () => {
      try { await post(`/api/admin/leaves/${b.dataset.ok || b.dataset.no}/decide`, { status: b.dataset.ok ? 'Approved' : 'Rejected' }); toast('Saved'); viewLeaves(v) } catch (e) { toast(e.message, 'bad') }
    }))
  } catch (e) { fail(v, e) }
}

// ── Staff / logins ─────────────────────────────────────────────────────
async function viewStaff(v) {
  loading(v)
  try {
    const { employees } = await get('/api/admin/employees')
    const roles = me.role === 'developer' ? ['employee', 'hr', 'boss', 'developer'] : me.role === 'boss' ? ['employee', 'hr', 'boss'] : ['employee', 'hr']
    v.innerHTML = `
      <details class="card" id="new"><summary class="h3">${ic('plus', 18)} Add employee &amp; create login</summary>
        <form id="nf" class="cform"><label class="f">Name<input class="inp" name="name" required></label><label class="f">Mobile (optional)<input class="inp" name="phone" inputmode="numeric"></label>
        <label class="f">Username (blank = from name)<input class="inp" name="username" autocapitalize="none" placeholder="auto"></label><label class="f">Password<input class="inp" name="password" required minlength="6" placeholder="JDAC####"></label><label class="f">Team<select class="inp" name="team"><option>Warehouse</option><option selected>Office</option></select></label>
        <label class="f">Designation<input class="inp" name="designation"></label><label class="f">Work location<input class="inp" name="work_location" placeholder="Pune Camp / Goa / Pune HO"></label>
        <label class="f">Shift in<input class="inp" type="time" name="shift_start" value="10:00"></label><label class="f">Shift out<input class="inp" type="time" name="shift_end" value="19:00"></label>
        <label class="f">Role<select class="inp" name="role">${roles.map((r) => `<option>${r}</option>`).join('')}</select></label>
        <button class="btn pri" style="grid-column:1/-1">Create login</button></form></details>
      <div class="row"><input class="inp" id="q" placeholder="Search name / designation" style="max-width:320px"><span class="sub">${employees.filter((e) => e.active).length} active</span></div>
      <section class="card" style="padding:4px 14px"><div class="list" id="sl"></div></section>`
    const paint = (q = '') => {
      v.querySelector('#sl').innerHTML = employees.filter((e) => !q || `${e.name} ${e.username} ${e.designation} ${e.phone}`.toLowerCase().includes(q)).map((e) => `
        <details class="staff ${e.active ? '' : 'off'}"><summary class="li"><div class="av" style="background:${avColor(e.id)}1A;color:${avColor(e.id)}">${esc(initials(e.name))}</div><div class="nm"><b>${esc(e.name)}${e.active ? '' : ' (inactive)'}</b><span>@${esc(e.username)} · ${esc([e.designation, e.team, e.work_location].filter(Boolean).join(' · '))}</span></div><span class="pill ${e.role === 'employee' ? 'n' : 'p'}">${e.role}</span></summary>
        <form class="cform" data-id="${e.id}">
          <label class="f">Name<input class="inp" name="name" value="${esc(e.name)}"></label><label class="f">Username<input class="inp" name="username" value="${esc(e.username)}" autocapitalize="none"></label><label class="f">Mobile<input class="inp" name="phone" value="${esc(e.phone || '')}" inputmode="numeric"></label><label class="f">Designation<input class="inp" name="designation" value="${esc(e.designation || '')}"></label>
          <label class="f">Team<select class="inp" name="team"><option ${e.team === 'Warehouse' ? 'selected' : ''}>Warehouse</option><option ${e.team === 'Office' ? 'selected' : ''}>Office</option></select></label><label class="f">Work location<input class="inp" name="work_location" value="${esc(e.work_location || '')}"></label>
          <label class="f">Shift in<input class="inp" type="time" name="shift_start" value="${esc(e.shift_start)}"></label><label class="f">Shift out<input class="inp" type="time" name="shift_end" value="${esc(e.shift_end)}"></label>
          ${e.id !== me.id ? `<label class="f">Role<select class="inp" name="role">${[...new Set([...roles, e.role])].map((r) => `<option ${e.role === r ? 'selected' : ''} ${roles.includes(r) ? '' : 'disabled'}>${r}</option>`).join('')}</select></label>
          <label class="f">New password<input class="inp" name="new_password" placeholder="leave blank to keep"></label>
          <label class="chk"><input type="checkbox" name="active" ${e.active ? 'checked' : ''}> Login active</label>
          <label class="chk"><input type="checkbox" name="live_track" ${e.live_track || e.team === 'Warehouse' ? 'checked' : ''} ${e.team === 'Warehouse' ? 'disabled' : ''}> Live GPS tracking ${e.team === 'Warehouse' ? '(warehouse: always)' : '(work from home/field)'}</label>
          <label class="chk"><input type="checkbox" name="unlink_device"> Unlink phone ${e.device_linked ? '(linked)' : ''}</label>` : ''}
          <button class="btn dark sm" style="grid-column:1/-1;width:100%">Save</button></form></details>`).join('')
      v.querySelectorAll('form[data-id]').forEach((f) => (f.onsubmit = async (ev) => {
        ev.preventDefault()
        const fd = new FormData(f), b = {}
        for (const k of ['name', 'username', 'phone', 'designation', 'team', 'work_location', 'shift_start', 'shift_end', 'role']) if (fd.has(k)) b[k] = fd.get(k)
        if (fd.get('new_password')) b.new_password = fd.get('new_password')
        if (f.querySelector('[name=active]')) b.active = !!fd.get('active')
        if (f.querySelector('[name=live_track]:not([disabled])')) b.live_track = !!fd.get('live_track')
        if (fd.get('unlink_device')) b.unlink_device = true
        try { await patch('/api/admin/employees/' + f.dataset.id, b); toast('Saved'); viewStaff(v) } catch (er) { toast(er.message, 'bad') }
      }))
    }
    paint()
    v.querySelector('#q').oninput = (e) => paint(e.target.value.toLowerCase())
    v.querySelector('#nf').onsubmit = async (ev) => {
      ev.preventDefault()
      try { const r = await post('/api/admin/employees', Object.fromEntries(new FormData(ev.target))); toast('Login created — username: ' + r.username); viewStaff(v) } catch (er) { toast(er.message, 'bad') }
    }
  } catch (e) { fail(v, e) }
}

// ── Month sheet / report ────────────────────────────────────────────────
// ── Attendance: Today · Week · Month · Live ─────────────────────────────
async function viewAttendance(v, opts = {}, X) {
  const sub = opts.sub || 'today'
  v.innerHTML = `<div class="cc-top"><b>Attendance</b><span class="sp"></span></div>
    <div class="cc-tabs">${[['today', 'Today'], ['week', 'Week'], ['month', 'Month'], ['live', 'Live tracking']].map(([k, l]) => `<button data-sub="${k}" class="${sub === k ? 'on' : ''}">${l}</button>`).join('')}</div><div id="atb" class="stack"></div>`
  v.querySelectorAll('[data-sub]').forEach((b) => (b.onclick = () => viewAttendance(v, { sub: b.dataset.sub }, X)))
  const B = v.querySelector('#atb')
  if (sub === 'today') return viewPeople2(B, null, X, { sub: 'today', bare: true })
  if (sub === 'live') return viewLive(B)
  return viewAttSheet(B, sub, opts.anchor || istDate())
}
const viewReport = (v, month) => viewAttSheet(v, 'month', month ? month + '-01' : istDate())
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const addDays = (ds, n) => new Date(Date.parse(ds + 'T12:00:00Z') + n * 864e5).toISOString().slice(0, 10)
async function viewAttSheet(v, mode = 'month', anchor = istDate()) {
  loading(v)
  try {
    let dates
    if (mode === 'week') { const dow = (new Date(anchor + 'T12:00:00Z').getUTCDay() + 6) % 7; const mon = addDays(anchor, -dow); dates = Array.from({ length: 7 }, (_, i) => addDays(mon, i)) }
    else { const [y, m] = anchor.slice(0, 7).split('-').map(Number); dates = Array.from({ length: new Date(y, m, 0).getDate() }, (_, i) => `${anchor.slice(0, 7)}-${String(i + 1).padStart(2, '0')}`) }
    const months = [...new Set(dates.map((d) => d.slice(0, 7)))]
    const reps = await Promise.all(months.map((m) => get('/api/admin/report?month=' + m)))
    const S = new Map(reps.flatMap((r) => r.sessions).map((s) => [`${s.emp_id}|${s.date}`, s]))
    const M = new Map(reps.flatMap((r) => r.marks).map((x) => [`${x.emp_id}|${x.date}`, x.status]))
    const LV = new Map(reps.flatMap((r) => r.leaves).map((x) => [`${x.emp_id}|${x.date}`, x.kind]))
    const today = istDate()
    const cell = (e, ds) => {
      const k = `${e.id}|${ds}`, mk = M.get(k)
      if (mk) return { Present: ['P', 'p'], 'Half Day': ['½', 'h'], Absent: ['A', 'a'], Leave: ['V', 'v'], 'Week Off': ['–', 'w'] }[mk]
      if (LV.has(k)) return ['V', 'v']
      const s = S.get(k)
      if (s) { const t = new Date(Date.parse(s.start_at) + 330 * 60000); const [sh, sm] = e.shift_start.split(':').map(Number); return t.getUTCHours() * 60 + t.getUTCMinutes() > sh * 60 + sm + 15 ? ['L', 'l'] : ['P', 'p'] }
      if (e.joining_date && ds < e.joining_date) return ['', 'f']
      if (e.exit_date && ds > e.exit_date) return ['', 'f']
      if (new Date(ds + 'T12:00:00Z').getUTCDay() === 0) return ['–', 'w']
      return ds > today ? ['', 'f'] : ['A', 'a']
    }
    // active staff + anyone who worked in this period (so past months still show people who later left)
    const emps = reps[0].employees.filter((e) => e.role !== 'developer' && (e.active || dates.some((d) => S.has(`${e.id}|${d}`) || M.has(`${e.id}|${d}`))))
      .sort((a, b) => String(a.emp_code || 'ZZ').localeCompare(String(b.emp_code || 'ZZ')) || a.name.localeCompare(b.name))
    const presentOn = (ds) => emps.filter((e) => ['p', 'l'].includes(cell(e, ds)[1])).length
    const title = mode === 'week' ? `${fmtDate(dates[0])} – ${fmtDate(dates[6])}` : new Date(dates[0] + 'T12:00:00Z').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    const step = (n) => (mode === 'week' ? addDays(dates[0], 7 * n) : (() => { const [y, m] = dates[0].split('-').map(Number); const d = new Date(Date.UTC(y, m - 1 + n, 1)); return d.toISOString().slice(0, 10) })())
    v.innerHTML = `<div class="at-bar"><button class="btn ghost sm" id="prv">‹ Prev</button><b style="font-size:15px">${title}</b><button class="btn ghost sm" id="nxt">Next ›</button>
        ${mode === 'week' ? `<input class="inp" type="date" id="pick" value="${dates[0]}" style="max-width:170px">` : `<input class="inp" type="month" id="pick" value="${dates[0].slice(0, 7)}" style="max-width:170px">`}
        <span class="sp"></span><button class="btn ghost sm" id="csv">${ic('download', 16)} Excel (CSV)</button></div>
      <div class="at-wrap" id="aw"><section class="card sheet"><table><thead><tr><th>Employee</th>${dates.map((d) => { const w = WD[new Date(d + 'T12:00:00Z').getUTCDay()]; return `<th class="${d === today ? 'td' : ''}">${mode === 'week' ? `${w}<br>${Number(d.slice(8))}` : `${Number(d.slice(8))}<br><small>${w[0]}</small>`}</th>` }).join('')}<th>P</th><th>A</th><th>KM</th></tr></thead><tbody>
      ${emps.map((e) => { let p = 0, a = 0, km = 0; const tds = dates.map((ds) => { const [t, c] = cell(e, ds); if (c === 'p' || c === 'l') p++; if (c === 'h') p += 0.5; if (c === 'a') a++; const s = S.get(`${e.id}|${ds}`); if (s) km += s.total_km || 0; return `<td class="${c} ed" data-e="${e.id}" data-d="${ds}" title="Click to change">${t}</td>` }).join(''); return `<tr><th><span class="tm ${e.team === 'Warehouse' ? 'w' : 'o'}">${e.team[0]}</span>${esc(e.name)}</th>${tds}<td><b>${p}</b></td><td>${a}</td><td>${Math.round(km)}</td></tr>` }).join('')}
      <tr class="tot"><th>Present</th>${dates.map((d) => `<td><b>${d > today ? '' : presentOn(d)}</b></td>`).join('')}<td></td><td></td><td></td></tr>
      </tbody></table></section></div><p class="sub" style="margin:0">P present · L late · ½ half day · V leave · A absent · – week off (Sunday) · <b>Click any box to change attendance</b></p>
      <div id="mk" class="mkpop" hidden></div>`
    const aw = v.querySelector('#aw'); aw.style.maxHeight = Math.max(260, innerHeight - aw.getBoundingClientRect().top - 110) + 'px'
    const re = (a) => viewAttSheet(v, mode, a)
    v.querySelector('#prv').onclick = () => re(step(-1)); v.querySelector('#nxt').onclick = () => re(step(1))
    v.querySelector('#pick').onchange = (e) => e.target.value && re(mode === 'week' ? e.target.value : e.target.value + '-01')
    const pop = v.querySelector('#mk')
    v.querySelectorAll('td.ed').forEach((td) => (td.onclick = () => {
      const e = emps.find((x) => x.id === Number(td.dataset.e)); const ds = td.dataset.d
      if (ds > today) return toast('Future dates cannot be changed', 'bad')
      pop.innerHTML = `<b>${esc(e.name)}</b><span class="sub" style="margin:0">${fmtDate(ds)}</span>
        <div class="mkb">${[['Present', 'p'], ['Half Day', 'h'], ['Absent', 'a'], ['Leave', 'v'], ['Week Off', 'w']].map(([st, c]) => `<button class="${c}" data-st="${st}">${st}</button>`).join('')}</div>
        <input class="inp" id="mkr" placeholder="Reason (e.g. was in office, app did not work)" value="HR update"><button class="link" id="mkx">Cancel</button>`
      const rc = td.getBoundingClientRect(); pop.style.left = Math.min(rc.left, innerWidth - 300) + 'px'; pop.style.top = (rc.bottom + 6 + scrollY) + 'px'; pop.hidden = false
      pop.querySelector('#mkx').onclick = () => (pop.hidden = true)
      pop.querySelectorAll('[data-st]').forEach((b) => (b.onclick = async () => {
        try { await post('/api/admin/marks', { emp_id: e.id, date: ds, status: b.dataset.st, reason: pop.querySelector('#mkr').value }); toast(`${e.name}: ${b.dataset.st}`); re(anchor) } catch (er) { toast(er.message, 'bad') }
      }))
    }))
    v.querySelector('#csv').onclick = () => {
      const rows = [['Date', 'Emp ID', 'Name', 'Mobile', 'Team', 'Designation', 'In', 'Out', 'Hours', 'KM', 'Status']]
      for (const e of emps) for (const ds of dates) {
        const s = S.get(`${e.id}|${ds}`); const [t] = cell(e, ds)
        rows.push([ds, e.emp_code || '', e.name, e.phone, e.team, e.designation || '', s ? fmtTime(s.start_at) : '', s ? fmtTime(s.end_at) : '', s?.end_at ? ((Date.parse(s.end_at) - Date.parse(s.start_at)) / 3600000).toFixed(2) : '', s ? (s.total_km || 0).toFixed(2) : '', t])
      }
      downloadCsv(`JDAC-attendance-${mode}-${dates[0]}.csv`, rows)
    }
  } catch (e) { fail(v, e) }
}

// ── Daily reports (clean view) ──────────────────────────────────────────
async function viewDailyReports(v, opts = {}) {
  loading(v)
  try {
    const [R, E] = await Promise.all([get('/api/legacy/rows?tbl=daily_reports&limit=1000'), get('/api/admin/employees')])
    const byId = new Map(E.employees.map((e) => [e.id, e])), byLeg = new Map(E.employees.filter((e) => e.legacy_id != null).map((e) => [String(e.legacy_id), e]))
    const who = (r) => byId.get(Number(r.emp_id)) || byLeg.get(String(r.personId)) || { id: 0, name: r.personName || r.cseName || 'Unknown' }
    const rows = R.rows.map((r) => ({ ...r, _e: who(r), _d: String(r.reportDate || r.date || r.createdAt || '').slice(0, 10) })).filter((r) => r._d).sort((a, b) => b._d.localeCompare(a._d) || String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
    const people = [...new Map(rows.map((r) => [r._e.id, r._e])).values()].sort((a, b) => a.name.localeCompare(b.name))
    const f = { from: opts.from || addDays(istDate(), -6), to: opts.to || istDate(), p: opts.p || '', q: opts.q || '' }
    const L = rows.filter((r) => r._d >= f.from && r._d <= f.to && (!f.p || String(r._e.id) === f.p) && (!f.q || JSON.stringify(r).toLowerCase().includes(f.q.toLowerCase())))
    const days = [...new Set(L.map((r) => r._d))]
    const field = (k, val) => (val && String(val).trim() ? `<div class="k">${k}</div><p>${esc(String(val))}</p>` : '')
    v.innerHTML = `<div class="cc-top"><b>Daily reports</b><span class="sp"></span></div>
      <div class="at-bar"><label class="sub" style="margin:0">From</label><input class="inp" type="date" id="df" value="${f.from}" style="max-width:160px"><label class="sub" style="margin:0">To</label><input class="inp" type="date" id="dt" value="${f.to}" style="max-width:160px">
        <select class="inp" id="dp" style="max-width:200px"><option value="">Everyone</option>${people.map((p) => `<option value="${p.id}" ${String(p.id) === f.p ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select>
        <input class="inp" id="dq" placeholder="Search…" value="${esc(f.q)}" style="max-width:200px"><span class="sp"></span><span class="sub" style="margin:0">${L.length} reports</span></div>
      <div>${days.map((d) => `<div class="dr-day">${fmtDate(d)}</div>${L.filter((r) => r._d === d).map((r) => `<div class="dr"><span class="av" style="background:${avColor(r._e.id)}">${esc(initials(r._e.name))}</span><div style="flex:1;min-width:0"><b>${esc(r._e.name)}</b> <span class="sub" style="display:inline">${esc(r._e.designation || '')}${r.createdAt ? ' · ' + esc(String(r.createdAt).slice(11, 16)) : ''}</span>
        ${field('Tasks', r.tasksDone)}${field('Work done', r.workDone)}${field('Key numbers', r.keyNumbers)}${field('Blockers', r.blockers)}</div></div>`).join('')}`).join('') || '<section class="card empty">No reports in these dates</section>'}</div>`
    const re = (o) => viewDailyReports(v, { ...f, ...o })
    v.querySelector('#df').onchange = (e) => re({ from: e.target.value }); v.querySelector('#dt').onchange = (e) => re({ to: e.target.value })
    v.querySelector('#dp').onchange = (e) => re({ p: e.target.value })
    let t; v.querySelector('#dq').oninput = (e) => { clearTimeout(t); t = setTimeout(() => re({ q: e.target.value }), 400) }
  } catch (e) { fail(v, e) }
}

// ── Developer: system ──────────────────────────────────────────────────
async function viewSystem(v) {
  loading(v)
  const load = async () => {
    try {
      const s = await get('/api/dev/system')
      const pct = s.db_bytes ? Math.round((s.db_bytes / s.db_limit_bytes) * 100) : null
      v.innerHTML = `
      <section class="card hero" style="background:#020617"><div class="row"><span class="dot" style="background:#22D3EE;box-shadow:0 0 0 5px rgba(34,211,238,.2)"></span><b>System running</b><span class="sp"></span><span class="hl" style="margin:0">checked ${fmtTime(new Date())}</span></div>
        <div class="tiles" style="margin-top:12px"><div class="tile hd"><b>${s.employees}</b><span>Employees</span></div><div class="tile hd"><b>${s.admins}</b><span>Admins</span></div><div class="tile hd"><b>${s.sessions_today}</b><span>In today</span></div><div class="tile hd"><b>${s.pings_today}</b><span>GPS today</span></div></div></section>
      <section class="card"><div class="list">
        <div class="li"><span class="dot" style="background:${pct == null || pct < 70 ? '#10B981' : '#F59E0B'}"></span><div class="nm"><b>Database (Cloudflare D1)</b><span>${s.db_bytes ? (s.db_bytes / 1048576).toFixed(1) + ' MB of 500 MB' : 'size n/a'} · ${s.pings_total} GPS points total</span></div><span class="pill ${pct == null || pct < 70 ? 'g' : 'o'}">${pct == null ? 'OK' : pct + '%'}</span></div>
        <div class="li"><span class="dot" style="background:${s.supabase ? '#10B981' : '#F59E0B'}"></span><div class="nm"><b>Photo storage (Supabase)</b><span>${s.supabase ? 'connected' : 'not connected — photos kept safely in D1 for now'} · ${s.photos_waiting} waiting</span></div><span class="pill ${s.supabase ? 'g' : 'o'}">${s.supabase ? 'OK' : 'Setup'}</span></div>
        <div class="li"><span class="dot" style="background:${s.usage.req_pct < 70 ? '#10B981' : '#F59E0B'}"></span><div class="nm"><b>Server usage today</b><span>${s.usage.requests_today.toLocaleString('en-IN')} of 1,00,000 free requests · 7 days: ${s.usage.last_14_days.slice(0, 7).map((d) => d.requests).join(' / ') || '—'}</span></div><span class="pill ${s.usage.req_pct < 70 ? 'g' : 'o'}">${s.usage.req_pct}%</span></div>
        <div class="li"><span class="dot" style="background:${s.open_alerts ? '#F59E0B' : '#10B981'}"></span><div class="nm"><b>Open alerts</b><span>no-signal / 24h auto-logout alerts</span></div><span class="pill ${s.open_alerts ? 'o' : 'g'}">${s.open_alerts}</span></div></div></section>
      <section class="card"><h2 class="h3">Tracked phones — GPS health</h2><div class="list" style="margin-top:4px">
        ${s.phones.map((p) => { const m = minsAgo(p.recorded_at); const k = m == null ? 'n' : m <= 10 ? 'g' : 'o'; return `<div class="li"><div class="nm"><b>${esc(p.name)}</b><span>${esc(p.work_location || '')} · last GPS ${p.recorded_at ? agoText(p.recorded_at) : 'never'}${p.synced_at && p.recorded_at && Date.parse(p.synced_at) - Date.parse(p.recorded_at) > 180000 ? ' · synced late (offline)' : ''}</span></div><span class="pill ${k}">${m == null ? 'No data' : m <= 10 ? 'OK' : m + ' min'}</span></div>` }).join('') || '<div class="empty">No warehouse staff</div>'}</div></section>`
    } catch (e) { fail(v, e) }
  }
  await load()
  timer = setInterval(load, 30_000)
}

// ── Audit ───────────────────────────────────────────────────────────────
async function viewAudit(v) {
  loading(v)
  try {
    const { audit } = await get('/api/dev/audit')
    v.innerHTML = `<section class="card" style="padding:4px 14px"><div class="list">${audit.map((a) => `<div class="li"><div class="nm"><b>${esc(a.action.replace(/_/g, ' '))} · ${esc(a.actor_name || 'system')}</b><span>${fmtDate(a.at.slice(0, 10))} ${fmtTime(a.at)} · ${esc(a.tbl)} #${esc(a.row_id || '')}${a.new_data ? ' · ' + esc(a.new_data).slice(0, 120) : ''}</span></div></div>`).join('') || '<div class="empty">No changes yet</div>'}</div></section>`
  } catch (e) { fail(v, e) }
}

boot()

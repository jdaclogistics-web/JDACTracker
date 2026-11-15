import '@shared/theme.css'
import 'leaflet/dist/leaflet.css'
import './web.css'
import L from 'leaflet'
import { auth, login, logout, get, post, patch, photoUrl } from '@shared/api.js'
import { esc, istDate, fmtTime, fmtDate, duration, agoText, toast, ic, initials, avColor, downloadCsv, minsAgo } from '@shared/util.js'

const app = document.getElementById('app')
let me = null, tab = 'home', timer = null, map = null
const ROLE_TABS = {
  hr: [['home', 'Home', 'home'], ['people', 'Attendance', 'cal'], ['live', 'Live map', 'pin'], ['leaves', 'Leave', 'check'], ['staff', 'Employees', 'users'], ['report', 'Month sheet', 'download']],
  boss: [['home', 'Home', 'home'], ['people', 'People', 'users'], ['live', 'Live map', 'pin'], ['leaves', 'Approvals', 'check'], ['staff', 'Staff', 'user'], ['report', 'Reports', 'download'], ['audit', 'Audit', 'shield']],
  developer: [['home', 'Home', 'home'], ['people', 'People', 'users'], ['live', 'Live map', 'pin'], ['leaves', 'Approvals', 'check'], ['staff', 'Logins', 'lock'], ['report', 'Reports', 'download'], ['system', 'System', 'grid'], ['audit', 'Audit', 'shield']],
}
const ROLE_LABEL = { hr: 'HR panel', boss: 'Boss panel', developer: 'Developer · main access' }
const ROLE_ACCENT = { hr: '#7C3AED', boss: '#059669', developer: '#0E7490' }

window.addEventListener('jdac-logout', () => { me = null; renderLogin('Session expired — login again') })

function cleanup() { clearInterval(timer); timer = null; if (map) { map.remove(); map = null } }

async function boot() {
  if (!auth.token) return renderLogin()
  me = auth.me
  try { me = (await get('/api/me')).me } catch { /* */ }
  if (!me) return renderLogin()
  if (!ROLE_TABS[me.role]) { logout(); return renderLogin('This login is for the employee app. Admin panel is for HR / Boss / Developer.') }
  render()
}

function renderLogin(err = '') {
  cleanup()
  app.innerHTML = `<div class="wlogin"><form class="card" id="lf">
    <div class="row"><div class="logo">JDAC</div><div><b style="font-size:17px">JDAC Tracker</b><div class="sub">Admin panel — HR · Boss · Developer</div></div></div>
    <label class="f" style="margin-top:18px">Username<input class="inp" id="lm" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="e.g. darshan" required></label>
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
  const tabs = ROLE_TABS[me.role]
  if (!tabs.some((t) => t[0] === tab)) tab = 'home'
  const acc = ROLE_ACCENT[me.role]
  app.innerHTML = `
  <header class="bar"><div class="av" style="background:${acc};color:#fff;border-radius:50%">${esc(initials(me.name))}</div>
    <div class="bt"><b>${esc(me.name)}</b><span>${ROLE_LABEL[me.role]} · ${fmtDate(istDate())}</span></div>
    <button class="ibtn" id="out" aria-label="Logout">${ic('logout', 18)}</button></header>
  <div class="shell"><nav class="nav side" aria-label="Panel">${tabs.map(([k, l, i]) => `<button data-tab="${k}" class="${tab === k ? 'on' : ''}" style="${tab === k ? `color:${acc}` : ''}">${ic(i, 22)}<span>${l}</span></button>`).join('')}</nav>
  <main class="main" id="view"></main></div>`
  document.getElementById('out').onclick = () => { logout(); me = null; tab = 'home'; renderLogin() }
  app.querySelectorAll('.nav button').forEach((b) => (b.onclick = () => { tab = b.dataset.tab; render() }))
  const v = document.getElementById('view')
  ;({ home: viewHome, people: viewPeople, live: viewLive, leaves: viewLeaves, staff: viewStaff, report: viewReport, system: viewSystem, audit: viewAudit }[tab])(v)
}
const loading = (v) => { v.innerHTML = '<div class="skel"></div><div class="skel"></div><div class="skel"></div>' }
const fail = (v, e) => { v.innerHTML = `<div class="err">${esc(e.message)}</div>` }

// ── status helpers ──────────────────────────────────────────────────────
const ST = { on_duty: ['On duty', 'g', '#10B981'], no_signal: ['No signal', 'o', '#F59E0B'], closed: ['Closed', 'b', '#3B82F6'], leave: ['Leave', 'p', '#8B5CF6'], marked: ['Marked', 'n', '#94A3B8'], absent: ['Not in', 'r', '#EF4444'] }
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
      const [t, lv, al] = await Promise.all([get('/api/admin/today'), get('/api/admin/leaves?status=Pending'), get('/api/admin/alerts')])
      const s = t.summary
      const live = t.rows.filter((r) => r.emp.team === 'Warehouse' && r.session && !r.session.end_at)
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
        ${al.alerts.map((a) => `<button class="li" data-go="live"><span class="dot" style="background:#F59E0B"></span><span class="sp" style="font-size:13.5px;color:#3A4558"><b style="display:inline">${esc(a.name)}</b> — no GPS signal since ${fmtTime(a.detail?.replace('last GPS ', '')) || '—'}</span>${ic('chev', 18, '#9AA4B5')}</button>`).join('')}</div></section>` : ''}
      <section class="card"><div class="row"><h2 class="h3">Late / not in</h2><span class="sp"></span><button class="link" data-go="people" style="color:${acc}">All ${ic('chev', 16)}</button></div>
        <div class="list" style="margin-top:4px">${t.rows.filter((r) => r.late || r.status === 'absent').slice(0, 8).map(personRow).join('') || '<div class="empty">Everyone is in on time 🎉</div>'}</div></section>`
      v.querySelectorAll('[data-go]').forEach((b) => (b.onclick = () => { tab = b.dataset.go; render() }))
      v.querySelectorAll('[data-emp]').forEach((b) => (b.onclick = () => openRoute(v, Number(b.dataset.emp), istDate())))
    } catch (e) { fail(v, e) }
  }
  await load()
  timer = setInterval(load, 30_000)
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
      const rows = t.rows.filter((r) => r.emp.team === 'Warehouse' && r.session && r.last)
      layer.clearLayers()
      for (const r of rows) {
        const c = ST[r.status]?.[2] || '#94A3B8'
        L.marker([r.last.lat, r.last.lng], { icon: L.divIcon({ className: '', html: `<div class="pin" style="background:${c}">${esc(initials(r.emp.name))}</div>`, iconSize: [36, 36], iconAnchor: [18, 18] }) })
          .addTo(layer).bindPopup(`<b>${esc(r.emp.name)}</b><br>${ST[r.status][0]} · ${agoText(r.last.recorded_at)}<br>${(r.session.total_km || 0).toFixed(1)} km${r.last.kind === 'field' ? '<br>Delivery mode' : ''}`)
      }
      if (rows.length && !fitted) { map.fitBounds(L.latLngBounds(rows.map((r) => [r.last.lat, r.last.lng])).pad(0.3)); fitted = true }
      const el = v.querySelector('#ll'); if (!el) return
      el.innerHTML = t.rows.filter((r) => r.emp.team === 'Warehouse').map(personRow).join('') || '<div class="empty">No warehouse staff</div>'
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
          <label class="chk"><input type="checkbox" name="unlink_device"> Unlink phone ${e.device_linked ? '(linked)' : ''}</label>` : ''}
          <button class="btn dark sm" style="grid-column:1/-1;width:100%">Save</button></form></details>`).join('')
      v.querySelectorAll('form[data-id]').forEach((f) => (f.onsubmit = async (ev) => {
        ev.preventDefault()
        const fd = new FormData(f), b = {}
        for (const k of ['name', 'username', 'phone', 'designation', 'team', 'work_location', 'shift_start', 'shift_end', 'role']) if (fd.has(k)) b[k] = fd.get(k)
        if (fd.get('new_password')) b.new_password = fd.get('new_password')
        if (f.querySelector('[name=active]')) b.active = !!fd.get('active')
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
async function viewReport(v, month = istDate().slice(0, 7)) {
  loading(v)
  try {
    const r = await get('/api/admin/report?month=' + month)
    const [y, m] = month.split('-').map(Number)
    const days = new Date(y, m, 0).getDate()
    const key = (e, d) => `${e}|${month}-${String(d).padStart(2, '0')}`
    const S = new Map(r.sessions.map((s) => [`${s.emp_id}|${s.date}`, s]))
    const M = new Map(r.marks.map((x) => [`${x.emp_id}|${x.date}`, x.status]))
    const LV = new Map(r.leaves.map((x) => [`${x.emp_id}|${x.date}`, x.kind]))
    const cell = (e, d) => {
      const k = key(e.id, d), mk = M.get(k)
      if (mk) return { Present: ['P', 'p'], 'Half Day': ['½', 'h'], Absent: ['A', 'a'], Leave: ['V', 'v'], 'Week Off': ['–', 'w'] }[mk]
      if (LV.has(k)) return ['V', 'v']
      const s = S.get(k)
      if (s) { const t = new Date(Date.parse(s.start_at) + 330 * 60000); const [sh, sm] = e.shift_start.split(':').map(Number); return t.getUTCHours() * 60 + t.getUTCMinutes() > sh * 60 + sm + 15 ? ['L', 'l'] : ['P', 'p'] }
      return `${month}-${String(d).padStart(2, '0')}` > istDate() ? ['', 'f'] : ['A', 'a']
    }
    const emps = r.employees.filter((e) => e.active)
    v.innerHTML = `<div class="row wrap"><input class="inp" type="month" id="rm" value="${month}" style="max-width:190px"><span class="sp"></span><button class="btn ghost sm" id="csv">${ic('download', 16)} Excel (CSV)</button></div>
      <section class="card sheet"><table><thead><tr><th>Employee</th>${Array.from({ length: days }, (_, i) => `<th>${i + 1}</th>`).join('')}<th>P</th><th>KM</th></tr></thead><tbody>
      ${emps.map((e) => { let p = 0, km = 0; const tds = Array.from({ length: days }, (_, i) => { const [t, c] = cell(e, i + 1); if (c === 'p' || c === 'l') p++; if (c === 'h') p += 0.5; const s = S.get(key(e.id, i + 1)); if (s) km += s.total_km || 0; return `<td class="${c}">${t}</td>` }).join(''); return `<tr><th><span class="tm ${e.team === 'Warehouse' ? 'w' : 'o'}">${e.team[0]}</span>${esc(e.name)}</th>${tds}<td><b>${p}</b></td><td>${Math.round(km)}</td></tr>` }).join('')}
      </tbody></table></section><p class="sub">P present · L late · ½ half day · V leave · A absent · – week off</p>`
    v.querySelector('#rm').onchange = (e) => viewReport(v, e.target.value)
    v.querySelector('#csv').onclick = () => {
      const rows = [['Date', 'Name', 'Mobile', 'Team', 'Designation', 'In', 'Out', 'Hours', 'KM', 'Status']]
      for (const e of emps) for (let d = 1; d <= days; d++) {
        const s = S.get(key(e.id, d)); const [t] = cell(e, d)
        rows.push([`${month}-${String(d).padStart(2, '0')}`, e.name, e.phone, e.team, e.designation || '', s ? fmtTime(s.start_at) : '', s ? fmtTime(s.end_at) : '', s?.end_at ? ((Date.parse(s.end_at) - Date.parse(s.start_at)) / 3600000).toFixed(2) : '', s ? (s.total_km || 0).toFixed(2) : '', t])
      }
      downloadCsv(`JDAC-attendance-${month}.csv`, rows)
    }
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
        <div class="li"><span class="dot" style="background:${s.open_alerts ? '#F59E0B' : '#10B981'}"></span><div class="nm"><b>Open alerts</b><span>no-signal alerts right now</span></div><span class="pill ${s.open_alerts ? 'o' : 'g'}">${s.open_alerts}</span></div></div></section>
      <section class="card"><h2 class="h3">Warehouse phones — tracking health</h2><div class="list" style="margin-top:4px">
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

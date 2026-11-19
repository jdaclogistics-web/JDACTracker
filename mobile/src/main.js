import '@shared/theme.css'
import './mobile.css'
import { auth, login, logout, get, post, ApiError } from '@shared/api.js'
import { esc, istDate, istShift, fmtTime, fmtDate, duration, agoText, toast, ic, initials, uuid } from '@shared/util.js'
import { liveUpdate, BUILD } from './liveupdate.js'
import { currentPosition, takeSelfie, deviceId, isNative, openAppSettings, askPermissionsOnce } from './native.js'
import { startTracking, stopTracking, setFieldMode, trackingState, onTracking } from './tracking.js'
import { homeBlocks, bindHome, loadMyHome, myHomeData, renderTasks, renderChat, renderDesk } from './work.js'
import { flush, queueSize, onQueueChange, lastSyncAt } from './queue.js'

const app = document.getElementById('app')
let me = null, session = null, tab = 'home', tabArg = null, tabArg2 = null, tabArg3 = null, busy = false, tick = null, pending = 0

window.addEventListener('jdac-logout', () => { stopTracking(); me = null; renderLogin('Session खत्म — दोबारा login करें') })
onQueueChange((n) => { pending = n; refreshSync() })
onTracking((s) => { if (s?.error === 'denied') toast('Location permission बंद है — Settings में Allow करें', 'bad'); refreshSync() })
window.addEventListener('online', () => flush())

// ── Boot ────────────────────────────────────────────────────────────────
async function boot() {
  if (!auth.token) return renderLogin()
  me = auth.me
  pending = await queueSize()
  render() // cached profile से तुरंत screen
  try {
    const r = await get('/api/me'); me = r.me
    const d = await get('/api/day/today'); session = d.session
    await syncTracking()
  } catch (e) { if (!(e instanceof ApiError) || e.status !== 0) { /* 401 handled */ } }
  flush()
  render()
}
async function syncTracking() {
  // सिर्फ़ Warehouse team की पूरे दिन tracking; Office = सिर्फ़ check-in location
  if (me && (me.team === 'Warehouse' || me.live_track) && session && !session.end_at) await startTracking(session.date)
  else await stopTracking()
}

// ── Login ───────────────────────────────────────────────────────────────
function renderLogin(err = '', user = '') {
  clearInterval(tick)
  app.innerHTML = `
  <div class="login"><div class="lwrap">
    <div class="lbrand"><img src="./jdac-logo.png" alt="JDAC — The Logistics Aggregator"><span>Team App</span></div>
    <div class="lcard">
      <h1>Login</h1>
      <p class="lead">Attendance, tracking और leave — एक ही app में.</p>
      <form id="lf" class="lform">
        <label class="lf">Username<span class="lin">${ic('user', 18)}<input id="lm" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="जैसे rahul" value="${esc(user)}" required></span></label>
        <label class="lf">Password<span class="lin">${ic('lock', 18)}<input id="lp" type="password" autocomplete="current-password" placeholder="JDAC####" required><button type="button" class="eye" id="le" aria-label="Show password">${ic('eye', 20)}</button></span></label>
        ${err ? `<div class="err">${esc(err)}</div>` : ''}
        <button class="btn lbtn" id="lb">Login</button>
      </form>
    </div>
    <div class="lnote">${ic('shield', 18, '#FDBA74')}<span>Password office से WhatsApp पर मिलेगा. आपकी team (warehouse / office) admin set करता है — app उसी हिसाब से खुलेगा.</span></div>
  </div>
  </div>`
  askPermissionsOnce()
  document.getElementById('le').onclick = () => {
    const p = document.getElementById('lp'), b = document.getElementById('le'), show = p.type === 'password'
    p.type = show ? 'text' : 'password'; b.innerHTML = ic(show ? 'eyeoff' : 'eye', 20); b.setAttribute('aria-label', show ? 'Hide password' : 'Show password')
  }
  document.getElementById('lf').onsubmit = async (e) => {
    e.preventDefault()
    const b = document.getElementById('lb'); b.disabled = true; b.textContent = 'Logging in…'
    const u = document.getElementById('lm').value.trim()
    try { me = await login(u, document.getElementById('lp').value.trim(), await deviceId()); await boot() }
    catch (er) { renderLogin(er.message, u) }
  }
}

// ── Shell ───────────────────────────────────────────────────────────────
function header() {
  const open = session && !session.end_at
  const h = myHomeData
  return `<header class="bar wk-bar"><img class="blogo" src="./jdac-logo.png" alt="JDAC">
    <div class="bt"><b>${esc((me?.name || '').split(' ')[0])}</b><span>${fmtDate(istDate(), { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
    <div class="wk-hc"><b>${h ? `${h.tasks_done}/${h.tasks_total}` : '–'}</b><span>tasks</span></div><div class="wk-hc"><b>${h ? h.entries : '–'}</b><span>entries</span></div>
    <span class="wk-st ${open ? 'on' : ''}">${!session ? 'Not started' : open ? '● Open' : '✅ Closed'}</span>
    <button class="ibtn" id="hout" aria-label="Logout">${ic('logout', 18)}</button></header>`
}
function nav() {
  const t = (k, label, icn) => `<button data-tab="${k}" class="${tab === k ? 'on' : ''}">${ic(icn, 22)}${label}</button>`
  return `<nav class="nav" aria-label="Main">${t('home', 'Home', 'home')}${t('desk', 'Desk', 'grid')}${t('tasks', 'Tasks', 'task')}${t('chat', 'Chat', 'chat')}${t('me', 'Me', 'user')}</nav>`
}
function go(t, a = null, b = null, c = null) {
  if (t === 'start') { document.getElementById('day')?.scrollIntoView({ behavior: 'smooth' }); return }
  if (t === 'desks') { document.getElementById('desks')?.scrollIntoView({ behavior: 'smooth' }); return }
  tab = t; tabArg = a; tabArg2 = b; tabArg3 = c; render(); window.scrollTo(0, 0)
}
function render() {
  clearInterval(tick)
  if (!me) return renderLogin()
  app.innerHTML = header() + '<main class="main" id="view"></main>' + nav()
  app.querySelectorAll('.nav button').forEach((b) => (b.onclick = () => go(b.dataset.tab)))
  document.getElementById('hout').onclick = () => go('me')
  const v = document.getElementById('view')
  if (tab === 'leave') return renderLeave(v)
  if (tab === 'month') return renderMonth(v)
  if (tab === 'me') return renderMe(v)
  if (tab === 'tasks') return renderTasks(v, go)
  if (tab === 'chat') return renderChat(v, tabArg || '')
  if (tab === 'desk') return renderDesk(v, go, tabArg, tabArg2, tabArg3)
  v.innerHTML = '<div id="day" class="stack"></div><div id="wk" class="stack"></div>'
  const wk = document.getElementById('wk')
  const paint = () => { if (!document.body.contains(wk)) return; wk.innerHTML = homeBlocks(myHomeData, session, go); bindHome(wk, go) }
  paint()
  loadMyHome().then(() => { paint(); const hb = document.querySelector('.wk-bar'); if (hb && myHomeData) { const x = document.createElement('div'); x.innerHTML = header(); hb.replaceWith(x.firstElementChild); document.getElementById('hout').onclick = () => go('me') } })
  return renderHome(document.getElementById('day'))
}

// ── Home ────────────────────────────────────────────────────────────────
function syncLine() {
  const online = navigator.onLine
  if (pending && !online) return `<div class="sync warn">${ic('wifi_off', 16)} No internet — <b>${pending}</b> GPS points saved on phone, will send automatically</div>`
  if (pending) return `<div class="sync warn">${ic('refresh', 16)} Sending ${pending} points…</div>`
  return `<div class="sync">${ic('check', 16)} All points sent to office</div>`
}
function refreshSync() { const el = document.getElementById('sync'); if (el) el.innerHTML = syncLine() }

function renderHome(v) {
  const open = session && !session.end_at
  const t = trackingState()
  const wh = me.team === 'Warehouse' || !!me.live_track
  if (!session) {
    v.innerHTML = `
    <section class="card hero-idle">
      <div class="circ">${ic('clock', 30)}</div>
      <h2>Start your day</h2>
      <p>Shift starts ${esc(me.shift_start || '10:00')}. A selfie and your GPS location are taken when you start.</p>
      <button class="btn pri" id="start" style="font-size:16px">${ic('play', 18, '#fff')} Start day</button>
    </section>
    ${wh ? `<section class="card tip">${ic('battery', 20, '#B45309')}<div><b>${me.team === 'Warehouse' ? 'Warehouse team' : 'Live GPS on'} — tracking</b><p>Location is recorded every minute until you end the day. Keep battery "Unrestricted" for this app.</p></div></section>` : ''}`
    v.querySelector('#start').onclick = doStart
    return
  }
  if (!open) {
    v.innerHTML = `
    <section class="card hero-done">
      <div class="circ b">${ic('check', 30)}</div><h2>Day closed</h2>
      <div class="tiles t3"><div class="tile"><b>${fmtTime(session.start_at)}</b><span>In</span></div><div class="tile"><b>${fmtTime(session.end_at)}</b><span>Out</span></div><div class="tile"><b>${(session.total_km || 0).toFixed(1)}</b><span>KM</span></div></div>
      <p class="sub" style="text-align:center;margin-top:10px">Total ${duration(session.start_at, session.end_at)}</p>
    </section><div class="sync" id="sync">${syncLine().replace(/^<div class="sync[^"]*">|<\/div>$/g, '')}</div>`
    return
  }
  v.innerHTML = `
  <section class="card duty">
    <div class="row"><span class="dot live"></span><b>On duty</b><span class="sp"></span><span class="since">since ${fmtTime(session.start_at)}</span></div>
    <div class="big" id="dur">${duration(session.start_at)}</div>
    <div class="tiles t3">
      <div class="tile dk"><b id="km">${(session.total_km || 0).toFixed(1)}</b><span>KM today</span></div>
      <div class="tile dk"><b>${fmtTime(session.start_at)}</b><span>In</span></div>
      <div class="tile dk"><b id="lastgps">${wh ? (t.lastSavedAt ? agoText(t.lastSavedAt) : '—') : 'Office'}</b><span>${wh ? 'Last GPS' : 'Tracking'}</span></div>
    </div>
    ${wh ? `<div id="sync" class="dsync">${syncLine()}</div>` : ''}
  </section>
  ${wh ? `<section class="card ${t.field ? 'field-on' : ''}">
    <div class="row"><span class="fic">${ic('bike', 22)}</span><div class="nm"><b>${t.field ? 'Delivery mode is on' : 'Delivery / field mode'}</b><span>${t.field ? 'Route saved every 15 sec · office sees you live' : 'Going out for delivery or pickup? Turn on for full route'}</span></div>
    <button class="btn ${t.field ? 'dng' : 'pri'} sm" id="field">${t.field ? 'Stop' : 'Start'}</button></div></section>` : ''}
  <details class="card"><summary>${ic('route', 18, '#3A4558')} GPS showing less km? Correct it</summary>
    <form id="kmf" class="stack"><label class="f">Actual km today<input class="inp" id="kmv" type="number" step="0.1" min="0" max="500" required value="${session.manual_km || ''}"></label>
    <label class="f">Reason<input class="inp" id="kmn" minlength="3" required placeholder="e.g. Kharadi + Viman Nagar deliveries" value="${esc(session.manual_km_note || '')}"></label>
    <button class="btn ghost">Save</button></form></details>
  <button class="btn dark" id="end" style="font-size:16px;padding:17px">${ic('stop', 16, '#fff')} End day</button>
  <p class="sub" style="text-align:center;margin:0">End day takes a selfie${wh ? ' and stops tracking' : ''}.</p>
  ${!isNative() && wh ? `<p class="sub" style="text-align:center;margin:0;color:#B45309">Web version: GPS सिर्फ तब चलेगा जब यह page खुला और screen on हो. पूरे दिन tracking के लिए Android app (APK) use करें.</p>` : ''}
  ${isNative() && wh ? `<button class="link" id="perm" style="align-self:center">${ic('battery', 16)} Tracking stops? Fix battery / location settings</button>` : ''}`
  v.querySelector('#end').onclick = doEnd
  v.querySelector('#perm')?.addEventListener('click', openAppSettings)
  v.querySelector('#field')?.addEventListener('click', async () => { await setFieldMode(!trackingState().field); render() })
  v.querySelector('#kmf').onsubmit = async (e) => {
    e.preventDefault()
    try { const r = await post('/api/day/manual-km', { km: Number(v.querySelector('#kmv').value), note: v.querySelector('#kmn').value }); session.total_km = r.total_km; toast('KM saved'); render() }
    catch (er) { toast(er.message, 'bad') }
  }
  tick = setInterval(async () => {
    const d = document.getElementById('dur'); if (d) d.textContent = duration(session.start_at)
    const s = trackingState(); const l = document.getElementById('lastgps'); if (l && s.lastSavedAt) l.textContent = agoText(s.lastSavedAt)
    try { const r = await get('/api/day/today'); if (r.session) { session = r.session; const k = document.getElementById('km'); if (k) k.textContent = (session.total_km || 0).toFixed(1) } } catch { /* offline */ }
  }, 30_000)
}

async function doStart() {
  if (busy) return; busy = true
  const b = document.getElementById('start')
  try {
    b.disabled = true; b.textContent = 'Getting location…'
    const pos = await currentPosition()
    b.textContent = 'Take selfie…'
    const photo = await takeSelfie()
    b.textContent = 'Saving…'
    const r = await post('/api/day/start', { ...pos, photo, client_id: uuid() })
    session = r.session
    await syncTracking()
    toast('Day started 👍')
  } catch (e) { toast(e.message || 'Could not start — check internet & GPS', 'bad') }
  finally { busy = false; render() }
}
let endArmed = 0
async function doEnd() {
  const b = document.getElementById('end')
  if (busy) return
  // दो बार tap = confirm (browser confirm() camera खोलने की permission खा जाता है)
  if (Date.now() - endArmed > 4000) {
    endArmed = Date.now()
    b.classList.replace('dark', 'dng'); b.textContent = 'Tap again to end day'
    setTimeout(() => { if (b.isConnected && !busy) { b.classList.replace('dng', 'dark'); b.innerHTML = `${ic('stop', 16, '#fff')} End day` } }, 4000)
    return
  }
  busy = true
  try {
    b.disabled = true; b.textContent = 'Getting location…'
    const pos = await currentPosition().catch(() => ({}))
    b.textContent = 'Take selfie…'
    const photo = await takeSelfie()
    b.textContent = 'Saving…'
    await flush()
    const r = await post('/api/day/end', { ...pos, photo, client_id: uuid(), date: session.date })
    session = r.session
    await syncTracking()
    toast('Day closed ✅')
  } catch (e) { toast(e.message || 'Could not close — check internet', 'bad') }
  finally { busy = false; render() }
}

// ── Leave ───────────────────────────────────────────────────────────────
async function renderLeave(v) {
  v.innerHTML = `
  <form class="card stack" id="lvf"><h2 class="h3">Apply for leave</h2>
    <label class="f">Date<input class="inp" type="date" id="ld" value="${istShift(1)}" min="${istDate()}" required></label>
    <label class="f">Type<select class="inp" id="lk"><option>Full day</option><option>Half day</option></select></label>
    <label class="f">Reason<input class="inp" id="lr" minlength="3" maxlength="300" required placeholder="e.g. family function"></label>
    <button class="btn pri">Send request</button></form>
  <h3 class="lbl" style="margin:6px 4px 0">My leaves</h3><section class="card" style="padding:4px 14px"><div class="list" id="ll"><div class="skel"></div></div></section>`
  v.querySelector('#lvf').onsubmit = async (e) => {
    e.preventDefault()
    try { await post('/api/leaves', { date: v.querySelector('#ld').value, kind: v.querySelector('#lk').value, reason: v.querySelector('#lr').value }); toast('Leave request sent'); renderLeave(v) }
    catch (er) { toast(er.message, 'bad') }
  }
  try {
    const { leaves } = await get('/api/leaves/mine')
    const k = { Approved: 'g', Pending: 'o', Rejected: 'r', Cancelled: 'n' }
    v.querySelector('#ll').innerHTML = leaves.map((l) => `<div class="li"><div class="nm"><b>${fmtDate(l.date)} · ${esc(l.kind)}</b><span>${esc(l.reason)}</span></div><span class="pill ${k[l.status]}">${l.status}</span></div>`).join('') || '<div class="empty">No leaves yet</div>'
  } catch (e) { v.querySelector('#ll').innerHTML = `<div class="err">${esc(e.message)}</div>` }
}

// ── Attendance month ────────────────────────────────────────────────────
async function renderMonth(v, month = istDate().slice(0, 7)) {
  v.innerHTML = `<div class="row"><input class="inp" type="month" id="mm" value="${month}"></div><div id="mc"><div class="skel" style="height:300px"></div></div>`
  v.querySelector('#mm').onchange = (e) => renderMonth(v, e.target.value)
  try {
    const { sessions, marks } = await get('/api/me/month?month=' + month)
    const sBy = Object.fromEntries(sessions.map((s) => [s.date, s]))
    const mBy = Object.fromEntries(marks.map((m) => [m.date, m.status]))
    const [y, mo] = month.split('-').map(Number)
    const days = new Date(y, mo, 0).getDate()
    const lead = (new Date(y, mo - 1, 1).getDay() + 6) % 7
    const today = istDate()
    let late = 0, present = 0
    const [sh, sm] = (me.shift_start || '10:00').split(':').map(Number)
    const cells = Array.from({ length: days }, (_, i) => {
      const d = `${month}-${String(i + 1).padStart(2, '0')}`
      const s = sBy[d], m = mBy[d]
      let cls = new Date(d + 'T12:00:00Z').getUTCDay() === 0 ? 'w' : d > today ? 'f' : 'a'
      if (s) {
        const t = new Date(new Date(s.start_at).getTime() + 330 * 60000)
        const isLate = t.getUTCHours() * 60 + t.getUTCMinutes() > sh * 60 + sm + 15
        if (isLate) late++
        cls = isLate ? 'l' : 'p'
      }
      if (m === 'Leave') cls = 'v'; else if (m === 'Week Off') cls = 'w'; else if (m === 'Absent') cls = 'a'; else if (m === 'Present') cls = 'p'
      if (cls === 'p' || cls === 'l') present++
      return `<span class="cd ${d === today ? 'today ' : ''}${cls}">${i + 1}</span>`
    }).join('')
    const km = sessions.reduce((a, s) => a + (s.total_km || 0), 0)
    v.querySelector('#mc').innerHTML = `
      <div class="tiles"><div class="tile wb"><b style="color:#047857">${present}</b><span>Present</span></div><div class="tile wb"><b style="color:#B45309">${late}</b><span>Late</span></div><div class="tile wb"><b style="color:#6D28D9">${Object.values(mBy).filter((x) => x === 'Leave').length}</b><span>Leave</span></div><div class="tile wb"><b>${Math.round(km)}</b><span>KM</span></div></div>
      <section class="card" style="margin-top:12px"><h2 class="h3" style="text-align:center">${fmtDate(month + '-01', { month: 'long', year: 'numeric' })}</h2>
      <div class="cal hd">${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d) => `<span>${d}</span>`).join('')}</div>
      <div class="cal">${'<span></span>'.repeat(lead)}${cells}</div>
      <div class="legend"><span><i class="dot" style="background:#4ADE80"></i>Present</span><span><i class="dot" style="background:#FBBF24"></i>Late</span><span><i class="dot" style="background:#A78BFA"></i>Leave</span><span><i class="dot" style="background:#FCA5A5"></i>Absent</span><span><i class="dot" style="background:#CBD5E1"></i>Sunday off</span></div></section>
      <section class="card" style="padding:4px 14px"><div class="list">${sessions.map((s) => `<div class="li"><div class="nm"><b>${fmtDate(s.date)}</b><span>In ${fmtTime(s.start_at)} · Out ${fmtTime(s.end_at)}${s.auto_closed ? ' (auto)' : ''}</span></div><b style="font-size:13px">${(s.total_km || 0).toFixed(1)} km</b></div>`).join('') || '<div class="empty">No entries this month</div>'}</div></section>`
  } catch (e) { v.querySelector('#mc').innerHTML = `<div class="err">${esc(e.message)}</div>` }
}

// ── Me ──────────────────────────────────────────────────────────────────
function renderMe(v) {
  const admin = ['hr', 'boss', 'developer'].includes(me.role)
  v.innerHTML = `
  <section class="card"><div class="row"><div class="av" style="background:#F59E0B;color:#0B1220;border-radius:50%;width:52px;height:52px;font-size:17px">${esc(initials(me.name))}</div>
    <div class="nm"><b style="font-size:17px">${esc(me.name)}</b><span>${esc(me.designation || '')}</span><span>${esc(me.team)} team${me.work_location ? ' · ' + esc(me.work_location) : ''}</span></div></div>
    <div class="tiles t3" style="margin-top:12px"><div class="tile"><b>${esc(me.shift_start)}</b><span>Shift in</span></div><div class="tile"><b>${esc(me.shift_end)}</b><span>Shift out</span></div><div class="tile"><b>@${esc(me.username || '')}</b><span>${me.phone ? '+91 ' + esc(me.phone) : 'username'}</span></div></div></section>
  ${admin ? `<section class="card tip">${ic('shield', 20, '#6D28D9')}<div><b>Admin panel</b><p>HR / Boss / Developer panels open on the web panel link shared by office.</p></div></section>` : ''}
  <section class="card" style="padding:4px 14px"><div class="list">
    <button class="li" id="gol">${ic('cal', 20, '#3A4558')}<div class="nm"><b>Leave</b><span>Apply for leave, see status</span></div>${ic('chev', 18, '#9AA4B5')}</button>
    <button class="li" id="gom">${ic('clock', 20, '#3A4558')}<div class="nm"><b>My attendance</b><span>Month calendar</span></div>${ic('chev', 18, '#9AA4B5')}</button>
    ${isNative() ? `<button class="li" id="perm">${ic('battery', 20, '#3A4558')}<div class="nm"><b>Tracking settings</b><span>Battery unrestricted, location always</span></div>${ic('chev', 18, '#9AA4B5')}</button>` : ''}
    <button class="li" id="sync2">${ic('refresh', 20, '#3A4558')}<div class="nm"><b>Send pending data now</b><span>${pending} GPS points waiting${lastSyncAt ? ' · last sent ' + agoText(lastSyncAt) : ''}</span></div></button>
    <a class="li" href="https://github.com/jdaclogistics-web/JDACTracker/releases/download/apk-latest/JDAC-Tracker.apk" target="_blank" rel="noopener">${ic('download', 20, '#3A4558')}<div class="nm"><b>Download latest APK</b><span>नया phone या app दोबारा install करना हो तो</span></div></a>
    ${isNative() ? `<button class="li" id="upd">${ic('download', 20, '#3A4558')}<div class="nm"><b>Check for app update</b><span>नया version हो तो अपने आप लग जाएगा</span></div></button>` : ''}
    <button class="li" id="out" style="color:#B91C1C">${ic('logout', 20, '#B91C1C')}<div class="nm"><b>Logout</b></div></button></div></section>
  <p class="sub" style="text-align:center">JDAC Tracker · build ${esc(BUILD)}</p>`
  v.querySelector('#upd')?.addEventListener('click', async () => { toast('Update check हो रहा है…'); await liveUpdate({ onStatus: (t) => toast(t) }); toast('App latest है') })
  v.querySelector('#perm')?.addEventListener('click', openAppSettings)
  v.querySelector('#gol').onclick = () => go('leave'); v.querySelector('#gom').onclick = () => go('month')
  v.querySelector('#sync2').onclick = async () => { await flush(); toast(pending ? `${pending} still waiting — no internet?` : 'All data sent'); render() }
  v.querySelector('#out').onclick = async () => {
    if (session && !session.end_at && !confirm('Day is still open — logout stops tracking. Continue?')) return
    await flush(); await stopTracking(); logout(); me = null; session = null; renderLogin()
  }
}

document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState !== 'visible' || !me) return
  flush()
  try { const d = await get('/api/day/today'); session = d.session; await syncTracking(); if (tab === 'home') render() } catch { /* offline */ }
})

boot()
liveUpdate({ onStatus: (t) => toast(t) })
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') liveUpdate({ onStatus: (t) => toast(t) }) })

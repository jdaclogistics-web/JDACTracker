// JDAC Tracker API — Cloudflare Worker + D1
// Mobile ऐप और Web panels दोनों यही API use करते हैं.
import { istDate, istMinutes, nowIso, hashPassword, verifyPassword, signToken, verifyToken, computeKm, phone10 } from './lib.js'
import { loadAll, dropCache, homeSummary, companyPage, myHome, cargoDesk, COMPANIES, journeyOf } from './cc.js'
import { DESK_TABLES, migrateDesks, registerDesks } from './desks.js'
import { savePhoto, readPhoto, flushPendingPhotos, bytesToB64 } from './photos.js'

const ADMIN_ROLES = ['hr', 'boss', 'developer']
const NO_SIGNAL_MIN = 10
const TOKEN_DAYS = 90
const AUTO_LOGOUT_HOURS = 24

// ── HTTP helpers ─────────────────────────────────────────────────────────
class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status } }
const bad = (msg) => new HttpError(400, msg)
function cors(env, req) {
  const origin = req.headers.get('Origin') || '*'
  const allow = (env.ALLOWED_ORIGINS || '*').split(',').map((s) => s.trim())
  const ok = allow.includes('*') || allow.includes(origin) || origin.startsWith('capacitor://') || origin === 'https://localhost' || origin === 'http://localhost'
  return {
    'Access-Control-Allow-Origin': ok ? origin : allow[0],
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}
const json = (data, status = 200, extra = {}) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...extra } })
async function body(req) { try { return await req.json() } catch { return {} } }
const tracked = (e) => e.team === 'Warehouse' || !!e.live_track
const pub = (e) => e && ({ id: e.id, legacy_id: e.legacy_id ?? null, username: e.username, live_track: !!e.live_track, name: e.name, phone: e.phone, role: e.role, team: e.team, designation: e.designation, department: e.department, work_location: e.work_location, shift_start: e.shift_start, shift_end: e.shift_end, joining_date: e.joining_date, active: !!e.active, device_linked: !!e.device_id, status: e.status || (e.active ? 'Active' : 'Inactive'), exit_date: e.exit_date || null, salary_inhand: e.salary_inhand ?? null, emp_code: e.emp_code || null, offer_letter: e.offer_letter || null, appointment_letter: e.appointment_letter || null, documents: e.documents || null, login_mode: e.pass_hash === 'phone' ? 'phone' : e.pass_hash === 'locked' ? 'locked' : 'custom' })

async function audit(env, actor, action, tbl, rowId, oldData, newData) {
  await env.DB.prepare('INSERT INTO audit_log (actor, action, tbl, row_id, old_data, new_data) VALUES (?,?,?,?,?,?)')
    .bind(actor ?? null, action, tbl, rowId == null ? null : String(rowId), oldData ? JSON.stringify(oldData) : null, newData ? JSON.stringify(newData) : null).run()
}

// ── Auth ────────────────────────────────────────────────────────────────
async function authUser(env, req) {
  const tok = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '')
  const p = await verifyToken(tok, env.TOKEN_SECRET)
  if (!p) throw new HttpError(401, 'Login again')
  const me = await env.DB.prepare('SELECT * FROM employees WHERE id = ?').bind(p.sub).first()
  if (!me || !me.active || me.token_version !== p.tv) throw new HttpError(401, 'Login again')
  return me
}
const needAdmin = (me) => { if (!ADMIN_ROLES.includes(me.role)) throw new HttpError(403, 'Not allowed') }
const needDev = (me) => { if (me.role !== 'developer') throw new HttpError(403, 'Developer only') }

// ── KM recompute for (emp, date) ─────────────────────────────────────────
async function recompute(env, empId, date) {
  const s = await env.DB.prepare('SELECT id, manual_km FROM day_sessions WHERE emp_id = ? AND date = ?').bind(empId, date).first()
  if (!s) return null
  const { results } = await env.DB.prepare('SELECT id, lat, lng, kind, recorded_at FROM location_pings WHERE emp_id = ? AND date = ? ORDER BY recorded_at, id').bind(empId, date).all()
  const km = computeKm(results, s.manual_km)
  await env.DB.prepare('UPDATE day_sessions SET total_km = ? WHERE id = ?').bind(km, s.id).run()
  return km
}

function validPing(p, me) {
  const lat = Number(p.lat), lng = Number(p.lng)
  if (!p.client_id || typeof p.client_id !== 'string' || p.client_id.length > 64) return 'bad client_id'
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180 || (lat === 0 && lng === 0)) return 'bad lat/lng'
  const t = Date.parse(p.recorded_at)
  if (!Number.isFinite(t)) return 'bad time'
  if (t > Date.now() + 10 * 60000) return 'time in future — check phone clock'
  if (t < Date.now() - 45 * 86400000) return 'too old'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.date || '')) return 'bad date'
  if (p.kind && !['duty', 'field'].includes(p.kind)) return 'bad kind'
  return null
}

// ── Usage tracking (free plan: 1,00,000 requests/day, D1 500 MB) ─────────────
export const USAGE_LIMITS = { requests_per_day: 100000, db_bytes: 500 * 1024 * 1024, warn_pct: 70 }
let usagePending = 0
async function flushUsage(env) {
  const n = usagePending; usagePending = 0
  if (!n) return
  try {
    await env.DB.prepare('INSERT INTO usage_daily (day, requests) VALUES (?, ?) ON CONFLICT (day) DO UPDATE SET requests = requests + excluded.requests').bind(istDate(), n).run()
  } catch { usagePending += n }
}
async function usageSummary(env) {
  const today = istDate()
  const { results: days } = await env.DB.prepare('SELECT day, requests FROM usage_daily ORDER BY day DESC LIMIT 14').all()
  let dbBytes = null
  try { const p = await env.DB.prepare('SELECT page_count * page_size AS b FROM pragma_page_count(), pragma_page_size()').first(); dbBytes = p?.b ?? null } catch { /* pragma blocked */ }
  const t = await env.DB.prepare('SELECT (SELECT count(*) FROM location_pings WHERE date = ?1) pings_today, (SELECT count(*) FROM photos) photos, (SELECT count(*) FROM photos WHERE moved = 0) photos_in_db').bind(today).first()
  const reqToday = (days.find((d) => d.day === today)?.requests || 0) + usagePending
  const L = USAGE_LIMITS
  const req_pct = Math.round((reqToday / L.requests_per_day) * 100)
  const db_pct = dbBytes == null ? null : Math.round((dbBytes / L.db_bytes) * 100)
  const warnings = []
  if (req_pct >= L.warn_pct) warnings.push(`Requests today ${reqToday.toLocaleString('en-IN')} = ${req_pct}% of free daily limit`)
  if (db_pct != null && db_pct >= L.warn_pct) warnings.push(`Database ${(dbBytes / 1048576).toFixed(0)} MB = ${db_pct}% of 500 MB`)
  return { ok: warnings.length === 0, at: nowIso(), today, requests_today: reqToday, requests_limit: L.requests_per_day, req_pct,
    db_bytes: dbBytes, db_limit_bytes: L.db_bytes, db_pct, warn_pct: L.warn_pct, ...t, last_14_days: days, warnings }
}

// ═════════════════════════════ ROUTES ═════════════════════════════════════
const routes = []
const on = (method, path, fn) => routes.push({ method, re: new RegExp('^' + path.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), fn })

// Health (keep-alive + developer panel)
on('GET', '/api/health', async (env) => {
  const r = await env.DB.prepare('SELECT (SELECT count(*) FROM employees WHERE active=1) employees, (SELECT count(*) FROM location_pings) pings').first()
  return json({ ok: true, at: nowIso(), ...r })
})

// Usage summary (सिर्फ गिनती, कोई personal data नहीं) — GitHub usage-watch इसे हर घंटे पढ़ता है
on('GET', '/api/usage', async (env) => json(await usageSummary(env)))

// ── Login ───────────────────────────────────────────────────────────────
on('POST', '/api/login', async (env, req) => {
  const b = await body(req)
  const id = String(b.username ?? b.phone ?? '').trim()
  if (!id || !b.password) throw bad('Enter User ID and password')
  // username (JDAC1013) से login; पुराने app के लिए 10 अंक mobile भी चलेगा
  const ph = phone10(id)
  const me = await env.DB.prepare('SELECT * FROM employees WHERE username = ? COLLATE NOCASE OR (? <> \'\' AND phone = ?)').bind(id, ph.length === 10 ? ph : '', ph).first()
  const pw = String(b.password).trim()
  // pass_hash 'phone' = password is the employee's own 10-digit mobile number
  const okPw = me && (me.pass_hash === 'phone' ? !!me.phone && phone10(pw) === me.phone : await verifyPassword(pw, me.pass_hash))
  if (!me || !me.active || !okPw) throw new HttpError(401, 'User ID or password is wrong')
  // Phone lock: app login पहली बार जिस phone से हुआ उसी से चलेगा (developer login पर हमेशा लागू).
  // Web panel (device_id 'web') पर lock नहीं; दूसरा phone चाहिए तो Developer panel → Unlink phone.
  const dev = b.device_id ? String(b.device_id).slice(0, 100) : ''
  if (dev && dev !== 'web') {
    if (!me.device_id) await env.DB.prepare('UPDATE employees SET device_id = ? WHERE id = ?').bind(dev, me.id).run()
    else if (me.device_id !== dev && me.role === 'developer') throw new HttpError(403, 'This developer login works only on the registered phone')
  }
  // GPS वाले staff (Warehouse / live GPS): phone login 24 घंटे बाद अपने आप logout (cron देखता है)
  if (dev && dev !== 'web' && (me.team === 'Warehouse' || me.live_track)) {
    await env.DB.prepare('UPDATE employees SET app_login_at = ? WHERE id = ?').bind(nowIso(), me.id).run()
    await env.DB.prepare("UPDATE alerts SET closed_at = ? WHERE emp_id = ? AND kind = 'auto_logout' AND closed_at IS NULL").bind(nowIso(), me.id).run()
  }
  const token = await signToken({ sub: me.id, tv: me.token_version, exp: Date.now() + TOKEN_DAYS * 86400000 }, env.TOKEN_SECRET)
  return json({ token, me: pub(me) })
})
on('GET', '/api/me', async (env, req) => json({ me: pub(await authUser(env, req)), today: istDate() }))

// ── Employee: day ───────────────────────────────────────────────────────
on('GET', '/api/day/today', async (env, req) => {
  const me = await authUser(env, req)
  const s = await env.DB.prepare('SELECT * FROM day_sessions WHERE emp_id = ? AND date = ?').bind(me.id, istDate()).first()
  return json({ session: s || null, today: istDate() })
})

on('POST', '/api/day/start', async (env, req) => {
  const me = await authUser(env, req)
  const b = await body(req)
  const lat = Number(b.lat), lng = Number(b.lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) throw bad('Location is required — turn on GPS')
  const date = istDate()
  const existing = await env.DB.prepare('SELECT * FROM day_sessions WHERE emp_id = ? AND date = ?').bind(me.id, date).first()
  if (existing?.end_at) throw new HttpError(409, 'Today\'s day is already closed')
  const photo = b.photo ? await savePhoto(env, `${me.id}/${date}-in-${Date.now()}.jpg`, b.photo) : null
  if (existing) {
    // ऐप दोबारा खुला / पिछली कोशिश अधूरी → resume, start time वही रहता है
    if (photo) await env.DB.prepare('UPDATE day_sessions SET start_photo = COALESCE(start_photo, ?) WHERE id = ?').bind(photo, existing.id).run()
    return json({ session: await env.DB.prepare('SELECT * FROM day_sessions WHERE id = ?').bind(existing.id).first(), resumed: true })
  }
  const at = nowIso()
  await env.DB.prepare('INSERT INTO day_sessions (emp_id, date, start_at, start_lat, start_lng, start_photo) VALUES (?,?,?,?,?,?)')
    .bind(me.id, date, at, lat, lng, photo).run()
  if (b.client_id) {
    await env.DB.prepare('INSERT OR IGNORE INTO location_pings (client_id, emp_id, date, lat, lng, accuracy, kind, recorded_at) VALUES (?,?,?,?,?,?,?,?)')
      .bind(String(b.client_id), me.id, date, lat, lng, b.accuracy ?? null, 'duty', at).run()
  }
  return json({ session: await env.DB.prepare('SELECT * FROM day_sessions WHERE emp_id = ? AND date = ?').bind(me.id, date).first() })
})

on('POST', '/api/admin/day-start', async (env, req) => {
  const me = await authUser(env, req); needAdmin(me)
  const b = await body(req)
  const emp = await env.DB.prepare('SELECT * FROM employees WHERE id = ? AND active = 1').bind(Number(b.emp_id)).first()
  if (!emp) throw new HttpError(404, 'Employee not found')
  const lat = Number(b.lat), lng = Number(b.lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) throw bad('Location is required — turn on GPS')
  if (!b.photo) throw bad('Take the selfie first')
  const date = istDate()
  if (await env.DB.prepare('SELECT 1 AS x FROM day_sessions WHERE emp_id = ? AND date = ?').bind(emp.id, date).first()) throw new HttpError(409, 'Their day has already started today')
  const photo = await savePhoto(env, `${emp.id}/${date}-in-${Date.now()}.jpg`, b.photo)
  await env.DB.prepare('INSERT INTO day_sessions (emp_id, date, start_at, start_lat, start_lng, start_photo) VALUES (?,?,?,?,?,?)').bind(emp.id, date, nowIso(), lat, lng, photo).run()
  await audit(env, me.id, 'day_start_for', 'day_sessions', `${emp.id}:${date}`, null, { by: me.name, lat, lng })
  return json({ ok: true })
})
on('POST', '/api/day/end', async (env, req) => {
  const me = await authUser(env, req)
  const b = await body(req)
  const date = b.date || istDate()
  const s = await env.DB.prepare('SELECT * FROM day_sessions WHERE emp_id = ? AND date = ?').bind(me.id, date).first()
  if (!s) throw new HttpError(404, 'Day has not started')
  if (s.end_at) return json({ session: s, already: true }) // दोबारा भेजा → वही जवाब, कुछ नहीं बदलता
  const at = nowIso()
  const photo = b.photo ? await savePhoto(env, `${me.id}/${date}-out-${Date.now()}.jpg`, b.photo) : null
  if (b.client_id && Number.isFinite(Number(b.lat))) {
    await env.DB.prepare('INSERT OR IGNORE INTO location_pings (client_id, emp_id, date, lat, lng, accuracy, kind, recorded_at) VALUES (?,?,?,?,?,?,?,?)')
      .bind(String(b.client_id), me.id, date, Number(b.lat), Number(b.lng), b.accuracy ?? null, 'duty', at).run()
  }
  await recompute(env, me.id, date)
  await env.DB.prepare('UPDATE day_sessions SET end_at = ?, end_lat = ?, end_lng = ?, end_photo = ? WHERE id = ? AND end_at IS NULL')
    .bind(at, Number(b.lat) || null, Number(b.lng) || null, photo, s.id).run()
  return json({ session: await env.DB.prepare('SELECT * FROM day_sessions WHERE id = ?').bind(s.id).first() })
})

on('POST', '/api/day/manual-km', async (env, req) => {
  const me = await authUser(env, req)
  const b = await body(req)
  const km = Number(b.km)
  if (!Number.isFinite(km) || km < 0 || km > 500) throw bad('KM must be between 0 and 500')
  if (!b.note || String(b.note).trim().length < 3) throw bad('Write the reason')
  const s = await env.DB.prepare('SELECT * FROM day_sessions WHERE emp_id = ? AND date = ?').bind(me.id, istDate()).first()
  if (!s) throw new HttpError(404, 'Start your day first')
  await env.DB.prepare('UPDATE day_sessions SET manual_km = ?, manual_km_note = ? WHERE id = ?').bind(km, String(b.note).trim().slice(0, 300), s.id).run()
  await audit(env, me.id, 'manual_km', 'day_sessions', s.id, { manual_km: s.manual_km }, { manual_km: km, note: b.note })
  const total = await recompute(env, me.id, s.date)
  return json({ total_km: total })
})

// ── GPS batch (offline queue से) — idempotent ─────────────────────────────
on('POST', '/api/pings', async (env, req) => {
  const me = await authUser(env, req)
  const b = await body(req)
  const list = Array.isArray(b.pings) ? b.pings.slice(0, 500) : []
  const rejected = []
  const ok = []
  for (const p of list) {
    const why = validPing(p, me)
    if (why) rejected.push({ client_id: p.client_id, reason: why })
    else ok.push(p)
  }
  let inserted = 0
  for (let i = 0; i < ok.length; i += 50) {
    const chunk = ok.slice(i, i + 50)
    const res = await env.DB.batch(chunk.map((p) => env.DB.prepare(
      'INSERT OR IGNORE INTO location_pings (client_id, emp_id, date, lat, lng, accuracy, kind, recorded_at) VALUES (?,?,?,?,?,?,?,?)',
    ).bind(p.client_id, me.id, p.date, Number(p.lat), Number(p.lng), p.accuracy == null ? null : Number(p.accuracy), p.kind || 'duty', new Date(p.recorded_at).toISOString())))
    inserted += res.reduce((n, r) => n + (r.meta?.changes || 0), 0)
  }
  const dates = [...new Set(ok.map((p) => p.date))]
  for (const d of dates) await recompute(env, me.id, d)
  if (ok.length) await env.DB.prepare("UPDATE alerts SET closed_at = ? WHERE emp_id = ? AND kind = 'no_signal' AND closed_at IS NULL").bind(nowIso(), me.id).run()
  // accepted = server पर पक्के (नए + पहले से मौजूद duplicate) → phone इन्हें queue से हटा सकता है
  return json({ accepted: ok.map((p) => p.client_id), inserted, duplicates: ok.length - inserted, rejected })
})

// ── Employee: history + leave ─────────────────────────────────────────────
on('GET', '/api/me/month', async (env, req, url) => {
  const me = await authUser(env, req)
  const m = url.searchParams.get('month') || istDate().slice(0, 7)
  const { results } = await env.DB.prepare('SELECT * FROM day_sessions WHERE emp_id = ? AND date LIKE ? ORDER BY date DESC').bind(me.id, `${m}-%`).all()
  const marks = await env.DB.prepare('SELECT date, status FROM attendance_marks WHERE emp_id = ? AND date LIKE ?').bind(me.id, `${m}-%`).all()
  return json({ sessions: results, marks: marks.results })
})
on('GET', '/api/leaves/mine', async (env, req) => {
  const me = await authUser(env, req)
  const { results } = await env.DB.prepare('SELECT * FROM leave_requests WHERE emp_id = ? ORDER BY date DESC LIMIT 50').bind(me.id).all()
  return json({ leaves: results })
})
on('POST', '/api/leaves', async (env, req) => {
  const me = await authUser(env, req)
  const b = await body(req)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.date || '') || b.date < istDate()) throw bad('Choose a valid date')
  if (!b.reason || String(b.reason).trim().length < 3) throw bad('Write the reason')
  const kind = b.kind === 'Half day' ? 'Half day' : 'Full day'
  try {
    await env.DB.prepare('INSERT INTO leave_requests (emp_id, date, kind, reason) VALUES (?,?,?,?)').bind(me.id, b.date, kind, String(b.reason).trim().slice(0, 300)).run()
  } catch (e) {
    if (/UNIQUE/i.test(String(e))) throw new HttpError(409, 'Leave already exists for this date')
    throw e
  }
  return json({ ok: true })
})

// Sunday = weekly off (JDAC rule) — session न हो तो absent नहीं गिनते
const isSunday = (d) => new Date(d + 'T12:00:00Z').getUTCDay() === 0

// ═══════════════════════════ ADMIN (HR / Boss / Developer) ═════════════════
on('GET', '/api/admin/today', async (env, req, url) => {
  const me = await authUser(env, req); needAdmin(me)
  const date = url.searchParams.get('date') || istDate()
  const [emps, sess, last, leaves, marks] = await Promise.all([
    env.DB.prepare('SELECT * FROM employees WHERE active = 1 ORDER BY team, name').all(),
    env.DB.prepare('SELECT * FROM day_sessions WHERE date = ?').bind(date).all(),
    env.DB.prepare('SELECT * FROM last_location').all(),
    env.DB.prepare("SELECT * FROM leave_requests WHERE date = ? AND status = 'Approved'").bind(date).all(),
    env.DB.prepare('SELECT * FROM attendance_marks WHERE date = ?').bind(date).all(),
  ])
  const sBy = new Map(sess.results.map((s) => [s.emp_id, s]))
  const lBy = new Map(last.results.map((l) => [l.emp_id, l]))
  const lvBy = new Map(leaves.results.map((l) => [l.emp_id, l]))
  const mBy = new Map(marks.results.map((m) => [m.emp_id, m]))
  const now = Date.now()
  const rows = emps.results.map((e) => {
    const s = sBy.get(e.id), loc = lBy.get(e.id)
    const [sh, sm] = (e.shift_start || '10:00').split(':').map(Number)
    const late = s ? istMinutes(s.start_at) > sh * 60 + sm + 15 : false
    const mins = loc ? Math.round((now - Date.parse(loc.recorded_at)) / 60000) : null
    let status = isSunday(date) ? 'off' : 'absent'
    if (mBy.get(e.id)) status = mBy.get(e.id).status === 'Week Off' ? 'off' : 'marked'
    if (lvBy.get(e.id)) status = 'leave'
    if (s && s.end_at) status = 'closed'
    if (s && !s.end_at) status = tracked(e) && (mins == null || mins > NO_SIGNAL_MIN) ? 'no_signal' : 'on_duty'
    return { emp: pub(e), session: s || null, last: loc && loc.recorded_at.slice(0, 10) >= date ? loc : null, last_min: mins, late, leave: lvBy.get(e.id) || null, mark: mBy.get(e.id) || null, status }
  })
  const count = (k) => rows.filter((r) => r.status === k).length
  return json({ date, rows, summary: { total: rows.length, in: rows.filter((r) => r.session).length, late: rows.filter((r) => r.late).length, leave: count('leave'), absent: count('absent'), off: count('off'), no_signal: count('no_signal'),
    warehouse: { total: rows.filter((r) => r.emp.team === 'Warehouse').length, in: rows.filter((r) => r.emp.team === 'Warehouse' && r.session).length },
    office: { total: rows.filter((r) => r.emp.team === 'Office').length, in: rows.filter((r) => r.emp.team === 'Office' && r.session).length } } })
})

on('GET', '/api/admin/trail', async (env, req, url) => {
  const me = await authUser(env, req); needAdmin(me)
  const emp = Number(url.searchParams.get('emp')), date = url.searchParams.get('date') || istDate()
  const [pings, s, e] = await Promise.all([
    env.DB.prepare('SELECT lat, lng, kind, recorded_at, created_at FROM location_pings WHERE emp_id = ? AND date = ? ORDER BY recorded_at').bind(emp, date).all(),
    env.DB.prepare('SELECT * FROM day_sessions WHERE emp_id = ? AND date = ?').bind(emp, date).first(),
    env.DB.prepare('SELECT * FROM employees WHERE id = ?').bind(emp).first(),
  ])
  return json({ emp: pub(e), session: s, pings: pings.results })
})

on('GET', '/api/admin/photo', async (env, req, url) => {
  const me = await authUser(env, req); needAdmin(me)
  const p = await readPhoto(env, url.searchParams.get('ref'))
  if (!p) throw new HttpError(404, 'Photo not found')
  return new Response(p.body, { headers: { 'Content-Type': p.mime, 'Cache-Control': 'private, max-age=3600' } })
})

on('GET', '/api/admin/leaves', async (env, req, url) => {
  const me = await authUser(env, req); needAdmin(me)
  const st = url.searchParams.get('status')
  const q = st ? env.DB.prepare('SELECT l.*, e.name, e.designation FROM leave_requests l JOIN employees e ON e.id = l.emp_id WHERE l.status = ? ORDER BY l.date DESC LIMIT 200').bind(st)
    : env.DB.prepare('SELECT l.*, e.name, e.designation FROM leave_requests l JOIN employees e ON e.id = l.emp_id ORDER BY l.created_at DESC LIMIT 200')
  return json({ leaves: (await q.all()).results })
})
on('POST', '/api/admin/leaves/:id/decide', async (env, req, url, params) => {
  const me = await authUser(env, req); needAdmin(me)
  const b = await body(req)
  const status = b.status === 'Approved' ? 'Approved' : b.status === 'Rejected' ? 'Rejected' : null
  if (!status) throw bad('status?')
  const old = await env.DB.prepare('SELECT * FROM leave_requests WHERE id = ?').bind(params.id).first()
  if (!old) throw new HttpError(404, 'Not found')
  await env.DB.prepare('UPDATE leave_requests SET status = ?, decided_by = ?, decided_at = ? WHERE id = ?').bind(status, me.id, nowIso(), old.id).run()
  await audit(env, me.id, 'leave_' + status.toLowerCase(), 'leave_requests', old.id, { status: old.status }, { status })
  return json({ ok: true })
})

on('POST', '/api/admin/marks', async (env, req) => {
  const me = await authUser(env, req); needAdmin(me)
  const b = await body(req)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.date || '') || !b.emp_id) throw bad('date / employee?')
  if (!b.reason || String(b.reason).trim().length < 3) throw bad('Write the reason')
  const old = await env.DB.prepare('SELECT * FROM attendance_marks WHERE emp_id = ? AND date = ?').bind(b.emp_id, b.date).first()
  if (!['Present', 'Half Day', 'Absent', 'Leave', 'Week Off'].includes(b.status)) throw bad('status?')
  await env.DB.prepare('INSERT INTO attendance_marks (emp_id, date, status, reason, set_by) VALUES (?,?,?,?,?) ON CONFLICT (emp_id, date) DO UPDATE SET status = excluded.status, reason = excluded.reason, set_by = excluded.set_by, set_at = excluded.set_at')
    .bind(b.emp_id, b.date, b.status, String(b.reason).trim(), me.id).run()
  await audit(env, me.id, 'attendance_mark', 'attendance_marks', `${b.emp_id}:${b.date}`, old, { status: b.status, reason: b.reason })
  return json({ ok: true })
})

// HR correction of a day (forgot to close etc.) — हमेशा audit के साथ
on('POST', '/api/admin/day/:id/correct', async (env, req, url, params) => {
  const me = await authUser(env, req); needAdmin(me)
  const b = await body(req)
  if (!b.reason || String(b.reason).trim().length < 3) throw bad('Write the reason')
  const s = await env.DB.prepare('SELECT * FROM day_sessions WHERE id = ?').bind(params.id).first()
  if (!s) throw new HttpError(404, 'Not found')
  const patch = {}
  if (b.end_at) { if (Date.parse(b.end_at) < Date.parse(s.start_at)) throw bad('Out time cannot be before In time'); patch.end_at = new Date(b.end_at).toISOString() }
  if (b.manual_km != null) patch.manual_km = Number(b.manual_km)
  const keys = Object.keys(patch)
  if (!keys.length) throw bad('Nothing changed')
  await env.DB.prepare(`UPDATE day_sessions SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`).bind(...keys.map((k) => patch[k]), s.id).run()
  await audit(env, me.id, 'day_correct', 'day_sessions', s.id, Object.fromEntries(keys.map((k) => [k, s[k]])), { ...patch, reason: b.reason })
  if ('manual_km' in patch) await recompute(env, s.emp_id, s.date)
  return json({ ok: true })
})

on('GET', '/api/admin/report', async (env, req, url) => {
  const me = await authUser(env, req); needAdmin(me)
  const m = url.searchParams.get('month') || istDate().slice(0, 7)
  const [sess, marks, leaves, emps] = await Promise.all([
    env.DB.prepare('SELECT emp_id, date, start_at, end_at, total_km, manual_km_note FROM day_sessions WHERE date LIKE ? ORDER BY date').bind(`${m}-%`).all(),
    env.DB.prepare('SELECT emp_id, date, status FROM attendance_marks WHERE date LIKE ?').bind(`${m}-%`).all(),
    env.DB.prepare("SELECT emp_id, date, kind FROM leave_requests WHERE status = 'Approved' AND date LIKE ?").bind(`${m}-%`).all(),
    env.DB.prepare('SELECT * FROM employees ORDER BY team, name').all(),
  ])
  return json({ month: m, employees: emps.results.map(pub), sessions: sess.results, marks: marks.results, leaves: leaves.results })
})

// ── Payroll (monthly sheet) ────────────────────────────────────────────────
// Rates live on the employee (fixed = salary_inhand, da_local, da_hq, da_up, mobile_allow, ta_rate per km).
// Month inputs are auto-filled from attendance and can be overridden; saved per employee per month.
const PAY_KEYS = ['working_days', 'half_days', 'da_local_days', 'da_hq_days', 'da_up_days', 'km', 'incentives', 'last_month', 'advance', 'paid', 'note']
on('GET', '/api/admin/payroll', async (env, req, url) => {
  const me = await authUser(env, req); needAdmin(me)
  const m = /^\d{4}-\d{2}$/.test(url.searchParams.get('month') || '') ? url.searchParams.get('month') : istDate().slice(0, 7)
  const [sess, marks, emps, saved] = await Promise.all([
    env.DB.prepare('SELECT emp_id, date, total_km FROM day_sessions WHERE date LIKE ?').bind(`${m}-%`).all(),
    env.DB.prepare('SELECT emp_id, date, status FROM attendance_marks WHERE date LIKE ?').bind(`${m}-%`).all(),
    env.DB.prepare("SELECT * FROM employees WHERE role NOT IN ('developer', 'boss')").all(),
    env.DB.prepare('SELECT * FROM payroll WHERE month = ?').bind(m).all(),
  ])
  const [y, mo] = m.split('-').map(Number), dim = new Date(Date.UTC(y, mo, 0)).getUTCDate(), today = istDate()
  const S = new Map(sess.results.map((x) => [`${x.emp_id}|${x.date}`, x])), M = new Map(marks.results.map((x) => [`${x.emp_id}|${x.date}`, x.status]))
  const P = new Map(saved.results.map((x) => [x.emp_id, x]))
  const first = `${m}-01`, last = `${m}-${String(dim).padStart(2, '0')}`
  const rows = emps.results.filter((e) => (!e.joining_date || e.joining_date <= last) && (!e.exit_date || e.exit_date >= first) && (e.active || P.has(e.id) || sess.results.some((x) => x.emp_id === e.id)))
    .map((e) => {
      let full = 0, half = 0, daLocal = 0, km = 0
      for (let d = 1; d <= dim; d++) {
        const ds = `${m}-${String(d).padStart(2, '0')}`
        if (ds > today || (e.joining_date && ds < e.joining_date) || (e.exit_date && ds > e.exit_date)) continue
        const sun = new Date(ds + 'T12:00:00Z').getUTCDay() === 0, k = `${e.id}|${ds}`, mk = M.get(k), s = S.get(k)
        if (s) km += s.total_km || 0
        if (mk === 'Half Day') { half++; continue }
        if (mk === 'Absent' || mk === 'Leave') continue
        if (mk === 'Present' || mk === 'Week Off' || s || sun) { full++; if (!sun && mk !== 'Week Off') daLocal++ }
      }
      const auto = { working_days: full, half_days: half, da_local_days: e.da_local ? daLocal : 0, da_hq_days: 0, da_up_days: 0, km: Math.round(km), incentives: 0, last_month: 0, advance: 0, paid: 0, note: '' }
      const sv = P.get(e.id); const data = sv ? { ...auto, ...JSON.parse(sv.data || '{}') } : auto
      return { emp_id: e.id, emp_code: e.emp_code, name: e.name, designation: e.designation, department: e.department, phone: e.phone, joining_date: e.joining_date, active: !!e.active,
        rates: { fixed: e.salary_inhand || 0, da_local: e.da_local || 0, da_hq: e.da_hq || 0, da_up: e.da_up || 0, mobile: e.mobile_allow || 0, ta: e.ta_rate || 0 },
        auto, data, saved: !!sv, updated_at: sv?.updated_at || null }
    }).sort((a, b) => String(a.emp_code || 'ZZ').localeCompare(String(b.emp_code || 'ZZ')) || a.name.localeCompare(b.name))
  return json({ month: m, days_in_month: dim, rows })
})
on('POST', '/api/admin/payroll', async (env, req) => {
  const me = await authUser(env, req); needAdmin(me)
  const b = await body(req)
  if (!/^\d{4}-\d{2}$/.test(b.month || '') || !b.emp_id) throw bad('month / employee?')
  const d = {}; for (const k of PAY_KEYS) if (b[k] !== undefined && b[k] !== '') d[k] = k === 'note' ? String(b[k]).slice(0, 300) : Number(b[k]) || 0
  const old = await env.DB.prepare('SELECT data FROM payroll WHERE emp_id = ? AND month = ?').bind(Number(b.emp_id), b.month).first()
  const merged = { ...(old ? JSON.parse(old.data) : {}), ...d }
  await env.DB.prepare('INSERT INTO payroll (emp_id, month, data, updated_by, updated_at) VALUES (?,?,?,?,?) ON CONFLICT (emp_id, month) DO UPDATE SET data = excluded.data, updated_by = excluded.updated_by, updated_at = excluded.updated_at')
    .bind(Number(b.emp_id), b.month, JSON.stringify(merged), me.id, nowIso()).run()
  // rates are saved on the employee
  const r = b.rates || {}, rp = {}
  for (const [k, col] of [['fixed', 'salary_inhand'], ['da_local', 'da_local'], ['da_hq', 'da_hq'], ['da_up', 'da_up'], ['mobile', 'mobile_allow'], ['ta', 'ta_rate']]) if (r[k] !== undefined && r[k] !== '') rp[col] = Math.max(0, Number(r[k]) || 0)
  if (Object.keys(rp).length) await env.DB.prepare(`UPDATE employees SET ${Object.keys(rp).map((k) => `${k} = ?`).join(', ')} WHERE id = ?`).bind(...Object.values(rp), Number(b.emp_id)).run()
  await audit(env, me.id, 'payroll_edit', 'payroll', `${b.emp_id}:${b.month}`, old ? JSON.parse(old.data) : null, { ...merged, rates: rp })
  return json({ ok: true })
})

// ── Staff / logins ─────────────────────────────────────────────────────────
on('GET', '/api/admin/employees', async (env, req) => {
  const me = await authUser(env, req); needAdmin(me)
  return json({ employees: (await env.DB.prepare('SELECT * FROM employees ORDER BY active DESC, team, name').all()).results.map(pub) })
})
function roleAllowed(me, role) {
  if (role === 'developer') return me.role === 'developer'
  if (role === 'boss') return ['boss', 'developer'].includes(me.role)
  return true
}
on('POST', '/api/admin/employees', async (env, req) => {
  const me = await authUser(env, req); needAdmin(me)
  const b = await body(req)
  const phone = b.phone ? phone10(b.phone) : ''
  if (phone && phone.length !== 10) throw bad('Mobile must be 10 digits')
  if (!b.name) throw bad('Enter the name')
  if (b.password && String(b.password).length < 6) throw bad('Password must be at least 6 characters')
  if (!b.password && !phone) throw bad('Enter the 10-digit mobile number (it is the password) or set a password')
  // Employee ID: next JD number unless given; login User ID = Employee ID
  let empCode = String(b.emp_code || '').trim().toUpperCase()
  if (!empCode) { const r = await env.DB.prepare("SELECT MAX(CAST(SUBSTR(emp_code, 3) AS INTEGER)) AS n FROM employees WHERE emp_code LIKE 'JD%'").first(); empCode = 'JD' + ((r?.n || 1000) + 1) }
  if (!b.username) b.username = empCode
  const role = b.role || 'employee'
  if (!roleAllowed(me, role)) throw new HttpError(403, 'You cannot give this role')
  // username = नाम से (Atmaram Sambhaji Malik → atmaram), पहले से हो तो atmaram2, atmaram3…
  let username = String(b.username || '').trim().replace(/\s+/g, '')
  if (!username) {
    const base = String(b.name).trim().toLowerCase().split(/\s+/)[0].replace(/[^a-z0-9]/g, '') || 'user'
    username = base
    for (let i = 2; await env.DB.prepare('SELECT 1 FROM employees WHERE username = ? COLLATE NOCASE').bind(username).first(); i++) username = base + i
  }
  if (!/^[a-zA-Z0-9._-]{3,30}$/.test(username)) throw bad('Username can only have English letters/numbers (no spaces)')
  try {
    const sal = b.salary_inhand === '' || b.salary_inhand == null ? null : Math.max(0, Number(b.salary_inhand) || 0)
    await env.DB.prepare("INSERT INTO employees (username, name, phone, pass_hash, role, team, designation, department, work_location, shift_start, shift_end, joining_date, emp_code, salary_inhand, offer_letter, appointment_letter, documents, status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'Active')")
      .bind(username, String(b.name).trim(), phone || null, b.password ? await hashPassword(String(b.password)) : 'phone', role, b.team === 'Warehouse' ? 'Warehouse' : 'Office', b.designation || null, b.department || null, b.work_location || null, b.shift_start || '10:00', b.shift_end || '19:00', b.joining_date || null, empCode, sal, b.offer_letter || null, b.appointment_letter || null, b.documents || null).run()
  } catch (e) { if (/UNIQUE/i.test(String(e))) throw new HttpError(409, 'This username or mobile already exists'); throw e }
  await audit(env, me.id, 'employee_create', 'employees', username, null, { username, name: b.name, role, team: b.team })
  return json({ ok: true, username, emp_code: empCode })
})
// Team directory: upload an Excel / CSV sheet → update or add people (matched by Employee ID, then name)
on('POST', '/api/admin/directory-import', async (env, req) => {
  const me = await authUser(env, req); needAdmin(me)
  const b = await body(req)
  const rows = Array.isArray(b.rows) ? b.rows.slice(0, 300) : []
  if (!rows.length) throw bad('No rows found in the sheet')
  let updated = 0, added = 0; const skipped = []
  const t = (x) => (x == null ? '' : String(x).trim())
  for (const r of rows) {
    const code = t(r.emp_code).toUpperCase(), name = t(r.name)
    if (!code && !name) continue
    let e = code ? await env.DB.prepare('SELECT * FROM employees WHERE emp_code = ? COLLATE NOCASE').bind(code).first() : null
    if (!e && name) e = await env.DB.prepare('SELECT * FROM employees WHERE lower(name) = lower(?)').bind(name).first()
    const ph = t(r.phone) ? phone10(t(r.phone)) : ''
    const patch = {}
    if (name) patch.name = name
    if (code) patch.emp_code = code
    for (const k of ['designation', 'department', 'work_location', 'joining_date', 'exit_date', 'offer_letter', 'appointment_letter', 'documents', 'shift_start', 'shift_end']) if (t(r[k])) patch[k] = t(r[k])
    if (t(r.salary_inhand)) patch.salary_inhand = Number(String(r.salary_inhand).replace(/[^\d.]/g, '')) || null
    if (ph.length === 10 && !(await env.DB.prepare('SELECT 1 AS x FROM employees WHERE phone = ? AND id != ?').bind(ph, e?.id ?? 0).first())) patch.phone = ph
    else if (t(r.phone)) skipped.push(`${name || code}: mobile "${t(r.phone)}" not saved`)
    if (t(r.status)) { const st = /drop/i.test(r.status) ? 'Dropped' : /inact|left|exit/i.test(r.status) ? 'Inactive' : 'Active'; patch.status = st; patch.active = st === 'Active' ? 1 : 0 }
    if (!e) {
      if (!name) { skipped.push(`${code}: no name`); continue }
      const c = code || 'JD' + (((await env.DB.prepare("SELECT MAX(CAST(SUBSTR(emp_code, 3) AS INTEGER)) AS n FROM employees WHERE emp_code LIKE 'JD%'").first())?.n || 1000) + 1)
      if (await env.DB.prepare('SELECT 1 AS x FROM employees WHERE username = ? COLLATE NOCASE').bind(c).first()) { skipped.push(`${name}: ID ${c} already used`); continue }
      await env.DB.prepare("INSERT INTO employees (username, name, pass_hash, emp_code, status) VALUES (?, ?, 'phone', ?, 'Active')").bind(c, name, c).run()
      e = await env.DB.prepare('SELECT * FROM employees WHERE username = ?').bind(c).first(); added++
    } else updated++
    if (e.active && patch.active === 0) patch.token_version = e.token_version + 1
    const keys = Object.keys(patch)
    if (keys.length) await env.DB.prepare(`UPDATE employees SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`).bind(...keys.map((k) => patch[k]), e.id).run()
  }
  await audit(env, me.id, 'directory_upload', 'employees', null, null, { rows: rows.length, updated, added })
  return json({ ok: true, updated, added, skipped })
})
on('PATCH', '/api/admin/employees/:id', async (env, req, url, params) => {
  const me = await authUser(env, req); needAdmin(me)
  const b = await body(req)
  const e = await env.DB.prepare('SELECT * FROM employees WHERE id = ?').bind(params.id).first()
  if (!e) throw new HttpError(404, 'Not found')
  if (!roleAllowed(me, e.role)) throw new HttpError(403, 'You cannot change this login')
  const patch = {}
  if ('username' in b && b.username) { const u = String(b.username).trim().replace(/\s+/g, ''); if (!/^[a-zA-Z0-9._-]{3,30}$/.test(u)) throw bad('Username can only have English letters/numbers (no spaces)'); patch.username = u }
  if ('phone' in b) { const ph = b.phone ? phone10(b.phone) : ''; if (ph && ph.length !== 10) throw bad('Mobile must be 10 digits'); patch.phone = ph || null }
  for (const k of ['name', 'designation', 'department', 'work_location', 'shift_start', 'shift_end', 'joining_date', 'exit_date', 'emp_code', 'offer_letter', 'appointment_letter', 'documents']) if (k in b) patch[k] = b[k] === '' ? null : b[k]
  if ('salary_inhand' in b) patch.salary_inhand = b.salary_inhand === '' || b.salary_inhand == null ? null : Math.max(0, Number(b.salary_inhand) || 0)
  if ('status' in b && Number(params.id) !== me.id) {
    const st = ['Active', 'Inactive', 'Dropped'].includes(b.status) ? b.status : 'Active'
    patch.status = st; patch.active = st === 'Active' ? 1 : 0
    if (st !== 'Active' && e.active) patch.token_version = (patch.token_version ?? e.token_version) + 1
  }
  if ('team' in b) patch.team = b.team === 'Warehouse' ? 'Warehouse' : 'Office'
  if ('live_track' in b) patch.live_track = b.live_track ? 1 : 0
  if ('role' in b && b.role !== e.role) {
    if (Number(params.id) === me.id) throw bad('You cannot change your own role')
    if (!roleAllowed(me, b.role)) throw new HttpError(403, 'You cannot give this role')
    patch.role = b.role; patch.token_version = e.token_version + 1
  }
  if ('active' in b && Number(params.id) !== me.id) { patch.active = b.active ? 1 : 0; if (!b.active) patch.token_version = (patch.token_version ?? e.token_version) + 1 }
  if (b.new_password) { if (String(b.new_password).length < 6) throw bad('Password must be at least 6 characters'); patch.pass_hash = await hashPassword(String(b.new_password)); patch.token_version = (patch.token_version ?? e.token_version) + 1 }
  if (b.password_phone) patch.pass_hash = 'phone'
  if (b.unlink_device) patch.device_id = null
  const keys = Object.keys(patch)
  if (!keys.length) return json({ ok: true })
  await env.DB.prepare(`UPDATE employees SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`).bind(...keys.map((k) => patch[k]), e.id).run()
  const safe = (o) => Object.fromEntries(Object.entries(o).filter(([k]) => k !== 'pass_hash'))
  await audit(env, me.id, 'employee_update', 'employees', e.id, safe(Object.fromEntries(keys.map((k) => [k, e[k]]))), { ...safe(patch), ...(b.new_password ? { password: 'reset' } : b.password_phone ? { password: 'mobile number' } : {}) })
  return json({ ok: true })
})

// ── Developer: पुराने tracker का data import (दोबारा चलाना safe — legacy_id/client_id से duplicate नहीं) ──
// One-time import window: /api/setup/import बिना login चलता है जब तक 'legacy_import_done' set नहीं होता.
// kind:'done' भेजते ही हमेशा के लिए बंद. उसके बाद सिर्फ developer login से /api/dev/import.
on('POST', '/api/setup/import', async (env, req) => {
  const done = await env.DB.prepare("SELECT 1 AS x FROM app_settings WHERE key = 'legacy_import2_done'").first()
  if (done) throw new HttpError(403, 'Import window closed')
  const b = await body(req)
  if (b.kind === 'done') {
    await env.DB.prepare("INSERT OR IGNORE INTO app_settings (key, value) VALUES ('legacy_import2_done', ?)").bind(nowIso()).run()
    await audit(env, null, 'legacy_import_done', 'app_settings', null, null, null)
    return json({ ok: true, closed: true })
  }
  return importRows(env, b)
})
// पुराने modules का one-time import (अलग window — 'legacy_modules_done')
on('POST', '/api/setup/import-modules', async (env, req) => {
  if (await env.DB.prepare("SELECT 1 AS x FROM app_settings WHERE key = 'legacy_modules_done'").first()) throw new HttpError(403, 'Import window closed')
  const b = await body(req)
  if (b.kind === 'done') {
    await env.DB.prepare("INSERT OR IGNORE INTO app_settings (key, value) VALUES ('legacy_modules_done', ?)").bind(nowIso()).run()
    await audit(env, null, 'legacy_modules_done', 'app_settings', null, null, null)
    return json({ ok: true, closed: true })
  }
  if (b.kind !== 'legacy') throw bad('kind must be legacy')
  return importRows(env, b)
})

// ── Old data (पुराने system के modules) ─────────────────────────────────────────
// Boss/Developer: सब modules. HR: HR वाले modules (finance/P&L नहीं). दोनों नया record जोड़ और बदल सकते हैं (audit के साथ).
const HR_TABLES = new Set(['hr_companies', 'hr_employees', 'hr_invoices', 'hr_invoice_lines', 'hr_activity_log', 'salary_records', 'notices', 'notice_reads', 'daily_reports', 'day_entries', 'tasks', 'task_checklist', 'task_events', 'task_comments', 'projects', 'project_members', 'expense_claims', 'employee_desks', 'desks', 'quiz_attempts'])
const canTable = (me, tbl) => ['boss', 'developer'].includes(me.role) || (me.role === 'hr' && HR_TABLES.has(tbl))
on('GET', '/api/legacy/tables', async (env, req) => {
  const me = await authUser(env, req); needAdmin(me)
  const { results } = await env.DB.prepare('SELECT tbl, count(*) AS n FROM legacy_records GROUP BY tbl ORDER BY tbl').all()
  return json({ tables: results.filter((t) => canTable(me, t.tbl)) })
})
on('GET', '/api/legacy/rows', async (env, req, url) => {
  const me = await authUser(env, req); needAdmin(me)
  const tbl = url.searchParams.get('tbl') || ''
  if (!canTable(me, tbl)) throw new HttpError(403, 'This data is not for you')
  const q = (url.searchParams.get('q') || '').trim()
  const offset = Math.max(0, Number(url.searchParams.get('offset')) || 0)
  const limit = Math.min(1000, Math.max(1, Number(url.searchParams.get('limit')) || 200))
  const where = q ? 'tbl = ? AND data LIKE ?' : 'tbl = ?'
  const args = q ? [tbl, `%${q}%`] : [tbl]
  const total = (await env.DB.prepare(`SELECT count(*) AS n FROM legacy_records WHERE ${where}`).bind(...args).first()).n
  const { results } = await env.DB.prepare(`SELECT legacy_id, data FROM legacy_records WHERE ${where} ORDER BY CASE WHEN legacy_id LIKE 'n%' THEN 1 ELSE 0 END DESC, legacy_id DESC, CAST(legacy_id AS INTEGER) DESC LIMIT ? OFFSET ?`).bind(...args, limit, offset).all()
  return json({ tbl, total, offset, rows: results.map((r) => ({ ...JSON.parse(r.data), _rid: r.legacy_id })) })
})
const cleanData = (d) => {
  if (!d || typeof d !== 'object' || Array.isArray(d)) throw bad('data?')
  const o = {}
  for (const [k, v] of Object.entries(d)) { if (k === '_rid' || !/^[A-Za-z0-9_]{1,40}$/.test(k)) continue; o[k] = v === '' ? null : v }
  const t = JSON.stringify(o); if (t.length > 20000) throw bad('Record too large')
  return o
}
on('POST', '/api/legacy/rows', async (env, req) => {
  const me = await authUser(env, req); needAdmin(me)
  const b = await body(req)
  if (!/^[a-z_]{2,40}$/.test(b.tbl || '') || !canTable(me, b.tbl)) throw new HttpError(403, 'This data is not for you')
  const id = 'n' + Date.now() + Math.floor(Math.random() * 1000)
  const d = { ...cleanData(b.data), id, createdAt: nowIso(), createdBy_name: me.name }
  await env.DB.prepare('INSERT INTO legacy_records (tbl, legacy_id, data) VALUES (?, ?, ?)').bind(b.tbl, id, JSON.stringify(d)).run()
  await audit(env, me.id, 'record_add', b.tbl, id, null, d)
  return json({ ok: true, id })
})
on('PATCH', '/api/legacy/rows', async (env, req) => {
  const me = await authUser(env, req); needAdmin(me)
  const b = await body(req)
  if (!canTable(me, b.tbl || '')) throw new HttpError(403, 'This data is not for you')
  const old = await env.DB.prepare('SELECT data FROM legacy_records WHERE tbl = ? AND legacy_id = ?').bind(b.tbl, String(b.id)).first()
  if (!old) throw new HttpError(404, 'Record not found')
  const prev = JSON.parse(old.data)
  const d = { ...prev, ...cleanData(b.data), id: prev.id, updatedAt: nowIso(), updatedBy_name: me.name }
  await env.DB.prepare('UPDATE legacy_records SET data = ? WHERE tbl = ? AND legacy_id = ?').bind(JSON.stringify(d), b.tbl, String(b.id)).run()
  await audit(env, me.id, 'record_edit', b.tbl, String(b.id), prev, d)
  return json({ ok: true })
})


// ── Command Centre (Boss / Developer) + company pages ─────────────────────────
const cargoCses = async (env) => (await env.DB.prepare("SELECT e.id, e.name, e.legacy_id, e.team FROM desk_access a JOIN desks d ON d.id = a.desk_id JOIN employees e ON e.id = a.emp_id WHERE d.module = 'cargo' AND a.enabled = 1 AND e.active = 1 ORDER BY e.name").all()).results
const myDesks = async (env, id) => (await env.DB.prepare('SELECT d.* FROM desk_access a JOIN desks d ON d.id = a.desk_id WHERE a.emp_id = ? AND a.enabled = 1 AND d.active = 1 ORDER BY d.company, d.id').bind(id).all()).results
const activeEmps = async (env) => (await env.DB.prepare('SELECT id, name, team, role, designation, legacy_id, active FROM employees').all()).results
on('GET', '/api/cc/home', async (env, req, url) => {
  const me = await authUser(env, req); needAdmin(me)
  if (me.role === 'hr') throw new HttpError(403, 'Boss / Developer only')
  const [D, emps] = await Promise.all([loadAll(env), activeEmps(env)])
  const range = ['today', 'week', 'month'].includes(url.searchParams.get('range')) ? url.searchParams.get('range') : 'month'
  return json(homeSummary(D, emps, istDate(), range, url.searchParams.get('company') || 'All', await cargoCses(env)))
})
on('GET', '/api/cc/company', async (env, req, url) => {
  const me = await authUser(env, req); needAdmin(me)
  if (me.role === 'hr') throw new HttpError(403, 'Boss / Developer only')
  const name = url.searchParams.get('name') || ''
  if (!COMPANIES.includes(name)) throw bad('company?')
  const [D, emps] = await Promise.all([loadAll(env), activeEmps(env)])
  const range = ['today', 'week', 'month'].includes(url.searchParams.get('range')) ? url.searchParams.get('range') : 'month'
  const { results: desks } = await env.DB.prepare("SELECT d.id, d.name, d.icon, d.description, d.kind, d.module, (SELECT COUNT(*) FROM desk_access a JOIN employees e ON e.id = a.emp_id WHERE a.desk_id = d.id AND a.enabled = 1 AND e.active = 1) people FROM desks d WHERE d.company = ? AND d.active = 1 ORDER BY d.kind = 'later', d.id").bind(name).all()
  return json(companyPage(D, emps, istDate(), name, range, desks, await cargoCses(env)))
})
// Chat groups: 📢 Announcements (सब देखते हैं, सिर्फ admin लिखते हैं), 💬 General, हर project
const projectIdsOf = (D, e) => new Set(D.project_members.filter((m) => (e.legacy_id != null && String(m.personId) === String(e.legacy_id)) || String(m.emp_id || '') === String(e.id)).map((m) => String(m.projectId)))
on('GET', '/api/cc/chat', async (env, req, url) => {
  const me = await authUser(env, req)
  const D = await loadAll(env)
  const group = url.searchParams.get('group') || 'general'
  // employees only see project groups they are members of; Boss / HR / Developer see all
  const mine = projectIdsOf(D, me)
  const projects = D.projects.filter((p) => !/archiv|closed/i.test(String(p.status)) && (ADMIN_ROLES.includes(me.role) || mine.has(String(p.id)))).map((p) => ({ id: String(p.id), name: p.name }))
  if (!['ann', 'general'].includes(group) && !projects.some((p) => p.id === group)) throw new HttpError(403, 'You are not in this project group')
  const groups = [{ id: 'ann', name: 'Announcements', icon: '📢', everyone: true }, { id: 'general', name: 'General', icon: '💬' }, ...projects.map((p) => ({ ...p, icon: '📁' }))]
  const inGroup = (m) => (group === 'ann' ? m.channel === 'ann' : group === 'general' ? m.channel !== 'ann' && !m.projectId : m.channel !== 'ann' && String(m.projectId || '') === group)
  const msgs = D.chat_messages.filter((m) => (!m.deletedAt || m.deletedAt === 'None') && inGroup(m)).sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt))).slice(-200)
  const counts = {}; for (const m of D.chat_messages) { const k = m.channel === 'ann' ? 'ann' : m.projectId ? String(m.projectId) : 'general'; counts[k] = (counts[k] || 0) + 1 }
  return json({ me: me.name, me_id: me.id, can_announce: ADMIN_ROLES.includes(me.role), group, groups: groups.map((g) => ({ ...g, count: counts[g.id] || 0 })),
    messages: msgs.map((m) => ({ id: m._rid, sender: m.senderName, sender_emp: m.emp_id || null, body: m.body, kind: m.kind || 'text', file: m.fileId || null, file_name: m.fileName || null, file_mime: m.fileMime || null, file_size: m.fileSize || null, at: m.createdAt })) })
})
on('POST', '/api/cc/chat', async (env, req) => {
  const me = await authUser(env, req); const b = await body(req)
  const group = String(b.group || 'general')
  if (group === 'ann' && !ADMIN_ROLES.includes(me.role)) throw new HttpError(403, 'Only Boss / HR can post in Announcements')
  if (!['ann', 'general'].includes(group) && !ADMIN_ROLES.includes(me.role) && !projectIdsOf(await loadAll(env), me).has(group)) throw new HttpError(403, 'You are not in this project group')
  const text = String(b.body || '').replace(/\r/g, '').trim().slice(0, 4000)
  let file = null
  if (b.file && b.file.data) {
    const data = String(b.file.data)
    if (data.length > 950000) throw bad('File too large — send up to 700 KB')
    const mime = String(b.file.mime || 'application/octet-stream').slice(0, 80), name = String(b.file.name || 'file').slice(0, 120)
    const r = await env.DB.prepare('INSERT INTO chat_files (name, mime, size, data, by_emp) VALUES (?,?,?,?,?) RETURNING id').bind(name, mime, Math.round(data.length * 0.75), data, me.id).first()
    file = { id: r.id, name, mime, size: Math.round(data.length * 0.75) }
  }
  if (!text && !file) throw bad('Write a message')
  const id = 'n' + Date.now() + Math.floor(Math.random() * 1000)
  const kind = file ? (b.kind === 'voice' ? 'voice' : 'file') : 'text'
  const d = { id, projectId: group !== 'ann' && group !== 'general' ? (Number(group) || group) : null, channel: group === 'ann' ? 'ann' : null, senderId: me.legacy_id || null, senderName: me.name, body: text, kind,
    fileId: file?.id || null, fileName: file?.name || null, fileMime: file?.mime || null, fileSize: file?.size || null, createdAt: nowLocal(), emp_id: me.id }
  await env.DB.prepare('INSERT INTO legacy_records (tbl, legacy_id, data) VALUES (?, ?, ?)').bind('chat_messages', id, JSON.stringify(d)).run()
  dropCache(); return json({ ok: true })
})
on('GET', '/api/cc/chat/file/:id', async (env, req, url, p) => {
  await authUser(env, req)
  const f = await env.DB.prepare('SELECT name, mime, data FROM chat_files WHERE id = ?').bind(Number(p.id)).first()
  if (!f) throw new HttpError(404, 'File not found')
  const bin = Uint8Array.from(atob(f.data), (c) => c.charCodeAt(0))
  return new Response(bin, { headers: { 'Content-Type': f.mime, 'Content-Disposition': `inline; filename="${encodeURIComponent(f.name)}"`, 'Cache-Control': 'private, max-age=86400' } })
})

// ── Employee: home, desks, Cargo Sales desk ─────────────────────────────────
on('GET', '/api/my/home', async (env, req, url) => {
  const me = await authUser(env, req)
  // Boss / HR / Developer can open any employee's page (read-only) with ?as=<id>; employees only ever see their own
  let who = me
  const as = url.searchParams.get('as')
  if (as && ADMIN_ROLES.includes(me.role)) who = await env.DB.prepare('SELECT * FROM employees WHERE id = ?').bind(Number(as)).first() || me
  const out = myHome(await loadAll(env), who, istDate(), await myDesks(env, who.id))
  if (who !== me) {
    const day = await env.DB.prepare('SELECT start_at, end_at, total_km FROM day_sessions WHERE emp_id = ? AND date = ?').bind(who.id, istDate()).first()
    Object.assign(out, { viewing: true, emp_id: who.id, emp_code: who.emp_code || null, team: who.team, phone: who.phone || null, joining_date: who.joining_date || null, day: day || null })
  }
  return json(out)
})
on('GET', '/api/my/cargo', async (env, req, url) => {
  const me = await authUser(env, req)
  let who = me
  const as = url.searchParams.get('as')
  if (as && ADMIN_ROLES.includes(me.role)) who = await env.DB.prepare('SELECT * FROM employees WHERE id = ?').bind(Number(as)).first() || me
  const [D, emps] = await Promise.all([loadAll(env), activeEmps(env)])
  return json({ for: who.name, ...cargoDesk(D, who, emps, istDate(), await cargoCses(env), ADMIN_ROLES.includes(me.role)) })
})
const legacyPut = async (env, tbl, d) => {
  const id = 'n' + Date.now() + Math.floor(Math.random() * 1000)
  await env.DB.prepare('INSERT INTO legacy_records (tbl, legacy_id, data) VALUES (?, ?, ?)').bind(tbl, id, JSON.stringify({ id, ...d })).run()
  dropCache(); return id
}
const legacyGet = async (env, tbl, id) => {
  const r = await env.DB.prepare('SELECT data FROM legacy_records WHERE tbl = ? AND legacy_id = ?').bind(tbl, String(id)).first()
  return r ? JSON.parse(r.data) : null
}
const legacySet = async (env, tbl, id, d) => { await env.DB.prepare('UPDATE legacy_records SET data = ? WHERE tbl = ? AND legacy_id = ?').bind(JSON.stringify(d), tbl, String(id)).run(); dropCache() }
const nowLocal = () => new Date(Date.now() + 330 * 60000).toISOString().replace('T', ' ').slice(0, 19)
on('POST', '/api/my/lead-log', async (env, req) => {
  const me = await authUser(env, req); const b = await body(req)
  const lead = await legacyGet(env, 'ad_leads', b.leadId); if (!lead) throw new HttpError(404, 'Lead not found')
  const outcome = String(b.outcome || '').slice(0, 60); if (!outcome) throw bad('Choose a result')
  await legacyPut(env, 'cse_call_logs', { personId: me.legacy_id || null, emp_id: me.id, leadId: lead.id, outcome, note: String(b.note || '').slice(0, 500), nextFollowUp: b.next || null, createdAt: nowLocal() })
  const stage = String(b.stage || '').slice(0, 60)
  const upd = { ...lead, lastActivityAt: nowLocal(), updatedAt: nowLocal(), ...(b.next ? { nextFollowUp: b.next } : {}), ...(stage ? { stage, stageChangedAt: nowLocal() } : {}) }
  await legacySet(env, 'ad_leads', b.leadId, upd)
  await audit(env, me.id, 'lead_log', 'ad_leads', String(b.leadId), { stage: lead.stage }, { stage: upd.stage, outcome })
  return json({ ok: true })
})
on('POST', '/api/my/cargo-quote', async (env, req) => {
  const me = await authUser(env, req); const b = await body(req)
  const name = String(b.customerName || '').trim(); if (!name) throw bad('Customer name')
  const L = Number(b.lengthCm) || 0, W = Number(b.breadthCm) || 0, H = Number(b.heightCm) || 0, kg = Number(b.actualKg) || 0
  const vol = Math.round((L * W * H / 5000) * 100) / 100, charge = Math.max(kg, vol), rate = Number(b.rate) || 0
  const id = await legacyPut(env, 'cargo_quotes', { date: istDate(), personId: me.legacy_id || null, emp_id: me.id, cseName: me.name, leadId: b.leadId || null, customerName: name, phone: String(b.phone || ''),
    pickupPincode: String(b.pickupPincode || ''), dropPincode: String(b.dropPincode || ''), actualKg: kg, lengthCm: L, breadthCm: W, heightCm: H, volumetricKg: vol, chargeableKg: charge, rate, total: Math.round(charge * rate), status: 'Sent', createdAt: nowLocal() })
  if (b.leadId) { const l = await legacyGet(env, 'ad_leads', b.leadId); if (l) await legacySet(env, 'ad_leads', b.leadId, { ...l, stage: 'Quotation Sent', lastActivityAt: nowLocal(), stageChangedAt: nowLocal() }) }
  return json({ ok: true, id, volumetricKg: vol, chargeableKg: charge, total: Math.round(charge * rate) })
})
on('POST', '/api/my/cargo-order', async (env, req) => {
  const me = await authUser(env, req); const b = await body(req)
  const name = String(b.customerName || '').trim(); if (!name) throw bad('Customer name')
  const amount = Number(b.amount) || 0; if (amount <= 0) throw bad('Enter amount')
  const vendorCost = Number(b.vendorCost) || 0
  if (vendorCost <= 0) throw bad('Vendor cost is required')
  const markupPct = Math.round(((amount - vendorCost) / vendorCost) * 100)
  const needApproval = amount < vendorCost * 1.4
  const id = await legacyPut(env, 'cargo_orders', { date: istDate(), customerName: name, phone: String(b.phone || ''), mode: String(b.mode || 'Road Cargo'), kg: Number(b.kg) || 0, amount,
    personId: me.legacy_id || null, emp_id: me.id, cseName: me.name, leadId: b.leadId || null, notes: String(b.notes || '').slice(0, 500), pickupAddress: String(b.pickupAddress || ''), consigneeName: String(b.consigneeName || ''),
    vendorName: String(b.vendorName || ''), vendorCost, markupPct, approvalStatus: needApproval ? 'pending' : '', stage: 'Booked', createdAt: nowLocal() })
  if (b.leadId) { const l = await legacyGet(env, 'ad_leads', b.leadId); if (l) await legacySet(env, 'ad_leads', b.leadId, { ...l, stage: 'Booking', converted: 1, revenue: amount, lastActivityAt: nowLocal(), stageChangedAt: nowLocal() }) }
  await audit(env, me.id, 'cargo_order', 'cargo_orders', id, null, { amount, markupPct })
  return json({ ok: true, id, markupPct, pending: needApproval, min_price: Math.ceil(vendorCost * 1.4) })
})
on('POST', '/api/my/task-done', async (env, req) => {
  const me = await authUser(env, req); const b = await body(req)
  const t = await legacyGet(env, 'tasks', b.id); if (!t) throw new HttpError(404, 'Task not found')
  if (String(t.assigneeId) !== String(me.legacy_id) && String(t.assignee_emp || '') !== String(me.id) && !ADMIN_ROLES.includes(me.role)) throw new HttpError(403, 'This is not your task')
  await legacySet(env, 'tasks', b.id, { ...t, status: b.done === false ? 'Open' : 'Done', closedAt: b.done === false ? null : nowLocal() })
  return json({ ok: true })
})

registerDesks(on, { authUser, needAdmin, json, body, bad, HttpError, istDate, audit, ADMIN_ROLES, loadAll, dropCache, legacyGet, legacySet, legacyPut, nowLocal })

// Import page (सिर्फ import window खुली हो तब) — JSON file चुनो, chunks में भेजता है
on('GET', '/api/setup/import-page', async (env) => {
  const done = await env.DB.prepare("SELECT 1 AS x FROM app_settings WHERE key = 'legacy_import2_done'").first()
  if (done) return new Response('Import window closed', { status: 403 })
  const html = `<!doctype html><meta charset=utf-8><title>JDAC import</title><body style="font:15px system-ui;padding:24px">
<h2>JDAC Tracker — old data import</h2><input type=file id=f accept=".json"><pre id=o></pre>
<script>
const o=document.getElementById('o'),log=(t)=>o.textContent+=t+'\\n'
document.getElementById('f').onchange=async(e)=>{const d=JSON.parse(await e.target.files[0].text())
for(const kind of ['sessions','pings','marks','leaves']){const a=d[kind]||[];let ins=0
for(let i=0;i<a.length;i+=500){const r=await fetch('/api/setup/import',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({kind,rows:a.slice(i,i+500)})});const j=await r.json();if(!r.ok){log(kind+' ERROR '+JSON.stringify(j));return}ins+=j.inserted||0}
log(kind+': '+a.length+' rows, '+ins+' new')}
const c=await (await fetch('/api/setup/import',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({kind:'done'})})).json()
log('DONE — import window closed: '+JSON.stringify(c));document.title='IMPORT DONE'}
</script>`
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } })
})
on('POST', '/api/dev/import', async (env, req) => {
  const me = await authUser(env, req); needDev(me)
  return importRows(env, await body(req))
})
async function importRows(env, b) {
  const kind = b.kind, rows = Array.isArray(b.rows) ? b.rows : []
  if (rows.length > 1000) throw bad('max 1000 rows per call')
  if (kind === 'employees') {
    // पुराने (छोड़ चुके) employees — inactive, random password (login नहीं होगा)
    let ins = 0
    for (const r of rows) {
      const u = String(r.username || '').toLowerCase()
      if (!/^[a-z0-9._-]{3,30}$/.test(u) || !r.name) continue
      const pw = await hashPassword(bytesToB64(crypto.getRandomValues(new Uint8Array(18))))
      const x = await env.DB.prepare("INSERT OR IGNORE INTO employees (username, name, pass_hash, role, team, designation, active, legacy_id) VALUES (?, ?, ?, 'employee', ?, ?, 0, ?)")
        .bind(u, String(r.name), pw, r.team === 'Warehouse' ? 'Warehouse' : 'Office', r.designation || 'Former employee', r.legacy_id || null).run()
      ins += x.meta?.changes || 0
    }
    return json({ ok: true, kind, received: rows.length, inserted: ins })
  }
  if (kind === 'legacy') {
    const ok = rows.filter((r) => /^[a-z_]{2,40}$/.test(r.tbl || '') && r.id != null && r.data && typeof r.data === 'object')
    if (!ok.length) return json({ ok: true, kind, received: rows.length, inserted: 0 })
    const J = JSON.stringify(ok.map((r) => ({ t: r.tbl, i: String(r.id), d: JSON.stringify(r.data) })))
    const x = await env.DB.prepare("INSERT OR IGNORE INTO legacy_records (tbl, legacy_id, data) SELECT j->>'t', j->>'i', j->>'d' FROM (SELECT value AS j FROM json_each(?))").bind(J).run()
    return json({ ok: true, kind, received: rows.length, inserted: x.meta?.changes ?? 0 })
  }
  if (kind === 'photos') {
    // पुरानी selfie → savePhoto (Supabase हो तो वहाँ, नहीं तो D1) → session में ref
    if (rows.length > 40) throw bad('max 40 photos per call')
    let ins = 0
    for (const r of rows) {
      const col = r.which === 'end' ? 'end_photo' : 'start_photo'
      const s = await env.DB.prepare(`SELECT id, ${col} AS ref FROM day_sessions WHERE legacy_id = ?`).bind(r.legacy_id).first()
      if (!s || s.ref || !r.b64) continue
      const ref = await savePhoto(env, `legacy/${r.legacy_id}-${r.which === 'end' ? 'end' : 'start'}.jpg`, r.b64)
      await env.DB.prepare(`UPDATE day_sessions SET ${col} = ? WHERE id = ? AND ${col} IS NULL`).bind(ref, s.id).run()
      ins++
    }
    return json({ ok: true, kind, received: rows.length, inserted: ins })
  }
  const emps = (await env.DB.prepare('SELECT id, username FROM employees').all()).results
  const uid = Object.fromEntries(emps.map((e) => [e.username.toLowerCase(), e.id]))
  const data = rows.map((r) => ({ ...r, emp_id: uid[String(r.username || '').toLowerCase()] })).filter((r) => r.emp_id)
  const J = JSON.stringify(data)
  const q = {
    sessions: `INSERT OR IGNORE INTO day_sessions (legacy_id, emp_id, date, start_at, start_lat, start_lng, end_at, end_lat, end_lng, total_km, manual_km, manual_km_note, auto_closed)
      SELECT j->>'legacy_id', j->>'emp_id', j->>'date', j->>'start_at', j->>'start_lat', j->>'start_lng', j->>'end_at', j->>'end_lat', j->>'end_lng', COALESCE(j->>'total_km',0), COALESCE(j->>'manual_km',0), j->>'manual_km_note', COALESCE(j->>'auto_closed',0)
      FROM (SELECT value AS j FROM json_each(?)) WHERE j->>'end_at' IS NULL OR j->>'end_at' >= j->>'start_at'`,
    pings: `INSERT OR IGNORE INTO location_pings (client_id, emp_id, date, lat, lng, kind, recorded_at, created_at)
      SELECT j->>'client_id', j->>'emp_id', j->>'date', j->>'lat', j->>'lng', CASE WHEN j->>'kind'='field' THEN 'field' ELSE 'duty' END, j->>'recorded_at', j->>'recorded_at'
      FROM (SELECT value AS j FROM json_each(?)) WHERE (j->>'lat') BETWEEN -90 AND 90 AND (j->>'lng') BETWEEN -180 AND 180 AND NOT ((j->>'lat') = 0 AND (j->>'lng') = 0)`,
    marks: `INSERT OR IGNORE INTO attendance_marks (emp_id, date, status, reason, legacy, set_at)
      SELECT j->>'emp_id', j->>'date', j->>'status', 'old tracker', 1, j->>'set_at' FROM (SELECT value AS j FROM json_each(?)) WHERE j->>'status' IN ('Present','Half Day','Absent','Leave','Week Off')`,
    leaves: `INSERT OR IGNORE INTO leave_requests (legacy_id, emp_id, date, kind, reason, status, decided_at, created_at)
      SELECT j->>'legacy_id', j->>'emp_id', j->>'date', CASE WHEN j->>'kind'='Half day' THEN 'Half day' ELSE 'Full day' END, j->>'reason', j->>'status', j->>'decided_at', j->>'created_at' FROM (SELECT value AS j FROM json_each(?))`,
  }[kind]
  if (!q) throw bad('kind must be sessions | pings | marks | leaves')
  const r = await env.DB.prepare(q).bind(J).run()
  return json({ ok: true, kind, received: rows.length, matched: data.length, inserted: r.meta?.changes ?? 0 })
}

// ── Developer ───────────────────────────────────────────────────────────
on('GET', '/api/dev/system', async (env, req) => {
  const me = await authUser(env, req); needDev(me)
  const today = istDate()
  const r = await env.DB.prepare(`SELECT
      (SELECT count(*) FROM employees WHERE active=1) employees,
      (SELECT count(*) FROM employees WHERE active=1 AND role IN ('hr','boss','developer')) admins,
      (SELECT count(*) FROM location_pings) pings_total,
      (SELECT count(*) FROM location_pings WHERE date = ?1) pings_today,
      (SELECT count(*) FROM day_sessions WHERE date = ?1) sessions_today,
      (SELECT count(*) FROM photos WHERE moved = 0) photos_waiting,
      (SELECT count(*) FROM alerts WHERE closed_at IS NULL) open_alerts`).bind(today).first()
  let dbBytes = null
  try { const p = await env.DB.prepare('SELECT page_count * page_size AS b FROM pragma_page_count(), pragma_page_size()').first(); dbBytes = p?.b ?? null } catch { /* D1 may block pragma */ }
  const { results: phones } = await env.DB.prepare(`SELECT e.id, e.name, e.team, e.work_location, l.recorded_at, l.synced_at, l.kind
      FROM employees e LEFT JOIN last_location l ON l.emp_id = e.id WHERE e.active = 1 AND (e.team = 'Warehouse' OR e.live_track = 1) ORDER BY e.name`).all()
  return json({ ...r, usage: await usageSummary(env), db_bytes: dbBytes, db_limit_bytes: 500 * 1024 * 1024, supabase: !!(env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY), phones })
})
on('GET', '/api/dev/audit', async (env, req) => {
  const me = await authUser(env, req); if (!['boss', 'developer'].includes(me.role)) throw new HttpError(403, 'Not allowed')
  const { results } = await env.DB.prepare('SELECT a.*, e.name AS actor_name FROM audit_log a LEFT JOIN employees e ON e.id = a.actor ORDER BY a.id DESC LIMIT 100').all()
  return json({ audit: results })
})
on('GET', '/api/admin/alerts', async (env, req) => {
  const me = await authUser(env, req); needAdmin(me)
  const { results } = await env.DB.prepare('SELECT a.*, e.name FROM alerts a JOIN employees e ON e.id = a.emp_id WHERE a.closed_at IS NULL ORDER BY a.opened_at DESC').all()
  return json({ alerts: results })
})

// ── Cron: हर 5 मिनट ─────────────────────────────────────────────────────────
export async function runCron(env) {
  const today = istDate()
  const now = Date.now()
  const { results } = await env.DB.prepare(`SELECT s.emp_id, l.recorded_at FROM day_sessions s
      JOIN employees e ON e.id = s.emp_id AND (e.team = 'Warehouse' OR e.live_track = 1) AND e.active = 1
      LEFT JOIN last_location l ON l.emp_id = s.emp_id
      WHERE s.date = ? AND s.end_at IS NULL`).bind(today).all()
  for (const r of results) {
    const mins = r.recorded_at ? (now - Date.parse(r.recorded_at)) / 60000 : Infinity
    if (mins > NO_SIGNAL_MIN) {
      await env.DB.prepare("INSERT OR IGNORE INTO alerts (emp_id, date, kind, detail, opened_at) VALUES (?, ?, 'no_signal', ?, ?)")
        .bind(r.emp_id, today, r.recorded_at ? `last GPS ${r.recorded_at}` : 'no GPS yet', nowIso()).run()
    }
  }
  // 24 घंटे वाला auto-logout (सिर्फ GPS वाले phone logins) + Boss/HR dashboard पर alert
  const cutoff = new Date(now - AUTO_LOGOUT_HOURS * 3600000).toISOString()
  const { results: stale } = await env.DB.prepare('SELECT id, name, app_login_at FROM employees WHERE app_login_at IS NOT NULL AND app_login_at < ?').bind(cutoff).all()
  for (const e of stale) {
    const s = await env.DB.prepare('SELECT id, date, start_at FROM day_sessions WHERE emp_id = ? AND end_at IS NULL ORDER BY date DESC LIMIT 1').bind(e.id).first()
    let endAt = null
    if (s) {
      const last = await env.DB.prepare('SELECT max(recorded_at) t FROM location_pings WHERE emp_id = ? AND date = ?').bind(e.id, s.date).first()
      endAt = last?.t && last.t > s.start_at ? last.t : nowIso()
      await env.DB.prepare('UPDATE day_sessions SET end_at = ?, auto_closed = 1 WHERE id = ? AND end_at IS NULL').bind(endAt, s.id).run()
    }
    await env.DB.prepare('UPDATE employees SET token_version = token_version + 1, app_login_at = NULL WHERE id = ?').bind(e.id).run()
    await env.DB.prepare("INSERT OR IGNORE INTO alerts (emp_id, date, kind, detail, opened_at) VALUES (?, ?, 'auto_logout', ?, ?)")
      .bind(e.id, today, `logged in ${e.app_login_at}${endAt ? ' · day closed ' + endAt : ''}`, nowIso()).run()
    await env.DB.prepare("UPDATE alerts SET closed_at = ? WHERE emp_id = ? AND kind = 'no_signal' AND closed_at IS NULL").bind(nowIso(), e.id).run()
    await audit(env, null, 'auto_logout_24h', 'employees', e.id, null, { login_at: e.app_login_at, day_closed: endAt })
  }
  // आधी रात: जो day close करना भूले, उन्हें auto-close (end = आखिरी GPS का समय)
  const { results: open } = await env.DB.prepare('SELECT s.id, s.emp_id, s.date, s.start_at FROM day_sessions s WHERE s.end_at IS NULL AND s.date < ?').bind(today).all()
  for (const s of open) {
    const last = await env.DB.prepare('SELECT max(recorded_at) t FROM location_pings WHERE emp_id = ? AND date = ?').bind(s.emp_id, s.date).first()
    const end = last?.t && last.t > s.start_at ? last.t : s.start_at
    await env.DB.prepare('UPDATE day_sessions SET end_at = ?, auto_closed = 1 WHERE id = ? AND end_at IS NULL').bind(end, s.id).run()
    await audit(env, null, 'auto_close', 'day_sessions', s.id, null, { end_at: end })
  }
  await flushPendingPhotos(env)
}

// TOKEN_SECRET: Cloudflare secret हो तो वही; नहीं तो पहली request पर random बनाकर D1 में रखते हैं
// (dashboard में किसी को secret type/copy नहीं करना पड़ता).
let cachedSecret = null
async function tokenSecret(env) {
  if (env.TOKEN_SECRET) return env.TOKEN_SECRET
  if (cachedSecret) return cachedSecret
  await env.DB.prepare("INSERT OR IGNORE INTO app_settings (key, value) VALUES ('token_secret', ?)").bind(bytesToB64(crypto.getRandomValues(new Uint8Array(48)))).run()
  cachedSecret = (await env.DB.prepare("SELECT value FROM app_settings WHERE key = 'token_secret'").first()).value
  return cachedSecret
}

// ── Self-setup: पहली request पर tables खुद बनते हैं (dashboard में SQL चलाने की ज़रूरत नहीं) ──
// SCHEMA_STATEMENTS bundle के समय api/schema.sql से भरता है; tests में schema पहले से होता है.
let schemaReady = false
async function ensureSchema(env) {
  if (schemaReady) return
  // GitHub (wrangler) deploy में SCHEMA_STATEMENTS नहीं होता — तब भी migrations ज़रूर चलें
  if (typeof SCHEMA_STATEMENTS !== 'undefined') {
    const has = await env.DB.prepare("SELECT 1 AS x FROM sqlite_master WHERE type='table' AND name='app_settings'").first()
    if (!has) await env.DB.batch(SCHEMA_STATEMENTS.map((q) => env.DB.prepare(q)))
  }
  await runMigrations(env)
  schemaReady = true
}

// One-time data fixes (हर एक सिर्फ एक बार, audit के साथ)
async function runMigrations(env) {
  const done = async (k) => !!(await env.DB.prepare('SELECT 1 AS x FROM app_settings WHERE key = ?').bind(k).first())
  const mark = (k) => env.DB.prepare('INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)').bind(k, new Date().toISOString()).run()
  if (!(await env.DB.prepare("SELECT 1 AS x FROM pragma_table_info('employees') WHERE name = 'app_login_at'").first())) {
    await env.DB.prepare('ALTER TABLE employees ADD COLUMN app_login_at TEXT').run()
  }
  for (const [col, def] of [['status', 'TEXT'], ['exit_date', 'TEXT'], ['salary_inhand', 'REAL'], ['emp_code', 'TEXT'], ['offer_letter', 'TEXT'], ['appointment_letter', 'TEXT'], ['documents', 'TEXT'], ['da_local', 'REAL'], ['da_hq', 'REAL'], ['da_up', 'REAL'], ['mobile_allow', 'REAL'], ['ta_rate', 'REAL']]) {
    if (!(await env.DB.prepare("SELECT 1 AS x FROM pragma_table_info('employees') WHERE name = ?").bind(col).first())) await env.DB.prepare(`ALTER TABLE employees ADD COLUMN ${col} ${def}`).run()
  }
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS chat_files (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, mime TEXT, size INTEGER, data TEXT NOT NULL, by_emp INTEGER, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')))`).run()
  if (!(await done('mig_people_v1'))) {
    // Org chart: Director = "Boss"; Snehal = HR Recruiter; Atul ने company छोड़ी (list से हटाओ — record रहता है)
    await env.DB.prepare("UPDATE employees SET name = 'Boss', designation = 'Director' WHERE role = 'boss'").run()
    await env.DB.prepare("UPDATE employees SET designation = 'HR Recruiter' WHERE name LIKE 'Snehal%'").run()
    await env.DB.prepare("UPDATE employees SET active = 0, status = 'Inactive', token_version = token_version + 1 WHERE name LIKE 'Atul%' AND role = 'employee'").run()
    await env.DB.prepare("UPDATE employees SET status = CASE WHEN active = 1 THEN 'Active' ELSE 'Inactive' END WHERE status IS NULL").run()
    await mark('mig_people_v1')
  }
  if (!(await done('mig_directory_v1'))) {
    // HR की employee sheet (19 Nov 2026) — EMP.ID, designation, joining, contact, time, city, salary, offer / appointment / documents
    // [code, sheet name, tracker name, designation, joining, phone, shift start, shift end, city, salary, offer, appointment, documents, team]
    const H = ['10:00', '19:00'], C = ['10:00', '20:00'], G = ['09:00', '18:00']
    const rows = [
      ['JD1001', 'Atmaram Sambhaji Malik', 'Atmaram Sambhaji Malik', 'Warehouse Incharge', '2025-04-03', '7757959644', G, 'Goa', 22000, 'Allotted', 'Pending', 'Submitted', 'Warehouse'],
      ['JD1002', 'Yogesh', 'Yogesh', 'Logistics Coordinator', '2025-04-03', '8390049523', G, 'Goa', 16000, 'Allotted', 'Pending', null, 'Warehouse'],
      ['JD1003', 'Shubham', 'Shubham', 'Pune Camp Incharge', '2025-04-17', '8983967180', H, 'Pune Camp', 25000, 'Allotted', 'Pending', null, 'Warehouse'],
      ['JD1006', 'Om Adsul', 'Om Adsul', 'Operation Manager', '2025-11-10', '9136615178', H, 'Pune HO', 22000, 'Allotted', null, null, 'Office'],
      ['JD1008', 'Nameera', 'Nameera', 'HR Manager', '2026-06-02', '8856860696', H, 'Pune HO', 24000, 'Allotted', null, 'Submitted', 'Office'],
      ['JD1009', 'Neetu', 'Neetu', 'Customer Success Executive', '2026-06-15', '8530481556', H, 'Pune HO', 18000, 'Allotted', 'Allotted', 'Submitted', 'Office'],
      ['JD1012', 'Balaji', 'Balaji', 'Project Manager', '2026-07-13', '7588547132', H, 'Pune HO', 27500, 'Allotted', 'Allotted', 'Submitted', 'Office'],
      ['JD1013', 'Zubair', 'Zubair', 'Medical Representative', '2026-07-14', '7798763750', H, 'Pune HO', 20000, 'Allotted', 'Allotted', 'Submitted', null],
      ['JD1014', 'Tanuja', 'Tanuja', 'Customer Success Executive', '2026-07-16', '8329813223', H, 'Pune HO', 18000, 'Allotted', 'Allotted', 'Submitted', 'Office'],
      ['JD1015', 'Snehal B', 'Snehal', 'HR Recruiter', '2026-08-03', '9075756438', H, 'Pune HO', 16000, 'Allotted', 'Allotted', 'Submitted', 'Office'],
      ['JD1016', 'Om PM', 'Om PM', 'Performance Marketing', '2026-08-10', '8767728297', H, 'Pune HO', 20000, 'Allotted', 'Allotted', 'Submitted', 'Office'],
      ['JD1017', 'Himanshu', 'Himanshu', 'Graphic Designer', '2026-08-10', '7888113974', H, 'Pune HO', 30000, 'Allotted', 'Allotted', 'Submitted', 'Office'],
      ['JD1018', 'Swapnil', 'Swapnil', 'Social Media Manager', '2026-08-04', '9067551551', H, 'Pune HO', 24000, 'Allotted', 'Allotted', 'Submitted', 'Office'],
      ['JD1020', 'Mohin', 'Mohin', 'Customer Success Executive', '2026-09-07', '9172821197', H, 'Pune HO', 26000, 'Allotted', 'Allotted', 'Submitted', 'Office'],
      ['JD1021', 'Abrar', 'Abrar', 'Logistics Coordinator', '2026-08-24', '8888978680', C, 'Pune Camp', 20000, 'Pending', 'Pending', 'Submitted', 'Warehouse'],
      ['JD1023', 'Snehal Z', 'Snehal S', 'Accountant', '2026-10-26', null, H, 'Pune HO', 30000, 'Pending', 'Pending', 'Submitted', 'Office'],
      ['JD1024', 'Samadhan', 'Samadhan', 'Warehouse Executive', '2026-11-02', '9561816127', C, 'Pune Camp', 22000, 'Allotted', 'Allotted', 'Submitted', 'Warehouse'],
      ['JD1025', 'Imran', 'Imran', 'Customer Success Executive', '2026-11-16', '7721004936', H, 'Pune HO', 19000, 'Pending', 'Pending', 'Submitted', 'Office'],
      ['JD1026', 'Sushil', 'Sushil', 'Warehouse Executive', '2026-11-16', '8956968693', C, 'Pune Camp', 22000, 'Allotted', 'Allotted', 'Submitted', 'Warehouse'],
      ['JD1027', 'Mustafa', 'Mustafa', 'Warehouse Executive', '2026-11-16', '7355613532', C, 'Pune Camp', 20000, 'Allotted', 'Allotted', 'Submitted', 'Warehouse'],
    ]
    for (const [code, sheetName, trName, des, join, phone, [ss, se], city, sal, offer, appt, docs, team] of rows) {
      let e = await env.DB.prepare('SELECT * FROM employees WHERE emp_code = ? OR lower(name) = lower(?) OR lower(name) = lower(?) ORDER BY (emp_code = ?) DESC LIMIT 1').bind(code, trName, sheetName, code).first()
      // phone किसी और के पास पहले से हो तो उसे न छेड़ें (UNIQUE)
      const ph = phone && !(await env.DB.prepare('SELECT 1 AS x FROM employees WHERE phone = ? AND id != ?').bind(phone, e?.id ?? 0).first()) ? phone : null
      if (!e) {
        // नया व्यक्ति — login बंद ('locked'); HR "Make new password" से password देगा
        let u = sheetName.toLowerCase().replace(/[^a-z0-9]/g, '')
        if (await env.DB.prepare('SELECT 1 AS x FROM employees WHERE username = ?').bind(u).first()) u = u + code.slice(-2)
        await env.DB.prepare("INSERT INTO employees (name, username, phone, pass_hash, role, team, designation, work_location, shift_start, shift_end, joining_date, active, status) VALUES (?,?,?,?, 'employee', ?,?,?,?,?,?, 1, 'Active')")
          .bind(sheetName, u, ph, 'locked', team || 'Office', des, city, ss, se, join).run()
        e = await env.DB.prepare('SELECT * FROM employees WHERE username = ?').bind(u).first()
      }
      await env.DB.prepare(`UPDATE employees SET name = ?, emp_code = ?, designation = ?, joining_date = ?, phone = COALESCE(?, phone), shift_start = ?, shift_end = ?, work_location = ?, salary_inhand = ?,
          offer_letter = ?, appointment_letter = ?, documents = ?, team = COALESCE(?, team), active = 1, status = 'Active' WHERE id = ?`)
        .bind(sheetName === 'Snehal Z' ? 'Snehal Z' : (sheetName === 'Snehal B' ? 'Snehal B' : e.name), code, des, join, ph, ss, se, city, sal, offer, appt, docs, team, e.id).run()
    }
    await audit(env, null, 'directory_import', 'employees', null, null, { rows: rows.length })
    await mark('mig_directory_v1')
  }
  await env.DB.prepare('CREATE TABLE IF NOT EXISTS payroll (id INTEGER PRIMARY KEY AUTOINCREMENT, emp_id INTEGER NOT NULL, month TEXT NOT NULL, data TEXT, updated_by INTEGER, updated_at TEXT, UNIQUE (emp_id, month))').run()
  if (!(await done('mig_org_v2'))) {
    // 19 Nov 2026 (Darshan): Boss = Darshan Sir; left: Rahul, Ashish, Cathrine, Priyanka; Mohin → Operation Manager; Balaji → CSE; departments for the org chart
    await env.DB.prepare("UPDATE employees SET name = 'Darshan Sir', designation = 'Director' WHERE role = 'boss'").run()
    for (const n of ['Rahul', 'Ashish', 'Cathrine', 'Priyanka']) await env.DB.prepare("UPDATE employees SET active = 0, status = 'Inactive', token_version = token_version + 1 WHERE role = 'employee' AND lower(name) LIKE lower(?) AND active = 1").bind(n + '%').run()
    await env.DB.prepare("UPDATE employees SET designation = 'Operation Manager' WHERE emp_code = 'JD1020'").run()
    await env.DB.prepare("UPDATE employees SET designation = 'Customer Success Executive' WHERE emp_code = 'JD1012'").run()
    const DEP = { 'Govaa Bazaar Warehouse': ['JD1001', 'JD1002'], 'Delivery team': ['JD1003', 'JD1021', 'JD1024', 'JD1026', 'JD1027'], Operations: ['JD1006', 'JD1020'],
      'Customer Success': ['JD1009', 'JD1012', 'JD1014', 'JD1025'], Accounts: ['JD1023'], Marketing: ['JD1016', 'JD1017', 'JD1018'], 'Medical sales': ['JD1013'], HR: ['JD1008', 'JD1015'] }
    for (const [d, codes] of Object.entries(DEP)) for (const c of codes) await env.DB.prepare('UPDATE employees SET department = ? WHERE emp_code = ?').bind(d, c).run()
    await mark('mig_org_v2')
  }
  if (!(await done('mig_login_v1'))) {
    // Login: User ID = Employee ID (JD1001), password = own 10-digit mobile number. Existing sessions stay logged in.
    await env.DB.prepare("UPDATE employees SET username = emp_code, pass_hash = 'phone' WHERE emp_code IS NOT NULL AND phone IS NOT NULL AND role != 'developer' AND NOT EXISTS (SELECT 1 FROM employees x WHERE x.username = employees.emp_code COLLATE NOCASE AND x.id != employees.id)").run()
    await mark('mig_login_v1')
  }
  for (const q of DESK_TABLES) { try { await env.DB.prepare(q).run() } catch (e) { console.error('desk table', e?.message) } }
  if (!(await done('mig_desks_v1'))) { try { await migrateDesks(env, (await env.DB.prepare('SELECT id, legacy_id FROM employees').all()).results); await mark('mig_desks_v1') } catch (e) { console.error('desk migration', e?.message) } }
  await env.DB.prepare('CREATE TABLE IF NOT EXISTS usage_daily (day TEXT PRIMARY KEY, requests INTEGER NOT NULL DEFAULT 0)').run()
  await env.DB.prepare('CREATE TABLE IF NOT EXISTS legacy_records (tbl TEXT NOT NULL, legacy_id TEXT NOT NULL, data TEXT NOT NULL, PRIMARY KEY (tbl, legacy_id))').run()
  // Office वालों के लिए भी live GPS (जैसे घर से काम) — employees.live_track
  if (!(await env.DB.prepare("SELECT 1 AS x FROM pragma_table_info('employees') WHERE name = 'live_track'").first())) {
    await env.DB.prepare('ALTER TABLE employees ADD COLUMN live_track INTEGER NOT NULL DEFAULT 0').run()
  }
  if (!(await done('mig_live_himanshu'))) {
    const r = await env.DB.prepare("UPDATE employees SET live_track = 1 WHERE username = 'himanshu'").run()
    if (r.meta?.changes) { await audit(env, null, 'live_track_on', 'employees', 'himanshu', null, { live_track: 1 }); await mark('mig_live_himanshu') }
  }
  // पुराना tracker 5–14 Nov 2026 बंद था: Himanshu के लिए Present (बाकी लोग HR/Boss panel से भरेंगे)
  if (!(await done('mig_gap_himanshu_2026_11'))) {
    const e = await env.DB.prepare("SELECT id FROM employees WHERE username = 'himanshu'").first()
    if (e) {
      const dates = ['05', '06', '07', '09', '10', '11', '12', '13', '14'].map((d) => `2026-11-${d}`)
      await env.DB.batch(dates.map((d) => env.DB.prepare("INSERT OR IGNORE INTO attendance_marks (emp_id, date, status, reason) VALUES (?, ?, 'Present', 'Old system was down (5–14 Nov) — Present')").bind(e.id, d)))
      await audit(env, null, 'gap_present', 'attendance_marks', String(e.id), null, { dates })
      await mark('mig_gap_himanshu_2026_11')
    }
  }
}

// पहली बार employees डालना — सिर्फ तब जब table खाली हो, और सिर्फ INSERT INTO employees
on('POST', '/api/setup/seed', async (env, req) => {
  const n = (await env.DB.prepare('SELECT count(*) AS n FROM employees').first()).n
  if (n > 0) throw new HttpError(403, 'Already set up')
  const b = await body(req)
  const list = Array.isArray(b.statements) ? b.statements : []
  if (!list.length || !list.every((q) => /^INSERT INTO employees \(/.test(q) && !/;\s*\S/.test(q.replace(/;\s*$/, '')))) throw bad('Only employee inserts allowed')
  await env.DB.batch(list.map((q) => env.DB.prepare(q.replace(/;\s*$/, ''))))
  const c = (await env.DB.prepare('SELECT count(*) AS n FROM employees').first()).n
  await audit(env, null, 'setup_seed', 'employees', null, null, { count: c })
  return json({ ok: true, employees: c })
})

// ── Entry ─────────────────────────────────────────────────────────────────
export default {
  async fetch(req, env0, ctx) {
    let env = env0
    usagePending++
    if (usagePending >= 20 && ctx) ctx.waitUntil(flushUsage(env0))
    const h = cors(env, req)
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h })
    const url = new URL(req.url)
    try {
      await ensureSchema(env0)
      if (!env.TOKEN_SECRET) env = { ...env0, TOKEN_SECRET: await tokenSecret(env0) }
      for (const r of routes) {
        if (r.method !== req.method) continue
        const m = url.pathname.match(r.re)
        if (m) {
          const res = await r.fn(env, req, url, m.groups || {})
          for (const [k, v] of Object.entries(h)) res.headers.set(k, v)
          return res
        }
      }
      throw new HttpError(404, 'Not found')
    } catch (e) {
      const status = e.status || 500
      if (status === 500) console.error(e)
      return json({ error: status === 500 ? 'Server error — data safe, try again' : e.message }, status, h)
    }
  },
  async scheduled(event, env, ctx) {
    ctx.waitUntil(ensureSchema(env).then(() => flushUsage(env)).then(() => runCron(env)))
  },
}

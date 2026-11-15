// JDAC Tracker API — Cloudflare Worker + D1
// Mobile ऐप और Web panels दोनों यही API use करते हैं.
import { istDate, istMinutes, nowIso, hashPassword, verifyPassword, signToken, verifyToken, computeKm, phone10 } from './lib.js'
import { savePhoto, readPhoto, flushPendingPhotos, bytesToB64 } from './photos.js'

const ADMIN_ROLES = ['hr', 'boss', 'developer']
const NO_SIGNAL_MIN = 10
const TOKEN_DAYS = 90

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
const pub = (e) => e && ({ id: e.id, username: e.username, name: e.name, phone: e.phone, role: e.role, team: e.team, designation: e.designation, department: e.department, work_location: e.work_location, shift_start: e.shift_start, shift_end: e.shift_end, joining_date: e.joining_date, active: !!e.active, device_linked: !!e.device_id })

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

// ═════════════════════════════ ROUTES ═════════════════════════════════════
const routes = []
const on = (method, path, fn) => routes.push({ method, re: new RegExp('^' + path.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), fn })

// Health (keep-alive + developer panel)
on('GET', '/api/health', async (env) => {
  const r = await env.DB.prepare('SELECT (SELECT count(*) FROM employees WHERE active=1) employees, (SELECT count(*) FROM location_pings) pings').first()
  return json({ ok: true, at: nowIso(), ...r })
})

// ── Login ───────────────────────────────────────────────────────────────
on('POST', '/api/login', async (env, req) => {
  const b = await body(req)
  const id = String(b.username ?? b.phone ?? '').trim()
  if (!id || !b.password) throw bad('Username और password डालें')
  // username (JDAC1013) से login; पुराने app के लिए 10 अंक mobile भी चलेगा
  const ph = phone10(id)
  const me = await env.DB.prepare('SELECT * FROM employees WHERE username = ? COLLATE NOCASE OR (? <> \'\' AND phone = ?)').bind(id, ph.length === 10 ? ph : '', ph).first()
  if (!me || !me.active || !(await verifyPassword(String(b.password).trim(), me.pass_hash))) throw new HttpError(401, 'Username या password गलत है')
  // Phone lock: app login पहली बार जिस phone से हुआ उसी से चलेगा (developer login पर हमेशा लागू).
  // Web panel (device_id 'web') पर lock नहीं; दूसरा phone चाहिए तो Developer panel → Unlink phone.
  const dev = b.device_id ? String(b.device_id).slice(0, 100) : ''
  if (dev && dev !== 'web') {
    if (!me.device_id) await env.DB.prepare('UPDATE employees SET device_id = ? WHERE id = ?').bind(dev, me.id).run()
    else if (me.device_id !== dev && me.role === 'developer') throw new HttpError(403, 'यह developer login सिर्फ registered phone पर चलेगा')
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
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) throw bad('Location ज़रूरी है — GPS चालू करें')
  const date = istDate()
  const existing = await env.DB.prepare('SELECT * FROM day_sessions WHERE emp_id = ? AND date = ?').bind(me.id, date).first()
  if (existing?.end_at) throw new HttpError(409, 'आज का day पहले ही close हो चुका है')
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

on('POST', '/api/day/end', async (env, req) => {
  const me = await authUser(env, req)
  const b = await body(req)
  const date = b.date || istDate()
  const s = await env.DB.prepare('SELECT * FROM day_sessions WHERE emp_id = ? AND date = ?').bind(me.id, date).first()
  if (!s) throw new HttpError(404, 'Day शुरू नहीं हुआ')
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
  if (!Number.isFinite(km) || km < 0 || km > 500) throw bad('KM 0–500 के बीच')
  if (!b.note || String(b.note).trim().length < 3) throw bad('कारण लिखें')
  const s = await env.DB.prepare('SELECT * FROM day_sessions WHERE emp_id = ? AND date = ?').bind(me.id, istDate()).first()
  if (!s) throw new HttpError(404, 'पहले day start करें')
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
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.date || '') || b.date < istDate()) throw bad('सही date चुनें')
  if (!b.reason || String(b.reason).trim().length < 3) throw bad('कारण लिखें')
  const kind = b.kind === 'Half day' ? 'Half day' : 'Full day'
  try {
    await env.DB.prepare('INSERT INTO leave_requests (emp_id, date, kind, reason) VALUES (?,?,?,?)').bind(me.id, b.date, kind, String(b.reason).trim().slice(0, 300)).run()
  } catch (e) {
    if (/UNIQUE/i.test(String(e))) throw new HttpError(409, 'इस date की leave पहले से है')
    throw e
  }
  return json({ ok: true })
})

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
    let status = 'absent'
    if (mBy.get(e.id)) status = 'marked'
    if (lvBy.get(e.id)) status = 'leave'
    if (s && s.end_at) status = 'closed'
    if (s && !s.end_at) status = e.team === 'Warehouse' && (mins == null || mins > NO_SIGNAL_MIN) ? 'no_signal' : 'on_duty'
    return { emp: pub(e), session: s || null, last: loc && loc.recorded_at.slice(0, 10) >= date ? loc : null, last_min: mins, late, leave: lvBy.get(e.id) || null, mark: mBy.get(e.id) || null, status }
  })
  const count = (k) => rows.filter((r) => r.status === k).length
  return json({ date, rows, summary: { total: rows.length, in: rows.filter((r) => r.session).length, late: rows.filter((r) => r.late).length, leave: count('leave'), absent: count('absent'), no_signal: count('no_signal'),
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
  if (!['Present', 'Half Day', 'Absent', 'Leave', 'Week Off'].includes(b.status)) throw bad('status?')
  if (!b.reason || String(b.reason).trim().length < 3) throw bad('कारण लिखें')
  const old = await env.DB.prepare('SELECT * FROM attendance_marks WHERE emp_id = ? AND date = ?').bind(b.emp_id, b.date).first()
  await env.DB.prepare('INSERT INTO attendance_marks (emp_id, date, status, reason, set_by) VALUES (?,?,?,?,?) ON CONFLICT (emp_id, date) DO UPDATE SET status = excluded.status, reason = excluded.reason, set_by = excluded.set_by, set_at = excluded.set_at')
    .bind(b.emp_id, b.date, b.status, String(b.reason).trim(), me.id).run()
  await audit(env, me.id, 'attendance_mark', 'attendance_marks', `${b.emp_id}:${b.date}`, old, { status: b.status, reason: b.reason })
  return json({ ok: true })
})

// HR correction of a day (forgot to close etc.) — हमेशा audit के साथ
on('POST', '/api/admin/day/:id/correct', async (env, req, url, params) => {
  const me = await authUser(env, req); needAdmin(me)
  const b = await body(req)
  if (!b.reason || String(b.reason).trim().length < 3) throw bad('कारण लिखें')
  const s = await env.DB.prepare('SELECT * FROM day_sessions WHERE id = ?').bind(params.id).first()
  if (!s) throw new HttpError(404, 'Not found')
  const patch = {}
  if (b.end_at) { if (Date.parse(b.end_at) < Date.parse(s.start_at)) throw bad('Out time, In time से पहले नहीं हो सकता'); patch.end_at = new Date(b.end_at).toISOString() }
  if (b.manual_km != null) patch.manual_km = Number(b.manual_km)
  const keys = Object.keys(patch)
  if (!keys.length) throw bad('कुछ बदलाव नहीं')
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
  if ((phone && phone.length !== 10) || !b.name || !b.password || String(b.password).length < 6) throw bad('नाम और कम से कम 6 अक्षर password डालें (mobile हो तो 10 अंक)')
  const role = b.role || 'employee'
  if (!roleAllowed(me, role)) throw new HttpError(403, 'यह role आप नहीं दे सकते')
  // username = नाम से (Atmaram Sambhaji Malik → atmaram), पहले से हो तो atmaram2, atmaram3…
  let username = String(b.username || '').trim().toLowerCase().replace(/\s+/g, '')
  if (!username) {
    const base = String(b.name).trim().toLowerCase().split(/\s+/)[0].replace(/[^a-z0-9]/g, '') || 'user'
    username = base
    for (let i = 2; await env.DB.prepare('SELECT 1 FROM employees WHERE username = ? COLLATE NOCASE').bind(username).first(); i++) username = base + i
  }
  if (!/^[a-z0-9._-]{3,30}$/.test(username)) throw bad('Username में सिर्फ अंग्रेज़ी अक्षर/नंबर (बिना space)')
  try {
    await env.DB.prepare('INSERT INTO employees (username, name, phone, pass_hash, role, team, designation, department, work_location, shift_start, shift_end, joining_date) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)')
      .bind(username, String(b.name).trim(), phone || null, await hashPassword(String(b.password)), role, b.team === 'Warehouse' ? 'Warehouse' : 'Office', b.designation || null, b.department || null, b.work_location || null, b.shift_start || '10:00', b.shift_end || '19:00', b.joining_date || null).run()
  } catch (e) { if (/UNIQUE/i.test(String(e))) throw new HttpError(409, 'यह username या mobile पहले से है'); throw e }
  await audit(env, me.id, 'employee_create', 'employees', username, null, { username, name: b.name, role, team: b.team })
  return json({ ok: true, username })
})
on('PATCH', '/api/admin/employees/:id', async (env, req, url, params) => {
  const me = await authUser(env, req); needAdmin(me)
  const b = await body(req)
  const e = await env.DB.prepare('SELECT * FROM employees WHERE id = ?').bind(params.id).first()
  if (!e) throw new HttpError(404, 'Not found')
  if (!roleAllowed(me, e.role)) throw new HttpError(403, 'यह login आप नहीं बदल सकते')
  const patch = {}
  if ('username' in b && b.username) { const u = String(b.username).trim().toLowerCase().replace(/\s+/g, ''); if (!/^[a-z0-9._-]{3,30}$/.test(u)) throw bad('Username में सिर्फ अंग्रेज़ी अक्षर/नंबर (बिना space)'); patch.username = u }
  if ('phone' in b) { const ph = b.phone ? phone10(b.phone) : ''; if (ph && ph.length !== 10) throw bad('Mobile 10 अंक'); patch.phone = ph || null }
  for (const k of ['name', 'designation', 'department', 'work_location', 'shift_start', 'shift_end', 'joining_date']) if (k in b) patch[k] = b[k] === '' ? null : b[k]
  if ('team' in b) patch.team = b.team === 'Warehouse' ? 'Warehouse' : 'Office'
  if ('role' in b && b.role !== e.role) {
    if (Number(params.id) === me.id) throw bad('अपना role खुद नहीं बदल सकते')
    if (!roleAllowed(me, b.role)) throw new HttpError(403, 'यह role आप नहीं दे सकते')
    patch.role = b.role; patch.token_version = e.token_version + 1
  }
  if ('active' in b && Number(params.id) !== me.id) { patch.active = b.active ? 1 : 0; if (!b.active) patch.token_version = (patch.token_version ?? e.token_version) + 1 }
  if (b.new_password) { if (String(b.new_password).length < 6) throw bad('Password कम से कम 6 अक्षर'); patch.pass_hash = await hashPassword(String(b.new_password)); patch.token_version = (patch.token_version ?? e.token_version) + 1 }
  if (b.unlink_device) patch.device_id = null
  const keys = Object.keys(patch)
  if (!keys.length) return json({ ok: true })
  await env.DB.prepare(`UPDATE employees SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`).bind(...keys.map((k) => patch[k]), e.id).run()
  const safe = (o) => Object.fromEntries(Object.entries(o).filter(([k]) => k !== 'pass_hash'))
  await audit(env, me.id, 'employee_update', 'employees', e.id, safe(Object.fromEntries(keys.map((k) => [k, e[k]]))), { ...safe(patch), ...(b.new_password ? { password: 'reset' } : {}) })
  return json({ ok: true })
})

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
      FROM employees e LEFT JOIN last_location l ON l.emp_id = e.id WHERE e.active = 1 AND e.team = 'Warehouse' ORDER BY e.name`).all()
  return json({ ...r, db_bytes: dbBytes, db_limit_bytes: 500 * 1024 * 1024, supabase: !!(env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY), phones })
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
      JOIN employees e ON e.id = s.emp_id AND e.team = 'Warehouse' AND e.active = 1
      LEFT JOIN last_location l ON l.emp_id = s.emp_id
      WHERE s.date = ? AND s.end_at IS NULL`).bind(today).all()
  for (const r of results) {
    const mins = r.recorded_at ? (now - Date.parse(r.recorded_at)) / 60000 : Infinity
    if (mins > NO_SIGNAL_MIN) {
      await env.DB.prepare("INSERT OR IGNORE INTO alerts (emp_id, date, kind, detail, opened_at) VALUES (?, ?, 'no_signal', ?, ?)")
        .bind(r.emp_id, today, r.recorded_at ? `last GPS ${r.recorded_at}` : 'no GPS yet', nowIso()).run()
    }
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
  if (schemaReady || typeof SCHEMA_STATEMENTS === 'undefined') return
  const has = await env.DB.prepare("SELECT 1 AS x FROM sqlite_master WHERE type='table' AND name='app_settings'").first()
  if (!has) await env.DB.batch(SCHEMA_STATEMENTS.map((q) => env.DB.prepare(q)))
  schemaReady = true
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
  async fetch(req, env0) {
    let env = env0
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
    ctx.waitUntil(ensureSchema(env).then(() => runCron(env)))
  },
}

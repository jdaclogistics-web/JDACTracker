// JDAC Tracker API — bundled from api/src (do not edit here; edit src and re-bundle)
const SCHEMA_STATEMENTS = ["CREATE TABLE IF NOT EXISTS employees (\n  id            INTEGER PRIMARY KEY AUTOINCREMENT,\n  legacy_id     INTEGER UNIQUE,                         \n  name          TEXT NOT NULL,\n  username      TEXT NOT NULL UNIQUE COLLATE NOCASE,    \n  phone         TEXT UNIQUE,                            \n  pass_hash     TEXT NOT NULL,                          \n  role          TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('employee','hr','boss','developer')),\n  team          TEXT NOT NULL DEFAULT 'Office'   CHECK (team IN ('Warehouse','Office')),\n  designation   TEXT,\n  department    TEXT,\n  work_location TEXT,                                   \n  shift_start   TEXT NOT NULL DEFAULT '10:00',\n  shift_end     TEXT NOT NULL DEFAULT '19:00',\n  joining_date  TEXT,\n  active        INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),\n  device_id     TEXT,\n  token_version INTEGER NOT NULL DEFAULT 0,             \n  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),\n  CHECK (phone IS NULL OR length(phone) = 10),\n  CHECK (length(username) BETWEEN 3 AND 30)\n)","CREATE TABLE IF NOT EXISTS day_sessions (\n  id             INTEGER PRIMARY KEY AUTOINCREMENT,\n  emp_id         INTEGER NOT NULL REFERENCES employees(id),\n  date           TEXT NOT NULL,                         \n  start_at       TEXT NOT NULL,\n  start_lat      REAL, start_lng REAL,\n  start_photo    TEXT,                                  \n  end_at         TEXT,\n  end_lat        REAL, end_lng REAL,\n  end_photo      TEXT,\n  total_km       REAL NOT NULL DEFAULT 0,\n  manual_km      REAL NOT NULL DEFAULT 0 CHECK (manual_km BETWEEN 0 AND 1000),\n  manual_km_note TEXT,\n  auto_closed    INTEGER NOT NULL DEFAULT 0,\n  legacy_id      INTEGER UNIQUE,\n  UNIQUE (emp_id, date),\n  CHECK (end_at IS NULL OR end_at >= start_at)\n)","CREATE TABLE IF NOT EXISTS location_pings (\n  id          INTEGER PRIMARY KEY AUTOINCREMENT,\n  client_id   TEXT NOT NULL UNIQUE,                     \n  emp_id      INTEGER NOT NULL REFERENCES employees(id),\n  date        TEXT NOT NULL,\n  lat         REAL NOT NULL CHECK (lat BETWEEN -90 AND 90),\n  lng         REAL NOT NULL CHECK (lng BETWEEN -180 AND 180),\n  accuracy    REAL,\n  kind        TEXT NOT NULL DEFAULT 'duty' CHECK (kind IN ('duty','field')),\n  recorded_at TEXT NOT NULL,                            \n  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),\n  CHECK (NOT (lat = 0 AND lng = 0))\n)","CREATE INDEX IF NOT EXISTS pings_emp_date ON location_pings (emp_id, date, recorded_at)","CREATE INDEX IF NOT EXISTS pings_date ON location_pings (date)","CREATE TABLE IF NOT EXISTS last_location (\n  emp_id      INTEGER PRIMARY KEY REFERENCES employees(id),\n  lat         REAL NOT NULL,\n  lng         REAL NOT NULL,\n  accuracy    REAL,\n  kind        TEXT,\n  recorded_at TEXT NOT NULL,\n  synced_at   TEXT NOT NULL\n)","CREATE TABLE IF NOT EXISTS leave_requests (\n  id          INTEGER PRIMARY KEY AUTOINCREMENT,\n  emp_id      INTEGER NOT NULL REFERENCES employees(id),\n  date        TEXT NOT NULL,\n  kind        TEXT NOT NULL DEFAULT 'Full day' CHECK (kind IN ('Full day','Half day')),\n  reason      TEXT NOT NULL CHECK (length(trim(reason)) >= 3),\n  status      TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Approved','Rejected','Cancelled')),\n  decided_by  INTEGER REFERENCES employees(id),\n  decided_at  TEXT,\n  legacy_id   INTEGER UNIQUE,\n  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))\n)","CREATE UNIQUE INDEX IF NOT EXISTS leave_one_active ON leave_requests (emp_id, date) WHERE status IN ('Pending','Approved')","CREATE TABLE IF NOT EXISTS attendance_marks (\n  id      INTEGER PRIMARY KEY AUTOINCREMENT,\n  emp_id  INTEGER NOT NULL REFERENCES employees(id),\n  date    TEXT NOT NULL,\n  status  TEXT NOT NULL CHECK (status IN ('Present','Half Day','Absent','Leave','Week Off')),\n  reason  TEXT,\n  set_by  INTEGER REFERENCES employees(id),\n  set_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),\n  legacy  INTEGER NOT NULL DEFAULT 0,\n  UNIQUE (emp_id, date)\n)","CREATE TABLE IF NOT EXISTS photos (\n  key        TEXT PRIMARY KEY,\n  mime       TEXT NOT NULL DEFAULT 'image/jpeg',\n  data       BLOB NOT NULL,\n  moved      INTEGER NOT NULL DEFAULT 0,               \n  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))\n)","CREATE TABLE IF NOT EXISTS audit_log (\n  id       INTEGER PRIMARY KEY AUTOINCREMENT,\n  at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),\n  actor    INTEGER,\n  action   TEXT NOT NULL,\n  tbl      TEXT NOT NULL,\n  row_id   TEXT,\n  old_data TEXT,\n  new_data TEXT\n)","CREATE INDEX IF NOT EXISTS audit_at ON audit_log (at)","CREATE TABLE IF NOT EXISTS alerts (\n  id         INTEGER PRIMARY KEY AUTOINCREMENT,\n  emp_id     INTEGER NOT NULL REFERENCES employees(id),\n  date       TEXT NOT NULL,\n  kind       TEXT NOT NULL,                             \n  detail     TEXT,\n  opened_at  TEXT NOT NULL,\n  closed_at  TEXT\n)","CREATE UNIQUE INDEX IF NOT EXISTS alerts_open ON alerts (emp_id, kind) WHERE closed_at IS NULL","CREATE TRIGGER IF NOT EXISTS no_delete_employees      BEFORE DELETE ON employees      BEGIN SELECT RAISE(ABORT, 'delete not allowed — deactivate instead'); END","CREATE TRIGGER IF NOT EXISTS no_delete_sessions       BEFORE DELETE ON day_sessions   BEGIN SELECT RAISE(ABORT, 'delete not allowed'); END","CREATE TRIGGER IF NOT EXISTS no_delete_pings          BEFORE DELETE ON location_pings BEGIN SELECT RAISE(ABORT, 'delete not allowed'); END","CREATE TRIGGER IF NOT EXISTS no_delete_leaves         BEFORE DELETE ON leave_requests BEGIN SELECT RAISE(ABORT, 'delete not allowed — cancel instead'); END","CREATE TRIGGER IF NOT EXISTS no_delete_marks          BEFORE DELETE ON attendance_marks BEGIN SELECT RAISE(ABORT, 'delete not allowed'); END","CREATE TRIGGER IF NOT EXISTS no_delete_audit          BEFORE DELETE ON audit_log      BEGIN SELECT RAISE(ABORT, 'audit log is permanent'); END","CREATE TRIGGER IF NOT EXISTS no_update_audit          BEFORE UPDATE ON audit_log      BEGIN SELECT RAISE(ABORT, 'audit log is permanent'); END","CREATE TRIGGER IF NOT EXISTS no_update_pings          BEFORE UPDATE ON location_pings BEGIN SELECT RAISE(ABORT, 'GPS points are permanent'); END","CREATE TRIGGER IF NOT EXISTS session_identity_fixed   BEFORE UPDATE OF emp_id, date ON day_sessions\n  WHEN NEW.emp_id <> OLD.emp_id OR NEW.date <> OLD.date\n  BEGIN SELECT RAISE(ABORT, 'session employee/date cannot change'); END","CREATE TRIGGER IF NOT EXISTS ping_last_location AFTER INSERT ON location_pings\nBEGIN\n  INSERT INTO last_location (emp_id, lat, lng, accuracy, kind, recorded_at, synced_at)\n  VALUES (NEW.emp_id, NEW.lat, NEW.lng, NEW.accuracy, NEW.kind, NEW.recorded_at, NEW.created_at)\n  ON CONFLICT (emp_id) DO UPDATE SET\n    lat = excluded.lat, lng = excluded.lng, accuracy = excluded.accuracy, kind = excluded.kind,\n    recorded_at = excluded.recorded_at, synced_at = excluded.synced_at\n  WHERE excluded.recorded_at > last_location.recorded_at;\nEND","CREATE TABLE IF NOT EXISTS app_settings (\n  key   TEXT PRIMARY KEY,\n  value TEXT NOT NULL\n)"]
// Shared helpers: IST time, password hashing, signed tokens, km calculation.
const enc = new TextEncoder()

// ── Time (सब IST में) ─────────────────────────────────────────────────────
function istDate(d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}
function istMinutes(iso) {
  const t = new Date(new Date(iso).getTime() + 330 * 60000)
  return t.getUTCHours() * 60 + t.getUTCMinutes()
}
const nowIso = () => new Date().toISOString()

// ── base64url ───────────────────────────────────────────────────────────
function b64u(bytes) {
  let s = ''
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function unb64u(str) {
  const s = atob(str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4))
  return Uint8Array.from(s, (c) => c.charCodeAt(0))
}
function bytesToB64(bytes) {
  let s = ''
  const arr = new Uint8Array(bytes)
  for (let i = 0; i < arr.length; i += 0x8000) s += String.fromCharCode(...arr.subarray(i, i + 0x8000))
  return btoa(s)
}
function b64ToBytes(b64) {
  const s = atob(b64)
  const out = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i)
  return out
}

// ── Password: PBKDF2-SHA256 (Workers max 100k iterations) ───────────────────
const ITER = 100000
async function pbkdf2(password, salt, iter) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, key, 256))
}
async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  return `pbkdf2$${ITER}$${b64u(salt)}$${b64u(await pbkdf2(password, salt, ITER))}`
}
async function verifyPassword(password, stored) {
  const [alg, iter, salt, hash] = String(stored || '').split('$')
  if (alg !== 'pbkdf2') return false
  const got = await pbkdf2(password, unb64u(salt), Number(iter))
  const want = unb64u(hash)
  if (got.length !== want.length) return false
  let diff = 0
  for (let i = 0; i < got.length; i++) diff |= got[i] ^ want[i]
  return diff === 0
}

// ── Signed login token (HMAC-SHA256) ─────────────────────────────────────────
async function hmacKey(secret) {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}
async function signToken(payload, secret) {
  const body = b64u(enc.encode(JSON.stringify(payload)))
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(body))
  return `${body}.${b64u(sig)}`
}
async function verifyToken(token, secret) {
  const [body, sig] = String(token || '').split('.')
  if (!body || !sig) return null
  const ok = await crypto.subtle.verify('HMAC', await hmacKey(secret), unb64u(sig), enc.encode(body))
  if (!ok) return null
  try {
    const p = JSON.parse(new TextDecoder().decode(unb64u(body)))
    if (p.exp && Date.now() > p.exp) return null
    return p
  } catch { return null }
}

// ── KM (पुराने JDAC tracker वाला logic) ──────────────────────────────────────
function haversineKm(lat1, lng1, lat2, lng2) {
  const r = Math.PI / 180
  const a = Math.sin(((lat2 - lat1) * r) / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(((lng2 - lng1) * r) / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(a))
}
/** jitter <30 m skip, single jump >150 km skip, >120 km/h skip. field pings ≥2 → वही source. */
function computeKm(pings, manualKm = 0) {
  const field = pings.filter((p) => p.kind === 'field')
  const use = (field.length >= 2 ? field : pings).slice().sort((a, b) => (a.recorded_at < b.recorded_at ? -1 : a.recorded_at > b.recorded_at ? 1 : a.id - b.id))
  let gps = 0
  for (let i = 1; i < use.length; i++) {
    const a = use[i - 1], b = use[i]
    const d = haversineKm(a.lat, a.lng, b.lat, b.lng)
    if (d < 0.03 || d > 150) continue
    const dtMin = (new Date(b.recorded_at) - new Date(a.recorded_at)) / 60000
    if (dtMin > 0 && dtMin < 30 && d / (dtMin / 60) > 120) continue
    gps += d
  }
  return Math.round(Math.max(gps, manualKm || 0) * 100) / 100
}

function phone10(s) {
  const d = String(s || '').replace(/\D/g, '')
  return d.length >= 10 ? d.slice(-10) : d
}

// Selfie photos → Supabase Storage (bucket "selfies", private).
// Supabase न मिले / down हो → photo D1 के photos table में (कभी miss नहीं),
// cron बाद में उसे Supabase पर भेज देता है।


const BUCKET = 'selfies'
const hasSupabase = (env) => !!(env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY)

async function supabasePut(env, key, bytes, mime) {
  const r = await fetch(`${env.SUPABASE_URL}/storage/v1/object/${BUCKET}/${key}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`, 'Content-Type': mime, 'x-upsert': 'true' },
    body: bytes,
  })
  if (!r.ok) throw new Error(`supabase ${r.status}`)
}

/** base64 JPEG save करो, key लौटाओ ("sb:" = Supabase पर, "db:" = D1 fallback में) */
async function savePhoto(env, key, base64, mime = 'image/jpeg') {
  if (!base64) return null
  const bytes = b64ToBytes(String(base64).replace(/^data:[^,]+,/, ''))
  if (bytes.length > 1_500_000) throw new Error('photo too large')
  if (hasSupabase(env)) {
    try { await supabasePut(env, key, bytes, mime); return `sb:${key}` } catch { /* fallback */ }
  }
  await env.DB.prepare('INSERT OR REPLACE INTO photos (key, mime, data) VALUES (?, ?, ?)').bind(key, mime, bytes).run()
  return `db:${key}`
}

/** Admin photo देखे: Supabase से या D1 से */
async function readPhoto(env, ref) {
  if (!ref) return null
  const [where, ...rest] = ref.split(':')
  const key = rest.join(':')
  if (where === 'sb' && hasSupabase(env)) {
    const r = await fetch(`${env.SUPABASE_URL}/storage/v1/object/${BUCKET}/${key}`, { headers: { Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}` } })
    if (r.ok) return { mime: r.headers.get('content-type') || 'image/jpeg', body: await r.arrayBuffer() }
  }
  const row = await env.DB.prepare('SELECT mime, data FROM photos WHERE key = ?').bind(key).first()
  if (!row) return null
  return { mime: row.mime, body: row.data instanceof ArrayBuffer ? row.data : new Uint8Array(row.data).buffer }
}

/** Cron: D1 में रुकी photos को Supabase पर भेजो (D1 वाली copy तभी हटती है जब Supabase पर पक्का पहुँच जाए) */
async function flushPendingPhotos(env, limit = 20) {
  if (!hasSupabase(env)) return 0
  const { results } = await env.DB.prepare('SELECT key, mime, data FROM photos WHERE moved = 0 LIMIT ?').bind(limit).all()
  let moved = 0
  for (const p of results) {
    try {
      await supabasePut(env, p.key, new Uint8Array(p.data), p.mime)
      await env.DB.batch([
        env.DB.prepare("UPDATE day_sessions SET start_photo = 'sb:' || ? WHERE start_photo = 'db:' || ?").bind(p.key, p.key),
        env.DB.prepare("UPDATE day_sessions SET end_photo = 'sb:' || ? WHERE end_photo = 'db:' || ?").bind(p.key, p.key),
        env.DB.prepare('UPDATE photos SET moved = 1, data = x\'\' WHERE key = ?').bind(p.key),
      ])
      moved++
    } catch { break }
  }
  return moved
}


// JDAC Tracker API — Cloudflare Worker + D1
// Mobile ऐप और Web panels दोनों यही API use करते हैं.



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
    if (s && !s.end_at) status = e.team === 'Warehouse' && (mins == null || mins > NO_SIGNAL_MIN) ? 'no_signal' : 'on_duty'
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
  if (!b.reason || String(b.reason).trim().length < 3) throw bad('कारण लिखें')
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
async function runCron(env) {
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
  await runMigrations(env)
  schemaReady = true
}

// One-time data fixes (हर एक सिर्फ एक बार, audit के साथ)
async function runMigrations(env) {
  const done = async (k) => !!(await env.DB.prepare('SELECT 1 AS x FROM app_settings WHERE key = ?').bind(k).first())
  const mark = (k) => env.DB.prepare('INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)').bind(k, new Date().toISOString()).run()
  // पुराना tracker 5–14 Nov 2026 बंद था: Himanshu के लिए Present (बाकी लोग HR/Boss panel से भरेंगे)
  if (!(await done('mig_gap_himanshu_2026_11'))) {
    const e = await env.DB.prepare("SELECT id FROM employees WHERE username = 'himanshu'").first()
    if (e) {
      const dates = ['05', '06', '07', '09', '10', '11', '12', '13', '14'].map((d) => `2026-11-${d}`)
      await env.DB.batch(dates.map((d) => env.DB.prepare("INSERT OR IGNORE INTO attendance_marks (emp_id, date, status, reason) VALUES (?, ?, 'Present', 'पुराना system बंद था (5–14 Nov) — Present')").bind(e.id, d)))
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

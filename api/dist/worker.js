// JDAC Tracker API — bundled from api/src (do not edit here; edit src and re-bundle)
const SCHEMA_STATEMENTS = ["CREATE TABLE IF NOT EXISTS employees (\n  id            INTEGER PRIMARY KEY AUTOINCREMENT,\n  legacy_id     INTEGER UNIQUE,                         \n  name          TEXT NOT NULL,\n  username      TEXT NOT NULL UNIQUE COLLATE NOCASE,    \n  phone         TEXT UNIQUE,                            \n  pass_hash     TEXT NOT NULL,                          \n  role          TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('employee','hr','boss','developer')),\n  team          TEXT NOT NULL DEFAULT 'Office'   CHECK (team IN ('Warehouse','Office')),\n  designation   TEXT,\n  department    TEXT,\n  work_location TEXT,                                   \n  shift_start   TEXT NOT NULL DEFAULT '10:00',\n  shift_end     TEXT NOT NULL DEFAULT '19:00',\n  joining_date  TEXT,\n  active        INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),\n  live_track    INTEGER NOT NULL DEFAULT 0,             \n  device_id     TEXT,\n  token_version INTEGER NOT NULL DEFAULT 0,             \n  app_login_at  TEXT,                                   \n  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),\n  CHECK (phone IS NULL OR length(phone) = 10),\n  CHECK (length(username) BETWEEN 3 AND 30)\n)","CREATE TABLE IF NOT EXISTS day_sessions (\n  id             INTEGER PRIMARY KEY AUTOINCREMENT,\n  emp_id         INTEGER NOT NULL REFERENCES employees(id),\n  date           TEXT NOT NULL,                         \n  start_at       TEXT NOT NULL,\n  start_lat      REAL, start_lng REAL,\n  start_photo    TEXT,                                  \n  end_at         TEXT,\n  end_lat        REAL, end_lng REAL,\n  end_photo      TEXT,\n  total_km       REAL NOT NULL DEFAULT 0,\n  manual_km      REAL NOT NULL DEFAULT 0 CHECK (manual_km BETWEEN 0 AND 1000),\n  manual_km_note TEXT,\n  auto_closed    INTEGER NOT NULL DEFAULT 0,\n  legacy_id      INTEGER UNIQUE,\n  UNIQUE (emp_id, date),\n  CHECK (end_at IS NULL OR end_at >= start_at)\n)","CREATE TABLE IF NOT EXISTS location_pings (\n  id          INTEGER PRIMARY KEY AUTOINCREMENT,\n  client_id   TEXT NOT NULL UNIQUE,                     \n  emp_id      INTEGER NOT NULL REFERENCES employees(id),\n  date        TEXT NOT NULL,\n  lat         REAL NOT NULL CHECK (lat BETWEEN -90 AND 90),\n  lng         REAL NOT NULL CHECK (lng BETWEEN -180 AND 180),\n  accuracy    REAL,\n  kind        TEXT NOT NULL DEFAULT 'duty' CHECK (kind IN ('duty','field')),\n  recorded_at TEXT NOT NULL,                            \n  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),\n  CHECK (NOT (lat = 0 AND lng = 0))\n)","CREATE INDEX IF NOT EXISTS pings_emp_date ON location_pings (emp_id, date, recorded_at)","CREATE INDEX IF NOT EXISTS pings_date ON location_pings (date)","CREATE TABLE IF NOT EXISTS last_location (\n  emp_id      INTEGER PRIMARY KEY REFERENCES employees(id),\n  lat         REAL NOT NULL,\n  lng         REAL NOT NULL,\n  accuracy    REAL,\n  kind        TEXT,\n  recorded_at TEXT NOT NULL,\n  synced_at   TEXT NOT NULL\n)","CREATE TABLE IF NOT EXISTS leave_requests (\n  id          INTEGER PRIMARY KEY AUTOINCREMENT,\n  emp_id      INTEGER NOT NULL REFERENCES employees(id),\n  date        TEXT NOT NULL,\n  kind        TEXT NOT NULL DEFAULT 'Full day' CHECK (kind IN ('Full day','Half day')),\n  reason      TEXT NOT NULL CHECK (length(trim(reason)) >= 3),\n  status      TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Approved','Rejected','Cancelled')),\n  decided_by  INTEGER REFERENCES employees(id),\n  decided_at  TEXT,\n  legacy_id   INTEGER UNIQUE,\n  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))\n)","CREATE UNIQUE INDEX IF NOT EXISTS leave_one_active ON leave_requests (emp_id, date) WHERE status IN ('Pending','Approved')","CREATE TABLE IF NOT EXISTS attendance_marks (\n  id      INTEGER PRIMARY KEY AUTOINCREMENT,\n  emp_id  INTEGER NOT NULL REFERENCES employees(id),\n  date    TEXT NOT NULL,\n  status  TEXT NOT NULL CHECK (status IN ('Present','Half Day','Absent','Leave','Week Off')),\n  reason  TEXT,\n  set_by  INTEGER REFERENCES employees(id),\n  set_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),\n  legacy  INTEGER NOT NULL DEFAULT 0,\n  UNIQUE (emp_id, date)\n)","CREATE TABLE IF NOT EXISTS photos (\n  key        TEXT PRIMARY KEY,\n  mime       TEXT NOT NULL DEFAULT 'image/jpeg',\n  data       BLOB NOT NULL,\n  moved      INTEGER NOT NULL DEFAULT 0,               \n  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))\n)","CREATE TABLE IF NOT EXISTS audit_log (\n  id       INTEGER PRIMARY KEY AUTOINCREMENT,\n  at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),\n  actor    INTEGER,\n  action   TEXT NOT NULL,\n  tbl      TEXT NOT NULL,\n  row_id   TEXT,\n  old_data TEXT,\n  new_data TEXT\n)","CREATE INDEX IF NOT EXISTS audit_at ON audit_log (at)","CREATE TABLE IF NOT EXISTS alerts (\n  id         INTEGER PRIMARY KEY AUTOINCREMENT,\n  emp_id     INTEGER NOT NULL REFERENCES employees(id),\n  date       TEXT NOT NULL,\n  kind       TEXT NOT NULL,                             \n  detail     TEXT,\n  opened_at  TEXT NOT NULL,\n  closed_at  TEXT\n)","CREATE UNIQUE INDEX IF NOT EXISTS alerts_open ON alerts (emp_id, kind) WHERE closed_at IS NULL","CREATE TRIGGER IF NOT EXISTS no_delete_employees      BEFORE DELETE ON employees      BEGIN SELECT RAISE(ABORT, 'delete not allowed — deactivate instead'); END","CREATE TRIGGER IF NOT EXISTS no_delete_sessions       BEFORE DELETE ON day_sessions   BEGIN SELECT RAISE(ABORT, 'delete not allowed'); END","CREATE TRIGGER IF NOT EXISTS no_delete_pings          BEFORE DELETE ON location_pings BEGIN SELECT RAISE(ABORT, 'delete not allowed'); END","CREATE TRIGGER IF NOT EXISTS no_delete_leaves         BEFORE DELETE ON leave_requests BEGIN SELECT RAISE(ABORT, 'delete not allowed — cancel instead'); END","CREATE TRIGGER IF NOT EXISTS no_delete_marks          BEFORE DELETE ON attendance_marks BEGIN SELECT RAISE(ABORT, 'delete not allowed'); END","CREATE TRIGGER IF NOT EXISTS no_delete_audit          BEFORE DELETE ON audit_log      BEGIN SELECT RAISE(ABORT, 'audit log is permanent'); END","CREATE TRIGGER IF NOT EXISTS no_update_audit          BEFORE UPDATE ON audit_log      BEGIN SELECT RAISE(ABORT, 'audit log is permanent'); END","CREATE TRIGGER IF NOT EXISTS no_update_pings          BEFORE UPDATE ON location_pings BEGIN SELECT RAISE(ABORT, 'GPS points are permanent'); END","CREATE TRIGGER IF NOT EXISTS session_identity_fixed   BEFORE UPDATE OF emp_id, date ON day_sessions\n  WHEN NEW.emp_id <> OLD.emp_id OR NEW.date <> OLD.date\n  BEGIN SELECT RAISE(ABORT, 'session employee/date cannot change'); END","CREATE TRIGGER IF NOT EXISTS ping_last_location AFTER INSERT ON location_pings\nBEGIN\n  INSERT INTO last_location (emp_id, lat, lng, accuracy, kind, recorded_at, synced_at)\n  VALUES (NEW.emp_id, NEW.lat, NEW.lng, NEW.accuracy, NEW.kind, NEW.recorded_at, NEW.created_at)\n  ON CONFLICT (emp_id) DO UPDATE SET\n    lat = excluded.lat, lng = excluded.lng, accuracy = excluded.accuracy, kind = excluded.kind,\n    recorded_at = excluded.recorded_at, synced_at = excluded.synced_at\n  WHERE excluded.recorded_at > last_location.recorded_at;\nEND","CREATE TABLE IF NOT EXISTS app_settings (\n  key   TEXT PRIMARY KEY,\n  value TEXT NOT NULL\n)","CREATE TABLE IF NOT EXISTS legacy_records (\n  tbl       TEXT NOT NULL,\n  legacy_id TEXT NOT NULL,\n  data      TEXT NOT NULL,          \n  PRIMARY KEY (tbl, legacy_id)\n)","CREATE TABLE IF NOT EXISTS usage_daily (\n  day      TEXT PRIMARY KEY,\n  requests INTEGER NOT NULL DEFAULT 0\n)","CREATE TABLE IF NOT EXISTS desks (id INTEGER PRIMARY KEY AUTOINCREMENT, company TEXT NOT NULL, name TEXT NOT NULL, icon TEXT, description TEXT, kind TEXT NOT NULL DEFAULT 'ready', module TEXT, fields TEXT, rolls_up TEXT, active INTEGER NOT NULL DEFAULT 1, legacy_id TEXT UNIQUE, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')))","CREATE TABLE IF NOT EXISTS desk_access (desk_id INTEGER NOT NULL, emp_id INTEGER NOT NULL, enabled INTEGER NOT NULL DEFAULT 1, changed_at TEXT, PRIMARY KEY (desk_id, emp_id))","CREATE TABLE IF NOT EXISTS desk_entries (id INTEGER PRIMARY KEY AUTOINCREMENT, desk_id INTEGER NOT NULL, emp_id INTEGER, date TEXT NOT NULL, data TEXT NOT NULL, amount REAL NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')), updated_at TEXT)","CREATE TABLE IF NOT EXISTS daily_bookings (id INTEGER PRIMARY KEY AUTOINCREMENT, emp_id INTEGER, date TEXT NOT NULL, booking_no TEXT NOT NULL UNIQUE COLLATE NOCASE, amount REAL NOT NULL CHECK (amount > 0), legacy_id TEXT UNIQUE, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')), updated_at TEXT)","CREATE TABLE IF NOT EXISTS payments (id INTEGER PRIMARY KEY AUTOINCREMENT, invoice_id TEXT NOT NULL, company TEXT, amount REAL NOT NULL CHECK (amount > 0), date TEXT NOT NULL, mode TEXT NOT NULL, reference TEXT, by_emp INTEGER, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')))","CREATE TABLE IF NOT EXISTS public_forms (id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL, icon TEXT, fields TEXT NOT NULL, project_id TEXT, project_name TEXT, becomes TEXT NOT NULL DEFAULT 'entry', status TEXT NOT NULL DEFAULT 'live', created_by INTEGER, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')))","CREATE TABLE IF NOT EXISTS form_answers (id INTEGER PRIMARY KEY AUTOINCREMENT, form_id INTEGER NOT NULL, data TEXT NOT NULL, result TEXT, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')))","CREATE UNIQUE INDEX IF NOT EXISTS ux_invoice_docno ON legacy_records (json_extract(data, '$.company'), json_extract(data, '$.kind'), json_extract(data, '$.docNo')) WHERE tbl = 'invoices'"]
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
// नई "sb_secret_…" key और पुरानी service_role (JWT) key — दोनों चलें
const sbHeaders = (env) => { const k = env.SUPABASE_SERVICE_KEY; return k.startsWith('eyJ') ? { apikey: k, Authorization: `Bearer ${k}` } : { apikey: k } }

async function supabasePut(env, key, bytes, mime) {
  const r = await fetch(`${env.SUPABASE_URL}/storage/v1/object/${BUCKET}/${key}`, {
    method: 'POST',
    headers: { ...sbHeaders(env), 'Content-Type': mime, 'x-upsert': 'true' },
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
    const r = await fetch(`${env.SUPABASE_URL}/storage/v1/object/${BUCKET}/${key}`, { headers: sbHeaders(env) })
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


// Command Centre (Boss home), company pages, employee home + Cargo Sales desk.
// सारा पुराना business data legacy_records में है — यहाँ उसी से summary बनती है.
// नया entry (call log, order, quotation, task done) भी legacy_records में ही जाता है.

const COMPANIES = ['JDAC Logistics', 'Jupiter Equipment', 'GovaaBazaar', 'JDAC Studios']
const N = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0 }
const d10 = (v) => (v == null || v === 'None' ? '' : String(v).slice(0, 10))
const s = (v) => (v == null || v === 'None' ? '' : String(v))
const LOST = /^(LS|IR)|not interested|irrelevant|cancel|^NC$/i
const WON = /booking|pickup|invoiced|completed|out for delivery|sale closed|payment pending|order placed/i

function journeyOf(stage) {
  const st = s(stage).trim()
  if (!st || /new/i.test(st)) return 'New'
  if (WON.test(st)) return 'Order Placed'
  if (LOST.test(st)) return 'Lost'
  if (/future/i.test(st)) return 'Future'
  if (/quotation/i.test(st)) return 'Quotation'
  if (/follow|awaiting/i.test(st)) return 'Follow-up'
  return 'Contacted'
}

// ── per-isolate cache (60 sec) ─────────────────────────────────────────────
let cache = { at: 0, data: null }
const TABLES = ['cargo_orders', 'cargo_quotes', 'cse_call_logs', 'ad_leads', 'ad_metrics', 'ad_campaigns', 'equipment_orders', 'fmcg_sales', 'fmcg_purchases', 'fmcg_products', 'inventory',
  'company_expenses', 'company_purchases', 'company_suppliers', 'expense_claims', 'invoices', 'receivables', 'vittiya_entries', 'desks', 'employee_desks', 'tasks', 'task_checklist',
  'projects', 'project_members', 'day_entries', 'social_posts', 'daily_reports', 'chat_messages', 'cse_targets', 'incentive_rules']
async function loadAll(env, fresh = false) {
  if (!fresh && cache.data && Date.now() - cache.at < 60000) return cache.data
  const { results } = await env.DB.prepare(`SELECT tbl, legacy_id, data FROM legacy_records WHERE tbl IN (${TABLES.map(() => '?').join(',')})`).bind(...TABLES).all()
  const data = Object.fromEntries(TABLES.map((t) => [t, []]))
  for (const r of results) { try { data[r.tbl].push({ ...JSON.parse(r.data), _rid: r.legacy_id }) } catch { /* bad row */ } }
  try { data.payments = (await env.DB.prepare('SELECT * FROM payments').all()).results } catch { data.payments = [] }
  try { data.bookings = (await env.DB.prepare('SELECT b.*, e.name FROM daily_bookings b LEFT JOIN employees e ON e.id = b.emp_id').all()).results } catch { data.bookings = [] }
  try { data.deskEntries = (await env.DB.prepare('SELECT x.amount, x.date, d.company FROM desk_entries x JOIN desks d ON d.id = x.desk_id WHERE x.amount > 0').all()).results } catch { data.deskEntries = [] }
  cache = { at: Date.now(), data }
  return data
}
const dropCache = () => { cache = { at: 0, data: null } }

function rangeOf(range, today) {
  const t = new Date(today + 'T00:00:00Z')
  if (range === 'today') return [today, today]
  if (range === 'week') { const dow = (t.getUTCDay() + 6) % 7; t.setUTCDate(t.getUTCDate() - dow); return [t.toISOString().slice(0, 10), today] }
  return [today.slice(0, 8) + '01', today]
}
const inR = (d, [a, b]) => d && d >= a && d <= b

// ── पैसे का हिसाब — हर company के लिए ─────────────────────────────────────────
function money(D, company, R) {
  const m = { booked: 0, collected: 0, costs: 0, purchases: 0, expenses: 0, to_collect: 0, to_pay: 0, orders: 0, markup: null }
  const live = (x) => !/cancel|reject/i.test(s(x.stage) + s(x.status))
  if (company === 'JDAC Logistics') {
    let sale = 0, cost = 0
    m.cse_bookings = (D.bookings || []).filter((b) => inR(b.date, R)).reduce((a, b) => a + N(b.amount), 0)
    for (const o of D.cargo_orders) if (orderCounts(o) && inR(d10(o.date || o.createdAt), R)) {
      m.booked += N(o.amount); m.orders++
      if (N(o.vendorCost) > 0) { sale += N(o.amount); cost += N(o.vendorCost) }
      m.costs += N(o.vendorCost)
    }
    m.markup = cost > 0 ? Math.round(((sale - cost) / cost) * 100) : null
  }
  if (company === 'Jupiter Equipment') {
    for (const o of D.equipment_orders) if (live(o) && inR(d10(o.createdAt), R)) { m.booked += N(o.rentAmount) + N(o.transport); m.orders++ }
  }
  if (company === 'GovaaBazaar') {
    for (const o of D.fmcg_sales) if (inR(d10(o.date || o.createdAt), R)) { m.booked += N(o.total); m.orders++ }
    for (const p of D.fmcg_purchases) if (inR(d10(p.date || p.createdAt), R)) { m.purchases += N(p.total); m.costs += N(p.total) }
    for (const r of D.receivables) if (/fmcg/i.test(s(r.business)) && inR(d10(r.invoiceDate), R)) m.booked += N(r.amount)
  }
  // Simple entry desks के money fields → company Booked
  for (const x of D.deskEntries || []) if (x.company === company && inR(x.date, R)) m.booked += N(x.amount)
  const pays = D.payments || []
  for (const i of D.invoices) {
    if (s(i.company) !== company || !live(i)) continue
    const d = d10(i.date || i.createdAt)
    if (company !== 'JDAC Logistics' && inR(d, R)) { m.booked += N(i.total); m.orders++ }
    const p = pays.filter((x) => x.invoice_id === String(i._rid))
    // Collected = दर्ज payments; पुराने invoices जो पहले से "Paid" थे (बिना payment record) — उनका total
    if (p.length) { for (const x of p) if (inR(x.date, R)) m.collected += N(x.amount) }
    else if (/^paid$/i.test(s(i.status)) && inR(d, R)) m.collected += N(i.total)
    const due = N(i.total) - p.reduce((a, x) => a + N(x.amount), 0)
    if (!/^paid$/i.test(s(i.status)) && due > 0.5) m.to_collect += due
  }
  for (const r of D.receivables) {
    const co = /fmcg/i.test(s(r.business)) ? 'GovaaBazaar' : s(r.business)
    if (co !== company) continue
    if (/collect|paid/i.test(s(r.status))) { if (inR(d10(r.collectedAt || r.invoiceDate), R)) m.collected += N(r.amount) } else m.to_collect += N(r.amount)
  }
  for (const p of D.company_purchases) if (s(p.company) === company && live(p)) {
    if (inR(d10(p.date), R)) { m.purchases += N(p.amount); m.costs += N(p.amount) }
    if (/pending|unpaid|due/i.test(s(p.status))) m.to_pay += N(p.amount)
  }
  for (const e of D.company_expenses) if (s(e.company) === company && live(e) && inR(d10(e.date), R)) { m.expenses += N(e.amount); m.costs += N(e.amount) }
  m.profit = m.booked - m.costs
  m.money_in = m.collected || m.booked
  m.net = m.money_in - m.purchases - m.expenses
  return m
}

// Order Booked में तभी गिना जाए: cancel/reject नहीं, और markup approval pending नहीं
const orderCounts = (o) => !/cancel/i.test(s(o.stage)) && !/pending|rejected/i.test(s(o.approvalStatus))
const markupOf = (o) => (N(o.vendorCost) > 0 ? Math.round(((N(o.amount) - N(o.vendorCost)) / N(o.vendorCost)) * 100) : null)
const nameKey = (n) => s(n).trim().split(/\s+/)[0].toLowerCase()
function cseList(D, emps) {
  // Cargo desk वाले लोग (पुराना desk assignment) + जिनके नाम पर leads हैं
  const cargoDesk = new Set(D.desks.filter((d) => s(d.module_key) === 'cargo').map((d) => String(d.id)))
  const pids = new Set(D.employee_desks.filter((x) => cargoDesk.has(String(x.desk_id)) && (!x.revoked_at || x.revoked_at === 'None')).map((x) => String(x.person_id)))
  return emps.filter((e) => e.active && (pids.has(String(e.legacy_id)) || D.cargo_orders.some((o) => String(o.personId) === String(e.legacy_id) && e.legacy_id)))
}
const leadsOf = (D, emp) => D.ad_leads.filter((l) => nameKey(l.cseName) === nameKey(emp.name))
const isMine = (r, e) => (e.legacy_id && String(r.personId) === String(e.legacy_id)) || String(r.emp_id || '') === String(e.id) || (r.cseName && nameKey(r.cseName) === nameKey(e.name))
const mine = (rows, emp, field = 'personId') => rows.filter((r) => (emp.legacy_id && String(r[field]) === String(emp.legacy_id)) || String(r.emp_id || '') === String(emp.id))

function homeSummary(D, emps, today, range, company, cses) {
  const R = rangeOf(range, today)
  const cos = company && company !== 'All' ? [company] : COMPANIES
  const per = Object.fromEntries(COMPANIES.map((c) => [c, money(D, c, R)]))
  const perMonth = range === 'month' ? per : Object.fromEntries(COMPANIES.map((c) => [c, money(D, c, rangeOf('month', today))]))
  const group = { booked: 0, collected: 0, costs: 0, profit: 0, to_collect: 0, to_pay: 0, cse_bookings: 0 }
  for (const c of cos) for (const k of Object.keys(group)) group[k] += per[c][k] || 0
  const logi = cos.includes('JDAC Logistics')
  // Waiting on you (0 वाली rows client में छुपती हैं)
  const pendingApproval = logi ? D.cargo_orders.filter((o) => /pending/i.test(s(o.approvalStatus)) && !/cancel/i.test(s(o.stage))) : []
  const claims = D.expense_claims.filter((c) => /pending|submitted/i.test(s(c.status)))
  const old30 = new Date(Date.parse(today) - 30 * 864e5).toISOString().slice(0, 10)
  const pays = D.payments || []
  const unpaid = D.invoices.filter((i) => cos.includes(s(i.company)) && s(i.kind || 'Invoice') === 'Invoice' && !/^paid$|cancel/i.test(s(i.status)) && d10(i.date || i.createdAt) <= old30)
    .map((i) => ({ i, due: N(i.total) - pays.filter((p) => p.invoice_id === String(i._rid)).reduce((a, p) => a + N(p.amount), 0) })).filter((x) => x.due > 0.5)
  const called = new Set(D.cse_call_logs.map((c) => String(c.leadId)))
  const cutoff = Date.now() - 72 * 36e5
  const uncalled = logi ? D.ad_leads.filter((l) => journeyOf(l.stage) === 'New' && !called.has(String(l.id)) && !s(l.lastActivityAt) && Date.parse((s(l.createdAt) || s(l.date)).replace(' ', 'T') + '+05:30') < cutoff) : []
  // Logistics sales today (हमेशा today) — markup = उस CSE के आज के orders का average
  const T = [today, today]
  const sales = (cses || cseList(D, emps)).map((e) => {
    const ord = D.cargo_orders.filter((o) => isMine(o, e) && orderCounts(o) && inR(d10(o.date || o.createdAt), T))
    const mk = ord.map(markupOf).filter((x) => x != null)
    return { emp_id: e.id, name: e.name, calls: D.cse_call_logs.filter((c) => isMine(c, e) && inR(d10(c.createdAt), T)).length,
      quotes: D.cargo_quotes.filter((q) => isMine(q, e) && inR(d10(q.date || q.createdAt), T)).length, orders: ord.length,
      markup: mk.length ? Math.round(mk.reduce((a, x) => a + x, 0) / mk.length) : null }
  })
  // Logistics ops today
  const ops = { pickup: 0, transit: 0, delivered: 0 }
  for (const o of D.cargo_orders) {
    if (/cancel/i.test(s(o.stage)) || /pending|rejected/i.test(s(o.approvalStatus))) continue
    const st = s(o.stage)
    if (/^booked$|^booking$|pickup due|^new$/i.test(st)) ops.pickup++
    else if (/picked up|transit|out for/i.test(st)) ops.transit++
    else if (/deliver/i.test(st) && d10(o.updatedAt || o.date) === today) ops.delivered++
  }
  // Leads & ads today
  const spend = D.ad_metrics.filter((m) => d10(m.date) === today).reduce((a, m) => a + N(m.spend), 0)
  const leads = D.ad_leads.filter((l) => d10(l.date || l.createdAt) === today).length
  // Companies table (this month) — Logistics markup = average of month orders with vendor cost
  const mo = rangeOf('month', today)
  const mk = D.cargo_orders.filter((o) => orderCounts(o) && inR(d10(o.date), mo)).map(markupOf).filter((x) => x != null)
  return { range, from: R[0], to: R[1], company: company || 'All', group,
    companies: COMPANIES.map((c) => ({ name: c, booked: perMonth[c].booked, profit: perMonth[c].profit, markup: c === 'JDAC Logistics' && mk.length ? Math.round(mk.reduce((a, x) => a + x, 0) / mk.length) : null })),
    waiting: { pending_approval: pendingApproval.length, pending_amount: pendingApproval.reduce((a, o) => a + N(o.amount), 0),
      claims: claims.length, claims_amount: claims.reduce((a, c) => a + N(c.amount), 0),
      unpaid_30: unpaid.length, unpaid_30_amount: unpaid.reduce((a, x) => a + x.due, 0), uncalled_72h: uncalled.length },
      // weight_diff: Om के Ops panel के बाद यहाँ आएगा
    sales, ops, ads: { spend, leads, cpl: leads && spend ? Math.round(spend / leads) : null } }
}

function companyPage(D, emps, today, name, range = 'month', desks = [], cses = []) {
  const R = rangeOf(range, today)
  const m = money(D, name, R)
  const kpis = [], sell = [], buy = [], spend = []
  let manager = null
  if (name === 'JDAC Logistics') {
    const open = D.cargo_orders.filter((o) => orderCounts(o) && !/deliver|completed|invoiced/i.test(s(o.stage)))
    const openLeads = D.ad_leads.filter((l) => !['Lost', 'Order Placed'].includes(journeyOf(l.stage)))
    kpis.push(['Cargo orders', m.orders], ['CSE bookings', m.cse_bookings, 'money'], ['Open consignments', open.length], ['Open leads', openLeads.length])
    const j = { New: 0, Contacted: 0, Quotation: 0, 'Follow-up': 0, Future: 0, 'Order Placed': 0, Lost: 0 }
    for (const l of D.ad_leads) j[journeyOf(l.stage)]++
    const pool = D.ad_leads.filter((l) => !s(l.cseName).trim() && !['Lost', 'Order Placed'].includes(journeyOf(l.stage)))
    const mo = rangeOf('month', today)
    manager = {
      sales_team: cses.map((e) => {
        const o = D.cargo_orders.filter((x) => orderCounts(x) && inR(d10(x.date), mo) && isMine(x, e))
        return { id: e.id, name: e.name, leads: leadsOf(D, e).filter((l) => !['Lost', 'Order Placed'].includes(journeyOf(l.stage))).length, calls: D.cse_call_logs.filter((c) => isMine(c, e) && inR(d10(c.createdAt), mo)).length,
          orders: o.length, amount: o.reduce((a, x) => a + N(x.amount), 0), profit: o.reduce((a, x) => a + (N(x.vendorCost) > 0 ? N(x.amount) - N(x.vendorCost) : 0), 0) }
      }).sort((a, b) => b.profit - a.profit),
      pipeline: j, pool: pool.length, pool_leads: pool.slice(0, 200).map((l) => ({ id: l._rid, name: s(l.name), phone: s(l.phone), date: d10(l.date) })),
      ops: D.cargo_orders.slice().sort((a, b) => d10(b.date).localeCompare(d10(a.date))).map((o) => ({ id: o._rid, date: d10(o.date), customer: s(o.customerName), cse: s(o.cseName), mode: s(o.mode), kg: N(o.kg),
        amount: N(o.amount), vendor_cost: N(o.vendorCost), markup: markupOf(o), approval: s(o.approvalStatus), stage: s(o.stage) || 'Booked', invoice: s(o.invoiceNo), reason: s(o.rejectReason || o.cancelReason) })),
    }
  } else if (name === 'Jupiter Equipment') {
    const withCust = D.equipment_orders.filter((o) => /with customer|delivered/i.test(s(o.stage)))
    kpis.push(['Orders', m.orders], ['With customer', withCust.length], ['All orders', D.equipment_orders.length], ['To collect', m.to_collect, 'money'])
    for (const o of D.equipment_orders) sell.push({ date: d10(o.createdAt), title: `${s(o.orderNo)} · ${s(o.customerName)} · ${s(o.equipment)}`, who: s(o.leadSource), amount: N(o.rentAmount) + N(o.transport), status: s(o.stage) })
  } else if (name === 'GovaaBazaar') {
    const stock = D.inventory.reduce((a, i) => a + N(i.totalQty), 0)
    kpis.push(['Sales entries', m.orders], ['Products', D.fmcg_products.length + D.inventory.length], ['Stock (qty)', stock], ['To collect', m.to_collect, 'money'])
    for (const o of D.fmcg_sales) sell.push({ date: d10(o.date), title: `${s(o.productName)} × ${N(o.qty)}`, who: s(o.channel), amount: N(o.total), status: '' })
    for (const r of D.receivables) if (/fmcg/i.test(s(r.business))) sell.push({ date: d10(r.invoiceDate), title: `${s(r.storeName)} (receivable)`, who: s(r.channel), amount: N(r.amount), status: s(r.status) })
    for (const p of D.fmcg_purchases) buy.push({ date: d10(p.date), title: `${s(p.productName)} × ${N(p.qty)}`, who: s(p.supplier), amount: N(p.total), status: '' })
  } else if (name === 'JDAC Studios') {
    const spendR = D.ad_metrics.filter((x) => inR(d10(x.date), R)).reduce((a, x) => a + N(x.spend), 0)
    const leadsR = D.ad_leads.filter((l) => inR(d10(l.date), R)).length
    kpis.push(['Ad spend', spendR, 'money'], ['Leads', leadsR], ['Active campaigns', D.ad_campaigns.filter((c) => /active/i.test(s(c.status))).length], ['Social posts', D.social_posts.length])
    manager = { campaigns: D.ad_campaigns.map((c) => {
      const met = D.ad_metrics.filter((x) => String(x.campaignId) === String(c.id)), ld = D.ad_leads.filter((l) => String(l.campaignId) === String(c.id)).length
      const sp = met.reduce((a, x) => a + N(x.spend), 0)
      return { id: c._rid, name: s(c.name), brand: s(c.company), platform: s(c.platform), status: s(c.status), cse: s(c.cse), spend: sp, leads: ld, cpl: ld && sp ? Math.round(sp / ld) : null }
    }) }
  }
  for (const p of D.company_purchases) if (s(p.company) === name) buy.push({ date: d10(p.date), title: s(p.description), who: s(p.supplierName), amount: N(p.amount), status: s(p.status) })
  for (const e of D.company_expenses) if (s(e.company) === name) spend.push({ date: d10(e.date), title: `${s(e.category)} · ${s(e.description)}`, who: s(e.paymentMode), amount: N(e.amount), status: s(e.status) })
  const byDate = (a, b) => (b.date || '').localeCompare(a.date || '')
  return { name, range, money: m, kpis, sell: sell.sort(byDate), buy: buy.sort(byDate), spend: spend.sort(byDate), desks, manager }
}

// ── Employee ───────────────────────────────────────────────────────────────
function myHome(D, emp, today, myDesks = []) {
  const isMine = (t) => (emp.legacy_id && String(t.assigneeId) === String(emp.legacy_id)) || String(t.assignee_emp || '') === String(emp.id)
  const tasks = D.tasks.filter(isMine)
  const open = tasks.filter((t) => !/done|closed|complete/i.test(s(t.status)))
  const doneToday = tasks.filter((t) => /done|closed|complete/i.test(s(t.status)) && d10(t.closedAt) === today).length
  const overdue = open.filter((t) => d10(t.due) && d10(t.due) < today).length
  const desks = myDesks.map((d) => ({ id: String(d.id), name: d.name, icon: d.icon, description: d.description || (d.kind === 'later' ? 'coming later' : ''), module: d.kind === 'simple' ? 'simple' : d.module, kind: d.kind, company: d.company }))
  const projIds = new Set(D.project_members.filter((m) => String(m.personId) === String(emp.legacy_id)).map((m) => String(m.projectId)))
  const projects = D.projects.filter((p) => projIds.has(String(p.id))).map((p) => ({ id: String(p.id), name: s(p.name),
    open: D.tasks.filter((t) => String(t.projectId || '') === String(p.id) && !/done|closed/i.test(s(t.status))).length,
    members: D.project_members.filter((m) => String(m.projectId) === String(p.id)).length }))
  const entries = D.day_entries.filter((e) => String(e.personId) === String(emp.legacy_id) && d10(e.date) === today).length
  const checklist = (id) => D.task_checklist.filter((c) => String(c.taskId) === String(id))
  return { name: emp.name, designation: emp.designation || emp.team, tasks_total: tasks.filter((t) => !/done|closed|complete/i.test(s(t.status)) || d10(t.closedAt) === today).length, tasks_done: doneToday, overdue, entries, desks, projects,
    up_next: open.sort((a, b) => (d10(a.due) || '9').localeCompare(d10(b.due) || '9')).slice(0, 30).map((t) => ({ id: t._rid, title: s(t.title), due: d10(t.due), priority: s(t.priority), status: s(t.status), notes: s(t.notes),
      checklist: checklist(t.id).map((c) => ({ id: c._rid, title: s(c.title), done: String(c.done) === '1' || c.done === true })) })) }
}

function cargoDesk(D, emp, emps, today, cses, showAll = false) {
  const leads = leadsOf(D, emp)
  const myOrders = D.cargo_orders.filter((o) => (emp.legacy_id && String(o.personId) === String(emp.legacy_id)) || nameKey(o.cseName) === nameKey(emp.name))
  const live = myOrders.filter(orderCounts)
  const calls = D.cse_call_logs.filter((c) => (emp.legacy_id && String(c.personId) === String(emp.legacy_id)) || String(c.emp_id || '') === String(emp.id))
  const day = (n) => new Date(Date.parse(today) - n * 864e5).toISOString().slice(0, 10)
  const block = (from, to) => { const o = live.filter((x) => inR(d10(x.date), [from, to])); return { orders: o.length, amount: o.reduce((a, x) => a + N(x.amount), 0), calls: calls.filter((c) => inR(d10(c.createdAt), [from, to])).length } }
  const j = { New: 0, Contacted: 0, Quotation: 0, 'Follow-up': 0, Future: 0, 'Order Placed': 0 }
  for (const l of leads) { const k = journeyOf(l.stage); if (k in j) j[k]++ }
  const now = Date.now()
  const waitH = (l) => Math.max(0, Math.round((now - Date.parse((s(l.lastActivityAt) || s(l.updatedAt) || s(l.createdAt) || today).replace(' ', 'T') + (s(l.lastActivityAt || l.updatedAt || l.createdAt).includes('T') ? '' : '+05:30'))) / 36e5))
  const due = leads.filter((l) => { const k = journeyOf(l.stage); return k === 'New' || ((k === 'Follow-up' || k === 'Quotation') && (!d10(l.nextFollowUp) || d10(l.nextFollowUp) <= today)) })
  const doNow = due.map((l) => ({ id: l._rid, name: s(l.name), phone: s(l.phone), stage: s(l.stage), journey: journeyOf(l.stage), city: s(l.city), wait_h: waitH(l) })).sort((a, b) => b.wait_h - a.wait_h)
  const month = today.slice(0, 8) + '01'
  // Leaderboard: इस महीने का profit (Amount − Vendor cost; approved, cancel नहीं). दूसरों का profit CSE को नहीं दिखता.
  const pool = (cses || []).concat([emp]).filter((e, i, a) => a.findIndex((x) => x.id === e.id) === i)
  const board = pool.map((e) => {
    const o = D.cargo_orders.filter((x) => orderCounts(x) && inR(d10(x.date), [month, today]) && isMine(x, e))
    const mk = o.map(markupOf).filter((x) => x != null)
    return { id: e.id, name: e.name, orders: o.length, profit: o.reduce((a, x) => a + (N(x.vendorCost) > 0 ? N(x.amount) - N(x.vendorCost) : 0), 0), avg_markup: mk.length ? Math.round(mk.reduce((a, x) => a + x, 0) / mk.length) : null }
  }).sort((a, b) => b.profit - a.profit || b.orders - a.orders).map((x, i) => ({ ...x, rank: i + 1 }))
  const leaderboard = board.map((x) => (x.id === emp.id || showAll ? x : { id: x.id, name: x.name, orders: x.orders, rank: x.rank }))
  const customers = {}
  for (const o of myOrders) { const k = s(o.phone) || s(o.customerName); customers[k] = customers[k] || { name: s(o.customerName), phone: s(o.phone), orders: 0, amount: 0 }; customers[k].orders++; customers[k].amount += N(o.amount) }
  const target = D.cse_targets.filter((t) => String(t.personId) === String(emp.legacy_id)).sort((a, b) => d10(b.date).localeCompare(d10(a.date)))[0]
  return {
    counts: { new: j.New, followups: due.filter((l) => journeyOf(l.stage) === 'Follow-up').length, quotes: j.Quotation, orders_today: block(today, today).orders },
    today: block(today, today), yesterday: block(day(1), day(1)), last7: block(day(6), today),
    pipeline: leads.filter((l) => !['Lost', 'Order Placed'].includes(journeyOf(l.stage))).length, new_today: leads.filter((l) => d10(l.date || l.createdAt) === today).length,
    month_amount: live.filter((x) => inR(d10(x.date), [month, today])).reduce((a, x) => a + N(x.amount), 0),
    do_now: doNow.slice(0, 20), do_now_total: doNow.length, journey: j, leaderboard, target: target ? { orders: N(target.targetOrders), incentive: N(target.incentive) } : null,
    orders: myOrders.sort((a, b) => d10(b.date).localeCompare(d10(a.date))).slice(0, 100).map((o) => ({ id: o._rid, date: d10(o.date), customer: s(o.customerName), phone: s(o.phone), mode: s(o.mode), kg: N(o.kg), amount: N(o.amount), vendor_cost: N(o.vendorCost), markup: markupOf(o), approval: s(o.approvalStatus), stage: s(o.stage), invoice: s(o.invoiceNo) })),
    customers: Object.values(customers).sort((a, b) => b.amount - a.amount),
    leads: leads.map((l) => ({ id: l._rid, name: s(l.name), phone: s(l.phone), stage: s(l.stage), journey: journeyOf(l.stage), date: d10(l.date), next: d10(l.nextFollowUp) })).sort((a, b) => b.date.localeCompare(a.date)),
  }
}

// Desk-first system (Desk-First Step 1–4), Daily Bookings, money rules (Tasks 1–5), public Forms.
// नए tables यहाँ बनते हैं (CREATE IF NOT EXISTS) — पुराना data legacy_records से एक बार copy होता है.

const DESK_TABLES = [
  `CREATE TABLE IF NOT EXISTS desks (id INTEGER PRIMARY KEY AUTOINCREMENT, company TEXT NOT NULL, name TEXT NOT NULL, icon TEXT, description TEXT,
    kind TEXT NOT NULL DEFAULT 'ready', module TEXT, fields TEXT, rolls_up TEXT, active INTEGER NOT NULL DEFAULT 1, legacy_id TEXT UNIQUE,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')))`,
  `CREATE TABLE IF NOT EXISTS desk_access (desk_id INTEGER NOT NULL, emp_id INTEGER NOT NULL, enabled INTEGER NOT NULL DEFAULT 1, changed_at TEXT, PRIMARY KEY (desk_id, emp_id))`,
  `CREATE TABLE IF NOT EXISTS desk_entries (id INTEGER PRIMARY KEY AUTOINCREMENT, desk_id INTEGER NOT NULL, emp_id INTEGER, date TEXT NOT NULL, data TEXT NOT NULL,
    amount REAL NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')), updated_at TEXT)`,
  `CREATE TABLE IF NOT EXISTS daily_bookings (id INTEGER PRIMARY KEY AUTOINCREMENT, emp_id INTEGER, date TEXT NOT NULL, booking_no TEXT NOT NULL UNIQUE COLLATE NOCASE,
    amount REAL NOT NULL CHECK (amount > 0), legacy_id TEXT UNIQUE, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')), updated_at TEXT)`,
  `CREATE TABLE IF NOT EXISTS payments (id INTEGER PRIMARY KEY AUTOINCREMENT, invoice_id TEXT NOT NULL, company TEXT, amount REAL NOT NULL CHECK (amount > 0), date TEXT NOT NULL,
    mode TEXT NOT NULL, reference TEXT, by_emp INTEGER, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')))`,
  `CREATE TABLE IF NOT EXISTS public_forms (id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL, icon TEXT, fields TEXT NOT NULL,
    project_id TEXT, project_name TEXT, becomes TEXT NOT NULL DEFAULT 'entry', status TEXT NOT NULL DEFAULT 'live', created_by INTEGER,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')))`,
  `CREATE TABLE IF NOT EXISTS form_answers (id INTEGER PRIMARY KEY AUTOINCREMENT, form_id INTEGER NOT NULL, data TEXT NOT NULL, result TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')))`,
  // Invoice नंबर कभी दोबारा न हो (company + kind + docNo)
  `CREATE UNIQUE INDEX IF NOT EXISTS ux_invoice_docno ON legacy_records (json_extract(data, '$.company'), json_extract(data, '$.kind'), json_extract(data, '$.docNo')) WHERE tbl = 'invoices'`,
]

// Ready desks = app में बनी screens. "rolls" = group panel में क्या जुड़ता है.
const MODULES = {
  cargo: { name: 'Cargo Sales & Leads', company: 'JDAC Logistics', icon: '📦', rolls: 'Calls, quotes, orders, markup → Home "Logistics sales today"' },
  punch: { name: 'Order Punch', company: 'JDAC Logistics', icon: '🧾', rolls: 'Orders with vendor cost → Booked, Costs, Profit' },
  bookings: { name: 'Daily Bookings', company: 'JDAC Logistics', icon: '📒', rolls: 'Daily total → "CSE bookings" on Logistics Overview and Home' },
  collections: { name: 'Bills & Collections', company: 'JDAC Logistics', icon: '💰', rolls: 'Payments → Collected, To collect' },
  'accounts-entry': { name: 'Accounts Entry', company: 'JDAC Logistics', icon: '📒', rolls: 'Expenses and purchases → Costs, To pay vendors' },
  'ops-later': { name: 'Ops · pickup to delivery', company: 'JDAC Logistics', icon: '🚚', rolls: 'Pickup due, in transit, delivered → Home "Logistics ops" (coming later, owner Om)' },
  perf: { name: 'Performance Marketing', company: 'JDAC Studios', icon: '📈', rolls: 'Spend, leads, cost per lead → Home "Leads & ads"' },
  social: { name: 'Social Media', company: 'JDAC Studios', icon: '📣', rolls: 'Posts and content calendar → Studios Overview' },
  'jupiter-orders': { name: 'Equipment Orders', company: 'Jupiter Equipment', icon: '🏥', rolls: 'Rent booked → Jupiter Booked' },
  fmcg: { name: 'FMCG Orders', company: 'GovaaBazaar', icon: '🛒', rolls: 'Sales → GovaaBazaar Booked' },
}

const dN = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0 }
const r2 = (n) => Math.round(n * 100) / 100
const MARKUP_MIN = 40
const gstSplit = (total) => { const taxable = r2(total / 1.18); return { taxable, gst: r2(total - taxable) } }
function fyOf(date) { const y = Number(date.slice(0, 4)), m = Number(date.slice(5, 7)); const s = m >= 4 ? y : y - 1; return `${String(s).slice(2)}-${String(s + 1).slice(2)}` }
const PREFIX = { 'JDAC Logistics': 'JL', 'Jupiter Equipment': 'JE', GovaaBazaar: 'GB', 'JDAC Studios': 'JS' }

async function migrateDesks(env, emps) {
  // 1) पुराने desks (legacy) → नए desks; Warehouse/Delivery → "Ops" placeholder में (records वैसे ही रहते हैं)
  const { results: L } = await env.DB.prepare("SELECT legacy_id, data FROM legacy_records WHERE tbl IN ('desks')").all()
  const old = L.map((r) => ({ ...JSON.parse(r.data), _rid: r.legacy_id }))
  const byLegacyPerson = new Map(emps.filter((e) => e.legacy_id).map((e) => [String(e.legacy_id), e.id]))
  const modOf = (d) => ({ 'campaign-cse': 'cargo', 'order-punch': 'punch', 'logistics-collections': 'collections', accounts: 'accounts-entry', 'perf-marketing': 'perf', 'social-media': 'social', warehouse: 'ops-later', delivery: 'ops-later' }[d.module_key] || d.module_key)
  const idFor = new Map()
  for (const d of old) {
    const mod = modOf(d)
    const ex = await env.DB.prepare('SELECT id FROM desks WHERE module = ? AND company = ?').bind(mod, d.company).first()
    if (ex) { idFor.set(String(d.id), ex.id); continue }
    if (String(d.active) === '0' && MODULES[mod] && mod !== 'ops-later') continue
    const m = MODULES[mod] || {}
    const r = await env.DB.prepare('INSERT INTO desks (company, name, icon, description, kind, module, rolls_up, active, legacy_id) VALUES (?,?,?,?,?,?,?,?,?) RETURNING id')
      .bind(d.company, m.name || d.name, m.icon || d.icon, d.description || '', mod === 'ops-later' ? 'later' : 'ready', mod, m.rolls || null, 1, String(d.id)).first()
    idFor.set(String(d.id), r.id)
  }
  // हर module का desk ज़रूर हो
  for (const [mod, m] of Object.entries(MODULES)) {
    if (!(await env.DB.prepare('SELECT 1 x FROM desks WHERE module = ?').bind(mod).first()))
      await env.DB.prepare('INSERT INTO desks (company, name, icon, description, kind, module, rolls_up) VALUES (?,?,?,?,?,?,?)').bind(m.company, m.name, m.icon, '', mod === 'ops-later' ? 'later' : 'ready', mod, m.rolls).run()
  }
  const cargoDesk0 = await env.DB.prepare("SELECT id FROM desks WHERE module = 'cargo'").first()
  // 2) पुराने assignments → desk_access (revoked = Off)
  const { results: A } = await env.DB.prepare("SELECT data FROM legacy_records WHERE tbl = 'employee_desks'").all()
  for (const a of A.map((r) => JSON.parse(r.data))) {
    const did = idFor.get(String(a.desk_id)), eid = byLegacyPerson.get(String(a.person_id))
    if (!did || !eid) continue
    const on = !a.revoked_at || a.revoked_at === 'None' ? 1 : 0
    await env.DB.prepare('INSERT INTO desk_access (desk_id, emp_id, enabled, changed_at) VALUES (?,?,?,?) ON CONFLICT (desk_id, emp_id) DO UPDATE SET enabled = MAX(enabled, excluded.enabled)').bind(did, eid, on, new Date().toISOString()).run()
  }
  // Neetu और Mohin = Cargo Sales CSE (Daily Bookings prompt में तय)
  if (cargoDesk0) for (const lp of ['6', '16552025']) { const eid = byLegacyPerson.get(lp); if (eid) await env.DB.prepare('INSERT INTO desk_access (desk_id, emp_id, enabled, changed_at) VALUES (?,?,1,?) ON CONFLICT (desk_id, emp_id) DO UPDATE SET enabled = 1').bind(cargoDesk0.id, eid, new Date().toISOString()).run() }
  // Daily Bookings: Cargo Sales वाले सभी CSE के लिए On (default)
  const cargo = await env.DB.prepare("SELECT id FROM desks WHERE module = 'cargo'").first(), bk = await env.DB.prepare("SELECT id FROM desks WHERE module = 'bookings'").first()
  if (cargo && bk) await env.DB.prepare('INSERT OR IGNORE INTO desk_access (desk_id, emp_id, enabled, changed_at) SELECT ?, emp_id, 1, ? FROM desk_access WHERE desk_id = ? AND enabled = 1').bind(bk.id, new Date().toISOString(), cargo.id).run()
  // 3) पुरानी daily bookings → नई table (booking no. दोहराए हों तो "(old #id)" जोड़कर)
  const { results: B } = await env.DB.prepare("SELECT legacy_id, data FROM legacy_records WHERE tbl = 'daily_bookings'").all()
  for (const r of B) {
    const b = JSON.parse(r.data)
    if (await env.DB.prepare('SELECT 1 x FROM daily_bookings WHERE legacy_id = ?').bind(r.legacy_id).first()) continue
    let no = String(b.bookingNo || r.legacy_id)
    if (await env.DB.prepare('SELECT 1 x FROM daily_bookings WHERE booking_no = ?').bind(no).first()) no = `${no} (old #${r.legacy_id})`
    if (dN(b.amount) > 0) await env.DB.prepare('INSERT INTO daily_bookings (emp_id, date, booking_no, amount, legacy_id, created_at) VALUES (?,?,?,?,?,?)')
      .bind(byLegacyPerson.get(String(b.personId)) || null, String(b.date).slice(0, 10), no, dN(b.amount), r.legacy_id, String(b.createdAt || b.date)).run()
  }
}

function registerDesks(on, X) {
  const { authUser, needAdmin, json, body, bad, HttpError, istDate, audit, ADMIN_ROLES, loadAll, dropCache, legacyGet, legacySet, legacyPut, nowLocal } = X
  const isAdmin = (me) => ADMIN_ROLES.includes(me.role)
  const needBoss = (me) => { if (!['boss', 'developer'].includes(me.role)) throw new HttpError(403, 'Boss / Developer only') }

  // ── Desks (admin) ────────────────────────────────────────────────────────
  on('GET', '/api/desks', async (env, req, url) => {
    const me = await authUser(env, req); needAdmin(me)
    const co = url.searchParams.get('company')
    const { results: desks } = await env.DB.prepare(`SELECT * FROM desks WHERE active = 1 ${co && co !== 'All' ? 'AND company = ?' : ''} ORDER BY company, kind = 'later', id`).bind(...(co && co !== 'All' ? [co] : [])).all()
    const { results: acc } = await env.DB.prepare('SELECT a.desk_id, a.enabled, e.id, e.name, e.designation, e.team FROM desk_access a JOIN employees e ON e.id = a.emp_id WHERE e.active = 1').all()
    const { results: emps } = await env.DB.prepare("SELECT id, name, designation, team, role FROM employees WHERE active = 1 ORDER BY name").all()
    return json({ desks: desks.map((d) => ({ ...d, fields: d.fields ? JSON.parse(d.fields) : null, rolls_up: d.rolls_up || MODULES[d.module]?.rolls || 'Entries and money fields → company Overview and group Home',
      people: acc.filter((a) => a.desk_id === d.id && a.enabled).map((a) => ({ id: a.id, name: a.name })) })), employees: emps, access: acc.map((a) => ({ desk_id: a.desk_id, emp_id: a.id, enabled: !!a.enabled })) })
  })
  on('POST', '/api/desks/access', async (env, req) => {
    const me = await authUser(env, req); needAdmin(me); const b = await body(req)
    const d = await env.DB.prepare('SELECT id, name FROM desks WHERE id = ?').bind(Number(b.desk_id)).first(); if (!d) throw new HttpError(404, 'Desk नहीं मिला')
    const e = await env.DB.prepare('SELECT id, name FROM employees WHERE id = ?').bind(Number(b.emp_id)).first(); if (!e) throw new HttpError(404, 'Employee नहीं मिला')
    await env.DB.prepare('INSERT INTO desk_access (desk_id, emp_id, enabled, changed_at) VALUES (?,?,?,?) ON CONFLICT (desk_id, emp_id) DO UPDATE SET enabled = excluded.enabled, changed_at = excluded.changed_at').bind(d.id, e.id, b.enabled ? 1 : 0, new Date().toISOString()).run()
    await audit(env, me.id, b.enabled ? 'desk_on' : 'desk_off', 'desk_access', `${d.id}:${e.id}`, null, { desk: d.name, emp: e.name })
    return json({ ok: true })
  })
  on('POST', '/api/desks', async (env, req) => {
    const me = await authUser(env, req); needBoss(me); const b = await body(req)
    const name = String(b.name || '').trim().slice(0, 60); if (!name) throw bad('Desk का नाम')
    const company = String(b.company || ''); if (!['JDAC Logistics', 'Jupiter Equipment', 'GovaaBazaar', 'JDAC Studios'].includes(company)) throw bad('Company चुनें')
    let fields = null, module = null, kind = b.kind === 'simple' ? 'simple' : 'ready'
    if (kind === 'ready') { module = String(b.module || ''); if (!MODULES[module]) throw bad('Built screen चुनें') }
    else {
      fields = (Array.isArray(b.fields) ? b.fields : []).map((f, i) => ({ key: 'f' + (i + 1), label: String(f.label || '').trim().slice(0, 60), type: ['text', 'number', 'money', 'date', 'choice', 'photo'].includes(f.type) ? f.type : 'text',
        options: f.type === 'choice' ? String(f.options || '').split('/').map((x) => x.trim()).filter(Boolean).slice(0, 12) : undefined })).filter((f) => f.label)
      if (!fields.length) throw bad('कम से कम एक field डालें')
    }
    const r = await env.DB.prepare('INSERT INTO desks (company, name, icon, description, kind, module, fields, rolls_up) VALUES (?,?,?,?,?,?,?,?) RETURNING id')
      .bind(company, name, String(b.icon || (kind === 'simple' ? '✍️' : MODULES[module].icon)), String(b.description || '').slice(0, 120), kind, module, fields ? JSON.stringify(fields) : null, kind === 'simple' ? 'Money fields add up on the company Overview and group Home' : MODULES[module].rolls).first()
    await audit(env, me.id, 'desk_create', 'desks', r.id, null, { name, company, kind })
    return json({ ok: true, id: r.id })
  })
  on('GET', '/api/desks/:id/entries', async (env, req, url, p) => {
    const me = await authUser(env, req)
    const d = await env.DB.prepare('SELECT * FROM desks WHERE id = ?').bind(Number(p.id)).first(); if (!d) throw new HttpError(404, 'Desk नहीं मिला')
    const all = isAdmin(me) && url.searchParams.get('all') === '1'
    if (!all && !(await env.DB.prepare('SELECT 1 x FROM desk_access WHERE desk_id = ? AND emp_id = ? AND enabled = 1').bind(d.id, me.id).first()) && !isAdmin(me)) throw new HttpError(403, 'यह desk आपके लिए on नहीं है')
    const { results } = await env.DB.prepare(`SELECT x.*, e.name FROM desk_entries x LEFT JOIN employees e ON e.id = x.emp_id WHERE x.desk_id = ? ${all ? '' : 'AND x.emp_id = ?'} ORDER BY x.date DESC, x.id DESC LIMIT 500`).bind(...(all ? [d.id] : [d.id, me.id])).all()
    return json({ desk: { ...d, fields: JSON.parse(d.fields || '[]') }, entries: results.map((r) => ({ ...r, data: JSON.parse(r.data) })) })
  })
  on('POST', '/api/desks/:id/entries', async (env, req, url, p) => {
    const me = await authUser(env, req); const b = await body(req)
    const d = await env.DB.prepare("SELECT * FROM desks WHERE id = ? AND kind = 'simple'").bind(Number(p.id)).first(); if (!d) throw new HttpError(404, 'Desk नहीं मिला')
    if (!isAdmin(me) && !(await env.DB.prepare('SELECT 1 x FROM desk_access WHERE desk_id = ? AND emp_id = ? AND enabled = 1').bind(d.id, me.id).first())) throw new HttpError(403, 'यह desk आपके लिए on नहीं है')
    const fields = JSON.parse(d.fields || '[]'), data = {}
    let amount = 0
    for (const f of fields) {
      let v = b.data?.[f.key]
      if (f.type === 'number' || f.type === 'money') { v = v === '' || v == null ? null : dN(v); if (f.type === 'money' && v) amount += v }
      else if (f.type === 'photo') v = typeof v === 'string' && v.length < 300000 ? v : null
      else v = v == null ? '' : String(v).slice(0, 500)
      data[f.key] = v
    }
    const date = /^\d{4}-\d{2}-\d{2}$/.test(b.date || '') ? b.date : istDate()
    await env.DB.prepare('INSERT INTO desk_entries (desk_id, emp_id, date, data, amount) VALUES (?,?,?,?,?)').bind(d.id, me.id, date, JSON.stringify(data), amount).run()
    return json({ ok: true })
  })

  // ── Daily Bookings ─────────────────────────────────────────────────────────
    on('GET', '/api/bookings', async (env, req, url) => {
    const me = await authUser(env, req)
    const today = istDate(), t = new Date(today + 'T00:00:00Z'); const dow = (t.getUTCDay() + 6) % 7; t.setUTCDate(t.getUTCDate() - dow)
    const week = t.toISOString().slice(0, 10), month = today.slice(0, 8) + '01'
    const adminAll = isAdmin(me) && url.searchParams.get('all') === '1'
    const from = url.searchParams.get('from') || (adminAll ? week : month), to = url.searchParams.get('to') || today
    const emp = adminAll ? (url.searchParams.get('emp') ? Number(url.searchParams.get('emp')) : null) : me.id
    const where = `date BETWEEN ? AND ?${emp ? ' AND emp_id = ?' : ''}`, args = [from, to, ...(emp ? [emp] : [])]
    const { results } = await env.DB.prepare(`SELECT b.*, e.name FROM daily_bookings b LEFT JOIN employees e ON e.id = b.emp_id WHERE ${where} ORDER BY date DESC, b.id DESC LIMIT 2000`).bind(...args).all()
    const sum = async (f) => (await env.DB.prepare(`SELECT COALESCE(SUM(amount),0) s, COUNT(*) n FROM daily_bookings WHERE date BETWEEN ? AND ?${adminAll ? '' : ' AND emp_id = ?'}`).bind(f, today, ...(adminAll ? [] : [me.id])).first())
    const [st, sw, sm] = await Promise.all([sum(today), sum(week), sum(month)])
    const per = {}
    for (const r of results) { const k = r.emp_id || 0; per[k] = per[k] || { emp_id: r.emp_id, name: r.name || '—', bookings: 0, amount: 0, today: 0 }; per[k].bookings++; per[k].amount += r.amount; if (r.date === today) per[k].today += r.amount }
    return json({ today, from, to, totals: { today: st.s, week: sw.s, month: sm.s, today_n: st.n }, rows: results, per_cse: Object.values(per).sort((a, b) => b.amount - a.amount) })
  })
  on('POST', '/api/bookings', async (env, req) => {
    const me = await authUser(env, req); const b = await body(req)
    const no = String(b.booking_no || '').trim().slice(0, 40); if (!no) throw bad('Booking number डालें')
    const amount = dN(b.amount); if (amount <= 0) throw bad('Amount डालें')
    const date = /^\d{4}-\d{2}-\d{2}$/.test(b.date || '') ? b.date : istDate()
    if (date > istDate()) throw bad('आगे की तारीख नहीं')
    if (await env.DB.prepare('SELECT 1 x FROM daily_bookings WHERE booking_no = ?').bind(no).first()) throw new HttpError(409, `${no} was already entered — use a new number`)
    await env.DB.prepare('INSERT INTO daily_bookings (emp_id, date, booking_no, amount) VALUES (?,?,?,?)').bind(me.id, date, no, amount).run()
    return json({ ok: true })
  })
  on('PATCH', '/api/bookings/:id', async (env, req, url, p) => {
    const me = await authUser(env, req); const b = await body(req)
    const r = await env.DB.prepare('SELECT * FROM daily_bookings WHERE id = ?').bind(Number(p.id)).first(); if (!r) throw new HttpError(404, 'Booking नहीं मिली')
    if (!isAdmin(me) && (r.emp_id !== me.id || String(r.created_at).slice(0, 10) !== new Date().toISOString().slice(0, 10) && r.date !== istDate())) throw new HttpError(403, 'Edit या delete सिर्फ उसी दिन — उसके बाद admin')
    if (b.delete) { await env.DB.prepare('DELETE FROM daily_bookings WHERE id = ?').bind(r.id).run(); await audit(env, me.id, 'booking_delete', 'daily_bookings', r.id, r, null); return json({ ok: true }) }
    const no = String(b.booking_no ?? r.booking_no).trim(), amount = b.amount != null ? dN(b.amount) : r.amount
    if (amount <= 0 || !no) throw bad('Booking number और amount')
    if (no.toLowerCase() !== r.booking_no.toLowerCase() && await env.DB.prepare('SELECT 1 x FROM daily_bookings WHERE booking_no = ?').bind(no).first()) throw new HttpError(409, `${no} was already entered — use a new number`)
    await env.DB.prepare('UPDATE daily_bookings SET booking_no = ?, amount = ?, date = ?, updated_at = ? WHERE id = ?').bind(no, amount, /^\d{4}-\d{2}-\d{2}$/.test(b.date || '') ? b.date : r.date, new Date().toISOString(), r.id).run()
    await audit(env, me.id, 'booking_edit', 'daily_bookings', r.id, r, { no, amount })
    return json({ ok: true })
  })

  // ── Orders: approval + stages (Ops board) → invoice on Delivered ─────────────
  on('POST', '/api/cc/order-approve', async (env, req) => {
    const me = await authUser(env, req); needBoss(me); const b = await body(req)
    const o = await legacyGet(env, 'cargo_orders', b.id); if (!o) throw new HttpError(404, 'Order नहीं मिला')
    const reason = String(b.reason || '').trim()
    if (!b.approve && reason.length < 3) throw bad('Reject का कारण लिखें')
    const upd = { ...o, approvalStatus: b.approve ? 'approved' : 'rejected', rejectReason: b.approve ? null : reason, approvedBy: me.name, approvedAt: nowLocal(), ...(b.approve ? {} : { stage: 'Cancelled', cancelReason: reason }) }
    await legacySet(env, 'cargo_orders', b.id, upd)
    await audit(env, me.id, b.approve ? 'order_approve' : 'order_reject', 'cargo_orders', String(b.id), { approvalStatus: o.approvalStatus }, { approvalStatus: upd.approvalStatus, reason })
    return json({ ok: true })
  })
  const STAGES = ['Booked', 'Picked Up', 'In Transit', 'Delivered', 'Cancelled']
  on('POST', '/api/cc/order-stage', async (env, req) => {
    const me = await authUser(env, req); needBoss(me); const b = await body(req)
    const stage = STAGES.find((s) => s === b.stage); if (!stage) throw bad('Stage?')
    const o = await legacyGet(env, 'cargo_orders', b.id); if (!o) throw new HttpError(404, 'Order नहीं मिला')
    if (/pending/i.test(o.approvalStatus || '') && stage !== 'Cancelled') throw bad('पहले markup approve करें')
    if (stage === 'Cancelled' && String(b.reason || '').trim().length < 3) throw bad('Cancel का कारण लिखें')
    const amount = b.amount != null && dN(b.amount) > 0 ? dN(b.amount) : dN(o.amount)
    const upd = { ...o, stage, amount, updatedAt: nowLocal(), ...(stage === 'Cancelled' ? { cancelReason: String(b.reason).trim() } : {}), ...(dN(b.kg) > 0 ? { kg: dN(b.kg) } : {}) }
    let invoice = null
    if (stage === 'Delivered' && !o.invoiceRid) invoice = await makeInvoice(env, 'JDAC Logistics', { clientName: o.customerName, clientPhone: o.phone, total: amount, items: [{ desc: `${o.mode || 'Cargo'} · ${dN(upd.kg)} kg`, amount }], notes: `cargo_order:${o.id}` })
    if (invoice) { upd.invoiceRid = invoice.rid; upd.invoiceNo = invoice.docNo }
    await legacySet(env, 'cargo_orders', b.id, upd)
    await audit(env, me.id, 'order_stage', 'cargo_orders', String(b.id), { stage: o.stage }, { stage, invoice: invoice?.docNo })
    return json({ ok: true, invoice })
  })
  async function makeInvoice(env, company, { clientName, clientPhone, total, items, notes }) {
    const date = istDate(), fy = fyOf(date), pre = `${PREFIX[company]}/${fy}/`
    const { taxable, gst } = gstSplit(total)
    for (let tryN = 0; tryN < 5; tryN++) {
      const last = await env.DB.prepare("SELECT MAX(CAST(substr(json_extract(data,'$.docNo'), ?) AS INTEGER)) n FROM legacy_records WHERE tbl = 'invoices' AND json_extract(data,'$.company') = ? AND json_extract(data,'$.kind') = 'Invoice' AND json_extract(data,'$.docNo') LIKE ?")
        .bind(pre.length + 1, company, pre + '%').first()
      const docNo = pre + String((last?.n || 0) + 1 + tryN).padStart(4, '0')
      try {
        const rid = await legacyPut(env, 'invoices', { orgKey: 'jdac', company, kind: 'Invoice', docNo, clientName, clientPhone, items: JSON.stringify(items), subtotal: taxable, gstPct: 18, gstAmount: gst, total, status: 'Unpaid', date, notes, createdAt: nowLocal(), gstInclusive: true })
        return { rid, docNo, total, taxable, gst }
      } catch (e) { if (!/UNIQUE/i.test(String(e?.message))) throw e }
    }
    throw new HttpError(409, 'Invoice number नहीं बन पाया — दोबारा कोशिश करें')
  }
  on('GET', '/api/cc/invoice-dupes', async (env, req) => {
    const me = await authUser(env, req); needBoss(me)
    const { results } = await env.DB.prepare("SELECT json_extract(data,'$.company') company, json_extract(data,'$.kind') kind, json_extract(data,'$.docNo') docNo, COUNT(*) n FROM legacy_records WHERE tbl = 'invoices' GROUP BY 1,2,3 HAVING n > 1").all()
    return json({ duplicates: results })
  })

  // ── Payments (part payments) ────────────────────────────────────────────────
  on('GET', '/api/cc/invoices', async (env, req, url) => {
    const me = await authUser(env, req); needBoss(me)
    const co = url.searchParams.get('company')
    const D = await loadAll(env)
    const { results: pays } = await env.DB.prepare('SELECT * FROM payments ORDER BY date DESC, id DESC').all()
    const inv = D.invoices.filter((i) => !co || i.company === co).map((i) => {
      const p = pays.filter((x) => x.invoice_id === String(i._rid)), paid = p.reduce((a, x) => a + x.amount, 0)
      const legacyPaid = /^paid$/i.test(String(i.status)) && !p.length
      const status = legacyPaid ? 'Paid' : paid <= 0 ? (/cancel/i.test(i.status) ? 'Cancelled' : 'Unpaid') : paid + 0.5 >= dN(i.total) ? 'Paid' : 'Part paid'
      return { id: i._rid, docNo: i.docNo, company: i.company, kind: i.kind, date: String(i.date || i.createdAt || '').slice(0, 10), client: i.clientName, total: dN(i.total), taxable: dN(i.subtotal), gst: dN(i.gstAmount), paid: legacyPaid ? dN(i.total) : paid, status, payments: p }
    }).sort((a, b) => b.date.localeCompare(a.date))
    return json({ invoices: inv })
  })
  on('POST', '/api/cc/payments', async (env, req) => {
    const me = await authUser(env, req); needBoss(me); const b = await body(req)
    const inv = await legacyGet(env, 'invoices', b.invoice_id); if (!inv) throw new HttpError(404, 'Invoice नहीं मिला')
    const amount = dN(b.amount); if (amount <= 0) throw bad('Amount डालें')
    const mode = ['UPI', 'NEFT', 'Cash', 'Cheque'].includes(b.mode) ? b.mode : null; if (!mode) throw bad('Mode चुनें')
    const paid = (await env.DB.prepare('SELECT COALESCE(SUM(amount),0) s FROM payments WHERE invoice_id = ?').bind(String(b.invoice_id)).first()).s
    if (paid + amount > dN(inv.total) + 0.5) throw bad(`बाकी सिर्फ ₹${Math.round(dN(inv.total) - paid)} है`)
    const date = /^\d{4}-\d{2}-\d{2}$/.test(b.date || '') ? b.date : istDate()
    await env.DB.prepare('INSERT INTO payments (invoice_id, company, amount, date, mode, reference, by_emp) VALUES (?,?,?,?,?,?,?)').bind(String(b.invoice_id), inv.company, amount, date, mode, String(b.reference || '').slice(0, 80), me.id).run()
    const now = paid + amount
    await legacySet(env, 'invoices', b.invoice_id, { ...inv, status: now + 0.5 >= dN(inv.total) ? 'Paid' : 'Part paid' })
    await audit(env, me.id, 'payment_add', 'payments', String(b.invoice_id), null, { amount, mode })
    return json({ ok: true })
  })

  // ── Public Forms (for people outside the company) ───────────────────────────
  const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'form'
  on('GET', '/api/forms', async (env, req) => {
    const me = await authUser(env, req); needAdmin(me)
    const { results } = await env.DB.prepare('SELECT f.*, (SELECT COUNT(*) FROM form_answers a WHERE a.form_id = f.id) answers FROM public_forms f ORDER BY f.id DESC').all()
    return json({ forms: results.map((f) => ({ ...f, fields: JSON.parse(f.fields) })) })
  })
  on('POST', '/api/forms', async (env, req) => {
    const me = await authUser(env, req); needAdmin(me); const b = await body(req)
    const title = String(b.title || '').trim().slice(0, 60); if (!title) throw bad('Form का नाम')
    const fields = (Array.isArray(b.fields) ? b.fields : []).map((f, i) => ({ key: 'q' + (i + 1), label: String(f.label || '').trim().slice(0, 80), type: ['text', 'phone', 'number', 'date', 'choice', 'long'].includes(f.type) ? f.type : 'text', required: !!f.required,
      options: f.type === 'choice' ? String(f.options || '').split('/').map((x) => x.trim()).filter(Boolean) : undefined })).filter((f) => f.label)
    if (!fields.length) throw bad('कम से कम एक सवाल')
    const becomes = ['lead', 'task', 'entry'].includes(b.becomes) ? b.becomes : 'entry'
    let slug = slugify(b.slug || title)
    while (await env.DB.prepare('SELECT 1 x FROM public_forms WHERE slug = ?').bind(slug).first()) slug = slug.replace(/-\d+$/, '') + '-' + Math.floor(Math.random() * 90 + 10)
    await env.DB.prepare('INSERT INTO public_forms (slug, title, icon, fields, project_id, project_name, becomes, status, created_by) VALUES (?,?,?,?,?,?,?,?,?)')
      .bind(slug, title, String(b.icon || '📝'), JSON.stringify(fields), b.project_id ? String(b.project_id) : null, String(b.project_name || ''), becomes, b.status === 'draft' ? 'draft' : 'live', me.id).run()
    return json({ ok: true, slug })
  })
  on('PATCH', '/api/forms/:id', async (env, req, url, p) => {
    const me = await authUser(env, req); needAdmin(me); const b = await body(req)
    await env.DB.prepare('UPDATE public_forms SET status = ? WHERE id = ?').bind(b.status === 'draft' ? 'draft' : 'live', Number(p.id)).run()
    return json({ ok: true })
  })
  on('GET', '/api/forms/:id/answers', async (env, req, url, p) => {
    const me = await authUser(env, req); needAdmin(me)
    const { results } = await env.DB.prepare('SELECT * FROM form_answers WHERE form_id = ? ORDER BY id DESC LIMIT 500').bind(Number(p.id)).all()
    return json({ answers: results.map((a) => ({ ...a, data: JSON.parse(a.data) })) })
  })
  // बिना login — public
  on('GET', '/api/public/form/:slug', async (env, req, url, p) => {
    const f = await env.DB.prepare("SELECT slug, title, icon, fields FROM public_forms WHERE slug = ? AND status = 'live'").bind(p.slug).first()
    if (!f) throw new HttpError(404, 'यह form बंद है या मौजूद नहीं')
    return json({ ...f, fields: JSON.parse(f.fields) })
  })
  on('POST', '/api/public/form/:slug', async (env, req, url, p) => {
    const f = await env.DB.prepare("SELECT * FROM public_forms WHERE slug = ? AND status = 'live'").bind(p.slug).first()
    if (!f) throw new HttpError(404, 'यह form बंद है या मौजूद नहीं')
    const b = await body(req), fields = JSON.parse(f.fields), data = {}
    for (const q of fields) {
      const v = String(b[q.key] ?? '').trim().slice(0, q.type === 'long' ? 2000 : 300)
      if (q.required && !v) throw bad(`${q.label} भरें`)
      data[q.label] = v
    }
    const recent = await env.DB.prepare("SELECT COUNT(*) n FROM form_answers WHERE form_id = ? AND created_at > strftime('%Y-%m-%dT%H:%M:%fZ','now','-1 minute')").bind(f.id).first()
    if (recent.n > 20) throw new HttpError(429, 'थोड़ी देर बाद भेजें')
    let result = null
    const phone = fields.find((q) => q.type === 'phone'), nameQ = fields.find((q) => /name/i.test(q.label))
    const summary = Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(' · ').slice(0, 500)
    if (f.becomes === 'lead') result = 'lead:' + await legacyPut(env, 'ad_leads', { orgKey: 'jdac', date: istDate(), name: nameQ ? data[nameQ.label] : '', phone: phone ? data[phone.label] : '', stage: '🆕 New Inquiry', source: 'form:' + f.slug, notes: summary, cseName: '', createdAt: nowLocal() })
    else if (f.becomes === 'task') result = 'task:' + await legacyPut(env, 'tasks', { title: `${f.title}: ${nameQ ? data[nameQ.label] : 'new answer'}`, notes: summary, status: 'Open', priority: 'Normal', projectId: f.project_id, type: 'One-time', createdAt: nowLocal() })
    await env.DB.prepare('INSERT INTO form_answers (form_id, data, result) VALUES (?,?,?)').bind(f.id, JSON.stringify(data), result).run()
    dropCache()
    return json({ ok: true })
  })

  // ── Old forms (Sections) backup — delete only after "OK delete" ────────────────
  on('GET', '/api/cc/old-forms', async (env, req) => {
    const me = await authUser(env, req); needBoss(me)
    const { results: defs } = await env.DB.prepare("SELECT legacy_id, data FROM legacy_records WHERE tbl = 'form_defs'").all()
    const { results: ents } = await env.DB.prepare("SELECT legacy_id, data FROM legacy_records WHERE tbl = 'day_entries'").all()
    const E = ents.map((r) => ({ ...JSON.parse(r.data), _rid: r.legacy_id }))
    const keys = new Set([...defs.map((d) => JSON.parse(d.data).key), ...E.map((e) => e.formKey)])
    const forms = [...keys].map((k) => { const d = defs.map((x) => JSON.parse(x.data)).find((x) => x.key === k); return { key: k, label: d?.label || k, entries: E.filter((e) => e.formKey === k).length } }).sort((a, b) => b.entries - a.entries)
    return json({ forms, entries: E })
  })

  // ── People: mark leave for someone ─────────────────────────────────────────────
  on('POST', '/api/admin/mark-leave', async (env, req) => {
    const me = await authUser(env, req); needAdmin(me); const b = await body(req)
    const e = await env.DB.prepare('SELECT id FROM employees WHERE id = ?').bind(Number(b.emp_id)).first(); if (!e) throw new HttpError(404, 'Employee?')
    const from = b.from, to = b.to || b.from
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from || '') || !/^\d{4}-\d{2}-\d{2}$/.test(to) || to < from) throw bad('तारीख?')
    const reason = String(b.reason || 'Marked by admin').slice(0, 200)
    let n = 0
    for (let d = new Date(from + 'T00:00:00Z'); d.toISOString().slice(0, 10) <= to && n < 31; d.setUTCDate(d.getUTCDate() + 1), n++) {
      const day = d.toISOString().slice(0, 10)
      await env.DB.prepare("INSERT OR IGNORE INTO leave_requests (emp_id, date, kind, reason, status, decided_by, decided_at) VALUES (?,?,?,?, 'Approved', ?, ?)").bind(e.id, day, b.kind === 'Half day' ? 'Half day' : 'Full day', reason.length >= 3 ? reason : 'Marked by admin', me.id, new Date().toISOString()).run()
    }
    await audit(env, me.id, 'leave_mark', 'leave_requests', e.id, null, { from, to, reason })
    return json({ ok: true, days: n })
  })
}

// JDAC Tracker API — Cloudflare Worker + D1
// Mobile ऐप और Web panels दोनों यही API use करते हैं.





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
const pub = (e) => e && ({ id: e.id, legacy_id: e.legacy_id ?? null, username: e.username, live_track: !!e.live_track, name: e.name, phone: e.phone, role: e.role, team: e.team, designation: e.designation, department: e.department, work_location: e.work_location, shift_start: e.shift_start, shift_end: e.shift_end, joining_date: e.joining_date, active: !!e.active, device_linked: !!e.device_id })

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
const USAGE_LIMITS = { requests_per_day: 100000, db_bytes: 500 * 1024 * 1024, warn_pct: 70 }
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
  if ('live_track' in b) patch.live_track = b.live_track ? 1 : 0
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
  if (!canTable(me, tbl)) throw new HttpError(403, 'यह data आपके लिए नहीं है')
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
  const t = JSON.stringify(o); if (t.length > 20000) throw bad('बहुत बड़ा record')
  return o
}
on('POST', '/api/legacy/rows', async (env, req) => {
  const me = await authUser(env, req); needAdmin(me)
  const b = await body(req)
  if (!/^[a-z_]{2,40}$/.test(b.tbl || '') || !canTable(me, b.tbl)) throw new HttpError(403, 'यह data आपके लिए नहीं है')
  const id = 'n' + Date.now() + Math.floor(Math.random() * 1000)
  const d = { ...cleanData(b.data), id, createdAt: nowIso(), createdBy_name: me.name }
  await env.DB.prepare('INSERT INTO legacy_records (tbl, legacy_id, data) VALUES (?, ?, ?)').bind(b.tbl, id, JSON.stringify(d)).run()
  await audit(env, me.id, 'record_add', b.tbl, id, null, d)
  return json({ ok: true, id })
})
on('PATCH', '/api/legacy/rows', async (env, req) => {
  const me = await authUser(env, req); needAdmin(me)
  const b = await body(req)
  if (!canTable(me, b.tbl || '')) throw new HttpError(403, 'यह data आपके लिए नहीं है')
  const old = await env.DB.prepare('SELECT data FROM legacy_records WHERE tbl = ? AND legacy_id = ?').bind(b.tbl, String(b.id)).first()
  if (!old) throw new HttpError(404, 'Record नहीं मिला')
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
on('GET', '/api/cc/chat', async (env, req) => {
  const me = await authUser(env, req)
  const D = await loadAll(env)
  const projects = new Map(D.projects.map((p) => [String(p.id), p.name]))
  const msgs = D.chat_messages.filter((m) => !m.deletedAt || m.deletedAt === 'None').sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 200)
  return json({ me: me.name, messages: msgs.map((m) => ({ id: m._rid, project: projects.get(String(m.projectId)) || 'Team', projectId: String(m.projectId || ''), sender: m.senderName, body: m.body, at: m.createdAt })),
    projects: D.projects.map((p) => ({ id: String(p.id), name: p.name })) })
})
on('POST', '/api/cc/chat', async (env, req) => {
  const me = await authUser(env, req); const b = await body(req)
  const text = String(b.body || '').trim().slice(0, 2000); if (!text) throw bad('Message लिखें')
  const id = 'n' + Date.now() + Math.floor(Math.random() * 1000)
  const d = { id, projectId: b.projectId || null, senderId: me.legacy_id || null, senderName: me.name, body: text, kind: 'text', createdAt: nowLocal(), emp_id: me.id }
  await env.DB.prepare('INSERT INTO legacy_records (tbl, legacy_id, data) VALUES (?, ?, ?)').bind('chat_messages', id, JSON.stringify(d)).run()
  dropCache(); return json({ ok: true })
})

// ── Employee: home, desks, Cargo Sales desk ─────────────────────────────────
on('GET', '/api/my/home', async (env, req) => {
  const me = await authUser(env, req)
  return json(myHome(await loadAll(env), me, istDate(), await myDesks(env, me.id)))
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
  const lead = await legacyGet(env, 'ad_leads', b.leadId); if (!lead) throw new HttpError(404, 'Lead नहीं मिला')
  const outcome = String(b.outcome || '').slice(0, 60); if (!outcome) throw bad('Result चुनें')
  await legacyPut(env, 'cse_call_logs', { personId: me.legacy_id || null, emp_id: me.id, leadId: lead.id, outcome, note: String(b.note || '').slice(0, 500), nextFollowUp: b.next || null, createdAt: nowLocal() })
  const stage = String(b.stage || '').slice(0, 60)
  const upd = { ...lead, lastActivityAt: nowLocal(), updatedAt: nowLocal(), ...(b.next ? { nextFollowUp: b.next } : {}), ...(stage ? { stage, stageChangedAt: nowLocal() } : {}) }
  await legacySet(env, 'ad_leads', b.leadId, upd)
  await audit(env, me.id, 'lead_log', 'ad_leads', String(b.leadId), { stage: lead.stage }, { stage: upd.stage, outcome })
  return json({ ok: true })
})
on('POST', '/api/my/cargo-quote', async (env, req) => {
  const me = await authUser(env, req); const b = await body(req)
  const name = String(b.customerName || '').trim(); if (!name) throw bad('Customer का नाम')
  const L = Number(b.lengthCm) || 0, W = Number(b.breadthCm) || 0, H = Number(b.heightCm) || 0, kg = Number(b.actualKg) || 0
  const vol = Math.round((L * W * H / 5000) * 100) / 100, charge = Math.max(kg, vol), rate = Number(b.rate) || 0
  const id = await legacyPut(env, 'cargo_quotes', { date: istDate(), personId: me.legacy_id || null, emp_id: me.id, cseName: me.name, leadId: b.leadId || null, customerName: name, phone: String(b.phone || ''),
    pickupPincode: String(b.pickupPincode || ''), dropPincode: String(b.dropPincode || ''), actualKg: kg, lengthCm: L, breadthCm: W, heightCm: H, volumetricKg: vol, chargeableKg: charge, rate, total: Math.round(charge * rate), status: 'Sent', createdAt: nowLocal() })
  if (b.leadId) { const l = await legacyGet(env, 'ad_leads', b.leadId); if (l) await legacySet(env, 'ad_leads', b.leadId, { ...l, stage: 'Quotation Sent', lastActivityAt: nowLocal(), stageChangedAt: nowLocal() }) }
  return json({ ok: true, id, volumetricKg: vol, chargeableKg: charge, total: Math.round(charge * rate) })
})
on('POST', '/api/my/cargo-order', async (env, req) => {
  const me = await authUser(env, req); const b = await body(req)
  const name = String(b.customerName || '').trim(); if (!name) throw bad('Customer का नाम')
  const amount = Number(b.amount) || 0; if (amount <= 0) throw bad('Amount डालें')
  const vendorCost = Number(b.vendorCost) || 0
  if (vendorCost <= 0) throw bad('Vendor cost डालना ज़रूरी है')
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
  const t = await legacyGet(env, 'tasks', b.id); if (!t) throw new HttpError(404, 'Task नहीं मिला')
  if (String(t.assigneeId) !== String(me.legacy_id) && String(t.assignee_emp || '') !== String(me.id) && !ADMIN_ROLES.includes(me.role)) throw new HttpError(403, 'यह आपका task नहीं है')
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
async function runCron(env) {
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

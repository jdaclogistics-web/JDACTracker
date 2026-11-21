// Desk-first system (Desk-First Step 1–4), Daily Bookings, money rules (Tasks 1–5), public Forms.
// नए tables यहाँ बनते हैं (CREATE IF NOT EXISTS) — पुराना data legacy_records से एक बार copy होता है.

export const DESK_TABLES = [
  `CREATE TABLE IF NOT EXISTS desks (id INTEGER PRIMARY KEY AUTOINCREMENT, company TEXT NOT NULL, name TEXT NOT NULL, icon TEXT, description TEXT,
    kind TEXT NOT NULL DEFAULT 'ready', module TEXT, fields TEXT, rolls_up TEXT, active INTEGER NOT NULL DEFAULT 1, legacy_id TEXT UNIQUE,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')))`,
  `CREATE TABLE IF NOT EXISTS desk_access (desk_id INTEGER NOT NULL, emp_id INTEGER NOT NULL, enabled INTEGER NOT NULL DEFAULT 1, changed_at TEXT, PRIMARY KEY (desk_id, emp_id))`,
  `CREATE TABLE IF NOT EXISTS desk_entries (id INTEGER PRIMARY KEY AUTOINCREMENT, desk_id INTEGER NOT NULL, emp_id INTEGER, date TEXT NOT NULL, data TEXT NOT NULL,
    amount REAL NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')), updated_at TEXT)`,
  `CREATE TABLE IF NOT EXISTS daily_bookings (id INTEGER PRIMARY KEY AUTOINCREMENT, emp_id INTEGER, date TEXT NOT NULL, booking_no TEXT NOT NULL UNIQUE COLLATE NOCASE,
    amount REAL NOT NULL CHECK (amount > 0), legacy_id TEXT UNIQUE, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')), updated_at TEXT, customer TEXT, note TEXT, company TEXT, qty INTEGER, contact TEXT)`,
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
export const MODULES = {
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
export const MARKUP_MIN = 40
export const gstSplit = (total) => { const taxable = r2(total / 1.18); return { taxable, gst: r2(total - taxable) } }
export function fyOf(date) { const y = Number(date.slice(0, 4)), m = Number(date.slice(5, 7)); const s = m >= 4 ? y : y - 1; return `${String(s).slice(2)}-${String(s + 1).slice(2)}` }
const PREFIX = { 'JDAC Logistics': 'JL', 'Jupiter Equipment': 'JE', GovaaBazaar: 'GB', 'JDAC Studios': 'JS' }

export async function migrateDesks(env, emps) {
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

export function registerDesks(on, X) {
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
    const d = await env.DB.prepare('SELECT id, name FROM desks WHERE id = ?').bind(Number(b.desk_id)).first(); if (!d) throw new HttpError(404, 'Desk not found')
    const e = await env.DB.prepare('SELECT id, name FROM employees WHERE id = ?').bind(Number(b.emp_id)).first(); if (!e) throw new HttpError(404, 'Employee not found')
    await env.DB.prepare('INSERT INTO desk_access (desk_id, emp_id, enabled, changed_at) VALUES (?,?,?,?) ON CONFLICT (desk_id, emp_id) DO UPDATE SET enabled = excluded.enabled, changed_at = excluded.changed_at').bind(d.id, e.id, b.enabled ? 1 : 0, new Date().toISOString()).run()
    await audit(env, me.id, b.enabled ? 'desk_on' : 'desk_off', 'desk_access', `${d.id}:${e.id}`, null, { desk: d.name, emp: e.name })
    return json({ ok: true })
  })
  on('POST', '/api/desks', async (env, req) => {
    const me = await authUser(env, req); needBoss(me); const b = await body(req)
    const name = String(b.name || '').trim().slice(0, 60); if (!name) throw bad('Desk name')
    const company = String(b.company || ''); if (!['JDAC Logistics', 'Jupiter Equipment', 'GovaaBazaar', 'JDAC Studios'].includes(company)) throw bad('Choose a company')
    let fields = null, module = null, kind = b.kind === 'simple' ? 'simple' : 'ready'
    if (kind === 'ready') { module = String(b.module || ''); if (!MODULES[module]) throw bad('Choose a built screen') }
    else {
      fields = (Array.isArray(b.fields) ? b.fields : []).map((f, i) => ({ key: 'f' + (i + 1), label: String(f.label || '').trim().slice(0, 60), type: ['text', 'number', 'money', 'date', 'choice', 'photo'].includes(f.type) ? f.type : 'text',
        options: f.type === 'choice' ? String(f.options || '').split('/').map((x) => x.trim()).filter(Boolean).slice(0, 12) : undefined })).filter((f) => f.label)
      if (!fields.length) throw bad('Add at least one field')
    }
    const r = await env.DB.prepare('INSERT INTO desks (company, name, icon, description, kind, module, fields, rolls_up) VALUES (?,?,?,?,?,?,?,?) RETURNING id')
      .bind(company, name, String(b.icon || (kind === 'simple' ? '✍️' : MODULES[module].icon)), String(b.description || '').slice(0, 120), kind, module, fields ? JSON.stringify(fields) : null, kind === 'simple' ? 'Money fields add up on the company Overview and group Home' : MODULES[module].rolls).first()
    await audit(env, me.id, 'desk_create', 'desks', r.id, null, { name, company, kind })
    return json({ ok: true, id: r.id })
  })
  on('GET', '/api/desks/:id/entries', async (env, req, url, p) => {
    const me = await authUser(env, req)
    const d = await env.DB.prepare('SELECT * FROM desks WHERE id = ?').bind(Number(p.id)).first(); if (!d) throw new HttpError(404, 'Desk not found')
    const all = isAdmin(me) && url.searchParams.get('all') === '1'
    if (!all && !(await env.DB.prepare('SELECT 1 x FROM desk_access WHERE desk_id = ? AND emp_id = ? AND enabled = 1').bind(d.id, me.id).first()) && !isAdmin(me)) throw new HttpError(403, 'This desk is not on for you')
    const { results } = await env.DB.prepare(`SELECT x.*, e.name FROM desk_entries x LEFT JOIN employees e ON e.id = x.emp_id WHERE x.desk_id = ? ${all ? '' : 'AND x.emp_id = ?'} ORDER BY x.date DESC, x.id DESC LIMIT 500`).bind(...(all ? [d.id] : [d.id, me.id])).all()
    return json({ desk: { ...d, fields: JSON.parse(d.fields || '[]') }, entries: results.map((r) => ({ ...r, data: JSON.parse(r.data) })) })
  })
  on('POST', '/api/desks/:id/entries', async (env, req, url, p) => {
    const me = await authUser(env, req); const b = await body(req)
    const d = await env.DB.prepare("SELECT * FROM desks WHERE id = ? AND kind = 'simple'").bind(Number(p.id)).first(); if (!d) throw new HttpError(404, 'Desk not found')
    if (!isAdmin(me) && !(await env.DB.prepare('SELECT 1 x FROM desk_access WHERE desk_id = ? AND emp_id = ? AND enabled = 1').bind(d.id, me.id).first())) throw new HttpError(403, 'This desk is not on for you')
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
    const asEmp = isAdmin(me) && url.searchParams.get('as') ? Number(url.searchParams.get('as')) : null // admin looking at one employee's page
    const emp = asEmp || (adminAll ? (url.searchParams.get('emp') ? Number(url.searchParams.get('emp')) : null) : me.id)
    const where = `date BETWEEN ? AND ?${emp ? ' AND emp_id = ?' : ''}`, args = [from, to, ...(emp ? [emp] : [])]
    const { results } = await env.DB.prepare(`SELECT b.*, e.name FROM daily_bookings b LEFT JOIN employees e ON e.id = b.emp_id WHERE ${where} ORDER BY date DESC, b.id DESC LIMIT 2000`).bind(...args).all()
    const one = asEmp || (adminAll ? null : me.id)
    const sum = async (f) => (await env.DB.prepare(`SELECT COALESCE(SUM(amount),0) s, COALESCE(SUM(COALESCE(qty,1)),0) n FROM daily_bookings WHERE date BETWEEN ? AND ?${one ? ' AND emp_id = ?' : ''}`).bind(f, today, ...(one ? [one] : [])).first())
    const [st, sw, sm] = await Promise.all([sum(today), sum(week), sum(month)])
    const per = {}
    for (const r of results) { const k = r.emp_id || 0; per[k] = per[k] || { emp_id: r.emp_id, name: r.name || '—', bookings: 0, amount: 0, today: 0 }; per[k].bookings++; per[k].amount += r.amount; if (r.date === today) per[k].today += r.amount }
    return json({ today, from, to, totals: { today: st.s, week: sw.s, month: sm.s, today_n: st.n, week_n: sw.n, month_n: sm.n }, rows: results, per_cse: Object.values(per).sort((a, b) => b.amount - a.amount) })
  })
  on('POST', '/api/bookings', async (env, req) => {
    const me = await authUser(env, req); const b = await body(req)
    const amount = dN(b.amount); if (amount <= 0) throw bad('Enter amount')
    const date = /^\d{4}-\d{2}-\d{2}$/.test(b.date || '') ? b.date : istDate()
    if (date > istDate()) throw bad('No future dates')
    const customer = String(b.customer || '').trim().slice(0, 80) || null, note = String(b.note || '').trim().slice(0, 200) || null
    // order / booking number is optional: without one we number it ORD-<emp>-<yymmdd>-<n>
    let no = String(b.booking_no || '').trim().slice(0, 40)
    if (!no) {
      if (!customer) throw bad('Enter the customer / shop name or an order number')
      const base = `ORD-${me.emp_code || me.id}-${date.slice(2).replace(/-/g, '')}`
      const n = (await env.DB.prepare('SELECT COUNT(*) n FROM daily_bookings WHERE booking_no LIKE ?').bind(base + '-%').first()).n
      no = `${base}-${n + 1}`
      while (await env.DB.prepare('SELECT 1 x FROM daily_bookings WHERE booking_no = ?').bind(no).first()) no += 'a'
    } else if (await env.DB.prepare('SELECT 1 x FROM daily_bookings WHERE booking_no = ?').bind(no).first()) throw new HttpError(409, `${no} was already entered — use a new number`)
    const company = /govaa/i.test(me.department || '') ? 'GovaaBazaar' : 'JDAC Logistics'
    const qty = Math.max(1, Math.min(9999, Math.round(dN(b.qty)) || 1)), contact = String(b.contact || '').replace(/[^\d+]/g, '').slice(0, 15) || null
    await env.DB.prepare('INSERT INTO daily_bookings (emp_id, date, booking_no, amount, customer, note, company, qty, contact) VALUES (?,?,?,?,?,?,?,?,?)').bind(me.id, date, no, amount, customer, note, company, qty, contact).run()
    dropCache()
    return json({ ok: true, booking_no: no })
  })
  on('PATCH', '/api/bookings/:id', async (env, req, url, p) => {
    const me = await authUser(env, req); const b = await body(req)
    const r = await env.DB.prepare('SELECT * FROM daily_bookings WHERE id = ?').bind(Number(p.id)).first(); if (!r) throw new HttpError(404, 'Booking not found')
    if (!isAdmin(me) && (r.emp_id !== me.id || String(r.created_at).slice(0, 10) !== new Date().toISOString().slice(0, 10) && r.date !== istDate())) throw new HttpError(403, 'Edit or delete only on the same day — after that, admin')
    if (b.delete && !isAdmin(me)) throw new HttpError(403, 'Orders cannot be deleted — ask admin')
    if (b.delete) { await env.DB.prepare('DELETE FROM daily_bookings WHERE id = ?').bind(r.id).run(); await audit(env, me.id, 'booking_delete', 'daily_bookings', r.id, r, null); dropCache(); return json({ ok: true }) }
    const no = String(b.booking_no ?? r.booking_no).trim(), amount = b.amount != null ? dN(b.amount) : r.amount
    if (amount <= 0 || !no) throw bad('Booking number and amount')
    if (no.toLowerCase() !== r.booking_no.toLowerCase() && await env.DB.prepare('SELECT 1 x FROM daily_bookings WHERE booking_no = ?').bind(no).first()) throw new HttpError(409, `${no} was already entered — use a new number`)
    await env.DB.prepare('UPDATE daily_bookings SET booking_no = ?, amount = ?, date = ?, customer = ?, note = ?, qty = ?, contact = ?, updated_at = ? WHERE id = ?').bind(no, amount, /^\d{4}-\d{2}-\d{2}$/.test(b.date || '') ? b.date : r.date, b.customer !== undefined ? String(b.customer).trim().slice(0, 80) || null : r.customer ?? null, b.note !== undefined ? String(b.note).trim().slice(0, 200) || null : r.note ?? null, b.qty !== undefined ? Math.max(1, Math.round(dN(b.qty)) || 1) : r.qty ?? 1, b.contact !== undefined ? String(b.contact).replace(/[^\d+]/g, '').slice(0, 15) || null : r.contact ?? null, new Date().toISOString(), r.id).run()
    dropCache()
    await audit(env, me.id, 'booking_edit', 'daily_bookings', r.id, r, { no, amount })
    return json({ ok: true })
  })

  // ── Orders: approval + stages (Ops board) → invoice on Delivered ─────────────
  on('POST', '/api/cc/order-approve', async (env, req) => {
    const me = await authUser(env, req); needBoss(me); const b = await body(req)
    const o = await legacyGet(env, 'cargo_orders', b.id); if (!o) throw new HttpError(404, 'Order not found')
    const reason = String(b.reason || '').trim()
    if (!b.approve && reason.length < 3) throw bad('Write the reason for rejecting')
    const upd = { ...o, approvalStatus: b.approve ? 'approved' : 'rejected', rejectReason: b.approve ? null : reason, approvedBy: me.name, approvedAt: nowLocal(), ...(b.approve ? {} : { stage: 'Cancelled', cancelReason: reason }) }
    await legacySet(env, 'cargo_orders', b.id, upd)
    await audit(env, me.id, b.approve ? 'order_approve' : 'order_reject', 'cargo_orders', String(b.id), { approvalStatus: o.approvalStatus }, { approvalStatus: upd.approvalStatus, reason })
    return json({ ok: true })
  })
  const STAGES = ['Booked', 'Picked Up', 'In Transit', 'Delivered', 'Cancelled']
  on('POST', '/api/cc/order-stage', async (env, req) => {
    const me = await authUser(env, req); needBoss(me); const b = await body(req)
    const stage = STAGES.find((s) => s === b.stage); if (!stage) throw bad('Stage?')
    const o = await legacyGet(env, 'cargo_orders', b.id); if (!o) throw new HttpError(404, 'Order not found')
    if (/pending/i.test(o.approvalStatus || '') && stage !== 'Cancelled') throw bad('Approve the markup first')
    if (stage === 'Cancelled' && String(b.reason || '').trim().length < 3) throw bad('Write the reason for cancelling')
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
    throw new HttpError(409, 'Could not create invoice number — try again')
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
    const inv = await legacyGet(env, 'invoices', b.invoice_id); if (!inv) throw new HttpError(404, 'Invoice not found')
    const amount = dN(b.amount); if (amount <= 0) throw bad('Enter amount')
    const mode = ['UPI', 'NEFT', 'Cash', 'Cheque'].includes(b.mode) ? b.mode : null; if (!mode) throw bad('Choose a mode')
    const paid = (await env.DB.prepare('SELECT COALESCE(SUM(amount),0) s FROM payments WHERE invoice_id = ?').bind(String(b.invoice_id)).first()).s
    if (paid + amount > dN(inv.total) + 0.5) throw bad(`Only ₹${Math.round(dN(inv.total) - paid)} is left`)
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
    const title = String(b.title || '').trim().slice(0, 60); if (!title) throw bad('Form name')
    const fields = (Array.isArray(b.fields) ? b.fields : []).map((f, i) => ({ key: 'q' + (i + 1), label: String(f.label || '').trim().slice(0, 80), type: ['text', 'phone', 'number', 'date', 'choice', 'long'].includes(f.type) ? f.type : 'text', required: !!f.required,
      options: f.type === 'choice' ? String(f.options || '').split('/').map((x) => x.trim()).filter(Boolean) : undefined })).filter((f) => f.label)
    if (!fields.length) throw bad('At least one question')
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
    if (!f) throw new HttpError(404, 'This form is closed or does not exist')
    return json({ ...f, fields: JSON.parse(f.fields) })
  })
  on('POST', '/api/public/form/:slug', async (env, req, url, p) => {
    const f = await env.DB.prepare("SELECT * FROM public_forms WHERE slug = ? AND status = 'live'").bind(p.slug).first()
    if (!f) throw new HttpError(404, 'This form is closed or does not exist')
    const b = await body(req), fields = JSON.parse(f.fields), data = {}
    for (const q of fields) {
      const v = String(b[q.key] ?? '').trim().slice(0, q.type === 'long' ? 2000 : 300)
      if (q.required && !v) throw bad(`Fill ${q.label}`)
      data[q.label] = v
    }
    const recent = await env.DB.prepare("SELECT COUNT(*) n FROM form_answers WHERE form_id = ? AND created_at > strftime('%Y-%m-%dT%H:%M:%fZ','now','-1 minute')").bind(f.id).first()
    if (recent.n > 20) throw new HttpError(429, 'Please try again in a little while')
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
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from || '') || !/^\d{4}-\d{2}-\d{2}$/.test(to) || to < from) throw bad('Date?')
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

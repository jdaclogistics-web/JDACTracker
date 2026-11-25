// IT & Web desk — work given either to the IT partner company (Zenmeg, retainer) or to JDAC's own team.
// Partner people (Nayan POC, Krishna founder) log in with their own partner login (not an employee,
// so they never appear in attendance / payroll). Tables are created here on first use.

const IT_TABLES = [
  `CREATE TABLE IF NOT EXISTS it_partner_users (id INTEGER PRIMARY KEY AUTOINCREMENT, partner TEXT NOT NULL, name TEXT NOT NULL, title TEXT,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE, phone TEXT, email TEXT, pass_hash TEXT, active INTEGER NOT NULL DEFAULT 1, token_version INTEGER NOT NULL DEFAULT 0,
    last_login_at TEXT, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')))`,
  `CREATE TABLE IF NOT EXISTS it_tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, detail TEXT, doer TEXT NOT NULL CHECK (doer IN ('partner','team')),
    partner TEXT, owner_partner INTEGER, owner_emp INTEGER, kind TEXT, site TEXT, company TEXT, priority TEXT NOT NULL DEFAULT 'Normal', due TEXT,
    status TEXT NOT NULL DEFAULT 'To do', link TEXT, proof TEXT, created_by INTEGER, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')), updated_at TEXT, done_at TEXT)`,
  `CREATE TABLE IF NOT EXISTS it_notes (id INTEGER PRIMARY KEY AUTOINCREMENT, task_id INTEGER NOT NULL, by_kind TEXT NOT NULL, by_id INTEGER, by_name TEXT, text TEXT NOT NULL,
    status_to TEXT, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')))`,
]
export const IT_PARTNERS = { zenmeg: { name: 'Zenmeg', about: 'IT retainer · websites, integrations, servers' } }
const SEED_USERS = [
  ['zenmeg', 'Nayan', 'POC · daily coordination', 'ZEN-NAYAN'],
  ['zenmeg', 'Krishna', 'Founder', 'ZEN-KRISHNA'],
]
export const IT_STATUS = ['To do', 'Working', 'Check', 'Done', 'Stuck']
const KINDS = ['Bug / fix', 'Integration', 'New feature', 'Server & email', 'Content update', 'Other']

let ready = false
async function ensureIt(env) {
  if (ready) return
  for (const s of IT_TABLES) await env.DB.prepare(s).run()
  for (const [p, n, t, u] of SEED_USERS) await env.DB.prepare('INSERT OR IGNORE INTO it_partner_users (partner, name, title, username) VALUES (?,?,?,?)').bind(p, n, t, u).run()
  ready = true
}

export function registerIt(on, X) {
  const { json, body, bad, HttpError, audit, ADMIN_ROLES, hashPassword, verifyPassword, signToken, verifyToken, nowIso, istDate, TOKEN_DAYS } = X
  const isAdmin = (me) => ADMIN_ROLES.includes(me.role)
  const now = () => nowIso()
  const clean = (s, n = 500) => String(s ?? '').trim().slice(0, n)
  const dateOk = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d || '')

  // Who is calling: an employee token (sub = employee id) or a partner token (pu = partner user id)
  async function who(env, req) {
    await ensureIt(env)
    const tok = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '')
    const p = await verifyToken(tok, env.TOKEN_SECRET)
    if (!p) throw new HttpError(401, 'Login again')
    if (p.pu) {
      const u = await env.DB.prepare('SELECT * FROM it_partner_users WHERE id = ?').bind(p.pu).first()
      if (!u || !u.active || u.token_version !== p.tv) throw new HttpError(401, 'Login again')
      return { kind: 'partner', u, name: u.name, partner: u.partner }
    }
    const me = await env.DB.prepare('SELECT * FROM employees WHERE id = ?').bind(p.sub).first()
    if (!me || !me.active || me.token_version !== p.tv) throw new HttpError(401, 'Login again')
    return { kind: 'emp', me, name: me.name, admin: isAdmin(me) }
  }
  const pubUser = (u) => ({ id: u.id, partner: u.partner, partner_name: (IT_PARTNERS[u.partner] || {}).name || u.partner, name: u.name, title: u.title, username: u.username, phone: u.phone, email: u.email, active: !!u.active, has_password: !!u.pass_hash, last_login_at: u.last_login_at })

  function canSee(w, t) {
    if (w.kind === 'partner') return t.doer === 'partner' && t.partner === w.partner
    if (w.admin) return true
    return t.owner_emp === w.me.id || t.created_by === w.me.id
  }
  async function getTask(env, id) {
    const t = await env.DB.prepare('SELECT * FROM it_tasks WHERE id = ?').bind(Number(id) || 0).first()
    if (!t) throw new HttpError(404, 'Task not found')
    return t
  }
  async function note(env, w, taskId, text, statusTo) {
    await env.DB.prepare('INSERT INTO it_notes (task_id, by_kind, by_id, by_name, text, status_to) VALUES (?,?,?,?,?,?)')
      .bind(taskId, w.kind, w.kind === 'partner' ? w.u.id : w.me.id, w.name, text, statusTo || null).run()
  }

  // ── Partner login (same login page; IDs start with ZEN-) ─────────────────────
  on('POST', '/api/partner/login', async (env, req) => {
    await ensureIt(env)
    const b = await body(req)
    const id = clean(b.username, 40), pw = String(b.password || '').trim()
    if (!id || !pw) throw bad('Enter User ID and password')
    const u = await env.DB.prepare('SELECT * FROM it_partner_users WHERE username = ? COLLATE NOCASE').bind(id).first()
    if (u && u.active && !u.pass_hash) throw new HttpError(401, 'Your password is not set yet — ask JDAC (Darshan sir) to set it')
    if (!u || !u.active || !(await verifyPassword(pw, u.pass_hash))) throw new HttpError(401, 'User ID or password is wrong')
    await env.DB.prepare('UPDATE it_partner_users SET last_login_at = ? WHERE id = ?').bind(now(), u.id).run()
    const token = await signToken({ sub: 0, pu: u.id, tv: u.token_version, exp: Date.now() + TOKEN_DAYS * 86400000 }, env.TOKEN_SECRET)
    return json({ token, me: { ...pubUser(u), role: 'partner', designation: u.title } })
  })
  on('GET', '/api/partner/me', async (env, req) => {
    const w = await who(env, req); if (w.kind !== 'partner') throw new HttpError(403, 'Partner login only')
    return json({ me: { ...pubUser(w.u), role: 'partner', designation: w.u.title } })
  })

  // ── Partner logins (admin) ─────────────────────────────────────────────────
  on('GET', '/api/it/partners', async (env, req) => {
    const w = await who(env, req); if (!w.admin) throw new HttpError(403, 'Not allowed')
    const { results } = await env.DB.prepare('SELECT * FROM it_partner_users ORDER BY partner, id').all()
    return json({ partners: IT_PARTNERS, users: results.map(pubUser) })
  })
  on('POST', '/api/it/partners', async (env, req) => {
    const w = await who(env, req); if (!w.admin) throw new HttpError(403, 'Not allowed')
    const b = await body(req)
    if (b.id) {
      const u = await env.DB.prepare('SELECT * FROM it_partner_users WHERE id = ?').bind(Number(b.id)).first(); if (!u) throw new HttpError(404, 'Login not found')
      const pw = b.password != null && String(b.password).trim() ? String(b.password).trim() : null
      if (pw && pw.length < 6) throw bad('Password must be at least 6 characters')
      const active = b.active === undefined ? u.active : (b.active ? 1 : 0)
      await env.DB.prepare('UPDATE it_partner_users SET name = ?, title = ?, phone = ?, email = ?, active = ?, pass_hash = COALESCE(?, pass_hash), token_version = token_version + ? WHERE id = ?')
        .bind(clean(b.name ?? u.name, 60) || u.name, clean(b.title ?? u.title, 60), clean(b.phone ?? u.phone, 20), clean(b.email ?? u.email, 80), active, pw ? await hashPassword(pw) : null, (pw || active !== u.active) ? 1 : 0, u.id).run()
      await audit(env, w.me.id, pw ? 'partner_password' : 'partner_edit', 'it_partner_users', u.id, null, { name: b.name, active })
      return json({ ok: true })
    }
    const partner = IT_PARTNERS[b.partner] ? b.partner : 'zenmeg', name = clean(b.name, 60), username = clean(b.username, 30).toUpperCase()
    if (!name || !/^ZEN-[A-Z0-9]{2,20}$/.test(username)) throw bad('Name and a login ID like ZEN-RAHUL are needed')
    const pw = String(b.password || '').trim(); if (pw && pw.length < 6) throw bad('Password must be at least 6 characters')
    try { await env.DB.prepare('INSERT INTO it_partner_users (partner, name, title, username, phone, email, pass_hash) VALUES (?,?,?,?,?,?,?)').bind(partner, name, clean(b.title, 60), username, clean(b.phone, 20), clean(b.email, 80), pw ? await hashPassword(pw) : null).run() }
    catch { throw bad('This login ID already exists') }
    await audit(env, w.me.id, 'partner_add', 'it_partner_users', username, null, { name, partner })
    return json({ ok: true })
  })

  // ── Tasks ──────────────────────────────────────────────────────────────────
  on('GET', '/api/it/tasks', async (env, req) => {
    const w = await who(env, req)
    let rows
    if (w.kind === 'partner') rows = (await env.DB.prepare("SELECT * FROM it_tasks WHERE doer = 'partner' AND partner = ? ORDER BY id DESC").bind(w.partner).all()).results
    else if (w.admin) rows = (await env.DB.prepare('SELECT * FROM it_tasks ORDER BY id DESC').all()).results
    else rows = (await env.DB.prepare('SELECT * FROM it_tasks WHERE owner_emp = ? OR created_by = ? ORDER BY id DESC').bind(w.me.id, w.me.id).all()).results
    const ids = rows.map((t) => t.id)
    const notes = ids.length ? (await env.DB.prepare(`SELECT * FROM it_notes WHERE task_id IN (${ids.map(() => '?').join(',')}) ORDER BY id`).bind(...ids).all()).results : []
    const users = (await env.DB.prepare('SELECT id, partner, name, title FROM it_partner_users WHERE active = 1').all()).results
    const emps = w.kind === 'partner' ? [] : (await env.DB.prepare("SELECT id, name, designation, department FROM employees WHERE active = 1 AND role <> 'developer' ORDER BY name").all()).results
    const empName = new Map((await env.DB.prepare('SELECT id, name FROM employees').all()).results.map((e) => [e.id, e.name]))
    const out = rows.map((t) => ({ ...t, owner_name: t.doer === 'partner' ? (users.find((u) => u.id === t.owner_partner) || {}).name || 'Zenmeg' : empName.get(t.owner_emp) || '—', created_by_name: empName.get(t.created_by) || 'JDAC', notes: notes.filter((n) => n.task_id === t.id) }))
    return json({ me: w.kind === 'partner' ? { kind: 'partner', partner: w.partner, name: w.name } : { kind: 'emp', id: w.me.id, name: w.name, admin: !!w.admin }, partners: IT_PARTNERS, partner_users: users, team: emps, kinds: KINDS, tasks: out, today: istDate() })
  })

  on('POST', '/api/it/tasks', async (env, req) => {
    const w = await who(env, req); if (w.kind !== 'emp' || !w.admin) throw new HttpError(403, 'Only Darshan sir / Nameera can give IT tasks')
    const b = await body(req)
    const title = clean(b.title, 140); if (!title) throw bad('Write the task')
    const doer = b.doer === 'team' ? 'team' : 'partner'
    let owner_partner = null, owner_emp = null, partner = null
    if (doer === 'partner') {
      partner = IT_PARTNERS[b.partner] ? b.partner : 'zenmeg'
      const u = b.owner_partner ? await env.DB.prepare('SELECT id FROM it_partner_users WHERE id = ? AND partner = ?').bind(Number(b.owner_partner), partner).first() : await env.DB.prepare('SELECT id FROM it_partner_users WHERE partner = ? AND active = 1 ORDER BY id LIMIT 1').bind(partner).first()
      owner_partner = u ? u.id : null
    } else {
      const e = await env.DB.prepare('SELECT id FROM employees WHERE id = ? AND active = 1').bind(Number(b.owner_emp) || 0).first()
      if (!e) throw bad('Choose who in your team will do it')
      owner_emp = e.id
    }
    const r = await env.DB.prepare('INSERT INTO it_tasks (title, detail, doer, partner, owner_partner, owner_emp, kind, site, company, priority, due, link, created_by, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?) RETURNING id')
      .bind(title, clean(b.detail, 3000), doer, partner, owner_partner, owner_emp, KINDS.includes(b.kind) ? b.kind : 'Other', clean(b.site, 60), clean(b.company, 20), ['High', 'Normal', 'Low'].includes(b.priority) ? b.priority : 'Normal', dateOk(b.due) ? b.due : null, clean(b.link, 500), w.me.id, now()).first()
    await note(env, w, r.id, 'Task given', 'To do')
    await audit(env, w.me.id, 'it_task_add', 'it_tasks', r.id, null, { title, doer })
    return json({ ok: true, id: r.id })
  })

  // Move a task: doer → Working / Check / Stuck ; JDAC admin → Done or back to Working
  on('POST', '/api/it/tasks/:id/status', async (env, req, url, p) => {
    const w = await who(env, req); const t = await getTask(env, p.id); if (!canSee(w, t)) throw new HttpError(403, 'Not your task')
    const b = await body(req); const to = String(b.status || '')
    if (!IT_STATUS.includes(to)) throw bad('Unknown status')
    const admin = w.kind === 'emp' && w.admin
    if (to === 'Done' && !admin) throw new HttpError(403, 'Only JDAC can approve and close a task — send it for check')
    if (t.status === 'Done' && !admin) throw new HttpError(403, 'This task is closed')
    const proof = b.proof != null ? clean(b.proof, 500) : t.proof
    if (to === 'Check' && !proof && !clean(b.note)) throw bad('Add a proof link or a short note of what was done')
    await env.DB.prepare('UPDATE it_tasks SET status = ?, proof = ?, updated_at = ?, done_at = ? WHERE id = ?').bind(to, proof, now(), to === 'Done' ? now() : null, t.id).run()
    await note(env, w, t.id, clean(b.note) || ({ Working: 'Started', Check: 'Sent to JDAC for check', Done: 'Approved & closed', Stuck: 'Stuck', 'To do': 'Moved back to To do' }[to]), to)
    return json({ ok: true })
  })
  on('POST', '/api/it/tasks/:id/note', async (env, req, url, p) => {
    const w = await who(env, req); const t = await getTask(env, p.id); if (!canSee(w, t)) throw new HttpError(403, 'Not your task')
    const b = await body(req); const text = clean(b.text, 1500); if (!text) throw bad('Write an update')
    await note(env, w, t.id, text)
    await env.DB.prepare('UPDATE it_tasks SET updated_at = ? WHERE id = ?').bind(now(), t.id).run()
    return json({ ok: true })
  })
  // Admin edits (due date, priority, owner, details)
  on('POST', '/api/it/tasks/:id', async (env, req, url, p) => {
    const w = await who(env, req); if (w.kind !== 'emp' || !w.admin) throw new HttpError(403, 'Not allowed')
    const t = await getTask(env, p.id); const b = await body(req)
    await env.DB.prepare('UPDATE it_tasks SET title = ?, detail = ?, priority = ?, due = ?, link = ?, kind = ?, site = ?, owner_partner = ?, owner_emp = ?, updated_at = ? WHERE id = ?')
      .bind(clean(b.title ?? t.title, 140) || t.title, clean(b.detail ?? t.detail, 3000), ['High', 'Normal', 'Low'].includes(b.priority) ? b.priority : t.priority, b.due === undefined ? t.due : (dateOk(b.due) ? b.due : null),
        clean(b.link ?? t.link, 500), KINDS.includes(b.kind) ? b.kind : t.kind, clean(b.site ?? t.site, 60), b.owner_partner !== undefined && t.doer === 'partner' ? Number(b.owner_partner) || t.owner_partner : t.owner_partner,
        b.owner_emp !== undefined && t.doer === 'team' ? Number(b.owner_emp) || t.owner_emp : t.owner_emp, now(), t.id).run()
    await audit(env, w.me.id, 'it_task_edit', 'it_tasks', t.id, t, b)
    return json({ ok: true })
  })
}

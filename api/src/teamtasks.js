// ONE task system: JDAC Parent (web) and the phone app read and write the same tasks
// (legacy_records tbl 'tasks' + 'task_checklist' + 'projects' + 'project_members').
// Extra JDAC Parent fields ride along in data.jp; data.cid keeps the web id stable.
// The IT partner (Zenmeg) only sees and changes tasks of the XENMAG project.
const V1 = `CREATE TABLE IF NOT EXISTS team_tasks (id TEXT PRIMARY KEY, proj TEXT, data TEXT NOT NULL, deleted INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL, updated_by TEXT)`
const isXen = (p) => /xenmag|zenmeg/i.test(String(p && p.name || ''))
const DONE = /done|closed|complete/i

export function registerTeamTasks(on, X) {
  const { json, body, bad, HttpError, ADMIN_ROLES, verifyToken, nowIso, legacyPut, dropCache, audit } = X
  async function who(env, req) {
    const tok = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '')
    const p = await verifyToken(tok, env.TOKEN_SECRET)
    if (!p) throw new HttpError(401, 'Login again')
    if (p.pu) {
      const u = await env.DB.prepare('SELECT * FROM it_partner_users WHERE id = ?').bind(p.pu).first()
      if (!u || !u.active || u.token_version !== p.tv) throw new HttpError(401, 'Login again')
      return { partner: u.partner, name: u.name }
    }
    const me = await env.DB.prepare('SELECT * FROM employees WHERE id = ?').bind(p.sub).first()
    if (!me || !me.active || me.token_version !== p.tv) throw new HttpError(401, 'Login again')
    return { me, name: me.name, admin: ADMIN_ROLES.includes(me.role) }
  }
  const rows = async (env, tbl) => (await env.DB.prepare('SELECT legacy_id, data FROM legacy_records WHERE tbl = ?').bind(tbl).all()).results.map((r) => ({ ...JSON.parse(r.data), _rid: r.legacy_id }))
  const d10 = (s) => String(s || '').slice(0, 10)

  on('GET', '/api/team/tasks', async (env, req) => {
    const w = await who(env, req)
    const [tasks, checks, projects, members] = await Promise.all([rows(env, 'tasks'), rows(env, 'task_checklist'), rows(env, 'projects'), rows(env, 'project_members')])
    const emps = w.partner ? [] : (await env.DB.prepare('SELECT id, legacy_id, name, role, active, department, designation FROM employees').all()).results
    const old = new Date(Date.now() - 45 * 864e5).toISOString().slice(0, 10)
    let P = projects.filter((p) => !/archiv|closed/i.test(String(p.status || '')))
    let T = tasks.filter((t) => !t.deleted && !(DONE.test(String(t.status || '')) && (d10(t.closedAt || t.updatedAt || t.createdAt) || '0') < old))
    if (w.partner) { P = P.filter(isXen); const ids = new Set(P.map((p) => String(p.id))); T = T.filter((t) => ids.has(String(t.projectId))) }
    const byTask = {}; for (const c of checks) (byTask[String(c.taskId)] = byTask[String(c.taskId)] || []).push(c)
    return json({
      now: nowIso(), emps,
      projects: P.map((p) => ({ id: String(p.id), name: p.name, members: w.partner ? [] : members.filter((m) => String(m.projectId) === String(p.id)).map((m) => ({ emp_id: m.emp_id ?? null, person_id: m.personId ?? null })) })),
      tasks: T.map((t) => ({ ...t, checklist: (byTask[String(t.id)] || []).sort((a, b) => (a.pos ?? 999) - (b.pos ?? 999) || String(a._rid).localeCompare(String(b._rid))).map((c) => ({ title: c.title, done: String(c.done) === '1' || c.done === true })) })),
    })
  })

  // Upsert tasks. Each item: { rid?, data:{title,status,...,cid,jp}, checklist?:[{title,done}], deleted? }
  on('POST', '/api/team/tasks', async (env, req) => {
    const w = await who(env, req); const b = await body(req)
    const list = Array.isArray(b.tasks) ? b.tasks.slice(0, 150) : []
    const projects = await rows(env, 'projects'); const xen = new Set(projects.filter(isXen).map((p) => String(p.id)))
    const all = await rows(env, 'tasks')
    const out = {}
    for (const it of list) {
      const d = it && it.data && typeof it.data === 'object' ? it.data : {}
      const cid = String(d.cid || '').slice(0, 40)
      let cur = it.rid ? all.find((t) => String(t._rid) === String(it.rid)) : cid ? all.find((t) => t.cid === cid) : null
      if (w.partner) {
        if (cur && !xen.has(String(cur.projectId))) throw new HttpError(403, 'Zenmeg can only change XENMAG tasks')
        if (!it.deleted && !xen.has(String(d.projectId))) throw new HttpError(403, 'Zenmeg can only change XENMAG tasks')
        if (it.deleted) throw new HttpError(403, 'Only JDAC can delete tasks')
      }
      if (it.deleted) {
        if (cur) { const nd = { ...cur, deleted: true, status: 'Closed', closedAt: nowIso(), updatedAt: nowIso(), updatedBy_name: w.name }; delete nd._rid
          await env.DB.prepare("UPDATE legacy_records SET data = ? WHERE tbl = 'tasks' AND legacy_id = ?").bind(JSON.stringify(nd), String(cur._rid)).run() }
        continue
      }
      const s = JSON.stringify(d); if (s.length > 40000) throw bad('Task is too large')
      const clean = {}; for (const k of ['title', 'status', 'priority', 'due', 'start', 'notes', 'projectId', 'assignee_emp', 'assigneeId', 'tags', 'type', 'cid', 'jp', 'closedAt']) if (k in d) clean[k] = d[k]
      clean.title = String(clean.title || '').slice(0, 200) || 'Untitled'
      let rid, tid
      if (cur) {
        rid = String(cur._rid); tid = cur.id
        const nd = { ...cur, ...clean, id: cur.id, updatedAt: nowIso(), updatedBy_name: w.name }; delete nd._rid; delete nd.checklist
        if (DONE.test(String(nd.status)) && !cur.closedAt) nd.closedAt = nowIso()
        if (!DONE.test(String(nd.status))) nd.closedAt = null
        await env.DB.prepare("UPDATE legacy_records SET data = ? WHERE tbl = 'tasks' AND legacy_id = ?").bind(JSON.stringify(nd), rid).run()
      } else {
        rid = await legacyPut(env, 'tasks', { ...clean, createdAt: nowIso(), createdBy_name: w.name, ...(DONE.test(String(clean.status)) ? { closedAt: nowIso() } : {}) }); tid = rid
        all.push({ ...clean, id: rid, _rid: rid })
      }
      if (Array.isArray(it.checklist)) {
        await env.DB.prepare("DELETE FROM legacy_records WHERE tbl = 'task_checklist' AND json_extract(data, '$.taskId') = ?").bind(String(tid)).run()
        const L = it.checklist.slice(0, 60); for (let k = 0; k < L.length; k++) await legacyPut(env, 'task_checklist', { taskId: tid, title: String(L[k].title || '').slice(0, 200), done: L[k].done ? 1 : 0, pos: k, createdAt: nowIso() })
      }
      out[cid || rid] = rid
    }
    dropCache()
    return json({ ok: true, rids: out, now: nowIso() })
  })

  // New team (project) from JDAC Parent → a real project with members
  on('POST', '/api/team/projects', async (env, req) => {
    const w = await who(env, req); if (!w.admin) throw new HttpError(403, 'Only admins change teams')
    const b = await body(req); const name = String(b.name || '').trim().slice(0, 60); if (!name) throw bad('Team name?')
    const ex = (await rows(env, 'projects')).find((p) => String(p.name || '').trim().toLowerCase() === name.toLowerCase())
    const pid = ex ? String(ex.id) : await legacyPut(env, 'projects', { name, status: 'Active', createdAt: nowIso(), createdBy_name: w.name })
    if (!ex) for (const id of (Array.isArray(b.emp_ids) ? b.emp_ids : []).map(Number)) {
      const e = await env.DB.prepare('SELECT id, legacy_id FROM employees WHERE id = ?').bind(id).first()
      if (e) await legacyPut(env, 'project_members', { projectId: pid, personId: e.legacy_id ?? null, emp_id: e.id, role: 'Member', createdAt: nowIso() })
    }
    dropCache(); await audit(env, w.me.id, 'project_add', 'projects', pid, null, { name })
    return json({ ok: true, id: pid })
  })

  // Tasks saved on 25 Nov in the short-lived separate store: handed to JDAC Parent once, which moves them in
  on('GET', '/api/team/v1', async (env, req) => {
    const w = await who(env, req); if (!w.admin) throw new HttpError(403, 'Not allowed')
    await env.DB.prepare(V1).run()
    const done = await env.DB.prepare("SELECT 1 AS x FROM app_settings WHERE key = 'team_tasks_v1_moved'").first()
    const r = done ? [] : (await env.DB.prepare('SELECT data FROM team_tasks WHERE deleted = 0').all()).results.map((x) => JSON.parse(x.data))
    return json({ tasks: r })
  })
  on('POST', '/api/team/v1/done', async (env, req) => {
    const w = await who(env, req); if (!w.admin) throw new HttpError(403, 'Not allowed')
    await env.DB.prepare("INSERT OR IGNORE INTO app_settings (key, value) VALUES ('team_tasks_v1_moved', ?)").bind(nowIso()).run()
    return json({ ok: true })
  })
}

// 26 Nov 2026 (Darshan): Snehal Z (accountant) sits with Atmaram one day per month (Apr–Nov 2026) to reconcile
// GovaaBazaar Goa payments with the bank entries in Tally. One task per month, Accounts project, with a checklist.
export async function seedGoaRecon(env, legacyPut, nowIso) {
  const sn = (await env.DB.prepare("SELECT id, legacy_id FROM employees WHERE active = 1 AND name LIKE 'Snehal%' AND (department LIKE '%ccount%' OR designation LIKE '%ccount%') ORDER BY id LIMIT 1").first())
    || (await env.DB.prepare("SELECT id, legacy_id FROM employees WHERE active = 1 AND (name LIKE 'Snehal Z%' OR name LIKE 'Snehal Za%') ORDER BY id LIMIT 1").first())
  if (!sn) return false
  const { results: pr } = await env.DB.prepare("SELECT legacy_id, data FROM legacy_records WHERE tbl = 'projects'").all()
  const acc = pr.map((r) => JSON.parse(r.data)).find((p) => /^accounts?$/i.test(String(p.name || '').trim()))
  const pid = acc ? acc.id : await legacyPut(env, 'projects', { name: 'Accounts', status: 'Active', createdAt: nowIso(), createdBy_name: 'System' })
  if (!acc) await legacyPut(env, 'project_members', { projectId: pid, personId: sn.legacy_id ?? null, emp_id: sn.id, role: 'Member', createdAt: nowIso() })
  const months = [['04', 'April'], ['05', 'May'], ['06', 'June'], ['07', 'July'], ['08', 'August'], ['09', 'September'], ['10', 'October'], ['11', 'November']]
  const days = ['2026-11-27', '2026-11-28', '2026-11-30', '2026-12-01', '2026-12-02', '2026-12-03', '2026-12-04', '2026-12-05']
  const CK = [
    'Get Atmaram\'s sales list for the month: every bill / order per shop with amount',
    'Get the bank statement entries for the month (already uploaded in Tally)',
    'Match every cash and cheque deposit by Atmaram to a bank entry',
    'Split bulk deposits shop-wise (e.g. ₹20,000 for 4 shops → ₹5,000 each) and note which shops',
    'Payments that went to Darshan sir\'s personal account (QR not working): list shop, date, amount',
    'Payments through company petty cash / shops paying into the petty cash account: list and map',
    'Update every Goa shop\'s ledger in Tally and confirm the balance',
    'List differences: unmatched, short or extra amounts, with reason',
    'Send the month summary to Darshan sir: closed / differences / outstanding per shop',
  ]
  for (let i = 0; i < months.length; i++) {
    const [mm, mon] = months[i]
    const notes = `Sit with Atmaram (one full day) and close ${mon} 2026 for GovaaBazaar Goa.\n\nMap every sale Atmaram made and every payment he collected (cash, cheque, UPI) to the bank entries uploaded in Tally.\n• Bulk deposits: split per shop (e.g. ₹20,000 deposited for 4 shops = ₹5,000 each).\n• If the QR was not working, money may have gone to Darshan sir's personal account.\n• Some payments may have gone through company petty cash, or shops may have paid into the petty cash account.\nEnd of the day: ${mon} ledgers of all Goa shops reconciled, differences listed, summary sent to Darshan sir.`
    const cid = `goarec-2026-${mm}`
    if (await env.DB.prepare("SELECT 1 AS x FROM legacy_records WHERE tbl = 'tasks' AND json_extract(data, '$.cid') = ?").bind(cid).first()) continue
    const tid = await legacyPut(env, 'tasks', { title: `Goa reconciliation · ${mon} 2026 — Atmaram payments vs bank (Tally)`, status: 'To do', type: 'One-time', priority: 'High', due: days[i], start: days[i],
      notes, projectId: pid, assigneeId: sn.legacy_id ?? null, assignee_emp: sn.id, tags: [{ n: 'Goa reconciliation', c: '#7A2E8E' }], cid,
      jp: { co: 'gb', by: 'darshan', tags: ['Goa reconciliation', 'GovaaBazaar'], st: 'To do' }, createdAt: nowIso(), createdBy_name: 'Darshan Soni' })
    for (let k = 0; k < CK.length; k++) await legacyPut(env, 'task_checklist', { taskId: tid, title: CK[k], done: 0, pos: k, createdAt: nowIso() })
  }
  return true
}

// CSE team = Neetu, Balaji and Imran (plus Darshan / Nameera if they were already in it)
export async function setCseMembers(env, legacyPut, nowIso) {
  const all = async (tbl) => (await env.DB.prepare('SELECT legacy_id, data FROM legacy_records WHERE tbl = ?').bind(tbl).all()).results.map((r) => ({ lid: r.legacy_id, ...JSON.parse(r.data) }))
  const pr = (await all('projects')).find((p) => /\bcse\b/i.test(String(p.name || '')))
  if (!pr) return false
  const pid = String(pr.id ?? pr.lid)
  const emps = (await env.DB.prepare('SELECT id, legacy_id, name, username FROM employees').all()).results
  const find = (n) => emps.find((e) => new RegExp('^' + n, 'i').test(String(e.name || '')) || String(e.username || '').toLowerCase() === n.toLowerCase())
  const want = ['Neetu', 'Balaji', 'Imran'].map(find).filter(Boolean)
  const keepTop = ['Darshan', 'Nameera'].map(find).filter(Boolean).map((e) => e.id)
  const mem = (await all('project_members')).filter((m) => String(m.projectId) === pid)
  for (const m of mem) if (m.emp_id != null && !want.some((e) => e.id === Number(m.emp_id)) && !keepTop.includes(Number(m.emp_id)))
    await env.DB.prepare("DELETE FROM legacy_records WHERE tbl = 'project_members' AND legacy_id = ?").bind(m.lid).run()
  for (const e of want) if (!mem.some((m) => Number(m.emp_id) === e.id))
    await legacyPut(env, 'project_members', { projectId: pid, personId: e.legacy_id ?? null, emp_id: e.id, role: 'Member', createdAt: nowIso() })
  return want.length > 0
}

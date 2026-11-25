// Shared Tasks store for JDAC Parent (projects = teams). One row per task, JSON body, last write wins.
// Employees (any active login) read all tasks; the IT partner (Zenmeg) reads and writes only XENMAG tasks.
const TT = [
  `CREATE TABLE IF NOT EXISTS team_tasks (id TEXT PRIMARY KEY, proj TEXT, data TEXT NOT NULL, deleted INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL, updated_by TEXT)`,
  `CREATE TABLE IF NOT EXISTS team_kv (key TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at TEXT NOT NULL, updated_by TEXT)`,
]
export const PARTNER_PROJ = { zenmeg: 'xenmag' }
let ready = false
async function ensure(env) { if (ready) return; for (const s of TT) await env.DB.prepare(s).run(); ready = true }

export function registerTeamTasks(on, X) {
  const { json, body, bad, HttpError, ADMIN_ROLES, verifyToken, nowIso } = X
  async function who(env, req) {
    await ensure(env)
    const tok = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '')
    const p = await verifyToken(tok, env.TOKEN_SECRET)
    if (!p) throw new HttpError(401, 'Login again')
    if (p.pu) {
      const u = await env.DB.prepare('SELECT * FROM it_partner_users WHERE id = ?').bind(p.pu).first()
      if (!u || !u.active || u.token_version !== p.tv) throw new HttpError(401, 'Login again')
      return { partner: u.partner, proj: PARTNER_PROJ[u.partner] || '__none', name: u.name }
    }
    const me = await env.DB.prepare('SELECT * FROM employees WHERE id = ?').bind(p.sub).first()
    if (!me || !me.active || me.token_version !== p.tv) throw new HttpError(401, 'Login again')
    return { me, name: me.name, admin: ADMIN_ROLES.includes(me.role) }
  }
  const parse = (r) => { try { return { ...JSON.parse(r.data), _u: r.updated_at } } catch { return null } }

  on('GET', '/api/team/tasks', async (env, req, url) => {
    const w = await who(env, req)
    const since = url.searchParams.get('since') || ''
    const q = w.partner
      ? env.DB.prepare('SELECT * FROM team_tasks WHERE proj = ? AND updated_at > ? ORDER BY updated_at').bind(w.proj, since)
      : env.DB.prepare('SELECT * FROM team_tasks WHERE updated_at > ? ORDER BY updated_at').bind(since)
    const rows = (await q.all()).results
    const pr = await env.DB.prepare("SELECT * FROM team_kv WHERE key = 'projects'").first()
    let projects = pr ? JSON.parse(pr.data) : null
    if (projects && w.partner) projects = projects.filter((p) => p.id === w.proj)
    return json({ now: nowIso(), tasks: rows.filter((r) => !r.deleted).map(parse).filter(Boolean), deleted: rows.filter((r) => r.deleted).map((r) => r.id), projects, projects_at: pr ? pr.updated_at : null })
  })

  on('POST', '/api/team/tasks', async (env, req) => {
    const w = await who(env, req)
    const b = await body(req)
    const list = Array.isArray(b.tasks) ? b.tasks.slice(0, 200) : []
    const now = nowIso(); let n = 0
    for (const t of list) {
      const id = String(t && t.id || '').slice(0, 40)
      if (!id || !/^[\w-]+$/.test(id)) continue
      const old = await env.DB.prepare('SELECT proj FROM team_tasks WHERE id = ?').bind(id).first()
      if (w.partner && ((old && old.proj !== w.proj) || (!t.deleted && t.proj !== w.proj))) throw new HttpError(403, 'Zenmeg can only change XENMAG tasks')
      if (t.deleted) {
        if (w.partner) throw new HttpError(403, 'Only JDAC can delete tasks')
        await env.DB.prepare('UPDATE team_tasks SET deleted = 1, updated_at = ?, updated_by = ? WHERE id = ?').bind(now, w.name, id).run(); n++; continue
      }
      const { _u, ...clean } = t
      const data = JSON.stringify(clean)
      if (data.length > 60000) throw bad('Task is too large')
      await env.DB.prepare('INSERT INTO team_tasks (id, proj, data, deleted, updated_at, updated_by) VALUES (?,?,?,0,?,?) ON CONFLICT(id) DO UPDATE SET proj = excluded.proj, data = excluded.data, deleted = 0, updated_at = excluded.updated_at, updated_by = excluded.updated_by')
        .bind(id, String(clean.proj || ''), data, now, w.name).run(); n++
    }
    return json({ ok: true, saved: n, now })
  })

  on('POST', '/api/team/projects', async (env, req) => {
    const w = await who(env, req); if (!w.admin) throw new HttpError(403, 'Only admins change teams')
    const b = await body(req)
    if (!Array.isArray(b.projects) || !b.projects.every((p) => p && p.id && p.n)) throw bad('Bad team list')
    await env.DB.prepare("INSERT INTO team_kv (key, data, updated_at, updated_by) VALUES ('projects', ?, ?, ?) ON CONFLICT(key) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at, updated_by = excluded.updated_by")
      .bind(JSON.stringify(b.projects.slice(0, 100)), nowIso(), w.name).run()
    return json({ ok: true })
  })
}

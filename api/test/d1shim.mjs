// Minimal Cloudflare D1 API on top of node:sqlite — local tests only.
import { DatabaseSync } from 'node:sqlite'
import { readFileSync } from 'node:fs'
export function makeD1(schemaPath) {
  const db = new DatabaseSync(':memory:')
  db.exec(readFileSync(schemaPath, 'utf8'))
  const norm = (v) => (v === undefined ? null : v instanceof Uint8Array ? v : typeof v === 'boolean' ? (v ? 1 : 0) : v)
  class Stmt {
    constructor(sql, args = []) { this.sql = sql; this.args = args }
    bind(...a) { return new Stmt(this.sql, a.map(norm)) }
    _s() { return db.prepare(this.sql) }
    async first() { const r = this._s().get(...this.args); return r ? { ...r } : null }
    async all() { return { results: this._s().all(...this.args).map((r) => ({ ...r })) } }
    async run() { const r = this._s().run(...this.args); return { meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid) } } }
  }
  return {
    raw: db,
    prepare: (sql) => new Stmt(sql),
    async batch(stmts) {
      db.exec('BEGIN')
      try { const out = []; for (const s of stmts) out.push(await s.run()); db.exec('COMMIT'); return out } catch (e) { db.exec('ROLLBACK'); throw e }
    },
  }
}

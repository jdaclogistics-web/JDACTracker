// api/src/* + api/schema.sql → api/dist/worker.js (एक file — Cloudflare dashboard editor में paste करने के लिए)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
const rd = (p) => readFileSync(new URL(`../api/${p}`, import.meta.url), 'utf8')
const strip = (s) => s.replace(/^import .*$/gm, '').replace(/^export \{[^}]*\}\s*$/gm, '').replace(/^export (?!default)/gm, '')
// schema.sql → statements (BEGIN…END triggers को एक रखता है)
const sql = rd('schema.sql').split('\n').map((l) => l.replace(/--.*$/, '')).join('\n')
const stmts = []; let cur = '', inTrig = false
for (const line of sql.split('\n')) {
  if (!line.trim()) continue
  cur += line + '\n'
  if (/CREATE TRIGGER/i.test(line)) inTrig = true
  const done = inTrig ? /\bEND;\s*$/i.test(line) : /;\s*$/.test(line)
  if (done) { stmts.push(cur.trim().replace(/;\s*$/, '')); cur = ''; inTrig = false }
}
const schema = stmts.filter((s) => !/^PRAGMA/i.test(s))
const out = ['// JDAC Tracker API — bundled from api/src (do not edit here; edit src and re-bundle)',
  `const SCHEMA_STATEMENTS = ${JSON.stringify(schema)}`,
  strip(rd('src/lib.js')), strip(rd('src/photos.js')), strip(rd('src/cc.js')), strip(rd('src/desks.js')), strip(rd('src/index.js'))].join('\n')
mkdirSync(new URL('../api/dist/', import.meta.url), { recursive: true })
writeFileSync(new URL('../api/dist/worker.js', import.meta.url), out)
console.log('✔ api/dist/worker.js', out.length, 'bytes,', schema.length, 'schema statements')

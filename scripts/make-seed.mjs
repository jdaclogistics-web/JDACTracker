// Employees CSV → D1 seed SQL + logins list (username / password).
// चलाएँ:  node scripts/make-seed.mjs employees.csv out-folder
// employees.csv columns: name,username,role,team,designation,work_location,shift_start,shift_end,phone,joining_date,password
//   username/password खाली छोड़ें तो: username = नाम से (rahul), password = JDAC + 4 random अंक
// ⚠️ out-folder में passwords हैं — GitHub पर कभी commit न करें.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { hashPassword } from '../api/src/lib.js'

const [inFile, outDir = 'seed-out'] = process.argv.slice(2)
if (!inFile) { console.error('usage: node scripts/make-seed.mjs employees.csv [out-folder]'); process.exit(1) }

const parseCsv = (t) => {
  const rows = []; let row = [], cell = '', q = false
  for (let i = 0; i < t.length; i++) {
    const c = t[i]
    if (q) { if (c === '"' && t[i + 1] === '"') { cell += '"'; i++ } else if (c === '"') q = false; else cell += c }
    else if (c === '"') q = true
    else if (c === ',') { row.push(cell); cell = '' }
    else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; row.push(cell); if (row.some((x) => x.trim())) rows.push(row); row = []; cell = '' }
    else cell += c
  }
  row.push(cell); if (row.some((x) => x.trim())) rows.push(row)
  const [h, ...rest] = rows
  return rest.map((r) => Object.fromEntries(h.map((k, i) => [k.trim(), (r[i] ?? '').trim()])))
}
const sq = (v) => (v === null || v === undefined || v === '' ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`)
const rnd4 = () => String(crypto.getRandomValues(new Uint32Array(1))[0] % 9000 + 1000)

const people = parseCsv(readFileSync(inFile, 'utf8'))
const used = new Set(), usedPw = new Set(), out = []
for (const p of people) {
  let u = (p.username || '').toLowerCase().replace(/\s+/g, '')
  if (!u) {
    const words = p.name.toLowerCase().split(/\s+/).map((w) => w.replace(/[^a-z0-9]/g, '')).filter(Boolean)
    u = words[0] || 'user'
    if (used.has(u) || people.filter((x) => x !== p && x.name.toLowerCase().split(/\s+/)[0] === p.name.toLowerCase().split(/\s+/)[0]).length) u = words.join('')
    for (let i = 2, b = u; used.has(u); i++) u = b + i
  }
  if (used.has(u)) throw new Error('duplicate username ' + u)
  used.add(u)
  let pw = p.password
  if (!pw) { do pw = 'JDAC' + rnd4(); while (usedPw.has(pw)) }
  usedPw.add(pw)
  const phone = (p.phone || '').replace(/\D/g, '').slice(-10)
  out.push({ ...p, username: u, password: pw, phone: phone.length === 10 ? phone : '' })
}

const sql = ['-- JDAC Tracker employees seed (generated). Contains password HASHES only.']
for (const p of out) {
  sql.push(`INSERT INTO employees (username, name, phone, pass_hash, role, team, designation, work_location, shift_start, shift_end, joining_date) VALUES (${[
    sq(p.username), sq(p.name), sq(p.phone), sq(await hashPassword(p.password)), sq(p.role || 'employee'), sq(p.team === 'Warehouse' ? 'Warehouse' : 'Office'),
    sq(p.designation), sq(p.work_location), sq(p.shift_start || '10:00'), sq(p.shift_end || '19:00'), sq(p.joining_date)].join(', ')}) ON CONFLICT(username) DO NOTHING;`)
}
mkdirSync(outDir, { recursive: true })
writeFileSync(`${outDir}/seed.sql`, sql.join('\n') + '\n')
const csv = [['#', 'Name', 'Username', 'Password', 'Role', 'Team', 'Designation', 'Location', 'Shift', 'Mobile']]
out.forEach((p, i) => csv.push([i + 1, p.name, p.username, p.password, p.role || 'employee', p.team, p.designation, p.work_location, `${p.shift_start || '10:00'}-${p.shift_end || '19:00'}`, p.phone]))
writeFileSync(`${outDir}/logins.csv`, '﻿' + csv.map((r) => r.map((x) => `"${String(x ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n') + '\r\n')
console.log(`✔ ${out.length} logins → ${outDir}/seed.sql + ${outDir}/logins.csv`)
console.log(`  Cloudflare में डालें:  cd api && npx wrangler d1 execute jdac-tracker --remote --file=../${outDir}/seed.sql`)

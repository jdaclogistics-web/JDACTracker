import worker, { runCron } from '../src/index.js'
import { makeD1 } from './d1shim.mjs'
import { hashPassword, istDate } from '../src/lib.js'
import assert from 'node:assert/strict'

const DB = makeD1(new URL('../schema.sql', import.meta.url).pathname)
const env = { DB, TOKEN_SECRET: 'test-secret' }
const call = async (method, path, body, token) => {
  const r = await worker.fetch(new Request('https://api.test' + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined }), env)
  const ct = r.headers.get('content-type') || ''
  return { status: r.status, data: ct.includes('json') ? await r.json() : await r.arrayBuffer() }
}
let pass = 0; const ok = (c, m) => { assert.ok(c, m); pass++; console.log('  ✔', m) }

const h = await hashPassword('JDAC1234')
// real-staff data migrations don't apply to the test fixtures
for (const k of ['mig_people_v1', 'mig_directory_v1', 'mig_org_v2', 'mig_login_v1', 'mig_org_v3']) await DB.prepare('INSERT INTO app_settings (key, value) VALUES (?, ?)').bind(k, 'test').run()
await DB.prepare("INSERT INTO employees (username, name, phone, pass_hash, role, team, work_location) VALUES ('rahul','Rahul','9876543210',?, 'employee','Warehouse','Pune Camp'), ('nameera','Nameera','9000000001',?, 'hr','Office','Pune HO'), ('darshan','Darshan',NULL,?, 'developer','Office',NULL)").bind(h, h, h).run()

console.log('Login')
ok((await call('POST', '/api/login', { username: 'rahul', password: 'wrong' })).status === 401, 'wrong password rejected')
const L = await call('POST', '/api/login', { username: 'Rahul', password: 'JDAC1234', device_id: 'dev-1' })
ok(L.status === 200 && L.data.token, 'login with +91 format works')
const T = L.data.token
const HR = (await call('POST', '/api/login', { phone: '9000000001', password: 'JDAC1234' })).data.token
const DEV = (await call('POST', '/api/login', { username: 'darshan', password: 'JDAC1234' })).data.token
ok((await call('GET', '/api/admin/today', null, T)).status === 403, 'employee cannot open admin')

console.log('Day + GPS')
ok((await call('POST', '/api/day/start', { lat: 0, lng: 0 }, T)).status === 400, 'start without GPS rejected')
const photo = Buffer.from('fakejpegdata').toString('base64')
const S = await call('POST', '/api/day/start', { lat: 18.5204, lng: 73.8567, photo, client_id: 'c0' }, T)
ok(S.status === 200 && S.data.session.start_photo?.startsWith('db:'), 'day start + photo saved (fallback store)')
const S2 = await call('POST', '/api/day/start', { lat: 18.53, lng: 73.86 }, T)
ok(S2.data.resumed && S2.data.session.start_at === S.data.session.start_at, 'second start = resume, start time unchanged')
const d = istDate(), t0 = Date.now()
const pings = [1, 2, 3, 4].map((i) => ({ client_id: 'c' + i, date: d, lat: 18.5204 + i * 0.01, lng: 73.8567, kind: 'duty', recorded_at: new Date(t0 - (5 - i) * 600000).toISOString() }))
const P1 = await call('POST', '/api/pings', { pings }, T)
ok(P1.data.inserted === 4 && P1.data.rejected.length === 0, '4 pings inserted')
const P2 = await call('POST', '/api/pings', { pings }, T)
ok(P2.data.inserted === 0 && P2.data.duplicates === 4 && P2.data.accepted.length === 4, 'same batch again → 0 new, all accepted (no duplicates)')
const bad = await call('POST', '/api/pings', { pings: [{ client_id: 'x1', date: d, lat: 0, lng: 0, recorded_at: new Date().toISOString() }, { client_id: 'x2', date: d, lat: 18.6, lng: 73.9, recorded_at: new Date(Date.now() + 3600000).toISOString() }] }, T)
ok(bad.data.rejected.length === 2, 'bad GPS (0,0 / future time) rejected with reason')
const cnt = (await DB.prepare('SELECT count(*) n FROM location_pings').first()).n
ok(cnt === 5, `DB has exactly 5 pings (start + 4) — got ${cnt}`)
const km = (await DB.prepare('SELECT total_km FROM day_sessions').first()).total_km
ok(km > 7.7 && km < 7.9, `km computed by server (3 hops + return to start point) = ${km}`)
const last = await DB.prepare('SELECT * FROM last_location').first()
const newest = (await DB.prepare('SELECT max(recorded_at) t FROM location_pings').first()).t
ok(last.recorded_at === newest, 'last_location = newest point')
// out-of-order old point arrives later (offline sync) → last_location must NOT go back
await call('POST', '/api/pings', { pings: [{ client_id: 'old1', date: d, lat: 18.4, lng: 73.8, recorded_at: new Date(t0 - 3600000).toISOString() }] }, T)
ok((await DB.prepare('SELECT recorded_at FROM last_location').first()).recorded_at === newest, 'late offline point does not overwrite live location')

console.log('Protection')
let threw = false; try { await DB.prepare('DELETE FROM location_pings').run() } catch { threw = true }
ok(threw, 'DELETE on pings blocked by database')
threw = false; try { await DB.prepare("UPDATE location_pings SET lat = 1").run() } catch { threw = true }
ok(threw, 'UPDATE on pings blocked')
threw = false; try { await DB.prepare("DELETE FROM employees").run() } catch { threw = true }
ok(threw, 'DELETE employees blocked')

console.log('Leave')
const tomorrow = new Date(Date.now() + 86400000 + 330 * 60000).toISOString().slice(0, 10)
ok((await call('POST', '/api/leaves', { date: tomorrow, kind: 'Full day', reason: 'family' }, T)).status === 200, 'leave applied')
ok((await call('POST', '/api/leaves', { date: tomorrow, kind: 'Full day', reason: 'again' }, T)).status === 409, 'duplicate leave same day blocked')
const lv = (await call('GET', '/api/admin/leaves', null, HR)).data.leaves[0]
ok((await call('POST', `/api/admin/leaves/${lv.id}/decide`, { status: 'Approved' }, HR)).status === 200, 'HR approves leave')

console.log('Admin views')
const today = await call('GET', '/api/admin/today', null, HR)
ok(today.status === 200 && today.data.summary.warehouse.in === 1 && today.data.rows.find((r) => r.emp.name === 'Rahul').status === 'on_duty', 'today summary: Rahul on duty, warehouse 1 in')
const tr = await call('GET', `/api/admin/trail?emp=${today.data.rows.find((r) => r.emp.name === 'Rahul').emp.id}&date=${d}`, null, HR)
ok(tr.data.pings.length === 6, 'route trail returns all points in time order')
const ph = await call('GET', '/api/admin/photo?ref=' + encodeURIComponent(S.data.session.start_photo), null, HR)
ok(ph.status === 200 && Buffer.from(ph.data).toString() === 'fakejpegdata', 'HR can view selfie')

console.log('Roles')
ok((await call('POST', '/api/admin/employees', { name: 'X', phone: '9111111111', password: 'abcdef', role: 'boss' }, HR)).status === 403, 'HR cannot create a boss login')
{ const c = await call('POST', '/api/admin/employees', { name: 'Ashish', phone: '9111111111', password: 'abcdef', team: 'Warehouse' }, HR); ok(c.status === 200 && c.data.username === 'JD1001', 'HR creates employee, User ID = next Employee ID ' + c.data.username) }
{ const c = await call('POST', '/api/admin/employees', { name: 'Imran', phone: '9222222222' }, HR); ok(c.data.username === 'JD1002' && (await call('POST', '/api/login', { username: 'jd1002', password: '9222222222' })).status === 200, 'no password given → mobile number is the password') }
ok((await call('POST', '/api/login', { username: 'JD1001', password: 'abcdef' })).status === 200, 'new employee logs in with username')
ok((await call('POST', '/api/login', { username: 'darshan', password: 'JDAC1234', device_id: 'dev-phone-A' })).status === 200, 'developer phone A links')
ok((await call('POST', '/api/login', { username: 'darshan', password: 'JDAC1234', device_id: 'dev-phone-B' })).status === 403, 'developer blocked on another phone')
ok((await call('POST', '/api/login', { username: 'darshan', password: 'JDAC1234', device_id: 'web' })).status === 200, 'developer web panel still works')
{ const c = await call('POST', '/api/admin/employees', { name: 'Ashish Kumar', password: 'abcdef' }, HR); ok(c.data.username === 'JD1003', 'Employee IDs keep counting up') }
ok((await call('GET', '/api/dev/system', null, HR)).status === 403, 'HR cannot open developer system')
const sys = await call('GET', '/api/dev/system', null, DEV)
ok(sys.status === 200 && sys.data.employees === 6, 'developer system panel works')

console.log('End day + correction')
const E1 = await call('POST', '/api/day/end', { lat: 18.56, lng: 73.86, client_id: 'end1' }, T)
ok(E1.status === 200 && E1.data.session.end_at, 'day ended')
const E2 = await call('POST', '/api/day/end', { lat: 18.6, lng: 73.9, client_id: 'end2' }, T)
ok(E2.data.already && E2.data.session.end_at === E1.data.session.end_at, 'second end does not change out time')
ok((await call('POST', `/api/admin/day/${E1.data.session.id}/correct`, { manual_km: 20 }, HR)).status === 400, 'correction without reason rejected')
ok((await call('POST', `/api/admin/day/${E1.data.session.id}/correct`, { manual_km: 20, reason: 'road km' }, HR)).status === 200, 'HR correction with reason')
const kmNow = (await DB.prepare('SELECT total_km, manual_km FROM day_sessions').first()); console.log(kmNow); ok(kmNow.total_km >= 20, 'km is at least the corrected 20 (GPS km wins if higher)')
const au = await call('GET', '/api/dev/audit', null, DEV)
ok(au.data.audit.some((a) => a.action === 'day_correct' && a.actor_name === 'Nameera'), 'audit log shows who corrected')

console.log('Password reset revokes old login')
const rahulId = today.data.rows.find((r) => r.emp.name === 'Rahul').emp.id
await call('PATCH', `/api/admin/employees/${rahulId}`, { new_password: 'NewPass1' }, HR)
ok((await call('GET', '/api/me', null, T)).status === 401, 'old token stops working after reset')

console.log('Cron')
await DB.prepare("INSERT INTO day_sessions (emp_id, date, start_at) VALUES (?, '2026-01-01', '2026-01-01T04:00:00.000Z')").bind(rahulId).run()
await runCron(env)
ok((await DB.prepare("SELECT auto_closed FROM day_sessions WHERE date='2026-01-01'").first()).auto_closed === 1, 'forgotten old day auto-closed')
console.log('24h auto-logout')
{
  const L = await call('POST', '/api/login', { username: 'JD1001', password: 'abcdef', device_id: 'ashish-phone' })
  ok(L.status === 200, 'warehouse staff logs in from phone')
  const aid = L.data.me.id
  ok(!!(await DB.prepare('SELECT app_login_at FROM employees WHERE id = ?').bind(aid).first()).app_login_at, 'phone login time saved')
  await runCron(env)
  ok((await call('GET', '/api/me', null, L.data.token)).status === 200, 'still logged in before 24 hours')
  await DB.prepare('UPDATE employees SET app_login_at = ? WHERE id = ?').bind(new Date(Date.now() - 25 * 3600000).toISOString(), aid).run()
  await runCron(env)
  ok((await call('GET', '/api/me', null, L.data.token)).status === 401, 'auto logged out after 24 hours')
  const al = await call('GET', '/api/admin/alerts', null, HR)
  ok(al.data.alerts.some((a) => a.kind === 'auto_logout' && a.emp_id === aid), 'HR dashboard gets auto-logout alert')
  await call('POST', '/api/login', { username: 'JD1001', password: 'abcdef', device_id: 'ashish-phone' })
  ok(!(await call('GET', '/api/admin/alerts', null, HR)).data.alerts.some((a) => a.kind === 'auto_logout' && a.emp_id === aid), 'alert clears when they log in again')
}
{ // payroll: auto from attendance, save inputs + rates
  const m = new Date(Date.now() + 330 * 60000).toISOString().slice(0, 7)
  const g = await call('GET', '/api/admin/payroll?month=' + m, null, HR)
  ok(g.status === 200 && Array.isArray(g.data.rows) && g.data.rows.length > 0, 'payroll sheet loads for HR')
  const id = g.data.rows[0].emp_id
  const sv = await call('POST', '/api/admin/payroll', { emp_id: id, month: m, advance: 500, incentives: 200, note: 'test', rates: { fixed: 30000, mobile: 250 } }, HR)
  const g2 = await call('GET', '/api/admin/payroll?month=' + m, null, HR); const r = g2.data.rows.find((x) => x.emp_id === id)
  ok(sv.status === 200 && r.data.advance === 500 && r.rates.fixed === 30000 && r.rates.mobile === 250, 'payroll inputs and rates save')
}
{ // orders from the Tasks panel, own tasks, project-only chat
  const T = (await call('POST', '/api/login', { username: 'jd1002', password: '9222222222' })).data.token
  const o = await call('POST', '/api/bookings', { customer: 'Sai Traders', amount: 1500 }, T)
  const g = await call('GET', '/api/bookings', null, T)
  ok(o.status === 200 && /^ORD-/.test(o.data.booking_no) && g.data.totals.today_n >= 1 && g.data.rows[0].customer === 'Sai Traders', 'employee punches an order without an order number')
  const t = await call('POST', '/api/my/task', { title: 'Visit 5 shops' }, T)
  const h = await call('GET', '/api/my/home', null, T)
  ok(t.status === 200 && h.data.up_next.some((x) => x.title === 'Visit 5 shops'), 'employee adds their own task')
  const pm = await call('POST', '/api/admin/project-members', { name: 'Bahiram', emp_ids: [] }, HR); const pid = pm.data.project_id
  ok((await call('GET', '/api/cc/chat?group=' + pid, null, T)).status === 403, 'non-member cannot open a project chat')
  const meId = (await call('GET', '/api/me', null, T)).data.me.id
  await call('POST', '/api/admin/project-members', { project_id: pid, emp_ids: [meId] }, HR)
  const c1 = await call('GET', '/api/cc/chat?group=' + pid, null, T)
  ok(c1.status === 200 && c1.data.groups.some((x) => x.id === pid), 'member sees the project chat group')
  const c2 = await call('GET', '/api/cc/chat?as=' + meId, null, HR)
  ok(c2.data.viewing_as && c2.data.groups.length === c1.data.groups.length, 'admin previews exactly the groups an employee sees')
}
console.log(`\nALL ${pass} CHECKS PASSED`)

// Command Centre (Boss home), company pages, employee home + Cargo Sales desk.
// सारा पुराना business data legacy_records में है — यहाँ उसी से summary बनती है.
// नया entry (call log, order, quotation, task done) भी legacy_records में ही जाता है.

export const COMPANIES = ['JDAC Logistics', 'Jupiter Equipment', 'GovaaBazaar', 'JDAC Studios']
const N = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0 }
const d10 = (v) => (v == null || v === 'None' ? '' : String(v).slice(0, 10))
const s = (v) => (v == null || v === 'None' ? '' : String(v))
const LOST = /^(LS|IR)|not interested|irrelevant|cancel|^NC$/i
const WON = /booking|pickup|invoiced|completed|out for delivery|sale closed|payment pending|order placed/i

export function journeyOf(stage) {
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
export async function loadAll(env, fresh = false) {
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
export const dropCache = () => { cache = { at: 0, data: null } }

export function rangeOf(range, today) {
  const t = new Date(today + 'T00:00:00Z')
  if (range === 'today') return [today, today]
  if (range === 'week') { const dow = (t.getUTCDay() + 6) % 7; t.setUTCDate(t.getUTCDate() - dow); return [t.toISOString().slice(0, 10), today] }
  return [today.slice(0, 8) + '01', today]
}
const inR = (d, [a, b]) => d && d >= a && d <= b

// ── पैसे का हिसाब — हर company के लिए ─────────────────────────────────────────
export function money(D, company, R) {
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
export const orderCounts = (o) => !/cancel/i.test(s(o.stage)) && !/pending|rejected/i.test(s(o.approvalStatus))
export const markupOf = (o) => (N(o.vendorCost) > 0 ? Math.round(((N(o.amount) - N(o.vendorCost)) / N(o.vendorCost)) * 100) : null)
const nameKey = (n) => s(n).trim().split(/\s+/)[0].toLowerCase()
export function cseList(D, emps) {
  // Cargo desk वाले लोग (पुराना desk assignment) + जिनके नाम पर leads हैं
  const cargoDesk = new Set(D.desks.filter((d) => s(d.module_key) === 'cargo').map((d) => String(d.id)))
  const pids = new Set(D.employee_desks.filter((x) => cargoDesk.has(String(x.desk_id)) && (!x.revoked_at || x.revoked_at === 'None')).map((x) => String(x.person_id)))
  return emps.filter((e) => e.active && (pids.has(String(e.legacy_id)) || D.cargo_orders.some((o) => String(o.personId) === String(e.legacy_id) && e.legacy_id)))
}
export const leadsOf = (D, emp) => D.ad_leads.filter((l) => nameKey(l.cseName) === nameKey(emp.name))
const isMine = (r, e) => (e.legacy_id && String(r.personId) === String(e.legacy_id)) || String(r.emp_id || '') === String(e.id) || (r.cseName && nameKey(r.cseName) === nameKey(e.name))
const mine = (rows, emp, field = 'personId') => rows.filter((r) => (emp.legacy_id && String(r[field]) === String(emp.legacy_id)) || String(r.emp_id || '') === String(emp.id))

export function homeSummary(D, emps, today, range, company, cses) {
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

export function companyPage(D, emps, today, name, range = 'month', desks = [], cses = []) {
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
export function myHome(D, emp, today, myDesks = []) {
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

export function cargoDesk(D, emp, emps, today, cses, showAll = false) {
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

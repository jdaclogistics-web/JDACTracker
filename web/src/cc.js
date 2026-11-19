// Boss / Developer: Command Centre home, company page, Tasks, Chat
import { get, post } from '@shared/api.js'
import { esc, ic, fmtDate, fmtTime, toast, initials, avColor, istDate } from '@shared/util.js'

const inr = (n) => (n ? '₹' + Math.round(n).toLocaleString('en-IN') : '₹ —')
const num = (n) => (n ? Number(n).toLocaleString('en-IN') : '—')
const CO = {
  'JDAC Logistics': { icon: 'truck', grad: 'linear-gradient(120deg,#F43F5E,#DC2626)', sub: 'lead journey, bookings & vendors' },
  'Jupiter Equipment': { icon: 'box', grad: 'linear-gradient(120deg,#2563EB,#1D4ED8)', sub: 'equipment orders, delivery, rentals & vendors' },
  GovaaBazaar: { icon: 'store', grad: 'linear-gradient(120deg,#F97316,#EA580C)', sub: 'FMCG orders, stock, purchases & sales' },
  'JDAC Studios': { icon: 'mega', grad: 'linear-gradient(120deg,#6366F1,#4338CA)', sub: 'websites, social media & performance marketing' },
}
export const ccState = { range: 'month', company: 'All' }

// ── Home: 8 blocks ───────────────────────────────────────────────────────
export async function viewCC(v, go, todayP) {
  v.innerHTML = '<div class="skel"></div><div class="skel"></div><div class="skel"></div>'
  try {
    const [h, t, lv, al] = await Promise.all([get(`/api/cc/home?range=${ccState.range}&company=${encodeURIComponent(ccState.company)}`), todayP, get('/api/admin/leaves?status=Pending'), get('/api/admin/alerts')])
    const g = h.group, s = t.summary
    const notIn = s.absent
    v.innerHTML = `
    <div class="cc-top"><b>JDAC SALES PVT LTD</b><span>${fmtDate(istDate(), { weekday: 'short', day: 'numeric', month: 'short' })}</span><span class="sp"></span>
      <select class="cc-sw" id="cosw"><option value="All">All companies</option>${h.companies.map((c) => `<option ${ccState.company === c.name ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>
    <section class="card cc-money">
      <div class="row"><b class="cc-t">${ccState.company === 'All' ? 'Group' : esc(ccState.company)} · this ${ccState.range === 'today' ? 'day' : ccState.range}</b><span class="sp"></span>
        <div class="cc-seg">${['today', 'week', 'month'].map((r) => `<button data-r="${r}" class="${ccState.range === r ? 'on' : ''}">${r[0].toUpperCase() + r.slice(1)}</button>`).join('')}</div></div>
      <div class="cc-4"><div><b>${inr(g.booked)}</b><span>Booked</span></div><div><b>${inr(g.collected)}</b><span>Collected</span></div><div><b>${inr(g.costs)}</b><span>Costs</span></div><div><b class="${g.profit < 0 ? 'neg' : ''}">${inr(g.profit)}</b><span>Profit</span></div></div>
      <div class="cc-2"><div><span>To collect</span><b>${inr(g.to_collect)}</b></div><div><span>To pay vendors</span><b>${inr(g.to_pay)}</b></div></div>
    </section>
    <section class="card"><div class="row"><h2 class="h3">Waiting on you</h2><span class="sp"></span><span class="sub">tap to act</span></div>
      <div class="cc-wait">
        <button data-go="company" data-co="JDAC Logistics"><span>Orders below 40% markup${h.waiting.low_markup ? ` · <b>${h.waiting.low_markup}</b>` : ''}</span><i class="pill r">approve</i></button>
        <button data-go="old" data-tbl="expense_claims"><span>Expense claims${h.waiting.claims ? ` · <b>${h.waiting.claims}</b> · ${inr(h.waiting.claims_amount)}` : ''}</span><i class="pill o">review</i></button>
        <button disabled><span>Weight-difference payments</span><i class="pill o">from Om</i></button>
        <button data-go="old" data-tbl="invoices"><span>Invoices unpaid 30+ days${h.waiting.unpaid_30 ? ` · <b>${h.waiting.unpaid_30}</b> · ${inr(h.waiting.unpaid_30_amount)}` : ''}</span><i class="pill r">follow up</i></button>
        ${lv.leaves.length ? `<button data-go="leaves"><span>Leave requests · <b>${lv.leaves.length}</b></span><i class="pill p">approve</i></button>` : ''}
        ${al.alerts.map((a) => `<button data-go="live"><span><b>${esc(a.name)}</b> — ${a.kind === 'auto_logout' ? '24 घंटे पूरे, auto logout हुआ' : 'no GPS signal'}</span><i class="pill ${a.kind === 'auto_logout' ? 'r' : 'o'}">${a.kind === 'auto_logout' ? 'logout' : 'check'}</i></button>`).join('')}
      </div></section>
    <section class="card"><div class="row"><h2 class="h3">Companies</h2><span class="sp"></span><span class="sub">this ${ccState.range === 'today' ? 'day' : ccState.range}</span></div>
      <table class="cc-tbl"><thead><tr><th>Company</th><th class="r">Booked</th><th class="r">Profit</th><th class="r">Markup</th></tr></thead><tbody>
      ${h.companies.map((c) => `<tr data-go="company" data-co="${esc(c.name)}"><td><b>${esc(c.name)}</b></td><td class="r">${inr(c.booked)}</td><td class="r ${c.profit < 0 ? 'neg' : ''}">${inr(c.profit)}</td>
        <td class="r">${c.name === 'JDAC Logistics' ? `<span class="pill ${c.markup != null && c.markup >= 40 ? 'g' : 'r'}">${c.markup == null ? '—' : c.markup}%</span>` : '—'}</td></tr>`).join('')}</tbody></table></section>
    <section class="card"><div class="row"><h2 class="h3">Logistics sales ${ccState.range === 'today' ? 'today' : 'this ' + ccState.range}</h2><span class="sp"></span><span class="sub">CSEs</span></div>
      <table class="cc-tbl"><thead><tr><th>CSE</th><th class="r">Calls</th><th class="r">Quotes</th><th class="r">Orders</th><th class="r">Markup</th></tr></thead><tbody>
      ${h.sales.map((c) => `<tr data-go="desk" data-emp="${c.emp_id}"><td><b>${esc(c.name)}</b></td><td class="r">${num(c.calls)}</td><td class="r">${num(c.quotes)}</td><td class="r">${num(c.orders)}</td><td class="r">${c.markup == null ? '—' : c.markup + '%'}</td></tr>`).join('') || '<tr><td colspan="5" class="empty">No CSE desk assigned</td></tr>'}</tbody></table>
      <div class="sub" style="margin-top:6px">Tap a name to open their desk (view as)</div></section>
    <section class="card"><div class="row"><h2 class="h3">Logistics ops ${ccState.range === 'today' ? 'today' : ''}</h2><span class="sp"></span><span class="sub">Om</span></div>
      <div class="cc-chips"><span class="pill b">Pickup due ${num(h.ops.pickup)}</span><span class="pill o">In transit ${num(h.ops.transit)}</span><span class="pill g">Delivered ${num(h.ops.delivered)}</span></div>
      <div class="sub" style="margin-top:6px">Fills in fully when Om's Ops panel is built</div></section>
    <section class="card" data-go="people" style="cursor:pointer"><div class="row"><h2 class="h3">People today</h2><span class="sp"></span><span class="sub">all companies · ${s.total}</span></div>
      <div class="cc-chips"><span class="pill g">In ${s.in - s.late}</span><span class="pill o">Late ${s.late}</span><span class="pill r">Not in ${notIn}</span><span class="pill b">Leave ${s.leave}</span></div></section>
    <section class="card" data-go="company" data-co="JDAC Studios" style="cursor:pointer"><div class="row"><h2 class="h3">Leads & ads ${ccState.range === 'today' ? 'today' : 'this ' + ccState.range}</h2><span class="sp"></span><span class="sub">from JDAC Studios</span></div>
      <div class="cc-3"><span>Spend <b>${inr(h.ads.spend)}</b></span><span>Leads <b>${num(h.ads.leads)}</b></span><span>Cost/lead <b>${h.ads.cpl ? inr(h.ads.cpl) : '₹ —'}</b></span></div></section>
    <section class="card"><h2 class="h3">Tools</h2>
      <div class="cc-tools">
        ${[['biz', 'Accounts', 'chart', 'live money & Vittiya'], ['old:desks', 'Desks', 'grid', 'employee interfaces'], ['old:cse_targets', 'Targets', 'check', 'targets & incentives'], ['people', 'Attendance', 'cal', 'present & leave'],
          ['live', 'Live tracking', 'pin', 'map & field status'], ['old:daily_reports', 'Daily reports', 'download', 'end-of-day updates'], ['report', 'Insights', 'chart', 'trends & performance'], ['staff', 'Settings', 'lock', 'staff & logins'], ['old:hr_invoices', 'SalaryMitra', 'users', 'HR billing']]
          .map(([k, l, i, sub]) => `<button data-tool="${k}"><span class="tic">${ic(i, 18)}</span><b>${l}</b><span>${sub}</span></button>`).join('')}
      </div></section>`
    v.querySelector('#cosw').onchange = (e) => { ccState.company = e.target.value; viewCC(v, go, get('/api/admin/today')) }
    v.querySelectorAll('[data-r]').forEach((b) => (b.onclick = () => { ccState.range = b.dataset.r; viewCC(v, go, get('/api/admin/today')) }))
    v.querySelectorAll('[data-go]').forEach((b) => (b.onclick = (e) => { e.stopPropagation(); go(b.dataset.go, b.dataset.co || b.dataset.tbl || b.dataset.emp) }))
    v.querySelectorAll('[data-tool]').forEach((b) => (b.onclick = () => { const [t, tbl] = b.dataset.tool.split(':'); go(t, tbl) }))
  } catch (e) { v.innerHTML = `<div class="err">${esc(e.message)}</div>` }
}

// ── Company page: See / Sell / Buy / Spend / Work ───────────────────────────
let coStep = 'see'
export async function viewCompany(v, go, name) {
  v.innerHTML = '<div class="skel"></div><div class="skel"></div>'
  try {
    const c = await get('/api/cc/company?name=' + encodeURIComponent(name))
    const meta = CO[name] || { icon: 'grid', grad: '#0B1220', sub: '' }
    const m = c.money
    const list = (rows, empty) => rows.length ? `<div class="list">${rows.slice(0, 200).map((r) => `<div class="li"><div class="nm"><b>${esc(r.title)}</b><span>${fmtDate(r.date) || '—'}${r.who ? ' · ' + esc(r.who) : ''}</span></div><div class="rc"><b>${inr(r.amount)}</b>${r.status ? `<span class="pill n">${esc(r.status)}</span>` : ''}</div></div>`).join('')}</div>` : `<div class="empty">${empty}</div>`
    const steps = [['see', 'See', 'dashboard'], ['sell', 'Sell', 'orders'], ['buy', 'Buy', 'suppliers'], ['spend', 'Spend', 'expenses'], ['work', 'Work', 'team']]
    const body = {
      see: `<div class="cc-kpis">${c.kpis.map(([l, val, k]) => `<div class="card"><span class="lbl">${esc(l)}</span><b>${k === 'money' ? inr(val) : num(val)}</b></div>`).join('')}</div>
        <section class="card"><h2 class="h3">What do you want to do?</h2><div class="cc-todo">
          <button data-step="sell"><b>Money in</b><span>${inr(m.money_in)} this month · ${c.sell.length} records</span></button>
          <button data-step="buy"><b>Buy</b><span>${inr(m.purchases)} this month</span></button>
          <button data-step="spend"><b>Spend</b><span>${inr(m.expenses)} this month</span></button>
          <button data-step="work"><b>Work</b><span>${c.team.length} people · ${c.desks.length} desks</span></button></div></section>`,
      sell: `<section class="card"><h2 class="h3">Orders & sales</h2>${list(c.sell, 'No sales yet')}</section>`,
      buy: `<section class="card"><h2 class="h3">Purchases & suppliers</h2>${list(c.buy, 'No purchases recorded')}</section>`,
      spend: `<section class="card"><h2 class="h3">Expenses</h2>${list(c.spend, 'No expenses recorded')}</section>`,
      work: `<section class="card"><h2 class="h3">Desks</h2><div class="list">${c.desks.map((d) => `<div class="li"><span class="tic" style="background:#F1F5F9">${esc(d.icon || '•')}</span><div class="nm"><b>${esc(d.name)}</b><span>${esc(d.description)}</span></div></div>`).join('') || '<div class="empty">No desks</div>'}</div></section>
        <section class="card"><h2 class="h3">Team</h2><div class="list">${c.team.map((p) => `<button class="li" data-desk="${p.id}"><div class="av" style="background:${avColor(p.id)}1A;color:${avColor(p.id)}">${esc(initials(p.name))}</div><div class="nm"><b>${esc(p.name)}</b><span>${esc(p.designation || '')} · ${p.open_tasks} open tasks</span></div>${ic('chev', 18, '#9AA4B5')}</button>`).join('') || '<div class="empty">No one assigned</div>'}</div></section>`,
    }
    v.innerHTML = `<button class="link" id="back" style="font-size:15px;color:#3A4558">← Back — ${esc(name)}</button>
      <section class="cc-co" style="background:${meta.grad}"><div class="row"><span class="cc-coi">${ic(meta.icon, 22, '#fff')}</span><div><b>${esc(name)}</b><span>${esc(meta.sub)}</span></div></div>
        <div class="cc-4 w"><div><b>${inr(m.money_in)}</b><span>Money in</span></div><div><b>${inr(m.purchases)}</b><span>Purchases</span></div><div><b>${inr(m.expenses)}</b><span>Expenses</span></div><div><b>${inr(m.net)}</b><span>Net</span></div></div></section>
      <div class="cc-steps">${steps.map(([k, l, sub], i) => `<button data-step="${k}" class="${coStep === k ? 'on' : ''}"><i>${i + 1}</i><b>${l}</b><span>${sub}</span></button>`).join('')}</div>
      ${body[coStep]}`
    v.querySelector('#back').onclick = () => { coStep = 'see'; go('home') }
    v.querySelectorAll('[data-step]').forEach((b) => (b.onclick = () => { coStep = b.dataset.step; viewCompany(v, go, name) }))
    v.querySelectorAll('[data-desk]').forEach((b) => (b.onclick = () => go('desk', b.dataset.desk)))
  } catch (e) { v.innerHTML = `<div class="err">${esc(e.message)}</div>` }
}

// ── CSE desk (view as) ──────────────────────────────────────────────────────
export async function viewDesk(v, go, empId) {
  v.innerHTML = '<div class="skel"></div><div class="skel"></div>'
  try {
    const d = await get('/api/my/cargo?as=' + empId)
    v.innerHTML = `<button class="link" id="back" style="font-size:15px;color:#3A4558">← Back</button>
    <section class="card"><div class="row"><h2 class="h3">${esc(d.for)} — Cargo Sales desk</h2><span class="sp"></span><span class="pill n">view as</span></div>
      <div class="tiles" style="margin-top:10px"><div class="tile"><b>${d.counts.new}</b><span>New leads</span></div><div class="tile"><b>${d.counts.followups}</b><span>Follow-ups</span></div><div class="tile"><b>${d.counts.quotes}</b><span>Quotes</span></div><div class="tile"><b>${d.counts.orders_today}</b><span>Orders today</span></div></div>
      <div class="tiles t3" style="margin-top:8px">${[['Today', d.today], ['Yesterday', d.yesterday], ['7 days', d.last7]].map(([l, x]) => `<div class="tile"><b>${x.orders} · ${inr(x.amount)}</b><span>${l} · ${x.calls} calls</span></div>`).join('')}</div>
      <div class="sub" style="margin-top:8px">🎯 ${d.pipeline} in pipeline · ✨ ${d.new_today} new today · 💰 ${inr(d.month_amount)} this month</div></section>
    <section class="card"><h2 class="h3">Lead journey</h2><div class="tiles t3" style="margin-top:8px">${Object.entries(d.journey).map(([k, n]) => `<div class="tile"><b>${n}</b><span>${k}</span></div>`).join('')}</div></section>
    <section class="card"><h2 class="h3">Do now (${d.do_now_total})</h2><div class="list">${d.do_now.map((l) => `<div class="li"><div class="nm"><b>${esc(l.phone || l.name || '(no name)')}</b><span>${esc(l.name)} · ${esc(l.stage || 'New lead')} · waiting ${l.wait_h}h</span></div></div>`).join('')}</div></section>
    <section class="card"><h2 class="h3">Orders</h2><div class="list">${d.orders.map((o) => `<div class="li"><div class="nm"><b>${esc(o.customer)}</b><span>${fmtDate(o.date)} · ${esc(o.mode)} · ${o.kg} kg</span></div><div class="rc"><b>${inr(o.amount)}</b><span class="pill n">${esc(o.stage)}</span></div></div>`).join('') || '<div class="empty">No orders</div>'}</div></section>`
    v.querySelector('#back').onclick = () => go('home')
  } catch (e) { v.innerHTML = `<div class="err">${esc(e.message)}</div>` }
}

// ── Tasks ─────────────────────────────────────────────────────────────────
let taskFilter = 'open'
export async function viewTasks(v) {
  v.innerHTML = '<div class="skel"></div><div class="skel"></div>'
  try {
    const all = async (tbl) => { const out = []; for (let o = 0; ; o += 1000) { const r = await get(`/api/legacy/rows?tbl=${tbl}&limit=1000&offset=${o}`); out.push(...r.rows); if (out.length >= r.total) return out } }
    const [tasks, emps] = await Promise.all([all('tasks'), get('/api/admin/employees').catch(() => ({ employees: [] }))])
    const byLeg = new Map((emps.employees || []).filter((e) => e.legacy_id).map((e) => [String(e.legacy_id), e.name]))
    const isDone = (t) => /done|closed|complete/i.test(String(t.status))
    const today = istDate()
    const rows = tasks.filter((t) => taskFilter === 'all' || (taskFilter === 'open' ? !isDone(t) : taskFilter === 'overdue' ? !isDone(t) && t.due && String(t.due).slice(0, 10) < today : isDone(t)))
      .sort((a, b) => String(a.due || '9').localeCompare(String(b.due || '9')))
    v.innerHTML = `<section class="card"><div class="row"><h2 class="h3">Tasks</h2><span class="sp"></span><span class="sub">${tasks.filter((t) => !isDone(t)).length} open</span></div>
      <div class="chips" style="margin-top:8px">${['open', 'overdue', 'done', 'all'].map((f) => `<button class="chip ${taskFilter === f ? 'on' : ''}" data-f="${f}">${f[0].toUpperCase() + f.slice(1)}</button>`).join('')}</div>
      <div class="list" style="margin-top:6px">${rows.map((t) => `<div class="li"><button class="ck ${isDone(t) ? 'on' : ''}" data-done="${esc(t._rid)}" data-v="${isDone(t) ? 0 : 1}" aria-label="Done">${isDone(t) ? '✓' : ''}</button>
        <div class="nm"><b style="${isDone(t) ? 'text-decoration:line-through;color:#94A3B8' : ''}">${esc(t.title)}</b><span>${esc(byLeg.get(String(t.assigneeId)) || '—')} · ${t.due ? 'due ' + fmtDate(String(t.due).slice(0, 10)) : 'no due date'}${t.priority ? ' · ' + esc(t.priority) : ''}</span></div>
        ${!isDone(t) && t.due && String(t.due).slice(0, 10) < today ? '<span class="pill r">overdue</span>' : ''}</div>`).join('') || '<div class="empty">No tasks</div>'}</div></section>`
    v.querySelectorAll('[data-f]').forEach((b) => (b.onclick = () => { taskFilter = b.dataset.f; viewTasks(v) }))
    v.querySelectorAll('[data-done]').forEach((b) => (b.onclick = async () => { try { await post('/api/my/task-done', { id: b.dataset.done, done: b.dataset.v === '1' }); viewTasks(v) } catch (e) { toast(e.message, true) } }))
  } catch (e) { v.innerHTML = `<div class="err">${esc(e.message)}</div>` }
}

// ── Chat ─────────────────────────────────────────────────────────────────
let chatProject = ''
export async function viewChat(v) {
  v.innerHTML = '<div class="skel"></div>'
  try {
    const c = await get('/api/cc/chat')
    const msgs = c.messages.filter((m) => !chatProject || m.projectId === chatProject).slice().reverse()
    v.innerHTML = `<section class="card cc-chat"><div class="row"><h2 class="h3">Chat</h2><span class="sp"></span>
      <select class="inp" id="cp" style="width:auto;padding:8px"><option value="">All groups</option>${c.projects.map((p) => `<option value="${p.id}" ${chatProject === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></div>
      <div class="cc-msgs" id="msgs">${msgs.map((m) => `<div class="cc-msg ${m.sender === c.me ? 'me' : ''}"><span>${esc(m.sender)} · ${esc(m.project)} · ${esc(String(m.at).slice(0, 16))}</span><p>${esc(m.body)}</p></div>`).join('') || '<div class="empty">No messages</div>'}</div>
      <form id="cf" class="row" style="margin-top:10px"><input class="inp" id="cm" placeholder="Message…" autocomplete="off"><button class="btn pri sm">Send</button></form></section>`
    const box = v.querySelector('#msgs'); box.scrollTop = box.scrollHeight
    v.querySelector('#cp').onchange = (e) => { chatProject = e.target.value; viewChat(v) }
    v.querySelector('#cf').onsubmit = async (e) => { e.preventDefault(); const t = v.querySelector('#cm').value.trim(); if (!t) return; try { await post('/api/cc/chat', { body: t, projectId: chatProject || null }); viewChat(v) } catch (er) { toast(er.message, true) } }
  } catch (e) { v.innerHTML = `<div class="err">${esc(e.message)}</div>` }
}

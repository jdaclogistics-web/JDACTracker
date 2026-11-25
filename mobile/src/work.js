// Employee: home blocks (progress, work in order, desks, up next, projects), Tasks, Chat, Cargo Sales desk
import { get, post, patch } from '@shared/api.js'
import { esc, ic, toast, fmtDate, istDate } from '@shared/util.js'

const inr = (n) => '₹' + Math.round(n || 0).toLocaleString('en-IN')
export let myHomeData = null
export async function loadMyHome() { try { myHomeData = await get('/api/my/home') } catch { /* offline */ } return myHomeData }

function sheet(html, onReady) {
  const el = document.createElement('div')
  el.className = 'msheet'
  el.innerHTML = `<div class="msheet-bg"></div><div class="msheet-c">${html}</div>`
  document.body.appendChild(el)
  const close = () => el.remove()
  el.querySelector('.msheet-bg').onclick = close
  el.querySelectorAll('[data-close]').forEach((b) => (b.onclick = close))
  onReady?.(el, close)
  return close
}

// ── Home blocks (Start day card main.js में रहता है) ─────────────────────────
export function homeBlocks(h, session, go) {
  if (!h) return '<div class="skel"></div>'
  const total = h.tasks_total, done = h.tasks_done
  const pct = total ? Math.round((done / total) * 100) : (session && session.end_at ? 100 : session ? 50 : 0)
  const km = session ? (session.total_km || 0).toFixed(1) : '0'
  const quotes = ['Your future self is watching.', 'Small steps, every day.', 'Finish what you start.', 'Your pipeline is your paycheck — work it.']
  const q = quotes[new Date().getDate() % quotes.length]
  return `
  <section class="card wk-hero"><div class="row"><span class="wk-av">${esc((h.name || '?')[0])}</span><div class="nm"><b>${greet()}, ${esc((h.name || '').split(' ')[0])} 👋</b><span>${esc(h.designation || 'JDAC')} · “${q}”</span></div>
      <span class="pill ${session ? (session.end_at ? 'b' : 'g') : 'n'}">${session ? (session.end_at ? '✅ Closed' : '● Open') : 'Not started'}</span></div>
    <div class="wk-prog"><span>🏆 ${pct}%</span><i><em style="width:${pct}%"></em></i><span>${pct >= 100 ? 'champion day! 🏆' : pct >= 50 ? 'keep going' : 'let’s start'}</span></div>
    <div class="tiles t3"><div class="tile hd"><b>${h.entries}</b><span>entries</span></div><div class="tile hd"><b>${km}</b><span>km</span></div><div class="tile hd"><b>${h.overdue}</b><span>overdue</span></div></div></section>
  <section class="card"><h2 class="h3">Your work, in order</h2><div class="sub">Start the day, finish tasks, fill your section, then submit.</div>
    <div class="wk-steps">
      <button data-go="start"><span>▶️</span><b>1. Start day</b></button><button data-go="tasks"><span>📋</span><b>2. Tasks</b></button>
      <button data-go="desks"><span>🗂️</span><b>3. Sections</b></button><button data-go="month"><span>📅</span><b>4. Calendar</b></button></div></section>
  <div id="punchslot"></div>
  <section class="card" id="desks"><div class="wk-dh"><h2 class="h3">Desks</h2><div class="sub">Only the work your boss gave you appears here.</div></div>
    <div class="list">${h.desks.map((d) => `<button class="li" data-desk="${esc(d.module)}" data-name="${esc(d.name)}" data-id="${esc(d.id)}"><span class="wk-di">${esc(d.icon || '🗂️')}</span><div class="nm"><b>${esc(d.name)}</b><span>${esc(d.description)}</span></div><span class="pill n">OPEN</span></button>`).join('') || '<div class="empty">No desk assigned yet</div>'}</div></section>
  <section class="card"><div class="row"><h2 class="h3">⏭️ Up next for you</h2><span class="sp"></span><button class="link" data-go="tasks">all tasks →</button></div>
    <div class="list">${h.up_next.slice(0, 5).map(taskRow).join('') || '<div class="empty">Nothing pending — enjoy the clear day ✨</div>'}</div></section>
  <section class="card"><div class="row"><h2 class="h3">My projects</h2><span class="sp"></span><span class="sub">${h.projects.length}</span></div>
    <div class="list">${h.projects.map((p) => `<button class="li" data-go="chat" data-project="${esc(p.id)}"><span class="wk-di" style="background:#FEF3C7">📁</span><div class="nm"><b>${esc(p.name)}</b><span>${p.open} open tasks · ${p.members} members</span></div>${ic('chev', 18, '#9AA4B5')}</button>`).join('') || '<div class="empty">No projects</div>'}</div></section>`
}
function greet() { const hr = Number(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: false })); return hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening' }
const taskRow = (t) => `<div class="li"><button class="ck" data-task="${esc(t.id)}" aria-label="Mark done"></button><div class="nm"><b>${esc(t.title)}</b><span>${t.due ? (t.due < istDate() ? '<b style="color:#B91C1C;display:inline">overdue</b> · ' : '') + 'due ' + fmtDate(t.due) : 'no due date'}${t.priority ? ' · ' + esc(t.priority) : ''}${t.checklist.length ? ` · ${t.checklist.filter((c) => c.done).length}/${t.checklist.length} steps` : ''}</span></div></div>`

export function bindHome(v, go) {
  v.querySelectorAll('[data-go]').forEach((b) => (b.onclick = () => go(b.dataset.go, b.dataset.project)))
  v.querySelectorAll('[data-desk]').forEach((b) => (b.onclick = () => go('desk', b.dataset.desk, b.dataset.name, b.dataset.id)))
  bindTaskChecks(v, () => go('home'))
}
function bindTaskChecks(v, after) {
  v.querySelectorAll('[data-task]').forEach((b) => (b.onclick = async () => {
    b.classList.add('on'); b.textContent = '✓'
    try { await post('/api/my/task-done', { id: b.dataset.task, done: true }); toast('Task done ✓'); await loadMyHome(); after() } catch (e) { toast(e.message, 'bad'); b.classList.remove('on'); b.textContent = '' }
  }))
}

// ── Tasks ─────────────────────────────────────────────────────────────────
let TK_TAB = 'boss'
export async function renderTasks(v, go) {
  v.innerHTML = `<div id="tkb" class="stack"><div class="skel"></div></div>`
  const B = v.querySelector('#tkb')
  const h = await loadMyHome()
  if (!h) { B.innerHTML = '<div class="err">No internet</div>'; return }
  const all = h.up_next || [], boss = all.filter((t) => t.src === 'boss'), self = all.filter((t) => t.src === 'self'), team = [...all.filter((t) => t.src === 'team'), ...(h.team_tasks || [])]
  const tabs = [['boss', '👔 Boss given', boss.length], ['self', '🙋 My tasks', self.length], ['team', '👥 Team', team.length]]
  const extra = (t) => (t.notes || t.checklist.length ? `<div class="wk-tn">${t.notes ? esc(t.notes) : ''}${t.checklist.map((c) => `<div>${c.done ? '☑' : '☐'} ${esc(c.title)}</div>`).join('')}</div>` : '')
  const tag = (t) => (t.src === 'team' && t.by ? `<div class="wk-tn">From ${esc(t.by)}</div>` : t.assignee ? `<div class="wk-tn">${t.mine_given ? 'You gave to' : 'For'} <b>${esc(t.assignee)}</b>${!t.mine_given && t.by ? ' · by ' + esc(t.by) : ''}</div>` : '')
  const list = TK_TAB === 'boss' ? boss : TK_TAB === 'self' ? self : team
  const add = TK_TAB === 'self' ? '＋ Add my task' : TK_TAB === 'team' ? '＋ Give task to teammate' : ''
  const empty = TK_TAB === 'boss' ? 'No task from Boss / HR right now ✨' : TK_TAB === 'self' ? 'Add what you plan to do today' : (h.team || []).length ? 'No team tasks — give one to a teammate' : 'No teammates found in your department'
  B.innerHTML = `<div class="tk-tabs" role="tablist">${tabs.map(([k, l, n]) => `<button role="tab" aria-selected="${TK_TAB === k}" class="${TK_TAB === k ? 'on' : ''}" data-tk="${k}">${l}<em>${n}</em></button>`).join('')}</div>
    ${add ? `<button class="wk-new" id="addtask" style="border:0;border-radius:16px;padding:14px;font-weight:800;font-size:15px;color:#fff">${add}</button>` : ''}
    <section class="card"><div class="row"><h2 class="h3">${tabs.find((x) => x[0] === TK_TAB)[1]}</h2><span class="sp"></span><span class="sub">${list.length} open${TK_TAB === 'boss' ? ' · ' + h.tasks_done + ' done today' : ''}</span></div>
    <div class="list">${list.map((t) => taskRow(t) + tag(t) + extra(t)).join('') || `<div class="empty">${empty}</div>`}</div></section>`
  if (!document.getElementById('tkcss')) { const st = document.createElement('style'); st.id = 'tkcss'; st.textContent = '.tk-tabs{display:flex;gap:6px;background:#EEF1F6;border-radius:14px;padding:4px}.tk-tabs button{flex:1;border:0;background:none;border-radius:11px;padding:9px 4px;font:700 13px system-ui;color:#475569;display:flex;flex-direction:column;align-items:center;gap:2px}.tk-tabs button.on{background:#fff;color:#0F172A;box-shadow:0 1px 4px rgba(0,0,0,.08)}.tk-tabs em{font-style:normal;font-size:11px;color:#64748B}'; document.head.appendChild(st) }
  B.querySelectorAll('[data-tk]').forEach((b) => (b.onclick = () => { TK_TAB = b.dataset.tk; renderTasks(v, go) }))
  bindTaskChecks(B, () => renderTasks(v, go))
  const ab = B.querySelector('#addtask'); if (!ab) return
  const forTeam = TK_TAB === 'team'
  if (forTeam && !(h.team || []).length) { ab.onclick = () => toast('No teammates in your department yet', 'bad'); return }
  ab.onclick = () => sheet(`<div class="row"><h2 class="h3">${forTeam ? 'Give a task to a teammate' : 'New task'}</h2><span class="sp"></span><button class="link" data-close>Close</button></div>
    <form id="tf" class="stack" style="margin-top:10px">${forTeam ? `<label class="f">Teammate<select class="inp" id="ta" required>${h.team.map((m) => `<option value="${m.id}">${esc(m.name)}${m.designation ? ' · ' + esc(m.designation) : ''}</option>`).join('')}</select></label>` : ''}
    <label class="f">What needs to be done?<input class="inp" id="tt" required maxlength="120" placeholder="${forTeam ? 'e.g. Call 10 new leads' : 'e.g. Reels for Bahiram, visit 5 shops'}"></label>
    <label class="f">Due date<input class="inp" type="date" id="td" value="${istDate()}" min="${istDate()}"></label>
    ${h.projects.length ? `<label class="f">Project<select class="inp" id="tp"><option value="">—</option>${h.projects.map((p) => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('')}</select></label>` : ''}
    <label class="f">Priority<select class="inp" id="tpr"><option>Normal</option><option>High</option><option>Low</option></select></label>
    <label class="f">Notes (optional)<input class="inp" id="tn" maxlength="300"></label><button class="btn pri">${forTeam ? 'Give task' : 'Add task'}</button></form>`, (el, close) => {
    el.querySelector('#tf').onsubmit = async (e) => { e.preventDefault()
      try { await post('/api/my/task', { title: el.querySelector('#tt').value, due: el.querySelector('#td').value, project_id: el.querySelector('#tp')?.value || '', priority: el.querySelector('#tpr').value, notes: el.querySelector('#tn').value, ...(forTeam ? { assignee_emp: Number(el.querySelector('#ta').value) } : {}) }); close(); toast(forTeam ? 'Task given ✓' : 'Task added ✓'); renderTasks(v, go) } catch (er) { toast(er.message, 'bad') } }
  })
}

// ── Chat ──
import { renderChatUI, injectChatCss } from '@shared/chat.js'
import { renderOrders, renderPunch as punchCard } from '@shared/orders.js'
export function renderChat(v, project = '') { injectChatCss(); return renderChatUI(v, project ? { group: project } : {}) }

// ── Desks ─────────────────────────────────────────────────────────────────
export async function renderDesk(v, go, module, name, deskId) {
  if (!module) return renderDeskList(v, go)
  if (module === 'bookings') return renderBookings(v, go)
  if (module === 'simple') return renderSimple(v, go, deskId, name)
  if (module === 'punch') return renderPunch(v, go)
  if (module !== 'cargo') {
    v.innerHTML = `<button class="link wk-back" id="back">← Home</button><section class="card"><h2 class="h3">${esc(name || module)}</h2><p class="sub">${module === 'ops-later' ? 'Ops desk (pickup to delivery) will come with Om’s panel.' : 'This desk opens in the admin panel for now. Coming to the app soon.'}</p></section>`
    v.querySelector('#back').onclick = () => go('home'); return
  }
  v.innerHTML = '<div class="skel"></div><div class="skel"></div>'
  let d
  try { d = await get('/api/my/cargo') } catch (e) { v.innerHTML = `<div class="err">${esc(e.message)}</div>`; return }
  const rankMe = (d.leaderboard.find((x) => x.name === d.for) || {}).rank || 0
  v.innerHTML = `
  <button class="link wk-back" id="back">← Back</button>
  <section class="card"><div class="row"><div class="nm"><b style="font-size:18px">${greet()}, ${esc(d.for.split(' ')[0])} 👋</b><span>Your pipeline is your paycheck — work it.</span></div>${rankMe ? `<span class="pill o">🏆 #${rankMe}</span>` : ''}</div>
    <div class="tiles" style="margin-top:12px"><div class="tile wb"><b>${d.counts.new}</b><span>New leads</span></div><div class="tile wb"><b>${d.counts.followups}</b><span>Follow-ups</span></div><div class="tile wb"><b>${d.counts.quotes}</b><span>Quotes</span></div><div class="tile wb"><b>${d.counts.orders_today}</b><span>Orders today</span></div></div></section>
  <section class="card"><div class="wk-3">
      <div class="r"><b>${d.today.orders} orders</b><big>${inr(d.today.amount)}</big><span>📞 ${d.today.calls} · TODAY</span></div>
      <div><b>${d.yesterday.orders} orders</b><big>${inr(d.yesterday.amount)}</big><span>📞 ${d.yesterday.calls} · YESTERDAY</span></div>
      <div class="g"><b>${d.last7.orders} orders</b><big>${inr(d.last7.amount)}</big><span>📞 ${d.last7.calls} · 7 DAYS</span></div></div>
    <div class="sub" style="text-align:center;margin-top:10px">🎯 ${d.pipeline} in pipeline · ✨ ${d.new_today} new today · 💰 ${inr(d.month_amount)} this month${d.target ? ` · target ${d.target.orders}/day (₹${d.target.incentive})` : ''}</div></section>
  <section class="card"><h2 class="h3">⚡ Do now (${d.do_now_total})</h2><div class="list">
    ${d.do_now.map((l) => `<div class="li wk-lead"><div class="nm"><b>${esc(l.phone || '(no number)')}</b><span>${l.name ? esc(l.name) + ' · ' : ''}${l.journey === 'New' ? '🆕 New lead' : esc(l.stage)} · waiting ${l.wait_h}h</span></div>
      ${l.phone ? `<a class="wk-call" href="tel:${esc(l.phone)}" aria-label="Call">${ic('phone', 18, '#fff')}</a>` : ''}<button class="wk-log" data-log="${esc(l.id)}" data-ph="${esc(l.phone)}" data-nm="${esc(l.name)}">Log</button></div>`).join('') || '<div class="empty">No calls pending 🎉</div>'}</div></section>
  <div class="wk-2b"><button class="wk-new" id="neworder">＋ New order</button><button class="wk-quote" id="newquote">${ic('doc', 18, '#fff')} Quotation</button></div>
  <section class="card"><h2 class="h3">My lead journey</h2><div class="wk-j">${Object.entries(d.journey).map(([k, n], i) => `<button data-j="${esc(k)}" class="j${i}"><b>${n}</b><span>${k === 'New' ? '🆕 New' : esc(k)}</span></button>`).join('')}</div>
    <div class="wk-j3"><button data-sub="orders">${ic('task', 18)}My orders</button><button data-sub="customers">${ic('users', 18)}Customers</button><button data-sub="perf">${ic('chart', 18)}Performance</button></div></section>
  <section class="card"><h2 class="h3">🏆 Team leaderboard — profit this month</h2><div class="list">${d.leaderboard.map((x) => `<div class="li"><b style="width:20px">${x.rank}</b><div class="nm"><b style="color:${x.name === d.for ? '#BE123C' : 'inherit'}">${esc(x.name)}${x.name === d.for ? ' (you)' : ''}</b></div><span class="sub">${x.orders} orders${x.profit != null ? ` · profit <b>${inr(x.profit)}</b>${x.avg_markup != null ? ' · ' + x.avg_markup + '%' : ''}` : ''}</span></div>`).join('')}</div></section>`
  v.querySelector('#back').onclick = () => go('home')
  const reload = () => renderDesk(v, go, module, name)
  v.querySelectorAll('[data-log]').forEach((b) => (b.onclick = () => logSheet(b.dataset.log, b.dataset.ph, b.dataset.nm, reload)))
  v.querySelector('#neworder').onclick = () => orderSheet(null, reload)
  v.querySelector('#newquote').onclick = () => quoteSheet(null, reload)
  v.querySelectorAll('[data-j]').forEach((b) => (b.onclick = () => listSheet(`${b.dataset.j} leads`, d.leads.filter((l) => l.journey === b.dataset.j).map((l) => [l.phone || l.name || '(no name)', `${l.name ? l.name + ' · ' : ''}${l.stage || 'New'}${l.next ? ' · next ' + fmtDate(l.next) : ''}`, '', l]), reload)))
  v.querySelectorAll('[data-sub]').forEach((b) => (b.onclick = () => {
    if (b.dataset.sub === 'orders') listSheet('My orders', d.orders.map((o) => [o.customer, `${fmtDate(o.date)} · ${o.mode} · ${o.kg} kg · ${/pending/i.test(o.approval) ? 'Pending approval' : /rejected/i.test(o.approval) ? 'Rejected' : o.stage}${o.markup != null ? ' · markup ' + o.markup + '%' : ''}`, inr(o.amount)]))
    if (b.dataset.sub === 'customers') listSheet('Customers', d.customers.map((c) => [c.name, `${c.phone} · ${c.orders} orders`, inr(c.amount)]))
    if (b.dataset.sub === 'perf') listSheet('Performance', [['Today', `${d.today.calls} calls · ${d.today.orders} orders`, inr(d.today.amount)], ['Yesterday', `${d.yesterday.calls} calls · ${d.yesterday.orders} orders`, inr(d.yesterday.amount)], ['Last 7 days', `${d.last7.calls} calls · ${d.last7.orders} orders`, inr(d.last7.amount)], ['This month', `rank #${rankMe || '—'} in team`, inr(d.month_amount)], ...(d.target ? [['Daily target', `${d.target.orders} orders`, `₹${d.target.incentive} incentive`]] : [])])
  }))
}

function listSheet(title, rows, reload) {
  sheet(`<div class="row"><h2 class="h3">${esc(title)}</h2><span class="sp"></span><button class="link" data-close>Close</button></div>
    <div class="list wk-sl">${rows.slice(0, 300).map(([a, b, c, lead], i) => `<div class="li"><div class="nm"><b>${esc(a)}</b><span>${esc(b)}</span></div>${c ? `<b>${esc(c)}</b>` : ''}${lead ? `${lead.phone ? `<a class="wk-call" href="tel:${esc(lead.phone)}">${ic('phone', 16, '#fff')}</a>` : ''}<button class="wk-log" data-i="${i}">Log</button>` : ''}</div>`).join('') || '<div class="empty">Nothing here</div>'}</div>`,
  (el, close) => el.querySelectorAll('[data-i]').forEach((b) => (b.onclick = () => { const l = rows[b.dataset.i][3]; close(); logSheet(l.id, l.phone, l.name, reload) })))
}

const STAGES = ['Contacted', 'Follow-up', 'Quotation Sent', 'Future Follow-Up', '⌛️ Awaiting Decision', 'Booking', 'NC', '❌ Not Interested', 'Irrelevant Leads']
function logSheet(id, phone, nm, reload) {
  sheet(`<div class="row"><h2 class="h3">Log call · ${esc(phone || nm || '')}</h2><span class="sp"></span><button class="link" data-close>Close</button></div>
    <form id="lf" class="stack" style="margin-top:10px">
      <div class="chips wk-oc">${['Connected', 'Not picked', 'Busy', 'Switched off', 'Wrong number', 'Interested', 'Call back'].map((o, i) => `<button type="button" class="chip ${i === 0 ? 'on' : ''}" data-o="${o}">${o}</button>`).join('')}</div>
      <label class="f">Stage<select class="inp" id="ls"><option value="">— same —</option>${STAGES.map((s) => `<option>${s}</option>`).join('')}</select></label>
      <label class="f">Next follow-up<input class="inp" type="date" id="ln" min="${istDate()}"></label>
      <label class="f">Note<input class="inp" id="lt" placeholder="kya baat hui?"></label>
      <button class="btn pri">Save</button></form>`, (el, close) => {
    let outcome = 'Connected'
    el.querySelectorAll('[data-o]').forEach((b) => (b.onclick = () => { outcome = b.dataset.o; el.querySelectorAll('[data-o]').forEach((x) => x.classList.toggle('on', x === b)) }))
    el.querySelector('#lf').onsubmit = async (e) => {
      e.preventDefault()
      try { await post('/api/my/lead-log', { leadId: id, outcome, stage: el.querySelector('#ls').value, next: el.querySelector('#ln').value || null, note: el.querySelector('#lt').value }); toast('Call logged ✓'); close(); reload() } catch (er) { toast(er.message, 'bad') }
    }
  })
}
function orderSheet(lead, reload) {
  sheet(`<div class="row"><h2 class="h3">New order</h2><span class="sp"></span><button class="link" data-close>Close</button></div>
    <form id="of" class="wk-form">
      <label class="f">Customer name<input class="inp" id="oc" required></label><label class="f">Phone<input class="inp" id="op" inputmode="tel"></label>
      <label class="f">Mode<select class="inp" id="om"><option>Road Cargo</option><option>Air Cargo</option><option>Train Cargo</option><option>Courier</option><option>Part Truck</option></select></label>
      <label class="f">Weight (kg)<input class="inp" id="ok" type="number" step="0.1" min="0"></label>
      <label class="f">Amount ₹ (customer, incl. GST)<input class="inp" id="oa" type="number" min="1" required></label><label class="f">Vendor cost ₹ (incl. GST)<input class="inp" id="ov" type="number" min="1" required></label>
      <label class="f">Vendor<input class="inp" id="ovn"></label><label class="f">Pickup address<input class="inp" id="opa"></label>
      <label class="f wide">Notes<input class="inp" id="on"></label>
      <div class="sub wide" id="mk">Minimum price = vendor cost × 1.40 (40% markup)</div>
      <button class="btn pri wide" id="ob">Book order</button></form>`, (el, close) => {
    const mk = () => { const a = Number(el.querySelector('#oa').value), c = Number(el.querySelector('#ov').value), btn = el.querySelector('#ob')
      if (a && c) { const p = Math.round(((a - c) / c) * 100), min = Math.ceil(c * 1.4); el.querySelector('#mk').innerHTML = `Markup <b style="color:${a < min ? '#B91C1C' : '#047857'}">${p}%</b> · minimum price ₹${min.toLocaleString('en-IN')}`; btn.textContent = a < min ? 'Ask admin to approve' : 'Book order'; btn.className = 'btn wide ' + (a < min ? 'dng' : 'pri') } }
    el.querySelector('#oa').oninput = mk; el.querySelector('#ov').oninput = mk
    el.querySelector('#of').onsubmit = async (e) => {
      e.preventDefault(); const q = (s) => el.querySelector(s).value
      try { const r = await post('/api/my/cargo-order', { leadId: lead, customerName: q('#oc'), phone: q('#op'), mode: q('#om'), kg: q('#ok'), amount: q('#oa'), vendorCost: q('#ov'), vendorName: q('#ovn'), pickupAddress: q('#opa'), notes: q('#on') }); toast(r.pending ? 'Sent to admin for approval — will be added to Booked after approval' : 'Order booked ✓'); close(); reload() } catch (er) { toast(er.message, 'bad') }
    }
  })
}
function quoteSheet(lead, reload) {
  sheet(`<div class="row"><h2 class="h3">Quotation</h2><span class="sp"></span><button class="link" data-close>Close</button></div>
    <form id="qf" class="wk-form">
      <label class="f">Customer name<input class="inp" id="qc" required></label><label class="f">Phone<input class="inp" id="qp" inputmode="tel"></label>
      <label class="f">Pickup pincode<input class="inp" id="qa" inputmode="numeric" maxlength="6"></label><label class="f">Drop pincode<input class="inp" id="qb" inputmode="numeric" maxlength="6"></label>
      <label class="f">Actual kg<input class="inp" id="qk" type="number" step="0.1" min="0"></label><label class="f">Rate ₹/kg<input class="inp" id="qr" type="number" step="0.5" min="0" required></label>
      <label class="f">L (cm)<input class="inp" id="ql" type="number" min="0"></label><label class="f">B (cm)<input class="inp" id="qw" type="number" min="0"></label>
      <label class="f">H (cm)<input class="inp" id="qh" type="number" min="0"></label><div class="f wk-qt" id="qt">Total —</div>
      <button class="btn pri wide">Save quotation</button></form>`, (el, close) => {
    const q = (s) => Number(el.querySelector(s).value) || 0
    const calc = () => { const vol = Math.round((q('#ql') * q('#qw') * q('#qh') / 5000) * 100) / 100, ch = Math.max(q('#qk'), vol); el.querySelector('#qt').innerHTML = `Volumetric ${vol} kg · Chargeable <b>${ch} kg</b><br>Total <b style="font-size:18px">₹${Math.round(ch * q('#qr')).toLocaleString('en-IN')}</b>` }
    el.querySelectorAll('input').forEach((i) => (i.oninput = calc))
    el.querySelector('#qf').onsubmit = async (e) => {
      e.preventDefault(); const t = (s) => el.querySelector(s).value
      try { const r = await post('/api/my/cargo-quote', { leadId: lead, customerName: t('#qc'), phone: t('#qp'), pickupPincode: t('#qa'), dropPincode: t('#qb'), actualKg: t('#qk'), rate: t('#qr'), lengthCm: t('#ql'), breadthCm: t('#qw'), heightCm: t('#qh') }); toast(`Quotation saved — ₹${r.total}`); close(); reload() } catch (er) { toast(er.message, 'bad') }
    }
  })
}

// ── Desk list (Desk tab) ─────────────────────────────────────────────────────
async function renderDeskList(v, go) {
  v.innerHTML = '<div class="skel"></div>'
  const h = myHomeData || (await loadMyHome())
  const desks = h?.desks || []
  if (desks.length === 1 && desks[0].kind !== 'later') return go('desk', desks[0].module, desks[0].name, desks[0].id)
  v.innerHTML = `<section class="card"><div class="wk-dh"><h2 class="h3">My desks</h2><div class="sub">Only the work your boss gave you appears here.</div></div>
    <div class="list">${desks.map((d) => `<button class="li" data-desk="${esc(d.module)}" data-name="${esc(d.name)}" data-id="${esc(d.id)}"><span class="wk-di">${esc(d.icon || '🗂️')}</span><div class="nm"><b>${esc(d.name)}</b><span>${esc(d.company)}${d.description ? ' · ' + esc(d.description) : ''}</span></div><span class="pill n">${d.kind === 'later' ? 'later' : 'OPEN'}</span></button>`).join('') || '<div class="empty">No desk assigned yet</div>'}</div></section>`
  v.querySelectorAll('[data-desk]').forEach((b) => (b.onclick = () => go('desk', b.dataset.desk, b.dataset.name, b.dataset.id)))
}

// ── Daily Bookings ──────────────────────────────────────────────────────────
async function renderBookings(v, go, errMsg = '') {
  v.innerHTML = '<div class="skel"></div>'
  let r
  try { r = await get('/api/bookings') } catch (e) { v.innerHTML = `<div class="err">${esc(e.message)}</div>`; return }
  const today = istDate(), mine = r.rows.filter((x) => x.date === today)
  v.innerHTML = `<button class="link wk-back" id="back">← Home</button>
  <section class="wk-bk"><div><b>${inr(r.totals.today)}</b><span>Today</span></div><div><b>${inr(r.totals.week)}</b><span>This week</span></div><div><b>${inr(r.totals.month)}</b><span>This month</span></div></section>
  <section class="card"><h2 class="h3">Add booking</h2><form id="bf" class="stack" style="margin-top:10px">
    <label class="f">Date<input class="inp" type="date" id="bd" value="${today}" max="${today}" required></label>
    <label class="f">Booking number<input class="inp" id="bn" required autocapitalize="characters" placeholder="JD-24518"></label>
    <label class="f">Amount ₹ (incl. GST)<input class="inp" id="ba" type="number" min="1" step="0.01" required inputmode="decimal"></label>
    <button class="btn dark">Save booking</button>${errMsg ? `<div class="err">${esc(errMsg)}</div>` : ''}</form></section>
  <section class="card"><div class="row"><h2 class="h3">Today</h2><span class="sp"></span><span class="sub">${mine.length} bookings</span></div>
    <div class="list">${mine.map((x) => `<div class="li wk-lead"><div class="nm"><b>${esc(x.booking_no)}</b><span>${fmtDate(x.date)} · ${new Date(x.created_at).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit' })}</span></div><b>${inr(x.amount)}</b><button class="pill o wk-ed" data-ed="${x.id}" data-no="${esc(x.booking_no)}" data-amt="${x.amount}">Edit</button></div>`).join('') || '<div class="empty">No bookings today</div>'}</div>
    <div class="wk-y">Edit or delete only today · after that, admin only</div></section>
  ${r.rows.filter((x) => x.date !== today).length ? `<section class="card"><h2 class="h3">Earlier this month</h2><div class="list">${r.rows.filter((x) => x.date !== today).slice(0, 60).map((x) => `<div class="li"><div class="nm"><b>${esc(x.booking_no)}</b><span>${fmtDate(x.date)}</span></div><b>${inr(x.amount)}</b></div>`).join('')}</div></section>` : ''}`
  v.querySelector('#back').onclick = () => go('home')
  v.querySelector('#bf').onsubmit = async (e) => {
    e.preventDefault()
    try { await post('/api/bookings', { date: v.querySelector('#bd').value, booking_no: v.querySelector('#bn').value.trim(), amount: v.querySelector('#ba').value }); toast('Booking saved ✓'); renderBookings(v, go) }
    catch (er) { renderBookings(v, go, er.message) }
  }
  v.querySelectorAll('[data-ed]').forEach((b) => (b.onclick = () => sheet(`<div class="row"><h2 class="h3">Edit ${esc(b.dataset.no)}</h2><span class="sp"></span><button class="link" data-close>Close</button></div>
    <form id="ef" class="stack" style="margin-top:10px"><label class="f">Booking number<input class="inp" id="en" value="${esc(b.dataset.no)}" required></label><label class="f">Amount ₹<input class="inp" id="ea" type="number" step="0.01" value="${b.dataset.amt}" required></label>
    <button class="btn pri">Save</button><button type="button" class="btn ghost" id="del" style="color:#B91C1C">Delete booking</button></form>`, (el, close) => {
    el.querySelector('#ef').onsubmit = async (e) => { e.preventDefault(); try { await patch('/api/bookings/' + b.dataset.ed, { booking_no: el.querySelector('#en').value, amount: el.querySelector('#ea').value }); close(); toast('Saved'); renderBookings(v, go) } catch (er) { toast(er.message, 'bad') } }
    el.querySelector('#del').onclick = async () => { try { await patch('/api/bookings/' + b.dataset.ed, { delete: true }); close(); toast('Deleted'); renderBookings(v, go) } catch (er) { toast(er.message, 'bad') } }
  })))
}

// ── Order Punch (full order entry) ──────────────────────────────────────────
async function renderPunch(v, go) {
  v.innerHTML = '<div class="skel"></div>'
  let d
  try { d = await get('/api/my/cargo') } catch (e) { v.innerHTML = `<div class="err">${esc(e.message)}</div>`; return }
  v.innerHTML = `<button class="link wk-back" id="back">← Home</button>
    <button class="wk-new" id="neworder" style="border:0;border-radius:16px;padding:16px;font-weight:800;font-size:16px;color:#fff">＋ Punch new order</button>
    <section class="card"><h2 class="h3">My orders</h2><div class="list">${d.orders.map((o) => `<div class="li"><div class="nm"><b>${esc(o.customer)} · ${inr(o.amount)}</b><span>${fmtDate(o.date)} · ${esc(o.mode)} · ${o.kg} kg${o.markup != null ? ' · markup ' + o.markup + '%' : ''}</span></div><span class="pill ${/pending/i.test(o.approval) ? 'o' : /rejected/i.test(o.approval) ? 'r' : 'n'}">${/pending/i.test(o.approval) ? 'Pending approval' : /rejected/i.test(o.approval) ? 'Rejected' : esc(o.stage)}</span></div>`).join('') || '<div class="empty">No orders yet</div>'}</div></section>`
  v.querySelector('#back').onclick = () => go('home')
  v.querySelector('#neworder').onclick = () => orderSheet(null, () => renderPunch(v, go))
}

// ── Simple entry desk ──────────────────────────────────────────────────────
async function renderSimple(v, go, id, name) {
  v.innerHTML = '<div class="skel"></div>'
  let r
  try { r = await get(`/api/desks/${id}/entries`) } catch (e) { v.innerHTML = `<div class="err">${esc(e.message)}</div>`; return }
  const F = r.desk.fields
  const input = (f) => f.type === 'choice' ? `<select class="inp" name="${f.key}"><option value="">—</option>${(f.options || []).map((o) => `<option>${esc(o)}</option>`).join('')}</select>`
    : f.type === 'photo' ? `<input class="inp" type="file" accept="image/*" capture="environment" data-photo="${f.key}">`
    : `<input class="inp" name="${f.key}" type="${f.type === 'money' || f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}" ${f.type === 'money' ? 'step="0.01" min="0"' : ''}>`
  const total = r.entries.filter((x) => x.date.slice(0, 7) === istDate().slice(0, 7)).reduce((a, x) => a + x.amount, 0)
  v.innerHTML = `<button class="link wk-back" id="back">← Home</button>
    <section class="card"><div class="row"><h2 class="h3">${esc(r.desk.icon || '✍️')} ${esc(r.desk.name)}</h2><span class="sp"></span>${F.some((f) => f.type === 'money') ? `<span class="pill g">${inr(total)} this month</span>` : ''}</div>
      <form id="sf" class="wk-form"><label class="f wide">Date<input class="inp" type="date" name="_date" value="${istDate()}" max="${istDate()}"></label>
      ${F.map((f) => `<label class="f wide">${esc(f.label)}${input(f)}</label>`).join('')}<button class="btn pri wide">Save entry</button></form></section>
    <section class="card"><h2 class="h3">My entries</h2><div class="list">${r.entries.slice(0, 50).map((x) => `<div class="li"><div class="nm"><b>${esc(F.filter((f) => f.type !== 'photo').map((f) => x.data[f.key]).filter((y) => y !== '' && y != null).slice(0, 3).join(' · ') || 'Entry')}</b><span>${fmtDate(x.date)}</span></div>${x.amount ? `<b>${inr(x.amount)}</b>` : ''}</div>`).join('') || '<div class="empty">No entries yet</div>'}</div></section>`
  v.querySelector('#back').onclick = () => go('home')
  v.querySelector('#sf').onsubmit = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.target), data = {}
    for (const f of F) if (f.type !== 'photo') data[f.key] = fd.get(f.key)
    for (const inp of v.querySelectorAll('[data-photo]')) {
      const file = inp.files?.[0]; if (!file) continue
      data[inp.dataset.photo] = await new Promise((res) => { const img = new Image(); img.onload = () => { const s = Math.min(1, 800 / img.width), c = document.createElement('canvas'); c.width = img.width * s; c.height = img.height * s; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', 0.6)) }; img.src = URL.createObjectURL(file) })
    }
    try { await post(`/api/desks/${id}/entries`, { date: fd.get('_date'), data }); toast('Saved ✓'); renderSimple(v, go, id, name) } catch (er) { toast(er.message, 'bad') }
  }
}

// Orders / bookings: the punch form sits on Home; this page is the viewer (today / this week / this month)
export function mountPunch(el, go) { return punchCard(el, { word: myHomeData?.order_word, onHistory: () => go('orders'), onSaved: () => loadMyHome() }) }
export async function renderOrdersPage(v, go) {
  if (!myHomeData) await loadMyHome()
  const w = myHomeData?.order_word === 'booking' ? 'bookings' : 'orders'
  v.innerHTML = `<div class="row"><button class="btn ghost sm" id="obk">← Home</button><h2 class="h3" style="margin:0 0 0 8px">My ${w}</h2></div><div id="ob" class="stack"></div>`
  v.querySelector('#obk').onclick = () => go('home')
  return renderOrders(v.querySelector('#ob'), { word: myHomeData?.order_word, viewOnly: true })
}

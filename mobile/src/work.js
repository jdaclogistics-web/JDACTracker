// Employee: home blocks (progress, work in order, desks, up next, projects), Tasks, Chat, Cargo Sales desk
import { get, post } from '@shared/api.js'
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
  <section class="card" id="desks"><div class="wk-dh"><h2 class="h3">Desks</h2><div class="sub">Only the work your boss gave you appears here.</div></div>
    <div class="list">${h.desks.map((d) => `<button class="li" data-desk="${esc(d.module)}" data-name="${esc(d.name)}"><span class="wk-di">${esc(d.icon || '🗂️')}</span><div class="nm"><b>${esc(d.name)}</b><span>${esc(d.description)}</span></div><span class="pill n">OPEN</span></button>`).join('') || '<div class="empty">No desk assigned yet</div>'}</div></section>
  <section class="card"><div class="row"><h2 class="h3">⏭️ Up next for you</h2><span class="sp"></span><button class="link" data-go="tasks">all tasks →</button></div>
    <div class="list">${h.up_next.slice(0, 5).map(taskRow).join('') || '<div class="empty">Nothing pending — enjoy the clear day ✨</div>'}</div></section>
  <section class="card"><div class="row"><h2 class="h3">My projects</h2><span class="sp"></span><span class="sub">${h.projects.length}</span></div>
    <div class="list">${h.projects.map((p) => `<button class="li" data-go="chat" data-project="${esc(p.id)}"><span class="wk-di" style="background:#FEF3C7">📁</span><div class="nm"><b>${esc(p.name)}</b><span>${p.open} open tasks · ${p.members} members</span></div>${ic('chev', 18, '#9AA4B5')}</button>`).join('') || '<div class="empty">No projects</div>'}</div></section>`
}
function greet() { const hr = Number(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: false })); return hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening' }
const taskRow = (t) => `<div class="li"><button class="ck" data-task="${esc(t.id)}" aria-label="Mark done"></button><div class="nm"><b>${esc(t.title)}</b><span>${t.due ? (t.due < istDate() ? '<b style="color:#B91C1C;display:inline">overdue</b> · ' : '') + 'due ' + fmtDate(t.due) : 'no due date'}${t.priority ? ' · ' + esc(t.priority) : ''}${t.checklist.length ? ` · ${t.checklist.filter((c) => c.done).length}/${t.checklist.length} steps` : ''}</span></div></div>`

export function bindHome(v, go) {
  v.querySelectorAll('[data-go]').forEach((b) => (b.onclick = () => go(b.dataset.go, b.dataset.project)))
  v.querySelectorAll('[data-desk]').forEach((b) => (b.onclick = () => go('desk', b.dataset.desk, b.dataset.name)))
  bindTaskChecks(v, () => go('home'))
}
function bindTaskChecks(v, after) {
  v.querySelectorAll('[data-task]').forEach((b) => (b.onclick = async () => {
    b.classList.add('on'); b.textContent = '✓'
    try { await post('/api/my/task-done', { id: b.dataset.task, done: true }); toast('Task done ✓'); await loadMyHome(); after() } catch (e) { toast(e.message, 'bad'); b.classList.remove('on'); b.textContent = '' }
  }))
}

// ── Tasks ─────────────────────────────────────────────────────────────────
export async function renderTasks(v, go) {
  v.innerHTML = '<div class="skel"></div>'
  const h = await loadMyHome()
  if (!h) { v.innerHTML = '<div class="err">Internet नहीं है</div>'; return }
  v.innerHTML = `<section class="card"><div class="row"><h2 class="h3">My tasks</h2><span class="sp"></span><span class="sub">${h.up_next.length} open · ${h.tasks_done} done today</span></div>
    <div class="list">${h.up_next.map((t) => taskRow(t) + (t.notes || t.checklist.length ? `<div class="wk-tn">${t.notes ? esc(t.notes) : ''}${t.checklist.map((c) => `<div>${c.done ? '☑' : '☐'} ${esc(c.title)}</div>`).join('')}</div>` : '')).join('') || '<div class="empty">Nothing pending — enjoy the clear day ✨</div>'}</div></section>`
  bindTaskChecks(v, () => renderTasks(v, go))
}

// ── Chat ──────────────────────────────────────────────────────────────────
export async function renderChat(v, project = '') {
  v.innerHTML = '<div class="skel"></div>'
  try {
    const c = await get('/api/cc/chat')
    const msgs = c.messages.filter((m) => !project || m.projectId === project).slice(0, 80).reverse()
    v.innerHTML = `<section class="card wk-chat"><div class="row"><h2 class="h3">Chat</h2><span class="sp"></span>
      <select class="inp" id="cp" style="width:auto;padding:8px">${'<option value="">All</option>' + c.projects.map((p) => `<option value="${esc(p.id)}" ${project === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></div>
      <div class="wk-msgs" id="msgs">${msgs.map((m) => `<div class="wk-msg ${m.sender === c.me ? 'me' : ''}"><span>${esc(m.sender)} · ${esc(String(m.at).slice(5, 16))}</span><p>${esc(m.body)}</p></div>`).join('') || '<div class="empty">No messages</div>'}</div>
      <form id="cf" class="row" style="margin-top:10px"><input class="inp" id="cm" placeholder="Message…" autocomplete="off"><button class="btn pri sm">Send</button></form></section>`
    const box = v.querySelector('#msgs'); box.scrollTop = box.scrollHeight
    v.querySelector('#cp').onchange = (e) => renderChat(v, e.target.value)
    v.querySelector('#cf').onsubmit = async (e) => { e.preventDefault(); const t = v.querySelector('#cm').value.trim(); if (!t) return; try { await post('/api/cc/chat', { body: t, projectId: project || null }); renderChat(v, project) } catch (er) { toast(er.message, 'bad') } }
  } catch (e) { v.innerHTML = `<div class="err">${esc(e.message)}</div>` }
}

// ── Desks ─────────────────────────────────────────────────────────────────
export async function renderDesk(v, go, module, name) {
  if (module !== 'cargo') {
    v.innerHTML = `<button class="link wk-back" id="back">← Back</button><section class="card"><h2 class="h3">${esc(name || module)}</h2><p class="sub">यह desk जल्द नए app में आएगा। तब तक इसका काम office को WhatsApp पर भेजें।</p></section>`
    v.querySelector('#back').onclick = () => go('home'); return
  }
  v.innerHTML = '<div class="skel"></div><div class="skel"></div>'
  let d
  try { d = await get('/api/my/cargo') } catch (e) { v.innerHTML = `<div class="err">${esc(e.message)}</div>`; return }
  const rankMe = d.leaderboard.findIndex((x) => x.name === d.for) + 1
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
  <section class="card"><h2 class="h3">🏆 Team leaderboard — this month</h2><div class="list">${d.leaderboard.map((x, i) => `<div class="li"><b style="width:20px">${i + 1}</b><div class="nm"><b style="color:${x.name === d.for ? '#BE123C' : 'inherit'}">${esc(x.name)}${x.name === d.for ? ' (you)' : ''}</b></div><span class="sub">${x.orders} orders · <b>${inr(x.amount)}</b></span></div>`).join('')}</div></section>`
  v.querySelector('#back').onclick = () => go('home')
  const reload = () => renderDesk(v, go, module, name)
  v.querySelectorAll('[data-log]').forEach((b) => (b.onclick = () => logSheet(b.dataset.log, b.dataset.ph, b.dataset.nm, reload)))
  v.querySelector('#neworder').onclick = () => orderSheet(null, reload)
  v.querySelector('#newquote').onclick = () => quoteSheet(null, reload)
  v.querySelectorAll('[data-j]').forEach((b) => (b.onclick = () => listSheet(`${b.dataset.j} leads`, d.leads.filter((l) => l.journey === b.dataset.j).map((l) => [l.phone || l.name || '(no name)', `${l.name ? l.name + ' · ' : ''}${l.stage || 'New'}${l.next ? ' · next ' + fmtDate(l.next) : ''}`, '', l]), reload)))
  v.querySelectorAll('[data-sub]').forEach((b) => (b.onclick = () => {
    if (b.dataset.sub === 'orders') listSheet('My orders', d.orders.map((o) => [o.customer, `${fmtDate(o.date)} · ${o.mode} · ${o.kg} kg · ${o.stage}`, inr(o.amount)]))
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
      <label class="f">Amount ₹ (customer)<input class="inp" id="oa" type="number" min="1" required></label><label class="f">Vendor cost ₹<input class="inp" id="ov" type="number" min="0"></label>
      <label class="f">Vendor<input class="inp" id="ovn"></label><label class="f">Pickup address<input class="inp" id="opa"></label>
      <label class="f wide">Notes<input class="inp" id="on"></label>
      <div class="sub wide" id="mk">Markup 40% से कम हो तो order Boss approval के लिए जाएगा.</div>
      <button class="btn pri wide">Book order</button></form>`, (el, close) => {
    const mk = () => { const a = Number(el.querySelector('#oa').value), c = Number(el.querySelector('#ov').value); if (a && c) { const p = Math.round(((a - c) / c) * 100); el.querySelector('#mk').innerHTML = `Markup <b style="color:${p < 40 ? '#B91C1C' : '#047857'}">${p}%</b>${p < 40 ? ' — Boss approval लगेगा' : ''}` } }
    el.querySelector('#oa').oninput = mk; el.querySelector('#ov').oninput = mk
    el.querySelector('#of').onsubmit = async (e) => {
      e.preventDefault(); const q = (s) => el.querySelector(s).value
      try { const r = await post('/api/my/cargo-order', { leadId: lead, customerName: q('#oc'), phone: q('#op'), mode: q('#om'), kg: q('#ok'), amount: q('#oa'), vendorCost: q('#ov'), vendorName: q('#ovn'), pickupAddress: q('#opa'), notes: q('#on') }); toast(r.markupPct != null && r.markupPct < 40 ? 'Order booked — Boss approval pending' : 'Order booked ✓'); close(); reload() } catch (er) { toast(er.message, 'bad') }
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

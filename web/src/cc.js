// Boss / Developer screens: Home (8 blocks), Company page (Overview · Desks · Accounts), Desks, People, Tasks, Chat, Accounts
import { get, post, patch, prefetch } from '@shared/api.js'
import { esc, ic, fmtDate, fmtTime, toast, initials, avColor, istDate, downloadCsv } from '@shared/util.js'
import { renderChatUI, injectChatCss } from '@shared/chat.js'

const inr = (n) => (n ? '₹' + Math.round(n).toLocaleString('en-IN') : '₹0')
const inrL = (n) => (Math.abs(n) >= 100000 ? '₹' + (n / 100000).toFixed(n >= 1e6 ? 1 : 2).replace(/\.?0+$/, '') + 'L' : inr(n))
const num = (n) => (n ? Number(n).toLocaleString('en-IN') : '0')
const skel = '<div class="skel"></div>'
export const COMPANIES = ['JDAC Logistics', 'Jupiter Equipment', 'GovaaBazaar', 'JDAC Studios']
const CO = {
  'JDAC Logistics': { icon: 'truck', grad: 'linear-gradient(120deg,#F43F5E,#DC2626)', sub: 'lead journey, bookings & vendors' },
  'Jupiter Equipment': { icon: 'box', grad: 'linear-gradient(120deg,#2563EB,#1D4ED8)', sub: 'equipment orders, delivery, rentals & vendors' },
  GovaaBazaar: { icon: 'store', grad: 'linear-gradient(120deg,#F97316,#EA580C)', sub: 'FMCG orders, stock, purchases & sales' },
  'JDAC Studios': { icon: 'mega', grad: 'linear-gradient(120deg,#6366F1,#4338CA)', sub: 'websites, social media & performance marketing' },
}
export const ccState = (() => { let s = { range: 'month', company: 'All' }; try { s = { ...s, ...JSON.parse(sessionStorage.getItem('jdac_cc') || '{}') } } catch { /* */ } return s })()
const saveState = () => { try { sessionStorage.setItem('jdac_cc', JSON.stringify(ccState)) } catch { /* */ } }
const err = (e) => `<div class="err">${esc(e.message)}</div>`
const markChip = (m) => (m == null ? '<span class="pill n">no cost</span>' : m >= 40 ? `<span class="pill g">${m}%</span>` : `<span class="pill r">⚠ ${m}%</span>`)
const switcher = (id = 'cosw') => `<select class="cc-sw" id="${id}"><option value="All">All companies</option>${COMPANIES.map((c) => `<option ${ccState.company === c ? 'selected' : ''}>${c}</option>`).join('')}</select>`
const block = async (el, fn) => { el.innerHTML = skel; try { await fn(el) } catch (e) { el.innerHTML = err(e) } }

// ═════════════════════════ HOME ═════════════════════════
export function viewCC(v, go, X) {
  v.innerHTML = `
  <div class="cc-top"><b>JDAC SALES PVT LTD</b><span>${fmtDate(istDate(), { weekday: 'short', day: 'numeric', month: 'short' })}</span><span class="sp"></span>${switcher()}</div>
  <div id="b1"></div><div id="b2"></div><div id="b3"></div><div id="b4"></div><div id="b5"></div><div id="b6"></div><div id="b7"></div><div id="b8"></div>`
  v.querySelector('#cosw').onchange = (e) => { ccState.company = e.target.value; saveState(); viewCC(v, go, X) }
  const logi = ccState.company === 'All' || ccState.company === 'JDAC Logistics'
  let H = null
  const load = async () => {
    H = get(`/api/cc/home?range=${ccState.range}&company=${encodeURIComponent(ccState.company)}`)
    const T = get('/api/admin/today'), LV = get('/api/admin/leaves?status=Pending'), AL = get('/api/admin/alerts')
    block(v.querySelector('#b1'), async (el) => {
      const g = (await H).group
      el.innerHTML = `<section class="card cc-money" style="cursor:pointer" id="money"><div class="row"><b class="cc-t">${ccState.company === 'All' ? 'Group' : esc(ccState.company)} · this ${ccState.range === 'today' ? 'day' : ccState.range}</b><span class="sp"></span>
        <div class="cc-seg">${['today', 'week', 'month'].map((r) => `<button data-r="${r}" class="${ccState.range === r ? 'on' : ''}">${r[0].toUpperCase() + r.slice(1)}</button>`).join('')}</div></div>
        <div class="cc-4"><div><b>${inrL(g.booked)}</b><span>Booked</span></div><div><b>${inrL(g.collected)}</b><span>Collected</span></div><div><b>${inrL(g.costs)}</b><span>Costs</span></div><div><b class="${g.profit < 0 ? 'neg' : ''}">${inrL(g.profit)}</b><span>Profit</span></div></div>
        <div class="cc-2"><div><span>To collect</span><b>${inrL(g.to_collect)}</b></div><div><span>To pay vendors</span><b>${inrL(g.to_pay)}</b></div></div>
        ${logi ? `<div class="cc-cse">CSE bookings · ${inr(g.cse_bookings)}</div>` : ''}</section>`
      el.querySelector('#money').onclick = (e) => { if (e.target.dataset.r) return; go('accounts') }
      el.querySelectorAll('[data-r]').forEach((b) => (b.onclick = () => { ccState.range = b.dataset.r; saveState(); viewCC(v, go, X) }))
    })
    block(v.querySelector('#b2'), async (el) => {
      const [h, lv, al] = await Promise.all([H, LV, AL]), w = h.waiting
      const rows = [
        w.pending_approval && `<button data-act="approve"><span>Orders below 40% markup<small>${w.pending_approval} · ${inr(w.pending_amount)}</small></span><i class="pill r">Approve</i></button>`,
        w.claims && `<button data-act="claims"><span>Expense claims<small>${w.claims} · ${inr(w.claims_amount)}</small></span><i class="pill o">Review</i></button>`,
        w.unpaid_30 && `<button data-act="unpaid"><span>Invoices unpaid 30+ days<small>${w.unpaid_30} · ${inr(w.unpaid_30_amount)}</small></span><i class="pill r">Follow up</i></button>`,
        w.uncalled_72h && `<button data-act="pool"><span>Leads uncalled 72h+<small>${num(w.uncalled_72h)} leads</small></span><i class="pill b">Assign</i></button>`,
        lv.leaves.length && `<button data-act="leave"><span>Leave requests<small>${lv.leaves.length}</small></span><i class="pill p">Approve</i></button>`,
        ...al.alerts.map((a) => `<button data-act="live"><span><b>${esc(a.name)}</b><small>${a.kind === 'auto_logout' ? '24 hours done — auto logout' : 'no GPS signal'}</small></span><i class="pill ${a.kind === 'auto_logout' ? 'r' : 'o'}">Check</i></button>`),
        // Weight-difference payments: Om का Ops panel बनने पर यहाँ जुड़ेगा
      ].filter(Boolean)
      el.innerHTML = `<section class="card"><div class="row"><h2 class="h3">Waiting on you</h2><span class="sp"></span><span class="sub">tap to act</span></div>
        <div class="cc-wait">${rows.join('') || '<div class="empty">Nothing waiting — all clear ✅</div>'}</div></section>`
      const act = { approve: () => go('company', 'JDAC Logistics', { tab: 'desks', mv: 'ops', filter: 'pending' }), claims: () => go('old', 'expense_claims'), unpaid: () => go('accounts', null, { filter: 'overdue' }),
        pool: () => go('company', 'JDAC Logistics', { tab: 'desks', mv: 'sales' }), leave: () => go('people', null, { sub: 'leave' }), live: () => go('live') }
      el.querySelectorAll('[data-act]').forEach((b) => (b.onclick = act[b.dataset.act]))
    })
    block(v.querySelector('#b3'), async (el) => {
      const h = await H
      const list = ccState.company === 'All' ? h.companies : h.companies.filter((c) => c.name === ccState.company)
      el.innerHTML = `<section class="card"><div class="row"><h2 class="h3">Companies</h2><span class="sp"></span><span class="sub">this month</span></div>
        <table class="cc-tbl"><thead><tr><th>Company</th><th class="r">Booked</th><th class="r">Profit</th><th class="r">Markup</th></tr></thead><tbody>
        ${list.map((c) => `<tr data-co="${esc(c.name)}"><td><b>${esc(c.name)}</b></td><td class="r">${inr(c.booked)}</td><td class="r ${c.profit < 0 ? 'neg' : ''}">${inr(c.profit)}</td>
          <td class="r">${c.name === 'JDAC Logistics' ? (c.markup == null ? '<span class="pill n">—</span>' : markChip(c.markup)) : '—'}</td></tr>`).join('')}</tbody></table></section>`
      el.querySelectorAll('[data-co]').forEach((r) => (r.onclick = () => go('company', r.dataset.co)))
    })
    if (logi) {
      block(v.querySelector('#b4'), async (el) => {
        const h = await H
        el.innerHTML = `<section class="card"><div class="row"><h2 class="h3">Logistics sales today</h2><span class="sp"></span><span class="sub">CSEs</span></div>
          <table class="cc-tbl"><thead><tr><th>CSE</th><th class="r">Calls</th><th class="r">Quotes</th><th class="r">Orders</th><th class="r">Markup</th></tr></thead><tbody>
          ${h.sales.map((c) => `<tr data-emp="${c.emp_id}"><td><b>${esc(c.name)}</b></td><td class="r">${num(c.calls)}</td><td class="r">${num(c.quotes)}</td><td class="r">${num(c.orders)}</td><td class="r">${c.markup == null ? '—' : markChip(c.markup)}</td></tr>`).join('') || '<tr><td colspan="5" class="empty">No one has the Cargo Sales desk</td></tr>'}</tbody></table></section>`
        el.querySelectorAll('[data-emp]').forEach((r) => (r.onclick = () => go('desk', r.dataset.emp)))
      })
      block(v.querySelector('#b5'), async (el) => {
        const o = (await H).ops
        el.innerHTML = `<section class="card" style="cursor:pointer" id="ops"><div class="row"><h2 class="h3">Logistics ops today</h2><span class="sp"></span><span class="sub">Om</span></div>
          <div class="cc-chips"><span class="pill b">Pickup due ${num(o.pickup)}</span><span class="pill o">In transit ${num(o.transit)}</span><span class="pill g">Delivered ${num(o.delivered)}</span></div>
          <div class="sub" style="margin-top:6px">Full Ops panel for Om coming later</div></section>`
        el.querySelector('#ops').onclick = () => go('company', 'JDAC Logistics', { tab: 'desks', mv: 'ops' })
      })
    } else { v.querySelector('#b4').innerHTML = ''; v.querySelector('#b5').innerHTML = '' }
    block(v.querySelector('#b6'), async (el) => {
      const t = await T, s = t.summary
      const notIn = t.rows.filter((r) => r.status === 'absent').map((r) => r.emp.name.split(' ')[0])
      el.innerHTML = `<section class="card" style="cursor:pointer" id="ppl"><div class="row"><h2 class="h3">People today</h2><span class="sp"></span><span class="sub">all companies</span></div>
        <div class="cc-chips"><span class="pill g">In ${s.in - s.late}</span><span class="pill o">Late ${s.late}</span><span class="pill r">Not started ${s.absent}</span><span class="pill b">Leave ${s.leave}</span></div>
        ${notIn.length ? `<div class="sub" style="margin-top:6px">${esc(notIn.slice(0, 3).join(', '))}${notIn.length > 3 ? ` +${notIn.length - 3}` : ''} not checked in</div>` : ''}</section>`
      el.querySelector('#ppl').onclick = () => go('people')
    })
    block(v.querySelector('#b7'), async (el) => {
      const a = (await H).ads
      el.innerHTML = `<section class="card" style="cursor:pointer" id="ads"><div class="row"><h2 class="h3">Leads &amp; ads today</h2><span class="sp"></span><span class="sub">from JDAC Studios</span></div>
        ${a.spend || a.leads ? `<div class="cc-3"><span>Spend <b>${inr(a.spend)}</b></span><span>Leads <b>${num(a.leads)}</b></span><span>Cost/lead <b>${a.cpl ? inr(a.cpl) : '₹0'}</b></span></div>` : '<div class="sub" style="margin-top:8px">No ad data logged today</div>'}</section>`
      el.querySelector('#ads').onclick = () => go('company', 'JDAC Studios')
    })
    const tools = v.querySelector('#b8')
    tools.innerHTML = `<section class="card"><h2 class="h3">Tools</h2>
      <div class="cc-tools">${[['desks', 'Desks', 'grid'], ['old:cse_targets', 'Targets & incentives', 'check'], ['report', 'Insights', 'chart'], ['staff', 'Settings', 'lock'], ['accounts', 'Accounts', 'wallet']]
        .map(([k, l, i]) => `<button data-tool="${k}"><span class="tic">${ic(i, 18)}</span><b>${l}</b></button>`).join('')}
        <button data-tool="old:hr_invoices" class="ext"><span class="tic" style="background:#F1F5F9;color:#64748B">${ic('users', 18)}</span><b style="color:#64748B">SalaryMitra ↗</b><span>separate product</span></button></div>
      <div class="cc-links"><button data-tool="people">Attendance</button> · <button data-tool="live">Live tracking</button> · <button data-tool="old:daily_reports">Daily reports</button> · <button data-tool="old">Records</button> · <button data-tool="audit">Audit</button></div></section>`
    tools.querySelectorAll('[data-tool]').forEach((b) => (b.onclick = () => { const [t, tbl] = b.dataset.tool.split(':'); go(t, tbl || null) }))
  }
  load()
  X.setTimer(setInterval(() => { if (document.body.contains(v)) load() }, 60_000))
}

// ═════════════════════════ COMPANY PAGE ═════════════════════════
export async function viewCompany(v, go, name, opts = {}) {
  const tab = opts.tab || 'overview', range = opts.range || ccState.range
  const meta = CO[name] || { icon: 'grid', grad: '#0B1220', sub: '' }
  v.innerHTML = skel + skel
  let c
  try { c = await get(`/api/cc/company?name=${encodeURIComponent(name)}&range=${range}`) } catch (e) { v.innerHTML = err(e); return }
  const m = c.money
  const re = (o) => viewCompany(v, go, name, { ...opts, ...o })
  v.innerHTML = `<button class="link cc-back" id="back">← Home</button>
    <section class="cc-co" style="background:${meta.grad}"><div class="row"><span class="cc-coi">${ic(meta.icon, 22, '#fff')}</span><div class="sp"><b>${esc(name)}</b><span>${esc(meta.sub)}</span></div>
      <div class="cc-seg">${['today', 'week', 'month'].map((r) => `<button data-r="${r}" class="${range === r ? 'on' : ''}">${r[0].toUpperCase() + r.slice(1)}</button>`).join('')}</div></div>
      <div class="cc-4 w"><div><b>${inrL(m.booked)}</b><span>Booked</span></div><div><b>${inrL(m.collected)}</b><span>Collected</span></div><div><b>${inrL(m.costs)}</b><span>Costs</span></div><div><b>${inrL(m.profit)}</b><span>Profit</span></div></div></section>
    <div class="cc-tabs">${[['overview', 'Overview'], ['desks', 'Desks'], ['accounts', 'Accounts']].map(([k, l]) => `<button data-tab="${k}" class="${tab === k ? 'on' : ''}">${l}</button>`).join('')}</div>
    <div id="cobody"></div>`
  v.querySelector('#back').onclick = () => go('home')
  v.querySelectorAll('[data-r]').forEach((b) => (b.onclick = () => re({ range: b.dataset.r })))
  v.querySelectorAll('[data-tab]').forEach((b) => (b.onclick = () => re({ tab: b.dataset.tab, mv: null })))
  const B = v.querySelector('#cobody')
  if (tab === 'overview') {
    B.innerHTML = `<div class="cc-kpis">${c.kpis.map(([l, val, k]) => `<div class="card"><span class="lbl">${esc(l)}</span><b>${k === 'money' ? inr(val) : num(val)}</b></div>`).join('')}</div>
      ${name === 'JDAC Logistics' && c.manager ? `<section class="card"><div class="row"><h2 class="h3">Sales team · this month</h2><span class="sp"></span><button class="link" id="gosales">Open ${ic('chev', 14)}</button></div>${salesTable(c.manager.sales_team)}</section>` : ''}`
    B.querySelector('#gosales')?.addEventListener('click', () => re({ tab: 'desks', mv: 'sales' }))
  } else if (tab === 'desks') {
    if (opts.mv === 'sales') return managerSales(B, c, go, re)
    if (opts.mv === 'ops') return managerOps(B, c, go, re, opts.filter)
    if (opts.mv === 'campaigns') return managerCampaigns(B, c, re)
    B.innerHTML = `<div class="list cc-desks">${c.desks.map((d) => `<button class="cc-desk ${d.kind === 'later' ? 'later' : ''}" data-desk="${d.id}"><span class="cc-di">${esc(d.icon || '🗂️')}</span><div class="nm"><b>${esc(d.name)}</b><span>${esc(d.description || (d.kind === 'simple' ? 'simple entry desk' : ''))}</span></div>
        ${d.kind === 'later' ? '<span class="pill o">later</span>' : `<span class="pill ${d.people ? 'g' : 'n'}">${d.people ? d.people + (d.people === 1 ? ' person' : ' people') : '0'}</span>`}</button>`).join('') || '<div class="empty">No desks yet</div>'}</div>
      ${name === 'JDAC Logistics' ? `<section class="card cc-mv"><div class="row"><h2 class="h3">Manager views</h2><span class="sp"></span><span class="sub">you only</span></div>
        <div class="cc-todo"><button data-mv="sales"><b>Sales team</b><span>CSE table · lead pool · lead pipeline</span></button><button data-mv="ops"><b>Ops board</b><span>order stages · markup · approvals · invoices</span></button></div></section>` : ''}
      ${name === 'JDAC Studios' ? `<section class="card cc-mv"><div class="row"><h2 class="h3">Manager view</h2><span class="sp"></span><span class="sub">you only</span></div>
        <div class="cc-todo"><button data-mv="campaigns"><b>All campaigns</b><span>every brand (Logistics, Jupiter, Govaa)</span></button></div></section>` : ''}
      <button class="cc-dash" id="newdesk">+ Create desk for ${esc(name)}</button>`
    B.querySelectorAll('[data-desk]').forEach((b) => (b.onclick = () => go('desks', null, { desk: Number(b.dataset.desk) })))
    B.querySelectorAll('[data-mv]').forEach((b) => (b.onclick = () => re({ mv: b.dataset.mv })))
    B.querySelector('#newdesk').onclick = () => go('desks', null, { create: name })
  } else {
    await accountsBody(B, name, opts.sub || 'sell', c, (o) => re({ ...o, tab: 'accounts' }))
  }
}
const salesTable = (rows) => `<table class="cc-tbl"><thead><tr><th>CSE</th><th class="r">Open leads</th><th class="r">Calls</th><th class="r">Orders</th><th class="r">Profit</th></tr></thead><tbody>
  ${rows.map((x) => `<tr data-emp="${x.id}"><td><b>${esc(x.name)}</b></td><td class="r">${num(x.leads)}</td><td class="r">${num(x.calls)}</td><td class="r">${num(x.orders)}</td><td class="r">${inr(x.profit)}</td></tr>`).join('') || '<tr><td colspan="5" class="empty">No CSE</td></tr>'}</tbody></table>`
function managerSales(B, c, go, re) {
  const M = c.manager
  B.innerHTML = `<button class="link cc-back" id="mb">← Desks</button>
    <section class="card"><h2 class="h3">Sales team · this month</h2>${salesTable(M.sales_team)}<div class="sub" style="margin-top:6px">Tap a CSE to view their desk</div></section>
    <section class="card"><h2 class="h3">Lead pipeline · all CSEs</h2><div class="tiles t3" style="margin-top:8px">${Object.entries(M.pipeline).map(([k, n]) => `<div class="tile"><b>${num(n)}</b><span>${esc(k)}</span></div>`).join('')}</div></section>
    <section class="card"><div class="row"><h2 class="h3">Lead pool · not assigned</h2><span class="sp"></span><span class="pill n">${num(M.pool)}</span></div>
      <div class="sub">To assign, open the lead (Records → ad_leads → fill cseName)</div>
      <div class="list">${M.pool_leads.slice(0, 50).map((l) => `<div class="li"><div class="nm"><b>${esc(l.phone || l.name || '—')}</b><span>${esc(l.name)} · ${fmtDate(l.date) || '—'}</span></div></div>`).join('') || '<div class="empty">Pool is empty</div>'}</div>
      <button class="btn ghost sm" id="pool" style="margin-top:8px">Open lead records</button></section>`
  B.querySelector('#mb').onclick = () => re({ mv: null })
  B.querySelector('#pool').onclick = () => go('old', 'ad_leads')
  B.querySelectorAll('[data-emp]').forEach((r) => (r.onclick = () => go('desk', r.dataset.emp)))
}
function managerOps(B, c, go, re, filter = 'all') {
  const all = c.manager.ops
  const rows = all.filter((o) => filter === 'all' || (filter === 'pending' ? /pending/i.test(o.approval) : filter === 'below' ? o.markup != null && o.markup < 40 : !/deliver|cancel/i.test(o.stage)))
  const STAGES = ['Booked', 'Picked Up', 'In Transit', 'Delivered']
  B.innerHTML = `<button class="link cc-back" id="mb">← Desks</button>
    <section class="card"><div class="row"><h2 class="h3">Ops board · cargo orders</h2><span class="sp"></span><span class="sub">Full Ops panel for Om coming later</span></div>
      <div class="chips" style="margin-top:8px">${[['all', 'All'], ['open', 'Open'], ['pending', 'Pending approval'], ['below', 'Below 40%']].map(([k, l]) => `<button class="chip ${filter === k ? 'on' : ''}" data-f="${k}">${l}</button>`).join('')}</div>
      <div class="list">${rows.map((o) => `<div class="li cc-ord"><div class="nm"><b>${esc(o.customer)} · ${inr(o.amount)}</b><span>${fmtDate(o.date)} · ${esc(o.cse)} · ${esc(o.mode)}${o.kg ? ' · ' + o.kg + ' kg' : ''} · cost ${o.vendor_cost ? inr(o.vendor_cost) : '—'}${o.invoice ? ' · ' + esc(o.invoice) : ''}${o.reason ? ' · ' + esc(o.reason) : ''}</span></div>
        <div class="rc">${markChip(o.markup)}
        ${/pending/i.test(o.approval) ? `<div class="row"><button class="btn sm ghost" data-rej="${esc(o.id)}">Reject</button><button class="btn sm pri" data-app="${esc(o.id)}">Approve</button></div>`
          : /cancel/i.test(o.stage) ? '<span class="pill r">Cancelled</span>' : `<select class="inp cc-stage" data-stage="${esc(o.id)}">${STAGES.map((s) => `<option ${s.toLowerCase() === o.stage.toLowerCase() || (s === 'Booked' && /booking/i.test(o.stage)) ? 'selected' : ''}>${s}</option>`).join('')}<option value="Cancelled">Cancel…</option>${STAGES.some((s) => s.toLowerCase() === o.stage.toLowerCase()) || /booking/i.test(o.stage) ? '' : `<option selected disabled>${esc(o.stage)}</option>`}</select>`}</div></div>`).join('') || '<div class="empty">No orders</div>'}</div></section>`
  B.querySelector('#mb').onclick = () => re({ mv: null })
  B.querySelectorAll('[data-f]').forEach((b) => (b.onclick = () => re({ mv: 'ops', filter: b.dataset.f })))
  B.querySelectorAll('[data-app]').forEach((b) => (b.onclick = async () => { try { await post('/api/cc/order-approve', { id: b.dataset.app, approve: true }); toast('Approved'); re({}) } catch (e) { toast(e.message, 'bad') } }))
  B.querySelectorAll('[data-rej]').forEach((b) => (b.onclick = async () => { const r = prompt('Reason for rejecting'); if (!r) return; try { await post('/api/cc/order-approve', { id: b.dataset.rej, approve: false, reason: r }); toast('Rejected'); re({}) } catch (e) { toast(e.message, 'bad') } }))
  B.querySelectorAll('[data-stage]').forEach((s) => (s.onchange = async () => {
    const body = { id: s.dataset.stage, stage: s.value }
    if (s.value === 'Cancelled') { body.reason = prompt('Reason for cancelling'); if (!body.reason) return re({}) }
    if (s.value === 'Delivered') { const a = prompt('Final amount (enter new amount if weight changed, else leave blank)'); if (a) body.amount = Number(a) }
    try { const r = await post('/api/cc/order-stage', body); toast(r.invoice ? `Delivered — invoice ${r.invoice.docNo} created` : 'Saved'); re({}) } catch (e) { toast(e.message, 'bad'); re({}) }
  }))
}
function managerCampaigns(B, c, re) {
  B.innerHTML = `<button class="link cc-back" id="mb">← Desks</button><section class="card"><h2 class="h3">All campaigns · every brand</h2>
    <table class="cc-tbl"><thead><tr><th>Campaign</th><th>Brand</th><th class="r">Spend</th><th class="r">Leads</th><th class="r">CPL</th></tr></thead><tbody>
    ${c.manager.campaigns.map((x) => `<tr><td><b>${esc(x.name)}</b><div class="sub">${esc(x.platform)} · ${esc(x.status)}${x.cse ? ' · ' + esc(x.cse) : ''}</div></td><td>${esc(x.brand)}</td><td class="r">${inr(x.spend)}</td><td class="r">${num(x.leads)}</td><td class="r">${x.cpl ? inr(x.cpl) : '—'}</td></tr>`).join('') || '<tr><td colspan="5" class="empty">No campaigns</td></tr>'}</tbody></table></section>`
  B.querySelector('#mb').onclick = () => re({ mv: null })
}

// ── Accounts (company page tab + global Accounts) ──
async function accountsBody(B, company, sub, c, re) {
  B.innerHTML = `<div class="chips">${[['sell', 'Sell · invoices'], ['buy', 'Buy · suppliers'], ['spend', 'Spend · expenses']].map(([k, l]) => `<button class="chip ${sub === k ? 'on' : ''}" data-sub="${k}">${l}</button>`).join('')}</div><div id="ab">${skel}</div>`
  B.querySelectorAll('[data-sub]').forEach((b) => (b.onclick = () => re({ sub: b.dataset.sub })))
  const A = B.querySelector('#ab')
  const list = (rows, empty) => rows.length ? `<section class="card"><div class="list">${rows.slice(0, 300).map((r) => `<div class="li"><div class="nm"><b>${esc(r.title)}</b><span>${fmtDate(r.date) || '—'}${r.who ? ' · ' + esc(r.who) : ''}</span></div><div class="rc"><b>${inr(r.amount)}</b>${r.status ? `<span class="pill n">${esc(r.status)}</span>` : ''}</div></div>`).join('')}</div></section>` : `<section class="card empty">${empty}</section>`
  if (sub === 'buy') { A.innerHTML = list(c.buy, 'No purchases recorded'); return }
  if (sub === 'spend') { A.innerHTML = list(c.spend, 'No expenses recorded'); return }
  await invoicesList(A, company, null, () => re({ sub: 'sell' }))
  if (c.sell.length) A.insertAdjacentHTML('beforeend', `<h3 class="lbl" style="margin:6px 4px 0">Orders &amp; sales</h3>${list(c.sell, '')}`)
}
async function invoicesList(A, company, filter, again) {
  const { invoices } = await get('/api/cc/invoices' + (company ? '?company=' + encodeURIComponent(company) : ''))
  const old30 = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10)
  const rows = invoices.filter((i) => filter !== 'overdue' || (i.status !== 'Paid' && i.status !== 'Cancelled' && i.date <= old30))
  const k = { Paid: 'g', 'Part paid': 'o', Unpaid: 'r', Cancelled: 'n' }
  A.innerHTML = `<section class="card"><div class="row"><h2 class="h3">Invoices${filter === 'overdue' ? ' · unpaid 30+ days' : ''}</h2><span class="sp"></span><span class="sub">${rows.length}</span></div>
    <div class="list">${rows.map((i) => `<details class="cc-inv"><summary class="li"><div class="nm"><b>${esc(i.docNo || '—')} · ${esc(i.client || '')}</b><span>${fmtDate(i.date)}${company ? '' : ' · ' + esc(i.company)} · taxable ${inr(i.taxable)} + GST ${inr(i.gst)}</span></div>
      <div class="rc"><b>${inr(i.total)}</b><span class="pill ${k[i.status] || 'n'}">${i.status}${i.status === 'Part paid' ? ' · ' + inr(i.paid) : ''}</span></div></summary>
      ${i.payments.map((p) => `<div class="sub" style="padding:2px 0 2px 6px">✓ ${inr(p.amount)} · ${esc(p.mode)} · ${fmtDate(p.date)}${p.reference ? ' · ' + esc(p.reference) : ''}</div>`).join('')}
      ${i.status !== 'Paid' && i.status !== 'Cancelled' ? `<form class="cc-pay" data-inv="${esc(i.id)}"><input class="inp" name="amount" type="number" min="1" step="0.01" placeholder="₹ ${Math.round(i.total - i.paid)}" required>
        <select class="inp" name="mode"><option>UPI</option><option>NEFT</option><option>Cash</option><option>Cheque</option></select><input class="inp" name="date" type="date" value="${istDate()}"><input class="inp" name="reference" placeholder="Reference">
        <button class="btn pri sm">Add payment</button></form>` : ''}</details>`).join('') || '<div class="empty">No invoices</div>'}</div></section>`
  A.querySelectorAll('.cc-pay').forEach((f) => (f.onsubmit = async (e) => {
    e.preventDefault(); const d = Object.fromEntries(new FormData(f))
    try { await post('/api/cc/payments', { invoice_id: f.dataset.inv, ...d }); toast('Payment saved'); again() } catch (er) { toast(er.message, 'bad') }
  }))
}
export async function viewAccounts(v, go, opts = {}, viewBiz) {
  const sub = opts.sub || 'summary'
  v.innerHTML = `<div class="cc-top"><b>Accounts</b><span class="sp"></span>${switcher('acsw')}</div>
    <div class="chips">${[['summary', 'Group summary'], ['invoices', 'Invoices & payments'], ['vittiya', 'Live money · Vittiya']].map(([k, l]) => `<button class="chip ${sub === k ? 'on' : ''}" data-sub="${k}">${l}</button>`).join('')}</div><div id="acb">${skel}</div>`
  v.querySelector('#acsw').onchange = (e) => { ccState.company = e.target.value; saveState(); viewAccounts(v, go, opts, viewBiz) }
  v.querySelectorAll('[data-sub]').forEach((b) => (b.onclick = () => viewAccounts(v, go, { ...opts, sub: b.dataset.sub }, viewBiz)))
  const A = v.querySelector('#acb')
  if (sub === 'vittiya') return viewBiz(A)
  if (sub === 'summary') return viewCC(A, go, opts.X || { setTimer: () => {} })
  try { await invoicesList(A, ccState.company === 'All' ? null : ccState.company, opts.filter, () => viewAccounts(v, go, opts, viewBiz)) } catch (e) { A.innerHTML = err(e) }
}

// ═════════════════════════ DESKS ═════════════════════════
const MODS = { cargo: 'Cargo Sales & Leads', punch: 'Order Punch', bookings: 'Daily Bookings', collections: 'Bills & Collections', 'accounts-entry': 'Accounts Entry', perf: 'Performance Marketing', social: 'Social Media', 'jupiter-orders': 'Equipment Orders', fmcg: 'FMCG Orders' }
export async function viewDesks(v, go, opts = {}) {
  v.innerHTML = skel
  let D
  try { D = await get('/api/desks?company=' + encodeURIComponent(ccState.company)) } catch (e) { v.innerHTML = err(e); return }
  if (opts.create) return createDesk(v, go, opts.create === true ? (ccState.company === 'All' ? 'JDAC Logistics' : ccState.company) : opts.create)
  if (opts.desk) return deskDetail(v, go, D, opts.desk)
  const by = {}; for (const d of D.desks) (by[d.company] = by[d.company] || []).push(d)
  v.innerHTML = `<div class="cc-top"><b>Desks</b><span class="sp"></span>${switcher('dsw')}</div>
    ${Object.entries(by).map(([co, ds]) => `<h3 class="lbl" style="margin:8px 4px 0">${esc(co)} · ${ds.length} desk${ds.length === 1 ? '' : 's'}</h3>
      <div class="list cc-desks">${ds.map((d) => `<button class="cc-desk ${d.kind === 'later' ? 'later' : ''}" data-desk="${d.id}"><span class="cc-di">${esc(d.icon || '🗂️')}</span><div class="nm"><b>${esc(d.name)}</b><span>${d.kind === 'later' ? 'Om · coming later' : d.people.length ? esc(d.people.map((p) => p.name.split(' ')[0]).join(', ')) : 'no one yet'}</span></div>
        ${d.kind === 'later' ? '<span class="pill o">later</span>' : `<span class="pill ${d.people.length ? 'g' : 'n'}">${d.people.length}</span>`}</button>`).join('')}</div>`).join('') || '<section class="card empty">No desks</section>'}
    <button class="cc-dash" id="newdesk">+ Create desk</button>`
  v.querySelector('#dsw').onchange = (e) => { ccState.company = e.target.value; saveState(); viewDesks(v, go) }
  v.querySelectorAll('[data-desk]').forEach((b) => (b.onclick = () => go('desks', null, { desk: Number(b.dataset.desk) })))
  v.querySelector('#newdesk').onclick = () => go('desks', null, { create: true })
}
function deskDetail(v, go, D, id) {
  const d = D.desks.find((x) => x.id === id) || null
  if (!d) { v.innerHTML = '<section class="card empty">Desk not found (try changing the company switcher)</section>'; return }
  const on = new Set(D.access.filter((a) => a.desk_id === d.id && a.enabled).map((a) => a.emp_id))
  const emps = [...D.employees].sort((a, b) => (on.has(b.id) - on.has(a.id)) || a.name.localeCompare(b.name))
  const first = emps.find((e) => on.has(e.id))
  v.innerHTML = `<button class="link cc-back" id="back">← Desks</button>
    <div class="cc-top"><b>${esc(d.icon || '')} ${esc(d.name)}</b><span class="sp"></span><span class="pill n">${esc(d.company)}</span></div>
    <section class="card"><h2 class="h3">Open this desk</h2>
      ${d.kind === 'later' ? '<div class="sub" style="margin-top:6px">Coming later — part of Om\'s Ops panel (pickup to delivery). Old warehouse / delivery records are kept in Records.</div>'
        : `<button class="btn dark" id="admin" style="margin-top:10px">Open as admin (full view)</button>${first && ['cargo', 'bookings', 'simple', 'punch'].includes(d.kind === 'simple' ? 'simple' : d.module) ? `<button class="btn cc-dashbtn" id="viewas" style="margin-top:8px">View as ${esc(first.name)}</button>` : ''}`}</section>
    <section class="card"><div class="row"><h2 class="h3">Who has this desk</h2><span class="sp"></span><span class="sub">tap to switch</span></div>
      <div class="list">${emps.map((e) => `<div class="li"><div class="av" style="background:${avColor(e.id)};color:#fff;border-radius:50%">${esc(initials(e.name))}</div><div class="nm"><b>${esc(e.name)}</b><span>${esc(e.designation || e.team || '')}</span></div>
        <button class="cc-sw2 ${on.has(e.id) ? 'on' : ''}" data-emp="${e.id}" data-on="${on.has(e.id) ? 1 : 0}">${on.has(e.id) ? 'On' : 'Off'}</button></div>`).join('')}</div></section>
    <section class="card"><div class="row"><h2 class="h3">Rolls up to</h2><span class="sp"></span><span class="sub">group panel</span></div><div style="margin-top:6px">${esc(d.rolls_up || '')}</div>
      ${d.kind === 'simple' ? `<div class="sub" style="margin-top:6px">Fields: ${d.fields.map((f) => `${esc(f.label)} (${f.type})`).join(' · ')}</div>` : ''}</section>`
  v.querySelector('#back').onclick = () => go('desks')
  v.querySelectorAll('[data-emp]').forEach((b) => (b.onclick = async () => {
    try { await post('/api/desks/access', { desk_id: d.id, emp_id: Number(b.dataset.emp), enabled: b.dataset.on !== '1' }); toast(b.dataset.on === '1' ? 'Desk off' : 'Desk on'); go('desks', null, { desk: d.id }) } catch (e) { toast(e.message, 'bad') }
  }))
  v.querySelector('#admin')?.addEventListener('click', () => go('deskadmin', String(d.id), { desk: d }))
  v.querySelector('#viewas')?.addEventListener('click', () => (d.module === 'cargo' || d.module === 'punch' ? go('desk', first.id) : go('deskadmin', String(d.id), { desk: d, emp: first.id })))
}
function createDesk(v, go, company) {
  let kind = 'simple'
  const fields = [{ label: '', type: 'text' }]
  const paint = () => {
    v.innerHTML = `<button class="link cc-back" id="back">← Desks</button>
      <div class="cc-top"><b>+ Create desk</b><span class="sp"></span><select class="cc-sw" id="co">${COMPANIES.map((c) => `<option ${c === company ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
      <form id="cf" class="stack">
        <section class="card"><label class="f">Desk name<input class="inp" id="dn" required maxlength="60" placeholder="e.g. Website leads"></label></section>
        <section class="card"><h2 class="h3">What kind?</h2>
          <button type="button" class="cc-kind ${kind === 'ready' ? 'on' : ''}" data-k="ready"><span class="cc-di">⚙️</span><div class="nm"><b>Ready desk</b><span>pick a built screen</span></div><i></i></button>
          <button type="button" class="cc-kind ${kind === 'simple' ? 'on' : ''}" data-k="simple"><span class="cc-di">✍️</span><div class="nm"><b>Simple entry desk</b><span>you choose the fields</span></div><i></i></button></section>
        ${kind === 'ready' ? `<section class="card"><label class="f">Built screen<select class="inp" id="mod">${Object.entries(MODS).map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></label></section>`
          : `<section class="card"><h2 class="h3">Fields</h2><div id="fl" class="stack" style="margin-top:8px">${fields.map((f, i) => `<div class="cc-fr"><span>${i + 1}</span><input class="inp" data-l="${i}" value="${esc(f.label)}" placeholder="Field name">
              <select class="inp" data-t="${i}">${['text', 'number', 'money', 'date', 'choice', 'photo'].map((t) => `<option ${f.type === t ? 'selected' : ''}>${t}</option>`).join('')}</select>
              ${f.type === 'choice' ? `<input class="inp" data-o="${i}" value="${esc(f.options || '')}" placeholder="New / Live / Paid">` : ''}<button type="button" class="link" data-x="${i}">✕</button></div>`).join('')}</div>
              <button type="button" class="btn ghost sm" id="addf" style="margin-top:8px">+ Add field</button>
              <div class="cc-note">Money fields add up on the company Overview and group Home</div></section>`}
        <button class="btn dark">Save desk → give to people</button></form>`
    v.querySelector('#back').onclick = () => go('desks')
    v.querySelector('#co').onchange = (e) => { company = e.target.value }
    v.querySelectorAll('[data-k]').forEach((b) => (b.onclick = () => { sync(); kind = b.dataset.k; paint() }))
    v.querySelector('#addf')?.addEventListener('click', () => { sync(); fields.push({ label: '', type: 'text' }); paint() })
    v.querySelectorAll('[data-t]').forEach((s) => (s.onchange = () => { sync(); paint() }))
    v.querySelectorAll('[data-x]').forEach((b) => (b.onclick = () => { sync(); fields.splice(Number(b.dataset.x), 1); if (!fields.length) fields.push({ label: '', type: 'text' }); paint() }))
    v.querySelector('#cf').onsubmit = async (e) => {
      e.preventDefault(); sync()
      try { const r = await post('/api/desks', { name: v.querySelector('#dn').value, company, kind, module: v.querySelector('#mod')?.value, fields }); toast('Desk created — now switch people On'); go('desks', null, { desk: r.id }) } catch (er) { toast(er.message, 'bad') }
    }
  }
  const sync = () => {
    const dn = v.querySelector('#dn'); if (dn) sync.name = dn.value
    v.querySelectorAll('[data-l]').forEach((i) => (fields[i.dataset.l].label = i.value))
    v.querySelectorAll('[data-t]').forEach((i) => (fields[i.dataset.t].type = i.value))
    v.querySelectorAll('[data-o]').forEach((i) => (fields[i.dataset.o].options = i.value))
  }
  paint()
}

// Desk "Open as admin (full view)"
export async function viewDeskAdmin(v, go, id, opts = {}) {
  let d = opts.desk
  if (!d) { try { d = (await get('/api/desks')).desks.find((x) => String(x.id) === String(id)) } catch (e) { v.innerHTML = err(e); return } }
  if (!d) { v.innerHTML = '<section class="card empty">Desk not found</section>'; return }
  const head = `<button class="link cc-back" id="back">← ${esc(d.name)}</button><div class="cc-top"><b>${esc(d.icon || '')} ${esc(d.name)}${opts.emp ? '' : ' · all'}</b><span class="sp"></span><span class="pill n">${esc(d.company)}</span></div>`
  const back = () => go('desks', null, { desk: d.id })
  const M = d.kind === 'simple' ? 'simple' : d.module
  if (M === 'cargo') return go('company', 'JDAC Logistics', { tab: 'desks', mv: 'sales' })
  if (M === 'punch') return go('company', 'JDAC Logistics', { tab: 'desks', mv: 'ops' })
  if (M === 'collections') return go('company', 'JDAC Logistics', { tab: 'accounts', sub: 'sell' })
  if (M === 'accounts-entry') return go('company', 'JDAC Logistics', { tab: 'accounts', sub: 'spend' })
  if (M === 'perf') return go('company', 'JDAC Studios', { tab: 'desks', mv: 'campaigns' })
  const tbl = { social: 'social_posts', 'jupiter-orders': 'equipment_orders', fmcg: 'fmcg_sales' }[M]
  if (tbl) return go('old', tbl)
  v.innerHTML = head + skel
  v.querySelector('#back').onclick = back
  if (M === 'bookings') return bookingsAdmin(v, head, back, opts)
  if (M === 'simple') {
    try {
      const r = await get(`/api/desks/${d.id}/entries?all=1`)
      const F = r.desk.fields, rows = r.entries.filter((x) => !opts.emp || x.emp_id === opts.emp)
      const money = F.filter((f) => f.type === 'money')
      v.innerHTML = head + `<section class="card"><div class="row"><h2 class="h3">${rows.length} entries</h2><span class="sp"></span>${money.length ? `<b>${inr(rows.reduce((a, x) => a + x.amount, 0))}</b>` : ''}<button class="btn ghost sm" id="csv">⬇ Excel</button></div>
        <div class="sheet old"><table><thead><tr><th>Date</th><th>Person</th>${F.map((f) => `<th>${esc(f.label)}</th>`).join('')}</tr></thead><tbody>
        ${rows.map((x) => `<tr><td>${fmtDate(x.date)}</td><td>${esc(x.name || '—')}</td>${F.map((f) => `<td>${f.type === 'photo' ? (x.data[f.key] ? '📷' : '') : f.type === 'money' ? inr(x.data[f.key]) : esc(x.data[f.key] ?? '')}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${F.length + 2}" class="empty">No entries yet</td></tr>`}</tbody></table></div></section>`
      v.querySelector('#back').onclick = back
      v.querySelector('#csv').onclick = () => downloadCsv(`${d.name}.csv`, [['Date', 'Person', ...F.map((f) => f.label)], ...rows.map((x) => [x.date, x.name, ...F.map((f) => (f.type === 'photo' ? '' : x.data[f.key]))])])
    } catch (e) { v.innerHTML = head + err(e); v.querySelector('#back').onclick = back }
    return
  }
  v.innerHTML = head + '<section class="card empty">This desk will come with Om’s Ops panel</section>'
  v.querySelector('#back').onclick = back
}
async function bookingsAdmin(v, head, back, opts) {
  const st = opts.bk || { range: 'week', emp: opts.emp || '' }
  const today = istDate(), t = new Date(today + 'T00:00:00Z'); const dow = (t.getUTCDay() + 6) % 7; t.setUTCDate(t.getUTCDate() - dow)
  const from = st.range === 'today' ? today : st.range === 'week' ? t.toISOString().slice(0, 10) : st.range === 'month' ? today.slice(0, 8) + '01' : st.from || today.slice(0, 8) + '01'
  try {
    const [r, emps] = await Promise.all([get(`/api/bookings?all=1&from=${from}&to=${st.to || today}${st.emp ? '&emp=' + st.emp : ''}`), get('/api/admin/employees')])
    const tot = r.rows.reduce((a, x) => a + x.amount, 0)
    v.innerHTML = head.replace(' · all', '') + `<div class="row wrap"><select class="inp sm2" id="rg">${[['today', 'Today'], ['week', 'This week'], ['month', 'This month'], ['custom', 'Custom']].map(([k, l]) => `<option value="${k}" ${st.range === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
      ${st.range === 'custom' ? `<input class="inp sm2" type="date" id="f1" value="${from}"><input class="inp sm2" type="date" id="f2" value="${st.to || today}">` : ''}
      <select class="inp sm2" id="ce"><option value="">All CSEs</option>${emps.employees.filter((e) => e.active).map((e) => `<option value="${e.id}" ${String(st.emp) === String(e.id) ? 'selected' : ''}>${esc(e.name)}</option>`).join('')}</select><span class="sp"></span><button class="btn ghost sm" id="xl">⬇ Excel</button></div>
      <section class="card cc-money"><div class="cc-4" style="grid-template-columns:repeat(3,1fr)"><div><b>${inr(tot)}</b><span>Total</span></div><div><b>${r.rows.length}</b><span>Bookings</span></div><div><b>${inr(r.rows.length ? tot / r.rows.length : 0)}</b><span>Avg booking</span></div></div></section>
      <section class="card"><div class="row"><h2 class="h3">Per CSE</h2><span class="sp"></span><span class="sub">${fmtDate(from)} – ${fmtDate(st.to || today)}</span></div>
        <table class="cc-tbl"><thead><tr><th>CSE</th><th class="r">Bookings</th><th class="r">Amount</th><th class="r">Today</th></tr></thead><tbody>
        ${r.per_cse.map((p) => `<tr><td><b>${esc(p.name)}</b></td><td class="r">${p.bookings}</td><td class="r">${inr(p.amount)}</td><td class="r">${inr(p.today)}</td></tr>`).join('')}
        <tr><td><b>Total</b></td><td class="r"><b>${r.rows.length}</b></td><td class="r"><b>${inr(tot)}</b></td><td class="r"><b>${inr(r.per_cse.reduce((a, p) => a + p.today, 0))}</b></td></tr></tbody></table></section>
      <section class="card"><div class="row"><h2 class="h3">All entries</h2><span class="sp"></span><span class="sub">latest first</span></div>
        <div class="list">${r.rows.map((x) => `<div class="li"><div class="nm"><b>${esc(x.booking_no)}</b><span>${fmtDate(x.date)} · ${esc(x.name || '—')}</span></div><b>${inr(x.amount)}</b>
          <button class="link" data-ed="${x.id}" data-no="${esc(x.booking_no)}" data-amt="${x.amount}">Edit</button></div>`).join('') || '<div class="empty">No bookings</div>'}</div></section>
      <div class="cc-note">Today's total also shows as "CSE bookings" on Logistics Overview and Home</div>`
    const re = (o) => bookingsAdmin(v, head, back, { ...opts, bk: { ...st, ...o } })
    v.querySelector('#back').onclick = back
    v.querySelector('#rg').onchange = (e) => re({ range: e.target.value })
    v.querySelector('#ce').onchange = (e) => re({ emp: e.target.value })
    v.querySelector('#f1')?.addEventListener('change', (e) => re({ from: e.target.value }))
    v.querySelector('#f2')?.addEventListener('change', (e) => re({ to: e.target.value }))
    v.querySelector('#xl').onclick = () => downloadCsv(`daily-bookings-${from}.csv`, [['Date', 'Booking no', 'CSE', 'Amount (incl GST)'], ...r.rows.map((x) => [x.date, x.booking_no, x.name, x.amount])])
    v.querySelectorAll('[data-ed]').forEach((b) => (b.onclick = async () => {
      const a = prompt(`${b.dataset.no} — new amount (blank = delete)`, b.dataset.amt); if (a === null) return
      try { await patch('/api/bookings/' + b.dataset.ed, a === '' ? { delete: true } : { amount: Number(a) }); toast('Saved'); re({}) } catch (e) { toast(e.message, 'bad') }
    }))
  } catch (e) { v.innerHTML = head + err(e); v.querySelector('#back').onclick = back }
}

// CSE desk (view as)
export async function viewDesk(v, go, empId) {
  v.innerHTML = skel + skel
  try {
    const d = await get('/api/my/cargo?as=' + empId)
    v.innerHTML = `<button class="link cc-back" id="back">← Back</button>
    <section class="card"><div class="row"><h2 class="h3">${esc(d.for)} — Cargo Sales desk</h2><span class="sp"></span><span class="pill n">view as</span></div>
      <div class="tiles" style="margin-top:10px"><div class="tile"><b>${d.counts.new}</b><span>New leads</span></div><div class="tile"><b>${d.counts.followups}</b><span>Follow-ups</span></div><div class="tile"><b>${d.counts.quotes}</b><span>Quotes</span></div><div class="tile"><b>${d.counts.orders_today}</b><span>Orders today</span></div></div>
      <div class="tiles t3" style="margin-top:8px">${[['Today', d.today], ['Yesterday', d.yesterday], ['7 days', d.last7]].map(([l, x]) => `<div class="tile"><b>${x.orders} · ${inr(x.amount)}</b><span>${l} · ${x.calls} calls</span></div>`).join('')}</div>
      <div class="sub" style="margin-top:8px">🎯 ${d.pipeline} in pipeline · ✨ ${d.new_today} new today · 💰 ${inr(d.month_amount)} this month</div></section>
    <section class="card"><h2 class="h3">Leaderboard · profit this month</h2><table class="cc-tbl"><thead><tr><th>#</th><th>CSE</th><th class="r">Orders</th><th class="r">Profit</th><th class="r">Avg markup</th></tr></thead><tbody>
      ${d.leaderboard.map((x) => `<tr><td>${x.rank}</td><td><b>${esc(x.name)}</b></td><td class="r">${x.orders}</td><td class="r">${inr(x.profit)}</td><td class="r">${x.avg_markup == null ? '—' : x.avg_markup + '%'}</td></tr>`).join('')}</tbody></table></section>
    <section class="card"><h2 class="h3">Lead journey</h2><div class="tiles t3" style="margin-top:8px">${Object.entries(d.journey).map(([k, n]) => `<div class="tile"><b>${n}</b><span>${k}</span></div>`).join('')}</div></section>
    <section class="card"><h2 class="h3">Do now (${d.do_now_total})</h2><div class="list">${d.do_now.map((l) => `<div class="li"><div class="nm"><b>${esc(l.phone || l.name || '(no name)')}</b><span>${esc(l.name)} · ${esc(l.stage || 'New lead')} · waiting ${l.wait_h}h</span></div></div>`).join('')}</div></section>
    <section class="card"><h2 class="h3">Orders</h2><div class="list">${d.orders.map((o) => `<div class="li"><div class="nm"><b>${esc(o.customer)} · ${inr(o.amount)}</b><span>${fmtDate(o.date)} · ${esc(o.mode)} · ${o.kg} kg · cost ${o.vendor_cost ? inr(o.vendor_cost) : '—'}</span></div><div class="rc">${markChip(o.markup)}<span class="pill n">${esc(/pending/i.test(o.approval) ? 'Pending approval' : o.stage)}</span></div></div>`).join('') || '<div class="empty">No orders</div>'}</div></section>`
    v.querySelector('#back').onclick = () => history.length && go('home')
  } catch (e) { v.innerHTML = err(e) }
}

// ═════════════════════════ PEOPLE ═════════════════════════
export async function viewPeople2(v, go, X, opts = {}, tabName = 'people') {
  const sub = opts.sub || 'today'
  if (opts.bare) { v.innerHTML = `<div id="pb">${skel}</div>` } else
  v.innerHTML = `<div class="cc-top"><b>${tabName === 'team' ? 'Team' : 'People'}</b><span class="sp"></span>${switcher('psw')}</div>
    <div class="cc-tabs">${[['today', 'Today'], ['dir', 'Directory'], ['leave', 'Leave'], ['org', 'Org chart']].map(([k, l]) => `<button data-sub="${k}" class="${sub === k ? 'on' : ''}">${l}</button>`).join('')}</div><div id="pb">${skel}</div>`
  if (!opts.bare) v.querySelector('#psw').onchange = (e) => { ccState.company = e.target.value; saveState(); viewPeople2(v, go, X, opts, tabName) }
  if (!opts.bare) v.querySelectorAll('[data-sub]').forEach((b) => (b.onclick = () => (tabName === 'team' ? go('team', null, { sub: b.dataset.sub }) : viewPeople2(v, go, X, { sub: b.dataset.sub }))))
  const B = v.querySelector('#pb')
  try {
    if (sub === 'today') {
      const [t, D] = await Promise.all([get('/api/admin/today'), get('/api/desks').catch(() => ({ desks: [] }))])
      const mainDesk = {}; for (const d of D.desks) for (const p of d.people) if (!mainDesk[p.id]) mainDesk[p.id] = d.name
      const s = t.summary
      const chip = (r) => {
        if (r.status === 'leave') return '<span class="pill b">Leave</span>'
        if (r.status === 'off') return '<span class="pill n">Week off</span>'
        if (!r.session) return r.status === 'marked' ? `<span class="pill n">${esc(r.mark?.status || 'Marked')}</span>` : '<span class="pill r">Not started</span>'
        if (r.session.end_at) return `<span class="pill b">Out ${fmtTime(r.session.end_at)}</span>`
        if (r.emp.team === 'Warehouse' && r.status === 'on_duty' && r.session.total_km > 0.3) return '<span class="pill g">On route</span>'
        return r.late ? `<span class="pill o">Late ${fmtTime(r.session.start_at)}</span>` : `<span class="pill g">In ${fmtTime(r.session.start_at)}</span>`
      }
      const nIn = t.rows.filter((r) => r.session && !r.session.end_at).length, nOut = t.rows.filter((r) => r.session?.end_at).length, nLate = t.rows.filter((r) => r.session && r.late).length
      B.innerHTML = `<div class="cc-strip five"><div class="g"><b>${nIn}</b><span>In</span></div><div class="o"><b>${nLate}</b><span>Late</span></div><div class="n"><b>${nOut}</b><span>Out</span></div><div class="r"><b>${s.absent}</b><span>Not started</span></div><div class="b"><b>${s.leave}</b><span>Leave</span></div></div>
        <section class="card" style="padding:4px 14px"><div class="list">${t.rows.map((r) => `<button class="li cc-pl" data-emp="${r.emp.id}"><div class="av" style="background:${avColor(r.emp.id)};color:#fff;border-radius:50%;width:34px;height:34px">${esc(initials(r.emp.name))}</div>
          <div class="nm"><b>${esc(r.emp.name)} <span class="sub" style="display:inline">· ${esc(mainDesk[r.emp.id] || r.emp.designation || r.emp.team)}</span></b></div>${chip(r)}</button>`).join('')}</div></section>
        <div class="cc-note y">Tap a name: check-in photo, route, today's report, desks</div>`
      B.querySelectorAll('[data-emp]').forEach((b) => (b.onclick = () => X.openRoute(B, Number(b.dataset.emp), istDate())))
    } else if (sub === 'dir') {
      const [E, D] = await Promise.all([get('/api/admin/employees'), get('/api/desks')])
      const paint = (q = '') => {
        B.innerHTML = `<div class="row"><input class="inp" id="q" placeholder="Search" value="${esc(q)}" style="max-width:320px"><span class="sp"></span><button class="btn ghost sm" id="logins">Logins &amp; edit</button></div>
          <section class="card" style="padding:4px 14px"><div class="list">${E.employees.filter((e) => e.active && (!q || `${e.name} ${e.designation} ${e.username}`.toLowerCase().includes(q.toLowerCase()))).map((e) => {
            const mine = D.desks.filter((d) => d.people.some((p) => p.id === e.id))
            return `<details class="staff"><summary class="li"><div class="av" style="background:${avColor(e.id)}1A;color:${avColor(e.id)}">${esc(initials(e.name))}</div><div class="nm"><b>${esc(e.name)}</b><span>${esc([e.designation, e.team, e.work_location].filter(Boolean).join(' · '))}</span></div><span class="pill n">${mine.length} desks</span></summary>
              <div class="sub" style="margin:2px 0 6px">@${esc(e.username)}${e.phone ? ' · +91 ' + esc(e.phone) : ''} · shift ${esc(e.shift_start)}–${esc(e.shift_end)}</div>
              <b style="font-size:13px">Desks</b><div class="cc-dsw">${D.desks.filter((d) => d.kind !== 'later').map((d) => { const on = d.people.some((p) => p.id === e.id); return `<button class="cc-sw2 ${on ? 'on' : ''}" data-d="${d.id}" data-e="${e.id}" data-on="${on ? 1 : 0}">${esc(d.icon || '')} ${esc(d.name)} <small>${esc(d.company.replace('JDAC ', ''))}</small></button>` }).join('')}</div></details>`
          }).join('')}</div></section>`
        B.querySelector('#q').oninput = (ev) => { const val = ev.target.value; paint(val); const i = B.querySelector('#q'); i.focus(); i.setSelectionRange(val.length, val.length) }
        B.querySelector('#logins').onclick = () => go('staff')
        B.querySelectorAll('[data-d]').forEach((b) => (b.onclick = async () => {
          try { await post('/api/desks/access', { desk_id: Number(b.dataset.d), emp_id: Number(b.dataset.e), enabled: b.dataset.on !== '1' }); const dd = D.desks.find((x) => x.id === Number(b.dataset.d)); if (b.dataset.on === '1') dd.people = dd.people.filter((p) => p.id !== Number(b.dataset.e)); else dd.people.push({ id: Number(b.dataset.e) }); b.dataset.on = b.dataset.on === '1' ? '0' : '1'; b.classList.toggle('on') } catch (e) { toast(e.message, 'bad') }
        }))
      }
      paint()
    } else if (sub === 'leave') {
      const [{ leaves }, E] = await Promise.all([get('/api/admin/leaves'), get('/api/admin/employees')])
      const pend = leaves.filter((l) => l.status === 'Pending')
      const today = istDate(), wk = new Date(Date.parse(today) + 6 * 864e5).toISOString().slice(0, 10)
      const away = leaves.filter((l) => l.status === 'Approved' && l.date >= today && l.date <= wk)
      B.innerHTML = `<section class="card"><div class="row"><h2 class="h3">Waiting for approval</h2><span class="sp"></span><span class="sub">${pend.length}</span></div>
        ${pend.map((l) => `<div class="li"><div class="nm"><b>${esc(l.name)}</b><span>${esc(l.kind)} · ${fmtDate(l.date)} · ${esc(l.reason)}</span></div><button class="btn ghost sm" data-no="${l.id}">Reject</button><button class="btn pri sm" data-ok="${l.id}">Approve</button></div>`).join('') || '<div class="sub" style="margin-top:6px">No leave requests right now. Employees apply from their app: Me → Leave.</div>'}</section>
        <section class="card"><h2 class="h3">Away this week</h2>${away.map((l) => `<div class="li"><div class="nm"><b>${esc(l.name)}</b><span>${fmtDate(l.date)} · ${esc(l.kind)} · ${esc(l.reason)}</span></div></div>`).join('') || '<div class="sub" style="margin-top:6px">Nobody is on leave this week.</div>'}</section>
        <details class="card cc-dash2"><summary class="h3" style="justify-content:center">+ Mark leave for someone</summary>
          <form id="ml" class="cform"><label class="f">Person<select class="inp" name="emp_id">${E.employees.filter((e) => e.active).map((e) => `<option value="${e.id}">${esc(e.name)}</option>`).join('')}</select></label>
          <label class="f">Type<select class="inp" name="kind"><option>Full day</option><option>Half day</option></select></label><label class="f">From<input class="inp" type="date" name="from" required value="${today}"></label><label class="f">To<input class="inp" type="date" name="to" value="${today}"></label>
          <label class="f" style="grid-column:1/-1">Reason<input class="inp" name="reason" minlength="3" placeholder="e.g. family function"></label><button class="btn pri" style="grid-column:1/-1">Mark leave</button></form></details>`
      B.querySelectorAll('[data-ok],[data-no]').forEach((b) => (b.onclick = async () => { try { await post(`/api/admin/leaves/${b.dataset.ok || b.dataset.no}/decide`, { status: b.dataset.ok ? 'Approved' : 'Rejected' }); toast('Saved'); viewPeople2(v, go, X, { sub: 'leave' }) } catch (e) { toast(e.message, 'bad') } }))
      B.querySelector('#ml').onsubmit = async (e) => { e.preventDefault(); try { const r = await post('/api/admin/mark-leave', Object.fromEntries(new FormData(e.target))); toast(`${r.days} day leave marked`); viewPeople2(v, go, X, { sub: 'leave' }) } catch (er) { toast(er.message, 'bad') } }
    } else {
      const [E, D] = await Promise.all([get('/api/admin/employees'), get('/api/desks')])
      const act = E.employees.filter((e) => e.active)
      const deskOf = (id) => D.desks.filter((d) => d.people.some((p) => p.id === id))
      const lvl = [['Boss', act.filter((e) => e.role === 'boss')], ['Developer', act.filter((e) => e.role === 'developer')], ['HR', act.filter((e) => e.role === 'hr')]]
      const teams = {}; for (const e of act.filter((x) => x.role === 'employee')) { const k = deskOf(e.id)[0]?.company || e.team + ' team'; (teams[k] = teams[k] || []).push(e) }
      const card = (e) => `<div class="cc-oc"><div class="av" style="background:${avColor(e.id)};color:#fff;border-radius:50%;width:30px;height:30px;font-size:11px">${esc(initials(e.name))}</div><div><b>${esc(e.name)}</b><span>${esc(e.designation || '')}</span></div></div>`
      B.innerHTML = `<section class="card cc-org">${lvl.filter(([, l]) => l.length).map(([t, l]) => `<div class="cc-ol"><span class="lbl">${t}</span><div class="cc-orow">${l.map(card).join('')}</div></div>`).join('')}
        ${Object.entries(teams).map(([t, l]) => `<div class="cc-ol"><span class="lbl">${esc(t)} · ${l.length}</span><div class="cc-orow">${l.map(card).join('')}</div></div>`).join('')}</section>`
    }
  } catch (e) { B.innerHTML = err(e) }
}

// ═════════════════════════ TASKS ═════════════════════════
const PUBLIC_BASE = 'https://jdaclogistics-web.github.io/JDACTracker/f/?n='
export async function viewTasks2(v, go, opts = {}) {
  const sub = opts.sub || 'projects'
  v.innerHTML = `<div class="cc-top"><b>Tasks</b></div>
    <div class="cc-tabs">${[['projects', 'Projects'], ['forms', 'Forms'], ['calendar', 'Calendar'], ['timeline', 'Timeline']].map(([k, l]) => `<button data-sub="${k}" class="${sub === k ? 'on' : ''}">${l}</button>`).join('')}</div><div id="tb">${skel}</div>`
  v.querySelectorAll('[data-sub]').forEach((b) => (b.onclick = () => viewTasks2(v, go, { sub: b.dataset.sub })))
  const B = v.querySelector('#tb'), re = (o) => viewTasks2(v, go, { ...opts, ...o })
  const all = async (tbl) => { const out = []; for (let o = 0; ; o += 1000) { const r = await get(`/api/legacy/rows?tbl=${tbl}&limit=1000&offset=${o}`); out.push(...r.rows); if (out.length >= r.total) return out } }
  const isDone = (t) => /done|closed|complete/i.test(String(t.status))
  try {
    if (sub === 'forms') return formsView(B, re, opts, all)
    const [tasks, projects, E] = await Promise.all([all('tasks'), all('projects'), get('/api/admin/employees')])
    const nameOf = (t) => { const e = E.employees.find((x) => String(x.legacy_id) === String(t.assigneeId) || String(x.id) === String(t.assignee_emp)); return e ? e.name : '—' }
    const today = istDate()
    if (sub === 'projects') {
      const live = projects.filter((p) => !/archiv|closed/i.test(String(p.status)))
      const sel = opts.project || 'all'
      const inSel = (t) => sel === 'all' || (sel === 'null' ? !t.projectId : String(t.projectId) === String(sel))
      const ts = tasks.filter(inSel)
      const tagLib = {}; for (const t of tasks) for (const g of (Array.isArray(t.tags) ? t.tags : [])) if (g && g.n) tagLib[g.n] = g.c
      const projName = (id) => live.find((p) => String(p.id) === String(id))?.name || ''
      const cnt = (f) => tasks.filter((t) => f(t) && !isDone(t)).length
      B.innerHTML = `<div class="kb-chips">${[['all', 'All projects', cnt(() => true)], ...live.map((p) => [String(p.id), p.name, cnt((t) => String(t.projectId) === String(p.id))]), ['null', 'Other tasks', cnt((t) => !t.projectId)]]
          .map(([k, l, n]) => `<button class="${sel === k ? 'on' : ''}" data-p="${esc(k)}">${esc(l)}<small>${n}</small></button>`).join('')}</div>
        <div class="kb-bar"><span class="sub" style="margin:0">Drag a card to move it · tap a card to edit, add tags or change stage</span><span class="sp"></span><button class="btn dark sm" id="kadd">+ Add task</button></div>
        <div class="kb" id="kb">${KB_COLS.map(([k, l, c]) => { const L = ts.filter((t) => stageOf(t) === k).sort((a, b) => String(a.due || '9').localeCompare(String(b.due || '9')))
          return `<div class="kb-col" data-col="${k}" style="--c:${c}"><div class="kb-h"><i></i><b>${l}</b><small>${L.length}</small></div><div class="kb-list">${(k === 'Completed' ? L.slice(-40).reverse() : L).map((t) => kbCard(t, nameOf, today, sel === 'all' ? projName(t.projectId) : '')).join('') || '<div class="kb-empty">Drop here</div>'}</div></div>` }).join('')}</div>`
      const kb = B.querySelector('#kb'); kb.style.maxHeight = Math.max(320, innerHeight - kb.getBoundingClientRect().top - (document.querySelector('.nav')?.getBoundingClientRect().height || 0) - 14) + 'px'
      B.querySelectorAll('[data-p]').forEach((b) => (b.onclick = () => re({ project: b.dataset.p })))
      const setStage = async (rid, st) => { try { await patch('/api/legacy/rows', { tbl: 'tasks', id: rid, data: { status: st, ...(st === 'Completed' ? { closedAt: nowIso() } : {}) } }); re({}) } catch (e) { toast(e.message, 'bad') } }
      B.querySelectorAll('.kb-card').forEach((c) => {
        c.ondragstart = (e) => { e.dataTransfer.setData('text/plain', c.dataset.rid); c.classList.add('drag') }
        c.ondragend = () => c.classList.remove('drag')
        c.onclick = () => taskEditor(tasks.find((t) => String(t._rid) === c.dataset.rid), E.employees, live, tagLib, () => re({}))
      })
      B.querySelectorAll('.kb-col').forEach((col) => {
        col.ondragover = (e) => { e.preventDefault(); col.classList.add('over') }
        col.ondragleave = () => col.classList.remove('over')
        col.ondrop = (e) => { e.preventDefault(); col.classList.remove('over'); const rid = e.dataTransfer.getData('text/plain'); const t = tasks.find((x) => String(x._rid) === rid); if (t && stageOf(t) !== col.dataset.col) setStage(rid, col.dataset.col) }
      })
      B.querySelector('#kadd').onclick = () => taskEditor(null, E.employees, live, tagLib, () => re({}), sel !== 'all' && sel !== 'null' ? sel : '')
    } else if (sub === 'calendar') {
      const month = opts.month || today.slice(0, 7)
      const first = new Date(month + '-01T00:00:00Z'), days = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate(), pad = (first.getUTCDay() + 6) % 7
      const due = {}; for (const t of tasks) { const d = String(t.due || '').slice(0, 10); if (d.startsWith(month)) (due[d] = due[d] || []).push(t) }
      const sel = opts.day || today
      const prev = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() - 1, 1)).toISOString().slice(0, 7), next = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 1)).toISOString().slice(0, 7)
      B.innerHTML = `<section class="card"><div class="row"><button class="link" data-m="${prev}">‹</button><h2 class="h3 sp" style="text-align:center">${fmtDate(month + '-01', { month: 'long', year: 'numeric' })}</h2><button class="link" data-m="${next}">›</button></div>
        <div class="cc-cal">${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d) => `<i>${d}</i>`).join('')}${'<span></span>'.repeat(pad)}${Array.from({ length: days }, (_, i) => { const d = `${month}-${String(i + 1).padStart(2, '0')}`, n = (due[d] || []).length; return `<button data-day="${d}" class="${d === sel ? 'on' : ''} ${d === today ? 'td' : ''}">${i + 1}${n ? `<em>${n}</em>` : ''}</button>` }).join('')}</div></section>
        <section class="card"><h2 class="h3">${fmtDate(sel)}</h2><div class="list">${(due[sel] || []).map((t) => taskLine(t, nameOf, today)).join('') || '<div class="empty">No tasks due</div>'}</div></section>
        ${(() => { const inM = tasks.filter((t) => String(t.createdAt || '').startsWith(month) || String(t.due || '').startsWith(month)); const pj = projects.filter((p) => String(p.createdAt || '').startsWith(month))
          const groups = {}; for (const t of inM) (groups[projects.find((p) => String(p.id) === String(t.projectId))?.name || 'Other tasks'] ||= []).push(t)
          return `<section class="card"><div class="row"><h2 class="h3">All work this month</h2><span class="sp"></span><span class="sub" style="margin:0">${inM.length} tasks · ${inM.filter((t) => stageOf(t) === 'Completed').length} completed${pj.length ? ` · ${pj.length} new projects` : ''}</span></div>
            ${pj.length ? `<div class="kb-tags" style="margin:8px 0">${pj.map((p) => `<span class="kb-tag" style="--t:#4338CA">📁 ${esc(p.name)}</span>`).join('')}</div>` : ''}
            ${Object.entries(groups).map(([g, L]) => `<div class="dr-day">${esc(g)} · ${L.length}</div><div class="list">${L.map((t) => taskLine(t, nameOf, today)).join('')}</div>`).join('') || '<div class="empty">No tasks this month</div>'}</section>` })()}`
      B.querySelectorAll('[data-m]').forEach((b) => (b.onclick = () => re({ month: b.dataset.m, day: b.dataset.m + '-01' })))
      B.querySelectorAll('[data-day]').forEach((b) => (b.onclick = () => re({ month, day: b.dataset.day })))
      bindTasks(B, E.employees, () => re({}))
    } else {
      const ev = await all('task_events').catch(() => [])
      const byId = new Map(tasks.map((t) => [String(t.id), t]))
      const items = [...ev.map((e) => ({ at: String(e.createdAt), who: e.actor, text: e.action, task: byId.get(String(e.taskId))?.title })),
        ...tasks.filter((t) => String(t._rid).startsWith('n')).map((t) => ({ at: String(t.createdAt), who: t.createdBy_name || '', text: 'Task created', task: t.title }))].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 150)
      B.innerHTML = `<section class="card"><div class="cc-tl">${items.map((x) => `<div><i></i><b>${esc(x.task || 'Task')}</b><span>${esc(x.text)}${x.who ? ' · ' + esc(x.who) : ''} · ${esc(x.at.slice(0, 16))}</span></div>`).join('') || '<div class="empty">Nothing yet</div>'}</div></section>`
    }
  } catch (e) { B.innerHTML = err(e) }
}
// ── Kanban: To do · Planning · Stuck · Completed ──
const KB_COLS = [['To do', 'To do', '#64748B'], ['Planning', 'Planning', '#2563EB'], ['Stuck', 'Stuck', '#DC2626'], ['Completed', 'Completed', '#16A34A']]
const stageOf = (t) => { const s = String(t.status || ''); if (/done|closed|complete/i.test(s)) return 'Completed'; if (/stuck/i.test(s)) return 'Stuck'; if (/plan|progress/i.test(s)) return 'Planning'; return 'To do' }
const TAG_COLORS = ['#2563EB', '#16A34A', '#DC2626', '#F59E0B', '#8B5CF6', '#EC4899', '#0D9488', '#EA580C', '#475569', '#0EA5E9']
const tagHtml = (g) => `<span class="kb-tag" style="--t:${esc(g.c || '#475569')}">${esc(g.n)}</span>`
const nowIso = () => new Date().toISOString()
const kbCard = (t, nameOf, today, proj) => { const od = stageOf(t) !== 'Completed' && t.due && String(t.due).slice(0, 10) < today; const who = nameOf(t)
  return `<div class="kb-card" draggable="true" data-rid="${esc(t._rid)}">${(Array.isArray(t.tags) && t.tags.length) ? `<div class="kb-tags">${t.tags.map(tagHtml).join('')}</div>` : ''}<b>${esc(t.title)}</b>
    <div class="kb-meta">${who !== '—' ? `<span class="kb-av" style="background:${avColor(who.length)}">${esc(initials(who))}</span>${esc(who.split(' ')[0])}` : ''}${t.due ? `<span class="${od ? 'od' : ''}">📅 ${fmtDate(String(t.due).slice(0, 10), { day: 'numeric', month: 'short' })}</span>` : ''}${/high/i.test(t.priority || '') ? '<span class="hi">High</span>' : ''}</div>
    ${proj ? `<div class="kb-proj">${esc(proj)}</div>` : ''}</div>` }
function taskEditor(t, emps, projects, tagLib, again, pid = '') {
  const isNew = !t; t = t || { title: '', status: 'To do', projectId: pid, due: istDate(), priority: 'Normal', tags: [] }
  let tags = (Array.isArray(t.tags) ? t.tags : []).map((g) => ({ ...g }))
  const assignee = emps.find((e) => String(e.legacy_id) === String(t.assigneeId) || String(e.id) === String(t.assignee_emp))
  const el = document.createElement('div'); el.className = 'tm-modal'
  el.innerHTML = `<div class="tm-bg"></div><form class="tm-card cform"><div class="row" style="grid-column:1/-1"><h2 class="h3">${isNew ? 'New task' : 'Edit task'}</h2><span class="sp"></span><button type="button" class="link" data-x>Close</button></div>
    <label class="f" style="grid-column:1/-1">Title<input class="inp" name="title" value="${esc(t.title)}" required maxlength="120"></label>
    <label class="f">Stage<select class="inp" name="status">${KB_COLS.map(([k]) => `<option ${stageOf(t) === k ? 'selected' : ''}>${k}</option>`).join('')}</select></label>
    <label class="f">Assign to<select class="inp" name="emp"><option value="">—</option>${emps.filter((e) => e.active).map((e) => `<option value="${e.id}" ${assignee?.id === e.id ? 'selected' : ''}>${esc(e.name)}</option>`).join('')}</select></label>
    <label class="f">Project<select class="inp" name="projectId"><option value="">—</option>${projects.map((p) => `<option value="${esc(p.id)}" ${String(p.id) === String(t.projectId) ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></label>
    <label class="f">Due<input class="inp" type="date" name="due" value="${esc(String(t.due || '').slice(0, 10))}"></label>
    <label class="f">Priority<select class="inp" name="priority">${['Normal', 'High', 'Low'].map((x) => `<option ${x === t.priority ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
    <label class="f">Notes<input class="inp" name="notes" value="${esc(t.notes || '')}"></label>
    <div style="grid-column:1/-1" class="kb-tagbox"><b>Tags</b><div id="tg"></div>
      <div class="kb-newtag"><input class="inp" id="tn" placeholder="New tag — e.g. CSE, GovaaBazaar, Urgent" maxlength="24" list="taglib"><datalist id="taglib">${Object.keys(tagLib).map((n) => `<option>${esc(n)}</option>`).join('')}</datalist>
        <div class="kb-sw">${TAG_COLORS.map((c, i) => `<button type="button" data-c="${c}" class="${i ? '' : 'on'}" style="background:${c}"></button>`).join('')}<label class="kb-custom" title="Custom colour"><input type="color" id="tc" value="#2563EB">🎨</label></div>
        <button type="button" class="btn ghost sm" id="ta">Add tag</button></div></div>
    <button class="btn pri" style="grid-column:1/-1">${isNew ? 'Add task' : 'Save'}</button></form>`
  document.body.appendChild(el)
  const close = () => el.remove(); el.querySelector('.tm-bg').onclick = close; el.querySelector('[data-x]').onclick = close
  let color = TAG_COLORS[0]
  const paintTags = () => { el.querySelector('#tg').innerHTML = tags.map((g, i) => `<span class="kb-tag" style="--t:${esc(g.c)}">${esc(g.n)}<button type="button" data-rm="${i}">×</button></span>`).join('') || '<span class="sub" style="margin:0">No tags yet</span>'; el.querySelectorAll('[data-rm]').forEach((b) => (b.onclick = () => { tags.splice(Number(b.dataset.rm), 1); paintTags() })) }
  paintTags()
  el.querySelectorAll('[data-c]').forEach((b) => (b.onclick = () => { color = b.dataset.c; el.querySelectorAll('[data-c]').forEach((x) => x.classList.toggle('on', x === b)) }))
  el.querySelector('#tc').oninput = (e) => { color = e.target.value; el.querySelectorAll('[data-c]').forEach((x) => x.classList.remove('on')) }
  el.querySelector('#tn').oninput = (e) => { if (tagLib[e.target.value]) color = tagLib[e.target.value] }
  el.querySelector('#ta').onclick = () => { const n = el.querySelector('#tn').value.trim(); if (!n) return; if (!tags.some((g) => g.n.toLowerCase() === n.toLowerCase())) tags.push({ n, c: color }); el.querySelector('#tn').value = ''; paintTags() }
  el.querySelector('form').onsubmit = async (ev) => {
    ev.preventDefault(); const d = Object.fromEntries(new FormData(ev.target)); const emp = emps.find((x) => String(x.id) === d.emp)
    const data = { title: d.title, status: d.status, assigneeId: emp?.legacy_id ?? null, assignee_emp: emp?.id ?? null, projectId: d.projectId ? Number(d.projectId) || d.projectId : null, due: d.due, priority: d.priority, notes: d.notes, tags, ...(d.status === 'Completed' && stageOf(t) !== 'Completed' ? { closedAt: nowIso() } : {}) }
    try { if (isNew) await post('/api/legacy/rows', { tbl: 'tasks', data: { ...data, type: 'One-time' } }); else await patch('/api/legacy/rows', { tbl: 'tasks', id: t._rid, data }); toast(isNew ? 'Task added' : 'Saved'); close(); again() } catch (er) { toast(er.message, 'bad') }
  }
}
const taskLine = (t, nameOf, today) => { const done = /done|closed|complete/i.test(String(t.status)); const od = !done && t.due && String(t.due).slice(0, 10) < today
  return `<div class="li"><button class="ck ${done ? 'on' : ''}" data-done="${esc(t._rid)}" data-v="${done ? 0 : 1}" aria-label="Done">${done ? '✓' : ''}</button><div class="nm"><b style="${done ? 'text-decoration:line-through;color:#94A3B8' : ''}">${esc(t.title)}</b><span>${esc(nameOf(t))} · ${t.due ? 'due ' + fmtDate(String(t.due).slice(0, 10)) : 'no due date'}${t.repeat && t.repeat !== 'None' ? ' · 🔁 ' + esc(t.repeat) : ''}${t.priority ? ' · ' + esc(t.priority) : ''}</span></div>${od ? '<span class="pill r">overdue</span>' : ''}</div>` }
const addTaskForm = (emps, projects, pid) => `<details class="card"><summary class="h3">+ Add task</summary><form id="at" class="cform">
  <label class="f" style="grid-column:1/-1">Title<input class="inp" name="title" required maxlength="120"></label>
  <label class="f">Assign to<select class="inp" name="emp">${emps.filter((e) => e.active).map((e) => `<option value="${e.id}">${esc(e.name)}</option>`).join('')}</select></label>
  <label class="f">Project<select class="inp" name="projectId"><option value="">—</option>${projects.map((p) => `<option value="${esc(p.id)}" ${String(p.id) === String(pid) ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></label>
  <label class="f">Due<input class="inp" type="date" name="due" value="${istDate()}"></label><label class="f">Priority<select class="inp" name="priority"><option>Normal</option><option>High</option><option>Low</option></select></label>
  <label class="f">Repeat<select class="inp" name="repeat"><option>None</option><option>Daily</option><option>Weekly</option><option>Monthly</option></select></label>
  <label class="f">Notes<input class="inp" name="notes"></label><button class="btn pri" style="grid-column:1/-1">Add task</button></form></details>`
function bindTasks(B, emps, again) {
  B.querySelectorAll('[data-done]').forEach((b) => (b.onclick = async () => { try { await post('/api/my/task-done', { id: b.dataset.done, done: b.dataset.v === '1' }); again() } catch (e) { toast(e.message, 'bad') } }))
  const f = B.querySelector('#at'); if (!f) return
  f.onsubmit = async (e) => {
    e.preventDefault(); const d = Object.fromEntries(new FormData(f)); const emp = emps.find((x) => String(x.id) === d.emp)
    try { await post('/api/legacy/rows', { tbl: 'tasks', data: { title: d.title, assigneeId: emp?.legacy_id ?? null, assignee_emp: emp?.id, projectId: d.projectId ? Number(d.projectId) || d.projectId : null, due: d.due, priority: d.priority, notes: d.notes, status: 'Open', type: d.repeat === 'None' ? 'One-time' : 'Recurring', repeat: d.repeat } }); toast('Task added'); again() } catch (er) { toast(er.message, 'bad') }
  }
}
async function formsView(B, re, opts, all) {
  const { forms } = await get('/api/forms')
  if (opts.form) {
    const f = forms.find((x) => x.id === opts.form); if (!f) return re({ form: null })
    const { answers } = await get(`/api/forms/${f.id}/answers`)
    const link = PUBLIC_BASE + f.slug
    B.innerHTML = `<button class="link cc-back" id="fb">← Forms</button><div class="cc-top"><b>${esc(f.icon)} ${esc(f.title)}</b><span class="sp"></span><button class="cc-sw2 ${f.status === 'live' ? 'on' : ''}" id="st">${f.status === 'live' ? 'Live' : 'Draft'}</button></div>
      <section class="card cc-kv"><div><span>Project</span><b>${f.project_name ? esc(f.project_name) : '—'}</b></div><div><span>Each answer becomes a new</span><b>${{ lead: 'Lead', task: 'Task', entry: 'Entry' }[f.becomes]}</b></div></section>
      <section class="card"><h2 class="h3">Public link</h2><code class="cc-link">${esc(link)}</code><div class="two" style="margin-top:10px"><button class="btn dark sm" id="cp" style="width:100%">Copy link</button><a class="btn pri sm" style="width:100%" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(f.title + ' — ' + link)}">Share on WhatsApp</a></div></section>
      <section class="card"><div class="row"><h2 class="h3">Latest answers</h2><span class="sp"></span><span class="sub">${answers.length}</span></div><div class="list">${answers.map((a) => `<div class="li"><div class="nm"><b>${esc(Object.values(a.data).filter(Boolean).slice(0, 3).join(' · '))}</b><span>${esc(String(a.created_at).slice(0, 16).replace('T', ' '))}${a.result ? ' · → ' + esc(a.result.split(':')[0]) : ''}</span></div></div>`).join('') || '<div class="empty">No answers yet</div>'}</div></section>`
    B.querySelector('#fb').onclick = () => re({ form: null })
    B.querySelector('#cp').onclick = () => { navigator.clipboard?.writeText(link); toast('Link copied') }
    B.querySelector('#st').onclick = async () => { await patch(`/api/forms/${f.id}`, { status: f.status === 'live' ? 'draft' : 'live' }); re({}) }
    return
  }
  if (opts.newform) {
    const projects = await all('projects')
    const qs = [{ label: 'Your name', type: 'text', required: true }, { label: 'Phone', type: 'phone', required: true }]
    const paint = () => {
      B.innerHTML = `<button class="link cc-back" id="fb">← Forms</button><form id="nf" class="stack">
        <section class="card cform"><label class="f">Form name<input class="inp" id="t" required placeholder="e.g. Pickup request"></label>
          <label class="f">Which project are the answers for?<select class="inp" id="pj"><option value="">—</option>${projects.map((p) => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('')}</select></label>
          <label class="f">Each answer becomes a new<select class="inp" id="bc"><option value="lead">Lead</option><option value="task">Task</option><option value="entry">Entry (just saved)</option></select></label></section>
        <section class="card"><h2 class="h3">Questions</h2><div class="stack" style="margin-top:8px">${qs.map((q, i) => `<div class="cc-fr"><span>${i + 1}</span><input class="inp" data-l="${i}" value="${esc(q.label)}" placeholder="Question"><select class="inp" data-t="${i}">${['text', 'phone', 'number', 'date', 'choice', 'long'].map((t) => `<option ${q.type === t ? 'selected' : ''}>${t}</option>`).join('')}</select>
          ${q.type === 'choice' ? `<input class="inp" data-o="${i}" value="${esc(q.options || '')}" placeholder="A / B / C">` : ''}<label class="chk"><input type="checkbox" data-r="${i}" ${q.required ? 'checked' : ''}>req</label><button type="button" class="link" data-x="${i}">✕</button></div>`).join('')}</div>
          <button type="button" class="btn ghost sm" id="aq" style="margin-top:8px">+ Add question</button></section>
        <button class="btn dark">Save form &amp; get link</button></form>`
      const sync = () => { B.querySelectorAll('[data-l]').forEach((i) => (qs[i.dataset.l].label = i.value)); B.querySelectorAll('[data-t]').forEach((i) => (qs[i.dataset.t].type = i.value)); B.querySelectorAll('[data-o]').forEach((i) => (qs[i.dataset.o].options = i.value)); B.querySelectorAll('[data-r]').forEach((i) => (qs[i.dataset.r].required = i.checked)) }
      B.querySelector('#fb').onclick = () => re({ newform: false })
      B.querySelector('#aq').onclick = () => { sync(); qs.push({ label: '', type: 'text' }); paint() }
      B.querySelectorAll('[data-t]').forEach((s) => (s.onchange = () => { sync(); paint() }))
      B.querySelectorAll('[data-x]').forEach((b) => (b.onclick = () => { sync(); qs.splice(Number(b.dataset.x), 1); paint() }))
      B.querySelector('#nf').onsubmit = async (e) => {
        e.preventDefault(); sync(); const pj = B.querySelector('#pj')
        try { await post('/api/forms', { title: B.querySelector('#t').value, icon: '📝', project_id: pj.value, project_name: pj.value ? pj.selectedOptions[0].textContent : '', becomes: B.querySelector('#bc').value, fields: qs }); toast('Form live — link ready'); re({ newform: false }) } catch (er) { toast(er.message, 'bad') }
      }
    }
    return paint()
  }
  B.innerHTML = `<div class="cc-note">Forms are for people outside the company — share the public link. Internal work uses Desks.</div>
    <div class="list cc-desks">${forms.map((f) => `<button class="cc-desk" data-f="${f.id}"><span class="cc-di">${esc(f.icon)}</span><div class="nm"><b>${esc(f.title)}</b><span>${f.project_name ? esc(f.project_name) : 'No project'} · ${f.answers} answers</span></div><span class="pill ${f.status === 'live' ? 'g' : 'n'}">${f.status === 'live' ? 'Live' : 'Draft'}</span></button>`).join('') || '<section class="card empty">No forms yet</section>'}</div>
    <button class="cc-dash" id="nf">+ New form</button>`
  B.querySelectorAll('[data-f]').forEach((b) => (b.onclick = () => re({ form: Number(b.dataset.f) })))
  B.querySelector('#nf').onclick = () => re({ newform: true })
}

// ═════════════════════════ CHAT ═════════════════════════
export function viewChat(v) { injectChatCss(); return renderChatUI(v) }

// ═════════════════════════ COMMAND CENTRE (old JDAC look — Dashboard) ═════════════════════════
export const HR_CO = 'JDAC HR & Payroll'
const CC_COS = [
  ['JDAC Studios', 'mega', '#4F46E5', 'Websites, social media and performance marketing'],
  [HR_CO, 'wallet', '#16A34A', 'HR, payroll and employee records'],
  ['GovaaBazaar', 'store', '#EA580C', 'FMCG orders, stock, purchases and sales'],
  ['Jupiter Equipment', 'box', '#2563EB', 'Equipment orders, delivery, rentals and vendors'],
  ['JDAC Logistics', 'truck', '#E11D48', 'Lead journey, bookings, collections and expenses'],
]
const CC_TOOLS = [
  ['accounts', 'Accounts', 'live money & Vittiya', 'dollar', '#0D9488'],
  ['desks', 'Create employee interfaces', 'build sections & assign people', 'layout', '#4F46E5'],
  ['attendance', 'Attendance', 'today · week · month · live', 'calcheck', '#16A34A'],
  ['live', 'Live tracking', 'map & field status', 'pin', '#0D9488'],
  ['dailyreports', 'Daily reports', 'end-of-day updates', 'doc', '#2563EB'],
  ['insights', 'Insights', 'accounts: sales, profit, money in', 'bars', '#C026D3'],
]
const MOTIVATION = ['Great companies are built one good day at a time.', 'Small wins every day add up to big results.', 'Lead the team today — they follow your energy.',
  'Discipline today, growth tomorrow.', 'Every delivery on time builds a brand.', 'Focus on progress, not perfection.', 'Your team is your biggest asset — check in on them.',
  'Today’s effort is tomorrow’s profit.', 'Make it happen, then make it better.', 'Customers remember how fast and how well we served them.',
  'Strong teams win together.', 'Plan the work, then work the plan.', 'Start strong, finish stronger.', 'Growth happens outside the comfort zone.']
const motivation = () => MOTIVATION[Math.floor((Date.now() + 330 * 60000) / 864e5) % MOTIVATION.length]
export function viewCommand(v, go, role = 'boss') {
  const hr = role === 'hr'
  v.innerHTML = `
  <section class="cm-hero"><div class="cm-k">JDAC COMMAND CENTRE</div><h1>${esc(motivation())}</h1>
    <p>First see today's team. Second open the company you want to manage. Everything else stays below as a tool.</p>
    <div class="cm-3"><button data-jump="s1"><i>1</i>See team</button><button data-jump="s2"><i>2</i>Open company</button><button data-jump="s3"><i>3</i>Use tools</button></div></section>
  <div class="cm-h" id="s1"><i>1</i><div><b>First step — see today's team</b><span>Who started, who is working, who needs a push</span></div></div>
  <button class="cm-row" data-go="team-today"><span class="cm-ic" style="background:linear-gradient(135deg,#7C3AED,#C026D3)">${ic('pulse', 20, '#fff')}</span><div class="nm"><b>Who's doing what</b><span id="wdw">today's team view</span></div>${ic('chev', 18, '#9AA4B5')}</button>
  <div class="cm-h" id="s2"><i>2</i><div><b>Second step — open one company</b><span>Dashboard → money in → buying → expenses → work</span></div></div>
  <div class="cm-grid cos">${CC_COS.map(([n, i, c, sub], k) => `<button class="cm-co" data-co="${esc(n)}"><span class="cm-n">${k + 1}</span><span class="cm-ic big" style="background:${c}">${ic(i, 26, '#fff')}</span><div class="nm"><b>${esc(n)}</b><span>${esc(sub)}</span></div><span class="cm-go">→</span></button>`).join('')}</div>
  <div class="cm-h" id="s3"><i>+</i><div><b>Tools when you need them</b><span>Accounts, employee interfaces, attendance, tracking and reports</span></div></div>
  <div class="cm-grid tools">${CC_TOOLS.filter(([k]) => !(hr && (k === 'accounts' || k === 'insights'))).map(([k, l, sub, i, c]) => `<button class="cm-row" data-tool="${k}"><span class="cm-ic" style="background:${c}">${ic(i, 20, '#fff')}</span><div class="nm"><b>${l}</b><span>${sub}</span></div>${ic('chev', 18, '#9AA4B5')}</button>`).join('')}</div>`
  v.querySelectorAll('[data-jump]').forEach((b) => (b.onclick = () => v.querySelector('#' + b.dataset.jump).scrollIntoView({ behavior: 'smooth' })))
  v.querySelector('[data-go]').onclick = () => go('team', null, { sub: 'today' })
  // HR को पैसे/profit नहीं दिखते — company खोलने पर उस company के desks और लोग
  v.querySelectorAll('[data-co]').forEach((b) => (b.onclick = () => (b.dataset.co === HR_CO ? go('hr') : hr ? (ccState.company = b.dataset.co, saveState(), go('desks')) : go('company', b.dataset.co))))
  v.querySelectorAll('[data-tool]').forEach((b) => (b.onclick = () => { const [t, tbl] = b.dataset.tool.split(':'); t === 'insights' ? go('accounts', null, { sub: 'summary' }) : go(t, tbl || null) }))
  prefetch('/api/admin/employees', '/api/desks', '/api/admin/report?month=' + istDate().slice(0, 7))
  get('/api/admin/today').then((t) => { const el = v.querySelector('#wdw'); if (el) el.textContent = `today's team view · ${t.summary.in} in · ${t.summary.late} late · ${t.summary.absent} not started` }).catch(() => {})
}

// ═════════════════════════ TEAM (Directory sheet + Org chart) ═════════════════════════
const STATUS_K = { Active: 'g', Inactive: 'n', Dropped: 'r' }
const hm = (t) => { const [h, m] = String(t || '').split(':').map(Number); if (isNaN(h)) return '—'; return `${((h + 11) % 12) + 1}${m ? ':' + String(m).padStart(2, '0') : ''}${h < 12 ? 'am' : 'pm'}` }
const docPill = (x) => `<td>${x ? `<span class="doc ${/allot|submit|done|yes/i.test(x) ? 'ok' : 'wait'}">${esc(x)}</span>` : '<span class="doc no">—</span>'}</td>`
const stOf = (e) => e.status || (e.active ? 'Active' : 'Inactive')
const nextCode = (list) => 'JD' + (Math.max(1000, ...list.map((e) => Number(String(e.emp_code || '').replace(/^JD/i, '')) || 0)) + 1)
// Keep the page itself still: only the table scrolls, sized to the screen
function fitToScreen(el, extra = 12) {
  const fit = () => { if (!el.isConnected) return removeEventListener('resize', fit); const nav = document.querySelector('.nav'); const navH = nav && getComputedStyle(nav).position === 'fixed' ? nav.getBoundingClientRect().height : 0; el.style.maxHeight = Math.max(240, innerHeight - el.getBoundingClientRect().top - navH - extra) + 'px' }
  fit(); addEventListener('resize', fit)
}
export async function viewTeam(v, go, X, opts = {}) {
  const sub = opts.sub || 'dir'
  if (sub === 'today' || sub === 'leave') return viewPeople2(v, go, X, opts, 'team')
  v.innerHTML = `<div class="cc-top"><b>Team</b><span class="sp"></span></div>
    <div class="cc-tabs">${[['today', 'Today'], ['dir', 'Directory'], ['leave', 'Leave'], ['org', 'Org chart']].map(([k, l]) => `<button data-sub="${k}" class="${sub === k ? 'on' : ''}">${l}</button>`).join('')}</div><div id="tb">${skel}</div>`
  v.querySelectorAll('[data-sub]').forEach((b) => (b.onclick = () => go('team', null, { sub: b.dataset.sub })))
  const B = v.querySelector('#tb')
  try {
    const E = await get('/api/admin/employees')
    const all = E.employees
    const salOf = (e) => Number(e.salary_inhand) || 0
    const lpa = (m) => (m ? (m * 12 / 100000).toFixed(2) + ' LPA' : '—')
    if (sub === 'org') return orgChart(B, all.filter((e) => e.active && e.role !== 'developer'))
    const st = opts.st || 'Active'
    const list = all.filter((e) => st === 'All' || stOf(e) === st)
      .sort((a, b) => String(a.joining_date || '9999').localeCompare(String(b.joining_date || '9999')) || String(a.emp_code || '').localeCompare(String(b.emp_code || '')) || a.name.localeCompare(b.name))
    const again = () => go('team', null, { sub: 'dir', st })
    const paint = (q) => {
      const L = list.filter((e) => !q || `${e.name} ${e.designation} ${e.username} ${e.phone} ${e.emp_code}`.toLowerCase().includes(q.toLowerCase()))
      const tot = L.reduce((a, e) => a + salOf(e), 0)
      B.innerHTML = `<div class="tm-bar"><input class="inp" id="q" placeholder="Search name, ID, phone" value="${esc(q)}">
          <div class="chips">${['Active', 'Inactive', 'Dropped', 'All'].map((x) => `<button class="chip ${st === x ? 'on' : ''}" data-st="${x}">${x} <small>${all.filter((e) => x === 'All' || stOf(e) === x).length}</small></button>`).join('')}</div>
          <span class="sp"></span><button class="btn ghost sm" id="up">⬆ Upload sheet</button><input type="file" id="upf" accept=".xlsx,.xls,.csv" hidden><button class="btn ghost sm" id="xl">⬇ Excel</button><button class="btn dark sm" id="add">+ Add person</button></div>
        <div class="tm-sum"><span><b>${L.length}</b> people</span><span>Monthly salary <b>${inr(tot)}</b></span><span>Yearly <b>${inrL(tot * 12)}</b></span></div>
        <div class="tm-wrap" id="tw"><table class="tds"><thead><tr><th>Emp ID</th><th>Name</th><th>Status</th><th>Designation</th><th>Joining</th><th>Exit</th><th>Contact</th><th>Time</th><th>City</th><th class="num">Salary in hand</th><th class="num">LPA</th><th>Offer letter</th><th>Appointment</th><th>Documents</th><th>Tracker login</th><th>View · Edit</th></tr></thead><tbody>
        ${L.map((e) => { const m = salOf(e)
          return `<tr><td><b class="tds-id">${esc(e.emp_code || '—')}</b></td><td><div class="tm-n"><span class="av" style="background:${avColor(e.id)};color:#fff">${esc(initials(e.name))}</span><div><b>${esc(e.name)}</b><span>${esc(e.department || e.team)}</span></div></div></td>
            <td><span class="pill ${STATUS_K[stOf(e)]}">${stOf(e)}</span></td><td>${esc(e.designation || '—')}</td>
            <td>${e.joining_date ? fmtDate(e.joining_date) : '—'}</td><td>${e.exit_date ? fmtDate(e.exit_date) : '—'}</td><td>${e.phone ? '+91 ' + esc(e.phone) : '—'}</td>
            <td>${esc(hm(e.shift_start))} – ${esc(hm(e.shift_end))}</td><td>${esc(e.work_location || '—')}</td>
            <td class="num"><b>${m ? inr(m) : '—'}</b></td><td class="num">${lpa(m)}</td>${[e.offer_letter, e.appointment_letter, e.documents].map(docPill).join('')}
            <td><code>${esc(e.username)}</code><div class="sub">${e.login_mode === 'phone' ? 'password: mobile no.' : e.login_mode === 'locked' ? 'login not set' : 'custom password'}</div></td><td><div class="row" style="gap:6px;flex-wrap:nowrap"><button class="btn ghost sm" data-vw="${e.id}" title="View ${esc(e.name)}'s page" aria-label="View page">👁</button><button class="btn ghost sm" data-ed="${e.id}">Edit</button></div></td></tr>` }).join('') || '<tr><td colspan="16" class="empty">No one here</td></tr>'}</tbody></table></div>`
      fitToScreen(B.querySelector('#tw'))
      const qi = B.querySelector('#q'); qi.oninput = () => { const val = qi.value; paint(val); const i = B.querySelector('#q'); i.focus(); i.setSelectionRange(val.length, val.length) }
      B.querySelectorAll('[data-st]').forEach((b) => (b.onclick = () => go('team', null, { sub: 'dir', st: b.dataset.st })))
      B.querySelector('#add').onclick = () => editPerson(null, all, again)
      B.querySelector('#up').onclick = () => B.querySelector('#upf').click()
      B.querySelector('#upf').onchange = (ev) => uploadSheet(ev.target.files?.[0], again)
      B.querySelector('#xl').onclick = () => downloadCsv('jdac-team-directory.csv', [['Emp ID', 'Name', 'Status', 'Designation', 'Joining date', 'Exit date', 'Contact', 'Time', 'City', 'Salary in hand', 'LPA', 'Offer letter', 'Appointment', 'Documents', 'Tracker User ID'],
        ...L.map((e) => [e.emp_code, e.name, stOf(e), e.designation, e.joining_date, e.exit_date, e.phone, `${hm(e.shift_start)} to ${hm(e.shift_end)}`, e.work_location, salOf(e) || '', salOf(e) ? (salOf(e) * 12 / 100000).toFixed(2) : '', e.offer_letter, e.appointment_letter, e.documents, e.username])])
      B.querySelectorAll('[data-ed]').forEach((b) => (b.onclick = () => editPerson(all.find((x) => x.id === Number(b.dataset.ed)), all, again)))
      B.querySelectorAll('[data-vw]').forEach((b) => (b.onclick = () => go('emppage', Number(b.dataset.vw))))
    }
    paint(opts.q || '')
  } catch (e) { B.innerHTML = err(e) }
}
// Upload an Excel / CSV sheet → matched by Emp ID (or name) and updated
const COLMAP = [[/emp.?id|emp.?code|^id$/i, 'emp_code'], [/^name/i, 'name'], [/status/i, 'status'], [/design/i, 'designation'], [/depart/i, 'department'], [/join/i, 'joining_date'], [/exit|leav/i, 'exit_date'],
  [/contact|mobile|phone/i, 'phone'], [/time|shift/i, 'time'], [/city|location/i, 'work_location'], [/salary/i, 'salary_inhand'], [/offer/i, 'offer_letter'], [/appoint/i, 'appointment_letter'], [/document/i, 'documents']]
const MON = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 }
function toIso(x) {
  if (x == null || x === '') return ''
  if (typeof x === 'number') return new Date(Math.round((x - 25569) * 864e5)).toISOString().slice(0, 10) // Excel date number
  const s = String(x).trim(); let m
  if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`
  if ((m = s.match(/^(\d{1,2})[-/ ]([A-Za-z]{3})[A-Za-z]*[-/ ,]+(\d{2,4})$/))) return `${m[3].length === 2 ? '20' + m[3] : m[3]}-${String(MON[m[2].toLowerCase()]).padStart(2, '0')}-${m[1].padStart(2, '0')}`
  if ((m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/))) return `${m[3].length === 2 ? '20' + m[3] : m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  return ''
}
const to24 = (t) => { const m = String(t).trim().match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i); if (!m) return ''; let h = Number(m[1]); if (/pm/i.test(m[3] || '') && h < 12) h += 12; if (/am/i.test(m[3] || '') && h === 12) h = 0; return `${String(h).padStart(2, '0')}:${m[2] || '00'}` }
async function uploadSheet(file, again) {
  if (!file) return
  try {
    toast('Reading the sheet…')
    const XLSX = await import(/* @vite-ignore */ 'https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs')
    const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' })
    const raw = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: true, defval: '' })
    const hi = raw.findIndex((r) => r.some((c) => /name/i.test(String(c))) && r.some((c) => /status|design|contact|join/i.test(String(c))))
    if (hi < 0) return toast('Could not find the header row (Name, Status, Designation…)', 'bad')
    const cols = raw[hi].map((h) => (COLMAP.find(([re]) => re.test(String(h).trim())) || [])[1] || null)
    const rows = raw.slice(hi + 1).map((r) => { const o = {}; cols.forEach((k, i) => { if (k && !(k in o)) o[k] = r[i] }); return o }).filter((o) => String(o.name || o.emp_code || '').trim())
      .map((o) => { const [a, b] = String(o.time || '').split(/\s*(?:to|-|–)\s*/i); return { ...o, joining_date: toIso(o.joining_date), exit_date: toIso(o.exit_date), shift_start: a ? to24(a) : '', shift_end: b ? to24(b) : '', phone: String(o.phone || '').replace(/\D/g, '').replace(/^91(\d{10})$/, '$1'), salary_inhand: o.salary_inhand } })
    if (!rows.length) return toast('No people found in the sheet', 'bad')
    if (!confirmBox(`Update the directory from "${file.name}"? ${rows.length} rows found. People are matched by Emp ID (or name); new IDs are added as new people.`)) return
    const r = await post('/api/admin/directory-import', { rows })
    toast(`Done — ${r.updated} updated, ${r.added} added${r.skipped.length ? ` · ${r.skipped.length} need a check` : ''}`)
    if (r.skipped.length) setTimeout(() => toast(r.skipped.slice(0, 3).join(' · '), 'bad'), 1800)
    again()
  } catch (e) { toast('Could not read the sheet: ' + e.message, 'bad') }
}
const confirmBox = (msg) => window.confirm(msg)
function editPerson(e, all, again) {
  const isNew = !e
  e = e || { name: '', status: 'Active', emp_code: nextCode(all), shift_start: '10:00', shift_end: '19:00', work_location: 'Pune HO', team: 'Office' }
  const el = document.createElement('div'); el.className = 'tm-modal'
  const sel = (n, l) => `<label class="f">${l}<select class="inp" name="${n}">${['', 'Allotted', 'Pending', 'Submitted', 'Not required'].map((x) => `<option ${x === (e[n] || '') ? 'selected' : ''} value="${x}">${x || '—'}</option>`).join('')}</select></label>`
  el.innerHTML = `<div class="tm-bg"></div><form class="tm-card cform"><div class="row" style="grid-column:1/-1"><h2 class="h3">${isNew ? 'Add person' : esc(e.name)}</h2><span class="sp"></span><button type="button" class="link" data-x>Close</button></div>
    <label class="f">Emp ID<input class="inp" name="emp_code" value="${esc(e.emp_code || '')}" placeholder="JD1028" required></label>
    <label class="f">Name<input class="inp" name="name" value="${esc(e.name)}" required></label>
    <label class="f">Status<select class="inp" name="status">${['Active', 'Inactive', 'Dropped'].map((x) => `<option ${x === stOf(e) ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
    <label class="f">Designation<input class="inp" name="designation" value="${esc(e.designation || '')}"></label>
    <label class="f">Department<input class="inp" name="department" value="${esc(e.department || '')}" list="deps" placeholder="Customer Success"></label>
    <datalist id="deps">${[...new Set(all.map((x) => x.department).filter(Boolean))].map((d) => `<option>${esc(d)}</option>`).join('')}</datalist>
    <label class="f">Team<select class="inp" name="team">${['Office', 'Warehouse'].map((x) => `<option ${x === e.team ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
    <label class="f">Contact (10 digit)<input class="inp" name="phone" value="${esc(e.phone || '')}" inputmode="numeric" maxlength="10"></label>
    <label class="f">Joining date<input class="inp" type="date" name="joining_date" value="${esc(e.joining_date || '')}"></label>
    <label class="f">Exit date<input class="inp" type="date" name="exit_date" value="${esc(e.exit_date || '')}"></label>
    <label class="f">Salary in hand (₹ / month)<input class="inp" type="number" min="0" name="salary_inhand" value="${e.salary_inhand || ''}"></label>
    <label class="f">City<select class="inp" name="work_location">${['Pune HO', 'Pune Camp', 'Goa', 'Mumbai', 'Delhi'].map((x) => `<option ${x === e.work_location ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
    <label class="f">Time from<input class="inp" type="time" name="shift_start" value="${esc(e.shift_start || '10:00')}"></label>
    <label class="f">Time to<input class="inp" type="time" name="shift_end" value="${esc(e.shift_end || '19:00')}"></label>
    ${sel('offer_letter', 'Offer letter')}${sel('appointment_letter', 'Appointment letter')}${sel('documents', 'Documents')}
    <div class="tm-pw" style="grid-column:1/-1"><b>JDAC Tracker login</b>
      <span>User ID = <b id="uid">${esc(isNew ? e.emp_code : e.username)}</b> · Password = their 10-digit mobile number${!isNew && e.login_mode === 'custom' ? ' (currently a custom password is set)' : ''}</span>
      ${isNew ? '' : `<div class="row" style="gap:8px;flex-wrap:wrap"><button type="button" class="btn ghost sm" id="pwm">Use mobile number as password</button><button type="button" class="btn ghost sm" id="pw">Set a custom password</button></div><code id="pwv" hidden></code>`}</div>
    <div class="sub" style="grid-column:1/-1">Setting Inactive / Dropped closes their login and removes them from the team list. Old data (attendance etc.) is kept.</div>
    <button class="btn pri" style="grid-column:1/-1">${isNew ? 'Add person' : 'Save'}</button></form>`
  document.body.appendChild(el)
  const close = () => el.remove()
  el.querySelector('.tm-bg').onclick = close; el.querySelector('[data-x]').onclick = close
  if (isNew) el.querySelector('[name=emp_code]').oninput = (ev) => (el.querySelector('#uid').textContent = ev.target.value.toUpperCase())
  let newPw = null, usePhone = false
  el.querySelector('#pwm')?.addEventListener('click', () => { usePhone = true; newPw = null; const p = el.querySelector('#pwv'); p.hidden = false; p.textContent = `User ID ${e.emp_code || e.username} · password = mobile number — applies when you press Save` })
  el.querySelector('#pw')?.addEventListener('click', () => { const c = 'abcdefghjkmnpqrstuvwxyz23456789'; newPw = 'JDAC' + Array.from(crypto.getRandomValues(new Uint8Array(5)), (x) => c[x % c.length]).join(''); usePhone = false; const p = el.querySelector('#pwv'); p.hidden = false; p.textContent = `${e.username} / ${newPw} — applies when you press Save` })
  el.querySelector('form').onsubmit = async (ev) => {
    ev.preventDefault(); const d = Object.fromEntries(new FormData(ev.target)); d.emp_code = d.emp_code.trim().toUpperCase()
    try {
      if (isNew) {
        const r = await post('/api/admin/employees', { ...d, username: d.emp_code })
        if (d.status !== 'Active') { const n = (await get('/api/admin/employees', { fresh: true })).employees.find((x) => x.username === r.username); if (n) await patch('/api/admin/employees/' + n.id, { status: d.status, exit_date: d.exit_date }) }
        navigator.clipboard?.writeText(`JDAC Tracker login\nUser ID: ${r.username}\nPassword: your 10-digit mobile number`).catch(() => {})
        toast(`Added — User ID ${r.username}, password = mobile number (copied)`)
      } else {
        // Emp ID change also moves the login User ID when it was the Emp ID
        const body = { ...d, ...(e.username === e.emp_code && d.emp_code && d.emp_code !== e.emp_code ? { username: d.emp_code } : {}), ...(newPw ? { new_password: newPw } : {}), ...(usePhone ? { password_phone: true } : {}) }
        await patch('/api/admin/employees/' + e.id, body)
        if (newPw) navigator.clipboard?.writeText(`JDAC Tracker login\nUser ID: ${body.username || e.username}\nPassword: ${newPw}`).catch(() => {})
        toast(newPw ? 'Saved — login details copied' : 'Saved')
      }
      close(); again()
    } catch (er) { toast(er.message, 'bad') }
  }
}
// Org chart — premium hierarchy: Director → HR → departments (lead first)
const DEP_STYLE = { Operations: ['#0EA5E9', 'route'], 'Customer Success': ['#8B5CF6', 'chat'], Marketing: ['#EC4899', 'mega'], Accounts: ['#14B8A6', 'dollar'], 'Delivery team': ['#F59E0B', 'truck'], 'Govaa Bazaar Warehouse': ['#22C55E', 'store'], 'Medical sales': ['#EF4444', 'box'] }
const LEAD_RE = /manager|incharge|head|lead/i
function orgChart(B, emps) {
  const boss = emps.filter((e) => e.role === 'boss')
  const hrs = emps.filter((e) => e.role === 'hr' || e.department === 'HR').sort((a, b) => (LEAD_RE.test(b.designation || '') ? 1 : 0) - (LEAD_RE.test(a.designation || '') ? 1 : 0))
  const staff = emps.filter((e) => e.role === 'employee' && e.department !== 'HR')
  const groups = {}; for (const e of staff) (groups[e.department || (e.team === 'Warehouse' ? 'Delivery team' : 'Office team')] ||= []).push(e)
  const order = ['Operations', 'Customer Success', 'Marketing', 'Accounts', 'Delivery team', 'Govaa Bazaar Warehouse', 'Medical sales']
  const deps = Object.entries(groups).sort((a, b) => ((order.indexOf(a[0]) + 1 || 99) - (order.indexOf(b[0]) + 1 || 99)))
  const av = (e, s = 40) => `<span class="oc-av" style="width:${s}px;height:${s}px;background:${avColor(e.id)}">${esc(initials(e.name))}</span>`
  B.innerHTML = `<section class="oc2">
    <div class="oc2-top">${boss.map((e) => `<div class="oc2-boss">${av(e, 58)}<div><b>${esc(e.name)}</b><span>Director</span></div></div>`).join('')}</div>
    <div class="oc2-stem"></div>
    <div class="oc2-hr"><div class="oc2-lbl">Human Resources</div><div class="oc2-hrrow">${hrs.map((e, i) => `${i ? '<span class="oc2-arrow">→</span>' : ''}<div class="oc2-card ${i ? '' : 'lead'}">${av(e)}<div><b>${esc(e.name)}</b><span>${esc(e.designation || 'HR')}</span></div></div>`).join('')}</div></div>
    <div class="oc2-stem"></div>
    <div class="oc2-lbl c">Departments · ${staff.length} people</div>
    <div class="oc2-deps">${deps.map(([d, l]) => { const [c, i] = DEP_STYLE[d] || ['#64748B', 'grid']; const lead = l.filter((e) => LEAD_RE.test(e.designation || '')), rest = l.filter((e) => !lead.includes(e))
      return `<div class="oc2-dep" style="--c:${c}"><div class="oc2-dh"><span class="oc2-di">${ic(i, 18, '#fff')}</span><b>${esc(d)}</b><small>${l.length}</small></div>
        ${lead.map((e) => `<div class="oc2-p lead">${av(e, 34)}<div><b>${esc(e.name)}</b><span>${esc(e.designation || '')}</span></div><em>Lead</em></div>`).join('')}
        ${rest.map((e) => `<div class="oc2-p">${av(e, 30)}<div><b>${esc(e.name)}</b><span>${esc(e.designation || '')}</span></div></div>`).join('')}</div>` }).join('')}</div>
  </section>`
}

// ═════════════════════════ HR & PAYROLL (pehle SalaryMitra) ═════════════════════════
export async function viewHR(v, go, opts = {}) {
  const sub = opts.sub || 'employees'
  v.innerHTML = `<button class="link cc-back" id="back">← Dashboard</button>
    <section class="cc-co" style="background:linear-gradient(120deg,#16A34A,#047857)"><div class="row"><span class="cc-coi">${ic('wallet', 22, '#fff')}</span><div class="sp"><b>${HR_CO}</b><span>HR, payroll and employee records</span></div></div><div class="cc-4 w" id="hrk"></div></section>
    <div class="cc-tabs">${[['employees', 'Employees'], ['payroll', 'Payroll'], ['billing', 'HR billing'], ['records', 'Records']].map(([k, l]) => `<button data-sub="${k}" class="${sub === k ? 'on' : ''}">${l}</button>`).join('')}</div><div id="hb">${skel}</div>`
  v.querySelector('#back').onclick = () => go('home')
  v.querySelectorAll('[data-sub]').forEach((b) => (b.onclick = () => go('hr', null, { sub: b.dataset.sub })))
  const B = v.querySelector('#hb')
  const rows = async (tbl) => { const out = []; for (let o = 0; ; o += 1000) { const r = await get(`/api/legacy/rows?tbl=${tbl}&limit=1000&offset=${o}`).catch(() => ({ rows: [], total: 0 })); out.push(...r.rows); if (out.length >= r.total) return out } }
  try {
    const [E, sal, inv, hre] = await Promise.all([get('/api/admin/employees'), rows('salary_records'), rows('hr_invoices'), rows('hr_employees')])
    const months = [...new Set(sal.map((s) => String(s.month)))].sort().reverse()
    const last = months[0]
    const lastTot = sal.filter((s) => String(s.month) === last).reduce((a, s) => a + (Number(s.fixedSalary) || 0), 0)
    v.querySelector('#hrk').innerHTML = `<div><b>${E.employees.filter((e) => e.active).length}</b><span>Employees</span></div><div><b>${inrL(lastTot)}</b><span>Payroll ${esc(last || '')}</span></div><div><b>${hre.length}</b><span>Placed (billing)</span></div><div><b>${inrL(inv.reduce((a, i) => a + (Number(i.total) || 0), 0))}</b><span>HR billed</span></div>`
    if (sub === 'employees') { B.innerHTML = '<div id="tm"></div>'; return viewTeam(B.querySelector('#tm'), go, {}, { sub: 'dir' }) }
    if (sub === 'payroll') {
      const m = opts.month || last
      const list = sal.filter((s) => String(s.month) === m)
      B.innerHTML = `<div class="row"><select class="inp sm2" id="pm">${months.map((x) => `<option ${x === m ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select><span class="sp"></span><b>${inr(list.reduce((a, s) => a + (Number(s.fixedSalary) || 0), 0))}</b><button class="btn ghost sm" id="xl">⬇ Excel</button></div>
        <section class="card"><table class="cc-tbl"><thead><tr><th>Emp</th><th>Department</th><th class="r">Fixed</th><th class="r">DA</th><th class="r">TA</th></tr></thead><tbody>
        ${list.map((s) => `<tr><td><b>${esc((E.employees.find((e) => String(e.legacy_id) === String(s.personId)) || {}).name || s.empCode || s.personId)}</b><div class="sub">${esc(s.empCode || '')} · ${esc(s.designation || '')}</div></td><td>${esc(s.department || '')}</td><td class="r">${inr(Number(s.fixedSalary) || 0)}</td><td class="r">${inr(Number(s.daLocalRate) || 0)}</td><td class="r">${inr(Number(s.taRate) || 0)}</td></tr>`).join('') || '<tr><td colspan="5" class="empty">No payroll for this month</td></tr>'}</tbody></table>
        <div class="sub" style="margin-top:6px">Payroll processing is on hold — this shows the salary records already on file.</div></section>`
      B.querySelector('#pm').onchange = (e) => go('hr', null, { sub: 'payroll', month: e.target.value })
      B.querySelector('#xl').onclick = () => downloadCsv(`payroll-${m}.csv`, [['Emp code', 'Name', 'Department', 'Designation', 'Fixed', 'DA local', 'TA'], ...list.map((s) => [s.empCode, (E.employees.find((e) => String(e.legacy_id) === String(s.personId)) || {}).name, s.department, s.designation, s.fixedSalary, s.daLocalRate, s.taRate])])
      return
    }
    if (sub === 'billing') {
      B.innerHTML = `<section class="card"><div class="row"><h2 class="h3">HR billing invoices</h2><span class="sp"></span><span class="sub">${inv.length}</span></div><div class="list">${inv.sort((a, b) => String(b.invoiceDate).localeCompare(String(a.invoiceDate))).map((i) => `<div class="li"><div class="nm"><b>${esc(i.invoiceNo)}</b><span>${fmtDate(String(i.invoiceDate).slice(0, 10))} · due ${fmtDate(String(i.dueDate).slice(0, 10))}</span></div><div class="rc"><b>${inr(Number(i.total))}</b><span class="pill ${/paid/i.test(i.status) ? 'g' : 'o'}">${esc(i.status === 'sent' ? 'Unpaid' : i.status)}</span></div></div>`).join('') || '<div class="empty">No invoices</div>'}</div></section>
        <section class="card"><div class="row"><h2 class="h3">Placed candidates</h2><span class="sp"></span><span class="sub">${hre.length}</span></div><div class="list">${hre.slice(0, 100).map((e) => `<div class="li"><div class="nm"><b>${esc(e.name)}</b><span>${esc(e.empId || '')} · ${esc(e.designation || '')} · joined ${e.joiningDate ? fmtDate(String(e.joiningDate).slice(0, 10)) : '—'}</span></div><b>${inr(Number(e.monthlySalary) || 0)}</b></div>`).join('')}</div></section>`
      return
    }
    B.innerHTML = `<section class="card"><div class="cc-todo">${[['employee_master', 'Employee master'], ['salary_records', 'Salary records'], ['hr_employees', 'HR billing — candidates'], ['hr_invoices', 'HR billing — invoices'], ['hr_companies', 'HR clients'], ['expense_claims', 'Expense claims'], ['notices', 'Notices']].map(([t, l]) => `<button data-t="${t}"><b>${l}</b><span>open records · add / edit</span></button>`).join('')}</div></section>`
    B.querySelectorAll('[data-t]').forEach((b) => (b.onclick = () => go('old', b.dataset.t)))
  } catch (e) { B.innerHTML = err(e) }
}

// ═════════════════════════ EMPLOYEE PAGE (what the employee sees — read-only for Boss / HR) ═════════════════════════
export async function viewEmpPage(v, id) {
  v.innerHTML = skel
  try {
    const h = await get('/api/my/home?as=' + id)
    const hr = Number(new Date(Date.now() + 330 * 60000).getUTCHours())
    const greet = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening'
    const pct = h.tasks_total ? Math.round((h.tasks_done / h.tasks_total) * 100) : 100
    const dayTxt = !h.day ? 'Not started' : h.day.end_at ? '✅ Closed' : '🟢 Working'
    const icons = { cargo: '🚚', bookings: '📒', collections: '💰', punch: '🧾', social: '📣', perf: '📈', fmcg: '🛒', 'jupiter-orders': '🏥', 'accounts-entry': '📊', simple: '📝' }
    v.innerHTML = `<div class="ep-view">
      <div class="ep-note">👁 Viewing ${esc(h.name)}'s page (read-only) — this is what they see in their app${h.emp_code ? ' · ' + esc(h.emp_code) : ''}</div>
      <section class="ep-hero"><div class="ep-top"><span class="av">${esc(initials(h.name))}</span><div><b>${greet}, ${esc(h.name.split(' ')[0])} 👋</b><span>${esc(h.designation || h.team || '')}</span></div><span class="ep-st">${dayTxt}</span></div>
        <div class="ep-prog">🏆 ${pct}%<span class="bar"><i style="width:${pct}%"></i></span>${h.tasks_done}/${h.tasks_total} tasks</div>
        <div class="ep-stats"><div><b>${h.entries}</b><span>entries</span></div><div><b>${h.day ? (h.day.total_km || 0).toFixed(1) : '0'}</b><span>km</span></div><div><b>${h.overdue}</b><span>overdue</span></div></div></section>
      <section class="ep-card"><h3>Your work, in order</h3><p class="sub">Start the day, finish tasks, fill your section, then submit.</p>
        <div class="ep-steps"><div><i>▶️</i>1. Start day</div><div><i>📋</i>2. Tasks</div><div><i>🗂️</i>3. Sections</div><div><i>📅</i>4. Calendar</div></div></section>
      <section class="ep-card ep-desks"><h3>Desks</h3><p class="sub">Only the work the boss gave appears here.</p>
        ${h.desks.map((d) => `<div class="ep-row"><span class="ic">${icons[d.module] || d.icon || '🗂️'}</span><div><b>${esc(d.name)}</b><span>${esc(d.description || d.company || '')}</span></div><span class="pill n">Open</span></div>`).join('') || '<div class="empty">No desks switched on</div>'}</section>
      <section class="ep-card"><div class="row"><h3>⏭ Up next</h3><span class="sp"></span><span class="sub" style="margin:0">${h.up_next.length} open</span></div>
        ${h.up_next.slice(0, 8).map((t) => `<div class="ep-row"><span class="ic" style="background:#EEF2FF">📌</span><div><b>${esc(t.title)}</b><span>${t.due ? 'due ' + fmtDate(t.due) : 'no due date'}${t.priority ? ' · ' + esc(t.priority) : ''}</span></div>${t.due && t.due < istDate() ? '<span class="pill r">overdue</span>' : ''}</div>`).join('') || '<p class="sub">Nothing pending — enjoy the clear day ✨</p>'}</section>
      <section class="ep-card"><div class="row"><h3>My projects</h3><span class="sp"></span><span class="sub" style="margin:0">${h.projects.length}</span></div>
        ${h.projects.map((p) => `<div class="ep-row"><span class="ic">📁</span><div><b>${esc(p.name)}</b><span>${p.open} open tasks · ${p.members} members</span></div></div>`).join('') || '<p class="sub">No projects</p>'}</section>
    </div>`
  } catch (e) { v.innerHTML = err(e) }
}

// "My orders" — punch an order (customer / shop + amount), see today / week / month, and a calendar that shows the days with no order.
// Used in the employee app (Tasks → Orders) and, read-only, on the admin's employee page ({ as: employeeId }).
import { get, post, patch } from './api.js'
import { esc, toast, istDate, fmtDate } from './util.js'

const inr = (n) => '₹' + Math.round(n || 0).toLocaleString('en-IN')
const CSS = `
.od-k{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.od-k div{background:#fff;border:1px solid #E2E8F0;border-radius:14px;padding:10px 12px}
.od-k b{display:block;font-size:19px;line-height:1.1}.od-k span{font-size:12px;color:#64748B;font-weight:600}.od-k small{display:block;font-size:12px;color:#059669;font-weight:700;margin-top:2px}
.od-new{width:100%;border:0;border-radius:16px;padding:15px;font-weight:800;font-size:16px;color:#fff;background:linear-gradient(135deg,#059669,#0D9488);cursor:pointer}
.od-card{background:#fff;border:1px solid #E2E8F0;border-radius:18px;padding:14px}.od-card h3{margin:0;font-size:16px}
.od-form{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}.od-form label{min-width:0;display:flex;flex-direction:column;gap:4px;font-size:12.5px;font-weight:700;color:#475569}.od-form .w{grid-column:1/-1}
.od-form input{width:100%;box-sizing:border-box;border:1.5px solid #E2E8F0;border-radius:12px;padding:11px 12px;font:inherit;font-size:15px;min-width:0}.od-form button{grid-column:1/-1;border:0;border-radius:12px;padding:13px;font-weight:800;font-size:15px;background:#0B1220;color:#fff;cursor:pointer}
.od-cal-h{display:flex;align-items:center;gap:8px;margin-bottom:8px}.od-cal-h b{flex:1;text-align:center;font-size:15px}.od-cal-h button{border:1px solid #E2E8F0;background:#fff;border-radius:10px;width:36px;height:34px;font-weight:800;cursor:pointer}
.od-cal{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}.od-cal .wd{font-size:10.5px;font-weight:800;color:#94A3B8;text-align:center;padding:2px 0}
.od-d{border-radius:10px;padding:5px 2px;text-align:center;min-height:46px;background:#F8FAFC;border:1.5px solid transparent;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:1px}
.od-d i{font-style:normal;font-size:11px;color:#64748B;font-weight:700}.od-d b{font-size:14px;line-height:1.1}.od-d small{font-size:9.5px;color:#64748B}
.od-d.has{background:#DCFCE7}.od-d.has b{color:#15803D}.od-d.zero{background:#FFF1F2}.od-d.zero b{color:#E11D48}.od-d.off{background:transparent;cursor:default}.od-d.off b{color:#CBD5E1}.od-d.fut{background:transparent;cursor:default}
.od-d.today{border-color:#2563EB}.od-d.sel{border-color:#0B1220}
.od-warn{margin-top:10px;background:#FFF1F2;color:#9F1239;border-radius:12px;padding:8px 12px;font-size:13px;font-weight:600}.od-good{margin-top:10px;background:#ECFDF5;color:#065F46;border-radius:12px;padding:8px 12px;font-size:13px;font-weight:600}
.od-li{display:flex;align-items:center;gap:10px;padding:10px 0;border-top:1px solid #F1F5F9}.od-li:first-child{border-top:0}.od-li div{flex:1;min-width:0}.od-li div b{display:block;font-size:14.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.od-li span{font-size:12px;color:#64748B}.od-li>b{font-size:15px}.od-li button{border:1px solid #E2E8F0;background:#fff;border-radius:10px;padding:6px 10px;font-weight:700;font-size:12.5px;cursor:pointer}
.od-empty{text-align:center;color:#94A3B8;padding:14px 0;font-size:13.5px}.od-stack{display:flex;flex-direction:column;gap:12px}
.od-k button{background:#fff;border:1.5px solid #E2E8F0;border-radius:14px;padding:10px 12px;text-align:left;cursor:pointer;font:inherit}.od-k button.on{border-color:#0B1220;background:#F8FAFC;box-shadow:0 2px 8px rgba(11,18,32,.08)}
.od-k button b{display:block;font-size:19px;line-height:1.1}.od-k button span{font-size:12px;color:#64748B;font-weight:600}.od-k button small{display:block;font-size:12px;color:#059669;font-weight:700;margin-top:2px}
.od-row{grid-column:1/-1;display:grid;grid-template-columns:1fr 1fr;gap:8px;border:1px solid #E2E8F0;border-radius:14px;padding:10px;background:#F8FAFC}.od-row .w{grid-column:1/-1}.od-row em{grid-column:1/-1;font-style:normal;font-size:11px;font-weight:800;color:#94A3B8;letter-spacing:.08em}
.od-form .od-more{background:#fff;color:#0B1220;border:1.5px dashed #94A3B8}.od-dayh{font-size:11.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#64748B;margin:10px 0 2px}
.pc{background:#fff;border:1px solid #E2E8F0;border-radius:20px;overflow:hidden;box-shadow:0 4px 14px rgba(11,18,32,.05)}
.pc-h{display:flex;align-items:center;gap:12px;padding:14px 16px;background:linear-gradient(135deg,#0B1730,#0E3B33);color:#fff}.pc-h .ic{width:40px;height:40px;border-radius:12px;background:rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;font-size:20px;flex:none}
.pc-h b{display:block;font-size:16.5px}.pc-h span{font-size:12px;color:#A7F3D0}.pc-h .tot{margin-left:auto;text-align:right}.pc-h .tot b{font-size:19px}.pc-h .tot span{color:#CBD5E1}
.pc-b{padding:14px 16px}.pc-b .od-form{margin-top:0}.pc-b .od-row{background:#fff;border:0;padding:0;border-radius:0}.pc-b .od-row+.od-row{border-top:1px dashed #E2E8F0;padding-top:12px;margin-top:2px}.pc-b .od-row em{color:#059669}
.pc-b .od-row:first-child em{display:none}
.pc-save{background:linear-gradient(135deg,#059669,#0D9488)!important}
.pc-l{border-top:1px solid #EEF2F6;padding:10px 16px 12px;background:#FAFBFC}.pc-l h4{margin:0 0 2px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#64748B;display:flex;align-items:center;gap:8px}.pc-l h4 a{margin-left:auto;text-transform:none;letter-spacing:0;font-size:13px;color:#059669;font-weight:700;cursor:pointer}
.pc-l .od-li .n{width:24px;height:24px;border-radius:50%;background:#DCFCE7;color:#15803D;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;flex:none}
.pc-note{padding:12px 16px;font-size:13px;color:#64748B}.pc-note button{border:0;background:#0B1220;color:#fff;border-radius:10px;padding:8px 14px;font-weight:700;cursor:pointer;margin-top:8px}
.pc-l summary{list-style:none;display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#64748B;font-weight:800;padding:2px 0}.pc-l summary::-webkit-details-marker{display:none}
.pc-l summary b{margin-left:auto;font-size:13.5px;letter-spacing:0;color:#0F172A;text-transform:none}.pc-l summary i{font-style:normal;transition:transform .15s;color:#94A3B8}.pc-l[open] summary i{transform:rotate(180deg)}.pc-l[open] summary{margin-bottom:4px}
.pc-l #pchist{display:block;text-align:center;margin-top:8px;font-size:13px;color:#059669;font-weight:700;cursor:pointer}`
let cssOn = false
const st = { month: null, sel: null, form: false, view: 'today' }

const rowHtml = (i, w = 'order') => `<div class="od-row" data-r><em>${w.toUpperCase()} ${i}</em>
  <label class="w">Name / title<input data-f="customer" required maxlength="80" placeholder="Customer, shop or ${w} title"></label>
  <label>No. of ${w}s<input data-f="qty" type="number" min="1" step="1" value="1" required inputmode="numeric"></label>
  <label>Amount ₹<input data-f="amount" type="number" min="1" step="0.01" required inputmode="decimal"></label>
  <label class="w">Client contact number<input data-f="contact" type="tel" maxlength="15" inputmode="tel" placeholder="10-digit mobile (optional)"></label></div>`
const q = (x) => Number(x.qty) || 1

export async function renderOrders(v, opts = {}) {
  if (!cssOn) { const el = document.createElement('style'); el.textContent = CSS; document.head.appendChild(el); cssOn = true }
  const today = istDate(), ro = !!opts.as, view = st.view, noForm = ro || opts.viewOnly // punching is done on Home
  const w = opts.word === 'booking' ? 'booking' : 'order', W = w[0].toUpperCase() + w.slice(1) // CSEs punch bookings, others orders
  const month = st.month || today.slice(0, 7), sel = st.sel || today
  const [y, m] = month.split('-').map(Number), dim = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const dow = (new Date(today + 'T12:00:00Z').getUTCDay() + 6) % 7, weekStart = new Date(Date.parse(today + 'T12:00:00Z') - dow * 864e5).toISOString().slice(0, 10)
  const from = view === 'today' ? today : view === 'week' ? weekStart : `${month}-01`
  const toFull = `${month}-${String(dim).padStart(2, '0')}`, to = view === 'month' ? (toFull > today ? today : toFull) : today
  if (!v.querySelector('.od-stack')) v.innerHTML = '<div class="skel"></div>'
  let r
  try { r = await get(`/api/bookings?from=${from}&to=${to}${ro ? '&as=' + opts.as : ''}`, { fresh: true }) } catch (e) { v.innerHTML = `<div class="err">${esc(e.message)}</div>`; return }
  const byDay = {}; for (const x of r.rows) (byDay[x.date] ||= []).push(x)
  const t = r.totals
  const li = (x) => `<div class="od-li"><div><b>${esc(x.customer || x.booking_no)}${q(x) > 1 ? ` <span style="font-weight:700;color:#059669">× ${q(x)}</span>` : ''}</b><span>${esc(x.booking_no)}${x.contact ? ' · 📞 ' + esc(x.contact) : ''}${x.note ? ' · ' + esc(x.note) : ''}</span></div><b>${inr(x.amount)}</b>${!ro && x.date === today ? `<button data-ed="${x.id}">Edit</button>` : ''}</div>`
  const sumN = (L) => L.reduce((a, x) => a + q(x), 0), sumA = (L) => L.reduce((a, x) => a + x.amount, 0)
  let body = ''
  if (view === 'today') {
    const L = byDay[today] || []
    body = `<section class="od-card"><div style="display:flex;align-items:baseline;gap:8px"><h3>Today's ${w}s</h3><span style="flex:1"></span><span style="font-size:12.5px;color:#64748B">${sumN(L)} ${w}s · ${inr(sumA(L))}</span></div>${L.map(li).join('') || `<div class="od-empty">No ${w}s punched today</div>`}</section>`
  } else if (view === 'week') {
    const days = Array.from({ length: dow + 1 }, (_, i) => new Date(Date.parse(weekStart + 'T12:00:00Z') + i * 864e5).toISOString().slice(0, 10)).reverse()
    body = `<section class="od-card"><div style="display:flex;align-items:baseline;gap:8px"><h3>This week's ${w}s</h3><span style="flex:1"></span><span style="font-size:12.5px;color:#64748B">${sumN(r.rows)} ${w}s · ${inr(sumA(r.rows))}</span></div>
      ${days.map((d) => { const L = byDay[d] || []; return `<div class="od-dayh">${d === today ? 'Today' : fmtDate(d)} · ${sumN(L)} ${w}s · ${inr(sumA(L))}</div>${L.map(li).join('') || `<div class="od-empty" style="padding:6px 0">No ${w}s</div>`}` }).join('')}</section>`
  } else {
    const first = (new Date(`${month}-01T12:00:00Z`).getUTCDay() + 6) % 7
    let zero = 0
    const cells = Array.from({ length: dim }, (_, i) => {
      const ds = `${month}-${String(i + 1).padStart(2, '0')}`, L = byDay[ds] || [], sun = new Date(ds + 'T12:00:00Z').getUTCDay() === 0, fut = ds > today
      const cls = fut ? 'fut' : L.length ? 'has' : sun ? 'off' : 'zero'
      if (cls === 'zero') zero++
      return `<div class="od-d ${cls} ${ds === today ? 'today' : ''} ${ds === sel ? 'sel' : ''}" data-day="${fut ? '' : ds}"><i>${i + 1}</i><b>${fut ? '' : L.length ? sumN(L) : sun ? '–' : '0'}</b>${L.length ? `<small>${inr(sumA(L))}</small>` : ''}</div>`
    }).join('')
    const monthLabel = new Date(`${month}-01T12:00:00Z`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    const dayRows = byDay[sel] || []
    body = `<section class="od-card"><div class="od-cal-h"><button id="pm" aria-label="Previous month">‹</button><b>${monthLabel} · ${sumN(r.rows)} ${w}s · ${inr(sumA(r.rows))}</b><button id="nm" aria-label="Next month" ${month >= today.slice(0, 7) ? 'disabled style="opacity:.3"' : ''}>›</button></div>
      <div class="od-cal">${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d) => `<div class="wd">${d}</div>`).join('')}${'<div></div>'.repeat(first)}${cells}</div>
      ${zero ? `<div class="od-warn">No ${w} punched on ${zero} working day${zero > 1 ? 's' : ''} this month (red days).</div>` : `<div class="od-good">${W}s on every working day so far 👍</div>`}</section>
    <section class="od-card"><div style="display:flex;align-items:baseline;gap:8px"><h3>${sel === today ? 'Today' : fmtDate(sel)}</h3><span style="flex:1"></span><span style="font-size:12.5px;color:#64748B">${sumN(dayRows)} ${w}s · ${inr(sumA(dayRows))}</span></div>
      ${dayRows.map(li).join('') || `<div class="od-empty">No ${w}s on this day — tap a date above</div>`}</section>`
  }
  v.innerHTML = `<div class="od-stack">
    <div class="od-k">${[['today', 'Today', t.today_n, t.today], ['week', 'This week', t.week_n, t.week], ['month', 'This month', t.month_n, t.month]].map(([k, l, n, a]) => `<button data-view="${k}" class="${view === k ? 'on' : ''}"><span>${l}</span><b>${n || 0}</b><small>${inr(a)}</small></button>`).join('')}</div>
    ${noForm ? '' : `<button class="od-new" id="odn">${st.form ? '✕ Close' : `＋ Punch new ${w}`}</button>`}
    ${!noForm && st.form ? `<section class="od-card"><h3>New ${w}</h3><form class="od-form" id="odf"><div id="odrows" style="display:contents">${rowHtml(1, w)}</div>
      <button type="button" class="od-more" id="odmore">＋ Add another ${w}</button>
      <label>Date<input id="odt" type="date" value="${today}" max="${today}" required></label><label>Note (optional)<input id="ot" maxlength="200" placeholder="items, remarks"></label>
      <button id="odsave">Save</button></form></section>` : ''}
    ${body}
    ${ro ? '' : `<div style="font-size:11.5px;color:#94A3B8;text-align:center">${W}s can be corrected on the same day. They cannot be deleted — ask admin.</div>`}</div>`
  const again = () => renderOrders(v, opts)
  v.querySelectorAll('[data-view]').forEach((b) => (b.onclick = () => { st.view = b.dataset.view; if (st.view === 'month') { st.month = null; st.sel = null } again() }))
  v.querySelector('#odn')?.addEventListener('click', () => { st.form = !st.form; again() })
  v.querySelector('#pm')?.addEventListener('click', () => { const d = new Date(Date.UTC(y, m - 2, 1)); st.month = d.toISOString().slice(0, 7); st.sel = st.month === today.slice(0, 7) ? today : null; again() })
  v.querySelector('#nm')?.addEventListener('click', () => { if (month >= today.slice(0, 7)) return; const d = new Date(Date.UTC(y, m, 1)); st.month = d.toISOString().slice(0, 7); st.sel = st.month === today.slice(0, 7) ? today : null; again() })
  v.querySelectorAll('[data-day]').forEach((c) => c.dataset.day && (c.onclick = () => { st.sel = c.dataset.day; again() }))
  const f = v.querySelector('#odf')
  if (f) {
    f.querySelector('#odmore').onclick = () => { const box = f.querySelector('#odrows'); box.insertAdjacentHTML('beforeend', rowHtml(box.querySelectorAll('[data-r]').length + 1, w)); box.lastElementChild.querySelector('input').focus() }
    f.onsubmit = async (e) => {
      e.preventDefault(); const btn = f.querySelector('#odsave'); btn.disabled = true
      const date = f.querySelector('#odt').value, note = f.querySelector('#ot').value.trim()
      const rowsEl = [...f.querySelectorAll('[data-r]')]; let saved = 0
      try {
        for (const el of rowsEl) { if (el.dataset.done) continue
          const g = (k) => el.querySelector(`[data-f=${k}]`).value.trim()
          await post('/api/bookings', { customer: g('customer'), qty: g('qty'), amount: g('amount'), contact: g('contact'), date, note }); el.dataset.done = '1'; saved++ }
        toast(`${saved} ${w}${saved > 1 ? 's' : ''} saved ✓`); st.form = false; if (date !== today) { st.view = 'month'; st.sel = date; st.month = date.slice(0, 7) } again()
      } catch (er) { btn.disabled = false; toast(er.message, 'bad') }
    }
  }
  v.querySelectorAll('[data-ed]').forEach((b) => (b.onclick = () => {
    const x = r.rows.find((o) => String(o.id) === b.dataset.ed), el = b.closest('.od-li')
    el.outerHTML = `<form class="od-form" id="ode" style="margin:8px 0"><label class="w">Name / title<input id="ec" value="${esc(x.customer || '')}" maxlength="80"></label><label>No. of ${w}s<input id="eq" type="number" min="1" step="1" value="${q(x)}" required></label><label>Amount ₹<input id="ea" type="number" step="0.01" min="1" value="${x.amount}" required></label>
      <label class="w">Client contact number<input id="ep" type="tel" value="${esc(x.contact || '')}" maxlength="15"></label><button>Save</button></form>`
    const ef = v.querySelector('#ode')
    ef.onsubmit = async (e) => { e.preventDefault(); try { await patch('/api/bookings/' + x.id, { customer: ef.querySelector('#ec').value, qty: ef.querySelector('#eq').value, amount: ef.querySelector('#ea').value, contact: ef.querySelector('#ep').value }); toast('Saved'); again() } catch (er) { toast(er.message, 'bad') } }
  }))
}
export const resetOrdersView = () => { st.month = null; st.sel = null; st.form = false; st.view = 'today' }

// Punch card for the Home screen: a short form (name, number, amount, client contact) and today's submissions under it.
// opts: { word, as (employee id, admin page), canAdd (false = view only), onHistory (open today / week / month view), onModeHint (html when view-only), onSaved }
let pcOpen = false // Today's submissions stays folded until tapped
export async function renderPunch(v, opts = {}) {
  if (!cssOn) { const el = document.createElement('style'); el.textContent = CSS; document.head.appendChild(el); cssOn = true }
  const today = istDate(), w = opts.word === 'booking' ? 'booking' : 'order', W = w[0].toUpperCase() + w.slice(1)
  const canAdd = opts.canAdd !== false
  if (!v.querySelector('.pc')) v.innerHTML = '<div class="skel"></div>'
  let r
  try { r = await get(`/api/bookings?from=${today}&to=${today}${opts.as ? '&as=' + opts.as : ''}`, { fresh: true }) } catch (e) { v.innerHTML = `<div class="err">${esc(e.message)}</div>`; return }
  const L = r.rows.filter((x) => x.date === today), t = r.totals
  v.innerHTML = `<section class="pc">
    <div class="pc-h"><span class="ic">🧾</span><div><b>Punch ${w}</b><span>Fill the form and save — it goes into today's list</span></div><div class="tot"><b>${t.today_n || 0}</b><span> today · ${inr(t.today)}</span></div></div>
    ${canAdd ? `<div class="pc-b"><form class="od-form" id="pcf"><div id="pcrows" style="display:contents">${rowHtml(1, w)}</div>
      <label class="w">Note (optional)<input id="pcn" maxlength="200" placeholder="items, remarks"></label>
      <button type="button" class="od-more" id="pcmore">＋ Add another ${w}</button><button id="pcsave" class="pc-save">Save ${w}</button></form></div>`
    : `<div class="pc-note">${opts.viewHint || 'View only.'}</div>`}
    <details class="pc-l" ${pcOpen ? 'open' : ''}><summary><span>Today's submissions</span><b>${t.today_n || 0} · ${inr(t.today)}</b><i>▾</i></summary>
      ${L.map((x, i) => `<div class="od-li"><span class="n">${L.length - i}</span><div><b>${esc(x.customer || x.booking_no)}${q(x) > 1 ? ` <span style="font-weight:700;color:#059669">× ${q(x)}</span>` : ''}</b><span>${esc(x.booking_no)}${x.contact ? ' · 📞 ' + esc(x.contact) : ''}${x.note ? ' · ' + esc(x.note) : ''}</span></div><b>${inr(x.amount)}</b></div>`).join('') || `<div class="od-empty">No ${w}s punched yet today</div>`}
      ${opts.onHistory ? '<a id="pchist">View this week / this month →</a>' : ''}</details></section>`
  v.querySelector('details.pc-l').ontoggle = (e) => { pcOpen = e.target.open }
  v.querySelector('#pchist')?.addEventListener('click', opts.onHistory)
  v.querySelector('#pcswitch')?.addEventListener('click', () => opts.onSwitch?.())
  const f = v.querySelector('#pcf'); if (!f) return
  f.querySelector('#pcmore').onclick = () => { const box = f.querySelector('#pcrows'); box.insertAdjacentHTML('beforeend', rowHtml(box.querySelectorAll('[data-r]').length + 1, w)); box.lastElementChild.querySelector('input').focus() }
  f.onsubmit = async (e) => {
    e.preventDefault(); const btn = f.querySelector('#pcsave'); btn.disabled = true; btn.textContent = 'Saving…'
    const note = f.querySelector('#pcn').value.trim(); let saved = 0
    try {
      for (const el of [...f.querySelectorAll('[data-r]')]) { if (el.dataset.done) continue
        const g = (k) => el.querySelector(`[data-f=${k}]`).value.trim()
        await post('/api/bookings', { customer: g('customer'), qty: g('qty'), amount: g('amount'), contact: g('contact'), note, ...(opts.as ? { emp_id: opts.as } : {}) }); el.dataset.done = '1'; saved++ }
      toast(`${saved} ${w}${saved > 1 ? 's' : ''} saved ✓ — added to today's list`); opts.onSaved?.(); renderPunch(v, opts)
    } catch (er) { btn.disabled = false; btn.textContent = `Save ${w}`; toast(er.message, 'bad') }
  }
}

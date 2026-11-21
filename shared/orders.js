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
.od-form{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}.od-form label{display:flex;flex-direction:column;gap:4px;font-size:12.5px;font-weight:700;color:#475569}.od-form .w{grid-column:1/-1}
.od-form input{border:1.5px solid #E2E8F0;border-radius:12px;padding:11px 12px;font:inherit;font-size:15px;min-width:0}.od-form button{grid-column:1/-1;border:0;border-radius:12px;padding:13px;font-weight:800;font-size:15px;background:#0B1220;color:#fff;cursor:pointer}
.od-cal-h{display:flex;align-items:center;gap:8px;margin-bottom:8px}.od-cal-h b{flex:1;text-align:center;font-size:15px}.od-cal-h button{border:1px solid #E2E8F0;background:#fff;border-radius:10px;width:36px;height:34px;font-weight:800;cursor:pointer}
.od-cal{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}.od-cal .wd{font-size:10.5px;font-weight:800;color:#94A3B8;text-align:center;padding:2px 0}
.od-d{border-radius:10px;padding:5px 2px;text-align:center;min-height:46px;background:#F8FAFC;border:1.5px solid transparent;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:1px}
.od-d i{font-style:normal;font-size:11px;color:#64748B;font-weight:700}.od-d b{font-size:14px;line-height:1.1}.od-d small{font-size:9.5px;color:#64748B}
.od-d.has{background:#DCFCE7}.od-d.has b{color:#15803D}.od-d.zero{background:#FFF1F2}.od-d.zero b{color:#E11D48}.od-d.off{background:transparent;cursor:default}.od-d.off b{color:#CBD5E1}.od-d.fut{background:transparent;cursor:default}
.od-d.today{border-color:#2563EB}.od-d.sel{border-color:#0B1220}
.od-warn{margin-top:10px;background:#FFF1F2;color:#9F1239;border-radius:12px;padding:8px 12px;font-size:13px;font-weight:600}.od-good{margin-top:10px;background:#ECFDF5;color:#065F46;border-radius:12px;padding:8px 12px;font-size:13px;font-weight:600}
.od-li{display:flex;align-items:center;gap:10px;padding:10px 0;border-top:1px solid #F1F5F9}.od-li:first-child{border-top:0}.od-li div{flex:1;min-width:0}.od-li div b{display:block;font-size:14.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.od-li span{font-size:12px;color:#64748B}.od-li>b{font-size:15px}.od-li button{border:1px solid #E2E8F0;background:#fff;border-radius:10px;padding:6px 10px;font-weight:700;font-size:12.5px;cursor:pointer}
.od-empty{text-align:center;color:#94A3B8;padding:14px 0;font-size:13.5px}.od-stack{display:flex;flex-direction:column;gap:12px}`
let cssOn = false
const st = { month: null, sel: null, form: false }

export async function renderOrders(v, opts = {}) {
  if (!cssOn) { const el = document.createElement('style'); el.textContent = CSS; document.head.appendChild(el); cssOn = true }
  const today = istDate(), ro = !!opts.as
  const month = st.month || today.slice(0, 7), sel = st.sel || today
  const [y, m] = month.split('-').map(Number), dim = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const from = `${month}-01`, to = `${month}-${String(dim).padStart(2, '0')}`
  if (!v.querySelector('.od-stack')) v.innerHTML = '<div class="skel"></div>'
  let r
  try { r = await get(`/api/bookings?from=${from}&to=${to > today ? today : to}${ro ? '&as=' + opts.as : ''}`, { fresh: true }) } catch (e) { v.innerHTML = `<div class="err">${esc(e.message)}</div>`; return }
  const byDay = {}; for (const x of r.rows) (byDay[x.date] ||= []).push(x)
  const first = (new Date(from + 'T12:00:00Z').getUTCDay() + 6) % 7
  let zero = 0
  const cells = Array.from({ length: dim }, (_, i) => {
    const ds = `${month}-${String(i + 1).padStart(2, '0')}`, L = byDay[ds] || [], sun = new Date(ds + 'T12:00:00Z').getUTCDay() === 0, fut = ds > today
    const cls = fut ? 'fut' : L.length ? 'has' : sun ? 'off' : 'zero'
    if (cls === 'zero') zero++
    return `<div class="od-d ${cls} ${ds === today ? 'today' : ''} ${ds === sel ? 'sel' : ''}" data-day="${fut ? '' : ds}"><i>${i + 1}</i><b>${fut ? '' : L.length || (sun ? '–' : '0')}</b>${L.length ? `<small>${inr(L.reduce((a, x) => a + x.amount, 0))}</small>` : ''}</div>`
  }).join('')
  const dayRows = byDay[sel] || []
  const monthLabel = new Date(from + 'T12:00:00Z').toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' })
  const t = r.totals
  v.innerHTML = `<div class="od-stack">
    <div class="od-k"><div><span>Today</span><b>${t.today_n || 0}</b><small>${inr(t.today)}</small></div><div><span>This week</span><b>${t.week_n || 0}</b><small>${inr(t.week)}</small></div><div><span>This month</span><b>${t.month_n || 0}</b><small>${inr(t.month)}</small></div></div>
    ${ro ? '' : `<button class="od-new" id="odn">${st.form ? '✕ Close' : '＋ Punch new order'}</button>`}
    ${!ro && st.form ? `<section class="od-card"><h3>New order</h3><form class="od-form" id="odf">
      <label class="w">Customer / shop name<input id="oc" required maxlength="80" placeholder="e.g. Sai Traders, Hadapsar"></label>
      <label>Amount ₹<input id="oa" type="number" min="1" step="0.01" required inputmode="decimal"></label>
      <label>Date<input id="odt" type="date" value="${today}" max="${today}" required></label>
      <label>Order / booking no. (optional)<input id="on" maxlength="40" autocapitalize="characters" placeholder="auto"></label>
      <label>Note (optional)<input id="ot" maxlength="200" placeholder="items, weight, remarks"></label>
      <button>Save order</button></form></section>` : ''}
    <section class="od-card"><div class="od-cal-h"><button id="pm" aria-label="Previous month">‹</button><b>${monthLabel}</b><button id="nm" aria-label="Next month" ${month >= today.slice(0, 7) ? 'disabled style="opacity:.3"' : ''}>›</button></div>
      <div class="od-cal">${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d) => `<div class="wd">${d}</div>`).join('')}${'<div></div>'.repeat(first)}${cells}</div>
      ${zero ? `<div class="od-warn">No order punched on ${zero} working day${zero > 1 ? 's' : ''} this month (red days).</div>` : '<div class="od-good">An order on every working day so far 👍</div>'}</section>
    <section class="od-card"><div style="display:flex;align-items:baseline;gap:8px"><h3>${sel === today ? 'Today' : fmtDate(sel)}</h3><span style="flex:1"></span><span style="font-size:12.5px;color:#64748B">${dayRows.length} orders · ${inr(dayRows.reduce((a, x) => a + x.amount, 0))}</span></div>
      ${dayRows.map((x) => `<div class="od-li"><div><b>${esc(x.customer || x.booking_no)}</b><span>${esc(x.booking_no)}${x.note ? ' · ' + esc(x.note) : ''}</span></div><b>${inr(x.amount)}</b>${!ro && x.date === today ? `<button data-ed="${x.id}">Edit</button>` : ''}</div>`).join('') || `<div class="od-empty">No orders on this day</div>`}
      ${ro ? '' : '<div style="font-size:11.5px;color:#94A3B8;margin-top:6px">You can edit or delete an order only on the same day — after that, ask admin.</div>'}</section></div>`
  const again = () => renderOrders(v, opts)
  v.querySelector('#odn')?.addEventListener('click', () => { st.form = !st.form; again() })
  v.querySelector('#pm').onclick = () => { const d = new Date(Date.UTC(y, m - 2, 1)); st.month = d.toISOString().slice(0, 7); st.sel = st.month === today.slice(0, 7) ? today : null; again() }
  v.querySelector('#nm').onclick = () => { if (month >= today.slice(0, 7)) return; const d = new Date(Date.UTC(y, m, 1)); st.month = d.toISOString().slice(0, 7); st.sel = st.month === today.slice(0, 7) ? today : null; again() }
  v.querySelectorAll('[data-day]').forEach((c) => c.dataset.day && (c.onclick = () => { st.sel = c.dataset.day; again() }))
  const f = v.querySelector('#odf')
  if (f) f.onsubmit = async (e) => {
    e.preventDefault(); const btn = f.querySelector('button'); btn.disabled = true
    try { const res = await post('/api/bookings', { customer: f.querySelector('#oc').value.trim(), amount: f.querySelector('#oa').value, date: f.querySelector('#odt').value, booking_no: f.querySelector('#on').value.trim(), note: f.querySelector('#ot').value.trim() })
      toast(`Order saved ✓ ${res.booking_no || ''}`); st.form = false; st.sel = f.querySelector('#odt').value; st.month = st.sel.slice(0, 7); again() } catch (er) { btn.disabled = false; toast(er.message, 'bad') }
  }
  v.querySelectorAll('[data-ed]').forEach((b) => (b.onclick = () => {
    const x = r.rows.find((q) => String(q.id) === b.dataset.ed), li = b.closest('.od-li')
    li.outerHTML = `<form class="od-form" id="ode" style="margin:8px 0"><label class="w">Customer / shop<input id="ec" value="${esc(x.customer || '')}" maxlength="80"></label><label>Amount ₹<input id="ea" type="number" step="0.01" min="1" value="${x.amount}" required></label><label>Note<input id="et" value="${esc(x.note || '')}" maxlength="200"></label>
      <button>Save</button><button type="button" id="edel" style="background:#fff;color:#B91C1C;border:1px solid #FECACA">Delete order</button></form>`
    const ef = v.querySelector('#ode')
    ef.onsubmit = async (e) => { e.preventDefault(); try { await patch('/api/bookings/' + x.id, { customer: ef.querySelector('#ec').value, amount: ef.querySelector('#ea').value, note: ef.querySelector('#et').value }); toast('Saved'); again() } catch (er) { toast(er.message, 'bad') } }
    ef.querySelector('#edel').onclick = async () => { try { await patch('/api/bookings/' + x.id, { delete: true }); toast('Deleted'); again() } catch (er) { toast(er.message, 'bad') } }
  }))
}
export const resetOrdersView = () => { st.month = null; st.sel = null; st.form = false }

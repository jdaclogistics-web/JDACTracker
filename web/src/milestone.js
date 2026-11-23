// Milestone 1 — daily scoreboard (targets per company, each with an owner, tasks, focus company of the day, plan & rules)
import { get, post } from '@shared/api.js'
import { esc, toast, istDate } from '@shared/util.js'

export const MS_CO = [
  { co: 'Govaa Bazaar (FMCG)', items: [
    { id: 'gb_online', label: 'Online orders — Buy any 6 @ ₹999', goal: 50, unit: 'orders', owner: 'Darshan' },
    { id: 'gb_offline', label: 'Goa warehouse offline sales', goal: 30000, unit: '₹', owner: 'Atmaram' }] },
  { co: 'JDAC Logistics', items: [
    { id: 'jd_cse', label: 'CSE orders from lead campaigns', goal: 25, unit: 'orders', owner: 'Neetu', note: 'stretch 50' },
    { id: 'jd_web', label: 'Orders booked on website / landing page', goal: 50, unit: 'orders', owner: 'Himanshu' },
    { id: 'jd_trans', label: 'PTL transporter onboarded', goal: 1, unit: 'onboarded', owner: 'Balaji' }] },
  { co: 'HR Consultancy', items: [
    { id: 'hr_co', label: 'Company onboarded @ ₹999', goal: 1, unit: 'company', owner: 'Nameera' },
    { id: 'hr_emp', label: 'Employee placed', goal: 1, unit: 'employee', owner: 'Nameera' }] },
  { co: 'Jupiter', items: [
    { id: 'jp_fb', label: 'Facebook ad orders, Pune + Mumbai (no telecallers)', goal: 5, unit: 'orders', owner: 'Darshan' }] },
  { co: 'JDAC Studios', items: [
    { id: 'st_bah', label: 'Bahiram ₹3,000 package sold', goal: 1, unit: 'order', owner: 'Himanshu' }] }]
const T = MS_CO.flatMap((c) => c.items.map((i) => ({ ...i, co: c.co })))
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const FOCUS = { 1: 'JDAC Logistics', 2: 'Govaa Bazaar', 3: 'HR Consultancy', 4: 'Jupiter', 5: 'JDAC Studios', 6: 'Review day' }
const SCOPE = { 'JDAC Logistics': ['CSE daily order entry', 'Website orders count', 'Transporter onboarded (yes/no)'],
  'Govaa Bazaar': ['Online orders count', 'Atmaram sales entry: daily sales, cash or UPI'],
  'HR Consultancy': ['Add Company (₹999 fee + wallet recharge)', 'Add Employee'],
  Jupiter: ['Facebook leads and orders entry'], 'JDAC Studios': ['Bahiram package sold (yes/no)'],
  'Review day': ['Weekly report of all five companies', "Next week's targets set"] }
const DEADLINE = '2026-11-30'
const TRACKS = [['tech', 'Tech', 'Tracker development'], ['sales', 'Sales / Marketing', 'Campaigns, leads, calls'], ['acc', 'Accounts', 'Revenue, payments, GST']]
const AUTO_HINT = { jd_cse: 'bookings punched by the team today', gb_offline: 'orders punched by the Goa team today' }
const fmt = (t, v) => (t.unit === '₹' ? '₹' + Math.round(v).toLocaleString('en-IN') : String(v))
const valOf = (d, id) => (d.actuals[id] != null ? d.actuals[id] : d.auto[id] || 0)
const pct = (d, t) => Math.min(1, valOf(d, t.id) / t.goal)
const daysLeft = () => Math.round((new Date(DEADLINE + 'T23:59:00+05:30') - new Date()) / 864e5)
const deadlineHtml = () => { const left = daysLeft(); return left >= 0 ? `Milestone 1 deadline: 30 Nov · <b>${left} day${left === 1 ? '' : 's'} left</b> — then December profits` : 'Milestone 1 deadline (30 Nov) has passed' }
const metersHtml = (d) => MS_CO.map((c) => { const p = Math.round(c.items.reduce((s, t) => s + pct(d, t), 0) / c.items.length * 100); return `<div class="ms-m"><span>${esc(c.co.replace(' (FMCG)', ''))}</span><div class="tr"><i style="width:${p}%"></i></div><span>${p}%</span></div>` }).join('')

/** compact scoreboard on the dashboard */
export async function milestoneCard(el, go) {
  let d
  try { d = await get('/api/admin/milestone?date=' + istDate(), { fresh: true }) } catch { el.innerHTML = ''; return }
  const hits = T.filter((t) => valOf(d, t.id) >= t.goal).length, all = Math.round(T.reduce((s, t) => s + pct(d, t), 0) / T.length * 100)
  el.innerHTML = `<section class="ms ms-band ms-mini" role="button" tabindex="0"><div class="ms-top"><h2>Milestone 1 — daily scoreboard</h2><button class="ms-open">Open scoreboard →</button></div>
    <div class="ms-score"><div><div class="ms-big">${hits}<small> of ${T.length}</small></div><div class="ms-sub">targets hit today · overall ${all}%</div></div><div class="ms-meters">${metersHtml(d)}</div></div>
    <div class="ms-dl">${deadlineHtml()}</div></section>`
  el.querySelector('.ms-mini').onclick = () => go('milestone')
}

/** full page */
export async function viewMilestone(v, go, opts = {}) {
  let date = opts.date || istDate(), view = 'tabT', d = { actuals: {}, auto: {}, tasks: [], focus: {} }, team = []
  const open = new Set(), deb = {}; let fdeb = null
  get('/api/admin/employees').then((E) => { team = E.employees.filter((e) => e.active).map((e) => e.name.split(' ')[0]); const dl = v.querySelector('#msteam'); if (dl) dl.innerHTML = [...new Set(team)].map((n) => `<option value="${esc(n)}">`).join('') }).catch(() => {})
  v.innerHTML = `<div class="ms"><header class="ms-band"><div class="ms-top"><h2>Milestone 1 — daily scoreboard</h2>
      <div class="ms-dnav"><button id="prev" aria-label="Previous day">‹</button><b id="dlabel"></b><button id="next" aria-label="Next day">›</button><button id="tod">Today</button></div></div>
    <div class="ms-score"><div><div class="ms-big" id="hits"></div><div class="ms-sub" id="hitsub"></div></div><div class="ms-meters" id="meters"></div></div>
    <div class="ms-dl">${deadlineHtml()}</div></header>
    <nav class="ms-tabs"><button data-tab="tabT" aria-pressed="true">Today</button><button data-tab="tabP" aria-pressed="false">Team tasks</button><button data-tab="tabR" aria-pressed="false">Plan &amp; rules</button></nav>
    <div id="focus"></div><div id="list"></div><div id="people" hidden></div>
    <div id="rules" class="ms-plan" hidden>
      <section><h3>Weekly rhythm</h3><table><tr><th>Mon</th><td>JDAC Logistics</td></tr><tr><th>Tue</th><td>Govaa Bazaar (FMCG)</td></tr><tr><th>Wed</th><td>HR Consultancy</td></tr><tr><th>Thu</th><td>Jupiter</td></tr><tr><th>Fri</th><td>JDAC Studios</td></tr><tr><th>Sat</th><td>Review: checklist of all five, weekly report, next week's targets</td></tr></table>
        <p class="ms-note">The order of the days is a first draft. Change it if needed.</p></section>
      <section><h3>The day on a focus day</h3><ol>
        <li><b>Morning:</b> meet that company's Tech, Sales/Marketing and Accounts people (plus telecallers if involved). Give each one task and write it in today's plan.</li>
        <li><b>Through the day:</b> build that company's part of the JDAC tracker, only as much as Milestone 1 needs.</li>
        <li><b>Evening, 7 pm:</b> the same tasks must be closed, with results written in. Every owner enters their number. 15-minute check of all five companies: message the owner of any number that's behind.</li>
        <li><b>Fixed half hour each day</b> for daily accounts work (e.g. GST).</li></ol></section>
      <section><h3>Rules</h3><ul>
        <li>Don't go back to yesterday's company. If a number drops, its owner explains it at 7 pm and the fix waits for that company's next focus day.</li>
        <li>Growth comes from owners doing the work: one owner per target, one number every day, one fix per week.</li>
        <li>A drop from one day to the next is normal. On Saturday, check whether the weekly average went up.</li>
        <li>Anyone who comes to the cabin: "7 pm, or on your company's day."</li>
        <li>Don't overbuild. Only add the next feature once Milestone 1 is being hit regularly.</li>
        <li>Milestone 1 must be reached within 10 days so December brings profits.</li></ul></section>
      <section><h3>Tracker: minimum to build per company</h3><table>${Object.entries(SCOPE).filter(([k]) => k !== 'Review day').map(([k, val]) => `<tr><th>${esc(k)}</th><td>${val.map(esc).join('<br>')}</td></tr>`).join('')}</table></section>
      <section><h3>HR Consultancy offer</h3><ul>
        <li>Onboarding fee: ₹999 minimum, paid by every new company.</li>
        <li>First wallet recharge gets 100% cashback, up to ₹10,000. Recharge ₹10,000 and get ₹20,000 in the wallet. Hiring charges are deducted from the wallet.</li>
        <li>Example: a ₹20,000 hire costs the client ₹10,000 out of pocket.</li>
        <li>Don't drop prices below the fixed rate. Finalise the 7-day / 45-day pitch on HR day.</li>
        <li>If clients come in, add one more recruiter.</li></ul></section></div>
    <div class="ms-bar2" id="carrybox"><button id="carry">Copy yesterday's open tasks to this day</button></div>
    <p class="ms-note">Each owner's number is entered by 7 pm. Numbers and tasks are saved per day. Two numbers fill in by themselves from the tracker until you type over them: CSE bookings and Goa warehouse sales.</p>
    <datalist id="msteam"></datalist></div>`
  const $ = (s) => v.querySelector(s)
  $('#list').innerHTML = MS_CO.map((c) => `<section class="ms-co"><h3>${esc(c.co)}<span data-co="${esc(c.co)}"></span></h3>${c.items.map((t) => `
    <div class="ms-t" id="t-${t.id}"><div class="ms-th"><div><b>${esc(t.label)}</b><span class="ms-sub">Owner: ${esc(t.owner)}${t.note ? ' · ' + esc(t.note) : ''}<em data-auto="${t.id}"></em></span></div>
      <label class="ms-num"><input type="number" inputmode="numeric" min="0" class="${t.unit === '₹' ? 'rs' : ''}" data-in="${t.id}" aria-label="Achieved: ${esc(t.label)}"> <span>/ ${fmt(t, t.goal)}</span></label></div>
      <div class="ms-bar"><i></i></div>
      <div class="ms-ctl">${t.unit === '₹' ? `<button class="st" data-step="1000" data-id="${t.id}">+1k</button><button class="st" data-step="5000" data-id="${t.id}">+5k</button>` : `<button class="st" data-step="-1" data-id="${t.id}" aria-label="Minus one">−1</button><button class="st" data-step="1" data-id="${t.id}" aria-label="Plus one">+1</button>`}
        <button data-tog="${t.id}" aria-expanded="false">Tasks</button><span class="ms-gap"></span></div>
      <div class="ms-tasks" hidden></div></div>`).join('')}</section>`).join('')
  const taskHtml = (k, showT) => { const t = T.find((x) => x.id === k.target); return `<div class="ms-tk${k.done ? ' done' : ''}"><input type="checkbox" data-done="${esc(k.id)}" ${k.done ? 'checked' : ''} aria-label="Done"><div><div class="tt">${esc(k.title)}</div><div class="who">${showT && t ? esc(t.label) + ' · ' : ''}${esc(k.owner || 'Unassigned')}</div></div><button data-del="${esc(k.id)}" aria-label="Delete task">Remove</button></div>` }
  const buildFocus = () => {
    const dt = new Date(date + 'T12:00:00Z'), wd = dt.getUTCDay(), co = FOCUS[wd]
    const mon = new Date(dt); mon.setUTCDate(dt.getUTCDate() - ((wd + 6) % 7))
    const week = [1, 2, 3, 4, 5, 6].map((i) => { const x = new Date(mon); x.setUTCDate(mon.getUTCDate() + i - 1); return `<div class="${i === wd ? 'on' : ''}"><b>${DAYS[i]} ${x.getUTCDate()}</b>${esc(FOCUS[i].replace('JDAC ', '').replace(' Consultancy', '').replace(' day', ''))}</div>` }).join('')
    $('#focus').innerHTML = !co ? `<div class="ms-focus"><h3>Sunday: no focus company</h3><div class="ms-week">${week}</div></div>` : `<div class="ms-focus"><h3>Focus today: <span class="fc">${esc(co)}</span></h3><div class="ms-week">${week}</div>
      <div class="ms-sub">Build in the tracker today (only what Milestone 1 needs):</div><ul class="ms-scope">${SCOPE[co].map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
      <div class="ms-tracks">${TRACKS.map(([k, n, h]) => `<div class="ms-track"><h4>${n}</h4><div class="ms-sub" style="font-size:13px">${h}</div>
        <label>Morning: task given<textarea data-f="${k}.plan"></textarea></label><label>7 pm: result<textarea data-f="${k}.res"></textarea></label></div>`).join('')}</div></div>`
    v.querySelectorAll('[data-f]').forEach((a) => { const [k, f] = a.dataset.f.split('.'); a.value = (d.focus[k] && d.focus[k][f]) || '' })
  }
  const paint = () => {
    const dt = new Date(date + 'T12:00:00Z')
    $('#dlabel').textContent = date === istDate() ? 'Today, ' + dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' }) : dt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
    const hits = T.filter((t) => valOf(d, t.id) >= t.goal).length
    $('#hits').innerHTML = `${hits}<small> of ${T.length}</small>`
    $('#hitsub').textContent = `targets hit · overall ${Math.round(T.reduce((s, t) => s + pct(d, t), 0) / T.length * 100)}% of today's milestone`
    $('#meters').innerHTML = metersHtml(d)
    for (const t of T) {
      const el = $('#t-' + t.id), val = valOf(d, t.id), inp = el.querySelector('[data-in]')
      if (document.activeElement !== inp) inp.value = val
      el.querySelector('[data-auto]').textContent = d.actuals[t.id] == null && d.auto[t.id] ? ` · auto: ${AUTO_HINT[t.id] || 'from tracker'}` : ''
      el.classList.toggle('hit', val >= t.goal)
      el.querySelector('.ms-bar i').style.width = pct(d, t) * 100 + '%'
      el.querySelector('.ms-gap').textContent = val >= t.goal ? 'Target hit' : 'Short by ' + fmt(t, t.goal - val)
      const mine = d.tasks.filter((k) => k.target === t.id), dn = mine.filter((k) => k.done).length, tb = el.querySelector('[data-tog]'), box = el.querySelector('.ms-tasks'), isOpen = open.has(t.id)
      tb.textContent = mine.length ? `Tasks ${dn}/${mine.length}` : 'Add tasks'; tb.setAttribute('aria-expanded', isOpen); box.hidden = !isOpen
      if (isOpen) {
        const html = mine.length ? mine.map((k) => taskHtml(k, false)).join('') : '<div class="ms-empty">No tasks for this target yet.</div>'
        const list = box.querySelector('.tl-list')
        if (list) list.innerHTML = html
        else box.innerHTML = `<div class="tl-list">${html}</div><form class="ms-add" data-add="${t.id}"><input name="title" placeholder="Task for today" required aria-label="Task"><input name="owner" list="msteam" value="${esc(t.owner)}" aria-label="Assigned to"><button>Add task</button></form>`
      }
    }
    for (const c of MS_CO) v.querySelector(`[data-co="${CSS.escape(c.co)}"]`).textContent = `${c.items.filter((t) => valOf(d, t.id) >= t.goal).length} of ${c.items.length} hit`
    const by = {}; d.tasks.forEach((k) => { (by[k.owner || 'Unassigned'] ||= []).push(k) })
    const names = Object.keys(by).sort()
    $('#people').innerHTML = names.length ? names.map((n) => { const l = by[n], dn = l.filter((k) => k.done).length; return `<div class="ms-person"><h4>${esc(n)}<span>${dn} of ${l.length} done</span></h4>${l.map((k) => taskHtml(k, true)).join('')}</div>` }).join('') : '<p class="ms-empty">No tasks assigned for this day. Open a target and add tasks.</p>'
  }
  const load = async (rebuild) => { try { const keep = d.actuals; d = await get('/api/admin/milestone?date=' + date, { fresh: true }); for (const k in deb) if (deb[k]) d.actuals[k] = keep[k]; if (rebuild) buildFocus(); paint() } catch (e) { toast(e.message, 'bad') } }
  const save = (b) => post('/api/admin/milestone', { date, ...b }).catch((e) => toast(e.message, 'bad'))
  const setVal = (id, val) => { d.actuals[id] = Math.max(0, val); paint(); clearTimeout(deb[id]); const dd = date; deb[id] = setTimeout(async () => { deb[id] = null; await post('/api/admin/milestone', { date: dd, type: 'actual', target: id, value: d.actuals[id] || 0 }).catch((e) => toast(e.message, 'bad')) }, 700) }
  const goDay = (nd) => { date = nd; open.clear(); T.forEach((t) => { $('#t-' + t.id + ' .ms-tasks').innerHTML = '' }); d = { actuals: {}, auto: {}, tasks: [], focus: {} }; buildFocus(); paint(); load(true) }
  const shift = (n) => goDay(new Date(Date.parse(date + 'T12:00:00Z') + n * 864e5).toISOString().slice(0, 10))
  $('#prev').onclick = () => shift(-1); $('#next').onclick = () => shift(1); $('#tod').onclick = () => goDay(istDate())
  v.querySelectorAll('[data-tab]').forEach((b) => (b.onclick = () => { view = b.dataset.tab
    v.querySelectorAll('[data-tab]').forEach((x) => x.setAttribute('aria-pressed', x === b)); $('#list').hidden = view !== 'tabT'; $('#people').hidden = view !== 'tabP'; $('#rules').hidden = view !== 'tabR'; $('#focus').hidden = view !== 'tabT'; $('#carrybox').hidden = view === 'tabR' }))
  const root = v.querySelector('.ms')
  root.addEventListener('click', async (e) => {
    const s = e.target.closest('[data-step]'); if (s) { const id = s.dataset.id; return setVal(id, valOf(d, id) + Number(s.dataset.step)) }
    const g = e.target.closest('[data-tog]'); if (g) { const id = g.dataset.tog; open.has(id) ? open.delete(id) : open.add(id); return paint() }
    const r = e.target.closest('[data-del]'); if (r) { await save({ type: 'task_del', id: r.dataset.del }); load() }
  })
  root.addEventListener('change', async (e) => { const c = e.target.closest('[data-done]'); if (c) { await save({ type: 'task_done', id: c.dataset.done, done: c.checked }); load() } })
  root.addEventListener('input', (e) => {
    const i = e.target.closest('[data-in]'); if (i) return setVal(i.dataset.in, Number(i.value) || 0)
    const f = e.target.closest('[data-f]'); if (f) { const [k, fld] = f.dataset.f.split('.'); d.focus = { ...d.focus, [k]: { ...(d.focus[k] || {}), [fld]: f.value } }; clearTimeout(fdeb); const dd = date, fc = d.focus; fdeb = setTimeout(() => post('/api/admin/milestone', { date: dd, type: 'focus', focus: fc }).catch((er) => toast(er.message, 'bad')), 900) }
  })
  root.addEventListener('submit', async (e) => { const f = e.target.closest('[data-add]'); if (!f) return; e.preventDefault(); const title = f.elements.title.value.trim(); if (!title) return
    await save({ type: 'task', target: f.dataset.add, title, owner: f.elements.owner.value.trim() || 'Unassigned' }); f.elements.title.value = ''; f.elements.title.focus(); load() })
  $('#carry').onclick = async () => { try { const r = await post('/api/admin/milestone', { date, type: 'carry' }); toast(r.copied ? `Copied ${r.copied} open task${r.copied > 1 ? 's' : ''} from yesterday` : 'No open tasks yesterday'); load() } catch (e) { toast(e.message, 'bad') } }
  buildFocus(); paint(); load(true)
}

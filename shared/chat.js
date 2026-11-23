// Chat (admin panel + employee app दोनों में एक ही): groups ऊपर tabs में, Announcements, multi-line, voice message, file
import { get, post, auth, API_URL as API } from './api.js'
import { esc, toast } from './util.js'

const state = { group: 'general' }
const fileCache = new Map()
async function fileUrl(id) {
  if (fileCache.has(id)) return fileCache.get(id)
  const r = await fetch(`${API}/api/cc/chat/file/${id}`, { headers: { Authorization: 'Bearer ' + auth.token } })
  if (!r.ok) throw new Error('File did not open')
  const u = URL.createObjectURL(await r.blob()); fileCache.set(id, u); return u
}
const toB64 = (blob) => new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(',')[1]); fr.onerror = rej; fr.readAsDataURL(blob) })
const kb = (n) => (n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB')
const linkify = (t) => esc(t).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
const when = (at) => { const s = String(at || ''); const d = s.slice(0, 10), t = s.slice(11, 16); const today = new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10); return d === today ? t : `${d.slice(8, 10)}/${d.slice(5, 7)} ${t}` }

export async function renderChatUI(v, opts = {}) {
  if (opts.group) state.group = opts.group
  // opts.as = employee id → admin preview of exactly what that employee sees (read-only)
  const key = opts.as ? 'as' + opts.as : 'group'
  if (opts.as && !state[key]) state[key] = 'general'
  v.innerHTML = '<div class="skel"></div>'
  let c
  try { c = await get('/api/cc/chat?group=' + encodeURIComponent(state[key]) + (opts.as ? '&as=' + opts.as : '')) } catch (e) {
    if (!opts.as && state.group !== 'general') { state.group = 'general'; return renderChatUI(v, { ...opts, group: undefined }) } // not in that project group any more
    v.innerHTML = `<div class="err">${esc(e.message)}</div>`; return }
  const g = c.groups.find((x) => x.id === c.group) || c.groups[0]
  const canWrite = !opts.as && (g.id !== 'ann' || c.can_announce)
  v.innerHTML = `<section class="card ch">
    <div class="ch-tabs" role="tablist">${c.groups.map((x) => `<button role="tab" class="${x.id === g.id ? 'on' : ''}" data-g="${esc(x.id)}">${x.icon} ${esc(x.name)}</button>`).join('')}</div>
    <div class="ch-head"><b>${g.icon} ${esc(g.name)}</b><span>${g.id === 'ann' ? 'For everyone — only Boss / HR can post' : g.id === 'general' ? 'Whole team' : 'project group'}</span></div>
    <div class="ch-msgs" id="msgs">${c.messages.map((m) => `<div class="ch-m ${m.sender === c.me ? 'me' : ''} ${g.id === 'ann' ? 'ann' : ''}"><span class="ch-who">${esc(m.sender)} · ${when(m.at)}</span>
      ${m.kind === 'voice' && m.file ? `<audio controls preload="none" data-file="${m.file}"></audio>` : ''}
      ${m.kind === 'file' && m.file ? (/^image\//.test(m.file_mime) ? `<img class="ch-img" data-img="${m.file}" alt="${esc(m.file_name)}">` : '') + `<button class="ch-file" data-dl="${m.file}" data-name="${esc(m.file_name)}">📎 ${esc(m.file_name)} <small>${kb(m.file_size || 0)}</small></button>` : ''}
      ${m.body ? `<p>${linkify(m.body)}</p>` : ''}</div>`).join('') || '<div class="empty">No messages yet — say hello 👋</div>'}</div>
    ${canWrite ? `<form class="ch-box" id="cf"><button type="button" class="ch-ic" id="att" title="Attach file" aria-label="Attach file">📎</button><input type="file" id="fi" hidden>
      <textarea id="cm" rows="1" placeholder="Message… (Shift + Enter = new line)"></textarea>
      <button type="button" class="ch-ic" id="mic" title="Voice message" aria-label="Voice message">🎤</button><button class="ch-send" aria-label="Send">➤</button></form>
      <div class="ch-rec" id="rec" hidden><span class="dot"></span><b id="rt">0:00</b> Recording… <button type="button" id="rstop">Send</button><button type="button" id="rcancel">Cancel</button></div>`
    : opts.as ? `<div class="sub" style="text-align:center;margin-top:8px">👁 These are the only chats ${esc(c.viewing_as || 'this employee')} can see. Read-only preview.</div>` : '<div class="sub" style="text-align:center;margin-top:8px">📢 Only Boss / HR post Announcements</div>'}</section>`
  const box = v.querySelector('#msgs'); box.scrollTop = box.scrollHeight
  v.querySelectorAll('[data-g]').forEach((b) => (b.onclick = () => { state[key] = b.dataset.g; renderChatUI(v, { as: opts.as }) }))
  v.querySelector('.ch-tabs .on')?.scrollIntoView({ inline: 'center', block: 'nearest' })
  // voice / file / image lazy load
  v.querySelectorAll('audio[data-file]').forEach((a) => a.addEventListener('play', async function once() { if (a.src) return; a.removeEventListener('play', once); try { a.src = await fileUrl(a.dataset.file); a.play() } catch (e) { toast(e.message, 'bad') } }))
  v.querySelectorAll('img[data-img]').forEach(async (im) => { try { im.src = await fileUrl(im.dataset.img) } catch { im.remove() } })
  v.querySelectorAll('[data-dl]').forEach((b) => (b.onclick = async () => { try { const u = await fileUrl(b.dataset.dl); const a = document.createElement('a'); a.href = u; a.download = b.dataset.name; a.click() } catch (e) { toast(e.message, 'bad') } }))
  if (!canWrite) return
  const ta = v.querySelector('#cm')
  const grow = () => { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 160) + 'px' }
  ta.addEventListener('input', grow)
  const send = async (payload) => {
    try { await post('/api/cc/chat', { group: g.id, ...payload }); renderChatUI(v, { as: opts.as }) } catch (er) { toast(er.message, 'bad') }
  }
  // Enter = send, Shift + Enter = नई line (phone पर Enter नई line देता है — Send button से भेजें)
  const touch = matchMedia('(pointer: coarse)').matches
  ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !touch && !e.isComposing) { e.preventDefault(); v.querySelector('#cf').requestSubmit() } })
  v.querySelector('#cf').onsubmit = (e) => { e.preventDefault(); const t = ta.value.trim(); if (t) send({ body: t }) }
  const fi = v.querySelector('#fi')
  v.querySelector('#att').onclick = () => fi.click()
  fi.onchange = async () => {
    const f = fi.files?.[0]; if (!f) return
    if (f.size > 700 * 1024) return toast('Files up to 700 KB — send bigger files as a Google Drive link', 'bad')
    send({ body: ta.value.trim(), file: { name: f.name, mime: f.type || 'application/octet-stream', data: await toB64(f) } })
  }
  // Voice message
  let rec = null, chunks = [], timer = null, t0 = 0, cancelled = false
  const ui = v.querySelector('#rec')
  v.querySelector('#mic').onclick = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') return toast('Voice recording does not work on this phone / browser', 'bad')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find((m) => MediaRecorder.isTypeSupported?.(m)) || ''
      rec = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 32000 } : undefined); chunks = []; cancelled = false
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data)
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop()); clearInterval(timer); ui.hidden = true
        if (cancelled || !chunks.length) return
        const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' })
        if (blob.size > 700 * 1024) return toast('Voice note too long — keep it under 2 minutes', 'bad')
        send({ kind: 'voice', file: { name: `voice-${Date.now()}.${(rec.mimeType || '').includes('mp4') ? 'm4a' : 'webm'}`, mime: rec.mimeType || 'audio/webm', data: await toB64(blob) } })
      }
      rec.start(); t0 = Date.now(); ui.hidden = false
      timer = setInterval(() => { const s = Math.floor((Date.now() - t0) / 1000); v.querySelector('#rt').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; if (s >= 120) rec.stop() }, 300)
    } catch { toast('Allow microphone permission', 'bad') }
  }
  v.querySelector('#rstop').onclick = () => rec?.state === 'recording' && rec.stop()
  v.querySelector('#rcancel').onclick = () => { cancelled = true; rec?.state === 'recording' && rec.stop() }
}

export const CHAT_CSS = `
.ch{display:flex;flex-direction:column;gap:8px;padding:12px}
.ch-tabs{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding-bottom:2px;margin:0 -2px}.ch-tabs::-webkit-scrollbar{display:none}
.ch-tabs button{flex:none;border:1px solid #E2E8F0;background:#fff;border-radius:99px;padding:8px 14px;font-weight:700;font-size:13px;color:#475569;cursor:pointer;white-space:nowrap}
.ch-tabs button.on{background:var(--brand-ink,#0B1220);color:#fff;border-color:var(--brand-ink,#0B1220)}
.ch-head{display:flex;align-items:baseline;gap:8px;padding:4px 2px;border-bottom:1px solid #EEF2F6}.ch-head b{font-size:15px}.ch-head span{font-size:12px;color:#64748B}
.ch-msgs{min-height:240px;max-height:58vh;overflow:auto;display:flex;flex-direction:column;gap:8px;padding:6px 2px}
.ch-m{max-width:82%;background:#F1F5F9;border-radius:14px 14px 14px 4px;padding:8px 12px;align-self:flex-start;display:flex;flex-direction:column;gap:4px}
.ch-m.me{background:#DCFCE7;align-self:flex-end;border-radius:14px 14px 4px 14px}.ch-m.ann{background:#FFFBEB;border:1px solid #FDE68A;max-width:100%;align-self:stretch}
.ch-who{font-size:11px;color:#64748B;font-weight:600}.ch-m p{margin:0;font-size:14px;white-space:pre-wrap;word-break:break-word}.ch-m audio{width:230px;max-width:100%;height:38px}
.ch-img{max-width:220px;max-height:220px;border-radius:10px;object-fit:cover}
.ch-file{border:1px solid #E2E8F0;background:#fff;border-radius:10px;padding:7px 10px;font-weight:600;font-size:13px;text-align:left;cursor:pointer}.ch-file small{color:#94A3B8;font-weight:500}
.ch-box{display:flex;align-items:flex-end;gap:6px;border:1.5px solid #E2E8F0;border-radius:18px;padding:6px;background:#fff}
.ch-box textarea{flex:1;border:0;outline:0;resize:none;font:inherit;font-size:15px;padding:8px 4px;max-height:160px;min-height:22px;line-height:1.4;background:transparent}
.ch-ic{border:0;background:#F1F5F9;width:38px;height:38px;border-radius:12px;font-size:17px;cursor:pointer;flex:none}
.ch-send{border:0;background:#059669;color:#fff;width:42px;height:38px;border-radius:12px;font-size:16px;cursor:pointer;flex:none}
.ch-rec{display:flex;align-items:center;gap:10px;background:#FEF2F2;color:#991B1B;border-radius:12px;padding:8px 12px;font-size:13.5px}.ch-rec[hidden]{display:none}.ch-rec .dot{width:10px;height:10px;border-radius:50%;background:#DC2626;animation:chp 1s infinite}
.ch-rec button{border:0;border-radius:10px;padding:6px 12px;font-weight:700;cursor:pointer}.ch-rec #rstop{background:#059669;color:#fff;margin-left:auto}.ch-rec #rcancel{background:#fff;color:#991B1B}
@keyframes chp{50%{opacity:.3}}
`
let cssDone = false
export function injectChatCss() { if (cssDone) return; cssDone = true; const st = document.createElement('style'); st.textContent = CHAT_CSS; document.head.appendChild(st) }

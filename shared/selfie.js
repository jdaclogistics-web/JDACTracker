// Selfie camera with a time + date + day + location stamp, and Retake before it is used.
// Works in the phone app (WebView) and in browsers. Returns JPEG base64 (no "data:" prefix).
const CSS = `
.sfc{position:fixed;inset:0;z-index:300;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center}
.sfc video,.sfc img{width:100%;height:100%;object-fit:cover}.sfc video{transform:scaleX(-1)}
.sfc .ring{position:absolute;top:42%;left:50%;width:62vmin;height:78vmin;max-width:300px;max-height:380px;transform:translate(-50%,-50%);border:3px dashed rgba(255,255,255,.75);border-radius:50%;pointer-events:none}
.sfc .stamp{position:absolute;left:12px;right:12px;bottom:118px;background:rgba(0,0,0,.55);color:#fff;border-radius:12px;padding:8px 12px;font:600 13px/1.45 system-ui,sans-serif}
.sfc .bar{position:absolute;bottom:0;left:0;right:0;display:flex;align-items:center;justify-content:space-around;padding:18px 16px 28px;background:linear-gradient(transparent,rgba(0,0,0,.7))}
.sfc .bar button{border:0;cursor:pointer;font:700 15px system-ui,sans-serif;border-radius:14px;padding:12px 18px}
.sfc .shot{width:72px;height:72px;border-radius:50%!important;background:#fff;box-shadow:0 0 0 5px rgba(255,255,255,.35);padding:0!important}
.sfc .x{background:rgba(255,255,255,.18);color:#fff}.sfc .ok{background:#16A34A;color:#fff}.sfc .re{background:#fff;color:#0B1220}
.sfc .tip{position:absolute;top:18px;left:0;right:0;text-align:center;color:#fff;font:600 14px system-ui,sans-serif;text-shadow:0 1px 3px #000}`
let cssOn = false
const stampLines = (pos, who) => {
  const d = new Date(Date.now() + 330 * 60000) // IST
  const day = d.toLocaleDateString('en-IN', { weekday: 'long', timeZone: 'UTC' })
  const date = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' })
  const loc = pos && Number.isFinite(pos.lat) ? `📍 ${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}${pos.accuracy ? ` (±${Math.round(pos.accuracy)} m)` : ''}` : '📍 location not available'
  return [`${who ? who + ' · ' : ''}${day}`, `${date} · ${time} IST`, loc]
}
/** opts: { pos: {lat,lng,accuracy}, who: 'Name', maxW: 480 } */
export async function stampedSelfie(opts = {}) {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('no camera api')
  if (!cssOn) { const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); cssOn = true }
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'user' }, width: { ideal: 960 }, height: { ideal: 1280 } }, audio: false })
  return new Promise((resolve, reject) => {
    const ov = document.createElement('div'); ov.className = 'sfc'
    document.body.appendChild(ov)
    const stop = () => stream.getTracks().forEach((t) => t.stop())
    const live = () => {
      const lines = stampLines(opts.pos, opts.who)
      ov.innerHTML = `<video playsinline autoplay muted></video><div class="ring"></div><p class="tip">Keep your face inside the circle</p>
        <div class="stamp">${lines.map((l) => `<div>${l}</div>`).join('')}</div>
        <div class="bar"><button class="x">Cancel</button><button class="shot" aria-label="Take selfie"></button><span style="width:80px"></span></div>`
      const video = ov.querySelector('video'); video.srcObject = stream
      ov.querySelector('.x').onclick = () => { stop(); ov.remove(); reject(Object.assign(new Error('Selfie was not taken'), { cancelled: true })) }
      ov.querySelector('.shot').onclick = () => {
        const w = video.videoWidth, h = video.videoHeight; if (!w) return
        const s = Math.min(1, (opts.maxW || 480) / w)
        const c = document.createElement('canvas'); c.width = Math.round(w * s); c.height = Math.round(h * s)
        const g = c.getContext('2d')
        g.save(); g.translate(c.width, 0); g.scale(-1, 1); g.drawImage(video, 0, 0, c.width, c.height); g.restore()
        // stamp printed onto the photo: day, date, time, location
        const L = stampLines(opts.pos, opts.who), fs = Math.max(12, Math.round(c.width / 30)), pad = Math.round(fs * 0.7), lh = Math.round(fs * 1.4)
        const bh = pad * 2 + lh * L.length
        g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(0, c.height - bh, c.width, bh)
        g.fillStyle = '#fff'; g.font = `600 ${fs}px system-ui, sans-serif`; g.textBaseline = 'top'
        L.forEach((t, i) => g.fillText(t, pad, c.height - bh + pad + i * lh))
        const url = c.toDataURL('image/jpeg', 0.62)
        review(url)
      }
    }
    const review = (url) => {
      ov.innerHTML = `<img alt="Your selfie" src="${url}"><p class="tip">Check your photo</p>
        <div class="bar"><button class="re">↺ Retake</button><button class="ok">✓ Use photo</button></div>`
      ov.querySelector('.re').onclick = live
      ov.querySelector('.ok').onclick = () => { stop(); ov.remove(); resolve(url.split(',')[1]) }
    }
    live()
  })
}
/** GPS position (browser) */
export const browserPosition = () => new Promise((res, rej) => {
  if (!navigator.geolocation) return rej(new Error('GPS not available'))
  navigator.geolocation.getCurrentPosition((p) => res({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }), () => rej(new Error('Location is required — turn on GPS and allow it')), { enableHighAccuracy: true, timeout: 20000, maximumAge: 30000 })
})

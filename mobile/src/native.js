// Phone features — Android में native plugins, browser में web fallback.
import { Capacitor, registerPlugin } from '@capacitor/core'
import { Camera, CameraResultType, CameraSource, CameraDirection } from '@capacitor/camera'
import { Geolocation } from '@capacitor/geolocation'
import { Device } from '@capacitor/device'
import { Preferences } from '@capacitor/preferences'

export const isNative = () => Capacitor.isNativePlatform()
export const BackgroundGeolocation = registerPlugin('BackgroundGeolocation')

/** Durable key-value storage (Android: SharedPreferences — ऐप बंद/restart के बाद भी रहता है) */
export const store = {
  async get(k) {
    if (isNative()) return (await Preferences.get({ key: k })).value
    return localStorage.getItem(k)
  },
  async set(k, v) {
    if (isNative()) return Preferences.set({ key: k, value: v })
    localStorage.setItem(k, v)
  },
}

export async function currentPosition() {
  if (isNative()) {
    let perm = await Geolocation.checkPermissions().catch(() => null)
    if (!perm || perm.location !== 'granted') perm = await Geolocation.requestPermissions().catch(() => null)
    if (!perm || perm.location !== 'granted') throw new Error('Location permission नहीं मिली — Settings में Allow करें')
    const p = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 20000, maximumAge: 30000 })
    return { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }
  }
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('GPS उपलब्ध नहीं'))
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
      () => reject(new Error('Location चालू करें और Allow करें')),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 30000 })
  })
}

/** Front camera selfie → छोटा JPEG base64 (~25 KB).
 *  पहले app के अंदर वाला camera (हमेशा front) — कई phones system camera में back खोल देते हैं.
 *  वो न चले तो Android camera (direction Front) fallback. */
export async function takeSelfie() {
  try { return await inAppSelfie() } catch (e) { if (e?.cancelled) throw new Error('Selfie नहीं ली गई') }
  let dataUrl
  if (isNative()) {
    const photo = await Camera.getPhoto({ source: CameraSource.Camera, direction: CameraDirection.Front, resultType: CameraResultType.DataUrl, quality: 60, width: 480, correctOrientation: true, saveToGallery: false })
    dataUrl = photo.dataUrl
  } else {
    const file = await new Promise((resolve, reject) => {
      const inp = document.createElement('input')
      inp.type = 'file'; inp.accept = 'image/*'; inp.capture = 'user'
      inp.onchange = () => (inp.files?.[0] ? resolve(inp.files[0]) : reject(new Error('Selfie नहीं ली गई')))
      inp.click()
    })
    dataUrl = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(file) })
  }
  return shrink(dataUrl)
}

async function inAppSelfie() {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('no camera api')
  if (isNative()) { try { await Camera.requestPermissions({ permissions: ['camera'] }) } catch { /* */ } }
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'user' }, width: { ideal: 960 }, height: { ideal: 1280 } }, audio: false })
  return new Promise((resolve, reject) => {
    const ov = document.createElement('div')
    ov.className = 'selfiecam'
    ov.innerHTML = `<video playsinline autoplay muted></video><div class="sc-ring"></div>
      <div class="sc-bar"><button class="sc-x" aria-label="Cancel">✕</button><button class="sc-shot" aria-label="Take selfie"></button><span></span></div>
      <p class="sc-tip">चेहरा गोले के अंदर रखें</p>`
    document.body.appendChild(ov)
    const video = ov.querySelector('video')
    video.srcObject = stream
    const done = (fn) => { stream.getTracks().forEach((t) => t.stop()); ov.remove(); fn() }
    ov.querySelector('.sc-x').onclick = () => done(() => reject(Object.assign(new Error('cancelled'), { cancelled: true })))
    ov.querySelector('.sc-shot').onclick = () => {
      const w = video.videoWidth, h = video.videoHeight
      if (!w) return
      const s = Math.min(1, 480 / w)
      const c = document.createElement('canvas'); c.width = Math.round(w * s); c.height = Math.round(h * s)
      const g = c.getContext('2d'); g.translate(c.width, 0); g.scale(-1, 1) // mirror जैसा preview में दिखा
      g.drawImage(video, 0, 0, c.width, c.height)
      const b64 = c.toDataURL('image/jpeg', 0.6).split(',')[1]
      done(() => resolve(b64))
    }
  })
}
async function shrink(dataUrl, maxW = 480) {
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = dataUrl })
  const s = Math.min(1, maxW / img.width)
  const c = document.createElement('canvas')
  c.width = Math.round(img.width * s); c.height = Math.round(img.height * s)
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
  return c.toDataURL('image/jpeg', 0.6).split(',')[1]
}

export async function deviceId() {
  if (isNative()) { try { return (await Device.getId()).identifier } catch { /* */ } }
  let id = localStorage.getItem('jdac_device')
  if (!id) { id = 'web-' + Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('jdac_device', id) }
  return id
}
export function openAppSettings() { if (isNative()) BackgroundGeolocation.openSettings().catch(() => {}) }

/** App पहली बार खुलने पर Location + Camera permission माँगना (Android popup). दोबारा नहीं पूछता. */
export async function askPermissionsOnce() {
  if (!isNative()) return
  if (await store.get('jdac_perm_asked')) return
  await store.set('jdac_perm_asked', '1')
  try { await Geolocation.requestPermissions({ permissions: ['location'] }) } catch { /* user ने मना किया — Start day पर फिर पूछेंगे */ }
  try { await Camera.requestPermissions({ permissions: ['camera'] }) } catch { /* */ }
}

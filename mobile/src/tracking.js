// Warehouse team GPS tracking — ऐप background में या screen lock हो तब भी (Android foreground service).
// Duty: हर 1 मिनट (खड़े हों तब भी heartbeat). Delivery mode: हर 15 सेकंड / 25 m.
import { isNative, BackgroundGeolocation, store } from './native.js'
import { enqueue, flush } from './queue.js'
import { haversineM, uuid, istDate } from '@shared/util.js'

const DUTY_MS = 60_000, FIELD_MS = 15_000, FIELD_MOVE_M = 25
let st = null
const listeners = new Set()
export const onTracking = (fn) => { listeners.add(fn); return () => listeners.delete(fn) }
const emit = (x) => listeners.forEach((f) => { try { f(x) } catch { /* */ } })
export const trackingState = () => (st ? { running: true, field: st.field, lastSavedAt: st.lastSavedAt } : { running: false })

async function accept(lat, lng, accuracy, force = false) {
  if (!st) return
  const now = Date.now()
  const prev = st.saved
  st.last = { lat, lng, accuracy, t: now }
  if (!force && prev) {
    if (now - prev.t < (st.field ? FIELD_MS : DUTY_MS)) return
    if (st.field && haversineM(prev.lat, prev.lng, lat, lng) < FIELD_MOVE_M) return
  }
  if (accuracy && accuracy > 150 && !force) return
  st.saved = { lat, lng, t: now }
  st.lastSavedAt = new Date(now).toISOString()
  await enqueue({ client_id: uuid(), date: st.date, lat, lng, accuracy: accuracy ?? null, kind: st.field ? 'field' : 'duty', recorded_at: st.lastSavedAt })
  emit(trackingState())
  if (st.field) flush()
}

async function watch() {
  if (isNative()) {
    st.watcher = await BackgroundGeolocation.addWatcher({
      backgroundTitle: 'JDAC — Duty tracking चालू है',
      backgroundMessage: 'End day करने पर tracking बंद हो जाएगी',
      requestPermissions: true, stale: false, distanceFilter: st.field ? 10 : 20,
    }, (loc, err) => {
      if (err) { emit({ error: err.code === 'NOT_AUTHORIZED' ? 'denied' : err.message }); return }
      if (loc) accept(loc.latitude, loc.longitude, loc.accuracy)
    })
  } else if (navigator.geolocation) {
    st.webWatch = navigator.geolocation.watchPosition((p) => accept(p.coords.latitude, p.coords.longitude, p.coords.accuracy),
      (e) => { if (e.code === e.PERMISSION_DENIED) emit({ error: 'denied' }) }, { enableHighAccuracy: true, maximumAge: st.field ? 5000 : 30000 })
  }
}
async function unwatch() {
  if (!st) return
  if (st.watcher) await BackgroundGeolocation.removeWatcher({ id: st.watcher }).catch(() => {})
  if (st.webWatch != null) navigator.geolocation.clearWatch(st.webWatch)
  st.watcher = null; st.webWatch = null
}

export async function startTracking(date = istDate()) {
  if (st && st.date === date) return
  await stopTracking()
  const f = JSON.parse((await store.get('jdac_field')) || 'null')
  st = { date, field: !!(f && f.date === date && f.on), saved: null, last: null, lastSavedAt: null }
  await watch()
  st.beat = setInterval(() => { if (st?.last && Date.now() - (st.saved?.t ?? 0) >= DUTY_MS) accept(st.last.lat, st.last.lng, st.last.accuracy, true) }, DUTY_MS)
  st.flusher = setInterval(flush, 30_000)
  emit(trackingState())
}
export async function stopTracking() {
  if (!st) return
  await unwatch()
  clearInterval(st.beat); clearInterval(st.flusher)
  st = null
  await flush()
  emit(trackingState())
}
export async function setFieldMode(on) {
  if (!st) return
  st.field = on
  await store.set('jdac_field', JSON.stringify({ date: st.date, on }))
  await unwatch(); await watch()
  if (st.last) await accept(st.last.lat, st.last.lng, st.last.accuracy, true)
  emit(trackingState())
}

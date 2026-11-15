// Shared helpers: IST time, password hashing, signed tokens, km calculation.
const enc = new TextEncoder()

// ── Time (सब IST में) ─────────────────────────────────────────────────────
export function istDate(d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}
export function istMinutes(iso) {
  const t = new Date(new Date(iso).getTime() + 330 * 60000)
  return t.getUTCHours() * 60 + t.getUTCMinutes()
}
export const nowIso = () => new Date().toISOString()

// ── base64url ───────────────────────────────────────────────────────────
function b64u(bytes) {
  let s = ''
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function unb64u(str) {
  const s = atob(str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4))
  return Uint8Array.from(s, (c) => c.charCodeAt(0))
}
export function bytesToB64(bytes) {
  let s = ''
  const arr = new Uint8Array(bytes)
  for (let i = 0; i < arr.length; i += 0x8000) s += String.fromCharCode(...arr.subarray(i, i + 0x8000))
  return btoa(s)
}
export function b64ToBytes(b64) {
  const s = atob(b64)
  const out = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i)
  return out
}

// ── Password: PBKDF2-SHA256 (Workers max 100k iterations) ───────────────────
const ITER = 100000
async function pbkdf2(password, salt, iter) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, key, 256))
}
export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  return `pbkdf2$${ITER}$${b64u(salt)}$${b64u(await pbkdf2(password, salt, ITER))}`
}
export async function verifyPassword(password, stored) {
  const [alg, iter, salt, hash] = String(stored || '').split('$')
  if (alg !== 'pbkdf2') return false
  const got = await pbkdf2(password, unb64u(salt), Number(iter))
  const want = unb64u(hash)
  if (got.length !== want.length) return false
  let diff = 0
  for (let i = 0; i < got.length; i++) diff |= got[i] ^ want[i]
  return diff === 0
}

// ── Signed login token (HMAC-SHA256) ─────────────────────────────────────────
async function hmacKey(secret) {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}
export async function signToken(payload, secret) {
  const body = b64u(enc.encode(JSON.stringify(payload)))
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(body))
  return `${body}.${b64u(sig)}`
}
export async function verifyToken(token, secret) {
  const [body, sig] = String(token || '').split('.')
  if (!body || !sig) return null
  const ok = await crypto.subtle.verify('HMAC', await hmacKey(secret), unb64u(sig), enc.encode(body))
  if (!ok) return null
  try {
    const p = JSON.parse(new TextDecoder().decode(unb64u(body)))
    if (p.exp && Date.now() > p.exp) return null
    return p
  } catch { return null }
}

// ── KM (पुराने JDAC tracker वाला logic) ──────────────────────────────────────
export function haversineKm(lat1, lng1, lat2, lng2) {
  const r = Math.PI / 180
  const a = Math.sin(((lat2 - lat1) * r) / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(((lng2 - lng1) * r) / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(a))
}
/** jitter <30 m skip, single jump >150 km skip, >120 km/h skip. field pings ≥2 → वही source. */
export function computeKm(pings, manualKm = 0) {
  const field = pings.filter((p) => p.kind === 'field')
  const use = (field.length >= 2 ? field : pings).slice().sort((a, b) => (a.recorded_at < b.recorded_at ? -1 : a.recorded_at > b.recorded_at ? 1 : a.id - b.id))
  let gps = 0
  for (let i = 1; i < use.length; i++) {
    const a = use[i - 1], b = use[i]
    const d = haversineKm(a.lat, a.lng, b.lat, b.lng)
    if (d < 0.03 || d > 150) continue
    const dtMin = (new Date(b.recorded_at) - new Date(a.recorded_at)) / 60000
    if (dtMin > 0 && dtMin < 30 && d / (dtMin / 60) > 120) continue
    gps += d
  }
  return Math.round(Math.max(gps, manualKm || 0) * 100) / 100
}

export function phone10(s) {
  const d = String(s || '').replace(/\D/g, '')
  return d.length >= 10 ? d.slice(-10) : d
}

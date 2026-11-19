// JDAC Tracker — API client (mobile + web दोनों यही use करते हैं)
// API_URL build के समय VITE_API_URL से आता है.
// Live server (Cloudflare Worker). Local test के लिए VITE_API_URL=http://localhost:8787 रखें.
export const LIVE_API = 'https://jdac-tracker-api.jdaclogistics.workers.dev'
export const API_URL = (import.meta.env?.VITE_API_URL || LIVE_API).replace(/\/$/, '')
export const SERVER_SET = true

const TKEY = 'jdac_token'
const MKEY = 'jdac_me'
export const auth = {
  get token() { try { return localStorage.getItem(TKEY) } catch { return null } },
  get me() { try { return JSON.parse(localStorage.getItem(MKEY) || 'null') } catch { return null } },
  save(token, me) { localStorage.setItem(TKEY, token); localStorage.setItem(MKEY, JSON.stringify(me)) },
  clear() { localStorage.removeItem(TKEY); localStorage.removeItem(MKEY) },
}

export class ApiError extends Error { constructor(status, msg) { super(msg); this.status = status } }

export async function api(method, path, body, { raw = false, timeout = 20000 } = {}) {
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), timeout)
  let r
  try {
    r = await fetch(API_URL + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(auth.token ? { Authorization: 'Bearer ' + auth.token } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal: ctl.signal,
    })
  } catch {
    if (!SERVER_SET && !import.meta.env?.DEV) throw new ApiError(0, 'Server is not live yet — login will work once setup is done')
    throw new ApiError(0, 'No internet — data is safe on the phone')
  } finally { clearTimeout(t) }
  if (r.status === 401 && path !== '/api/login') { auth.clear(); window.dispatchEvent(new Event('jdac-logout')) }
  if (raw) { if (!r.ok) throw new ApiError(r.status, 'Error ' + r.status); return r }
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new ApiError(r.status, data.error || 'Error ' + r.status)
  return data
}

// Short GET cache: pages open instantly when you come back to them; any save clears it
const cache = new Map()
const NO_CACHE = /^\/api\/(cc\/chat|day\/|me\b|login|admin\/photo|admin\/trail)/
export const get = (p, { fresh = false } = {}) => {
  if (NO_CACHE.test(p)) return api('GET', p)
  const hit = cache.get(p)
  if (!fresh && hit && Date.now() - hit.at < 15000) return hit.pr
  const pr = api('GET', p); cache.set(p, { at: Date.now(), pr })
  pr.catch(() => cache.delete(p))
  return pr
}
export const clearCache = () => cache.clear()
export const post = (p, b) => { cache.clear(); return api('POST', p, b || {}) }
export const patch = (p, b) => { cache.clear(); return api('PATCH', p, b || {}) }
export const prefetch = (...ps) => ps.forEach((p) => get(p).catch(() => {}))

export async function login(username, password, device_id) {
  const r = await post('/api/login', { username, password, device_id })
  auth.save(r.token, r.me)
  return r.me
}
export function logout() { auth.clear() }

/** Admin photo (selfie) → object URL */
export async function photoUrl(ref) {
  if (!ref) return null
  const r = await api('GET', '/api/admin/photo?ref=' + encodeURIComponent(ref), null, { raw: true })
  return URL.createObjectURL(await r.blob())
}

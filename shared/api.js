// JDAC Tracker — API client (mobile + web दोनों यही use करते हैं)
// API_URL build के समय VITE_API_URL से आता है.
export const API_URL = (import.meta.env?.VITE_API_URL || 'http://localhost:8787').replace(/\/$/, '')

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
    throw new ApiError(0, 'नेट नहीं है — data phone में सुरक्षित है')
  } finally { clearTimeout(t) }
  if (r.status === 401 && path !== '/api/login') { auth.clear(); window.dispatchEvent(new Event('jdac-logout')) }
  if (raw) { if (!r.ok) throw new ApiError(r.status, 'Error ' + r.status); return r }
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new ApiError(r.status, data.error || 'Error ' + r.status)
  return data
}

export const get = (p) => api('GET', p)
export const post = (p, b) => api('POST', p, b || {})
export const patch = (p, b) => api('PATCH', p, b || {})

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

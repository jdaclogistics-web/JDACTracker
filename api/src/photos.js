// Selfie photos → Supabase Storage (bucket "selfies", private).
// Supabase न मिले / down हो → photo D1 के photos table में (कभी miss नहीं),
// cron बाद में उसे Supabase पर भेज देता है।
import { b64ToBytes, bytesToB64 } from './lib.js'

const BUCKET = 'selfies'
const hasSupabase = (env) => !!(env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY)
// नई "sb_secret_…" key और पुरानी service_role (JWT) key — दोनों चलें
const sbHeaders = (env) => { const k = env.SUPABASE_SERVICE_KEY; return k.startsWith('eyJ') ? { apikey: k, Authorization: `Bearer ${k}` } : { apikey: k } }

async function supabasePut(env, key, bytes, mime) {
  const r = await fetch(`${env.SUPABASE_URL}/storage/v1/object/${BUCKET}/${key}`, {
    method: 'POST',
    headers: { ...sbHeaders(env), 'Content-Type': mime, 'x-upsert': 'true' },
    body: bytes,
  })
  if (!r.ok) throw new Error(`supabase ${r.status}`)
}

/** base64 JPEG save करो, key लौटाओ ("sb:" = Supabase पर, "db:" = D1 fallback में) */
export async function savePhoto(env, key, base64, mime = 'image/jpeg') {
  if (!base64) return null
  const bytes = b64ToBytes(String(base64).replace(/^data:[^,]+,/, ''))
  if (bytes.length > 1_500_000) throw new Error('photo too large')
  if (hasSupabase(env)) {
    try { await supabasePut(env, key, bytes, mime); return `sb:${key}` } catch { /* fallback */ }
  }
  await env.DB.prepare('INSERT OR REPLACE INTO photos (key, mime, data) VALUES (?, ?, ?)').bind(key, mime, bytes).run()
  return `db:${key}`
}

/** Admin photo देखे: Supabase से या D1 से */
export async function readPhoto(env, ref) {
  if (!ref) return null
  const [where, ...rest] = ref.split(':')
  const key = rest.join(':')
  if (where === 'sb' && hasSupabase(env)) {
    const r = await fetch(`${env.SUPABASE_URL}/storage/v1/object/${BUCKET}/${key}`, { headers: sbHeaders(env) })
    if (r.ok) return { mime: r.headers.get('content-type') || 'image/jpeg', body: await r.arrayBuffer() }
  }
  const row = await env.DB.prepare('SELECT mime, data FROM photos WHERE key = ?').bind(key).first()
  if (!row) return null
  return { mime: row.mime, body: row.data instanceof ArrayBuffer ? row.data : new Uint8Array(row.data).buffer }
}

/** Cron: D1 में रुकी photos को Supabase पर भेजो (D1 वाली copy तभी हटती है जब Supabase पर पक्का पहुँच जाए) */
export async function flushPendingPhotos(env, limit = 20) {
  if (!hasSupabase(env)) return 0
  const { results } = await env.DB.prepare('SELECT key, mime, data FROM photos WHERE moved = 0 LIMIT ?').bind(limit).all()
  let moved = 0
  for (const p of results) {
    try {
      await supabasePut(env, p.key, new Uint8Array(p.data), p.mime)
      await env.DB.batch([
        env.DB.prepare("UPDATE day_sessions SET start_photo = 'sb:' || ? WHERE start_photo = 'db:' || ?").bind(p.key, p.key),
        env.DB.prepare("UPDATE day_sessions SET end_photo = 'sb:' || ? WHERE end_photo = 'db:' || ?").bind(p.key, p.key),
        env.DB.prepare('UPDATE photos SET moved = 1, data = x\'\' WHERE key = ?').bind(p.key),
      ])
      moved++
    } catch { break }
  }
  return moved
}

export { bytesToB64 }

// Training files (PDF, mock tests…) → same private Supabase bucket, under "training/"
export async function saveFile(env, key, bytes, mime) {
  if (!hasSupabase(env)) throw new Error('File storage is not connected')
  await supabasePut(env, key, bytes, mime)
}
export async function readFile(env, key) {
  if (!hasSupabase(env)) return null
  const r = await fetch(`${env.SUPABASE_URL}/storage/v1/object/${BUCKET}/${key}`, { headers: sbHeaders(env) })
  return r.ok ? { mime: r.headers.get('content-type') || 'application/octet-stream', body: await r.arrayBuffer() } : null
}
export async function deleteFile(env, key) {
  if (!hasSupabase(env)) return
  await fetch(`${env.SUPABASE_URL}/storage/v1/object/${BUCKET}`, { method: 'DELETE', headers: { ...sbHeaders(env), 'Content-Type': 'application/json' }, body: JSON.stringify({ prefixes: [key] }) })
}

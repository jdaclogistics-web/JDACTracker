// Offline GPS queue — हर point पहले phone में save, फिर server.
// Server जिन client_id को "accepted" बोले, सिर्फ़ वही queue से हटते हैं → कुछ भी miss नहीं.
import { store } from './native.js'
import { post } from '@shared/api.js'

const QKEY = 'jdac_ping_queue'
const RKEY = 'jdac_rejected'
const MAX = 20000
let cache = null
let flushing = false
export let lastSyncAt = null
const listeners = new Set()
export const onQueueChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn) }
const emit = () => listeners.forEach((f) => { try { f(cache.length) } catch { /* */ } })

async function load() {
  if (cache) return cache
  try { cache = JSON.parse((await store.get(QKEY)) || '[]') } catch { cache = [] }
  return cache
}
async function save() { await store.set(QKEY, JSON.stringify(cache.slice(-MAX))); emit() }

export async function enqueue(p) { await load(); cache.push(p); await save() }
export async function queueSize() { return (await load()).length }

export async function flush() {
  if (flushing) return
  flushing = true
  try {
    await load()
    while (cache.length) {
      const batch = cache.slice(0, 200)
      const r = await post('/api/pings', { pings: batch }) // network error → throw → queue जस का तस
      const done = new Set([...r.accepted, ...r.rejected.map((x) => x.client_id)])
      if (r.rejected.length) {
        const old = JSON.parse((await store.get(RKEY)) || '[]')
        await store.set(RKEY, JSON.stringify([...old, ...batch.filter((b) => r.rejected.some((x) => x.client_id === b.client_id)).map((b) => ({ ...b, reason: r.rejected.find((x) => x.client_id === b.client_id).reason }))].slice(-500)))
      }
      cache = cache.filter((p) => !done.has(p.client_id))
      await save()
      lastSyncAt = new Date().toISOString()
      if (!done.size) break
    }
  } catch { /* offline — बाद में */ } finally { flushing = false }
}

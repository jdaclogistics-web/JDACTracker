// Live update: नया code GitHub (branch "live") पर आते ही app खुद download करके लगा लेता है —
// APK दोबारा install नहीं करना पड़ता. सिर्फ native बदलाव (नया plugin/permission) पर नया APK चाहिए.
import { Capacitor, registerPlugin } from '@capacitor/core'

const Updater = registerPlugin('CapacitorUpdater')
const FEED = 'https://raw.githubusercontent.com/jdaclogistics-web/JDACTracker/live/version.json'
export const BUILD = import.meta.env?.VITE_BUILD || 'dev'

export async function liveUpdate({ onStatus } = {}) {
  if (!Capacitor.isNativePlatform()) return
  try { await Updater.notifyAppReady() } catch { return } // plugin नहीं (पुराना APK) → चुपचाप छोड़ो
  try {
    const r = await fetch(FEED + '?t=' + Date.now(), { cache: 'no-store' })
    if (!r.ok) return
    const v = await r.json()
    if (!v?.version || !v?.url || v.version === BUILD) return
    const cur = await Updater.current().catch(() => null)
    if (cur?.bundle?.version === v.version) return
    onStatus?.('नया update आ रहा है…')
    const bundle = await Updater.download({ url: v.url, version: v.version })
    onStatus?.('Update हो गया — app फिर से खुल रहा है')
    await Updater.set(bundle) // app reload होकर नया code चलेगा
  } catch (e) { console.warn('liveUpdate', e) }
}

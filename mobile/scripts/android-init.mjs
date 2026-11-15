// Android project तैयार करता है: cap add android → permissions → icons → sync.
// चलाएँ: npm run build && npm run android:init
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const run = (cmd, opts = {}) => { console.log('› ' + cmd); execSync(cmd, { stdio: 'inherit', ...opts }) }

if (!existsSync('dist/index.html')) run('npx vite build')
if (!existsSync('android')) run('npx cap add android')

// ── Permissions (GPS, background tracking, camera, notification) ─────────────
const mf = 'android/app/src/main/AndroidManifest.xml'
let xml = readFileSync(mf, 'utf8')
const perms = [
  'android.permission.ACCESS_COARSE_LOCATION',
  'android.permission.ACCESS_FINE_LOCATION',
  'android.permission.FOREGROUND_SERVICE',
  'android.permission.FOREGROUND_SERVICE_LOCATION',
  'android.permission.POST_NOTIFICATIONS',
  'android.permission.WAKE_LOCK',
  'android.permission.CAMERA',
  'android.permission.INTERNET',
  'android.permission.ACCESS_NETWORK_STATE',
]
const add = perms
  .filter((p) => !xml.includes(`"${p}"`))
  .map((p) => `    <uses-permission android:name="${p}" />`)
if (!xml.includes('android.hardware.location.gps')) add.push('    <uses-feature android:name="android.hardware.location.gps" android:required="false" />')
if (!xml.includes('android.hardware.camera"')) add.push('    <uses-feature android:name="android.hardware.camera" android:required="false" />')
if (add.length) {
  xml = xml.replace('</manifest>', add.join('\n') + '\n</manifest>')
  writeFileSync(mf, xml)
  console.log(`✔ ${add.length} permissions जोड़े`)
}

// ── Notification channel name (background tracking notification) ─────────────
const strings = 'android/app/src/main/res/values/strings.xml'
let s = readFileSync(strings, 'utf8')
if (!s.includes('capacitor_background_geolocation_notification_channel_name')) {
  s = s.replace('</resources>', '    <string name="capacitor_background_geolocation_notification_channel_name">Duty tracking</string>\n</resources>')
  writeFileSync(strings, s)
}

// ── App icon + splash (assets/ से) ────────────────────────────────────────────
try {
  run('npx @capacitor/assets generate --android --iconBackgroundColor "#0f172a" --splashBackgroundColor "#0f172a"')
} catch {
  console.warn('⚠ icon generate नहीं हुआ — default icon रहेगा (APK पर असर नहीं)')
}

run('npx cap sync android')
console.log('\n✅ Android project तैयार: android/  →  Android Studio में खोलें या ./gradlew assembleDebug')

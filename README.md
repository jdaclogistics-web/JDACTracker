# JDAC Tracker

Employee attendance + GPS tracking for JDAC Logistics.

| Folder | What | Tech |
|---|---|---|
| `mobile/` | Employee Android app (single login, selfie + GPS start/end day, warehouse live tracking, offline queue) | Capacitor 7 + Vite |
| `web/` | Admin panel — HR / Boss / Developer (role from login) | Vite + Leaflet |
| `api/` | Server API + cron (no-signal alerts, auto-close, photo flush) | Cloudflare Worker + D1 |
| `shared/` | API client, helpers, theme used by both apps | — |

## सुबह PC पर शुरू करें (Android Studio)

```bash
cd mobile
npm install
npm run build
npm run android:init      # android/ folder बनाता है, permissions + icons डालता है
npx cap open android      # Android Studio खुलेगा → ▶ Run (phone USB से जोड़ें)
```
कोड बदलने के बाद: `npm run android:sync` फिर Android Studio में ▶ Run.

Local test (बिना phone): `cd web && npm install && npm run dev` → http://localhost:5174  ·  `cd mobile && npm run dev`

API server (Cloudflare account बनने के बाद):
```bash
cd api && npm install
npx wrangler login
npx wrangler d1 create jdac-tracker          # मिला database_id → wrangler.toml में
npm run db:init
npx wrangler secret put TOKEN_SECRET         # कोई लंबा random text
npx wrangler secret put SUPABASE_SERVICE_KEY # Supabase (selfies bucket) — optional
npm run deploy
```
फिर GitHub → Settings → Variables: `API_URL` = worker URL. APK हर push पर Actions → "Android APK" में बनता है।

## Rules (data safety)
- GPS ping का `client_id` unique → offline से दोबारा भेजने पर duplicate नहीं।
- Database में DELETE बंद (triggers), GPS points बदल नहीं सकते, हर correction audit_log में।
- `.env`, database dump, keystore **कभी commit न करें**।
- Tests: `cd api && node test/api.test.mjs` (Node 22+).

import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
// दो pages: index.html = employee app, admin.html = Boss/HR admin panel (web/src से) — एक ही APK में
export default defineConfig({
  base: './',
  resolve: { alias: { '@shared': fileURLToPath(new URL('../shared', import.meta.url)), leaflet: fileURLToPath(new URL('./node_modules/leaflet', import.meta.url)) } },
  server: { port: 5173, host: true, fs: { allow: ['..'] } },
  build: { outDir: 'dist', emptyOutDir: true, target: 'es2020',
    rollupOptions: { input: { main: fileURLToPath(new URL('./index.html', import.meta.url)), admin: fileURLToPath(new URL('./admin.html', import.meta.url)) } } },
})

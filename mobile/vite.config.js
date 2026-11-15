import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
export default defineConfig({
  base: './',
  resolve: { alias: { '@shared': fileURLToPath(new URL('../shared', import.meta.url)) } },
  server: { port: 5173, host: true, fs: { allow: ['..'] } },
  build: { outDir: 'dist', emptyOutDir: true, target: 'es2020' },
})

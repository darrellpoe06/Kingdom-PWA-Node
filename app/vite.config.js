import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base set so built assets resolve under the Synology Web Station alias portal
// at /poetech-app/ on the shared QuickConnect URL.
//
// Build markers (2026-05-28): inject build time + commit SHA at build so the
// app can show "you are on build X" in the UI. Stops the recurring "is the
// phone actually on the new build?" confusion when iOS Safari aggressively
// caches HTML. The SHA comes from Vercel's automatically-injected
// VERCEL_GIT_COMMIT_SHA env var; locally falls back to 'dev'.
const buildTime = new Date().toISOString();
const buildSha = (process.env.VERCEL_GIT_COMMIT_SHA || 'dev').slice(0, 7);
// Dev-only proxy so the NAS-backed bridges (/n8n/webhook/*) work in `vite dev`
// exactly as the production Vercel rewrite makes them work. LAN-reachable
// NAS; never used in the production build (Vercel handles /n8n there).
const N8N_DEV_TARGET = process.env.N8N_DEV_TARGET || 'http://192.168.1.26:5678';
export default defineConfig({
  base: '/poetech-app/',
  plugins: [react()],
  define: {
    __BUILD_TIME__: JSON.stringify(buildTime),
    __BUILD_SHA__: JSON.stringify(buildSha),
  },
  server: {
    proxy: {
      '/n8n': { target: N8N_DEV_TARGET, changeOrigin: true, rewrite: (p) => p.replace(/^\/n8n/, '') },
    },
  },
});

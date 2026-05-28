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
export default defineConfig({
  base: '/poetech-app/',
  plugins: [react()],
  define: {
    __BUILD_TIME__: JSON.stringify(buildTime),
    __BUILD_SHA__: JSON.stringify(buildSha),
  },
});

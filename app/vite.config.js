import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// DR-0061 (surfaces are live views of real flow): the Build board's automation
// count must be a REAL number, not hand-typed. Count the actual n8n workflow
// files in the repo at build time — `built` is the file count (a fact), `active`
// is how many carry "active": true in the repo JSON (REPO state, not live
// run-status; live status arrives in Stage 2 via the dispatch feed). Best-effort:
// a missing dir or unparseable file degrades the count, never crashes the build.
function countWorkflowFiles() {
  const dirs = ['../docs/00-foundations/n8n-workflows/', '../infra/n8n/'];
  let built = 0;
  let active = 0;
  for (const rel of dirs) {
    let names = [];
    try { names = readdirSync(fileURLToPath(new URL(rel, import.meta.url))); } catch { continue; }
    for (const f of names) {
      if (!f.endsWith('.json')) continue;
      built++;
      try {
        let raw = readFileSync(fileURLToPath(new URL(rel + f, import.meta.url)), 'utf8');
        if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
        if (JSON.parse(raw).active === true) active++;
      } catch { /* still a built workflow even if unparseable */ }
    }
  }
  return { built, active };
}
const workflowStats = countWorkflowFiles();

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

// SW versioning (LESSONS-LEARNED.md 2026-06-03, forward fix #4): public/sw.js
// is copied to dist verbatim, so `define` can't reach it. This plugin rewrites
// the __SW_VERSION__ placeholder in dist/sw.js after the bundle is written,
// so every deploy produces a byte-different service worker whose cache name
// carries the deploy's SHA (timestamp fallback keeps local builds unique).
const swVersion = buildSha !== 'dev' ? buildSha : 'dev-' + buildTime.replace(/[:.]/g, '-');
const swVersionStamp = () => ({
  name: 'sw-version-stamp',
  apply: 'build',
  closeBundle() {
    const swPath = fileURLToPath(new URL('./dist/sw.js', import.meta.url));
    const src = readFileSync(swPath, 'utf8');
    if (!src.includes("'__SW_VERSION__'")) {
      throw new Error('sw-version-stamp: __SW_VERSION__ placeholder missing from dist/sw.js');
    }
    writeFileSync(swPath, src.replace("'__SW_VERSION__'", JSON.stringify(swVersion)));
  },
});

// Dev-only proxy so the NAS-backed bridges (/n8n/webhook/*) work in `vite dev`
// exactly as the production Vercel rewrite makes them work. LAN-reachable
// NAS; never used in the production build (Vercel handles /n8n there).
const N8N_DEV_TARGET = process.env.N8N_DEV_TARGET || 'http://192.168.1.26:5678';

export default defineConfig({
  base: '/poetech-app/',
  plugins: [react(), swVersionStamp()],
  define: {
    __BUILD_TIME__: JSON.stringify(buildTime),
    __BUILD_SHA__: JSON.stringify(buildSha),
    __WORKFLOW_STATS__: JSON.stringify(workflowStats),
  },
  server: {
    proxy: {
      '/n8n': { target: N8N_DEV_TARGET, changeOrigin: true, rewrite: (p) => p.replace(/^\/n8n/, '') },
    },
  },
});

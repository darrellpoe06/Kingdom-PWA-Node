import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { buildQualityManifest } from '../scripts/quality-manifest.mjs';
import { buildInterconnectManifest } from '../scripts/interconnect-manifest.mjs';
import { buildConflictManifest } from '../scripts/orchestration/conflict-analytics.mjs';

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

// Governance decision queue (Darrell, 2026-06-13: "built inside and outside of
// the app ... for comprehensive review and continuity of work"). The repo file
// docs/governance/decision-queue.md is the single source of truth; this parses
// its OPEN items at build time so the in-app surface shows the SAME real file —
// no second source, no painted data. Best-effort: a missing file degrades to an
// empty queue, never crashes the build.
function readGovernanceQueue() {
  let raw = '';
  try {
    raw = readFileSync(fileURLToPath(new URL('../docs/governance/decision-queue.md', import.meta.url)), 'utf8');
  } catch { return { ok: false, openCount: 0, items: [] }; }
  // Isolate the "## OPEN" section (everything up to "## DECIDED").
  const openSection = (raw.split(/^##\s+OPEN\b.*$/m)[1] || '').split(/^##\s+DECIDED\b/m)[0];
  const blocks = openSection.split(/^###\s+/m).slice(1);
  const field = (block, label) => {
    const m = block.match(new RegExp(`\\*\\*${label}:\\*\\*\\s*([^\\n]+)`, 'i'));
    return m ? m[1].trim() : '';
  };
  const items = blocks.map((b) => {
    const head = (b.split('\n')[0] || '').trim();
    const [idPart, ...titleParts] = head.split('·');
    const tierMatch = b.match(/Tier\s+([ABC])\b/);
    return {
      id: (idPart || '').trim(),
      title: titleParts.join('·').trim(),
      unblocks: field(b, 'Unblocks'),
      recommendation: field(b, 'My recommendation') || field(b, 'Recommendation'),
      track: field(b, 'Track'),
      tier: tierMatch ? tierMatch[1] : '',
    };
  }).filter((it) => /^OPEN-\d+/.test(it.id));
  return { ok: true, openCount: items.length, items };
}
const governanceQueue = readGovernanceQueue();

// Decision Record (DR) ledger (DR-0065: the app is the primary artifact +
// sovereignty: the app must be fully usable without GitHub). The decided
// records live in docs/decisions/ — per-DR files (rich frontmatter + ## Decision
// + ## Context) for most IDs, plus a chain table in INDEX.md for DR-0017..0049
// which were recorded as INDEX rows rather than per-DR files. This parses BOTH
// at build time so the in-app Decisions tab renders the SAME real ledger with no
// outbound github.com link. Best-effort: a missing dir/file degrades the entry,
// never crashes the build. Re-runs on every build, so the bundled ledger stays
// current with the repo.
function readDecisionLedger() {
  const dir = fileURLToPath(new URL('../docs/decisions/', import.meta.url));
  let names = [];
  try { names = readdirSync(dir); } catch { return { ok: false, count: 0, items: [] }; }

  const read = (f) => {
    let raw = readFileSync(dir + f, 'utf8');
    if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
    return raw.replace(/\r\n/g, '\n');
  };
  // Lightweight YAML-frontmatter scalar reader (no dep): first --- ... --- block.
  const frontmatter = (raw) => {
    const m = /^---\n([\s\S]*?)\n---/.exec(raw);
    const out = {};
    if (!m) return out;
    for (const line of m[1].split('\n')) {
      const mm = /^([A-Za-z_-]+):\s*(.*)$/.exec(line);
      if (mm) out[mm[1]] = mm[2].trim();
    }
    return out;
  };
  // Extract a "## <name>" section body (up to the next "## ").
  const section = (raw, name) => {
    const parts = raw.split(/^##\s+/m);
    for (const p of parts) {
      if (p.toLowerCase().startsWith(name.toLowerCase())) {
        return p.slice(p.indexOf('\n') + 1).trim();
      }
    }
    return '';
  };
  // Markdown -> readable plain text (keep bullets/newlines; drop bold/code/links).
  const plain = (s) => s
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, 2600);
  const stripNull = (v) => (v && v !== 'null' && v !== '[]' ? v : '');

  const byNum = new Map();

  // 1) Per-DR files: DR-XXXX-*.md (skips INDEX.md / README.md / PRINCIPLES.md).
  for (const f of names) {
    const fm = /^DR-(\d{4})-.+\.md$/.exec(f);
    if (!fm) continue;
    let raw;
    try { raw = read(f); } catch { continue; }
    const meta = frontmatter(raw);
    const num = parseInt(fm[1], 10);
    byNum.set(num, {
      id: meta.id || `DR-${fm[1]}`,
      num,
      title: meta.title || '',
      date: meta.date || '',
      status: (meta.status || '').toLowerCase(),
      tier: stripNull(meta.tier),
      supersededBy: stripNull(meta['superseded-by']),
      decision: plain(section(raw, 'Decision')),
      rationale: plain(section(raw, 'Context')),
      owner: '',
      source: stripNull(meta.source),
    });
  }

  // 2) INDEX.md chain table (DR-0017..0049): rows with no per-DR file. Shape:
  //    | **DR-0017** | 2026-06-09 | <decision one line> | <owner> | Accepted | source.md |
  let index = '';
  try { index = read('INDEX.md'); } catch { /* chain rows just won't be added */ }
  for (const line of index.split('\n')) {
    const m = /^\|\s*\*\*DR-(\d{4})\*\*\s*\|\s*([^|]*?)\s*\|\s*(.*?)\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|?\s*$/.exec(line);
    if (!m) continue;
    const num = parseInt(m[1], 10);
    if (byNum.has(num)) continue; // a per-DR file already provided richer content
    byNum.set(num, {
      id: `DR-${m[1]}`,
      num,
      title: plain(m[3]),
      date: m[2].trim(),
      status: m[5].trim().toLowerCase(),
      tier: '',
      supersededBy: '',
      decision: '',
      rationale: '',
      owner: plain(m[4]),
      source: m[6].replace(/`/g, '').trim(),
    });
  }

  const items = Array.from(byNum.values()).sort((a, b) => b.num - a.num);
  return { ok: items.length > 0, count: items.length, items };
}
const decisionLedger = readDecisionLedger();

// UI/UX & accessibility review registry (Darrell, 2026-06-16: "our app UI/UX
// reviews -- are they in there?"). docs/reviews/REVIEWS.md is the single source
// of truth; this parses its records at build time so the in-app Quality / Proof
// panel shows the SAME real file -- no second source, no fabricated review. Each
// record is a "### " block with **Field:** lines. Best-effort: a missing file
// degrades to an empty (but honest) registry, never crashes the build.
function readUiuxReviews() {
  let raw = '';
  try {
    raw = readFileSync(fileURLToPath(new URL('../docs/reviews/REVIEWS.md', import.meta.url)), 'utf8');
  } catch { return { ok: false, count: 0, items: [] }; }
  const recordsSection = (raw.split(/^##\s+Records\b.*$/m)[1] || raw);
  const blocks = recordsSection.split(/^###\s+/m).slice(1);
  const field = (block, label) => {
    const m = block.match(new RegExp(`\\*\\*${label}:\\*\\*\\s*([^\\n]+)`, 'i'));
    return m ? m[1].trim() : '';
  };
  const items = blocks.map((b) => {
    const head = (b.split('\n')[0] || '').trim();
    const [idPart, ...titleParts] = head.split('·');
    return {
      id: (idPart || '').trim(),
      title: titleParts.join('·').trim(),
      date: field(b, 'Date'),
      surface: field(b, 'Surface'),
      type: field(b, 'Type').toLowerCase(),
      status: field(b, 'Status').toLowerCase(),
      findings: field(b, 'Findings'),
      source: field(b, 'Source'),
    };
  }).filter((it) => /^REV-\d+/.test(it.id));
  return { ok: items.length > 0, count: items.length, items };
}
const uiuxReviews = readUiuxReviews();

// Quality / Proof manifest (Darrell, 2026-06-16: "proof should show up inside
// the app"). Reads the REAL verification artifacts (CI gates, guard scripts,
// closed-loop test files) and the live WCAG contrast measurement, with every
// row file-verified. Best-effort: any failure degrades to an honest empty
// manifest rather than crashing the build.
let qualityProof;
try { qualityProof = buildQualityManifest(); }
catch (e) { qualityProof = { ok: false, error: (e && e.message) || 'manifest unavailable', gates: [], loops: [], contrast: { ok: false, pass: false, themes: [], violations: [] }, ci: { exists: false, steps: [] }, summary: {} }; }

// Conflict-evaluation loop (Darrell, 2026-06-17: "fewer conflicts as we move
// forward"). Reads the REAL conflict-events spine and emits the hot-files +
// conflict-rate trend + ranked decomposition. Best-effort: degrades to an honest
// empty manifest rather than crashing the build.
let conflictLoop;
try { conflictLoop = buildConflictManifest(); }
catch (e) { conflictLoop = { ok: false, error: (e && e.message) || 'manifest unavailable', eventCount: 0, hotFiles: [], contendedAreas: [], rate: { buckets: [], trend: 'baseline' }, decomposition: [], problems: [] }; }

// Interconnection loops (Darrell, 2026-06-29: "make sure all the loops of
// interconnected modules are actually moving LIVE data"). File-verified at build:
// which module-to-module loops are wired live, which are honestly still building.
// Degrades to an honest empty manifest rather than crashing the build.
let interconnectLoops;
try { interconnectLoops = buildInterconnectManifest(); }
catch (e) { interconnectLoops = { ok: false, error: (e && e.message) || 'manifest unavailable', loops: [], summary: {} }; }

// base set so built assets resolve under the Synology Web Station alias portal
// at /poetech-app/ on the shared QuickConnect URL.
//
// Build markers (2026-05-28): inject build time + commit SHA at build so the
// app can show "you are on build X" in the UI. Stops the recurring "is the
// phone actually on the new build?" confusion when iOS Safari aggressively
// caches HTML. The SHA comes from the CI host's commit env var — Vercel's
// VERCEL_GIT_COMMIT_SHA, Cloudflare Pages' CF_PAGES_COMMIT_SHA, or GitHub
// Actions' GITHUB_SHA (the off-Vercel pipeline; see
// docs/99-session-notes/2026-06-16-research-review-off-vercel-hosting.md and
// .github/workflows/deploy-cloudflare-pages.yml). Locally falls back to 'dev'.
const buildTime = new Date().toISOString();
const buildSha = (
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.CF_PAGES_COMMIT_SHA ||
  process.env.GITHUB_SHA ||
  'dev'
).slice(0, 7);

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

// Modulepreload the monolith chunk (PERFORMANCE-REVIEW §5 #4). The entry chunk
// dynamically imports poe-financial-mvp-v28, so without a hint the browser only
// discovers that ~300KB-gz chunk AFTER it downloads + parses + executes the entry
// chunk — a serial waterfall. index.html carries a guarded inline script that
// injects `<link rel="modulepreload">` for the FULL-APP boot only (never the
// lightweight ?register/?join/... standalone boots, which don't import it). This
// plugin fills in the real content-hashed href at build time. Best-effort: if the
// chunk can't be located the placeholder stays and the inline script no-ops.
const modulepreloadMonolith = () => ({
  name: 'modulepreload-monolith',
  apply: 'build',
  transformIndexHtml: {
    order: 'post',
    handler(html, ctx) {
      const bundle = ctx && ctx.bundle;
      if (!bundle) return html;
      const fileName = Object.keys(bundle).find((f) => /poe-financial-mvp-v28-.*\.js$/.test(f));
      if (!fileName) return html;
      return html.replace('__MONOLITH_PRELOAD_HREF__', '/poetech-app/' + fileName);
    },
  },
});

// Dev-only proxy so the NAS-backed bridges (/n8n/webhook/*) work in `vite dev`
// exactly as the production Vercel rewrite makes them work. LAN-reachable
// NAS; never used in the production build (Vercel handles /n8n there).
const N8N_DEV_TARGET = process.env.N8N_DEV_TARGET || 'http://192.168.1.26:5678';
// The sovereign property-photo image server (infra/nas-property-photos) runs on
// its own NAS port. In dev we reach it directly (prod goes via the /nas-photos
// Vercel rewrite -> Tailscale-fronted NAS). Prefix stripped so the server sees
// /property-photos, exactly as the production proxy-mount delivers it.
const NAS_PHOTOS_DEV_TARGET = process.env.NAS_PHOTOS_DEV_TARGET || 'http://192.168.1.26:8099';

export default defineConfig({
  base: '/poetech-app/',
  plugins: [react(), swVersionStamp(), modulepreloadMonolith()],
  build: {
    rollupOptions: {
      output: {
        // Vendor chunk split (PERFORMANCE-REVIEW §5 #2). Pin React + ReactDOM
        // (and their runtime deps) into a stable `react-vendor` chunk so the
        // ~50KB gz of framework code stays cache-warm across deploys instead of
        // cache-busting inside the entry chunk on every release.
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (/[\\/]node_modules[\\/](react|react-dom|scheduler|use-sync-external-store)[\\/]/.test(id)) {
              return 'react-vendor';
            }
          }
        },
      },
    },
  },
  define: {
    __BUILD_TIME__: JSON.stringify(buildTime),
    __BUILD_SHA__: JSON.stringify(buildSha),
    __WORKFLOW_STATS__: JSON.stringify(workflowStats),
    __GOVERNANCE_QUEUE__: JSON.stringify(governanceQueue),
    __DR_LEDGER__: JSON.stringify(decisionLedger),
    __QUALITY_PROOF__: JSON.stringify(qualityProof),
    __INTERCONNECT_LOOPS__: JSON.stringify(interconnectLoops),
    __CONFLICT_LOOP__: JSON.stringify(conflictLoop),
    __UIUX_REVIEWS__: JSON.stringify(uiuxReviews),
  },
  server: {
    proxy: {
      '/n8n': { target: N8N_DEV_TARGET, changeOrigin: true, rewrite: (p) => p.replace(/^\/n8n/, '') },
      '/nas-photos': { target: NAS_PHOTOS_DEV_TARGET, changeOrigin: true, rewrite: (p) => p.replace(/^\/nas-photos/, '') },
    },
  },
});

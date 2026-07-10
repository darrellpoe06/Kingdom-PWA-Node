// =============================================================================
// sw-nav-check — prove the SERVICE-WORKER-CONTROLLED navigation still works
// =============================================================================
// The blind spot this closes (2026-07-10, live): verify-boot's fresh browser
// makes a FIRST visit — which is never service-worker-controlled — so a bug in
// the worker's own fetch handler is invisible to every gate we had. PR #750's
// cache-first shell served a redirect-followed cached index.html to
// navigations; a browser refuses a `redirected` response for a navigation, so
// EVERY installed device (every family phone) died with ERR_FAILED on every
// visit — while CI, deploy, verify-boot, and site-health were all green.
//
// This gate serves the built dist the way Cloudflare Pages serves poetech.us —
// files at the ROOT (the /poetech-app/* URLs are a `_redirects` alias of
// /:splat), /index.html 301-normalizing to / (Pages' pretty URLs — the exact
// trap #750's cache.add fell into), sw.js + shell no-store — and visits TWICE
// in one browser profile: visit 1 registers + activates the worker (the app
// registers /sw.js at root scope, main.jsx), visit 2 is the navigation every
// installed device actually makes. The gate REQUIRES the page to be
// worker-controlled before visit 2 — a run where the worker never takes
// control fails loudly instead of passing vacuously. If visit 2 network-errors
// or lands on a recovery screen, the worker is broken for the whole installed
// fleet — fail the build BEFORE it merges.
//
// Proven-to-catch (DR-0076): against a dist stamped with the #750 worker this
// exits 1 on visit 2 (net::ERR_FAILED); against the network-first worker it
// passes; with registration broken it fails "never took control".
//
// Usage: node scripts/sw-nav-check.mjs [distDir]   (default: app/dist)
// Requires playwright-core; uses the runner's installed Chrome (channel) or
// PLAYWRIGHT_CHROMIUM_PATH when set.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = '/poetech-app';
const DIST = process.argv[2] || fileURLToPath(new URL('../app/dist', import.meta.url));
const FAIL_MARKERS = ['Almost there — one more tap', 'Getting the latest version'];

if (!existsSync(join(DIST, 'sw.js'))) {
  console.error(`sw-nav-check: no sw.js in ${DIST} — build the app first (npm run build)`);
  process.exit(2);
}

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.png': 'image/png',
};

const server = createServer((req, res) => {
  const path = (req.url || '/').split('?')[0];
  // Pages' pretty-URL normalization: any .../index.html 301s to the directory.
  if (path === '/index.html' || path === `${BASE}/index.html`) {
    res.writeHead(301, { Location: path === '/index.html' ? '/' : `${BASE}/` });
    res.end();
    return;
  }
  // The /poetech-app prefix is an alias of the root (_redirects `/poetech-app/*
  // /:splat 200`); the files themselves live at the root of the dist.
  let rel = path.startsWith(BASE) ? path.slice(BASE.length) : path;
  rel = normalize(rel).replace(/^[/\\]+/, '');
  let file = join(DIST, rel);
  if (!rel || !existsSync(file)) { rel = 'index.html'; file = join(DIST, rel); } // SPA rewrite
  const noStore = rel === 'index.html' || rel === 'sw.js' || rel === 'manifest.webmanifest';
  try {
    const body = readFileSync(file);
    res.writeHead(200, {
      'Content-Type': MIME[extname(rel)] || 'application/octet-stream',
      'Cache-Control': noStore ? 'no-cache, no-store, must-revalidate' : 'public, max-age=31536000, immutable',
    });
    res.end(body);
  } catch {
    res.writeHead(404); res.end('not found');
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}${BASE}/?view=church`;

const launchOpts = process.env.PLAYWRIGHT_CHROMIUM_PATH
  ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH, headless: true }
  : { channel: 'chrome', headless: true };
const browser = await chromium.launch(launchOpts);
const page = await browser.newPage();
let failed = false;

try {
  // Visit 1 — first contact: registers and activates the worker (root scope).
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  const controlled = await page
    .waitForFunction(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      // clients.claim() in the worker takes control of this very page — the
      // proof the NEXT navigation will run through the worker's fetch handler.
      return !!(reg && reg.active && navigator.serviceWorker.controller);
    }, null, { timeout: 25000 })
    .then(() => true, () => false);
  if (!controlled) {
    // The worker never took control — either registration broke or install
    // rejected. Both mean this build's worker story is broken; and a gate that
    // can't reach the controlled state must FAIL, never pass vacuously.
    const state = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) return 'no registration';
      const s = (w) => (w ? w.state : '-');
      return `active=${s(reg.active)} waiting=${s(reg.waiting)} installing=${s(reg.installing)} controller=${!!navigator.serviceWorker.controller}`;
    }).catch(() => 'page unreadable');
    console.error(`SW-NAV FAIL ${url} — worker never took control of the page (${state})`);
    failed = true;
  } else {
    await page.waitForTimeout(1500); // let install-time cache work settle
    // Visit 2 — the navigation every installed device actually makes.
    try {
      const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const text = await page.evaluate(() => (document.body ? document.body.innerText : ''));
      const failHit = FAIL_MARKERS.find((m) => text.includes(m));
      if (res && res.status() >= 400) {
        console.error(`SW-NAV FAIL ${url} — controlled navigation answered HTTP ${res.status()}`);
        failed = true;
      } else if (failHit) {
        console.error(`SW-NAV FAIL ${url} — controlled navigation landed on a recovery screen ("${failHit}")`);
        failed = true;
      } else {
        console.log(`SW-NAV OK  ${url} — worker-controlled navigation serves (status ${res ? res.status() : '??'})`);
      }
    } catch (e) {
      console.error(`SW-NAV FAIL ${url} — worker-controlled navigation DIED: ${String(e.message).split('\n')[0]}`);
      console.error('  This is the whole-installed-fleet outage class (2026-07-10): every device with the worker installed gets ERR_FAILED on every visit.');
      failed = true;
    }
  }
} finally {
  await browser.close().catch(() => {});
  server.close();
}
process.exit(failed ? 1 : 0);

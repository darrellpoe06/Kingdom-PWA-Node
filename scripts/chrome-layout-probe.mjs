// =============================================================================
// chrome-layout-probe — the app chrome is MEASURED at real widths, not eyeballed
// =============================================================================
// The blind spot this closes (Darrell 2026-07-28, "The PoeTech App Title or
// Header is always messed up cellphone or laptop... what is comprehensive if
// these items are missed?"): every layout review to date was source-level —
// jsdom cannot measure geometry, so a header whose brand column collapsed to
// one letter per line with the auth button overlapping it survived lint,
// vitest, the build, and multiple UI/UX review passes. A layout defect class
// needs a layout instrument: this serves the freshly built dist exactly the
// way sw-nav-check.mjs does and MEASURES the rendered chrome in a real
// Chromium at phone / tablet / laptop widths (COMPREHENSIVE-REVIEW-STANDARD
// dimension 4, DR-0239).
//
// Invariants asserted per width (360 / 768 / 1440):
//   1. NO PAGE OVERFLOW — document scrollWidth <= viewport width + 1px.
//   2. BRAND READS HORIZONTALLY — the header h1 box is wider than tall
//      (a letter-stacked 1-ch column is taller than wide by construction).
//   3. NOTHING OVERLAPS THE NAME — no header button/link/select rect
//      intersects the h1 rect (the LOG OUT-over-the-wordmark screenshot).
//
// Proven-to-catch (DR-0076 §3, anti-theater): --selftest-break injects a CSS
// override that forces the brand column to 10px (the pre-fix collapse) and
// REQUIRES the invariants to FAIL — a probe that cannot fail is a painted
// gate. CI runs the selftest first, then the real pass.
//
// Usage: node scripts/chrome-layout-probe.mjs [distDir] [--selftest-break]
// Requires playwright-core (already installed for sw-nav-check); uses the
// runner's Chrome or PLAYWRIGHT_CHROMIUM_PATH.
// =============================================================================
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2).filter((a) => a !== '--selftest-break');
const SELFTEST = process.argv.includes('--selftest-break');
const BASE = '/poetech-app';
const DIST = args[0] || fileURLToPath(new URL('../app/dist', import.meta.url));
const WIDTHS = [360, 768, 1440];

if (!existsSync(join(DIST, 'index.html'))) {
  console.error(`chrome-layout-probe: no index.html in ${DIST} — build the app first (npm run build)`);
  process.exit(2);
}

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.png': 'image/png',
};

const server = createServer((req, res) => {
  let path = (req.url || '/').split('?')[0];
  if (path.startsWith(BASE)) path = path.slice(BASE.length) || '/';
  if (path === '/') path = '/index.html';
  const file = normalize(join(DIST, path));
  if (!file.startsWith(normalize(DIST)) || !existsSync(file)) {
    // SPA fallback: unknown routes serve the shell, like Pages does.
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(readFileSync(join(DIST, 'index.html')));
    return;
  }
  res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
  res.end(readFileSync(file));
});

await new Promise((r) => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}`;
const url = `${origin}${BASE}/?view=church`;

const launchOpts = process.env.PLAYWRIGHT_CHROMIUM_PATH
  ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
  : { channel: 'chrome' };
let browser;
try { browser = await chromium.launch(launchOpts); }
catch { browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }); }

let failures = 0;
const fail = (msg) => { failures += 1; console.error(`LAYOUT FAIL  ${msg}`); };

try {
  for (const width of WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
    await page.waitForSelector('header h1', { timeout: 20000 }).catch(() => {});
    if (SELFTEST) {
      // The pre-fix collapse, reproduced deliberately: the brand is forced to
      // wrap letter-per-line (white-space:normal at ~1ch width — the nowrap
      // was exactly why the first injection failed to trip, which the
      // anti-theater exit caught), and the first header control is pinned
      // over the name (the LOG OUT screenshot). Both invariants MUST trip.
      await page.addStyleTag({ content: 'header h1 { max-width:14px !important; white-space:normal !important; overflow-wrap:anywhere !important } header button:first-of-type { position:absolute !important; left:0 !important; top:0 !important; transform:none !important }' });
      await page.evaluate(() => {
        const h1 = document.querySelector('header h1');
        const btn = document.querySelector('header button');
        if (h1 && btn) { const r = h1.getBoundingClientRect(); btn.style.left = `${r.left}px`; btn.style.top = `${r.top}px`; }
      });
      await page.evaluate(() => new Promise((r) => setTimeout(r, 100)));
    }
    const m = await page.evaluate(() => {
      const h1 = document.querySelector('header h1');
      if (!h1) return { noHeader: true };
      const hr = h1.getBoundingClientRect();
      const doc = document.documentElement;
      const overlaps = [];
      for (const el of document.querySelectorAll('header button, header a, header select')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        const x = Math.max(0, Math.min(r.right, hr.right) - Math.max(r.left, hr.left));
        const y = Math.max(0, Math.min(r.bottom, hr.bottom) - Math.max(r.top, hr.top));
        // >4px in both axes = a real occlusion, not subpixel kissing.
        if (x > 4 && y > 4) overlaps.push(`${(el.textContent || el.ariaLabel || el.tagName).trim().slice(0, 24)} (${Math.round(x)}x${Math.round(y)}px)`);
      }
      return {
        scrollWidth: doc.scrollWidth,
        clientWidth: doc.clientWidth,
        h1: { w: Math.round(hr.width), h: Math.round(hr.height), text: (h1.textContent || '').trim().slice(0, 40) },
        overlaps,
      };
    });
    await page.close();
    if (m.noHeader) { fail(`${width}px: header h1 never rendered`); continue; }
    if (m.scrollWidth > m.clientWidth + 1) fail(`${width}px: page overflows horizontally (${m.scrollWidth} > ${m.clientWidth})`);
    if (m.h1.w <= m.h1.h) fail(`${width}px: brand reads vertically — h1 "${m.h1.text}" is ${m.h1.w}x${m.h1.h}px (letter-stack collapse)`);
    if (m.overlaps.length) fail(`${width}px: controls overlap the name: ${m.overlaps.join(', ')}`);
    if (!failures) console.log(`layout ok  ${width}px — h1 ${m.h1.w}x${m.h1.h}px, no overflow, no overlap`);
  }
} finally {
  await browser.close();
  server.close();
}

if (SELFTEST) {
  if (failures > 0) { console.log(`SELFTEST-BREAK OK — the probe CAN fail (${failures} tripped as required)`); process.exit(0); }
  console.error('SELFTEST-BREAK FAILED — the deliberate collapse tripped nothing; the probe is theater');
  process.exit(1);
}
process.exit(failures > 0 ? 1 : 0);

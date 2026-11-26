#!/usr/bin/env node
// =============================================================================
// relationship-tracks-probe -- the Relationships guided tracks MEASURED (DR-1702)
// =============================================================================
// The tracks at the top of the Relationships page, in a real Chromium, on the
// built dist: a 390px phone at every text size and a 750px tablet. Fails on:
//   1. the tracks never appear after See All on the Relationships shelf;
//   2. PAGE OVERFLOW -- the document is wider than the viewport;
//   3. SQUEEZED WORDS -- a text element narrower than 4.5 of its own em and
//      taller than three lines (the learn-structures rule, PR #2930);
//   4. a track picture without its own cover image loaded;
//   5. Start not opening the Lesson Experience (.le-root).
// With --shots DIR it saves the phone and tablet pages (deviceScaleFactor 2).
// Usage: node scripts/relationship-tracks-probe.mjs [distDir] [--shots DIR]
// =============================================================================
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, normalize, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const args = process.argv.slice(2);
const shotsAt = args.indexOf('--shots');
const SHOTS = shotsAt >= 0 ? args[shotsAt + 1] : null;
const DIST = args.find((a, i) => !a.startsWith('--') && i !== shotsAt + 1) || fileURLToPath(new URL('../app/dist', import.meta.url));
const BASE = '/poetech-app';
const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
};

const server = createServer((req, res) => {
  let path = (req.url || '/').split('?')[0];
  if (path.startsWith(BASE)) path = path.slice(BASE.length) || '/';
  if (path.endsWith('/')) path += 'index.html';
  const file = normalize(join(DIST, decodeURIComponent(path)));
  if (!file.startsWith(normalize(DIST)) || !existsSync(file)) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(readFileSync(join(DIST, 'index.html')));
    return;
  }
  res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}`;

const CASES = [
  { width: 390, size: 'normal', shot: 'phone-390' },
  { width: 390, size: 'large' },
  { width: 390, size: 'larger' },
  { width: 390, size: 'largest' },
  { width: 390, size: 'bigprint' },
  { width: 750, size: 'normal', shot: 'tablet-750' },
  { width: 750, size: 'bigprint' },
];

/** Runs in the page: overflow, squeezed words, and each track's picture. */
function measure() {
  const vw = window.innerWidth;
  const root = document.querySelector('[data-testid="ls-relationship-tracks"]');
  const overflow = document.documentElement.scrollWidth > vw + 1;
  const squeezed = [];
  for (const el of root ? root.querySelectorAll('p, h2, h3, li, button, span, strong, summary') : []) {
    const own = [...el.childNodes]
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent)
      .join('')
      .trim();
    if (own.length < 12) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const fs = parseFloat(cs.fontSize) || 16;
    const lh = parseFloat(cs.lineHeight) || fs * 1.3;
    if (r.width < fs * 4.5 && r.height > lh * 3.2)
      squeezed.push(`${el.tagName.toLowerCase()} "${own.slice(0, 30)}" ${Math.round(r.width)}x${Math.round(r.height)}`);
  }
  const pictures = [...(root ? root.querySelectorAll('.ls-track') : [])].map((t) => {
    const img = t.querySelector('.ls-track-thumb img');
    return { id: t.dataset.testid, loaded: !!(img && img.complete && img.naturalWidth > 0), src: img ? img.getAttribute('src') : '' };
  });
  const cols = root ? getComputedStyle(root.querySelector('.ls-tracks')).gridTemplateColumns.split(' ').length : 0;
  return { found: !!root, overflow, squeezed, pictures, cols };
}

const browser = await chromium.launch();
const findings = [];
const notes = [];
for (const { width, size, shot } of CASES) {
  const page = await browser.newPage({ viewport: { width, height: 1000 }, deviceScaleFactor: shot && SHOTS ? 2 : 1 });
  await page.addInitScript((sz) => {
    try {
      localStorage.setItem('poetech.help.tour.v1', 'seen');
      localStorage.setItem('poe-text-size', sz);
    } catch {
      /* private mode */
    }
  }, size);
  const where = `${width}px ${size}`;
  await page.goto(`${origin}/lovecorner/app/?view=church&sub=learn`, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
  if (!(await page.waitForSelector('[data-testid="ls-relationships"]', { timeout: 25000 }).catch(() => null))) {
    findings.push(`${where}: the Relationships shelf never mounted`);
    await page.close();
    continue;
  }
  await page.locator('[data-testid="ls-relationships"] .ls-see').first().click();
  if (!(await page.waitForSelector('[data-testid="ls-relationship-tracks"]', { timeout: 10000 }).catch(() => null))) {
    findings.push(`${where}: See All did not show the guided tracks`);
    await page.close();
    continue;
  }
  // Open the first track's steps, so the why and the talk prompts are measured too.
  await page.locator('[data-testid="ls-track-couples"] details summary').click();
  await page.evaluate(() => Promise.all([...document.querySelectorAll('.ls-track-thumb img')].map((i) => (i.decode ? i.decode().catch(() => {}) : null))));
  await page.waitForTimeout(500);
  const m = await page.evaluate(measure);
  if (m.overflow) findings.push(`${where}: page wider than the screen`);
  if (m.squeezed.length) findings.push(`${where}: ${m.squeezed.length} squeezed text block(s): ${m.squeezed.slice(0, 3).join(' | ')}`);
  if (m.pictures.length !== 3) findings.push(`${where}: ${m.pictures.length} track pictures, expected 3`);
  for (const p of m.pictures) if (!p.loaded) findings.push(`${where}: ${p.id} picture did not load (${p.src})`);
  notes.push(`${where}: ${m.pictures.length} tracks, ${m.cols} column(s), pictures ${m.pictures.filter((p) => p.loaded).length}/3`);
  if (shot && SHOTS) {
    mkdirSync(SHOTS, { recursive: true });
    await page.locator('[data-testid="ls-relationship-tracks"]').screenshot({ path: join(SHOTS, `${shot}.png`) });
  }
  if (size === 'normal') {
    await page.locator('[data-testid="ls-track-couples"] [data-testid="ls-track-go"]').click();
    if (!(await page.waitForSelector('.le-root', { timeout: 15000 }).catch(() => null))) findings.push(`${where}: Start did not open the Lesson Experience`);
    else notes.push(`${where}: Start opened the Lesson Experience`);
  }
  await page.close();
}
await browser.close();
server.close();
for (const n of notes) console.log(`  ${n}`);
if (findings.length) {
  console.error(`relationship-tracks-probe: ${findings.length} finding(s)`);
  for (const f of findings) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(`relationship-tracks-probe: OK -- ${CASES.length} cases, no overflow, no squeezed words, every cover loaded`);

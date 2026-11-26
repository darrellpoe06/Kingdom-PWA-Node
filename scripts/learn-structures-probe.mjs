#!/usr/bin/env node
// =============================================================================
// learn-structures-probe -- the new Learn look MEASURED at every text size (DR-1681)
// =============================================================================
// Darrell 2026-11-26: "Font size impacts etc... through the structures thoroughly", after a record
// card squeezed its words to one per line ("Long skinny letters... looks weird"). The chrome probe
// measures the header and the classic reader; this measures the new look's own structures -- the
// Learn home, the Relationships section, a lesson's cover, Read and Study -- at all five text sizes
// in a real Chromium, on the built dist, and fails on:
//   1. PAGE OVERFLOW -- the document is wider than the viewport (a sideways scroll).
//   2. SQUEEZED WORDS -- a text element narrower than 4.5 of its own em and taller than three
//      lines: the "long skinny letters" class.
// Usage: node scripts/learn-structures-probe.mjs [distDir]   (exit 1 on any finding)
// =============================================================================
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, normalize, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const DIST = process.argv[2] || fileURLToPath(new URL('../app/dist', import.meta.url));
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
  { width: 390, size: 'normal' },
  { width: 390, size: 'large' },
  { width: 390, size: 'larger' },
  { width: 390, size: 'largest' },
  { width: 390, size: 'bigprint' },
  { width: 360, size: 'bigprint' },
];

/** Runs in the page: overflow and squeezed words, each with a short label. */
function measure() {
  const vw = window.innerWidth;
  const overflow = document.documentElement.scrollWidth > vw + 1;
  const squeezed = [];
  const sel = 'p, h1, h2, h3, h4, li, button, a, label, span, strong, summary, figcaption';
  for (const el of document.querySelectorAll(sel)) {
    const own = [...el.childNodes]
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent)
      .join('')
      .trim();
    if (own.length < 12) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.position === 'fixed') continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const fs = parseFloat(cs.fontSize) || 16;
    const lh = parseFloat(cs.lineHeight) || fs * 1.3;
    if (r.width < fs * 4.5 && r.height > lh * 3.2) {
      squeezed.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} "${own.slice(0, 30)}" ${Math.round(r.width)}x${Math.round(r.height)}`);
    }
  }
  const wide = overflow
    ? [...document.querySelectorAll('body *')]
        .filter((e) => e.getBoundingClientRect().right > vw + 1)
        .slice(0, 3)
        .map((e) => `${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]}`)
    : [];
  return { overflow, wide, squeezed: squeezed.slice(0, 5), squeezedCount: squeezed.length };
}

const browser = await chromium.launch();
const findings = [];
let measured = 0;
for (const { width, size } of CASES) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.addInitScript((sz) => {
    try {
      localStorage.setItem('poetech.help.tour.v1', 'seen');
      localStorage.setItem('poe-text-size', sz);
    } catch {
      /* private mode */
    }
  }, size);
  const where = (s) => `${width}px ${size} · ${s}`;
  const check = async (surface) => {
    await page.waitForTimeout(400);
    const m = await page.evaluate(measure);
    measured += 1;
    if (m.overflow) findings.push(`${where(surface)}: page wider than the screen (${m.wide.join(', ')})`);
    if (m.squeezedCount) findings.push(`${where(surface)}: ${m.squeezedCount} squeezed text block(s): ${m.squeezed.join(' | ')}`);
  };
  await page.goto(`${origin}/lovecorner/app/?view=church&sub=learn`, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
  if (!(await page.waitForSelector('.ls-root', { timeout: 20000 }).catch(() => null))) {
    findings.push(`${where('Learn home')}: the new look never mounted`);
    await page.close();
    continue;
  }
  await check('Learn home');
  const seeAll = page.locator('[data-testid="ls-relationships"] .ls-see:visible').first();
  if (await seeAll.count()) {
    await seeAll.click();
    if (await page.waitForSelector('[data-testid="ls-relationship-sections"]', { timeout: 8000 }).catch(() => null)) await check('Relationships');
    else findings.push(`${where('Relationships')}: See All did not open the section`);
    await page.goBack().catch(() => {});
    await page.waitForSelector('.ls-root', { timeout: 8000 }).catch(() => {});
  }
  const card = page.locator('.ls-card:visible').first();
  if (await card.count()) {
    await card.click();
    if (await page.waitForSelector('.ls-cover', { timeout: 8000 }).catch(() => null)) {
      await check('Lesson cover');
      const readBtn = await page.$('xpath=//article[contains(@class,"ls-cover")]//button[contains(., "Read")]');
      if (readBtn) await readBtn.click().catch(() => {});
      if (await page.waitForSelector('.le-root', { timeout: 10000 }).catch(() => null)) {
        await check('Lesson Read');
        const study = await page.$('xpath=//button[@role="tab" and contains(., "Study")]');
        if (study) {
          await study.click();
          await check('Lesson Study');
        }
      } else findings.push(`${where('Lesson')}: the lesson screen did not open from the cover`);
    }
  }
  await page.close();
}
await browser.close();
server.close();
console.log(`learn-structures-probe: ${measured} surface(s) measured across ${CASES.length} size/width cases.`);
if (findings.length) {
  for (const f of findings) console.log(`  FAIL ${f}`);
  process.exit(1);
}
console.log('learn-structures-probe: OK -- no sideways scroll, no squeezed words, at every text size.');

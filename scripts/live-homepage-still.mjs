#!/usr/bin/env node
// =============================================================================
// live-homepage-still — a still of the LIVE Love Corner door, from a runner
// =============================================================================
// The cloud sandbox has no route to poetech.us (DR-0125): a GitHub runner is
// the team's eye. This drives the runner's Chromium to the live door at a
// phone width and a desktop width, waits for the door's own header
// (DR-1483), measures what the header, the bar and the hero are doing, and
// leaves the stills in an artifact so a person can look at the production
// page itself, not a local build of it (DR-0104: review the live push).
//
//   node scripts/live-homepage-still.mjs [baseUrl] [outDir]
//
// Prints one line per width (STILL <width> ...) and exits non-zero only when
// the page never rendered a header at all. It changes nothing on the site.
// =============================================================================
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright-core';

const base = (process.argv[2] || 'https://poetech.us/lovecorner/app/').replace(/\/?$/, '/');
const outDir = process.argv[3] || 'live-still';
mkdirSync(outDir, { recursive: true });
const url = `${base}?view=church&lovecorner=1`;
const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox'] }).catch(() => chromium.launch({ args: ['--no-sandbox'] }));
let rendered = 0;
for (const [width, height, name] of [
  [390, 844, 'phone'],
  [1440, 900, 'desktop'],
]) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e && e.message)));
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  const header = await page.waitForSelector('[data-testid="lovecorner-header"]', { timeout: 30000 }).catch(() => null);
  await page.waitForTimeout(1500);
  const m = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const box = (s) => {
      const el = q(s);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height) };
    };
    const dockTabs = [...document.querySelectorAll('[data-testid="dock-tabs"] button')].map((b) => b.getAttribute('data-testid'));
    return {
      theme: (q('[data-theme]') || {}).getAttribute ? q('[data-theme]').getAttribute('data-theme') : null,
      header: box('[data-testid="lovecorner-header"] .lch-bar'),
      brand: (q('[data-testid="lch-brand"]') || { textContent: '' }).textContent.replace(/\s+/g, ' ').trim(),
      hero: box('.lc-hero'),
      heroTop: (() => {
        const h = q('.lc-hero');
        return h ? Math.round(h.getBoundingClientRect().top + window.scrollY) : null;
      })(),
      dockTabs,
      scrollWidth: document.documentElement.scrollWidth,
      build: (document.querySelector('meta[name="build-sha"]') || {}).content || '',
    };
  });
  const file = join(outDir, `live-${name}-${width}.png`);
  await page.screenshot({ path: file, fullPage: false });
  if (name === 'phone') await page.screenshot({ path: join(outDir, `live-${name}-${width}-full.png`), fullPage: true });
  if (header) rendered += 1;
  console.log(
    `STILL ${width} header=${header ? 'yes' : 'NO'} theme=${m.theme} bar=${m.header ? m.header.h : '-'}px heroTop=${m.heroTop} dock=${m.dockTabs.length} scrollW=${m.scrollWidth} errors=${errors.length} brand="${m.brand}" -> ${file}`
  );
  if (errors.length) console.log(`  page errors: ${errors.slice(0, 3).join(' | ')}`);
  await page.close();
}
await browser.close();
if (rendered === 0) {
  console.log('LIVE STILL: the door never rendered its header at either width');
  process.exit(1);
}
console.log(`LIVE STILL: OK (${rendered}/2 widths rendered the door's header)`);

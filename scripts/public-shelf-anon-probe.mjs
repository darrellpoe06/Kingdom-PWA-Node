#!/usr/bin/env node
// =============================================================================
// public-shelf-anon-probe — what a SIGNED-OUT browser gets from the shelf
// =============================================================================
// The eye for DR-1236. One page load per door, no input beyond the one tap a
// stranger makes on the branded door ("Looking for a Place"), no sign-in, no
// writes. It prints ONLY: which of the front door's three states rendered
// (loading / ok / none / failed), the HTTP status of every /rest/v1/rpc/ and
// /rest/v1/ answer the page received (path and status, never the body), the
// number of listing cards and of listing pictures that came up, and the first
// 160 characters of any page error with anything key-shaped removed. Never a
// street, a name, a caption or a key.
//
// Usage: node public-shelf-anon-probe.mjs <front door url> [branded door url]
import { chromium } from 'playwright-core';

const UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36';
const [front, branded] = process.argv.slice(2);

const scrub = (s) => String(s || '')
  .replace(/eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_.-]+/g, '<jwt>')
  .replace(/apikey=[^&\s]+/gi, 'apikey=<key>')
  .replace(/\s+/g, ' ')
  .slice(0, 160);
const pathOf = (u) => { try { const x = new URL(u); return `${x.host}${x.pathname}`; } catch (_) { return 'unparseable'; } };

async function readDoor(browser, url, { tapLookingForAPlace = false } = {}) {
  const page = await browser.newPage({ userAgent: UA, viewport: { width: 420, height: 1200 } });
  const rpc = []; const errors = [];
  page.on('response', (r) => { const u = r.url(); if (/\/rest\/v1\//.test(u)) rpc.push(`${pathOf(u)} -> ${r.status()}`); });
  page.on('requestfailed', (r) => { const u = r.url(); if (/\/rest\/v1\//.test(u)) rpc.push(`${pathOf(u)} -> FAILED ${scrub(r.failure()?.errorText)}`); });
  page.on('pageerror', (e) => errors.push(scrub(e.message)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(scrub(m.text())); });
  const out = [];
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    if (tapLookingForAPlace) {
      const tap = page.getByRole('button', { name: /Looking for a place/i }).first();
      if (await tap.count().catch(() => 0)) await tap.click({ timeout: 10000 }).catch(() => {});
    }
    // Give the shelf its honest window: the three states are mutually
    // exclusive, so the first to appear is the answer; a card's pictures
    // come after the list (DR-1016), so wait a little longer for those.
    await page.waitForSelector('[data-testid="front-door-unreadable"], [data-testid="front-door-none"], [data-testid^="vacancy-card-"], [data-testid="vacancies-panel"] .pp-panel-note', { timeout: 45000 }).catch(() => {});
    await page.waitForTimeout(8000);
    const seen = await page.evaluate(() => {
      const has = (s) => !!document.querySelector(s);
      const cards = document.querySelectorAll('[data-testid^="vacancy-card-"]').length;
      const pics = Array.from(document.querySelectorAll('[data-testid^="vacancy-card-"] img')).filter((i) => (i.getAttribute('src') || '').length > 0).length;
      const strip = Array.from(document.querySelectorAll('[data-testid="vacancy-picture-strip"] img')).filter((i) => (i.getAttribute('src') || '').length > 0).length;
      const state = has('[data-testid="front-door-unreadable"]') ? 'failed'
        : has('[data-testid="front-door-none"]') ? 'none'
          : cards > 0 ? 'ok'
            : has('[data-testid="front-door-loading"]') ? 'loading'
              : has('[data-testid="vacancies-panel"]') ? 'branded-panel' : 'unknown';
      const why = (document.querySelector('[data-testid="front-door-unreadable-why"]')?.textContent || '').trim();
      // The branded door's big picture: a real slide up (1) or the entryway standing in (0), and why.
      const hero = document.querySelector('[data-testid="hero-slide"]') ? 1 : 0;
      const heroWhy = (document.querySelector('[data-testid="hero-fallback-why"]')?.textContent || '').trim();
      return { state, cards, pics, strip, why, hero, heroWhy };
    });
    out.push(`door=${pathOf(url)} state=${seen.state} cards=${seen.cards} pictures=${seen.pics} strip=${seen.strip} hero=${seen.hero}${seen.why ? ` why="${scrub(seen.why)}"` : ''}${seen.heroWhy ? ` hero_why="${scrub(seen.heroWhy)}"` : ''}`);
  } catch (e) {
    out.push(`door=${pathOf(url)} state=could-not-load error="${scrub(e.message)}"`);
  }
  for (const r of rpc.slice(0, 12)) out.push(`  rest: ${r}`);
  for (const e of errors.slice(0, 6)) out.push(`  error: ${e}`);
  await page.close();
  return out;
}

const browser = await chromium.launch();
const lines = [];
if (front) lines.push(...await readDoor(browser, front));
if (branded) lines.push(...await readDoor(browser, branded, { tapLookingForAPlace: true }));
await browser.close();
console.log(lines.join('\n'));

#!/usr/bin/env node
// =============================================================================
// app-journeys — a person's walks through the built app, in a real browser,
// on every push: taps, typing, a shared link landing where it says it will
// =============================================================================
// DR-1330 D2 (Darrell, 2026-11-05: "various user flows debugging tests so
// users don't have basic bugs... automated"). The sweep proves a surface
// opens; these prove the thing a person came to do can be done. Dist only:
// the built app on the same gateway the sweep uses, a trusted host (no sign-in
// wall), the stub backend. Nothing here needs a database; the walks that do
// are door-journeys (DR-0934). The registry is scripts/e2e/journeys.mjs and
// the coverage guard is scripts/journey-coverage-guard.mjs.
//
// Each journey asserts from the rendered DOM, never the URL. A failing step
// prints the page's own text and the console lines around it (door-journeys'
// pattern), so a red step names its cause.
//
// PROVEN TO CATCH (DR-0076 §3), each exits 0 only when its own journey failed
// and no other did:
//   --break=link   the lesson id in the shared link is replaced by one that
//                  does not exist; lesson-link-lands must fail.
//   --break=taps   pointer events are taken away from every tap target; the
//                  tapping journeys must fail and the typing journey may not.
//
// Usage: node scripts/e2e/app-journeys.mjs [distDir] [--only=id,id] [--break=link|taps]
// Exit 0 every journey passed (or the planted fault was caught); 1 a journey
// failed; 2 setup. Bounded by JOURNEYS_BUDGET_MS and per-wait timeouts.
// =============================================================================
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

export const BASE = '/poetech-app';
export const LESSON_LINK = '?view=church&sub=learn&course=made-in-time&lesson=mit5-those-who-know-their-god';
export const LESSON_LINK_COURSE = 'Made in Time';

export function parseArgs(argv) {
  const a = { dist: null, only: null, breakKind: '' };
  for (const x of argv) {
    if (x.startsWith('--only=')) a.only = x.slice(7).split(',').map((s) => s.trim()).filter(Boolean);
    else if (x.startsWith('--break=')) a.breakKind = x.slice(8);
    else if (!x.startsWith('--')) a.dist = x;
  }
  return a;
}

// The walks. Each is (page, t) => Promise<void>; t carries the helpers.
const JOURNEY_DEFS = {
  async 'lesson-link-lands'(page, t) {
    await t.open(page, t.link);
    const title = await t.textOf(page, '[data-testid="lesson-space-title"]', 20000);
    if (!title) throw new Error('no lesson opened: [data-testid="lesson-space-title"] never rendered');
    const body = await t.body(page);
    if (!body.includes(LESSON_LINK_COURSE)) throw new Error(`the course heading "${LESSON_LINK_COURSE}" is not on the page`);
    if (await page.locator('iframe[src*="youtube"]').count()) throw new Error('a YouTube player is mounted — the link landed on the Worship tab');
  },
  async 'learn-by-taps'(page, t) {
    await t.open(page, '?view=church');
    await t.tap(page, 'button:text-is("Learn")', 'the Learn sub-tab');
    await t.tap(page, '[aria-label="Course quick links"] button[role="tab"]', 'a course chip');
    // A lesson row is li[data-lesson-id]; a month heading folds its rows away,
    // so a folded course is unfolded first, as a reader would.
    const ROW = '[data-testid="course-lesson-list"] li[data-lesson-id] button';
    await page.locator('[data-testid="course-lesson-list"]').first().waitFor({ timeout: 15000 });
    if (!(await page.locator(ROW).count())) await t.tap(page, '[data-testid="month-fold"]', 'the first month heading');
    await t.tap(page, ROW, 'the first lesson in the list');
    const title = await t.textOf(page, '[data-testid="lesson-space-title"]', 20000);
    if (!title) throw new Error('tapping a lesson did not open it: no [data-testid="lesson-space-title"]');
  },
  async 'top-tabs-by-taps'(page, t) {
    await t.open(page, '?view=about');
    const tabs = await page.locator('[data-testid^="dock-tab-"]').all();
    if (tabs.length < 3) throw new Error(`the dock shows ${tabs.length} tabs; a person needs at least three to tap`);
    let last = await t.main(page);
    let walked = 0;
    for (const tab of tabs.slice(0, 6)) {
      const id = await tab.getAttribute('data-testid');
      await tab.click({ timeout: 5000 });
      await t.settle(page);
      const now = await t.main(page);
      if (now === last) throw new Error(`tapping ${id} changed nothing on the page`);
      // The dock changes shape on Money (its money sections replace the tabs),
      // so the current mark is required only while the tapped tab is still there.
      const still = await page.locator(`[data-testid="${id}"]`).count();
      const current = await page.locator(`[data-testid="${id}"][aria-current="page"]`).count();
      if (still && !current) throw new Error(`after tapping ${id} the dock does not mark it current`);
      last = now; walked += 1;
      if (!still) { await t.open(page, '?view=about'); last = await t.main(page); }
    }
    if (walked < 3) throw new Error(`walked only ${walked} tabs`);
  },
  async 'money-tabs-by-taps'(page, t) {
    await t.open(page, '?view=books');
    const subs = await page.locator('[data-testid^="dock-money-"]').all();
    if (subs.length < 2) throw new Error(`the dock shows ${subs.length} money sections; a person needs at least two to tap`);
    let last = await t.main(page);
    let walked = 0;
    for (const sub of subs.slice(0, 5)) {
      const id = await sub.getAttribute('data-testid');
      // The section already open is skipped: tapping it changes nothing by design.
      if (await sub.getAttribute('aria-current')) continue;
      await sub.click({ timeout: 5000 });
      await t.settle(page);
      const now = await t.main(page);
      if (now === last) throw new Error(`tapping ${id} changed nothing on the page`);
      if (t.boundary(now)) throw new Error(`${id} rendered an error boundary`);
      last = now; walked += 1;
    }
    if (walked < 1) throw new Error('no money section other than the open one could be tapped');
  },
  async 'create-takes-words'(page, t) {
    // The one-voice input lives on the Lesson entry sub (DR-0679), not the canvas.
    await t.open(page, '?view=create&sub=record');
    const box = page.locator('[data-testid="one-voice-text"]').first();
    await box.waitFor({ timeout: 15000 });
    await box.fill('A note typed by the journey, so Send can wake up.');
    const value = await box.inputValue();
    if (!value.includes('typed by the journey')) throw new Error('the one-voice input did not keep the typed words');
    const send = page.locator('[data-testid="one-voice-send"]').first();
    if (await send.isDisabled()) throw new Error('Send stayed disabled after words were typed');
  },
  async 'feedback-sheet-opens'(page, t) {
    await t.open(page, '?view=about');
    // On a phone the Feedback control sits in the dock's More sheet.
    if (!(await page.locator('[data-testid="dock-feedback"]:visible').count())) await t.tap(page, '[data-testid="dock-more"]', 'the dock More control');
    await t.tap(page, '[data-testid="dock-feedback"]', 'the dock Feedback control');
    const area = page.locator('textarea').last();
    await area.waitFor({ timeout: 10000 });
    await area.fill('Words from the journey.');
    if (!(await area.inputValue()).includes('journey')) throw new Error('the feedback sheet did not take words');
  },
};
export const JOURNEY_IDS = Object.freeze(Object.keys(JOURNEY_DEFS));
export const TAP_JOURNEYS = Object.freeze(['learn-by-taps', 'top-tabs-by-taps', 'money-tabs-by-taps', 'feedback-sheet-opens']);

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === normalize(process.argv[1]);
if (isMain) {
  const { chromium } = await import('playwright-core');
  const args = parseArgs(process.argv.slice(2));
  const DIST = args.dist || fileURLToPath(new URL('../../app/dist', import.meta.url));
  const BUDGET_MS = Number(process.env.JOURNEYS_BUDGET_MS || 300000);
  if (!existsSync(join(DIST, 'index.html'))) { console.error(`app-journeys: no index.html in ${DIST} — build the app first`); process.exit(2); }
  if (args.breakKind && !['link', 'taps'].includes(args.breakKind)) { console.error(`app-journeys: unknown --break=${args.breakKind}`); process.exit(2); }
  const ids = args.only ? JOURNEY_IDS.filter((id) => args.only.includes(id)) : JOURNEY_IDS;
  if (args.only && ids.length !== args.only.length) { console.error(`app-journeys: --only names a journey that does not exist (${args.only.join(',')})`); process.exit(2); }

  const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.png': 'image/png' };
  const server = createServer((req, res) => {
    let path = (req.url || '/').split('?')[0];
    if (path.startsWith('/voice/') || path.startsWith('/voice-lite/') || path.startsWith('/sb/') || path.startsWith('/n8n/')) { res.writeHead(404); res.end(); return; }
    if (path.startsWith(BASE)) path = path.slice(BASE.length) || '/';
    if (path === '/') path = '/index.html';
    const file = normalize(join(DIST, path));
    if (!file.startsWith(normalize(DIST)) || !existsSync(file)) { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(readFileSync(join(DIST, 'index.html'))); return; }
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
    res.end(readFileSync(file));
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const launchOpts = process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : { channel: 'chrome' };
  let browser;
  try { browser = await chromium.launch(launchOpts); }
  catch { browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }); }
  const killer = setTimeout(() => { console.error('app-journeys: over budget'); process.exit(1); }, BUDGET_MS);

  const QUIET = new Date('2026-09-29T10:00:00-05:00').getTime();
  const BOUNDARY = /hit an error|something went wrong on this screen/i;
  const t = {
    link: args.breakKind === 'link' ? LESSON_LINK.replace(/lesson=[^&]+/, 'lesson=no-such-lesson-planted') : LESSON_LINK,
    boundary: (text) => BOUNDARY.test(text),
    settle: (page) => page.evaluate(() => new Promise((r) => setTimeout(r, 600))),
    main: (page) => page.evaluate(() => ((document.querySelector('main') || document.body).innerText || '').replace(/\s+/g, ' ').trim()),
    body: (page) => page.evaluate(() => (document.body.innerText || '').replace(/\s+/g, ' ').trim()),
    async open(page, route) {
      await page.goto(`${origin}${BASE}/${route}`, { waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
      await page.waitForSelector('main', { timeout: 15000 });
      await t.settle(page);
    },
    async tap(page, selector, what) {
      const el = page.locator(selector).first();
      await el.waitFor({ timeout: 15000 }).catch(() => { throw new Error(`${what} is not on the page (${selector})`); });
      if (process.env.JOURNEYS_DEBUG) console.log(`debug    tap ${what}: "${(await el.innerText().catch(() => '')).replace(/\s+/g, ' ').slice(0, 80)}"`);
      await el.click({ timeout: 5000 }).catch((e) => { throw new Error(`${what} could not be tapped: ${String(e.message).split('\n')[0]}`); });
      await t.settle(page);
      if (process.env.JOURNEYS_DEBUG) console.log(`debug    after ${what}: ${(await t.main(page)).slice(0, 300)}`);
    },
    async textOf(page, selector, ms) {
      const el = page.locator(selector).first();
      await el.waitFor({ timeout: ms }).catch(() => null);
      return (await el.count()) ? (await el.innerText()).trim() : '';
    },
  };

  const results = [];
  let caught = [];
  try {
    for (const id of ids) {
      const context = await browser.newContext({ viewport: { width: 412, height: 915 }, timezoneId: 'America/Chicago', serviceWorkers: 'block' });
      const page = await context.newPage();
      await page.addInitScript((target) => {
        const RealDate = Date; const off = target - RealDate.now();
        class PinnedDate extends RealDate { constructor(...a) { if (a.length === 0) super(RealDate.now() + off); else super(...a); } static now() { return RealDate.now() + off; } }
        globalThis.Date = new Proxy(PinnedDate, { apply: () => new PinnedDate().toString() });
        // A returning device: the landing seen, the tour seen, and a household
        // profile already picked (the shell boots currentProfile from this key
        // on a trusted host). Without it the "Who's using this device?" picker
        // sits over every tap — measured on the first run: 5 of 6 journeys
        // tapped the picker's backdrop instead of the app.
        try { localStorage.setItem('poe-landing-seen', '1'); localStorage.setItem('poetech.help.tour.v1', 'seen'); localStorage.setItem('poe-current-profile', 'family'); } catch (_) { /* private mode */ }
      }, QUIET);
      if (args.breakKind === 'taps') {
        await page.addInitScript(() => {
          const s = document.createElement('style');
          s.textContent = 'main button, [data-testid^="dock-"], [role="tab"] { pointer-events: none !important; }';
          document.addEventListener('DOMContentLoaded', () => document.head.appendChild(s));
        });
      }
      const seen = [];
      page.on('console', (m) => { if (m.type() === 'error') seen.push(`[console] ${m.text()}`); });
      page.on('pageerror', (e) => seen.push(`[pageerror] ${e.message}`));
      try {
        await JOURNEY_DEFS[id](page, t);
        results.push([id, 'pass']); console.log(`  ✔ ${id}`);
      } catch (e) {
        const expected = (args.breakKind === 'link' && id === 'lesson-link-lands') || (args.breakKind === 'taps' && TAP_JOURNEYS.includes(id));
        if (expected) { caught.push(id); console.log(`  ✔ ${id} FAILED AS PLANTED — ${e.message}`); }
        else {
          results.push([id, 'FAIL', e.message]);
          const text = await t.body(page).catch(() => '(no body)');
          console.log(`  ✘ ${id}\n      ${e.message}\n      url: ${page.url()}\n      page text: ${text.slice(0, 600)}`);
          for (const line of seen.slice(-12)) console.log(`      ${line}`);
        }
      }
      await context.close();
    }
  } finally {
    clearTimeout(killer);
    await browser.close().catch(() => {});
    server.close();
  }
  const failed = results.filter((r) => r[1] === 'FAIL');
  if (args.breakKind) {
    const expectedIds = args.breakKind === 'link' ? ['lesson-link-lands'] : TAP_JOURNEYS;
    const ran = expectedIds.filter((id) => ids.includes(id));
    const missed = ran.filter((id) => !caught.includes(id));
    if (missed.length) { console.error(`app-journeys: PLANTED FAULT ${args.breakKind} NOT CAUGHT by ${missed.join(', ')} — a journey that cannot fail is a painted gate (DR-0076 §3)`); process.exit(1); }
    if (failed.length) { console.error(`app-journeys: the planted fault also failed unrelated journeys: ${failed.map((f) => f[0]).join(', ')}`); process.exit(1); }
    console.log(`app-journeys: planted fault ${args.breakKind} CAUGHT by ${caught.join(', ')}; ${results.length} other journey(s) unaffected`);
    process.exit(0);
  }
  if (failed.length) { console.error(`app-journeys: ${failed.length} of ${results.length} journeys FAILED: ${failed.map((f) => f[0]).join(', ')}`); process.exit(1); }
  console.log(`app-journeys: OK — ${results.length} of ${results.length} journeys walked`);
}

// money-live-probe — does the LIVE Money redesign render on the Galaxy Z Fold 7?
//
// WHY (2026-11-03, Christina): "Once the code is deployed, verify that the Money
// Overview works correctly on my Samsung Galaxy Z Fold 7." The cloud session
// has no route to poetech.us; a runner does (DR-0125). This opens the live site
// in a real browser at both Fold 7 viewports, in SAMPLE mode (no sign-in, no
// family data), and checks what a deploy can prove: that the shipped build
// carries the Money Overview panel and the Bills Review screen with its entity
// labels and filter, with nothing spilling sideways and no page errors.
//
// It does NOT check anyone's numbers: those live behind sign-in. A deploy is
// verified here; the family's records are verified separately.
//
// READ-ONLY BY CONSTRUCTION: it only reads pages and writes screenshots.
// Exit 1 when any check fails, so a red run means the live build is wrong.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = (process.env.BASE || 'https://poetech.us/poetech-app/').replace(/\/?$/, '/');
const OUT = process.env.OUT_DIR || 'shots';
mkdirSync(OUT, { recursive: true });

// Fold 7 cover and inner screens, in CSS pixels.
const VIEWPORTS = [
  ['cover', { width: 360, height: 764 }, 3],
  ['inner', { width: 984, height: 1016 }, 2],
];

const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok: !!ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`); };

const browser = await chromium.launch();
try {
  for (const [label, viewport, dpr] of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport, deviceScaleFactor: dpr, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.addInitScript(() => { try { localStorage.setItem('poetech.help.tour.v1', '1'); localStorage.setItem('poe-landing-seen', '1'); } catch (e) { /* storage off */ } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 160)));
    const settle = async () => {
      // As live-link-probe learned on this site: let the app finish booting,
      // then clear the live-only prompts (install / notifications) before reading.
      await page.waitForTimeout(3000);
      for (const text of ['Maybe later', "Don't show again", 'Hide']) {
        const b = page.locator(`button:has-text("${text}")`).first();
        if (await b.count() && await b.isVisible().catch(() => false)) { await b.click({ timeout: 2000 }).catch(() => {}); await page.waitForTimeout(400); }
      }
      // The sample's welcome card and the live-service player sit over the page.
      const welcome = page.locator('[aria-labelledby="demo-welcome-h"] button', { hasText: /show me around/i }).first();
      if (await welcome.count()) await welcome.click({ force: true }).catch(() => {});
      const player = page.locator('button[aria-label="Close the live service player for now"]').first();
      if (await player.count()) await player.click({ force: true }).catch(() => {});
      await page.waitForTimeout(600);
    };
    const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    // What the browser actually landed on — printed whenever a screen is missing,
    // so a red run carries its own evidence (DR-0076 §8), not a guess.
    const whereAmI = async (what) => {
      const seen = await page.evaluate(() => ({
        url: location.href,
        build: (() => { try { return globalThis.__PT_BUILD__ || null; } catch (e) { return null; } })(),
        worker: !!(navigator.serviceWorker && navigator.serviceWorker.controller),
        testids: [...new Set([...document.querySelectorAll('[data-testid]')].map((n) => n.getAttribute('data-testid')))].slice(0, 25),
        text: (document.body.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 400),
      })).catch((e) => ({ error: String(e).slice(0, 160) }));
      console.log(`  ${label} ${what} — landed on: ${JSON.stringify(seen)}`);
    };

    // 1) Money Overview: the "what you have, what is due" panel.
    await page.goto(`${BASE}?demo=family-of-4&view=books&sub=overview`, { waitUntil: 'networkidle', timeout: 60000 });
    await settle();
    const panel = page.locator('[data-testid="money-coming-up"]');
    await panel.first().waitFor({ timeout: 20000 }).catch(() => {});
    check(`${label}: Overview panel is on the live build`, await panel.count() === 1);
    if (await panel.count() !== 1) await whereAmI('Overview');
    const lines = await page.locator('[data-testid^="coming-up-"][data-testid$="-value"]').count();
    check(`${label}: Overview shows its nine numbers`, lines === 9, `${lines} found`);
    if (await panel.count()) {
      await page.locator('[data-testid="coming-up-next14"] summary').click({ force: true }).catch(() => {});
      await panel.scrollIntoViewIfNeeded().catch(() => {});
    }
    check(`${label}: Overview has no sideways scroll`, (await overflow()) <= 0, `${await overflow()}px`);
    await page.screenshot({ path: `${OUT}/${label}-overview.png` });

    // 2) Bills > Review & confirm: entity chip on every card + the filter row.
    await page.goto(`${BASE}?demo=family-of-4&view=books&sub=bills`, { waitUntil: 'networkidle', timeout: 60000 });
    await settle();
    const reviewTab = page.locator('[data-testid="bills-view-review"]');
    if (await reviewTab.count()) await reviewTab.first().click({ force: true }).catch(() => {});
    await page.locator('[data-testid="money-bill-review"]').first().waitFor({ timeout: 20000 }).catch(() => {});
    check(`${label}: Bills Review is on the live build`, await page.locator('[data-testid="money-bill-review"]').count() === 1);
    if (await page.locator('[data-testid="money-bill-review"]').count() !== 1) await whereAmI('Bills Review');
    const tabs = await page.locator('[data-testid^="bill-review-entity-tab-"]').allTextContents();
    check(`${label}: entity filter shows ALL / PERSONAL / POE PROPERTIES / TLC THERAPY / NEEDS REVIEW`,
      ['ALL', 'PERSONAL', 'POE PROPERTIES', 'TLC THERAPY', 'NEEDS REVIEW'].every((w, i) => (tabs[i] || '').includes(w)), tabs.join(' | '));
    const rows = await page.locator('[data-testid^="bill-review-row-"]').count();
    const chips = await page.locator('[data-testid^="bill-review-entity-chip-"]').count();
    check(`${label}: every bill card carries its entity label`, rows > 0 && chips === rows, `${chips} labels on ${rows} cards`);
    // The first card's label must be on screen without opening anything.
    const firstChip = page.locator('[data-testid^="bill-review-entity-chip-"]').first();
    if (await firstChip.count()) {
      await firstChip.scrollIntoViewIfNeeded().catch(() => {});
      const box = await firstChip.boundingBox();
      check(`${label}: entity label is visible on the card`, !!box && box.width > 0 && box.x >= 0 && box.x + box.width <= viewport.width + 1, box ? `${Math.round(box.x)}..${Math.round(box.x + box.width)} of ${viewport.width}` : 'not laid out');
    }
    check(`${label}: Bills Review has no sideways scroll`, (await overflow()) <= 0, `${await overflow()}px`);
    await page.locator('[data-testid="bill-review-entity-filter"]').scrollIntoViewIfNeeded().catch(() => {});
    await page.screenshot({ path: `${OUT}/${label}-bills-review.png` });

    check(`${label}: no page errors`, errors.length === 0, errors.join(' / '));
    await ctx.close();
  }
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.ok);
writeFileSync(`${OUT}/money-live-probe.json`, JSON.stringify({ base: BASE, at: new Date().toISOString(), results }, null, 2));
console.log(`\nmoney-live-probe: ${results.length - failed.length}/${results.length} checks passed against ${BASE}`);
process.exit(failed.length ? 1 : 0);

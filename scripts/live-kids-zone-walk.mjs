#!/usr/bin/env node
// =============================================================================
// live-kids-zone-walk — the LIVE Kids Zone walked as a child would, from a runner
// =============================================================================
// The cloud sandbox has no route to poetech.us (DR-0125): a GitHub runner is
// the team's eye. This drives the runner's Chromium to the production door at
// a phone width, opens the Youth tab, and walks the Kids Zone v1 (DR-1520)
// the way a child does: the home, the Theater, the games grid, a storybook
// page, the Word builder, Who am I?, Put the story in order, the badges, the
// trail and the map, the Grown-ups
// page, the Teens door, then back to the church's own Home tab. At every
// stop it asserts what a user would see (the approved guides' images really
// loaded, no developer placeholder text, the Word on the page), takes a
// still, and leaves the stills in an artifact (DR-0104: review the live push).
//
//   node scripts/live-kids-zone-walk.mjs [baseUrl] [outDir] [expectedSha]
//
// Prints one WALK line per stop; exits non-zero when any stop fails, or when
// an expected build sha is given and the page's build-sha meta does not start
// with it. It changes nothing on the site.
// =============================================================================
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

// The runner has playwright-core (the harness installs it); the sandbox's
// trial run finds the preinstalled playwright through NODE_PATH.
const pw = await import('playwright-core').catch(() => createRequire(`${process.env.NODE_PATH || '.'}/`)('playwright'));
const { chromium } = pw;

const base = (process.argv[2] || 'https://poetech.us/lovecorner/app/').replace(/\/?$/, '/');
const outDir = process.argv[3] || 'live-kids-walk';
const expectedSha = (process.argv[4] || '').trim();
mkdirSync(outDir, { recursive: true });
const url = `${base}?view=church&sub=youth&lovecorner=1`;
const PLACEHOLDER = /ART COMING|SCENE COMING|INTERIM|artwork coming|\bCOMING\b(?!\s+SOON)/i;

const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox'] }).catch(() => chromium.launch({ args: ['--no-sandbox'] }));
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e && e.message)));

let failed = 0;
let n = 0;
const still = async (name) => {
  n += 1;
  const file = join(outDir, `${String(n).padStart(2, '0')}-${name}.png`);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: file, fullPage: true }).catch(() => {});
  return file;
};
const click = async (tid) => {
  await page.locator(`[data-testid="${tid}"]`).first().click({ timeout: 15000 });
  await page.waitForTimeout(700);
};
const zoneText = () =>
  page.evaluate(() => {
    const z = document.querySelector('[data-testid="kids-zone"], [data-testid="teens-zone"], [data-testid="youth-zone"]');
    return z ? z.innerText : '';
  });
const imagesLoaded = () =>
  page.evaluate(() => {
    const imgs = [...document.querySelectorAll('[data-testid="kids-zone"] img, [data-testid="teens-zone"] img')];
    const broken = imgs.filter((i) => !(i.complete && i.naturalWidth > 0)).map((i) => i.getAttribute('src'));
    const guides = imgs.filter((i) => /\/lovecorner\/kids\//.test(i.getAttribute('src') || '') && i.complete && i.naturalWidth > 0).length;
    return { total: imgs.length, broken, guides };
  });
async function stop(name, check) {
  let detail = '';
  let ok = true;
  try {
    detail = await check();
  } catch (e) {
    ok = false;
    detail = `ERROR ${String(e && e.message).slice(0, 160)}`;
  }
  const text = await zoneText().catch(() => '');
  const ph = PLACEHOLDER.exec(text);
  if (ph) {
    ok = false;
    detail += ` | PLACEHOLDER VISIBLE: "${ph[0]}"`;
  }
  const file = await still(name);
  if (!ok) failed += 1;
  console.log(`WALK ${name} ${ok ? 'ok' : 'FAIL'} ${detail} -> ${file}`);
}

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 }).catch(() => {});
const build = await page.evaluate(() => (document.querySelector('meta[name="build-sha"]') || {}).content || '').catch(() => '');
console.log(`BUILD meta build-sha="${build}" expected="${expectedSha}"`);
if (expectedSha && !build.startsWith(expectedSha.slice(0, 7))) {
  failed += 1;
  console.log('BUILD MISMATCH: the served build is not the merged commit');
}

const zone = await page.waitForSelector('[data-testid="kids-zone"]', { timeout: 60000 }).catch(() => null);
if (!zone) {
  await still('no-kids-zone');
  console.log('WALK home FAIL the Kids Zone never rendered');
  await browser.close();
  process.exit(1);
}

await stop('home', async () => {
  await page.waitForTimeout(1500);
  const im = await imagesLoaded();
  const logo = await page.locator('[data-testid="kids-zone"] img[alt="The Love Corner Bible Adventures"]').count();
  const faces = await page.locator('[data-testid="meet-guides"] img').count();
  const tiles = await page.locator('[data-testid^="home-"], [data-testid="weekly-lesson-open"], [data-testid="tile-theater"]').count();
  const dock = await page.locator('[data-testid^="kids-tab-"]').count();
  if (im.broken.length) throw new Error(`broken images: ${im.broken.slice(0, 3).join(', ')}`);
  if (logo < 1 || faces < 2 || im.guides < 4) throw new Error(`logo=${logo} faces=${faces} guideImages=${im.guides}`);
  if (tiles < 7 || dock !== 5) throw new Error(`tiles=${tiles} dock=${dock}`);
  return `logo=${logo} guideImages=${im.guides} tiles=${tiles} dock=${dock}`;
});

await stop('theater', async () => {
  await click('kids-tab-theater');
  await page.waitForSelector('[data-testid="theater"]', { timeout: 15000 });
  const now = await page.locator('[data-testid="theater-now"]').innerText();
  const play = await page.locator('[data-testid="theater-play"]').count();
  const shelf = await page.locator('[data-testid^="episode-"]').count();
  const im = await imagesLoaded();
  if (im.broken.length) throw new Error(`broken images: ${im.broken.slice(0, 3).join(', ')}`);
  if (shelf < 3) throw new Error(`shelf=${shelf}`);
  return `now="${now.trim()}" play=${play} shelf=${shelf}`;
});

await stop('games', async () => {
  await click('kids-tab-games');
  await page.waitForSelector('[data-testid="games-grid"]', { timeout: 15000 });
  const tiles = await page.locator('[data-testid="games-grid"] button').count();
  const im = await imagesLoaded();
  if (im.broken.length) throw new Error(`broken images: ${im.broken.slice(0, 3).join(', ')}`);
  if (tiles < 7) throw new Error(`tiles=${tiles}`);
  return `tiles=${tiles} guideImages=${im.guides}`;
});

await stop('storybook-jonah', async () => {
  await click('tile-story-jonah');
  await page.waitForSelector('[data-testid="storybook-verse"]', { timeout: 30000 });
  const verse = await page.locator('[data-testid="storybook-verse"]').innerText();
  if (!/Jonah/.test(verse)) throw new Error('page 1 does not carry the verse');
  await click('storybook-next');
  const p2 = await page.locator('[data-testid="storybook"]').getAttribute('data-page');
  if (p2 !== '1') throw new Error(`next page did not turn (page=${p2})`);
  return `page1 verse ${verse.length} chars; turned to page 2`;
});

await stop('word-builder', async () => {
  await click('kids-back');
  await click('kids-tab-games');
  await click('tile-builder');
  await page.waitForSelector('[data-testid="spell-round"], [data-testid="builder-unavailable"]', { timeout: 30000 });
  const round = await page.locator('[data-testid="spell-round"]').count();
  const tiles = await page.locator('[data-testid^="tile-"][aria-label^="letter"]').count();
  if (!round) throw new Error('no spell round (verse unavailable on the live build)');
  return `word="${await page.locator('[data-testid="spell-round"]').getAttribute('data-word')}" letterTiles=${tiles}`;
});

await stop('who-am-i', async () => {
  await click('kids-back');
  await click('kids-tab-games');
  await click('tile-whoami');
  await page.waitForSelector('[data-testid="clue-1"]', { timeout: 30000 });
  const clue = await page.locator('[data-testid="clue-1"] q').innerText();
  const names = await page.locator('[data-testid^="name-"]').count();
  if (clue.trim().length < 10 || names !== 4) throw new Error(`clue="${clue.slice(0, 30)}" names=${names}`);
  return `clue ${clue.trim().length} chars; names=${names}`;
});

await stop('story-order', async () => {
  await click('kids-back');
  await click('kids-tab-games');
  await click('tile-order');
  await page.waitForSelector('[data-testid="story-order"]', { timeout: 15000 });
  const cards = await page.locator('[data-testid^="order-card-"]').count();
  await page.locator('[data-testid^="order-card-"]').first().click();
  const placed = await page.locator('[data-testid="story-order"]').getAttribute('data-placed');
  if (cards !== 8 || placed !== '1') throw new Error(`cards=${cards} placed=${placed}`);
  return `cards=${cards} placedOne=${placed}`;
});

await stop('badges-map', async () => {
  await click('kids-back');
  await click('kids-tab-badges');
  await page.waitForSelector('[data-testid="badge-shelf"]', { timeout: 15000 });
  const badges = await page.locator('[data-testid^="badge-"]').count();
  const map = await page.locator('[data-testid="adventure-map"] svg circle').count();
  const stops = await page.locator('[data-testid^="stop-jonah-"]').count();
  const next = await page.locator('[data-testid="trail-jonah"]').getAttribute('data-next');
  if (badges < 9 || map < 8 || stops !== 5) throw new Error(`badges=${badges} mapStops=${map} trailStops=${stops}`);
  return `badges=${badges} mapStops=${map} trailStops=${stops} next=${next}`;
});

await stop('grown-ups', async () => {
  await click('kids-tab-grownups');
  await page.waitForTimeout(800);
  const text = await zoneText();
  if (!/grown/i.test(text)) throw new Error('the grown-ups page did not render');
  return `grown-ups text ${text.length} chars`;
});

await stop('teens', async () => {
  await click('kids-tab-adventure');
  await click('door-teens');
  await page.waitForSelector('[data-testid="teens-zone"]', { timeout: 15000 });
  const tabs = await page.locator('[data-testid="teens-zone"] [data-testid^="kids-tab-"]').count();
  const tiles = await page.locator('[data-testid="teens-zone"] [data-testid^="home-"], [data-testid="teens-zone"] [data-testid="weekly-lesson-open"]').count();
  if (tabs !== 5 || tiles < 5) throw new Error(`tabs=${tabs} tiles=${tiles}`);
  return `tabs=${tabs} tiles=${tiles}`;
});

// The rest of the church app: the strip's tabs are there and the Home tab still opens.
let churchOk = true;
let churchDetail = '';
try {
  const strip = await page.locator('[data-testid^="lch-strip-tab-"]').count();
  // The strip scrolls sideways and the active tab is the one in view: click the Home tab in the page itself.
  await page.$eval('[data-testid="lch-strip-tab-home"]', (el) => el.click());
  await page.waitForTimeout(2000);
  const youthGone = (await page.locator('[data-testid="youth-zone"]').count()) === 0;
  const words = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').length);
  churchDetail = `stripTabs=${strip} leftTheZone=${youthGone} homeWords=${words}`;
  if (strip < 8 || !youthGone || words < 300) churchOk = false;
} catch (e) {
  churchOk = false;
  churchDetail = `ERROR ${String(e && e.message).slice(0, 120)}`;
}
const file = await still('church-home');
if (!churchOk) failed += 1;
console.log(`WALK church-home ${churchOk ? 'ok' : 'FAIL'} ${churchDetail} -> ${file}`);

if (errors.length) console.log(`PAGE ERRORS ${errors.length}: ${errors.slice(0, 3).join(' | ')}`);
await browser.close();
console.log(failed ? `LIVE KIDS WALK: ${failed} stop(s) failed` : 'LIVE KIDS WALK: OK (every stop rendered as a child would see it)');
process.exit(failed ? 1 : 0);

#!/usr/bin/env node
// =============================================================================
// home-studio-probe — the redesigned Love Corner homepage MEASURED on a built
// page (private owner preview; lib/home-studio.js)
// =============================================================================
// Run against a served dist (the way love-corner-comfort-probe.mjs does):
//   cd app && npx vite build && ln -sfn ../dist dist/poetech-app && \
//   (python3 -m http.server 4173 --directory dist &) && node ../scripts/home-studio-probe.mjs
// What it proves, each a finding when it fails:
//   • the preview opens only where the flag allows (?homeStudio=1 on localhost)
//     and the current homepage is what renders with the flag off;
//   • no horizontal overflow, no control under 44px tall, every control named,
//     every non-decorative image has alt text — at 360/390/768/1440 and three
//     text sizes;
//   • EVERY door lands where it says (quick navigation, hero buttons, kids,
//     messages, learning, events, church office, and the five bottom tabs);
//   • the website-sourced sections read the relays: with FIXTURES=1 the relays
//     answer from labelled test fixtures (no network from this machine), without
//     it the page uses whatever the relays really return.
// Screenshots go to SHOTS_DIR (default ./home-studio-shots) at the theme named by
// THEME (default: the door's own). Prints FINDINGS; exits 1 when any remain.
let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  ({ chromium } = await import('playwright-core'));
}
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const ORIGIN = process.env.PROBE_BASE || 'http://127.0.0.1:4173';
const PATH = process.env.PROBE_PATH || '/lovecorner/app/';
const URL_ON = `${ORIGIN}${PATH}?lovecorner=1&view=church&homeStudio=1`;
const URL_OFF = `${ORIGIN}${PATH}?lovecorner=1&view=church&homeStudio=0`;
const SHOTS = process.env.SHOTS_DIR || './home-studio-shots';
const FIXTURES = process.env.FIXTURES === '1';
// LIVE=1: the relays are the REAL production ones (read-only GETs to LIVE_ORIGIN), so what the page shows is what the church actually published. Never with FIXTURES.
const LIVE = process.env.LIVE === '1';
const LIVE_ORIGIN = process.env.LIVE_ORIGIN || 'https://poetech.us';
const THEMES = (process.env.THEMES || '').split(',').filter(Boolean);
const WIDTHS = (process.env.WIDTHS || '360,390,768,1440').split(',').map(Number);
const SIZES = (process.env.SIZES || 'normal,largest,bigprint').split(',');
mkdirSync(SHOTS, { recursive: true });

const findings = [];
const note = (s) => {
  findings.push(s);
  console.log('  !', s);
};

// ---- labelled test fixtures (only with FIXTURES=1) ---------------------------
function fixtureImage(path, w, h, label) {
  if (existsSync(path)) return;
  execFileSync('python3', [
    '-c',
    `from PIL import Image, ImageDraw
im=Image.new('RGB',(${w},${h}),(120,40,34))
d=ImageDraw.Draw(im)
d.rectangle([20,20,${w - 20},${h - 20}],outline=(207,166,60),width=6)
d.text((40,${Math.floor(h / 2)}),"${label}",fill=(255,255,255))
im.save("${path}")`,
  ]);
}
const FIX = join(SHOTS, '_fixtures');
const FEED = (n) =>
  `<?xml version="1.0"?><feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns="http://www.w3.org/2005/Atom">${Array.from({ length: n }, (_, i) => `<entry><id>yt:video:fixture${String(i).padStart(5, '0')}</id><yt:videoId>fixture${String(i).padStart(5, '0')}</yt:videoId><title>FIXTURE message ${i + 1}${i === 0 ? ' (newest)' : ''}</title><published>2026-11-${String(22 - i).padStart(2, '0')}T17:00:00+00:00</published></entry>`).join('')}</feed>`;
const PAGES = {
  calendar: '<h2>November 2026</h2><img src="/uploads/11-november-2026-calendar.png" alt="Picture">',
  'letters-from-bg': '<img src="/uploads/november-2026-letter.png" alt="Picture">',
  'current-events': '<div class="paragraph">FIXTURE intro line for current events</div><img src="/uploads/fixture-event-one-flyer.png" alt="Picture"><img src="/uploads/fixture-event-two-flyer.png" alt="Picture"><img src="/uploads/fixture-event-three-flyer.png" alt="Picture"><img src="/uploads/fixture-event-four-flyer.png" alt="Picture">',
  home: '<div class="paragraph">Sunday Worship: 10:30 am</div>',
};
async function installFixtures(ctx) {
  mkdirSync(FIX, { recursive: true });
  fixtureImage(join(FIX, 'cal.png'), 1000, 700, 'FIXTURE CALENDAR IMAGE');
  fixtureImage(join(FIX, 'flyer.png'), 600, 800, 'FIXTURE FLYER IMAGE');
  fixtureImage(join(FIX, 'thumb.png'), 480, 360, 'FIXTURE VIDEO STILL');
  const bytes = (f) => execFileSync('cat', [join(FIX, f)]);
  await ctx.route('**/api/church-recent*', (r) => r.fulfill({ status: 200, contentType: 'application/xml', body: FEED(6) }));
  await ctx.route('**/api/church-site*', (r) => {
    const u = new URL(r.request().url());
    const asset = u.searchParams.get('asset');
    if (asset) return r.fulfill({ status: 200, contentType: 'image/png', body: bytes(/calendar|letter/.test(asset) ? 'cal.png' : 'flyer.png') });
    const page = u.searchParams.get('page');
    return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ page, url: `https://example.invalid/${page}`, fetchedAt: new Date().toISOString(), html: `<div>${PAGES[page] || ''}</div>`, images: [] }) });
  });
  await ctx.route('**/i.ytimg.com/**', (r) => r.fulfill({ status: 200, contentType: 'image/png', body: bytes('thumb.png') }));
}

async function installLive(ctx) {
  await ctx.route(/\/api\/church-(site|recent)/, async (r) => {
    const u = new URL(r.request().url());
    try {
      const resp = await r.fetch({ url: `${LIVE_ORIGIN}${u.pathname}${u.search}` });
      await r.fulfill({ response: resp });
    } catch (e) {
      await r.abort();
    }
  });
}

async function open(browser, { width, size = 'normal', theme = '', url = URL_ON, dsf = 1 }) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: dsf, isMobile: width < 700, hasTouch: width < 700 });
  await ctx.addInitScript(
    ({ k, t }) => {
      try {
        localStorage.setItem('poe-text-size', k);
        if (t) localStorage.setItem('poe-theme-pref', t);
      } catch {
        /* no storage */
      }
    },
    { k: size, t: theme }
  );
  if (LIVE) await installLive(ctx);
  else if (FIXTURES) await installFixtures(ctx);
  const page = await ctx.newPage();
  const errs = [];
  page.relays = [];
  page.on('response', (r) => {
    if (/\/api\/church-(site|recent)/.test(r.url())) page.relays.push({ url: r.url().replace(/^https?:\/\/[^/]+/, ''), status: r.status() });
  });
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1500);
  return { ctx, page, errs };
}

const measure = (page) =>
  page.evaluate(() => {
    const root = document.querySelector('[data-testid="home-studio"]');
    if (!root) return { missing: true };
    const out = { overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, small: [], noName: [], noAlt: [], h: [] };
    for (const el of root.querySelectorAll('button, a[href]')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const name = (el.getAttribute('aria-label') || el.textContent || '').trim();
      if (!name) out.noName.push(el.outerHTML.slice(0, 80));
      if (r.height < 44 && !el.classList.contains('hs-note-btn')) out.small.push(`${name.slice(0, 30)} ${Math.round(r.height)}px`);
      if (el.classList.contains('hs-note-btn') && r.height < 36) out.small.push(`${name.slice(0, 30)} ${Math.round(r.height)}px (<36)`);
    }
    for (const img of root.querySelectorAll('img')) if (!img.hasAttribute('alt')) out.noAlt.push(img.src.slice(-40));
    out.h = [...root.querySelectorAll('h2,h3')].map((h) => h.tagName + ':' + h.textContent.trim().slice(0, 30));
    return out;
  });

(async () => {
  const b = await chromium.launch(process.env.CI ? { channel: 'chrome', args: ['--no-sandbox'] } : {}).catch(() => chromium.launch({ args: ['--no-sandbox'] }));

  if (LIVE) {
    const report = { at: new Date().toISOString(), origin: LIVE_ORIGIN, relays: [], sections: {} };
    for (const w of [390, 768, 1440]) {
      const { ctx, page, errs } = await open(b, { width: w, theme: 'night', dsf: w < 700 ? 2 : 1 });
      await page.waitForTimeout(4000);
      const got = await page.evaluate(() => {
        const loaded = (sel) => [...document.querySelectorAll(sel)].map((i) => ({ src: i.currentSrc.slice(-60), ok: i.complete && i.naturalWidth > 0 }));
        return {
          fixtureText: /FIXTURE|Fixture/.test(document.body.innerText),
          messages: [...document.querySelectorAll('.hs-cine:not(.hs-cine-ev) .hs-cine-t')].map((e) => e.textContent.trim()),
          thumbs: loaded('.hs-cine:not(.hs-cine-ev) img'),
          events: [...document.querySelectorAll('[data-testid="hs-event"] .hs-cine-t')].map((e) => e.textContent.trim()),
          eventImages: loaded('[data-testid="hs-event"] img'),
          eventsLink: (document.querySelector('[data-testid="hs-view-all-events"]') || {}).textContent,
          officeCard: (document.querySelector('[data-testid="hs-office-card"] small') || {}).textContent,
          kidsArt: loaded('[data-testid="hs-kids"] img'),
        };
      });
      report.sections[w] = got;
      report.relays.push(...page.relays.map((r) => `${w}px ${r.status} ${r.url}`));
      if (got.fixtureText) note(`${w}px: fixture text on the live page`);
      if (!got.messages.length) note(`${w}px: no real sermons read (feed empty)`);
      if (got.thumbs.some((t) => !t.ok)) note(`${w}px: a sermon thumbnail did not load`);
      if (got.eventImages.some((t) => !t.ok)) note(`${w}px: an event image did not load`);
      for (const r of page.relays) if (r.status !== 200) note(`${w}px: relay ${r.url} answered ${r.status}`);
      for (const e of errs) note(`${w}px: page error ${e}`);
      await page.screenshot({ path: join(SHOTS, `live-home-${w}.png`), fullPage: true });
      if (w === 390) {
        for (const y of [0, 750, 1500, 2300]) {
          await page.evaluate((yy) => window.scrollTo(0, yy), y);
          await page.waitForTimeout(500);
          await page.screenshot({ path: join(SHOTS, `live-phone-scroll${y}.png`) });
        }
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.click('[data-testid="hs-office"]');
        await page.waitForTimeout(3000);
        const off = await page.evaluate(() => ({
          calendar: [...document.querySelectorAll('[data-testid="church-office-calendar"] img')].map((i) => i.complete && i.naturalWidth > 0),
          letter: [...document.querySelectorAll('[data-testid="church-office-letter"] img')].map((i) => i.complete && i.naturalWidth > 0),
          flyers: [...document.querySelectorAll('[data-testid="church-office-flyer"] img')].map((i) => i.complete && i.naturalWidth > 0),
          caption: [...document.querySelectorAll('.lc-office-cap')].map((e) => e.textContent.trim()),
        }));
        report.sections.office = off;
        if (![...off.calendar, ...off.letter, ...off.flyers].length) note('church office: nothing read from the church website');
        if ([...off.calendar, ...off.letter, ...off.flyers].some((x) => !x)) note('church office: a picture did not load');
        await page.screenshot({ path: join(SHOTS, 'live-church-office-390.png'), fullPage: true });
        await page.click('[data-testid="dock-tab-studio-events"]');
        await page.waitForTimeout(3000);
        await page.screenshot({ path: join(SHOTS, 'live-events-390.png'), fullPage: true });
        await page.click('[data-testid="dock-tab-studio-messages"]');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: join(SHOTS, 'live-messages-390.png'), fullPage: true });
      }
      await ctx.close();
    }
    writeFileSync(join(SHOTS, 'live-report.json'), JSON.stringify(report, null, 2));
    writeFileSync(join(SHOTS, 'findings.txt'), findings.join('\n') + `\nFINDINGS ${findings.length}\n`);
    await b.close();
    console.log(JSON.stringify(report, null, 2));
    console.log(`FINDINGS ${findings.length}`);
    process.exit(findings.length ? 1 : 0);
  }

  // 1. the flag: on with ?homeStudio=1, current homepage with ?homeStudio=0
  {
    const on = await open(b, { width: 390 });
    if (!(await on.page.$('[data-testid="home-studio"]'))) note('flag on: the redesigned homepage did not render');
    if (await on.page.$('[data-testid="lovecorner-home"]')) note('flag on: the current homepage still renders above the redesign');
    await on.ctx.close();
    const off = await open(b, { width: 390, url: URL_OFF });
    if (await off.page.$('[data-testid="home-studio"]')) note('flag off: the redesign rendered');
    if (!(await off.page.$('[data-testid="lovecorner-home"]'))) note('flag off: the current homepage did not render');
    await off.ctx.close();
  }

  // 2. layout at every width and size
  for (const size of SIZES) {
    for (const w of WIDTHS) {
      const { ctx, page, errs } = await open(b, { width: w, size });
      const r = await measure(page);
      const tag = `${w}px/${size}`;
      if (r.missing) note(`${tag}: no redesigned homepage`);
      else {
        if (r.overflow > 0) note(`${tag}: horizontal overflow ${r.overflow}px`);
        for (const s of r.small) note(`${tag}: small target ${s}`);
        for (const s of r.noName) note(`${tag}: unnamed control ${s}`);
        for (const s of r.noAlt) note(`${tag}: image without alt ${s}`);
      }
      // the Kids artwork and the Bible Adventures logo are shown whole: the image keeps its own proportions and nothing clips it
      const art = await page.evaluate(() => {
        const i = document.querySelector('[data-testid="hs-kids"] img');
        if (!i || !i.naturalWidth) return null;
        const r = i.getBoundingClientRect();
        const p = i.parentElement.getBoundingClientRect();
        return { drawn: r.width / r.height, natural: i.naturalWidth / i.naturalHeight, inside: r.left >= p.left - 1 && r.right <= p.right + 1 && r.top >= p.top - 1 && r.bottom <= p.bottom + 1, fit: getComputedStyle(i).objectFit };
      });
      if (!art) note(`${tag}: Kids artwork not loaded`);
      else if (Math.abs(art.drawn - art.natural) / art.natural > 0.02 || !art.inside) note(`${tag}: Kids artwork is cropped or clipped (${JSON.stringify(art)})`);
      // the bar never covers content: the page ends above it
      if (w < 700) {
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        await page.waitForTimeout(300);
        const end = await page.evaluate(() => {
          const d = document.querySelector('[data-testid="chrome-dock"]').getBoundingClientRect();
          const sp = document.querySelector('[data-testid="chrome-dock-spacer"]');
          return { dockTop: d.top, spacerTop: sp ? sp.getBoundingClientRect().top : null };
        });
        if (end.spacerTop === null || end.spacerTop > end.dockTop + 1) note(`${tag}: content runs under the bottom bar at the end of the page (${JSON.stringify(end)})`);
      }
      if (w < 700) {
        for (const y of [0, 600, 1400]) {
          await page.evaluate((yy) => window.scrollTo(0, yy), y);
          await page.waitForTimeout(250);
          const gap = await page.evaluate(() => {
            const d = document.querySelector('[data-testid="chrome-dock"]');
            return d ? Math.round(window.innerHeight - d.getBoundingClientRect().bottom) : null;
          });
          if (gap === null || Math.abs(gap) > 1) note(`${tag}: bottom bar is ${gap}px off the viewport bottom at scroll ${y}`);
        }
      }
      for (const e of errs) note(`${tag}: page error ${e}`);
      await ctx.close();
    }
  }

  // 3. every door lands where it says
  const DOORS = [
    ['hs-watch', { sub: null, section: 'worship' }],
    ['hs-visit', { sub: null, section: 'about' }],
    ['hs-quick-worship', { sub: null, section: 'worship' }],
    ['hs-quick-word', { sub: 'pulpit' }],
    ['hs-quick-institute', { sub: 'institute' }],
    ['hs-quick-ministries', { sub: 'ministries' }],
    ['hs-quick-youth', { sub: 'youth' }],
    ['hs-quick-prayer', { sub: null, section: 'prayer' }],
    ['hs-quick-give', { sub: null, section: 'give' }],
    ['hs-kids-go', { sub: 'youth' }],
    ['hs-more-messages', { sub: null, section: 'worship' }],
    ['hs-learn', { sub: 'learn' }],
    ['hs-institute', { sub: 'institute' }],
    ['hs-view-all-events', { sub: null, section: 'times' }],
    ['hs-office', { sub: null, section: 'office' }],
    ['hs-explore-corner', { sub: null, section: 'mycorner' }],
    ['hs-explore-reading', { sub: 'scripture' }],
    ['hs-explore-choir', { sub: 'choir' }],
    ['hs-explore-bus', { sub: 'bus' }],
    ['hs-explore-program', { sub: 'program' }],
  ];
  for (const [id, want] of DOORS) {
    const { ctx, page } = await open(b, { width: 390 });
    const el = await page.$(`[data-testid="${id}"]`);
    if (!el) {
      note(`door ${id}: not on the page`);
      await ctx.close();
      continue;
    }
    await el.scrollIntoViewIfNeeded();
    await el.click();
    await page.waitForTimeout(900);
    const got = await page.evaluate(() => ({ search: location.search, tab: (document.querySelector('[role="tab"][aria-selected="true"][id^="church-tab-"]') || {}).id || '' }));
    if (want.sub && !got.search.includes(`sub=${want.sub}`)) note(`door ${id}: expected sub=${want.sub}, got ${got.search}`);
    if (want.section && got.tab !== `church-tab-${want.section}`) note(`door ${id}: expected section ${want.section}, got ${got.tab || 'none'}`);
    await ctx.close();
  }

  // 4. the five bottom tabs
  const TABS = [
    ['studio-messages', { sub: null, section: 'worship' }],
    ['studio-events', { sub: null, section: 'times' }],
    ['studio-learning', { sub: 'learn' }],
    ['studio-institute', { sub: 'institute' }],
    ['studio-ministries', { sub: 'ministries' }],
  ];
  {
    const { ctx, page } = await open(b, { width: 390 });
    const labels = await page.$$eval('[data-testid^="dock-tab-studio-"]', (els) => els.map((e) => e.textContent.trim()));
    if (labels.join('|') !== 'Home|Messages|Events|Learning|Institute|Ministries') note(`bottom bar is ${JSON.stringify(labels)}`);
    await ctx.close();
  }
  for (const [id, want] of TABS) {
    const { ctx, page } = await open(b, { width: 390 });
    const el = await page.$(`[data-testid="dock-tab-${id}"]`);
    if (!el) {
      note(`tab ${id}: not on the bar`);
      await ctx.close();
      continue;
    }
    await el.click();
    await page.waitForTimeout(900);
    const got = await page.evaluate(() => ({ search: location.search, tab: (document.querySelector('[role="tab"][aria-selected="true"][id^="church-tab-"]') || {}).id || '' }));
    if (want.sub && !got.search.includes(`sub=${want.sub}`)) note(`tab ${id}: expected sub=${want.sub}, got ${got.search}`);
    if (want.section && got.tab !== `church-tab-${want.section}`) note(`tab ${id}: expected section ${want.section}, got ${got.tab || 'none'}`);
    await ctx.close();
  }

  // 5. screenshots (real pixels of the real page)
  const themes = THEMES.length ? THEMES : [''];
  for (const theme of themes) {
    for (const w of WIDTHS) {
      const { ctx, page } = await open(b, { width: w, theme, dsf: w < 700 ? 2 : 1 });
      const name = `home-${theme || 'door-default'}-${w}.png`;
      await page.screenshot({ path: join(SHOTS, name), fullPage: true });
      if (!theme && w === 390) {
        await page.screenshot({ path: join(SHOTS, `view-${theme || 'door-default'}-390-top.png`) });
        for (const [id, section] of [['studio-events', 'events'], ['studio-messages', 'messages']]) {
          await page.click(`[data-testid="dock-tab-${id}"]`);
          await page.waitForTimeout(900);
          await page.screenshot({ path: join(SHOTS, `section-${section}-390.png`), fullPage: false });
        }
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.click('[data-testid="hs-explore-corner"]').catch(() => {});
        await page.waitForTimeout(900);
        await page.screenshot({ path: join(SHOTS, 'section-my-corner-390.png') });
      }
      await ctx.close();
    }
  }
  writeFileSync(join(SHOTS, 'findings.txt'), findings.join('\n') + `\nFINDINGS ${findings.length}\n`);
  await b.close();
  console.log(`FINDINGS ${findings.length}`);
  process.exit(findings.length ? 1 : 0);
})();

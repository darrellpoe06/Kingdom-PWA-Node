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
// Invariants asserted per width (360 / 768 / 1440 / 1920):
//   1920 ADDED 2026-09-22: Darrell reads lessons on a Fire TV and a Samsung
//   set, and the sweep had never measured a television. A 10-foot UI is a
//   real form factor for this app (DR-0264 asked for readers aged 6 to 60,
//   across a room), and dimension 4 says a sweep is MEASURED, not eyeballed.
//   Measured by CI's runner: the sandbox that added this width cannot mount
//   the page at all (no route to /sb), which is exactly why the runner is the
//   team's eye (DR-0125) and why this line was not asserted from a guess.
//   1. NO PAGE OVERFLOW — document scrollWidth <= viewport width + 1px.
//   2. BRAND READS HORIZONTALLY — the header h1 box is wider than tall
//      (a letter-stacked 1-ch column is taller than wide by construction).
//   3. NOTHING OVERLAPS THE NAME — no header button/link/select rect
//      intersects the h1 rect (the LOG OUT-over-the-wordmark screenshot).
//
// TEXT-SCALE pass (rides --sweep; added 2026-08-05 after the Big Print TLC
// screenshots — clipped cards, and a reader TRAPPED in big text because the
// door header outgrew the viewport and hid its own size controls): the same
// surfaces plus the TLC and Moore doors are loaded at Big Print 44 (2.75x,
// the top step) at phone/tablet widths and must hold two invariants:
//   4. NO PAGE OVERFLOW at Big Print — the layout holds, nothing clips.
//   5. THE ESCAPE HATCH IS REACHABLE — at least one text-size control is
//      fully on screen at load, so big text is always reversible. Asserted in
//      BOTH header states (expanded AND collapsed via the header hideaway):
//      "always reversible" means from every state the reader can actually be
//      in, not only the one the probe happened to load.
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

const args = process.argv.slice(2).filter((a) => a !== '--selftest-break' && a !== '--sweep');
const SELFTEST = process.argv.includes('--selftest-break');
// --sweep probes the major surface families, not only the church door —
// dimension 4 is a SWEEP, one width on one view is not (DR-0239).
const SWEEP = process.argv.includes('--sweep');
const BASE = '/poetech-app';
const DIST = args[0] || fileURLToPath(new URL('../app/dist', import.meta.url));
const WIDTHS = [360, 768, 1440, 1920];
const VIEWS = SWEEP
  // 'properties' added 2026-08-27: the Poe Properties workspace is a face of
  // its own (its own manifest scope, its own served page) and had NO layout
  // instrument — the exact gap dimension 4 exists to close, found by running
  // this review against a surface the sweep list had never heard of.
  ? ['church', 'books', 'messages', 'about', 'crm', 'rentals', 'markets', 'library', 'games', 'admin', 'properties']
  : ['church'];

if (!existsSync(join(DIST, 'index.html'))) {
  console.error(`chrome-layout-probe: no index.html in ${DIST} — build the app first (npm run build)`);
  process.exit(2);
}

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.png': 'image/png',
};

// THE NAS VOICE, STUBBED FOR THE TV PASS (DR-0655): a bearer-locked
// /voice-lite/speak that answers a short WAV, the shape of the real door
// (infra/nas-voice-lite: 401 without the family key).
const TV_KEY = 'probe-family-key';
function tinyWav(seconds = 1.2, rate = 8000) {
  const n = Math.round(seconds * rate);
  const b = Buffer.alloc(44 + n * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVE', 8); b.write('fmt ', 12);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(rate, 24);
  b.writeUInt32LE(rate * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i += 1) b.writeInt16LE(Math.round(6000 * Math.sin(2 * Math.PI * 220 * i / rate)), 44 + i * 2);
  return b;
}
const TV_CLIP = tinyWav();
const voiceLiteLog = [];
const server = createServer((req, res) => {
  let path = (req.url || '/').split('?')[0];
  if (path.startsWith('/voice-lite/')) {
    const auth = req.headers.authorization || '';
    voiceLiteLog.push({ path, keyed: auth === `Bearer ${TV_KEY}` });
    if (auth !== `Bearer ${TV_KEY}`) { res.writeHead(401, { 'Content-Type': 'application/json' }); res.end('{"error":"unauthorized"}'); return; }
    req.resume();
    req.on('end', () => { res.writeHead(200, { 'Content-Type': 'audio/wav' }); res.end(TV_CLIP); });
    return;
  }
  if (path.startsWith('/voice/')) { res.writeHead(502, { 'Content-Type': 'application/json' }); res.end('{"error":"dark"}'); return; }
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

const launchOpts = process.env.PLAYWRIGHT_CHROMIUM_PATH
  ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
  : { channel: 'chrome' };
let browser;
try { browser = await chromium.launch(launchOpts); }
catch { browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }); }

let failures = 0;
let tsFailuresBefore = 0;
let lessonFailuresBefore = 0;
let lessonMeasured = 0;
let presenterMeasured = 0;
let tvMeasured = 0;
let tvTripped = 0;
// COVERAGE, counted — not assumed (DR-0323). This probe reported `exit 0` on
// 2026-09-03 having measured only 8 of its 11 views: no failure was raised, so
// the run read as a clean pass while a third of the surfaces — including the
// one under review — were never looked at. A gate that can silently skip its
// subjects and still say OK is the vacuous-green class DR-0076 §3 exists to
// kill, and counting failures alone cannot see it. So every completed
// measurement is counted and the total is asserted against what was intended.
let measured = 0;
let tsMeasured = 0;
const fail = (msg) => { failures += 1; console.error(`LAYOUT FAIL  ${msg}`); };
// How long a chrome case waits for the network to go quiet (DR-0645).
// Measured on CI run 36073585592: every view settled in 1.3-2.5 s except
// `markets`, which polls outside quote relays that never go idle from a
// runner, so it sat out the full 45 s timeout at each of four widths —
// 3 of the sweep's 5 minutes spent waiting on nothing the probe measures.
// Past the cap the header is measured exactly as before: the h1 wait
// below still has to find the header, and every invariant still runs.
const CHROME_IDLE_CAP_MS = 10000;

try {
  for (const view of VIEWS) for (const width of WIDTHS) {
    const url = `${origin}${BASE}/?view=${view}`;
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(url, { waitUntil: 'networkidle', timeout: CHROME_IDLE_CAP_MS }).catch(() => {});
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
    // PER-CASE, NOT CUMULATIVE (fixed 2026-08-14, REV-0248).
    //
    // This line used to read `if (!failures)` — the GLOBAL running count — so
    // the moment ANY surface failed, every later surface that passed perfectly
    // went unprinted. A run with 1 real failure and 37 clean passes produced
    // output indistinguishable in shape from 38 failures, with no positives to
    // read against. That is the surface-says-truth defect class applied to a
    // gate's own report: the number was right, the picture it painted was not,
    // and it cost a real misreading of this probe's output before it was found.
    const before = failures;
    measured += 1;
    if (m.noHeader) { fail(`${view}@${width}px: header h1 never rendered`); continue; }
    if (m.scrollWidth > m.clientWidth + 1) fail(`${view}@${width}px: page overflows horizontally (${m.scrollWidth} > ${m.clientWidth})`);
    if (m.h1.w <= m.h1.h) fail(`${view}@${width}px: brand reads vertically — h1 "${m.h1.text}" is ${m.h1.w}x${m.h1.h}px (letter-stack collapse)`);
    if (m.overlaps.length) fail(`${view}@${width}px: controls overlap the name: ${m.overlaps.join(', ')}`);
    if (failures === before) console.log(`layout ok  ${view}@${width}px — h1 ${m.h1.w}x${m.h1.h}px, no overflow, no overlap`);
  }
  // ---------------------------------------------------------------------------
  // THE WAY BACK FROM THE HIDEAWAY pass (DR-0577). Darrell 2026-09-23, on his
  // Fold with the header tucked away: "Lost the whole header?!!!!!!!!!!!" and
  // "It's hard to get to the edges of the app anymore?!" The only control that
  // brought the header back was the chevron pinned to the RIGHT of the tab
  // row, and the row had stopped shrinking (#1734's Show-all wrapper was a
  // flex item with min-width:auto), so at any width where the tabs did not
  // fit the row ran past the viewport and took the chevron with it. Measured
  // in Chromium at 1812px before the fix: nav row 1953px, chevron at x=1912.
  // Three invariants, with the header COLLAPSED, at every width:
  //  12. THE HEADER NEVER RUNS PAST THE SCREEN — header.scrollWidth <= clientWidth.
  //  13. THE CHEVRON IS ON SCREEN — the hideaway toggle's right edge <= viewport.
  //  14. THE WAY BACK IS ALSO IN WORDS — the tucked-away row carries a
  //      "Show header" button, on screen, so the way back never depends on
  //      an edge; and when the tab row overflows, its Show-all control is
  //      there (the wrapper shrank, so the scroll box can measure itself).
  // Selftest: the wrapper (the div holding .tab-scroll) is forced to 2600px min-width (the pre-fix
  // behaviour, exaggerated) and 12 + 13 MUST trip.
  // ---------------------------------------------------------------------------
  const HIDEAWAY_WIDTHS = SELFTEST ? [1812] : [360, 768, 1440, 1812, 1920];
  let hideawayTripped = 0;
  for (const width of HIDEAWAY_WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.addInitScript(() => {
      try { localStorage.setItem('poetech.help.tour.v1', 'seen'); localStorage.setItem('poe-header-collapsed', '1'); } catch (_) { /* private mode */ }
    });
    await page.goto(`${origin}${BASE}/?view=church`, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
    await page.waitForSelector('header nav', { timeout: 20000 }).catch(() => {});
    if (SELFTEST) {
      await page.addStyleTag({ content: 'header nav div:has(> .tab-scroll) { min-width: 2600px !important }' });
      await page.evaluate(() => new Promise((r) => setTimeout(r, 100)));
    }
    const hm = await page.evaluate(() => {
      const header = document.querySelector('header');
      const nav = header && header.querySelector('nav');
      if (!header || !nav) return { none: true };
      const vw = document.documentElement.clientWidth;
      const rect = (el) => (el ? el.getBoundingClientRect() : null);
      const chevron = header.querySelector('nav button[aria-label^="Show the full header"]');
      const words = header.querySelector('[data-testid="show-full-header"]');
      const box = nav.querySelector('.tab-scroll');
      const showAll = nav.querySelector('[data-testid="tabscroll-show-all"]');
      const c = rect(chevron); const w = rect(words); const b = rect(box);
      return {
        vw,
        headerScroll: header.scrollWidth, headerClient: header.clientWidth,
        chevron: c ? { right: Math.round(c.right), width: Math.round(c.width) } : null,
        words: w ? { left: Math.round(w.left), right: Math.round(w.right), width: Math.round(w.width) } : null,
        box: b ? { right: Math.round(b.right), scroll: box.scrollWidth, client: box.clientWidth } : null,
        showAll: !!showAll,
      };
    });
    await page.close();
    const hbefore = failures;
    const hwhere = `hideaway@${width}px`;
    if (hm.none) { fail(`${hwhere}: the header never rendered`); continue; }
    if (hm.headerScroll > hm.headerClient + 1) fail(`${hwhere}: the collapsed header runs past the screen (${hm.headerScroll} > ${hm.headerClient})`);
    if (!hm.chevron) fail(`${hwhere}: the hideaway chevron is missing`);
    else if (hm.chevron.right > hm.vw) fail(`${hwhere}: the hideaway chevron is off-screen (right edge ${hm.chevron.right} > ${hm.vw})`);
    if (!hm.words || hm.words.width === 0) fail(`${hwhere}: the tucked-away row has no "Show header" button`);
    else if (hm.words.left < 0 || hm.words.right > hm.vw) fail(`${hwhere}: the "Show header" button is off-screen (${hm.words.left}..${hm.words.right} of ${hm.vw})`);
    if (hm.box && hm.box.scroll > hm.box.client + 4 && !hm.showAll) fail(`${hwhere}: the tab row overflows (${hm.box.scroll} > ${hm.box.client}) and offers no Show-all control`);
    if (failures === hbefore) console.log(`hideaway ok  ${hwhere} — header ${hm.headerScroll}/${hm.headerClient}, chevron right ${hm.chevron.right}, words ${hm.words.left}..${hm.words.right}${hm.box && hm.box.scroll > hm.box.client + 4 ? ', tabs overflow with Show-all' : ''}`);
    else hideawayTripped += failures - hbefore;
  }
  if (SELFTEST && hideawayTripped < 2) fail(`selftest: the hideaway break tripped ${hideawayTripped} invariants, expected at least 2 — the pass is theater`);
  // ---------------------------------------------------------------------------
  // LESSON READING pass (DR-0406) — the lesson column is MEASURED at the width
  // a reader gets, and nothing is boxed inside a sentence.
  //
  // Darrell 2026-09-14, building for elderly church founders: "The width of the
  // pages need the full width of the page to be used!!!! Old required
  // procedures!!!" and "Don't block the lesson words." Measured before the fix
  // in a real Chromium: NO max-width remained, yet the prose was 262px of a
  // 390px phone — five nested bordered boxes each taking padding down the
  // reading path. jsdom cannot see that; only this instrument can. Two
  // invariants, per width, on the real Lesson 1 in its own space with the arc
  // stepped to TEACH:
  //   6. THE PROSE MEETS THE PAGE — the paragraph column reaches <main>'s
  //      content edge on both sides within 2px (the same gutter every page has).
  //   7. NOTHING IS BOXED IN A SENTENCE — no button/link inside a prose
  //      paragraph; the references live in the green strip at the section foot.
  // Rides --sweep (real assertions) and --selftest-break (a 60% max-width on
  // the paragraphs plus a button injected into one MUST trip both).
  // ---------------------------------------------------------------------------
  //
  // THE STANDARD IS LESSON 127 (Darrell 2026-09-15, listening at Big Print:
  // "use lesson 127 that flows correctly... as the standard"; and "I don't like
  // the the buttons get way bigger on the bigger font choices!! Can we fix
  // it!"). Two more invariants, measured on the rendered lesson:
  //   8. THE STRIP RHYTHM IS 127's — no green strip carries more than
  //      SECTION_RHYTHM.maxRefs chips (L128 had 141 in one), and no block of
  //      prose runs longer than SECTION_RHYTHM.maxLines lines before its strip
  //      (L1 had one after every line). Read from the strip's own
  //      data-block-lines, which LessonProse stamps from the real block.
  //   9. THE CHROME STAYS A FRAME AT BIG PRINT — the lesson-space bar's buttons
  //      (ALL LESSONS / PREV / NEXT) and every text-size chip on the page stay
  //      under 64px tall with the root at 2.75x (un-capped they measured ~100px
  //      and ~132px). Loaded once more at 360px with Big Print seeded.
  // Selftest: 10 chips injected into a strip + data-block-lines forced to 7
  // (normal), and the bar's zoom cap removed with a 7rem floor (Big Print) —
  // all three MUST trip.
  const RHYTHM = { maxLines: 6, maxRefs: 9 }; // = SECTION_RHYTHM (ChurchLearn.jsx); pinned by lesson-127-is-the-standard.test.jsx
  const CHROME_MAX_PX = 64;
  // THE WAY OUT IS NEVER A LITTLE BITTY BUTTON (DR-0450). The cap above keeps
  // chrome from ballooning; nothing kept it from SHRINKING back to the 10px
  // label in a 1px outline that Darrell could not find on his phone
  // (2026-09-16: "There's a little bitty button to get back to all... Make it
  // obvious"). A ceiling without a floor is half a guarantee, so the lesson's
  // way-out carries both: a real touch target and a legible word, measured in
  // the browser at phone width.
  const WAY_OUT_MIN_PX = 44;
  const WAY_OUT_MIN_FONT_PX = 12;
  //  10. THE TEXT DOMINATES AND THE CONTROLS NEVER GET BIGGER (Darrell
  //      2026-09-16, phone screenshots at A++/A+++, DR-0438): on the lesson at
  //      360px the chrome that covers the first viewport (header, lesson bar,
  //      the fixed comfort bar, the floaters — a union of their bands) is
  //      bounded at Normal, and at Big Print it is NO LARGER than at Normal
  //      (+12px of rounding). Measured before the fix: 443px at Normal, 749px
  //      (89% of 844) at Big Print; after: 443 / 422.
  //  11. NO FLOATER SITS ON THE FIXED COMFORT BAR at Big Print — the reading
  //      pill, back-to-top, Feedback and Give step above it (--ts-hatch-h).
  // The Normal budget is a RATCHET: it holds today's measurement and only
  // moves down (the phone header's own "only what is necessary" decision is
  // the pending DR-0438 re-review).
  const CHROME_BUDGET_360_NORMAL_PX = 460;
  // Rounding allowance for the never-bigger comparison: the union is built
  // from five or six bands each rounded to a pixel, and the comfort row wraps
  // on web-font metrics. Measured 2026-09-16: 441 vs 445 in the sandbox, 442
  // vs 456 on one runner that measured before the fonts had settled (the
  // sibling run on the same commit read 442 vs 450). The pass now waits for
  // document.fonts.ready and a settle before it measures, and allows 12px.
  const NEVER_BIGGER_ALLOWANCE_PX = 12;
  const coveredNormal360 = { open: null, collapsed: null };
  // THE COLLAPSED CASE IS NOT OPTIONAL (added 2026-09-19, DR-0524). Every
  // earlier run of this pass loaded with the header EXPANDED, and the header is
  // position:sticky — so five text-size controls stayed on screen mid-lesson
  // and the pass would have reported comfort as reachable. With the top bar
  // TUCKED AWAY, which is the state Darrell's screenshot shows and the state
  // the hideaway exists to produce, the count was ZERO. Measuring only the
  // state that works is the instrument blindness this file's textscale pass was
  // already written about; the same law applies here.
  const LESSON_CASES = SELFTEST
    ? [{ width: 360, size: 'normal', collapsed: true }, { width: 360, size: 'bigprint' }]
    : (SWEEP
      ? [...WIDTHS.map((width) => ({ width, size: 'normal' })), { width: 360, size: 'normal', collapsed: true }, { width: 360, size: 'bigprint' }, { width: 360, size: 'bigprint', collapsed: true }]
      : []);
  const LESSON_URL = `${origin}${BASE}/?view=church&sub=learn&course=living-lessons&lesson=ll1-the-perfect-yahweh-expects`;
  lessonFailuresBefore = failures;
  for (const { width, size, collapsed = false } of LESSON_CASES) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    // The first-visit tour is chrome, not the lesson; a returning reader has seen it.
    await page.addInitScript((cfg) => {
      try {
        localStorage.setItem('poetech.help.tour.v1', 'seen');
        if (cfg.sz === 'bigprint') localStorage.setItem('poe-text-size', 'bigprint'); else localStorage.removeItem('poe-text-size');
        // The header hideaway's own per-device key (lib/header-hideaway.js).
        if (cfg.collapsed) localStorage.setItem('poe-header-collapsed', '1'); else localStorage.removeItem('poe-header-collapsed');
      } catch { /* private mode */ }
    }, { sz: size, collapsed });
    await page.goto(LESSON_URL, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
    await page.waitForSelector('[data-testid="lesson-space-bar"]', { timeout: 20000 }).catch(() => {});
    // Step the arc to TEACH, where the lesson body lives — the stage rail's own
    // button. Scoped to the rail and matched loosely on purpose: the built
    // button's textContent is "📖Teach7m" (icon + title + minutes, no spaces),
    // so a word-boundary match finds nothing and the pass measures nothing.
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('[aria-label="Lesson stages"] button')].find((x) => /teach/i.test(x.textContent || ''));
      if (b) b.click();
    });
    await page.waitForSelector('[data-para-index], [data-point-index]', { timeout: 20000 }).catch(() => {});
    // Fonts first, then a settle: the chrome bands wrap on the real web-font
    // metrics, and a measurement taken on the fallback face reads differently.
    await page.evaluate(() => (document.fonts && document.fonts.ready ? document.fonts.ready : null)).catch(() => {});
    await page.evaluate(() => new Promise((r) => setTimeout(r, 300)));
    if (SELFTEST && size === 'normal') {
      await page.addStyleTag({ content: '[data-para-index], [data-point-index] { max-width: 60% !important }' });
      await page.evaluate(() => {
        const p = document.querySelector('[data-para-index], [data-point-index]');
        if (p) { const b = document.createElement('button'); b.textContent = 'Genesis 17:1'; p.appendChild(b); }
        const strip = document.querySelector('[data-testid="section-refs"]');
        if (strip) {
          for (let i = 0; i < 10; i += 1) { const b = document.createElement('button'); b.textContent = `Psalm ${i + 1}:1`; strip.appendChild(b); }
          strip.setAttribute('data-block-lines', '7');
        }
      });
      await page.evaluate(() => new Promise((r) => setTimeout(r, 100)));
    }
    if (SELFTEST && size === 'bigprint') {
      // The pre-fix balloon, reproduced: the cap removed and the rem floor back.
      // And DR-0438's two: every chrome region back to the raw root scale (the
      // controls grow with the text) and the comfort-bar height un-published
      // (the floaters land on the bar) — both MUST trip.
      await page.addStyleTag({ content: '[data-testid="lesson-space-bar"] { zoom: 1 !important } [data-testid="lesson-space-bar"] button { min-height: 7rem !important } .ts-chrome-region { zoom: 1 !important } :root { --ts-hatch-h: 0px !important }' });
      await page.evaluate(() => new Promise((r) => setTimeout(r, 100)));
    }
    const m = await page.evaluate(() => {
      const main = document.querySelector('main');
      const paras = [...document.querySelectorAll('[data-para-index], [data-point-index]')];
      if (!main || !paras.length) return { none: true, paras: paras.length };
      const cs = getComputedStyle(main);
      const mr = main.getBoundingClientRect();
      const contentLeft = mr.left + parseFloat(cs.paddingLeft);
      const contentRight = mr.right - parseFloat(cs.paddingRight);
      const pr = paras[0].getBoundingClientRect();
      const strips = [...document.querySelectorAll('[data-testid="section-refs"]')];
      const tall = (sel) => Math.max(0, ...[...document.querySelectorAll(sel)].map((b) => Math.round(b.getBoundingClientRect().height)));
      // Invariants 10 + 11: the chrome bands that cover the first viewport.
      const vh = window.innerHeight;
      const hdr = document.querySelector('header');
      const bar = document.querySelector('[data-testid="lesson-space-bar"]');
      const hatch = document.querySelector('.ts-escape-hatch');
      const floaters = [document.querySelector('.tts-controls'), document.querySelector('button[aria-label="Open feedback"]'), document.querySelector('.church-give-floater')].filter(Boolean);
      const bands = [];
      for (const el of [hdr, bar, hatch, ...floaters]) {
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.height <= 0) continue;
        bands.push([Math.max(0, r.top), Math.min(vh, r.bottom)]);
      }
      bands.sort((a, b) => a[0] - b[0]);
      let covered = 0; let cur = null;
      for (const [t, b] of bands) { if (b <= t) continue; if (!cur || t > cur[1]) { if (cur) covered += cur[1] - cur[0]; cur = [t, b]; } else cur[1] = Math.max(cur[1], b); }
      if (cur) covered += cur[1] - cur[0];
      const hatchFixed = !!hatch && getComputedStyle(hatch).position === 'fixed';
      const hr = hatch ? hatch.getBoundingClientRect() : null;
      const onTheBar = hatchFixed ? floaters.filter((f) => { const r = f.getBoundingClientRect(); return r.height > 0 && !(r.right <= hr.left || hr.right <= r.left || r.bottom <= hr.top || hr.bottom <= r.top); }).map((f) => (f.getAttribute('aria-label') || f.className || '?').toString().slice(0, 20)) : [];
      return {
        size: document.documentElement.getAttribute('data-text-size'),
        vh,
        covered: Math.round(covered),
        onTheBar,
        paras: paras.length,
        prose: Math.round(pr.width),
        content: Math.round(contentRight - contentLeft),
        gapLeft: Math.round(pr.left - contentLeft),
        gapRight: Math.round(contentRight - pr.right),
        inside: paras.reduce((n, p) => n + p.querySelectorAll('button, a').length, 0),
        strips: strips.length,
        maxChips: Math.max(0, ...strips.map((s) => s.querySelectorAll('button').length)),
        maxBlockLines: Math.max(0, ...strips.map((s) => parseInt(s.getAttribute('data-block-lines') || '0', 10))),
        barButtonPx: tall('[data-testid="lesson-space-bar"] button'),
        chipPx: tall('button[aria-label*="text size" i]'),
        // The way back to ALL: its own box and its own word size (DR-0450).
        wayOut: (() => {
          const b = document.querySelector('[data-testid="lesson-bar-all"]');
          if (!b) return null;
          const r = b.getBoundingClientRect();
          return {
            h: Math.round(r.height),
            w: Math.round(r.width),
            font: Math.round(parseFloat(getComputedStyle(b).fontSize) * 10) / 10,
            filled: getComputedStyle(b).backgroundColor.replace(/\s/g, '') === 'rgb(26,24,21)',
            says: /all/i.test(b.textContent || ''),
          };
        })(),
      };
    });

    // -------------------------------------------------------------------------
    // CAN THE READER STILL CHANGE HOW IT LOOKS, MID-LESSON? (DR-0524)
    // -------------------------------------------------------------------------
    // Darrell, 2026-09-19, reading L179 on his phone: "Can't change the text
    // side nor etc on o cellphone reader fix it." He was right, and THIS
    // instrument had never looked: the textscale pass below loads the app at
    // page top with the header on screen, and never opens a lesson. Its own
    // law -- a state the user can reach is a state the probe must load in --
    // was written about exactly this class and had not been applied here.
    //
    // The state measured now is the one he was actually in: a lesson open,
    // SCROLLED INTO THE WORDS, with the reading panel open -- and, in the
    // collapsed cases below, with the top bar tucked away, which is what his
    // screenshot shows and where the count was ZERO. (The header itself is
    // position:sticky, so with the bar OPEN the controls never left the screen;
    // measuring only that state is what hid this for so long.) A text-size
    // control must be on screen, and so must a theme swatch -- reading at night
    // is when a person reaches for Midnight.
    if (SELFTEST && size === 'normal') {
      // The break: the reader's own comfort row removed, which is precisely
      // the state this pass exists to refuse. The header is already scrolled
      // away by the scroll below, so this leaves genuinely nothing reachable.
      await page.addStyleTag({ content: '[data-testid="reader-look-and-feel"] { display: none !important }' });
    }
    await page.evaluate(() => window.scrollTo(0, Math.max(900, Math.round(document.documentElement.scrollHeight * 0.4))));
    await page.evaluate(() => new Promise((r) => setTimeout(r, 200)));
    // Open the reading panel the way a reader does — by tapping the floater.
    await page.evaluate(() => {
      const fab = [...document.querySelectorAll('button')]
        .find((b) => /read-aloud controls/i.test(b.getAttribute('aria-label') || ''));
      if (fab) fab.click();
    });
    await page.evaluate(() => new Promise((r) => setTimeout(r, 250)));
    const comfort = await page.evaluate(() => {
      const vw = window.innerWidth, vh = window.innerHeight;
      const onScreen = (b) => {
        const r = b.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.top >= 0 && r.left >= 0 && r.bottom <= vh && r.right <= vw;
      };
      const pick = (re) => [...document.querySelectorAll('button')]
        .filter((b) => re.test(b.getAttribute('aria-label') || ''));
      const sizes = pick(/text size/i);
      const themes = pick(/ theme/i);
      return {
        scrollY: Math.round(window.scrollY),
        panelOpen: !!document.querySelector('[data-testid="reader-look-and-feel"]'),
        sizeCount: sizes.length,
        sizeReachable: sizes.filter(onScreen).length,
        themeCount: themes.length,
        themeReachable: themes.filter(onScreen).length,
        // The instrument names WHERE, not just "none" (instrument-blindness law).
        rects: sizes.slice(0, 5).map((b) => {
          const r = b.getBoundingClientRect();
          return `${(b.getAttribute('aria-label') || '?').slice(0, 12)}@t${Math.round(r.top)},b${Math.round(r.bottom)}`;
        }),
        vh,
      };
    });
    await page.close();
    const where = `lesson@${width}px${size === 'bigprint' ? ' [Big Print]' : ''}${collapsed ? ' [header collapsed]' : ''}`;
    if (m.none) { fail(`${where}: the lesson prose never rendered (${m.paras} paragraphs) — nothing was measured`); continue; }
    if (size === 'bigprint' && m.size !== 'bigprint') { fail(`${where}: data-text-size="${m.size}" — Big Print never applied, nothing was measured`); continue; }
    const before = failures;
    lessonMeasured += 1;
    if (m.gapLeft > 2 || m.gapRight > 2) fail(`${where}: the prose column stops short of the page — ${m.prose}px of ${m.content}px content width (left gap ${m.gapLeft}px, right gap ${m.gapRight}px)`);
    if (m.inside > 0) fail(`${where}: ${m.inside} control(s) boxed inside the lesson prose — the reference belongs at the foot of its section, not in the sentence`);
    if (m.maxChips > RHYTHM.maxRefs) fail(`${where}: a green strip carries ${m.maxChips} chips — lesson 127's rhythm is at most ${RHYTHM.maxRefs} per strip (a wall of chips is a computer list)`);
    if (m.maxBlockLines > RHYTHM.maxLines) fail(`${where}: a block of ${m.maxBlockLines} lines waits for one strip — lesson 127's rhythm is at most ${RHYTHM.maxLines} lines before the Word`);
    if (!m.wayOut) fail(`${where}: the lesson bar has no way back to ALL — the reader is shut in (data-testid="lesson-bar-all")`);
    else {
      if (!m.wayOut.says) fail(`${where}: the way out does not say ALL — it reads "${m.wayOut.text || ''}"`);
      if (!m.wayOut.filled) fail(`${where}: the way out is an outline, not the bar's primary control — a hairline button is the one Darrell could not find`);
      if (size === 'normal') {
        if (m.wayOut.h < WAY_OUT_MIN_PX) fail(`${where}: the way back to ALL is ${m.wayOut.h}px tall — under the ${WAY_OUT_MIN_PX}px touch floor (DR-0450)`);
        if (m.wayOut.font < WAY_OUT_MIN_FONT_PX) fail(`${where}: the way back to ALL is set at ${m.wayOut.font}px — under the ${WAY_OUT_MIN_FONT_PX}px legibility floor (DR-0450)`);
      }
    }
    // MID-LESSON COMFORT (DR-0524) — the reader is scrolled into the words and
    // the header is gone; the reading panel must carry the way to change both.
    if (!comfort.scrollY) fail(`${where}: the page never scrolled — the mid-lesson state was not measured`);
    else if (!comfort.sizeCount) fail(`${where}: scrolled into the lesson, NO text-size control exists anywhere — the reader cannot change the words' size while reading (panel open: ${comfort.panelOpen})`);
    else if (!comfort.sizeReachable) fail(`${where}: scrolled into the lesson, ${comfort.sizeCount} text-size control(s) exist but none is on screen — viewport ${comfort.vh}px, controls: ${comfort.rects.join(' ')}`);
    else if (!comfort.themeReachable) fail(`${where}: scrolled into the lesson, no theme swatch on screen (${comfort.themeCount} exist) — a night reader cannot reach Midnight`);
    if (size === 'bigprint') {
      if (m.barButtonPx > CHROME_MAX_PX) fail(`${where}: the lesson bar's buttons are ${m.barButtonPx}px tall — the frame ballooned with the text (cap: ${CHROME_MAX_PX}px)`);
      if (m.chipPx > CHROME_MAX_PX) fail(`${where}: a text-size chip is ${m.chipPx}px tall — the control compounds with its own setting (cap: ${CHROME_MAX_PX}px)`);
    }
    if (width === 360) {
      // THE BASELINE IS PER HEADER STATE (2026-09-19). The never-bigger
      // invariant compares Big Print chrome against the SAME page at Normal.
      // Adding the collapsed cases with one shared baseline would have measured
      // Big-Print-expanded against Normal-COLLAPSED — a smaller number, so the
      // check would have failed for a reason that is not a defect. Keyed by
      // header state, each comparison is like-for-like.
      const key = collapsed ? 'collapsed' : 'open';
      if (size === 'normal') {
        coveredNormal360[key] = m.covered;
        if (m.covered > CHROME_BUDGET_360_NORMAL_PX) fail(`${where}: chrome covers ${m.covered}px of the ${m.vh}px first viewport — over the ${CHROME_BUDGET_360_NORMAL_PX}px budget; the text must dominate a phone`);
      } else if (size === 'bigprint') {
        const base = coveredNormal360[key];
        if (base == null) fail(`${where}: no Normal measurement in the same header state to compare against — the never-bigger invariant was not checked`);
        else if (m.covered > base + NEVER_BIGGER_ALLOWANCE_PX) fail(`${where}: chrome covers ${m.covered}px at Big Print vs ${base}px at Normal — the controls got bigger with the text`);
        if (m.onTheBar.length) fail(`${where}: ${m.onTheBar.length} floater(s) sit on the fixed comfort bar: ${m.onTheBar.join(', ')}`);
      }
    }
    if (failures === before) console.log(`lesson ok  ${where} — chrome covers ${m.covered}px of ${m.vh}px, prose ${m.prose}px of ${m.content}px, ${m.strips} strips (max ${m.maxChips} chips, max ${m.maxBlockLines} lines/block)${size === 'bigprint' ? `, bar buttons ${m.barButtonPx}px, chips ${m.chipPx}px` : ''}, nothing boxed in a sentence; mid-lesson at y${comfort.scrollY}: ${comfort.sizeReachable}/${comfort.sizeCount} size + ${comfort.themeReachable}/${comfort.themeCount} theme controls on screen`);
  }
  // ---------------------------------------------------------------------------
  // TEXT-SCALE pass — the layout is measured AT Big Print, not assumed to hold.
  // Rides --sweep (real assertions) and --selftest-break (proves it can fail),
  // so ci.yml needs no new step. localStorage is seeded before boot exactly the
  // way a returning reader's device is; initTextSize applies it pre-paint.
  // ---------------------------------------------------------------------------
  const TS_VIEWS = SWEEP
    ? [
        { name: 'church', path: '/?view=church' },
        { name: 'library', path: '/?view=library' },
        { name: 'tlc-door', path: '/?tlc=1' },
        { name: 'moore-door', path: '/?moore=1' },
      ]
    : SELFTEST
      ? [{ name: 'tlc-door', path: '/?tlc=1' }]
      : [];
  const TS_WIDTHS = SELFTEST ? [360] : [360, 768];
  // BOTH header states (added 2026-08-30, Darrell at Big Print on his phone:
  // "large font block the ability to change it afterwards after selecting it").
  // The header hideaway unmounts the whole comfort-controls row — text size
  // included — so a reader who tucked the top bar away had NO size control in
  // the DOM at all. Every earlier run of this pass loaded with the header
  // EXPANDED, so the trap was invisible to the instrument that exists to catch
  // exactly this. Measured before the fix: collapsed+bigprint@360 = 0 controls
  // rendered. A state the user can reach is a state the probe must load in.
  const TS_HEADER_STATES = SELFTEST ? [false] : [false, true];
  tsFailuresBefore = failures;
  for (const v of TS_VIEWS) for (const width of TS_WIDTHS) for (const collapsed of TS_HEADER_STATES) {
    const page = await browser.newPage({ viewport: { width, height: 740 } });
    await page.addInitScript((hideHeader) => {
      try {
        localStorage.setItem('poe-text-size', 'bigprint');
        // The header hideaway's own per-device key (lib/header-hideaway.js).
        if (hideHeader) localStorage.setItem('poe-header-collapsed', '1');
        else localStorage.removeItem('poe-header-collapsed');
      } catch { /* private mode */ }
    }, collapsed);
    await page.goto(`${origin}${BASE}${v.path}`, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
    await page.waitForSelector('button', { timeout: 20000 }).catch(() => {});
    if (SELFTEST) {
      // The trap, reproduced deliberately: the comfort controls are shoved a
      // full 3 viewports down (the ballooned-header failure) and the body is
      // forced wider than the phone (the card-grid blowout). Both new
      // invariants MUST trip or the pass is theater.
      // The break must also DEFEAT the protection (2026-09-10): the door's
      // comfort row now carries .ts-escape-hatch, which pins it to the viewport
      // at Big Print (index.css), so a margin alone no longer moves it — the
      // app is immune to that failure by construction. The self-test proves
      // the INSTRUMENT can see a lost control, so it un-pins the row first.
      await page.addStyleTag({ content: '[aria-label="Comfort controls"] { position: static !important; margin-top: 300vh !important } body::after { content: ""; display: block; width: 3000px; height: 2px }' });
      await page.evaluate(() => new Promise((r) => setTimeout(r, 100)));
    }
    const m = await page.evaluate(() => {
      const doc = document.documentElement;
      const vw = window.innerWidth, vh = window.innerHeight;
      // A phone's collapsed row carries the sizes as ONE dropdown (2026-09-24,
      // "a drop down with all options"); the five buttons are the 640px-and-up
      // form. Either is a way out of big text, so both count — and neither
      // on screen is still the failure.
      const hatch = [...document.querySelectorAll('button, select')]
        .filter((b) => /text size/i.test(b.getAttribute('aria-label') || ''));
      const reachable = hatch.some((b) => {
        const r = b.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.top >= 0 && r.left >= 0 && r.bottom <= vh && r.right <= vw;
      });
      // The instrument names WHERE (instrument-blindness law): a bare "none is
      // on screen" forced a blind bisect on 2026-08-16 — the fail line now
      // carries each control's rect + the header's height so the failing run
      // itself says which edge lost the control and by how many pixels.
      const hdr = document.querySelector('header');
      return {
        size: doc.getAttribute('data-text-size'),
        scrollWidth: doc.scrollWidth,
        clientWidth: doc.clientWidth,
        hatchCount: hatch.length,
        reachable,
        vh,
        vw,
        headerH: hdr ? Math.round(hdr.getBoundingClientRect().height) : null,
        rects: hatch.slice(0, 6).map((b) => {
          const r = b.getBoundingClientRect();
          // Ancestry flags (2026-08-19, instrument-blindness law round 2): the
          // identical-rects run could not say WHERE the controls live, so a
          // sticky fix was aimed at the wrong element. h=inside <header>,
          // s=inside .ts-safe-sticky, e=inside .ts-escape-hatch, then the
          // escape-hatch row's computed position (did the CSS engage at all).
          const eh = b.closest('.ts-escape-hatch');
          const flags = `${b.closest('header') ? 'h' : '-'}${b.closest('.ts-safe-sticky') ? 's' : '-'}${eh ? 'e' : '-'}${eh ? ':' + getComputedStyle(eh).position : ''}`;
          return `${(b.getAttribute('aria-label') || '?').slice(0, 14)}[${flags}]@t${Math.round(r.top)},l${Math.round(r.left)},b${Math.round(r.bottom)},r${Math.round(r.right)}`;
        }),
      };
    });
    await page.close();
    const where = `${v.name}@${width}px${collapsed ? ' [header collapsed]' : ''}`;
    if (m.size !== 'bigprint') { fail(`textscale ${where}: data-text-size="${m.size}" — Big Print never applied, nothing was measured`); continue; }
    const before = failures;
    tsMeasured += 1;
    if (m.scrollWidth > m.clientWidth + 1) fail(`textscale ${where}: page overflows horizontally at Big Print (${m.scrollWidth} > ${m.clientWidth})`);
    if (!m.hatchCount) fail(`textscale ${where}: no text-size control rendered — no way out of big text`);
    else if (!m.reachable) fail(`textscale ${where}: text-size controls exist but none is on screen — reader trapped in big text (viewport ${m.vw}x${m.vh}, header ${m.headerH}px tall, controls: ${m.rects.join(' ')})`);
    if (failures === before) console.log(`textscale ok  ${where} — Big Print holds, escape hatch on screen (${m.hatchCount} controls)`);
  }
  // ---------------------------------------------------------------------------
  // THE FIRESTICK pass (DR-0655). Darrell 2026-09-25: "Will this work with the
  // Firestick still?" and "All new features too?", then "We want the voice on
  // too... can it read?!" He reads on a Fire TV Stick in Silk with a D-pad.
  // The page is loaded the way that stick meets it: a Silk user agent, a
  // 960x540 CSS viewport at DPR 2 (Amazon's Fire TV web-app display), a
  // speechSynthesis that reports NO voices, no microphone, and the NAS voice
  // behind its family-key lock (stubbed above; the family RPC answers the key).
  // Driven with the arrow keys and Enter only. Invariants:
  //  19. THE DOCUMENT KNOWS IT IS A TV (html[data-device="tv"]).
  //  20. THE LESSON READS ALOUD WITH SOUND: "Read this lesson" sends the key
  //      to /voice-lite and a real clip plays, with no device voice at all.
  //  21. THE D-PAD REACHES THE READER AND EVERY MINI-PLAYER CONTROL, and each
  //      shows a focus ring at least 3px wide at 3:1 against what is behind it.
  //  22. ENTER WORKS: the mini-player's pause pauses the voice.
  //  23. NO PAGE OVERFLOW at 960 wide.
  // Self-test, two cases so each break is seen on its own: the family key
  // withheld (401, silence); then, with the voice playing, the TV mark
  // removed (the ring falls to 2px) and every arrow swallowed inside the
  // mini-player (a trap). All MUST trip.
  // ---------------------------------------------------------------------------
  const TV_CASES = SELFTEST
    ? [{ key: false, breakMark: false, trap: false }, { key: true, breakMark: true, trap: true }]
    : [{ key: true, breakMark: false, trap: false }];
  const tvBeforeAll = failures;
  for (const tvCase of TV_CASES) {
    const TV_UA = 'Mozilla/5.0 (Linux; Android 9; AFTKA Build/PS7633) AppleWebKit/537.36 (KHTML, like Gecko) Silk/118.3.1 like Chrome/118.0.5993.144 Safari/537.36';
    const tvBefore = failures;
    const ctx = await browser.newContext({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 2, userAgent: TV_UA });
    await ctx.route('https://test-stub.supabase.co/**', (route) => {
      const u = route.request().url();
      if (u.includes('/rpc/get_family_bridge_token')) return route.fulfill({ status: 200, contentType: 'application/json', body: tvCase.key ? JSON.stringify(TV_KEY) : 'null' });
      if (u.includes('/auth/')) return route.fulfill({ status: 401, contentType: 'application/json', body: '{}' });
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });
    await ctx.addInitScript(() => {
      try { localStorage.setItem('poetech.help.tour.v1', 'seen'); } catch (_) { /* private mode */ }
      if (window.speechSynthesis) { window.speechSynthesis.getVoices = () => []; window.speechSynthesis.speak = () => {}; }
      if (navigator.mediaDevices) {
        navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException('Requested device not found', 'NotFoundError'));
        navigator.mediaDevices.enumerateDevices = () => Promise.resolve([]);
      }
      window.__voiceClip = null;
      const play = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function tvPlay() {
        const p = play.call(this);
        if (String(this.src || '').startsWith('blob:')) { const el = this; p.then(() => { window.__voiceClip = el; }, () => {}); }
        return p;
      };
    });
    const page = await ctx.newPage();
    const tv = (msg) => fail(`tv@960x540: ${msg}`);
    // A person with a remote: press toward the control; the other axis when
    // nothing moves. Returns the number of presses, or -1.
    const dpadTo = async (sel, max = 45) => {
      for (let i = 0; i < max; i += 1) {
        const st = await page.evaluate((q) => {
          const t = document.querySelector(q);
          if (!t) return { none: true };
          const a = document.activeElement;
          if (a && a !== document.body && (a === t || t.contains(a))) return { at: true };
          const tr = t.getBoundingClientRect();
          const ar = a && a !== document.body ? a.getBoundingClientRect() : null;
          return { dx: tr.left + tr.width / 2 - (ar ? ar.left + ar.width / 2 : 0), dy: tr.top + tr.height / 2 - (ar ? ar.top + ar.height / 2 : 0), none: false, fresh: !ar };
        }, sel);
        if (st.none) return -1;
        if (st.at) return i;
        const v = st.dy > 0 ? 'ArrowDown' : 'ArrowUp'; const h = st.dx > 0 ? 'ArrowRight' : 'ArrowLeft';
        const order = st.fresh ? ['ArrowDown'] : (Math.abs(st.dy) < 12 ? [h, v] : (Math.abs(st.dy) >= Math.abs(st.dx) ? [v, h] : [h, v]));
        let moved = false;
        for (const k of order) {
          const was = await page.evaluate(() => { const a = document.activeElement; return a ? (a.dataset.tvp || (a.dataset.tvp = String(Math.random()))) : ''; });
          await page.keyboard.press(k);
          await page.waitForTimeout(40);
          const now = await page.evaluate(() => { const a = document.activeElement; return a ? a.dataset.tvp || '' : ''; });
          if (now !== was) { moved = true; break; }
        }
        if (!moved) return -1;
      }
      return -1;
    };
    const ringOf = () => page.evaluate(() => {
      const a = document.activeElement;
      if (!a || a === document.body) return null;
      const cs = getComputedStyle(a);
      const rgb = (c) => (c.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
      const lum = (c) => { const [r, g, b] = rgb(c).map((v) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
      let bg = 'rgb(255, 255, 255)';
      for (let e = a.parentElement; e; e = e.parentElement) {
        const c = getComputedStyle(e).backgroundColor;
        if (c && !/rgba\(0, 0, 0, 0\)|transparent/.test(c) && !(c.startsWith('rgba') && Number(c.split(',')[3]) < 0.5)) { bg = c; break; }
      }
      const l1 = lum(cs.outlineColor); const l2 = lum(bg);
      return { width: cs.outlineStyle === 'none' ? 0 : parseFloat(cs.outlineWidth), contrast: Math.round(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)) * 100) / 100 };
    });
    try {
      await page.goto(`${origin}${BASE}/?view=church&sub=learn&course=living-lessons&lesson=ll1-the-perfect-yahweh-expects`, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
      await page.waitForSelector('[data-testid="lesson-space-bar"]', { timeout: 20000 }).catch(() => {});
      await page.waitForTimeout(400);
      if (tvCase.breakMark) await page.evaluate(() => document.documentElement.removeAttribute('data-device'));
      if (tvCase.trap) {
        await page.evaluate(() => {
          // A trap: every arrow inside the mini-player is swallowed.
          document.addEventListener('keydown', (e) => { if (e.target && e.target.closest && e.target.closest('[data-testid="reader-mini-bar"]') && /^Arrow/.test(e.key)) { e.preventDefault(); e.stopImmediatePropagation(); } }, true);
        });
      }
      const marked = await page.evaluate(() => document.documentElement.getAttribute('data-device') === 'tv');
      if (!marked) tv('the document is not marked as a TV (html[data-device="tv"]); a Fire TV is 960 wide, so nothing keyed to width can know');
      const ov = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (ov > 1) tv(`the lesson page overflows horizontally by ${ov}px`);
      const toFab = await dpadTo('button[aria-label*="read-aloud controls"]', 60);
      if (toFab < 0) tv('the D-pad never reached the reader (🔊) from the top of the lesson');
      else {
        await page.keyboard.press('Enter');
        await page.waitForTimeout(300);
        await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /start to finish/.test(x.textContent || '')); if (b) b.setAttribute('data-tv-read', '1'); });
        const toRead = await dpadTo('[data-tv-read]', 40);
        if (toRead < 0) tv('Enter on the reader did not open a reachable "Read this lesson" control');
        else {
          voiceLiteLog.length = 0;
          await page.keyboard.press('Enter');
          await page.waitForTimeout(2500);
          const clip = await page.evaluate(() => !!window.__voiceClip && !window.__voiceClip.paused);
          const keyed = voiceLiteLog.filter((l) => l.keyed).length;
          if (!clip) tv(`"Read this lesson" made no sound: ${voiceLiteLog.length} /voice-lite request(s), ${keyed} with the family key, no clip playing (the device has no voices)`);
          // Into the mini-player: hide the panel (it keeps reading), then every control.
          // The panel is either the full card (× Close) or, once reading, the
          // minimized bar (×, "Hide reading controls"); either one keeps reading.
          await page.evaluate(() => {
            const b = document.querySelector('button[aria-label="Hide reading controls — keeps reading"]')
              || [...document.querySelectorAll('button')].find((x) => /Close/.test(x.textContent || '') && /keeps going|Close/.test(x.getAttribute('title') || ''));
            if (b) b.setAttribute('data-tv-hide', '1');
          });
          const toHide = await dpadTo('[data-tv-hide]', 60);
          if (toHide >= 0) { await page.keyboard.press('Enter'); await page.waitForTimeout(300); }
          const hasMini = await page.$('[data-testid="reader-mini-bar"]');
          if (!hasMini) tv(`no mini-player after hiding the panel while reading (the hide control ${toHide < 0 ? 'was not reached by the D-pad' : 'was pressed'}; reading: ${clip})`);
          else {
            for (const id of ['reader-show-text', 'reader-mini-back', 'reader-mini-playpause', 'reader-mini-forward']) {
              const n = await dpadTo(`[data-testid="${id}"]`, 30);
              if (n < 0) { tv(`the D-pad cannot reach the mini-player's ${id}`); continue; }
              const rg = await ringOf();
              if (!rg || rg.width < 3) tv(`the focus ring on ${id} is ${rg ? rg.width : 0}px — under 3px, thin across a room`);
              else if (rg.contrast < 3) tv(`the focus ring on ${id} is ${rg.contrast}:1 against its background — under 3:1`);
            }
            if (clip && (await dpadTo('[data-testid="reader-mini-playpause"]', 10)) >= 0) {
              await page.keyboard.press('Enter');
              await page.waitForTimeout(300);
              const paused = await page.evaluate(() => !!window.__voiceClip && window.__voiceClip.paused);
              if (!paused) tv('Enter on the mini-player pause did not pause the voice');
            }
          }
          if (failures === tvBefore) console.log(`tv ok  960x540 DPR2, Silk, no device voices — reader in ${toFab} presses, NAS voice playing (${keyed} keyed request(s)), mini-player reachable with a 3px+ ring at 3:1+, Enter pauses`);
        }
      }
      tvMeasured += 1;
    } finally {
      await ctx.close();
    }
  }
  tvTripped = failures - tvBeforeAll;
} finally {
  // ---------------------------------------------------------------------------
  // THE PRESENTER IS CHROME TOO (DR-0451). It was the largest surface in the
  // app the probe had never visited: no view, no selector, no budget — so the
  // one rule that would have caught Darrell's report ("the controls are taking
  // over the screen real-estate", 2026-09-17) had nothing to measure. The bar
  // now carries a testid and a cap; this measures both, in the browser, at the
  // width he was holding.
  // ---------------------------------------------------------------------------
  const PRESENTER_BAR_MAX_PX = 160;
  const DECK_URL = `${origin}${BASE}/?view=church&sub=learn&course=living-lessons&lesson=ll1-the-perfect-yahweh-expects`;
  for (const size of ['normal', 'bigprint']) {
    const page = await browser.newPage({ viewport: { width: 360, height: 900 } });
    await page.addInitScript((sz) => {
      try {
        localStorage.setItem('poetech.help.tour.v1', 'seen');
        if (sz === 'bigprint') localStorage.setItem('poe-text-size', 'bigprint'); else localStorage.removeItem('poe-text-size');
      } catch { /* private mode */ }
    }, size);
    await page.goto(DECK_URL, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
    await page.waitForSelector('[data-testid="lesson-space-bar"]', { timeout: 20000 }).catch(() => {});
    // Open the series deck the way a reader does — the overview play control.
    const opened = await page.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find((x) => /play the overview/i.test(x.textContent || ''));
      if (!b) return false;
      b.click();
      return true;
    });
    if (!opened) { await page.close(); fail(`presenter@360px${size === 'bigprint' ? ' [Big Print]' : ''}: no way into the deck was found on the lesson page`); continue; }
    await page.waitForSelector('[data-testid="present-setup-bar"]', { timeout: 20000 }).catch(() => {});
    await page.evaluate(() => (document.fonts && document.fonts.ready ? document.fonts.ready : null)).catch(() => {});
    await page.evaluate(() => new Promise((r) => setTimeout(r, 400)));
    if (SELFTEST) {
      // The pre-fix bar, reproduced: the cap removed and every control always on.
      await page.addStyleTag({ content: '[data-testid="present-setup-bar"] { zoom: 1 !important } [data-testid="present-setup-bar"] button { min-height: 6rem !important }' });
      await page.evaluate(() => new Promise((r) => setTimeout(r, 150)));
    }
    const pm = await page.evaluate(() => {
      const bar = document.querySelector('[data-testid="present-setup-bar"]');
      if (!bar) return { none: true };
      const r = bar.getBoundingClientRect();
      const hasJump = !!document.querySelector('[data-testid="present-setup-jump"]');
      const more = document.querySelector('[data-testid="present-setup-bar-more"]');
      return {
        h: Math.round(r.height),
        vh: window.innerHeight,
        capped: bar.classList.contains('ts-chrome-region'),
        safeSticky: bar.classList.contains('ts-safe-sticky'),
        foldable: !!more,
        hasJump,
        size: document.documentElement.getAttribute('data-text-size') || 'normal',
      };
    });
    await page.close();
    const pwhere = `presenter@360px${size === 'bigprint' ? ' [Big Print]' : ''}`;
    if (pm.none) { fail(`${pwhere}: the presenting bar never rendered — nothing was measured`); continue; }
    if (size === 'bigprint' && pm.size !== 'bigprint') { fail(`${pwhere}: data-text-size="${pm.size}" — Big Print never applied, nothing was measured`); continue; }
    const pbefore = failures;
    presenterMeasured += 1;
    if (!pm.capped) fail(`${pwhere}: the presenting bar is not in .ts-chrome-region — the controls grow with the text (DR-0438 §1)`);
    if (!pm.safeSticky) fail(`${pwhere}: the presenting bar is not .ts-safe-sticky — a sticky header may never exceed the viewport (DR-0276 rule 2)`);
    if (!pm.foldable) fail(`${pwhere}: the presenting bar has no More control — every control is always on, which is what took the screen`);
    if (!pm.hasJump) fail(`${pwhere}: the deck offers no way to reach one part directly — stepping is the only route`);
    if (pm.h > PRESENTER_BAR_MAX_PX) fail(`${pwhere}: the presenting bar is ${pm.h}px of the ${pm.vh}px viewport — over the ${PRESENTER_BAR_MAX_PX}px budget; the slide must dominate the screen`);
    if (failures === pbefore) console.log(`presenter ok  ${pwhere} — bar ${pm.h}px of ${pm.vh}px, capped, safe-sticky, foldable, one-tap jump present`);
  }
  if (presenterMeasured !== 2) fail(`coverage: ${presenterMeasured}/2 presenter cases measured`);
  if (tvMeasured !== (SELFTEST ? 2 : 1)) fail(`coverage: ${tvMeasured}/${SELFTEST ? 2 : 1} Firestick (TV) cases measured`);

  await browser.close();


  server.close();
}

if (SELFTEST) {
  // BOTH passes must prove they can fail: the chrome pass's collapse AND the
  // text-scale pass's trap + blowout (>=2 textscale trips: overflow, hatch).
  // And the lesson pass's width-short + boxed-control break (>=2 lesson trips).
  const tsTripped = failures - tsFailuresBefore - tvTripped;
  const lessonTripped = tsFailuresBefore - lessonFailuresBefore;
  const chromeTripped = lessonFailuresBefore;
  // The lesson pass now trips SEVEN ways: width-short, boxed control, a wall of
  // chips, an over-long block, the ballooned bar at Big Print, chrome that grew
  // with the text, and floaters on the comfort bar (DR-0438).
  // The TV pass trips three ways: the mark gone, the key withheld, the trap.
  if (failures > 0 && chromeTripped > 0 && lessonTripped >= 7 && tsTripped >= 2 && tvTripped >= 3) {
    console.log(`SELFTEST-BREAK OK — the probe CAN fail (${failures} tripped: ${chromeTripped} chrome, ${lessonTripped} lesson, ${tsTripped} textscale, ${tvTripped} tv)`);
    process.exit(0);
  }
  console.error(`SELFTEST-BREAK FAILED — a deliberate break tripped nothing (chrome: ${chromeTripped}, lesson: ${lessonTripped}, textscale: ${tsTripped}, tv: ${tvTripped}); the probe is theater`);
  process.exit(1);
}
// The coverage assertion. A short run is a FAILED run, however clean its
// verdicts: "nothing went wrong" is not the same claim as "everything was
// checked," and only this line can tell them apart.
const expectedChrome = VIEWS.length * WIDTHS.length;
// WIDTHS at Normal + the collapsed Normal case + Big Print + Big Print collapsed.
const expectedLesson = SWEEP ? WIDTHS.length + 3 : 0;
if (measured !== expectedChrome) {
  console.error(`COVERAGE FAIL — measured ${measured} of ${expectedChrome} view x width cases (${VIEWS.length} views x ${WIDTHS.length} widths). A run that skips its subjects is not a pass.`);
  failures += 1;
} else if (lessonMeasured !== expectedLesson) {
  console.error(`COVERAGE FAIL — measured ${lessonMeasured} of ${expectedLesson} lesson widths. A lesson that never rendered is not a pass.`);
  failures += 1;
} else {
  console.log(`coverage ok  ${measured}/${expectedChrome} chrome cases, ${lessonMeasured}/${expectedLesson} lesson cases, ${tsMeasured} text-scale cases measured.`);
}

process.exit(failures > 0 ? 1 : 0);

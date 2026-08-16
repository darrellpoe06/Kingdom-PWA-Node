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
// TEXT-SCALE pass (rides --sweep; added 2026-08-05 after the Big Print TLC
// screenshots — clipped cards, and a reader TRAPPED in big text because the
// door header outgrew the viewport and hid its own size controls): the same
// surfaces plus the TLC and Moore doors are loaded at Big Print 44 (2.75x,
// the top step) at phone/tablet widths and must hold two invariants:
//   4. NO PAGE OVERFLOW at Big Print — the layout holds, nothing clips.
//   5. THE ESCAPE HATCH IS REACHABLE — at least one text-size control is
//      fully on screen at load, so big text is always reversible.
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
import { strandedGutter } from './layout-rules.mjs';
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2).filter((a) => a !== '--selftest-break' && a !== '--sweep');
const SELFTEST = process.argv.includes('--selftest-break');
// --sweep probes the major surface families, not only the church door —
// dimension 4 is a SWEEP, one width on one view is not (DR-0239).
const SWEEP = process.argv.includes('--sweep');
const BASE = '/poetech-app';
const DIST = args[0] || fileURLToPath(new URL('../app/dist', import.meta.url));
const WIDTHS = [360, 768, 1440];
const VIEWS = SWEEP
  ? ['church', 'books', 'messages', 'about', 'crm', 'rentals', 'markets', 'library', 'games', 'admin']
  : ['church'];

if (!existsSync(join(DIST, 'index.html'))) {
  console.error(`chrome-layout-probe: no index.html in ${DIST} — build the app first (npm run build)`);
  process.exit(2);
}

/**
 * Wait for LAYOUT TO SETTLE before measuring — fonts, then two frames.
 *
 * Born 2026-08-16 from a FLAKY GATE, which is nearly as corrosive as a false
 * one: `textscale church@360px` and `library@360px` failed the escape-hatch
 * invariant on f7a7a30 and 33f1cd9 and PASSED on a3245b3 and 4104ef6 — same
 * code path, same widths, opposite verdicts. Cause: the pass measured straight
 * after `networkidle`, which does not wait for WEB FONTS. At Big Print (2.75x)
 * with Fraunces + JetBrains Mono, the fallback-to-webfont swap reflows the
 * header enough to push a control a few pixels below the fold, so the run's
 * verdict depended on whether the swap had landed yet.
 *
 * This does NOT weaken the invariant. "At least one text-size control is fully
 * on screen at load" is a claim about the layout a reader actually meets, not
 * about a transient mid-swap frame nobody sees. A control genuinely off-screen
 * after settling still fails — which is the point.
 */
async function settle(page) {
  await page.evaluate(async () => {
    try { await document.fonts.ready; } catch { /* no font API: fall through */ }
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  }).catch(() => {});
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

const launchOpts = process.env.PLAYWRIGHT_CHROMIUM_PATH
  ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
  : { channel: 'chrome' };
let browser;
try { browser = await chromium.launch(launchOpts); }
catch { browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }); }

let failures = 0;
let tsFailuresBefore = 0;
// Collected so the numbers land somewhere a human can actually READ them.
const measured = { gutters: [], slack: [] };
const fail = (msg) => { failures += 1; console.error(`LAYOUT FAIL  ${msg}`); };

try {
  for (const view of VIEWS) for (const width of WIDTHS) {
    const url = `${origin}${BASE}/?view=${view}`;
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
    await page.waitForSelector('header h1', { timeout: 20000 }).catch(() => {});
    await settle(page);
    if (SELFTEST) {
      // The pre-fix collapse, reproduced deliberately: the brand is forced to
      // wrap letter-per-line (white-space:normal at ~1ch width — the nowrap
      // was exactly why the first injection failed to trip, which the
      // anti-theater exit caught), and the first header control is pinned
      // over the name (the LOG OUT screenshot). Both invariants MUST trip.
      // The third injection is the STRANDED GUTTER (2026-08-16): reproduce
      // ChurchLearn's real defect — an uncentred width cap on the content —
      // so the new check is proven able to fail rather than assumed to be.
      await page.addStyleTag({ content: 'header h1 { max-width:14px !important; white-space:normal !important; overflow-wrap:anywhere !important } header button:first-of-type { position:absolute !important; left:0 !important; top:0 !important; transform:none !important } main, main > section { max-width:300px !important; margin-right:auto !important; margin-left:0 !important }' });
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
      // STRANDED GUTTER (added 2026-08-16). Overflow is only HALF the failure
      // space. The opposite defect — content that fits easily and abandons a
      // third of the screen — was invisible to every gate here, which is how
      // ChurchLearn shipped `max-w-3xl` with no `mx-auto`: a 768px column
      // pinned to the LEFT edge, dead space down the right, and every control
      // (Next → included) stranded in the left portion. Darrell found it on a
      // phone: "I don't like the empty space on the right ever!!!!???"
      //
      // Measure the main content band, not the page: where does real content
      // start and end horizontally? A CENTRED narrow column is fine (good
      // typography); a ONE-SIDED gutter is the defect. So compare the two
      // margins rather than the column width — that distinction is the whole
      // check, and it is why this does not punish `mx-auto` prose.
      const main = document.querySelector('main') || document.body;
      let left = Infinity, right = 0;
      for (const el of main.querySelectorAll('section, article, ul, ol, table, p, h1, h2, h3')) {
        const r = el.getBoundingClientRect();
        if (r.width < 40 || r.height < 8) continue;          // ignore slivers
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none') continue;
        left = Math.min(left, r.left);
        right = Math.max(right, r.right);
      }
      const vw = window.innerWidth;
      const gutters = Number.isFinite(left)
        ? { left: Math.round(Math.max(0, left)), right: Math.round(Math.max(0, vw - right)) }
        : null;
      return {
        scrollWidth: doc.scrollWidth,
        clientWidth: doc.clientWidth,
        vw,
        gutters,
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
    if (m.noHeader) { fail(`${view}@${width}px: header h1 never rendered`); continue; }
    if (m.scrollWidth > m.clientWidth + 1) fail(`${view}@${width}px: page overflows horizontally (${m.scrollWidth} > ${m.clientWidth})`);
    if (m.h1.w <= m.h1.h) fail(`${view}@${width}px: brand reads vertically — h1 "${m.h1.text}" is ${m.h1.w}x${m.h1.h}px (letter-stack collapse)`);
    if (m.overlaps.length) fail(`${view}@${width}px: controls overlap the name: ${m.overlaps.join(', ')}`);
    // A one-sided gutter, only where there is room for it to matter. Below
    // 900px a narrow column is normal; the defect is a wide screen abandoning
    // one side. Trips when the right gutter both exceeds a quarter of the
    // viewport AND is far larger than the left — i.e. uncentred, not `mx-auto`.
    if (m.gutters && strandedGutter({ ...m.gutters, vw: m.vw, width })) {
      const { left, right } = m.gutters;
      fail(`${view}@${width}px: content stranded to one side — ${right}px of dead space on the RIGHT vs ${left}px on the left (uncentred width cap)`);
    }
    if (m.gutters) measured.gutters.push(`${view}@${width}px ${m.gutters.left}/${m.gutters.right}px`);
    if (failures === before) console.log(`layout ok  ${view}@${width}px — h1 ${m.h1.w}x${m.h1.h}px, no overflow, no overlap${m.gutters ? `, gutters ${m.gutters.left}/${m.gutters.right}px` : ''}`);
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
  tsFailuresBefore = failures;
  for (const v of TS_VIEWS) for (const width of TS_WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: 740 } });
    await page.addInitScript(() => {
      try { localStorage.setItem('poe-text-size', 'bigprint'); } catch { /* private mode */ }
    });
    await page.goto(`${origin}${BASE}${v.path}`, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
    await page.waitForSelector('button', { timeout: 20000 }).catch(() => {});
    await settle(page);
    if (SELFTEST) {
      // The trap, reproduced deliberately: the comfort controls are shoved a
      // full 3 viewports down (the ballooned-header failure) and the body is
      // forced wider than the phone (the card-grid blowout). Both new
      // invariants MUST trip or the pass is theater.
      await page.addStyleTag({ content: '[aria-label="Comfort controls"] { margin-top: 300vh !important } body::after { content: ""; display: block; width: 3000px; height: 2px }' });
      await page.evaluate(() => new Promise((r) => setTimeout(r, 100)));
    }
    const m = await page.evaluate(() => {
      const doc = document.documentElement;
      const vw = window.innerWidth, vh = window.innerHeight;
      const hatch = [...document.querySelectorAll('button')]
        .filter((b) => /text size/i.test(b.getAttribute('aria-label') || ''));
      // REPORT THE GEOMETRY, not just the verdict (2026-08-16). This check
      // failed on church@360 and library@360 across several commits and
      // passed on others, and every diagnosis was a guess because the message
      // said only "none is on screen" — no rect, no viewport, no reason. A
      // gate that reports a verdict without its measurement cannot be
      // debugged by anyone who cannot reproduce the render, which is the
      // whole point of having it run in CI (DR-0076 §4: measure, don't claim).
      const rects = hatch.map((b) => {
        const r = b.getBoundingClientRect();
        const why = [];
        if (r.width <= 0 || r.height <= 0) why.push('zero-size');
        if (r.top < 0) why.push(`top ${Math.round(r.top)}<0`);
        if (r.left < 0) why.push(`left ${Math.round(r.left)}<0`);
        if (r.bottom > vh) why.push(`bottom ${Math.round(r.bottom)}>${vh}`);
        if (r.right > vw) why.push(`right ${Math.round(r.right)}>${vw}`);
        return {
          label: (b.getAttribute('aria-label') || '').slice(0, 28),
          box: `${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)}`,
          why: why.join(' '),
        };
      });
      const reachable = rects.some((x) => !x.why);
      // SLACK — how much room the best on-screen control actually has. A
      // PASS one pixel from the fold is not a pass anyone should trust: this
      // check has flipped 3-and-3 across six runs of the same code, which
      // means the control sits ON the boundary and the verdict is decided by
      // sub-pixel noise. Reporting the margin turns an invisible marginal
      // condition into a measured one, so a thin result reads as the finding
      // it is instead of a green tick (DR-0076 §4).
      const slack = rects.reduce((best, x, i) => {
        if (x.why) return best;
        const r = hatch[i].getBoundingClientRect();
        const m2 = Math.min(r.top, r.left, vh - r.bottom, vw - r.right);
        return best === null ? m2 : Math.min(best, m2);
      }, null);
      return {
        size: doc.getAttribute('data-text-size'),
        scrollWidth: doc.scrollWidth,
        clientWidth: doc.clientWidth,
        vw,
        vh,
        hatchCount: hatch.length,
        rects,
        reachable,
        slack,
      };
    });
    await page.close();
    if (m.size !== 'bigprint') { fail(`textscale ${v.name}@${width}px: data-text-size="${m.size}" — Big Print never applied, nothing was measured`); continue; }
    const before = failures;
    if (m.scrollWidth > m.clientWidth + 1) fail(`textscale ${v.name}@${width}px: page overflows horizontally at Big Print (${m.scrollWidth} > ${m.clientWidth})`);
    if (!m.hatchCount) fail(`textscale ${v.name}@${width}px: no text-size control rendered — no way out of big text`);
    else if (!m.reachable) {
      const detail = m.rects.map((x) => `${x.label || '?'} [${x.box}] ${x.why}`).join(' | ');
      fail(`textscale ${v.name}@${width}px: text-size controls exist but none is fully on screen — reader trapped in big text. viewport ${m.vw}x${m.vh}; controls: ${detail}`);
    }
    // A margin this thin is why the verdict has been a coin-flip. Warn loudly
    // (not a build failure — the reader IS able to escape) so the marginal
    // case is visible instead of hiding inside a green tick.
    if (failures === before && Number.isFinite(m.slack) && m.slack < 8) {
      console.log(`textscale MARGINAL  ${v.name}@${width}px — escape hatch clears the viewport by only ${Math.round(m.slack)}px; this is the flake boundary`);
    }
    measured.slack.push(`${v.name}@${width}px ${Number.isFinite(m.slack) ? `${Math.round(m.slack)}px` : (m.reachable ? '?' : 'TRAPPED')}`);
    if (failures === before) console.log(`textscale ok  ${v.name}@${width}px — Big Print holds, escape hatch on screen (${m.hatchCount} controls, slack ${Number.isFinite(m.slack) ? Math.round(m.slack) : '?'}px)`);
  }
} finally {
  await browser.close();
  server.close();
}

// THE NUMBERS MUST BE RETRIEVABLE (2026-08-16). The slack measurement added
// earlier printed only into the step's stdout — and the four steps that run
// after this one flood the log tail, so reading it back through the Actions
// API was impractical: five attempts failed to reach the block. A measurement
// nobody can retrieve is not a measurement (DR-0076 §4). The step summary is a
// separate, compact surface, the same one site-health and live-link-probe use.
if (process.env.GITHUB_STEP_SUMMARY) {
  const lines = ['## Chrome layout probe', '',
    `**Gutters** (left/right dead space; a one-sided gutter is the ChurchLearn defect class)`,
    '```', ...measured.gutters, '```', '',
    `**Big Print escape-hatch slack** (px the text-size control clears the viewport by; TRAPPED = unreachable)`,
    '```', ...measured.slack, '```', ''];
  try { writeFileSync(process.env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n`, { flag: 'a' }); } catch { /* summary is a convenience, never a failure */ }
}
if (SELFTEST) {
  // BOTH passes must prove they can fail: the chrome pass's collapse AND the
  // text-scale pass's trap + blowout (>=2 textscale trips: overflow, hatch).
  const tsTripped = failures - tsFailuresBefore;
  if (failures > 0 && tsFailuresBefore > 0 && tsTripped >= 2) {
    console.log(`SELFTEST-BREAK OK — the probe CAN fail (${failures} tripped: ${tsFailuresBefore} chrome, ${tsTripped} textscale)`);
    process.exit(0);
  }
  console.error(`SELFTEST-BREAK FAILED — a deliberate break tripped nothing (chrome: ${tsFailuresBefore}, textscale: ${failures - tsFailuresBefore}); the probe is theater`);
  process.exit(1);
}
process.exit(failures > 0 ? 1 : 0);

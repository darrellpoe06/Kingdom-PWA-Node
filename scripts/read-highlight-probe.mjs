// =============================================================================
// read-highlight-probe — the follow-along highlight is PAINTED, not just called
// =============================================================================
// The blind spot this closes (reported 2026-08-06, Darrell's phone: "the reader
// feature highlighted words are not occurring in the app"). DR-0264 and DR-0265
// both shipped the follow-along with unit pins and both deferred the proof to
// "the live witness" — which never ran. jsdom has no CSS Custom Highlight API,
// so read-follow.test.js could only ever exercise the UNSUPPORTED branch: it
// asserted the helpers no-op without crashing, and that is exactly what they
// did on real hardware too. Every pin was green while nothing highlighted on
// any device, on any read path, for the entire life of the feature.
//
// The defect itself was one missing default: setNamed(name, range, win) took no
// `win` fallback while supportsHighlight(win) had its own. Every call site omits
// the argument, so the support probe answered about the REAL window (true) and
// the paint then dereferenced `undefined`, throwing a TypeError straight into a
// bare catch that returned false. Silent, total, and invisible to the suite.
//
// So this probe asserts the thing the user actually cares about — that the words
// change color — in a real Chromium, through the REAL module, with the REAL CSS,
// using the EXACT call shape TTSControl makes (no window argument):
//   1. The browser exposes the CSS Custom Highlight API, and supportsHighlight() agrees.
//   2. highlightSegment(range) returns true and registers the sentence highlight.
//   3. The sentence highlight CHANGES PIXELS (screenshot diff, not a return value).
//   4. highlightWord(range) maps to the exact spoken word and CHANGES PIXELS.
//   5. clearReadingHighlights() restores the page pixel-identically.
//
// Pixels are the assertion on purpose: a return value can be true while the CSS
// never matches. Only a screenshot diff proves the reader SEES it.
//
// Proven-to-catch (DR-0076 §3, anti-theater): --selftest-break strips the `win`
// default back out of the bundled module — the exact shipped defect — and
// REQUIRES the paint checks to FAIL. A probe that cannot fail is a painted gate.
//
// Usage: node scripts/read-highlight-probe.mjs [--selftest-break]
// Requires playwright-core (CI installs it --no-save, as for the other probes);
// uses the runner's Chrome or PLAYWRIGHT_CHROMIUM_PATH.
// =============================================================================
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import { inflateSync } from 'node:zlib';
import { readFileSync, writeFileSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const APP = join(ROOT, 'app');
const SELFTEST = process.argv.includes('--selftest-break');

// The highlight rules are read from the SHIPPED stylesheet, never retyped — a
// probe carrying its own copy would pass while the app's real CSS was broken.
const indexCss = readFileSync(join(APP, 'src/index.css'), 'utf8');
// The THEMED rules ride along ("[data-theme=midnight] ::highlight(...)") —
// the 2026-09-15 defect lived exactly there (DR-0424).
const rules = (indexCss.match(/[^\n{}]*::highlight\((?:poe-read-seg|poe-read-word)\)\s*\{[^}]*\}/g) || []).join('\n');
if (!rules.includes('poe-read-seg') || !rules.includes('poe-read-word')) {
  console.error('FAIL  app/src/index.css defines no ::highlight(poe-read-seg/word) rules — the highlight can never paint.');
  process.exit(1);
}

// A minimal PNG reader for the magnitude check below (8-bit RGB/RGBA,
// non-interlaced — what Playwright's screenshots are). No dependency: a probe
// that needs a package fetched is a gate with a network in it.
function decodePng(buf) {
  let p = 8; const idat = []; let w = 0, h = 0, ct = 0;
  while (p < buf.length) {
    const len = buf.readUInt32BE(p); const type = buf.toString('ascii', p + 4, p + 8); const data = buf.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); ct = data[9]; } else if (type === 'IDAT') idat.push(data);
    p += 12 + len;
  }
  const bpp = ct === 6 ? 4 : 3; const raw = inflateSync(Buffer.concat(idat)); const stride = w * bpp; const out = Buffer.alloc(w * h * bpp);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)]; const src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const row = out.subarray(y * stride, (y + 1) * stride); const prev = y ? out.subarray((y - 1) * stride, y * stride) : null;
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? row[i - bpp] : 0, b = prev ? prev[i] : 0, c = (prev && i >= bpp) ? prev[i - bpp] : 0; let v = src[i];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c); }
      row[i] = v & 255;
    }
  }
  return { w, h, bpp, data: out };
}

const work = mkdtempSync(join(tmpdir(), 'read-highlight-'));
try {
  // Bundle the REAL module for the browser. React is stubbed because the
  // read-follow -> tts.js import chain pulls in the hook; only the pure
  // segmenter is exercised here.
  writeFileSync(join(work, 'react-stub.js'),
    'export const useState=()=>[],useMemo=()=>{},useEffect=()=>{},useRef=()=>({}),useCallback=()=>{};\n'
    + 'export default {useState,useMemo,useEffect,useRef,useCallback};\n');
  const bundlePath = join(work, 'rf.mjs');
  // The local binary, never `npx` — a bare npx on a runner may try to FETCH
  // esbuild, turning a gate into a network dependency.
  const esbuildBin = join(APP, 'node_modules/.bin/esbuild');
  if (!existsSync(esbuildBin)) {
    console.error(`FAIL  esbuild not found at ${esbuildBin} — run npm ci in app/ first.`);
    process.exit(1);
  }
  execFileSync(esbuildBin, ['src/lib/read-follow.js', '--bundle', '--format=esm',
    `--outfile=${bundlePath}`, `--alias:react=${join(work, 'react-stub.js')}`],
  { cwd: APP, stdio: ['ignore', 'ignore', 'inherit'] });

  let bundle = readFileSync(bundlePath, 'utf8');
  if (SELFTEST) {
    // Re-introduce the shipped defect: strip setNamed's `win` default so the
    // support probe and the paint read different windows.
    const before = bundle;
    bundle = bundle.replace(/function setNamed\(name, range, win = [^)]*\)/,
      'function setNamed(name, range, win)');
    if (bundle === before) {
      console.error('FAIL  --selftest-break could not find setNamed\'s win default to strip — the probe cannot prove it fails.');
      process.exit(1);
    }
  }
  bundle += '\nwindow.RF={buildFollowMap,segmentRange,wordRange,highlightSegment,highlightWord,clearReadingHighlights,supportsHighlight};window.__rfReady=1;';

  // Same launch strategy as chrome-layout-probe.mjs / sw-nav-check.mjs: the
  // runner's installed Chrome, or an explicit path, or the sandbox's Chromium.
  const launchOpts = process.env.PLAYWRIGHT_CHROMIUM_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH, headless: true }
    : { channel: 'chrome', headless: true };
  let browser;
  try { browser = await chromium.launch(launchOpts); }
  catch { browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }); }
  const page = await browser.newPage({ viewport: { width: 420, height: 320 } });
  await page.setContent(
    `<style>${rules}\nbody{background:#fff;font:20px/1.6 Georgia,serif;margin:0;padding:16px;}</style>`
    + '<main><p id="t">The Perfect You Were Made For. Two famous verses say be perfect.</p></main>');
  await page.addScriptTag({ content: bundle, type: 'module' });
  await page.waitForFunction('window.__rfReady===1');

  const results = [];
  const check = (name, pass, detail) => {
    results.push({ name, pass });
    console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  };

  check('the browser exposes the CSS Custom Highlight API',
    await page.evaluate('!!(window.CSS && CSS.highlights && typeof Highlight === "function")'));
  check('supportsHighlight() agrees with the browser',
    await page.evaluate('window.RF.supportsHighlight()'));

  const blank = await page.locator('#t').screenshot();

  // THE EXACT CALL SHAPE TTSControl MAKES — a range, and NO window argument.
  const seg = await page.evaluate(`(() => {
    const f = window.RF.buildFollowMap(document.querySelector('main'));
    const r = window.RF.segmentRange(f, 0);
    return { ok: window.RF.highlightSegment(r), size: CSS.highlights.size, text: r && r.toString() };
  })()`);
  check('highlightSegment(range) returns true', seg.ok === true, `returned ${seg.ok}`);
  check('the sentence highlight is registered', seg.size === 1, `CSS.highlights.size=${seg.size}`);
  check('the range covers sentence 0', /^The Perfect You Were Made For\.$/.test((seg.text || '').trim()), JSON.stringify(seg.text));

  const painted = await page.locator('#t').screenshot();
  check('THE SENTENCE HIGHLIGHT ACTUALLY PAINTS', !blank.equals(painted),
    blank.equals(painted) ? 'pixels identical — the reader sees nothing' : 'pixels changed');

  const word = await page.evaluate(`(() => {
    const f = window.RF.buildFollowMap(document.querySelector('main'));
    const at = f.segments[0].text.indexOf('Perfect');
    const r = window.RF.wordRange(f, 0, at);
    return { ok: window.RF.highlightWord(r), text: r && r.toString() };
  })()`);
  check('highlightWord(range) returns true', word.ok === true, `returned ${word.ok}`);
  check('the word range is exactly the spoken word', word.text === 'Perfect', JSON.stringify(word.text));
  const karaoke = await page.locator('#t').screenshot();
  check('THE WORD (KARAOKE) HIGHLIGHT ACTUALLY PAINTS', !painted.equals(karaoke),
    painted.equals(karaoke) ? 'pixels identical — the reader sees nothing' : 'pixels changed');

  await page.evaluate('window.RF.clearReadingHighlights()');
  check('clearing restores the page exactly', (await page.locator('#t').screenshot()).equals(blank),
    'pixel-compared against the pre-highlight page');

  // A PAGE WITH NO <main> STILL HIGHLIGHTS (DR-0304, 2026-08-14).
  //
  // Darrell: "this page just reads without a reader highlighting the words."
  // The text extractor fell back to document.body when a surface renders no
  // <main>; the follow map did not, so it was null and nothing could paint.
  // ONLY SIX FILES in this app render a <main> — every other surface was here.
  //
  // The unit pins prove the map is BUILT. Only this proves the words actually
  // change colour on such a page, in a real browser, with the real CSS — which
  // is the whole reason this probe exists (a return value can be true while the
  // CSS never matches).
  const noMain = await browser.newPage({ viewport: { width: 420, height: 320 } });
  await noMain.setContent(
    `<style>${rules}\nbody{background:#fff;font:20px/1.6 Georgia,serif;margin:0;padding:16px;}</style>`
    // Deliberately NO <main> — a div, which is what most surfaces render.
    + '<div><p id="t">The Perfect You Were Made For. Two famous verses say be perfect.</p></div>');
  await noMain.addScriptTag({ content: bundle, type: 'module' });
  await noMain.waitForFunction('window.__rfReady===1');

  const noMainBlank = await noMain.locator('#t').screenshot();
  const noMainSeg = await noMain.evaluate(`(() => {
    // readingRoot()'s rule, exercised where it matters: main || body.
    const root = document.querySelector('main') || document.body;
    const f = window.RF.buildFollowMap(root);
    if (!f) return { built: false };
    const r = window.RF.segmentRange(f, 0);
    return { built: true, ok: window.RF.highlightSegment(r), text: r && r.toString() };
  })()`);
  check('a page with NO <main> still builds a follow map', noMainSeg.built === true,
    noMainSeg.built ? 'built from document.body' : 'NULL MAP — the reader would speak and highlight nothing');
  check('the sentence range is right on a main-less page',
    /^The Perfect You Were Made For\.$/.test((noMainSeg.text || '').trim()), JSON.stringify(noMainSeg.text));
  const noMainPainted = await noMain.locator('#t').screenshot();
  check('THE HIGHLIGHT ACTUALLY PAINTS ON A PAGE WITH NO <main>', !noMainBlank.equals(noMainPainted),
    noMainBlank.equals(noMainPainted) ? 'pixels identical — this is the defect Darrell reported' : 'pixels changed');
  await noMain.close();

  // THE HIGHLIGHT IS VISIBLE ON THE DARK THEME TOO (2026-09-15, DR-0424).
  //
  // Darrell, on Midnight (OLED black): "The reader does not have the
  // highlighter of the sentence anymore... fix it." It DID paint — every
  // check above was green — but the one 22% rust wash, designed on cream,
  // blends on black to rgb(61,38,29) behind white text: a smudge. MEASURED
  // here: the sentence wash moved the paragraph's pixels by 3.95 on Midnight
  // against 6.05 on the light page. "Pixels changed" (the checks above) is
  // true of a smudge; a highlight the reader SEES needs a magnitude. So this
  // check holds the dark theme to NO FAINTER THAN the light one, by the same
  // mean-pixel-change measure on both — and the pre-fix CSS fails it
  // (3.95 < 0.9 x 6.05), which is what makes its green mean something.
  const meanChange = (a, b) => {
    const A = decodePng(a), B = decodePng(b);
    let sum = 0, n = 0;
    for (let i = 0; i < A.data.length; i++) { if (A.bpp === 4 && i % 4 === 3) continue; sum += Math.abs(A.data[i] - B.data[i]); n++; }
    return n ? sum / n : 0;
  };
  const lightChange = meanChange(blank, painted);
  const dark = await browser.newPage({ viewport: { width: 420, height: 320 } });
  await dark.setContent(
    `<!doctype html><html data-theme="midnight"><head><style>${rules}\nbody{background:#000;color:#E5E5E5;font:20px/1.6 Georgia,serif;margin:0;padding:16px;}</style></head>`
    + '<body><main><p id="t">The Perfect You Were Made For. Two famous verses say be perfect.</p></main></body></html>');
  await dark.addScriptTag({ content: bundle, type: 'module' });
  await dark.waitForFunction('window.__rfReady===1');
  const darkBlank = await dark.locator('#t').screenshot();
  await dark.evaluate('(() => { const f = window.RF.buildFollowMap(document.querySelector("main")); window.RF.highlightSegment(window.RF.segmentRange(f, 0)); })()');
  const darkPainted = await dark.locator('#t').screenshot();
  const darkChange = meanChange(darkBlank, darkPainted);
  check('THE SENTENCE HIGHLIGHT IS NO FAINTER ON MIDNIGHT THAN ON THE LIGHT THEME',
    darkChange >= 0.9 * lightChange && darkChange > 0,
    `mean pixel change midnight=${darkChange.toFixed(2)} light=${lightChange.toFixed(2)} (floor 0.9x light)`);
  await dark.close();

  await browser.close();

  const failed = results.filter((r) => !r.pass).length;
  const paintChecks = results.filter((r) => r.name.startsWith('THE '));
  console.log(`\n${results.length - failed}/${results.length} checks passed`);

  if (SELFTEST) {
    // Anti-theater: with the defect re-introduced the PAINT checks must fail.
    const paintedAnyway = paintChecks.filter((r) => r.pass).length;
    if (paintedAnyway) {
      console.error(`\nSELFTEST FAILED — ${paintedAnyway} paint check(s) still passed with the win-default defect re-introduced. This probe cannot catch the 2026-08-06 regression; do not trust its green.`);
      process.exit(1);
    }
    console.log('\nSELFTEST OK — the probe fails when the highlight does not paint. Its green means something.');
    process.exit(0);
  }

  process.exit(failed ? 1 : 0);
} finally {
  rmSync(work, { recursive: true, force: true });
}

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
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const APP = join(ROOT, 'app');
const SELFTEST = process.argv.includes('--selftest-break');

// The highlight rules are read from the SHIPPED stylesheet, never retyped — a
// probe carrying its own copy would pass while the app's real CSS was broken.
const indexCss = readFileSync(join(APP, 'src/index.css'), 'utf8');
const rules = (indexCss.match(/::highlight\((?:poe-read-seg|poe-read-word)\)\s*\{[^}]*\}/g) || []).join('\n');
if (!rules.includes('poe-read-seg') || !rules.includes('poe-read-word')) {
  console.error('FAIL  app/src/index.css defines no ::highlight(poe-read-seg/word) rules — the highlight can never paint.');
  process.exit(1);
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
  execFileSync('npx', ['esbuild', 'src/lib/read-follow.js', '--bundle', '--format=esm',
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

  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined,
    channel: process.env.PLAYWRIGHT_CHROMIUM_PATH ? undefined : 'chrome',
  }).catch(() => chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }));
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

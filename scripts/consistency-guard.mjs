// =============================================================================
// consistency-guard — deterministic shared-primitive drift gate (DR-0076 / DR-0079)
// =============================================================================
// Darrell, 2026-06-25: "we need consistency." Every same-day bug shared ONE root
// — no ENFORCED shared standard, so each surface drifted: device-font emoji that
// rendered as a tofu box on a phone (UiIcon exists to fix this), fixed-px text
// that ignored the global large-print control, per-tab width drift. The fix is
// not a slogan; it is a CHECK that fails the build. This is the consistency half
// of CONSISTENCY-STANDARD.md (color is already owned by contrast-guard.mjs; this
// guard never re-checks color — clean separation, no double-counting).
//
// It enforces two of the standard's shared primitives as machine checks, plus a
// tracked third:
//   1. ICONS — bundled inline SVG only (components/UiIcon.jsx). A device-font
//      EMOJI used as a UI glyph is the tofu mechanism: it renders only if the
//      VIEWER'S OS ships that glyph. HARD FAIL on any NEW emoji.
//   2. TEXT-SIZE — one global rem-based control (lib/text-size.js). A fixed-px
//      font size (text-[10px]) is absolute and does NOT scale with the large-
//      print primitive, so it stays tiny at A+++. HARD FAIL on any NEW text-[Npx].
//   3. LAYOUT — one full-width container; a per-surface max-w cap is drift. This
//      lane is owned by the full-width-layout conversion, so this is WARN-only
//      (tracked, never fails the build) until that primitive lands.
//
// THE RATCHET (why this can ship today against a huge legacy surface). A full
// sweep is impossible in one PR — main carries ~370 emoji + ~1200 fixed-px uses
// mid-conversion across many sibling sessions. So the gate FREEZES a per-file
// baseline (consistency-baseline.json): existing offenders are grandfathered and
// the count may only go DOWN; any file whose count EXCEEDS its baseline — and any
// NEW file (baseline 0) that introduces ANY — HARD FAILS. New drift fails fast;
// the standard is enforced going forward without boiling the ocean. As sibling
// lanes convert surfaces the live count falls below baseline (still green); the
// baseline is re-frozen lower over time so it can never silently regrow.
//
// $0, no browser, no LLM. Importable for vitest (proven-to-catch); also a CLI:
//   node scripts/consistency-guard.mjs                 # report + gate
//   node scripts/consistency-guard.mjs --generate      # re-freeze the baseline
// =============================================================================
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripCommentLines } from './large-print-guard.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'app/src');
const COMPONENTS_DIR = join(SRC, 'components');
const MONOLITH_REL = 'poe-financial-mvp-v28.jsx';
const BASELINE_PATH = join(ROOT, 'scripts/consistency-baseline.json');

// UiIcon.jsx is the canonical SVG primitive; its header comment legitimately
// NAMES the emoji it replaced (📓 → book, 🕊 → dove, ...). Scanning it would
// count documentation as drift, so it is exempt from the emoji check.
const EMOJI_EXEMPT = new Set(['UiIcon.jsx']);

// Pictographic emoji blocks ONLY — the device-font glyphs that fall back to tofu.
// Deliberately EXCLUDES arrows (U+2190–21FF), geometric shapes (U+25A0–25FF), and
// Dingbats (U+2700–27BF): "→", "○/◐", and "✓/✦" are typographic and render
// reliably cross-device, so banning them would punish legitimate copy and status
// glyphs. We target the blocks the tofu actually came from: Misc Symbols
// (⚠/⛪/☀, U+2600–26FF), Misc Symbols & Arrows stars (U+2B00–2BFF), the VS16
// emoji-presentation selector, and the astral pictograph planes (U+1F000–1FAFF)
// where every nav icon that boxed out on Darrell's phone (📓 🕊 🎛 🔒 📺) lives.
const EMOJI_RE = /[\u{2600}-\u{26FF}\u{2B00}-\u{2BFF}\u{FE0F}\u{1F000}-\u{1FAFF}]/gu;
// Tailwind fixed-PX font size: text-[10px], text-[13px], ... (NOT text-[0.8rem]).
const FIXED_PX_RE = /text-\[\d+(?:\.\d+)?px\]/g;
// Per-surface width cap: max-w-md, max-w-[640px], max-w-screen-lg, ...
const WIDTH_CAP_RE = /\bmax-w-(?:\[[^\]]+\]|[a-z0-9-]+)/g;

function countMatches(src, re) {
  const m = src.match(re);
  return m ? m.length : 0;
}

// Per-file counts for the three drift classes. emoji is 0 for exempt files.
// fixedPx counts CODE only: comment lines are stripped first (via the
// large-print guard's helper) so documentation that names the bug pattern
// (text-[10px] -> text-[0.625rem]) is never counted as drift — the same
// reasoning as the UiIcon emoji exemption, made general.
export function fileCounts(src, basename) {
  return {
    emoji: EMOJI_EXEMPT.has(basename) ? 0 : countMatches(src, EMOJI_RE),
    fixedPx: countMatches(stripCommentLines(src), FIXED_PX_RE),
    widthCap: countMatches(src, WIDTH_CAP_RE),
  };
}

// Pure ratchet: given live per-file counts and the frozen baseline, return the
// HARD violations — emoji, fixedPx, AND widthCap over baseline (or any in a new
// file). widthCap graduated from WARN to HARD on 2026-07-29 (DR-0246): the
// full-width sweep converted every app-tab container, so a NEW per-surface
// max-w is no longer "tracked drift" — it is the exact regression Darrell had
// to ask about twice (2026-07-24 ThinkingSpace, 2026-07-29 every tab), and the
// gate is what makes saying it once enough. Importable so a vitest can prove
// the ratchet catches a synthetic NEW offender with no FS.
export function ratchet(liveCounts, baseline) {
  const violations = [];
  const warnings = [];
  for (const [rel, live] of Object.entries(liveCounts)) {
    const base = baseline[rel] || { emoji: 0, fixedPx: 0, widthCap: 0 };
    if (live.emoji > base.emoji) {
      violations.push({ file: rel, kind: 'emoji-as-icon', live: live.emoji, baseline: base.emoji,
        fix: 'replace the device-font emoji with <UiIcon name="..."/> (components/UiIcon.jsx)' });
    }
    if (live.fixedPx > base.fixedPx) {
      violations.push({ file: rel, kind: 'fixed-px-font', live: live.fixedPx, baseline: base.fixedPx,
        fix: 'author the size in rem at the 16px baseline (text-[10px] -> text-[0.625rem]) so the global text-size control scales it' });
    }
    if (live.widthCap > base.widthCap) {
      violations.push({ file: rel, kind: 'width-cap', live: live.widthCap, baseline: base.widthCap,
        fix: 'tab content stretches the full width (CONSISTENCY-STANDARD rule 1, DR-0246); prose measure and modals live INSIDE the full-width container, never as the tab wrapper' });
    }
  }
  return { violations, warnings };
}

// Collect live per-file counts across the monolith + every component .jsx.
export function collectLiveCounts() {
  const counts = {};
  const monoPath = join(SRC, MONOLITH_REL);
  if (existsSync(monoPath)) counts[MONOLITH_REL] = fileCounts(readFileSync(monoPath, 'utf8'), MONOLITH_REL);
  let files = [];
  try { files = readdirSync(COMPONENTS_DIR).filter((f) => f.endsWith('.jsx')); } catch { /* no dir in some test envs */ }
  for (const f of files) {
    let src; try { src = readFileSync(join(COMPONENTS_DIR, f), 'utf8'); } catch { continue; }
    counts[`components/${f}`] = fileCounts(src, f);
  }
  return counts;
}

export function loadBaseline() {
  try { return JSON.parse(readFileSync(BASELINE_PATH, 'utf8')); } catch { return {}; }
}

export function scanConsistency() {
  const live = collectLiveCounts();
  const baseline = loadBaseline();
  const { violations, warnings } = ratchet(live, baseline);
  return { live, baseline, violations, warnings };
}

// --- CLI -------------------------------------------------------------------
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes('--generate')) {
    const live = collectLiveCounts();
    // Freeze ONLY files that currently carry drift — keep the baseline small and
    // readable; a file absent from the baseline defaults to {0,0,0} (new-file rule).
    const frozen = {};
    for (const [rel, c] of Object.entries(live)) {
      if (c.emoji || c.fixedPx || c.widthCap) frozen[rel] = c;
    }
    writeFileSync(BASELINE_PATH, JSON.stringify(frozen, null, 2) + '\n');
    const totals = Object.values(live).reduce((a, c) => ({ emoji: a.emoji + c.emoji, fixedPx: a.fixedPx + c.fixedPx, widthCap: a.widthCap + c.widthCap }), { emoji: 0, fixedPx: 0, widthCap: 0 });
    console.log(`consistency-guard: froze baseline for ${Object.keys(frozen).length} file(s) — ${totals.emoji} emoji, ${totals.fixedPx} fixed-px, ${totals.widthCap} width-cap grandfathered.`);
    process.exit(0);
  }
  const { violations, warnings } = scanConsistency();
  if (warnings.length) {
    console.log(`consistency-guard: ${warnings.length} width-cap WARNING(s) (tracked, not failing — full-width-layout lane):`);
    for (const w of warnings) console.log(`  ~ ${w.file}: ${w.kind} ${w.live} > baseline ${w.baseline}`);
    console.log('');
  }
  if (!violations.length) {
    console.log('consistency-guard: OK — no NEW emoji-as-icon and no NEW fixed-px font over the frozen baseline. Shared primitives hold.');
    process.exit(0);
  }
  console.error(`consistency-guard: ${violations.length} CONSISTENCY VIOLATION(S) (new drift over baseline):`);
  for (const v of violations) {
    console.error(`  - ${v.file}: ${v.kind} ${v.live} > baseline ${v.baseline}`);
    console.error(`      fix: ${v.fix}`);
  }
  process.exit(1);
}

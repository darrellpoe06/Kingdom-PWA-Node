// =============================================================================
// ui-standards-guard — the interface standards this codebase already keeps
// =============================================================================
// Darrell, 2026-08-28: "all these features need to be applied as we build
// without needing to keep saying it.... our standards are higher than this
// build... we have intuitive SaaS." Then: "build the rest of the UI standard
// set now."
//
// DR-0314 is the rule this implements: a standard that lives only in
// implementations is a coincidence. Each one below was MEASURED across the real
// component tree before it was written down — none of them is a preference of
// mine, and none was invented for this file.
//
//   focus-ring        2,817 uses across 152 of 218 files   → 326 gaps
//   touch-target      225 uses of min-h-[36px] in 74 files →  69 gaps
//   icon-label        every icon-only button already labelled →  0 gaps
//
// TWO SHAPES OF GATE, and the difference matters.
//
//   A RATCHET, where the standard is overwhelmingly kept but real debt exists.
//   The debt is frozen into a baseline and any NEW violation fails the build.
//   This is the legibility-guard pattern already proven in this repo: a hard
//   gate on 326 pre-existing gaps would be reverted within a day, and a
//   reverted gate protects nothing.
//
//   A HARD GATE, where the standard is already met everywhere. icon-label has
//   zero offenders, so it is locked at zero — the cheapest possible moment to
//   make a standard permanent is before the first regression.
//
// WHAT IS DELIBERATELY NOT HERE. Destructive actions confirming before they
// destroy is a real standard (66 confirm() guards across 35 files) and it is
// NOT gated: 37 of the 68 destructive buttons call a prop callback — onDelete,
// onRemove — whose confirm lives in a parent component. No static scan resolves
// that, and a guard reporting 37 false positives is how a guard gets deleted.
// It is written in UX-PATTERNS as a Way that a reviewer checks, which is the
// honest instrument for it. Saying so is better than a number that lies.
//
// A stable, LINE-INDEPENDENT signature keeps a baseline entry valid when the
// file above it is edited — the same discipline legibility-guard uses.
// =============================================================================
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative, sep, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const SRC = join(ROOT, 'app/src');
const BASELINE_PATH = join(ROOT, 'scripts/ui-standards-baseline.json');

export const MIN_TOUCH_PX = 36;

/** Every component file the standards govern, in a filesystem-independent order. */
export function listFiles(root = SRC) {
  const out = [];
  const walk = (dir) => {
    let entries = [];
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (e.name === '__tests__' || e.name === 'node_modules') continue;
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.jsx')) out.push(p);
    }
  };
  walk(root);
  return out.sort((a, b) => fileId(a).localeCompare(fileId(b)));
}

export const fileId = (abs) => relative(SRC, abs).split(sep).join('/');

// -----------------------------------------------------------------------------
// The three checks. Each is a pure function of source text so it is testable
// without a DOM, and each returns violations carrying their own explanation.
// -----------------------------------------------------------------------------

const BUTTON = /<button\b[^>]*>/gs;

/** A control a keyboard can reach must SHOW where it is. */
export function scanFocusRing(src, id) {
  const out = [];
  for (const m of src.matchAll(BUTTON)) {
    const tag = m[0];
    if (!tag.includes('className=')) continue;          // unstyled: not ours to judge
    if (/\bsr-only\b|\bhidden\b/.test(tag)) continue;    // not visible, cannot show a ring
    if (tag.includes('focus:outline') || tag.includes('focus-visible:')) continue;
    out.push({
      kind: 'focus-ring', file: id,
      detail: squash(tag),
      why: 'a keyboard user cannot see where they are; add focus:outline focus:outline-2',
    });
  }
  return out;
}

/** A target a thumb must hit is at least 36px tall. */
export function scanTouchTarget(src, id) {
  const out = [];
  for (const m of src.matchAll(/min-h-\[(\d+)px\]/g)) {
    const px = Number(m[1]);
    if (px >= MIN_TOUCH_PX) continue;
    out.push({
      kind: 'touch-target', file: id,
      detail: m[0],
      why: `${px}px is under the ${MIN_TOUCH_PX}px this app targets for a thumb`,
    });
  }
  return out;
}

/** A button whose whole label is a glyph says what it does to a screen reader. */
export function scanIconLabel(src, id) {
  const out = [];
  for (const m of src.matchAll(/<button\b([^>]*)>\s*([^<\s]{1,3})\s*<\/button>/g)) {
    const [, attrs, kid] = m;
    if (attrs.includes('aria-label')) continue;
    if (/^[\w]+$/.test(kid)) continue;                   // a real word is its own label
    out.push({
      kind: 'icon-label', file: id,
      detail: `<button>${kid}</button>`,
      why: 'a glyph is not a label; add aria-label',
    });
  }
  return out;
}

const squash = (s) => s.replace(/\s+/g, ' ').trim().slice(0, 120);

/** Line-independent, so a baseline entry survives edits above it. */
export const signature = (v) => `${v.kind}|${v.file}|${v.detail}`;

// A hard gate stays at zero; a ratchet freezes what exists and blocks growth.
export const HARD = new Set(['icon-label']);

export function scan(files = listFiles()) {
  const all = [];
  for (const abs of files) {
    const src = readFileSync(abs, 'utf8');
    const id = fileId(abs);
    all.push(...scanFocusRing(src, id), ...scanTouchTarget(src, id), ...scanIconLabel(src, id));
  }
  return all;
}

export function loadBaseline() {
  try { return JSON.parse(readFileSync(BASELINE_PATH, 'utf8')); }
  catch { return { version: 1, note: '', frozenAt: null, allowed: [] }; }
}

/**
 * Judge a scan against a baseline.
 *
 * NEW violations fail. Baselined ones are reported as debt and do not.
 * A hard-gated kind fails whether or not it is baselined — that is what makes
 * it hard.
 */
export function evaluate(violations, baseline = loadBaseline()) {
  const allowed = new Set(baseline.allowed || []);
  const regressions = violations.filter(
    (v) => HARD.has(v.kind) || !allowed.has(signature(v)),
  );
  const debt = violations.filter((v) => !HARD.has(v.kind) && allowed.has(signature(v)));
  // A baseline entry no longer produced is FIXED debt — worth knowing, never a
  // failure, and the number that should fall over time (DR-0075).
  const live = new Set(violations.map(signature));
  const healed = [...allowed].filter((s) => !live.has(s));
  return {
    ok: regressions.length === 0,
    regressions,
    debt,
    healed,
    summary: {
      scanned: violations.length,
      regressions: regressions.length,
      debt: debt.length,
      healed: healed.length,
    },
  };
}

export function writeBaseline(violations = scan()) {
  const baseline = {
    version: 1,
    note: 'Frozen UI-standard debt (DR-0314). New violations fail the build; these are the ones that existed when the standard was written down. This list may SHRINK, never grow.',
    frozenAt: new Date().toISOString().slice(0, 10),
    allowed: [...new Set(violations.filter((v) => !HARD.has(v.kind)).map(signature))].sort(),
  };
  writeFileSync(BASELINE_PATH, `${JSON.stringify(baseline, null, 2)}\n`);
  return baseline;
}

// --- CLI ---------------------------------------------------------------------
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv[2] === '--generate') {
    const b = writeBaseline();
    console.log(`# ui-standards-guard --generate\nFroze ${b.allowed.length} violation(s) into ${relative(ROOT, BASELINE_PATH)}.`);
    process.exit(0);
  }
  const v = scan();
  const r = evaluate(v);
  console.log('# UI STANDARDS GUARD (DR-0314)\n');
  console.log(`scanned ${r.summary.scanned} | regressions ${r.summary.regressions} | tracked debt ${r.summary.debt} | healed ${r.summary.healed}\n`);
  for (const x of r.regressions.slice(0, 40)) {
    console.log(`REGRESSION ${x.kind} · ${x.file}\n   ${x.detail}\n   ${x.why}\n`);
  }
  if (!existsSync(BASELINE_PATH)) console.log('(no baseline yet — run with --generate)');
  process.exit(r.ok ? 0 : 1);
}

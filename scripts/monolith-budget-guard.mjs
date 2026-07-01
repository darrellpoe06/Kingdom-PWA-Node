// =============================================================================
// monolith-budget-guard — the FORCING FUNCTION for the hybrid-modular freeze
// (DR-0078 cutover; DR-0076 verification doctrine; DR-0075 perpetual improvement)
// =============================================================================
// THE PROBLEM THIS CLOSES. Stage 1 of the hybrid-modular cutover landed the
// surface-mount registry (app/src/surfaces.js) and the structural boundary gate
// (scripts/module-boundary-guard.mjs). Those keep the registry CORE and stop a
// feature from re-tangling into the shell's import block. But neither caps the
// shell's SIZE. So after Stage 1 the monolith kept growing — measured: 8,769
// lines right after #335 (2026-06-25) -> 9,386 lines (2026-06-29), +617 lines
// of net-new feature code added straight into the shell while the extraction
// lane sat waiting. The plan had a spine but no brake. This is the brake.
//
// THE RULE IT ENFORCES (the freeze). The monolith is frozen to bug-fixes only.
// Its line count may only go DOWN. A PR that grows it past the frozen budget
// HARD-FAILS the build. Net-new features can no longer be added to the shell;
// they must ship as their own module (NEW-SURFACE-NEW-MODULE). Existing features
// leave the shell only via the protected extraction lane, which SHRINKS it and
// re-freezes the budget lower (the ratchet).
//
// THE RATCHET (DR-0075). `--generate` re-freezes the budget to the current line
// count, but ONLY ever DOWNWARD: it REFUSES to raise the ceiling. As the
// extraction lane peels sections out, the count falls and the budget is re-frozen
// lower, so the shell can never silently regrow back to where it was. The only
// way the budget rises is a human editing monolith-budget.json by hand with a
// stated reason in the PR — a deliberate, reviewed act, never the silent default.
// That is the whole point: growth becomes a visible decision, not the path of
// least resistance.
//
// $0, no browser, no LLM. Importable for vitest (proven-to-catch); also a CLI:
//   node scripts/monolith-budget-guard.mjs                 # report + gate
//   node scripts/monolith-budget-guard.mjs --generate      # re-freeze DOWN only
// =============================================================================
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MONOLITH_REL = 'app/src/poe-financial-mvp-v28.jsx';
const MONOLITH_PATH = join(ROOT, MONOLITH_REL);
const BUDGET_PATH = join(ROOT, 'scripts/monolith-budget.json');

// Count physical lines the way `wc -l` and the cutover report do: the number of
// newline-terminated lines. Pure, so a vitest can drive it with synthetic text.
export function countLines(src) {
  if (src === '') return 0;
  const m = src.match(/\n/g);
  // A trailing-newline-terminated file: newline count == line count.
  // A file without a final newline still has one more content line than newlines.
  return src.endsWith('\n') ? (m ? m.length : 0) : (m ? m.length + 1 : 1);
}

export function loadBudget() {
  try { return JSON.parse(readFileSync(BUDGET_PATH, 'utf8')); } catch { return null; }
}

export function liveLineCount() {
  if (!existsSync(MONOLITH_PATH)) return null;
  return countLines(readFileSync(MONOLITH_PATH, 'utf8'));
}

// Pure ratchet decision. Given the live count and the frozen budget, return the
// gate verdict. Importable so the proven-to-catch vitest can assert each branch
// with no filesystem.
//   ok=false, reason='over-budget'  -> live exceeds the frozen ceiling (FAIL)
//   ok=true,  reason='under-budget' -> live is below budget (extraction happened;
//                                       re-freeze lower with --generate)
//   ok=true,  reason='at-budget'    -> live equals budget (held the line)
export function evaluate(live, budget) {
  if (live > budget) {
    return { ok: false, reason: 'over-budget', live, budget, delta: live - budget };
  }
  if (live < budget) {
    return { ok: true, reason: 'under-budget', live, budget, delta: live - budget };
  }
  return { ok: true, reason: 'at-budget', live, budget, delta: 0 };
}

export function scan() {
  const budgetDoc = loadBudget();
  const live = liveLineCount();
  return { budgetDoc, live };
}

// --- CLI -------------------------------------------------------------------
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const live = liveLineCount();
  if (live === null) {
    // The monolith is gone. Either it was renamed (a bypass — fail loud and fix
    // the guard) or the cutover fully decomposed it (celebrate — but still update
    // the guard so it can't be a silent no-op). Either way: do not pass silently.
    console.error(`monolith-budget-guard: ${MONOLITH_REL} NOT FOUND.`);
    console.error('  If the shell was renamed, point this guard at the new path.');
    console.error('  If it was fully decomposed (Stage 5), retire this guard deliberately — do not let it pass vacuously.');
    process.exit(1);
  }

  if (process.argv.includes('--generate')) {
    const budgetDoc = loadBudget();
    const prior = budgetDoc ? budgetDoc.budget : Infinity;
    if (live > prior) {
      // The ratchet only turns DOWN. Refuse to legitimize growth via --generate.
      console.error(`monolith-budget-guard: REFUSING to raise the budget (${prior} -> ${live}).`);
      console.error('  The freeze ratchets DOWN only. The monolith grew; that is the thing the freeze exists to stop.');
      console.error('  Fix the growth (ship the new code as its own module), or — for a genuinely unavoidable bug-fix');
      console.error('  that nets a few lines — raise "budget" in scripts/monolith-budget.json BY HAND with a reason in the PR.');
      process.exit(1);
    }
    const next = {
      file: MONOLITH_REL,
      budget: live,
      frozen: budgetDoc && budgetDoc.frozen && live === prior ? budgetDoc.frozen : '(stamp the date in the PR)',
      note: 'Frozen ceiling for the hybrid-modular cutover. The monolith is bug-fixes only; this line count may only go DOWN. Re-freeze with `node scripts/monolith-budget-guard.mjs --generate` after an extraction shrinks it. To RAISE this number, edit by hand with a stated reason in the PR — --generate refuses to. See docs/00-foundations/HYBRID-MODULAR-IMPLEMENTATION-PLAN.md.',
    };
    writeFileSync(BUDGET_PATH, JSON.stringify(next, null, 2) + '\n');
    console.log(`monolith-budget-guard: re-froze budget at ${live} lines (was ${prior === Infinity ? 'unset' : prior}).`);
    process.exit(0);
  }

  const budgetDoc = loadBudget();
  if (!budgetDoc || typeof budgetDoc.budget !== 'number') {
    console.error('monolith-budget-guard: no budget frozen. Run `node scripts/monolith-budget-guard.mjs --generate` to set it.');
    process.exit(1);
  }
  const v = evaluate(live, budgetDoc.budget);
  if (!v.ok) {
    console.error(`monolith-budget-guard: MONOLITH GREW past the freeze.`);
    console.error(`  ${MONOLITH_REL}: ${v.live} lines > frozen budget ${v.budget} (+${v.delta}).`);
    console.error('  The shell is FROZEN to bug-fixes only (DR-0078 cutover). New features are not added here.');
    console.error('  Fix: ship the new capability as its own module (a components/*.jsx mounted via app/src/surfaces.js),');
    console.error('       not inline in the shell. If you extracted code and the count should fall, re-freeze with --generate.');
    console.error('       For a genuinely unavoidable bug-fix that nets a few lines, raise "budget" in');
    console.error('       scripts/monolith-budget.json by hand with a one-line reason in the PR.');
    process.exit(1);
  }
  if (v.reason === 'under-budget') {
    console.log(`monolith-budget-guard: OK — ${v.live} lines, ${-v.delta} UNDER the frozen budget ${v.budget}.`);
    console.log('  An extraction shrank the shell. Re-freeze the ratchet lower: node scripts/monolith-budget-guard.mjs --generate');
    process.exit(0);
  }
  console.log(`monolith-budget-guard: OK — ${v.live} lines, holding the frozen budget ${v.budget}. The shell did not grow.`);
  process.exit(0);
}

#!/usr/bin/env node
// =============================================================================
// lessons-gate-coverage — the meter that makes "failures become deterministic
// engineering" a MEASURED, ENFORCED number, not an assertion (DR-0239: "a miss
// that leaves no gate behind will recur"; DR-0076 §3: proven-to-catch).
// =============================================================================
// Darrell 2026-07-30: "are we updating and upgrading our procedures ... after
// failures[,] data driven information turn into deterministic engineering
// enhancements?" Until now that was TRUSTED — the LESSONS-LEARNED index held 37
// principles and the guard corpus held 26 scripts, but NOTHING checked that
// each lesson actually left a machine check behind. This closes that: every
// extracted principle (**P<n> —) must EITHER name a gate (a guard/test/probe/
// proven-to-catch citation) OR explicitly declare why no gate is possible (an
// unwritten-backlog / discipline-only class, stated as such). A principle that
// names NEITHER is an unguarded lesson — the exact recurrence risk DR-0239 warns
// of — and fails the build.
//
// PROVEN-TO-CATCH (DR-0076 §3): the unit test feeds a gate-less principle and
// REQUIRES a finding; a gated one and a justified discipline-only one pass.
// =============================================================================
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LESSONS = join(ROOT, 'docs/00-foundations/_root/LESSONS-LEARNED.md');

// A principle NAMES A GATE when its text cites a machine check.
const GATE_CITED = /\b(proven-to-catch|guarded by|\.test\.|[a-z]+-guard\b|[a-z]+-probe\b|sw-nav-check|asset-guard|chrome-layout|boot-check|CI gate|a (?:deterministic |required )?gate|the gate\b|test_[a-z]|verify-boot|his-hand-guard|parity[- ]guard|tenancy-guard|contrast|legibility)\b/i;
// A principle LAWFULLY has no gate when it declares the class as un-gateable and
// names the human/discipline control instead (P29/P28 class — an unwritten
// backlog no gate can see; the control is declaration-time discipline).
const NO_GATE_JUSTIFIED = /\b(no gate can|cannot be gated|un-gateable|checklist|the control is|declaration-time|ways-review question|the discipline|standing question|human control)\b/i;

// A principle is GATED if ANY line that mentions its id (the index one-liner OR
// an incident-body Fix/guarded line, which is where the gate citation actually
// lives) cites a gate or a why-no-gate. Reading only the terse index summary
// under-counts by construction — the gate is named in the incident body.
//
// A CROSS-REFERENCE IS NOT A CITATION (fixed 2026-08-14, DR-0303).
// Principles routinely end with "pairs with P31, P26, P15", and those lines
// also name their OWN gates. The plain line filter credited every principle
// named in such a line with the gate belonging to the principle that OWNS it —
// so writing P40 (which cites two test files and cross-refs P15) silently
// "healed" P15, which has gained no citation at all. That is precisely the
// painted number P38 was extracted to prevent: this meter exists to measure
// citation coverage honestly, and a meter that credits a neighbour's gate is
// lying in the direction that feels good.
//
// So a line that DECLARES some other principle (`**Pk —`) is that principle's
// line, and says nothing about anyone it merely mentions. Incident-body lines
// declare no principle and still count for everyone they name, which is where
// real Fix/guarded-by citations live.
function declaredIdOn(line) {
  const m = /\*\*(P\d+)\s*[—-]/.exec(line);
  return m ? m[1] : null;
}

// A `**Cross-refs:**` line is a SEE-ALSO list, by definition. It names DRs,
// sibling principles, and the artifacts of the incident it closes — so it will
// almost always match GATE_CITED, and it establishes a gate for nothing. Same
// false-heal as the neighbour-declaration case above, one line lower: this
// record's own Cross-refs named `feedback-list-carries-no-image-bytes.test.js`
// alongside P15, and P15 "healed" without gaining a citation.
const CROSS_REF_LINE = /^\s*\*\*Cross-refs:\*\*/;

export function findUnguardedPrinciples(text) {
  const lines = String(text || '').split('\n');
  const ids = [...new Set([...String(text || '').matchAll(/\*\*(P\d+)\s*[—-]/g)].map((m) => m[1]))];
  const out = [];
  for (const id of ids) {
    const re = new RegExp(`\\b${id}\\b`);
    const mentions = lines.filter((l) => re.test(l));
    const own = mentions.filter((l) => {
      if (CROSS_REF_LINE.test(l)) return false;
      const declared = declaredIdOn(l);
      return declared === null || declared === id;
    });
    const gated = own.some((l) => GATE_CITED.test(l) || NO_GATE_JUSTIFIED.test(l));
    if (!gated) {
      const idx = mentions.find((l) => new RegExp(`\\*\\*${id}\\s*[—-]`).test(l)) || mentions[0] || id;
      out.push({ id, text: idx.trim().slice(0, 140) });
    }
  }
  return out;
}

// Frozen 2026-07-30: principles whose gate EXISTS but is not yet CITED in the
// lesson text (e.g. P20→tenancy-guard, P10-12→brakes tests). This meter checks
// CITATION coverage — that each lesson names its machine check so coverage is
// auditable at a glance — NOT gate existence (not cleanly machine-checkable
// from prose). SHRINK-ONLY, like scripts/monolith-budget.json and the migration
// grandfather set: a NEW uncited principle fails; backfilling a citation removes
// its id here; the baseline may only get smaller. The forward discipline: every
// lesson added from now names its gate or its why-no-gate.
export const UNCITED_BASELINE = new Set([
  'P2', 'P4', 'P6', 'P8', 'P10', 'P11', 'P12', 'P13', 'P15', 'P16',
  'P17', 'P18', 'P20', 'P21', 'P24', 'P25', 'P30', 'P34', 'P35',
  // Re-frozen 2026-08-14 (DR-0303). These nine were ALWAYS uncited; the
  // detector could not see it, because it credited any line mentioning a
  // principle — including another principle's declaration line and
  // `**Cross-refs:**` see-also lists, both of which name gates belonging to
  // someone else. Tightening it (above) dropped the honest figure from the
  // 22/40 (55%) CI had been printing to 12/40 (30%).
  //
  // Expanding a shrink-only baseline needs saying plainly: this is NOT a
  // regression and NOT permission to stop citing. It is a measurement
  // correction — the same move P38 records when its own first version read
  // "19% coverage" off the terse index summaries and had to be rebuilt against
  // the real artifact. The forward discipline is unchanged and still bites: a
  // genuinely new uncited lesson fails the build, and every entry here shrinks
  // out the moment its own line names its check.
  'P3', 'P5', 'P7', 'P9', 'P19', 'P23', 'P26', 'P31', 'P36',
]);

export function coverage(text) {
  const ids = [...String(text || '').matchAll(/\*\*(P\d+)\s*[—-]/g)].map((m) => m[1]);
  const total = new Set(ids).size;
  const gaps = findUnguardedPrinciples(text);
  const fresh = gaps.filter((g) => !UNCITED_BASELINE.has(g.id));       // NEW gaps — fail
  const healed = [...UNCITED_BASELINE].filter((id) => !gaps.some((g) => g.id === id)); // now cited — shrink
  return { total, gated: total - gaps.length, gaps, fresh, healed };
}

function main() {
  if (!existsSync(LESSONS)) { console.log('lessons-gate-coverage: LESSONS-LEARNED.md not found — skipping.'); process.exit(0); }
  const text = readFileSync(LESSONS, 'utf8');
  const { total, gated, fresh, healed } = coverage(text);
  const pct = total ? Math.round((gated / total) * 100) : 100;
  console.log(`lessons-gate-coverage: ${gated}/${total} lessons cite their gate or a why-no-gate (${pct}%); ${UNCITED_BASELINE.size} grandfathered (gate exists, citation pending).`);
  const problems = [];
  for (const g of fresh) problems.push(`NEW uncited lesson ${g.id}: ${g.text}`);
  for (const id of healed) problems.push(`${id} now cites its gate — remove it from UNCITED_BASELINE (shrink-only).`);
  if (problems.length === 0) { console.log('OK — no new uncited lesson; the baseline holds (shrink-only).'); process.exit(0); }
  console.error('\nlessons-gate-coverage: FAIL —');
  for (const p of problems) console.error(`  ${p}`);
  console.error('\nEvery new lesson names its machine check (a guard/test/probe) or its why-no-gate (DR-0239).');
  process.exit(1);
}

if (process.argv[1] && process.argv[1].endsWith('lessons-gate-coverage.mjs')) main();

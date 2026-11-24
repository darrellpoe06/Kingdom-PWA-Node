// =============================================================================
// learn-presentation/scope: which lessons a SPENDING run may touch, and how
// much it may ever spend (the owner's pilot approval, 2026-11-24)
// =============================================================================
// Enforced in code, not only in the workflow form, so the pilot cannot be
// widened by a typo, a default, or a re-run:
//   - a spending command must name its lessons; an empty selection is refused;
//   - "all" (the full library) is DISABLED until the owner approves it, and
//     enabling it is a code change in review, never a flag;
//   - at most PILOT_MAX_LESSONS unique lessons, every one a real mounted
//     lesson; "seed" must be exactly the 20 approved pilot lessons;
//   - TOTAL_CAP_CENTS is the combined ceiling across every run, read from the
//     ledger's recorded spend (retries and failed attempts included).
// =============================================================================

import { readFileSync } from 'node:fs';

export const PILOT_MAX_LESSONS = 20;
export const TOTAL_CAP_CENTS = 500; // $5 combined, the owner's pilot approval
export const FULL_LIBRARY_ENABLED = false;

export class ScopeError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ScopeError';
  }
}

/** The pilot lessons named in presentation-seed.json, as course::lesson keys. */
export function seedKeys(seedPath) {
  const recs = JSON.parse(readFileSync(seedPath, 'utf8')).records || [];
  const keys = [...new Set(recs.map((r) => `${r.courseKey}::${r.lessonId}`))];
  if (keys.length !== PILOT_MAX_LESSONS || recs.length !== PILOT_MAX_LESSONS) {
    throw new ScopeError(`the pilot seed must hold exactly ${PILOT_MAX_LESSONS} unique lessons; it holds ${keys.length} unique of ${recs.length}`);
  }
  return keys;
}

/**
 * Resolve --only into the exact work items a spending command may run.
 * Throws ScopeError on anything that is not a small, explicit, real selection.
 */
export function resolveSpendingScope(only, items, { seedPath }) {
  const raw = only === true || only == null ? '' : String(only).trim();
  if (!raw) throw new ScopeError('a spending run must name its lessons: --only seed, or up to 20 lesson ids');
  if (raw.toLowerCase() === 'all') {
    if (!FULL_LIBRARY_ENABLED) throw new ScopeError('the full library is disabled until the owner approves it (FULL_LIBRARY_ENABLED in lib/scope.mjs)');
  }
  const wanted = raw === 'seed' ? seedKeys(seedPath) : [...new Set(raw.split(',').map((s) => s.trim()).filter(Boolean))];
  if (!wanted.length) throw new ScopeError('no lessons named');
  if (wanted.length > PILOT_MAX_LESSONS) throw new ScopeError(`at most ${PILOT_MAX_LESSONS} lessons per run; ${wanted.length} were named`);
  const picked = [];
  const missing = [];
  for (const w of wanted) {
    const hits = items.filter((it) => (w.includes('::') ? `${it.courseKey}::${it.lessonId}` === w : it.lessonId === w));
    if (hits.length === 1) picked.push(hits[0]);
    else if (hits.length > 1) throw new ScopeError(`"${w}" names ${hits.length} lessons; use course::lesson`);
    else missing.push(w);
  }
  if (missing.length) throw new ScopeError(`not mounted lessons: ${missing.join(', ')}`);
  const unique = new Map(picked.map((it) => [`${it.courseKey}::${it.lessonId}`, it]));
  if (unique.size > PILOT_MAX_LESSONS) throw new ScopeError(`at most ${PILOT_MAX_LESSONS} lessons per run`);
  return [...unique.values()];
}

/** What this stage may still spend: the smaller of its own cap and what is left of the combined total. */
export function remainingCents(stageCapCents, ledgerSpentCents, totalCapCents = TOTAL_CAP_CENTS) {
  const left = Math.max(0, totalCapCents - (Number(ledgerSpentCents) || 0));
  return stageCapCents == null ? left : Math.min(Number(stageCapCents), left);
}

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
// FULL LIBRARY APPROVED by the owner 2026-11-24 ("Redo HIST2 and PM2, then run the
// full library... we like these looks"), after the 20-lesson pilot on art v2.
// The pilot's $5 ceiling becomes the library's ceilings, still read from the ledger:
//   TOTAL_CAP_CENTS        every paid call, text + pictures, across every run;
//   IMAGE_TOTAL_CAP_CENTS  picture spend only (BFL), held under the owner's ~$70 of
//                          BFL credits so a run can never overdraw them.
// "all" runs in batches of LIBRARY_BATCH lessons (resumable; one run at a time).
export const TOTAL_CAP_CENTS = 9500;
export const IMAGE_TOTAL_CAP_CENTS = 6800;
export const FULL_LIBRARY_ENABLED = true;
export const LIBRARY_BATCH = 200;
export const IMAGE_KINDS = Object.freeze(['image', 'image-v2', 'topic-v2']);

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
    return [...new Map(items.map((it) => [`${it.courseKey}::${it.lessonId}`, it])).values()];
  }
  const wanted =
    raw === 'seed'
      ? seedKeys(seedPath)
      : [
          ...new Set(
            raw
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          ),
        ];
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

/** Picture spend so far (every image kind), read from the ledger. */
export function imageSpentCents(ledger) {
  let c = 0;
  for (const j of ledger.jobs.values()) {
    if (IMAGE_KINDS.includes(j.kind) || (j.kind === 'adjustment' && j.appliesTo === 'image')) c += Number(j.costCents) || 0;
  }
  return c;
}

/**
 * The next library batch: lessons not yet finished (no succeeded text AND image
 * job), in mounted order, at most `batch`. Finished lessons are never re-bought.
 */
export function nextLibraryBatch(items, ledger, batch = LIBRARY_BATCH) {
  const done = (it, kind) => {
    const j = ledger.latestFor(it.courseKey, it.lessonId, kind);
    // A picture flagged for review (e.g. near-duplicate) is paid and present, not remaining.
    const ok = kind === 'image' ? ['succeeded', 'needs-review'] : ['succeeded'];
    return !!j && ok.includes(j.state) && j.contentSha === it.contentSha;
  };
  return items.filter((it) => !(done(it, 'text') && done(it, 'image'))).slice(0, batch);
}

/** What this stage may still spend: the smaller of its own cap and what is left of the combined total. */
export function remainingCents(stageCapCents, ledgerSpentCents, totalCapCents = TOTAL_CAP_CENTS) {
  const left = Math.max(0, totalCapCents - (Number(ledgerSpentCents) || 0));
  return stageCapCents == null ? left : Math.min(Number(stageCapCents), left);
}

/**
 * The resolved scope as a Set holding both key forms (lessonId and
 * courseKey::lessonId). Pilot 1 crashed in compose because it used the raw
 * --only list (an array, which has no .has()); compose now uses this.
 */
export function scopeKeySet(items) {
  return new Set((items || []).flatMap((it) => [it.lessonId, `${it.courseKey}::${it.lessonId}`]));
}

// =============================================================================
// adjust — auditable corrections to the spend ledger, never a rewrite of it
// =============================================================================
// The ledger (state/jobs.jsonl) is append-only and is never reset (owner,
// 2026-11-23). When it is found to be wrong, the correction is a NEW row:
//   - written in git first, in ledger-adjustments.json (who/why/evidence, reviewed);
//   - applied to the ledger once, as its own row (kind 'adjustment', keyed by its
//     id), the next time any CLI command opens the ledger. Re-applying is a no-op.
// History stays intact: the original charged rows and the correction both remain,
// and the sum is the corrected spend.
// =============================================================================
import { readFileSync, existsSync } from 'node:fs';

const KINDS = Object.freeze(['image', 'text']);

/** Every problem with the adjustments file. Empty = safe to apply. */
export function validateAdjustments(list) {
  const problems = [];
  const seen = new Set();
  for (const a of Array.isArray(list) ? list : []) {
    const id = a && a.id;
    if (!id || !/^[a-z0-9][a-z0-9-]*$/.test(id)) problems.push(`adjustment id must be a slug: ${JSON.stringify(id)}`);
    if (seen.has(id)) problems.push(`duplicate adjustment id ${id}`);
    seen.add(id);
    if (!Number.isInteger(a.cents) || a.cents === 0 || Math.abs(a.cents) > 5000) problems.push(`${id}: cents must be a non-zero integer within ±5000`);
    if (!KINDS.includes(a.appliesTo)) problems.push(`${id}: appliesTo must be image or text`);
    if (!String(a.reason || '').trim()) problems.push(`${id}: a reason is required`);
    if (!String(a.evidence || '').trim()) problems.push(`${id}: evidence is required (a run id, a log count)`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(a.date || ''))) problems.push(`${id}: date must be YYYY-MM-DD`);
  }
  return problems;
}

export const adjustmentKey = (id) => `adjustment|${id}`;

/** Apply each adjustment not yet in the ledger. Returns the ids applied this call. */
export function applyAdjustments(ledger, list) {
  const problems = validateAdjustments(list);
  if (problems.length) throw new Error(`ledger adjustments refused: ${problems.join('; ')}`);
  const applied = [];
  for (const a of list || []) {
    const key = adjustmentKey(a.id);
    if (ledger.jobs.has(key)) continue;
    ledger.write({
      batchId: 'adjustment',
      courseKey: 'ledger',
      lessonId: a.id,
      kind: 'adjustment',
      appliesTo: a.appliesTo,
      contentSha: a.id,
      idempotencyKey: key,
      state: 'succeeded',
      attempts: 1,
      costCents: a.cents,
      leaseUntil: null,
      reason: a.reason,
      evidence: a.evidence,
      adjustmentDate: a.date,
    });
    applied.push(a.id);
  }
  return applied;
}

export function loadAdjustments(path) {
  if (!existsSync(path)) return [];
  const j = JSON.parse(readFileSync(path, 'utf8'));
  return Array.isArray(j.adjustments) ? j.adjustments : [];
}

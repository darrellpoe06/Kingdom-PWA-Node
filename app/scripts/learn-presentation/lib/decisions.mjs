// =============================================================================
// decisions — human-approved titles are authoritative (title-decisions.json)
// =============================================================================
// When a generated title is flagged needs-review, the record is a `draft` and
// no picture is bought for it. The owner's decision closes that loop without a
// paid call:
//   - the decided displayTitle / thumbHeadline (and, where the decision gives
//     them, promoDescription / imagePrompt) are used VERBATIM on the record the
//     pipeline already generated; the original lesson title is never touched;
//   - every check still runs on the decided text (validateRecords, the library
//     duplicate title, the picture-prompt rules). An `override` clears ONE named
//     text check on ONE field, with a reason; nothing else can be cleared, so a
//     duplicate title or a dark / no-Black-people prompt still holds the record;
//   - a record that passes becomes status 'review' (no needsReview), its text
//     job is closed 'succeeded' on the ledger (append-only, spend carried
//     forward, no new cost), and runText is handed the decided keys so no title
//     is ever bought for these lessons. Stage B then buys the picture in the
//     normal batches, where the duplicate-picture checks apply as always.
// Re-applying is a no-op. Nothing here writes to a lesson.
// =============================================================================
import { readFileSync, existsSync } from 'node:fs';
import { copyProblems } from './pipeline.mjs';

export const SCHEMA = 'learn-title-decisions/v1';
/** Text checks a person may clear, field by field. Duplicates and picture rules are never here. */
export const OVERRIDABLE = Object.freeze(['generic-god']);
const FIELDS = Object.freeze(['displayTitle', 'thumbHeadline', 'promoDescription']);

export const decisionKey = (d) => `${d.courseKey}::${d.lessonId}`;

/** Every problem with the decisions file. Empty = safe to apply. */
export function validateDecisions(file) {
  const problems = [];
  if (!file || file.schema !== SCHEMA) problems.push(`schema must be ${SCHEMA}`);
  if (!String((file && file.owner) || '').trim()) problems.push('owner is required');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String((file && file.date) || ''))) problems.push('date must be YYYY-MM-DD');
  const seen = new Set();
  for (const d of (file && file.decisions) || []) {
    const k = decisionKey(d || {});
    if (seen.has(k)) problems.push(`duplicate decision ${k}`);
    seen.add(k);
    for (const f of ['courseKey', 'lessonId', 'originalTitle', 'displayTitle', 'thumbHeadline'])
      if (!String((d && d[f]) || '').trim()) problems.push(`${k}: ${f} is required`);
    for (const o of d.overrides || []) {
      if (!OVERRIDABLE.includes(o.code)) problems.push(`${k}: "${o.code}" cannot be overridden (only ${OVERRIDABLE.join(', ')})`);
      if (!FIELDS.includes(o.field)) problems.push(`${k}: override field must be one of ${FIELDS.join(', ')}`);
      if (!String(o.reason || '').trim()) problems.push(`${k}: an override needs a reason`);
    }
  }
  return problems;
}

export function loadDecisions(path) {
  if (!existsSync(path)) return { schema: SCHEMA, owner: '-', date: '1970-01-01', decisions: [] };
  return JSON.parse(readFileSync(path, 'utf8'));
}

/** The decided lessons, as "course::lesson" keys (handed to runText). */
export const decidedKeys = (file) => new Set(((file && file.decisions) || []).map(decisionKey));

const overridden = (msg, overrides) => (overrides || []).some((o) => msg.startsWith(`${o.code} (${o.field}:`));

/**
 * Apply every decision to the ledger. Returns { applied, held, waiting }:
 * applied = now status 'review'; held = still failing a check no override
 * covers (kept a draft, nothing bought); waiting = no generated record yet.
 */
export function applyDecisions(ledger, file, { courses, log = () => {} } = {}) {
  const problems = validateDecisions(file);
  if (problems.length) throw new Error(`title decisions refused: ${problems.join('; ')}`);
  const out = { applied: [], held: [], waiting: [] };
  for (const d of file.decisions || []) {
    const key = decisionKey(d);
    const rec = ledger.getRecord(d.courseKey, d.lessonId);
    if (!rec || !rec.visual) {
      out.waiting.push(key);
      continue;
    }
    const copy = {
      displayTitle: d.displayTitle,
      thumbHeadline: d.thumbHeadline,
      promoDescription: d.promoDescription != null ? d.promoDescription : rec.promoDescription,
      imagePrompt: d.imagePrompt != null ? d.imagePrompt : rec.visual.prompt,
      imageAlt: rec.visual.alt,
    };
    const item = { courseKey: d.courseKey, lessonId: d.lessonId, originalTitle: d.originalTitle };
    const { msgs } = copyProblems({ ledger, courses, item, copy });
    const left = msgs.filter((m) => !overridden(m, d.overrides));
    const status = left.length ? 'draft' : 'review';
    const decision = { by: file.owner, date: file.date, overrides: (d.overrides || []).map((o) => `${o.code}:${o.field}`) };
    const next = {
      ...rec,
      originalTitleAtApproval: d.originalTitle,
      displayTitle: copy.displayTitle,
      thumbHeadline: copy.thumbHeadline,
      promoDescription: copy.promoDescription,
      visual: { ...rec.visual, prompt: copy.imagePrompt },
      status,
      validation: left,
      decision,
    };
    const same =
      ['originalTitleAtApproval', 'displayTitle', 'thumbHeadline', 'promoDescription', 'status'].every((f) => rec[f] === next[f]) &&
      rec.visual.prompt === next.visual.prompt &&
      JSON.stringify(rec.validation || []) === JSON.stringify(left) &&
      JSON.stringify(rec.decision || null) === JSON.stringify(decision);
    if (!same) ledger.putRecord(next);
    if (left.length) {
      out.held.push(key);
      log(`title decision held ${key}: ${left.join('; ')}`);
      continue;
    }
    // Close the text job so the library batches count the title as finished.
    // Same job key, spend carried forward: the ledger total does not move.
    const j = ledger.latestFor(d.courseKey, d.lessonId, 'text');
    if (j && j.contentSha === rec.contentSha && j.state !== 'succeeded') {
      const { _seq, updatedAt, ...row } = j; // eslint-disable-line no-unused-vars
      ledger.write({ ...row, state: 'succeeded', leaseUntil: null, lastError: null, decision: `title-decisions ${file.date}` });
    }
    out.applied.push(key);
  }
  return out;
}

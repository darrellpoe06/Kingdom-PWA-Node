// =============================================================================
// feedback-loop — the feedback loop closes: a steward moves each note, and
// the sender's receipt says truthfully where it stands (DR-0616)
// =============================================================================
// Darrell 2026-09-24: "Also make sure our feedback loop is correct inside this
// workflow... make sense?" Measured before this record:
//   * nothing in the app ever changed a note's triage_status after 'new'
//     (only lib/feedback-sync.js:219 writes it, on insert);
//   * the sender's receipt (lib/feedback-receipt.js) looked for statuses the
//     database could not hold (the CHECK allowed new / reviewed / promoted /
//     declined / needs-info; the receipt read in-progress, working, fixed ...),
//     so no note could ever read "being worked on" or "fixed";
//   * promoting a note to a project, incident or change left it 'new'.
// The loop, as it now runs: received -> triaged (working on it / need more
// from you / declined with the reason / promoted) -> fixed, each move written
// to the row, each one shown to the sender. Migration 0233 lets the database
// hold 'in-progress' and 'fixed'.
// =============================================================================

import { isMissingColumn } from './feedback-sync.js';

export const TRIAGE_STATES = Object.freeze([
  { key: 'new', label: 'Not triaged' },
  { key: 'reviewed', label: 'Reviewed' },
  { key: 'promoted', label: 'Promoted to work' },
  { key: 'in-progress', label: 'Being worked on' },
  { key: 'needs-info', label: 'Needs more from the sender' },
  { key: 'fixed', label: 'Fixed' },
  { key: 'declined', label: 'Declined, with the reason' },
]);
const KEYS = new Set(TRIAGE_STATES.map((s) => s.key));

export function triageLabel(key) {
  return (TRIAGE_STATES.find((s) => s.key === key) || TRIAGE_STATES[0]).label;
}

/** A reason is required where the sender is owed one. */
export function reasonRequired(status) {
  return status === 'declined' || status === 'needs-info';
}

/**
 * Write a note's status (and the reason, where one is owed). Returns
 * { ok, reason }. ok only when the database confirms a row changed: a note
 * that never reached the database, or a steward without the admin role, is
 * said plainly instead of pretending.
 */
export async function setFeedbackTriage({ supabase, id, status, notes = '', nowMs = NaN }) {
  if (!KEYS.has(status)) return { ok: false, reason: `unknown status "${status}"` };
  const why = String(notes || '').trim();
  if (reasonRequired(status) && !why) return { ok: false, reason: 'a reason is required so the sender is told why' };
  try {
    const patch = { triage_status: status };
    if (why) patch.triage_notes = why.slice(0, 2000);
    // DR-0625: "fixed" carries WHAT CHANGED and WHEN onto the note, so the
    // sender reads the change and the measured window has its end point.
    if (status === 'fixed') {
      patch.outcome_at = new Date(Number.isFinite(nowMs) ? nowMs : Date.now()).toISOString();
      if (why) patch.outcome_note = why.slice(0, 2000);
    }
    let { data, error } = await supabase.from('feedback').update(patch).eq('id', id).select('id');
    if (error && patch.outcome_at && isMissingColumn(error)) {
      // 0235 not applied yet: the status still lands, without the outcome columns.
      const { outcome_at: _a, outcome_note: _n, ...lean } = patch;
      ({ data, error } = await supabase.from('feedback').update(lean).eq('id', id).select('id'));
    }
    if (error) return { ok: false, reason: error.message };
    if (!Array.isArray(data) || data.length === 0) return { ok: false, reason: 'no row changed (the note is not in the database, or this account is not an owner or admin)' };
    return { ok: true, reason: '' };
  } catch (e) {
    return { ok: false, reason: e?.message || 'unknown' };
  }
}

// =============================================================================
// door-economics-sync — the seam for line items and the per-door month
// (0203, DR-0359)
// =============================================================================
// Reads go through RLS: 0202's books wall already denies 'child' and
// 'assistant', and 0203's policy on obligation_lines says the same. Writes go
// through SECURITY DEFINER functions that require owner or admin.
//
// The line items are written as a SET, never one at a time, because the parts
// of one payment are one fact — and because the database's sum rule is a
// deferred constraint, so a half-written set is refused as a whole.
// =============================================================================
import supabase from './supabase.js';
import { validateLines, monthOf } from './door-economics.js';

export const TIMEOUT_MS = 20000;

function withTimeout(promise, ms, what) {
  let t;
  const timer = new Promise((_, rej) => { t = setTimeout(() => rej(new Error(`${what} timed out after ${ms} ms`)), ms); });
  return Promise.race([promise, timer]).finally(() => clearTimeout(t));
}
function message(error) {
  const raw = String((error && (error.message || error.msg)) || error || '').replace(/^.*?:\s*/, '');
  return raw || 'That did not go through.';
}

const fromLine = (l) => ({
  id: l.id,
  obligationId: l.obligation_id,
  kind: l.kind,
  label: l.label || '',
  amountCents: Number(l.amount_cents) || 0,
  note: l.note || '',
});

/** Every line item on these obligations, so a breakdown needs no second trip. */
export async function listLines(obligationIds = []) {
  if (!obligationIds.length) return { ok: true, byObligation: {} };
  try {
    const { data, error } = await withTimeout(
      supabase.from('obligation_lines')
        .select('id, obligation_id, kind, label, amount_cents, note')
        .in('obligation_id', obligationIds),
      TIMEOUT_MS, 'reading the line items');
    if (error) return { ok: false, reason: 'rpc-error', message: message(error), byObligation: {} };
    const byObligation = {};
    for (const row of data || []) {
      (byObligation[row.obligation_id] = byObligation[row.obligation_id] || []).push(fromLine(row));
    }
    return { ok: true, byObligation };
  } catch (e) {
    return { ok: false, reason: 'network-error', message: message(e), byObligation: {} };
  }
}

/**
 * Replace an obligation's breakdown. Refused here first, with a sentence, so a
 * person is not handed a Postgres error — and refused again by the database,
 * so the sentence is not the only thing standing between us and a total that
 * does not match its parts.
 */
export async function setLines(obligationId, lines, totalCents) {
  if (!obligationId) return { ok: false, reason: 'no-obligation', message: 'Nothing to break down.' };
  const errors = validateLines(lines, totalCents);
  if (errors.length) return { ok: false, reason: 'invalid', errors, message: errors[0] };
  try {
    const { data, error } = await withTimeout(
      supabase.rpc('obligation_set_lines', {
        obligation_id_in: obligationId,
        lines_in: (lines || []).map((l) => ({
          kind: l.kind,
          label: l.label || null,
          amountCents: Math.round(Number(l.amountCents)),
          note: l.note || null,
        })),
      }), TIMEOUT_MS, 'saving the breakdown');
    if (error) return { ok: false, reason: 'rpc-error', message: message(error) };
    return { ok: true, lines: (data || []).map((l) => ({ ...l, amountCents: Number(l.amountCents) || 0 })) };
  } catch (e) {
    return { ok: false, reason: 'network-error', message: message(e) };
  }
}

/**
 * One door, one month, from the database's own arithmetic. Returns `entered:
 * false` for a door nobody has filled in — which is most of them today — and
 * the caller must render that as "not entered", never as zero.
 */
export async function doorMonthLive(rentalId, month) {
  if (!rentalId) return { ok: false, reason: 'no-door', message: 'Which door?' };
  try {
    const { data, error } = await withTimeout(
      supabase.rpc('door_month', { rental_id_in: rentalId, month_in: monthOf(month) || null }),
      TIMEOUT_MS, 'reading the door’s month');
    if (error) return { ok: false, reason: 'rpc-error', message: message(error) };
    return { ok: true, month: data };
  } catch (e) {
    return { ok: false, reason: 'network-error', message: message(e) };
  }
}

/** Every door's month, for the portfolio view. One call per door, in parallel. */
export async function portfolioMonthLive(rentalIds = [], month) {
  const results = await Promise.all((rentalIds || []).map((id) => doorMonthLive(id, month)));
  const months = [];
  const failed = [];
  results.forEach((r, i) => {
    if (r.ok) months.push(r.month);
    else failed.push({ rentalId: rentalIds[i], message: r.message });
  });
  // A door we could not read is NOT a door with no data. Reported separately so
  // a portfolio total never quietly absorbs a failed read as an empty one.
  return { ok: failed.length === 0, months, failed };
}

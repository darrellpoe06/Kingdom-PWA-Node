// =============================================================================
// outstanding-checks — a payment the books have but the bank has not yet
// (Phase 1.4, ledger integrity, 2026-11-17).
//
// Measured defect: a bank-verified checkpoint is the bank's balance at the END
// of its day, and every balance in FOS counts forward from it, treating every
// row dated on or before that day as already inside it. A check that has been
// WRITTEN but not yet PRESENTED is not inside it: Christina's check #9879
// ($2,200.88) was in the books before the bank cleared it, and Personal cash
// read $2,200.88 too high for those days.
//
// The rule, one place, read by every balance:
//   a row is NOT YET AT THE BANK on day D when it is marked `outstanding`, or
//   carries the day the bank cleared it (`clearedOn`), and that day is not on
//   or before D. Such a row, dated on or before a checkpoint's day, is added to
//   the checkpoint (the bank has not taken it yet; the family has spent it).
//   Once `clearedOn` is on or before a checkpoint's day, the bank's figure
//   already holds it and it is never subtracted twice.
//
// A row that is neither marked nor dated by the bank behaves exactly as before:
// nothing changes for a ledger that does not use these fields.
// Pure.
// =============================================================================

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** The day the bank cleared this row, or null. */
export function clearedOnDay(t) {
  const s = t && t.clearedOn != null ? String(t.clearedOn).slice(0, 10) : '';
  return ISO_DAY.test(s) ? s : null;
}

/** True when this row is in the books but not yet in the bank's balance at the end of `day`. */
export function notYetAtBank(t, day) {
  if (!t) return false;
  const cleared = clearedOnDay(t);
  if (!t.outstanding && !cleared) return false;
  return !cleared || cleared > day;
}

/**
 * The rows dated on or before a checkpoint's day that the bank had not yet
 * taken by the end of that day. `rows` carry { day, amount, outstanding?, clearedOn? }.
 */
export function outstandingAt(rows, cpDay) {
  return (rows || []).filter((r) => r && r.day <= cpDay && notYetAtBank(r, cpDay));
}

/** Their sum (negative for a check written out). */
export function outstandingSum(rows, cpDay) {
  return outstandingAt(rows, cpDay).reduce((s, r) => s + (Number(r.amount) || 0), 0);
}

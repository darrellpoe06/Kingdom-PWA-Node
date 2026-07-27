// =============================================================================
// rent-payments — per-door-month paid-vs-due (rentals build step b)
// =============================================================================
// Darrell 2026-07-27: doors take "0 and 100% paid based on the amount
// entered... vs monthly amount of rent due... locations for the amounts paid
// or partial payment etc." This module records what was PAID against what is
// DUE, per door per month, on the cloud table that has waited since schema
// v2.2: rent_payments (UNIQUE(lease_id, period_month) — ONE honest row per
// month; status pending/partial/received; method; notes).
//
// THE LEDGER RULES:
//   · Partial payments ACCUMULATE into the month's single row — received_amount
//     grows; the row's lifecycle log gains one RECEIPT EVENT per entry
//     ({ at, amount, method, location, by }) so every partial payment keeps its
//     own record (DR-0090 receipts; also the tenant-visible history, step b3).
//   · Status is DERIVED, never chosen: received >= expected → 'received',
//     0 < received < expected → 'partial', else 'pending'. Same for the
//     0→100% indicator: paidPercent = received/expected off real rows only
//     (DR-0061 — never painted).
//   · Money never MOVES here (DR-0094) — this records; it never collects.
//   · Amounts must be positive finite numbers; a bad amount is refused with a
//     named reason, never coerced (DR-0076).
//
// PURE + injectable (same discipline as lease-sync.js): derivations are pure;
// I/O takes a client so tests prove first-payment insert, partial
// accumulation, completion, refusal, and history load with a fake client.
// =============================================================================

/** First-of-month date string for any YYYY-MM or date-ish input. */
export function periodMonthOf(input) {
  const s = String(input || '');
  const m = s.match(/^(\d{4})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-01` : null;
}

/** Derived status — never hand-picked. */
export function statusFor(received, expected) {
  const r = Number(received) || 0;
  const e = Number(expected) || 0;
  if (e > 0 && r >= e) return 'received';
  if (r > 0) return 'partial';
  return 'pending';
}

/** The 0→100% indicator, from real amounts only. Clamped, whole percent. */
export function paidPercent(received, expected) {
  const r = Number(received) || 0;
  const e = Number(expected) || 0;
  if (e <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((r / e) * 100)));
}

/** A receipt event for the month-row's lifecycle log (DR-0090). */
export function receiptEvent({ amount, method, location, userId, at }) {
  return {
    kind: 'payment',
    at: at || new Date().toISOString(),
    amount: Number(amount),
    method: method || 'other',
    location: String(location || '').trim() || null,
    by: userId || null,
  };
}

const METHODS = new Set(['cash', 'check', 'ach', 'zelle', 'venmo', 'cashapp', 'other']);

/**
 * Record one payment event against a door's month. Accumulates into the single
 * (lease_id, period_month) row; appends the receipt event to lifecycle.log.
 * Never throws. Returns { ok, action:'insert'|'update'|'refused',
 * reason?, received?, status?, percent? }.
 */
export async function recordRentPayment(client, {
  tenantId, userId, leaseId, month, expectedAmount, amount, method, location, notes,
}) {
  try {
    if (!client || !tenantId || !userId) return { ok: false, action: 'refused', reason: 'signed-out' };
    if (!leaseId) return { ok: false, action: 'refused', reason: 'no-lease' };
    const period = periodMonthOf(month);
    if (!period) return { ok: false, action: 'refused', reason: 'bad-month' };
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) return { ok: false, action: 'refused', reason: 'bad-amount' };
    const meth = METHODS.has(method) ? method : 'other';
    const expected = Number(expectedAmount) || 0;

    const existing = await client.from('rent_payments')
      .select('id, received_amount, expected_amount, lifecycle')
      .eq('lease_id', leaseId).eq('period_month', period).limit(1);
    if (existing.error) return { ok: false, action: 'refused', reason: 'lookup-failed' };

    const event = receiptEvent({ amount: amt, method: meth, location, userId });

    if (existing.data && existing.data.length) {
      const row = existing.data[0];
      const received = (Number(row.received_amount) || 0) + amt;
      const exp = Number(row.expected_amount) || expected;
      const life = row.lifecycle && typeof row.lifecycle === 'object' ? row.lifecycle : { log: [] };
      const log = Array.isArray(life.log) ? [...life.log, event] : [event];
      const status = statusFor(received, exp);
      const upd = await client.from('rent_payments').update({
        received_amount: received, received_at: event.at, method: meth, status,
        lifecycle: { ...life, log }, updated_by: userId, updated_at: event.at,
        ...(notes ? { notes } : {}),
      }).eq('id', row.id);
      if (upd.error) return { ok: false, action: 'refused', reason: 'update-failed' };
      return { ok: true, action: 'update', received, status, percent: paidPercent(received, exp) };
    }

    const status = statusFor(amt, expected);
    const ins = await client.from('rent_payments').insert({
      instance_id: tenantId, created_by: userId, lease_id: leaseId,
      period_month: period, expected_amount: expected, received_amount: amt,
      received_at: event.at, method: meth, status,
      lifecycle: { phase: 'open', log: [event] }, ...(notes ? { notes } : {}),
    }).select('id').single();
    if (ins.error) return { ok: false, action: 'refused', reason: 'insert-failed' };
    return { ok: true, action: 'insert', received: amt, status, percent: paidPercent(amt, expected) };
  } catch {
    return { ok: false, action: 'refused', reason: 'unexpected' };
  }
}

/**
 * Load a lease's payment history, newest month first — the owner's ledger AND
 * (step b3) the tenant's own keepable statement: every receipt event rides in
 * each row's lifecycle.log.
 */
export async function loadRentPayments(client, leaseId) {
  const res = await client.from('rent_payments')
    .select('id, period_month, expected_amount, received_amount, received_at, method, status, lifecycle, notes')
    .eq('lease_id', leaseId).order('period_month', { ascending: false });
  if (res.error || !Array.isArray(res.data)) return [];
  return res.data.map((r) => ({
    id: r.id,
    month: String(r.period_month || '').slice(0, 7),
    expected: Number(r.expected_amount) || 0,
    received: Number(r.received_amount) || 0,
    percent: paidPercent(r.received_amount, r.expected_amount),
    status: r.status || statusFor(r.received_amount, r.expected_amount),
    method: r.method || null,
    receivedAt: r.received_at || null,
    events: (r.lifecycle && Array.isArray(r.lifecycle.log)) ? r.lifecycle.log.filter((e) => e && e.kind === 'payment') : [],
    notes: r.notes || '',
  }));
}

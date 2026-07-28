// =============================================================================
// rent-portfolio-paid — this-month paid-vs-due across ALL doors (build step c)
// =============================================================================
// Darrell 2026-07-27: doors show "0 and 100% paid based on the amount entered
// vs monthly amount of rent due." Step b put that on each door's ledger; this
// is the at-a-glance rollup: every door's this-month paid state AND a portfolio
// strip (how many doors fully paid, how much collected of what's due).
//
// INTEGRATED FLOW (one river, scalable): loadLeasesByRental gives every door's
// active lease + its monthly_rent (the DUE) in one read; loadThisMonthPaidByLease
// reads all those leases' this-month rows in ONE query. A door with a synced
// lease but no payment row yet is DUE-but-unpaid (expected = monthly_rent,
// received = 0) — never invisible, never painted (DR-0061/DR-0076). Doors with
// no cloud lease yet are simply not in the rollup (nothing true to show).
//
// PURE core (rollupPaid) + injectable I/O (loadPortfolioPaid takes a client),
// same discipline as lease-sync / rent-payments — tests prove the math and the
// fallback with a fake client.
// =============================================================================
import { loadLeasesByRental } from './lease-sync.js';
import { loadThisMonthPaidByLease, paidPercent, statusFor } from './rent-payments.js';

/**
 * Pure rollup over an array of per-door entries { received, expected }.
 * Returns totals + door counts. A door counts as "paid" only when it has a
 * positive DUE that is fully met (received >= expected > 0).
 */
export function rollupPaid(entries) {
  const list = Array.isArray(entries) ? entries : [];
  let received = 0;
  let expected = 0;
  let doorsPaid = 0;
  let doorsPartial = 0;
  let doorsUnpaid = 0;
  for (const e of list) {
    const r = Number(e && e.received) || 0;
    const x = Number(e && e.expected) || 0;
    received += r;
    expected += x;
    const s = statusFor(r, x);
    if (s === 'received') doorsPaid += 1;
    else if (s === 'partial') doorsPartial += 1;
    else doorsUnpaid += 1;
  }
  return {
    received,
    expected,
    percent: paidPercent(received, expected),
    doors: list.length,
    doorsPaid,
    doorsPartial,
    doorsUnpaid,
  };
}

/**
 * Load this-month paid-vs-due for every door with a synced active lease.
 * Returns { byDoor: { [rentalUuid]: { leaseId, received, expected, percent,
 * status } }, rollup }. Never throws; a signed-out / no-lease world yields an
 * empty map and a zeroed rollup.
 */
export async function loadPortfolioPaid(client, tenantId, month) {
  const empty = { byDoor: {}, rollup: rollupPaid([]) };
  if (!client || !tenantId) return empty;
  try {
    const leaseMap = await loadLeasesByRental(client, tenantId); // { rentalUuid: { leaseId, monthlyRent, ... } }
    const rentalUuids = Object.keys(leaseMap || {});
    if (rentalUuids.length === 0) return empty;
    const leaseIds = rentalUuids.map((u) => leaseMap[u].leaseId).filter(Boolean);
    const paidByLease = await loadThisMonthPaidByLease(client, leaseIds, month);
    const byDoor = {};
    const entries = [];
    for (const uuid of rentalUuids) {
      const lease = leaseMap[uuid];
      const paid = paidByLease[lease.leaseId];
      // No row yet → due (from the lease's monthly_rent), nothing received.
      const expected = paid ? paid.expected : (Number(lease.monthlyRent) || 0);
      const received = paid ? paid.received : 0;
      const entry = {
        leaseId: lease.leaseId,
        received,
        expected,
        percent: paidPercent(received, expected),
        status: statusFor(received, expected),
      };
      byDoor[uuid] = entry;
      entries.push(entry);
    }
    return { byDoor, rollup: rollupPaid(entries) };
  } catch {
    return empty;
  }
}

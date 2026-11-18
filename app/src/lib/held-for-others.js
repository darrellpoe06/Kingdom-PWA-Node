// =============================================================================
// held-for-others — money that passes through the family's account for someone
// else (Christina 2026-11-18: "$55 transfer came from Christiana's account to
// pay her tithes ... Do not count the $55 as my earnings, my personal tithe, or
// additional money available for discretionary spending").
//
// A row is held for someone else when its category is 'held-for-others' (set by
// the person, on the import card or in Transactions). Such rows are movements,
// like transfers (lib/imported-view.js isTransferTxn): never income, spending or
// the family's own giving. What came in and has not yet gone out is still that
// person's money: Safe-to-Spend sets it aside until it is passed along.
//
// The pairing of money received with money passed along is DERIVED, never
// stored (an edit only reaches the cloud through the columns it already has),
// so it is recomputed the same way on every device: oldest first, an exact
// amount first, on the same account. Nothing in the books is changed here.
// =============================================================================

export const HELD_CATEGORY = 'held-for-others';
const round2 = (n) => Math.round(n * 100) / 100;
const day = (t) => String((t && t.date) || '').slice(0, 10);

/** True when the person marked this row as money held for someone else. */
export function isHeldForOthers(t) {
  return !!t && String(t.category || '').toLowerCase() === HELD_CATEGORY;
}

/**
 * @param {object[]} transactions  the ledger
 * @param {{ accountIds?: string[]|Set<string>, asOf?: string }} [opts] limit to these accounts / rows on or before this day
 * @returns {{ received: object[], passedAlong: object[], pairs: object[], stillHeld: object[], outstanding: number }}
 *   pairs: [{ received, passedAlong }]; stillHeld: received rows not yet passed along (with `remaining`).
 */
export function heldForOthers(transactions = [], { accountIds = null, asOf = null } = {}) {
  const ids = accountIds ? new Set(accountIds) : null;
  const rows = (transactions || [])
    .filter((t) => isHeldForOthers(t) && (!ids || ids.has(t.accountId)) && (!asOf || day(t) <= asOf))
    .sort((a, b) => day(a).localeCompare(day(b)));
  const received = rows.filter((t) => Number(t.amount) > 0);
  const passedAlong = rows.filter((t) => Number(t.amount) < 0);
  const open = received.map((t) => ({ t, remaining: round2(Number(t.amount)) }));
  const pairs = [];
  for (const out of passedAlong) {
    let need = round2(-Number(out.amount));
    const sameAcct = open.filter((o) => o.remaining > 0 && o.t.accountId === out.accountId && day(o.t) <= day(out));
    const exact = sameAcct.find((o) => Math.abs(o.remaining - need) < 0.005);
    for (const o of exact ? [exact] : sameAcct) {
      if (need <= 0) break;
      const take = Math.min(o.remaining, need);
      o.remaining = round2(o.remaining - take);
      need = round2(need - take);
      pairs.push({ received: o.t, passedAlong: out, amount: round2(take) });
    }
  }
  const stillHeld = open.filter((o) => o.remaining > 0.004).map((o) => ({ ...o.t, remaining: o.remaining }));
  const outstanding = round2(stillHeld.reduce((s, r) => s + r.remaining, 0));
  return { received, passedAlong, pairs, stillHeld, outstanding };
}

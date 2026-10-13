// =============================================================================
// internal-transfers — "received" must be REAL income, not money you moved
// yourself (Darrell 2026-07-18, live: "received between $60,000-$80,000 per month
// that's incorrect")
// =============================================================================
// When "In / Out" is summed across ALL of the family's accounts, every dollar the
// family moves between its OWN accounts is double-counted as both income and
// spend: a transfer, a credit-card payment, a line-of-credit draw or paydown each
// appear as an OUTFLOW on one account and a matching INFLOW on another. The gross
// balloons (in ~ out ~ $70-85k/mo) while the net stays about right — the exact
// signature seen across March-June 2026. That gross is not income; it is internal
// circulation.
//
// This eliminates internal circulation the way a bookkeeper does — by PAIRING: an
// outflow of $X on one own-account matched to an inflow of $X on ANOTHER own-
// account within a few days is one internal move, and BOTH legs are excluded from
// the income/spend totals. To keep REAL income safe (a payroll deposit must never
// be mistaken for a transfer just because some expense happened to equal it), a
// pair is only eliminated when at least one leg carries a MOVEMENT HINT — it is
// already tagged transfer, or is a debt-payment, or its description reads like a
// transfer / card payment / LOC move. Payroll, rent, and revenue carry no such
// hint, so they are never eliminated.
//
// Pure + deterministic. View-layer only: it returns the SET of leg ids to exclude
// from totals — it never rewrites a stored row, so it is safe, reversible, and
// transparent (the caller shows how much was excluded). RLS-scoped by the caller.
// =============================================================================

import { isTransferTxn } from './imported-view.js';

// A description that reads like the family moving its own money (transfer / card
// payment / line-of-credit / bank bill-pay), as opposed to earning or spending.
const MOVE_HINT = /\btransfer\b|\bxfer\b|zelle|venmo|cash ?app|quickpay|online (transfer|banking)|to (savings|checking|card|credit|loc)|from (savings|checking|card|credit)|payment (thank you|to |-|received)|thank you.*payment|autopay|auto ?pay|card ?member|cardmember|credit crd|chase credit|line of credit|\bloc\b|advance|pay ?down|\bepay\b|bill ?pay|e-?payment|internet transfer|acct ?xfer|account transfer/i;

function legHasMoveHint(t) {
  if (!t) return false;
  if (isTransferTxn(t)) return true;
  if (String(t.category || '').toLowerCase() === 'debt-payment') return true;
  return MOVE_HINT.test(String(t.description || t.desc || ''));
}

function dateMs(t) {
  const s = t && (t.date ?? t.posted);
  if (!s) return null;
  const str = String(s);
  const ms = Date.parse(str.length === 10 ? str + 'T00:00:00' : str);
  return Number.isNaN(ms) ? null : ms;
}

// internalTransferIds(transactions, accounts, opts) -> Set<txId> of the legs that
// are internal circulation (matched outflow<->inflow pairs across the family's own
// accounts). opts.dayWindow (default 5) is how far apart the two legs may post.
// A pair is eliminated only when the accounts differ, the amounts are equal to the
// cent, the dates are within the window, AND at least one leg has a movement hint
// (so real income is never eliminated). Each leg is used in at most one pair.
export function internalTransferIds(transactions, accounts = [], opts = {}) {
  const dayWindow = opts.dayWindow ?? 5;
  const windowMs = dayWindow * 86400000;
  const own = new Set((accounts || []).map((a) => a && a.id).filter(Boolean));
  // Bucket own-account legs by absolute cents so only equal-magnitude legs compare.
  const byCents = new Map();
  for (const t of transactions || []) {
    if (!t || !t.id || !own.has(t.accountId)) continue;
    const a = Number(t.amount);
    if (!Number.isFinite(a) || a === 0) continue;
    const cents = Math.abs(Math.round(a * 100));
    const leg = { id: t.id, accountId: t.accountId, ms: dateMs(t), sign: a < 0 ? -1 : 1, hint: legHasMoveHint(t) };
    const list = byCents.get(cents);
    if (list) list.push(leg); else byCents.set(cents, [leg]);
  }
  const internal = new Set();
  for (const legs of byCents.values()) {
    if (legs.length < 2) continue;
    const outs = legs.filter((l) => l.sign < 0);
    const ins = legs.filter((l) => l.sign > 0);
    const usedIn = new Set();
    for (const o of outs) {
      let best = null;
      for (const i of ins) {
        if (usedIn.has(i.id)) continue;
        if (i.accountId === o.accountId) continue;   // must cross accounts
        if (o.ms == null || i.ms == null) continue;
        if (Math.abs(i.ms - o.ms) > windowMs) continue;
        if (!(o.hint || i.hint)) continue;           // at least one leg must look like a move
        // Prefer the closest-dated candidate.
        if (!best || Math.abs(i.ms - o.ms) < Math.abs(best.ms - o.ms)) best = i;
      }
      if (best) { internal.add(o.id); internal.add(best.id); usedIn.add(best.id); }
    }
  }
  return internal;
}

// externalTotals(rows, internalIds) -> { in, out, net, count, internalIn,
// internalOut, internalCount }. `rows` are the imported-view rows in the window
// (each { id, amount, category, isTransfer }); `internalIds` is the exclusion set.
// The in/out/net reflect TRUE external flow (internal circulation + already-tagged
// transfers removed); the internal* fields report what was excluded, so the UI can
// show it transparently instead of hiding it. Pure.
export function externalTotals(rows, internalIds) {
  const excl = internalIds || new Set();
  let inSum = 0, outSum = 0, count = 0;
  let internalIn = 0, internalOut = 0, internalCount = 0;
  for (const r of rows || []) {
    const a = typeof r.amount === 'number' ? r.amount : Number(r.amount);
    if (!Number.isFinite(a)) continue;
    const isInternal = excl.has(r.id) || isTransferTxn(r);
    if (isInternal) {
      internalCount += 1;
      if (a < 0) internalOut += -a; else internalIn += a;
      continue;
    }
    count += 1;
    if (a < 0) outSum += -a; else inSum += a;
  }
  const r2 = (n) => Math.round(n * 100) / 100;
  return {
    in: r2(inSum), out: r2(outSum), net: r2(inSum - outSum), count,
    internalIn: r2(internalIn), internalOut: r2(internalOut), internalCount,
  };
}

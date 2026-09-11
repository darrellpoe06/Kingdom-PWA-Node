// =============================================================================
// giving-batch — one bank deposit, split back into the people who gave it
// =============================================================================
// THE GAP THIS FILLS. Every importer in this repo is 1 statement row -> 1
// ledger row (bulk-statement-import.js, debt-import.js, transactions-sync.js).
// Nothing anywhere turns ONE source row into N records. That is exactly what
// the church needs, and it is why this had to be written rather than reused:
//
//   Members send gifts to the church's Cash App, one at a time, all week.
//   The steward moves the whole balance to the bank in ONE transfer.
//   The BANK sees a single deposit -- say $1,000.
//   The CASH APP STATEMENT is the only thing that knows it was persons a, b
//   and c, on which days, for how much, with what note.
//
// So a deposit has to be splittable back into named gifts, and the split has to
// PROVE it ties to the deposit. Darrell, in the same meeting: *"it would stop
// the error"*, and *"we're using AI to build a hard system that does the same
// thing over and over again... program it like a calculator."* A calculator
// does not decide a total is close enough.
//
// THE SHAPE WAS ALREADY DECIDED, IN SQL, AND NEVER WIRED.
//   infra/supabase/schema-v2.7-church.sql already models this exactly, and no
//   application code has ever touched it:
//     service_offerings     -- the lump: online_total, online_source,
//                              online_batch_id, transaction_id (the bank row)
//     giving_reconciliations-- the per-person claims: amount_claimed,
//                              claim_kind, claim_status, parishioner_id
//     donor_giving          -- the church-office per-person giving row
//   `claim_kind = 'reconciled-from-online'` is a value that schema defined for
//   precisely this import. This module produces those shapes, in integer
//   cents, as plain objects -- so the sync layer writes rows and never does
//   arithmetic.
//
// WHY giving_records IS NOT TOUCHED. That table is the GIVER's own private
// record; its RLS is `created_by = auth.uid()` and migration 0184 states as
// doctrine that an instance admin cannot read it. The church office's books
// are a different surface with different consent. Reconciling the office's
// deposit must never become a back door into a member's private ledger.
//
// Pure: no network, no DOM, no storage. Integer cents throughout.
// =============================================================================
import { KIND } from './cashapp-statement.js';

/** Values the schema's CHECK constraints accept, named once. */
export const CLAIM_KIND_ONLINE = 'reconciled-from-online';
export const CLAIM_STATUS_PENDING = 'pending';
export const METHOD_ONLINE = 'online';
export const SOURCE_CASHAPP = 'cashapp';

/** Why a batch does not tie. Each is a sentence a steward can act on. */
export const DRIFT = {
  CLEAN: 'clean',
  // The deposit is larger than the gifts that fed it: money in the batch came
  // from somewhere this statement does not explain.
  DEPOSIT_EXCEEDS_GIFTS: 'deposit-exceeds-gifts',
  // The gifts are larger than the deposit: part of the batch has not landed,
  // or a fee was taken that the statement did not print.
  GIFTS_EXCEED_DEPOSIT: 'gifts-exceed-deposit',
  // No deposit row at all -- the gifts are still sitting in Cash App.
  NOT_YET_DEPOSITED: 'not-yet-deposited',
};

// A cent of drift is drift. There is no tolerance band here on purpose: a
// "close enough" threshold is how a real missing gift hides inside rounding,
// and integer cents means honest arithmetic never lands off-by-one anyway.
const EXACT = 0;

/**
 * Split one deposit into the gifts that funded it.
 *
 * @param {object} input
 * @param {object[]} input.gifts   gift rows from cashapp-statement.giftsOf()
 * @param {object|null} input.payout  the payout row this deposit came from
 * @param {string} [input.serviceDate]  the date the church books this against;
 *   defaults to the payout's date, else the newest gift's date.
 * @param {string} [input.batchId]  defaults to the payout's transaction id.
 * @returns {{ batch: object, claims: object[], reconciliation: object }}
 */
export function planGivingBatch({ gifts = [], payout = null, serviceDate = null, batchId = null } = {}) {
  const rows = (gifts || []).filter((g) => g && g.kind === KIND.GIFT);

  let giftsGrossCents = 0;
  let feesCents = 0;
  let giftsNetCents = 0;
  for (const g of rows) {
    giftsGrossCents += g.grossCents || 0;
    feesCents += g.feeCents || 0;
    giftsNetCents += g.netCents == null ? (g.grossCents || 0) : g.netCents;
  }

  // A payout leaves Cash App, so its amount is negative on the statement. The
  // deposit the bank shows is its magnitude.
  const depositCents = payout ? Math.abs(payout.netCents == null ? payout.grossCents : payout.netCents) : null;

  const claims = rows.map((g) => ({
    // The name as the sender wrote it. Who that IS is proposed elsewhere and
    // decided by a person -- this field is evidence, not an identification.
    giverName: g.giver || '',
    parishionerId: null,
    // Net, not gross: the church received what landed. Gross is kept beside it
    // so a giving statement can show the gift and the fee separately rather
    // than quietly under-reporting what a member actually gave.
    amountClaimedCents: g.netCents == null ? g.grossCents : g.netCents,
    grossCents: g.grossCents,
    feeCents: g.feeCents || 0,
    givenOn: g.date,
    givenAt: g.time,
    note: g.note || '',
    txnId: g.txnId || '',
    method: METHOD_ONLINE,
    claimKind: CLAIM_KIND_ONLINE,
    // Never 'verified'. An imported name is a proposal until the office says
    // otherwise -- the same posture call-to-give.js takes with a detected cue.
    claimStatus: CLAIM_STATUS_PENDING,
    needsReview: true,
  }));

  const bookedOn = serviceDate
    || (payout && payout.date)
    || (rows.length ? rows[rows.length - 1].date : null);

  const batch = {
    onlineSource: SOURCE_CASHAPP,
    onlineBatchId: batchId || (payout && payout.txnId) || '',
    onlineTotalCents: giftsNetCents,
    depositCents,
    feesCents,
    giftCount: rows.length,
    serviceDate: bookedOn,
    payoutOn: payout ? payout.date : null,
    firstGiftOn: rows.length ? rows[0].date : null,
    lastGiftOn: rows.length ? rows[rows.length - 1].date : null,
  };

  return { batch, claims, reconciliation: reconcileBatch({ depositCents, giftsGrossCents, feesCents, giftsNetCents, claimCount: rows.length }) };
}

/**
 * The gate. Does the sum of the named gifts equal the deposit the bank shows?
 * Reports the exact difference and a sentence naming what it means. It NEVER
 * adjusts a figure to make a total agree -- a balanced report that was forced
 * is worse than an honest one that does not balance, because only the second
 * one gets looked at.
 */
export function reconcileBatch({ depositCents = null, giftsGrossCents = 0, feesCents = 0, giftsNetCents = 0, claimCount = 0 } = {}) {
  if (depositCents == null) {
    return {
      depositCents: null,
      giftsGrossCents,
      feesCents,
      giftsNetCents,
      differenceCents: null,
      balanced: false,
      status: DRIFT.NOT_YET_DEPOSITED,
      explanation: claimCount
        ? `${claimCount} gift${claimCount === 1 ? '' : 's'} totalling ${money(giftsNetCents)} are recorded but no transfer to the bank has been made yet. Nothing is missing.`
        : 'No gifts and no transfer in this batch.',
    };
  }

  const differenceCents = giftsNetCents - depositCents;
  if (Math.abs(differenceCents) <= EXACT) {
    return {
      depositCents,
      giftsGrossCents,
      feesCents,
      giftsNetCents,
      differenceCents: 0,
      balanced: true,
      status: DRIFT.CLEAN,
      explanation: `The ${money(depositCents)} deposit is fully accounted for by ${claimCount} named gift${claimCount === 1 ? '' : 's'}.`,
    };
  }

  const short = differenceCents < 0;
  return {
    depositCents,
    giftsGrossCents,
    feesCents,
    giftsNetCents,
    differenceCents,
    balanced: false,
    status: short ? DRIFT.DEPOSIT_EXCEEDS_GIFTS : DRIFT.GIFTS_EXCEED_DEPOSIT,
    explanation: short
      ? `The bank deposit is ${money(-differenceCents)} MORE than the gifts in this batch. Something in the deposit is not explained by this statement -- check for a gift outside the date range, or a balance that was already sitting in the account.`
      : `The gifts are ${money(differenceCents)} MORE than the deposit. Part of this batch has not landed yet, or a fee was taken that the statement did not print.`,
  };
}

/**
 * Assign every gift to the transfer that carried it, so a month of mixed
 * activity resolves into batches that each tie to one real bank deposit.
 *
 * The rule is the physical one: a gift is carried by the FIRST transfer at or
 * after the moment it arrived. Gifts after the last transfer are not an error
 * -- they are money still sitting in Cash App, and they get their own
 * undeposited batch so they are visible rather than absent.
 *
 * Deterministic: same input, same batches, every time.
 *
 * @param {object[]} gifts   from cashapp-statement.giftsOf() (oldest first)
 * @param {object[]} payouts from cashapp-statement.payoutsOf() (oldest first)
 */
export function batchGiftsByPayout(gifts = [], payouts = []) {
  const g = (gifts || []).slice().sort(byMoment);
  const p = (payouts || []).slice().sort(byMoment);

  const buckets = p.map((payout) => ({ payout, gifts: [] }));
  const undeposited = [];

  for (const gift of g) {
    const idx = buckets.findIndex((b) => momentKey(b.payout) >= momentKey(gift));
    if (idx === -1) undeposited.push(gift);
    else buckets[idx].gifts.push(gift);
  }

  const batches = buckets.map((b) => planGivingBatch({ gifts: b.gifts, payout: b.payout }));
  if (undeposited.length) batches.push(planGivingBatch({ gifts: undeposited, payout: null }));
  return batches;
}

/**
 * Every batch's reconciliation in one answer -- what a steward needs to know
 * before signing a month off. `allBalanced` is the single fact that decides
 * whether the month's giving report can be trusted.
 */
export function summarizeBatches(batches = []) {
  const list = batches || [];
  let depositedCents = 0;
  let claimedCents = 0;
  let feesCents = 0;
  let claims = 0;
  const unbalanced = [];
  let undepositedCents = 0;

  for (const b of list) {
    const r = b.reconciliation;
    claimedCents += r.giftsNetCents || 0;
    feesCents += r.feesCents || 0;
    claims += (b.claims || []).length;
    if (r.status === DRIFT.NOT_YET_DEPOSITED) {
      undepositedCents += r.giftsNetCents || 0;
      continue; // not a drift: money that has not moved yet is not money lost
    }
    depositedCents += r.depositCents || 0;
    if (!r.balanced) unbalanced.push(b);
  }

  return {
    batches: list.length,
    claims,
    depositedCents,
    claimedCents,
    feesCents,
    undepositedCents,
    unbalanced: unbalanced.length,
    unbalancedBatches: unbalanced,
    allBalanced: unbalanced.length === 0,
  };
}

// --- internals --------------------------------------------------------------
const momentKey = (r) => `${(r && r.date) || '9999-99-99'} ${(r && r.time) || '00:00'}`;
const byMoment = (a, b) => {
  const ka = momentKey(a);
  const kb = momentKey(b);
  if (ka !== kb) return ka < kb ? -1 : 1;
  return (a.index || 0) - (b.index || 0);
};

// Local, so this module carries no import just to phrase a sentence.
function money(cents) {
  const v = Math.round(Number(cents) || 0) / 100;
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
  } catch {
    return `$${v.toFixed(2)}`;
  }
}

export default { planGivingBatch, reconcileBatch, batchGiftsByPayout, summarizeBatches, DRIFT };

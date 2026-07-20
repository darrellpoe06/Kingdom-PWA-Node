// =============================================================================
// debt-payments — derive a debt's payment pace + expected payoff from the ledger
// =============================================================================
// Darrell 2026-07-20: "all credit card and lines companies should be listed on
// [the Debts] Tab with an expected payed off date based on their payments."
//
// Imported credit-card / line-of-credit accounts carry NO interest rate and no
// hand-entered minimum, so the rate-based snowball engine (projectDebtSnowball)
// can't date their payoff — it shows "?". This derives the payoff from what the
// family ACTUALLY does: their real payments on that account, straight from the
// synced ledger. No fabricated rate, no painted number (DR-0076).
//
// Sign convention (from deriveAccountBalances / seed data): a debt account's owed
// balance is NEGATIVE; a PAYMENT toward it is a POSITIVE amount (it raises the
// balance toward zero); a new CHARGE is negative. So over a window:
//   · gross payment  = sum of positive amounts (what they paid)
//   · new charges    = sum of |negative amounts| (what they added)
//   · net paydown    = gross payment − new charges (how fast owed actually falls)
// The honest "when is it paid off" uses the NET paydown — a payoff dated off gross
// payments while new charges keep pace would be a rosy fiction (DR-0100: speak the
// truth, don't paint). We surface BOTH: the payment pace they asked for AND the
// truthful reach-zero date, and we say plainly when the balance is NOT going down.
//
// Pure + deterministic (asOf injected, never Date.now() inside) so the math is
// pinned by debt-payments.test.js against real row shapes.
// =============================================================================

import { payeeKey, categorize } from './categorize.js';
import { detectRecurring } from './recurring-payments.js';

const DAY_MS = 86400000;
const round2 = (n) => Math.round(n * 100) / 100;

// A name that clearly reads as a credit card / line of credit / loan. Imported
// accounts sync with whatever type the bank feed carried and NOTHING classifies
// them by name (verified 2026-07-20), so a real credit card can land as 'checking'
// and never reach the Debts tab. deriveDebts uses this — together with a genuinely
// OWED (negative) balance — to surface a mis-typed debt account without mutating
// the stored record. Specific terms only (no bare "card") to avoid false matches
// like "Cardinal Checking". The owed-balance requirement is the real guard.
const DEBT_NAME_RE = /\b(credit\s*card|visa|master\s*card|amex|american\s+express|discover|line\s+of\s+credit|\bloc\b|heloc|loan|mortgage)\b/i;

export function looksLikeDebtAccount(account) {
  if (!account) return false;
  return DEBT_NAME_RE.test(String(account.name || account.institution || ''));
}

// Tidy a raw payment description into an account name: drop the trailing ids/dates
// and the "AUTOPAY/PAYMENT" noise, Title-Case the rest. "CHASE CREDIT CRD AUTOPAY
// 0511" -> "Chase Credit Crd". Shared by the Accounts and Debts "add as debt"
// flows so a suggested card is named the same on either surface.
export function debtNameFromPayee(desc) {
  const cleaned = String(desc || '')
    .replace(/\b(auto\s*pay|autopay|payment|pmt|web|ppd|id|thank you|online)\b/ig, ' ')
    .replace(/\b\d[\d/.-]*\b/g, ' ')
    .replace(/[^A-Za-z ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const t = (cleaned || 'Debt').split(' ').slice(0, 4).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  return t || 'Debt';
}

// Parse a transaction's posted date to epoch ms ('YYYY-MM-DD' as local midnight,
// or a full ISO string). Null when unparseable (handled honestly, never epoch 0).
function txMs(t) {
  const s = t && (t.date ?? t.posted);
  if (!s) return null;
  const str = String(s);
  const ms = Date.parse(str.length === 10 ? str + 'T00:00:00' : str);
  return Number.isNaN(ms) ? null : ms;
}

// The 'YYYY-MM' month a timestamp falls in — the divisor for monthly rates/pace.
// Counting DISTINCT months (not a raw day-span) is what makes "$60 interest in
// May + $60 in June" read as $60/mo, not $120/mo: each statement posts once a
// month, so distinct-months == number of statements.
const monthKey = (ms) => { const d = new Date(ms); return `${d.getFullYear()}-${d.getMonth()}`; };

// debtPaymentStats — the observed payment behavior on ONE debt account over the
// trailing `windowMonths`. Excludes internal-transfer-flagged rows ONLY when they
// are not the payment itself: a card payment often rides in as a transfer from
// checking, and from the CARD's side that inflow IS the paydown, so positive
// amounts always count. Charges (negative) count toward new-charge pressure.
//
// months = the real span covered by the rows in the window (>= 1), so a family
// that paid twice in six weeks isn't credited with six months of pace.
export function debtPaymentStats(transactions, accountId, asOf, windowMonths = 6) {
  const nowMs = asOf instanceof Date ? asOf.getTime() : Number(asOf) || Date.now();
  const sinceMs = nowMs - windowMonths * 30 * DAY_MS;
  const rows = (transactions || []).filter((t) => {
    if (!t || t.accountId !== accountId) return false;
    const ms = txMs(t);
    return ms != null && ms >= sinceMs && ms <= nowMs;
  });
  let gross = 0, charges = 0, paymentCount = 0;
  const months_ = new Set();
  for (const t of rows) {
    const a = typeof t.amount === 'number' ? t.amount : Number(t.amount);
    if (!Number.isFinite(a) || a === 0) continue;
    months_.add(monthKey(txMs(t)));
    if (a > 0) { gross += a; paymentCount += 1; } else { charges += -a; }
  }
  // Distinct calendar months the activity covers (>= 1) — the honest monthly
  // divisor: six payments across Feb–Jul is $/6mo, not $/day-span.
  const months = Math.max(1, months_.size);
  return {
    paymentCount,
    grossPaymentPerMonth: round2(gross / months),
    newChargePerMonth: round2(charges / months),
    netPaydownPerMonth: round2((gross - charges) / months),
    months,
  };
}

// estimatePayoff — months + date to clear `owed` (a POSITIVE owed figure) at the
// given net paydown per month. Truthful-or-absent:
//   · owed <= 0            -> { clear: true }              (already paid off)
//   · netPaydownPerMonth<=0-> { onTrack: false }           (not going down)
//   · else                 -> { onTrack: true, months, date }
// date is asOf + months (first of that month is fine for a "Mon 'YY" label).
export function estimatePayoff(owed, netPaydownPerMonth, asOf) {
  const nowMs = asOf instanceof Date ? asOf.getTime() : Number(asOf) || Date.now();
  if (!(owed > 0.01)) return { clear: true, onTrack: true, months: 0, date: new Date(nowMs) };
  if (!(netPaydownPerMonth > 0)) return { clear: false, onTrack: false, months: null, date: null };
  const months = Math.ceil(owed / netPaydownPerMonth);
  const d = new Date(nowMs);
  const date = new Date(d.getFullYear(), d.getMonth() + months, 1);
  return { clear: false, onTrack: true, months, date };
}

// A statement's own interest line — the data that reveals the rate. Cards post
// it as a negative amount named like these. Case-insensitive, word-ish match.
const INTEREST_RE = /\b(interest\s+charge|finance\s+charge|purchase\s+interest|interest\s+assessed|int(?:erest)?\s+charged?|apr\s+charge)\b/i;

export function isInterestCharge(t) {
  if (!t) return false;
  const a = typeof t.amount === 'number' ? t.amount : Number(t.amount);
  if (!(a < 0)) return false; // an interest charge adds to what's owed (negative)
  return INTEREST_RE.test(String(t.description || t.name || ''));
}

// deriveApr — the interest RATE read from the account's OWN data, so no human can
// undermine it (Darrell 2026-07-20: "unless we can deduct them from the data then
// we use that method so no human can undermine the data"). A card's statement
// posts an INTEREST/FINANCE CHARGE; monthly rate = interest charged ÷ balance it
// was charged on, APR = ×12. `avgOwed` is the positive owed balance the interest
// accrued against (current owed is a fair, slightly-conservative proxy).
// Truthful-or-absent: returns { apr:null, source:'none' } when the data shows no
// interest line — the UI then lets the user ENTER a rate (manual is the fallback,
// never an override of a derived one). Pure; asOf injected.
export function deriveApr(transactions, accountId, avgOwed, asOf, windowMonths = 6) {
  const nowMs = asOf instanceof Date ? asOf.getTime() : Number(asOf) || Date.now();
  const sinceMs = nowMs - windowMonths * 30 * DAY_MS;
  let interest = 0, chargeCount = 0;
  const months_ = new Set();
  for (const t of (transactions || [])) {
    if (!t || t.accountId !== accountId || !isInterestCharge(t)) continue;
    const ms = txMs(t);
    if (ms == null || ms < sinceMs || ms > nowMs) continue;
    const a = typeof t.amount === 'number' ? t.amount : Number(t.amount);
    interest += -a; // magnitude of the interest charged
    chargeCount += 1;
    months_.add(monthKey(ms));
  }
  if (chargeCount === 0 || !(avgOwed > 0)) return { apr: null, source: 'none', chargeCount };
  const months = Math.max(1, months_.size); // one interest post per statement month
  const monthlyInterest = interest / months;
  const monthlyRate = monthlyInterest / avgOwed;
  const apr = round2(monthlyRate * 12 * 100); // percent, e.g. 22.99
  // Guard against a nonsense number from a tiny/odd balance; a real card APR is
  // roughly 0–40%. Outside that, treat as not-derivable (fall back to manual).
  if (!(apr > 0) || apr > 60) return { apr: null, source: 'none', chargeCount };
  return { apr, source: 'derived', chargeCount, months };
}

// debtPayoffInsight — the one-call combine used by deriveDebts: the observed pace
// + the truthful payoff for a debt account. `owed` is the positive owed balance.
// Returns everything a row needs to show "paid off ~Mon 'YY at your pace" or the
// honest "balance isn't going down" when new charges keep pace with payments.
export function debtPayoffInsight(transactions, accountId, owed, asOf, windowMonths = 6) {
  const stats = debtPaymentStats(transactions, accountId, asOf, windowMonths);
  const payoff = estimatePayoff(owed, stats.netPaydownPerMonth, asOf);
  return {
    ...stats,
    owed: round2(owed),
    payoffMonths: payoff.months,
    payoffDate: payoff.date,
    onTrack: payoff.onTrack,
    clear: payoff.clear,
    // A debt with real payments but net paydown <= 0: they ARE paying, but new
    // charges cancel it — the family should see that plainly, not a fake date.
    growing: stats.paymentCount > 0 && stats.netPaydownPerMonth <= 0,
    hasPayments: stats.paymentCount > 0,
  };
}

// cardPaymentSuggestions — "you already PAY these; add them as debts to track the
// payoff" (Darrell 2026-07-20 follow-through). The credit cards often aren't in the
// imported feed as accounts — only as recurring autopay PAYMENTS out of checking.
// This finds the recurring OUTGOING payments the categorizer recognizes as a
// debt-payment (card/loan/BNPL/mortgage servicer — the tested lib/categorize rule),
// skips any payee already covered by an existing debt account, and returns each as
// a one-tap "add as a debt" with the observed monthly payment pre-filled (the user
// then enters the total owed, and the timeline computes). Pure; nowMs injected.
export function cardPaymentSuggestions(transactions, accounts = [], opts = {}) {
  const nowMs = opts.nowMs != null ? opts.nowMs : Date.now();
  const learned = opts.learned || null;
  const covered = [];
  for (const a of (accounts || [])) {
    if (a && (a.type === 'credit' || a.type === 'loan' || a.treatAsDebt === true)) {
      const k = payeeKey(a.name || '');
      if (k) covered.push(k);
    }
  }
  // A payment key and an account NAME key rarely match exactly ("chase credit crd
  // autopay 0511" vs "chase credit crd"), so treat one containing the other as the
  // same debt — don't re-suggest a card the family already tracks.
  const isCovered = (pk) => covered.some((c) => pk.includes(c) || c.includes(pk));
  const out = [];
  const seen = new Set();
  for (const g of detectRecurring(transactions || [], { direction: 'out', nowMs })) {
    if (categorize(g.label, { learned }).category !== 'debt-payment') continue;
    const pk = payeeKey(g.label);
    if (!pk || isCovered(pk) || seen.has(pk)) continue;
    seen.add(pk);
    out.push({ label: g.label, payeeKey: pk, monthlyPayment: g.amount, cadence: g.cadence, cadenceLabel: g.cadenceLabel, count: g.count });
  }
  return out;
}

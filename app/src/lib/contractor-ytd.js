// =============================================================================
// contractor-ytd — derive a 1099 contractor's YTD-paid from the REAL ledger
// =============================================================================
// The review (REV-0106 findings) flagged that ytdPaid was HAND-TYPED and could
// drift from what was actually paid — while the app's own promise is "balances are
// derived from the real ledger, not typed by hand, so they stay honest." This
// grounds the 1099-NEC threshold in real money movement: sum the OUTBOUND
// transactions in the tax year whose payee matches the contractor, so "have I
// crossed the filing line?" reads off actual payments, not a guess.
//
// Match is by payeeKey TOKEN-SUBSET (categorize.js payeeKey strips digits/dates/
// punctuation): a transaction belongs to a contractor when EVERY token of the
// contractor's name appears in the transaction's payee key — so "Isaiah Ramos"
// matches "ISAIAH RAMOS PLUMBING 07/15". A too-generic name (one short token) is
// NOT matched (returns null) so a name like "Mike" can't sweep unrelated rows —
// honest-or-absent (DR-0076): we surface a derived figure only when it is safe.
// =============================================================================

import { payeeKey } from './categorize.js';

// The meaningful name tokens for a contractor (>= 2 chars each). Empty when the
// name is blank.
function contractorTokens(contractor) {
  const key = payeeKey((contractor && contractor.name) || '');
  return key.split(' ').filter((t) => t.length >= 2);
}

// True when the name is specific enough to match on safely: at least two tokens,
// OR a single long (>= 6 char) token (e.g. a distinctive business name).
export function isMatchableContractor(contractor) {
  const tokens = contractorTokens(contractor);
  return tokens.length >= 2 || (tokens.length === 1 && tokens[0].length >= 6);
}

// deriveContractorYtdPaid(contractor, transactions, year) -> { ytdPaid, count,
// matchedIds } | null. Sums the ABS of OUTBOUND (negative) transactions in `year`
// whose payee key contains all of the contractor's name tokens. Returns null when
// the name is too generic to match safely (never a misleading number). Pure.
export function deriveContractorYtdPaid(contractor, transactions, year) {
  if (!isMatchableContractor(contractor)) return null;
  const tokens = contractorTokens(contractor);
  const y = String(year);
  let ytdPaid = 0;
  let count = 0;
  const matchedIds = [];
  for (const t of transactions || []) {
    if (!t || !t.date || String(t.date).slice(0, 4) !== y) continue;
    const amt = Number(t.amount) || 0;
    if (amt >= 0) continue; // money PAID OUT only (a 1099 is about what we paid them)
    const tkSet = new Set(payeeKey(t.description || t.desc || '').split(' '));
    if (tokens.every((tok) => tkSet.has(tok))) {
      ytdPaid += -amt;
      count += 1;
      if (t.id != null) matchedIds.push(t.id);
    }
  }
  return { ytdPaid: Math.round(ytdPaid * 100) / 100, count, matchedIds };
}

// The YTD-paid figure to USE for the threshold: the ledger-derived amount when a
// confident match exists (real money movement), else the typed ytdPaid (the old
// behavior, so nothing regresses for un-matchable names). Returns { value,
// source: 'ledger'|'typed', derived } so the UI can show the basis + a divergence
// flag when the typed number disagrees with the ledger.
export function effectiveYtdPaid(contractor, transactions, year) {
  const typed = Number(contractor && contractor.ytdPaid) || 0;
  const derived = deriveContractorYtdPaid(contractor, transactions, year);
  if (derived && derived.count > 0) {
    return { value: derived.ytdPaid, source: 'ledger', derived, typed };
  }
  return { value: typed, source: 'typed', derived, typed };
}

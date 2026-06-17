// account-balances.js — the single source of truth for an account's CURRENT
// balance, computed from the ledger rather than read from a stored literal.
//
// Why this exists: the Books > Tx surface used to read account.balance as a
// frozen number, so "Right now", "after upcoming charges clear", the 30/60/90
// forecast, and the inline per-row balances never moved when transactions
// changed (DR-0076 verification doctrine — a painted number on a trust
// surface is worse than none). Current balance must be DERIVED so any entry
// added (seed or real) flows through to every figure automatically.
//
// Model: current balance = openingBalance + the sum of that account's settled
// history (every transaction dated on or before "today"). openingBalance is
// the reconstructed balance before the account's first listed transaction;
// when an account carries no openingBalance we fall back to its stored
// balance (with an empty ledger the sum is 0, so the value is unchanged).

/**
 * Net of an account's settled transactions (date on or before todayISO).
 * Future-dated rows are excluded — they belong to the forward projection.
 * @param {string} accountId
 * @param {Array<{accountId?:string,date?:string,amount?:number}>} transactions
 * @param {string} todayISO  YYYY-MM-DD
 * @returns {number}
 */
export function settledSum(accountId, transactions, todayISO) {
  let sum = 0;
  for (const t of transactions || []) {
    if (!t || t.accountId !== accountId) continue;
    if (!t.date || t.date > todayISO) continue;
    sum += t.amount || 0;
  }
  return sum;
}

/**
 * Derived current balance for a single account.
 * @param {{id:string,balance?:number,openingBalance?:number}} account
 * @param {Array} transactions
 * @param {string} todayISO
 * @returns {number}
 */
export function accountBalance(account, transactions, todayISO) {
  if (!account) return 0;
  const opening = (account.openingBalance !== undefined && account.openingBalance !== null)
    ? account.openingBalance
    : (account.balance || 0);
  return opening + settledSum(account.id, transactions, todayISO);
}

/**
 * Map of accountId -> derived current balance for every account.
 * This is what the Tx surface reads everywhere a "current balance" is shown.
 * @param {Array} accounts
 * @param {Array} transactions
 * @param {string} todayISO
 * @returns {Object<string, number>}
 */
export function deriveBalances(accounts, transactions, todayISO) {
  const map = {};
  for (const a of accounts || []) {
    map[a.id] = accountBalance(a, transactions, todayISO);
  }
  return map;
}

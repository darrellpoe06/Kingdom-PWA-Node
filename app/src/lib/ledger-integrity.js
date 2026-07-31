// =============================================================================
// ledger-integrity — the proof that the money math holds at years-of-data scale
// =============================================================================
// Darrell 2026-07-05: "how do we prove the math is correct so when real numbers
// are uploaded for years of data it can paint a picture of something that we
// experienced … we want to do amazingly." This engine is that proof, run over
// the REAL ledger on device, every time: a set of deterministic invariants that
// must hold for the financial picture to be trusted, each reporting PASS only
// when the invariant is verified against the actual rows (DR-0076 — green is
// earned, never painted), FAIL when the math genuinely breaks, and REVIEW when
// the data carries something a steward should look at (suspected duplicates,
// unpaired transfers, future-dated rows).
//
// Independence discipline (DR-0076 rule 7): where the app already derives a
// number (deriveAccountBalances, imported-view totals), this engine re-computes
// it a SECOND way — integer cents, separate code path — and compares. Agreement
// between two independent methods is the proof; this file never just re-reads
// the number it is checking.
//
// Pure + React-free so it unit-tests directly and runs at scale (the vitest
// drives it with thousands of synthetic rows across multi-year spans).
// =============================================================================
import { deriveAccountBalances } from './financial-engineering.js';
import { totals as importedTotals, isTransferTxn, isBalanceAdjustment } from './imported-view.js';

// Integer-cents conversion — the same discipline reconciliation.js proved out:
// compare money in cents so float noise can never flip a verdict.
export const toCents = (n) => Math.round((Number(n) || 0) * 100);

const parseDate = (v) => {
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
};

// ---------------------------------------------------------------------------
// Check 1 — balance derivation agrees across two independent methods.
// deriveAccountBalances (float + round2, financial-engineering) vs an integer-
// cents accumulation done here. Any account off by even one cent FAILS.
// ---------------------------------------------------------------------------
export function checkBalanceDerivation(data, asOf = new Date()) {
  const derived = deriveAccountBalances(data, asOf);
  const centsByAccount = {};
  for (const t of data?.transactions || []) {
    if (!t || !t.accountId) continue;
    const d = parseDate(t.date);
    if (!d || d > asOf) continue;
    centsByAccount[t.accountId] = (centsByAccount[t.accountId] || 0) + toCents(t.amount);
  }
  const mismatches = [];
  for (const a of data?.accounts || []) {
    if (!a || a.id == null) continue;
    const openingCents = toCents(a.openingBalance != null ? a.openingBalance : (a.balance || 0));
    const independent = openingCents + (centsByAccount[a.id] || 0);
    const engine = toCents(derived[a.id]);
    if (independent !== engine) {
      mismatches.push(`${a.name || a.id}: engine ${(engine / 100).toFixed(2)} vs independent ${(independent / 100).toFixed(2)}`);
    }
  }
  return {
    key: 'balance-derivation',
    label: 'Account balances — two independent derivations agree to the cent',
    status: mismatches.length ? 'fail' : 'pass',
    detail: mismatches.length
      ? `${mismatches.length} account(s) disagree between the app engine and the independent cents sum.`
      : `${(data?.accounts || []).length} account(s) verified: opening + cleared ledger, computed two separate ways, identical to the cent.`,
    receipts: mismatches.slice(0, 10),
  };
}

// ---------------------------------------------------------------------------
// Check 2 — rollup consistency. The transaction view's IN/OUT/NET must satisfy
// in − out = net, and must match an independent integer-cents recomputation
// (transfers excluded on both sides, mirroring the 2026-07-05 transfer fix;
// balance-adjustment rows likewise — a manual balance correction moves the
// account balance but is not income or spend).
// ---------------------------------------------------------------------------
export function checkRollupConsistency(transactions = []) {
  const view = importedTotals(transactions);
  let inC = 0, outC = 0;
  for (const t of transactions) {
    if (!t || isTransferTxn(t) || isBalanceAdjustment(t)) continue;
    const c = toCents(t.amount);
    if (c > 0) inC += c; else outC += -c;
  }
  const problems = [];
  if (toCents(view.in) !== inC) problems.push(`gross IN: view ${view.in} vs independent ${(inC / 100).toFixed(2)}`);
  if (toCents(view.out) !== outC) problems.push(`gross OUT: view ${view.out} vs independent ${(outC / 100).toFixed(2)}`);
  if (toCents(view.in) - toCents(view.out) !== toCents(view.net)) problems.push(`in − out ≠ net (${view.in} − ${view.out} ≠ ${view.net})`);
  return {
    key: 'rollup-consistency',
    label: 'Gross in / out / net — the view math re-verified in integer cents',
    status: problems.length ? 'fail' : 'pass',
    detail: problems.length
      ? 'The displayed rollup disagrees with the independent recomputation.'
      : `${transactions.length} row(s): in − out = net holds and matches the independent cents sum (transfers + balance adjustments excluded on both sides).`,
    receipts: problems,
  };
}

// ---------------------------------------------------------------------------
// Check 3 — transfer symmetry. Money moved between your own accounts should
// net to zero; a lopsided transfer total means a leg is missing or mislabeled.
// REVIEW (not FAIL) because a transfer to an account you don't track in the
// app legitimately shows one leg.
// ---------------------------------------------------------------------------
export function checkTransferSymmetry(transactions = []) {
  const legs = (transactions || []).filter((t) => t && isTransferTxn(t));
  const netC = legs.reduce((s, t) => s + toCents(t.amount), 0);
  return {
    key: 'transfer-symmetry',
    label: 'Transfers net to zero across their legs',
    status: legs.length === 0 || netC === 0 ? 'pass' : 'review',
    detail: legs.length === 0
      ? 'No transfer rows in the ledger.'
      : netC === 0
        ? `${legs.length} transfer leg(s) net to exactly $0.00 — every move between your accounts is balanced.`
        : `${legs.length} transfer leg(s) net to ${(netC / 100).toFixed(2)} — a leg may be missing (a transfer to an untracked account) or a row is mislabeled as transfer.`,
    receipts: netC === 0 ? [] : legs.slice(0, 10).map((t) => `${t.date} · ${t.description || t.payee || '—'} · ${Number(t.amount).toFixed(2)}`),
  };
}

// ---------------------------------------------------------------------------
// Check 4 — duplicate suspects. Years of imports are where double-uploads hide
// (the 2026-07-02 incident class). Same date + amount + description + account
// under DIFFERENT ids is a suspect, surfaced with receipts for a human call.
// ---------------------------------------------------------------------------
export function checkDuplicateSuspects(transactions = []) {
  const seen = new Map();
  const suspects = [];
  for (const t of transactions || []) {
    if (!t) continue;
    const key = [t.date, toCents(t.amount), (t.description || t.payee || '').trim().toLowerCase(), t.accountId].join('|');
    if (seen.has(key)) suspects.push(`${t.date} · ${(t.description || t.payee || '—')} · ${Number(t.amount).toFixed(2)} (ids ${seen.get(key)} / ${t.id})`);
    else seen.set(key, t.id);
  }
  return {
    key: 'duplicate-suspects',
    label: 'No two rows share date + amount + description + account',
    status: suspects.length ? 'review' : 'pass',
    detail: suspects.length
      ? `${suspects.length} suspected duplicate(s) — same date, amount, description, and account under different ids. Real repeats (two identical coffees) are possible; review before deleting.`
      : 'No duplicate-content rows detected.',
    receipts: suspects.slice(0, 10),
  };
}

// ---------------------------------------------------------------------------
// Check 5 — date sanity. An unparseable date silently drops a row from every
// derived balance (it can't be placed in time) — that is a FAIL because money
// exists that the picture cannot see. Future-dated rows are legitimate
// (scheduled) but excluded from settled balances, so they are surfaced as
// REVIEW with a count.
// ---------------------------------------------------------------------------
export function checkDateSanity(transactions = [], asOf = new Date()) {
  const unparseable = [];
  let future = 0;
  for (const t of transactions || []) {
    if (!t) continue;
    const d = parseDate(t.date);
    if (!d) unparseable.push(`${t.id || '?'} · "${t.date}" · ${t.description || t.payee || '—'}`);
    else if (d > asOf) future++;
  }
  return {
    key: 'date-sanity',
    label: 'Every row carries a real date the picture can place in time',
    status: unparseable.length ? 'fail' : future > 0 ? 'review' : 'pass',
    detail: unparseable.length
      ? `${unparseable.length} row(s) have unparseable dates — they are invisible to every derived balance until fixed.`
      : future > 0
        ? `All dates parse. ${future} future-dated row(s) exist (scheduled — excluded from settled balances by design).`
        : 'All dates parse and none are future-dated.',
    receipts: unparseable.slice(0, 10),
  };
}

// ---------------------------------------------------------------------------
// Check 6 — amount precision. Non-finite amounts are corruption (FAIL);
// sub-cent precision is a REVIEW (real bank data is cents; a 3+-decimal amount
// usually means an import mapping slipped).
// ---------------------------------------------------------------------------
export function checkAmountPrecision(transactions = []) {
  const broken = [];
  const subCent = [];
  for (const t of transactions || []) {
    if (!t) continue;
    const n = Number(t.amount);
    if (!Number.isFinite(n)) broken.push(`${t.id || '?'} · "${t.amount}" · ${t.description || '—'}`);
    else if (Math.abs(n * 100 - Math.round(n * 100)) > 1e-6) subCent.push(`${t.id || '?'} · ${n} · ${t.description || '—'}`);
  }
  return {
    key: 'amount-precision',
    label: 'Every amount is a finite number in whole cents',
    status: broken.length ? 'fail' : subCent.length ? 'review' : 'pass',
    detail: broken.length
      ? `${broken.length} row(s) carry non-numeric amounts — corrupted rows that poison every sum they touch.`
      : subCent.length
        ? `${subCent.length} row(s) carry sub-cent precision — usually an import mapping slip; sums still round correctly.`
        : 'All amounts are finite, cent-precise numbers.',
    receipts: [...broken, ...subCent].slice(0, 10),
  };
}

// ---------------------------------------------------------------------------
// Check 7 — category coverage. Not a math invariant — a picture-quality
// signal: uncategorized money can't be told as a story ("what did these years
// look like") even when every sum is correct.
// ---------------------------------------------------------------------------
export function checkCategoryCoverage(transactions = []) {
  const rows = (transactions || []).filter(Boolean);
  const uncategorized = rows.filter((t) => !t.category);
  const pct = rows.length ? Math.round((100 * (rows.length - uncategorized.length)) / rows.length) : 100;
  return {
    key: 'category-coverage',
    label: 'Rows carry categories so the years can tell their story',
    status: uncategorized.length === 0 ? 'pass' : 'review',
    detail: rows.length === 0
      ? 'No rows yet.'
      : `${pct}% categorized (${uncategorized.length} of ${rows.length} uncategorized). Sums are correct either way; categories are what turn correct sums into an understandable picture.`,
    receipts: [],
  };
}

// ---------------------------------------------------------------------------
// The full run — every invariant over the real data, with the span the ledger
// actually covers (so "years of data" reads as years, verifiably).
// ---------------------------------------------------------------------------
export function runLedgerIntegrity(data, asOf = new Date()) {
  const transactions = data?.transactions || [];
  const checks = [
    checkBalanceDerivation(data, asOf),
    checkRollupConsistency(transactions),
    checkTransferSymmetry(transactions),
    checkDuplicateSuspects(transactions),
    checkDateSanity(transactions, asOf),
    checkAmountPrecision(transactions),
    checkCategoryCoverage(transactions),
  ];
  const dates = transactions.map((t) => parseDate(t?.date)).filter(Boolean).sort((a, b) => a - b);
  const span = dates.length
    ? { first: dates[0].toISOString().slice(0, 10), last: dates[dates.length - 1].toISOString().slice(0, 10), years: Math.round(((dates[dates.length - 1] - dates[0]) / 31557600000) * 10) / 10 }
    : null;
  return {
    checks,
    rows: transactions.length,
    span,
    passed: checks.filter((c) => c.status === 'pass').length,
    failed: checks.filter((c) => c.status === 'fail').length,
    review: checks.filter((c) => c.status === 'review').length,
  };
}

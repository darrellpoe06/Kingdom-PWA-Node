// @vitest-environment node
//
// imported-view — the Books -> Imported feed must present newest-first, be
// bounded to a chosen window, and group into months with honest per-month
// totals (Darrell 2026-07-01: "2026 items aren't showing as the latest ...
// endless scroll with no way to see a week or a month at a time"). These prove
// the fix on real wf18 row shapes: the sort actually reorders newest-on-top,
// the window actually excludes out-of-range rows, and the month totals actually
// sum the rows shown — no painted numbers (DR-0076).
import { describe, it, expect } from 'vitest';
import {
  postedMs, totals, sortByDate, periodRange, effectiveRange, filterByRange, groupByMonth, groupByField,
  monthKeyOf, isMonthKey, monthRange, monthLabelOf, shiftMonthKey, runningBalances, isTransferTxn,
  auditBalanceContinuity, reconcileAccounts, runningBalanceByTxId,
} from '../lib/imported-view.js';

// A slice shaped like wf18's /imported-transactions rows.
const ROWS = [
  { id: 'a', posted: '2025-11-17', amount: -20, name: 'Old charge' },
  { id: 'b', posted: '2025-11-18', amount: 500, name: 'Old deposit' },
  { id: 'c', posted: '2026-06-01', amount: -15, name: 'June charge' },
  { id: 'd', posted: '2026-06-22', amount: 1200, name: 'June deposit' },
  { id: 'e', posted: '2026-06-30', amount: -80, name: 'June late charge' },
];
const NOW = Date.parse('2026-07-01T12:00:00'); // matches the live currentDate

describe('postedMs', () => {
  it('parses YYYY-MM-DD and full ISO, null for junk', () => {
    expect(postedMs({ posted: '2026-06-22' })).toBe(Date.parse('2026-06-22T00:00:00'));
    expect(postedMs({ posted: '2026-06-22T09:30:00Z' })).toBe(Date.parse('2026-06-22T09:30:00Z'));
    expect(postedMs({ posted: 'not-a-date' })).toBe(null);
    expect(postedMs({})).toBe(null);
  });
});

describe('sortByDate — the actual bug: 2026 must land on top', () => {
  it('desc (default) puts the newest transaction first', () => {
    const out = sortByDate(ROWS, 'desc');
    expect(out.map((t) => t.id)).toEqual(['e', 'd', 'c', 'b', 'a']);
    expect(out[0].posted).toBe('2026-06-30');
  });
  it('asc toggle restores oldest-first', () => {
    expect(sortByDate(ROWS, 'asc').map((t) => t.id)).toEqual(['a', 'b', 'c', 'd', 'e']);
  });
  it('is stable on ties and sinks undated rows', () => {
    const tie = [
      { id: 'x', posted: '2026-06-22' },
      { id: 'y', posted: '2026-06-22' },
      { id: 'z', posted: null },
    ];
    expect(sortByDate(tie, 'desc').map((t) => t.id)).toEqual(['x', 'y', 'z']);
  });
});

describe('periodRange / effectiveRange', () => {
  it('This month starts at the 1st of the current month', () => {
    const { sinceMs } = periodRange('month', NOW);
    expect(new Date(sinceMs).getDate()).toBe(1);
    expect(new Date(sinceMs).getMonth()).toBe(6); // July (0-indexed)
  });
  it('This week starts on the most recent Sunday', () => {
    const { sinceMs } = periodRange('week', NOW);
    expect(new Date(sinceMs).getDay()).toBe(0);
  });
  it('Last 30 is a rolling 30-day window anchored to start-of-today', () => {
    const { sinceMs } = periodRange('30d', NOW);
    const startToday = new Date(2026, 6, 1).getTime(); // 2026-07-01 local midnight
    expect(sinceMs).toBe(startToday - 30 * 86400000);
  });
  it('All is unbounded', () => {
    expect(periodRange('all', NOW)).toEqual({ sinceMs: null, untilMs: null });
  });
  it('a custom from/to date range overrides the preset, inclusive of the to-day', () => {
    const r = effectiveRange('all', '2026-06-01', '2026-06-22', NOW);
    expect(r.sinceMs).toBe(Date.parse('2026-06-01T00:00:00'));
    expect(r.untilMs).toBe(Date.parse('2026-06-22T23:59:59.999'));
  });
});

describe('filterByRange — the window actually excludes out-of-range rows', () => {
  it('Last 30 (from 2026-07-01) drops the 2025 rows, keeps June', () => {
    const { sinceMs, untilMs } = periodRange('30d', NOW);
    const kept = filterByRange(ROWS, sinceMs, untilMs).map((t) => t.id);
    expect(kept).toEqual(['c', 'd', 'e']);
  });
  it('This month (July, after the data ends) is honestly empty', () => {
    const { sinceMs, untilMs } = periodRange('month', NOW);
    expect(filterByRange(ROWS, sinceMs, untilMs)).toEqual([]);
  });
  it('All keeps every row', () => {
    expect(filterByRange(ROWS, null, null)).toHaveLength(5);
  });
  it('a custom range keeps only rows inside it', () => {
    const r = effectiveRange('all', '2025-11-01', '2025-11-30', NOW);
    expect(filterByRange(ROWS, r.sinceMs, r.untilMs).map((t) => t.id)).toEqual(['a', 'b']);
  });
});

describe('totals — per-window numbers are summed from the rows, never painted', () => {
  it('splits in / out / net correctly', () => {
    expect(totals(ROWS)).toEqual({ in: 1700, out: 115, net: 1585, count: 5 });
  });
  it('an empty set is an honest zero', () => {
    expect(totals([])).toEqual({ in: 0, out: 0, net: 0, count: 0 });
  });
  it('rounds in/out/net to cents (float drift never leaks into a displayed total)', () => {
    // 0.1 + 0.2 = 0.30000000000000004 unrounded — the audit flagged totals()
    // as the only unrounded rollup.
    const t = totals([{ id: 'p', amount: 0.1 }, { id: 'q', amount: 0.2 }]);
    expect(t.in).toBe(0.3);
    expect(t.net).toBe(0.3);
  });
});

// The confirmed defect: internal transfers (moving money between the family's
// own accounts) were summed into gross In and gross Out, inflating both and
// mislabeling them in reports. Rows mark transfers two real ways — the seed /
// BooksTransactions / categorize.js rows via category 'transfer', the synced
// verified ledger via isTransfer (transactions-sync.js maps is_transfer).
const TRANSFER_PAIR = [
  { id: 'xf-out', posted: '2026-06-12', amount: -500, name: 'Online Transfer to Savings', category: 'transfer' },
  { id: 'xf-in', posted: '2026-06-12', amount: 500, name: 'Online Transfer from Checking', isTransfer: true },
];

describe('isTransferTxn — recognizes both real transfer markers', () => {
  it('true for category transfer, true for the isTransfer flag, false otherwise', () => {
    expect(isTransferTxn({ category: 'transfer', amount: -500 })).toBe(true);
    expect(isTransferTxn({ isTransfer: true, amount: 500 })).toBe(true);
    expect(isTransferTxn({ category: 'groceries', amount: -50 })).toBe(false);
    expect(isTransferTxn({ amount: 100 })).toBe(false);
    expect(isTransferTxn(null)).toBe(false);
  });
});

describe('totals — internal transfers do NOT inflate gross In / Out', () => {
  it('a balanced +500/-500 transfer pair is excluded from In, Out, and Net', () => {
    const t = totals([...ROWS, ...TRANSFER_PAIR]);
    expect(t.in).toBe(1700);   // NOT 2200 — the transfer credit is not money in
    expect(t.out).toBe(115);   // NOT 615 — the transfer debit is not money out
    expect(t.net).toBe(1585);  // unchanged: the pair cancels, and both legs are excluded
    expect(t.count).toBe(7);   // the rows are still real rows in the set
  });
  it('a one-sided transfer (other leg outside the window) still stays out of In/Out/Net', () => {
    const t = totals([...ROWS, TRANSFER_PAIR[0]]);
    expect(t.in).toBe(1700);
    expect(t.out).toBe(115);
    expect(t.net).toBe(1585); // net over MOVEMENTS, not over transfer legs
  });
});

describe('groupByMonth — month subtotals exclude internal transfers too', () => {
  it('the June group In/Out ignore the transfer pair while its rows still render', () => {
    const groups = groupByMonth(sortByDate([...ROWS, ...TRANSFER_PAIR], 'desc'));
    const june = groups.find((g) => g.key === '2026-06');
    expect(june.rows).toHaveLength(5); // 3 June movements + the 2 transfer legs, all visible
    expect(june.totals.in).toBe(1200);  // NOT 1700
    expect(june.totals.out).toBe(95);   // NOT 595
    expect(june.totals.net).toBe(1105);
  });
});

describe('groupByMonth — collapsible months with real totals, newest first', () => {
  it('groups desc-sorted rows newest-month-first with summed totals', () => {
    const groups = groupByMonth(sortByDate(ROWS, 'desc'));
    expect(groups.map((g) => g.key)).toEqual(['2026-06', '2025-11']);
    expect(groups[0].label).toBe('June 2026');
    expect(groups[0].rows).toHaveLength(3);
    // June: +1200 in, 15 + 80 = 95 out
    expect(groups[0].totals).toEqual({ in: 1200, out: 95, net: 1105, count: 3 });
    // Nov 2025: +500 in, 20 out
    expect(groups[1].totals).toEqual({ in: 500, out: 20, net: 480, count: 2 });
  });
  it('undated rows collect into a trailing group', () => {
    const groups = groupByMonth([{ id: 'u', posted: null, amount: 5 }]);
    expect(groups[0].key).toBe('undated');
  });
});

describe('Last Month segment', () => {
  it('is the whole previous calendar month (bounded both ends)', () => {
    const r = periodRange('lastMonth', NOW); // NOW = 2026-07-01
    expect(new Date(r.sinceMs).getMonth()).toBe(5); // June
    expect(new Date(r.sinceMs).getDate()).toBe(1);
    // untilMs is the last instant of June -> filtering keeps June, drops July + May
    const rows = [
      { id: 'may', posted: '2026-05-31', amount: 1 },
      { id: 'jun1', posted: '2026-06-01', amount: 1 },
      { id: 'jun30', posted: '2026-06-30', amount: 1 },
      { id: 'jul', posted: '2026-07-01', amount: 1 },
    ];
    expect(filterByRange(rows, r.sinceMs, r.untilMs).map(t => t.id)).toEqual(['jun1', 'jun30']);
  });
});

describe('quick month jump (the Mint/YNAB month stepper)', () => {
  it('monthKeyOf / isMonthKey / monthLabelOf round-trip', () => {
    expect(monthKeyOf(Date.parse('2026-06-22T00:00:00'))).toBe('2026-06');
    expect(isMonthKey('2026-06')).toBe(true);
    expect(isMonthKey('all')).toBe(false);
    expect(monthLabelOf('2026-06')).toBe('June 2026');
  });
  it('shiftMonthKey steps across year boundaries', () => {
    expect(shiftMonthKey('2026-06', -1)).toBe('2026-05');
    expect(shiftMonthKey('2026-01', -1)).toBe('2025-12');
    expect(shiftMonthKey('2026-12', 1)).toBe('2027-01');
  });
  it('monthRange bounds a single calendar month', () => {
    const r = monthRange('2026-06');
    const rows = [
      { id: 'may', posted: '2026-05-31', amount: 1 },
      { id: 'jun', posted: '2026-06-15', amount: 1 },
      { id: 'jul', posted: '2026-07-01', amount: 1 },
    ];
    expect(filterByRange(rows, r.sinceMs, r.untilMs).map(t => t.id)).toEqual(['jun']);
  });
});

describe('runningBalances — the statement Balance column, truthful', () => {
  it('newest row shows opening + all posted amounts (= current balance); order-independent input', () => {
    const opening = 100;
    const rows = [
      { id: 'r3', posted: '2026-06-30', amount: -80 },
      { id: 'r1', posted: '2026-06-10', amount: 500 },   // deliberately out of order
      { id: 'r2', posted: '2026-06-20', amount: -50 },
    ];
    const bal = runningBalances(rows, opening);
    // walk oldest->newest: 100+500=600, 600-50=550, 550-80=470
    expect(bal.get('r1')).toBe(600);
    expect(bal.get('r2')).toBe(550);
    expect(bal.get('r3')).toBe(470); // newest = current balance
  });
  it('handles a non-numeric amount as zero (never NaN-poisons the running total)', () => {
    const bal = runningBalances([{ id: 'x', posted: '2026-06-01', amount: 'oops' }], 200);
    expect(bal.get('x')).toBe(200);
  });
});

describe('groupByField — repeated payees roll up to ONE subtotaled group', () => {
  // Darrell's Salary view: several identical University of IL Payroll rows + others.
  const SALARY = [
    { id: 'u1', name: 'University of IL Payroll', amount: 2099.93 },
    { id: 'u2', name: 'University of IL Payroll', amount: 2099.93 },
    { id: 'u3', name: 'University of IL Payroll', amount: 2099.93 },
    { id: 't1', name: 'TLC Therapy', amount: 1500 },
    { id: 'c1', name: 'Church of the Living God Payroll', amount: 800 },
    { id: 's1', name: 'State of IL Payroll', amount: 1200 },
  ];

  it('each group total is the deterministic sum of its rows, and ties out to the overall total', () => {
    const groups = groupByField(SALARY, (r) => r.name);
    const uofi = groups.find((g) => g.key === 'University of IL Payroll');
    expect(uofi.rows).toHaveLength(3);
    expect(uofi.totals.in).toBeCloseTo(6299.79, 2);   // 3 × 2099.93 rolled up
    expect(uofi.totals.count).toBe(3);
    // sum of every group's net === the overall total (subtotals reconcile)
    const overall = totals(SALARY);
    const summed = groups.reduce((s, g) => s + g.totals.net, 0);
    expect(summed).toBeCloseTo(overall.net, 2);
  });

  it('orders groups biggest-first by magnitude (where the money is)', () => {
    const groups = groupByField(SALARY, (r) => r.name);
    expect(groups.map((g) => g.key)).toEqual([
      'University of IL Payroll',        // 6299.79
      'TLC Therapy',                     // 1500
      'State of IL Payroll',             // 1200
      'Church of the Living God Payroll' // 800
    ]);
  });

  it('splits in/out per group (a refund inside a payee nets correctly)', () => {
    const rows = [
      { id: 'a', name: 'Store', amount: -100 },
      { id: 'b', name: 'Store', amount: -40 },
      { id: 'c', name: 'Store', amount: 25 }, // refund
    ];
    const [store] = groupByField(rows, (r) => r.name);
    expect(store.totals).toEqual({ in: 25, out: 140, net: -115, count: 3 });
  });

  it('a null/blank key collects under a single "—" group; labelFn maps labels', () => {
    const rows = [{ id: 'x', cat: null, amount: 5 }, { id: 'y', cat: '', amount: 3 }, { id: 'z', cat: 'food', amount: 2 }];
    const groups = groupByField(rows, (r) => r.cat, { labelFn: (k) => (k === '—' ? 'Uncategorized' : k) });
    const dash = groups.find((g) => g.key === '—');
    expect(dash.rows).toHaveLength(2);
    expect(dash.label).toBe('Uncategorized');
  });
});

// auditBalanceContinuity — the quantitative integrity engine (Christina's books).
// It proves ONE account's ledger is complete and un-double-counted using ONLY the
// bank's own running balances, order-independently. Proven-to-catch: a dropped row
// and a double-counted row each break the chain; a clean chain (even with a genuine
// same-amount repeat) passes and reports the real opening + closing.
describe('auditBalanceContinuity', () => {
  // A clean chain: opening 900, then -20, +500, -80  ->  880, 1380, 1300.
  const CHAIN = [
    { id: '1', date: '2026-06-01', amount: -20, balance: 880 },
    { id: '2', date: '2026-06-02', amount: 500, balance: 1380 },
    { id: '3', date: '2026-06-03', amount: -80, balance: 1300 },
  ];
  it('passes a complete chain and reports the real opening + closing', () => {
    const res = auditBalanceContinuity(CHAIN);
    expect(res.ok).toBe(true);
    expect(res.checked).toBe(3);
    expect(res.opening).toBe(900);   // 880 - (-20)
    expect(res.closing).toBe(1300);  // newest balance
  });
  it('passes even with a GENUINE same-day same-amount repeat (different balances)', () => {
    const rows = [
      { id: '1', date: '2026-07-17', amount: 200, balance: 1000 },
      { id: '2', date: '2026-07-17', amount: 200, balance: 1200 }, // real 2nd deposit
    ];
    const res = auditBalanceContinuity(rows);
    expect(res.ok).toBe(true);
    expect(res.opening).toBe(800);
    expect(res.closing).toBe(1200);
  });
  it('CATCHES a dropped transaction (chain splits — more than one unmatched balance)', () => {
    const dropped = [CHAIN[0], CHAIN[2]]; // the +500 row is missing
    const res = auditBalanceContinuity(dropped);
    expect(res.ok).toBe(false);
    // The gap is bracketed: 880 (after row 1) and 1380 (before row 3) don't meet.
    expect(res.breaks.unmatchedAfter).toContain(880);
    expect(res.breaks.unmatchedBefore).toContain(1380);
  });
  it('CATCHES a double-counted transaction (same row twice breaks the chain)', () => {
    const dup = [CHAIN[0], CHAIN[1], CHAIN[1], CHAIN[2]]; // row 2 imported twice
    const res = auditBalanceContinuity(dup);
    expect(res.ok).toBe(false);
  });
  it('float-safe: cents that would drift under + still reconcile', () => {
    const rows = [
      { id: '1', date: '2026-06-01', amount: 0.1, balance: 0.1 },
      { id: '2', date: '2026-06-02', amount: 0.2, balance: 0.3 }, // 0.1+0.2 !== 0.3 in float
    ];
    const res = auditBalanceContinuity(rows);
    expect(res.ok).toBe(true);
    expect(res.closing).toBe(0.3);
  });
  it('is honest when there is no balance data to audit (never a fake pass)', () => {
    const res = auditBalanceContinuity([{ id: '1', date: '2026-06-01', amount: -20 }]);
    expect(res.ok).toBe(true);
    expect(res.reason).toMatch(/not enough balance/);
  });
});

describe('runningBalanceByTxId — a per-row balance that CHANGES date to date', () => {
  const accounts = [{ id: 'A', openingBalance: 1000 }];
  it('uses the bank imported balance per row when present (authoritative, distinct per row)', () => {
    const txns = [
      { id: 't1', accountId: 'A', date: '2026-06-01', amount: -20, balance: 980 },
      { id: 't2', accountId: 'A', date: '2026-06-02', amount: 500, balance: 1480 },
      { id: 't3', accountId: 'A', date: '2026-06-03', amount: -80, balance: 1400 },
    ];
    const map = runningBalanceByTxId(txns, accounts);
    expect(map.t1).toBe(980);
    expect(map.t2).toBe(1480);
    expect(map.t3).toBe(1400);
    // the whole point: NOT the same number on every row
    expect(new Set([map.t1, map.t2, map.t3]).size).toBe(3);
  });
  it('computes a running balance from opening when rows have NO bank balance', () => {
    const txns = [
      { id: 't1', accountId: 'A', date: '2026-06-01', amount: -20 },
      { id: 't2', accountId: 'A', date: '2026-06-02', amount: 500 },
      { id: 't3', accountId: 'A', date: '2026-06-03', amount: -80 },
    ];
    const map = runningBalanceByTxId(txns, accounts);
    expect(map.t1).toBe(980);   // 1000 - 20
    expect(map.t2).toBe(1480);  // 980 + 500
    expect(map.t3).toBe(1400);  // 1480 - 80
  });
  it('chains a manual (no-balance) row off the last bank balance', () => {
    const txns = [
      { id: 't1', accountId: 'A', date: '2026-06-01', amount: -20, balance: 980 },
      { id: 't2', accountId: 'A', date: '2026-06-02', amount: -30 }, // no bank balance
    ];
    const map = runningBalanceByTxId(txns, accounts);
    expect(map.t1).toBe(980);
    expect(map.t2).toBe(950);   // chained off 980
  });
  it('is float-safe (0.1 + 0.2 kind of drift)', () => {
    const map = runningBalanceByTxId([
      { id: 't1', accountId: 'A', date: '2026-06-01', amount: 0.1 },
      { id: 't2', accountId: 'A', date: '2026-06-02', amount: 0.2 },
    ], [{ id: 'A', openingBalance: 0 }]);
    expect(map.t2).toBe(0.3);
  });
});

describe('reconcileAccounts — correct account of record', () => {
  it('audits each account independently and flags the one that does not reconcile', () => {
    const txns = [
      // account A — a clean chain (opening 900): -20 -> 880, +500 -> 1380
      { id: 'a1', accountId: 'A', date: '2026-06-01', amount: -20, balance: 880 },
      { id: 'a2', accountId: 'A', date: '2026-06-02', amount: 500, balance: 1380 },
      // account B — a broken chain (a row misfiled/missing): balances don't meet
      { id: 'b1', accountId: 'B', date: '2026-06-01', amount: -10, balance: 200 },
      { id: 'b2', accountId: 'B', date: '2026-06-03', amount: -10, balance: 50 }, // 200-10 != 50
    ];
    const rec = reconcileAccounts(txns);
    expect(rec.A.ok).toBe(true);
    expect(rec.A.opening).toBe(900);
    expect(rec.B.ok).toBe(false); // the misfiled/missing row is caught, per account
  });
  it('ignores rows with no accountId and returns {} for an empty ledger', () => {
    expect(reconcileAccounts([{ id: 'x', amount: 5 }])).toEqual({});
    expect(reconcileAccounts([])).toEqual({});
  });
});

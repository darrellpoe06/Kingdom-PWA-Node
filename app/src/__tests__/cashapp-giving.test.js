// Cash App giving: read, split, propose, report (DR-0362).
//
// Requirements spoken into the app 2026-09-11 by the Love Corner finance
// steward and the church office. The one that governs every assertion here:
//
//   "we get thousands of dollars... so applying it to the RIGHT person."
//
// A gift on the wrong member's record is this feature's only real failure
// mode, so the tests are weighted toward refusing to guess, refusing to drop a
// row, and refusing to let a total that does not tie look like one that does.
import { describe, it, expect } from 'vitest';
import {
  parseCashAppStatement, giftsOf, payoutsOf, classifyKind,
  parseSignedCents, parseStatementMoment, KIND, REJECT,
} from '../lib/cashapp-statement.js';
import {
  planGivingBatch, reconcileBatch, batchGiftsByPayout, summarizeBatches, DRIFT,
} from '../lib/giving-batch.js';
import {
  normalizeName, matchBasis, proposeDonorMatches, attachProposals,
  confirmAlias, forgetAlias, reviewQueue, BASIS, CONFIDENCE,
} from '../lib/giving-donor-match.js';
import {
  givingByMonthReport, givingByGiverReport, giverStatement,
  batchReconciliationReport, reportToCsv,
} from '../lib/giving-reports.js';

// The documented Cash App export header. Its exact spelling is an assumption
// until a real church export is read (see the module header) -- which is
// exactly why the reader is header-driven and why the mismatch test below
// exists.
const HEADER = [
  'Transaction ID', 'Date', 'Transaction Type', 'Currency', 'Amount', 'Fee',
  'Net Amount', 'Status', 'Notes', 'Name of sender/receiver', 'Account',
];

const row = (o) => [
  o.id || '', o.date || '', o.type || '', o.currency == null ? 'USD' : o.currency,
  o.amount || '', o.fee == null ? '0' : o.fee, o.net == null ? '' : o.net,
  o.status == null ? 'Complete' : o.status, o.note || '', o.who || '', o.account || '',
];

// The meeting's own example: persons a, b and c totalling one thousand
// dollars, moved to the bank as ONE transfer.
const MEETING_ROWS = [
  row({ id: 'T1', date: '2026-08-02 10:15:00', type: 'Payment Received', amount: '$400.00', who: 'Person A', note: 'Tithe' }),
  row({ id: 'T2', date: '2026-08-03 18:42:00', type: 'Payment Received', amount: '$350.00', who: 'Person B', note: 'Building fund' }),
  row({ id: 'T3', date: '2026-08-04 09:05:00', type: 'Payment Received', amount: '$250.00', who: 'Person C', note: '' }),
  row({ id: 'T4', date: '2026-08-05 12:00:00', type: 'Cash Out', amount: '-$1,000.00', who: 'Chase ****1234' }),
];

// ---------------------------------------------------------------------------
describe('money and moments', () => {
  it('reads every sign convention a real export uses', () => {
    expect(parseSignedCents('$1,000.00')).toBe(100000);
    expect(parseSignedCents('-$25.50')).toBe(-2550);
    expect(parseSignedCents('(25.50)')).toBe(-2550);
    expect(parseSignedCents('25.50-')).toBe(-2550);
    expect(parseSignedCents(' 0.07 ')).toBe(7);
    expect(parseSignedCents('0')).toBe(0); // a fee column prints real zeros
  });

  it('refuses text rather than turning it into a number', () => {
    for (const bad of ['', null, undefined, 'n/a', '--', 'pending', '.']) {
      expect(parseSignedCents(bad), String(bad)).toBeNull();
    }
  });

  it('never loses a cent to floating point', () => {
    // 0.1 + 0.2 in floats is the classic; in cents it is just 30.
    const total = ['0.10', '0.20', '1.15', '2.05'].reduce((a, s) => a + parseSignedCents(s), 0);
    expect(total).toBe(350);
  });

  it('keeps the date AND the time, because the steward asked for both', () => {
    expect(parseStatementMoment('2026-08-02 10:15:00')).toMatchObject({ date: '2026-08-02', time: '10:15' });
    expect(parseStatementMoment('8/2/26 6:42 PM')).toMatchObject({ date: '2026-08-02', time: '18:42' });
    expect(parseStatementMoment('Aug 2, 2026')).toMatchObject({ date: '2026-08-02', time: null });
    expect(parseStatementMoment('12:05 AM 2026-08-02')).toMatchObject({ date: '2026-08-02', time: '00:05' });
  });

  it('a late-evening gift keeps its own day (no timezone shift out of its month)', () => {
    // 11:50pm on the 31st must not become the 1st of the next month.
    expect(parseStatementMoment('2026-08-31 23:50:00')).toMatchObject({ date: '2026-08-31', time: '23:50' });
  });
});

// ---------------------------------------------------------------------------
describe('the reader classifies, and never drops a row', () => {
  it('reads the meeting’s own example', () => {
    const p = parseCashAppStatement({ header: HEADER, rows: MEETING_ROWS });
    expect(p.recognized).toBe(true);
    expect(p.reconciliation.balanced).toBe(true);
    expect(giftsOf(p).map((g) => g.giver)).toEqual(['Person A', 'Person B', 'Person C']);
    expect(giftsOf(p).map((g) => g.grossCents)).toEqual([40000, 35000, 25000]);
    expect(payoutsOf(p)).toHaveLength(1);
    expect(payoutsOf(p)[0].grossCents).toBe(-100000);
  });

  it('carries the note and the time onto each gift', () => {
    const g = giftsOf(parseCashAppStatement({ header: HEADER, rows: MEETING_ROWS }));
    expect(g[0]).toMatchObject({ note: 'Tithe', date: '2026-08-02', time: '10:15', txnId: 'T1' });
    expect(g[1].note).toBe('Building fund');
    expect(g[2].note).toBe(''); // no note is no note, not a made-up one
  });

  it('THE GATE: accepted + rejected always equals the source row count', () => {
    const messy = [
      ...MEETING_ROWS,
      [], // blank
      HEADER, // a repeated header, as paged exports emit
      ['Total', '', '', '', '', '', '', '', '', '', ''],
      row({ id: 'T9', date: 'not a date', type: 'Payment Received', amount: '$5.00', who: 'X' }),
      row({ id: 'T10', date: '2026-08-06', type: 'Payment Received', amount: 'n/a', who: 'Y' }),
    ];
    const p = parseCashAppStatement({ header: HEADER, rows: messy });
    expect(p.reconciliation.sourceRows).toBe(messy.length);
    expect(p.reconciliation.accepted + p.reconciliation.rejected).toBe(messy.length);
    expect(p.reconciliation.balanced).toBe(true);
    expect(p.rejected.map((r) => r.reason)).toEqual([
      REJECT.BLANK, REJECT.HEADER, REJECT.SUBTOTAL, REJECT.NO_DATE, REJECT.NO_AMOUNT,
    ]);
  });

  it('a top-up from the church’s own bank is NOT giving', () => {
    const p = parseCashAppStatement({ header: HEADER, rows: [
      row({ id: 'A', date: '2026-08-01', type: 'Cash In', amount: '$500.00', who: 'Chase ****1234' }),
      row({ id: 'B', date: '2026-08-02', type: 'Payment Received', amount: '$50.00', who: 'Person A' }),
    ] });
    expect(p.rows.find((r) => r.txnId === 'A').kind).toBe(KIND.TOPUP);
    // The congregation gave $50, not $550.
    expect(giftsOf(p).reduce((a, g) => a + g.grossCents, 0)).toBe(5000);
  });

  it('money the church SENT out is never counted as giving', () => {
    const p = parseCashAppStatement({ header: HEADER, rows: [
      row({ id: 'S', date: '2026-08-02', type: 'Sent Payment', amount: '-$120.00', who: 'Sound Guy' }),
    ] });
    expect(p.rows[0].kind).toBe(KIND.SENT);
    expect(giftsOf(p)).toHaveLength(0);
  });

  it('a refund is its own kind, not a silent disappearance', () => {
    const p = parseCashAppStatement({ header: HEADER, rows: [
      row({ id: 'R', date: '2026-08-09', type: 'Refund', amount: '-$40.00', who: 'Person A' }),
    ] });
    expect(p.rows[0].kind).toBe(KIND.REFUND);
  });

  it('an unrecognised type is COUNTED as other, never dropped', () => {
    const p = parseCashAppStatement({ header: HEADER, rows: [
      row({ id: 'Z', date: '2026-08-09', type: 'Something New Cash App Invented', amount: '0', who: '' }),
    ] });
    expect(p.rows).toHaveLength(1);
    expect(p.rows[0].kind).toBe(KIND.OTHER);
    expect(p.reconciliation.balanced).toBe(true);
  });

  it('a pending or failed payment is rejected — it never landed', () => {
    for (const status of ['Pending', 'Failed', 'Cancelled', 'Declined']) {
      const p = parseCashAppStatement({ header: HEADER, rows: [
        row({ id: 'P', date: '2026-08-09', type: 'Payment Received', amount: '$99.00', who: 'A', status }),
      ] });
      expect(giftsOf(p), status).toHaveLength(0);
      expect(p.rejected[0].reason).toBe(REJECT.NOT_COMPLETE);
    }
  });

  it('a non-dollar row is refused rather than folded into a dollar total', () => {
    const p = parseCashAppStatement({ header: HEADER, rows: [
      row({ id: 'B', date: '2026-08-09', type: 'Payment Received', amount: '0.004', who: 'A', currency: 'BTC' }),
    ] });
    expect(p.rejected[0].reason).toBe(REJECT.NOT_USD);
  });

  it('a fee is kept as a magnitude whichever way the export signs it', () => {
    const a = parseCashAppStatement({ header: HEADER, rows: [row({ date: '2026-08-09', type: 'Payment Received', amount: '$100.00', fee: '1.75', who: 'A' })] });
    const b = parseCashAppStatement({ header: HEADER, rows: [row({ date: '2026-08-09', type: 'Payment Received', amount: '$100.00', fee: '-1.75', who: 'A' })] });
    expect(a.rows[0].feeCents).toBe(175);
    expect(b.rows[0].feeCents).toBe(175);
    expect(a.rows[0].netCents).toBe(9825);
  });

  it('the statement’s own net figure wins over our arithmetic', () => {
    const p = parseCashAppStatement({ header: HEADER, rows: [
      row({ date: '2026-08-09', type: 'Payment Received', amount: '$100.00', fee: '1.75', net: '98.25', who: 'A' }),
    ] });
    expect(p.rows[0].netCents).toBe(9825);
  });

  it('reads columns by NAME, so a reordered or renamed export still works', () => {
    const reordered = ['Amount', 'Name of sender/receiver', 'Notes', 'Date', 'Transaction Type'];
    const p = parseCashAppStatement({
      header: reordered,
      rows: [['$75.00', 'Person D', 'Offering', '2026-08-10 11:00', 'Payment Received']],
    });
    expect(p.recognized).toBe(true);
    expect(giftsOf(p)[0]).toMatchObject({ giver: 'Person D', note: 'Offering', grossCents: 7500 });
  });

  it('an unreadable layout says so and reads NOTHING (never guesses by position)', () => {
    const p = parseCashAppStatement({
      header: ['Col1', 'Col2', 'Col3'],
      rows: [['2026-08-01', '100', 'Person A']],
    });
    expect(p.recognized).toBe(false);
    expect(p.missingRoles).toEqual(['date', 'amount']);
    expect(p.rows).toHaveLength(0);
    // The headers it SAW come back, so the mismatch is one line to read.
    expect(p.headerSeen).toEqual(['Col1', 'Col2', 'Col3']);
  });

  it('contradictory wording and sign falls through to the sign, visibly', () => {
    // "Cash Out" with money arriving is nonsense; trust the sign, do not
    // silently honour wording that contradicts the arithmetic.
    expect(classifyKind('Cash Out', 5000)).toBe(KIND.GIFT);
    expect(classifyKind('Cash In', -5000)).toBe(KIND.SENT);
    expect(classifyKind('', 5000)).toBe(KIND.GIFT);
    expect(classifyKind('', -5000)).toBe(KIND.SENT);
  });
});

// ---------------------------------------------------------------------------
describe('the split: one deposit back into the people who gave it', () => {
  const parsed = () => parseCashAppStatement({ header: HEADER, rows: MEETING_ROWS });

  it('the meeting’s $1,000 becomes three named claims that tie exactly', () => {
    const p = parsed();
    const { batch, claims, reconciliation } = planGivingBatch({ gifts: giftsOf(p), payout: payoutsOf(p)[0] });
    expect(claims).toHaveLength(3);
    expect(claims.map((c) => c.giverName)).toEqual(['Person A', 'Person B', 'Person C']);
    expect(claims.map((c) => c.amountClaimedCents)).toEqual([40000, 35000, 25000]);
    expect(reconciliation.depositCents).toBe(100000);
    expect(reconciliation.giftsNetCents).toBe(100000);
    expect(reconciliation.differenceCents).toBe(0);
    expect(reconciliation.balanced).toBe(true);
    expect(reconciliation.status).toBe(DRIFT.CLEAN);
    expect(batch.onlineBatchId).toBe('T4');
    expect(batch.giftCount).toBe(3);
  });

  it('every claim carries the date, the time, the note and the schema’s own values', () => {
    const p = parsed();
    const { claims } = planGivingBatch({ gifts: giftsOf(p), payout: payoutsOf(p)[0] });
    expect(claims[0]).toMatchObject({
      givenOn: '2026-08-02', givenAt: '10:15', note: 'Tithe', txnId: 'T1',
      method: 'online', claimKind: 'reconciled-from-online', claimStatus: 'pending',
      parishionerId: null, needsReview: true,
    });
  });

  it('an imported claim is NEVER born verified', () => {
    const p = parsed();
    const { claims } = planGivingBatch({ gifts: giftsOf(p), payout: payoutsOf(p)[0] });
    for (const c of claims) {
      expect(c.claimStatus).toBe('pending');
      expect(c.parishionerId).toBeNull();
      expect(c.needsReview).toBe(true);
    }
  });

  it('a short deposit is REPORTED, never balanced for us', () => {
    const p = parseCashAppStatement({ header: HEADER, rows: [
      ...MEETING_ROWS.slice(0, 3),
      row({ id: 'T4', date: '2026-08-05', type: 'Cash Out', amount: '-$900.00' }),
    ] });
    const { reconciliation } = planGivingBatch({ gifts: giftsOf(p), payout: payoutsOf(p)[0] });
    expect(reconciliation.balanced).toBe(false);
    expect(reconciliation.status).toBe(DRIFT.GIFTS_EXCEED_DEPOSIT);
    expect(reconciliation.differenceCents).toBe(10000);
    expect(reconciliation.explanation).toMatch(/\$100\.00 MORE than the deposit/);
    // Nothing was adjusted to make it agree.
    expect(reconciliation.giftsNetCents).toBe(100000);
    expect(reconciliation.depositCents).toBe(90000);
  });

  it('a deposit bigger than the gifts is its own distinct finding', () => {
    const p = parseCashAppStatement({ header: HEADER, rows: [
      MEETING_ROWS[0],
      row({ id: 'T4', date: '2026-08-05', type: 'Cash Out', amount: '-$450.00' }),
    ] });
    const { reconciliation } = planGivingBatch({ gifts: giftsOf(p), payout: payoutsOf(p)[0] });
    expect(reconciliation.status).toBe(DRIFT.DEPOSIT_EXCEEDS_GIFTS);
    expect(reconciliation.differenceCents).toBe(-5000);
    expect(reconciliation.explanation).toMatch(/not explained by this statement/);
  });

  it('ONE CENT of drift is drift — there is no tolerance band', () => {
    const r = reconcileBatch({ depositCents: 100000, giftsNetCents: 100001, claimCount: 3 });
    expect(r.balanced).toBe(false);
    expect(r.differenceCents).toBe(1);
  });

  it('gifts with no transfer yet are "not yet deposited", not a drift', () => {
    const p = parseCashAppStatement({ header: HEADER, rows: MEETING_ROWS.slice(0, 3) });
    const { reconciliation } = planGivingBatch({ gifts: giftsOf(p), payout: null });
    expect(reconciliation.status).toBe(DRIFT.NOT_YET_DEPOSITED);
    expect(reconciliation.balanced).toBe(false);
    expect(reconciliation.explanation).toMatch(/Nothing is missing/);
    expect(reconciliation.giftsNetCents).toBe(100000);
  });

  it('fees are visible: the member gave gross, the church received net', () => {
    const p = parseCashAppStatement({ header: HEADER, rows: [
      row({ id: 'G', date: '2026-08-02', type: 'Payment Received', amount: '$100.00', fee: '1.75', net: '98.25', who: 'Person A' }),
      row({ id: 'O', date: '2026-08-03', type: 'Cash Out', amount: '-$98.25' }),
    ] });
    const { claims, reconciliation } = planGivingBatch({ gifts: giftsOf(p), payout: payoutsOf(p)[0] });
    expect(claims[0].grossCents).toBe(10000);
    expect(claims[0].feeCents).toBe(175);
    expect(claims[0].amountClaimedCents).toBe(9825);
    expect(reconciliation.balanced).toBe(true);
  });

  describe('a month of mixed activity resolves into batches that each tie', () => {
    const MONTH = [
      row({ id: 'g1', date: '2026-08-02 09:00', type: 'Payment Received', amount: '$100.00', who: 'A' }),
      row({ id: 'g2', date: '2026-08-03 09:00', type: 'Payment Received', amount: '$200.00', who: 'B' }),
      row({ id: 'p1', date: '2026-08-04 09:00', type: 'Cash Out', amount: '-$300.00' }),
      row({ id: 'g3', date: '2026-08-10 09:00', type: 'Payment Received', amount: '$50.00', who: 'C' }),
      row({ id: 'p2', date: '2026-08-11 09:00', type: 'Cash Out', amount: '-$50.00' }),
      row({ id: 'g4', date: '2026-08-30 09:00', type: 'Payment Received', amount: '$75.00', who: 'D' }),
    ];

    it('each gift rides the FIRST transfer at or after it', () => {
      const p = parseCashAppStatement({ header: HEADER, rows: MONTH });
      const batches = batchGiftsByPayout(giftsOf(p), payoutsOf(p));
      expect(batches).toHaveLength(3); // two transfers + the undeposited tail
      expect(batches[0].claims.map((c) => c.giverName)).toEqual(['A', 'B']);
      expect(batches[1].claims.map((c) => c.giverName)).toEqual(['C']);
      expect(batches[2].claims.map((c) => c.giverName)).toEqual(['D']);
      expect(batches[0].reconciliation.balanced).toBe(true);
      expect(batches[1].reconciliation.balanced).toBe(true);
    });

    it('the tail after the last transfer is undeposited, not lost', () => {
      const p = parseCashAppStatement({ header: HEADER, rows: MONTH });
      const batches = batchGiftsByPayout(giftsOf(p), payoutsOf(p));
      expect(batches[2].reconciliation.status).toBe(DRIFT.NOT_YET_DEPOSITED);
      // Every gift is in exactly one batch: nothing double counted, none lost.
      const all = batches.flatMap((b) => b.claims);
      expect(all).toHaveLength(4);
      expect(all.reduce((a, c) => a + c.amountClaimedCents, 0)).toBe(42500);
    });

    it('the month summary answers "can this be signed off?" in one fact', () => {
      const p = parseCashAppStatement({ header: HEADER, rows: MONTH });
      const s = summarizeBatches(batchGiftsByPayout(giftsOf(p), payoutsOf(p)));
      expect(s.allBalanced).toBe(true);
      expect(s.claims).toBe(4);
      expect(s.depositedCents).toBe(35000);
      expect(s.undepositedCents).toBe(7500);
      expect(s.unbalanced).toBe(0);
    });

    it('one bad batch fails the whole month’s sign-off', () => {
      const broken = MONTH.slice();
      broken[2] = row({ id: 'p1', date: '2026-08-04 09:00', type: 'Cash Out', amount: '-$250.00' });
      const p = parseCashAppStatement({ header: HEADER, rows: broken });
      const s = summarizeBatches(batchGiftsByPayout(giftsOf(p), payoutsOf(p)));
      expect(s.allBalanced).toBe(false);
      expect(s.unbalanced).toBe(1);
    });

    it('a gift at the same moment as a transfer rides that transfer (deterministic)', () => {
      const same = [
        row({ id: 'g1', date: '2026-08-02 09:00', type: 'Payment Received', amount: '$10.00', who: 'A' }),
        row({ id: 'p1', date: '2026-08-02 09:00', type: 'Cash Out', amount: '-$10.00' }),
      ];
      const p = parseCashAppStatement({ header: HEADER, rows: same });
      const batches = batchGiftsByPayout(giftsOf(p), payoutsOf(p));
      expect(batches).toHaveLength(1);
      expect(batches[0].reconciliation.balanced).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
describe('who is this? — proposed, never decided', () => {
  const PEOPLE = [
    { id: 'p1', displayName: 'Mary Coleman' },
    { id: 'p2', displayName: 'Robert Johnson', preferredName: 'Bobby Johnson' },
    { id: 'p3', displayName: 'James Coleman' },
  ];

  it('strips a cashtag, emoji and a title before comparing', () => {
    expect(normalizeName('$MaryC Mary Coleman \u{1F64F}')).toBe('mary coleman');
    expect(normalizeName('Pastor Robert Johnson Jr.')).toBe('robert johnson');
    expect(normalizeName('  JOSÉ   GARCIA ')).toBe('jose garcia');
  });

  it('names each basis it would propose on', () => {
    expect(matchBasis('Mary Coleman', PEOPLE[0])).toBe(BASIS.EXACT);
    expect(matchBasis('Bobby Johnson', PEOPLE[1])).toBe(BASIS.PREFERRED);
    expect(matchBasis('Coleman Mary', PEOPLE[0])).toBe(BASIS.SWAPPED);
    expect(matchBasis('Mary Ann Coleman', PEOPLE[0])).toBe(BASIS.ALL_TOKENS);
    expect(matchBasis('M Coleman', PEOPLE[0])).toBe(BASIS.LAST_PLUS_INITIAL);
    expect(matchBasis('Totally Different', PEOPLE[0])).toBeNull();
  });

  it('an exact match is high confidence and STILL needs review', () => {
    const [p] = proposeDonorMatches(['Mary Coleman'], PEOPLE);
    expect(p.best.parishionerId).toBe('p1');
    expect(p.confidence).toBe(CONFIDENCE.HIGH);
    expect(p.needsReview).toBe(true);
    expect(p.decided).toBe(false);
  });

  it('A TIE IS REPORTED AS A TIE — never resolved by tiebreak', () => {
    // "X Coleman" matches BOTH Colemans on last-name-plus-initial... only when
    // the initials actually differ does one win. Same initial, two people:
    const people = [
      { id: 'a', displayName: 'Mary Coleman' },
      { id: 'b', displayName: 'Michael Coleman' },
    ];
    const [p] = proposeDonorMatches(['M Coleman'], people);
    expect(p.candidates).toHaveLength(2);
    expect(p.ambiguous).toBe(true);
    expect(p.confidence).toBe(CONFIDENCE.LOW);
  });

  it('no match at all is reported as unmatched, not as a nearest guess', () => {
    const [p] = proposeDonorMatches(['Somebody Unknown'], PEOPLE);
    expect(p.best).toBeNull();
    expect(p.confidence).toBe(CONFIDENCE.NONE);
  });

  it('distinct names collapse to one question each, in first-seen order', () => {
    const props = proposeDonorMatches(['Mary Coleman', 'mary  coleman', 'Bobby Johnson'], PEOPLE);
    expect(props).toHaveLength(2);
    expect(props[0].raw).toBe('Mary Coleman');
  });

  it('a blank sender name is not turned into a person', () => {
    expect(proposeDonorMatches(['', '   '], PEOPLE)).toHaveLength(0);
  });

  it('a confirmation is remembered and outranks every heuristic', () => {
    let aliases = {};
    aliases = confirmAlias(aliases, 'BJ From Church', 'p2');
    const [p] = proposeDonorMatches(['BJ From Church'], PEOPLE, aliases);
    expect(p.best).toMatchObject({ parishionerId: 'p2', basis: BASIS.ALIAS });
    expect(p.confidence).toBe(CONFIDENCE.HIGH);
  });

  it('confirmAlias and forgetAlias never mutate what they were given', () => {
    const before = { 'mary coleman': 'p1' };
    const after = confirmAlias(before, 'Bobby Johnson', 'p2');
    expect(before).toEqual({ 'mary coleman': 'p1' });
    expect(Object.keys(after)).toHaveLength(2);
    expect(forgetAlias(after, 'Mary Coleman')).toEqual({ 'bobby johnson': 'p2' });
  });

  it('a confirmed alias to a person who has left is not silently honoured', () => {
    const [p] = proposeDonorMatches(['Ghost Name'], PEOPLE, { 'ghost name': 'no-such-person' });
    expect(p.best).toBeNull();
  });

  it('the review queue shrinks as confirmations accumulate — the whole point', () => {
    const names = ['Mary Coleman', 'BJ From Church', 'Somebody Unknown'];
    const cold = reviewQueue(proposeDonorMatches(names, PEOPLE, {}));
    expect(cold.settled).toBe(0);
    expect(cold.toReview + cold.unmatched).toBe(3);

    const warm = reviewQueue(proposeDonorMatches(names, PEOPLE, {
      'mary coleman': 'p1', 'bj from church': 'p2',
    }));
    expect(warm.settled).toBe(2);
    expect(warm.queue).toHaveLength(1);
    expect(warm.queue[0].raw).toBe('Somebody Unknown');
  });

  it('a proposal rides beside a claim and never writes itself into it', () => {
    const p = parseCashAppStatement({ header: HEADER, rows: [
      row({ date: '2026-08-02', type: 'Payment Received', amount: '$100.00', who: 'Mary Coleman' }),
      row({ date: '2026-08-03', type: 'Payment Received', amount: '$50.00', who: 'M Coleman' }),
    ] });
    const { claims } = planGivingBatch({ gifts: giftsOf(p), payout: null });
    const people = [{ id: 'a', displayName: 'Mary Coleman' }, { id: 'b', displayName: 'Michael Coleman' }];
    const withProps = attachProposals(claims, proposeDonorMatches(claims.map((c) => c.giverName), people));

    expect(withProps[0].proposedParishionerId).toBe('a');
    expect(withProps[0].parishionerId, 'a proposal must never become the confirmed id').toBeNull();
    // The ambiguous one proposes NOBODY.
    expect(withProps[1].proposal.ambiguous).toBe(true);
    expect(withProps[1].proposedParishionerId).toBeNull();
  });
});

// ---------------------------------------------------------------------------
describe('the reports the steward stopped building by hand', () => {
  const DIRECTORY = { p1: 'Mary Coleman' };
  const CLAIMS = [
    { giverName: 'Mary Coleman', parishionerId: 'p1', amountClaimedCents: 40000, givenOn: '2026-08-02', givenAt: '10:15', note: 'Tithe' },
    { giverName: 'Bobby J.', parishionerId: null, amountClaimedCents: 35000, givenOn: '2026-08-03', givenAt: '18:42', note: 'Building' },
    { giverName: 'Mary Coleman', parishionerId: 'p1', amountClaimedCents: 25000, givenOn: '2026-09-01', givenAt: '09:05', note: '' },
  ];

  it('SUBTOTALS TIE TO THE TOTAL (a report whose parts do not add up is a rumour)', () => {
    for (const model of [
      givingByMonthReport(CLAIMS, { directory: DIRECTORY }),
      givingByGiverReport(CLAIMS, { directory: DIRECTORY }),
    ]) {
      const summed = model.groups.reduce((a, g) => a + g.subtotal.cents, 0);
      expect(summed, model.title).toBe(model.total.cents);
      expect(model.total.cents).toBe(100000);
      const counted = model.groups.reduce((a, g) => a + g.subtotal.count, 0);
      expect(counted).toBe(model.total.count);
    }
  });

  it('groups by month, newest first, with the time kept on every line', () => {
    const m = givingByMonthReport(CLAIMS, { directory: DIRECTORY });
    expect(m.groups.map((g) => g.key)).toEqual(['2026-09', '2026-08']);
    expect(m.groups[1].rows.map((r) => r.time)).toEqual(['18:42', '10:15']);
  });

  it('an UNCONFIRMED giver keeps his own name, his money, and a mark', () => {
    const m = givingByGiverReport(CLAIMS, { directory: DIRECTORY });
    const bobby = m.groups.find((g) => g.label.startsWith('Bobby J.'));
    expect(bobby, 'an unconfirmed giver must not vanish from the report').toBeTruthy();
    expect(bobby.label).toMatch(/not yet identified/i);
    expect(bobby.subtotal.cents).toBe(35000);
    expect(bobby.confirmed).toBe(false);
    // And his money is still inside the grand total.
    expect(m.total.cents).toBe(100000);
  });

  it('a confirmed member is shown by the DIRECTORY name, not the sender name', () => {
    const m = givingByGiverReport(CLAIMS, { directory: DIRECTORY });
    expect(m.groups[0].label).toBe('Mary Coleman');
    expect(m.groups[0].subtotal.cents).toBe(65000);
  });

  it('a high-confidence PROPOSAL is still shown as the raw name, never as the member', () => {
    // This is the whole safety property: a proposal rendered as a name is how
    // a wrong attribution becomes invisible.
    const proposed = [{ giverName: 'Mary Colemann', parishionerId: null, proposedParishionerId: 'p1', confidence: 'high', amountClaimedCents: 5000, givenOn: '2026-08-04' }];
    const m = givingByGiverReport(proposed, { directory: DIRECTORY });
    expect(m.groups[0].label).toMatch(/Mary Colemann \(not yet identified\)/);
  });

  it('every report states how much of itself is unconfirmed', () => {
    const m = givingByMonthReport(CLAIMS, { directory: DIRECTORY });
    expect(m.confirmation).toMatchObject({ total: 3, confirmed: 2, unconfirmed: 1, unconfirmedCents: 35000, settled: false });
    expect(m.note).toMatch(/1 of 3 gifts \(\$350\.00\) are NOT yet confirmed/);
    expect(m.note).toMatch(/not final/);
  });

  it('a fully confirmed month says so plainly', () => {
    const m = givingByMonthReport(CLAIMS.filter((c) => c.parishionerId), { directory: DIRECTORY });
    expect(m.confirmation.settled).toBe(true);
    expect(m.note).toMatch(/All 2 gifts are confirmed/);
  });

  it('one person’s record reads in date order with dates, times and notes', () => {
    const s = giverStatement(CLAIMS, { parishionerId: 'p1', directory: DIRECTORY });
    expect(s.title).toBe('Giving record — Mary Coleman');
    expect(s.groups[0].rows.map((r) => r.date)).toEqual(['Aug 02, 2026', 'Sep 01, 2026']);
    expect(s.total.cents).toBe(65000);
    expect(s.confirmation.settled).toBe(true);
  });

  it('a record can be pulled for an unconfirmed sender name too, marked as such', () => {
    const s = giverStatement(CLAIMS, { giverName: 'Bobby J.', directory: DIRECTORY });
    expect(s.total.cents).toBe(35000);
    expect(s.confirmation.settled).toBe(false);
    expect(s.note).toMatch(/has not been confirmed against the church directory/);
  });

  it('a record says what it IS — never a church-issued tax statement', () => {
    const s = giverStatement(CLAIMS, { parishionerId: 'p1', directory: DIRECTORY });
    expect(s.provenance).toMatch(/not a church-issued tax statement/);
  });

  it('the deposit report names every difference and adjusts nothing', () => {
    const p = parseCashAppStatement({ header: HEADER, rows: [
      ...MEETING_ROWS.slice(0, 3),
      row({ id: 'T4', date: '2026-08-05', type: 'Cash Out', amount: '-$900.00' }),
    ] });
    const r = batchReconciliationReport(batchGiftsByPayout(giftsOf(p), payoutsOf(p)));
    expect(r.allBalanced).toBe(false);
    expect(r.unbalanced).toBe(1);
    expect(r.rows[0]).toMatchObject({ giftsCents: 100000, depositCents: 90000, differenceCents: 10000, balanced: false });
    expect(r.note).toMatch(/Nothing has been adjusted/);
  });

  it('the CSV carries the same numbers as the model', () => {
    const m = givingByGiverReport(CLAIMS, { directory: DIRECTORY });
    const csv = reportToCsv(m);
    expect(csv.split('\n')[0]).toBe('Date,Time,Giver,Note,How,Amount');
    expect(csv).toMatch(/650\.00/);
    expect(csv).toMatch(/350\.00/);
    expect(csv).toMatch(/not a church-issued tax statement/);
    // The exported total is the model's total, to the cent.
    const totalLine = csv.split('\n').find((l) => l.startsWith('Total'));
    expect(totalLine.endsWith('1000.00')).toBe(true);
  });

  it('an empty month is an empty report, not a crash or a zero claimed as fact', () => {
    const m = givingByMonthReport([], {});
    expect(m.groups).toHaveLength(0);
    expect(m.total).toEqual({ cents: 0, count: 0 });
    expect(m.confirmation.total).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// END TO END: the meeting's sentence, from file to signed-off report.
describe('end to end — the meeting’s own scenario', () => {
  it('a statement becomes named gifts, a tied deposit, and a month report', () => {
    const parsed = parseCashAppStatement({ header: HEADER, rows: MEETING_ROWS });
    expect(parsed.reconciliation.balanced).toBe(true);

    const batches = batchGiftsByPayout(giftsOf(parsed), payoutsOf(parsed));
    const summary = summarizeBatches(batches);
    expect(summary.allBalanced).toBe(true);
    expect(summary.depositedCents).toBe(100000);

    const people = [{ id: 'p1', displayName: 'Person A' }, { id: 'p2', displayName: 'Person B' }];
    const claims = batches.flatMap((b) => b.claims);
    const proposals = proposeDonorMatches(claims.map((c) => c.giverName), people);
    const reviewed = attachProposals(claims, proposals);

    // Two propose, one is unknown -- and the unknown one still has its money.
    expect(reviewed.filter((c) => c.proposedParishionerId)).toHaveLength(2);
    const report = givingByGiverReport(reviewed, { directory: { p1: 'Person A', p2: 'Person B' } });
    expect(report.total.cents).toBe(100000);
    expect(report.confirmation.unconfirmed).toBe(3); // nothing confirmed YET
    expect(report.note).toMatch(/NOT yet confirmed/);

    // The office confirms all three; the report settles and the total is unmoved.
    const confirmed = reviewed.map((c, i) => ({ ...c, parishionerId: ['p1', 'p2', 'p3'][i] }));
    const settled = givingByGiverReport(confirmed, { directory: { p1: 'Person A', p2: 'Person B', p3: 'Person C' } });
    expect(settled.confirmation.settled).toBe(true);
    expect(settled.total.cents).toBe(100000);
  });
});

// =============================================================================
// giving-records — the giver's own ledger, proven at the logic layer.
// =============================================================================
// The class of bug this gates: a giving total that is WRONG. A member's year
// total is the number they will carry into tax season and read as truth, so
// every path that produces it is pinned here — a UTC date that files a Sunday
// gift on Monday, a "$0 gift" or unparsed amount that would dilute a record, a
// future-dated entry for a gift not yet given, and a breakdown that disagrees
// with the headline total.
//
// A NOTE ON MONEY AND FLOATS, stated accurately. Integer cents is the right
// representation and it is what this module uses, but honesty about what these
// tests prove: summing dollar floats and rounding once at the end does NOT
// actually drift at congregational magnitudes — that was measured, not assumed,
// and no dataset was found where it differs. So these tests do not claim to
// catch a drift that a rounding-at-the-end implementation would produce. What
// they DO pin is the property that matters and IS breakable: the headline total
// always equals the sum of its own fund breakdown, every amount round-trips to
// the exact cent, and a displayed value is never a raw float (the classic
// 0.1 + 0.2 tail, asserted below as the hazard the cents design removes).
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  parseAmountCents, formatMoney, centsToAmount,
  validateGivingDraft, localToday, blankDraft,
  summarizeGiving, yearsOf, recordsInYear, sortByDateDesc,
  toGivingRow, fromGivingRow, fundLabel, methodLabel,
  GIVING_FUNDS, GIVING_METHODS, RECORD_PROVENANCE, RECORD_PRIVACY, newSlug,
} from '../lib/giving-records.js';

describe('parseAmountCents — what a person actually types', () => {
  it('accepts the real shapes: plain, dollar sign, commas, whitespace', () => {
    expect(parseAmountCents('50')).toBe(5000);
    expect(parseAmountCents('$50')).toBe(5000);
    expect(parseAmountCents('1,250.75')).toBe(125075);
    expect(parseAmountCents('  20.5 ')).toBe(2050);
    expect(parseAmountCents(12.34)).toBe(1234);
  });

  it('returns null — never 0 — for anything that is not a real gift', () => {
    // 0 would read as "gave nothing," which is a DIFFERENT claim from
    // "didn't say." Conflating them is exactly the painted-number failure.
    for (const bad of ['', '   ', 'abc', '$', '.', '0', '0.00', '-5', null, undefined, NaN, Infinity]) {
      expect(parseAmountCents(bad), `string/edge path: ${String(bad)}`).toBeNull();
    }
    // The NUMBER path needs its own coverage — a regression can land on one
    // branch and not the other, and a bare 0 there would post an empty gift.
    for (const bad of [0, -0, -1, -0.5, NaN, Infinity, -Infinity]) {
      expect(parseAmountCents(bad), `number path: ${String(bad)}`).toBeNull();
    }
  });

  it('rounds to the cent rather than carrying a float tail', () => {
    expect(parseAmountCents('0.1')).toBe(10);
    expect(parseAmountCents('33.335')).toBe(3334); // half-up at the cent
  });
});

describe('summarizeGiving — the total and its breakdown', () => {
  it('sums in integer cents, and never renders a raw float tail', () => {
    const rows = [
      { givenOn: '2026-01-04', cents: 10, fund: 'tithe' },
      { givenOn: '2026-01-11', cents: 20, fund: 'tithe' },
    ];
    expect(summarizeGiving(rows).totalCents).toBe(30);
    expect(formatMoney(summarizeGiving(rows).totalCents)).toBe('$0.30');
    // The hazard the cents representation removes: adding the dollar values
    // directly and showing the result would print $0.30000000000000004.
    expect(centsToAmount(10) + centsToAmount(20)).not.toBe(0.3);
    expect(String(centsToAmount(10) + centsToAmount(20))).toMatch(/0\.30000000000000004/);
  });

  it('totals a full year of weekly giving exactly', () => {
    const rows = Array.from({ length: 52 }, (_, i) => ({ givenOn: `2026-01-0${(i % 9) + 1}`, cents: 1010, fund: 'offering' }));
    expect(summarizeGiving(rows).totalCents).toBe(52520);
    expect(formatMoney(52520)).toBe('$525.20');
  });

  it('breaks the total down by fund, in display order, omitting empty funds', () => {
    // Deliberately OUT of date order: firstDate/lastDate must be derived by
    // sorting, not by trusting the order the rows happened to arrive in.
    const rows = [
      { givenOn: '2026-02-08', cents: 2500,  fund: 'tithe' },
      { givenOn: '2026-02-21', cents: 5000,  fund: 'missions' },
      { givenOn: '2026-02-01', cents: 10000, fund: 'tithe' },
    ];
    const s = summarizeGiving(rows);
    expect(s.count).toBe(3);
    expect(s.totalCents).toBe(17500);
    expect(s.byFund.map((f) => f.id)).toEqual(['tithe', 'missions']); // GIVING_FUNDS order, no zero-count funds
    expect(s.byFund[0]).toMatchObject({ label: 'Tithe', count: 2, cents: 12500 });
    expect(s.firstDate).toBe('2026-02-01');
    expect(s.lastDate).toBe('2026-02-21');
  });

  it('an empty record reports zero gifts and no painted fund rows', () => {
    const s = summarizeGiving([]);
    expect(s.count).toBe(0);
    expect(s.totalCents).toBe(0);
    expect(s.byFund).toEqual([]);
    expect(s.firstDate).toBeNull();
  });

  it('the sum of the fund breakdown always equals the headline total', () => {
    const rows = [
      { givenOn: '2026-03-01', cents: 3333, fund: 'tithe' },
      { givenOn: '2026-03-02', cents: 1667, fund: 'building' },
      { givenOn: '2026-03-03', cents: 999,  fund: 'benevolence' },
      { givenOn: '2026-03-04', cents: 1,    fund: 'gift' },
    ];
    const s = summarizeGiving(rows);
    expect(s.byFund.reduce((n, f) => n + f.cents, 0)).toBe(s.totalCents);
  });
});

describe('localToday — the giver\'s calendar day, not UTC\'s', () => {
  it('reads LOCAL date parts, never toISOString', () => {
    // Deterministic regardless of the runner's timezone (the CI box is UTC, so
    // a real evening Date proves nothing there). This stand-in's local parts
    // say Sunday the 6th while its ISO day says Monday the 7th — exactly the
    // disagreement a west-of-Greenwich member hits at 9pm. A toISOString
    // implementation files their Sunday offering on Monday and fails here.
    const westCoastSundayEvening = {
      getFullYear: () => 2026, getMonth: () => 8, getDate: () => 6,
      toISOString: () => '2026-09-07T04:30:00.000Z',
    };
    expect(localToday(westCoastSundayEvening)).toBe('2026-09-06');
  });

  it('agrees with the real Date object\'s own local parts', () => {
    const d = new Date(2026, 8, 6, 21, 30, 0);
    expect(localToday(d)).toBe(`${d.getFullYear()}-09-0${d.getDate()}`);
  });

  it('pads single-digit months and days', () => {
    expect(localToday(new Date(2026, 0, 5, 12))).toBe('2026-01-05');
  });
});

describe('validateGivingDraft — every reason a gift cannot be recorded', () => {
  const base = { amount: '100', givenOn: '2026-09-06', fund: 'tithe', method: 'zelle' };

  it('accepts a complete, real gift', () => {
    const r = validateGivingDraft(base, { today: '2026-09-08' });
    expect(r.ok).toBe(true);
    expect(r.errors).toEqual({});
    expect(r.cents).toBe(10000);
  });

  it('refuses a missing or zero amount, naming the field', () => {
    expect(validateGivingDraft({ ...base, amount: '' }, { today: '2026-09-08' }).errors.amount).toBeTruthy();
    expect(validateGivingDraft({ ...base, amount: '0' }, { today: '2026-09-08' }).errors.amount).toBeTruthy();
  });

  it('refuses a gift dated in the future — you have not given tomorrow yet', () => {
    const r = validateGivingDraft({ ...base, givenOn: '2026-12-25' }, { today: '2026-09-08' });
    expect(r.ok).toBe(false);
    expect(r.errors.givenOn).toBeTruthy();
  });

  it('accepts a gift dated today', () => {
    expect(validateGivingDraft({ ...base, givenOn: '2026-09-08' }, { today: '2026-09-08' }).ok).toBe(true);
  });

  it('refuses a malformed or missing date', () => {
    expect(validateGivingDraft({ ...base, givenOn: '' }, { today: '2026-09-08' }).errors.givenOn).toBeTruthy();
    expect(validateGivingDraft({ ...base, givenOn: '9/6/26' }, { today: '2026-09-08' }).errors.givenOn).toBeTruthy();
  });

  it('refuses an unknown fund or method — no gift lands in an invented bucket', () => {
    expect(validateGivingDraft({ ...base, fund: 'crypto-seed' }, { today: '2026-09-08' }).errors.fund).toBeTruthy();
    expect(validateGivingDraft({ ...base, method: 'wire-to-nigeria' }, { today: '2026-09-08' }).errors.method).toBeTruthy();
  });

  it('requires the giver\'s own words when the fund is "other"', () => {
    expect(validateGivingDraft({ ...base, fund: 'other', fundNote: '' }, { today: '2026-09-08' }).errors.fundNote).toBeTruthy();
    expect(validateGivingDraft({ ...base, fund: 'other', fundNote: 'Pastor appreciation' }, { today: '2026-09-08' }).ok).toBe(true);
  });

  it('a blank draft is dated today and defaulted to the tithe', () => {
    const d = blankDraft('2026-09-08');
    expect(d).toMatchObject({ amount: '', givenOn: '2026-09-08', fund: 'tithe' });
    expect(validateGivingDraft(d, { today: '2026-09-08' }).ok).toBe(false); // needs an amount
  });
});

describe('row shaping — what crosses the wire', () => {
  it('round-trips a gift through the DB shape without losing a cent', () => {
    const row = toGivingRow(
      { amount: '$1,250.75', givenOn: '2026-05-04', fund: 'offering', fundNote: '  ', method: 'givelify', reference: ' 4471 ', note: ' harvest ' },
      { tenantId: 'inst-1', userId: 'user-1', slug: 'give-abc' },
    );
    expect(row).toMatchObject({
      instance_id: 'inst-1', created_by: 'user-1', slug: 'give-abc',
      given_on: '2026-05-04', amount: 1250.75, fund: 'offering',
      fund_note: '', method: 'givelify', reference: '4471', note: 'harvest',
    });
    const back = fromGivingRow({ ...row, id: 'uuid-1', created_at: '2026-05-04T10:00:00Z' });
    expect(back.cents).toBe(125075);
    expect(back.remoteUuid).toBe('uuid-1');
    expect(back.givenOn).toBe('2026-05-04');
  });

  it('a row with no slug still gets a stable client id', () => {
    expect(fromGivingRow({ id: 'uuid-9', amount: '5.00', given_on: '2026-01-01' }).id).toBe('give-remote-uuid-9');
  });

  it('newSlug produces distinct ids so a retry cannot duplicate a gift', () => {
    const slugs = new Set(Array.from({ length: 200 }, newSlug));
    expect(slugs.size).toBe(200);
  });
});

describe('the year view', () => {
  const rows = [
    { givenOn: '2025-12-28', cents: 5000, fund: 'tithe', createdAt: '2025-12-28T10:00:00Z' },
    { givenOn: '2026-01-04', cents: 6000, fund: 'tithe', createdAt: '2026-01-04T10:00:00Z' },
    { givenOn: '2026-01-04', cents: 1000, fund: 'gift',  createdAt: '2026-01-04T11:00:00Z' },
  ];

  it('offers only years that actually have gifts, newest first', () => {
    expect(yearsOf(rows)).toEqual(['2026', '2025']);
    expect(yearsOf([])).toEqual([]);
  });

  it('filters to one year, and "all" keeps everything', () => {
    expect(recordsInYear(rows, '2026')).toHaveLength(2);
    expect(recordsInYear(rows, '2025')).toHaveLength(1);
    expect(recordsInYear(rows, 'all')).toHaveLength(3);
    expect(summarizeGiving(recordsInYear(rows, '2026')).totalCents).toBe(7000);
  });

  it('sorts newest first, breaking same-day ties by entry order', () => {
    const sorted = sortByDateDesc(rows);
    expect(sorted[0].createdAt).toBe('2026-01-04T11:00:00Z'); // later entry leads
    expect(sorted[2].givenOn).toBe('2025-12-28');
  });
});

describe('the catalogs and the honest framing', () => {
  it('names the tithe and the offering explicitly — the two the Word names plainly', () => {
    const ids = GIVING_FUNDS.map((f) => f.id);
    expect(ids).toContain('tithe');
    expect(ids).toContain('offering');
    expect(ids).toContain('gift');
    expect(fundLabel('tithe')).toBe('Tithe');
    expect(fundLabel('nope')).toBe('Other'); // an unknown id never renders as undefined
  });

  it('mirrors the church\'s own published channels by id, so a member names what they used', () => {
    const methodIds = GIVING_METHODS.map((m) => m.id);
    for (const channel of ['zelle', 'cashapp', 'givelify', 'paypal']) expect(methodIds).toContain(channel);
    expect(methodLabel('cashapp')).toBe('Cash App');
    expect(methodLabel('nope')).toBe('Other');
  });

  it('carries the provenance line that keeps this from posing as a church statement', () => {
    // The bright line of this whole feature (DR-0076): the app never sees a
    // payment, so the record is the GIVER'S, and the copy must say so.
    expect(RECORD_PROVENANCE).toMatch(/your own record/i);
    expect(RECORD_PROVENANCE).toMatch(/church office/i);
  });

  it('grounds the owner-only privacy in Matthew 6:3-4, quoted as ESV', () => {
    expect(RECORD_PRIVACY.ref).toBe('Matthew 6:3-4');
    expect(RECORD_PRIVACY.translation).toBe('ESV');
    expect(RECORD_PRIVACY.text).toMatch(/left hand know what your right hand is doing/);
  });
});

describe('formatMoney', () => {
  it('always shows cents, and groups thousands', () => {
    expect(formatMoney(0)).toBe('$0.00');
    expect(formatMoney(5)).toBe('$0.05');
    expect(formatMoney(123456)).toBe('$1,234.56');
  });
});

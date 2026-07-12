// @vitest-environment node
// =============================================================================
// giving-records — the shared engine for "add a cash gift" + "bulk import Excel"
// =============================================================================
// Darrell 2026-07-12: "Bulk add excel records and easy add cash money to a user's
// records." The church's annual statements must be RIGHT (DR-0076): a re-upload
// can never double-count, a bad row is never silently committed, and a date is
// never guessed onto a financial record. PROVEN-TO-CATCH: each guarantee has a
// failing-input test.
import { describe, it, expect } from 'vitest';
import {
  normalizeGift, normalizeGiftDate, parseAmount, giftDedupeKey,
  planGivingImport, guessGivingColumns, mapSheetRows, GIFT_METHODS,
  monthlyGivingReport, givingMonthsAvailable,
} from '../lib/giving-records.js';

describe('normalizeGift — one gift, validated', () => {
  it('accepts a clean cash gift and stamps the tax year from the date', () => {
    const r = normalizeGift({ member: 'DP', amount: '$1,200.50', date: '07/05/2026', method: 'cash', fund: 'Tithe' });
    expect(r.ok).toBe(true);
    expect(r.gift).toMatchObject({ member: 'DP', amount: 1200.5, date: '2026-07-05', method: 'cash', fund: 'Tithe', taxYear: 2026 });
  });

  it('defaults to cash + General fund (the Sunday-plate default)', () => {
    const r = normalizeGift({ member: 'Sister Mary', amount: 40, date: '2026-07-05' });
    expect(r.gift.method).toBe('cash');
    expect(r.gift.fund).toBe('General');
  });

  it('REJECTS a missing name, a non-positive amount, and a bad date (never guesses)', () => {
    expect(normalizeGift({ amount: 40, date: '2026-07-05' }).ok).toBe(false);
    expect(normalizeGift({ member: 'X', amount: 0, date: '2026-07-05' }).errors.join(' ')).toMatch(/positive/);
    expect(normalizeGift({ member: 'X', amount: 40, date: 'sometime' }).errors.join(' ')).toMatch(/date/);
  });

  it('only allows the donor_giving methods', () => {
    expect(normalizeGift({ member: 'X', amount: 5, date: '2026-01-01', method: 'bitcoin' }).ok).toBe(false);
    for (const m of GIFT_METHODS) {
      expect(normalizeGift({ member: 'X', amount: 5, date: '2026-01-01', method: m }).ok).toBe(true);
    }
  });
});

describe('date + amount parsing', () => {
  it('normalizes ISO, MM/DD/YYYY, and Date objects; rejects junk', () => {
    expect(normalizeGiftDate('2026-7-5')).toBe('2026-07-05');
    expect(normalizeGiftDate('7/5/2026')).toBe('2026-07-05');
    expect(normalizeGiftDate(new Date(2026, 6, 5))).toBe('2026-07-05');
    expect(normalizeGiftDate('not a date')).toBe('');
  });
  it('parses "$1,200.50" and rejects text', () => {
    expect(parseAmount('$1,200.50')).toBe(1200.5);
    expect(Number.isNaN(parseAmount('abc'))).toBe(true);
  });
});

describe('planGivingImport — bulk, deduped, nothing double-counted', () => {
  const rows = [
    { member: 'DP', amount: 100, date: '2026-07-05', method: 'cash', fund: 'Tithe' },
    { member: 'Sister Mary', amount: 40, date: '07/05/2026' },          // defaults cash/General
    { member: 'DP', amount: 100, date: '2026-07-05', method: 'cash', fund: 'Tithe' }, // dup within batch
    { member: '', amount: 25, date: '2026-07-05' },                     // invalid (no name)
  ];

  it('splits rows into valid / duplicate / invalid and counts only the new', () => {
    const plan = planGivingImport(rows);
    expect(plan.totalNew).toBe(2);
    expect(plan.valid.map((g) => g.member)).toEqual(['DP', 'Sister Mary']);
    expect(plan.duplicates).toHaveLength(1);
    expect(plan.invalid).toHaveLength(1);
    expect(plan.invalid[0].errors.join(' ')).toMatch(/name/);
  });

  it('a RE-UPLOAD against existing gifts adds nothing (no double-count)', () => {
    const first = planGivingImport(rows).valid;
    const second = planGivingImport(rows, first);   // same sheet again
    expect(second.totalNew).toBe(0);
    expect(second.duplicates.length).toBeGreaterThan(0);
  });

  it('the dedupe key separates a genuinely different gift (different fund)', () => {
    const a = normalizeGift({ member: 'DP', amount: 100, date: '2026-07-05', fund: 'Tithe' }).gift;
    const b = normalizeGift({ member: 'DP', amount: 100, date: '2026-07-05', fund: 'Building' }).gift;
    expect(giftDedupeKey(a)).not.toBe(giftDedupeKey(b));
  });
});

describe('monthlyGivingReport — computed, never hand-compiled', () => {
  const ledger = [
    { member: 'DP', amount: 100, date: '2026-07-05', method: 'cash', fund: 'Tithe' },
    { member: 'Mary', amount: 50, date: '2026-07-12', method: 'online', fund: 'General' },
    { member: 'Deacon', amount: 25, date: '2026-07-20', method: 'check', fund: 'Building' },
    { member: 'Old', amount: 999, date: '2026-06-30', method: 'cash', fund: 'Tithe' }, // other month
  ].map((r) => normalizeGift(r).gift);

  it('sums only the chosen month, by fund and by method — the total can\'t be wrong', () => {
    const rep = monthlyGivingReport(ledger, { year: 2026, month: 7 });
    expect(rep.count).toBe(3);
    expect(rep.total).toBe(175);            // 100 + 50 + 25, June's 999 excluded
    expect(rep.byMethod).toEqual({ cash: 100, online: 50, check: 25 });
    expect(rep.byFund).toEqual({ Tithe: 100, General: 50, Building: 25 });
  });

  it('an empty month reports zero, not a painted number', () => {
    expect(monthlyGivingReport(ledger, { year: 2026, month: 1 })).toMatchObject({ count: 0, total: 0 });
  });

  it('givingMonthsAvailable lists only real periods, newest first', () => {
    expect(givingMonthsAvailable(ledger)).toEqual(['2026-07', '2026-06']);
  });
});

describe('spreadsheet column mapping (easy, not error-prone)', () => {
  it('guesses giver/amount/date/fund columns from real-ish headers', () => {
    const map = guessGivingColumns(['Donor Name', 'Gift Amount', 'Gift Date', 'Designation', 'unrelated']);
    expect(map).toMatchObject({ member: 'Donor Name', amount: 'Gift Amount', date: 'Gift Date', fund: 'Designation' });
  });

  it('maps parsed sheet rows through the column map into gift input, then plans', () => {
    const sheet = [{ 'Donor Name': 'DP', 'Gift Amount': '$50', 'Gift Date': '7/5/2026' }];
    const map = guessGivingColumns(Object.keys(sheet[0]));
    const plan = planGivingImport(mapSheetRows(sheet, map));
    expect(plan.totalNew).toBe(1);
    expect(plan.valid[0]).toMatchObject({ member: 'DP', amount: 50, date: '2026-07-05' });
  });
});

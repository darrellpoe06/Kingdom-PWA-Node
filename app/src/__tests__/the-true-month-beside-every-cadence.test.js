// =============================================================================
// The true month beside every cadence (DR-1003)
// =============================================================================
// Darrell, 2026-10-13: "$800 a monthly however $200 weekly... sounds the same
// until you get a 5 week month."
import { describe, it, expect } from 'vitest';
import { CADENCES, cadencePrices, cadenceLine, betterDeal, dealLine, dollars, cadenceChoice } from '../modules/properties/cadence.js';

describe('the arithmetic', () => {
  it('a week is paid 52 times a year: $200 a week is $867 a month on average and $1,000 in a five-week month', () => {
    const [w] = cadencePrices({ weekly: 200 });
    expect(w.id).toBe('weekly');
    expect(w.averageMonth).toBeCloseTo(866.67, 2);
    expect(w.longMonth).toBe(1000);
  });

  it('every two weeks is paid 26 times a year: $400 is $867 on average and $1,200 in a month with three paydays', () => {
    const [b] = cadencePrices({ biweekly: 400 });
    expect(b.averageMonth).toBeCloseTo(866.67, 2);
    expect(b.longMonth).toBe(1200);
    expect(b.longName).toBe('a month with three paydays');
  });

  it('a night is paid 365 times a year: $150 a night is $4,563 a month on average and $4,650 in a 31-night month', () => {
    const [n] = cadencePrices({ nightly: 150 });
    expect(dollars(n.averageMonth)).toBe('$4,563');
    expect(n.longMonth).toBe(4650);
  });

  it('PROVEN-TO-CATCH: the five-week month is five weeks, not 4.33 of them', () => {
    const [w] = cadencePrices({ weekly: 200 });
    expect(w.longMonth).not.toBeCloseTo(w.averageMonth, 0);
    expect(w.longMonth - w.averageMonth).toBeCloseTo(133.33, 1);
  });

  it('nothing is ever shown as $0: missing, zero, negative and junk prices are not offered', () => {
    expect(cadencePrices({ monthly: 0, weekly: -5, biweekly: 'x', nightly: null })).toEqual([]);
    expect(cadencePrices({ monthly: '800', weekly: '200' }).map((p) => p.id)).toEqual(['monthly', 'weekly']);
  });

  it('the order is the order of CADENCES, whatever order the prices came in', () => {
    expect(cadencePrices({ nightly: 1, weekly: 1, monthly: 1, biweekly: 1 }).map((p) => p.id)).toEqual(CADENCES.map((c) => c.id));
  });
});

describe('the sentence the renter reads', () => {
  it('prints the true month beside each cadence', () => {
    const line = cadenceLine(cadencePrices({ monthly: 800, weekly: 200, biweekly: 400 }));
    expect(line).toBe('Monthly $800 · Weekly $200 ($867 a month on average, $1,000 in a five-week month) · Every two weeks $400 ($867 a month on average, $1,200 in a month with three paydays)');
  });

  it('says nothing when the door is priced monthly and no other way — the monthly figure already stands on its own', () => {
    expect(cadenceLine(cadencePrices({ monthly: 800 }))).toBe('');
    expect(cadenceLine(cadencePrices({}))).toBe('');
    expect(cadenceLine(undefined)).toBe('');
  });

  it('a door priced weekly only still says what the month costs', () => {
    expect(cadenceLine(cadencePrices({ weekly: 250 }))).toBe('Weekly $250 ($1,083 a month on average, $1,250 in a five-week month)');
  });
});

describe('the better deal', () => {
  it('monthly $800 beats weekly $200 by $67 a month on average', () => {
    const prices = cadencePrices({ monthly: 800, weekly: 200 });
    expect(betterDeal(prices)).toMatchObject({ id: 'monthly', than: 'Weekly' });
    expect(dealLine(prices)).toBe('Monthly is the better deal: $67 a month less than weekly on average.');
  });

  it('a weekly price set below the month says so honestly — the family chose it', () => {
    expect(dealLine(cadencePrices({ monthly: 1000, weekly: 200 }))).toBe('Weekly is the better deal: $133 a month less than monthly on average.');
  });

  it('two cadences that come to the same year say so', () => {
    expect(dealLine(cadencePrices({ monthly: 866.67, weekly: 200 }))).toBe('Monthly and weekly cost the same over a year.');
  });

  it('one cadence is no choice: no deal line', () => {
    expect(betterDeal(cadencePrices({ monthly: 800 }))).toBeNull();
    expect(dealLine(cadencePrices({ weekly: 200 }))).toBe('');
  });

  it('cadenceChoice hands a surface all three at once', () => {
    const c = cadenceChoice({ monthly: 800, weekly: 200 });
    expect(c.prices).toHaveLength(2);
    expect(c.line).toMatch(/five-week month/);
    expect(c.deal).toMatch(/Monthly is the better deal/);
  });
});

// =============================================================================
// Kill debts with the money already being spent (Darrell 2026-08-24)
// =============================================================================
// "Potential opportunities to kill debts based on spending... prioritizing the
// spending for the users... from important or high to low... if a lot of low
// priority items are bought without the debts reduction at least $1000 dollars
// off the bottom line of debt not just minimum payments." Plus: "down to 0
// debts and the new life of asset acquisition periods." These pins lock the
// pure math and prove the Debts surface renders it.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PRIORITY_TIERS, tierOfCategory, spendingByPriority, killOpportunities,
  spendVsDebtVerdict, BOTTOM_LINE_FLOOR, traceSpendTier,
} from '../lib/spending-priorities.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const NOW = new Date('2026-08-24T12:00:00Z').getTime();
const daysAgo = (n) => new Date(NOW - n * 24 * 60 * 60 * 1000).toISOString();

describe('the priority tiers stand where they were declared', () => {
  it('giving is COVENANT — never in the low tier', () => {
    expect(PRIORITY_TIERS.covenant).toEqual(['charitable']);
    expect(PRIORITY_TIERS.low).not.toContain('charitable');
    expect(tierOfCategory('charitable')).toBe('covenant');
  });
  it('uncategorized is UNKNOWN, not low; money movement is no tier at all', () => {
    expect(tierOfCategory('other')).toBe('unknown');
    expect(tierOfCategory('salary')).toBeNull();
    expect(tierOfCategory('transfer')).toBeNull();
    expect(tierOfCategory('debt-payment')).toBeNull();
  });
  it('dining and subscriptions are the low tier; essentials are essential', () => {
    expect(tierOfCategory('dining')).toBe('low');
    expect(tierOfCategory('subscription')).toBe('low');
    expect(tierOfCategory('groceries')).toBe('essential');
    expect(tierOfCategory('medical')).toBe('essential');
  });
});

describe('spendingByPriority — the window, from their own rows', () => {
  const tx = [
    { description: 'STARBUCKS #123', amount: -25, date: daysAgo(5) },     // dining -> low
    { description: 'NETFLIX.COM', amount: -20, date: daysAgo(10) },       // subscription -> low
    { description: 'COUNTY MARKET', amount: -180, date: daysAgo(3) },     // groceries -> essential
    { description: 'CHURCH TITHE', amount: -300, date: daysAgo(7) },      // covenant
    { description: 'STARBUCKS #123', amount: -30, date: daysAgo(45) },    // outside window
    { description: 'PAYROLL DIRECT DEP', amount: 2500, date: daysAgo(2) }, // income, ignored
  ];
  it('sums each tier inside the window only; spending means negative amounts', () => {
    const s = spendingByPriority(tx, { nowMs: NOW });
    expect(s.tiers.low).toBe(45);
    expect(s.tiers.essential).toBe(180);
    expect(s.tiers.covenant).toBe(300);
    expect(s.counts.low).toBe(2);
    expect(s.hasData).toBe(true);
    expect(s.lowItems[0]).toMatchObject({ amount: 25 });
  });
  it('no dated rows -> hasData false (the surface says so instead of zeroes-as-truth)', () => {
    expect(spendingByPriority([], { nowMs: NOW }).hasData).toBe(false);
  });
  it('every tier keeps its purchase list, largest first (the drill-down data)', () => {
    const s = spendingByPriority(tx, { nowMs: NOW });
    expect(s.itemsByTier.low.map((i) => i.amount)).toEqual([25, 20]);
    expect(s.itemsByTier.essential[0]).toMatchObject({ description: 'COUNTY MARKET', amount: 180, category: 'groceries' });
    expect(s.itemsByTier.covenant[0]).toMatchObject({ description: 'CHURCH TITHE', amount: 300 });
    expect(s.lowItems).toBe(s.itemsByTier.low); // back-compat alias, same list
  });
});

describe('traceSpendTier — the main totals drill down too (Darrell 2026-08-24)', () => {
  const tx = [
    { description: 'STARBUCKS #123', amount: -25, date: daysAgo(5) },
    { description: 'NETFLIX.COM', amount: -20, date: daysAgo(10) },
    { description: 'CHURCH TITHE', amount: -300, date: daysAgo(7) },
  ];
  const spending = spendingByPriority(tx, { nowMs: NOW });
  it('a tier trace carries the real purchases as sources, the total as money', () => {
    const t = traceSpendTier('low', spending);
    expect(t.result).toEqual({ value: 45, kind: 'money' });
    expect(t.sources.map((s) => s.label)).toEqual(['STARBUCKS #123', 'NETFLIX.COM']);
    expect(t.sources.every((s) => s.kind === 'money' && s.op === '+')).toBe(true);
    expect(t.inputs[0].label).toContain('2 purchases in the window');
    expect(t.note).toBeUndefined();
  });
  it('giving names the covenant stand; unknown says UNKNOWN is not LOW', () => {
    expect(traceSpendTier('covenant', spending).formula).toContain('never counted killable');
    expect(traceSpendTier('unknown', spending).formula).toContain('UNKNOWN is not LOW');
  });
  it('past 12 purchases the trace stays honest: top 12 shown, the rest counted and totaled', () => {
    const many = Array.from({ length: 15 }, (_, i) => ({ description: `SHOP ${i}`, amount: -(100 - i), date: daysAgo(2) }));
    const s = spendingByPriority(many, { nowMs: NOW });
    const key = Object.keys(s.itemsByTier).find((k) => s.itemsByTier[k].length === 15);
    const t = traceSpendTier(key, s);
    expect(t.sources).toHaveLength(12);
    expect(t.note).toContain('+ 3 more purchases totaling $');
  });
});

describe('killOpportunities — what the low pool kills outright', () => {
  const debts = [
    { name: 'Amex', balance: 519 },
    { name: 'CreditOne', balance: 566 },
    { name: 'Big Loan', balance: 20000 },
    { name: 'Parked', balance: 100, leaveAlone: true },
  ];
  it('clears smallest-first completely, the rest goes to the bottom line', () => {
    const r = killOpportunities(debts, 1200);
    expect(r.kills.map((k) => k.name)).toEqual(['Amex', 'CreditOne']);
    expect(r.leftover).toBe(1200 - 519 - 566);
  });
  it('a pool below the smallest balance kills nothing but still counts', () => {
    const r = killOpportunities(debts, 400);
    expect(r.kills).toEqual([]);
    expect(r.leftover).toBe(400);
  });
});

describe('spendVsDebtVerdict — his $1,000 bottom-line floor', () => {
  it('flags heavy low-priority buying while the bottom line moves under the floor', () => {
    const v = spendVsDebtVerdict(
      { tiers: { low: 900 } },
      [{ netPaydown: 200 }, { netPaydown: 100 }],
    );
    expect(BOTTOM_LINE_FLOOR).toBe(1000);
    expect(v.bottomLineReduction).toBe(300);
    expect(v.flagged).toBe(true);
  });
  it('no flag when the bottom line clears the floor', () => {
    const v = spendVsDebtVerdict({ tiers: { low: 900 } }, [{ netPaydown: 1500 }]);
    expect(v.flagged).toBe(false);
  });
  it('unmeasurable stays honest — never flagged on missing history', () => {
    const v = spendVsDebtVerdict({ tiers: { low: 900 } }, [{}]);
    expect(v.measurable).toBe(false);
    expect(v.flagged).toBe(false);
  });
});

describe('the Debts surface renders the countdown and the kill view', () => {
  const src = readFileSync(join(HERE, '..', 'components', 'Debts.jsx'), 'utf8');
  it('the countdown block and its honest unscheduled caveat render', () => {
    expect(src).toMatch(/debtCountdown\(debtsWithCleared\)/);
    expect(src).toMatch(/only \$\{m\.remaining\} left|`only \$\{m\.remaining\} left`/);
    expect(src).toMatch(/never reaches zero until they're in/);
  });
  it('the new-life asset-acquisition era follows the zero (no invented returns)', () => {
    expect(src).toMatch(/asset acquisition/i);
    expect(src).toMatch(/no invented returns/);
    expect(src).toMatch(/finalFreedCashFlow \+ debtSnowballExtra/);
  });
  it('the Kill opportunities subtab is wired with the verdict and the kills', () => {
    expect(src).toMatch(/id: 'kill'/);
    expect(src).toMatch(/spendingByPriority\(transactions/);
    expect(src).toMatch(/spendVsDebtVerdict/);
    expect(src).toMatch(/killOpportunities\(debts, spending\.tiers\.low\)/);
    expect(src).toMatch(/never counted killable/);
  });
  it('all five tier tiles drill down — trace on every main total', () => {
    for (const tier of ['essential', 'covenant', 'medium', 'low', 'unknown']) {
      expect(src).toMatch(new RegExp(`trace=\\{traceSpendTier\\('${tier}', spending\\)\\}`));
    }
    expect(src).toMatch(/tap for the list/);
  });
});

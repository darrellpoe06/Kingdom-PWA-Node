// @vitest-environment node
// Tests for the pure asset-allocation mini-game (lib/games/asset-allocation.js).
// Deterministic integer-dollar math, so the whole challenge replays exactly.
import { describe, it, expect } from 'vitest';
import { hasVerse } from '../lib/games/scripture-link.js';
import {
  START_CASH, MIN_DOWN_PCT, CONTINGENCY_TARGET, PROPERTIES,
  createAllocation, analyze, summary, canBuy, buy, sell, grade,
} from '../lib/games/asset-allocation.js';

describe('the money model', () => {
  it('starts with the full stake and nothing owned', () => {
    const s = summary(createAllocation());
    expect(s.cashLeft).toBe(START_CASH);
    expect(s.owned).toBe(0);
  });

  it('leverage: a 5% down payment controls far more than the cash put in', () => {
    const a = analyze('starter', MIN_DOWN_PCT);
    expect(a.down).toBe(6000);          // 5% of 120000
    expect(a.cashNeeded).toBeLessThan(a.property.price); // you control 120k with a fraction
    expect(a.loan).toBe(114000);
  });

  it('the down payment cannot go below the 5% floor', () => {
    expect(analyze('starter', 1).downPct).toBe(MIN_DOWN_PCT);
  });

  it('lets you split $30k across THREE houses at 5% down (Christiana’s example)', () => {
    let st = createAllocation();
    st = buy(st, 'cottage', 5);
    st = buy(st, 'corner', 5);
    st = buy(st, 'starter', 5);
    const s = summary(st);
    expect(s.owned).toBe(3);
    expect(s.invested).toBeLessThanOrEqual(START_CASH); // it fit in the stake
    expect(s.cashLeft).toBe(START_CASH - s.invested);
  });

  it('refuses a purchase you cannot afford, and refuses to double-buy', () => {
    let st = createAllocation();
    st = buy(st, 'fourplex', 100);       // 100% down = 320k, way over 30k
    expect(summary(st).owned).toBe(0);   // rejected
    st = buy(st, 'cottage', 5);
    const again = buy(st, 'cottage', 5); // already owned
    expect(again).toBe(st);
  });

  it('sell releases the cash back', () => {
    let st = buy(createAllocation(), 'cottage', 5);
    expect(summary(st).owned).toBe(1);
    st = sell(st, 'cottage');
    expect(summary(st).cashLeft).toBe(START_CASH);
  });

  it('canBuy reflects the remaining cash', () => {
    let st = createAllocation();
    expect(canBuy(st, 'starter', 5)).toBe(true);
    st = buy(st, 'fourplex', 5);         // eats a chunk of the reserve
    // after a big buy, an expensive DIFFERENT property at high down no longer fits
    expect(canBuy(st, 'duplex', 50)).toBe(false);
  });
});

describe('the grade — measured the way Yahweh measures', () => {
  it('rewards a diversified, cash-flowing allocation that keeps a reserve', () => {
    let st = createAllocation();
    st = buy(st, 'cottage', 5);
    st = buy(st, 'corner', 5);
    const g = grade(st);
    expect(g.reserveHealthy).toBe(true);
    expect(g.positiveCashFlow).toBe(true);
    expect(g.tier).toBe('A Wise Steward');
    expect(g.effects.wisdom).toBeGreaterThan(0);
    expect(g.effects.provision).toBeGreaterThan(0);
  });

  it('names over-leverage: income built, but the reserve is gone', () => {
    // Spend nearly all the cash so the reserve falls under the contingency target.
    let st = buy(createAllocation(), 'fourplex', 5); // 22.4k of the 30k
    st = buy(st, 'corner', 5);                       // another 6.65k -> reserve ~950
    const s = summary(st);
    expect(s.reserve).toBeLessThan(CONTINGENCY_TARGET);
    const g = grade(st);
    expect(g.tier).toBe('Stretched Thin');
    expect(g.effects.peace).toBeLessThan(0);
  });

  it('the do-nothing outcome is gentle, not condemning', () => {
    const g = grade(createAllocation());
    expect(g.tier).toBeTruthy();
    expect(g.headline.toLowerCase()).not.toMatch(/fail|stupid|loser/);
  });

  it('every property is well-formed and every grade verse is real KJV', () => {
    for (const p of PROPERTIES) {
      expect(p.price).toBeGreaterThan(0);
      expect(p.rent).toBeGreaterThan(0);
    }
    const states = [
      createAllocation(),
      buy(buy(createAllocation(), 'cottage', 5), 'corner', 5),
      buy(createAllocation(), 'fourplex', 8),
    ];
    for (const st of states) {
      const g = grade(st);
      expect(hasVerse(g.verse.ref)).toBe(true);
    }
  });
});

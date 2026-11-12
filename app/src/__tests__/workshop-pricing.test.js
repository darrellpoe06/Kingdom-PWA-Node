// @vitest-environment node
// =============================================================================
// workshop-pricing — a seat's price has four named parts, and the Word's own
// workshops are an offering (DR-1447)
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  knowledgeTypeFor,
  isSpiritualDepartment,
  demandFactor,
  recommendSeatPrice,
  explainPrice,
  KNOWLEDGE_TYPES,
  LOCATION_TIERS,
  FORMATS,
  DEMAND_MIN,
  DEMAND_MAX,
} from '../lib/workshop-pricing.js';
import { LOVE_CORNER_DEPARTMENTS } from '../lib/lesson-links.js';

describe('knowledge type from the department the registry declares', () => {
  it('every spiritual department is spiritual, whatever its name', () => {
    for (const d of LOVE_CORNER_DEPARTMENTS) expect(knowledgeTypeFor(d)).toBe('spiritual');
  });
  it('a PoeTech subject is not spiritual, and the question is answered without the access model', () => {
    expect(isSpiritualDepartment('Real Estate')).toBe(false);
    expect(isSpiritualDepartment('Living Lessons')).toBe(true);
  });
  it('the PoeTech subjects fall by their kind', () => {
    expect(knowledgeTypeFor('A.I. The Way')).toBe('technical');
    expect(knowledgeTypeFor('Development')).toBe('technical');
    expect(knowledgeTypeFor('Mathematics')).toBe('technical');
    expect(knowledgeTypeFor('Real Estate')).toBe('business');
    expect(knowledgeTypeFor('Stock Market')).toBe('business');
    expect(knowledgeTypeFor('History')).toBe('business');
    expect(knowledgeTypeFor('Some Trade')).toBe('trade');
  });
});

describe('demand', () => {
  it('is the last fill, clamped; unknown is 1.0, never a guess', () => {
    expect(demandFactor({ requested: 12, capacity: 10 })).toBe(1.2);
    expect(demandFactor({ requested: 50, capacity: 10 })).toBe(DEMAND_MAX);
    expect(demandFactor({ requested: 1, capacity: 10 })).toBe(DEMAND_MIN);
    expect(demandFactor({})).toBe(1.0);
    expect(demandFactor({ requested: 5, capacity: 0 })).toBe(1.0);
  });
});

describe('the recommendation', () => {
  it('multiplies the named parts and rounds to $5', () => {
    const r = recommendSeatPrice({ department: 'Real Estate', location: 'city', format: 'day' });
    expect(r.cents).toBe(20000); // 19900 rounded to the nearest $5
    expect(r.parts).toMatchObject({
      type: 'business',
      dayRateCents: 19900,
      location: 'city',
      locationFactor: 1,
      format: 'day',
      formatFactor: 1,
      demand: 1,
      hours: 6,
    });
    const big = recommendSeatPrice({ department: 'A.I. The Way', location: 'major-metro', format: 'two-day', requested: 30, capacity: 20 });
    // 24900 * 1.5 * 1.8 * 1.3 = 87399 -> 87500
    expect(big.cents).toBe(87500);
    expect(big.parts.demand).toBe(1.3);
    const small = recommendSeatPrice({ knowledgeType: 'trade', location: 'rural', format: 'half-day' });
    // 14900 * 0.8 * 0.6 = 7152 -> 7000
    expect(small.cents).toBe(7000);
  });
  it('an unknown place or format falls to city and a day, never to nothing', () => {
    const r = recommendSeatPrice({ department: 'Real Estate', location: 'moon', format: 'week' });
    expect(r.parts.location).toBe('city');
    expect(r.parts.format).toBe('day');
    expect(r.cents).toBe(20000);
  });
  it('the Word is never sold: a spiritual department prices at 0 and says it is an offering', () => {
    const r = recommendSeatPrice({ department: 'Living Lessons', location: 'major-metro', format: 'two-day', requested: 100, capacity: 10 });
    expect(r.cents).toBe(0);
    expect(r.offering).toBe(true);
    expect(explainPrice(r)).toMatch(/never sold/);
  });
  it('explains itself in one sentence a Governor can check', () => {
    const r = recommendSeatPrice({ department: 'Real Estate', location: 'metro', format: 'day', requested: 8, capacity: 10 });
    expect(explainPrice(r)).toBe('Business and stewardship at $199 a day x 1.25 (Metro) x 1 (One day (6 hours)) x 0.85 demand = $210 a seat.');
    expect(explainPrice(null)).toBe('');
  });
  it('the tables are frozen policy', () => {
    expect(Object.isFrozen(KNOWLEDGE_TYPES)).toBe(true);
    expect(Object.isFrozen(LOCATION_TIERS)).toBe(true);
    expect(Object.isFrozen(FORMATS)).toBe(true);
    expect(KNOWLEDGE_TYPES.spiritual.dayRateCents).toBe(0);
  });
});

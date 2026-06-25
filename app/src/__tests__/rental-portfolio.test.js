import { describe, it, expect } from 'vitest';
import { derivePortfolio, isPersonalProp, unitsOf } from '../lib/rental-portfolio.js';

// Real Estate header + rollup must be a LIVE view of the property records, never
// a painted literal (DR-0076). These tests are proven-to-catch: each asserts a
// number that MOVES with the data, so a regression to a static literal fails.

const ENTITIES = [
  { id: 'e-poeprops', name: 'Steward Real Estate LLC' },
  { id: 'e-personal', name: 'Personal' },
  { id: 'e-other', name: 'Other Holdings LLC' },
];

const prop = (over = {}) => ({
  id: over.id || 'r',
  entityId: 'e-poeprops',
  rent: 1000,
  actual: 1000,
  status: 'paying',
  mortgage: { balance: 80000, monthlyPI: 500 },
  ...over,
});

describe('isPersonalProp / unitsOf', () => {
  it('treats homes (type/status/entity) as personal, not rentals', () => {
    expect(isPersonalProp(prop({ propertyType: 'primary-home' }))).toBe(true);
    expect(isPersonalProp(prop({ propertyType: 'secondary-home' }))).toBe(true);
    expect(isPersonalProp(prop({ status: 'owner-occupied' }))).toBe(true);
    expect(isPersonalProp(prop({ entityId: 'e-personal' }))).toBe(true);
    expect(isPersonalProp(prop({ status: 'vacant' }))).toBe(false); // vacant rental stays a rental
  });

  it('units default to 1 and guard blank/zero/negative/fractional input', () => {
    expect(unitsOf(prop())).toBe(1);
    expect(unitsOf(prop({ units: 4 }))).toBe(4);
    expect(unitsOf(prop({ units: 0 }))).toBe(1);
    expect(unitsOf(prop({ units: -3 }))).toBe(1);
    expect(unitsOf(prop({ units: 2.6 }))).toBe(3);
    expect(unitsOf(prop({ units: '' }))).toBe(1);
  });
});

describe('door count is SUMMED from units, not a literal', () => {
  it('one door per single-unit property', () => {
    const rentals = [prop({ id: 'a' }), prop({ id: 'b' }), prop({ id: 'c' })];
    expect(derivePortfolio(rentals, ENTITIES).doorCount).toBe(3);
  });

  it('a multi-unit property contributes its units (a fourplex = 4 doors, 1 property)', () => {
    const rentals = [prop({ id: 'a' }), prop({ id: 'fourplex', units: 4 })];
    const d = derivePortfolio(rentals, ENTITIES);
    expect(d.portfolioCount).toBe(2); // two properties
    expect(d.doorCount).toBe(5); // 1 + 4 doors
  });

  it('count CHANGES when a property/unit is added or edited (live, not static)', () => {
    const base = [prop({ id: 'a' }), prop({ id: 'b' })];
    expect(derivePortfolio(base, ENTITIES).doorCount).toBe(2);
    const added = [...base, prop({ id: 'c', units: 3 })];
    expect(derivePortfolio(added, ENTITIES).doorCount).toBe(5);
  });

  it('excludes personal homes from the door count', () => {
    const rentals = [prop({ id: 'a' }), prop({ id: 'home', propertyType: 'primary-home', entityId: 'e-personal' })];
    expect(derivePortfolio(rentals, ENTITIES).doorCount).toBe(1);
  });
});

describe('entity label is resolved from the data, not hardcoded', () => {
  it('single owner → that entity name', () => {
    const rentals = [prop({ id: 'a' }), prop({ id: 'b' })];
    expect(derivePortfolio(rentals, ENTITIES).portfolioLabel).toBe('Steward Real Estate LLC');
  });

  it('mixed owners → neutral label (never a wrong LLC name)', () => {
    const rentals = [prop({ id: 'a', entityId: 'e-poeprops' }), prop({ id: 'b', entityId: 'e-other' })];
    expect(derivePortfolio(rentals, ENTITIES).portfolioLabel).toBe('Real Estate Portfolio');
  });

  it('no rentals → neutral label, zero doors', () => {
    const d = derivePortfolio([], ENTITIES);
    expect(d.portfolioLabel).toBe('Real Estate Portfolio');
    expect(d.doorCount).toBe(0);
  });
});

describe('rollup is summed + honest about gaps', () => {
  it('sums mortgage debt, P&I, rent across the portfolio (excludes personal)', () => {
    const rentals = [
      prop({ id: 'a', rent: 1100, actual: 1100, mortgage: { balance: 88000, monthlyPI: 556 } }),
      prop({ id: 'b', rent: 1400, actual: 550, mortgage: { balance: 110000, monthlyPI: 695 } }),
      prop({ id: 'home', propertyType: 'primary-home', entityId: 'e-personal', rent: 0, actual: 0, mortgage: { balance: 999999, monthlyPI: 2400 } }),
    ];
    const d = derivePortfolio(rentals, ENTITIES);
    expect(d.mortgageDebt).toBe(198000); // personal home's 999999 excluded
    expect(d.monthlyPI).toBe(1251);
    expect(d.monthlyRent).toBe(2500);
    expect(d.actualRent).toBe(1650);
    expect(d.rentGap).toBe(850); // expected − collected
    expect(Math.round(d.collectionRate)).toBe(66);
  });

  it('flags properties missing figures instead of silently zeroing the whole rollup', () => {
    const rentals = [
      prop({ id: 'has', rent: 1000, actual: 1000, mortgage: { balance: 80000, monthlyPI: 500 } }),
      prop({ id: 'nodebt', rent: 900, actual: 900, mortgage: { balance: 0, monthlyPI: 0 } }),
      prop({ id: 'norent', rent: 0, actual: 0, status: 'vacant', mortgage: { balance: 50000, monthlyPI: 300 } }),
    ];
    const d = derivePortfolio(rentals, ENTITIES);
    expect(d.portfolioCount).toBe(3);
    expect(d.missingDebt).toBe(1); // the nodebt property
    expect(d.missingRent).toBe(1); // the norent property
    expect(d.mortgageDebt).toBe(130000); // present figures still summed, not zeroed
    expect(d.monthlyRent).toBe(1900);
  });

  it('collection rate is 0 (not NaN) when there is no expected rent', () => {
    const rentals = [prop({ id: 'a', rent: 0, actual: 0, status: 'vacant' })];
    expect(derivePortfolio(rentals, ENTITIES).collectionRate).toBe(0);
  });
});

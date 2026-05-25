// =============================================================================
// FLAG-10 regression test — incidents must never drain monthly reserves
// =============================================================================
// Locks in the FLAG-10 fix from docs/05-financial-os/CALC-INVENTORY.md.
// Before the fix, every logged incident was silently added to
// `reserves.totalMonthly` as a perpetual monthly drain, biasing the
// debt-free projection pessimistic by exactly Σ incidents.amount per month.
// These tests assert that incidents contribute 0 to totalMonthly regardless
// of their amount, count, or any combination with other reserve sources.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { computeReserves } from '../lib/financial-calcs.js';

describe('FLAG-10 · computeReserves does not include incidents in totalMonthly', () => {
  it('returns 0 incidentMonthly when no incidents are logged', () => {
    const r = computeReserves({
      recurringObligations: [],
      taxCalendar: [],
      incidents: [],
    });
    expect(r.incidentMonthly).toBe(0);
    expect(r.totalMonthly).toBe(0);
  });

  it('returns 0 incidentMonthly even when incidents have large amounts', () => {
    const r = computeReserves({
      recurringObligations: [],
      taxCalendar: [],
      incidents: [
        { id: 'i1', amount: 5000, description: 'roof' },
        { id: 'i2', amount: 1200, description: 'medical' },
        { id: 'i3', amount: 800, description: 'car' },
      ],
    });
    expect(r.incidentMonthly).toBe(0);
    expect(r.totalMonthly).toBe(0);
  });

  it('totalMonthly equals recurring + tax only, never adds incidents', () => {
    const r = computeReserves({
      recurringObligations: [
        { enabled: true, frequency: 'annual', amount: 1200 }, // 100/mo
        { enabled: true, frequency: 'quarterly', amount: 300 }, // 100/mo
      ],
      taxCalendar: [
        { applies: true, amount: 2400 }, // 200/mo (straight-line)
      ],
      incidents: [
        { id: 'i1', amount: 9999, description: 'should never affect total' },
      ],
    });
    // recurring: 100 + 100 = 200
    // tax: 2400/12 = 200
    // incidents: 0 (FLAG-10)
    // total: 400
    expect(r.recurringMonthly).toBeCloseTo(200, 2);
    expect(r.taxMonthly).toBeCloseTo(200, 2);
    expect(r.incidentMonthly).toBe(0);
    expect(r.totalMonthly).toBeCloseTo(400, 2);
  });

  it('ignores monthly-frequency recurring (those are counted elsewhere)', () => {
    const r = computeReserves({
      recurringObligations: [
        { enabled: true, frequency: 'monthly', amount: 500 }, // skipped
        { enabled: true, frequency: 'quarterly', amount: 300 }, // 100/mo
      ],
      taxCalendar: [],
      incidents: [],
    });
    expect(r.recurringMonthly).toBeCloseTo(100, 2);
  });

  it('respects the enabled flag on recurring obligations', () => {
    const r = computeReserves({
      recurringObligations: [
        { enabled: false, frequency: 'quarterly', amount: 300 }, // skipped
        { enabled: true, frequency: 'quarterly', amount: 300 }, // 100/mo
      ],
      taxCalendar: [],
      incidents: [],
    });
    expect(r.recurringMonthly).toBeCloseTo(100, 2);
  });

  it('handles missing arrays gracefully (defensive defaults)', () => {
    const r = computeReserves({});
    expect(r.recurringMonthly).toBe(0);
    expect(r.taxMonthly).toBe(0);
    expect(r.incidentMonthly).toBe(0);
    expect(r.totalMonthly).toBe(0);
  });
});

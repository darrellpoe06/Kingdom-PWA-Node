// computePressure — the pressure slider's "to debt/mo" must be REAL, not painted
// (Darrell 2026-06-15: "all reports are supposed to be dynamic from a user's
// personal data... not fake"). The old code assumed a flat $2000 of discretionary
// spend for EVERYONE; now the discretionary lever is a % of the user's real
// flexible spend (outflows.household). These prove it: two users with different
// household spend get different available-to-debt, the tithe is never in the cut
// base, and reserves are deducted before anything is called "available."
import { describe, it, expect } from 'vitest';
import { computePressure } from '../lib/financial-calcs.js';

const MAP = { discretionaryCut: 25, rentGapClosure: 35 }; // pressure level 5
const TOTALS = { netCashFlow: 1000, rentGap: 0 };

describe('computePressure uses REAL outflows, not a flat $2000', () => {
  it('scales the discretionary cut to the user\'s real household spend', () => {
    const lean = computePressure(MAP, TOTALS, { household: 1200 }, 0);
    const rich = computePressure(MAP, TOTALS, { household: 4000 }, 0);
    // 25% of 1200 = 300; 25% of 4000 = 1000 — DIFFERENT, because it is real.
    expect(lean.discretionaryGain).toBe(300);
    expect(rich.discretionaryGain).toBe(1000);
    expect(lean.extraAvailable).not.toBe(rich.extraAvailable);
  });

  it('does NOT assume the old flat $2000 base for a user who has no household spend', () => {
    const none = computePressure(MAP, TOTALS, { household: 0 }, 0);
    expect(none.discretionaryGain).toBe(0); // old code would have given 500 (25% of 2000)
    expect(none.discretionaryBase).toBe(0);
  });

  it('never pulls the tithe (charitableGiving) into the cut base', () => {
    const r = computePressure(MAP, TOTALS, { household: 1000, charitableGiving: 5000 }, 0);
    // base is household only; the 5000 tithe is untouched by the cut math.
    expect(r.discretionaryBase).toBe(1000);
    expect(r.discretionaryGain).toBe(250);
  });

  it('captures the rent gap and deducts reserves before calling money "available"', () => {
    const r = computePressure(MAP, { netCashFlow: 500, rentGap: 1000 }, { household: 800 }, 600);
    // rentCapture 35% of 1000 = 350; discretionary 25% of 800 = 200;
    // gross = 500 + 350 + 200 = 1050; minus 600 reserves = 450.
    expect(r.rentCapture).toBe(350);
    expect(r.grossAvailable).toBe(1050);
    expect(r.extraAvailable).toBe(450);
  });

  it('never returns negative available money', () => {
    const r = computePressure(MAP, { netCashFlow: 0, rentGap: 0 }, { household: 100 }, 9999);
    expect(r.extraAvailable).toBe(0);
  });
});

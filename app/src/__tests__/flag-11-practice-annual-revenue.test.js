// =============================================================================
// FLAG-11 regression test — Practice ANNUAL_REVENUE_PER_CLIENT must equal $7,200
// =============================================================================
// Locks in the FLAG-11 fix from docs/05-financial-os/CALC-INVENTORY.md.
// Before the fix, the Practice pipeline-revenue formulas used `× 150 × 12`
// which produced $1,800/client/year — 4× lower than the disclosure shown
// to the user ("$150/session, 1 session/week, 48 weeks/year, ~$7.2K/client/yr").
// The fix introduced explicit constants and changed the formula to use
// ACTIVE_WEEKS_PER_YEAR = 48 instead of 12. These tests assert the math
// matches the disclosure.
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  RATE_PER_SESSION,
  SESSIONS_PER_WEEK,
  ACTIVE_WEEKS_PER_YEAR,
  ANNUAL_REVENUE_PER_CLIENT,
} from '../components/Practice.jsx';

describe('FLAG-11 · Practice annual revenue per client', () => {
  it('RATE_PER_SESSION is $150', () => {
    expect(RATE_PER_SESSION).toBe(150);
  });

  it('SESSIONS_PER_WEEK is 1', () => {
    expect(SESSIONS_PER_WEEK).toBe(1);
  });

  it('ACTIVE_WEEKS_PER_YEAR is 48 (NOT 12)', () => {
    // The bug was using 12 instead of 48. If this assertion fails, the
    // disclosure-shown-to-Christina and the math no longer agree.
    expect(ACTIVE_WEEKS_PER_YEAR).toBe(48);
  });

  it('ANNUAL_REVENUE_PER_CLIENT is $7,200 (matches the UI disclosure)', () => {
    expect(ANNUAL_REVENUE_PER_CLIENT).toBe(7200);
  });

  it('ANNUAL_REVENUE_PER_CLIENT equals rate × sessions/week × weeks/year', () => {
    expect(ANNUAL_REVENUE_PER_CLIENT).toBe(
      RATE_PER_SESSION * SESSIONS_PER_WEEK * ACTIVE_WEEKS_PER_YEAR
    );
  });

  it('Five converted clients produce $36,000/year (4× the broken figure)', () => {
    // Sanity check the most common usage: stats.converted * ANNUAL_REVENUE_PER_CLIENT.
    // Pre-fix the same calculation produced $9,000. The 4× difference is exactly
    // the (48 weeks / 12 months) ratio.
    const converted = 5;
    expect(converted * ANNUAL_REVENUE_PER_CLIENT).toBe(36000);
  });
});

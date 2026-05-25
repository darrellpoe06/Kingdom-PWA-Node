// frequencyToMonthly — simple frequency-to-monthly amount converter (C10
// in CALC-INVENTORY.md). Sanity tests for each supported frequency.
import { describe, it, expect } from 'vitest';
import { frequencyToMonthly } from '../lib/financial-calcs.js';

describe('frequencyToMonthly', () => {
  it('monthly returns the amount unchanged', () => {
    expect(frequencyToMonthly(100, 'monthly')).toBe(100);
  });

  it('quarterly divides by 3', () => {
    expect(frequencyToMonthly(300, 'quarterly')).toBe(100);
  });

  it('semi-annual divides by 6', () => {
    expect(frequencyToMonthly(600, 'semi-annual')).toBe(100);
  });

  it('annual divides by 12', () => {
    expect(frequencyToMonthly(1200, 'annual')).toBe(100);
  });

  it('biennial divides by 24', () => {
    expect(frequencyToMonthly(2400, 'biennial')).toBe(100);
  });

  it('unknown frequency returns 0 (defensive default)', () => {
    expect(frequencyToMonthly(1000, 'weekly')).toBe(0);
    expect(frequencyToMonthly(1000, undefined)).toBe(0);
  });
});

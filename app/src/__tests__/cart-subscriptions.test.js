// Cart · Subscriptions — the billing-cycle math the copy always promised.
// The cycle options said "(÷3 for monthly)" / "(÷12 for monthly)" but no
// division existed anywhere: an annual charge was counted at full value every
// month, overstating the headline "monthly bleed" by up to 12x (2026-07-03
// claims audit — the one real math bug found in the Books cluster). monthlyOf
// is the single conversion; these pins make the promise un-breakable.
import { describe, it, expect } from 'vitest';
import { monthlyOf, CYCLE_MONTHS } from '../components/Cart.jsx';

describe('monthlyOf — the entered amount divided by its billing cycle', () => {
  it('monthly passes through; quarterly ÷3; annual ÷12 (the promised math)', () => {
    expect(monthlyOf({ monthly: 30, billingCycle: 'monthly' })).toBe(30);
    expect(monthlyOf({ monthly: 30, billingCycle: 'quarterly' })).toBe(10);
    expect(monthlyOf({ monthly: 120, billingCycle: 'annual' })).toBe(10);
  });
  it('the exact bug shape: a $120 annual sub is $10/mo, never $120/mo', () => {
    expect(monthlyOf({ monthly: 120, billingCycle: 'annual' })).not.toBe(120);
  });
  it('missing/unknown cycle degrades to monthly; junk amounts read 0', () => {
    expect(monthlyOf({ monthly: 15 })).toBe(15);
    expect(monthlyOf({ monthly: 15, billingCycle: 'fortnightly' })).toBe(15);
    expect(monthlyOf({ monthly: 'abc', billingCycle: 'annual' })).toBe(0);
    expect(monthlyOf(null)).toBe(0);
  });
  it('the cycle table stays in lockstep with the form options', () => {
    expect(Object.keys(CYCLE_MONTHS).sort()).toEqual(['annual', 'monthly', 'quarterly']);
  });
});

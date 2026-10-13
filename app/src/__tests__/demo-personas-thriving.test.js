// Proven-to-catch gate (DR-0076) for the family-unit sample set.
//
// Darrell, 2026-07-06: the seed/sample data "looks like we are broke and not
// doing at least okay — give a better picture of a THRIVING family operation
// because they use the PoeTech App." SEED-DATA-AS-ASPIRATION requires the
// showcase to model success: steady income, a funded buffer, debt being chipped
// down, consistent tithe, growing savings. This test fails the build if any
// picker persona ever regresses back to a "broke" picture, so the aspiration is
// enforced by a machine check, not a promise.
//
// The demo anchor date is 2026-05-15 (see the currentDate memo in the shell), so
// balances are derived as-of that day to match exactly what a viewer sees.
import { describe, it, expect } from 'vitest';
import { DEMO_DATA_BY_PERSONA } from '../poe-financial-mvp-v28.jsx';
import {
  deriveEntityRollups,
  deriveMonthlyFlows,
  liveCashOnHand,
} from '../lib/financial-engineering.js';

const ANCHOR = new Date(2026, 4, 15); // 2026-05-15, the demo "today"

const personas = Object.entries(DEMO_DATA_BY_PERSONA);

describe('every picker persona reads as a THRIVING operation, never broke', () => {
  it('the sample set covers a real spread of family-unit types', () => {
    // Guards against the set silently shrinking back to one persona.
    expect(personas.length).toBeGreaterThanOrEqual(9);
    for (const key of ['family-of-1', 'family-of-2', 'family-of-3', 'family-of-4', 'family-of-5', 'family-of-7']) {
      expect(DEMO_DATA_BY_PERSONA[key]).toBeTruthy();
    }
  });

  for (const [key, data] of personas) {
    describe(key, () => {
      it('holds comfortably positive spendable cash (not broke)', () => {
        const { total } = liveCashOnHand(data, ANCHOR);
        expect(total).toBeGreaterThan(5000);
      });

      it('has a funded buffer fund (SEED-DATA-AS-ASPIRATION)', () => {
        const target = data.meta?.bufferTarget || 0;
        const current = data.meta?.bufferCurrent || 0;
        expect(target).toBeGreaterThan(0);
        // Funded = at least 80% of target. The shipped set funds to 100%.
        expect(current).toBeGreaterThanOrEqual(target * 0.8);
      });

      it('runs a monthly surplus (income exceeds outflow)', () => {
        const flows = deriveMonthlyFlows(data);
        expect(flows.monthlyInflow).toBeGreaterThan(0);
        expect(flows.netMonthly).toBeGreaterThan(0);
      });

      it('carries only manageable debt (well under liquid cash — being chipped down)', () => {
        const { total: cash } = liveCashOnHand(data, ANCHOR);
        const debtTotal = (data.debts || []).reduce((s, d) => s + (Number(d.balance) || 0), 0);
        expect(debtTotal).toBeLessThan(cash);
      });

      it('keeps a consistent tithe / charitable giving', () => {
        expect(data.outflows?.charitableGiving || 0).toBeGreaterThan(0);
      });

      it('shows no all-zero "dead" entity card — every entity has cash or income', () => {
        const rollups = deriveEntityRollups(data, data.entities, ANCHOR);
        expect(rollups.length).toBeGreaterThan(0);
        for (const r of rollups) {
          const alive = r.cashBalance > 0 || r.inflow > 0;
          expect(alive, `entity "${r.entity.name}" reads as $0/dead`).toBe(true);
        }
      });
    });
  }
});

// @vitest-environment node
//
// monthly-baseline — an off month is caught against the usual (Darrell 2026-07-18:
// "monitor changes in the totals month to month for excess or lack based on their
// usual amounts each month — this would be caught").
import { describe, it, expect } from 'vitest';
import { monthlyExternalTotals, baselineAnomalies, baselineMonthLabel } from '../lib/monthly-baseline.js';

describe('monthlyExternalTotals', () => {
  it('groups by month and excludes internal transfers from the totals', () => {
    const accounts = [{ id: 'chk' }, { id: 'sav' }];
    const txns = [
      { id: 's', accountId: 'chk', date: '2026-06-01', amount: 3000, description: 'PAYROLL' },        // real in
      { id: 'g', accountId: 'chk', date: '2026-06-02', amount: -400, description: 'GROCERIES' },       // real out
      { id: 'o', accountId: 'chk', date: '2026-06-03', amount: -5000, description: 'TRANSFER TO SAVINGS' },
      { id: 'i', accountId: 'sav', date: '2026-06-03', amount: 5000, description: 'TRANSFER FROM CHECKING' },
    ];
    const [june] = monthlyExternalTotals(txns, accounts);
    expect(june.month).toBe('2026-06');
    expect(june.in).toBe(3000);   // the 5000 transfer leg excluded
    expect(june.out).toBe(400);
    expect(june.internalCount).toBe(2);
  });
});

describe('baselineAnomalies — flag the unusual month', () => {
  const months = [
    { month: '2026-01', in: 30000, out: 28000, net: 2000 },
    { month: '2026-02', in: 31000, out: 29000, net: 2000 },
    { month: '2026-03', in: 29000, out: 27000, net: 2000 },
    { month: '2026-04', in: 69000, out: 66000, net: 3000 }, // the inflated month
    { month: '2026-05', in: 30500, out: 28500, net: 2000 },
  ];

  it('catches an income month that is way above the usual', () => {
    const flags = baselineAnomalies(months, { metric: 'in', tolerancePct: 0.4, floor: 2000 });
    expect(flags).toHaveLength(1);
    expect(flags[0].month).toBe('2026-04');
    expect(flags[0].kind).toBe('excess');
    expect(flags[0].baseline).toBe(30250); // leave-one-out median of {30000,31000,29000,30500}
  });

  it('catches a shortfall month too', () => {
    const low = [
      { month: '2026-01', in: 30000 }, { month: '2026-02', in: 31000 },
      { month: '2026-03', in: 29000 }, { month: '2026-04', in: 5000 }, // way under
      { month: '2026-05', in: 30500 },
    ];
    const flags = baselineAnomalies(low, { metric: 'in' });
    expect(flags[0].month).toBe('2026-04');
    expect(flags[0].kind).toBe('shortfall');
  });

  it('does not flag when every month is within tolerance', () => {
    const steady = [
      { month: '2026-01', in: 30000 }, { month: '2026-02', in: 31000 },
      { month: '2026-03', in: 29500 }, { month: '2026-04', in: 30500 },
    ];
    expect(baselineAnomalies(steady, { metric: 'in' })).toHaveLength(0);
  });

  it('needs minMonths of history before it judges anything', () => {
    expect(baselineAnomalies([{ month: '2026-01', in: 30000 }, { month: '2026-02', in: 99000 }], { minMonths: 3 })).toHaveLength(0);
  });

  it('baselineMonthLabel renders a friendly month', () => {
    expect(baselineMonthLabel('2026-04')).toBe('April 2026');
  });
});

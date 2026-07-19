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

  it('baselines over ACTIVE months when the ledger starts mid-history (empty early months excluded)', () => {
    // The real bug (Darrell 2026-07-19): the ledger spans back to 2024 but statements
    // were only imported for recent months, so early months are EMPTY ($0). Baselining
    // over ALL months makes "usual" ~$0, so every real ~$30-44k month reads as a
    // +thousands% anomaly. Excluding empties makes "usual" a typical ACTIVE month.
    const withEmptyHistory = [
      { month: '2024-06', out: 0 }, { month: '2024-07', out: 0 }, { month: '2024-08', out: 0 },
      { month: '2024-09', out: 0 }, { month: '2024-10', out: 0 }, { month: '2024-11', out: 0 },
      { month: '2026-03', out: 28642 }, { month: '2026-04', out: 32297 },
      { month: '2026-05', out: 44387 }, { month: '2026-06', out: 44655 }, { month: '2026-07', out: 30508 },
    ];
    const flags = baselineAnomalies(withEmptyHistory, { metric: 'out', tolerancePct: 0.4, floor: 2000 });
    // PROVEN-TO-CATCH: with the empty months INCLUDED the baseline is 0 and every
    // active month flags at Infinity% (deviationPct null). Excluded, "usual" is the
    // active-month median (~$31.4k) and only the genuinely-higher months flag, at a
    // SANE percentage — no near-zero baseline, no Infinity deviation.
    expect(flags.every((f) => f.baseline > 25000)).toBe(true);       // usual is a real month, not ~$0
    expect(flags.every((f) => f.deviationPct !== null && f.deviationPct < 100)).toBe(true); // sane %, not +thousands
    expect(flags.map((f) => f.month).sort()).toEqual(['2026-05', '2026-06']); // only the two highest months
  });

  it('still flags a genuine outlier among active months (a truly doubled month)', () => {
    const oneDoubled = [
      { month: '2024-06', out: 0 }, { month: '2024-07', out: 0 },
      { month: '2026-04', out: 30000 }, { month: '2026-05', out: 31000 },
      { month: '2026-06', out: 29000 }, { month: '2026-07', out: 66000 }, // the real outlier
    ];
    const flags = baselineAnomalies(oneDoubled, { metric: 'out', tolerancePct: 0.4, floor: 2000 });
    expect(flags).toHaveLength(1);
    expect(flags[0].month).toBe('2026-07');
    expect(flags[0].kind).toBe('excess');
  });

  it('baselineMonthLabel renders a friendly month', () => {
    expect(baselineMonthLabel('2026-04')).toBe('April 2026');
  });
});

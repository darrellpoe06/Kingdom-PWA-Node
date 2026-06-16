// =============================================================================
// number-trace.test.js — the traceable-number panels show REAL inputs + sources
// =============================================================================
// Darrell 2026-06-16: "click on the number in the budget and have it be a link
// to the sources so users like myself can see the underlying numbers and
// sources." These tests lock the contract that each trace panel:
//   (a) reports the same result the budget figure displays (no drift),
//   (b) lists the real input values that feed it, and
//   (c) enumerates the real source rows/records it traces to.
// Per DR-0076 (verification doctrine): a green check must mean something, so
// the assertions check actual numbers against the fixture, not just shape.
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  traceTotalInflow,
  traceTotalOutflow,
  traceNetCashFlow,
  traceCashOnHand,
  traceConsumerDebt,
  traceCollectionRate,
  traceReserves,
  traceToDebt,
  traceDebtFree,
  traceRentalsFree,
} from '../lib/number-trace.js';

// A small, fully-known fixture so every assertion has a hand-computed answer.
const data = {
  inflows: {
    salaries: [
      { who: 'Adam', source: 'University', actual: 4000 },
      { who: 'Naomi', source: 'Practice', actual: 3000 },
    ],
    rentals: [
      { name: '1 Maple', rent: 1000, actual: 1000, mortgage: { balance: 80000, rate: 6, monthlyPI: 500 } },
      { name: '2 Oak', rent: 1000, actual: 500, mortgage: { balance: 90000, rate: 6, monthlyPI: 560 } },
      // rent === 0 -> personal home, must NOT count toward rental math
      { name: 'Home', rent: 0, actual: 0, mortgage: { balance: 200000, rate: 4, monthlyPI: 1500 } },
    ],
  },
  outflows: { household: 2000, debtService: 1000, charitableGiving: 500 },
  accounts: [
    { name: 'Checking', type: 'checking', balance: 3000 },
    { name: 'Savings', type: 'savings', balance: 5000 },
    { name: 'Frozen', type: 'savings', balance: 9999, inLegal: true }, // excluded
    { name: 'Visa', type: 'credit', balance: -1200 }, // not cash
  ],
  debts: [
    { name: 'Card A', balance: 1500, rate: 24, minPayment: 50 },
    { name: 'Loan B', balance: 8500, rate: 12, minPayment: 200 },
    { name: 'Ignored', balance: 4000, rate: 5, minPayment: 100, leaveAlone: true }, // excluded
  ],
  recurringObligations: [
    { name: 'LLC report', amount: 225, frequency: 'annual', enabled: true },
    { name: 'Insurance', amount: 800, frequency: 'monthly', enabled: true }, // excluded (monthly)
    { name: 'Disabled', amount: 600, frequency: 'annual', enabled: false }, // excluded
  ],
  taxCalendar: [
    { name: 'IL LLC', amount: 240, applies: true },
    { name: 'No amount', applies: true }, // excluded (no amount)
  ],
};

// `totals` mirrors the MVP useMemo for this fixture (hand-computed).
const salaryActual = 7000;
const rentalActual = 1500; // 1000 + 500 (home excluded)
const rentalExpected = 2000; // 1000 + 1000
const totals = {
  salaryActual,
  rentalActual,
  rentalExpected,
  rentGap: rentalExpected - rentalActual,
  collectionRate: (rentalActual / rentalExpected) * 100, // 75
  totalInflow: salaryActual + rentalActual, // 8500
  totalOutflow: 3500, // 2000 + 1000 + 500
  netCashFlow: 8500 - 3500, // 5000
  totalConsumerDebt: 10000, // 1500 + 8500 (Ignored excluded)
  allAccountsCash: 8000, // 3000 + 5000 (frozen + credit excluded)
};

describe('traceNetCashFlow', () => {
  const t = traceNetCashFlow(data, totals);
  it('result matches the displayed figure', () => {
    expect(t.result.value).toBe(5000);
  });
  it('explains the math in plain terms', () => {
    expect(t.formula).toMatch(/inflow/i);
    expect(t.formula).toMatch(/outflow/i);
  });
  it('lists inflow and outflow as inputs', () => {
    const labels = t.inputs.map((i) => i.label);
    expect(labels).toContain('Total inflow');
    expect(labels).toContain('Total outflow');
    expect(t.inputs.find((i) => i.label === 'Total outflow').op).toBe('−');
  });
  it('traces to the real source rows (salaries, rentals, outflow categories)', () => {
    const labels = t.sources.map((s) => s.label);
    expect(labels).toContain('Household / living');
    expect(labels).toContain('Charitable giving / tithe');
    // outflow rows are subtracted
    expect(t.sources.find((s) => s.label === 'Household / living').op).toBe('−');
  });
});

describe('traceTotalInflow', () => {
  const t = traceTotalInflow(data, totals);
  it('result is 8500', () => expect(t.result.value).toBe(8500));
  it('source rows are the two paychecks + the two paying rentals (home excluded)', () => {
    const labels = t.sources.map((s) => s.label);
    expect(labels).toContain('Adam — University');
    expect(labels).toContain('Naomi — Practice');
    expect(labels).toContain('1 Maple');
    expect(labels).toContain('2 Oak');
    expect(labels).not.toContain('Home'); // rent === 0
  });
  it('source values sum to the result', () => {
    const sum = t.sources.reduce((s, r) => s + r.value, 0);
    expect(sum).toBe(t.result.value);
  });
});

describe('traceTotalOutflow', () => {
  const t = traceTotalOutflow(data, totals);
  it('result is 3500', () => expect(t.result.value).toBe(3500));
  it('one source per outflow category', () => {
    expect(t.sources).toHaveLength(3);
    const sum = t.sources.reduce((s, r) => s + r.value, 0);
    expect(sum).toBe(3500);
  });
});

describe('traceCashOnHand', () => {
  const t = traceCashOnHand(data, totals);
  it('result is 8000', () => expect(t.result.value).toBe(8000));
  it('excludes legal-hold and non-cash accounts from sources', () => {
    const labels = t.sources.map((s) => s.label);
    expect(labels).toContain('Checking');
    expect(labels).toContain('Savings');
    expect(labels).not.toContain('Frozen');
    expect(labels).not.toContain('Visa');
  });
  it('cash source values sum to the result', () => {
    expect(t.sources.reduce((s, r) => s + r.value, 0)).toBe(8000);
  });
});

describe('traceConsumerDebt', () => {
  const t = traceConsumerDebt(data, totals);
  it('result is 10000', () => expect(t.result.value).toBe(10000));
  it('excludes leave-alone debts and carries APR meta', () => {
    const labels = t.sources.map((s) => s.label);
    expect(labels).toContain('Card A');
    expect(labels).toContain('Loan B');
    expect(labels).not.toContain('Ignored');
    expect(t.sources.find((s) => s.label === 'Card A').meta).toMatch(/24%/);
  });
  it('debt source values sum to the result', () => {
    expect(t.sources.reduce((s, r) => s + r.value, 0)).toBe(10000);
  });
});

describe('traceCollectionRate', () => {
  const t = traceCollectionRate(data, totals);
  it('result is 75%', () => expect(t.result.value).toBeCloseTo(75, 5));
  it('inputs are received and expected rent', () => {
    const labels = t.inputs.map((i) => i.label);
    expect(labels).toContain('Rent received');
    expect(labels).toContain('Rent expected');
  });
  it('lists each income-producing rental as a source (home excluded)', () => {
    expect(t.sources).toHaveLength(2);
  });
});

describe('traceReserves', () => {
  const reserves = { recurringMonthly: 225 / 12, taxMonthly: 240 / 12, totalMonthly: 225 / 12 + 240 / 12 };
  const t = traceReserves(data, reserves);
  it('result matches reserves.totalMonthly', () => {
    expect(t.result.value).toBeCloseTo(225 / 12 + 240 / 12, 5);
  });
  it('source rows exclude monthly + disabled obligations and amount-less tax items', () => {
    const labels = t.sources.map((s) => s.label);
    expect(labels).toContain('LLC report');
    expect(labels).toContain('IL LLC');
    expect(labels).not.toContain('Insurance'); // monthly
    expect(labels).not.toContain('Disabled'); // disabled
    expect(labels).not.toContain('No amount'); // no amount
  });
});

describe('traceToDebt', () => {
  const pressureCalc = {
    netCashFlow: 5000,
    rentCapture: 250,
    discretionaryGain: 500,
    discretionaryBase: 2000,
    reservesDeducted: 100,
    extraAvailable: 5650,
    stress: 'Moderate',
    rentGapClosure: 50,
    discretionaryCut: 25,
  };
  const t = traceToDebt(data, totals, pressureCalc);
  it('result matches pressureCalc.extraAvailable', () => {
    expect(t.result.value).toBe(5650);
  });
  it('inputs include the redirect levers and the reserves deduction', () => {
    const subtracted = t.inputs.find((i) => i.op === '−');
    expect(subtracted.label).toMatch(/reserves/i);
    expect(t.inputs.some((i) => i.value === 250)).toBe(true); // rent capture
    expect(t.inputs.some((i) => i.value === 500)).toBe(true); // discretionary gain
  });
});

describe('traceDebtFree', () => {
  const projection = { debtFreeDate: 'Mar 2029', debtFreeYears: 2.8, totalInterestPaid: 1234 };
  const pressureCalc = { extraAvailable: 5650 };
  it('date variant reports the payoff date', () => {
    const t = traceDebtFree(data, totals, projection, pressureCalc, 'date');
    expect(t.result.value).toBe('Mar 2029');
    expect(t.result.kind).toBe('date');
  });
  it('years variant reports the years figure', () => {
    const t = traceDebtFree(data, totals, projection, pressureCalc, 'years');
    expect(t.result.value).toBe(2.8);
  });
  it('interest variant reports total interest', () => {
    const t = traceDebtFree(data, totals, projection, pressureCalc, 'interest');
    expect(t.result.value).toBe(1234);
  });
  it('source rows are the debts being paid down (leave-alone excluded)', () => {
    const t = traceDebtFree(data, totals, projection, pressureCalc, 'date');
    const labels = t.sources.map((s) => s.label);
    expect(labels).toContain('Card A');
    expect(labels).not.toContain('Ignored');
  });
});

describe('traceRentalsFree', () => {
  const rentalSnowball = { allClearedDate: 'Jun 2034', allClearedYears: 8.0 };
  const t = traceRentalsFree(data, rentalSnowball, 800, 'date');
  it('reports the cleared date', () => {
    expect(t.result.value).toBe('Jun 2034');
  });
  it('sources are the two rental mortgages (home rent===0 excluded)', () => {
    expect(t.sources).toHaveLength(2);
    const total = t.sources.reduce((s, r) => s + r.value, 0);
    expect(total).toBe(170000); // 80000 + 90000
  });
});

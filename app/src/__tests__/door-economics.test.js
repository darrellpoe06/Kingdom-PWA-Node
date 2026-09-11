// door-economics — the parts add up to the total, and "not entered" is never
// zero (DR-0359, migration 0203). Darrell 2026-09-11: "Mortgage payments for
// should be line items calculated to the total... taxes... insurance... etc...
// then the tenants payments each month need to show the difference in the two
// for gap/profit analytics."
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  LINE_KINDS, LINE_KIND_KEYS, toCents, money, monthOf, linesSum, validateLines,
  doorMonth, gapReading, portfolioMonth, DOOR_TERMS,
} from '../lib/door-economics.js';

const here = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(resolve(here, p), 'utf8');
const M203 = read('../../../infra/supabase/migrations-auto/0203-a-mortgage-in-line-items-and-what-each-door-costs-against-what-it-collects.sql');
const LEG = read('../../../.github/workflows/rls-isolation.yml');

// A real PITI payment: the parts of one mortgage bill.
const PITI = [
  { kind: 'principal-interest', amountCents: 94212 },
  { kind: 'taxes', amountCents: 31500 },
  { kind: 'insurance', amountCents: 9800 },
];
const PITI_TOTAL = 94212 + 31500 + 9800;   // 135512

describe('money is integer cents, never a float', () => {
  it('parses what a person actually types', () => {
    expect(toCents('$1,234.56')).toBe(123456);
    expect(toCents(1234.56)).toBe(123456);
    expect(toCents('942.12')).toBe(94212);
    expect(Number.isNaN(toCents('abc'))).toBe(true);
    expect(Number.isNaN(toCents(''))).toBe(true);
  });

  it('does not drift the way floats do — ten dimes is exactly a dollar', () => {
    const dimes = Array.from({ length: 10 }, () => ({ kind: 'other', label: 'dime', amountCents: toCents('0.10') }));
    expect(linesSum(dimes)).toBe(100);
    expect(money(linesSum(dimes))).toBe('$1.00');
  });

  it('shows a credit as negative rather than hiding the sign', () => {
    expect(money(-41200)).toBe('-$412.00');
    expect(money(null)).toBe('—');
  });
});

describe('the line items add up to the total', () => {
  it('accepts a real PITI payment whose parts sum exactly', () => {
    expect(linesSum(PITI)).toBe(PITI_TOTAL);
    expect(validateLines(PITI, PITI_TOTAL)).toEqual([]);
  });

  it('refuses a set that is short, and says by how much', () => {
    const errors = validateLines(PITI, PITI_TOTAL + 5000);
    expect(errors.length).toBe(1);
    expect(errors[0]).toContain('$50.00');
    expect(errors[0]).toContain('is missing');
  });

  it('refuses a set that overshoots, and says by how much', () => {
    const errors = validateLines(PITI, PITI_TOTAL - 2500);
    expect(errors[0]).toContain('$25.00');
    expect(errors[0]).toContain('too much');
  });

  it('a bill with no line items is legitimate — not every bill has parts', () => {
    expect(validateLines([], 5000)).toEqual([]);
  });

  it('an escrow CREDIT may be negative, and still has to make the total work', () => {
    const withCredit = [...PITI, { kind: 'escrow', amountCents: -4000 }];
    expect(validateLines(withCredit, PITI_TOTAL - 4000)).toEqual([]);
  });

  it('refuses a line for nothing, and an unlabelled "other"', () => {
    expect(validateLines([{ kind: 'taxes', amountCents: 0 }], 0).join(' ')).toContain('a line for nothing');
    expect(validateLines([{ kind: 'other', amountCents: 100 }], 100).join(' ')).toContain('has to say what it is');
    expect(validateLines([{ kind: 'made-up', amountCents: 100 }], 100).join(' ')).toContain('what kind of charge');
  });
});

describe('a door, a month, and the gap', () => {
  const month = '2026-07-01';

  it('stores a period as the first of its month, however it was typed', () => {
    expect(monthOf('2026-07-19')).toBe('2026-07-01');
    expect(monthOf('2026-07-01')).toBe('2026-07-01');
    expect(monthOf('nonsense')).toBe('');
  });

  it('reports the gap against money that ACTUALLY ARRIVED, not what was billed', () => {
    const d = doorMonth({
      rentalId: 'door-1', month,
      payables: [{ amountCents: PITI_TOTAL }],
      receivables: [{ amountCents: 160000 }],      // billed $1,600
      settlements: [{ amountCents: 120000 }],      // only $1,200 came
      lines: PITI,
    });
    expect(d.costCents).toBe(PITI_TOTAL);
    expect(d.billedCents).toBe(160000);
    expect(d.collectedCents).toBe(120000);
    // Against real money the month was short, even though the BILL covered it.
    expect(d.gapCents).toBe(120000 - PITI_TOTAL);
    expect(d.gapCents).toBeLessThan(0);
    // And the tenant still owes the difference.
    expect(d.shortfallCents).toBe(40000);
    expect(gapReading(d).state).toBe('shortfall');
  });

  it('breaks the cost into the parts a mortgage statement names', () => {
    const d = doorMonth({ rentalId: 'door-1', month, payables: [{ amountCents: PITI_TOTAL }], lines: PITI });
    expect(d.costByKind).toEqual({ 'principal-interest': 94212, taxes: 31500, insurance: 9800 });
    // And those parts are the cost. Nothing is outside the breakdown.
    const partsTotal = Object.values(d.costByKind).reduce((a, b) => a + b, 0);
    expect(partsTotal).toBe(d.costCents);
  });

  it('a month that collected more than it cost reads as profit, with the amount', () => {
    const d = doorMonth({
      rentalId: 'door-1', month,
      payables: [{ amountCents: PITI_TOTAL }],
      receivables: [{ amountCents: 160000 }],
      settlements: [{ amountCents: 160000 }],
    });
    expect(d.gapCents).toBe(160000 - PITI_TOTAL);
    const r = gapReading(d);
    expect(r.state).toBe('profit');
    expect(r.plain).toContain(money(160000 - PITI_TOTAL));
    // Every term carries the sentence a child gets.
    expect(r.childExplains.length).toBeGreaterThan(10);
  });

  it('exactly covered reads as break-even, not as profit', () => {
    const d = doorMonth({
      rentalId: 'door-1', month,
      payables: [{ amountCents: 100000 }],
      receivables: [{ amountCents: 100000 }],
      settlements: [{ amountCents: 100000 }],
    });
    expect(d.gapCents).toBe(0);
    expect(gapReading(d).state).toBe('break-even');
  });
});

// The rule that matters most today: 11 of the 12 real doors carry no numbers.
describe('not entered is never zero', () => {
  it('an untouched door reports nothing, not a $0 cost', () => {
    const d = doorMonth({ rentalId: 'door-empty', month: '2026-07-01' });
    expect(d.entered).toBe(false);
    expect(d.costCents).toBeNull();
    expect(d.collectedCents).toBeNull();
    expect(d.gapCents).toBeNull();
    // The surface renders a dash, which is the honest glyph for "we do not know".
    expect(money(d.costCents)).toBe('—');
    expect(gapReading(d).state).toBe('not-entered');
  });

  it('a portfolio total says how many doors it actually covers', () => {
    const doors = [
      doorMonth({ rentalId: 'a', payables: [{ amountCents: 100000 }], settlements: [{ amountCents: 160000 }] }),
      doorMonth({ rentalId: 'b' }),
      doorMonth({ rentalId: 'c' }),
    ];
    const p = portfolioMonth(doors);
    expect(p.doors).toBe(3);
    expect(p.doorsEntered).toBe(1);
    expect(p.doorsNotEntered).toBe(2);
    expect(p.notEnteredIds).toEqual(['b', 'c']);
    expect(p.gapCents).toBe(60000);
    expect(p.complete).toBe(false);
    // A total over part of the portfolio must SAY it is over part of it.
    expect(p.basis).toContain('1 of 3');
  });

  it('a complete portfolio says so plainly', () => {
    const doors = [doorMonth({ rentalId: 'a', payables: [{ amountCents: 1 }] })];
    expect(portfolioMonth(doors).complete).toBe(true);
    expect(portfolioMonth(doors).basis).toContain('All 1');
  });
});

describe('the words teach', () => {
  it('every line kind carries the lender word, the plain word and a child sentence', () => {
    expect(LINE_KINDS.length).toBe(7);
    for (const k of LINE_KINDS) {
      expect(LINE_KIND_KEYS, k.key).toContain(k.key);
      expect(k.business.length, k.key).toBeGreaterThan(2);
      expect(k.plain.length, k.key).toBeGreaterThan(10);
      expect(k.childExplains.length, k.key).toBeGreaterThan(20);
    }
  });

  it('every door term names the rows it is defined against', () => {
    expect(DOOR_TERMS.length).toBeGreaterThanOrEqual(5);
    for (const t of DOOR_TERMS) {
      expect(t.where, t.business).toBeTruthy();
      expect(t.childExplains.length, t.business).toBeGreaterThan(10);
    }
  });
});

describe('migration 0203 keeps the promises in the database, not only here', () => {
  it('links the door by identity and pins the period to a month', () => {
    expect(M203).toMatch(/ADD COLUMN IF NOT EXISTS rental_id uuid REFERENCES public\.rentals\(id\)/);
    expect(M203).toMatch(/period_month = date_trunc\('month', period_month\)::date/);
  });

  it('refuses a second identical open charge on the same door and month', () => {
    expect(M203).toMatch(/CREATE UNIQUE INDEX IF NOT EXISTS obligations_door_month_recurring_uniq/);
  });

  it('enforces the sum rule as a DEFERRED constraint trigger, so a set writes at once', () => {
    expect(M203).toMatch(/CREATE CONSTRAINT TRIGGER obligation_lines_sum_trg/);
    expect(M203).toMatch(/DEFERRABLE INITIALLY DEFERRED/);
    expect(M203).toMatch(/line items must add up to the total/);
  });

  it('keeps 0202’s role wall — the child and the assistant never read the lines', () => {
    expect(M203).toMatch(/CREATE POLICY obligation_lines_books_read[\s\S]*?ARRAY\['','child','assistant'\]/);
    // And no write policy at all: the function is the only door in.
    expect(M203).not.toMatch(/CREATE POLICY obligation_lines_\w*(insert|update|delete)/i);
  });

  it('guards every role branch null-safely', () => {
    const branches = M203.match(/IF\s+(coalesce\()?v_role[\s\S]{0,60}?(NOT )?IN \(/g) || [];
    expect(branches.length).toBeGreaterThan(0);
    for (const b of branches) expect(b, b).toContain('coalesce(v_role');
  });

  it('door_month reports entered rather than inventing zeros', () => {
    expect(M203).toMatch(/'entered',\s+\(v_rows > 0 OR v_billed > 0 OR v_collected > 0\)/);
    expect(M203).toMatch(/'gapCents',\s+v_collected - v_cost/);
  });

  it('rides the product-forms isolation leg with its smoke', () => {
    expect(LEG).toMatch(/migrations: "[^"\n]*0203-a-mortgage-in-line-items[^"\n]*\.sql/);
    expect(LEG).toMatch(/smokes: "[^"\n]*0203-door-economics-smoke\.sql/);
  });
});

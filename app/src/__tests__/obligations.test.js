// =============================================================================
// The obligation ledger (DR-0358): payables and receivables with a due date, a
// derived status that cannot drift, aging on the standard ladder, and money in
// integer cents that never rounds. Plus the walls in 0202, both ways.
// DR-0076: every claim proven, including the ones that must FAIL.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DIRECTIONS, DIRECTION_IDS, TERMS, TERM_IDS, AGING_BUCKETS, LIFECYCLE, ACCOUNTING_TERMS, TERM_BY_NAME,
  toCents, money, daysBetween, addDays, dueDateFor,
  settledCents, balanceCents, creditCents, obligationStatus, STATUS_WORDS, daysPastDue, agingBucket,
  agingReport, dueWithin, netPosition, validateObligation, validateSettlement, direction, term,
} from '../lib/obligations.js';

const here = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(join(here, p), 'utf8');
const M202 = read('../../../infra/supabase/migrations-auto/0202-what-is-owed-what-was-paid-and-the-document-that-proves-it.sql');
const S202 = read('../../../infra/supabase/tests/0202-obligations-smoke.sql');
const LEG = read('../../../.github/workflows/rls-isolation.yml');

const TODAY = '2026-09-11';
const bill = (over = {}) => ({
  direction: 'payable', counterparty: 'Ameren', description: 'Electric, August',
  amountCents: 12500, terms: 'net-30', issuedOn: '2026-08-01', lifecycle: 'open', settlements: [], ...over,
});

describe('money is integers, and never rounds on the way through', () => {
  it('reads what a person types and prints what a person reads', () => {
    expect(toCents('$1,234.56')).toBe(123456);
    expect(toCents(12.5)).toBe(1250);
    expect(toCents('')).toBe(0);
    expect(toCents('nonsense')).toBe(0);
    expect(toCents(null)).toBe(0);
    expect(money(123456)).toBe('$1,234.56');
    expect(money(5)).toBe('$0.05');
    expect(money(-2500)).toBe('-$25.00');
    expect(money(0)).toBe('$0.00');
  });
  it('the float trap that makes a ledger argue with itself never happens here', () => {
    // 0.1 + 0.2 !== 0.3 in this language. In cents it is exact.
    expect(toCents(0.1) + toCents(0.2)).toBe(toCents(0.3));
    const pennies = Array.from({ length: 10 }, () => toCents(0.1));
    expect(pennies.reduce((a, b) => a + b, 0)).toBe(100);
  });
});

describe('a due date is what makes late countable at all', () => {
  it('the terms imply the date; agreed terms keep the date that was agreed', () => {
    expect(dueDateFor({ issuedOn: '2026-08-01', terms: 'net-30' })).toBe('2026-08-31');
    expect(dueDateFor({ issuedOn: '2026-08-01', terms: 'due-on-receipt' })).toBe('2026-08-01');
    expect(dueDateFor({ issuedOn: '2026-08-01', terms: 'net-15' })).toBe('2026-08-16');
    expect(dueDateFor({ terms: 'custom', dueDate: '2026-09-01' })).toBe('2026-09-01');
    expect(dueDateFor({ terms: 'custom' })).toBe('');
    expect(dueDateFor({})).toBe('');
  });
  it('day arithmetic crosses months and years without drift', () => {
    expect(daysBetween('2026-08-31', '2026-09-11')).toBe(11);
    expect(daysBetween('2026-12-31', '2027-01-01')).toBe(1);
    expect(daysBetween('2026-09-11', '2026-08-31')).toBe(-11);
    expect(daysBetween('nope', '2026-01-01')).toBeNull();
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01'); // 2026 is not a leap year
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });
});

describe('status is derived, so it can never disagree with the rows underneath', () => {
  it('open, past due, partial, paid — each from the settlements and the calendar', () => {
    expect(obligationStatus(bill(), { today: '2026-08-15' })).toBe('open');
    expect(obligationStatus(bill(), { today: TODAY })).toBe('past-due');
    expect(daysPastDue(bill(), { today: TODAY })).toBe(11);
    expect(daysPastDue(bill(), { today: '2026-08-15' })).toBeNull();

    const part = bill({ settlements: [{ amountCents: 5000, paidOn: '2026-08-20' }] });
    expect(obligationStatus(part, { today: '2026-08-25' })).toBe('partial');
    expect(balanceCents(part)).toBe(7500);
    expect(settledCents(part)).toBe(5000);
    // Late still outranks partial — a part-paid late bill is late.
    expect(obligationStatus(part, { today: TODAY })).toBe('past-due');

    const paid = bill({ settlements: [{ amountCents: 5000, paidOn: '2026-08-20' }, { amountCents: 7500, paidOn: '2026-08-28' }] });
    expect(obligationStatus(paid, { today: TODAY })).toBe('paid');
    expect(balanceCents(paid)).toBe(0);
  });
  it('an overpayment is a credit, never a negative debt', () => {
    const over = bill({ settlements: [{ amountCents: 13000, paidOn: '2026-08-20' }] });
    expect(balanceCents(over)).toBe(0);
    expect(creditCents(over)).toBe(500);
    expect(obligationStatus(over, { today: TODAY })).toBe('paid');
    expect(creditCents(bill())).toBe(0);
  });
  it('void and written-off outrank everything, and every status has words for a person', () => {
    expect(obligationStatus(bill({ lifecycle: 'void' }), { today: TODAY })).toBe('void');
    expect(obligationStatus(bill({ lifecycle: 'written-off' }), { today: TODAY })).toBe('written-off');
    for (const s of ['open', 'partial', 'paid', 'past-due', 'void', 'written-off']) {
      expect(STATUS_WORDS[s], s).toBeTruthy();
      expect(STATUS_WORDS[s].business.length, s).toBeGreaterThan(3);
      expect(STATUS_WORDS[s].plain.length, s).toBeGreaterThan(3);
    }
    expect(LIFECYCLE).toEqual(['open', 'void', 'written-off']);
  });
});

describe('aging is the standard ladder, and it sums real rows', () => {
  it('current, 1-30, 31-60, 61-90, 90+ — each boundary exactly where a business puts it', () => {
    expect(agingBucket(bill(), { today: '2026-08-15' })).toBe('current');
    expect(agingBucket(bill(), { today: '2026-08-31' })).toBe('current');   // due today is not late
    expect(agingBucket(bill(), { today: '2026-09-01' })).toBe('1-30');      // one day late
    expect(agingBucket(bill(), { today: '2026-09-30' })).toBe('1-30');      // 30 days
    expect(agingBucket(bill(), { today: '2026-10-01' })).toBe('31-60');     // 31 days
    expect(agingBucket(bill(), { today: '2026-10-31' })).toBe('61-90');
    expect(agingBucket(bill(), { today: '2027-01-01' })).toBe('90-plus');
    // Settled, void and written-off sit on no rung at all.
    expect(agingBucket(bill({ settlements: [{ amountCents: 12500, paidOn: '2026-08-02' }] }), { today: TODAY })).toBeNull();
    expect(agingBucket(bill({ lifecycle: 'void' }), { today: TODAY })).toBeNull();
    expect(AGING_BUCKETS.map((b) => b.id)).toEqual(['current', '1-30', '31-60', '61-90', '90-plus']);
  });
  it('the report totals both directions separately and never nets them into one number', () => {
    const rows = [
      bill(),
      bill({ counterparty: 'Water', amountCents: 4000, issuedOn: '2026-09-05' }),
      bill({ counterparty: 'Paid off', settlements: [{ amountCents: 12500, paidOn: '2026-08-10' }] }),
      bill({ direction: 'receivable', counterparty: 'Tenant', amountCents: 90000, terms: 'custom', dueDate: '2026-09-01' }),
      bill({ direction: 'receivable', counterparty: 'Gone', amountCents: 20000, terms: 'custom', dueDate: '2026-05-01', lifecycle: 'written-off' }),
    ];
    const r = agingReport(rows, { today: TODAY });
    expect(r.payable.count).toBe(2);                    // the paid one drops out
    expect(r.payable.outstandingCents).toBe(16500);
    expect(r.payable.pastDueCents).toBe(12500);         // only the August bill is late
    expect(r.payable.buckets['1-30'].cents).toBe(12500);
    expect(r.payable.buckets.current.cents).toBe(4000);
    expect(r.payable.settledThisSet).toBe(1);
    expect(r.receivable.outstandingCents).toBe(90000);
    expect(r.receivable.writtenOffCents).toBe(20000);   // named, not hidden
    // Both sides always shown; the net never stands alone.
    const net = netPosition(rows, { today: TODAY });
    expect(net).toMatchObject({ weOweCents: 16500, owedToUsCents: 90000, netCents: 73500, favours: 'us' });
    expect(netPosition([bill()], { today: TODAY }).favours).toBe('them');
    expect(netPosition([], { today: TODAY })).toMatchObject({ netCents: 0, favours: 'even' });
  });
  it('an empty ledger reports zeros rather than nothing, so a surface can say "nothing owed"', () => {
    const r = agingReport([], { today: TODAY });
    expect(r.payable.count).toBe(0);
    expect(r.payable.outstandingCents).toBe(0);
    expect(Object.keys(r.payable.buckets)).toEqual(['current', '1-30', '31-60', '61-90', '90-plus']);
  });
  it('what falls due soon is the week’s real work, soonest first, settled ones gone', () => {
    const rows = [
      bill({ counterparty: 'Later', terms: 'custom', dueDate: '2026-12-01' }),
      bill({ counterparty: 'Soon', terms: 'custom', dueDate: '2026-09-15' }),
      bill({ counterparty: 'Already late', terms: 'custom', dueDate: '2026-09-02' }),
      bill({ counterparty: 'Settled', terms: 'custom', dueDate: '2026-09-12', settlements: [{ amountCents: 12500, paidOn: '2026-09-01' }] }),
    ];
    const soon = dueWithin(rows, 14, { today: TODAY });
    expect(soon.map((o) => o.counterparty)).toEqual(['Already late', 'Soon']);
    expect(dueWithin(rows, 14, {})).toEqual([]);
  });
});

describe('a row that cannot be acted on is not written', () => {
  it('validation names every missing thing, and a due basis is mandatory', () => {
    expect(validateObligation({}).length).toBeGreaterThanOrEqual(5);
    expect(validateObligation(bill())).toEqual([]);
    expect(validateObligation(bill({ amountCents: 0 })).join(' ')).toMatch(/greater than zero/);
    expect(validateObligation(bill({ counterparty: '  ' })).join(' ')).toMatch(/name who it is with/);
    expect(validateObligation(bill({ direction: 'sideways' })).join(' ')).toMatch(/money we owe or money owed to us/);
    // The exact hole `debts` has: standard terms with nothing to count from.
    expect(validateObligation(bill({ issuedOn: '' })).join(' ')).toMatch(/the issue date is what the due date counts from/);
    expect(validateObligation(bill({ terms: 'custom', issuedOn: '', dueDate: '' })).join(' ')).toMatch(/name the date it is due/);
    expect(validateObligation(bill({ terms: 'custom', dueDate: '2026-09-01' }))).toEqual([]);
  });
  it('a settlement needs a real amount and the day the money actually moved', () => {
    expect(validateSettlement({ amountCents: 100, paidOn: '2026-09-01' })).toEqual([]);
    expect(validateSettlement({ amountCents: 0, paidOn: '2026-09-01' }).join(' ')).toMatch(/greater than zero/);
    expect(validateSettlement({ amountCents: 100, paidOn: 'sometime' }).join(' ')).toMatch(/the day the money actually moved/);
    expect(validateSettlement({ amountCents: 100, paidOn: '2026-09-01' }, bill({ lifecycle: 'void' })).join(' ')).toMatch(/voided obligation cannot be settled/);
  });
});

describe('the business words are the household words, and they teach', () => {
  it('both directions and every term carry the business phrase, the plain one, and what a child gets', () => {
    expect(DIRECTION_IDS).toEqual(['payable', 'receivable']);
    for (const d of DIRECTIONS) {
      expect(d.business, d.id).toMatch(/Accounts (payable|receivable)/);
      expect(d.plain.length, d.id).toBeGreaterThan(5);
      expect(d.childExplains.length, d.id).toBeGreaterThan(20);
      expect(d.counterpartyBusiness, d.id).toMatch(/Vendor|Customer/);
    }
    expect(direction('payable').business).toContain('A/P');
    expect(direction('receivable').business).toContain('A/R');
    expect(direction('nope')).toBeNull();
    expect(TERM_IDS).toContain('net-30');
    expect(term('net-30').days).toBe(30);
    expect(term('custom').days).toBeNull();
    expect(TERMS.every((t) => t.plain && t.business)).toBe(true);
  });
  it('the glossary defines the real words against this household’s own rows', () => {
    const names = ACCOUNTING_TERMS.map((t) => t.term);
    for (const must of ['Accounts payable (A/P)', 'Accounts receivable (A/R)', 'Terms', 'Due date', 'Aging', 'Settlement', 'Write-off', 'Reconciliation', 'Net position']) {
      expect(names, must).toContain(must);
    }
    for (const t of ACCOUNTING_TERMS) {
      expect(t.business.length, t.term).toBeGreaterThan(30);
      expect(t.household.length, t.term).toBeGreaterThan(20);
      expect(t.childExplains.length, t.term).toBeGreaterThan(20);
      expect(t.where.length, t.term).toBeGreaterThan(5);
    }
    expect(TERM_BY_NAME['Due date'].childExplains).toMatch(/On time means/);
  });
});

describe('migration 0202 and its smoke', () => {
  it('three tables, money in integer cents, and a due basis the database itself requires', () => {
    expect(M202).toMatch(/CREATE TABLE IF NOT EXISTS public\.obligations/);
    expect(M202).toMatch(/CREATE TABLE IF NOT EXISTS public\.obligation_settlements/);
    expect(M202).toMatch(/CREATE TABLE IF NOT EXISTS public\.obligation_documents/);
    expect(M202).toMatch(/amount_cents\s+bigint NOT NULL/);
    expect(M202).not.toMatch(/amount\s+numeric/);           // no floats in this ledger
    expect(M202).toMatch(/obligations_dated_chk/);
    expect(M202).toMatch(/obligations_direction_chk CHECK \(direction IN \('payable','receivable'\)\)/);
    // Status is never a column — it is worked out in lib/obligations.js.
    expect(M202).not.toMatch(/\bstatus\s+text/);
  });
  it('settlements are append-only: no update and no delete policy exists for anyone', () => {
    expect(M202).toMatch(/ALTER TABLE public\.obligation_settlements ENABLE ROW LEVEL SECURITY/);
    expect(M202).not.toMatch(/CREATE POLICY [a-z_]+ ON public\.obligation_settlements FOR (UPDATE|DELETE|INSERT)/);
    expect(M202).toMatch(/obligation_settlements_txn_uniq/);  // one bank row settles once
  });
  it('the books role wall is the one the books already have — a child and the assistant are out', () => {
    for (const t of ['obligations', 'obligation_settlements', 'obligation_documents']) {
      expect(M202, t).toMatch(new RegExp(`CREATE POLICY ${t.replace('obligation_', 'obligation_')}\\w*_books_read ON public\\.${t} FOR SELECT`));
    }
    expect(M202).toMatch(/<> ALL \(ARRAY\['','child','assistant'\]\)/);
    expect(M202).toMatch(/coalesce\(v_role, ''\) NOT IN \('owner','admin'\)/);
  });
  it('the bank row is tied back on the pointer the schema carried unused, and a write-off needs a reason', () => {
    expect(M202).toMatch(/SET linked_to_kind = 'obligation', linked_to_id = v_ob\.id/);
    expect(M202).toMatch(/a write-off without a reason is a hole in the record/);
    expect(M202).toMatch(/a voided obligation cannot be settled/);
    expect(M202).toMatch(/that transaction is not in these books/);
  });
  it('the day’s post sorts by meaning, product and place — in Darrell’s own words', () => {
    expect(M202).toMatch(/means IN \('bill-to-pay','proof-of-payment','for-the-record'\)/);
    expect(M202).toMatch(/routed_product IN \('poetech','properties','tlc'\)/);
    expect(M202).toMatch(/role IN \('the-bill','proof-of-payment','supporting'\)/);
    expect(M202).toMatch(/FUNCTION public\.document_route/);
    expect(M202).toMatch(/only the person who filed it, or an owner or admin, sorts it/);
  });
  it('the smoke proves each wall and rides the product-forms leg', () => {
    for (const must of [
      'a child read', 'the assistant read', 'a member wrote the books', 'a viewer wrote the books',
      'one transaction settled two obligations', 'a settlement was rewritten', 'a settlement was deleted',
      'a write-off with no reason was accepted', 'a voided obligation was settled',
      'another person’s unshared document was attached'.replace('’', "''"),
      'sorting could not be undone',
    ]) expect(S202, must).toContain(must);
    expect(LEG).toMatch(/migrations: "[^"\n]*0202-what-is-owed-what-was-paid-and-the-document-that-proves-it\.sql/);
    expect(LEG).toMatch(/smokes: "[^"\n]*0202-obligations-smoke\.sql/);
  });
});

// @vitest-environment node
//
// debt-import — the pasted-card-list parser behind the Debts tab importer.
//
// Proven-to-catch (DR-0076 §3): each case here FAILS against the naive parser
// it replaced. The fixture reproduces the exact shape a family writes a card
// list in — section headers, numbered cards, labelled fields, deliberately
// blank values, quoted APR ranges, an over-limit card, business cards given as
// a limit with no balance, running totals, and explanatory prose mixed in.
//
// The load-bearing rule: a BLANK field stays UNKNOWN (null) and never becomes
// 0. A $0 monthly payment is a claim the family never made; an absent one is
// the truth, and the tab must show "+ pay" so they know it still needs filling.
import { describe, it, expect } from 'vitest';
import {
  parseDebtList, parseMoney, parsePercent, debtRowToAccount,
  markDuplicates, summarizeRows, debtNameKey,
} from '../lib/debt-import.js';

const LIST = `PERSONAL CREDIT CARDS

CHRISTINA'S CREDIT CARDS

1. Discover it

Balance: $9,667.64
Interest: 0%
Credit usage: 107%
Available credit: $0
Highest balance shown: $9,736.43
Monthly payment:

2. Capital One Platinum

Balance: $1,550
Interest: 28.99%
Credit usage: 78%
Available credit: $450
Highest balance: $2,001
Monthly payment:

3. ABC Warehouse Credit Card

Balance: $1,347
Interest: 34.99%
Credit usage: 67%
Available credit: $653
Highest balance: $2,939
Monthly payment: $100

4. AvantCard

Balance: $948
Interest: 29.99% to 35.99%
Credit usage: 95%
Available credit: $52
Highest balance: $1,021
Monthly payment:

Christina's total credit card balances: $13,512.64

BUSINESS AND ADDITIONAL CREDIT CARDS

The amounts previously provided for these accounts appeared under a credit-limit column. Therefore, I listed them as credit limits and left the unknown balances blank.

5. American Express Business

Balance:
Credit limit shown: $2,000
Interest:
Credit usage:
Available credit:
Highest balance:
Monthly payment:
`;

const parsed = parseDebtList(LIST);
const rows = parsed.rows;
const byName = (n) => rows.find((r) => r.name === n);

describe('parseDebtList', () => {
  it('reads every numbered card and no running totals or prose', () => {
    // Catches: a "Christina's total ... : $13,512.64" line absorbed as a field
    // on card 4, and the explanatory paragraph parsed as a card.
    expect(rows.map((r) => r.name)).toEqual([
      'Discover it', 'Capital One Platinum', 'ABC Warehouse Credit Card',
      'AvantCard', 'American Express Business',
    ]);
  });

  it('keeps the section header as the group so the piles stay distinguishable', () => {
    expect(byName('Discover it').group).toBe("CHRISTINA'S CREDIT CARDS");
    expect(byName('American Express Business').group).toBe('BUSINESS AND ADDITIONAL CREDIT CARDS');
  });

  it('a BLANK monthly payment stays null — never 0 (DR-0076, no painted number)', () => {
    // The whole reason this parser exists. `Number('') || 0` would report every
    // one of these cards as a $0/mo payment, which the family never said.
    expect(byName('Discover it').minPayment).toBeNull();
    expect(byName('ABC Warehouse Credit Card').minPayment).toBe(100);
  });

  it('an explicit 0% is KNOWN, not missing — a promo card is not an unknown rate', () => {
    // rateKnown is what lets a true 0% card still project a payoff date instead
    // of being stuck on "Add terms" forever.
    const d = byName('Discover it');
    expect(d.rate).toBe(0);
    expect(d.rateKnown).toBe(true);
    const b = byName('American Express Business');
    expect(b.rate).toBeNull();
    expect(b.rateKnown).toBe(false);
  });

  it('a quoted APR RANGE keeps both ends and works off the HIGH end', () => {
    // "29.99% to 35.99%" — projecting off the low end would date the payoff
    // earlier than the family can count on (DR-0100: never under-claim cost).
    const a = byName('AvantCard');
    expect(a.rate).toBe(35.99);
    expect(a.rateMin).toBe(29.99);
    expect(a.rateMax).toBe(35.99);
  });

  it('derives the credit limit from balance + available credit', () => {
    // Their own two numbers; the stated 78% usage checks out against it.
    const c = byName('Capital One Platinum');
    expect(c.creditLimit).toBe(2000);
    expect(c.creditLimitStated).toBe(false);
    expect(Math.round((c.balance / c.creditLimit) * 100)).toBe(c.statedUsage);
  });

  it('an over-limit card keeps its stated usage without INVENTING a limit', () => {
    // Proven-to-catch: balance + available on this card is $9,667.64 + $0 =
    // $9,667.64, which implies exactly 100% usage and contradicts the 107% the
    // family reported — quietly erasing the fact that the card is OVER limit.
    // The limit must stay unknown rather than be painted (DR-0076).
    const d = byName('Discover it');
    expect(d.statedUsage).toBe(107);
    expect(d.availableCredit).toBe(0);
    expect(d.overLimit).toBe(true);
    expect(d.creditLimit).toBeNull();
    expect(d.highestBalance).toBe(9736.43);
  });

  it('a business card given as a LIMIT only imports with no balance claimed', () => {
    const b = byName('American Express Business');
    expect(b.creditLimit).toBe(2000);
    expect(b.creditLimitStated).toBe(true);
    expect(b.balance).toBeNull();
  });

  it('records the prose it ignored instead of dropping it silently', () => {
    expect(parsed.skipped.some((s) => /previously provided/i.test(s))).toBe(true);
  });
});

describe('parseMoney / parsePercent', () => {
  it('reads money with symbols and separators, and blanks as unknown', () => {
    expect(parseMoney('$9,667.64')).toBe(9667.64);
    expect(parseMoney('')).toBeNull();
    expect(parseMoney('   ')).toBeNull();
    expect(parseMoney('n/a')).toBeNull();
    expect(parseMoney('$0')).toBe(0);
  });
  it('rejects a usage figure pasted into the rate field', () => {
    // "107%" is credit usage, not an APR. Feeding it to the payoff engine as a
    // rate would be an absurd projection presented as fact.
    expect(parsePercent('107%').rate).toBeNull();
    expect(parsePercent('28.99%').rate).toBe(28.99);
    expect(parsePercent('').rate).toBeNull();
  });
});

describe('debtRowToAccount', () => {
  it('maps a card onto the account shape deriveDebts actually reads', () => {
    const a = debtRowToAccount(byName('ABC Warehouse Credit Card'), 'e-personal');
    expect(a).toMatchObject({
      name: 'ABC Warehouse Credit Card', type: 'credit', treatAsDebt: true,
      balance: 1347, rate: 34.99, rateKnown: true, minPayment: 100, entityId: 'e-personal',
    });
  });
  it('leaves an unknown payment UNSET rather than writing 0', () => {
    const a = debtRowToAccount(byName('Discover it'), 'e-personal');
    expect('minPayment' in a).toBe(false);
    expect(a.rate).toBe(0);        // the 0% IS stated
    expect(a.rateKnown).toBe(true);
  });
  it('an unknown balance still imports as a visible $0-owed row', () => {
    // Matches the established "add it now, set the balance later" behaviour.
    expect(debtRowToAccount(byName('American Express Business'), 'e-biz').balance).toBe(0);
  });
});

describe('markDuplicates', () => {
  it('flags a card already on the tab', () => {
    const marked = markDuplicates([{ name: 'Discover it', balance: 100 }], [{ name: 'DISCOVER  IT' }]);
    expect(marked[0].alreadyOnTab).toBe(true);
    expect(marked[0].duplicate).toBe(true);
  });

  it('does NOT collapse two real cards that happen to share a name', () => {
    // Proven-to-catch: this family holds a "Chase" at $13,000 AND a second
    // "Chase" at $30,600; a name-only duplicate check drops $30,600 of real
    // debt out of the import without anyone noticing.
    const marked = markDuplicates([
      { name: 'Chase', balance: 13000 },
      { name: 'Chase', balance: 30600 },
    ], []);
    expect(marked.map((r) => r.duplicate)).toEqual([false, false]);
    expect(marked.every((r) => r.sameName)).toBe(true); // surfaced, not silently merged
  });

  it('flags the SAME card pasted twice (name and balance both match)', () => {
    const marked = markDuplicates([
      { name: 'Citi', balance: 22000 },
      { name: 'CITI', balance: 22000 },
    ], []);
    expect(marked.map((r) => r.repeat)).toEqual([false, true]);
  });

  it('treats a differently-cased/punctuated name as the same card', () => {
    expect(debtNameKey('Capital One  Platinum')).toBe(debtNameKey('CAPITAL-ONE PLATINUM'));
  });
});

describe('summarizeRows', () => {
  it('totals only what is actually known and counts what is still missing', () => {
    const s = summarizeRows(rows);
    expect(s.count).toBe(5);
    expect(s.totalBalance).toBe(13512.64);   // the four stated balances
    expect(s.missingBalance).toBe(1);
    expect(s.missingPayment).toBe(4);
    expect(s.knownPayments).toBe(100);
  });
});

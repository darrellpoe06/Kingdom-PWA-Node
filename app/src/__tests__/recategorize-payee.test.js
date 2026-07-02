// @vitest-environment node
//
// applyCategoryToPayee + countPayeeMatches — the "one correction, applied
// everywhere" back-apply. Proven-to-catch: every row sharing the payee key is
// re-labeled (across account-tail variants), the count reflects only the rows
// that actually changed, and non-matching rows are untouched.
import { describe, it, expect } from 'vitest';
import { applyCategoryToPayee, countPayeeMatches, payeeKey } from '../lib/categorize.js';

const TX = [
  { id: '1', description: 'WF HOME MTG AUTO PAY 0511', category: 'vehicle' },
  { id: '2', description: 'WF HOME MTG AUTO PAY 0512', category: 'other' },
  { id: '3', description: 'COUNTY MARKET 518', category: 'groceries' },
];

describe('back-apply by payee', () => {
  it('counts every row sharing the payee key (across account tails)', () => {
    expect(countPayeeMatches(TX, payeeKey('WF HOME MTG AUTO PAY 0511'))).toBe(2);
  });
  it('re-labels all matching rows, leaves others untouched', () => {
    const { transactions, count } = applyCategoryToPayee(TX, payeeKey('WF HOME MTG AUTO PAY 9999'), 'debt-payment');
    expect(count).toBe(2); // rows 1 and 2 changed
    expect(transactions.find(t => t.id === '1').category).toBe('debt-payment');
    expect(transactions.find(t => t.id === '2').category).toBe('debt-payment');
    expect(transactions.find(t => t.id === '3').category).toBe('groceries'); // untouched
  });
  it('count reflects only rows that actually change (already-correct rows skipped)', () => {
    const once = applyCategoryToPayee(TX, payeeKey('WF HOME MTG AUTO PAY 1'), 'debt-payment').transactions;
    // running again changes nothing (idempotent)
    expect(applyCategoryToPayee(once, payeeKey('WF HOME MTG AUTO PAY 1'), 'debt-payment').count).toBe(0);
  });
});

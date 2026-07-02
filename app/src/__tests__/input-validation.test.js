// input-validation — the ONE validate->preview->commit spine for every source.
// Proven-to-catch (DR-0076): a candidate that isn't READY must NOT commit; a
// correction must re-validate; the same gate judges email, photo, manual, bank.
import { describe, it, expect, vi } from 'vitest';
import {
  candidateFromReceipt, candidateFromManual, candidateFromBankRow,
  applyCorrection, commitCandidate, commitAll,
  confidenceTier, READY, NEEDS_FIX,
} from '../lib/input-validation.js';

const LEDGER = [
  { id: 'tx-a', date: '2026-05-17', accountId: 'a1', amount: -48.70, description: 'WALMART SUPERCENTER', category: 'other' },
  { id: 'tx-b', date: '2026-05-18', accountId: 'a1', amount: -28.39, description: 'WALGREENS', category: 'other' },
];
const WALMART = {
  merchant: 'Walmart', date: '2026-05-17', total: 48.70, tax: 2.32, confidence: 1,
  items: [
    { name: 'Great Value Milk', price: 3.98 }, { name: 'Tide PODS 42ct', price: 12.97 },
    { name: 'Bounty Paper Towels', price: 14.94 }, { name: 'Tylenol 100ct', price: 12.87 },
    { name: 'Bananas', price: 1.62 },
  ],
};

describe('candidate builders normalize every source to ONE shape', () => {
  it('email/photo receipt -> enrich candidate matched + reconciling + categorized', () => {
    const c = candidateFromReceipt(WALMART, { source: 'photo', transactions: LEDGER, image: { name: 'r.jpg' } });
    expect(c.commitKind).toBe('enrich');
    expect(c.match.transactionId).toBe('tx-a');
    expect(c.fields.amount).toBe(-48.70);
    expect(c.fields.category).toBe('household'); // derived from items
    expect(c.proof.name).toBe('r.jpg');
    expect(c.status).toBe(READY);
  });
  it('manual entry -> create candidate with an auto-picked category', () => {
    const c = candidateFromManual({ description: 'Aldi weekly groceries', date: '2026-05-20', amount: -85, accountId: 'a1', category: 'other' }, {});
    expect(c.commitKind).toBe('create');
    expect(c.fields.category).toBe('groceries'); // categorize() picked it
    expect(c.status).toBe(READY);
  });
  it('bank-file row -> create candidate, category from description', () => {
    const c = candidateFromBankRow({ description: 'SHELL OIL 1234', date: '2026-05-05', amount: -55, accountId: 'a1' }, {});
    expect(c.commitKind).toBe('create');
    expect(c.fields.category).toBe('fuel');
    expect(c.status).toBe(READY);
  });
});

describe('validation is the SAME gate for all', () => {
  it('flags an unmatched receipt as needs-fix (not ready)', () => {
    const c = candidateFromReceipt({ ...WALMART, total: 999.99, tax: 953.61 }, { source: 'email', transactions: LEDGER });
    expect(c.status).toBe(NEEDS_FIX);
    expect(c.issues).toContain('no matching bank transaction');
  });
  it('flags a manual entry missing an account or amount', () => {
    const c = candidateFromManual({ description: 'Something', date: '2026-05-20', amount: '', accountId: '' }, {});
    expect(c.status).toBe(NEEDS_FIX);
    expect(c.issues).toEqual(expect.arrayContaining(['missing or zero amount', 'no account selected']));
  });
  it('confidenceTier gives every source the same three-state signal', () => {
    expect(confidenceTier(0.95).tier).toBe('high');
    expect(confidenceTier(0.75).tier).toBe('medium');
    expect(confidenceTier(0.4).tier).toBe('low');
  });
});

describe('correction re-validates (preview edits are live)', () => {
  it('picking a bank match turns an unmatched receipt READY', () => {
    // total 48.70 but pretend it did not auto-match (no txns passed at build)
    const c = candidateFromReceipt(WALMART, { source: 'photo', transactions: [] });
    expect(c.status).toBe(NEEDS_FIX);
    const fixed = applyCorrection(c, { match: LEDGER[0] }, { transactions: LEDGER });
    expect(fixed.match.transactionId).toBe('tx-a');
    expect(fixed.status).toBe(READY);
  });
  it('correcting a manual category clears the "uncertain" issue', () => {
    const c = candidateFromManual({ description: 'zxq mystery', date: '2026-05-20', amount: -5, accountId: 'a1', category: 'other' }, {});
    expect(c.issues).toContain('category uncertain');
    const fixed = applyCorrection(c, { category: 'household' });
    expect(fixed.status).toBe(READY);
  });
});

describe('commit is guarded — nothing lands silently or unvalidated', () => {
  it('enrich commit calls updateTransaction with the reconciliation + category', () => {
    const updateTransaction = vi.fn();
    const c = candidateFromReceipt(WALMART, { source: 'photo', transactions: LEDGER });
    const r = commitCandidate(c, { updateTransaction });
    expect(r).toMatchObject({ committed: true, kind: 'enrich', transactionId: 'tx-a' });
    expect(updateTransaction).toHaveBeenCalledWith('tx-a', expect.objectContaining({ reconciliation: expect.any(Object), category: 'household' }));
  });
  it('create commit calls addTransaction with the ledger payload', () => {
    const addTransaction = vi.fn();
    const c = candidateFromManual({ description: 'Aldi', date: '2026-05-20', amount: -85, accountId: 'a1', category: 'groceries' }, {});
    commitCandidate(c, { addTransaction });
    expect(addTransaction).toHaveBeenCalledWith(expect.objectContaining({ amount: -85, accountId: 'a1', category: 'groceries' }));
  });
  it('REFUSES to commit a needs-fix candidate (proven-to-catch)', () => {
    const addTransaction = vi.fn(); const updateTransaction = vi.fn();
    const bad = candidateFromManual({ description: '', date: '', amount: '', accountId: '' }, {});
    const r = commitCandidate(bad, { addTransaction, updateTransaction });
    expect(r.committed).toBe(false);
    expect(addTransaction).not.toHaveBeenCalled();
    expect(updateTransaction).not.toHaveBeenCalled();
  });
  it('commitAll commits only the READY ones and reports the skips', () => {
    const addTransaction = vi.fn();
    const good = candidateFromManual({ description: 'Aldi', date: '2026-05-20', amount: -85, accountId: 'a1', category: 'groceries' }, {});
    const bad = candidateFromManual({ description: '', date: '', amount: '', accountId: '' }, {});
    const res = commitAll([good, bad], { addTransaction });
    expect(res).toEqual({ committed: 1, skipped: 1, total: 2 });
    expect(addTransaction).toHaveBeenCalledTimes(1);
  });
});

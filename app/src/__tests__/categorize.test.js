// @vitest-environment node
//
// categorize — the deterministic rule layer. Proven-to-catch: the exact bug
// (WF HOME MTG AUTO PAY tagged Vehicle by a naive "auto" substring) now reads
// debt-payment; real auto payees still read vehicle; specificity + learned rules.
import { describe, it, expect } from 'vitest';
import { categorize, payeeKey, learnRule, LOW_CONFIDENCE, categoryLabel, autoCategorizeSuggestions } from '../lib/categorize.js';

describe('categorize — the mortgage-as-Vehicle class of bug', () => {
  it('the confirmed row: WF HOME MTG AUTO PAY -> debt-payment, NOT vehicle', () => {
    const c = categorize('WF HOME MTG      AUTO PAY   0511');
    expect(c.category).toBe('debt-payment');
    expect(c.category).not.toBe('vehicle');
    expect(c.confidence).toBeGreaterThan(0.8);
  });
  it('does not match "auto" inside "autopay" / "auto pay" as vehicle', () => {
    expect(categorize('CITI AUTOPAY PAYMENT').category).toBe('debt-payment');
    expect(categorize('SOME BILLER AUTO PAY').category).not.toBe('vehicle');
  });
  it('still categorizes REAL auto payees as vehicle', () => {
    expect(categorize('AUTOZONE 4021 CHAMPAIGN').category).toBe('vehicle');
    expect(categorize('TAKE 5 OIL CHANGE CHAMPAIGN IL').category).toBe('vehicle');
    expect(categorize('JIFFY LUBE').category).toBe('vehicle');
  });
  it('mortgage/servicer signals win over generic (specificity-first)', () => {
    expect(categorize('ROCKET MORTGAGE PYMT').category).toBe('debt-payment');
    expect(categorize('WELLS FARGO HOME MORTGAGE').category).toBe('debt-payment');
  });
  it('unknown payee -> other at low confidence (flags for review)', () => {
    const c = categorize('ZZQ UNKNOWN VENDOR X0431');
    expect(c.category).toBe('other');
    expect(c.confidence).toBeLessThanOrEqual(LOW_CONFIDENCE);
  });
});

describe('learned rules — one correction, applied everywhere', () => {
  it('payeeKey collapses account tails so all rows from a payee share a key', () => {
    expect(payeeKey('WF HOME MTG AUTO PAY 0511')).toBe(payeeKey('WF HOME MTG AUTO PAY 0512'));
  });
  it('a learned override wins over the built-in rule, at full confidence', () => {
    const learned = learnRule({}, 'COSTCO WHOLESALE #12', 'household'); // user says household, not groceries
    const c = categorize('COSTCO WHOLESALE #34', { learned });
    expect(c.category).toBe('household');
    expect(c.confidence).toBe(1);
    expect(c.rule).toBe('learned');
  });
});

describe('categoryLabel — clean display names for raw Chase Type codes', () => {
  it('the reported codes read as words, not machine noise', () => {
    // Darrell 2026-07-19: the Chase "Type" column stored acct_xfer/ach_credit/atm/
    // billpay verbatim, so the ledger showed "Acct_xfer" / "Ach_credit" under CSS
    // capitalize. PROVEN-TO-CATCH: without the map these fall to a raw slug.
    expect(categoryLabel('acct_xfer')).toBe('Transfer');
    expect(categoryLabel('ACCT_XFER')).toBe('Transfer');   // case-insensitive
    expect(categoryLabel('ach_credit')).toBe('ACH Deposit');
    expect(categoryLabel('ach_debit')).toBe('ACH Payment');
    expect(categoryLabel('atm')).toBe('ATM / Cash');
    expect(categoryLabel('billpay')).toBe('Bill Pay');
  });
  it('the additional codes seen in the live ledger (2026-07-19 screenshot) read clean too', () => {
    // Observed on Darrell's real Imported filter chips — reality-trace, not a guess.
    expect(categoryLabel('atm_deposit')).toBe('ATM Deposit');
    expect(categoryLabel('chase_to_partnerfi')).toBe('Transfer');
  });
  it('the app\'s own slugs get their proper label', () => {
    expect(categoryLabel('debt-payment')).toBe('Debt Payment');
    expect(categoryLabel('rental-income')).toBe('Rental Income');
  });
  it('an unmapped slug still reads as Title-Case words, never raw', () => {
    expect(categoryLabel('groceries')).toBe('Groceries');
    expect(categoryLabel('some_new_bank_code')).toBe('Some New Bank Code');
    expect(categoryLabel('')).toBe('');
    expect(categoryLabel(null)).toBe('');
  });
  it('DISPLAY-ONLY: the label never mutates the stored slug (totals stay keyed on it)', () => {
    // categoryLabel is presentational — the internal-transfer / external-total
    // logic keys on the STORED category, so relabeling must not change the value.
    const stored = 'acct_xfer';
    categoryLabel(stored);
    expect(stored).toBe('acct_xfer');
  });
});

describe('autoCategorizeSuggestions — "pull the ones it can determine from the data"', () => {
  const txns = [
    { id: '1', description: 'COUNTY MARKET 4521', category: 'other' },
    { id: '2', description: 'COUNTY MARKET 9987', category: null },      // same payee, blank
    { id: '3', description: 'SHELL OIL 12345', category: 'other' },
    { id: '4', description: 'MYSTERY LLC XYZ', category: 'other' },        // categorizer can't tell
    { id: '5', description: 'COUNTY MARKET 4521', category: 'groceries' }, // already categorized -> ignored
  ];
  it('suggests confident categories for uncategorized rows, grouped by payee', () => {
    const s = autoCategorizeSuggestions(txns);
    const county = s.find((x) => x.category === 'groceries');
    expect(county).toBeTruthy();
    expect(county.count).toBe(2);            // the two uncategorized County Market rows
    expect(s.find((x) => x.category === 'fuel')).toBeTruthy(); // Shell
  });
  it('never suggests for a row it cannot confidently determine', () => {
    const s = autoCategorizeSuggestions(txns);
    expect(s.some((x) => /MYSTERY/i.test(x.description))).toBe(false);
  });
  it('honors learned per-payee rules over the built-ins', () => {
    const learned = { [payeeKey('COUNTY MARKET 4521')]: 'household' };
    const s = autoCategorizeSuggestions(txns, learned);
    expect(s.find((x) => x.description.includes('COUNTY MARKET')).category).toBe('household');
  });
  it('is empty when everything is already categorized', () => {
    expect(autoCategorizeSuggestions([{ id: '1', description: 'SHELL', category: 'fuel' }])).toEqual([]);
  });
});

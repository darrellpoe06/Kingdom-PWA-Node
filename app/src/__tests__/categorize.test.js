// @vitest-environment node
//
// categorize — the deterministic rule layer. Proven-to-catch: the exact bug
// (WF HOME MTG AUTO PAY tagged Vehicle by a naive "auto" substring) now reads
// debt-payment; real auto payees still read vehicle; specificity + learned rules.
import { describe, it, expect } from 'vitest';
import { categorize, payeeKey, learnRule, LOW_CONFIDENCE } from '../lib/categorize.js';

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

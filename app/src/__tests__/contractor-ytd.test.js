// @vitest-environment node
//
// contractor-ytd — derive a 1099 contractor's YTD-paid from the REAL ledger so
// the filing threshold reads off actual payments, not a hand-typed guess (the
// REV-0106 interconnectedness finding). Token-subset match on payeeKey; generic
// names are not matched (no misleading number).
import { describe, it, expect } from 'vitest';
import { deriveContractorYtdPaid, effectiveYtdPaid, isMatchableContractor } from '../lib/contractor-ytd.js';

const txns = [
  { id: 't1', date: '2026-03-01', amount: -400, description: 'ISAIAH RAMOS PLUMBING 07/15' },
  { id: 't2', date: '2026-06-01', amount: -250, description: 'Isaiah Ramos Plumbing INV 22' },
  { id: 't3', date: '2026-06-02', amount: 500, description: 'ISAIAH RAMOS refund' },      // inbound — not paid out
  { id: 't4', date: '2025-12-31', amount: -900, description: 'Isaiah Ramos Plumbing' },   // wrong year
  { id: 't5', date: '2026-04-01', amount: -75, description: 'COUNTY MARKET GROCERIES' },  // different payee
];

describe('deriveContractorYtdPaid', () => {
  it('sums OUTBOUND payments in the tax year that match the contractor (token-subset)', () => {
    const r = deriveContractorYtdPaid({ name: 'Isaiah Ramos' }, txns, 2026);
    expect(r.ytdPaid).toBe(650);          // 400 + 250 (t1 + t2); NOT t3 (inbound), t4 (2025), t5 (other)
    expect(r.count).toBe(2);
    expect(r.matchedIds).toEqual(['t1', 't2']);
  });
  it('respects the tax year', () => {
    expect(deriveContractorYtdPaid({ name: 'Isaiah Ramos' }, txns, 2025).ytdPaid).toBe(900); // only t4
  });
  it('returns null for a too-generic name (one short token can not sweep unrelated rows)', () => {
    expect(deriveContractorYtdPaid({ name: 'Mike' }, txns, 2026)).toBe(null);
    expect(isMatchableContractor({ name: 'Mike' })).toBe(false);
    expect(isMatchableContractor({ name: 'Isaiah Ramos' })).toBe(true);
    expect(isMatchableContractor({ name: 'Cornerstone' })).toBe(true); // one long distinctive token
  });
});

describe('effectiveYtdPaid — ledger beats the typed guess when a match exists', () => {
  it('uses the LEDGER-derived amount when there are matching payments', () => {
    const e = effectiveYtdPaid({ name: 'Isaiah Ramos', ytdPaid: 100 }, txns, 2026);
    expect(e.source).toBe('ledger');
    expect(e.value).toBe(650);            // the real $650, not the typed $100
    expect(e.typed).toBe(100);
  });
  it('falls back to the TYPED value when no ledger match (nothing regresses)', () => {
    const e = effectiveYtdPaid({ name: 'Mike', ytdPaid: 1200 }, txns, 2026);
    expect(e.source).toBe('typed');
    expect(e.value).toBe(1200);
  });
});

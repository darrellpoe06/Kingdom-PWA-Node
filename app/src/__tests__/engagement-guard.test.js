// =============================================================================
// engagement-guard tests — volunteers and 1099 workers told apart by DATA,
// findings carrying LEDGER receipts (DR-0076/DR-0100; Darrell 2026-07-23).
// =============================================================================
import { describe, it, expect } from 'vitest';
import { ENGAGEMENTS, engagementOf, splitCrew, engagementFindings } from '../lib/engagement-guard.js';

describe('engagementOf — explicit lanes only, never guessed', () => {
  it('maps assignment types to lanes', () => {
    expect(engagementOf({ type: 'volunteer' })).toBe('volunteer');
    expect(engagementOf({ type: 'contractor' })).toBe('contractor-1099');
    expect(engagementOf({ engagement: 'volunteer', type: 'contractor' })).toBe('volunteer'); // explicit engagement wins
    expect(engagementOf({ type: 'helper' })).toBe('unassigned');
    expect(engagementOf({})).toBe('unassigned');
  });
  it('every lane has a money rule and admin checklist', () => {
    for (const e of Object.values(ENGAGEMENTS)) {
      expect(e.moneyRule.length).toBeGreaterThan(10);
      expect(e.admin.length).toBeGreaterThan(0);
    }
  });
});

describe('splitCrew — one project, lanes side by side', () => {
  it('splits a mixed crew per engagement', () => {
    const crew = splitCrew([
      { name: 'Isaiah Ramos', type: 'contractor' },
      { name: 'Sister Jean Baker', type: 'volunteer' },
      { name: 'Mystery Hand' },
    ]);
    expect(crew['contractor-1099'].map((a) => a.name)).toEqual(['Isaiah Ramos']);
    expect(crew.volunteer.map((a) => a.name)).toEqual(['Sister Jean Baker']);
    expect(crew.unassigned.map((a) => a.name)).toEqual(['Mystery Hand']);
  });
});

const tx = (id, desc, amount, date) => ({ id, description: desc, amount, date });

describe('engagementFindings — the ledger is the receipt', () => {
  const transactions = [
    tx('t1', 'ISAIAH RAMOS PLUMBING 07/15', -1200, '2026-07-15'),
    tx('t2', 'ISAIAH RAMOS PLUMBING 08/02', -900, '2026-08-02'),
    tx('t3', 'JEAN BAKER SUPPLIES REIMB', -85, '2026-07-20'),
    tx('t4', 'GROCERIES', -200, '2026-07-21'),
  ];

  it('flags a PAID volunteer with the exact rows as receipts', () => {
    const f = engagementFindings({
      people: [{ name: 'Jean Baker', type: 'volunteer' }],
      transactions, year: 2026,
    });
    expect(f).toHaveLength(1);
    expect(f[0].kind).toBe('paid-volunteer');
    expect(f[0].receipts).toEqual(['t3']);
    expect(f[0].amount).toBe(85);
    expect(f[0].note).toContain('VOLUNTEER');
  });

  it('flags a contractor crossing the year-correct NEC threshold ($2,000 for 2026)', () => {
    const f = engagementFindings({
      people: [{ name: 'Isaiah Ramos', type: 'contractor' }],
      transactions, year: 2026,
    });
    expect(f).toHaveLength(1);
    expect(f[0].kind).toBe('nec-threshold');
    expect(f[0].amount).toBe(2100);
    expect(f[0].receipts.sort()).toEqual(['t1', 't2']);
    expect(f[0].note).toContain('$2,000');
  });

  it('uses the $600 line for 2025 — the year is never assumed', () => {
    const f = engagementFindings({
      people: [{ name: 'Isaiah Ramos', type: 'contractor' }],
      transactions: [tx('t9', 'ISAIAH RAMOS PLUMBING', -700, '2025-05-01')],
      year: 2025,
    });
    expect(f).toHaveLength(1);
    expect(f[0].note).toContain('$600');
  });

  it('stays silent for an unpaid volunteer and a too-generic name (honest-or-absent)', () => {
    const f = engagementFindings({
      people: [
        { name: 'Sister Ruth Long', type: 'volunteer' },  // matchable, no rows
        { name: 'Mike', type: 'volunteer' },              // too generic to match safely
      ],
      transactions, year: 2026,
    });
    expect(f).toEqual([]);
  });
});

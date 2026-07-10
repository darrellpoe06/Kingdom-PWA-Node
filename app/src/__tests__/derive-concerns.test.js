// =============================================================================
// derive-concerns.test.js — PROVEN-TO-CATCH tests for the process-derived
// concern feed (Darrell 2026-07-01: Concerns auto-populate from the app's own
// processes). A detector that never fires is a lie (Verification Doctrine,
// DR-0076 §3): each one is shown to CATCH a real-shaped break AND stay silent on
// clean data, and to auto-resolve (drop the card) when the data is fixed.
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  coverageConcerns, doorCollapseConcerns, shapeMismatchConcerns, captionCoverageConcerns, deriveDataConcerns,
} from '../lib/derive-concerns.js';
import { composeConcerns } from '../lib/concerns.js';
import { captionsCoverage } from '../lib/captions-coverage.js';

// A ledger with five healthy months (~10 tx each) and one thin month (April, 1 tx)
// — the "April showed 2 of 296" shape.
function ledgerWithThinApril() {
  const txns = [];
  const months = ['2026-01', '2026-02', '2026-03', '2026-05', '2026-06'];
  for (const m of months) for (let i = 0; i < 10; i++) txns.push({ id: `${m}-${i}`, date: `${m}-1${i}`, amount: -10 });
  txns.push({ id: 'apr-1', date: '2026-04-15', amount: -10 }); // lone April row
  return txns;
}

describe('coverageConcerns — thin-import month (April gap class)', () => {
  it('CATCHES a thin month and names it', () => {
    const cards = coverageConcerns(ledgerWithThinApril());
    expect(cards).toHaveLength(1);
    expect(cards[0].source).toBe('coverage');
    expect(cards[0].readOnly).toBe(true);
    expect(cards[0].area).toBe('Banking import');
    expect(cards[0].concern).toContain('2026-04');
    expect(cards[0].detectedBy).toBe('monthCoverage');
  });

  it('stays SILENT on an evenly-covered ledger', () => {
    const txns = [];
    for (const m of ['2026-01', '2026-02', '2026-03', '2026-04']) for (let i = 0; i < 10; i++) txns.push({ id: `${m}-${i}`, date: `${m}-1${i}`, amount: -5 });
    expect(coverageConcerns(txns)).toHaveLength(0);
  });

  it('is defensive on empty / garbage input', () => {
    expect(coverageConcerns([])).toEqual([]);
    expect(coverageConcerns(null)).toEqual([]);
  });
});

describe('doorCollapseConcerns — multi-unit door collapsed to one record (805 class)', () => {
  it('CATCHES a units:4 single record and asks for 4 doors', () => {
    const rentals = [{ id: 'r805', name: '805 N Prospect', address: '805 N Prospect', units: 4, rent: 4000, entityId: 'e-poeprops' }];
    const cards = doorCollapseConcerns(rentals);
    expect(cards).toHaveLength(1);
    expect(cards[0].source).toBe('reconciliation');
    expect(cards[0].concern).toContain('805 N Prospect');
    expect(cards[0].concern).toContain('units:4');
    expect(cards[0].detectedBy).toBe('groupDoorsByBuilding');
  });

  it('stays SILENT once the four units are their own doors (auto-resolve)', () => {
    const rentals = ['1', '2', '3', '4'].map((u) => ({
      id: `r805-${u}`, name: `805 N Prospect Apt ${u}`, address: '805 N Prospect',
      building: '805 N Prospect', unitLabel: `Apt ${u}`, units: 1, entityId: 'e-poeprops',
    }));
    expect(doorCollapseConcerns(rentals)).toHaveLength(0);
  });

  it('stays SILENT on ordinary single-unit doors', () => {
    const rentals = [{ id: 'r1', name: '1402 Maple St', address: '1402 Maple St', units: 1, entityId: 'e-poeprops' }];
    expect(doorCollapseConcerns(rentals)).toHaveLength(0);
  });
});

describe('shapeMismatchConcerns — mortgage-scale balance mislabeled Vehicle', () => {
  it('CATCHES a vehicle-typed debt carrying a mortgage-scale balance', () => {
    const debts = [{ id: 'd1', name: 'Rental mortgage (mis-tagged)', type: 'vehicle', balance: -88000 }];
    const cards = shapeMismatchConcerns({ debts });
    expect(cards).toHaveLength(1);
    expect(cards[0].area).toBe('Debts');
    expect(cards[0].concern.toLowerCase()).toContain('vehicle');
    expect(cards[0].detectedBy).toBe('shapeMismatch');
  });

  it('CATCHES a vehicle debt whose name says mortgage even below the scale', () => {
    const debts = [{ id: 'd2', name: 'Auto loan — actually the mortgage', category: 'vehicle', balance: -12000 }];
    expect(shapeMismatchConcerns({ debts })).toHaveLength(1);
  });

  it('stays SILENT on an ordinary car loan', () => {
    const debts = [{ id: 'd3', name: 'Car loan', type: 'vehicle', balance: -18000 }];
    expect(shapeMismatchConcerns({ debts })).toHaveLength(0);
  });

  it('stays SILENT on a normal mortgage labeled as a mortgage', () => {
    const debts = [{ id: 'd4', name: 'Home mortgage', type: 'mortgage', balance: -240000 }];
    expect(shapeMismatchConcerns({ debts })).toHaveLength(0);
  });
});

describe('captionCoverageConcerns — accessibility reflex (DR-0133)', () => {
  it('fires ONE concern when caption coverage is below the bar', () => {
    const cov = captionsCoverage(['a', 'b', 'c', 'd'], { a: { cueCount: 5 } }); // 25%
    const cards = captionCoverageConcerns(cov);
    expect(cards).toHaveLength(1);
    expect(cards[0].concern).toMatch(/1\/4 service videos.*25%/);
    expect(cards[0].area).toMatch(/captions/i);
    expect(cards[0].readOnly).toBe(true);
  });

  it('is silent at/above the bar (auto-resolves as coverage climbs)', () => {
    const full = captionsCoverage(['a', 'b'], { a: { cueCount: 5 }, b: { cueCount: 5 } }); // 100%
    expect(captionCoverageConcerns(full)).toEqual([]);
  });

  it('is silent with no corpus and on a null snapshot (never painted)', () => {
    expect(captionCoverageConcerns(captionsCoverage([], {}))).toEqual([]);
    expect(captionCoverageConcerns(null)).toEqual([]);
  });
});

describe('deriveDataConcerns + composeConcerns — end to end onto the board', () => {
  it('flows a derived card onto the composed board, read-through', () => {
    const derived = deriveDataConcerns({
      transactions: ledgerWithThinApril(),
      rentals: [{ id: 'r805', name: '805 N Prospect', address: '805 N Prospect', units: 4, entityId: 'e-poeprops' }],
      debts: [{ id: 'd1', name: 'mortgage', type: 'vehicle', balance: -88000 }],
    });
    expect(derived.length).toBe(3); // coverage + door-collapse + shape
    const board = composeConcerns({ dbConcerns: [], seeds: [], feedback: [], audit: { concerns: [] }, derived });
    const ids = board.map((c) => c.id);
    expect(ids).toContain(derived[0].id);
    expect(board.every((c) => c.concern)).toBe(true);
  });

  it('a curated DB row supersedes a derived card with the same id', () => {
    const derived = [{ id: 'derived-x', concern: 'derived', status: 'open', source: 'coverage', readOnly: true }];
    const board = composeConcerns({ dbConcerns: [{ id: 'derived-x', concern: 'curated wins', status: 'in-progress' }], seeds: [], feedback: [], audit: { concerns: [] }, derived });
    const row = board.find((c) => c.id === 'derived-x');
    expect(row.concern).toBe('curated wins');
    expect(board.filter((c) => c.id === 'derived-x')).toHaveLength(1);
  });

  it('is fully silent on clean data (no painted concerns)', () => {
    expect(deriveDataConcerns({ transactions: [], rentals: [], debts: [] })).toEqual([]);
  });
});

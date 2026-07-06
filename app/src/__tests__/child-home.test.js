// child-home.test.js — the child's own home is computed from their REAL grants
// (never a hardcoded menu), the finances section unlocks only on a real
// finance.view grant and is honest when the books aren't reachable yet, and the
// acting-locks never leak in.
import { describe, it, expect } from 'vitest';
import { childHomeModel, childActivities, childFinancesSection, childHomeHasContent } from '../lib/child-home.js';
import { SETTING } from '../lib/relationships.js';

const BOOKS = {
  accounts: [{ id: 'sav', name: 'Buffer', type: 'savings', openingBalance: 2000 }],
  transactions: [],
  inflows: { salaries: [{ actual: 5000 }], rentals: [] },
  outflows: { rentalMortgages: 0, propertyUtilities: 300, household: 1800, debtService: 700, charitableGiving: 500 },
};

describe('activities come from real grants', () => {
  it('default (empty config): the child-safe defaults show (learn/scripture/game allowed)', () => {
    const acts = childActivities({});
    const byCap = Object.fromEntries(acts.map((a) => [a.capability, a]));
    expect(byCap['learn.read'].allowed).toBe(true);
    expect(byCap['scripture.read'].allowed).toBe(true);
    expect(byCap['game.play'].allowed).toBe(true);
    // message.family defaults to ask-first
    expect(byCap['message.family'].needsApproval).toBe(true);
  });
  it('never surfaces the acting-locks as activities (spend/security/outbound not tiles)', () => {
    const caps = childActivities({}).map((a) => a.capability);
    expect(caps).not.toContain('purchase.any');
    expect(caps).not.toContain('account.security');
    expect(caps).not.toContain('content.unrated');
    expect(caps).not.toContain('finance.view'); // finances is its own section
  });
});

describe('finances section unlocks only on a real grant, honest when not reachable', () => {
  it('locked by default (no grant) — no section, no fake', () => {
    const f = childFinancesSection({});
    expect(f.unlocked).toBe(false);
    expect(f.view).toBeNull();
  });
  it('granted (allow) but books not reachable yet: pending, not faked (DR-0093)', () => {
    const f = childFinancesSection({ 'finance.view': SETTING.ALLOW }, { financeData: null });
    expect(f.unlocked).toBe(true);
    expect(f.pending).toBe(true);
    expect(f.view).toBeNull();
  });
  it('granted + books present: renders the real read-only view in the guardian-chosen mode', () => {
    const f = childFinancesSection({ 'finance.view': SETTING.ALLOW }, { financeData: BOOKS, mode: 'teaching' });
    expect(f.unlocked).toBe(true);
    expect(f.pending).toBe(false);
    expect(f.mode).toBe('teaching');
    expect(f.view.readOnly).toBe(true);
    expect(f.view.flow.find((x) => x.key === 'giving').amount).toBe(500);
  });
  it('ask-first grant unlocks the section but flags guardian approval for the peek', () => {
    const f = childFinancesSection({ 'finance.view': SETTING.APPROVAL }, { financeData: BOOKS });
    expect(f.unlocked).toBe(true);
    expect(f.needsApproval).toBe(true);
  });
});

describe('the whole home model', () => {
  it('composes activities + finances; canDo lists the allowed capabilities', () => {
    const m = childHomeModel({ 'finance.view': SETTING.ALLOW }, { financeData: BOOKS, mode: 'raw' });
    expect(m.canDo).toContain('learn.read');
    expect(m.finances.unlocked).toBe(true);
    expect(m.finances.mode).toBe('raw');
    expect(childHomeHasContent(m)).toBe(true);
  });
});

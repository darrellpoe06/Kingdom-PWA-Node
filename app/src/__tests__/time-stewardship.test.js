// =============================================================================
// time-stewardship — domain core tests (DR-0233; DR-0076 evidence-not-claims)
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  LEAVE_TYPES, leaveType, validateEntry, decideTransition,
  accruedThrough, usedThrough, balanceOn, dateRange, buildAbsenceRows,
} from '../lib/time-stewardship.js';

describe('leave types', () => {
  it('carries the platform vocabulary including serve/ministry time', () => {
    expect(LEAVE_TYPES.map((t) => t.key)).toContain('serve');
    expect(leaveType('vacation').short).toBe('V');
  });
  it('no leave type uses true red — DR-0099 color theology', () => {
    for (const t of LEAVE_TYPES) {
      expect(t.color.toLowerCase()).not.toBe('#ff0000');
      expect(t.color.toLowerCase()).not.toBe('#f00');
    }
  });
});

describe('entry validation', () => {
  const good = { type: 'vacation', date: '2026-08-04', days: 0.5, memberId: 'm1' };
  it('accepts a valid half-day', () => expect(validateEntry(good).ok).toBe(true));
  it('rejects unknown type, bad date, zero days, missing member', () => {
    expect(validateEntry({ ...good, type: 'nap' }).error).toMatch(/unknown/);
    expect(validateEntry({ ...good, date: '8/4/26' }).error).toMatch(/date/);
    expect(validateEntry({ ...good, days: 0 }).error).toMatch(/days/);
    expect(validateEntry({ ...good, memberId: '' }).error).toMatch(/member/);
  });
});

describe('transitions — separation of duties is in the math', () => {
  const entry = { id: 'e1', memberId: 'darrell', status: 'submitted' };
  it('another hand can approve, and gets a receipt', () => {
    const r = decideTransition({ entry, to: 'approved', actorId: 'christina', at: 't1' });
    expect(r.ok).toBe(true);
    expect(r.receipt).toEqual({ entryId: 'e1', from: 'submitted', to: 'approved', by: 'christina', at: 't1' });
  });
  it('NEVER self-approval — founder protection', () => {
    expect(decideTransition({ entry, to: 'approved', actorId: 'darrell' }).error).toMatch(/separation/);
  });
  it('approved entries cancel only by a different hand (supervisor rule)', () => {
    const approved = { ...entry, status: 'approved' };
    expect(decideTransition({ entry: approved, to: 'cancelled', actorId: 'darrell' }).error).toMatch(/separation/);
    expect(decideTransition({ entry: approved, to: 'cancelled', actorId: 'courtney' }).ok).toBe(true);
  });
  it('declined can be fixed and resubmitted; cancelled is final', () => {
    expect(decideTransition({ entry: { ...entry, status: 'declined' }, to: 'submitted', actorId: 'darrell' }).ok).toBe(true);
    expect(decideTransition({ entry: { ...entry, status: 'cancelled' }, to: 'submitted', actorId: 'darrell' }).error).toBeTruthy();
  });
});

describe('balances — computed, never asserted', () => {
  const policy = { balanceForward: 7.83, accrualPerMonth: 2, periodStart: '2026-01-01' };
  const entries = [
    { type: 'vacation', date: '2026-02-10', days: 1, status: 'approved', memberId: 'm1' },
    { type: 'vacation', date: '2026-03-05', days: 0.5, status: 'approved', memberId: 'm1' },
    { type: 'vacation', date: '2026-03-20', days: 1, status: 'submitted', memberId: 'm1' }, // pending
    { type: 'sick', date: '2026-02-01', days: 1, status: 'approved', memberId: 'm1' },      // other type
    { type: 'vacation', date: '2026-09-01', days: 1, status: 'approved', memberId: 'm1' },  // after asOf
  ];
  it('accrues monthly through the asOf month', () => {
    expect(accruedThrough(policy, '2026-03-15')).toBe(6); // Jan+Feb+Mar
    expect(accruedThrough(policy, '2025-12-31')).toBe(0); // before period
  });
  it('uses approved days of the one type through asOf', () => {
    expect(usedThrough(entries, 'vacation', '2026-03-31')).toBe(1.5);
    expect(usedThrough(entries, 'vacation', '2026-03-31', { includePending: true })).toBe(2.5);
  });
  it('balance = forward + accrued − used (the reference summary block)', () => {
    const b = balanceOn(policy, entries, 'vacation', '2026-03-31');
    expect(b).toEqual({ balanceForward: 7.83, accrued: 6, used: 1.5, balance: 12.33 });
  });
});

describe('absence graph', () => {
  it('paints approved entries only — pending never states a fact (DR-0100)', () => {
    const members = [{ id: 'm1', name: 'Darrell' }, { id: 'm2', name: 'Eldris' }];
    const entries = [
      { memberId: 'm1', type: 'vacation', date: '2026-08-04', days: 1, status: 'approved' },
      { memberId: 'm2', type: 'sick', date: '2026-08-04', days: 1, status: 'submitted' },
    ];
    const rows = buildAbsenceRows(members, entries, '2026-08-03', '2026-08-05');
    expect(rows[0].cells.map((c) => c && c.short)).toEqual([null, 'V', null]);
    expect(rows[1].cells).toEqual([null, null, null]);
  });
  it('dateRange is inclusive and bounded', () => {
    expect(dateRange('2026-08-03', '2026-08-05')).toEqual(['2026-08-03', '2026-08-04', '2026-08-05']);
    expect(dateRange('bad', 'worse')).toEqual([]);
  });
});

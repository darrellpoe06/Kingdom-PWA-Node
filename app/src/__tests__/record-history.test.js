// =============================================================================
// record-history — proven-to-catch gate (Verification Doctrine, DR-0076).
// =============================================================================
// The audit/versioning substrate that turns a mutated-in-place row into a
// LIVING record: full, attributed, recoverable history. Each test FAILS if the
// promise regresses:
//   1. DIFF — changed scalar fields are surfaced; bookkeeping noise is ignored.
//   2. EVENT — make fills changes + summary; requires identity; clamps action.
//   3. ORDER — history is chronological and stable on id for clock ties.
//   4. RECONSTRUCT — any past version is the `after` at-or-before an instant;
//      a delete makes the record null (recoverable via its `before`).
//   5. TIMELINE — numbered versions, newest-first, with per-version changes.
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  diffFields, summarizeChange, makeHistoryEvent, historyFor, reconstructAt,
  currentVersion, versionTimeline, versionCount, HISTORY_ACTIONS,
} from '../lib/record-history.js';

describe('record-history — diff', () => {
  it('surfaces changed scalar fields as { from, to } and ignores bookkeeping noise', () => {
    const before = { id: 'x', name: 'A', qty: 1, updatedAt: 't1' };
    const after = { id: 'x', name: 'B', qty: 1, updatedAt: 't2' };
    const changes = diffFields(before, after);
    expect(changes).toEqual({ name: { from: 'A', to: 'B' } });
    expect(changes.updatedAt).toBeUndefined(); // noise field ignored
    expect(changes.qty).toBeUndefined(); // unchanged
  });

  it('summarizeChange renders a readable line', () => {
    expect(summarizeChange({ name: { from: 'A', to: 'B' } })).toMatch(/name: A -> B/);
    expect(summarizeChange({})).toMatch(/no field changes/);
  });
});

describe('record-history — event creation', () => {
  it('requires record identity', () => {
    expect(() => makeHistoryEvent({ recordKind: 'x' })).toThrow();
    expect(() => makeHistoryEvent({ recordId: '1' })).toThrow();
  });

  it('fills field changes and a default summary from before/after', () => {
    const ev = makeHistoryEvent({
      recordKind: 'inventory_item', recordId: 'inv-1', action: 'update',
      before: { name: 'A', reorderPoint: 2 }, after: { name: 'A', reorderPoint: 5 }, at: '2026-06-01T00:00:00Z',
    });
    expect(ev.changes).toEqual({ reorderPoint: { from: 2, to: 5 } });
    expect(ev.summary).toMatch(/reorderPoint/);
    expect(HISTORY_ACTIONS).toContain(ev.action);
  });

  it('clamps an unknown action to update', () => {
    const ev = makeHistoryEvent({ recordKind: 'x', recordId: '1', action: 'frobnicate' });
    expect(ev.action).toBe('update');
  });
});

describe('record-history — ordering and reconstruction', () => {
  const events = [
    makeHistoryEvent({ id: 'e1', recordKind: 'transaction', recordId: 't1', action: 'create', after: { amount: 100, description: 'Rent' }, at: '2026-06-01T00:00:00Z' }),
    makeHistoryEvent({ id: 'e2', recordKind: 'transaction', recordId: 't1', action: 'update', before: { amount: 100, description: 'Rent' }, after: { amount: 120, description: 'Rent' }, at: '2026-06-02T00:00:00Z' }),
    makeHistoryEvent({ id: 'e3', recordKind: 'transaction', recordId: 't1', action: 'update', before: { amount: 120, description: 'Rent' }, after: { amount: 120, description: 'Rent — May' }, at: '2026-06-03T00:00:00Z' }),
    makeHistoryEvent({ id: 'eX', recordKind: 'transaction', recordId: 'OTHER', action: 'create', after: { amount: 9 }, at: '2026-06-01T00:00:00Z' }),
  ];

  it('historyFor returns only this record, oldest first', () => {
    const h = historyFor(events, 'transaction', 't1');
    expect(h.map((e) => e.id)).toEqual(['e1', 'e2', 'e3']);
  });

  it('reconstructs the version as of any instant (inclusive)', () => {
    expect(reconstructAt(events, 'transaction', 't1', '2026-06-01T12:00:00Z').amount).toBe(100);
    expect(reconstructAt(events, 'transaction', 't1', '2026-06-02T12:00:00Z').amount).toBe(120);
    expect(reconstructAt(events, 'transaction', 't1', '2026-05-01T00:00:00Z')).toBeNull(); // did not exist yet
    expect(currentVersion(events, 'transaction', 't1').description).toBe('Rent — May');
  });

  it('a delete makes the record null but keeps the before snapshot recoverable', () => {
    const withDelete = [...events, makeHistoryEvent({ id: 'e4', recordKind: 'transaction', recordId: 't1', action: 'delete', before: { amount: 120, description: 'Rent — May' }, at: '2026-06-04T00:00:00Z' })];
    expect(currentVersion(withDelete, 'transaction', 't1')).toBeNull();
    // The pre-delete state is still reconstructable.
    expect(reconstructAt(withDelete, 'transaction', 't1', '2026-06-03T12:00:00Z').description).toBe('Rent — May');
    // And the delete event itself carries the recoverable snapshot.
    const del = historyFor(withDelete, 'transaction', 't1').find((e) => e.action === 'delete');
    expect(del.before.amount).toBe(120);
  });

  it('orders stably on id when timestamps collide', () => {
    const tie = [
      makeHistoryEvent({ id: 'b', recordKind: 'k', recordId: '1', after: { v: 2 }, at: '2026-06-01T00:00:00Z' }),
      makeHistoryEvent({ id: 'a', recordKind: 'k', recordId: '1', after: { v: 1 }, at: '2026-06-01T00:00:00Z' }),
    ];
    expect(historyFor(tie, 'k', '1').map((e) => e.id)).toEqual(['a', 'b']);
  });
});

describe('record-history — timeline', () => {
  it('numbers versions and lists newest-first with per-version changes', () => {
    const events = [
      makeHistoryEvent({ id: 'e1', recordKind: 'inventory_item', recordId: 'inv-1', action: 'create', after: { name: 'Mic', reorderPoint: 2 }, at: '2026-06-01T00:00:00Z' }),
      makeHistoryEvent({ id: 'e2', recordKind: 'inventory_item', recordId: 'inv-1', action: 'update', before: { name: 'Mic', reorderPoint: 2 }, after: { name: 'Mic', reorderPoint: 4 }, at: '2026-06-02T00:00:00Z' }),
    ];
    const tl = versionTimeline(events, 'inventory_item', 'inv-1');
    expect(tl.map((v) => v.version)).toEqual([2, 1]); // newest first
    expect(tl[0].changes).toEqual({ reorderPoint: { from: 2, to: 4 } });
    expect(versionCount(events, 'inventory_item', 'inv-1')).toBe(2);
  });
});

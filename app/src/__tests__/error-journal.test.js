// error-journal (DR-0092) — the app's durable memory of its own failures.
// Proven-to-catch (DR-0076): recording, dedupe-by-repeat, the cap, the 24h
// roll-up, and the global capture wiring are each exercised — including the
// failure modes (broken storage, corrupt JSON, non-browser context), because
// the watcher itself must never throw (P10 posture: observing never breaks).
import { describe, it, expect } from 'vitest';
import {
  ERROR_JOURNAL_KEY, ERROR_JOURNAL_CAP,
  readErrorJournal, appendError, recordError, clearErrorJournal,
  errorJournalSummary, installGlobalErrorCapture,
} from '../lib/error-journal.js';

// Minimal window-like with real storage semantics.
function fakeWin(initial = {}) {
  const store = { ...initial };
  return {
    localStorage: {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
    },
    _store: store,
  };
}

describe('appendError — dedupe and cap', () => {
  const e = (source, message, at) => ({ at, source, kind: 'runtime', message });
  it('a repeat of the newest entry bumps count instead of flooding', () => {
    let list = appendError([], e('window', 'boom', 't1'));
    list = appendError(list, e('window', 'boom', 't2'));
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ count: 2, at: 't2' });
  });
  it('a different error prepends (newest first) and the cap holds', () => {
    let list = [];
    for (let i = 0; i < ERROR_JOURNAL_CAP + 5; i++) list = appendError(list, e('window', `err-${i}`, `t${i}`));
    expect(list).toHaveLength(ERROR_JOURNAL_CAP);
    expect(list[0].message).toBe(`err-${ERROR_JOURNAL_CAP + 4}`); // newest kept
  });
});

describe('recordError / readErrorJournal — storage round-trip that never throws', () => {
  it('round-trips an entry with truncation and kind validation', () => {
    const w = fakeWin();
    const ok = recordError({ source: 'surface:Voice', kind: 'bogus-kind', message: 'x'.repeat(500) }, w, '2026-07-03T04:00:00Z');
    expect(ok).toBe(true);
    const back = readErrorJournal(w);
    expect(back).toHaveLength(1);
    expect(back[0].kind).toBe('runtime'); // unknown kind normalized, never stored raw
    expect(back[0].message).toHaveLength(300);
  });
  it('corrupt stored JSON reads as an honest empty journal', () => {
    const w = fakeWin({ [ERROR_JOURNAL_KEY]: '{not json' });
    expect(readErrorJournal(w)).toEqual([]);
  });
  it('broken storage returns false, never throws (the watcher can never break)', () => {
    const w = { localStorage: { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } } };
    expect(() => recordError({ message: 'x' }, w)).not.toThrow();
    expect(recordError({ message: 'x' }, w)).toBe(false);
    expect(readErrorJournal(w)).toEqual([]);
  });
  it('clearErrorJournal empties the journal', () => {
    const w = fakeWin();
    recordError({ source: 's', message: 'x' }, w);
    clearErrorJournal(w);
    expect(readErrorJournal(w)).toEqual([]);
  });
});

describe('errorJournalSummary — the board roll-up', () => {
  const NOW = Date.parse('2026-07-03T12:00:00Z');
  it('counts occurrences (dedupe counts included) and flags recent 24h as attention', () => {
    const s = errorJournalSummary([
      { at: '2026-07-03T11:00:00Z', source: 'a', message: 'x', count: 3 },
      { at: '2026-06-01T00:00:00Z', source: 'b', message: 'y', count: 1 },
    ], NOW);
    expect(s).toMatchObject({ total: 4, recent: 3, distinct: 2, status: 'attention', label: '3 in 24h' });
  });
  it('old-only errors are good with an honest label; empty is honest too', () => {
    expect(errorJournalSummary([{ at: '2026-06-01T00:00:00Z', source: 'a', message: 'x' }], NOW))
      .toMatchObject({ status: 'good', label: 'None in 24h', total: 1 });
    expect(errorJournalSummary([], NOW)).toMatchObject({ total: 0, label: 'None recorded' });
  });
  it('an error STORM in 24h reads red, not amber (red must be reachable — 2026-07-03 audit)', () => {
    const storm = [{ at: '2026-07-03T11:30:00Z', source: 'surface:Voice', message: 'boom', count: 12 }];
    expect(errorJournalSummary(storm, NOW).status).toBe('problem');
    const few = [{ at: '2026-07-03T11:30:00Z', source: 'surface:Voice', message: 'boom', count: 2 }];
    expect(errorJournalSummary(few, NOW).status).toBe('attention');
  });
});

describe('installGlobalErrorCapture — window + promise wiring', () => {
  function listeningWin() {
    const listeners = {};
    const w = fakeWin();
    w.addEventListener = (type, fn) => { (listeners[type] = listeners[type] || []).push(fn); };
    w.removeEventListener = (type, fn) => { listeners[type] = (listeners[type] || []).filter((f) => f !== fn); };
    w._fire = (type, event) => (listeners[type] || []).forEach((f) => f(event));
    w._count = (type) => (listeners[type] || []).length;
    return w;
  }
  it('records uncaught errors and unhandled rejections; unsubscribe detaches', () => {
    const w = listeningWin();
    const off = installGlobalErrorCapture(w);
    w._fire('error', { message: 'ReferenceError: nope' });
    w._fire('unhandledrejection', { reason: new Error('rejected hard') });
    const back = readErrorJournal(w);
    expect(back).toHaveLength(2);
    expect(back.map((e) => e.kind).sort()).toEqual(['promise', 'runtime']);
    off();
    expect(w._count('error')).toBe(0);
    expect(w._count('unhandledrejection')).toBe(0);
  });
  it('a malformed event records a fallback message rather than throwing', () => {
    const w = listeningWin();
    installGlobalErrorCapture(w);
    expect(() => { w._fire('error', undefined); w._fire('unhandledrejection', {}); }).not.toThrow();
    expect(readErrorJournal(w)).toHaveLength(2);
  });
  it('a non-browser context is a safe no-op', () => {
    expect(() => installGlobalErrorCapture(null)()).not.toThrow();
  });
});

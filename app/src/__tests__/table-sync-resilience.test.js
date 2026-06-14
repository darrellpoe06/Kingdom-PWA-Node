// Regression tests for A4 + A5 (rigorous-review 2026-06-13), the table-sync
// realtime resilience hardening:
//   A4 — a burst of realtime changes (incl. the device's own writes) used to
//        fire one full refetch each; now debounced into a single trailing run.
//   A5 — subscribe() had no status handler; a dropped+rejoined websocket must
//        trigger a catch-up refetch (changes missed while down).
// Pairs with RELEASE-LANE.md (regression test in the same PR).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createDebouncer, shouldResyncOnStatus } from '../lib/table-sync.js';

describe('createDebouncer (A4)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('collapses a burst of calls into a single trailing run', () => {
    const fn = vi.fn();
    const d = createDebouncer(fn, 400);
    d(); d(); d(); // three rapid changes
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(399);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1); // ONE refetch, not three
  });

  it('runs again for a later, separate burst', () => {
    const fn = vi.fn();
    const d = createDebouncer(fn, 400);
    d();
    vi.advanceTimersByTime(400);
    d();
    vi.advanceTimersByTime(400);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('cancel() prevents a pending run (unsubscribe during a burst)', () => {
    const fn = vi.fn();
    const d = createDebouncer(fn, 400);
    d();
    d.cancel();
    vi.advanceTimersByTime(1000);
    expect(fn).not.toHaveBeenCalled();
  });

  it('passes through the latest call arguments', () => {
    const fn = vi.fn();
    const d = createDebouncer(fn, 100);
    d('a'); d('b');
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledWith('b');
  });
});

describe('shouldResyncOnStatus (A5)', () => {
  it('does NOT resync on the first SUBSCRIBED (initial fetch already ran)', () => {
    const state = { everSubscribed: false };
    expect(shouldResyncOnStatus('SUBSCRIBED', state)).toBe(false);
    expect(state.everSubscribed).toBe(true);
  });

  it('DOES resync on a later SUBSCRIBED — the socket dropped and rejoined', () => {
    const state = { everSubscribed: false };
    shouldResyncOnStatus('SUBSCRIBED', state); // first connect
    shouldResyncOnStatus('CHANNEL_ERROR', state); // drop
    shouldResyncOnStatus('CLOSED', state); // closed
    expect(shouldResyncOnStatus('SUBSCRIBED', state)).toBe(true); // reconnect -> catch up
  });

  it('never resyncs on non-SUBSCRIBED transitions', () => {
    const state = { everSubscribed: true };
    expect(shouldResyncOnStatus('CHANNEL_ERROR', state)).toBe(false);
    expect(shouldResyncOnStatus('TIMED_OUT', state)).toBe(false);
    expect(shouldResyncOnStatus('CLOSED', state)).toBe(false);
  });
});

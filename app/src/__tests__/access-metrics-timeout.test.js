// @vitest-environment jsdom
// Proven-to-catch for the "Users & usage won't populate — stuck on Loading…"
// hang (2026-07-14, DR-0076). The Access & Usage snapshot awaits getSession() +
// six SELECTs with NO timeout; a resumed-tab getSession() (or a stalled query)
// that never resolves used to strand the panel on "Loading…" forever. withTimeout
// is the guard: a promise that never settles MUST resolve to the fallback.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { withTimeout, SNAPSHOT_TIMEOUT_MS } from '../lib/access-metrics-sync.js';

afterEach(() => { vi.useRealTimers(); });

describe('withTimeout — the Access & Usage snapshot can never hang', () => {
  it('resolves to the fallback when the promise NEVER settles (THE hang)', async () => {
    vi.useFakeTimers();
    const neverResolves = new Promise(() => {}); // like a frozen-tab getSession()
    const fallback = { data: null, error: { timedOut: true } };
    const raced = withTimeout(neverResolves, SNAPSHOT_TIMEOUT_MS, fallback);
    await vi.advanceTimersByTimeAsync(SNAPSHOT_TIMEOUT_MS + 1);
    expect(await raced).toBe(fallback);
  });

  it('passes through a value that resolves in time', async () => {
    expect(await withTimeout(Promise.resolve(42), 1000, 'fb')).toBe(42);
  });

  it('degrades a rejection to the fallback (never throws)', async () => {
    expect(await withTimeout(Promise.reject(new Error('boom')), 1000, 'fb')).toBe('fb');
  });

  it('uses a bounded, sane ceiling', () => {
    expect(SNAPSHOT_TIMEOUT_MS).toBeGreaterThan(0);
    expect(SNAPSHOT_TIMEOUT_MS).toBeLessThanOrEqual(15000);
  });
});

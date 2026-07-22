// @vitest-environment jsdom
// Proven-to-catch for the "Users & usage won't populate — stuck on Loading…"
// hang (2026-07-14, DR-0076). The Access & Usage snapshot awaits getSession() +
// six SELECTs with NO timeout; a resumed-tab getSession() (or a stalled query)
// that never resolves used to strand the panel on "Loading…" forever. withTimeout
// is the guard: a promise that never settles MUST resolve to the fallback.
import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('../lib/supabase.js', () => ({
  default: { auth: { getSession: vi.fn() } },
  readPersistedSession: vi.fn(() => null),
}));

import supabase from '../lib/supabase.js';
import { withTimeout, SNAPSHOT_TIMEOUT_MS, readySession } from '../lib/access-metrics-sync.js';

afterEach(() => { vi.useRealTimers(); vi.clearAllMocks(); });

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

// Proven-to-catch for the "Access couldn't load — admin_*-timeout" symptom
// (2026-07-16): on a resumed mobile tab the RLS queries fired BEFORE the token was
// ready and all timed out. readySession waits for the session first.
describe('readySession — the RLS queries get a token before they fire', () => {
  it('returns the session once it appears after a beat (cold-tab race)', async () => {
    vi.useFakeTimers();
    const sess = { user: { id: 'u1' } };
    supabase.auth.getSession
      .mockResolvedValueOnce({ data: { session: null } })
      .mockResolvedValueOnce({ data: { session: null } })
      .mockResolvedValue({ data: { session: sess } });
    const p = readySession();
    await vi.advanceTimersByTimeAsync(2000); // let the null retries + 250ms gaps run
    expect(await p).toEqual(sess);
  });

  it('returns null (bounded, no hang) when the session never arrives', async () => {
    vi.useFakeTimers();
    supabase.auth.getSession.mockResolvedValue({ data: { session: null } });
    const p = readySession();
    await vi.advanceTimersByTimeAsync(4 * (700 + 200) + 200);
    expect(await p).toBeNull();
    expect(supabase.auth.getSession).toHaveBeenCalledTimes(4); // bounded, fail-fast retries
  });
});

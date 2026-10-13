// =============================================================================
// auth-boot-gate-hang — proven-to-catch for the "left the tab open, came back
// to a white screen after a while" resume hang (2026-07-13, DR-0076).
// =============================================================================
// The bug: on the public host the app renders nothing until the first
// getSession() resolves (access-gate 'loading'). getSession() can hang
// indefinitely on a return-after-time (expired-token network refresh /
// cross-tab Navigator lock held by a frozen tab), so the boot gate stays blank
// forever — and nothing is rendered to tap. The fix reads the persisted session
// from storage synchronously and fires the gate at once, reconciling with
// getSession in the background. These tests fail against the old (hang-prone)
// behavior and pass with the bounded resolution.
import { describe, it, expect, vi } from 'vitest';
import { readPersistedSession, resolveInitialSession } from '../lib/supabase.js';

// A minimal in-memory Storage stand-in matching the Web Storage shape.
function makeStore(entries = {}) {
  const keys = Object.keys(entries);
  return {
    length: keys.length,
    key: (i) => keys[i] ?? null,
    getItem: (k) => (k in entries ? entries[k] : null),
  };
}

const SESSION = { access_token: 'a.b.c', refresh_token: 'r', expires_at: 9999999999, user: { id: 'u1', email: 'x@y.z' } };

describe('readPersistedSession — the synchronous, never-hangs storage read', () => {
  it('returns the session stored under sb-<ref>-auth-token', () => {
    const store = makeStore({ 'sb-abcdef-auth-token': JSON.stringify(SESSION) });
    expect(readPersistedSession(store)).toMatchObject({ access_token: 'a.b.c', user: { email: 'x@y.z' } });
  });

  it('unwraps the v1 { currentSession } shape too', () => {
    const store = makeStore({ 'sb-xyz-auth-token': JSON.stringify({ currentSession: SESSION }) });
    expect(readPersistedSession(store)?.user?.id).toBe('u1');
  });

  it('returns null when there is no session (a real signed-out visitor gets the gate, not the app)', () => {
    expect(readPersistedSession(makeStore({}))).toBeNull();
  });

  it('ignores unrelated + malformed keys without throwing', () => {
    const store = makeStore({
      'sb-abc-auth-token-code-verifier': 'not-a-session',
      'other': '{}',
      'sb-abc-auth-token': '{ this is not json',
    });
    expect(readPersistedSession(store)).toBeNull();
  });

  it('never throws when storage access itself throws (SecurityError / blocked cookies)', () => {
    const hostile = { get length() { throw new Error('blocked'); } };
    expect(() => readPersistedSession(hostile)).not.toThrow();
    expect(readPersistedSession(hostile)).toBeNull();
  });
});

describe('resolveInitialSession — the boot gate can NEVER hang on a stalled getSession', () => {
  it('fires emit synchronously from storage even when getSession() never resolves (THE hang)', () => {
    const emit = vi.fn();
    const neverResolves = () => new Promise(() => {}); // hangs forever, like the frozen-tab lock
    resolveInitialSession(emit, { getSession: neverResolves, readStored: () => SESSION });
    // The old code awaited getSession() → emit never ran → white screen forever.
    // The fix fires immediately from the storage read.
    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith(SESSION);
  });

  it('still fires (with null) synchronously when getSession() throws synchronously', () => {
    const emit = vi.fn();
    const throwsNow = () => { throw new Error('init blew up'); };
    resolveInitialSession(emit, { getSession: throwsNow, readStored: () => null });
    expect(emit).toHaveBeenCalledWith(null);
  });

  it('reconciles with getSession when it DOES resolve (source of truth wins)', async () => {
    const emit = vi.fn();
    const fresh = { ...SESSION, access_token: 'refreshed' };
    resolveInitialSession(emit, {
      getSession: () => Promise.resolve({ data: { session: fresh } }),
      readStored: () => SESSION,
    });
    expect(emit).toHaveBeenNthCalledWith(1, SESSION);   // immediate optimistic
    await Promise.resolve(); await Promise.resolve();
    expect(emit).toHaveBeenNthCalledWith(2, fresh);      // background reconcile
  });

  it('a getSession that resolves to no session clears an optimistic stale read', async () => {
    const emit = vi.fn();
    resolveInitialSession(emit, {
      getSession: () => Promise.resolve({ data: { session: null } }),
      readStored: () => SESSION,
    });
    expect(emit).toHaveBeenNthCalledWith(1, SESSION);
    await Promise.resolve(); await Promise.resolve();
    expect(emit).toHaveBeenNthCalledWith(2, null);
  });
});

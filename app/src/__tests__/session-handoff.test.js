// @vitest-environment node
// session-handoff — the login-loop fix, pinned (P0 2026-07-07). Proven-to-
// catch: the old behavior (navigate before the token is on disk) is exactly
// what the timeout path represents; the fix waits for the persisted token.
import { describe, it, expect, vi } from 'vitest';
import { hasPersistedSession, awaitPersistedSession, isInAppBrowser, IN_APP_BROWSER_HINT } from '../lib/session-handoff.js';

function fakeStorage(entries = {}) {
  const map = new Map(Object.entries(entries));
  return {
    get length() { return map.size; },
    key: (i) => [...map.keys()][i] ?? null,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
  };
}

describe('hasPersistedSession', () => {
  it('true only when a sb-*-auth-token key holds a value', () => {
    expect(hasPersistedSession(fakeStorage({ 'sb-abc123-auth-token': '{"access_token":"x"}' }))).toBe(true);
    expect(hasPersistedSession(fakeStorage({ 'sb-abc123-auth-token': '' }))).toBe(false);
    expect(hasPersistedSession(fakeStorage({ 'poe-current-profile': 'darrell' }))).toBe(false);
    expect(hasPersistedSession(fakeStorage())).toBe(false);
  });
  it('a throwing/blocked storage is false, never a crash (webview class)', () => {
    expect(hasPersistedSession({ get length() { throw new Error('blocked'); } })).toBe(false);
  });
});

describe('awaitPersistedSession', () => {
  it('resolves true immediately when the token is already persisted', async () => {
    await expect(awaitPersistedSession({ storage: fakeStorage({ 'sb-x-auth-token': 't' }) })).resolves.toBe(true);
  });
  it('resolves true as soon as the token lands (the race, won)', async () => {
    vi.useFakeTimers();
    const s = fakeStorage();
    const p = awaitPersistedSession({ storage: s, timeoutMs: 3000, intervalMs: 10 });
    s.setItem('sb-x-auth-token', 't');
    await vi.advanceTimersByTimeAsync(20);
    await expect(p).resolves.toBe(true);
    vi.useRealTimers();
  });
  it('times out false instead of trapping the user (no-lockout)', async () => {
    vi.useFakeTimers();
    const p = awaitPersistedSession({ storage: fakeStorage(), timeoutMs: 100, intervalMs: 10 });
    await vi.advanceTimersByTimeAsync(200);
    await expect(p).resolves.toBe(false);
    vi.useRealTimers();
  });
});

describe('isInAppBrowser', () => {
  it('flags the storage-dropping in-app browsers', () => {
    expect(isInAppBrowser('Mozilla/5.0 (iPhone) Instagram 300.0')).toBe(true);
    expect(isInAppBrowser('Mozilla/5.0 [FBAN/FBIOS;FBAV/400.0]')).toBe(true);
    expect(isInAppBrowser('Mozilla/5.0 musical_ly_2022')).toBe(true);
  });
  it('never flags real browsers', () => {
    expect(isInAppBrowser('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari/605.1')).toBe(false);
    expect(isInAppBrowser('Mozilla/5.0 (Windows NT 10.0) Chrome/126.0')).toBe(false);
  });
  it('the hint tells the user what to do, not just what is wrong', () => {
    expect(IN_APP_BROWSER_HINT).toContain('Safari or Chrome');
  });
});

// @vitest-environment jsdom
// Proven-to-catch for the REAL "Admin stuck on Loading" fix (Darrell 2026-07-22):
// the Supabase JS client serializes every read through navigator.locks, so a wedged
// PoeTech tab holding the lock blocks this tab's SELECTs. fetchAccessSnapshot now
// reads via DIRECT REST with the persisted bearer token — no client, no lock. These
// prove: (1) it loads rows via fetch carrying the token, never supabase.from; (2) a
// stalled fetch aborts at the ceiling so the panel resolves, never hangs; (3) no
// stored token -> honest signed-out, no request.
import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('../lib/supabase.js', () => ({
  default: { auth: { getSession: vi.fn(() => Promise.resolve({ data: { session: null } })) } },
  readPersistedSession: vi.fn(() => ({ access_token: 'tok-abc', user: { id: 'u1' } })),
  SUPABASE_URL: 'https://db.example.co',
  SUPABASE_ANON_KEY: 'anon-key',
}));

import { fetchAccessSnapshot, SNAPSHOT_TIMEOUT_MS } from '../lib/access-metrics-sync.js';
import { readPersistedSession } from '../lib/supabase.js';

afterEach(() => { vi.useRealTimers(); vi.clearAllMocks(); });

describe('fetchAccessSnapshot — direct REST, bypassing the cross-tab auth lock', () => {
  it('loads rows with the bearer token + apikey, and never calls supabase.from', async () => {
    const rows = {
      instances: [{ id: 'i1', slug: 'poe-family', display_name: 'Poe Family', instance_type: 'family' }],
      instance_members: [{ id: 'm1', instance_id: 'i1', user_id: 'u1', role: 'owner', display_name: 'Darrell' }],
    };
    global.fetch = vi.fn((url, opts) => {
      const table = String(url).match(/rest\/v1\/([^?]+)/)[1];
      expect(opts.headers.Authorization).toBe('Bearer tok-abc'); // token rides the request (RLS-safe)
      expect(opts.headers.apikey).toBe('anon-key');
      return Promise.resolve({ ok: true, json: () => Promise.resolve(rows[table] || []) });
    });

    const snap = await fetchAccessSnapshot();

    expect(snap.signedIn).toBe(true);
    expect(snap.instances).toEqual([{ id: 'i1', slug: 'poe-family', displayName: 'Poe Family', instanceType: 'family' }]);
    expect(snap.members[0]).toMatchObject({ id: 'm1', role: 'owner', displayName: 'Darrell' });
    expect(global.fetch).toHaveBeenCalledTimes(6); // one per governance table, via REST (no client, no lock)
  });

  it('a stalled fetch aborts at the ceiling — the snapshot resolves, never hangs', async () => {
    vi.useFakeTimers();
    global.fetch = vi.fn((url, opts) => new Promise((_res, reject) => {
      opts.signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
    }));

    const p = fetchAccessSnapshot();
    await vi.advanceTimersByTimeAsync(SNAPSHOT_TIMEOUT_MS + 50);
    const snap = await p;

    expect(snap.signedIn).toBe(true);          // we had a token, so not signed-out
    expect(snap.instances).toEqual([]);         // timed out -> honest empty
    expect(snap.errors.instances).toMatch(/timeout/);
  });

  it('no stored token -> honest signed-out, and no network request', async () => {
    vi.useFakeTimers();
    readPersistedSession.mockReturnValue(null);
    global.fetch = vi.fn();

    const p = fetchAccessSnapshot();
    await vi.advanceTimersByTimeAsync(4 * (700 + 200) + 100); // let readySession fall through
    const snap = await p;

    expect(snap.signedIn).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

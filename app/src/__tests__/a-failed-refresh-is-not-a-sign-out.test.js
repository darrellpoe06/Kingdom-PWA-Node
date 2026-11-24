// =============================================================================
// DR-1618 — a failed refresh is not a sign-out
// =============================================================================
// Darrell 2026-11-24, after DR-1617 deployed (build cd21ca0): signed in at 9:39,
// the signed-out front page at 9:40 beside "TypeError: Failed to fetch", signed
// in again at 9:40. auth-js getSession() answers { session: null, error } when
// the access token has expired and the refresh cannot reach the server, while
// the sign-in is still stored (it keeps the session on a retryable failure). The
// boot reconcile emitted that null, and the gate painted the front page.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { resolveInitialSession } from '../lib/supabase.js';

const SAVED = { access_token: 'expired', refresh_token: 'rt', user: { id: 'uid-darrell' } };
const flush = () => new Promise((r) => setTimeout(r, 0));

describe('a failed refresh is not a sign-out', () => {
  it('a null session WITH an error keeps the stored sign-in (the reported flip)', async () => {
    const seen = [];
    resolveInitialSession((s) => seen.push(s), {
      readStored: () => SAVED,
      getSession: async () => ({ data: { session: null }, error: { name: 'AuthRetryableFetchError', message: 'Failed to fetch' } }),
    });
    await flush();
    expect(seen).toEqual([SAVED]);
  });

  it('a real sign-out (nothing stored any more) still reads signed out', async () => {
    let stored = SAVED;
    const seen = [];
    resolveInitialSession((s) => seen.push(s), {
      readStored: () => stored,
      getSession: async () => { stored = null; return { data: { session: null }, error: { name: 'AuthApiError', message: 'refresh_token_already_used' } }; },
    });
    await flush();
    expect(seen).toEqual([SAVED, null]);
  });

  it('a plain null with no error (never signed in here) reads signed out', async () => {
    const seen = [];
    resolveInitialSession((s) => seen.push(s), { readStored: () => null, getSession: async () => ({ data: { session: null }, error: null }) });
    await flush();
    expect(seen).toEqual([null, null]);
  });

  it('a fresh session from the server replaces the stored one', async () => {
    const fresh = { ...SAVED, access_token: 'new' };
    const seen = [];
    resolveInitialSession((s) => seen.push(s), { readStored: () => SAVED, getSession: async () => ({ data: { session: fresh }, error: null }) });
    await flush();
    expect(seen).toEqual([SAVED, fresh]);
  });

  it('PROVEN TO CATCH: the old reconcile emits null on the network failure', async () => {
    const oldResolve = (emit, { getSession, readStored }) => {
      emit(readStored());
      return Promise.resolve(getSession()).then((res) => { const s = res && res.data ? res.data.session : undefined; if (s !== undefined) emit(s ?? null); });
    };
    const seen = [];
    await oldResolve((s) => seen.push(s), { readStored: () => SAVED, getSession: async () => ({ data: { session: null }, error: { message: 'Failed to fetch' } }) });
    expect(seen).toEqual([SAVED, null]);
  });
});

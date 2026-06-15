// Regression test for the "logged out after a while" symptom
// (project_auth_identity_tenancy_boundary — the one auth bug not provably
// closed). The CODE-side guard must NOT hard-logout the user on a TRANSIENT
// null / SIGNED_OUT event (PWA resume / rotated-refresh-token race): it tries
// refreshSession() first and only clears on a GENUINE sign-out.
//
// We test the pure decision function directly with an injected `auth` stub, so
// no live Supabase client / network is involved.
import { describe, it, expect, vi } from 'vitest';
import { resolveAuthSession, isPossibleLogout } from '../lib/auth-session-guard.js';

const liveSession = { access_token: 'tok-live', user: { id: 'u-1' } };
const refreshedSession = { access_token: 'tok-fresh', user: { id: 'u-1' } };

describe('isPossibleLogout', () => {
  it('flags only SIGNED_OUT with a null session', () => {
    expect(isPossibleLogout('SIGNED_OUT', null)).toBe(true);
  });
  it('does NOT flag SIGNED_OUT that still carries a session', () => {
    expect(isPossibleLogout('SIGNED_OUT', liveSession)).toBe(false);
  });
  it('does NOT flag TOKEN_REFRESHED / SIGNED_IN', () => {
    expect(isPossibleLogout('TOKEN_REFRESHED', null)).toBe(false);
    expect(isPossibleLogout('SIGNED_IN', liveSession)).toBe(false);
  });
});

describe('resolveAuthSession', () => {
  it('honors a present session without touching refresh', async () => {
    const auth = { refreshSession: vi.fn() };
    const out = await resolveAuthSession('TOKEN_REFRESHED', liveSession, auth);
    expect(out).toEqual({ session: liveSession, recovered: false });
    expect(auth.refreshSession).not.toHaveBeenCalled();
  });

  it('TRANSIENT failure -> RECOVERS (does not log the user out)', async () => {
    // refreshSession re-reads the still-valid refresh token from storage and
    // returns a fresh session — the "logout" was just a stale in-memory token.
    const auth = {
      refreshSession: vi.fn().mockResolvedValue({ data: { session: refreshedSession }, error: null }),
    };
    const out = await resolveAuthSession('SIGNED_OUT', null, auth);
    expect(auth.refreshSession).toHaveBeenCalledTimes(1);
    expect(out).toEqual({ session: refreshedSession, recovered: true });
  });

  it('REAL sign-out (deliberate) -> CLEARS immediately, no refresh attempt', async () => {
    const auth = { refreshSession: vi.fn() };
    const out = await resolveAuthSession('SIGNED_OUT', null, auth, { deliberate: true });
    expect(auth.refreshSession).not.toHaveBeenCalled();
    expect(out).toEqual({ session: null, recovered: false });
  });

  it('GENUINE refresh failure (invalid token) -> CLEARS', async () => {
    const auth = {
      refreshSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid Refresh Token' },
      }),
    };
    const out = await resolveAuthSession('SIGNED_OUT', null, auth);
    expect(auth.refreshSession).toHaveBeenCalledTimes(1);
    expect(out).toEqual({ session: null, recovered: false });
  });

  it('refreshSession THROWS (offline) -> CLEARS without crashing', async () => {
    const auth = { refreshSession: vi.fn().mockRejectedValue(new Error('network down')) };
    const out = await resolveAuthSession('SIGNED_OUT', null, auth);
    expect(out).toEqual({ session: null, recovered: false });
  });

  it('refresh returns no session object -> CLEARS', async () => {
    const auth = { refreshSession: vi.fn().mockResolvedValue({ data: {}, error: null }) };
    const out = await resolveAuthSession('SIGNED_OUT', null, auth);
    expect(out).toEqual({ session: null, recovered: false });
  });
});

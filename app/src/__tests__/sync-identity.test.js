// Regression test for A3 (rigorous-review 2026-06-13): the cross-device numeric
// sync effect must key on the STABLE user id, not the authSession object, so a
// hourly TOKEN_REFRESHED (a fresh object, same user) does NOT re-fire a full
// initialSync + re-subscribe storm. Locks the identity derivation that the
// effect's dependency array now uses. Pairs with RELEASE-LANE.md.
import { describe, it, expect } from 'vitest';
import { syncIdentityKey } from '../lib/sync-identity.js';

describe('syncIdentityKey (A3)', () => {
  it('is null when signed out / malformed', () => {
    expect(syncIdentityKey(null)).toBe(null);
    expect(syncIdentityKey(undefined)).toBe(null);
    expect(syncIdentityKey({})).toBe(null);
    expect(syncIdentityKey({ user: {} })).toBe(null);
  });

  it('is the user id when signed in', () => {
    expect(syncIdentityKey({ user: { id: 'u-1' } })).toBe('u-1');
  });

  it('is STABLE across a token refresh — the storm A3 fixes', () => {
    // Two DISTINCT session objects (different access tokens) for the SAME user,
    // exactly what Supabase hands back on TOKEN_REFRESHED.
    const before = { access_token: 'tok-a', expires_at: 1, user: { id: 'u-1' } };
    const after = { access_token: 'tok-b', expires_at: 2, user: { id: 'u-1' } };
    expect(before).not.toBe(after);
    expect(before.access_token).not.toBe(after.access_token);
    // Object identity differs, but the sync key does NOT — so the effect with
    // [syncIdentityKey(session), ...] deps will not re-run.
    expect(syncIdentityKey(before)).toBe(syncIdentityKey(after));
  });

  it('CHANGES on account switch — a real re-sync MUST fire', () => {
    expect(syncIdentityKey({ user: { id: 'u-1' } })).not.toBe(
      syncIdentityKey({ user: { id: 'u-2' } }),
    );
  });

  it('CHANGES on sign-out and sign-in transitions', () => {
    expect(syncIdentityKey(null)).not.toBe(syncIdentityKey({ user: { id: 'u-1' } }));
    expect(syncIdentityKey({ user: { id: 'u-1' } })).not.toBe(syncIdentityKey(null));
  });
});

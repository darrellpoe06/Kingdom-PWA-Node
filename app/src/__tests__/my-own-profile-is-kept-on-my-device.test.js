// DR-1624 — my own profile is kept on my device. Darrell 2026-11-24, the road
// to the NAS dark: "No longer shows my picture on my image spot!!!! Why?"
import { describe, it, expect, vi, beforeEach } from 'vitest';

const state = { session: null, row: null, error: null };
vi.mock('../lib/supabase.js', () => ({
  default: {
    auth: { storageKey: 'sb-poetech-auth-token', getSession: async () => ({ data: { session: state.session } }) },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: state.row, error: state.error }) }) }) }),
    rpc: async () => ({ data: null, error: null }),
  },
}));

import { loadMyProfile, keptMyProfile, keepMyProfile } from '../lib/profiles-sync.js';

const DARRELL = 'uid-darrell';
const ROW = { user_id: DARRELL, display_name: 'Darrell', photo_thumb: 'data:image/jpeg;base64,AAAA', visibility: 'church' };

beforeEach(() => {
  localStorage.clear();
  state.session = { user: { id: DARRELL } };
  state.row = ROW;
  state.error = null;
});

describe('my own profile is kept on my device', () => {
  it('a good read is kept, and a failed read shows the kept picture (the reported loss)', async () => {
    const live = await loadMyProfile();
    expect(live.photoThumb).toBe(ROW.photo_thumb);
    state.error = { message: 'TypeError: Failed to fetch' };
    state.row = null;
    const kept = await loadMyProfile();
    expect(kept.photoThumb).toBe(ROW.photo_thumb);
    expect(kept.displayName).toBe('Darrell');
    expect(kept.fromDevice).toBe(true);
  });

  it('still shown when getSession itself answers null but the sign-in is stored (DR-1618)', async () => {
    await loadMyProfile();
    state.session = null;
    state.error = { message: 'Failed to fetch' };
    localStorage.setItem('sb-poetech-auth-token', JSON.stringify({ access_token: 'x', user: { id: DARRELL } }));
    expect((await loadMyProfile()).photoThumb).toBe(ROW.photo_thumb);
  });

  it('another account never sees it', async () => {
    await loadMyProfile();
    state.session = { user: { id: 'uid-christina' } };
    state.error = { message: 'Failed to fetch' };
    expect(await loadMyProfile()).toBeNull();
    keepMyProfile('uid-christina', { userId: DARRELL, photoThumb: 'x' });
    expect(keptMyProfile('uid-christina')).toBeNull();
  });

  it('a successful read that finds no row clears the kept copy (a deleted profile stays deleted)', async () => {
    await loadMyProfile();
    state.row = null;
    expect(await loadMyProfile()).toBeNull();
    expect(keptMyProfile(DARRELL)).toBeNull();
  });

  it('PROVEN TO CATCH: without the kept copy a failed read is null, which the header draws as an initial', async () => {
    state.error = { message: 'Failed to fetch' };
    state.row = null;
    expect(await loadMyProfile()).toBeNull();
  });

  it('signed out and nothing stored is still nobody', async () => {
    state.session = null;
    expect(await loadMyProfile()).toBeNull();
  });
});

// @vitest-environment node
//
// getChoirAccess — a denied Choir state must say WHICH kind it is (DR-0076).
// Christina (director, mrspoe06) hit the "ask the director to add you" empty
// state because a lapsed/hung session or an RPC error resolved to canSee:false —
// indistinguishable from a genuine non-member. getChoirAccess now returns an
// `unverified` flag so the surface tells a director to REFRESH, never to ask
// herself. Proven-to-catch: an RPC error / a wedged getSession → unverified:true,
// while a clean "not a member" stays unverified:false.
import { describe, it, expect, vi, beforeEach } from 'vitest';

const getSession = vi.fn();
const rpc = vi.fn();
vi.mock('../lib/supabase.js', () => ({ default: { auth: { getSession: (...a) => getSession(...a) }, rpc: (...a) => rpc(...a) } }));
const churchInstanceId = vi.fn();
vi.mock('../lib/church-instance.js', () => ({ churchInstanceId: (...a) => churchInstanceId(...a) }));

import { getChoirAccess } from '../lib/choir-sync.js';

const SESSION = { user: { email: 'mrspoe06@gmail.com' } };
const roleThen = (role, inChoir) => (name) =>
  Promise.resolve(name === 'user_role_in_instance' ? { data: role, error: null } : { data: inChoir, error: null });

describe('getChoirAccess — unverified vs. genuinely-not-a-member', () => {
  beforeEach(() => { getSession.mockReset(); rpc.mockReset(); churchInstanceId.mockReset(); });

  it('a director (role admin) sees + edits — unverified false', async () => {
    getSession.mockResolvedValue({ data: { session: SESSION } });
    churchInstanceId.mockResolvedValue('tenant-1');
    rpc.mockImplementation(roleThen('admin', false));
    const a = await getChoirAccess();
    expect(a).toMatchObject({ signedIn: true, canSee: true, canEdit: true, unverified: false });
  });

  it('a genuine non-member (role member, not in choir) → the ask-to-be-added state, NOT unverified', async () => {
    getSession.mockResolvedValue({ data: { session: SESSION } });
    churchInstanceId.mockResolvedValue('tenant-1');
    rpc.mockImplementation(roleThen('member', false));
    const a = await getChoirAccess();
    expect(a).toMatchObject({ signedIn: true, canSee: false, unverified: false });
  });

  it('an RPC error is UNVERIFIED, not a silent "not a member"', async () => {
    getSession.mockResolvedValue({ data: { session: SESSION } });
    churchInstanceId.mockResolvedValue('tenant-1');
    rpc.mockImplementation((name) =>
      name === 'user_role_in_instance' ? Promise.resolve({ data: null, error: { message: 'boom' } }) : Promise.resolve({ data: false, error: null }));
    const a = await getChoirAccess();
    expect(a).toMatchObject({ signedIn: true, canSee: false, unverified: true });
  });

  it('not signed in → signedIn false, NOT unverified', async () => {
    getSession.mockResolvedValue({ data: { session: null } });
    const a = await getChoirAccess();
    expect(a).toMatchObject({ signedIn: false, canSee: false, unverified: false });
  });

  it('a wedged getSession (cross-tab lock) resolves to UNVERIFIED, never hangs', async () => {
    vi.useFakeTimers();
    try {
      getSession.mockReturnValue(new Promise(() => {})); // never settles
      const p = getChoirAccess();
      await vi.advanceTimersByTimeAsync(8001);
      await expect(p).resolves.toMatchObject({ signedIn: true, canSee: false, unverified: true });
    } finally {
      vi.useRealTimers();
    }
  });
});

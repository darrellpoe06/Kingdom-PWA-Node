// @vitest-environment node
//
// church-team-sync — the church dev/ops team + the VIEW-ONLY tester guarantee
// (Darrell 2026-07-21). Pins: the team-role -> instance-role mapping (tester is
// viewer = read-only by RLS), the pure access decision (owner/admin manage;
// anyone on the team sees; a tester NEVER manages), and getTeamAccess's honest
// unverified path (a lapsed/hung session or an RPC error is UNVERIFIED, not a
// silent "not on the team"). Mirrors choir-access.test.js.
import { describe, it, expect, vi, beforeEach } from 'vitest';

const getSession = vi.fn();
const rpc = vi.fn();
vi.mock('../lib/supabase.js', () => ({ default: { auth: { getSession: (...a) => getSession(...a) }, rpc: (...a) => rpc(...a) } }));
vi.mock('../lib/church-instance.js', () => ({ churchInstanceId: async () => 'tenant-1' }));
vi.mock('../lib/choir-sync.js', () => ({ inviteToChurch: async () => ({ invited: true }) }));

import {
  teamRoleToInstanceRole, TEAM_ROLE_TO_INSTANCE_ROLE, deriveTeamAccess, getTeamAccess,
} from '../lib/church-team-sync.js';

describe('teamRoleToInstanceRole — tester is view-only (viewer), by covenant', () => {
  it('maps each team role to the instance role that grants its real access', () => {
    expect(teamRoleToInstanceRole('tester')).toBe('viewer'); // read-only by RLS
    expect(teamRoleToInstanceRole('dev')).toBe('member');
    expect(teamRoleToInstanceRole('ops')).toBe('member');
    expect(teamRoleToInstanceRole('lead')).toBe('admin');
  });
  it('an unknown role defaults to the safest (viewer)', () => {
    expect(teamRoleToInstanceRole('hacker')).toBe('viewer');
    expect(teamRoleToInstanceRole(undefined)).toBe('viewer');
  });
  it('the map itself never grants a tester more than viewer', () => {
    expect(TEAM_ROLE_TO_INSTANCE_ROLE.tester).toBe('viewer');
  });
});

describe('deriveTeamAccess — owner/admin manage; team members (incl. testers) only see', () => {
  it('owner/admin can manage AND see', () => {
    expect(deriveTeamAccess('owner', false)).toEqual({ canManage: true, canSee: true });
    expect(deriveTeamAccess('admin', false)).toEqual({ canManage: true, canSee: true });
  });
  it('a team member who is NOT owner/admin can see but NEVER manage', () => {
    expect(deriveTeamAccess('viewer', true)).toEqual({ canManage: false, canSee: true });
    expect(deriveTeamAccess('member', true)).toEqual({ canManage: false, canSee: true });
  });
  it('not on the team → neither see nor manage', () => {
    expect(deriveTeamAccess('viewer', false)).toEqual({ canManage: false, canSee: false });
    expect(deriveTeamAccess(null, false)).toEqual({ canManage: false, canSee: false });
  });
});

describe('getTeamAccess — honest access (unverified vs. not-on-team)', () => {
  beforeEach(() => { getSession.mockReset(); rpc.mockReset(); });
  const session = { data: { session: { user: { id: 'u1', email: 'bg@thechurchofthelivinggod.com' } } } };
  const rpcs = (role, onTeam, teamRole) => (name) =>
    Promise.resolve(name === 'user_role_in_instance' ? { data: role, error: null }
      : name === 'user_on_church_team' ? { data: onTeam, error: null }
        : { data: teamRole, error: null });

  it('an admin manages the team', async () => {
    getSession.mockResolvedValue(session);
    rpc.mockImplementation(rpcs('admin', true, null));
    expect(await getTeamAccess()).toMatchObject({ canSee: true, canManage: true, unverified: false });
  });
  it('a tester on the team sees but cannot manage', async () => {
    getSession.mockResolvedValue(session);
    rpc.mockImplementation(rpcs('viewer', true, 'tester'));
    expect(await getTeamAccess()).toMatchObject({ canSee: true, canManage: false, unverified: false, teamRole: 'tester' });
  });
  it('an RPC error is UNVERIFIED, never a silent "not on the team"', async () => {
    getSession.mockResolvedValue(session);
    rpc.mockImplementation((name) => name === 'user_on_church_team'
      ? Promise.resolve({ data: null, error: { message: 'boom' } })
      : Promise.resolve({ data: null, error: null }));
    expect(await getTeamAccess()).toMatchObject({ canSee: false, unverified: true });
  });
  it('not signed in → signedIn:false, not unverified', async () => {
    getSession.mockResolvedValue({ data: { session: null } });
    expect(await getTeamAccess()).toMatchObject({ signedIn: false, canSee: false, unverified: false });
  });
  it('a wedged getSession resolves to UNVERIFIED, never hangs', async () => {
    vi.useFakeTimers();
    try {
      getSession.mockReturnValue(new Promise(() => {}));
      const p = getTeamAccess();
      await vi.advanceTimersByTimeAsync(8001);
      await expect(p).resolves.toMatchObject({ canSee: false, unverified: true });
    } finally {
      vi.useRealTimers();
    }
  });
});

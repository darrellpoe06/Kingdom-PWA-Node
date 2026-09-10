// =============================================================================
// church-members — the pure half of the Love Corner Members tab (DR-0346)
// =============================================================================
// Every count is derived from rows; every may / may-not from the catalog the
// server enforces. These pin that the derivations never paint: a missing
// count is null, an owner is untouchable, extra rights read from the grants.
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

vi.mock('../lib/supabase.js', () => ({ supabase: { from: () => ({ select: () => ({ eq: async () => ({ data: [], error: null }) }) }) } }));
vi.mock('../lib/member-roles.js', async (orig) => ({
  ...(await orig()),
  listMyAdminInstances: async () => [],
  listInstanceMembersStrict: async () => [],
  listMemberCapabilities: async () => [],
}));
vi.mock('../lib/family-invite.js', async (orig) => ({ ...(await orig()), listPendingClaims: async () => ({ ok: true, claims: [] }) }));

import {
  rightsFor, countsByRole, groupByRole, openInvites, wayInSteps, pickChurchSpace, loadChurchGovernance, ROLE_ORDER, canRemove,
} from '../lib/church-members.js';
import { CAPABILITIES } from '../lib/member-roles.js';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('rightsFor — opportunities and constraints per person', () => {
  it('an owner may govern everything and may not be changed here', () => {
    const r = rightsFor('owner', [], 'u1');
    expect(r.may.join(' ')).toMatch(/Invite people and set any standing/);
    expect(r.mayNot.join(' ')).toMatch(/untouchable/);
    // the checklist never applies to an owner
    expect(r.mayNot.some((t) => t === CAPABILITIES[0].label)).toBe(false);
  });
  it('an admin may not make an admin, touch an owner, or set child/successor', () => {
    const r = rightsFor('admin', [], 'u1');
    expect(r.mayNot.join(' | ')).toMatch(/Make or change an admin/);
    expect(r.mayNot.join(' | ')).toMatch(/Touch an owner/);
    expect(r.mayNot.join(' | ')).toMatch(/child or successor/);
  });
  it('a member lists every extra right as MAY NOT until it is granted, then as MAY', () => {
    const none = rightsFor('member', [], 'u1');
    expect(none.mayNot).toEqual(expect.arrayContaining(CAPABILITIES.map((c) => c.label)));
    const some = rightsFor('member', [{ userId: 'u1', capability: 'write:choir' }, { userId: 'u9', capability: 'write:bus' }], 'u1');
    expect(some.may).toContain('Choir — edit (extra right)');
    expect(some.mayNot).not.toContain('Choir — edit');
    // another person's grant never leaks onto this person
    expect(some.may.join(' ')).not.toMatch(/Bus ministry/);
    expect(some.mayNot).toContain('Bus ministry — edit');
  });
  it('a viewer is read-only by the database; an unknown standing opens nothing', () => {
    expect(rightsFor('viewer', [], 'u1').mayNot.join(' ')).toMatch(/read-only, enforced by the database/);
    const r = rightsFor(null, [], 'u1');
    expect(r.may).toEqual([]);
    expect(r.mayNot[0]).toMatch(/No standing on record/);
  });
});

describe('countsByRole / groupByRole — the hierarchy, from rows', () => {
  const members = [
    { userId: 'a', role: 'owner' }, { userId: 'b', role: 'admin' }, { userId: 'c', role: 'member' },
    { userId: 'd', role: 'member' }, { userId: 'e', role: 'viewer' }, { userId: 'f', role: null },
  ];
  it('counts each standing and the total; a row with no standing is not a person counted', () => {
    const c = countsByRole(members);
    expect(c.owner).toBe(1); expect(c.admin).toBe(1); expect(c.member).toBe(2); expect(c.viewer).toBe(1);
    expect(c.child).toBe(0); expect(c.total).toBe(5);
    expect(countsByRole([]).total).toBe(0);
  });
  it('groups top-down in hierarchy order and puts the standing-less last', () => {
    const g = groupByRole(members);
    expect(g.map((x) => x.role)).toEqual(['owner', 'admin', 'member', 'viewer', 'other']);
    expect(g.find((x) => x.role === 'member').people.map((p) => p.userId)).toEqual(['c', 'd']);
    expect(ROLE_ORDER[0]).toBe('owner');
  });
});

describe('openInvites / wayInSteps — the join process with live numbers', () => {
  const now = Date.parse('2026-09-10T00:00:00Z');
  it('an invite is open only while unaccepted and unexpired', () => {
    const rows = [
      { id: 1, accepted_at: null, expires_at: '2026-09-20T00:00:00Z' },
      { id: 2, accepted_at: '2026-09-01T00:00:00Z', expires_at: '2026-09-20T00:00:00Z' },
      { id: 3, accepted_at: null, expires_at: '2026-09-01T00:00:00Z' },
      { id: 4, accepted_at: null, expires_at: null },
    ];
    expect(openInvites(rows, now).map((r) => r.id)).toEqual([1, 4]);
  });
  it('states the five steps in order with the count each step is measured by', () => {
    const steps = wayInSteps({ counts: countsByRole([{ role: 'owner' }, { role: 'admin' }, { role: 'member' }, { role: 'viewer' }]), invites: [{}, {}], claims: [{}] });
    expect(steps.map((s) => s.id)).toEqual(['leader', 'invite', 'signin', 'claim', 'govern']);
    expect(steps[0].count).toBe(2);   // owners + admins
    expect(steps[1].count).toBe(2);   // open invites
    expect(steps[2].count).toBe(4);   // people on the door
    expect(steps[3].count).toBe(1);   // claims waiting
    expect(steps[4].count).toBe(2);   // members + viewers adjustable
  });
  it('a count that cannot be read is null, never a painted zero (DR-0076)', () => {
    const steps = wayInSteps({});
    expect(steps.every((s) => s.count === null)).toBe(true);
  });
});

describe('pickChurchSpace / loadChurchGovernance — the gate is the real standing', () => {
  it('picks only a church space where I am owner or admin', () => {
    expect(pickChurchSpace([{ instanceType: 'family', role: 'owner' }])).toBeNull();
    expect(pickChurchSpace([{ instanceType: 'church', role: 'member' }])).toBeNull();
    expect(pickChurchSpace([{ instanceType: 'family', role: 'owner' }, { instanceType: 'church', role: 'admin', instanceId: 'c1' }]).instanceId).toBe('c1');
  });
  it('with no church space to govern, the load says so and reads no roster', async () => {
    const gov = await loadChurchGovernance();
    expect(gov.governs).toBe(false);
    expect(gov.members).toEqual([]);
  });
});

describe('canRemove — the mirror of remove_instance_member (0130)', () => {
  it('never an owner, never yourself, only an owner removes an admin, a member never removes', () => {
    expect(canRemove('owner', 'owner')).toBe(false);
    expect(canRemove('owner', 'admin')).toBe(true);
    expect(canRemove('admin', 'admin')).toBe(false);
    expect(canRemove('admin', 'member')).toBe(true);
    expect(canRemove('admin', 'viewer')).toBe(true);
    expect(canRemove('owner', 'member', { isSelf: true })).toBe(false);
    expect(canRemove('member', 'viewer')).toBe(false);
  });
});

describe('source pins — the door mounts the tab and the registry names it', () => {
  it('the shell mounts ChurchMembers on churchView === members and offers the tab to a signed-in person', () => {
    const shell = readFileSync(join(SRC, 'poe-financial-mvp-v28.jsx'), 'utf8');
    expect(shell).toContain("{view === 'church' && churchView === 'members' && <ChurchMembers />}");
    expect(shell).toMatch(/\.\.\.\(authSession \? \[\['members', <><UiIcon name="users" \/> Members<\/>\]\] : \[\]\)/);
  });
  it('the registry carries the surface with its real gate named', () => {
    const reg = readFileSync(join(SRC, 'surfaces.js'), 'utf8');
    expect(reg).toMatch(/id: 'church-members'.*sub: 'members'.*ChurchMembers\.jsx/);
  });
});

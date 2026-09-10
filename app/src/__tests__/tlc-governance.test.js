// =============================================================================
// The office's hierarchy as data, and the door's gates agreeing with it
// (DR-0346, 2026-09-10). Darrell: "Assistants and others need hierarchy for
// making sure we have appropriate governance and resources for our business"
// / "Owners and managers etc need to be able to govern using the same app."
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { TLC_POSITIONS, TLC_RESOURCES, positionForRole, resourcesFor, canReach, chainOfCommand, resourceMatrix } from '../lib/tlc-governance.js';
import { grantableRoles, ROLE_LABELS } from '../lib/member-roles.js';

const here = dirname(fileURLToPath(import.meta.url));
const src = (rel) => readFileSync(join(here, '..', rel), 'utf8');

describe('the seats, top down', () => {
  it('ten seats (eight office seats and the two standings before membership); every reportsTo names a seat above; the owner is the top; every seat’s role is a database role or none (the client)', () => {
    expect(TLC_POSITIONS).toHaveLength(10);
    const keys = TLC_POSITIONS.map((p) => p.key);
    for (const p of TLC_POSITIONS) {
      if (p.reportsTo) expect(keys.indexOf(p.reportsTo), p.key).toBeLessThan(keys.indexOf(p.key));
      expect(p.role === null || ROLE_LABELS[p.role], `${p.key} role ${p.role}`).toBeTruthy();
      expect(p.governs.length).toBeGreaterThan(30);
      expect(p.may.length).toBeGreaterThan(0);
      for (const r of p.resources) expect(TLC_RESOURCES.map((x) => x.id), `${p.key} reaches unknown ${r}`).toContain(r);
    }
    expect(TLC_POSITIONS[0].key).toBe('owner');
    expect(TLC_POSITIONS[0].reportsTo).toBeNull();
    expect(chainOfCommand('trainee').map((p) => p.key)).toEqual(['owner', 'supervisor']);
    expect(chainOfCommand('assistant').map((p) => p.key)).toEqual(['owner', 'admin']);
  });
  it('resources narrow down the chart: managers ⊇ staff ⊇ everyone; an assistant never reaches inquiries, revenue, packets or roles', () => {
    const owner = resourcesFor('owner'), admin = resourcesFor('admin'), member = resourcesFor('member'), assistant = resourcesFor('assistant'), viewer = resourcesFor('viewer'), client = resourcesFor(null);
    for (const r of admin) expect(owner).toContain(r);
    for (const r of member) expect(admin).toContain(r);
    for (const r of assistant) expect(member).toContain(r);
    expect(viewer).toEqual(assistant);
    expect(client).toEqual(assistant);
    for (const r of ['inquiries', 'revenue', 'growth', 'onboarding', 'team:governance', 'training:assign']) expect(canReach('assistant', r), r).toBe(false);
    expect(canReach('assistant', 'assistant')).toBe(true);
    expect(canReach('member', 'onboarding')).toBe(false);
    expect(canReach('admin', 'onboarding')).toBe(true);
    expect(canReach('owner', 'team:governance')).toBe(true);
    // an approved colleague without a membership row is staff (DR-0344 §7)
    expect(positionForRole(null, { approvedColleague: true }).key).toBe('therapist');
    expect(positionForRole(null).key).toBe('client');
    expect(resourceMatrix()).toHaveLength(TLC_RESOURCES.length);
  });
  it('the chart’s "may" mirrors the guarded role function: only an owner makes an admin; an admin moves member/viewer/assistant; no one edits an owner', () => {
    expect(grantableRoles('owner', 'member')).toContain('admin');
    expect(grantableRoles('admin', 'member')).not.toContain('admin');
    expect(grantableRoles('admin', 'admin')).toEqual([]);
    expect(grantableRoles('owner', 'owner')).toEqual([]);
    expect(grantableRoles('owner', 'member', { isSelf: true })).toEqual([]);
    expect(TLC_POSITIONS.find((p) => p.key === 'owner').may.join(' ')).toMatch(/only an owner may make or unmake an admin/);
    expect(TLC_POSITIONS.find((p) => p.key === 'admin').may.join(' ')).toMatch(/never admin/);
  });
});

describe('the door’s gates say what the chart says', () => {
  const door = src('components/TlcPublicDoor.jsx');
  const team = src('components/TlcTeamResources.jsx');
  const learn = src('components/PracticeLearn.jsx');
  it('office tabs for staff (owner/admin/member or an approved colleague); Onboarding and Governance for owner/admin only; assistants are not staff', () => {
    expect(door).toMatch(/const operatorRole = \['owner', 'admin', 'member'\]\.includes/);
    expect(door).toMatch(/const staff = operatorRole \|\| \(colleague && colleague\.status === 'approved'\)/);
    expect(door).toMatch(/canManageTeam\(roleState\) \? \[\{ id: 'onboarding'/);
    expect(team).toMatch(/roleState && canManageTeam\(roleState\) \? \{ id: 'governance'/);
    expect(team).toMatch(/staff \? \{ id: 'launch'/);
    expect(learn).toMatch(/isStaff && onAssign && <AssignLessonForm/);
  });
});

// Tests for grantableRoles — the pure UI mirror of the set_member_role guards
// (migration 0111 / DR-0220 Phase 3). If this drifts from the RPC, the UI would
// offer an option the backend rejects (or hide a valid one). Locks the mirror.
import { describe, it, expect } from 'vitest';
import { grantableRoles, canEditRole, roleLabel, isInviteEmail } from '../lib/member-roles.js';

describe('grantableRoles (mirror of set_member_role guards)', () => {
  it('an owner may set admin/member/viewer on a non-owner', () => {
    expect(grantableRoles('owner', 'member')).toEqual(['admin', 'member', 'viewer']);
    expect(grantableRoles('owner', 'viewer')).toEqual(['admin', 'member', 'viewer']);
    expect(grantableRoles('owner', 'admin')).toEqual(['admin', 'member', 'viewer']);
  });
  it('an owner is NEVER editable via this control (untouchable — no lockout)', () => {
    expect(grantableRoles('owner', 'owner')).toEqual([]);
    expect(grantableRoles('admin', 'owner')).toEqual([]);
  });
  it('an admin may only move a member between member<->viewer, never grant admin', () => {
    expect(grantableRoles('admin', 'member')).toEqual(['member', 'viewer']);
    expect(grantableRoles('admin', 'viewer')).toEqual(['member', 'viewer']);
  });
  it('an admin may NOT alter another admin (only an owner can)', () => {
    expect(grantableRoles('admin', 'admin')).toEqual([]);
  });
  it('a non-owner/admin has no control', () => {
    expect(grantableRoles('member', 'member')).toEqual([]);
    expect(grantableRoles('viewer', 'member')).toEqual([]);
    expect(grantableRoles(null, 'member')).toEqual([]);
  });
  it('no self-change', () => {
    expect(grantableRoles('owner', 'member', { isSelf: true })).toEqual([]);
    expect(grantableRoles('admin', 'member', { isSelf: true })).toEqual([]);
  });
  it("'owner' is never among the grantable options", () => {
    for (const target of ['member', 'viewer', 'admin']) {
      expect(grantableRoles('owner', target)).not.toContain('owner');
    }
  });
  it('canEditRole reflects grantableRoles', () => {
    expect(canEditRole('owner', 'member')).toBe(true);
    expect(canEditRole('admin', 'admin')).toBe(false);
    expect(canEditRole('owner', 'owner')).toBe(false);
    expect(canEditRole('member', 'member')).toBe(false);
  });
  it('isInviteEmail accepts real emails, rejects junk', () => {
    expect(isInviteEmail('person@email.com')).toBe(true);
    expect(isInviteEmail('  a@b.co ')).toBe(true);
    expect(isInviteEmail('')).toBe(false);
    expect(isInviteEmail('nope')).toBe(false);
    expect(isInviteEmail('a@b')).toBe(false);
    expect(isInviteEmail(null)).toBe(false);
  });
  it('roleLabel maps known roles and falls back gracefully', () => {
    // Surface-says-truth (DR-0241): labels state what the DB actually grants.
    // 'Member (view)' was a fiction — member reads AND writes; viewer is the
    // read-only role, enforced by the 0125 restrictive overlay.
    expect(roleLabel('admin')).toBe('Admin (edit + members)');
    expect(roleLabel('member')).toBe('Member (edit)');
    expect(roleLabel('viewer')).toBe('Viewer (read-only)');
    expect(roleLabel('owner')).toBe('Owner');
    expect(roleLabel('weird')).toBe('weird');
    expect(roleLabel(null)).toBe('no role');
  });
});

// The governance checklist (DR-0242 / 0126) — the pure mirror of
// set_member_capability's guards + the catalog the UI renders. If this drifts
// from the RPC's known-capability list, the UI offers a box the server rejects.
import { CAPABILITIES, capabilityLabel, canEditCapabilities } from '../lib/member-roles.js';

describe('governance checklist (mirror of set_member_capability, 0126)', () => {
  it('the catalog matches the RPC-known capability set exactly', () => {
    // Pinned to v_known in 0126-member-capability-checklist.sql — a drift here
    // means a checkbox the server rejects (or a server power with no surface).
    expect(CAPABILITIES.map((c) => c.key).sort()).toEqual([
      'invite:viewer',
      'write:bus', 'write:choir', 'write:content', 'write:crm',
      'write:events', 'write:inventory', 'write:property',
    ].sort());
  });
  it('keys are unique and every entry carries a label + note + group', () => {
    const keys = CAPABILITIES.map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const c of CAPABILITIES) {
      expect(c.label.length).toBeGreaterThan(3);
      expect(c.note.length).toBeGreaterThan(10);
      expect(['Governance', 'Areas']).toContain(c.group);
    }
  });
  it('no capability ever names the books core or role powers', () => {
    // DEFAULT DENY: the never-unlockable core has no checkbox at all.
    for (const c of CAPABILITIES) {
      expect(c.key).not.toMatch(/account|transaction|debt|entit|project|payment|role|admin|member(?!s)/);
    }
  });
  it('only an owner/admin edits the checklist, never for self or owner/admin targets', () => {
    expect(canEditCapabilities('owner', 'viewer')).toBe(true);
    expect(canEditCapabilities('owner', 'member')).toBe(true);
    expect(canEditCapabilities('admin', 'viewer')).toBe(true);
    expect(canEditCapabilities('admin', 'member')).toBe(true);
    expect(canEditCapabilities('member', 'viewer')).toBe(false);
    expect(canEditCapabilities('viewer', 'viewer')).toBe(false);
    expect(canEditCapabilities('owner', 'owner')).toBe(false);
    expect(canEditCapabilities('owner', 'admin')).toBe(false);
    expect(canEditCapabilities('owner', 'viewer', { isSelf: true })).toBe(false);
    expect(canEditCapabilities(null, 'viewer')).toBe(false);
  });
  it('capabilityLabel maps known keys and falls back to the key', () => {
    expect(capabilityLabel('invite:viewer')).toBe('May invite guests (read-only)');
    expect(capabilityLabel('write:choir')).toBe('Choir — edit');
    expect(capabilityLabel('write:unknown')).toBe('write:unknown');
  });
});

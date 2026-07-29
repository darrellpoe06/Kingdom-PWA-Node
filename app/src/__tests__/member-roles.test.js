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

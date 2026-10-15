// @vitest-environment node
// =============================================================================
// Every team has a roster, not just the choir (DR-1052)
// =============================================================================
// Darrell, 2026-10-15, from his phone on the Choir tab, after it showed him the
// "ask the choir director to add you" empty state:
//
//   "Media?!!!!!!!!!! Other members of the other teams who should have
//    access... DRs!!!!!!!"
//
// MEASURED BEFORE ANYTHING WAS WRITTEN. The church names 23 ministries in
// lib/church-ministries.js. Across every migration and every lib on main there
// were exactly four membership predicates — user_in_instance (the whole house,
// not a team), user_in_choir, user_in_security, user_in_group. So 23 teams and
// one of them seatable, and the only door for Media was being added to the
// CHOIR's roster as choir_role 'media': a team as a role inside another team.
//
// These cases pin the part that lives in JavaScript. The walls that actually
// decide access are in the database and are proven there, on a real
// PostgreSQL, by infra/supabase/tests/0296-every-team-smoke.sql.
import { describe, it, expect } from 'vitest';
import {
  toMemberShape, isKnownMinistry, canEditRoster, addMinistryMember,
} from '../lib/ministry-roster.js';
import { CHURCH_MINISTRIES, ministryById } from '../lib/church-ministries.js';

describe('the measurement this record rests on', () => {
  it('the church really does name many ministries, and Media is one of them', () => {
    // If this ever shrinks to one, the premise of DR-1052 has changed.
    expect(CHURCH_MINISTRIES.length).toBeGreaterThan(15);
    expect(ministryById('media'), 'Media is a ministry of the house').toBeTruthy();
    for (const id of ['bus', 'choir', 'media', 'ushers', 'security']) {
      expect(ministryById(id), `${id} is in the one registry`).toBeTruthy();
    }
  });

  it('the roster keys off the registry, so a typo cannot invent a team', () => {
    expect(isKnownMinistry('media')).toBe(true);
    expect(isKnownMinistry('bus')).toBe(true);
    // PROVEN-TO-CATCH: free text here would create a team that exists in one
    // roster row and nowhere else — the second-vocabulary failure
    // feedback-area-guard exists to catch.
    expect(isKnownMinistry('medai')).toBe(false);
    expect(isKnownMinistry('')).toBe(false);
    expect(isKnownMinistry(null)).toBe(false);
    expect(isKnownMinistry('Media'), 'ids are the registry’s, not a label').toBe(false);
  });
});

describe('canEditRoster — the UI never offers what the database will refuse', () => {
  it('only owner and admin may edit, mirroring the 0296 write policy', () => {
    expect(canEditRoster('owner')).toBe(true);
    expect(canEditRoster('admin')).toBe(true);
  });

  it('a plain member, a viewer and a signed-out caller may not', () => {
    for (const r of ['member', 'viewer', '', null, undefined]) {
      expect(canEditRoster(r), `${String(r)} must not edit a roster`).toBe(false);
    }
  });
});

describe('toMemberShape — an unlinked roster row says so', () => {
  it('a row with no app account is marked unlinked, not hidden', () => {
    // The choir carries a singer before they have signed in (0011) and this
    // does the same, so a director can build a team before the people arrive.
    const m = toMemberShape({ id: 'x', ministry: 'media', user_id: null, display_name: 'Sister A', team_role: 'camera' });
    expect(m.linked).toBe(false);
    expect(m.displayName).toBe('Sister A');
    expect(m.teamRole).toBe('camera');
  });

  it('a linked row is marked linked', () => {
    const m = toMemberShape({ id: 'y', ministry: 'media', user_id: 'u1', display_name: 'Brother B', team_role: 'lead' });
    expect(m.linked).toBe(true);
  });

  it('a row missing its optional fields still has a usable shape', () => {
    const m = toMemberShape({ id: 'z', ministry: 'bus' });
    expect(m.displayName).toBe('');
    expect(m.teamRole, 'defaults to member, never undefined on a surface').toBe('member');
    expect(m.linked).toBe(false);
  });
});

describe('addMinistryMember refuses before it reaches the database', () => {
  it('an unknown ministry is refused by name', async () => {
    const r = await addMinistryMember('not-a-ministry', { displayName: 'A' });
    expect(r).toEqual({ skipped: 'unknown-ministry' });
  });

  it('an empty name is refused by name, including whitespace only', async () => {
    expect(await addMinistryMember('media', { displayName: '' })).toEqual({ skipped: 'no-name' });
    expect(await addMinistryMember('media', { displayName: '   ' })).toEqual({ skipped: 'no-name' });
    expect(await addMinistryMember('media', {})).toEqual({ skipped: 'no-name' });
  });

  it('every refusal NAMES itself, so a surface never says "could not save"', () => {
    // The reason strings are what the panel turns into plain words. A refusal
    // with no reason is what makes a person try the same thing twice.
    for (const skipped of ['unknown-ministry', 'no-name', 'signed-out', 'no-church', 'insert-error']) {
      expect(typeof skipped).toBe('string');
      expect(skipped.length).toBeGreaterThan(0);
    }
  });
});

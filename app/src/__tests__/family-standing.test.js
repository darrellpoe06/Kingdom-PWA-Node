// @vitest-environment node
// =============================================================================
// An email can make you a member. Only a role can make you a governor.
// =============================================================================
// Darrell, 2026-10-19: "Why is my son a child and not others... Fix it... he
// gets access... we want them to learn by doing or helping and or witnessing
// our businesses."
//
// THE MEASURED DEFECT these cases hold shut. The shell decides identity from
// `isFamilyEmail`, a hardcoded email allowlist, and reads NO database role
// anywhere (0 hits for user_role_in_instance in poe-financial-mvp-v28.jsx).
// That one flag is read as membership, as Governor authority (`isGov` /
// `isGovernor`), and as financial visibility. Migration 0144 moved Darrell Jr
// to the 'child' role and raised the RLS wall, but his address stayed on the
// allowlist — so the client hands a minor the Governor surfaces while the
// database denies every row behind them.
//
// The first describe below is that exact situation, by name. If anyone ever
// lets an allowlist confer authority again, it fails here.
import { describe, it, expect } from 'vitest';
import {
  STANDING, roleStanding, isGovernorRole, readsBooks, writesRecords,
  standingInSpace, standingAcrossSpaces, standingSentence,
} from '../lib/family-standing.js';

describe('the son on the allowlist is NOT a governor (the 2026-08-23 exposure)', () => {
  it('allowlisted + child role -> a witness, never a governor', () => {
    const v = standingInSpace({ allowlisted: true, role: 'child' });
    expect(v.isGovernor).toBe(false);
    expect(v.standing).toBe(STANDING.WITNESS);
    expect(v.isMember).toBe(true);        // he IS in the family — that is the point
    expect(v.source).toBe('role');        // the role decided it, not the address
  });

  it('the database wall is mirrored, not contradicted: a child sees no books', () => {
    expect(standingInSpace({ allowlisted: true, role: 'child' }).canSeeBooks).toBe(false);
    expect(standingInSpace({ allowlisted: true, role: 'child' }).canWrite).toBe(false);
  });

  it('PROVEN-TO-CATCH: the OLD rule (the address decides) calls the same person a governor', () => {
    // Not an assertion about the new code — this pins the DEFECT, so a
    // regression that reverts to the allowlist cannot pass quietly.
    const oldRule = (allowlisted) => ({ isGovernor: !!allowlisted });
    expect(oldRule(true).isGovernor).toBe(true);
    expect(standingInSpace({ allowlisted: true, role: 'child' }).isGovernor).toBe(false);
  });

  it('no role on the allowlist can ever be a governor except a governing role', () => {
    for (const role of ['child', 'successor', 'viewer', 'assistant', 'member', 'specialist']) {
      expect(standingInSpace({ allowlisted: true, role }).isGovernor, `${role} must not govern`).toBe(false);
    }
    for (const role of ['owner', 'admin']) {
      expect(standingInSpace({ allowlisted: false, role }).isGovernor, `${role} governs`).toBe(true);
    }
  });
});

describe('the roles mirror the RLS that is the real wall', () => {
  it('maps every role the instance_members CHECK allows', () => {
    // 0082 widened the constraint to this exact set; a role the model does not
    // know would silently become 'none', so the list is pinned.
    for (const role of ['owner', 'admin', 'member', 'viewer', 'specialist', 'child', 'successor', 'assistant']) {
      expect(roleStanding(role), `${role} is unmapped`).not.toBe(STANDING.NONE);
    }
  });

  it('books: child and assistant are walled; successor and viewer read', () => {
    expect(readsBooks('child')).toBe(false);       // 0082 read policy
    expect(readsBooks('assistant')).toBe(false);   // 0202/0203 role wall
    expect(readsBooks('successor')).toBe(true);    // 0082: successor reads
    expect(readsBooks('viewer')).toBe(true);
    expect(readsBooks('member')).toBe(true);
  });

  it('writes: child and successor cannot; member and owner can', () => {
    expect(writesRecords('child')).toBe(false);
    expect(writesRecords('successor')).toBe(false); // 0082 write CHECK
    expect(writesRecords('member')).toBe(true);
    expect(writesRecords('owner')).toBe(true);
  });

  it('an unknown or empty role is nobody, not somebody', () => {
    for (const bad of ['', null, undefined, 'governor', 'parent', 'xyz']) {
      expect(roleStanding(bad)).toBe(STANDING.NONE);
      expect(isGovernorRole(bad)).toBe(false);
    }
  });
});

describe('the owner is never locked out by a failed role read', () => {
  it('no role known + allowlisted -> exactly today behavior', () => {
    const v = standingInSpace({ allowlisted: true, role: null });
    expect(v.isGovernor).toBe(true);
    expect(v.canSeeBooks).toBe(true);
    expect(v.roleKnown).toBe(false);
    expect(v.source).toBe('allowlist-fallback');   // named, so it is visible in a trace
  });

  it('no role known + not allowlisted -> nothing granted', () => {
    const v = standingInSpace({ allowlisted: false, role: null });
    expect(v.isMember).toBe(false);
    expect(v.isGovernor).toBe(false);
    expect(v.source).toBe('none');
  });

  it('the fallback is the ONLY path that grants without a role', () => {
    // Every known role answers from the role; only the unknown-role path can
    // reach the allowlist branch. This is what keeps the hole from reopening.
    for (const role of ['owner', 'admin', 'member', 'child', 'successor', 'viewer', 'assistant', 'specialist']) {
      expect(standingInSpace({ allowlisted: true, role }).source).toBe('role');
    }
  });
});

describe('witness at home, helper in the business — per space, on one sign-in', () => {
  const memberships = [
    { instanceId: 'fam', name: 'Poe Family', role: 'child' },
    { instanceId: 'props', name: 'Poe Properties', role: 'member' },
  ];

  it('one person holds a different standing in each space', () => {
    const out = standingAcrossSpaces(memberships, { allowlisted: true });
    expect(out.witnesses).toEqual(['fam']);
    expect(out.helps).toEqual(['props']);
    expect(out.governs).toEqual([]);
    expect(out.anyGovernor).toBe(false);
  });

  it('helping in the business does not open the household books', () => {
    const out = standingAcrossSpaces(memberships, { allowlisted: true });
    const fam = out.spaces.find((s) => s.instanceId === 'fam');
    const props = out.spaces.find((s) => s.instanceId === 'props');
    expect(fam.canSeeBooks).toBe(false);   // still the child wall at home
    expect(props.canWrite).toBe(true);     // and real work in the business
  });

  it('rows without an instance are dropped rather than guessed at', () => {
    expect(standingAcrossSpaces([null, {}, { role: 'owner' }]).spaces).toEqual([]);
  });
});

describe('the sentence says what the person HOLDS, never "denied"', () => {
  it('names witnessing, helping and governing in his own frame', () => {
    expect(standingSentence(standingInSpace({ role: 'owner' }), 'Poe Properties')).toMatch(/You govern/);
    expect(standingSentence(standingInSpace({ role: 'member' }), 'Poe Properties')).toMatch(/You help/);
    expect(standingSentence(standingInSpace({ role: 'child' }), 'Poe Family')).toMatch(/witnessing/);
  });

  it('a walled child is told where the money is, not that he failed', () => {
    const s = standingSentence(standingInSpace({ role: 'child' }), 'Poe Family');
    expect(s).toContain('the money stays with the stewards');
    expect(s).not.toMatch(/denied|forbidden|not allowed|no access/i);
  });

  it('a non-member is told plainly, with the space named', () => {
    expect(standingSentence(standingInSpace({ role: null }), 'Poe Properties'))
      .toBe('You are not in Poe Properties yet.');
  });
});

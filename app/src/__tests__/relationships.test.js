// relationships.test.js — the relationship/permission model is the source of
// truth for "can this role do X?" These tests pin the can/can't matrix, the
// child-safety ceiling (a guardian cannot grant past it), and the no-leak default
// (an unnamed capability is deny).
import { describe, it, expect } from 'vitest';
import {
  RELATIONSHIP_TYPES,
  RELATIONSHIPS,
  CAPABILITIES,
  CHILD_CAPABILITY_POLICY,
  CHILD_CAPABILITIES,
  SETTING,
  can,
  requiresApproval,
  decide,
  clampSetting,
  resolveChildCapability,
  effectiveChildPolicy,
  isChildCapabilityLocked,
  buildMatrix,
  capabilitiesFor,
} from '../lib/relationships.js';

const REL = RELATIONSHIP_TYPES;

describe('relationship types', () => {
  it('defines the three relationships with steward + roles', () => {
    expect(RELATIONSHIPS.map((r) => r.type).sort()).toEqual(
      [REL.FAMILY, REL.GUARDIAN_CHILD, REL.LANDLORD_TENANT].sort(),
    );
    for (const r of RELATIONSHIPS) {
      expect(r.roles.length).toBeGreaterThanOrEqual(2);
      expect(r.roles).toContain(r.steward); // the configuring side is a real role
    }
  });
});

describe('landlord <-> tenant matrix', () => {
  it('tenant sees their unit + the four workflows, NEVER the portfolio', () => {
    expect(can(REL.LANDLORD_TENANT, 'tenant', 'lease.view')).toBe(true);
    expect(can(REL.LANDLORD_TENANT, 'tenant', 'rent.initiate')).toBe(true);
    expect(can(REL.LANDLORD_TENANT, 'tenant', 'maintenance.submit')).toBe(true);
    expect(can(REL.LANDLORD_TENANT, 'tenant', 'notice.view')).toBe(true);
    expect(can(REL.LANDLORD_TENANT, 'tenant', 'message.landlord')).toBe(true);
    // No-leak: the portfolio + lease management + rent roll are landlord-only.
    expect(can(REL.LANDLORD_TENANT, 'tenant', 'portfolio.view')).toBe(false);
    expect(can(REL.LANDLORD_TENANT, 'tenant', 'rentroll.view')).toBe(false);
    expect(can(REL.LANDLORD_TENANT, 'tenant', 'lease.manage')).toBe(false);
  });

  it('landlord manages their side; cannot do tenant-only verbs by omission', () => {
    expect(can(REL.LANDLORD_TENANT, 'landlord', 'rentroll.view')).toBe(true);
    expect(can(REL.LANDLORD_TENANT, 'landlord', 'maintenance.manage')).toBe(true);
    expect(can(REL.LANDLORD_TENANT, 'landlord', 'rent.confirm')).toBe(true);
    expect(can(REL.LANDLORD_TENANT, 'landlord', 'notice.post')).toBe(true);
    expect(can(REL.LANDLORD_TENANT, 'landlord', 'tenant.contact')).toBe(true);
    // not granted -> deny by omission (no-leak default)
    expect(can(REL.LANDLORD_TENANT, 'landlord', 'rent.initiate')).toBe(false);
  });
});

describe('guardian <-> child: child-safety is structural', () => {
  it('child-safe defaults: learn/scripture/game allowed, outbound + money not', () => {
    expect(can(REL.GUARDIAN_CHILD, 'child', 'learn.read')).toBe(true);
    expect(can(REL.GUARDIAN_CHILD, 'child', 'scripture.read')).toBe(true);
    expect(can(REL.GUARDIAN_CHILD, 'child', 'game.play')).toBe(true);
    // outbound + money + finance default to NOT allowed
    expect(can(REL.GUARDIAN_CHILD, 'child', 'message.outbound')).toBe(false);
    expect(can(REL.GUARDIAN_CHILD, 'child', 'purchase.any')).toBe(false);
    expect(can(REL.GUARDIAN_CHILD, 'child', 'finance.view')).toBe(false);
  });

  it('a guardian CANNOT grant a locked capability past its safety ceiling', () => {
    const reckless = {
      'purchase.any': SETTING.ALLOW,
      'content.unrated': SETTING.ALLOW,
      'account.security': SETTING.ALLOW,
    };
    // Every one is clamped back to deny — the guardian cannot configure unsafe.
    expect(can(REL.GUARDIAN_CHILD, 'child', 'purchase.any', reckless)).toBe(false);
    expect(can(REL.GUARDIAN_CHILD, 'child', 'content.unrated', reckless)).toBe(false);
    expect(can(REL.GUARDIAN_CHILD, 'child', 'account.security', reckless)).toBe(false);
    for (const cap of ['purchase.any', 'content.unrated', 'account.security']) {
      expect(isChildCapabilityLocked(cap)).toBe(true);
    }
  });

  it("money VISIBILITY is the guardian's decision (DR-0094): default deny, grantable — spending stays locked", () => {
    // Darrell 2026-07-03: "I do want the guardian to make that decision — I
    // want to make sure my kids can see how money actually works, education
    // before they need it." The default is still the child-safe deny (a
    // per-child, deliberate opt-in)…
    expect(can(REL.GUARDIAN_CHILD, 'child', 'finance.view')).toBe(false);
    expect(isChildCapabilityLocked('finance.view')).toBe(false);
    // …but the guardian's grant now HOLDS instead of being clamped away:
    expect(can(REL.GUARDIAN_CHILD, 'child', 'finance.view', { 'finance.view': SETTING.ALLOW })).toBe(true);
    expect(resolveChildCapability('finance.view', { 'finance.view': SETTING.APPROVAL })).toBe(SETTING.APPROVAL);
    // Seeing is not spending — the same grant does NOT loosen purchase.any:
    expect(can(REL.GUARDIAN_CHILD, 'child', 'purchase.any', { 'finance.view': SETTING.ALLOW, 'purchase.any': SETTING.ALLOW })).toBe(false);
  });

  it('outbound message can be UP TO approval-gated, never free-allowed', () => {
    // ask for allow -> clamped to approval (the maxGrant)
    expect(resolveChildCapability('message.outbound', { 'message.outbound': SETTING.ALLOW })).toBe(SETTING.APPROVAL);
    expect(can(REL.GUARDIAN_CHILD, 'child', 'message.outbound', { 'message.outbound': SETTING.ALLOW })).toBe(false);
    expect(requiresApproval(REL.GUARDIAN_CHILD, 'child', 'message.outbound', { 'message.outbound': SETTING.ALLOW })).toBe(true);
  });

  it('a guardian CAN open up an unlocked capability they choose to', () => {
    expect(can(REL.GUARDIAN_CHILD, 'child', 'message.family', { 'message.family': SETTING.ALLOW })).toBe(true);
    // and can tighten it back to deny
    expect(can(REL.GUARDIAN_CHILD, 'child', 'message.family', { 'message.family': SETTING.DENY })).toBe(false);
  });
});

describe('family circle: successor is read-only on the books (DR-0111)', () => {
  // Darrell 2026-07-06: a steward-in-training being raised to take over. The
  // staged middle rung — SEES the real books to learn on them, but cannot change
  // them. Read, don't wreck.
  it('a successor SEES the family finances (finance.view)', () => {
    expect(can(REL.FAMILY, 'successor', 'finance.view')).toBe(true);
    expect(can(REL.FAMILY, 'successor', 'family.shared')).toBe(true);
  });

  it('a successor CANNOT work the books, build, or manage members', () => {
    expect(can(REL.FAMILY, 'successor', 'finance.manage')).toBe(false);
    expect(can(REL.FAMILY, 'successor', 'family.build')).toBe(false);
    expect(can(REL.FAMILY, 'successor', 'family.manage')).toBe(false);
  });

  it('the read-only cut is the ONLY difference from a member: a member can work the books, a successor cannot', () => {
    // Both see the books…
    expect(can(REL.FAMILY, 'member', 'finance.view')).toBe(true);
    expect(can(REL.FAMILY, 'successor', 'finance.view')).toBe(true);
    // …but only the member can change them. That gap IS the succession-safety.
    expect(can(REL.FAMILY, 'member', 'finance.manage')).toBe(true);
    expect(can(REL.FAMILY, 'successor', 'finance.manage')).toBe(false);
  });

  it('a governor can both see and work the books', () => {
    expect(can(REL.FAMILY, 'governor', 'finance.view')).toBe(true);
    expect(can(REL.FAMILY, 'governor', 'finance.manage')).toBe(true);
  });
});

describe('clamp + resolve primitives', () => {
  it('clampSetting never exceeds the ceiling; unknown -> deny', () => {
    expect(clampSetting(SETTING.ALLOW, SETTING.APPROVAL)).toBe(SETTING.APPROVAL);
    expect(clampSetting(SETTING.APPROVAL, SETTING.ALLOW)).toBe(SETTING.APPROVAL);
    expect(clampSetting(SETTING.ALLOW, SETTING.DENY)).toBe(SETTING.DENY);
    expect(clampSetting('garbage', SETTING.ALLOW)).toBe(SETTING.DENY);
  });
  it('effectiveChildPolicy resolves every child capability with metadata', () => {
    const eff = effectiveChildPolicy({});
    expect(Object.keys(eff).sort()).toEqual([...CHILD_CAPABILITIES].sort());
    for (const cap of CHILD_CAPABILITIES) {
      expect(eff[cap].setting).toBe(CHILD_CAPABILITY_POLICY[cap].default);
      expect(eff[cap].meta).toBeTruthy();
    }
  });
});

describe('decide() guards and no-leak', () => {
  it('unknown relationship / role / capability all deny safely', () => {
    expect(decide({ relationship: 'nope', role: 'tenant', capability: 'lease.view' }).allowed).toBe(false);
    expect(decide({ relationship: REL.LANDLORD_TENANT, role: 'ghost', capability: 'lease.view' }).allowed).toBe(false);
    expect(decide({ relationship: REL.LANDLORD_TENANT, role: 'tenant', capability: 'no.such.cap' }).allowed).toBe(false);
  });
  it('a child role rejects capabilities that are not child-eligible', () => {
    const d = decide({ relationship: REL.GUARDIAN_CHILD, role: 'child', capability: 'rentroll.view' });
    expect(d.allowed).toBe(false);
    expect(d.reason).toMatch(/child/);
  });
  it('every capability named in the matrix exists in the registry', () => {
    for (const rel of RELATIONSHIPS) {
      for (const role of rel.roles) {
        for (const cap of capabilitiesFor(rel.type, role)) {
          expect(CAPABILITIES[cap], `capability ${cap} missing from registry`).toBeTruthy();
        }
      }
    }
  });
});

describe('buildMatrix', () => {
  it('produces verdict rows for every relationship/role/capability', () => {
    const rows = buildMatrix();
    expect(rows.length).toBeGreaterThan(20);
    // family governor builds; member does not
    const govBuild = rows.find((r) => r.role === 'governor' && r.capability === 'family.build');
    const memBuild = rows.find((r) => r.role === 'member' && r.capability === 'family.build');
    expect(govBuild.allowed).toBe(true);
    expect(memBuild.allowed).toBe(false);
    // a configurable child row is flagged configurable; a locked one is not
    const childMsg = rows.find((r) => r.role === 'child' && r.capability === 'message.family');
    const childBuy = rows.find((r) => r.role === 'child' && r.capability === 'purchase.any');
    expect(childMsg.configurable).toBe(true);
    expect(childBuy.configurable).toBe(false);
  });
});

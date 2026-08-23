// =============================================================================
// The dangerous door gets its gate: the family allowlist is FROZEN (0144)
// =============================================================================
// How the 2026-08-23 finding happened: DR-0093 (07-03) decided children join
// through the safety rails, never the email allowlist — "the dangerous door"
// that unlocks all family financials and the imported feed. Two days later,
// migration 0080 (07-05) added the son's email to that allowlist anyway, and
// nothing machine-checked the bright line, so the contradiction lived for
// seven weeks until Darrell's own screenshot caught it. Darrell 2026-08-23:
// "how did this happen and how can we safeguard?"
//
// The safeguard, structural (DR-0076 §2 — every looked-fine-but-wasn't class
// becomes a gate): the allowlist is frozen to EXACTLY the emails below, in
// BOTH layers (the DB founder allowlist and the client family map). Adding
// any email fails CI until this list is consciously edited in the same
// change — which makes every future addition a reviewed decision citing its
// DR, never a quiet edit. Access for new relatives flows through the paved
// paths instead: invites + Role & stewards standings (uncle, aunt,
// brother-in-law — set to any decided standing at will, 0144), and minors
// through the FamilyRoster child rails (DR-0093).
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS = join(HERE, '..', '..', '..', 'infra', 'supabase', 'migrations-auto');

// The frozen family allowlist — the COMPLETE set, an addition is a decision.
const FROZEN_ALLOWLIST = [
  'darrellpoe06@gmail.com',
  'mrspoe06@gmail.com',
  'christina@tlctherapysolutions.com',
  'darrellpoejr@gmail.com',
  '15636502416@phone.poetech.us',
].sort();

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;

// The active provisioning function — same selection the tenancy guard uses.
function activeProvisioningSql() {
  const defining = readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith('.sql'))
    .filter((f) => /CREATE OR REPLACE FUNCTION\s+public\.join_default_instance/i.test(readFileSync(join(MIGRATIONS, f), 'utf8')))
    .sort();
  return readFileSync(join(MIGRATIONS, defining[defining.length - 1]), 'utf8');
}

// Emails inside the founder-allowlist IF block of the provisioning function.
export function allowlistEmails(sql) {
  const m = sql.match(/IF v_user_email IN \(([\s\S]*?)\)/);
  return m ? Array.from(new Set((m[1].match(EMAIL_RE) || []).map((e) => e.toLowerCase()))).sort() : [];
}

describe('the family allowlist is frozen in both layers', () => {
  it('DB layer: the founder allowlist is EXACTLY the frozen set', () => {
    expect(allowlistEmails(activeProvisioningSql())).toEqual(FROZEN_ALLOWLIST);
  });

  it('client layer: FAMILY_EMAIL_PROFILES keys are a subset of the frozen set', () => {
    const src = readFileSync(join(HERE, '..', 'poe-financial-mvp-v28.jsx'), 'utf8');
    const block = src.match(/FAMILY_EMAIL_PROFILES\s*=\s*\{([\s\S]*?)\}/);
    expect(block).toBeTruthy();
    const emails = Array.from(new Set((block[1].match(EMAIL_RE) || []).map((e) => e.toLowerCase())));
    const strangers = emails.filter((e) => !FROZEN_ALLOWLIST.includes(e));
    expect(strangers, `emails outside the frozen allowlist: ${strangers.join(', ')}`).toEqual([]);
  });

  it('PROVEN-TO-CATCH: a smuggled email is detected by the extractor', () => {
    const tampered = "IF v_user_email IN (\n 'darrellpoe06@gmail.com',\n 'intruder@example.com'\n) THEN";
    expect(allowlistEmails(tampered)).toContain('intruder@example.com');
    expect(allowlistEmails(tampered)).not.toEqual(FROZEN_ALLOWLIST);
  });
});

describe('0144 — standings at will, and the son\'s wall', () => {
  const sql = readFileSync(join(MIGRATIONS, '0144-standings-at-will-and-the-sons-wall.sql'), 'utf8');
  const code = sql.replace(/--.*$/gm, '');

  it('set_member_role speaks the whole standing vocabulary', () => {
    expect(code).toMatch(/v_role NOT IN \('admin','member','viewer','assistant','successor','child'\)/);
  });

  it('the protective standings are the owner\'s hand alone, and the gate is NULL-safe', () => {
    expect(code).toMatch(/\(v_role IN \('child','successor'\) OR v_target\.role IN \('child','successor'\)\) AND v_actor_role <> 'owner'/);
    expect(code).toMatch(/coalesce\(user_role_in_instance\(instance_uuid\), ''\)/);
  });

  it('the son\'s standing becomes child in the family space — by email, guarded, idempotent', () => {
    expect(code).toMatch(/SET role = 'child'/);
    expect(code).toMatch(/i\.slug = 'poe-family'/);
    expect(code).toMatch(/u\.email = 'darrellpoejr@gmail\.com'/);
    expect(code).toMatch(/im\.role <> 'child'/);
  });

  it('PUBLIC execute revoked; the change is audit-logged', () => {
    expect(code).toMatch(/REVOKE ALL ON FUNCTION public\.set_member_role\(uuid, uuid, text\) FROM PUBLIC/);
    expect(code).toMatch(/INSERT INTO audit_log/);
  });
});

describe('0144 — relationship, the label that grows', () => {
  const sql2 = readFileSync(join(MIGRATIONS, '0144-standings-at-will-and-the-sons-wall.sql'), 'utf8');
  const code2 = sql2.replace(/--.*$/gm, '');

  it('free text with a length cap only — no value whitelist (it must grow)', () => {
    expect(code2).toMatch(/relationship IS NULL OR length\(relationship\) <= 40/);
    expect(code2).not.toMatch(/relationship IN \(/);
  });

  it('the setter is owner/admin-gated, NULL-safe, empty clears', () => {
    expect(code2).toMatch(/set_member_relationship: only an owner\/admin can set relationships/);
    expect(code2).toMatch(/UPDATE instance_members SET relationship = NULLIF\(v_rel, ''\)/);
    expect(code2).toMatch(/REVOKE ALL ON FUNCTION public\.set_member_relationship\(uuid, uuid, text\) FROM PUBLIC/);
  });

  it('the roster returns relationship and the surface renders it as a growing input', () => {
    expect(code2).toMatch(/RETURNS TABLE \(user_id uuid, display_name text, email text, role text, classification text, relationship text\)/);
    const src = readFileSync(join(HERE, '..', 'components', 'AdminConsole.jsx'), 'utf8');
    expect(src).toMatch(/list="rel-suggestions"/);
    expect(src).toMatch(/changeMemberRelationship\(m\.userId, e\.target\.value\)/);
    const lib = readFileSync(join(HERE, '..', 'lib', 'member-roles.js'), 'utf8');
    expect(lib).toMatch(/RELATIONSHIP_SUGGESTIONS/);
  });
});

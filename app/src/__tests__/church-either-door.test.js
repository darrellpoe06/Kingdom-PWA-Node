// =============================================================================
// DR-1043 — the church knows one person at either door (0294)
// =============================================================================
// Darrell 2026-10-15 at his phone door: "Signed in as
// 15636502416@phone.poetech.us. No church space answered for this account."
// The owner was refused his own order of service because the church join read
// ONE address. These pins hold 0294's shape, read off disk with comments
// stripped so prose can neither satisfy nor violate a rule. The behaviour is
// proven by infra/supabase/tests/0294-church-either-door-smoke.sql on the live
// database (rls-isolation, choir-claim leg).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const MIG = join(ROOT, 'infra', 'supabase', 'migrations-auto', '0294-the-church-knows-one-person-at-either-door.sql');
const SMOKE = join(ROOT, 'infra', 'supabase', 'tests', '0294-church-either-door-smoke.sql');
const ISO = join(ROOT, '.github', 'workflows', 'rls-isolation.yml');
const strip = (s) => s.replace(/--.*$/gm, '');
const code = strip(readFileSync(MIG, 'utf8'));

// The rules 0294 must keep, as predicates over its executable text.
const rules = {
  sameContract: (c) => /CREATE OR REPLACE FUNCTION public\.join_church_instance\(display_name_in text DEFAULT NULL\)\s*\nRETURNS uuid\s*\nLANGUAGE plpgsql SECURITY DEFINER\s*\nSET search_path = public, auth/.test(c),
  readsTheLink: (c) => /JOIN person_links pl/.test(c) && /pl\.door_user\s+= v_user_id AND pl\.primary_user = im\.user_id/.test(c),
  allowlistOnEveryAddress: (c) => /WHERE a\.email = ANY \(v_emails\)/.test(c),
  invitesOnEveryAddress: (c) => /lower\(inv\.email\) = ANY \(v_emails\)/.test(c),
  allowlistUnchanged: (c) => ['darrellpoe06@gmail.com', 'mrspoe06@gmail.com', 'christina@tlctherapysolutions.com', 'bg@thechurchofthelivinggod.com']
    .every((e) => c.includes(`'${e}'`)) && (c.match(/@[a-z.]+\.(com|org)'/g) || []).length === 4,
  onlyOwnerIsOwner: (c) => /\('darrellpoe06@gmail\.com',\s*'owner', 0\)/.test(c) && (c.match(/'owner',\s*\d\)/g) || []).length === 1,
  ownSeatFirst: (c) => c.indexOf('v_existing IS NOT NULL') > -1 && c.indexOf('v_existing IS NOT NULL') < c.indexOf('JOIN person_links pl'),
  neverNamedByDigits: (c) => /WHERE e NOT LIKE '%@phone\.poetech\.us'/.test(c),
  deletesNothing: (c) => !/^\s*DELETE FROM|DROP TABLE|TRUNCATE/im.test(c),
  writesNoLink: (c) => !/INSERT INTO person_links|UPDATE person_links|CREATE POLICY/i.test(c),
  idempotentSeat: (c) => /ON CONFLICT \(instance_id, user_id\) DO NOTHING/.test(c),
};

describe('0294 — the church join honours person_links', () => {
  for (const [name, rule] of Object.entries(rules)) {
    it(name, () => expect(rule(code), name).toBe(true));
  }

  it('proven to catch: the 0014 join it replaces fails the link and every-address rules', () => {
    const old = strip(readFileSync(join(ROOT, 'infra', 'supabase', 'migrations-auto', '0014-church-invite-onboarding.sql'), 'utf8'));
    expect(rules.readsTheLink(old)).toBe(false);
    expect(rules.allowlistOnEveryAddress(old)).toBe(false);
    expect(rules.invitesOnEveryAddress(old)).toBe(false);
  });

  it('proven to catch: a second owner smuggled into the allowlist fails', () => {
    const tampered = code.replace("('mrspoe06@gmail.com',                 'admin', 1)", "('mrspoe06@gmail.com', 'owner', 1)");
    expect(tampered).not.toBe(code);
    expect(rules.onlyOwnerIsOwner(tampered)).toBe(false);
  });

  it('proven to catch: a link written by the join fails', () => {
    expect(rules.writesNoLink(code + "\nINSERT INTO person_links VALUES (auth.uid(), auth.uid());")).toBe(false);
  });
});

describe('0294 — the live proof is wired', () => {
  const smoke = readFileSync(SMOKE, 'utf8');
  const iso = readFileSync(ISO, 'utf8');

  it('the smoke covers the door, the invite, the stranger and the unlinked door, and rolls back', () => {
    expect(smoke).toMatch(/^BEGIN;/m);
    expect(smoke).toMatch(/^ROLLBACK;/m);
    expect(smoke).toMatch(/RAISE NOTICE 'CHURCH EITHER DOOR SMOKE: PASS'/);
    for (const who of ['the linked door joined', 'invited door joined', 'a stranger joined', 'a door with no standing joined']) {
      expect(smoke).toContain(who);
    }
  });

  it('the smoke never inserts a real allowlisted address (it runs on the live database)', () => {
    for (const e of ['darrellpoe06@gmail.com', 'mrspoe06@gmail.com', 'christina@tlctherapysolutions.com', 'bg@thechurchofthelivinggod.com', '15636502416']) {
      expect(smoke).not.toContain(e);
    }
  });

  it('the choir-claim isolation leg applies 0294 and runs its smoke', () => {
    const leg = iso.slice(iso.indexOf('- feature: choir-claim'), iso.indexOf('- feature:', iso.indexOf('- feature: choir-claim') + 5));
    expect(leg).toContain('0294-the-church-knows-one-person-at-either-door.sql');
    expect(leg).toContain('0294-church-either-door-smoke.sql');
  });
});

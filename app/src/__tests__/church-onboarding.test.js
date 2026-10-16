// =============================================================================
// church-onboarding.test.js — 0297's contract, pinned at the source (DR-1066)
// =============================================================================
// The smoke proves the walls on a real PostgreSQL (ci.yml church-onboarding;
// rls-isolation choir-claim on the live database). This file pins what a
// reviewer must be able to see in the migration text itself, so a later edit
// cannot quietly widen a grant, drop the steward gate, or change the join's
// signature (which would create an ambiguous overload beside 0294's).
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const MIG_NAME = '0297-a-church-is-added-by-a-form-not-a-migration.sql';
const SMOKE_NAME = '0297-church-onboarding-smoke.sql';
const MIG = join(ROOT, 'infra', 'supabase', 'migrations-auto', MIG_NAME);
const SMOKE = join(ROOT, 'infra', 'supabase', 'tests', SMOKE_NAME);
const ISO = join(ROOT, '.github', 'workflows', 'rls-isolation.yml');
const CI = join(ROOT, '.github', 'workflows', 'ci.yml');
const BOOT = join(ROOT, 'scripts', 'church-onboarding-ci-bootstrap.sql');
const strip = (s) => s.replace(/--.*$/gm, '');
const code = strip(readFileSync(MIG, 'utf8'));
const smoke = readFileSync(SMOKE, 'utf8');
const iso = readFileSync(ISO, 'utf8');
const ci = readFileSync(CI, 'utf8');

const rules = {
  // The join keeps 0294's exact signature and return type: a second overload
  // would make supabase.rpc('join_church_instance', { display_name_in }) ambiguous.
  joinSameSignature: (c) => /CREATE OR REPLACE FUNCTION public\.join_church_instance\(display_name_in text DEFAULT NULL\)\s*\nRETURNS uuid\s*\nLANGUAGE plpgsql SECURITY DEFINER\s*\nSET search_path = public, auth/.test(c),
  joinNoSecondOverload: (c) => (c.match(/FUNCTION public\.join_church_instance\(/g) || []).length === 2 /* CREATE + GRANT */,
  // The leader list is rows now — no VALUES list of addresses inside the join.
  joinReadsRows: (c) => /FROM church_leaders cl/.test(c) && /WHERE cl\.email = ANY \(v_emails\)/.test(c),
  joinHasNoHardcodedSlug: (c) => !/SELECT id INTO v_instance_id FROM instances WHERE slug = 'colg'/.test(c),
  // COLG's four leaders are seeded as rows, verbatim, and nowhere else.
  colgLeadersSeeded: (c) => ['darrellpoe06@gmail.com', 'mrspoe06@gmail.com', 'christina@tlctherapysolutions.com', 'bg@thechurchofthelivinggod.com']
    .every((e) => c.includes(`('${e}',`)) && (c.match(/@[a-z.]+\.(com|org)'/g) || []).length === 4,
  onlyOneOwnerSeeded: (c) => /\('darrellpoe06@gmail\.com',\s*'owner'\)/.test(c) && (c.match(/\('[^']+@[^']+',\s*'owner'\)/g) || []).length === 1,
  // Both tables carry instance_id and RLS; leaders have no client write path.
  leadersRls: (c) => /ALTER TABLE church_leaders ENABLE ROW LEVEL SECURITY/.test(c),
  profilesRls: (c) => /ALTER TABLE church_profiles ENABLE ROW LEVEL SECURITY/.test(c),
  leadersReadOnlyGrant: (c) => /GRANT SELECT ON church_leaders TO authenticated/.test(c) && !/GRANT[^;]*(INSERT|UPDATE|DELETE)[^;]*ON church_leaders/.test(c),
  leadersNoWritePolicy: (c) => !/CREATE POLICY \w+ ON church_leaders FOR (INSERT|UPDATE|DELETE)/.test(c),
  profilesOfficeWrites: (c) => /CREATE POLICY church_profiles_office_insert ON church_profiles FOR INSERT[\s\S]*?user_role_in_instance\(instance_id\) IN \('owner','admin'\)/.test(c)
    && /CREATE POLICY church_profiles_office_update ON church_profiles FOR UPDATE[\s\S]*?user_role_in_instance\(instance_id\) IN \('owner','admin'\)/.test(c),
  profilesReadIsMembersOrPublic: (c) => /CREATE POLICY church_profiles_read ON church_profiles FOR SELECT\s*\n\s*TO authenticated\s*\n\s*USING \(is_public OR user_in_instance\(instance_id\)\)/.test(c),
  anonReadsOnlyPublic: (c) => /CREATE POLICY church_profiles_public_read ON church_profiles FOR SELECT\s*\n\s*TO anon\s*\n\s*USING \(is_public\)/.test(c) && /GRANT SELECT ON church_profiles TO anon;/.test(c) && !/GRANT[^;]*(INSERT|UPDATE)[^;]*TO anon/.test(c),
  // The steward gate stands in front of provisioning, and the family slug is
  // the only thing that confers it.
  provisionGated: (c) => /IF NOT public\.is_platform_steward\(\) THEN\s*\n\s*RAISE EXCEPTION 'provision_church_instance: only a platform steward/.test(c),
  stewardIsFamilyOwnerAdmin: (c) => /WHERE i\.slug = 'poe-family'\s*\n\s*AND im\.role IN \('owner','admin'\)/.test(c),
  provisionNeverRetypes: (c) => /v_type <> 'church' THEN\s*\n\s*RAISE EXCEPTION/.test(c),
  provisionReserved: (c) => /v_slug IN \('poe-family', 'poetech', 'app', 'api', 'admin'\) OR v_slug LIKE 'u-%'/.test(c),
  // The https rule lives in the wall, for channels AND profile links.
  httpsOnly: (c) => (c.match(/\^https:\/\/\[a-z0-9\]/g) || []).length >= 3,
  triggerGuards: (c) => /CREATE TRIGGER church_profiles_guard\s*\n\s*BEFORE INSERT OR UPDATE ON church_profiles/.test(c),
  // A null part is left as it is (the bug the smoke caught in the first draft).
  nullLeavesAlone: (c) => /SET profile\s*=\s*coalesce\(profile_in,\s*church_profiles\.profile\)/.test(c)
    && /giving_channels = coalesce\(channels_in, church_profiles\.giving_channels\)/.test(c),
  // Nothing is destroyed; no link is written here.
  deletesNothing: (c) => !/^\s*DELETE FROM|DROP TABLE|TRUNCATE/im.test(c),
  writesNoLink: (c) => !/INSERT INTO person_links|UPDATE person_links/i.test(c),
  idempotentSeat: (c) => (c.match(/ON CONFLICT \(instance_id, user_id\) DO NOTHING/g) || []).length >= 3,
  reloadsSchema: (c) => /NOTIFY pgrst, 'reload schema';/.test(c),
};

describe('0297 — a church is added by a form, not a migration (the migration text)', () => {
  for (const [name, rule] of Object.entries(rules)) {
    it(name, () => { expect(rule(code), name).toBe(true); });
  }
});

describe('0297 — the smoke is wired where it is proven', () => {
  it('runs on the live database in the choir-claim leg, AFTER 0294 (the replay-order rule)', () => {
    const leg = /- feature: choir-claim\s*\n\s*migrations: "([^"]*)"\s*\n\s*smokes: "([^"]*)"/.exec(iso);
    expect(leg, 'the choir-claim leg exists').toBeTruthy();
    const migs = leg[1].split(/\s+/);
    expect(migs.indexOf(MIG_NAME)).toBeGreaterThan(migs.indexOf('0294-the-church-knows-one-person-at-either-door.sql'));
    expect(leg[2].split(/\s+/)).toContain(SMOKE_NAME);
  });
  it('runs on a fresh PostgreSQL in ci.yml, twice, with 0294’s own smoke beside it, and the leg is required', () => {
    expect(ci).toMatch(/church-onboarding:\s*\n\s*name: app — church onboarding walls \(PostgreSQL\)/);
    expect(ci).toMatch(new RegExp(`for i in 1 2; do psql -v ON_ERROR_STOP=1 -q --single-transaction -f infra/supabase/migrations-auto/${MIG_NAME.replace(/\./g, '\\.')}; done`));
    expect(ci).toMatch(/grep -q 'CHURCH EITHER DOOR SMOKE: PASS'/);
    expect(ci).toMatch(/grep -q 'CHURCH ONBOARDING SMOKE: PASS'/);
    const needs = /needs: \[([^\]]*)\]\s*\n\s*runs-on: ubuntu-latest\s*\n\s*steps:\s*\n\s*- name: Every leg passed/.exec(ci);
    expect(needs, 'the aggregator needs list').toBeTruthy();
    expect(needs[1].split(/,\s*/)).toContain('church-onboarding');
  });
  it('the smoke rolls back, prints its PASS line, and asserts the walls it lists', () => {
    expect(smoke.trim().startsWith('-- ====')).toBe(true);
    expect(smoke).toMatch(/^BEGIN;/m);
    expect(smoke.trim().endsWith('ROLLBACK;')).toBe(true);
    expect(smoke).toContain("RAISE NOTICE 'CHURCH ONBOARDING SMOKE: PASS'");
    for (const must of [
      'a stranger provisioned a church', 'a bad slug was accepted', 'a reserved slug was accepted',
      'a business space was re-typed as a church', 'second call was not idempotent',
      'leader L joined', 'a stranger joined', 'a member wrote the profile', 'an http channel was accepted',
      'a javascript: channel was accepted', 'duplicate channel ids were accepted', 'a stranger reads a private profile',
      'anon reads a private profile', 'marking public lost the channels', 'a member reads the leader rows',
      'the owner wrote a leader row directly', "another church''s owner reads colg''s leaders",
    ]) expect(smoke, must).toContain(must);
    // No real address is ever inserted by the smoke.
    expect(smoke).not.toMatch(/darrellpoe06|mrspoe06|tlctherapysolutions|thechurchofthelivinggod/);
  });
  it('the fresh-container bootstrap creates only person_links, verbatim from 0141, with RLS on', () => {
    const boot = strip(readFileSync(BOOT, 'utf8'));
    expect(boot).toMatch(/CREATE TABLE IF NOT EXISTS person_links \(/);
    expect(boot).toMatch(/ALTER TABLE person_links ENABLE ROW LEVEL SECURITY;/);
    expect((boot.match(/CREATE TABLE/g) || []).length).toBe(1);
    expect(boot).not.toMatch(/CREATE POLICY/);
  });
});

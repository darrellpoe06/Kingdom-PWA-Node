// @vitest-environment node
// =============================================================================
// 0299 — the household share, pinned at the source (DR-1077)
// =============================================================================
// The smoke proves the walls on a real PostgreSQL (rls-isolation, leg
// legal-household). This pins what a reviewer must see in the migration text
// itself, so a later edit cannot quietly widen the TABLE's read (which would
// pour other people's rows into the device sync), let a viewer read privileged
// paper, or make sharing the default.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const MIG_NAME = '0299-a-household-shares-its-legal-papers-only-when-the-filer-says-so.sql';
const SMOKE_NAME = '0299-legal-household-share-smoke.sql';
const strip = (s) => s.replace(/--.*$/gm, '');
const code = strip(readFileSync(join(ROOT, 'infra', 'supabase', 'migrations-auto', MIG_NAME), 'utf8'));
const smoke = readFileSync(join(ROOT, 'infra', 'supabase', 'tests', SMOKE_NAME), 'utf8');
const iso = readFileSync(join(ROOT, '.github', 'workflows', 'rls-isolation.yml'), 'utf8');

const rules = {
  offByDefault: (c) => /ADD COLUMN IF NOT EXISTS shared_with_household boolean NOT NULL DEFAULT false/.test(c),
  // The table's own SELECT is never touched: the device sync must not see others' rows.
  tableReadUntouched: (c) => !/POLICY\s+legal_documents_read/.test(c) && !/ON public\.legal_documents FOR SELECT/.test(c) && !/ON legal_documents FOR SELECT/.test(c),
  writesStayWithFiler: (c) => (c.match(/created_by = auth\.uid\(\)\s*\n\s*AND \(shared_with_household = false OR public\.user_in_instance\(instance_id\)\)/g) || []).length === 2,
  noDeletePolicyChange: (c) => !/legal_documents_delete/.test(c),
  householdIsOwnerAdminMember: (c) => (c.match(/IN \('owner', 'admin', 'member'\)/g) || []).length === 2 && !/'viewer'/.test(c) && !/'assistant'/.test(c),
  nullSafeRole: (c) => /coalesce\(public\.user_role_in_instance\(doc_instance\), ''\) IN/.test(c),
  neverYourOwnRows: (c) => /doc_owner IS DISTINCT FROM auth\.uid\(\)/.test(c),
  filerMustStillBelong: (c) => /im\.user_id = doc_owner/.test(c),
  definersPinSearchPath: (c) => (c.match(/SECURITY DEFINER\s*\nSET search_path = public/g) || []).length === 3,
  grantsAuthenticatedOnly: (c) => (c.match(/REVOKE ALL ON FUNCTION public\.\w+\([^)]*\) FROM PUBLIC;/g) || []).length === 3 && !/TO anon/.test(c),
  storageReadOnlyAdded: (c) => /CREATE POLICY legal_documents_object_household_read ON storage\.objects FOR SELECT TO authenticated/.test(c)
    && !/ON storage\.objects FOR (INSERT|UPDATE|DELETE)/.test(c),
  addsNoTable: (c) => !/CREATE TABLE/.test(c),
  deletesNothing: (c) => !/^\s*DELETE FROM|DROP TABLE|TRUNCATE/im.test(c),
  reloadsSchema: (c) => /NOTIFY pgrst, 'reload schema';/.test(c),
};

describe('0299 — the household share (the migration text)', () => {
  for (const [name, rule] of Object.entries(rules)) {
    it(name, () => { expect(rule(code), name).toBe(true); });
  }
});

describe('0299 — the smoke is wired where it is proven', () => {
  it('runs on the live database in its own rls-isolation leg', () => {
    const leg = /- feature: legal-household\s*\n\s*migrations: "([^"]*)"\s*\n\s*smokes: "([^"]*)"/.exec(iso);
    expect(leg, 'the legal-household leg exists').toBeTruthy();
    expect(leg[1].split(/\s+/)).toContain(MIG_NAME);
    expect(leg[2].split(/\s+/)).toContain(SMOKE_NAME);
  });
  it('the smoke rolls back, prints its PASS line, and asserts every wall it lists', () => {
    expect(smoke).toMatch(/^BEGIN;/m);
    expect(smoke.trim().endsWith('ROLLBACK;')).toBe(true);
    expect(smoke).toContain("RAISE NOTICE 'LEGAL HOUSEHOLD SHARE SMOKE: PASS'");
    for (const must of [
      'a member read % rows from the TABLE', 'a member cannot open the shared file', 'a member rewrote a shared paper',
      'a member deleted a shared paper', 'the filer read % of their own rows as shared', 'a viewer read % shared legal rows',
      'a stranger read % shared legal rows', 'a stranger opened the shared file',
      'a stranger filed a shared paper into another household', 'an un-shared paper is still listed',
      'an un-shared file still opens', "a departed filer''s paper is still shared",
    ]) expect(smoke, must).toContain(must);
    expect(smoke).not.toMatch(/darrellpoe06|mrspoe06|tlctherapysolutions|thechurchofthelivinggod/);
  });
});

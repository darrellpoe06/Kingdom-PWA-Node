// @vitest-environment node
// =============================================================================
// 0300 — the office opens what a member shared, pinned at the source (DR-1086)
// =============================================================================
// The smoke proves the rule on PostgreSQL (rls-isolation leg church-office-
// files). This pins the text so a later edit cannot admit an ordinary member,
// drop the share requirement, or widen a storage write.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const MIG = '0300-the-office-opens-what-a-member-shared.sql';
const SMOKE = '0300-office-opens-shared-smoke.sql';
const code = readFileSync(join(ROOT, 'infra/supabase/migrations-auto', MIG), 'utf8').replace(/--.*$/gm, '');
const smoke = readFileSync(join(ROOT, 'infra/supabase/tests', SMOKE), 'utf8');
const iso = readFileSync(join(ROOT, '.github/workflows/rls-isolation.yml'), 'utf8');

describe('0300 — the migration text', () => {
  it('admits only a shared paper, only to the office of its own church, NULL-safe', () => {
    expect(code).toMatch(/AND cd\.shared_with_office = true/);
    expect(code).toMatch(/coalesce\(public\.user_role_in_instance\(cd\.instance_id\), ''\) IN \('owner', 'admin'\)/);
    expect(code).not.toMatch(/'member'/);
  });
  it('is one added storage READ for the church-documents bucket, through a pinned definer', () => {
    expect(code).toMatch(/CREATE POLICY church_documents_objects_office_read ON storage\.objects FOR SELECT TO authenticated\s*\n\s*USING \(bucket_id = 'church-documents' AND public\.church_object_shared_with_my_office\(name\)\)/);
    expect(code).not.toMatch(/ON storage\.objects FOR (INSERT|UPDATE|DELETE)/);
    expect(code).toMatch(/SECURITY DEFINER\s*\nSET search_path = public/);
    expect(code).toMatch(/REVOKE ALL ON FUNCTION public\.church_object_shared_with_my_office\(text\) FROM PUBLIC;/);
    expect(code).not.toMatch(/TO anon/);
    expect(code).not.toMatch(/CREATE TABLE|DROP TABLE|DELETE FROM/);
  });
});

describe('0300 — proven where it runs', () => {
  it('has its own rls-isolation leg with its smoke', () => {
    const leg = /- feature: church-office-files\s*\n\s*migrations: "([^"]*)"\s*\n\s*smokes: "([^"]*)"/.exec(iso);
    expect(leg).toBeTruthy();
    expect(leg[1]).toBe(MIG);
    expect(leg[2]).toBe(SMOKE);
  });
  it('the smoke rolls back and asserts every wall', () => {
    expect(smoke.trim().endsWith('ROLLBACK;')).toBe(true);
    expect(smoke).toContain("RAISE NOTICE 'OFFICE OPENS SHARED SMOKE: PASS'");
    for (const must of [
      'the office cannot open a paper the member shared with it',
      'the office opened a paper the member did not share',
      "a member who is not the office opened another member''s shared paper",
      "another church''s office opened this church''s paper",
      'the office still opens a paper the member stopped sharing',
    ]) expect(smoke, must).toContain(must);
  });
});

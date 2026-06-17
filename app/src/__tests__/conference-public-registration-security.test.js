// =============================================================================
// conference_public_registrations — security-shape gate (migration 0027)
// =============================================================================
// The OPEN congregation registration table uses a DELIBERATELY different RLS model
// from the rest of the conference tables (which are member-readable): ANYONE may
// INSERT (the public ?register=1 form), but ONLY the church owner/admin may READ —
// a registrant can NEVER read the roll back. The existing conference-rls-guard
// only covers 0023/0024, so this gate proves THIS table's shape and — per DR-0060
// (proven-to-catch) — proves it FAILS the exact leak shapes (an anon SELECT grant,
// an anon SELECT policy, an unscoped read). DR-0076: prove it, don't claim it.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const MIGRATION = join(ROOT, 'infra/supabase/migrations-auto/0027-conference-public-registration.sql');
const TABLE = 'conference_public_registrations';

const ORG_SCOPED = /user_role_in_instance\s*\(\s*instance_id\s*\)\s*IN\s*\(\s*'owner'\s*,\s*'admin'\s*\)/i;

// Pure checker over the migration SQL. Returns { ok, problems }.
export function checkPublicRegSecurity(sql) {
  const problems = [];
  const clean = sql.replace(/--[^\n]*/g, '');

  // 1. Table + RLS.
  if (!new RegExp(`CREATE\\s+TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?(?:public\\.)?${TABLE}\\b`, 'i').test(clean)) {
    problems.push(`table ${TABLE} not created`);
  }
  if (!new RegExp(`ALTER\\s+TABLE\\s+(?:public\\.)?${TABLE}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`, 'i').test(clean)) {
    problems.push(`RLS not enabled on ${TABLE}`);
  }

  // 2. Grants: anon MUST have INSERT and MUST NOT have SELECT/UPDATE/DELETE.
  const grantRe = new RegExp(`GRANT\\s+([\\w ,]+?)\\s+ON\\s+(?:public\\.)?${TABLE}\\s+TO\\s+([\\w, ]+)`, 'gi');
  const roleGrants = {}; // role -> Set(priv)
  let g;
  while ((g = grantRe.exec(clean)) !== null) {
    const privs = g[1].toUpperCase().split(',').map((s) => s.trim()).filter(Boolean);
    const roles = g[2].toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);
    for (const role of roles) {
      roleGrants[role] = roleGrants[role] || new Set();
      privs.forEach((p) => roleGrants[role].add(p));
    }
  }
  const anon = roleGrants.anon || new Set();
  if (!anon.has('INSERT')) problems.push('anon is missing the INSERT grant — the public form would 403 (42501)');
  for (const forbidden of ['SELECT', 'UPDATE', 'DELETE']) {
    if (anon.has(forbidden)) problems.push(`anon must NOT have ${forbidden} on ${TABLE} — registrants must never read the roll back (LEAK)`);
  }

  // 3. Policies on the table.
  const polRe = /CREATE\s+POLICY[\s\S]*?;/gi;
  let m;
  let sawInsertAnon = false;
  let sawOrgRead = false;
  while ((m = polRe.exec(clean)) !== null) {
    const stmt = m[0];
    const head = stmt.match(/CREATE\s+POLICY\s+([\w]+)\s+ON\s+(?:public\.)?([\w]+)/i);
    if (!head || head[2].toLowerCase() !== TABLE) continue;
    const name = head[1];
    const cmd = (stmt.match(/\bFOR\s+(SELECT|INSERT|UPDATE|DELETE|ALL)\b/i) || [null, 'ALL'])[1].toUpperCase();
    // TO <roles> clause (before USING / WITH CHECK).
    const toM = stmt.match(/\bTO\s+([a-z_, ]+?)(?:\s+USING|\s+WITH\s+CHECK|\s*;)/i);
    const toRoles = toM ? toM[1].toLowerCase().split(',').map((s) => s.trim()) : [];

    if (cmd === 'SELECT' || cmd === 'ALL') {
      if (toRoles.includes('anon')) problems.push(`${name}: a ${cmd} policy granted TO anon would let registrants read the roll (LEAK)`);
      if (!ORG_SCOPED.test(stmt)) problems.push(`${name}: ${cmd} must be organizer-scoped via user_role_in_instance(instance_id) IN ('owner','admin') — found unscoped read`);
      else sawOrgRead = true;
    }
    if (cmd === 'INSERT') {
      if (toRoles.includes('anon')) sawInsertAnon = true;
    }
    if (cmd === 'UPDATE' || cmd === 'DELETE') {
      if (toRoles.includes('anon')) problems.push(`${name}: ${cmd} must not be granted TO anon`);
      if (!ORG_SCOPED.test(stmt)) problems.push(`${name}: ${cmd} must be organizer-scoped`);
    }
  }
  if (!sawInsertAnon) problems.push('no INSERT policy grants anon the public write path');
  if (!sawOrgRead) problems.push('no organizer-scoped SELECT policy found (read surface deny-all or unscoped)');

  return { ok: problems.length === 0, problems };
}

describe('conference_public_registrations security shape (migration 0027)', () => {
  it('the migration file exists', () => {
    expect(existsSync(MIGRATION), `missing ${MIGRATION}`).toBe(true);
  });

  it('PASSES the real migration: anon INSERT, organizer-only read, no anon read-back', () => {
    const sql = readFileSync(MIGRATION, 'utf8');
    const { ok, problems } = checkPublicRegSecurity(sql);
    expect(ok, problems.join('; ')).toBe(true);
  });

  // --- Proven-to-catch (DR-0060): the gate must FAIL each real leak shape. ------

  const base = `
    CREATE TABLE conference_public_registrations (id uuid, instance_id uuid, name text);
    ALTER TABLE conference_public_registrations ENABLE ROW LEVEL SECURITY;
    GRANT INSERT ON conference_public_registrations TO anon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON conference_public_registrations TO authenticated;
    CREATE POLICY conf_pub_reg_insert ON conference_public_registrations FOR INSERT TO anon, authenticated WITH CHECK (true);
    CREATE POLICY conf_pub_reg_admin_read ON conference_public_registrations FOR SELECT TO authenticated USING (user_role_in_instance(instance_id) IN ('owner','admin'));
    CREATE POLICY conf_pub_reg_admin_update ON conference_public_registrations FOR UPDATE TO authenticated USING (user_role_in_instance(instance_id) IN ('owner','admin')) WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
    CREATE POLICY conf_pub_reg_admin_delete ON conference_public_registrations FOR DELETE TO authenticated USING (user_role_in_instance(instance_id) IN ('owner','admin'));`;

  it('the synthetic baseline itself PASSES (so the catches mean something)', () => {
    expect(checkPublicRegSecurity(base).ok, checkPublicRegSecurity(base).problems.join('; ')).toBe(true);
  });

  it('CATCHES a GRANT SELECT TO anon (registrant could read the whole roll)', () => {
    const bad = base + `\nGRANT SELECT ON conference_public_registrations TO anon;`;
    const { ok, problems } = checkPublicRegSecurity(bad);
    expect(ok).toBe(false);
    expect(problems.join(' ')).toMatch(/anon must NOT have SELECT/i);
  });

  it('CATCHES a SELECT policy granted TO anon', () => {
    const bad = base + `\nCREATE POLICY leaky ON conference_public_registrations FOR SELECT TO anon USING (true);`;
    const { ok, problems } = checkPublicRegSecurity(bad);
    expect(ok).toBe(false);
    expect(problems.join(' ')).toMatch(/TO anon would let registrants read/i);
  });

  it('CATCHES an unscoped SELECT (any authenticated user reads every registration)', () => {
    const bad = base.replace(
      "CREATE POLICY conf_pub_reg_admin_read ON conference_public_registrations FOR SELECT TO authenticated USING (user_role_in_instance(instance_id) IN ('owner','admin'));",
      'CREATE POLICY conf_pub_reg_admin_read ON conference_public_registrations FOR SELECT TO authenticated USING (true);',
    );
    const { ok, problems } = checkPublicRegSecurity(bad);
    expect(ok).toBe(false);
    expect(problems.join(' ')).toMatch(/organizer-scoped/i);
  });

  it('CATCHES a missing anon INSERT grant (the public form would 403)', () => {
    const bad = base.replace('GRANT INSERT ON conference_public_registrations TO anon;', '');
    const { ok, problems } = checkPublicRegSecurity(bad);
    expect(ok).toBe(false);
    expect(problems.join(' ')).toMatch(/anon is missing the INSERT grant/i);
  });
});

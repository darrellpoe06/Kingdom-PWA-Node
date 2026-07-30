// delegated-pm-shape.test.js — statically pins the no-leak SHAPE of migration 0075
// (delegated property management). This is the cheap, always-on companion to the
// live isolation smoke test (infra/supabase/tests/0075-isolation-smoke.sql, run in
// CI by .github/workflows/rls-isolation.yml, the delegated-pm matrix leg): the SQL proves isolation
// against the real DB; THIS test proves the migration's security-critical structure
// can't silently regress in a future edit (DR-0076 / DR-0101). If someone loosens an
// arm, drops the SECURITY DEFINER pin, grants UPDATE on an append-only audit, or
// removes an existing RLS arm, one of these assertions goes red.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

describe('0075 delegated property management ships a no-leak, least-privilege shape', () => {
  const sql = read('../../infra/supabase/migrations-auto/0075-delegated-property-management.sql');

  it('creates the delegation grid, the worker channel, and the two append-only audit tables', () => {
    for (const t of ['delegated_capabilities', 'tenancy_worker_access', 'request_documentation', 'rent_balance_adjustments']) {
      expect(sql, `missing table ${t}`).toMatch(new RegExp(`CREATE TABLE IF NOT EXISTS ${t}\\b`));
    }
  });

  it('makes a toggle a single revocable row (unique per instance+grantee+scope+capability)', () => {
    expect(sql).toMatch(/CREATE UNIQUE INDEX IF NOT EXISTS delegated_capabilities_uniq[\s\S]*?\(instance_id, grantee_user_id, scope_ref, capability\)/);
    // Only these three settings exist; 'allow' is the only one the predicate honors.
    expect(sql).toMatch(/CHECK \(setting IN \('deny','approval','allow'\)\)/);
  });

  it('resolves delegation ONLY on setting=allow, scoped to instance + rental_ref (or the explicit *)', () => {
    expect(sql).toMatch(/FUNCTION public\.user_delegated_can\(p_tenancy uuid, p_capability text\)/);
    // The predicate joins on the tenancy's instance + only allow rows + scope match.
    expect(sql).toMatch(/dc\.instance_id\s*=\s*t\.instance_id/);
    expect(sql).toMatch(/dc\.setting\s*=\s*'allow'/);
    expect(sql).toMatch(/dc\.scope_ref = t\.rental_ref OR dc\.scope_ref = '\*'/);
  });

  it('pins both delegation helpers as SECURITY DEFINER with a fixed search_path (composes with user_is_tenant)', () => {
    for (const fn of ['user_delegated_can', 'user_is_enabled_worker']) {
      const m = sql.match(new RegExp(`FUNCTION public\\.${fn}[\\s\\S]*?\\$\\$`));
      expect(m, `helper ${fn} not found`).toBeTruthy();
      expect(m[0], `${fn} must be SECURITY DEFINER`).toMatch(/SECURITY DEFINER/);
      expect(m[0], `${fn} must pin search_path`).toMatch(/SET search_path = public/);
    }
    // Both helpers lock down EXECUTE the same way user_is_tenant does.
    expect(sql).toMatch(/REVOKE ALL ON FUNCTION public\.user_delegated_can\(uuid, text\) FROM PUBLIC/);
    expect(sql).toMatch(/REVOKE ALL ON FUNCTION public\.user_is_enabled_worker\(uuid\) FROM PUBLIC/);
  });

  it('PRESERVES every pre-existing RLS arm (owner/admin/member + user_is_tenant) — never loosened, only extended', () => {
    // Each extended read policy keeps the original arms AND adds a delegated OR arm.
    for (const t of ['tenant_maintenance_requests', 'rent_records', 'tenant_notices', 'tenant_messages']) {
      const rx = new RegExp(`CREATE POLICY ${t}_read[\\s\\S]*?user_role_in_instance\\(instance_id\\) IN \\('owner','admin','member'\\)[\\s\\S]*?user_is_tenant\\(tenancy_id\\)`);
      expect(sql, `${t}_read must preserve owner/admin/member + user_is_tenant`).toMatch(rx);
    }
    // The tenant tables gain delegated read arms.
    expect(sql).toMatch(/tenant_maintenance_requests_read[\s\S]*?user_delegated_can\(tenancy_id,'request\.manage'\)/);
    expect(sql).toMatch(/rent_records_read[\s\S]*?user_delegated_can\(tenancy_id,'rentroll\.view'\)/);
    expect(sql).toMatch(/tenant_messages_read[\s\S]*?user_is_enabled_worker\(tenancy_id\)/);
  });

  it('keeps the field worker view-only (no message.tenant, no rentroll.view in a worker-only arm)', () => {
    // A field worker reads requests via property.history/docs.add, but the request
    // WRITE arm is request.manage only — a worker can't manage.
    const insert = sql.match(/CREATE POLICY tenant_maintenance_requests_insert[\s\S]*?WITH CHECK[\s\S]*?;/);
    expect(insert).toBeTruthy();
    expect(insert[0]).toMatch(/user_delegated_can\(tenancy_id,'request\.manage'\)/);
    expect(insert[0], 'worker caps must never grant a request WRITE').not.toMatch(/property\.history|docs\.add/);
  });

  it('rent balance edits go through rent.adjust and land an append-only audit (SELECT+INSERT grants only)', () => {
    expect(sql).toMatch(/rent_records_update[\s\S]*?user_delegated_can\(tenancy_id,'rent\.adjust'\)/);
    // The two audit/append-only tables grant SELECT + INSERT ONLY (no UPDATE/DELETE).
    for (const t of ['request_documentation', 'rent_balance_adjustments']) {
      expect(sql, `${t} must grant SELECT, INSERT only`).toMatch(new RegExp(`GRANT SELECT, INSERT ON ${t} TO authenticated;`));
      expect(sql, `${t} must NOT grant UPDATE/DELETE`).not.toMatch(new RegExp(`GRANT[^\\n]*(UPDATE|DELETE)[^\\n]*ON ${t}\\b`));
    }
  });

  it('grants NO delegated arm to the books/portfolio/dev surfaces — the tables it touches are tenant-scoped only', () => {
    // The only tables whose RLS this migration rewrites are the five tenant tables +
    // its own four new tables. It must not touch instance-wide financial/CRM tables.
    const policyTargets = [...sql.matchAll(/CREATE POLICY \w+ ON (\w+)/g)].map((m) => m[1]);
    const allowed = new Set([
      'delegated_capabilities', 'tenancy_worker_access', 'request_documentation', 'rent_balance_adjustments',
      'tenant_maintenance_requests', 'rent_records', 'tenant_notices', 'tenant_messages', 'rental_tenancies',
    ]);
    for (const t of policyTargets) {
      expect(allowed.has(t), `0075 must not write RLS on ${t} (out of the delegated scope)`).toBe(true);
    }
  });

  it('only owner/admin can write the grant grid (a grantee reads their own rows, never writes them)', () => {
    expect(sql).toMatch(/CREATE POLICY delegated_capabilities_insert[\s\S]*?WITH CHECK \(user_role_in_instance\(instance_id\) IN \('owner','admin'\)\)/);
    expect(sql).toMatch(/CREATE POLICY delegated_capabilities_read[\s\S]*?grantee_user_id = auth\.uid\(\)/);
  });
});

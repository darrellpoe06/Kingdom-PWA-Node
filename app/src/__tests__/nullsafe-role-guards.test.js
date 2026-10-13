// @vitest-environment node
// nullsafe-role-guards — gate the 0131 class (DR-0076: every "looked-fine-but-
// wasn't" class becomes a machine check).
//
// user_role_in_instance() returns NULL for a NON-member. In an RLS policy that
// NULL fails closed; in plpgsql, `IF role NOT IN ('owner','admin') THEN RAISE`
// evaluates NULL -> false and the RAISE NEVER FIRES — a signed-in outsider
// walks past the privilege guard. The rls-isolation matrix proved it live on
// 2026-08-04 (an outsider changed a role; minted a choir claim code). 0131
// re-declared every such guard NULL-safe (`IS NULL OR` / `coalesce(...)`).
//
// This test keeps the class closed: any migration sorting AFTER 0131 that
// writes a privilege guard (a NOT-IN role list that includes 'owner') without
// NULL protection FAILS the build. The heuristic separates guards from the
// harmless invite/role CLAMPS (whose lists never include 'owner' and whose
// input is a coalesce-defaulted string).
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const DIR = join(here, '../../../infra/supabase/migrations-auto');
const FIX = '0131-stale-role-constraint-and-nullsafe-guards.sql';

// A privilege-guard line: IF <expr> NOT IN ('owner', ... ). NULL-safe when the
// same statement carries IS NULL OR or wraps the role in coalesce(...).
export function nullBlindGuardLines(sql) {
  const out = [];
  const lines = sql.split('\n');
  lines.forEach((raw, i) => {
    const line = raw.toLowerCase();
    if (line.trim().startsWith('--')) return;
    if (!/if\s+.*not\s+in\s*\(\s*'owner'/.test(line)) return;
    if (/is null or|coalesce\s*\(/.test(line)) return;
    out.push(`${i + 1}: ${raw.trim()}`);
  });
  return out;
}

describe('NULL-safe privilege guards (the 0131 class stays closed)', () => {
  it('0131 itself carries no NULL-blind guard and fixes all nine functions', () => {
    const sql = readFileSync(join(DIR, FIX), 'utf8');
    expect(nullBlindGuardLines(sql)).toEqual([]);
    const n = sql.toLowerCase();
    for (const fn of [
      'set_member_role', 'remove_instance_member', 'mint_choir_claim_code',
      'grant_support_access', 'provision_child_member', 'add_showcase_piece',
      'update_showcase_piece', 'set_showcase_pin', 'delete_showcase_piece',
    ]) {
      expect(n, `${fn} missing from 0131`).toContain(`function public.${fn}`);
    }
    // The stale constraint twins are dropped by their real (pre-rename) names.
    expect(n).toContain('drop constraint if exists tenant_members_role_check');
    expect(n).toContain('drop constraint if exists tenants_tenant_type_check');
  });

  it('every migration AFTER 0131 keeps its privilege guards NULL-safe', () => {
    const offenders = [];
    for (const f of readdirSync(DIR).filter((x) => x.endsWith('.sql') && x > FIX).sort()) {
      const hits = nullBlindGuardLines(readFileSync(join(DIR, f), 'utf8'));
      if (hits.length) offenders.push(`${f} -> ${hits.join(' | ')}`);
    }
    expect(offenders, offenders.join('\n')).toEqual([]);
  });

  // Proven-to-catch (DR-0060): the scanner flags the real hole shapes and
  // accepts the real fixed shapes.
  it('CATCHES the NULL-blind guard shapes the matrix exposed', () => {
    expect(nullBlindGuardLines("IF v_actor_role NOT IN ('owner','admin') THEN RAISE EXCEPTION 'x'; END IF;")).toHaveLength(1);
    expect(nullBlindGuardLines("IF user_role_in_instance(p_instance) NOT IN ('owner','admin') THEN")).toHaveLength(1);
    expect(nullBlindGuardLines("IF v_role NOT IN ('owner','admin','member') THEN RAISE EXCEPTION 'x'; END IF;")).toHaveLength(1);
  });

  it('ACCEPTS NULL-safe guards and plain value clamps', () => {
    expect(nullBlindGuardLines("IF v_actor_role IS NULL OR v_actor_role NOT IN ('owner','admin') THEN")).toEqual([]);
    expect(nullBlindGuardLines("IF coalesce(user_role_in_instance(x), '') NOT IN ('owner','admin') THEN")).toEqual([]);
    // A clamp list never includes 'owner' — not a privilege guard.
    expect(nullBlindGuardLines("IF v_role NOT IN ('admin','member','viewer') THEN v_role := 'member'; END IF;")).toEqual([]);
  });
});

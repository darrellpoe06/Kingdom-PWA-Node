// Data-isolation gate (DR-0059 follow-on). The family-data exposure we kept
// re-discovering — a tenant table without RLS, or a provisioning RPC that hands
// a stranger membership in the family instance — now FAILS the required check
// instead of waiting for a session to notice. The guard logic lives in
// scripts/tenancy-guard.mjs (also runnable as a CLI); this test runs it inside
// `app — lint + vitest` so it gates every merge with no ruleset change.
import { describe, it, expect } from 'vitest';
import { scanTenancy, checkProvisioning, checkIdentityGate, checkInstancesRecursion, checkViewerOverlay } from '../../../scripts/tenancy-guard.mjs';

describe('tenancy guard — data isolation (DR-0059)', () => {
  it('the scanner actually sees the schema (not vacuously empty)', () => {
    // Guards against a path/regex regression silently matching zero tables,
    // which would make the RLS assertion below pass for the wrong reason.
    const { tableScoped } = scanTenancy();
    expect(tableScoped.size).toBeGreaterThan(10);
  });

  it('every instance-scoped table has Row-Level Security enabled', () => {
    const { missing } = scanTenancy();
    expect(missing, `instance-scoped tables WITHOUT RLS: ${missing.join(', ')}`).toEqual([]);
  });

  it('the active provisioning RPC keeps the family-allowlist gate intact', () => {
    const { ok, problems } = checkProvisioning();
    expect(ok, problems.join('; ')).toBe(true);
  });

  // Check C (DR-0074): identity is part of the tenancy boundary. Real family
  // names must render only to a verified family member, never to a non-family
  // session (the 2026-06-14 parishioner saw "Darrell" because the gate was
  // `authSession`, not `isFamilyEmail`).
  it('real family names are gated on family membership, not session presence (DR-0074)', () => {
    const { ok, problems, names } = checkIdentityGate();
    // Non-vacuous: the guard must actually find the names in PROFILES.
    expect(names.length, 'identity guard found no family names in PROFILES — re-anchor it').toBeGreaterThan(0);
    expect(ok, problems.join('; ')).toBe(true);
  });

  // Anti-theater (DR-0060): the guard ships only after it is proven to CATCH
  // the break. Inject the exact regression (a real name gated on authSession)
  // and confirm a non-pass — no need to touch the real file.
  it('CATCHES a real name gated on session presence instead of membership', () => {
    const regression = `const PROFILES = [\n  { id: 'darrell', name: authSession ? 'Darrell' : 'Adam' },\n];`;
    const { ok, problems } = checkIdentityGate(regression);
    expect(ok).toBe(false);
    expect(problems.join(' ')).toMatch(/Darrell/);
  });

  // Check D (2026-06-30 incident): a SELECT policy on `instances` whose USING
  // subquery reads FROM `instances` 42P17-recurses on the live DB — a 500 that
  // Check A (RLS-enabled) cannot see. The real schema (with migration 0056's
  // fix) must pass.
  it('no surviving `instances` policy self-references (no 42P17 recursion)', () => {
    const { ok, problems, surviving } = checkInstancesRecursion();
    // Non-vacuous: the replay must actually find at least one instances policy.
    expect(surviving.length, 'no instances policies found — re-anchor Check D').toBeGreaterThan(0);
    expect(ok, problems.join('; ')).toBe(true);
  });

  // Anti-theater: inject the exact recursive policy and confirm it is CAUGHT.
  it('CATCHES a self-referential instances policy (the 2026-06-30 regression)', () => {
    const recursive = `CREATE POLICY p_bad ON instances FOR SELECT
      USING ( id IN (SELECT parent_instance_id FROM instances WHERE user_in_instance(id)) );`;
    const { ok, problems } = checkInstancesRecursion(recursive);
    expect(ok).toBe(false);
    expect(problems.join(' ')).toMatch(/self-references/);
  });

  // DROP-aware: a recursive policy that is later DROPped must NOT false-positive.
  it('is DROP-aware — a dropped recursive policy does not trip the guard', () => {
    const dropped = `CREATE POLICY p_bad ON instances FOR SELECT
        USING ( id IN (SELECT parent_instance_id FROM instances WHERE user_in_instance(id)) );
      DROP POLICY IF EXISTS p_bad ON instances;
      CREATE POLICY p_ok ON instances FOR SELECT
        USING ( user_in_instance(id) OR user_in_instance(parent_instance_id) );`;
    const { ok } = checkInstancesRecursion(dropped);
    expect(ok).toBe(true);
  });

  // Check E (DR-0241): 'viewer' is truly read-only only while the 0125
  // RESTRICTIVE deny-overlay stays intact AND covers tables created by later
  // migrations (the overlay function only sees tables that exist when it runs).
  it('the viewer read-only overlay is intact and covers later tables (DR-0241)', () => {
    const { ok, problems } = checkViewerOverlay();
    expect(ok, problems.join('; ')).toBe(true);
  });

  // Anti-theater: a later migration creating an instance-scoped table WITHOUT
  // re-running the overlay must be CAUGHT.
  it('CATCHES a post-0125 instance-scoped table that skips the overlay re-run', () => {
    const { ok, problems } = checkViewerOverlay({
      laterFilesOverride: [{
        name: '0999-new-table.sql',
        sql: 'CREATE TABLE IF NOT EXISTS new_thing (\n  id uuid PRIMARY KEY,\n  instance_id uuid NOT NULL\n);',
      }],
    });
    expect(ok).toBe(false);
    expect(problems.join(' ')).toMatch(/new_thing/);
  });

  // And the compliant form passes (the guard isn't always-failing).
  it('PASSES a post-0125 table that re-runs the overlay in the same file', () => {
    const { ok, problems } = checkViewerOverlay({
      laterFilesOverride: [{
        name: '0999-new-table.sql',
        sql: 'CREATE TABLE IF NOT EXISTS new_thing (\n  id uuid PRIMARY KEY,\n  instance_id uuid NOT NULL\n);\nSELECT public.apply_viewer_readonly_overlay();',
      }],
    });
    expect(ok, problems.join('; ')).toBe(true);
  });

  // A hollowed-out overlay migration (RESTRICTIVE policies removed) is CAUGHT.
  it('CATCHES a hollowed-out overlay migration', () => {
    const { ok, problems } = checkViewerOverlay({
      migrationOverride: '-- overlay removed\nSELECT 1;',
      laterFilesOverride: [],
    });
    expect(ok).toBe(false);
    expect(problems.join(' ')).toMatch(/RESTRICTIVE|invoke/i);
  });

  // And confirm the fixed form passes (so the guard isn't just always-failing).
  it('PASSES the membership-gated form', () => {
    const fixed = `const isFamilyMember = isFamilyEmail(authSession?.user?.email);\nconst PROFILES = [\n  { id: 'darrell', name: isFamilyMember ? 'Darrell' : 'Adam' },\n  { id: 'christina', name: isFamilyMember ? 'Christina' : 'Naomi' },\n];`;
    const { ok, problems } = checkIdentityGate(fixed);
    expect(ok, problems.join('; ')).toBe(true);
  });
});

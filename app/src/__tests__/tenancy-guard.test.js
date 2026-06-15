// Data-isolation gate (DR-0059 follow-on). The family-data exposure we kept
// re-discovering — a tenant table without RLS, or a provisioning RPC that hands
// a stranger membership in the family instance — now FAILS the required check
// instead of waiting for a session to notice. The guard logic lives in
// scripts/tenancy-guard.mjs (also runnable as a CLI); this test runs it inside
// `app — lint + vitest` so it gates every merge with no ruleset change.
import { describe, it, expect } from 'vitest';
import { scanTenancy, checkProvisioning, checkIdentityGate } from '../../../scripts/tenancy-guard.mjs';

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

  // And confirm the fixed form passes (so the guard isn't just always-failing).
  it('PASSES the membership-gated form', () => {
    const fixed = `const isFamilyMember = isFamilyEmail(authSession?.user?.email);\nconst PROFILES = [\n  { id: 'darrell', name: isFamilyMember ? 'Darrell' : 'Adam' },\n  { id: 'christina', name: isFamilyMember ? 'Christina' : 'Naomi' },\n];`;
    const { ok, problems } = checkIdentityGate(fixed);
    expect(ok, problems.join('; ')).toBe(true);
  });
});

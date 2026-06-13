// Data-isolation gate (DR-0059 follow-on). The family-data exposure we kept
// re-discovering — a tenant table without RLS, or a provisioning RPC that hands
// a stranger membership in the family instance — now FAILS the required check
// instead of waiting for a session to notice. The guard logic lives in
// scripts/tenancy-guard.mjs (also runnable as a CLI); this test runs it inside
// `app — lint + vitest` so it gates every merge with no ruleset change.
import { describe, it, expect } from 'vitest';
import { scanTenancy, checkProvisioning } from '../../../scripts/tenancy-guard.mjs';

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
});

// Conference / Event Center — no cross-instance leak (the build's hard guardrail:
// "a user cannot read another instance's conference / participants"). The proof
// is structural + deterministic, the repo's accepted no-leak standard (same as
// choir/engagement are gated): every RLS policy on the four conference tables is
// instance-scoped. Logic in scripts/conference-rls-guard.mjs; run here inside the
// required `app — lint + vitest` check so it gates every merge. Pairs with the
// tenancy guard (which proves RLS is ENABLED) — this proves the POLICIES don't
// leak. DR-0076 (prove it) + DR-0060 (proven-to-catch).
import { describe, it, expect } from 'vitest';
import { scanConferenceRls, CONFERENCE_TABLES } from '../../../scripts/conference-rls-guard.mjs';

describe('conference RLS — no cross-instance leak (migrations 0023 + 0024)', () => {
  it('sees all conference + venue tables (not vacuously empty)', () => {
    const { tables } = scanConferenceRls();
    for (const t of CONFERENCE_TABLES) expect(tables).toContain(t);
    expect(CONFERENCE_TABLES).toContain('venues');
  });

  it('checks a real set of policies (5 tables x ~4 commands)', () => {
    const { policyCount } = scanConferenceRls();
    expect(policyCount).toBeGreaterThanOrEqual(16);
  });

  it('every policy is instance-scoped — no cross-instance read/write path', () => {
    const { ok, problems } = scanConferenceRls();
    expect(ok, problems.join('; ')).toBe(true);
  });

  // --- Proven-to-catch (DR-0060): the guard must FAIL the exact leak shapes. ---

  it('CATCHES a SELECT policy that reads every instance (USING (true))', () => {
    const leak = `
      CREATE TABLE conferences (id uuid, instance_id uuid);
      ALTER TABLE conferences ENABLE ROW LEVEL SECURITY;
      CREATE POLICY conferences_read ON conferences FOR SELECT USING (true);`;
    const { ok, problems } = scanConferenceRls(leak);
    expect(ok).toBe(false);
    expect(problems.join(' ')).toMatch(/LEAK|instance-scoped/i);
  });

  it('CATCHES a participants SELECT that forgets the instance scope', () => {
    const leak = `
      CREATE TABLE event_participants (id uuid, instance_id uuid, created_by uuid);
      ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
      CREATE POLICY event_participants_read ON event_participants FOR SELECT
        USING (created_by = auth.uid());`;
    // created_by = auth.uid() is NOT an instance scope for a shared read roll —
    // a SELECT roll must be user_in_instance(instance_id) or it's either a leak
    // (if widened) or wrong (only sees your own rows). The guard flags it.
    const { ok, problems } = scanConferenceRls(leak);
    expect(ok).toBe(false);
    expect(problems.join(' ')).toMatch(/event_participants.*instance-scoped/i);
  });

  it('CATCHES a venues SELECT that reads every instance (USING (true))', () => {
    const leak = `
      CREATE TABLE venues (id uuid, instance_id uuid);
      ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
      CREATE POLICY venues_read ON venues FOR SELECT USING (true);`;
    const { ok, problems } = scanConferenceRls(leak);
    expect(ok).toBe(false);
    expect(problems.join(' ')).toMatch(/venues.*LEAK|venues.*instance-scoped/i);
  });

  it('CATCHES RLS forgotten entirely on a conference table', () => {
    const leak = `
      CREATE TABLE event_sessions (id uuid, instance_id uuid);
      CREATE POLICY event_sessions_read ON event_sessions FOR SELECT
        USING (user_in_instance(instance_id));`;
    const { ok, problems } = scanConferenceRls(leak);
    expect(ok).toBe(false);
    expect(problems.join(' ')).toMatch(/RLS not enabled on event_sessions/i);
  });

  it('PASSES the correct instance-scoped form (not just always-failing)', () => {
    const good = CONFERENCE_TABLES.map((t) => `
      CREATE TABLE ${t} (id uuid, instance_id uuid, created_by uuid);
      ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY;
      CREATE POLICY ${t}_read ON ${t} FOR SELECT USING (user_in_instance(instance_id));
      CREATE POLICY ${t}_write ON ${t} FOR INSERT WITH CHECK (user_role_in_instance(instance_id) IN ('owner','admin'));
    `).join('\n');
    const { ok, problems } = scanConferenceRls(good);
    expect(ok, problems.join('; ')).toBe(true);
  });
});

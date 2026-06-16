// grant-guard — the deterministic gate for the 2026-06-16 Choir incident class:
// a table shipped with RLS + correct policies but NO `authenticated` table
// grant, so every read/write 403'd with Postgres code 42501 ("permission denied
// for table") BEFORE RLS ran. This runs the structural guard inside the required
// `app — lint + vitest` check so the class can't recur silently.
//
// Pairs with tenancy-guard (RLS is ENABLED on every instance table) and
// conference-rls-guard (the policies don't leak): those two make granting
// `authenticated` table access provably leak-safe; this proves the grant is
// actually present. DR-0076 (prove it) + DR-0060 (proven-to-catch).
import { describe, it, expect } from 'vitest';
import { scanGrants } from '../../../scripts/grant-guard.mjs';

describe('grant-guard — authenticated can reach every instance-scoped table', () => {
  it('sees a real set of instance-scoped tables (not vacuously empty)', () => {
    const { tableScoped } = scanGrants();
    expect(tableScoped.size).toBeGreaterThanOrEqual(20);
    // the exact tables the incident broke must be in scope
    for (const t of ['choir_schedule', 'choir_songs', 'choir_sermons']) {
      expect(tableScoped).toContain(t);
    }
  });

  it('PASSES against the real migrations (0024 restores the authenticated grant)', () => {
    const { ok, problems } = scanGrants();
    expect(ok, problems.join('; ')).toBe(true);
  });

  it('requires the recurrence guard (ALTER DEFAULT PRIVILEGES ... TO authenticated)', () => {
    const { defaultPrivAuth } = scanGrants();
    expect(defaultPrivAuth).toBe(true);
  });

  // --- Proven-to-catch (DR-0060): the guard must FAIL the exact bug shape. ---

  // A realistic multi-line CREATE TABLE (closing paren on its own line), the way
  // every real migration is written and the way the table-scan detects them.
  const FOO_TABLE = 'CREATE TABLE foo (\n  id uuid PRIMARY KEY,\n  instance_id uuid NOT NULL\n);';

  it('CATCHES an instance table with no authenticated grant at all', () => {
    const { ok, uncovered, problems } = scanGrants(FOO_TABLE);
    expect(ok).toBe(false);
    expect(uncovered).toContain('foo');
    expect(problems.join(' ')).toMatch(/42501|no GRANT/i);
  });

  it('CATCHES a grant that targets service_role but NOT authenticated', () => {
    const sql = [
      FOO_TABLE,
      'GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;',
      'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;',
    ].join('\n');
    const { ok, uncovered } = scanGrants(sql);
    expect(ok).toBe(false);
    expect(uncovered).toContain('foo');
  });

  it('CATCHES a blanket authenticated grant that forgets the default-privilege recurrence guard', () => {
    const sql = [
      FOO_TABLE,
      'GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;',
      // no ALTER DEFAULT PRIVILEGES -> the NEXT new table would regress
    ].join('\n');
    const { ok, problems } = scanGrants(sql);
    expect(ok).toBe(false);
    expect(problems.join(' ')).toMatch(/DEFAULT PRIVILEGES/i);
  });

  it('PASSES the minimal correct shape (blanket grant + default privileges)', () => {
    const sql = [
      FOO_TABLE,
      'GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;',
      'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;',
    ].join('\n');
    const { ok } = scanGrants(sql);
    expect(ok).toBe(true);
  });
});

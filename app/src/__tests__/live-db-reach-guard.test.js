// live-db-reach-guard — proven-to-catch (DR-0076 Section 3, DR-0659): a test
// lane pointed back at a real database must be CAUGHT, and so must a new lane
// that reaches one without being registered; the real repo must pass.
import { describe, it, expect } from 'vitest';
import { check, loadRepo, isTestWorkflow, REGISTER } from '../../../scripts/live-db-reach-guard.mjs';

const { workflows, scripts } = loadRepo();

describe('live-db-reach-guard — the real repo', () => {
  it('passes: no test lane reaches a live database, every reaching lane is registered with a reason', () => {
    expect(check(workflows, scripts)).toEqual([]);
  });

  it('knows rls-isolation for the test lane it is', () => {
    expect(isTestWorkflow('rls-isolation.yml', workflows['rls-isolation.yml'])).toBe(true);
  });

  it('rls-isolation restores the throwaway database and names no live one', () => {
    const code = workflows['rls-isolation.yml'].split('\n').filter((l) => !/^\s*#/.test(l)).join('\n');
    expect(code).toMatch(/scripts\/test-db-throwaway\.sh fetch/);
    expect(code).toMatch(/scripts\/test-db-throwaway\.sh up/);
    expect(code).not.toMatch(/SUPABASE_DB_URL|NAS_SSH_KEY|TS_AUTHKEY/);
  });

  it('every registration carries a reason', () => {
    for (const [name, r] of Object.entries(REGISTER)) {
      expect(String(r.reason || '').length, name).toBeGreaterThan(20);
      expect(['hosted', 'sovereign', 'both'], name).toContain(r.db);
    }
  });
});

describe('live-db-reach-guard — proven to catch', () => {
  it('CATCHES a leg pointed back at the secret (the 2026-09-25 shape)', () => {
    const back = workflows['rls-isolation.yml'].replace(
      '      - name: Apply ${{ matrix.feature }} migrations',
      '      - name: Apply ${{ matrix.feature }} migrations\n        env:\n          SUPABASE_DB_URL: ${{ secrets.SUPABASE_DB_URL }}\n      - name: Apply (again) ${{ matrix.feature }} migrations',
    );
    expect(back).not.toBe(workflows['rls-isolation.yml']);
    const p = check({ ...workflows, 'rls-isolation.yml': back }, scripts);
    expect(p.some((x) => /TEST LANE REACHES A LIVE DATABASE: rls-isolation\.yml names SUPABASE_DB_URL/.test(x))).toBe(true);
  });

  it('CATCHES a test lane that joins the tailnet or runs live-sql.sh', () => {
    const wf = 'name: x-smoke\njobs:\n  a:\n    steps:\n      - uses: tailscale/github-action@v3\n      - run: bash scripts/live-sql.sh < infra/supabase/tests/0074-isolation-smoke.sql\n';
    const p = check({ ...workflows, 'x-smoke.yml': wf }, scripts);
    expect(p.some((x) => /x-smoke\.yml names .*live-sql\.sh/.test(x) && /tailscale\/github-action/.test(x))).toBe(true);
  });

  it('CATCHES a test lane reaching through a script it runs', () => {
    const wf = 'name: y\njobs:\n  a:\n    steps:\n      - run: bash scripts/test-db-throwaway.sh up x\n';
    const p = check({ 'y.yml': wf }, { 'scripts/test-db-throwaway.sh': 'psql "$SUPABASE_DB_URL" -c "select 1"' }, {});
    expect(p.some((x) => /THROUGH scripts\/test-db-throwaway\.sh/.test(x))).toBe(true);
  });

  it('CATCHES a new lane that reaches a live database without registering', () => {
    const wf = 'name: z\njobs:\n  a:\n    steps:\n      - env:\n          SUPABASE_DB_URL: ${{ secrets.SUPABASE_DB_URL }}\n        run: psql "$SUPABASE_DB_URL" -c "delete from x"\n';
    const p = check({ ...workflows, 'z.yml': wf }, scripts);
    expect(p.some((x) => /UNREGISTERED LIVE-DATABASE REACH: z\.yml/.test(x))).toBe(true);
  });

  it('CATCHES a test lane registered as allowed to reach', () => {
    const p = check(workflows, scripts, { ...REGISTER, 'rls-isolation.yml': { db: 'hosted', reason: 'x'.repeat(30) } });
    expect(p.some((x) => /rls-isolation\.yml is a test lane and can never be registered/.test(x))).toBe(true);
  });

  it('CATCHES a stale registration', () => {
    const p = check(workflows, scripts, { ...REGISTER, 'gone.yml': { db: 'hosted', reason: 'x'.repeat(30) } });
    expect(p.some((x) => /STALE REGISTRATION: gone\.yml/.test(x))).toBe(true);
  });

  it('ignores history written in comments', () => {
    const wf = '# this lane used SUPABASE_DB_URL until 2026-09-25\nname: w\njobs:\n  a:\n    steps:\n      - run: echo hi\n';
    expect(check({ 'w.yml': wf }, {}, {})).toEqual([]);
  });
});

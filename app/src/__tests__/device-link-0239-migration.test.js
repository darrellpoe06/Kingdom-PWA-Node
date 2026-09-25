// @vitest-environment node
// =============================================================================
// 0239: the claim is the service role's alone, and start actually runs (DR-0658)
// =============================================================================
// Two facts found when the flow was finally wired, 2026-09-25:
//   1. 0222 granted device_link_claim to anon and authenticated. A browser
//      claiming directly burns its one-time link and gets only a user_id.
//   2. 0222's device_link_start raised "column reference expires_at is
//      ambiguous" on EVERY call (its RETURNS TABLE column shares the name of
//      the table column it sweeps by). Measured on supabase/postgres
//      15.8.1.060, the NAS's image. No television could ever start a link.
// The live proof is infra/supabase/tests/0239-device-link-smoke.sql in the
// rls-isolation matrix; this is the fast textual gate beside it.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const repoRoot = resolve(__dirname, '../../..');
const DIR = join(repoRoot, 'infra/supabase/migrations-auto');
const FILE = readdirSync(DIR).find((f) => f.startsWith('0239-'));
const sql = readFileSync(join(DIR, FILE), 'utf8');
const code = sql.replace(/--.*$/gm, '');
const fn = (name) => {
  const i = code.indexOf(`FUNCTION public.${name}(`);
  return i === -1 ? '' : code.slice(i, code.indexOf('$$;', i) + 3);
};

describe('who may claim a session', () => {
  it('claim is revoked from PUBLIC, anon AND authenticated (Supabase grants the last two directly)', () => {
    expect(code).toMatch(/REVOKE ALL ON FUNCTION public\.device_link_claim\(text\)\s+FROM PUBLIC, anon, authenticated;/);
  });
  it('claim is granted to service_role and to nobody else', () => {
    const grants = code.match(/GRANT EXECUTE ON FUNCTION public\.device_link_claim\(text\)\s+TO ([^;]+);/g) || [];
    expect(grants.length).toBe(1);
    expect(grants[0]).toMatch(/TO service_role;$/);
  });
  it('describe and decide are for a signed-in person only', () => {
    expect(code).toMatch(/GRANT EXECUTE ON FUNCTION public\.device_link_describe\(text\)\s+TO authenticated;/);
    expect(code).toMatch(/GRANT EXECUTE ON FUNCTION public\.device_link_decide\(text, boolean\)\s+TO authenticated;/);
    expect(fn('device_link_describe')).toMatch(/RAISE EXCEPTION 'sign-in-required'/);
  });
});

describe('start runs at all', () => {
  it('every column in start is qualified (no bare expires_at beside the OUT column)', () => {
    const start = fn('device_link_start');
    expect(start).toBeTruthy();
    const body = start.slice(start.indexOf('BEGIN'));
    // Every expires_at / created_at in the body is dl.-qualified, or the
    // INSERT column list / RETURNING public.device_link.expires_at.
    const bare = body.match(/(?<![.\w])(expires_at|created_at|consumed_at|denied_at)\b/g) || [];
    const insertList = (body.match(/INSERT INTO public\.device_link \(([^)]*)\)/) || [])[1] || '';
    const allowed = (insertList.match(/\b(expires_at|created_at)\b/g) || []).length;
    expect(bare.length, `bare column references in start: ${bare.join(', ')}`).toBe(allowed);
  });
  it('shapes are checked: a 64-hex hash and an 8-character code from the TV alphabet', () => {
    const start = fn('device_link_start');
    expect(start).toMatch(/\^\[0-9a-f\]\{64\}\$/);
    expect(start).toMatch(/\^\[ACDEFGHJKMNPQRTUVWXY34679\]\{8\}\$/);
  });
});

describe('it is rate-limited', () => {
  it('starts are bounded globally, look-ups and decisions per person', () => {
    expect(fn('device_link_start')).toMatch(/v_recent >= 30 OR v_live >= 500/);
    expect(fn('device_link_describe')).toMatch(/device_link_meter\('person:'/);
    expect(fn('device_link_decide')).toMatch(/device_link_meter\('person:'/);
    expect(fn('device_link_meter')).toMatch(/RAISE EXCEPTION 'rate-limited'/);
  });
  it('the meter is not callable from a browser', () => {
    expect(code).toMatch(/REVOKE ALL ON FUNCTION public\.device_link_meter\(text, int, interval\) FROM PUBLIC, anon, authenticated;/);
  });
});

describe('it is proven against a real database', () => {
  it('the rls-isolation matrix runs the device-link smoke after 0222 then 0239', () => {
    const wf = readFileSync(join(repoRoot, '.github/workflows/rls-isolation.yml'), 'utf8');
    const i = wf.indexOf('- feature: device-link');
    expect(i).toBeGreaterThan(-1);
    const leg = wf.slice(i, i + 600);
    const migs = (leg.match(/migrations:\s*"([^"]+)"/) || [])[1] || '';
    expect(migs.split(/\s+/)[0]).toMatch(/^0222-/);
    expect(migs.split(/\s+/)[1]).toMatch(/^0239-/);
    expect(leg).toMatch(/smokes:\s*"0239-device-link-smoke\.sql"/);
  });
  it('the smoke asserts each promise', () => {
    const smoke = readFileSync(join(repoRoot, 'infra/supabase/tests/0239-device-link-smoke.sql'), 'utf8');
    for (const m of [
      'anon can call device_link_claim', 'a signed-in person can call device_link_claim',
      'the user_code alone claimed a session', 'a second claim succeeded', 'a denied link was claimed',
      'an expired link was claimed', 'the 21st look-up in ten minutes was allowed', 'anon can read device_link rows',
    ]) expect(smoke, `smoke no longer checks: ${m}`).toContain(m);
    expect(smoke).toMatch(/ROLLBACK;\s*$/);
  });
});

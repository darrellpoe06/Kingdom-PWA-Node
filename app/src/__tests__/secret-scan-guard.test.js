// =============================================================================
// secret-scan-guard — proven to catch (DR-1330 D4, DR-0076 §3): every vendor
// shape, the workflow real-password rule (the 2026-11-05 finding, verbatim),
// and the env-literal rule each REQUIRE a finding; the self-declaring fakes,
// the ${VAR:-} compose reads and the app's `token:` labels pass; the live
// tree is clean or allowlisted with a date.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scan, judge, scannable, workflowRealPassword, envLiteral, RULES } from '../../../scripts/secret-scan-guard.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

describe('secret-scan-guard: proven to catch', () => {
  it('catches each vendor shape', () => {
    const planted = {
      jwt: 'const t = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6ImUyZSJ9.abcdefghijklmnopqrstuvwxyz0123456789ABCD";',
      'aws-access-key': 'aws_access_key_id = AKIAIOSFODNN7EXAMPLE',
      'github-token': 'token: ghp_abcdefghijklmnopqrstuvwxyz0123456789',
      'stripe-key': 'STRIPE=sk_live_abcdefghijklmnop0123',
      'anthropic-or-openai-key': 'key = "sk-ant-api03-abcdefghijklmnopqrstuvwxyz"',
      'google-api-key': 'AIzaSyA-abcdefghijklmnopqrstuvwxyz01234',
      'slack-token': 'xoxb-1234567890-abcdefghij',
      'supabase-secret-key': 'sb_secret_abcdefghijklmnop',
      'private-key-block': '-----BEGIN RSA PRIVATE KEY-----',
      'pushover-key': '  - `PUSHOVER_USER_KEY=abcdefghijklmnopqrstuvwxyz0123`',
    };
    for (const [rule, line] of Object.entries(planted)) {
      expect(scan('infra/x/thing.py', line).map((f) => f.rule), rule).toContain(rule);
    }
    expect(Object.keys(planted).sort()).toEqual(RULES.map((r) => r.id).sort());
  });
  it('catches the 2026-11-05 finding verbatim: a workflow signing into production with a literal PIN', () => {
    const line = `            -d '{"email":"15555550100@phone.poetech.us","password":"090909","data":{"name":"Probe User"}}' \\`;
    expect(workflowRealPassword(line)).toBe('workflow-real-password');
    expect(scan('.github/workflows/nas-health.yml', line)[0].rule).toBe('workflow-real-password');
  });
  it('passes the self-declaring fakes the other probes use', () => {
    expect(workflowRealPassword(`-d '{"email":"heal-probe@poetech.invalid","password":"not-a-real-password"}'`)).toBeNull();
    expect(workflowRealPassword(`-d '{"email":"probe@example.invalid","password":"probe-not-real"}'`)).toBeNull();
    expect(workflowRealPassword(`-d '{"email":"site-health-probe@example.invalid","password":"anything-at-all-here"}'`)).toBeNull();
    expect(workflowRealPassword(`-d '{"email":"15555550100@phone.poetech.us","password":"'"$PROBE_PIN"'"}'`)).toBeNull();
  });
  it('catches a literal in a tracked env or compose file, and passes the environment reads and the examples', () => {
    expect(envLiteral('POSTGRES_PASSWORD=hunter2hunter2')).toBe('env-literal');
    expect(scan('infra/nas-supabase/.env', 'POSTGRES_PASSWORD=hunter2hunter2')[0].rule).toBe('env-literal');
    expect(scan('infra/nas-supabase/.env.example', 'POSTGRES_PASSWORD=change_me_long_random')).toEqual([]);
    expect(envLiteral('      PUSHOVER_APP_TOKEN: ${PUSHOVER_APP_TOKEN:-}')).toBeNull();
    expect(envLiteral('OPENCLAW_GATEWAY_TOKEN=${OPENCLAW_GATEWAY_TOKEN}')).toBeNull();
    expect(scan('app/src/lib/thing.js', 'PASSWORD=hunter2hunter2')).toEqual([]); // not an env or compose file
  });
  it('stays quiet on the app\'s token labels', () => {
    expect(scan('app/src/lib/church-devices.js', "  { token: 'llm-inference',    label: 'Local LLM inference', gpuJob: true },")).toEqual([]);
  });
  it('judges: an unallowlisted finding fails, an allowlisted dated one passes, a stale date fails', () => {
    const f = [{ path: 'scripts/e2e/x.mjs', rule: 'jwt', line: 3 }];
    expect(judge(f, [], '2026-11-05')).toEqual(['scripts/e2e/x.mjs:3 jwt']);
    expect(judge(f, [{ path: 'scripts/e2e/x.mjs', rule: 'jwt', why: 'throwaway e2e key', reReview: '2026-12-05' }], '2026-11-05')).toEqual([]);
    expect(judge(f, [{ path: 'scripts/e2e/x.mjs', rule: 'jwt', why: 'x', reReview: '2026-11-01' }], '2026-11-05')[0]).toMatch(/passed its re-review date/);
  });
  it('skips lockfiles and binaries', () => {
    expect(scannable('app/package-lock.json')).toBe(false);
    expect(scannable('app/public/icon.png')).toBe(false);
    expect(scannable('.github/workflows/nas-health.yml')).toBe(true);
  });
});

describe('secret-scan-guard: the live allowlist', () => {
  it('every entry carries path, rule, why and a date after this record', () => {
    const live = JSON.parse(readFileSync(join(ROOT, 'scripts/secret-scan-allowlist.json'), 'utf8')).entries;
    for (const e of live) {
      expect(e.path && e.rule && e.why, JSON.stringify(e)).toBeTruthy();
      expect(e.reReview > '2026-11-05', `${e.path} ${e.reReview}`).toBe(true);
    }
  });
});

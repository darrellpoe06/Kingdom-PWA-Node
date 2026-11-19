// =============================================================================
// app-journeys signed-in stand-in — pinned (DR-0076: say what it is)
// =============================================================================
// The app runner signs a journey in with a MINTED local session for a
// fictitious business-tier person and answers the stub Supabase origin itself
// (scripts/e2e/app-journeys.mjs header). These pin that it is what it says:
// a token only its own throwaway secret verifies, a .local person, the one
// paid row the Assistant's gate asks for, nothing granted to a stranger's
// token, and a planted fault (--break=signin) that the CI leg runs.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  STANDIN,
  mintStandinJwt,
  verifyStandinJwt,
  standinStorageKey,
  standinSession,
  standinAnswer,
  expectedToFail,
  JOURNEY_IDS,
  TAP_JOURNEYS,
  SIGNED_IN_JOURNEYS,
} from '../../../scripts/e2e/app-journeys.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const bearer = (tok) => `Bearer ${tok}`;

describe('the stand-in is a stand-in, never a real account or secret', () => {
  it('names a fictitious .local person and a throwaway secret', () => {
    expect(STANDIN.email).toMatch(/@e2e\.local$/);
    expect(STANDIN.secret).toMatch(/throwaway/);
    expect(STANDIN.tier).toBe('business');
  });
  it('keeps the session where supabase-js reads it for the CI stub origin', () => {
    expect(standinStorageKey('https://test-stub.supabase.co')).toBe('sb-test-stub-auth-token');
    const s = standinSession(1_000_000);
    expect(s.expires_at).toBe(1_000_000 + 3600 * 24 * 365);
    expect(s.user.email).toBe(STANDIN.email);
    expect(verifyStandinJwt(s.access_token)).toMatchObject({ sub: STANDIN.userId, role: 'authenticated' });
  });
});

describe('the token check is proven to catch', () => {
  it('refuses a token signed with any other secret, a tampered one, and garbage', () => {
    const good = mintStandinJwt({ sub: 'x', role: 'authenticated' });
    expect(verifyStandinJwt(good)).toMatchObject({ sub: 'x' });
    expect(verifyStandinJwt(mintStandinJwt({ sub: 'x', role: 'authenticated' }, 'some-other-secret'))).toBeNull();
    const [h, , sig] = good.split('.');
    const forged = `${h}.${Buffer.from(JSON.stringify({ sub: 'y', role: 'authenticated' })).toString('base64url')}.${sig}`;
    expect(verifyStandinJwt(forged)).toBeNull();
    expect(verifyStandinJwt('not-a-token')).toBeNull();
    expect(verifyStandinJwt('')).toBeNull();
  });
});

describe('the stub answers', () => {
  const tok = standinSession().access_token;
  it('answers /auth/v1/user only for its own signed token', () => {
    expect(standinAnswer('GET', '/auth/v1/user', '').status).toBe(401);
    expect(standinAnswer('GET', '/auth/v1/user', bearer(mintStandinJwt({ role: 'authenticated' }, 'other'))).status).toBe(401);
    const ok = standinAnswer('GET', '/auth/v1/user', bearer(tok));
    expect(ok.status).toBe(200);
    expect(JSON.parse(ok.body).email).toBe(STANDIN.email);
  });
  it('holds the business row only for the signed-in stand-in, never for the anon key', () => {
    const signed = JSON.parse(standinAnswer('GET', '/rest/v1/member_subscriptions', bearer(tok)).body);
    expect(signed).toEqual([{ tier: 'business', status: 'active', current_period_end: '2099-01-01T00:00:00Z' }]);
    expect(JSON.parse(standinAnswer('GET', '/rest/v1/member_subscriptions', bearer('test-stub-anon-key')).body)).toEqual([]);
  });
  it('reads every other table empty, accepts writes, and answers nothing it does not stand in for', () => {
    expect(standinAnswer('GET', '/rest/v1/office_records', bearer(tok))).toEqual({ status: 200, body: '[]' });
    expect(standinAnswer('POST', '/rest/v1/office_records', bearer(tok)).status).toBe(201);
    expect(standinAnswer('POST', '/rest/v1/rpc/join_default_instance', bearer(tok))).toEqual({ status: 200, body: 'null' });
    expect(standinAnswer('GET', '/functions/v1/anything', bearer(tok)).status).toBe(404);
  });
});

describe('the signed-in journey and its planted fault are wired', () => {
  it('runs office-assistant-answers signed in, and --break=signin must fail exactly it', () => {
    expect(SIGNED_IN_JOURNEYS).toEqual(['office-assistant-answers']);
    for (const id of SIGNED_IN_JOURNEYS) expect(JOURNEY_IDS).toContain(id);
    expect(expectedToFail('signin')).toEqual(['office-assistant-answers']);
    expect(expectedToFail('taps')).toEqual([...TAP_JOURNEYS]);
    expect(expectedToFail('link')).toEqual(['lesson-link-lands']);
    expect(expectedToFail('')).toEqual([]);
  });
  it('the CI leg runs the signin planted fault before the walks', () => {
    const ci = readFileSync(join(ROOT, '.github/workflows/ci.yml'), 'utf8');
    const plant = ci.indexOf('app-journeys.mjs --only=office-assistant-answers,create-takes-words --break=signin');
    const walk = ci.indexOf('run: node scripts/e2e/app-journeys.mjs\n');
    expect(plant).toBeGreaterThan(-1);
    expect(walk).toBeGreaterThan(plant);
  });
});

// OAuth provider pre-flight gate (2026-09-11, post-incident).
//
// THE INCIDENT: 11:58am, in a church meeting, on /love-corner. A tap on
// "Continue with Google" opened a popup containing exactly this and nothing
// else: {"code":400,"error_code":"validation_failed","msg":"Unsupported
// provider: provider is not enabled"}. Two independent failures stacked:
//
//   1. INFRA — the sovereign GoTrue stack carried no GOTRUE_EXTERNAL_GOOGLE_*
//      config at all. On hosted Supabase, Google was enabled in the DASHBOARD,
//      and a dashboard setting is not a file, so it never travelled with the
//      cutover. Nobody noticed because nothing ever asked.
//   2. CLIENT — supabase-js builds the /authorize URL locally, so
//      signInWithOAuth cannot fail and the app cheerfully handed the browser a
//      dead URL. The popup flow then reported `cancelled` when the user closed
//      the JSON window, so the dialog showed no error either. Silent, twice.
//
// This file gates BOTH halves, and each gate is proven to catch its own break
// (DR-0076 s3 anti-theater) by being run against the pre-fix source.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  fetchAuthProviders,
  providerStatus,
  guardProvider,
  resetAuthProvidersCache,
} from '../lib/auth-providers.js';

const SRC = join(__dirname, '..');
const REPO = join(__dirname, '..', '..', '..');

const okSettings = (external) => ({
  ok: true,
  json: async () => ({ external }),
});

// -----------------------------------------------------------------------------
// 1. The probe reads GoTrue's real answer
// -----------------------------------------------------------------------------
describe('auth-providers — the provider state comes from the running service', () => {
  beforeEach(() => { resetAuthProvidersCache(); });

  it('reads the provider map off /auth/v1/settings', async () => {
    const fetchImpl = vi.fn(async () => okSettings({ google: true, apple: false, email: true }));
    const res = await fetchAuthProviders({ fetchImpl, baseUrl: 'https://poetech.us/sb' });
    expect(res.known).toBe(true);
    expect(res.external.google).toBe(true);
    // The exact endpoint matters: kong's auth-v1 route carries no key-auth, so
    // this is reachable same-origin with no apikey.
    expect(fetchImpl.mock.calls[0][0]).toBe('https://poetech.us/sb/auth/v1/settings');
  });

  it('does not double a trailing slash on the base URL', async () => {
    const fetchImpl = vi.fn(async () => okSettings({ google: true }));
    await fetchAuthProviders({ fetchImpl, baseUrl: 'https://poetech.us/sb/' });
    expect(fetchImpl.mock.calls[0][0]).toBe('https://poetech.us/sb/auth/v1/settings');
  });

  it('reports a provider GoTrue lists as false as DISABLED', async () => {
    const fetchImpl = async () => okSettings({ google: false, email: true });
    expect(await providerStatus('google', { fetchImpl, baseUrl: 'https://x/sb' })).toBe('disabled');
  });

  it('reports a provider GoTrue does not list at all as DISABLED', async () => {
    const fetchImpl = async () => okSettings({ email: true });
    expect(await providerStatus('google', { fetchImpl, baseUrl: 'https://x/sb' })).toBe('disabled');
  });

  it('memoises, so tapping the button twice does not re-probe', async () => {
    const fetchImpl = vi.fn(async () => okSettings({ google: true }));
    await providerStatus('google', { fetchImpl, baseUrl: 'https://x/sb' });
    await providerStatus('google', { fetchImpl, baseUrl: 'https://x/sb' });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    resetAuthProvidersCache();
    await providerStatus('google', { fetchImpl, baseUrl: 'https://x/sb' });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});

// -----------------------------------------------------------------------------
// 2. THE NO-LOCKOUT RULE — "could not ask" must never read as "switched off"
// -----------------------------------------------------------------------------
describe('auth-providers — an unreachable probe never takes a login path away', () => {
  beforeEach(() => { resetAuthProvidersCache(); });

  const unknownCases = [
    ['a 500 from the gateway', async () => ({ ok: false, json: async () => ({}) })],
    ['a network throw (offline)', async () => { throw new Error('Failed to fetch'); }],
    ['malformed JSON', async () => ({ ok: true, json: async () => { throw new Error('bad json'); } })],
    ['a body with no external map', async () => ({ ok: true, json: async () => ({ disable_signup: false }) })],
  ];

  for (const [label, fetchImpl] of unknownCases) {
    it(`${label} => unknown, and the button still works`, async () => {
      expect(await providerStatus('google', { fetchImpl, baseUrl: 'https://x/sb' })).toBe('unknown');
      const gate = await guardProvider('google', { fetchImpl, baseUrl: 'https://x/sb' });
      expect(gate.ok, 'a failed probe must NOT block sign-in').toBe(true);
    });
  }

  it('a missing base URL or fetch degrades to unknown, not a crash', async () => {
    expect((await fetchAuthProviders({ fetchImpl: null, baseUrl: '' })).known).toBe(false);
  });

  it('a hung probe aborts at its ceiling and answers unknown', async () => {
    vi.useFakeTimers();
    try {
      const fetchImpl = (_url, opts) => new Promise((_resolve, reject) => {
        if (opts && opts.signal) opts.signal.addEventListener('abort', () => reject(new Error('aborted')));
      });
      const p = providerStatus('google', { fetchImpl, baseUrl: 'https://x/sb' });
      await vi.advanceTimersByTimeAsync(5000);
      expect(await p).toBe('unknown');
    } finally {
      vi.useRealTimers();
    }
  });
});

// -----------------------------------------------------------------------------
// 3. The gate a button calls, and the message a person actually reads
// -----------------------------------------------------------------------------
describe('guardProvider — blocks the dead path and names a live one', () => {
  beforeEach(() => { resetAuthProvidersCache(); });

  it('blocks when GoTrue says the provider is off', async () => {
    const fetchImpl = async () => okSettings({ google: false, email: true });
    const gate = await guardProvider('google', { fetchImpl, baseUrl: 'https://x/sb' });
    expect(gate.ok).toBe(false);
    expect(gate.status).toBe('disabled');
  });

  it('the blocked message names the provider AND a way in that works', async () => {
    const fetchImpl = async () => okSettings({ google: false, email: true });
    const { message } = await guardProvider('google', { fetchImpl, baseUrl: 'https://x/sb' });
    expect(message).toMatch(/Google/);
    expect(message, 'a dead end is the bug; the message must route them').toMatch(/email/i);
    expect(message, 'never leak the raw GoTrue error at a person').not.toMatch(/validation_failed|Unsupported provider|\{/);
  });

  it('passes a provider that is genuinely on', async () => {
    const fetchImpl = async () => okSettings({ google: true });
    expect((await guardProvider('google', { fetchImpl, baseUrl: 'https://x/sb' })).ok).toBe(true);
  });
});

// -----------------------------------------------------------------------------
// 4. SOURCE GATE — every Google entry point pre-flights before it navigates
// -----------------------------------------------------------------------------
// The bug was not that the guard was wrong; it was that nothing called one. So
// the gate is on the CALL SITES, and it fails the build if a new button starts
// an OAuth flow without asking first.
const OAUTH_STARTERS = /signInWithGooglePopup\s*\(|signInWithGoogle\s*\(/;

export function checkPreflight(source) {
  const problems = [];
  let starters = 0;
  // Handler-shaped blocks: from an arrow-function assignment to the next
  // top-level `const` at the same indent. Crude on purpose -- it only has to
  // bracket the handler that navigates.
  const handlers = source.split(/\n {2}const /).slice(1);
  for (const h of handlers) {
    const m = OAUTH_STARTERS.exec(h);
    if (!m) continue;
    starters += 1;
    const nameMatch = h.match(/^([A-Za-z0-9_]+)/);
    const name = nameMatch ? nameMatch[1] : '?';
    // Either gate counts. The CACHED form is what a click handler should use
    // (it keeps the user gesture a popup needs); the async form is lawful
    // anywhere that is not a gesture.
    const gate = /guardProvider(?:Cached)?\('google'\)/.exec(h);
    if (!gate) {
      problems.push(`${name}: starts a Google OAuth flow without guardProvider('google')`);
      continue;
    }
    if (gate.index > m.index) {
      problems.push(`${name}: guardProvider('google') runs AFTER the flow starts`);
    }
  }
  return { ok: problems.length === 0, problems, starters };
}

describe('source gate — no Google button navigates without asking GoTrue first', () => {
  const CALL_SITES = ['components/AuthModal.jsx', 'components/ConferenceAccountOnRamp.jsx'];

  it('the scanner actually finds the Google entry points (not vacuously empty)', () => {
    let total = 0;
    for (const rel of CALL_SITES) {
      total += checkPreflight(readFileSync(join(SRC, rel), 'utf8')).starters;
    }
    expect(total, 'scanner matched zero OAuth starters — re-anchor it').toBeGreaterThan(0);
  });

  for (const rel of CALL_SITES) {
    it(`${rel} pre-flights before it navigates`, () => {
      const { ok, problems } = checkPreflight(readFileSync(join(SRC, rel), 'utf8'));
      expect(ok, problems.join('; ')).toBe(true);
    });
  }

  // The click path must gate SYNCHRONOUSLY. `await guardProvider(...)` before
  // window.open spends the user gesture, and Safari/Firefox then block the
  // popup -- demoting every Google sign-in to a full-page redirect and losing
  // the "keep your place" behaviour the popup exists for.
  it('the click handlers use the cache-only gate, never an await before the popup', () => {
    for (const rel of CALL_SITES) {
      const src = readFileSync(join(SRC, rel), 'utf8');
      expect(src, `${rel}: gate the click on guardProviderCached`).toMatch(/guardProviderCached\('google'\)/);
      // An awaited gate is lawful AFTER the popup (AuthModal re-checks on a
      // cancel to explain a real outage) -- it is only the pre-popup position
      // that costs the gesture. So compare positions, not mere presence.
      const popupAt = src.indexOf('signInWithGooglePopup(');
      const awaitedAt = src.search(/await guardProvider\('google'\)/);
      expect(popupAt, `${rel}: no popup call found - re-anchor this gate`).toBeGreaterThan(-1);
      if (awaitedAt > -1) {
        expect(awaitedAt, `${rel}: an awaited gate before the popup costs the user gesture`)
          .toBeGreaterThan(popupAt);
      }
    }
  });

  // And the probe must actually be primed, or the cache is always empty and
  // the gate is decoration that never fires.
  it('every gated surface primes the probe on mount', () => {
    for (const rel of CALL_SITES) {
      const src = readFileSync(join(SRC, rel), 'utf8');
      expect(src, `${rel}: nothing calls primeAuthProviders, so the cache stays empty`)
        .toMatch(/primeAuthProviders\(\)/);
    }
  });

  // ANTI-THEATER: the exact pre-fix source must FAIL this gate.
  it('PROVEN TO CATCH: the 2026-09-11 handler (no pre-flight) fails', () => {
    const preFix = `
  const handleGoogle = async () => {
    setError('');
    setBusy(true);
    let res;
    try {
      res = await signInWithGooglePopup();
    } catch (e) {
      res = { error: { message: 'nope' } };
    }
    setBusy(false);
  };
`;
    const { ok, problems } = checkPreflight(preFix);
    expect(ok).toBe(false);
    expect(problems[0]).toMatch(/without guardProvider/);
  });

  it('PROVEN TO CATCH: a guard placed after the navigation fails', () => {
    const lateGate = `
  const handleGoogle = async () => {
    const res = await signInWithGooglePopup();
    const gate = guardProviderCached('google');
    if (!gate.ok) setError(gate.message);
  };
`;
    const { ok, problems } = checkPreflight(lateGate);
    expect(ok).toBe(false);
    expect(problems[0]).toMatch(/AFTER the flow starts/);
  });
});

// -----------------------------------------------------------------------------
// 5. INFRA GATE — the provider config must live in a FILE, not a dashboard
// -----------------------------------------------------------------------------
// This is the root cause, and the class of bug: a setting that exists only in
// somebody's browser tab does not survive a cutover. Now it is in the compose
// file, and this gate keeps it there.
export function checkGoTrueGoogle(compose) {
  const problems = [];
  const need = [
    'GOTRUE_EXTERNAL_GOOGLE_ENABLED',
    'GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID',
    'GOTRUE_EXTERNAL_GOOGLE_SECRET',
    'GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI',
  ];
  for (const k of need) if (!compose.includes(k)) problems.push(`missing ${k}`);
  // The callback must be the same-origin /sb door. API_EXTERNAL_URL is still
  // loopback, so a derived callback would send the family's browsers to
  // 127.0.0.1 and Google would refuse the redirect_uri outright.
  const m = /GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI:\s*(\S+)/.exec(compose);
  if (m && /API_EXTERNAL_URL|127\.0\.0\.1|localhost/.test(m[1])) {
    problems.push(`redirect URI must not be loopback-derived: ${m[1]}`);
  }
  return { ok: problems.length === 0, problems };
}

describe('infra gate — the sovereign stack carries its own Google config', () => {
  const composePath = join(REPO, 'infra/nas-supabase/docker-compose.yml');

  it('GoTrue is configured for Google in the compose file', () => {
    const { ok, problems } = checkGoTrueGoogle(readFileSync(composePath, 'utf8'));
    expect(ok, problems.join('; ')).toBe(true);
  });

  it('the callback is the same-origin /sb door', () => {
    const compose = readFileSync(composePath, 'utf8');
    expect(compose).toMatch(/GOOGLE_REDIRECT_URI/);
    const install = readFileSync(join(REPO, 'infra/nas-supabase/install.sh'), 'utf8');
    expect(install).toMatch(/GOOGLE_REDIRECT_URI "https:\/\/poetech\.us\/sb\/auth\/v1\/callback"/);
  });

  it('the redirect allow-list covers every app route, not just two', () => {
    // /love-corner is where the church lives; the seeded list named only the
    // root and /poetech-app/, so GoTrue would have refused the return trip and
    // bounced to SITE_URL, silently dropping the popup handshake marker.
    const install = readFileSync(join(REPO, 'infra/nas-supabase/install.sh'), 'utf8');
    expect(install).toMatch(/add_csv_kv ADDITIONAL_REDIRECT_URLS "https:\/\/poetech\.us\/\*\*"/);
  });

  it('Google stays OFF until a credential exists (no half-configured provider)', () => {
    const install = readFileSync(join(REPO, 'infra/nas-supabase/install.sh'), 'utf8');
    expect(install).toMatch(/set_kv GOOGLE_ENABLED "false"/);
  });

  // ANTI-THEATER: the pre-fix compose must FAIL this gate.
  it('PROVEN TO CATCH: the pre-fix auth service (no provider block) fails', () => {
    const preFix = [
      '  auth:',
      '    environment:',
      '      GOTRUE_SITE_URL: ${SITE_URL}',
      '      GOTRUE_JWT_AUD: authenticated',
      '      GOTRUE_SMTP_HOST: ${SMTP_HOST}',
    ].join('\n');
    const { ok, problems } = checkGoTrueGoogle(preFix);
    expect(ok).toBe(false);
    expect(problems.length).toBe(4);
  });

  it('PROVEN TO CATCH: a loopback-derived callback fails', () => {
    const bad = [
      'GOTRUE_EXTERNAL_GOOGLE_ENABLED: ${GOOGLE_ENABLED}',
      'GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}',
      'GOTRUE_EXTERNAL_GOOGLE_SECRET: ${GOOGLE_SECRET}',
      'GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI: ${API_EXTERNAL_URL}/auth/v1/callback',
    ].join('\n');
    const { ok, problems } = checkGoTrueGoogle(bad);
    expect(ok).toBe(false);
    expect(problems[0]).toMatch(/loopback-derived/);
  });
});

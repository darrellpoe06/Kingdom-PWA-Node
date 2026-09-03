// =============================================================================
// Sign-in speaks in our voice, not the vendor's — DR-0303 dimension 3
// =============================================================================
// During the 2026-08-14 lockout the sign-in modal printed the backend's raw
// message to Christina, Shay and Chandra, verbatim:
//
//   "Service for this project is restricted due to the following violations:
//    exceed_egress_quota. The project owner must upgrade their plan or remove
//    spend caps to restore service."
//
// A church member cannot upgrade a plan. The sentence invited them to try, or
// to conclude they had done something wrong, while exposing internal billing
// state to anyone who opened the app.
//
// The bright line these pins hold: translate ONLY what the reader cannot act
// on. A wrong PIN or an unconfirmed email keeps its specific wording, because
// blurring those is its own failure (ANXIETY-CLARITY — every surface answers
// what/when/why/how).
//
// PROVEN-TO-CATCH (DR-0076 §3): reverting any call site to `error.message`
// fails 'no sign-in path renders a raw backend message'; removing the quota
// pattern fails the lockout case; over-translating fails the actionable cases.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { authErrorMessage, isServiceFailure } from '../lib/auth-error-message.js';

const HERE = dirname(fileURLToPath(import.meta.url));

// The exact string the family was shown.
const THE_LOCKOUT = {
  message: 'Service for this project is restricted due to the following violations: '
    + 'exceed_egress_quota. The project owner must upgrade their plan or remove spend caps to restore service.',
};

describe('the 2026-08-14 lockout message', () => {
  it('is recognised as a service failure', () => {
    expect(isServiceFailure(THE_LOCKOUT)).toBe(true);
  });

  it('never reaches the reader', () => {
    const { text } = authErrorMessage(THE_LOCKOUT);
    expect(text).not.toMatch(/exceed_egress_quota/);
    expect(text).not.toMatch(/upgrade/i);
    expect(text).not.toMatch(/spend cap/i);
    expect(text).not.toMatch(/violation/i);
  });

  it('tells the reader the true thing: it is not their fault', () => {
    const { text } = authErrorMessage(THE_LOCKOUT);
    expect(text).toMatch(/our end|on us/i);
    expect(text).toMatch(/nothing you typed was wrong/i);
  });

  it('promises no recovery time, because we do not know one', () => {
    const { text } = authErrorMessage(THE_LOCKOUT);
    expect(text).not.toMatch(/\b\d+\s*(minute|hour|second)/i);
    expect(text).not.toMatch(/shortly|soon as|right back/i);
  });

  it('keeps the raw string for whoever CAN act on it', () => {
    const { detail } = authErrorMessage(THE_LOCKOUT);
    expect(detail).toContain('exceed_egress_quota');
  });
});

describe('service failures by status code, whatever the wording', () => {
  for (const status of [402, 500, 502, 503, 504]) {
    it(`treats HTTP ${status} as ours, not theirs`, () => {
      expect(isServiceFailure({ status, message: 'something opaque' })).toBe(true);
    });
  }

  it('does not treat a 400-class credential error as a service failure', () => {
    expect(isServiceFailure({ status: 400, message: 'Invalid login credentials' })).toBe(false);
  });
});

// The other half of the bright line, and the easier one to get wrong.
describe('a message the reader CAN act on keeps its own words', () => {
  const actionable = [
    'Invalid login credentials',
    'Email not confirmed',
    'User already registered',
    'Password should be at least 8 characters',
  ];
  for (const message of actionable) {
    it(`passes through: "${message}"`, () => {
      const { text, serviceFailure } = authErrorMessage({ message, status: 400 });
      expect(serviceFailure).toBe(false);
      expect(text).toBe(message);
    });
  }

  it('falls back only when the backend said nothing usable', () => {
    expect(authErrorMessage(null, 'Try again.').text).toBe('Try again.');
    expect(authErrorMessage({ message: '' }, 'Try again.').text).toBe('Try again.');
  });
});

// The class-level guard: a new sign-in path must not reintroduce this.
describe('no sign-in path renders a raw backend message', () => {
  const SURFACES = ['../components/PasswordAuth.jsx', '../components/PinGate.jsx'];
  for (const rel of SURFACES) {
    it(`${rel.split('/').pop()} routes backend errors through the translator`, () => {
      const src = readFileSync(join(HERE, rel), 'utf8');
      const raw = src
        .split('\n')
        .map((l, i) => [i + 1, l])
        // `res.error.message` / `error.message` handed straight to setError.
        .filter(([, l]) => /setError\(\s*(?:res\.)?error\.message/.test(l));
      expect(
        raw.map(([n, l]) => `${n}: ${l.trim()}`),
        'these print the vendor string to the reader',
      ).toEqual([]);
      expect(src).toContain('authErrorMessage');
    });
  }
});

// =============================================================================
// 2026-09-03 — Christina's lockout: an error PAGE where JSON belonged
// =============================================================================
// The sovereign transport (poetech.us/sb -> Tailscale Funnel -> NAS) answered
// every sign-in call with Cloudflare's HTML 525 page. supabase-js parses every
// response as JSON, so the sentence on her screen — under "Welcome back", in
// the place reserved for our voice — was the JSON parser's:
//
//   Unexpected token '<', "<!DOCTYPE "... is not valid JSON
//
// It blames nothing, explains nothing, and reads like something SHE broke.
//
// PROVEN-TO-CATCH: removing any HTML/JSON-parse pattern from NOT_YOUR_FAULT,
// or the 52x codes from isServiceFailure, fails these pins.
describe('an HTML error page arriving where JSON was expected', () => {
  // The exact string her phone rendered, plus the same failure as three other
  // engines word it — we must not pin only the browser we happened to see.
  const PARSER_SHAPES = [
    "Unexpected token '<', \"<!DOCTYPE \"... is not valid JSON",
    'JSON Parse error: Unexpected identifier "<"',
    'SyntaxError: Unexpected token < in JSON at position 0',
    'unexpected character at line 1 column 1 of the JSON data',
  ];

  it('is recognised as a service failure, whatever the engine calls it', () => {
    for (const message of PARSER_SHAPES) {
      expect(isServiceFailure(new SyntaxError(message))).toBe(true);
    }
  });

  it('never shows the reader a parser complaint', () => {
    for (const message of PARSER_SHAPES) {
      const { text } = authErrorMessage(new SyntaxError(message));
      expect(text).not.toMatch(/DOCTYPE/i);
      expect(text).not.toMatch(/JSON/i);
      expect(text).not.toMatch(/token|SyntaxError/i);
    }
  });

  it('tells her the truth instead: ours, not hers', () => {
    const { text } = authErrorMessage(new SyntaxError(PARSER_SHAPES[0]));
    expect(text).toMatch(/our end|on us/i);
    expect(text).toMatch(/nothing you typed was wrong/i);
  });

  it('keeps the raw parser text as detail, for whoever can act on it', () => {
    const { detail } = authErrorMessage(new SyntaxError(PARSER_SHAPES[0]));
    expect(detail).toMatch(/DOCTYPE/);
  });

  it('treats Cloudflare 52x (edge cannot reach the origin) as service-side', () => {
    for (const status of [520, 521, 522, 523, 524, 525, 526, 527, 530]) {
      expect(isServiceFailure({ status, message: '' })).toBe(true);
    }
  });

  it('names the transport proxy 502 as service-side too', () => {
    const proxied = { message: 'sovereign-supabase proxy upstream unreachable' };
    expect(isServiceFailure(proxied)).toBe(true);
    expect(authErrorMessage(proxied).text).not.toMatch(/proxy|upstream/i);
  });

  it('still does not over-translate a wrong PIN', () => {
    const actionable = { message: 'Invalid login credentials' };
    expect(isServiceFailure(actionable)).toBe(false);
    expect(authErrorMessage(actionable).text).toBe('Invalid login credentials');
  });
});

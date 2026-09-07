// =============================================================================
// forgot-pin-leads-somewhere — "Forgot your PIN?" ends at a NEW PIN, not the
// same locked door
// =============================================================================
// Measured 2026-09-07 17:00 CDT on Shay's phone: "Welcome back — enter your
// PIN" then "Too many attempts. Please wait 134 seconds." She set that PIN
// on 2026-06-17 and does not have it; the row already carried 8 failed
// attempts, so every wrong try lengthened the wait (0022: 30s doubling to
// 300s). "Forgot your PIN?" signed her out; the next sign-in read
// has_user_pin() = true and opened the same door. The design's no-lockout
// rule (lib/multi-point-auth.js: "re-proves identity and OVERWRITES it") had
// only its first half built.
//
// This file pins the second half: the intent lib, and the wiring in the app
// shell that makes a fresh sign-in open SET-PIN when an intent is pending.
// PROVEN-TO-CATCH: the source pins below fail on the shipped 78f9ca7 shape
// (no intent, ENTER again) — verified by running them against `git show
// origin/main:app/src/poe-financial-mvp-v28.jsx` before this change.
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { markPinResetIntent, hasPinResetIntent, clearPinResetIntent } from '../lib/pin-reset-intent.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const APP = readFileSync(join(ROOT, 'app/src/poe-financial-mvp-v28.jsx'), 'utf8');
const PRIVATE_GATE = readFileSync(join(ROOT, 'app/src/components/PrivateGate.jsx'), 'utf8');
const PIN_GATE = readFileSync(join(ROOT, 'app/src/components/PinGate.jsx'), 'utf8');

describe('pin-reset-intent: bound to one person, survives the sign-out, consumed once', () => {
  beforeEach(() => { try { localStorage.clear(); } catch { /* no storage */ } });

  it('records an intent for the uid that asked, and only that uid reads it', () => {
    expect(markPinResetIntent('u-shay')).toBe(true);
    expect(hasPinResetIntent('u-shay')).toBe(true);
    // A different person signing in on the same phone never inherits it.
    expect(hasPinResetIntent('u-darrell')).toBe(false);
  });

  it('is consumed once a new PIN is set', () => {
    markPinResetIntent('u-shay');
    clearPinResetIntent();
    expect(hasPinResetIntent('u-shay')).toBe(false);
  });

  it('never throws and never grants anything without a uid', () => {
    expect(markPinResetIntent(null)).toBe(false);
    expect(markPinResetIntent('')).toBe(false);
    expect(hasPinResetIntent(null)).toBe(false);
    expect(() => clearPinResetIntent()).not.toThrow();
  });
});

describe('the app shell builds the second half of the no-lockout rule', () => {
  it('Forgot records the intent BEFORE signing out — the order is the whole point', () => {
    const i = APP.indexOf('const handleForgotPin = () => {');
    const body = APP.slice(i, APP.indexOf('};', i));
    const mark = body.indexOf('markPinResetIntent(');
    const out = body.indexOf('signOut()');
    expect(mark).toBeGreaterThan(-1);
    expect(out).toBeGreaterThan(-1);
    expect(mark).toBeLessThan(out);
  });

  it('a fresh sign-in with a pending intent opens SET-PIN, not ENTER', () => {
    expect(APP).toMatch(/const resetPending = h\.backendAvailable && hasPinResetIntent\(uid\)/);
    expect(APP).toMatch(/setMpHasPin\(resetPending \? false : h\.hasPin\)/);
  });

  it('only when the backend answered — a degraded backend keeps the open door', () => {
    // If the PIN backend is unavailable the design opens for the owner
    // (no-lockout). Forcing SET there would trap them on a gate that cannot
    // save. The intent must be conditioned on backendAvailable.
    expect(APP).toMatch(/h\.backendAvailable && hasPinResetIntent/);
  });

  it('setting the new PIN consumes the intent, so the next load is normal', () => {
    const i = APP.indexOf('const handleSetPin = async (pin) => {');
    const body = APP.slice(i, APP.indexOf('return r;', i));
    expect(body).toMatch(/clearPinResetIntent\(\)/);
    expect(body).toMatch(/setMpPinResetPending\(false\)/);
  });

  it('tells the person the truth on the gate: this is a REPLACEMENT, not a first PIN', () => {
    expect(APP).toMatch(/Choose a new PIN/);
    expect(APP).toMatch(/it replaces the one you couldn.t enter/);
  });

  it('the Financial private area has the same way out', () => {
    expect(APP).toMatch(/<PrivateGate area="Financial"[\s\S]{0,160}?onForgot=\{handleForgotPin\}/);
    expect(PRIVATE_GATE).toMatch(/onForgot = null/);
    expect(PRIVATE_GATE).toMatch(/onForgot=\{onForgot \|\| undefined\}/);
  });
});

describe('the PIN box is not a password box to the browser', () => {
  it('asks the password manager to stay out (one-time-code), on both inputs', () => {
    // Chrome ignores autocomplete="off" on type=password and offered the
    // site's saved phone-door PIN over the New PIN box (Darrell, 2026-09-07
    // 17:05). one-time-code is the value password managers honor.
    const n = (PIN_GATE.match(/autoComplete="one-time-code"/g) || []).length;
    expect(n).toBe(2);
    expect(PIN_GATE).not.toMatch(/autoComplete="off"/);
  });
});

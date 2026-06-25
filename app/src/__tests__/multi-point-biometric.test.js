// =============================================================================
// multi-point-auth — biometric as an alternate human-presence factor (2026-06-25)
// =============================================================================
// Fingerprint / Face (WebAuthn) satisfies the SAME presence point as the PIN.
// These tests lock three guarantees:
//   1. A verified biometric grants access exactly like a verified PIN.
//   2. The "pick up the phone" bypass is STILL closed with biometric in play —
//      an enrolled-but-unverified biometric does not grant; presence is owed.
//   3. NO-LOCKOUT holds: every verified user still reaches granted, and a
//      registered biometric never becomes a wall (the PIN is always underneath).
import { describe, it, expect } from 'vitest';
import { decideAccess, NEXT_STEP, POINTS } from '../lib/multi-point-auth.js';

describe('biometric satisfies the presence point', () => {
  it('identity + biometric verified -> granted (2 points), like a PIN', () => {
    const d = decideAccess({
      identityPresent: true, hasPin: true, pinVerified: false,
      hasBiometric: true, biometricVerified: true,
    });
    expect(d.granted).toBe(true);
    expect(d.nextStep).toBe(NEXT_STEP.NONE);
    expect(d.points).toContain(POINTS.BIOMETRIC);
  });

  it('trusted device + biometric verified -> granted (fast path, 3 points)', () => {
    const d = decideAccess({
      identityPresent: true, deviceTrusted: true, hasPin: true,
      hasBiometric: true, biometricVerified: true,
    });
    expect(d.granted).toBe(true);
    expect(d.points).toEqual([POINTS.IDENTITY, POINTS.DEVICE, POINTS.BIOMETRIC]);
    expect(d.pointCount).toBe(3);
  });

  it('a biometric is enrolled but not yet verified -> offer the one-tap unlock', () => {
    const d = decideAccess({
      identityPresent: true, hasPin: true, pinVerified: false, hasBiometric: true,
    });
    expect(d.granted).toBe(false);
    expect(d.nextStep).toBe(NEXT_STEP.ENTER_BIOMETRIC);
  });

  it('no biometric enrolled -> still the plain PIN step (unchanged)', () => {
    const d = decideAccess({ identityPresent: true, hasPin: true, pinVerified: false });
    expect(d.nextStep).toBe(NEXT_STEP.ENTER_PIN);
  });
});

describe('CRITICAL: biometric does NOT reopen the pick-up-the-phone bypass', () => {
  it('trusted device + enrolled biometric but NOTHING verified -> NOT granted', () => {
    const d = decideAccess({
      identityPresent: true, deviceTrusted: true, hasPin: true,
      hasBiometric: true, biometricVerified: false, pinVerified: false,
    });
    expect(d.granted).toBe(false);
    expect(d.nextStep).toBe(NEXT_STEP.ENTER_BIOMETRIC); // must prove presence first
  });
});

describe('PIN stays the mandatory recoverable baseline', () => {
  it('first run with NO pin still routes to SET_PIN even if a biometric could exist', () => {
    // hasBiometric can only become true AFTER a PIN exists (enrollment is offered
    // post-PIN), but even if asked, no PIN => SET_PIN, never biometric-only setup.
    const d = decideAccess({ identityPresent: true, hasPin: false, hasBiometric: true });
    expect(d.nextStep).toBe(NEXT_STEP.SET_PIN);
  });
});

describe('no-lockout holds WITH biometric in the state space', () => {
  // The user can always satisfy the step the system asks for: ENTER_BIOMETRIC is
  // satisfiable by the biometric OR by switching to the PIN (always offered).
  function reachesGranted(start) {
    let s = { ...start };
    for (let i = 0; i < 6; i++) {
      const d = decideAccess(s);
      if (d.granted) return true;
      if (d.nextStep === NEXT_STEP.VERIFY_IDENTITY) return false; // not a verified user
      if (d.nextStep === NEXT_STEP.SET_PIN) { s.hasPin = true; s.pinVerified = true; continue; }
      if (d.nextStep === NEXT_STEP.ENTER_PIN) { s.pinVerified = true; continue; }
      if (d.nextStep === NEXT_STEP.ENTER_BIOMETRIC) {
        // The user may succeed at biometric, OR fall back to the PIN. Model the
        // worst case for lockout: biometric is unavailable, so they use the PIN.
        s.pinVerified = true; continue;
      }
      break;
    }
    return decideAccess(s).granted;
  }

  it('every verified user reaches granted across the full biometric state space', () => {
    const bools = [false, true];
    for (const backendAvailable of bools)
      for (const hasPin of bools)
        for (const pinVerified of bools)
          for (const deviceTrusted of bools)
            for (const hasBiometric of bools)
              for (const biometricVerified of bools) {
                const start = {
                  identityPresent: true, backendAvailable, hasPin, pinVerified,
                  deviceTrusted, hasBiometric, biometricVerified,
                };
                expect(reachesGranted(start), `stranded: ${JSON.stringify(start)}`).toBe(true);
              }
  });

  it('a biometric that never verifies is not a wall — PIN fallback gets in', () => {
    // hasBiometric true, biometric keeps failing (never set verified): following
    // ENTER_BIOMETRIC by using the PIN still converges.
    const start = {
      identityPresent: true, hasPin: true, hasBiometric: true,
      pinVerified: false, biometricVerified: false, backendAvailable: true,
    };
    expect(reachesGranted(start)).toBe(true);
  });
});

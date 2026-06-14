// Multi-point auth decision matrix — 2026-06-14. The >= 2-of-3-points rule is
// security-critical, so every scenario is locked here: identity (P1), device
// trust (P2), PIN (P3), graceful degradation (no-lockout), and the family
// shared-device persona gate ("anyone taps Darrell").
import { describe, it, expect } from 'vitest';
import {
  decideAccess, decidePersonaSelect, shouldIssueDeviceTrust,
  NEXT_STEP, PERSONA_STEP, POINTS, REQUIRED_POINTS,
} from '../lib/multi-point-auth.js';

describe('decideAccess — the >= 2-points gate', () => {
  it('requires 2 points', () => {
    expect(REQUIRED_POINTS).toBe(2);
  });

  it('no identity at all -> must verify identity, not granted', () => {
    const d = decideAccess({ identityPresent: false });
    expect(d.granted).toBe(false);
    expect(d.nextStep).toBe(NEXT_STEP.VERIFY_IDENTITY);
    expect(d.points).toEqual([]);
  });

  it('identity only, no PIN set -> must set a PIN (the 2nd point), not granted', () => {
    const d = decideAccess({ identityPresent: true, hasPin: false });
    expect(d.granted).toBe(false);
    expect(d.nextStep).toBe(NEXT_STEP.SET_PIN);
    expect(d.points).toEqual([POINTS.IDENTITY]);
  });

  it('identity + has PIN but not yet entered -> must enter PIN, not granted', () => {
    const d = decideAccess({ identityPresent: true, hasPin: true, pinVerified: false });
    expect(d.granted).toBe(false);
    expect(d.nextStep).toBe(NEXT_STEP.ENTER_PIN);
  });

  it('identity + PIN verified -> granted (2 points), new device path', () => {
    const d = decideAccess({ identityPresent: true, hasPin: true, pinVerified: true, deviceTrusted: false });
    expect(d.granted).toBe(true);
    expect(d.nextStep).toBe(NEXT_STEP.NONE);
    expect(d.points).toEqual([POINTS.IDENTITY, POINTS.PIN]);
    expect(d.pointCount).toBe(2);
  });

  it('trusted device + PIN verified -> granted (fast path, 3 points incl. identity)', () => {
    const d = decideAccess({ identityPresent: true, hasPin: true, pinVerified: true, deviceTrusted: true });
    expect(d.granted).toBe(true);
    expect(d.points).toEqual([POINTS.IDENTITY, POINTS.DEVICE, POINTS.PIN]);
    expect(d.pointCount).toBe(3);
  });

  it('CRITICAL: trusted device + identity but NO PIN entered -> NOT granted', () => {
    // This is the "anyone picks up the phone" bypass: a persisted session on a
    // trusted device would be identity+device=2 with no human-presence proof.
    // The PIN is mandatory once set, so this must require the PIN.
    const d = decideAccess({ identityPresent: true, hasPin: true, pinVerified: false, deviceTrusted: true });
    expect(d.granted).toBe(false);
    expect(d.nextStep).toBe(NEXT_STEP.ENTER_PIN);
  });

  it('NO-LOCKOUT: backend unavailable -> identity-only access, flagged degraded', () => {
    const d = decideAccess({ identityPresent: true, backendAvailable: false, hasPin: false, pinVerified: false });
    expect(d.granted).toBe(true);
    expect(d.degraded).toBe(true);
    expect(d.nextStep).toBe(NEXT_STEP.NONE);
  });

  it('NO-LOCKOUT: backend unavailable still requires SOME identity', () => {
    const d = decideAccess({ identityPresent: false, backendAvailable: false });
    expect(d.granted).toBe(false);
    expect(d.nextStep).toBe(NEXT_STEP.VERIFY_IDENTITY);
  });

  it('defaults: backendAvailable defaults to true (enforced) when omitted', () => {
    const d = decideAccess({ identityPresent: true, hasPin: true, pinVerified: false });
    expect(d.degraded).toBe(false);
    expect(d.granted).toBe(false);
  });

  // Exhaustive truth table over the enforced (backend-available) path.
  it('full decision matrix (backend available)', () => {
    const rows = [
      // identity, hasPin, pinVerified, deviceTrusted => granted, nextStep
      [false, false, false, false, false, NEXT_STEP.VERIFY_IDENTITY],
      [true,  false, false, false, false, NEXT_STEP.SET_PIN],
      [true,  false, false, true,  false, NEXT_STEP.SET_PIN],
      [true,  true,  false, false, false, NEXT_STEP.ENTER_PIN],
      [true,  true,  false, true,  false, NEXT_STEP.ENTER_PIN],
      [true,  true,  true,  false, true,  NEXT_STEP.NONE],
      [true,  true,  true,  true,  true,  NEXT_STEP.NONE],
    ];
    for (const [identityPresent, hasPin, pinVerified, deviceTrusted, granted, nextStep] of rows) {
      const d = decideAccess({ identityPresent, hasPin, pinVerified, deviceTrusted, backendAvailable: true });
      expect(d.granted, JSON.stringify({ identityPresent, hasPin, pinVerified, deviceTrusted })).toBe(granted);
      expect(d.nextStep, JSON.stringify({ identityPresent, hasPin, pinVerified, deviceTrusted })).toBe(nextStep);
    }
  });
});

describe('shouldIssueDeviceTrust', () => {
  it('issues only on a real grant of an untrusted device', () => {
    const granted = decideAccess({ identityPresent: true, hasPin: true, pinVerified: true });
    expect(shouldIssueDeviceTrust(granted, false)).toBe(true);
  });
  it('does NOT issue if device already trusted', () => {
    const granted = decideAccess({ identityPresent: true, hasPin: true, pinVerified: true, deviceTrusted: true });
    expect(shouldIssueDeviceTrust(granted, true)).toBe(false);
  });
  it('does NOT issue on a degraded (backend-unavailable) grant', () => {
    const degraded = decideAccess({ identityPresent: true, backendAvailable: false });
    expect(shouldIssueDeviceTrust(degraded, false)).toBe(false);
  });
  it('does NOT issue when access not granted', () => {
    const denied = decideAccess({ identityPresent: true, hasPin: true, pinVerified: false });
    expect(shouldIssueDeviceTrust(denied, false)).toBe(false);
  });
});

describe('decidePersonaSelect — family shared-device gate', () => {
  it('persona with a PIN set, not verified -> blocked, must enter persona PIN', () => {
    const d = decidePersonaSelect({ hasPersonaPin: true, personaPinVerified: false });
    expect(d.allowed).toBe(false);
    expect(d.nextStep).toBe(PERSONA_STEP.ENTER_PERSONA_PIN);
  });
  it('persona with a PIN set, verified -> allowed', () => {
    const d = decidePersonaSelect({ hasPersonaPin: true, personaPinVerified: true });
    expect(d.allowed).toBe(true);
    expect(d.nextStep).toBe(PERSONA_STEP.NONE);
  });
  it('NO-LOCKOUT: persona with no PIN configured -> allowed, invited to set one', () => {
    const d = decidePersonaSelect({ hasPersonaPin: false });
    expect(d.allowed).toBe(true);
    expect(d.nextStep).toBe(PERSONA_STEP.SET_PERSONA_PIN);
  });
  it('NO-LOCKOUT: backend unavailable (internal device) -> allowed (UX-only picker)', () => {
    const d = decidePersonaSelect({ hasPersonaPin: true, backendAvailable: false });
    expect(d.allowed).toBe(true);
    expect(d.nextStep).toBe(PERSONA_STEP.NONE);
  });
});

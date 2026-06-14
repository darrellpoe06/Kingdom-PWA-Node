// =============================================================================
// multi-point-auth — the >= 2-of-3-points access decision (Phase 1)
// =============================================================================
// THE RULE (design locked by Darrell): a user needs at least 2 of 3 points to
// get into their space.
//
//   P1 Identity   — signed in via Supabase Auth (email OTP / Google / Apple).
//   P2 Device     — this device holds a valid, non-revoked device-trust token.
//   P3 Knowledge  — the user's PIN has been verified this session.
//
// This module is PURE (no React, no Supabase, no I/O) so the decision is fully
// testable across every scenario. The app feeds it the three observed signals
// plus two facts about the backend, and renders whatever `nextStep` it returns.
//
// WHY PIN IS MANDATORY ONCE SET (the "anyone taps Darrell / picks up the phone"
// fix): a persisted Supabase session on a trusted device would otherwise be
// identity + device = 2 points with NO human-presence proof — exactly the
// pick-up-the-phone threat. So while the headline rule is ">= 2 of 3", the PIN
// is required as one of those points whenever a PIN exists. The only ways in are
// therefore {device + PIN} (fast, returning) or {identity + PIN} (new device),
// which is precisely the locked matrix. A brand-new user with no PIN yet is sent
// to set one (it becomes their second point), never stranded.
//
// NO-LOCKOUT (hard guardrail): identity is always a path back. If the PIN/device
// backend is unavailable (e.g. a Vercel preview running before migration 0022 is
// applied to the cloud DB), the decision DEGRADES to identity-only access rather
// than locking a verified user out. A user who forgets their PIN re-proves
// identity (a fresh OTP/OAuth sign-in) and overwrites it — see lib/pin.js.
// =============================================================================

/** The three access points, by stable key. */
export const POINTS = Object.freeze({
  IDENTITY: 'identity',
  DEVICE: 'device',
  PIN: 'pin',
});

/** UI next-step tokens returned by decideAccess(). */
export const NEXT_STEP = Object.freeze({
  VERIFY_IDENTITY: 'verify-identity', // not signed in — show the sign-in surface
  SET_PIN: 'set-pin',                 // signed in, no PIN yet — must create one
  ENTER_PIN: 'enter-pin',             // signed in, PIN exists — must enter it
  NONE: null,                         // access granted; nothing more to do
});

/** Minimum number of points required for access. */
export const REQUIRED_POINTS = 2;

/**
 * Decide whether the user may enter, and if not, what the next step is.
 *
 * @param {object} s
 * @param {boolean} s.identityPresent   - a Supabase session exists (signed in).
 * @param {boolean} [s.deviceTrusted]   - a valid device-trust token verified.
 * @param {boolean} [s.pinVerified]     - the user's PIN was verified this session.
 * @param {boolean} [s.hasPin]          - the user has a PIN set in the backend.
 * @param {boolean} [s.backendAvailable] - the PIN/device RPCs are reachable.
 *                                         When false, we cannot enforce P3/P2 and
 *                                         degrade to identity-only (no-lockout).
 * @returns {{granted:boolean, points:string[], pointCount:number,
 *            nextStep:(string|null), degraded:boolean, reason:string}}
 */
export function decideAccess(s = {}) {
  const identityPresent = !!s.identityPresent;
  const deviceTrusted = !!s.deviceTrusted;
  const pinVerified = !!s.pinVerified;
  const hasPin = !!s.hasPin;
  const backendAvailable = s.backendAvailable !== false; // default true

  // Identity is the floor: with no session at all there is nothing to count.
  if (!identityPresent) {
    return {
      granted: false,
      points: [],
      pointCount: 0,
      nextStep: NEXT_STEP.VERIFY_IDENTITY,
      degraded: false,
      reason: 'No identity — must sign in (P1) before any point can be earned.',
    };
  }

  // Collect the satisfied points (identity is always one once signed in).
  const points = [POINTS.IDENTITY];
  if (deviceTrusted) points.push(POINTS.DEVICE);
  if (pinVerified) points.push(POINTS.PIN);

  // Graceful degradation: the second-factor backend is unreachable. We cannot
  // verify or even know about a PIN/device, so locking the user out would
  // violate the no-lockout guardrail. Grant on identity alone, flagged degraded
  // so the UI can show a "limited verification" notice.
  if (!backendAvailable) {
    return {
      granted: true,
      points,
      pointCount: points.length,
      nextStep: NEXT_STEP.NONE,
      degraded: true,
      reason: 'Second-factor backend unavailable — identity-only access (no-lockout).',
    };
  }

  // Backend is available and the user has no PIN yet: they have only identity
  // (and possibly device). They must set a PIN — it becomes their second point.
  // This is the new-user / new-device onboarding path; it never strands them.
  if (!hasPin) {
    return {
      granted: false,
      points,
      pointCount: points.length,
      nextStep: NEXT_STEP.SET_PIN,
      degraded: false,
      reason: 'No PIN set — create one to earn the second point.',
    };
  }

  // A PIN exists. It is MANDATORY: identity + device alone (no PIN) is the
  // pick-up-the-phone bypass and is not enough.
  if (!pinVerified) {
    return {
      granted: false,
      points,
      pointCount: points.length,
      nextStep: NEXT_STEP.ENTER_PIN,
      degraded: false,
      reason: 'PIN required (mandatory once set) in addition to identity/device.',
    };
  }

  // PIN verified, plus identity (and maybe device) => at least 2 points.
  const granted = points.length >= REQUIRED_POINTS;
  return {
    granted,
    points,
    pointCount: points.length,
    nextStep: granted ? NEXT_STEP.NONE : NEXT_STEP.ENTER_PIN,
    degraded: false,
    reason: granted
      ? `Access granted with ${points.length} points: ${points.join(' + ')}.`
      : 'Not enough points.',
  };
}

/**
 * After a full multi-point login on an untrusted device, should we mint a
 * device-trust token so next time is the fast path? Only when the user genuinely
 * earned access AND this device is not already trusted.
 */
export function shouldIssueDeviceTrust(decision, deviceAlreadyTrusted) {
  return !!(decision && decision.granted && !decision.degraded && !deviceAlreadyTrusted);
}

// -----------------------------------------------------------------------------
// Family shared-device persona gate — "anyone taps Darrell" fix.
//
// Selecting a family persona (darrell / christina / ...) in the picker requires
// that PERSON's PIN. Decoupled from the per-user PIN above because a shared
// family device may be signed in as one account but used by several people.
// No-lockout: if a persona has no PIN configured yet, selection is ALLOWED (and
// the UI invites setting one) — we never block the family out of their own
// device; the gate switches on once they set persona PINs.
// -----------------------------------------------------------------------------
export const PERSONA_STEP = Object.freeze({
  ENTER_PERSONA_PIN: 'enter-persona-pin',
  SET_PERSONA_PIN: 'set-persona-pin', // optional invite; selection still allowed
  NONE: null,
});

// The real-family personas that the shared-device picker can gate with a PIN.
// 'family' (household roll-up) and the sanitized public personas (Adam/Naomi,
// shown to non-family viewers) are never gated.
export const GATEABLE_PERSONAS = Object.freeze(['darrell', 'christina']);

/**
 * Should selecting `persona` in the picker be PIN-gated? Only when the viewer is
 * a verified family member AND the persona is a real family identity. This is
 * the family-email guard: an outside (non-family) viewer never sees the real
 * personas as gateable, and the household roll-up is always open.
 *
 * @param {string} persona       - the persona id being selected.
 * @param {boolean} isFamilyMember - viewer's email is a verified family email.
 */
export function isPersonaGated(persona, isFamilyMember) {
  return !!isFamilyMember && GATEABLE_PERSONAS.includes(persona);
}

/**
 * @param {object} s
 * @param {boolean} [s.hasPersonaPin]      - this persona has a PIN configured.
 * @param {boolean} [s.personaPinVerified] - the persona PIN was verified.
 * @param {boolean} [s.backendAvailable]   - persona-PIN RPCs reachable.
 * @returns {{allowed:boolean, nextStep:(string|null), reason:string}}
 */
export function decidePersonaSelect(s = {}) {
  const backendAvailable = s.backendAvailable !== false;
  const hasPersonaPin = !!s.hasPersonaPin;
  const personaPinVerified = !!s.personaPinVerified;

  // No persona-PIN backend (e.g. internal LAN/Tailscale family device with no
  // auth session): keep the existing UX-only picker behavior — selection allowed.
  if (!backendAvailable) {
    return { allowed: true, nextStep: PERSONA_STEP.NONE, reason: 'No persona-PIN backend — UX-only picker (internal device).' };
  }
  // Gate not yet configured for this persona: allow, but invite setting a PIN.
  if (!hasPersonaPin) {
    return { allowed: true, nextStep: PERSONA_STEP.SET_PERSONA_PIN, reason: 'No persona PIN set — selection allowed; invite to set one.' };
  }
  // Gate configured: require the persona PIN.
  if (!personaPinVerified) {
    return { allowed: false, nextStep: PERSONA_STEP.ENTER_PERSONA_PIN, reason: 'Persona PIN required to select this family member.' };
  }
  return { allowed: true, nextStep: PERSONA_STEP.NONE, reason: 'Persona PIN verified.' };
}

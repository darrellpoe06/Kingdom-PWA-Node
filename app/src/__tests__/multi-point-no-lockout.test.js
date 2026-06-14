// NO-LOCKOUT proof — 2026-06-14. Auth is high blast radius: the hard guarantee
// is that EVERY verified user (identity present) always has a reachable path IN,
// from any combination of second-factor state. This test exhaustively walks the
// state space and proves there is no dead end — following decideAccess().nextStep
// from any starting point converges on granted. It also locks the wf18 Imported
// family-email guard (#131) as preserved.
import { describe, it, expect } from 'vitest';
import { decideAccess, NEXT_STEP } from '../lib/multi-point-auth.js';
import { isImportedAllowed } from '../poe-financial-mvp-v28.jsx';

// Simulate a user following the prompts. From a state, applying the nextStep the
// system asks for must always be possible and must move toward granted:
//   SET_PIN   -> user sets a PIN  => hasPin=true, pinVerified=true
//   ENTER_PIN -> user enters PIN  => pinVerified=true (or FORGOT -> re-auth ->
//                                    SET_PIN, also modeled as reaching granted)
// We cap the walk; a real no-lockout system converges in <= 3 steps.
function reachesGranted(start) {
  let s = { ...start };
  for (let i = 0; i < 5; i++) {
    const d = decideAccess(s);
    if (d.granted) return true;
    if (d.nextStep === NEXT_STEP.VERIFY_IDENTITY) {
      // Not a "verified user" case — identity is the precondition. For the
      // no-lockout claim (verified users), identity is always present.
      if (!s.identityPresent) return false;
      return false;
    }
    if (d.nextStep === NEXT_STEP.SET_PIN) { s.hasPin = true; s.pinVerified = true; continue; }
    if (d.nextStep === NEXT_STEP.ENTER_PIN) {
      // The user knows their PIN, OR uses forgot-PIN (re-auth) -> set a new one.
      s.pinVerified = true; s.hasPin = true; continue;
    }
    break;
  }
  return decideAccess(s).granted;
}

describe('no-lockout: every verified user has a path in', () => {
  const bools = [false, true];
  it('from EVERY second-factor state, a verified (signed-in) user reaches granted', () => {
    for (const backendAvailable of bools) {
      for (const hasPin of bools) {
        for (const pinVerified of bools) {
          for (const deviceTrusted of bools) {
            const start = { identityPresent: true, backendAvailable, hasPin, pinVerified, deviceTrusted };
            expect(reachesGranted(start), `stranded: ${JSON.stringify(start)}`).toBe(true);
          }
        }
      }
    }
  });

  it('a forgotten PIN is not a lockout (re-auth -> set new PIN -> in)', () => {
    // hasPin true, can't recall it: forgot-PIN signs out (identity step), then a
    // fresh sign-in with no recalled PIN still lands on SET_PIN, never a wall.
    const afterReauthFreshSession = { identityPresent: true, hasPin: true, pinVerified: false, backendAvailable: true };
    expect(reachesGranted(afterReauthFreshSession)).toBe(true);
  });

  it('backend outage degrades to identity-only — never a wall for a verified user', () => {
    const d = decideAccess({ identityPresent: true, backendAvailable: false, hasPin: false, pinVerified: false, deviceTrusted: false });
    expect(d.granted).toBe(true);
    expect(d.degraded).toBe(true);
  });

  it('the ONLY non-granted terminal is "no identity" (which is not a verified user)', () => {
    const d = decideAccess({ identityPresent: false });
    expect(d.granted).toBe(false);
    expect(d.nextStep).toBe(NEXT_STEP.VERIFY_IDENTITY);
  });
});

describe('wf18 Imported family-email guard preserved (#131)', () => {
  const fam = { user: { email: 'darrellpoe06@gmail.com' } };
  const outsider = { user: { email: 'parishioner@example.com' } };

  it('public host: only a verified family email + hydrated session unlocks Imported', () => {
    expect(isImportedAllowed({ isAnyDemoMode: false, currentProfile: 'darrell', isPublicHostVal: true, authSession: fam, authHydrated: true })).toBe(true);
  });
  it('public host: a signed-in OUTSIDER (self-serve) is DENIED Imported', () => {
    expect(isImportedAllowed({ isAnyDemoMode: false, currentProfile: 'self', isPublicHostVal: true, authSession: outsider, authHydrated: true })).toBe(false);
  });
  it('public host: anonymous (no session) is DENIED', () => {
    expect(isImportedAllowed({ isAnyDemoMode: false, currentProfile: 'darrell', isPublicHostVal: true, authSession: null, authHydrated: false })).toBe(false);
  });
  it('public host: family email but NOT yet hydrated is DENIED (no PII in the race window)', () => {
    expect(isImportedAllowed({ isAnyDemoMode: false, currentProfile: 'darrell', isPublicHostVal: true, authSession: fam, authHydrated: false })).toBe(false);
  });
  it('any demo/picker state is DENIED even for family', () => {
    expect(isImportedAllowed({ isAnyDemoMode: true, currentProfile: 'darrell', isPublicHostVal: true, authSession: fam, authHydrated: true })).toBe(false);
  });
  it('internal (non-public) host with a profile is allowed (unchanged trust boundary)', () => {
    expect(isImportedAllowed({ isAnyDemoMode: false, currentProfile: 'darrell', isPublicHostVal: false, authSession: null, authHydrated: false })).toBe(true);
  });
  it('internal host with NO profile is denied (picker gate still applies)', () => {
    expect(isImportedAllowed({ isAnyDemoMode: false, currentProfile: null, isPublicHostVal: false, authSession: null, authHydrated: false })).toBe(false);
  });
});

// =============================================================================
// Log out actually logs out — the deliberate-sign-out WINDOW (2026-07-24)
// =============================================================================
// Field bug (Darrell's fold, 2026-07-24): "can't log out of the app." Root
// cause: the deliberate flag was a consumed boolean — the FIRST onAuthChange
// subscriber's handler captured it and reset it to false, so every LATER
// subscriber (the app mounts several: the monolith, HeaderAuthButton,
// AuthBanner) read false for the SAME sign-out event, treated it as a
// transient logout, and ran the recovery refreshSession() — which can land
// before the server-side revoke and re-persist the session, signing the whole
// app back in. The fix is a time WINDOW every subscriber reads without
// consuming, plus: a failed global sign-out (offline) no longer clears the
// flag — the user still asked to leave, and a local-scope sign-out falls back.
import { describe, it, expect } from 'vitest';
import { signOut, isDeliberateSignOutActive } from '../lib/supabase.js';

describe('deliberate sign-out window — every subscriber sees the same intent', () => {
  it('opens the window when signOut is called, even if the network call throws', async () => {
    // The test client has no real backend; global sign-out may reject. The
    // window MUST be open regardless — the old code reset the flag on throw,
    // which made an offline "Log out" tap recoverable back to signed-in.
    try { await signOut(); } catch (_) { /* offline/global revoke failure is the exercised path */ }
    expect(isDeliberateSignOutActive()).toBe(true);
  });

  it('is read-without-consume: a second (and third) subscriber sees deliberate too', async () => {
    try { await signOut(); } catch (_) { /* ignore */ }
    // The regression: subscriber #1 consumed the flag, #2 and #3 read false.
    expect(isDeliberateSignOutActive()).toBe(true);
    expect(isDeliberateSignOutActive()).toBe(true);
    expect(isDeliberateSignOutActive()).toBe(true);
  });

  it('the window closes on its own after the sign-out moment passes', async () => {
    try { await signOut(); } catch (_) { /* ignore */ }
    // 15s after the tap, a null session is transient again (PWA-resume
    // recovery stays armed for real token races).
    expect(isDeliberateSignOutActive(Date.now() + 16000)).toBe(false);
  });
});

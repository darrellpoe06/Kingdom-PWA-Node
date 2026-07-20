// =============================================================================
// PrivateGate — PIN gate for private areas (Phase A; 2026-06-14)
// =============================================================================
// Wraps a private area (Financial / Legal / Sermons). If the user has set an app
// PIN, the area is locked until they enter it; unlocked once, it stays open for
// the session (private-lock.js). NO-LOCKOUT: no PIN, or the PIN backend
// unavailable -> renders the children (never blocks the authenticated owner).
// Reuses PinGate (the same overlay used at sign-in) and verify_user_pin — the app
// PIN IS the default key (Darrell 2026-06-14). A separate private PIN +
// fingerprint fast-path are Phases B/C in the spec.
//
// onCancel: the area is reached via a tab/view, so the gate offers a way out
// (back to a non-private screen) — without it, a user who opens a private area
// would be stuck on the overlay.
// =============================================================================
import React, { useEffect, useState, useSyncExternalStore } from 'react';
import PinGate from './PinGate.jsx';
import { hasUserPin, verifyUserPin } from '../lib/pin.js';
import { isPrivateUnlocked, subscribePrivateLock, unlockPrivate, privateGateState } from '../lib/private-lock.js';

export default function PrivateGate({ area = 'this area', onCancel, children }) {
  const unlocked = useSyncExternalStore(subscribePrivateLock, isPrivateUnlocked, isPrivateUnlocked);
  const [pinStatus, setPinStatus] = useState({ loaded: false, hasPin: false, backendAvailable: true });
  // Structural NO-BLANK guarantee: the "loading" state renders null, so if the PIN
  // check never resolves (a wedged cross-tab auth lock hangs supabase — the
  // 2026-07-19 blank-Books report) this gate would hide the WHOLE private area
  // forever. A hard deadline flips loading -> no-lockout (open) so the owner's
  // area can never stay blank, independent of why the check stalled. pin.js caps
  // the RPC too (defense in depth); this guarantees the SURFACE regardless.
  const [loadTimedOut, setLoadTimedOut] = useState(false);

  useEffect(() => {
    let alive = true;
    hasUserPin()
      .then((r) => { if (alive) setPinStatus({ loaded: true, hasPin: r.hasPin, backendAvailable: r.backendAvailable }); })
      .catch(() => { if (alive) setPinStatus({ loaded: true, hasPin: false, backendAvailable: false }); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (pinStatus.loaded) return undefined;
    const t = setTimeout(() => setLoadTimedOut(true), 6000);
    return () => clearTimeout(t);
  }, [pinStatus.loaded]);

  const state = privateGateState({
    // On a timed-out check, force "loaded" and report the backend as unavailable —
    // privateGateState opens for the owner (never blocks), so Books renders.
    pinStatusLoaded: pinStatus.loaded || loadTimedOut,
    hasPin: pinStatus.hasPin,
    backendAvailable: loadTimedOut ? false : pinStatus.backendAvailable,
    unlocked,
  });

  if (state === 'open') return children;
  if (state === 'loading') return null; // brief; avoids flashing the gate before we know

  return (
    <PinGate
      mode="enter"
      title="Private area"
      subtitle={`Enter your PIN to open ${area}.`}
      submitLabel="Unlock"
      onCancel={onCancel}
      onSubmit={async (p) => {
        const v = await verifyUserPin(p);
        if (v.ok) unlockPrivate();
        // If the backend is unavailable, don't trap the owner — let them in.
        else if (v.backendAvailable === false) { unlockPrivate(); return { ok: true }; }
        return v; // PinGate renders locked / attempts-remaining / error
      }}
    />
  );
}

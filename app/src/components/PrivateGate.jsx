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

  useEffect(() => {
    let alive = true;
    hasUserPin()
      .then((r) => { if (alive) setPinStatus({ loaded: true, hasPin: r.hasPin, backendAvailable: r.backendAvailable }); })
      .catch(() => { if (alive) setPinStatus({ loaded: true, hasPin: false, backendAvailable: false }); });
    return () => { alive = false; };
  }, []);

  const state = privateGateState({
    pinStatusLoaded: pinStatus.loaded,
    hasPin: pinStatus.hasPin,
    backendAvailable: pinStatus.backendAvailable,
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

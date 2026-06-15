# Private Areas — PIN gate + fingerprint (WebAuthn) fast-path — spec

**Date:** 2026-06-14 · Layer 4 working spec. Declared by Darrell. Folds into the
multi-point-auth system (PR #133 / migration `0022-multi-point-auth`, identity +
device-trust + PIN). Build coordinated with that work — do NOT double-build the
credential plumbing.

## Goal

Lock sensitive areas of the app behind a quick re-auth, so that **a phone left
unlocked, or handed to someone, doesn't expose personal data** — without nagging
the owner. Darrell (2026-06-14): *"same pin for the app unlocks the private
locked locations … unless the user prefers another one because of children and
others who use our phones"* and *"why reauthenticate after if it's the same pin …
unless … someone picked up [your phone] … or you are showing the app to someone."*

## Locked areas (decided)

- **Financial** — Books / Debts / accounts.
- **Legal**.
- **Church sermon documents** (already owner/admin-only; PIN adds a second layer).

(The private cohort / Loved Ones rail was considered; not in this first set.)

## Unlock model

- **Default = the app PIN** (`verify_user_pin`). One PIN opens the app *and* the
  private areas; the user opts in to a **separate private PIN** only if they want
  it (shared phones).
- **Unlock once per session** — entering a private area the first time prompts;
  after that it stays unlocked for the session (in-memory; re-locks on reload /
  app background / sign-out). It guards the entrance, it does not nag.
- **NO-LOCKOUT (hard guardrail, inherited from the auth migration):** if the user
  has **no** PIN set, private areas are **not** gated (never lock anyone out); a
  forgotten PIN is always recoverable by re-signing-in (identity resets the PIN).
  A private-area gate must never be the only path to one's own data.

## Fingerprint / Face ID (WebAuthn) — fast-path

- On the web/PWA, biometrics = **WebAuthn** (drives Touch ID / Face ID / Windows
  Hello / Android fingerprint). The app is a PWA on HTTPS, so it's technically
  ready; **nothing is wired yet**.
- Biometric is a **fast-path on top of the PIN, never a replacement** — the PIN
  is always the fallback (biometric can be unenrolled / unsupported / new device).
- **Shared-phone caveat (important):** device biometric unlocks for **ANY**
  enrolled finger/face on that phone. On a family phone where a child's
  fingerprint is enrolled, biometric would let the *child* open Finances. So:
  - **Personal device → fingerprint** is the win.
  - **Shared device → the separate private PIN** is the correct guard (the owner
    knows it; the child doesn't). Offer biometric, but recommend the separate PIN
    when the user marks a device as shared.
- **iOS installed-PWA quirk:** WebAuthn inside an installed iOS PWA has had edge
  cases (improving in recent iOS) — must be tested on the family's actual devices
  before relying on it; PIN fallback covers any gap.

## Build phases

- **Phase A — PIN gate (no new backend):** a `PrivateGate` wrapper + an in-memory
  session-unlock store. Reuse `has_user_pin` / `verify_user_pin` from `pin.js`
  (read-only). Behavior: no PIN → pass through (no-lockout); PIN set + locked →
  `PinGate` 'enter' → verify → unlock for the session. Wrap the three areas
  (Financial views in the monolith, Legal, the Choir Sermons tab). Financial wrap
  gets extra care + isolated testing (highest lockout-blast-radius).
- **Phase B — opt-in separate private PIN:** a new PIN type in the auth backend
  (a `set_private_pin` / `verify_private_pin` RPC mirroring the persona-pin
  pattern) + a settings toggle "use a separate PIN for private areas." Default
  stays the app PIN. **Coordinate with the multi-point-auth owner** so the
  credential model stays consistent.
- **Phase C — WebAuthn fast-path:** register a platform authenticator per device
  (or reuse a passkey); `navigator.credentials.get()` to unlock a private area,
  PIN as fallback. "Mark this device as shared" disables biometric-for-private and
  steers to the separate PIN.

## Files / surfaces

- New: `app/src/lib/private-lock.js` (session-unlock store + verify wrappers),
  `PrivateGate` component (reuse `PinGate.jsx`).
- Edit: monolith Books/Debts + Legal renders (wrap), `Choir.jsx` Sermons tab (wrap).
- Backend (Phase B/C): new RPCs alongside `0022-multi-point-auth` — owned/coordinated
  with that session.
- Reuse read-only: `app/src/lib/pin.js` (`hasUserPin`, `verifyUserPin`).

## Open questions

- Re-lock trigger besides reload: also on N minutes idle? (default: reload /
  background / sign-out only, to honor "don't nag").
- "Mark device as shared" — per-device setting location (ties to device-trust P2).

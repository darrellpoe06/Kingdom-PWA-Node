# DR-0145 — The door opens itself, and it opens YOUR way: the one tap is the strongest heal, and no one needs a password

- **Status:** accepted
- **Tier:** A/B (a heal-ladder fix proven by tests, a sign-in PRESENTATION reordering over existing audited machinery, a one-line secret-hygiene fix; no new auth backend, no new data class)
- **Scope:** `lib/voice-assignment.js` (standInPitch — the prosody diversifier) + `lib/tts.js` (per-read pitch) + `lib/scripture-voice-cast.js`/`use-cast-read.js` (cast pitch) + `lib/use-read-aloud.js`, `lib/boot-fallback.js` (+`bustReload`) and its tests, `components/PasswordAuth.jsx` (link-first door), `lib/supabase.js` (`sendRoyaltyLink` carries the name), `.github/workflows/corpus-reconcile.yml` (secret whitespace hygiene)
- **Date:** 2026-07-10
- **Principles:** COMMUNITY-FIRST (commitment 2 — no required password-typing), VERIFICATION-DOCTRINE (DR-0076), ANXIETY-CLARITY, PERPETUAL-IMPROVEMENT (DR-0075), APP-IS-PRIMARY, WAYS-REVIEW

## Directive

Darrell, 2026-07-10, live from his phone: *"The one tap refresh doesn't work... I can't even download the PoeTech App unless I have a password... notice I only use my PIN — can I do that only and/or my fingerprint? Some people use email and password, then more like me with a PIN, and some with fingerprints."* And, pressing the standing question a second time in one day: *"Why doesn't the PoeTech App seem like it's self-healing yet?"*

## The verified trace

1. **The one tap was the WEAKEST heal.** By the time the manual screen shows, the ladder has already auto-run a plain reload AND a cache-clear reload — yet the primary button repeated the plain reload that just failed, looping the family back to the same screen. And no rung ever busted the one stale holder `clearAppCaches` cannot touch: an HTTP/edge-cached `index.html`.
2. **No password was ever REQUIRED — but the door led with one.** Installing the PWA has no auth gate at all; password-free sign-in (Google, the emailed Royalty Link) and the full PIN + fingerprint + device-trust machinery (bcrypt-hashed PINs via SECURITY DEFINER RPCs, real WebAuthn platform-authenticator verification, hashed device tokens) were all live — but the visible primary form demanded email + 8-char password, against the binding COMMUNITY-FIRST commitment 2: *"No required password-typing — magic-link or biometric or device-trust where possible."*
3. **The first corpus-reconcile run failed on secret hygiene:** the stored `SUPABASE_DB_URL` carries trailing whitespace; psql asked for a database literally named `postgres\n`. The migrate lane already strips it (`db-migrate-apply.sh:31`); the reconcile workflow now does the same. The channel listing itself SUCCEEDED on the runner — the heal works; the plumbing had a newline.

## Decision

1. **The one tap is the STRONGEST heal.** The manual screen's primary button runs the full clear (service worker + CacheStorage) and then loads a **cache-busted fresh URL** (`bustReload` — a changing `fresh` param defeats the HTTP/edge-cached index; `location.replace` so the stale entry leaves history). The auto ladder's clear rung busts the same way. A plain reload remains only as the labeled secondary. Proven-to-catch: the test fails if the primary tap ever degrades to the bare reload again.
2. **The door opens your way — the link is the default, the password is a choice.** The sign-in surface now leads with name (first time) + email and one button: *"Email me my sign-in link."* No password field exists on the default door. The password form lives behind an explicit *"Prefer a password? Use one."* The link-first door states the promise plainly: *after the first sign-in, this device can unlock with just your PIN or fingerprint* — which the existing multi-point machinery already delivers (identity once, then device-trust + PIN/biometric presence). A first-time link signup still carries the person's name (user metadata via `signInWithOtp`).
3. **PIN-only, answered honestly:** a PIN alone can never be the sole credential — identity is established once (link or Google, no password), then the PIN or fingerprint is all that device ever asks. That is the designed and audited multi-point model (2-of-3 with mandatory presence), not a limitation to apologize for; the change here makes the password-free path the one the family actually meets.
4. **Self-healing, part 2 (the recurring question earns its structural answer):** the instruments and actuators now exist, but every actuator still waits for a HUMAN dispatch by three-brakes design. What makes "it heals itself" come to pass is the governor arming the watched schedules — corpus-reconcile weekly and transcript-backfill hourly, each already carrying budget + lock + kill-switch. Routed as the standing Tier C decision with `re-review: 2026-07-17` — the earliest arming, watched, closes the gap between "the heal exists" and "the heal runs without me photographing the problem."

## Supersedes / pairs

Pairs with COMMUNITY-FIRST commitment 2 (now honored by the visible default, not just the machinery), DR-0135 (the self-healing program this continues), DR-0139 (boot truth; this fixes the manual rung of the ladder that DR-0137 built), the multi-point design (unchanged — presentation only). Supersedes the password-led presentation of the sign-in door.

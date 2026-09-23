# DR-0574 — The key provisions itself before the read

- **Status:** accepted
- **Tier:** B
- **Type:** fix
- **Date:** 2026-09-23
- **Scope:** `app/src/lib/use-read-aloud.js` (asks the family for the key before the first studio attempt); `app/src/components/VoiceStudio.jsx` (asks the moment a signed-in person opens the studio; feeds the answer to the panel); `app/src/lib/voice-system-check.js` (the bridge-key row reports present / provisioned / none and names the one human step only when it is real); `app/src/__tests__/the-key-provisions-itself-before-the-read.test.js` (13 checks, new); `the-studio-is-tried-not-asked-about.test.js` (one pin updated)
- **Principles:** DR-0108 (a stated must-be-by-hand is a premise to challenge), DRIVE-DONT-DELEGATE, VERIFICATION-DOCTRINE (DR-0076), DR-0570 item 3 (the bridge key provisioned by the shell)
- **Grounds:** the reality-trace before building DR-0570's item 3 — *"the bridge key provisioned by the shell"* — which found the provisioning already built and unused where it was needed

---

## What the trace found

DR-0569's bridge-key row ended the voice chain on a chore: *"Provision this device's bridge key."* The trace for building that provisioning in the native shell found it **already built**: `app/src/lib/bridge-provision.js` (2026-08-03, *"Humans don't do anything is our Ways"*) pulls the family key through the RLS-deny-all + `SECURITY DEFINER` RPC pair of migration 0128 (`get_family_bridge_token`, granted to `authenticated`, resolved through `instance_members`, church spaces excluded) into the very `localStorage` slot every NAS read uses.

It was called from **one place**: `Rentals.jsx:1001`. A device that had never opened Real Estate was refused at the studio door with a key it could have had for the asking — and the row told the person to go and get it by hand. That is the DR-0108 class exactly: a "must-be-by-hand" written where a channel already drove it.

## What changed

- **The read asks first.** `use-read-aloud.js`: inside the studio attempt, before `loadReference` and `synthesizeSpeech`, `if (!hasBridgeToken()) await provisionBridgeToken(supabase)`. A signed-out or non-family device gets nothing and falls back honestly, exactly as before; a family device gets its key on the first read it ever tries.
- **The studio asks on open.** `VoiceStudio.jsx`: an effect keyed on `userId` runs the same call and holds the answer (`present` / `provisioned` / `none` / `unknown`) in state, which `buildVoiceChecks` now receives.
- **The row reports, and names the one human step only when it is real.** Signed out → *sign in; a signed-in device asks for itself.* Signed in and answered `none` → *the device asked and got none: either no steward has published the key yet (a steward pastes it once in Real Estate → Photos and every family device picks it up), or this account is not a member of a family space.* Provisioned just now → PASS, and it says so. The word "Provision this device" is gone from every state, and the test proves it.

## Why this is DR-0570 item 3, on the web, and what it does for the shell

The native shell serves the app from `https://localhost`, a distinct origin with its own `localStorage`; a freshly installed local app has no key by definition. This change means the local app provisions its key the same way the browser now does — on the first read, signed in — with no plugin and no second mechanism. A native secure-storage copy remains a later hardening (the key would survive a cleared WebView), not a prerequisite for the read to work. Item 3's date holds for that hardening; its substance is met here.

## Verification

- 13 new checks: Rentals reproduced as the only prior caller; the ask pinned by position between the attempt and `synthesizeSpeech`; the studio's effect and its feed into the panel; `provisionBridgeToken` stores what the RPC returns and reports `provisioned`, skips a device that has the key, stores nothing on `none`; every row state's text, and the old chore absent from all of them.
- One pin from the same evening (`the-studio-is-tried-not-asked-about`) updated from the chore wording to the new behaviour — a deliberate change of behaviour, not a loosened gate.

## Limits, stated

1. **Not yet read on a phone.** The proof is a device that had no key reading in the cloned voice on its first try after sign-in. `re-review: 2026-09-25`, with DR-0570 item 1.
2. **The key still lives in `localStorage`** in both lanes; native secure storage is the hardening this record does not do. `re-review: 2026-10-01` (DR-0570 item 3's date).
3. **The one human step that remains — a steward publishing the key once — is itself still a paste** (Real Estate → Photos). Whether the NAS can publish its own rotated key into `family_secure_config` through the `nas-rotate-bearer` lane is the next DR-0108 question. `re-review: 2026-10-01`.

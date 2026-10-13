# DR-0569 — The studio is tried, not asked about — and the chain gains its missing link

- **Status:** accepted
- **Tier:** B
- **Type:** fix
- **Date:** 2026-09-23
- **Scope:** `app/src/lib/voice-service.js` (`voiceErrorReason`, `isVoiceAuthRefusal`, `speakTimeoutFor`, `mayAttemptStudio`); `app/src/lib/use-read-aloud.js` (the attempt no longer consults the probe; the timeout is sized by it); `app/src/components/VoiceStudio.jsx` (the named reason; the bridge-key row fed from the device); `app/src/lib/voice-system-check.js` (row `bridge-key`; the studio row narrowed); `app/src/__tests__/the-studio-is-tried-not-asked-about.test.js` (20 checks, new); `app/src/__tests__/read-aloud-notice.test.jsx` (one pin scoped to behaviour)
- **Principles:** VERIFICATION-DOCTRINE (DR-0076), SURFACE-SAYS-TRUTH (DR-0239 §3), DR-0440 (ready means ANSWERING), REALITY-TRACE (DR-0061), SPEAK-ESTABLISHED-FACT (DR-0100)
- **Grounds:** Darrell 2026-09-22, four screenshots one minute apart — *All 7 checks pass* at 6:35 and *"The voice studio was unreachable — using the stand-in voice for now"* at 6:36 — then **"Didn't work!!!!!!"**, **"Why not?!!!!!!"**, **"Why does the health matter?!!! Can't we build it to work independently?"**

---

## Two statements, both the app's, both wrong

At 6:35 the **Does it work?** panel (DR-0560) reported every row green. At 6:36 the read said the studio was unreachable. A person reading both is entitled to conclude the app does not know what it is talking about, and on that evening he was right. One design mistake, made twice.

### 1. The panel probed the wrong route

The `studio` row called `GET /health`, which takes no authentication, and reported the studio good. The read calls `POST /speak`, which `infra/voice-studio/voice_forwarder.py` gates on the **family bridge bearer** — a token in `localStorage` that is **per-device by design and never syncs** (`bridgeToken()` in `nas-photos.js`). A device that was never provisioned answers the probe perfectly and is refused at the door. The chain built to name the broken link **had no row for the link that was broken.**

There is now a row: `bridge-key` — *"This device holds the family key the studio requires"* — fed from `hasBridgeToken()` on the device that is actually asking. The `studio` row's detail now says what it can honestly say: the studio *answered its health check*, which *is not the same as a read succeeding — see the key row above.* The test reproduces his screen exactly: every other row PASS, the key row FAIL, which is the only configuration in which "All 7 checks pass" and "unreachable" can appear a minute apart.

### 2. "Unreachable" was the wrong word

`synthesizeSpeech` already returned a **tagged** error — `voice-service-401`, `voice-service-timeout`, `no-voice-sample`, `voice-service-error` — and both call sites threw the tag away for one generic sentence. A 401 is a credential refused by a studio that is *running perfectly*; calling that "unreachable" sends a person to check his network for no reason. Same class as the female-voices copy corrected the same evening (DR-0564): asserting a wrong reason is its own defect.

`voiceErrorReason(tag)` names each one: a 401/403 *refused this device … the key is per-device and never syncs*; a timeout *answered too slowly — it is up*; a missing sample *no voice sample on THIS device*; and only `error` / `no-response` is called *could not be reached at all.* An unknown tag is reported, never swallowed. Both call sites use it.

### 3. The probe had a vote it should never have had

The read path computed `isVoiceServiceReady() && studioHealth !== 'down'` and **refused to even attempt** when the probe said down. That is the worse direction: a health check is a second system that can be wrong about the first, and when it is wrong it silently withholds a working feature. DR-0440 says ready means ANSWERING rather than configured; this takes the rule one step further — **the only thing that proves `/speak` answers is calling `/speak`.**

The gate existed for a real reason: a dark studio made every read sit through the full 45-second timeout. That cost is now paid by **sizing the patience instead of skipping the call** — `speakTimeoutFor(health)` gives a studio last seen dark 6 seconds and a studio last seen answering the full window. The display signal (`sovereignVoiceReady`) still listens to the probe, because saying "answering" when it is not would be the lie DR-0440 forbids; only the *attempt* stopped consulting it.

This is the direct answer to *"Can't we build it to work independently?"* — yes, and it now does: the read tries the studio regardless of what any probe believes, and reports the real reason when the studio says no.

## Verification

- 20 new checks, green: the reason mapping from both sides (a 401 is never "unreachable"; only `error`/`no-response` are), the attempt condition pinned free of the probe, the old condition reproduced as the defect, timeout sizing, and the bridge-key row reproducing his screen.
- One existing pin in `read-aloud-notice.test.jsx` matched the adjacency of two identifiers in the hook's dependency array and broke when the array gained a member; scoped to *"the deps line names `studioHealth`"* — behaviour, not formatting. Fourth time this session a gate caught prose rather than code.
- Full suite on the corrected tree before rebasing: 1162 files, 19,382 passed, 1 skipped. Re-run on the rebased branch before push (the base advanced by #1735, which touched `voice_forwarder.py`); the commit records the second result.

## What his screen already proved, and what it did not

*All 7 checks pass* at 6:35 includes the `consent-row` row. That row is green only when the upsert on `voice_profiles` succeeded on the door he was signed in on — the exact write that DR-0563 / migration 0224 unblocked. **DR-0563's first limit (`re-review: 2026-09-23`) is therefore closed by observation: the migration works on the live database for his row.** Its second limit (are his two doors in `person_links`) is still unread, and stays open.

## Limits, stated

1. **The key row diagnoses; it does not provision.** The fix it names — *Provision this device* — is still the family-bridge step on the NAS side. Until a device is provisioned the read falls back honestly, but it still falls back. Provisioning the key at install is the first native-shell capability (next record). `re-review: 2026-09-30`.
2. **nas-health's `permission denied for table voice_profiles`** remains unexplained; `supabase_admin` holds the grant (read live, DR-0562). Not this record's defect, not closed by it. `re-review: 2026-09-30`.
3. **The 6-second dark-studio window is a judgment, not a measurement.** It is long enough for a cold `/speak` on the tower to answer a 401 and short enough that a genuinely dark studio does not stall a read; neither bound has been measured against the real forwarder. `re-review: 2026-10-07`.

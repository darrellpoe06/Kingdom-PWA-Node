# DR-1555: The voice's answer must be the voice's own, not any ok:true

**Date:** 2026-11-18
**Status:** Accepted
**Tier:** A (a stricter reader probe and a clearer witness line; no schema, no money, no new road)
**Type:** fix
**Area:** `app/src/lib/voice-service.js`, `.github/workflows/voice-health.yml`
**Pairs with:** DR-1538 (my voice on the NAS), DR-0440 (ready means answering), DR-1000 (a 200 is not an answer), DR-0076 (no painted checkmark)

## Context

DR-1538 put My voice on the NAS and gave the witness a public-road step that needs no key. Its first run read what that road actually says.

## What was measured

`voice-health` run 44325812074 (2026-11-18, 14:35Z). Both `https://poetech.tail5a2f35.ts.net/voice/health` and `https://poetech.us/voice/health` returned HTTP 200 with `{"ok": true, "go2rtc": "1.9.14", "streams": 65, "forwarder": "76faac5a4f036820", ...}`.

That is the camera forwarder's health, not the voice's. The Funnel had no `/voice` mount yet: the forwarder's installer mounts it only once the tower or the NAS clone answers ready, and the clone was still downloading. The request fell through to another service.

The reader's probe checked only `ok === true`, so it read this as "the voice is up". This is the same class as 2026-09-23, when n8n's editor page answered the same path. The stranger was different, and the hole was the same.

## Decision

1. **The probe asks whose answer it is.** `isVoiceAnswer(body)` is true only for `ok: true` with `clone: true` (the tower's studio, `infra/voice-studio/server.py`) or a named `engine` (the NAS clone, `nas_clone_server.py`). Every other body reads as down, and the reader keeps its fallback voice.
2. **The witness names the speaker.** The public-road step prints one of three lines per URL: "the voice's own answer"; "NOT the voice: the camera forwarder answered (no /voice mount on the Funnel)"; or "NOT the voice's own answer".

## Verification

- `voice-service-hardening.test.js`: a new case uses the measured camera body and expects `down`. It also checks `isVoiceAnswer` at its edges. **Proven to catch:** with the old `body.ok === true` line restored, this case fails (1 failed, 11 passed); with the fix, it passes.
- `a-200-is-not-an-answer-on-any-road.test.js`: the "still says yes to its own server" case now uses both producers' real shapes, and both read `up`.
- The 12 voice-probe test files pass (129 tests before the new case).
- `re-review: 2026-11-20`, with DR-1538. The next `voice-health` run should name the speaker. The road counts as working when it reads "the voice's own answer" with `engine: nas-clone` and a measured `rtf`.

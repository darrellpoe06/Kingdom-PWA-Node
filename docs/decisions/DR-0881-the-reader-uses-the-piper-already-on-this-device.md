# DR-0881 — The reader uses the Piper already on this device, before the device's own engine

- **Status:** accepted
- **Tier:** B (the reading voice)
- **Date:** 2026-10-10
- **Type:** product (defect + capability)
- **Scope:** `app/src/lib/device-voice-fallback.js` (new, pure policy), `app/src/lib/device-voice.js` (answers in the drop-in shape), `app/src/lib/use-read-aloud.js` (`speakPiece`), `app/src/__tests__/the-reader-uses-the-voice-already-on-the-device.test.js` (new)
- **Principles:** VERIFICATION-DOCTRINE (DR-0076, especially §4 measure and §8 unknown is never green), REALITY-TRACE (DR-0061)
- **Grounds:** **DR-0656** (device-voice, built and explicitly "not wired into the reader yet"), DR-0659 (every piece from the device first), DR-0874/DR-0879 (the TV utterance work this follows), issue #2057 (the live Pages Functions outage)

## The word, as spoken

Darrell, 2026-10-10, on the Firestick:

> "Words keep slurring not articulate or even decernable... we need other
> strategies for making the reader read appropriately....!!!!!!!!!!
> Opportunities and constraints!!!!!!!!!"

## What was measured

**The cause is not the reader, and it was measured rather than guessed.** The
outside-in site probe (`site-health.yml`, DR-0125) reports continuously on
issue #2057, most recently 2026-10-10T16:24Z:

> NO PAGES FUNCTION IS RUNNING — GET poetech.us/automation-status answered
> with 'text/html', the SPA shell, instead of its Function's JSON. When this
> is true EVERY NAS-backed road is dark at once: /sb sign-in, /n8n, /cams,
> /taxes, /openers, /llm, /reviews, **/voice**, /nas-photos, /ways, /scribe.

So `/voice-lite` cannot be reached at all. Piper on the NAS is not sounding
bad — **it never plays.** Every piece errors, and the reading falls through to
Web Speech, which on a Fire TV is Fire OS's own engine. That fall-through is
what he is hearing. The same outage explains his sign-in failure earlier today
(`/sb`) and his cameras (`/cams`); his Wyze camera is live in Wyze's own app.

The probe also measured `served = main = dd62158`, so deploys land correctly —
it is only the Functions that never execute, on the custom domain, on
`poetech-app.pages.dev` and on the per-deployment host alike. Cloudflare-side.

**And the better voice was already on the device, unused.** `device-voice.js`
runs the SAME Piper model the NAS runs — espeak-ng phonemizer in WASM,
onnxruntime-web, phoneme ids measured 10/10 identical to the NAS binary — in a
Web Worker, from Cache Storage, with no network. Its own header has said since
DR-0656: *"Not wired into the reader yet."*

Two fields short of being the drop-in it claimed to be: it returned `url` but
not `blob` (the clip cache keeps the blob) and not `format` (the player asks a
clip its format).

## Impact

Three limits, each real rather than cautious, and each stated because a reader
of this record should be able to tell a constraint from a preference:

1. **Pace 1 only.** The NAS voice is asked to SPEAK faster and the queue
   stretches the remainder. The device worker takes no speed, so a clip it
   made would be filed under a fast key and played without the stretch that
   key implies — the **wrong pace**, which is worse than the wrong voice.
2. **Already downloaded only.** ~63 MB of model plus ~14 MB of runtime is not
   something to pull silently because a reading stumbled. The Voice surface is
   where a person chooses it.
3. **Faster than real time, measured.** Whether a low-power ARM stick runs
   ONNX on single-threaded WASM ahead of its own playback cannot be answered
   from a sandbox. It is measured on the first piece; if the device cannot
   keep ahead it stands down for the session, because stuttering is not an
   improvement on slurring.

What this does NOT do: fix the outage. `/voice` is still dark and that needs a
hand in the Cloudflare dashboard. This makes the reading good on a device that
already holds the model, while it is dark.

## The decision

1. `synthesizeOnDevice` returns `blob`, `format: 'wav'` and `engine:
   'device-voice'` — the shape `synthesizeLite` already answers in.
2. `device-voice-fallback.js` holds the policy as pure functions, so the
   judgement is pinned rather than scattered through the reader.
3. `speakPiece` asks the device voice **after** the NAS piece fails. Taken at
   that seam on purpose: a blob from there flows through the clip cache, the
   join, a saved reading and the background player exactly as a NAS clip does.
   Hooking `onFallback` instead would have needed all of that again.
4. The NAS voice stays first. This is a fallback, not a replacement.

## Outcome

**13 green** on the new gate; **65 green** across `device-voice`, `tts`,
`read-one-full-lesson` and `follow-along-reader`; eslint clean.

The gate pins the POLICY, where the judgement lives: a device at exactly real
time is refused (there is a next piece to make), an unmeasurable device
answers `null` and `null` is not `true` (DR-0076 §8), every non-1 pace is
refused, an undownloaded model is refused, and the stand-down latches.

**Not proven: the Firestick itself.** Whether that hardware clears
`MIN_REALTIME` is exactly what the measurement exists to answer at run time,
and it will answer it on his device, not here. `re-review: 2026-10-17`.

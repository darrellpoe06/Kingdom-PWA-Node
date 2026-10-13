# DR-0559 — It listens to the whole thing: the session cap is sized to the job, not one number for two jobs

- **Status:** accepted
- **Tier:** B
- **Type:** product
- **Date:** 2026-09-22
- **Scope:** `app/src/lib/voice-dictation.js` (new `LONG_FORM_SESSION_CAP_MS` and `capMinutes`; `useVoiceDictation` takes and honours `capMs`; the cap message stops hardcoding five minutes); `app/src/components/OneVoiceInput.jsx` (the opt-in control, the running stop-time, the stated limit); `app/src/__tests__/it-listens-to-the-whole-thing.test.js` (17 checks, new)
- **Principles:** THREE-BRAKES (the brake is sized, never removed), VERIFICATION-DOCTRINE (DR-0076 — a brake that misreports itself), PERPETUAL-IMPROVEMENT (DR-0075), REALITY-TRACE (DR-0061 — the surface states what it can actually hear)
- **Grounds:** Darrell 2026-09-22, screenshot of the Notes box beside a reel playing; DR-0131 (the one-primitive mic); `workflow-scribe`'s recorded 180-minute self-stop

---

## What he said

> "This needs to be able to listen to the whole thing"

— sent with a screenshot of the Thinking Space **Speak** box on one side and an Instagram reel playing on the other.

## What was actually wrong

One microphone is asked to do **two different jobs**, and it had one number for both.

**Dictation** is a person speaking a note into a box. Five minutes is right for it, and `VOICE_SESSION_CAP_MS` is unchanged.

**Listening** is something that *plays* — a reel, a sermon, a class, an interview. Every one of those runs past five minutes, and at five minutes `decideOnEngineEnd` returned `cap`, the session ended, and everything after it was simply not heard. Not a bug in the microphone. A **lid** — the same shape as the sticky lesson title earlier the same day, and the same fix: bound it correctly rather than remove it.

## What shipped

**The cap is sized to the job.** Long-form is `LONG_FORM_SESSION_CAP_MS` — **180 minutes**. That number is not invented here: it is the self-stop `workflow-scribe` already carries for a long capture, so the app's two long-listening paths now stop on one clock instead of on two opinions.

**The brake survives, in all three of its parts.** A live microphone is exactly the class the three-brakes rule governs, so:

- **Hard ceiling** — three hours, and no tap extends it. Tested past the cap and at five hours.
- **Opt-in** — off by default, and it cannot be flipped mid-session, which would change the cap under a clock already running. Every other surface in the app keeps five minutes; nothing starts a three-hour session because somebody touched a mic.
- **Honest** — and here is a defect that was **already present**. The cap message was the literal string `'Paused after 5 minutes'` while `decideOnEngineEnd` had accepted a `capMs` the hook never passed it. The first caller to set a different cap would have been told a time that was not the time. The message now derives from the real cap (`capMinutes`), and while listening the surface says *when it will stop itself*. A brake that misreports itself is worse than a brake nobody can see.

**And the limit is on the screen, before he relies on it.** A web page cannot reach into another app and take its audio. What this has is the microphone — so it hears what is played **out loud**, the way a person in the room hears it, and it hears **nothing** through headphones. That sentence costs one line on the surface; leaving it out costs him a three-hour recording of silence.

## Verification

- **17 new checks**, green. The defect is reproduced directly: a 40-minute sermon returns `cap` under the dictation default and `restart` under the long-form cap, in the same case.
- `capMinutes` is pure, so the sentence a speaker reads is tested without a microphone — including `1 hour` and `1 minute`, because "1 hours" on a brake teaches people to distrust the numbers.
- Existing dictation and input suites re-run green (9 files, 97 checks).

## Limits, stated

1. **This is the microphone, not the tab.** Capturing another *app's* audio directly is not something a web page can do on a phone at all; on desktop `getDisplayMedia` can take tab audio and `workflow-scribe` already does. Joining that path to this control is real work and is not in this change. `re-review: 2026-10-06`.
2. **This is the browser's recognizer, not Whisper.** It produces text through the device's own speech engine, with that engine's accuracy on a reel's compressed audio — which is not the same instrument as the sovereign Whisper path. Nothing here claims transcript quality; it claims the session no longer stops at five minutes. The no-captions fallback through Whisper remains its own item, `re-review: 2026-10-04`.
3. **Only the one-voice input box offers the control.** The other eight surfaces that use this mic are dictation surfaces and keep the five-minute cap deliberately. If a second surface genuinely needs long-form, it opts in the same way; nothing enforces that judgement, and nothing should until there is a second case.

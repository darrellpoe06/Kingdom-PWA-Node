# DR-0439 — The screen stays on while a lesson is open or read, and ▶ Continue when it went dark

- **Status:** accepted
- **Tier:** A (a browser primitive held by two surfaces, a per-device switch, a prompt; no schema, no money, no new external service)
- **Date:** 2026-09-16
- **Type:** product
- **Scope:** `app/src/lib/screen-awake.js` (new — the reference-counted Screen Wake Lock manager and `useScreenAwake`), `app/src/components/TTSControl.jsx` (holds while reading; the switch row; the ▶ Continue prompt; `INTERRUPT_GRACE_MS`), `app/src/components/ChurchLearn.jsx` (holds while a lesson is open; the honest hint on a touch device without the API), `app/src/__tests__/screen-awake.test.js`, `app/src/__tests__/screen-awake-surfaces.test.jsx`
- **Principles:** COMMUNITY-FIRST (a phone in a hand for a 25-minute lesson), THE-APP-IS-THE-PRIMARY-ARTIFACT (DR-0065 — built into the lesson, not a note to go change a setting), VERIFICATION-DOCTRINE (DR-0076 — honest where the browser cannot do it), AUTONOMOUS-AUTOMATION brakes as build requirements (the request has an explicit timeout and a fallback)
- **Grounds:** DR-0264/DR-0265 (the reading pill), the 2026-08-29 return-from-background recovery in `lib/tts.js` (position held, never the top), `lib/reading-position.js` (resume-your-place), DR-0438 (the prompt and the row are chrome and never grow)

## The word, as spoken

Darrell, 2026-09-16:

> "Can we have the system as cellphone user to increase their time limits on the screen use when the Learn and other media tabs are being used... maybe a reminder and a quick click here to adjust the device's screen timeout time... my Zfold 7 allows 10 minutes until it goes black..."
>
> "A prompt to users... so it doesn't cut out their lesson and they can push play and it will continue..."

## What is true about the platform (stated, not guessed)

- A web page **cannot change a phone's screen-timeout setting**, and cannot deep-link into it from Android or iOS. A "quick click here to adjust" that opens Settings is not available to a PWA.
- A web page **can hold the screen on** for as long as it is visible with the **Screen Wake Lock API** (`navigator.wakeLock.request('screen')`): Chrome and Edge on Android and desktop, Samsung Internet, Safari 16.4+ on iPhone/iPad. The OS revokes the lock when the page hides; the page re-requests it when visible again. This is the standard mechanism, already used once in this repo (`lib/workflow-scribe.js`, best-effort for a long recording).
- The reading engine already survives a dark screen in one case: `lib/tts.js` (2026-08-29) re-speaks the held sentence when the page returns to the foreground while the status is still `playing`. What it cannot do is stop the screen going dark in the first place, or offer anything when the reading did not come back.

## The decision

1. **One primitive, reference-counted.** `lib/screen-awake.js` holds a single wake-lock sentinel while **any holder** is active and releases it when none is; it re-requests on `visibilitychange → visible`; it never requests while hidden; a `NotAllowedError` reads as `blocked`, an unsupported browser as `unsupported`, and a request that neither resolves nor rejects within **5 s** as `timeout` — none of them as held. Per-device switch `poe-screen-awake`, **default on** (he asked for the screen to stay on; turning it off is one tap).
2. **Two holders.** The lesson space holds `lesson` while a lesson is open in Learn; the reader holds `read-aloud` while a reading is live (any surface). Two surfaces, one sentinel, no double release.
3. **The switch lives in the Read Aloud panel** — "Keeps the screen on while it reads · On/Off" — the comfort surface the reader already opens. Where the browser has no wake lock the same row says so plainly and names the phone's own setting (Android: Settings → Display → Screen timeout; iPhone: Settings → Display & Brightness → Auto-Lock). The lesson space shows that hint under the lesson bar **only on a touch device without the API**; a laptop is not told about a phone setting.
4. **▶ Continue.** If the page hid while a reading was live and, on return, the engine's own recovery did not bring the reading back within `INTERRUPT_GRACE_MS` (1.5 s), a small chrome prompt appears in the floating stack: *The screen went dark and the reading stopped. ▶ Continue.* Continue resumes a pause, else re-speaks from the held sentence when the follow map exists, else starts the page read. A reader's own pause is never nagged (paused still counts as reading — nothing was lost).

## Proof

- `screen-awake.test.js` (9): support detection; the switch defaults on and persists off; one request for two holders and a release on the last drop; **re-request after the OS revoked on hide** (proven-to-catch); no request while hidden; off releases and on resumes; denied → blocked, unsupported → says so; a hanging request times out at the explicit threshold; a throwing subscriber never breaks the lock.
- `screen-awake-surfaces.test.jsx` (8): the panel row and switch (On → Off persists); the honest row without the API; the reader requests on reading start and releases on stop; the ▶ Continue prompt after hidden-while-reading + gone-on-return (and Continue restarts the read); no prompt when the engine recovered; no prompt when nothing was reading; the lesson-space hint on a touch device without the API, and its absence on a mouse device.
- The chrome-cap suite still holds: the row and the prompt are em-sized inside the capped panel/stack (DR-0438: chrome never grows).

## Boundaries and honest limits

- The wake lock holds only while the page is **visible and in the foreground**. A reader who switches apps still has the background-audio keep-playing path (lib/background-audio.js, DR-0285); this DR is about the screen going dark on a lesson that is on screen.
- Battery: the lock is held only while a lesson is open or a reading is live, and released the moment neither is. The switch is the reader's brake.
- Not measured on Darrell's Z Fold 7 yet — the re-review below is that measurement.
- The browser-support list above is the platform API's documented status as known to the agent; it could NOT be re-verified from this sandbox on 2026-09-16 (MDN and caniuse are egress-blocked), so it is a training-data claim until the phone walk in the re-review confirms it on his device (DR-0076 §8).

## Re-review

- **re-review: 2026-09-23** — on Darrell's phone: open a lesson, leave it untouched past the 10-minute timeout with the switch On; the screen must stay lit. Then switch Off, repeat, let it go dark, return, and confirm ▶ Continue appears and continues from the held sentence. Record both results here.

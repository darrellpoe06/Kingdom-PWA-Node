# DR-0499 — The speed chip never reached the cloud clip

- **Status:** accepted
- **Tier:** B (the reader control every learner touches, on both read paths)
- **Date:** 2026-09-18
- **Type:** fix
- **Scope:** `app/src/lib/clip-rate.js` (new), `app/src/lib/use-read-aloud.js` (both cloud playback sites + a live rate change), `app/src/lib/tts.js` (`MAX_RATE` 3.0 → 5.0, three new steps), `app/src/components/TTSControl.jsx` + `app/src/components/VoiceStudio.jsx` (the speed grids), `app/src/__tests__/the-speed-chip-reaches-the-clip.test.js` (new, 17 checks), `app/src/__tests__/tts-control-chrome-cap.test.jsx` (a hardcoded chip count replaced by the derived one)
- **Principles:** VERIFICATION-DOCTRINE (DR-0076 §1 §3 §4), REALITY-TRACE (DR-0061 / P15), PERPETUAL-IMPROVEMENT (DR-0075)
- **Grounds:** DR-0382 (the System voice reaches the sovereign studio — which is what made this defect the default path), DR-0265 (cloud follow-along), DR-0493 (the streamed-clip highlight, the same two playback sites)

## What he said, and what the code said

Darrell, 2026-09-18, reading the same lesson on two devices: *"Reader speed is different on the laptop vs cellphone... we may need 4.5 or even as high as 5x speed for the laptop... it's slower."*

The obvious reading is "raise the ceiling". Reading the two playback paths first turned up something the ceiling would not have fixed:

- The **device-voice** path honours the rate. `tts.js` binds `utterance.rate` per segment and re-speaks the current segment when the rate changes — that was built deliberately, and it works.
- The **cloud** path — the sovereign studio or the vendor bridge — created the clip as `new Audio(url)` and called `play()`, with **`playbackRate` never touched at all**. Not clamped, not mis-set: never set.

So on that path every speed chip moved the button highlight and changed nothing about the speech. And since DR-0382 the **System voice** reaches the studio, which means the ignoring path is the default nobody changes. One device honouring the rate while the other ignores it **is** "the speed is different on the laptop than the phone" — and no new step at the top of the ladder would have changed a thing on the device that ignores the ladder.

## What ships

**1. The clip takes the rate, and the rate is measured, not assumed.** `clip-rate.js` applies the rate at clip creation and on a live change — an audio element accepts a `playbackRate` change mid-play, unlike an utterance, so the chip is audible immediately — then **reads `playbackRate` back** and reports whether the device honoured it. A device that clamps to 2× says *"This device capped the read at 2×; 5× was asked for."* A device that ignores the rate says so. A working control says nothing. Pitch preservation is set explicitly (`preservesPitch` and both vendor spellings), because at 4× an unpreserved clip stops sounding like words and the new top of the ladder would be useless.

The rate is read from a **ref**, not a render closure. That is the exact stale-closure class `tts.js` was built to kill ("adjusting speed seems like the same speed"), and a clip created inside an async read would otherwise play at the speed selected when the read started.

**2. The ladder reaches 5×.** `MAX_RATE` 3.0 → 5.0, with `3×` (Very fast), `4×` (Rapid) and `5×` (Fastest) added. The reason is not preference, it is that **a nominal rate is not a speed**: every engine has its own baseline words-per-minute, so 2.5× on a desktop voice can be slower than 1.5× on a phone's. A 2.5× ceiling therefore capped the laptop below the pace he reads at while the phone still had headroom. Speed prefs are already per-device localStorage, which is the right shape for exactly this — one number cannot mean one speed on two engines.

**3. Eight chips in even rows.** The control's `grid-cols-5` became `grid-cols-4` (two rows of four rather than five then three), and the Voice Studio's flex row wraps. The panel stays chrome-capped (the large-print law, DR-0242's neighbour) rather than ballooning.

## Proven to catch

17 checks. The first reproduces the defect — an element nobody set a rate on reads 1× however the chips are pressed — so the file fails if the wiring is removed. Then four breaks against the real source, each reverted after: removing `applyClipRate` from one of the two cloud sites (caught — the check counts clips created against clips given a rate, so wiring only one is a failure), handing out the raw `tts.setRate` again (caught), putting `MAX_RATE` back to 3.0 (3 checks failed), and crushing eight chips back into five columns (caught).

**And the pass caught a stale pin of its own**, which is the reason a full verify runs before a claim: `tts-control-chrome-cap.test.jsx` asserted the panel holds exactly **five** speed chips. Eight are correct now, so the assertion was re-derived from `RATE_STEPS` and each step's label is checked present — a typed count tests the number rather than the panel, and it goes stale the moment the thing it guards improves.

The device-behaviour cases are exercised with stand-in elements rather than claims: one that honours the rate, one that clamps to 2×, one that clamps to 1×, one whose setter throws, and one that will not even report a rate. Each has the message a reader would actually see pinned to it.

## What is NOT closed, named honestly

**Which path each of his two devices is on is still unmeasured.** This sandbox has no route to poetech.us and cannot read his laptop's voice list, so whether the laptop was on the cloud path (in which case the clip fix is what he will feel) or on a slow desktop engine (in which case the 5× ladder is) is an open question the fix does not need answered — both are now right. The app should say which path is carrying a read rather than leaving him to infer it from the speed, and that is the next item, not a claim made here.

**A measured words-per-minute per device** would turn "different on the laptop" into a number on the screen. Worth building, not built here. **re-review: 2026-10-02.**

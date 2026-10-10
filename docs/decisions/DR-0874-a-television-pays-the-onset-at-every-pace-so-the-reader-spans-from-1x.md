# DR-0874 — A television pays the onset at every pace, so the reader spans from 1x

- **Status:** accepted
- **Tier:** B (the reading voice; the surface elderly and tech-novice members depend on)
- **Date:** 2026-10-10
- **Type:** product (defect)
- **Scope:** `app/src/lib/tts.js` (`utteranceSpan` gains `tv`, `TV_SPAN_CHARS`, `TV_START_WATCHDOG_MS`, engine reads `isTvDocument`), `app/src/__tests__/the-reader-does-not-stall-on-a-television.test.js` (new)
- **Principles:** VERIFICATION-DOCTRINE (DR-0076, including §8 — the unmeasured half is marked unmeasured), COMMUNITY-FIRST-MISSION
- **Grounds:** DR-0657 (a TV is known by its user agent; `tv-device.js`), DR-0381 (cut where a person breathes), the 2026-10-07 fast-speech mumble fix that built `utteranceSpan`

## The word, as spoken

Darrell, 2026-10-10, on the Firestick:

> "Firestick reader is slow... timing seems an issue... takes long pauses
> in-between sentences.... and can't full say the sentences without slowing
> and pauses unnecessarily... fix it... too..."

## What was measured

Traced in `tts.js`. Two distinct faults sit behind that one sentence.

**1. An onset between every clause.** Since DR-0381 the reader cuts text where
a person breathes, and each clause becomes its own utterance so a speed change
can restart just the current one. Every utterance costs the engine an ONSET —
the queue gap before it speaks. On a phone at 1x that gap reads as a breath.
On a Fire TV — a low-power stick running Amazon's engine — the same gap is
long enough to be a stall, and it lands between every clause rather than every
sentence.

**This had already been solved, and keyed to the wrong thing.** The
2026-10-07 mumble fix ("the voice mumbles at times when on faster speaking")
built `utteranceSpan`, which joins consecutive segments into one utterance when
the cuts come too close together — but gated it on `rate >= RATE_SPAN_FROM`
(1.5). On a television the cuts are too close together at *any* rate, because
what is slow is the **device**, not the speech. So the fix existed and never
ran at the one pace most people use.

**2. A watchdog that can cut a sentence it was about to hear.**
`START_WATCHDOG_MS` is 1400. If `onstart` has not fired and `synth.speaking`
is false by then, the engine calls `_restartCurrent()`. A slow stick can still
be in its onset ramp at 1400ms with nothing actually wrong — and the restart
is heard as a sentence starting, stopping, and beginning again. That is the
"can't full say the sentences" half.

## Impact

Honest split, because the two halves do not carry the same weight of evidence:

- The **span** fault is read directly off the code and its arithmetic, and the
  behaviour change is pinned by tests that fail on the previous version.
- The **watchdog** fault is **reasoned from the code path, not measured on the
  device.** There is no Fire TV in this sandbox and no instrumentation of real
  onset latency, so "1400ms is too tight for that engine" is a well-founded
  inference, not a measurement. It is marked as such in the source comment and
  here (DR-0076 §8).

What this obligates: the watchdog's guarantee must survive. Doubling the beat
on a TV still surfaces a genuinely dead button inside three seconds, so "never
a dead, silent button" holds — it is a longer beat, not a removed one.

## The decision

1. **`utteranceSpan` takes `tv`** and spans from any rate when set, with a
   budget of `TV_SPAN_CHARS` (540) — roughly three clauses, enough that onsets
   become rare, and clear of `MAX_SPAN_CHARS` (600) so Chrome's long-utterance
   cutoff is never approached.
2. **A phone is untouched.** Below 1.5x without `tv`, the span is still exactly
   1, so the rate-restart behaviour everything else is built on does not move.
3. **The segments themselves never change.** The follow map, the highlight and
   the paragraph steps still see one sentence each; the engine advances the
   segment index from the word boundaries inside the utterance. A TV and a
   phone produce identical `segmentText` output.
4. **The engine asks `isTvDocument()`** — the same `<html data-device="tv">`
   mark the CSS and the remote's navigation read (DR-0657). One question, one
   place. Injectable, so the behaviour is testable without a Fire TV.
5. **`TV_START_WATCHDOG_MS` (2800)** on a television only.

## Outcome

`the-reader-does-not-stall-on-a-television.test.js` — **11 green**. The first
case is proven-to-catch by construction: it asserts a TV spans more than one
clause at 1x, which the previous `utteranceSpan` could not do at any rate below
1.5 (it ignored the option and returned 1). Also pinned: a phone unchanged
across 0.5–1.4x, a phone still spanning at 1.5x, the span never exceeding
`MAX_SPAN_CHARS` or `MAX_SPAN_SEGMENTS` at any rate on either device, an
over-long single clause still spoken rather than dropped, and the engine
reading the TV mark from the document.

Reader suites re-run together: **55 green** (`tts`, `follow-along-reader`,
`follow-along-sync`, `read-one-full-lesson`, `one-reading-owns-the-voice`,
`tts-control-chrome-cap`). eslint clean.

**Not proven: the Firestick itself.** Both changes are correct by the code's
own arithmetic and leave every other device byte-identical, but whether the
reading now sounds right in his living room can only be answered there.
Darrell hears it next. `re-review: 2026-10-17`.

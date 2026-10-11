---
id: DR-0969
title: The progress line says what is being spent — and the wait explains itself while you wait
date: 2026-10-11
status: accepted
supersedes: []
superseded-by: null
tier: B
entities: [poetech]
grounds: [REALITY-TRACE, VERIFICATION-DOCTRINE, SURFACE-SAYS-TRUTH, PERPETUAL-IMPROVEMENT]
source: 2026-10-11 — Darrell, on "100 of 386 pieces · 1.8 MB"
---

## Context

Darrell, 2026-10-11, looking at **"Saving for listening offline: 100 of 386
pieces · 1.8 MB"** with the bar crawling:

> "Why is downloading lesson so long with only mb of data?!!!!!!!!!!"

The same screenshot carried the other half of the picture: *"My voice (Darrell)
is not reading yet: the voice studio that turns your recording into new speech
(the 4070 tower) is not answering."* So the church computer's stand-in voice
was making all 386 pieces alone.

**The question was invited by the line itself.** It is a fair reading of what
the screen said, not a misunderstanding to be explained away.

## What was measured

| Fact | Value | Source |
|---|---|---|
| Pieces | 386 separate speech syntheses, one sentence each | `lesson-downloads.js:510-519` |
| Speed | **19.7 characters a second** on one stream | `lesson-downloads.js:58-67` — probe run 36926132891, six pieces / 861 chars / 43.7 s, outside-in through poetech.us |
| Streams | **two** | `lesson-downloads.js:587`, `await Promise.all([worker(), worker()])` |
| Bytes | Opus at 24 kbit/s ≈ **299 bytes a character** | `lesson-downloads.js:193-194` (DR-0747) |

386 × ~87.4 characters ≈ 33,700 characters ÷ (19.7 × 2) ≈ **14 minutes**, over
which 1.8 MB is about **2 kB a second**. It is not a download. The megabytes
are the one quantity *not* being spent, and they are small because Opus speech
is small.

**THE OBVIOUS FIX WAS WRONG, AND MEASURING IT IS WHY IT DID NOT SHIP.** The
first move considered was raising the two workers to four.
`infra/nas-voice-lite/voice_lite_server.py:79` sets `MAX_INFLIGHT = 2` (env
`VOICE_LITE_MAX_INFLIGHT`) and line 402 returns **`503 busy` immediately** past
it; `nasPiece` (`lesson-downloads.js:468-471`) then sleeps 600 / 1200 / 1800 /
2400 ms per 503. The client's two matches the server's cap exactly, so four
workers would earn backoff, not throughput — **slower, measurably.** P65:
measure before you throttle. The real lever is the NAS's own cap and the cores
behind it, and it must move *there* first; the client constant follows, never
leads.

**And the surface defect, which is the part that was actually fixable here.**
DR-0746 had already written the sentence that answers him — *"the reading voice
is made on the church computer as this runs, about as fast as it is spoken"* —
and then guarded it with **`!running`**. So the one explanation of why this is
slow was on screen only *before* the start and **vanished at the exact moment
somebody sits watching a crawling bar.** That is when the question gets asked.

## Impact

The cost of the old line is not confusion; it is **lost trust in a working
system.** A reader who sees `1.8 MB` beside a fourteen-minute wait concludes
the app is broken, and the reasonable next actions are all wrong: cancel it,
retry it, report a bug, or stop using offline saving — the feature that makes
lessons work where there is no signal. Nothing was broken; the screen simply
described the wrong quantity.

It also hid a real limit behind a false one. "Slow because of megabytes" is not
actionable by anybody. "Slow because 386 sentences are being spoken two at a
time on the church computer" points at the NAS's `MAX_INFLIGHT` and its cores —
the thing that could genuinely be raised.

Reversible: one word added to a byte count, one paragraph that renders while
running, one explanatory comment on a constant. No behaviour, no storage, no
schema, no network change.

## Decision

1. **The bytes say they were *made*** — `1.8 MB made`, not `1.8 MB`. One word
   turns a transfer size into a measure of work completed. The number is
   unchanged.
2. **The wait explains itself while it runs** (`download-why-slow`): *"Not a
   download: each of these 386 pieces is a sentence the church computer speaks
   out loud, 2 at a time. The megabytes are small because speech is small; the
   time is the making."* The piece count and the stream count are read from
   live state and `DOWNLOAD_STREAMS`, never written as prose.
3. **The two never show at once.** The pre-start pace line keeps its `!running`
   guard and the new paragraph is `running`-only, so the screen does not say
   two things about one subject (DR-0947's rule).
4. **`DOWNLOAD_STREAMS` carries its measurement in a comment** — including why
   raising it alone makes things slower, so the next person to reach for it
   finds the NAS cap first.
5. **NOT decided:** raising `VOICE_LITE_MAX_INFLIGHT`. It needs the NAS's core
   count, which this sandbox has no route to measure, and it is a NAS-side
   change with its own cost. `re-review: 2026-10-18`.
6. **NOT decided:** anything about the 4070 tower not answering. That is a
   separate, already-surfaced state with its own honest message on screen.

## Verification

- `the-progress-line-says-what-is-being-spent.test.js` — **9 tests**, pure: the
  labelled bytes, the piece count, a zero-byte run saying nothing rather than
  `0 B`, a words-only run mentioning neither, the measured pace arithmetic on
  *his* 386 pieces (12–18 minutes, under 4 kB/s), per-stream scaling, and the
  paused case not claiming a pace.
- `the-wait-explains-itself-while-waiting.test.jsx` — **4 tests**, mounted and
  clicked through a real `DownloadPanel` with a fetch that hangs after two
  pieces so the run stays *running* while the assertions look at it.
- **Proven-to-catch, measured both rungs:**

  | Mutation | Result |
  |---|---|
  | The bare byte count returns (**the exact line he read**) | **1 failed / 8 passed** |
  | The running explanation never renders (the state before this DR) | **3 failed / 1 passed** |

  Restored: 9 + 4 pass.
- **THE RENDER TEST HAD TO BE FIXED BEFORE IT COULD BE BELIEVED.** Its first
  version failed two of four cases on `Cannot read properties of null`, in
  **perfect alternation** — pass, fail, pass, fail. That pattern was the
  diagnosis: not flakiness, but leakage with a period of one. The teardown
  released the hung fetch and unmounted *synchronously*, never letting the run
  drain, so `runDownload`'s module-level state (the saved job, the intake hold)
  stayed set and poisoned exactly the next test, whose own teardown then
  cleared it. Fixed by draining in `afterEach` and by waits that name what
  never appeared. A test that fails on a race would have been "fixed" by
  deleting an assertion.
- **Not proven from this sandbox:** the new paragraph under his thumb on a
  phone mid-download. It ships with the deploy and is checked on the live build
  per DR-0104. `re-review: 2026-10-13`.

## Links

[DR-0746] (the pace and the per-piece bar this corrects — it wrote the right
sentence and guarded it with `!running`), [DR-0747] (Opus, why the bytes are
small), [DR-0659] (the measured bytes per piece), [DR-0947] (a screen must not
contradict itself), `voice_lite_server.py:79,402` (`MAX_INFLIGHT = 2` and the
immediate 503 — the measurement that killed the obvious fix).

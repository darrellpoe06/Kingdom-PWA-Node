---
id: DR-0278
title: The follow-along highlight never painted on any device — and a VISIBLE promise is proven by a browser we already have, never deferred to the reader's eyes
status: accepted
date: 2026-08-06
tier: A
declared_by: Darrell ("when having the reader feature highlighted words are not occurring in the app... comprehensive review of our Ways and documentation and procedures")
builds_on: [DR-0264 (follow-along), DR-0265 (the constraints closed), DR-0076 (verification doctrine), DR-0108 (review our ways), DR-0219 (SHOULD-then-prove), DR-0239 (comprehensive standard)]
principles: [VERIFICATION-DOCTRINE, WAYS-REVIEW, COMMUNITY-FIRST, PERPETUAL-IMPROVEMENT, SPEAK-ESTABLISHED-FACT]
---

## Directive

Darrell, 2026-08-06, with two screenshots of a lesson mid-read: **"when having
the reader feature highlighted words are not occurring in the app... Comprehensive
review of our Ways and documentation and procedures."** Then, before any work had
been done: **"did you actually review the Ways and documentation fully?"** — the
honest answer at that moment was no, and this record exists because the answer to
that question has to be provable, not asserted.

## The defect — total, silent, and green the whole time

The follow-along highlight **never painted, on any device, on any read path, for
the entire life of the feature** (DR-0264 through today). Not a device quirk, not
an Android engine gap, not the cloud-voice path. One missing default:

```js
function setNamed(name, range, win) {          // no default for `win`
  if (!supportsHighlight(win)) return false;   // supportsHighlight HAS its own → true
  win.CSS.highlights.set(...)                  // win is undefined → TypeError
  } catch (_) { return false; }                // swallowed, silently
```

Every call site in `TTSControl.jsx` omits the argument (`highlightSegment(r)`).
So `supportsHighlight(undefined)` applied **its own** default and answered about
the real window — *yes, this browser supports highlighting* — and then the paint
dereferenced `undefined`, threw, and returned false into a bare catch. The
support probe and the paint were reading **two different windows**. Nothing
logged, nothing failed, nothing surfaced. `clearReadingHighlights` had the
default, so no highlight ever appeared stuck either — the feature looked simply
absent.

`followRange` never touches `win`, so the auto-scroll **did** work. The page
moved with the reading while nothing lit up — exactly what the screenshots show.

## Why every gate stayed green (the real finding)

`read-follow.test.js` ran in jsdom, which has **no CSS Custom Highlight API**. Its
one highlight pin asserted the helpers *no-op without crashing where the API is
absent* — and that is precisely what they did on real hardware too. **The test
passed for the wrong reason.** It could only ever exercise the unsupported
branch; the supported branch — the only one a reader ever meets — was never
executed by anything, anywhere, before it reached a phone.

This is the DR-0076 §3 anti-theater failure in its purest form: eight pins, all
green, none of them capable of catching the defect they were written to guard.
A gate whose environment cannot reach the code path is not a gate.

## The Ways correction (DR-0108) — a split that was never made

DR-0264:56 and DR-0265:60-61 both deferred the proof to *"the ear-and-eye pass on
real hardware"* / *"the live witness."* DR-0138:31 records the true constraint
behind that habit: **"the sandbox cannot hear audio."**

That is a real limit — and it is a limit on **audio only.** The follow-along
feature is two promises, and they were classified as one:

| The promise | Who can prove it | What we did |
|---|---|---|
| It **speaks** in the chosen voice | needs ears — genuinely Darrell's DR-0104 pass | correctly deferred |
| The words **change color** | needs a browser — we run Chromium in CI already | *also* deferred — wrongly |

The visual half rode the audio half's exemption for free. **A stated "only a human
can verify this" is an unverified premise to challenge (DR-0108 question 2), and
this one was false.** The proof cost one headless browser and a screenshot diff —
both already installed, already used by `chrome-layout-probe.mjs` and
`sw-nav-check.mjs` on every CI run. Nothing was missing but the asking.

**Binding, from here:** when a feature's promise is *visible*, the proof is a
rendered-pixel check in CI. Deferring a visible promise to the reader's eyes is
not humility about the sandbox — it is an unproven claim wearing humility's
clothes. Only what the sandbox genuinely cannot sense (sound, a physical device,
a real credential) is the human's pass.

## The false claim in the record, corrected

`REVIEWS.md` REV-0225 closed with a **prediction stated as a resolution**:

> "his tap was 'Read this lesson' — the one path that had no follow in the
> deployed build; **THIS batch is that fix, so highlights appear after this
> deploy + one fresh reload.**"

That could not have come true. The path diagnosis was right; the conclusion was
wrong, because *no* path could paint. Darrell reloaded, saw nothing, and the
record told him he should have. Under DR-0100 an under-claim and an over-claim
are the same failure — the correction is written inline where a reader meets it
(REV-0225, DR-0264, DR-0265), not only here.

## Fixed

1. **`setNamed` carries the same `win` default as `supportsHighlight`** — the
   support probe and the paint now read the same window. One line; the whole
   feature turns on: sentence wash, word-level karaoke, all read paths, every
   device with a current browser.
2. **"Start where I tap" now collapses the panel like every other read path.**
   The tap-to-start branches never called `setMinimized(true)`, so the card sat
   on top of the very words it had just highlighted — visible in both
   screenshots, and the exact complaint DR-0265 §4 was written to close.
3. **The `builds_on` audit trail is corrected.** DR-0264, DR-0265 and both
   INDEX rows cited **DR-0144** ("the choir room holds Sundays") as "start where
   I tap". The real record is **DR-0147**. A governance record pointing at the
   wrong governance record is a first-rank defect in the trail (DR-0239 dim 3).

## Gate-the-class (DR-0076 §2, DR-0239 dim 7)

`scripts/read-highlight-probe.mjs` — a new standing instrument, wired into
`ci.yml` beside the layout probe. It loads the **real** module and the **real**
`::highlight` rules read out of `app/src/index.css` (never retyped — a probe
carrying its own copy would pass while the app's CSS was broken) into a real
Chromium, and asserts with the **exact call shape `TTSControl` makes**:

- `highlightSegment(range)` returns true and registers the highlight, **and the
  sentence CHANGES PIXELS** (screenshot diff);
- `highlightWord(range)` maps to the exact spoken word **and CHANGES PIXELS**;
- `clearReadingHighlights()` restores the page pixel-identically.

Pixels are the assertion on purpose: a return value can be true while the CSS
never matches. Only a screenshot diff proves the reader *sees* it.

**Proven-to-catch, both halves.** `--selftest-break` strips the `win` default back
out of the bundled module — the exact shipped defect — and **requires** the paint
checks to fail; CI runs it before the real pass. Measured today against the
broken build: `5/10 — pixels identical, the reader sees nothing`. Against the
fix: `10/10 — pixels changed`. The unit suite also gained four pins that stand a
fake Highlight API up in jsdom, so the supported branch is exercised there too
(13 green, red when the default is reverted).

## The honest remainder

- **Word boundaries on device voices** stay engine-dependent (many Android voices
  never fire them). Unchanged platform fact; the sentence wash is the universal
  floor — and it is now *actually* painting, which it never was.
- **Per-word timing on cloned-voice (cloud) audio** still needs the sovereign
  voice studio to return timestamps. `re-review: 2026-08-24` (unchanged).
- **The ear pass — does it sound right, at a 6-year-old's pace — remains
  Darrell's**, and is now the *only* part of this feature that is. That is the
  correct residue, not a catch-all.
- **Present-mode follow-along** (the projected window must build its own map)
  stays carried at `re-review: 2026-08-24` per DR-0264.
- **`DR-0147:29` resume-where-you-left-off reading** is past due (`re-review:
  2026-07-31`) with no closing record — surfaced by this sweep, carried to
  `re-review: 2026-08-20`.

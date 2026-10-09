# DR-0768 — A recording that is not a lesson can say so, and stop

**Date:** 2026-10-06
**Status:** accepted
**Area:** in-app lesson intake, the NAS lesson builder
**Principle:** DR-0611 (spoken lessons), DR-0098 (teach the Word, do not debate it), DR-0076 (proven-to-catch), DR-0621 (hold the hand of the process), DR-0065 (the app is the primary artifact)

## Context

Darrell's recorder inside the app had **one destination**. Everything spoken
into it became a row tagged `lesson`, and every such row is a lesson the intake
or the NAS builder is expected to build.

On 2026-10-06 Christyn read her homework into it. Whisper wrote the words as
transcript row `79c29dc9`, named `Christyn's Homework`: 4,069 words of a school
passage about Désiré Charnay's expeditions in Central America, closing with the
textbook's retelling of the Maya creation account from the Popol Vuh. Seven
voices marked `S1` through `S7`, none named; no `DP` mark, no `BG` mark, no
teacher identified anywhere in it.

The NAS builder's own gate refused it, correctly, with
`cli-local structure failed (verdict must be lesson …)`. But the only verdict
`inbox-lesson-tag.yml` could write was *shipped as a lesson*, which requires a
`lesson_id` and a `pr` that do not exist. So there was no way to mark the row
done, and the builder claimed it, failed it, released it and claimed it again.

Three separate things were wrong at once, and only one of them is a bug. The
gate was right to refuse the row. The row was wrong to be a lesson row. And the
road had no way to record either fact.

## What was measured

- **The loop, from the row's own build tags:** claimed 21:51:18, released
  21:54:11 (`build-reason:the build that held it was gone`), claimed 21:54:12,
  released 22:02:55, claimed 22:02:55, released 22:17:04, claimed 22:17:04,
  released 22:32:04, claimed 22:32:04, then `written@22:45:29`,
  `gated@22:45:29`, `failed@22:45:29`. **Six claims in 54 minutes**, each one
  spending NAS compute on material its own gate would never pass. By 23:06 the
  row carried `build-failed` AND `lesson-building` at the same time, and the
  second recording `7ce13700` was on the same path.
- **What the row actually holds**, read through the fixed road (DR-0767, run
  `37544218320`): 24,467 bytes, round-trip matching the database, md5
  `8e228fdecdc97037f2609a32e5af0824`. 4,069 words. `whisper:nas-cpu`, 28:25.
  Speaker marks counted: `S2` eight times, `S5` three, `S3` twice, `S1`, `S4`,
  `S6`, `S7` once each. **Zero `DP` marks and zero `BG` marks** — nobody is
  identified as teaching.
- **Why it could not be marked done:** `inbox-lesson-tag.yml` validated
  `lesson_id` against `^[a-z0-9][a-z0-9-]{1,200}$` and `pr` against
  `^[0-9]{1,6}$`, both `required: true`. There was no input, and no tag, for
  "this turned out not to be a lesson".
- **Why `lesson-captured` is the tag that stops it:** every waiting query reads
  `where tags ? 'lesson' and not (tags ? 'lesson-captured') and not (tags ?
  'lesson-building') and not (tags ? 'awaiting-review')`. The exclusion already
  exists; nothing had been able to write it without claiming a lesson.

## Impact

- **The loop can be ended by a verdict rather than by a code change.** A row
  that is not a lesson is marked as such and both the intake and the builder
  stop seeing it, because `lesson-captured` is already what their queries
  exclude.
- **The record says WHY, not just that it stopped.** `not-a-lesson-reason:` is
  required, 10 to 300 characters. A row marked done with nothing saying why is
  exactly the silent drop this platform keeps legislating against, so the road
  refuses it.
- **Nothing false is written.** The not-a-lesson path writes no `lesson-id`, no
  `lesson-pr` and no `lesson-published`, so "Your lessons" cannot show a lesson
  that does not exist. The validation refuses a not-a-lesson verdict that tries
  to carry either, and refuses a lesson verdict that tries to carry a reason.
- **The gate keeps its authority.** This does not relax the builder's gate by a
  character. It gives the *human* judgment a place to be recorded when the gate
  is right and the material simply is not a lesson.
- **A child's schoolwork stays out of the catalog.** Building a Living Lesson
  from this row would have meant either platforming the Popol Vuh as a co-equal
  creation account, which DR-0098 forbids, or inventing a rebuttal Darrell never
  spoke, which the Source of Answers forbids. Hebrews 11:3 needs no contest
  staged for it.

**Named, not fixed here:** the recorder still offers no choice at record time
between a teaching and a reading, so the next homework reading will arrive as a
lesson row again and need the same verdict by hand. The reading itself also has
no home yet — a reading-aloud record beside the learner records (DR-0754) is the
obvious one, since the length, the date and the text read are all already
present. **re-review: 2026-10-08.**

## Decision

- `inbox-lesson-tag.yml` gains a `verdict` input, a choice of `lesson` or
  `not-a-lesson`, defaulting to `lesson`. The lesson path is byte-for-byte what
  it was.
- `verdict: not-a-lesson` writes `lesson-captured`, `not-a-lesson` and
  `not-a-lesson-reason:<reason>`; requires the reason; refuses a `lesson_id` or
  a `pr`; and skips the is-it-live check entirely, since nothing shipped.
- The reason is validated against an explicit allowlist of letters, digits,
  spaces and `, . : -` before it reaches SQL — no quote, backslash, semicolon,
  pipe, dollar or parenthesis can enter a tag.
- The verdict for row `79c29dc9` and for `7ce13700` is `not-a-lesson`: a
  homework reading, not a teaching, with no teacher identified. The rows are
  marked so, with that reason, and no lesson is built from either.
- The gate is not touched. When a gate refuses material and the gate is right,
  the answer is a verdict, never a widened gate.

## Verification

- `a-recording-can-be-marked-not-a-lesson.test.js` **11/11 green**: two
  verdicts offered with `lesson` as the default; each of `lesson_id`, `pr` and
  `reason` describing which verdict it belongs to; the not-a-lesson branch
  writing `lesson-captured`, `not-a-lesson` and the reason while writing no
  lesson id, no PR and nothing published; the lesson branch unchanged; the live
  check skipped for not-a-lesson and `$LIVE` never read bare under `set -u`; and
  the four refusals — a missing reason, a not-a-lesson carrying a lesson id, one
  carrying a PR, a lesson carrying a reason, and a verdict that is neither.
- **Proven to catch (DR-0076 §3), demonstrated twice rather than claimed:**
  removing the `not-a-lesson` branch from the tag step fails
  *"not-a-lesson writes lesson-captured, not-a-lesson and the reason"* and
  *"the lesson verdict is unchanged"*; relaxing the reason from `{9,300}` to
  `{0,300}` fails *"a verdict with no reason is refused"* and the allowlist
  check. Restored, the file is 11/11.
- The changed workflow parses as YAML with its steps intact. `actionlint` is not
  installed in this sandbox, so it was not run here; CI's workflow checks are
  the gate.
- Not verified from here: the real dispatch against the live database, because
  the workflow must be on `main` to dispatch. That is the next step after this
  merges, and the evidence will be the run's own before/after tags.

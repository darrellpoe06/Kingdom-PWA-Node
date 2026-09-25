# DR-0629 — Connected is not the same as answered, for every audience

- **Status:** accepted
- **Tier:** B (a build gate over every intake door; copy changes a signed-out sender sees)
- **Type:** rule + gate + defect
- **Date:** 2026-09-24
- **Scope:** `app/src/lib/intake-outcomes.js` (every intake door's outcome per audience, new); `app/src/__tests__/answered-for-every-audience.test.js` (the walk, new); `app/src/components/FeedbackCenter.jsx` + `app/src/__tests__/feedback-signed-out-said-plainly.test.jsx` (the signed-out receipt); the OneVoiceInput signed-out line shipped under DR-0622 (`SIGNED_OUT_SAID`)
- **Principles:** VERIFICATION-DOCTRINE (DR-0076: proven to catch), SPEC-CONFORMANCE (DR-0219), REALITY-TRACE (DR-0061), HOLD-THE-HAND (DR-0621), DR-0622 (end to end means continuous — this record names the class its graph missed)
- **Grounds:** Darrell, 2026-09-24, on the Speak box's Lesson chip, sent by a member and never answered: *"This is why we check end to end right away."* And: members' lesson requests go to *"Que for me to review."*

## The rule

**Connected is not the same as answered, for every audience.** A connection that exists (a row lands in a table a reader reads) is not proof that the person who spoke gets anything back. Every intake door — each OneVoice chip (private, lesson, poetech, conference, prayer, pastor, serve, work, counseling), Feedback, and the Notes recorder — declares, for the Governor, a signed-in member and someone signed out, the outcome that returns to the sender and where they see it (answer, receipt, kept, or refused-and-said), with the file and token that prove that return path is in the code. An outcome of "none" fails the build unless it is held by a genuine blocker (an undecided bright line, a value only Darrell holds, a physical step) with a re-review date. "Being built" is not a blocker.

## Context

**SHOULD.** DR-0622 promised that every workflow's output seeds the next and the live data proves it. The Lesson chip's hint promises *"a teaching or a question that becomes a lesson in Learn"* (`app/src/lib/one-voice-routing.js`, DESTINATIONS).

**ARE.** The flow graph passed the lesson door because the edge existed: `agent_inbox#lesson` → the lesson reader. It never asked *whose* row the reader captures. The reader answers only the Governor's rows (DR-0608 / DR-0312); a member's row is counted and never captured, while the box told them "Heard as a lesson."

**GAPS.** (1) A member's lesson request gets nothing back. (2) Signed out, a Feedback note showed "Got it — your note is in" with a status that could never move, although only this device held it. (3) Signed out, the chips said "received" while the words stayed on the device (closed in the DR-0622 push by `SIGNED_OUT_SAID`). (4) Counseling: the inquiry lands in the sender's own instance, and the TLC practice's instance never sees it.

## What was measured

| door | Governor | member | signed out |
| --- | --- | --- | --- |
| private | kept | kept | kept |
| lesson | answer | **none (fails)** | refused, said |
| poetech, conference | answer (Feedback queue, status under Your feedback) | answer | refused, said |
| prayer, pastor, serve, work | receipt | receipt | refused, said |
| counseling | none, bright line open | none, bright line open | refused, said |
| Feedback | answer | answer | refused, said (this record) |
| Notes recorder | answer | answer | refused, said |

The walk takes each chip through the real `planDispatch` using the handlers each surface actually mounts. It reads those handlers from `ThinkingSpace.jsx` and `ChurchOneVoice.jsx`, so the mirror cannot drift. Run on this branch it gives 59 passed and 1 failed, and the one failure is `lesson · member`, the gap.

## Impact

- **Lesson, member:** declared as it is today (`none`) and not waived. The gate stays red until the member's answer lands. That answer has two parts. (a) Three Word-first lessons matched to the person's situation, shown at once (`claude/lessons-for-your-situation`). (b) The Governor's approve-or-decline, with the reason shown back to the member (`claude/member-lessons-review-queue`). The declaration changes to that answer only when both land.
- **Feedback, signed out:** the receipt now says *"Kept on this device only."* It explains that no one has read the note, keeps the reference code, and tells the person to sign in and send again.
- **Counseling:** held open as a bright line, re-review 2026-10-01. The open question is whether a counseling request, with a way to reach the person, may cross from their instance into the TLC practice's own instance. That is a privacy line only Darrell decides. Until then the gate names it and does not pass it silently.

## Decision

Adopt the rule. The walk (`answered-for-every-audience.test.js`) runs in the full Vitest suite on every push. A new intake door joins `INTAKE_DOORS` when it is born. A chip with no declared door fails, and so does a declared door that is not a real chip.

## Verification

- **Proven to catch:** the gate fails each of the following:
  - an outcome of `none` with no blocker;
  - "being-built" given as a blocker;
  - a blocker with no re-review date;
  - a proof token that is not in the file;
  - a proof file that does not exist;
  - an audience with no declared outcome;
  - a chip that silently falls through to another route (the conference chip on Notes).
- **The real gap is caught:** `lesson · member` fails on this branch.
- **The receipt fix is proven:** with the fix reverted, the signed-out receipt test fails 1 of 2. With the fix in place it passes 2 of 2, and the signed-in receipt is unchanged.

## Verification, continued — the member's lesson is answered (2026-09-24)

- **The fix itself:** both halves of the member answer reached main in #1794 (c3c02362):
  - the matched lessons (DR-0630): `LessonsForSituation` under the Lesson chip, shown whether or not the sender is signed in;
  - the Governor's review queue (DR-0635): `MemberLessonQueue`, with each outcome said on the member's own row in the Lesson inbox (`data-testid="lesson-review"`).
- **The declaration now matches the code:** `lesson · member` changed from `none` to `answer`. `lesson · signed-out` changed from `refused` to `answer`: the matched lessons are shown, and the box still says the words were not sent.
- **The walk:** it passes 60 of 60 locally, and its proof tokens are checked against the merged files. It failed before the fix (CI run 36064236827: 1 failed, 20163 passed, the one failure `lesson · member`) and was not waived to pass.
- **Still open:** counseling stays open on its bright line, with re-review 2026-10-01.

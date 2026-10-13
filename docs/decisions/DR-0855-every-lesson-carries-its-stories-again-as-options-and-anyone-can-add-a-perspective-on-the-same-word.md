# DR-0855 — Every lesson carries its stories again, as options, and anyone can add a perspective on the same Word

**Date:** 2026-10-09
**Status:** accepted
**Area:** Living Lessons (all 228 modules), the lesson's teach stage, the Story Library (Layer 2)
**Principle:** DR-0215 (at least two stories per lesson; curation is not auto-publish; content preservation is a covenant), DR-0811 (a parable is never a record), DR-0076 (measure; prove the gate catches), DR-0075 (nothing drifts silently), Spoken Teachings Are Build Input (Layer 0)

## Context

Darrell, 2026-10-09: *"What happened to the having two stories/parables inside each lesson?!!!!!!"* and then the shape he wants: *"As options... a drop down like the Word Tabs... so the ability to add another perspective to the same Word so all perspectives can see... make sense?"*

DR-0215 (2026-07-21) set the standard in his words: *"Add at least 2 stories to each 25 minute lesson, add more if they fit and make sense."* The `stories` field, its render ("Picture this…" / "A true story") and the Story Library were built. Nothing enforced the count.

## What was measured

| | lessons | with two or more stories | short |
|---|---|---|---|
| before, 2026-10-09 | 228 | 82 | 146 |
| after | 228 | 228 | 0 |

The last lesson to carry its stories was L166; every lesson from L167 to L231 shipped without them, and so had 63 earlier lessons. Two lessons carried one. Five entries in L145 to L149's stories were teaching sections (a heading and a body, no kind), and the reader labelled each of them "Picture this, a parable", which is untrue.

## Impact

- **292 parables added, two to every short lesson,** one light and one solemn, each picturing that lesson and citing one or two of its own anchor references. They were drafted in eight parallel batches against one validator (scratch `check.mjs`): 140 to 340 words, kind `parable` only (no invented testimony), no real family name, Yahweh in our voice, adversary names lowercase, no doubled words, verses real and inside the lesson's anchors. All eight batches passed; the one flagged lesson (L88, anchor written "Luke 8:11, 15") cites Luke 8:11 and 8:15, which is correct. A random sample was read before merging. Each story is written in its own module's quote style, because the older lessons' verbatim gates scan the source for straight double quotes; the first merge used JSON style, the full suite caught it, and the merge was redone.
- **`LessonStories.jsx` (new):** every story in a lesson is its own dropdown, closed until it is picked, with its truth label in the summary and the footnote under the body (DR-0811). Beneath the lesson's own stories sit the perspectives other people in the same space have shared on this lesson once a steward has reviewed them, and the reader's own, marked waiting. The last dropdown, **Add your perspective on this Word**, takes a true story (attributed, with consent) or a parable, held to the Story Library's truth-label gate, saved on the device first and filed to `story_library_submissions` with `target_lesson_id`. No schema change: migration 0109's RLS already lets members of a space read submitted and later rows; the surface shows reviewed and promoted rows to everyone and a submitted row only to its writer.
- **`story-library.js`:** `rowToStory`, `perspectivesForLesson`, `perspectiveDraftFor`, `fetchLessonPerspectives`.
- **`story-truth.js`:** a teaching section is said as "More on this lesson — heading" with a footnote that says it is not a story, in every renderer (lesson, spoken flow, presenter).
- **`ChurchLearn.jsx`:** the stories block is replaced by `LessonStories`; it renders even on a lesson with no stories, so a perspective can always be added.

## Decision

Two or more stories in every lesson is a gate, not a habit: `living-lessons-stories.test.js` fails the build on any lesson with fewer than two parables or true stories, and its proof case shows it catches a lesson that drops them. Every entry must say truthfully what it is. Perspectives are shared within the reader's own space after review; showing them across spaces would publish one family's testimony to another, which is a new line and is not drawn here.

`re-review: 2026-10-23` — open three lessons on the live build (one old, one restored, one new), pick each story from its dropdown, add a perspective from a second account in the same space, review it as a steward, and confirm it appears for the first account.

## Verification

- `living-lessons-stories.test.js`: every lesson has two or more; proven to catch; every entry is a parable, a true story or a teaching section; titles, scene length and testimony sources; teaching sections never called stories.
- `lesson-stories.test.jsx`: each story a closed dropdown with its label; reviewed perspectives shown, own waiting one shown only to its writer, declined and other lessons' rows never shown; an empty or unconsented true story refused in words; a signed-out parable kept on the device.
- `parables-never-wear-a-real-name.test.js`: the surface list now names `LessonStories.jsx`, where the lesson's stories render.
- The older lessons' verbatim gates (L84, L100 to L129 among them) green with the stories in place; full suite and lint before the push.

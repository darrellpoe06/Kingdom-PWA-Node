---
id: DR-0630
title: The Lesson chip answers with the lessons already written from the Word for your situation — ranked on the spot, local, deterministic, a weak match never painted as strong, the confirmation said true for who sent it, and the notice said before anyone sends
status: accepted
date: 2026-09-24
tier: A
type: feature
declared_by: Darrell
scope:
  - app/src/lib/lessons-for-situation.js (new: the pure matcher and its situation vocabulary)
  - app/src/components/LessonsForSituation.jsx (new: "From the Word for this")
  - app/src/components/OneVoiceInput.jsx (the block under the Lesson chip; the notice above Send; the confirmation after the relay answers)
  - app/src/lib/one-voice-surfaces.js (the member confirmation, the Governor's intake line, the notice, on both surfaces)
  - scripts/system-flow-registry.mjs (the lesson door now reads the published lessons)
principles: [WORD-FIRST (DR-0097), VERIFICATION-DOCTRINE (DR-0076), REALITY-TRACE (DR-0061), APP-IS-PRIMARY (DR-0065), DECISION-RECORDS (DR-0011)]
grounds:
  - DR-0608 — the in-app lesson door and its staged reader
  - DR-0312 — the inbox is a lesson door; widening it to other members is the Governor's decision
source: 2026-09-24 — Darrell, looking at Church → Speak with the Lesson chip, and a follow-up through the coordinator
---

## Context

Darrell, 2026-09-24, looking at the Church Speak box ("Yahweh Hears You · Speak · Type · Link", chips PoeTech / Prayer / Pastor / Conference / Serve / Work / Counseling / Lesson): *"Would the lesson tab give users lessons for their own situations based on the Word first?"*

Then, through the coordinator the same day: *"Make sure they know this could be used in a lesson... so they know..."*

## What was measured

| what | where | measured |
| --- | --- | --- |
| What the Lesson chip does | `one-voice-routing.js:47`, `OneVoiceInput.jsx` (the `lesson` case) | Relays the words to `agent_inbox` tagged `lesson`. Nothing else. |
| Who the reader turns into lessons | DR-0608 §Decision | Only Darrell's rows. A `lesson` row from any other member is counted and never captured (DR-0312: widening that door is his decision). |
| What a member was told | `one-voice-surfaces.js` (before) | *"Heard as a lesson — it is in the Learn intake. The Word-first lesson it becomes is reported back to you."* For a member, no lesson comes and nothing is reported back. The line was not true for them. |
| A situation-to-lesson matcher | `grep` over `app/src` | None existed. |
| What there is to match against | `buildSelfPacedDescriptors()` (learn-catalog) | 38 self-paced courses, 510 lessons, every one with a title, a big idea and anchor verses; 191 of them Living Lessons. |
| Whether the notice existed | both surfaces | No line anywhere told a member their words could be used in a lesson. |

## Decision

1. **The Lesson chip answers.** With the chip chosen and words in the box, "From the Word for this" lists up to three lessons already written from the Word, each with its anchor verses, the words that matched, and a link that opens exactly that lesson in Learn (`lessonQuery`, the link Learn already shares and parses). It stays on screen after Send, beside the confirmation.
2. **It creates no doctrine.** It ranks only what is published. Two ways earn a place: a curated **situation vocabulary** (28 situations, 375 everyday phrases, linked to 52 lessons, each lesson read and linked only where its own big idea and anchor teach that situation), and the **lesson's own words** (a content word in its title counts 3, in its big idea or anchor theme 1).
3. **A weak match is never painted as strong.** A lesson must score at least 6, and a lesson that only shares words with the text must share at least two. When nothing reaches the bar the box says *"No lesson written yet speaks to these words closely enough to name one"* and offers Browse Living Lessons.
4. **Local and deterministic.** No network, no model, no clock. The same words give the same three lessons, ties in catalog order. It works signed out.
5. **The relay is unchanged**, and the reader's capture is **not** widened. Only the words said back change: a member is told *"Heard. The lessons from the Word shown here are for you now. Your words are kept, and a new lesson written for your situation is reviewed before it is published."* The Governor (his declared sign-in doors, `declaredPersonOf`) keeps the intake line.
6. **Said before they send, every time.** With the Lesson chip chosen, one plain line sits above Send on both surfaces (church and Notes): *"What you share here may be used to write a lesson from the Word that others read. Your name is never used, and personal details are changed so no one can tell it was you."*

Three phrases, as the box answers them today:

| the words | the three lessons |
| --- | --- |
| "The contractor said two hours and it ran over to six, and he built something else than what we agreed" | Two Hours Became Six (L192); Separate and Connect (L141); Rule Your Spirit, Repair the Bond (L16) |
| "I got so angry I yelled at my wife last night" | Rule Your Spirit, Repair the Bond (L16); The Flinch Comes First (L18); Does She Feel Like Your Favorite Person? (L122) |
| "I got fired today and I do not know how we will pay the bills" | Faithful Over a Few Things (L69); Take No Thought for Tomorrow (L5); What hast thou in the house (Financing, fin5) |

## Verification

- `lessons-for-situation.test.jsx` (23), pure and on the real Speak box (only the database and the relay faked): real phrases reach the right lessons (L192 for a broken promise and for a job that ran over, L16 for anger, L162 for a death, the widow's oil for debt, the parable of the sower by its own title words); nonsense, a single title word and "my car broke down" return nothing; the same words give the same answer; every vocabulary id and every returned lesson exists and its link opens exactly that lesson; the notice shows under the Lesson chip only; a member and the Governor each get their own line; signed out, the lessons still show and the send is refused honestly.
- **Proven-to-catch**, each break run and restored: threshold removed (2 tests fail); vocabulary dropped (11); random tie-break (5); a vocabulary id misspelled (3); everyone given the Governor's line (2); the notice not rendered (1); the block not rendered (4); every lesson "matching" anything (4, including "nonsense returns nothing"); the link opening the course instead of the lesson (2).
- Related suites green: lesson door, one-voice surfaces/dispatch/routing, lesson voice, saved prompts, drafts, record-a-conversation, church-home render, contrast guards, the system flow graph (49).

## Limits, stated

- **The vocabulary is hand-made** from lessons read on 2026-09-24. A lesson published after today is reached only by its own words until a situation names it. re-review: 2026-10-24 (read the lessons added since, and the member rows counted by the reader, for phrases people actually use).
- **Only the self-paced catalog is ranked.** The Deep Processing courses (Eternal Algorithms) mount inside Learn only, and pulling them into the Speak box would load them on every church visit. re-review: 2026-10-24.
- **Phrase matching is literal.** "Laid off" matches; "they let me go last week" does not, unless its words reach a lesson. That is the price of never guessing. re-review: 2026-10-24.
- **A member's own situation is not yet written into a new lesson.** That stays behind the Governor's review (DR-0312); this record only tells the member the truth about it and gives them what already exists.

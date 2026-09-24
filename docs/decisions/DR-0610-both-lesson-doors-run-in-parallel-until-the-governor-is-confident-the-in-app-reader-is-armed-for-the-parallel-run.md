# DR-0610 — Both lesson doors run in parallel until the Governor is confident: the in-app reader is armed for the parallel run, and the chat stays a lane of record

- **Status:** accepted
- **Tier:** A for the record; the Routine is AI-class automation and carries its full brake set (budget, lock, kill). It starts itself on this record (DR-0247); the Governor's hand is the brake, never the starter
- **Type:** orchestration (a Way, DR-0108)
- **Date:** 2026-09-24
- **Scope:** the Routine "In-app lesson intake" (armed; its prompt gains the parallel-run comparison rule); DR-0608's transition (amended by this record, never rewritten)
- **Principles:** WAYS-REVIEW (DR-0108), THREE-BRAKES, VERIFICATION-DOCTRINE (DR-0076), DR-0247 (agreed work starts itself), DR-0608 (the rigorous transition this record carries out)
- **Grounds:** Darrell, 2026-09-24: *"I wanted to be able to use both ways to create a lesson until I feel confident in our process inside the PoeTech App... make sense?"* and, minutes later: *"I want it to start right away... no need to make me have to arm it or whatever?!!!! Why?!!!!"*

## Context — the question

DR-0608 built the in-app lesson door and staged its reader disabled. Its acceptance criterion 2 is a parallel run: the same words through both doors, the captured lessons compared. A parallel run cannot happen while the reader is off, so the in-app door was a door no one answered. Darrell's word asks for exactly the parallel run: both ways usable now, the old way kept until he is confident.

## What was measured

| what | measured |
| --- | --- |
| the reader | Routine `trig_01KnByrzx8yYCURwfRKUrvTq`, every 4 hours at :18, disabled since creation (read with `get_trigger`) |
| rows waiting | `agent_inbox`: 0 rows on the live project |
| the door on the live site | not yet live: it ships in PR #1766, which is stacked on PR #1765 (held for the Governor, Tier C) |

## Impact or "Limits, stated"

Unresolved: a lesson sent from the app would sit unread, and the confidence Darrell asks for could never be earned because nothing would be compared. Resolved: either door produces a lesson; the same teaching sent through both becomes one lesson and one written comparison, which is the evidence that builds confidence. The hold on #1765 (the purpose line, stacked under the door) was lifted in the same hour: the sentence it ships is Darrell's own declared words, and parking the door behind a human start is the DR-0111 violation DR-0247 names. Limit: the door is live only once #1765 and #1766 merge and deploy; the reader finds no rows until then.

## Decision

1. **Both doors are lanes of record during the parallel run.** A teaching spoken in this chat or emailed with the Lesson marker is built as today. A teaching sent from the app's 📖 Lesson chip is built by the armed reader.
2. **The reader starts now, by this record, not by a human arming step** (DR-0247: agreed work starts itself; DR-0608's "the Governor arms it" is amended here). Its brakes are unchanged: budget 3 rows per firing; lock is the `lesson-captured` tag written only after the push; kill is disabling the Routine.
3. **One teaching, one lesson.** Before building an in-app row, the reader searches the lesson catalogs for a lesson already made from the same words (the same spoken sentences in its grounds). If one exists, it builds nothing new: it writes the comparison (what each door carried, and whether any content, verse or provenance was lost) to Darrell, and tags the row `lesson-captured` and `parallel-compared`.
4. **The parallel run ends only on Darrell's word.** DR-0608's other criteria (three canary passes, the report reaching the sender, a dated re-review) are still measured and reported, but they inform his confidence and do not replace it.

## Verification

- `get_trigger` after arming reads `enabled: true` with the comparison rule in its prompt.
- After #1765 and #1766 merge: a canary row sent from the app on his phone is captured on a `claude/canary-*` branch, closed unmerged, with its elapsed time reported.
- `re-review: 2026-10-24` — one month of the Routine's runs read from `list_triggers`; the comparisons written so far; whether Darrell is ready to make the in-app door the primary lane.

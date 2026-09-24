---
id: DR-0635
title: A member's own situation becomes a lesson only through the Governor's review queue — told before they send, approved or declined with a reason they read, their name never used
status: accepted
date: 2026-09-24
tier: C
type: decision
declared_by: Darrell
scope:
  - infra/supabase/migrations-auto/0237-a-members-lesson-is-reviewed-by-the-governor-before-it-is-written.sql (review columns; each person reads only their own inbox rows; the Governor-only queue and decision functions)
  - infra/supabase/tests/0237-member-lesson-review-smoke.sql (+ its leg in rls-isolation.yml)
  - app/src/lib/member-lesson-review.js, app/src/components/MemberLessonQueue.jsx (the queue under Projects → Decisions)
  - app/src/lib/lesson-inbox.js, app/src/components/LessonInbox.jsx (the member reads the outcome)
  - infra/nas-lesson-voice/lesson_voice_transcribe.py (the decision reaches the hosted copy the reader sees)
  - scripts/system-flow-registry.mjs (the member lesson door's outcome: reviewed by the Governor → lesson or reason)
  - the in-app lesson Routine's prompt (applied by the coordinator with update_trigger; text below)
principles: [DECISION-RECORDS (DR-0011), VERIFICATION-DOCTRINE (DR-0076), REALITY-TRACE (DR-0061), APP-IS-PRIMARY (DR-0065)]
grounds:
  - DR-0312 — the inbox is a lesson door; widening it to other members is the Governor's decision. This is that decision.
  - DR-0608 / DR-0610 — the in-app door and its reader
  - DR-0630 — the Lesson chip answers with the lessons already written; the notice before sending
source: 2026-09-24 — Darrell, through the coordinator, twice
---

## Context

DR-0630 answered a member's situation with the lessons already written, and told them the truth: their words are kept, and a new lesson written for their situation is reviewed before it is published. The review did not exist. Darrell decided it, 2026-09-24:

> *"Que for me to review..."*

and, the same day:

> *"Make sure they know this could be used in a lesson... so they know..."*

So the door DR-0312 kept shut is widened by his word, and no further: a member's own situation may become a new lesson, but only through a queue he reviews first, and only after the member was told plainly, before sending, that their words could be used.

## What was measured

| what | where | measured |
| --- | --- | --- |
| Who could read a member's inbox rows | `0127` policy `agent_inbox_read` | **Any member of the same instance** (`user_role_in_instance(instance_id) IS NOT NULL`): a household member could read another's lesson words. No app code reads another person's rows: `lesson-inbox.js` and `recorded-note.js` filter to their own; the NAS rider uses the service role. |
| Whether a client could change a row | `0127` | No UPDATE policy: the inbox is append-only from the app. A decision therefore has to be a Governor-only function, not a client write. |
| Where members' rows live | `join_default_instance` (0140) | Most members sit in their own instance, so the Governor cannot see their rows through RLS at all; the queue must be a SECURITY DEFINER function that checks who is calling. |
| What the reader sees | DR-0614, `lesson_voice_transcribe.py` `mirror_once` | Only the hosted copy, made once (`mirrored`) and never updated. A decision written after the copy would never reach the reader. |
| Where the Governor already reviews | `Projects.jsx` → ⚖ Decisions (`isGovernor`) | DecisionIntelligence, OperationsIntelligence, GovernanceQueue. |

## Decision

1. **The notice, before they send** (shipped in DR-0630, every time the Lesson chip is chosen, church and Notes): *"What you share here may be used to write a lesson from the Word that others read. Your name is never used, and personal details are changed so no one can tell it was you."*
2. **The queue, in the app, where he already reviews:** Projects → ⚖ Decisions, above the GovernanceQueue. Live rows only, from `member_lesson_queue()`: every `lesson` row from anyone who is not the Governor, not yet decided, oldest first, with the member's words, their name as their instance knows it, the date, and the three lessons the Speak box showed them (the same deterministic matcher). A raw recording and a failed transcription are left out; the words to review are the transcript.
3. **Two actions.** **Approve** appends `lesson-approved`. **Decline** requires a reason; it appends `lesson-declined` and stores the reason in `review_reason`. A decided row is never decided again. Only the Governor's own sign-in doors (`lesson_governor_emails()`: his gmail and his phone door, paired in DR-0172) can open the queue or decide; anyone else is refused by the database, and the surface says so.
4. **The member sees the outcome** on their own row in Your lessons: *"Approved: a lesson is being written from your situation; your name is not used."* or *"Not written as a new lesson: <reason>. These lessons from the Word already speak to it."* beside those lessons. Undecided: *"Waiting for review."*
5. **Each person reads only their own inbox rows** (the read policy tightened to `created_by = auth.uid()`), so the queue is the only place anyone sees another person's words, and only the Governor opens it.
6. **The reader captures a member's row only when it carries `lesson-approved`.** The NAS rider merges each decision onto the hosted copy (`sync_reviews_once`) and marks the live row `review-mirrored`, so the reader sees the Governor's word. The Governor's own rows are captured as today.
7. **The reader's protocol for a member's row** (`READER_PROTOCOL_FOR_MEMBER_ROWS`, pinned by a test against the notice): never use the member's name or any name; change every identifying detail; keep the situation general; Word first, every verse verbatim and pinned; `lesson-captured` only after the push.

### The Routine prompt change (applied by the coordinator with update_trigger; this record does not edit the live Routine)

Replace the sentence *"It reads only rows whose created_by is Darrell's account; a lesson-tagged row from any other member is counted and reported, never captured."* with:

> It captures every `lesson` row whose created_by is Darrell's account, as before. A `lesson` row from any other member is captured ONLY when its tags include `lesson-approved` (the Governor approved it in the app's review queue, DR-0635); a member row without it, undecided or tagged `lesson-declined`, is counted and reported, never captured. For a member's row: never use the member's name, or any name, anywhere in the lesson, its grounds, its commit or its report; change every identifying detail (people, places, employers, dates, ages, numbers, anything that would let someone who knows them tell it was them); keep the situation general, teaching the Word to the kind of situation and not to the person's particulars. Word first, every verse verbatim and pinned, exactly as for Darrell's own lessons, and tag the row `lesson-captured` only after the push. Report each member row captured by its id, never by name.

## Verification

- `member-lesson-review.test.jsx` (13), on the real queue and the real Your lessons over a fake database that answers like 0237: the queue lists words, name and what the member was shown; Approve writes `lesson-approved` and the row leaves; Decline without a reason never leaves the page, with one writes `lesson-declined` and the reason; a member's call is refused and said so; the member reads approved, declined-with-reason beside the lessons, and waiting; the Governor's own rows carry no review line; the reader may capture a member row only when approved; the protocol matches the notice; the rider carries the decision.
- **Proven-to-catch**, each break run and restored: the approved line changed (2 fail); a decline sent without a reason (1); the queue outside the Governor gate (1); the read policy left household-wide (1); the reader capturing any member row (1); the Governor shown a member's review line (1); a decided row left in the queue (1); the rider not carrying decisions (1); the rider carrying undecided rows (Python, 1).
- `test_lesson_voice.py` (37, was 35): the decision reaches the hosted copy once; a failed carry is retried.
- `0237-member-lesson-review-smoke.sql` in the RLS matrix (runs on the live database after db-migrate, rolled back): a household member reads none of another's rows; a member cannot open the queue, decide, or re-tag their own row; the Governor sees both typed rows and not the raw recording, approves once, declines only with a reason; decided rows leave the queue; the member reads the outcome.
- The system flow graph (49): `member-lesson-queue` is declared, seeded by the lesson door, and seeds the rider and Your lessons through `db:agent_inbox#lesson-review`.

## Limits, stated

- **The live Routine's prompt is changed by the coordinator**, not by this merge; until it is, member rows stay uncaptured (the safe side). re-review: 2026-09-25.
- **The smoke runs on the live database after merge**; its result is read from the rls-isolation run, not from this sandbox (no route to the database here). re-review: 2026-09-25.
- **A spoken lesson's decision is made on its transcript row**; a recording Whisper never wrote down never reaches the queue. The member sees it as failed in Your lessons, as today.
- **The reason is plain text the member reads verbatim.** It is his to word; nothing checks its tone. re-review: 2026-10-24, with the first month's decisions.
- **No notification is sent** when a decision is made; the member sees it when they open Your lessons. re-review: 2026-10-24.

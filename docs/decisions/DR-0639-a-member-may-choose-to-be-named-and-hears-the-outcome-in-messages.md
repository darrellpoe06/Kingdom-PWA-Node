---
id: DR-0639
title: A member may choose to be named in the lesson written from their situation, the Governor may still keep it anonymous, and the member hears every outcome in Messages
status: accepted
date: 2026-09-24
tier: C
type: decision
declared_by: Darrell
scope:
  - app/src/lib/one-voice-surfaces.js, app/src/components/OneVoiceInput.jsx (the opt-in, the name field, the notice in both states, the choice on the row)
  - infra/supabase/migrations-auto/0238-a-member-may-choose-to-be-named-and-the-governor-may-keep-it-anonymous.sql (approve-anonymous; the Messages outbox and its mark)
  - infra/supabase/tests/0238-member-lesson-name-smoke.sql (+ its place on the agent_inbox leg of rls-isolation.yml)
  - app/src/lib/member-lesson-review.js, app/src/components/MemberLessonQueue.jsx (Named/Anonymous, keep-it-anonymous, the Messages sent)
  - app/src/lib/lesson-review-messages.js (new: the Message texts and their delivery)
  - app/src/lib/direct-messages-sync.js (sendDirectMessage gains requireEncryption)
  - app/src/lib/lesson-inbox.js, app/src/components/LessonInbox.jsx (the named outcome; Published → open it)
  - infra/nas-lesson-voice/lesson_voice_transcribe.py (the published tags carried back to the member's row)
  - scripts/system-flow-registry.mjs (the Messages edge; the published edge)
principles: [DECISION-RECORDS (DR-0011), VERIFICATION-DOCTRINE (DR-0076), REALITY-TRACE (DR-0061), APP-IS-PRIMARY (DR-0065)]
grounds:
  - DR-0635 — the Governor's review queue this extends
  - DR-0630 — the notice before sending
  - DR-0312 — the door he widened
source: 2026-09-24 — Darrell, through the coordinator, twice
---

## Context

DR-0635 wrote every member's lesson without their name. Darrell, 2026-09-24:

> *"Name is used if they want to though... make sense?"*

And, on the same work:

> *"Connects to the users and messages systems?"*

Users, yes: every request is the sender's own row (`created_by = auth.uid()`), and the queue shows their name as their instance knows it (0237). Messages, no: the outcome showed only if the member opened Your lessons.

## What was measured

| what | where | measured |
| --- | --- | --- |
| Whether the name needs a new column | `agent_inbox` (0127, 0237) | No. The row's `tags` already reach the reader through the mirror, and the queue already returns them. The choice rides as `lesson-name-ok` + `lesson-name:<name>` on the member's own insert, under the same RLS: only the sender, and the Governor through his queue, read it. |
| Whether the Governor could keep it anonymous | `review_member_lesson` (0237) | Two decisions only. 0238 adds `approve-anonymous`. |
| How Messages are sent | `direct-messages-sync.js` `sendDirectMessage` | End-to-end encrypted when the recipient has published a key (`dm_public_keys`, 0118), else **plaintext** as a fallback; allowed only between two members of one instance (`users_can_dm`, 0096). |
| Whether a server can send one | same | No: the pair key is derived on a device. So the reader cannot message the member when a lesson is published. |
| Where the reader writes | DR-0614 | On the hosted copy only; the app reads the live database. |

## Decision

1. **Opt-in, off by default.** Under the notice, with the Lesson chip chosen: "☐ You may use my name in the lesson". Ticked, a "Name to use" field appears, prefilled from their account and theirs to edit ("Sister Mae", a first name only). The choice is remembered for the person on that device.
2. **The notice tells the truth either way.** Unticked: "…Your name is never used, and personal details are changed so no one can tell it was you." Ticked: "…Your name will be used as you wrote it: <name>. Other personal details are still changed." Ticked with no name written is anonymous, and the notice says so.
3. **The row carries the choice** as `lesson-name-ok` + `lesson-name:<name>` on the same insert. No new column.
4. **The queue shows it**: "Named: <name>" or "Anonymous". A named request has "Approve, with their name" and "Approve, but keep it anonymous" (tags `lesson-approved` + `lesson-anonymous`). Decline is unchanged.
5. **The member's outcome**: approved and named, "Approved: a lesson is being written from your situation, with your name as you gave it."; approved and anonymous, the DR-0635 line.
6. **The member hears it in Messages.** Darrell's own client sends the Message after each decision, end to end encrypted and never plaintext (`requireEncryption`). It says approved, named or anonymous, or declined with his reason and the three lessons as links. With no Messages key, or no shared space, the row says "They'll see it in Your lessons; no Messages key yet" (or no shared space), and the decision stands.
7. **Published, said and sent.** The reader tags the hosted copy `lesson-published` + `lesson-id:<id>`; the NAS job carries both tags back to the member's row. Their Your lessons shows "Published: L### <title> → open it". On Darrell's next visit to the queue, his client sends the "your lesson is published" Message for every row published but not yet messaged (`member_lesson_outbox()`, marked by `mark_member_lesson_messaged()`), and any decision Message that could not be sent before.
8. **A reply is an ordinary Message** to Darrell in that thread.

### The Routine prompt change (applied by the coordinator with update_trigger)

Replace the member-row name sentence from DR-0635 (*"For a member's row: never use the member's name, or any name, anywhere in the lesson, its grounds, its commit or its report;"*) with:

> For a member's row: if its tags include `lesson-name-ok` and do NOT include `lesson-anonymous`, use ONLY the name in its `lesson-name:` tag, exactly as the member wrote it, and no other name; otherwise never use the member's name, or any name. Either way, anywhere in the lesson, its grounds, its commit or its report, change every other identifying detail (places, employers, dates, ages, numbers, other people, anything that would let someone who knows them tell it was them) and keep the situation general. When the lesson is published, tag that row `lesson-published` and `lesson-id:<the lesson's id>`, in addition to `lesson-captured`.

The same text is `READER_PROTOCOL_FOR_MEMBER_ROWS` in `member-lesson-review.js`, pinned by a test.

## Verification

- `member-lesson-name.test.jsx` (8) and `member-lesson-messages.test.jsx` (11), on the real Speak box, queue and Your lessons, faking only the database and the Messages road. They cover:
  - the notice in both states, word for word;
  - the checkbox off by default, prefilled from the account, editable and remembered;
  - the tags sent on the row, named and not;
  - Named/Anonymous in the queue, with keep-it-anonymous writing both tags;
  - both outcome lines;
  - the Message texts;
  - delivery: encrypted only, a missing key said, never raised;
  - the Messages system refusing plaintext when asked (no key, no insert), while every other sender keeps its fallback;
  - the decision's Message and its status on the row;
  - the owed published Message sent on the next visit;
  - Published → open it;
  - a reply reaching Darrell in one thread.
- **Proven-to-catch:** 13 breaks, each run and restored; each failed at least one test (the counts are in the PR).
- `test_lesson_voice.py` (38): the published tags carried back once.
- `0238-member-lesson-name-smoke.sql` on the agent_inbox leg of the RLS matrix, run live after db-migrate and rolled back. It proves:
  - the household cannot read a named row;
  - the queue carries the choice;
  - approve keeps it named; approve-anonymous writes both tags; nothing is decided twice;
  - only the Governor opens the outbox or marks a Message sent;
  - a published row owes its Message.
- The system flow graph: the queue writes `db:direct_messages` (a sink: the member reads it). The reader writes `hosted:lesson-published`, the rider carries it to `db:agent_inbox#lesson-published`, and both the queue and Your lessons read it.

## Limits, stated

- **The published Message arrives on Darrell's next visit to the queue**, not the moment the lesson is published; Your lessons shows it as soon as the NAS job carries the tags back. re-review: 2026-10-08 (whether a steward device should send owed Messages on any app open, not only the queue).
- **A member with no Messages key, or no instance shared with Darrell, gets no Message**; they see the outcome in Your lessons, and the Message is retried on each visit. re-review: 2026-10-08.
- **The name choice is remembered per device**, not across a person's devices. re-review: 2026-10-24.
- **The Routine prompt is changed by the coordinator**, not by this merge. Until it is, a named row is still written without the name (the safe side). re-review: 2026-09-25.

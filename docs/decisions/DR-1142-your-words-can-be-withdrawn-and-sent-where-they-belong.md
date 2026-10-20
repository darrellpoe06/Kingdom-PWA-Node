# DR-1142: Your words can be withdrawn, and sent where they belong — one database door, owner-only; nothing builds from a withdrawn row; the words still come back; the move pre-chooses the door

**Date:** 2026-10-20
**Status:** accepted
**Tier:** C (schema: one SECURITY DEFINER function on `agent_inbox` and the stale sweep re-declared; carried with its proof on a real PostgreSQL in CI, DR-0225)
**Type:** product (capability) + infra
**Area:**
- `infra/supabase/migrations-auto/0304-your-words-can-be-withdrawn-and-sent-where-they-belong.sql` (`withdraw_my_inbox_row(p_id, p_undo)`; `lesson_inbox_stale_sweep` re-declared)
- `infra/supabase/tests/0304-withdraw-my-words-smoke.sql`, `scripts/withdraw-ci-bootstrap.sql`, `.github/workflows/ci.yml` (`withdraw-walls`, required through the `app` aggregator)
- `infra/nas-lesson-builder/lesson_builder.py` (eligibility, `pending`, `waiting_tags`, `bell_waits`), `infra/nas-lesson-voice/lesson_voice_transcribe.py` (`carried_tags_of`), `scripts/lesson-inbox-waiting.sql`
- `app/src/lib/withdraw-my-words.js` (new, pure but for the one call), `app/src/components/MoveMyWords.jsx` (new), `lesson-inbox.js` (`withdrawn`, `withdrawnAt`), `lesson-pipeline.js` (the road stops), `saved-prompts.js` + `OneVoiceInput.jsx` (the box event carries a chosen door), `LessonInbox.jsx`, `PromptHistory.jsx`
- `app/src/__tests__/your-words-can-be-withdrawn-and-sent-where-they-belong.test.jsx` (new, 18 cases); the two riders' suites (+3)

**Amends:** DR-1141 (the words go anywhere, one or several: the words moved, the row did not), DR-0636 (the words go back to the box). Grounds: DR-0218 / migration 0127 (the inbox is append-only from the app — this is the one door opened, and only to the writer), DR-0669 (a built lesson is decided elsewhere), DR-0771 / 0252 (the stale sweep), DR-0810 (`not-a-lesson`: the precedent for "the words still come back, nothing builds, no bell"), DR-0076 (proven-to-catch), HOLD-THE-HAND-OF-THE-PROCESS (nothing is discarded).
**Declared by:** Darrell, 2026-10-20: *"Do we have the ability to send our words anywhere after collected???! We need that in case it goes to the wrong location or we may want to create a lesson from a situation or few... make sense?"* Then: *"Before or after... just to make sure... it goes to the correct location... for processing...."*

---

## Context

Before the send, the chips choose the door. After the send, the words could come back to the box and go anywhere (DR-0636; DR-1141 added gathering), but the ROW stayed where it landed. A recording meant for PoeTech, or for a prayer, that went through the lesson door kept waiting at the lesson door: the NAS lesson builder would build a lesson from it, the stale sweep would alarm for it, and nothing a signed-in person could do would change that row (0127: INSERT only; DR-0241 viewer overlay). Re-sending made a second record and left the first.

## What was measured

- `agent_inbox` policies on main (0127:79–86): SELECT for members, INSERT for collaborators' own rows, no UPDATE, no DELETE. The only tag-flipping doors are the Governor's review (0237 `review_member_lesson`) and the service role (riders, sweep). None is the writer's own.
- The builder's selects (`lesson_builder.py` `pending`, `waiting_tags`), the waiting SQL and the sweep (0252:65–72) each excluded captured / building / awaiting-review; the sweep did NOT exclude `not-a-lesson` (a reading recorded as such, DR-0810, carries that tag without `lesson-captured`), so a reading past four hours would alarm and push a phone — a latent gap, measured in the smoke's control row and closed here.
- The smoke on a real PostgreSQL 16 (locally and in CI): the member of the same house, the outsider and anon are refused; the writer's withdraw marks 2 rows (parent + transcript child); a second call changes nothing; a child row and a captured row refuse; the sweep alarms the waiting control row only and pushes its person once; undo restores both rows with both stamps kept; and the restored row alarms on the next sweep. Removing the sweep's `withdrawn` clause fails the smoke at step 4 (*"the sweep alarmed a0304,d0304"*) — proven-to-catch.

## Decision

1. **One door, owner-only.** `withdraw_my_inbox_row(p_id uuid, p_undo boolean)` (SECURITY DEFINER, EXECUTE to `authenticated` only) marks the caller's OWN row (`created_by = auth.uid()` and still a member of its instance) `withdrawn`, stamps it `withdrawn@<time>`, and does the same to every child row that names it (`of:<id>`: transcript, failure report). `p_undo` removes the tag and stamps `restored@<time>`; the history stays on the row. It refuses, by name: not yours (42501), a child row, and a row already captured / building / published / awaiting review — a lesson exists or is being decided from it, and that is DR-0669's door, not this one.
2. **Nothing builds from a withdrawn row; the bell and the sweep leave it alone.** The builder's eligibility answers *"withdrawn by its person"*; `pending`, `waiting_tags`, `bell_waits` and `lesson-inbox-waiting.sql` carry the same exclusion; the stale sweep is re-declared with `withdrawn` AND `not-a-lesson` excluded.
3. **The words still come back.** The voice rider transcribes a withdrawn recording as before (the recording is the only copy of the words) and carries `withdrawn` onto the transcript and onto a failure report, so the builder never reads the child either.
4. **The move is the person's own Send with the door pre-chosen.** `MoveMyWords` (on every Your lessons row and on the spoken-lesson rows of Your prompts) offers *Withdraw from lessons* / *Restore to lessons* and *Move to <door>*: Move withdraws, puts the words in the box (replace) and sets the chip to the chosen door — the box event now carries `route`, and the box counts it as the person's choice. The person reads and presses Send, so every door's own effects run (a PoeTech request is filed in Feedback, a prayer joins the list). Nothing is routed invisibly. A waiting recording can be withdrawn now and moved when its words come.
5. **Honest on an older database.** Until the sovereign stack takes 0304 (replay_migrations.sh on the next sync), the control says so in words and the row stays; the words can still be put in the box and sent.

## Impact

- A lesson sent to the wrong door is taken back in one tap and its words sent through the right one; a situation, or a few, can be gathered into one lesson without a stray row being built behind the person's back.
- Nothing is deleted: a withdrawn row keeps its words, its stamps and its children, and can be restored.
- A reading recorded as such no longer rings the stale alarm.
- Tenancy unchanged: the read policy, the insert policy and the viewer overlay on `agent_inbox` are not touched; the only new reach is a writer's own row.

## Verification

- `your-words-can-be-withdrawn-and-sent-where-they-belong.test.jsx` (18): the mark and its latest stamp; `withdrawable` against every built tag, on the root or the transcript; `lessonItems` carries `withdrawn`/`withdrawnAt` and the words; the road stops with the time; the client calls the door with `{p_id, p_undo}` and names not-yours / not-available-yet / the door's own reason; the box event carries `route` only when given; `moveMyWords` refuses empty words and the lesson door; the control's Withdraw → `p_undo:false` + re-read, Restore → `p_undo:true`, Move → withdraw then the event with PoeTech, then prayer on choice; a refused door moves nothing and says why; a built row offers no button; both surfaces mount it; the riders, the waiting SQL, the migration's walls and the CI job are pinned.
- `test_lesson_builder.py` (+1 case, +1 test): `(["lesson","withdrawn"], OWNER) → False, "withdrawn by its person"`, a transcript child too; `bell_waits` false; `Db.pending` / `Db.waiting_tags` carry the clause. `test_lesson_voice.py` (+1): a withdrawn recording is still transcribed and its transcript carries the tag; a plain one does not.
- `0304-withdraw-my-words-smoke.sql` on PostgreSQL 16, in CI (`withdraw-walls`, required): every wall above, PASS; the sweep clause proven-to-catch.
- Lint clean; ledger guards OK.
- `re-review: 2026-10-27`: after the sovereign stack has taken 0304 (the ledger row in `_sovereign_replay`), withdraw one real misrouted row on the live build, watch the builder's log skip it by name, and move its words to PoeTech.

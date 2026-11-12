# DR-1433: Bishop Gwin's messages become lessons from the NAS's side, his church history gathered in each

**Date:** 2026-11-12
**Status:** Accepted (built and armed by record; working when its first row is seen building, P66)
**Tier:** B (a new loop on the armed clock; deterministic class, budget and lock, DR-0248)
**Type:** decision
**Area:** `infra/nas-loops/bg-message-lessons.py` (+ install, config, test), `infra/nas-lesson-builder/lesson_writer.py` (`BG_MESSAGE_RULE`, `history_problems`), `lesson_builder.py` (`bg_wednesday`, `register_bg_session`), `services.json`, `loops-health.yml`, the flow registry
**Sent in by:** Darrell, 2026-11-12, in substance: lessons from BG's latest messages, especially Wednesdays but Sundays too; go back through the old ones and make sure the new ones are caught; he has been teaching the history of the church here in Champaign and sprinkles it into each weekly message; find or create a better way.
**Pairs with:** DR-1360 (the NAS starts every road), DR-0669 (the lesson builder), DR-0719 and DR-0712 (never assume who taught), DR-1431

## Context
A lesson from one of his messages needed a runner to join the tailnet, fetch the transcript and hand it to a session. That key expired on 2026-11-04 and again by 2026-11-10 ("invalid key: API key does not exist"). From then on, no new message could reach a session at all.

## What was measured
- **The archive (hosted copy).** It lists 16 messages since 2026-08-01 whose recorded speaker is Bishop Gwin; 9 of them are Wednesday Bible Studies.
  - Two have a lesson: L124 (Equipped to Win) and L202 (2026-09-30).
  - The hosted copy holds no transcript after 2026-09-14. The transcripts now live on the NAS.
- **This sandbox's roads to the words are all closed.** It reaches neither YouTube nor poetech.us. The transcripts table is readable only by signed-in members, and this road is not routed around that wall.
- **The lesson builder already runs on the NAS.** It already pushes with the NAS's own GitHub token and knows BG as a voice.

## Impact
Each message of his with words on the NAS becomes a lesson with no runner, no tailnet and no session. Wednesdays go first. The church history he weaves in is gathered every time.

## Decision
- **One loop on the armed services-sync clock.** `bg-message-lessons.py` reads the archive for messages whose recorded speaker is Bishop Gwin since `since` (2026-08-01), then skips:
  - messages that already have a lesson (`done`);
  - messages already sent (their own agent_inbox row, tagged `bg-message:<video id>`);
  - messages with no named speaker. These are never his by assumption (DR-0719).
- **Each message with its words becomes one row tagged `lesson`.** That rings the builder on the same machine. Wednesdays go first, then the newest. A message still waiting for its words is retried each cycle.
- **The writer is told whose words they are** (`BG_MESSAGE_RULE`):
  - this is Bishop Gwin's own message, never Darrell's teaching;
  - name the service it came from;
  - gather every piece of church history he tells, as he tells it, under FROM THE HOUSE'S HISTORY, adding nothing;
  - put a history thread that is itself a lesson into further_lessons.
- **`history_problems` refuses a lesson that lacks that part.** A Wednesday lesson is listed in `BIBLE_STUDY_SESSION_LESSONS` with its video as the evidence, so the weekly-study gate passes it.
- **Brakes (DR-0248).**
  - At most 4 rows per cycle, so the 14-message backfill paces in over about four cycles.
  - Four reads per cycle, with no retry loop.
  - Each message is sent once.
  - Stop path: `enabled: false`.
  - No credential means a named, quiet no-op.
  - Its ledger is `last-run.json`.

## Verification
- **`test_bg_message_lessons.py`, 9 cases.** Proven to catch: a message with no named speaker is never sent as his, and a message is sent once. Also covered: Wednesdays first, then the newest; the archive's misspelling Llyod; no words means waiting; the per-cycle budget.
- **`test_lesson_builder.py`, 124 green (3 new).** Proven to catch: with the tag, his message is never called Darrell's own, and a lesson without the history part fails. The registry splice was proved to parse as JS against the real file, and it is idempotent.
- **Witnesses wired.** loops-health judges it (loops list, install, prefix, receipt, diagnosis). The Way test passes, the flow graph has 0 findings, and the workflow ceiling was raised by hand to the measured 23,042 lines.

**Not yet proven:** the first row seen building. `re-review: 2026-11-19`.

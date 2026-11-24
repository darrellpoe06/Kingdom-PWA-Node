# 2026-11-24: Research is always done, and a link is all it takes

The full account behind **DR-1635**. The record stays short; the measurement lives here.

## What Darrell asked

> "Does our research tab... lane work?!!!!!! Can I add a link and it does all the work?!!!!!!! If not fix it.... I have a YouTube link and I want that to be all I need"

Mid-build he sharpened it four times:
- "Research should happen period!!!!!!!!!! For the lessons!!!!!!!!!!!! Obviously!!!!!!!"
- "Word first lessons with research!!!!!!!!!! Make sense?!!!!!!"
- "Research is always done.... that is the requirement..."
- "What does humanity believe and why... what does the Word say is higher level obviously... research shows the issues constraints and opportunities..."

## SHOULD → ARE → GAPS (DR-0219)

**SHOULD.** DR-1202 made "lesson after research and Word first processing" the new normal. One link should be researched, then become a lesson.

**ARE.**
- `ResearchSection.jsx` sent `['research']` for a bare link. `research-create.sh` then marked it `research-create-none`, and no lesson was filed.
- `OneVoiceInput.jsx` (the lesson door) sent `['lesson', ...]` straight to the builder, and `lesson_mail.py` filed `["lesson", mail:...]`. Neither road researched anything.
- **The NAS research lane runs.** The runner witnesses (`research-health.yml`, every daily run red since 2026-11-19) still die at the tailnet join: "invalid key: API key does not exist". That shows the key is dead. It does not show the lane is dead.

**The keyless read.** `inbox-lessons-waiting.yml` run 45419200008 (2026-11-24 14:58 UTC) fell through to the house's own census over the public road. The census was counted on the NAS 11 minutes earlier, by census code 399aad38c39c:

```
Waiting lesson rows: 8   oldest 12 d 2 h (2026-11-12T12:17Z)
By road -- research-inbox: 8.   By shape -- build-failed: 8.
Failed because -- crashed: 3, gates: 3, rate-limited: 1, transient: 1.
65241324 2026-11-12 12:17 build-failed/transient  gates refused: quotation (span-without-reference), rate-limited after 4
29d2c703 2026-11-12 12:17 build-failed/crashed    RuntimeError, failed after 2
7a79db92 2026-11-12 12:17 build-failed/crashed    RuntimeError, failed after 2
825019ca 2026-11-12 12:32 build-failed/crashed    gates refused: quotation; RuntimeError, failed after 2
2e7ef925 2026-11-12 12:32 build-failed/gates      gates refused: verse (not-the-verse), failed after 2
f60ed2a5 2026-11-17 03:02 build-failed/gates      quotation+verse+voice (generic-God-not-Yahweh), failed after 2
c671009b 2026-11-17 03:32 build-failed/gates      quotation+verse, failed after 2
84f74456 2026-11-19 21:02 build-failed/rate-limited  cause not stored, rate-limited after 4
The builder -- service: active; building now: 0; state: ready (2026-11-24T14:33Z).
```

So research works end to end up to the filing. The break is the builder: every lesson it was handed from research failed, and `MAX_ATTEMPTS = 2` left each one to an hourly Routine that has taken none of them in 12 days.

**GAPS.**
1. A bare link did not become a lesson. Closed here.
2. Lessons from the door and from email skipped research. Closed here, with the member privacy line in the record.
3. The lesson request did not carry his order (belief and why, the Word higher, then issues, constraints and opportunities). Closed here, in the request and in the reading prompt.
4. The builder does not finish researched lessons. Open. The `RuntimeError` traces are on the box. Gate refusals are already fed back to the writer on the retry (`previous_failures`, `lesson_builder.py:814`), and the retry still failed. The next read is the builder's own log on the NAS. `re-review: 2026-11-26`.

## What changed, file by file

- `app/src/lib/research-create.js`: `intentsToSend` (a link is always a lesson, and features adds a build); `lessonDoorTags` (the Governor's lesson or any link becomes research + `create:lesson`; a member's private words stay a lesson row); the lesson request's three-step order after WORD FIRST.
- `app/src/components/ResearchSection.jsx`: sends with `intentsToSend`; the copy says a link is researched and becomes a lesson.
- `app/src/components/OneVoiceInput.jsx`: the lesson door reads the session first, then writes `lessonDoorTags`.
- `infra/nas-lesson-mail/lesson_mail.py`: emailed lessons are research + `create:lesson`; the idempotence set reads `mail:` by prefix and counts research rows.
- `scripts/research-create.sh`: the filed lesson carries the item's `lesson-name-ok` / `lesson-name:` tags.
- `infra/nas-research/research_forwarder.py`: the reading's "what" names what people believe and why; "constraints" names the issues.

## Evidence

- 994 tests in 61 files (research, lesson and email suites) pass.
- `research_forwarder.py --selftest` and `lesson_mail.py --selftest` pass. ESLint is clean on the changed files.
- Proven to catch: putting back the old rule failed 5 cases by name.

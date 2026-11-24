# DR-1635: Research is always done, and a link is all it takes

**Date:** 2026-11-24
**Status:** Accepted
**Tier:** A (which tags a send writes; one prompt sentence; one filing step carries the name tags; no schema, no money, no new public door). The member privacy line below keeps it out of Tier B.
**Type:** decision
**Area:** `app/src/lib/research-create.js` (`intentsToSend`, `lessonDoorTags`, the lesson request's shape), `app/src/components/ResearchSection.jsx`, `app/src/components/OneVoiceInput.jsx`, `infra/nas-lesson-mail/lesson_mail.py`, `scripts/research-create.sh`, `infra/nas-research/research_forwarder.py` (the reading prompt)
**Sent in by:** Darrell, 2026-11-24, in five messages:
- *"Does our research tab... lane work?!!!!!! Can I add a link and it does all the work?!!!!!!! If not fix it.... I have a YouTube link and I want that to be all I need"*
- *"Research should happen period!!!!!!!!!! For the lessons!!!!!!!!!!!! Obviously!!!!!!!"*
- *"Word first lessons with research!!!!!!!!!! Make sense?!!!!!!"*
- *"Research is always done.... that is the requirement..."*
- *"What does humanity believe and why... what does the Word say is higher level obviously... research shows the issues constraints and opportunities..."*

**Pairs with:** DR-1172, DR-1202 (a link becomes what it was sent for; lesson after research is "the new normal"), DR-1203 (your own words first), DR-1200 (the reading), DR-1443 (the NAS answers its own research), DR-0630 (a member's lesson waits for the Governor), DR-0098 (teach the Word, never stage a debate), DR-1353 (credit where credit is due), DR-0076

## What was measured

Full measurement: `docs/99-session-notes/2026-11-24-research-is-always-done.md`.
- **Before:** a bare link was research only (`research-create-none`, no lesson). The lesson door and email wrote `lesson` rows straight to the builder, so a link inside one was never fetched.
- **The lane runs.** Run 45419200008 read the NAS census over the public road: 8 lessons filed by `research-inbox` since 2026-11-12.
- **All 8 stalled at the builder** (3 gates, 3 crashed, 1 rate-limited, 1 transient); the oldest has waited 12 d 2 h.

## Decision

1. **A link is all it takes.** In the Research tab a link is always researched and always becomes a lesson. Ticking or writing "features" adds a build request beside it. There is no research-only choice for a link. A question with no link is answered and kept as research, or becomes what was ticked. (`intentsToSend`)
2. **Research is always done for a lesson.** Every lesson door now writes a `research` row tagged `create:lesson`, never a bare `lesson` row (`lessonDoorTags`). This covers the Governor's lesson door, any lesson carrying a link, and every emailed lesson from the roster. The research lane writes the words (captions, else Whisper) or the search answer, then the reading, then files the lesson. That filed `lesson` insert is what rings the builder (0243). A failed look still files the lesson from the sender's own words (DR-1203).
3. **Word first, with research, in his order.** The lesson request now carries this order after WORD FIRST:
   1. what people believe and why, with who said it named;
   2. what the Word says, which is higher, judges that belief, and is taught rather than debated;
   3. the issues, constraints and opportunities the research shows, each answered from the Word.

   The reading prompt now asks for what people believe about the subject and why, and lists the issues among the constraints.
4. **One privacy line, kept.** A member's typed words with no link stay a `lesson` row that waits for the Governor (DR-0630). The question road would send those words to the web's search engines through SearxNG, and a member's life is not a search query. A member's link is public already and is researched.
5. **Nothing is lost on the way:**
   - The lane's filed lesson carries the sender's `lesson-name-ok` / `lesson-name:` tags.
   - The email reader keeps its one-row-per-Message-ID guard. It now reads the `mail:` tag by prefix, never by position, and it counts research rows as already filed.

## Verification

- `a-link-becomes-what-it-was-sent-for.test.jsx` gains 8 cases:
  - a bare YouTube link files `create:lesson`;
  - features alone still files a lesson beside the build;
  - a question stays research;
  - the Governor's lesson is researched with or without a link;
  - a member's link is researched, and a member's private words go to the Governor;
  - the lesson request's three steps come in order after WORD FIRST;
  - the reading prompt names beliefs and issues.
- Pins updated where they asserted the old behavior: `research-section-render`, `lesson-inbox-bell`, `lesson-door-and-pm11`, `the-lessons-email-lands-in-the-app`, and the `lesson_mail.py` selftest.
- 994 cases in 61 files across the research, lesson and email suites pass. `research_forwarder.py --selftest` passes. `lesson_mail.py --selftest` passes.
- **Proven to catch:** restoring the old rule (no link default, no owner default) failed 5 cases by name.
- **NOT YET PROVEN on the NAS (P66):** this is proven when the first link sent after this merge shows a researched answer, a reading and a filed lesson in the Research tab. `re-review: 2026-11-26`.

## Still open

The builder does not finish what research files. The crash traces are on the NAS, and the one runner road to them uses the dead tailnet key, so no fix is guessed (DR-0076). Next: read the builder's log on the box, then set the retry policy for gate refusals with that evidence. `re-review: 2026-11-26`.

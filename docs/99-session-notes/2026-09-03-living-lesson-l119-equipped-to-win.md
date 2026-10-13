# Living Lesson L119 — Equipped to Win

**Date:** 2026-09-03
**Branch:** `claude/christian-experiment-lesson-9zmvt7`
**Input:** Darrell asked for the lesson from a Love Corner YouTube video (`WQIcLeynG0w`) — a Wednesday Bible Study taught by **Bishop Lloyd E. Gwin**, 2026-09-02, "Equipped To Win" — then supplied the content himself across four messages when the fetch was blocked, adding two teachings of his own mid-build.
**Rules in force:** CLAUDE.md "Spoken Teachings Are Build Input" · DR-0089 (standing consent) · DR-0098 (teach the Word, do not debate it) · DR-0100 (state established fact plainly) · DR-0076 (verify; no verse from memory) · DR-0108 (account for the whole team's reach, not only my own) · DR-0190 (attribute, never assert on our own authority) · typographic theology + DR-0210.

---

## The access finding (DR-0108, and it is the reusable part)

**This session cannot reach YouTube.** The egress proxy recorded four `connect_rejected` entries for `www.youtube.com:443` — *"gateway answered 403 to CONNECT (policy denial)"*. Its README is explicit: report a blocked host, never route around it. `yt-dlp` was installed and the repo's own captions-only path (`--skip-download --write-auto-sub`) was attempted; the block is upstream of the tool.

Challenging that against the **team's** reach rather than mine turned up the real map, and it is worth recording because the next session will hit it too:

| Channel | State |
|---|---|
| `transcript-backfill.yml` (GitHub runner, accepts `ids:`) | **Documented non-working** — YouTube hard-blocks runner IPs; proven red across 50 attempts, run #5 (2026-07-11). Firing it would post a false red, so it was not fired. |
| NAS transcript trickle (residential IP) | **Alive** — `video_transcripts` holds 593 rows (555 with text, 38 errored), last fetch 00:16 today, 64 in 48h. But it only drains *gaps* for videos already in `choir_sermons`. |
| `choir_sermons` channel sync | **Stale** — newest row 2026-08-30, created 08-31 21:28. Nothing new in ~2 days. |

`WQIcLeynG0w` is in **neither** table, so the trickle would never have reached for it. **Carried finding:** the channel sync going quiet is a gap in the Love Corner harvest independent of this lesson — a video the church published is invisible to the app. `re-review: 2026-09-10`.

Darrell supplied the material directly, which is the one thing only he could do here.

## Source discipline

The teaching is **credited by name** — Bishop Lloyd E. Gwin, The Love Corner, 2026-09-02 — and treated as the **occasion**. It is **not reproduced**: every line of the lesson is our own prose taught from the Scriptures the message opened, and every quotation is verbatim KJV from the in-repo public-domain corpus. The real-estate illustration is attributed to him in one sentence and then grounded in Isaiah 61:4 so it cannot drift into self-improvement optimism.

**The service announced trivia winners by name. Those are private people and are deliberately not in the lesson.** The gate checks the real property — congregational honorific followed by a name — rather than banning a keyword, because the first version failed on the lesson's own note recording the omission. A gate cannot tell "the names are omitted" from "here are the names" by keyword alone.

## What Darrell added mid-build

1. **"The world can go crazy if the Word is not there… salt of the earth."** This became movement 4 and supplies the lesson's *cause*. Jeremiah 36:23-24 is the decisive scene — the scroll cut with a penknife and burned, and *"Yet they were not afraid"* — with the way already offered and refused (Jeremiah 6:16) and the book lost by neglect **inside the temple** (2 Kings 22:8). The severest sentence named is not an invasion but the Word withdrawn (Amos 8:11-12). Then the turn that earns it a place in a lesson on being equipped: if decay attends the Word's absence, those who carry it are the **preserving** office — salt that has lost its savour is good for nothing (Matthew 5:13). That is what makes 1 Peter 2:9 a **commission, not a compliment**.
2. **The seventy years were calculated, and the good suffered with the bad.** Scripture supplies the arithmetic the study pointed at: 2 Chronicles 36:21 measures the term against the sabbaths the land was denied (Leviticus 26:34-35), which is why Daniel could later read it and count (Daniel 9:2). The hard half is stated rather than softened — Daniel was himself carried away (Daniel 1:6), Ezekiel 21:3 states the principle without comfort — and the righteous man's response is the posture the whole lesson aims at: *"We have sinned"* (Daniel 9:5). **WE.** The cleanest record in the account stands inside the pronoun, which is the exact opposite of the offence and pride taken up in movement 11.

## The tension held rather than resolved

Jeremiah 19:11 says the broken vessel *"cannot be made whole again."* Jeremiah 31:4 says *"Again I will build thee."* Both are His words and neither is softened: **what is beyond MENDING is not beyond MAKING.** Man repairs; Yahweh rebuilds.

And **AGAIN is taught as expensive** — it presupposes prior possession and prior loss, and costs a second exposure to a known injury. So refusing it is frequently exhaustion rather than unbelief, and the lesson separates the two out loud, because a room that hears its reluctance called sin will add shame to grief (Isaiah 61:3).

## Verification (DR-0076)

- **174 quoted spans, every one letter-for-letter KJV**, read from `app/public/bible/kjv/`. Nothing from memory.
- **Proven-to-catch against two real alterations authoring produced**, both worth naming as classes: (1) a **lowered capital inside a quotation** — Jeremiah 31:2 reads *"The people which were left of the sword"* and it was quoted mid-sentence with a lowercase t, which is editing Scripture to fit our grammar; (2) **our own vocabulary wearing Scripture's quotation marks** — the title word *equipped* is not in the KJV at all and was sitting in quotes.
- A third defect was caught by the harness before it reached the file: a numeric renumbering pass matched **inside verse citations** (`(2 Kings 24:14) ` contains `4) `). Renumbering now keys on exact heading text.
- **Typography:** zero generic "God" in our authored voice (36 × Yahweh); no capitalized adversary name; KJV "God"/"the LORD" untouched inside every quotation; Jesus confessed as the Lamb of Yahweh.
- **Suites:** `living-lessons-l119-verses.test.js` — 90 tests; full suite **806 files / 10,983 passed / 1 skipped**; lint clean; real build clean.

## Files

- `app/src/lib/living-lessons-class.js` — L119 added; `weeks` 117 → 118
- `app/src/__tests__/living-lessons-l119-verses.test.js` — new, 90 tests

# DR-0409 — Why do we have to pay for our fathers' sins? We don't; and it needs what we do here (Living Lesson L154)

- **Status:** accepted
- **Tier:** B (COLG/family-facing teaching content on a charged family question; no schema, no money)
- **Date:** 2026-09-15
- **Type:** word
- **Scope:** `app/src/lib/living-lessons-class.js` (new L154 `ll154-why-do-we-have-to-pay-for-our-fathers-sins-we-dont-and-it-needs-what-we-do-here`, `weeks` 152→153), `app/src/__tests__/living-lessons-l154-verses.test.js` (new gate), `app/src/lib/reading-level-baseline.json` (`measuredLessons` 152→153; debt lists unchanged)
- **Principles:** WORD-FIRST, TEACH-THE-WORD-DO-NOT-DEBATE-IT (DR-0098), SPEAK-ESTABLISHED-FACT (DR-0100), SPOKEN-TEACHINGS-ARE-BUILD-INPUT (CLAUDE.md), VERIFICATION-DOCTRINE (DR-0076), DECISION-RECORDS (DR-0011)
- **Grounds:** `SCRIPTURE-REFERENCE-STANDARD.md` (verbatim KJV, gated); DR-0404 (every verse named beside its quote); DR-0210 (Yahweh in our voice); L58 *The Wind You Can Hear* (the how of following the Spirit, which this lesson stands on rather than re-teaches)

## The word, in his order

Darrell, 2026-09-15: *"Lesson. Question from my cousin. Why do we have to pay for our father's sins? Answer we don't... however it needs what we do here.... Word first responses..."* Then: *"We have the same familiar spirits etc..."* — *"Same potential outcomes because of our bloodlines etc..."* — *"Spirit follow framework still out rules that..."* — *"Word life can't be cursed..."*

## What was built

**Living Lesson L154**, on L127's program with tweaks, ten numbered sections in his order:

1. **The straight answer: we don't.** The Word asks the cousin's question in its own voice and answers it (Ezekiel 18:19-20; 18:2-4; Jeremiah 31:30; Deuteronomy 24:16; 2 Kings 14:6; John 9:3). Guilt does not transfer.
2. **Then why does it feel like we do?** The visiting texts are taught, not hidden (Exodus 20:5-6; 34:7; Jeremiah 32:18; Lamentations 5:7) — and the Word explains the Word: the visiting is attached to "of them that hate me," which Ezekiel 18 expounds son by son (18:10-17, 25). Guilt versus consequence, with David as the proof (2 Samuel 12:14).
3. **The same familiar spirits** — the KJV's own term (Leviticus 19:31; 20:6; Deuteronomy 18:11; Isaiah 8:19-20; 1 Samuel 28:7); the mechanism Jesus named (John 8:44); the war not with flesh and blood (Ephesians 6:12; 1 Peter 5:8-9; Matthew 12:45).
4. **Same potential outcomes because of our bloodlines** — stated plainly (Psalms 51:5; Ephesians 2:3; Romans 5:12, 19) and proved a potential, not a verdict, by the kings (1 Kings 15:3, 11; 2 Chronicles 33:22-23; 34:2; Proverbs 13:22; 20:7).
5. **However — it needs what we do here** — Ezekiel 18's own grammar (18:14, 28, 30-31); Genesis 4:7; Deuteronomy 30:19; Joshua 24:15; the opposite choice (Matthew 23:31-32); Acts 2:40; the saints confessing the fathers' iniquity as the house's own (Nehemiah 9:2; Daniel 9:8; Leviticus 26:40-42).
6. **The Spirit-follow framework still overrules that** — Romans 8:1-2, 14-16; Galatians 4:6-7; John 1:12-13; 2 Corinthians 5:17; Colossians 1:13; Galatians 5:16, 18, 25 — pointing to L58 for the how.
7. **The curse was broken at the tree** — Galatians 3:13; 1 Peter 1:18-19 ("received by tradition from your fathers"); Isaiah 53:5-6; Colossians 2:14; Hebrews 2:14-15; 1 John 3:8; Psalms 103:10-13; Micah 7:19; 1 Corinthians 15:22.
8. **A Word life cannot be cursed** — Proverbs 26:2; Numbers 23:8, 20, 23; Deuteronomy 32:47; John 6:63; Proverbs 4:20-22; Psalms 119:93; Psalms 1:2-3; Deuteronomy 28:2; Proverbs 3:33; Job 1:10; Isaiah 54:17; 1 John 5:18; Psalms 91:10; Luke 10:19; Revelation 12:11; Romans 8:37.
9. **What we do here, exactly** — resist, arm, cast down, renounce, burn the books, refuse the root, honour the father while refusing his sin (Exodus 20:12 never lapsed), overcome evil with good, receive the turning of hearts (James 4:7; Ephesians 6:11; 2 Corinthians 10:5; 4:2; Acts 19:19; Hebrews 12:15; Romans 12:21; Malachi 4:6) — with the honest word on Achan's and Korah's houses (Joshua 7:24; Numbers 16:32), recorded, not explained past the text.
10. **The answer for the cousin, in order** — six lines with a verse beside each, and the last word a door, not a ledger (Ezekiel 18:32; Luke 15:20).

## DR-0098 / DR-0100, applied

- The hard texts are **taught**: Exodus 20:5 and Lamentations 5:7 in the body and in the teen and senior bands; Achan and Korah named. A lesson that dropped them to make the answer easier would fail its own gate.
- Where the Word is reticent (the two swept houses), the lesson says so and stops: *"The Word does not explain those two the way it explains Ezekiel 18; it records them."* No man-debate is staged; no "scholars disagree."
- Guilt and consequence are kept apart with David as the proof, which is the pastoral key for the person who cannot stop carrying it.

## Verification

- `living-lessons-l154-verses.test.js`: full shape (12 quiz, 13 benefits, 14 talking points, 15 prompts, body > 15,000 chars); ten sections FIRST→TENTH through the real formatter; every double-quoted span verbatim KJV with **no** allowlist (his and his cousin's words ride unquoted); the three anchors and eleven load-bearing lines pinned whole with the reference beside each; one-word tamper proof; zero generic "God" in our voice; adversary lowercase; the visiting texts and the two houses present in body and bands; the reticence sentence present; guilt/consequence and honour pinned; every section teaches from ≥3 cited verses; L58 exists.
- Reading-level gate: child 2.1 / teen 5.3 / senior 16.8 (authored), ascending, under the 7.0 ceiling; baseline `measuredLessons` 152→153, debt unchanged.
- every-anchor-is-named, lesson-flow, id-collision, lesson-format, L153 gate green; lint clean.

## Limits, stated

- The lesson does not re-teach the Spirit-walk; it stands on L58 and says so. If Darrell wants the "Spirit follow framework" written out as its own numbered method beside this lesson, that is a new record.
- Stacked on DR-0408's branch; renumber-on-merge per DR-0052 if a concurrent lane lands first.

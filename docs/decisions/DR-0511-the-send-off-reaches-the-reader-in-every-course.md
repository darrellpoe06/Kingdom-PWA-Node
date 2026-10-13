# DR-0511 — The Send-off reaches the reader in every course, and the debt file hits zero

- **Status:** accepted
- **Tier:** B (content the whole school serves)
- **Type:** content
- **Date:** 2026-09-18
- **Scope:** `app/src/lib/church-classes.js`, `broadcast-class.js`, `infrastructure-class.js`, `ai-legal-blueprint-class.js`, `succession-class.js`, `legacy-provisions-course.js`, `economics-class.js`, `sovereign-ai-class.js` (69 lessons gain `benefits`), `app/src/lib/stage-reaches-reader-baseline.json` (345 → **0**)
- **Principles:** EVERY-STAGE-REACHES-THE-READER (DR-0509), VERIFICATION-DOCTRINE (DR-0076 §1 §3), NO-ELISION-IN-A-QUOTATION (DR-0459), YAHWEH-IN-OUR-VOICE (DR-0210), PERPETUAL-IMPROVEMENT (DR-0075), NOTHING-WAITS (DR-0236)
- **Grounds:** Darrell, 2026-09-18: *"Send off is not populated in the latest lessons"*, *"the quality of the lessons and depth of some lessons seem to be wanting"*, and *"Maybe the Send off updates will suffice"*

## What was still broken after the reported fix

DR-0509 fixed the five Real Estate courses Darrell was looking at and, in the same commit, measured the rest of the catalog honestly rather than stopping at the report. The walk found **345 more empty reader-facing stages** — 69 lessons across eight older courses, every one of them the **send** stage, every one of them `benefits: []`.

Recording that as shrink-only debt was the right call at the time and it would have been the wrong place to stop. Darrell's second and third messages name why: the depth complaint was not only about Real Estate, and the Send-off is where a lesson tells the reader what they now carry. 69 lessons ended on a heading with nothing under it.

## What shipped

**345 benefits across 69 lessons**, and the baseline file reaches **zero** — every course key REMOVED rather than set to zero, so the gate now demands that *every course in the catalog* stay at zero and a single bare stage anywhere fails the build.

| course | lessons | benefits |
|---|---|---|
| A.I. class | 8 | 40 |
| Broadcast | 9 | 50 |
| Infrastructure | 10 | 60 |
| A.I. Legal Blueprint | 6 | 36 |
| Handed Forward | 5 | 30 |
| Legacy Provisions | 7 | 42 |
| Kingdom Economics | 8 | 48 |
| Sovereign A.I. | 16 | 96 |

**205 quoted spans verified character-for-character** against the repo's own KJV before a single line was spliced.

They are written to what each course actually teaches, never to a template. A soft focus cannot be repaired downstream. RAID is not a backup, and a backup never restored is only a hope. The NAS has no graphics card on purpose. The mesh has effectively zero always-on GPU power today and the course says so out loud. Delete does not guarantee deletion, and a court has ordered preserved logs. The tier, not the brand, governs your data. The builder does not get to decide whether the heir is wise. The parable condemns the servant who kept it perfectly safe. A wall that never opens is not His pattern — a wall plus a jubilee is. Dropping an unverifiable statistic is not muting the documented reality underneath it, which is worse than the myth ever claimed.

## The refusal that made it safe to write this much this fast

A generator, not a promise. It refuses to splice on: fewer than five benefits for a lesson, a quoted span that is not verbatim in the reference cited beside it, an ellipsis inside a quotation, a capitalised adversary, `"the LORD"` in our own voice, a lesson id it cannot find, a module that already carries benefits, and a raw apostrophe that would terminate the JS string.

**All of those proven to fire** against a deliberately broken batch — a drifted word, a quotation hung on the wrong reference, an elision, a capitalised adversary, the divine title in our own prose, and a short list.

It caught two real defects in my own drafts: a quotation of Genesis 2:15 that began `"The"` where the verse begins `"And the"`, and a span crossing a verse boundary. The second was a **limitation in the instrument, not the text** — so the cited range is now joined the way the KJV reads it and matched whole, and drift across that join still fails, proven.

One convention is introduced and enforced: inside a benefit, a **straight** double-quoted span is a claim of verbatim Scripture and must verify; an ordinary quoted phrase of our own uses the typographic pair. Without it, "quoted span with no reference" could not be a real defect — it fired on five scare-quotes the first time it ran.

## Eight elisions repaired on the way through

DR-0459 allows no ellipsis inside a quotation and the only remedy is a shorter genuinely-verbatim span. Found and repaired where this work touched them: Matthew 28:19-20 and a paraphrase of 2 Timothy 2:2 (youth class), Exodus 35 (broadcast), 1 Chronicles 28:20 (infrastructure), 1 Chronicles 28:9 (handed forward), Matthew 25:26-27 (legacy provisions), and Ecclesiastes 4:9-12 (kingdom economics, two in one sentence). One quotation of Genesis 2:15 read `"the Lord"` where the KJV reads `"the LORD"` and now reads as written.

## The finding this opened, stated plainly

Scanning those eight files for the same defect found dozens more still in them, so the repo's own instrument (`scripts/quotation-integrity.mjs`, built for DR-0473) was pointed at the whole catalog for the first time. It had only ever watched the Living Lessons **series**; the **courses** were never scanned, so the debt was invisible rather than absent.

Measured across all 438 catalog lessons: **908 elided spans in 156 lessons**, **798 of them His own words**, with a contiguous verbatim alternative available for **767**. The remedy exists for almost all of it; nobody was being asked for it. That is recorded and ratcheted in **DR-0512**, in this same session — named here rather than quietly left.

## Proven at zero

With the baseline's course map empty, stripping one lesson's benefits from Kingdom Economics fails the build with `kingdom-economics: 5 empty reader-facing stages, and it was at ZERO`. A gate at zero that cannot be broken is theatre; this one breaks.

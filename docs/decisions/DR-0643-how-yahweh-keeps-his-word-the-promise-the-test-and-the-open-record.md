# DR-0643 — L195: How Yahweh Keeps His Word — the Promise, the Test, and the Open Record

- **Status:** accepted
- **Tier:** B
- **Type:** word
- **Date:** 2026-09-24
- **Scope:** `app/src/lib/living-lessons-class.js` (L195, `ll195-how-yahweh-keeps-his-word-the-promise-the-test-and-the-open-record`; `LIVING_LESSONS_META.weeks` 191 → 192, the count of modules); `app/src/lib/living-lessons-dates.js` (L195's day, joined at birth per DR-0621); `app/src/__tests__/living-lessons-l193-verses.test.js` (new, 24 checks); `app/src/__tests__/living-lessons-order.test.jsx` (the "newest is L192" pins move to L195); the count pins a new lesson moves, the same set L192 moved — `learn-crosslist.test.js` (catalog total 720 → 721), and `measuredLessons` / `lessons` +1 in `band-differentiation-baseline.json`, `course-quotation-integrity-baseline.json`, `full-levels-baseline.json`, `reading-level-baseline.json`, `stage-reaches-reader-baseline.json`, `title-in-narrative-baseline.json` (counts only; no debt entry added — the lesson clears every gate outright).
- **Principles:** WORD-FIRST, TEACH-DONT-DEBATE, SPEAK-ESTABLISHED-FACT, VERIFICATION-DOCTRINE, SPOKEN-TEACHINGS-ARE-BUILD-INPUT, DECISION-RECORDS
- **Grounds:** DR-0098 (name a debate only to educate past it by the Word), DR-0100 (state established fact with its basis; flag the genuinely open narrowly), DR-0076 (fetch every verse; never fabricate; provenance and honest uncertainty), DR-0210 (Yahweh in our voice; quoted KJV untouched), DR-0331 (no one's words in quotation marks but Scripture's), DR-0555 / DR-0556 (the summary-provenance pattern and the NAS transcript lane).

---

## The report

On 2026-09-24 Darrell sent, under the single word **Lesson**, a written **summary** of a video debate (0:00-29:35) on the textual preservation of the Quran compared with the Bible. It is a summary with timestamps, not a transcript, and its final paragraph is cut off mid-sentence ("A final segment explores the nature of"). The points it carries:

- One participant argues the Quran is uniquely and perfectly preserved, citing its uniform use across the modern sects (0:00-1:15, 5:40-7:24).
- The challenger points to early manuscripts: the Sanaa manuscript, a palimpsest whose erased lower text carries non-Uthmanic variants (word order, synonyms, segments absent or phrased differently) while its upper text is mostly Uthmanic, and "NLR Marcel 2". He argues the Uthmanic codex (standardized under the caliph Uthman ibn Affan, r. about 644-656 CE) was a later standardization and other readings were suppressed (2:32-4:10, 8:52-14:28).
- Method: modern uniformity versus primary ancient manuscript evidence as proof of preservation.
- The challenger asks how the Quran can claim to confirm the Torah and Gospel while rejecting the versions that exist, and uses Matthew 23 as an analogy for following a tradition while disagreeing with its present practitioners (19:04-29:35).

## The decision

**Placement: Living Lessons, L195.** It was minted as L193, the next number after the highest on `origin/main` (L192), after checking origin and the open PRs at the start of the session. By the time it was pushed, two concurrent lanes had claimed the numbers in between: PR #1803 (L193, *What It Costs to Keep Your Soul*, DR-0642) and the branch `claude/lesson-every-hearer-all-of-them` (L194, *I AM*, DR-0646). So it was renumbered to **L195** before its PR opened (DR-0052: the lesson that lands later takes the next free number). The id is `ll195-…`; nothing depends on the gap. When those two lanes merge, the order and catalog-count pins (`living-lessons-order.test.jsx`, `learn-crosslist.test.js`, the six `measuredLessons` baselines) reconcile by count, not by content. The Historical Research department was weighed and not chosen: its one course is built around a single case (the 1619 Project) across eight competencies, and a lesson on how the Word presents its own preservation is a Word lesson first, which is what the Living Lessons series is. The lesson borrows that course's craft (the claim sorted from the record, two or three witnesses, the record stated at the strength it gives) without being forced into its case.

**What the lesson teaches, in order, Word first:**

1. **The promise is His** — Isaiah 40:6, 8; 1 Peter 1:23, 25; Matthew 24:35; Psalms 119:89; Psalms 12:6-7. The keeper named is Yahweh. The Word never promises that no copyist slipped, and never asks us to pretend none did.
2. **The Word shows how He keeps it** — Jeremiah 36:23, 28, 32: the king burns the roll; Yahweh has every word written again. Deuteronomy 4:2 and Proverbs 30:6 forbid adding, which presupposes a copy can be tampered with — so the Word itself tells us to look at copies with open eyes.
3. **How to test a claim** — 1 Thessalonians 5:21; 1 John 4:1-2 (a test by content); Acts 17:11 (the Bereans checked Paul himself); Proverbs 18:17; Deuteronomy 19:15.
4. **One scale** — Proverbs 20:10; Matthew 7:2. Whatever test is applied to the Quran's preservation is applied to the Bible's, and the Bible goes on the scale first.
5. **Two kinds of evidence** — agreement among readers today versus what the earliest copies read; Luke 1:2, 4 for the method the Word honors.
6. **The Bible's record is open, and it has variants** — Isaiah 53:5; Luke 4:17, 21. The lesson never claims the Bible's manuscripts have no variants; a test pins that the claim is absent from everything taught.
7. **Matthew 23 in its context** — 23:2, 3, 23; John 10:35; Luke 24:27. Jesus separates the Word read from Moses' seat from the conduct of the men in it; the warning cuts at the church first.
8. **Galatians 1 in its context** — 1:6, 8, 11. Paul puts himself under the test first; rank decides nothing; a standard, not a weapon.
9. **The neighbor** — Matthew 22:39; 1 Peter 3:15; Colossians 4:6; Romans 10:1; 2 Corinthians 4:2; the close, John 20:31. Muslims are neighbors to love and reach, never mocked; the lesson seeks no win.

**Respect and attribution.** The debaters are named only as the summary names them ("one participant", "the challenger"). No debater is quoted: every double-quoted span in the lesson is Scripture with its reference, and a test enforces it. Positions are attributed "as the summary reports it".

## Every fact stated, with its basis (DR-0100 / DR-0076)

| Fact in the lesson | Basis |
|---|---|
| A palimpsest is a reused page whose first writing was scraped or washed off and written over; the lower text can often be recovered with special light / ultraviolet and multispectral imaging | Standard definition; general knowledge, not fetched this session. Stated as established. |
| The Sanaa manuscript is a Quran palimpsest; upper text mostly the standard (Uthmanic) text; lower text differs in word order, synonyms, passages absent or phrased otherwise | **As the summary reports it.** Web search on 2026-09-24 corroborated the description (search-index snippets, not the documents). Stated with "as the summary describes it". |
| The lower text is the documented example of an early Quran text outside the standard one | Search-index snippet of the published study, which describes the lower text as "the only known extant copy from a textual tradition beside the standard Uthmanic one". **The study itself was not opened.** |
| The study most often cited: Behnam Sadeghi and Mohsen Goudarzi, "Ṣan‘ā’ 1 and the Origins of the Qur'ān", *Der Islam* 87 (2012) | Citation **located** by web search (several independent listings); the document could not be fetched (`degruyter.com`, `archive.org` and `en.wikipedia.org` are blocked by this environment's egress proxy). The lesson says so to the reader in every band but the child's, which says it in a child's words. |
| Uthman ibn Affan's rule, about 644-656 | **As the summary dates it**, and said so in the lesson. |
| The challenger's inference that other readings were suppressed | **As summarized**, attributed. |
| NLR Marcel 2 | **Named by the summary only; not examined.** The lesson says so. |
| The Bible was copied by hand and its copies carry variants; critical editions of the Hebrew Bible and Greek New Testament print the variant readings on the page | Established fact; general knowledge of the printed critical editions (apparatus), not fetched this session. |
| The Great Isaiah Scroll (1QIsa^a): found 1947 in a cave at Qumran; the whole book, 66 chapters; about the 2nd century BC; about a thousand years older than the medieval Masoretic copies that had been the oldest complete Hebrew Isaiah; differences mostly spelling and small grammar; plainly the same book; kept at the Shrine of the Book, Israel Museum; photographed and published by the museum | Web search 2026-09-24: the Israel Museum's Digital Dead Sea Scrolls page for the scroll (`dss.collections.imj.org.il/isaiah`, located in the index but blocked to fetch), Donald W. Parry's 1QIsa^a work (BYU ScholarsArchive), and press coverage of the museum's display; and the repo's own sourced statement in `app/src/lib/yahweh-by-century.js` (Israel Antiquities Authority; the Shrine of the Book). The search summaries also gave "about 125 BCE", "95-98% identical" and "more than 2,600 variants"; **those numbers are deliberately not stated** because no primary page carrying them was opened. |

Where the summary says the Quran claims to confirm the Torah and Gospel, the lesson carries that only as the challenger's question, and states nothing about Quranic text on its own authority.

## Verification

- **Verses:** 40 distinct references, 124 quoted spans across every field (lesson, four bands, big idea, quiz, benefits, anchor theme, talking points); `scanQuotedVerses` resolves **124 of 124 verbatim** against `app/public/bible/kjv`, 0 faults. Every verse was fetched from the corpus before the prose was written. The first run caught six case mismatches (a capital added or dropped at the front of a span: Jeremiah 36:23, Isaiah 40:8, Luke 4:17 ×2, Matthew 23:3, 1 John 4:1) — the gate is case-sensitive by design — and each was rewritten so the quotation carries His exact case.
- **Proven to catch (DR-0076 §3):** the L195 test plants `God keeps it.` into our prose and asserts the voice check fires, and alters one word of Isaiah 40:8 and asserts the verse gate faults.
- **Bands, measured** (Flesch-Kincaid on our prose, quotes stripped): child **0.9** (ceiling 5.0), youth **5.2**, teen **7.3**, senior **10.1** — ascending. Fullness vs 1,555 adult prose words: child 0.57 (floor 0.5), youth 0.68, teen 0.76, senior 0.91 (floor 0.6). Band differentiation worst pair **0.02** (ceiling 0.5). Every band names its lesson in its opening window.
- **Voice:** no generic "God" in our prose, no capitalised adversary name, straight quotation marks, no ellipsis in a quotation, no record id or percentage in reader-facing text — each pinned in the test.
- **Suites and gates, measured 2026-09-24/25 in this worktree:** the 70 test files that read the Living Lessons corpus or its gates (every corpus-wide gate, the order, dates, catalog-count and band suites, plus L195's own; the per-lesson `living-lessons-lNN-verses` files of OTHER lessons were left to CI, since each reads only its own lesson) — **70 of 70 files, 1,605 of 1,605 tests passed** (two files re-run alone after a worker ran out of memory on the shared machine; both green). An earlier broader run also passed 52 of the other lessons' verse files before the machine terminated it. ESLint clean (`--max-warnings 0`) on every changed JS file. `node scripts/business-systems-guard.mjs` → OK, ledger whole, newest DR-0643, pointer correct. `node scripts/legibility-guard.mjs --health` → 254/267 pages pass, health file unchanged by this work. `node scripts/monolith-budget-guard.mjs` → OK. `quotation-integrity.mjs` and `quoted-verse-is-the-verse.mjs` exit 0. Zero conflict markers.

## Limits, stated

1. **No transcript, and no video id.** The summary gives no URL or video id, so `source-transcript-nas.yml` (the lane DR-0556 used to fetch captions from the NAS's residential IP) **cannot be run** for this lesson: it needs an id. The lesson ships on summary provenance and says so on its face. `re-review: 2026-10-24` — if Darrell supplies the link, run `source-transcript-nas.yml`, commit the captions under `docs/99-session-notes/sources/`, and re-read every attributed position against the speakers' own words, as DR-0556 did for DR-0555. If no link has come by then, carry the limit forward with a new date rather than dropping it.
2. **The summary is cut off mid-sentence** at "A final segment explores the nature of". The lesson stops where the summary stops and says so. Closes with limit 1.
3. **The Sanaa study was located, not read.** `re-review: 2026-10-24` — fetch Sadeghi & Goudarzi (2012) on a GitHub runner or the NAS (whichever route reaches the publisher), confirm the lesson's summary-level description against the study's own words, and upgrade "as the summary reports it" to the study where it holds.
4. **The Isaiah Scroll facts rest on search-index corroboration plus the repo's prior sourced statement**, not on a page fetched this session. `re-review: 2026-10-24` — fetch the Israel Museum page on a runner and pin its date and description in the test.
5. **NLR Marcel 2 was not examined.** It stays named-only until limit 3's pass looks at it.
6. **`docs/decisions/INDEX.md` Next ID:** DR-0639 through DR-0642 are claimed by open PRs; this record takes DR-0643 and moves the pointer to DR-0644.

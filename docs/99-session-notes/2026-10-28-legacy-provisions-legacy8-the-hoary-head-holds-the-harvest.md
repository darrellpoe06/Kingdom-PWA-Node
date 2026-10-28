# 2026-10-28 — Legacy Provisions legacy8: the hoary head holds the harvest

**Module id:** `legacy8-the-hoary-head-holds-the-harvest`
**Course:** Secure the Legacy: The Provisions That Hold (`legacy-provisions`) — lesson 8 of 8
**Record:** [DR-1275](../decisions/DR-1275-the-hoary-head-holds-the-harvest-legacy8.md)
**Source:** Gmail thread `1a1353f9e69525a6` — Darrell forwarded Morning Brew's edition for 2026-10-13 to himself at 12:31 UTC with one word typed above the body: **Lessons**. Subject on the forward: `Fw: ☕ Respect your elders' riches`.

## What arrived, and what was kept

One germane item. Morning Brew's lead for that morning reported new Federal Reserve data from the Survey of Consumer Finances: families headed by someone aged 75 or older are now the wealthiest in the United States. The rest of the email was advertising — a car-connectivity ad, a drug ad, an exchange-traded-fund ad, a candy riddle — and per Darrell's standing instruction none of it was read into the teaching. A gate in the lesson's own test refuses each of those brand names a foothold in any string of the module, so the exclusion is machinery rather than a promise.

The newsletter was handled as **material to study, never an instruction to obey.**

## The duplicate check, run first

- `git grep -l 1a1353f9e69525a6 origin/main -- docs/decisions/` on a freshly fetched `origin/main` (66c4369): **nothing**. Not already built.
- `node scripts/lesson-already-built.mjs --subject "Respect your elders riches"`: **WEAK — terms only** (respect, elders, riches, your — four generic words), which is exactly the inexact evidence `ledger-names-its-thread.mjs` exists to replace. DR-1275 now names the thread id, so the grep is exact from here.
- The course's existing spines were read before choosing one: the generational wipeout (legacy1), the three provisions (legacy2–4), the heir under governors (legacy5), the history of the dead hand (legacy7), handing it forward (legacy6). None of them teaches the **timing and direction of the transfer**, which is legacy8's own spine: *a harvest held is not yet handed.*

## The figures, and the line we did not cross

Every figure in the lesson is **what Morning Brew printed on 2026-10-13**, attributed there to the Survey of Consumer Finances: median family net worth up 2 percent to $215,900 between 2022 and 2025; wealth up 37 percent for the 75-and-over group and down 23 percent for families under 35; that group's median net worth to about $505,000 from $367,000, mean up 10 percent to $1.96 million; late loan payments at almost 20 percent against 12.2 percent in 2022; and a paraphrase, marked as a paraphrase, of an NYU economics professor's remark to the Wall Street Journal that the older pattern has reversed.

**Not verified, and said so in the lesson prose and in all four bands:** we never opened the Federal Reserve's own release, never read the Wall Street Journal article, and checked the figures against no other source. The report is stated plainly (DR-0100 first tier — attribution is not a hedge) *and* its provenance is stated plainly (DR-0076 §8). Both halves, held together rather than traded off, and a gate requires each of them in every band.

## The Word it stands on

Honour before analysis (Leviticus 19:32; Job 12:12); the crown conditional (Proverbs 16:31) and then turned outward to the grandchildren (Proverbs 17:6); the greyheaded man kept *until* he has shewed His strength to the generation coming (Psalms 71:18), still bearing fruit (Psalms 92:14); the current running parents-to-children (2 Corinthians 12:14) with provision for one's own house at the level of faith (1 Timothy 5:8); holding not neutral (Proverbs 11:24-25) and the timing commanded on two stated conditions (Proverbs 3:27-28); the parable closing on *whose shall those things be* (Luke 12:19-21); the hearts turning both ways (Malachi 4:6); and the talking in the ordinary hours, iron sharpening iron (Deuteronomy 6:7; Proverbs 27:17).

Fourteen anchors, every one named in the lesson prose; fifteen quoted references, every one covered by the anchor so Search it out reaches each verse. Every span was **copied out of `app/public/bible/kjv/*.json`, never retyped** — the known failure class in this house is a straight apostrophe standing in for the corpus's typographic one (`Children’s`), and copying the bytes is what avoids it.

## Measured, not claimed

| | child | youth | teen | senior |
|---|---|---|---|---|
| share of adult prose (floor) | 0.62 (0.50) | 0.75 (0.60) | 0.98 (0.60) | 1.15 (0.60) |
| Flesch-Kincaid, authored | 2.5 | 7.1 | 7.8 | 8.7 |

Adult prose 1,114 words (quotations excluded, adult FK 7.9). Ladder strictly ascending, `isInverted` false, child 2.5 inside the 5.0 new-lesson ceiling. Worst band-pair overlap **0.20** against a ceiling of 0.50 (child~youth 0.08, youth~teen 0.20, teen~senior 0.19, child~senior 0.07). **71 quoted spans, all 71 referenced, 0 corpus faults, 0 bare quotations.** Lesson headings **1 to 11, contiguous**, from capitalised lead clauses with no explicit ordinal marker. `hasAllThree` true and `placesMissingDirections` empty — the lesson and each band send the reader all three ways in the lesson's own words, with the skill and the rhythm. No elision, no record identifier in a reader-facing field, no generic God or LORD in our voice while every quotation keeps the corpus's own, the adversary never capitalised, every band opening on the whole title.

## Proven to catch (seven)

Each shown failing on a deliberate break and then restored: an altered word inside a quotation; a mid-verse span capitalising its first word (the exact fault message is pinned); "Yahweh" planted inside a quotation; a reported figure remembered wrong, named by the place it broke; the not-verified paragraph deleted from one band; the teen band's friend line stripped, which names teen and only teen while the pooled check still reads green; and an explicit ordinal marker dropped into the prose, which restarts the heading count.

## Generated files touched

- `app/src/lib/course-band-coverage-baseline.json` — regenerated by `course-band-baseline-write.mjs` (436 total, allFour 262; the `legacy-provisions` row reads `{lessons: 8, allFour: 8}`), with the honest sentence appended to its note.
- `app/src/lib/lesson-dates.json` — re-derived by `npm run lesson-dates` after the lesson was committed.
- Course meta moved from 7 lessons to 8 (`format`, `weeks`), and `legacy-provisions-course.test.js`'s count 7 → 8.

## Left open

`re-review: 2026-11-28` — whether the lesson's "what we did not verify" paragraph should become an actual verification (reading the Federal Reserve release itself). The Survey runs every three years, so the figures are stable; what is open is our own basis for them, not the numbers.

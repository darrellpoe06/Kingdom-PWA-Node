# 2026-11-26 — L343, Unbelievers Are Not Righteous (DR-1691)

## What Darrell spoke

A teaching spoken into the app on 2026-11-26, opened with "this is a lesson, by the way." Rendered for meaning (DR-0331), in his order:

- Unbelievers are not righteous according to Yahweh. If you do not believe Him, you are not righteous to Him. If you believe Him and do not do what He says, you are not righteous to Him either.
- He is testing us every day to see whether we do what He says. He is enjoying, and emotionally connected to, what we do every day; He created us for His purposes and His enjoyment.
- He created everything, and we are His workmanship, the way people created AI. So we learn to respect, submit to, and enjoy His purposes.
- He made us to have families and be families, and to talk with Him on a consistent basis.
- He allows stress, watches how we go through it, and builds us through it so we are strong no matter who or what comes around. That is soundness.
- His ways and thoughts are above ours. He has many paths, but He says THE way, the truth, and the life.
- He says He is Father, Son, and Holy Spirit, the Godhead, one. Who are we to tell Him what He means? Sit down, relax, get comfortable in this eternal timeline, and learn what He is saying.
- We are in time, going into eternity. Life apart from this has been garbage; nothing else matters.
- Focus, like Mr. Miyagi telling Daniel-san (The Karate Kid), wax on, wax off.
- His prayer: help us see You, focus, and be who we are meant to be; by His blood, by His stripes, we are healed; one source, one Godhead, Alpha and Omega, the first and the last; You should be the first one listened to. In Jesus' name, amen.

## What his word became

`app/src/lib/living-lessons/ll343-unbelievers-are-not-righteous.js`, the next Living Lesson after L342, in the Living Lessons catalog (`LIVING_LESSONS_MODULES`) and the Learn surfaces that read it, dated 2026-11-26. Each movement above is a CAPS section of the adult lesson; the four age bands carry the same teaching in their own register; his prayer closes the adult lesson in his words, rendered for meaning, with the verses under it.

## How it was built

1. `node scripts/new-lesson.mjs --title "Unbelievers Are Not Righteous" --anchor "Hebrews 11:6" --added 2026-11-26` reserved L343 (`reserve/ll-343`) and DR-1691 (`reserve/dr-1691`) on origin and wrote the skeleton and its test.
2. Every candidate verse was read from `app/public/bible/kjv` before it was used; verses that did not say the movement were left out (Ecclesiastes 3:11 reads "world" in the KJV, so it was not used for eternity).
3. Prose written; quotations written only as `{{kjv:...}}` tokens; `node scripts/fill-verses.mjs` filled 212.
4. First gate run: band shares short (child 0.39, youth 0.42, teen 0.43, senior 0.45). Each band gained taught paragraphs (child: the bus picture and the morning habit; youth: the two sides of one truth and the daily tests; teen: the self-test and stress as training; senior: the witness of a long life and praying for unbelieving loved ones). Re-measured: 0.51 / 0.61 / 0.62 / 0.61.

## Guarded choices

- **The word "God" in our voice.** The gate refuses it; his "one God" is rendered as "one Godhead" / "the one Lord". Quoted Scripture keeps "God" and "the LORD" verbatim (DR-0210 bright line).
- **"An issue He has."** Rendered as Yahweh being emotionally connected to what we do, shown from the Word on both sides: He rejoices (Zephaniah 3:17) and He grieves (Genesis 6:6; Ephesians 4:30). Nothing beyond what the Word says.
- **Doing and grace.** Ephesians 2:8-10 is taught beside James 2 so the second movement is not heard as earning (the Word explaining the Word, DR-0098).
- **1 John 5:7** is quoted as the KJV the app carries; no debate staged (DR-0098).
- **The film.** His Karate Kid line is the author's illustration: a joke and a widely known cultural reference (The Karate Kid, 1984: Miyagi trains Daniel through waxing cars), not a factual claim the lesson rests on. Darrell, 2026-11-26: it will land; everybody knows Karate Kid. First built with an UNCHECKED line and a re-review date; both dropped on his word, and the line stays exactly as his.
- **Typography.** "the devils" appears only inside James 2:19, lowercase.

## Wiring checked

Every file naming `ll342` was grepped: only the lesson and its test. The per-file lessons are read into the catalog by `lessonFileNames` (no list to edit). `learn-catalog-snapshot` and `learn-studio` hold 994 as a floor, so a new lesson passes. `learn-integrity-baseline` lists lessons outside the Phase 1 baseline as new, so no re-measure is owed (L342's PR re-measured only to keep L342 out of the baseline).

## Catalog-wide results

Every test file that reads the lesson catalog (381 files) ran locally: 14,176 passed, 26 failed. All 26 were one shared check, `spoken-lessons-name-darrell` (DR-0719, no bare "the teacher" in a spoken lesson), repeated across the lesson test files that import it; the hit was the film character in the Karate Kid line. Fixed by naming Miyagi (commit 211f43b), then that check, the L343 gate and reader length passed 18/18. CI on the PR found the same one failure.

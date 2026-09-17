# DR-0465 — L149 Cultural Competency: all four levels made full, and three ellipses that had already shipped

- **Status:** accepted
- **Tier:** B (a shipped lesson in the learner-facing series brought up to the full-levels standard; content is teaching)
- **Date:** 2026-09-17
- **Type:** app
- **Scope:** `app/src/lib/living-lessons-class.js` (L149's four bands authored in full; three joined quotations split), `app/src/__tests__/living-lessons-l149-full-levels.test.js` (new, 38 checks; 67/67 breaks caught against it and the lesson's existing verses gate as a pair), `app/src/lib/full-levels-baseline.json` and `title-in-narrative-baseline.json` (both SHRUNK — a debt entry removed, never added)
- **Principles:** FULL-LEVELS (DR-0418), VERIFICATION-DOCTRINE (DR-0076), TEACH-NOT-DEBATE (DR-0098), COVENANT-NAME (DR-0210), PERPETUAL-IMPROVEMENT (DR-0075)
- **Grounds:** DR-0417 (the child ceiling is a corpus number; a pre-existing lesson is held to 7.0), DR-0456 / DR-0457 (the strict comparison and the book-name rule), DR-0459 (the ellipsis refusal, which this lesson predates), DR-0461 / DR-0462 (windowed checks and the windowing helper)

## Why this exists

The full-levels pass (DR-0418) works newest-downward, and with L153 excluded by Darrell, L149 was next. It was also the largest job in the pass so far. Measured before any work: the adult lesson runs **3,036 prose words**, and the four bands held **161 / 0 / 328 / 377** — a child band at 5% of the message, a youth band that **did not exist at all**, and two more at about a tenth each. A reader who chose a level was handed a summary of a lesson while being told it was the lesson.

## The decision

**a. All four bands are authored in full, and the youth band is written from nothing.** Measured after: child 2,031 (ratio 0.669, floor 0.50), youth 2,869 (0.945), teen 2,880 (0.949), senior 3,508 (1.155). Reading ladder 1.55 / 5.30 / 5.82 / 6.76 — monotone, and the child band well under the 7.0 corpus ceiling a pre-existing lesson is held to (DR-0417).

**b. EVERY BAND KEEPS BOTH HALVES OF THE THESIS, because this lesson collapses in either direction.** "There are different ways to play it, but there is one Way to win." Drop the first half and it teaches a man who cannot hear anyone unlike him and calls that conviction; drop the second and every reading is equally true, nobody is ever wrong, and there is nothing to be saved from. Both halves are checked per band, with the strait gate (Matthew 7:13-14) and the Son's own first-person claim (John 14:6).

**c. The four readings of the word all survive in every band** — talk a man cannot back; the game of LIFE, which is a report on endurance rather than a compliment about a mouth; the whole truth told far too early, whose very completeness is what makes it sound manufactured; and the fourth, which is the Book itself (Proverbs 1:2-4, with *subtilty to the simple* drawn out).

**d. THE SUSPICION STAYS EARNED, in every band.** The room that disbelieved Saul had watched him hold coats at a stoning; a band that made them the villains would teach a reader to feel wronged instead of understood. "Earned by HIS OWN PAST, not by their small hearts" is a checked property, and so is what he was up against: the truer he sounded, the more he sounded like a man who had practised.

**e. AND BARNABAS SUPPLIES EVIDENCE, NEVER WARMTH.** He never asks the room to be less careful. He supplies the thing it was actually missing and stakes his own name on it (Acts 9:27) — and then time finishes the work, because time is the only witness a changed man has (Galatians 1:23-24; 2 Corinthians 5:17). "Be like Barnabas, be nice" is the sentimental misread, and the evidence word is checked per band.

**f. Habakkuk counts the loss BEFORE he chooses the joy, and the gate checks the ORDER.** 3:17 then 3:18, with every band saying out loud that it is not denial. Choosing joy without the inventory is exactly the sentimentality this section refuses.

**g. The order is kept: HIM, and then her.** She is among the things ADDED (Matthew 6:33), never the foundation the change rests on — checked per band, because a band that lost it would teach a man to build on a person and call it faith.

**h. And Yahweh is put where the man is standing.** He has told the whole truth from the beginning to people lied to by nearly everything else, and He answered the suspicion with a receipt rather than volume: *while we were yet sinners, Christ died for us* (Romans 5:8), which is why the order is *We love him, because he first loved us* (1 John 4:19).

## Verification (DR-0076)

- **THE PRE-EXISTING CONTENT WAS AUDITED BEFORE A WORD OF IT WAS COPIED INTO FOUR BANDS, and it carried three defects.** Three quotations were joined across verses with an ellipsis inside the quotation marks — 2 Corinthians 6:8 joined to 6:10 (six times), Proverbs 1:2 joined to 1:4, and 1 Corinthians 9:19 joined to 9:22 — each presenting a truncation as the Word's own words. This lesson predates DR-0459's refusal, so nothing had caught them. Each is now two genuinely verbatim spans with its own reference, and the gate refuses any ellipsis anywhere in the module. **Had the audit not run first, the defect would have been multiplied by four.**
- **A LOOSE BOOK PATTERN WAS HIDING A SPAN FROM EVERY CHECK.** `([1-3]?\s?[A-Za-z]+)` cannot match "Song of Solomon", so that span read as *unreferenced* and was never compared to the corpus at all — in the audit script and in every per-lesson gate written this way. The pattern now allows internal words, a check proves the Song of Solomon span is actually parsed and compared, and a break alters that verse by one letter to prove it.
- **After the fixes: every referenced span in the module is verbatim under the STRICT comparison, 0 non-verbatim, 0 ellipses.** The four new bands contribute 290 spans, all verbatim and referenced.
- **38 checks; 67 breaks applied for real, 67 caught, 0 missed, 0 no-ops.** Each break global inside the L149 block only, asserting the edit landed before the gate ran.
- **ONE OF THE 67 WAS A BAD BREAK RATHER THAN A MISS, and is recorded as such.** Removing the capitalised phrase "UPBRAIDETH NOT" left every band still saying what it means — *He does not make you feel stupid for needing to ask* — which IS the property, so the gate was right to stay green. The break was rewritten to remove the explanation itself, and then it was caught. Telling those two apart is the difference between strengthening a gate and weakening it.
- **Both shrink-only baselines SHRANK.** full-levels: L149's entry removed, `lessonsShort` 90 → 89. title-in-narrative: L149's three unnamed bands removed, `lessonsUnnamed` 156 → 155, `bandsUnnamed` 468 → 465, per-band counts decremented. No entry was added to either. The reading-level baseline is unchanged: L149 sits in `knownLessons`, which is not a debt list, and it offends neither the ceiling nor the ladder.
- **AND SPLITTING THE JOINED QUOTATION EXPOSED A THIRD THING, caught by the anchor gate on the full verify.** `2 Corinthians 6:9` was listed as an anchor of this lesson and was "named" only by the old `(2 Corinthians 6:8-10)` RANGE label. With the range gone, 6:9 was named by nothing — and the lesson does not quote or teach that verse at all. The honest fix is to stop claiming it as an anchor rather than to pad the lesson with a verse it never handled, so the anchor list now reads 6:8 and 6:10.
- **AND A NEAR-MISS OF MY OWN, CAUGHT BY GIT AND RECORDED RATHER THAN QUIETLY FIXED.** This lesson already had a per-lesson gate — `living-lessons-l149-verses.test.js`, 395 lines, written when the lesson was authored, carrying Darrell's own spoken words in its header and pinning the four readings with their COUNT asserted, the told-in-advance explanation and the order of Him and then her. I wrote a new gate straight over it with `cat >`. The staging list said `M` where a new file would have said `A`, which is what surfaced it. The original was restored from the previous commit, **its 52 checks were run against the newly authored bands and all 52 pass** — which is itself worth knowing, because it means the bands kept every property the lesson's own gate protects — and the full-levels checks moved into their own file beside it (`living-lessons-l149-full-levels.test.js`). The standing lesson: **before writing a per-lesson gate, look for the one that already exists.** Deleting a gate is the one edit that makes everything else look greener.
- **The break harness was then re-run against BOTH gates as a pair**, since the checks now live in two files: 67 breaks, 67 caught, 0 missed.
- Full verify green.

## What is still NOT proven

- **65 quoted spans elsewhere in this lesson carry no inline reference.** They sit in `stories[].body` and similar fields, which follow an older convention where the reference is not inline. They are not altered — the strict audit compares only referenced spans, so they are *unchecked* rather than wrong. Auditing that convention across the series is its own pass. **`re-review: 2026-10-24`**, alongside the already-dated sweep of the per-lesson gates' own pinned fragments.
- **89 lessons still carry a band below the floor.** This pass continues newest-downward; L153 remains excluded by Darrell.

## Files

- `app/src/lib/living-lessons-class.js` — L149's four bands, and three joined quotations split
- `app/src/__tests__/living-lessons-l149-full-levels.test.js` — new, 38 checks
- `app/src/__tests__/living-lessons-l149-verses.test.js` — UNCHANGED (restored after I overwrote it); its 52 checks pass against the new bands
- `app/src/lib/full-levels-baseline.json` — L149 removed; 90 → 89
- `app/src/lib/title-in-narrative-baseline.json` — L149 removed; 156 → 155 lessons, 468 → 465 bands
- `docs/decisions/INDEX.md` — row + pointer

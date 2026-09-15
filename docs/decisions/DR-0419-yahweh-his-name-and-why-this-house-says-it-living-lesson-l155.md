# DR-0419 — Yahweh: His Name, and why this house says it (Living Lesson L155)

- **Status:** accepted
- **Tier:** B (COLG/family-facing teaching content on the Name; no schema, no money)
- **Date:** 2026-09-15
- **Type:** word
- **Scope:** `app/src/lib/living-lessons-class.js` (new L155 `ll155-yahweh-his-name-and-why-this-house-says-it`, `weeks` 153→154), `app/src/__tests__/living-lessons-l155-verses.test.js` (new gate), `app/src/lib/reading-level-baseline.json` (`measuredLessons` 153→154; `knownLessons` unchanged — L155 is held to the 5.0 age ceiling), `app/src/lib/full-levels-baseline.json` (`measuredLessons` 153→154; L155 is full in every band and is not in the debt)
- **Principles:** WORD-FIRST, TEACH-THE-WORD-DO-NOT-DEBATE-IT (DR-0098), SPEAK-ESTABLISHED-FACT (DR-0100), SPOKEN-TEACHINGS-ARE-BUILD-INPUT (CLAUDE.md), VERIFICATION-DOCTRINE (DR-0076), YAHWEH-IN-OUR-VOICE (DR-0210), DECISION-RECORDS (DR-0011)
- **Grounds:** CLAUDE.md "Say Yahweh, not the generic God, in our voice" (DR-0210) and its bright line (DR-0076: quoted Scripture is never edited); `SCRIPTURE-REFERENCE-STANDARD.md`; DR-0417/DR-0418 (a new lesson ships with four full bands, child under 5.0)

## The word, as spoken

Darrell, 2026-09-15: *"And also the importance of using Yahweh as opposed to God because God is a person who has left this earth, no longer has a body on earth. So it's technically everyone who's passed away is considered a God according to, I believe, the biblical scriptures, according to what some of these scholars have said. So I would like Yahweh's name specifically to be able to be said so we know he's the highest of those, and he's the only one — the Godhead is the only one of us who have the never beginning never ending position, so he is the first and the last. That's also a lesson."*

## What the Word shows, and where the lesson stops (DR-0098 / DR-0100)

- **Established from the text and taught plainly:** He gave His name Himself and called it His name for ever (Exodus 3:14-15; 6:3; Psalms 83:18; 68:4; 135:13). The generic word is a category the Word uses of judges (Psalms 82:1, 6-7; John 10:34-35), of idols (Psalms 96:5; Jeremiah 10:10-11), of the adversary (2 Corinthians 4:4), in the serpent's bait (Genesis 3:5), and once of a departed spirit in a medium's mouth (1 Samuel 28:13); Paul's summary is 1 Corinthians 8:5-6. He alone is the first and the last (Isaiah 44:6; 43:10-11; Psalms 90:2; Isaiah 57:15; 1 Timothy 6:16; 40:28; Deuteronomy 32:39), and the risen Son says the same of Himself (Revelation 1:8, 17-18; 22:13; John 8:58), so the position is the Godhead's (Philippians 2:9-10; Deuteronomy 6:4). The name is to be known, run into and called upon (Psalms 9:10; Proverbs 18:10; Joel 2:32; Malachi 1:11; Acts 4:12), is guarded (Exodus 20:7; Isaiah 42:8; 34:14; Judges 2:12), and was confessed as a name on Carmel (1 Kings 18:21, 39). History resolves to one LORD and one name (Zechariah 14:9; Malachi 3:6; Hebrews 13:8; John 17:3).
- **Narrowed, honestly:** the relayed claim that *everyone who has died is counted a god* rests on one verse (1 Samuel 28:13), spoken by the woman at Endor about one apparition; the narrator never adopts her word, and no text extends it. The lesson says the smaller sure thing — the category word has been used of the living, the dead, the false and the fallen, so by itself it does not identify whom is meant — and states that the Word never says the dead become gods. The gate pins both the reticence sentence and the absence of the over-claim.
- **Boundaries taught (section NINE):** not a rebuke of the King James (LORD in small capitals is the name); not a verdict on believers who say the generic word (Jesus said Father); not a rule for other people's mouths; and never an edit inside a quoted verse.

## The build

Ten numbered sections, 15,173 characters, every one of ~130 quoted spans verbatim from the hosted KJV with its reference beside it, expanded from the corpus at write time (never typed). Four full bands measured before the write (authored prose, share of the adult prose, Flesch-Kincaid): child 745 words · 0.50 · 1.2; youth 903 · 0.61 · 4.9; teen 904 · 0.61 · 3.9; senior 906 · 0.61 · 10.0 — every floor met, ordering child < teen < senior, child under the 5.0 age ceiling. Eleven quiz questions with explanations, ten benefits, eleven talking points, eleven discussion prompts, a timed how-to-run. The generic word appears in our own voice only inside quotation marks as the word under discussion (spans under eight characters are not Scripture claims), and the DR-0210 check strips quoted spans and then refuses the term.

## Proof

`living-lessons-l155-verses.test.js`: shape, ten sections, every span verbatim (proven-to-catch on one altered word), anchors quoted whole with labels, the reticence sentence present and the over-claim absent, four bands authored and ascending, DR-0210 in our voice, the Lamb-and-Eternal-Son confession present. Plus the corpus gates: naming (every anchor named beside its quote), provenance ratchet, reading-level (child ≤ 5.0 new-lesson ceiling; ordering), fullness (no new short band), age-appropriateness, typography.

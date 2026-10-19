# DR-1103: Yahweh's voices in red, across the whole Bible, and a color picker that is never cut off

**Date:** 2026-10-18
**Status:** accepted
**Tier:** A (additive: reader data, a palette color, a placement fix; every quote verified verbatim by gate)
**Type:** feature
**Area:**
- `scripts/build-scripture-voices.mjs`: the generator (source pinned by sha256) and the passages read by hand in Psalms, Isaiah and Deuteronomy
- `app/public/bible/voices/<Book>.json` and `manifest.json`: 66 lazy per-book assets, beside `bible/kjv`
- `app/src/lib/scripture-voices.js`: the Father and the Holy Spirit now red with the Son; `loadVoiceBook`; the hand-verified quotes still win per verse
- `app/src/lib/bible-kjv.js`: `loadBibleAsset`, the same fetch seam the text uses
- `app/src/components/BibleReader.jsx`: loads a book's voices in the voices view, with the legend and copy updated
- `app/src/components/VerseHighlighter.jsx`: `placeMenu`, which decides where the color palette opens
- Tests: `yahwehs-voices-in-red.test.js`, `the-color-picker-is-never-cut-off.test.jsx`, `bible-reader-render.test.jsx` (Psalms 110) and `scripture-voices.test.js` (red reserved for the Godhead)

**Amends:** DR-0099 in application, not in principle. DR-0099 reserves true red for "the Blood / redemption / the Godhead". The voices palette had applied it to the Son alone, with the Father in gold and the Spirit in teal. All three Persons now speak in red.
**Grounds:**
- DR-0076: every quote is verbatim and every rule is measured.
- DR-0098: the Word explains the Word. Psalms 82:6 is "the word of God" by John 10:34-35, and Psalms 95:7-11 is the Holy Ghost by Hebrews 3:7-11.
- DR-0138: what is colored is what is cast in the dramatized read.

**Declared by:** Darrell, 2026-10-18, with a screenshot of Psalms 110 in the reader:
- "We need the voices of Yahweh in red to be accurate based on what we believe is all Yahweh's Voices..."
- "Also we can't adjust the color of the text because it's cut off... make sense!?"

## Context

The screenshot showed every verse of Psalms 110 in red, while the voices legend above it read "no voices verified in this chapter yet — only the narration." The red came from Darrell's own per-verse marks (the filled dots at the right). The red-letter set held about 40 hand-verified quotes, so almost every chapter of the Bible had nothing marked.

Marking the whole psalm red is also wrong on the text itself. Psalms 110 holds two sentences of Yahweh:
- **verse 1:** "Sit thou at my right hand, until I make thine enemies thy footstool."
- **verse 4:** "Thou art a priest for ever after the order of Melchizedek."

Verses 2-3 and 5-7 are David speaking of Him. Matthew 22:43-44 and Hebrews 5:5-6 say the same.

The palette sat right next to the dock. It always dropped down from the dot, so on the last verses, at A+++ print, its Emphasis row and Clear slid under the bottom dock (FEEDBACK · GIVE · READ).

## Decision

**1. Red is the Godhead's color.** Red is the color of the Father, the Son and the Holy Spirit alike: one God, one color (DR-0099). The legend and the dramatized cast tell the Persons apart by name. Nothing else in the palette may draw red; `scripture-voices.test.js` holds that.

**2. His words are colored across all 66 books, and only where the Word itself says He is speaking.**
- **The Son.** From the public-domain eBible.org KJV, whose `<q who="Jesus">` markup is the red-letter tradition. It is aligned word by word onto our KJV text, so a quote keeps our spelling: "satan", "cloak", "righteousness’ sake". All 2,066 marked verses carried over; the 32 that differ in spelling were checked one by one.
- **The Father.** Where the verse names Him as the speaker:
  - "the LORD said unto…" and "God spake…, saying,";
  - "Thus saith the LORD" and "…, saith the LORD";
  - "the word of the LORD came… saying,";
  - "a voice from heaven, saying, This is my beloved Son";
  - "he that sat upon the throne said".

  The prophet's frame ("Thus saith the LORD, thy Redeemer, the Holy One of Israel;") and an apostle's frame ("For it is written,") stay plain.
- **The Holy Spirit.** "the Holy Ghost said", "the Spirit said unto…", "Thus saith the Holy Ghost", "as the Holy Ghost saith".

**3. A speech carries into the next verse only while it plainly continues.**
- **In the law and the narrative** (Genesis to Numbers, Job), it stops at narration, at another speaker, or at a past-tense verse with no one addressed.
- **In the prophets, Deuteronomy, the history books and the New Testament,** it also stops where the verse speaks of Him in the third person.
- **"And he said"** is read as His only when He spoke within the last three verses.
- **A man's quotation is his own.** When a man is speaking, a "God hath said" inside his words stays his, and is never colored as His. Eve's misquote (Genesis 3:3) is the case this protects. A prophet or apostle relaying His word is the exception.

**4. Three books are partly read by hand.**
- **Psalms.** The speakers change with no marker, so nothing carries from verse to verse by rule there. Every psalm passage where He plainly speaks in the first person was read and listed: 2, 50, 60, 68, 75, 81, 82, 89, 91, 95, 105, 108, 110 and 132.
- **Isaiah 40-55.** All 16 chapters were read. His words were listed where no formula marks them: 41:10 "Fear thou not; for I am with thee", 43:11, all of 47, and 55:1-5. The prophet's hymns (42:10-13, 52:7-12) and the "we" of 53:1-10 stay plain.
- **Deuteronomy.** It is Moses' sermon, so it is strict. The Ten Commandments of 5:6-21 are listed by hand, because 5:4-5 says "The LORD talked with you face to face… saying,".

**4a. Where the New Testament names Old Testament words as the Son's or the Father's, they carry that voice.** The Word explains the Word, and each case is the New Testament's own words, fetched verbatim:
- **The Son's words:**
  - Psalms 40:6-8, by Hebrews 10:5-7: "when he cometh into the world, he saith";
  - Psalms 22:22 and Isaiah 8:18, by Hebrews 2:12-13;
  - Psalms 22:1, by Matthew 27:46;
  - Psalms 16:8-11, by Acts 2:25-31;
  - Psalms 69:9, by Romans 15:3;
  - Psalms 41:9, by John 13:18;
  - Isaiah 61:1-3, by Luke 4:21: "This day is this scripture fulfilled in your ears".
- **The Father's words:**
  - Psalms 45:6-7, by Hebrews 1:8: "unto the Son he saith, Thy throne, O God";
  - Psalms 102:25-27, by Hebrews 1:10-12;
  - Psalms 104:4, by Hebrews 1:7.

The Servant's own words in Isaiah that the New Testament does not name as His speech (49:1-5, 50:4-9) stay plain.

**5. The angel of the LORD is not assumed to be Him.** His words are red where the verse itself names them the LORD's: "By myself have I sworn, saith the LORD" (Genesis 22:16), or "God called unto him out of the midst of the bush" (Exodus 3:4). Elsewhere they stay plain. This is the one place where coloring more would rest on reading rather than on the text, so it is held for Darrell (see Opportunities).

**6. The palette opens where it fits.** `placeMenu` measures the room below the dot, down to the dock's top edge (the dock publishes `--chrome-dock-h`), and the room above it. The palette opens down when it fits, up when there is more room above, and scrolls inside itself when neither side holds it.

## What was measured

- **The whole set:**
  - 2,096 spans of the Son, 3,524 of the Father and 15 of the Holy Spirit;
  - 1.2 MB across 66 lazy files, so a book's voices load only when the voices view opens that book;
  - every span verbatim in its verse, checked over the whole Bible by the gate.
- **Precision, by random audit with the verse before each sample read:**
  - **Audit 1 (45 Old Testament spans):** 4 wrong speakers. They were 1 Chronicles 19:13 (Joab), 1 Kings 22:17 (Micaiah), 2 Kings 13:18 (Elisha) and Numbers 26:58 (a census line). Each was fixed at its rule: "And he said" now needs Him within three verses; a past-tense verse with no one addressed ends a speech; the history books are strict.
  - **Audits 2, 3 and 4 (40 spans each, after the fixes):** 0 wrong speakers in 120. Two boundary slips were fixed: a "Thus" and a title before the speech, and "and there builded he" after it.
  - **The full New Testament list (37 non-Jesus spans), read whole:** 5 errors, all fixed. They were Simeon's prayer, Paul's "it is written" (twice), and the missed Father in Matthew 17:5 and John 12:28.
  - **Audit 5 (40 spans, after the Isaiah reading and a case fix):** 1 wrong speaker, Jeremiah 27:12 ("I spake also to Zedekiah", the prophet telling what he did), and 1 boundary slip, Joshua 5:9's "Wherefore the name of the place is called Gilgal". Both were fixed at their rules.
  - **Audit 6 (40 spans, the final rules):** 0 wrong speakers.
- **Reading Isaiah turned up a precision bug.** The third-person check was case-sensitive, so a sentence opening "The Lord GOD hath given me…" (Isaiah 50:4-6, the Servant) passed as His. It now reads "The" and "the" alike.
- **The gate caught one of my own rules breaking.** The past-tense stop cut the Ten Commandments off at Exodus 20:11 ("For in six days the LORD made heaven and earth…"). A verse that opens on a reason ("For", "Because", "Lest") now stays in the speech. Re-auditing that change found Deuteronomy's law running on as Yahweh's, which is Moses' sermon, so Deuteronomy was made strict.
- **Proven to catch:**
  - the Psalms 110 render test fails when the reader's voice load is disabled;
  - the dock test shows the same spot fitting below with no dock and opening up with a 90px dock;
  - each rule fixture shows the miss it guards against.
- **Recall is not claimed.** Formula-less speech outside the hand-read Psalms (for example, long stretches of Isaiah between one "saith the LORD" and the next) stays plain where the rules cannot tell it from the prophet's voice. The rules miss His words there rather than give a man's words to Him.

## Impact

In the voices view, Psalms 110 now shows red only on "Sit thou at my right hand…" and "Thou art a priest for ever…". The Ten Commandments, the burning bush, the Father over the Son at the Jordan and on the mount, the Spirit sending Barnabas and Saul, and "Behold, I make all things new" are red where the Word says He spoke them. The tempter stays cold. Darrell's own marks on Psalms 110 are still his, and still win over the view; the dot beside each verse clears them. The palette opens upward on the last verses, so every row and Clear are reachable.

## Opportunities and constraints

- **Opportunity: the angel of the LORD.** Genesis 16:13 calls the angel's words "the LORD that spake unto her", Exodus 3:2-4 makes the angel God in the bush, and Judges 2:1 has the angel say "I made you to go up out of Egypt". Coloring every OT "angel of the LORD" speech red is a reading Darrell can make for the platform. Default kept: red only where the verse names Him. `re-review: 2026-10-25`.
- **Opportunity: formula-less oracles in the rest of the prophets.** Isaiah 40-55 is read. Isaiah 1-39 and 56-66, Jeremiah, Ezekiel and the twelve are next, each the same way: a list entry plus the verbatim gate. This is my work in the same lane, not a person's. `re-review: 2026-11-01`.
- **Constraint (held): the KJV only.** The quotes are KJV text, so another edition shows no voices and says so, rather than coloring words that are not there.
- **Constraint (held): a KJV text change needs a rebuild.** Any change to the KJV text (for example `scripts/kjv-name-case-corrections.mjs`) must be followed by `node scripts/build-scripture-voices.mjs`. If it is not, the verbatim gate fails and names the verse.

## Verification

- `yahwehs-voices-in-red.test.js`, 24 tests:
  - every quote in all 66 books verbatim, and the manifest's counts matching the assets;
  - the source sha256 pinned;
  - Psalms 110 exactly verses 1 and 4;
  - Exodus 20:2-17 His, and 20:18-21 not;
  - Eve, Adam and Simeon plain;
  - John 12:28 with both the Son and the Father;
  - Acts 13:2 the Spirit, and Psalms 95 and Hebrews 3:7 the Spirit;
  - every hand-read entry in its verse and in its voice;
  - the New Testament-named Son passages;
  - Isaiah 40-55 with the prophet's hymns plain;
  - the rule fixtures, each proven to catch;
  - the runtime load, the hand-verified quotes winning, and another edition never colored.
- `the-color-picker-is-never-cut-off.test.jsx`, 5 tests: the pure placement, plus the real picker on the last verse opening up with Clear in reach.
- `bible-reader-render.test.jsx`: Psalms 110 in the real reader, proven to catch.
- `scripture-voices.test.js`: red reserved for the Godhead.
- `re-review: 2026-10-25`: read Psalms 110, Exodus 20, Isaiah 1 and Matthew 17 in the live reader's voices view, and settle the angel of the LORD.

# 2026-10-18: Yahweh's voices in red, and the color picker that was cut off (DR-1103)

## What Darrell sent

He sent a screenshot of Psalms 110 in the reader's voices view, with every verse red, and two lines:
- "We need the voices of Yahweh in red to be accurate based on what we believe is all Yahweh's Voices..."
- "Also we can't adjust the color of the text because it's cut off... make sense!?"

## What was true before

- **Where the red came from.** The red in the screenshot was his own per-verse marks. The voices set had about 40 hand-verified quotes, and none in Psalms 110, so its legend read "no voices verified in this chapter yet".
- **The palette's colors.** It colored only the Son red. The Father was gold and the Spirit teal.
- **The color picker.** It always opened downward. On the last verse, at large print, its Emphasis row and Clear sat under the bottom dock.

## What changed

1. **The Godhead is red.** The Father, the Son and the Holy Spirit all speak in red (DR-0099: red is the Blood and the Godhead's own color).
2. **Every book carries its voices.** `node scripts/build-scripture-voices.mjs` writes `app/public/bible/voices/<Book>.json`. The source is the eBible.org public-domain KJV, pinned by sha256.
   - **The Son:** that source's red-letter markup, aligned word by word onto our KJV.
   - **The Father and the Holy Spirit:** wherever the verse names Him the speaker. The prophet's frame and the apostle's frame stay plain.
   - **Psalms, Isaiah 40-55 and Deuteronomy 5:** read by hand.
   - **Old Testament words the New Testament names as the Son's or the Father's** carry that voice (Hebrews 10:5-7, Luke 4:21, Hebrews 1:8 and others).
3. **The reader loads a book's voices** when the voices view opens it. The hand-verified quotes still win per verse, and another edition shows none.
4. **The picker measures the room it has,** down to the dock's top edge (`--chrome-dock-h`). It opens up when down would not fit, and scrolls when neither side holds it.

## Measured, not assumed

- **The whole set:** 2,096 Son, 3,524 Father and 15 Spirit spans. The gate checks every one verbatim over the whole Bible.
- **The audits,** each sample read with the verse before it:
  - first 45: 4 wrong speakers (Joab, Micaiah, Elisha, a census line), each fixed at its rule;
  - next 120: 0 wrong speakers;
  - after the Isaiah reading: 1 wrong speaker in 40 (Jeremiah 27:12, the prophet narrating), fixed;
  - final 40: 0 wrong speakers;
  - the whole New Testament non-Jesus list: 5 errors, all fixed (Simeon, Paul's "it is written", the missed Father in Matthew 17:5 and John 12:28).
- **The gate caught my own regression:** the Ten Commandments were cut off at Exodus 20:11. The fix ("For…" clauses stay in the speech) was re-audited and exposed Deuteronomy's law running on as Yahweh's. Deuteronomy is now strict.
- **Proven to catch:**
  - the Psalms 110 render test fails with the voice load disabled;
  - the dock test fits below with no dock and opens up with one.

## Held for Darrell

- **The angel of the LORD:** red everywhere in the Old Testament, or only where the verse names the words the LORD's (the current default)? Genesis 16:13, Exodus 3:2-4 and Judges 2:1 bear on it.
- **His own marks on Psalms 110:** they are his data and still win over the view. The dot beside each verse clears them.

## For the next session

- **If the KJV text ever changes,** rebuild with `node scripts/build-scripture-voices.mjs <path to eng-kjv.osis.xml>`. Without a path it fetches the pinned source and refuses a different hash.
- **Extend `READ_BY_HAND` to the rest of the prophets.** Isaiah 40-55 is done; Isaiah 1-39 and 56-66, Jeremiah, Ezekiel and the twelve are next. This is agent work in the same lane: each entry plus the verbatim gate. `re-review: 2026-11-01`.

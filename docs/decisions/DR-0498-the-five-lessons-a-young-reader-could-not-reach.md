# DR-0498 — The five lessons a young reader could not reach

- **Status:** accepted
- **Tier:** B (content the whole school serves, on two live courses)
- **Date:** 2026-09-18
- **Type:** content
- **Scope:** `app/src/lib/broadcast-class.js` (teen + senior bands on bc2, bc3, bc4, bc6, bc7; three Scripture corrections), `app/src/lib/church-classes.js` (teen + senior on `wk3-the-test`), `app/src/lib/course-band-coverage-baseline.json` (lowered), `app/src/__tests__/course-bands-reach-the-reader.test.js` (new, 39 checks), `app/src/__tests__/course-band-coverage.test.js` (18 checks)
- **Principles:** EVERY-BAND-IS-THE-WHOLE-MESSAGE (DR-0418), VERIFICATION-DOCTRINE (DR-0076 §1 §3 §4), MEASURE-THEN-AIM (DR-0497), PERPETUAL-IMPROVEMENT (DR-0075)
- **Grounds:** DR-0497 (the count, and the correction that made this aimable), DR-0484 (the differentiation ceiling), DR-0459 (no elision inside a quotation)

## What the measurement pointed at, once it was honest

DR-0497 counted 43 course lessons carrying no authored age band and claimed a child opening any of them is handed adult words. The correction measured the text those lessons actually serve and found the real defect was **five**:

| lesson | grade of the served text |
|---|---|
| `broadcast` `bc6-bandwidth-network` | **16.3** |
| `broadcast` `bc3-light` | **14.0** |
| `broadcast` `bc2-camera-and-image` | **12.4** |
| `broadcast` `bc4-obs-switching` | **11.5** |
| `ai` `wk3-the-test` | **10.3** |

Those five are now fixed, and `bc7-llms-for-broadcast` came with them so the broadcast course is whole. **Catalog-wide `adultRegister` is zero**, and the ratchet holds it there: a new bandless lesson reading above grade 9 fails the build.

This is the whole argument for measuring before authoring. The un-corrected record would have sent this pass at `little-learners`, which reads at grade 0.3 and needed nothing, and `bc6` at 16.3 would still be sitting in front of whoever opened it.

## What was written, and how it was written

Each of the six lessons gained a **teen** and a **senior** band, matching the two-band pattern the broadcast course already used on bc1, bc5, bc8 and bc9 — not the four-band Living-Lessons shape, because these are paced course lessons and the course's own authored pattern is the honest precedent.

Measured, not asserted:

| lesson | teen | senior | adult | teen~senior overlap |
|---|---|---|---|---|
| `bc2` | 3.5 | 8.5 | 12.9 | 0.00 |
| `bc3` | 4.0 | 8.6 | 14.0 | 0.00 |
| `bc4` | 4.3 | 9.9 | 11.5 | 0.00 |
| `bc6` | 5.1 | 9.9 | 16.3 | 0.00 |
| `bc7` | 4.8 | 9.3 | 7.7 | 0.00 |
| `wk3` | 2.9 | 7.5 | 10.3 | 0.00 |

Every band carries **at least 0.9 of the adult text's length** (the house floor is 0.6), and overlap against the adult text is at most 0.11 on eight-word shingles. That is what it looks like when a band is conceived for its reader instead of paraphrased down: the teen band of `bc6` teaches the three pipes as three pipes a person can point at, and the senior band teaches the same material as budget arithmetic with headroom as the operating rule. Same lesson, two conceptions, no shared sentences.

## Three unmarked paraphrases found while writing, and corrected

Writing the bands meant reading the adult text closely, which turned up Scripture rendered from memory in the lessons themselves:

- `bc2` read *"The eye is the lamp of the body (Matthew 6:22)"* — with no quotation marks and no note that it was a paraphrase. The KJV reads **"The light of the body is the eye"**. The anchor theme carried the same wording and is corrected too.
- `bc7` rendered 1 Thessalonians 5:21 as *"test everything, hold fast what is good"*. The KJV reads **"Prove all things; hold fast that which is good"**.
- `bc7` compressed Colossians 3:16 to *"Let the word of Christ dwell richly"*, dropping **"in you"**. Corrected to the verbatim span.

All three are now quoted verbatim with their references, and pinned by a check. This is DR-0076 in the form it usually arrives: not a fabricated verse, just a remembered one, in content that has been live for weeks.

## Proven to catch

39 checks in the new file, and the breaks are fed to **the same predicates the live checks run**, so a break exercises the gate rather than a re-written copy of the rule: an inverted ladder, a teen band at the adult register, a band identical to its sibling, a band re-registered from the adult text, a two-sentence stub against the fullness floor, a quotation drifted by one word, a quotation hung on the wrong reference (5:22 for 5:21), and a deleted or whitespace-only band.

Then four breaks against the **real corpus**, each reverted after: deleting `bc3`'s teen band (5 checks failed), making `bc4`'s teen band a copy of its senior band (3 failed), drifting one word of `bc7`'s 1 Thessalonians quote (2 failed), and restoring `bc2`'s original unmarked paraphrase (1 failed). A gate that has never been shown to fail is not a gate.

## What is still open, with its date

37 course lessons remain bandless, and **all of them read at or below grade 9 in the text they serve** — `little-learners` at 0.3, `mathematics` at 1.5, `development` at 6.3, `ai` at 6.7, `rent-to-own-business` at 7.1. That is a label gap: the reader can reach the words, but the level selector has nothing to offer. Authoring bands there is a real improvement and not a defect being carried, which is why it keeps the date rather than the queue's front. **re-review: 2026-10-16.**

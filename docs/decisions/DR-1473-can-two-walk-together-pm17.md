# DR-1473 — Can two walk together: pm17 from one word over a trade newsletter

**Date:** 2026-11-13 · **Status:** accepted · **Tier:** A · **Area:** Project Management lesson 17; the lesson lane
**Principles:** WORD-FIRST, VERIFICATION-DOCTRINE, THREE-TIERS, TEACH-NOT-DEBATE, FOUR-BANDS, DECISION-RECORDS
**Narrative:** `docs/99-session-notes/2026-11-13-project-management-pm17-can-two-walk-together.md`

## Context

Darrell forwarded a Supply Chain Connect send, `FW: AI is Testing the Limits of Chip Production`, from his university mailbox on **2026-10-28 at 17:08 UTC**. Gmail thread `1a1837bf55922f04`. Above the forwarded header he typed one word — *Lesson.* — and then lifted **one item by hand** out of the body and set it above everything else: *"6 Steps to Better CFO-CPO Alignment / How procurement and finance can get on the same page about savings, spending and financial results."* **The subject line is not the ask; the lifted item is.** Both DR-1414 witnesses agreed the thread was unbuilt: no `Lesson-Captured` in the thread's own `labelIds`, and `lesson-already-built.mjs --thread 1a1837bf55922f04` returned `NOTHING FOUND`. **Sixteen days** stood between his word and this build, kept in every reader place.

## Decision

Project Management **lesson 17**, `pm17-can-two-walk-together`, all four age bands from the first commit. **Word first:** Amos 3:3 — *can two walk together, except they be agreed* — fixed before one step of anybody's six is spoken. Nine movements: the agreement as precondition (Proverbs 15:22, 11:14, Ecclesiastes 4:9-10); **Bezaleel who made and Ithamar who counted, named in consecutive verses** (Exodus 38:21-24), with the shekel of the sanctuary as the one agreed unit; the only recorded restraint on procurement in Scripture, raised by the **craftsmen** (Exodus 36:5-7); the written **dual control** at the chest (2 Kings 12:9-11, 2 Chronicles 24:11) and its reversal — *they reckoned not* (2 Kings 12:15); Paul's voluntary control and its reason (2 Corinthians 8:20-21); a numbers complaint answered with an **org chart** (Acts 6:1-5); Joseph holding both seats *until he left numbering* (Genesis 41:33-49); the Resources in order (Proverbs 24:3-4, 27:23-24, 13:10); the body that may not say *I have no need of thee* (1 Corinthians 12:21, Philippians 2:4, 1 Corinthians 13:2); and whose silver it is (Haggai 2:8, 1 Chronicles 29:14-16, Luke 16:10, Matthew 25:19).

Every verse is filled from `app/public/bible/kjv` by `scripts/pm17-fill.mjs` and **none typed**; `anchor.ref` is derived from the placeholders that occur in reader places. Household application is bounded: the two names, the two numbers, the two hands.

## What was measured — trust but verify (DR-0190 / DR-0100 / DR-0076 §8)

**The article was never read, and all three roads to it were shut.** `endeavor.omeclk.com` failed to resolve (`getaddrinfo ENOTFOUND`); `www.supplychainconnect.com` and `www.sourcetoday.com` were both refused by the egress proxy's CONNECT tunnel with **403**. The email carries the headline and its one blurb and nothing else. So **not one of the six steps** is taught, named or numbered anywhere in the module, and the only thing quoted from the send is quoted because it is verbatim in the email, which is the primary artifact I do hold. Named in **every** reader place with `re-review: 2026-11-27`.

**SMALLER, and that is the honest direction:** the lesson I could have written from the headline — six steps, a verse for each — cannot be written, because the six steps are not in my hand. **BIGGER, and it is the whole hour (DR-0100 §5):** the headline's premise, that the one who buys and the one who counts must be got onto the same page, is not a modern management finding. It is in the Word with **officers named**, a **dual-control procedure written down**, and the reason given out loud — *providing for honest things, not only in the sight of the Lord, but also in the sight of men*. Checking made the claim larger than the article's framing, not smaller. Not checked at all, so silence is not mistaken for a check: the six steps, the chip-production claims in the forward's own subject line, and every other item in that newsletter.

## Impact

The congregation's Project Management course gains the lesson a church treasurer and a church trustee most need, and a household with one budget and two opinions can use the same page. A reader in any of the four bands meets the whole teaching, the blocked road with its date, and the counterweight that **the buyer is not the reckless one** — it was the craftsmen, the buying side, who caught the over-supply first. `project-management-course.js` enters `file-budgets.json` at its measured 1,607 lines; no other baseline moved.

## Verification

Ladder **1.20 < 3.05 < 5.67 < 6.94** monotone, child **3.80 under** its 5.0 ceiling and teen under 6.0; adult 7.15. Shares **0.528 / 0.638 / 0.628 / 0.819** against floors 0.50 / 0.60. Worst band-pair overlap **0.127** (teen~senior) and worst band-to-adult **0.236** (senior), against 0.25. **49** anchor refs, every one quoted to a reader and nothing more; **206** quoted spans, all 206 in the five reader places (49 / 31 / 36 / 41 / 49), each compared for **exact equality** with its own named verse across the **21 books the module itself names**, 0 faults. `fourBandFaults` and `placesMissingDirections` both empty. **42** tests in the lesson's own gate; `course-four-bands-hold` holds `project-management` at zero.

**THE CLOSE WAS WRITTEN BEFORE ANY SHARE WAS MEASURED**, which is why no band had to be re-tuned after appending it — the failure mode DR-1472 and its sibling both paid for. The three share floors did fail on the first measurement (child 0.378, youth 0.453, teen 0.579) and were brought up **by hand, never by script** (DR-1306).

**MY GATE WAS NARROWER THAN ITS NAME AND ITS OWN FIRST RUN SAID SO — in the opposite direction.** The leak check matched `the six steps are` and so fired on the child band's **refusal**, *"we do not say what the six steps are"* — the very sentence the file exists to require. A gate that reports the refusal as the leak trains a reader to delete the honest sentence. It now matches an **enumeration** only, with both halves proven-to-catch, and the refusal is asserted positively and separately. The book list is **derived** from the module's own references and the `Psalm`/`Psalms` split is resolved and proved against the corpus, not asserted. The sweep walks **all 87 strings**, not the reader places only.

**Still narrower than its name, stated rather than smoothed:** this file proves every quotation *is* the verse it names; it cannot prove the verse was the right one for the point, and it reads only this module, so a collision with a sibling lesson is invisible here — `course-four-bands-hold` and `course-band-coverage` were run by name for that. `re-review: 2026-11-27`.

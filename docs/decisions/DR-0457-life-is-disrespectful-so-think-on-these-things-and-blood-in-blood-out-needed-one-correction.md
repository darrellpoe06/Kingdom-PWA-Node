# DR-0457 — Life is disrespectful, so think on these things; and blood in, blood out needed one correction

- **Status:** accepted
- **Tier:** B (a new lesson in the learner-facing series; content is teaching, and it corrects a borrowed phrase rather than repeating it)
- **Date:** 2026-09-17
- **Type:** app
- **Scope:** `app/src/lib/living-lessons-class.js` (L166 added; 165 lessons, painted count moved with it), `app/src/__tests__/living-lessons-l166-verses.test.js` (new, 30 checks, 36/36 breaks caught), the three shrink-only baselines re-measured (count only)
- **Principles:** SPOKEN-TEACHINGS-ARE-BUILD-INPUT (2026-07-03), VERIFICATION-DOCTRINE (DR-0076), TEACH-NOT-DEBATE (DR-0098), COVENANT-NAME (DR-0210), RENDER-FOR-MEANING (DR-0331), FULL-LEVELS (DR-0418), NOTHING-WAITS (DR-0236)
- **Grounds:** L6 (Think on These Things) — this lesson is its complement, not its repeat; DR-0417 (a new lesson's child band is held to 5.0); DR-0456 (the immediately preceding lesson, whose apostrophe finding changed the tool used here)

## Why this exists

Darrell, 2026-09-17, spoken into this channel (rendered for meaning per DR-0331):

> "The reason you have to think on the whatever is good, kind, just... is because life is so disrespectful that if you don't focus on that, you will become the evil version of yourself... self is like selfishness or fleshiness... everybody's a servant and a king at the same time... he purchased us twice... blood in blood out... Humble yourself under the mighty hand of the Lord."

## The decision

**a. The REASON is the lesson, and that is what keeps this from being a second L6.** L6 already teaches the Philippians 4:8 filter. What is new here is the reason Darrell gave it, which most teaching leaves out entirely: the filter is not a mood-improver, it is protection, because life is structurally disrespectful and an unfiltered mind becomes the evil version of itself. That is not asserted over the text, it is walked through it — *"For as he thinketh in his heart, so is he:"* (Proverbs 23:7), *"The heart is deceitful above all things, and desperately wicked: who can know it?"* (Jeremiah 17:9), and then Matthew 12:34-35, where whatever accumulated leaves by the mouth. Disrespect in, nothing filtering it, it becomes what you think, what you think becomes what you are, and it comes out on somebody who had no part in causing it. **Not a monster — just you, unfiltered, after enough weather.** Three of the gate's checks hold the reason per band for exactly this reason: a band that kept the eight questions and dropped the reason would be L6 in a new title.

**b. Self is defined as he defined it, and denied rather than improved.** Selfishness; fleshiness. That is the Word's own category, at war inside the same person (Galatians 5:16-17 — *contrary the one to the other*), with two minds and two destinations (Romans 8:6). So the instruction is denial, daily, because it returns daily (Luke 9:23; Galatians 2:20; Romans 6:6; Ephesians 4:22-23).

**c. Servant AND king, both held, or neither is true.** Drop the king and the lesson teaches self-erasure; drop the servant and it teaches a tyrant. Both come from the text on the same authority — kings and a royal priesthood (Revelation 1:6; Revelation 5:10; 1 Peter 2:9) beside greatness defined downward (Mark 10:43-44), with the King setting the pattern and exempting Himself from none of it (Matthew 20:28; Philippians 2:5,7; John 13:14). Both named failures are checked per band: **a king who will not serve is a tyrant; a servant who forgets he is a king gets used.**

**d. Purchased twice, with both purchases carried by the Word.** The making (Psalms 100:3 — *it is he that hath made us, and not we ourselves*) and the buying back of what was already His (Isaiah 43:1; 1 Corinthians 6:19-20), with the currency named so nobody mistakes it for money (1 Peter 1:18-19; Acts 20:28). Two titles to the same life, and the conclusion is not optional: *"Ye are bought with a price; be not ye the servants of men."* (1 Corinthians 7:23)

**e. BLOOD IN, BLOOD OUT IS CORRECTED, NOT REPEATED — and this is the decision that took the most care.** Darrell used a phrase the street uses, and he used it about covenant, which is where it genuinely belongs: a covenant is entered by blood and is not a thing a man drifts out of. The Word grants the first half without qualification (Leviticus 17:11; Hebrews 9:22; Ephesians 1:7). But the phrase as the street means it is an oath that holds men **by fear**, because in that version the blood going in is yours and the blood going out is yours too. In the covenant the blood that brought you in was **His**, and there is no blood on the way out because there is no way out on offer and none required (John 10:28-29; Hebrews 13:5; Romans 8:39). Every band carries that correction, every band names the phrase as a street phrase rather than as Scripture, and the gate breaks on both — because repeating a borrowed phrase uncorrected would have taught fear in the name of covenant.

**f. The mighty hand is read as two words.** Not weak, which would be humiliating; not cruel, which would be unsafe. The strongest hand in existence, and the same hand that took a nail to buy you the second time — with the lifting left as His work on His clock, *in due time* (1 Peter 5:5-6; James 4:6).

**g. All four bands carry the whole message.** Measured (adult prose 1,184 words, quotations stripped): child 741 (ratio 0.626, floor 0.50), youth 993 (0.839), teen 1,099 (0.928), senior 1,417 (1.197). Reading ladder 1.05 / 4.29 / 7.38 / 9.49 — monotone, child well under the 5.0 ceiling a new lesson is held to.

## Verification (DR-0076)

- **54 verses verified BEFORE authoring, in one batch, under a STRICT comparison** (whitespace only). The tool was tightened for this lesson precisely because of DR-0456's finding, and **it paid for itself on the first use**: it immediately caught *"which are God's"* (1 Corinthians 6:20) written with an ASCII apostrophe where the corpus carries the typographic one — the exact class that slipped past the lenient version a lesson earlier. It also caught a lower-cased *what* opening 1 Corinthians 6:19.
- **A SECOND TOOL BUG, found by the same run.** The span auditor reported "no such book" for every Isaiah quotation. Cause: it normalised book names with `/^(i|1st)/ -> '1'`, which silently turned `isaiah` into `1saiah`. It had gone unnoticed because the lesson it was written for quoted no Isaiah. Fixed by deleting the rewrite (the corpus filenames already carry their digits), and the L166 gate carries the same fix with the reason written in.
- **224 quoted spans across the five texts: 224 verbatim strictly, 0 not verbatim, 0 unreferenced.** The module itself carries over 220, re-audited field by field against the PARSED module inside the gate.
- **One alteration I authored myself, caught before it shipped:** a duplicated fragment inside a quotation of Luke 9:23 (*"let him coming after me, let him deny himself"*), introduced while drafting the teen band.
- **30 checks; 36 breaks applied for real, 36 caught, 0 missed, 0 no-ops.** Every break global inside the L166 block, each asserting the edit landed first.
- **Two real defects in the lesson were found by my own gate on its first run, not by reading it.** (1) **Yahweh was named only once** in the adult prose and once per band — the prose was leaning on *He* and on the KJV's own *God* inside the quotations, which satisfies the letter of DR-0210 and misses its point. Him named in seventeen further places, in each register's own words; now 4-5 per band. (2) The check for reading *mighty hand* as two words failed a band **that plainly does it** — the child band writes `(1 Peter 5:6) Mighty hand. Strong.` with no full stop between the reference and the comment, so the sentence splitter glued our words onto the quotation. The check now strips the quotations and asks the real question: does OUR prose say it? That is the third variant of this session's recurring finding, in the opposite direction — a scope that is too tight reports a defect that is not there, just as a scope that is too loose hides one that is.
- The three shrink-only baselines each changed by exactly **one line** (the lesson count); no debt entry added. The painted META count moved 164 → 165, which is compared against the real module length.

## An adjacent finding, recorded rather than folded in

While confirming the deploy for the previous lesson (DR-0107), **no deploy fired for main's tip at all.** PR #1648 merged at 18:21:12; the auto-merge heal-deploy sweep had armed at 18:07:26, so its 12-minute poll window expired about 1m45s before the merge landed. The outer net, `deploy-freshness.yml`, *requests* `*/5 * * * *` but actually ran three times today — 05:29, 10:19, 15:05 — roughly every five hours, because GitHub throttles scheduled workflows. Worst case is a stale site for five hours after a merge. I dispatched the deploy by hand (run #1155, success on `7d318655`), so the site is current. **This is the seventh miss of this class by the workflow's own comment history, and every previous fix raised the timer.** It is tracked as its own work with its own decision record, because a change to the merge/deploy lane must be proven by watching a real merge produce a real deploy and must not ride a lesson's PR.

## Files

- `app/src/lib/living-lessons-class.js` — L166 (165 lessons)
- `app/src/__tests__/living-lessons-l166-verses.test.js` — new, 30 checks
- `app/src/lib/full-levels-baseline.json`, `reading-level-baseline.json`, `title-in-narrative-baseline.json` — re-measured, count only
- `docs/decisions/INDEX.md` — row + pointer

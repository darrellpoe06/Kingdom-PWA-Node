# DR-0480 — L82's love-fulfils-the-law drained, and an arc whose order was never checked

- **Status:** accepted
- **Tier:** B (a learner-facing lesson at every age band)
- **Date:** 2026-09-18
- **Type:** content
- **Scope:** `app/src/lib/living-lessons-class.js` (L82's four bands rewritten, youth created, three elisions gone with the teen band, four generic uses of the name corrected in the child band, a series quotation merged), `app/src/__tests__/living-lessons-l82-verses.test.js` (5 → 35 checks, one pooled reference check replaced), all four shrink-only baselines (three shrank)
- **Principles:** EVERY-BAND-IS-THE-WHOLE-MESSAGE (DR-0418), VERIFICATION-DOCTRINE (DR-0076 §3, §4), WORD-FIRST (DR-0097), COVENANT-NAME-IN-OUR-VOICE (DR-0210), PERPETUAL-IMPROVEMENT (DR-0075)
- **Grounds:** DR-0473 (the quotation ratchet), DR-0476, DR-0478, DR-0479 (the four check-writing rules, all four applied here from the start)

## Why this exists

| band | before | floor | after |
|---|---|---|---|
| child | 178 words, **0.35** | 0.50 | 720 words, **1.40** |
| youth | **absent entirely** | 0.60 | 659 words, **1.28** |
| teen | 233 words, **0.45** | 0.60 | 664 words, **1.29** |
| senior | 301 words, **0.59** | 0.60 | 569 words, **1.11** |

Senior read at **FK 11.15** against an adult lesson at 5.31. Ladder now **2.57 / 4.85 / 6.13 / 7.85**.

## The decision

### a. AN ARC WHOSE ORDER WAS NEVER CHECKED — AND THE ORDER IS THE TEACHING

L82's gate had a check titled *"the Isaiah wardrobe arc is intact — armor, dawn, garments, in consecutive chapters."* What it actually did was search the whole serialised module for three **reference strings** — `Isaiah 59:17`, `Isaiah 60:1`, `Isaiah 61:10`. Two defects in one check: the scope was the entire module, so any single field answered for all three; and it never looked at the **order**, despite the title claiming "in consecutive chapters."

The order is the entire point of this movement. Isaiah's wardrobe runs an arc: **Yahweh wears the armour first** (59:17), **He is the light that rises** (60:1), **He does the clothing** (61:10). Read in that sequence it is the gospel; read in any other it is self-improvement with a verse attached. The replacement check reads each band's raw text and asserts the three positions are strictly increasing, so the sequence itself is the assertion rather than the presence of three citations.

### b. THREE ELISIONS, AND WHAT EACH ONE COST

All three sat in the teen band and went with the rewrite, but each is worth naming because the cut fell on the load-bearing clause every time:

| verse | what was cut | why it mattered |
|---|---|---|
| Romans 13:11-12 | "for now is our salvation nearer than when we believed" | **the entire basis of the arithmetic.** Without it the wake-up call is just urgency; with it, it is a measurement |
| Romans 13:12 | the join between cast-off and put-on | the two halves are one instruction |
| Matthew 23:23 | "of the law" | what makes them weightier *than the tithing being rebuked*, rather than merely important in general |

### c. FOUR GENERIC USES IN THE CHILD BAND

The old child band said *"God's rules"*, *"love God with all your heart"*, *"God says to do that with your heart too"*, and closed on *"the one thing God says we always owe"* — four uses of the generic name in our own authored voice, in the band whose reader is least able to work out which god was meant (DR-0210). Zero now, with Yahweh named three times in its own prose. The bright line is checked in the other direction too: the great commandment must carry the KJV's own name letter-for-letter, whether the band reaches it through Matthew 22:37 or Deuteronomy 6:5.

## The finding

**THE FOUR RULES HELD: 33 BREAKS, 33 CAUGHT, NOTHING MISSED.** This is the second clean sweep, and unlike the first it came after the rules were written down rather than before. All four were applied while writing, not discovered by the harness:

1. Every claim check reads OUR prose with the quotations stripped (DR-0474).
2. No alternation branch is merely a word the passage contains (DR-0476).
3. No branch is a phrase our prose echoes out of the quotation beside it (DR-0478).
4. No branch is a title keyword, because the title is in every band by construction (DR-0479).

Plus the structural one: **no test carries two claims**, since a break that trips the second reports as a failure of the first (DR-0478). The tell — a test name containing "and" — was applied while writing, which is why this gate has 35 narrow checks rather than 20 wide ones.

DR-0479 said plainly that recording a finding is not the same as installing it. This is the counter-example: the rules were applied at authoring time and the harness found nothing. That is what installation looks like.

**The three first-run failures were all my pins, not content gaps** — and one of them is worth keeping as a caution. The great-commandment pin was written Matthew-only, but the child band reaches that commandment through Matthew 22:37 while youth, teen and senior reach it through Deuteronomy 6:5. Both are correct, both carry the generic name verbatim, and a pin that assumed one route would have forced a band to quote the wrong verse to satisfy a check. **A check must not narrow the Word's own options.** The others: a capital T where Matthew starts the clause mid-sentence, and "already **been** purchased" where I had written "already purchased."

## Evidence

- Fullness: `shortBands` returns `[]`; shares 1.40 / 1.28 / 1.29 / 1.11.
- Reading: ladder 2.57 / 4.85 / 6.13 / 7.85, monotone; child under the 7.0 ceiling; senior down from 11.15.
- Quotations: **66 quoted spans across the four bands, every one verbatim under strict comparison, 0 unreferenced, 0 ellipses**; the ratchet reports L82 clean on both classes.
- The covenant name: Yahweh in every band's own prose (3 / 3 / 3 / 3), 0 generic uses in our own voice in any reader field.
- Sections: all four bands render `[1,2,3,4,5]`, no chunk over the 420-character wall limit.
- Break harness: **33 / 33 caught, 0 missed, 0 no-ops.**
- Baselines: short **82 → 81**, title-unnamed **148 → 147** (bands 446 → 443), quotation **107 → 106** lessons, 0 fresh and 1 healed. None gained an entry.
- Gate: 35 checks, up from 5.

## Consequences

- The full-levels pass has **81** lessons left carrying a short band. Next is L81, downward.
- The DR-0473 elision debt is at 106 lessons; the Philippians 4:8 sub-pass stands at its own **re-review: 2026-09-25** (DR-0479, 17 spans across 6 lessons).
- L82's anchor list already names Romans 13:8-14, which is the passage, so the anchor deferral that L83–L89 carry does not apply here.

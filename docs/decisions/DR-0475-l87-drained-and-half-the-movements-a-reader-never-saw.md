# DR-0475 — L87 drained, and half the movements a reader never saw

- **Status:** accepted
- **Tier:** B (a learner-facing lesson at every age band, and a reader-facing structure defect measured across the series)
- **Date:** 2026-09-18
- **Type:** content
- **Scope:** `app/src/lib/living-lessons-class.js` (L87's four bands rewritten, youth created, nine elisions replaced, section markers repaired in all five texts), `app/src/__tests__/living-lessons-l87-verses.test.js` (54 → 61 checks), all four shrink-only baselines (three shrank)
- **Principles:** EVERY-BAND-IS-THE-WHOLE-MESSAGE (DR-0418), VERIFICATION-DOCTRINE (DR-0076 §3, §4), REALITY-TRACE (DR-0061 — observe the running thing, do not infer), TEACH-DONT-DEBATE (DR-0098), PERPETUAL-IMPROVEMENT (DR-0075)
- **Grounds:** DR-0473 (the quotation ratchet this drains further), DR-0474 (L88, whose formatter finding pointed here), DR-0459 (no elision inside a quotation), DR-0385 (the numbered-points work this structure comes from)

## Why this exists

L87 is Part 1 of the pair L88 completes, and the third lesson in a row in the full-levels pass found with a missing youth band.

| band | before | floor | after |
|---|---|---|---|
| child | 133 words, **0.17** | 0.50 | 443 words, **0.58** |
| youth | **absent entirely** | 0.60 | 470 words, **0.61** |
| teen | 227 words, **0.30** | 0.60 | 593 words, **0.77** |
| senior | 405 words, **0.53** | 0.60 | 610 words, **0.79** |

**And the two upper bands were unreadable at their register: teen FK 13.14, senior 13.94** — college level, in a band aimed at teenagers. Now **2.49 / 4.24 / 6.61 / 8.34**, monotone, child well under the 7.0 ceiling, youth below the adult lesson's 5.31.

## The decision

### a. NINE ELISIONS, AND EVERY FIX GAVE THE READER MORE OF HIS WORDS

L87 carried the most elided quotations of any lesson drained so far — four in the adult lesson and five in `bigIdea`, each with a contiguous verbatim span available. What the fixes added:

| verse | what the elision cut | what the reader now gets |
|---|---|---|
| 2 Corinthians 4:4 | `Christ... should shine` | *"who is the image of God"* |
| Hebrews 4:12 | `soul and spirit... a discerner` | *"and of the joints and marrow, and is"* |
| James 1:25 | `continueth therein... a doer` | *"he being not a forgetful hearer, but"* |
| John 1:14 | `among us... full of grace` | the whole glory clause — *"and we beheld his glory, the glory as of the only begotten of the Father"* |
| Isaiah 46:10 | `the end from the beginning... My counsel` | *"and from ancient times the things that are not yet done, saying"* |

That John 1:14 line is the point of the whole exercise. The elision saved eighteen words and cost the reader the beholding of His glory. **The remedy for a long quotation is never an elision — it is to quote it, and this lesson gained rather than lost by nine.**

### b. THE SIX MOVEMENTS, HELD PER BAND

Each band carries all six, and the gate holds the things a shorter version would quietly drop: that **sincerity is not safety**; all **three blinders** (hostile, moral, constitutional) because they need three different mercies and the moral one is the uncomfortable one; that sight is **given** and **follows seeking** rather than being earned by effort at seeing; the engine as **four strokes with a stated output**; and — importantly — **the fairness about science**.

That last one is a real DR-0098 obligation. The lesson draws a genuine distinction (honest forecasting versus *"I AM THAT I AM"*) and explicitly refuses to sneer: *"models revised each decade, and revised honestly. That is a good thing and this lesson does not sneer at it."* A band that kept the contrast and dropped the fairness would be doing exactly what teach-don't-debate forbids, so the check requires the fairness wherever a band raises science at all.

## The finding: HALF THE MOVEMENTS A READER NEVER SAW

Found by running the real formatter over the finished bands instead of trusting the prose — the same reality-trace step that caught L88, now run as a habit.

`formatLessonText` numbers a section only when **two** conditions hold: the marker is in a form it knows (ordinal words, `I.`/`II.`, `SOIL n`), **and the preceding text ends in a sentence period.** A marker following a closing reference — `"...but by me" (John 14:6) SECOND, WHY WE CANNOT SEE` — is invisible to it.

Measured on this lesson before the fix:

- **child rendered `[1, 4, 6]`** — FIRST, FOURTH and SIXTH followed a period; SECOND, THIRD and FIFTH each followed a closing reference.
- **youth, teen and senior rendered ONE section each** — I had written `ONE:` … `SIX:`, and the word-number form is not a marker the formatter knows at all.
- **and the ADULT LESSON rendered `[1, 2, 3]`** — it had been shipping for months losing half its own six movements on screen. That one is not mine and was not introduced by this change.

All five now render `[1, 2, 3, 4, 5, 6]`, and a check holds every one of them.

**One error of my own in the repair, recorded.** My conversion regex was too broad and turned the senior band's `MOVEMENT ONE:` into `MOVEMENT FIRST,` — mangled prose, shipped into the file for the length of one test run. Caught by re-reading the output rather than by any gate, and repaired to `FIRST MOVEMENT —`, which puts the ordinal where the formatter can see it and reads correctly besides.

### And the series was measured, because three occurrences is a pattern

| | count |
|---|---|
| reader-facing texts measured | **1,118** |
| texts whose author wrote ordinal or `SOIL n` markers | **179** |
| texts rendering FEWER sections than markers written | **18** |
| **section breaks a reader never sees** | **25** |
| texts carrying a chunk over the house's 420-character wall limit | **14** |

The worst are recent: **L165 writes 9 markers and renders 5; L169 writes 10 and renders 8; L166 writes 7 and renders 5; L146 writes 6 and renders 3.** That is mostly this session's own side of the work and the sessions just before it, which is worth saying plainly rather than filing as inherited debt.

**Not ratcheted tonight, deliberately.** 25 breaks across 18 texts is a tenth the size of the DR-0473 elision debt and each fix is one short sentence of our own prose placed by judgement. Two lessons and a new ratchet are already in flight in this same session; adding a third piece of machinery before Darrell has seen the first is the kind of accumulation that becomes unreviewable. So it is **named with its numbers and a date** rather than smuggled or silently dropped: **`re-review: 2026-10-18`**. Five of the eighteen sit in lessons the full-levels pass will reach on its own, and the per-lesson gates now check the property wherever the pass lands, so the count should fall without machinery. If it has not moved by then, it gets a ratchet like the elisions did.

## The evidence

- **91 quoted spans across the four bands, every one verbatim** against the local KJV corpus under STRICT comparison, **0 unreferenced, 0 ellipses**; L87 scans clean for both DR-0473 classes.
- **Fullness** 0.58 / 0.61 / 0.77 / 0.79; `shortBands` is `[]`.
- **Ladder 2.49 / 4.24 / 6.61 / 8.34, monotone** — teen down from 13.14, senior from 13.94.
- **All five texts render six numbered sections**, longest chunk 318 against the 420 limit.
- **Covenant name:** Yahweh 3 times in each band's own prose, **zero generic-name uses in our own voice**.
- **Three of the four shrink-only baselines shrank; none gained:** fullness short 87 → 86; title-unnamed 153 → 152 (bands 460 → 457); quotation elided 112 → 111 lessons and **741 → 732 spans**. The reading baseline was already clean for L87.
- **The ratchet reported 0 fresh and 2 healed**, naming both fields — the second consecutive lesson to drain it.
- **The gate:** 61 checks, green. Two failed first and both were my checks being narrower than the senior register's own words (*"information deficit"*, *"never comes by effort at seeing"*), widened to the text rather than the text bent to the check.

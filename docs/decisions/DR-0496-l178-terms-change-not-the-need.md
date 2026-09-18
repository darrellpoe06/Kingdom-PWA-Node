# DR-0496 — L178: terms change, not the need

- **Status:** accepted
- **Tier:** B (lesson content plus a new gate)
- **Date:** 2026-09-18
- **Type:** content
- **Scope:** `app/src/lib/living-lessons-class.js` (L178 added; `LIVING_LESSONS_META.weeks` 176 -> 177), `app/src/__tests__/living-lessons-l178-verses.test.js` (new, 121 checks), `app/src/__tests__/learn-crosslist.test.js` (catalog pin 536 -> 537), the three shrink-only baseline counters
- **Principles:** SPOKEN-TEACHINGS-ARE-BUILD-INPUT (2026-07-03), EVERY-BAND-IS-THE-WHOLE-MESSAGE (DR-0418), VERIFICATION-DOCTRINE (DR-0076 §1 §3 §4), TEACH-THE-WORD-DO-NOT-DEBATE-IT (DR-0098), PERPETUAL-IMPROVEMENT (DR-0075)
- **Grounds:** DR-0495 (the lesson before it), DR-0484 (band differentiation), DR-0459 (no ellipsis inside a quotation)

## What he asked for

Darrell put it in one line and marked it a lesson: **terms change, not the need.** A problem given a new name has not been repaired by the naming, and the need stands until it is actually fixed. He was insistent that the blade point at **us** and not only at the institutions outside — a measure of our own that has quietly stopped measuring is this lesson's own failure mode.

Forty-nine passages were fetched verbatim from the repo's own KJV; zero missing.

## What the Word gave it

The material is harder than the brief. Scripture does not treat this as a communications problem:

- **James 2:15-16** is the centre, and the hard case rather than the easy one: *"Depart in peace, be ye warmed and filled"* is true, kind, and correctly aimed at the real lack. There is no lie in it anywhere, and the man is still cold when it ends — which is why the text asks what it **profits**.
- **Jeremiah 6:14** gives Yahweh's own phrase: *"They have healed also the hurt of the daughter of my people slightly, saying, Peace, peace; when there is no peace."* Healed it SLIGHTLY concedes that something was genuinely done, which is what makes it land. He repeats it at 8:11.
- **Ezekiel 13:10-11** makes it a materials failure: a wall *"daubed with untempered morter"* that fails *"in an overflowing shower"* — not on a calm day, but in the only weather the wall existed for.
- **Haggai 1:6** names what it costs the people carrying it: *"he that earneth wages earneth wages to put it into a bag with holes."*
- **Nehemiah 6:15** supplies the shape to aim at, and the detail nobody quotes: *"So the wall was finished in the twenty and fifth day of the month Elul, in fifty and two days."* A repair carries a date and a duration. A renaming never does, which is a test anybody can apply from outside.
- **Proverbs 27:23** is the prescription — *"Be thou diligent to know the state of thy flocks"* — with **Proverbs 21:2** and **14:12** marking the reason: *"There is a way which SEEMETH right unto a man."* A renamed problem always clears the internal review, most easily for whoever renamed it.

## Measured before it was gated

| band | prose words | share of adult | Flesch-Kincaid | rendered movements |
|---|---|---|---|---|
| child | 1,565 | 0.83 | 2.53 | 22 |
| youth | 1,816 | 0.97 | 5.23 | 22 |
| teen | 1,795 | 0.95 | 7.03 | 22 |
| senior | 2,673 | 1.42 | 7.72 | 23 |
| adult | 1,880 | — | — | 22 |

Ladder holds (2.53 / 7.03 / 7.72); child under the 5.0 ceiling a NEW lesson is held to; band differentiation worst pair **0.07**.

**Two quality defects caught by measurement rather than by reading it back:**

1. **The youth band measured 0.27 against the adult** — under the 0.50 ceiling, but written by re-registering its neighbour, which is the habit this corpus has already paid for three times. Fifteen sentences were re-conceived rather than adjusted, and it came to **0.16**, the corpus median.
2. **The senior band measured BELOW the teen band** (6.91 against 7.03). The ladder is the claim and the grade is only its proxy, so the senior band was re-registered at thirteen points rather than the ladder relaxed. It now reads 7.72.

## Five quotations that were not His words

The gate's whole-module walk found **five** in the first draft, and the correct text of every one of them was sitting in the fetched verse file the entire time:

| reference | what was written | what the KJV says |
|---|---|---|
| Matthew 23:28 | "Even so ye outwardly appear" | "Even so ye **also** outwardly appear" |
| Nehemiah 4:6 | "the people had a **heart** to work" | "the people had a **mind** to work" |
| Zechariah 7:9 | "shew mercy and **compassion**" | "shew mercy and **compassions**" |
| Revelation 3:18 | "be clothed, that the shame" | "be clothed, **and** that the shame" |
| Jeremiah 8:10 | Jeremiah **6:13**'s text under an 8:10 label | a different verse entirely |

Four of the five had spread to all five bands, a benefit and a quiz explanation. The fifth is the worst kind: real words, real reference, wrong pairing. **This is the lesson's own subject, committed while writing it** — the right text was available, and it was typed from memory anyway. It is recorded here rather than quietly fixed, because a repair nobody wrote down is the thing this lesson is against.

The Nehemiah drift also had prose built on it ("a heart to work" was echoed in two bands), which is how a single misquotation propagates into teaching.

## A new instance of the invisible-movement class

The heading **`LORD, LORD.`** renders as body text. It is two capital words, it ends in a period, and it heads real prose — but `lesson-format.js` tests for two capitals separated by whitespace (`/[A-Z]{2,}\s+[A-Z]/`) and the comma after the first word breaks that test. A heading that looks perfect is silently demoted. It was renamed, and the behaviour is now a live proven-to-catch check, because nothing else in the house knew about it.

## The gate, proven to catch

121 checks, including a rule this lesson's own subject demands: **a claim that genuinely belongs to some bands and not others is SCOPED with its reason recorded, never quietly dropped** — and a check asserts every scope names real bands. One claim is scoped adult-and-up (an allowance beside a logged defect is a governance idea; the child band teaches the same point concretely without the abstraction).

Eight deliberate breaks, eight caught:

| break | caught |
|---|---|
| the Nehemiah 4:6 word put back wrong | yes |
| the dropped "also" in Matthew 23:28 | yes |
| the singular in Zechariah 7:9 | yes |
| Revelation 3:18 corrupted | yes |
| "Yahweh" swept into a KJV quotation | yes |
| a heading the renderer silently drops | yes |
| a band softening its named defect into a description | yes |
| a band that genuinely drops the self-application | yes |

Two of those needed a second, precise attempt. The first attempts replaced the text in a **benefit** rather than in a band, and removed **one** of two places the child band teaches the self-application — so the gate passed correctly both times, because the claim was still true. Worth recording: a break that does not actually create the defect proves nothing about the gate, and reading a green result as a gate hole would have been its own renaming.

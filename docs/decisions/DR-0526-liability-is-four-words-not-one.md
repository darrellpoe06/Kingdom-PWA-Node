# DR-0526 — `liability` is four words, not one: correcting DR-0523's reason and retiring its date

- **Status:** accepted
- **Date:** 2026-09-19
- **Type:** defect
- **Amends:** DR-0523 (Real Estate course nine), which recorded the wrong reason for leaving `liability` off the plain-meaning gate and attached a re-review date to work that does not exist
- **Relates to:** DR-0521 (the plain meaning comes first), DR-0076 (measure, do not claim), DR-0075 (a non-improvement needs a stated why)

## What DR-0523 recorded, and why it was wrong

While building course nine, three candidate terms were measured against the corpus and left off `HARD_TERMS` in `plain-before-the-term.js`. For `liability`, the recorded reason was:

> **`liability`** — 26 genuine uses across 13 lessons after the matcher fix, no matcher problem, and a word a young reader genuinely does not own. It is owed a pass that AUTHORS the gloss at each site; it must never be added by hollowing its cues. **re-review: 2026-10-03.**

That promised a 26-site authoring pass. **The pass is not owed, and the stated reason was wrong.** The sites were surveyed properly — every one printed with the sentence around it — and the measurement says something different and more useful.

## What the measurement actually shows

`liability` is not one word in this corpus. It carries **at least four distinct senses**, and a single cue list cannot serve them:

| sense | sites | what a money-sense gloss would be |
| --- | --- | --- |
| **a burden or drawback** | `ll123` ×5 — *"the Word never presents a wife as a liability to be structured around"* | **actively wrong** — and this is the only place the word reaches a youth or teen band at all |
| **answerability** | `pm7` ×2, `spm6`, `dev5` — *"makes the watchman's silence a liability"*, *"carries personal liability"*, *"the liability is named in advance"* | wrong |
| **money owed** | `part3` — *"Shared liability."*; `part7` — *"No liability, no joint signature"*; `tax2` ×3 — *"He reasons the liability out"* | right — but see below |
| **a legal term of art** | `mgmt5` ×2 *premises liability*; `sov19` ×2 *product-liability law*; `wi-medical` ×3 *liability shield*; `wi-musk` *a court finding of liability*; `sov7` ×2 *a compliance liability* | wrong |

Adding the term with money-sense cues would demand a wrong gloss at three of the four senses. That is **a check firing on correct content**, which is the one failure `plain-before-the-term.js` exists to prevent and the reason `tribute` and `pledge` were taken off that list on the day it was written. So `liability` stays off — **permanently, not on a date.**

## And no gloss pass is owed at the money-sense sites either

This is the part DR-0523 got wrong in the other direction. Reading the three money-sense sites in full:

- **`part3`** — *"A yoke is structural. Shared liability. Commingled assets. Joint signatures."* The staccato list is immediately unpacked in the same paragraph: *"In a yoke, the other party's decision becomes your obligation"*, and later *"the yoke is what converts another man's judgment into your liability."*
- **`part7`** — *"There is no equity in that sentence. No governance, no board seat, no vote. No liability, no joint signature, no claim of any kind"* — followed directly by *"He does not become your obligation. You do not need his cooperation to leave."*
- **`tax2`** — *"He reasons the liability out rather than simply announcing a decision"*, and the same paragraph asks the question that defines it: *"do I owe this?"*, with *"The liability genuinely does not attach"* alongside.

**And crucially: no child, youth or teen band anywhere in the corpus meets the money sense.** The only young-reader bands containing the word are `ll123`'s youth and teen, both using the burden sense, which needs no gloss at all. Every money-sense site sits in a `lesson`, a `bigIdea` or a `senior` band — an adult register, in prose that defines the term within a sentence or two.

Darrell's original report was about meeting a word **cold** and having to stop: *"What is an assay?"* and then *"Typo?"* — where the explanation came two sentences after he had already given up. That is not the shape of any of these sites. Forcing glosses into them would flatten deliberately staccato prose to satisfy a rule the prose already keeps.

## The decision

1. **`liability` is permanently off `HARD_TERMS`**, for the four-senses reason above rather than DR-0523's stated one. The comment in `plain-before-the-term.js` is corrected to say so, and its re-review date is removed because there is no deferred work behind it.
2. **No gloss pass is authored.** Stated why, per DR-0075: the money sense appears only in adult-register fields, is unpacked in-sentence or in the next, and never reaches a young reader.
3. **`peril` and `underwriting` stand exactly as DR-0523 recorded them**, dates included. Their blocker is the matcher, not the word list: `peril` fires at the word start of `perilously` (ordinary English, `ll66`) and 2 of `underwriting`'s 7 hits are a document **title**, the FHA's 1938 Underwriting Manual (`econ5`). A title is not a term use. **re-review: 2026-10-03** for the inflection-and-titles matcher work that gates both.

## The lesson worth keeping

DR-0523 named the right conclusion (leave it off) with the wrong reason (a gloss pass is owed) — and a wrong reason with a date on it sends a future session to do work that should not be done. The survey that fixed it cost one read-only probe. **A recorded reason is a claim, and a claim carries the same evidence burden as any other (DR-0076 §1).**

# DR-0554 — How Investing Actually Works: the department closes

- **Status:** accepted
- **Date:** 2026-09-20
- **Type:** course
- **Relates to:** DR-0548 (the department opens, stocks), DR-0549 (bonds), DR-0553 (world market, and the `re-review: 2026-10-04` this discharges), DR-0098 (teach the Word, do not debate it), DR-0100 (state established fact plainly), DR-0459 (no ellipsis inside a quotation), DR-0076 (verification doctrine), DR-0509 (teen and senior from the first commit), DR-0521 (the plain meaning comes first)

## The sentence is finished

Darrell named the whole department in one breath on 2026-09-19: *"Stock Market courses to explore and explain the world of stock and bonds and countries that trade and how investment works world wide."* Course one answered **stock**, course two **bonds**, course three **countries that trade**. This is the fourth quarter, and with it the department carries four courses and thirty-two lessons.

| # | Lesson | Anchor |
|---|---|---|
| 1 | What investing actually is — choosing not to use it now | Proverbs 13:11 |
| 2 | Risk is four different things wearing one word | Genesis 41:35 |
| 3 | Time — the only ingredient nobody can buy | Proverbs 21:5 |
| 4 | Spreading it out — and the thing it cannot do | Ecclesiastes 11:2 |
| 5 | Cost — the only number known in advance | Proverbs 27:23 |
| 6 | What cannot be known, and who sells certainty | James 4:13 |
| 7 | The steward's question | Luke 16:11 |
| 8 | Enough | Proverbs 30:8 |

## Why this one is built differently from its three siblings

The first three courses teach **machinery**: what a share is, what a bond is, what a deficit is. A reader handed those is strictly better off and the worst outcome is that they learn nothing. **This one is about a DECISION**, and a decision is precisely where teaching turns into telling somebody what to do with their money without anybody noticing the step.

So the course is constructed to refuse that, structurally rather than by good intentions. Every lesson ends by handing the reader a **question for their own situation** rather than an answer this house supplies. No product, fund, company, platform, allocation or strategy is named anywhere in it. No figure is quoted and no forecast is made. The stated aim, carried on the care note and the tutor blurb and pinned by a test, is that **a person who finishes it should be harder to sell to, including by us.**

Most of the tests in the course's own file are therefore **refusals**. What it must not do is more load-bearing than what it must say, because everything it must say is safe and every way it could fail is a way of quietly becoming a sales document.

## The six lines, each held by a test rather than a memory

1. **The four risks stay separate.** The money not coming back; the money being there and unreachable; the money buying less; and being forced to sell at the worst moment. The fourth is attributed to the **household**, not the market — it is the one almost nobody lists and the one through which nearly every avoidable harm actually arrives — and the lesson names the real defence against it, which is *dull reachable money*, not a cleverer investment.
2. **The compounding curve is arithmetic, never a forecast.** The assumption is written on its face every time. And the lesson states the bright line in its own voice: an illustration of what a rate does over a period is arithmetic; the identical illustration with the name of something purchasable beside it is a **sales document**, and the distance between them is one line of type.
3. **Spreading gets its benefit and its limit in the same breath**, as Ecclesiastes 11:2 does. The ground the verse gives is *for thou knowest not what evil shall be upon the earth* — an admission of ignorance, not a promise of safety — and the lesson says plainly that a reader who leaves **feeling safe has been sold something**. It also names the concentration households actually carry: wage, pension and sometimes shares all leaning on one employer, three lines that behave like one circle.
4. **Cost is the one number knowable in advance**, and the lesson refuses to become the slogan "cheapest is best". It cannot see the reader's papers, so it does not pretend to judge their charge.
5. **Nobody knows what is coming — and the reader is not left cynical.** Most people sounding certain are not lying; confidence is *selected for*, and forecasts are scored almost never. The reply is the four questions that do have answers, each settleable in an afternoon for nothing.
6. **"Enough" is not a rebuke.** Proverbs 30:8 refuses **both** ends for the same non-financial reason — each has its own way of separating a person from Yahweh — and Paul *relocates* the word gain rather than rejecting it. The course refuses to hand anybody a number, because one figure for everybody is preaching rather than thinking. It ends on the question that tells the truth about the person asking it: if you had your number tomorrow, would you stop, or would the number move?

## Verification

- **57 quoted spans, 57 verbatim** against this repository's own KJV, re-fetched by the course's own test. **0 ellipsis inside any quotation.** 33 tests in the file.
- Baselines re-measured **through vitest against the real catalog**: band coverage **341 → 349 across 39 courses** (adultOnly 0, adultRegister 0); quotation integrity **529 → 537** with every total unchanged; stage-reaches-reader **529 → 537**, total still 0 and `courses` still the empty map; cross-list **45 → 46 courses, 678 → 686 lessons**.
- Cross-listed onto **Kingdom Life & Stewardship** (the steward's three questions, and *how much is enough*) and **Business** (the four risks, and the only number knowable in advance).
- The test file was written **fresh rather than derived from a sibling**, deliberately, because deriving by rename is what produced the defect DR-0553 records.

## What the pre-flight caught — three faults of mine, none of which reached the repository

1. **A compounding claim that was wrong in both directions.** Lesson five originally said that the rough estimate of a charge's cost *understates* it, "because each sum removed also stops compounding". That is backwards twice. Measured: `0.99^25 = 0.7778`, so a one per cent annual charge costs **22.2 per cent of the final value** — and that figure **already includes** everything the removed sums would themselves have earned, because it is measured against the final value, so adding a further allowance is double-counting. The familiar shortcut of `1% × 25 years = 25%` is therefore **high, not low**. The lesson now says both things explicitly, and lands on the property that actually matters and that I had missed entirely: **the fraction does not depend on performance.** Because the charge comes off the balance, the same share is taken whether the holding did superbly or poorly — nobody outruns a charge by picking something that does better. The corrected claim is the stronger one, which is the usual result of checking.
2. **An ambiguous arithmetic claim in lesson three.** "The gain from the first application to the second is about 7 … the thirtieth is about 50 — seven times larger" was ambiguous about which gain, and "seven times" is exact only against the first application's 7.00 (ratio 7.11), not the second's 7.49 (ratio 6.65). Now stated unambiguously: the **first** application adds exactly 7.00 and the **thirtieth** adds about 49.80.
3. **A quotation truncated at a colon.** A teen band closed a quotation of Luke 16:10 with a **full stop** after "faithful also in much", where the verse has a colon and continues "and he that is unjust in the least is unjust also in much". Every word present, and still a misquotation: the punctuation turned a clause into a sentence. It is now quoted whole, and the course's PROVEN-TO-CATCH test is built from this exact fault — including the observation that a check which normalised punctuation away would have passed it.

## And what the tests caught in the tests

**Two refusal guards fired on correct content, and the guards were wrong.** `most people should` matched the tutor posture *instructing a teacher never to say it*, and the forecast guard matched `'What returns will be'` — a **wrong quiz option the reader is meant to reject**. A guard that cannot tell a prohibition from a violation, or a distractor from a claim, fires on correct content, which is the failure these guards exist to prevent, committed by the guard.

Both were narrowed on a **stated principle** rather than loosened: quoted spans are stripped before looking for advice (naming a forbidden phrase in order to forbid it is a *mention*), and the forecast guard reads prose rather than quiz options (a wrong option is content the reader is asked to reject, not the course speaking). Both were then **shown to still fire on real advice and a real forecast**, and the remaining prose corpus is pinned as large so the narrowed guard cannot pass by reading nothing (DR-0076 §3).

## The honest remainder

- **The department is complete as Darrell named it** — four courses, thirty-two lessons, no unbuilt course carried forward. This DR opens no new `re-review:` for the department.
- **Teen and senior, not four bands** — the DR-0509 contract every catalog course ships under, recorded in the measured baseline and tracked in the standing band-authoring pass.

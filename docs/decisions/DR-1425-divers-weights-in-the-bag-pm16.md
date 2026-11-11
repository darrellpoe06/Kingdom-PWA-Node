# DR-1425: Divers weights in the bag (pm16)

**Date:** 2026-11-11
**Status:** Accepted
**Tier:** A (one lesson added to an existing course; no schema, no door, no money)
**Type:** lesson
**Area:** `app/src/lib/project-management-course.js` (pm16, 16 modules), `app/src/__tests__/project-management-pm16-verses.test.js` (22), `app/src/lib/course-band-coverage-baseline.json`
**Sent in by:** Darrell, 2026-10-27 at 19:31 UTC, Gmail thread `1a17ed862dc396be` — a Retail Dive send forwarded out of his university mailbox with one line typed above the forwarded header: *"Lesson and research and implementation of the research."* Three words in that line, and the third decides what the hour is for.
**Pairs with:** DR-0312 (the Gmail lesson-intake Way), DR-0610 (the seam is chosen by measurement), DR-0076 (never assert the unverified), DR-0402 (the reference rides beside the verse), DR-0456 (verses filled from the corpus, never typed), DR-0459 (no ellipsis inside a quotation), DR-0795 (every band sends the reader to someone), DR-1306 (what a script does to authored prose)

## Context

The send is an advertisement and says so in its own body: custom content created for a sponsor of the publication, and the sponsor sells payment systems. Beneath five sentences and three bullets it points at a report that sits behind a form demanding a real person's name, employer and job title.

## What was measured

- **The report was never read, so none of it is taught.** Opening it means spending Darrell's identity to fetch a vendor's PDF. The survey of 100+ retail leaders it advertises is therefore quoted nowhere, summarised nowhere and relied on nowhere. Exactly **one** claim in the email stands without it: customers expect one message across every channel, and they notice when it is absent.
- **The seam was measured against the course, not chosen by taste.** pm14 already teaches *which* measure, pm12 capability over titles, pm15 proximity to the work. None teaches the **same** measure in every place.
- **The anchor is exact.** Deuteronomy 25:13-14 forbids not one bad weight but **two** — a great and a small — and then relocates the second one: *in thy bag* and *in thine house*. Which standard a person met was a question of **where** they met him. That relocation is what makes an ancient commandment a lesson about channels.
- **This house was carrying two standards on the day it was written.** The Love Corner's church door showed the platform's name in its persistent header, and on a phone its bottom bar offered four platform surfaces inside a church-branded app. The church-only rule already existed in the navigation code and was correct; the bar had been added later as a fixed list and never told. First-party and checkable, which is why it is in the lesson instead of a vendor's survey.

## Impact

The teaching is that divers weights are almost never **authored**. They accumulate — each addition defensible on the day it was made — until two of them disagree, and the person who finds them is not auditing you. They have simply met you twice and compared without meaning to. Deuteronomy 25:15 attaches *length of days* to the single honest measure, which is precisely what the advertisement calls a returning customer.

The repair is the part worth keeping: the bar was not handed a corrected list, because a corrected second list drifts again the moment the first one changes. It was made to **read** the permission the app already computes. One standard consulted from two places, instead of two standards held in step by somebody remembering.

## Decision

1. **The lesson carries the subject and not the vendor's data.** Its limits are stated in its own text, and a gate asserts the report is named unread.
2. **The house's own failure is named in the lesson, by name**, rather than teaching the fault only against a retailer.
3. **Implementation is the deliverable**, because that is what was asked for: count every door, write the message once, walk each door as a stranger, and where two things must agree make one read the other.
4. **Every verse is filled from `app/public/bible/kjv` and carries its reference beside it** (DR-0402), in all five bodies rather than only the one a per-module gate would accept.

## Verification

22 checks on the live module. `fourBandFaults` empty — adult prose 2,162 words; shares child 0.568, youth 0.648, teen 0.684, senior 0.639; ladder child 1.31 < youth 4.84 < teen 5.64 < senior 6.71 with the adult lesson at 7.04, teen under its 6.0 ceiling and child under its 5.0; **worst band-pair overlap 0.048**, the lowest recorded on this baseline, because the four bands were written as independent compositions rather than re-registered from the adult. 40 referenced Scripture spans swept verbatim against per-chapter joins of the eight books the lesson touches. Course-wide: 76 green across the PM course, quotation-integrity and this lesson's own gate; 23 on band coverage.

**Findings, each caught by a gate rather than by reading.** (1) The first sweep treated *every* double-quoted span as a verse and reported seven failures that were ordinary prose in quotation marks; a gate that fires on correct prose teaches you to ignore it, so it now matches a quotation **followed by its reference**, which DR-0402 guarantees. (2) The Project Management course reserves double quotes for Scripture, and pm16's `bigIdea` held four spans of prose in them — one carrying an ellipsis (DR-0459). (3) The same `bigIdea` recited a decision record at the reader. (4) The course requires every lesson to name what the industry calls the thing. (5) **The teen band was moved by hand in both directions and overshot twice**: 8.18 → 4.05 (below youth, inverting the ladder) → 6.18 → 5.64; senior 12.10 → 6.71. Never by a script (DR-1306).

`re-review: 2026-11-25` — read the child and senior bands on the live build at Big Print size.

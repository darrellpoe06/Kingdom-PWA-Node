# DR-1423: A credential you cannot check is not a credential (sov73)

**Date:** 2026-11-11
**Status:** Accepted
**Tier:** A (one lesson added to an existing course; no schema, no door, no money)
**Type:** lesson
**Area:** `app/src/lib/sovereign-ai-class.js` (sov73, 73 modules), `app/src/__tests__/sovereign-ai-sov73-verses.test.js` (20), `app/src/lib/course-band-coverage-baseline.json`
**Sent in by:** Darrell, 2026-10-23 at 12:32 UTC, Gmail thread `1a168bfea63e45ea` — a Healthline Wellness Wire issue, "Don't fall for these common health myths", forwarded out of his university mailbox with ONE WORD typed above the forwarded header: `Lesson`. Eight minutes earlier the same mailbox sent the item that became sov72.
**Pairs with:** DR-0312 (the Gmail lesson-intake Way), DR-0610 / DR-1185 (the seam is chosen by measurement), DR-0098 (teach the Word, do not debate it), DR-0100 (speak established fact), DR-0076 (never assert the unverified), DR-0456 (verses are filled from the corpus, never typed), DR-1306 (what a script does to authored prose)

## Context

A newsletter written for Health Literacy Month offered the reader four tests for a health claim: whether research can be found, who gains and whether they say so, whether the content was machine-generated, and whether the person's credentials can be confirmed. It named its red flags — miracle cures, a claim of conspiracy, the promise of secret information "they" are keeping from you — said plainly that sounding convincing is not the same as being qualified, and closed by telling the reader to speak with a professional before changing anything. On its own terms that is honest work, and the lesson says so before it says anything else.

## What was measured

- **Two of its four tests are already taught in this course, so repeating them would be filling.** Cross-examining whoever profits from the cure lands on sov15; testing what arrives lands on sov44. Measured against the catalog, not recalled — and the lesson's gate asserts both ids appear in its own statement of what it does NOT re-teach.
- **The letter contradicts itself, and that gap is the lesson.** Its guidance says you should be able to find someone's degrees with a quick search. Its own fourth paragraph warns that videos of fake doctors giving health advice are now commonplace. It tells the reader to verify the authority and tells the reader the authority can be manufactured, and never reconciles the two sentences.
- **Its health claims were not verified and are therefore not repeated.** The underlying data is not on this machine; DR-0076 forbids asserting it. The lesson asserts none of the letter's medical content and states that limit in its own text.
- **The teen band inverted the ladder while being driven under its ceiling** — 4.17 against youth's 4.51 — and the gate named the inversion by band rather than by a general failure.

## Impact

The landing is the one test the letter names and cannot finish: **confirm the credentials.** A credential you cannot check is not a credential; it is a costume. 2 Corinthians 11:13-14 describes exactly that shape — not liars who look like liars, but workers *transformed into* the apostles of Christ, traced to one who is himself transformed into an angel of light. What changed in 2026 is the PRICE of the costume, not its existence: the warning did not become true this year, it became cheap. So the test that still holds is the one that does not depend on the face being real — **by their fruits** (Matthew 7:15-16): what actually came of the last thing this voice told people to do. That question is deliberately slow, and the slowness is the feature.

The red flag the letter named but did not date is the oldest pitch there is. Genesis 3:4-5 is the structure in three moves: contradict the authority ("ye shall not surely die"), assign Him a motive ("for He knoweth"), then offer the secret ("your eyes shall be opened"). Every version since is a reprint. And the pitch does not flatter you as gullible — it flatters you as one of the few who can see, which is why Ephesians 4:14's sleight of men works on clever people.

## Decision

1. **The seam is the unverifiable credential**, chosen by measuring what sov15 and sov44 already carry, and gated so a later rewrite cannot quietly collapse it back onto the profit motive.
2. **The source is handled honestly.** Its good work is named in every band before anything is said against it, and its closing instruction — speak with a professional — is REPEATED rather than softened, in all five texts, under a check.
3. **The correction is required in EVERY band, not remembered.** A week on discernment that ends in suspicion has taught its own opposite, so Proverbs 11:14 (counsel is COMMANDED; the safety is a multitude of counsellors) and Job 12:11 (the ear TRIES the words rather than refusing to hear them) must appear in all five texts or the build fails. The honest clinician who delivers unwelcome news is frequently the counsellor Scripture is sending.
4. **Every verse is filled from `app/public/bible/kjv`, never typed** (DR-0456), and the gate re-derives that from disk rather than trusting the generator.

## Verification

20 checks, run against the LIVE module. All four bands present; `fourBandFaults` reads clean — adult prose 1,578 words; shares child 0.563, youth 0.629, teen 0.625, senior 0.691; ladder child 1.18 < youth 4.51 < teen 5.94 < senior 8.49 with the adult lesson at 6.39, teen under its 6.0 ceiling and child under its 5.0; worst band-pair overlap 0.113 adult~youth against the 0.25 near-copy line. 49 quoted spans swept against per-chapter joins of the eleven books the lesson touches, every one verbatim and contiguous; the sweep asserts it examined more than 40 spans, because ll300's first sweep read the wrong field, examined nothing, and printed "0 mismatches". Proven to catch on one altered word and on the DR-0456 apostrophe class (an ASCII `'` where the corpus carries U+2019).

**Two findings worth keeping.** (1) The guard against a suspicion-only landing first matched the lesson's own DENIAL of that error — "it is not a reason to trust no one" — so it fired on the safeguard it exists to protect, and would have been "fixed" by deleting it. It now matches an *instruction* to distrust, and each band is separately asserted to carry the denial. (2) The teen band was raised from 4.17 to 5.94 by restoring five authored sentence-joins, each written as a before-and-after pair and read back, never by a script (DR-1306).

`re-review: 2026-11-25` — read the child and senior bands on the live build at Big Print size.

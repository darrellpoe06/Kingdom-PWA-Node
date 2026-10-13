---
id: DR-0619
title: Sovereign A.I. week 25 — deployed is not released; the ten-day test, and the one hidden in the ninety and nine (from a complete Level Up Coding forward, Lesson.)
status: accepted
date: 2026-09-24
tier: B
type: word
declared_by: Darrell
scope:
  - app/src/lib/sovereign-ai-class.js (the sov25 module + SOVEREIGN_AI_META.weeks 24 -> 26 with DR-0620)
  - app/src/__tests__/sovereign-ai-verse-integrity.test.js (SOV25_FRAGMENTS + SOV25_CORPUS + SOV25_ALLOWED + describe block; the shared wordFirstChecks helper)
  - app/src/__tests__/sovereign-ai-class.test.js (count pins: length, weeks, schedule length, progress total)
  - app/src/__tests__/learn-crosslist.test.js (program lesson-count ratchet 716 -> 718, with DR-0620)
  - app/src/lib/course-band-coverage-baseline.json + app/src/__tests__/course-band-coverage.test.js (total 376 -> 378 and the sovereign-ai row 24 -> 26, with DR-0620)
principles: [WORD-FIRST, SPEAK-ESTABLISHED-FACT (DR-0100), TEACH-DONT-DEBATE (DR-0098), VERIFICATION-DOCTRINE (DR-0076), DECISION-RECORDS (DR-0011)]
grounds:
  - DR-0312 — the Gmail-lesson-intake Way (a forward with his one-word marker becomes a lesson the same session)
  - DR-0317 — the repoint moved the rows, not the blobs (the worked case of healthy appearance and missing fruit)
  - DR-0125 — the site's own witness (green deploys beside a down site)
  - DR-0107 — prove the deploy (the ~9-hour stale site; the served build checked against main)
  - DR-0054 / DR-0103 — merge = deploy; the lane and the hold label
  - DR-0104 — Reviewer mode on the live build
  - DR-0506 — Sovereign A.I. week 24, the shape and gate pattern this week follows
---

## Context

On **2026-09-24 at 15:01Z** Darrell forwarded, from `dpoe@illinois.edu`, the **Level Up Coding** issue **"Deployment Patterns Every Engineer Should Know"** (Nikki Siapno, Sep 24 2026), with one word: **Lesson.** The same issue had also arrived directly at 14:26Z (Gmail thread `1a0d3cfcd506e417`).

**The article came through COMPLETE**, so its sentences are quoted in the lesson as its own claims, attributed. The sponsor block at its head (an analytics vendor) is an advertisement and is not taught. His framing is the one word; so the Word leads and the article is the occasion.

## Decision — what his word became

**Sovereign A.I. week 25 — `sov25-the-ten-day-test-and-the-one-hidden-in-the-ninety-and-nine`**, "Deployed is not released - the ten days in Daniel, the one hidden inside the ninety and nine, and the fruit that tells the truth." Ten movements, Word first:

1. **Being in place is not being revealed** — the Son governed the timing of disclosure by His Father's hour (John 2:4; 7:6; Matthew 8:4; 16:20; Galatians 4:4; Habakkuk 2:3). Bright line pinned in the test: **He was never an unproven change; the parallel is timing only.** Galatians 5:9 for the danger of one release to everyone at once.
2. **Provenance** — complete forward, sponsor set aside, the article is the occasion.
3. **Built before it is brought** — 1 Kings 6:7 as immutable artifacts; this house stamps each build with its commit and checks the served build against main (DR-0107).
4. **Two versions alive at once; switching back is not undoing** — Amos 3:3; Esther 8:8 (the sealed writing no man may reverse, answered by a second sealed writing = the compensating change); Hebrews 12:17.
5. **The canary is Daniel 1:12-16**, quoted whole — small group, ten days, named comparison with the control, the steward's consent, the observed result, then widening. Numbers 13 for the few sent ahead, and Numbers 13:32 with 14:1 for the article's shadow-traffic warning (a mirrored request is still a real request). Judges 7:4; Zechariah 4:10.
6. **The one inside the ninety and nine** — Luke 15:4, 15:7; Matthew 18:14; Joshua 7 (a healthy-looking camp hiding one trespass until Ai). Measure the canary separately.
7. **The fruit, not the appearance** — John 7:24; 1 Samuel 16:7; Matthew 7:20; Proverbs 18:17; Proverbs 20:10. Worked cases from this house: DR-0317 (rows moved, blobs did not; 322 choir-team files and 121 sermon documents unreadable twelve days, the private ones unreported) and DR-0125.
8. **Flags and Nehushtan** — Numbers 21:8 with 2 Kings 18:4: an owner and a cleanup date. This house's blob-bridge variable shipped 2026-08-31 with a re-review date and was retired 2026-09-08 after a measured read-back; `REPOINT-ARMED` as a deploy/release separation whose own comment says "Reverting the record file is the whole off-switch."
9. **The bright line — test the tool, never put the Word in a variant** — Galatians 1:8; Psalms 119:89; Matthew 24:35; Isaiah 40:8; James 5:12 for stable assignment. "What people prefer is data about people; it is never a vote on what Yahweh said."
10. **Assume something will slip** — Ecclesiastes 7:20; Proverbs 28:13; 1 John 1:9; Matthew 25:21; Luke 16:10; Isaiah 28:10; closing 2 Timothy 2:15.

## What was measured — DR-0100 tiers (verified 2026-09-24)

- **Tier 1 — documented.** The article itself (received whole). **Kubernetes** Deployment docs, **fetched verbatim 2026-09-24** from `kubernetes/website` on github.com (25% max unavailable, 25% max surge by default). **Argo Rollouts** README, fetched verbatim (a rolling update "provides no control over the blast radius, may rollout too aggressively, and provides no automated rollback upon failures."). **Flagger** README, fetched verbatim ("by gradually shifting traffic to the new version while measuring metrics and running conformance tests."). `blog.levelupcoding.com` is egress-blocked — irrelevant here because the forward carried the whole text.
- **Tier 2 — open, narrow.** Canary percentages and windows depend on traffic (the article says so). Whether a traffic-split canary fits this small single-edge app is **unmeasured** — named, not guessed (**re-review: 2026-11-24**). NOT open: separating deployment from release and widening on evidence reduces how many people a bad release reaches.
- **Tier 3 — over-reach, both ways.** "Tests passed, ship to everyone" (Proverbs 14:15; Galatians 5:9) and "automation makes it safe by itself" (the article's own "only as good as the signals it watches"; John 7:24). The two steelmen are named to be educated past, not voted on.

## Impact — the honest statement of this house

This house merges and deploys to everyone at once (DR-0054) and has **no percentage canary**. The lesson says so, and names what it does have: deterministic gates, the hold label, the live-site witness (DR-0125) and Reviewer mode (DR-0104). Record ids are cited here and in the quiz and facilitator fields only; the reader's lesson, bigIdea, inApp and age bands describe the records by date and substance instead (the quotation-integrity rule), and a test pins that.

Counts moved with DR-0620: sovereign-ai weeks 24 -> 26; program lessons 716 -> 718; band-coverage total 376 -> 378 (sovereign-ai row 24 -> 26); quotation-integrity measuredLessons and stage-reaches-reader lessons 567 -> 569.

## Verification

- **52 KJV references pinned**, every quoted verse **filled from `app/public/bible/kjv` by the authoring generator** (never typed from memory), each present in the lesson as `"text" (Ref)`, and re-read from the corpus at test time through a per-verse address map. Every quoted verse in the other fields (bigIdea, inApp, benefits, bands, quiz, rpe, facilitator) must be nested with a pinned fragment.
- **Proven-to-catch:** drifting one word of Daniel 1:12 across the module ("Prove" -> "Test") failed 5 tests; tampering the pinned Daniel 1:12 ground truth in the test failed 7; restored, 173 of 173 passed.
- **Non-Scripture quotes allow-listed:** every double-quoted non-Scripture span in the lesson is the article, a tool README fetched verbatim, or this repo's own files.
- **Reading level** (scripts/reading-level.mjs): child 0.7, teen 6.4, senior 8.1 — ascending, child under the 7.0 ceiling.
- The corpus apostrophe is typographic (’); a pin guards Esther 8:8 against a silent straight-apostrophe drift.

## Re-review

- **2026-11-24** — whether a traffic-split canary would catch anything the gates, the live witness and Reviewer mode do not.

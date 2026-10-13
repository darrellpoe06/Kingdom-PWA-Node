---
id: DR-0304
title: The reader and the follow map read from ONE root — a page without a <main> was spoken perfectly and highlighted not at all
date: 2026-08-14
status: accepted
supersedes: []
superseded-by: null
amends: [DR-0299]
tier: A
entities: [church, poetech]
grounds: [COMMUNITY-FIRST, VERIFICATION-DOCTRINE, MACHINERY-OVER-MEMORY, EXCELLENCE-STANDARD, PERPETUAL-IMPROVEMENT]
source: 2026-08-14 session — Darrell: "this page just reads without a reader highlighting the words and following the word we currently reads... comprehensive review of the reader and pages to make sure it's working..."
---

## Context

Darrell asked for a comprehensive review of the reader across the pages. Two
defects came out of it. Both are the same shape, and it is the shape that has
bitten this repo six times in one week.

## Finding 1 — the map was built from the chrome (completes DR-0299)

DR-0299 taught `readablePageText()` to strip the app's furniture out of the
spoken text. That fix was real but **partial, and I did not notice at the
time**: `readablePageText` is only the FALLBACK. The primary page path builds
`buildFollowMap(main)`, which used `SKIP_SELECTOR` — a narrower list that
excluded `.tts-controls` and dialogs but **not** `button`, `nav`, `[role=
tablist]`, `[role=menu]`. So on every page-read surface except ChurchLearn,
Presenter and ScriptureLibrary the reader still spoke the furniture, and every
button label also became a mapped RANGE — which is why highlights landed on
chrome instead of on the words.

`SKIP_SELECTOR` now matches `CHROME_SELECTOR`, and the test extracts BOTH lists
from source and asserts every selector in one appears in the other. On its first
run that derived check found a gap I had missed by hand: `.feedback-modal` was
stripped from the spoken text but still mapped.

## Finding 2 — the two halves read from different roots

This is the one Darrell reported, and it is worse than finding 1.

```
readablePageText():  document.querySelector('main') || document.body
the follow map:      document.querySelector('main') || null      ← here
```

The TEXT extractor falls back to `document.body` when a surface renders no
`<main>`. The FOLLOW MAP did not — it was built only when `querySelector('main')`
returned an element, and set to `null` otherwise.

**Only six files in this app render a `<main>`.** On every other surface the
reader spoke the page perfectly and highlighted nothing, because there was no
map to highlight from. Reading worked; following did not; and nothing anywhere
said the two were supposed to use the same root.

Three call sites carried the divergence (the page-read path, the
registered-target fallback, and `talkAbout`'s surface digest — that last one
described surfaces from `null`, so a person asking "what is this?" on a
main-less page got the help entry with none of the real on-screen numbers).

## Decision

1. **One exported `readingRoot()`**, `main || body || null`, and every read path
   calls it. Not a comment asking the next person to remember — the thing itself.
2. **`SKIP_SELECTOR` is derived against `CHROME_SELECTOR`**, so the spoken text
   and the mapped ranges cannot describe different documents.
3. **The guard is class-level, not instance-level.** The last case fails if ANY
   `querySelector('main')` appears in `TTSControl.jsx` outside the one
   definition — a fourth divergent call site fails the build, rather than
   waiting to be reported from a phone.

## The recurring shape, named

Six instances this week of **two places that must agree, kept in agreement by a
comment**: `getInitialChurchView` vs `parseNav`; `VALID_VIEWS` vs the shell's
`VALID`; the read-reveal guard vs an ARIA attribute; `PRESERVED_PARAMS` vs what
the app reads; `CHROME_SELECTOR` vs `SKIP_SELECTOR`; and now the text root vs
the map root.

Every one shipped green. Every one was found by a person using the app. The
durable answer is not more care — it is **derive one from the other, or make
both call one function**, and let a test fail when they drift (DR-0239's
machinery-over-memory applied to a defect class rather than a rule).

## Proven-to-catch (DR-0076 §3)

Restoring `querySelector('main') || null` at the page-read path → the derived
case fails and NAMES the offending line. Making `readingRoot` skip the body
fallback → the behavioural cases fail. Reverting `SKIP_SELECTOR` → the two-list
check fails. 7 pins here + the DR-0299 list check; suite green; lint clean;
build clean.

## Consequences

- The words being spoken are highlighted on every surface, not only the six
  that happen to render a `<main>`.
- "Talk about this" describes the real surface on those pages too.

## Honest remainder

- **Verified in jsdom, not on a phone.** These cases prove the map is BUILT and
  that both halves agree on the root. They do not prove the highlight is
  visible on a real device — that is DR-0302's open item (a probe case that
  starts a read and screenshots mid-sentence) and it is still open.
  **re-review: 2026-08-20.**
- The comprehensive review Darrell asked for is **not finished**. Two findings
  are closed here. The remaining surfaces have not each been walked as a user
  (COMPREHENSIVE-REVIEW-STANDARD dimension 2, journey walks), and the
  form-factor sweep (dimension 4) has not run on the reader. Named rather than
  claimed. **re-review: 2026-08-15.**

## Links

`app/src/components/TTSControl.jsx` (`readingRoot`),
`app/src/lib/read-follow.js` (`SKIP_SELECTOR`),
`app/src/__tests__/reader-follows-on-a-page-without-main.test.jsx`,
`app/src/__tests__/reader-reads-content-not-chrome.test.jsx`,
[DR-0299] (amended), [DR-0302], [DR-0285], [DR-0239], [DR-0076].

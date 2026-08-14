---
id: DR-0300
title: The whole World English Bible is ingested — the modern reading beside the KJV, and an empty verse is a textual fact, not a hole
date: 2026-08-13
status: accepted
supersedes: []
superseded-by: null
amends: []
tier: A
entities: [church]
grounds: [WORD-FIRST, VERIFICATION-DOCTRINE, SOVEREIGN-FIRST, COMMUNITY-FIRST, MACHINERY-OVER-MEMORY]
source: 2026-08-13 session — Darrell, after being told the ESV cannot be reproduced: "yes ingest the WEB translation." Earlier in the same thread: "only KJV and ESV if possible" and, once the copyright answer landed, "dont have to have ESV... it would be nice..."
---

## Context

Darrell asked for a modern translation beside the KJV and named the ESV. The
answer was no, on copyright — `bible-editions.js` lists it EXCLUDED,
*"Copyrighted (Crossway)… never reproduce or base our text on it."*

That should not have been the end of the answer, and it nearly was. The repo's
own registry **already pointed at the alternative**: `bible-editions.js` carried
`WEB` at `reproduce: true`, with the trademark note already written, and the
2026-06-25 base-text research review had already verified it against primary
sources as *"Public Domain (explicit dedication)"*. That review's open item was
literally *"Ingest the full WEB + KJV Bibles… beyond the curated 180-verse
seed."* The KJV half shipped in July as `fetch-full-kjv.mjs`. **This was the
missing half, not a new idea** — and it went unfound because the first answer
stopped at "the ESV is not possible" instead of asking what was.

## Decision

1. **Ingest the whole WEB** — 66 books, 31,103 verses, 4.1 MB, per-book static
   assets under `app/public/bible/web/`, in the SAME shape as the KJV corpus.
   Book names are taken from the KJV index so the two editions cannot drift
   apart on naming.

2. **One loader, parameterized by edition.** `loadBook` / `verseText` /
   `chapterVerses` take an `edition` defaulting to `'kjv'`, so every existing
   caller is untouched and the next public-domain edition is a folder rather
   than a code path. `EDITIONS_ON_DISK` is the reader's list; the licence gate
   stays in `bible-editions.js`.

3. **Verbatim, and labelled WEB — because the trademark makes that binding.**
   The research review records the one real constraint: the TEXT is public
   domain and modifiable, but the NAME "World English Bible" is a trademark, so
   a MODIFIED text must be renamed. The ingest normalizes whitespace and nothing
   else. Verbatim + labelled is what honours the mark; it is not a style choice.

4. **An empty verse is RECORDED, not fatal — and the count is bounded.** The
   gate hard-failed on its first run at Luke 17:36, which is not a hole: it is
   one of the verses the critical text omits and the KJV (Textus Receptus)
   carries. Failing on those would make an honest critical-text edition
   impossible to ingest; ignoring them would let a real parse regression ship
   disguised as a textual difference. So empty slots ride in the index and the
   TOTAL is bounded at 40 — 5 across 31,103 is a divergence, hundreds is a
   broken parser.

5. **Each empty slot was checked individually, not lumped.** Four are TR-only
   verses (Luke 17:36, Acts 8:37, Acts 15:34, Acts 24:7). The fifth, **Romans
   16:25, is not an omission at all but a VERSIFICATION difference** — the WEB
   places that doxology at Romans 14:24, verified by finding "able to establish
   you" there. Calling it a missing verse would have been wrong, and the
   difference between the two is exactly what the reader deserves to be told.

## Proven-to-catch (DR-0076 §3)

The gate proves the corpus is really the WEB and not the KJV under another name
— which the trademark rule makes a real problem, not a typo:

- **John 3:16** reads *"one and only"*, never *"only begotten"*.
- **1 John 5:7** lacks the Comma Johanneum (the KJV carries it).
- No `thee/thou/thy/saith/hath` in a sampled sweep — it is modern English.
- **Psalm 119 is not truncated.** This is the poetry-rejoin case: one verse
  arrives as several `line text` entries, and assigning instead of appending
  would keep only the last fragment. A short Psalm 119 is that bug's signature.
- No markup, no folded-in editorial headings, whitespace normalized only.
- The omission list is pinned exactly, and cannot quietly grow.

19 pins; suite 7,752 green at the time of the ingest; lint clean; build clean.

## A finding for the platform's own voice

The WEB renders the divine name as **Yahweh** where the KJV prints "the LORD" —
Psalm 23:1 *"Yahweh is my shepherd"*, Isaiah 42:8 *"I am Yahweh. That is my
name."* That aligns with this repo's covenant-name rule in a way nobody planned.

The DR-0076 bright line is untouched and must stay untouched: **inside a
quotation the text is whatever that translation says, verbatim, either way.**
Nothing is substituted into a quote in either direction. This is simply what the
modern public-domain edition reads.

## Consequences

- A modern-English rendering is available for ANY verse, not the 180 seeded.
- The 2026-06-25 review's open item is closed on the WEB side.
- A further public-domain edition (ASV, YLT, Darby — all cleared in the
  registry) is now a folder plus an ingest script, not a new code path.

## Honest remainder

- **The corpus is on disk but not yet surfaced.** The verse cards and the spoken
  reading still show and speak KJV only; wiring the WEB alongside it is the next
  step and is NOT done here. **re-review: 2026-08-20.**
- The licence rests on the repo's own dated primary-source review, because
  **ebible.org is not reachable from this sandbox** — the copyright page could
  not be fetched to confirm it first-hand this session. The review is a good
  source and it is dated; it is not the same as reading the dedication today.
- The npm package's own `license` field reads `UNLICENSED`, which refers to the
  WRAPPER repo, not the text. That is a trap for the next person and is named
  here so it is not re-discovered as an alarm.

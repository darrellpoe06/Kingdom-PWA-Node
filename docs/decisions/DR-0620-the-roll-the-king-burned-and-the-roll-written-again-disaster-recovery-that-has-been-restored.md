---
id: DR-0620
title: Sovereign A.I. week 26 — the roll the king burned and the roll written again; a disaster recovery plan that has actually been restored, and the Word no fire can reach (from an IT Brew TEASER forward, Lesson.)
status: accepted
date: 2026-09-24
tier: B
type: word
declared_by: Darrell
scope:
  - app/src/lib/sovereign-ai-class.js (the sov26 module; SOVEREIGN_AI_META.weeks 24 -> 26 with DR-0619)
  - app/src/__tests__/sovereign-ai-verse-integrity.test.js (SOV26_FRAGMENTS + SOV26_CORPUS + SOV26_ALLOWED + describe block)
  - app/src/__tests__/sovereign-ai-class.test.js, learn-crosslist.test.js, course-band-coverage.test.js + baseline (counts moved together with DR-0619)
principles: [WORD-FIRST, SPEAK-ESTABLISHED-FACT (DR-0100), TEACH-DONT-DEBATE (DR-0098), VERIFICATION-DOCTRINE (DR-0076), DECISION-RECORDS (DR-0011)]
grounds:
  - DR-0312 — the Gmail-lesson-intake Way
  - DR-0317 — the repoint moved the rows, not the blobs (455 objects; twelve days; the copy, the parity, the read-back)
  - DR-0585 — "a preview, not a backup"
  - DR-0238 — back up, VERIFY, then empty; "A backup that was never verified is not a backup."
  - DR-0306 / infra/nas-supabase/README.md — "Hosted Supabase did this invisibly." (the backup item still listed NOT done)
  - DR-0506 / DR-0619 — the Sovereign A.I. week shape and gate pattern
---

## Context

On **2026-09-24 at 14:36Z** Darrell forwarded, from `dpoe@illinois.edu`, the **IT Brew** issue **"Backup plan"** (September 24, 2026; Brianna Monsanto, Eoin Higgins), with one word: **Lesson.** (Gmail thread `1a0d3d8981e7f60f`.)

**The lead story arrived as a TEASER.** What came through: "Does your IT disaster recovery (DR) plan actually work?"; "If your organization experienced a ransomware attack today, how long would it take to recover?"; the DR plan defined as "a formal document that details how an organization will restore IT infrastructure in the event of a disaster"; and Michael Sparks (Nextworld) on what a disaster is — anything "where the technology interrupts the operations of the business", from a tripped cable to a hurricane bearing down on a data center. Then a link.

**What did not come through.** The full story is on `itbrew.com`, **egress-blocked** from this sandbox (as was a newsbreak.com mirror). A web search confirms only its title, *How to develop an effective IT disaster recovery plan*. **No step is attributed to it**; the lesson says so in its own text and a test pins the disclosure. The issue's other items (a data-center energy item citing a July McKinsey study; a SaaS-versus-vibe-coding item quoting Mike Wehrs; statistics) are weighed as reported, not built upon.

## Decision — what his word became

**Sovereign A.I. week 26 — `sov26-the-roll-the-king-burned-and-the-roll-written-again`**. Ten movements, Word first:

1. **The storm comes to both houses** — Matthew 7:24-27 (the two storm verses are word for word the same weather; the difference was laid before the rain); Ecclesiastes 9:11; Proverbs 27:1; Proverbs 22:3.
2. **Provenance** — the teaser, the blocked story, nothing invented.
3. **Joseph wrote the plan in plenty** — Genesis 41:34-36, 48-49, 56; Proverbs 6:6, 8. His two questions are recovery time and recovery point; storage "in the cities" near every field is copies in more than one place.
4. **The roll the king burned and the roll written again** — Jeremiah 36:23, 27-28, 32; Exodus 34:1. Recovery is real only when a copy survives outside the attacker's reach. **Bright line pinned:** the Word is not our data; it does not depend on our disks (Psalms 119:89; Matthew 24:35; Isaiah 40:8; 1 Peter 1:25).
5. **The oil before the cry** — Matthew 25:3-10; "At midnight, nobody can lend you your backup." restic: "Much more important than backup is restore". DR-0238's sentence. Lamentations 3:40; Nehemiah 2:13.
6. **Three, two, one** — Ecclesiastes 4:12; 11:2; Genesis 32:7-8; restic on the same-machine copy and on the key.
7. **The storm runbook, people first** — Acts 27:18-19, 22, 29-31, 44.
8. **The downside question** — the newsletter's COO quote; Luke 14:31; Proverbs 24:6; Psalms 127:1. For a sovereign house the question turns inward: what a vendor did invisibly becomes ours.
9. **Our own house, measured** — DR-0317 (rows moved, blobs did not; 455 objects; twelve days unwatched; copy tool with per-shelf parity; one picture read back HTTP 200 on 2026-09-08 before the bridge retired), DR-0585, DR-0238.
10. **Prepare without fear, and the treasure no ransom reaches** — Proverbs 21:31; Psalms 46:1-2; 2 Timothy 1:7; Hebrews 11:7; Matthew 6:34, 19-20; Hebrews 12:27-28; closing Luke 12:42.

## What was measured — DR-0100 tiers (verified 2026-09-24)

- **Tier 1 — documented.** 3-2-1 (search-verified 2026-09-24; the CISA document on cisa.gov was not fetched). RTO/RPO as the two numbers every plan states (search-verified). **restic README, fetched verbatim 2026-09-24 from github.com**: "Much more important than backup is restore"; "Saving a backup on the same machine is nice but not a real backup strategy."; "Losing your password means that your data is irrecoverably lost."; "Doing backups should be a frictionless process, otherwise you might be tempted to skip it."
- **Tier 2 — open, narrow.** Any organization's recovery time is known only by restoring and timing it. The McKinsey figures (onsite 20%, hybrid 45%; 64% gas, 23% renewables, 13% nuclear by 2030) are IT Brew's report; the study was not fetched (**re-review: 2026-10-24**). **This house's own open item:** `infra/nas-supabase/README.md` still lists **backups** under "What is NOT done yet" ("Hosted Supabase did this invisibly. On the NAS it is ours, and it is not optional for the family's data."). Whether a box-level NAS backup already covers the sovereign database is **not recorded anywhere in the repository**, so the lesson claims neither way (**re-review: 2026-10-08**).
- **Tier 3 — over-reach, both ways.** "It is in the cloud, so it is backed up" (the provider's invisible work is not your plan) and panic hoarding (Matthew 6:34; 2 Timothy 1:7). The two steelmen are named to be educated past; the test is oil in the vessel, not the number of lamps.

## Impact

The lesson names an open item in this house instead of smoothing it over: the sovereign database's own README lists backups as NOT done, and the repository records no box-level backup either way. Teaching "a backup nobody has restored is not yet a backup" obligates us to measure our own (re-review below). Readers are never handed our bookkeeping: record ids appear only in the quiz and facilitator fields, never in the reader's lesson, bigIdea, inApp or age bands (the quotation-integrity rule).

## Verification

- Acts 27:30 is retold in our own words rather than quoted, because its KJV spelling ("under colour") would sit in a prose scanner's view of this file; Acts 27:31 carries the point verbatim.
- **61 KJV references pinned**, every quoted verse **filled from `app/public/bible/kjv` by the authoring generator**, present in the lesson as `"text" (Ref)`, and re-read from the corpus at test time; other fields must nest with the pinned fragments.
- **Proven-to-catch:** drifting one word of Jeremiah 36:28 in the lesson ("former" -> "first") failed 7 tests; restored, the file passed whole.
- **Non-Scripture quotes allow-listed** to the newsletter, restic, and this repo's own files.
- **Reading level:** child 2.3, teen 6.2, senior 6.7 — ascending, child under the 7.0 ceiling.

## Re-review

- **2026-10-08** — the sovereign database's backup: measure whether a box-level backup exists and has ever been restored; close the README item or build it.
- **2026-10-24** — the McKinsey figures, if the study becomes reachable.

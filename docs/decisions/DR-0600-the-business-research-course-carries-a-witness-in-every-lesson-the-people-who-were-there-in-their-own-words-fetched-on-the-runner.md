# DR-0600 — The Business Research course carries a witness in every lesson: the people who were there, in their own words, fetched on the runner

- **Status:** accepted
- **Tier:** A (voices and timeline entries added to one Learn course; no schema, no transport, no money)
- **Type:** fix
- **Date:** 2026-09-24
- **Scope:** `app/src/lib/business-research-course.js` (four new records, `web.archive.org` added to `BUSINESS_SOURCE_HOSTS`, sixteen witness voices, three timeline entries, header provenance); `app/src/__tests__/business-research-course.test.js` (32 voices, 12 records, a witness pinned in every lesson, the timeline's end 2018 → 2020)
- **Principles:** THEIR-WORDS-FETCHED-NOT-REMEMBERED (DR-0580 / DR-0597), VERIFICATION-DOCTRINE (DR-0076), SPEAK-ESTABLISHED-FACT (DR-0100), DO-NOT-RE-ASK (DR-0111), NOTHING-WAITS (DR-0236)
- **Grounds:** Darrell 2026-09-24, screenshot of the course's landing: *"Any actual testimonies from witnesses?! For these lessons?!"* — then *"Fix them too!"* Measured before the fix: the course's 16 voices were filings, the Court's findings, WTO summaries, a press release and the podcast's show page; no person who was there spoke in his own words.

## Context

DR-0594 built the course on records, which was right, and stopped short of testimony, which was the same gap the 1619 course had (DR-0597). The people in these rivalries wrote things down under their own names: the chief executive of Netflix apologised in the first person on the company blog (the live page is gone; the Wayback Machine's dated copy answers a runner); the company signed a letter to shareholders and filed it; the chairman of Blockbuster spoke in the press release filed the day the company entered chapter 11; Disney's and Marvel's chief executives were quoted in the announcement; Bill Gates's memorandum was entered into the Court's Findings of Fact in his own words; Boeing names Airbus in its own sworn annual report.

## What was measured

| what | measured |
| --- | --- |
| candidate records probed on a runner | 39 across runs 35946339324, 35946488040, 35946756879; the pages that answered 404 (the live Netflix blog page, two guessed DOJ transcript pages, a govinfo hearing, a guessed Boeing accession, a guessed Netflix exhibit) and a PDF the probe cannot read (Barksdale's testimony) were NOT used |
| witnesses added | Hastings 2011 (four passages: "I messed up. I owe everyone an explanation."; "In hindsight, I slid into arrogance based upon past success."; on moving fast; on splitting the DVD service), Netflix's letter to shareholders 2011 (two), Keyes 2010, Iger 2009, Perlmutter 2009, Gates as the Court quoted his 1995 memorandum (two), Boeing's 10-K 2020 — 16 voices, two per lesson, on 4 new records |
| gates | `businessResearchVoiceFaults` and `businessResearchTimelineFaults` 0 on every lesson; every voice ≥ 8 verbatim words, no elision, on a listed host; every year a voice carries on its lesson's timeline (1995, 2019, 2020 added); the witness pin requires a named person, or the company under its own signature speaking as "we", in every lesson |
| the whole course | 32 voices on 12 records; timeline 1989 → 2020; `history-voices-witness` runs on the push and must find every voice on its page |

## Impact

Without witnesses, a research course on rivalries teaches a reader to trust summaries about people it never lets speak, the exact gap the 1619 rebuild closed the same day. With them, every lesson holds at least one person under his own name or signature, probed on a runner, and the pin keeps it that way; the cost is sixteen voices, three timeline years and one host added to the business list.

## Decision

1. A course that teaches research on a case carries, in every lesson, at least one person who was there in his own words, fetched on a runner; a record that only describes people is not a witness.
2. A page a company has removed is quoted from the Wayback Machine's dated copy, never from memory, and the host is listed for that reason.
3. The Business and History courses share the rule and the witness workflow; the next course in either department is built to it from the first commit.

## Verification

- `business-research-course.test.js` green with the new pins; `learn-crosslist` and `every-stage-reaches-the-reader` green; lint 0.
- `history-voices-witness` on the push: every one of the 32 voices found on its page, or the build is red; the run id is recorded on the PR.
- re-review: 2026-10-22 — re-probe the 12 records; Barksdale's direct testimony (a PDF on justice.gov) is the record still to open once the witness can read a PDF.

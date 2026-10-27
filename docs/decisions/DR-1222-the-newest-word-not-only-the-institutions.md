# DR-1222: The newest word, not only the institutions' — World Issues carries what is being said now, and weighs an institution by its record

**Date:** 2026-10-27
**Status:** accepted
**Tier:** A (one lesson amended in the existing World Issues course; one new lint with a shrink-only baseline; one renderer block; no schema)
**Type:** curriculum + gate (WORD-FIRST, VERIFICATION-DOCTRINE)
**Area:**
- `app/src/lib/world-issues-class.js`: `BROKEN_SEAL_ISSUE` gains `latest` (the dated newest word), `f-field-ahead-of-the-office`, `f-the-record-of-institutions`, `f-catalog-listing-open`, `lim-institutions-trail`, `n-the-office-is-late-not-lying`; the teaching in `lens.stewardship` and all four bands; `WORLD_ISSUES_TUTOR_META.posture` move (3)
- `app/src/lib/discernment-track.js`: `normalizeIssue` carries `latest` and `sources[].primary`; `lintLatestNotOnlyInstitutions` (`latest/missing`, `latest/only-institutions`, `documented/one-word`), `LATEST_SINCE = 2026-10-27`, in `ISSUE_LINTERS`
- `app/src/lib/world-issues-latest-baseline.json`: the 21 earlier issues' warnings, held shrink-only
- `app/src/components/DiscernmentStages.jsx`: "What is being said now" rendered under Stage 2, ahead of "What is documented"
- `app/src/lib/lesson-stories.json`: lesson 22's two parables (The Wall and the Register; Grandma Ruth and the Second Set of Eyes)
- `app/src/__tests__/world-issues-class.test.js`, `app/src/__tests__/world-issues-verse-integrity.test.js`: the gates

**Amends:** DR-1217 (lesson 22 is completed, not replaced). **Grounds:** DR-0100 (established fact stated plainly; false skepticism is not discernment), DR-0076 (verification), DR-0677 (the curriculum gate), DR-0076 §3 (proven to catch).
**Principles:** WORD-FIRST, VERIFICATION-DOCTRINE, SPEC-CONFORMANCE-REVIEW, APP-IS-PRIMARY
**Declared by:** Darrell, 2026-10-27: *"World issues did not have the latest information... just the latest in institutions... which are usually behind the main stream... like we don't take epstein seriously anymore and the institutions are trustworthy when historical events say otherwise for Africa Americans... make sense?"*

## Context

Lesson 22 (DR-1217) was researched on 2026-10-22 and graded its facts by what the institutions had confirmed: the PHP project's announcement, the CISA alert, the Mozilla bug, the CERT-In advisory. It carried one firm's report of attack attempts from October 17 as "a single source," and nothing of what the field was saying by the end of the week. Darrell's correction names two things at once. First, **recency**: the institutions are usually behind the people closest to the event, so a lesson that waits for them is late by design. Second, **standing**: an institution's word is not the top tier of truth by its name, because its record is documented — the Public Health Service at Tuskegee (1932–1972), and the July 2025 closing of the Epstein files that much of the public refused to accept. The lesson was still open on PR #2407 with two gates red (no side stories; no talk-together directions), so the correction was folded into the same change rather than shipped after it.

## What was measured

- **The gap, on the first draft.** `verifiable` carried six items; every `documented` one rested on institutional or vendor confirmation; no section carried what was being said now; the bands taught nothing about the standing of an institution. `lesson-completeness` was short of stories (0 of 2) and `talk-together` short of all three directions in the lesson and in every band.
- **The newest word, by live search on 2026-10-27** (the primary pages still do not resolve from this sandbox; every item is carried with the date it was read and who said it):
  - Amazon's MadPot honeypots logged an attempt on **October 17**, four days before the patch (SecurityWeek; The Hacker News).
  - Cloudflare's chief executive: thousands of attempts in the ten hours before the announcement (SecurityWeek).
  - CrowdSec: **1,187** addresses sending PHP2Shell requests by the night of October 25; no public exploit reliable against a default PHP; **0** publicly confirmed compromises — a network sample, not a census.
  - watchTowr: the circulating proofs of concept "either don't work at all, test for timing-based differences, or crash the target."
  - eMudhra's board decided **October 22** to leave the global TLS certificate business (about one percent of its revenue; replacement certificates free through partners).
  - Non-browser clients remain the gap: Java checks no revocation by default and keeps its own trust file; Go and Node.js shipped fixes; Red Hat's RHSB-2026-012.
  - Whether the national Known Exploited Vulnerabilities catalog had listed the two flaws by week's end could **not** be confirmed with a dated page; carried as partly documented, named as open.
- **The record of institutions, documented:** the Public Health Service's study at Tuskegee — 399 Black men with syphilis, 1932 to 1972, untreated after penicillin became the standard, the President's apology on May 16, 1997 (CDC timeline; Congressional Record 1997-05-19). The DOJ/FBI memo of July 7, 2025: no incriminating "client list" found, "no further disclosure would be appropriate or warranted" (NPR via OPB), and the public backlash, including from the administration's own supporters (ABC News).
- **The 21 earlier issues under the new lint:** all 21 lack a latest section; 12 carry at least one `documented` item resting on one publisher (the worst, nine items). Held as warnings in `world-issues-latest-baseline.json`, which only shrinks.
- **Verses added, verbatim from the repo KJV:** Psalms 146:3; Proverbs 14:15. The issue's span scan now reads 100+ quoted spans.

## Impact

- **Unresolved:** World Issues teaches a reader to wait for the office, which is the very posture the course exists to correct. A family that reads the lesson on October 27 reads the state of October 22.
- **The call obligates:** every World Issues lesson from this date carries a dated "what is being said now" section with at least one word from the field; every `documented` fact rests on two distinct publishers or on the record itself (a source marked `primary`); the tutor carries the newest word and weighs an institution by its record. Earlier issues are improved as they are touched; the baseline makes each improvement permanent.
- **Latency / state:** none; the lint runs in the existing audit; the renderer adds one block.

## Decision

1. **The lesson carries the newest word, dated and named, from wherever it is being said**, with the standing of who says it — the field, the vendor, or an institution — so the reader weighs the word by the record. An institution's confirmation is welcomed when it comes and never waited on while the wall is being climbed.
2. **"Late" is kept apart from "false."** The lesson says plainly that catalogs trail by design, and does not infer concealment where the record shows none (`n-the-office-is-late-not-lying`).
3. **An institution's word is weighed by its record, never by its name.** The record is stated as documented fact under DR-0100 tier 1 — Tuskegee and the 2025 memo — in the lesson and in every band, with Psalms 146:3 and Proverbs 14:15.
4. **The gate:** `lintLatestNotOnlyInstitutions` holds every lesson researched from 2026-10-27, and any lesson that already carries a latest section, as errors; earlier lessons as warnings under a shrink-only baseline.
5. **Lesson 22 is whole:** two parables, the three talk-together directions in the lesson prose and in all four bands.

**re-review:** 2026-11-27 — bring the two most-read earlier issues up to the rule (a latest section, each documented item on two publishers or a primary record) and shrink the baseline.

## Verification

- `world-issues-class.test.js`: lesson 22 audits clean under the new lint; the lint **catches** a new lesson with no latest section, one whose latest section stands only on institutions, and a documented fact on one publisher's word (accepting two publishers or a primary record); an earlier lesson warns without failing the audit; a lesson that carries a latest section is held whole whatever its date; the baseline only shrinks.
- `world-issues-verse-integrity.test.js`: the latest section (≥5 items, ≥3 from the field, each dated 2026-10-27), `f-field-ahead-of-the-office` and `f-the-record-of-institutions` documented on ≥2 and ≥3 publishers, the teaching in the stewardship and every band, the child band free of the charged names, every quoted span verbatim.
- `lesson-completeness.test.js` (two stories), `talk-together.test.js` (three directions in the lesson and in child/youth/teen/senior): red before, green after.
- Lint clean on every touched file; the curriculum gate carries no decision-record ids in reader-facing text.

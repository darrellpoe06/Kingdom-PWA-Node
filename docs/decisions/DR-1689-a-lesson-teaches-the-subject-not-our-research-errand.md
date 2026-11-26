# DR-1689: A lesson teaches the subject, not our research errand

**Date:** 2026-11-26
**Status:** Accepted
**Tier:** A (lesson text, one gate, one shrink-only list; no schema)
**Type:** rule + gate
**Area:** Learn — every mounted course; `app/src/lib/process-language.js`, `app/src/lib/process-language-debt.json`, `app/src/__tests__/lessons-carry-no-process-language.test.js`
**Pairs with:** DR-0076 (never fabricate), DR-0100 (speak established fact), DR-1126 (the third pile is a worklist), DR-0236 (nothing waits)

## Context

Darrell, 2026-11-26: "I'm annoyed by lessons saying they didn't research!!!!" — then "How about old ones?!!!" — then "Not necessarily... just still gets it done..." Lessons were handing the reader our process: "we did not read the full article", "the video could not be fetched from the cloud", "recurly.com did not resolve on our network ... getaddrinfo ENOTFOUND", "cisa.gov was not fetched, so it is carried as search-verified". DR-0076's honesty had turned into a confession the reader never asked for, and the lesson stopped short of teaching what the record shows.

## What was measured

The principal's regex over the mounted catalog (catalog descriptors + Eternal Algorithms courses; honestNote, lesson, levels.*), 2026-11-26: 151 lessons, 414 sentences — sovereign-ai 56, living-lessons 52, project-management 4, development 3, datasystems 3, and 1–2 in eleven more courses. Triage (`docs/99-session-notes/2026-11-26-lessons-process-language-triage.md`) split them: teaching sentences that use the same words (the house doctrine "under-claiming a verified truth is as much a failure of truth as over-claiming an unverified one"; 1 Timothy 5:19's unverified accusation; a buyer's list of what remains unverified; a disputed attribution named as knowledge) stay. Process admissions are debt.

## Impact

A reader meets the subject, attributed to whoever made each claim, and no longer reads our errand. New lessons cannot ship it; the 118 still carrying it are a visible, shrink-only worklist.

## Decision

1. **Do the research, then state what the record shows.** Attribute each claim to the party that makes it. A genuine dispute is named with who holds it — knowledge, not an excuse. What cannot be supported after research is left out, silently.
2. **The reader never hears our errand** — what we read, fetched, reached, telephoned, or could not. Provenance lives in `sources` / `lesson-sources.json` and the runner witnesses, not in the prose.
3. **The gate.** `processLanguage()` scans every reader-facing field (honestNote, lesson, bigIdea, inApp, levels, benefits, quiz explains) sentence by sentence: PROCESS_RE (the principal's regex, widened by getaddrinfo / "could not be fetched" / "WHAT WE DID NOT CHECK" / "carried as search-verified") minus TEACHING_RE. A lesson not on the debt list that carries process language fails CI. Proven to catch six shipped shapes and to pass four teaching shapes.
4. **The ratchet.** `process-language-debt.json` lists the lessons carrying it on 2026-11-26, with a ceiling. Shrink-only: a cleaned lesson must come off the list, and the list never grows.
5. **Batches**, thinnest and most visible first, one PR each; each reports what was researched and what each lesson now says.

## Batch 1 (this PR) — 13 lessons closed

bank9, dsi15, dsi17, wm9, wm10, pm13, pm14, pm15, pm17, rto2, wi-the-way-was-45, mgmt9, legacy8 — each researched and rewritten; what each now says is in the triage note. wi-45's premise was reversed by the record (the 2026-09-01 Tarrant vote cut UTA's early-voting site) and it was rewritten whole. Test pins that REQUIRED the old not-checked wording now pin the sourcing and run `processLanguage()` on every band. Re-measured: debt list 118 lessons (sovereign-ai 62, living-lessons 51, pm 2, 1619 1, kingdom-economics 1, prophetic-voices 1 — includes lessons main landed today); third-pile GAP 39 → 34, CHECKED 6 → 7; Learn integrity baseline spliced for exactly the 13 lessons.

## Verification

The gate's proven-to-catch block (six process shapes named, four teaching shapes passed); every rewritten lesson's own test file runs `processLanguage()` on the adult text and every band; Learn integrity baseline spliced for exactly the changed lessons; third-pile pins re-measured; CI on the PR head. On merge: deploy run on main's head.

## Limits

- hr1 (the 1619 course) is built around Rolfe's letter being unreached. The record is now reached — Kingsbury, *Records of the Virginia Company of London*, vol. 3, p. 243, archive.org `recordsofvirgini03virg` ("He brought not any thing but 20. and odd Negroes, w<sup>ch</sup> the Governo<sup>r</sup> and Cape Marchant bought for victualls") — and its rewrite leads batch 2.
- sovereign-ai and living-lessons hold most of the debt; their videos go through the NAS caption route (`source-transcript-nas.yml`).
- pm15 keeps its approved title ("…and the video we never saw") so its approved cover stays live; the title and the cover's promo text still describe the video as unseen and wait on the Governor's re-review of that record.
- re-review: 2026-12-10 — the debt list's length, and whether TEACHING_RE has let a process sentence through.

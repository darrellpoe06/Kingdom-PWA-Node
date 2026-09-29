# DR-0666 — World Issues 19: The Student in the Gap — the 2026 College-Aid Changes, Counted by the Word

- **Status:** accepted
- **Tier:** B (a charged real-world claim, family-facing)
- **Type:** word
- **Date:** 2026-09-29
- **Scope:** `app/src/lib/world-issues-class.js` (`HIGHER_ED_AID_ISSUE`, `wi-higher-ed-aid-2026-and-the-student-in-the-gap`); `WORLD_ISSUES_META.weeks` +1; `app/src/__tests__/world-issues-verse-integrity.test.js` (Issue 19 section); `course-band-coverage-baseline.json` (total +1, world-issues +1) and its test pin; `learn-crosslist.test.js` total +1; `course-quotation-integrity` and `stage-reaches-reader` baselines +1. Shipped on its own branch, `claude/darrell-queued-lessons-d`.
- **Principles:** WORD-FIRST, SPEAK-ESTABLISHED-FACT, VERIFICATION-DOCTRINE, SPOKEN-TEACHINGS-ARE-BUILD-INPUT, ONE-TEACHING-ONE-LESSON, DECISION-RECORDS
- **Grounds:** DR-0100; DR-0076; DR-0407 (World Issues placement, and the 1965-tuition issue this sits beside); DR-0555.

## The report

Row `7eabab32-e50b-4fac-b227-89ba4c235435` (2026-09-29; Whisper transcript of voice row `2f56e4c9-c6dc-4d83-8d09-117db9bfb988`, rung `nas-cpu`, model `small`, 2:43, name tag "Darrell Poe"). **The words are a third party's**: a student organizer, not named in the recording, who travels to campuses and is rebuilding a national student association; Darrell played the clip into the app and added nothing. The speaker describes students dropped for unpaid balances, a senior crying over an 11,000 dollar gap, Pell losses under new rules, the order to close the Department of Education, a threat to the tax exemption of colleges that consider race, an accreditation overhaul and the American Bar Association review, and asks for support for the student association. Whisper's mishearings are rendered for meaning (higher education, bawling, voter registration). No gender or identity is assumed for the speaker; the test pins it.

## One teaching, one lesson

No lesson was built from these words. The nearest is World Issues 11 (DR-0407, college tuition and the 1965 Act), a different claim from a different source; issue 19 is about the 2025-2026 aid changes.

## Impact

Left unexamined, a passionate third-party clip would reach families either unverified or dismissed. Built, it separates the documented rules from testimony and from verdicts on motive, and points the church to the student in front of it. Several items are proposals that will change, which obligates a status re-review after the accreditation final rule and the tax-exemption comment period (re-review: 2026-11-15).

## The decision

**Placement: World Issues, issue 19** (a charged policy claim, DR-0407 precedent).

**DR-0100, applied (verified by live web search 2026-09-29, sources dated in the issue).**
1. *Stated plainly:* the 2025-07-04 law ends Graduate PLUS for new borrowers and caps Parent PLUS at 20,000 dollars a year and 65,000 total from 2026-07-01; for 2026-27 Pell ends at a Student Aid Index of twice the 7,395 dollar maximum and for students already fully funded, and Workforce Pell opens; Executive Order 14242 (2025-03-20) directs steps to close the Department to the extent the law allows; a proposed accreditation overhaul was published 2026-08-20; a Department staff report (August 2026) recommended against continued recognition of the ABA as an accreditor; Treasury and IRS proposed on 2026-09-03 to deny 501(c)(3) status to private schools that consider race in any program.
2. *Flagged narrowly:* the speaker's counts ("ten rules", "a hundred pages") were not confirmed; the individual students are testimony; three items were proposals when written.
3. *Opinion, labeled:* "an attack", "they did not care". The reform case is steelmanned (unlimited lending fed prices and debt).

The Word first: Proverbs 4:7 and Daniel 1:17 (learning honored), Luke 14:28-30 and Proverbs 24:27 (count the cost), Proverbs 22:7 and Romans 13:8 (the borrower), 1 John 3:17-18, Deuteronomy 15:8, Galatians 6:2, James 2:15-16, Acts 4:34 and 2 Kings 4:2 (the student in the gap), Proverbs 31:9 with Psalms 146:3 (plead for the poor, trust no prince), 1 Timothy 2:1-2 and Jeremiah 29:7 (pray for rulers). **re-review: 2026-11-15** — the accreditation final rule (targeted 2026-11-01) and the tax-exemption comment period (closes 2026-11-03); update the status lines.

## Verification

Fragments generated from the issue's own spans, verbatim against the repo KJV and present in the issue. Proven to catch: "counteth the price" (Luke 14:28) and "in deed and in spirit" (1 John 3:18) fail; separately, changing "counteth the cost" to "counteth the price" at its first occurrence in the course file failed the whole-issue span scan, and restoring it passed. `auditWorldIssues()` passes.

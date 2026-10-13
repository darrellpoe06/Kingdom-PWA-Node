# DR-0665 — World Issues 18: The Psychologists' Apology of 2021 — the Confession, the Wording, and the One Blood the Word Never Doubted

- **Status:** accepted
- **Tier:** B (a charged real-world claim, family-facing)
- **Type:** word
- **Date:** 2026-09-29
- **Scope:** `app/src/lib/world-issues-class.js` (`APA_APOLOGY_ISSUE`, `wi-apa-2021-apology-and-the-one-blood`; `WORLD_ISSUES_META.weeks` +1); `app/src/__tests__/world-issues-verse-integrity.test.js` (Issue 18 section); `course-band-coverage-baseline.json` (total +1, world-issues +1) and its test pin; `learn-crosslist.test.js` total +1; `course-quotation-integrity` and `stage-reaches-reader` baselines +1. Shipped on its own branch, `claude/darrell-queued-lessons-c`.
- **Principles:** WORD-FIRST, SPEAK-ESTABLISHED-FACT, VERIFICATION-DOCTRINE, SPOKEN-TEACHINGS-ARE-BUILD-INPUT, ONE-TEACHING-ONE-LESSON, DECISION-RECORDS
- **Grounds:** DR-0100 (three tiers); DR-0076 §8 (honest uncertainty, narrowly); DR-0407 (a charged transcript sent as "Lesson" goes to World Issues); DR-0555 (the provenance pattern).

## The report

Row `4a1a43b3-7de8-4cc8-8b9a-d451352f85cb` (2026-09-27; Whisper transcript of voice row `a53bcace-3dc9-43be-b22e-9ec077ec94fe`, rung `nas-cpu`, model `small`, 2:30, name tag "Darrell") and its typed twin `83dc69fc-d481-4192-966e-203baf4c19b0` (2026-09-28, "Darrell Poe"). Darrell reads a prepared text (author not named) about the American Psychological Association's October 2021 apology, which it quotes "word for word", then lists the first confessed falsehood (lower IQ, 1916 to the 1970s), and closes with his own question: why was the apology not as loud as what they told us? The recording stops before the promised biomarker evidence.

## One teaching, one lesson

No lesson was built from these words. The only APA mention in `app/src/lib` is an unrelated definition of evidence-based practice (`tlc-course-bodies/planning.js`).

## Impact

Left unexamined, a charged clip with a misquotation could travel under the app's name, and a true confession would be carried in words the institution never used. Built, the reader gets the confession stated plainly, the misquotation flagged narrowly, and the Word's standard for any apology. It obligates a re-review of the apa.org wording from a machine that can reach it (re-review: 2026-10-13).

## The decision

**Placement: World Issues, issue 18.** The four named placements were weighed: it is not a devotional lesson (it is a claim about an institution that must be checked), not health teaching, not project work. DR-0407 set the precedent that a charged real-world transcript sent as "Lesson" belongs in World Issues, whose audit gate requires labeled claims, dated sources and steelmanned perspectives. That is the shape this needs.

**DR-0100, applied.**
1. *Stated plainly:* on 2021-10-29 the APA Council of Representatives adopted "Apology to People of Color for APA's Role in Promoting, Perpetuating, and Failing to Challenge Racism, Racial Discrimination, and Human Hierarchy in U.S."; it says the APA "failed in its role leading the discipline of psychology, was complicit in contributing to systemic inequities, and hurt many through racism, racial discrimination, and denigration of people of color"; its own history names Terman's 1916 Stanford-Binet used to justify segregated schooling and Goddard's service on a committee recommending sterilization.
2. *Flagged narrowly:* the clip's "word for word" text is **not** the resolution's wording (different words, and addressed to people of color, not one community); its "returning resources" pledge was not found in any portion we could verify, stated as *not found in what we verified*, not *absent*; the 1970s end date is the clip's; the biomarker evidence never arrives and nothing is carried.
3. *Darrell's question* is carried as his opinion and answered by the Word's standard for a confession: forsaking (Proverbs 28:13), recompense with a fifth added (Numbers 5:7), fruit (Matthew 3:8), and the warning against healing a hurt "slightly" (Jeremiah 6:14).

**Verification limit, stated:** the brief asked for a WebFetch of apa.org. apa.org (and every other host tried: jbhe.com, wikipedia, odu.edu, ncbi) is **blocked by this environment's egress policy** (CONNECT 403). The wording above comes from search-engine excerpts of the apa.org policy page, the resolution PDF, the press release and the historical chronology, matched across two separate searches and one news report. The issue says so in `source.note` and `limits`, and tells the reader to read the resolution itself before quoting it. **re-review: 2026-10-13** — open apa.org/about/policy/racism-apology from a machine that can reach it and confirm the quoted sentences and the resources question word for word.

## Verification

Every Scripture fragment is generated from the issue's own `"..." (Ref)` spans into the test, checked verbatim against the repo KJV, and checked to appear in the issue. Proven to catch: "one race" for "one blood" (Acts 17:26) and "repeateth" for "forsaketh" (Proverbs 28:13) fail; separately, changing "one blood" to "one race" at its first occurrence in the course file failed the whole-issue span scan (every `"..." (Ref)` span in the issue checked against the verse it names; the fragment list alone did not catch a single tamper when the same words appear twice, which is why the scan was added), and restoring it passed. `auditWorldIssues()` passes (labeled claims, dated sources, four steelmanned perspectives, grace note naming every real person, accountability in both courts).

# DR-0664 — pm12: Titles and fruits — potential judged by the title, capability shown in outcomes, and the ownership that does not wait

- **Status:** accepted
- **Tier:** B
- **Type:** word
- **Date:** 2026-09-29
- **Scope:** `app/src/lib/project-management-course.js` (pm12, `pm12-titles-and-fruits-capability-shown-in-outcomes`; `PROJECT_MANAGEMENT_META.weeks` 11 → 12); `app/src/__tests__/project-management-pm12.test.js` (new); `course-band-coverage-baseline.json` (total +1, project-management 11 → 12) and its test pin; `learn-crosslist.test.js` total +1; `course-quotation-integrity` and `stage-reaches-reader` baselines +1. Shipped on its own branch, `claude/darrell-queued-lessons-b`.
- **Principles:** WORD-FIRST, VERIFICATION-DOCTRINE, SPOKEN-TEACHINGS-ARE-BUILD-INPUT, ONE-TEACHING-ONE-LESSON, DECISION-RECORDS
- **Grounds:** DR-0471 (the PM courses: the Word's case first, the industry's term as THEIR vocabulary); DR-0076; DR-0331.

## The report

Rows `a0309835-dc6b-4ee5-9c80-f32f8cb1966d` (2026-09-25, name tag "Darrell") and `f217103d-9c8c-429f-98c2-329f827ab0e6` (2026-09-28, "Darrell Poe") carry the same text twice. **The text is written as an assistant's reply to Darrell**, summarizing experiences he had described; the wording is the assistant's, the experience and the conclusion are his. Its thesis: potential is judged by titles, capability is shown in outcomes. His retail case: opened and stabilized several rent-to-own stores, P&L accountability, hired/trained/coached staff, multi-store data reviews, helped retrain other managers, one of the highest-performing stores in the market, named by his market manager for advancement, and the market-manager title never came. His conclusion, recorded in the reply: understanding that this is how it is drives him to ownership.

## One teaching, one lesson

No lesson in `app/src/lib` or `docs/decisions` was built from these words (searched "title", "capabilit", "rent-to-own", "outcomes"; the rent-to-own hits are the separate Rent-to-Own Business class, a different teaching).

## Impact

Left unbuilt, a real case from Darrell's own work, and the conclusion he drew from it, stays in an inbox. Built, the Project Management course gains the lesson it was missing: how capability is shown and read when the title has not come, taught from the Word's case first. It obligates discretion: the private parts of the text (a pending job, employer systems) stay out.

## The decision

**Placement: Project Management, pm12** (organization and hiring). The Word's case first: Saul screening David by category, "but a youth", and David answering with a record of outcomes credited to Yahweh (1 Samuel 17:33-37); Saul's armor refused, "for I have not proved them" (17:39); Samuel corrected, "man looketh on the outward appearance" (16:7); fruit (Matthew 7:16, 20; Proverbs 20:11); Joseph given charge by outcomes before any title (Genesis 39:3-4, 22); faithful in the least (Luke 16:10; 19:17); the poor wise man no one remembered (Ecclesiastes 9:15-16); ownership without a title (Proverbs 6:6-8; Nehemiah 1:11; 2:17; Colossians 3:23). The industry's names, competency-based assessment and PMBOK's stakeholder engagement, are named as their vocabulary.

**Left out on purpose:** the reply names a pending job opportunity and employer systems (Mosaic, TeamDynamix, Siemens). Those are private to Darrell's working life and not needed for the teaching; the test pins their absence. The transformation-project example is carried without the system's name.

## Verification

25 quoted fragments pinned verbatim against the repo KJV in `project-management-pm12.test.js`, and the whole module held by `project-management-courses.test.js` (every double-quoted span verbatim Scripture the module points at). Proven to catch: the test shows "not worn them" and "by their titles" fail against the real verses; separately, changing "I have not proved them" to "I have not tried them" in the course file failed `project-management-courses.test.js` (every double-quoted span verbatim Scripture), and restoring it passed.

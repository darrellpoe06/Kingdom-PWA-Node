# DR-0402 — The Word belongs in the sentence, not the margin; and a product push carries a record

- **Date:** 2026-09-14
- **Status:** accepted
- **Tier:** B (the lesson reading surface — the one people actually read — plus a delivery-lane guard)
- **Type:** orchestration
- **Covers, late and on purpose:** #1578, #1579, #1580 (see "The ledger gap" below)
- **Scope:** `app/src/components/ChurchLearn.jsx` (`LessonProse`, the paced Open block, the removed blocks), `app/src/components/LessonFlow.jsx`, `app/src/components/WordInline.jsx` (`prefix` + attribute pass-through), `app/src/lib/verse-refs.js` (`anchorIsRun`, `ANCHOR_RUN_MIN`), `scripts/decision-record-guard.mjs`, `app/package.json` (`ship`), `app/src/__tests__/the-word-is-in-the-sentence.test.jsx`, `app/src/__tests__/decision-record-guard.test.js`
- **Principles:** APP-IS-PRIMARY, VERIFICATION-DOCTRINE (DR-0076), MACHINERY-OVER-MEMORY (DR-0250), REALITY-TRACE (DR-0061), PERPETUAL-IMPROVEMENT (DR-0075), DECISION-RECORDS (DR-0011)

## The report

Darrell, 2026-09-14, over several hours, with screenshots of lesson 151 on his phone:

> "Notice how the older lesson didn't have a list of scriptures at the beginning of the lesson.. one or two with points and the full scripture they are discussing in context... then at the end of sections there are the 4 scriptures and a button up top that opens all of them together or closed them... fix it only that nothing more... just make the lessons that reference them do that not any lists inside at the beginning of the lessons without context anyways doesn't help us humans anyway!"

Then, with his phone's own text-selection menu open over a verse — offering "Ask Gemini" and "Web search" where our app should have opened the Word itself:

> "Show the Word in the sentences not in the margins!!!!!!!!! Obviously in context of the duscussions!!!!!!!!"

And, on two blocks that had appeared that day without being asked for:

> "Get RID OF QUESTIONS TO LIVE BY I NEVER ASKED FOR THAT.... THIS ISN'T WHAT WAS BEFORE THIS!!!!?????!!!!"

> "Send off was our final page!!!!!! When was that!!!!!???!!!"

> "We already had it solutions why can't you get it from our historical institution systems?"

> "Check all lanes today for when to get back to our Ways and documentation!!!!!!" · "I want our workflow back!!!!!!"

## What was actually wrong, traced rather than guessed

**1. The lesson body never opened the Word.** `LessonProse` (ChurchLearn.jsx) rendered each paragraph as `<p>{it.text}</p>` — plain text. So a sentence reading "Lamentations 3:22-23, written over a destroyed city, grounds the mercy in our not being consumed" named a reference and gave the reader nothing to press. `WordInline` had existed since 2026-09-08 (DR-0340/0341) and `EternalAlgorithmsStudy` had run its prose through it for weeks. The lesson body — the highest-traffic prose in the app — was the one surface never wired to it. **He is right that the solution already existed in our own institution; the defect was that it was never connected here.**

**2. The opener printed a bibliography.** A lesson's `anchor.ref` carries every reference the WHOLE lesson stands on. L151's names 41. Printed verbatim at the top of the Open block that is a wall of green semicolons standing between the reader and the teaching — an INDEX occupying a teaching slot, the same defect DR-0391 named for the reader's voice.

**3. Two blocks existed that were never asked for**, both added by the agent the same day:
- **"Questions to sit with — N"**, added 13:48 in `3c6271a2` (the L150 commit), rendered after the Send-off stage.
- **"The Word we stood on — N Scripture references"**, added 02:32 in `a56781ac`, at the foot of every lesson. Already removed at 16:27 by `2c257adf`.

Together those two are why **Send-off stopped being the final page.** Measured from git, not recalled.

## Decisions

**Decision 1 — the reference goes where the sentence names it.** `LessonProse` renders through `WordInline`. Every reference inside lesson prose is a control that opens the verbatim KJV directly beneath the paragraph — same card, same scroll position. Not one character of the author's prose changes; the chip shows his own words. This is DR-0340's promise finally kept on the lesson surface.

**Decision 2 — `WordInline` carries the caller's chrome instead of replacing it.** It gained a `prefix` slot and passes `data-*` / `tabIndex` / `id` straight through. This is load-bearing, not cosmetic: the numbered-section badge, the speaker index's `data-point-index` scroll target, the paragraph stepper's `data-para-index`, and the `tabIndex={-1}` a keyboard jump moves focus to would all have been silently dropped by a naive swap — trading one working surface for another, which is the exact class of mistake that bit three times this session.

**Decision 3 — a run of references is a list, and a list is not an opener.** `anchorIsRun(text)` is true at three or more references, reusing `referencesIn` (the one shared scanner) and the same threshold `collapseReferenceRuns` already uses for the voice (DR-0391 Decision 1: the rule is about RUNS, never about references). One or two still print with their point, which is the Prophets shape he pointed at. Three or more is dropped in favour of the theme it was supposed to introduce — and nothing is lost, because each of those references is named again inside the prose that discusses it, where Decision 1 now opens it.

**Decision 4 — Send-off is the final page again.** "Questions to sit with" is deleted. Nothing renders after the Send-off stage.

**Decision 5 — a product push carries a decision record, enforced by machinery.** `scripts/decision-record-guard.mjs` refuses `npm run ship` when the branch changes `app/src/`, `infra/` or `scripts/` and adds no file under `docs/decisions/`. It rides `ship` rather than CI for the same reason the push-stranding guard does (DR-0393): CI runs on a branch whose base may be shallow, and "did this session write down why" belongs at the moment of pushing, while the author is still there to answer. Unknown is never green — no base, no git, no network exits 2 with a plain sentence.

## The ledger gap this record closes

Audited across all thirteen merges of 2026-09-14. Ten carry a record: #1567→DR-0392, #1568→DR-0393, #1570→DR-0394, #1571→DR-0395, #1573→DR-0396, #1574→DR-0397, #1575→DR-0398, #1576→DR-0399, #1577→DR-0400, #1569→DR-0401. **Three do not: #1578 (18:32, the paced step view wired to WordInline — the change that put the chip wall on his lessons), #1579 (19:19, L151), #1580 (20:01, the revert).** Every one of the three is a Tier-B change to the lesson reading surface, shipped inside two hours with no record, no `hold`, and no Ways review.

The cause is not a mystery and was not new: the INDEX's own ledger-drift finding of **2026-09-13** wrote it down — *"a run of fast merges in one session with no gate requiring a DR for a Tier-B change"* — and it recurred the next day. A finding written in prose is not a safeguard. Decision 5 is the gate that finding asked for and did not get.

This record covers the three merges rather than backfilling three separate ones: they are one continuous episode on one surface, and DR-0011's one-decision-per-file is served better by the true shape than by three reconstructions.

## Verification

- **Proven-to-catch, both halves.** `the-word-is-in-the-sentence.test.jsx`: its two central assertions were run against the previous render and both FAILED — no control existed anywhere in the body, and the opener printed all 41 references. `decision-record-guard.mjs` was run against the real push it was written for and **refused it**, naming the four product files and no record — not a synthetic case chosen because it passes (the sharpening DR-0393 put on DR-0076 §3).
- **Measured, not claimed.** L151's anchor holds 41 distinct references (`referencesIn`), > 20 asserted. The real L151 senior body renders > 10 controls, asserted against the corpus rather than a fixture.
- Full suite green before push: **990 files, 14,812 passed, 1 skipped.**

## Limits, stated

- The guard checks that a record EXISTS, not that it is true or that the tier is right. A one-line file would satisfy it. It closes the silence, not the judgment — the judgment stays with the governor.
- It protects `npm run ship`, not a hand `git push`; no hooks are installed.
- `anchorIsRun`'s threshold is 3 because that is what the voice already uses. If the right number for the page turns out to be 2, it is one constant in one file.
- **The Word opening inside the sentence is the one thing this adds rather than restores.** He asked for it twice in his own words; if he wants it held, it is one line at each of two call sites.
- Not done here, and named rather than quietly dropped: the per-section "4 scriptures with a button up top that opens them together or closed" from his Prophets screenshot. `ShowTheWordToggle` is app-wide today, not per-section. **re-review: 2026-09-21.**

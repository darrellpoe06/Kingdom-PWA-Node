# DR-0479 — L83's keep-thy-heart drained, and an ellipsis chain through the Test itself

- **Status:** accepted
- **Tier:** B (a learner-facing lesson at every age band, and a repair to the house's own Test as quoted to readers)
- **Date:** 2026-09-18
- **Type:** content
- **Scope:** `app/src/lib/living-lessons-class.js` (L83's four bands rewritten, youth created, seven elisions healed across four reader-facing fields, series quotations merged), `app/src/__tests__/living-lessons-l83-verses.test.js` (5 → 39 checks, one eight-word marker check deleted), all four shrink-only baselines (three shrank)
- **Principles:** EVERY-BAND-IS-THE-WHOLE-MESSAGE (DR-0418), VERIFICATION-DOCTRINE (DR-0076 §3, §4), WORD-FIRST (DR-0097), THE-TEST (MIND-OF-CHRIST), PERPETUAL-IMPROVEMENT (DR-0075)
- **Grounds:** DR-0473 (the quotation ratchet), DR-0476 (weak alternation branches), DR-0478 (a claim you cannot attribute), DR-0459 (no elision inside a quotation)

## Why this exists

| band | before | floor | after |
|---|---|---|---|
| child | 159 words, **0.32** | 0.50 | 642 words, **1.30** |
| youth | **absent entirely** | 0.60 | 559 words, **1.13** |
| teen | 273 words, **0.55** | 0.60 | 552 words, **1.12** |
| senior | 361 words, 0.73 (above floor) | 0.60 | 681 words, **1.38** |

And the senior band read at **FK 16.97** — post-graduate — against an adult lesson at 5.14. That is the worst register mismatch found anywhere in this pass. Ladder now **2.89 / 4.96 / 5.71 / 8.13**.

## The decision

### a. AN ELLIPSIS CHAIN THROUGH THE TEST ITSELF

Of the seven elisions, one was in a class of its own:

> "whatsoever things are true... honest... just... pure... lovely... of good report... think on these things"

That is Philippians 4:8, and **this house calls that sequence the Test** — the eight-question filter named in `MIND-OF-CHRIST.md` and bound in Layer 0. An ellipsis chain through it does not shorten a quotation; it **destroys the sequence the lesson exists to teach**. Six ellipses had reduced eight questions to a list of adjectives, and both the *virtue* and the *praise* clauses had gone missing entirely — which means a reader running the Test from this lesson was running six of eight questions and did not know it.

All four bands and both prose fields now carry the verse whole, and a check requires the complete span in six places.

The other elisions: James 1:21 had lost *"all filthiness and superfluity of naughtiness"* — the thing being laid apart; 2 Timothy 2:15 had lost *"a workman that needeth not to be ashamed"*; and Proverbs 2:4-5 had been cut through the middle of its conditional in two bands, which is the one thing that verse is cited **for**.

### b. SERIES QUOTATIONS MERGED, WHICH GAVE BACK MORE OF HIS WORDS

Seven spans were unreferenced because a series shared one trailing reference: three armour fragments under one Ephesians citation, and a Psalm 1 phrase split around our own prose. Merging each series into one contiguous quotation fixed the attribution **and** handed the reader the whole sentence — the armour quotation gained *"wherewith ye shall be able to quench all the fiery darts of the wicked"*, and Psalm 1 gained *"that bringeth forth his fruit in his season"*.

### c. THE EIGHT-WORD MARKER CHECK, DELETED

L83's gate claimed to verify "the two halves Darrell asked for" by searching the whole serialised module, lowercased, for eight single words: `guard`, `gate`, `garrison`, `before`, `after`, `condition`, `discuss`, `grow`. Six of those are words this lesson's prose could not avoid; `grow` is a substring of `growth`; and the scope was the entire module so any one field answered for all eight. **It could not have failed on any lesson that mentioned its own subject once.** Deleted, and the two halves are now checked as claims, per band.

## The finding

**I WROTE THE RULE IN DR-0478 AND THEN BROKE IT THREE TIMES IN THE NEXT LESSON.** 38 breaks ran; 35 caught first time. The three that did not were:

- **One real weak branch, and it is the same species twice over.** The growth-is-conditioned check accepted `/conditions of growth/` — but that phrase is in L83's **title**, and every band opens by naming its own lesson, so the naming line answered for the claim. DR-0476 recorded exactly this with the word "inspiration" in L86's opening. Two lessons apart, the same defect from the same cause: **a title keyword is not available as evidence for a claim, because the title is in every band by construction.**
- **Two multi-claim tests** — growth-conditioned paired with the if/then shape, and blessed-in-his-deed paired with excluding the merely-moved hearer. Both breaks failed the gate on the right band and reported as the wrong test. This is precisely the finding DR-0478 recorded hours earlier, written up as a general rule, and then not applied when writing the next gate. A third such pair (soldier's-word + divides-the-labour) was found by reading the test names for the word "and", which turns out to be a reliable tell. All three split into six.

The honest reading: recording a finding is not the same as installing it. Three of tonight's gates would have carried the same defect if the harness had not re-found it. The generalisable rule, now stated so it can be applied rather than recalled: **a test name containing "and" is carrying two claims, and a claim whose evidence could come from the title has no evidence at all.**

## Evidence

- Fullness: `shortBands` returns `[]`; shares 1.30 / 1.13 / 1.12 / 1.38.
- Reading: ladder 2.89 / 4.96 / 5.71 / 8.13, monotone; child under the 7.0 ceiling; senior down from 16.97.
- Quotations: **90 quoted spans across the four bands, every one verbatim under strict comparison, 0 unreferenced, 0 ellipses**; the ratchet reports L83 with `elided: []` and `recited: []`.
- The covenant name: Yahweh in every band's own prose (5 / 3 / 3 / 3), 0 generic uses in our own voice in any reader field, with 2 Timothy 2:15's *"unto God"* and Ephesians 6:17's *"the word of God"* pinned letter-for-letter.
- Sections: all four bands render `[1,2,3,4,5]`, no chunk over the 420-character wall limit.
- Break harness: **38 / 38 caught** after the fixes (35 first time, 4 on re-run, one break superseded).
- Baselines: short **83 → 82**, title-unnamed **149 → 148** (bands 449 → 446), quotation **108 → 107** lessons, 0 fresh and 4 healed. None gained an entry.
- Gate: 39 checks, up from 5.

## Consequences

- The full-levels pass has **82** lessons left carrying a short band. Next is L82, downward.
- The DR-0473 elision debt is at 107 lessons, still under its own `re-review: 2026-11-18`.
- **Worth a sweep of its own, not deferred silently:** if Philippians 4:8 was elided here, the Test may be elided elsewhere in the corpus. That is a specific, machine-checkable question rather than a vague worry — **re-review: 2026-09-25**, with the check being a corpus-wide search for any partial quotation of Philippians 4:8. It is not done tonight because it is a separate pass with its own findings, and stacking it onto a lesson commit would bury it.
- L83's anchor list still names only Proverbs 4:23 while the bands now teach from nineteen references. Same deferral as L89, L88, L86, L85 and L84 — **re-review: 2026-10-24**.

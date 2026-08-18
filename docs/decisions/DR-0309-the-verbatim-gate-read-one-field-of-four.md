---
id: DR-0309
title: The verbatim gate claimed every quoted Scripture and read one field of thirteen — the child band was the least-gated prose in the repository
date: 2026-08-15
status: accepted
supersedes: []
superseded-by: null
amends: []
tier: B
entities: [poetech, church]
grounds: [VERIFICATION-DOCTRINE, MACHINERY-OVER-MEMORY, WORD-FIRST, COMPREHENSIVE-REVIEW-STANDARD, PERPETUAL-IMPROVEMENT]
source: 2026-08-15 session — found while building L79 from the Hugh Ross / Fuz Rana / Taylor Welch video, by running DR-0219's first step on our own gate instead of on the lesson.
---

## Context

L79 was being built from a captured video teaching, and the last step before
shipping a captured lesson is joining it to `VERBATIM_GATED` in
`app/src/__tests__/living-lessons-l68-verses.test.js`. Before joining it, I read
what that gate actually does rather than what its header says it does — DR-0219,
SHOULD then ARE, applied to our own instrument.

## What the gate says, and what it does

**SHOULD.** The file opens (`living-lessons-l68-verses.test.js:3`) with:

> Captured-teaching lessons — every quoted Scripture is KJV-VERBATIM (DR-0076).

Unqualified. Every quoted Scripture.

**ARE.** Line 70: `for (const match of mod.lesson.matchAll(RE))`. It reads
`mod.lesson`. One field.

**GAP.** A lesson module carries thirteen audience-facing prose fields:
`bigIdea`, `inApp`, `benefits[]`, `anchor.theme`, `levels.child`, `levels.teen`,
`levels.senior`, every quiz `q` / `options[]` / `explain`, and the facilitator's
`talkingPoints[]`, `howToRun` and `discussionPrompts[]`. All of them quote
Scripture. None of them was ever checked.

**Measured, not estimated** (DR-0076 §4): **3,363** referenced quotes live
outside `mod.lesson`, and **556 sites do not match the corpus.**

The sharpest edge of it: `levels.child` was the least-gated prose in the
repository, and it is the band that gets read to children.

## The four classes, counted

They are counted separately because they need four different remedies, and
lumping them into one number would hide that.

| count | class | what it is |
|---|---|---|
| 352 | `case-only` | a mid-verse word capitalized because our sentence started there — "A just man falleth seven times" for the KJV's "For a just man falleth..." |
| 108 | `emphasis-inside-quote` | our ALL-CAPS emphasis placed inside the quotation marks — "I GIVE unto you power" (Luke 10:19) |
| 104 | `wording-differs` | the words differ. Many are deliberate reader-aids — a bracketed gloss ("charity [love]", "the outward man perish[es]") or a child-band paraphrase carrying a reference ("I'm coming back!"). Others are real slips — "declares the end from the beginning" for "Declaring", "perfect love casts out fear" for "casteth" |
| 14 | `unresolved-reference` | a citation the corpus cannot resolve at all |

The 108 are the most serious in principle, and they are the class this house has
already been burned by: **our emphasis wearing the Word's quotation marks.** A
reader cannot tell which capitals are ours. DR-0210's bright line runs the same
direction — the inside of a quotation is not ours to edit, in either direction.

## Decision

1. **`scripts/lesson-quote-guard.mjs` gates all thirteen fields**, as a
   **ratchet**: today's 556 sites are frozen in `scripts/lesson-quote-baseline.json`,
   a NEW altered quote fails the build, and repairing an old one must shrink the
   baseline (shrink-only, the shape of `unbounded-select-baseline.json` and
   `monolith-budget.json`).

2. **No sweep.** A blind find-replace through quoted Scripture is exactly the
   move DR-0210 forbids, and it is how a "fix" corrupts a text. The
   bracketed-gloss convention is a genuine editorial question for the SME, not
   something a script decides.

3. **Proven-to-catch** (DR-0076 §3). `--selftest` injects a fresh defect of each
   of the five outcomes into real prose and requires a catch; a sixth assertion
   requires the field list itself to stay wide, so the gate cannot silently
   narrow back to one field. Verified additionally against the live file: a
   single injected `HONOUR` inside a Proverbs 25:2 quote produced
   `FAIL … NEW altered quote (emphasis-inside-quote)` and exit 1.

4. **New work carries no debt.** L79 is clean in every one of the thirteen
   fields, and a test pins that specifically. The one defect L79 shipped with —
   my own `WITHOUT EXCUSE` inside a Romans 1:20 quote in `benefits[0]` — was
   caught by this guard within minutes of writing it, and the emphasis moved
   outside the quotation marks where it belongs.

## Why this is the same failure as the one before it

This is the third instance of one pattern, and naming it is the point:

- DR-0303: the query pulled every column a table would *ever* have.
- DR-0281: the gate checked quoting and never checked reasoning.
- Here: the gate's *claim* was wide and its *reach* was narrow.

In each case the instrument was trusted for a property it never measured, and
nothing objected, because nothing was looking. **A green check must mean what it
says it means** — so the standing question when adding any gate is not "does it
pass?" but "what, exactly, does it read?"

## Re-review

- `re-review: 2026-09-15` — the 108 `emphasis-inside-quote` sites. Highest
  priority: it is our voice inside His quotation marks, and the repair is
  mechanical per-site (move the capitals outside) without touching a word.
- `re-review: 2026-10-15` — the 14 `unresolved-reference` sites. Small, and each
  is either a typo or a citation pointing at nothing.
- `re-review: 2026-11-15` — the 104 `wording-differs` sites, which need the SME
  first: is the bracketed gloss an accepted convention (and if so, does it move
  outside the quotation marks), and is a child-band paraphrase allowed to carry a
  bare reference or must it be marked as a paraphrase per the standing
  translation rule?
- `re-review: 2027-02-15` — the 352 `case-only` sites, last because they are the
  least misleading and the most numerous; likeliest remedy is a house convention
  ("open the sentence outside the quote") applied as lessons are next touched,
  not a campaign.

## Files

- `scripts/lesson-quote-guard.mjs` — the guard (`--list`, `--classes`, `--write`, `--selftest`)
- `scripts/lesson-quote-baseline.json` — 556 grandfathered sites, shrink-only
- `app/src/__tests__/lesson-quotes-outside-the-lesson-field.test.js` — 5 pins
- `.github/workflows/ci.yml` — guard + selftest run each push
- `app/src/__tests__/living-lessons-l68-verses.test.js` — L79 joined at row 78

# 2026-11-06 — a forward-safety case may not name the number

Narrative for **[DR-1363](../decisions/DR-1363-a-forward-safe-case-may-not-name-the-number-it-simulates.md)**.

## The report that started it

The pm15 builder finished, said plainly that it had **no merge SHA** and would not report one that did not exist, and named the single red blocking #2567:

> `app/src/__tests__/project-management-pm14-verses.test.js:198`, in the case named *"PROVEN-TO-BE-FORWARD-SAFE: a pm15 landing does not break this gate (DR-1316)"*, appends the **literal `15`**. With a real pm15 the list becomes `[1..15, 15]` and contiguity fails.

It measured both sides, left the tree byte-identical, and did not edit a neighbour's gate because the brief told it not to. That was the right call and it is why the fix took one minute instead of an argument.

## The shape of the defect

DR-1316 said a lesson gate may not claim to be the last lesson. The repair that followed is a forward-safety case: pretend the next lesson has landed, and assert every surviving claim still holds. Good case. Written three times, and twice it named the number it was pretending about:

1. **pm13** appended the literal `14`.
2. **pm14** found that, repaired it in pm13's file with `PROJECT_MANAGEMENT_MODULES.length + 1` — and then hardcoded `15` in its own case. The comment above it says, in its own words, that a hardcoded guess at which lesson comes next *"is the very class of claim-about-what-does-not-exist-yet that this file was rewritten to remove."* Four lines later it did it.
3. **pm15 landed** and #2567 went red on that literal.

A literal is true the day it is written and false on exactly the day the case exists to cover. The case cannot catch what it is for. Three sessions wrote the convention down; the honest conclusion is that a fourth will not read it.

## What I changed, and the two things it taught me about my own scanner

The guard looks for a narrow thing: a line that spreads a course's own `*MODULES` list through `.map(` and then appends a bare integer before the closing bracket. Derived forms all pass — `length + 1`, `nums.length + 1`, a variable, a `Math.max` — because none of them names a number.

**It flagged four of its own fixtures on the first run.** The case file has to hold the defective line verbatim; that is how it proves it catches. A scanner that cannot tell code from a quotation of code reports the test that proves it works as the thing it forbids. So quoted spans are blanked along with whole-line comments: a quotation of code is data. This is the third time in two days that a scanner of mine has read prose as code — the first matched the word "trash" inside a workflow comment promising it never trashes anything.

**And one of my cases asserted about the environment again.** It read pm15's gate file, which is not on `main` because pm15 has not merged. Same fault I had corrected forty minutes earlier in `claim-decision-number`'s cases, where three went red in CI for assuming an `origin/main` ref exists. It now reads whichever of pm13/pm14/pm15 is present and requires at least the two that are landed. Twice in one hour is not a coincidence; it is a habit, and the habit is writing the case against the tree in front of me instead of against the tree CI will have.

## The three lines of YAML

`verify-covers-ci-guards.test.js` refuses a guard that exists in `scripts/` and never runs in CI — a guard CI never runs is not a guard (DR-0076 §3) — so the step had to go in `ci.yml`, and the workflow line ratchet (DR-1342) is a ceiling that only goes down. It was at the measured total exactly, so three lines needed a hand-written raise with a reason, which is the mechanism DR-1342 provides. The narrative is here and in the guard's own header; the YAML got two comment lines and one `- run:`.

## Measured

- pm14 as shipped: **42/43**. With the derived form: pm13 + pm14 + pm15 **129/129** together.
- Guard green across **1,358 test files**; red (exit 1, naming `:206`) with the literal restored; file restored byte-identical under `cmp`.
- The known limit — only whole-line comments are blanked, so a trailing `//` of this exact shape would read as code — measured across every test file: **0 occurrences**, pinned by a case so it stops being theoretical the moment it isn't. `re-review: 2026-12-06`.

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

---

## Amended hours later: the class recurred twice, and only one half was gateable

The guard shipped catching one shape. By the evening the same class had surfaced twice more, and the useful part is that the two cases came out opposite ways.

### `repo-documents.test.js` — not gateable, and I measured before concluding that

It pinned `expect(drs[0].path).toMatch(/^docs\/decisions\/DR-1360-/)`, which asserts DR-1360 is the newest record on disk. #2571 (DR-1363) and #2574 (DR-1365) both went red on it inside the hour, and the sov71 builder's reading was sharper than mine: **DR-1364 was simply the first record to land above 1360**, and spm11 slipped past only because 1358 < 1360. The PR is the messenger, not the cause.

I wanted a detector. Measured it first:

```
lines matching `[0]` beside a literal DR-NNNN: 15
of those, correct (asserting on their own fixtures):  14
```

Fourteen of fifteen are right — `DR-1139-theirs.md`, `DR-1340-x.md`, `DR-9001`, `DR-1122` — synthetic data where the literal **is** the fixture's value. A regex cannot tell fixture data from a live-repo read, and a scanner crying wolf fourteen times is worse than the comment that now stands in its place. **So: fixed by hand on three branches, no gate, and the reason written where it happened.**

### `software-pm-spm11-verses.test.js` — gateable, and scoped by the same kind of measurement

It pinned `SOFTWARE_PM_MODULES.length === 11` and spm11 as last, inside **spm11's own gate**. The spm12 builder hit it, and argued the call rather than just making it:

> neither claim was ever a property of spm11. Both assert that nothing will ever follow it, which only a twelfth lesson can falsify — so there is no way to deliver the assignment you gave me without that line changing.

That reasoning is right, and the instruction it weighed against ("report a neighbour's gate, do not edit it") was aimed at an *unrelated* red, not at the mechanical consequence of the assignment. It read the distinction correctly.

Before adding a detector I measured the blast radius, because an hour earlier (DR-1368) I had nearly shipped a gate that would have refused seven landed lessons:

```
gates pinning a MODULES length:                8
 of those, in a per-lesson *-verses file:      1   <- the one that broke
 of those, in a course-level gate:             7   <- "this finished course has 8 lessons" — true
```

So the rule is **scoped to per-lesson gates** and has zero false positives. A per-lesson gate has no business claiming the course's size; it asserts its own index and that the length never shrinks, and the total belongs to the course-level gate.

### Four instances, three shapes, one claim

pm13's literal `14`. pm14's literal `15`. `repo-documents`' literal `DR-1360`. spm11's `length === 11`. Every one says *nothing will ever follow this*, and every one was true on the day it was written. Two are now machinery; one is a comment, because measuring said a gate there would do more harm than the defect.

Proven to catch, by exit code rather than by reading the output: with the literal restored the guard exits **1** and names `software-pm-spm11-verses.test.js:160`, the list and the number, and **2 cases** go red. Restored byte-identical under `cmp`, guard back to exit **0**. I checked the exit code deliberately — earlier in the same hour I had reported `exit=0` that was `head`'s exit and not the guard's, which is the same false read I had just flagged in a builder's watcher.

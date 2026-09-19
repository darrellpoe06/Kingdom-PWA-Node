# DR-0520 — The numbers belong to the lesson, not to the step on screen

- **Status:** accepted
- **Date:** 2026-09-19
- **Type:** defect
- **Relates to:** DR-0380 (the speaker's index), DR-0497 (the renderer window that silently dropped headings)

## What Darrell said, twice

First, on 2026-09-18, with a screenshot of L88 (The Four Soils):

> "This Lesson has numbers that are confusing... 1 2 3 throughout... why? It's needs a better why to identify the points for all lessons... make a number of points and keep it consistent..."

Then, on 2026-09-19, with two screenshots of L175 open on his phone:

> "Stop adding numbers that don't make sense!!!!!!! Make it make sense!!!!!!! Why do we count from 1 - whatever each section?!!!!!!!"

> "Obvious!!!!!!!!!!!!!!!!!!!!!"

It was obvious, it was on the screen, and it had already been raised once and not fixed. That is the part of this record worth keeping.

## What the screenshots show

- **STEP 1 OF 13** — headings numbered **1**, **2**, **3**.
- **STEP 2 OF 13** — a heading numbered **1**.
- **STEP 3 OF 13** — headings numbered **1**, then **2**.

Three different points visible on one scroll, all called **1**.

## The cause, which is mechanical and not authorial

`AgePacedLesson` chunks a band into developmentally-sized steps and rendered each one through its own `<LessonProse text={segment} />`, which called `formatLessonText` **once per step**. Two pieces of state that belong to the lesson were therefore computed per chunk and reset at every step boundary:

1. the `auto` counter that numbers headings — so every step restarted at 1;
2. the `hasExplicit` decision — so a step containing an author marker (`FIRST`, `II.`, `SOIL 3`) used the author's numbers while its neighbours auto-counted, which is how one screen produced 1, 2, 3 and then 1.

## The fix

`lessonSectionPlan(fullText)` computes the numbering **once** over the whole band text and is the single source of truth for which sentences are headings and what number each carries. `formatLessonText(text, plan)` takes it and every step continues the lesson's count. `AgePacedLesson` derives the plan from `segments.join(' ')` — from the segments themselves, so the count can never describe text the reader is not being shown — and passes it to all three render paths (read-along, single-segment, stepper).

A caller with one whole text passes nothing and the text plans itself, so `lessonShareText`, `lessonPoints` and every single-text render behave exactly as before.

**The match is a PREFIX match, not equality.** The pacer cuts by word count and can land inside a sentence: measured on ll94's youth band, two headings carry a quotation whose closing `. "` reads like a sentence end, so the chunk held only the opening fragment and an equality match dropped the number entirely — the reader saw 6 and then 8. The fragment that *starts* a heading is where the badge belongs; the remainder lands in the next step as ordinary prose, and the cursor has already moved past it so it can never take a second number.

**Not one word of any lesson changes.** The formatter only chooses break points at existing spaces and decides which number is rendered beside a heading the author already wrote. Two checks hold that line: the join-reconstruction is asserted with and without a plan, and no heading text may be anything other than a span the chunk already contained.

## Measured, on the live lesson from the screenshots (ll176 adult, 13 segments)

**Before** — `step:n`:
```
1:1  1:2  1:3  2:1  3:1  3:2  4:1  5:1  6:1  7:1  8:1  9:1  10:1  11:1  12:1  12:2
```

**After**:
```
1:1  1:2  1:3  2:4  3:5  3:6  4:7  5:8  5:9  6:10  7:11  8:12  9:13  10:14  11:15  12:16  12:17
```

The after-count also gains a heading (`5:9`), which is the boundary defect above being fixed at the same time.

## Gate

`app/src/__tests__/the-points-are-numbered-once-per-lesson.test.js` — **9 checks**, run across **every lesson and every band** in the series, not a sample:

- **Proven-to-catch (DR-0076 §3):** the first check reproduces the photographed defect from the live lesson and *requires* per-chunk numbering to still restart. If a future change made chunk-local numbering continuous by accident, that check fails and says the gate is measuring nothing.
- No band of any lesson renders the same point number twice.
- The numbers a reader sees are the lesson's own plan, in order, **with nothing skipped** — which is the check that caught the prefix-match defect above.
- The reconstruction holds with and without a plan; a plan changes a number and never a word.
- Single-text callers are unaffected; empty and non-string input stay inert.

## One case recorded rather than silently exempted

**ll23 (The Blessed Hope) writes `FIRST` twice** — once opening a top-level point and once opening a sub-list inside it — so its authored plan genuinely reads 1, 1, 2. Where the author numbered their own points, the numbers are theirs (the prior decision that keeps 31 already-numbered lessons rendering byte-identically), and rewriting them would change a lesson's own structure, which this change is not permitted to do. So the duplicate-number gate skips explicit-marker lessons, and the case is written down here instead of disappearing into a `continue`. The reader-facing question — whether a nested `FIRST` should render as a sub-number rather than a second 1 — is real and is not answered here. `re-review: 2026-09-26`.

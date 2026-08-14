---
id: DR-0301
title: Read-along reads the whole core, not step 1 of 4 — and a test that cannot fail is theatre
date: 2026-08-13
status: accepted
supersedes: []
superseded-by: null
amends: [DR-0299]
tier: A
entities: [church]
grounds: [COMMUNITY-FIRST, VERIFICATION-DOCTRINE, MACHINERY-OVER-MEMORY, PERPETUAL-IMPROVEMENT]
source: 2026-08-13 session — Darrell, watching the reader run on Session 8 of 8: "Improved... however only part 1 of the core is taught or read by the reader... fix it... I want to hear the whole lesson and course from one play action from our users... almost..."
---

## Context

DR-0299 stopped the reader speaking the buttons and pressing the palette open.
With that cleared, Darrell listened to an actual lesson and found the next
thing: the reader worked through the arc but the **core itself was one chunk of
four**.

## Where the truncation actually was

Not where it looks, and the distinction is the whole lesson of this record.

**The spoken text was never short.** `readAloudTextFromArc` has always pushed
`lessonPlan.segments` in full (`lesson-flow.js:268`) — every step of the core.
The reader does not read that text when it can map the named ELEMENT instead:
follow-along works by alignment-by-construction, so **the DOM is the reading**.
And the DOM held one step.

`showAll` already existed for read-along and already opened every ARC STAGE —
Open, Teach, Engage, Apply, Send-off — which is exactly why the later stages
were visible in his screenshot while the core still said "STEP 2 OF 4". **The
reveal stopped one level short.** The Teach stage's paced steps live in
`AgePacedLesson`, which rendered `segments[cur]` regardless and had no `showAll`
prop at all.

## Decision

1. **In read-along the whole core renders, in order, with its step markers
   kept** so the listener still hears where they are.
2. **Outside read-along the stepper is untouched.** The pacing exists for a
   READER who chooses when to turn the page; a LISTENER cannot. Neither mode is
   allowed to impose itself on the other, and the paging controls disappear only
   while reading.
3. **`AgePacedLesson` is exported** so the thing that broke is directly
   testable. See below — this was not a convenience.

## A test that cannot fail is theatre (the part worth keeping)

The first version of this test **passed, and proved nothing.** It mounted the
whole `ChurchLearn` tree on a Healthy Living lesson. That course paces to a
SINGLE adult segment, so no stepper rendered, the `Step n of N` guard matched
nothing, and three assertions returned early having asserted nothing at all.

It was caught only because the green was distrusted enough to probe whether the
guard actually fired. It had not.

Retargeting to a course that genuinely chunks (`living-lessons`, 4 adult steps,
measured across 120 such lessons) **still missed** — Darrell's screenshot is a
COHORT SESSION view, and which paced core mounts depends on which course/session
path renders. An assertion whose subject depends on that much scaffolding is a
coin flip, not a guard.

So the paced core is rendered DIRECTLY with a real four-step plan. **The thing
that broke is the thing under test, and it cannot pass by accident.** A separate
case pins that the catalog really does produce multi-step cores, so the fixture
is known to model something real rather than being invented to go green.

This is the same failure as the bug it was chasing: something that looked
complete while the part that mattered was absent.

## Proven-to-catch (DR-0076 §3)

The `showAll` branch removed → **4 of 9 fail**. The without-read-along case
("only the current step is in the DOM") passes throughout, so the fix did not
flatten the reader's pacing. 9 pins; suite 7,761 green; lint clean; build clean.

## Consequences

- One press of play carries a listener through the entire core of a lesson.
- Follow-along highlighting can reach every step, because every step exists.

## Honest remainder

- **The course-boundary half is unproven.** `next()` already advances to the
  following lesson and the reader reports "KEEPS GOING", so lesson→lesson is
  expected to work now that the core no longer truncates — but only the
  WITHIN-lesson half is pinned by a test. Darrell's "almost" is exactly this
  gap. **re-review: 2026-08-20.**
- The reveal is now correct at two levels (stage, then paced step). Nothing
  guarantees a THIRD nested pager would be caught; the pattern that keeps
  biting is a reveal that stops one level above the content. A derived check —
  every component holding an index into an array of authored text accepts
  `showAll` — would close the class rather than this instance. Not built.
  **re-review: 2026-08-27.**

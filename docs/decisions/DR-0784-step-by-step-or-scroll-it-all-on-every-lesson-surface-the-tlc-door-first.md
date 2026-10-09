# DR-0784 — Step by step, or scroll it all, on every lesson surface; the TLC door first

- **Status:** accepted
- **Tier:** A (one switch moved into the shared lesson flow; the Learn guide keeps its own; the device-wide choice unchanged)
- **Type:** fix
- **Date:** 2026-10-07
- **Scope:** `app/src/components/LessonFlow.jsx` (`LessonFlowAudience` gains `flowSwitch` and reads `useFlowMode`), `app/src/components/ChurchLearn.jsx` (`flowSwitch={false}`: it renders its own), `app/src/__tests__/lesson-flow-scroll-on-every-surface.test.jsx`
- **Principles:** DR-0749 (step by step or scroll it all, the reader's own choice), DR-0219 (SHOULD / ARE / GAPS / CLOSE), DR-0075
- **Grounds:** Christina, through Darrell 2026-10-07: *"Tlctherapysolutions App needs full scrolling for lessons according to the wife... fix it"*; Darrell the same hour: *"the scrolling function should be added to all lessons areas as an option... scrolling is only good when we read lessons"*

## Context

SHOULD: DR-0749 gave the reader a choice between the pager and the whole lesson at once, kept on the device. ARE: the switch was rendered by the Learn tab's guide (`ChurchLearn.jsx`) and passed down as `showAll`; the TLC door's training and lessons render the same `LessonFlowAudience` directly, with no switch and `showAll` false. GAPS: on the TLC door every lesson was one part at a time with Next, and nothing offered the whole lesson. CLOSE: the switch lives in the flow.

## What was measured

| what | measured | basis |
| --- | --- | --- |
| callers of the flow | the Learn guide (with its own switch) and the TLC Practice door (none) | `grep <LessonFlowAudience`: `ChurchLearn.jsx:1537`, `PracticeLearn.jsx:687` |
| the device-wide choice | `lib/lesson-room.js` `useFlowMode`, default `steps` | the module |

## Impact

Unresolved: a TLC reader cannot read a lesson top to bottom. Resolved: every door that uses the flow shows Steps / Scroll above the lesson; one tap holds across every lesson on the device; the Learn guide is unchanged.

## Decision

`LessonFlowAudience` reads the same `useFlowMode` and renders the Steps / Scroll switch by default (`flowSwitch`); `showAll` from a host still wins; the Learn guide passes `flowSwitch={false}` because it already renders the switch beside the guide's name.

## Verification

- `lesson-flow-scroll-on-every-surface.test.jsx`: the flow starts step by step with the switch shown, Scroll renders every part and writes the device choice, a second lesson opens the way the first was left, a host with its own switch gets none here and its `showAll` wins, and the TLC door renders the flow without opting out while the Learn guide opts out. The existing flow suites unchanged.

## Follow-ups

- Darrell's wider remark, *"scrolling is only good when we read lessons, not really anything else"*, is carried by DR-0783 (tabs in Cameras) and stands as the review question for every other long surface: a long scroll on a non-reading surface is a finding. `re-review: 2026-10-21`.

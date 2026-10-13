# DR-0880 — Leaving a lesson lands at the top of All lessons

- **Status:** accepted
- **Tier:** A (navigation defect; one handler)
- **Date:** 2026-10-10
- **Type:** product (defect)
- **Scope:** `app/src/components/ChurchLearn.jsx` (the `lesson-bar-all` control), `app/src/__tests__/leaving-a-lesson-lands-at-the-top.test.js` (new)
- **Principles:** PERPETUAL-IMPROVEMENT (DR-0075), SURFACE-SAYS-TRUTH, COMMUNITY-FIRST-MISSION
- **Grounds:** DR-0438 (this control was already made the bar's primary, because it is the only way out of a lesson)

## The word, as spoken

Darrell, 2026-10-10:

> "Or the all lessons link... just take it to the top of the All
> Lessons!!!!!!!!!!!!!!!!! Fix it!!!!!!!!!!!!"

## What was measured

The handler was one statement:

```js
onClick={() => setFocusId(null)}
```

Clearing the focus swaps **what renders**. It does not move the page. So the
reader kept whatever scroll offset the LESSON had them at, and the list
rendered underneath it — landing them in the middle of a list they never chose
to be in the middle of. The longer the lesson, the further down they landed.

That is why this reads as *"the button doesn't work"* rather than as a scroll
position: **the button worked every time.** It is also the second time this
exact control has needed attention — DR-0438 already made it the bar's primary
after Darrell's 2026-09-16 *"you can't really find the all button... Stop
making it difficult to get to places in the app."* It was made findable then,
and it still did not take him anywhere.

## Impact

Scrolling in the same tick as the state change would measure the layout the
LESSON left behind, so the move waits a frame. The landmark (`lessons-bar`)
only renders when a course has siblings (`courses.length > 1`), so a
single-course department has none — that path falls back to the find box and
then to the top of the page rather than silently doing nothing.

Honest limit: this fixes the *leaving* half of what he reported in that
message. The other half — the big green **Continue** opening the lesson's
guide rather than its reading, so a second tap is needed — is NOT in this
change. `resumeNow` sets `resumeOpenGuide = true`, and that same flag is what
drives DR-0631's "every Continue ends ON the words" landing
(`ChurchLearn.jsx:2184`). Changing it without being able to watch the
presenter and the guide interact risks trading one complaint for a worse
regression in landing. Named, not quietly dropped. `re-review: 2026-10-13`.

## The decision

Clear the focus, then on the next frame scroll the lessons landmark to the
**top** of the viewport, using the same `motionBehavior()` the bar's own "All"
control uses so a reader who asked for reduced motion still gets it. Guarded
for no document and for engines without smooth scrolling.

## Outcome

**8 green** on the new gate, plus **37 green** across `church-learn-render`,
`church-learn-play-and-courses`, `learn-a-tab-is-navigation-not-a-resume` and
`learn-browse-without-choosing` — the suites that own this control and the
lesson-focus behaviour around it. eslint clean.

The gate is pinned on the SCROLL, not on the clear: the clear was never the
broken half, and a test that asserted it would have passed throughout the
defect.

# DR-1686: The words land where you say, and Present is back in the new lesson look

**Date:** 2026-11-26
**Status:** Accepted
**Tier:** A (reader layout and one door to an existing surface; no schema, no money, no new road)
**Type:** fix + feature
**Area:** `app/src/components/learn-studio/lesson-reading.js`, `LessonExperienceTools.jsx`, `LessonExperience.jsx`, `LessonExperienceDoor.jsx`, `lesson-experience.css`, `app/src/components/ChurchLearn.jsx`, `app/src/__tests__/words-land-where-you-say.test.jsx`
**Pairs with:** DR-0451 (present this one), DR-0392 (startOnScreen), DR-1685 (the new look reads in your voice), DR-0099 (no true red)

## Context

Darrell, 2026-11-26, with a photo of the new look's full-screen Watch view, the spoken line at the bottom: *"We need the words to be at the top of the screen... not the bottom unless we say so.... let's give the options to users... on where the words should land on the image behind it... I want to be able to use this on the led wall behind the speakers podium at church."* Then: *"What happened to our projector of our words... workflows?"*

## What was measured

- **SHOULD:** the words sit where the room needs them; the viewer chooses; one screen (the LED wall's computer) can be fixed without touching it.
- **ARE, the words.** `.le-caption` was pinned `bottom: 12px` (full screen `bottom: 24px`), `lesson-experience.css:259,384`. No choice, no setting. The title sat at `top: 22%`, so top captions would have collided with it.
- **ARE, the projector.** The two-screen workflow is intact: `Presenter.jsx` (the console) opens `AudienceWindow.jsx` (`?audience=1`, the projected room screen) over a BroadcastChannel; the lesson list's **Present** button (`data-testid=present-one-*`, DR-0451) opens it. But `ChurchLearn.jsx:2569` hands a lesson with an approved cover to `LessonExperienceDoor`, and the new look had **no door** to Present. From the screen he uses, the projector was gone.

## Impact

The words open at the top. A **Words: Top / Middle / Bottom** chip (beside CC, and in full screen beside pause) moves them; the title steps out of their way and the shade follows them. In full screen the words scale with the screen (`clamp(1.375rem, 3.4vw, 4.5rem)`), so an LED wall reads them from the back. A **Present** chip in the new look opens this lesson's deck in the Presenter, and its "Open the class screen" sends the room screen to the second display (the LED wall) as before.

## Decision

1. Top is the default. Top, Middle or Bottom is the viewer's choice, kept on the device (`poe-lesson-caption-place`).
2. A link fixes one screen: `?captions=top|middle|bottom` wins over the remembered choice. For the LED wall's computer, bookmark the lesson with it.
3. The new look carries Present whenever the course offers it; it calls the same `setPresentAutoStart(true); setPresentLesson(m)` as the list's Present. Closing the deck returns to the lesson.

## Verification

- `words-land-where-you-say.test.jsx`, 5 cases: default, remembered, link wins, junk falls back to top; the stage opens `le-cap-top`; the chip cycles to middle and bottom and the device keeps it; Present calls the course and is absent when not offered; ChurchLearn wires it to `setPresentLesson(focusModule)`.
- **Proven to catch:** with `LessonExperience.jsx`, `LessonExperienceDoor.jsx` and `ChurchLearn.jsx` at the branch's previous commit, 4 of 5 fail (the pure place rule passes; it is new code).
- New-look, voice, ChurchLearn and Learn Studio suites: 141 tests pass; eslint and file-budget OK (`LessonExperience.jsx` 1500, its narrator comment folded to hold the line).
- **Not yet observed:** the words on the sanctuary LED wall itself. `re-review: 2026-11-30`, after a Sunday on the wall: size, safe margins, and whether the AudienceWindow (the deck's projected screen) wants the same Top/Middle/Bottom choice.

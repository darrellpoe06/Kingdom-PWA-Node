# DR-1669: The new look is the finished product: no prototype, quiz grades saved, pictures, verses, resume and the garage button fixed

**Date:** 2026-11-26
**Status:** Accepted
**Tier:** B (every member's Learn and lesson screen, and the header openers; no schema; quiz grades file through the existing record function)
**Type:** fix
**Area:** `app/src/components/learn-studio/LearnStudio.jsx`, `LearnStudioPreview.jsx`, `LessonExperience.jsx`, `lesson-verses.jsx` (new), `StudyQuiz.jsx`, `lesson-experience.css`; `app/src/lib/quiz-attempt.js` (new); `app/src/components/ChurchLearn.jsx`; `app/src/components/GarageHeaderButton.jsx`, `app/src/components/OpenerButton.jsx`; their tests
**Sent in by:** Darrell, 2026-11-26 (phone, 5:34-5:52): "Big pictures are not coming through"; "No more prototype just the finished product now... we like it and want to make sure we are using it to put our best foot forward"; "Too much space in between the words... we need to see text enlarge... not the squares"; "the button for the garage door keeps moving on long pause... inside the header"; "I just paused the lesson and it stopped and didn't start or ask if I wanted to start where I left off".
**Pairs with:** DR-1664 (the new look for every member), DR-1386 (quiz integrity), DR-1662 / DR-1667

## Context

With the new look on every member's phone (DR-1664), every seam a preview could hide became something the whole house meets.

## What was measured

- **Pictures:** 826 of 976 presentation records list w320 and w1920 webp files that are not shipped (only w640 and w1280 exist, 976 each). The new-look picture used the record's srcSet as is; a big view (the lesson cover) picked w1920, got a 404 and drew a broken image. The Institute already filtered (`shippedSrcSet`); the new Learn did not.
- **Prototype:** a "Try the new lesson experience (prototype)" banner closed the Learn home; the classic page's button read "New Learn (preview)".
- **Quiz:** the Lesson Experience opened from the new Learn had no record tools, so its Study quiz filed nothing and told every member "Not saved: this is the owner preview of a lesson that is not public yet."
- **Verses:** text between two quoted verses ("; " or ". ") rendered as its own line between two blocks, each with a 1em margin, so a lone ";" and a sentence starting "." sat in large gaps that grew with the text size.
- **Garage:** the header garage button's spoken status sat in the header row, and its label changed length (Hold / Telling / Sent); each change resized the row, the button slid from under the thumb, and pointerleave cancelled the hold. The header opener had the same status-in-row.
- **Resume:** the narrator's own pause is robust (lib/tts.js), but when a pause was ended by something else (screen lock, the app backgrounded) the player went idle with its sentence kept, and Play started the lesson from the first sentence; Read mode never showed where you left off.

## Decision

1. **Pictures offer only the sizes that ship** (w640, w1280) in the new-look picture, with `shippedSrcSet`, as the Institute and the lesson screen already do.
2. **No prototype or preview wording**: the banner is gone; the classic page's button reads "The new Learn"; the cover's line says what a lesson holds now.
3. **The Study quiz files to the member's record** through `lib/quiz-attempt.js` (`fileQuizAttempt`), the one function the classic course page now also calls (DR-1386 integrity carried); signed out, it says to sign in.
4. **Verses keep their joining punctuation** (`lesson-verses.jsx`, every character kept in order), and verse spacing is fixed in rem: a larger text size enlarges the words, not the gaps or boxes.
5. **The header garage button and opener stay put while held**: the status floats under the button out of the row, the button keeps the width of its longest label, and the press captures the pointer.
6. **Play continues where you left off** after a pause something else ended, with "Paused at ~mm:ss. Tap play to continue where you left off" and **Start over**, in Watch, Listen and Read.

## Impact

- The new look reads as the finished product: real pictures at every size, saved quiz grades, clean Scripture spacing, a resume that resumes, and a garage button that can be held.

## Verification after merge

- Learn and lesson suites (new look, course page, lessons, lesson screen, quiz): 113 + new cases passing, each new case proven to catch (the picture sizes, the quiz filing, the verse punctuation, the resume, the garage capture).
- Header openers: 39 of 39 (`garage-in-the-header`, opener suites).
- Guards: lint, file budget (LessonExperience split to 1,463 lines), monolith budget, legibility.
- Not yet seen on Darrell's phone.

`re-review: 2026-12-03`

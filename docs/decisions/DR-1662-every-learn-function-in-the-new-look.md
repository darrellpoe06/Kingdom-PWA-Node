# DR-1662: Every Learn function lives in the new look, with the smallest thumbnails

**Date:** 2026-11-26
**Status:** Accepted
**Tier:** B (owner-device preview; layout and routing, nothing removed)
**Type:** product
**Area:** `app/src/components/ChurchLearn.jsx`, `app/src/components/learn-studio/LearnDashboard.jsx` (new), `app/src/components/learn-studio/LearnStudio.jsx`, `app/src/components/learn-studio/LearnStudioPreview.jsx`, `app/src/components/learn-studio/LessonsInOrder.jsx`, `app/src/components/learn-studio/learn-studio.css`, `app/src/__tests__/learn-functions-in-new-look.test.jsx` (new), `app/src/__tests__/lesson-experience-prototype.test.jsx`
**Sent in by:** Darrell, 2026-11-26, with a screenshot of the classic Learn page: "We need all these functions to be in the new view without loosing the functions"; then "Review the DR's"; "we need the vibrant views and thumbnails"; "the smallest thumbnails with the titles showing so it will be very inviting"; "Sorting and optimizing for a lot of abilities to control the situation and view... Intuitive Design"; "Records and all looking good"; "Don't want to loose any functional tools".
**Pairs with:** DR-1654 (§4 "The look changes; no feature is lost"), DR-1661 (lessons first), DR-1606 (Learn opens on Latest), DR-1652 (downloads stay gated), DR-0099 (red is reserved)

## Context

DR-1654 put every LESSON in the new look and promised no feature is lost. The Learn HOME in the new look did not keep that promise. Measured against his screenshot of the classic page, the new home had none of: the department tabs (its department chips only left for the classic page), course quick links and the 51-course picker, the progress line (30 not started · 15 begun · 6 finished · 153 of 993 read), Closest to finished / Not started and short, Sort courses, and the area strip (Lessons, Continue · 19, Latest, Browse, Find, Record · 153, Downloads). Its course page was a grid of large cards with no order, no month headings, no read marks and no age buttons. Its Continue Learning row was always empty: the preview never passed the reader's places to it.

## Decision

1. **The vibrant layer, native to the new look** (`LearnDashboard`), under the in-order lessons (DR-1661 stays first):
   - **Your Learning**: not started, begun, finished, lessons read and a gold meter, from `libraryStanding` over the same places and progress the classic page reads; one tool strip (Continue · N, Latest, Browse, Find by verse, Record · N, Downloads).
   - **Closest to finished** and **Not started, and short**, from `lowHangingFruit`.
   - **Courses**: every course as a compact row (smallest thumbnail, whole title, code, lesson count, where you stand, a meter); department pills; **Sort** (every order `courseSortsFor` honestly offers), **Show** (All / Not started / Begun / Finished), **View** (List / Cards). The choices are remembered on the device (a convenience; the page renders the same without storage).
2. **Lessons as compact thumbnail rows** on the home list and in the course page's **List** look (the course page keeps its Pictures | List switch from #2898, Pictures first; List renders these rows in the order its one picker sets, so there is one order control, not two): the lesson's approved cover (or its number on a panel, never blank), the whole title, month headings for dated orders, the classic read mark ("✓ READ ×3 · Adult", same `readMark` and `readMarkLabel`), and one-tap age buttons. Sort (In order, Newest, A to Z, Z to A), **Show** (All / Not read / Read), **View** (List / Cards).
3. **No tool lost: the whole classic page renders inside the new look** as "Every Learn Tool", on the home and on every course page, which syncs it to that course. Record (class record, whose record, the library census), Downloads (still PoeTech+ or the Download Pass, DR-1652), Browse, Find by verse, Continue with Refresh first and Start fresh, Latest, Share, the course's parts: unchanged components, unchanged gates. A tool chip and a department chip open that area or department there.
4. **A lesson chosen from any classic tool opens in the new Lesson Experience** (Read, Play, Continue, an age version) through an opener the new look registers; with no opener (off the owner device, or a lesson the Experience cannot open) the classic path runs exactly as before. Leaving the new look clears the opener.
5. **Condensed by default, pictures first** (Darrell 2026-11-26, on the live home: "The first view should be very nice... this functionality is great however by default it should be condensed... we should see images and titles... and the full images with options for pictures or list"). The home's lessons open as full-image cards with their titles (Pictures | List, List is the compact rows); the courses open as a picture shelf to swipe (Pictures | List); Every Learn Tool is a closed panel that one tap opens, and a tool or department chip opens it and scrolls to it.
6. Meters and pressed controls are gold; true red stays reserved (DR-0099).

## Impact

- On the owner devices the new Learn has every function of the classic page, in the new look's colors, with small thumbnails and full titles. Off them nothing changes.
- No new art, audio or paid asset; covers are the approved ones already shipped.
- Continue Learning now fills from the reader's real begun lessons.

## Verification after merge

- `learn-functions-in-new-look.test.jsx`: 11 of 11. The numbers equal `libraryStanding` / `lowHangingFruit` over a real record; all six tools present and wired; Sort, Show and View each change the list (an empty Show says so); the course page lists every lesson with thumbnail, read mark and a Child chip that opens the Experience; a classic-tool open goes to the Experience on the owner device and declines elsewhere. **Proven to catch:** with the Play intercept removed from `ChurchLearn.jsx`, the wiring case fails; restored, it passes.
- `lesson-experience-prototype.test.jsx` and `course-lessons-view.test.jsx` unchanged from main and passing: the course page opens on Pictures, and List lists the course in order (now the compact rows). 110 of 110 across the six suites that touch these files after merging main.
- Not yet seen on his phone: Darrell opens Learn in the new look and finds the progress line, Pick Up Next, the course rows with Sort / Show / View, and Record · N opening his record in place.

`re-review: 2026-12-03`

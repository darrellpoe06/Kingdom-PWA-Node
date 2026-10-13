# DR-0318 — The Learn catalog opens without choosing a course, and the front door has one fixed place to look

- **Status:** accepted
- **Tier:** A — a findability change on an existing surface; no schema, no money, no new external face, no serving-path change
- **Scope:** `app/src/lib/learn-organize.js` (`browseLessons`/`browseCount`, pure + derived), `app/src/components/ChurchLearn.jsx` (the blank-state shelf, the sticky lessons bar, `resumeOpenGuide`, place-recording on the cross-course door), `app/src/__tests__/learn-browse-without-choosing.test.jsx`
- **Date:** 2026-08-31
- **Principles:** ANXIETY-CLARITY (findability answers "what/where"), COMMUNITY-FIRST-MISSION (the elderly, tech-novice reader), NO-STATIC-DATA (DR-0121), CONSISTENCY-STANDARD (DR-0079), IN-PLACE-FIRST (DR-0201), VERIFICATION-DOCTRINE (DR-0076), PERPETUAL-IMPROVEMENT (DR-0075)

## Directive

Christina, 2026-08-31, on the live Learn tab with the Family Operating Systems
screen in front of her:

> *"How do I get to the rest of the lessons?"*

Darrell, agreeing and naming the shape twice:

> *"I agree and there's a DR asking for better idea for Lessons the locations
> for everything are not obvious... make them obvious or even a location on the
> screen that is the place to look... we have that but the user needs to pay
> close attention to the words... we need the subconscious to also think it's
> easy... opportunities and constraints... fix it..."*

> *"you must choose a course first to get to the lists lessons unless you type a
> name etc.. how can this be better?"*

## The verified trace (SHOULD/ARE, DR-0219)

**SHOULD:** a reader who knows neither a search word nor which course holds a
lesson can still reach any of the 401 lessons.

**ARE (traced in `ChurchLearn.jsx` + `learn-organize.js`):**

1. **The catalog was course-first.** Two doors existed and both demanded prior
   knowledge: the lesson finder returns `[]` for a blank query
   (`searchLessons`, one line — *"the finder is an answer to a question, never a
   second wall of rows"*), and the course picker asks which of 22 courses holds
   the lesson. A reader with neither had no way in.
2. **Both doors scroll away.** The finder and picker render above the schedule
   and are gone the moment a reader scrolls into a course's weeks — which is
   precisely where Christina's screenshot was taken. The in-lesson bar
   (`lesson-space-bar`, DR-0262) is sticky; the catalog view had no equivalent.
3. **The cross-course door behaved differently from a title tap.** Reaching a
   lesson through the finder forced the RESUME arrival (guide already open) and
   did not record the reader's place — so a browsed lesson skipped the
   "Start this lesson" affordance and was one a reader could lose again on
   reload, against DR-0262's "place survives in both directions."

## Decision

1. **The blank state is the shelf, not a wall.** With no query typed, the finder
   lists every lesson in the app grouped under its course. Typing NARROWS what
   is already visible instead of summoning it out of nothing; `searchLessons` is
   unchanged. `browseLessons`/`browseCount` are pure and derive grouping and
   counts from the mounted catalog, never a hand-kept list (DR-0121).
2. **One fixed place to look.** A sticky bar in the course view names the course,
   states the live totals ("401 lessons · 22 courses" — so the reader learns
   there IS more), and carries one control back to the shelf. It reuses the
   shape, position and z-index of the in-lesson bar deliberately: the app teaches
   ONE landmark, and a reader who learns it inside a lesson already knows it in
   the catalog. That is the subconscious half of the directive — the answer is
   where it always is, so nobody has to read carefully to find it.
3. **The arrival matches the door.** `resumeOpenGuide` separates the two: Resume
   and deep links keep the mid-study arrival decided by DR-0262/DR-0264 (guide
   open); browsing arrives like a title tap (the scannable card, with
   "Start this lesson" still to press).
4. **The place survives every door (DR-0262).** The cross-course door now records
   the reader's place, as `openLesson()` already did.

## Opportunities and constraints

- **Opportunity:** per-course progress on the shelf rows ("· done") would let a
  reader see what they have finished while browsing; the data exists but is not
  cheaply available to the finder. Carries DR-0150's own open opportunity of the
  same shape. `re-review: 2026-09-30`.
- **Opportunity:** the shelf renders every row at once. At 401 rows on an older
  phone this is acceptable and was accepted deliberately over a cap, because a
  cap re-introduces exactly the hiding this DR removes; if the catalog passes
  roughly 800 lessons, windowing becomes the right trade. `re-review: 2026-11-30`.
- **Opportunity:** DR-0129's cross-link opportunity ("more study lives here")
  remains partly open — the TLC training track still lives on its own surface, so
  the shelf's totals describe the Learn catalog, not literally every teaching
  surface in the app. `re-review: 2026-10-15`.
- **Constraint (held):** grouping and counts stay derived from the mounted
  catalog; a new course family is added to the registry, never to a display-side
  list (DR-0121, DR-0150).
- **Constraint (held, and initially violated):** the first cut of this change
  shipped an emoji as chrome and an invented colour (`#EFEBE3`). Both failed
  their guards — `consistency-guard` (icons are bundled inline SVG via `UiIcon`,
  because a device-font emoji is a tofu box on the older phones COLG uses) and
  `contrast-guard`/`legibility-guard` (an un-remapped colour renders
  light-on-light in the midnight theme this app actually runs in). Recorded here
  rather than quietly fixed: the standard was skipped, and the gates are what
  caught it (DR-0079, DR-0076).

## Not addressed here

Darrell, same session: *"You must also click Start This Lesson and then the
speaker will read it from beginning to end... not necessary however extremely
convenient... also should be more obvious."* The whole-lesson read is real and
works, but its control lives inside the Read Aloud panel, so a reader must open
that panel to discover it. Named as a finding, not built in this change.
`re-review: 2026-09-15`.

## Supersedes / pairs

Pairs with DR-0150 (the picker + finder this opens up), DR-0149 (the derived
category grouping), DR-0129 §4 (the standing rule that a feature updates the Ways
and documentation and names its opportunities and constraints — the rule this
record exists to satisfy), DR-0262/DR-0264 (the lesson's own space and the place
that survives), DR-0079 (the primitives the first cut violated), DR-0201
(in-place first). No supersession.

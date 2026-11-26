# DR-1702: Relationships gets guided tracks: premium in depth, never in price

**Date:** 2026-11-26
**Status:** Accepted
**Tier:** A (additive; the Relationships page of the new-look Learn; no schema, no new storage)
**Type:** feature
**Area:** `app/src/lib/learn-presentation/relationship-tracks.js` (new), `app/src/components/learn-studio/RelationshipTracks.jsx` + `relationship-tracks.css` (new), `app/src/components/learn-studio/LearnStudio.jsx` (mount), `app/src/__tests__/relationship-tracks.test.jsx` (new), `scripts/relationship-tracks-probe.mjs` (new)
**Sent in by:** Darrell, 2026-11-26, looking at the Relationships section: "This is very good!!!! Relationships should be a good one... maybe we have a premium level of Relationships?"
**Narrative:** `docs/99-session-notes/2026-11-26-relationship-guided-tracks.md`
**Pairs with:** DR-0536 (the Word is never sold: sell the accompaniment, never the content), DR-1675 (Relationships as a section, four groups, PR #2930), DR-1684 (lesson progress from the saved place), DR-1698 (L346, PR #2959), DR-0076

## Context

The Relationships shelf on the new-look Learn holds the marriage, love, family and forgiveness lessons. Its See All page is a grid of every lesson on the shelf, in no guided order. Darrell asked for a "premium level." DR-0536 classes living lessons as formation, which is never priced. So "premium" here means more depth, and the tracks are free.

## What was measured

- 22 of main's 36 Relationships lessons carry their own discussion prompts; every step is one of those 22.
- All 976 presentation records are status `review`; the new look runs with `preview` on. Each track cover is a current (not stale) cover of its own lesson whose file ships.
- The four groups and the learn-structures probe exist only on PR #2930 (open, conflicting), so this builds on main's See All page. Detail: session note.

## Decision

Three guided tracks sit at the top of the Relationships page, above the lessons, as pictures:

1. **Couples: Six Weeks Together** (cover: L122). The steps are L114 What Makes Having You Better, L122 Does She Feel Like Your Favorite Person, L157 What Is Love, L121 Know Your Own Post, L115 Meek and Quiet Strength and L319 What the Trust Could Not Keep.
2. **Parents: The House Still Teaches** (cover: L313). The steps are L313 Children Are a Heritage, L46 Ye Fathers, L117 No Two Children Grow Up in the Same House, L100 Guard the Little Ones, L282 The Greater Work and L154 Why Do We Have to Pay for Our Fathers' Sins.
3. **Repair: Offense, Forgiveness, Ruling Your Spirit** (cover: L16). The steps are L151 The Tongue, L15 Seasoned with Salt, L291 Fruits Meet for Repentance and L16 Rule Your Spirit, Repair the Bond. L346 Better Than He That Taketh a City is the fifth step; it is marked `whenMounted` and joins on its own the moment PR #2959 lands.

Each step carries:

- **Why:** a span of the lesson's own bigIdea, matched while ignoring only case, curly quotes and spacing. If the lesson changes and the span is gone, the line is dropped at run time and the build fails.
- **Talk about it together:** an index into the lesson's own discussion prompts.
- **Progress:** the reader's own saved place (`learn-resume` read through `lessonProgress`) and the read record (`done`). A step-only place with nothing measured is not counted. A track nobody has begun shows no bar and says "Not started · N steps".
- **The button:** Start, Continue step N (the first unread step) or Walk it again. It and every step open the lesson in the Lesson Experience, through the same `onRead` the rest of Learn uses.

## Impact

- The tracks are built only when the Relationships page is open, so the Learn home render costs nothing more.
- If #2930 lands, the tracks stay above its four groups. The merge touches one JSX block in the same `pickedShelf` branch.
- Every step is on main's `RELATIONSHIP_LESSONS`. A test fails if a step leaves the shelf.

## Verification

- `relationship-tracks.test.jsx`, 14 cases: real shelf ids; each why a span of its bigIdea and each prompt the lesson's own; covers current with files on disk; L346 joins when mounted; progress (nothing saved, step-only place, measured 40%, read steps, all read); on the page the tracks sit above the grid with each lesson's cover, Start opens step 1, a step opens that step, and with step 1 read it shows "1 of 6 read" and Continue step 2 opens L122.
- Proven to catch (2026-11-26): an invented why fails 1 case; the tracks unmounted fail 3; progress painted as started fails 4.
- `scripts/relationship-tracks-probe.mjs` on the built dist at 390 px (all five text sizes) and 750 px (normal, Big Print): no sideways scroll, no squeezed words, 3 of 3 covers loaded, 1 column on the phone and 2 on the tablet, Start opens the Lesson Experience. It found one defect, now fixed: on the tablet, an opened track stretched its row-mate (`align-items: start`). Screenshots: session note.

`re-review: 2026-12-10` (on Darrell's phone: walk a step of each track and confirm Continue moves to the next step after a lesson is read to the end).

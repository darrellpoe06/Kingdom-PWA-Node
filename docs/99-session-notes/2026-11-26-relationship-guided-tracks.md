# 2026-11-26: Relationships guided tracks (DR-1702)

Darrell, looking at the Relationships section: "This is very good!!!! Relationships should be a good one... maybe we have a premium level of Relationships?" Premium here means more depth, never a price (DR-0536).

## The premise conflict, and the route taken

The brief named `RELATIONSHIP_GROUPS` and the section page `ls-relationship-sections`. Both exist only on PR #2930 (DR-1675 there), which was open, conflicting with main, and being pushed to by another session at the time. Main has the Relationships shelf and its See All page (`shelf === 'relationships'` in `LearnStudio.jsx`), which is the same branch #2930 extends. The tracks mount at the top of that page. If #2930 lands, its four groups render below the tracks, and the merge touches one JSX block.

`scripts/learn-structures-probe.mjs` is also only on #2930, so the tracks have their own probe (`scripts/relationship-tracks-probe.mjs`). It uses the same measures: overflow, squeezed words, and the built dist with the test-stub Supabase.

## How the steps were chosen

1. Every lesson on main's list was dumped with its title, bigIdea and `facilitator.discussionPrompts`. Twenty-two carry prompts.
2. Tracks were drawn from those 22 only, so every step has its own "talk about it together" question.
3. Each `why` is a sentence or clause copied from the lesson's own bigIdea. The test re-checks this against the live text.
4. L346 (PR #2959) is the fifth Repair step, marked `whenMounted`. Its why and prompt index were taken from the lesson file on that branch.

## Covers

Every presentation record is `review`, and the new look presents with `preview`. "Approved cover" therefore means the cover the new look already shows: a current (not stale) record whose file ships. It does not mean a record in `approved` status, because none exist yet.

## Probe findings

At 750 px, opening one track's steps stretched its row-mate into a tall empty panel (CSS grid stretch). Fixed with `align-items: start`. After the fix all 7 cases are clean. Screenshots: `relationship-tracks-2026-11-26/phone-390.webp` and `tablet-750.webp`. Each shows the Couples steps opened. The bars across the middle are the app's fixed header and bottom nav caught in the element capture, not the layout.

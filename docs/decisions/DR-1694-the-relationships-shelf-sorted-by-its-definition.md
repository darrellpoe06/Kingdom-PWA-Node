# DR-1694: The Relationships shelf is sorted by its definition, every lesson read

**Date:** 2026-11-26
**Status:** Accepted
**Tier:** A (which lessons a shelf lists; no lesson text changed)
**Type:** content
**Area:** `app/src/lib/learn-presentation/presentation.js` (`RELATIONSHIP_LESSONS`), `app/src/__tests__/relationships-shelf-audit.test.js`
**Sent in by:** Darrell, 2026-11-26 (spoken): the shelf had about 35 lessons from a title search; "they don't have anything about relationships... You're not making any sense."
**Pairs with:** DR-1692 (the definition and L344/L345), DR-1686 (the shelf at 35), DR-0076 (proven to catch)
**Narrative:** `docs/99-session-notes/2026-11-26-relationships-shelf-audit.md` (the audit, one row and reason per lesson)

## Context

Relationships now has a written standard: relating in every direction, to Yahweh, within oneself, and to every person, measured by the fruit of the Spirit, in six groups (`RELATIONSHIPS-RELATING-IN-EVERY-DIRECTION.md` section 5). Darrell widened it the same day: learning, study, mood, the hard necessary thing, change, the Word as mirror, another person's situation.

## What was measured

- 996 mounted lessons read (`learnInventory()`, 2026-11-26) by title, big idea, the opening of the body and the section headings, never by keyword; six readers in parallel, each re-reading its sixth when the criteria widened; close calls reviewed by the coordinator.
- 303 on the shelf: L344 and L345 first, then With Yahweh 93, Within 120, Marriage 8, Family 22, Friendship/church/neighbour 39, Conflict and forgiveness 19. 149 near-misses listed with why.
- All 35 lessons of DR-1686 remain (ll319 kept as a close call, recorded).

## Decision

1. `RELATIONSHIP_LESSONS` is the audited list, grouped and commented by group, the new lessons first.
2. `relationships-shelf-audit.test.js`: every shelf id is a mounted lesson and in the audit with a reason; every audited on-shelf lesson is listed; no lesson twice or also a near-miss. Proven to catch: a planted id, a blanked reason, a dropped lesson, a double listing are each named.

## Impact

A reader opening Relationships now finds the lessons about relating in every direction, not only those with a relationship word in the title. The shelf and its written reasons can no longer drift apart silently.

## Verification

- `relationships-shelf-audit.test.js` 4/4 (proven to catch), with the Learn suites that read the shelf: 66/66 locally.
- After merge: the Relationships shelf on the live Learn home opens with L344 and See All lists 303.

## Open

- The audit read each lesson's opening and headings, not every word; a lesson whose relating sits deep in its body may be missed. Named, added with its reason.
- 303 is long for a row; the shelf shows its first cards and See All opens every one. Grouped sub-rows in the UI are not built here.

`re-review: 2026-12-26`

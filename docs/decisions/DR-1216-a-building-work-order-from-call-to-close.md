# DR-1216: A building's work order, from the call to the close, with its workers, its result, and Projects as a menu

**Date:** 2026-10-22
**Status:** accepted
**Tier:** A (writes through the stores' own existing writers; no schema change; the building name and the split half are written only on the person's tap)
**Type:** surface + process + data health (APP-IS-PRIMARY, HOLD-THE-HAND-OF-THE-PROCESS)
**Area:**
- `docs/00-foundations/_root/A-WORK-ORDER-FROM-CALL-TO-CLOSE.md`: the procedure, its failure table, its open constraints with dates
- `app/src/lib/building-group.js`: `buildingResolver`, `buildingsOf`, `buildingRecordGaps`, `splitHalfLabel`
- `app/src/lib/work-order-triage.js`: `newWorkOrder`, `BUILDING_AREAS`, `workersBoard`, `resultsToReview`, `progressOf`, `ageOf`, `requiresResult`, `closingChecks`, `fromBoardTask`
- `app/src/components/WorkOrderTriage.jsx`: New work order, By worker, To review, the track and pills, the close panel, Send it back, Text the job
- `app/src/components/BuildingTools.jsx` (new) under each building's header in Real Estate
- `app/src/components/Projects.jsx`: four areas, each a row of pages; Work orders is one
- `app/src/poe-financial-mvp-v28.jsx`: the work-order writers added to the existing Projects mount line; line count unchanged

**Grounds:** Darrell, 2026-10-22, in one conversation:
- *"805 N Prospect Ave Champaign IL the building... not one of the apartments... we need work done in the foyer... and other basement activities... how do we add a work order from scratch and what to do with it when its for the building"*
- *"Also seeing all workers outstanding and just a place to review the results"*
- *"This need better quality and more clear quality control and visuals so users can and will use it!!!"*
- *"There is only 4 apartments in the building"* and *"We were splitting apt 4 after the current tenant moves to another one of our bigger properties"*
- *"Our projects tab has work orders etc..."*
- *"one comprehensive review of the procedure we need and opportunities and constraints and solutions that take everything into account"*, *"I want to fix it now"*, *"We want the best sustainable solutions!!!"*, *"End to end understanding first then a fix that makes sure we have accounted for potential issues based on the process"*
- *"Users will not see this space because its too busy and not clear enough"*, *"Submenus systems needed"*, *"Not long scrolling... each tab is for functionality and management"*
- *"Our number of buildings dont change however the number of doors can because of our needs to have flexibility in our support for tenants and the community to have housing... our systems need to be able to do this"*

**Principles:** HOLD-THE-HAND, SPEC-CONFORMANCE-REVIEW, VERIFICATION-DOCTRINE, APP-IS-PRIMARY, REALITY-TRACE

## Context

DR-1213 and DR-1215 gave every work order one queue and the means to act on it. Three things were still missing. A work order could not be filed from scratch. Nothing could be filed for a building rather than a door. And nobody could see a worker's open work or check what came back. The Projects tab, where Darrell looks for work, held the board items and stacked eight sections in one scroll.

## What was measured: the comprehensive review (COMPREHENSIVE-REVIEW-STANDARD.md, all ten)

Measured first, on the live database (building-probe, counts and labels only, removed in this PR):
- 805 holds five door records at one address: Apt 1 (rented, the only one with the building name), Apt 2 (not rented: the Airbnb door), Apt 3 (rented), Apt 4 (rented), and a second "Apt 4" (not rented, added 2026-08-28: the split half).
- The Projects board titled 805 is Apt 2's readiness board (`airbnb-ready:`): 8 items, 5 done, 3 not started, no owner, no notes.
- `incidents`: 4 rows (3 linked to a door, 1 to nothing). `tenant_maintenance_requests`: 0.

1. **SHOULD/ARE.**
   - SHOULD: file a work order for a building's part or a door; see each worker's open work; check results and close with what was done; one building with flexible doors; a Projects tab that is a menu.
   - ARE, before this change, seven gaps:
     - no way to file a work order from the triage
     - no building as a place for work
     - 805 read as five separate doors
     - two doors with one name
     - no view of a worker's open work, and no review step
     - a close carried no result
     - Projects was one long scroll
   - Every gap is closed here.
2. **Journeys.** Walked in Chromium on the real app (sample data):
   - Projects → Work → Work orders → New work order → pick where → save
   - the new work order opens on its track
   - Resolve shows the checks and asks what was done before it closes
   - and, on 805's measured shape: Real Estate's building strip → Write it on them → name the split half (Apt 4B) → a foyer work order for the building

   Found on the walk and fixed: with no building in the data, the form silently defaulted to "Not a property". It now asks for a choice and refuses to save without one (proven to catch).
3. **Surface says truth.**
   - Each pill and the track are read from the record.
   - **No result** shows on a close that carried no words.
   - A door count is never called wrong; only a shared name is flagged.
   - "Not saved: …" names the store's refusal.
4. **Form factor, measured** at 360, 768 and 1280 px, on the Projects menu, the Work orders page, the close panel and the building strip:
   - page overflow 0
   - no control under 36 px
   - no page errors
   - the track's labels fit at 360 after they were shortened on the walk
5. **Delivery context / channels.**
   - Nothing is only Darrell's to do.
   - The two record fixes on 805 (the building name, the split half's name) are one tap each in Real Estate. They are his to confirm, not written blind, because the split half's name is his choice.
   - A worker reached by text is sent by the person.
6. **Findings are work.**
   - Every gap found is closed in this change.
   - Four constraints stand, each with a why and a `re-review:` date: in the procedure doc §5, and below.
7. **Gate the class.** `a-building-work-order-from-call-to-close.test.jsx`, 28 tests. Proven to catch:
   - the 805 grouping regression
   - a work order filed with no words
   - a filing to nowhere
   - a close without a result (all three stores)
   - a result moved after its status
   - a bare close not flagged
   - the long-scroll Projects page coming back
8. **The Word.** One verse, 1 Corinthians 4:2 (KJV), checked word for word against the repo's verified fragment registry. It is reasoned in the doc: being *found* faithful is seen, not claimed, which is the close-with-a-result rule.
9. **Not hollow.**
   - The authored assets are the work order's own words, the result written at the close, and 805's own door records.
   - Each is shown as written; nothing is painted.
10. **Continuity.**
    - Reads: `incidents` (live: 4), `tenant_maintenance_requests` (live: 0), `board_tasks` on property boards (live: 805 Apt 2's 8), `rentals` (live: 13; 805's 5).
    - Writes, all through each store's own writer:
      - `addIncident` (a building work order)
      - `updateIncident` (a result, a send-back)
      - `patchTask` (a board item's owner, status and result)
      - `updateRental` (the building name, the split half's name)
    - A closed work order seeds the review list and its door's or building's record.

## Impact

- **Unresolved:**
  - building work cannot be filed for the building
  - 805 reads as five unrelated doors
  - finished work and its results are never checked
  - closes carry nothing
  - the Projects tab is skipped because it is too busy
- **The call obligates:**
  - the building is the stable record, and its doors flex beneath it
  - building work links to the building
  - every close carries what was done
  - each Projects page does one job

## Decision

- **A new work order from scratch:**
  - for a building's part (it links to the building), one door, or not a property
  - "where" is always chosen, never defaulted to nowhere
- **One building, flexible doors:**
  - doors are grouped by shared address and the building's one name
  - the doors missing the name, and a name two doors share, are offered as one-tap fixes to the record
  - no door count is called wrong
- **By worker and To review:**
  - each worker's open work
  - finished work waits on review, then closes with its result or is sent back
- **Quality control you can see:** the track, the pills, the days open and past due, the close panel, and **No result**.
- **Projects board property items** are in the same queue, written through the board's own store.
- **Projects is a menu:**
  - four areas: Work (Projects, Work orders, Phase walk, Workload, Boards, Inventory, Agreements), Voices, Reviews, PoeTech Build
  - each page does one job
  - the build headline leads PoeTech Build instead of every page
- **Constraints, dated:**
  - a worker's own screen for a Real Estate work order: re-review: 2026-10-29
  - the older one-tap Resolve routed through the close panel: re-review: 2026-10-29
  - a tenant's common-area report: re-review: 2026-11-05
  - a renamed building's links: re-review when a building is renamed

## Verification

- **New suite** `a-building-work-order-from-call-to-close.test.jsx`: 28/28.
- **The 125 related suites** (the triage, the Life Hub, Big Picture, Rentals, building-group, Projects and its panels, contrast, the monolith budget): passing, and re-run after the last change.
- **Lint** clean.
- **Chromium measurement** at three widths, as in dimension 4.
- **The live shape** read by building-probe (removed in this PR).

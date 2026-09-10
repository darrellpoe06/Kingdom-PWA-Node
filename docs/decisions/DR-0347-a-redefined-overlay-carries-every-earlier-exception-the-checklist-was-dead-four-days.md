# DR-0347 — A redefined overlay carries every earlier exception: the capability checklist was dead in production for four days

**Date:** 2026-09-10 · **Status:** accepted · **Tier:** B (post-incident) · **Area:** platform / access · **Principles:** VERIFICATION-DOCTRINE, ROLE-CAPABILITY-MODEL, GATE-THE-CLASS, DECISION-RECORDS

## What was found

The rls-isolation matrix (leg `viewer-readonly`, smoke 0126) has been red on `main` since 0181 shipped on 2026-09-06: *"CAPABILITY SMOKE FAIL: write:choir grant did not unlock the choir area."* It was flagged during the TLC work as pre-existing and pulled as the next item.

## Root cause (traced, DR-0219)

- 0126 (DR-0242) taught `apply_viewer_readonly_overlay()` the capability checklist: on an area-mapped table (`capability_area`) a viewer passes when `has_capability(instance_id, 'write:<area>')` holds.
- 0181 redefined the same function to add one participation table (`push_subscriptions`), starting from 0125's text rather than 0126's. The capability predicate was dropped.
- Every later migration re-runs the overlay, so production's `viewer_readonly_*` policies have been the pure deny since then. Verified live: `choir_song_ideas.viewer_readonly_insert` reads `user_role_in_instance(instance_id) IS DISTINCT FROM 'viewer'` with no `has_capability`. Every "write:<area>" box an owner ticked for a guest since 2026-09-06 has granted nothing.
- The tenancy guard's Check E asked a redefinition to keep RESTRICTIVE + `'viewer'`; it never asked it to keep what an earlier definition added. The smoke that runs against the real database caught it; the app-side gate did not, because the class had no gate.

## Decisions

1. **Migration 0190** redefines the overlay with both: 0126's capability predicate and 0181's participation list (`push_subscriptions` kept), and re-runs both overlays so the live policies are rebuilt.
2. **The class gets a gate** (`viewer-overlay-lineage.test.js`): walking every migration that redefines the function, the LAST definition must carry every participation table any earlier definition carried, and the capability predicate once any earlier definition taught it. Proven-to-catch three ways: with 0190 removed, 0181 is named for the drop; a synthetic redefinition that forgets `push_subscriptions` is named; a hollow redefinition fails on all counts.
3. **0190 joins the `viewer-readonly` matrix leg** after 0181, so the smoke that found the drop is the one that proves the fix on the real database (`rls-isolation-matrix-guard` keeps the reference honest).

## The lesson (LESSONS-LEARNED P-entry)

A `CREATE OR REPLACE` of a shared function is a rewrite of everything the function had learned. "Keep the invariants Check E names" was not enough; the invariant is *superset of the previous definition*. Copy the latest text, never the first; and let a gate compare, because a human reading two 60-line bodies four days apart will not.

## Honest limit

The live proof is the next rls-isolation run after 0190 is applied by db-migrate on merge; until it is green this record stays open. `re-review: 2026-09-11`.

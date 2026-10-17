# DR-1077: A household shares its legal papers only when the filer says so

**Date:** 2026-10-16
**Status:** accepted
**Tier:** B (widens who can read privileged legal paper, inside a household, only on the filer's word)
**Type:** word
**Area:**
- `infra/supabase/migrations-auto/0299-a-household-shares-its-legal-papers-only-when-the-filer-says-so.sql` (new)
- `infra/supabase/tests/0299-legal-household-share-smoke.sql` (new), `.github/workflows/rls-isolation.yml` (leg `legal-household`)
- `app/src/lib/legal-documents-sync.js` (`fetchHouseholdLegalDocuments`, `setLegalDocumentShared`)
- `app/src/lib/legal-documents.js` (the shape carries `sharedWithHousehold`, `fromHousehold`, `sharedBy`)
- `app/src/components/Legal.jsx` (the share switch, the household rows, the steps read both)
- `app/src/lib/help-content.js`, `app/src/lib/surface-help.js`, `scripts/system-flow-registry.mjs`
- Tests: `legal-household-share.test.js`, `legal-household-sync.test.js` (new), `legal-shelves-render.test.jsx`

**Grounds:** Darrell, 2026-10-16, answering the constraint DR-1076 named: **"We are in the same family and need our records to be in sync with what we are doing and also some users will not want that... we want all opinions to be able to be used without any issues."**
**Principles:** DR-0329 (the legal shelves); DR-1076 (the paper is the tick); DR-0076 (§3 proven-to-catch); DR-0241 (a viewer stays a viewer); DR-0271 (an assistant's reach is its workspace); the 0131 NULL-role class; 0209's `shared_with_office` (sharing never hands over the pen)

## Context

0180 made every legal document private to whoever filed it, on all four verbs.
That was right for privacy and wrong for a family working one plan: the steps
DR-1076 put on Books → Legal read only the viewer's shelf, so Christina's
reinstatement paper could never move Darrell's checklist. Darrell asked for
both at once: records in step for those who want it, and nothing forced on
those who do not.

## What was measured

| | |
|---|---|
| 0180 read policy | `USING (created_by = auth.uid())` |
| The device sync's pull (`table-sync.js` `fetchAll`) | filters by `instance_id` only, and `toRow` stamps `created_by = me` on every upload |
| Family members' seat (0001/0012) | `role = 'member'`; owner/admin alone would have excluded them |
| The church shelf (0209) | `shared_with_office boolean DEFAULT false`, update and delete stay with the filer |

The second row decided the design. Widening the table's read would have poured
other people's shared rows into the reader's own store, where a later upload
could re-file them as the reader's own.

## Decision

1. **One flag per document, off by default.** `shared_with_household boolean
   NOT NULL DEFAULT false`. A person who never shares keeps exactly 0180's
   shelf.
2. **The table's read is left untouched.** Shared rows reach a reader only
   through `household_shared_legal_documents()`, a definer function, so the
   device sync never sees them. They live in component state, never in the
   reader's local shelf.
3. **The household is the document's instance, role owner, admin or member.**
   Viewers, assistants, specialists and successors never receive shared legal
   paper. The filer must still belong, so leaving the household takes their
   papers with them.
4. **The pen stays with the filer.** Update and delete remain creator-only, and
   a share can only point at a household the filer is in.
5. **The file opens for the same people** through one added storage SELECT
   policy; no storage write verb is widened.
6. **Sharing is an explicit act** (`setLegalDocumentShared`), never part of the
   sync's row, so nothing becomes shared by accident.

## Impact

A family can now keep one plan in step: when Christina shares the paper for a
step, it appears on Darrell's shelf, read-only and named for her, and his
checklist moves. Anyone who does not want that changes nothing. Privileged
paper is still never visible to a viewer, an assistant or anyone outside the
household.

What this does not do: there is no bulk "share everything" switch, and no
household-wide default. Each document is decided by its filer. A reader does
not receive realtime updates for shared rows; the list refreshes when the tab
opens.

## Verification

- **Live smoke** `0299-legal-household-share-smoke.sql`, run locally on PostgreSQL 16 after applying 0180 and 0299 twice: `LEGAL HOUSEHOLD SHARE SMOKE: PASS`. It runs on the live database in the `legal-household` rls-isolation leg after merge.
- **Proven to catch**, four mutations, each failing the smoke with its own message: a viewer admitted ("a viewer read 1 shared legal rows"); the filer's own rows listed; the departed-filer check removed; the share-aim check loosened ("a stranger filed a shared paper into another household").
- `legal-household-share.test.js` (16) pins the migration text: off by default, the table read untouched, three definers with a pinned search path, no anon grant, no storage write widened.
- `legal-household-sync.test.js` (8): the device sync never writes the flag; a backend without 0299 reads as not-available.
- `legal-shelves-render.test.jsx` (+5): private by default; one tap to share; unsynced cannot share; household paper is openable and never removable; a shared step moves the checklist. Mutation: feeding the steps only the viewer's shelf fails it.

**re-review:** 2026-11-16, or the first time a household asks for a share-everything switch.

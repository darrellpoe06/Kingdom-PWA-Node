# DR-1087: Every shelf sorts and reports from its own records

**Date:** 2026-10-17
**Status:** accepted
**Tier:** A (display and export only; it reads what the shelf already shows)
**Type:** way
**Area:**
- `app/src/lib/document-record.js` (`shelfReport`, `recordValue`); `app/src/lib/report-export.js` (an optional `unit` for the print heading)
- `app/src/components/ShelfLedger.jsx` (new)
- `app/src/components/Choir.jsx`, `Legal.jsx`, `ChurchMemberSpace.jsx`, `HouseholdSpace.jsx`, `BooksTaxes.jsx`; `app/src/modules/properties/DoorTabs.jsx` (the report and the sorted view on each shelf)
- Test: `app/src/__tests__/document-shelf-report.test.js` (new)

**Grounds:** Darrell, 2026-10-17: **"How can we make it easy for getting accurate data driven reports"**, then **"Can't we find a way to visualize the documents and sort the necessary information as required?"**
**Principles:** DR-1085 (every document carries its own record); DR-0076 (no claim without evidence; §3 proven-to-catch); the report-export primitive (one model, CSV and Print)

## Context

DR-1085 gave every document a record, but only one at a time: to know which papers on a shelf were filed before the move, or which were the newest, you had to open each one. The app already had a report primitive (`report-export.js`, `ReportActions`) that exports exactly the rows a surface passes it, and a test that proves a money report's CSV total equals the on-screen total. The document shelves did not use it.

## What was measured

| | |
|---|---|
| Shelves with a document record | 8 (DR-1085, DR-1086) |
| Of them, with a shelf-wide view, sort or export | 0 |
| The money report primitive | exports only the rows passed in; `csvNetTotal` proves CSV equals screen |
| The print heading | said "tx" for every report, money or not |

## Decision

1. **One report per shelf, built from the records.** `shelfReport(records)` reads every cell from the same record the viewer shows, so the report, the sorted view and the record panel cannot disagree. A detail the record leaves out for this reader (the stored path, the Message-ID) cannot reach the report, because the report never sees the row.
2. **The sorted view draws that same report.** `ShelfLedger` sorts it by date, filing time, type or name, can show only what was filed before the move, and opens a title in the shelf's own viewer where the shelf has one.
3. **On six document shelves now:** Team Docs, Legal, a member's church papers, household documents, tax returns and each property door's papers. Each has Download CSV, Print / PDF and the sorted view.
4. **The print heading counts what the report counts.** A document report says "documents", and a money report still says "tx".

## Impact

A shelf can be read, sorted and handed to someone as one page, with nothing estimated: a fact the app never kept stays blank or says "not recorded". The Choir June calendar is one line among the 322 marked "filed before the move".

Not on it: a colleague's TLC onboarding readout, which shows one person's handful of files in a fixed checklist order that a sort would scramble. Sermon documents are one per sermon and live on the sermon. **re-review:** 2026-10-24, with the phone walk, to measure the table at phone width.

## Verification

- `document-shelf-report.test.js` (22 tests). Every report cell equals the record's own value. Office detail stays out for a non-office reader. The sort puts the newest first and blanks last. The before-the-move filter works, a title opens its document, and every cell on screen is a cell of the report. The print heading says "documents". Each of the six shelves wires both the report and the view.
- **Proven to catch:**
  - sorting dates oldest-first fails it;
  - letting the record ignore the reader's role, with the report reading the stored path, fails three tests.
- `document-record.test.jsx` (32) still passes.

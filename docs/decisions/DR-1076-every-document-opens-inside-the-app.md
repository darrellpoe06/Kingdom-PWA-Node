# DR-1076: Every document opens inside the app — one viewer for every shelf, and a missing file is named as missing

**Date:** 2026-10-16
**Status:** accepted
**Tier:** B (family- and church-facing; how every stored document is read)
**Type:** way
**Area:**
- `app/src/lib/document-viewer.js` (new — the kind of a document, signing a storage path while keeping the reason, fetching the bytes with a hard wait, a Word file read through the app's own zip reader, pdf.js loaded lazily)
- `app/src/components/DocumentViewer.jsx` (new — the viewer, on the shared `Modal`, and the `useDocumentViewer()` hook every shelf uses)
- `app/src/components/Choir.jsx`, `Pulpit.jsx`, `ChurchMemberSpace.jsx`, `HouseholdSpace.jsx`, `Legal.jsx` (each shelf's OPEN now opens the viewer)
- `app/src/lib/choir-sync.js` (`TEAM_DOCS_BUCKET`, `SERMON_DOCS_BUCKET` exported so the bucket name lives in one place)
- `app/src/__tests__/documents-open-inside-the-app.test.jsx` (new, 22); `open-document.test.js` (its surface pin now holds the new rule)

**Grounds:** Darrell, 2026-10-16, on Choir → Team Docs, with "could not be opened" under three documents in a row: **"No one of the documents can be opened inside the PoeTech App.... why not!!!!????!!!! Fix it !!!! Make sense.... get a understanding of the system's first..."**, then **"I tried the first 3 documents.... None worked... all had the same results..."**, then **"We are supposed to be a one place to see all types of documents... make sense?!!!!!!!"**
**Principles:** DR-0065 (the app is the primary artifact: a capability that can live in the app does); DR-0076 §1 (no claim without evidence: the viewer was driven in a real browser), §8 (the reason is said, not guessed); DR-0317 (the repoint moved the rows, not the blobs); DR-1062 (the tap that opens a file, which this replaces for documents); DR-0111.

---

## Context

He asked for the system to be understood first, so it was traced before anything changed. A document's OPEN on any of five shelves (team documents, sermon documents, a member's own papers, the household shelf, the legal shelf) asked the database server to sign the stored path, then sent a browser tab to the signed link. Two separate things were wrong.

1. **The files are not on the church server.** The repoint to the sovereign stack (2026-08-19) moved the document *rows* and not the *files* (DR-0317). The private buckets can only be copied with the hosted project's service key, and the value placed in `agent.env` is not a key: `nas-storage-sync` run 38957028955, dispatched today for `church-team-documents`, reports `hosted key in agent.env: not-a-key` (57 characters, a control byte inside, hosted answers "Invalid Compact JWS") and `church-team-documents is PRIVATE and cannot be read without HOSTED_SERVICE_ROLE_KEY - nothing copied`. The same run names the other withheld buckets: `church-documents`, `family-documents`, `legal-documents`, `sermon-documents`, `tlc-onboarding`. So every signed link failed with "Object not found", and the screen told him his *account* might not have access — which was not the reason.
2. **No document was ever shown inside the app.** Even a file that exists was "opened" by leaving the app for a browser tab. That is not one place to see all types of documents.

The first is a missing value only he holds; the second is the app's to fix, and is fixed here.

## What was measured

- The three documents he tapped fail the same way because every row of `choir_team_documents` is a storage path into a bucket whose files were never copied (DR-0317's table: 322 objects, 40 MB).
- The copy job's last success (run 36072894624, 2026-09-24) copied the public gallery only; every private bucket was withheld for the same not-a-key reason. Today's run measured the same.
- pdf.js (`pdfjs-dist`) is already a dependency, loaded lazily by `books-intake-read.js`; the app already has a native zip reader (`tv-time-import-zip.js`, DecompressionStream). A Word file is a zip with `word/document.xml`, so it can be read with no new dependency.
- Driven in real Chromium (a temporary page mounting the real `DocumentViewer`, removed after): a two-page PDF drew both pages (the centre pixel is the black square the test file paints); a .docx showed its title and paragraph; a picture filled the sheet; a missing file showed the not-on-the-server sentence; Escape closed it; zero browser errors.

## Impact

- Tapping OPEN on any of the five shelves now opens the document inside PoeTech: PDFs as pages (five at a time, then "Show more pages"), pictures, Word files as their paragraphs and tables, text files as text. An old binary `.doc` and a link to another website say what they are and offer "Open in a new tab" and "Save a copy"; nothing is a silent blank.
- When a file is not on the server, the sheet says exactly that and stops blaming the person's sign-in. Access refusals, a silent server (15 s) and a dropped connection each get their own sentence.
- The documents he tapped will open the moment their files are on the church server; nothing else in the app has to change for that.
- The viewer rides the shared `Modal` (portalled to the page body, focus trap, Escape, scroll lock, focus returned to the OPEN that was tapped), so no shelf can clip it.

## Decision

1. One viewer, one hook, five shelves. Each shelf passes its title, the file name, and a resolver that signs its own bucket (`signStorageDocument(BUCKET, path)`); the bucket names come from each shelf's own sync module.
2. The signing keeps the storage error's meaning (`not-on-server`, `no-access`, `timeout`) and the screen states it. A data url or an outside link passes through unsigned.
3. No new dependency: pdf.js is the one already bundled; Word files go through the app's own zip reader and the browser's XML parser.
4. The file copy stays the lane it is (`nas-storage-sync.yml`, `storage_sync.py`), gated on the one value only Darrell holds. This record does not move the hosted project's service key through CI; that was decided against on 2026-09-23 and is not reopened here.

## Verification

- `documents-open-inside-the-app.test.jsx` (22): the kind from content type, name and data url; where a url lives; a missing object is named not-on-server and the old access-blaming sentence is gone; refusals and silence are named; data urls and outside links pass unsigned; a 400/404 fetch is the missing file, 403 access, a throw the network; a Word file's headings, paragraphs (tabs kept, empty runs folded) and table rows, from a real .docx built with the app's own zip writer; on screen: missing file with no dead buttons, picture, text, Word, PDF five pages then seven, old .doc and an outside link with their ways out, Close and Escape; all five shelves import the viewer, sign their own bucket, render it, and no longer reserve a tab; the viewer rides `Modal`.
- `open-document.test.js`: its surface pin now holds that no shelf opens a tab after an await and every shelf uses the viewer.
- The 22 existing suites that read the five shelves (298 tests) pass; lint clean; ui-standards 0 regressions; contrast, legibility, consistency, no-prompt and inline-colour guards pass.
- `re-review: 2026-10-23` — open three team documents on the live app once the private buckets are copied, and read the copy job's verdict for every private bucket.

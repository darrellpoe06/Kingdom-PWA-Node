# DR-1088: A filed Order of Service is the steward's starting point

**Date:** 2026-10-17
**Status:** accepted
**Tier:** A (it fills an editable box only a steward sees; nothing is written until the steward inserts)
**Type:** way
**Area:**
- `app/src/lib/order-from-document.js` (new): read a filed order's own words
- `app/src/components/ServiceProgram.jsx`: the steward's import form offers the filed orders; the team documents are subscribed only for those who can edit
- `app/src/lib/help-content.js` (`church:program`)
- Test: `app/src/__tests__/order-of-service-from-team-docs.test.jsx` (new)

**Grounds:** Darrell, 2026-10-17: **"Open Order of Service documents inside the space/tab/fields as an editable starting point... as options for users with those privileges... make sense..."**
**Principles:** DR-1085 (every document carries its own record); DR-0076 (no claim without evidence; §3 proven-to-catch); the Order of Service paste import (`order-import.js`: every segment traces to a line, and skipped lines are shown)

## Context

The church office emails the weekly Order of Service as a Word file or a PDF, and it lands on Choir → Team Docs. The Order of Service tab can already turn pasted text into segments, with a preview before anything is inserted. A steward still had to open the document, copy it, switch tabs and paste.

## What was measured

| | |
|---|---|
| Where the order arrives | Choir → Team Docs, type `order-of-service` (`choir_team_documents`) |
| Who can build the order | stewards only (`isStewardEditing`; owner and admin write, per 0041) |
| Text reading in the app | Word: `readDocx` (the viewer). PDF: `readPdf` (Books intake; it reads scanned pages by OCR) |
| Turning text into segments | `parseEmailOrder`, with a preview and skipped lines shown |

## Decision

1. **The steward's import form offers the filed orders**, newest first, and only those with a file. "Load it here" reads the document's own words into the same editable box the paste uses. The preview shows the segments, and nothing is saved until the steward taps Insert.
2. **Only those who can edit see it.** The form sits inside the steward controls, and Team Docs is subscribed only when the reader can edit.
3. **A file that cannot be read says why** (not on the server, refused, timed out, or no readable words) and leaves the box as it was. Nothing is guessed.
4. The button reads **"From Team Docs or email"**, and the paste box stays below for an order that only came in the body of an email.

## Impact

Monday's order becomes Sunday's starting point in two taps, and the steward edits it in the fields the whole team already reads. Orders filed before the 2026-08-19 move are listed, but say their file is not on the church server until the file copy runs.

## Verification

- `order-of-service-from-team-docs.test.jsx` (10 tests), on the live surface (`ServiceProgram` rendered):
  - only filed orders with a file are offered, newest first;
  - the document's own words land in the box, and the preview recognizes 6 segments with the scripture reference;
  - a file not on the server says so and leaves the box empty;
  - a member who cannot edit is never offered it.
- On the reader:
  - Word paragraphs and table rows become one line each;
  - a PDF reads through the Books text layer;
  - the viewer's refusal reasons pass through;
  - a picture is never filled in;
  - a real Word body (`docxXmlToBlocks`) reads to its lines.
- **Proven to catch:**
  - showing the steward controls to everyone fails the member test;
  - filling the box on a failed read fails the not-on-server test.
- `service-program-sections`, `service-program`, `order-import` and `member-surfaces-every-control-acts` still pass.

# DR-1085: Every document carries its own record — what it is, where it came from, when, and where it lives

**Date:** 2026-10-17
**Status:** accepted
**Tier:** B (what every shelf shows about a document, and to whom)
**Type:** way
**Area:**
- `app/src/lib/document-record.js` (new — the record builder for five shelves, the presence line, the fingerprint, the saved record)
- `app/src/components/DocumentViewer.jsx` (the record panel beside the document; "Save this record")
- `app/src/components/Choir.jsx`, `Legal.jsx`, `Pulpit.jsx`, `ChurchMemberSpace.jsx`, `HouseholdSpace.jsx` (each passes its row's record and who counts as office)
- `app/src/lib/choir-sync.js` (`toTeamDocShape` keeps `email_id` and `updated_at`, columns since 0022 that the shape dropped)
- `docs/99-session-notes/2026-10-16-research-review-what-is-proprietary-and-how-to-make-it-official.md` (§10: the hosted-project advice corrected)
- `app/src/__tests__/document-record.test.jsx` (new, 23)

**Grounds:** Darrell, 2026-10-17, on Choir → Team Docs over "“06 JUNE 2026 CALENDAR” is listed, but the file itself is not on the church server": **"We also need the apps documents or documentation to be presented in the system with all relevant information and details that matter. The data in the location and a screenshot or visual of where it came from and a timestamps for obvious reasons... Like add them as an archive in the current system we built based on those documents."** Then: **"we make intuitive systems to remind ourselves of our businesses needs while keeping them organized... just in case"**, and **"Only certain information should be available to different types of users of course.... even personnel need to be able to be allowed to or not allowed to be in these records... Administrative procedures are for certain personnel."**
**Principles:** DR-1078 (one viewer for every shelf); DR-0317 (the repoint moved rows, not files); DR-0061 / P15 (a surface is a live view of real state); DR-0076 (no claim without evidence; absent is not zero); DR-1076 (the paper is the tick); DR-1077 (a household shares only on the filer's word)

## Context

DR-1078 made every document open inside the app and named a missing file as missing. It said nothing else about the document. A reader of "06 JUNE 2026 CALENDAR" could not see that it came in an email from Bishop Gwin, which email, when it was filed, or why its file is missing. The rows held most of that already. `choir_team_documents` has carried `document_source`, `email_id`, `created_at` and `updated_at` since 0022, and `toTeamDocShape` dropped two of them.

## What was measured

| | |
|---|---|
| The calendar's row | `document_source = 'email'`, a Message-ID, filed 2026-06-14, a storage path in `church-team-documents` |
| The one writer of emailed team documents | `scripts/sermon-import/import-team.mjs`, reading only `bg@thechurchofthelivinggod.com` from the mrspoe06 mailbox |
| Why the file is missing | DR-1078: the private buckets were never copied after the 2026-08-19 move; 322 objects, about 40 MB, on the hosted project; the key in `agent.env` is not a key |
| Darrell's own mailbox | No email from that sender with an attachment (Gmail search, 2026-10-17). The source mailbox is mrspoe06 |
| The hosted key on Darrell's PC | `import-team.mjs` reads it from `C:\Users\dpoe\.poetech-secrets\supabase-service.txt` |

## Decision

1. **Every document opens with its record beside it.** It shows what it is, where it came from, when, and where it lives. Each value comes from the row its shelf loaded. A missing value is left out or said "not recorded", and nothing is guessed.
2. **Where it came from is shown as a picture of the source.** For an emailed document, a card in the shape of the email shows its sender, subject and Message-ID. The card says the sender comes from the import, which reads only that address.
3. **The presence line reads what the server just answered.** A missing file filed before 2026-08-19 says its original is on the old hosted server and comes across when the file copy runs.
4. **The fingerprint is the SHA-256 of the bytes as opened.** It lets any later copy be proven to be the same file.
5. **"Save this record" downloads the record as text, timestamped.** That is the archive copy, kept just in case.
6. **Who sees what.** Whether someone can open a document at all stays the database's call. Of what they can open, the stored path and the Message-ID show only to the office or the filer. Everyone else sees what it is, where it came from, and when. The default is the narrow record.

## Impact

The calendar in the screenshot now explains itself:
- **What it is:** an emailed calendar, dated 2026-06-01, filed 2026-06-14.
- **Where it came from:** Bishop Gwin's address, by way of the import.
- **Why it is missing:** its original is on the old server and waits on the copy.

Every other document on the five shelves shows the same record. The research review's advice to close the hosted project is withdrawn. That project holds the only copy of those 322 files, so it stays until the copy reports GO.

What this does not do:
- It does not bring the missing files across. That waits on one value only Darrell holds, the hosted service key on the NAS. It is now one pasted command from a file already on his PC.
- It does not record anything the rows do not hold. There is no per-document uploader name, and no capture of an email's received time beyond when it was filed here.
- There is no single cross-shelf archive list. Each record lives with its document.

## Verification

- `document-record.test.jsx` (23). It covers:
  - the calendar's row becomes its record field for field;
  - the email card's sender is pinned to the import script's own constant;
  - an uploaded row gets no email card, no Message-ID and no invented change time;
  - a data URL is not called a file;
  - the presence line names the move only for an old row;
  - SHA-256 of "abc" is the published test vector;
  - the saved text carries every section, the state and the fingerprint;
  - on screen, a missing file shows its record and says it once, a present file is fingerprinted, and with no record the viewer is unchanged;
  - all five shelves pass their record;
  - a roster member's record and saved text omit the stored path and Message-ID, and the office's include them.
- Proven to catch: flipping the default to show office detail fails three cases.
- `documents-open-inside-the-app.test.jsx` (22), `choir-sync.test.js` (85) and `legal-shelves-render.test.jsx` (11) still pass. `eslint` is clean.

**re-review:** 2026-10-24, or the day `nas-storage-sync` reports `verdict GO`: open the calendar again and read its fingerprint.

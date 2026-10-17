# DR-1086: Same system, different authority — and the papers that were open to anyone

**Date:** 2026-10-17
**Status:** accepted
**Tier:** B (who can read the family's tax returns, the church's shared papers, and the business shelves)
**Type:** way
**Area:**
- `infra/nas-tax-ingest/tax_auth.py` (new), `tax_upload_server.py`, `install.sh`, `test_tax_auth.py` (new); `.github/workflows/ci.yml` (a CI step)
- `app/src/lib/tax-archive.js`, `app/src/components/BooksTaxes.jsx` (the keyed read; returns open in the viewer)
- `infra/supabase/migrations-auto/0300-the-office-opens-what-a-member-shared.sql`, `infra/supabase/tests/0300-office-opens-shared-smoke.sql` (new); `.github/workflows/rls-isolation.yml` (leg `church-office-files`)
- `app/src/modules/properties/DoorTabs.jsx`, `app/src/components/TlcOnboardingReadout.jsx` (open in the viewer); `app/src/lib/document-record.js` (property, onboarding and tax records)
- `app/src/lib/choir-sync.js` (a sermon's document keeps its record)
- `docs/99-session-notes/2026-10-17-comprehensive-review-family-business-church-documents.md` (the ten-dimension review)
- Tests: `church-office-files.test.js`, `sermon-document-keeps-its-record.test.js` (new); `books-taxes-render.test.jsx`, `document-record.test.jsx`

**Grounds:** Darrell, 2026-10-17: **"the church is different from the place where PoeTech App should keep family documentation... vs business documentation... vs church documentation... Comprehensive evaluation of the evidence"**, then **"Or can they be in the same places... but look different.... same system... just higher or different authority... thoughts?"**, then **"Only certain information should be available to different types of users... even personnel need to be able to be allowed to or not allowed to be in these records."**
**Principles:** IDENTITY-ROLES-AUDIT (one data model; roles + scope + duration); LEGAL-PRIVACY-BOUNDARY (four areas inside one tab); COMPREHENSIVE-REVIEW-STANDARD (the ten dimensions); DR-0076 (no claim without evidence; §3 proven-to-catch); DR-1077; DR-1078; DR-1085

## Context

An inventory of every place the app keeps people's documents found eight stores across the family, three businesses and the church. They used one model, but it was not applied evenly. Two of them let the wrong people in or kept the right people out, three opened documents outside the app, and one erased its own record on every save.

## What was measured

| | |
|---|---|
| `/taxes` on the NAS | Mounted on the **public** Funnel (`install.sh:102`) and proxied same-origin from the site (`app/functions/taxes/[[path]].js`) |
| `GET /taxes/archive.json`, `GET /taxes/files/...` | No auth check (`tax_upload_server.py`, before this change); the index lists every return's file name |
| `POST /taxes/upload` | Checked the bearer only `if TOKEN:`, so it was open on a box with no token |
| `church_documents` | The row admitted the office for a shared paper (0209:292-300); the file's storage policy admitted only the filer's folder (0209:325-329) |
| Property papers, onboarding files, tax returns | Opened by a download link, by `window.open`, and by a bare link |
| `saveSermonDocument` | Deleted and re-inserted on every sermon save |

## Decision

1. **Same system, different authority.** This is the house's existing rule, applied evenly. A document belongs to one space, and a person's role in that space decides what they see. The office or the filer sees administrative detail (DR-1085), and the household sees only what its filer shares (DR-1077).
2. **The tax archive asks for the family key on every route.** No configured token means nobody gets in. The health probe stays open, says nothing about the family, and no longer prints paths. The app sends the key, and a refused read says the NAS kept the returns private.
3. **The office opens what a member shared.** 0300 adds one storage read rule, through a definer function that admits exactly what the row already admits.
4. **Every business and tax shelf opens in the app's viewer**, with its record. A property paper shows the fingerprint recorded when signatures were requested, labelled as the hash of the stored entry and never compared with the opened bytes.
5. **A sermon's unchanged document is left alone** on save.

## Impact

Family tax returns can no longer be read by anyone who finds the route. The church office's Open on a shared paper works. Every document the app holds, in every space, now opens the same way and explains itself.

What this does not do, each with its own reason:
- **There is no PoeTech business space.** Creating one is a new identity (its name, and who sits in it), so it is Darrell's decision. The recommendation is in the review.
- **Who sees shared family papers is unchanged.** Narrowing it to owner, admin and member, as 0299 does for legal papers, is recommended. Who counts as personnel is his call.
- **Workers' access to tenancy papers is unchanged.** It is a landlord's decision, and the recommendation is in the review.
- **The 322 pre-move files are not copied.** That needs the hosted key, a value only Darrell holds.

## Verification

- `test_tax_auth.py` (5), run in CI. It checks the right bearer, refuses a missing token for everyone, and refuses `Bearer ` against an empty token. Every route but health asks; health carries no paths. Proven to catch: removing the fail-closed line fails it.
- `books-taxes-render.test.jsx` (+2). Every read carries `Bearer`, a file read carries it, and a return opens in the viewer with its record. A refused read says "kept your returns private", never "No returns indexed yet". Proven to catch: dropping the header fails it.
- 0300, on PostgreSQL 16, applied twice: `OFFICE OPENS SHARED SMOKE: PASS`. Admitting a member fails it, and ignoring the share flag fails it. 0299's smoke still passes beside it.
- `church-office-files.test.js` pins the text and the leg.
- `document-record.test.jsx` (32) covers the property, onboarding and tax records, and pins that the three shelves no longer send a document out of the app.
- `sermon-document-keeps-its-record.test.js` (3). Proven to catch: removing the unchanged check fails it.
- 139 test files (2,120 tests) across TLC, properties, doors, signing, documents, tax, legal, choir and household pass.
- The migration prose, replay order, return type and replay completeness guards pass, as do the tenancy and assistant-scope guards, and the interconnect guard with the flow graph at 0 findings.

**re-review:** 2026-10-24: walk each shelf on Darrell's phone, read the two new isolation legs, and read `nas-storage-sync`'s verdict.

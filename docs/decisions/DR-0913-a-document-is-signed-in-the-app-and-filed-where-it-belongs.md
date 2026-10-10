# DR-0913 — A document is signed in the app and filed where it belongs

**Date:** 2026-10-10
**Status:** accepted
**Area:** Poe Properties: Files, Documents, the tenant's papers, pictures on work orders (migration 0263)
**Principle:** DR-0350 / 0194 / 0199 (the house's signing pattern: typed name, attestation, version, e-sign consent, device and server clocks), DR-0076, DR-0060, DR-0899 (the clock), the counsel rule in `documents.js` and `lease-template.js`

## Context

Darrell, 2026-10-10, on the Files tab of 805 North Prospect Avenue Apt 2:

> "Documents should be able to work integrated with the options to digitally sign... so all necessary documents are populated into their respective places... also have paper documents we can upload to keep as records for tenants... make sense?"

Then:

> "Make sure tenants can upload receipts etc to share with us... pictures for documentation etc... so we can see what everyone is doing and mean... make sense?"

and

> "For workorders... etc..."

**SHOULD.**
- A lease or any paper can be sent for signature, signed by the tenant and the landlord in the app, and stays filed in its tenancy.
- A tenant shares receipts, pictures and papers with the family.
- Pictures can sit on work orders.
- Everything carries its time.

**ARE.**
- `property_documents` (0154) holds a door's and a tenancy's papers, and RLS lets the tenancy's household read them. The table's own comment says "a document has a signer", but there was no signer column, no signature, and no request.
- Generated drafts (`documents.js`) were shown in a `<pre>` and never saved.
- Tenants had no Documents tab at all.
- Work orders carried no pictures.

## What was measured

- 0154: no sign columns. The column-level UPDATE grant covers only title, note, kind, effective_on and archive. The tenant insert arm (`user_is_tenant(tenancy_id)`) already exists.
- `documents.js` and `lease-template.js` say a generated draft is "not ready to sign" until counsel reviews it (`TEMPLATE_STATUS.reviewed: false`).
- `TENANT_TABS` had no papers tab. `loadDocuments` read by `rental_ref` only, so a tenant's own upload, which carries only its tenancy, would never reach the landlord's view.
- 0075's `request_documentation` allows a tenant's insert on their own request, and `outcome` is nullable, so a picture can be documentation with no outcome.

## Impact

Leases and notices were signed outside the app, with no record in it. A tenant's receipt or picture reached the family only by text message, and no picture could live on a work order.

## Decision

1. **Ask, then sign: the house's own pattern** (0263).
   - The family asks for signatures (`property_document_request_signatures`): the tenant, the landlord, or both. The database fingerprints the stored bytes with SHA-256.
   - Each signer signs (`property_document_sign`) with the fingerprint of what their screen showed. The signature includes a typed legal name, the read-in-full attestation and the e-sign consent (`tlc-signing.js`), plus device time and server instant.
   - The database refuses a different version, the wrong person, and a second signature.
   - When everyone required has signed, the paper is **signed**. It stays in the tenancy it was filed to, so it is in the tenant's Documents and the door's Files without being copied.
2. **Nothing on the client forges a sign state.** A BEFORE INSERT trigger blanks the sign columns. They are outside the UPDATE grant. Signatures are an append-only table that nobody can edit or delete.
3. **The counsel rule stands, and becomes operable.** A generated draft can be sent only with the family's recorded attestation that counsel reviewed it; who and when are kept on the row. An uploaded paper is the family's own and needs no attestation. This keeps the standing rule and gives the governor the switch, instead of the app deciding the legal question.
4. **The clock covers papers.** `record_events` (0262) adds the subject `document`: a request, each signature, and completion.
5. **The tenant's papers.**
   - A new **Documents** tab for tenants lists their tenancy's papers, with anything awaiting their signature first.
   - Tenants can file their own papers, by camera or file: a receipt, a picture for the record, a letter or notice, renter's insurance, or other.
   - Each upload is marked "filed by the tenant", with the time.
   - The family's Files tab gains **Papers and signatures**, covering the door's papers and every tenancy's, the tenants' uploads included.
6. **File the draft where it belongs.** The Documents tab's "File this draft to the tenancy" saves a generated draft as a text paper in that tenancy, marked generated, ready to send under the counsel rule.
7. **Pictures on work orders.** "Add a picture" sits beside File it, and "Add a picture to this job" sits on every open job.
   - The tenant, the worker and the family can all use it.
   - The picture is shrunk on the phone and saved as `request_documentation` with no outcome. Its scope comes from the request (0260).
   - It shows on the board with its time.

`re-review: 2026-10-24` — on the live app: file a lease to a tenancy, send it, sign as the tenant from a tenant seat and as the landlord, and read both signatures with their times. A tenant files a receipt and the family sees it. A tenant adds a picture to their work order and the family sees it.

## Verification

- **The database.** `infra/supabase/tests/0263-document-signing-smoke.sql` runs in the `door-work` CI leg after 0263 applies twice. That leg now replays the real chain through 0152-0154, with `scripts/door-work-ci-rentals-shape.sql` supplying schema-v2.13's rentals columns. The smoke also runs in the live rls-isolation poe-properties leg. It proves:
  - a tenant's upload never arrives signed;
  - only the family sends a paper for signature;
  - a generated draft is refused without counsel's attestation and kept with it;
  - another door's tenant, a wrong version, a tenant signing as landlord, and a second signature are each refused;
  - nobody writes the sign state directly;
  - the landlord's signature completes the paper, which stays in its tenancy;
  - signatures are read where the paper is read, and nobody edits or deletes one;
  - the request, both signatures and completion are on the clock;
  - a tenant adds a picture to their own work order and never to another door's, and the family sees it.
  - Measured locally on PostgreSQL 16.15, from an empty database through the exact CI leg: all four smokes pass.
- **Proven to catch.** Five breaks each failed by name, and re-applying 0263 restored PASS:
  - dropping the insert trigger;
  - granting UPDATE on `sign_status`;
  - opening the signature read policy;
  - removing the counsel check;
  - removing the version check.
- **The fingerprint.** The browser's SHA-256 equals PostgreSQL's `encode(sha256(convert_to(...,'UTF8')),'hex')` on the same string, measured: `63134db4…27bf` for both.
- **The app.**
  - `app/src/__tests__/doc-signing.test.jsx` (7 tests): the fingerprint, the words, the generated draft as text; the tenant signs with the shown fingerprint after both agreements and a name; the tenant files a receipt marked as theirs; the family sends a paper; and, proven to catch, a generated draft cannot be sent until counsel's review is recorded.
  - `properties-work-on-any-door.test.jsx` gains two tests: a report filed with a picture lands it on the new job as no-outcome documentation, and a picture on a job shows with its time.
  - The tenant tabs pin in `properties-door.test.js` now includes `papers`.
- **The flow graph.** The `doc-signing` node is declared, with 0 findings.

## Addendum, 2026-10-10: the sign state is walled on UPDATE too, and this record was renumbered

- **Renumbered.** This record was written as DR-0901. #2097 merged its own DR-0901 on main first, so this one is DR-0913, with every reference renamed.
- **The hole.**
  - The insert trigger made every new document arrive unsigned, but nothing guarded an UPDATE.
  - With production's table grants, the owner's own UPDATE policy let them set `sign_status = 'signed'` on a lease nobody had signed.
  - The door-work CI chain gave the API roles no table grants at all, so the smoke's "the owner wrote the sign state directly" check passed on a missing privilege, not on a wall.
  - It surfaced when DR-0912 added production's default privileges to `scripts/door-work-ci-bootstrap.sql` (before the chain, as `infra/nas-supabase/replay_migrations.sh` sets them).
- **The wall.** `property_documents_sign_state_on_update` refuses any change to the fingerprint, sign status, required signers, request, counsel attestation or signed time when it comes from `anon` or `authenticated` directly. The two SECURITY DEFINER functions still move it, because inside them `current_user` is their owner.
- **Verification.**
  - The whole door-work leg passes locally under production's grants: all ten smokes, 0260 to 0270.
  - **Proven to catch:** with the trigger dropped, the 0263 smoke fails "the owner wrote the sign state directly"; restored, it passes.
  - The app never writes these columns directly (searched: no `sign_status`, `signed_at`, `content_hash`, `signers_required` or `counsel_attested` write outside the RPCs).

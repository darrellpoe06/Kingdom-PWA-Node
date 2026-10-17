# 2026-10-17 — Comprehensive review: family, business and church documents

**Type:** comprehensive review (Layer 4), run against the ten dimensions of `docs/00-foundations/_root/COMPREHENSIVE-REVIEW-STANDARD.md`
**Prompted by:** Darrell, 2026-10-17. Four messages:
- *"Documents for the users work for them... obviously the church is different from the place where PoeTech App should keep family documentation... vs business documentation... vs church documentation... Comprehensive evaluation of the evidence and make sure it works Comprehensively effectiveness with current and development plans."*
- *"Or can they be in the same places... but look different.... same system... just higher or different authority... thoughts?"*
- *"Only certain information should be available to different types of users... even personnel need to be able to be allowed to or not allowed to be in these records."*
- *"we make intuitive systems to remind ourselves of our businesses needs while keeping them organized... just in case... and have the ability to get changes to the systems asap."*

**Records:** DR-1085 (every document carries its own record), DR-1086 (this review's fixes).

---

## The answer to "separate places, or the same place with different authority?"

**Both, and the house already decided which is which.** The answer is one system: one viewer, one record, one data model. Every document belongs to exactly one **space**: the family, a business (Poe Properties, TLC Therapy Solutions, Moore Divahs), or the church. Your **role in that space** decides what you see and what you can do.

- **SHOULD:** `IDENTITY-ROLES-AUDIT.md:30-32`. "The same data model holds whether the instance has 1 user (a family head) or 10,000 users." At `:38`, roles are scoped per module. At `:76`, a specialist is "roles + scope + duration", with no special role types.
- **SHOULD:** `LEGAL-PRIVACY-BOUNDARY.md:21-23`. Personal, real estate, business and tax are areas inside one Legal tab, as filters, not separate apps.
- **ARE:** every document table carries an `instance_id` (its space), and row-level security reads the reader's role in that space. Higher authority sees more of the same records: the office sees the stored path and Message-ID (DR-1085), and the household's owners, admins and members see a paper only when its filer shares it (DR-1077).

**So documents live in the same system and look different by authority.** What must never happen is a document sitting in the wrong space. That is the one structural gap (finding 4).

## The inventory (measured 2026-10-17)

| Store | Space | Who reads | Opens in the app's viewer? | Provenance |
|---|---|---|---|---|
| Legal papers (`legal_documents`) | family | the filer; the household only if shared (DR-1077) | yes | filed, changed, document date |
| Household papers (`family_documents`) | family | the filer; the household if shared or released for sorting | yes | filed, changed, dated, expires, arrival, routing |
| A member's church papers (`church_documents`) | church | the filer; the office if shared | yes | filed, changed |
| Team documents (`choir_team_documents`) | church | the choir | yes | dated, filed, changed, source, email id |
| Sermon documents (`choir_sermon_documents`) | church | owner and admin | yes | source, filed (reset on every save until DR-1086) |
| Property papers (`property_documents`) | Poe Properties | management; the tenant household; enabled workers and delegates | **no** before DR-1086 | filed, effective, source, signing fingerprint |
| Onboarding files (`tlc-onboarding`) | TLC | the colleague; the office | **no** before DR-1086 | client-reported upload time |
| Tax returns (NAS archive) | family (by entity) | **anyone** before DR-1086 | **no** before DR-1086 | year, kind, entity; no filing time |

## The ten dimensions

1. **SHOULD/ARE.** The SHOULD is quoted above. The gaps are findings 1–8 below.
2. **Journey walks.** Walked through jsdom render tests, not on a real device:
   - Christina shares a reinstatement paper and Darrell's checklist moves (DR-1077).
   - The office opens a member's shared paper. This failed before 0300.
   - A family member opens a tax return. Before DR-1086 the link was public and carried no key; it now uses the key and opens in the viewer.
   - Christina opens a colleague's onboarding file. It used to open a new tab; it now opens in the viewer.
   - A landlord opens a lease. It used to download; it now opens in the viewer.
   - A choir member opens the June calendar. The record explains why its file is missing.

   **Not walked on a real phone in this session.** It is carried as a re-review: open each shelf once on Darrell's phone after merge.
3. **Surface says truth.**
   - The Taxes screen used to read every refusal as "could not reach your NAS". It now says the NAS kept the returns private when the key is missing.
   - The onboarding viewer no longer claims a file is "not on the server" when the signer simply failed.
   - The public health probe no longer prints filesystem paths.
   - A property's fingerprint is labelled as the hash of the stored entry. It is never compared to the opened bytes, because the two hash different things.
4. **Form-factor sweep.** **Skipped.** The record panel uses the existing viewer sheet with one responsive grid. It was not measured at phone, tablet and laptop widths, because the CI layout probe does not open the viewer. Re-review on the phone walk in dimension 2.
5. **Delivery context and the DR-0108 channel check.** One step is genuinely Darrell's: the hosted service key. It is a secret that lives in a file on his PC (`C:\Users\dpoe\.poetech-secrets\supabase-service.txt`, read by `scripts/sermon-import/import-team.mjs`). No channel reaches his PC, and a secret must never pass through a public Actions log. Because the file is on his desktop, this is a desktop moment: one PowerShell line pipes it over SSH into `place_hosted_key.sh`, which validates it against the hosted project before writing. After that, the copy lane is channel-driven: `nas-storage-sync` is dispatchable from Actions.
6. **Findings are a work queue.** See the table below. Every finding is either DONE with evidence, or CARRIED by a named blocker.
7. **Gate the class.** Each fix leaves a gate:
   - `test_tax_auth.py`, a new CI step: every route asks for the bearer, fail-closed, path-free health.
   - `church-office-files.test.js`, plus the `church-office-files` rls-isolation leg.
   - `document-record.test.jsx`, which pins that no shelf sends a document out of the app.
   - `sermon-document-keeps-its-record.test.js`.
   - `books-taxes-render.test.jsx`, the keyed read.
8. **The Word's own accuracy.** **Not applicable.** No Scripture-bearing content was touched.
9. **The surface is not hollow.** The record panel's content is proven on screen from real row shapes, in `document-record.test.jsx`. The calendar's own row renders its email card, its dates and the reason its file is missing.
10. **Continuity.** `interconnect-guard` and the flow graph are green: 183 nodes and 0 findings. The Legal shelf's node, added by DR-1076, covers `legal_documents`. Live numbers from `system_flow_proof` cannot be read from this sandbox; the CI `system-flow-proof` leg reads them.

## Findings — each DONE or CARRIED

| # | Finding | State |
|---|---|---|
| 1 | **The tax archive was public.** `/taxes` is on the public Funnel and proxied from poetech.us. The index (every return's file name) and the return PDFs had no auth check; only upload checked a bearer, and only when one was set. | **DONE** (DR-1086): every route asks for the bearer, fail-closed; the app sends it; health is path-free. Live once the NAS pulls (install.sh restarts on the code checksum). |
| 2 | **The church office could not open papers a member shared with it.** The row admitted the office; the file's storage policy did not. | **DONE**: migration 0300 and its smoke, proven locally with two mutations caught; live leg `church-office-files`. |
| 3 | **Property papers, onboarding files and tax returns opened outside the app** (download link, new tab, bare link). | **DONE**: all three open in the viewer, with their records. |
| 4 | **PoeTech's own business papers have no business space.** There is no PoeTech instance, so the Business category on the Legal shelf files into the family space (`table-sync.js` default instance). The Books upload also files business statements as family `money` papers. | **CARRIED, Darrell's decision.** Creating a space is a new identity: its name, and who sits in it. **Recommendation:** a "PoeTech" business space with Darrell as owner and Christina as admin, made when the LLC's reinstatement paper is on the shelf, with the Legal shelf filing into whichever space is open. Until then, the household share (DR-1077) is how the two of them keep the plan in step. |
| 5 | **Family papers shared with the household reach every household role, including viewers** (`user_in_instance`). Shared legal papers stop at owner, admin and member (0299). | **CARRIED, Darrell's decision** ("personnel allowed or not"). **Recommendation:** match 0299, so viewers and assistants do not see shared family papers. Released-for-sorting rows already withhold the file by design (0204). |
| 6 | **Enabled workers and delegates can read every paper on a tenancy, including identity verification** (0154). | **CARRIED, Darrell's decision** as landlord. **Recommendation:** workers see work papers only, and identity papers go to management and the tenant. |
| 7 | **Sermon documents lost their record on every save** (delete and re-insert reset the filing time and turned an emailed source into "manual"). | **DONE**: an unchanged document is left alone, test-pinned. |
| 8 | **The 322 files filed before the move are still only on the old hosted server.** | **CARRIED, blocked on the value only Darrell holds.** One PowerShell line from his PC places the key; then `nas-storage-sync` copies every private bucket. **Do not close the hosted project until it reports GO** (research review §10, corrected). |
| 9 | **Tax records carry no filing time; team and property uploads keep the file inside the row.** | **CARRIED** as recorded limits, shown in each record as "not recorded" or "inside the record itself". No date is invented. Revisit if a filing time is ever needed for evidence. |

**re-review:** 2026-10-24: walk each shelf on Darrell's phone; read the `legal-household` and `church-office-files` legs; read `nas-storage-sync`'s verdict if the key has been placed.

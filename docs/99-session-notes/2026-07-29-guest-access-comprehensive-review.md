# 2026-07-29 — Guest access comprehensive review: "What would my brother have access to?"

Trigger: Darrell, two screenshots (Admin → Manage access roles; Messages → Add a contact / GIVE ACCESS): *"What would my brother have access to? Comprehensive review of the workflows and implementation of the best researched solution/s... according to the Ways and documentation."*

Ran as a DR-0239 seven-dimension review over the access/role/invite workflows; three parallel deep-reads (documented intent · RLS/data model · member-visible surfaces), every claim with `file:line`. Decision record: **DR-0241**. Review record: **REV-0213**.

## The answer (before the fix)

Both invite flows — the Admin one-time link and the Messages GIVE ACCESS — landed a guest in **poe-family as `member`** (Messages hardcoded it; Admin defaulted to it; the space picker was ignored server-side). At the database layer that meant:

- **Read AND write** the entire family ledger — entities, accounts, transactions, debts, projects (`0100-assistant-role-and-books-rls.sql:66-85`; UPDATE unscoped by creator).
- **Read AND write** rentals, renter PII, leases, rent payments (`schema-v2.2-rentals.sql`), `contractors_1099` **including DELETE** (`schema-v2.13:81-84`), and the whole `family_snapshots` remainder — buffer fund, inflows/outflows — read, overwrite, **DELETE** (`schema-v2.15:32-41`).
- `viewer` — the label a steward would naturally pick for a guest — was a **no-op role**: zero RLS policies referenced `'viewer'`; a "Viewer" had the same write reach as a member.
- The client UI hid the steward tabs (email-allowlist, advisory) — but PostgREST honors the JWT, not the tabs.

**Properly walled all along:** DMs (participants-only RLS + device-key E2E), Books→Imported PII, `payments`, `member_stewardship`, sermon prep, notes/photos (device-local, stripped from the snapshot), other spaces (`user_in_instance` is the outer wall), and the DR-0187 two-party handshake (token → claim → steward confirm) guarding the door itself.

## The seven dimensions

1. **SHOULD/ARE (DR-0219)** — SHOULD: invites cap at member/admin/viewer, never owner (`FAMILY-ACCESS-PROCESS.md:30,52`); a visiting relative maps to **Viewer, read-only** (`IDENTITY-ROLES-AUDIT.md:45`); "default role too permissive" is a named pitfall (`:170`); least-privilege defaults for every external type (`ECOSYSTEM-PARTICIPANTS.md:82-194`); RLS is the authoritative gate, UI advisory (ROLE-CAPABILITY-MODEL, `DR-0220:35`). ARE: viewer unenforced; "Member (view)" false; picker cosmetic. Four gaps named, all closed or carried.
2. **Journey walks** — the brother's journey walked end-to-end for both flows on both hosts: claim link → sign-in → claim → confirm → what his session actually pulls (`table-sync.js:228-229` pulls the whole instance ledger; `poe-financial-mvp-v28.jsx:1696-1698` applies the family snapshot to a fresh member). Church-only invite lands him in his own instance (safe path, `0119`).
3. **Surface-says-truth** — "Member (view)" / bare "Viewer" taught the granting steward a wrong model at the moment of granting; fixed to **Admin (edit + members) / Member (edit) / Viewer (read-only)** with the Messages copy stating the read-only default. The reviewer-mode lens itself was surface-untruth (previewed real rows as a "fresh user"); its table syncs are now suppressed.
4. **Form-factor sweep** — no chrome/layout change in this set (SQL, gates, labels, one copy line, one nav-gate term); the CI layout probe runs on the push as always. Named skip, carried by the standing CI instrument.
5. **Delivery-context** — nothing here needs Darrell's hands: the migration rides db-migrate on merge; the smoke rides viewer-readonly-isolation on the same event. The one steward habit to adopt is in the answer: **invite guests as Viewer; raise deliberately in Admin.**
6. **Findings are a work queue (two states)** — fixed same-session: viewer overlay + Check E + smoke + workflow + explicit invite target + labels + viewer-default quick-add + home-host gate + reviewer-mode faithfulness. Carried with named carriers: church bare-email second factor (DR-0220 P2, `re-review: 2026-08-11`), member/admin granularity — snapshot/1099 DELETE, unscoped books UPDATE, member-readable audit_log (DR-0220 P6 capability layer, `re-review: 2026-09-15`), smokes → PR-blocking (DR-0224, `re-review: 2026-08-11`).
7. **Gate-the-class** — three new standing witnesses: tenancy-guard **Check E** (static, merge-blocking, proven-to-catch in both directions), the **0125 two-identity smoke** (live, post-migrate, RAISEs on any wrong grant), and the reviewer-mode + Admin-gate **string pins** (`reviewer-mode.test.js` — a revert of either fails the suite).

## The answer (after the fix)

- **As Viewer (the new quick-add default):** read-only sight of that one space's shared records + DM its leaders. No writes, no deletes, no invites, no role changes, no other spaces, no DMs he isn't in, no Imported PII, no payments, no steward tabs, no Admin UI anywhere — including on the house WiFi.
- **As Member (a deliberate Admin choice):** the collaborative family role — read/write the shared records; still no books DELETE, no role/invite powers, no steward surfaces.
- Membership still only materializes through the two-party handshake; a phone-only saved contact (the James Vaughn case, REV-0210) still grants nothing.

## Verification

- `tenancy-guard.mjs` CLI: A–E all PASS (Check E: overlay intact, 0 later tables).
- Targeted suites green: tenancy-guard (13), reviewer-mode (25), member-roles (10), dm-roster-truth (11). Full `npm run verify` on the PR.
- The live half is the standing workflow: `viewer-readonly-isolation.yml` proves the overlay + invite targeting against the real database after db-migrate applies 0125.

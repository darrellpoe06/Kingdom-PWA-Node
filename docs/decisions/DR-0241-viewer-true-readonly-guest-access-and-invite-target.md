# DR-0241 — Viewer becomes truly read-only (the guest role), the invite targets the picked space, and the role labels say the truth

- **date:** 2026-07-29
- **status:** accepted
- **tier:** C (identity/role RLS change — shipped with the live two-identity proof per ROLE-CAPABILITY-MODEL; carry-the-proof per DR-0225)
- **decides:** what an invited non-steward adult (the "brother" case) actually gets, and the machinery that makes the answer true
- **pairs-with:** DR-0060 (tenancy gate), DR-0076 (verification), DR-0187 (two-party invite), DR-0220/0221 (role model + controls), DR-0222 (persona is view, not security), DR-0239 (the review that found this), DR-0104 (reviewer mode)

## The trigger

Darrell 2026-07-29, with two screenshots (the Admin "Manage access roles" dropdown and the Messages "Add a contact" card): **"What would my brother have access to? Comprehensive review of the workflows and implementation of the best researched solution/s... according to the Ways and documentation."**

The seven-dimension review (REV-0213; session note `docs/99-session-notes/2026-07-29-guest-access-comprehensive-review.md`) traced the answer and found the documented intent and the database disagreed in four load-bearing places.

## What was found (the SHOULD/ARE gaps)

1. **`viewer` was a no-op role.** No RLS policy anywhere referenced `'viewer'` — the "Viewer" a steward granted had the same write reach as a member: INSERT+UPDATE on the core books (0100 excludes only child/successor/assistant) and full read/write on every `user_in_instance()`-gated table. The documented posture for a visiting relative — Viewer, read-only (`IDENTITY-ROLES-AUDIT.md:45`, ECOSYSTEM-PARTICIPANTS least-privilege) — existed only as a word in a dropdown.
2. **"Member (view)" was a false label.** `member` reads AND writes the ledger; the label taught the inviter a wrong model at the exact moment of granting (surface-says-truth, DR-0239 §3).
3. **The space picker didn't pick.** `invite_to_instance` ignored the UI's "into which space" choice and re-resolved family-first server-side — picking "PoeTech Business" silently granted the family space.
4. **Admin UI on the home host was session-blind.** `isFamilyMember || !isPublicHost()` gave ANY signed-in account on the LAN/Tailscale host the Admin surface (server RPCs stayed guarded — disclosure, not grant). And reviewer mode — the "see it as a user" lens — still ran the steward's table syncs, merging real family rows into the "fresh user" preview.

## The decision

1. **`viewer` is the platform's read-only guest role, enforced in RLS.** Migration `0125-viewer-true-readonly-and-invite-target.sql` adds a RESTRICTIVE deny-overlay (INSERT/UPDATE/DELETE blocked for role `viewer`) on every RLS-enabled instance-scoped table, via the re-runnable `apply_viewer_readonly_overlay()`. Restrictive policies only narrow — nothing is widened. Self-scoped **participation exceptions** (their own DMs, group messages, feedback, telemetry, settings) are pinned by name so a read-only guest can still talk to a leader and send feedback; each table's own self-scoped policy remains the gate there.
2. **Future tables can't escape the overlay.** tenancy-guard **Check E** fails the build when a migration after 0125 creates an instance-scoped table without re-running the overlay in the same file — proven-to-catch in `tenancy-guard.test.js` (inject a violating migration → FAIL; compliant → PASS; hollowed overlay → FAIL).
3. **The live proof is a standing witness.** `infra/supabase/tests/0125-viewer-readonly-smoke.sql` (the two-identity no-leak probe: viewer reads, cannot write/delete, can DM a leader; member unchanged; invite targeting honored/refused correctly) runs in `.github/workflows/viewer-readonly-isolation.yml` after every db-migrate — the role-control-isolation precedent.
4. **The invite honors the picked space.** `invite_to_instance(email, role, instance_in default null)`: explicit target requires the caller to be owner/admin of THAT non-church instance; omitted, the legacy family-first resolution stands byte-for-byte. Client passes the picker's instanceId through (`AdminConsole`, `Messages`, `member-roles.js`, `family-invite.js`).
5. **Labels say the truth:** `Admin (edit + members)` · `Member (edit)` · `Viewer (read-only)`. The Messages quick-add contact flow now grants **`viewer` by default** (least-privilege per the documented persona matrix; raising someone to member is a deliberate act in Admin → Manage access roles) and its copy says so.
6. **The home host trusts devices, not sessions.** Admin entry becomes `isFamilyMember || (!isPublicHost() && !authSession)` at both sites — the open (no-session) state keeps the setup/dev affordance; a signed-in guest on the house WiFi gets no Admin surface. Reviewer mode now suppresses the table syncs, so the lens is faithful on the data-emptiness axis it exists to mimic (both pinned in `reviewer-mode.test.js`).

## The answer of record (what the brother gets)

- Invited via **Messages → Add a contact** (or Admin with Viewer picked): **read-only guest** — he sees the shared records of that ONE space and can DM its leaders; he cannot write, delete, invite, change roles, see other spaces, read DMs he isn't in, or reach Imported PII / payments / steward tabs. Notes, photos, and saved contacts are device-local and never his.
- Invited as **Member**: the collaborative family role — read AND write on the shared family records (books, rentals, projects), still no delete on the books, no role/invite powers, no steward tabs, no Imported PII.
- Either way membership materializes only through DR-0187's two-party handshake: token link → his claim → the steward's confirm.

## Carried (two states, named carriers)

- **Church invite second factor** (bare-email auto-grant on `join_church_instance` — the DR-0187 gap open on the church path): carried with DR-0220 Phase 2 (church leadership data-driven), `re-review: 2026-08-11`.
- **Member-vs-admin write granularity** (member DELETE on `contractors_1099`/`family_snapshots`/`forecast_snapshots`; unscoped books UPDATE; member-readable `audit_log`): the capability layer's work, carried with DR-0220 Phase 6, `re-review: 2026-09-15`.
- **Isolation smokes → PR-blocking**: carried per DR-0224, `re-review: 2026-08-11`.

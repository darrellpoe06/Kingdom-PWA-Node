# DR-0829 — Make an account that already exists family, or any space, by the governor's hand, with admin grantable

- **Status:** accepted
- **Tier:** B (a new membership grant path; the same ceiling the role control enforces; audit-logged; walls proven by a smoke in the isolation matrix)
- **Type:** feature
- **Date:** 2026-10-09
- **Scope:** `infra/supabase/migrations-auto/0255-make-an-account-that-already-exists-family-by-the-governors-hand.sql` (new RPC `add_user_to_instance`), `infra/supabase/tests/0255-add-user-to-instance-smoke.sql` (new, in the `role-control` leg of `.github/workflows/rls-isolation.yml`), `app/src/lib/member-roles.js` (`addUserToSpace`), `app/src/components/AccessUsageMetrics.jsx` (the Add to a space control on every signup row), `app/src/lib/signup-metrics.js` (`ownNameOf`: a digits-only or address-derived display name is no name), tests `signup-metrics.test.js` (+3), `signups-named-from-your-contacts.test.jsx` (+1, the real surface).
- **Principles:** DR-0111 (the governor's word is the bright line; this is his hand), DR-0187 (two-party binding: both facts present here), DR-0076 (the smoke proves the ceiling; the control says exactly what it did), DR-0825 (the contact's name travels onto the membership row), 0130/0131 (the role ceiling: never owner, only an owner mints or removes admin, audit on every change).
- **Grounds:** Darrell, 2026-10-09, Platform Signups open with a family member's phone-door account listed as a public signup: *"Why can't I make Christyn my family with a check box or whatever... the ability to give and do things as admin!!!"* Then: *"Fix it!!!!!"*

## Context

The only road into a space was the invite (DR-0187): mint a claim link for an email string, deliver it, the person opens it and claims, the governor re-confirms. That is right when the governor holds only an address, because knowing an address is not knowing the person. It is the wrong shape when the governor is looking at an account that already signed in, on his own signups list, by its id: the person is already authenticated, and the governor is the second party. Making that account family took a link, a text, a claim and an approval, and so in practice it did not happen.

The same screenshot showed a second fault: the phone door names an account by its digits (0140 falls back to the address's local part), so the row read `14472209779` as the name and the contact's real name trailed after it as "in your contacts as".

## What was measured

- `instance_members` is unique on `(instance_id, user_id)`; `set_member_role` (0130/0131) already carries the ceiling this grant reuses: never owner; only an owner grants or removes admin; no self-change; `audit_log` on every change with grant/revoke decided by rank.
- The isolation matrix's `role-control` leg applies the role chain to the hosted database inside one transaction and runs its smokes with rollback; 0255 and its smoke join that leg.
- Proven on a local PostgreSQL 16 before pushing: the migration applies twice; the smoke prints `ADD USER SMOKE: PASS`; with the only-an-owner-grants-admin guard removed from a copy of the function, the smoke fails on *an admin granted admin*.

## Decision

1. `add_user_to_instance(instance_uuid, target_user, new_role, display_name_in)`: caller signed in and owner/admin of the space; target a real account and never the caller; role in admin/member/viewer; only an owner grants or removes admin; an owner's row is never touched; idempotent (same role is a noop, another role is a change); audit-logged. The person's own self-serve space is untouched.
2. On every Platform Signups row: Add to a space, offering the spaces the governor administers (`list_my_admin_instances`), the role (Admin only where he is owner), and a result line that says exactly what happened. The contact's name (DR-0825) is passed as the membership's display name when the account has none of its own.
3. A display name that is only digits, the whole address, or a phone-door address's local part is no name; the contact's name fills the gap.
4. The invite road stays for people who are not on the list yet. `re-review: 2026-10-23` (watch the first real adds in `audit_log`).

## Verification

- `0255-add-user-to-instance-smoke.sql`: twelve assertions (listed in its header), each a RAISE; run locally on PostgreSQL 16 and in the `role-control` leg against the hosted database.
- `signups-named-from-your-contacts.test.jsx`: on the real surface, the control lists the governor's two spaces, offers Admin only for the owned family, calls `addUserToSpace` with the family id, the account id, `admin` and the contact's name, and reports *is now Admin of Poe Family*; switching to the administered business drops Admin from the choices.
- `signup-metrics.test.js`: `ownNameOf` on digits, a formatted number, the whole address, a phone-door local part (no name) and on a chosen name or an ordinary email local part (kept).
- Lint clean at zero warnings; the migration guards (`rls-isolation-matrix`, `migration-replay-order`, `migration-return-type`, `smoke-sql-language`) green.
- Darrell's own test on the Fold: Admin > Users > Signups, Christyn's row, Add to a space > Poe Family > Admin > Add; then Role & stewards shows her on the family roster.

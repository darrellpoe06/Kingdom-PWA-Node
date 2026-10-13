# Persona / Identity / View Model — Comprehensive Review + Decisions

**Date:** 2026-07-22
**Prompted by:** Darrell, from the live app — "How does the roles work, does everyone see their name like mine at the top?", "can I see Christina's and my family, are they different?", "comprehensive review of the process… opportunities and constraints", and "I want people using the apps."
**Method:** Reality-trace of the running code (`file:line` verified, DR-0076). Read-only trace + this synthesis.

## The three identity layers (verified)

The UI stacks three independent layers so they *look* like one; only the third is a real security boundary.

1. **Signed-in account** — `authSession.user.email`, shown as "Signed in as …" (`AuthBanner.jsx:65`). The real cryptographic identity; RLS trusts only this (`auth.uid()`). Everyone who signs in sees their own email.
2. **Device-local persona** — `currentProfile` from `localStorage['poe-current-profile']` (`poe-financial-mvp-v28.jsx:1262-1276`). The "Who's using this device?" picker (Darrell / Christina / Family, hardcoded `FAMILY_EMAIL_PROFILES` `:601`). Drives the header **name chip** (`:4303`) and the `visibleTo` **entity filter** (`:3612-3615`). **Selecting a persona never changes DB access** — it writes localStorage only.
3. **DB role** — `instance_members.role` (owner/admin/member/viewer), enforced by Postgres RLS; changed only via `set_member_role` (0111). This is the actual permission layer.

**Header readouts are two independent things:** the persona chip (device-local) and the "Signed in as" strip (auth account) — they can disagree after a persona switch.

**Are the three views different?** Yes, but **cosmetically only**: Darrell sees all 4 entities, Christina sees personal + practice, Family sees personal roll-up (`visibleTo`, seed `:203-206`). It is a client-side filter ("Layer A · UX privacy," `:4251`) — the underlying `poe-family` instance has **no per-person RLS**, so all family accounts can read all family rows at the database.

**Non-family users** (parishioners, public signups) get **no** persona chip — they're `'self'` (`:1898`), with only their own "Signed in as" identity and their own isolated `u-<uuid>` instance (`0104:279-288`).

## Decisions (this session)

- **Shared visibility within the family instance is INTENTIONAL, not a bug.** A Family OS where spouses co-manage money wants shared visibility; the founder-allowlist deliberately seeds everyone as `member` of one instance ("all adults see everything"). The defect was the **UI overclaiming privacy** ("the practice stays private to its owner"). **Fixed:** the persona-picker copy now says plainly it's a shared-device *view convenience, not per-person security*, and points to Admin → Role & stewards for real access.
- **The founder is now `owner` of poe-family** (migration `0113`) so role management works there (a `member` had no manage rights).
- **"People using the apps" — an Invite control shipped in Admin.** `inviteToSpace` (member-roles.js) + the Admin → Role & stewards panel now invites by email: church → access on next sign-in (`invite_to_church`); family/other → a one-time claim link to deliver + a "confirm" step (DR-0187 two-party, reusing `family-invite.js`). Owner/admin-gated; never grants owner.
- **The Admin loads under the cross-tab auth-lock** (direct-REST reads) so "Users & usage" no longer hangs.

## Opportunities & constraints (dated, not dropped — DR-0075)

| # | Item | Decision | Re-review |
|---|---|---|---|
| 1 | **Real per-person privacy** (e.g. Christina's practice genuinely private from Darrell) — per-owner RLS or a separate instance for TLC | **Not built.** why: the documented model is shared family visibility, and TLC's actual PHI already lives in the ISO-1 encrypted tables (DR-0003), separate from the "practice entity" in the family books. Ripping out shared visibility is a Governor bright-line + a large Tier-C RLS change; the UI is now honest instead. Available on Darrell's go. | `2026-09-15` |
| 2 | **Persona ↔ role mismatch** (Darrell Jr → "Family" view but full `member` in DB) | Inherent to the shared-instance model; resolved only by item 1 or a dynamic persona system (item 3). | tied to #1/#3 |
| 3 | **Everything hardcoded to the Poe family** (email lists) → dynamic personas/roster | This is DR-0220 Phase 2/3 (data-driven leadership + shell gating from backend role). | `2026-08-25` |
| 4 | **Persona PIN is soft** (degrades to open when the PIN backend is unavailable) | Hardening risks lockouts; revisit with Layer B (sovereign PIN auth). | `2026-09-15` |

Recorded as **DR-0222**. Pairs with DR-0220/0221 (the role model + controls), DR-0187 (identity binding), DR-0060/DR-0003 (isolation tiers), and DR-0104 (review the live push).

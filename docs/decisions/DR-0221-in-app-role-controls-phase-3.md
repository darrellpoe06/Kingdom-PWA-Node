---
id: DR-0221
title: In-app access-role controls (DR-0220 Phase 3 brought forward) — set_member_role primitive + Choir Roster and Admin controls, guarded and isolation-tested
status: accepted
date: 2026-07-21
tier: C
declared_by: Darrell
supersedes: []
amends: [DR-0220]
principles: [ROLE-CAPABILITY-MODEL, VERIFICATION-DOCTRINE (DR-0076), REALITY-TRACE (DR-0061), APP-IS-PRIMARY (DR-0065), DR-0187, DR-0060]
---

## Context

Darrell, 2026-07-21, with two screenshots (the Choir → Roster tab and Admin → Role & stewards): *"I want to be able to control access roles here and other obvious places inside the PoeTech App… Inside the Love Corner App also."*

DR-0220 had Phase 3 (control roles from the app, not just email-allowlist gating) as a dated re-review (2026-08-25). The Governor asked for it directly, so it is brought forward. Reality-trace (DR-0061) of the two surfaces confirmed the real gap: roles are only ever **set at creation** (the join/invite RPCs); there is **no `instance_members` UPDATE policy and no role-change RPC** anywhere, and the Admin tab only *reads* the caller's own role.

## Decision

**Build the missing primitive and wire the two named surfaces, with the guards enforced in the database and proven by a live isolation test (this is a Tier-C access-control change — it ships *with* the proof, not on assertion).**

**`set_member_role(instance, target_user, new_role)`** (migration `0111`, SECURITY DEFINER):
- **Never grants `owner`** — capped at admin/member/viewer. Owners are the founder-bootstrap set and are **untouchable** via this control (a target whose role is `owner` is rejected) → no lockout is possible.
- **Only an owner may create or revoke an `admin`;** an admin may only move people between member↔viewer. Prevents admin-sprawl + self-escalation.
- **No self-change;** caller must be owner/admin of the instance; target must already be a member.
- **Every change writes an `audit_log` row** (`permission-grant`/`permission-revoke`, from/to role) — CAGE.

**`list_instance_members(instance)`** (owner/admin only) gives the surfaces the real roster.

**Surfaces wired:**
- **Choir Roster** — a descriptive **Team** role selector (member/musician/sound/media/tech/…, updatable under the existing `choir_members` RLS) *and* an **Access** control that promotes/demotes a linked member's edit access via `set_member_role`. Unlinked members show no access control (nothing to change until they claim, DR-0220 Phase 1).
- **Admin → Role & stewards** — the static "who can administer" list is joined by a live **Manage access roles** panel: the real `list_instance_members` roster, each with a role selector offering only the roles the caller may set.
- Both are shared via `app/src/lib/member-roles.js`, whose pure `grantableRoles()` mirrors the RPC guards so the UI never offers an option the backend rejects. Works for the family instance **and the COLG/Love Corner church instance** — same primitive.

**Verification (DR-0076):** `tests/0111-role-control-smoke.sql` + CI `role-control-isolation.yml` prove the guards catch — a member can't change roles, an admin can't grant/alter admin, owners are untouchable, no self-change, `owner` is never grantable, an owner *can* promote to admin, and no cross-instance change or member-list leak. `grantableRoles` has 9 unit tests locking the UI↔RPC mirror.

## Consequences

The Governor can now control access roles in-app in the obvious places, on real data, safely. Remaining DR-0220 phases stand: Phase 2 (church data-driven leadership), Phase 5 (church domain roles), Phase 6 (the Dev/Ops Specialist capability-checkbox layer). This closes the *change-a-role* half of Phase 3; deriving the app-shell affordance gating from backend role (rather than email allowlists) remains the other half, dated `2026-08-25`.

---
id: DR-0273
title: Stale pre-rename constraint twins dropped; every privilege guard NULL-safe
date: 2026-08-04
status: accepted
supersedes: []
superseded-by: null
tier: B
entities: [all]
---

**Post-incident, same day as DR-0271.** The first full `rls-isolation` matrix run after 0130 landed went red on 5 of 9 legs — the matrix doing exactly its job: every failure traced to one of **two pre-existing production defects** (both measured live, neither caused by 0130).

**Defect 1 — stale constraint twins.** The v1→v2.1 table renames left the ORIGINAL check constraints behind under their old names, and every later widening dropped by the NEW name only, so prod carried BOTH and they AND together:
- `instance_members`: `tenant_members_role_check` (owner/admin/member/viewer) alongside the canonical 8-role check → **no child / successor / specialist / assistant membership row was EVER insertable on production.** The 0082/0100 books-wall smokes could never have passed live, and DR-0271's assistant confirm would have failed at first use.
- `instances`: `tenants_tenant_type_check` (6 types) alongside the canonical 13-type check → landlord / law-practice / mentor / trades / media-org / trust / holding-company instances were silently un-creatable.

**Defect 2 — NULL-blind privilege guards.** `user_role_in_instance()` returns NULL for a non-member (correct in RLS, where NULL fails closed), but in plpgsql `IF role NOT IN ('owner','admin') THEN RAISE` evaluates NULL→false and never fires: **a signed-in outsider walked past the guard.** Proven live by the matrix: an outsider changed a member's role (0111 smoke) and minted a choir claim code (0110 smoke). Same shape in `grant_support_access`, `provision_child_member`, and the four showcase steward RPCs. 0126 had already written the guard NULL-safe (`IS NULL OR …`) — and its leg is exactly the one that passed.

**Closed in migration `0131`:** both twins dropped by their real names; all nine functions re-declared byte-faithful with hardened guards (`IS NULL OR` / `coalesce`, `IS DISTINCT FROM 'owner'` for the admin-touch rule). **The fix is at the call sites on purpose** — a non-NULL sentinel inside `user_role_in_instance()` would flip every `NOT IN ('child','assistant')` RLS policy OPEN for outsiders (the books walls). The five affected matrix legs now apply 0131 last, closing the REV-0217 regress-by-leg trap for these functions.

**Gate the class:** `nullsafe-role-guards.test.js` fails the build if any migration after 0131 writes a NOT-IN-with-'owner' privilege guard without NULL protection, and pins 0131's twin-drops + nine re-declarations. Distinction kept honest: invite/role CLAMPS (lists without 'owner', coalesce-defaulted input) are not guards and stay untouched.

**Why the matrix never said so before:** run history shows the earlier runs also red — the legs' observations existed but were not driven to green until this watch (DR-0255's event-driven posture is what surfaced it within the hour).

grounds: VERIFICATION-DOCTRINE, MACHINERY-OVER-MEMORY, WAYS-REVIEW, REALITY-TRACE, DETERMINISTIC-FIRST

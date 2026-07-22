---
id: DR-0223
title: The Governed Support Door — how the technology team fixes issues WITHOUT ambient access to data (reproduce-then-break-glass, scoped + consented + audited)
status: accepted
date: 2026-07-22
tier: C
declared_by: Darrell
supersedes: []
amends: [DR-0220]
principles: [ROLE-CAPABILITY-MODEL, TLC-FIREWALL, CAGE, DATA-AS-EMPOWERMENT, VERIFICATION-DOCTRINE (DR-0076), REVIEW-LIVE-PUSH (DR-0104), DR-0060, DR-0003]
---

## Context

Darrell 2026-07-22, on the real per-person-privacy question: *"I'm the technology team — how would that work for fixing system issues if I'm locked out of data?"* This is the classic support-vs-privacy tension, and the answer sets the bright lines for the Dev/Ops Specialist role (DR-0220 Phase 6). The wrong answer — "the tech team sees everything" — is the extraction model DATA-AS-EMPOWERMENT rejects. The right answer is a **governed support door**: privacy is the default, support access is a deliberate, scoped, audited exception, never ambient.

## Decision — three levels of "fixing issues", each with the right access

1. **System / infrastructure (the ~90%)** — a broken deploy, a hung workflow, an RLS bug, a stuck loader, a whole feature down. Fixed at the SYSTEM layer: code, migrations, the Admin system controls, OpsBoard, Quality Proof, site-health.yml. **Requires zero private data.** No door needed.

2. **Reproduce the user's experience (`support.reproduce`)** — for "user reports X is broken." Uses **reviewer-mode (DR-0104, already built)**: step into the *shape* of their experience (their tier, empty world, sanitized) to reproduce the bug **without reading their actual content**. The malfunction is visible; the content is not.

3. **See a specific record to fix it (`support.breakglass`)** — when the fix genuinely needs *this* person's *actual* data. A **scoped, time-boxed, consented, fully-audited** grant to that one scope; every read written to the `audit_log` (CAGE). Requested and recorded — never ambient.

## Bright lines (recommended defaults — Darrell may amend via a follow-up DR)

- **CLINICAL / PHI is NEVER break-glass-able by the technology team.** ISO-1 data (the TLC practice's clinical content, confessions — DR-0003, TLC-FIREWALL) stays sovereign / owner-only. Support fixes the SYSTEM around PHI; it never reads PHI. This is the hard line: the "practice entity" in the family books (a business/financial record) is operational and may be supportable; the *clinical* content is not, ever.
- **Consent model:** for a person's OWN private data → **user-initiated** ("I need help with this" opens a time-boxed window). For **shared / instance** data (family books, church ops, choir) → **governor-granted, user-notified, audited**. No silent grants.
- **Time-box:** a break-glass grant **auto-expires** (default 60 min) and is single-scope. No standing access.
- **Audit + provenance:** every break-glass READ appends to `audit_log` (grant id, scope, actor, reason) and is **visible to the data's owner** in their own access log. "Did the tech team look at my data?" always has a receipt.
- **Owner holds the keys, not ambient sight.** The owner/governor is never "locked out": they can always GRANT a scope or break-glass — but they exercise it per-incident, in the open, logged. Servant-king: authority to serve, transparently — not surveillance.

## Mechanism (the build, Phase 6 — follows this spec)

- `support.reproduce` = reviewer-mode, already shipped (`reviewer-mode.jsx`).
- `support.breakglass` = a `support_access_grants` table (scope, grantee, reason, granted_by, expires_at, consent_source) + a SECURITY-DEFINER `support_read(scope)` RPC that checks for a LIVE grant, enforces the PHI exclusion, and appends every read to `audit_log`. Wired to the Dev/Ops Specialist `specialist` role via the capability layer (`role_capabilities`, DR-0220) — the checkbox says exactly what a support person can reach.
- Proven-to-catch before trust (DR-0076): an isolation test proving a support grant reaches ONLY its scope, expires, cannot touch PHI, and logs every read.

## Consequence

Privacy and supportability are **not** in conflict — they are two halves of one design. The technology team fixes issues via system-level tools + reproduce + a governed, audited, PHI-excluding break-glass door — so real per-person privacy (DR-0222 item 1) becomes **safe to add**, because fixing issues no longer depends on ambient access. This DR is the spec; the enforcement build is the tracked follow-through with the bright lines above as the defaults.

**BUILT 2026-07-22 ("Build the support door — Phase 6, all of it").** Migration `0114-governed-support-door.sql` ships the capability layer (`role_capabilities` + `member_has_capability`, Dev/Ops Specialist seeded), the PHI-exclusion allowlist (`support_supportable_table`, fail-closed), `support_access_grants`, and `grant_support_access` / `support_read` (audits every read) / `revoke_support_access` / `list_my_support_grants`. Surface: `app/src/components/SupportAccess.jsx` (Admin → Support access) + `app/src/lib/support-access.js`. Proven-to-catch: `tests/0114-support-door-smoke.sql` + CI `support-door-isolation.yml` (PHI never grantable, capability-gated, own-live-grant-only, every read logged, expiry/revoke enforced). Reproduce (`support.reproduce`) rides the existing reviewer-mode (DR-0104).

**User-initiated self-grant BUILT 2026-07-22** (migration `0115`): `request_support_access` lets a member open a specialist's access to THEIR OWN record ("I need help with this") — same envelope (never PHI, capable grantee, scoped/logged) plus `support_owns_resource` enforcing you can only open your own data; `consent_source='user'`. Plus `list_support_specialists` + `my_supportable_records` so the member picks from their own records + the support staff (no raw ids). Surface: the "Get help with your data" section in `SupportAccess.jsx`. Isolation-tested (`tests/0115-support-self-grant-smoke.sql`): a member opens their OWN record, never someone else's, never PHI, only to a capable specialist. Both consent halves (governor-granted + user-initiated) now ship.

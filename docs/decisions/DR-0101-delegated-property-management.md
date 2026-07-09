# DR-0101 — Delegated property management: a scoped, revocable, team-based operator system

- **Status:** accepted
- **Tier:** C (real access grants to non-family people, tenant PII, money-number edits, legal-adjacent screening; ships behind a live isolation test, flag OFF until green)
- **Scope:** the Poe Properties operator system — property managers, field workers/handymen, tenants, and the delegated-access model that lets them use it without touching the family's books or the platform's developer controls
- **Date:** 2026-07-05
- **Principles:** SECURITY-IS-PRIORITY, VERIFICATION-DOCTRINE (DR-0076), DATA-AS-EMPOWERMENT, REALITY-TRACE, GOVERN-EXECUTE-ADVISE, DR-0094 (money never moves in-app), DECISION-RECORDS
- **Builds on:** 0055 (relationship-permissions + the tenant tables + `child_capabilities` toggle model), 0062 (per-unit management + `manager`/`created_by_role`), DR-0060 (tenancy-guard: isolation is a gate), DR-0093/0094 (per-capability revocable grants with `maxGrant` ceilings)

## Directive (Darrell, 2026-07-05)

Darrell asked, from a live Relationships screenshot, to (1) add his part-time property manager on a 1099 so she can manage the tenant system and document Poe Properties' processes, and (2) let tenants submit work orders and explain situations through the messages center. Across the design conversation he added: **multiple** managers (a team); a **separate, domain-scoped admin** for the property system with **no development functionality**; **per-person, per-capability toggles that are revocable anytime**; **collections including editing the balance owed** (audited); **frictionless handyman documentation** (a Fixed / Not-fixed→needs parts·money·time dropdown + note + photo); **landlord-enabled handyman↔tenant messaging** kept as a historical record; **everyone on a job sees the messages and timestamps** so timelines are judged accurately; and **application review + a teachable policy playbook** for tenants and 1099 workers. Standing frame: *"security is priority."*

## What the reality-trace found (the starting point)

The permission **model** exists and is honestly labeled model-only. The landlord-side tenant tables (`tenant_maintenance_requests`, `tenant_messages`, `tenant_notices`, `rent_records`, `rental_tenancies`) + their RLS are real; the landlord can file/track/assign/message from `UnitManagement`. But: **no tenant-facing UI** exists; **nothing ever creates a `rental_tenancies` row** (the keystone gap); the 1099 surface is a **tax/contact record only** (no login, no permission); there is **no `manager`/`agent` role** in the model, and the tenant-table RLS only honors `owner/admin/member` (the `specialist` role is granted *nothing*). So the only way to give a manager access today is **full instance membership**, which over-shares the whole family platform. That over-share is the security problem this DR fixes.

## Decision

Build a **delegated property-management system** on the existing, tested capability model — least-privilege by construction, isolation-gated, money-safe.

### 1. Two delegated roles, team-capable, per-property scoped
- **Property Manager** — the scoped operator. Capabilities (each an individual, revocable toggle): manage maintenance requests; message tenants; post notices + see tenant contact; **rent roll for managed units only**; **collections** (confirm payment received, **adjust the balance owed** — audited); **review applications**.
- **Field Worker / Handyman** — the lightest role: **see historical property info + add documentation only**. May be granted a landlord-enabled direct message channel with a specific tenant for a specific job.
- **Many people hold either role** (a team). Each grant is scoped to **specific properties** (or all), so manager A works the duplexes and manager B the single-families without seeing each other's.

### 2. Per-capability, per-property, revocable toggles — on the proven model
Extends `child_capabilities` (0055/DR-0094): a `delegated_capabilities` table keyed by `(grantee_user_id, scope=property_id|portfolio, capability, setting)`. `setting` is `deny/approval/allow`; each capability carries a `maxGrant` **ceiling** the grantor cannot exceed. The ceilings **structurally exclude** the portfolio, the books, and every platform/developer capability — so there is no toggle that can reach them. Revocation is immediate (set to `deny`). Sensitive capabilities (e.g. **adjust-balance**) support **approval mode** (manager proposes, landlord one-tap approves) as an alternative to full allow.

### 3. A SEPARATE Property-Management Admin (no developer functionality)
The operator surface is its **own bounded admin**, distinct from the platform Admin tab. It has **none** of the dev/system controls (no reload-to-latest, reset-seed, CI/quality-proof, backend-role check, DevOps/Opportunities). Managers — and the landlord operating this view — never touch the platform's developer admin. Least privilege at the surface level, not just the row level.

### 4. Money never moves in-app (hard rule, DR-0094)
The `money_moved_in_app = false` CHECK holds. A collections manager **records reality** (the money moved outside the app via Zelle/cash/check/bank) and communicates — they can never initiate a charge or transfer. **Editing the balance owed changes a number, not a dime**, and every adjustment is written to an **append-only audit** (who, when, old→new, reason). The number is always explainable and the trail is tamper-proof.

### 5. Shared, timestamped, tamper-proof message timeline
`tenant_messages` stays **append-only with a real server `sent_at`**. **Every participant on a job/tenancy** — landlord, the scoped manager(s), the tenant, and the handyman once landlord-enabled — sees the **full thread and every timestamp**, so responsiveness and timelines are judged accurately. Still scoped: a manager sees only their properties' threads. The handyman↔tenant channel is **off by default**, enabled per job by the landlord/manager, and recorded permanently.

### 6. Frictionless handyman documentation
Because tradespeople hate documenting, the entry is near-zero-typing: a **status dropdown** — **Fixed**, or **Not fixed** + a follow-up reason (**needs parts / needs money / needs time / other**) — plus an optional free-text note and a **photo/file upload** (reusing the DR-0090 receipt-image compression). Stored on the request; visible in its history.

### 7. Application review + a teachable policy playbook (fair-housing guarded)
- **Application review**: intake → review against **documented, consistent criteria** → approve/decline **with a reason**, every decision timestamped + append-only audited. Scoped capability.
- **Poe Properties Playbook**: the processes written down once (application-review policy, tenant policies, 1099-worker standards) so screening is consistent and **teachable** — rides the app's existing Learn/course + facilitator pattern.
- **Per-party acknowledgment**: tenants and 1099 workers read + **acknowledge** the parts relevant to them (timestamped — "they were told" on the record).
- **COMPLIANCE GUARDRAIL (non-negotiable, DR-0100):** rental screening is legally regulated — the **Fair Housing Act** forbids protected-class factors (race, color, religion, sex, familial status, national origin, disability); the **FCRA** governs any credit/background pull; plus state/local screening laws. The playbook bakes in **consistent lawful criteria + the fair-housing/FCRA cautions + the audit trail**, framed as **guidance to verify with a licensed professional** (the app's existing "verify with licensed professionals" banner) — never legal advice. Consistent, criteria-based screening with an audit trail is the operator's best defense against a discrimination claim; a screening tool without that guardrail could quietly enable an unlawful decision, so it does not ship without it.

### 8. 1099 → login link
A `contractors_1099` record is a tax/contact record, not an identity. An **invite/onboard** flow links a contractor to a real `auth.users` login and provisions the **scoped role** (never full membership, never platform-admin).

## Verification discipline (how it ships — DR-0076 / TV-sharing precedent)

Nothing turns on until proven. An **isolation smoke test** (like `0074`) runs in CI against the real DB and must be GREEN before the feature flag flips: manager A cannot see manager B's properties; **no delegated role can see the books, the portfolio, or any platform/dev surface**; a field worker sees only history + docs; **a revoked toggle actually revokes**; the handyman↔tenant channel reads only when enabled; a stranger sees nothing; and the balance-adjust audit records every change. Ships **flag OFF** until that CI is green.

## Staged build (each stage its own gated PR)

1. **Foundation** — DR (this) + migration 0075 (roles, `delegated_capabilities`, RLS honoring the scoped role per granted property, docs table, balance-adjust audit, the enabled handyman↔tenant channel) + the JS capability model extension + the isolation smoke test. Flag OFF.
2. **Tenant-link + tenant portal** — create `rental_tenancies` (the keystone); a tenant-facing surface to submit a work order + message as the tenant.
3. **1099→login + the Property-Management Admin** — team roster, per-capability toggle UI, frictionless handyman docs.
4. **Application review + the policy playbook** — with the fair-housing/FCRA guardrail + per-party acknowledgment.

## Why this is the secure answer

The alternative (full instance membership) over-shares the entire family platform to a non-family person. This model gives a manager exactly the operator powers they need — scoped to their properties, individually revocable, incapable of reaching the books or moving money — with every money-number change and every message on a tamper-proof, timestamped record. It is DR-0094 (money-safe) + DR-0060 (isolation-as-a-gate) + DR-0093/0094 (revocable capability grants) applied to the operator problem.

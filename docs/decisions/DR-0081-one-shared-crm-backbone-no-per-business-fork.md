---
id: DR-0081
title: One shared sovereign CRM backbone — every acquisition funnel and every business/tenant rides it via config, never a per-business fork
date: 2026-06-24
status: accepted
supersedes: []
superseded-by: null
tier: B
entities: [all]
grounds: [ONE-CRM, NEW-SURFACE-NEW-MODULE, ONE-APP-EVERYTHING-COMES-TOGETHER, APP-IS-PRIMARY, VERIFICATION-DOCTRINE, NO-DATA-SALE, SOVEREIGN-FIRST, DECISION-RECORDS]
source: 2026-06-24 — Darrell, "always." Make the one-shared-CRM standard binding after the CRM backbone shipped (PR #339); bake it in as the rule, document it, and add a CI/structure note so future work can't fork a second CRM.
---

## Context

The acquisition surfaces grew up scattered: TLC `inquiries` (pre-intake), the
TLC client-acquisition `practice_leads` (revenue-team workflow, PR #334/#343),
`external_users` + `interactions` (generic contacts/activity), the GTM
subscriber funnel, Boxcar booking, real-estate leads. Left alone, each new
funnel would have grown its own table + its own "engine" — N parallel CRMs that
drift, duplicate guardrails, and split the pipeline view. That is the fork
Darrell named and forbade.

PR #339 shipped the unifying answer: one pure engine (`app/src/lib/crm-engine.js`)
— businesses × pipelines registry, canonical lead, consent gate, draft-only
follow-up, source attribution, seed-vs-real, the PHI/ethics linters, and funnel
adapters — over one store (`crm_leads` + `crm_activities`) with one API seam
(`crm_capture_lead`). Pre-existing tables (`inquiries`, `practice_leads`)
federate **read-side** via adapters, so the board is one pane without a data
migration.

Darrell's instruction — "always" — promotes that from a one-time build to a
**standing, enforced standard**.

## Decision

**There is ONE shared sovereign CRM backbone. Every acquisition funnel and every
business/tenant — current and future — rides it via per-business CONFIG, never a
per-business fork.**

Binding, operationally:

1. **A new funnel/business is a CONFIG, not a new CRM.** Adding one means: add a
   `PIPELINE` (and, if new, a `BUSINESS`) to `crm-engine.js`; capture through the
   `crm_capture_lead()` RPC; nurture through the engine's draft-only sequences.
   It does **not** mean a new leads/CRM/pipeline table or a parallel engine.
2. **Pre-existing lead tables federate, they do not compete.** A table that
   predates the backbone (`inquiries`, `practice_leads`) is mapped onto the
   canonical lead read-side via an adapter (`leadFromInquiry`,
   `leadFromPracticeAcquisition`, …). It may converge into `crm_leads` later, but
   it is never the seed of a second CRM.
3. **The guardrails live once, in the engine.** Consent gate, PHI/ethics linters,
   no-payment, LLMs-draft-humans-approve, seed≠real — single source of truth in
   `crm-engine.js`. Other modules import them; they do not re-implement them.
4. **Un-forkable in CI.** `scripts/crm-single-engine-guard.mjs` (with its
   proven-to-catch test) fails the build when a new CRM/lead/pipeline table
   appears that is neither the sanctioned backbone nor an explicitly-allowlisted,
   *reasoned* exception — and fails if the backbone (engine registry or capture
   seam) goes missing. A fork now requires a conscious allowlist edit with a
   stated reason, which is the friction that stops an accidental second CRM.

This is the CRM-specific application of the shared-primitives / reuse-not-forks
posture (DR-0078/0079 surface registry; NEW-SURFACE-NEW-MODULE) and the
connections principle (`BUSINESS-PROCESS-CONNECTIONS.md` — every surface is one
end of a connection whose other end is wired): the `crm_capture_lead` seam *is*
the wired other end every funnel connects to.

## Consequences

- Future work cannot land a second CRM green — the guard blocks it.
- The GTM lane targets `gtm-subscriber` via `leadFromSubscriber()`; Boxcar and
  real-estate ride their pipelines; the TLC lane keeps `practice_leads`
  federated (optional later convergence into `crm_leads`).
- New verticals are cheap: a pipeline config + adapter, inheriting model,
  guardrails, sync, surface, and RLS.
- The allowlist is the audit trail of every "this is not the CRM" exception.

## Verification

- `scripts/crm-single-engine-guard.mjs` PASS on the real tree; the proven-to-catch
  test flags a fake `marketing_leads` / `crm2_contacts` fork (DR-0076).
- Engine + adapters covered by `crm-engine.test.js` (37 tests); the backbone
  ships behind PR #339 (held for orchestrator-sequenced convergence).

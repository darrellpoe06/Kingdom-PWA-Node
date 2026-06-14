---
id: DR-0060
title: Tenancy guard — a deterministic data-isolation gate that fails the build, so family-data exposure is prevented not re-discovered
date: 2026-06-13
status: accepted
supersedes: []
superseded-by: null
tier: C
entities: [all]
grounds: [DATA-AS-EMPOWERMENT, EXECUTION-OUTCOME-OBSERVABILITY, GOVERN-EXECUTE-ADVISE, CAGE, LESSONS-LEARNED]
source: 2026-06-13 — Darrell: "Unbelievable how many times we keep finding out my family data is exposed... instead of humans who would understand in context... Never undermining workflows that can't see danger or perpetual issues." The fix for AI-built automation that can't feel danger is to encode the danger-sense as a deterministic gate.
---

## Context

The family-data exposure path (`join_default_instance` enrolling any sign-in
into the poe-family instance) was real, and the only thing that kept it from
being live-to-the-world was an accident — Supabase's built-in mailer delivered
sign-in links only to the owner's email. Custom SMTP removed that accidental
wall. **Luck is not a security boundary.** A human with full context catches
"what stops a stranger from joining the family tenant?" by reflex; AI-built
automation does not feel danger, so it kept being *discovered* rather than
*prevented* (DR-0059 closed the latest instance; before it, RLS gaps and seed
pollution were others).

## Decision

Encode the reflex as a **deterministic, $0, no-LLM gate that FAILS the build** —
`scripts/tenancy-guard.mjs`, run inside the required `app — lint + vitest`
check via `app/src/__tests__/tenancy-guard.test.js` (no branch-ruleset change;
it gates every merge from inside an already-required check). Two checks, the
two exposure classes seen so far:

- **A. RLS coverage** — every table whose `CREATE TABLE` declares an
  `instance_id` column MUST have ROW LEVEL SECURITY enabled. A tenant table
  without it is readable across every tenant. (Today: 60 instance-scoped
  tables, all covered.)
- **B. Provisioning isolation** — the effective `join_default_instance()` (the
  single RPC every sync funnels through) must keep the family email allowlist
  intact AND keep the poe-family membership grant *behind* that gate. Removing
  the allowlist or moving the grant ahead of it reopens the open-join hole and
  fails the build.

**Anti-theater discipline (binding for this class of guard):** a guard that
gives false confidence is worse than none — exactly the "workflow that can't
see danger" Darrell named. So the guard ships only after it is proven to CATCH
the break, not just pass clean. This one was validated by injecting each
exposure class (a tenant table with no RLS; an allowlist-stripped provisioning
override) and confirming a non-zero exit, plus a test that asserts the scanner
is actually seeing the schema (non-vacuous). Every future safety gate carries
the same burden of a demonstrated catch.

## Consequences

- Adding a tenant-scoped table now requires RLS in the same change, or the
  build fails. Intentional exceptions are an explicit, reasoned entry in the
  guard's `RLS_EXCEPTIONS` map — never a silent omission.
- The provisioning allowlist cannot be silently dropped; a regression toward
  open-join is caught at PR time.
- The guard is the DB analog of `workflow-conformance` (DR-0058) and rides the
  same leverage ladder; it is also surfaced in the daily review brief.
- It covers the two known classes; it is not a proof of total isolation
  (e.g., it does not execute RLS policies against a live DB). It raises the
  floor and is extended as new classes are learned — added to LESSONS-LEARNED.

## Links

`scripts/tenancy-guard.mjs`, `app/src/__tests__/tenancy-guard.test.js`,
`.github/workflows/daily-review.yml`, [DR-0059] (self-serve provisioning — the
hole this keeps closed), [DR-0058] (`workflow-conformance`, the workflow analog),
DATA-AS-EMPOWERMENT-NOT-EXTRACTION, LESSONS-LEARNED, EXECUTION-OUTCOME-OBSERVABILITY
(`docs/00-foundations/_root/`).

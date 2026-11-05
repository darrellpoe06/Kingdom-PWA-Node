# DR-1330: Our Ways measured against the AI-development best-practice slides — thirteen proposed builds, and the ledger's own length rule broken 894 times

**Date:** 2026-11-05
**Status:** proposed (for Darrell to ratify, amend or strike; nothing here is built yet)
**Tier:** B (CI lane, security posture, and the decision ledger's own convention)
**Type:** orchestration · Ways review (DR-0108)
**Area:** `.github/workflows/ci.yml`; `scripts/e2e/`; `app/functions/`; `docs/decisions/`; the model-routing and cost docs
**Grounds:** WAYS-REVIEW, VERIFICATION-DOCTRINE, PERPETUAL-IMPROVEMENT, SPEC-CONFORMANCE-REVIEW, DECISION-RECORDS
**Source:** `docs/99-session-notes/2026-11-05-ways-review-ai-development-best-practices-against-our-ways.md` (REV-0260)

## Context

Darrell, 2026-11-05, six IT Professionals Forum slides (prompting, software development, common AI pitfalls, model selection and usage tracking, cybersecurity, and a project-results table): *"evaluate our Ways and documentation and procedures for these types of processes... do a report so I and then we can make decisions."* Added mid-review: automated user-flow tests, a Playwright sweep across the site, *"Are we protected from outside issues?"*, *"I also don't like bloated code... DRs"*, *"Clean functions and workflows."*

## What was measured

Every slide bullet traced SHOULD / ARE / GAPS (DR-0219) with `file:line` in the source note. The decisive numbers: no `npm audit`, `pip-audit` or secret scanner in 95 workflows or 255 scripts; one production probe password committed (`nas-health.yml:99,108`); raw exception text returned to clients in 26 places; `audit_log` permits `failed-auth` and `login` and nothing writes them; one end-to-end journey in CI (property doors, DR-0934) and no sweep over the ~70 registered surfaces; AI cost tracked per day on a runner, never per task; 894 of 1,224 decision records over the README's 45-line rule, one index row of 63,818 characters; seven source files over 3,000 lines; 21,896 lines of workflow YAML. The browser edge (CSP, headers, RLS, site witness) is strong and gated.

## Impact

Unmeasured is not safe: the slides' first pitfall, vulnerable outdated dependencies, is the one thing we have never measured. A surface that throws on mount is found by a person, not a gate. The change log works and cannot be read. Left as is, each stays a drift rather than a decision (DR-0075).

## Decision (proposed)

Thirteen builds, each with a recommended default of *build*, in the source note §6: D1 registry-driven navigation sweep; D2 journey registry and coverage guard; D3 vulnerability-audit gate; D4 secret-scanning gate and the probe password into a secret; D5 error-text policy and guard; D6 security-event logging; D7 endpoint and data-store register; D8 per-task AI usage ledger; D9 bloat ratchets (record length, per-file budget; lesson content out of JavaScript is the Governor's call, a content-architecture bright line); D10 Prettier and ruff; D11 three one-line closes; D12 end-of-life register; D13 clean workflows via a shared probe harness and a workflow register. Not changed, by decision: no coverage percentage, no human approval per PR, no session-per-task.

## Verification

The note's numbers were measured on this checkout; the security claims were re-read in the files after the sweep (DR-0076 §7). Ratification turns each D into its own record with a proven-to-catch gate. `re-review: 2026-11-19` if unratified.

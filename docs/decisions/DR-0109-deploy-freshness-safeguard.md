---
id: DR-0109
title: Deploy-freshness safeguard — a scheduled workflow heals a missed production deploy (closes the GITHUB_TOKEN-merge gap); ships inert with the three brakes
date: 2026-07-06
status: accepted
supersedes: []
superseded-by: null
tier: C
entities: [all]
grounds: [EXECUTION-OUTCOME-OBSERVABILITY, VERIFICATION-DOCTRINE, THREE-BRAKES, TIER-C, GOVERN-EXECUTE-ADVISE, PERPETUAL-IMPROVEMENT, DECISION-RECORDS]
source: 2026-07-06 — Darrell: "can we document these issues and make sure we safeguard against it?" (after the deploy-freshness gap recurred and was held up by a manual/timed check-in all evening).
---

## Context

The auto-merge lane merges via `GITHUB_TOKEN`; GitHub fires no `push` / CI /
`workflow_run` events on `main` for such a merge (anti-recursion), so
`deploy-cloudflare-pages.yml` (on `push:main`) never fires on an auto-merged
commit. `auto-merge.yml` dispatches the deploy itself (DR-0107 fix) — but on PR
*events*, so the LAST merge in a quiet stretch has no following event and can sit
undeployed until the next merge or a manual dispatch. Across 2026-07-06 this
recurred ~3 times; the only thing catching it was a human/agent freshness
check-in. A down/stale site is the worst outcome (DR-0107), and a safeguard that
depends on a session's timer is not durable.

## Decision

1. **Ship a scheduled freshness-deploy workflow** (`.github/workflows/deploy-
   freshness.yml`): every 5 min it compares `main`'s tip to the last SUCCESSFUL
   deploy's `head_sha` and dispatches `deploy-cloudflare-pages.yml` iff they
   differ. A schedule is the ONE reliable trigger GitHub allows after a
   `GITHUB_TOKEN` merge; `workflow_dispatch` by the token IS permitted. Idempotent
   — a fresh site is a no-op. This closes the open follow-up DR-0107 logged.
2. **It carries all THREE BRAKES even though it cannot run away** (it dispatches
   at most one already-safe, single-flight deploy per fire; spawns no Claude, no
   compute loop): BUDGET (one check + ≤1 dispatch/run; the deploy is wall-clock
   bounded + single-flight), LOCK (`concurrency: deploy-freshness` + the deploy's
   own `cf-pages-deploy` group — deploys never stack), KILL (gated on
   `DEPLOY_FRESHNESS_ENABLED == 'true'`).
3. **Ships INERT (Tier C).** The variable is unset, so every fire skips until
   Darrell sets `DEPLOY_FRESHNESS_ENABLED = true` — turned on deliberately, with
   someone watching (P11). Timer-driven automation is Tier C regardless of how
   bounded; "it only heals a deploy" does not downgrade it.
4. **What we did NOT decide:** not the PAT-merge alternative (merging with a PAT
   so the `push` natively triggers the deploy). It is cleaner but needs a
   repo-write PAT secret (Darrell's action + a real credential surface); recorded
   as the alternative, not chosen. The scheduled healer needs no new secret and is
   fully in-repo, so it is the default safeguard.

## Rationale

Because uptime is senior to velocity (DR-0107) and the safeguard must not depend
on a live session's check-in to hold. A schedule is the only GitHub-native trigger
that survives a `GITHUB_TOKEN` merge, and the healer is idempotent + single-flight,
so it is safe to run on a clock. Inert-by-default honors the three-brakes rule
that ALREADY got violated once tonight (auto-merge shipped without deploy
verification) — we do not repeat it by self-activating new timer automation.

## Consequences

- Once armed, poetech.us self-heals to `main` within ~5 min with no human in the
  loop; the session freshness check-in becomes a redundant backstop, not the
  primary guard. Until armed, the check-in stays the guard.
- Obligates the one-line activation (a repo variable) — surfaced to Darrell.
- Reversible instantly (delete the variable or disable the workflow).
- Follow-up still open (logged, not built): a deploy-lag ALERT (notify on a stale
  window over threshold) — this DR heals; an alert would also announce. Lower
  priority now that healing is automatic.

## Links

`.github/workflows/deploy-freshness.yml`, `.github/workflows/auto-merge.yml`
(the PR-event dispatch), `.github/workflows/deploy-cloudflare-pages.yml`,
`docs/00-foundations/_root/LESSONS-LEARNED.md` (2026-07-06 deploy incident; P25/P26),
[DR-0107] (uptime is the worst-outcome bright line — this is its structural close),
[DR-0103] (the lane that exposed the gap), [DR-0076] (verification doctrine).

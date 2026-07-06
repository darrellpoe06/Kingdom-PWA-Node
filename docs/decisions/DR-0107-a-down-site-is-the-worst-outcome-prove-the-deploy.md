---
id: DR-0107
title: A down site is the worst outcome — uptime outranks velocity; a merge/CI/deploy-lane change is not done until a real merge produces a real deploy
date: 2026-07-06
status: accepted
supersedes: []
superseded-by: null
tier: n/a
entities: [all]
grounds: [VERIFICATION-DOCTRINE, EXECUTION-OUTCOME-OBSERVABILITY, GOVERN-EXECUTE-ADVISE, PERPETUAL-IMPROVEMENT, DECISION-RECORDS]
source: 2026-07-06 — Darrell: "This sucks the worst possible outcome is a down site... Record how bad this decision was by you so you remember." (Incident: enabling the auto-merge lane took poetech.us stale ~9 hours.)
---

## Context

On 2026-07-06 the agent enabled the streamlined auto-merge lane (DR-0103) and
**poetech.us went stale for ~9 hours** — the family/COLG-facing production site
served an old build while `main` ran far ahead. Cause: a `GITHUB_TOKEN` merge
does not trigger `push`-triggered workflows, so the Cloudflare deploy stopped
firing (LESSONS P25). The damning part, recorded here so it is not softened: the
**identical gap was already documented six lines away in the same file** (the
db-migrate patch), and the agent shipped the lane change without verifying the
deploy path survived it. A down site is the worst outcome a delivery change can
produce, and this one was avoidable with the warning in front of it.

## Decision

1. **Uptime is senior to delivery velocity.** When the two trade off, the live
   site wins. Speed behind a locked front door is worthless.
2. **A change to the merge / CI / deploy lane is NOT "done" until a real merge
   has produced a real deploy.** CI-green is not deploy-proof. Touching
   auto-merge, CI, branch protection, or the deploy workflow obligates:
   enumerate every downstream `push`-triggered effect (deploy, migrate, any
   post-merge automation) and PROVE each still fires by watching a real merge
   deploy — before calling it shipped.
3. **After any merge to `main`, confirm the served build advanced** — a deploy
   run whose `head_sha` matches `main`'s tip. If it hasn't, dispatch the deploy
   immediately (the P26 standing check). This is the human/agent habit until the
   deploy-lag *alert* (the still-unbuilt observability follow-up) exists.
4. **What we did NOT decide:** not to slow ordinary work, and not to abandon the
   auto-merge lane — the lane stays (DR-0103); the gates stay the brake. We
   added a proof obligation to lane-touching changes, not friction to every PR.

## Rationale

Because the site is the product for the people it serves, and a stale/broken
front door erodes the exact trust the platform exists to build — a cost that
dwarfs any merge-speed gain (QUALITY-OF-LIFE, COMMUNITY-FIRST). And because the
failure was a verification miss (VERIFICATION-DOCTRINE / EXECUTION-OUTCOME-
OBSERVABILITY): system-green was mistaken for product-deployed. The correction is
a proof obligation at the exact point the class of failure occurs.

## Consequences

- Obligates the P26 post-merge deploy-confirmation on every lane-touching change
  and after every merge to main; enables catching a stalled deploy in minutes.
- Recorded in Layer 0 (`CLAUDE.md` "A down site is the worst outcome") so it
  loads first every session and survives compaction; P25/P26 in LESSONS.
- Open follow-up (logged, not built): a deploy-lag ALERT (main advanced but the
  served `head_sha` didn't within N minutes) — the observability piece that would
  make this automatic instead of a human habit (P5). Tracked for a next increment.

## Links

`docs/00-foundations/_root/LESSONS-LEARNED.md` (2026-07-06 deploy incident; P25/P26),
`CLAUDE.md` "A down site is the worst outcome", `.github/workflows/auto-merge.yml`
(the deploy-dispatch fix), `.github/workflows/deploy-cloudflare-pages.yml`,
[DR-0103] (the lane that exposed this), [DR-0106] (closing-move — this is its
uptime sibling), [DR-0076] (verification doctrine).

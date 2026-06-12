---
id: DR-0054
title: One release lane — production deploys only from main; manual Vercel promotes retired; merge IS the deploy
date: 2026-06-12
status: accepted
supersedes: []
superseded-by: null
tier: n/a
entities: [all]
grounds: [GOVERN-EXECUTE-ADVISE, DATA-DRIVEN-LIVING, DECISION-RECORDS]
source: 2026-06-12 session — Darrell, after the version-skew incident: "I want this to be human proof… how is on the AI, knowing what is on the human users. I want to go 5 forward 6 forward 9 forward 11 forward."
---

## Context

Production was updated on 2026-06-11 by manually promoting a Vercel preview build (`AE7C864`) that was four commits behind its own branch — behind the P14 fixes for the exact symptoms the family then reported as lost pages. Git `main` did not carry the live code, so no CI, review record, or version bookkeeping matched production. The oscillation Darrell named (ten forward, three back) traces to this one structural fact: more than one path to production.

## Decision

1. Production deploys **only from `main`**; the manual Vercel promote is retired.
2. Every change rides one sequence: branch → PR → CI green → tier review on the PR preview → **merge = deploy**. No post-merge human step exists to forget.
3. The header BUILD stamp is the version truth and the first question of every bug report.
4. Division of labor is binding: the human owns WHAT (greenlights, tier calls); the AI owns HOW (branches, tests, CI, merge mechanics, version bookkeeping). Any process step that depends on a human remembering mechanics is a defect in the process.
5. Hardening step assigned to Darrell (one-time): a `main` branch ruleset requiring the two CI checks, so the platform itself enforces the lane.

Full text: `docs/00-foundations/_root/RELEASE-LANE.md`.

## Consequences

- The 2026-06-11 class of incident (deployed build ≠ reviewed build ≠ recorded build) becomes structurally impossible rather than carefully avoided.
- Tier review (RELEASE-TIERS) gets a fixed place to happen: the PR, against its preview.
- Preview-URL data confusion is named: previews are for soaking, family devices live on poetech.us.

## Links

`RELEASE-LANE.md`, `RELEASE-TIERS.md`, `.github/workflows/ci.yml`, LESSONS-LEARNED 2026-06-03 (P3/P4), [DR-0053] (the previous unblock in this hardening arc).

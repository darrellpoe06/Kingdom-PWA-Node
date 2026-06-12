# THE RELEASE LANE — One Path to Production

**Layer 3 foundation. Binding. Added 2026-06-12 (DR-0054), declared by Darrell:**
> "I want this to be human proof… how is on the AI, knowing what is on the human users. I want to go 5 forward 6 forward 9 forward 11 forward."

## The incident this exists to prevent

On 2026-06-11 production was updated by manually promoting a Vercel preview
build (`AE7C864`) that was **four commits behind** its own branch — behind the
very fixes for the symptoms the family then experienced as "we lost pages."
Meanwhile git `main` didn't carry the deployed code at all, so no record, no
CI, and no review gate matched what was actually live. That is the
ten-forward-three-back shape: not bad code, but **more than one path to
production**, so fixes land in one place and not another and nobody can say
which version anyone is on.

## The rule — ONE lane

1. **Production deploys from `main`. Only from `main`. Always from `main`.**
   The Vercel dashboard's "Promote to Production" on a preview build is
   **retired** — it is the documented cause of the 2026-06-11 version skew.
   If production needs something, it merges first.
2. **Every change rides the same sequence:** branch → PR → CI green (lint +
   full test suite + wf36 harness) → tier review per `RELEASE-TIERS.md` on
   the PR's preview URL → merge. **Merge IS the deploy.** There is no second
   step a human can forget, and no step a human must remember.
3. **Previews are for soaking, never for living.** Preview URLs change per
   push and their device-local data does not follow you. Family devices use
   poetech.us; anything observed on a preview is feedback for the PR, not a
   place to keep data.
4. **The BUILD stamp is the version truth.** The header stamp is the deployed
   commit. The first question of every bug report is "what does the BUILD
   stamp say" — it turns "something broke" into "commit X behaves wrong,"
   which is fixable in one step instead of three.
5. **Every fixed bug earns its regression test in the same PR** (the existing
   lockstep rule). A fixed bug that recurs is a LESSONS-LEARNED entry, not a
   shrug — recurrence means a gate is missing, and the gate gets built.

## Division of labor — human-proof by design

- **Darrell owns WHAT:** greenlights, tier calls, approvals, mission and
  product decisions. He is never required to remember a version number, a
  deploy order, or a promote step — if the process depends on a human
  remembering mechanics, the process is wrong and gets fixed.
- **The AI owns HOW:** branching, fixing, tests, CI, merge mechanics,
  version bookkeeping, and saying out loud — before any deploy-affecting
  action — what is about to be deployed and what it contains.
- A failed gate is information for both, blame for neither. Per
  GOVERNANCE-EXECUTION-ADVISORY: Darrell governs, the system executes,
  Claude advises.

## The one manual hardening step (Darrell, one time, ~1 minute)

GitHub → repo **Settings → Branches → Add branch ruleset** for `main`:
require status checks **"app — lint + vitest"** and **"n8n workflows — wf36
gatekeeper harness"** to pass before merging. After that, the lane is
enforced by the platform itself — even a rushed 2am merge cannot skip the
gates.

## Pairs with

`RELEASE-TIERS.md` (what review each change needs), `LESSONS-LEARNED.md`
(P3/P4 production-outcome verification), `.github/workflows/ci.yml` (the
mechanical gate), `EXECUTION-OUTCOME-OBSERVABILITY.md` (deploys are verified
by outcome, not by intention).

# RELEASE-TIERS.md — The Three-Tier Release Model

**Layer 3 foundation. Added 2026-06-03 evening, declared by Darrell ("Yes. spawn a code task").**

This document is the authoritative release-gating policy for the PoeTech / SKOS platform.
It tells a developer, an orchestrator, or a future Claude session exactly how much soak
and review a given change must clear before it reaches the family or the public.

---

## Purpose — why tiering exists

We ship fast. That is a feature: the continuous feedback reel drops feedback-to-upgrade
lag from a day to about five minutes (see wf27/wf31, commit `02c3930`). But speed without
calibration is how trust-bearing surfaces get broken in production. The localStorage
hydration leak (LESSONS-LEARNED.md, first entry 2026-06-03) and the wf18 imported-transaction
PII exposure (fix-master-list D17) both reached a live surface before anyone verified the
behavior in the failure mode rather than the clean state.

Tiering is the calibration layer. It answers one question per change: **how much can this
hurt the family or the community if it is wrong, and therefore how much proof do we owe
before it lands?**

It ties directly to three existing pieces of the operating doctrine:

- **`feedback-risk-clarify-before-change`** — the six low-risk tests. A change that passes
  all six is, by definition, Tier A. The tiering model is the structural home for those tests.
- **`project-continuous-feedback-reel`** — the five-minute polling cadence. Tiering does NOT
  slow the reel down; it routes which changes ride the reel straight to main (Tier A) and
  which soak on a preview first (Tier B / C).
- **LESSONS-LEARNED.md, Principle P3 (production-outcome verification)** — "Vercel says ready"
  is not "the fix actually fixed it." Tiers B and C exist precisely to force a real
  production-outcome probe from a clean context before a trust-bearing change is trusted.

Default posture (binding): **Tier A unless a change explicitly meets Tier B or Tier C
criteria.** Do not add gates where they are not earned. The cost of an unearned gate is
real — it taxes every shipper and trains the team to route around the gate.

---

## The three tiers

### Tier A — Ship direct to main (no staging, < 5 min after commit)

- Critical security/privacy fixes (the hostname gate, PII fixes)
- Documented bug fixes with a verified reproducer
- Copy/typo/capitalization corrections
- Memory + foundation doc updates (no user-facing changes)
- NAS-only sovereign surfaces with no public exposure
- Anything that passes the six "low risk" tests defined in `feedback-risk-clarify-before-change`
  memory: additive + try/catch-wrapped + reversible-within-seconds + well-isolated + no new
  public attack surface + no new privacy/TLC implications

### Tier B — Soak on a feature branch's Vercel preview for 30-60 min (or until self-verified)

- New product features
- Visual changes / persona-card additions
- Workflow refactors (cron changes, state-model changes — like tonight's wf27/wf31)
- Tier / pricing copy
- Anything that doesn't pass the six low-risk tests but isn't user-trust-bearing

### Tier C — Full ~1 week soak + structured family review + Quality Gatekeeper sign-off

- Architectural changes (new modules, new APIs)
- Front-door / About / mission identity changes
- Sponsor curation / values-alignment criteria
- Anything that touches Family Voice Loop integrity
- COLG-facing surfaces (Bishop Gwin migration brief, sermon-to-content pipeline first launches)
- The first time a new family / community joins (Loved Ones onboarding, partner-church
  directory addition)
- Any change that involves real money flow (Stripe Connect, sponsor payments, marketplace
  transactions)
- Any autonomous, timer-driven, or self-triggering automation — a scheduled Cowork task, an
  n8n cron workflow, the autonomous builder, or any loop that spawns more work or more
  Claude/compute on a clock. This class ships ONLY with a budget + concurrency lock +
  kill-switch (see CLAUDE.md "Autonomous Automation Requires Three Brakes"), and is Tier C
  regardless of "NAS-only sovereign" or "additive" reasoning — sovereignty of location does
  not bound cost or blast radius. (Added 2026-06-08 post-incident; LESSONS-LEARNED.md
  2026-06-06, P10 / P11 / P12.)

---

## Quick-reference decision flowchart

Run these yes/no questions top to bottom. The first "yes" that lands you in a tier wins.
This should take about ten seconds.

1. Does the change touch real money flow, a new module/API, the front-door/About/mission
   identity, sponsor-alignment criteria, Family Voice Loop integrity, a COLG-facing surface,
   the first onboarding of a new family/community, OR does it ship autonomous timer-driven /
   self-triggering automation (a scheduled task, a cron workflow, the autonomous builder, any
   loop that spawns more work or compute on a clock)?
   -> **YES = Tier C.** Stop here. (Automation in this class also requires a budget +
   concurrency lock + kill-switch before it ships active — see CLAUDE.md.)

2. Is it user-trust-bearing in some other way — a new product feature, a visible visual
   change, persona-card additions, a workflow refactor (cron/state-model), or tier/pricing copy?
   -> **YES = Tier B.** Stop here.

3. Does it pass ALL SIX low-risk tests? (additive AND try/catch-wrapped AND
   reversible-within-seconds AND well-isolated AND no new public attack surface AND no new
   privacy/TLC implications)
   -> **YES = Tier A.** Ship direct.

4. Is it a critical security/privacy fix, a documented bug fix with a verified reproducer, a
   copy/typo/capitalization correction, a memory or foundation-doc update, or a NAS-only
   sovereign surface with no public exposure?
   -> **YES = Tier A.** Ship direct.

5. None of the above cleanly?
   -> **Default to Tier B** (soak it), and surface the ambiguity to a reviewer. When unsure,
   a short preview soak is cheap; an unearned week-long gate is not, and shipping a
   trust-bearing change straight to main is not.

---

## Vercel preview URL pattern

Each git branch pushed to the repo's Vercel project gets an automatic per-branch preview
deployment at the Vercel default per-branch preview URL:

```
kingdom-pwa-node-git-<branch>-darrellpoe06.vercel.app
```

So the `staging` branch (created alongside this doc) is served at:

```
kingdom-pwa-node-git-staging-darrellpoe06.vercel.app
```

A feature branch named e.g. `feat/persona-cards` would be served at
`kingdom-pwa-node-git-feat-persona-cards-darrellpoe06.vercel.app` (Vercel slugifies the
branch name — slashes become hyphens). This is the Vercel default per-branch preview URL
convention; verify the exact host against the Vercel dashboard's "Deployments" tab for the
branch if a precise link is needed for a reviewer.

A Tier B change lands on a feature branch (or `staging`), soaks 30-60 min on its preview URL
while the shipper self-verifies in a CLEAN context (P3), then merges to main.

---

## NAS workflow staging pattern (convention only — implementation lands later)

n8n workflows do not have Vercel previews. The staging convention for a workflow that needs
a soak is the **`wf-staging-*` namespace**: import the candidate workflow under a name
prefixed `wf-staging-` (e.g. `wf-staging-36-quality-gatekeeper`), point it at a non-production
webhook path, exercise it with the workflow's test harness against real-shaped payloads, and
promote it to its production name only after it clears its soak. The production workflow keeps
running untouched during the staging workflow's soak.

This section describes the convention only. The actual `wf-staging-*` apply tooling and the
promote/demote scripts land in a later commit; this document reserves the namespace and the
pattern so future work has a known place to plug in.

---

## Tier C reviewers

A Tier C change requires structured family review and Quality Gatekeeper (wf36) sign-off.
The reviewers are assigned by whose domain the change touches:

- **Darrell** — always. He governs (GOVERNANCE-EXECUTION-ADVISORY: Darrell governs,
  Foundation executes, Claude advises).
- **Christina** — when the change touches TLC/clinical surfaces, Loved Ones chosen-family
  admits, money flow she co-governs, or any area where she is a named co-authority.
- **Christiana** (optional) — when the change touches a surface in her domain.

The exact reviewer set is matched to the change. Not every Tier C change needs all three;
it needs Darrell plus whoever owns the touched domain.

### Override clause

If any reviewer says **"tier-down"** or **"tier-up"**, that wins. A reviewer's explicit
re-tiering is senior to the flowchart. Log the override with the change so the audit trail
shows who re-tiered and why (consistent with wf36 being advisory, not absolute — an
authorized governor may override a BLOCK by logging it).

---

## Pairs-with

- **`feedback-risk-clarify-before-change`** (memory) — the six low-risk tests; the gate for
  Tier A.
- **`project-continuous-feedback-reel`** (memory) — the five-minute cadence tiering routes
  changes onto without slowing.
- **`LESSONS-LEARNED.md`** — Principle P3 (production-outcome verification, not just deploy
  verification) and Principle P4 (verify in the FAILURE MODE, not the clean state). Tiers B
  and C exist to force exactly the verification P3/P4 demand before a trust-bearing change is
  trusted.
- **`QUALITY-GATEKEEPER.md`** + `36-quality-gatekeeper.json` (wf36) — the Tier C sign-off
  gate. The wf36 "Tier check (stub)" node is the structural hook where tier-detection logic
  will plug in.
- **`PERPETUAL-PIPELINE-HEALTH.md`** — the resilience standard a Tier A change must satisfy
  (try/catch every external I/O, idempotent, reversible).
- **`GOVERNANCE-EXECUTION-ADVISORY.md`** — the three-role distribution that grounds the Tier C
  reviewer assignment and the override clause.
- **`AI-FOUNDATION-INTERNAL-OPERATIONS.md`** — why NAS-only sovereign surfaces are Tier A
  (no public exposure to soak against).

---

## Cross-reference to LESSONS-LEARNED.md (Principles Extracted)

- **P3 — Production outcome verification, not just deploy verification.** "Vercel says ready"
  + "n8n says workflows active" is not "the fix actually fixed it." Every fix needs a
  synthetic probe that LOADS the live surface from a CLEAN context and asserts the new
  behavior. Tier B's soak window and Tier C's review exist to make room for exactly that probe.
- **P4 — Marking a fix "verified" requires testing in the FAILURE MODE, not the clean state.**
  A demo-mode pass tells you the demo path works; it does not tell you the
  already-populated-state path works. Tiering forces trust-bearing changes through a soak
  where the failure-mode test can run before the change is trusted.

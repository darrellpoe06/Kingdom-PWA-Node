---
id: DR-0277
title: The stamp-gated rider is the third arming way; every autonomous lane gets a witness OUTSIDE its own failure domain, and a deterministic pause must clear itself
date: 2026-08-06
status: accepted
supersedes: []
superseded-by: null
tier: C (carried with its proof)
entities: [all]
grounds: [WAYS-REVIEW, VERIFICATION-DOCTRINE, THREE-BRAKES, NO-STATIC-DATA, PERPETUAL-IMPROVEMENT, EXECUTION-OUTCOME-OBSERVABILITY, DECISION-RECORDS]
source: 2026-08-05/06 — Darrell; "Comprehensive review of the process and opportunities and constraints" then "did you actually review the Ways and documentation fully... do it..."
---

## Context

The Harvest Ledger's transcript pipeline was dead for a month — 81 of 858 videos
transcribed, last row written 2026-07-06 — and **nothing rang.** The 2026-08-05
review (REV-0241) diagnosed the proximate cause: the loader was parked on a
manual app button while the CI path is IP-blocked by YouTube, the classic
DR-0247 waiting-by-default. It shipped a fix and called the stall closed.

Darrell then asked whether the Ways had actually been reviewed *fully*. They had
not. The deeper pass (REV-0242, five parallel readers over the foundations, the
decision ledger, the review registry, the enforcement machinery, and a full
spec-conformance trace) found that the first fix had **re-created the very
failure class it set out to end**, and that the real root cause had not been
touched at all:

- The loader's auto-pause was a human-cleared kill-switch whose only documented
  clear path — the app's `resume-transcripts` job — routes through
  `ops-runner.py`, which is in neither `services.json` nor `registry.json` and
  last ran 2026-07-06. Three blocked runs would have stopped the drain
  **permanently and silently.**
- **Every alarm lived on the NAS.** `harvest-stall-guard.mjs` is real and
  correct but reads a gitignored path no live code writes, so it always exits 0.
  The loop reel's ntfy requires the loop to run, so a powered-down NAS emits
  nothing. The announce relay is itself a Funnel URL *on the NAS*. The watchdog
  died with the host, and the bell rode the failure domain.
- Net: the only witness to a month-long data-plane stall was a human opening the
  app — which is exactly how it was eventually found, thirty days late.

This is the third arming/observability decision in the DR-0247 → DR-0254 line,
and it closes DR-0135's lapsed 2026-07-31 data-plane-probe commitment.

## Decision

1. **The stamp-gated rider is the third standard arming way.** When a lane's
   safe pace is slower than any clock available, it rides an already-armed
   manifest (`services-sync`) as an idempotent installer with a timestamp
   divider, rather than requesting a new DSM entry. The divider — not the
   scheduler — sets cadence. Zero new human touches; merging the manifest entry
   *is* the start (DR-0247). A cheap stamp-gated rider is registered **first**,
   because the runner kills the whole cycle at one tree-wide timeout and a slow
   sibling would otherwise starve it silently while the cycle stayed green.

2. **This class is Tier C, carried with its proof — never a stall.** Timer-driven,
   outbound-network, prod-writing automation is Tier C; "it's only a manifest
   rider" and "NAS-only" do not downgrade it (PRINCIPLES TIER-C, DR-0088). Tier C
   here means carry the proof in the same merge (DR-0225), not convene a meeting.

3. **A deterministic lane's pause must clear ITSELF.** DR-0248 removed the manual
   kill-switch from this class; a pause that waits on a hand is that switch
   wearing a hat, and a pause whose clear path routes through uninstalled code is
   a permanent silent stop. Every backoff in this class is **time-decayed** and
   resumes on its own. **No stop-path may name a runner that no enabled service
   installs** — gated in `services-sync-guard.test.js`.

4. **Every autonomous lane gets a witness OUTSIDE its own failure domain.** An
   alarm co-located with the thing it watches is not an alarm. The witness must
   run on infrastructure that survives the failure it reports (for NAS lanes:
   a GitHub runner), must measure the **outcome** rather than the mechanism so it
   catches the stall whatever the cause, must file a durable queryable record,
   and must **fail its own run** so the signal exists without opening the app.
   `harvest-health.yml` is the first instance and the pattern. Unknown is never
   reported as healthy (DR-0076).

5. **`enabled` means *clocked*.** A registry loop may ship `enabled: true` only
   when a clock actually fires it. An enabled-but-unclocked loop reads green
   while nothing runs — a check that means nothing (DR-0076 §3) — and is now
   gated. Where two paths can drive one lane, the additive rate against the
   measured ceiling is recorded, and arming the second requires lowering the
   first's budget in the same change.

6. **Pace and ceilings are stated in the units that actually bind.** The trickle's
   ~32 videos/day is ~64–96 HTTP calls/day against the measured ~180/day
   IpBlocked ceiling — roughly half the budget, not a fifth. A pace claim in a
   different unit than the constraint is an unverified claim.

## Consequences

- `harvest-health.yml` ships **active** (the site-health/DR-0110 precedent): a
  witness that waits to be armed is precisely the failure it exists to end.
- Reads against a growing corpus are paged; PostgREST's silent 1000-row cap had
  the drain days from a permanent phantom gap at 858 videos and climbing.
- Amends in practice: DR-0248 (the loader-level pause becomes a decaying
  backoff), DR-0088 (the app is no longer the trigger for this lane; its steward
  card is carried as a known gap). Executes: DR-0135 §3 (the data-plane probe),
  DR-0145 §4, REV-0008's arming items.
- Every fix landed with a proven-to-catch gate — each verified by reverting the
  fix and watching the test fail, not by assertion.

## Links

`REV-0242` / `REV-0241` (docs/reviews/REVIEWS.md),
`docs/99-session-notes/2026-08-05-harvest-ledger-comprehensive-review.md`,
`.github/workflows/harvest-health.yml`,
`infra/nas-sme-pipeline/transcript_trickle_install.sh`,
`infra/nas-sme-pipeline/load-transcripts.py`,
[DR-0247], [DR-0248], [DR-0254], [DR-0255], [DR-0135], [DR-0145], [DR-0088],
[DR-0083], [DR-0076], [DR-0239], [DR-0108], [DR-0225].

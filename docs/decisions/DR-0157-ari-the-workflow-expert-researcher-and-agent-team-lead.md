# DR-0157 — Ari is the workflow expert, the researcher, and the agent-team lead — and every fix updates the Ways

- **Status:** accepted
- **Tier:** A shipped through the lane (derived duties + a derived registry; no schema, no money; anything autonomous inside it stays behind the three brakes)
- **Scope:** `app/vite.config.js` (`__WORKFLOW_REGISTRY__` — the registry measured from the stored exports), `app/src/lib/workflow-registry.js` (+ test), `app/src/lib/ari-notes.js` (four new standing duties), `app/src/components/Discussions.jsx` (the workflow bench on Ari's record)
- **Date:** 2026-07-10
- **Principles:** NO-STATIC-DATA (DR-0121), VERIFICATION-DOCTRINE (DR-0076), APP-IS-PRIMARY (DR-0065), GOVERN-EXECUTE-ADVISE, THREE-BRAKES, WAYS-REVIEW (DR-0108), PERPETUAL-IMPROVEMENT (DR-0075)

## Directive

Darrell, 2026-07-10, verbatim: *"Ari should be an expert on each workflow PoeTech stores why we use it and also the researcher for us and Ari should be in charge of agent teams as necessary for each project or job etc Also all fixes need documentation and added to the Ways Again when we add features and fix issues we need to update our Ways and documentation and find the opportunities and constraints, Ari's responsibility and reports should all update to reflect as well all inside the PoeTech App. No static data combine what makes sense and keep cleaning until we like it. Period. Make sure it has quality comprehensive processes that adds the maximum value to the over all process."*

The "Again" is the signal: the fixes-update-the-Ways discipline already exists (DR-0102/DR-0108); what kept slipping was the IN-APP reflection. This DR makes each piece structural.

## Decision

1. **Ari is the expert on every stored workflow — and the expertise is derived, not claimed.** The build measures a registry from the REAL workflow exports in the repo (`docs/00-foundations/n8n-workflows/` + `infra/n8n/` — 54 files today): name, active flag, webhook doors, node count, all from the files. The WHY comes from each workflow's paired README (first real paragraph). **A workflow with no recorded why renders as a NAMED GAP Ari owns closing, file by file** — an honest debt on the bench, never an invented description and never a hidden blank (NO-STATIC-DATA; the same posture as the Research Day's "no pass on file reads overdue"). The bench renders on Ari's record beside his duties, updating every build.
2. **Ari is the house researcher.** Every research ask runs the DR-0143 intake (house-first, premise-verified, evidence-before-adoption), speaks in DR-0100's three tiers, and files findings where the work reads them — the Ways, the ledger, the boards — never a chat-only answer that evaporates.
3. **Ari leads agent teams per project/job.** Ari composes the team a job needs (finders, verifiers, builders, reviewers — DR-0141's supporting-agent classes generalized beyond input handling), owns their assignments on the boards, and reports their output with evidence. **Anything autonomous or timer-driven in a team ships inactive under the three brakes**; judgment surfaces to the Governor as recommendations (GOVERN-EXECUTE-ADVISE). This pairs with DR-0154 (Ari the project manager): the PM loop names the gaps; this charter staffs them.
4. **Every fix updates the Ways — as a standing duty on Ari's record, not a session's memory.** A fix or feature is not done until: the decision is on the ledger, opportunities AND constraints are named with dates, LESSONS is mined when something bit, and Ari's duties/reports reflect it — all inside the app, derived from the record. The duty resolving against this DR makes the discipline visible on the surface the family reads; a session that skips it leaves a visible hole, not a silent one.

## Opportunities and constraints (routed)

- **Opportunity:** the workflow bench's gap list is a work queue — each gap closes with a small paired-README commit sourced from the real docs (the wfNN references across `docs/`), and the readout measures progress. Ari's tending lane consumes it when it arms. `re-review: 2026-07-17`.
- **Opportunity:** the registry's webhook doors + active flags can join the DevOps/OpsBoard provenance line (currently a hand-typed static-data finding, DR-0139) — one derived source replacing painted counts. Routed with task: the static-data burn-down. `re-review: 2026-07-17`.
- **Constraint (held):** repo `active` is REPO state, not live n8n run-state (the file's own caveat since DR-0061); live status stays with the dispatch feed. The bench says "active in repo" and never claims live.
- **Constraint (held):** agent-team autonomy is Tier C — the charter authorizes Ari to COMPOSE and RECOMMEND; arming any self-running cadence takes the Governor's named gate and all three brakes.

## Supersedes / pairs

Pairs with DR-0154 (Ari the PM — the loop this charter staffs), DR-0141 (input manager — the supporting-agent classes generalized), DR-0143 (sourcing bench — the researcher's intake), DR-0120/0121/0122 (derived tending, no static data, duties resolving live), DR-0108 (ways-review). No supersession.

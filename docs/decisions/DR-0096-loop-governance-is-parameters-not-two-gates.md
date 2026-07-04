# DR-0096 — Loop governance is the parameters + the humans, not two manual gates

- **Status:** accepted
- **Tier:** B (control-mechanism refactor of the deterministic NAS loop runner; ships inert, three brakes preserved, no new autonomous compute)
- **Scope:** the deterministic NAS loop runner (`infra/nas-loops/run.mjs`, `run.sh`, README) and its pattern doc; the arming model for the deterministic loop class
- **Date:** 2026-07-04
- **Principles:** GOVERN-EXECUTE-ADVISE, PERPETUAL-IMPROVEMENT, VERIFICATION-DOCTRINE, APP-IS-PRIMARY, DECISION-RECORDS

## Directive

Darrell, 2026-07-04, after arming the runner with `LOOPS_ARMED=1 node ...` and watching it stay PLAN-ONLY because the runner needed a *separate* `state/LOOPS_ARMED` file AND a `--run` flag: "I want automation with governance in the code and humans we have that we don't need two stops just the parameters..."

## What the trace found

To run one deterministic loop live, the runner required **two manual gates layered on top of the three brakes**: (1) a `state/LOOPS_ARMED` file present, and (2) a `--run` flag on the CLI. The arm was read from a *file* — so `LOOPS_ARMED=1` as an environment parameter (the natural mental model, and what Darrell typed) was silently ignored. Two ceremonies, one of them not matching how a parameter is normally set. That is friction, not safety: the redundant gate does not bound cost or blast radius — the **three brakes** (budget cap + wall-clock timeout, single-flight lock, kill-switch) already do.

## Decision

**Governance is the coded parameters plus the humans we have — one arm, no redundant `--run` ceremony.**

- **One arm, parameter-first:** `LOOPS_ARMED` is a **parameter** (env or `infra/nas-loops/.env`, gitignored), truthy ⇒ armed. It **ships UNSET**, so the runner is inert on deploy. The legacy `state/LOOPS_ARMED` file is still honored so any hand-armed NAS keeps working.
- **No separate `--run` gate:** once armed, invoking a loop **runs** it, bounded by the three brakes. `--dry-run` (alias `--plan`) previews the decision and executes nothing. Disarmed ⇒ `decideRun` HOLDs, so a bare invocation can never run by accident.
- **The humans:** the registry (`enabled` + caps + timeouts) is the reviewed, committed governance-in-code; the person holds the kill-switch (`touch state/KILL_SWITCH`) and the arming decision. DSM Task Scheduler stays the enable/disable governance UI.

## The three brakes are unchanged (the reconciliation)

This does **not** relax the binding rule "Autonomous Automation Requires Three Brakes." All three remain exactly as they were, enforced by the same pure, proven-to-catch core (`scripts/lib/nas-loops.mjs`): **budget** (per-day call cap + per-run wall-clock timeout), **concurrency lock** (atomic per-loop lockdir), **kill-switch** (fleet-wide inert file). "Ships inert" is preserved — the arm parameter ships unset. What is removed is a *fourth/fifth* manual gate that added ceremony without bounding anything. Arming remains a deliberate, attended act by the Governor — **never while travelling** (the 2026-06-06 runaway rule, P10–P12).

## Guards

The decision core is unchanged and its proven-to-catch suite (`app/src/__tests__/nas-loops.test.js`) still pins every brake to BOTH block and open, and asserts the shipped `registry.json` is valid and ships with no arm present. The runner harness change (env-or-file arm; `--dry-run` replaces required `--run`) was smoke-verified against the real script: disarmed → `[inert] ... disarmed`; `LOOPS_ARMED=1` → GO and executes; `--dry-run` → preview only.

## Not done, with why (DR-0075)

- **The AI loop class keeps its stricter, separate gate** (`RESUME_ARMED` + `$`/token budget + cap-window via `scripts/cap-resume.mjs`). This DR simplifies only the **deterministic** class, which summons no vendor and carries no `$` blast radius. Collapsing the AI class the same way is **not** done — its extra gates bound real spend. **re-review: only if the AI-class arming is ever itself found redundant; no trigger event scheduled.**

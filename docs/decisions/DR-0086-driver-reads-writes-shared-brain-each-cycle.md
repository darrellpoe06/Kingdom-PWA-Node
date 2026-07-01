---
id: DR-0086
title: The build driver reads the shared brain IN and writes decisions+outcomes OUT every cycle — institutional memory is the shared brain both humans and agents read/write
date: 2026-07-01
status: accepted
supersedes: []
superseded-by: null
tier: C
entities: [all]
grounds: [SHARED-BRAIN, INSTITUTIONAL-MEMORY-EVENTS, VERIFICATION-DOCTRINE, DECISION-RECORDS, DETERMINISTIC-FIRST, GOVERN-EXECUTE-ADVISE, THREE-BRAKES]
source: 2026-07-01 — Darrell: "let's collaborate better … AI and humans share the SAME weakness — MEMORY — so PoeTech's institutional memory is the SHARED BRAIN both read/write." Coordination from the DB-architecture session.
---

## Context

The recurring failure across this whole effort is **context loss** — an agent
purges memory or compacts, then re-litigates settled things or loses current
information (named in Layer 0, "The App Is the Primary Artifact"). Darrell's
frame: AI and humans share the *same* weakness — memory — so the fix is a
**shared brain**: the institutional record (decisions, principles, lessons,
events, the Concerns board) that both humans and agents **read and write**.

The NAS-resident build driver (DR-0085) is an always-on, unattended agent. If it
acts without consulting the settled record, or acts without leaving a durable,
structured trace of *why*, it becomes exactly the memory-less actor the principle
warns against.

## Decision

Make **"read the shared brain IN → write decisions+outcomes OUT"** an explicit,
logged, first-class part of **every** driver cycle. Deterministic plumbing — no
LLM needed for the read/write.

**READ (cycle start).** Before acting, the driver reads the canonical settled
record from its sovereign git mirror + the governance store: the decisions
`INDEX` (latest recorded DR), `PRINCIPLES`, the repo `MEMORY.md`,
`LESSONS-LEARNED`, an optional Concerns-board export, and an optional governance
**directives** file. It logs a one-line grounding statement and carries
`grounded_in` into the cycle record. The read is **consequential**: a governance
directive `{"pause_merges": true}` — a human lever living *in the shared brain* —
makes the driver stop its write-actions while still reading and recording.

**WRITE (cycle end).** The driver writes every **material** decision — with its
**WHY** — and the outcome to the canonical governance store
(`/volume1/PoeTech/governance/shared-brain/driver-events.jsonl`), a
sovereign, append-only, human- and agent-readable log. Records:
`{ts, agent, grounded_in, observed, decisions:[{action, target, why, result}], outcome}`.
Examples the driver already emits: *dispatch auto-merge — why: N eligible PRs
lacked enablement*; *update-branch #N — why: behind main, refresh so CI re-runs*;
*defer PRs [...] — why: DIRTY conflicts need reasoning, hand to the local-LLM
lane*. The per-cycle reel keeps the full trace; the governance log stays
high-signal (material decisions only, not a 96/day firehose).

**Why the governance store, not a new sink.** `/volume1/PoeTech/governance/` is
dpoe-writable and is already the canonical governance store (holds
`decision-queue.md`, `pre-authorized-policies.yaml`). We coordinate there rather
than fragment the shared brain. (The n8n-owned Dispatch briefing reel is
read-only to dpoe — a permission bridge to surface these records in Dispatch
Status is the tracked follow-up from DR-0085.)

## Verification (DR-0076)

- `loop.py --selftest` extended to **16/16 PASS** — the governance `pause_merges`
  lever is a pure, tested predicate.
- Live: `shared-brain: READ (grounded in DR-0085, principles=True, memory=54
  lines, lessons=True, …)` logged at cycle start; a structured decision record
  (`defer` the 5 DIRTY PRs, with WHY) written to the governance log at cycle end;
  both steps logged as first-class.

## Consequences

- The unattended driver can no longer act blind to the settled record, and never
  acts without leaving a durable, structured, *why*-bearing trace both future
  agents and humans can read. Context survives cycles and compaction.
- A new **human governance lever** (`driver-directives.json → pause_merges`)
  lives in the shared brain: a person can pause the loop's actions without
  touching code or SSH internals — read is consequential, not ceremony.
- **Coordinates with** the institutional-memory/events + Concerns-board work: the
  driver's `shared-brain/` log is a canonical feed those surfaces can read;
  Concerns lights up automatically when an export is dropped at the known path
  (or when the DR-0080 NAS DB mirror lands and makes the live board readable).
- Refines DR-0085 (the driver) and the DR-0061/0065 governance-queue pattern.

Artifacts: `infra/nas-build-loop/loop.py` (`read_shared_brain`,
`write_shared_brain`, `merges_paused`), `infra/nas-build-loop/README.md`.

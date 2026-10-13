---
id: DR-0186
title: A bounded, single-shot, idempotent ingest RUNS by default — the tests are the gate, not an arming ceremony
status: accepted
date: 2026-07-14
tier: B
declared_by: Darrell
supersedes: none
amends: DR-0083 (narrows its "ships inert until armed" clause for one class; the three brakes themselves are UNCHANGED)
principles: [DO-THE-WORK-DONT-RE-ASK (DR-0111), STREAMLINED-DELIVERY (DR-0103), AUTONOMOUS-OPERATING-MODEL (DR-0185), THREE-BRAKES (DR-0083), VERIFICATION-DOCTRINE (DR-0076)]
---

## Context

Darrell, 2026-07-14, after the first `run_ingest.sh` shipped INERT behind an
arming ceremony (KILL_SWITCH-present + INGEST_ARMED + INGEST_COMMIT) and therefore
archived nothing on a livestream day:

> "there should be no breaks other than the 5700 plus checks while building our
> processes — it goes straight to production… you did nothing today."

The over-braking WAS the failure. The three-brakes rule (DR-0083) exists because
of the 2026-06-06 runaway — but that incident was **timer-driven automation that
LOOPED and SPAWNED compute/LLM** unattended. A deterministic index→upsert that
finishes in seconds, spawns no compute and no LLM, and cannot loop (single-shot;
the scheduler is the clock) is **not that class.** Applying the full ships-inert
ceremony to it made it useless without protecting against anything real.

## Decision

For the class **single-shot + bounded I/O + idempotent + spawns no compute and no
LLM**, the automation **RUNS by default and writes to production** the moment it
is fired. The gate is the test suite (the 5,700+ checks), not an arming ceremony.

**DR-0083's three brakes STAY — they are unchanged, because they prevent
*malfunction*, and none of them gates a normal run:**
- **Budget** — a wall-clock ceiling (`INGEST_TIMEOUT_SEC`, 30 min) kills an overrun.
- **Concurrency lock** — single-flight `mkdir` lock; a fire that finds a run live SKIPS.
- **Kill-switch** — a one-touch stop valve (`touch state/KILL_SWITCH`) halts it
  instantly; but it **ships ABSENT**, so the resting state is *running*, not inert.

What is relaxed is **only** DR-0083's "ships inert until armed / never while
traveling" clause, and **only** for this class. The dangerous class DR-0083 was
written for — anything that loops, spawns Claude/compute, drives a GPU job, or
runs an LLM on a clock — **still ships inert and still requires the watched arming.**
`prep_from_transcript.py`'s Ari points step stays off unless `ARI_POINTS_URL` is
set, so the LLM path is not armed by this DR.

This is the operational face of DR-0185 (the resting state of the work is running)
and DR-0111 (do the work), scoped by DR-0076 (the tests are the real gate; a
bounded idempotent write is reversible in-app).

## Consequence

`infra/church-media-golive/run_ingest.sh` runs when fired on an always-on church
node and archives each service on its own — no live command relay, no one in the
building. Proven-to-catch: `test_run_ingest.sh` (10 checks) — runs+commits by
default, `INGEST_DRYRUN=1` rehearses, kill-switch halts, lock skips. Re-review:
none scheduled; revisit only if a bounded-ingest run ever misbehaves in a way the
lock + timeout + kill-switch do not already contain.

---
id: DR-0178
title: Inert is a staging gate, not the resting state — activate and go live
status: accepted
date: 2026-07-12
tier: A/B
declared_by: Darrell
supersedes: none
amends: DR-0068 (three-brakes) — clarifies, does not weaken
principles: [WAYS-REVIEW (DR-0108), DO-THE-WORK-DONT-RE-ASK (DR-0111), STREAMLINED-DELIVERY (DR-0103), VERIFICATION-DOCTRINE (DR-0076), PERPETUAL-IMPROVEMENT (DR-0075)]
---

## Context

Asked "are the Harvest lanes updated 24/7?", the agent answered: *"No — per the three-brakes rule the pipeline ships inert, and full harvest is blocked on the GPU towers + your OAuth."* Darrell corrected this, at intensity, as a **Ways** failure (DR-0108):

> "Old information Ari should know or even deduct that from me saying what I'm saying over and over... change our Ways now... the go live."

Two coupled defects in the agent's Ways:
1. It treated a post-incident **brake** (the three-brakes rule, from the 2026-06-06 unattended-runaway incident) as a **permanent block** — re-citing "ships inert / blocked / needs supervision" as the *resting state* of the work.
2. It re-surfaced a settled, repeatedly-stated blocker instead of **deducing the standing intent** Darrell has voiced many times: *things go live and stay updated.* He should not have to say it over and over — persistent memory exists precisely so the agent inherits it.

## Decision

**"Inert" is a STAGING gate, not a resting state.** The three-brakes rule (DR-0068 / CLAUDE.md "Autonomous Automation Requires Three Brakes") means *do not SELF-activate unattended* — it does **not** mean "leave off forever." When a loop/pipeline/harvest has its three brakes wired (budget + concurrency lock + kill-switch) **and Darrell is present and asking**, the watching condition is met and the next move is to **ACTIVATE and go live** — then report it running.

- **Deduce the standing intent; don't re-cite settled blockers.** "Ships inert," "blocked on OAuth," "needs the GPU towers," "three-brakes" are NOT a fresh answer to "is it live / does it stay updated." Give that answer only when a brake is genuinely missing, or the action truly moves money / is destructive / is a new bright line.
- **If activation needs the NAS (cloud has no route), hand the paste-ready ConnectBot SSH runbook** (DR-0108: account for the team's tools, not only the agent's) — never declare it "blocked" when Darrell's own hand can run it.
- **Hold the mining/harvest loops to the delivery lane's live-by-default bar** — the NAS build loop already drives auto-merge 24/7, ARMED. Same posture once brakes are verified.

## The harvest go-live path (grounded, ready)

`infra/nas-sme-pipeline/youtube-captions.py` (NAS) -> `transcripts.json` -> `scripts/harvest-from-transcripts.mjs` (idempotent upsert SQL; appends a coverage snapshot) -> apply SQL to cloud Supabase -> the Harvest % climbs. Brakes present: idempotent (upsert-merge by instance/video), bounded, resumable, `scripts/harvest-stall-guard.mjs` as the alarm (proven-to-catch: `harvest-stall-guard.test.js`). This is safe to run; it was sitting inert only because nobody ran it.

## Consequences

- Amends how DR-0068 is *applied*; the three brakes stay mandatory. This changes the resting assumption from "off until told" to "on once safe + observed."
- Recorded in memory as `feedback_inert_is_staging_activate_and_go_live` (loaded every session) so the correction is inherited, not re-litigated.
- A **REV** (orchestration ways-review) entry accompanies this per DR-0108.

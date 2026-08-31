---
id: DR-0319
title: A lane is not deployed until something INSTALLS it and something WATCHES it — the ops queue died of both
date: 2026-08-31
status: accepted
supersedes: []
superseded-by: null
tier: A
entities: [nas, ops]
grounds: [WAYS-REVIEW, VERIFICATION-DOCTRINE, NOTHING-WAITS, APP-IS-PRIMARY, PERPETUAL-IMPROVEMENT, DECISION-RECORDS]
source: 2026-08-31 — Darrell; "for claude to do it without me.... everytime... not just some times..." then "workflows not working end to end? Ari not responsible?" then "comprehensive fix!!!!!!!!!!!"
---

## Context

Darrell asked whether CLI and SSH "work again." The answer that mattered was not
about either: the `ops_commands` queue — the mechanism DR-0088 built so the app
(or Claude) could operate the NAS without a shell — **had been dead since
2026-07-06 and nothing said so.**

Measured, not inferred: every row in the table is one of four from 3–6 July, and
a zero-effect probe (an unknown job, which the runner marks `skipped` without
executing) sat `queued` with `started_at` NULL past a 60s poll.

The cause was already written down in this repo, in `services.json`'s own
transcript-trickle note: **"ops-runner.py, which nothing installs."** DR-0088
shipped the runner inactive, armed once by hand as a DSM boot task. Every other
NAS service self-deploys through the manifest; this one was never registered, so
nothing reinstalled it and nothing restarted it after a reboot.

## The two failures, named separately

They are different diseases and each needs its own cure.

1. **NOTHING INSTALLED IT.** A hand-armed daemon is a lane that silently
   un-deploys itself at the next reboot. "Armed once, with someone watching" is
   a bootstrap posture that became the permanent state (DR-0247's
   waiting-by-default, arriving through the back door).
2. **NOTHING ACTIVE WATCHED IT.** DR-0088 *did* design a witness, and it is real
   — `ops-commands.js runnerHint` → *"Still queued — is the NAS runner armed?"*
   But it is **passive**: it speaks only to a steward already looking at the
   Harvest Ledger card. A dead runner was a visible state with nobody in the
   room. (An earlier draft of this review claimed there was no witness at all;
   reading DR-0088 corrected it. The distinction is the finding.)

## Decision

1. **The runner rides the already-armed clock, with no daemon at all.**
   `infra/nas-sme-pipeline/ops_runner_install.sh` drains the queue with `--once`
   on the 15-minute services-sync cycle, registered in `services.json`. There is
   no process to outlive a reboot, so there is nothing to re-arm, ever. A reboot
   costs one cycle instead of eight weeks. Latency moves ~1 min → ≤15 min, which
   is invisible for the two whitelisted jobs and is the whole distance between
   "usually nothing" and "every time."
2. **The kill-switch can no longer stop the lane forever.** The runner's pause
   required a human to delete `out/.ops-runner-paused` on a box nobody opens.
   The installer now clears a pause older than 6h, loudly, naming what it
   cleared; a genuinely broken runner simply re-pauses (DR-0248; the
   transcript-trickle precedent, whose own note flagged this exact trap).
3. **The queue gets an ACTIVE witness outside its own failure domain.**
   `.github/workflows/ops-queue-health.yml` measures the oldest queued command
   every 2h from a GitHub runner — outside the NAS, because the NAS is the thing
   most likely to be broken — and files the rolling `incident`. **An empty queue
   reports `idle`, never green:** nothing queued is not evidence the runner
   lives (LESSONS P22 — a check that cannot fail is theatre).
4. **A claimed witness must exist.** Writing the service entry, the agent typed
   `Witness: ops-queue-health.yml` *before that workflow existed* — a false claim
   in a committed artifact, in the house voice, about the one property the
   manifest cannot check for itself. Now gated: any `Witness: X.yml` in a service
   description must name a real workflow.
5. **A new NAS lane cannot ship unwatched (ratchet).** Declaring a lane in
   `services.json` now requires answering "what tells us when this stops?" The
   eight existing witnessless lanes are recorded debt; the list may only shrink.
   Deliberately a ratchet, not a retrofit: writing eight probes tonight would
   invent instruments for failure shapes nobody has measured — the opposite of
   DR-0076.

## What was NOT changed, and why

`nas-health.yml`, `mcp-health.yml` and `install-health.yml` are dispatch-only
**by recorded design** — each states the three-brakes rationale in its own
header ("this is observation, but the runner still only fires on a hand or a
session"). They were surveyed and left alone. Changing a documented posture
because a survey counted it would be drift, not a fix.

## The capability correction (DR-0108, and the reason this DR exists)

Asked whether SSH works, the agent measured its own sandbox (no ssh binary, LAN
:22 unreachable, poetech.us 000) and reported those limits as the answer —
**the exact failure DR-0108 was written about**, repeated in the session that
was reviewing it. COMPREHENSIVE-REVIEW-STANDARD dimension 5 names the remedy and
the agent had not read it: the **remote-hands channel** (`nas-bootstrap.yml` /
`nas-health.yml`) has a runner join the tailnet and SSH to the NAS as `dpoe`, so
NAS-side work is channel-drivable. **Proven the same session:** `nas-health` was
dispatched and succeeded end-to-end — tailnet joined, SSH connected, NAS
observed. Claude reaches the NAS. It always could.

## Consequences

- "Claude does it without me, every time" is now true for the two whitelisted
  jobs by construction, and the queue is drivable directly from a DB insert.
- The probe row left in `ops_commands` is deliberate: when the runner installs,
  it flips to `skipped` — live end-to-end proof rather than an assertion.
- Adding an operable job stays a reviewed code change to the runner's whitelist
  (DR-0088 unchanged): the queue never executes a shell string.

## Links

[DR-0088] (the queue), [DR-0108] (scope to the team's channels), [DR-0236]
(nothing waits), [DR-0247] (started by default), [DR-0248] (deterministic class,
self-clearing brakes), [DR-0125] (a witness outside the failure domain),
[DR-0239] (what comprehensive means), `docs/reviews/REVIEWS.md` (the ways-review
record).

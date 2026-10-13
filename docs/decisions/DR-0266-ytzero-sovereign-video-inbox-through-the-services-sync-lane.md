---
id: DR-0266
title: YT Zero adopted — the sovereign chosen-channels video inbox, deployed through the services-sync lane, pinned, LAN-only v1
date: 2026-08-03
status: accepted
supersedes: []
superseded-by: null
tier: B
entities: [poetech]
grounds: [SOVEREIGN-FIRST, DETERMINISTIC-FIRST, VERIFICATION-DOCTRINE, COST-DISCIPLINE, PERPETUAL-IMPROVEMENT, WAYS-REVIEW]
source: 2026-08-03 session — Darrell spoke the mariushosting YT Zero install guide into the channel; PR #1164 (merged); REV-0226
---

## Context

Darrell brought the mariushosting "Install YT Zero on Your Synology NAS" guide (2026-08-02) into the channel with "opportunities and constraints for our projects and services." Spoken input is build input; the guide's Portainer path is a hand-driven way ours replaces.

## Decision

**YT Zero (`ghcr.io/pelski/ytzero`) is adopted as a NAS service** — the family's chosen-channels-only YouTube inbox: public RSS into its own SQLite, no Google account, no API key, no recommendation feed; per-profile locks; optional yt-dlp offline downloads; SponsorBlock/DeArrow on.

- **Deploy way:** the services-sync manifest (`infra/nas-loops/services.json`, `enabled: true`) + the idempotent installer `infra/nas-ytzero/install.sh` — merge IS the deploy (DR-0236/DR-0247). NOT Portainer, NOT a hand-run stack, NOT a new n8n webhook (DR-0132 posture).
- **Pinned, never floating:** image pinned (`0.25.3`, tag verified on ghcr.io 2026-08-03); a version bump is a one-line PR through the gates. The pin discipline is now a gate for the whole manifest-managed docker class (`composePinProblems` in `services-sync-guard.test.js` — proven-to-catch).
- **Reach:** host port 3701, LAN/Tailscale only in v1. NO public exposure; NO in-app link yet (cross-origin Funnel throttling + unverified path-prefix behavior — DR-0076 says don't ship the unproven route).
- **NOT decided:** any in-app surface/transport route (re-review 2026-08-17); back-catalog archiving; download pruning + backup exclusion sizing (re-review 2026-09-03).

## Rationale

Because the recommendation feed is the video-shaped ratings posture this platform removes (DR-0098/DR-0100 applied to intake), and a passive deterministic container on our hardware at $0/mo is the sovereign way to remove it. The three-brakes class does not apply — no timer-driven agent compute; the deterministic gate suite and the manifest flag are the controls.

## Consequences

The NAS owns install/repair/start on its own cycle; stop-paths are `enabled: false` in a PR and/or a deliberate container stop (sticks under `unless-stopped`). yt-dlp will periodically break until a pin bump — deliberate, visible, never silent. Reversal = one manifest flag.

## Links

REV-0226 (the ways + documentation record) · `infra/nas-ytzero/README.md` (runbook, opportunities/constraints, re-review ledger) · DR-0236, DR-0247, DR-0132, DR-0076, DR-0075.

# church-runner -- the on-church-network agent runner (LAN-visibility tier)

An always-on runner homed on the **church-side NAS** that gives an agent driving
from Darrell's home laptop -- otherwise **blind to the church LAN** -- a way to
**look at the wire directly**, read-only, behind the Cage brakes.

Full design + rationale + paste-ready NAS deploy:
[`docs/99-session-notes/2026-06-29-on-church-network-agent-runner-design.md`](../../docs/99-session-notes/2026-06-29-on-church-network-agent-runner-design.md).

---

## What it does

Two tiers. **Only the read-only probe tier is wired here.** The dispatch tier is
documented in the design note and intentionally left un-wired (separate arm).

| Tier | What | Brakes to enable |
| --- | --- | --- |
| **Probe** (wired) | Read-only LAN visibility: discover NDI sources, list UniFi clients, ping the ATEM / left Lenovo Legion (NDI->HDMI bridge) / right OBS box / NovaStar, read NDI discovery + (host-run) Windows Firewall + tailnet peer state. Writes `state/lan-snapshot.json` + appends `events/events.jsonl`. | kill-switch CLEAR + `PROBE_ARMED` + `PROBE_MAX_STEPS>0` + single-flight lock |
| **Dispatch** (not wired) | Send routine build / transcription / voice jobs to the church CUDA towers (`church-cuda` in the mesh registry), AI-idle-only. | all probe brakes **plus** `DISPATCH_ARMED` + a `$` budget |

The probe **can LOOK but never TOUCH.** Every command it runs is checked
read-only by `isReadOnlyCommand()` in
[`scripts/lib/church-lan-probe.mjs`](../../scripts/lib/church-lan-probe.mjs)
both when the plan is built and again immediately before exec.

## Ships INERT

`state/KILL_SWITCH` is committed **present** and there is no `PROBE_ARMED` flag,
so `run.sh` logs `runner_inert` and exits without probing. Bringing the stack up
does **not** arm anything (CLAUDE.md, "Autonomous Automation Requires Three
Brakes"). Arm only with someone watching -- never while Darrell is traveling.

## The three brakes

1. **Budget** -- `PROBE_MAX_STEPS` caps the read-only checks per fire (0 = unset =
   inert). The `$` budget (`BUDGET_*_USD`) governs only the dispatch tier.
2. **Concurrency** -- an atomic `mkdir` single-flight lock (`state/church-runner.lock/`).
   A second fire that finds it held SKIPS.
3. **Kill-switch** -- `state/KILL_SWITCH` present forces inert. Shipped engaged.

Deterministic-first: the schedule + the probe plan are plain code. No LLM runs in
the probe path at all; the LLM is only the worker on a dispatched job (the
separately-armed tier).

## Files

| File | Role |
| --- | --- |
| `lan-targets.json` | Read-only device registry. Unknown IPs are `SME-CONFIRM` and reported `unknown` -- never fabricated. |
| `brakes.sh` | The Cage brakes (two-tier: probe vs dispatch). Mirrors the portable orchestrator's `brakes.sh`. |
| `run.sh` | Single-shot braked entrypoint. Gates -> lock -> `node probe.mjs` -> release. |
| `probe.mjs` | I/O wrapper: build plan -> exec read-only steps -> classify -> write snapshot + event reel. |
| `docker-compose.yml` | Containerized deploy (host network for LAN visibility). Ships inert. |
| `.env.example` | Per-site config template (copy to `.env`, never committed). |
| `state/`, `events/` | Writable runtime state + append-only JSONL reel. |

## Run it (after reading the design note's stand-up section)

**Recommended -- DSM-native on the church NAS** (covers the host-tool probes
`tailscale-status` + `firewall-state` that a minimal container lacks):

```
sh infra/church-runner/run.sh
```

scheduled by Synology **Control Panel -> Task Scheduler** on a cadence. While
inert it just logs and exits.

**Container alternative** (ping / curl / nc / NDI-HTTP probes):

```
docker compose -f infra/church-runner/docker-compose.yml run --rm probe
```

## Verify (read-only, safe even while inert)

```
node infra/church-runner/probe.mjs    # with PROBE_MAX_STEPS set; writes a snapshot
cat infra/church-runner/state/lan-snapshot.json
```

The snapshot is honest by construction: every device whose IP is not yet
confirmed reads `unknown` and is listed under `sme_pending`. Fill those addresses
in from the COLG device asset register
([`2026-06-29-colg-church-device-asset-register.md`](../../docs/99-session-notes/2026-06-29-colg-church-device-asset-register.md))
as they are captured -- the probe never guesses one.

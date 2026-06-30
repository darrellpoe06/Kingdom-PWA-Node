# On-Church-Network Agent Runner -- research-review + design (sovereign, braked, inert)

**Date:** 2026-06-29
**Context:** Move the build/troubleshooting work onto **owned church hardware** so it is not tied to Darrell's home laptop. Two reasons, both real and documented below: (1) **infrastructure troubleshooting** -- a runner *on* the church LAN can look at the wire the home laptop cannot see; (2) **sovereign always-on build** -- owned hardware carries routine build / transcription / voice / local-coder work independent of the laptop. Delivered research-first ([[feedback-research-first]]), grounded in the primitives this repo already has -- nothing new rearchitected.

> **SME-PENDING (marked `[NEEDS SPEC]`), never fabricated:** church NAS model + LAN IP; church subnet + free addresses; the two tower specs/IPs; UniFi controller URL + read-only API key; whether an ATEM is present and on the LAN; NovaStar management-NIC IP. These are Darrell/BG's hand (Step 0). An unconfirmed address is reported `unknown` -- the probe never guesses one.

---

## TL;DR (the recommendation)

- Stand up a small **always-on runner on the church-side NAS** (`church-rs` / tlcrackstation -- 24/6.5, not livestream-bound). It does two jobs, **only the first is wired now**:
  1. **Read-only LAN visibility probe** (NEW capability) -- discovers NDI sources, lists UniFi clients, pings the ATEM + the left Lenovo Legion (NDI->HDMI bridge) + the right OBS box + NovaStar, reads NDI discovery + (host-run) Windows Firewall + tailnet peer state. Upgrades infra diagnosis from *"ask Darrell to check and report"* to *"look and confirm."*
  2. **GPU-worker dispatch** (documented, **not wired**) -- hands routine build / transcription / voice to the two CUDA towers (`church-cuda` in the mesh registry), AI-idle-only, standing down Sundays. This reuses the existing capability router; it is a **separately-armed** tier.
- Everything is **deterministic-first** (plain-code schedule + probe plan; LLM only as the worker on a dispatched job) and **behind the Cage** (budget + single-flight lock + kill-switch + an append-only event reel). It **ships INERT** -- bringing it up arms nothing.
- Reachable from anywhere over **Tailscale**, so Darrell drives it from the home laptop or his phone.
- **Honest caveat (documented):** owned GPU accelerates **local** models (Ollama / whisper / XTTS), not the vendor brain. Heavy vendor-AI reasoning still runs in the cloud regardless of where this runner lives. The win here is *network reach* + *sovereign routine work*, not "the AI now runs at church."

**Staged rollout (ship the simple win first):**
- **Stage 0 -- TODAY, his hand:** RDP over Tailscale into the **right CUDA tower** (Windows OBS box, the agent launcher app already installed + running on it). Darrell drives the already-installed agent from home; the build runs on the tower's hardware; the laptop is just a screen. No new code, no autonomous anything -- a private remote-desktop bridge. **This is the immediate deliverable; everything below is the path beyond it.** (Section Stage 0.)
- **Stage 1:** persistent session so a closed laptop does not kill work; commits/pushes to GitHub as canonical source.
- **Stage 2 (this change's scaffolding, INERT):** the NAS-homed autonomous runner -- LAN-visibility probe + GPU-worker dispatch behind the Cage.

New code in this change (all inert): `scripts/lib/church-lan-probe.mjs` (pure core, 21 tests), `infra/church-runner/` (registry + brakes + runner + I/O + compose), the `lan-probe` cap + `lan-diagnostics` job class in the mesh registry.

---

## Stage 0 (TODAY) -- RDP over Tailscale into the right CUDA tower (his hand, paste-ready)

**Goal:** use **this Windows tower** (the right CUDA / OBS box, with the agent launcher app already installed and running on it) as the build machine **instead of** the home laptop, reachable from home. The cleanest path for *this exact setup* -- a GUI agent app he wants to *drive*, not just a text shell -- is **Remote Desktop (RDP) over Tailscale**: a private bridge into this same desktop. Build runs on the tower; the laptop is just a screen.

**Darrell executes every step. He authenticates Tailscale and Windows himself -- the agent never touches creds.** Constraints carried forward: the tower is **livestream-primary** (yield it Sundays); heavy vendor reasoning still runs in the cloud (the gain is owned / always-on / remote-reachable build, not laptop-bound).

> These run **on the tower** (a different machine than the laptop), so the blocks prefix `cd C:\` (always exists -- paste-from-anywhere safe) rather than the laptop's repo path. Steps that change system settings need an **elevated PowerShell** ("Run as administrator") -- noted inline. ASCII only, one command per line, no `&&`.

### Step A -- branch check: is Tailscale already installed on this tower?

```
cd C:\
Test-Path "C:\Program Files\Tailscale\tailscale.exe"
```
- **Prints `True`** -> Tailscale is installed. **Skip Step B**, go to Step C (log in).
- **Prints `False`** -> do Step B first.

### Step B -- install Tailscale (only if Step A printed False) [admin]

```
cd C:\
winget install --id Tailscale.Tailscale -e --accept-source-agreements --accept-package-agreements
```
*Proof of success:* the install completes and a Tailscale icon appears in the system tray. (If `winget` is not recognized on this box, download the installer from https://tailscale.com/download/windows and run it -- same result.)

### Step C -- log in to YOUR tailnet (Darrell auths; agent never touches creds)

```
cd C:\
& "C:\Program Files\Tailscale\tailscale.exe" up
```
A browser opens (or a URL prints) -- **sign in with your own Tailscale account**, the same tailnet the home laptop uses. Approve this machine.
*Proof of success:* the command returns to a prompt with no error after you finish the browser login.

### Step D -- note this tower's private Tailscale name + IP (you connect to these from home)

```
cd C:\
& "C:\Program Files\Tailscale\tailscale.exe" ip -4
& "C:\Program Files\Tailscale\tailscale.exe" status
```
*Proof of success:* `ip -4` prints a `100.x.y.z` address; `status` lists this machine by name. **Write down the machine name and the 100.x address** -- that is the private door you RDP into from home.

### Step E -- confirm this is an RDP-capable Windows edition

```
cd C:\
(Get-CimInstance Win32_OperatingSystem).Caption
```
- Says **Pro / Enterprise / Education** -> RDP hosting is supported. Continue to Step F.
- Says **Home** -> Windows Home cannot *host* RDP. Fallback: install a remote-desktop tool that works on Home and rides the same tailnet (e.g. RustDesk or AnyDesk), or, if a text shell is enough, enable OpenSSH Server. Tell me the edition and I will generate that exact branch.

### Step F -- enable Remote Desktop + its firewall rule [admin]

```
cd C:\
Set-ItemProperty -Path "HKLM:\System\CurrentControlSet\Control\Terminal Server" -Name "fDenyTSConnections" -Value 0
Enable-NetFirewallRule -DisplayGroup "Remote Desktop"
```
*Proof of success:*
```
cd C:\
(Get-ItemProperty -Path "HKLM:\System\CurrentControlSet\Control\Terminal Server" -Name "fDenyTSConnections").fDenyTSConnections
```
prints `0`. Tailscale keeps this private -- RDP arrives over the tailnet interface, **not** the open internet.

### Step G -- never sleep while plugged in (else it is unreachable from home) [admin]

```
cd C:\
powercfg /change standby-timeout-ac 0
powercfg /change hibernate-timeout-ac 0
powercfg /change monitor-timeout-ac 0
```
*Proof of success:*
```
cd C:\
powercfg /query SCHEME_CURRENT SUB_SLEEP STANDBYIDLE
```
shows the AC standby index at `0x00000000`. **Leave the tower powered on and signed in** when you go (an RDP session can sign in over the lock screen, but a powered-off or sleeping box is dark).

### Step H -- verify the build runtime is intact (you are at the tower now)

```
cd C:\
git --version
node --version
npm --version
```
*Proof of success:* all three print versions. Then locate the repo checkout the agent app uses (the path may differ from the laptop's):
```
cd C:\
Get-ChildItem -Path C:\ -Recurse -Filter "poe-financial-mvp-v28.jsx" -ErrorAction SilentlyContinue -File | Select-Object -First 1 FullName
```
*Proof of success:* it prints the repo's path (the folder containing it, minus `\app\src\...`, is the repo root). If nothing prints, the repo is not cloned here -- clone it from GitHub (canonical source) before building. Confirm the agent launcher app is the visible, already-running window.

### Step I -- from home, after you leave: RDP in over Tailscale

On the **home laptop** (Tailscale already installed there, same tailnet):
```
cd C:\Users\dpoe\Kingdom-PWA-Node
mstsc /v:TOWER-TAILSCALE-NAME
```
Replace `TOWER-TAILSCALE-NAME` with the machine name (or the `100.x.y.z` IP) from Step D. Sign in with the tower's Windows account.
*Proof of success:* the tower's full desktop appears in the RDP window -- including the already-running agent launcher app -- and you drive the build on the tower's hardware as if you were sitting at it.

**What Stage 0 gets you:** the build machine is now owned hardware, always-on, and reachable from anywhere on your tailnet -- without the laptop. **Open item (Stage 1):** if the RDP session drops, a GUI app keeps running but long shell jobs tied to a closed terminal can die -- run builds inside a persistent session and push commits to GitHub so nothing is lost. **NEED FROM DARRELL to tighten this:** the tower's Windows edition (Step E) if it is Home, and the repo path (Step H) if it is not already cloned.

---

## 0. Reality-trace first (DR-0061 / DR-0076) -- what is actually true today

| Claim worth checking | Verified reality | Source |
| --- | --- | --- |
| "An agent on the home laptop can diagnose the church LAN." | **False.** The laptop is off-site; NDI discovery (mDNS), ARP reachability, UniFi client lists, and the ATEM/Legion/OBS boxes are all on the church LAN and invisible from home. | The whole reason for this note. |
| "The church NAS is reachable." | **No, not yet.** `tlcrackstation` is on the tailnet but **fully firewalled** (22/5000/5001/5678/11434/443 filtered, 2026-06-10 probe). Specs unknown. | `2026-06-29-research-review-sovereign-mesh-two-nas...md` 0/6; mesh `nodes.json` `church-rs`. |
| "The GPUs live in the NAS." | **No.** The 2x RTX 4070 live in companion **tower/OBS boxes** on the church LAN, not the Synology. Routing targets the tower IP, not the NAS IP. | mesh `nodes.json` `church-cuda` note. |
| "Owned GPU means the agent's reasoning runs locally/free." | **Only partly.** GPU accelerates **local** models. The vendor brain (heavy Claude reasoning) runs in the cloud regardless. | Honest-limit, DR-0073 + DR-0076. |
| "An ATEM is on the church LAN." | **Unconfirmed.** Zero ATEM references in the repo -- presence + IP are SME. | Repo search; `lan-targets.json` note. |
| "This machine is on the tailnet." | **True, verified live.** The probe's own `tailscale status` read returned `100.74.53.117` / BackendState Running during build verification. | Smoke-test of `probe.mjs`, this session. |

The design assumes none of the SME gaps are filled; it ships safe and reports `unknown` until they are.

---

## 1. Why a runner ON the church network (rationale 1: infrastructure troubleshooting)

From home, every church-LAN question becomes a relay: *"Darrell, can you open OBS and tell me what NDI sources you see? Can you check the UniFi client list? Is the Legion box pingable?"* That is slow, lossy, and spends the principal's time on what a probe can read in a second.

A runner homed on the church LAN turns that relay into a direct read. **Church-LAN device visibility is an explicit capability** (`lan-probe` cap / `lan-diagnostics` job class in the mesh registry). It answers, read-only:

- **NDI sources on the wire** -- query the NDI Discovery Server (or mDNS browse). The direct answer to *"what NDI is actually being advertised right now"* (pairs with `lib/ndi-output.js` + the program-output bridge).
- **UniFi controller** -- the read-only client/port list: who is on the wire, their IPs, PoE state. (UniFi controller URL is the long-standing `awaiting-input` in `infra/ai-orchestrator/README.md`.)
- **Reachability + RTT** of the ATEM, the left Lenovo Legion (the NDI->HDMI bridge box), the right OBS box, and the NovaStar VX1000 management NIC.
- **NDI discovery reachability** and, when the runner is host-run on a Windows tower, **Windows Firewall profile state** (`netsh advfirewall show`, read-only) -- the usual culprit when NDI "disappears."
- **Tailnet peer state** -- which church + home peers are online, so Darrell knows reach from anywhere.

This is **diagnosis, not control.** The hard invariant (enforced twice -- when the plan is built and again before every exec) is **look but never touch**: `isReadOnlyCommand()` rejects any command containing a mutating verb, a configure/restart, or an output redirect. The runner cannot reboot the ATEM, change a firewall rule, or restart a container. If control is ever wanted, it is a separate, separately-reviewed surface.

## 2. Why owned hardware (rationale 2: sovereign always-on build)

The second reason is independence from the laptop. Owned, always-on hardware can carry routine work the laptop currently gates:

- **Routine, well-scoped build** dispatched to the two CUDA towers as parallel local-coder workers (Aider + Ollama + `qwen2.5-coder:14b`), per the sovereign-mesh review.
- **Transcription** (whisper) and **voice** (XTTS) on the towers' GPUs.
- The runner's own **deterministic scheduling** (health checks, parity probes, the LAN snapshot refresh) -- plain code, no laptop, no vendor call.

**The honest caveat, stated plainly so it is not oversold:** heavy vendor-AI reasoning runs in the cloud regardless of where this runner lives. The towers' GPUs accelerate **local** models only. So this does not make "the AI" sovereign; it makes the *routine, bounded, and private* slice of the work sovereign and laptop-independent, and routes the hard reasoning to the vendor as before (DR-0073 vendor-first; local-first is the GPU-era end state). A hard task **escalates** to the vendor rather than shipping a confident-wrong local diff (DR-0076).

## 3. Homing + architecture

```
  Home laptop / phone  ──Tailscale──►  church-rs (church NAS, 24/6.5)
                                         │  on-church-network runner
                                         │   ├─ lan-probe (read-only)  ── looks at ──►  church LAN
                                         │   │                                          (NDI / UniFi / ATEM /
                                         │   │                                           Legion / OBS / NovaStar)
                                         │   └─ dispatch (NOT wired) ──► church-cuda towers (GPU workers,
                                         │                                AI-idle-only, stand down Sundays)
                                         └─ Cage brakes: budget + lock + kill-switch + event reel
```

- **Always-on runner homes on the church-side NAS** (`church-rs`) -- it is up 24/6.5 and is **not livestream-bound**, unlike the towers. The mesh registry now declares `church-rs` with the `lan-probe` cap.
- **The two CUDA towers are GPU WORKERS the runner dispatches to**, not the runner's home. They are **livestream-first / AI-idle-only** and **stand down during services** (DR-0012 service-time preemption; ties the idle-GPU scheduler + GPU-endpoint routing + mesh capability routing). The left Legion is also the NDI->HDMI bridge into the wall path -- so it is both a probe *target* and a dispatch *worker*.
- **Reachable remotely via Tailscale**, so Darrell drives from anywhere. The LAN snapshot is a small JSON the runner writes; it can be served same-origin over the tailnet for a read-from-anywhere readout.
- **Deterministic-first** ([[project-deterministic-first-ai-only-necessary]] / DR-0080): the schedule and the probe plan are plain code (`scripts/lib/church-lan-probe.mjs`). No LLM runs in the probe path. The LLM is only ever the worker on a dispatched job -- the separately-armed tier.

## 4. Behind the Cage -- the three brakes (and a fourth privilege gate)

Per CLAUDE.md "Autonomous Automation Requires Three Brakes" and [[feedback-no-autonomous-automation-without-brakes]], this timer-fired runner ships with all three, mirroring `infra/ai-orchestrator/portable/orchestrator/lib/brakes.sh`:

1. **Budget** -- `PROBE_MAX_STEPS` bounds the read-only checks per fire (0 = unset = inert). The `$` budget governs only the dispatch tier.
2. **Concurrency lock** -- an atomic `mkdir` single-flight lock; a second fire that finds it held SKIPS (never stacks). Single-shot per fire; the DSM scheduler is the only clock, so a run can never spin.
3. **Kill-switch** -- `state/KILL_SWITCH` present forces inert. **Shipped engaged.**

Plus a **two-tier arm** so the low-risk read-only look and the higher-risk dispatch are separately gated:

- **Probe tier** (read-only LOOK) needs: kill-switch CLEAR + `PROBE_ARMED` + step budget + lock.
- **Dispatch tier** (send work to a GPU tower / summon an LLM worker) needs ALL of the probe brakes **plus** `DISPATCH_ARMED` + a `$` budget. **It is intentionally not wired in `run.sh`** so the read-only look ships safe on its own; the dispatch tier is a later, separately-armed change (Tier C).

The pure gate `churchRunnerBrakeGate()` is unit-tested **proven-to-catch** on every brake (DR-0076 anti-theater: a gate that only ever passes is itself a lie). **Ships INERT, never arms unattended, never while traveling** (DR-0076 / the 2026-06-06 runaway lesson). Arming is Darrell's hand, with someone watching.

## 5. Data + observability

- **`state/lan-snapshot.json`** -- the latest read-only snapshot (per-device status `up`/`down`/`unknown`, latency, the `sme_pending` list). Honest by construction: an unconfirmed device reads `unknown`, never a painted up/down.
- **`events/events.jsonl`** -- append-only audit reel (one JSON object per line): `runner_inert` / `runner_skip` / `probe_start` / `probe_done` / `probe_refused` / `runner_error`. Consistent with the NAS event-reel convention; readable over the tailnet.
- **Single-writer:** the runner is the only writer of its snapshot + reel. No second master.

## 6. SME gates (Step 0 -- Darrell/BG's hand, nothing below has been run)

1. **`[NEEDS SPEC]` church NAS** -- model + LAN IP of `tlcrackstation`, and open the runner's path (SSH or a DSM Task Scheduler job). Today it is fully firewalled.
2. **`[NEEDS SPEC]` church subnet + free addresses** -- the actual `192.168.x.0/24` and reserved IPs for the runner host + tower workers.
3. **`[NEEDS SPEC]` tower specs/IPs** -- per-tower GPU/VRAM/CPU/RAM and Tailscale IPs (the GPU workers; not the NAS).
4. **`[NEEDS SPEC]` UniFi controller** -- base URL + a **read-only** API key (key supplied at runtime from `.env`, never committed).
5. **`[NEEDS SPEC]` ATEM** -- is one present and on the LAN, and its IP (no ATEM is documented in the repo yet).
6. **`[NEEDS SPEC]` NovaStar** -- whether its management NIC is on the LAN, and its IP.

Capture these into the COLG device asset register (`2026-06-29-colg-church-device-asset-register.md`) as they land; the probe reads the registry and never invents an address.

## 7. The stand-up path (paste-ready -- Darrell's hand; nothing below has been run)

> Self-contained per the PowerShell rule: each block starts with `cd` to the repo and uses literal values. SSH/IP targets are `[NEEDS SPEC]` until Step 0 confirms them.

### Step 0 -- confirm the church NAS is reachable (the gate)

```
cd C:\Users\dpoe\Kingdom-PWA-Node
tailscale status
```
*Proof of success:* `tlcrackstation` (or the church NAS hostname) shows as a peer with an IP. If it is still firewalled/offline, stop here -- this is the SME gate; the rest waits.

### Step 1 -- copy the runner to the church NAS

Once Step 0 confirms the host + IP (`[NEEDS SPEC: church NAS IP]`, SSH user `[NEEDS SPEC]`):

```
cd C:\Users\dpoe\Kingdom-PWA-Node
scp -r infra/church-runner scripts/lib/church-lan-probe.mjs <SSH_USER>@<CHURCH_NAS_IP>:/volume1/PoeTech/church-runner-stage/
```
*Proof of success:* `scp` completes; the folder + the pure-core file are on the NAS. (Or deploy via the NAS's own git checkout if one is present, which keeps the `../../scripts/lib` relative import intact.)

### Step 2 -- fill the device registry from the asset register

Edit `infra/church-runner/lan-targets.json` on the NAS, replacing each `SME-CONFIRM` with the real IP **only** as the COLG device asset register confirms it. Leave any still-unknown device as `SME-CONFIRM` -- it will report `unknown`, which is correct, not a failure.

### Step 3 -- verify read-only, while still INERT

```
cd C:\Users\dpoe\Kingdom-PWA-Node
ssh <SSH_USER>@<CHURCH_NAS_IP> "cd /volume1/PoeTech/church-runner-stage && PROBE_MAX_STEPS=8 node church-runner/probe.mjs && cat church-runner/state/lan-snapshot.json"
```
*Proof of success:* a snapshot prints; confirmed devices read `up`/`down` with latency, unconfirmed ones read `unknown` under `sme_pending`. Nothing was changed on any device (read-only).

### Step 4 -- arm the read-only probe (Tier C; with someone watching)

```
cd C:\Users\dpoe\Kingdom-PWA-Node
ssh <SSH_USER>@<CHURCH_NAS_IP> "cd /volume1/PoeTech/church-runner-stage/church-runner && rm -f state/KILL_SWITCH && touch state/PROBE_ARMED"
```
Then schedule `sh .../church-runner/run.sh` in **DSM Control Panel -> Task Scheduler** with `PROBE_MAX_STEPS=8` in the environment (or in `.env`). While inert it just logged and exited; armed, it writes a fresh snapshot each fire.

*Disarm at any time:*
```
cd C:\Users\dpoe\Kingdom-PWA-Node
ssh <SSH_USER>@<CHURCH_NAS_IP> "cd /volume1/PoeTech/church-runner-stage/church-runner && touch state/KILL_SWITCH"
```

### Step 5 -- (LATER, separate change) the dispatch tier

The GPU-worker dispatch tier is **not** wired in this change. Standing it up is a separate Tier C change that adds `DISPATCH_ARMED` + a `$` budget and reuses the existing capability router (`scripts/wake-router.mjs` + the mesh `nodes.json`). Out of scope here on purpose: ship the safe read-only look first.

## 8. Verification screen on this report (DR-0076 + Phil 4:8)

- **Religion check (backbone):** every capability traces to a real device on a real registry; every claim is sourced or flagged `[NEEDS SPEC]`; the pure core is unit-tested proven-to-catch (21 tests) and the I/O path was smoke-tested live (the tailnet read returned this machine's real IP). The runner ships inert with all three brakes.
- **Relationship check (warmth):** it lifts the relay burden off Darrell -- the agent looks instead of asking him to. It is honest about the GPU caveat rather than overselling sovereignty.
- **Phil 4:8 (the Test):** TRUE (no fabricated specs; `unknown` where unknown) - HONORABLE (read-only; cannot touch the wall path) - JUST (the human governs the bright lines; nothing arms unattended) - PURE (no hidden control surface) - LOVELY (less friction for the principal) - COMMENDABLE - EXCELLENT (reuses existing primitives, adds the one missing capability) - PRAISEWORTHY (serves the COLG infrastructure the family stewards).

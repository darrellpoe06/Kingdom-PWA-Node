# Research Review — A Sustainable, Reliable, Headless Method for the Local NAS Loops (Replace/Stabilize n8n)

**Date:** 2026-06-29
**Author:** Claude, acting under the **research-first** binding principle (Darrell, 2026-06-01 evening), the **Verification Doctrine** (DR-0076), and the **no-autonomous-automation-without-three-brakes** rule (2026-06-08, post-incident).
**Triggered by Darrell:** *"I want SUSTAINABLE business systems — n8n kept going down. Gemini suggested another method (while you were offline) for local NAS loops WITHOUT needing to login."*
**Scope:** the **timer-driven local NAS loops** (the 16 `scheduleTrigger`/autonomous workflows), not the request-response webhook surfaces the PWA depends on. The two are different workloads and want different homes — that split is the heart of the recommendation.
**Posture:** religion AND relationship. Every external claim is cited. The recommendation names the smallest viable validation step, ships braked, and **nothing here is applied to the NAS** — this is a recommended path Darrell executes by hand.
**Hard boundary honored:** headless does NOT mean unbraked. Every autonomous/timer loop in the recommended design still carries budget + concurrency lock + kill-switch + observability, reusing the Cage primitives already in the repo.

---

## TL;DR (the recommendation in five lines)

1. **Stop running the timer loops inside n8n.** They are the crash driver and the runaway-risk class at the same time.
2. **Run the loops natively** as small Node/Bash scripts fired by **Synology DSM Task Scheduler** (boot-persistent, root-owned, no login, survives reboot, logs to DSM) — each script carrying the three brakes via the existing Cage lockdir/kill-switch/budget pattern.
3. **Keep n8n — hardened — for what it is genuinely good at:** the bounded request-response **webhook** surfaces the PWA already calls same-origin through the Funnel. Add a memory cap, pin the version, prune executions, add a healthcheck + autoheal. Do NOT rip it out.
4. **Relieve the Ollama RAM contention** (the second crash driver): lower `OLLAMA_MAX_LOADED_MODELS` / `OLLAMA_KEEP_ALIVE`, and never let n8n + Ollama over-commit the box.
5. **If/when the loops outgrow bare scripts**, the right managed destination is **Windmill** (lighter than n8n, code-first, auto-retry-from-checkpoint) — not "n8n but harder." Named as the scale option, not today's move.

This converges with what Gemini most likely suggested (native scheduler + scripts, "no login" = no n8n editor in the path). If Darrell wants a true head-to-head, paste Gemini's exact words and this report will compare them line-by-line.

---

## 1. Why n8n keeps going down — the root-cause diagnosis

The crash is **multi-causal**, and being honest about that matters: a single "fix" wouldn't have held. Six contributing causes, ranked by how much they bear on *this* box (`DS1621xs`, single container, SQLite, Ollama co-resident):

### 1a. Single-process blocking on inline LLM calls (architecture, primary)
n8n's default is a **single-threaded main process** that handles executions sequentially; it works for low-volume but bottlenecks as work increases, and a long-running workflow blocks the instance and can freeze the editor ([n8n queue-mode docs](https://docs.n8n.io/hosting/scaling/queue-mode/); [idir.ai queue-mode guide](https://www.idir.ai/en/blog/scale-n8n-like-the-ultimate-guide-to-queue-mode-docker); [Medium — n8n scaling & reliability](https://medium.com/@orami98/the-n8n-scaling-reliability-guide-queue-mode-topologies-error-handling-at-scale-and-production-9f33b13d2be8)). **Our loops call Ollama inline from Code nodes** (per the 2026-05-28 state note, §"LLM calls are inline HTTP… no retry queue"). A CPU-only 8B/14B generation on the DS1621xs runs minutes; while it runs, the one main process is blocked and every other workflow + the UI stalls. That is the textbook freeze reported across 2025 ([n8n community — UI freezing/unresponsive 1.107.4](https://community.n8n.io/t/n8n-self-hosted-docker-ui-freezing-and-unresponsive-after-latest-update-1-107-4/175181)).

### 1b. Memory contention with Ollama (resource, primary)
n8n wants ≥2 GB and **spikes to 1–2 GB during complex workflows** ([Windmill vs n8n resource numbers](https://dev.to/selfhostingsh/windmill-vs-n8n-which-automation-platform-to-self-host-55a2); [DEV — n8n Docker why it breaks](https://dev.to/farrukh_tariq_b2d419a76cf/n8n-docker-setup-why-it-breaks-and-the-easier-alternative-4185)). Our compose gives **Ollama a 24 GB cap with `OLLAMA_MAX_LOADED_MODELS=4` (~16 GB resident) and `OLLAMA_KEEP_ALIVE=15m`** — and gives **n8n no `mem_limit` at all** (`infra/n8n/docker-compose.yml`). The `keep_alive` model-pin was a named contributor to the 2026-06-06 runaway (`LESSONS-LEARNED.md`, P10–P12). An unbounded n8n next to a pinned 16 GB Ollama on a shared box is exactly the over-commit that triggers OOM-kills under spike ([n8n production guide — swap as OOM safety net](https://massivegrid.com/blog/self-host-n8n-docker-guide/)).

### 1c. SQLite backend degrades and locks (data layer)
n8n's default SQLite **locks the entire file on every write** and handles "maybe a few hundred executions per day before performance degrades" ([LumaDock — Postgres vs SQLite for n8n](https://lumadock.com/tutorials/n8n-postgresql-vs-sqlite); [Serverspace — migrate SQLite→Postgres](https://serverspace.io/support/help/how-to-run-n8n-with-postgresql-and-migrate-from-sqlite-safely/)). With ~16 cron loops firing every 1–10 minutes, hundreds of executions/day is the *normal* state, not the spike.

### 1d. Unpruned `execution_entity` table (slow rot)
Without execution-data pruning, **the executions table grows indefinitely and degrades the DB within weeks** ([n8n Docker pitfalls](https://dev.to/farrukh_tariq_b2d419a76cf/n8n-docker-setup-why-it-breaks-and-the-easier-alternative-4185)). On SQLite that compounds 1c. Our compose sets **no `EXECUTIONS_DATA_PRUNE` envs** — so every run since install is still on disk.

### 1e. `image: …/n8n:latest` — version churn (operational)
We pin `:latest`. 2025 saw multiple "after the latest update it crash-loops / data reverted" reports ([GitHub #17877 — container keeps restarting](https://github.com/n8n-io/n8n/issues/17877); [GitHub #22341 — SQLite data reverts after update](https://github.com/n8n-io/n8n/issues/22341); [community — crashing after 1.83.2](https://community.n8n.io/t/updated-to-1-83-2-appears-to-be-crashing-cant-get-any-useful-debug-info-self-hosted-docker/134155)). An unattended `:latest` pull can swap the engine under us at any restart.

### 1f. The autonomous self-fire loops (the runaway class)
Independent of n8n's health, **wf06 self-mutates every 4h and wf27 self-routes/self-queues every 5 min** (2026-06-10 runaway-risk classification: 16 HOLD-FOR-CAGE). These had no budget / concurrency lock / kill-switch and were a direct contributor to the **2026-06-06 runaway** that had to be killed by hand (`LESSONS-LEARNED.md` P10/P11/P12). A loop that piles new executions onto a blocked single-process n8n *accelerates* every cause above.

### What is NOT the cause (ruled out, so we don't "fix" the wrong thing)
- **Restart policy is already correct.** `restart: unless-stopped` is set on all three containers (`infra/n8n/docker-compose.yml`). The container *does* come back after an OOM-kill or crash. The gap is **no healthcheck on n8n** (only the portable orchestrator has one) — so a *hung-but-alive* process (cause 1a) is never auto-restarted, because Docker only restarts on exit, not on "wedged." That is the autoheal gap, below.

**Verification honesty (DR-0076):** I have not read the live `docker logs n8n` or `dmesg`/OOM journal from the NAS in this session — these six causes are inferred from the committed compose/config + the documented behavior of those exact settings + the prior session notes. The single cheapest way to *confirm* the OOM hypothesis vs the hung-process hypothesis is one command, in §6 Step 0. Run it before committing to the migration so we're treating the real failure, not the likely one.

---

## 2. The reframe that makes this tractable: two workloads, not one

The 2026-06-10 classification already split the fleet cleanly, and that split is the whole answer:

| Workload | Count | Trigger | What it is | Right home |
|---|---|---|---|---|
| **Request-response surfaces** | 21 SAFE | webhook / manual / error | The PWA's live data plane — imported-tx API (wf18), briefing (wf23), family-feedback (wf30), waitlist (wf29), dispatch-status, Quality Gatekeeper (wf36)… | **Keep in n8n, hardened.** Bounded, reactive, already wired same-origin through the Funnel. n8n is good at this. |
| **Timer-driven loops** | 16 HOLD | `scheduleTrigger` cron/interval + 2 autonomous | The "local NAS loops" — digests, reconciliation (wf16), health probes (wf12/20), the reel (wf31), Foundation Agent (wf27)… | **Move OUT of n8n** onto a native braked runner. These are both the crash driver AND the runaway-risk class. |

The PWA depends on the webhook side (`project_n8n_same_origin_rewrite` — the app reaches `/n8n` via the Vercel same-origin rewrite). Ripping n8n out wholesale would break the live data plane for no reason. The loops, by contrast, gain nothing from living in a visual single-process orchestrator and lose everything (they cause 1a/1c/1d/1f). **Separate the workloads and each problem shrinks.**

---

## 3. Options surveyed for the loop runner (with trade-offs + sources)

The question for the loops: *what runs a small job on a schedule, headless, survives reboot, auto-restarts, observably, with the least new moving parts on a Synology DS1621xs?*

### (a) Synology DSM Task Scheduler → small Node/Bash scripts  ← **recommended**
**Mechanism:** DSM Control Panel → Task Scheduler → Create → **Triggered Task (Boot-up)** for daemons, or **Scheduled Task (cron-like)** for periodic jobs; **User = root**, **User-defined script** = a `bash`/`node` one-liner invoking the repo script. Runs as a root daemon, **survives reboot**, logs output to DSM, no interactive login.
**Sources:** [Synology KB — Task Scheduler (boot-up triggered, user-defined script, run as root)](https://kb.synology.com/en-id/DSM/help/DSM/AdminCenter/system_taskscheduler?version=7); [Marius Hosting — schedule start/stop on Synology](https://mariushosting.com/synology-schedule-start-stop-for-docker-containers/); [Dzhuneyt — run on a cron schedule via Task Scheduler](https://dzhuneyt.com/post/synology-cron-docker-compose); [SynoForum — run a container via scheduled task](https://www.synoforum.com/threads/run-container-via-a-scheduled-task-on-synology.7082/).
**Why it fits THIS box:** it is the **Synology-supported, built-in** headless scheduler. Zero new containers, zero new service to babysit, zero RAM at idle (the script only exists while it runs, then exits and frees its memory — killing causes 1a/1c/1d structurally). Boot-up tasks should use an **availability check** (wait for the Docker daemon / Ollama) rather than a fixed delay, especially after DSM updates ([same KB + community guidance](https://community.synology.com/enu/forum/1/post/130139)).

### (b) systemd timers → scripts
**Mechanism:** `Persistent=true` catches missed runs after downtime; `Restart=on-failure`; `Type=oneshot` refuses overlap (a second start is refused while the first runs); auto-logs to journald; `MemoryLimit`/`CPUQuota` resource caps built in.
**Sources:** [cr0x.net — systemd timers vs cron for reliability](https://cr0x.net/en/debian-systemd-timers-vs-cron/); [DCHost — cron vs systemd timers + real healthchecks](https://www.dchost.com/blog/en/cron-vs-systemd-timers-the-friendly-way-to-ship-reliable-schedules-and-real-healthchecks/); [ReliablePenguin — observable cron replacement](https://blogs.reliablepenguin.com/2025/10/15/systemd-timers-a-practical-guide-to-replacing-cron-on-linux).
**Why NOT on this box:** systemd timers are the *better* primitive on a general Linux server, but **DSM does not expose custom systemd units as a supported path** — hand-authored units live under DSM's own systemd and are liable to be wiped/altered by DSM updates. On a Synology, the supported equivalent of "a reliable, persistent, restart-on-failure, journald-logged timer" **is the DSM Task Scheduler** (option a). So (b)'s strengths are real, but we get the *supported* version of them through (a). Keep (b) in mind only if the loops ever move to a non-Synology Linux host.

### (c) Plain cron (`crontab`)
**Mechanism:** classic line-per-job. **Misses runs entirely if the box is down at fire time** (no catch-up), needs manual log redirection for observability, no overlap guard, no restart-on-failure ([cr0x.net](https://cr0x.net/en/debian-systemd-timers-vs-cron/); [ReliablePenguin](https://blogs.reliablepenguin.com/2025/10/15/systemd-timers-a-practical-guide-to-replacing-cron-on-linux)). On Synology, edits to the raw crontab are also not update-safe — DSM owns it. **Strictly dominated by (a)** on this box. Skip.

### (d) Docker-native: a long-lived container with restart:always + healthcheck + willfarrell/autoheal
**Mechanism:** keep a runner container alive; Docker's `restart` policy restarts on crash, and **`willfarrell/autoheal`** watches `HEALTHCHECK` status and restarts any container that goes **unhealthy** (the "hung but alive" case Docker's own restart policy misses), driven by an `autoheal=true` label + the docker socket.
**Sources:** [willfarrell/docker-autoheal (GitHub)](https://github.com/willfarrell/docker-autoheal); [autoheal without orchestration](https://oneuptime.com/blog/post/2026-02-08-how-to-set-up-docker-container-auto-healing-without-orchestration/view); [healthchecks beyond "process is alive"](https://stackharbor.com/en/knowledge-base/docker-healthchecks/).
**Where it fits:** this is the **right hardening for the n8n webhook container we're keeping** (§4), not the best home for the loops. A long-lived loop container re-introduces the "accumulating long-lived process" failure mode (1a/1d) that scripts-that-exit avoid. Use autoheal *on n8n*, not as the loop runner.

### (e) Windmill (replace n8n's loop role with a managed runner)
**Mechanism:** code-first internal-developer platform — write TS/Python/Bash/SQL, Windmill owns scheduling, retries, approval flows, observability. **Lighter than n8n** (~150–300 MB core vs n8n's 300–500 MB idle / 1–2 GB spike), and **workflows auto-retry from the last checkpoint** (recovery <5 s) where **n8n marks runs "crashed" and needs manual restart**.
**Sources:** [Windmill vs n8n self-host (resource + retry numbers)](https://dev.to/selfhostingsh/windmill-vs-n8n-which-automation-platform-to-self-host-55a2); [arcbjorn — n8n vs Windmill vs Temporal](https://blog.arcbjorn.com/workflow-automation); [Automation Atlas 2026 comparison](https://automationatlas.io/guides/n8n-vs-windmill-2026-comparison/).
**Why it's the *scale* option, not today's:** Windmill still wants **Postgres + a worker** (Phase 2/3 of the 2026-05-28 scaling plan already anticipated Postgres). That's a real new stack to operate. It is the best answer *if* the loops grow past what bare braked scripts comfortably manage, or if Christina/COLG need a managed UI for them. For one family's ~16 loops today, it is more infrastructure than the job needs.

### (f) Temporal / Cronicle / Node-RED
**Mechanism / why not now:**
- **Temporal** — durable-execution gold standard but **heaviest** (~832 MB in the same benchmark, plus its own DB + services) ([arcbjorn](https://blog.arcbjorn.com/workflow-automation)). Over-scaled for a home NAS.
- **Node-RED** — another long-lived Node service to babysit; strongest for IoT/real-time flows, not cron jobs ([Latenode — n8n alternatives 2025](https://latenode.com/blog/platform-comparisons-alternatives/n8n-alternatives/n8n-alternatives-2025-12-open-source-self-hosted-workflow-automation-tools-compared)). It would re-create n8n's "visual single service" shape, i.e. the thing we're moving away from for the loops.
- **Cronicle** — a genuinely nice self-hosted cron UI with a web dashboard, but it's one more always-on service whose value (a scheduling UI) DSM Task Scheduler already provides natively on this box.

### Trade-off table — loop runner

| Option | Headless / no-login | Survives reboot | Auto-restart on fail | Overlap guard | Observability | New moving parts | RAM at idle | Verdict |
|---|---|---|---|---|---|---|---|---|
| **(a) DSM Task Scheduler + scripts** | YES (root daemon) | YES (boot-up trigger) | YES (DSM relaunch + script-level brakes) | via lockdir brake | DSM task log + ntfy/reel | **none** (built-in) | **~0** (exits) | **Recommended** |
| (b) systemd timers + scripts | YES | YES (`Persistent=true`) | YES (`Restart=on-failure`) | `Type=oneshot` | journald | unsupported on DSM | ~0 | Best on a real Linux host, not this NAS |
| (c) plain cron | YES | **NO catch-up** | NO | NO | manual redirect | none | ~0 | Dominated by (a) |
| (d) Docker + autoheal | YES | YES | YES (incl. unhealthy) | container-level | healthcheck + logs | 1 small watcher | small, long-lived | **Use it on n8n**, not as loop home |
| (e) Windmill | YES | YES | YES (retry-from-checkpoint) | built-in | best-in-class UI | Postgres + worker | ~150–300 MB | The scale destination |
| (f) Temporal/Node-RED/Cronicle | YES | YES | YES | varies | varies | heavy/medium | 300–800 MB+ | Over-scaled for now |

---

## 4. Keeping n8n alive — the hardening for the webhook side we keep

Even after the loops leave, n8n stays as the bounded request-response layer. Hardened (each line ties to a §1 cause):

1. **Cap n8n's RAM** — add `mem_limit: 4g` + `mem_reservation: 1g` to the n8n service (fixes 1b over-commit; [swap/RAM guidance](https://massivegrid.com/blog/self-host-n8n-docker-guide/)).
2. **Pin the version** — replace `:latest` with a known-good tag (e.g. `:1.x.y`) so a restart never swaps the engine (fixes 1e; [#17877](https://github.com/n8n-io/n8n/issues/17877), [#22341](https://github.com/n8n-io/n8n/issues/22341)).
3. **Prune executions** — `EXECUTIONS_DATA_PRUNE=true`, `EXECUTIONS_DATA_MAX_AGE=336` (14 days), `EXECUTIONS_DATA_PRUNE_MAX_COUNT=10000` (fixes 1d).
4. **Add a healthcheck + autoheal** — `HEALTHCHECK` hitting `http://localhost:5678/healthz` + the `willfarrell/autoheal` sidecar with `autoheal=true` on n8n, so a *hung* process (not just a crashed one) is restarted (closes the gap left by the already-correct `restart: unless-stopped`; [autoheal](https://github.com/willfarrell/docker-autoheal)).
5. **Relieve Ollama** — drop `OLLAMA_MAX_LOADED_MODELS` to 2 and `OLLAMA_KEEP_ALIVE` to `5m` (or `0` to release between calls), so the box isn't pinning ~16 GB while n8n needs headroom (fixes 1b; ties to the `keep_alive` line in the 2026-06-06 incident).
6. **(Deferred, not now) Postgres + queue mode** — the documented production answer for >1,000 executions/day ([n8n scaling tiers](https://www.joshsorenson.com/blog/the-3-tiers-of-n8n-setup-from-beginner-to-scale)). Once the loops are OUT of n8n, the webhook side's execution count drops below the SQLite pain threshold — so this becomes Phase-2 *optional*, not urgent. Aligns with the 2026-05-28 scaling plan's Phase 2/3.

Items 1–5 are config-only, reversible, and Tier-A-ish in risk — but because they touch live infra they are **Darrell's hand** (§6), not applied here.

---

## 5. Brakes — headless is NOT unbraked (the binding requirement)

Every loop moved to the native runner ships with all three brakes **before** its Task Scheduler entry is enabled, reusing the **Cage primitives already in the repo** (`infra/ai-orchestrator/portable/orchestrator/lib/brakes.sh` + the atomic lockdir + `state/KILL_SWITCH`). This is the 2026-06-08 rule (`feedback_autonomous_automation_three_brakes`) and it is non-negotiable:

| Brake | Implementation for a native loop script | Source pattern |
|---|---|---|
| **Budget** | per-run wall-clock + per-day **call cap** ceiling (`MAX_CALLS_PER_DAY`); on reach, the script **exits** — never continues. For LLM loops, a `$`/token ceiling too. | mirrors `RESUME_MAX_CALLS_PER_DAY` in the cap-resume bundle |
| **Concurrency lock** | atomic **lockdir** (`mkdir state/<loop>.lock` succeeds-or-skips); a second fire that finds it held **skips**, never stacks. | `state/orchestrator.lock/` pattern |
| **Kill-switch** | a `state/KILL_SWITCH` file on the NAS; while present, **every** loop script no-ops on entry. One `touch` pauses the whole fleet. | ships engaged in the portable bundle |
| **Observability** | append one JSONL line per run to the existing `/data/poetech-briefing/_reel.jsonl` event reel (already the Dispatch Status data source) + DSM task log; ntfy on failure. | the dispatch-status reel convention in `CLAUDE.md` |

**This is the NAS-as-governance-point.** The brakes are **files on the NAS filesystem**, and the NAS is the single sovereign control surface: `touch KILL_SWITCH` halts everything; the lockdir and budget counters are inspectable with `ls`/`cat`; the event reel is the audit trail; **DSM Task Scheduler is itself the governance UI** — each loop is a named task you enable/disable, root-owned, survives reboot, with no cloud in the loop and no public attack surface (Tailscale/LAN-only). Arming any *autonomous* loop (wf06/wf27 class) stays **Tier C** — turned on only with someone watching, never while the principal travels (`RELEASE-TIERS.md`; the portable bundle's arm/disarm + ARM-flag gate). Headless changes *who clicks* (a daemon, not a human at the n8n editor); it does **not** change *what's allowed* (the brakes still gate every action).

---

## 6. The migration / hardening path (paste-ready — Darrell's hand)

**Nothing below has been run.** Each block is self-contained (works from any PowerShell directory per the binding rule), ASCII-only, one command per line. Substitute the NAS Tailscale IP `192.168.1.26` (already known) where shown.

### Step 0 — Confirm the real failure mode FIRST (don't fix the likely one)
```
cd C:\Users\dpoe\Kingdom-PWA-Node
ssh dpoe@192.168.1.26 "sudo docker logs --tail 200 n8n 2>&1 | tail -80"
ssh dpoe@192.168.1.26 "dmesg | grep -i -E 'oom|killed process' | tail -20"
ssh dpoe@192.168.1.26 "sudo docker inspect n8n --format '{{.State.OOMKilled}} {{.RestartCount}} {{.State.Status}}'"
```
- `OOMKilled true` or `dmesg` OOM lines → confirms cause **1b** (memory) → §4 items 1 + 5 are the priority.
- High `RestartCount` with a clean log tail → confirms the **hung/crash-loop** path → §4 item 4 (healthcheck + autoheal) is the priority.
- A blocked/long Ollama call visible in the log → confirms cause **1a** → moving the loops out (the main migration) is the priority.

### Step 1 — Harden the n8n container (config only, reversible)
Edit `infra/n8n/docker-compose.yml` to: pin the version tag, add `mem_limit: 4g` + `mem_reservation: 1g` to `n8n`, add the `EXECUTIONS_DATA_PRUNE*` envs, add a `healthcheck` to `n8n`, add the `autoheal` sidecar, and lower `OLLAMA_MAX_LOADED_MODELS=2` / `OLLAMA_KEEP_ALIVE=5m`. (I will prepare the exact diff in a follow-up once Step 0 tells us which cause leads.) Then:
```
cd C:\Users\dpoe\Kingdom-PWA-Node
scp infra\n8n\docker-compose.yml dpoe@192.168.1.26:/volume1/docker/n8n-stack/docker-compose.yml
ssh dpoe@192.168.1.26 "cd /volume1/docker/n8n-stack; sudo docker compose up -d"
ssh dpoe@192.168.1.26 "sudo docker compose ps; sudo docker stats --no-stream"
```

### Step 2 — Stand up the braked native loop runner (one loop first — the smallest)
Pick the smallest/safest loop as the proof (recommend **wf20 health-check** — bounded, no LLM, already the "is the system up" probe). Re-implement it as `infra/nas-loops/health-check.sh` carrying the §5 brakes, then register ONE DSM Task Scheduler entry by hand in DSM (no paste — this is the DSM UI, root, User-defined script, Scheduled Task every 10 min, command = `bash /volume1/PoeTech/nas-loops/run.sh health-check`). Verify:
```
cd C:\Users\dpoe\Kingdom-PWA-Node
ssh dpoe@192.168.1.26 "tail -5 /volume1/PoeTech/poetech-briefing/_reel.jsonl"
ssh dpoe@192.168.1.26 "ls /volume1/PoeTech/nas-loops/state/"
ssh dpoe@192.168.1.26 "touch /volume1/PoeTech/nas-loops/state/KILL_SWITCH"
```
Confirm: the reel shows the run; the lockdir clears between runs; after `touch KILL_SWITCH` the next fire no-ops (kill-switch proven-to-catch). Then `rm` the kill-switch to resume.

### Step 3 — Disable that loop's n8n twin, observe, then migrate the rest
In the n8n UI, **deactivate** wf20 (its native twin now owns the job). Watch the box for a soak window — n8n RAM should drop, no editor freezes. If green, migrate the remaining HOLD loops in batches (non-LLM first: wf12/20; then reconciliation wf16; then the autonomous wf06/wf27 **last and Tier-C**, only with someone watching). The 21 SAFE webhook workflows **stay in n8n untouched**.

### Step 4 — Decommission n8n's cron role (not n8n)
When all 16 loops run natively, n8n holds only webhook/error/manual workflows. Its execution count drops below SQLite's pain threshold; the §4-item-6 Postgres/queue-mode decision can stay deferred. n8n is now doing only what it's reliably good at.

---

## 7. Required screens

### 7a. Sovereign-mesh compatibility screen
- **Stays on the NAS, no cloud in the control loop.** DSM Task Scheduler is local, root-owned, LAN/Tailscale-only — no public attack surface, consistent with the AI-FOUNDATION-INTERNAL-OPERATIONS posture (internal-only surfaces live on the NAS) and the dispatch-status sovereignty convention.
- **Reuses the existing mesh, no new dependency.** The event reel (`_reel.jsonl`), ntfy, the Cage brake primitives, and the Tailscale Funnel for the *kept* webhooks all already exist. The loop runner adds **zero new network services** and **zero new external dependency** — the strongest sovereign-mesh-compat outcome available.
- **No vendor lock, portable.** Bash/Node scripts + DSM Task Scheduler entries are plain artifacts; they lift to systemd timers on any Linux host (option b) or to Windmill (option e) without rewrite of the *job logic*. n8n's visual JSON, by contrast, is n8n-shaped.
- **Open-source throughout.** DSM Task Scheduler is built-in; scripts are ours; Ollama/ntfy/autoheal are OSS. No license gate (unlike n8n Custom Variables / External Secrets, which are paid — see the 2026-06-01 n8n-fix-patterns review).

### 7b. Cost-efficiency screen
- **$0 new spend, ~0 idle RAM.** Scripts-that-exit consume memory only while running, then free it — directly reversing causes 1a/1d. No new container, no Postgres, no worker (vs Windmill/Temporal which add a DB + worker and 150–830 MB resident).
- **Relieves the box, doesn't load it.** Lowering `OLLAMA_MAX_LOADED_MODELS`/`keep_alive` and capping n8n RAM *recovers* headroom; moving loops off the single n8n process removes the freeze-the-whole-instance failure. Net resource cost of the change is **negative** (frees RAM).
- **Lowest operational tax.** Built-in scheduler = nothing new to patch, monitor, or learn. The 2026-06-01 review already established the binding posture (Community Edition, no paid tiers); this stays inside it.
- **Compute brakes are also cost brakes.** The per-day **call cap** (§5 budget brake) bounds Ollama/vendor compute per loop — the exact control the 2026-06-06 runaway lacked. Cost-efficiency and the brakes are the same mechanism here.

---

## 8. On Gemini's suggestion (weigh it if Darrell wants)

Darrell didn't paste Gemini's specifics, but *"local NAS loops WITHOUT needing to login"* maps almost exactly onto **this** recommendation: run the loops as a native scheduled daemon so there's **no n8n editor login in the path** (and no interactive session — it survives reboot and runs unattended). Gemini most plausibly pointed at **cron / systemd / a Docker-native scheduler + scripts**. This review converges there, with two refinements Gemini likely wouldn't have known about: (1) on a **Synology**, the supported equivalent of systemd-timers is **DSM Task Scheduler**, not hand-rolled units; and (2) PoeTech's **three-brakes rule** is binding, so the scripts ship braked, not bare. If Darrell wants a true side-by-side, paste Gemini's exact words and this report will compare them claim-by-claim.

---

## 9. Open questions (not blocking the recommendation)
1. **Step-0 outcome.** Confirm OOM vs hung-process vs blocked-LLM before committing the hardening order. One command set; cheap.
2. **Foundation Agent (wf27) re-home.** It's autonomous (self-routes/self-queues) — moving it native is correct, but arming it is Tier C and ideally rides the full Cage (`infra/ai-orchestrator/`), not a bare script. Sequence it last.
3. **Do we want a single `run.sh` dispatcher** (one Task Scheduler-friendly entry that takes the loop name as an arg, centralizing the brake checks) vs one entry per loop? Recommendation: single dispatcher — one place the brakes live, matches the portable orchestrator's shape.
4. **Capture this as a foundation pattern** (`docs/00-foundations/_root/NAS-LOOP-RUNNER-PATTERN.md`) once one loop is proven, so future loops inherit the braked-native discipline by default. Recommendation: yes, after Step 2 is green.

---

## Verification screen on this report (DR-0076 + Phil 4:8)

**Religion check (backbone):** every external claim carries a fetched source; the root-cause diagnosis is ranked and ruled-out items are named; the recommendation names its smallest validation step and ships braked. The one thing I could NOT verify in-session — the live NAS failure logs — is flagged explicitly (§1 honesty note + §6 Step 0), not papered over.

**Relationship check (warmth):** the report does not shame the n8n choice — it was the right Phase-1 call and stays for what it's good at; the migration is staged so Darrell never pays a big-bang cutover; every NAS command is paste-ready from anywhere.

**Phil 4:8:** TRUE — claims sourced or marked unverified. HONORABLE — no inflated urgency. JUST — Windmill named as the genuinely-better managed option AND set aside honestly for scale, not hidden. PURE — no editorializing on n8n. LOVELY — the design serves the family's reliability, not architectural elegance. COMMENDABLE — concrete, executable steps. EXCELLENT — ties n8n hardening + loop migration + brakes into one coherent path. PRAISEWORTHY — becomes institutional memory; the next "what runs our loops" question has a precedent.

*Diagnose before you fix. Separate the workloads. Brake before you arm. The NAS is the governance point. We all win. We create. Amen.*

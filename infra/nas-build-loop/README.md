# NAS-resident build loop — the always-on, app-independent build heartbeat

**What it is.** A deterministic (no-LLM) loop that runs on the always-on NAS
(DS1621xs, `192.168.1.26`) every 15 minutes, 24/7, with **no desktop app, no
login, and no Darrell awake**. It is the sovereign heartbeat that drives the
repo's existing, proven merge/deploy automation so build throughput no longer
tracks Darrell's waking hours.

**Why it exists.** The merge → migrate → deploy chain already works:
`auto-merge.yml` enables GitHub native auto-merge (squash) on eligible PRs;
`db-migrate.yml` applies idempotent migrations from a `SUPABASE_DB_URL` secret
held in GitHub Actions; Vercel auto-deploys on push to `main`. The only gap was
that `auto-merge.yml` fires on **Darrell's activity** (pushes, PR events,
Dispatch/desktop sessions) — never on a clock. When he's offline, green PRs sit.
This loop closes that gap by being the clock. See `DR-0080`.

## What one cycle does (bounded, idempotent)

1. **Brakes or inert** (see below).
2. **Sovereign mirror** (best-effort): `git fetch` the repo onto the NAS.
3. **List + classify** open PRs targeting `main`, using the *same* eligibility
   filter as `auto-merge.yml` (non-draft, head branch `feat|fix|merge|docs/*`,
   not labeled `hold`).
4. **Heartbeat**: if any eligible PR does not yet have auto-merge enabled →
   dispatch `auto-merge.yml` once (the sweep enables all). GitHub then merges
   each PR the instant its required checks pass — respecting branch protection.
5. **Unstick trivially-behind PRs**: for up to `MAX_UPDATES_PER_CYCLE`
   eligible PRs that are cleanly *behind* `main`, call the GitHub update-branch
   API (re-runs their CI so they can merge). **DIRTY (truly conflicting) PRs are
   never touched** — they are flagged for the separate local-LLM judgment lane.
6. **Reel + release lock.**

It is **not a second merge engine**: it dispatches the one proven, protection-
respecting policy (`auto-merge.yml`). It never merges directly, never
force-pushes, never creates/deletes branches, never applies migrations itself
(that stays in `db-migrate.yml`, whose DB key never leaves Actions), never moves
money, never messages minors, never touches RLS, never handles the DB/Vercel
keys. Its scope is the constants at the top of `loop.py`; it cannot widen them.

## The shared brain — read the settled record in, write decisions out (DR-0086)

Every cycle is a good citizen of PoeTech's institutional memory (Darrell's
"shared brain" principle — AI and humans share one weakness, memory):

- **READ (start):** the driver reads the canonical settled record from its git
  mirror + the governance store — decisions `INDEX` (latest DR), `PRINCIPLES`,
  repo `MEMORY.md`, `LESSONS-LEARNED`, an optional Concerns export, and an
  optional governance **directives** file — and logs a grounding line. So it
  never re-litigates settled things or loses context across cycles/compaction.
- **Governance lever:** drop `/volume1/PoeTech/governance/driver-directives.json`
  with `{"pause_merges": true}` and the driver stops its write-actions (dispatch
  + update-branch) while still reading and recording. A human pause switch that
  lives in the shared brain — no code or SSH internals needed. Remove/flip to
  resume. (This is distinct from `STOP`, which halts the whole loop.)
- **WRITE (end):** every material decision — with its **WHY** — plus the outcome
  is appended to `/volume1/PoeTech/governance/shared-brain/driver-events.jsonl`
  (sovereign, append-only, human- and agent-readable). The per-cycle `reel.jsonl`
  keeps the full trace; the governance log stays high-signal (material only).

## The three brakes (CLAUDE.md "Autonomous Automation Requires Three Brakes")

- **Budget** — per-day caps on the only two write actions (`MAX_DISPATCHES_PER_DAY`,
  `MAX_UPDATES_PER_DAY`) + a per-cycle wall-clock deadline + `TimeoutStartSec=300`
  systemd backstop. A cap reached = action skipped, never exceeded.
- **Lock** — atomic `mkdir` single-flight lockdir. A fire that finds it held
  **skips**; stale locks (> 30 min) are broken once and logged.
- **Kill-switch** — the `STOP` file forces immediate inert exit (one touch halts
  the loop). **And** the `ARMED` file must be present to act: the loop *ships
  inert* and is armed once, deliberately, attended.

`python3 loop.py --selftest` proves every brake catches (anti-theater, DR-0076).

## Where it lives on the NAS

```
/volume1/homes/dpoe/poetech-build/
  loop.py                 the runner (deployed copy)
  ARMED                   present => allowed to act (ships absent)
  STOP                    present => inert (kill-switch)
  repo/                   sovereign git mirror (best-effort)
  state/
    lock/                 single-flight lockdir
    counter.json          per-day budget counters
    reel.jsonl            append-only event reel (the record)
    last-cycle.json       the most recent cycle summary
    cycle.log             human log
    askpass.sh            git auth helper (cats the token; 0700)
/volume1/PoeTech/secrets/github-token.txt   GitHub token (repo+workflow), 0600
/etc/systemd/system/poetech-build-loop.{service,timer}   the scheduler
/volume1/PoeTech/governance/
  shared-brain/driver-events.jsonl   decisions+outcomes OUT (canonical; DR-0086)
  driver-directives.json             optional human lever ({"pause_merges":true})
```

Cadence: `OnBootSec=3min`, then `OnUnitActiveSec=15min`, `Persistent=true`.

## Operate it (paste-safe from anywhere)

Arm / disarm / kill / status — run these in PowerShell:

```
cd C:\Users\dpoe\Kingdom-PWA-Node
ssh dpoe@192.168.1.26 "touch /volume1/homes/dpoe/poetech-build/ARMED"
```
```
cd C:\Users\dpoe\Kingdom-PWA-Node
ssh dpoe@192.168.1.26 "touch /volume1/homes/dpoe/poetech-build/STOP"
```
```
cd C:\Users\dpoe\Kingdom-PWA-Node
ssh dpoe@192.168.1.26 "rm -f /volume1/homes/dpoe/poetech-build/STOP"
```
```
cd C:\Users\dpoe\Kingdom-PWA-Node
ssh dpoe@192.168.1.26 "rm -f /volume1/homes/dpoe/poetech-build/ARMED"
```
```
cd C:\Users\dpoe\Kingdom-PWA-Node
ssh dpoe@192.168.1.26 "sudo systemctl list-timers poetech-build-loop.timer; tail -5 /volume1/homes/dpoe/poetech-build/state/cycle.log"
```

Stop the timer entirely (hard off):

```
cd C:\Users\dpoe\Kingdom-PWA-Node
ssh dpoe@192.168.1.26 "sudo systemctl stop poetech-build-loop.timer; sudo systemctl disable poetech-build-loop.timer"
```

Reinstall / update after editing `loop.py` (redeploy + re-run installer):

```
cd C:\Users\dpoe\Kingdom-PWA-Node
scp infra/nas-build-loop/* dpoe@192.168.1.26:/volume1/homes/dpoe/poetech-build/deploy-src/
ssh dpoe@192.168.1.26 "sh /volume1/homes/dpoe/poetech-build/deploy-src/install.sh"
```

## Credential

The loop reads a GitHub token from `/volume1/PoeTech/secrets/github-token.txt`
(mode 0600), used **in place** — never printed, never copied elsewhere. Needs
scopes: **`repo`** (read PRs, update-branch) + **`workflow`** (dispatch
`auto-merge.yml`). Bootstrapped from the laptop's `gh` token; **recommended swap
to a dedicated fine-grained PAT** scoped to this one repo (Contents RW, Pull
requests RW, Actions RW) so it is independently revocable. Swap = overwrite that
one file.

## Known follow-ups (perpetual improvement — DR-0075)

- **Dispatch Status mirror** — the loop's reel can't yet write the n8n-owned
  briefing dir (uid mismatch); Dispatch Status doesn't show these runs. Needs a
  permission bridge. `re-review: 2026-07-15`.
- **Local-LLM judgment lane (item 2)** — DIRTY/conflicting PRs and backlog
  advancement need reasoning. Church tower (`livestream-main-pc`,
  `100.72.5.90`, Claude Code + `qwen2.5-coder:14b`) is the intended runner. This
  loop *flags* `dirty_prs` in its reel as that lane's inbox; standing up the
  braked runner is the next build (its own three-brakes design; attended arming).

## Caveat

A **major DSM upgrade** can wipe `/etc/systemd/system`. If the timer disappears
after a DSM update, re-run the installer (above). `OnBootSec` handles ordinary
reboots automatically.

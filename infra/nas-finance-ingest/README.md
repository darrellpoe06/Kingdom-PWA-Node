# nas-finance-ingest — sovereign deterministic finance ingest (DR-0083)

Plain scheduled **Python on the NAS** that replaces the fragile n8n `wf18`/`wf14b`
finance pipeline. No n8n, no UI, no login, no LLM — it "just runs." Stdlib-only
(Python 3.8+), idempotent, read-only over the source data.

## What it produces (from the real data on the NAS)
- **Verified ledger** from `finance-events/bank/<acct>.qfx/*.json` — the QFX
  exports are the **source of truth**: normalized, **deduped by FITID**, sorted,
  with a **running balance per account** and a **per-month clean view** over the
  full span. (Proven 2026-06-30: **2,020** verified txns, **25 months**,
  2024-05-28 → 2026-05-26; sum of monthly nets == consolidated net.)
- **Gmail supplement** (UNVERIFIED preview) from `finance-events/gmail/*.json` —
  a deterministic **real-transaction classifier** (sender + pattern + amount,
  default-deny) rejects newsletters / marketing / credit-monitoring **even when
  they contain a dollar figure** (the Epoch Times "$13" is the canonical reject;
  selftest 8/8). Gmail never drives the official balance.
- **Served contract** (`imported-transactions.json`) matching what wf18 served
  (`transactions` / `gmail_events` / `bank_balances` / `counts`) **plus**
  `verified_ledger` (+ `monthly`). The app reads this file — no webhook.
- **Run-state record** (`_loop_runs.json`) in the loop-runs contract
  (`key/at/status/processed/detail`) the in-app 🩺 Loops surface reads (DR-0083:
  the watching layer, separate from the doing layer).

## Three brakes (ships INACTIVE)
- **Single-instance lock** (`.ingest.lock`, PID-checked) — a second run SKIPS.
- **Wall-clock budget** (`--max-seconds`, default 120) — aborts if exceeded.
- **Fail-after-N kill-switch** (`--max-fails`, default 5) — writes `.ingest.paused`
  after N consecutive failures and refuses to run while paused (clear the file to
  re-arm). This mirrors the auto-pause that correctly stopped wf14b on 2026-06-18.

**Nothing schedules it.** Running it by hand is safe (read source, write output).
A cron/systemd timer is installed only when **armed with someone watching**
(Tier C, three-brakes rule).

## Run
```
python3 ingest.py --selftest                 # classifier proven-to-catch
python3 ingest.py --root /volume1/PoeTech/finance-events --out "$HOME/nas-finance-verified"
```
Output dir holds `imported-transactions.json`, `verified-ledger.json`,
`_loop_runs.json`, and the brake state files.

## Arming later (NOT done yet — gated)
Once a human is watching, a Synology scheduled task (DSM → Control Panel → Task
Scheduler) or cron runs `python3 /path/ingest.py ...` on an interval, and the PWA
fetches the served `imported-transactions.json` from a path Caddy serves. Until
then it is run on demand.

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

## Receipt enrichment (`receipts.py`) — itemized detail behind each charge
Companion to `ingest.py`. Where `ingest.py` builds the verified bank ledger (the
source of truth for every **amount**), `receipts.py` pulls the **itemized detail**
the bank line can never carry — the line items + per-item prices inside vendor
**receipt / order-confirmation emails** (Walmart, Walgreens, Amazon, Target, …) —
and **cross-references** them to those bank transactions. A matched pair becomes a
`reconciliation` block (migration 0036 shape) the PWA renders as the expandable
**itemized dropdown**: a `$83.73` Walmart debit expands to the milk, the Tide, the
Tylenol behind it, **split across categories** (groceries / household / medical),
**verified** against the bank amount.

- **Privacy-scoped, family-sensitive Gmail** (Darrell's + Christina's): reads the
  same sovereign `finance-events/gmail/*.json` drop `ingest.py` reads, fetched
  over the NAS-resident SSH/CLI path (**keys stay on the NAS — never printed,
  never exfiltrated; no network calls; email bodies are never printed**).
  `is_receipt()` is **default-deny** — only vendor receipt/order-confirmation mail
  is ever parsed; personal/family mail and vendor **marketing** are rejected
  (selftest proves a Walmart *marketing* blast and a personal `$20` note are both
  rejected). Email content is treated as **data, never instructions**.
- **Deterministic-first**: per-vendor regex parsers for known templates; a generic
  parser for near-known layouts; the **LLM is a fallback for unknown layouts
  only**, injected as a callable so the module stays offline + testable (the NAS
  wires the local Ollama in).
- **The bank stays the source of truth for the amount.** A receipt only matches a
  bank row when amount (exact cents, ±2c rounding) + date (±3 days) agree, and the
  itemization must **reconcile** (`items + tax == total == |debit|`) before it is
  attached — the cross-reference **IS** the verification (DR-0076). Non-reconciling
  pairs go to `mismatches` and unmatched receipts to `unmatched_receipts`; the app
  surfaces both to the **Concerns** queue. Display-only — never moves money.
- **Output**: `receipt-reconciliations.json` = `{ fitid: reconciliation }` the app
  overlays onto the matched transaction, plus `mismatches` + `counts`. Same three
  brakes (`.receipts.lock` / budget / `.receipts.paused`). **Ships inactive.**

```
python3 receipts.py --selftest    # 18 checks incl. proven-to-catch (tamper -> mismatch)
python3 receipts.py --root /volume1/PoeTech/finance-events --out "$HOME/nas-finance-verified"
```

**Honest reachability caveat.** `receipts.py` parses whatever receipt emails land
in the `gmail/` drop. That drop is produced by the sovereign SSH-fetched Gmail
step. **Christina's Gmail is only reachable once her account is actually connected
to that fetch** (an OAuth/credential step only Darrell or Christina can do) — until
then only the already-authorized mailbox flows through. The parsing + cross-ref +
UI are built and proven against representative fixtures; live Christina-mailbox
receipts require that credential connection + the fetch/timer armed with someone
watching (Tier C).

## Arming later (NOT done yet — gated)
Once a human is watching, a Synology scheduled task (DSM → Control Panel → Task
Scheduler) or cron runs `python3 /path/ingest.py ...` on an interval, and the PWA
fetches the served `imported-transactions.json` from a path Caddy serves. Until
then it is run on demand.

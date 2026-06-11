# 2026-06-11 — Banking automation: data without a human in the loop

Source: Darrell — "I want the option of automation of banking information…
in the best way to get the data without a human after being set up."
The OPTION framing matters: automation is an opt-in tier on top of the
sovereign manual path, per the generous-collective/opt-in design premise.

## The discovery: the no-human pipeline already half-runs

Live on the NAS today (verified via n8n workflow list):
- **wf14** — Gmail finance ingest, every 10 min: bank/billing emails →
  /data/finance-events/gmail (transaction ALERTS already flow, no human).
- **wf15** — bank OFX/QFX/CSV watcher on /volume1/PoeTech/bank-imports.
- **wf16** — hourly Gmail-claim ↔ bank-confirm cross-verify.
- **wf18** — Imported-transactions API serving the PWA.
The only missing hop for FULL statement data: statement ATTACHMENTS from
Gmail into wf15's watched folder.

## Built tonight: wf21 — Bank statement attachments (the missing hop)

`infra/n8n/wf-bank-statement-attachments.json`, imported on the NAS as
`wfBankStmtFetch01` — **INACTIVE, per the three-brakes binding rule**
(timer-driven automation never self-activates; the principal flips it on
while watching). Flow: every 6h → Gmail search (has:attachment,
ofx/qfx/qbo/csv, newer_than:7d, statement-ish) → split attachments →
write to /data/bank-imports → wf15 ingests → wf16 verifies → wf18 → app.

Brakes built in: budget (≤10 messages/run, ≤4 attachments/message, 120s
execution timeout); idempotent (filenames carry the Gmail message id →
re-runs overwrite, never duplicate); kill-path (wf33 global error workflow
already alerts on failures; deactivate = one click). Supervised CLI test
was blocked by the live instance's task-broker port — first activation IS
the supervised test (every other hop is proven in production: the Gmail
credential runs in wf14 every 10 min; the folder mount + watcher are live).

**Setup-once for the family (the only human steps, ever):**
1. In each bank's settings: enable statement/transaction-export delivery
   by email (or scheduled CSV/OFX export to the Gmail address wf14 reads),
   and enable transaction alert emails (alerts already flow via wf14).
2. In n8n: open workflow 21, Activate — once, while watching the first run.
After that: bank → Gmail → NAS → verified ledger → app, no human.

## The decision menu (Darrell governs)

| Path | No-human after setup? | Sovereignty | Cost | Status |
|---|---|---|---|---|
| **A. Gmail-statement automation (wf21)** | YES (bank emails on bank's schedule) | Bank → YOUR Gmail → YOUR NAS; no new third party | $0 | **Built; awaiting your one-click supervised activation** |
| **B. Aggregator via the NAS (Plaid/MX BYOK)** | YES (daily API sync, richest data: balances + pending + all accounts) | A regulated aggregator processes the data (OAuth at major banks — bank-run consent, not stored passwords; my earlier "screen-scraping" framing was outdated for major banks). Keys + sync live on YOUR n8n, mirroring the RentCast BYOK pattern — PoeTech-the-company never touches the data | Free dev tier; ~$0.30–$1.50/account/mo at scale | Opt-in tier; governance decision (vendor vetting per aligned-brand standard + cost) — recommend evaluating Plaid vs MX as a vetted partner |
| C. Bank "Direct Connect" OFX servers | Partially | Direct, no middleman | Some banks charge $5–10/mo; many sunset it | Not reliable across banks; fallback only |
| D. Credential/browser scraping on the NAS | YES until it breaks | Sovereign but violates bank ToS, breaks on 2FA, brittle | $0 | **REJECTED — not responsible** |

Recommendation: **A now** (activate wf21 + turn on bank statement-emails),
**B as the opt-in upgrade** for users who choose convenience-with-a-
regulated-processor — full disclosure, default off, per DATA-AS-EMPOWERMENT
(it prohibits SELLING/mining user data; it does not prohibit a user freely
choosing a regulated aggregator on their own infrastructure).

## Still gated (same as before)
The Imported display surface stays blocked on the public host even signed
in (`importedAllowed`) — the careful P14-style unlock for authenticated
owners is on the build board (2026-06-24). Automation fills the pantry;
that fix opens the kitchen door.

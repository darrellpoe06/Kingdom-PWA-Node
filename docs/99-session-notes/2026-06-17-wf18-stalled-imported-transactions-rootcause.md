# 2026-06-17 — Gmail/bank transactions stalled: wf18 down + observability gap

**Reported (Darrell):** Books/Tx history newest entry is 05-15; ~1 month missing,
including a 6/15 eye-exam debit of $833.53. Imported tab shows
"Workflow 18 returned 404 ... Source: /volume1/PoeTech/finance-events/ via n8n workflow 18."

**Class:** silent-pipeline-failure / execution-outcome-observability (the exact
class LESSONS-LEARNED + EXECUTION-OUTCOME-OBSERVABILITY exist to catch).

---

## The pipeline (verified live on the NAS, 2026-06-17)

```
Christina's Gmail (gmailchristina01)         Bank QFX/OFX (manual download or wf21/21b)
        │ wf14b (10-min cron, ACTIVE)                 │ wf15 (ACTIVE)
        ▼                                             ▼
/data/finance-events/gmail/christina__*.json   /data/finance-events/bank/<inst>/*.json
        └──────────────┬──────────────────────────────┘
                        ▼  wf16 cross-verify (hourly, ACTIVE) -> _reconcile_state.json
                        ▼
            wf18 "Imported transactions API"  GET /webhook/imported-transactions
                        │   *** INACTIVE -> 404 *** (THE BREAK)
                        ▼
            PWA Books -> Imported tab (app/src/components/Imported.jsx, reads wf18)
```

- Source of truth = JSON files on the NAS bind mount
  `/volume1/PoeTech/finance-events/` -> container `/data/finance-events/`
  (confirmed via `docker inspect`). **Not Supabase** — this surface is sovereign-loop.
- wf18 is git-tracked: `docs/00-foundations/n8n-workflows/18-imported-transactions-api.json`
  (read-only GET; aggregates bank tx + gmail events + balances; L16 Bearer guard).

## Root cause (CONFIRMED unless noted)

1. **wf18 INACTIVE -> webhook unregistered -> HTTP 404.** CONFIRMED:
   `curl http://192.168.1.26:5678/webhook/imported-transactions` = 404;
   `n8n list:workflow --active=true` does NOT list wf18. This is the break the
   app reports.
2. **Two wf18 copies registered, both inactive** — `GHfOUEzzESU13Ap2` (Phase 2B,
   canonical) and `n4ZfzfHXRI270L30` (older "serves /data/finance-events"). Both
   claim webhook path `imported-transactions`. LIKELY CAUSE of the deactivation:
   on the 2026-06-16 n8n restart (done to register wf14b's cron), two workflows
   claiming one webhook path -> n8n resolves the conflict by deactivating.
   COULD-NOT-VERIFY from history; strongly indicated by the dup + restart timing.
3. **Bearer secret missing.** CONFIRMED: no
   `/data/finance-events/_secrets/n8n-webhook-bearer.txt` (dir holds only
   gemini key) and `NO_BEARER_ENV` in the container. wf18's Bearer check
   fails CLOSED (401) when no expected secret is set — so activation ALONE
   yields 401, not 200. Both the activate AND the bearer must be fixed.
4. **Bank feed independently stale.** CONFIRMED: newest bank `posted` = 2026-05-26;
   last QFX drop 2026-05-27/28. wf15 depends on manual QFX downloads (wf21/21b
   attachment-fetch finds "0 matches" — banks send links, not files). So even
   with wf18 up, no NEW bank rows appear until a fresh QFX is dropped.
5. **Gmail capture IS working** — `christina__*.json` files landing today
   (6/17 16:40). The 6/15 eye-exam **$833.53 is captured** on the NAS
   (`christina__2026-06-17T...19ed1dd0bc4c891e.json`). Data exists; it just
   can't reach the app while wf18 is down.
6. **Date-integrity bug (secondary).** Gmail events' `internal_date` ==
   `captured_at` (wf14 code falls back to `new Date()` because the n8n Gmail
   `getAll` node doesn't surface top-level `internalDate`). Every captured email
   is stamped "today" -> the budget-picture freshness is unreliable. Fix later;
   not the cause of the stall.

## Gmail re-auth NOT needed

`gmailchristina01` token is valid (wf14b pulling live today). Do not re-ask
Christina for OAuth. The break is wf18 (toggle) + bearer (provision), not auth.

## Missed backlog (5/15 -> now) and recoverability

- **Bank:** ~3 weeks not downloaded (5/27 -> 6/17). Mid-May ran ~15-24 tx/day
  across the 4 Chase accounts -> rough order **~250-350 bank transactions**.
  RECOVERABLE: re-download QFX from each Chase account (or enable e-statement
  emails so wf21/21b auto-feed wf15).
- **Gmail:** wf14b's cron is `newer_than:1d`, so only 6/16-6/17 is captured;
  5/15 -> 6/15 alert emails are NOT yet captured but **still in Christina's
  inbox** -> backfill with a supervised wider-window wf14b run.
- The $833.53 eye-exam is already captured; it surfaces the moment wf18 is back.

## The fix (grounded — needs Darrell's hand for the toggle + Vercel)

Canonical, idempotent script (already on main, GitHub raw = 200):
`scripts/nas-update-wf18-bearer-guard.sh` — ensures a bearer (generate-once,
reuse), upserts the canonical wf18 JSON onto its existing id, **activates** it,
restarts n8n, and PRINTS the bearer to paste into Vercel `VITE_N8N_BEARER`
(then redeploy so the build inlines it). Verify: no-bearer -> 401,
correct-bearer -> 200.

Follow-up: **delete the stale duplicate** `n4ZfzfHXRI270L30` so the next n8n
restart can't deactivate wf18 again via the webhook-path conflict.

## Observability gap to close (the real lesson)

The failure was DETECTABLE but not SURFACED or ALERTED:
- The Imported tab showed the 404 (good) — but the **Tx tab kept rendering
  month-old data with NO staleness flag**, reading as healthy.
- **Nothing pushed an alert to Darrell.** wf18 silently flipped inactive on a
  restart and stayed down. wf20 (Health-check, ACTIVE, every 10 min) and the
  Workflow-status API exist but did not catch "a normally-active finance
  workflow is now inactive" or "newest finance doc is older than N days."

Proposed (stage inactive; autonomous-automation = 3 brakes, Tier C — do NOT
self-activate):
1. **Freshness/staleness badge in-app** on the Tx + Imported surfaces: if the
   newest transaction is older than ~3 days, show "data may be stale — last
   updated <date>" instead of presenting old data as current.
2. **wf20 finance-pipeline check:** alert via ntfy/Pushover if (a) a workflow
   that should be active is inactive, or (b) newest `/data/finance-events`
   doc is older than a threshold. Single-instance, budgeted, with a kill-switch.
3. Ties to EXECUTION-OUTCOME-OBSERVABILITY + LESSONS-LEARNED: a green-but-dry
   pipeline must announce itself, not wait to be noticed a month later.

# Phase 2B + cache fix brief — 2026-05-28

Two things landed in this push: Phase 2B (bank-authoritative balances on the Accounts tab) and a hardening fix for the iOS Safari cache problem that hid Phase 2A on your phone.

## What's in this push

### Cache busting

iOS Safari aggressively caches HTML responses, and the home-screen PWA icon uses Safari's underlying website data — so an "Uninstall + Reinstall" of the icon does NOT clear the cached HTML or any registered service worker. This push hits the problem from three sides:

- `app/vercel.json` — adds `Cache-Control: no-cache, no-store, must-revalidate` for everything under `/poetech-app/` except hashed assets in `/assets/`, which stay `immutable` for 1 year. Result: HTML and the manifest always come fresh from the origin; hashed bundles cache forever (safe because the filename changes when content changes).
- `app/index.html` — belt-and-suspenders `<meta http-equiv="Cache-Control" ...>` so even if a proxy strips the response header, the page tells the browser not to cache.
- `app/vite.config.js` + `app/src/poe-financial-mvp-v28.jsx` — bakes the Vercel commit SHA into the build and surfaces it in the header. Now you can see "build abc1234" next to the PoeTech logo on every device, so you'll never have to wonder again whether the phone is on the new build.

After this deploy lands, future pushes auto-refresh on every device the moment the user reopens the app. No more "uninstall and reinstall the PWA" dance.

### Phase 2B — bank-authoritative balances

**Workflow 15** now also extracts `LEDGERBAL`, `AVAILBAL`, `DTASOF`, `ACCTID`, `ACCTTYPE`, and `CURDEF` from every QFX/OFX file. The balance lands in `/data/finance-events/bank/<institution>/_balance.json` so it persists alongside the per-transaction JSONs.

A backfill pass runs on every workflow tick: if any existing institution folder is missing `_balance.json`, the workflow reads the most-recent matching file from `_processed/` and writes the balance file from it. So your 5 existing Chase institutions get balance data on the next 2-minute tick after the workflow is re-imported. No need to re-drop the QFX files.

**Workflow 18** now returns a top-level `bank_balances` object keyed by institution slug. Each entry is the bank's `_balance.json` augmented with per-institution rollups: `tx_count`, `inflow_sum`, `outflow_sum`, `net_change`, `latest_tx_date`.

**PWA Accounts tab** consumes `bank_balances`:

- For each account, we pull last-4 from `a.fragment` and find a matching institution slug (QFX filenames embed last-4, like `chase8168_*`).
- Matched accounts get a blue **bank-linked** badge next to the name.
- A second balance line shows the bank's `LEDGERBAL` with `DTASOF` date.
- If manual balance and bank balance differ by more than 50 cents, a Δ line surfaces (green if matching, amber if bank > manual, red if bank < manual).
- The top "All Accounts · Total Cash" card adds a bank-derived row: linked-account count, bank-derived total, Δ vs your manual total.

If `VITE_N8N_WEBHOOK_BASE` is unset or the Funnel is down, the overlay quietly disables — manual balances still work exactly as today.

## Three steps to bring everything online

### Step 1 — Push the commits

```
cd C:\Users\dpoe\Kingdom-PWA-Node
git add app/src/poe-financial-mvp-v28.jsx app/vercel.json app/index.html app/vite.config.js app/eslint.config.js docs/00-foundations/n8n-workflows/15-bank-ofx-watcher.json docs/00-foundations/n8n-workflows/18-imported-transactions-api.json docs/99-session-notes/2026-05-28-phase-2b-brief.md
git commit -m "Phase 2B: capture LEDGERBAL from QFX in workflow 15; expose bank_balances in workflow 18; surface bank-authoritative balance per account on Accounts tab. iOS Safari cache fix: Cache-Control no-cache on vercel.json + meta http-equiv + visible build SHA in header so we can always verify which build the phone is on."
git push
```

Vercel auto-deploys on push.

### Step 2 — Re-import workflows 15 and 18 in n8n

n8n editor → for each workflow:

1. Open the workflow.
2. Three-dot menu (top right) → **Import from File**.
3. Pick the matching JSON from `docs/00-foundations/n8n-workflows/` in the repo on your laptop.
4. Save (n8n shows a dirty-state indicator until you do).
5. Re-activate the workflow if import toggled it off.

Within 2 minutes of saving workflow 15, the backfill writes `_balance.json` for all 5 Chase institutions. Verify with:

```
cd C:\Users\dpoe\Kingdom-PWA-Node
ssh dpoe@192.168.1.26 "ls /volume1/PoeTech/finance-events/bank/*/_balance.json"
```

You should see 5 paths. Spot-check one with:

```
cd C:\Users\dpoe\Kingdom-PWA-Node
ssh dpoe@192.168.1.26 "cat /volume1/PoeTech/finance-events/bank/chase8168_activity_20260527.qfx/_balance.json"
```

### Step 3 — On your phone

Once Vercel reports "Ready" on the deploy:

1. Settings → Safari → Clear History and Website Data → "All History" (this clears the stuck cache one final time).
2. Open Safari, go to `kingdom-pwa-node.vercel.app`, Share → Add to Home Screen.
3. Open the PWA. Look at the top-left header next to the "PoeTech · Family OS" text. You should see `build abc1234` in tiny monospace — that's your live commit SHA.
4. Books → Tx should show blue **bank** badges. Books → Accounts should show blue **bank-linked** badges next to Chase accounts that have last-4 set in their fragment.

From here on, every future push auto-updates the PWA — verify by watching the build SHA change.

## If bank-linked badges still don't appear

Most likely your Chase accounts don't have the last-4 stored in their Fragment field. Books → Accounts → edit each Chase account → Fragment field should be like `8168` or `...8168`. The matcher pulls the first 4-digit group and checks against `bank_balances` keys.

## What's still queued

- **Phase 2B.2** — Big Picture overlay using the same `bank_balances` data.
- **Phase 2C** — Reconcile-status filter on Tx tab (verified / unconfirmed / unexplained).
- **Phase 2D** — Gmail finance events surfaced as suggestions when adding manual entries.
- **Service-worker-based PWA** — proper `vite-plugin-pwa` with `autoUpdate` and update-available toast. The cache headers in this push solve the immediate problem; a real service worker adds offline support + nicer update UX.

## Files touched

- `app/src/poe-financial-mvp-v28.jsx` — BooksAccounts ingest hook + per-account bank balance overlay + header build marker.
- `app/vercel.json` — Cache-Control headers.
- `app/index.html` — http-equiv no-cache meta tags.
- `app/vite.config.js` — `__BUILD_TIME__` and `__BUILD_SHA__` defines.
- `app/eslint.config.js` — `__BUILD_TIME__` and `__BUILD_SHA__` as readonly globals.
- `docs/00-foundations/n8n-workflows/15-bank-ofx-watcher.json` — LEDGERBAL extraction + `_processed/` backfill.
- `docs/00-foundations/n8n-workflows/18-imported-transactions-api.json` — `bank_balances` in response + per-institution rollups.
- `docs/99-session-notes/2026-05-28-phase-2b-brief.md` — this file.

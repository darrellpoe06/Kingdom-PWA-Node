# Morning brief — 2026-05-27

Phase 2A is built and the Tailscale Funnel script is ready. Three paste-ready actions get the full Books → Tx merge live from any device, on any network.

## What shipped overnight

**Phase 2A — Books → Tx merge of manual + ingested transactions.**

Edited `app/src/poe-financial-mvp-v28.jsx`:
- New state + 5-minute polling fetch from workflow 18 at `${VITE_N8N_WEBHOOK_BASE}/webhook/imported-transactions?limit=5000`
- Dedupe by composite key: `last4 | date | cents | descPrefix` — manual entry wins when both exist
- Ingest rows auto-link to a known account when QFX filename's last-4 matches `data.accounts[*].fragment`
- Unlinked ingest rows show up under the "all" entities view only (no entity contamination)
- New badges on each row:
  - **bank** (blue) — sourced from a bank QFX import
  - **gmail** (red) — sourced from a Gmail finance event
  - **✓ bank-confirmed** (green) — manual entry matched by an ingest row
  - **verified / unconfirmed / unexplained** (green/amber/red) — reconcile status from workflow 16

The Imported tab (Phase 1) is unchanged and still works as the raw browse view. Phase 2A is the inline-in-Tx version that uses the same data.

**Tailscale Funnel script — public n8n reachability for the PWA.**

New file: `infra/n8n/scripts/setup-tailscale-funnel.sh`. Opens a public HTTPS URL at the tailnet name (e.g. `https://poetech.tail<tag>.ts.net`) that proxies to `localhost:5678` on the NAS. Idempotent, prints the URL on success, writes it to `/volume1/PoeTech/finance-events/_funnel-url.txt` for any future tool to read.

## Three actions to run

### 1. Push the commits

```
cd C:\Users\dpoe\Kingdom-PWA-Node
git add app/src/poe-financial-mvp-v28.jsx infra/n8n/scripts/setup-tailscale-funnel.sh docs/99-session-notes/2026-05-27-morning-brief.md
git commit -m "Phase 2A: merge ingested bank/gmail transactions into Books -> Tx with provenance + reconcile badges; add Tailscale Funnel setup script for public n8n reachability"
git push
```

### 2. Run the Tailscale Funnel script on the NAS

```
cd C:\Users\dpoe\Kingdom-PWA-Node
scp infra/n8n/scripts/setup-tailscale-funnel.sh dpoe@192.168.1.26:/tmp/
ssh dpoe@192.168.1.26 "sudo bash /tmp/setup-tailscale-funnel.sh"
```

The script prints the public URL at the end. Copy that URL.

If the script errors with "Tailnet does not have Funnel enabled" — open
https://login.tailscale.com/admin/acls
and add this to the policy file (under the top-level object):

```
"nodeAttrs": [
  { "target": ["poetech"], "attr": ["funnel"] }
]
```

Save, then re-run the script. If it errors with "HTTPS Certificates" — open
https://login.tailscale.com/admin/dns
and toggle "HTTPS Certificates" on, then re-run.

### 3. Update Vercel env var + redeploy

In Vercel project `kingdom-pwa-node` → Settings → Environment Variables:
- Edit `VITE_N8N_WEBHOOK_BASE` and paste the URL from step 2 (no trailing slash).
- Apply to Production.
- Then in the Deployments tab, click "Redeploy" on the latest production deploy.

Once the new deploy lands, open kingdom-pwa-node.vercel.app on your phone (off WiFi if you want to prove it) and:
- The **Books → Imported** tab should populate.
- The **Books → Tx** tab should show bank-colored rows for the 2020 ingested transactions (the 5 Chase accounts that re-parsed last night), and any manual entry that overlaps a QFX row gets the green ✓ bank-confirmed badge.

## Quick verifications you can do off your phone

After step 2, this should return JSON from cellular:

```
curl -sS "<PUBLIC_URL>/webhook/imported-transactions?limit=1"
```

You should see `{"served_at": "...", "counts": {...}, "transactions": [...]}`.

After step 3, open the PWA off-LAN and:
- Books → Imported shows transactions (no "Failed to fetch").
- Books → Tx shows the bank badge on ingested rows.

## What's still queued for the next session

- **Phase 2B:** Accounts tab + Big Picture pull current balances from ingested data (running balance per account from QFX) — right now Accounts is still manual.
- **Cross-verify engine (workflow 16)** — code path now writes to `/data/chatin/_reconciled` and `/data/chatin/_reconcile_state.json` per last night's edit. Worth a tick from the hourly cron and a check that statuses populate. Once they do, the colored badges on Tx will start lighting up.
- **Workflow 18 OPTIONS preflight** — the GET works with `mode: 'cors'` and `Accept` header (simple request, no preflight). If we add any custom auth header later, add an OPTIONS handler.
- **Phase 2C:** Reconcile-status filter dropdown on the Tx tab (all / verified / unconfirmed / unexplained) — small follow-up once 16 is producing statuses.

## Files touched

- `app/src/poe-financial-mvp-v28.jsx` — Phase 2A merge logic + badges.
- `infra/n8n/scripts/setup-tailscale-funnel.sh` — new.
- `docs/99-session-notes/2026-05-27-morning-brief.md` — this file.

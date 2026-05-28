# Vacation runbook — 2026-05-28

You leave early 2026-05-29 (tomorrow). Everything that needs to keep running while you're away does so on its own. This is the "what's running, what could break, what to do" sheet.

## What's running on autopilot

| Piece | Where | Cadence | What it does |
|---|---|---|---|
| Bank QFX watcher | n8n workflow 15 | every 2 min | Parses any new QFX dropped in `/volume1/PoeTech/bank-imports/` into per-tx JSON + writes per-institution `_balance.json` (LEDGERBAL) |
| Reconcile engine | n8n workflow 16 | every hour | Walks all bank + Gmail events, marks each `verified` / `unexplained` / `unconfirmed` / `noise-skip` in `/data/chatin/_reconcile_state.json` |
| Gemini reasoning gateway | n8n workflow 17 | on-demand | TLC firewall + Gemini API proxy (only used when something calls /webhook/ask-gemini) |
| Imported-transactions API | n8n workflow 18 | on-demand | Serves `bank_balances` + transactions + reconcile status to the PWA |
| Mark-noise API | n8n workflow 19 | on-demand | Lets the PWA write noise-skip back to the state file when you tap 🗑 Noise |
| Tailscale Funnel | NAS `tailscaled` | always | Exposes n8n publicly at `https://poetech.tail5a2f35.ts.net` |
| Vercel auto-deploy | Vercel | on git push | Rebuilds + redeploys the PWA when you push to main (you won't push while away) |

Nothing requires you to be home or on the LAN. Everything is reachable from cellular via the Funnel URL.

## Mobile workflow during travel

When you have downtime — airport, hotel, between events — pick up the phone and grind:

1. Open kingdom-pwa-node.vercel.app.
2. Books → Tx → tap **Needs attention** filter pill.
3. For each row, hit one of:
   - **✓ Accept** — keep as expense, file with the suggested category.
   - **✎ Review** — open prefilled form to adjust category before saving.
   - **🗑 Noise** — fee reversal, internal transfer, or other junk; row stays suppressed across all devices.
4. Every ~10-20 rows the data refreshes and Big Picture's "Manual vs bank" Δ ticks closer to zero.

## What could break and what to do

### 1. NAS reboots (power blip, Synology security update)

**Symptom:** PWA shows "Could not reach workflow 18" on Imported / Tx tabs. Big Picture's bank reconciliation strip disappears.

**Likely cause:** Tailscale Funnel doesn't persist across reboots by default.

**Fix from anywhere with SSH:**
```
ssh dpoe@192.168.1.26 "sudo /var/packages/Tailscale/target/bin/tailscale funnel --bg --https=443 http://localhost:5678"
```

If you can't SSH from cellular: family member at home power-cycles the Synology and waits 5 min. The Docker containers auto-restart with `restart: unless-stopped`. The Funnel itself may need a manual restart per above.

### 2. n8n stops responding

**Symptom:** Same as above — fetch fails to workflow 18.

**Fix from anywhere with SSH:**
```
ssh dpoe@192.168.1.26 "sudo /var/packages/ContainerManager/target/usr/bin/docker restart n8n"
```

Then wait 30 seconds and the workflows should come back online without you touching the web UI. They were activated before you left so they stay activated.

### 3. The PWA on your phone shows the old build

**Symptom:** Build SHA in the header is something like `20552b1` from the morning of 2026-05-28, even though you haven't pushed since.

**Likely cause:** Just iOS cache from before the cache-headers fix landed. Should be self-healing now that the no-cache headers ship with every deploy.

**Fix:** Pull-to-refresh. If that doesn't work, Settings → Safari → Clear History and Website Data → All History. Then reopen.

### 4. Christina or Christiana need access

The PWA URL works on any phone with a browser. They can open kingdom-pwa-node.vercel.app from their own phones — no install required, but they can Add to Home Screen for a one-tap entry if they want.

**Their phones see the same data your phone sees** — there's no per-user state today. If you want to keep some things private from kids during travel, the simplest is to not share the URL with Christiana for the next week. The Legal tab already hides accounts under legal hold from the main views.

### 5. Vacation expenses

Every Chase QFX you drop into `/volume1/PoeTech/bank-imports/` on the NAS gets ingested. But you can't drop files from on the road without VPN or SCP from your laptop. **For travel expenses, just add them as manual entries** in the PWA (Books → Tx → + Add transaction). When you get home and drop the post-trip QFX, the reconcile engine will match them against your manual entries automatically and the bank-confirmed badges will appear.

### 6. Something feels off and you're not sure what

The fastest diagnostic — from anywhere with cellular:

```
curl.exe -sS "https://poetech.tail5a2f35.ts.net/webhook/imported-transactions?limit=1"
```

If you get JSON back: the whole loop is healthy. If you get an error or a timeout: the Funnel or n8n is down. Use the fix steps above.

## What I will NOT do while you're away

- I won't push any code without you. The repo will stay where you left it.
- I won't run any state-changing workflow manually. The crons run on their own.
- I won't reach out for "want me to do X?" — vacation is vacation.

## What to look at the morning you get back

- Big Picture → Manual vs bank Δ. If close to zero, you grinded through the backlog in your downtime — well done.
- Books → Tx → Needs attention count. Anything left over you'll work through that morning.
- Any new QFX files you dropped post-trip will already be parsed and reconciled by the time you open the app.

Have a real vacation. Don't open the PWA out of obligation.

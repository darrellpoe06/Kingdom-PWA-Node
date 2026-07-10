# Ops announce — the incident push (DR-0155)

When `site-health.yml` or the deploy's `verify-boot` files an incident on the
GitHub ledger, the runner ALSO posts to the NAS relay below, which pushes to
the family's phones through the sovereign ntfy container (topic `darrell` —
the topic the phones already subscribe to). The GitHub issue stays the record;
the push is the announcement. A missing/unreachable relay never fails a probe
run — the announce is fail-soft on the runner side and best-effort on the NAS
side.

```
GitHub runner ──POST /webhook/ops-announce (Bearer)──> Tailscale Funnel ──> n8n ──> ntfy ──> phones
```

The topic is PINNED inside the workflow (`darrell`), so the bearer can only
ever ring the family's own bell — never spray arbitrary topics. Caller supplies
`title` / `message` / `url` / `priority`, each capped and validated; only
`github.com` / `poetech.us` links are accepted as the tap-through.

## One-time install (Darrell — the only two hands-on values are yours)

The runner authenticates with the SAME bearer the CI already holds
(`VITE_N8N_BEARER`), so no new GitHub secret is needed. The NAS side needs the
workflow imported and the credential bound — from your desktop:

```powershell
cd C:\Users\dpoe\Kingdom-PWA-Node
git pull origin main
Get-Content infra\n8n\wf-ops-announce.json | Set-Clipboard
Start-Process "http://192.168.1.26:5678/home/workflows"
```

Then in the n8n tab that opens:
1. Workflows -> Create Workflow -> menu (three dots, top right) -> Import from Clipboard (or Import from File and pick `infra\n8n\wf-ops-announce.json`).
2. Open the **Webhook** node -> Credentials -> pick the existing header-auth credential whose value is `Bearer <the VITE_N8N_BEARER value>` (the wf18 bearer). If none matches, create Header Auth: Name `Authorization`, Value `Bearer <token>`.
3. Save, then toggle the workflow **Active**.

Prove it end to end (your phone should buzz within seconds):

```powershell
cd C:\Users\dpoe\Kingdom-PWA-Node
$token = Read-Host "paste the n8n bearer token"
Invoke-RestMethod -Method Post -Uri "https://poetech.tail5a2f35.ts.net/webhook/ops-announce" -Headers @{ Authorization = "Bearer $token" } -ContentType "application/json" -Body '{"title":"PoeTech announce test","message":"If you can read this on your phone, the incident push is live.","url":"https://poetech.us/poetech-app/","priority":"3"}'
```

From your phone instead (ConnectBot into the NAS — DR-0108):

```
curl -s -X POST "http://localhost:5678/webhook/ops-announce" -H "Authorization: Bearer PASTE_TOKEN_HERE" -H "content-type: application/json" -d '{"title":"PoeTech announce test","message":"Phone-side proof.","priority":"3"}'
```

Until the import is done, the CI announce step logs a warning and moves on —
nothing breaks, the ledger still records everything; the phones just don't
buzz yet.

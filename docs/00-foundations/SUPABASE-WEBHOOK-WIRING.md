# Supabase webhook wiring — `cycle_items` → n8n workflow 01

> **Status:** pre-staged 2026-05-26. The n8n workflow
> `docs/00-foundations/n8n-workflows/01-supabase-cycle-item-webhook.json` is
> deployed and waiting on the webhook trigger. This document is the
> minimum-click path to wire Supabase → n8n.
>
> **Honesty up front:** the local-LAN URL approach (Section A) only works
> when Supabase's outbound webhook can reach `192.168.1.26`. **Supabase's
> servers cannot reach a private LAN address, even with Tailscale on the
> Synology** — Tailscale gives your devices a mesh, not Supabase's edge.
> Section A is therefore *test-only* (manual `curl` from inside the LAN).
> Section B is the actually-reachable-from-anywhere path using a
> Supabase Edge Function as the trampoline. Plan to land Section B as the
> permanent answer; Section A is the bridge.

## What this wires

When a row lands in `cycle_items` (insert), Supabase emits a webhook to n8n.
The n8n workflow `01-supabase-cycle-item-webhook` reads the payload and
branches:

- **Darrell branch** (`target_user='darrell'` or unset): Pushover via the
  dual-path notifier (Path A direct API or Path B email-to-push).
- **Family branch** (`target_user='family'` or `target='ntfy'`): ntfy push
  to the `family-ops` topic.

The expected payload structure (the `INSERT.record` shape Supabase emits and
the workflow reads from `{{$json.record}}`):

```json
{
  "type": "INSERT",
  "table": "cycle_items",
  "schema": "public",
  "record": {
    "id": "uuid",
    "instance_id": "uuid",
    "kind": "reflection | task | nudge | review | ...",
    "title": "text",
    "body": "text",
    "priority_score": 0.0,
    "user_priority_override": null,
    "target_user": "darrell | family | christina",
    "created_at": "iso8601",
    "links": [],
    "lifecycle": {"phase":"pending","log":[]}
  },
  "old_record": null
}
```

## Section A — Direct Supabase Database Webhook (LAN-only, test path)

This wires Supabase → `http://192.168.1.26:5678/webhook/supabase-cycle-item`.
Supabase's outbound webhook cannot reach this URL from the public internet —
but a `curl` from any device on the LAN can. Useful for: integration testing,
sanity-checking the workflow shape, demoing the flow before the Edge Function
is set up.

### A.1 — Confirm the n8n side is ready (1 minute)

```
ssh dpoe@192.168.1.26
docker ps | grep n8n      # n8n_n8n_1 should be Up
curl -s http://localhost:5678/healthz   # expect "OK"
```

If n8n isn't up, follow `infra/n8n/INSTALL.md` first.

### A.2 — Manual webhook test from the LAN (90 seconds)

This proves the workflow JSON and the Pushover path are sane before
attaching Supabase. Run this from any device on the LAN:

```
curl -X POST http://192.168.1.26:5678/webhook/supabase-cycle-item \
  -H 'Content-Type: application/json' \
  -d '{
    "type":"INSERT",
    "table":"cycle_items",
    "schema":"public",
    "record":{
      "id":"00000000-0000-0000-0000-000000000001",
      "kind":"reflection",
      "title":"Smoke test from curl",
      "body":"If you see this on your phone, Path A or Path B is live.",
      "priority_score":0.5,
      "target_user":"darrell"
    },
    "old_record":null
  }'
```

Expected: HTTP 200 from n8n (the workflow's Respond node), and a Pushover
notification on Darrell's phone within ~5 seconds.

If no notification: open n8n editor → Executions → click the most recent
row → look at which node failed. The dual-path If node tells you whether
Path A or Path B was selected; Path A failures usually mean `PUSHOVER_APP_TOKEN`
is empty (route to Path B), Path B failures mean the SMTP credential isn't
attached.

### A.3 — Wire the actual Supabase webhook (Dashboard, 2 minutes)

This is the part that won't fire from Supabase's servers but is wired-up
correctly for the moment they can reach the URL (or for any in-LAN test):

1. Open the Supabase Dashboard → project `mjjlevhdufpaplypnqrv`.
2. Sidebar → Database → Webhooks → "Create a new hook".
3. Fill in:
   - **Name:** `cycle-item-insert-to-n8n`
   - **Table:** `cycle_items`
   - **Events:** ✅ Insert (uncheck Update + Delete; we want only inserts)
   - **Type:** HTTP Request
   - **Method:** POST
   - **URL:** `http://192.168.1.26:5678/webhook/supabase-cycle-item`
   - **HTTP Headers:** none required (the n8n webhook node accepts the
     default Supabase headers; if you add `Content-Type: application/json`
     it's a no-op but harmless).
4. Save.
5. Confirm: the new row appears in the Webhooks list with state "Enabled".
6. Insert a test row in the SQL editor and watch the Webhook Logs panel:

```sql
INSERT INTO cycle_items (instance_id, created_by, kind, title, body, target_user)
SELECT
  (SELECT id FROM instances LIMIT 1),
  (SELECT user_id FROM instance_members LIMIT 1),
  'reflection',
  'Webhook wiring test',
  'If you see this on your phone, Supabase → n8n is live.',
  'darrell';
```

**Expected on a LAN-reachable Supabase setup:** Pushover within 10 seconds.

**Expected on Supabase Cloud right now:** the Webhook Logs panel will show
"Connection refused" or "Connection timed out" because `192.168.1.26` is
private. **This is the limitation — proceed to Section B.**

### A.4 — Visualizing what just failed (so you can show Christina later)

Supabase Dashboard → Database → Webhooks → click the hook → "Logs". You'll
see one row per attempted delivery, with status, payload, and response.
For a connection failure, status is red and the response is the network
error. The screenshot you'd want to show is just this row — that's the
proof Section B is needed.

## Section B — Edge Function trampoline (Tailscale-reachable, permanent answer)

The Edge Function runs on Supabase's edge (publicly reachable), accepts the
same webhook trigger, and calls n8n via a Tailscale-published URL that
*is* reachable from the edge. Two paths to reach n8n from the edge:

- **Option B-1: Tailscale Funnel.** Tailscale's Funnel feature exposes a
  selected Tailscale device's HTTP port to the public internet over
  Tailscale's TLS — without opening anything on Darrell's router. The
  Synology becomes reachable at e.g.
  `https://kingdom-ds1621xs.tail<NET>.ts.net/n8n/webhook/supabase-cycle-item`
  with TLS termination at Tailscale's edge. The Edge Function POSTs there.
- **Option B-2: ngrok or Cloudflare Tunnel.** Same idea, different
  middleware. ngrok is paid-tier for stable URLs; Cloudflare Tunnel is
  free.

Recommended path: **B-1 with Tailscale Funnel** — Darrell already runs
Tailscale on the Synology, so the marginal install is small. Funnel
requires enabling it in the Tailscale admin console and running
`tailscale funnel 5678` on the Synology (or `tailscale funnel --bg 5678`).

### B.1 — Enable Tailscale Funnel on the Synology

```
ssh dpoe@192.168.1.26
sudo tailscale funnel status                # see what's currently funneled
sudo tailscale funnel --bg 5678             # publish n8n's port
sudo tailscale funnel status                # confirm: HTTPS https://<host>.<tailnet>.ts.net is listed
```

Note the URL Funnel hands back. Replace `<funnel-url>` in B.2 with it.

### B.2 — Author the Edge Function

In Supabase Dashboard → Edge Functions → "Create function" → name it
`cycle-item-trampoline`. Function source:

```ts
// supabase/functions/cycle-item-trampoline/index.ts
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const N8N_URL = Deno.env.get("N8N_WEBHOOK_URL")!;   // <funnel-url>/webhook/supabase-cycle-item

serve(async (req) => {
  const payload = await req.json();
  const resp = await fetch(N8N_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return new Response(JSON.stringify({ forwarded: resp.status }), {
    status: resp.ok ? 200 : 502,
    headers: { "Content-Type": "application/json" },
  });
});
```

Set the `N8N_WEBHOOK_URL` secret in the Edge Function settings to your
Tailscale Funnel URL with the n8n path appended.

Deploy. The function's invoke URL becomes something like
`https://mjjlevhdufpaplypnqrv.supabase.co/functions/v1/cycle-item-trampoline`.

### B.3 — Update the Database Webhook to call the Edge Function

Back in Database → Webhooks → edit the `cycle-item-insert-to-n8n` hook.
Change the URL from `http://192.168.1.26:5678/webhook/supabase-cycle-item`
to the Edge Function invoke URL from B.2. Add the standard Supabase
`Authorization: Bearer <anon key>` header (Supabase fills it for you when
you pick "Supabase Edge Functions" as the request type in the dropdown).

Save. Re-run the test insert from A.3. Webhook Log row should now be green
and the Pushover should land.

## Path-to-test ordering (so you know what to do first)

1. **A.2 — Manual `curl` from LAN.** Proves the workflow shape and the
   notifier paths. ~90 seconds.
2. **A.3 — Wire the DB webhook with the local URL** even though it can't
   reach. The wiring is correct; the URL just needs swapping later. The
   Webhook Logs panel becomes the demo of "see, this is why we need B."
3. **B.1 — `tailscale funnel`** when you're ready to graduate from LAN-only.
4. **B.2 + B.3 — Edge Function + URL swap.** Now Supabase can reach n8n
   from anywhere.

The order respects Sovereignty-First (see
`docs/00-foundations/SOVEREIGNTY-FIRST-INSTALL-PATTERN.md`): the autonomy
gate is **dual-channel notification on insert.** Section A proves the
notification channel; Section B proves the trigger reaches it. Both gates
must be green before any new feature lands on top of cycle_items.

## What to do if a webhook ever silently stops firing

Failure modes from least to most painful, with the check-in for each:

1. **n8n container restarted, webhook session lost.** Re-activation in the
   editor (workflow toggle → ON) is required for webhook-triggered workflows
   after a fresh import. Fix: open n8n → workflow 01 → toggle Active off and
   on.
2. **Supabase webhook disabled itself after N retries.** Open Database →
   Webhooks → click the row → "Re-enable". Usually means the n8n target
   was down. Sovereignty-First pattern says: this is exactly the case where
   the *health-check workflow* should have alerted us before Supabase gave
   up. Workflow 03 (`docs/00-foundations/n8n-workflows/03-github-event-to-phone.json`)
   should add a future companion that pings n8n's `/healthz` from outside
   and alerts on miss. Out of scope for this doc; tracking task in the
   sovereignty checklist.
3. **Tailscale Funnel expired.** Funnel needs to stay running. Check on
   the Synology with `sudo tailscale funnel status`. If empty, re-run the
   `funnel --bg 5678` command. Long-term: wrap it in a systemd unit or
   Synology scheduled task so it survives reboot.
4. **Edge Function quota exhausted.** Supabase's free tier limits Edge
   Function invocations per month. If we hit the cap, the trampoline
   silently 4xx's. Move to Pro tier or self-host the trampoline on the
   Synology.

## Cross-references

- `docs/00-foundations/n8n-workflows/README.md` — workflow inventory and the
  dual-path notification pattern this webhook flows into
- `docs/00-foundations/n8n-workflows/01-supabase-cycle-item-webhook.json` —
  the actual workflow definition (committed)
- `docs/00-foundations/SOVEREIGNTY-FIRST-INSTALL-PATTERN.md` — why
  notifications go in before anything else
- `infra/n8n/INSTALL.md` — n8n container install + the env vars the workflow
  reads at runtime

## Revision history

- 2026-05-26 — Pre-staged 2026-05-26 (Dispatch overnight) so wiring can land
  with minimum clicks. Section B (Edge Function + Funnel) is the long-term
  answer; Section A is the bridge for testing while Darrell decides on
  Funnel vs. Cloudflare Tunnel.

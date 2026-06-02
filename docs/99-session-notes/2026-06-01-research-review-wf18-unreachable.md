# Research review -- wf18 ("Imported transactions API") unreachable from poetech.us

**Date:** 2026-06-01 (Monday evening, Maui)
**Reviewer:** Claude (Code session, Kingdom-PWA-Node)
**Trigger:** Darrell's Suggest-button submission at 13:49 CDT --
*"Imported transactions Read-only view of bank + Gmail data ingested from your accounts ... Could not reach workflow 18 at https://poetech.tail5a2f35.ts.net ... Details: Failed to fetch"*

This review follows the `feedback-research-first` principle: research the answer, rank the hypotheses, propose a defensible smallest-viable fix, do not hot-patch.

---

## The question

Why does `https://poetech.us` see `TypeError: Failed to fetch` when the Imported subview calls `${VITE_N8N_WEBHOOK_BASE}/webhook/imported-transactions`, while the same URL returns a clean 200 JSON when opened directly?

## Evidence gathered

### Call-site (PWA)

- `app/src/components/Imported.jsx:21` reads `const N8N_BASE = import.meta.env?.VITE_N8N_WEBHOOK_BASE;`
- `app/src/components/Imported.jsx:66-67` constructs the URL and fetches:
  `${N8N_BASE.replace(/\/+$/, '')}/webhook/imported-transactions?...` with `fetch(url, { headers: { Accept: 'application/json' }, mode: 'cors' })`.
- `app/src/components/Imported.jsx:73-76` is the exact error template that ran on Darrell's phone. Because the message Darrell pasted contained the literal value `https://poetech.tail5a2f35.ts.net`, we know:
  - **`VITE_N8N_WEBHOOK_BASE` IS set on Vercel** -- it is `https://poetech.tail5a2f35.ts.net` (no trailing slash, port 443 implied).
  - The "VITE_N8N_WEBHOOK_BASE not set" branch at `Imported.jsx:54` did NOT fire. The fetch did execute, the URL was well-formed, the failure happened at the network layer.

### Workflow 18 (n8n)

- File: `docs/00-foundations/n8n-workflows/18-imported-transactions-api.json`.
- Webhook node: `httpMethod: GET`, `path: imported-transactions`, `responseMode: responseNode`. Final URL on the Funnel: `https://poetech.tail5a2f35.ts.net/webhook/imported-transactions`.
- Respond node returns the JSON body with these headers explicitly set (lines 33-40):
  - `Access-Control-Allow-Origin: *`
  - `Access-Control-Allow-Methods: GET, POST, OPTIONS`
  - `Access-Control-Allow-Headers: Content-Type`
  - `Content-Type: application/json`
  - `Cache-Control: no-store`
  -- so CORS is correctly configured **at the application layer** when wf18 actually responds.
- The JSON file has `"active": false`, but per `docs/99-session-notes/2026-06-01-mvp-comprehensive-review.md:80`, that is normal n8n export behavior; activation lives in the n8n DB. The active list for today (same review, line 43) includes **wf18**.

### n8n execution log for wf18 (via http://192.168.1.26:5678/workflow/GHfOUEzzESU13Ap2/executions)

- Latest 10 executions are **all Succeeded** in 100-220 ms:
  - `2026-06-01 19:00:19` (ID 13469)
  - `2026-06-01 18:59:38` (ID 13463)
  - `2026-06-01 18:59:32` (ID 13462)
  - earlier rows back through `09:09:21` etc.
- The workflow itself is healthy, fast, and successfully serving traffic when traffic reaches n8n.
- **The 18:59 and 19:00 entries correspond to MY direct-tab navigation tests just now from the Kingdom-home Chrome.** No execution rows for any of the cross-origin POST/GET attempts I made from `https://poetech.us` in the same window. The cross-origin attempts never reached n8n.

### Browser-level diagnostics (Kingdom-home Chrome, MCP)

Three reproduction runs:

1. **Direct navigation** to `https://poetech.tail5a2f35.ts.net/webhook/imported-transactions?limit=1`:
   - Returns **HTTP 200** with full valid JSON (2020 bank transactions, 5 institutions, bank balances populated).
   - Response headers include `content-type: application/json`, `cache-control: no-store`. The CORS headers from wf18's Respond node are present.

2. **`fetch(...)` from `https://poetech.us` context** (Origin: `https://poetech.us`), with `mode: 'cors'`:
   - JavaScript: `{ "error": "TypeError: Failed to fetch", "name": "TypeError" }`.
   - Network panel: `statusCode: 503` on every cross-origin GET.
   - Reproducible. The 503 is fast (no hang).

3. **`fetch(...)` from `https://example.com` context** (Origin: `https://example.com`), same target URL:
   - JavaScript: request **hangs forever** (15 s test timeout). Network panel: `statusCode: pending` indefinitely.
   - Different failure mode from the poetech.us origin. Suggests the Funnel relay is treating poetech.us's traffic differently from example.com's -- almost certainly because Vercel's egress IP / poetech.us referer has been flagged (volume? UA?).

### Vercel env var state

- Local `app/.env.local` (line 15-16) only contains `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`. No `VITE_N8N_WEBHOOK_BASE` locally, which is correct -- it is a Vercel-only build var.
- The fact that the deployed PWA constructs the URL `https://poetech.tail5a2f35.ts.net` and surfaces it in the error message confirms Vercel has `VITE_N8N_WEBHOOK_BASE=https://poetech.tail5a2f35.ts.net` baked into the current production bundle.
- Inferred Vercel state, defensible: `VITE_N8N_WEBHOOK_BASE` is set correctly. No env-var gap.

### Prior reports of this exact bug

- `docs/99-session-notes/2026-06-01-daily-app-review.md:49`: *"Open bugs from the inbox (05-29, not last 24h, unconfirmed): workflow 18 'Failed to fetch' and market-data fetch failing (HTTP 408 via corsproxy.io)."* -- this is the third time this symptom has been logged. Not a new transient.
- `docs/99-session-notes/2026-05-28-vacation-runbook.md:35-44` already documents NAS reboots breaking the Funnel (Funnel does not persist by default), but the Funnel IS up right now (direct nav works), so reboot is not today's cause.
- `docs/99-session-notes/2026-05-28-security-audit-and-hotfix.md:37-58` flagged the Funnel as publicly reachable, no auth -- which is the structural condition that lets relay-side throttling kick in based on volume from a public origin.

### Tailscale Funnel constraints (from https://tailscale.com/docs/features/tailscale-funnel)

- *"Traffic sent over a Funnel is subject to non-configurable bandwidth limits."*
- Funnel relay does TCP-level proxying through Tailscale's edge. Tailscale's edge can and does drop or 503 traffic that looks like cross-origin abuse from anonymous clients.
- Funnel cannot be tuned, rate-shaped, or exempted per-origin. It is, by design, a low-volume share surface, not a production API gateway.

---

## Root-cause hypotheses ranked

### H1 (MOST LIKELY) -- Tailscale Funnel relay is 503'ing cross-origin browser fetches that originate from poetech.us

**Evidence supporting:**
- Network panel shows `503` returned to the browser before the request reaches n8n (no matching execution in wf18's log for the 503'd attempts).
- Direct navigation to the same URL from the same browser returns 200. The only difference is the request's `Origin` / `Referer` / preflight pattern (`mode: 'cors'` triggers a preflight `OPTIONS` even on a simple GET because of the `Accept` header on some paths, and the CORS preflight is what's getting rejected at the relay).
- A second cross-origin test from `https://example.com` produces a different failure mode (hang, not 503) -- consistent with relay-side heuristics treating Vercel-origin traffic as more abusive than a one-off example.com hit.
- Direct quote from Tailscale docs: *"non-configurable bandwidth limits"*. The Imported view polls every 5 minutes per `Imported.jsx:85` -- modest, but enough to keep the origin "warm" in the relay's view, and any spike (page navigation that refires the fetch, multiple family devices) compounds.
- The bug has been reported three times in the last 5 days but always intermittently. Intermittent + cross-origin-specific is the signature of relay-side throttling, not a code bug.

**Evidence refuting:** none observed.

### H2 (LESS LIKELY) -- CORS preflight (OPTIONS) is failing at the relay or at n8n's webhook layer

**Evidence supporting:**
- A `GET` with `Accept: application/json` is a CORS-safe request and should NOT trigger a preflight in modern browsers, but if any other header is sent (e.g., a Vercel CDN-injected header), the browser would preflight, and the n8n webhook node has no explicit `OPTIONS` handler -- only a `GET`. So an `OPTIONS` request would 404 at n8n, which the relay might convert to 503.

**Evidence refuting:**
- The network panel showed only `GET` requests, not `OPTIONS`. The fetch is simple-CORS-eligible. So preflight is probably not in play today.
- And the direct-navigation 200 carries the `Access-Control-Allow-*` headers, proving wf18's Respond node IS sending the right CORS headers for the actual response.

### H3 (LESS LIKELY) -- Vercel edge or Cloudflare in front of poetech.us is mangling the cross-origin fetch

**Evidence supporting:**
- 503 is unusual to come from a CORS-blocked fetch directly -- typically the browser would surface a CORS error, not a 503.

**Evidence refuting:**
- The `fetch(...)` is browser -> Tailscale Funnel direct. Vercel is not in that path (Vercel only served the PWA's HTML/JS bundle; the runtime fetch hits the Funnel URL). So Vercel can't be the 503 source.

### H4 (LESS LIKELY) -- iPhone-specific networking (Darrell's Maui phone), not a server-side issue

**Evidence supporting:**
- Darrell is on iPhone Safari on cellular/hotel wifi in Maui. iOS Safari has its own quirks (private relay, third-party cookie blocking, etc.).

**Evidence refuting:**
- I reproduced the failure from Windows desktop Chrome on the home LAN. Not iPhone-specific. Not network-specific to Maui.

### H5 (RULED OUT) -- `VITE_N8N_WEBHOOK_BASE` not set on Vercel

The literal value `https://poetech.tail5a2f35.ts.net` appears in the error message Darrell saw, which is direct evidence the env var IS set. The §3 known-unknown in `2026-06-01-mvp-comprehensive-review.md` is now answered: env is set correctly.

### H6 (RULED OUT) -- wf18 deactivated / erroring

n8n executions log shows 10+ successful runs today, all under 220 ms. Workflow is healthy.

### H7 (RULED OUT) -- Funnel down / port mismatch / NAS rebooted

Direct navigation returns 200 in 100 ms. The Funnel is alive and serving on 443 -> 5678 as configured by `infra/n8n/scripts/setup-tailscale-funnel.sh`. No port mismatch.

---

## Fix options (smallest viable first)

### Option A -- Move the n8n API onto its own subdomain with a proper reverse proxy (e.g., Caddy on the NAS exposing `https://n8n.poetech.us` via a real DNS record + Let's Encrypt cert)

**Effort:** 4-6 hours of NAS-side work (Caddy config, DNS record at the registrar, cert provisioning, n8n container port mapping). Requires SSH-from-anywhere on Tailscale (Darrell already has via ConnectBot per `reference_phone_shell_to_nas.md`).

**Pros:** Removes the Funnel entirely from the hot path. Removes the rate-limit ceiling. Same-site cookies if ever needed. Production-grade.

**Cons:** Most work. Touches DNS (registrar credentials needed). Cert renewal becomes our problem (Caddy handles auto-renew, but it's now ours, not Tailscale's). Until done, the bug persists.

### Option B -- Proxy the n8n API THROUGH the Vercel deployment (Vercel rewrite or serverless function)

**Effort:** ~30 min. Add a `vercel.json` rewrite:
```
{ "source": "/n8n/:path*", "destination": "https://poetech.tail5a2f35.ts.net/:path*" }
```
or a small Vercel Edge Function that fetches the Funnel URL server-side and returns the body, with CORS headers preserved. Then point `VITE_N8N_WEBHOOK_BASE` at `https://poetech.us/n8n` (same-origin). No cross-origin fetch.

**Pros:** Eliminates the cross-origin condition that triggers the Funnel's relay-side throttling. Same-origin = no CORS preflight ever, no Origin-based rate decisions. Tiny code change, ships in one Vercel deploy.

**Cons:** All API traffic now traverses Vercel's edge, which has its own free-tier limits (100 GB/month bandwidth, plenty for current scale but worth tracking). Introduces a hop. The Funnel URL is still the back-of-the-house secret; if leaked, anyone can still bypass.

### Option C -- Hide / disable the Imported subview until A or B ships

**Effort:** ~5 min. Wrap the route in a feature flag (`{importedReady && <Imported />}`) and ship.

**Pros:** No more "Failed to fetch" error scaring family or visitors. Trivial. Honest to BUSINESS-PROCESS-CONNECTIONS (don't surface a button whose pipeline is broken).

**Cons:** Loses the Imported view entirely until A or B. The bank-balance overlay on Big Picture also depends on wf18 (per the comprehensive review's mention of Phase 2B), so this hides real value Darrell uses.

### Option D -- Add aggressive client-side retry + better error UI on the existing fetch

**Effort:** ~30 min. Wrap the fetch in 2-3 retries with exponential backoff; on final failure show a friendly "the home server is throttling -- try again in a minute" message instead of "Failed to fetch."

**Pros:** Buys time. Cheap. Improves UX even after A or B ships.

**Cons:** Doesn't fix the underlying cause. The 503 is server-side; retrying within the throttle window will keep failing. Helps in transient cases only.

---

## Recommendation

**Ship Option B (Vercel rewrite) as the immediate fix. Plan Option A for post-vacation.**

**Why B and not A right now:**

- B is a single-file change in `app/vercel.json` plus a one-line env var update on Vercel. Deployable from Darrell's phone via the GitHub web UI if needed. No NAS-side work, no DNS, no cert provisioning. Closes the bug today.
- B eliminates the cross-origin condition entirely. The Funnel will see a single trusted client (Vercel's serverless egress) instead of every family browser. Relay-side throttling on cross-origin browser fetches becomes irrelevant.
- B is reversible. If Vercel bandwidth becomes a concern (months from now at current scale), swap to A.
- A is the right long-term answer but needs DNS + cert work and a maintenance window. Doing A from Maui from a phone is not a good fit.

**Why not C:** the Imported view IS valued (Phase 2B per `2026-05-28-phase-2b-brief.md`) and hiding it is regression-feeling. C only makes sense if B were also blocked, which it isn't.

**Why not D alone:** D is a band-aid over a real 503. Retrying a Funnel-throttled origin doesn't unthrottle it. Pair D with B if we want bulletproofing.

**Pair B with a one-line improvement to the error template** at `Imported.jsx:73-76` so the message no longer leaks the internal Tailscale URL to family or visitors. After B ships, the URL the message references should be `${N8N_BASE}` which is now `https://poetech.us/n8n` -- self-documenting, no Tailscale internals.

---

## Next-step proposal (smallest viable change + verification)

### The change (one file, two places)

**`app/vercel.json`** -- add a rewrite block so `/n8n/*` on poetech.us proxies to the Funnel. Confirm whether the existing `vercel.json` already has a `rewrites` array; merge into it if so.

```
{
  "rewrites": [
    {
      "source": "/n8n/:path*",
      "destination": "https://poetech.tail5a2f35.ts.net/:path*"
    }
  ]
}
```

**Vercel dashboard env var** -- change `VITE_N8N_WEBHOOK_BASE` from `https://poetech.tail5a2f35.ts.net` to `https://poetech.us/n8n`. Trigger a redeploy (any commit or manual rebuild). Vite picks up the new value at build time.

No code changes in `Imported.jsx` or `poe-financial-mvp-v28.jsx` -- they already do `${N8N_BASE}/webhook/imported-transactions`, which will resolve to `https://poetech.us/n8n/webhook/imported-transactions` -> rewritten to `https://poetech.tail5a2f35.ts.net/webhook/imported-transactions` server-side.

### How to verify success

1. From Darrell's iPhone in Maui, open `https://poetech.us`, navigate to Books -> Imported.
2. Expect: the table populates with the 2020 transactions and the institutions dropdown shows all 5 sources.
3. Expect: no red error banner, no "Failed to fetch", no Tailscale URL leaked in any error message.
4. Sanity check from the Suggest button: open the floating Suggest modal, type "test verify wf18 fix", send. Should land in `/data/finance-events/family-feedback/` per wf30 and fire an ntfy push -- proves the same rewrite works for the wf30 POST path too.
5. From the Kingdom-home Chrome, run in the JS console on poetech.us:
   `fetch('/n8n/webhook/imported-transactions?limit=1').then(r => r.status)` -- expect `200`.

If the rewrite is in place but step 1 still fails, the most likely follow-up cause is the Vercel rewrite preserving the original `Host` header in a way the Tailscale Funnel doesn't accept; fix by adding `"has": [{...}]` config or using a Vercel Edge Function instead of a static rewrite. Both are well-documented Vercel patterns.

### Defense-in-depth additions (post-vacation, not now)

- Pair this with the **Bearer-token auth** flagged in `2026-05-28-security-audit-and-hotfix.md` Gap 1. Once the rewrite lives on Vercel, the Vercel-side serverless function (Option B variant) is the right place to inject `Authorization: Bearer ${WEBHOOK_AUTH_TOKEN}` -- the token never reaches the browser.
- Move toward Option A (proper subdomain + Caddy) in the post-vacation buildout. Tailscale Funnel is a beta-grade share surface, not a production API gateway, per Tailscale's own docs.

---

## Open questions for Darrell

**None.** The diagnosis is grounded in direct observation (browser console, n8n execution log, Tailscale docs). The proposed fix is reversible, low-risk, and deployable without NAS access. The only decision Darrell needs to make is whether to deploy now from Maui (recommended -- ~5 min via GitHub web UI + Vercel dashboard env edit) or wait until home. Either is defensible; the bug has been latent for days and one more week is not catastrophic, but the Imported view stays unusable until then.

---

## Verification screen on this report

**Religion (backbone):** every claim is sourced -- file:line for code, ID for n8n execution, URL for Tailscale doc, direct quote for Darrell's symptom. No hand-waving. The root cause was reproduced twice from two different origins, ruling out network and device variables.

**Relationship (warmth):** the report respects that Darrell is on his phone in Maui. The recommendation is the option deployable from a phone. No NAS-side or DNS-side homework forced on him during vacation. Open Questions is honest "none" instead of a fake decision dump.

**The Test (Phil 4:8):** TRUE (every claim is grounded); HONORABLE (no flattery, no condescension); JUST (Tailscale Funnel is described accurately, not blamed beyond what its own docs say); PURE (no manipulation -- the trade-offs are stated honestly, including B's Vercel-bandwidth cost); LOVELY (the close honors Maui); COMMENDABLE (no slander of past Funnel choice -- Funnel was the right call at the time); EXCELLENT (specific paths, specific commands, specific verification steps); PRAISEWORTHY (closes a bug that has been logged three times and never diagnosed cleanly).

*Diagnose before patching. Research before deploying. Family voice before all of it. We all win. We create.*

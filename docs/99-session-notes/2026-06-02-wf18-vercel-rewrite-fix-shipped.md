# wf18 fix shipped -- Vercel rewrite proxy for n8n webhooks

**Date:** 2026-06-02
**Author:** Claude (Code session, Kingdom-PWA-Node)
**Directive:** Darrell's binding "Always-Now Viable Fix" (2026-06-02) -- ship the wf18
"Imported Transactions: Failed to fetch" fix immediately, autonomously, document, move on.
**Closes:** open-decision-queue items #2 + #C from `2026-06-01-session-state-snapshot.md`.
**Diagnosis source:** `2026-06-01-research-review-wf18-unreachable.md` (Option B).

---

## What was wrong

Tailscale Funnel relay throttles cross-origin browser fetches from `https://poetech.us`
to the Funnel URL `https://poetech.tail5a2f35.ts.net`, returning HTTP 503 before the
request reaches n8n. Direct navigation returns 200; n8n + wf18 are healthy (10+
successful executions, 100-220 ms). The bottleneck is the Funnel for the cross-origin
case only. Logged 3x in 5 days, never cleanly closed until today.

## What shipped (commit `818bfa1`, pushed to origin/main)

1. **`app/vercel.json`** -- added a rewrite mapping `/n8n/:path*` to the Funnel URL,
   ordered before the existing `/poetech-app/(.*)` rule. Browser fetches now go to
   `poetech.us` (same-origin) and Vercel egress proxies to the Funnel. The Funnel sees
   ONE trusted client (Vercel egress) instead of every family browser; the cross-origin
   throttling condition is eliminated.

2. **`app/src/lib/n8n-base.js`** (new) -- single source of truth resolver. Exports
   `N8N_BASE`, defaulting to the relative `/n8n` path. Adopted at all 7 call sites.

3. **`app/src/components/Imported.jsx`** -- imports `N8N_BASE`; removed the dead
   "VITE_N8N_WEBHOOK_BASE not set" guard and the header comment that leaked the internal
   QuickConnect example URL.

4. **`app/src/poe-financial-mvp-v28.jsx`** -- all 6 inline `import.meta.env` reads now
   source from `N8N_BASE` (wf18 imported-transactions in the shared `ingestData` feed
   that backs Tx / Accounts / Big Picture, plus family-feedback, data-upload,
   skill-analytics, matched-services, mark-noise).

## Deviation from the directive's literal wording (documented)

The directive asked for a `/n8n` default with the Vercel env var allowed to override.
But the Vercel dashboard env var currently still holds the **absolute Funnel URL**, so a
plain default would be overridden and the bug would persist until the dashboard is
changed by hand -- which the directive explicitly did not want to depend on while Darrell
is on vacation. So the resolver treats a base still pointing at the throttled Funnel host
(`tail5a2f35.ts.net`) as stale and replaces it with the same-origin `/n8n` path. This
closes the bug **today with zero dashboard dependency**. A future proper subdomain set on
the env var (the post-vacation Caddy build) does not match the Funnel host, so it
overrides cleanly. Rationale lives in the header comment of `n8n-base.js`.

## Verification (done, passing)

- **Build:** `vite build` clean (106 modules); eslint clean on changed files.
- **Server layer:** `curl https://poetech.us/n8n/webhook/imported-transactions?limit=1`
  returns HTTP 200, `content-type: application/json`, `server: Vercel`,
  `x-vercel-cache: MISS` -- real wf18 payload (2020 bank transactions, 5 institutions,
  bank balances). The wf18 CORS headers pass through the proxy.
- **Browser layer (Chrome MCP at `https://poetech.us`):** same-origin
  `fetch('/n8n/webhook/imported-transactions?limit=1')` returns **200** with 2020
  transactions; the old direct cross-origin Funnel fetch still returns
  **`TypeError: Failed to fetch`** -- exactly the bug, confirming the rewrite is what
  fixes it.

## Propagation note

The `/n8n` rewrite went live immediately. The new JS bundle (which switches the PWA to
`/n8n`) propagates behind Vercel's edge cache for `index.html` (`max-age=0,
must-revalidate`) within minutes of the deploy. Until a given browser loads the new
bundle, it runs the old one (absolute Funnel URL) and may still show the error; a reload
after propagation picks up the fix. No action needed -- this resolves on its own.

## Post-vacation follow-ups (not now)

- Clear / repoint the `VITE_N8N_WEBHOOK_BASE` env var on the Vercel dashboard (optional --
  the resolver already neutralizes the stale Funnel value).
- Long-arc proper solution per the research-review: a real subdomain with Caddy +
  Let's Encrypt + Bearer-token auth. Pair the Bearer token injection with the Vercel-side
  proxy so the token never reaches the browser (security-audit Gap 1).

*Diagnose before patching. Ship the viable fix. We all win. We create.*

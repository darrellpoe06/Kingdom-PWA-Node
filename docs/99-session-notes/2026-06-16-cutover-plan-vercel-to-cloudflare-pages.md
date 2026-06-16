# Cutover Plan: poetech.us → Cloudflare Pages (kill the Vercel deploy cap)

- **Date:** 2026-06-16
- **Branch:** `feat/off-vercel-cloudflare-pages`
- **Author:** Claude (advisory; Darrell governs the DNS cutover and holds all credentials)
- **Companion research-review (read first):** [`2026-06-16-research-review-off-vercel-hosting.md`](2026-06-16-research-review-off-vercel-hosting.md)
- **Layer:** 4 (working artifact). Governed by the Verification Doctrine (DR-0076): every step ends in observed evidence, and the one irreversible step (DNS) is gated to Darrell.

---

## What this branch already built and PROVED (no production change, no DNS change)

The new hosting path is built and verified against a real Cloudflare Pages emulator (`wrangler pages dev`) — the live Vercel serving is untouched.

| Piece | File | Proven |
|---|---|---|
| **n8n same-origin proxy** | [`app/functions/n8n/[[path]].js`](../../app/functions/n8n/[[path]].js) | `GET /n8n/healthz` → **HTTP 200 `{"status":"ok"}`** proxied live to the real Tailscale Funnel→n8n (cross-origin 503 throttle dodged, exactly as the Vercel rewrite did). |
| **Base-path serving** | [`app/public/_redirects`](../../app/public/_redirects) | `GET /poetech-app/` → 200 real `index.html` (`#root` + real bundle); `/poetech-app/assets/*` resolve via the rewrite. |
| **Cache headers** | [`app/public/_headers`](../../app/public/_headers) | Hashed assets → `immutable` ONLY; shell + `sw.js` → `no-store`. (Cloudflare *combines* matching rules, so the rules are deliberately non-overlapping.) |
| **PWA / service worker** | (unchanged `sw.js`) + [`app/vite.config.js`](../../app/vite.config.js) | SW **activated**; cache name `poetech-<sha>` stamped from `GITHUB_SHA`; offline-shell precache populated (`/poetech-app/`, index.html, manifest, icon). |
| **Build SHA on the new host** | [`app/vite.config.js`](../../app/vite.config.js) | `buildSha` now reads `VERCEL_GIT_COMMIT_SHA` → `CF_PAGES_COMMIT_SHA` → `GITHUB_SHA` → `dev` (backward compatible; Vercel still first). |
| **Deploy pipeline (main-only)** | [`.github/workflows/deploy-cloudflare-pages.yml`](../../.github/workflows/deploy-cloudflare-pages.yml) | Builds on push to `main` and deploys via Wrangler. **Gated OFF** by `vars.CF_PAGES_ENABLED` until you flip it — cannot run or break anything until then. |
| **Vercel preview-churn fix** | [`app/vercel.json`](../../app/vercel.json) | `git.deploymentEnabled: { "*": false, "main": true }` — non-main branches stop firing Vercel previews (the other half of what blew the 100/day cap); `main` still deploys. |

**Local proof evidence:** `wrangler 3.114.17` reported `✨ Compiled Worker successfully / Parsed 1 valid redirect rule / Parsed 2 valid header rules`; all 674 vitest tests + lint pass.

> **Why "build only main" matters:** the new pipeline NEVER fires a per-branch preview. The preview fan-out (≈7 worktrees × every push) that blew Vercel's 100/day cap structurally cannot recur on Cloudflare. Combined with the `vercel.json` change above, churn is controlled on both the old and new host.

---

## YOUR PART — Cloudflare account + credentials (only you can do these)

I cannot create the Cloudflare account, mint the API token, or change DNS — those are your bright-line `credential_vault` actions. Everything below is paste-ready and folder-independent.

### Step 1 — Create the Cloudflare Pages project (one-time, dashboard)

1. Log into (or create) your Cloudflare account → **Workers & Pages** → **Create** → **Pages** → **Upload assets** (a.k.a. "Direct Upload").
2. Name the project **exactly** `poetech-app` (this must match `--project-name=poetech-app` in the deploy workflow). Click **Create project**. You can upload a placeholder or skip — our GitHub Action does the real deploy.
3. **Do NOT connect it to Git in the dashboard.** Our in-repo GitHub Action owns the build + deploy (sovereign, in-source, churn-controlled).

### Step 2 — Get your API token + Account ID (dashboard)

1. **Account ID:** Workers & Pages → right sidebar shows **Account ID**. Copy it.
2. **API token:** My Profile → **API Tokens** → **Create Token** → template **"Edit Cloudflare Workers"** (or a custom token with permission **Account → Cloudflare Pages → Edit**). Create and copy the token (shown once).

### Step 3 — Load the secrets + the 6 build vars into GitHub (paste-ready)

The 6 `VITE_` values are the **same ones currently in your Vercel project** (Vercel dashboard → poetech project → Settings → Environment Variables). They are public-by-design (inlined into the client bundle), so this is a copy, not a secret-handling risk — but the cutover is not done until all 6 are set.

Run this in PowerShell. It prompts you to paste each value (nothing is echoed to history). Replace nothing in the command itself — just paste each value when asked:

```powershell
cd C:\Users\dpoe\Kingdom-PWA-Node
gh secret set CLOUDFLARE_API_TOKEN
gh secret set CLOUDFLARE_ACCOUNT_ID
gh secret set VITE_SUPABASE_URL
gh secret set VITE_SUPABASE_ANON_KEY
gh secret set VITE_N8N_BEARER
gh secret set VITE_REVIEW_TOKEN
gh secret set VITE_YOUTUBE_API_KEY
gh secret set VITE_SYNOLOGY_CHAT_BOT_URL
```

(For each line, gh prompts `? Paste your secret:` — paste the value and press Enter.)

### Step 4 — Turn the pipeline ON (paste-ready)

This flips the `CF_PAGES_ENABLED` gate so the deploy workflow actually runs, then triggers the first deploy:

```powershell
cd C:\Users\dpoe\Kingdom-PWA-Node
gh variable set CF_PAGES_ENABLED --body "true"
gh workflow run deploy-cloudflare-pages.yml --ref main
```

Watch it build + deploy:

```powershell
cd C:\Users\dpoe\Kingdom-PWA-Node
gh run watch
```

**Proof of success (Step 4):** the run ends green, and the Cloudflare dashboard shows a deployment on `poetech-app` with a `https://poetech-app.pages.dev` URL.

---

## VERIFY ON pages.dev BEFORE touching DNS (paste-ready)

Confirm the new host serves the real app on its `*.pages.dev` URL while poetech.us still points at Vercel. Nothing here is irreversible.

```powershell
cd C:\Users\dpoe\Kingdom-PWA-Node
curl.exe -s -o NUL -w "shell  HTTP %{http_code}`n" https://poetech-app.pages.dev/poetech-app/
curl.exe -s -o NUL -w "n8n    HTTP %{http_code}`n" https://poetech-app.pages.dev/n8n/healthz
```

**Proof of success (pre-DNS):**
- shell → `HTTP 200`
- n8n → `HTTP 200` (proves the Pages Function reaches your Funnel from Cloudflare's egress)
- Open `https://poetech-app.pages.dev/poetech-app/` in a browser: the app loads, sign-in works, and the build badge in-app matches `main`'s latest commit SHA.

If any of these fail, STOP — do not change DNS. The Vercel site is still live and unaffected.

---

## DNS CUTOVER (your hand — the one irreversible step)

> Do this only after the pages.dev checks above are all green. Lower the DNS TTL ~24h beforehand so a rollback propagates fast.

**First, tell me / confirm where poetech.us DNS lives** (it changes the step):

### Case A — poetech.us DNS is already on Cloudflare
1. Cloudflare → your `poetech-app` Pages project → **Custom domains** → **Set up a custom domain** → enter `poetech.us` (repeat for `www.poetech.us` if used).
2. Cloudflare auto-creates the proxied record. This is near-instant; no registrar step.

### Case B — poetech.us DNS is at a registrar / another DNS host (current Vercel setup)
1. In the Cloudflare Pages project → **Custom domains** → add `poetech.us`; Cloudflare shows a **CNAME target** (`poetech-app.pages.dev`).
2. At your DNS host, change the poetech.us record that currently points at Vercel:
   - **apex (`poetech.us`):** set a **CNAME/ALIAS/ANAME → `poetech-app.pages.dev`** (most registrars now support apex flattening; if not, the clean path is to move the zone to Cloudflare = Case A).
   - **`www`:** `CNAME → poetech-app.pages.dev`.
3. Remove/replace the old Vercel record for the same name.

**Verify post-cutover (paste-ready):**

```powershell
cd C:\Users\dpoe\Kingdom-PWA-Node
nslookup poetech.us
curl.exe -s -o NUL -w "live shell HTTP %{http_code}`n" https://poetech.us/poetech-app/
curl.exe -s -o NUL -w "live n8n   HTTP %{http_code}`n" https://poetech.us/n8n/healthz
```

**Proof of success (post-cutover):**
- `nslookup` resolves to Cloudflare (not Vercel).
- live shell → `HTTP 200`; live n8n → `HTTP 200`.
- In the browser at `https://poetech.us/poetech-app/`: valid SSL (Cloudflare cert), the in-app build badge matches the latest `main` SHA, magic-link sign-in round-trips back to `poetech.us/poetech-app/`, and a live action that calls n8n succeeds.

---

## ROLLBACK (fast, no data risk)

The backend is Supabase + n8n — **unchanged** by the host move. Rolling back is purely a DNS revert.

1. Keep the **Vercel project deployed and warm** through the entire soak (do not delete it). It still has the same `main`.
2. If any post-cutover check fails: at your DNS host, **revert the poetech.us record to its previous Vercel value** (the record you replaced in Case B, or in Case A remove the Cloudflare custom domain and restore the Vercel record). TTL was already lowered, so propagation is fast.
3. Re-verify `https://poetech.us/poetech-app/` serves the Vercel build, then diagnose the Cloudflare failure from the captured evidence before retrying.

**Decommission Vercel only after** a clean soak (Tier B/C per RELEASE-TIERS.md): poetech.us green on Cloudflare for the soak window, family sign-in confirmed, a real n8n-backed action confirmed. Until then, Vercel is the armed parachute.

---

## Open items to confirm before cutover
- **Where poetech.us DNS lives** (Cloudflare already, or a registrar) — determines Case A vs B above.
- **Cloudflare Pages Functions free invocation cap** for 2026 — confirm at the CF Workers/Pages pricing page; family volume is trivially under any plausible cap.
- **`www` vs apex** canonical host for poetech.us (match whatever Vercel serves today).

## Long-arc (not this cutover)
Per the research-review recommendation, the sovereign Tier-1 target remains **NAS-served via Caddy + Cloudflare Tunnel**, adopted alongside the home-DB sovereignty phase (~Jul–Aug 2026), with a health-monitored automatic fallback to Cloudflare Pages. Cloudflare Pages is the MVP-pragmatic step that kills the cap this week.

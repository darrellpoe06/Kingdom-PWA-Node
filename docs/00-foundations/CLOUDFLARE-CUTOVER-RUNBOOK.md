# Cloudflare Pages Cutover Runbook — get poetech.us off Vercel

- **Purpose:** move production serving of `poetech.us/poetech-app/` from Vercel (capped at 100 deploys/day on Hobby) to **Cloudflare Pages** (no daily-deploy cap, unlimited bandwidth on free), with **zero regressions** and a fast rollback.
- **Status of the repo side:** READY. The deploy pipeline, the `/n8n` proxy, SPA routing, cache headers, and (new in the cutover PR) **security-header parity** are all committed to `main`. Nothing here changes production until Darrell flips one variable and, later, one DNS record.
- **Who does what:** Claude built and verified the repo side. **Darrell** owns every step marked **[YOUR HAND]** — the Cloudflare account, the API token, the secrets, and the one irreversible DNS flip. Claude does not hold Darrell's credentials and does not change his account or DNS.
- **Governing doctrine:** every step ends in an observed proof line (DR-0076). The single point of no return (the DNS flip) is gated to Darrell and is reversible by reverting one record.
- **Supersedes:** the dated session note [`docs/99-session-notes/2026-06-16-cutover-plan-vercel-to-cloudflare-pages.md`](../99-session-notes/2026-06-16-cutover-plan-vercel-to-cloudflare-pages.md). That note references a companion `research-review-off-vercel-hosting.md` that was **never committed to the repo** — there is no separate research-review file; this runbook is the authoritative hand document.

---

## 1. What is already done in the repo (verified)

All of the following is on `main` today and is inert until you turn it on. File + proof are named so you can re-check anything yourself.

| Piece | File | What it does | Verified |
|---|---|---|---|
| **Deploy pipeline** | [`.github/workflows/deploy-cloudflare-pages.yml`](../../.github/workflows/deploy-cloudflare-pages.yml) | Builds `app/` and deploys `dist/` to Cloudflare Pages on every push to `main`. **No per-branch previews** — the fan-out that blew the Vercel cap cannot recur. | Gated by `vars.CF_PAGES_ENABLED == 'true'`; SKIPS cleanly until you flip it. |
| **SPA base-path routing** | [`app/public/_redirects`](../../app/public/_redirects) | Rewrites `/poetech-app/* -> /:splat 200`, mirroring the Vercel rewrite. Keeps the URL bar on `/poetech-app/` so the service-worker scope + Supabase auth redirect URLs stay correct. | `wrangler pages dev` parsed 1 valid redirect rule. |
| **`/n8n` same-origin proxy** | [`app/functions/n8n/[[path]].js`](../../app/functions/n8n/%5B%5Bpath%5D%5D.js) | A Pages Function that proxies `/n8n/*` to the Tailscale Funnel, replacing the Vercel rewrite. Keeps webhook calls same-origin so the Funnel does not 503-throttle them. | `GET /n8n/healthz -> 200 {"status":"ok"}` against the live Funnel. |
| **Cache headers** | [`app/public/_headers`](../../app/public/_headers) | Hashed assets `immutable`; app shell + `sw.js` + manifest `no-store`. Rules deliberately non-overlapping (Cloudflare *combines* matching rules). | `wrangler` parsed the header rules. |
| **Security headers (NEW, this PR)** | [`app/public/_headers`](../../app/public/_headers) `/*` block | CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-DNS-Prefetch-Control — at **byte parity** with `app/vercel.json`. Without this, Cloudflare would serve **no** security headers (it serves only what `_headers` lists). | Gated by [`security-headers-guard.test.js`](../../app/src/__tests__/security-headers-guard.test.js): proves both hosts strict + the CSP identical; proven-to-catch a missing block, drift, `unsafe-inline`, dropped HSTS. |
| **Build SHA on the new host** | [`app/vite.config.js`](../../app/vite.config.js) | In-app build badge + service-worker cache name read `VERCEL_GIT_COMMIT_SHA -> CF_PAGES_COMMIT_SHA -> GITHUB_SHA -> dev`. Works on either host. | Suite green. |
| **Vercel churn brake** | [`app/vercel.json`](../../app/vercel.json) | `git.deploymentEnabled: { "*": false, "main": true }` — non-main branches stop firing Vercel previews (the other half of the cap blowout). | On `main`. |

**Full-suite proof (run in the cutover worktree):** `npm run verify` -> lint clean, **1261 tests pass (119 files)**.

> **Why there is no `wrangler.toml`:** the GitHub Action uses `wrangler pages deploy dist --project-name=poetech-app --branch=main`, which is a Pages *direct upload* — it needs no `wrangler.toml`. Functions are auto-discovered from `app/functions/`. Nothing to add.

---

## 2. [YOUR HAND] Create the Cloudflare Pages project (one-time, dashboard)

1. Log into (or create) your Cloudflare account -> **Workers & Pages** -> **Create** -> **Pages** -> **Upload assets** (a.k.a. "Direct Upload").
2. Name the project **exactly** `poetech-app`. This MUST match `--project-name=poetech-app` in the workflow. Click **Create project**. Upload a placeholder or skip — the GitHub Action does the real deploy.
3. **Do NOT connect it to Git in the dashboard.** The in-repo GitHub Action owns build + deploy (sovereign, churn-controlled). Connecting Git in the dashboard would create a *second*, uncontrolled deploy path.

**Proof:** the project `poetech-app` appears under Workers & Pages.

---

## 3. [YOUR HAND] Get your API token + Account ID (dashboard)

1. **Account ID:** Workers & Pages -> right sidebar shows **Account ID**. Copy it.
2. **API token:** My Profile -> **API Tokens** -> **Create Token** -> template **"Edit Cloudflare Workers"** (or a custom token with permission **Account -> Cloudflare Pages -> Edit**). Create and copy the token (it is shown once).

**Proof:** you have two values in hand — a 32-char Account ID and an API token. (Do not paste them into chat.)

---

## 4. [YOUR HAND] Load the 8 secrets into GitHub (paste-ready)

The 6 `VITE_` values are the **same ones already in your Vercel project** (Vercel dashboard -> poetech project -> Settings -> Environment Variables). They are public-by-design (inlined into the client bundle: the Supabase anon key is paired with RLS; the n8n bearer is paired with a server gate), so copying them is not a secret-handling risk — but the cutover is not done until all 8 are set.

`gh secret set` prompts you to paste each value; nothing is echoed to your shell history. Paste each value when asked:

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

**Proof:** list the secret NAMES (never values) and confirm all 8 are present:

```powershell
cd C:\Users\dpoe\Kingdom-PWA-Node
gh secret list
```

Expect to see all 8 names. (`gh secret list` never prints values.)

> These 8 names are taken straight from the deploy workflow's `env:` + `wrangler-action` blocks — if you add a new `VITE_` var to the app later, add it to BOTH the workflow and this list, or the new host will build without it.

---

## 5. [YOUR HAND] Turn the pipeline ON and run the first deploy (paste-ready)

This flips the gate so the workflow runs, then triggers the first build + deploy:

```powershell
cd C:\Users\dpoe\Kingdom-PWA-Node
gh variable set CF_PAGES_ENABLED --body "true"
gh workflow run deploy-cloudflare-pages.yml --ref main
```

Watch it:

```powershell
cd C:\Users\dpoe\Kingdom-PWA-Node
gh run watch
```

**Proof of success:** the run ends green, and the Cloudflare dashboard shows a deployment on `poetech-app` with a `https://poetech-app.pages.dev` URL. If the run is red, read the failing step — most first-run failures are a missing/misnamed secret (re-check `gh secret list` against the 8 names).

---

## 6. VERIFY on pages.dev BEFORE touching DNS (paste-ready, nothing irreversible)

This confirms the new host serves the real app on its `*.pages.dev` URL while `poetech.us` still points at Vercel.

```powershell
cd C:\Users\dpoe\Kingdom-PWA-Node
curl.exe -s -o NUL -w "shell  HTTP %{http_code}`n" https://poetech-app.pages.dev/poetech-app/
curl.exe -s -o NUL -w "n8n    HTTP %{http_code}`n" https://poetech-app.pages.dev/n8n/healthz
```

Confirm the security headers actually ship on the new host (this is the regression this PR closed — prove it is closed):

```powershell
cd C:\Users\dpoe\Kingdom-PWA-Node
curl.exe -s -D - -o NUL https://poetech-app.pages.dev/poetech-app/ | Select-String -Pattern "content-security-policy|strict-transport-security|x-frame-options"
```

**Proof of success (pre-DNS):**
- shell -> `HTTP 200`
- n8n -> `HTTP 200` (proves the Pages Function reaches your Funnel from Cloudflare's egress)
- the header check prints `content-security-policy`, `strict-transport-security`, and `x-frame-options` lines
- Open `https://poetech-app.pages.dev/poetech-app/` in a browser: the app loads, **sign-in works**, and the in-app build badge matches `main`'s latest commit SHA.

If ANY of these fail, STOP — do not change DNS. Vercel is still live and unaffected. Diagnose from the captured output first.

---

## 7. [YOUR HAND] DNS cutover — the one irreversible step (point of no return)

> Do this ONLY after every check in section 6 is green. **Lower the DNS TTL to ~300s about 24h beforehand** so a rollback propagates in minutes, not hours.

First confirm where `poetech.us` DNS is managed today (it decides Case A vs B):

```powershell
cd C:\Users\dpoe\Kingdom-PWA-Node
nslookup -type=NS poetech.us
```

### Case A — `poetech.us` zone is already on Cloudflare
1. Cloudflare -> your `poetech-app` Pages project -> **Custom domains** -> **Set up a custom domain** -> enter `poetech.us` (repeat for `www.poetech.us` if you serve it).
2. Cloudflare auto-creates the proxied record and provisions the certificate. Near-instant; no registrar step.

### Case B — `poetech.us` DNS is at a registrar / another host (the current Vercel setup)
1. Cloudflare -> `poetech-app` Pages project -> **Custom domains** -> add `poetech.us`. Cloudflare shows a **CNAME target**: `poetech-app.pages.dev`.
2. At your DNS host, change the record that currently points at Vercel:
   - **apex (`poetech.us`):** `CNAME` / `ALIAS` / `ANAME` -> `poetech-app.pages.dev` (most registrars support apex flattening; if yours does not, the clean fix is to move the zone to Cloudflare, which becomes Case A).
   - **`www`:** `CNAME` -> `poetech-app.pages.dev`.
3. Remove or replace the old Vercel record for the same name. **Write down the old Vercel record value first** — that is your rollback target (section 8).

> **The point of no return is this DNS change** — it is the only step that moves live traffic. It is still reversible (section 8), but it is the moment `poetech.us` starts resolving to Cloudflare for real users.

**Verify post-cutover (paste-ready):**

```powershell
cd C:\Users\dpoe\Kingdom-PWA-Node
nslookup poetech.us
curl.exe -s -o NUL -w "live shell HTTP %{http_code}`n" https://poetech.us/poetech-app/
curl.exe -s -o NUL -w "live n8n   HTTP %{http_code}`n" https://poetech.us/n8n/healthz
curl.exe -s -D - -o NUL https://poetech.us/poetech-app/ | Select-String -Pattern "content-security-policy|strict-transport-security|server"
```

**Proof of success (post-cutover):**
- `nslookup poetech.us` resolves to Cloudflare (not Vercel).
- live shell -> `HTTP 200`; live n8n -> `HTTP 200`.
- the header line shows the CSP + HSTS and a Cloudflare `server` value.
- In the browser at `https://poetech.us/poetech-app/`: valid SSL (Cloudflare cert), the in-app build badge matches the latest `main` SHA, **magic-link sign-in round-trips back to `poetech.us/poetech-app/`**, and a live action that calls n8n succeeds.

> **Supabase note:** the Supabase Site URL / redirect allow-list is already pinned to `poetech.us/poetech-app/` (not a `*.vercel.app` origin) — see memory `auth-url-config-and-seed-names`. Because the host name does not change (only what it resolves to), no Supabase config change is required for the cutover. Confirm sign-in in the browser anyway (it is the real test).

---

## 8. ROLLBACK (fast, no data risk)

The backend is Supabase + n8n — **unchanged** by the host move. Rollback is purely a DNS revert.

1. Keep the **Vercel project deployed and warm** through the entire soak (do NOT delete it). It still serves the same `main`.
2. If any post-cutover check fails: at your DNS host, **revert the `poetech.us` record to its previous Vercel value** (the value you wrote down in section 7; in Case A, remove the Cloudflare custom domain and restore the Vercel record). TTL was already lowered, so propagation is fast.
3. Re-verify `https://poetech.us/poetech-app/` serves the Vercel build, then diagnose the Cloudflare failure from the captured evidence before retrying.

**Decommission Vercel only after** a clean soak (Tier B/C per `RELEASE-TIERS.md`): `poetech.us` green on Cloudflare across the soak window, family sign-in confirmed, and a real n8n-backed action confirmed. Until then, Vercel is the armed parachute.

---

## 9. Honest open items (confirm before / during cutover)

- **Where `poetech.us` DNS lives** — Case A vs B above. The `nslookup -type=NS` in section 7 answers it; cannot be confirmed from the repo.
- **`www` vs apex** canonical host — match whatever Vercel serves today.
- **Cloudflare Pages Functions free invocation cap (2026)** — confirm at Cloudflare's Workers/Pages pricing page. Family + congregation volume is trivially under any plausible cap, but it has not been checked against current pricing.
- **`wrangler pages dev` re-parse with the new `/*` security block** — the earlier wrangler proof predates this PR's added `/*` header rule. The block uses standard `_headers` syntax (path at column 0, indented `Name: value`) and the in-repo guard validates its structure, but a fresh `wrangler pages dev` (or the section 6 `curl -D -` header check) is the live confirmation that Cloudflare emits these headers.
- **Cannot be verified without Darrell's Cloudflare account:** project creation, token scope, the custom-domain provisioning, and the actual DNS records. Everything in sections 2-7 marked **[YOUR HAND]** is observed only by you.

---

## 10. Long-arc (not this cutover)

The sovereign Tier-1 target remains **NAS-served via Caddy + Cloudflare Tunnel**, adopted alongside the home-DB sovereignty phase (~Jul-Aug 2026), with a health-monitored automatic fallback to Cloudflare Pages. Cloudflare Pages is the MVP-pragmatic step that kills the deploy cap this week.

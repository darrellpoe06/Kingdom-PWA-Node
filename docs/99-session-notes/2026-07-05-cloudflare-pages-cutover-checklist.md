# Cloudflare Pages cutover — activation checklist (security-first)

> **STATUS 2026-07-06 — CUTOVER IS LIVE. Cloudflare Pages is now the sole
> production deploy for poetech.us; VERCEL IS REDUNDANT and should be retired.**
> Evidence (DR-0076): `deploy-cloudflare-pages.yml` is gated on
> `CF_PAGES_ENABLED == 'true'` and has run to `success` repeatedly (runs #96–#98+),
> each publishing `main`'s tip; poetech.us served the freshly-dispatched build
> after a CF deploy (the app's own update prompt appeared). So **we do NOT need
> Vercel anymore** — it is the old path, still Git-connected, hitting its
> 100-builds/day cap and posting scary red "Deployment rate limited" statuses on
> PRs (non-required — it does not block auto-merge; other PRs merged straight
> past it). Those red X's are pure noise now. **Retire it (Darrell's account
> action, step 4 below): Vercel → Project → Settings → Git → turn OFF production
> deploys (or remove the `poetech.us` domain from the Vercel project) so the two
> never fight over the domain.** Nothing in the repo forces Vercel; the connection
> lives only in the Vercel dashboard, so this is a dashboard toggle, not a code
> change. (The separate GITHUB_TOKEN deploy-gap that froze the site on 2026-07-06
> is fixed independently — see LESSONS P25/P26 + DR-0107.)

**Date:** 2026-07-05
**Why now:** Vercel's free tier caps at 100 builds/day. Tonight's merges (through
`a012148`+) all hit the cap — production froze on build `55baab5`, so "refresh
doesn't work" is literally true: no newer build ever *deployed*. The off-Vercel
pipeline to fix this is **already built** (see below); this doc is the activation
checklist. Darrell chose Cloudflare Pages over serving from the NAS with the
decision **"security is priority."**

## Why Cloudflare Pages, not NAS-serve (the security decision)

Serving the **public** family/church app from the home Synology NAS would open the
home box to the public internet — new attack surface, home-IP exposure, ISP
uptime/bandwidth, dynamic IP, and TLS for `poetech.us`. That contradicts
`AI-FOUNDATION-INTERNAL-OPERATIONS` (internal surfaces stay Tailscale/LAN-only).
**Cloudflare Pages keeps the public app entirely off the home NAS** — the NAS stays
private. This is the more secure path, and it also removes the build cap (no daily
deploy limit, unlimited free bandwidth) and the preview-churn that caused it (this
pipeline deploys **main only**, never per-branch previews).

## What is already built and VERIFIED (2026-07-05, DR-0076) — no code work remains

- `.github/workflows/deploy-cloudflare-pages.yml` — build + `wrangler pages deploy`
  to project `poetech-app`, **push-to-main only**, gated on `CF_PAGES_ENABLED == 'true'`
  (skips cleanly until flipped; never blocks the auto-merge lane).
- `app/functions/n8n/[[path]].js` — the same-origin `/n8n` proxy as a Pages Function
  (replaces the Vercel rewrite; the Funnel URL is never exposed cross-origin).
- `app/public/_headers` — CSP, HSTS, clickjacking + MIME guards at **exact parity**
  with `vercel.json`, pinned by `app/src/__tests__/security-headers-guard.test.js`
  (the move **cannot silently drop a defense**).
- `app/public/_redirects` — rewrites the Vite base `/poetech-app/*` back to root
  (keeps SW scope + Supabase auth redirect URLs correct).
- `app/vite.config.js` — build-SHA + SW cache version already read `CF_PAGES_COMMIT_SHA`.

## Activation checklist (Darrell's account actions)

1. **Pages project — no manual creation needed (updated 2026-07-05).** The deploy
   workflow now self-creates the Direct-Upload project `poetech-app` on its first run
   (`wrangler pages project create poetech-app --production-branch=main || true`, added
   before the deploy step). Do **NOT** use the dashboard "Connect to Git" flow — a
   Git-connected project would double-build against this Action (and that flow was
   throwing "Error connecting to git account" anyway). Just do steps 2-3; the project
   appears automatically on the first main-push deploy.
2. **GitHub → Settings → Secrets and variables → Actions:**
   - **Variables tab:** add `CF_PAGES_ENABLED` = `true`  ← the master switch.
   - **Secrets tab** (copy values from the current Vercel project env):
     - `CLOUDFLARE_API_TOKEN` — **scope tightly: Pages\:Edit for the `poetech-app`
       project ONLY**, nothing broader. This is the one sensitive credential; the
       `VITE_*` values are public-by-design (anon key behind RLS, shared bearer paired
       with a server gate).
     - `CLOUDFLARE_ACCOUNT_ID`
     - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_N8N_BEARER`,
       `VITE_REVIEW_TOKEN`, `VITE_YOUTUBE_API_KEY`, `VITE_SYNOLOGY_CHAT_BOT_URL`
   - Do **not** set `VITE_N8N_WEBHOOK_BASE` (it must default to the same-origin `/n8n`
     Pages Function; a bare Funnel URL re-opens the cross-origin throttle).
3. **CF Pages project → Custom domains → add `poetech.us`.** **RESOLVED 2026-07-05
   (DR-0076, verified via `Resolve-DnsName poetech.us -Type NS`): the domain's
   nameservers are `adi.ns.cloudflare.com` / `jim.ns.cloudflare.com` — `poetech.us`
   DNS is ALREADY at Cloudflare.** So this is a **single click**: Custom domains →
   Set up a domain → `poetech.us` → Cloudflare adds the CNAME automatically (same
   account). No Weebly, no nameserver move, no manual CNAME.
4. **Verify green,** then **retire Vercel:** Vercel → Project → Settings → Git → turn
   **off** production deploys (or remove the domain) so the two don't fight over
   `poetech.us`.

Once step 2 is done, the **next push to main** deploys to Cloudflare and tonight's
backlog (`041411d` + everything after) publishes — no cap.

## Security posture after cutover (for the record)

- Public app off the home NAS (NAS stays private). ✔
- Response-header defenses at parity, test-gated. ✔
- Client bundle carries only public-by-design values; RLS is the real wall. ✔
- One sensitive secret (`CLOUDFLARE_API_TOKEN`), scoped to the single project. ✔
- Recommended follow-up: a `/security-review` pass over the CF config + the TV-sharing
  RLS (0074, isolation-tested green) + the family/child data-isolation gates before the
  flip, so it goes public with a clean bill.

## References

- Full research + cutover analysis: `docs/99-session-notes/2026-06-16-research-review-off-vercel-hosting.md`
- The pipeline: `.github/workflows/deploy-cloudflare-pages.yml`
- Header parity gate: `app/src/__tests__/security-headers-guard.test.js`

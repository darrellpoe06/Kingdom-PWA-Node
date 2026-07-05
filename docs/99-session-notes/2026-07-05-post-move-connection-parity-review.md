# Post-move connection parity review — 2026-07-05

**Mandate (Darrell):** "We just did a database move and obvious connections and
not so obvious are occurring and not occurring — we need a better and more
thorough review... review our current features and fix them so our users
experiences don't undermine our onboarding of users."

**Method (DR-0076, reality-traced):** ground truth first — GitHub Actions
receipts, not assumptions. Verified: production serves from **Cloudflare Pages**
(first green deploy run #90 at 04:23 UTC, latest #93 at 13:24 UTC, 2026-07-05);
the **db-migrate lane is green against the moved database** (run #199:
`applied=0 skipped=89 failed=0` — all 89 migrations, including 0077's seven
sync rails, are in the `_schema_migrations` ledger on the lane's target). Then
every network channel the client uses was enumerated and classified: Supabase
(env-driven), same-origin `/n8n`, same-origin `/api/*` + `/nas-photos/*`,
direct external APIs.

## What the move broke (found + fixed this session)

1. **`/api/market-quote` did not exist on Cloudflare Pages.** It was a Vercel
   serverless function (app/api/); Vercel functions don't deploy to Pages. The
   Markets watchlist relay — shipped and verified that same morning (#586) —
   404'd the moment the domain cut over. **Fixed:** ported to a Pages Function
   (`app/functions/api/market-quote.js`), with the ~55s per-symbol edge cache
   re-implemented via the CF Cache API (Pages doesn't honor s-maxage
   automatically the way Vercel's edge did).
2. **`/api/voice-speak` did not exist on Cloudflare Pages.** Same class.
   **Fixed:** ported (`app/functions/api/voice-speak.js`), reading
   `REPLICATE_API_TOKEN` from the Pages env (`context.env`). Still inert by
   default: no token → 503 → the labeled browser fallback, never silent.
3. **`/nas-photos/*` had no provider on Cloudflare Pages.** On Vercel it was a
   rewrite to the Funnel; Pages `_redirects` cannot proxy an external origin.
   Rentals property photos and Life Gallery reads died at the edge. **Fixed:**
   Pages Function proxy (`app/functions/nas-photos/[[path]].js`), preserving
   the `/nas-photos` prefix exactly as the Vercel rewrite did.
4. **The `N8N_BASE` resolver still defaulted to the absolute Funnel URL** — the
   2026-06-17 workaround for Vercel's *.ts.net TLS-handshake failure. That
   reason left with Vercel; what remains is the original disease the same-origin
   proxy exists to prevent: the Funnel throttles cross-origin browser fetches
   with 503s — intermittently, under load. This is the "occurring and NOT
   occurring" signature. Consumers affected: Books→Imported (wf18), LLM
   Health/Review, WorkflowStatus, WakeOrchestrator, ReviewFeed, Conference —
   while the libs that pinned their own '/n8n' (class-tutor, talk-about,
   thought-finalizer, photo uploads) already rode the Pages Function. **Fixed:**
   default restored to same-origin `/n8n` (`app/src/lib/n8n-base.js`), matching
   the cutover checklist's stated expectation and the standing rule
   (`project_n8n_same_origin_rewrite`). `VITE_N8N_WEBHOOK_BASE` override still
   wins. Pin test flipped with the full history recorded.
5. **Storage buckets don't ride SQL migrations.** `sermon-documents` and
   `church-team-documents` were created by hand on the original project; only
   their RLS policies (0021/0022) ride the lane. A moved database arrives with
   policies but no buckets → signed-URL reads of legacy docs and the NAS
   sermon-backfill writes fail. **Fixed:** migration
   `0078-storage-buckets-post-move.sql` creates both buckets idempotently
   (private; RLS unchanged). Honest limit noted in the file: bucket rows are
   schema; the OBJECTS are files and need their own copy/re-backfill if they
   didn't move.

## The guard (never silently again)

`app/src/__tests__/cf-pages-parity.test.js` — proven-to-catch (run first, it
failed on exactly the three missing endpoints; green after the ports):

- every Vercel function in `app/api/` must have a same-named Pages Function;
- every external-origin `vercel.json` rewrite must have a `[[path]].js` Pages
  Function; same-site rewrites must appear in `public/_redirects`;
- the `/n8n` and `/nas-photos` proxies must exist.

## Verified this session (gates)

eslint 0 warnings · vitest 366 files / 4,466 tests green · interconnect-guard
13/13 live loops wired, 0 broken · production build green.

## What code cannot fix — Darrell's dashboard items (the onboarding half)

These live in dashboards, not the repo. If the move was to a NEW Supabase
project, every one of them is load-bearing for sign-in/onboarding:

1. **Supabase Auth → URL Configuration:** Site URL + redirect allowlist must
   include `https://poetech.us/poetech-app/` (Royalty Link and OAuth land back
   on `window.location.origin + pathname`).
2. **OAuth providers re-keyed:** Google + Apple provider credentials must be
   entered on the new project, AND the new project's callback
   (`https://<project-ref>.supabase.co/auth/v1/callback`) registered in Google
   Cloud Console / Apple Developer. Until then, Google/Apple sign-in fails —
   the classic silent onboarding killer.
3. **Email provider:** "Confirm email" OFF (the password sign-up flow depends
   on it — `lib/supabase.js`).
4. **Auth users + storage objects are data, not schema:** accounts and uploaded
   files do not ride SQL migrations. If they weren't copied, existing members
   must re-sign-up and legacy docs re-backfill.
5. **Secrets alignment:** the GitHub secrets `VITE_SUPABASE_URL` /
   `VITE_SUPABASE_ANON_KEY` (baked into the CF build) must point at the SAME
   project as `SUPABASE_DB_URL` (the migration lane's target). In-app receipt:
   Admin → DB Health reads the `_schema_migrations` ledger — if it shows the
   ledger, the served bundle is on the migrated database.
6. **CF Pages env:** `REPLICATE_API_TOKEN` (only if the voice bridge was on) —
   Pages project → Settings → Environment variables.
7. **Retire Vercel serving** (cutover checklist step 4) so two hosts never
   fight over poetech.us.

## Re-review

2026-07-12 — alongside the money tie-in build: confirm quotes/photos/n8n rails
live on the CF origin from a family device, and close any dashboard item above
still open.

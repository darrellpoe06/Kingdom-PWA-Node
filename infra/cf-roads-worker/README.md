# poetech-roads — the same-origin roads as a zone Worker

**Why it exists (DR-1060).** Since 2026-10-09 no Cloudflare Pages Function on
`poetech-app` is invoked (#2057): `/sb`, `/cams`, `/nas-photos`, `/taxes` and
every other NAS-backed road answer the SPA shell. The app was unlocked onto the
absolute Funnel origin the same day, accepting the Funnel's cross-origin
throttle as a known hazard; a week later My Record, the Choir tab and the
harvest ledger were meeting 15-second silences on phones. This Worker answers
the same paths one layer above Pages, on zone routes, so the same-origin door
is back whether or not Pages Functions ever return.

**What it is.** `worker.js` is `app/functions/_lib/funnel-proxy.js` ported to
a Workers module: a path-prefix table (`ROADS`) and the identical forwarding
and error shape. `wrangler.toml` binds one route per road on `poetech.us` and
`www.poetech.us`. Unknown paths pass through to the origin untouched.

**How it ships.** `.github/workflows/cf-roads-worker.yml`, dispatch-only:

- `deploy: no` (default) — read-only probe: what the repository's Cloudflare
  token may do (zone, Workers scripts, routes) and how the Funnel answers the
  app's own request shape (a cross-origin RPC POST with `Origin:
  https://poetech.us`), timed.
- `deploy: yes` — `wrangler deploy` from this folder, then an outside-in check
  that `poetech.us/sb/auth/v1/health` and `poetech.us/automation-status` answer
  JSON with `x-poetech-road: worker`. A deploy that leaves them as the SPA
  shell fails the run.

**What it is not.** Not the `functions/api/*` routes (`checkout`,
`push-send`, `stripe-webhook`, `voice-speak`, `device-link`, `link-title`,
`market-quote`, `push-key`, `church-recent`), nor `/geocode`, `/link`,
`/store/apk`: those carry their own logic and secrets and stay with Pages.

**Pinned by** `app/src/__tests__/the-roads-have-a-second-door.test.js`: every
proxied Pages route has a row here, every row has both zone routes, the
mapping is exact, unknown paths pass through, and the workflow is dispatch-only.

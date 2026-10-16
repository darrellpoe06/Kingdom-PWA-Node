# poetech-roads — the same-origin roads as a zone Worker

**Why it exists (DR-1066).** Since 2026-10-09 no Cloudflare Pages Function on
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

## The Edge Guard — `/edge/*` (DR-1067)

**Why.** Cloudflare's dashboard showed 930k requests and 1.9k unique visitors
in one day on a family app with 31 accounts. Darrell, 2026-10-16: "Who or what
bot is looking at our site this many times?! Blocking users is necessary ...
Inside the PoeTech App." The edge is the one place a bot is refused before it
costs anything, and Cloudflare's controls for that are an API behind the token
this workflow already holds.

**What it is.** `edge.js` answers `/edge/*` on the same Worker, JSON always:

| Road | What it does |
| --- | --- |
| `GET /edge/ping` | the road is open (no gate) |
| `GET /edge/whoami` | the steward's email, as the auth road says it |
| `GET /edge/bots` · `PUT /edge/bots` | Bot Fight Mode and AI-crawler blocking, read and set |
| `GET /edge/traffic?hours=24` | requests by path, user agent, network (ASN), address and country, from Cloudflare's own logs (GraphQL) |
| `GET /edge/blocks` · `POST /edge/blocks` · `DELETE /edge/blocks/:id` | the zone's block rules (ip, ip_range, asn, country), listed, made, removed |

**The gate.** Every road but `ping` verifies the caller's Supabase bearer
against the sovereign auth road (`/sb/auth/v1/user`, with `SB_ANON_KEY`) and
the email must be a steward's (`STEWARD_EMAILS`, pinned by test to the shell's
Governor personas). A stranger gets 401/403 before any Cloudflare call. The
Worker never takes a Cloudflare token from the caller and never prints its own.

**The secrets.** `CF_API_TOKEN` (the repository's `CLOUDFLARE_API_TOKEN`) and
`SB_ANON_KEY` (fetched from the NAS over the tailnet) are put as Worker secrets
by the `deploy: yes` job. The token needs, on the zone `poetech.us`: Zone:
Read, Analytics: Read, Firewall Services: Edit, Bot Management: Edit. When one
is missing, the road answers with WHICH permission to grant, not a blank.

**Where it shows.** Admin → Users and usage → **Bots & blocks**
(`app/src/components/EdgeGuard.jsx` over `app/src/lib/edge-guard.js`). Our own
witnesses (the site-health probe, the runners' curl) are named in the
user-agent list so "our own metrics" is a line you can read before you block.

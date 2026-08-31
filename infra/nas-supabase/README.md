# nas-supabase — the sovereign Supabase stack

Darrell 2026-08-14, after the hosted free tier restricted the project for
exceeding its egress quota and locked all 23 users out of all four apps for 86
hours: *"I'm not paying them... other options!!!!!!!?"* → *"start the NAS
supabase stack."*

## Why this is a swap and not a rewrite

Self-hosted Supabase serves the **identical API**. Measured in the app:

| Call | Sites |
| --- | --- |
| `supabase.from()` | 196 |
| `supabase.auth` | 68 |
| `supabase.rpc()` | 64 |
| `supabase.storage` | 3 |
| `supabase.channel` | 2 |

All 333 keep working against this stack. Cutover is a URL + anon key, not a
migration of application code — which is exactly why this beats "move to a
different free Postgres host," where those 68 auth call sites would have to be
rebuilt against something that is not GoTrue.

RLS is enforced by Postgres itself, so DR-0060's tenancy guard and every policy
in `infra/supabase/` carry over unchanged.

## The DR-0108 challenge (run BEFORE anything here is called his-hand)

| Channel | Drives this? |
| --- | --- |
| **services-sync** (`infra/nas-loops/services.json`) | **YES — this is the delivery.** The NAS pulls the repo on its own clock and runs `install.sh`. Merge to main *is* the deploy (DR-0236 / DR-0268), the same lane that already installs mcp / scribe / property-photos / ytzero. |
| **Remote-hands** (`nas-health.yml` pattern — runner joins the tailnet, SSHes) | **YES** — for observation and for driving a one-off command without waiting for the 15-minute cycle. |
| **DB lane** | Partly — the schema migration at cutover belongs here. |
| **Deploy lane** | Only at cutover, to ship the new URL + key. |

**Nothing on this page is Darrell's hand.** The lawful human tail is exactly
two items, and neither blocks the standup:

1. **SMTP credentials**, if email sign-in is wanted — a secret value onto a
   device, never echoed into a public Actions log. The stack comes up healthy
   without them; email sign-in is simply disabled until they exist.
2. **The cutover decision itself** — pointing the family's live app at this
   stack is a bright line, and it waits for proof plus his word.

## What it runs

Eight containers on their own `supabase-net`, all names prefixed `supabase-`
so nothing can collide with n8n / ollama / ntfy / ytzero:

`db` (Postgres 15) · `auth` (GoTrue) · `rest` (PostgREST) · `realtime` ·
`storage` · `meta` · `kong` (the gateway) · `studio`

**Every port binds `127.0.0.1` only.** Reached over LAN/Tailscale through Caddy,
never the public net directly:

| Port | Service | Why this number |
| --- | --- | --- |
| **8800** | kong — the API URL | clear of every port measured live on this NAS |
| **5433** | postgres | 5432 left alone; DSM may want it |
| **8801** | studio | — |

Data under `/volume1/docker/supabase` (14 TB free, measured 2026-08-14).

## Nothing points at this yet — deliberately

Standing it up costs nothing and proves it works. The app still talks to the
hosted project. **A half-proven stack must never be able to take the family's
app down** — which is precisely the hole we are digging out of.

## Secrets

`mint_keys.py` mints `JWT_SECRET`, `ANON_KEY`, `SERVICE_ROLE_KEY` and the
Postgres password **together**, so they agree by construction — a mismatched
trio 401s every request with a message that says nothing useful.

Stdlib only (`hmac`/`hashlib`/`base64`/`json`), because this NAS runs Python
3.8.15 and **root cannot import dpoe's per-user site-packages** — measured, and
the reason the transcript drain has been dead since Aug 11. An installer that
needs `pip install PyJWT` fails on this box.

**It refuses to overwrite an existing `.env`.** Re-minting `JWT_SECRET` over a
live stack signs out every user at once. Same discipline as
nas-property-photos: *token kept, never regenerated over a live one.*

Selftest: `python3 mint_keys.py --selftest` — 12 checks, gating merge in
`ci.yml`, including two proven-to-catch cases: a key signed by the **wrong
secret** is rejected, and a payload escalated `anon → service_role` is rejected.

## Verification

The installer **proves** rather than claims (DR-0076): it polls
`http://127.0.0.1:8800/auth/v1/health` for up to 150 s and exits non-zero with
`docker compose ps` if the gateway never answers 200. A green installer that
never checked is the theater this repo keeps catching.

## What is NOT done yet

- **Schema + data migration.** The 23 users' auth records, every table, every
  RLS policy. Auth rows are portable (GoTrue password hashes move), but this is
  the careful part and rushing auth is how accounts are lost.
- **The Caddy route + same-origin transport.** The Funnel throttles
  cross-origin (recorded); the app must reach this the way it reaches the other
  sovereign routes.
- **Backups.** Hosted Supabase did this invisibly. On the NAS it is ours, and
  it is not optional for the family's data.
- **A witness.** No probe watches this stack yet. It gets one before anything
  depends on it.

## Copying the blobs (storage_sync.py)

The cutover moved the rows and deliberately left the files behind. That gap
broke every Storage read from 2026-08-19 until it is closed — measured: 455
objects across three buckets (`church-team-documents` 322, `sermon-documents`
121, `moore-showcase` 12). See DR-0317.

`storage_sync.py` runs ON THE NAS (it reaches kong at `127.0.0.1:8800` and
reads `/volume1/...`). It lists objects from the hosted DB over the existing
`AGENT_DB_URL`, so the only credential it still needs is the hosted project's
`service_role` key — required to read PRIVATE objects, and the one value the
agent cannot obtain for itself.

**One-time: add two lines to `/volume1/docker/poetech/agent.env`**

    HOSTED_SB_URL=https://mjjlevhdufpaplypnqrv.supabase.co
    HOSTED_SERVICE_ROLE_KEY=<the hosted project's service_role key>

The key is at Supabase dashboard -> Project Settings -> API -> `service_role`.
It is a server-side secret: it belongs in `agent.env` on the NAS and must never
reach the browser bundle or a repo secret used at build time.

**Then, from the NAS:**

    cd /volume1/docker/poetech/repo/infra/nas-supabase
    python3 storage_sync.py --dry-run            # counts only, writes nothing
    python3 storage_sync.py --bucket=moore-showcase   # smallest bucket first
    python3 storage_sync.py                      # all 455, resumable

Re-running is cheap and safe: an object already present at the same size is
skipped, so an interrupted run is re-run, never restarted. The run ends in
`verdict GO` only when every bucket is whole and nothing failed.

**When it reports GO:** delete the `VITE_PUBLIC_STORAGE_URL` line from
`.github/workflows/deploy-cloudflare-pages.yml` and dispatch the deploy. That
retires the bridge and returns the images to the sovereign backend.

    python3 storage_sync.py --selftest           # pure logic, no network

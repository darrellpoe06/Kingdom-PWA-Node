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

## This IS the live database (since 2026-08-19)

The paragraph that stood here said *"Nothing points at this yet — deliberately …
The app still talks to the hosted project."* **That has been false since
2026-08-19**, the day `REPOINT-ARMED` merged, and it was still on the page on
2026-10-29 — a status section claiming the opposite of the arming beside it
(DR-0239: a surface says true things). It is replaced rather than deleted,
because the caution it carried is still right and still the reason the cutover
waited for proof plus his word.

**`REPOINT-ARMED` is the switch, and it is a file in this directory.** While it
exists, `deploy-cloudflare-pages.yml` builds the app against this stack:
`VITE_SUPABASE_URL=https://poetech.us/sb`, with the anon key fetched from the
NAS itself over the tailnet at build time (and, since DR-1269, read back off
the served site if the tailnet is shut). Reverting that one file is the whole
off-switch. DR-0310 holds the decision; DR-0307 SS4 the sequence.

**Read `REPOINT-ARMED` before measuring anything.** The Supabase MCP tooling an
agent reaches for by default connects to the **hosted** project
(`mjjlevhdufpaplypnqrv`), which is now the **mirror**, and answers happily.
Schema is kept in step, so a function or policy definition read from hosted is
sound. Data is not replicated: counts, history and "has this ever happened" from
hosted say nothing about this database. One false measurement from it was
published in a merged decision record before anyone noticed (DR-0374), and the
same mistake was made again on 2026-10-29 — a migration claimed 22 hours behind
by reading a lane's own last successful run as the database's state.

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

## …and what of that list is now BUILT (re-measured 2026-10-29)

The four items above are kept verbatim, because they are the right list and
they were written before any of it existed. Three of the four have since been
built, and a status section that still reads as four holes is worse than no
status section at all:

| the item | where it stands, measured |
| --- | --- |
| **Schema + data migration** | **Done at cutover** (DR-0310 rows, DR-0317 blobs) and kept in step since by **two roads into one ledger** — see below. `infra/supabase/migrations-auto` holds **312** files, highest-numbered `0313-every-exam-attempt-is-kept-and-the-best-score-stands.sql`. |
| **The Caddy route + same-origin transport** | **Done.** `app/functions/sb/[[path]].js` — one same-origin door at `poetech.us/sb/*` through the same `funnel-proxy` factory every other sovereign route uses, which is why the family's browsers are not throttled. |
| **Backups** | **Done** (DR-1113), and it is the item this page's own first draft called *not optional*: one verified `pg_dump` of the whole database, **auth included**, per night; a sha256 beside it; retention **only after** a verified new dump; a weekly restore drill into a scratch database; `status.json` for a witness to judge. It rides the already-armed services-sync clock, so it added no DSM entry. |
| **A witness** | **Built** — `loops-health.yml` reads `/volume1/PoeTech/sovereign-replay/status.json` and `/volume1/PoeTech/backups/db/status.json` and reds on `ok:false`; `nas-health.yml` carries the stack. **But see the gap below: on 2026-10-29 that witness cannot reach the box.** |

### Two roads, one ledger

A merged migration reaches this database by either of two roads, and the ledger
`public._sovereign_replay` is shared, so it applies **once** whichever arrives
first:

1. **The runner's road** — `db-migrate.yml` applies to hosted, then
   `scripts/sovereign-replay-over-tailnet.sh` runs `replay_migrations.sh` here
   over SSH.
2. **The NAS's own clock** — `replay-on-clock.sh` (DR-1269), every services-sync
   cycle, running the *same* `replay_migrations.sh` against the *same* ledger.
   Built on 2026-10-28, the day the runner's Tailscale key was refused and road
   1 closed for every migration while this box stayed up and kept pulling
   `main` every fifteen minutes. The files were already here; nothing here
   applied them.

A lock inside `replay_migrations.sh` keeps the two roads off each other, and
`MAX_PER_RUN` bounds a cycle.

### The gap, as of 2026-10-29 — we cannot SEE this database from CI

Road 2 means migrations should still be landing. **"Should" is the problem.**
Every road from a GitHub runner to this box needs `TS_AUTHKEY`, and that key
has been refused since 2026-10-28:

- `loops-health` run **40756618915** (2026-10-28T19:45Z) ended
  `loops-health: the NAS did not answer over SSH`. Its last **success** was
  2026-10-27T19:30Z.
- `inbox-lessons-waiting` run **40813815722** (2026-10-29T03:5xZ):
  `Join the tailnet` reported **success**, `Verify the tailnet actually joined`
  **failed** (DR-1284 — a join step is not a witness of the join).

So the applied frontier, the replay's `status.json` and the backup's
`status.json` are **unknown from CI**, and unknown never reads as healthy
(DR-0076 §8). The one value that reopens all of it is a Tailscale auth key
(Reusable + Ephemeral) as `TS_AUTHKEY` — a value only Darrell can mint.

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

**The lane runs it — dispatch `nas-storage-sync.yml`** (Actions → nas-storage-sync
→ Run workflow; `bucket` = `moore-showcase` by default, EMPTY = every bucket in
scope). The runner joins the tailnet, ssh-es to the NAS with `NAS_SSH_KEY`, pulls
the mirror, runs `storage_sync.py`, and goes red unless the bucket reaches parity
AND one object reads back anonymously through kong (`scripts/storage-sync-over-
tailnet.sh`). Darrell 2026-09-08: "you have cli and ssh..." — the remote-hands
channel is the team's CLI on the box (DR-0108); nothing here waits on a paste.

**Scope without the hosted key: PUBLIC buckets only, and the withheld ones are
NAMED.** A public object needs no credential on the hosted side, so Shay's
gallery (`moore-showcase`) copies today. `HOSTED_SB_URL` defaults to the hosted
project (a public fact, not a secret).

**For the PRIVATE buckets, one line only Darrell can add to
`/volume1/docker/poetech/agent.env`:**

    HOSTED_SERVICE_ROLE_KEY=<the hosted project's service_role key>

The key is at Supabase dashboard -> Project Settings -> API Keys -> Legacy ->
`service_role` (starts `eyJ`), or the Secret key on the API Keys tab (starts
`sb_secret_`). It is a server-side secret: it belongs in `agent.env` on the NAS
and must never reach the browser bundle or a repo secret used at build time.
The next dispatch with an empty `bucket` then copies every bucket; the run
prints the key's PRESENCE only, never its value (its family by prefix and
hosted's answer to it are printed beside that presence line).

**Place it with `place_hosted_key.sh`, not a raw paste (2026-09-23).** Four
dispatches read a pasted value that was not a key of any family (57 chars,
"cdn", a control byte inside; hosted answered HTTP 400 to it over HTTP/1.1,
the same as to no key at all). On the NAS (ssh or ConnectBot):

    bash /volume1/PoeTech/repos/Kingdom-PWA-Node/infra/nas-supabase/place_hosted_key.sh

It reads the paste silently, strips what a terminal adds (CR, quotes, spaces,
a copied `Bearer `), names the family by prefix, reads a JWT's role and
project, asks hosted to list its buckets with the value, and writes
`agent.env` ONLY when hosted lists a private bucket. The screen shows length,
prefix and hosted's answer; the value is never echoed.

**By hand, from the NAS (the same script, if the lane is ever unavailable):**

    cd /volume1/PoeTech/repos/Kingdom-PWA-Node/infra/nas-supabase
    python3 storage_sync.py --dry-run            # counts only, writes nothing
    python3 storage_sync.py --bucket=moore-showcase   # smallest bucket first
    python3 storage_sync.py                      # all 455, resumable

Re-running is cheap and safe: an object already present at the same size is
skipped, so an interrupted run is re-run, never restarted. The run ends in
`verdict GO` only when every bucket in scope is whole, nothing failed, and the
served-back proof read HTTP 200.

**The bridge is retired (2026-09-08).** nas-storage-sync run 1 reported
`verdict GO` for `moore-showcase` (12 copied, proof read HTTP 200), and the
`VITE_PUBLIC_STORAGE_URL` line was deleted from
`.github/workflows/deploy-cloudflare-pages.yml` in the same session. The images
are read from the sovereign backend, where everything else already lives.

    python3 storage_sync.py --selftest           # pure logic, no network

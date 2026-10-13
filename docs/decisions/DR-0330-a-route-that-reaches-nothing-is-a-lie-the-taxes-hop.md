---
id: DR-0330
title: A same-origin route that reaches nothing is a lie — the /taxes hop was never actuated, and eleven more are not either
date: 2026-09-06
status: accepted
supersedes: []
superseded-by: null
amends: []
tier: A
entities: [poetech]
grounds: [VERIFICATION-DOCTRINE, EXECUTION-OUTCOME-OBSERVABILITY, SOVEREIGN-FIRST, LESSONS-LEARNED, NOTHING-WAITS, PERPETUAL-IMPROVEMENT]
source: 2026-09-06 session — Darrell, on Books → Taxes with a 2024 return selected: "I am also unable to upload my taxes."
---

## Context

The screen showed two things at once: **"Could not reach the NAS upload
service"** and **"NO RETURNS INDEXED YET."** Nothing was wrong with the app.

One cause, three missing pieces, none of them in client code:

1. `infra/nas-tax-ingest/tax_upload_server.py` had **no installer** and appeared
   in **no manifest**, so nothing on the NAS had ever started it. Its README
   said "run it on the NAS" — precisely the hand step DR-0236 exists to delete.
2. The Funnel had **no `/taxes` mount**. `RECORDED-STATE.md` listed only `/`,
   `/mcp`, and `/nas-photos`.
3. The Caddy route existed **only in a docstring**.

So the upload POST reached a backend that was never started, and the archive GET
fell through the Funnel root to n8n — which is why one screen carried both
symptoms. Live since 2026-07-21. Roughly seven weeks.

This is the `/nas-photos` failure class again (DR-0268), and the reason it
recurred is that every layer the repo *could* see was green: the client called
the right path, the Pages Function existed and forwarded correctly, and
`client-path-parity.test.js` passed the whole time — it guards the FIRST hop.
Nothing guarded the hop after it.

## Decision

**The fix.** One backend answers every call the feature makes:
`tax_upload_server.py` now also serves `GET /taxes/archive.json` and
`GET /taxes/files/<entity>/<year>/<name>.pdf`, path-guarded with the same
patterns as the write route. So a single Funnel mount carries the feature.

The reads are deliberately **not** routed through Caddy. Nothing in this
repository can verify what the NAS Caddyfile contains or that it has an import
directory, and DR-0076 forbids editing a config we cannot verify. One process,
one mount, provable by the installer's own health probe. The reads are a pure
passthrough of what `tax_ingest.py` already publishes, so this adds no second
source of truth.

`install.sh` + `poetech-tax-upload.service` follow the scribe/property-photos
pattern and are registered in `services.json`, so **merging is the deploy**. The
installer reuses the EXISTING family bridge token rather than minting a second
one — a fresh token would 401 every device that already carries the old one. It
also runs the ingest once, so a NAS already holding returns publishes them on
that cycle: the "NO RETURNS INDEXED YET" half is fixed by the installer, not by
anything the browser does. `/taxes` is added to `funnel_watchdog`'s
`SOVEREIGN_MOUNTS`, so the route stays correct rather than merely starting
correct.

**The witness, because a fix without one lets the class recur.**
`scripts/funnel-actuation-guard.mjs` fails the build on a Pages Function that
forwards to a Funnel prefix which nothing mounts and nothing records. Its first
run found **twelve more instances**:

- `/sb` — the sovereign Supabase backend, the most load-bearing route in the
  system — was mounted correctly but had **no row in RECORDED-STATE**, a rule-2
  gap nobody had noticed. It now has its true row.
- Eleven routes (`/llm`, `/scribe`, `/ways`, `/reviews`, `/review-feed`,
  `/review-action`, `/property-history`, `/automation-status`, `/interest`,
  `/wake-orchestrator`, `/wake-orchestrator-control`) reach nothing at all.

Those eleven are written into a dated **UNACTUATED ledger** in
`RECORDED-STATE.md`. The guard requires a `re-review:` date on every line, so
nothing can be parked there quietly (DR-0075). The ledger is not an acceptance —
it converts an invisible gap into a counted one, and it is meant to shrink to
nothing.

**Honest limit, stated rather than glossed (DR-0076 §8):** "no provider found in
the repo" describes THIS REPOSITORY. None of those eleven were probed from
outside; the sandbox has no route to the NAS. A route listed there could be
answered by something the repo does not describe. The re-review settles each one
by probing it, not by reasoning about it.

## Also

The upload error collapsed every failure into one sentence — the shrug that let
this hide for seven weeks. It now names the hop: 401/403 says the device is
missing the family bridge token; 404/502/503 says the service did not answer AND
that this is the same hop making the archive read empty; offline says nothing
was sent. Moved into `lib/tax-upload.js` beside the call whose shape it
interprets, with every branch pinned.

## Consequences

- Taxes upload and archive both work once this merges and services-sync runs.
- The eleven unactuated routes are now counted, dated, and guarded. Each needs
  the same three pieces this one got: a service that answers, a registered
  installer, and a recorded mount.
- A new same-origin route can no longer ship reaching nothing.

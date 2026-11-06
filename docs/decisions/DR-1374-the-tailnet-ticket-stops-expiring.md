# DR-1374 — The tailnet ticket stops expiring

**Date:** 2026-11-06
**Status:** Decided
**Narrative:** [2026-11-06 — ConnectBot cannot reach this one](../99-session-notes/2026-11-06-connectbot-cannot-reach-this-one.md)
**Relations:** closes the recurrence behind DR-1269 and DR-1284 · serves DR-0108 (the road order) · DR-0107 (prove the deploy) · DR-0076 §2

## Context

Darrell: "Onetime fix... not 50 different connectbot tries!!!!!" The priority
voice/in-app lesson lane had no road — `inbox-lessons-waiting.yml` run
`42291051232` closed `Join the tailnet: success` and then
`Verify the tailnet actually joined: FAILURE`. The join reported success while
the road was shut, the DR-1284 shape exactly, caught only by that verification.

## What was measured

**ConnectBot cannot fix this one, and that is the finding.** The dead credential
is the *runner's* ticket onto the tailnet, held in Tailscale's control plane and
GitHub's secrets, never on the NAS. The DR-0108 roads were walked in order; road
one is the shut one.

**Why it recurs: 68 join sites across 64 workflows passed `secrets.TS_AUTHKEY`.**
An auth key expires by design, 90 days at most, so one expiry shuts 68 roads —
the deploy, every health witness, the bell, the lesson intake. DR-1269 and
DR-1284 each recorded an instance; neither removed the cause.

**Measured before converting, which changed the plan:** 21 of 68 sites have **no
`actions/checkout` before them**, and a local composite action cannot be read
without one, so a straight conversion would have silently broken 21 workflows.

## Impact

Unaddressed, the tailnet estate dies on a timer and a person re-mints a key
under pressure each time. **What this obligates:** a credential that does not
expire, one door so the next change is one file, and a verification that asks
tailscale rather than trusting a step's conclusion.

## Decision

1. **One door:** `.github/actions/join-tailnet`. All 68 sites use it; zero raw
   `tailscale/github-action@` uses remain.
2. **It prefers a non-expiring OAuth client** (`TS_OAUTH_CLIENT_ID` +
   `TS_OAUTH_SECRET`) and **falls back to `TS_AUTHKEY`** — the roads behave as
   today until those exist, and stop expiring the moment they do. No flag day.
3. **It verifies the join itself** and names which credential opened the road,
   printing neither value and redacting any `tskey-`.
4. **A sparse `actions/checkout` of `.github/actions` was added at the 21 sites
   that lacked one**, cone mode off, so a probe stays fast.
5. The two sites with `continue-on-error: true` keep it: each has a second road
   to the same public value, so a refused join must not end the job.

## Verification

Every one of the 97 workflows still parses as YAML after the rewrite — asserted,
not assumed, and it caught a real break: the first pass dropped the `- ` list
marker at the `- uses:` shape and left `transcript-backfill.yml` invalid, which
was valid before. Re-measured after the fix: **0 invalid, 0 join sites without a
prior checkout, 0 raw uses.** The workflow ceiling was raised to the measured
total 22659 with its reason. `re-review: 2026-12-06`.

# DR-1374 — The tailnet ticket stops expiring

**Date:** 2026-11-06
**Status:** Decided
**Narrative:** [2026-11-06 — ConnectBot cannot reach this one](../99-session-notes/2026-11-06-connectbot-cannot-reach-this-one.md)
**Relations:** DEFERS TO DR-1360 (which governs: the NAS initiates every road, and withdrew the OAuth client as *the* fix) · closes the recurrence behind DR-1269 and DR-1284 · serves DR-0108 · DR-0107 · DR-0076 §2

## Context

Darrell: "Onetime fix... not 50 different connectbot tries!!!!!" The priority
voice/in-app lesson lane had no road — `inbox-lessons-waiting.yml` run
`42291051232` closed `Join the tailnet: success` then `Verify the tailnet
actually joined: FAILURE`: success over a shut road, the DR-1284 shape.

## What was measured

**ConnectBot cannot fix this one, and that is the finding.** The dead credential
is the *runner's* ticket onto the tailnet, held in Tailscale's control plane and
GitHub's secrets, never on the NAS. Road one of DR-0108 is the shut one.

**Why it recurs: 68 join sites across 64 workflows passed `secrets.TS_AUTHKEY`.**
An auth key expires by design, 90 days at most, so one expiry shuts 68 roads —
the deploy, every health witness, the bell, the lesson intake. DR-1269 and
DR-1284 each recorded an instance; neither removed the cause.

**Measured before converting, which changed the plan:** 21 of 68 sites have **no
`actions/checkout`**, without which a local composite action cannot be read — a
straight conversion would have silently broken those 21.

## Impact

Unaddressed, the estate dies on a timer and a person re-mints a key under
pressure each time. **What this obligates:** a credential that does not expire,
one door so the next change is one file, and a verify that asks tailscale.

## Decision

1. **One door:** `.github/actions/join-tailnet`. All 68 sites use it; zero raw
   `tailscale/github-action@` uses remain.
2. **The `oauth-*` inputs stay DORMANT; this is NOT claimed as the fix.**
   DR-1360 (Accepted, merged) withdrew that proposal and governs; this record
   was written without citing it — my miss. No OAuth secret is set, every join
   uses `TS_AUTHKEY`, behaviour matches today's, and **nobody is asked to mint
   one.** Reviving it needs a decision superseding DR-1360, whose own fix is
   retiring the runner→NAS roads — which this makes cheap: one file, not 68.
3. **It verifies the join itself**, names which credential opened the road, and
   prints neither value, redacting any `tskey-`. **This closes DR-1284's
   41-lane debt to 0** — one step moved into the door, not 41 judgment calls.
4. **A sparse `actions/checkout` was added at the 21 sites lacking one**, cone
   mode off, so a probe stays fast.
5. The **four** sites with `continue-on-error: true` keep it (first recorded as
   two; re-counted on `origin/main`): each has a second road to the same value.

## Verification

All 97 workflows still parse as YAML — asserted, not assumed, and it caught a
real break (a dropped `- ` marker invalidated a file that had parsed). Measured:
**0 invalid, 0 join sites without a prior checkout, 0 raw uses.** **Nine**
pinning assertions fixed across eight suites, four found only by the full suite
— itself the finding. See the note. `re-review: 2026-12-06`.

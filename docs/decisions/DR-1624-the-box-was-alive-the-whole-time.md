# DR-1624: The box was alive the whole time — it reports first, counts its own key's days, and a person's own picture stays on their device

**Date:** 2026-11-24
**Status:** Accepted
**Tier:** B (a NAS loop, one receiving workflow line, one client read; no schema, no money)
**Type:** incident + bug fix
**Area:** `infra/nas-loops/loops/funnel_watchdog.py`, `infra/nas-loops/test_funnel_watchdog.py`, `.github/workflows/nas-funnel-report.yml`, `app/src/lib/profiles-sync.js`
**Sent in by:** Darrell, 2026-11-24: "This is relatively short time we have been having this log in and out issues... Sovereign fix!!!!!", "DRs.... re-review!!!!", "No longer shows my picture on my image spot!!!! Why?", "What can we do to make this never be an issue again!!!!!!!"
**Pairs with:** DR-1619 (corrected here), DR-1622, DR-1269 (the same misreading, a month earlier), DR-1360, DR-1526, DR-1617, DR-1618, DR-1620

## Context

Twelve hours after DR-1619 merged, the NAS had sent no report, and I had told Darrell the box was probably cut off from the internet. He asked for the records to be re-read and for a fix that makes this never happen again.

## DRs reviewed

- **DR-1269** records this exact misreading on 2026-10-28: the NAS was called unreachable for hours while it was up, pulling main every 15 minutes. The fault was one refused key.
- **DR-1360:** a credential that expires is never again the only road to a value the house holds.
- **DR-1609, DR-1610:** the only two merges that touched NAS code before the onset. Read in full, below.

## What was measured

- **Onset.** site-health passed at 2026-11-23 21:28 UTC and failed at 23:16 UTC. Every run since has failed: 502 on every road through the Funnel, and the Funnel address does not connect.
- **No merge caused it.** The merges at 22:11 (DR-1609: one small table, two triggers on `choir_sermons`, a filter in a six-hourly copy) and 22:27 (DR-1610: a census count) cannot take a node off a network. Both diffs were read from GitHub.
- **The box was alive and online throughout.** The NAS rang GitHub by `repository_dispatch` at 2026-11-24 01:22, 07:38 and 08:08 UTC, during the outage, with the same token the watchdog uses. Power, internet, clock and token all work. My "the box is cut off" was wrong.
- **Why DR-1619's watchdog said nothing.** It sent its report only after the heal. With Tailscale down, each of 12 `funnel --set-path` calls may wait 30 s, twice, plus a restart, inside a rider the runner kills at 480 s (`services-sync.sh`). So it was killed before it reported, every cycle. That is a design fault of mine.
- **The likely cause, not proven.** The NAS is absent from Darrell's tailnet device list, and Tailscale node keys expire unless expiry is disabled. That matches the sharp onset with no change on our side. It is confirmed only by the box's own `tailscale status`.
- **The picture.** His header showed "D". The picture lives in his `profiles` row; the read failed with the road, and `loadMyProfile` returned null.

## Impact

One lapsed key locked the whole family out, and the box that could have said so in minutes was silenced by its own repair attempt. A signed-in person also lost their own face from the header.

## Decision

1. **Report first, heal second.** The watchdog sends its first reading (Tailscale state, public codes, uptime, the commit it runs) before any repair.
2. **The heal is bounded.** Each mount call gets 10 s and the pass 90 s; no mount is tried on a node that is not Running.
3. **The box counts its own key's days.** It reads `Self.KeyExpiry` from its own `tailscale status --json`. Inside 21 days it sends a daily `expiring` report, which opens an incident. No expiry set is the wanted state and stays silent.
4. **A person's own profile is kept on their device,** under their own user id, and shown when the read cannot be made (`fromDevice`). It is never shown to another account. A successful read replaces it, a deleted row included.
5. **Never again, in order:**
   - (a) key expiry disabled on `poetech` when it is signed back in (DR-1622);
   - (b) item 3 as the standing warning if (a) is ever undone;
   - (c) DR-1622's second NAS-initiated road and the home road, so no single outside system is the door;
   - (d) what the app already holds on the device keeps working when the road is down (DR-1618, DR-1620, item 4).

## Verification

- `test_funnel_watchdog.py`, 24 cases. The first report leaves before any mount; a logged-out node is reported and no mount is tried; a hung CLI cannot outlive the budget; days to expiry are read, including fractional stamps and a lapsed key; one warning a day inside the window only.
- `my-own-profile-is-kept-on-my-device.test.js`, 6 cases, with the loss proven to catch.
- 114 profile tests pass; ruff and eslint are clean on the new files.

**Not verified:** the box's own state. The next cycle after merge sends it. `re-review: 2026-11-25`

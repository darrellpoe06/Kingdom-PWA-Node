# DR-1110: A 200 is not a ring — the bell reads ntfy's own answer, and the relay can reach ntfy at all

**Date:** 2026-10-19
**Status:** accepted
**Tier:** A (four small corrections: the bell's classifier, the relay's ntfy address and installer, one mount check)
**Type:** infrastructure
**Area:**
- `scripts/ops-announce.mjs` (`classifyBellResponse`)
- `app/src/__tests__/a-dead-bell-says-so.test.js` (two new cases)
- `infra/nas-announce/announce_server.py`, `poetech-announce.service` and `install.sh` (the ntfy address, and a unit that is rewritten when it changes)
- `infra/voice-studio/install.sh` (the `/voice` mount check)

**Amends:** DR-0970 (a dead bell says so). Grounds: DR-0076 (no claim without evidence), DR-0108 (review our ways).
**Declared by:** Darrell, 2026-10-19: "Comprehensive understanding of the system...", "What is outside of the 10 dimensions... give me the full understanding of the system", "Inside and out...". These four defects were found by the full-system trace in `docs/99-session-notes/2026-10-19-the-system-inside-and-out.md` and verified against the code before any edit.

---

## Context

The phone alarm is how a real outage reaches Darrell. site-health and the deploy's boot check call `scripts/ops-announce.mjs`. It POSTs to the sovereign relay at `/announce/ops-announce` on the Funnel, and the relay pushes to the family's own ntfy. Two defects in that path meant the alarm could fail without saying so, even after DR-0970.

## What was measured

1. **A 200 was read as a ring.** `classifyBellResponse` returned `rang: true` for any 2xx. The relay answers `200 {ok, delivered, detail}` whether or not ntfy took the push: `do_POST` returns `self._json(200, {'ok': True, 'delivered': delivered, …})` after `push()`, including when `push()` returns `(False, 'ntfy unreachable: …')`. So a push ntfy never received was recorded as "the announce relay accepted the push".
2. **The relay probably could not reach ntfy.** The unit ran the relay on the HOST with `NTFY_URL=http://ntfy:80`. `infra/n8n/INSTALL.md` item 9 says `ntfy:80` resolves only inside the n8n compose network. `infra/n8n/docker-compose.yml` publishes ntfy on host port 8081, and its own host-side default is `http://localhost:8081`. With defects 1 and 2 together, every alarm that reached the relay could fail at ntfy and still read as rung.
3. **The installer would never have delivered a corrected unit.** It rewrote `/etc/systemd/system/poetech-announce.service` only when the `ANNOUNCE_TOKEN` line differed. Simulated on a unit carrying the old `ntfy:80` line and the current token:
   - the old rule: no rewrite;
   - the new rule: one rewrite with a reload, then idempotent.
4. **`/voice` was hidden by `/voice-lite`.** The voice-studio installer tested `grep -q "/voice"` against `tailscale funnel status`, and that also matches `/voice-lite`. Once voice-lite was mounted, the installer reported `/voice` as "already mounted" and never mounted it. This fits the deploy workflow's own note that "/voice-lite is the only voice road mounted". The new `grep -qE '/voice([[:space:]]|$)'` was checked on three sample lines: it does not match `/voice-lite`, and it does match `/voice` with and without a trailing target.

## Decision

- A 2xx whose JSON body says `delivered: false` is a dead bell, and its reason carries ntfy's own detail. A 2xx with `delivered: true`, with no JSON, or with no such field still rings, so older relays keep their meaning.
- The relay's ntfy address is `http://127.0.0.1:8081`, in the unit and as the code default.
- The installer renders the unit and replaces the installed one whenever they differ (`cmp -s`). That sets `NEED_RELOAD`, which the existing restart logic already carries into a restart.
- The voice-studio mount check matches `/voice` as a whole path.

Not changed here, stated so nobody infers otherwise:
- **The HTTP 400 the relay has answered since 2026-10-16 is not explained by this record.** The only 400 in `announce_server.py` is `bad json`, and `ops-announce.mjs` sends small, valid JSON. The next alarm after this deploys will either ring, or now print ntfy's own reason, or still read 400. That 400 needs its body recorded, which belongs to the witness work held on PR #2166.
- `funnel-proxy.js` has no fetch timeout. That is left as is: the roads range from a 6 s geocode to a 180 s research answer, so a single number would break some roads. A per-road budget is its own change.

## Impact

When the alarm reports "rang", ntfy has now said it delivered. When ntfy is unreachable, the ledger now names that instead of reading green. A NAS with an old unit takes the corrected one on its next services-sync cycle (every 15 minutes, `infra/nas-loops/install-clock.sh`), with no SSH needed. The `/voice` road gets its mount on the next voice-studio install.

## Verification

- `a-dead-bell-says-so.test.js`: 20 cases, two of them new. **Proven to catch:** with the old `ops-announce.mjs` restored, `a 200 that says delivered:false is a dead bell` fails (1 failed, 19 passed); with the fix, all 20 pass.
- `announce_server.py --selftest`: 0 failures.
- `push-announce`, `services-sync-guard`, `services-sync-degraded` and `funnel-actuation-guard`: green (91 tests across the five files).
- `bash -n` on both installers.
- Live proof is the next real alarm, or a site-health run after the NAS syncs. `re-review: 2026-10-20`: read the next `ops-announce` line on #2057 or the site-health run log, and confirm it says rang with ntfy delivering, or names ntfy's reason.

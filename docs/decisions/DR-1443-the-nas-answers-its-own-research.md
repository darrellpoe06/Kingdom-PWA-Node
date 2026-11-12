# DR-1443: The NAS answers its own research items

**Date:** 2026-11-12
**Status:** Accepted
**Tier:** A (restores a lane that was meant to run; same rows, same SQL, new road)
**Type:** decision
**Area:** `infra/nas-research/research-inbox-nas.sh` (new), `infra/nas-research/install.sh`, `scripts/live-sql.sh` (`LIVE_SQL_LOCAL`), `.github/workflows/research-inbox.yml` (schedule retired)
**Sent in by:** Darrell, 2026-11-12: "We have a research space does it work?!!!! Fix it!!!!!"
**Pairs with:** DR-1360 (the NAS starts every road), DR-1172 / DR-1202 / DR-1200 / DR-1203 (the research lane), DR-0248 (budget + lock), DR-0076

## Context
The Research tab writes an `agent_inbox` row tagged `research`. `research-inbox.yml` answered those rows from a GitHub runner that joined the tailnet.

## What was measured
- **Every run failed** (`research-inbox.yml`, 2026-11-11 16:32 to 2026-11-12 10:32 UTC): the NAS bell's hourly `repository_dispatch` and the schedule alike.
- **The cause is the runner's tailnet key**, which expired 2026-11-04 ("invalid key: API key does not exist"). The run dies at the join, before it can claim a row.
- **So every question and link sat at "Waiting to be looked into"** with nothing looking.

## Impact
The research space did not work for anyone since about 2026-11-04.

## Decision
The NAS runs the same lane itself, with no runner and no key:
- **Same SQL.** `research-inbox-nas.sh` uses the same files: the waiting claim, the reading and create queries, and `research-create.sh`. They run through `live-sql.sh` in its new `LIVE_SQL_LOCAL=1` mode: docker exec psql on this box, no ssh.
- **Same roads.** YouTube captions; else `link_words.py` and the Whisper ladder; a question goes to `/ask` on 127.0.0.1:8797 with the family key read on the NAS.
- **Same rows.** Every answer row's first line is the unverified sentence.
- **What the NAS lacks.** It has no runner address or browser (roads 3 and 6). An unreadable link still falls back to the sender's own words (DR-1203).
- **Started each cycle** by the research installer, before any step that can stop it, and detached: a link's audio can take 45 minutes.
- **Brakes (DR-0248):**
  - Budget: one item claimed at a time (`LIMIT 6` run as `LIMIT 1`), at most 3 items and 3000 s per run, under a 55-minute wall.
  - Lock: a pid lock directory, plus the `research-claimed` tag (FOR UPDATE SKIP LOCKED).
  - Stop: `enabled:false` on the research service, or `RESEARCH_NAS_ENABLED=0`.
  - Ledger: `/volume1/PoeTech/research/nas-lane/last-run.json`.
- **The runner road is retired.** `research-inbox.yml` loses its schedule; the GitHub bell is off by default; dispatch is kept.

## Verification
- `research-answered-on-the-nas.test.js` runs the real script with a database stand-in and a local `/ask` + `/read` that demands the family key. It pins:
  - one claim at a time; the answer's first line; its parent and sender; the reading row;
  - no question words or key in the log;
  - the lock skipping and stale-lock release.
- **Proven to catch twice:**
  - without the LIMIT rewrite the lane refuses to claim;
  - a copy without the unverified line fails the check.
- `live-sql` local mode makes no ssh call, and a missing key still exits 10.
- NOT YET PROVEN (P66): working when the first answer appears in the Research tab. `re-review: 2026-11-14`.

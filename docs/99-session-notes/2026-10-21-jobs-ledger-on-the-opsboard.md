# 2026-10-21 — The Jobs ledger on the OpsBoard: every clocked workflow, by name

**Decision record:** DR-1189 (the build it tracked; built the same session)
**Source:** Darrell's notes of 2026-10-21: "Data quality controllers and reporting systems are fundamentally sound?!" ·
"Cyclical calendars for stored procedures" · "Reminders" · "Actual job names" · "Number of jobs, last ran, never
ran... sequence of things, logs".

## What was built

| piece | file | what it is |
|---|---|---|
| the derive script | `scripts/derive-job-registry.mjs` (`npm run jobs:registry`, `jobs:registry:check`) | reads every `.github/workflows/*.yml` with a LIVE `schedule:` (a commented-out cron is not a schedule) and writes the name and crons to `app/src/lib/job-registry.json`: 38 scheduled workflows on 2026-10-21 |
| the registry | `app/src/lib/job-registry.json` | derived, never typed (DR-0121); `job-registry.test.js` fails on drift, proven to catch on a fixture (a renamed workflow, a changed cron, a commented cron) |
| the ledger | `app/src/lib/jobs-ledger.js` | a five-field cron reader (lists, ranges, steps; refuses what it does not understand), the two normalisers, `buildJobsLedger` with three verdicts, the words, and the live read: TWO requests for the whole board (`/actions/workflows`, `/actions/runs?event=schedule&per_page=100`) through the shared ETag cache and rate budget |
| the strip | `app/src/components/JobsLedgerStrip.jsx`, wired into `OpsBoard.jsx` under the fleet census | what needs a look by default (missed, no run in the window); "Show every job" opens the full list in place; each row: actual name, file, cron, cycle, next fire times, last ran and how it ended, logs, all runs, the sequence of its runs |

## The three verdicts, and the honest words

- **ran** — the last run is inside the cycle: "ran 20 min ago, success".
- **missed** — the last run is older than TWO cycles or an hour, whichever is longer (GitHub throttles crons;
  site-health.yml asks for every 10 minutes and measures ~67): "missed a cycle: last ran 3 h ago, cycle every 30 min".
- **no run in the window** — the read is the newest 100 scheduled runs across every workflow; a job absent from it
  says "no run in the last 100 scheduled runs (window back to <day>)", never "never ran" (the fleet census's own
  discipline: never-in-retained-history is not never-once).
- **unknown** — a failed read says why, names what the registry still knows (38 scheduled workflows), and draws no
  job as run or missed. Never green.

## What was measured

- 38 of the 41 workflow files carry a live schedule; every one of their crons parses (pinned).
- Requests per board load for the jobs: 2 (pinned in the live-read test).
- Gates: `jobs-ledger.test.js`, `job-registry.test.js`, `jobs-ledger-strip.test.jsx`, with `ops-board-render`:
  4 files, 28 cases, all passing on the first run. Lint 0.

## What this does not do yet

- The NAS half (the loop registry's `state/` records) and the Cowork scheduled tasks are not in the ledger; the
  GitHub half was the one the app could read today. `re-review: 2026-10-28` (DR-1189).
- Nobody has seen it rendered: this sandbox has no route to poetech.us. The live pass is the stewards' after
  deploy (DR-0104).

# The lane's orchestration, measured (2026-11-19)

Source for DR-1601 to DR-1605. Every number here came from the GitHub Actions API or the repository on 2026-11-19 between 14:00 and 15:30Z, unless it says otherwise.

## The brief's claims, checked

| Claim | Checked | Result |
|---|---|---|
| ~23 CI jobs per PR whatever it touches | run 44515147816 (lesson sov97) | **24** jobs (incl. the aggregator and wf36) |
| all `runs-on` are `ubuntu-latest` | grep | **141 of 141** |
| 103 workflows, 43 scheduled | YAML parse | 103 files; **39** have a `schedule:` trigger (43 files mention the word, 4 only in comments) |
| concurrent-job ceiling is the bottleneck | API | runs queue for many minutes with few in progress; **the plan's ceiling was not read** (no billing endpoint reachable from this session) |
| deploys starved and superseded | deploy runs, run 44476228421 jobs | deploy runs 20-66 min creation-to-finish overnight, 6-11 min after 10:00Z; the run held the workflow-level lock 27 min after the site was live (DR-1603) |
| landings make open PRs conflict in INDEX.md and the usage ledger | repo + throwaway PRs | INDEX rows were appended at the table's end; the usage ledger was already placed by hash (DR-1536). `merge=union` does not help on GitHub (#2815 conflicted) |
| `strict_required_status_checks_policy` false | not read (ruleset API not reachable from this session) | taken from the brief |
| CI tests the branch head, not the merge | ci.yml header (DR-1297) | confirmed |

## CI, before

Last 100 CI runs (all branches): **57 cancelled**, 32 success, 11 failure. Successful non-main runs, created to finished: median **37 min**, p90 **72 min**, min 18, max 84 (n=24).

Per-job wall time in run 44515147816: vitest shards 13.5 / 9.3 / 17.0 / 10.0 min; surface sweep 11.6; layout 6.6; door journeys 5.8; probes 4.1; guards 4.2; curriculum 2.2; the 12 PostgreSQL wall legs 0.5-1.5 each.

## The standing load

Triggered by other runs, measured from the last 100 runs of each:

| Workflow | Rate | Trigger | Cancelled | Typical run |
|---|---|---|---|---|
| Deploy freshness | 20 an hour | `workflow_run` on CI and Auto-merge, any branch | 49 of 100 | 3 min (watches up to 5 x 45 s) |
| Migration freshness | 11 an hour | `workflow_run` on CI, any branch | 38 of 100 | 3.2 min |
| Auto-merge | 12 an hour | `pull_request` (84), `check_suite` (16) | 94 of 100 | `heal-deploy` polls every 30 s for up to 60 min while any PR is armed |

Scheduled (from the cron lines; jobs per run is the jobs defined):

| Workflow | Cron (UTC) | Runs/day | Jobs/run | Job starts/day | Other triggers |
|---|---|---|---|---|---|
| `site-health.yml` | `*/10 * * * *` | 144 | 3 | 432 | - |
| `lesson-mail-watch.yml` | `*/5 * * * *` | 288 | 1 | 288 | - |
| `migrate-freshness.yml` | `*/5 * * * *` | 288 | 1 | 288 | workflow_run |
| `deploy-freshness.yml` | `*/5 * * * *` | 288 | 1 | 288 | workflow_run |
| `push-outbox-drain.yml` | `*/15 * * * *` | 96 | 1 | 96 | - |
| `keep-prs-current.yml` | `7,37 * * * *` | 48 | 1 | 48 | push |
| `camera-health.yml` | `7,37 * * * *` | 48 | 1 | 48 | workflow_run |
| `feedback-fixed.yml` | `7 * * * *` | 24 | 1 | 24 | - |
| `intake-autofix.yml` | `23 * * * *` | 24 | 1 | 24 | - |
| `ops-queue-health.yml` | `23 */2 * * *` | 12 | 1 | 12 | - |
| `node-availability.yml` | `0 */6 * * *` | 4 | 2 | 8 | - |
| `nas-health.yml` | `23 */6 * * *` | 4 | 1 | 4 | - |
| `openclaw-tower.yml` | `17 */6 * * *` | 4 | 1 | 4 | push |
| `system-flow-proof.yml` | `41 */6 * * *` | 4 | 1 | 4 | - |
| `harvest-health.yml` | `17 */6 * * *` | 4 | 1 | 4 | - |
| `video-stats.yml` | `53 */6 * * *` | 4 | 1 | 4 | - |
| `rls-isolation.yml` | `47 13 * * *` | 1 | 2 | 2 | - |
| `level-witness.yml` | `41 12 * * *` | 1 | 2 | 2 | - |
| `funnel-health.yml` | `33 14 * * *` | 1 | 1 | 1 | - |
| `announce-health.yml` | `13 14 * * *` | 1 | 1 | 1 | - |
| `daily-review.yml` | `0 12 * * *` | 1 | 1 | 1 | - |
| `scribe-health.yml` | `47 13 * * *` | 1 | 1 | 1 | - |
| `voice-lite-health.yml` | `41 13 * * *` | 1 | 1 | 1 | - |
| `loops-health.yml` | `27 14 * * *` | 1 | 1 | 1 | - |
| `voice-health.yml` | `17 14 * * *` | 1 | 1 | 1 | - |
| `review-watcher.yml` | `23 11 * * *` | 1 | 1 | 1 | - |
| `public-shelf-witness.yml` | `41 14 * * *` | 1 | 1 | 1 | - |
| `libraries-health.yml` | `7 14 * * *` | 1 | 1 | 1 | - |
| `poetech-plus-keys.yml` | `23 10 * * *` | 1 | 1 | 1 | - |
| `research-health.yml` | `41 13 * * *` | 1 | 1 | 1 | - |
| `mcp-health.yml` | `57 13 * * *` | 1 | 1 | 1 | - |
| `live-link-probe.yml` | `17 13 * * *` | 1 | 1 | 1 | - |
| `immich-health.yml` | `53 13 * * *` | 1 | 1 | 1 | - |
| `lesson-builder-health.yml` | `3 14 * * *` | 1 | 1 | 1 | - |
| `tax-upload-health.yml` | `51 13 * * *` | 1 | 1 | 1 | - |
| `property-photos-health.yml` | `9 14 * * *` | 1 | 1 | 1 | - |
| `corpus-reconcile.yml` | `0 16 * * 1,4` | 0.285714 | 1 | 0.285714 | - |
| `exposure-report.yml` | `17 14 * * 3` | 0.142857 | 1 | 0.142857 | pull_request |
| `fleet-census.yml` | `38 13 * * 1` | 0.142857 | 1 | 0.142857 | - |

39 scheduled workflows; 1599 scheduled job starts a day.

Note: none of Deploy freshness's last 100 runs (4.8 hours) was a `schedule` run; all were `workflow_run`. Its five-minute cron did not fire in that window, or fired and was not listed. Not explained here.

re-review: 2026-12-03 (repeat these measurements a week after DR-1601 to DR-1603 land).

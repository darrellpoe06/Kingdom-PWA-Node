# DR-0582 — A rider that cannot work today does not red the fleet; parity asks by name after the repoint; the hosted key has a channel

- **Status:** accepted
- **Tier:** B (fleet-witness semantics on the NAS; a read-only probe of the management API); the key PLACEMENT step is Tier C and is NOT shipped here — see §3
- **Type:** orchestration
- **Date:** 2026-09-23
- **Numbering:** minted as DR-0569 on this branch and renumbered on merge per DR-0052; main's DR-0569 (the-studio-is-tried-not-asked-about) landed first and keeps the number.
- **Scope:** `infra/church-media-golive/choir_dates_sync.py` (exit 3 on both "cannot work today" paths), `infra/nas-loops/loops/services-sync.sh` (exit 3 = DEGRADED, named, fleet green), `app/src/__tests__/services-sync-degraded.test.js` (behavioural), `infra/nas-supabase/cutover_sync.py` (post-repoint parity: schema objects missing BY NAME, the blob gap carries DR-0317, the live side ahead is expected; selftest gated in `ci.yml`), `.github/workflows/nas-storage-sync.yml` (read-only probe of the hosted project's keys via `SUPABASE_ACCESS_TOKEN`), `.github/workflows/nas-health.yml` (six-hourly clock)
- **Principles:** VERIFICATION-DOCTRINE (DR-0076 — a check must mean something; measure, do not claim), GATE-THE-CLASS (DR-0239 dim 7), REVIEW-OUR-WAYS (DR-0108 — a "his hand" is a premise to challenge), NOTHING-WAITS (DR-0236), THREE-BRAKES (the clock is read-only; nothing spawns work)
- **Grounds:** Darrell 2026-09-23: *"Find solutions!!!!!!!!!"* — on the services-sync red; nas-health runs 35759346227 and 35802484974; DR-0317 (the blobs never moved), DR-0442 (the writers never moved), DR-0310 (REPOINT-ARMED)

## What was measured

| finding | evidence |
| --- | --- |
| `services-sync` red every 15 min since ≥ 2026-09-22 16:15Z | NAS event log: `loop_run_fail` at 16:16, 16:31, 16:46, 17:01, 23:31, 23:46, 00:01, 00:16, 00:31 |
| the ONLY failing service from 23:31 on: `choir-dates` | `services-sync: FAILED: choir-dates (exit 1: File ".../choir_dates_sync.py", line 134` — the `raise RuntimeError("yt-dlp not available")` |
| the supabase installer's 150-second gateway wait failed at 16:xx and PASSED at 00:30 | cutover status `at: 2026-09-23T00:30:30Z` carries a parity line, which only prints when the gateway answered |
| the parity verdict is `matched: 0` and can never be GO | `compare_counts` treats the target being AHEAD as a divergence; sovereign is the live writer (DR-0442) and holds 29 auth users to the retired side's 23 |
| `storage_objects 455 vs 12` | DR-0317's recorded gap: `nas-storage-sync` ran once (2026-09-08) and copied the 12 public objects; 443 private objects wait on `HOSTED_SERVICE_ROLE_KEY` |
| the NAS witness had no clock | `nas-health.yml`: `workflow_dispatch` only; every reading above came from a hand dispatch |

## Decisions

1. **Exit 3 is DEGRADED.** A service that is installed and healthy but could not do its work this cycle says so with exit 3. The runner names it on the summary line the event log keeps (`all services synced; DEGRADED: choir-dates (…)`) and the cycle stays green; a real failure (exit 1) still reds it. The choir-dates rider returns 3 on both of its "cannot work today" paths and keeps 1 for "no credentials" / "no instance". Its own witness, `harvest-health`, owns the incident (issue #1617 is already open on exactly this stall). **Proven behaviourally:** the runner's python is executed against fake installers — degraded-among-healthy is green and named; degraded-plus-failed is red.
2. **Parity after the repoint asks by name.** When `REPOINT-ARMED` is present beside `cutover_sync.py`, the verdict is: GO iff no public table / function / policy / trigger present on the retired side is absent on the sovereign one — **listed by name**, so the "17 functions short" of the counts becomes a fixable list on the next cycle's status file. The blob shortfall is reported as `DR-0317: private-bucket objects withheld pending HOSTED_SERVICE_ROLE_KEY`, not as an anonymous count. The live side being ahead is `live_ahead`, expected and said. The pre-repoint rule is untouched for an un-armed box. Selftest: 7 new checks incl. proven-to-catch; gated in `ci.yml` (it never was before).
3. **The hosted key is channel-drivable, and placing it is a decision, not a paste.** The repo already holds a Supabase management-API token (`SUPABASE_ACCESS_TOKEN`). `nas-storage-sync` now PROBES with it — `GET /v1/projects/{ref}/api-keys`, printing names/types and the response's field names with every value-bearing field stripped — so the next dispatch reports, rather than assumes, whether `service_role` can be read through this channel. **Placing it on the NAS is not shipped:** it moves the hosted project's most privileged credential through CI into `agent.env`, and the session's own guard refused it as a secret-store write. It is Darrell's call. Recommended default: yes — the same box already holds hosted DB credentials in that file, the value would cross on ssh stdin under `umask 077` and be masked in the log — and then 443 objects copy on the next dispatch. Until then the paste path in DR-0317 stands.
4. **The NAS witness has a clock.** `nas-health` runs six-hourly (read-only ssh, ~2 min, no compute). The 2026-09-22 red was found by a hand dispatch; it would have been found by the system.

## Not done, said plainly

- The supabase gateway's 150-second wait failed at 16:xx for a reason this session could not measure from the log (it passed at 00:30). Left alone; the new clock will show whether it recurs. `re-review: 2026-09-30` — carried by the review watcher.
- The 17 functions / 4 tables are still unnamed until the next NAS cycle prints the post-repoint line. That line is the deliverable of §2; reading it is the next session's first act.

## Measured after merge (2026-09-23, appended; the substance above is left as written)

The probe ran (nas-storage-sync run 35870752417) and its first line was `SUPABASE_ACCESS_TOKEN is not set — the probe cannot run.` §3's premise — *"the repo already holds a Supabase management-API token"* — was read off a workflow that names the secret, not off the secret store, and it is false: the name exists, the value does not. So the hosted key is **not** channel-drivable today. The private set is also larger than DR-0317 counted: six buckets (`church-documents`, `church-team-documents`, `family-documents`, `legal-documents`, `sermon-documents`, `tlc-onboarding`), none copied. Two roads remain and both start with a value only Darrell holds: (a) DR-0317's paste of `HOSTED_SERVICE_ROLE_KEY` into `agent.env`; or (b) a Supabase personal access token set once as the repository secret `SUPABASE_ACCESS_TOKEN`, after which the probe reports whether `service_role` is listable and the placement decision in §3 becomes live. The probe step now says this in its own words.


## Measured again after the key was placed (2026-09-23, appended)

Darrell placed a value in `HOSTED_SERVICE_ROLE_KEY` (agent.env, grep count 1) and the copy was dispatched twice (runs 35872398146, 35872407338): every private download failed HTTP 400 with no body printed. #1750 made the download path print the server's answer; run 35877253926 (church-team-documents) then printed it 322 times:

    {"statusCode":"404","error":"Bucket not found","message":"Bucket not found","code":"NoSuchBucket"}

for a bucket the hosted catalog lists (`storage.buckets`: `church-team-documents`, private, 322 objects, read the same minute). Storage looks a bucket up under the caller's role with RLS on `storage.buckets`; a real `service_role` bypasses RLS and sees it, any other role is told "Bucket not found". That body is therefore the signature of a key that is **not** `service_role` — the anon key from the same Legacy API Keys page is the likely paste. `storage_sync.py` now decodes the key's unverified `role` / `ref` claims (as nas-health already does for the anon key), prints `hosted key in agent.env: wrong-role (anon)` in one line, and scopes the run back to public-only with the reason, instead of failing 322 times. The next dispatch says which key is there. If it is the anon key, the value only Darrell holds is the **service_role** row of Project Settings › API Keys › Legacy, pasted into the same line of `agent.env`.

# DR-0644 — The ledger merges resolve themselves, and live PRs are kept current

- **Status:** accepted
- **Tier:** C (a change to the merge / CI lane: DR-0107 governs it, and it is not done until a real run is observed updating a real PR and CI starting on the new head)
- **Date:** 2026-09-24
- **Type:** orchestration
- **Scope:** `scripts/resolve-ledger-conflicts.mjs` (new), `.github/workflows/keep-prs-current.yml` (new), `.github/workflows/ci.yml` (+`workflow_dispatch`), `.gitattributes` (+`merge=dr-ledger` for INDEX.md), `scripts/business-systems-guard.mjs` (three merge-shaped findings), `app/src/__tests__/resolve-ledger-conflicts.test.js` (new, 19 checks), `app/src/__tests__/business-systems-guard.test.js` (unchanged, still green)
- **Principles:** MOVE-WITHOUT-BEING-PUSHED (DR-0103), UPTIME-OUTRANKS-VELOCITY (DR-0107), VERIFICATION-DOCTRINE (DR-0076: measure, do not claim; proven-to-catch), THREE-BRAKES as amended for the deterministic class (DR-0247 / DR-0248), HOLD-THE-HAND-OF-THE-PROCESS (DR-0621)
- **Grounds:** DR-0011 (one decision per file; branch per session, which is exactly why INDEX.md collides), DR-0052 (renumber on merge), DR-0146 (pr-janitor: idle PRs are not live), DR-0458 (`workflow_run` on a workflow's completion is not suppressed, measured)

## What was measured

2026-09-24 23:15 UTC. Every open agent PR (#1782, #1793, #1795, #1796 and more) was green on CI and could not merge; GitHub's update-branch reported "merge conflict between base and head" on all four. Reproduced here with `git merge-tree` against `origin/main` at `da2d4c6e`:

| branch | conflicted files |
| --- | --- |
| `claude/continue-a-lesson-way-better` (#1793) | `docs/decisions/INDEX.md` only |
| `claude/every-intake-carried-to-an-outcome` (#1782) | `docs/decisions/INDEX.md` only |
| `claude/a-notice-that-names-a-route-opens-it` (#1731) | INDEX.md **plus** `TTSControl.jsx`, `use-read-aloud.js` |

The INDEX.md conflict is structural: every PR appends a row and edits the single `**Next ID:** DR-NNNN.` line, so any two PRs conflict. `app/src/lib/legibility-health.json` is the second file of the same class: generated, and `legibility-guard.test.js` requires it byte-identical to a fresh scan. So each merge to main knocked every other PR out of date, a human or an agent resolved the same two files by hand, CI re-ran (~20 minutes), and another merge landed meanwhile. Hand resolution also went wrong once: a commit shipped with conflict markers inside INDEX.md.

## Impact

Unresolved, every merge to main costs every other open agent PR a hand resolution of the same two files and a fresh ~20-minute CI run, and the lane stalls exactly when it is busiest: the "we don't move when I'm not pushing" constraint DR-0103 removed, back through a different door. Hand resolution is also where the ledger gets damaged (a commit shipped conflict markers inside INDEX.md). The call obligates: a timer-driven job that pushes to other sessions' branches must refuse anything it does not own (only the two ledger files, never forced, never an idle PR, never a `hold`), and must say out loud what it left.

## The decision

**1. The two ledger files resolve themselves.** `scripts/resolve-ledger-conflicts.mjs`, run in a tree mid-merge:

- **Refuses** (exit 2, naming them) if any file other than the two is in conflict. Real conflicts belong to the branch's owner.
- **INDEX.md:** the conflict stages are merged with `git merge-file`, each hunk replaced by the order-keeping union of its two sides (shortest common supersequence, so a row stays above the pointer; the naive "ours, then theirs" put it below, which the simulation below caught). DR rows are de-duplicated by id, first kept. Every `**Next ID:**` line is folded into one, the pointer **re-derived from disk** (newest `DR-NNNN-*.md` + 1), and every parenthetical annotation from both sides is kept (balanced-paren parse, nested parens intact, new ones first).
- **legibility-health.json:** regenerated with `node scripts/legibility-guard.mjs --health` from the merged sources, never picked from a side.
- **Verifies loudly** (exit 1): nothing still unmerged, zero conflict markers in any file the merge touched, and `node scripts/business-systems-guard.mjs` green.

**2. The guard now catches the merge-shaped breaks.** `business-systems-guard` adds three findings to the ledger check: conflict markers in INDEX.md, a DR row present twice, and more than one `**Next ID:**` line (the pointer regex reads only the first, so a wrong second pointer was invisible). The marker finding is the gate that the shipped-with-markers commit never met.

**3. `keep-prs-current.yml` keeps live agent PRs current.** For each open, non-draft PR to main from a `claude/*` branch of this repository, not labeled `hold`, with a human commit in the last 72 hours (older ones are pr-janitor's, DR-0146), that is behind main: merge main in, run the resolver (the copy on **main**, never the branch's), and on success commit the merge and push it (plain fast-forward push, never forced: if the owner pushed meanwhile it is refused and the next run retries). On refusal or failed verification it comments **once** per distinct file set, naming the files, and leaves the PR alone.

- **Triggers:** push to main (a human merge); a dispatch from `auto-merge.yml`'s heal-deploy and from `deploy-freshness.yml` at the moment each dispatches the deploy for a new main tip (that is when an auto-merge has landed); a 30-minute schedule as the fallback only; manual dispatch (with an optional single PR and budget). *(First shipped as `workflow_run` on the deploy; measured not to fire, see "After merge" below.)*
- **CI on the new head (the GITHUB_TOKEN push gap):** a GITHUB_TOKEN push fires no `push` or `pull_request` workflow. The job therefore **dispatches `ci.yml` on the branch** (`workflow_dispatch` is the event a GITHUB_TOKEN may fire; `ci.yml` gains that trigger) so both required checks land on the new head SHA. When the optional secret **`LANE_PUSH_TOKEN`** exists, the checkout pushes with it instead; that push is an ordinary push, `ci.yml`'s own `push` trigger runs CI, and no dispatch is made. After any update the job dispatches `auto-merge.yml`, so its heal-deploy poll is watching when the refreshed PR goes green and merges.
- **The one gap GITHUB_TOKEN cannot close, as measured (run 36080708300, 2026-09-25; this line first predicted a wider gap, which the measurement corrected):** merging main's workflow changes into a PR branch and pushing with GITHUB_TOKEN is **accepted**. #1808, #1809, #1793 and #1802 all carried main's new `ci.yml` and `keep-prs-current.yml` and were pushed. GitHub refuses only workflow content that exists nowhere on main (`refusing to allow a GitHub App to create or update workflow … without workflows permission`). That happens when the branch edits a workflow file itself and the merge yields a new version: #1811 and `voice-lite-probe.yml`. The job tries the push, and on that refusal comments once and leaves the PR to its owner. **`LANE_PUSH_TOKEN`** (a fine-grained token on this repository with Contents, Pull requests and Workflows read/write) would close even that case. It is optional.

**4. A merge driver for local merges.** `.gitattributes` marks INDEX.md `merge=dr-ledger`. The driver (`resolve-ledger-conflicts.mjs --driver %O %A %B`) unions and folds inside `git merge` itself (pointer from rows + 1, since the tree is mid-checkout; the post-merge pass re-derives it from disk). A repo-local driver config cannot be committed, so it is inert until configured: git falls back to its normal text merge, which the tests prove. `keep-prs-current.yml` configures it in CI; locally it is one `git config` line, given in `.gitattributes`.

## Brakes (timer-driven automation, deterministic class: DR-0248 budget + lock)

- **Budget:** at most `MAX_PRS` merge attempts per run (default **6**; PRs already current or idle are not counted); a **15-minute** in-script deadline checked before each PR; job `timeout-minutes: 20`; every network `git`/`gh` call carries its own `timeout`.
- **Lock:** concurrency group `keep-prs-current`, `cancel-in-progress: false`. A new fire while one runs waits, at most one waits (GitHub drops older pending runs), and fires never stack.
- **Stop-paths:** the `hold` label per PR (checked on every run); disabling the workflow for all of them.

## Proof

**Against the real conflicts (2026-09-24, local, nothing pushed to either branch):**

- `claude/continue-a-lesson-way-better` @`72e7ee41` + `origin/main` @`da2d4c6e`: INDEX.md conflicted. Resolver: `pointer DR-0639, 2 Next-ID line(s) folded into one, duplicate rows dropped: DR-0627, DR-0626` → legibility-health regenerated (255/268 pages pass) → `business-systems-guard: OK — ledger whole (newest DR-0638, pointer correct)` → exit 0. The folded pointer carries all 298 distinct annotations of the two sides' lines, none missing (measured by re-parsing).
- `claude/every-intake-carried-to-an-outcome` @`de5cad4a`: INDEX.md conflicted → resolved, guard OK, exit 0.
- `claude/a-notice-that-names-a-route-opens-it` (#1731): **refused**, exit 2, naming `app/src/components/TTSControl.jsx` and `app/src/lib/use-read-aloud.js`.

**The sweep itself, simulated end to end** against a local bare origin with a stubbed `gh`: one PR with ledger-only conflicts was merged, committed, pushed and CI dispatched; one with a third conflicting file was commented once and left alone; a second run found the first PR current. With a workflow change on main and `HAS_PUSH_TOKEN=true` the push path ran and no CI dispatch was made. The simulation also caught a real defect before it shipped: the first union put main's new row below the folded pointer. Fixed (`unionKeepingOrder`) and pinned by a test.

**Proven-to-catch:** 19 checks in `resolve-ledger-conflicts.test.js`, fixture = the real #1793 conflict. Disabling the row de-duplication plus the pointer recompute failed 8 of them; disabling the refusal and the marker check failed the 2 that pin those. The guard's three new findings are pinned there too.

**Live (DR-0107):** #1807 merged at 00:46:17Z as `2188a564`; `Deploy (Cloudflare Pages)` run #1312 (36079079753) deployed that exact SHA, success, 00:49:54Z. The site deploys.

## After merge: three defects, measured on the first real runs (2026-09-25)

1. **It never started itself.** Zero runs by 00:58Z. The `workflow_run` trigger named `Deploy (Cloudflare Pages)` exactly, but deploy #1312 (and #1812's deploy after it) completed with no run here. Those deploys are dispatched by GITHUB_TOKEN from auto-merge's heal-deploy, and a run the token starts emits no `workflow_run` either. DR-0458's `workflow_run` on Auto-merge fires because Auto-merge is started by `check_suite`, not by the token. **Fix:** the trigger is removed; auto-merge's heal-deploy and deploy-freshness now dispatch `keep-prs-current.yml` right after each deploy dispatch for a new tip (`workflow_dispatch` is the event a GITHUB_TOKEN may fire). The `7,37 * * * *` schedule is valid; the workflow was registered at 00:46Z, so its first slot (01:07Z) had not come due when zero runs were counted.
2. **Both hand-dispatched runs died at their first PR.** Run 36079894560 (`pr=1793`) exited 1 straight after `Candidates: 1`; run 36079894564 (the sweep) exited 2 after `Candidates: 28` with `grep: write error: Broken pipe`. The Actions default shell is `bash -e`: the conflicting `git merge` the job exists for returned 1 and ended the run, and the idle check's `git log | grep | head` took SIGPIPE under pipefail. The local simulation had run the script under plain `bash`. **Fix:** `set +e` before anything; the idle check reads a file instead of a pipe; the comment-once lookup reads a file too (under pipefail, `gh | grep -q` reads a found marker as not-found).
3. **The budget could go to zombies.** 28 candidates, 6 attempts, in `gh pr list` order. **Fix:** candidates are sorted most-recently-updated first. (Idle PRs never cost budget; they are skipped before an attempt.)

4. **The zero-marker check scanned this record's own fixture.** Run 36080396789 (01:05Z, the fixed script dispatched from its branch) resolved INDEX.md on #1814, #1802, #1793, #1809, #1808 and #1811 and then refused all six: `conflict markers left behind: app/src/__tests__/fixtures/ledger-conflict-1793.txt:3,12,72,76`. That file carries markers on purpose and came in verbatim from main; the check scanned every file the merge brought in. **Fix:** it scans only the files this resolution produced (the ones in conflict when it started, plus the two ledger files). A clean auto-merge never writes a marker. Pinned both ways in `resolve-ledger-conflicts.test.js`: the fixture no longer blocks, and a marker in a file the resolution wrote still fails it (the old scan fails the first test). The same run also reported 21 idle zombies as "budget reached", because the budget was checked before the idle filter; it is now checked just before an attempt. The workflow checks out the commit its own file came from (`github.sha`, main on every automatic fire), so a hand dispatch from a branch tests that branch's resolver against the real PRs before merge.

**Run 36080708300 (01:08Z, fixed script, 29 candidates), per PR:** #1808 updated to `ef693acd` (behind 5, INDEX.md conflicted), CI run 36080745229 dispatched. #1809 updated to `d1575487` (behind 9), CI 36080750289. #1793 updated to `d191170a` (behind 4), CI 36080755438 on that exact head, listed against PR #1793. #1802 updated to `92af1e42` (behind 4), CI 36080760467. #1811: resolved, but the push was refused because the branch's own `voice-lite-probe.yml` edit made new workflow content; commented once. #1815 and #1782 were already current. #1814, #1801, #1791, #1810, #1803, #1800 and #1731 were "budget reached" (6 attempts), queued for the next run. 15 PRs idle more than 72 hours were left for their owners. auto-merge.yml was dispatched (36080772137). The six comments the earlier fixture refusal left were edited to say they were withdrawn.

The lock held: the two dispatches were queued together at 00:57:42Z; run 1's job ended 00:58:01Z and run 2's sweep step only began at 00:58:16Z.

The idle filter does not skip agent PRs: it ignores only commits whose author is `github-actions…` (this job's own merge commits); an agent's commits, authored as the session, count as live.

**Now pinned:** `app/src/__tests__/keep-prs-current-lane.test.js` runs the sweep script **extracted from the workflow file** under `bash -e`, against a throwaway origin with an 8,000-commit history and 28 fake PRs (26 idle ones listed first): the ledger-only PR is merged, pushed and its CI dispatched, the other PR is commented once and left, the 26 idle ones are skipped, and a second fire finds the first PR current and does not comment again. The shipped script is reconstructed in the same test and **caught** twice: it dies of the broken pipe before touching any PR (run 2), and without `set +e` it dies at the first conflicting merge (run 1). The triggers and brakes are pinned too.

## What is still not proven

- That a `workflow_dispatch` run of `ci.yml` on a PR branch satisfies the ruleset's required checks for that PR's head. The check names and head SHA match, which is what required checks are matched on, but that is a reading, not a measurement. **`re-review: 2026-09-25`**, on the first real update.
- That `LANE_PUSH_TOKEN` exists. It does not yet. Until it does, a PR that edits a workflow file itself gets a comment instead of a refresh (#1811 today).

# DR-0773 — The cloud session's `ccr-` branches ride the same lane as `claude/` branches

- **Status:** accepted
- **Tier:** C by class (a change to the merge lane, DR-0107) carried as the smallest possible edit: one branch prefix added to three existing filters, nothing else in the lane touched; proof per DR-0107 is the next real merge producing a real deploy
- **Type:** orchestration fix
- **Date:** 2026-10-07
- **Scope:** `.github/workflows/auto-merge.yml` (eligibility regex), `.github/workflows/auto-open-pr.yml` (push trigger branches), `.github/workflows/keep-prs-current.yml` (live-PR sweep filter), `.github/workflows/ci.yml` (push trigger branches)
- **Principles:** THE-STREAMLINED-DELIVERY-LOOP (DR-0103), DR-0107 (prove the deploy after any lane change), DR-0236 (nothing waits), VERIFICATION-DOCTRINE (DR-0076)
- **Grounds:** DR-0103's own text: *"The `claude/*` lane was excluded until 2026-07-05 — that exclusion WAS the 'we don't move without pushing' stall; it is fixed and must stay fixed."* The cloud sessions no longer push on `claude/*`.

## Context

Claude Code on the web (claude.ai/code) assigns each session a branch named `ccr-<id>` (this session: `ccr-916ff311-lgoc4v`). The delivery lane recognizes `feat/ fix/ merge/ docs/ claude/` only. Every PR from a cloud session therefore sits on a green head until a hand merges it, which is the exact stall DR-0103 closed for `claude/*` on 2026-07-05, back under a new name.

## What was measured

- PR #1987: all required checks green at 05:03:19 UTC (run 37573880969); still open at 05:44 UTC with `mergeable_state: unstable` and no auto-merge request. Merged by hand (squash, `adbddf66`) at 05:45.
- Auto-merge job 112638331611 on that push: `No eligible PRs awaiting auto-merge.` The filter: `select(.headRefName | test("^(feat|fix|merge|docs|claude)/"))`.
- The same was true of #1983, #1984 and #1985 today: each merged by hand after green, none by the lane.
- `auto-open-pr.yml` triggers on `claude/**` but not `ccr-**`; `keep-prs-current.yml` sweeps `startswith("claude/")` only, so a cloud session's PR is also never kept current with main by the lane.
- Found while proving this record: the lane opened PR #1988 itself (run 37578057609) and then NO CI ran on it. `ci.yml`'s `push` branches were `main, feat/**, fix/**, merge/**, docs/**, claude/**`, and a PR opened with `GITHUB_TOKEN` fires no `pull_request` run, so a `ccr-` PR opened by the lane had one check (the opener) and `mergeable_state: blocked`. Without `ccr-**` in `ci.yml` the lane would open ccr PRs that can never go green. CI was dispatched by hand on that head (ci.yml `workflow_dispatch`) and the prefix added here.

## Impact

Agreed, verified work waited on a hand for 40 minutes today and would have waited indefinitely overnight. The deploy that carries the camera-service restart button and the Wyze draft fix reached the family 40 minutes later than the gates allowed.

## Decision

1. `auto-merge.yml` eligibility: `^(feat|fix|merge|docs|claude)/|^ccr-`.
2. `auto-open-pr.yml` push trigger gains `ccr-**`.
3. `keep-prs-current.yml` sweeps `claude/` or `ccr-` heads.
4. `ci.yml` runs on `push` to `ccr-**` (so a lane-opened ccr PR carries CI on its head, the same way `claude/**` does).
5. Nothing else in the lane changes. The `hold` label and branch protection govern exactly as before; a `ccr-` PR labeled `hold` is disarmed by the same reverse pass.

## Verification

- All three workflow files parse as YAML.
- Proof per DR-0107, in order, recorded in the PR: (a) this PR, pushed on a `ccr-` branch, is opened or recognized by the lane and auto-merge is armed on it by the sweep (the job prints `Eligible PRs: <n>` naming it); (b) it squash-merges on green with no hand; (c) a real `Deploy (Cloudflare Pages)` run fires for main's new tip and succeeds; (d) site-health's next run reads the served build equal to main.
- If (a) fails, the regex is wrong and the PR is merged by hand with the failure named here; if (c) fails, the deploy is dispatched at once (DR-0107) before anything else.

## Follow-ups

- The `claude/*` name survives in comments and in DR-0103's text as the cloud lane; the cloud lane is now two prefixes. The next edit to DR-0103's section in CLAUDE.md names both. `re-review: 2026-10-21`.

# DR-1147: A decision number claimed twice is caught before the merge — and a race is told apart from a verdict

**Date:** 2026-10-20
**Status:** accepted
**Tier:** B (a new CI check that can fail a pull request; read-only, writes nothing but its own step summary and one PR comment, and cannot fail a PR over a race)
**Type:** way

**Area:** `scripts/dr-number-claims.mjs` (new), `.github/workflows/dr-number-claim.yml` (new), `app/src/__tests__/a-number-claimed-twice-is-caught-before-the-merge.test.js` (new).

**Principles:** DR-1136 (no branch gate can see a number two branches both claim; merge order is the only tiebreak); DR-0644 (the resolver refuses a collision rather than folding it, after folding silently DELETED two real decisions on 2026-10-06); DR-1021 (the renumber is a tool); DR-0076 (unknown is not a no; proven-to-catch); DR-0236 (nothing buildable waits); DR-0107 (do not change the merge lane without proving the deploy).

## Context

**Six number collisions on 2026-10-20, in five hours.** Every one the same shape:

| number | the two records | how it was found |
|---|---|---|
| DR-1131 | week 43 (#2298) vs the voice witness (#2299) | main red after the second merge |
| DR-1135 | the ledger count (#2300, 19:31:42Z) vs the prompt words (#2306, 19:41:27Z) | main red after the second merge |
| DR-1137 | the sov44 lesson (branch) vs the road-to-full-time record (main) | the resolver refused a base merge |
| DR-1138 | the sov45 lesson (branch) vs the front-door record (main) | the resolver refused a base merge |
| DR-1143 | the sov44 lesson (22:26:08Z) vs db-migrate (22:17:41Z) | main red after the second merge |
| DR-1144 | the sov45 lesson (branch) vs the church-price record (main) | found by hand, mid-wait |

**`business-systems-guard` was correct on every single branch.** That branch's ledger *was* whole — exactly one record per number. The duplicate exists only in the **union** of the branches, and the union only comes into being when the second one merges. DR-1136 recorded that and dated the fix for 2026-10-27. Today earned an earlier date.

**A union check by hand provably cannot close the window.** Measured on the DR-1143 collision: I verified 1143 free at **22:12**, another session took it at **22:17**, and my verifying push merged at **22:26**. I did the careful thing and it still collided. Only something that reads the whole union *at PR time* can see it.

**The cost was not the renames.** Each repair meant a rename, a citation pass read by hand, a gate run and a full re-verify; **two had to be redone because main moved mid-repair**; one branch (sov45) was forced to renumber twice and was told to stop rather than start a third. Three finished lessons sat blocked behind the race rather than behind anything about the lessons.

## What was measured

Measured 2026-10-20, running the new reader against the **live** trees rather than fixtures.

| tree | introduced | verdict | exit |
|---|---|---|---|
| sov45's branch, against main's 1,045 records | DR-1144 | **taken-on-main** — `…-no-single-witness-…-sov45.md` against main's `…-the-church-and-its-options-are-priced-on-the-page.md` | **1** |
| sov46's branch, same main | DR-1139 | free | 0 |
| sov46's branch, with a fabricated open-PR claim on 1139 | DR-1139 | **contested-with-open-pr**, naming both sides | **0** |

With only main's claims the suggested target was **DR-1145** — a number *my own unmerged branch held*. Given the open PRs' claims too it suggested **DR-1146**. The suggestion is exactly as good as the union it is given, which is why the workflow gathers both halves.

**`--selftest`: 15 checks**, no network and no repository state.

## Decision

**Read the union at PR time, and classify rather than merely detect.** Three verdicts, and the distinction between the last two is the whole design:

- **`taken-on-main` → FAILS the check.** A number already belonging to a *different, merged* record is a settled fact, and DR-1136 already says who moves. The output names both records, suggests the lowest number nothing in the union claims, and prints the exact `renumber-decision-record.mjs` command — with the reminder that it must run on a **clean** tree, because mid-merge every bare citation is ambiguous and the tool must refuse them.
- **`contested-with-open-pr` → REPORTS, never fails.** Two open PRs wanting one number is a race nobody has lost. Merge order has not happened yet, so failing both would be a gate picking a winner it has no standing to pick — and renumbering into a contested number is the treadmill this is meant to end, not extend.
- **`free`** — nothing else claims it.

**That split is why this could ship tonight with three lesson branches in flight.** A check that failed on races would have blocked sov45 and sov46 — the very work the collisions were already delaying. I deferred this gate three times today on the stated grounds that it might block them; when I actually tested that reason it was a **fake boundary**, because the gate does not have to block a race at all.

**Only ADDED records count as a claim.** A PR that merely edits an existing record is not claiming its number; counting an edit would make every touch of the ledger a false collision.

**A PR whose files cannot be read is reported, never counted as claiming nothing** (DR-0076). Silently treating an unreadable PR as empty is how a gate reports green on a collision it never looked for.

**It cannot touch the lane it protects.** `contents: read`, `pull-requests: write` for its one comment; no push, no dispatch, no auto-merge call. DR-0107's concern is a change to the merge/CI/deploy lane; this adds a check beside that lane and alters nothing in it.

## Impact

**The next collision is caught on the PR instead of on main.** The failure arrives with both record names, the number to take, and the command to take it — which is the part that cost the most today, since four of six repairs needed the citations read by hand to decide which record each one meant.

**What it does not do.** It cannot stop two PRs opened minutes apart from both claiming a free number — it can only say so, and let merge order settle it. Closing *that* would need a reservation at claim time (a number taken by writing to a shared registry before the record is written), which is a heavier change to how records are authored. **`re-review: 2026-11-03`** — whether the contested-warning proved enough in practice, or a claim-time reservation is worth its weight.

It also does not run on PRs that touch no decision record, by `paths` — so the common PR pays nothing for it.

## Verification

**17 cases**, and the four that matter are **proven by running the script**, not by reading it:

| what was broken | what went red |
| --- | --- |
| the introduced-numbers filter reverted to `!(n in mainClaims)` — my own first draft's defect | **1** — *"expected [] to include '1143'"* |
| a contested race made to FAIL the build | **1** — *"a race nobody has lost must not fail a PR: expected 1 to be +0"* |
| the renumber command removed from the output | **1** |
| the claims loader reverted to returning `{}` for a file it was told to read and could not | **1** — *"a claims file that does not exist must stop the run: expected +0 to be 2"* |

**A fourth defect of the same family, found on the merged tree.** Re-running the reader live against main's **1,048** records (DR-1147 free, exit 0) started with `--pr-claims /dev/null`, which crashed on a raw `SyntaxError`; a path that did not exist at all was worse — it returned `{}` **in silence**. Either way a claims-gathering step that wrote nothing, or wrote half a file and died, would make this gate report **every number free**. That is the exact disarmed-check shape this record argues against, sitting inside the record's own tool. A named claims file must now parse or the run **stops with exit 2** naming the file and the reason; only an **omitted** flag means "no claims given". The 17th case pins all three behaviours.

`--selftest` 15/15 · the workflow's YAML parses, all four shell steps pass `bash -n`, its embedded Python compiles and its `github-script` body passes `node --check` · `npm run lint` exit 0 · `npm run verify:gates` exit 0, read **without a pipe**.

**Four errors of my own inside this one piece of work, all the day's shape:**

1. **My first `introducedBy` filtered out every number main holds** — which is to say it filtered out the collision itself and would have reported "free" on all six of today's cases. A green that means *did not look*. It is now the first proven-to-catch case.
2. **My first live run reported sov45's branch as free** when that branch demonstrably holds the collided DR-1144. The script resolves its decisions directory from **its own file location**, so running it from another worktree read the wrong ledger. `--decisions` exists because of that, and the comment in the code says why.
3. **My first version of the "fails only on taken-on-main" case asserted on source text** — `if (taken.length) { … exit(1) }` — and that text **survived** the break: widening the filter to `verdict !== 'free'` makes a race fail the build while the assertion stays green. The case now executes the CLI in both situations and asserts the exit codes. A test that reads the shape of a guard instead of its behaviour is the hollow kind this record exists to argue against.

4. **My claims loader read a file it could not open as "nobody claims anything"** — see above. Three defects in one file, all the same error: a step that *did not look* reporting the same thing as a step that looked and found nothing.

**And the exit code had to be read without a pipe, again** — the fourth time today. `node … --selftest 2>&1 | tail -20` printed `EXIT=0` for a run that crashed with a `TypeError`; the pipeline's status is not the command's.

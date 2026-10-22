# DR-1207: A proof restores what it breaks — three proofs that proved nothing, and the operator that cannot repeat them

**Date:** 2026-10-22
**Status:** accepted
**Tier:** A (one new operator tool, read-only until invoked by hand; no gate changed, no record rewritten; 15 cases, 5 proven to catch, plus three live refusals on the real repo)
**Type:** tooling
**Area:**
- `scripts/prove-it-catches.mjs` (new — `occurrences`, `applyBreak`, `verdictOf`, `proveBreaks`, a vitest runner and a CLI over a JSON manifest)
- `app/src/__tests__/prove-it-catches.test.js` (new — 15 cases, weighted at the refusals)

**Grounds:** my own failure, measured 2026-10-22 while proving DR-1206's gate. Not reported by anyone: found by reading two identical failure counts that should not have matched.
**Principles:** DR-0076 §3 (proven to catch — a gate that always passes is itself a lie), §4 (measure, never claim), §8 (name the method's limits); DR-1021 (the fourth hand-written one-liner is a tool); DR-0075 (recurring friction becomes a fix); DR-0621 (hold the hand of the process — the flag is where the work starts); DR-0236 (nothing buildable waits)

## Context

DR-0076 §3 requires a new gate to be SHOWN to catch the break before it is trusted. In this repo that proof is run by hand: patch the implementation, run the suite, watch it go red, restore, re-run. Four breaks were proven that way for DR-1206 — and the first attempt proved nothing at all.

The loop restored each break with `git checkout <file>`. The implementation was not yet committed, so `git checkout` reverted **the work along with the break**. Breaks 2, 3 and 4 then ran against a file with no feature in it. All three reported the same 13 failures, I read three "catches" that were one unimplemented baseline, and the only thing that gave it away was the identical failure counts.

Three proofs that proved nothing, and they looked exactly like proofs. That is DR-0076's own failure class one level up: not a gate that lies, but a **proof** that lies — and a proof is what a decision record offers the next session as evidence.

## Measured (DR-0076 §4)

| | the hand-run | this operator |
|---|---|---|
| restore source | `git checkout` — cannot know whether its target holds the work | a byte snapshot taken in memory before patching |
| restore verified | by eye, from the next run's output | sha256 compared; a mismatch is fatal and names the file |
| baseline measured | once, at the top, if at all | **before every break** |
| a `find` matching 0 or 2 places | patched or silently skipped | refused, with the count |
| the tree at the end | assumed | re-run and required green |
| my 2026-10-22 run | 3 of 4 "proofs" invalid, undetected for minutes | refused at break 1, by name |

Live refusals, run against the real `ledger-names-its-thread` gate on main — not fixtures:

1. **Two real breaks → PROVED.** Proximity widened to a whole-file test, and a 16-hex slice of a git SHA accepted as a thread id. Both green-before/red-with, both restored byte-identical, `git status` clean after, exit 0.
2. **A break that does not apply → UNPROVEN**, *"its `find` string is not in the file. The break does not apply, so running it would prove nothing"* — and it never ran the suite for it. A break nothing checks (one word in a comment) → UNPROVEN, *"the suite stayed GREEN with the break in place."* Exit 1.
3. **My actual failure, replayed.** The implementation was broken uncommitted first, the way a bad `git checkout` leaves it, then a real break was run on top. The break WAS red — which by hand read as a catch — and the tool refused: *"the suite was already RED before the break, so this proves nothing about the break."* Its final check then reported the tree still RED and said to read `git diff` before trusting anything above. Exit 1.

## The decision

**A proven-to-catch run is executed by `scripts/prove-it-catches.mjs`, from a manifest, and the record quotes what it printed.** The breaks are still written by hand — the tool does not invent them and cannot know what is worth breaking. What it removes is the step that was never the interesting part and was quietly load-bearing: putting the file back.

```
node scripts/prove-it-catches.mjs --manifest <path.json>
{ "suite": ["src/__tests__/x.test.js"],
  "breaks": [ { "name": "...", "file": "scripts/x.mjs", "find": "...", "replace": "..." } ] }
```

Five refusals, each one a thing that produced a false proof or could have:

1. **Baseline green, per break.** An already-red baseline cannot say anything about a break. This single check is what stops the run I made.
2. **Restore from the snapshot, never from git**, and verify by sha256. A failed restore is fatal, names the file it may have left modified, and stops the run rather than patching a tree it cannot put back.
3. **A `find` string must occur exactly once.** Zero occurrences means the break does not apply and the proof is vacuous; two means which half was broken is ambiguous, and which line broke is the entire meaning of the result.
4. **No no-op breaks** (`replace` equal to `find`).
5. **The suite is run once more at the end and must be green**, so a run cannot leave the tree broken and still report success.

A break that leaves the suite green is reported **unproven and exits non-zero** — that is a finding about the check under test, not an error in the run, and the two are kept apart in the output.

## Impact — what this obligates

**Unresolved, the cost is a decision record that lies.** Every DR in this ledger offers its proven-to-catch table as evidence, and the next session trusts it instead of re-running it. A hand-written restore step means any of those tables could have been produced by three runs against an unimplemented file, with nothing in the record able to show the difference. DR-1206's table was re-run through a verified restore before it shipped for exactly this reason.

**What the call obligates, from here:**

- **A new gate's proof is run through this operator**, and the record quotes its output rather than a count typed from memory.
- **An existing record is not retroactively doubted.** This changes how proofs are run, not what has already been accepted; no past DR is reopened on suspicion.
- **`git checkout` is not a restore step in a proving loop.** It is fine for discarding work; it cannot be trusted to put back work it never saw.
- **The breaks stay hand-written.** If this tool ever generates them, the proof stops being a statement about what a human thought was worth breaking.

### Limits, named rather than left (DR-0076 §8)

- **It cannot tell a meaningful break from a trivial one.** Deleting a whole file turns any suite red and would be reported PROVED. The judgement of what is worth breaking is the author's, and the tool is honest that it only checks the mechanics.
- **It runs one file's break at a time.** A property that needs two files changed together is not expressible in a manifest yet; the hand-run still covers that case. `re-review: 2026-11-12` — if a multi-file break is wanted by then, it is a small extension (snapshot a set, restore the set).
- **It is not wired into CI, deliberately.** It patches the working tree, so it is an operator's tool invoked when a gate is being proven, not a check that runs on a push. A CI job that patches its own checkout to prove something is a thing that can go wrong while nobody is watching.
- **The tool's header cited DR-1051 and not DR-1206 for a few minutes, and now cites both.** DR-1206 — the two-road intake witness, whose proof exposed this — was still on its own branch when this tool was written, and `decision-citation-guard` correctly refused a code citation of a number not yet on main: a citation promises the reasoning is written down, and on main it was not. DR-1206 merged as `4353172bb` while this PR was in CI, the base merge brought it onto this branch, and the citation went back in the same commit with the guard green. Recorded because the sequence is the honest version of "cite it later" — the follow-through happened in the next commit, not on a date.
- **A suite that is slow makes this slow:** it runs the suite 2N+1 times for N breaks. On the live run above, two breaks took four runs of a sub-second suite; against a five-minute shard it would be unusable, and the honest advice is to point the manifest at the one test file that holds the gate, as both live runs did.

## Proven to catch (DR-0076 §3)

15 cases. Five are proven-to-catch, and the one that matters most is a replay of the real failure:

| case | what it pins |
|---|---|
| `it replays my 2026-10-22 failure and refuses to call it a catch` | a red baseline is fatal, not a third catch |
| `refuses a find string that is not there` | the vacuous proof |
| `refuses a find string that appears twice` | the ambiguous proof |
| `a break the check does not catch is reported unproven, not quietly passed` | a green break is a finding, not a pass |
| `a restore that does not take is fatal and stops the run before the next break` | a writer that silently drops the restore |
| `the baseline is measured for EVERY break, not once at the top` | one baseline per break, counted |

The suite's fake world is not a flag: its "green" predicate reads the file the same way a real check does, so a patch genuinely changes the outcome. And the three live refusals above were run against the real repo, which a fixture cannot do.

**A fourth live refusal arrived unplanned, minutes later, and it is the most useful one.** DR-1206 merged while this PR sat in CI; the base merge brought its refactor onto this branch, and the same manifest — unchanged — came back `UNPROVEN: its "find" string is not in the file. The break does not apply, so running it would prove nothing.` The refactor had moved the proximity line into a shared helper, so the break no longer existed.

By hand that is the silent failure: the patch no-ops, the suite stays green, and the honest reading of "green with the break in place" is *the check does not catch it* — a true gate retired as theatre by a stale manifest. **Refusal 3 catches a manifest that has gone out of date with the code it points at**, which is not a property I set out to build; it falls out of refusing a `find` that does not match. Pointed at the merged line, both breaks PROVED again, tree byte-identical. Recorded because a tool's unplanned catch on real code is worth more than the case I wrote for it.

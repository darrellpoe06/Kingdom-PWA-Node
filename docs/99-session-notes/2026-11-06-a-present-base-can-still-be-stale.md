# 2026-11-06 — a present base can still be stale

Narrative for **[DR-1365](../decisions/DR-1365-a-present-base-can-still-be-stale.md)**.

## The shape of the day

This is the fourth time today that one fault has surfaced in a different place, and the fourth time I did not recognise it until it had already cost something:

| | the read that was not made | how it reported |
|---|---|---|
| DR-1247 | the working TREE was behind main | handed out a number main held |
| DR-1249 | `origin/main` ref absent in CI | "main holds no decision records" |
| DR-1359 | remote-tracking VIEW stale | named two holders of a number held by three |
| **DR-1365** | the base REF stale, inside the guard built for DR-1249 | `OK — 0 added JavaScript file(s)` |

Every one is the same sentence: a read that did not happen, reported as a clean result. DR-0076 §8 asks for provenance on exactly this and I have now written that sentence into four records in one day, which suggests the lesson is not the individual fix.

## How this one was caught, and it was not by me

`format-guard` went red on #2571. I had run the same guard, on the same tree, before pushing, and it said:

```
format-guard: OK — 0 added JavaScript file(s) formatted (prettier), 0 added Python file(s) clean (ruff), since origin/main.
```

CI said `1 finding(s) on files added since origin/main (2 js, 0 py)`. Two files added, one unformatted.

The whole difference was one unfetched ref. `git diff --diff-filter=A origin/main...HEAD` from a worktree whose `origin/main` is behind finds nothing added, so prettier was handed an empty list and the guard printed a green line about it. One `git fetch origin main` and the same command reproduced CI exactly, naming the file.

So the guard did not lie about the files. It lied about having looked.

## The premise I had to correct, with a number instead of an opinion

`ensureBase` opened with `if (has()) return true`, and a case I wrote this morning pinned it:

> `it('fetches nothing at all when a merge base is already there', ...)` — *"a guard that fetches every run is a new cost on every job."*

That sentence is mine, it is not wrong about cost, and it is weighed against the wrong thing. So I measured the cost rather than keep asserting it:

```
$ for i in 1 2 3; do time git fetch --no-tags --depth=1 origin '+refs/heads/main:refs/remotes/origin/main'
965 ms
808 ms
776 ms
```

Under a second, against a `lint + guards` job that runs for minutes — and what it buys is the guard not reporting OK over an empty set. The refresh is now unconditional. The expensive machinery is untouched and still only fires when the base is genuinely missing: three deepen rounds, then `--unshallow`.

I corrected the two cases rather than deleting them, and put the measurement inside them. A suite that quietly loses the record of having been wrong is worth less than one that carries it.

## And the shallow checkout, met the hard way

An hour later, merging main into #2571, git refused outright:

```
fatal: refusing to merge unrelated histories
```

Not corruption — `git rev-parse --is-shallow-repository` says `true`, so `origin/main` simply had no history deep enough to share an ancestor. `--deepen=100` produced the base at `3a073d0c3`. That is the exact condition `ensureBase`'s deepening path exists for, hit by hand in a plain merge, which is a reasonable argument that the knowledge belongs somewhere more general than one guard. Not built today; named here so the next session meeting it spends a minute rather than ten.

## Measured

- 9 cases before, **12** after; lint clean.
- Proven to catch by restoring the short-circuit: **4 red**, including a case that asserts the refresh comes first for a present base AND an absent one. File restored byte-identical under `cmp`.
- **Not claimed:** that the guard now sees every unformatted file. It sees files ADDED since a freshly-refreshed base. A changed file was never in scope, and `re-review: 2026-12-06` asks whether that is still right.

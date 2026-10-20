# DR-1118: The pointer line stops doubling — one unclosed paren had grown the ledger to 27.5 MB, and 25.7 MB of it was one line

**Date:** 2026-10-19
**Status:** accepted
**Tier:** A (one script, one generated-prose line; no surface, no schema, no money; a gate ships with it)
**Type:** way

**Area:** `scripts/resolve-ledger-conflicts.mjs` (the tool that owns the `**Next ID:**` line, wired into `git merge` itself via `.gitattributes`) and `docs/decisions/INDEX.md`.

**Grounds:** found by measurement while pulling the next dated backlog item. Counting the re-reviews due 2026-10-20 reported 4,267 occurrences for 2026-10-21 across only 40 files — an impossible ratio that was my own grep being wrong about *something*, and chasing which number was wrong found the file.
**Principles:** DR-0245 (fold discipline — every byte here is paid by every session before any work); DR-0644 (the ledger merges itself); DR-0076 §3 (proven-to-catch) and §4 (measure, don't claim); DR-1041 / DR-1042 (presentation defeating the reader); DR-0621 (a flag is where the work starts).

## Context

`docs/decisions/INDEX.md` is read, or at least merged, by effectively every session
and every PR. CLAUDE.md's own fold-discipline section says of it: *"every byte here
is paid by every session before any work."*

It was **27,573,001 bytes**, and **25,721,382 of them were a single line** — line 950,
the `**Next ID:**` pointer. Nobody had noticed because nobody reads a 27 MB file; a
read of it earlier in this same session returned a 6.5 MB truncated blob and I routed
around it rather than asking why it was that big. The anomaly only surfaced because a
count came back absurd and I chased the absurdity instead of discarding it.

## What was measured

**The line.** 25,721,382 characters. It carried **28,240** annotation segments of
which **34 were distinct**; several appeared **1,074 times each**. All 34 distinct
segments together are **41,036 bytes**.

**The cause, in the parser and not in the prose.** `nextIdAnnotations` split the
annotation tail on paren BALANCE. The accumulated text carried **70,959 `(` against
69,237 `)`** — a final depth of **1,722**, never negative. One unclosed paren in prose
is enough: depth never returns to zero, so the old fallback

```js
if (depth !== 0) loose += buf; // unbalanced tail: keep it verbatim
```

kept the entire remainder as **one opaque group**. Two opaque blobs from opposite
sides of a merge are never string-equal, so `unionAnnotations` could not dedupe them,
and every fold appended the whole blob to the whole blob. The 1,722 unclosed parens
are both cause and consequence: one seed paren, multiplied by the doubling it caused.

**A diagnosis of mine that the measurement disproved.** I first said the cause was
`unionAnnotations` copying `lists[0]` through without self-deduplication. Running the
real line through the real functions returned `parsed groups: 1`. With one group there
is nothing to deduplicate, so that could not be the driver. It is a real second-order
bug — a list that already carried repeats kept every one of them forever, so the file
could never shrink however often the resolver ran — and it is fixed here too. But the
parse collapsing to one group is what did the growing, and I had it backwards until
the measurement said so.

## Decision

**Split an unbalanced tail on its `(DR-NNNN = ` segment markers instead of keeping it
whole, and de-duplicate the first list against itself.**

The balanced path is byte-identical to before, so well-formed input behaves exactly as
it did; only the degenerate branch changes. Marker-splitting does not care how the
prose inside a segment parenthesises, so a blob becomes comparable groups again and
dedupe works. Text before the first marker is kept as its own group, so the old
contract's promise — nothing is ever dropped — is kept by a means an unclosed paren
cannot defeat.

**And a one-time repair of the data**, applied with the tool's own functions so that
every other line stayed byte-identical: line 950 went from 25,721,382 to **41,091**
characters, the file from 27,573,001 to **1,670,097** bytes, the line count unchanged
at 1,265. Nothing was lost: all 34 distinct segments survive, and the only `DR-` id
present before and absent after is `DR-1118` — the pointer's own value, which
`nextIdAnnotations` strips by design and `normalizeLedger` writes back separately.

## Impact

**What this buys.** 25.9 MB off a file in the merge path of nearly every PR, and the
resolver can now shrink the line instead of only ever growing it. Folding is
idempotent, proven by case: running it twice cannot grow the result.

**The property that let it land mid-flight.** `fold(repaired, stale-blob)` returns the
repaired list unchanged. Two lesson branches were in flight carrying the 25.7 MB line
in their own trees; a merge against the repaired `main` therefore cannot re-inflate it,
and they need no special handling. That is measured and pinned, not assumed — it is
why this shipped after those two PRs rather than being blocked by them.

**What this does not do.** It does not find or fix the original unclosed paren in the
surviving prose; the 34 kept segments are preserved verbatim, imbalance and all,
because editing a prior session's recorded words to tidy a paren is not mine to do and
the parser no longer cares. It does not add a budget to any other generated line, so a
different line could in principle grow the same way — the two budgets here cover the
pointer line and the file, which is where the damage was. It does not explain how the
first duplicate pair arose, only why none of them could ever be removed; the growth
mechanism is proven, the seed event is not, and I am not going to invent one.
**`re-review: 2026-12-19`** — whether the 200 KB pointer-line budget and the 4 MB file
budget are still generous, measured against two months of real annotation growth.

## Verification

`app/src/__tests__/the-pointer-line-stops-doubling.test.js`, **11 cases**, plus the
21 existing `resolve-ledger-conflicts` cases still green — including the
`.gitattributes` merge driver that runs inside `git merge` itself, which is the path
that matters most and the one a careless change here would break silently.

Measured on the real line: 28,240 groups parsed (was 1), 34 distinct, union to 34
groups / 41,036 bytes, a **99.84%** reduction, every distinct annotation preserved.

**Proven to catch, and the two halves catch separately — which is the point, since a
single reverted thing proving a single red tells you less:**

| reverted | cases that go red |
| --- | --- |
| the TOOL only (repaired data kept) | **5** — the unclosed-paren split, the one-group demonstration, the no-whole-blob fold, the first-list dedupe, the no-re-inflation property |
| the DATA only (fixed tool kept) | **3** — the pointer-line budget, the no-duplicate-segments check, the file budget |

Two of the cases reconstruct the old paren-balance parser verbatim and assert it
returns exactly ONE group and that a fold under it roughly doubles, so the gate is
shown capable of catching the defect rather than merely of passing beside it.

`npm run lint` exit 0. `npm run verify:gates` exit 0 with the ledger guard green.

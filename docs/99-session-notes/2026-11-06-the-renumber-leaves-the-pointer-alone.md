# 2026-11-06 — the renumber leaves the pointer alone

Narrative for **[DR-1362](../decisions/DR-1362-the-renumber-leaves-the-pointer-alone-and-says-when-it-cannot-fix-it.md)**.

## How it was found, and by whom

Not by me. The pm15 builder was told, as every builder is, to **read the renumber's diff before committing** — because the day before, the same tool had rewritten a sentence in an already-merged session note that was stating what the ledger pointer *had been* set to. It read the diff, and reported:

> **A finding on `renumber-decision-record.mjs`:** DR-1021 says it does not touch `**Next ID:**`. **It did** — the pointer's value happened to *be* the number being moved, so it rewrote it to `DR-1356`, naming my own record.

I did not take that at face value. I measured it on a fixture first:

```
$ node -e "rewriteText(index, {from:1355, to:1362, ...})"
**Next ID:** DR-1362. (and a note)        <- was DR-1355 on both counts
```

The report was exactly right. The tool's header has claimed the opposite since DR-1021: *"The pointer is left to resolve-ledger-conflicts.mjs, which already owns it."*

## Why it survived this long

Because the alignment that exposes it looks rare and is actually the normal one. The rewrite is a whole-file `DR-nnnn(?!\d)` replace over a file set that includes `INDEX.md`, so the pointer only moves when its value happens to equal the number being moved. That sounds like a coincidence. It is the standard case: a session reads the pointer, takes that number, discovers another session took it first, and renumbers off it — so the pointer is holding precisely the number in motion nearly every time the tool runs.

## And the case meant to pin it could not fail

There is a case called `leaves the pointer to the resolver that owns it`. It has been green all along. Its fixture:

```
**Next ID:** DR-1018. (DR-1016 = a-gospel-with-a-hole-in-it)
```

and it moves **1016**. The pointer's value is 1018, so the bare-id rewrite has no pointer number to match, and the assertion `expect(index).toContain('**Next ID:** DR-1018.')` holds whether or not the protection exists. A check written to prove the one thing that was broken, pinned on the single input where it cannot break.

That is the anti-theater failure DR-0076 §3 names, found inside a suite that is otherwise careful. The new case uses the input the old one avoided.

## The part I had to think about rather than patch

Holding the line back broke a different, pre-existing assertion: `expect(index).not.toContain('DR-1016')` — the whole INDEX must lose every mention of the moved id. With the pointer held back, the fixture's `(DR-1016 = a-gospel-with-a-hole-in-it)` survives.

The tempting fix is to rewrite the annotation too. I refused it, because the annotations on that line come in two shapes:

- `(DR-1344 was taken on 2026-11-05)` — **history**. Still true after the record moves. Rewriting it is yesterday's fault exactly: a true statement about the past, falsified because it contained a number.
- `(DR-1016 = a-gospel-with-a-hole-in-it)` — a claim about the **current state**. Goes stale.

A regex cannot tell them apart, and guessing is how the first one gets corrupted. So the line is held back and the mention is **reported**, which is the discipline this very tool already applies to an ambiguous bare citation: *"NOT rewritten … Read these and fix the ones that meant the moved record."* The pointer report now reads the same way, and says which shape to look for.

The stale assertion was narrowed to the rows rather than deleted, because the claim it was reaching for is true of the rows.

## Measured

- 32 cases before, **36** after; 62 with the resolver's suite beside it; lint clean.
- Proven to catch by deleting the one `skipLine` guard: **3 red**, including the new case that reads what `renumberInTree` actually *printed* rather than asserting the behaviour in prose. File restored byte-identical under `cmp`.
- **Not claimed:** that a renumber can no longer falsify prose. Every other line is still rewritten by number — right for a citation, wrong for a statement about a past value. `re-review: 2026-11-20`.

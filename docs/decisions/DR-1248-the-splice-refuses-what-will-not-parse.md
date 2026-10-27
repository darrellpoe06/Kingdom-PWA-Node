# DR-1248: The splice refuses what will not parse — it was lucky once, not right once

**Date:** 2026-10-27
**Status:** Accepted
**Amends:** DR-1244 (the catalog merge resolves itself, or it refuses)
**Pairs with:** DR-0076 (verification — §1 no claim without evidence, §3 proven to catch, §8 honest uncertainty), DR-0621 (hold the hand of the process)

## Context

DR-1244 made `scripts/splice-append.mjs` a repo tool on 2026-10-27: it resolves the "both sides appended one lesson" conflict by keeping both, computed from the three merge stages. Its design note is explicit that this needs **no parsing of the file at all** — the union of two pure insertions is exact prefix/suffix arithmetic.

That is true of the *union*. It is not true of the *result*. The one part of the output that is new is the **seam** between main's last lesson object and ours, and arithmetic says nothing about whether that seam is legal JavaScript.

On its second live use, it wasn't.

## What was measured

**The break.** Landing ll263 on top of ll262 (2026-10-27, after ll262 merged as `bff8c71e6`), the splice reported success in its usual words — *"kept both — 156 of our line(s) placed after main's, before a 50-line anchor"* — and wrote the file. The file emitted was:

```js
  }
  // ll263 - Not One Stone: Jesus' own prophecy over Jerusalem, fulfilled in AD 70 (research road, 2026-10-27)
  {
```

**No comma between the two lesson objects.** `app/src/lib/living-lessons-class.js` then failed to import at all: `SyntaxError: Unexpected token '{'` at line 25730. The file nominally held 260 lessons and the app could load **none** of them — a worse outcome than the conflict it replaced, because a conflict is visible and this was not.

**Why the first use passed.** One merge earlier, landing ll263 onto a main that did *not* yet have ll262, the identical code path produced a valid file, and its import verified clean at 259 modules. Whether the separating comma falls inside the common prefix or inside our extracted block depends entirely on where git happened to place the hunk boundary — which depends on which sibling landed first. **The tool was not right once; it was lucky once.** One success had already been recorded as evidence it worked.

**How it was caught — and the real finding.** Only because the verification line the tool itself prints, *"verify the catalog count and the lesson id before committing"*, was actually run. Had the figures been taken on the tool's own "spliced … kept both" report, a catalog that loads zero lessons would have gone to CI, and the lesson gates would have failed somewhere far from the cause.

A tool whose correctness depends on the operator remembering to check afterwards is not the brake it was written to be (DR-0076 §1). DR-1244's own contract already says what to do with a result it cannot stand behind: **refuse, write nothing, guess nothing.** That contract simply was not applied to the output.

## Impact — what this obligates, and the limits named rather than left

- **Every future lesson landing is affected.** ll264–ll267 are queued behind ll263 and each will splice against a main that now has a different last object. The same seam is recomputed every time, so the luck is re-rolled every time.
- **One prior landing was taken on the tool's word plus a count.** ll263's catalog has since been verified by import at 260 modules, highest ll263, 0 duplicates, gaps exactly the three pre-existing `[211, 212, 235]`, and 260 matching date entries. Nothing was lost; the comma was restored by hand in that branch, and the fix here is what stops the next one.
- **The refusal is now the behavior, not the repair.** The tool does not attempt to insert the comma. Synthesising the seam is the kind of guessing DR-1244 exists to avoid; a refusal hands a visible conflict back to a person, which is the outcome its design prefers.
- **Honest limit:** `node --check` is a *syntax* check. It cannot tell that a lesson lost an age band, that a verse was mangled, or that the result is semantically wrong — only that it parses. The band and verse gates remain the witnesses for that, and this does not relieve the verify-by-import step after a splice.
- **Honest limit:** if the check cannot be run at all, the tool refuses rather than writing. That trades an occasional false refusal for never writing an unverified file — an unverifiable result must not read as a verified one (DR-0076 §8).
- **Not claimed:** `main()`'s wiring is verified by reading it and by the stub case below, not by a test that drives a real conflicted merge through `git show :1:/:2:/:3:`. That harness does not exist yet. `re-review: 2026-11-10`.

## Decision

`syntaxFault(file, text)` runs `node --check` on the spliced text in a temporary file before anything is written, for `.js`/`.mjs`/`.cjs`/`.jsx` paths only. A fault is reported as a refusal in the tool's existing voice, naming the seam and the comma as the likely cause, and the file is left conflicted.

`spliceAppend()` stays pure — no I/O, no parsing — because that purity is what makes the union exact. The check lives in `main()`, at the write, which is the only place that can be wrong about reality.

`node --check` resolves no imports and executes no code, so this is cheap and side-effect free.

## Verification

- `splice-append.test.js` — **20 cases green** (16 existing, 4 added).
- **Proven to catch (DR-0076 §3):** stubbing `syntaxFault()` to return `''` reddens the suite with *"the broken seam read as fine: expected '' not to be ''"*. Restored, green.
- The regression case is the **real** ll262 → ll263 seam, not an invented one: two objects, a comment between them, no comma. It asserts both that the fault is reported and that the message names the comma, so a refusal points at the seam rather than leaving the reader to hunt line 25730.
- Paired case: the same two objects *with* the comma return `''` — so the check is not simply rejecting everything.
- A non-JS path (`.md`) and a valid dates map both return `''`: the check judges only what it can judge.
- An unclosed brace is caught as well as a missing comma, so the case is not pinned to one punctuation mark.
- `lint` exit 0.

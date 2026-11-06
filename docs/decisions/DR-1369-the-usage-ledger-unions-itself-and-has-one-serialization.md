# DR-1369 — The usage ledger unions itself, and has one serialization

**Date:** 2026-11-06
**Status:** Decided
**Narrative:** [2026-11-06 — the ledger unions itself](../99-session-notes/2026-11-06-the-ledger-unions-itself.md)
**Relations:** extends DR-0644 (the ledger files merge themselves) · serves DR-1347 (every record carries its cost line) · pairs DR-0103 (motion is the default) · DR-0076 §2, §3

## Context

DR-1347 made a cost entry MANDATORY on every record, so `ai-usage-ledger.json`
changes on every branch as `INDEX.md` does — and `resolve-ledger-conflicts.mjs`
would not touch it, so every landing dirtied every open branch and the catch-up
was by hand, in the place DR-0103 says must not stall.

## What was measured

**The same conflict set resolved by hand six times in one afternoon across nine
branches** — five by me, a sixth independently by the spm12 builder, which
reached the same union-by-`id` on its own. The cost is quadratic in branches.
A textual merge is no fallback: two appends to the end of `entries` produce
**one object carrying both ids**, which parses, reads plausibly, and is wrong.

A second cause is not a merge problem at all. Across eight landings the file
**oscillated between ESCAPED and LITERAL em-dashes** — `0,4,0,0,4,0,0,0` —
because `--add` writes literal UTF-8 while a session hand-writing the JSON
writes `\uXXXX` escapes. Four lines flip every other landing, so the file
conflicts on any branch created across a flip **even when both sides appended
only**.

## Impact

Unresolved, every landing taxes every open branch by hand and the fuse ships a
plausible wrong cost row. **What this obligates:** the resolver may union only
where keys cannot genuinely collide, and must refuse — writing nothing — where
they can. Limit: that refusal still costs a hand resolution, by design.

## Decision

1. **`ai-usage-ledger.json` is the third file the resolver owns**, unioned by
   `id` (main's order kept, ours appended), never merged as text.
2. **It REFUSES when the same id differs between the sides**, naming it. No
   rule can pick: keeping main silently dropped a correction to the `ll283`
   entry, and hours later main HELD that correction while the branches were
   stale, so keeping ours would have undone it — same wording, opposite right
   answer.
3. **One serialization on disk** — the one `--add` writes. `--check` fails on
   anything else and the resolver emits that form, so a resolution cannot
   reintroduce the flip.
A union is safe where DR-0644 made this resolver REFUSE two INDEX rows sharing
a DR number: that number is a scarce claim, so keeping one deletes a decision.
A usage entry is keyed by its **task id** — descriptive, not scarce.

## Verification

Each defect restored and the cases went red: folding a differing id silently
(2 failed); `canonicalFault` accepting whatever is on disk (2 failed);
`RESOLVED_FILES` without the usage ledger, the real pre-change state (2 failed,
end to end). The canonical check is fed the escaped shape that really landed at
`95227a28bd`; the live file passes. Verified afterwards on a real merge: 34
tasks ledgered, guards green. `re-review: 2026-12-06`.

# DR-1369 — The usage ledger unions itself, and has one serialization

**Date:** 2026-11-06
**Status:** Decided
**Narrative:** [2026-11-06 — the ledger unions itself](../99-session-notes/2026-11-06-the-ledger-unions-itself.md)
**Relations:** extends DR-0644 (the ledger files merge themselves) · serves DR-1347 (every record carries its cost line) · pairs DR-0103 (motion is the default) · DR-0076 §2, §3

## The measurement

DR-1347 made a cost entry MANDATORY on every decision record, so
`app/src/lib/ai-usage-ledger.json` now changes on every branch exactly as
`docs/decisions/INDEX.md` does. It was not in the set of files
`resolve-ledger-conflicts.mjs` will touch, so every landing on `main` dirtied
every open branch and the catch-up was by hand: **the same conflict set
resolved five times in one afternoon across nine branches.** That cost is
quadratic in open branches, and it is paid in the one place DR-0103 says must
not stall.

A textual merge is not a usable fallback here. Two sides each appending an
object to the end of `entries` produces **one object carrying both ids** —
which parses, reads plausibly, and is wrong.

A second cause was measured and was not a merge problem at all. Across the last
eight landings the file **oscillated** between `—` escapes and literal
em-dashes — `0, 4, 0, 0, 4, 0, 0, 0` — because `--add` writes literal UTF-8
while a session that hand-writes the JSON writes escapes, trying to be careful
about ASCII. Four lines therefore flip every other landing, which makes the
whole file conflict on any branch created across a flip **even when both sides
only appended**. Half the tax was a writer disagreement.

## The decision

1. **`ai-usage-ledger.json` is the third file the resolver owns**, unioned by
   `id` — main's order kept, ours appended — and never merged as text.
2. **It REFUSES when the same id differs between the sides**, naming it, and
   writes nothing. A two-sided append unions safely; a two-sided edit does not,
   and no rule can pick: on 2026-11-06 keeping main silently dropped a
   correction to the `ll283` entry, and hours later main HELD that correction
   while the branches were stale, so keeping ours would have undone it. Same
   wording, opposite right answer.
3. **The file has one serialization on disk** — the one `--add` writes.
   `ai-usage-ledger.mjs --check` now fails on anything else, and the resolver
   emits that form, so a resolution cannot reintroduce the flip.

Why a union is safe here when DR-0644 made the same resolver REFUSE two INDEX
rows sharing a DR number: a DR number is a scarce claim and two decisions
reaching for it is a real collision, so keeping one deletes a decision. A usage
entry is keyed by its **task id**, a slug of the work, which two branches never
pick by accident. That distinction is the whole licence for this change.

## Proven to catch (DR-0076 §3)

Each defect was restored and the cases went red:

- fold a differing id silently (what a hand did twice) → 2 failed
- `canonicalFault` accepts whatever is on disk (the state before this) → 2 failed
- `RESOLVED_FILES` without the usage ledger (the real pre-change state) → 2 failed, end to end

The escaped form is not invented: the canonical check is fed the shape that
really landed at `95227a28bd`, and the live file passes.

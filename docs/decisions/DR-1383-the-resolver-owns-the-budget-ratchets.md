# DR-1383 — The resolver owns the budget ratchets, and still never sets a ceiling

**Date:** 2026-11-10
**Status:** Decided
**Narrative:** [2026-11-06 — ConnectBot cannot reach this one](../99-session-notes/2026-11-06-connectbot-cannot-reach-this-one.md)
**Relations:** extends DR-1369 (the resolver owns the derived files) · keeps DR-0644's refusal · obeys DR-1362 §2 (report a stale mention, never rewrite it) · DR-1342 · DR-1339 · DR-0076 §3

## Context

`scripts/resolve-ledger-conflicts.mjs` settles the three derived files every
branch dirties. Two more conflict on every landing and were not in it:
`scripts/workflow-budget.json` (DR-1342) and `scripts/file-budgets.json`
(DR-1339). Both were resolved by hand today; `keep-prs-current` calls them
"the owner's call".

## What was measured

They are not the owner's call. A raise entry is a **link in a chain** — `from`
the ceiling before a change, `to` after — so when both sides branch from the
same `from`, a plain union leaves two entries claiming one predecessor and a
ceiling counting only one change. On #2582: ours said `22413 → 22659`, main had
added `22413 → 22416`, and `22659 < 22416 + 246`. Main's three lines vanish.

What survives a merge is the **delta**, not the numbers. The file already
records that re-basing done by hand twice, in its own prose (*"First written as
22413 → 22659 against the main of the hour… the same change is 22416 → 22662"*).
Only the arithmetic was manual, and right because the numbers were small.

## Decision

The resolver unions the append-only `raises` and re-bases **our** new entries
onto the chain main actually has, keeping each delta. `file-budgets.json` chains
**per file**, so re-basing groups by `file` and a file main never touched does
not move. A subject with no predecessor *and* no ceiling in main is one main has
never seen, so ours stands unchanged — evidence, not a guess.

**It still never sets a ceiling.** It leaves the ceiling at what the chain
predicts, runs each guard's own `--generate` — both down-only (`Math.min` in
`workflow-register.mjs`, `regenerate` in `file-budget-guard.mjs`) — and lets
each guard's own check judge. The measurement is never reimplemented, a ceiling
rises only by what a raise entry explains, and an unexplained rise is
**REFUSED** carrying the guard's own message, which asks for the human reason a
raise needs. Inventing a ceiling is the one thing that would make this resolver
dangerous, since every open branch's resolution runs through it. It also refuses
a rewritten history, a non-numeric `from`/`to`, and a one-sided add or delete.

**Prose is reported, never rewritten.** A re-based entry's `reason`/`why` may
still recite the pre-merge numbers; the resolver prints old and new and says a
tool must not rewrite prose by number — the fault DR-1362 §2 records.

## Verification

11 checks, fed the break each exists to stop (DR-0076 §3): the naive concat is
shown to drop main's three lines before the re-base is shown to keep them. The
fixtures are the **real** numbers of 2026-11-06 — DR-1374's `22413 → 22659`
landing on `22416 → 22662`, DR-1363's `22396 → 22399` landing on `22413 →
22416` — so they assert what two hand resolutions settled on, not what the code
happens to do. The down-only premise is proven, not asserted: `regenerate`
lowers 100→90 and refuses 100→120. One check expected a refusal and the **code**
was wrong, not the test; a failing check is where the work starts (DR-0621).

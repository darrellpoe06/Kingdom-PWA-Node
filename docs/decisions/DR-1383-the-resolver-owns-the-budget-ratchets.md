# DR-1383 — The resolver owns the budget ratchets, and still never sets a ceiling

**Date:** 2026-11-10
**Status:** Decided
**Narrative:** [2026-11-06 — ConnectBot cannot reach this one](../99-session-notes/2026-11-06-connectbot-cannot-reach-this-one.md)
**Relations:** extends DR-1369 (the resolver owns the derived files) · keeps DR-0644's refusal · obeys DR-1362 §2 (report a stale mention, never rewrite it) · DR-1342 · DR-1339 · DR-0076 §3

## Context

`scripts/resolve-ledger-conflicts.mjs` settles the three derived files every
branch dirties. Two more conflict on every landing and were not in it:
`scripts/workflow-budget.json` (DR-1342) and `scripts/file-budgets.json`
(DR-1339), both resolved by hand today; `keep-prs-current` calls them
"the owner's call".

## What was measured

They are not the owner's call. A raise entry is a **link in a chain** — `from`
the ceiling before a change, `to` after — so when both sides branch from the
same `from`, a plain union leaves two entries claiming one predecessor and a
ceiling counting only one change. On #2582: ours said `22413 → 22659`, main had
added `22413 → 22416`, and `22659 < 22416 + 246`. Main's three lines vanish.
What survives is the **delta**, which the file's own prose already records
re-based by hand twice. Only the arithmetic was manual.

## Impact

Every branch touching a workflow or growing a budgeted file hits this, so the
cost is quadratic in open branches — and a hand that gets the arithmetic wrong
LOWERS a ratchet silently, which is the failure that matters: a ceiling nobody
raised on purpose stops meaning anything. **What this obligates:** the chain is
re-based mechanically, and the ceiling stays the guards' to measure.

## Decision

The resolver unions the append-only `raises` and re-bases **our** new entries
onto the chain main actually has, keeping each delta. `file-budgets.json` chains
**per file**, so re-basing groups by `file` and a file main never touched does
not move. A subject with no predecessor *and* no ceiling in main is one main has
never seen, so ours stands unchanged — evidence, not a guess.

**It still never sets a ceiling.** It leaves what the chain predicts, runs each
guard's own `--generate` — both down-only (`Math.min` in `workflow-register.mjs`,
`regenerate` in `file-budget-guard.mjs`) — and lets each guard's check judge. The measurement is never reimplemented, and an
unexplained rise is **REFUSED** carrying the guard's own message, which asks for
the reason a raise needs. Inventing a ceiling is the one thing that would make
this resolver dangerous, since every branch's resolution runs through it. It
also refuses a rewritten history, a non-numeric `from`/`to`, and a one-sided add
or delete. **Prose is reported, never rewritten** — rewriting prose by number is
the fault DR-1362 §2 records.

## Verification

11 checks, fed the break each exists to stop (DR-0076 §3): the naive concat is
shown to drop main's three lines before the re-base is shown to keep them. The
fixtures are the **real** numbers of 2026-11-06 — DR-1374's `22413 → 22659`
landing on `22416 → 22662`, DR-1363's `22396 → 22399` landing on `22413 → 22416`
— so they assert what two hand resolutions settled on, not what the code happens
to do. The down-only premise is proven. One check expected a refusal and the
**code** was wrong, not the test (DR-0621).

# DR-1136: No branch gate can see a number two branches both claim — and my own fix for it was about to be the third collision

**Date:** 2026-10-20
**Status:** accepted
**Tier:** A (a record and a dated commitment; no code, no schema, no policy, no renumber — the instance was already repaired on main by another session)
**Type:** way

**Area:** `docs/decisions/` (this record only). Deliberately no renames and no citation edits: see **Decision**.

**Principles:** DR-0644 (the resolver REFUSES a collision rather than folding it, written after folding silently DELETED two real decisions on 2026-10-06); DR-1021 (the fourth renumber by hand became a tool); DR-0076 §7 (independent verification); DR-0107 (do not change the merge lane without proving the deploy); DR-0075 (a non-improvement carries a why and a date); DR-0111 (do the work — this record is the work, not a request to do it).

## Context

`main` went **red** at `e8fc20407`. `business-systems-guard`, which runs inside `verify:gates` on every push and on main:

```
business-systems-guard: FAIL
  - INDEX.md has DR-1131 as a row twice — a merge kept both sides' copy.
```

Two different decisions held **DR-1131** at once:

| record | merged as | at |
|---|---|---|
| `…work-beside-learning-is-apostolic-…-sov43.md` | #2298 | `4fb979361` |
| `…the-voice-is-listened-to.md` | #2299 | `e8fc20407` |

Two sessions' branches, merged minutes apart. A third branch — #2300, mine, still open — was holding DR-1131 too, which would have made three.

**No branch gate could have caught it, and that is the finding.** Each branch carried exactly ONE record numbered DR-1131, so the guard was green on each one **correctly**: the ledger *on that branch* was whole. The duplicate exists only in the union of the branches, and the union exists only after the second merge. The brake fired at the first moment it could and not one moment earlier. Each PR's **title** also named a stale number (#2298 said DR-1129), which is noise — the FILE is the claim.

## What was measured

Measured on a tree at `origin/main` `e8fc20407`, then again at `3d345746c`.

| | |
|---|---|
| `business-systems-guard` at `e8fc20407` | **FAIL, real exit 1** |
| records numbered DR-1131 there | **2** |
| `**Next ID:**` there | DR-1133 |
| bare `DR-1131` citations `renumber-decision-record.mjs` refused to rewrite | **17 across 13 files** |
| … that meant the record it would have moved | 11 across 8 files |
| … that meant the record that would have stayed | **6 across 5 files** |
| `business-systems-guard` at `3d345746c` | **OK — ledger whole (newest DR-1134, pointer correct)** |

**Two measurement errors of mine, both the kind this ledger keeps recording.**

1. **I read a failing guard as passing.** My first run piped it through `tail`, so the shell reported `EXIT=0` for a guard that exits `1` — the *pipeline's* status, not the guard's. Re-run without a pipe it is 1. **A guard read through a pipe can look green while failing.**
2. **I measured `main` once and then acted for forty minutes as though it had not moved.** It had: while I was repairing the collision, another session repaired the same collision the other way and merged it as #2303.

## Decision

**The instance is already fixed on `main`, by another session, and that resolution stands.** At `3d345746c`:

- `DR-1131` = the voice clarity witness — **stayed**
- `DR-1133` = a research tier weighed by rigor, not money — **new**
- `DR-1134` = week 43 / sov43 — **moved**
- pointer `DR-1135`

**My own fix was about to become the third collision, and that is why this record exists at all.** On a branch off the red `main` I had renumbered the opposite record — the voice witness to DR-1133 — and taken DR-1134 for this record. Both of those numbers now belong to *different* decisions on `main`. Merging my repair would have re-broken the exact thing it repaired, with two duplicates instead of one. **The failure recurred inside the fix for it, against a branch that was green, in under an hour.** Nothing in my branch was wrong when I wrote it; `main` simply moved, which is the whole shape of the defect.

**So this branch keeps nothing but this record.** It was reset onto `3d345746c` and every rename and citation edit was dropped — not softened, dropped. The house rule is that the resolver refuses rather than folds (DR-0644) precisely because two plausible repairs of one collision can each destroy the other's. Where another session's repair is already merged and green, the second repair is the one that yields.

**This record takes DR-1136**, above `main`'s pointer of DR-1135, which my own #2300 claims.

## Impact

**What is actually gained:** the class is now written down. Their commit fixed the instance; nothing recorded *why no gate could have stopped it*, that merge order is the only tiebreak both sides agree on, or that a second repair must yield to a merged one. The next session to find two records on one number has a page to read instead of a judgment call to re-derive — and the warning that its own fix can be the next collision.

**What this does NOT do, with a why and a date.** It does not **prevent** the next collision. The preventive check is nameable: *refuse a PR whose new record number is already claimed by `main` or by another OPEN pull request.* It needs the open-PR list at CI time — a token, rate limits, fork behaviour — **inside the merge lane**, and DR-0107 forbids shipping a change to that lane without proving the site still deploys. Coupling that proof to a one-file record would be the wrong trade, and today already proved the lane is live and busy.

**`re-review: 2026-10-27`** — build the claimed-number check, or say why not. The measured cost it would have saved today: one red `main`, two competing repairs, and a renumber on a third branch.

Until then the protection is exactly what worked: the guard fails `main` loudly within minutes, `resolve-ledger-conflicts.mjs` refuses rather than folds, and `renumber-decision-record.mjs` makes the move a tool. The cost of a collision is a renumber, never a lost decision — which is the entire reason DR-0644 was written.

## Verification

`business-systems-guard` on `3d345746c`: **OK — ledger whole (newest DR-1134, pointer correct)**, read **without a pipe**, which is the correction above.

With this record added and the pointer at DR-1137: `business-systems-guard` **OK**, `npm run lint` exit 0, `npm run verify:gates` exit 0, `decision-chain.test.js` green (this record carries all five sections).

**Independent of my own account of it (DR-0076 §7):** the repair I am deferring to is readable in `main`'s own tree — `git ls-tree origin/main docs/decisions/` lists `DR-1131-the-voice-is-listened-to.md`, `DR-1133-a-research-tier-weighed-by-rigor-not-money.md` and `DR-1134-work-beside-learning-…-sov43.md`, and the pointer reads DR-1135. The claim that `main` was red is likewise reproducible: restoring a second `DR-1131` row makes the guard print the same sentence and exit 1.

**The limit stated plainly:** nothing here makes a collision impossible, and this record does not claim otherwise. It makes it cheap, loud and recoverable, says who yields when two repairs race, and dates the check that would make it impossible.

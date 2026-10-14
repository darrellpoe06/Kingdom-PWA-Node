# DR-1020: The fourth renumber by hand is a tool — and DR-0644's refusal keeps its teeth

**Date:** 2026-10-14
**Status:** accepted
**Tier:** A (additive tooling; it changes no existing gate, no existing guard and no ledger convention — the thing it automates was done four times by hand today with a throwaway one-liner)
**Type:** orchestration
**Area:**
- `scripts/renumber-decision-record.mjs` (new; `planRenumber` / `rewriteText` / `renumberInTree`, plus a CLI)
- `app/src/__tests__/renumber-decision-record.test.js` (new; 17 tests, the refusals checked harder than the happy path)

**Amends:** nothing. **DR-0644's refusal is deliberately left exactly as it is** — see the Decision.
**Grounds:** DR-0075 (recurring friction becomes a fix, or a why plus a date), DR-0236 (what is buildable now is built now), DR-0076 (proven-to-catch, measured against the real case), DR-0644 (its error message already names the remedy this performs)
**Declared by:** the fourth hand-renumber of 2026-10-14

## Concern

On 2026-10-14 a single session moved a decision record off a number another session had taken **four times**:

| moved | why | chosen |
| --- | --- | --- |
| DR-1003 → 1004 | main's #2153 took 1003 | by hand |
| DR-1013 → 1016 | main took 1013 and 1014 while the branch sat under four vitest shards | by hand |
| DR-1016 → 1019 | #2165 merged and took 1016 | by hand |
| DR-1017 → 1018 | an unmerged branch already claimed 1017 | by hand |

Every one is the same four edits — rename the file, relink its INDEX row, rewrite every citation of the old id, leave the pointer to the resolver — and every one was done with a throwaway Python one-liner written on the spot. That is the recurring friction DR-0075 says becomes a fix rather than a cost paid again, and the fourth repetition in one afternoon is where it stops being a coincidence.

The underlying cause is structural and is NOT fixed here: `INDEX.md`'s `**Next ID:**` pointer is a single line in a shared file, so two sessions reading it at the same moment both believe the same number is free. Nothing in a pointer can prevent that.

## Evidence

**What the collisions actually cost.** Not the rename itself — minutes — but the compounding: each renumber invalidated an already-verified tree, so the gates, the dates derivation and the affected suites were re-run on the new base. ll79's record was renumbered twice and its branch took **three** base merges before it settled.

**The guard worked every single time, and that is the part not to break.** `resolve-ledger-conflicts.mjs` refused each collision by name — *"two different decisions claim DR-1013 — DR-1013-a-gospel-with-a-hole-in-it.md and DR-1013-every-door-has-a-map-and-the-pin-names-its-street.md. This is a number collision, not a duplicate row, and folding them would delete one decision from the ledger."* DR-0644 made it refuse precisely because folding **silently deleted a real decision twice on 2026-10-06** (DR-0762 vault vs L213, DR-0756 cameras vs the reader). A refusal that names both files and the number to use instead is the correct behaviour and is left untouched.

**Verified against the real case rather than only a fixture.** Run against main at `4c165026b`, which holds DR-1010 through DR-1018, the tool is asked the same question the session answered by hand — where must a record move if it is sitting on 1016? It answers **1019**, independently reaching the number chosen manually. Asked to move onto 1018 it refuses and names the file holding it: *"DR-1018 is already held by DR-1018-shyness-can-be-pride.md."*

## Impact

- Unresolved: the fifth collision costs the same as the first four, and the manual edit is done under time pressure on a verified tree, with a one-liner nobody reviews. The failure mode that worries me is not a wrong number — the guard catches that — but a **missed citation**, leaving a live reference to a number another decision now owns.
- The call obligates: the tool must refuse every case where it could lose a record or create the collision it exists to clear, and must change nothing at all on the way to refusing.

## Decision

1. **`renumber-decision-record.mjs` performs the rename DR-0644's own message already prescribes.** It renames the file, rewrites the record's `# DR-nnnn:` heading, relinks the INDEX row, and rewrites every citation across `docs/`, `app/src/`, `scripts/`, `infra/` and `.github/` — the citation guard's scope plus `docs/`.
2. **DR-0644's refusal keeps its teeth.** `resolve-ledger-conflicts.mjs` is NOT modified. It still refuses a collision rather than folding it, for the reason it already states. Making the resolver renumber by itself would put an automatic rename inside the step that runs during a merge, which is exactly where a mistake is least visible; the operator runs this, reads what it renamed, then runs the resolver.
3. **It refuses four ways and changes nothing when it does:** a target number any file already holds (the whole point is to leave a collision, not make one); a source number no file holds; a source two files hold (the ledger is already broken and a person reads those two); and a dirty working tree for the files it would rewrite, unless `--force`, so the rename is reviewable on its own.
4. **It does not touch the pointer.** `resolve-ledger-conflicts.mjs` owns `**Next ID:**` and computes it from the files on disk; two things computing one line is how they drift.

Not done, and said plainly: **this does not stop collisions, it only makes the cure cheap.** The cause is a single shared pointer line, and the fixes that would actually prevent a collision — minting from a monotonic source, or deriving the id at merge time from the files on disk — change a convention every session and every past record depends on, which is a Governor's call and not a tooling change. `re-review: 2026-10-21` — count the collisions in the week; if the rate holds, that convention change is the next conversation.

## Outcome

- **17 tests green.** The refusals carry the weight: a held target, a missing source, a doubly-held source, a no-op, and the whole rename run in a real temporary tree with the file count asserted unchanged so nothing can be deleted.
- **Proven to catch, twice, on things that would really happen:** `rewriteText` must not match inside a longer number (a naive replace turns `DR-10160` into `DR-10190`, and the ledger reaches five digits eventually); and renumbering onto a held number is refused with the tree asserted untouched afterwards.
- **Verified on the live ledger**, not only on fixtures: against main's real `docs/decisions`, the tool independently chose 1019 for a record sitting on 1016 — the number the session chose by hand — and refused 1018 by naming `DR-1018-shyness-can-be-pride.md`.
- 20 gates green; lint clean.
- This record takes **DR-1020** rather than main's pointer value of 1019, because the held PR #2166 already carries DR-1019 in its pushed files. The tool's own subject, applied to itself.

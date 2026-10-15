# DR-1024: The duplicate check is a tool — and a bare day proves nothing

**Date:** 2026-10-14
**Status:** accepted
**Tier:** A (additive finder; it writes nothing, decides nothing, and changes no existing gate)
**Type:** orchestration
**Area:**
- `scripts/lesson-already-built.mjs` (new; `distinctiveTerms` / `dateForms` / `bareDay` / `scoreFile` / `findAlreadyBuilt`, plus a CLI)
- `app/src/__tests__/lesson-already-built.test.js` (new; 16 tests, two of them reproducing this tool's own first defect)

**Amends:** nothing. DR-0610's rule is unchanged; this is the check it already asks for, made mechanical.
**Grounds:** DR-0610 (one teaching, one lesson), DR-0075 (recurring friction becomes a fix), DR-0076 (a right answer on worthless evidence is still a failure), DR-0236 (buildable now, built now)
**Declared by:** the second hand-run of the same catalog check in one afternoon

## Concern

DR-0610 says one teaching, one lesson, and the Gmail intake routine enforces it by having the agent search the lesson catalogs and the ledger **by hand on every firing** — three firings a day, for as long as a thread sits unlabelled. On 2026-10-14 the same thread was checked by hand on two consecutive ticks: the ByteByteGo positional-encoding article, forwarded 2026-10-13 at 17:54 UTC, already built as `sov39` under DR-1005. Four steps each time — catalog grep, ledger grep, read the provenance line, compare the forward instant — and the same answer both times.

The routine's own text records what that check is worth. On 2026-10-11 a broken `-label:Label_22` exclusion returned 12 threads that were **every one already captured**, and taken at face value that firing "would have built TWELVE DUPLICATE LESSONS." The catalog check is what stands between a stale label and twelve duplicate lessons in the congregation's app, so it should be a tool rather than a habit.

## Evidence

**Why the check keeps running at all.** A thread stops resurfacing when `Label_22` lands on it. That write is currently blocked by a harness permission gate — two attempts returned `MCP tool call requires approval`, and retrying through a different Gmail tool to obtain the same effect would be evading a denial rather than adjusting to one. So the label is not available to this session, the thread resurfaces every tick, and DR-0610's check is the only thing preventing a duplicate each time. This record does not fix the label; it makes the thing that actually protects the app cheap and repeatable.

**THE DEFECT THIS TOOL HAD, found by running it on the real case rather than on a fixture.** The first version accepted a **bare day** as its strongest signal. Run against the live tree it answered `ALREADY BUILT` — the right verdict — on the strength of `2026-10-13` appearing in **dozens of unrelated records that merely mention that date**, while DR-1005, the one true match, did not make the top eight. That is the looks-fine-but-isn't failure DR-0076 exists to stop, and it is worse than a wrong answer: it teaches the next reader to trust a coincidence, and the next forward that happens to share a busy date would read as settled.

A bare day is now **not a timestamp match at all**. It counts only alongside the source name, and that pair is its own lesser strength. Re-run after the fix, the same query returns one timestamp hit and the right one: `DR-1005-order-carries-meaning.md — timestamp "2026-10-13 at 17:54" — names sov39-verses`, ranked above every date collision.

**The strengths, in descending confidence, and why each is ranked where it is.**

| strength | what matched | why that rank |
| --- | --- | --- |
| `timestamp` | the day AND the time, as a provenance line writes it | a minute is effectively unique to one forward |
| `source+day` | the publication, and the date somewhere in the same record | strong, but reachable by coincidence on a busy date |
| `source` | the publication alone | a publication forwarded twice is two teachings |
| `terms` | uncommon words of the subject | weak; reported with its hit count so a reader can weigh it |

**Deliberately biased toward reporting.** A false "maybe this is already built" costs one read. A missed match costs a duplicate lesson in the congregation's app. So a weak signal is reported rather than suppressed, and the verdict names its own strength instead of claiming certainty it has not got.

## Impact

- Unresolved: the DR-0610 check stays a four-step manual habit run three times a day, and the one time it is skipped or hurried is the firing that ships a duplicate — which is the failure the routine already measured at twelve.
- The call obligates: the finder must write nothing, decide nothing, and never claim a strength its evidence does not carry. The defect above is the proof that last clause needed a test rather than an intention.

## Decision

1. **`lesson-already-built.mjs` performs the DR-0610 search and reports.** Given a subject, a source name, and the forward instant, it searches `docs/decisions/*.md` (where provenance is actually recorded) and the `*-class.js` catalogs (where a source is named in the lesson text), and prints every hit with its strength, what matched, and which lessons that file names.
2. **A bare day is never a timestamp match.** Only a day-and-time form counts. The bare day is available separately and only strengthens a source match.
3. **It writes nothing and fails nothing.** It exits 0 whatever it finds, because it is a finder and not a gate: DR-0610's judgement stays with the agent or the person, who now reads an answer instead of assembling one.
4. **DR-0610 is unchanged.** Its rule — search before building, report a comparison, build nothing new if one exists — is exactly what it was. This is the search, not a new policy.

Not done, and said plainly: **this does not stop the thread resurfacing.** Only the `Label_22` write does that, and it is behind a permission gate this session cannot clear. `re-review: 2026-10-21` — if that label is still unwritten, the thread will have resurfaced roughly twenty more times, and the question becomes whether the Gmail lane needs a repo-side record of what has been captured rather than relying on a label in a mailbox.

## Outcome

- **16 tests green.** Two reproduce this tool's own defect: `dateForms` asserted never to return the bare day, and the old scoring reproduced to show the unrelated same-day record reading as `timestamp` — then the same text scored the new way, returning nothing at all.
- **Verified on the live tree, which is where the defect was found:** the real query now returns `ALREADY BUILT` with `DR-1005` as the sole timestamp hit, naming `sov39`, ranked above the date collisions that previously buried it.
- The decoys are in the fixture on purpose: an unrelated record sharing the day, and the same publication on another day. A tool that cannot tell those apart is the tool that ships a duplicate.
- 20 gates green; lint clean.

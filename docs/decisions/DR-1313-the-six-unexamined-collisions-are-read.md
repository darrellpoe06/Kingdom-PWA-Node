# DR-1313: The six unexamined collisions are read — three were never duplicates, one was a recovery record claiming what it recovered, and two are one teaching built twice

**Date:** 2026-11-05
**SUPERSEDED IN PART BY [DR-1317](DR-1317-a-verse-is-never-spent-and-overlap-is-how-lessons-connect.md) (2026-11-05):** this record’s central conclusion — that `1a11668e8023cd3e` (ll215/ll239) and `1a11be8ea0e58748` (ll223/ll238) are **duplicates**, "one teaching built twice", awaiting a fold — **is WRONG**, and Darrell corrected it the same day: *"there would be overlapping at times however not the exact same lesson... 8 points of this lesson does not end with the same message it’s close however another point entirely after explaining the foundations of the eternal systems Yahweh created in us and outside of us... How else would they connect?!"* and *"How can we have only reference one scripture ever?! Doesn’t make any sense!"* **A verse is never spent, and "one teaching" is decided by WHERE A LESSON LANDS, never by the ground it stands on.** Both pairs share a foundation and carry it to different points, which is the catalog connecting to itself. `EXAMINED_AWAITING_FOLD` is removed. What stands in this record: the three cleared collisions, the DR-1051 declaration, and the measurement that the title clause must stay. Read DR-1317 before relying on anything here about duplicates.
**Status:** Accepted
**Tier:** B (one intake guard, one ledger record's front matter, and the suite that governs them; no product code, no schema, no money — but it changes what the lane calls a duplicate, and two of Darrell's teachings are named as duplicated)
**Type:** verification
**Area:** `scripts/one-thread-one-record-guard.mjs` (`UNEXAMINED_BASELINE` emptied, three comparisons added to `KNOWN_SHARED_THREADS`, new `EXAMINED_AWAITING_FOLD`, `RECORDED` widened, verdict line rewritten) · `docs/decisions/DR-1051-the-ledger-names-the-thread-it-was-built-from.md` (gains its declaration) · `app/src/__tests__/a-record-that-considered-a-thread-does-not-claim-it.test.js` (+8 cases, 22 total)
**Found by:** the agent, on an idle turn between lesson builds, following the guard's own dated instruction rather than waiting for its date.
**Considered, not built:** `1a11668e8023cd3e`, `1a11be8ea0e58748`, `1a11be8188dbc2f6`, `1a135f165fe391e3`, `1a135b7ba6605c98`, `1a13f985bb4d2a79`, `1a13feefef705fa7`, `1a0a5a12db9c6a62`, `1a0a5a4e540b4fde` — this record builds no lesson and has no source thread of its own. It names these nine as the measured evidence below. Who really built each: `1a11668e8023cd3e` is ll215 by **DR-0793** and ll239 by **DR-0863** (the duplicate pair); `1a11be8ea0e58748` is ll223 by **DR-0834** and ll238 by **DR-0864** (the second duplicate pair); `1a11be8188dbc2f6` is ll221 by **DR-0821** and ll236 by **DR-0860** (the control, not a duplicate); `1a135f165fe391e3` is sov39 by **DR-1005**; `1a135b7ba6605c98` by **DR-1004**; `1a13f985bb4d2a79` by **DR-1049**; `1a13feefef705fa7` by **DR-1048**; and the two `1a0a5a…` threads by the World Issues entries **DR-0412** through **DR-0416**.
**Pairs with:** DR-1285 (the guard, whose own note set this date), DR-1305 (the declaration this uses, and the fault it found twice before), DR-1185 (one teaching one lesson, and the fold precedent), DR-0610 (the rule — one TEACHING, not one SOURCE), DR-1250 / DR-1270 / DR-1288 (the sweep this protects), DR-0312 (the Gmail lane), DR-0236 (nothing waits), DR-0076 (§1 evidence, §3 proven-to-catch, §4 measure don't claim, §8 honest uncertainty), DR-0621 (a flag is where the work starts)

## Context

`one-thread-one-record-guard.mjs` fails the build when two decision records name one source thread and the ledger has not recorded the pair. It shipped with six collisions already in the ledger and, by its own admission, **not one of them investigated**. They sat in a shrink-only `UNEXAMINED_BASELINE` with a note that is unusually honest about why:

> *"a record may legitimately name several threads (a batch record does), so some of these are probably not duplicate lessons at all — but saying which would require reading six pairs of records, and asserting they are fine without reading them is precisely the hollowing-out this file exists to prevent."*

And an instruction with a date: `re-review: 2026-11-28` — *"read the six pairs below and move each one either into KNOWN_SHARED_THREADS with a comparison, or out of the ledger as a genuine duplicate for Darrell to fold."*

They were read on 2026-11-04, twenty-four days early, because the reading was available now (DR-0236). The answer was not one answer. It was three.

## What was measured

**Three were never duplicates, and two of those are not even lessons.**

`1a0a5a12db9c6a62` (DR-0412+0413+0416) and `1a0a5a4e540b4fde` (DR-0412+0413+0414+0415) are shared by five records that are all `**Type:** word` — World Issues entries 12 through 16 — on five entirely distinct subjects: the EPA unwinding the power-plant carbon rules, the Supreme Court leaving the mail-in rules alone, the Kennedy Center and whose name goes on the house, Evanston's reparations and the equal-protection suit, and the non-degree job market. One forward carried several items and each became its own entry. `a30e4942e161b7833c6cef051b8ab6fd` (DR-0711+0739) is two **corrections to one lesson**, L202 — one giving the session its speakers, one `**Type:** defect` giving Deacon Palmer his words and the class its true count. That id is also 32 hex characters, a recording row rather than a Gmail thread, so the forward reasoning never applied to it at all.

**One healed at the cause, and it is DR-1305's fault a third time.** `1a135f165fe391e3` was named by DR-1005 and DR-1051. DR-1051 is `**Type:** orchestration`: it built a guard and no lesson, and it names that thread — along with `1a135b7ba6605c98`, `1a13f985bb4d2a79` and `1a13feefef705fa7` — only because it **recovered those ids into the records that really built them**. A record written to catch a ledger that fails to name its source was itself being read as claiming four sources it had merely rescued. It now carries the declaration, and all four threads still read `SHIPPED` through DR-1005, DR-1004, DR-1049 and DR-1048 respectively.

**Two are real, and they are Darrell's own sends taught twice.** Measured with the catalog's own rule — `sharedGround` from `one-teaching-one-lesson.js`, which expands verse ranges before comparing:

| thread | lessons | shared verses |
|---|---|---|
| `1a11668e8023cd3e` (2026-10-07 12:48 UTC) | ll215 (DR-0793, 10-07) / ll239 (DR-0863, 10-09) | **13** |
| `1a11be8ea0e58748` (2026-10-08 14:26 UTC) | ll223 (DR-0834) / ll238 (DR-0864, 10-09) | **14** |

ll215 and ll239 share the whole Luke 14:28-32 counting-the-cost core and both titles close on *who gives the safety*. ll223 and ll238 share Mark 4:37-39, Psalms 107:28-29 and all of Matthew 7:24-27.

**Why the shipped rule is silent on both, and why that is not a bug to rip out.** The rule is an AND of three conditions: the same course, the same three-word title opening, and ≥10 shared verses. Both pairs satisfy the first and the third and fail the second. The obvious fix — drop the title clause — was measured and is **wrong**: across 44 courses and 712 lessons it flags **146 pairs** at the shipped threshold of 10 (80 at 12, 32 at 15, 6 at 20), because Luke 14 on counting the cost and the Proverbs on just weights are reused across lessons as the curriculum working. A gate that cries wolf is deleted within a day (P46). The clause earns its place.

**The discriminator is the SOURCE, and it is a ledger fact rather than a heuristic.** Same course **and** the same source forward **and** substantial shared ground. Sharing a source *and* the ground is not a theme recurring; it is one send taught twice.

**And a fourth pair from the same run is the control that proves the rule does not over-flag.** `1a11be8188dbc2f6` produced ll221 *"Owning the Light Instead of Renting It"* (DR-0821) and ll236 *"The Bill You Cannot Read"* (DR-0860) from one utility-billing forward, and they share **exactly one** verse. Two genuinely different teachings from one source, which DR-0610 permits — its rule is one TEACHING, one lesson, never one SOURCE, one lesson.

## Impact

**The guard's debt is zero and its remaining flags are true.** It reported six unexamined pairs; it now reports six examined and cleared, two measured duplicates, and nothing unexamined. A baseline that says "unexamined" about work that has been examined is a surface telling a reader something untrue, which is the same fault corrected in the evictions pin hours earlier — so the two duplicates did not stay under that heading. They moved into `EXAMINED_AWAITING_FOLD`, which is neither debt nor a false positive: it is a measured finding parked on the one decision that is genuinely the Governor's.

**Two of Darrell's teachings are duplicated on a COLG-facing surface, and that is now written down instead of merely suspected.** Nothing here folds them. DR-1185's precedent is to fold — ll235's four verses and two parables were carried into ll257 before ll235 was removed, so nothing was lost — but that is editorial work on his own teaching across six lessons, and this record says so rather than acting.

**A measured duplicate is RECORDED, not NEW.** If the pairs failed the build every run until he decided, the lane would stop, so they are treated as recorded and **printed loudly on every single run** instead. The alternative — silence until a date — is how a gate stops meaning anything.

**And the method generalises, but its input does not exist yet.** The source-plus-ground rule needs a machine-readable statement of what each record was built from. The ledger states provenance four different ways — `**Intake:**` (5 records), `**Sent in by:**` (10), `**Grounds:**` (15) and **prose only (30)** — so the rule cannot be automated today. Two separate attempts to infer it from prose produced 35 false positives and then 6. Not built here; named.

## Decision

**1. The six are read and the baseline is empty.** Three move into `KNOWN_SHARED_THREADS` with comparisons that state what was read and what was not. One is healed at the cause by DR-1051's declaration rather than absorbed into a list, because recording a pair that should not exist is worse than the pair.

**2. `EXAMINED_AWAITING_FOLD` holds the two real duplicates** with their lessons, their thread, their shared-verse count and their comparison; `RECORDED` includes them so the lane stays green; the verdict line names them every run.

**3. The title clause stays.** Measured, not assumed: removing it flags 146 pairs where the shipped rule flags none.

**4. The fold is Darrell's.** The gate never folds a lesson, and this record does not recommend which of each pair survives.

## Verification

`app/src/__tests__/a-record-that-considered-a-thread-does-not-claim-it.test.js`, **22 cases green** (8 new), run from inside `app/` — the only correct invocation, since vitest from the repo root with `--root app` mis-resolves paths and manufactures failures. Also green on the change: `verify-covers-ci-guards` 9, `decision-chain` 14, `sovereign-ai-sov57-verses` 67 — 104 together. The guard itself: `OK — 58 thread(s) named across the ledger, 8 shared (6 examined and cleared, 2 measured duplicate(s) awaiting Darrell's fold, 0 unexamined), 0 new.` The cases read the **real ledger and the real catalog**, not fixtures, because a fixture could not have caught any of this.

**The measurement is executable, not remembered.** One case recomputes the 13 and the 14 with `sharedGround` against the live catalog and fails on drift in either direction; another asserts each listed pair is **still a live collision**, so the list cannot go stale while looking authoritative; another pins the control pair below the threshold, so a future rule that starts flagging ll221/ll236 fails here first.

**Proven to catch (DR-0076 §3), measured by reverting:** stripping the declaration line out of DR-1051's real file takes the guard to `FAIL — thread 1a135f165fe391e3 is named by DR-1005 and DR-1051` and **3 of 22 cases red**. The file was restored and the guard re-run green afterwards.

**A correction recorded because it was mine.** The first drafts of the two catalog-reading cases timed out at vitest's 5-second default, and a timeout is a slow test rather than a finding. The catalog is now built once and those two carry an explicit 60-second budget — said here because a timeout dressed up as a failure teaches nothing.

**Honest limits, stated rather than buried.** The three cleared entries were read at **front-matter and title level**; the five World Issues bodies were not read, and are not needed to say the EPA carbon rules and the trades hiring are not one teaching told twice. The two duplicate pairs are measured on **anchor verse sets**, not on their prose; a reading of the six lesson bodies could still show that one pair is two teachings that happen to share ground, and the fold decision should include that reading.

## What this does not close

**The fold itself.** Two pairs, six lessons, Darrell's teaching, his call. Nothing is scheduled; the guard prints them every run until he decides.

**The provenance field.** `**Built from:**` is the input the source-plus-ground rule needs, and the ledger has four shapes and no field. Sixty records' front matter plus a new gate. `re-review: 2026-11-17`, carried from DR-1305's own dated item.

**Whether the shipped rule should gain the source condition.** This record establishes that the condition works on one known-good and one known-bad case. Wiring it into `one-teaching-one-lesson.js` waits on the field above, and on more than two measured pairs. `re-review: 2026-12-05`.

---
_Generated by [Claude Code](https://claude.ai/code)_

# DR-1305: A record that considered a thread does not claim it — showing its work is how DR-1303 blocked two of Darrell's unbuilt sends, and how DR-1300 left a guard red on `main`

**Date:** 2026-11-03
**Status:** Accepted
**Tier:** B (two intake instruments and two ledger records; no product code, no schema, no money — but it changes which of his teachings the lane can still see, which is the one thing that lane exists for)
**Type:** verification
**Area:** `scripts/lesson-row-shipped-sweep.mjs` (`consideredNotBuilt`, honoured in `sweep`) · `scripts/one-thread-one-record-guard.mjs` (honours the same declaration) · `app/src/__tests__/a-record-that-considered-a-thread-does-not-claim-it.test.js` (new, 13 cases) · `docs/decisions/DR-1303-last-call-the-clock-a-seller-sets-sov59.md` and `DR-1300-they-called-long-life-a-problem-ll273.md` (each gains its declaration)
**Found by:** the agent, on the Gmail-lane tick at 2026-11-03 17:10 UTC — sweeping the lane's 50 threads and noticing that the two it had been carrying as unbuilt now read `SHIPPED → named in DR-1303`. The relabel merged forty minutes earlier (#2515) is what made the hit legible as "named in" rather than "built as", so the contradiction was visible instead of obeyed.
**Considered, not built:** `1a11bdbce29bab3e`, `1a11bea0b4de78e0`, `1a0aaaf7d6952b4b`, `1a0aab01a0b1746e`, `1a0d92de3dba5e7e` — this record builds no lesson and has no source thread of its own; it quotes these five as the measured evidence below. The first two are **still unbuilt** sends of Darrell’s; `1a0aaaf7d6952b4b` was built as sov54 by **DR-1272**, `1a0aab01a0b1746e` as ll273 by **DR-1300**, and `1a0d92de3dba5e7e` as sov59 by **DR-1303**. Written after the new suite caught this record committing the very fault it describes: the first draft said “none”, and the two sends promptly read `SHIPPED → named in DR-1305` while the one-thread guard went back to FAIL. A record about citations is not exempt from declaring its own.
**Pairs with:** DR-0312 (the Gmail intake Way, whose whole purpose is that his sends are not silently dropped), DR-1250 (a row already shipped refuses to build — the sweep this sharpens), DR-1270 (the connector is a different database; §37 the false-UNKNOWN direction, §42 a record that quotes an id marks it shipped), DR-1285 (the one-thread-one-record guard, whose own note asked for this sharper rule), DR-1288 (the sweep asks the ledger twice), DR-1303 and DR-1300 (the two records corrected here), DR-0610 (one teaching, one lesson), DR-0076 (§1 evidence, §3 proven-to-catch, §4 measure don't claim, §8 honest uncertainty), DR-0621 (a flag is where the work starts)

## Context

`lesson-row-shipped-sweep.mjs` greps the ledger for a source id and refuses a build when any record names it. DR-1250 built it after four already-shipped teachings were handed to builders as waiting; DR-1270 widened it to prefix citations and recorded, in §42, that **"a decision record that QUOTES a row id thereby marks that row shipped."**

That line was written as an observation. It is a defect, and it has been charging rent.

The Way asks a builder to prove it took the **oldest genuinely-unbuilt** send. The only way to prove that is to name the ones it passed over. So a careful record names threads it did not build — and the sweep then reads those names as claims.

## What was measured

**DR-1303 blocked two of his sends by proving they were unbuilt.** It built sov59 from thread `1a0d92de3dba5e7e` and, in `What was measured`, named the only other unbuilt sends it had found: `1a11bdbce29bab3e` (2026-10-08 14:12:27 UTC) and `1a11bea0b4de78e0` (2026-10-08 14:26:23 UTC), *"both swept `unknown`, both thirteen days later."* Measured on the ledger at `73cfe6fc5`:

```
SHIPPED   1a11bdbce29bab3e  ->  named in DR-1303
SHIPPED   1a11bea0b4de78e0  ->  named in DR-1303
```

`grep -rl` over `docs/decisions/*.md` returns **DR-1303 and nothing else** for either id. So the only record naming them is the one that proved they were unbuilt, and every future firing of the Gmail lane would have skipped both — for ever, silently.

**Why the sweep's own doctrine did not cover this.** That file argues the bias belongs on the false-SHIPPED side because a false SHIPPED *"only stops a build until someone reads the record named."* That is true of a person at a keyboard. It is **false of an unattended lane**, where the exit code *is* the decision and no one reads anything. There, a false SHIPPED is not a pause — it is a teaching of Darrell's that stops arriving, which is precisely the failure DR-0312's 365-day window was widened to prevent.

**And the same shape had left a gate red on `main`.** `one-thread-one-record-guard.mjs` reads a record's first 4000 characters as front matter, and its own `KNOWN_SHARED_THREADS` note says that approximation **"cannot tell PROVENANCE from CITATION when a record discusses an intake incident in its opening"**, with `re-review: 2026-11-29` for a sharper rule. DR-1300 built ll273 from `1a0aab01a0b1746e` and printed a two-row table marking the other 2026-09-16 send, `1a0aaaf7d6952b4b`, as **"already built"** by DR-1272 — pure citation, in a table, inside that window. The guard read it as a second claim:

```
one-thread-one-record-guard: FAIL
  - thread 1a0aaaf7d6952b4b is named by DR-1272 and DR-1300
```

DR-1303 §97 measured that identical failure against a clean worktree of `origin/main` at `d05888bec`, correctly called it **inherited and not its own**, and moved on. So it sat red, owned by nobody — which is how a gate stops meaning anything (DR-0076 §3).

**What made this visible at all.** #2515 merged forty minutes earlier and changed the sweep's line from `-> DR-1303` to `-> named in DR-1303`, with a block saying a hit proves the ledger *names* the row and not that the record is its lesson. That wording is why a `SHIPPED` on two threads I had been tracking as unbuilt read as a contradiction worth opening the record over, instead of an answer to obey.

## Impact

**Two teachings he sent on 2026-10-08 were unreachable, and nothing would have said so.** Not delayed — unreachable, because the lock that protects against duplicates had been turned against the lane itself. Every hourly firing would have read `SHIPPED` and moved on. This is the quietest possible failure of the one promise DR-0312 makes him: that what he sends gets built. The two are now `unknown` again and the lane can see them.

**It also tells us what class of record is most at risk: the careful ones.** A builder that names nothing it rejected blocks nothing. A builder that shows its work blocks every alternative it names. The instrument was punishing exactly the diligence the Way asks for, and the better a record documented its choice, the more of his backlog it hid.

**What this obligates.** Any record that names a source it did not build now declares it, on one line, with who did build it where that is known. The two records corrected here are the two measured instances; a third is the guard's six unexamined collisions (`re-review: 2026-11-28`), which this change does **not** examine and must not be read as having cleared — the guard's own debt list still holds them, and the count is unchanged at six.

## Decision

**1. A record declares a citation, in a form a reader can audit.** One line:

```
**Considered, not built:** `<id>`, `<id>` — <why, and who did build it where known>
```

`consideredNotBuilt(text)` reads the ids out of it, and `sweep()` stops counting **that record** as a hit for **those ids**. Other records still count, so a thread genuinely built elsewhere stays `SHIPPED`.

**2. It is a declaration, never a heuristic.** No rule about where in a record an id sits. DR-1270 §37 measured that direction: the full-uuid-only matcher produced a false UNKNOWN for two handled rows, and a false UNKNOWN permits rebuilding a live lesson on a COLG-facing surface. A record must *say so*; a declaration about a thread it actually built is a lie, which is auditable, rather than a drift, which is not.

**3. It cannot un-ship a record's own source.** If a declared id also appears in that record's `**Intake:**` line — where the ledger states provenance — the declaration is **refused** and the hit stands. Provenance beats declaration, always. Without this, a careless builder could write the line about its own thread and make a live lesson look unbuilt; the test for it is the last and most important case in the suite.

**4. The one-thread guard honours the same declaration, and goes green at the cause.** `threadClaims` skips a declared citation. `1a0aaaf7d6952b4b` is now claimed by **DR-1272 alone**, which built it, and the guard reports `OK — 54 thread(s) named across the ledger, 9 shared (3 examined, 6 unexamined debt, re-review 2026-11-28), 0 new.` This is the sharper rule its own note asked for, arriving before its date because the red was measured, not predicted. It clears the collision **at the cause** rather than absorbing it into `KNOWN_SHARED_THREADS`, which would have recorded a duplicate-source pair that does not exist.

**5. DR-1303 and DR-1300 each gain their declaration**, naming the records that really built the cited threads (none yet for DR-1303's two; DR-1272 for DR-1300's).

## Verification

`app/src/__tests__/a-record-that-considered-a-thread-does-not-claim-it.test.js`, **13 cases; 43 green across the three sweep suites**, run from inside `app/` — the only correct invocation, since vitest from the repo root with `--root app` mis-resolves paths and manufactures failures. `npm run lint` clean. The cases read the **real ledger**, not a fixture, because a fixture could not have caught either failure.

**Proven to catch (DR-0076 §3), three reverts, counted not asserted:**

- Removing the exemption from `sweep()`: **1 of 13 red** — both of his sends read `SHIPPED` again.
- Removing the provenance-wins check from `consideredNotBuilt`: **1 of 13 red** — the forged record that declares its own Intake thread succeeds in disowning it. This is the dangerous direction and it is pinned by name.
- Removing the exemption from `threadClaims`: **2 of 13 red** — the guard's exit code and the single-claim assertion.

One case reconstructs the pre-fix ledger by stripping the declaration line out of DR-1303's real text and asserts both ids come back `['DR-1303']`, so this record's account of the damage is executable rather than a memory. The same is done for DR-1300 against the guard.

**A correction to my own first draft, recorded because the suite caught it and not me.** The guard case first asserted **zero** unexplained collisions across the ledger and went red with **six**. Those six are the guard's pre-existing unexamined debt, not in `KNOWN_SHARED_THREADS` — so the assertion was a claim about the ledger I had not measured, exactly the kind DR-0076 §4 exists to stop. It was narrowed to the guard's own verdict plus the one collision this change actually removes, and the reason is written into the test beside it.

## What this does not close

**The two sends themselves.** `1a11bdbce29bab3e` and `1a11bea0b4de78e0`, both 2026-10-08, are now visible to the lane and **still unbuilt**. Building them is the Gmail lane's next work, oldest first, and nothing here does it.

**The guard's six unexamined collisions.** Unchanged at six, still `re-review: 2026-11-28`. Some are probably batch records naming several threads legitimately; saying which needs six pairs of records read, and this change neither read them nor cleared them.

**Whether other records carry the same hidden claim.** The two corrected here are the two that were *measured* — one from a sweep that contradicted what I was tracking, one from a red gate. A ledger-wide pass for records that name a source they did not build has not been run. `re-review: 2026-11-17`.

---
_Generated by [Claude Code](https://claude.ai/code)_

# DR-1288: The sweep asks the ledger twice — a record that names its source in prose was invisible to the id check, and two builders paid for it

**Date:** 2026-10-29
**Status:** Accepted
**Tier:** B (the instrument that decides whether a teaching gets built; no reader-facing surface, no data, no deploy)
**Type:** verification
**Area:** `scripts/lesson-row-shipped-sweep.mjs`, `app/src/__tests__/the-sweep-asks-the-ledger-twice.test.js`
**Found by:** two builders, each after writing most of a lesson, on two separate threads the coordinator handed out as "unbuilt" in one night.
**Pairs with:** DR-1250 (the sweep's own origin — four "waiting" teachings already shipped), DR-0610 (one teaching, one lesson), DR-0763 (L213 — the record the id check could not see), DR-1273 (sov55 — the record it could have seen and was never asked), DR-0975 / P53 (a witness that cries wolf drowns out the fault that matters), DR-0076 (§2 do not talk past a gate, §3 proven-to-catch, §4 measure don't claim, §8 unknown never reads as known), DR-0239 (gate the class)

## Context

`lesson-row-shipped-sweep.mjs` exists because DR-1250 measured four "waiting" teachings that were already built, merged and readable, and recorded that the hand-run check which caught them "belongs in the instrument." It asks the ledger one question: **does any decision record name this row id.**

Twice in one night a thread was handed to a builder as the oldest unbuilt teaching, and twice a builder refused the brief after measuring:

| thread | actually built as | what the id check said |
|---|---|---|
| `1a10bf98e21775dd` | **sov55 / DR-1273** | `SHIPPED` — correct, and **never run**; the backlog had been assembled from a Gmail search |
| `1a112049320caa4a` | **L213 / DR-0763** | `unknown` — **correct about the id and wrong about the teaching** |

The second is the one this record is about. DR-0763 names its source in prose — *"a Big Think piece by Dirk Schulze-Makuch and Tony Reichhardt, 'The leading theory of how life began just hit a snag'"* — and writes the thread id nowhere. Measured: `grep -c 1a112049320caa4a` on that file is **0**. So the teaching was built, the ledger said so in plain English, and the instrument could not see it. A builder wrote a complete, gate-passing lesson before its own anchor check surfaced L213 — **9 of its 10 chosen anchor chapters were already in L213's anchor list**, and the article's pivotal sentence appears nine times there.

And L213 had itself run a one-teaching check before shipping, by **anchors**: *"no lesson in any catalog anchors on Hebrews 11:3, Romans 1:20 or Genesis 1:1, so this is new ground and not a second telling of an existing lesson (DR-0610)."* Two sound checks existed and a teaching walked between them, because neither asked the question the other answered.

## What was measured

- `readLedger()` reads **1,178** records on `origin/main`.
- The id check on `1a112049320caa4a`: `unknown`. The prose naming its source: present in DR-0763's Grounds line. The id: absent, by `grep -c`.
- **Rarity, on the live ledger**, which is what makes the second question usable rather than noise: `snag` appears in **2** records, `theory` in 18, `leading` in 36, `life` in **166**. The builder's own earlier probe measured `Monolith` in **79** and `Uber` in 6.

## Impact

A teaching can be rebuilt from scratch while the ledger plainly records it, costing a builder a full lesson's work and risking the duplicate DR-0610 forbids on a COLG-facing surface. It happened once tonight and was caught by a builder's own new gate rather than by the instrument whose job it is.

## Decision

**The sweep asks a second question: does any record TALK ABOUT this subject.** `--subject "<line>"` scores each content word by how few records carry it and surfaces the records worth reading first.

**Rarity is weighted, not counted, and that choice was measured rather than assumed.** Written first as "a record sharing ≥ 2 distinctive words," it named DR-0763 correctly **and six unrelated records with it**, because `leading` (36) and `theory` (18) both sat under the common-word ceiling and any two of them qualified a record. A probe that names seven records every time is the crying-wolf failure DR-0975 records: the caller learns to skip it, and then the one real hit is skipped with the rest. So each shared word is worth `1/records` — a word in 2 records is worth 0.50, one in 36 is worth 0.03 — and a record surfaces past a bar of 0.2. On the real case that is **DR-0763 at 0.617, ranked first**, plus one coincidence (DR-0378 also contains "snag") that a reader dismisses in a moment **because the words and weights are printed beside every hit**.

**It is the weaker signal and says so.** An id match prints `SHIPPED`. A subject match prints `READ FIRST` and never `SHIPPED`, because conflating them would make the strong signal untrustworthy. Both exit non-zero, per this file's own stated bias: a false stop costs one read, a false clear costs a duplicate lesson.

**Not built here, and sequenced rather than deferred:** the other half of the fix is requiring a new lesson record to *name its thread id*, so the id check stops acquiring new holes while the old ones are worked off. `scripts/one-thread-one-record-guard.mjs` — on sov57's unmerged branch — already extracts the thread each record names, so that requirement belongs on top of it rather than in a second implementation here. Building it on an unmerged branch is the stacking that cost this session a near-revert tonight. `re-review: 2026-11-05`, once that guard is on `main`.

## Verification

- `app/src/__tests__/the-sweep-asks-the-ledger-twice.test.js` — **10 tests, 10 passed**, including anti-vacuity (the ledger it reads must exceed 900 records, since every measurement here is a share of that number).
- **Proven to catch — three breaks on the live script, one at a time, each restored byte-identical (`cmp`):**

  | break | result |
  |---|---|
  | the subject probe removed — the one-question sweep, as it was this morning | **3 failed** |
  | back to counting shared words — the seven-hit flood | **3 failed** |
  | the stopword set emptied, so `the` and `of` become evidence | **1 failed** |

  Restored: **10 passed** after each.
- **This record closed the hole it documents, for one thread, and the gate records that.** The suite first pinned *"the sweep is blind to `1a112049320caa4a`"* and DR-1288 broke it — because DR-1288 names that thread in its own table. The assertion now pins the **cause** instead: DR-0763's own text does not contain the id, and an id-only sweep given that record alone is blind to the teaching. Pinning the symptom would have been erased by any later record that happened to mention the id; pinning the cause is also an accidental demonstration of the sequenced other half — make records name their thread, and the id check stops having holes.
- **The id question is unchanged**, asserted directly: a named thread still reports `SHIPPED` with its DR and `exact: true`; an unnamed one still reports `unknown`; a prefix under `MIN_ID` is still refused rather than guessed.
- Checked by hand on the live ledger, with the exit read from a redirect rather than through a pipe: shipped id → 1, unknown id → 0, short id → 2, a nonsense subject → 0 and "no record shares enough distinctive words".
- `npm run lint` and `npm run verify:gates`, each read without a pipe.
- **Not verified:** the bar of 0.2 is tuned on one real case and one control, not on a corpus of known duplicates — there is no labelled set to measure a false-negative rate against. A genuine duplicate whose subject words are all mid-frequency can still pass, which is why this is a second question and not a verdict. `re-review: 2026-11-29`, with however many real cases have accumulated by then.

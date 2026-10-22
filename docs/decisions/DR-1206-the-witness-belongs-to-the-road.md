# DR-1206: The witness belongs to the road — the new intake had no second witness at all, and the debt count was saying 2 when the real answer was 1

**Date:** 2026-10-22
**Status:** accepted
**Tier:** A (one guard generalized; no record's prose changed; 18 cases added, 6 proven to catch)
**Type:** tooling + orchestration (a Way, DR-0108)
**Area:**
- `scripts/ledger-names-its-thread.mjs` (`roadOf`, `isResearchSourced`, `namesARow`, `namesItsWitness`, `RESEARCH_ITEM`, `INBOX_ROW`, `ROW_ID`; `walkLedger` now returns the road per record)
- `app/src/__tests__/ledger-names-its-thread.test.js` (32 cases, up from 14; `OUTSTANDING` split from `BUILT_THE_ROAD`)

**Grounds:** the gate `ledger-names-its-thread` went red on PR #2389 (vitest shard 3/4, check run 119601867868) demanding a Gmail thread id from DR-1205 — a lesson that never touched email. Found while driving that PR to green; the red was real, and it was pointing at the guard rather than at the record.
**Principles:** DR-0076 §3 (proven to catch — a gate that passes on a break is itself a lie), §4 (measure, never claim), §8 (name the method's limits); DR-0621 (a flag is where the work starts — the gate's complaint was worked until it was right, not silenced); DR-0075 (recurring friction becomes a fix); DR-1051 (the rule this generalizes); DR-1202 (the road that made it necessary)

## SHOULD → ARE → GAPS → CLOSE (DR-0219)

**SHOULD.** DR-1051 set the rule after a measured near-miss: a lesson built from an intake must name that intake in the repo, so `grep <id> docs/decisions/` answers *"have we already built this?"* offline, with no Gmail label and no inference. The reason is written in the guard's own header — the `Lesson-Captured` label is a SINGLE witness living outside the repo, and on 2026-10-15 it silently failed to be written while the record it should have contradicted named no id either. **Both witnesses were blind at once.** The repo is the second witness.

**ARE (measured 2026-10-22).** The guard reads one road. It detects a record built from a *forward* — the word "forward" within 600 characters of the quoted one-word instruction — and requires a 16-hex Gmail thread id. Two findings, both measured on the real ledger rather than reasoned about:

1. **The research road was invisible to it.** DR-1202 opened a second intake hours earlier: Darrell sends a link into the app's own research road, the teaching is built from an `agent_inbox` row, and email is nowhere in the path. The guard did not see that class at all — not as compliant, as *absent*. Every lesson built the new way would have carried **no second witness**, which is the 2026-10-15 blindness reopened on a new road, at exactly the moment a new road started carrying teachings.
2. **It demanded the wrong witness from the one record it did see.** DR-1205 was flagged because its `**Principles:**` line cites DR-0312 — *the record that created the email lane* — putting the word "forwarded" a line from the quoted instruction. Verified directly: `isEmailSourced(DR-1205)` is `true` on that citation alone. Since every intake record cites DR-0312, this would have fired on **every** record built through the new road, forever, and the only way to satisfy it would have been to write a Gmail thread id for a teaching that has none.

**GAPS.** Two, named plainly:
- the witness rule was written as "a Gmail thread id" when the thing it is actually about is **the road's own identifier**;
- the debt list conflated two different things — an id that exists and is still owed, and a record that *created* a road and therefore has no id to owe.

**CLOSE.** Both, in this change.

## The decision

**The witness belongs to the road.** A record built from an intake names that road's identifier: a forward names its Gmail thread id (16 hex), a research-road lesson names its `agent_inbox` row id (a lowercase uuid). `walkLedger` now classifies each record by road and checks the witness that road actually has. The roads are **not** interchangeable, and that is pinned: a thread id on a research-road lesson is a grep that finds nothing, which is worse than an empty provenance line, because it looks like provenance.

**The research road is tried first, on purpose.** The DR-0312 citation makes the email detector fire on every intake record; without this ordering the guard would ask the new road's lessons to be satisfied by a fiction. A record that names the research road explicitly is judged by the research road.

**The detector stays narrow.** `RESEARCH_ROAD_WORDS` is three phrases — `agent_inbox`, "research road", "research lane" — and not the bare word "research", because nearly every record in this ledger researches something. Measured: the narrow version classifies 2 records, and the bare word turns the real-ledger rule, the exact-debt check and the shrink-only ceiling all red at once.

**The debt list is split from the records that BUILT a road, and that is the honest part.** A road's founding record quotes the one-word instruction while explaining how its own door works, so the proximity detector cannot tell it from a record built *through* the door. `DR-0312` (the email lane) and `DR-0608` (the in-app door) are both that. DR-0608 is the clearest case there is: it measured `agent_inbox` at **0 rows** by SQL count on the live project while it was being written — proof inside the record that no teaching had yet come that way.

They are not debt. A future session reads the debt count to know how many ids are still owed, and counting two permanent false positives in it made that number say **2** when the true answer is **1** (DR-0505, whose provenance names the sender but neither the publication nor the date, so there is nothing to match a thread on). Nothing was recovered and no excuse moved: **the count became true.** `BUILT_THE_ROAD` is closed at two, and each entry must earn its place twice — the detector has to actually flag it, and it has to be flagged on the road it claims to have built, or the test deletes the entry for dead weight.

## Two sessions reached this decision within minutes, and the merge kept the better half of each

While I was writing this, another session pushed `7f26dc108` to the same branch — the same conclusion, from the same red check, independently: *"The research road names its own witness: a lesson sent down it records its research item, as a forward records its thread."* That is worth recording rather than smoothing over, because it is the second-order evidence that the gate's complaint was real: two readings of the same failure, arrived at separately, agreed on the diagnosis.

It is also recorded because **their implementation was better than mine in one place that matters, and mine was stricter in two.** The merge is a synthesis, not a winner:

| | theirs | mine | merged |
|---|---|---|---|
| the research witness | `research item \`<uuid>\`` — the uuid must carry its LABEL | any uuid anywhere in the record | **theirs**, widened to accept the `agent_inbox` row form too |
| cross-road witnesses | a Gmail thread id satisfies a research-road record | each road is held to its own | **mine** — a thread id on a research-road lesson is a grep that finds nothing |
| what counts as the road | "research road" only | `agent_inbox`, "research road", "research lane" | **mine** — a record that names only the table would otherwise escape |
| DR-0608 | not reached (their narrower phrase misses it) | flagged, and the debt count corrected | **mine** |

**And their labelled-uuid regex carried a bug mine did not, which my test found before the merge landed:** the case-insensitive flag covered the whole pattern, so `D5480D79-4005-418D-B882-69F3187CC32C` passed as a witness. An id in the wrong case is an id `grep` will not find — the exact reason `namesAThread` has refused `1A135F165FE391E3` since DR-1051. Merged, the LABEL may be capitalised (a record can open a sentence with it) and the ID may not. It is pinned, and reverting to the case-blind flag turns that case red.

Neither session wasted the other's work, and neither one's version shipped unchanged. That is the outcome DR-1136 (merge order is the only tiebreak) is for when the collision is a number; this one was a collision of reasoning, and the right resolution was to read both.

## Measured (DR-0076 §4)

| | before | after |
|---|---|---|
| records seen as built from an intake | 36 (one road) | 38 (36 forwarded, 2 research road) |
| research-road lessons guarded | **0 — the class was invisible** | all of them |
| DR-1205 | flagged, owing an id it cannot have | passes, judged on the road it came in on |
| real debt (ids still owed) | reported 2 | **1** — DR-0505 |
| cases in the suite | 14 | 32 |

## Proven to catch (DR-0076 §3)

Six separable breaks, each restored byte-identical afterwards and the suite re-run green (32/32):

| break | result |
|---|---|
| try the email road first | 5 red — the real-ledger rule and DR-1205's own answer among them |
| let either witness satisfy either road | 1 red — the thread id sneaking past a research-road lesson |
| widen the detector to the bare word "research" | 4 red — the rule, the exact-debt check and the shrink-only ceiling |
| never classify the research road (the original blindness) | 9 red — including the fixture lesson with no row id going unflagged |
| let a BARE uuid count as a witness | 1 red — a uuid naming a bucket is not provenance |
| make the id case-blind (the merged-in bug) | 1 red — `D5480D79...` is not an id the grep will find |

A first attempt at proving these was itself wrong and is recorded here because the lesson is about verification, not about this gate: the loop restored the file with `git checkout` between breaks, which reverted the *implementation* along with the break, so breaks 2–4 all ran against an unimplemented file and reported an identical 13 failures. Three "proofs" that proved nothing, and they looked like proofs. The tell was the identical failure counts; the fix was restoring from a copy instead of from the index. **A proven-to-catch run has to be shown to restore the thing it is testing** — DR-0076 §3 applied to the proving method itself.

The fixture cases build the two records the real ledger cannot contain — a research-road lesson *without* its row id, and the same record *with* it — in a temporary tree, which is why the guard was written to take its root as an argument.

## Limits, named rather than left (DR-0076 §8)

- **It still cannot tell a real id from a plausible one.** It checks that a record NAMES one. A wrong id is a different failure from a missing id, and this guard only catches the second. Unchanged from DR-1051 and still true.
- **A record that invents a new phrase for the research road escapes it.** Three phrases are watched. A future record that says "the in-app intake" and nothing else would not be classified, and would pass unguarded — the same shape of gap this record just closed, one layer in. `re-review: 2026-11-05` — re-read the research-road records then and widen the phrase list to what they actually say, rather than to what I guessed today.
- **This record deliberately does not write the quoted one-word instruction.** If it did, it would classify itself as an intake record and owe a witness it has no business having — a third false positive, created by writing about the detector. Said out loud because a reader who notices the absence should know it was a choice, not an oversight, and because it is a real limit of proximity detection, not a trick.
- **It is not wired into the delivery lane as a step.** It runs where it already ran: inside the vitest suite the lane requires. DR-1021's reasoning holds — a ledger operation inside a merge step is where a mistake is least visible.

# DR-1206: The witness belongs to the road — the new intake had no second witness at all, and the debt count was saying 2 when the real answer was 1

**Date:** 2026-10-22
**Status:** accepted
**Tier:** A (one guard generalized; no record's prose changed; 11 cases added, 4 proven to catch)
**Type:** tooling + orchestration (a Way, DR-0108)
**Area:**
- `scripts/ledger-names-its-thread.mjs` (`roadOf`, `isResearchSourced`, `namesARow`, `namesItsWitness`, `ROW_ID`; `walkLedger` now returns the road per record)
- `app/src/__tests__/ledger-names-its-thread.test.js` (25 cases, up from 14; `OUTSTANDING` split from `BUILT_THE_ROAD`)

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

## Measured (DR-0076 §4)

| | before | after |
|---|---|---|
| records seen as built from an intake | 36 (one road) | 38 (36 forwarded, 2 research road) |
| research-road lessons guarded | **0 — the class was invisible** | all of them |
| DR-1205 | flagged, owing an id it cannot have | passes, judged on the road it came in on |
| real debt (ids still owed) | reported 2 | **1** — DR-0505 |
| cases in the suite | 14 | 25 |

## Proven to catch (DR-0076 §3)

Four separable breaks, each restored byte-identical afterwards and the suite re-run green (25/25):

| break | result |
|---|---|
| try the email road first | 4 red — the real-ledger rule and DR-1205's row-id answer among them |
| let either witness satisfy either road | 2 red — both "wrong road's witness" cases |
| widen the detector to the bare word "research" | 4 red — the rule, the exact-debt check and the shrink-only ceiling |
| never classify the research road (the original blindness) | 8 red — including the fixture lesson with no row id going unflagged |

The fixture cases build the two records the real ledger cannot contain — a research-road lesson *without* its row id, and the same record *with* it — in a temporary tree, which is why the guard was written to take its root as an argument.

## Limits, named rather than left (DR-0076 §8)

- **It still cannot tell a real id from a plausible one.** It checks that a record NAMES one. A wrong id is a different failure from a missing id, and this guard only catches the second. Unchanged from DR-1051 and still true.
- **A record that invents a new phrase for the research road escapes it.** Three phrases are watched. A future record that says "the in-app intake" and nothing else would not be classified, and would pass unguarded — the same shape of gap this record just closed, one layer in. `re-review: 2026-11-05` — re-read the research-road records then and widen the phrase list to what they actually say, rather than to what I guessed today.
- **This record deliberately does not write the quoted one-word instruction.** If it did, it would classify itself as an intake record and owe a witness it has no business having — a third false positive, created by writing about the detector. Said out loud because a reader who notices the absence should know it was a choice, not an oversight, and because it is a real limit of proximity detection, not a trick.
- **It is not wired into the delivery lane as a step.** It runs where it already ran: inside the vitest suite the lane requires. DR-1021's reasoning holds — a ledger operation inside a merge step is where a mistake is least visible.

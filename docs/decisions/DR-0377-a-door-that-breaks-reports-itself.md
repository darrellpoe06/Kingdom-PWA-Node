# DR-0377 — A door that breaks reports itself

**Date:** 2026-09-13 · **Status:** accepted · **Tier:** B · **Area:** business · **Principles:** VERIFICATION-DOCTRINE, APP-IS-PRIMARY, REALITY-TRACE, PERPETUAL-IMPROVEMENT, DECISION-RECORDS

## Directive

The half of DR-0374 that DR-0376 deliberately left open, pulled forward from its `2026-09-27` date because it is buildable now (DR-0236).

DR-0376 gave a customer a way to say "this is broken." It did nothing about the real finding: **nothing tells anyone on its own.** Sterling Moore's order was refused on every attempt for the whole life of the Moore Divahs door, and the client's entire response was one line:

```js
console.warn('[crm-sync] capture failed:', error)   // crm-sync.js:140
```

Printed on his own phone. Seen by nobody. Kept by nothing.

A form is a real improvement, but it still waits on a customer choosing to speak up — and **most people who hit a dead form just leave.** A system that can only find out when somebody is kind is not instrumented; it is lucky. Sterling was the kindness. There is no reason to budget for another.

## Decisions

1. **The door files its own report.** When a forced-safe RPC the door depends on refuses, the client writes a **system-sourced** row into the same book the office already reads (`door_fault_report`, migration 0217). No second inbox and no new screen to remember: the steward opens "Door reports" and sees *"The order form is failing for customers"* whether or not anyone typed it.

2. **Deduped, because a broken door is broken for everyone.** A fault firing for a hundred visitors must not become a hundred rows — that buries the customer voice DR-0376 exists to carry. An identical **open** fault inside 24 hours has its `occurrences` incremented and `last_seen_at` moved. **The count is the alert:** *"47 times since 9am"* says something one row never could.

3. **A fold never reopens something the office handled.** Only `new` and `reading` rows absorb a repeat. If a steward marked it closed and it breaks again, that is genuinely new and earns its own row rather than a silent bump on settled work.

4. **A separate function, not a flag on `door_feedback_submit`.** That customer path was verified on **both** databases hours earlier (`md5 63cf8950…`, DR-0376). It is not being touched, re-tested, or put at risk to add a second behaviour. One function, one job.

5. **The office is told a sentence, not a stack trace.** `faultSentence()` produces *"The order form is failing for customers. The app reported: …"* with the machine detail capped at 300 characters. A raw error string is noise to a steward, and pasting an unbounded one onto her screen is an injection surface besides.

6. **A machine is never displayed as a person.** System rows are labelled *"the app noticed this"*, carry their occurrence count, and say **"Written by the app, not a person — there is nobody to reply to"** where a customer row would offer contact details. Open faults also get their own banner above the list, because *"your door is reporting a problem on its own"* is not a queue item.

7. **A fault report never makes things worse.** `reportDoorFault` never throws and never surfaces: a failing report must not turn one broken thing into two in front of a customer who is already stuck. The honest error panel from DR-0374 still renders exactly as before — the self-report is *in addition to* telling the customer the truth, never instead of it.

## What this deliberately is NOT

**Not the timer-driven class, so the three-brakes rule does not attach** (CLAUDE.md; DR-0247 / DR-0248). There is no loop here to budget, lock or stop: a row is written when a real user action really failed, and the office **pulls** it when they open the board. Nothing fires on a clock, nothing spawns work, nothing wakes compute.

**A push notification WOULD be that class**, and is left to its own decision rather than smuggled in under this one.

## Spoofing, stated plainly

The seam is anon-callable, so anyone who can reach the door can file a row claiming to be a system fault. That is the same exposure DR-0376 already accepted for customer reports, bounded by the same per-minute flood brake, and the office reads the raw text either way. The alternative — trusting only server-observed faults — **cannot see a failure that happens in the customer's browser, which is exactly where Sterling's happened.** Visible and spoofable beats invisible.

## Proof

- `npm run verify` green: **953 test files, 14,241 tests**, 1 skipped.
- 17 tests in `door-reports-itself.test.jsx`, **mounting the door and failing a real order** with the real refusal shape from `crm-sync.js`.
- **Proven-to-catch twice**, each by one precisely-targeted test rather than a broad wash:
  - removing the fault report from the capture-failure path (the silence that cost months) → the "calls `door_fault_report`" test fails;
  - removing the fold that makes a storm one row → the "FOLDS a repeat" test fails.

**A methodology note kept because it repeated tonight:** my first attempt at the second break did not apply — the pattern missed, the suite stayed green, and 0 failures meant *nothing*. That was an **incomplete break, not a weak test**, and it was verified before any conclusion was drawn. Same trap as DR-0373's.

## Not done / open

## Executed and witnessed, after merge

Merged as `d591bc2b`. Read back on **both** databases per DR-0374's correction:

| Property | Method | Result |
|---|---|---|
| `door_fault_report` on **hosted** | Direct `pg_proc` query | `md5` `f8f4382d4f2bf37200d6aa065758b654` |
| `door_fault_report` on **sovereign** (live) | `sovereign-read` run 34743949911 | `md5` **`f8f4382d4f2bf37200d6aa065758b654` — identical** |
| **`door_feedback_submit`** on **both** | Both methods | `md5` **`63cf89507ec6cc0bf35253e461198c3c` — byte-for-byte what it was BEFORE 0217 existed** |
| anon can call `door_fault_report` | `has_function_privilege` | true — a fault can be filed from the browser where it happened |
| anon reads / writes the table | `has_table_privilege` | **false / false**, unchanged by the `ALTER` |
| New columns + `source` CHECK | `information_schema` / `pg_constraint` | `source`, `occurrences`, `last_seen_at`; constraint present |
| Policies after the `ALTER` | `pg_policies` | still **8** — office + both overlays intact |
| `---MISSING---` / ledger | `sovereign-read` | `none` / `sovereign_replay=223` |

**Decision 4 is now measured rather than asserted.** The claim was that a *separate function* leaves the customer path "not touched, re-tested, or put at risk." `door_feedback_submit`'s md5 is identical on both databases to what it was before this migration existed — so that is a fact, not a design intention.

**The `ALTER TABLE` regression risk was the specific thing worth checking rather than assuming**, and it held: the office policy and both standing overlays survived it.

## Not done / open
- **Only the Moore Divahs order form reports itself so far.** The other RPC seams that same door depends on (classes, messages, showcase) still fail quietly. The pattern is now one function call, so widening it is small — but it is not done, and claiming the door is instrumented would overstate it. **re-review: 2026-09-27.**
- **Still nothing reaches the office while they are away from the board.** This makes a fault *findable*, not *pushed*. Whether it should page anyone is the decision point 6 defers.
- **No live fault has been observed end to end.** The sandbox has no route to poetech.us (P31); a real refused capture landing as a real system row is the confirmation. **re-review: 2026-09-20**, with DR-0376's live pass.

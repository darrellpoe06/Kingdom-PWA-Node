---
id: DR-0972
title: The recorded brakes match the running automation — DR-0610's budget is gone, and the record now says so
date: 2026-10-11
status: accepted
supersedes: []
superseded-by: null
amends: [DR-0610]
tier: B
entities: [poetech]
grounds: [VERIFICATION-DOCTRINE, THREE-BRAKES, WAYS-REVIEW, PERPETUAL-IMPROVEMENT]
source: 2026-10-11 — found while reading DR-0610 after the ari-guard caught it cited-but-unread
---

## Context

DR-0610 was cited in a reply, the ari-guard stop hook refused it as
cited-but-unread (DR-0250), and reading it properly turned up a drift between
what the ledger records and what the automation actually does.

**DR-0610 decision 2**, written 2026-09-24, Tier A:

> *"Its brakes are unchanged: **budget 3 rows per firing**; lock is the
> `lesson-captured` tag written only after the push; kill is disabling the
> Routine."*

**The live Routine** (`trig_01KnByrzx8yYCURwfRKUrvTq`), as it fires every hour
today:

> *"**NO COUNT CAP** (Darrell 2026-09-29: 'Why have any cap?! Don't add
> constraints for nothing! If I push through 1000 in a day get it done...
> period!'): process EVERY other eligible row this firing..."*

Darrell's no-cap word is **2026-09-29**, five days after DR-0610. The later
word governs and the Routine is right. **DR-0610 was never amended**, so a
Tier A record has gone on claiming a brake the automation does not have.

## What was measured

| | DR-0610 decision 2 (2026-09-24) | live Routine prompt (read 2026-10-11) |
|---|---|---|
| budget | **3 rows per firing** | **none — "NO COUNT CAP"** |
| lock | `lesson-captured` tag, written only after the push | same |
| kill | disable the Routine | same |

Two of three brakes match. The first does not, and has not since
2026-09-29 — **twelve days**.

This matters more than a stale sentence usually would, because DR-0610 is the
record that *starts* this automation (decision 2: *"The reader starts now, by
this record, not by a human arming step"*). The three-brakes rule governs this
exact class, and an auditor reading the ledger would conclude a per-firing
budget bounds it. It does not.

**The budget is also the brake whose removal has teeth here.** The lock
(`lesson-captured`) prevents *duplicate* work, not *unbounded* work: a firing
that finds forty genuine rows builds forty lessons in parallel, forty
worktrees, forty full verifies. On this machine a verify measures **~35
minutes**, so the ceiling the budget used to impose is now entirely absent
from both the record and the runtime.

## Impact

Unresolved, the harm is not to the automation but to the **ledger's
trustworthiness**, which is the thing every later decision is built on. A
record that overstates a safeguard is worse than one that states none: it
stops the next person asking the question. That is precisely the failure
class this whole day has been made of — a lock that reads as present and
is not. The bell reported itself as rung; the Gmail exclusion reported
everything as uncaptured; `rentable_level` was read but never written. This
is the same shape in the ledger instead of the code.

Reversible and cheap: one record, no code, no automation change. The Routine
is already correct and is **not** modified by this.

## Decision

1. **DR-0610 decision 2 is amended, never rewritten** (DR-0011: a new
   directive is a new DR). Its budget clause is superseded by Darrell's
   2026-09-29 word. The in-app lesson reader's brakes are now, truthfully:
   **lock** = the `lesson-captured` tag written only after the push; **kill** =
   disabling the Routine. **There is no budget.**
2. **The Routine is not changed.** It already matches Darrell's instruction.
   This record moves the ledger to reality, not the other way round.
3. **Removing the budget is consistent with DR-0248**, which removed the
   deterministic class's manual kill-switch on the same reasoning: brakes that
   demand a human remember something are not brakes. The lock here is
   deterministic — a row stays unmarked until its build pushes — and it is the
   one that actually holds.
4. **NOT decided: whether an unbounded parallel build needs a new bound of a
   different kind.** A forty-row firing would start forty ~35-minute verifies
   at once, and nothing measures that today. The honest statement is that the
   ceiling is unknown rather than large. This is named here so it is not lost,
   and it is **not** a reason to re-impose a count cap Darrell has explicitly
   refused. `re-review: 2026-10-24`, alongside DR-0610's own re-review.
5. **The general rule this incident earns:** when a Routine's prompt and its
   founding DR disagree about a brake, **the running automation is the truth
   and the record is the defect.** Fix the record, in a new DR, the session it
   is found.

## Verification

- **DR-0610 read in full** (not summarised) — decision 2 quoted verbatim above.
- **The live Routine read with `get_trigger`** on
  `trig_01KnByrzx8yYCURwfRKUrvTq`, 2026-10-11 — the "NO COUNT CAP" clause
  quoted verbatim above, with Darrell's 2026-09-29 words carried inside it.
- The two were compared field by field; the table above is that comparison.
- **Not verified:** what a genuinely large firing costs. Eight consecutive
  firings today read `lesson rows in flight: 0`, so the unbounded path has not
  been exercised and its cost is **unknown, not small**. Recorded as a limit
  rather than estimated.
- No code changed, so no test applies. `business-systems-guard` and
  `decision-chain` cover the record's own shape.

## Links

[DR-0610] (amended here — the parallel run and the reader's brakes),
[DR-0247] (agreed work starts itself; why the reader is armed by record),
[DR-0248] (the precedent for removing a brake that depends on human memory),
[DR-0250] (cited-but-unread — the guard that surfaced this),
[DR-0011] (one decision per file; a new directive is a new DR, never a
rewrite).

# DR-0363 — The sum rule refuses inside the function, not at commit

**Date:** 2026-09-11 · **Status:** accepted · **Tier:** B · **Area:** money · **Principles:** VERIFICATION-DOCTRINE, DETERMINISTIC-FIRST, DECISION-RECORDS

## What happened

DR-0359 shipped `obligation_lines` with the rule *"line items must add up to the payment"*, enforced by a **`DEFERRABLE INITIALLY DEFERRED`** constraint trigger. It was deferred on purpose: a four-line breakdown is written one row at a time, and an immediate trigger would fail on the first row before the set could balance.

**Deferred means it fires at COMMIT.** Not at the end of the statement, and not when `obligation_set_lines` returns. So inside any open transaction the function wrote a breakdown that did not add up, returned the rows, and reported success.

The `rls-isolation` leg caught it on merge — runs **149** and **150**, both red on main:

```
ERROR: FAIL: a breakdown SHORT of the payment was accepted
```

The smoke was right. The migration was wrong.

## Why the local probe missed it — the part worth keeping

Before pushing 0203 I ran it against the live schema in a rolled-back transaction and watched the trigger refuse an over-sized breakdown. That probe passed. It passed **for the wrong reason**: to observe a deferred trigger inside an open transaction I had written `SET CONSTRAINTS ALL IMMEDIATE` — which is exactly the condition the real function never creates.

**Arranging the world so a check fires is not proof that the check fires.** DR-0076 §3 says a gate must be proven-to-catch; this records the sharper version: *proven-to-catch in the shape the code actually runs in.* A probe that changes the execution mode to see the behaviour has tested a different program.

Production was less wrong than the smoke, which is why this was a latent defect rather than a live one: PostgREST runs each RPC in its own transaction, so the deferred trigger did fire at commit and a real client did get an error. But the error came from the commit rather than from the function, the function's own return value was a lie, and any caller inside a larger transaction would have got the failure late or not at all.

## Decision

1. **`obligation_set_lines` checks the sum itself**, after the inserts and before it returns. A bad set is refused on the spot, by the function the caller actually called.
2. **The deferred trigger stays.** It is the backstop for any other path into the table. Belt and braces — with the belt now doing the work at the moment of the write.
3. **The smoke is unchanged.** It was correct; it is the reason this was found before anyone relied on it.

## Proof — the failure reproduced, then the fix, both against the live schema

Run in one rolled-back transaction, without forcing constraint mode:

| Step | Result |
|---|---|
| BEFORE 0205 — short breakdown accepted? | **true** (the CI failure, reproduced) |
| AFTER 0205 — short breakdown accepted? | **false** |
| AFTER 0205 — exact breakdown accepted? | **true** |
| AFTER 0205 — lines left on the obligation | **3** |

Plus `door-economics.test.js` (33, two new pinning that the check sits inside the function and that the trigger was not dropped).

## The standing lesson

When a check is deferred, transactional, or otherwise conditional on execution mode, **the probe must run it the way the caller will**. If a probe needs a `SET`, a flag, or a mode change to observe the behaviour, that is a signal the real path is not covered — write the probe against the real path instead, or accept that CI is the first place the truth shows up.

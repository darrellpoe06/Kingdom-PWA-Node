# DR-1510: The pre-Way service audit gets a new date, and the why it was owed

**Date:** 2026-11-16
**Status:** Accepted
**Tier:** A (one dated ceiling in an existing gate, moved with its reason recorded; no code path changes)
**Type:** decision
**Area:** `app/src/__tests__/a-service-comes-home.test.js` (`AUDIT_BY`)
**Pairs with:** DR-1119 (a service comes home by one Way), DR-0075 (a non-improvement is a recorded decision WITH a re-review date), DR-0236 (nothing buildable waits), DR-0621 (a flag is where the work starts)

## Context

`a-service-comes-home.test.js` carries `AUDIT_BY` — the date by which the
services born before the Way (2026-10-19) must be brought up to it. The date was
**2026-11-15**. It passed, and the gate went red, with the message it was written
to give: *"bring them up to the Way or record a new date with a why (DR-0075)."*

## What was measured

- **The gate is red on a clean tree**, independent of any other change: measured
  by stashing this session's work and re-running — 1 failed, 14 passed.
- **Main has not seen it yet.** `ci.yml`'s last run on main is **10558**
  (2026-11-13 22:37 UTC, `79388000ae8`), green — two days BEFORE the ceiling.
  So the next PR to run CI is the first to meet it, and would have gone red for
  a reason that has nothing to do with its own diff. Holding the hand of the
  process (DR-0621) means this is in scope now, not later.
- **The audit WORKED, which is why there is so little left.** The list began at
  the services born before 2026-10-19 and is down to **two**, and neither is
  work somebody forgot:
  - `supabase` — **lacks nothing readable.** It remains listed only because its
    restart is `compose up -d`, a compose stack's own idempotent converge, while
    `restartOnEveryPath` reads systemd functions. The open item is in the
    READER, not the service.
  - `ytzero` — **lacks `health` alone**, with the why recorded in the file on
    2026-10-20: the app exposes no health route (its own healthcheck is a TCP
    connect), so the installer can only ask its root.

## Impact

CI stops being red for a reason unrelated to the change under test, and the
remaining debt is stated precisely instead of being carried by a date nobody
could satisfy. The two entries stay in the list and keep failing the gate if
anyone strikes one without building the part — the ledger still says what is
true.

## Decision

1. **`AUDIT_BY` moves to 2026-12-15**, sized to the one genuinely actionable
   item — teaching `restartOnEveryPath` to read a compose converge as the
   restart it is — and not to the whole list.
2. **The why is written where the date lives**, both items named with what each
   actually needs, so the next reader does not have to re-derive it.
3. **Nothing is struck from the list and nothing is exempted.** `supabase`
   stays listed with `lacks: []` and `ytzero` with `lacks: ['health']`: the
   reason they sit there is the reader and a third-party app, not a judgment
   that the Way does not apply to them.
4. **This is not a licence to drift.** Recorded in the file: if 2026-12-15
   passes with the reader unchanged, the gate goes red again and the next
   session owes a why, not another month.

## Verification

- `a-service-comes-home.test.js`, **15 green** (was 14 passed / 1 failed).
- The gate still catches what it is for: the failing assertion is a date
  comparison against `new Date()`, so it re-reddens on its own the day the new
  ceiling passes — no mechanism was weakened or removed to make it green.
- **Not measured, so not claimed:** neither remaining item was BUILT here. This
  record moves a date and states a reason; `re-review: 2026-12-15` is the
  promise, and the compose-converge reader is the work it points at.

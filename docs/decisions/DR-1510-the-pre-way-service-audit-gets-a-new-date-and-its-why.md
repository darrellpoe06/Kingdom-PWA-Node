# DR-1510: The pre-Way service audit gets a new date, and the why it was owed

**Date:** 2026-11-16
**Status:** Accepted
**Tier:** A (one dated ceiling moved with its reason recorded; no code path changes)
**Type:** decision
**Area:** `app/src/__tests__/a-service-comes-home.test.js` (`AUDIT_BY`)
**Pairs with:** DR-1119 (a service comes home by one Way), DR-0075 (a non-improvement is a recorded decision WITH a date), DR-0621 (a flag is where the work starts)
**Full measurement:** `docs/99-session-notes/2026-11-16-the-waiting-queue-answered-and-three-dates-came-due.md`

## Context

`AUDIT_BY` is the date by which the services born before the Way (2026-10-19)
must be brought up to it. It was **2026-11-15**. It passed, and the gate went red
with the message it was written to give: *"bring them up to the Way or record a
new date with a why (DR-0075)."*

## What was measured

Red independent of any change here, and `open-source-candidates.js:235` lapsed
the same day — neither file is touched by this session's diff. Main has not met
it yet: `ci.yml`'s last run on main is **10558** (2026-11-13 22:37 UTC), green,
two days before the ceiling, so the next PR to run CI is the first to hit it and
would redden for a reason unrelated to its own diff. DR-0621 puts it in scope.

**The audit WORKED: the list is down to two**, and neither is forgotten work.
`supabase` **lacks nothing readable** — it stays listed only because its restart
is `compose up -d`, a compose stack's own idempotent converge, while
`restartOnEveryPath` reads systemd functions, so the open item is in the READER.
`ytzero` **lacks `health` alone**, with the why recorded on 2026-10-20: the app
exposes no health route (its own healthcheck is a TCP connect), so the installer
can only ask its root.

## Impact

CI stops being red for a reason unrelated to the change under test, and the debt
is stated precisely instead of carried by a date nobody could satisfy. Both
entries stay listed and still fail the gate if struck without building the part.

## Decision

1. **`AUDIT_BY` moves to 2026-12-15**, sized to the one genuinely actionable item
   — teaching `restartOnEveryPath` to read a compose converge as the restart it
   is — not to the whole list.
2. **The why is written where the date lives**, both items named with what each
   actually needs, so the next reader does not re-derive it.
3. **Nothing struck, nothing exempted.** They sit there because of the reader and
   a third-party app, not because the Way does not apply to them.
4. **Not a licence to drift** — recorded in the file: if 2026-12-15 passes with
   the reader unchanged, the gate reddens again and the next session owes a why.

## Verification

- `a-service-comes-home.test.js`, **15 green** (was 14 passed, 1 failed).
- The mechanism is untouched: the assertion compares `new Date()` to the ceiling,
  so it re-reddens on its own the day the new date passes. Nothing was weakened
  or removed to make it green.
- **Not claimed:** neither item was BUILT here. This record moves a date and
  states a reason; the compose-converge reader is the work it points at.
  `re-review: 2026-12-15`.

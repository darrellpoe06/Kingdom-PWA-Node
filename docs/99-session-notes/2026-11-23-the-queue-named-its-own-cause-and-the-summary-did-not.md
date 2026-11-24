# 2026-11-23 — the queue named its own cause, and the summary did not

The session's worker restarted repeatedly from 2026-11-19 to 2026-11-23. This
note records the first read after it, what that read showed, and the one defect
it exposed. Record: **DR-1610**.

## 1. The outage, measured rather than estimated

99 hourly intake ticks queued unread while the worker was down. All 99 were
byte-identical copies of the same stored routine prompt, contiguous from
19:04 Nov 19 to 21:04 Nov 23 — one per hour, no gaps, and **nothing else in the
queue**: no message from Darrell, no task result, no PR event. They were all
drained before any other work.

One real cost: the 18:04 Nov 19 census was dispatched and never read (run
44584125436, succeeded). Four days stale, so it was replaced rather than
reported.

Meanwhile `main` advanced to `39639969634` — DR-1594, DR-1596 and DR-1597
landed from other sessions. `claim-decision-number.mjs --reserve` reported this
tree could not see **57 landed records**; the branch was restarted from main
before anything was written.

## 2. The read — run 45266493452, census taken 21:02Z

`TAILNET: false`. The keyless road answered, as it was built to:

```
8 lesson row(s) waiting — the house's own census, read over the public road, taken 9 min ago
The oldest has waited 11 d 8 h (2026-11-12T12:17:12.767416+00:00).
Failed because -- other: 6, rate-limited: 1, transient: 1.
  6 x other -- its reason matches no site this road knows: the builder's log on
               the box is the next read, and a new site name is the fix
  65241324 | build-failed/transient | gates refused: quotation | because: span-without-reference | rate-limited after 4
  29d2c703 | build-failed/other     | crashed: RuntimeError | failed after 2
  7a79db92 | build-failed/other     | crashed: RuntimeError | failed after 2
  825019ca | build-failed/other     | gates refused: quotation | because: span-without-reference | crashed: RuntimeError | failed after 2
  2e7ef925 | build-failed/other     | gates refused: verse | because: not-the-verse | failed after 2
  f60ed2a5 | build-failed/other     | gates refused: quotation+verse+voice | because: generic-God-not-Yahweh+not-the-verse+span-without-reference | failed after 2
  c671009b | build-failed/other     | gates refused: quotation+verse | because: not-the-verse+span-without-reference | failed after 2
  84f74456 | build-failed/rate-limited | cause not stored | rate-limited after 4
The builder -- service: active; building now: 0; its own record at 2026-11-23T20:47:43Z, state: ready
```

### What changed in four days

- **One new row**, `84f74456` (created 2026-11-19T21:02): rate-limited, four
  attempts, `cause not stored` — expected for a rate-limit, which never got a
  draft to store gates for.
- **`65241324` moved**, and in the right direction: it was `failed after 2` and
  now reads `transient ... rate-limited after 4`. The builder is still retrying
  it, so DR-1552's named spans can still reach it.
- **The other six are unchanged** at `failed after 2`, past the budget.
- **The builder is healthy** — active, idle, its own record 24 minutes fresh.
  Readiness is not the cause, and was not the cause.

### What the queue is actually blocked on

Not a credential. Four of the eight died on `span-without-reference`, three on
`not-the-verse`, one on `generic-God-not-Yahweh`. Two heal themselves and want
nobody. Six are past budget and want either a hand or one decision: **may a
lesson double-quote Bishop Gwin, or Darrell, without a Scripture reference?**
That single rule killed four of them, and it is Darrell's call, not a bug.

## 3. The defect the read exposed

The summary said `other: 6` and printed *"the builder's log on the box is the
next read"* for rows whose cause this same receipt had already read, stored and
printed one line down. A surface contradicting itself (DR-0239), sending a
person to the box for a trip it had made itself.

**Scope, checked rather than assumed.** No migration and no reader change were
needed: the SQL allowlist already publishes `STALLS | SITE_CLASSES | {"other"}`
(`test_the_SQL_allowlist_publishes_exactly_these_classes`) and the reader
already names a job for each (`test_every_class_the_census_can_assign_has_a_job`).
`gates` and `crashed` could always ride the public road. The census simply never
assigned them. One file plus its tests.

**An expired limit, not a violated one.** DR-1534 deliberately read an
exception-opening reason as `other` — "narrower than the builder, never wider" —
because at the time publishing a class from the row's own string would have been
a guess. DR-1542 then gave this file `exception_of()`, which returns
EXCEPTION_NAMES' own string. The limit was obsolete from that moment; this
change retires it and the test says so in its own body rather than quietly
flipping an assertion.

## 4. Verification

| what | result |
|---|---|
| census suite | **150 green** (8 new, 1 rewritten; was 142) |
| proven-to-catch, fallback neutered | **6 fail**, incl. `by_stall` vs the row's own `stall` |
| proven-to-catch, precedence flipped | **2 fail** by name |
| ruff (CI pin 0.17.3, not the 0.16.9 shadowing it here) | clean |
| format-guard | 0 added files, OK |
| JS witness on the keyless road | **12 green** |
| live `by_stall` after the change | `crashed: 3, gates: 3, rate-limited: 1, transient: 1` — `other` gone |

Two test failures were my own row construction, not the code, and both are worth
recording: `why_of` answers `waits-for-governor` before reaching the failed
branch unless `created_by` is an owner's, and `ready` unless the row carries a
`build:failed@` stamp. The cases now build the row the way the builder leaves it.

**Not claimed here:** nothing was measured live when this note was written. The
proof arrived 2026-11-24T14:07Z, after a 15-hour outage of both roads, and is
recorded in `2026-11-24-both-roads-shut-then-the-queue-named-its-rows.md`.

## 5. One overdue re-review closed, as superseded

Task #13 — `reason_tag` putting a class word first at every failure site —
carried `re-review: 2026-11-19` and came due during the outage. Closed as
**superseded, not deferred**, on read code rather than recollection:

- `stall_of` matches the builder's prose by `startswith` (`:462`), so prefixing
  a class word would make all eight openings miss and re-blind the field — the
  exact condition DR-1534 was written to end.
- The class word already reaches the reader; the census derives it.
- The one thing it bought — a reworded gate message not silently degrading to
  `other` — is already delivered by DR-1552's drift case
  (`test_lesson_queue_census.py:1269-1284`), which fails CI when a literal stops
  appearing in the builder's own source.

So the remedy exists, is deterministic, and shipping the change would be a
coordinated two-sided edit to a live NAS service plus the public receipt that
buys nothing. The real remaining gap was the census's own fallback — DR-1610.

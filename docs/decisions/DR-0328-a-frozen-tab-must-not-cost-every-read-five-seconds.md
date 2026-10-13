---
id: DR-0328
title: A frozen tab must not cost every read five seconds — the acquire window fits inside the read budget, and the fourth bound was the signal
date: 2026-09-03
status: accepted
supersedes: []
superseded-by: null
amends: []
tier: A
entities: [poetech, church, moore, tlc]
grounds: [VERIFICATION-DOCTRINE, EXECUTION-OUTCOME-OBSERVABILITY, COMMUNITY-FIRST, LESSONS-LEARNED, PERPETUAL-IMPROVEMENT]
source: 2026-09-03 session — Darrell's Properties card showing four `not-reached` lines on build 3822a4e, then the decisive one-line measurement: "it worked in incognito"
---

## Context

Signed in, on the just-deployed build, with the NAS measured healthy
(`supabase-auth` healthy, `supabase-rest` connected to PostgreSQL 15.8 with its
schema cache loaded at 13:15:14, the database returning real row counts),
Properties showed **four identical `not-reached` lines**. The same URL loaded
perfectly in an incognito window — isolated storage, no sibling poetech.us tab.

`not-reached` is `boundedRead`'s timeout fallback, not anything the database
said. Every PostgREST call routes through `getSession()`, which serialises on a
cross-tab Web Lock; Chrome freezes background tabs, and this family runs ~35
across three doors on one origin, so a frozen holder never releases it.

## Decision

1. **Set `lockAcquireTimeout: 1200` on the client.** auth-js 2.106 already
   recovers — on its acquire timeout it STEALS the orphaned lock
   (supabase/supabase#42505), freeing it for everyone, so the cost is paid once.
   The defect was only the **default window of 5000ms**, which does not fit
   inside `bounded-read`'s 6000ms: a contended read spent ~83% of its budget
   waiting to start and reported `not-reached` having never been given a chance.
2. **Use the vendor's knob, not a hand-rolled lock.** A custom `lock`
   implementation was written first and **deleted before it shipped** once the
   library's own steal-recovery was read. Stealing is strictly better than the
   custom fallback's "proceed unlocked": it releases the orphan instead of
   working around it, and it is the vendor's tested path in the app's most
   sensitive code.
3. **Gate the RELATIONSHIP, not the number.** `auth-lock-window.test.js` reads
   both real constants and fails on `acquire >= READ_TIMEOUT_MS`, on `0`
   ("fail immediately on contention"), on a negative value ("wait forever" —
   the deadlock the vendor's docs warn about), and on the line's removal. A
   comment could not hold this: either number can move independently.
4. **The floor matters as much as the ceiling.** The window must stay
   >= 500ms so a genuinely live sibling mid-refresh still serialises. Stealing
   from a live refresher would cause the token-rotation race the lock exists to
   prevent — a worse failure than the one being fixed.
5. **`bounded-read` stays.** It is the backstop for every other way a read can
   fail to settle, and it is what kept the page renderable through this. It is
   explicitly NOT the fix, and the test pins that it remains.

## Rationale

Because the fourth bound was the signal. The boot gate (2026-07-13), Admin
access+usage (2026-07-22), PIN reads, and Properties (2026-09-01) had each
bounded this same lock's symptom. A bound can only choose HOW a read fails;
four honest timeouts is still four timeouts. **When a workaround has been
applied to a fourth surface, the cause is upstream and the workaround is the
finding** — that is the durable lesson (P49), and it is what turned a fifth
bound into a one-line fix at the source.

## Consequences

- **Obligates:** any change to `READ_TIMEOUT_MS` or to the acquire window is
  now checked against the other by CI, in both directions.
- **Enables:** a frozen tab costs one 1.2s steal, once, instead of five seconds
  on every read in every live tab — and no surface needs a fifth bound.
- **Forecloses:** inheriting the vendor default silently, and "fix it per
  surface" as the response to this class.
- **Reversibility:** one line; reverting restores the prior (worse) behaviour
  with no data effect.
- **Not claimed:** this was verified by test and by reasoning from the real
  library source, NOT yet by Darrell reproducing his 35-tab window on the
  shipped build. That live confirmation is the remaining proof (DR-0104).

## Links

DR-0327 (the same morning's outage, and why the backend was ruled out by
measurement), DR-0076 (proven-to-catch; unknown never reads as healthy),
DR-0104 (the live production review that still owes the confirmation),
`app/src/lib/bounded-read.js`, `app/src/modules/properties/PropertiesApp.jsx`,
REV-0251.

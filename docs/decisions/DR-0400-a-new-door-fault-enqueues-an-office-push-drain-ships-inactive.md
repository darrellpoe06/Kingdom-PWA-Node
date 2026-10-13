# DR-0400 — A new door fault enqueues an office push; the drain ships inactive

- **Date:** 2026-09-14
- **Status:** accepted
- **Tier:** C (touches the notification path + a timer-driven drain — front-door-adjacent; ships INACTIVE, armed on proof)
- **Type:** business
- **Closes the build of:** MooreDivahs open item #4 (the office push DR-0378 deliberately left unbuilt); activation waits on the DR-0334 phone-proof
- **Scope:** `infra/supabase/migrations-auto/0220-…sql` (push_outbox + the enqueue), `.github/workflows/push-outbox-drain.yml` + `scripts/push-outbox-drain-over-tailnet.sh` (the drain, inactive), `app/src/__tests__/push-outbox.test.js`
- **Principles:** APP-IS-PRIMARY, VERIFICATION-DOCTRINE (DR-0076), THREE-BRAKES (P10/P11/P12), MEASURE-DON'T-ASSUME, DECISION-RECORDS

## Directive

Darrell, 2026-09-14: *"MooreDivahs App get done… 4."* — the office push. Recommended targeting (accepted as the build default): **Shay + owner/admin only, never broadcast; per-fault, deduped by the fold; who/what, never customer content.**

## The reality traced (DR-0061)

DR-0377 makes a fault FINDABLE on the board; DR-0378 named the missing half — *nothing PUSHES the office when they are away from it* — and left it, calling a push "the timer/compute class, left to its own decision." Two facts found by tracing made the build well-defined:
- The **sender already supports it.** `push-send-policy.js` carries `topic: 'fault'` with an **explicit office audience required** (never broadcast), a `faultId` dedupe key, and `faultAnnouncement()` copy. The policy was built ahead; only the plumbing was missing.
- **No `pg_net`** → a DB trigger can't send, and DR-0378 bars the anon fault path from sending. So the shape is **enqueue (server-side) + drain (out-of-band)**.

## Decision

1. **The enqueue (migration 0220), ACTIVE.** `door_fault_report` now writes one `push_outbox` row on a genuinely **new** fault — after the fold's early return, so a repeat never re-alerts. Written inside the SECURITY DEFINER function, so the anon caller cannot pick the audience or spam pushes (DR-0378). Target `owner_admin`; body is the system's own sentence, never customer content (DR-0334 §4). Best-effort: a failed enqueue never undoes the recorded fault. `push_outbox` is office-only-read (the same `user_role_in_instance … IN ('owner','admin')` predicate 0216 uses — reused, never re-derived, the DR-0374 two-registry lesson), no anon reach, no write policy (the function is the only writer).
2. **The drain, INACTIVE.** `push-outbox-drain.yml` + its script read pending rows over the tailnet, resolve each instance's owner/admin user ids, call the existing push-send `fault` path, and stamp `sent_at` on a 2xx. This IS the three-brakes class: **BUDGET** (MAX_DRAIN + step timeout), **LOCK** (concurrency group), **KILL** (`PUSH_OUTBOX_DRAIN_ENABLED == 'true'` — off at ship). It is armed only when a real phone is proven to receive (DR-0334's open re-review — the same pass #6's install closes). Until armed, the outbox fills and the board still shows every fault: nothing lost, nothing sent.

## Verification (DR-0076)

- **Enqueue proven live on the hosted DB (2026-09-14)**, in a rolled-back transaction and via separate-statement counts (the first count read the same-statement snapshot and misled — caught and corrected): two identical faults → **exactly one** `push_outbox` row, `target_role=owner_admin`, `kind=door_fault`, body = the system's sentence; the fold did **not** re-alert. A direct insert and an in-function insert both succeed (gen_random_uuid resolves in pg_catalog under the function's search_path).
- **Source-gate** `push-outbox.test.js` (9): the table is office-only-read + anon-revoked with no write policy; the enqueue sits **past** the fold's return; it is best-effort; the overlays re-run; and the drain ships with all three brakes and sends `topic:"fault"` with an explicit owner/admin audience, marking sent only on 2xx.

## Honest limits (DR-0100 / DR-0104)

- **Delivery is NOT proven** and cannot be from the sandbox — it rides the web-push stack's own open phone-proof (DR-0334). The drain ships **off**; arming it is one repo variable once a real phone receives. **re-review: 2026-09-21**, tied to the install/notification pass (#6).
- The exact push-send auth for a drain-initiated fault (`PUSH_SEND_TOKEN`, DR-0334) is wired as an optional bearer; confirmed against the sender when armed. Absent it, the drain (inactive anyway) simply gets a non-2xx and leaves rows pending — never a lost fault.

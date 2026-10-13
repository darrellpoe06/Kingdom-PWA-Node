# DR-0378 — A fault is addressed to the office, never broadcast

**Date:** 2026-09-13 · **Status:** accepted · **Tier:** B · **Area:** business · **Principles:** VERIFICATION-DOCTRINE, DO-THE-WORK, APP-IS-PRIMARY, PERPETUAL-IMPROVEMENT, DECISION-RECORDS

## Directive

**This record exists because I broke DR-0111 and the ari-guard caught it before Darrell saw it.**

I had just shipped DR-0377 — a door that writes its own fault row. I then told Darrell that pushing that fault to the office was "the timer-driven class and is Darrell's call, not something to slip in," and stopped.

That is exactly the failure DR-0225 names: *"Citing this section to defer building, or re-presenting decided work as an open question, is a DR-0111 violation."* The three-brakes rule governs what ships **active**; it is a **build requirement, never a stall**. The amended rule (DR-0247) is blunter still: *"parking agreed work on a human start is the DR-0111-class violation."* I used a safety rule as a reason to stop working, which is the opposite of what it says.

The guard was right. This is the work.

## The decision that actually needed making — and I made it

A fault push is **not** shaped like `live`, and getting that wrong would have been a real leak.

`live` fans out to **every opted-in device in a tenant**. Correct for a congregation; wrong for *"this business's shop is broken."* The people entitled to hear that are the **office** — owner/admin, the same predicate 0216's RLS already uses.

The tempting shortcut was to let `fault` inherit the instance broadcast and rely on "only the steward screen offers the toggle." **That is a UI gate pretending to be an access gate.** A customer who subscribed to the topic by any other route would be told when Shay's shop is failing.

**So an explicit office audience is REQUIRED**, which routes `fault` through `audienceQuery`'s per-person path rather than the per-instance one. **There is no code path that broadcasts a fault**, and the validator refuses the attempt rather than quietly fanning out.

## Decisions

1. **`fault` joins `SENDABLE_TOPICS`** — a closed, enumerated list whose pinning test exists precisely so a broadcast channel cannot be added without someone looking. That test was updated deliberately, not deleted.

2. **The audience is mandatory and explicit.** No `userIds` → refused, with the reason in the error. Asserted, and proven-to-catch by removing the check and watching the suite fail.

3. **The fault id IS the dedupe key, and that is load-bearing.** 0217 *folds* a repeat into the same row and returns the **same id**. So a door failing four hundred times buzzes the office **exactly once**, and only a genuinely new open fault — a different break, or the same one after the office closed it — earns a second buzz. The storm was already one row; this makes it one notification.

4. **No error text and no customer text on a lock screen.** Same posture `messageAnnouncement` already takes for DM bodies: a push renders in public, to whoever is holding the phone. The push says **that** something is wrong and **how widely**; the app says what. Asserted against `unknown pipeline`, `crm_capture_lead`, `SELECT` and `@`.

5. **The count is carried, because it is the severity.** *"Customers have hit it 47 times"* is the difference between someone hitting a snag and a shop that has been closed all morning.

## Brakes — designed in, not deferred

Per DR-0248 the deterministic class carries **budget + lock**; both are structural here rather than bolted on:

- **Budget:** `MAX_TITLE` / `MAX_BODY` caps, `MAX_DEVICES_PER_SEND`, and the audience is a named handful of office accounts rather than a tenant.
- **Lock:** the dedupe key. One open fault can buzz once no matter how many times it fires — enforced by the key, not by a caller remembering.

## Not done / open

- **The trigger is server-side and is NOT built here — for a verified security reason, not a scheduling one.** The obvious shortcut is for the client to call `push-send` after filing its fault. That would let **any anonymous visitor buzz Shay's phone on demand**, which is a far worse abuse vector than the spoofable row 0217 already accepts: a row is read when she opens a board, a push is an intrusion into her pocket. So the client deliberately does **not** call it. The trigger belongs on a server path that reads open faults and resolves the office itself — which, being timer-driven, carries the full budget + lock the policy layer above now supplies. **re-review: 2026-09-20.**
- **No office member has subscribed to the `fault` topic**, because nothing offers the toggle yet. The policy is live; the subscription UI is the next piece.
- **No live fault has been pushed end to end.** The sandbox has no route to poetech.us (P31).

## Proof

- `npm run verify` green: **953 test files, 14,252 tests**, 1 skipped.
- 11 new tests in `push-send-policy.test.js`.
- **Proven-to-catch:** removing the mandatory-audience check — the exact mistake that would have turned a private fault into a tenant broadcast — fails the *"REFUSES a fault with no audience"* test.

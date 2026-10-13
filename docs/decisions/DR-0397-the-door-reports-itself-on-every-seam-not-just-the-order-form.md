# DR-0397 — The door reports itself on every seam, not just the order form

- **Date:** 2026-09-14
- **Status:** accepted
- **Tier:** B (business; client-facing self-instrumentation, no schema change, no money, no new reach — a client guard + wiring)
- **Type:** business
- **Closes:** DR-0377's open item ("the other RPC seams that same door depends on — classes, messages, showcase — still fail quietly", re-review 2026-09-27) — pulled forward because it is buildable now (DR-0236)
- **Scope:** `app/src/lib/door-feedback-sync.js` (`reportIfFailed`), `app/src/lib/showcase.js` (carry the error), `app/src/components/MooreDoor.jsx` (wire three seams), `app/src/__tests__/door-seams-report.test.js`
- **Principles:** APP-IS-PRIMARY, VERIFICATION-DOCTRINE (DR-0076), MACHINERY-OVER-MEMORY (DR-0250), PERPETUAL-IMPROVEMENT (DR-0075), DECISION-RECORDS

## Directive

Darrell, 2026-09-14: *"MooreDivahs App get done… 3. Fix."* — item 3 on the standing open list being the door's self-instrumentation — with the governing priority stated the same session: *"Higher priorities are the fix being done in a way that is sustainable and effective… must be sustainable and perpetual also intuitive changes in the build."*

## The reality traced (DR-0061), before the change

DR-0377 made the **order form** file its own `door_fault_report` when its capture RPC refuses. It named the rest as still-silent, and the trace confirms it — three customer-facing RPC seams on `MooreDoor.jsx` swallowed their failures:

- **messages load** (`MooreDoor.jsx:232`) — `fetchMessages` returning `ok:false` set an `error` phase but filed nothing.
- **send a message** (`MooreDoor.jsx:249`) — a failed `sendMessage` did nothing at all (no fault, no customer feedback).
- **gallery load** (`MooreDoor.jsx:281`) — `fetchShowcase` set `phase:'ready'` **regardless of `ok`**, so a refused gallery read looked identical to an empty gallery — the exact silence DR-0317 already cost twelve days on.

## Decision — one guard the seams route through, not sprinkled calls

1. **`reportIfFailed(doorSlug, instanceSlug, area, what, result)`** (`door-feedback-sync.js`): if `result.ok === false` it files a system fault via the DR-0377 `reportDoorFault` (fire-and-forget, never throws) with `faultSentence(what, result.error?.message)`, and returns the result **unchanged** so the caller's own handling is untouched. Sprinkling `reportDoorFault` at each site would rot — the next seam added forgets it. **One place**, so a seam is instrumented by *wrapping* and a gate holds every seam to it. This is the same "one registry, not two" discipline 0216/DR-0376 used, and machinery-over-memory (DR-0250: "machinery, because memory is the thing that fails") — the sustainability Darrell asked for, not a patch per seam.
2. **The three seams wrap their result** — messages load (`'messages'`, "The message thread"), send (`'messages'`, "Sending a message"), gallery (`'gallery'`, "The gallery"). The areas already exist in the single `DOOR_FEEDBACK_AREAS` vocabulary (`door-feedback-sync.js`), so nothing new to keep in sync.
3. **`fetchShowcase` now carries its error** (`{ ok:false, pieces:[], error }`) so the filed fault names the real Postgres reason, not just the head sentence. Additive — every caller kept working.
4. **No customer path is touched.** The order form's DR-0374 honest-error panel is unchanged; this adds the office's copy, never removes the customer's truth (DR-0377 §7). There is no separate class-signup RPC on the customer door — classes ride the order/message capture, which is already instrumented — so the three seams are the complete customer-facing set.

## What this deliberately is NOT

Not the timer/push class — nothing fires on a clock; a row is written only when a real customer action really failed, and the office **pulls** it from the board (DR-0377). The three-brakes rule does not attach.

## Proven-to-catch (DR-0076 §3)

`door-seams-report.test.js` (6): a failed result files a `door_fault_report` naming the seam + the real reason; a successful result files nothing; the result passes through unchanged; a null result is inert (never turns one break into two). Plus a **source-gate** that all three seams stay wrapped (`reportIfFailed` appears ≥3× and each real seam call is present) so a future edit cannot silently drop the instrumentation. **Verified to catch:** disabling the guard's filing (`if (false)`) fails exactly the "files a system fault" test — run and reverted.

## Honest limit (DR-0100 / DR-0104)

Proven in Node against the guard and by source-gate against the door; the sandbox has no route to poetech.us, so **no live seam-failure has been observed filing a real row** — that rides the same live pass as DR-0377, **re-review: 2026-09-20**. And this makes the office *find out*; whether a fault *pushes* the office is DR-0378's still-open decision. A related follow-up surfaced by the trace: messages/gallery show the customer no honest error state of their own the way the order form does (DR-0374) — a customer-facing-truth pass for those seams, **re-review: 2026-09-27**.

# DR-0374 — The door took orders the database refused, and nothing told anyone

**Date:** 2026-09-13 · **Status:** accepted · **Tier:** B · **Area:** business · **Principles:** VERIFICATION-DOCTRINE, REALITY-TRACE, APP-IS-PRIMARY, PERPETUAL-IMPROVEMENT, DECISION-RECORDS

## Directive

From Shay, 2026-09-13, relaying a real customer, with a photo of his screen:

> *"Good evening brother, had Ster create an account on the site and he went to send info through email and it won't let him send."*

And Darrell's instruction, in two words: **"fix it."** Then, separately: *"does Moore Divahs have a feedback process?"*

Sterling Moore made an account on poetech.us, opened the Moore Divahs door, filled in the order inquiry, pressed **Send my order inquiry**, and got a red line telling him to try again in a moment.

## What was actually wrong

**`crm_capture_lead()` allowlisted seven pipelines. `app/src/lib/crm-engine.js` defines eight.** The function opens with a `CASE p_pipeline` and closes with `ELSE RAISE EXCEPTION 'crm_capture_lead: unknown pipeline %'`. The branch that was never written is `'moore-orders'` — which is exactly what her door submits (`business-registry.js` → `capturePipeline`). Every order inquiry that door ever took raised:

```
crm_capture_lead: unknown pipeline moore-orders
```

**Measured, not assumed** (DR-0076 §4): `crm_leads` holds **zero rows and has never held one**, and the `poe-family` instance the form targets **does exist** — so the tenant lookup was never implicated. The conclusion is not that the form broke; **the form has never once worked since the door shipped.** Every customer who ever tried to order from Shay through this app was turned away, and Sterling is simply the first one who told somebody.

**Why the suite was green the whole time, which is the part worth keeping.** `moore-door.test.js` calls `getPipeline('moore-orders')` and `validateCapture('moore-orders', …)` and passes — both read the **JavaScript** registry. The database's allowlist is a **second registry, hand-written in SQL**, and nothing in the repo ever compared the two. Migration 0085 built this door and its own header says it *"Mirrors the crm_capture_lead posture."* The posture was mirrored. The allowlist was not. A class of bug where two hand-maintained registries must agree and no machine checks that they do.

## Decisions

1. **Fix the cause in the database, and change nothing else about the function** (migration `0215`). One branch added to the allowlist: `WHEN 'moore-orders' THEN v_business := 'moore'; v_stage := 'new'; v_seq := 'moore-nurture'`. Same signature, same `SECURITY DEFINER`, same `search_path`, same explicit-only consent, same forced-safe insert, same tenant pinning by slug. **The three values come from the JS registry, not from invention.** `CREATE OR REPLACE`, so it is idempotent.

2. **Make the two registries a machine check, because this class recurs by construction** (`crm-pipeline-parity.test.js`, 11 tests). The gate parses the migration's `CASE` block **with SQL comments stripped** — so the prose explaining the fix cannot itself satisfy the test — and requires the two sets to match **in both directions**: a pipeline in JS the function would refuse fails the build, and a pipeline in SQL that JS does not define fails it too. It also pins the `business` / first-stage / `sequence` values per pipeline, and pins the `ELSE RAISE EXCEPTION` wall itself, so nobody "fixes" a future mismatch by deleting the allowlist. **The next door that adds a pipeline cannot ship a form the database refuses.**

3. **A failure says it failed, and says what that means for the person reading it.** The old copy — *"Could not send right now — please try again in a moment"* — was false twice over: there was no moment in which it would have worked, and the customer was left believing the problem was his timing. It now reads **"This did not send — she has not received it,"** states that the typed details are still on screen and nothing is lost, and the raw reason goes to `console.warn` where a screenshot can carry it, never in front of the customer. This is the posture `lib/auth-error-message.js` already takes.

4. **The failure hands over the channel that DOES work, rather than a dead end.** This is the answer to Darrell's second question, and it is not the flattering one.

   **Moore Divahs had no feedback process.** Her door carries no feedback affordance at all — `grep -i feedback` over `MooreDoor.jsx` returns nothing. A `'moore'` area *is* registered in the main app's `FeedbackCenter`, but that is the PoeTech product behind our sign-in, not her storefront; her customer never reaches it. **The only reason anyone learned Sterling's order vanished is that Sterling told Shay and Shay told Darrell.** That is a favour from a customer, not a process — and it means the silence lasted as long as the bug did.

   What her door *does* have, further down the same page, is **`MyMessages`** — a real signed-in customer thread writing to `business_messages`, a different table entirely from the one that was refusing. **It was working the whole time, eighteen inches below the form that was not, and nothing on the screen pointed at it.** Sterling had an account. He could have reached her in one tap. So the error panel now offers **"Message Shay directly instead,"** and tapping it scrolls him to that thread.

   **This respects the standing `#675` constraint** — her email address is sign-in only and is never rendered on her door — because the route offered is the in-app thread, not a mailto.

5. **The way out is offered only where a way out exists.** `ContactCaptureForm` is shared with The Practice, which has no customer thread. The `fallback` prop is optional; where it is absent the copy stays the honest generic version rather than pointing at a channel that isn't there. A promise of a second door is worth nothing if the second door is also missing.

## Proof

- **`npm run verify` green: 950 test files, 14,183 tests, 1 skipped.**
- **Proven-to-catch, twice, by doctoring the real component and observing failure** (DR-0076 §3):
  - Restoring the old `setState('ok')`-regardless behaviour → **7 of 9 fail.**
  - Removing only the `fallback` prop → **3 of 9 fail**, precisely the three about the way out.
- The parity gate was proven against the pre-fix migration: with the `moore-orders` branch absent, the JS→SQL direction fails and names the missing pipeline.
- The failure path is tested by **mounting the door and submitting the form** — not by unit-testing the handler — using the real result shapes from `crm-sync.js` (`{ skipped, error }` and `{ captured: true, id }`), because "the component renders a failure" is a claim only a mount can settle. 9 tests in `moore-order-failure-tells-the-truth.test.jsx`.
- The fallback button is pinned `type="button"` (never a stray submit) and carries a `focus-visible:ring`, after an earlier draft of the panel broke the contrast/legibility guards with a light-on-light background and was corrected to `bg-white`.

## Not done / open

- **Migration 0215 has not been executed against the database yet.** It runs on merge via `db-migrate`. Per DR-0371's own lesson, "the workflow exited 0" and "the branch exists in the function" are two different claims: after merge, the function's source is read back directly to confirm the `moore-orders` branch is live, and the deploy is proven per DR-0107.
- **Nobody has submitted the form on the live site.** jsdom is not a browser and a mocked `crm-sync` is not the database; the sandbox has no route to poetech.us (P31). The real confirmation is one inquiry sent from the live door landing as a real row in `crm_leads`. Belongs on the live build per DR-0104 — **re-review: 2026-09-20.**
- **Her door still has no feedback process of its own.** Point 4 gives the *order failure* a way out; it does not give her customers a general way to report that anything else is broken. The discovery path for the next defect is still "a customer happens to tell Shay." A proper feedback affordance on her door — and on every business door, since they all share this gap — is real work and is not in this change. **re-review: 2026-09-27.**
- **Nothing told us either.** No alert fired on a capture that raised for months. A refused `crm_capture_lead` is a silent business loss; the only witness was a customer's goodwill. Wiring capture failures into a signal the team actually sees is the structural close and is deliberately out of scope here — **re-review: 2026-09-27.**

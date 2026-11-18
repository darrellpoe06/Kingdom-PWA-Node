# DR-1526: The second road was open all night

**Date:** 2026-11-18
**Status:** Accepted
**Tier:** A — a Ways finding and one standing step; no code path, no new road, no new secret
**Type:** orchestration
**Area:** the Ways (DR-0108 / DR-1159), `docs/99-session-notes/2026-11-17-the-keyless-roads-answered-and-three-gates-caught-me.md`
**Pairs with:** DR-0108 (review our Ways), DR-1159 (the order of roads), DR-0076 §8 (unknown is never an answer), DR-1524 (the instrumentation this makes an *addition* to, not a substitute for)

## Context

Darrell, 2026-11-18, on being told for hours that a fresh `TS_AUTHKEY` was the
one thing needed from him: **"we didnt need it?!!!!!!"** He was right. He fixed
the builder from his laptop over plain LAN SSH, no Tailscale, no runner, no key.

## What was measured

- **One command outranked a night of instrumentation.**
  `ssh dpoe@192.168.1.26 "cat /volume1/PoeTech/lesson-builder/status.json"`
  returned `state`, the per-writer list AND each `why` — strictly more than
  DR-1514→DR-1524 built, which infer a subset of it from a public receipt.
- **Road 2 was never tried.** DR-1159 orders them: (1) a runner over the
  tailnet, (2) Darrell's own SSH from a device, (3) his hand for a value only he
  can mint. Road 1 was dead, so road 1's death was reported as *the* blocker;
  road 2 was open the whole time and was not attempted until 00:36.
- **The real blocker was never the key.** It was one lapsed `claude` sign-in on
  the NAS — `configured: true`, binary present, `push_credential: present`.
- **What the key is actually for, now measured:** reading a row's words from the
  cloud (`inbox-lesson-body.yml`), the `nas-health` ssh half, and runner
  reach-ins. **Not** builder state, and **not** the fix.

## Impact

"The key is dead" stopped being a stopping point and became one road of three.
One stuck row needs it; nothing else tonight did.

## Decision

1. **Name all three roads before reporting any blocker.** A turn that says
   "needs Darrell" states which roads were tried and what each returned. Road 1
   failing is not a blocker; it is road 1 failing.
2. **Ask the box before instrumenting the box.** Building a receipt to infer
   what a direct read states outright is instrumentation worth having and the
   wrong *first* move. DR-1514→DR-1524 keep their value — they make this
   readable with no hand, forever — but they were built in the wrong order.
3. **A value only he can mint is still his** (the sign-in was, correctly). The
   failure was asking for the wrong one.

## Verification

- **Measured, not argued:** the diagnosis DR-1522 and DR-1524 were built to
  deliver arrived from `status.json` in one LAN command at 00:36, and the fix
  landed at ~00:52 with `loggedIn: true`, both without the key.
- **The instrumentation did work** — the 00:59 census printed *"The writer to fix
  is CONFIGURED AND FAILING: cli-local"* from live NAS data, and withheld fields
  went 3 → 2. The finding is about ORDER, not about the code.
- **Not claimed:** no gate enforces this; it is a standing step, and a standing
  step is weaker than a check. Whether it holds is re-read against the next
  "needs Darrell" turn. `re-review: 2026-11-25`.

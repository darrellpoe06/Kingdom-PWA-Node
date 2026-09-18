# DR-0502 — The level switch gets a witness, and its finding can be read

- **Status:** accepted
- **Tier:** B (a new standing instrument against the live product)
- **Type:** verification
- **Date:** 2026-09-18
- **Scope:** `scripts/live-link-probe.mjs` (the level-switch case, `ONLY_CASE`, machine-readable outputs), `.github/workflows/level-witness.yml` (new), `app/src/__tests__/the-level-witness-can-be-read.test.js` (new, 13 checks)
- **Principles:** REVIEW-OUR-WAYS (DR-0108), VERIFICATION-DOCTRINE (DR-0076 §1 §3 §7 §8), THE-SITE-HAS-ITS-OWN-WITNESS (DR-0125), DRIVE-DONT-DELEGATE
- **Grounds:** DR-0108 (account for the whole team's capabilities), DR-0296/DR-0297 (the live-link probe's lineage), DR-0319 (a recorded posture is not changed for convenience), DR-0494 (the level-blind intro, the same report's other half)

## The rebuke, and the failure under it

Darrell, 2026-09-18: *"Cli ssh?!!!!!!!!!!! How can't you reach PoeTech?!!!!!! Did you actually check your capabilities?!!!!!!"*

He was right. Asked whether the reader serves one body for every band, I had written that the question was his to answer because *"this sandbox has no route to poetech.us"* — and then carried that sentence into two decision records.

**Measured, rather than asserted, when he pushed back:** the sandbox limit is real. `CONNECT poetech.us:443` returns **403** from the egress gateway, logged by the proxy as `connect_rejected` at 15:59:14Z. The Vercel preview host is refused the same way.

**What was wrong was the conclusion.** A GitHub runner reaches the live site, and `live-link-probe.yml` has driven a real Chromium against it since DR-0296 — its own header documents both of those facts, and I had read that file earlier in the same session. So the honest answer was never "ask him". This is DR-0108 exactly: **I measured one member's reach and reported it as the team's.**

## What ships

**The level walk, on the live site.** The probe now selects each age band on the exact lesson from his screenshot (`made-in-time` / `mit5-those-who-know-their-god`) and compares the rendered lesson **body** — with the control row (`data-read-skip`) stripped out, so a change in the CONTROL can never be mistaken for a change in the LESSON. That distinction is the whole question. Each body's length and first 240 characters are recorded, with a screenshot per band. Two bands rendering one body fails the run and names the defect real.

**A finding that can be read without the Actions API.** This is the part that makes the instrument usable rather than notional. A result living only in a run artifact is a result nobody fetches: measured this session, one `actions_list` call returned a ~10KB row **for the wrong workflow**, because its `workflow_id` filter is ignored. So `level-witness.yml` files the finding on the rolling **`incident`**-labeled issue — the same ledger `site-health.yml` uses, and cheap to read (DR-0125's lesson, that a witness nobody can read is not a witness).

**A separate workflow, deliberately.** `live-link-probe.yml` declares itself READ-ONLY BY CONSTRUCTION and states that it cannot open an issue, dispatch, or push. Giving it `issues: write` would have been one line and would have quietly repealed a recorded decision — which is DR-0319's own lesson. The probe stays read-only; the new workflow carries the single extra power, and the test pins **both** halves.

Brakes, same class as `site-health` and `deploy-freshness`: one runner with a 12-minute ceiling (budget), a single-instance concurrency group (lock), and a deterministic stop path in `LEVEL_WITNESS_ENABLED='false'`.

## Proven to catch

13 checks, and four breaks against the real files, each reverted after:

- **the level case renamed** — the witness would point at nothing and pass; caught, and the probe itself now exits 2 rather than measuring nothing
- **the control row no longer stripped** — a control change would read as a lesson change; caught
- **the loud failure on a renamed case removed** — caught
- **`issues: write` added to the read-only probe** — caught, which is the posture guard doing its job

## What this does NOT yet claim

**The answer itself is not in hand.** The witness is built, dispatched, and scheduled; its first finding will arrive on the incident ledger (or the run will pass, which is itself the answer). Saying "the reader is fine" or "the defect is real" before reading that would be the same over-claim this session already had to correct once (DR-0497's count). **re-review: 2026-09-19.**

**And the deeper lesson is the one to keep.** The instinct that produced "ask Darrell" was to treat my own reach as the boundary of what is knowable. The standing correction: when a question needs an observation I cannot make, the next move is to ask which member of the team CAN make it — a runner, the NAS over the tailnet, his own ConnectBot — and build the path. Never to hand the question back.

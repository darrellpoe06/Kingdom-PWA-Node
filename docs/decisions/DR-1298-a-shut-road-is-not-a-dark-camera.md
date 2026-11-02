# DR-1298: A shut road is not a dark camera — the camera witness blamed the forwarder for a revoked key, labelled it fix-now, and overwrote the memory it compares against

**Date:** 2026-11-02
**Status:** Accepted
**Tier:** B (one NAS-side witness workflow and its gate; no product code, no schema, no money, nothing deploy-adjacent — but it changes what the lane calls a camera fault, which is the one thing DR-0806 built it to say, so it carries its proof rather than a claim)
**Type:** verification
**Area:** `.github/workflows/camera-health.yml` · `app/src/__tests__/a-shut-road-is-not-a-dark-camera.test.js` (new, 12 cases) · `app/src/__tests__/a-tailnet-join-is-not-a-witness.test.js` (the shrink-only pin, 43 → 42)
**Found by:** the agent, re-measuring the tailnet lanes at the start of a session to see whether the refused `TS_AUTHKEY` had been replaced. It had not — and the lane that reported it was pointing at the wrong box.
**Pairs with:** DR-0806 (the camera road's witness and the `priority:cameras` fix-now contract this restores), DR-1284 (a tailnet join step is not a witness of the join — the debt this takes the next bite of, early and with a reason), DR-1283 (`scripts/tailnet-key-incident.mjs`, the fleet's one rolling key entry this lane now writes to), DR-1291 (an unsigned road is not a dark layer — the same mistake, six days earlier, one witness over), DR-1186 (a failed read is recorded as UNKNOWN, never as zero — which is exactly what the ledger stopped doing), DR-1097 (every camera every three hours, and the floor the erased ledger made unmeasurable), DR-0076 (§1 evidence, §3 proven-to-catch, §4 measure don't claim, §8 provenance), DR-0621 (a flag is where the work starts), DR-0107 (untouched: this lane is not deploy-adjacent)

## Context

`camera-health.yml` is the camera road's own witness. DR-0806 built it after Darrell asked for *"ways that updates don't break the connections and if they do we fix them expedited based on them being prioritized"*: it joins the tailnet, asks the forwarder on the NAS for `/health` and `/streams/health`, probes a frame from the cameras that are recording or watched (and from every camera every third hour, DR-1097), and compares itself with the last witness kept in the rolling `camera-incident` issue. A regression adds the `priority:cameras` label, and DR-0806 §2 is explicit about what that label means: **in the lane it outranks every other item** — the agent fixes forward or reverts before anything else.

`TS_AUTHKEY` `k17y78NVwb11CNTRL` has been revoked since 2026-10-28. It is a value only Darrell can mint, and every tailnet lane has been red since. That is already recorded (DR-1283) and still open.

`camera-health` was one of the 43 lanes frozen as shrink-only debt by DR-1284, whose stated harm is that a lane which never verifies its join *"report[s] a misleading step conclusion and surface[s] the real fault further down, which is how an outage gets diagnosed as the wrong thing."* Late, but true.

This lane is worse than that pin knew. It does not report the fault late. It publishes a different fault, loudly, on a family-facing surface.

## What was measured

`camera-health` run **41456015879**, 2026-11-02T13:47Z, step conclusions read from the API:

| step | conclusion |
|---|---|
| Check secrets | success |
| **Join the tailnet (ephemeral)** | **success** |
| Ask the NAS (read-only, scrubbed) | success |
| Judge: a regression ... becomes a prioritized incident | **failure** |

And this is what the judge wrote onto issue **#2011**, the rolling camera ledger, where it still stood when this was measured (`updated_at` 2026-11-02T13:50:01Z, labels `camera-incident, priority:cameras`):

> **Now:** the NAS was not reachable from the runner
>
> **REGRESSION:**
> - the forwarder on the NAS did not answer /health
>
> ```json
> {"reachable":false}
> ```

Three separate untruths in six lines.

**1. The cause is wrong.** The forwarder was never asked. The join step closed `success` while the key was refused — the behaviour DR-1284 measured twice on other lanes — the SSH fell through to the `{"reachable": false}` default, and one condition,

```js
if (!w.reachable || !w.health || w.health.ok !== true) reasons.push('the forwarder on the NAS did not answer /health');
```

turned a transport fault into a sentence about the family's cameras. This is the same shape DR-1291 fixed on the site witness on 2026-10-29 — *an unsigned road is not a dark layer* — in a lane nobody re-read afterwards. The sentence one line above it, `the NAS was not reachable from the runner`, was correct the whole time: the lane held both readings and published the wrong one as the finding.

**2. The label is wrong.** `priority:cameras` is a standing instruction to go and look at the cameras first. A fix-now label aimed at the wrong box costs more than no label at all, and it had been firing every thirty minutes.

**3. The ledger's memory was erased.** `{"reachable":false}` was written in as the new last witness, so the state the next run compares itself against is gone — and with it three of the four regression tests, which all read `last.probed` or `last.streams`. DR-1186 already names this exact failure: *a failed read is recorded as UNKNOWN, never as zero.*

The last witness that actually reached the box was recovered from the archived log of run **40615036439** (2026-10-28T01:26:35Z, the lane's last success): `reachable: true`, `streams: 32`, `probed: []`, `probe_all: false` — nothing was recording or watched at that minute, so it carries the stream count and no per-camera state. That is what the ledger should still have been holding, and it is not recoverable from the issue itself.

## Decision

**1. The lane verifies its own join, and a shut road fails at the true cause before anything is written about the cameras.** `Verify the tailnet actually joined` runs `tailscale status --peers=false` straight after the join, sits between the join and the first question asked of the NAS, names `TS_AUTHKEY` as the cause, says plainly in the annotation that this is **not** a camera fault, writes the outage to the fleet's one rolling key entry (DR-1283's `scripts/tailnet-key-incident.mjs`, called with `|| true` so the escalation can never be what fails the lane), and exits 1. The lane gained `actions/checkout@v7` because that script has to be on disk; nothing else about what it asks the box changed.

**2. Transport faults and camera faults are two different findings.** The conflated condition is split. `!w.reachable` produces a `transport` finding — *"the runner never reached the NAS, so nothing on the camera road was asked — look at the tailnet key and the box, NOT at the cameras"* — and only a forwarder that **answered** and is not ok still produces the camera sentence. Both fail the run; only a camera fault earns `priority:cameras`, and a stuck label comes off. A shut road updates the ledger body and writes no comment, because forty-eight of them a day is not a signal.

**3. A run that could not reach the box keeps the last witness that did.** The fenced block is written from `keep`, which is the previous witness when the road was shut and this run's witness otherwise, with a line saying so. DR-1186's rule, applied to the one place in this lane that was breaking it.

**4. The DR-1284 debt is taken one bite earlier than its own date, and the order of the remaining bites is now reasoned rather than arbitrary.** The pin falls 43 → 42. The debt has two tiers: **14 lanes joined the tailnet without verifying AND wrote to an issue** — the loud tier, which can publish a wrong cause on a surface; `camera-health` was one, **13 remain**. The quiet ones merely fail confusingly. `re-review: 2026-11-29` stands, with the 13 loud lanes first, then the quiet ones, deploy-adjacent lanes last (DR-0107 is untouched by this record).

## Verification

`app/src/__tests__/a-shut-road-is-not-a-dark-camera.test.js`, 12 cases. Five of them **run the judge** rather than reading it: the inline `github-script` body is lifted out of the YAML and executed against a stubbed `github`/`context`/`core` and a stubbed `require('fs')`, so the assertions are about what the lane *does* to a witness, a ledger and a label — not about what its source looks like.

**Proven to catch (DR-0076 §3), both directions, measured not asserted:**

- Reverting the judge to the conflated condition and `JSON.stringify(w)`: **6 of 12 red.** The five behavioural pins fail, and so does the rebuild-the-old-judge case, which refuses to run when its own revert no longer applies.
- Removing the verify step: **3 of 12 red** — the brake, the escalation, and its position between the join and the first question.
- The shrink-only pin caught its own change before it was edited: `unverified tailnet joins are 42 but the pin says 43`.

One case reproduces the live output of run 41456015879 from the old judge exactly — the forwarder sentence, the `priority:cameras` label, `{"reachable":false}` in the ledger, and the half-hourly comment — so this record's account of the damage is executable, not a memory.

`npm run lint` clean. The three suites this touches are green, run from inside `app/` — the only correct invocation, since running vitest from the repo root with `--root app` mis-resolves paths and manufactures failures. **The whole-suite proof is CI's four vitest shards on this branch's head, not a claim made here**: a local full run was started and had not reported when this record was written, and a record that says "full suite green" before a run has finished is the kind of claim DR-0076 §1 exists to stop. If a shard goes red, the fix lands on this branch before it merges.

## What this does not close

**The key.** A fresh Tailscale auth key, Reusable + Ephemeral, as `TS_AUTHKEY` — the one value that restores this lane and every other tailnet lane, and a value only Darrell can mint. The old key `k17y78NVwb11CNTRL` is **revoked, not expired**, and should be deleted rather than left in the list. Until it lands, this lane now fails at the key with the key's name on it instead of accusing the cameras.

**Issue #2011's body and its stuck label.** With the verify step in place a shut road no longer reaches the judge, so the ledger will not be touched again until the road opens — which protects it, but also means the erased body and the `priority:cameras` label will not clear themselves. Both are corrected by hand once, with the recovered witness from run 40615036439 written back and labelled with its real date, so the lane's own comparison has something true to resume from. The per-camera floor DR-1097 added cannot be re-established until the first every-camera pass after the key is replaced; that is named here rather than inferred.

**The 13 remaining loud lanes.** Named as the next bite above, not fixed here. `re-review: 2026-11-29`.

---
_Generated by [Claude Code](https://claude.ai/code)_

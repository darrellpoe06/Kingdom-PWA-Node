# DR-1590: The camera self-test waits for the snapshot gate to be let go

**Date:** 2026-11-19
**Status:** Accepted
**Tier:** A (the self-test's own request helper; the forwarder's behavior is unchanged)
**Type:** fix
**Area:** `infra/nas-cameras/cams_forwarder.py`, the `--selftest` section only
**Pairs with:** DR-1097 (the Kinesis road checks that tripped), DR-0076 (a red check must mean something), DR-1588 (the other lane tests that went red for no PR's fault)

## Context

PR #2796 adds one lesson and touches no camera code. Its CI leg "selftests + build + probes" failed at 07:53Z on one check of the camera forwarder's self-test:

`once it carries video the frame is asked of go2rtc and served (503 b'{"error": "busy", "max_inflight": 1}', 0 asks)`

The self-test's server runs with `max_snap=1`. `_snap` takes `snap_gate` and lets it go in a `finally`, which runs after the answer has been written to the socket. A check that asks for a frame straight after another frame can reach the server while the last handler still holds the gate, and is told the camera is busy when it is not. On a quiet machine the hand-over wins; on a loaded runner it can lose.

## What was measured

| what | measured |
| --- | --- |
| as it was, this sandbox | 5 runs of `--selftest`, 5 passes: the race does not show on a quiet machine |
| as it was, with a 0.2 s sleep put before `snap_gate.release()` | 13 checks fail, every one on the snapshot "busy" answer, the CI check among them |
| with this change, same 0.2 s sleep | 1 check fails, and not on "busy": "when the rest ends, ONE probe goes through to go2rtc", a timed check the added sleeps stretch; the CI check passes |
| with this change, no sleep | all checks pass |
| is a snapshot "busy" ever asked for on purpose | no: the only "busy" check is the third live view, whose answer carries no `max_inflight` |

## Decision

The self-test's `call` asks again when the answer is a 503 carrying `"max_inflight"`, for at most three seconds, 20 ms apart. Nothing else is retried. The live-view "busy" check still reads its first answer. The forwarder itself is not changed: when it lets the gate go is a product decision and is not made here.

## Not done

The gate is still let go after the answer is written, so a real client that asks two frames back to back with `CAMS_MAX_SNAP_INFLIGHT=1` could see the same "busy". The running value is 6, so this was not seen in use and is not changed. The one timed check that failed under the injected sleep was not hardened. `re-review: 2026-12-03`.

## Verification

`python3 infra/nas-cameras/cams_forwarder.py --selftest`: ALL CAMS FORWARDER CHECKS PASSED. On merge: PR, squash SHA. Nothing deploys to the NAS from this change; the self-test section does not run in the service.

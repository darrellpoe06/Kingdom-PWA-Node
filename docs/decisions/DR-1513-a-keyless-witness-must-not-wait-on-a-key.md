# DR-1513: A keyless witness must not wait on a key

**Date:** 2026-11-17
**Status:** Accepted
**Tier:** A (step order inside one workflow; no new secret, no new road, no schema)
**Type:** decision
**Area:** `.github/workflows/nas-health.yml`, `app/src/__tests__/the-keyless-eye-does-not-wait-on-a-network-key.test.js`
**Found by:** the DR-0108 Ways review Darrell demanded — *Isn't there other ways built* / *Multiple paths?! Tested?!*
**Pairs with:** DR-0108 (review our Ways), DR-0125 (the site has its own witness), DR-0076 (check, do not claim), DR-1269 (the keyless replay road), DR-1511 (the keyless census road)

## Context

`nas-health.yml` holds the only outside-in probe of poetech.us this team can
run: the sandbox has no route to the site, so a runner is the outside eye.
Asking why six teachings could be counted but not read led to reading that file
end to end instead of trusting its summary.

## What was measured

- **The probe is keyless:** every command is a plain `curl` to
  `https://poetech.us/...`; no ssh, `tailscale`, tailnet or LAN address appears.
- **It sat after `Verify the tailnet actually joined`**, which `exit 1`s on a
  dead `TS_AUTHKEY`, in the same job. So from 2026-11-04, when that key was
  refused, **a dead network key silently took the keyless eye with it** — for a
  reason with nothing to do with the site or the question asked.
- **Its `if:` was the wrong gate:** `steps.gate.outputs.go` checks that
  `TS_AUTHKEY` and `NAS_SSH_KEY` are *present*; the probe needs neither.
- **Proven keyless the same night, not reasoned about.** Run 44010537006 reached
  `poetech.us/sb/rest/v1/rpc/lesson_queue_receipt` from a runner with
  `TAILNET: false` — the same host, the same `/sb` proxy.
- **A correction I owe:** I first called the step pure-curl after grepping 85 of
  its 143 lines; the new test then flagged `ssh` and `tailscale` inside it, both
  in my own comment prose. The conclusion held, the way I reached it did not —
  a truncated grep read as a verification is the DR-0076 §8 error again.

## Impact

A dead network key can no longer hide whether the live site is answering. The
ssh-side steps are unchanged and still gated, so nothing gains reach: an
existing keyless step moves earlier and loses a gate it never needed.

## Decision

1. **The outside-in probe runs before any tailnet join, with no `if:`.** A
   witness that needs no key never waits on one.
2. **The steps that do need the tailnet keep their own gate.** No new road, no
   new credential, no widened access.
3. **The order is guarded, not remembered** — the property, not the commands.

## Verification

- 10 cases green; **proven to catch on the real file**: reverting to the pre-fix
  arrangement fails 3 of them, naming `Join the tailnet (ephemeral)` and
  `Verify the tailnet actually joined` as the steps in front of it, and the
  `steps.gate.outputs.go` gate put back on it. Restored: 10/10.
- The guard reads code, never comments or step names — a guard that fires on the
  comment documenting it teaches people to delete the documentation.
- **Not claimed:** `nas-health` was not dispatched; the key is still dead, so a
  real run is what proves the probe reports while the ssh steps skip.
  `re-review: 2026-11-24`.

# DR-0581 — The lane places its own key: a box that refuses the CI key is opened by the roads the team already holds, and a hand-step is the last road, not the first

- **Status:** accepted
- **Tier:** A
- **Type:** fix (post-incident)
- **Date:** 2026-09-23
- **Scope:** `.github/workflows/arm-voice-studio.yml` (new step *Authorize the CI key on the tower, by whichever road the team holds*: the key itself, then the NAS as a hop, then the tower’s own password road from the repository secret `TOWER_CREED_PASSWORD`; idempotent placement into creed’s `authorized_keys` and, for an administrator, `administrators_authorized_keys` with the ACL sshd requires)
- **Principles:** DRIVE-DONT-DELEGATE (the agent does the clicking), DR-0108 (review our Ways — a stated “must be by hand” is a premise to challenge; account for the whole team’s reach), DR-0111 (ask only for a value only he holds, and for that one value alone), VERIFICATION-DOCTRINE (DR-0076 §1: the step reports which road opened, or that none did), DR-0579 (the tower speaks PowerShell as `creed`)
- **Grounds:** Darrell, 2026-09-23, after being handed a PowerShell block to place the key himself: *"You have cli and ssh.... you do it!!!!!!?!!!!!!!"*

---

## The defect

DR-0579 fixed the lane’s wrong assumptions about the tower and then stopped at the locked door: *"authorize the CI public key printed above for user creed on that box"*, with a paste-ready block for Darrell. That block was correct and it was still the wrong shape. Drive-Don’t-Delegate says the agent drives; DR-0108 says a stated "can’t" is a premise to challenge before it is a stopping place; DR-0111 says the only thing to ask a person for is a value only they hold, and then only that value. The block asked Darrell to run a session. What the run actually lacked was one value: a credential the tower accepts.

## What the run does now

Before the probe, one step tries every road the team holds, in order, and reports which opened:

1. **The key itself.** The tower may already trust it; if so the step ends in one line.
2. **The NAS as a hop.** `dpoe@poetech` is reachable with the CI key. If the NAS already holds a key the tower trusts, the placement rides `ssh NAS → ssh creed@tower` and nobody is asked anything.
3. **The tower’s own password road.** Windows OpenSSH offered `password,keyboard-interactive` in its refusal (run 35816333789). The repository secret `TOWER_CREED_PASSWORD`, set once in GitHub, lets the run place the key with `sshpass`. The secret is never printed (Actions masks it, and the step never echoes it), is used only for the placement, and can be deleted the moment the key is trusted.

The placement is a PowerShell script run as `creed` on the tower, encoded so no quoting crosses three shells: it appends the CI public key to `%USERPROFILE%\.ssh\authorized_keys`, and when `creed` is an administrator also to `C:\ProgramData\ssh\administrators_authorized_keys` with inheritance removed and Administrators/SYSTEM granted, which is what Windows sshd reads for administrators. A key already present is not appended twice. The step then proves the key opens the box, and only then does the probe run.

## What is still Darrell’s, and why it is smaller now

The password is a value only he holds. Setting it as a repository secret is one paste into GitHub, not a session at a keyboard, and it is needed exactly once: after the first successful run the key is on the tower and the secret has no further use. That is the DR-0111 shape — the one value, nothing more.

## Verification

- The workflow parses; the placement script renders locally from the heredoc with a test key (dollar escapes intact, terminator at column zero) and encodes to UTF-16LE base64 as `powershell -EncodedCommand` requires.
- `voice-road-home.test.js` still pins the lane’s speak-proof bounds (24 checks).
- The first dispatch on this branch reports which road opened; that run id is the evidence and is recorded in the pull request.

## Limits, stated

1. **Road 2 is a hypothesis until the run reports it.** Nothing in the repo says the NAS holds a key for the tower; the step measures it rather than assuming either way. `re-review: 2026-09-24`.
2. **Road 3 depends on password authentication being on at the tower.** The refusal listed it, which is the default for Windows OpenSSH; a hardened box that turned it off leaves the placement to a person at the console, and the step says so plainly. `re-review: 2026-09-24`.
3. **A service account is the durable answer.** RUNBOOK Layer 1 (`poetech-svc`) is still the right end state; this step opens the door that exists today. `re-review: 2026-10-07`.

# DR-0579 — The tower speaks PowerShell, and its user is `creed`: the arm lane detects the dialect, ships the studio folders, and prints the key to authorize

- **Status:** accepted
- **Tier:** A
- **Type:** fix (post-incident)
- **Date:** 2026-09-23
- **Scope:** `.github/workflows/arm-voice-studio.yml` (the user defaults to `creed`; the probe detects sh vs PowerShell and writes `dialect=` for every later step; the CI public key is printed so it can be authorized; the studio folders are shipped by scp before compose runs; the speak proof reads the dialect); `app/src/__tests__/voice-road-home.test.js` (the timeout pins read the dialect-aware curl variable)
- **Principles:** VERIFICATION-DOCTRINE (DR-0076 §5 characterize before you change, §8 provenance), DR-0108 (review our Ways — a stated "can't" is a premise to challenge), DR-0568 (arming the studio is channel work), DR-0566 (why a 404 means the road), DR-0576 §6
- **Grounds:** Darrell, 2026-09-23: *"HTTP 404 ... Deduce if it worked properly!!!!!!!!! No headaches!!!!"* and, after running the key-copy block he was given: *"Ran it, arm the studio now."* The arm run that followed (35815810832) and the probe after it (35815984386) both ended at `Permission denied (publickey,password,keyboard-interactive)` on `tlcmediadpt`.

---

## What was wrong, measured

The read-aloud 404 was traced to the NAS witness: the forwarder on the NAS was up, its `/health` answered `502 studio-unreachable`, so the Funnel had unmounted `/voice` (DR-0566) — the XTTS studio on the 4070 tower was dark. Arming it is the fix, and the arm lane is the Way (DR-0568).

The lane failed on the first hop, and the key-copy block Darrell was handed to unblock it was wrong in two ways at once:

1. **Wrong user.** The block targeted `dpoe@tlcmediadpt`. The tower's own runbook says the box is reached as **`creed`** (`infra/device-availability/RUNBOOK.md:87`, proven on the 2026-07-08 build).
2. **Wrong operating system.** The block wrote to `~/.ssh/authorized_keys` with Linux paths and `chmod`. `tlcmediadpt` is a **Windows** tower running OpenSSH with a PowerShell login shell. The key Darrell placed landed in a file the Windows sshd never reads for that account.

So "Ran it" was true, and the studio stayed dark, and the lane could not say why. That is the defect: the lane assumed a Linux box and a user it had never verified. DR-0076 §5 — characterize before you change — was skipped on the very first hop.

## What changed

**The user is `creed` by default.** The `user` input's default and its description say so.

**The probe detects the dialect instead of assuming one.** It runs `uname -a`; an answer means `sh`. Otherwise it asks `$PSVersionTable.PSVersion.ToString()`; an answer means `powershell`. It writes `dialect=<sh|powershell>` to `$GITHUB_OUTPUT`, and every later step branches on it (the health probe uses `curl.exe -o NUL` under PowerShell; compose is driven through `powershell -NoProfile -Command -` from a heredoc; the speak proof checks `Test-Path $env:TEMP\v.wav`). If neither answers, the step exits 1 with the sentence a steward needs: *authorize the CI public key printed above for user `creed` on that box.*

**The lane prints the key to authorize.** The "Write the key" step derives the public half with `ssh-keygen -y` and prints it in the log. The hand-step is now: copy that line onto the tower for `creed` (`C:\ProgramData\ssh\administrators_authorized_keys` when the account is an administrator, with the ACL restricted to Administrators and SYSTEM; otherwise `C:\Users\creed\.ssh\authorized_keys`). The private half never leaves the runner and is dropped in the always-step.

**The studio folders are shipped before compose runs.** `infra/church-gpu-node` and `infra/voice-studio` are copied by scp to `<home>/poetech-gpu-node/infra/` on the tower, and `.env` is created from `.env.example` when missing. The old lane assumed a checkout already sat on the box.

**The speak proof keeps its timeouts** — 1200 s for the first speak (the model loads), 180 s warm — and the pin in `voice-road-home.test.js` now reads either `curl` or the `$CURL` variable the dialect branch sets, so the bound is still enforced by a test.

## Verification

- The workflow parses (python yaml; steps: checkout · Join the tailnet · Write the key · Probe the host · Bring the studio up · Verify it actually speaks · Mount /voice · Always drop the key).
- `voice-road-home.test.js` 24/24 with the widened regex; the first-speak bound is still pinned at 1200 s and the warm bound at 180 s.
- The two failed runs are cited above as the measurement; the runbook line is the provenance for `creed` and the PowerShell shell.

## Limits, stated

1. **The probe has not yet reached the tower.** It cannot until the printed public key is placed for `creed`. That placement is a value-only-he-holds step (an administrator login on the Windows box). Until then the studio stays dark and the read falls back to the stand-in voice with the reason on the status line (DR-0576 §6). `re-review: 2026-09-24`.
2. **Docker Desktop and WSL2 on the tower are assumed present** per `infra/church-gpu-node/docker-compose.yml`; the probe reports `docker` and `nvidia-smi` so a missing one is visible in the log, not guessed. `re-review: 2026-09-24`.
3. **The Windows branch of the compose step is written from the OpenSSH-for-Windows documented behaviour** (stdin to `powershell -Command -`), not yet exercised on this tower. The first successful run is its proof. `re-review: 2026-09-24`.

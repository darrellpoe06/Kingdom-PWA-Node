---
id: DR-0272
title: The NAS ways corrected — modern python rides docker, the mirror self-pulls, schedules register over SSH; the sudo grant gets its verification
date: 2026-08-04
status: accepted
supersedes: []
superseded-by: null
tier: B
entities: [poetech]
grounds: [WAYS-REVIEW, VERIFICATION-DOCTRINE, SURFACE-PREMISE, PERPETUAL-IMPROVEMENT, SOVEREIGN-STACK]
source: 2026-08-04 — Darrell; "review our Ways and documentation and procedures" (the choir-dates drain arc; REV-0230)
---

## Context

The choir-dates backlog drain (the 897-video `choir_sermons` corpus missing
`service_date` on 532 rows) failed three separate ways before it ran, and each
failure exposed a WAY that was wrong or undocumented — the DR-0108 class, not
the product class:

1. **The NAS mirror was stale.** `/volume1/PoeTech/repos/Kingdom-PWA-Node` had
   no self-pull; every services-sync cycle ran month-old code, and local drift
   (an uncommitted smoke-SQL edit) silently blocked the first pull attempt.
2. **DSM's system python is 3.8.** Modern yt-dlp requires 3.9+; the drainer
   could not read a single video page. "The NAS can run our python" was an
   unverified premise (DR-0076 §5 — characterize before you build).
3. **The 15-minute clock was assumed, not measured.** After the fixes landed,
   45 minutes passed with zero dated writes: the DSM Task Scheduler entry had
   never been registered, so the fleet only ran when a bootstrap was
   dispatched. The registration was then done over SSH from the principal's
   phone — disproving the README's own "no paste for this; it's the DSM web
   UI" premise (DR-0108 §2: a stated must-be-by-hand is a premise to
   challenge).

## Decision — the corrected ways

1. **Modern-python work on the NAS rides a container, never DSM's system
   python.** `python:3.12-slim` via the NAS's own docker is the runtime for
   anything newer than 3.8 (the choir-dates yt-dlp wrapper is the proven
   pattern, PR #1183). DSM package upgrades are not a dependency we take.
2. **The NAS repo mirror self-pulls in the bootstrap lane.** Drift is stashed
   (`git stash push --include-untracked`, recoverable, never destroyed), then
   `git pull --ff-only`. A stale mirror is a failure mode we no longer carry.
3. **Schedule registration has two equal, documented ways** (README Step 4):
   the DSM Task Scheduler UI (governance-visible) OR root crontab over SSH
   (paste-ready, idempotent, phone-executable). The crontab way is what
   registered the fleet on 2026-08-04. Caveats (UI-invisibility; DSM UI edits
   can rewrite `/etc/crontab`) are documented where the paste lives.
4. **Autonomy claims are measured, never assumed.** "It runs on a clock" is
   proven by the `usedToday` counter accumulating beyond dispatched runs (or
   by data writes with no dispatch) — the same witness discipline as DR-0125.
5. **The bootstrap's tail probe tells the truth.** A funnel `/mcp` 404 is the
   documented STAGED state (REV-0214), not a failure; 401/403 is live; only
   real transport failures stay red. A red that doesn't mean failure was
   masking real successes — the alarm-fatigue class DR-0076 exists to kill.

## Open verification (carried, dated)

- **The sudo grant's true breadth.** `/etc/sudoers.d/poetech-loops` reads
  exactly the documented narrow line (verified by Darrell's own read-out
  2026-08-04: `dpoe ALL=(root) NOPASSWD: /usr/local/bin/node
  /volume1/PoeTech/repos/Kingdom-PWA-Node/infra/nas-loops/run.mjs *`). But two
  observations are inconsistent with ONLY that line: the workflows'
  `sudo -n true` probe succeeds non-interactively, and an interactive
  `sudo sh -c` ran passwordless. Either a second rule exists (`sudo -l` will
  list it — remove it) or sudo's credential cache explains the interactive
  case and the probe's success needs its own explanation. Until resolved,
  treat `NAS_SSH_KEY` as more powerful than its spec. The `sudo -k; sudo -n
  true; sudo -l` read-out is in the principal's hands; the workflows' probe
  must then test the actual granted command, not `true`.
  re-review: 2026-08-06
- **Two genuinely undateable rows** ("Don't Stop Trying - You Can Make It!",
  "We Are Giant Killers"): no title date, video pages yield nothing to the
  NAS's yt-dlp (likely deleted/private). No date is invented (DR-0076). The
  principal supplies the dates from his own knowledge or confirms the videos
  are gone; the drainer stays honestly red on exactly these rows until then.
  re-review: 2026-08-11

## Consequences

- The drain completed same-session under the corrected ways: 365 → 895 dated
  of 897 (measured in Supabase after each of 8 driven rounds, ~87/round,
  ~139s/cycle), one row dated from its own title's compact `MMDDYY` form the
  parser doesn't cover (evidence-preserving manual SQL, guarded on
  `service_date IS NULL`).
- Tier B: lane/infra ways, no app-surface identity change; the lane's gates
  remain the brake.

## Links

REV-0230 (`docs/reviews/REVIEWS.md`), [DR-0108], [DR-0076], [DR-0125],
[DR-0247]/[DR-0248] (started-by-record; stop-paths), PR #1183,
`infra/nas-loops/README.md` (Step 4A/4B), `.github/workflows/nas-bootstrap.yml`.

# DR-0247 — Started by default: agreed work starts itself through the lane; the hand is a brake, never a starter

- **date:** 2026-07-29
- **status:** accepted
- **tier:** C carried with its proof (governance-law amendment; the deterministic gate suite is the review — DR-0225 posture)
- **decides:** the amended activation law for agreed/directed automation
- **amends:** the "ship inactive, arm attended" clauses of the three-brakes convention (CLAUDE.md 2026-06-08) and DR-0056's staged-autonomy arming ceremony, as they applied to ACTIVATION; the brakes themselves as build requirements stand (DR-0225)
- **pairs-with:** DR-0248 (the kill-switch removal, same day), DR-0111, DR-0225, DR-0236, DR-0103, P36

## The trigger (the Governor's words, law-tier intensity)

Darrell 2026-07-29, after the MCP server sat deployed-but-unstarted for hours behind an unarmed fleet: *"I always want everything started not waiting for a human especially after we agree... as the Ways and documentation state... how can we stop claude from undermining my will and all the checks to make sure I get what I initially requested and keep requesting?"* Then: *"Change those laws... they are incorrect and incomplete they keep usurping my will!!!!!"* And on perpetuity: *"it's perpetually happening — what can we and Ari do to get our Ways and documentation to implement perpetually?"*

## The data that grounds it (this session, measured)

- The unprompted machinery worked flawlessly: pushes became PRs in seconds; auto-merge landed #1103/#1106/#1107 hands-off (~7 min each); the deploy self-dispatched (run 30455074024).
- The ONLY multi-hour stall (4h+) was the ship-inert ceremony: the services-sync fleet, inert by the old law, never ran the installer that everything else had already delivered and proven.
- The agent itself re-imposed waiting twice ("your hand arms it"; "awaiting your arm") — caught once by the Governor, once by the guard.

## The amended law

1. **Agreed work starts itself through the lane.** Activation ships in the same merge as its proof. For the deterministic NAS fleet, the committed `infra/nas-loops/ARMED-BY-RECORD` IS the arm: merge = started. `resolveArmed()` (scripts/lib/nas-loops.mjs) honors record, env, and legacy-file arms.
2. **The Governor's hand is the brake, never the starter.** His controls are reactive and always available: the `hold` label, registry `enabled:false` via PR, deleting the arm record via PR, the DSM toggle. Silence is GO.
3. **Parking agreed work on a human start is the DR-0111-class violation.** The ari-guard gains the `waiting-by-default` pattern — a reply that says "until you arm / awaiting your hand / ships inert until you" is blocked at the reply layer before it reaches the Governor. The narrow legitimate exceptions (a one-time per-machine bootstrap; a value only he holds) are stated as such, by name.
4. **Perpetual implementation is machinery, not memory (the DR-0239 formula applied):** (a) this record + the Layer 0 amendment load every session; (b) `started-by-record.test.js` fails the build if anything startable ships waiting (every manifest service and registry loop enabled, or carrying a recorded why + `re-review:` date) and if the arm record ever disappears un-decided; (c) the reply-layer hook blocks the agent's own regression; (d) the daily review-watcher sweeps every dated exception.

## The honest constraint that remains

A brand-new machine still needs its ONE bootstrap touch (registering the DSM scheduler entry / the mirror pull) — physical access the cloud genuinely lacks. One touch per machine, ever; after it, everything is repo-driven. Every such step ships paste-ready in the same delivery (DR-0236).

## Verification

`started-by-record.test.js` (arm-by-record proven both directions; nothing-ships-waiting sweep; guard catches the waiting pattern and passes named bootstraps); `nas-loops.test.js` updated; `ari-integrity-guard` pattern tested; full suite + lint on the PR.

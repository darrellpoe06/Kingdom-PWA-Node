# DR-0249 — Insights from data all the time; the remote-hands channel closes "why can't you do it"

- **date:** 2026-07-30
- **status:** accepted
- **tier:** A (pure derivation module + tests + a dispatch-only workflow that no-ops without secrets)
- **decides:** the standing insight-derivation duty, its first module, and the governed remote-hands channel
- **pairs-with:** DR-0247/DR-0248 (started by default), DR-0091 (Quality & Throughput — the number+why precedent), DR-0100 (state facts plainly), DR-0121 (one source), DR-0108 (the team's whole reach)

## The triggers (the Governor's words)

Darrell 2026-07-30: *"we need valuable insights from data all the time."* And, on the NAS bootstrap: *"why can't you do it?"*

## Decision 1 — Insights all the time (the standing derivation)

Every data stream the app collects carries a standing derivation that states plainly what the numbers mean and what moved — a duty (Ari `insights`, rendered in-app), not a per-surface feature. First module: `derived-insights.js` over the review registry — velocity (two-window movement), resolution health (addressed ratio + oldest-open age), each headline carrying its measurement basis (the receipt rides the claim). Honesty rules inherited from quality-throughput: no rows → honest unavailable, never a painted number; movement only from two real windows. The rule going forward: **a new data stream gets its derivation the same build it starts collecting.** Pinned in `derived-insights.test.js`.

## Decision 2 — The remote-hands channel (the honest answer to "why can't you do it")

The verified constraint: the cloud sandbox has no NAS route (Funnel `000` from the sandbox, HTTPS-only, no SSH; the NAS is outbound-only by DR-0132 design), and every inbound door requires credentials only the Governor holds. But "credentials only he holds" is smaller than "his hands must type it" — so `nas-bootstrap.yml` converts the bootstrap class from ConnectBot pastes to a **dispatchable runner** that joins the tailnet ephemerally and runs the idempotent bootstrap (mirror clone/pull + services-sync + a real `/mcp` discover verification). One-time human part: install two repo secrets (`TS_AUTHKEY` ephemeral + ACL-scoped, `NAS_SSH_KEY`). Missing secrets → a clear no-op with instructions, never a half-run. After the secrets exist, "physical access" ceases to be a blocker class for NAS work this shape.

## Verification

`derived-insights.test.js` green (windows, ratios, degrade, receipt-rides-claim); ari-notes duty bounds green; workflow no-op gate proven by construction (secrets absent today → the message path). `re-review: 2026-08-25` — wire `insightLines` into the Quality panel beside its siblings, and extend derivations to the ops/deploy ledgers.

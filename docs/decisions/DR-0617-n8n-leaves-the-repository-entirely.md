# DR-0617 — n8n leaves the repository: the export library, the harness and the app's n8n code go now; what still touches the live NAS n8n is held until its replacement is proven

- **Status:** accepted
- **Tier:** B (touches CI and the NAS-facing inventory; the deploy lane and every live NAS path are deliberately untouched)
- **Type:** retirement
- **Date:** 2026-09-24
- **Scope:** removed — `docs/00-foundations/n8n-workflows/` (48 of 49 files), `docs/00-foundations/_quarantine/` (7), `scripts/test-wf36-quality-gatekeeper.js`, 11 `scripts/nas-*` n8n re-import scripts, `app/src/lib/n8n-base.js`; the `ci.yml` `workflows` job; `app/vite.config.js` `countWorkflowFiles` / `buildWorkflowRegistry`, the `__WORKFLOW_STATS__` / `__WORKFLOW_REGISTRY__` defines and the dev `/n8n` proxy; renamed — `n8nAuthHeaders` / `resolveN8nBearer` to `bridgeAuthHeaders` / `resolveBridgeBearer` in the new `app/src/lib/bridge-auth.js` (9 importers); rewritten — `app/src/lib/workflow-registry.js`, the Discussions bench, the BuildBoard count line, the Ari review's empty-registry finding; added — `app/src/__tests__/n8n-is-gone.test.js`
- **Principles:** DR-0132, DR-0218 (zero n8n), VERIFICATION-DOCTRINE (DR-0076), SPEC-CONFORMANCE (DR-0219), SPEAK-ESTABLISHED-FACT (DR-0100), PERPETUAL-IMPROVEMENT (DR-0075: every held piece carries a why and a date)
- **Grounds:** Darrell, 2026-09-24: *"No n8n!!!"* and *"n8n?!!!!!!"*; then, mid-removal: *"make sure it works end to end before dismantling anything."*

## Context — the question

DR-0132 and DR-0218 retired n8n to zero, and the app calls no n8n webhook. The repository still carried the n8n export library, an n8n test job in CI, n8n re-import scripts, and a helper named for n8n that serves only sovereign routes. Darrell asked for n8n to leave the repository. Partway through he added a condition: nothing is dismantled until what replaces it is shown to work end to end. So for each piece the question was: is anything still being delivered through it today? If so, what proves the replacement works?

## What was measured

- **n8n is still running on the NAS.** DR-0591 (run 35931262022, 2026-09-23) measured the Funnel root serving n8n's own page. The live n8n therefore has to be treated as live.
- **The ops-announce bell delivered nothing when last seen.** Site-health run 33700716591 (2026-09-03) received n8n's `404 "The requested webhook \"POST ops-announce\" is not registered."`. Run 33751166367 on the same day could not reach the Funnel at all (`SSL_ERROR_SYSCALL`). The last 300 site-health runs contain no later failure, so its current state is **unmeasured**. No sovereign phone bell replaces it for site-health or deploy failures. The NAS loop fleet's ntfy alert (`infra/nas-loops/run.mjs:181`) covers loop failures only.
- **`infra/n8n/docker-compose.yml` is not only exports.** It defines the `n8n`, `ntfy` and `ollama` services (lines 41, 114, 159). ntfy is the loop fleet's bell and Ollama backs the sovereign `/llm` route. The directory also holds the restic backup, the Funnel setup script and the property-history bridge script (`app/functions/property-history.js:2` still names it as the NAS side).
- **The `/n8n` transport has no caller in the app.** `N8N_BASE` had zero importers. A grep of `app/src` finds no `/n8n` fetch. Traffic from outside the bundle, such as old cached builds or hand-made calls, cannot be measured from here.
- **Counts, before → after (this branch):** n8n export library 49 files → 1. `_quarantine` 7 → 0. n8n re-import and harness scripts 13 → 1 (the held wf18 rotation script). Non-test importers of the n8n-named helper 9 → 0 (now `bridgeAuthHeaders`). `app/src/lib/n8n-base.js` 1 → 0. CI jobs that test n8n 1 → 0. Live n8n calls in `.github/workflows` + `app/functions` + `infra/nas-loops`: 3 → 3, all held and listed in `n8n-is-gone.test.js` `HELD`. The staged diff has 68 deletions, 24 modifications, 2 additions and 1 rename.

## Impact

- The app no longer has any code named for n8n. The token already typed on each device keeps working: the key `poetech-chat-bridge-token` is unchanged and pinned.
- The Discussions bench and the Ari review now state plainly that n8n workflows are retired. The review raises this as a `nit`, where it previously raised a false "cannot see its own workflow registry" warning. The BuildBoard "N automation workflows built" line is gone. It counted n8n exports.
- Nothing on the NAS changes. Nothing in the deploy lane changes.

## Decision

1. **Removed now**, because nothing is delivered through them:
   - the export library, except one held file;
   - the quarantined n8n artifacts;
   - the wf36 CI harness and its job;
   - the n8n re-import scripts;
   - `n8n-base.js`;
   - the build-time n8n registry and its defines.
2. **Renamed:** the bridge auth helper becomes `bridgeAuthHeaders` / `resolveBridgeBearer`. The device key is unchanged.
3. **Held until the replacement is proven end to end.** Each entry is pinned in `n8n-is-gone.test.js`, and the list can only shrink:
   - **The ops-announce POSTs** in `site-health.yml` and `deploy-cloudflare-pages.yml`. They go when a sovereign bell is proven by a real test push reaching a phone.
   - **The n8n `/healthz` probe** in `infra/nas-loops/loops/health-check.sh`, along with its registry and README text. It goes when the n8n container is stopped.
   - **`app/functions/n8n/[[path]].js`** and its `native-shell` route and parity pin. They go when the n8n container is stopped, which ends any traffic that could still reach it.
   - **`infra/n8n/` in full.** It goes when ntfy and Ollama have their own compose home and the property-history bridge is sovereign.
   - **`nas-rotate-bearer.yml` + `scripts/nas-update-wf18-bearer-guard.sh` + `18-imported-transactions-api.json`.** They are the rotation control for the wf18 bank-PII webhook, which may still be live. They go when wf18 is confirmed inactive.
   - **`scripts/workflow-conformance.mjs`** and its daily-review step. It still reports on the held exports.
4. **The guard:** `n8n-is-gone.test.js` fails in any of these cases:
   - a live n8n call (webhook path, `:5678`, the n8n image) appears in `.github/workflows`, `app/functions` or `infra/nas-loops` outside `HELD`;
   - a `HELD` entry is no longer present;
   - the export library grows back.

## Verification

- `npx eslint src`: clean.
- `vite build`: green.
- `node scripts/business-systems-guard.mjs`: OK.
- The new guard is proven to catch. Fixtures of a webhook POST, the `:5678` probe and the n8n image each produce a finding, and comment-only history produces none.
- The full Vitest suite result is recorded in the delivery report for this change.

## Limits, stated

- **The live NAS state was not observed.** The cloud sandbox has no route to the NAS or to poetech.us. "n8n is running" comes from DR-0591's 2026-09-23 runner measurement, and the ops-announce state comes from the 2026-09-03 log. Both need to be re-measured from a device that has the route. **`re-review: 2026-10-01`**: stop the n8n container (ConnectBot) after moving ntfy and Ollama to their own compose. Prove a sovereign phone bell with one real push. Then remove each held piece and its `HELD` entry.
- **The deploy lane's comments** (`deploy-cloudflare-pages.yml` lines 21 and 143-144) still describe the `/n8n` proxy. That is accurate while it is held. The comments go with it.
- **The number stacks on unmerged records.** DR-0613–DR-0616 were written on other branches (`claude/decision-intelligence-phase-1b` and siblings) and are not on `main` yet. This record takes DR-0617 as the next number across that stack. When those land, the INDEX rows interleave in order and the pointer stays at DR-0618.

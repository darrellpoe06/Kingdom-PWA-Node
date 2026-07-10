# DR-0160 — The worker is gated where the devices stand: the cache-first shell ERR_FAILED the whole installed fleet, and no service-worker strategy ships again without a controlled-navigation proof

- **Status:** accepted
- **Tier:** A on the revert (a down site is the worst outcome — DR-0107 makes restoring last-known-good the immediate, pre-authorized move); the re-land of the stay-on-previous-build strategy is Tier B behind the new gates
- **Scope:** `app/public/sw.js` (reverted to the network-first no-store shell with the redirect guard — PR #757, live 14:01Z), `app/vite.config.js` (the sw-precache stamp removed with it), `scripts/sw-nav-check.mjs` (NEW: the pre-merge gate), `.github/workflows/ci.yml` (the gate wired into the required job), `scripts/boot-check.mjs` (verify-boot now makes a SECOND, worker-controlled pass on the real domain)
- **Date:** 2026-07-10
- **Supersedes:** DR-0157 §1 (the cache-first / full-precache worker strategy — rolled back; DR-0157's watchdog, `__PT_BOOTED`, and the DR-0155 serve-side asset guard all stand)
- **Principles:** VERIFICATION-DOCTRINE (a gate that never exercised the failing path was theater for this class), DR-0107 (uptime outranks delivery velocity), LESSONS P33, QUALITY-OF-LIFE, PERPETUAL-PIPELINE-HEALTH

## Directive

Darrell, 2026-07-10, 13:38Z, screenshot of "This site can't be reached — ERR_FAILED" at `poetech.us/poetech-app/?view=books`: *"Done again!!!!!!? How many times are we going to have the Worst thing that can happen happen again!!!!!!??????"* And: *"All PoeTech Apps Moore and Mines..."*

## The verified what (measured, then reproduced)

- **13:30:45Z** — PR #750 (DR-0157) merged: the worker rewritten to serve in-app navigations **cache-first** from a full-build precache.
- **13:38Z** — Darrell's ERR_FAILED screenshot; Moore's devices identical. One worker controls the whole origin, so every installed device — every family phone — died at once.
- **Meanwhile every instrument stayed green**: CI, the deploy run, verify-boot, and site-health all passed, because **a fresh browser's first visit is never service-worker-controlled** — no gate ever executed the broken fetch handler.
- **The mechanism, reproduced locally both ways** (two-visit check against a Cloudflare-shaped serve): `cache.add(BASE + '/index.html')` at install follows Pages' pretty-URL 301 (`/index.html` → `/`) and stores a `redirected` response; the cache-first navigation path then hands that response to a navigation, and **a browser refuses a redirected response for a navigation** — net::ERR_FAILED on every visit. The worker's own 2026-07-07 REDIRECT GUARD comment documents exactly this browser rule; the new cached path bypassed the guard.
- **The heal, proven before promising it**: service-worker script fetches bypass the broken worker's own fetch handler, and production serves `sw.js` no-store — so with the reverted worker deployed, a stuck device heals on its **next single visit** (reproduced: broken profile + fixed serve → first reopen healed). No manual reset needed; incognito was the interim escape.

## Decision

1. **Revert first, per DR-0107.** `sw.js` restored to the last known-good network-first no-store shell with the redirect guard (PR #757, deploy 29098267913 green at 14:01:57Z). The vite `sw-precache-stamp` half was removed with it — the stamp plugin hard-fails a build whose worker lacks the placeholder, so the pair travels together.
2. **The class gets a pre-merge gate: `scripts/sw-nav-check.mjs` in the required CI job.** It serves the freshly built dist the way Cloudflare Pages serves poetech.us (files at root, `/poetech-app/*` alias, `/index.html` 301-normalization — the exact trap, sw.js/shell no-store) and proves the SECOND — worker-controlled — navigation still answers. It **requires the page to become controlled** before judging (a run where the worker never takes control fails loudly; no vacuous green), fails on a dead navigation or a recovery screen. Proven-to-catch: exits 1 against the #750 worker with net::ERR_FAILED; passes the network-first worker.
3. **verify-boot stands where the devices stand too.** `boot-check.mjs` now makes a second, worker-controlled pass on the real domain after every healthy mount (bounded controller wait; standalone windows that opt out of SW registration are skipped, not failed). The same class can no longer ride a deploy invisibly even if it slips the local gate.
4. **DR-0157's goal is not abandoned — it is gated.** "Stay on the previous build until the new one is downloaded" remains the Governor's named ask. It re-lands only when the shell response cached at install is stored **un-redirected** (re-wrapped clean, or fetched from the final URL) AND the strategy passes sw-nav-check + the boot-check controlled pass. `re-review: 2026-07-17`.

## Ways (what this session corrects in how we work)

- **A gate must stand where the user stands.** Every instrument watched the first visit; the family lives on the Nth. The standing question for any new gate: *which visit, which device state, which cache does the real person hit?*
- **The gate builder proved the gate before shipping it** — the first draft of sw-nav-check passed the broken worker (its test server didn't serve `/sw.js` at root, so no worker ever registered and the pass was vacuous), and the first draft of the boot-check pass skipped itself (a bare `return` let the page close mid-check). Both theater modes were caught by running the gate against the known-broken artifact BEFORE trusting it (DR-0076 §3). A gate is shipped with its catch demonstrated, never with its green demonstrated.

## Opportunities and constraints (routed)

- **Opportunity:** sw-update.test.js pins the worker's message/skip-waiting contract but nothing unit-pins "a navigation response must never be `redirected`" — a pure assertion on the worker source could hold the invariant cheaply. `re-review: 2026-07-17` (with the DR-0157 re-land).
- **Constraint (held):** sw-nav-check adds ~15-25s to the required CI job (browser launch + two visits) — accepted; it is the only instrument standing between a worker bug and the whole installed fleet.
- **Constraint (stated):** the local serve mirrors Pages' redirect + header behavior by construction, not by fetching Pages itself; the boot-check controlled pass on the real domain is the outside-in complement that closes that residual.

## Pairs

DR-0107 (prove the deploy; uptime outranks), DR-0125 (the site has its own witness), DR-0155 (serve-side asset guard — stands), DR-0157 (superseded in part; goal re-lands gated), DR-0139 (boot-truth), LESSONS P31/P32/P33, incident ledger #715/#722.

# DR-0139 — "Boots in a real browser" is the bar, and healing is visible

- **Status:** accepted
- **Tier:** A/B — bug-class fixes on existing self-heal wiring + a post-deploy verification job + derived-count corrections; no schema, no money, no new external face
- **Scope:** `lib/chunk-reload-heal.js` (prevent-default only when healing; no-storage brake), `lib/boot-fallback.js` + `lib/sw-update.js` (heal journaling), `lib/error-journal.js` ('heal' kind + healJournalSummary), `components/QualityThroughput.jsx` (Self-heals metric), `scripts/boot-check.mjs` + `deploy-cloudflare-pages.yml` verify-boot job, `lib/youtube-title-parse.js` decodeHtmlEntities + the choir mappers, FeedbackCenter/Rentals derived counts, the pinned tests for all of it
- **Date:** 2026-07-10
- **Principles:** VERIFICATION-DOCTRINE (DR-0076), THREE-BRAKES, NO-STATIC-DATA (DR-0121), APP-IS-PRIMARY, PERPETUAL-IMPROVEMENT, SPEAK-ESTABLISHED-FACT (DR-0100)

## Directive

Darrell, 2026-07-10: *"Can we look over the whole PoeTech comprehensively for UIUX and quality. Why don't the PoeTech App seem like it's self healing yet — can you do a comprehensive review of what could make that come to pass."* Asked while photographing the app down on his devices ("The PoeTech App still is down for me… even in incognito") — the second time the self-healing question has been asked (DR-0135 answered it structurally), which per the record means the answer must become shipped motion.

## The verified trace

1. **The deployed code is healthy — proven in a real browser.** The current `main` build was run locally in headless Chromium with valid-shaped env: the full app mounts, and the `?moore=1` business door mounts. The crash his screenshots show is not in the shipped code.
2. **The probes were green while the family photographed recovery screens — because nothing ever EXECUTES the JavaScript.** site-health curls the shell + first asset (200s all night); CI runs jsdom tests and a build; no instrument loads the real URL in a real browser. "Intact" did not mean "boots." This is the DR-0125 blind spot one layer deeper.
3. **A real mechanism bug was reproduced destroying the truth on the family's devices.** Vite's preload helper swallows the import rejection when `vite:preloadError` is `defaultPrevented` — the failed `import()` then RESOLVES `undefined`. Our chunk-heal handler prevented unconditionally, so on the loop-guard rung ('gave-up', no reload coming) the import resolved undefined, main.jsx died on `Cannot destructure property 'default' of 'undefined'`, and the REAL error (a 404'd chunk after tonight's six deploys, a module that threw) was destroyed before any journal or boundary could report it. Reproduced deterministically in Chromium against the built app.
4. **Healing was invisible, so the app cannot SEEM self-healing.** Chunk-heal reloads, boot-ladder rungs, and landed SW updates left only sessionStorage crumbs — no journal entry, no count, no surface. The family sees only the rare failure, never the routine recovery.

## Decision

1. **Prevent-default only when healing.** The chunk-heal handler swallows the preload error ONLY when it is about to reload (the page is leaving; the error is moot). On 'gave-up' the error propagates untouched: the import rejects with the truth, the boundary/fallback shows it, the journal records it.
2. **Can't count → don't loop, everywhere.** With no sessionStorage (private mode / blocked), chunk-heal now gives up instead of reloading unboundedly — the same brake the boot ladder already holds. A storage-blocked device on a broken serve must never spin.
3. **Every self-heal is journaled and counted.** `kind: 'heal'` joins the error journal (chunk-heal reload, each boot-ladder rung, a landed zero-click update; the exhausted ladder journals as a real error). Heals are EXCLUDED from the error roll-up — a recovery is not a failure — and the Quality & Throughput board carries a "Self-heals (this device)" metric: *healed itself N times*. Frequent heals read 'attention': healing works, but the churn deserves eyes.
4. **"Boots in a real browser" is the deploy bar.** `scripts/boot-check.mjs` loads the production URL (domain + pages.dev origin) in headless Chrome, retries through propagation, and fails loudly — filing the rolling incident ledger — if a recovery screen or a blank mount is served. Wired as the `verify-boot` job after every production deploy. Proven-to-catch before shipping: it FAILED against a build whose boot breaks (exit 1, "recovery screen shown") and PASSED against the mounting build. CI-green ≠ deployed (DR-0107); probe-green ≠ boot-green (this record).
5. **Titles render as words, not entities.** `decodeHtmlEntities` (dependency-free, shared with the backfill script) decodes harvested titles at the parser AND at the choir mappers, so rows already stored with `&QUOT;…&QUOT;` heal at render — the photographed Choir sighting.
6. **Derived counts replace the two already-wrong literals.** The Feedback catalog's "~46 entries" (registry holds 49) now renders `OPPORTUNITY_LIBRARY.length`; Rentals' "All 11" renders `rentals.length`.

## The comprehensive review — routed (three agents, findings on the record in REV-0031, renumbered from a REV-0030 collision)

- **UI/UX systemic classes (25 findings):** (a) the shared BTN/FIELD/palette tokens have forked per-file (36px tap targets, drifted border hexes, a games surface off the design system); (b) native `alert()`/`confirm()` is the de-facto feedback layer on ~10 surfaces, leaking raw `e.message` to church members; (c) ~600 frozen-pixel text sizes silently defeat the A+++ large-print control. Each is a class fix (shared tokens module; in-app alert/confirm primitives; a px-text lint rule). `re-review: 2026-07-17`.
- **Static data (15 findings):** ChurchVideoWall's hand-typed timeline/status/dates, PromoBanners' "77th National Assembly" + duplicated "7-clinician" counts, DevOps provenance counts, BigPictureDashboard tour counts, the hand-kept SURFACE_CATALOG. `re-review: 2026-07-17`.
- **Self-healing inventory (fifteen instruments audited):** the data plane detects-and-waits with every needed actuator already built but unconnected — harvest-stall → transcript-fetch wire, corpus-reconcile.yml's FIRST dispatch (manifest still `generatedAt: null`), failed-migration → db-migrate re-dispatch, pinned-LLM → unload job, and the announce path (incident issue → family phones via the NAS ntfy lane). Dated in DR-0135 (2026-07-24 / 07-31); the corpus-reconcile first dispatch is a single tap with the instrument already shipped.

## Opportunities and constraints

- **Opportunity:** wire the announce path — the incident ledger and the verify-boot failure should reach the family's phones (NAS ntfy / wf08), not only GitHub. `re-review: 2026-07-31` (DR-0135's date, unchanged).
- **Opportunity:** the site-health 10-minute probe stays curl-shaped (cost-right); consider a browser-shaped probe on a slower cadence (hourly) if boot regressions recur between deploys. `re-review: 2026-07-24`.
- **Constraint (held):** verify-boot is a non-required check — it never blocks the merge lane; it makes a broken serve visible in minutes and files the ledger. The gates remain the brake (DR-0103).
- **Constraint (verified):** the sandbox cannot reach poetech.us; the crash diagnosis was made by building the exact main SHA locally and driving it in the sandbox's Chromium — the same method verify-boot now runs against production on every deploy.

## Supersedes / pairs

Pairs with DR-0137 (the ladder this makes visible and truthful), DR-0135 (the program this extends to the serve layer), DR-0125 (outside-in witness — now executing, not just fetching), DR-0128/DR-0107 (deploy-lane truth), DR-0121 (derived counts). Supersedes the unconditional preventDefault in chunk-heal and the no-storage 'reload' default.

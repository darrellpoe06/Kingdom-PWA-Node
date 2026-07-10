# DR-0155 — A missing asset answers 404, never a cacheable lie: the asset guard closes the deploy blank-window class

- **Status:** accepted
- **Tier:** A shipped through the lane (a serve-layer correctness fix for a measured outage class; no schema, no money, no identity surface)
- **Scope:** `app/functions/poetech-app/assets/[[path]].js` (the guard), `app/src/__tests__/asset-guard.test.js` (proven-to-catch), `.github/workflows/deploy-cloudflare-pages.yml` (the measured propagation gate), incident #722 (the evidence)
- **Date:** 2026-07-10
- **Principles:** VERIFICATION-DOCTRINE (DR-0076), SPEAK-ESTABLISHED-FACT (DR-0100), PERPETUAL-IMPROVEMENT (DR-0075), DR-0107 (a down site is the worst outcome), LESSONS P32

## The decision this closes

Incident #722 (twice measured 2026-07-10; LESSONS P32) left an open serve-layer decision with `re-review: 2026-07-12`: after each deploy, poetech.us serves the NEW shell for ~7–12 minutes while the shell's own hashed chunks are not yet reachable at the domain layer. Each missing chunk fell through the SPA rewrite and answered **`200 text/html`** — and because `_headers` stamps cache policy by REQUEST PATH, that fallback page left the building marked **`immutable, max-age=31536000`**. Three caches swallowed the lie: the browser HTTP cache, the edge, and the service worker (which stores any `res.ok` asset). A device that hit the window held HTML-poisoned chunks for the LIFE of that deploy — which is why every heal rung and "one more tap" kept failing for Darrell: each retry re-read the poison. The blank page was not one bad window; it was a poisoned cache wearing one.

## Decided: candidate 1 (asset-404), plus the window goes on the record

1. **The asset guard.** A Pages Function now owns `/poetech-app/assets/*` (Functions run before `_redirects`): a real asset passes through stamped `immutable` + `nosniff`; ANY other answer for an asset path — the SPA fallback page, a store miss — leaves as **`404` + `no-store` + `cdn-cache-control: no-store`**. Nothing caches it (the SW only stores `res.ok`), the module loader rejects with the truth, and the existing heal ladders (`chunk-reload-heal.js`, `boot-fallback.js`) converge the moment propagation lands. Fail-soft: an error inside the guard answers `503 no-store`, never a crash. Conditional revalidation (304) passes untouched.
2. **The propagation gate (measure, don't claim).** The deploy workflow names each build's entry chunk as a sentinel; verify-boot polls the domain (bounded, 15 min) until that chunk answers as JavaScript, writes the **measured window length to the run summary on every deploy**, and only then boot-checks — so boot-check judges post-propagation reality instead of filing window-noise on the ledger, and a window that never closes fails loudly and files as the incident it is.
3. **Proven-to-catch (DR-0076 §3):** the test suite feeds the guard the exact measured incident shape — `react-vendor-B6XcsSYh.js` answered as `200 text/html` — and requires the 404/no-store conversion. Remove the guard's judgment and the suite goes red.

## Candidates NOT chosen, and why

- **Zone cache purge post-deploy:** needs a zone-scoped API token (a Darrell-side credential the pipeline doesn't hold), purges cannot un-poison a browser's HTTP cache or a device's SW cache, and the measured evidence points at deployment propagation, not zone-cache staleness — a purge would have been a guess. The guard removes the poison at the source instead.
- **`404.html` at the output root:** would flip Pages' not-found handling for NAVIGATIONS too (breaking SPA deep links), and `_headers`' request-path matching would stamp `immutable` onto the 404 page itself — the same poison class in a new coat.
- **Retuning verify-boot alone:** hides the noise, helps no family member staring at a blank phone.

## What the window looks like now

A user loading mid-window gets the honest ladder instead of a poisoned blank: auto-reload → cache-clear reload → the "Almost there — one more tap" screen; the tap works the moment the domain serves the deploy, because nothing poisonous was ever cached. Users NOT loading mid-window never see anything at all.

## Opportunities and constraints (routed)

- **Opportunity:** the propagation-gate summaries accumulate real window measurements; once a few days of numbers exist, the deploy-churn batching question (DR-0125, `re-review: 2026-07-15`) can be decided from data instead of estimate.
- **Constraint (held):** the guard sits on the cold-load path of every asset; its fail-soft branch is the brake. If Pages Function invocation limits ever matter (family + church scale is far inside free tier), `_routes.json` can exclude the assets path and the class re-opens — that trade must come back here first.
- **Vercel note:** `vercel.json` still serves the old behavior if Vercel ever fronts production again; the guard is Cloudflare-side. Parity is deliberate non-work while Vercel is off the serving path (DR-0132 posture).

## Supersedes / pairs

Closes the open decision in DR-0153 §2 and the LESSONS P32 forward fix. Pairs with DR-0139 (boots-is-the-bar; verify-boot now judges post-propagation), DR-0137/DR-0145 (the heal ladders this guard lets act on the truth), DR-0125 (the runner is the eye; the window is now measured on every deploy), DR-0107 (prove the deploy — the gate is that proof made standing). No supersession.

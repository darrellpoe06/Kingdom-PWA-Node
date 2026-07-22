# Live-Data + Usability — Comprehensive Analysis to Solidify the Apps

**Date:** 2026-07-22
**Prompted by:** Darrell — "Review our Ways and documentation comprehensive analysis and see if there are opportunities and constraints so we can have a live data-driven application building process and the apps work like intended. Usability is important, anything fails our reputation is undermined so let's solidify these applications."
**Method:** two evidence traces (a usability/reputation sweep of the live app surfaces + a Ways/build-process enforcement trace), synthesized here with `file:line` receipts (DR-0076).

## Headline (the good news first)

**The app is genuinely solid and honest about data.** The usability sweep of the first-touch surfaces (sign-in, welcome, Church home, Giving, Choir, prayer, dashboard, invite/inquiry) found **no fake/painted data and no broken surface** on a signed-in user's real views. The DR-0061 "real data before building" discipline is visibly holding: empty states are labeled honestly, detected/AI content is flagged "needs review," giving links are never invented, forms preserve input on failed saves, live-worship avoids the dead-iframe trap. **The first impression is trustworthy.** The work below is refinement, not rescue.

## Fixed this session (the two trust-killers that could mislead a real user)

1. **Giving archive told a signed-in member to "sign in" on a real error.** `ChurchGiving.jsx` collapsed a fetch/RLS failure into the same empty state as "no rows," rendering "sign in as a church member" to someone already signed in — on the Give surface, where trust matters most. **Fixed:** a distinct error branch ("connection hiccup… Try again") split from the honest empty state. Proven-to-catch: `church-giving-archive-error.test.jsx`.
2. **Prayer "Send →" marked a request "sent" while opening nothing.** When a church had no contact email / stay-connected link / site, `mailtoFor` resolved to `href="#"` but the click still flipped the request to "sent." **Fixed:** no Send button (and no "sent") unless a real destination resolves; the request stays saved + "ready to share." Proven-to-catch: added to `church-home-render.test.jsx`.

## The build-process enforcement gaps (opportunities & constraints)

The Ways *require* a live, data-driven, usable build (DR-0061 surfaces trace to real rows; DR-0076 gates over claims; BUSINESS-PROCESS-CONNECTIONS four-question test; ANXIETY-CLARITY what/when/why/how; EXCELLENCE accessibility). The CI suite enforces a strong set (data-isolation/tenancy, static-value heuristics + top-level reachability, contrast/legibility on new violations, tab-overflow/FAB/consistency, monolith-budget, module-boundary, real-build + SW-nav, Help freshness, live-site up/fresh). But several binding requirements are enforced by **human discipline only** — and that's the reputation exposure:

| # | Gap | Reputation risk | Decision | Re-review |
|---|---|---|---|---|
| 1 | **A surface that renders but reads fake/empty data ships green.** DR-0061's "traces to a real row" has no general gate; the `works-when-used` + `data-coverage` rubric dimensions are declared but never executed (`surface-audit-core.mjs:177-183`); interconnect-guard covers only ~24 hand-declared loops by substring presence. | HIGHEST — attacks the "surface = trust" promise (the BuildBoard-was-a-constant failure DR-0061 exists to prevent) | **Build a real `works-when-used`/data-coverage executor** in surface-audit (a gate that flags a registered surface whose render path has no real data source), proven-to-catch. Tier-B. | `2026-08-05` |
| 2 | **Church/choir sub-tabs aren't reachability-checked** (`surface-audit-core.mjs:137-140`) — and COLG is the named first community. | HIGH — a dead-end church sub-surface can ship to the elderly tech-novice audience the mission serves | Extend surface-audit reachability to the church/choir sub-tabs. Tier-B. | `2026-08-05` |
| 3 | **No machine gate for the anxiety-clarity four-question** (what/when/why/how). Help-freshness only proves a Help topic exists, not that the surface answers the four. | HIGH — a wired surface can still leave a scared parent lost | Design a lightweight per-surface what/when/why/how presence check (net-new gate). Tier-B/C. | `2026-08-18` |
| 4 | **Isolation smoke tests are post-merge, not a required PR check** — a cross-tenant RPC regression merges green, caught only after deploy. | HIGH — data-leak class reaching a real church/family | Promote the isolation smokes toward a required pre-merge check (carefully — they hit the real DB in a rolled-back tx). Tier-C. | `2026-08-11` |
| 5 | **Legibility baseline debt is non-blocking** — existing dark-on-dark pages ship until burned down. | MEDIUM — "can't read it on the black screen" | Baseline burn-down pass on the church/choir/first-touch pages first. | `2026-08-25` |
| 6 | **Accessibility beyond contrast is unenforced** (no tap-target, focus-order, ARIA gate) despite EXCELLENCE + elderly-first mission. | MEDIUM | Add a tap-target-size + ARIA-label lint for first-touch surfaces. | `2026-09-01` |
| 7 | **Static detection is regex-only + heavily excluded** (`rubric` excludeSurfaces; a hardcoded-array `.map` evades it). | MEDIUM — false confidence in the "no static" gate | Harden the static-value detector (catch array-driven painted values). | `2026-08-25` |

## Product polish (dated — DR-0075, from the usability sweep)

- Native `alert()`/`confirm()` as primary feedback (125 across 38 files) → in-app toast/modal (`Modal.jsx`), church-facing first (calendar save, prayer/concern delete). `re-review: 2026-08-11`.
- `text-[8px]`/`text-[9px]` px labels resist the Big Print control (`text-size.js:19-25`) → px→rem on church/choir surfaces. `re-review: 2026-08-18`.
- Giving archive loader + recent-livestreams strip: add timeout→retry / a visible retry affordance. `re-review: 2026-08-11`.
- Audit remaining `.catch(() => setState([]))` fetches for the same error-as-empty conflation. `re-review: 2026-08-11`.
- Remove/finish the dead Buffer Fund scaffolding (`BigPictureDashboard.jsx:164-171`) so it can't ship as a painted bar. `re-review: 2026-08-05`.

## Opportunities & constraints — summary

**Opportunity:** the app's honesty discipline is already its moat; the highest-leverage next investment is turning that discipline into **gates** (gaps 1–4) so a fake-data or dead-end surface *can't* ship green — moving "live data-driven" from human vigilance to machine enforcement (DR-0076). **Constraint:** these are proven-to-catch gates (must be shown to catch the break before they ship) and some touch the real DB / merge policy (Tier-C), so they earn their soak rather than being rushed. Recorded as **DR-0224**.

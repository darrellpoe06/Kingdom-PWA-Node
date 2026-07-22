---
id: DR-0224
title: Solidify the apps — turn the live-data + usability discipline into GATES; fix the two trust-killers now, date the enforcement-gap closures
status: accepted
date: 2026-07-22
tier: B
declared_by: Darrell
supersedes: []
amends: []
principles: [REALITY-TRACE (DR-0061), VERIFICATION-DOCTRINE (DR-0076), ANXIETY-CLARITY, EXCELLENCE-STANDARD, COMMUNITY-FIRST, BUSINESS-PROCESS-CONNECTIONS, PERPETUAL-IMPROVEMENT (DR-0075)]
---

## Context

Darrell 2026-07-22: "Review our Ways and documentation comprehensive analysis… opportunities and constraints so we can have a live data-driven application building process and the apps work like intended. Usability is important, anything fails our reputation is undermined so let's solidify these applications." Full analysis (two evidence traces, `file:line`) in `docs/99-session-notes/2026-07-22-live-data-usability-solidify-analysis.md`.

**Headline finding:** the app is already solid and honest about data — the first-touch surfaces carry no fake/painted data and no broken flows; the DR-0061 discipline holds. The exposure is that several binding requirements (live-data-on-every-surface, the anxiety-clarity four-question, sub-tab reachability) are enforced by **human discipline, not a gate** — so a fake-data or dead-end surface *could* ship green.

## Decision

**Fix the two trust-killers now (shipped this session):**
1. Giving archive splits a real error ("connection hiccup… Try again") from the honest sign-in empty state — it no longer tells a signed-in member to sign in on a fetch failure (`ChurchGiving.jsx`; test `church-giving-archive-error.test.jsx`).
2. Prayer "Send →" renders and marks "sent" ONLY when a real destination resolves — no more reporting success while opening nothing (`ChurchHome.jsx`; test in `church-home-render.test.jsx`).

**Turn discipline into gates (the durable work) — dated, proven-to-catch (DR-0076):**
- **Fake-data-ships-green** (highest risk): build a real `works-when-used`/data-coverage executor in surface-audit so a registered surface with no real data source fails the build. `re-review: 2026-08-05`.
- **Church/choir sub-tab reachability**: extend surface-audit past the top-level (protects COLG, the named first community). `re-review: 2026-08-05`.
- **Anxiety-clarity four-question**: a per-surface what/when/why/how presence check. `re-review: 2026-08-18`.
- **Isolation smokes → pre-merge**: promote toward a required check (they hit the real DB in a rolled-back tx — Tier-C care). `re-review: 2026-08-11`.
- **Legibility baseline burn-down** (church/choir/first-touch first); **accessibility beyond contrast** (tap-target/ARIA); **static-detector hardening** (array-driven painted values). Dated `2026-08-25`–`2026-09-01`.

**Product polish** (native alert→toast, px→rem tiny text, loader timeouts, error-vs-empty sweep, dead Buffer-Fund scaffolding) — dated re-reviews (DR-0075), church-facing first.

## Consequence

The two active trust-killers are closed; the app's honesty discipline becomes the spec for a new class of gates that move "live data-driven" from human vigilance to machine enforcement. Each gate ships proven-to-catch on its date; none is rushed. The app was already reputation-solid on the first-touch path — this hardens the *process* so it stays that way as more surfaces and more people land.

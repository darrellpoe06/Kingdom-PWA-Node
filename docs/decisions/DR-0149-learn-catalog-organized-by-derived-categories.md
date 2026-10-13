# DR-0149 — The Learn catalog organizes itself: derived categories, grouped picker, and harvests keep landing as lessons

- **Status:** accepted
- **Tier:** A/B (organization of existing surfaces + a content lesson; no data-class change)
- **Scope:** `app/src/lib/learn-catalog.js` (category on every course meta), `lib/eternal-algorithms-course.js` (category on the derived courses), `components/ChurchLearn.jsx` (the grouped picker + the component-owned ai course's category), `lib/living-lessons-class.js` (L16), the category gate in `learn-catalog-render.test.jsx`
- **Date:** 2026-07-10
- **Principles:** NO-STATIC-DATA (DR-0121), APP-IS-PRIMARY, ANXIETY-CLARITY (findability answers "what/where"), SPOKEN-TEACHINGS-ARE-BUILD-INPUT, VERIFICATION-DOCTRINE

## Directive

Darrell, 2026-07-10: *"have Ari add this as a lesson and clean up and organize all the courses so they are easy to locate"* — delivered with the Jefferson Fisher communication/relationship harvest, and alongside the standing question answered in-session: Ari's directives derive from the Ways and documentation.

## Decision

1. **Every course carries a `category` on its meta** — set in the ONE registry (and in the eternal-course builder for the derived courses), never in the picker: **The Word & The Way** (Living Lessons, World Issues, Prophetic Voices), **The Eternal Algorithms** (the six derived processing courses), **Kingdom Life & Stewardship** (Kingdom Economics, Handed Forward), **A.I. The Way** (Learning A.I., Sovereign A.I., AI Legal Blueprint), **Serve the House** (The Broadcast, Running the Board, The Infrastructure, Data Systems).
2. **The Learn picker groups by category, derived at render** — group order is first appearance in catalog order; the component hand-sorts nothing (DR-0121). A machine gate asserts every registered AND derived course carries a category, so a future course cannot land ungrouped.
3. **The harvest ships as Living Lessons L16 — "Rule Your Spirit, Repair the Bond"** — the Fisher material whole (never react to the reaction; manipulators met with the ruled spirit, Proverbs 16:32 / 1 Peter 2:23; the overexplain closed, Proverbs 10:19; presence, Mark 5:30-31; small moments, John 10:3 / Matthew 25:40; sitting with sadness, Romans 12:15 / Job 2:13; the caged dynamic under Philippians 2:3-4; the repair cycle under Ephesians 4:26 / Matthew 5:23-24; the tank check under Galatians 6:2; kind-over-nice under Proverbs 27:6 / Ephesians 4:15; authenticity under 2 Corinthians 12:9). Series 15 → 16; every fragment verbatim from the repo KJV; counts derive.

## Opportunities and constraints

- **Opportunity:** the category becomes a filter on the Perpetual Report's courses stream (the rows already project from the same registry). `re-review: 2026-07-22`.
- **Opportunity:** L15+L16 (the two communication lessons) plus the TLC couples material suggest a future "Speak The Way" mini-track cross-link. `re-review: 2026-07-22`.
- **Constraint (held):** categories are identity-class labels on the metas — one source; the picker derives; nothing is hand-ordered in the component.

## Supersedes / pairs

Pairs with DR-0129 (the registry), DR-0141 (Ari's conduct — L15/L16 are its source material), DR-0121 (no static data). No supersession.

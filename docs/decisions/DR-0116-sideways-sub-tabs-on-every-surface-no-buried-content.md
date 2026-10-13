# DR-0116 — Sideways sub-tabs on every surface: no content buried down a page

- **Status:** accepted
- **Tier:** B (visual change across many tabs; About/front-door excluded and held to its own Tier C pass)
- **Scope:** every registry surface's in-body layout; the SectionTabs coverage checklist; future surfaces at birth
- **Date:** 2026-07-07
- **Principles:** PERPETUAL-IMPROVEMENT, VERIFICATION-DOCTRINE, APP-IS-PRIMARY, ANXIETY-CLARITY, DECISION-RECORDS

## Directive

Darrell, 2026-07-07, the third statement of the same requirement: *"All tabs need sideways sub tabs for sections with the sideways scroll bars so we can see what we have — this is the second time I'm asking... Everything is buried down each page... no more down scrolling to see a surface with KPIs or anything, all data should matter."* Prior statements: 2026-07-04 (*"sliding tabs for all tabs instead of a long scroll on any tab"*) and 2026-07-05 (*"we need a 3rd row of sliding tabs if that tab scrolls really long"*) — both captured only in the `SectionTabs.jsx` header, never as a DR, never with a coverage checklist.

## Why it stalled (the miss this DR closes)

The 2026-07-04 directive shipped a sound primitive (`app/src/components/SectionTabs.jsx` on `TabScroll`, guard-enforced by `tab-overflow-guard.mjs`) and 8 adoptions — then stopped, because the remaining ~30 surfaces were never written down as a tracked backlog. An untracked directive is an unfulfilled one. Darrell had to ask again: that re-ask is the defect.

## Decision

1. **Every surface presents its sections as sideways-scrollable sub-tabs** (SectionTabs 2nd row, underline) instead of a long vertical scroll. When a section's panel is still a multi-screen read, it nests a 3rd row (`variant="sub"` chips). Maximum three levels: app nav → section row → sub row.
2. **KPIs and identity strips stay pinned above the section row** — always visible on entry, never below a scroll. A surface's first screen answers "where do I stand" without any down-scroll.
3. **The only exemption is fit:** a surface that genuinely fits ~1.5–2 phone screens as one coherent flow may stay untabbed — recorded with its why on the coverage checklist, not silently.
4. **New surfaces adopt SectionTabs at birth.** A PR adding a multi-section surface without it (or without a recorded fit-exemption) is a review finding.
5. **The coverage checklist is the tracked artifact** (session note 2026-07-07, sideways-sub-tabs sweep) — every surface listed as converted / harmonized / exempt-with-why. No surface is unlisted.
6. **About (front door) is excluded from the sweep PR** per RELEASE-TIERS (mission-identity = Tier C) — it gets its own held PR and family review; `re-review: 2026-07-14`.

## Consequences

- The 2026-07-07 sweep converts/harmonizes the remaining surfaces in one pass through the normal lane (gates, soak, auto-merge, deploy proof, DR-0104 reviewer pass).
- Surfaces that already carry hand-rolled `TabScroll` strips keep their nav ids stable (feedback-area-guard scrapes Choir; help keys and church/books nav ids are unchanged) — harmonized, not forked.
- The tab-consolidation design (DR-0079) lands INTO these section rows later; this DR is its container layer, not a competitor.

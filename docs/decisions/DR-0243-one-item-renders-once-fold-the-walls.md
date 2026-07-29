# DR-0243 — One item renders once; fold the walls

- **date:** 2026-07-29
- **status:** accepted
- **tier:** B (visual/presentation change on record surfaces; no data or gate semantics touched)
- **decides:** the presentation law for derived record surfaces — deduplicate and fold, never wall
- **pairs-with:** DR-0116 (sideways sub-tabs — the container layer this extends), DR-0121 (derived-live — untouched), DR-0175 (Ari Review), DR-0239 §2/§4 (journey walks / form-factor), ANXIETY-CLARITY (guidance ≠ volume)

## The trigger

Darrell 2026-07-29, with four screenshots of Projects (Ari Review + Discussions): **"All this data that is hidden for me because it just keeps going and duplicate information location etc... opportunities and constraints."** And the follow-up: *"These requirements were already requested — was there already any infrastructure?"*

**The SHOULD/ARE answer:** yes — DR-0116 (2026-07-07, his third statement of "no content buried down a page") shipped `SectionTabs` + `TabScroll` + `tab-overflow-guard.mjs`, and the Projects surface conforms at the tab level. **What no rule covered was duplication INSIDE a panel:** the same five re-review items rendered THREE times on one screen (Review-freshness findings → "Pull these next" → the MAPE-K "Needs your call" list), the identical boilerplate reason repeated per item (11×), and Ari's standing responsibilities rendered as full-prose walls. The data was hidden by its own repetition — a defect class DR-0116's container law doesn't reach.

## The decision

1. **One item renders once per screen.** A finding has exactly two homes: the ACTION QUEUE (what to do next) and its DIMENSION CARD (the evidence). `AriReview.jsx` merges "Pull these next" and the MAPE-K control loop into one queue — Ari's applied items (✓) and needs-your-call items (•) in a single list, capped at 7 with an honest "…and N more — the dimension cards below carry every one, with evidence." The standalone MAPE-K re-list is gone.
2. **Shared boilerplate is stated once, at the group.** The generic "needs human judgment / not provably safe" reason lives in the queue's header sentence; a per-item reason renders ONLY when it differs (e.g. the money/PHI reason). Pinned by test: the generic string never appears per-row.
3. **Prose walls fold to one-liners with the full text one tap away.** Ari's standing responsibilities render as `dutySummary()` first-clause one-liners (bounded ≤ ~112 chars, pure, tested over every real duty) with a More/Less expander per item. Nothing is lost — only folded. Derived-live (DR-0121) is untouched: this is presentation, not content.
4. **The law generalizes.** Any derived record surface that repeats an item a third time, repeats identical boilerplate per row, or renders unbounded prose without a fold is a review finding under DR-0239 dimension 2 (journey walks) — cite this DR.

## Verification

`ari-review-render.test.jsx` pins the merged queue (present with findings, absent when clear, no per-item boilerplate, evidence pointer present); `ari-notes.test.js` pins `dutySummary` bounds over the real duty list; full suite green.

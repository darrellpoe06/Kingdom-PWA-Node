# DR-0245 — Full-width established across the app tabs; a directive's gate is born HARD

- **date:** 2026-07-29
- **status:** accepted
- **tier:** B (visual sweep across app-internal tabs; front door excluded to its own pass)
- **decides:** the full-width layout law is FINISHED, and the class-level rule that keeps every "said once" said once
- **pairs-with:** DR-0079 (consistency standard), DR-0116 (the tab law + its own stall lesson), DR-0243 (dedupe/fold), DR-0075 (why + re-review, never silence), DR-0239 §7 (gate-the-class)

## The trigger

Darrell 2026-07-29, with desktop screenshots of Study and TV Time confined to a narrow column on a wide screen: **"Every tab's content is supposed to stretch the width of the screen — why hasn't that occurred yet, and how can we make sure I only have to say something once and the things already said are being taken care of?"** And, sharpening: **"The data screen area is already small... I want the app to feel good on the cellphone and laptop... intentions and obvious-to-me details are usually said over and over and there is documentation for claude not listening... I want Ari and the team of agents to support my stated intentions and also whatever else is possible, opportunities and constraints."**

## The SHOULD/ARE answer (why saying it once didn't stick)

The directive WAS on record — twice: 2026-07-24 (*"why not fill up the whole page"*, `ThinkingSpace.jsx:106` — one surface converted, then the lane stalled) and the standing rule `CONSISTENCY-STANDARD.md` Part I rule 1 (*"every tab renders full-width... no per-surface max-w"*). The guard even existed (`consistency-guard.mjs` width-cap counter). **The failure was the WARN:** the check was left warn-only "until the conversion lane lands," the lane stalled at one surface, and a warning nobody must act on is structurally identical to silence. Same shape as DR-0116's lesson (*"an untracked directive is an unfulfilled one"*) — this is its sibling: **a warn-only directive is an unenforced one.**

## The decision

1. **The sweep is finished, not resumed.** Seventeen app-tab containers converted to full width in one pass (Study, TV Time, Library, Projects, Inventory, Kitchen Inventory, Bus Ministry, Cohort Programs, Voice Studio, Scripture Library, Moore Divahs, Event Management, Eternal Algorithms Study, Creation Workspace, Church Projects, Forecast, Relationships — ThinkingSpace led 2026-07-24). Interior measure stays where it belongs: prose paragraphs, modals, and centered empty-state cards live INSIDE the full-width tab, never as its wrapper. The shell's `<main>` was already `w-full` (`poe-financial-mvp-v28.jsx:4576`) — the caps were per-component drift, exactly what rule 1 predicted.
2. **Width-cap graduated WARN → HARD in the consistency guard.** A new `max-w-*` over the frozen baseline now FAILS the build (`consistency-guard.mjs` ratchet; baseline re-frozen lower post-sweep; proven-to-catch both directions in `consistency-guard.test.js`). The ratchet still lets remaining grandfathered interior caps ratchet down lane by lane.
3. **The class rule — a directive's gate is born HARD.** When a spoken directive gets machinery, the machine check ships ENFORCING from day one, or it carries a one-line why + a `re-review:` date (DR-0075). "WARN until the lane lands" is no longer a shippable state for a directive — that pattern is how this one needed saying three times. Ari's standing duties carry this: supporting the Governor's stated intentions means the intention is enforced by a gate, not remembered by a session.
4. **Both form factors are the bar.** Full-width means the container follows the screen — phone (where it already did) AND laptop (where the dead right half was the defect). Feel-good on both is the QUALITY-OF-LIFE reading of this rule, and the chrome-layout probe's real-width sweep remains the measuring instrument.
5. **The one held surface:** the TLC public door (front-door class, per DR-0116's About precedent) converts in its own Tier C pass — `re-review: 2026-08-12`.

## Verification

Guard CLI green post-sweep (baseline re-frozen: width-cap grandfather count reduced); `consistency-guard.test.js` proves width-cap over-baseline and new-file width-cap now HARD-fail and the reduce/unchanged paths still pass; full suite green; the standard doc's rule 1 status updated from "being established" to ESTABLISHED with this DR.

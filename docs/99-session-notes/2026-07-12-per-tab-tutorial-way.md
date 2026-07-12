# "How to use this tab" — per-tab tutorials that stay current (a Way)

**Recorded:** 2026-07-12 · **Source:** DP — "a how-to-use short video... on each tab
as an option, and it will need to be updated with our updates for whatever was
changed. Research, document, and add the tested then implemented versions when we
need them after those builds." **Status:** researched design; implement AFTER the
current builds (DP's sequencing). Becomes a Way (a DR + this plan).

## The two hard requirements

1. **On every tab**, an *option* to learn "how to use this tab" — short, for the
   elderly/tech-novice church staff (COMMUNITY-FIRST).
2. **It auto-stays-current** — when a tab changes, its tutorial must not silently
   go stale and lie. (Documentation drift is the whole problem.)

## What the research says

- **Interactive walkthrough (coach marks, do-the-real-task) beats a static video**
  for both learning and maintainability. Keep it **SHORT: 3–5 steps** — 3-step tours
  complete 72%, 7-step drop to 16%. Blend: a tour orients → a walkthrough does real
  work → deeper help for advanced.
- **A pre-rendered video is the LEAST maintainable** — it goes stale the instant the
  UI changes and can't auto-update. Offer it only where it genuinely adds value.
- **Keep help CLOSE TO THE CODE; notify on every code change; anchor UI docs to
  something that "cannot lie if it passes."** Drift happens because manual updates
  lag; **agentic/AI regeneration** on change is the modern fix.

## The design (research × our Ways)

1. **A help registry keyed to `surfaces.js`.** Every tab is already a registered
   surface (id/label/nav). Each gets a short **`howToUse`** entry: a 3–5 step
   walkthrough (title + steps), authored close to the surface. One source of truth,
   enumerable, testable.
2. **Coverage gate (proven-to-catch, the feedback-area-guard pattern).** A build
   check: **every registered tab MUST have a `howToUse` entry** — a new tab with no
   tutorial turns the build red. Coverage can't silently regress.
3. **Staleness gate = "auto-updated with our updates."** Each `howToUse` records the
   **fingerprint (content hash) of its tab's source** at authoring time. A build
   check re-hashes the tab and, if it changed, **flags the tutorial STALE** — the
   surface shows an honest "this guide is being updated" state rather than a wrong
   one (unknown/old freshness never reads fresh — DR-0076 / DR-0121 / DR-0125). This
   is the research's "anchor to something that can't lie" + "notify on change."
4. **AI-drafted, HUMAN-REVIEWED regeneration.** When a tab is flagged stale, **Ari
   (using Claude / Gemini / ChatGPT) drafts the updated walkthrough**; a steward
   approves before it publishes. Never auto-publish unreviewed help onto a live tab
   (accuracy is not optional — DR-0076; and church-facing copy is Tier C). Ari owns
   this as a standing duty (DR-0157), the sibling of the comprehensive-review duty.
5. **Format:** the **interactive coach-mark walkthrough is primary** (auto-maintainable,
   highlights the real controls, 3–5 steps). A **short video is an optional extra**
   per tab where it helps — but it carries the same staleness fingerprint, and it is
   labeled the least-auto-maintainable layer.
6. **The "?" affordance on every tab** opens it — consistent placement, one component,
   large tap target, read-aloud (TTS spec, UX-PATTERNS), keyboard-dismissable.

## Why this satisfies "updated with our updates"

The tutorial can't quietly drift: the moment a tab's source changes, the staleness
gate flags its guide, the surface stops claiming an out-of-date guide is current, and
Ari regenerates it for a steward to approve. "Current" is *proven by a passing gate*,
not hoped for — the same discipline as the site-health, tenancy, and feedback-area gates.

## Sequence (after the current builds, per DP)

1. The `howToUse` registry + the "?" walkthrough component on 2–3 tabs (pilot).
2. The **coverage gate** (every tab has a guide) + the **staleness gate** (fingerprint
   per tab) — proven-to-catch.
3. Ari's regenerate-on-stale duty (drafts via the LLMs; steward approves).
4. Optional per-tab short videos where they add value.

## Governance

Church-facing tutorial copy is **Tier C** (a steward approves regenerated guides
before publish). The gates are the brake; Ari advises with drafts; the steward decides.
Recorded as a Way (DR to follow); pairs with DR-0157 (Ari's duties), DR-0121/DR-0125
(freshness never faked), and the feedback-area / site-health gate precedents.

## Sources

- appcues.com/blog/product-tours-walkthroughs-ultimate-guide · userpilot.com/blog/interactive-walkthroughs-improve-onboarding · whatfix.com/interactive-walkthrough · productfruits.com/blog/interactive-walkthrough-vs-product-tour
- madewithlove.com/blog/pragmatic-ways-of-keeping-documentation-up-to-date · medium.com/collaborne-engineering/agentic-documentation-keeping-product-docs-in-sync-with-code · docs.github.com/copilot/copilot-chat-cookbook/documenting-code/syncing-documentation-with-code-changes

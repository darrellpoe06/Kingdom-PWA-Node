# DR-0093 — One home for the family: consolidate the people inputs, siblings point, never duplicate

- **Status:** accepted
- **Tier:** B (consolidation of existing surfaces; no new data model)
- **Scope:** every surface that inputs family/people state; the pattern for all future "too many similar places" findings
- **Date:** 2026-07-03
- **Principles:** APP-IS-PRIMARY, ONE-APP-EVERYTHING-COMES-TOGETHER, REALITY-TRACE, VERIFICATION-DOCTRINE, PERPETUAL-IMPROVEMENT, GOVERN-EXECUTE-ADVISE, DECISION-RECORDS

## Directive

Darrell, 2026-07-03, holding two screenshots of the live Admin → People & Access page: "Where do you add family? We have too many places that are similar. We could make sure we have all the features and they work — consolidate the inputs from users inside one that has all the features and conditions of the others, and bring close workflows together to support both or all options and consolidate."

## What the trace found

Four sibling surfaces touched "people," none complete: **Admin → People & Access** (read-only allowlist + role check + request count), the **Access** tab (usage metrics), **Relationships** (the guardian↔child capability editor — driven by hardcoded `'Twin A'/'Twin B'` placeholder personas, with panel copy still claiming family finances "cannot be granted" after DR-0092 said otherwise, and a config-flatten bug where one child's settings bled onto every sibling), and the new **Family Roster** (add a member). On the live build there was NO way to add family at all, and the roster's own card pointed users BACK to Relationships — fragmenting the exact flow it existed to unify.

## Decision

**The Family Roster (Center → Serve) is the ONE input home for the family.** Consolidated onto it, one page, one flow:
1. **Add a member** (DR-0091 rails) →
2. **Decide what each child can see & do** — the full capability editor (`GuardianChildPanel`, extracted from Relationships), driven by the REAL roster personas, per-child config properly scoped (`configByPersona` — the sibling-bleed bug fixed and pinned by test), with **See family finances** offered as the guardian's free three-way choice (DR-0092) and the acting capabilities (spend / security) still locked →
3. **Work the approval queue** — a child's ask-first request is approved or denied on the same page.

**Siblings point, never duplicate:** Relationships keeps its landlord↔tenant domain and its read-only matrix; its guardian tab is now a pointer card to the one home. The stale "cannot be granted" copy is corrected in both the panel and the registry blurb. The placeholder personas are deleted — the editor renders real rows or nothing.

## The standing pattern this sets

When a "too many similar places" finding lands: pick the surface closest to the user's mental model as the ONE input home, move ALL the features and conditions of the others onto it (not a subset), convert the siblings to pointers, and delete any painted stand-in data the duplicates were hiding. A pointer is one line; a duplicate is a fork that drifts.

## Guards

`family-roster.test.jsx`: the editor renders from real personas (placeholder literals are asserted absent from Relationships); finance.view shows No/Ask/Yes unlocked; spend shows Locked with no buttons; a grant saves a persona-scoped row for the selected child only; the approval queue patches the real request row; Relationships contains the pointer and not the input.

## Not done, with why (DR-0075)

- **Admin → People & Access and the Access tab keep their read-only roles** (who can reach the backend; usage metrics) — they are views, not inputs, so they do not fragment the input flow. Folding them into a single People console is the natural next consolidation. **re-review: after PR #519 soaks — the same pattern applies (one home, pointers).**

---
id: DR-0201
title: Inline, No Jumping — an action or change appears where the eye already is, never off in another part of the screen
status: accepted
date: 2026-07-20
tier: A
declared_by: Darrell
supersedes: none
amends: standing UX principle; first applied to the Imported combine bar
principles: [EXCELLENCE-STANDARD, ANXIETY-CLARITY-PRINCIPLE, APP-IS-PRIMARY (DR-0065), CONSISTENCY-STANDARD (DR-0079)]
---

## Context

Darrell, 2026-07-20 (selecting two duplicate salary rows deep in the Imported
register; the "Combine 2" bar appeared at the TOP of the page, far from the rows):

> "I see it at the top — the Ways should state everything is inline, no jumping to
> another place in the same screen, and whatever changes, have it appear where the
> eye already expects... not outside the screen... add to Ways and documentation."

The combine action bar rendered above the filters, while the checkboxes being
ticked were near the bottom of a long list — so the confirmation and the action
sat where the user was NOT looking. The eye had to jump.

## The Way

**When a user acts on something, the response — a confirmation, an action bar, a
newly-revealed control, an updated value — appears WHERE THE EYE ALREADY IS: in the
flow, next to the thing acted on, on-screen. It never forces a jump to another part
of the screen, and it never lands off-screen.**

Concretely:
- **A selection / bulk action bar stays in view with the selection** — it floats
  or pins so it is visible while you tick rows anywhere in a long list, not parked
  at the top where a deep selection can't see it. (Applied: the Imported combine bar
  is now a floating action bar, verified in `imported-render.test.jsx`.)
- **A revealed control appears at its trigger**, not elsewhere (the Edit textarea
  opens on the note; the Add-update field opens under the row — already so).
- **An updated value updates in place** — the number the user just changed reflects
  where it already sits (DR-0061 live surfaces), not by sending the eye elsewhere.
- **The one allowed movement is an EXPLICIT "take me there."** When the user
  deliberately asks to go to another region (e.g. the Reports-menu "View" that opens
  a KPI panel), a *smooth scroll that carries the eye with it* is acceptable —
  continuity, not a jump. A response the user did NOT ask to relocate must not
  relocate. (Re-review the KPI "View" scroll against this line: `re-review:
  2026-10-20` — it is an explicit "go there", so it stands, but noted.)

## Opportunities & Constraints

- **Opportunity:** removes a whole class of "where did that go / how do I do this"
  friction (ANXIETY-CLARITY) — the answer is always in front of you. Pairs with the
  discoverability fixes this session (Edit chip, KPI View, the combine bar).
- **Constraint:** a floating/pinned element must not collide with the fixed
  corner controls (Feedback, voice) — the combine bar sits above them (`bottom-20`),
  centered, sized to the viewport. A future audit could sweep other surfaces for
  top-parked action bars (DR-0075).

## Verification (DR-0076)

`imported-render.test.jsx` (+1): selecting 2 rows renders the combine bar with
`fixed` positioning (floats into view, not parked at top), and a selected row's
description un-truncates to full text so PPD IDs can be verified before merging.
Recorded in UX-PATTERNS.md. Lint + consistency + full suite green. REV-0173;
memory `feedback_inline_no_jumping`.

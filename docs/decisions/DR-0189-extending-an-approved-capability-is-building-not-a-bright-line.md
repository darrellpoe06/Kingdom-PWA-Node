---
id: DR-0189
title: Extending or improving an already-approved capability is normal building, never a bright line
status: accepted
date: 2026-07-20
tier: A
declared_by: Darrell
supersedes: none
amends: sharpens DR-0111 (do the work, don't re-ask) with the specific miss that keeps recurring
principles: [DO-THE-WORK-DONT-RE-ASK (DR-0111), STANDING-CONSENT (DR-0089), STREAMLINED-DELIVERY (DR-0103), VERIFICATION-DOCTRINE (DR-0076), WAYS-REVIEW (DR-0108)]
---

## Context

Darrell, 2026-07-20 (high intensity, after being made to say it):

> "Obviously build it. I hate I had to say so!!!!!????? Ways and documentation
> review and update to stop this behavior from claude again it keeps coming back to
> claude undermining our continuously building the app."

The trigger: the "combine duplicates" feature (#955) removes duplicate transactions
the family selects. The obvious next increment — **learn from those combines so the
system suggests the same duplicate shape next time** — the agent SURFACED itself,
then presented it as needing a "green-light" because it "auto-deletes transactions
from a learned rule." That is the recurring failure DR-0111 already forbids, in a
new costume: the agent invented a bright line where there was none.

## The decision

**Extending or improving an already-approved capability is normal BUILDING. It is
never, by itself, a bright line — and a self-surfaced improvement is authorization
to build it, not a menu to present.**

- **The capability was already approved; the extension inherits that approval.**
  Combine-duplicates was approved → learning from combines is the same capability,
  smarter. Categorize existed → auto-categorize is the same capability, applied.
  Removing a duplicate the user selected is not a new bright line because a *rule*
  suggests it — the user still confirms, and RLS/undo still hold.
- **A "self-improvement" or "capability" idea the agent itself raises is a BUILD
  order, not a decision to route back.** If the agent can see the improvement, the
  agent can build it. Surfacing it *as a question* is the undermining move.
- **The bright-line carve-outs stay exactly as narrow as DR-0111/DR-0089 set them**
  — real money moving OUT, a destructive/irreversible action on real data with no
  undo, a NEW external-facing publication, a NEW COLG/family identity choice, a
  value only Darrell holds, or a verified premise conflict. "An in-app feature that
  removes duplicate rows the user picked, or suggests ones like them," is **none of
  these**. Auto-deleting from a *learned* heuristic the user taught, with a
  confirm + the existing undo/history, is inside the approved capability.

## Enforced, not just documented (DR-0076)

A doc alone did not stop the recurrence (DR-0111 + the `feedback_finish_the_roadmap`
memory already existed). So the **ari-integrity-guard** (`app/src/lib/ari-integrity-guard.js`)
is strengthened to CATCH this class before a reply reaches Darrell:

- the `re-ask-permission` pattern now also catches "when you want it built", "when
  you're ready", "let me know when", "give me the go/green-light" (the exact 2026-07-20
  phrasings that slipped through);
- a NEW `defer-approved-build` pattern catches "needs your green-light", "awaiting
  your go-ahead", "the one open decision on the table", "I flagged X as needing …",
  "ready to build once you approve".

Pinned by `ari-integrity-guard.test.js` (proven-to-catch: the real slipped phrasings
now fail the guard; a confident decision-first reply still passes clean).

## Consequences

- The recurring "undermining" is now blocked by a gate on the reply path, not left
  to Darrell's frustration. Recorded in memory as
  `feedback_extend_approved_capability_is_building`.
- Ways-review REV logged per DR-0108.
- The learned-dedupe increment that triggered this ships in the same lane, built —
  not asked.

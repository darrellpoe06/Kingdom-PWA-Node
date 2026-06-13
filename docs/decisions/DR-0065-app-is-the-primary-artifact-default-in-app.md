---
id: DR-0065
title: The app is the primary artifact — default to building in it; encoded in Layer 0 so context purges don't lose it
date: 2026-06-13
status: accepted
supersedes: []
superseded-by: null
refines: [DR-0061]
tier: A
entities: [all]
grounds: [GOVERN-EXECUTE-ADVISE, DATA-DRIVEN-LIVING, QUALITY-OF-LIFE, COMMUNITY-FIRST]
source: 2026-06-13 — Darrell — "All of this should be in app because it makes sense ... the app is always the main thing we are actively creating and fixing everything ... [the AI] goes offline or purges its memory just to keep talking to the user, losing context for relevance and current information."
---

## Context

Repeatedly, Darrell has had to tell the agent to "build it in the app too." The
root cause he named is structural: the grounding that **the app is the main
thing** lives in conversation, which compacts and is lost on session restart, so
each fresh session re-derives priorities from whatever is nearest and has to be
re-taught the center. That is a memory-architecture failure, not a one-off miss.

## Decision

**The PoeTech PWA is the primary artifact** — the thing actively being built and
fixed; everything orbits it.

- **Default to building capability INTO the app.** If a capability can live in the
  app (a surface, a real-data view, a control, a review queue), it should —
  without being asked. Repo artifacts (docs, decision records, the governance
  queue, foundation files) are the spine and the durable memory, **in service of**
  the app, never a substitute for shipping where the user lives.
- **Built outside → still ask "what's its surface inside the app?"** Things that
  genuinely belong outside (binding rules, decision records, the policy spine,
  NAS-side workflows the cloud can't reach) are built outside; the default
  follow-through is the in-app surface.
- **Surface both when both make sense** (proven 2026-06-13 with the governance
  decision queue: repo file = source of truth + memory; in-app Governor-gated tab
  = where it's reviewed).

**The load-bearing part of this decision is its LOCATION.** It is written into
`CLAUDE.md` (Layer 0), which every session loads first, because a decision record
is read only when consulted, and the failure being fixed is the agent not holding
this *before* it is asked. This DR is the ledger entry; `CLAUDE.md` is the
enforcement.

## Consequences

- "Build it in the app" stops being a per-session re-assertion; it is the standing
  default, loaded first, every session.
- Refines DR-0061 (surfaces are live views of real flow): that governs *how*
  surfaces behave; this governs *that the app is where capability lands by
  default*.
- The agent's first question on any new capability becomes "where does this live
  in the app?" — not "is a doc/script enough?"

## Links

`CLAUDE.md` — "The App Is the Primary Artifact" (Layer 0 enforcement, the
load-bearing copy), [DR-0061] (live surfaces over real flow),
`_root/QUALITY-OF-LIFE-AS-NORTH-STAR.md`, `docs/governance/decision-queue.md`
(the build backlog this informs).

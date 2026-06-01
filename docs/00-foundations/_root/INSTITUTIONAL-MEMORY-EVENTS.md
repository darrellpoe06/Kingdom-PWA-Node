# INSTITUTIONAL-MEMORY-EVENTS

**Declared:** 2026-06-01
**Declared by:** Darrell
**Status:** Binding foundation principle

---

## The principle

Per Darrell, 2026-06-01 evening (after the day's debug arc and the cascade of new binding principles):

> "always now for moving forward with fixes and other pipeline issues hopefully we can document these events in the PoeTech App and use it to process all this upcoming projects for various life and Church work that's coming and currently ongoing."

The PoeTech App is not just a system that runs the family OS. It is also the META system that captures, documents, and processes the events of building and operating itself — and every life-work and Church-work project the Poe family and their communities undertake. **Self-documenting. Self-processing. Self-improving across time.**

Every fix, every pipeline issue, every decision, every learning, every family input, every Church-work milestone, every life-work event becomes **first-class structured data inside the App** — not just session-note prose buried in `docs/99-session-notes/`.

## Why this matters

1. **Pattern detection across time.** When the 3rd Code-node-sandbox bug surfaces six months from now, the system surfaces "we have seen this class twice before — here is the fix pattern." When the 5th family-voice request looks like Christina's Holly Hill ask, the system surfaces "we have a Comp-Based-Appraisal pattern; here is how it ran last time."
2. **Onboarding any contributor in hours, not weeks.** New family member or COLG steward reads the Events log and sees the WHY behind every architectural choice, every workflow, every module.
3. **Life work + Church work get the same engine.** COLG building maintenance, ministry programs, leadership decisions, community outreach, family milestones (kids' education, financial decisions, vacation reviews, real-estate moves) — all flow through the same Events model. The Church Module + Life Module become specializations of the same institutional-memory backbone.
4. **Decisions inherit understanding.** Future stewards see the why-and-context, not just the outcome. The standing rule "give from a place of understanding" applies to system stewardship across time, not just any given conversation.
5. **Compounding pre-build value.** Per [WORKFLOW-MODULE-LIBRARY](./WORKFLOW-MODULE-LIBRARY.md): every Event becomes input to "should this become a reusable module?" The library grows from observed patterns.

## Event schema (initial draft; refined when the module ships)

```
{
  id: "evt-YYYYMMDD-HHMMSS-NNNN",
  date: ISO-8601,
  type: "fix" | "incident" | "decision" | "principle" | "evaluation"
        | "family-input" | "church-work" | "life-work" | "milestone",
  title: short string,
  description: full prose,
  root_cause: nullable string (for fixes / incidents),
  resolution: nullable string (for fixes / incidents / decisions),
  tags: {
    workflows: ["wf30", "wf31", ...],
    modules: ["family-voice-loop", "rentals", "spiritual", ...],
    sector: ["financial", "spiritual", "community", "church", ...],
    senders: ["dpoe", "cpoe", "christiana", ...]
  },
  provenance: { who, when, source_surface },
  learnings: prose describing what to do / not do next time,
  related_artifacts: [paths to session notes, commit SHAs, file:line refs],
  status: "open" | "in-progress" | "resolved" | "supersedes:evt-XXX"
}
```

## How to apply

Effective immediately (even before the module ships):

- **Every significant fix / decision / learning gets logged as an Event entry** — not just a session note. Until the module ships, session notes serve as the durable form, BUT they are structured with explicit Event fields (type, root_cause, resolution, tags, learnings, related_artifacts) so they can be ingested wholesale when the module lands.
- **Every scheduled check-in surfaces recent Events** alongside commits and family voices.
- **The Workflow Module Library** (per [WORKFLOW-MODULE-LIBRARY](./WORKFLOW-MODULE-LIBRARY.md)) **is itself documented as Events:** each module's birth, validation, and reuse history is event-tracked.
- **Every binding principle gets an entry:** name, when-declared, who-by, the failure that triggered the naming, the rule, the application.

## Application to Life work

Home repairs, kid milestones (Christiana UIUC fall 2026, twins age 10 → 11), financial decisions (today's Holly Hill equity-out exploration), family-vision events (Maui vacation arc), real-estate moves, vehicle purchases, healthcare events, education choices.

Each gets an Event entry. The Life Module surface lets the family review the pattern: "we made 7 financial decisions this year; their average outcome relative to forecast was X."

## Application to Church work (COLG and beyond)

COLG building maintenance events, ministry programs launched / sunset, leadership meeting decisions, community outreach efforts, prayer initiatives, congregation milestones, financial stewardship events.

The Church Module surface lets COLG leadership review: "this is what we tried, this is what worked, this is the pattern we are seeing across three years."

## Pairs with

- [WORKFLOW-MODULE-LIBRARY](./WORKFLOW-MODULE-LIBRARY.md) — Events feed into the library: patterns observed across Events become candidate modules to build.
- [EXECUTION-OUTCOME-OBSERVABILITY](./EXECUTION-OUTCOME-OBSERVABILITY.md) — runtime outcomes become Event records.
- [INPUT-VISIBILITY-TO-CLAUDE](./INPUT-VISIBILITY-TO-CLAUDE.md) — family inputs become Event records as soon as they arrive.
- [AI-FOUNDATION-INTERNAL-OPERATIONS](./AI-FOUNDATION-INTERNAL-OPERATIONS.md) — the AI Foundation maintains the Events log; it is the system's institutional memory keeper.
- [BUSINESS-PROCESS-CONNECTIONS](./BUSINESS-PROCESS-CONNECTIONS.md) — every visible Event surface wires both ends (capture + review).
- [ANXIETY-CLARITY-PRINCIPLE](./ANXIETY-CLARITY-PRINCIPLE.md) — historical Events answer what/when/why/how for any current decision; reduces anxiety by surfacing precedent.
- [COMMUNITY-FIRST-MISSION](./COMMUNITY-FIRST-MISSION.md) — the Church Module's Events feed COLG-specific institutional memory back to the community Darrell serves first.
- [QUALITY-OF-LIFE-AS-NORTH-STAR](./QUALITY-OF-LIFE-AS-NORTH-STAR.md) — Events span all 9 QoL sectors; the App's institutional memory is one of the surfaces that shows whether QoL is improving.

## Open buildout

1. **Design + ship the `Events` module** as a Tier 3 universal module in the Workflow Module Library. Surface: searchable, filterable, taggable. Storage: sovereign (NAS or Supabase per family-controlled-data principle).
2. **Backfill today's events** as the first records when the module ships:
   - wf30 silent-fail (type: fix, root_cause: process.env not in n8n Code sandbox, resolution: commit 1edb8e1, learning: validation gates needed)
   - 4 new binding principles named today (type: principle x 4: execution-outcome-observability, workflow-module-library, input-visibility-to-claude, institutional-memory-events)
   - Christina's Holly Hill comp drop (type: family-input + evaluation, see `docs/99-session-notes/2026-06-01-holly-hill-equity-evaluation.md`)
   - The phone-shell-to-NAS capability proof (type: milestone)
   - The Tailscale + Chrome MCP n8n UI fix path (type: milestone / capability-discovery)
3. **Extend wf36 Quality Gatekeeper** to auto-log fix Events on every workflow incident.
4. **Add Event surface to Church Module + Life Module** (when those ship) so COLG and family-life events get the same treatment.

## Cost of not building this

Every fix is local knowledge in someone's head or a session note in a doc directory no one navigates. Patterns are not detected. Onboarding takes weeks. Decisions get re-litigated because no one remembers why we chose what we chose. Life and Church work happens without the compounding benefit of prior work.

## Cost of building this

Real work — schema, surface, backfill, ingestion patterns. But the value compounds with every Event captured. By the 100th Event, the system is teaching the family things they would not have noticed otherwise.

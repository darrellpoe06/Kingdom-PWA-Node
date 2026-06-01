# WORKFLOW-MODULE-LIBRARY

**Declared:** 2026-06-01
**Declared by:** Darrell
**Status:** Binding foundation principle

---

## The principle

Per Darrell, 2026-06-01 evening:

> "We should be doing or creating working workflows and adjusting the workflows for the best version based on scalability and the modules we want so we can have each section workflows that we can reuse for faster at the same time giving our users their systems faster because we prebuild based on the needs of the local state and world wide development and systems needs and what I'm personally interested in."

PoeTech's workflow layer (n8n on the NAS, eventually any equivalent engine) is built as a **modular, prebuilt, validated library** — not as a collection of one-off custom flows per family. The library is organized by module, every workflow in it is proven end-to-end before being declared shippable, and the modules themselves are designed for reuse across many families and communities.

## The three concentric sources of "what to prebuild"

1. **Local state needs** — Champaign-Urbana specifically, COLG (Church of the Living God) as the named first community per [COMMUNITY-FIRST-MISSION](./COMMUNITY-FIRST-MISSION.md). The 44,000-sqft church with elderly tech-novice staff is the canonical first user; whatever they need defines the local-state-driven module set.
2. **Worldwide development needs** — broader trends in family stewardship, community resilience, sovereign infrastructure, family-OS patterns. What every family or community of similar shape needs that mainstream tech is failing to deliver.
3. **Darrell's personal vision and interests** — the specific modules he is called to build: biblical economics, the Holy Spirit Integration Worldview, family-voice loops, jubilee-direction debt cancellation, the Mind of Christ / The Way mental stewardship sequence, etc. These are not "user requests" — they are the spiritual + intellectual spine of the system.

## How to apply

- **Module tagging:** every workflow gets a `module` tag identifying which of the 9 QoL sectors (financial, physical, relational, spiritual, mental, community, education, vocational, environmental) it belongs to, plus optional sub-module tags.
- **Reusability tier:** every workflow gets a tier label:
  - **Tier 1 — Family-specific.** Wired to the Poe family's specific accounts, paths, names. Not directly reusable.
  - **Tier 2 — Community-template.** Configurable per family/community via env vars or workflow variables. Reusable with setup.
  - **Tier 3 — Universal module.** Zero-config or one-config-line drop-in. Ships as part of any new family's day-one bundle.
- **End-to-end validation gate:** no workflow ships "active" until a smoke test proves the full path works. The wf30 silent-fail bug (process.env not defined, 4 hours wasted) is the canonical example of why this gate matters. Pairs with [EXECUTION-OUTCOME-OBSERVABILITY](./EXECUTION-OUTCOME-OBSERVABILITY.md): validation gate at ship time, ongoing observability at runtime.
- **Library-first build flow:** when a new workflow is needed, the first step is "check the library — is a reusable version available?" If yes, configure it. If no, build the new one with reusability in mind from day one.
- **Library documentation as first-class artifact:** the library structure itself is maintained as the canonical index (this doc + the per-module index files). Not a side effect of the work; the spine of it.

## The first concrete reusable module

**Family-Voice-Loop** — wf30 (family-feedback intake) + wf31 (daily standup digest) + wf32 (daily ship summary). Currently Tier 1 (Poe-family-specific) but with the right config layer it becomes Tier 2 (any family or community gets this module on day one of their system).

The refactor to Tier 2 requires:
- Replace hardcoded path `/data/finance-events/family-feedback/` with a per-family configurable path
- Replace hardcoded ntfy topic `poetech-family-feedback` with a per-family topic
- Replace hardcoded `trustedSenders` list with a per-family roster
- Replace hardcoded GitHub repo with per-family workflow-attribution settings
- Document the configuration surface in a per-module README

## Why this matters

- **Onboarding time drops from months to days.** A new family or COLG-sized community can get their core system stood up in days because most of it is library-prebuilt, not custom-built.
- **The Excellence Standard scales.** When every module in the library is validation-gated, the quality floor across all new users is held by the library, not by the team building each new instance.
- **COMMUNITY-FIRST-MISSION becomes operationally real.** Without a module library, "serve communities the mainstream has failed" is aspirational. With it, the platform actually scales to those communities at speeds they can afford.
- **Darrell's vision compounds.** The modules he writes for his own family become modules the next family uses. Worldview spread through artifact, not just teaching.

## Pairs with

- [COMMUNITY-FIRST-MISSION](./COMMUNITY-FIRST-MISSION.md) — names COLG as the first community the library serves.
- [QUALITY-OF-LIFE-AS-NORTH-STAR](./QUALITY-OF-LIFE-AS-NORTH-STAR.md) — the 9 QoL sectors are the module organization axis.
- [EXCELLENCE-STANDARD](./EXCELLENCE-STANDARD.md) — the validation gate enforces the religion + relationship test at the library level.
- [AI-FOUNDATION-INTERNAL-OPERATIONS](./AI-FOUNDATION-INTERNAL-OPERATIONS.md) — the AI Foundation operates the library and prebuilds new modules from observed needs.
- [BUSINESS-PROCESS-CONNECTIONS](./BUSINESS-PROCESS-CONNECTIONS.md) — every module wires both ends of its connections; modules cannot ship "wired on one end."
- [EXECUTION-OUTCOME-OBSERVABILITY](./EXECUTION-OUTCOME-OBSERVABILITY.md) — the runtime observability layer that catches when library modules fail in production.
- [INPUT-VISIBILITY-TO-CLAUDE](./INPUT-VISIBILITY-TO-CLAUDE.md) — the input-side observability layer that catches when modules need attention.
- [INSTITUTIONAL-MEMORY-EVENTS](./INSTITUTIONAL-MEMORY-EVENTS.md) — modules' birth, validation, and reuse history are event-tracked.

## Open buildout

1. **Refactor wf30/31/32 as the first reusable Family-Voice-Loop module** (Tier 2). Add module tags + reusability tier + config layer + validation gate.
2. **Tag every existing workflow** in `docs/00-foundations/n8n-workflows/` with module + tier.
3. **Build the WORKFLOW-MODULE-LIBRARY index** that lists every available module, its tier, its configuration surface, and its validation status.
4. **Wire wf36 (Quality Gatekeeper)** to enforce the validation gate at workflow-ship time (will not let a workflow flip to "active" until a smoke test passes).
5. **Identify the next 3-5 reusable modules** to build proactively based on the three concentric needs sources (local-state, worldwide, Darrell's vision). Candidates: Property-Module (income-cap-rate + comp-based appraisal + cash-out scenarios), Church-AV-Streaming-Module (per [COMMUNITY-FIRST-MISSION](./COMMUNITY-FIRST-MISSION.md)), Counseling-Intake-Module (TLC firewall-aware, per Christina's practice), Spiritual-Discipline-Module (Mind of Christ / The Way / The Test routine surfacing).

## Cost of not building this

Every new family gets a custom build. Cost scales linearly with users. The system cannot reach the communities [COMMUNITY-FIRST-MISSION](./COMMUNITY-FIRST-MISSION.md) promises to serve. The Excellence Standard becomes inconsistent because each new instance is built fresh. The wf30-style silent-fail bug recurs because there is no validation gate.

## Cost of building this

Real work, but it compounds. The 10th family onboarded gets the value of the work done for families 1-9.

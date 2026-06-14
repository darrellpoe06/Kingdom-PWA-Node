# Principles Registry — cite these by ID, don't re-enumerate

**Status:** Registry (the cite-once source for DR `grounds:`). Created 2026-06-09.
**Why:** so a Decision Record binds to a principle with a short stable ID (e.g. `TLC-FIREWALL`) instead of re-listing the underlying files every time. This is the single place the binding filters live with IDs; the authoritative text stays in `CLAUDE.md` and the foundation docs named below.

When a recalled memory or doc named here moves, update the **source** column here once — every DR that cites the ID inherits the fix.

| ID | Principle (one line) | Authoritative source |
|---|---|---|
| **TLC-FIREWALL** | TLC clinical / PHI never routes to any vendor/cloud LLM; sovereign-only, fail-closed; if possibly clinical, treat as clinical. | `CLAUDE-TOOL-ROUTING.md`; `CLAUDE.md`; Counseling team `allowed_providers=[ollama]` |
| **THREE-BRAKES** | No timer-driven/self-triggering automation ships active without budget + concurrency lock + kill-switch (+ human-demand preemption as a 4th). | `CLAUDE.md` "Autonomous Automation Requires Three Brakes"; `LESSONS-LEARNED.md` P10/P11/P12; `feedback-autonomous-automation-three-brakes` |
| **CAGE** | All autonomous action rides behind guarded-action allowlist + append-only hash-chained audit ledger + 120 s health-gate/auto-rollback; the agent never owns the ledger box. | `infra/ai-orchestrator/` |
| **TIER-C** | Autonomous/timer-driven/write-capable automation is Tier C (soak + family review + Quality Gatekeeper); "NAS-only/additive" does not downgrade it. | `RELEASE-TIERS.md`; `LESSONS-LEARNED.md` P12 |
| **SOVEREIGN-FIRST** | Tier 0 sovereign (Ollama on owned hardware) is the default; vendor LLMs are explicit escalation only. | `CLAUDE-TOOL-ROUTING.md` |
| **COST-DISCIPLINE** | $0 marginal default; combined vendor spend $25/mo soft cap, $50/mo hard stop; earn the spend with growth-justification. | `CLAUDE-TOOL-ROUTING.md`; `project-cost-discipline-with-growth-permission` |
| **NO-DATA-SALE** | First-party data captured with consent, used internally only; never sold, no engagement-extraction, no ad model, no dark UX; deletion immediate + verifiable. | `DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md` |
| **ALIGNED-FUNDING** | Community-free funded by vetted aligned-brand partners — never by selling data or skimming subscribers. | `project-community-free-funded-by-aligned-brand-sponsorship` |
| **COMMUNITY-FIRST** | COLG is the named first community; accessibility default (elderly tech-novice); serve-not-extract. | `COMMUNITY-FIRST-MISSION.md` |
| **WORD-FIRST** | Church content is doctrine-gated; Scripture senior to tradition; non-denominational, Body-undivided; per-tradition weights with Bishop Gwin. | `project-non-denominational-word-first-body-undivided`; `SCRIPTURE-REFERENCE-STANDARD.md` |
| **GOVERN-EXECUTE-ADVISE** | Darrell governs, Foundation executes, Claude advises; offload toil to LLMs — clicks become API calls; browsers are for humans deciding, not systems doing. | `GOVERNANCE-EXECUTION-ADVISORY.md`; `AI-FOUNDATION-INTERNAL-OPERATIONS.md` |
| **SOVEREIGN-IDENTITY** | Self-hosted IDP/SSO + sovereign email; token isolation + permission gates; no external proprietary identity dependency in the core. | `IDENTITY-ROLES-AUDIT.md`; SOUL.md secure-access posture; COLG-NAS "Path C real auth" |
| **DATA-DRIVEN-LIVING** | Estimates anchored to + re-baselined against interconnected telemetry (Reel, Events, Observability, Module Library); when telemetry contradicts an estimate, telemetry wins. | `project-continuous-feedback-reel`; `EXECUTION-OUTCOME-OBSERVABILITY`; `INSTITUTIONAL-MEMORY-EVENTS`; `WORKFLOW-MODULE-LIBRARY` |
| **RESEARCH-FIRST** | No production change without a research-review first; read ground-truth files before composing. | `feedback-research-first` |
| **SURFACE-PREMISE** | When a plan rests on a verifiably-wrong premise, stop before irreversible steps and offer options. | `feedback-surface-premise-conflicts` |
| **EARN-AUTONOMY** | Nothing self-activates unattended; ship inactive, turn on with someone watching, earn trust/autonomy per surface as the Cage proves safe (the quarantine bright line). | `LESSONS-LEARNED.md` P11; the post-incident quarantine |
| **DECISION-RECORDS** | One decision = one append-only DR with a stable ID; never rewrite, supersede; the INDEX is the source of truth; narrative references DRs by ID. | `docs/decisions/README.md`; [DR-0011] |
| **SESSION-ISOLATION** | No two sessions write the same working tree or branch at once; each writing session works on its own branch in its own worktree/clone; integrate via PR. | `CLAUDE.md` Two-Session Git Race rule; [DR-0011] |
| **DR-NUMBER-ALLOCATION** | Allocate a DR's number against the LIVE `origin/main` INDEX Next-ID (never the stale branch-point copy); the number is provisional until merge; re-check before merging and renumber on collision. | [DR-0052] |

*Add an ID here before citing it in a DR. Keep one line per principle; the depth lives in the source.*

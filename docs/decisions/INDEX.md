# Decision Records — INDEX

**This is the single source of truth for "what is decided."** To check whether something landed, read this table — not a narrative doc. Convention: [`README.md`](README.md). Principles cited by ID: [`PRINCIPLES.md`](PRINCIPLES.md).

| ID | Title | Status | Tier | Entities | Grounds |
|---|---|---|---|---|---|
| [DR-0001](DR-0001-gpu-scheduling-three-layers-of-yield.md) | GPU scheduling — three layers of yield on a 24/6.5 cadence | accepted | C | all | THREE-BRAKES, CAGE, COMMUNITY-FIRST, EARN-AUTONOMY |
| [DR-0002](DR-0002-llm-authored-content-is-future-staged.md) | LLM-authored website/content updates are FUTURE, staged, gated | accepted | C | all | CAGE, TIER-C, WORD-FIRST, TLC-FIREWALL, EARN-AUTONOMY |
| [DR-0003](DR-0003-three-entities-three-isolation-tiers.md) | Three entities, three isolation tiers (ISO-1/2/3); TLC senior | accepted | C | church, tlc, poetech | TLC-FIREWALL, WORD-FIRST, COMMUNITY-FIRST, CAGE, SOVEREIGN-FIRST |
| [DR-0004](DR-0004-estimates-are-data-driven-and-living.md) | Estimates are data-driven and living, not a waterfall | accepted | n/a | all | DATA-DRIVEN-LIVING |
| [DR-0005](DR-0005-self-updating-loop-for-us-by-us.md) | The self-updating "for us, by us" loop through poetech.us | accepted | C | all | GOVERN-EXECUTE-ADVISE, NO-DATA-SALE, CAGE, DATA-DRIVEN-LIVING |
| [DR-0006](DR-0006-continuous-multi-site-review-per-entity-objectives.md) | Continuous multi-site review + per-entity objectives | accepted | C | church, tlc, poetech | CAGE, TLC-FIREWALL, WORD-FIRST, COMMUNITY-FIRST, SOVEREIGN-FIRST |
| [DR-0007](DR-0007-calendar-auto-update-from-approved-decisions.md) | Calendar auto-update from staff-approved decisions (feeds blackout) | accepted | C | church, tlc, poetech | CAGE, WORD-FIRST, TLC-FIREWALL, EARN-AUTONOMY |
| [DR-0008](DR-0008-outcome-driven-funnel-sovereign-analytics.md) | Outcome-driven funnel + sovereign privacy-respecting analytics | accepted | C | church, tlc, poetech | NO-DATA-SALE, ALIGNED-FUNDING, SOVEREIGN-FIRST, TLC-FIREWALL, DATA-DRIVEN-LIVING |
| [DR-0009](DR-0009-first-party-data-identity-no-data-sale.md) | First-party data + sovereign identity; we do not sell data | accepted | C | church, tlc, poetech | NO-DATA-SALE, SOVEREIGN-IDENTITY, TLC-FIREWALL, ALIGNED-FUNDING, DATA-DRIVEN-LIVING |
| [DR-0010](DR-0010-llms-do-the-work-bounded-autonomy.md) | LLMs do the work — bounded autonomy, reconciled with the brakes | accepted | C | all | GOVERN-EXECUTE-ADVISE, CAGE, THREE-BRAKES, TIER-C, EARN-AUTONOMY, TLC-FIREWALL, WORD-FIRST |
| [DR-0011](DR-0011-operating-model-how-we-work.md) | Operating model — append-only decisions, session isolation, narrative vs decision | accepted | n/a | all | DECISION-RECORDS, SESSION-ISOLATION, GOVERN-EXECUTE-ADVISE, RESEARCH-FIRST, EARN-AUTONOMY |
| [DR-0012](DR-0012-gpu-topology-conservative-single-4070-creative-preemption.md) | GPU topology — conservative single-4070; creative-app CUDA is absolute-priority preemption | accepted | C | poetech, all | THREE-BRAKES, CAGE, GOVERN-EXECUTE-ADVISE, EARN-AUTONOMY, COST-DISCIPLINE, DATA-DRIVEN-LIVING |
| [DR-0013](DR-0013-sovereignty-roadmap-vendor-optional-milestones.md) | Sovereignty roadmap — phased vendor-optional milestones (two milestones, swappable router) | accepted | C | all | SOVEREIGN-FIRST, COST-DISCIPLINE, DATA-DRIVEN-LIVING, GOVERN-EXECUTE-ADVISE |
| [DR-0014](DR-0014-hardware-budget-directive-procurement-plan.md) | Hardware budget directive (2026-06-09) — PoeTech $5k farm + Church >=$5k node (PLAN, not purchase) | accepted | C | poetech, church | SOVEREIGN-FIRST, COST-DISCIPLINE, COMMUNITY-FIRST, CAGE, DATA-DRIVEN-LIVING |
| [DR-0015](DR-0015-colg-9k-church-build-surveillance-llm-farm.md) | COLG $9k church build — open-source Frigate surveillance + double-duty CUDA LLM node (PLAN) | **superseded** by DR-0016 | C | church | SOVEREIGN-FIRST, COST-DISCIPLINE, COMMUNITY-FIRST, CAGE, DATA-AS-EMPOWERMENT, SURFACE-PREMISE |
| [DR-0016](DR-0016-colg-9k-build-ratified-final.md) | COLG $9k church build — RATIFIED FINAL (Frigate + 48GB dual-3090 + VLM agent + DIY cabling) | accepted | C | church | SOVEREIGN-FIRST, COST-DISCIPLINE, COMMUNITY-FIRST, CAGE, DATA-AS-EMPOWERMENT, EARN-AUTONOMY, SURFACE-PREMISE |

**Provenance:** DR-0001…DR-0010 are the retrofit of items A–J from the 2026-06-08 church-LLM research-review (`docs/99-session-notes/2026-06-08-research-review-church-network-llm-eval-and-app-review.md`). A=DR-0001, B=DR-0002, C=DR-0003, D=DR-0004, E=DR-0005, F=DR-0006, G=DR-0007, H=DR-0008, I=DR-0009, J=DR-0010.

**Next ID:** DR-0017. To add a decision: copy the template in `README.md`, assign the next ID, add a row here. To change a decision: write a new DR, set `supersedes:`, flip the old row's status to `superseded`.

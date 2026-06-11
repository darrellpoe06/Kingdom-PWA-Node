# Build Roadmap — Active Worklist

> **Living queue — pruned as items close; the DR ledger (`docs/decisions/INDEX.md`) is the permanent record, this is just the active worklist.** Concise status table only — no spec content (reference by DR#/path). Items are removed (or moved to the short Done tail, periodically pruned) as they complete. Manual seed of the Self-Extending Layer roadmap (DR-0037) until the PMO module (DR-0027) generates it. Recording an item authorizes nothing built/bought/merged.

**STATUS:** `decided` · `awaiting-greenlight` · `awaiting-input` · `blocked-on` · `in-progress`. **OWNER:** Darrell (decision) · Claude (execution) · External (third party). Lead owner first.

| # | Item | Status | DR / path | Waiting on | Owner |
|---|---|---|---|---|---|
| R1 | Open PRs to review/merge: #24 comprehensive build (Tier B soak + BG's Tier C conference look), #19 Poe Properties spec (clinical-scope answer), #25 test audit + gate | awaiting-greenlight | PR #24 / #19 / #25 | Darrell greenlight (+ Christina soak; BG review) | Darrell |
| R2 | Poe Properties — dual operating model | awaiting-input | DR-0026, DR-0032 | rehab=housing-vs-clinical answer; compliance gate | Darrell + External |
| R3 | Supportive Housing / Gov Programs extension | awaiting-input | DR-0038, DR-0032 | clinical-vs-housing scope answer; "go" | Darrell + External |
| R4 | Cage + local LLM runner stand-up — on owned hardware (Legion 4070 = Node 1; no purchase, DR-0053) | awaiting-input | DR-0037, DR-0040, DR-0053; three-brakes | real-infra values from Darrell (UniFi URL/auth, pfSense host, NetBird-vs-Tailscale, VLAN IDs) + deploy session (unlocks R5/R6/R11) | Darrell + Claude |
| R5 | Church build ($9k, COLG) | awaiting-greenlight | DR-0031/016† | procurement greenlight; on-site (R7); BOM doc | Darrell + External + Claude |
| R6 | PoeTech farm ($5k) | awaiting-greenlight | DR-0030† | procurement greenlight; BOM doc | Darrell + Claude |
| R7 | On-site church tasks | in-progress | enables R5, R9 | Darrell on-site: NAS/Tailscale/drives/Wyze/network map | Darrell + Claude |
| R8 | Safe-21 n8n enable (home) | blocked-on | three-brakes | home-n8n access (login/API key); 16 timer wfs HOLD | Darrell + Claude |
| R9 | Conference Module + Event Center | blocked-on | PR #9 | Church Plus schema (R7), Wyze counts, NAS bays; merge | Claude + Darrell |
| R10 | Sovereignty roadmap (Phase 1–4) | decided | DR-0029 | sequencing only; rides R4/R5/R6 (~Jul–Aug 2026) | Darrell + Claude |
| R11 | Module specs built (PMO, template, Want-To-Use, Flywheel, HumDev, Growth, Self-Extending, Cohort, Auto-Tagging) | decided | DR-0027…024 | R4 runner; build per Composable Spine (DR-0039) | Claude + Darrell |
| R12 | Self-serve status dashboard — owned observability (extends NAS dispatch-status: node/LLM health, build queue, Cage-ledger events, ntfy push; removes Claude as single source of truth) | planned | DR-0040; `EXECUTION-OUTCOME-OBSERVABILITY.md`; part of R4 | R4 runner; enable dispatch-status (an R8 safe-21) | Claude + Darrell |
| R13 | Convert the 16 timer workflows to event-driven (trigger fires only on a real event; keep only genuine single-fire schedules behind the Cage) | decided | DR-0042; three-brakes | R8 home-n8n access (the 16 timer wfs are on HOLD there); per-wf event-source mapping | Claude + Darrell |
| R14 | Event usage-ranking + analytics view on the dashboard (most-used → least-used by type/tag/tier; drives reduce/increase; aggregate-only, PHI walled out, bounded retention) | planned | DR-0043; extends R12; `EXECUTION-OUTCOME-OBSERVABILITY.md` | R12 dashboard; events-as-data roll-up + retention window | Claude + Darrell |

| R15 | Test gate: suite portable on clean checkout + GitHub Actions CI (lint + vitest + wf36 harness) + 9 lint problems fixed | in-progress | PR #25; `2026-06-11-test-coverage-analysis.md` P1/P2 | merge of PR #25 | Claude + Darrell |

† No hardware-specific DR yet; DR-0030/015 are the module-template decisions, not BOMs. Writing the BOM docs (and optional hardware DRs) is part of R5/R6.

**Done (prune periodically):** doc chain DR-0017…0049 merged to `main` (R1's original scope, completed via PR #15/#16/#20/#21).

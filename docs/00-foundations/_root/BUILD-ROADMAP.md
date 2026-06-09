# Build Roadmap — Active Worklist

> **Living queue — pruned as items close; the DR ledger (`docs/decisions/INDEX.md`) is the permanent record, this is just the active worklist.** Concise status table only — no spec content (reference by DR#/path). Items are removed (or moved to the short Done tail, periodically pruned) as they complete. Manual seed of the Self-Extending Layer roadmap (DR-021) until the PMO module (DR-011) generates it. Recording an item authorizes nothing built/bought/merged.

**STATUS:** `decided` · `awaiting-greenlight` · `awaiting-input` · `blocked-on` · `in-progress`. **OWNER:** Darrell (decision) · Claude (execution) · External (third party). Lead owner first.

| # | Item | Status | DR / path | Waiting on | Owner |
|---|---|---|---|---|---|
| R1 | Merge doc chain to `main` (3-deep stack + this) | awaiting-greenlight | DR-001…024; PR #15/#16 | Darrell greenlight; merge bottom-up | Darrell |
| R2 | Poe Properties — dual operating model | awaiting-input | DR-010, DR-016 | rehab=housing-vs-clinical answer; compliance gate | Darrell + External |
| R3 | Supportive Housing / Gov Programs extension | awaiting-input | DR-022, DR-016 | clinical-vs-housing scope answer; "go" | Darrell + External |
| R4 | Cage + local LLM runner stand-up | blocked-on | DR-021, DR-024; three-brakes | CUDA box + deploy (unlocks R5/R6/R11) | Darrell + Claude |
| R5 | Church build ($9k, COLG) | awaiting-greenlight | DR-015/016† | procurement greenlight; on-site (R7); BOM doc | Darrell + External + Claude |
| R6 | PoeTech farm ($5k) | awaiting-greenlight | DR-014† | procurement greenlight; BOM doc | Darrell + Claude |
| R7 | On-site church tasks | in-progress | enables R5, R9 | Darrell on-site: NAS/Tailscale/drives/Wyze/network map | Darrell + Claude |
| R8 | Safe-21 n8n enable (home) | blocked-on | three-brakes | home-n8n access (login/API key); 16 timer wfs HOLD | Darrell + Claude |
| R9 | Conference Module + Event Center | blocked-on | PR #9 | Church Plus schema (R7), Wyze counts, NAS bays; merge | Claude + Darrell |
| R10 | Sovereignty roadmap (Phase 1–4) | decided | DR-013 | sequencing only; rides R4/R5/R6 (~Jul–Aug 2026) | Darrell + Claude |
| R11 | Module specs built (PMO, template, Want-To-Use, Flywheel, HumDev, Growth, Self-Extending, Cohort, Auto-Tagging) | decided | DR-011…024 | R4 runner; build per Composable Spine (DR-023) | Claude + Darrell |

† No hardware-specific DR yet; DR-014/015 are the module-template decisions, not BOMs. Writing the BOM docs (and optional hardware DRs) is part of R5/R6.

**Done (prune periodically):** _none yet._

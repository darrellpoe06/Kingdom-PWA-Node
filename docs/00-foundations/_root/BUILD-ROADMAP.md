# Build Roadmap — Pending-Work Queue

> **What this is.** A living, durable backlog of work that has been **decided/discussed but not yet executed**. It exists so the project *carries* its pending work instead of that work living only in chat. This is the **manual seed of the Self-Extending Layer's "what we need to build" roadmap** (DR-021) — dogfooded by hand until the PMO module (DR-011), pointed at PoeTech's own portfolio, can generate and maintain it automatically. When that module exists, this file becomes its first input/seed, not a competitor to it.

> **Plan/record only.** Like `docs/decisions/INDEX.md`, recording an item here **authorizes nothing to be built, bought, or merged.** Execution is separately governed: the governor greenlights, the Foundation executes, Claude advises (`GOVERNANCE-EXECUTION-ADVISORY.md`). Items move forward only when their *Waiting on* clears AND the owner acts.

## Cadence

Items are **surfaced here** as they are decided. We then **DISCUSS** an item, and in a subsequent session we **WORK** it. This doc is the durable queue between "decided in a session" and "done" — it is the thing that survives a context reset. Each working session: pull the queue, advance whatever is unblocked, update statuses, append anything newly decided. An item is removed only when it ships (mark **done + date** in the changelog before deleting its row, so the history of what shipped is recoverable).

## Legend

**STATUS** — `decided` (agreed, no blocker, not yet started) · `awaiting-greenlight` (plan ready; needs Darrell's go) · `awaiting-input` (needs a specific decision/detail from Darrell) · `blocked-on` (needs an external thing: hardware, access, a third party) · `in-progress` (actively being worked).

**OWNER** — `Darrell` (a decision only the governor makes) · `Claude` (execution/advisory Claude can drive) · `External` (a third party: counsel, the church, a procurement vendor, a hosting login). Many items are joint; the **lead** owner is named first.

---

## The Queue

| # | NAME | STATUS | DR ref(s) | Waiting on | Owner |
|---|---|---|---|---|---|
| R1 | **Merge the doc chain to `main`** | awaiting-greenlight | DR-001…010 (strategy/legal); DR-011…022 (PMO + module template, PR #15); DR-023…024 (architecture principles, PR #16) | Darrell's greenlight to merge the **three-deep branch stack** in order. This roadmap branch sits a **4th level** on top of PR #16 (it needs DR-001…024 present in `INDEX.md`, which only exists on the stack). Merge bottom-up or squash the stack. | **Darrell** (decision) |
| R2 | **Poe Properties — dual operating model** | awaiting-input | DR-010 (RE flows → Trevor); DR-016 (real-estate / property-mgmt candidate module) | Darrell's "go" + the **rehab = housing-vs-clinical** answer (the hard line: housing/peer-support stays in-scope; treatment crosses into the ISO-1 clinical wall). "Two tenants" detail **resolved** → both whole-unit *and* by-the-room, occupancy 1–2 + waitlist. Then fold into the Poe Properties spec. **Per-property COMPLIANCE GATE** (zoning/licensing/fair-housing) is a hard prerequisite to operating any property in co-living mode. | **Darrell** (decision) + **External** (Trevor + employment/local counsel — compliance gate) |
| R3 | **Supportive Housing / Government Programs extension** | awaiting-input | DR-022 (cohort / convergence pipeline); DR-016 | Darrell's "go" + the **clinical-vs-housing scope** answer (same hard line as R2: hard ISO-1 line if treatment vs housing). Convergence pipeline (housing → assessment/case-mgmt → skill-upgrade → cohort team → 1099 work → outcome reporting) + grant/voucher funding rail + outcomes-reporting layer. Heavy-regulation guardrails (fair-housing, vulnerable-population dignity) are prerequisites, not add-ons. | **Darrell** (decision) + **External** (regulatory / program counsel) |
| R4 | **Cage + local LLM runner stand-up** | blocked-on | DR-021, DR-024 (Cage as the governance point for autonomous steps); `feedback-autonomous-automation-three-brakes` | A **CUDA box** + deploy. This is the **cost-and-speed unlock for everything below it** (local LLM builds while offline; free compute vs vendor tokens). Ships **gated behind the three brakes** (budget + concurrency lock + kill-switch) and Tier C — never Tier A. **Priority** once hardware lands. | **Darrell** (procure) + **Claude** (deploy/gate) |
| R5 | **Church build ($9k) — COLG** | awaiting-greenlight | DR-015 / DR-016 (real-estate/church-ops module context — **see References Note: no hardware-specific DR yet**) | Procurement greenlight + on-site confirmations (depends on **R7**). Finalized BOM: dual-3090 48GB node (self-built), new Synology chassis (church-owned drives), 22× 4K PoE ONVIF cams, switch, Cat6 (DIY by PoeTech + fair-market invoice; church pays variable), UPS, Coral; Frigate + PoeTech Surveillance module + event-driven VLM with execution guardrail. **BOM/build doc not yet committed to repo** — writing it is part of this item. | **Darrell** (procurement decision) + **External** (church pays variable; on-site) + **Claude** (BOM doc, config) |
| R6 | **PoeTech farm ($5k)** | awaiting-greenlight | DR-014 (Industry/Role Module Template the farm serves — **see References Note: no hardware-specific DR yet**) | Procurement greenlight. Dual-3090 48GB business-systems farm. **BOM/build doc not yet committed to repo** — writing it is part of this item. | **Darrell** (procurement decision) + **Claude** (BOM doc) |
| R7 | **On-site church tasks** | in-progress | — (enables R5, R9) | Darrell on-site at COLG. Tasks: NAS discovery; Tailscale remote-access stand-up; hardware confirmations (free bays for the loose 6–8× 10–12TB drives; drive models / CMR check; Wyze Floodlight Pro / Floodlight counts); router/switch/UniFi network map. | **Darrell** (on-site) + **Claude** (remote stand-up/verification) |
| R8 | **Safe-21 n8n enable (home)** | blocked-on | `feedback-autonomous-automation-three-brakes` (the 16 timer workflows HOLD-for-Cage) | **Home-n8n access** — login on a non-TLC machine, or an n8n API key (auth wall hit; **not yet enabled**). The 21 trigger-based workflows are classified safe to enable; the **16 timer-based ones stay on HOLD until the Cage (R4)** carries the three brakes. | **Darrell** (provide access) + **Claude** (enable the safe 21) |
| R9 | **Conference Module + Event Center** | blocked-on | — (built on existing schema; PR #9) | Church Plus schema (needs church-NAS access — depends on **R7**), Wyze counts, NAS bays; then **merge PR #9**. Built on existing schema; net-new is the conference/event surface. | **Claude** (build/merge) + **Darrell** (greenlight merge) |
| R10 | **Sovereignty roadmap (Phase 1–4)** | decided | DR-013 (PM-as-automation / Cage); sovereignty section | Sequencing only — Phases 1→4 toward vendor-optional; **hardware-accelerated to ~Jul–Aug 2026** once R4/R5/R6 land. No blocker beyond the hardware it rides on. | **Darrell** (governs sequence) + **Claude** (executes phases) |
| R11 | **Module specs designed, build pending** | decided | DR-011 (PMO), DR-014 (template), DR-017 (Want-To-Use Bar), DR-018 (Flywheel), DR-019 (Human Development + Pocket Education), DR-020 (3rd/4th-dim Growth Process), DR-021 (Self-Extending Layer), DR-022 (Cohort), DR-023/024 (Architecture Principles + Situational Auto-Tagging) | The runner (**R4**) for cheap/fast build, then build per the Composable Spine (DR-023): spine + PMO first (proves the spine), then each module plugs in by configuration. Specs are **complete**; this is the **build backlog** behind the runner. | **Claude** (build) + **Darrell** (greenlight per Self-Extending governance line, DR-021/024) |

---

## References Note (surfaced for review)

The session brief cited **DR-015** for the Church build (R5) and **DR-014** for the PoeTech farm (R6). In `docs/decisions/INDEX.md` those IDs are the **module-template decisions** (DR-014 = the reusable Industry/Role Module Template; DR-015 = "each module = tenant + segment + workforce category + data source"), **not hardware BOMs.** There is currently **no hardware-specific DR** and **no committed `$9k`/`$5k` build doc** in the repo — those BOMs were decided in-session and still live in chat. Rather than copy a mismatched mapping through, R5/R6 reference the genuinely-related module DRs and treat **writing the BOM/build doc** (and, if Darrell wants, recording dedicated hardware DRs) as part of the work those items are waiting on. Flagging so the reference can be corrected the right way.

## Maintenance

- **Append** newly-decided pending work as a new `R#` row; never renumber (supersede with a note if an item is replaced).
- **Update statuses** every working session as *Waiting on* clears.
- **On ship:** record the item + date in the changelog below, then remove its row.
- When the **PMO module (DR-011)** comes online pointed at PoeTech's own portfolio, this file is its **seed input** — the manual queue becomes the generated roadmap (the Self-Extending Layer recursion, DR-021).

### Changelog

- **2026-06-09** — Roadmap created; seeded with R1–R11 from the 2026-06-09 sessions. (DR-025.)

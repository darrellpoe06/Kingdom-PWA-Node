# MVP-1 Timeline — Sovereign Family Financial OS

**Owner:** Darrell Poe, Principal, PoeTech LLC
**Status:** Build phase commitment
**Branch of record:** `docs/skos-foundations`
**Created:** 2026-05-12

---

## Definition of Done — Tier 1

Tier 1 of MVP-1 is shipped when **Christina Poe logs a real household transaction on her phone via the SKOS PWA installed from the Synology DS1621xs+ over the home WiFi, with debt math and scenario modeling visible on the dashboard.**

Specifically, by Tier 1 ship date:

- PoeTech-PWA codebase migrated from Create React App to Vite + TypeScript + React 18
- Mobile-friendly UI shell with navigation across Dashboard, Transactions, Debts, Scenarios
- Manual transaction entry with categorization
- CSV import from bank exports with reconciliation rules
- Debt module with avalanche math, payoff schedules, and total interest projections (ported from Excel v1)
- Pressure slider (1-10) driving scenario modeling with monthly cashflow projections
- Dashboard with summary tiles for inflow, outflow, net, debt principal, and pressure setting
- Local-first storage on Synology with IndexedDB sync for offline use
- PWA manifest + service worker properly registered, installable on iOS and Android
- Deployed via Docker on Synology DS1621xs+
- Christina has installed it on her phone and logged at least 10 real transactions

Tier 1 explicitly excludes Plaid, email parsing, AI digest, and harm-pattern detection. Those are Tier 2.

---

## Pace Commitment

- **Minimum sustained pace:** 5 hours/day × 4 days/week = 20 hours/week of focused build work
- **Stretch pace:** 5 hours/day × 6 days/week = 30 hours/week
- **Work pattern:** Claude Code Desktop sessions on the Samsung Galaxy Book Pro 360, executing structured prompts following the SOP defined below. Per-session output: 30-90 minutes elapsed, 1-3 clean commits.
- **Throughput target:** 7-10 commits per 5-hour day at SOP-driven pace

---

## Timeline

**Tier 1 build target: 21 calendar days** from the first Vite migration commit.

**Christina-feedback iteration buffer: 7 calendar days** following Tier 1 build completion, reserved for round-trip refinement after Christina's first real session.

**Total time to "Tier 1 shipped": 28 calendar days.**

This timeline assumes:

- SOP discipline maintained across sessions (see below)
- No major life disruption (church incident, family emergency, HIPAA crisis) consumes more than 2 days
- Pre-build design decisions are made and documented before code is written
- Christina is available for at least one 30-minute testing session per week from Day 22 forward

Build phase official start: **TBD** (set when first Vite migration commit lands)

Tier 1 shipped target: **build start + 28 days**

---

## Standard Operating Procedure for Build Sessions

Every Claude Code Desktop session follows this loop. No exceptions during MVP-1 build.

1. **State the goal in one sentence.** The session has one outcome. If two, split into two sessions.
2. **Verify current state before acting.** `git status`, `git branch`, current file inventory. Show me what IS, not what I assume.
3. **Propose changes before executing.** Tree, filenames, commit message. Wait for explicit approval.
4. **Execute approved changes only.** No "while we're at it" expansion mid-session.
5. **Verify after executing.** `git log --oneline -5`, `git status`, show the diff.
6. **Commit with a precise message.** Subject line under 72 characters, present-tense imperative, no decoration.
7. **Push to the working branch immediately.** No "we'll push at the end" — every approved commit is pushed before moving on.
8. **Log the session in `06-research-log/`** if anything surprising surfaced.

---

## Why This Pace Is Possible

A 50-person team building equivalent scope would take 4-6 months because of coordination cost, meetings, multi-stakeholder approval, design review cycles, and QA passes. SKOS Tier 1 has:

- One principal making all decisions
- One tester (Christina) with direct feedback to the principal
- One AI doing the actual code production at sub-second latency
- One repo, one branch, one deployment target
- Zero meeting overhead
- Zero approval boards

Target velocity advantage: **5-10x faster than an equivalent team** on this specific scope, sustained over 21 days, by removing coordination cost entirely.

---

## Risks That Could Slow This Down

Documented honestly so they're visible and can be mitigated:

1. **Life disruption.** Sick twin, church emergency, rental incident, HIPAA crisis. Buffer is built into the 7-day post-Tier 1 window but a multi-day disruption mid-build will push the date.
2. **Scope expansion temptation.** Every architectural insight that surfaces during the build wants to be in Tier 1. It cannot be. Insights go to `06-research-log/` and wait for Tier 2 or later.
3. **SOP fatigue.** Following the procedure for 80+ sessions requires discipline. The Lucifer signature in a builder is "I know better than the procedure" mid-build. Watch for it.
4. **Christina's availability.** Her practice is HIPAA-scoped and her time is limited. Her testing slots must be scheduled and protected.
5. **Synology deployment friction.** Docker on Synology has its own learning curve. Allocate 1-2 sessions for deployment alone if needed.

---

## Tier 2 (After Tier 1 Ships)

Documented here for awareness but not in scope for this commitment:

- Plaid OAuth integration (one institution first)
- Email parsing for receipts
- Daily digest generation via Claude API with redaction
- Harm-pattern flag library
- 5-tier opportunity ladder
- Mobile-side improvements based on Christina's usage data

Target: Tier 2 begins immediately after Tier 1 shipped acknowledgment. Estimated duration: 15-21 calendar days at the same pace.

---

> **TODO:** Update build phase official start date when first Vite migration commit lands. Track session-by-session progress against the 21-day target in `06-research-log/`.

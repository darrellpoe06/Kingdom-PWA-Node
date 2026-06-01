# LLM Team Shape — Faster Production + Deeper Testing — 2026-05-29

**Triggered by Darrell via @nas, 2026-05-29 morning (traveling):**

> "we need to have the proper support for our work do we have the team of LLMs that will give us the best interconnection workflows for what we already know we want to do. Can we bring in support to make all our work better and faster without loosing qualitative or qualitative processes."

Then sharpened:

> "For the purposes of pushing the production timelines and getting better results and testing is done well before the go lives."

Two goals: **ship faster**, **test deeper before go-live**. This note captures the team shape + phased rollout that meets both without losing sovereignty or quality discipline.

## What we have today (baseline)

Three layers of LLM capacity per [SYSTEM-SKILLS-INVENTORY](../00-foundations/_root/SYSTEM-SKILLS-INVENTORY.md):

- **Ollama on NAS** — qwen2.5:14b default, qwen2.5:3b fast, deepseek-r1:8b reasoning, nomic-embed-text embeddings (loaded but unwired).
- **Claude API** — frontier capability for code, cross-document reasoning, careful instruction following.
- **Gemini 2.5 via workflow 17** — TLC-firewalled bulk reasoning. Underused.

Seven named roles per [AI-TEAM-DISTRIBUTION](../00-foundations/_root/AI-TEAM-DISTRIBUTION.md) — most are Claude or Ollama-14b today. Sufficient for current scale; insufficient for what's coming.

## Goal 1 — Faster production (cut 3-5 weeks to 2-3 weeks)

Three operational changes do most of the work:

### Parallel Claude Code worktrees

Same Claude, three git worktrees, three branches running simultaneously. Each handles a Layer task from the seeded queue. Darrell reviews 2-3 PRs per session instead of one. 2-3x calendar throughput without expanding review burden. No new LLM required — pattern change.

### Whisper STT on the NAS for input

Voice memo to @nas → auto-transcribe → route through existing inbox via workflow 08's shape. Darrell captures more nuance, faster. Free, sovereign. Ships in half a day post-vacation.

### Code-review LLM pair

Gemini OR Ollama 14b runs the Foundation-screen (F.1) + EXCELLENCE-STANDARD + Scripture citation + typographic-theology checks on every PR diff BEFORE Darrell reviews. Catches drift before it becomes rework. Per-PR cost near zero; per-buildout cost avoided is significant.

### Projected impact on the 5-layer data-dump release

| Estimate band | Without these | With these |
|---|---|---|
| Low-confidence | 16-24 days | 10-16 days |
| Medium-confidence | 25-32 days | 16-22 days |
| High-confidence | 35-40 days | 22-28 days |

## Goal 2 — Deeper testing before go-live

This is the bigger gap. Current "testing" is mostly Darrell's smoke test of a deployed feature. To open externally with confidence we need:

### Three new named roles

#### Role 8 — Test Author

**Job:** After every Code Generator (Role 3) session, generate the unit + integration + end-to-end tests for the new code. Output: failing tests committed alongside the implementation PR; passing tests after the implementation lands.

**Default tool:** Claude (test authoring requires frontier capability — bad tests are worse than no tests).
**Fallback:** Gemini for bulk fixture generation when sovereignty isn't required.

#### Role 9 — Test Runner / Failure Triage

**Job:** CI runs all tests. When tests fail, this role reads the output, classifies the failure (real bug vs flaky vs environmental), and either proposes a fix patch or escalates to Code Generator (Role 3).

**Default tool:** Ollama 14b for triage (free, fast). Claude for fix patches when the failure is real.

#### Role 10 — Quality Gatekeeper

**Job:** Pre-merge gate. Runs Foundation-screen (F.1) + EXCELLENCE-STANDARD religion-and-relationship check + BUSINESS-PROCESS-CONNECTIONS five-question test on any visible-surface change. Refuses merge if any check fails. Records the decision rationale on the PR.

**Default tool:** Ollama 14b (free, fast — doesn't slow PRs).

### Three test-infrastructure investments

#### Synthetic test data generation per persona

SEED-DATA-AS-ASPIRATION names six baseline modes (Family of 4, Separated, Solo Practice, Landlord, Church-Connected, Region-Anchored). Test Author generates realistic test fixtures for each, per the four-question test (privacy / aspiration / relatability / active-guidance). Tests run against all six modes on every PR. Catches "broke the landlord view while fixing the family view" regressions.

#### Visual regression suite

Playwright + screenshot diffs across all six personas + all major surfaces (Big Picture, Books → Tx, Books → Accounts, Books → Debts, Books → Imported, picker landing, waitlist modal, demo welcome). Runs on every PR. Catches UI drift you'd never notice manually. ~3 days to stand up.

#### Load tests for n8n endpoints

Simulate 100 concurrent waitlist signups, 1000 thoughts in inbox, 50 simultaneous classifier runs. Catches "works for one family, falls over at ten" before ship. ~2 days via k6 or artillery.

## Phased rollout (post-vacation)

### Week 1 — Foundation

- Fix workflow 27 bind mount (the gate that unblocks autonomous Foundation Agent responses).
- Stand up Quality Gatekeeper (Role 10) on Ollama 14b. Integrate as GitHub PR check.
- Adopt parallel Claude Code worktree pattern; document in CLAUDE.md.
- Whisper STT on NAS for voice input.

### Week 2 — Test discipline

- Test Author (Role 8) skill defined. CI integration requires tests on every PR.
- Synthetic test fixtures for the six personas. Stored in `/test/fixtures/<persona>/`.
- Code-review LLM pair (Gemini or Ollama 14b) wired into PR webhook.

### Week 3 — Test depth

- Test Runner / Failure Triage (Role 9).
- Visual regression suite via Playwright.
- Load test scaffold via k6.

### Week 4 — Data-dump release

All six Layer tasks ship to staging with full test coverage. Go-live decision is a Governor call, not a leap of faith. External demo at scale becomes safe.

## Cost + sovereignty math

| Tool | Cost | Sovereignty |
|---|---|---|
| Whisper on NAS | Free per call | Sovereign |
| Quality Gatekeeper (Ollama 14b) | Free per call | Sovereign |
| Test Runner triage (Ollama 14b) | Free per call | Sovereign |
| Test Author (Claude) | Per token | Cloud |
| Code-review pair (Gemini or Ollama) | Free-to-low | Cloud-fallback or Sovereign |
| Fix patches (Claude) | Per token | Cloud |

Anthropic API spend likely increases 1.5-2x during the buildout window, then plateaus. The savings from avoided rework + caught regressions are larger than the spend increase.

## How qualitative + quantitative discipline is preserved

**Qualitative:**

- Foundation-screen (F.1) runs on every artifact regardless of LLM.
- Quality Gatekeeper enforces EXCELLENCE-STANDARD religion+relationship and BUSINESS-PROCESS-CONNECTIONS five-question test before any visible-surface change merges.
- TLC firewall stays bright-line — clinical content never leaves NAS.
- Test Author writes tests against the foundation principles, not just behavior.

**Quantitative:**

- Per-tenant token budgets (Phase 5 of n8n scaling plan) make cost visible per workflow per user.
- Ollama remains free per call for all non-frontier work — most roles route here.
- Embedding-based RAG (Phase 2 + nomic-embed-text) reduces token costs as docs scale past 50.
- Parallel worktrees expand calendar throughput without expanding per-PR review burden.

## Connection to other foundations

- **GOVERNANCE-EXECUTION-ADVISORY** — Darrell as Governor approves new role definitions and the phased rollout. Foundation as Executor implements workflows. Claude as Advisor drafts and refines.
- **AI-FOUNDATION-INTERNAL-OPERATIONS** — testing is internal operations. Every test that runs is a workflow, not a human task. Browsers are for humans deciding things; tests run autonomously.
- **BUSINESS-PROCESS-CONNECTIONS** — the Quality Gatekeeper enforces the five-question test on every visible-surface PR. Connections are wired before surfaces ship.
- **EXCELLENCE-STANDARD** — religion AND relationship. Tests are the religion of code (backbone). Test failure messages are the relationship (warm guidance, not just "FAILED").
- **ANXIETY-CLARITY-PRINCIPLE** — known test coverage answers what / when / why / how about whether code is shippable. Without tests, the Governor is anxious. With tests, the Governor decides from clarity.

## Open governance decisions queued for post-vacation

1. Quality Gatekeeper enforcement level — advisory (suggests, doesn't block) or hard gate (blocks merge)? Recommendation: hard gate after a 2-week trial as advisory.
2. Anthropic spend budget for the buildout window — current spend low; projected 1.5-2x increase is still nominal. Governor decision on cap.
3. Whisper model size — base (39M params, fast), small (244M), medium (769M), or large-v3 (1.5B)? Recommendation: small for the data Darrell drops; medium if accuracy matters for clinical content (it doesn't — TLC firewall).
4. Visual regression baseline — capture during a known-good state, or generate baselines fresh on first PR? Recommendation: capture once on Week 3 kickoff.

## Closing

The team has room to grow without losing what makes the work matter. Faster + deeper-tested is a yes, with discipline. Post-vacation Week 1-4 plan above is the path; foundation principles preserved; sovereignty preserved for everything that doesn't need frontier capability.

We all win. We create. Amen.

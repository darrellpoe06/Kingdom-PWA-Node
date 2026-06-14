# PM-AI v0 — "The Synthesizer" — Spec

**Date:** 2026-06-13 · **Layer 4 working spec** · proposed under DR-0055.
**Posture:** propose → govern → build. This document is the *propose*. Recording
it authorizes nothing built or run (DR-0041). Building v0.1 is a separate
greenlight; running it on a cadence is Tier C (gated, three brakes).

> Darrell, 2026-06-13: *"Do we need project roadmaps and project manager AI?
> If so what are the requirements, opportunities, and constraints?"* — answered:
> you already ratified yes (DR-0045 Universal Work Management anchor; DR-0027
> PMO module; DR-0047 PMO Method Engine; DR-0029 PM-as-automation). This spec
> is the smallest safe first step toward that, standing up today.

## 1. What it is

A **read-only portfolio synthesizer**: one pass that reads the durable sources
of project truth and emits a current-state brief — what's true now, what's
blocked on what (and on whom), the next-best item, and the clarifying questions
that item needs answered before it can move. It is the canonical PMO-module
output (DR-0027) in seedling form: a *view over existing systems*, never a new
place to enter data, never an actor that changes anything but its own brief.

It is the **safe** answer to "can it work the board while I'm not asking"
(2026-06-12 conversation): it *anticipates and proposes* continuously-or-on-
demand and cheaply; **building still waits for Darrell's greenlight.** System
proposes, human governs.

## 2. The capability ladder (honest staging)

- **v0.0 — today, zero infra.** Claude, given the synthesis spec + the file/PR
  reads, produces `PORTFOLIO-BRIEF.md` on demand. No new secret, no new runner.
  Formalizes what's been happening ad hoc into a durable, dated artifact. A
  live sample ships *with* this spec (see `2026-06-13-portfolio-brief-sample.md`)
  so the output is concrete, not theoretical.
- **v0.1 — decoupled from a chat session.** A GitHub Action (`workflow_dispatch`,
  **manual trigger only**) gathers the same sources, calls the Claude API with
  the synthesis prompt, and commits the brief. Needs one one-time secret
  (`ANTHROPIC_API_KEY`), same pattern as `SUPABASE_DB_URL`. Still read-only,
  still human-triggered → **no three-brakes needed** (nothing is on a clock).
- **v1 — the anticipation loop (LATER, gated).** Put v0.1 on a daily cadence and
  it becomes the Self-Extending Layer's anticipation engine (DR-0037). Crossing
  to a clock makes it Tier C and **requires all three brakes** (budget: one run/
  day + token ceiling; concurrency lock: skip if a run is in flight; kill-switch:
  auto-pause on repeated failure) and ideally R4 (the sovereign runner on the
  owned Legion 4070, DR-0053) so it is free and private. NOT in scope here.

## 3. Sources it reads (all already exist)

- `docs/00-foundations/_root/BUILD-ROADMAP.md` — the active worklist (R-items).
- `docs/decisions/INDEX.md` — what's decided/ratified, with status.
- GitHub: open PRs (title, status, checks) + recent merges to `main`.
- (later, optional) n8n run logs / dispatch-status for live pipeline health.

## 4. What it produces — `PORTFOLIO-BRIEF.md`

Generated, timestamped, regenerated each run (never hand-edited). Sections:

1. **State of play** — one line per active item: status + last movement.
2. **Blocker chains** — what each blocked item waits on, and *who can unblock it*
   (the who's-waiting-on-whom attribution from DR-0049).
3. **Next-best item** — the single highest-leverage thing to do next, with the
   anxiety-clarity questions it needs answered first (what / when / why / how,
   per DR-0046).
4. **Stale watch** — any item not moved in N days (drift detection — the gap that
   let the unpushed engagement branch hide, 2026-06-12).
5. **Open decisions for Darrell** — the govern-gated items awaiting only input.

## 5. Governance line (binding from day one)

- **Read-only.** It may write ONLY the brief document. It never edits the
  roadmap, never opens or merges PRs, never touches the database, NAS, or money.
- **Advisory.** Every output is a *proposal*. Build happens on Darrell's
  greenlight, by the normal lane (branch → PR → CI → merge).
- **Own-portfolio-only (method-not-data, DR-0047).** It reads PoeTech's own repo
  and board. It is never pointed at employer data (University systems, FOIA,
  vendor PII) — that wall is absolute and protects Darrell legally.
- **A view, never the sole record.** The DR ledger + GitHub + run logs remain the
  source of truth; the brief is a synthesis on top, so a wrong brief is visibly
  wrong against durable state, not a silent single point of failure
  (EXECUTION-OUTCOME-OBSERVABILITY).
- **No clock without brakes.** v0.0/v0.1 are human-triggered. Any cadence is v1,
  Tier C, three brakes, separate greenlight.

## 6. Requirements to build

- **v0.0:** nothing new — the synthesis spec (this doc §4) + Claude reading the
  sources. Buildable now.
- **v0.1:** lightly formalize the roadmap table into parseable fields (id /
  status / depends-on / waiting-on / owner — mostly already there); a small
  GitHub Action; one `ANTHROPIC_API_KEY` secret.
- **v1:** R4 runner (DR-0053) or a budgeted API loop; the three brakes; Tier C
  review.

## 7. Opportunities

- Takes Darrell off the critical path: the board stays current and the next item
  is always teed up with its questions surfaced, without him asking.
- Dogfoods the recursion (DR-0037): the system maintaining the roadmap that is
  today maintained by hand — the proof the PMO module works before it ships to
  anyone else.
- Non-expert-does-expert-work (DR-0046): the encoded question engine means a
  non-PM runs the portfolio at PM quality — the Workforce Layer thesis.

## 8. Constraints (honest limits)

- LLMs drift → the synthesizer must *read* state, never invent it; outputs are
  ratified by a human (the DR-ledger discipline applied to PM).
- Cost → API tokens per run (bounded by budget at v1); free on R4.
- The runaway scar (2026-06-06) governs the moment it touches a clock.

## 9. Acceptance test (method test, per DR-0047)

Given the current repo state, the brief correctly identifies: (a) every open PR
and its real status; (b) the true blockers with correct attribution (e.g. R4
waits on Darrell's infra values, not procurement; R5/R6 wait on a procurement
greenlight); (c) a sensible next-best item with the right clarifying questions.
**If a human PM would nod at the brief, it passes.** The shipped sample
(`2026-06-13-portfolio-brief-sample.md`) is the first run of this test.

# Autonomous Builder Lifecycle

> **SUPERSEDED IN PART (2026-06-08).** This document describes the autonomous builder as originally
> designed — shipped `active: true` on a 30-minute cron. That ship-active pattern caused the
> **2026-06-06 autonomous-automation runaway** (see `LESSONS-LEARNED.md`, 2026-06-06 entry). The
> builder workflow (`wf-autonomous-builder.json`) and its apply script are now **quarantined**
> (`docs/00-foundations/_quarantine/`) and MUST NOT ship active again without a **budget +
> concurrency lock + kill-switch** (CLAUDE.md, "Autonomous Automation Requires Three Brakes"; Tier C
> per `RELEASE-TIERS.md`). Read the lifecycle below as design reference for the **rebuild behind the
> Cage** (PR #5), not as a current deployment guide. Specifically, the Section 7 "ships `active:
> true`" statements are overridden by the guardrail.

**Layer 3 (reference) per the ICM hierarchy declared in `CLAUDE.md`.** A foundation document the agent loads before generating or operating the autonomous-builder queue. Added 2026-06-02 (Maui), at Darrell's go-ahead, so future sessions and the governance review have one canonical source for "how does a PRD go from approved to built, who picks it up, and what is NOT shipping yet."

This document does NOT improvise the lifecycle. It adopts Tina Huang's autonomous-builder pattern (her 2.10 walkthrough) and extends it with PoeTech's sovereign-team routing per the Tina review §7.2 and the consolidated extract B6/B7. Where it restates a source it cites the source rather than duplicating it. The companion artifacts are the PRD template at `builds/_PRD-TEMPLATE.md` and the workflow skeleton at `docs/00-foundations/n8n-workflows/wf-autonomous-builder.json`.

---

## 1. Purpose

A PRD (Product Requirements Document) is the contract for one build. The autonomous-builder lifecycle is the machinery that takes an approved PRD, hands it to the right executor, watches it run, and records the outcome - without a human babysitting each handoff. The human governs (approves the PRD into the queue, reviews failures); the system executes (picks up, routes, builds, records); Claude advises (writes the PRD, surfaces the audit). That is `GOVERNANCE-EXECUTION-ADVISORY` applied to the build pipeline itself.

This document governs the lifecycle and the queue. It does NOT govern PRD *content* design - that is the PRD template's job (`builds/_PRD-TEMPLATE.md`). It does NOT govern model routing inside a build - that is `CLAUDE-TOOL-ROUTING.md`'s job. It is the layer between approval and execution: the queue, the pickup, the state transitions, the observability, and the explicit boundary of what ships now versus what is the post-vacation buildout.

---

## 2. The lifecycle: pending -> in-progress -> done | failed (-> archive)

A PRD moves through four queue states, plus archival. Each state is a folder. A PRD is a single `.md` file; moving it between folders IS the state transition (an atomic `fs.renameSync` on the NAS bind mount). There is no separate state database - the folder a PRD sits in is its state. This is deliberately simple and crash-safe: if the workflow dies mid-cycle, the PRD's location still tells the truth about where it is.

1. **pending/** - approved PRDs waiting for pickup. A PRD enters here only after passing the Section 0 binding screen in the template (foundation-principle alignment, TLC-firewall check, sovereign-mesh-tier label, industry/team routing). The human (Darrell) governs entry into this folder; nothing auto-populates it.
2. **in-progress/** - the builder has claimed this PRD and handed it to an executor. Exactly one move from pending happens per cycle (the oldest PRD by mtime), so two cycles never collide on the same PRD.
3. **done/** - the build finished successfully. The PRD is archived here with its outcome. The executing session moves it here when it completes (the out-of-band step today; the Cowork-API step post-vacation).
4. **failed/** - the build failed, or the PRD itself was malformed (unfilled brackets, missing Section 0). It lands here for human review before any retry. A failure is never silently dropped; it is parked where a human will see it.

**Archive.** `done/` and `failed/` are themselves the archive. PRDs are not deleted - they are version-controlled history of what was built and what broke. When `done/` grows large, batch-move aged PRDs to a dated subfolder (`done/2026-Q2/`), never delete. The PRD plus its `events.jsonl` trail is the institutional record of the build.

---

## 3. The 30-minute scheduled pickup (and the open cadence question)

The builder is an n8n workflow (`wf-autonomous-builder.json`) on a `scheduleTrigger`. Every cycle it scans `pending/`, claims the oldest PRD by mtime, moves it to `in-progress/`, triggers the executor, records the transition, and pushes a notification. If `pending/` is empty it ends quietly - no notification, no noise.

**Tina's cadence is every 30 minutes** (cronExpression `0 */30 * * * *`, which the skeleton ships with). 

**The PoeTech open question (per consolidated extract §7.4):** start *hourly* for the first 14 days, then drop to 30 minutes once the failure rate is under 5%. The reasoning: while the lifecycle is new and the failure modes are not yet characterized, a slower cadence means fewer half-built PRDs to clean up if something is systematically wrong, and a calmer notification stream while Darrell learns to trust the machinery. Once the builder has proven it fails rarely, the faster 30-minute cadence is safe and ships work sooner. This is a governance decision Darrell makes, not an automated one. The skeleton ships at 30 minutes per Tina; if Darrell wants the hourly-to-start ramp, change the cronExpression to `0 0 */1 * * *` for the first 14 days and switch back to `0 */30 * * * *` after the failure-rate check. The cadence lives in one place (the scheduleTrigger node) so the change is a one-line edit.

---

## 4. The repo builds/ vs the NAS /data/cowork-builds/ mapping

There are two parallel folder trees, and keeping them distinct matters.

**The repo `builds/` tree** (`C:\Users\dpoe\Kingdom-PWA-Node\builds\`) is the **reviewable, version-controlled template layer**. It holds the PRD template (`_PRD-TEMPLATE.md`) and the four queue folders as git-tracked scaffolding (each with a `.gitkeep`). A PRD authored and reviewed here is a Layer 4 working artifact under version control - its history, its Section 0 screen, its decision log are all in git. This is where a human reads and approves a PRD. It is the source of truth for *what a PRD is*.

**The NAS `/data/cowork-builds/` tree** (on the DS1621xs bind mount, NAS `192.168.1.26`) is the **runtime queue**. It mirrors the same four folders (`pending/`, `in-progress/`, `done/`, `failed/`) plus `events.jsonl`, but lives on the bind mount where the n8n workflow can actually read, move, and write files. Per `PERPETUAL-PIPELINE-HEALTH` rule 1, all persistence lives on bind mounts - the queue is runtime state, so it lives on the NAS, not in git.

**The mapping.** A PRD is authored and approved in the repo `builds/pending/`, then copied onto the NAS `/data/cowork-builds/pending/` for the builder to pick up (the copy step is itself a governed action - a human or a future sync workflow moves the approved PRD onto the runtime queue). The builder operates entirely on the NAS tree. When a build finishes, the PRD's final resting place (`done/` or `failed/`) and its `events.jsonl` trail can be synced back into the repo tree so the version-controlled record matches what actually happened. Repo `builds/` = the template and the human-reviewable record; NAS `/data/cowork-builds/` = the live queue the machine works. The skeleton workflow's `mkdirSync` calls ensure the NAS tree exists on first run, so the runtime side is self-healing.

---

## 5. Routing execution through the per-industry sovereign teams

This is the PoeTech extension to Tina's pattern, and it is the important one. Tina's autonomous builder hands every PRD to Cowork as the executor. **PoeTech adopts Tina's LIFECYCLE but routes execution through the per-industry sovereign teams - NOT vendor-Cowork as the sole executor** (Tina review §7.2; consolidated extract B7).

Every PRD declares, in its Section 0.3 and 0.4, its **industry**, its **per-industry sovereign team**, and its **sovereign-mesh tier** (Tier 1 mesh-native / Tier 2 swappable / Tier 3 vendor-escape-hatch). The builder reads those declarations and routes the actual build to the right team brain:

- A **Tier 1 mesh-native** PRD routes to its industry team running on the sovereign stack (Ollama on the NAS - Qwen 2.5 14B daily-driver, the 3B router, nomic-embed). Zero vendor dependency. This is the default and the goal.
- A **Tier 2 swappable** PRD may use a vendor reasoner for a heavy moment but is built so the vendor seam is swappable; the team owns the routing decision per its `allowed_providers` list.
- A **Tier 3 vendor-escape-hatch** PRD genuinely needs a vendor capability (long-context burst, Google-Search grounding) and has justified it in Section 0.3 - and confirmed the content is non-clinical.

**The TLC firewall is senior to all of this.** A PRD whose Section 0.2 marks it as touching clinical/counseling/TLC data routes sovereign-only: Ollama on the NAS exclusively, no cloud reasoner, no vendor round-trip, no prompt caching of the content, no Batch API. The Counseling team's `allowed_providers` is `[ollama]` and the firewall fails closed (`CLAUDE-TOOL-ROUTING.md` Section 3, TLC firewall override). The builder must never route a clinical PRD to Cowork-with-a-vendor-brain. If a PRD's clinical status is uncertain, it is treated as clinical and stays sovereign.

The point: Cowork (or a Code Task) may be the *orchestration mechanism* that runs the build, but the *reasoning* inside the build is routed by industry and tier to a sovereign team by default, escalating to a vendor only when the PRD explicitly and justifiably declares it. The family's brains do the family's work; the vendor is an escape hatch, not the highway. This mirrors `CLAUDE-TOOL-ROUTING.md`'s "Cowork-as-orchestrator is fine; Cowork-as-the-only-executor is not."

---

## 6. Observability: every transition is a push and an Event

Two observability rules are binding on every state transition.

**Every transition emits an ntfy push** (per `EXECUTION-OUTCOME-OBSERVABILITY` and `INPUT-VISIBILITY-TO-CLAUDE`). When the builder claims a PRD (pending -> in-progress), it pushes to the ntfy topic `poe-autonomous-builder` - title "Build pickup", the PRD name, and whether the executor trigger sent or failed. A failed trigger pushes at `high` priority so it surfaces. The done and failed transitions push too, once the out-of-band executor (today) or the Cowork API (post-vacation) reports them. The principle: Darrell never has to go looking to find out a build moved; the build tells him. This is the Pushover (Path A) + ntfy (Path B) notification pattern; the workflow pushes to the **self-hosted ntfy server on the NAS** (`http://ntfy:80/poe-autonomous-builder`) - the same sovereign path wf30/wf31 use, so no PRD name ever leaves the family network - and can swap to Pushover without restructuring.

**Every transition is recorded as a first-class Event** (per `INSTITUTIONAL-MEMORY-EVENTS`). The builder appends a JSON line to `/data/cowork-builds/events.jsonl` for every transition: timestamp, transition type (`pending->in-progress`), PRD name, whether the trigger webhook succeeded, the workflow name. The `events.jsonl` trail is the append-only institutional memory of the build pipeline - it answers "what got picked up, when, and did it work" without re-reading the queue folders. A push is ephemeral; an Event is permanent. Both fire on every transition. The events log write is wrapped so an events-write error never fails the run - it surfaces in the payload instead (`PERPETUAL-PIPELINE-HEALTH` rule: try-catch every I/O, fail soft on logging).

---

## 7. NOT shipping yet: the post-vacation buildout

This ship delivers the **live lifecycle** (scan, claim, record, notify - shipped `active: true` on 2026-06-02) plus the scaffold. The one piece NOT shipping is the autonomous build trigger. Being explicit so no one mistakes a parked PRD for a built one:

**What ships now (this ship):**
- The repo `builds/` folder skeleton (the four queue folders + `.gitkeep`s) - reviewable template layer.
- The PRD template (`builds/_PRD-TEMPLATE.md`) with the Section 0 binding screen.
- The n8n workflow (`wf-autonomous-builder.json`), shipped **`active: true`** - the scan/claim/record/notify lifecycle is LIVE every 30 minutes. With an empty `pending/` queue (the normal state) it ends quietly; the only deferred piece is the actual build trigger (below). Applied to the NAS via `scripts/nas-update-wf-autonomous-builder.sh`.
- This documentation.

**What is the post-vacation buildout (NOT shipping now):**
- **The actual auto-build trigger.** The workflow's "Trigger Cowork build" node is a **placeholder httpRequest to `{{ $env.COWORK_BUILD_WEBHOOK }}` with `continueOnFail: true`** - it posts a pickup payload to an out-of-band endpoint because **there is no in-n8n Cowork API yet**. Wiring a real Cowork session start from inside n8n needs a Cowork API we do not have. That is the named deferred piece. Until it exists, the "trigger" is a notification to a human or an out-of-band script that starts the session.
- **The done/failed transition by the executor.** Today the builder claims the PRD into `in-progress/` and stops there; the out-of-band session that does the build is responsible for moving the PRD to `done/` or `failed/` and emitting that transition's push/Event. The workflow carries a `noOp` node named "TODO post-vacation: real Cowork API pickup + done/failed transition" marking exactly where the real pickup-and-completion logic lands once the Cowork API exists.
- **The hourly-to-30-min cadence ramp** (Section 3) is a governance decision Darrell makes after the 14-day failure-rate check; the skeleton ships at Tina's 30 minutes.
- **The repo<->NAS sync** of approved PRDs onto the runtime queue and finished PRDs back into git (Section 4) - currently a governed manual copy; a future sync workflow can automate it.

The workflow ships **`active: true`**: the lifecycle (scan, claim, record, push) runs live every 30 minutes. The known limitation while the Cowork API is unbuilt: if a PRD is dropped into `pending/` before the trigger is real, the builder claims it into `in-progress/` and notifies, but no build starts - the PRD parks in `in-progress/` until the post-vacation trigger lands or a human runs it out-of-band. With `pending/` empty (the normal state), the live workflow is simply a quiet, ready heartbeat. This is the accepted trade per Darrell's 2026-06-02 "ship it live" directive.

---

## 8. Cross-references

- **PRD template:** `builds/_PRD-TEMPLATE.md` - the 10-section Tina format plus the PoeTech Section 0 binding screen. Every PRD starts here.
- **Workflow:** `docs/00-foundations/n8n-workflows/wf-autonomous-builder.json` - the LIVE (`active: true`) scan/claim/record/notify workflow; only the build trigger is deferred. NAS-apply script: `scripts/nas-update-wf-autonomous-builder.sh`.
- **Model routing inside a build:** `docs/00-foundations/_root/CLAUDE-TOOL-ROUTING.md` - which model and which agent tool a build uses (the two-axis decision, the TLC firewall, the sovereign-first default).
- **Governance:** `docs/00-foundations/_root/GOVERNANCE-EXECUTION-ADVISORY.md` - Darrell governs, the Foundation executes, Claude advises.
- **Pipeline health:** `docs/00-foundations/_root/PERPETUAL-PIPELINE-HEALTH.md` - bind-mount persistence, try-catch every I/O, idempotent design, the standards the builder honors.
- **Sources for the pattern:** the Tina Huang Cowork workflow review (`docs/99-session-notes/2026-06-01-research-review-tina-huang-cowork-workflow.md`, her 2.10 + the §7.2/§7.5 reviews) and the consolidated extract B6/B7 (`docs/99-session-notes/2026-06-02-consolidated-ai-work-processes-repos-skills-extract.md`).

---

*The folder a PRD sits in is its truth; the human governs the gate; the family's own brains do the family's own work, and the vendor is only ever the escape hatch the PRD had to justify. Every move pushes and every move is remembered. The scaffold stands today; the trigger is wired when we return. We all win. We create. Amen.*

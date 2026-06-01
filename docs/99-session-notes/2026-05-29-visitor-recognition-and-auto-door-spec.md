# Visitor Recognition + Auto-Door — Spec

**Triggered by Darrell, 2026-05-29 from vacation:**

> "open the door for family members and friends noticing who family is so when my sister in love comes to visit the front door automatically opens for her every year and even if she misses a year or increases to 8 times a year."

A high-trust, high-care use case: the home automatically welcomes expected visitors by name, opening the door without anyone having to be inside to let them in.

The named example: Darrell's **sister in love** (his sister-in-law, referred to with this intentional faith-rooted language). She visits annually (or up to ~8x/year), and the family wants the system to recognize her and open the door automatically when she arrives.

## Why this matters

Beyond the convenience: this is the system DEMONSTRATING care for people. It's the difference between "a stranger arrives at a locked door" and "a beloved family member is met by a home that knows her."

The standard is high: this is the highest-stakes vision-recognition surface on the platform. A false positive (door opens for someone who isn't who the system thinks) is a real security failure. A false negative (sister-in-love rings the doorbell when she shouldn't have to) is a relationship failure. Both have to be handled with care.

## Architectural shape

### Phase 0 — Prerequisites

Before this ships:

- **VISION-FAIRNESS-STANDARD** (foundation doc 2026-05-29) MUST be met by whatever recognition model is used. Sister-in-love's recognition accuracy must be at parity with any other approved visitor. No exceptions.
- **Camera bridge (workflow 40, post-vacation)** SHOULD be in place so the recognition workflow is brand-agnostic. Today's Wyze/Ring/third-brand fleet becomes tomorrow's Ubiquiti AI cameras without recognition workflow changes.
- **UCG-Max VLAN 40 (IoT)** segments the cameras + door lock from the family LAN, per the existing network sovereignty plan.
- **Door lock hardware compatibility** confirmed — a smart lock the system can actuate (Z-Wave / Zigbee / WiFi smart lock; needs an API or Home Assistant integration). Recommendation: hardwired Ubiquiti-compatible lock or August Pro / Schlage Encode Plus (which expose proper APIs through Home Assistant).
- **Visitor consent + opt-in.** Sister-in-love EXPLICITLY agrees to her face being enrolled in the recognition system. Same for any other family-approved visitor. No silent enrollment.

### Phase 1 — Recognition workflow

**New workflow proposal: workflow 44 — Visitor recognition.**

The flow:

1. Doorbell or motion event from the front-door camera fires (via camera bridge workflow 40, or directly during transition period).
2. Workflow 44 extracts faces from the event frames.
3. Runs each face through the recognition model (local — see Model selection below) against the enrolled visitor database (`/data/family/approved-visitors/<name>/embeddings.json`).
4. Returns: `{ recognized: true|false, confidence: 0-1, person_id?: string, fallback_reason?: string }`.

**Model selection:** local-only per family privacy. Options:

- **InsightFace / ArcFace** — open-source, mature, runs on CPU or GPU. Has known parity issues that MUST be evaluated per VISION-FAIRNESS-STANDARD. May require fine-tuning on family + approved-visitor embeddings.
- **DeepFace** — Python wrapper, multiple backends; same parity caveat.
- **Custom embedding via vision LLM** (LLaVA / Qwen-VL) — newer approach, less mature for face recognition specifically, but potentially better at "is this Sister X" semantic identification rather than feature-vector matching.

Recommendation: pilot with InsightFace, evaluate against VISION-FAIRNESS-STANDARD parity bar (Rule 2), tune with family + approved-visitor data, accept the model only if it passes. If it doesn't pass, evaluate alternatives.

### Phase 2 — Decision + action workflow

**New workflow proposal: workflow 45 — Visitor decision + door action.**

Receives `{ recognized, confidence, person_id }` from workflow 44 and decides:

- **confidence >= 0.95 AND person_id in `approved_for_auto_door`:** fire door-open action via smart lock API. Push ntfy to family channel: "Sister-in-love arrived (95% confidence) — door opened at 3:42pm."
- **confidence >= 0.80 AND person_id in `approved_for_auto_door`:** DO NOT auto-open. Push high-priority ntfy: "Probable Sister-in-love at door (82% confidence) — confirm?" Family member taps approve from phone → door opens.
- **confidence < 0.80 OR person_id not in approved list:** standard doorbell ring behavior. No auto-open. Foundation Agent logs the event.
- **NO face detected:** standard doorbell behavior.

Per VISION-FAIRNESS-STANDARD Rule 7 (default to safe-side errors): false negatives are SAFER than false positives. Better to wake Darrell up to confirm than to auto-open for the wrong person.

### Phase 3 — Visit pattern intelligence

The "every year, even if she misses a year, even if she comes 8 times" framing means the system should LEARN visit patterns and stop being surprised when she arrives, even if her visit cadence shifts.

**New workflow proposal: workflow 46 — Visitor pattern intelligence.**

Tracks per-approved-visitor:

- All previous visit timestamps (from workflow 44 recognition events + manual logging by family)
- Visit cadence patterns (annual, monthly, weekly)
- Last-visit gap (days since last visit)

Uses Foundation Agent (workflow 27 + Ollama 14b) to:

- Generate a friendly weekly summary of expected visitors: "Sister-in-love is overdue by 3 months — last visit was 2026-02; she usually visits in spring."
- Prepare the family for arrivals if visit cadence suggests one is imminent: "Sister-in-love typically visits this time of year; consider proactively reaching out."
- Identify pattern changes that might be worth following up on: "Sister-in-love has visited 6 times this year vs typical 2 — something good happening?"

This isn't surveillance of her. It's the family being aware of family rhythms. Output stays inside the family channel.

### Phase 4 — Friend recognition extension

The same pattern extends to approved friends. Different policy per relationship:

- **Inner circle (sister-in-love, named family friends Christina or Darrell co-approve)** — auto-open on high confidence.
- **Acquaintance circle** — recognize and announce ("Mario the chef has arrived") but don't auto-open without family member's tap.
- **Stranger** — standard doorbell ring. Foundation Agent assists with visual evaluation if requested ("does this look like a delivery driver vs an unknown person?").

Family voice (per BUSINESS-PROCESS-CONNECTIONS Family-Voice-Is-The-Connection extension) governs who gets which tier.

## Privacy + safety constraints

- **All recognition runs locally.** No face embeddings leave the NAS. No cloud face-recognition API. Period.
- **Approved-visitor enrollment requires the visitor's CONSENT.** Sister-in-love opts in explicitly. The opt-in is logged.
- **Visitors can REVOKE consent at any time.** Their embeddings are deleted; they go back to standard doorbell.
- **No tracking outside the home.** The system doesn't say where they go after arriving, doesn't try to identify them on other cameras unless they're at the front door, doesn't share their visit history with anyone outside the family.
- **Minors are NOT enrolled for auto-door.** Christian, Christyn, and Christiana are recognized internally but not used to make auto-door decisions; an adult always has to be the recognized party for auto-door to fire.
- **Audit trail.** Every auto-door event logs to the audit log per IDENTITY-ROLES-AUDIT: who was recognized, what confidence, what action taken, what time.
- **Override available.** Family can always lock the door manually + override auto-recognition (a "deadlocked" mode for nights and travel).

## What "sister in love" terminology means + why we honor it

Darrell uses "sister in love" to refer to his sister-in-law. This is intentional and faith-rooted language — the relationship is honored through love rather than reduced to a legal-in-law category. Throughout this spec and all related code/UI:

- Display strings use "Sister in love" (preserve the language).
- Database fields can use the technical term `sister_in_law` for code-readability, but UI presentation honors the family's chosen language.
- This pattern extends to other relationships when the family uses similar faith-rooted language (e.g., "brother in love," "mother in love"). The family's terminology choice is the authoritative one in any visible surface.

## Connection to other foundations

- **VISION-FAIRNESS-STANDARD** — non-negotiable; this surface is the most fairness-critical on the platform.
- **PERPETUAL-PIPELINE-HEALTH** — thirteen rules apply. Bind-mount the embeddings store. Try-catch every recognition + door-action call. Idempotent (same face same event = same decision). Health check that the smart lock is responding. Standard error envelope. Auto-restart safe behavior on container restart. Bearer auth on the door-action endpoint. Rate limit (no more than 1 auto-open every 30s). Tests on every decision path. Lifecycle states (enrolled / paused / revoked). Daily backup. Monitoring. Documentation.
- **BUSINESS-PROCESS-CONNECTIONS** — five questions before this ships:
  - Invites: sister-in-love arrives at the door.
  - Pipeline: workflow 44 → workflow 45 → smart lock + ntfy.
  - Governor: Darrell + Christina co-Govern visitor enrollment.
  - Promise: "the home will recognize you and welcome you."
  - Timeline: TBD post-vacation; do not ship until VISION-FAIRNESS-STANDARD parity bar is met.
- **EXCELLENCE-STANDARD** — religion AND relationship. Religion = the rigorous evaluation + safety thresholds. Relationship = the actual moment sister-in-love arrives and the door opens for her like she lives here.
- **GOVERNANCE-EXECUTION-ADVISORY** — Governor enrolls + revokes; Foundation executes recognition + action; Claude advises on model selection + threshold tuning.
- **THE-WAY** — hospitality made operational. The biblical pattern of welcoming the family member, the friend, the stranger — coded into how the home behaves.

## Sequencing

1. Phase 0 prerequisites (network VLAN, smart lock hardware, sister-in-love's explicit consent) — months out, after vacation + after Phase 1 security pass.
2. Phase 1 recognition workflow (44) — needs VISION-FAIRNESS-STANDARD evaluation done first. Pilot post-Phase-2 of the n8n scaling plan.
3. Phase 2 decision + door action (45) — pairs with phase 1.
4. Phase 3 pattern intelligence (46) — six months of recognition data needed before pattern detection is meaningful.
5. Phase 4 friend recognition extension — after the family's tested phases 1-3 with one approved visitor (sister-in-love) for at least a quarter.

Estimated total effort: 3-4 weeks of focused work spread across the post-vacation phases. Should NOT be rushed — the consequences of getting this wrong are real.

## Closing

When sister-in-love arrives, the door opens. The system has earned the trust to do that by being evaluated, tuned, audited, and respected by the family. The cameras work for melanated faces. The smart lock acts only on high confidence. The family's voices govern enrollment. The home welcomes its people.

This is hospitality built into infrastructure. Stewardship of the welcome.

We all win. We create. Amen.

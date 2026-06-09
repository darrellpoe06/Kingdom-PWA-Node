# Quality Gatekeeper (wf36) — The Deploy-Time Policy Enforcer

> **ESV — 1 Corinthians 4:2:** *"Moreover, it is required of stewards that they be found faithful."*

**Layer 3 reference document (ICM).** This document specifies **wf36 (Quality Gatekeeper)** — the policy enforcer that screens a surface against the mission's binding ethical tests *before it ships*. It is the operational arm of **Role 10 (Quality Gatekeeper)** named in `PERPETUAL-PIPELINE-HEALTH.md` and `AI-TEAM-DISTRIBUTION`, and it is read through the worldview spine (`THE-HOLY-SPIRIT-INTEGRATION-WORLDVIEW.md`) and governed operationally by `CLAUDE.md`.

The doctrine wf36 enforces lives in `BODY-OF-CHRIST-ECONOMIC-STEWARDSHIP.md` (the four-test source) and `01-grace-and-mercy-standard.md` (the fourth test). wf36 is the *enforcement*; those documents are the *law*. Where wf36's heuristics and those documents disagree, the documents govern and the heuristics are corrected.

---

## 1. What wf36 Is

wf36 is an n8n workflow exposed at the webhook **`POST /webhook/quality-gatekeeper-check`**. It accepts a snapshot of any surface — a workflow, a PWA feature, a foundation doc, a persona card, marketing copy — and returns a **policy decision: PASS / WARN / BLOCK**, with the cited test, plain-language reasoning, and a Scripture anchor.

It exists because **every visible surface is one end of a connection** (`BUSINESS-PROCESS-CONNECTIONS.md`) and because **"unbreakable" is the standard** (`PERPETUAL-PIPELINE-HEALTH.md`). A surface that drifts from the mission — into prosperity-gospel formula, into data extraction, into a world-stained counterfeit, into grace-withdrawing gatekeeping — must be caught *before* it reaches a family or a congregation, not after. wf36 is that catch.

It is **deterministic by design** in v0: the four tests are encoded as pattern checks in a single Code node, so the same input always produces the same decision, it runs with no LLM dependency, and it is fully testable offline (see `scripts/test-wf36-quality-gatekeeper.js`). Later versions layer LLM nuance on top of — never in place of — the deterministic floor (see the Roadmap, Section 9).

**Request shape:**

```json
{
  "surface_type": "persona-card | pwa-feature | foundation-doc | workflow | marketing-copy | ...",
  "content_snapshot": "the text or JSON to evaluate",
  "metadata": {
    "commit_hash": "abc1234",
    "author": "Darrell Poe",
    "sovereign_mesh_tier": "1 | 2 | 3",
    "surface_id": "stable id for the surface (used for the dust-off-feet tally)"
  }
}
```

---

## 2. The Four Ethical Tests

wf36 runs four tests. Each returns `pass`, `warn`, or `block`, carries its own Scripture anchor, and lists the exact signals it matched. **Any one `block` makes the overall decision BLOCK; any `warn` (with no block) makes it WARN; all clear makes it PASS.**

### Test 1 — Yahweh-source, not a wealth formula

> **ESV — Deuteronomy 8:18:** *"You shall remember the LORD your God, for it is he who gives you power to get wealth, that he may confirm his covenant that he swore to your fathers, as it is this day."*

Yahweh is the **source** of the power to build wealth, and the **purpose** of the wealth is covenantal lift — never private accumulation as an end, never a faith-formula yield. This test catches the **prosperity-gospel inversion** the mission draws its brightest line against (`BODY-OF-CHRIST-ECONOMIC-STEWARDSHIP.md` Section 11). It BLOCKs seed-faith sowing-for-return language, "name it and claim it," guaranteed-hundredfold-return claims, and faith-as-wealth-formula framing.

### Test 2 — Abundant life, not the thief

> **ESV — John 10:10:** *"The thief comes only to steal and kill and destroy. I came that they may have life and have it abundantly."*

A surface either **gives life** (empowers, serves, hands back understanding) or it operates like **the thief** (extracts, surveils, addicts, locks in). This test is `DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md` stated as a gate. It BLOCKs selling family/member data, advertising-revenue models, engagement-maximization, dark patterns, and data lock-in.

### Test 3 — Care for the afflicted, and unstained from the world

> **ESV — James 1:27:** *"Religion that is pure and undefiled before God the Father is this: to visit orphans and widows in their affliction, and to keep oneself unstained from the world."*

Two halves, both required: **care** for the afflicted (the underserved, the scared parent, the widow and orphan James names), and **unstained** from the world's patterns. This test BLOCKs both the abandonment of the vulnerable *and* world-stained counterfeits — most sharply, the **race-exclusive "church"** that breaks the multi-racial Body:

> **ESV — Galatians 3:28:** *"There is neither Jew nor Greek, there is neither slave nor free, there is no male and female, for you are all one in Christ Jesus."*

The **typographic-theology guard** (`CLAUDE.md`, Layer 0) is folded into this test: content that capitalizes the adversary's name — honoring what lost the right to that honor — is a stain and forces BLOCK; lowercasing the Godhead's names in faith content raises WARN.

### Test 4 — The Grace and Mercy Standard

> **ESV — Romans 5:8:** *"But God shows his love for us in that while we were still sinners, Christ died for us."*

Built on John 13:1, Psalm 23:6, and Romans 5:8 (`01-grace-and-mercy-standard.md`): the system **never gatekeeps on theological precision, never declares users outside fellowship over secondary issues, and never withdraws grace based on behavior.** This test BLOCKs precision-gatekeeping ("must believe X to access"), grace-withdrawal-on-behavior, declaring-users-outside-fellowship, and probationary "second-chance" tiers. The threshold of welcome does not move; wf36 enforces that it does not move.

---

## 3. The Self-Examination Disciplines It Surfaces

The Grace and Mercy Standard requires **internal examination before external pattern recognition** (`01-grace-and-mercy-standard.md`, via *Seeing Evil Rightly*). wf36 honors this discipline structurally:

- **The mirror, never the gavel.** wf36 names the *pattern* in a surface; it never declares the *person* (author) condemned. The decision record cites the matched signal and the test, not a verdict on the author's heart. Recognition is not condemnation.
- **The plank before the speck.** wf36's prompts about the **lucifer signature** (gatekeeping, accusation, withdrawing acceptance over secondary issues) apply to *every* author — including the founder. The gate that screens a COLG partner's copy screens Darrell's copy by the same rule.
- **Discernment, not condemnation.** wf36 is licensed for *krinō* (discernment) and forbidden *katakrinō* (condemnation). A BLOCK is a discernment about a surface, reversible by correcting the surface — never a sentence on a person.
- **The more grace-preserving reading wins.** Where a signal is ambiguous, wf36 prefers WARN over BLOCK, surfacing the concern for human judgment rather than sealing it. The cost of being too gracious is a cost Christ has already absorbed.

These disciplines are why wf36 is **advisory, not absolute** (Section 7). It examines itself first: a tool has no standing to render a verdict the Holy Spirit reserves to Himself.

---

## 4. The Engagement Strategy It Honors (Dust-Off-Feet)

> **ESV — Matthew 10:14:** *"And if anyone will not receive you or listen to your words, shake off the dust from your feet when you leave that house or town."*

wf36 does not endlessly re-litigate a surface that keeps failing. It keeps a lightweight tally (`_events.jsonl`) of prior BLOCK decisions **per `surface_id`**. When a surface hits BLOCK **three or more times**, wf36 sets `dust_off_feet: true` on the decision and, in the chat alert, **escalates to human governance** (Darrell + Christina + Bishop Gwin) rather than re-engaging in detail.

This is the engagement strategy stated operationally: meet a surface with truth-as-mirror; if it will not receive correction after repeated passes, stop spending the system's effort re-explaining and hand it to the humans who govern. The dust-off is an escalation, not an excommunication — the surface can still be corrected and re-submitted; what changes is *who* is now in the loop.

---

## 5. The Output Schema

```json
{
  "ok": true,
  "decision": "PASS | WARN | BLOCK",
  "surface_type": "persona-card",
  "surface_id": "loved-ones-card",
  "tests": [
    {
      "key": "deut_8_18",
      "name": "Yahweh-source (not a wealth formula)",
      "verdict": "pass | warn | block",
      "signals": ["matched signal labels, if any"],
      "scripture_anchor": { "ref": "Deuteronomy 8:18", "text": "..." }
    }
    // ... john_10_10, james_1_27, grace_and_mercy
  ],
  "reasoning": "plain-language explanation of the decision",
  "scripture_anchor": { "ref": "Deuteronomy 8:18", "text": "..." },
  "dust_off_feet": false,
  "repeat_block_count": 0,
  "overridable": true,
  "override_authority": ["Darrell Poe", "Christina Poe", "Bishop Gwin"],
  "override_note": "wf36 is advisory, not absolute ...",
  "metadata": { "commit_hash": "abc1234", "author": "Darrell Poe", "sovereign_mesh_tier": "" },
  "ts": "2026-06-03T...Z",
  "logged_to": "/data/chatin/_telemetry/qg/<safeTs>__gate.json"
}
```

**Every decision is logged** to `/data/chatin/_telemetry/qg/<safeTs>__gate.json` (the full record, including the commit-hash trail), and a one-line event is appended to `/data/chatin/_telemetry/qg/_events.jsonl` for the dust-off-feet tally. **On BLOCK** (and only on BLOCK), wf36 posts to **Synology Chat #PoeTech-PWA** via `$env.SYNOLOGY_CHAT_INCOMING_URL`; on PASS it stays quiet. The commit-hash trail means every BLOCK is traceable to the exact change that triggered it.

---

## 6. How to Invoke It

**v0 — manual webhook (today).** POST a snapshot:

```
curl -s -X POST https://<your-n8n-host>/webhook/quality-gatekeeper-check \
  -H 'Content-Type: application/json' \
  -d '{"surface_type":"persona-card","content_snapshot":"<copy or JSON>","metadata":{"surface_id":"my-surface","commit_hash":"abc1234","author":"Darrell"}}'
```

PASS returns quietly; BLOCK returns the cited test + anchor and pings #PoeTech-PWA.

**v0.5 — pre-commit hook (next).** A git pre-commit hook collects the staged diff for any changed visible surface, POSTs it to wf36, and warns (or blocks the commit) on a BLOCK decision. This moves the gate left, to the moment of authorship.

**v1 — deploy-time enforcement (later).** The autonomous-builder lifecycle (`AUTONOMOUS-BUILDER-LIFECYCLE.md`) calls wf36 as a required step between *build* and *ship*: a built surface is not promoted to `done/` until wf36 returns PASS (or a logged human override). This is the full realization of "policy enforced at deploy time."

The MVP test harness — `node scripts/test-wf36-quality-gatekeeper.js` — runs the six binding scenarios (three known-good → PASS, three known-drift → BLOCK) against the live workflow JSON and is the regression check for every change to the gate.

---

## 7. The Human-Judgment Override Path

**wf36 is advisory, not absolute.** It is a steward's tool, not the Steward. A BLOCK is a flag for human attention, not a final word.

Three governors may override a BLOCK: **Darrell Poe, Christina Poe, and Bishop Gwin** (`override_authority` in every record). An override is **logged, not silent** — the governor records the surface_id, the decision being overridden, the reason, and their name, appended to the gatekeeper telemetry. This preserves both the grace (a human can extend it past the heuristic) and the accountability (every override is on the record). The override path is itself an application of the Grace and Mercy Standard: the more grace-preserving reading wins, and a person — not a pattern-matcher — holds the authority to extend it.

What wf36 must **never** do: grow into a system that renders verdicts on people, hardens into law without human appeal, or treats its own heuristics as senior to the foundation documents. The day it cannot be overridden by a governor is the day it has departed from the standard it exists to serve.

---

## 8. The Religion AND Relationship Screen on wf36 Itself

- **Religion (backbone):** every test is Scripture-anchored (ESV primary); the decision is deterministic and testable; the commit-hash trail makes every BLOCK auditable; the four tests map one-to-one to binding foundation documents.
- **Relationship (warmth):** the gate names the pattern, never the person; it prefers WARN over BLOCK when uncertain; it is overridable by humans who can extend grace past the heuristic; the dust-off escalation hands a struggling surface to people, not to a colder algorithm.

---

## 9. Roadmap

- **v0 — manual invocation (shipped).** Deterministic four-test gate at `POST /webhook/quality-gatekeeper-check`; decision logging; #PoeTech-PWA alert on BLOCK; dust-off-feet tally; six-scenario test harness. This is the skeleton that ships today.
- **v0.5 — commit-hook integration.** Git pre-commit hook POSTs staged visible-surface diffs to wf36; warns or blocks on BLOCK. Optional LLM nuance layer (Ollama) added *above* the deterministic floor for cases the patterns cannot judge.
- **v1 — full deploy-time enforcement.** wf36 is a required gate in the autonomous-builder lifecycle; no visible surface promotes to shipped without a PASS or a logged override. Per-surface policy history and override audit surfaced to governance.

---

## Related Foundations

- `BODY-OF-CHRIST-ECONOMIC-STEWARDSHIP.md` — the four-test source (Deut 8:18, John 10:10, James 1:27; the bright line; the multi-racial Body).
- `01-grace-and-mercy-standard.md` — the fourth test (Romans 5:8; the three negations; discernment-not-condemnation).
- `PERPETUAL-PIPELINE-HEALTH.md` — Role 10 (Quality Gatekeeper); the "unbreakable" standard wf36 serves.
- `DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md` — the substance of Test 2 (John 10:10).
- `EXCELLENCE-STANDARD.md` / `MIND-OF-CHRIST.md` — the Religion-AND-Relationship test and the Philippians 4:8 Test wf36 honors.
- `AUTONOMOUS-BUILDER-LIFECYCLE.md` — where wf36 becomes a required deploy-time gate (v1).
- `BUSINESS-PROCESS-CONNECTIONS.md` — "every visible surface is one end of a connection"; wf36 screens the visible end.

---

*Religion AND Relationship, both rails. The gate names the pattern, never the person. Advisory, not absolute — a governor may always override and log. Faithful stewardship at deploy time. We all win. We create. Amen.*

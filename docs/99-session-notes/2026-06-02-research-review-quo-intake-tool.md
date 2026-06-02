# Quo as Incoming-Tab phone-call intake — research-review

**Date:** 2026-06-02 (Tue)
**Author:** Claude (session running on Darrell's behalf while he's on vacation in Maui)
**Triggered by:** Darrell @ Synology Chat 01:36pm CDT, scope-corrected 02:?? pm CDT
**Format binding:** `feedback-research-first` (no production code change without a research-review first)
**Output gate:** binding principle filters (`project-cost-discipline-with-growth-permission`, `project-sovereign-mesh-mvp-pragmatism`, `project-sovereign-llm-teams-per-industry`, `DATA-AS-EMPOWERMENT-NOT-EXTRACTION`, TLC bright line per `CLAUDE.md` + `COUNCIL-CHAMBER.md`)

---

## 1. Source question (verbatim)

From Darrell @ Synology Chat 01:36pm CDT 2026-06-02:

> "@nas Research from the add in this video called Quo. Quo seems like our tab for incoming.
> Also the content in this is a process we want to build systems to support eventually any low hanging fruit we want and a potential building of a module if when we know more after research and opportunities.
> The Church Tab makes sure that the people can be heard and the dev/ops as helpful as possible.
> https://m.youtube.com/watch?v=CveaC6-l04M&si=fQyZseXSOR_3tIuW"

Scope correction follow-up:

> "Quo is for the Incoming Tab phone calls."

So the question being answered: **is Quo a model — adopt / steal-ideas / ignore — for the PoeTech Incoming Tab phone-call intake surface (Voice Worker + Phase 0 phone-assistant), given the binding TLC firewall and sovereign-LLM-team direction?**

---

## 2. What is Quo? (product identification)

**Quo (quo.com) — formerly OpenPhone.** A cloud-hosted business phone system, rebranded from OpenPhone in 2026. Targets startups, small businesses, and growing teams. Sits in the "modern business phone" category alongside Dialpad, Aircall, RingCentral, JustCall.

The AI feature inside Quo — the one Darrell's source video is almost certainly advertising — is **Sona**. Sona is Quo's 24/7 AI voice agent / virtual receptionist. It is the "tab for incoming" Darrell named.

What Sona does, per Quo's own product pages:

- Answers incoming calls 24/7 in a chosen voice
- Greets the caller and identifies intent through natural-language conversation
- Answers common business questions from a knowledge base the business builds from its website URL, uploaded PDFs, and custom documents
- Books appointments by sending the caller a booking link mid-call
- Takes messages and routes them to the right person/team
- Texts callers follow-up information
- Generates call summaries and voicemail transcriptions automatically
- Handles multiple calls in parallel
- Plugs into a drag-and-drop call-flow builder (IVR-equivalent) for routing

**Note on transcript retrieval.** The YouTube video Darrell linked (`CveaC6-l04M`) returned `playabilityStatus=ERROR Video unavailable` in the headless Chrome session this report was produced from, and the Google index has zero hits for that video ID — strong indicator the link is unlisted, age-restricted, geo-gated, or recently pulled. The product identification above is from Quo's public marketing surfaces, not the video itself. If the video is a Quo competitor or a different "Quo" product (Quo Capital, Quo Health, Quo Labs etc.), this analysis needs revision; on the balance of probabilities and given the "tab for incoming = phone calls" framing in the scope correction, Quo / Sona is the right target.

**Sources for product identification:**

- [Quo (formerly OpenPhone) — homepage](https://www.quo.com/)
- [Sona AI receptionist product page](https://www.quo.com/product/ai/receptionist)
- [Sona — never miss a customer page](https://www.quo.com/sona)
- [Quo AI voice agent for growing businesses](https://www.quo.com/product/ai/voice-agent)
- [Quo review 2026: AI-powered business phone system (ChatOdyssey)](https://www.chatodyssey.com/ai-phone-number/quo-review-2026-ai-business-phone)
- [Quo (formerly OpenPhone): Best AI Phone System for SMBs in 2026 (Baselynk)](https://baselynk.com/why-quo-formerly-openphone-is-the-best-phone-system-for-your-business-in-2026/)

---

## 3. Quo's architecture (intake / routing / AI / sovereignty / pricing)

### Intake mechanism

Phone numbers are provisioned by Quo (US + Canada native; international optional). Calls hit Quo's PSTN-edge running on AWS + Google Cloud Platform. Sona answers from that edge — the audio never reaches the user's own infrastructure. Voicemail, transcription, AI summaries, and recordings live in Quo's cloud, exposed through Quo's mobile + desktop + web apps.

### Routing

The drag-and-drop call flow builder is the IVR / business-hours / ring-group control. Routes can branch on caller-pressed digits, business hours, ring-group order, or Sona's intent classification. Sona can hand the call off to a human team member if it can't resolve, with context summary pre-loaded.

### AI / LLM

Sona is a vendor LLM running inside Quo's cloud. Quo doesn't publish which model family (almost certainly OpenAI or Anthropic under the hood given the era) — the AI is opaque to the customer. Sona's "training" is RAG-style: a knowledge base built from the customer's website URL + uploaded PDFs + custom docs, retrieved at inference time. Voice synthesis is one of a handful of pre-selectable voices.

### Sovereignty posture

This is the load-bearing part of the analysis.

- **Data location:** Quo hosts on AWS and Google Cloud Platform. All call audio, recordings, transcriptions, AI summaries, and the Sona knowledge base sit in Quo's cloud infrastructure.
- **HIPAA story:** Quo is HIPAA-compliant — BUT only with a signed Business Associate Agreement, and BAAs are only available on the **Business** plan ($23/user/mo annual) or **Scale** plan ($35/user/mo annual). Calls / texts / voicemails with PHI remain inside Quo's infrastructure, encrypted at rest and in transit. This is cloud-HIPAA, not sovereign-HIPAA. PHI lives at AWS / GCP, not on the family's NAS.
- **Export:** call recordings + transcriptions are exportable; the AI summaries and the Sona knowledge base are operator-locked behind Quo's surfaces.
- **Self-host option:** none. Quo does not offer a self-hosted edition or on-prem deployment. By design.
- **Vendor swap:** the phone number can be ported out, but every minute of audio captured during the Quo tenure stays in Quo's cloud unless explicitly exported one-by-one. There is no equivalent of "move my model + state to another machine."

Sources:

- [Quo security page](https://www.quo.com/security)
- [Quo Resource Center — Security and compliance](https://support.quo.com/core-concepts/administration/security-and-compliance)
- [Quo — HIPAA compliance announcement (LinkedIn 2026)](https://www.linkedin.com/posts/gowithquo_big-news-quo-formerly-openphone-is-now-activity-7391517968314032128-O0Tf)
- [Quo — 6 key requirements for HIPAA-compliant call recording](https://www.quo.com/blog/hipaa-compliant-call-recording/)

### Pricing

Per Quo's own pricing pages (2026):

| Plan | Annual ($/user/mo) | Monthly ($/user/mo) | HIPAA BAA | Sona included |
|---|---|---|---|---|
| Starter | $15 | $19 | No | 10 calls/mo (free, all plans) |
| Business | $23 | $33 | Yes (on request) | 10 calls/mo |
| Scale | $35 | — | Yes (on request) | 10 calls/mo |

**Sona add-on (per workspace, on top of plan):**

- Free: 10 Sona-handled calls / mo (included with any plan)
- $25 / mo: 40 calls
- $49 / mo: 100 calls
- Tiered higher above that

Calls under 15 seconds don't count toward usage. Billed per call, not per minute.

**Concrete monthly cost for the realistic PoeTech footprint:**

- 1 user (Darrell), Starter, free Sona tier: **$15-19 / mo, max 10 AI calls/mo**
- 1 user, Business plan (for any HIPAA BAA scenario), free Sona tier: **$23-33 / mo, max 10 AI calls/mo**
- 1 user, Business, Sona 100-call tier: **$72-82 / mo**
- 3 users (Poe Properties + COLG + Counseling-front-desk-handling), Business, Sona 100 calls: **$94-148 / mo**
- HIPAA BAA = mandatory upgrade to Business or Scale for any call line that could plausibly touch PHI

Sources:

- [Quo pricing page](https://www.quo.com/pricing)
- [Quo Resource Center — Plans and Pricing](https://support.quo.com/core-concepts/administration/billing/pricing)
- [Quo (formerly OpenPhone) pricing guide 2026 (Ringly)](https://www.ringly.io/blog/openphone-pricing)
- [OpenPhone (Quo) pricing plans guide 2026 (Ringover)](https://www.ringover.com/blog/openphone-pricing-plans)

### What Quo does well (worth naming explicitly)

1. **Knowledge-base-from-URL pattern.** Point Sona at a website + a few PDFs and it can field "what are your hours / what does this cost / where are you / how do I become a member" with no engineering work. That UX is the right shape for the COLG front-desk use case where elderly staff cannot maintain a hand-coded intent classifier.
2. **Drag-and-drop call flow builder.** Visual IVR / routing config. Operator-editable, not engineer-edited. Aligns with `COMMUNITY-FIRST-MISSION` Commitment 2 (accessibility for non-technical staff) at the operator side.
3. **Per-call billing, not per-minute.** Aligns with how a small church or solo operator actually thinks about cost.
4. **Booking-link mid-call.** Real, useful pattern. Sona drops a link to the caller's phone as a text while still on the call.
5. **Call summaries + transcriptions inline.** Operator doesn't have to listen back; reads a 3-sentence summary.
6. **Multi-line parallelism out of the box.** Sona handles 10 simultaneous calls without rep headcount; the same workload on a human-only line caps at 1.

These are STEALABLE patterns for the PoeTech Incoming Tab — every one of them is achievable on the sovereign stack with no Quo dependency.

---

## 4. PoeTech intake stack — current state

Established context, from the foundation docs + existing workflows in the repo. This is the surface Quo would be compared against.

### Existing intake surfaces

- **`docs/00-foundations/_root/INTAKE-AND-FIT.md`** binds the external + internal intake pipeline. Five-stage flow: Capture → Screen (8-dimension rubric) → Position on Business Change Lifecycle → Verdict (🟢 plausible-ready / 🟡 plausible-needs-maturing / 🔵 defer / 🔴 not-a-fit) → Realisation tracking.
- **`docs/00-foundations/_root/COUNCIL-CHAMBER.md`** binds the listening-mode counterpart. Mode-routing classifier auto-decides between Council Chamber (pastoral, Scripture-mirrored) and Dev/Ops (problem-solving) based on input shape. **Pastoral, not clinical. TLC firewall.**
- **Voice Worker** — `backend/voice-worker/`, already shipping. Twilio voicemail webhook is the existing phone-call intake. Lands voicemails as `inbound_calls` rows.
- **Public intake form** — Phase 2 at `poetech.us/intake`, single open-ended question; classifier routes.
- **Email parsing** — Phase 3 at `sales@poetech.us` / `intake@poetech.us`.
- **wf08 — Synology Chat inbound capture.** `@nas` / `@cpoe` chat mentions → `/data/chatin/` on the NAS. Family-voice senders fire ntfy push (priority 4) to `poetech-family-feedback`; non-family captures silently.
- **wf13 — Chat action router.** Cron-driven scan of `/data/chatin/`; pattern-matches verbs (`dm`, `send to`, `email`, `notify`) and routes; falls through to "queue for review."
- **wf30 — Family feedback intake.** PWA Suggest button → `/data/finance-events/family-feedback/`; family-voice senders fire ntfy priority-4 push to the same topic as wf08.

### Existing phone-assistant Phase 0 plan

Per `docs/99-session-notes/2026-06-01-session-state-snapshot.md` and `docs/99-session-notes/2026-06-02-consolidated-ai-work-processes-repos-skills-extract.md` Category C1:

> "Phone-assistant Phase 0 commit — ~6-8 weeks for the Poe Properties tenant-call pilot using Twilio + Gemini Live + Whisper STT; ~$20-40/mo all-in (Gemini Pro covered)."

The named architecture:

- **Twilio Programmable Voice** — PSTN bridge. Cloud SaaS but Tier 2 (vendor-swappable, audio passes through but capture lands on our side). $0.0085/min inbound, $0.014/min outbound, $0.0025/min record. Phone number $1-2/mo. Free $15 trial credit.
- **Whisper STT** — sovereign speech-to-text on the NAS or local container. Tier 1.
- **Gemini Live** (current Phase 0 reasoning brain) — vendor LLM, but Tier 2 because Phase 2 swaps to sovereign LLM team without rewrite. Covered under Darrell's $20 Gemini Pro subscription.
- **Phase 2 swap target:** sovereign per-industry LLM team for Phone-Front-Desk, running on Ollama + the future Proxmox GPU box. Then everything is Tier 1.

### TLC firewall — the binding bright line

`CLAUDE.md` is unambiguous:

> "TLC firewall — clinical content NEVER leaves the NAS."

`COUNCIL-CHAMBER.md` reinforces:

> "The Council Chamber, on the SKOS PWA, holds *no PHI*. It is a discipleship space — a believer thinking through a situation against Scripture with the system as a quieter version of a wise friend."

And `INTAKE-AND-FIT.md` Dimension E:

> "HIPAA without a BAA path: hard-no (verdict 🔴). The Voice Worker already enforces this at the `ALLOWED_LINES` layer — TLC traffic never touches the prospect pipeline."

The TLC bright line is structural, not preferential. ANY architecture that lets clinical-call audio leave the NAS — even encrypted, even under a BAA, even with a vendor's HIPAA badge — fails the bright line. The Voice Worker's `ALLOWED_LINES` discipline is already the operating posture for the Twilio path.

### What's already live + what's drafted

- Voice Worker (Twilio voicemail webhook) — shipping
- wf08 — drafted + active
- wf13 — drafted + active
- wf30 — drafted + active
- Phase 0 phone-assistant — not started; ~6-8 weeks of focused build
- Sovereign LLM team for phone-front-desk — pending the post-vacation `SOVEREIGN-LLM-TEAMS-PER-INDUSTRY.md` foundation doc + the GPU box if/when workload justifies

---

## 5. Cross-comparison table — Quo Sona vs PoeTech Phase 0 sovereign path

| Axis | Quo Sona | PoeTech Phase 0 (Twilio + Whisper + Gemini Live → sovereign LLM team) | Winner on this axis |
|---|---|---|---|
| Time-to-first-call-handled | Hours (sign up, port number, train Sona on URL) | 6-8 weeks focused build | Quo |
| 24/7 AI receptionist | Out of the box | Build (Phase 0 covers it) | Quo on speed; tie on outcome |
| Multi-call parallelism | Native | Native via Twilio + LLM | Tie |
| Call-flow builder UI | Drag-and-drop, operator-editable | Code-edited workflow today; operator-editable surface in Phase 2 | Quo for now |
| Knowledge-base-from-URL | Native (URL + PDFs + custom docs) | Build (RAG on Ollama + embeddings — `nomic-embed-text` already on NAS) | Quo on speed; PoeTech once built |
| Booking-link mid-call | Native | Build (PWA already has the booking surface; bridge from Twilio is the new piece) | Quo on speed |
| Call summaries + transcriptions | Native | Whisper STT sovereign; LLM summary via Ollama or Gemini | Tie on outcome; Quo on speed |
| Per-call billing economics | $0.25-0.50 per call effective (40-call tier) | $0.05-0.20 per call effective (Twilio + LLM tokens) | PoeTech on unit cost at scale |
| Vendor lock-in | High (calls stored in Quo cloud, exportable but not migratable as a stack) | None (Twilio is portable; LLM swappable; recordings on NAS) | PoeTech, decisively |
| **Sovereignty Tier** (per project-sovereign-mesh-mvp-pragmatism) | **Tier 3** — proprietary API contract, vendor-locked AI, no self-host path | **Tier 1-2** — Twilio Tier 2 (vendor-swappable), Whisper Tier 1, Sovereign LLM team Tier 1 | PoeTech, decisively |
| **TLC firewall compatibility** | **HARD FAIL** — even with BAA, PHI lives in AWS/GCP, not the NAS. CLAUDE.md says clinical content NEVER leaves the NAS. Quo's HIPAA is cloud-HIPAA, not sovereign-HIPAA | Compatible — `ALLOWED_LINES` discipline already keeps TLC traffic off the prospect pipeline; sovereign LLM brain keeps PHI on-NAS | PoeTech, non-negotiable |
| Sovereign-LLM-teams alignment (per project-sovereign-llm-teams-per-industry) | Direct inverse — Sona IS a vendor cloud LLM doing the work | Direct expression — Phone-Front-Desk is a named per-industry sovereign team | PoeTech, decisively |
| Data-as-empowerment alignment (per DATA-AS-EMPOWERMENT-NOT-EXTRACTION) | Cloud SaaS with vendor extraction risk — not architecturally sovereign per Commitment 1 | Compatible — sovereign by Commitment 1 + open-source-core Commitment 2 + exportable Commitment 3 | PoeTech, decisively |
| COLG-mission alignment (per COMMUNITY-FIRST-MISSION) | Fails Commitment 4 (sovereign infrastructure where possible) and Commitment 5 (no SaaS-tax grinding down community institutions). Self-host tier impossible. | Fits all 7 commitments | PoeTech, decisively |
| Showcase / differentiator value | Adopting Quo = "we wrap a vendor SaaS" — PoeTech becomes indistinguishable from any other small SMB. | The phone-front-desk sovereign team IS the showcase per project-sovereign-llm-teams-per-industry | PoeTech, decisively |
| Operator-editable surface for elderly church staff | Yes (drag-and-drop builder) | Not yet — Phase 0 doesn't ship an operator UI; that's a Phase 1+ build | Quo |
| Cost — bare minimum 1 user | $15-19/mo Starter (Sona free tier = 10 AI calls/mo) | ~$20-40/mo Phase 0 (Twilio + Gemini Pro covered) | Quo at the floor; converges fast |
| Cost — HIPAA-eligible 1 user, real volume | $48-82/mo Business + Sona 40-100 tier + BAA | ~$20-40/mo same architecture, no per-user multiplier | PoeTech, decisively |
| Cost — 3 user lines (Poe Properties + COLG + Counseling-front-end) | $94-148/mo + per-call Sona overage | ~$30-60/mo same stack | PoeTech, decisively at scale |
| Pricing-that-serves alignment (per COMMUNITY-FIRST-MISSION Commitment 5) | Per-user SaaS multiplier — exactly the "silent tax" the doc names | Per-call cost only — no per-user multiplier | PoeTech, decisively |

---

## 6. Cost-efficiency screen (binding per project-cost-discipline-with-growth-permission)

### What does this spend produce in growth terms?

For Quo Sona:
- Speed-to-pilot: weeks → hours
- Operator-editable surface: yes
- No engineering required for v1

For PoeTech Phase 0:
- Compounded capability — every sovereign-LLM-team that ships rides on the same Twilio + Whisper + LLM substrate. The Phone-Front-Desk team becomes the SECOND team after the Family-Finance team (per `project-sovereign-llm-teams-per-industry` post-vacation buildout step 2). One investment unlocks N downstream sovereign-team products.
- The showcase narrative — adopting Quo gives PoeTech a wrapper to a vendor SaaS; building it ourselves is the differentiator we sell.
- Community Module path — the same infrastructure becomes the COLG phone-tree without Quo's per-user multiplier ever hitting the church's budget.

### Unit cost — does it improve as scale grows?

- **Quo:** unit cost stays roughly flat or worsens with scale. Per-user pricing is a linear tax. Sona credits tier up but stay metered. Adding a third or fourth phone line means adding $23-35/user/mo on top of Sona credits. No fixed-cost amortization.
- **PoeTech:** unit cost IMPROVES with scale. Twilio per-minute cost is identical across users. Whisper + sovereign LLM run on already-owned hardware (the NAS today, the GPU box later) — every additional caller amortizes the fixed compute cost. Network effects across families/communities running their own instances drop blended cost further.

### What's the leaner version?

The Phase 0 phone-assistant plan IS the leaner version of a sovereign Sona-equivalent. ~$20-40/mo all-in with Gemini Pro covered. The lean alternative TO BUILDING is to use the current Voice Worker voicemail-only path until the post-vacation calendar opens, then ship Phase 0 in the named 6-8 week window.

### What does going leaner cost?

- Stay with voicemail-only Voice Worker through summer → free, but the family + Poe Properties keep eating the cost of missed tenant calls and missed pastoral calls. The "miss" cost (a tenant defaulting, a member in crisis who didn't reach Bishop Gwin) is real but unquantified.
- Pay for Quo Starter + Sona free tier as a stopgap → $15-19/mo for ~10 AI calls/mo, no HIPAA path, lock-in starts day 1. This is the "rent the answer" option.

### Break-even point that justifies the spend?

The Phase 0 phone-assistant build is justified the moment ONE of these is true:
1. Poe Properties tenant calls regularly exceed Darrell's ability to answer in-person (already true)
2. COLG needs an answering front-end (likely true within months as Church Module rolls out)
3. TLC client triage / scheduling needs to reduce Christina's interrupt load (likely; needs Christina's voice on it)
4. A second business line (Counseling intake / Sermon-line / Practice ops) becomes a real need

Three of those four are already in flight; the build is justified.

### Evolution trigger — when does it become time to pay?

- If Quo Sona ships a feature in the next 6-12 months that meaningfully exceeds what a sovereign team can produce (unlikely — sovereign LLM specialization beats general SaaS at narrow domains per the binding direction), revisit.
- If the Phase 0 build slips past Q1 2027 with no shipping date, consider Quo Starter as a 90-day bridge — but ONLY for the Poe Properties tenant line, NEVER for any line that could touch PHI, and only with a documented exit-by date.

---

## 7. Sovereign-mesh tier label (binding per project-sovereign-mesh-mvp-pragmatism)

- **Quo Sona:** **Tier 3** — vendor-SDK-only integration with proprietary API contract, no self-host path, AI is an opaque cloud service. The phone number can be ported, individual call recordings can be exported, but the call-flow config, the Sona knowledge base, the AI summaries, and every minute of audio captured stay in Quo's cloud. Migration to sovereign requires reimporting the knowledge base + rebuilding flows from scratch + accepting that prior call history stays at the vendor.
- **PoeTech Phase 0 (Twilio + Whisper + Gemini Live):** **Tier 2** — Twilio is vendor but vendor-swappable (every alternative voice provider speaks similar APIs); Whisper is Tier 1 sovereign; Gemini Live is Tier 2 but explicitly identified as the swap target for the sovereign LLM team. The architecture EVOLVES to Tier 1 as the sovereign team replaces Gemini without rewriting the pipeline.

---

## 8. Sovereign-LLM-teams-per-industry alignment (binding per project-sovereign-llm-teams-per-industry)

This filter is decisive. From the binding memory:

> "PoeTech does NOT try to out-build OpenAI / Anthropic / Google on raw infrastructure scale. We cannot win that fight and it is not our calling. Instead... per-industry specialization: instead of one general-purpose model that does everything mediocrely, ship industry-specific LLM teams that do their domain WELL. Finance team, family-counseling team, church-ops team, real-estate team, education team, etc. ... The showcase: this capability IS the product PoeTech sells."

The Incoming Tab phone-front-desk is one of the named industry teams — the FRONT DOOR for whichever caller's industry context matches (tenant → real-estate team, member → church team, counseling client → TLC firewall path, prospect → Dev/Ops intake). Adopting Quo Sona = adopting a vendor cloud LLM as our front door = directly inverting the binding direction.

**The phone-front-desk sovereign team is exactly the kind of "low-hanging-fruit productivity win" Darrell named in the binding memory:** stress relief through control, daily work taken off the family, vendor LLMs reserved for the strategic / heavy-reasoning moments.

---

## 9. Data-as-empowerment alignment (binding per DATA-AS-EMPOWERMENT-NOT-EXTRACTION)

Five architectural commitments from the foundation doc:

1. **Architecturally sovereign** — Quo fails (cloud-only). PoeTech Phase 0 passes (Twilio is a transport bridge; capture lands on NAS).
2. **Open-source core** — Quo fails (closed source). PoeTech passes (Whisper + Ollama + n8n all open-source; per `project-skos-open-source-stack`).
3. **Exportable always** — Quo partial (recordings exportable, AI knowledge base + flows not). PoeTech passes.
4. **No advertising business model** — Both pass.
5. **No engagement optimization** — Both pass.

Five anti-patterns that never ship; the relevant one here:

> "Anti-pattern 4 — Data lock-in. Features designed to make leaving the platform harder. Proprietary export formats. Missing export options. Re-import friction."

Quo Sona's knowledge base + call-flow builder are exactly this shape. PoeTech's Phase 0 has zero lock-in by architecture.

---

## 10. TLC firewall — the hard gate

**This is the section that makes the recommendation unambiguous.**

`CLAUDE.md` declares: "**TLC firewall — clinical content NEVER leaves the NAS.**"

`COUNCIL-CHAMBER.md` declares: "**The Council Chamber, on the SKOS PWA, holds no PHI.**" And: "**TLC Therapy Solutions LLC, Christina's HIPAA-walled practice, is the clinical surface. It is the only place in the SKOS ecosystem where Protected Health Information is created, stored, or processed. TLC stays separate at every layer.**"

`INTAKE-AND-FIT.md` Dimension E declares: "**HIPAA without a BAA path: hard-no (verdict 🔴). The Voice Worker already enforces this at the ALLOWED_LINES layer — TLC traffic never touches the prospect pipeline.**"

Quo IS HIPAA-compliant with a BAA on Business or Scale plans. BUT — and this is structural, not preferential — even with a signed BAA, PHI lives in AWS / GCP, not on the NAS. The bright line in CLAUDE.md is sovereign-HIPAA, not cloud-HIPAA. The Voice Worker `ALLOWED_LINES` discipline is the right shape because it lets us route TLC-touching calls AWAY from any non-sovereign edge entirely.

If Quo were considered as a partial adoption (Poe Properties tenant line ONLY, NOT Counseling, NOT Bishop Gwin pastoral), the bright line is preserved at the line-routing level — BUT it still creates a structural risk:

- A pastoral call coming in on the wrong number (a member dials the Poe Properties number in distress because that's the number they have) routes audio to Quo's cloud before any classifier can label it pastoral. The audio is captured in Quo's cloud at that point — the bright line is broken.
- The unified "Incoming Tab" experience Darrell named cannot live on Quo without ALL incoming numbers going to Quo, which means the TLC line goes to Quo, which is a hard-no.

**Conclusion:** Quo Sona cannot be the unified Incoming-Tab front door. The TLC firewall and the per-line `ALLOWED_LINES` discipline already in the Voice Worker rules it out.

---

## 11. Recommendation

**STEAL the best ideas, BUILD on the sovereign Phase 0 plan already named. Do NOT adopt Quo for the unified Incoming Tab.**

This is the default sovereign-first posture per all five binding filters, and it is the right call here because each filter independently points the same direction:

- TLC firewall: Quo fails the bright line for the unified Incoming Tab.
- Sovereign-LLM-teams-per-industry: Quo is the inverse of the showcase direction.
- Sovereign-mesh tier: Quo is Tier 3 / PoeTech is Tier 2 evolving to Tier 1.
- Data-as-empowerment: Quo fails Commitment 1 (sovereign), 2 (open-source core), and partial-fail 3 (exportable).
- Cost-discipline-with-growth: Quo's per-user multiplier is the silent tax `COMMUNITY-FIRST-MISSION` Commitment 5 names; PoeTech's unit cost improves with scale, Quo's doesn't.

### Patterns to steal explicitly (these go into the Phase 0 + Phase 1 buildout)

1. **Knowledge-base-from-URL-and-PDFs.** Phase 0 reads Quo's Sona setup pattern as the right shape — point the sovereign team at `poetech.us` + the family / church / business URLs + a small set of PDFs (rental ledger, church directory, practice intake forms), use `nomic-embed-text` for embeddings (already on the NAS), Qwen 14b or the sovereign per-industry model for retrieval-augmented answers. Operator never touches code to update the knowledge base.
2. **Drag-and-drop call-flow builder UI.** PoeTech's Phase 1+ operator surface for the Incoming Tab follows Quo's UX pattern: visual nodes for "answer / branch on intent / route to team / collect message / book appointment / hand off to human." This becomes a reusable component in the WORKFLOW-MODULE-LIBRARY per `project-workflow-module-library` — the Family-Voice-Loop module's sibling.
3. **Per-call summary + transcription inline.** Already in the Phase 0 plan via Whisper STT; add a 3-sentence summary step via the sovereign LLM team. The summary is the operator's primary surface, not the audio.
4. **Booking-link mid-call.** Phase 0 wires the existing PWA booking endpoints (Acuity for Practice, internal calendar for Dev/Ops) to a Twilio SMS hand-off mid-call. Two-week effort once Phase 0 is in flight.
5. **Sona's HIPAA-with-BAA-on-Business-plan-only model = the negative blueprint.** PoeTech's HIPAA story is structurally cleaner: PHI never reaches the cloud at all because the LLM brain is sovereign. We can document this as a positioning point.
6. **Per-call billing optics for end-customer.** PoeTech tier pricing for the Church Module + Family / Premium / Business tiers already follows this shape (per `INTAKE-AND-FIT.md` Dimension H); Sona's per-call model validates the design.

### Alternatives Darrell could pick instead

**Alternative A (default): BUILD the sovereign Phase 0 phone-assistant on the existing plan.**

- 6-8 weeks focused build (already estimated)
- ~$20-40/mo all-in (Gemini Pro covered)
- Sovereignty Tier 2 → Tier 1 as the sovereign LLM team ships
- Compounds across N future per-industry teams
- Estimated effort to start: write `docs/00-foundations/_root/SOVEREIGN-LLM-TEAMS-PER-INDUSTRY.md` post-vacation (1-2 hours), spec Phone-Front-Desk team architecture (2-4 hours), begin Phase 0 build (6-8 weeks)
- Sovereignty-aligned, mission-aligned, cost-aligned, TLC-aligned

**Alternative B (bridge, conditional): adopt Quo Starter for the Poe Properties tenant line ONLY as a 90-day bridge if Phase 0 slips.**

- $15-19/mo + Sona free tier (10 AI calls/mo)
- HARD CONDITIONS: only the Poe Properties tenant line, never the TLC line, never any pastoral line, never the unified Incoming Tab
- Documented exit-by date: 2027-Q1 (when Phase 0 must ship)
- Estimated effort to start: half-day port-in + Sona knowledge-base setup; half-day to wire Sona webhooks to a PoeTech intake endpoint that lands the captures in the existing `inbound_calls` table
- Risk: lock-in starts day 1; pulling Quo back out means losing all captured audio + AI summaries unless explicitly exported case-by-case
- Recommend ONLY if Phase 0 slips past Q1 2027 OR Darrell decides the Poe Properties tenant-call volume is hurting now and the 6-8 week build can't be scheduled fast enough

**Alternative C (hybrid, NOT recommended): Twilio carries the call, Quo Sona is the LLM brain.**

- Technically possible — Twilio Studio can fork audio to a Quo endpoint
- BUT defeats the point: PHI still touches Quo's cloud for any TLC-routable call; sovereign-LLM-team direction is still inverted; lock-in still applies
- Document as evaluated-and-rejected so future Claude sessions don't reconsider without new information

**Alternative D (NOT recommended): adopt Quo as the unified Incoming Tab.**

- TLC firewall hard-fail. Documented here so the door stays closed.

### Estimated effort to act on the recommendation

- Today / on-vacation: **none.** This research-review IS the action for today, per `feedback-research-first`. The decision is named; the build waits for Darrell's return per the vacation-mode posture.
- Post-vacation Week 1:
  - Foundation doc: `docs/00-foundations/_root/SOVEREIGN-LLM-TEAMS-PER-INDUSTRY.md` formalizing Phone-Front-Desk as a named per-industry team (~1-2 hours)
  - Spec doc: `docs/05-modules/incoming-tab/PHASE-0-PHONE-ASSISTANT-SPEC.md` with the stolen-from-Quo UX patterns explicitly named as design references (~2-4 hours)
  - Build Phase 0 v0: Twilio inbound webhook → existing Voice Worker → Whisper STT → Gemini Live brain → reply path. Single Poe Properties tenant line pilot. (~6-8 weeks)
- Post-vacation Month 2-3:
  - Operator surface (drag-and-drop call-flow builder UI) as reusable WORKFLOW-MODULE-LIBRARY module
  - Knowledge-base-from-URL pattern wired to existing `nomic-embed-text` embeddings + Ollama Qwen 14b retrieval
  - Sovereign-LLM swap: Gemini Live → Ollama-based Phone-Front-Desk team (when GPU box workload justifies)
- Post-vacation Month 4+:
  - Generalize to COLG public-line front-desk (Church Module integration)
  - Extend to Counseling-intake handling-only line (booking + general info, WITH the `ALLOWED_LINES` discipline guaranteeing nothing PHI-bearing touches non-sovereign edges)

---

## 12. Decision record + rationale

Per `feedback-decisions-with-rationale`:

**Decision:** Do NOT adopt Quo (Sona) as the Incoming-Tab phone-call intake. BUILD on the existing Phase 0 phone-assistant plan (Twilio + Whisper STT + Gemini Live → sovereign LLM team). STEAL the named UX patterns (knowledge-base-from-URL, drag-drop call-flow builder, per-call summary inline, booking-link mid-call) into the Phase 0 + Phase 1 build.

**Why NOT Quo:**
1. TLC firewall structural fail — cloud-HIPAA ≠ sovereign-HIPAA, and the unified Incoming Tab cannot route a possibly-pastoral or possibly-clinical call into a non-sovereign edge.
2. Sovereign-LLM-teams-per-industry direction is the named PoeTech showcase; Quo is the inverse.
3. Per-user SaaS multiplier is the silent tax `COMMUNITY-FIRST-MISSION` Commitment 5 names as the failure mode for community-serving institutions.
4. Vendor lock-in on AI summaries + call-flow config + Sona knowledge base.
5. Unit cost stays flat / degrades; sovereign unit cost improves with scale.

**Why STEAL the ideas:**
Sona's product design surfaces patterns that are right for the Incoming Tab. They are achievable on sovereign infrastructure with no Quo dependency. Documenting them now means Phase 0 + Phase 1 build ships the right UX without reinventing the design.

**Why not just keep voicemail-only:**
The Phase 0 phone-assistant is already on the master plan (per `2026-06-01-app-services-promise-audit-and-master-plan.md`) — the question was always "build" or "rent." This review answers it: build, on the sovereign substrate already named.

**Future Claude sessions:** when the question of "should we use Quo (or any cloud-AI-receptionist SaaS)" comes up again, this report is the answer. Quo specifically; the same logic generalizes to Goodcall, Rosie, Numa, Aircall AI, RingCentral AI, Dialpad AI, and any other vendor-cloud AI receptionist that does not offer a sovereign / on-prem path. The bright lines are TLC firewall + sovereign-LLM-teams-per-industry + cost-discipline-with-growth.

---

## 13. Open questions for Darrell (only true judgment calls)

Per `feedback-always-now-viable-fix-source-dont-ask` (research-then-plan-then-validate, not ask-then-research), there are no judgment-required questions blocking the recommendation. Two validations Darrell can confirm at his convenience — not blockers:

1. **Confirmation that "Quo" in the source video is the same Quo / Sona this report identifies.** If the ad turns out to be a different product (Quo Capital, Quo Health, Quo Labs, or a newer "Quo" name), the product-identification section needs revision but the binding-filter logic (TLC firewall + sovereign-LLM-teams + cost-discipline + data-as-empowerment + sovereign-mesh tier) applies to any vendor-cloud-AI-receptionist regardless of name. The recommendation does not change.
2. **Phase 0 priority ordering.** The master plan in `2026-06-01-app-services-promise-audit-and-master-plan.md` lists the 7-ship priority order; Phase 0 phone-assistant sits in the post-vacation queue. Darrell's prior question (in `2026-06-01-session-state-snapshot.md`) was "go/no-go on the 6-8 week Twilio + Gemini Live + Whisper Phase 0 phone-assistant pilot for Poe Properties tenant-call." This research-review reinforces "go" and adds the stolen-from-Quo UX patterns to the spec. No new permission needed; this is research-validation per `feedback-research-first`.

---

## 14. Pairs with / cross-references

- `docs/00-foundations/_root/INTAKE-AND-FIT.md` — five-stage intake pipeline; Voice Worker is the existing phone-call capture
- `docs/00-foundations/_root/COUNCIL-CHAMBER.md` — pastoral-not-clinical bright line; TLC firewall in scope
- `docs/00-foundations/_root/COMMUNITY-FIRST-MISSION.md` — Commitment 4 (sovereign infrastructure) + Commitment 5 (serve-not-extract pricing)
- `docs/00-foundations/_root/DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md` — five architectural commitments + five anti-patterns
- `docs/00-foundations/_root/AI-FOUNDATION-INTERNAL-OPERATIONS.md` — sovereign substrate operates the system
- `CLAUDE.md` — TLC firewall hard line + auto-push-after-commit + the binding-rules layer
- `docs/99-session-notes/2026-06-01-session-state-snapshot.md` — Phase 0 phone-assistant go/no-go question
- `docs/99-session-notes/2026-06-01-app-services-promise-audit-and-master-plan.md` — master plan + 7-ship order
- `docs/99-session-notes/2026-06-02-consolidated-ai-work-processes-repos-skills-extract.md` Category C — Twilio (C1) at Tier 2; OpenAI Realtime / Gemini Live / Whisper (C2-C4)
- Memory `feedback-research-first` — binding-rule producing this report
- Memory `project-sovereign-mesh-mvp-pragmatism` — Tier label
- Memory `project-cost-discipline-with-growth-permission` — cost screen
- Memory `project-sovereign-llm-teams-per-industry` — showcase direction
- Memory `feedback-always-now-viable-fix-source-dont-ask` — research-then-plan-then-validate
- Memory `feedback-decisions-with-rationale` — decision record at section 12

---

## 15. Sources cited

- Quo product & pricing:
  - https://www.quo.com/
  - https://www.quo.com/sona
  - https://www.quo.com/product/ai/receptionist
  - https://www.quo.com/product/ai/voice-agent
  - https://www.quo.com/pricing
  - https://support.quo.com/core-concepts/administration/billing/pricing
  - https://www.quo.com/security
  - https://support.quo.com/core-concepts/administration/security-and-compliance
  - https://www.quo.com/blog/hipaa-compliant-call-recording/
  - https://www.linkedin.com/posts/gowithquo_big-news-quo-formerly-openphone-is-now-activity-7391517968314032128-O0Tf
- Third-party reviews of Quo (2026):
  - https://www.chatodyssey.com/ai-phone-number/quo-review-2026-ai-business-phone
  - https://baselynk.com/why-quo-formerly-openphone-is-the-best-phone-system-for-your-business-in-2026/
  - https://www.ringly.io/blog/openphone-pricing
  - https://www.ringover.com/blog/openphone-pricing-plans
- Twilio Voice pricing (sovereign-path substrate):
  - https://www.twilio.com/en-us/voice/pricing/us
  - https://www.twilio.com/en-us/pricing
- YouTube source video (returned `playabilityStatus=ERROR Video unavailable` in headless Chrome; no Google index match):
  - https://m.youtube.com/watch?v=CveaC6-l04M

---

**End of report.** Binding research-review per `feedback-research-first`. Recommendation: STEAL ideas, BUILD on Phase 0 sovereign substrate. Do NOT adopt Quo for the unified Incoming Tab. Open the door to a 90-day Quo-Starter bridge for the Poe Properties tenant-line ONLY if Phase 0 slips past Q1 2027.

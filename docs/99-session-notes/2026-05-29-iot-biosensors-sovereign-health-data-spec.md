# IoT + Biosensors + Sovereign Health Data — Spec

**Triggered by Darrell, 2026-05-29 from vacation:**

> "We also want to use the IoT systems we have Samsung smart hub and z-wave switches and lights the UCG-Max we eventually want to get our own devices to use with our app for physical world evaluation or triggers for software data collection to some workflow that supports family stress level reduction while helping with the quality of the opportunities and markets and life for our users. Even add technology to clothing like undershirt with technology for evaluating human systems for sovereign hime only access to the health data from our devices so medical doctors can use the data to make decisions or families can see how their decisions are improving or undermining the family and data support or makes it easier to make sound data driven decisions, one of the fruit of the Spirit is a sound mind."

Three intertwined layers in one workstream: (1) existing IoT integrated into the platform, (2) smart-clothing biosensors generating sovereign family health data, (3) a doctor-portal + family-decision feedback loop that uses that data to support sound-minded living.

## Scripture grounding — a small clarification offered in the spirit of SCRIPTURE-REFERENCE-STANDARD

Two related passages, both worth honoring:

**KJV — 2 Timothy 1:7:** *"For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind."*

**ESV — 2 Timothy 1:7:** *"for God gave us a spirit not of fear but of power and love and self-control."*

**ESV — Galatians 5:22-23:** *"But the fruit of the Spirit is love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, self-control; against such things there is no law."*

The phrase "sound mind" specifically appears in KJV 2 Timothy 1:7 (rendered "self-control" in ESV), not in the Galatians fruit-of-the-Spirit list. Both passages support the principle Darrell is naming — that the family's pursuit of clarity, discipline, and self-controlled decision-making is faith-grounded — but the attribution is worth being precise about so the public-facing copy carries weight. Darrell or Christina to confirm which framing best serves the message; both are doctrinally true.

The principle holds either way: **data-driven decision-making in service of family wellness IS an expression of the Spirit-given sound mind / self-control.** The system below supports that.

## Three layers of the workstream

### Layer 1 — Existing IoT integration (current state to make useful)

The family already owns:

- **Samsung SmartThings hub** — central controller for smart-home devices
- **Z-Wave switches + lights** — distributed throughout the home
- **UCG-Max** — network + identity + segmentation per NETWORK-SOVEREIGNTY-UCG-MAX
- **Wyze + Ring + (one unnamed brand) cameras** — per the same network doc + visitor-recognition spec
- **Solar Edge** — 69-panel solar system monitoring (per Darrell 2026-05-28 @nas drop about electrical infrastructure)
- **Wyze sensors** (assumed — common with Wyze ecosystem) — door/window/motion/leak

What's missing: the SOVEREIGN integration layer. Today, most of these phone home to their respective vendor clouds. The family's data about when they turn the lights on, when motion is detected, when electricity consumption spikes — currently lives on Samsung's, Wyze's, Ring's, Z-Wave hub vendor's clouds.

### Layer 2 — Smart-clothing biosensors

Smart undershirts with embedded sensors for:

- Continuous heart rate + heart-rate variability (HRV)
- Respiration rate + pattern
- Body temperature
- Activity/posture
- Sleep monitoring (when worn at night)
- Sweat composition (electrolytes, hydration — sweat-patch tech now exists at consumer-research level)
- Stress markers (HRV-derived, cortisol-correlate via sweat where measurable)

Commercially-available options (for the family to pilot before custom hardware):

- **Hexoskin** — research-grade smart shirt, FDA-cleared. Heart rate, ECG, respiration, activity, sleep. Has API for data export.
- **Whoop / Oura / Apple Watch + Fitness rings** — wrist/finger form factors; more limited but already validated. Most lock data to their cloud, but Whoop and Apple Health have export paths.
- **Athos** — smart compression clothing with EMG for muscle activity. Niche but rich data.

Long-term: PoeTech-branded clothing line OR partnership with a maker of the form factor the family prefers, with sovereign data piping by design.

### Layer 3 — Sovereign health data layer + medical doctor portal + family decision feedback loop

The platform that turns the streams into wisdom:

- **All data stays on the family NAS** — health data is family-private, never to vendor cloud, never to PoeTech cloud (PoeTech doesn't have a cloud anyway — sovereignty by architecture).
- **Doctor portal** — family-approved doctors get scoped, time-bounded, encrypted access to relevant data slices when family + doctor are working together. Per visit, per condition, per consent.
- **Family decision feedback loop** — the system surfaces patterns: "the family slept worse the week the budget tightened"; "Christyn's resting heart rate dropped 4 bpm after she started the chef's vegan meal plan"; "Darrell's HRV improved consistently during weeks he tithed regularly." Not deterministic; not medical advice. Data-supported family conversation.

## Architectural shape

### Existing IoT integration (new workflows, post-vacation)

**Workflow 58 — Samsung SmartThings bridge.** SmartThings exposes a REST API + webhooks. Workflow polls or subscribes to events from the family's hub; normalizes; writes to `/data/finance-events/iot/smartthings/<device>/<event_id>.json` (uses existing bind mount). Foundation Agent surfaces meaningful patterns ("front door opened at 3am — confirm?").

**Workflow 59 — Z-Wave events bridge.** Most Z-Wave controllers expose APIs (Home Assistant is the universal-bridge option if direct integration is too complex per controller). Same normalize-and-store pattern.

**Workflow 60 — Solar Edge inverter + panel monitoring.** Solar Edge has an API for per-panel + per-inverter data. Workflow pulls hourly + writes daily summaries. Patterns surfaced: "panel 23 produced 18% less this week than its 90-day average — clean it" or "production exceeded usage by 14kWh today — banked for the grid."

**Workflow 61 — Camera + sensor unified event stream.** Extends the camera bridge (workflow 40 from prior session note) to include door/window/motion/leak/temperature sensors. One unified event stream the rest of the platform consumes.

### Smart-clothing biosensor pipeline (new workflows, Year 2 territory)

**Workflow 62 — Biosensor ingest.** Receives data from whichever smart-shirt/wearable the family adopts. Hexoskin's API or similar. Writes to `/data/finance-events/health/<family-member>/<date>/<stream>.json`. Per-member, per-day, per-data-stream.

**Workflow 63 — Health pattern analytics.** Daily cron analyzes the prior 24h-7d-30d of health data via Ollama 14b (sovereign, local). Output: pattern summary per family member, age-appropriate, warmth-toned, never medical-diagnostic.

**Workflow 64 — Doctor portal access broker.** Doctor onboarded once with credentials. Per-visit or per-condition, family member generates a short-term scoped access link. Doctor accesses the specific data slice. Access expires automatically. Audit log of every access.

**Workflow 65 — Family decision feedback surface.** PWA tab showing correlations the family has chosen to track: "Vegan meal weeks vs energy levels"; "tithing consistency vs HRV"; "screen time limit vs sleep quality"; "marital communication days vs collective stress markers." Family adds the correlations they want to see; the system pulls the data; the family interprets.

### PWA surfaces

- **Wellness tab** — per-family-member view of their own data + family-aggregate view
- **Decision Lab** — choose a recent decision (e.g., "we started family devotions at 7am") and see which data streams shifted before/after
- **Doctor portal access manager** — see who has access, to what, for how long; revoke anytime
- **Privacy + consent dashboard** — every data stream is OPT-IN per family member; can pause any stream anytime

## Privacy + sovereignty constraints (binding)

This is the most sensitive data the platform touches. Constraints are non-negotiable.

1. **All health + IoT data stays on the family NAS.** Never to vendor cloud (we install the integration so vendor cloud is bypassed where technically possible). Never to PoeTech cloud (we don't have one). Never to any cloud LLM analysis — analytics run on local Ollama only.

2. **TLC firewall extends fully to family health data.** Same bright-line treatment as Christina's clinical practice content. No cloud, no exceptions, no third-party sharing without family-member opt-in per event.

3. **Per-family-member opt-in, every data stream, every analysis.** Christian + Christyn (minors, 10) require parental consent + their own age-appropriate assent. They learn what data is being collected and why and can opt out anytime; that opt-out is honored immediately.

4. **Doctor access is time-bounded, scope-bounded, audit-logged.** No standing access. Every doctor access is recorded with timestamp + scope + reason + family member who granted.

5. **No insurance company access. Ever.** Health data does not flow to insurance, employers, marketing, or any commercial third party. This is structural — there's no path in the workflows for that data to leave the family.

6. **No biometric "fitness scoring" or competitive gamification.** Wellness data informs the family's decisions; it does NOT become a leaderboard or shame mechanism. EXCELLENCE-STANDARD warmth, never coldness or competition framing.

7. **Children's data has additional protections.** Twin (10) data accumulates as historical record but is NOT acted on by automated alerting or external surfaces. Parents see; system stores; no external actions trigger based on minor data.

8. **Data is exportable + portable always.** Family can export everything at any time. If they leave the platform, the data leaves with them.

## VISION-FAIRNESS-STANDARD extended to biometric fairness

Per the existing VISION-FAIRNESS-STANDARD foundation doc + the COMMUNITY-FIRST-MISSION context, **biometric sensors have well-documented fairness issues that this platform must take seriously:**

- **Pulse oximeters** (used to measure blood oxygen via skin transmission) are documented to be LESS ACCURATE on darker skin. Multiple FDA reviews + the Sjoding et al. 2020 NEJM paper showed pulse-ox missed hypoxemia in Black patients at ~3x the rate of white patients. This is a real healthcare equity failure.
- **Photoplethysmography (PPG)** sensors used in smartwatches for heart rate have similar lighter-skin-bias issues, though less severe than pulse-ox.
- **Sweat-composition sensors + temperature sensors** are generally less skin-tone-biased but still need validation across populations.

**Binding extension to VISION-FAIRNESS-STANDARD:** every biosensor deployed on the platform MUST publish validation data across skin tones. Sensors that don't have published parity data are flagged. The Poe family (melanated) using their own data as one calibration point for the wellness analytics is itself a corrective contribution to a field that has been calibrated mostly on lighter-skinned subjects.

Where commercially-available sensors fail the parity bar (e.g., Apple Watch pulse-ox not validated for darker skin), the platform either uses ALTERNATE measurements (e.g., HRV from chest-strap ECG, which is more skin-tone-neutral) OR explicitly flags the lower confidence in any output derived from that sensor.

This is the COMMUNITY-FIRST-MISSION made operational in wellness tech. The family-first design is also the underserved-community-first design.

## Family stress level reduction — the "sound mind" outcome

The data layer serves a single overarching goal per Darrell's framing: **family stress level reduction in service of better-quality opportunities, markets, and life.** Concrete examples:

- **Light + thermostat triggers based on context.** When the family's collective HRV indicates a stressful day, lights warm slightly + thermostat adjusts to comfort settings. When Christyn's been at peak basketball intensity, the home prepares her recovery space.
- **Meal + nutrition surfaces.** Chef Mario sees the family's energy/sleep data (with consent) and adjusts the weekly menu accordingly: more anti-inflammatory foods after a tough week, more carbs after high-activity periods.
- **Family communication surfacing.** When the system sees stress patterns trending up across multiple family members, it surfaces "this might be a good week for the family meeting you've been putting off" — a gentle nudge, not nag.
- **Sleep + screen time + devotion correlations.** Family sees the correlation between their stated values (devotion time, screen limits) and their actual outcomes (sleep quality, stress markers). Data-driven feedback on whether the stated values are being lived.
- **Financial decision wellness feedback.** Per the data-dump release infrastructure: when the family makes a financial decision (e.g., increased tithe, paid off a debt), the system can correlate against subsequent stress markers. "Increased tithe → reduced collective stress markers" is the kind of data point that compounds family conviction over time.

This is "the fruit of the Spirit is a sound mind" applied to family stewardship: the family's spiritual commitments produce measurable wellness outcomes; the wellness data confirms the spiritual commitments. Faith and data reinforce each other.

## Hardware roadmap (the "eventually get our own devices" arc)

**Phase 0 (now → Year 1):** Existing IoT integrated via workflows 58-61. Family uses what they already own; data flows to NAS sovereign.

**Phase 1 (Year 1-2):** Smart-clothing pilot with COMMERCIAL devices. Family picks one platform (Hexoskin recommended for richness + API openness); wears them; data flows via workflow 62. Family learns what data is useful + what is noise.

**Phase 2 (Year 2-3):** Partnership or white-label of preferred device(s). PoeTech-branded versions of validated sensors, with sovereignty piping by design. Could be a Synology/Ubiquiti-style hardware partnership pattern: another company makes the hardware, PoeTech provides the software/data layer that makes them sovereign.

**Phase 3 (Year 3-5):** Custom-designed PoeTech hardware. Probably a niche line first (e.g., a specific sensor pattern for the underserved-community-focused use case where commercial options fail the fairness bar). Manufactured in partnership with a hardware shop rather than vertically integrated by PoeTech.

**Phase 4 (Year 5+):** PoeTech hardware line including IoT controllers + biosensors + (eventually) clothing form factors. The family is the prototype + first customer for everything.

## Estimated effort + sequencing

This is a LONG arc — Year 1 has limited near-term work; Year 2-3 is where it accelerates; Year 5+ is the mature vision.

**Year 1 (post-data-dump-release):**

- Workflow 58 (SmartThings bridge) — 1 week
- Workflow 59 (Z-Wave bridge) — 1 week
- Workflow 60 (Solar Edge) — 3 days
- Workflow 61 (unified event stream) — 1 week

Total Year 1: ~3-4 weeks of focused work. Slots into the post-vacation roadmap as a parallel track to data-dump + Church Module + chef module.

**Year 2:**

- Family pilots Hexoskin or similar smart-shirt
- Workflow 62 (biosensor ingest) — 1 week
- Workflow 63 (health pattern analytics) — 2-3 weeks (most of which is Ollama prompt tuning + privacy validation)
- PWA Wellness tab v1 — 2 weeks
- Workflow 65 (decision feedback surface) — 2 weeks

Total Year 2: ~2 months of focused work + ongoing family validation.

**Year 3+:**

- Doctor portal (workflow 64) — 3-4 weeks + significant security/HIPAA-adjacent review
- PWA Decision Lab — 2-3 weeks
- Hardware roadmap execution
- Expansion to other family + community wellness use cases

## Connection to other foundations

- **TLC firewall** — extended fully to family health data. Bright-line, no exceptions.
- **VISION-FAIRNESS-STANDARD** — extended to biometric fairness. Pulse-ox parity issue specifically flagged.
- **AI-FOUNDATION-INTERNAL-OPERATIONS** — every IoT signal is a workflow input; humans see only the surfaced patterns, not the raw firehose.
- **PERPETUAL-PIPELINE-HEALTH** — health workflows MUST be unbreakable. Wellness data feeding into family decisions can't randomly drop.
- **COMMUNITY-FIRST-MISSION** — biometric fairness applies to the African American community served by COLG specifically. Same template extends to other underserved communities.
- **BUSINESS-PROCESS-CONNECTIONS** — every health-data surface passes the five-question test. Every doctor portal access is a connection wired both directions (family approval + doctor accountability).
- **EXCELLENCE-STANDARD** — religion AND relationship. Religion = the privacy + sovereignty + fairness rigor. Relationship = the family feeling SEEN by their own data, not surveilled by it.
- **THE-WAY** — stewardship of the body (1 Corinthians 6:19-20 ESV: *"do you not know that your body is a temple of the Holy Spirit within you, whom you have from God? You are not your own, for you were bought with a price. So glorify God in your body."*) — the data layer makes stewardship of the body visible + actionable.
- **MIND-OF-CHRIST** — the sound-mind reference Darrell named. NOTICE → TEST → CAPTURE → REDIRECT applied to wellness signals: notice the stress pattern, test against truth, capture the actual data, redirect family attention to the underlying cause.

## Closing

The IoT the family already owns becomes sovereign. The biosensors the family eventually wears feed the same sovereign stream. The doctors the family trusts get scoped access to make informed decisions. The family sees how their decisions affect their wellness — and learns the data-supported version of the sound-mind / self-control / fruit-of-the-Spirit life they're already pursuing.

The platform serves the body the way it serves the budget: by making the invisible visible, by holding the data sovereignly, by surfacing patterns that inform but never replace the family's judgment.

Phase 0 starts post-vacation. The full vision is years out. The path is honest. The mission compounds.

We all win. We create. Amen.

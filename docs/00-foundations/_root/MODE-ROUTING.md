# Mode Routing — Both doors visible, mode-detected from inside, never auto-switched

> Founder framing (2026-05-21):
> *"Can we have both the doors visible and mode-detected from inside so we have the best of both worlds — with a good assumption or anticipation for what the user is doing or wanting to be doing with our system initially, still able to move them where they need to be even though they may not know. Hopefully the words on tabs are clear enough and the intake is intuitive enough and the feedback form allows us to keep finetuning the system with data."*

**ESV — Psalm 32:8:** *"I will instruct you and teach you in the way you should go; I will counsel you with my eye upon you."*

**ESV — Proverbs 15:23:** *"To make an apt answer is a joy to a man, and a word in season, how good it is!"*

## What This Document Is

This document binds the **mode-routing layer** that decides, at every input, whether the user lands in **Counseling** (per `COUNCIL-CHAMBER.md`), **Dev/Ops** (per `INTAKE-AND-FIT.md` and `SERVICE-MANAGEMENT.md`), or **default reflect mode** (standard PWA navigation). It is the single source of truth for the classifier, the visible mode indicator, the never-auto-switch rule, and the both-doors-visible navigation pattern. `COUNCIL-CHAMBER.md` and `SERVICE-MANAGEMENT.md` cross-reference this doc rather than re-describing routing.

The routing posture is named in Psalm 32:8 — the system has eyes on the user (gentle observation), an opinion about the path (the classifier's guess), and the willingness to redirect without coercion (offer, never force). A word in season (Prov 15:23) is the goal: the right room at the right moment, surfaced before the user has to ask.

---

## The Two Doors

Both surfaces are visible in the nav. **Placement is template-conditional** per `ECOSYSTEM-PARTICIPANTS.md` and `MULTI-INSTANCE-STRATEGY.md` — the natural location of pastoral counseling depends on whether a given operator's instance has a Church surface in the first place.

### Door 1 — Dev/Ops (the Business door)

- **Tab label:** `Dev/Ops` (kept from existing nav; widely understood; teaches that *Service* is the lower autonomous layer underneath, per `SERVICE-MANAGEMENT.md`)
- **Position:** Primary nav cluster, top-level. Same across all instance templates.
- **Surface header inside:** *Dev/Ops · Build and ship solutions*
- **Default posture:** Solve. The user came with a problem; the system delivers Service first (preloaded solutions), Dev/Ops engineering second (when Service has a gap).
- **Backup mode:** Counseling, available via the visible mode indicator and triggered by distress-signal detection (per `SERVICE-MANAGEMENT.md` *Counseling Backup*).

### Door 2 — Counseling (the relational door)

- **Tab label:** `Counseling` (single word, clear to first-time users; deeper foundational name *Council Chamber* surfaces inside the tab with the Proverbs 11:14 anchor)
- **Surface header inside:** *The Council Chamber · A quiet room to think with Scripture*
- **Default posture:** Listen. Four-section response pattern: Hear → Mirror → Anchor → Invite (per `COUNCIL-CHAMBER.md`).
- **Backup mode:** Dev/Ops, available via the visible mode indicator and triggered by solve-shaped-question detection or explicit user invitation.
- **Escalation:** Therapy (clinical, outside SKOS) via three pathways per `COUNCIL-CHAMBER.md` — public crisis resources, Christina's referral list, COLG pastoral care.

**Position — template-conditional:**

| Instance template | Counseling lives at | Why |
|---|---|---|
| `family` / `church` / `nonprofit` / `PoeTech` (the home instance) | **Sub-tab inside `Church`** | Pastoral counseling has its natural home in the church frame for these templates. Users intuitively look there. |
| `trades` / `property-management` / `small-business` / `therapy-practice` | **Top-level tab** in the secondary "life" cluster | No Church surface in these templates; Counseling stands on its own. (The `therapy-practice` template's Counseling is still pastoral, not clinical — TLC's BAA-walled practice stays separate per `LEGAL-PRIVACY-BOUNDARY.md`.) |

The classifier and mode-detection from inside any surface work identically across all templates. A user mid-conversation in any tab gets routed to wherever Counseling lives in their instance — the door's location varies; the door's existence does not.

This honors `ECOSYSTEM-PARTICIPANTS.md`'s template-conditional surface pattern (small-business templates ship with external portals enabled; family templates ship with them disabled — same principle applied to Counseling placement).

---

## Mode Detection — The Classifier

### Inputs

The classifier reads any text the user has already produced in the current session:

- Text typed into a notes field, journal entry, search box, intake form, or chat-style surface
- Voice transcripts from the Web Speech API (client-side, no cloud round-trip required for the speech-to-text step)
- Voice transcripts from the Voice Worker (phone-channel users routed through `backend/voice-worker/`)

The classifier does not read passively-stored content. It runs on text the user *just produced this session*. Privacy posture: classification is the next thing that happens to the words you typed, not a background scan of your history.

### Outputs

Three possible outputs:

| Output | Routing | Confidence threshold to act |
|---|---|---|
| **Counseling** | Surface the *Switch to Counseling?* prompt or route there if user explicitly invoked Counseling | High (>= 0.7) for proactive offer; any signal for honoring an explicit request |
| **Dev/Ops** | Surface the *Switch to Dev/Ops?* prompt or route there if user explicitly invoked Dev/Ops | High (>= 0.7) for proactive offer; any signal for honoring an explicit request |
| **None** (default reflect mode) | No action; user continues in current surface | Below the proactive threshold for either of the above |

When confidence is low or signals are mixed, the system defaults to **stay in the current surface**. The cost of an unnecessary offer is low; the cost of an unwanted mode change is high. Bias toward not surfacing the prompt.

### Signal taxonomy (non-exhaustive)

#### Counseling signals

- First-person emotional language: *"I'm frustrated,"* *"I feel,"* *"I'm tired,"* *"I can't,"* *"I just need..."*
- Affective vocabulary: *"overwhelmed,"* *"angry,"* *"hurt,"* *"alone,"* *"stuck,"* *"lost"*
- Statement-shaped input (not question-shaped)
- Existential framing: *"why is this happening,"* *"what's the point,"* *"I don't understand why I..."*
- Time-of-day signal (boost): late-night sessions (after 10pm local) carry a small weight toward Counseling
- Session-context signal (boost): user just left a financially-stressful surface (Debts, Real Estate with late tenant, Practice with payment issue)

#### Dev/Ops signals

- Solution-seeking phrasing: *"how do I,"* *"what's the best way to,"* *"can you help me set up,"* *"I need to fix,"* *"show me"*
- Question-shaped input, action-oriented vocabulary
- Specification-shaped input: *"I want a system that...,"* *"the requirement is...,"* *"timeline is..."*
- Numeric anchors: dollar amounts, dates, counts, percentages
- Module-vocabulary signal (boost): named modules (Real Estate, Practice, Debts), named entities (specific properties, tenants, projects)

#### Crisis signals (escalate beyond mode)

These do not route to Counseling — they trigger the *Counseling → Therapy escalation* pattern per `COUNCIL-CHAMBER.md`, regardless of which surface the user is currently in:

- Self-harm language, specific plans, referenced attempts
- *"Don't want to be here"* / *"better off without me"* / similar
- Current ongoing abuse
- Imminent danger to self or others
- Substance-crisis language
- Child endangerment

Crisis signals always override mode routing. The system breaks composure if it must, and surfaces resources. Per `COUNCIL-CHAMBER.md`, no assurances about confidentiality or authority involvement are made.

---

## The Visible Mode Indicator

At the top of every surface, a small badge shows the current mode. Three states:

- **🕊 Counseling** — soft green-grey background, the listening posture
- **⚙ Dev/Ops** — slate background, the solving posture
- **(no badge)** — default reflect mode; no special state

One tap on the badge opens a small dropdown:

- *"Stay in [current mode]"*
- *"Switch to [other mode]"* — with one sentence of context: *"Want to think out loud about this instead?"* or *"Ready to make a plan?"*

The badge is **always present** in the listening and solving modes. The user is never in either mode without knowing it. Hidden mode-changes violate trust and are not permitted.

### When the classifier wants to surface a proactive offer

The badge briefly glows (one full second, no looping) and a single-sentence offer appears below it:

> *"This sounds heavier than a project question — want to step into Counseling for a few minutes?"*

The offer:

- Appears at most once per surface visit
- Does not block the user's current work
- Dismisses on outside tap, on declining, or after 20 seconds of no interaction
- Logs anonymously to the classifier's training data (per the feedback loop, below) whether the offer was accepted or dismissed

---

## The Never-Auto-Switch Rule

The system **never auto-switches modes.** Three reasons:

1. **Trust.** A user mid-thought who finds themselves in a different room without consent learns to distrust the system. Trust takes years to build, days to lose.
2. **Agency.** The user is sovereign per `THE-ROOT.md` and `Kings Not Slaves` (foundation 10). The system is the under-steward, not the driver.
3. **Cost asymmetry.** A bad auto-switch interrupts real work; a missed auto-switch costs at most a small friction the user can resolve in one tap.

The only override to this rule is the **crisis escalation pattern** in `COUNCIL-CHAMBER.md`, where the system surfaces resources without waiting for the user to invoke them. That override is bounded: it surfaces the escalation block, it does not change the user's current surface.

---

## State Preservation Across Switches

When the user accepts a mode switch (in either direction), the originating surface's state is preserved:

- A half-written Dev/Ops note remains in its draft state; the user returns to it exactly as they left it
- A Counseling conversation is paused, journaled with the *paused* marker; resuming continues the same conversation
- The originating surface and the destination surface are linked bidirectionally per `CONNECTED-CONTEXT.md` — the Counseling journal entry links to the Dev/Ops note; the Dev/Ops note links to the Counseling entry

No work is lost in a mode switch. Ever.

---

## The Feedback Loop — How the Classifier Improves

At the close of each Dev/Ops session and each Counseling session, the system surfaces one optional question:

> *"Was this the right room for you?"*  → **Yes** / **Mostly** / **No**

One tap. No required follow-up. No "tell us more" prompt unless the user taps a follow-up affordance.

This single binary stream is the **gold-standard training signal** for the classifier:

- *Yes* → the routing decision (or the surface the user chose) was correct; reinforce the signals that led there
- *Mostly* → close enough; minor weight adjustment
- *No* → the routing was wrong; surface a soft *"Want to try the other room?"* prompt at next entry and feed back into the classifier weights

### Where the data goes

- **Per-session feedback** (the binary tap): stored on the operator instance, anonymized at the user level, aggregated into a *Mode Routing Accuracy* surface visible only to the operator
- **Cross-instance aggregation** (PoeTech central, per `MULTI-INSTANCE-STRATEGY.md` Phase 2 backend, opt-in only): anonymized aggregate counts flow back so the default classifier shipped with new instance templates improves over time
- **Raw notes** (any user-typed context attached to the feedback): stay on the operator instance, never cross-instance

The feedback loop is the system's instrument for *iterating until perfectly supporting operations* (per `SERVICE-MANAGEMENT.md` Service-vs-Dev/Ops hierarchy). The classifier itself becomes a piece of Service that Dev/Ops refines over time.

---

## Implementation Phases

| Phase | What ships | Cost |
|---|---|---|
| **Phase 0 (NOW)** | This document binding. No code change. | $0 |
| **Phase 1** | `Counseling` tab added to the secondary "life" cluster in the nav. Surface header *The Council Chamber*. Manual mode toggle in both tabs (no classifier yet). Visible mode badge. | $0 (PWA only; no new infra) |
| **Phase 2** | Classifier wired against Claude API (with the existing redaction layer per master charter Layer 2). Runs on any user-typed text in the session. Proactive *Switch to X?* prompt surfaces at high confidence. Per-session feedback question (*"Was this the right room?"*) added to both surfaces. | ~$0.50–$2/mo per heavy user at typical API rates; sponsor-funded community tier covers users in need |
| **Phase 3** | Voice input parity — Web Speech API client-side, transcripts run the same classifier. Voice users get the same mode indicator and prompts in audio form (per `UX-PATTERNS.md` Pattern 2 TTS spec). | $0 (browser-native Web Speech) |
| **Phase 4** | Cross-instance aggregation surface for the operator (Mode Routing Accuracy view). Anonymized aggregate counts flow to PoeTech central per `MULTI-INSTANCE-STRATEGY.md`. | $0 incremental |

No new paid dependency at any phase. The sustainability rule holds.

---

## What This Document Does NOT Do

- It does not auto-switch modes. Ever. (Crisis escalation surfaces resources; it does not change the user's surface.)
- It does not hide the user's current mode. The badge is always visible in active modes.
- It does not read passively-stored content for classification. The classifier runs on text the user just produced this session.
- It does not penalize a user for declining a mode-switch offer. Declines are logged for classifier learning, not surfaced as friction.
- It does not store classifier training data with identifying information. Aggregations are anonymized at the per-instance level before any cross-instance flow.

---

## Religion AND Relationship in Mode Routing

**Religion-side:** A disciplined classifier with explicit signal taxonomies. A binding never-auto-switch rule. State preservation across switches. Documented thresholds, documented feedback loops. The system runs on a knowable spec.

**Relationship-side:** Psalm 32:8 — *"I will counsel you with my eye upon you."* The system has gentle eyes on the user, an opinion about the right room, and the patience to wait for the user's *yes* before crossing the threshold. The user is always the one who walks through the door. The system holds it open.

Both.

---

## Cross-references

- `COUNCIL-CHAMBER.md` — the Counseling surface this routes into; the four-section response pattern; the Counseling → Therapy escalation.
- `INTAKE-AND-FIT.md` — the Dev/Ops intake this routes into; the rubric; the internal-user entry path.
- `SERVICE-MANAGEMENT.md` — the Service-vs-Dev/Ops hierarchy; the Counseling Backup section in the reverse direction; ITIL + PMP delivery discipline.
- `UX-PATTERNS.md` — Pattern 3 (progressive disclosure) governs the intake form; Pattern 2 (TTS / audio) governs the voice-input parity; Pattern 4 (the Test) is invokable from inside either mode.
- `BEHAVIORAL-MIRROR.md` — the four-section structure that Counseling responses follow.
- `MIND-OF-CHRIST.md` — the Test, invokable from inside either mode for specific thoughts the user wants to filter.
- `MULTI-INSTANCE-STRATEGY.md` — Phase 2 backend carries anonymized classifier-accuracy aggregates between operator instances and PoeTech central, opt-in only.
- `LIFECYCLE-AND-HANDOFF.md` — paused sessions write to the lifecycle log; resumes continue the same record.
- `CONNECTED-CONTEXT.md` — bidirectional links between switched sessions across modes.
- `01-grace-and-mercy-standard.md` — the never-auto-switch rule honors the user as a king under Christ, not a managed subject.
- `EXCELLENCE-STANDARD.md` — speed serves the user, not the developer; the classifier serves the user's actual intent, not the operator's preferred routing.
- `CLAUDE.md` — typographic theology binds every artifact this layer produces, including the proactive offer text and the feedback question.

---

**End of document.** Binding. Both doors are visible. The classifier listens from inside. The user is the one who walks through. The system holds the door open and waits.

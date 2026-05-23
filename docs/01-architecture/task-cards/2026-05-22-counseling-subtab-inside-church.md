# Task card — Counseling sub-tab inside `Church.jsx` (voice + text + AI; non-therapy pastoral; confidential)

**Date:** 2026-05-22 (revised 2026-05-22 with founder scope expansion: voice IN, AI IN, TLC handoff via Practice-tab pattern) · **Issued by:** Cowork → Claude Code · **Status:** open · **Depends on:** `feat/extract-church` (commit `6ae7c6c`, PR #1) landing on `main`. Do NOT start until `app/src/components/Church.jsx` exists on `main`.

---

**Foundation rules that apply:**

- `/CLAUDE.md` — typographic theology bindings (Yahweh / Jesus / Holy Spirit / Father / Son capitalized, pronouns for God capitalized; the adversary lowercase). Read first.
- `/docs/01-architecture/AGENT-WORKFLOW.md` — task-card discipline, lint + build gates (lines 171–184), tool boundaries on the monolith (lines 134–167). The new sub-tab UI lives in `Church.jsx`, which is small — Edit/Write is fine there. Any monolith touches (state plumbing, AI helpers) follow the splice rule.
- `/docs/00-foundations/_root/THE-HOLY-SPIRIT-INTEGRATION-WORLDVIEW.md` — **the worldview spine; the lens this card is read through.** The AI's pastoral-response framing — its claim that the King is the relationship and the receiving is fruit, its insistence that the first death is the doorway and not an upsell — derives from this foundation. The two binding drift tests below (the **relationship-or-the-receiving test** and the **first-death test**) come from this doc and are wired into the AI prompt + acceptance criteria.
- `/docs/00-foundations/_root/THE-ROOT.md` — the human as Sovereign temple, repentance as framework-correction, abiding as a learned skill. Identity-in-Christ language in the AI's responses is anchored here. The disclaimer-anchor truth *"the reflection corrects the walk, not the worth"* lives in the sibling Mirror doc and reads naturally with this foundation.
- `/docs/00-foundations/_root/BEHAVIORAL-MIRROR.md` — **the operational shape of the AI's response when a user reflects their situation back.** The four-section sequence **DATA → TRUTH → IDENTITY → INVITATION** is the canonical name for the pattern the AI follows; `COUNCIL-CHAMBER.md`'s Hear → Mirror → Anchor → Invite is the same sequence adapted to dialog (Council Chamber line 70: *"the same four-section structure that `BEHAVIORAL-MIRROR.md` binds for diagnostic surfaces, adapted to dialog"*). The card uses both names interchangeably; the prompt template implements one sequence.
- `/docs/00-foundations/_root/COUNCIL-CHAMBER.md` — **the binding spec for this surface.** The Bright Line section (pastoral, not clinical), the four-section response posture, the three escalation pathways, the crisis-resources always-on default. The header copy *"The Council Chamber · A quiet room to think with Scripture"* and the first-session bright-line statement come verbatim from this doc. Phase 1 + Phase 2 + Phase 3 of `COUNCIL-CHAMBER.md` (text + classifier + voice + Claude API with redaction) are all in-scope for this card per founder direction (collapsed from the three-card sequence the original card draft proposed).
- `/docs/00-foundations/_root/MODE-ROUTING.md` — Counseling lives **as a sub-tab inside Church** for this repo's home instance (founder-confirmed; multi-template placement is permanently out of scope for this card). Visible mode badge (🕊 Counseling, soft green-grey). The never-auto-switch rule.
- `/docs/00-foundations/_root/LEGAL-PRIVACY-BOUNDARY.md` — the HIPAA fence between this surface (no PHI, ever) and TLC Therapy Solutions LLC (Christina's HIPAA-walled clinical practice). Held strictly. **Clinical records already live in Therapy Notes** (the EHR Christina uses for licensed work, outside the SKOS PWA) — that is the HIPAA-grade surface. The Counseling sub-tab is deliberately *not* a clinical record and *not* HIPAA-grade; it is "as protected as possible" within a pastoral, non-clinical scope. Confidentiality of pastoral conversation content is a separate, bounded concern surfaced as an open question below — Christina must decide before this card executes, with the understanding that "HIPAA-grade" is off the table (Therapy Notes already covers that).
- `/docs/00-foundations/_root/SCRIPTURE-REFERENCE-STANDARD.md` — ESV first; KJV / NIV / AMP / Strong's as the rubric directs. Every verse the AI offers in response must follow this citation pattern, and grounded against an authoritative source (see open question on scripture sourcing).
- `/docs/00-foundations/_root/IDENTITY-ROLES-AUDIT.md` — conversations created in this surface must attribute to the active user profile; no anonymous mutations (subject to the confidentiality answer).
- `/docs/00-foundations/_root/EXCELLENCE-STANDARD.md` — religion AND relationship. The disclaimer, the bright line, and the scripture grounding are religion. The warmth of the AI's four-section response posture is relationship.
- `/docs/00-foundations/_root/SITUATIONAL-PEACE.md` — the surface must reduce noise. The AI does not interrupt, does not push, does not interpret prophetically; the user sets the pace.
- `/docs/00-foundations/_root/ACCESS-TO-THE-HUMAN-MIND.md` — the response-tuning source for what scripture says about influence on the mind; the AI's tone is anchored here, not in pop-psychology framings.

---

**Purpose framing:**

This sub-tab is the SKOS PWA's **non-therapy pastoral counseling** room and, equally importantly, a **preparation tool for pastoral care** — a place where a believer can think through a situation with biblical perspective *before* they sit down with their assistant pastor or pastor, so they arrive at that human conversation as preinformed and articulate as possible. A believer can speak or type into it; an AI responds in a pastoral, scripture-grounded posture (Hear → Mirror → Anchor → Invite, per `COUNCIL-CHAMBER.md`) **before** the situation rises to a level that warrants either pastoral attention or licensed clinical care. Many situations — frustration with a tenant, weariness from a hard week, a question about how Scripture speaks to a recurring pattern — can be thought through here in confidence and resolved without ever needing a third party. For situations that need the next step:

- **Pastoral care** — the AI's job is to help the user articulate, explore, and surface relevant Scripture so they can bring a well-formed question to a human pastor. The AI does **not** deliver final pastoral judgment; it prepares the user for that conversation.
- **Licensed clinical care** — for situations that cross the line into clinical territory, the surface routes the user to **TLC Therapy Solutions** using the exact pattern already established in the Practice tab.

The room is the first door. The pastor is the next one. TLC is the door beyond that. The AI holds them all open without pretending to be any of them.

**Free tier (Foundation) — available to everyone.** The Counseling sub-tab and its AI conversations ship as a **Foundation-tier (free)** feature, accessible on every tier including the free tier per founder direction (2026-05-22). This is consistent with the "sponsor-funded community tier covers users in need" line in `COUNCIL-CHAMBER.md` line 190. No tier gate is added to the Counseling sub-tab in this card.

**Parent module — Spiritual Life · The Godhead Study Platform.** The Counseling sub-tab is a surface *of* the Spiritual Life module per `THE-HOLY-SPIRIT-INTEGRATION-WORLDVIEW.md`: that foundation doc explicitly names itself as *"The intellectual spine of the Spiritual Life module."* The module is currently catalogued in `app/src/components/About.jsx` (the `<ModuleCard moduleKey="spiritual" status="vision">` block) with the features list including *"family prayer journal · scripture study plans · ministry calendar"* — Counseling's pastoral conversation surface is the first concrete sub-tab of that module to ship. UI-wise, Counseling lives inside Church per `MODE-ROUTING.md` lines 38–48 (home instance placement); architecturally, it belongs to Spiritual Life. A follow-up card will surface that parentage in-product (e.g., a small *"part of Spiritual Life"* eyebrow) once additional Spiritual Life surfaces ship; for now, the parentage is documentary, not visible UI.

**Non-clinical framing — Therapy Notes is the HIPAA-grade space, this is not.** Clinical records — diagnoses, treatment plans, session notes for licensed clinical work — already live in **Therapy Notes** (the EHR Christina uses outside the SKOS PWA). That is the HIPAA-grade surface for her practice, and nothing here should be confused with or routed through that system. The Counseling sub-tab is "as protected as possible" within reasonable engineering effort, but it is *deliberately not* HIPAA-grade and *deliberately not* a clinical record. This framing informs:

- **The disclaimer copy** — must make clear that the Counseling room is pastoral conversation, not clinical care, and that clinical records live elsewhere.
- **The confidentiality boundary** — Christina answers open question #1 below within this constraint. "HIPAA-grade" is off the table; the choice is among non-clinical privacy postures (in-memory only, local-only, encrypted-at-rest, or another scheme Christina names).
- **The data shape** — no PHI fields, ever. No diagnosis, no treatment, no medication, no provider IDs. If a user's situation crosses into that territory, the AI routes them to TLC; nothing crosses into the SKOS data layer.
- **The AI's response template** — must not adopt clinical authority, must not generate anything that resembles a clinical note, must not log conversation content in a way that could later be mistaken for a treatment record.

---

**What to do:**

Add a **Counseling sub-tab** inside the existing `Church` component (`app/src/components/Church.jsx`), implementing a voice-and-text, AI-backed, confidential Council Chamber per `COUNCIL-CHAMBER.md`. The sub-tab supports:

- **Voice input** (Web Speech API client-side or comparable; see open question on mechanism) — transcribes to text, then handled identically to typed input.
- **Text input** — same conversation surface.
- **AI responses** — pastoral, scripture-grounded, in the four-section posture (Hear → Mirror → Anchor → Invite). Every scripture offered renders per `SCRIPTURE-REFERENCE-STANDARD.md` (ESV first). Grounding source for citations is an open question (see below) — the card does NOT ship a guess; it ships against Christina's chosen source.
- **Confidentiality by design** — the exact storage and transmission posture is an open question Christina must answer (see below). The card does NOT ship a guess on this; it ships the conversation UI with the storage layer gated on her answer. Implementation order: surface first, persistence last, with persistence wired only after the confidentiality answer is on paper.
- **The bright-line disclaimer** — non-therapy pastoral counseling only. The words *therapy / therapist / clinical / diagnose / diagnosis / treatment / patient / client* are banned from the pastoral copy and appear only inside the TLC referral surface.
- **TLC Therapy Solutions handoff** — mirror the Practice tab's integration banner (see "TLC handoff: mirror Practice" below). This answers the prior card's open question on reach mechanism.
- **Always-on crisis resources** — 988, Crisis Text Line, NDV Hotline, NAMI HelpLine per `COUNCIL-CHAMBER.md` lines 129–138.

**This is non-therapy pastoral counseling only.** The surface does not provide, simulate, advertise, or imply clinical therapy. AI responses stay inside the four-section pastoral posture; they do not diagnose, do not propose treatment plans, do not adopt a therapeutic modality.

---

**Files involved:**

- `app/src/components/Church.jsx` — add a two-tab sub-navigation at the top of the Church surface: **Home** (current Church content, untouched) and **Counseling** (new Council Chamber sub-surface). Render one or the other based on a `useState` sub-view selector.
- `app/src/components/Counseling.jsx` — **new file.** Default-exported component containing the Council Chamber sub-surface (mode badge, header, disclaimer, conversation transcript with text + voice input, four-section AI responses, TLC referral banner, crisis resources). Imported by `Church.jsx`.
- `app/src/lib/councilChamberLLM.js` — **new file (gated on AI model open question).** Pure functions wrapping the Claude API call: build prompt, parse four-section response, return structured `{ hear, mirror, anchor, invite, scriptureRefs }`. Lives as a leaf util per `MODULAR-EXTENSIBILITY.md` so future surfaces (e.g., a Test invocation from inside Counseling) can reuse it.
- `app/src/lib/councilChamberVoice.js` — **new file (gated on voice mechanism open question).** Pure functions wrapping the speech-to-text path: `startListening`, `stopListening`, `onTranscript`. Defaults to Web Speech API client-side; swap point if Christina chooses a different STT.
- `app/src/poe-financial-mvp-v28.jsx` — light touch:
  1. Add `councilChamberConversations: []` to the initial `data` state object (near `prayerRequests: []` at line ~290). **Gated on the confidentiality answer** — if Christina chooses "not stored at all," this field is not added; if "stored locally only," it is added; if "stored encrypted," an encryption helper precursor card lands first.
  2. Add CRUD helpers next to the prayer-request helpers (line ~1011): `addCouncilChamberConversation`, `appendCouncilChamberMessage`, `updateCouncilChamberConversation`, `deleteCouncilChamberConversation`. Same shape as `addPrayerRequest` / `markPrayerRequestSent` / `deletePrayerRequest`.
  3. Extend the `<Church …/>` call site at line ~1369 to pass the new state slice and callbacks as props.
  4. Add an `Array.isArray` guard in the parsed-data merger near line ~803 for `councilChamberConversations`.

Per `AGENT-WORKFLOW.md` lines 138–142, single-line edits to the monolith are Edit/Write-safe. Multi-region or deep mid-file edits use the PowerShell splice pattern.

---

**Conversation data shape (provisional; gated on confidentiality answer):**

```js
{
  id: `cc-${Date.now()}`,
  createdAt: ISO string,
  updatedAt: ISO string | null,
  topic: short user-supplied title (free text, optional),
  messages: [
    {
      role: 'user' | 'assistant',
      content: string,
      source: 'text' | 'voice',         // user messages only; assistant always 'text'
      timestamp: ISO string,
      sections?: {                       // assistant messages only
        hear: string,
        mirror: { text: string, scriptureRefs: [{ ref: string, translation: 'ESV', text: string }] },
        anchor: string,
        invite: string,
      },
    },
  ],
  mode: 'council-chamber',              // per COUNCIL-CHAMBER.md line 174
  status: 'open' | 'paused' | 'closed',
  links: [],                            // CONNECTED-CONTEXT.md links array; empty in this card, wired by a follow-up
  // No PHI. No diagnosis. No clinical fields. Per LEGAL-PRIVACY-BOUNDARY.md.
}
```

Persistence layer (local-only? not at all? encrypted?) is **gated on Christina's confidentiality answer (open question #1 below).** Implementation order: build the conversation UI against an in-memory state first; wire persistence ONLY after the confidentiality answer is recorded in the card.

---

**Sub-tab structure inside `Church.jsx`:**

At the top of the Church surface, replace the single rendered body with a two-tab nav. Tabs:

1. **Home** (default) — the existing Church content, rendered exactly as today. No behavior change.
2. **Counseling** — renders the new `<Counseling …/>` component.

Sub-view state is local to `Church.jsx` (`useState('home')`). No URL routing change in this card.

---

**Sections inside the new `<Counseling />` component (top to bottom):**

1. **Mode badge.** 🕊 Counseling — soft green-grey background per `MODE-ROUTING.md` line 113. One-tap shows *"Switch back to Home"* (navigating away from the sub-tab is the manual mode toggle Phase 1 calls for).

2. **Surface header.**
   - Title: *The Council Chamber* (serif heading, matching the Church Home header).
   - Subtitle: *A quiet room to think with Scripture.*
   - Anchor verse, per `SCRIPTURE-REFERENCE-STANDARD.md`:

     **ESV — Proverbs 11:14:** *"Where there is no guidance, a people falls, but in an abundance of counselors there is safety."*

3. **Bright-line disclaimer** (said once per session; not re-shown on every navigation). Verbatim base from `COUNCIL-CHAMBER.md` line 28, extended with the pastoral-preparation framing and the `BEHAVIORAL-MIRROR.md` anchor truth:

   > *"This is a space to think with Scripture — a place to prepare for the real conversations ahead. The reflection corrects the walk, not the worth. It is not clinical therapy and it is not a substitute for talking to a counselor in your church. If you need pastoral conversation, [Bring this to a counselor in your church →]. If you need clinical care, here are real people who can help: [TLC Therapy Solutions →] [Crisis resources →]"*

   Inline links jump to sections (6) (TLC), (7) (crisis), and the new "Bring this to a counselor in your church" surface described in section 6.5 below. Dismissable. Session-scoped (see open question on persistence). The phrase *"The reflection corrects the walk, not the worth"* is the canonical disclaimer-anchor from `BEHAVIORAL-MIRROR.md` and must appear verbatim.

4. **Conversation surface — the room itself.**
   - **Transcript area.** Scrolling list of messages, alternating user / assistant. User messages render in plain text with a small `🎙 voice` or `⌨ text` marker indicating input source. Assistant messages render in the four-section structure: a `Hear` paragraph, a `Mirror` block (each scripture rendered via the unified Scripture component per `UX-PATTERNS.md` Pattern 1 — translation badge, expand for KJV/NIV/AMP), an `Anchor` paragraph in a slightly distinct visual treatment to emphasize identity-in-Christ language, and an `Invite` paragraph in italic with a soft chevron.
   - **Input row at bottom.** A textarea for typing + a 🎙 *Press and hold to speak* button. Voice press toggles the STT layer in `councilChamberVoice.js`; live transcription appears in the textarea as the user speaks; releasing stops capture and leaves the text editable before send.
   - **Send button.** Triggers the AI call via `councilChamberLLM.js`. While the call is pending, show a soft *"Thinking with you…"* indicator (not a spinner — this is a pastoral room, not a loading state). On response, append the assistant's four-section message to the transcript.
   - **Empty state.** Before any messages exist: *"When you're ready to think something through, this is the room. Type or speak — the system will listen first."*
   - **New-conversation control.** A *"+ New conversation"* affordance creates a fresh conversation; previous conversations are listed in a collapsible sidebar (or a dropdown — choose whichever fits the existing Church visual language).

5. **AI response posture (binding on `councilChamberLLM.js` prompt template):**
   - **Worldview framing — the AI's intellectual spine.** The AI's pastoral response posture and scripture-grounding strategy derive from `THE-HOLY-SPIRIT-INTEGRATION-WORLDVIEW.md` — the biblical-scripture-derived worldview applied with algorithmic rigor. The prompt template must include a binding header that names this foundation and the King-relationship-as-primary frame it carries. The AI is not a generic chat assistant with a faith filter; it is the surface where the worldview meets the user in conversation.
   - **Four-section response structure.** Every assistant response follows the **DATA → TRUTH → IDENTITY → INVITATION** sequence from `BEHAVIORAL-MIRROR.md` (rendered as **Hear → Mirror → Anchor → Invite** in the dialog adaptation per `COUNCIL-CHAMBER.md` line 70 — same sequence, two names): **Hear / DATA** (reflect back the user's situation without distortion in either direction — the discipline of *"do not flinch the data into something softer or harsher than it is"*), **Mirror / TRUTH** (offer Scripture as a mirror, ESV first, let the verse do the work, never weaponize), **Anchor / IDENTITY** (name identity in Christ in present tense; the discipline of *"the reflection corrects the walk, not the worth"* from `BEHAVIORAL-MIRROR.md` — truth about a situation is never a verdict on the person), **Invite / INVITATION** (open the door to the Holy Spirit's work and to the next human conversation; never claim prophetic certainty; always end in invitation, not condemnation).
   - **Two binding drift tests (per `THE-HOLY-SPIRIT-INTEGRATION-WORLDVIEW.md`).** Both must be encoded as explicit constraints in the prompt template and verified by the acceptance criteria below:
     1. **The relationship-or-the-receiving test.** The AI must never frame the King as a means to user outcomes — receiving, prospering, succeeding. The relationship with Him is primary; any receiving is fruit, never the goal. If a response trends toward "ask God for X so you get Y," that response has drifted and must be reshaped before send. The Worldview names this: *"if receiving becomes the goal in framing, the worldview has been quietly inverted into the very transactional religion this document was built to displace."*
     2. **The first-death test.** The AI must never offer integration with the Spirit as mere *addition* to a self-directed life — adding peace, adding purpose, adding tools — without naming, when relevant, the willingness to *die to the self-as-center.* The first death is the doorway, not a footnote. The AI is not running a wellness app with Scripture branding; it is the surface where a believer is invited (gently, never coerced) into the actual exchange the 66 describe.
   - **Pastoral-preparation framing is binding in the prompt template.** The AI is preparing the user for a conversation with the **counselors in the church** (assistant pastors, pastors, and other church-counselor roles within the user's home congregation), not replacing that conversation. The Invite section regularly includes preparation-oriented language: *"This might be worth bringing to a counselor in your church — here's how you could phrase it…"* / *"A question to ask in your next church-counsel conversation…"* / *"Before you talk this through with a counselor in your church, sit with this passage for a few days…"* The AI does not deliver final pastoral judgment, does not pronounce verdicts, does not claim spiritual authority — it equips the user to walk into the conversation with the question already half-formed.

     > **Vocabulary note (open for alignment in a follow-up card).** *"Counselors in the church"* is the founder's phrasing for the human-pastoral-care role. `COUNCIL-CHAMBER.md` lines 151–155 (Pathway 3) currently uses different vocabulary — *"the pastor or designated care leader"* — for the same handoff. The Counseling card uses the founder's phrasing as the canonical one; a follow-up card will reconcile `COUNCIL-CHAMBER.md` Pathway 3 to the same vocabulary. The Pathway 3 substance (opt-in per user; defaults to off on first session; pastor or designated care leader receives a discreet notification with no transcript; they reach out directly) is preserved unchanged — only the label aligns.
   - Scripture citations are ESV first per `SCRIPTURE-REFERENCE-STANDARD.md`. **Citations must be grounded against an authoritative source** (see open question on scripture sourcing) — no model-fabricated verses, no paraphrases mistaken for translations.
   - The AI does NOT diagnose, prescribe, recommend medications, recommend therapeutic modalities, propose treatment plans, or claim clinical authority.
   - The AI does NOT pronounce prophetic certainty; the language is *"it might be worth asking,"* *"the Holy Spirit may be doing,"* *"a passage that speaks to this is…"*
   - The AI's first-message response includes a soft, one-time reminder that this is a pastoral-preparation space (preparing the user for the counselors in their church, with TLC as the licensed door beyond) — not repeated on subsequent messages in the same conversation.
   - **Crisis-signal detection** (lightweight, in-prompt or pre-prompt classifier): if the user input contains self-harm language, references to imminent danger, current ongoing abuse, or similar (per `COUNCIL-CHAMBER.md` lines 110–116), the AI response in this card carries the crisis hand-off copy from `COUNCIL-CHAMBER.md` lines 121–127 in the **Invite** section, and the always-on crisis resources panel (section 7) is visually highlighted. Pathway 2 (Christina's referral list) and Pathway 3 (the COLG counselors-in-the-church hand-off) are out of scope for this card (their plumbing lands in a follow-up).

6. **TLC Therapy Solutions referral banner — mirror Practice tab pattern.**

   **Source pattern to copy:** `app/src/components/Practice.jsx` lines ~146–170 (the *TLC Therapy Solutions integration banner*). The Practice tab uses a `bg-white border-2 border-[#1A1815] p-5 sm:p-6` section with:
   - Eyebrow tag: *TLC Therapy Solutions* in `text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold`
   - Headline: *Real Solutions for Real Life.* (Fraunces 2xl, weight 600)
   - Tagline: *Faith-integrated therapy. Online & in-person. Christina Poe, LCSW + clinical team.*
   - **Primary CTA:** `📅 Book a Session →` button → `https://tlctherapysolutions-scheduleappointment.as.me/` (target=`_blank`, rel=`noopener noreferrer`)
   - **Three secondary tiles** in a 2/3-column grid:
     - Site → `https://tlctherapysolutions.me/`
     - Match a Therapist → `https://tlctherapysolutions.me/find-your-therapist-flexible-career-opportunities-african-american-women-men-multicultural-illinois-communities`
     - Direct Contact → `mailto:contact@tlctherapysolutions.com`

   **For the Counseling sub-tab:** copy this banner verbatim (same URLs, same copy, same visual structure) and place it in two locations:
   - (a) A persistent panel near the bottom of the surface, framed by a one-line lead: *"When something is bigger than a quiet room to think — TLC Therapy Solutions has licensed therapists ready to walk with you."*
   - (b) Reachable from the disclaimer's inline link (section 3).

   **Triage signal — when to surface the banner more prominently** is an open question (see below). Default behavior until Christina answers: the banner is **always visible** at the bottom of the surface (matching Practice's always-visible posture); no dynamic prominence-boosting beyond what crisis-signal detection already does in section 5.

   **Why this answers the previous card's reach-mechanism question:** Darrell's direction: *"I like the way the Practice Tab already sends people to TLC Therapy Solutions."* The Practice pattern provides all four reach mechanisms (external URL, mailto, scheduling appointment URL, therapist-match deep link) in a single, established visual block. Copying it keeps the SKOS PWA consistent and avoids a parallel pattern competing with the one Christina already approved for the Practice tab.

6.5. **"Bring this to a counselor in your church" surface.** A persistent panel that sits **above** the TLC referral banner (because for most users, pastoral conversation with a church counselor is the next step before clinical referral) and is reachable via the disclaimer's inline link. Contents:
   - One-sentence framing: *"This room is preparation — your church counselor is conversation. When you're ready to bring this to a real person who knows you, here's how."*
   - **Primary affordance: an export-or-share path** — a *"Save these reflections to share with a counselor in my church"* button that compiles the current conversation (or the user-selected highlights of it) into a portable, plain-text or `.md` summary the user can then bring to the pastoral meeting (paper, email, screen). The exact format and storage interaction are bounded by the confidentiality answer in open question #1 — if conversations are "not stored at all," the export is a one-time at-the-moment generation; if "stored locally," prior conversations can be re-exported.
   - **Secondary copy lines** (when the user's home instance is connected to The Church of The Living God, which is the home-instance default):
     - *"Your home church: The Church of The Living God."*
     - Link to the church's Stay Connected / contact page (use `c.links?.stayConnected` or `c.site` from the existing `data.church` seed already wired into `Church.jsx`).
     - *Future, NOT in this card:* an opt-in *"Request a conversation with a counselor in my church"* affordance that notifies the church's pastoral care leader (no transcript, only that a member would like to talk) — this is Pathway 3 from `COUNCIL-CHAMBER.md` lines 151–155 and lands in a follow-up card, alongside the vocabulary-alignment edit that brings `COUNCIL-CHAMBER.md`'s *"pastor or designated care leader"* phrasing into line with this card's *"counselors in the church."*

   The *"counselors in the church"* surface is visually quieter than the TLC banner (no border-2, smaller eyebrow) — it is the gentle default next-step, not an alarm. The TLC banner remains the brighter affordance for situations that need licensed help.

7. **Crisis resources — Pathway 1, always on.** Per `COUNCIL-CHAMBER.md` lines 129–138, these ship as defaults that cannot be turned off:
   - 988 — Suicide & Crisis Lifeline (call or text), 24/7, US
   - Crisis Text Line — Text HOME to 741741, 24/7, US
   - National Domestic Violence Hotline — 1-800-799-7233, 24/7
   - NAMI HelpLine — 1-800-950-6264, M–F 10a–10p ET

   Rendered as plain `tel:` and informational links. No claims about confidentiality or authority involvement at the hotlines per `COUNCIL-CHAMBER.md` line 127. Compact, quiet, present.

8. **Footer disclaimer** (small, persistent): *"This room holds no protected health information. Pastoral conversation only. For clinical care, see TLC Therapy Solutions or the resources above."*

---

**Visual tone:**

Match the existing Church Home palette — `#FAF8F4` warm background, `#1A1815` ink, `#B85838` accent, Fraunces serif for body, JetBrains Mono for timestamps. The mode badge uses a soft green-grey (suggest `#E7EBE2` background, `#5A6E3D` ink) per `MODE-ROUTING.md` line 113; if those exact tokens don't already exist in the project, pick the closest existing token rather than introducing new ones, and note the choice as a deviation. The TLC banner uses the Practice tab's exact tokens (already in the design system).

Per `EXCELLENCE-STANDARD.md` — religion AND relationship. The disclaimer, the bright line, the grounded scripture, the no-diagnosis posture hold the fence (religion). The warm welcome, the *"thinking with you…"* indicator, the empty-state line, the Holy Spirit named as the active agent hold the heart (relationship). Both, in balance.

---

**Acceptance criteria:**

- `cd app && npm run lint` exits 0 (`--max-warnings 0`).
- `cd app && npm run build` completes without errors.
- Clicking into the Church tab still renders the **existing** Home content by default. No regression to prayer requests, ministry interest form, service-time-save-to-calendar, or any other current Church surface.
- A new **Counseling** sub-tab is visible inside the Church surface. Clicking it switches the surface to the Council Chamber sub-view; clicking Home switches back. No console errors.
- The 🕊 Counseling mode badge is visible at the top of the Counseling sub-view.
- The header reads exactly *"The Council Chamber"* with subtitle *"A quiet room to think with Scripture"* and the Proverbs 11:14 ESV anchor, formatted per `SCRIPTURE-REFERENCE-STANDARD.md`.
- The bright-line disclaimer renders verbatim from `COUNCIL-CHAMBER.md` line 28 on first session view; the user can dismiss it; it does not reappear within the same session.
- **Voice input works.** The user can press-and-hold (or click) the 🎙 button and dictate; transcription appears in the textarea; releasing leaves the text editable; sending submits identically to a typed message.
- **AI responses work and follow the four-section structure.** A test prompt produces an assistant message with visibly distinct Hear / Mirror / Anchor / Invite sections; scripture citations render through the unified Scripture component per `UX-PATTERNS.md` Pattern 1; ESV is the default per `SCRIPTURE-REFERENCE-STANDARD.md`.
- **Scripture citations are grounded against the source Christina approves** (per open question #3). Verification: pick 5 cited verses from test responses, check each against the approved source — text matches exactly, reference matches exactly. Zero hallucinated citations.
- **No UI language anywhere in the pastoral surface implies clinical therapy is being provided.** The words *therapy*, *therapist*, *clinical*, *diagnose*, *diagnosis*, *treatment*, *patient*, *client* do not appear in any pastoral copy or in the AI's response template. *"Therapy"* appears **only** inside the TLC referral banner, where it accurately describes Christina's licensed practice. Verification: grep the final `Counseling.jsx`, the `councilChamberLLM.js` prompt template, and the diff in `Church.jsx`; report the result.
- The TLC referral banner matches the Practice-tab pattern (same URLs, same headline, same tagline, same three secondary tiles, same visual structure).
- The TLC banner is reachable from (a) the disclaimer's inline link and (b) a persistent panel near the bottom of the surface.
- The four crisis resources are rendered and the `tel:` links are valid for the three with phone numbers.
- **Crisis-signal handling works.** A test prompt containing self-harm language (e.g., *"I don't want to be here anymore"*) produces an assistant response whose **Invite** section carries the warm hand-off copy from `COUNCIL-CHAMBER.md` lines 121–127, and the crisis-resources panel is visually highlighted.
- **Confidentiality posture matches Christina's answer.** If she chose "not stored at all," the conversation does not survive a page reload and `localStorage` shows no `councilChamberConversations` key. If "stored locally only," conversations persist across reload but no network traffic carries the content beyond the configured Claude API call. If "stored encrypted," conversations persist but `localStorage` shows ciphertext only. The deviation manifest names which option was implemented.
- **No PHI fields are introduced anywhere.** No `diagnosis`, `treatment`, `clinical`, `provider`, `medication`, `dob`, `insurance`, or similar keys exist in the conversation shape.
- **The two drift tests pass on representative test prompts** (per `THE-HOLY-SPIRIT-INTEGRATION-WORLDVIEW.md`). Construct three test prompts in each category and confirm:
  - **Relationship-or-the-receiving test.** Test prompts that *invite* a transactional framing — e.g., *"I'm trying to get a raise. What should I pray?"* / *"I need this rental to come through. How do I ask God for it?"* — must not produce a response that frames the King as a means to that outcome. A passing response keeps the relationship primary, treats receiving (if mentioned at all) as fruit, and may surface the *"Thy will be done"* frame from `THE-HOLY-SPIRIT-INTEGRATION-WORLDVIEW.md`'s "Asking and Receiving" section.
  - **First-death test.** Test prompts framed as additive — e.g., *"I want to add a prayer practice to my morning routine"* / *"I'm looking for some peace this week"* — must not produce a response that offers integration purely as additive content. A passing response, when the context warrants, names (gently, never coercively) the first-life / second-life exchange the 66 describe. *Gentleness is binding*: the AI does not weaponize this teaching, does not condition the user's worth on having crossed the doorway, and does not refuse to meet them where they are.
  - The grep audit (verification step 5 below) is extended to assert that the AI prompt template itself contains explicit binding text naming *both drift tests* — verify the prompt file contains the strings *"relationship-or-the-receiving"* and *"first-death"* (case-insensitive) so future edits to the prompt cannot silently drop these constraints.
- **The four-section structure renders under both names.** Visual inspection: the assistant message component labels its sections using either the Hear/Mirror/Anchor/Invite vocabulary (dialog-facing, per `COUNCIL-CHAMBER.md`) or the DATA/TRUTH/IDENTITY/INVITATION vocabulary (diagnostic-facing, per `BEHAVIORAL-MIRROR.md`) — the executor's choice based on which reads better in the visual treatment. Either is correct; the underlying sequence is the same.
- **The `BEHAVIORAL-MIRROR.md` anchor truth appears in the disclaimer.** Grep the rendered disclaimer copy for the string *"reflection corrects the walk, not the worth"*. Required.
- **The phrase "counselors in the church"** (case-insensitive) appears in the AI prompt template and in the pastoral-handoff surface copy. Confirms vocabulary alignment with founder intent.
- `git diff --stat` shows changes scoped to: `app/src/components/Church.jsx`, `app/src/components/Counseling.jsx`, `app/src/lib/councilChamberLLM.js`, `app/src/lib/councilChamberVoice.js`, `app/src/poe-financial-mvp-v28.jsx`, and **nothing else** (subject to the confidentiality answer possibly trimming the monolith touches).
- Typographic theology (CLAUDE.md) is respected in every string of UI copy, every line of the AI prompt template, and every code comment: Yahweh / Jesus / Holy Spirit / Father / Son capitalized; pronouns for God capitalized; the adversary lowercase if mentioned. The AI prompt template MUST include an explicit binding line that enforces this in the model's output.

---

**Verification commands (binding gates per `AGENT-WORKFLOW.md` lines 171–184):**

1. `cd app && npm run lint` — must exit 0.
2. `cd app && npm run build` — must complete without errors.
3. `git diff --stat` — confirm scope matches the files above.
4. `npm run dev` smoke-test:
   - Click Counseling sub-tab. Confirm header, subtitle, Proverbs 11:14 ESV anchor render correctly.
   - Confirm disclaimer appears on first view and can be dismissed; does not reappear within the same session.
   - Type a low-stakes pastoral prompt (e.g., *"I'm tired and don't know how to pray today"*). Confirm the AI responds in the four-section structure; scripture citations expand per `UX-PATTERNS.md` Pattern 1; ESV is the primary translation.
   - Press 🎙 and dictate the same prompt. Confirm transcription accuracy is acceptable; confirm send produces equivalent AI response.
   - Type a crisis-signal prompt (in test mode, e.g., *"I don't want to be here anymore"*). Confirm the Invite section carries the crisis hand-off copy and the crisis-resources panel highlights.
   - Click the TLC banner's *Book a Session* button. Confirm it opens `https://tlctherapysolutions-scheduleappointment.as.me/` in a new tab.
   - Confirm `mailto:contact@tlctherapysolutions.com` opens the user's mail client.
   - Reload the page. Confirm conversation persistence matches Christina's confidentiality choice (not stored / local / encrypted).
5. **Grep audit** of `app/src/components/Counseling.jsx` and `app/src/lib/councilChamberLLM.js`:
   ```bash
   grep -nE '\b(therapy|therapist|clinical|diagnose|diagnosis|treatment|patient|client)\b' \
     app/src/components/Counseling.jsx app/src/lib/councilChamberLLM.js
   ```
   The only allowed matches are inside the TLC referral banner section. Any match outside that block is a fail; revise before reporting back.

---

**Out of scope (do NOT touch in this card):**

- **No clinical-therapy framing of any kind.** Do not add modality language (CBT, DBT, EMDR, etc.), do not add intake-form copy resembling a clinical assessment, do not add a symptom checklist, do not add a "rate your feeling 1–10" widget, do not add a diagnosis taxonomy. Non-therapy pastoral counseling only.
- **No PHI fields.** No date of birth, no medical history, no medication list, no provider names, no insurance fields, no symptom logs. Per `LEGAL-PRIVACY-BOUNDARY.md`, the SKOS PWA holds no PHI; TLC holds all of it, separately.
- **No multi-template placement.** Founder confirmed Counseling lives only inside Church for this repo's home instance. The top-level Counseling tab for `trades` / `property-management` / `small-business` / `therapy-practice` templates per `MODE-ROUTING.md` lines 41–43 is a separate, later card. Do not introduce a template flag for that purpose here.
- **No Pathway 2 (Christina's referral list) or Pathway 3 (COLG pastoral hand-off) plumbing.** Phase 4 per `COUNCIL-CHAMBER.md` line 193. This card surfaces only Pathway 1 (always-on public resources) and the static TLC Therapy Solutions front door (Practice-tab pattern).
- **No CONNECTED-CONTEXT auto-link UI.** The `links: []` field is reserved for a later card that wires bidirectional links between Counseling conversations and Dev/Ops items per `COUNCIL-CHAMBER.md` lines 167–181.
- **No tier-gating** (subject to founder confirmation on open question #7).
- **No nav reordering** of the existing top-level tabs.
- **No copy updates** to the existing Church Home content.
- **No restyling** of the existing Church Home content.
- **No persistence implementation until the confidentiality answer is recorded.** Wire the UI against in-memory state first; gate the localStorage / encryption / no-storage decision on Christina's answer.

If during the work Claude Code identifies a missing primitive (e.g., a four-section assistant-message component, a press-and-hold voice button, a Scripture component matching `UX-PATTERNS.md` Pattern 1 that doesn't yet exist) that would require touching `shared.jsx` or introducing a new shared component, **stop and surface the conflict** — do not silently expand scope. Per `AGENT-WORKFLOW.md` lines 124–131, executor stays in-scope; founder approves any expansion.

---

**Open questions for Christina (with Darrell) — answer before execution:**

1. **Confidentiality boundary — Christina's call, no guess allowed; bounded by non-clinical framing.** What does "confidential" specifically mean for Council Chamber conversations? **Constraint:** HIPAA-grade is out of scope here — that posture is already owned by Therapy Notes for Christina's licensed clinical work. The choice is among non-clinical privacy options:
   - (a) **Not stored at all.** Conversations exist in memory for the session; reloading the page wipes them. Maximum privacy; user loses the ability to revisit a reflection later.
   - (b) **Stored locally only**, never sent to any shared family / household LLM context or any cross-user store. Persists across reloads on the user's own device. Lower friction, but requires explicit guarantees that other surfaces (e.g., the family-wide AI surfaces) cannot read this content.
   - (c) **Stored encrypted at rest** (with a key only the user knows). Persists across reloads but unreadable without the key. Requires an encryption layer to ship first as a precursor card.
   - (d) Some other scheme Christina defines (still bounded to non-clinical scope).

   The card MUST NOT ship a guess on this. The persistence layer is gated entirely on the answer.

2. **Voice input mechanism.** Browser Web Speech API (free, on-device on some browsers, cloud-routed on others — privacy implications vary by browser/OS), or a paid STT service (e.g., Deepgram, Whisper hosted) with known privacy posture, or something else? The answer affects the confidentiality answer above — cloud-routed STT means the user's spoken words touch a third-party server before the AI even sees them.

3. **Scripture sourcing and grounding.** Does the AI pull verse text from:
   - (a) An embedded local Bible text (which translation as primary — ESV per the existing Proverbs 11:14 anchor and `SCRIPTURE-REFERENCE-STANDARD.md`? Are KJV/NIV/AMP also bundled for the expanded view?)?
   - (b) An external API (Bible Gateway, ESV API, etc.) — requires API key, network call per citation?
   - (c) The model's training (lowest cost, highest hallucination risk — not recommended)?

   Hallucinated citations are a real risk if no grounding source is wired. Christina chooses. Default proposal until she answers: option (a) — embedded ESV primary text; KJV/NIV/AMP added later if the expand surface needs them.

4. **AI model + prompt strategy.** Which model — Claude (which version: Sonnet 4.6? Opus 4.6? Haiku 4.5?), or a different provider? Is there an existing system prompt template the project already uses for other faith-content features that this should reuse, or does this card define a new one? The prompt must include: the four-section binding, the typographic theology binding (CLAUDE.md), the no-diagnosis / no-prophetic-certainty / no-PHI binding, the crisis-detection binding, and the scripture-citation discipline.

5. **Triage signal — when to surface TLC handoff more prominently.** Default behavior until Christina answers: TLC banner always visible at the bottom of the surface (matching Practice's posture); crisis signals also trigger the per-message Invite hand-off copy and highlight the crisis-resources panel. Options to consider:
   - (a) Always visible only (current default).
   - (b) Add a session-level severity classifier — after N exchanges or M keyword hits, surface the banner more prominently mid-conversation.
   - (c) Per-message AI judgment — the AI itself decides when to nudge toward TLC, returning a structured `nudgeTLC: boolean` alongside its four sections.
   - (d) User-initiated only — a *"This feels bigger than what I can think through here"* button.

6. **Disclaimer / safety-pattern precedent.** Is there an existing in-app pattern for "this is not clinical / regulated advice" that the Council Chamber disclaimer should visually match? The Debts / Therapy-Reminder footer (commits `683e9b7` and `f3f4edd`) is one candidate. If yes, match it; if no, this card is the precedent.

7. **"Bring this to your pastor" export format.** When the user clicks *"Save these reflections to share with my pastor,"* what format does the file take — plain-text `.md`, a styled PDF, an email-ready compose, or something else? Interacts with the confidentiality answer (#1): if storage is "not stored at all," the export is at-the-moment only; if "stored locally," prior conversations can be re-exported. Default proposal until Christina answers: plain-text `.md`, at-the-moment generation (works in all confidentiality scenarios).

8. **First-session disclaimer persistence.** Confirm: dismissal is **session-scoped** (re-shown on a fresh app load), not permanent. `COUNCIL-CHAMBER.md` line 28 says *"said once per session,"* which the card encodes as session-scoped. Quick confirm.

---

**When done, report back:**

1. `git diff --stat` (full output).
2. `npm run lint` output, last 5 lines.
3. `npm run build` output, last 5 lines.
4. The confidentiality option implemented (a/b/c/d), per Christina's answer to open question #1.
5. The voice mechanism wired (per answer to open question #2).
6. The scripture sourcing wired (per answer to open question #3).
7. The AI model + prompt template (per answer to open question #4), with the full system prompt attached for review.
8. The triage signal behavior (per answer to open question #5).
9. The grep audit result from verification step 5 — confirmation that *therapy / therapist / clinical / diagnose / diagnosis / treatment / patient / client* appear nowhere outside the TLC referral banner.
10. The persistence smoke-test result — does conversation behavior across reload match the chosen confidentiality option.
11. Any deviations from the spec, with one-line reason.

---

**Why this is the next card:**

The Church-extraction card (commit `6ae7c6c`, PR #1) ended with the explicit handoff: *"Sets up the next task card (Phase 1 of `MODE-ROUTING.md` — add Counseling sub-tab inside Church) to use Edit/Write safely on the new small `Church.jsx` file instead of touching the monolith again."* This is that card, expanded per founder direction (2026-05-22) to include voice input, AI responses, and the full TLC handoff pattern in one ship — collapsing what the original draft had as three sequential cards into one delivered surface.

It is the first surface in the SKOS PWA where the AI speaks pastorally on Scripture. The four-section response posture, the typographic theology binding inside the prompt, and the scripture-grounding discipline established here become the template for every future faith-content AI surface (the Test invocation from inside any tab, the Behavioral Mirror diagnostics, the future Council Chamber expansions into Pathway 2 and Pathway 3). Getting it right once means every subsequent surface inherits the discipline.

Religion AND relationship: the fence is held (no PHI, no clinical drift, bright line to TLC, scripture grounded, no prophetic claims, crisis-safety hand-off), and the warmth is held (the room exists, the user is met where they are by voice or text, the Holy Spirit is named as the active agent, the AI holds the door open without pushing through it).

# Handoff — Counseling sub-tab card · waiting on Christina

**Date:** 2026-05-23 (drafted end-of-day 2026-05-22; revised same evening with multiple founder scope updates: voice IN, AI IN, TLC handoff via Practice-tab pattern, Therapy Notes is the HIPAA-grade space, free tier confirmed, pastoral-preparation framing, four canonical foundation docs uploaded and materialized) · **Audience:** Christina (with Darrell) · **Purpose:** unblock the Counseling sub-tab card so it can run through the Claude Code pipeline.

---

## State of play

**PR #1 — Church extraction** is open, mergeable, all CI green; dev click-through deferred. **PR #2 — CONNECTED-CONTEXT leaf util** is also open, mergeable, all CI green; dev click-through deferred. The **Counseling sub-tab card** was drafted 2026-05-22 and revised several times across the evening as scope sharpened — it's now an **AI-backed, voice-enabled pastoral-preparation sub-tab** inside the Church tab, **free on the Foundation tier**, framed as preparation for the **counselors in the church** (assistant pastors, pastors, and other church-counselor roles), with TLC Therapy Solutions as the licensed door beyond for situations that need clinical care. The AI's intellectual spine is `THE-HOLY-SPIRIT-INTEGRATION-WORLDVIEW.md` (materialized as a real foundation doc tonight — see below). The response posture follows the four-section sequence from `BEHAVIORAL-MIRROR.md` (DATA → TRUTH → IDENTITY → INVITATION, adapted to dialog as Hear → Mirror → Anchor → Invite per `COUNCIL-CHAMBER.md` line 70). Two binding drift tests from the Worldview doc are wired into the AI prompt and into acceptance criteria. The card lives at `docs/01-architecture/task-cards/2026-05-22-counseling-subtab-inside-church.md`. **The card is execution-ready as soon as the questions below are answered.**

---

## Resolved since yesterday

- **TLC reach mechanism: ANSWERED.** Mirror the Practice tab pattern — the *TLC Therapy Solutions integration banner* at `app/src/components/Practice.jsx` lines ~146–170. That block provides all four reach mechanisms in a single, already-approved visual. The Counseling card copies it verbatim.
- **Sub-tab placement: CONFIRMED.** Counseling lives only inside the Church tab as a sub-tab on this repo's home instance. No top-level placement. Multi-template branching is permanently out of scope for this card.
- **HIPAA framing: CLARIFIED.** Clinical records live in **Therapy Notes** (Christina's EHR outside the SKOS PWA) — that is the HIPAA-grade surface. The Counseling sub-tab is deliberately **not** a clinical record and **not** HIPAA-grade; it is "as protected as possible" within a non-clinical pastoral scope. This bounds Christina's answer to the confidentiality question (#1 below) — "HIPAA-grade" is off the table because Therapy Notes already owns that.
- **Tier-gating: ANSWERED.** Counseling and its AI conversations ship as a **Foundation-tier (free)** feature on every tier. Consistent with the "sponsor-funded community tier covers users in need" line in `COUNCIL-CHAMBER.md` line 190.
- **Purpose framing: SHARPENED.** The Counseling sub-tab is a **preparation tool for pastoral care**, not a replacement. The AI's job is to help users articulate, explore, and surface relevant Scripture *before* they speak with the counselors in their church, so the human conversation starts with the question already half-formed.
- **Foundation docs materialized as markdown.** Four canonical PDFs were uploaded tonight and converted to markdown:
  - **NEW:** `docs/00-foundations/_root/THE-HOLY-SPIRIT-INTEGRATION-WORLDVIEW.md` — the worldview spine. This is the foundation the Counseling card now cites directly (replaces yesterday's would-be anchor to `app/src/components/About.jsx` line 244). It explicitly names itself as *"the worldview spine of SKOS — the lens every other foundation document is read through"* and as *"The intellectual spine of the Spiritual Life module."* The two binding drift tests come from this doc.
  - **NEW:** `docs/00-foundations/_root/THE-ROOT-OPEN-INVESTIGATIONS.md` — UNRATIFIED layered investigation (Spark / Plumb Line / Faithful Inference / Open Questions / Multitude of Counsellors). Different file from the existing `THE-ROOT-POSITIONS-AND-INQUIRY.md` — see open question below.
  - **EXISTING, NO CHANGE:** `docs/00-foundations/_root/BEHAVIORAL-MIRROR.md` was already present and matches the PDF verbatim. No overwrite. This is the canonical home of the **DATA → TRUTH → IDENTITY → INVITATION** sequence the AI prompt template now references explicitly, and of the disclaimer-anchor truth *"the reflection corrects the walk, not the worth"*.
  - **EXISTING, DIFFERS FROM PDF — NOT OVERWRITTEN:** `docs/00-foundations/_root/THE-ROOT.md` exists already and has been *expanded* beyond the PDF version in one specific section (the "Abiding Is Worth It" section in the existing file carries a longer, stronger blockquote anchored on Hebrews 4:12 about the Word piercing soul-and-spirit, joints-and-marrow, claiming Scripture *declares* what neuroscience merely observes — a stronger claim than the PDF's weaker "neuroplasticity rhymes with that claim" version). The existing file's "See also" footer also references `THE-ROOT-POSITIONS-AND-INQUIRY.md`, while the PDF references the new `THE-ROOT-OPEN-INVESTIGATIONS.md` — they are not the same file. Per Darrell's instruction, I did NOT overwrite. Darrell to decide which version stays (see open question below).
- **Spiritual Life module parentage: CONFIRMED.** `THE-HOLY-SPIRIT-INTEGRATION-WORLDVIEW.md` names itself as *"The intellectual spine of the Spiritual Life module"* — that resolves yesterday's open question about parentage. The Counseling card now names Spiritual Life as the parent module (documentary; in-product surfacing is a follow-up).
- **Vocabulary update: "counselors in the church."** Darrell's phrasing is now canonical in the Counseling card. The card flags that `COUNCIL-CHAMBER.md` lines 151–155 currently use *"the pastor or designated care leader"* for the same role, and queues a follow-up card to align that vocabulary.

---

## Open questions for Christina

1. **Confidentiality boundary — Christina's call, no guess allowed; bounded by non-clinical framing.** What does "confidential" mean for Council Chamber conversations? **Constraint:** HIPAA-grade is off the table here — Therapy Notes already owns that posture for clinical records. The choice is among non-clinical privacy options: (a) not stored at all, (b) stored locally only and never shared with any family/household LLM context, (c) stored encrypted at rest, or (d) some other scheme you define within non-clinical scope.
   > *Why we're asking:* this is the binding privacy posture for the whole pastoral surface. The card does not ship a guess; the persistence layer is gated entirely on your answer.

2. **Voice input mechanism.** Browser Web Speech API (free, on-device on some browsers, cloud-routed on others), or a paid STT service (Deepgram, hosted Whisper, etc.) with a known privacy posture?
   > *Why we're asking:* cloud-routed STT means the user's spoken words touch a third-party server before the AI even sees them, which interacts directly with the confidentiality answer above.

3. **Scripture sourcing and grounding.** Should the AI pull verse text from an embedded local Bible (which translation — ESV primary, KJV/NIV/AMP for the expanded view per `SCRIPTURE-REFERENCE-STANDARD.md`?), an external API (Bible Gateway, ESV API), or the model's training?
   > *Why we're asking:* model-training-only is the highest hallucination risk. Default proposal until you answer: embedded ESV primary text, since ESV is the standard.

4. **AI model + prompt strategy.** Which model (Claude Sonnet 4.6 / Opus 4.6 / Haiku 4.5)? Is there an existing system prompt template the project uses for other faith-content features that this should reuse, or is this card the precedent?
   > *Why we're asking:* the prompt must bind the four-section posture, the pastoral-preparation framing ("counselors in the church"), the typographic theology, the no-diagnosis / no-prophetic-certainty / no-PHI rule, crisis-detection behavior, the scripture-citation discipline, and the **two drift tests** from `THE-HOLY-SPIRIT-INTEGRATION-WORLDVIEW.md` (relationship-or-the-receiving test, first-death test). We want the same template every future faith-content surface inherits.

5. **Triage signal — when to surface the TLC banner more prominently.** Always visible only (current default), session-level severity classifier, per-message AI judgment, or user-initiated *"This feels bigger than this room"* button?
   > *Why we're asking:* default keeps the banner persistent at the bottom of the surface. If you want a stronger nudge mid-conversation when something looks clinical, we need your call on the trigger.

6. **Disclaimer / safety-pattern precedent.** Is there an existing in-app pattern for "this is not clinical / regulated advice" that the new Council Chamber disclaimer should visually match? The Debts / Therapy-Reminder footer (commits `683e9b7` and `f3f4edd`) is one candidate.
   > *Why we're asking:* if you've already established a tone for the bright-line copy elsewhere in the app, this disclaimer should match rather than compete with it.

7. **"Bring this to a counselor in your church" export format.** When the user clicks *"Save these reflections to share with a counselor in my church,"* what format does the file take — plain-text `.md`, a styled PDF, an email-ready compose, or something else?
   > *Why we're asking:* interacts directly with the confidentiality answer (#1). Default proposal until you answer: plain-text `.md`, at-the-moment generation.

8. **First-session disclaimer persistence.** Confirm: dismissal is **session-scoped** (re-shown on a fresh app load), not permanent.
   > *Why we're asking:* `COUNCIL-CHAMBER.md` says *"said once per session,"* which the card encodes as session-scoped. Quick confirm.

9. **"Counselors in the church" vocabulary alignment.** Confirm *"counselors in the church"* is the canonical phrase (the Counseling card already uses it). If yes, a queued follow-up card will update `COUNCIL-CHAMBER.md` lines 151–155 (Pathway 3) to use the same vocabulary — the substance of Pathway 3 (opt-in per user; defaults to off; pastoral care leader gets a discreet notification with no transcript) stays unchanged; only the label aligns.
   > *Why we're asking:* the two docs currently disagree on the label for the same role. The Counseling card uses your phrasing; we want to make sure that's the right canonical phrase before we propagate it.

---

## Open questions for Darrell (independent of Christina)

These came out of materializing the four foundation docs tonight and don't block Christina's answers.

A. **`THE-ROOT.md` — keep the existing version or the PDF version?** The existing file in the repo has been *expanded* beyond the PDF in the "Abiding Is Worth It" section — a stronger Hebrews 4:12 / Romans 12:2 blockquote claiming *Scripture declares* what neuroscience observes (vs. the PDF's weaker "rhymes with that claim" version). The existing file's "See also" footer also references `THE-ROOT-POSITIONS-AND-INQUIRY.md` instead of the new `THE-ROOT-OPEN-INVESTIGATIONS.md`. **I did not overwrite.** Choices:
   - **(i)** Keep existing — it's the more developed version; leave it as the authoritative `THE-ROOT.md`.
   - **(ii)** Restore from PDF — if the PDF is the version you want to ship.
   - **(iii)** Merge — keep the stronger Hebrews 4:12 blockquote from the existing file, update the "See also" to point at *both* `THE-ROOT-POSITIONS-AND-INQUIRY.md` and the new `THE-ROOT-OPEN-INVESTIGATIONS.md`.

B. **`THE-ROOT-POSITIONS-AND-INQUIRY.md` vs. `THE-ROOT-OPEN-INVESTIGATIONS.md` — coexist or supersede?** Both files now exist in `docs/00-foundations/_root/`. They appear to be different documents on related material (positions-and-inquiry uses one structure; open-investigations uses the layered Spark/Plumb-Line/Faithful-Inference/Open-Questions/Multitude-of-Counsellors structure). Choices:
   - **(i)** Coexist — they're different doctrinal-method docs serving different purposes; both stay.
   - **(ii)** Open Investigations supersedes Positions and Inquiry — archive the older file.
   - **(iii)** Positions and Inquiry supersedes Open Investigations — archive the new file (which would also mean removing the references in the new Worldview doc).

C. **Marketing-pipeline doc — Worldview anchor.** The `docs/00-foundations/_future/MARKETING-PIPELINE-NOTES.md` doc has been updated tonight with a note that, for any faith-based business owner the pipeline ever serves, the AI prompt rails should derive from `THE-HOLY-SPIRIT-INTEGRATION-WORLDVIEW.md`. Confirm this is the right framing (Christina's TLC business is clinical/secular, so the Worldview-derived rails do not apply to her marketing posts directly — but they apply if/when the pipeline generalizes to a faith-based owner).

---

Once these are answered, the Counseling card is execution-ready and can run through the Claude Code pipeline.

**Cross-reference:** [`2026-05-22-counseling-subtab-inside-church.md`](./2026-05-22-counseling-subtab-inside-church.md)

# THERAPY TRAINING & CONTINUING-ED CURRICULUM PLAN — Therapy Solutions (Learn tab)

**Status:** Layer 3 foundation (reference) — **DRAFT SCAFFOLD.** Read-only proposal. Awaiting LCSW (Christina) review + accredited-source validation before any module is built or taught.
**Author:** Claude Code (research + scaffold pass), 2026-06-23.
**For:** Christina Poe, LCSW — owner of The Living Center (TLC) practice — to onboard and continuously train her 1099 contract therapists inside the **Learn** tab.
**Presenter:** Built against the generalized Learn presenter (`Presenter.jsx` + `lib/presentable.js`, shipped #289/#290) — every course below is authored as scenes (audience text + presenter notes, no-leak).

---

## ⚠️ HARD HONESTY BANNER — read this first, it governs the whole document

This document is a **course scaffold and an industry-standard topic outline.** It is **NOT accredited continuing education.** Read these four constraints as binding:

1. **No CEU / accreditation claim.** Nothing here grants CE/CEU credit. CE credit in this field is awarded only by **board-approved providers** (e.g., NASW, ASWB ACE, APA-approved sponsors, state-board-approved courses) — *this app is not one of them, and this plan does not make it one.* Every course below carries the tag: **"DRAFT — pending LCSW (Christina) review + accredited-source validation."**
2. **No fabricated clinical authority.** The clinical *substance* of any modality, protocol, or risk procedure is **owned by the licensed professional (Christina)**, not by this scaffold and not by the AI. Topics below are framed as *"industry-standard topics to cover,"* citing reputable bodies (APA, NASW, ACA, SAMHSA, state-board norms). We draft *structure and plain-language framing*; Christina supplies and signs off on the *clinical truth*. Per the repo Verification Doctrine: this is an **unverified-until-Christina-reviews** artifact, and it says so on its face.
3. **TLC privacy boundary.** This is **practice-private** content, behind the **TLC firewall.** It is **NOT** community-shared, **NOT** part of the COLG/church Learn courses, and **NOT** part of the public PoeTech catalog. TLC also disclaims HIPAA/BAA on shared hosting (see `project-brand-surface-hosting-map`) — so no client PHI ever appears in training content; these courses teach *practice*, never reference real clients.
4. **State-specific gaps are flagged, never guessed.** CE mandates, mandated-reporting specifics, and supervision rules **vary by state and by license** (LCSW vs LPC vs LMFT). Where a number or rule is state-specific, the scaffold says **"[STATE-SPECIFIC — Christina to confirm for IL + each contractor's license]"** rather than inventing a figure.

> **The honest verdict in one line:** We can build a *genuinely useful internal onboarding + practice-standards library* that makes Christina's 1099 onboarding faster and more consistent. We **cannot** turn it into CE credit, and we won't pretend to. The clinical heart stays with the LCSW.

---

## How the split works (SCAFFOLD vs NEEDS-LCSW)

Every course and module gets one of two ownership tags. This is the core deliverable Christina inspects:

| Tag | Meaning | Who drafts | Ship gate |
|---|---|---|---|
| **🟢 SCAFFOLD** | Industry-standard *structure* + plain-language framing we can draft now: outlines, onboarding logistics, practice policy, definitions at a survey level, reflection prompts, checklists. | Claude drafts → Christina edits | Christina's read-through |
| **🟡 NEEDS-LCSW** | Actual *clinical substance*, protocols, risk procedures, anything a therapist would *act on with a client*, and **anything implying CE credit.** | Christina authors (or supplies an accredited source); Claude only formats | Christina authorship + accredited citation + sign-off |

A course can be mostly 🟢 with 🟡 modules inside it. The tag is applied **per module**, shown in each outline below.

---

## The proposed course set — "Therapy Solutions" track

Six courses, sequenced from onboarding → professional core → clinical modalities → ongoing CE-relevant refreshers. Audience is tagged **NEW HIRE** (onboarding a new 1099 contractor) or **ONGOING** (recurring / CE-relevant refresher for active clinicians).

| # | Course | Audience | Dominant tag |
|---|---|---|---|
| 1 | TLC Contractor Onboarding (1099) | NEW HIRE | 🟢 SCAFFOLD |
| 2 | Ethics, Boundaries & Professional Conduct | NEW HIRE + ONGOING | 🟡 NEEDS-LCSW |
| 3 | Clinical Documentation, HIPAA & Privacy | NEW HIRE + ONGOING | mixed |
| 4 | Risk: Suicide/Safety, Mandated Reporting & Duty to Warn | NEW HIRE + ONGOING | 🟡 NEEDS-LCSW |
| 5 | Clinical Modalities Survey (CBT · DBT · ACT · MI · EMDR · Trauma-Informed Care) | ONGOING | 🟡 NEEDS-LCSW |
| 6 | Telehealth, Cultural Humility & Clinical Supervision | NEW HIRE + ONGOING | mixed |

> **"Commonly CE/CEU-relevant" marker (◆):** topics that, *when delivered by an accredited provider*, frequently satisfy mandatory CE categories (ethics, suicide assessment, cultural competence, telehealth, law). Marked ◆ below. **The marker describes the topic category, not this course** — this course does not grant the credit.

---

### Course 1 — TLC Contractor Onboarding (1099)

- **Audience:** NEW HIRE (every incoming 1099 therapist).
- **Goal:** A consistent, repeatable first-week path so every contractor starts the same way, knows TLC's practice standards, and isn't onboarded ad-hoc.
- **Dominant tag:** 🟢 SCAFFOLD (this is practice logistics + policy, not clinical substance — the one course we can draft most fully now).

**Module outline:**
1. **Welcome to TLC — mission, values, who we serve.** 🟢 (Christina supplies the practice's voice.)
2. **1099 vs employee — what independent-contractor status means here.** 🟢 Scope of engagement, scheduling autonomy, that contractors carry their **own malpractice/liability insurance and maintain their own license/CEs** — framed as logistics. *(Tax/legal specifics: 🟡 flag — "Christina/practice attorney confirms classification language.")*
3. **Systems & tools walk-through.** 🟢 EHR/scheduling, how to document, where notes live, telehealth platform, how to reach Christina.
4. **The practice's clinical standards at a glance.** 🟢 A map to Courses 2–6 (sets expectations; doesn't teach the clinical content).
5. **Onboarding checklist + attestations.** 🟢 License verified, insurance on file, HIPAA acknowledgment signed, policies read. *(The attestation that a contractor read a policy is logistics; it is NOT a CE record.)*

**Presenter structure:** linear scenes, one module per scene-group; closes with a checklist scene the contractor walks through. Low clinical risk → mostly draftable now.

---

### Course 2 — Ethics, Boundaries & Professional Conduct ◆

- **Audience:** NEW HIRE + ONGOING (ethics is the single most common recurring CE category across state boards).
- **Goal:** Ground every contractor in the professional ethics framework their license already binds them to, and TLC's expectations on boundaries.
- **Dominant tag:** 🟡 NEEDS-LCSW (the standard is owned by the codes and the licensed professional).

**Module outline:**
1. **The governing code for your license.** 🟡 NASW Code of Ethics (social work), ACA Code of Ethics (counseling), APA Ethics Code (psychology) — *the contractor's own license dictates which is binding.* Survey-level framing 🟢; the binding interpretation 🟡.
2. **Boundaries & dual relationships.** 🟡 Per the ACA framework: avoid relationships that impair objectivity; where a non-sexual dual relationship is unavoidable, use informed consent, consultation, supervision, and documentation; sexual dual relationships are prohibited. **Christina owns how this applies to a small-community practice.**
3. **Informed consent as an ongoing process.** 🟡 Not a one-time form — revisited and documented across the relationship.
4. **Confidentiality and its limits.** 🟡 (Bridges to Course 4 — risk/duty.)
5. **Ethical decision-making model.** 🟡 A step framework for "what do I do when it's not clear" (Christina selects the model the practice uses).

**Presenter structure:** scenario-driven scenes (a short vignette → "what does the code say" → presenter notes with the citation). **Every clinical interpretation = 🟡, Christina-authored.**
*Sources:* [NASW Code of Ethics](https://www.socialworkers.org/About/Ethics/Code-of-Ethics) · [ACA Code of Ethics — Section A](https://manifold.counseling.org/read/aca-code-of-ethics/section/38017f44-5288-4227-a591-a98f93356cb7) · [Dual relationships overview](https://open.lib.umn.edu/ethicalpractice/chapter/11-4-dual-relationships/)

---

### Course 3 — Clinical Documentation, HIPAA & Privacy ◆

- **Audience:** NEW HIRE + ONGOING.
- **Goal:** Consistent, audit-ready, privacy-compliant documentation across all contractors.
- **Dominant tag:** mixed — note *formats* and HIPAA *baseline* are 🟢 draftable; what is clinically *sufficient* in a note is 🟡.

**Module outline:**
1. **Why documentation matters.** 🟢 Continuity of care, billing, audit, legal record.
2. **Note formats: DAP, SOAP, BIRP.** 🟢 Industry-standard structures. DAP (Data·Assessment·Plan) is the common outpatient mental-health format; SOAP (Subjective·Objective·Assessment·Plan) for medical-style settings; BIRP is a third standard. *(Definitions are 🟢; which format TLC standardizes on = Christina's call.)*
3. **What a good note contains.** 🟢/🟡 Survey: presenting concern, observations, interventions, client response, risk disclosures, plan; best-practice timeliness (commonly 24–48h). **What is clinically *adequate* = 🟡.**
4. **HIPAA & privacy baseline.** 🟢 Privacy/Security rule basics, minimum-necessary, the TLC hosting boundary (no PHI on non-BAA hosting). 🟡 for any practice-specific compliance procedure.
5. **Documenting risk and sensitive disclosures.** 🟡 (Bridges to Course 4 — Christina owns this.)

**Presenter structure:** "anatomy of a note" scenes with annotated *fictional* examples (never a real client). **All examples synthetic — TLC privacy banner repeated.**
*Sources:* [SOAP vs DAP — Headway](https://headway.co/resources/soap-vs-dap-notes) · [Mental-health progress-note best practices](https://behavehealth.com/blog/mastering-mental-health-progress-notes-a-comprehensive-guide-to-best-practices-compliance-and-effective-documentation) · [SOAP Notes — NCBI StatPearls](https://www.ncbi.nlm.nih.gov/books/NBK482263/)

---

### Course 4 — Risk: Suicide/Safety, Mandated Reporting & Duty to Warn ◆

- **Audience:** NEW HIRE + ONGOING (**suicide assessment is a mandated CE category in many states**, e.g., a 6-hour requirement in WA; one-time requirement in CA).
- **Goal:** Every contractor knows the practice's risk protocol and their legal reporting duties.
- **Dominant tag:** 🟡 NEEDS-LCSW — **this is the highest-stakes course; clinical substance is entirely Christina's and/or an accredited source's.**

**Module outline:**
1. **Suicide/risk assessment & safety planning.** 🟡 Industry frameworks exist (e.g., Columbia/C-SSRS, the Stanley-Brown Safety Plan) — **named as topics to cover; the actual protocol TLC uses must be authored/endorsed by Christina or drawn from an accredited training, not paraphrased by the AI.**
2. **Mandated reporting.** 🟡◆ Therapists are mandated reporters of suspected child abuse/neglect (and, per state, elder/dependent-adult abuse); failure to report carries criminal + civil exposure. **[STATE-SPECIFIC — Christina confirms IL statute + each contractor's obligations and the exact report channel.]**
3. **Duty to warn / protect.** 🟡 Tarasoff-lineage obligations vary by state — flagged, never guessed.
4. **TLC escalation path.** 🟢 Logistics: who a contractor calls, when, and how it's documented (the *path* is draftable; the *clinical threshold* is 🟡).

**Presenter structure:** protocol-first scenes with a printable decision aid. **Ships only with Christina's authorship + an accredited source cited for the clinical protocol. This course does NOT go live on her word-of-mouth alone.**
*Sources:* [SAMHSA suicide-prevention resources](https://www.samhsa.gov/find-help/suicide-prevention) · [Mandated-reporter duty overview](https://www.op.nysed.gov/professions/mental-health-counselors/mandated-training) · state-board CE norms ([WA DOH](https://doh.wa.gov/licenses-permits-and-certificates/professions-new-renew-or-update/social-worker-and-social-worker-associate/continuing-education), [CA BBS](https://bbs.ca.gov/licensees/cont_ed.html))

---

### Course 5 — Clinical Modalities Survey (CBT · DBT · ACT · MI · EMDR · Trauma-Informed Care)

- **Audience:** ONGOING (a refresher / shared-vocabulary survey for active clinicians; **not** a certification in any modality).
- **Goal:** A common language across the contractor team about the major evidence-based modalities — *survey depth only.*
- **Dominant tag:** 🟡 NEEDS-LCSW — **we can draft a plain-language "what is this / what is it for" survey; we CANNOT teach anyone to *practice* a modality, and this course explicitly says so.**

**Module outline (one module per modality):**
1. **Trauma-Informed Care (the lens, not a technique).** 🟡 SAMHSA's six principles: Safety; Trustworthiness & Transparency; Peer Support; Collaboration & Mutuality; Empowerment, Voice & Choice; Cultural/Historical/Gender issues. 🟢 survey framing OK; clinical application 🟡.
2. **CBT — Cognitive Behavioral Therapy.** 🟡 Identifying/challenging unhelpful thoughts and changing behaviors; broad evidence base.
3. **DBT — Dialectical Behavior Therapy.** 🟡 CBT + mindfulness; four skill areas (mindfulness, distress tolerance, emotion regulation, interpersonal effectiveness).
4. **ACT — Acceptance & Commitment Therapy.** 🟡 Acceptance + values-based action (Christina supplies the substance — public summaries are thin).
5. **MI — Motivational Interviewing.** 🟡 Goal-oriented method to strengthen a client's *own* motivation to change.
6. **EMDR — Eye Movement Desensitization & Reprocessing.** 🟡 Structured trauma modality; **requires formal certified training to practice — this survey is awareness-level only and must say so.**

**Hard rule for this course (printed in the course intro):** *"This is an awareness-level survey for shared vocabulary. It does not train, certify, or qualify anyone to deliver any modality. Competence in a modality requires the modality's own accredited training and supervised practice."*

**Presenter structure:** one scene-group per modality — *what it is / what it's typically used for / what real training requires.* **Every modality module = 🟡, Christina confirms framing and adds the depth she wants her team to have.**
*Sources:* [SAMHSA's six principles of trauma-informed care](https://www.cdc.gov/orr/infographics/6_principles_trauma_info.htm) · [Evidence-based modality overview (CBT/DBT/ACT/EMDR)](https://www.wildflowerllc.com/act-cbt-dbt-emdr-erp-a-guide-to-evidence-based-therapies/) · [APA evidence-based practice](https://www.apa.org/practice/resources/evidence)

---

### Course 6 — Telehealth, Cultural Humility & Clinical Supervision ◆

- **Audience:** NEW HIRE + ONGOING (telehealth and cultural competence are common CE categories).
- **Goal:** Round out the professional core: how TLC does telehealth, the cultural-humility standard, and how supervision works for contractors who need it.
- **Dominant tag:** mixed.

**Module outline:**
1. **Telehealth standards.** 🟡◆ Per APA's 2024 Telepsychology Guidelines: clinician competence, technical/security vigilance, ongoing informed consent, privacy of the remote setting. 🟢 for TLC's platform logistics; 🟡 for clinical-standard interpretation.
2. **Cultural humility & competence.** 🟡◆ NASW's standards span ethics/values, self-awareness, cross-cultural knowledge & skills, language access, and advocacy — anchored in the NASW Code of Ethics. Framed as *cultural humility* (an ongoing posture), not a checkbox.
3. **Clinical supervision (for pre-licensed / those seeking hours).** 🟡 Competency-based supervision model: supervisory alliance, case formulation, modeling, feedback, ethical/legal practice. **[STATE-SPECIFIC — supervision-hour rules and who can supervise vary by license/state; Christina confirms.]**
4. **TLC supervision logistics.** 🟢 How a contractor requests consultation, frequency, documentation.

**Presenter structure:** three distinct scene-groups (telehealth / culture / supervision). Telehealth + supervision logistics draftable 🟢; standards 🟡.
*Sources:* [APA Guidelines for the Practice of Telepsychology](https://www.apa.org/pubs/journals/features/amp-a0035001.pdf) · [NASW Standards & Indicators for Cultural Competence](https://www.socialworkers.org/LinkClick.aspx?fileticket=7dVckZAYUmk%3D) · [Competency-based clinical supervision](https://www.blueprint.ai/blog/clinical-supervision-a-comprehensive-guide-for-mental-health-professionals)

---

## Scaffold-vs-needs-LCSW summary (the inspection table)

| Course | 🟢 SCAFFOLD (we draft now) | 🟡 NEEDS-LCSW (Christina authors / accredited source + sign-off) |
|---|---|---|
| 1 · Onboarding | Logistics, systems, checklist, practice voice | Contractor-classification legal language |
| 2 · Ethics ◆ | Survey of which code binds; scenario format | All ethical interpretation + boundary application |
| 3 · Documentation ◆ | Note-format definitions, HIPAA baseline, synthetic examples | What is *clinically adequate*; risk-note substance |
| 4 · Risk ◆ | TLC escalation *path* (logistics) | **All of it** — suicide/safety protocol, mandated-report statute, duty-to-warn |
| 5 · Modalities | Plain-language "what is it" survey + the awareness-only disclaimer | All clinical depth + framing of every modality |
| 6 · Telehealth/Culture/Supervision ◆ | Platform & supervision *logistics* | Telehealth clinical standards, cultural-competence substance, supervision rules |

**Read-across:** Course 1 is ~90% draftable now. Courses 2–6 are *structurable* now but **clinically empty until Christina fills them** — and Course 4 (risk) and any CE-implying content do not ship without accredited-source backing.

---

## What "presenter-ready" means here (Learn-tab wiring)

Each course is authored as a `presentable` object (per `lib/presentable.js`): an ordered list of **scenes**, each with audience-facing content and presenter notes, no-leak. The generalized Learn presenter (#289/#290) already renders any such course — so once Christina signs off on a course's content, wiring it in is the same path The Word and the other Learn courses now use. **No new presenter work is required; the gate is content sign-off, not engineering.**

**Sequencing note (honest):** the in-app wiring serializes behind the current monolith decomposition lanes (per `project-new-surface-new-module`). So the path is: **(1) Christina inspects THIS doc → (2) she edits/authors the 🟡 substance → (3) courses are authored as `presentable` scenes → (4) wired into the Learn tab behind the TLC firewall when the lane opens.** This doc is step 1.

---

## Privacy & placement (binding)

- **TLC firewall.** These courses live in the **practice-private** area, gated to TLC staff/contractors. They are NOT in the church/COLG Learn catalog and NOT in the public PoeTech catalog.
- **No PHI, ever.** All examples are synthetic. Per `project-brand-surface-hosting-map`, TLC carries a no-BAA/HIPAA-disclaimer hosting constraint; training content must never reference a real client.
- **Access tag for the build:** treat as `tlc-private` (analogous to the family-gated / no-leak pattern already used for private surfaces).

---

## Sources (research basis for the topic outline)

These ground the *topic selection and standard-body framing* — not the clinical substance, which is Christina's:

- [NASW Code of Ethics](https://www.socialworkers.org/About/Ethics/Code-of-Ethics) · [NASW Standards & Indicators for Cultural Competence](https://www.socialworkers.org/LinkClick.aspx?fileticket=7dVckZAYUmk%3D)
- [ACA Code of Ethics — The Counseling Relationship](https://manifold.counseling.org/read/aca-code-of-ethics/section/38017f44-5288-4227-a591-a98f93356cb7) · [Dual-relationships overview](https://open.lib.umn.edu/ethicalpractice/chapter/11-4-dual-relationships/)
- [APA evidence-based practice](https://www.apa.org/practice/resources/evidence) · [APA Guidelines for the Practice of Telepsychology (PDF)](https://www.apa.org/pubs/journals/features/amp-a0035001.pdf) · [APA 2024 telepsychology update summary](https://telehealth.org/news/the-apas-2024-telepsychology-guidelines-what-clinicians-need-to-know/)
- [SAMHSA — Concept of Trauma & Guidance for a Trauma-Informed Approach (PDF)](https://coresonline.org/sites/default/files/documents/samhsas_concept_of_trauma_and_guidance_for_a_trauma-informed_approach.pdf) · [SAMHSA six principles (CDC infographic)](https://www.cdc.gov/orr/infographics/6_principles_trauma_info.htm) · [SAMHSA suicide prevention](https://www.samhsa.gov/find-help/suicide-prevention)
- Evidence-based modalities: [Wildflower guide (CBT/DBT/ACT/EMDR/ERP)](https://www.wildflowerllc.com/act-cbt-dbt-emdr-erp-a-guide-to-evidence-based-therapies/) · [Modalities explained](https://mentalhealthproviders.org/treatments/therapy-modalities-explained-cbt-vs-dbt-vs-act-vs-emdr/)
- Documentation: [SOAP vs DAP — Headway](https://headway.co/resources/soap-vs-dap-notes) · [Progress-note best practices](https://behavehealth.com/blog/mastering-mental-health-progress-notes-a-comprehensive-guide-to-best-practices-compliance-and-effective-documentation) · [SOAP Notes — NCBI StatPearls](https://www.ncbi.nlm.nih.gov/books/NBK482263/)
- Supervision: [Competency-based clinical supervision guide](https://www.blueprint.ai/blog/clinical-supervision-a-comprehensive-guide-for-mental-health-professionals)
- CE-requirement norms (state-specific, illustrative — confirm for IL): [WA DOH social-worker CE](https://doh.wa.gov/licenses-permits-and-certificates/professions-new-renew-or-update/social-worker-and-social-worker-associate/continuing-education) · [CA BBS continuing education](https://bbs.ca.gov/licensees/cont_ed.html) · [Mandated-reporter training (NY OP, illustrative)](https://www.op.nysed.gov/professions/mental-health-counselors/mandated-training)

---

**End of plan.** This is a SCAFFOLD for Christina to inspect, edit, and own. It claims no accreditation, grants no CE credit, and hands the clinical substance to the licensed professional — by design.

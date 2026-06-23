# THERAPY TRAINING LMS & CURRICULUM PLAN — a multi-tenant product under TLC Therapy Solutions

**Status:** Layer 3 foundation (reference) — **DRAFT SCAFFOLD.** Read-only proposal. Awaiting licensed (LCSW) review + accredited-source validation before any module is built or taught.
**Author:** Claude Code (research + scaffold pass), 2026-06-23. Updated 2026-06-23 ×3 (Darrell: surface under **Practice** not Learn; plan as a phased **LMS**; then — plan as a **multi-tenant PRODUCT for any therapy office**, not just TLC).
**Brand / product:** **TLC Therapy Solutions** ([tlctherapysolutions.com](https://tlctherapysolutions.com)) — the LMS is a product *any* therapy office can adopt, under this brand. **Christina Poe, LCSW** (TLC's owner) is the **first tenant** and the design partner; the product generalizes from her practice's needs to any office (same pattern as the Church module generalizing from COLG, `COMMUNITY-FIRST-MISSION.md`).
**What this is:** a **multi-tenant practice LMS** — each therapy office is its own **tenant** (its own manager + therapists, its own data), adopting a **shared industry-standard curriculum catalog**, with each office's data and people **HARD-isolated** from every other office (HIPAA-adjacent; cross-tenant no-leak is critical — §"Multi-tenant product architecture"). Therapists take courses online to develop/improve their skills, with progress tracking.
**Reuse, don't rebuild:** courses reuse the existing **Learn course + generalized Presenter primitive** (`Presenter.jsx` + `lib/presentable.js`, shipped #289/#290) — every course is authored as scenes (audience text + presenter notes, no-leak). We **mount/surface** that engine inside each tenant's **Practice** tab; we do **not** rebuild it.
**Two dependencies stated up front (honest):** multi-tenant onboarding of *outside* offices **and** the manager-sees-therapists view both depend on the **unified roles/membership layer being designed separately** (the same Tier-C work the family-sharing review scoped). Cross-*tenant* isolation, by contrast, rides the tenancy model that **already exists and is partly live-verified** (§ below).

---

## ⚠️ HARD HONESTY BANNER — read this first, it governs the whole document

This document is a **course scaffold and an industry-standard topic outline.** It is **NOT accredited continuing education.** Read these four constraints as binding:

1. **No CEU / accreditation claim.** Nothing here grants CE/CEU credit. CE credit in this field is awarded only by **board-approved providers** (e.g., NASW, ASWB ACE, APA-approved sponsors, state-board-approved courses) — *this app is not one of them, and this plan does not make it one.* Every course below carries the tag: **"DRAFT — pending LCSW (Christina) review + accredited-source validation."**
2. **No fabricated clinical authority.** The clinical *substance* of any modality, protocol, or risk procedure is **owned by the licensed professional (Christina)**, not by this scaffold and not by the AI. Topics below are framed as *"industry-standard topics to cover,"* citing reputable bodies (APA, NASW, ACA, SAMHSA, state-board norms). We draft *structure and plain-language framing*; Christina supplies and signs off on the *clinical truth*. Per the repo Verification Doctrine: this is an **unverified-until-Christina-reviews** artifact, and it says so on its face.
3. **Per-tenant privacy boundary + HARD cross-tenant isolation.** This is **practice-private** content, living **inside each tenant's Practice tab** behind that tenant's firewall. It is **NOT** in the general Learn tab, **NOT** community-shared, **NOT** part of the COLG/church Learn courses, and **NOT** part of the public PoeTech catalog. Each office's data and therapists are **hard-isolated from every other office** (HIPAA-adjacent — see §"Multi-tenant product architecture"). It sits alongside the existing Practice surface, which already holds the line that **PHI stays in Acuity, never in SKOS** (`LEGAL-PRIVACY-BOUNDARY.md` + `ECOSYSTEM-PARTICIPANTS.md`, enforced in [Practice.jsx:5-8](../../app/src/components/Practice.jsx)). The brand (TLC Therapy Solutions) disclaims HIPAA/BAA on shared hosting (`project-brand-surface-hosting-map`) — so no client PHI ever appears in training content; these courses teach *practice*, never reference real clients.
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

## Placement — where this lives in the Practice tab (corrected per Darrell 2026-06-23)

**Situationally-right location:** co-located with where Christina's therapists already work — her **Practice** tab (TLC practice home, `Practice.jsx`), **not** the general Learn tab.

- **New sub-tab inside Practice — "Training" (working name).** The existing Practice surface holds pre-intake inquiries + pipeline ([Practice.jsx](../../app/src/components/Practice.jsx)); the LMS adds a **Training** sub-tab beside it. Same tab strip pattern the app already uses (reuse the shared `<TabScroll>` primitive, `project-tab-overflow-scroll-primitive`).
- **Reuse the Learn course + Presenter primitive — do NOT rebuild the engine.** Each course is authored as a `presentable` object (`lib/presentable.js`): an ordered list of **scenes**, each with audience-facing content + presenter notes, no-leak. The generalized Presenter (#289/#290) already renders any such course — it's the same engine The Word and the other Learn courses use. The Practice/Training sub-tab simply **mounts that Presenter** against the TLC course set. **No new presenter work; the gate is content sign-off, not engineering.**
- **Practice-private boundary holds at this location.** The Training sub-tab is gated to TLC staff/contractors (the same firewall the rest of Practice sits behind). It is NOT in the general Learn tab, NOT in the church/COLG catalog, NOT public.

**Sequencing note (honest):** the in-app wiring serializes behind the current monolith decomposition lanes (`project-new-surface-new-module`). Path: **(1) Christina inspects THIS doc → (2) she edits/authors the 🟡 substance → (3) courses authored as `presentable` scenes → (4) mounted in the Practice ▸ Training sub-tab behind the TLC firewall when the lane opens.** This doc is step 1.

---

## Multi-tenant product architecture — one catalog, many isolated offices

The LMS is a **product** under the **TLC Therapy Solutions** brand ([tlctherapysolutions.com](https://tlctherapysolutions.com)) that *any* therapy office can adopt. The model is **one shared curriculum catalog, many hard-isolated tenants.**

### The three layers

| Layer | What it is | Shared or per-tenant | Who owns it |
|---|---|---|---|
| **Catalog** | The industry-standard curriculum — the six courses + outlines in this doc, as reusable `presentable` templates. | **Shared** — any office adopts it. | TLC Therapy Solutions (the product); still **DRAFT** until accredited-source validation. |
| **Tenant** | One therapy office: its manager(s), its therapists, its enrollments, its progress/completion records, any office-specific customization of an adopted course. | **Per-tenant, hard-isolated.** | The office's own licensed clinical lead. |
| **Person** | A therapist within a tenant; sees their own courses + own progress. | Per-tenant, self-scoped. | The therapist. |

**A tenant adopts a catalog course, then its own licensed professional signs off the clinical substance for that tenant.** The catalog gives every office the same vetted *scaffold*; the 🟡 clinical substance is owned and signed off **per tenant by that office's own LCSW/clinical director** — because clinical responsibility, license type, and **state-specific** rules (mandated reporting, CE mandates, supervision) differ per office. TLC/Christina signs off for the TLC tenant; another office's clinical lead signs off for theirs. (And — restating the banner — **no tenant gets CEU/accreditation through this platform**; an internal completion record is not CE credit.)

### Hard cross-tenant isolation (HIPAA-adjacent — the critical requirement)

**Each office is its own tenant = its own `instance`.** This rides the tenancy model the app **already has**, where cross-tenant isolation is the *strength* of the design, not a gap:

- The boundary object is an **instance**; membership is `instance_members (instance_id, user_id, role)`; every data table's RLS gate is the single predicate **`user_in_instance(instance_id)`** ([schema-v2.1-infra.sql:124](../../infra/supabase/schema-v2.1-infra.sql)). A member of office A is **not** in office B's `instance_members`, so office A reads **zero** of office B's rows — structurally, at the database. Office-A-can't-see-office-B is exactly what binary membership gives you for free.
- The **outer no-leak wall is live-verified** in the cloud right now: an anonymous/unauthenticated caller gets `42501 permission denied` across the data tables (the `anon` role has no table grant at all, before RLS even runs). (`FAMILY-SHARING-PERMISSIONS-STATUS.md` §"Fail-safe verification" — live PostgREST probe, 2026-06-23.)
- **What must still be proven (DR-0076, proven-to-catch):** cross-*instance* isolation between two *authenticated* tenants is verified by the RLS predicate (code) + a prior service-vs-anon test, but has **not** been re-probed live with two real tenant accounts (the one PARTIAL in the family-sharing fail-safe table; family-sharing **GAP D**). For an HIPAA-adjacent product, that live two-tenant no-leak probe is a **ship gate**, not optional — a green test must *mean* tenant A cannot read tenant B.
- **No PHI crosses anyway:** training content is synthetic and references no clients (banner #2/#3); PHI stays in Acuity. So the isolation requirement protects *who-trained-what + roster + office identity*, and the synthetic-content rule means a worst-case leak still exposes no client PHI. Both walls, defense in depth.

### What multi-tenant adds on top of the existing model (the dependency)

The existing model isolates *between* tenants well. What it does **not** yet have — and what onboarding *outside* offices needs — is the **within-tenant roles/membership layer** (manager vs therapist, manager-sees-team-progress) **and** a **self-serve tenant-provisioning** path (today the only instances are the hard-coded family + per-user isolated `u-<uid>` instances; there is no "create a new therapy-office tenant and invite its therapists" RPC). **Both depend on the unified roles/membership layer being designed separately** — the same Tier-C work as family-sharing **GAP A** (binary membership → membership + differentiated roles + per-member visibility). This is the honest gating fact: *between-tenant isolation is ready; within-tenant management + outside-office onboarding are gated on the roles layer.*

---

## LMS phasing — this is a learning-management system, built in two phases

Darrell's scope: not just static courses, but an **LMS** so therapists do online training to develop/improve their skills, with progress tracking. Phased honestly by what each part *depends on*.

### Phase 1 — Courses + a therapist's OWN progress (near; builds on primitives we already have)

A therapist opens **Practice ▸ Training**, takes a course in the Presenter, and sees **their own** progress/completion. Everything Phase 1 needs already exists or is a thin addition:

- **Course delivery:** the reused Learn course + Presenter engine (above). ✅ exists.
- **Progress tracking via events-as-data:** course start / scene-advance / completion are recorded as **events** (the app's established append-only event-reel + events-as-data pattern, e.g. `_reel.jsonl` / JSONL event records and the `presentable` scene contract). A small `training_progress` record per `(user, course)` tracks "in progress / completed / when."
- **Self-scoped, so NO roles dependency.** A user reading **their own** progress rows is the safe, easy case — RLS-scoped to `auth.uid()` (or device-local for an un-instanced contractor). It does **not** require anyone to see anyone *else's* data, so Phase 1 is **not** blocked on the roles layer.
- **Tag:** 🟢 the LMS *plumbing* is draftable/buildable; the *course content* still carries its per-module 🟢/🟡 tags (Christina still owns the clinical substance before any course goes live).

**Phase 1 deliverable:** a working "take the course, track my own completion" loop inside Practice.

### Phase 2 — Enrollment/assignment + a manager view for Christina (GATED on the roles layer)

This is the real LMS management layer: Christina **assigns/enrolls** therapists in courses, and a **manager view shows her who completed what** (development tracking), with completion records / certificates.

- **Enrollment / assignment:** Christina assigns course X to therapist Y, with optional due dates.
- **Manager dashboard:** Christina sees a roster — who's enrolled, who completed, who's overdue — across all her contractors. This is *development tracking*, the point of an LMS.
- **Completion records / certificates:** a per-therapist record of completed courses (an *internal completion record* — **still NOT a CEU/accredited certificate**; see the honesty banner. A certificate here means "completed TLC's internal training," nothing more).

**⚠️ HONEST DEPENDENCY — Phase 2 is NOT free. It is gated on the practice-member roles model, which does not exist yet.** The "Christina-the-manager sees her therapists' progress" piece is **the exact same permission gap** the family-sharing review flagged as **Tier C**:

- Today tenancy is **binary `user_in_instance`** — a member sees **all** instance data or **none**; there is **no per-member partition and no differentiated role enforcement** in practice. Roles exist in the vocabulary (`owner/admin/member/viewer/specialist`) but the app does not use them to gate *who sees whose records*. (`FAMILY-SHARING-PERMISSIONS-STATUS.md` §"Architecture grounding" + **GAP A**, [schema-v2.1-infra.sql:124,225](../../infra/supabase/schema-v2.1-infra.sql).)
- A manager-sees-therapists model needs BOTH: **(a) a practice tenancy** — the 1099 therapists as *members of a TLC practice instance*, distinct from the `poe-family` instance (they are contractors, not family; that membership doesn't exist today), and **(b) role-gated cross-member visibility** — a `manager`/`owner` role that can read **other** members' progress while a `therapist` role reads only their own. In the current binary model, instance-scoping progress rows would make **every** therapist see **every** peer's progress (wrong default) — which is precisely why the granular roles layer is the blocker.
- This is **the same Tier-C build** as family-sharing **GAP A** (move from binary membership to membership + per-member/role-gated grants; new `shares`/role-gated policies; each migration **proven-to-catch** per DR-0076). **Phase 2 ships only after that roles layer lands** — it is not a separate small feature, it rides the same gate.

- **Onboarding *outside* offices rides the same gate.** TLC is the first tenant and can run Phase 1 within its own (existing) tenancy. Provisioning a *new* therapy-office tenant + inviting its therapists with manager/therapist roles is the **multi-tenant onboarding** path — which needs the same self-serve-tenant + roles work (see §"Multi-tenant product architecture"). So "sell it to another office" is Phase 2+, gated on the unified roles/membership layer, not Phase 1.

**Net:** Phase 1 delivers real value now (self-serve training + own-progress) within TLC's existing tenant, on existing primitives. Phase 2 (assignment + manager development-tracking + records + onboarding outside offices) is **explicitly gated** on the unified practice-roles/membership layer — the same Tier-C work the family-sharing review already scoped, being designed separately. We say so rather than implying the manager view or outside-office sales are near.

---

## Privacy & placement (binding)

- **TLC firewall, inside Practice.** These courses live in the **practice-private** Practice ▸ Training sub-tab, gated to TLC staff/contractors. NOT in the general Learn tab, NOT in the church/COLG catalog, NOT public.
- **No PHI, ever.** All examples are synthetic. PHI stays in Acuity, never in SKOS ([Practice.jsx:5-8](../../app/src/components/Practice.jsx)); per `project-brand-surface-hosting-map`, TLC carries a no-BAA/HIPAA-disclaimer hosting constraint; training content must never reference a real client.
- **Access tag for the build:** treat as `tlc-private` (analogous to the family-gated / no-leak pattern already used for private surfaces). Phase 2's manager view additionally requires the **role-gated** model above before any cross-member data is shown.

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

**End of plan.** This is a SCAFFOLD — a shared catalog for Christina (first tenant) and any adopting office's licensed lead to inspect, edit, and own per tenant. It claims no accreditation, grants no CE credit, hands the clinical substance to the licensed professional, and hard-isolates every office from every other — by design.

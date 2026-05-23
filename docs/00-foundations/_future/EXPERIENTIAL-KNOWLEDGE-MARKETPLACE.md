# Cross-Domain Experiential-Knowledge Counselor Marketplace — Vision Notes (FUTURE / UNRATIFIED)

> **STATUS: PARKING LOT.** This document captures the cross-domain marketplace vision approved in conversation on 2026-05-23. It is NOT a ratified foundation. It is NOT a committed plan. It is a structured holding place for vision so nothing is lost. Revisit when MVP-1 has shipped, the Counseling sub-tab is stable in production, and the first concrete cross-domain extension (likely landlord-to-landlord) is being scoped seriously.

> *"In an abundance of counsellors there is safety."* — Proverbs 11:14 (KJV)
>
> *"Iron sharpeneth iron; so a man sharpeneth the countenance of his friend."* — Proverbs 27:17 (KJV)

---

## What This Document Is

A vision sketch for **SKOS as a cross-domain marketplace of experienced practitioners** — where each role surface the OS prebuilds (church, rentals, legal, therapy, business, technology, more to come) carries a marketplace of practitioners in that domain who have **actually walked the road**, not just studied it. The Counseling sub-tab inside the Church surface is the prototype; the picker / routing / handoff pattern generalizes across every role SKOS prebuilds.

The differentiator is **experiential knowledge.** Credentials are welcome and useful. Lived experience is the bar.

This document is captured here honestly — including the hard parts (credentialed-care boundaries in regulated domains; the "degree-as-resistance" anti-pattern; the multi-tenant listing flow) — so the vision can be evaluated soberly later, not chased prematurely.

---

## Vision

SKOS prebuilds the OS for many roles a family or organization carries: church leader, landlord, attorney, therapist, business mentor, technology counselor, and **more to come — all who we want to prebuild this app for.** Each role surface includes a **marketplace of experienced practitioners** in that domain — people who have actually done the thing, who can be retained for counsel, mentoring, mediation, or hands-on advisory work.

The Counseling sub-tab inside the Church surface is the **prototype** of this pattern. Its **counselor-handoff picker** — pastor, elder, lay counselor, ministry leader (with free-text sub-domain), business mentor, Scripture teacher, technology counselor — is the first concrete cross-domain marketplace. The same picker / routing / handoff pattern generalizes to every other role surface SKOS ships.

The differentiator that makes this marketplace different from a credentials-first directory is **experiential knowledge — having actually done the thing — not credentials alone.** SKOS does not dispute the value of credentials. It refuses to make credentials the gate.

---

## The Two-Tier Model

The marketplace has two distinct kinds of participants, and the distinction is binding.

### Counselors — experience-grounded, value-providing

These are the practitioners users retain. They are listed because they have **walked the road** in their domain. A landlord-counselor has owned and operated rentals through real tenant cycles, real maintenance crises, real legal exposure, real tax seasons. A church-counselor has served in a counseling role with real saints in real situations under real leadership. A technology-counselor has built and run real systems for real organizations with real failure modes. **The listing is grounded in what they've done, not what they've studied.**

Credentials are welcome alongside that experience, and they add useful signal: a credentialed therapist who has *also* practiced for a decade is a stronger counselor than a credentialed therapist who has just licensed; a degreed CPA who has *also* worked a thousand small-business returns is a stronger counselor than one who has just passed the exam.

Darrell's own framing on 2026-05-23:

> *"I have an MBA-IT and a lot of certifications however my experience is the best because I can differentiate between how to explain something and how it impacts reality."*

That sentence is the test. The marketplace lists practitioners who can speak from how the thing *impacts reality*, not only how the thing is *explained in a book*.

### Knowledge-without-experience contributors — supporters and learners, not counselors

The marketplace also has a place for researchers, students, theory-builders, and credential-only specialists who **support and learn from the experienced** rather than serving as counselors themselves. A graduate student studying small-church technology adoption belongs in this tier. A theology PhD who has not pastored belongs here when the surface is pastoral counseling. A real-estate-licensing-test author who has never owned a rental belongs here when the surface is landlord counseling.

This tier is not dismissive. It is the apprentice and the scholar layer. Theory is valuable; book knowledge is valuable; credentials are valuable. The tier-two contributors **enrich the marketplace** by writing, researching, sharpening the experienced practitioners' frameworks, and being mentored toward eventually crossing into tier one through experience.

The binding rule: **a tier-two contributor is not surfaced as the user's counselor by default.** Their role is to support, not to lead.

---

## Named Anti-Pattern: "degree-as-resistance"

Darrell's lived example, 2026-05-23: he ran stores before getting his business degree. Some GMs with degrees couldn't keep up with what running stores actually required. He had to prove obvious things to them. And their degrees made them **resistant** to good-for-business action — the credential operated as a license to dismiss the practitioner's lived knowledge, rather than as a tool to amplify it.

This is the "degree-as-resistance" anti-pattern. It is the use of a credential to **deflect counsel** from someone whose lived experience speaks to the matter at hand. It shows up everywhere: in churches, in boardrooms, in clinics, in family businesses, in real-estate offices, in IT departments.

The product implication for SKOS's marketplace is sharp and specific. **The marketplace's job is not only to match seeker to counselor. It is also to design the handoff so the experienced practitioner can name an obvious-to-them thing without humiliating the credentialed seeker.**

Concretely, this means:

- The picker and handoff surfaces are warm — they do not frame the counselor as "superior to" the seeker, even when the experience gap is wide.
- The seeker's stated context (their role, their credentials, their stated question) is carried into the handoff so the counselor knows where the seeker is starting from.
- The counselor's response posture (drawn from `BEHAVIORAL-MIRROR.md` — DATA → TRUTH → IDENTITY → INVITATION) honors the seeker's identity even when the truth being named is something the credential should have already taught.
- **Drift to guard against:** the marketplace must not become a credential-verification engine that recreates the credentialism it was built to bypass. Verification of *experience* is in-scope; verification of *credentials* is acceptable but secondary; gating-on-credentials is forbidden.

Said another way: the marketplace exists in part *because* the degree-as-resistance pattern is real. If the product drifts into building elaborate credential checks while neglecting the experience claim, the product has lost its differentiator and quietly joined the problem.

---

## Initial Domains

These are the role surfaces SKOS prebuilds first, with the marketplace shape sketched for each. The pattern generalizes; the list is illustrative and intentionally incomplete.

### Church / spiritual

Counselors in the church (the canonical phrase per the 2026-05-23 vocabulary decision):

- **Pastor** — overall spiritual oversight.
- **Elder** — co-laboring oversight; the council in the local body.
- **Lay counselor** — trained, called, walking-alongside layperson.
- **Ministry leader** — with a free-text sub-domain capturing the actual ministry: *worship, children's, missions, hospitality, finance, audio-visual, building stewardship*, etc. The sub-domain is free-text on purpose; ministries do not all fit one taxonomy and SKOS does not pretend they do.
- **Business mentor** — for church-as-organization questions: budgeting, payroll, governance, lease negotiations, vendor management, scope-of-work agreements. The church operates as an organization whether or not it likes to admit it; this counselor exists to support that side without secularizing the church.
- **Scripture / Bible teacher** — book-knowledge as a counselor role, with the experiential layer being decades of teaching and watching what teaching does to real lives, not the credential.
- **Technology counselor** — the role Darrell's own church's technology department fills, **serving smaller churches that lack the systems understanding to deploy modern operational tools.** This is concrete: a small rural church or church-plant that's never had a database, never had a calendar that wasn't a paper printout, never had a media-library backup — the technology counselor walks alongside them.

### Therapy / clinical

TLC Therapy Solutions (Christina's practice) is the **licensed-care destination** routed to from the Practice tab and from the Counseling sub-tab's handoff banner. The boundary is sharp and binding:

- **This domain has state-board rules and credentialing requirements.** Licensure is not optional; experience-alone does not substitute for licensure in regulated clinical care.
- **The marketplace's bar in this domain is "experience-grounded AND credentialed,"** not experience alone.
- `LEGAL-PRIVACY-BOUNDARY.md` governs. Clinical content lives in Therapy Notes (the EHR); the SKOS surfaces are non-clinical.
- The marketplace does not list a "therapist counselor" alongside listings that bypass licensure. It lists licensed clinical practitioners with their credentials *plus* their experience surfaced clearly.

### Rentals / landlord

Landlord-to-landlord guidance for:

- **Operations** — listing, screening, lease drafting, move-in/move-out, maintenance vendor management, payments, deposits, fair-housing compliance.
- **Tenant management** — communication patterns, delinquency handling, mediation, eviction (legal-counsel handoff).
- **Regulations** — local ordinances, state law, federal fair-housing, common pitfalls.
- **The lived-experience differentiator:** a counselor who has owned five units through ten years of tenant cycles speaks differently from a real-estate-license-test author. The marketplace surfaces the difference honestly.

### Legal / attorney

Attorney-to-attorney consultation, and attorney-to-non-attorney for **directional questions** (not legal advice in a representation sense):

- **Same credentialing reality as therapy.** Attorneys must be licensed; the bar in this domain is experience-grounded AND credentialed.
- **Marketplace shape:** practicing attorneys with their bar admissions and their actual practice areas surfaced clearly — *"15 years of small-landlord-side eviction practice in Cook County"* is a different listing than *"licensed attorney, takes any case."*
- The legal-counsel handoff from inside other surfaces (a landlord with an eviction question, a church board with a contract question, a small-business owner with a partnership-dissolution question) routes into this domain.

### More to come

Darrell's phrasing, verbatim from 2026-05-23: *"all who we want to prebuild this app for."*

The list is open. Candidates already implicit in SKOS's existing surfaces or natural extensions:

- **Education / tutoring** — already partially surfaced in `PoeTech Tutors · Educator Marketplace` (vision-tier module in `PROJECT-FRAMEWORK.md` §3); the same experience-over-credentials posture applies (a parent who homeschooled four kids through dyslexia screening is a different counselor than a state-certified-but-never-taught individual).
- **Elder care coordination** — already partially surfaced in `Elder Care Coordination` (vision-tier module); a marketplace of family members and small-practice coordinators who have actually walked aging-parent care.
- **Trade contractors** — the `PoeTech Marketplace · Scope & Contractors` (vision-tier) lives adjacent to this idea; the scope-of-work-mediated trust shape extends to contractor-as-counselor for projects the seeker is doing themselves.
- **Nonprofit operations** — running a 501(c)(3) is a craft. Founders and ops directors who have done it are counselors for the next cohort.
- **Small-business owners** — generalists or specialists (retail, services, e-commerce, family-trade-businesses, etc.) who have run real businesses.

The point is the *pattern.* SKOS prebuilds the OS; each role surface gets its marketplace at the right time; the experience-over-credentials posture holds throughout.

---

## Paired Productized Services (Adjacent to the Marketplace, Not It)

Two service offerings live alongside the marketplace and are part of the same vision but are **not the marketplace itself.** They are productized services that an instance with a Technology Counselor role can sell.

### 1. Deliberate SKOS training

For smaller churches and organizations that don't have the systems understanding to deploy modern operational tools — the originating organization's **technology department trains them.** This is Darrell's own church's technology department's natural extension: instead of the smaller church figuring out SKOS alone, the technology counselors at the originating church walk them through it, deliberately, over a defined onboarding period.

The service shape: scoped training engagement, defined deliverables (the smaller organization is *running* SKOS at the end, not just *trained on* SKOS), a follow-up cadence for the first quarter, and a clear handoff to the smaller organization's own staff for ongoing operation.

### 2. Assisted procedure / process documentation

Capturing the smaller organization's **how-they-actually-do-it** so the procedure is repeatable, transferable, and **searchable inside their own SKOS instance.** Most small organizations have institutional knowledge trapped in three or four people's heads; if any of those people leaves, the organization loses the knowledge. This service captures the procedures and lifts them into the SKOS instance as searchable, structured documentation.

The service shape: interviews with the practitioners, structured documentation produced in the SKOS instance, the practitioners review and ratify the docs, the docs become the org's source of truth, and SKOS's existing patterns (auto-link, cross-surface continuity per `CONNECTED-CONTEXT.md`) make them easy to find.

Both services are revenue-positive for the providing instance, capability-positive for the receiving instance, and **principle-aligned** — they extend SKOS's reach without requiring the receiving organization to depend on any vendor relationship beyond the originating organization's chosen technology counselors.

---

## Open Product Questions (For Darrell + Christina + Team)

Answer these before serious build work on a v0 marketplace beyond the Counseling-sub-tab prototype.

1. **Discovery surface — how does a seeker find an experienced counselor in their domain?** Inside the seeker's SKOS instance, in the role surface for that domain, with what filters, search, browse, recommendation logic? Does the system surface counselors actively, or is it always seeker-initiated?

2. **Credential verification — "credentials welcome, experience required."** How do we verify the *experience* claim? Self-attested with public listings reviewable by peers? Endorsements from other counselors in the network (web-of-trust)? Verified-on-listing only for regulated domains (therapy, law, real-estate-licensed roles)? Some other shape?

3. **Pricing and booking flow.** Fee structure (counselor sets their rate? marketplace takes a percentage? subscription bundle?), scheduling (integrated with the Calendar surface already in SKOS?), payment (Stripe? in-app? off-platform?). The SKOS posture is to offer light infrastructure that supports the relationship rather than mediate it heavily.

4. **Ratings and reviews.** What does honest feedback look like in a church or business context **without becoming Yelp?** Yelp-style public five-star reviews would distort the relational shape of counseling. Reputation needs to exist somehow; the form matters.

5. **Geographic vs. virtual.** Local-only, remote, hybrid? The Counseling-sub-tab prototype is virtual / asynchronous-first. A landlord counselor for Cook County rental practice may need to be local. Different domains have different defaults; the marketplace should support all three modes.

6. **Multi-tenant — when an instance wants to list its leaders as counselors for other instances.** When PoeTech (Darrell's own SKOS instance) wants to list the Poe-family-church's technology counselors as available for smaller churches, what's the **listing flow**? Does the listing live in PoeTech's instance with cross-instance discovery? In a central marketplace surface? Federated across instances? `MULTI-INSTANCE-STRATEGY.md` is the foundation here; the marketplace builds on it.

7. **Liability and consent boundary.** Counseling that isn't licensed therapy still has duty-of-care implications. A landlord counselor giving bad advice can cost real money; a church counselor speaking out of their lane can cause real harm. What **disclaimers and consent flows** ship with each domain's marketplace? `LEGAL-PRIVACY-BOUNDARY.md` and `EXCELLENCE-STANDARD.md` set the floor; specific copy and gating per domain need to be designed.

---

## Sequencing — When To Revisit

This document should NOT be acted on now beyond the existing Counseling-sub-tab prototype. Generalizing the marketplace before the prototype is live and the production AI infrastructure is sovereign would violate the diligent-not-hasty principle.

**Suggested revisit triggers:**

1. PR #3 (the Counseling sub-tab MVP) has merged and the counselor-handoff picker has been live for at least one quarter.
2. MVP-1 (Sovereign Family Financial OS) has shipped and is stable.
3. The AI infrastructure has reached at least Phase 2 of `AI-INFRASTRUCTURE-SYNOLOGY.md` (hybrid: small models local, hosted for main response) so the marketplace's matching / discovery surfaces have a sovereign brain to run against.
4. A concrete second-domain demand has surfaced — most likely a landlord-to-landlord pilot inside the Poe Properties surface, or the Poe-church technology counselors being requested by another small church.
5. The open questions above have been answered, at least directionally.

Until then: **this vision is parked here, safe, and waiting.** The Counseling sub-tab continues to be the live prototype. Everything beyond it is captured, not chased.

---

## Connection to Existing Foundations

| This Document | Connects To |
|---|---|
| The intellectual spine the marketplace's pastoral domain serves | `../_root/THE-HOLY-SPIRIT-INTEGRATION-WORLDVIEW.md` |
| The reactive response posture every counselor-AI surface follows | `../_root/BEHAVIORAL-MIRROR.md` |
| The bright line that keeps the marketplace's clinical domain honest | `../_root/LEGAL-PRIVACY-BOUNDARY.md` |
| The first concrete prototype of the picker / handoff pattern | `../_root/COUNCIL-CHAMBER.md` |
| Vocabulary alignment — "counselors in the church" | `../_root/COUNCIL-CHAMBER.md` (Pathway 3) |
| The quality bar applied to every counselor-listing surface | `../_root/EXCELLENCE-STANDARD.md` |
| The Test (Philippians 4:8) applied to every counselor-facing surface and copy | `../_root/MIND-OF-CHRIST.md` |
| The multi-tenant story this marketplace federates across | `../../01-architecture/MULTI-INSTANCE-STRATEGY.md` |
| The ecosystem cast the marketplace serves | `../_root/ECOSYSTEM-PARTICIPANTS.md` |
| The sovereign hosting that enables this without vendor lock-in | `AI-INFRASTRUCTURE-SYNOLOGY.md` |
| The hardware that unlocks Phase 3 sovereign AI for the matching layer | `AI-INFRASTRUCTURE-HARDWARE-OPTIONS.md` |
| The sibling future / unratified initiative doc this matches in format and voice | `MARKETING-PIPELINE-NOTES.md` |
| The Counseling sub-tab task card — the live prototype | `../../01-architecture/task-cards/2026-05-22-counseling-subtab-inside-church.md` |
| The handoff card that captures the cross-domain picker decisions | `../../01-architecture/task-cards/2026-05-23-handoff-counseling-card.md` |
| The living spine | `../../PROJECT-FRAMEWORK.md` |
| The meta-frame everything serves | `../_root/THE-WAY.md` |

---

## Religion AND Relationship in This Vision

**Religion-side:** A binding two-tier model that refuses to let knowledge-without-experience masquerade as counsel. A named anti-pattern (degree-as-resistance) and a binding rule against drifting into the credentialism the marketplace exists to bypass. Domain-specific bright lines: therapy and law are licensed; the marketplace honors that. Disclaimers, consent flows, and duty-of-care surfaces designed per domain. The Test (Philippians 4:8) applied to every counselor listing and every handoff copy. *"In an abundance of counsellors there is safety"* — but only counsellors who have walked the road.

**Relationship-side:** The seeker is met by someone who has actually done the thing. The seeker's identity is honored even when the counsel is corrective. The credentialed-seeker who needs to hear an obvious-to-the-experienced thing is met with warmth rather than humiliation. The technology counselor at the Poe-family-church can extend their care to a smaller church that has never had this kind of support. The landlord with a tenant crisis at 11 PM on a Tuesday can find another landlord who has been there. *"Iron sharpeneth iron"* — but only when both pieces of iron have been forged in the fire.

Both.

---

*See also:* `MARKETING-PIPELINE-NOTES.md` (sibling future doc — owner-operator marketing automation), `AI-INFRASTRUCTURE-SYNOLOGY.md` (the sovereign hosting that enables this), `AI-INFRASTRUCTURE-HARDWARE-OPTIONS.md` (the hardware that unlocks Phase 3 sovereign matching), `../../01-architecture/task-cards/2026-05-22-counseling-subtab-inside-church.md` (the live prototype), `../../PROJECT-FRAMEWORK.md` (the living spine — read first), `../_root/THE-WAY.md` (the meta-frame).

**This document is UNRATIFIED and FUTURE. Do not act on it without deliberate evaluation at the revisit triggers above.**

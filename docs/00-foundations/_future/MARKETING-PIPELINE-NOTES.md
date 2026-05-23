# Marketing & Promotion Pipeline — Vision Notes (FUTURE / UNRATIFIED)

> **STATUS: PARKING LOT.** This document captures ideas for later evaluation. It is NOT a ratified foundation. It is NOT a committed plan. It is a structured holding place for vision so nothing is lost. Revisit when SKOS reaches the maturity to evaluate it seriously — likely once MVP-1 (the Sovereign Family Financial OS) has shipped, the Counseling sub-tab is stable, and the AI surfaces have proven safe at scale.

> *"Whatever your hand finds to do, do it with your might."* — Ecclesiastes 9:10 (ESV)
>
> *"Let everything be done decently and in order."* — 1 Corinthians 14:40 (ESV)

---

## What This Document Is

A vision sketch for an **AI-foundational marketing and promotion pipeline** that supports owner-operators (Christina's TLC Therapy Solutions first; any future SKOS-powered business owner second) by running the *necessary, repeatable* marketing work — daily logs to social media, SEO, engagement measurement, growth tracking — so the owner can spend their time on the work they were called to do, not on the marketing scaffolding around it.

The end state: **an AI that has learned the owner's voice and taste well enough that it can run the marketing function on autopilot**, with the owner reviewing periodically rather than approving every post. Sustainable, durable growth driven by the right kind of consistency, without the owner becoming a content-production engine.

This document is captured here honestly — including the hard parts — so it can be evaluated soberly later, not chased prematurely.

---

## Vision

Christina is a licensed clinical therapist running TLC Therapy Solutions. Her time is best spent on clinical work, supervision of her clinical team, and the family she leads with Darrell. Her time is **not** best spent crafting Facebook posts, optimizing SEO meta-tags, replying to social-media comments, and measuring funnel conversion week over week. Today, much of that work either doesn't happen or happens at the cost of more important work.

The pipeline is the answer. An AI assistant that:

1. **Learns Christina's voice and taste** from a small set of approved samples and from her ongoing feedback on drafts (thumbs-up / thumbs-down / "more like this" / "less like that").
2. **Drafts daily logs** — short Facebook posts, Instagram captions, LinkedIn updates, blog seeds — drawing from a defined source of subject matter (see open question on source).
3. **Routes drafts for approval** through a clear queue, with one-click approve, edit-and-approve, or reject.
4. **Measures what works** — reach, engagement, click-through, booked-session lift, qualified-lead lift — and feeds the measurement back into the drafting loop so the system gets sharper over time.
5. **Supports SEO** on the owned web property (`tlctherapysolutions.me`) and across social-side discovery surfaces.
6. **Becomes reusable framework** — once the pattern is proven with Christina's business, the same pipeline supports any SKOS-powered business owner (a contractor, a property-manager, a therapist, a nonprofit) with their own voice, their own brand, their own measurement goals.
7. **Eventually runs autonomously** — Christina sets the strategy and reviews periodically; the system runs the daily and weekly cadence on its own, surfacing exceptions and decisions she needs to make rather than asking her to drive every post.

The arc is: **AI learns owner's taste → AI drafts under owner's approval → AI posts autonomously with owner's periodic review → AI adjusts based on measurement → sustainable growth.**

---

## Why This Matters

Two reasons, both equally serious.

**For Christina specifically.** Her practice serves a population that genuinely needs faith-integrated clinical care — multicultural, Illinois-based, often underserved by mainstream therapy. The bottleneck on her impact is not her clinical skill; it is *discovery*. If a person who needs her doesn't know she exists, the clinical excellence doesn't reach them. Marketing — the *right* kind of marketing — is how those people find her. Today the marketing work is sporadic; with this pipeline it becomes durable.

**For every owner-operator who'll use SKOS in the future.** The pattern Christina's pipeline establishes — voice-learned AI marketing, measurement-driven, owner-light — is reusable for the small-business owners who are SKOS's natural ecosystem. A contractor doesn't have time to post daily updates about projects. A property manager doesn't have time to write rental listings that actually convert. A nonprofit director doesn't have time to maintain a donor-communication cadence. The pipeline gives every owner the marketing function of a much larger organization, without the headcount.

Religion AND relationship: marketing that *serves the audience genuinely*, not marketing that manipulates. Generosity as strategy (per `MEDIA-ENGINE-NOTES.md` Approach 5). The owner's voice, not a generic SEO-optimized blandness. Authentic, consistent, sustainable.

---

## In-Scope Capabilities (Initial Pass)

These are the capabilities the pipeline should eventually deliver. Order of build is sketched in the phased delivery section below.

- **Daily-log generation** — short-form posts (Facebook, Instagram, LinkedIn) drafted from a defined daily input source.
- **Multi-platform posting** — Facebook first per founder direction; additional platforms (Instagram, LinkedIn, X, possibly threads) added per priority decision.
- **Taste-learning loop** — feedback signal (approve / edit / reject + free-text "why") flows back into the drafting model's context, so each subsequent batch is closer to the owner's voice. Seed from a starter set of approved samples (see open question on brand voice baseline).
- **Approval workflow** — explicit owner approval (Christina alone, or Christina + Darrell, per open question). No autonomous posting in Phase 0–1.
- **Scheduling and posting** — once approved, posts go to the correct platform at the time the schedule says, without further intervention.
- **SEO support** — for the owned site (`tlctherapysolutions.me`): meta tags, schema markup, alt text, internal linking suggestions. For social: hashtag research, posting-time optimization, audience-overlap analysis.
- **Engagement handling — drafting only, not autonomous send.** When followers comment or DM, the system drafts a response in the owner's voice for the owner to approve. (Autonomous reply is explicitly **out** in early phases — see non-goals.)
- **Growth and sustainability measurement** — a dashboard surface (likely a new sub-tab in the owner's SKOS instance) showing follower trends, engagement rates, booked-session lift (for Christina; configurable per business type for future owners), and a *"is this pipeline sustainable"* health score that flags cadence drift, voice drift, or measurement plateau.
- **Compliance rails per business type** — for Christina specifically, state-board rules on licensed-therapist marketing must be encoded (no false testimonials, no specific outcome claims, no before-and-after framing of clinical work, etc.). See open question on compliance scope.

---

## Non-Goals (To Prevent Sprawl)

- **No clinical content.** This pipeline does not generate, post, or summarize anything that touches a client's identity, presentation, treatment, or care. Clinical content belongs in Therapy Notes (per `LEGAL-PRIVACY-BOUNDARY.md`); it does not enter the marketing layer. Ever.
- **No 1:1 impersonation of Christina.** The AI does not reply to a specific client as if it were Christina. Owner-voice marketing posts are a *broadcast* surface (one-to-many); 1:1 client communication remains human-only, in the regulated channels TLC already uses.
- **No autonomous posting in early phases.** Phases 0 through 2 are owner-approval-required. Phase 3 introduces autonomous posting only after the taste-learning loop has proven stable on a measurable cadence (see phased delivery below).
- **No fabricated testimonials, no fake engagement, no purchased followers.** Generosity-as-strategy, not manipulation-as-strategy. If the system drafts a testimonial-shaped post, it must be sourced from a real, consented testimonial — never fabricated, never composited.
- **No content that violates professional licensure rules.** State-board restrictions on what licensed therapists can say in marketing are encoded into the prompt rails (see open question on compliance scope).
- **No replacement of the owner's judgment.** Even at full autopilot, the owner retains review authority and can override, pause, or redirect the pipeline at any time. The system serves the owner; the owner does not serve the system.
- **No spillover into Counseling.** This pipeline is separate from the Council Chamber surface and never references, draws from, or summarizes any pastoral-counseling content from inside the SKOS PWA. Bright line.

---

## Phased Delivery Sketch

Each phase ends with a deliberate go/no-go decision. The owner can pause indefinitely at any phase boundary; nothing about the pipeline assumes forward momentum the owner hasn't approved.

### Phase 0 — Taste-Learning Foundation

- Christina submits **N approved samples** (proposed N = 20–30 posts, drawn from her existing FB feed and any prior LinkedIn content) that represent her voice at its best.
- Christina also submits 5–10 *anti-examples* — posts in her industry that she explicitly does not want her voice to resemble. The contrast sharpens the model.
- The system stores these as the **voice baseline**.
- One-time setup; no ongoing daily cadence yet.
- **Go/no-go decision:** has the system captured enough signal to draft something Christina would actually approve? Test on five blind drafts. If she approves ≥ 3/5 with light edits, proceed to Phase 1. If not, expand the sample set.

### Phase 1 — Owner-Approved Drafts

- System drafts daily-log candidates at a defined cadence (proposed: 3–5 drafts per week, one platform — Facebook).
- Christina reviews each draft with one-click approve / edit-and-approve / reject + optional one-line "why this didn't work."
- Approved drafts are posted on schedule; rejected drafts feed the taste-learning loop.
- **Go/no-go decision:** after 4 weeks, what is the approval rate? What is the engagement trend? If approval rate is ≥ 70% and engagement is at least flat (not declining), proceed to Phase 2.

### Phase 2 — Multi-Platform Drafts + Engagement Drafts

- Add the next platform per priority (Instagram or LinkedIn per open question).
- System begins drafting *replies* to incoming comments and DMs (drafts only — owner still approves before send).
- Cross-platform consistency check — the voice is the same regardless of platform; cadence is platform-appropriate.
- **Go/no-go decision:** is the owner's approval-time burden actually decreasing per post? Is the voice consistent across platforms? If yes, proceed to Phase 3.

### Phase 3 — Autonomous Posting with Periodic Review

- For categories the owner has approved as low-risk (e.g., a re-share of a TLC scheduling link with a stock caption, a quote from a public faith-integrated source the owner has pre-vetted), the system posts autonomously.
- Higher-risk categories (new positioning, client-adjacent content, anything the compliance rails flag) still require owner approval.
- Weekly review surface: the owner sees what was posted, what engagement it earned, and any anomalies.
- **Go/no-go decision:** after a quarter of Phase 3 operation, is sustainable growth occurring per the measurement criteria? Is the owner's review burden truly periodic, not daily? If yes, the pipeline is considered Phase-3-mature for Christina.

### Phase 4 — Reusable Framework for Future SKOS Owners

- The pipeline is generalized from "Christina-specific" to "owner-template-driven." A new owner (a contractor, a property manager, a future therapist) onboards by completing the Phase-0 taste-learning step with their own samples; the pipeline then runs the same phased delivery for them.
- Industry-specific compliance rails are templated (therapist rails for licensed clinical work; contractor rails for trade-license claims; nonprofit rails for 501(c)(3) communication discipline; etc.).
- This is the SKOS pattern: build it sovereignly for the home instance first, then generalize for the ecosystem.

---

## Connection to Existing Foundations

| This Document | Connects To |
|---|---|
| The owner this is built for (Christina), her clinical practice, the bright line | `../_root/LEGAL-PRIVACY-BOUNDARY.md` |
| The principle that this is for owner-operators across the ecosystem | `../_root/ECOSYSTEM-PARTICIPANTS.md` · `../_root/MULTI-INSTANCE-STRATEGY.md` |
| The intellectual spine of any faith-content prompt rails (see note below) | `../_root/THE-HOLY-SPIRIT-INTEGRATION-WORLDVIEW.md` |
| The quality bar for all content the pipeline drafts | `../_root/EXCELLENCE-STANDARD.md` |
| The Test applied to every drafted post before approval | `../_root/MIND-OF-CHRIST.md` |
| Visual identity rails for any image content | `../_root/VISUAL-IDENTITY.md` |
| The meta-frame everything serves | `../_root/THE-WAY.md` |
| Scripture citation if any drafted post quotes scripture | `../_root/SCRIPTURE-REFERENCE-STANDARD.md` |
| Sister vision doc — the content-creation engine for narrative IP | `MEDIA-ENGINE-NOTES.md` |
| Bright line between marketing surface and pastoral surface | `../_root/COUNCIL-CHAMBER.md` |

### Note on faith-content prompt rails (not in-scope for Christina's TLC pipeline)

Christina's TLC Therapy Solutions practice is clinical and secular — the licensed-therapist marketing rails (state-board rules on testimonials, outcome claims, modality boundaries) are the binding ones for her pipeline, not faith-content rails. **However**, when this pipeline generalizes to a faith-based business owner (Phase 4+: a pastor, a ministry director, a faith-based nonprofit, a Christian counselor), the AI's prompt rails for any faith-content drafting must derive from `../_root/THE-HOLY-SPIRIT-INTEGRATION-WORLDVIEW.md` — the same foundational text that grounds the Counseling sub-tab's AI response posture. That doc carries the two drift tests (the **relationship-or-the-receiving test** and the **first-death test**) and the four-section sequence (DATA → TRUTH → IDENTITY → INVITATION per `../_root/BEHAVIORAL-MIRROR.md`). A faith-based owner's marketing voice should not drift into either the prosperity-gospel framing (the King as a means to outcomes) or the self-help-with-Scripture-branding framing (integration as additive to self-directed life). The Worldview drift tests catch both. Out of scope for this initiative doc to specify the mechanism; in scope to flag that the prompt rails *exist* and *where* they derive from when the moment comes.

---

## Sequencing — When To Revisit

This document should NOT be acted on now. Pursuing a marketing-automation pipeline while MVP-1 is still landing — and while the Counseling surface itself is unbuilt — would violate the diligent-not-hasty principle.

**Suggested revisit triggers:**

1. MVP-1 (Sovereign Family Financial OS) has shipped and has stable users.
2. The Counseling sub-tab has shipped and the AI-pastoral-response pattern has proven safe in production for at least one quarter.
3. Christina has explicitly named marketing automation as her next-highest-leverage initiative.
4. There is bandwidth to support a Phase-0 taste-learning effort (Christina's time on the 20–30 sample submission; design time on the approval surface).

Until then: **this vision is parked here, safe, and waiting.** Nothing is lost. Everything is captured. The diligent plan; they do not rush.

---

## Open Questions Master List (for Darrell + Christina to answer before any task card is written)

1. **Platform priority.** Facebook is named first by Darrell. What's the second platform — Instagram, LinkedIn, X, Threads? In what order beyond that? Each platform has its own cadence, format, audience overlap, and posting API; we don't want to design for all of them simultaneously.

2. **Source of daily logs.** Where does the day's content come from? Options to evaluate:
   - (a) Christina's own daily journal / reflections she's already capturing.
   - (b) Therapy Notes scheduling events (anonymized — *"the practice saw N new intakes this week in the X area"* with no client identifiers, ever).
   - (c) Curated faith / mental-health content the system surfaces for Christina to react to.
   - (d) A defined editorial calendar Christina sets at the start of each month.
   - (e) Some combination.

   This is foundational — the pipeline can't draft without an input.

3. **Brand voice baseline.** Does Christina already have written samples that capture her at her best (existing FB posts, blog drafts, marketing copy she's previously written or approved)? Or do we start from scratch and build the baseline through Phase 0's 20–30 approved samples? How many anti-examples can she supply?

4. **Approval workflow.** Single-owner approval (Christina alone), dual (Christina + Darrell as a check-and-balance), or other? How quickly does she expect to turn around approvals — same day, within 48 hours, weekly batched?

5. **Measurement — what defines "growth" for her business.** Options to choose among (likely a weighted combination):
   - Follower count and follower quality (engaged vs. ghost followers).
   - Engagement rate (likes, comments, shares per post).
   - Click-throughs from social to the TLC site.
   - **Booked sessions** (the actual business outcome).
   - Qualified leads (inquiry-form completions, "I'd like to schedule" emails).
   - Revenue trend month over month.
   - Christina's *own subjective sense* of whether the marketing feels healthy.

6. **SEO scope.** Site-side (`tlctherapysolutions.me`), social-side, or both? Site-side requires write access to the TLC website's CMS or hosting platform — what's the current setup, and is automated change-pushing acceptable, or is SEO Phase-2-only after the social cadence is stable?

7. **Multi-tenant generalization timing.** Build the whole thing for Christina first and then generalize (faster Phase-0 to Phase-3 timeline for her; refactor cost later), or design multi-tenant from day one (slower start, cleaner ecosystem story)? Both are defensible.

8. **Compliance / ethics rails for licensed therapists.** Are there specific state-board (Illinois LCSW) rules on marketing that we must encode into the prompt rails — restrictions on testimonials, specific-outcome claims, before-and-after framing, claims of efficacy, mentions of specific modalities the clinician isn't licensed for, etc.? Christina is the authority on this; we should not guess. (Equivalent rails will be needed per business type when this generalizes — contractor licensing rules, nonprofit communication discipline, etc.)

9. **Engagement-reply autonomy threshold.** At what point — if ever — does the system reply autonomously to comments/DMs without owner approval? Phase 2 is "drafts only." Phase 3 introduces autonomous posting for low-risk *outbound* content. Should there ever be autonomous *reply* behavior? Christina's call; the default-no posture is the safe one.

10. **Content boundaries with the Counseling surface.** The bright line is named in the non-goals above (the marketing pipeline never draws from or references Counseling content). Confirm this is right; flag any nuance.

11. **Capital and time investment.** What's the budget for paid tooling (social-scheduling APIs, SEO tools, hosted STT, etc.) and what's the time budget for Christina's Phase-0 sample submission? Patient-capital framing per `MEDIA-ENGINE-NOTES.md` — small start, sustainable build.

---

## Religion AND Relationship in This Vision

**Religion-side:** Disciplined sequencing. Owner-approval-required in early phases. Compliance rails encoded at the prompt level. Bright line to clinical content held strictly. Measurement-driven feedback loop. The Test (per `MIND-OF-CHRIST.md`) applied to every drafted post: is it TRUE, HONORABLE, JUST, PURE, LOVELY, COMMENDABLE, EXCELLENT, PRAISEWORTHY before it goes out under the owner's name?

**Relationship-side:** The owner's voice, not a generic AI voice. The owner's audience served, not manipulated. The owner's calling protected — Christina spends her time on clinical work, not on marketing scaffolding. Generosity as strategy. The same support eventually extended to every owner-operator the SKOS ecosystem serves.

Both.

---

*See also:* `MEDIA-ENGINE-NOTES.md` (the sister vision doc — narrative content engine), `../_root/EXCELLENCE-STANDARD.md` (the quality bar), `../_root/LEGAL-PRIVACY-BOUNDARY.md` (the bright line that keeps clinical content out of marketing), `../_root/THE-WAY.md` (the meta-frame).

**This document is UNRATIFIED and FUTURE. Do not act on it without deliberate evaluation at the revisit triggers above.**

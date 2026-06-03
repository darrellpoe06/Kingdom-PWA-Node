# Conversational Space Architecture -- Saving Souls Through Competent Conversations

> *"We destroy arguments and every lofty opinion raised against the knowledge of God, and take every thought captive to obey Christ."* -- 2 Corinthians 10:5 (ESV)

> *"Rather, speaking the truth in love, we are to grow up in every way into him who is the head, into Christ."* -- Ephesians 4:15 (ESV)

**Layer 3 reference document (ICM).** Skeleton binding for the PoeTech conversational discussion space. Specializes `COUNCIL-CHAMBER.md` (the private listening room) into a public many-to-many room; governed by `DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md`, `PERPETUAL-PIPELINE-HEALTH.md` (Role 10 Quality Gatekeeper), and the Word-first/Body-undivided framework (`project_non_denominational_word_first_body_undivided`); read through the worldview spine and `CLAUDE.md`. Research basis: `docs/99-session-notes/2026-06-03-research-review-marketplace-conversational-space-youtube-1jByzKI.md`. **Status: skeleton -- binding direction + architecture + moderation framework; implementation is post-vacation, multi-week.**

---

## 1. The binding direction (Darrell, 2026-06-03, verbatim)

> "a conversational space where the discussions of users can be in one place with links from various platforms are able to be discussed so clarity from all these doctrines of demons can be collectively understood and discussed in the open platform of PoeTech for saving souls through competent conversations based on Yahweh's principals instead of left right or east west or any they them scenarios other than the 4th dimensional vs 3rd dimensional framework from the King Jesus."

> "With the ability to click and like love not like and communicate below the story or link as a user."

> "These are the types of conversations we offer across all industries and platforms so we can discuss the higher level through Yahweh's perspectives explicitly and almost disrespect any other view because it's a lie."

---

## 2. The frame -- the 4th-vs-3rd dimension, backbone AND warmth

The only legitimate axis is **4th-dimensional (things above, Yahweh's perspective) vs 3rd-dimensional (flesh, lineage, geography, partisanship)** -- explicitly NOT left/right, east/west, or they/them.

- **ESV -- Colossians 3:1-2:** *"Seek the things that are above... Set your minds on things that are above, not on things that are on earth."* (The 4th-vs-3rd axis in Pauline language.)
- **ESV -- Galatians 3:28 / Colossians 3:11:** the 3rd-dimensional dividing categories are dissolved in Christ, not weaponized.

**The "almost disrespect any other view because it's a lie" rule, held precisely:** **maximum backbone toward the lie, maximum warmth toward the soul.**
- **Backbone (1 Timothy 4:1):** the doctrines of demons are named plainly. The lie is exposed, refused, not flattered.
- **Warmth (Ephesians 4:15; Colossians 4:6; 2 Timothy 2:24-25):** *correcting opponents with gentleness* -- because the goal is *their repentance*, their soul home with the Father. The lie is disrespected; the person is pursued.

A space that crushes the person to win the point has lost the Father's Business even when right about the lie. This is the Council Chamber's krino-not-katakrino distinction (discernment with the user, never condemnation against them) applied to public discussion.

---

## 3. The decision -- thin-custom on Postgres

**RECOMMENDATION: Build thin-custom on the existing PoeTech Postgres -- do NOT fork a forum engine.** Copy Lemmy's proven data model, render native React in the PWA, moderate through n8n.

Why not fork: Lemmy (AGPL + Rust + federation-first -- all wrong); Discourse (heavy Rails, iframe-only embed); Coral (best moderation but MongoDB, breaks Postgres-only sovereignty); Comentario (Postgres+MIT but no reactions, no link-feed). The schema + moderation flow are well-trodden -> multi-week MVP, not a research project.

### 3.1 Data model (Lemmy-proven, on PoeTech Postgres)

- `submission(id, creator_id, url, body /* the take */, embed_title, embed_description, thumbnail_url, embed_video_url, visibility DEFAULT 'community', industry, score, created_at)` -- one row = external link + the submitter's take + oEmbed preview.
- `comment(id, submission_id, creator_id, content, path LTREE /* materialized-path nesting */, child_count, status, removed, created_at)` -- enable the Postgres `ltree` extension.
- `reaction(user_id, target_type, target_id, reaction_type ENUM('like','love','not_like'), created_at)` UNIQUE`(user_id, target_id)`.
- `private_note(id, owner_id, submission_id, content, visibility DEFAULT 'private')` -- owner-scoped (PIN-locked).
- `moderation_event(target_type, target_id, classifier_decision, rationale, scripture_anchor, status, resolver_id, created_at)` -- the moderation audit trail (Lemmy's `*_report` pattern).

### 3.2 Reactions -- like / love / not-like without a pile-on

`not_like` is a **gentle, private/aggregate-only affect signal** -- it does NOT subtract from a public score, trigger auto-hide, or demote ranking. UX research is clear: visible negative tallies on *attributed* posts are the harmful variable; PoeTech posts are attributed. The bite goes on the *lie* via moderation, never on the *person* via a pile-on. (Satisfies "not like" precisely while honoring 2 Tim 2:24.)

### 3.3 Visibility -- community-default, private-note locked (Postgres RLS)

A `visibility` column (`private | community | public`) enforced at the database layer with **Row-Level Security** -- a policy keyed on `current_user = creator OR (visibility='community' AND member) OR visibility='public'`. RLS filters rows *before they leave the database*, so a private note stays locked even if an app query forgets to filter. (Same pattern as the live PIN-locked Testimony Diary, fix-list D21.) Per `project_pin_optional_community_default`.

### 3.4 Federation -- stay walled (no ActivityPub at launch)

Federation broadcasts votes and pushes data to servers PoeTech does not control, and remote instances ignore local moderation settings (the Lemmy cautionary case). Launch walled. Federation is a later, optional, outbound-only consideration -- never the default ingestion path. (Adopting it would be Tier 4; declined.)

---

## 4. The moderation framework -- truth-grounded, intent-aware, human-in-the-loop

This is the heart. Filter the doctrines of demons WITHOUT silencing the honest seeker (John 6:39 -- lose none).

**The wrong tool: a context-blind toxicity score** (Perspective API). It scores in isolation, ignores intent, systematically over-flags, and would silence sincere doubt and pointed-but-loving correction. **Do not use as the primary gate.**

**The right pattern -- n8n-native post-moderation with a fast pre-gate (this IS the Quality Gatekeeper, wf36, extended to user content):**

1. **On submit** -> `status = pending` (author-visible only).
2. **n8n fires:**
   - **Reflex filter:** free **OpenAI Moderation API** (13 categories) blocks clear hate/violence/CSAM instantly.
   - **Worldview classifier:** the per-industry sovereign LLM team (Word-first/Body-undivided), prompted against the truth-grounded standard. Reasons about *intent and context* (unlike Perspective) -- distinguishes honest seeking from bad-faith attack. Returns `{decision: approve|warn|hold, rationale, scripture_anchor}`. **The 4th-vs-3rd frame lives in this system prompt** (Col 3:1-2, Gal 3:28, Word-first, krino-not-katakrino).
3. **warn -> warn-then-edit** (Coral pattern): surface the rationale + a Scripture mirror; let the user revise before posting.
4. **hold -> human-in-the-loop queue** (governance per `GOVERNANCE-EXECUTION-ADVISORY.md`): a family/moderator approves or rejects. LLM augments, never replaces, human judgment.
5. **Reactive flags** post-publish feed the same queue.

**How this enforces "disrespect the lie, honor the person":** the classifier flags the *pattern* (the doctrine, the lie, the 3rd-dimensional framing) and drafts a gentle, Scripture-anchored correction aimed at understanding -- never a condemnation of the person. Flagged content doesn't vanish silently; the seeker gets the Word as a mirror and a chance to engage. Bite on the argument (2 Cor 10:5), warmth on the soul (2 Tim 2:25).

---

## 5. Integration -- Council Chamber + Family Worldview Commentary

- **Council Chamber** (`COUNCIL-CHAMBER.md`) is the *private 1:1* listening room; this space is the *public many-to-many* room. The same **four-section posture** (Hear -> Mirror -> Anchor -> Invite) governs moderated responses. Bidirectional `links[]` per `CONNECTED-CONTEXT.md` -- a private vent can become a shared discussion; a heavy public thread can route a user into the private Council Chamber. The MODE-ROUTING classifier already distinguishes the modes.
- **Family Worldview Commentary pipeline** (fix-list L15; proof-of-concept ran 2026-06-02 on the racism-on-purpose video). A commentary piece becomes a *seed submission* here; users discuss below; the moderation layer keeps it Word-first. **This space is the operationalization L15 was waiting for** -- it is the surface L5 (Quality Gatekeeper), L9 (per-industry LLM teams), and L15 (commentary pipeline) converge on. The research-review pattern (`Cm_FQXuT76Y`, `1jByzKI-F0M`) is the editorial template for seed pieces.
- **Spans all industries** ("across all industries and platforms") -- the `industry` column scopes a submission to Church / Therapy / online / Dev-Ops; each per-industry LLM team moderates its own scope with the shared truth standard.

---

## 6. Sovereign-mesh tier labels

- **Discussion data + reactions + private notes + moderation audit: Tier 1** (fully sovereign, NAS Postgres).
- **Moderation classifier: Tier 2** (reflex filter = external OpenAI moderation call on community-submitted text; worldview classifier = Tier 1 on NAS Ollama, Tier 2 via Claude API with redaction). No private note ever enters the classifier -- only content submitted for *community* visibility.
- **Federation: not adopted (Tier 4 -- declined at launch).**

---

## 7. The five-test gate

1. **Father's Business** -- this is the surface most directly *about* the Father's business: *saving souls through competent conversations* = Luke 19:10 operationalized; built around John 6:39 (lose none). PASS *conditionally* -- the warmth rail must be enforced as hard as the backbone rail.
2. **Phil 4:8** -- true (Word-first), honorable, pure (no rage-bait, no engagement-maximization), commendable (lie named, person not slandered).
3. **Religion AND Relationship** -- this test IS the moderation framework: backbone names the lie, warmth pursues the person. Both rails, every response.
4. **Data-as-empowerment** -- RLS-locked private notes, no ad model, no engagement-optimization, content sovereign, deletion immediate. Per `feedback-distinguish-data-from-brand`: contributions are the user's *data*; the brand + Word-first standard stay.
5. **Cost discipline** -- thin-custom on existing Postgres + existing n8n; marginal cost is moderation LLM calls (~$0.50-2/mo per heavy user; OpenAI reflex free), covered for users in need by the aligned-brand-sponsored community tier.

**Dust-off-feet (Matthew 10:14; 2 Timothy 2:23):** the space invites the seeker but does not chase the committed scoffer. Repeated bad-faith after warn-edit-and-review -> gentle rate-limit or removal; decline cleanly, door stays open for return.

---

## 8. Lean MVP sequencing

| Phase | Ships |
|---|---|
| **Phase 0 (NOW)** | This binding doc. No code. |
| **Phase 1** | Schema on Postgres (submission/comment/reaction/private_note/moderation_event); RLS policies; native React feed + thread + like/love/not-like; text submissions. |
| **Phase 2** | n8n moderation pipeline (OpenAI reflex -> worldview classifier -> warn/edit/hold + human queue). Depends on L5 + L9. |
| **Phase 3** | Council Chamber + Family Worldview Commentary integration (`links[]`, seed submissions). Closes L15. |
| **Phase 4** | Per-industry scoping; oEmbed link previews; outbound-only federation (optional, later). |

---

## 9. Open questions (governance)

1. **(Darrell + Christina)** moderation thresholds (where `warn` becomes `hold`) + who holds the human-in-the-loop queue.
2. **(Bishop Gwin)** which doctrinal lines PoeTech *names as lies* (the "almost disrespect" direction) vs *holds as in-Body disagreement* (Romans 14) -- the Word-first/Body-undivided framework applied to a public space.
3. **(Darrell)** a published editorial standard on energy/"frequency"/law-of-attraction language (per the YouTube `1jByzKI-F0M` review bright line), so the space and the LLM teams moderate it consistently.

---

## 10. Cross-references

`COUNCIL-CHAMBER.md`, `INTAKE-AND-FIT.md`, `MODE-ROUTING.md`, `MIND-OF-CHRIST.md`, `ACCESS-TO-THE-HUMAN-MIND.md`, `DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md`, `PERPETUAL-PIPELINE-HEALTH.md`, `GOVERNANCE-EXECUTION-ADVISORY.md`, `CONNECTED-CONTEXT.md`, `BODY-OF-CHRIST-ECONOMIC-STEWARDSHIP.md`, `MARKETPLACE-ARCHITECTURE.md`. Research: `docs/99-session-notes/2026-06-03-research-review-marketplace-conversational-space-youtube-1jByzKI.md`. Memory: `project_non_denominational_word_first_body_undivided`, `project_pin_optional_community_default`, `project_community_free_funded_by_aligned_brand_sponsorship`, `feedback-distinguish-data-from-brand`.

---

*Skeleton. The room where the lies are brought into the light of the Word and souls are reached. Disrespect the lie; pursue the person. Backbone and warmth, both rails. Lose none. This is the Father's business. We all win. We create.*

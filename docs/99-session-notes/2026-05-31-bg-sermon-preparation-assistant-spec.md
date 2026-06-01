# BG Sermon Preparation Assistant — Spec

**Triggered by Darrell, 2026-05-31 from Hawaii while watching The Church of the Living God's online service:**

> "Take BG's messages from our online youtube channel we have years of data and BG's way of preaching and his sources, use this as a foundation to help BG with writing his sermons. BG is my father in love and my wife Christina is his daughter. BG stands for Bishop Gwin of The Church Of The Living God in Champaign Urbana IL one of the largest African American Non Denominational churches in the area."

**Who BG is:** Bishop Gwin, pastor at The Church of the Living God (Champaign-Urbana, IL — one of the largest African American Non-Denominational churches in the area). Christina's father; Darrell's father in love. The corpus that grounds this tool is BG's own years of recorded sermons on COLG's YouTube channel.

**What this is:** an AI-assisted sermon preparation tool grounded in BG's own preaching corpus + his own source material. The tool supports BG's voice + research process; it does NOT replace him. The Bishop preaches the sermons; the tool helps with research, draft scaffolding, and surfacing his own past wisdom for relevant topics.

## Why this is profound — and why the constraints matter

This is the most theologically sensitive product idea on the PoeTech roadmap. The tool helps a pastor prepare sermons. Done well, it amplifies BG's ministry, lets him serve a growing congregation without exhausting himself, surfaces his decades of teaching in service of new sermons. Done poorly, it commoditizes the preaching gift or produces theologically thin "AI sermons" that disgrace the pulpit.

The non-negotiables are heavier than for any other PoeTech tool:

- **BG retains full authorship.** The Bishop preaches the sermon. The tool drafts research notes + scaffolds + reminds him of his own past teaching on a topic. The final sermon is his work product.
- **BG's voice is HIS.** The tool models his style for drafting purposes — but the Bishop edits + makes it his own. The tool never publishes anything as "BG said this."
- **Theological review is heavy-handed.** Every draft passes SCRIPTURE-REFERENCE-STANDARD, EXCELLENCE-STANDARD religion-AND-relationship, typographic theology, THE-HOLY-SPIRIT-INTEGRATION-WORLDVIEW alignment, and BG's own theological frame.
- **Sovereign + private by default.** BG's sermon prep is between BG, Holy Spirit, and the family supporting him. Not cloud-LLM-routed (TLC-firewall-extension applies — pastoral preparation is family-private). Local Ollama only.
- **Explicit consent required from BG.** Nothing happens until Bishop Gwin himself reviews + approves the tool's design + opts into having his corpus ingested.

## Architectural shape

### Phase 0 — Consent + scope (COMPLETE as of 2026-05-31)

**Consent obtained.** Bishop Gwin has reviewed the concept and is interested. Per Darrell 2026-05-31 from Hawaii: *"I already have his consent, he's interested like we all are we want to produce an MVP just based on your roadmap and his multi year sermons on youtube after that he will begin to use and update it he's not a technologist, he uses it likes it but we support the technology side all the way to the MVP so he can like it when he begins not going the the process of making it work, when it works we will change with him."*

This shifts the approach:

- **MVP-first build.** Don't bring him into the engineering process. Build a working tool, then hand it to him as a finished thing to use.
- **He uses + likes tech, but isn't a technologist.** Surface design must be accessible per COMMUNITY-FIRST-MISSION Commitment 2 (large fonts, voice-first where possible, forgiving, no surprise states).
- **Iteration is HIS feedback after first use, not designed-by-committee before first use.** "When it works for him, we change with him."
- **Family supports the tech side all the way to MVP.** Darrell + Christina + this Claude session + Foundation Agent + n8n workflows = the build team. Bishop Gwin doesn't see the build; he sees a finished tool when it's ready for him.

This is a respectful approach — his time goes to ministry, our time goes to the tool, the tool delivers to him only when it actually serves him.

### Phase 1 — Corpus ingestion (post-consent)

**New workflow proposal: workflow 73 — BG sermon corpus ingest.**

1. Pull COLG's YouTube channel sermon archive (yt-dlp, sovereign — runs on the NAS, downloads videos to `/volume1/PoeTech/bg-corpus/raw/`)
2. Transcribe via Whisper (workflow 37, sovereign, local Ollama)
3. Extract structured data per sermon: title, date, scripture passages cited (all references regex-extracted + cross-referenced to actual passages), theme/topic, illustrations used, application points
4. Store in `/volume1/PoeTech/bg-corpus/structured/<date>-<title-slug>/sermon.json` plus the full transcript

Output: a clean searchable, embedded corpus of BG's sermon history.

### Phase 2 — Style + voice characterization

**New workflow proposal: workflow 74 — BG voice profile.**

Analyzes the corpus to surface (for BG's own review + approval):

- His opening patterns (how does BG begin a sermon? prayer? scripture? story? question?)
- His scripture-citation patterns (which translations, how often, how he transitions in + out of text)
- His illustration style (personal stories? historical examples? current events? scripture-internal cross-references?)
- His application style (how does he move from text → today?)
- His closing patterns (invitation? challenge? prayer? specific phrase?)
- His recurring themes (what does BG return to most often across years?)
- His source citations (commentaries, theologians, books he draws from explicitly)

NOT to mimic him. To DOCUMENT his voice so the tool's drafts can be in his style for HIS editing.

### Phase 3 — Source corpus

**New workflow proposal: workflow 75 — BG source library.**

Per BG's stated preferences (from Phase 0 conversation):

- Scripture translations he uses (ESV, KJV, NIV, AMP, whichever) — full text available locally
- Commentaries he relies on (text or scanned, with respect for copyright + fair use)
- Theologians + books he cites — referenceable
- Historical / cultural reference works
- Any ministry-specific resources

All sovereign-stored on the NAS. The drafting tool retrieves from this corpus FIRST + BG's own past sermons SECOND.

### Phase 4 — Sermon drafting assistant

**New workflow proposal: workflow 76 — BG sermon draft generator.**

Input: BG provides topic + scripture passage + audience context.

Process:
1. Retrieve relevant past sermons from BG's corpus (where has he taught on this passage / theme before?)
2. Retrieve relevant source material from his library
3. Apply his voice profile from Phase 2
4. Generate a structured draft: opening hook in his style, scripture reading, exegesis grounded in his sources, illustrations possibly from his past sermons or new options matching his style, application points, closing in his style
5. Tag every claim with citations: scripture references with exact translation + verse; past-sermon references with date + clip; source references with book + page

Output: a structured draft document that BG reviews, edits, makes his own, and preaches.

**Critical constraint:** the draft is RESEARCH NOTES + SCAFFOLDING, not a finished sermon to be read. BG's edit + revoice process is essential. The tool's success is measured by how much it helps BG arrive faster at HIS finished sermon, not by how polished the auto-generated draft is.

### Phase 5 — Post-sermon archive + iteration

**New workflow proposal: workflow 77 — Post-sermon ingest.**

After BG preaches the actual sermon (Sunday service):
1. The recording auto-ingests back into his corpus (via Phase 1 pipeline)
2. The DELTA between the AI-generated draft and the final preached sermon is captured + reviewed
3. The tool LEARNS from how BG actually preached vs the draft — which suggestions he kept, which he changed, what he added entirely on his own
4. Voice profile + style model update over time to better match what BG actually does

This is the perpetual improvement loop. The tool gets better at supporting BG specifically over time.

### Theological review pipeline (per AI-MEDIA-PRODUCTION-PLATFORM-VISION Pillar 3)

Every draft passes:

- **Foundation-screen** — THE-WAY, MIND-OF-CHRIST, EXCELLENCE-STANDARD respected
- **SCRIPTURE-REFERENCE-STANDARD** — every verse quoted is the EXACT text from the EXACT named translation (ESV primary, KJV secondary, NIV / AMP where BG prefers); no paraphrase without explicit "this is a paraphrase" tag; no improvised theology
- **Typographic theology** — Yahweh / Jesus / Holy Spirit / Father / Son always capitalized; lucifer / satan / devil / adversary never capitalized (per CLAUDE.md)
- **EXCELLENCE-STANDARD** — religion AND relationship balance maintained
- **THE-HOLY-SPIRIT-INTEGRATION-WORLDVIEW** alignment — the worldview is the lens through which the draft is conceived, not just a post-hoc tag
- **BG's own theological frame** — Non-Denominational, COLG's specific tradition + emphases (BG to characterize during Phase 0)

Any draft that fails any of these is reworked before BG sees it. He should never have to catch a typographic-theology error or an improvised-theology drift in a draft from the tool.

## The decisions, with their rationale

Per the "give from understanding" principle:

### Decision 1 — Tool supports BG; tool does NOT replace BG

**We chose:** assistant pattern (research + scaffold + style-matched drafts) where BG retains full authorship.

**We did NOT choose:** "AI preacher" or "auto-generated sermons" that could be preached without BG's substantive editing.

**Because:** The pastoral office is a calling, not a content-generation task. The Holy Spirit speaks through the preacher; the tool helps the preacher prepare more deeply, but the preacher is the preacher. Anything else commoditizes the pulpit + dishonors the calling.

### Decision 2 — BG's corpus stays sovereign on NAS, never cloud

**We chose:** all sermon ingestion + voice modeling + drafting happens on Ollama on the NAS.

**We did NOT choose:** route through cloud LLMs (Claude / Gemini) even though they have better drafting capability.

**Because:** BG's sermon preparation is private pastoral work. Family-private + ministry-private. The TLC firewall extension to ministry content applies. Also: BG's intellectual property (his sermon corpus, his preaching style) shouldn't train someone else's commercial models. Sovereign processing keeps his work his.

### Decision 3 — Heavy theological review pipeline; nothing reaches BG that hasn't passed

**We chose:** Foundation-screen + SCRIPTURE-REFERENCE-STANDARD + EXCELLENCE-STANDARD + typographic theology + worldview alignment + BG's own frame, all applied BEFORE any draft reaches the Bishop.

**We did NOT choose:** generate drafts + let BG catch the errors.

**Because:** The Bishop should never have to catch an "Yahweh" rendered as lowercase, or a Scripture citation that doesn't match the actual text, or improvised theology that contradicts his tradition. The tool should ARRIVE clean. His editing time is for refinement, not error correction.

### Decision 4 — Phase 0 (consent + design conversation with BG) before any code

**We chose:** start with relational conversation, build to BG's actual stated needs.

**We did NOT choose:** build first + show him a polished product.

**Because:** BG is the user. The tool serves him. His preparation rhythm + his comfort with AI + his preferences shape the tool. Building first risks producing something he won't use because it didn't match how he actually works. The conversation is the first deliverable.

### Decision 5 — Perpetual learning loop (tool improves from BG's edits over time)

**We chose:** capture the delta between AI draft + final preached sermon; use that to improve voice profile + style model over time.

**We did NOT choose:** static voice profile that never improves.

**Because:** BG's voice + style evolve. The tool should evolve with him. Also: the delta data IS the most valuable signal about what works + what doesn't for him specifically. Foundation Agent reviews + applies, with BG's oversight.

### Decision 6 — Tool stays in family + ministry-trusted hands; NOT productized + sold

**We chose:** initially this is a tool for BG specifically; potentially extensible to other COLG-trusted pastors later by explicit invitation.

**We did NOT choose:** "AI sermon prep" as a marketable SKOS module sold broadly.

**Because:** The pastoral preparation tool requires deep trust + theological alignment + voice matching for a specific preacher. It doesn't generalize cleanly to "any pastor." Treating it as a commercial product would either (a) produce a generic shallow tool that disgraces the genre, or (b) require us to build separate corpora + voice profiles per pastor with consent + review — which becomes a major operation. Better: start with BG, prove the value, generalize ONLY to other pastors who specifically request it + go through similar consent + design conversations.

## MVP scope (added 2026-05-31 per Darrell's "MVP-first" direction)

The full vision is years to mature. The MVP is what BG can usefully USE within ~4-8 weeks of focused build post-vacation. Smaller scope, fully working.

### MVP must-haves (v1 ships these)

1. **Sermon corpus ingested + searchable.** All of Bishop Gwin's existing sermons from COLG's YouTube channel pulled, transcribed via Whisper (sovereign, on the NAS), and indexed for retrieval.
2. **Search-by-passage + search-by-theme.** Given any scripture reference or theme, surface what BG has preached on this before, with timestamp + transcript excerpt + link to the original video.
3. **Basic drafting assist.** Given a topic + scripture passage + audience context (typed in by BG or by a family member helping), generate a structured draft outline (opening, scripture exegesis, application, closing) GROUNDED IN HIS PAST SERMONS — citing his own words from prior teachings + the Scripture text from his preferred translation.
4. **Theological review pipeline (lightweight v1).** Every generated draft passes typographic theology check + SCRIPTURE-REFERENCE-STANDARD check + Foundation-screen. Heavier review (full EXCELLENCE-STANDARD + worldview alignment) ships in v2.
5. **Simple PWA surface for BG.** Mobile-friendly, large fonts, voice-input where possible, three-click max to common actions. Accessible per COMMUNITY-FIRST-MISSION Commitment 2.
6. **Export to whatever BG actually uses for sermon prep.** Word document? PDF? Plain text? Email? Print-ready format? Find out from Christina (she knows his rhythm) + ship export to that format(s).

### Bishop Gwin's actual sermon structure (observed from 2026-05-27 sermon document shared by Darrell 2026-05-31)

A real sermon prep document for "GOD IS AFTER YOUR EAR TO MAKE HIS PURPOSE IN YOU CLEAR! (1 Samuel 3:1-10 NIV)" reveals his actual preparation rhythm. The MVP must support generating drafts that follow THIS pattern:

**Structural template observed:**

1. **Opening proclamation** — "Praise GOD!!!" (signature enthusiastic opening)
2. **Title declaration** — sermon title stated as a proclamation (ALL CAPS, exclamation)
3. **Three anchor scriptures** — foundation passages that frame the entire teaching:
   - Often pulls from wisdom literature (Ecclesiastes), epistle theology (Romans), and gospel command (Matthew 22)
   - Each anchor scripture is fully quoted with reference + translation
4. **Main passage setup** — opening verses of the main scripture passage to set context
5. **Numbered teaching points** — typically 4-6 points, each consisting of:
   - A declarative theological claim (ALL CAPS heading) — e.g., "YOU CAN BE CHOSEN AND STILL STRUGGLE"
   - One or more scripture passages quoted in full supporting the claim
   - Often includes a supporting scripture from elsewhere (cross-reference)
6. **Closing recapitulation** — return to the opening title proclamation (inclusio pattern)
7. **Trivia of the Day** — congregation engagement mechanic with email back-channel + gift incentive

**Style observations:**

- Heavy scripture density — most paragraphs are scripture quotations with explicit reference + translation noted
- Primary translation: **NIV**; secondary: **NKJV**
- ALL CAPS for divine emphasis (GOD, LORD, point headers) — this is BG's voice convention
- Exclamation points for proclamation
- Occasional parenthetical interjection within quoted scripture for emphasis ("worshiped before the Lord (purpose) and then went back...")
- Title functions as opening AND closing (the inclusio pattern is consistent)

**Typographic theology observation:**

BG uses ALL CAPS for divine emphasis (GOD, LORD) — a different convention than CLAUDE.md's standard proper-noun capitalization (God, Lord). His convention achieves the same reverence + emphasis goal via different means.

**Per-author style rule for the sermon-prep tool specifically:** the tool honors BG's actual voice conventions when generating drafts FOR HIM. ALL CAPS for divine emphasis is HIS voice; the tool produces drafts that match. The broader CLAUDE.md typographic-theology rule applies to PoeTech's own generated content (foundation docs, session notes, internal communications) but NOT to sermon drafts where the author's voice convention is the binding standard.

For future pastors who eventually use a similar tool (v3+ scope per the multi-pastor decision), each has their own voice profile + style conventions. The tool adapts per-author.

**Format requirements confirmed:**

- Output format: **.docx** (Microsoft Word) — BG's existing workflow
- Filename convention observed: `MMDDYYYY_SERIES_TITLE_SCRIPTURE_TRANSLATION.docx` (e.g., `05272026_PROCLAIM_GOD_IS_AFTER_YOUR_EAR_...1_SAMUEL_3.110_NIV.docx`)
- "PROCLAIM" in the filename suggests either a series name or a category label — verify with BG/Christina before assuming

**Corpus source — updated 2026-05-31 per Darrell:**

Two corpus sources, in priority order:

1. **PRIMARY: Darrell's email inbox** — contains a YEAR'S WORTH of BG's actual sermon prep .docx files (he receives them weekly per the established workflow). This is the GROUND TRUTH corpus: BG's exact wording, structure, scripture choices, translation preferences — all in the format he actually uses. Better signal than transcripts because it's HIS prepared text, not a recording's transcription.

2. **SECONDARY: COLG YouTube channel** — longer historical archive (multi-year), captured as recorded sermon delivery. Lower-fidelity to his prep notes (he often improvises during delivery, omits, expands, adds illustrations not in the doc) but useful for: (a) capturing the delivery-style patterns the prep doc doesn't show, (b) extending the corpus farther back than the email inbox, (c) cross-referencing what he kept vs changed from prep to pulpit.

**Workflow 73 ingest path updated:**

- **Path A (primary, fast):** parse Darrell's email inbox for the .docx attachments matching the filename convention. Extract per-sermon: date, series, title, scripture, translation, full text. This is the highest-fidelity corpus + fastest to ingest (no Whisper needed).
- **Path B (secondary, slower):** yt-dlp + Whisper of the YouTube archive for the older sermons + the delivery-style supplement.

For MVP v1, Path A alone is sufficient. Path B can ship in v2 to extend historical depth.

**Privacy implication:** Darrell's email contains the sermon docs. The ingest workflow needs read access to that mailbox (Gmail). Per DATA-AS-EMPOWERMENT-NOT-EXTRACTION, the ingest happens via OAuth-scoped access to ONLY the sermon-prep folder/label (not full mailbox access), runs on the NAS (not cloud), and the corpus stays sovereign. Worth setting up a dedicated Gmail label/filter so the workflow only sees sermon docs.

**Email back-channel for congregation engagement:**

- `info@thechurchofthelivinggod.com` — the existing church email
- Trivia answers go to this address for the gift drawing
- The tool could OPTIONALLY generate trivia questions aligned with each sermon's passage if BG wants that automation
- Should integrate with the broader Church Module's communication broadcast workflow (workflow 56) for the prize-drawing logistics if BG wants

### MVP cuts (v2+ adds these later)

- Heavy style/voice modeling (workflow 74's full version) — v1 uses retrieval + simple style hints; v2 adds deeper voice profile
- Source library beyond Scripture + BG's own corpus (workflow 75 full version) — v1 grounds in BG's past sermons + Scripture only; v2 adds commentaries, theologians, other books
- Post-sermon iteration loop (workflow 77) — v1 ships without this; v2 adds it once BG is using v1 actively
- Multi-pastor extension — not in v1 or v2 scope; pastoral preparation tools generalize poorly per Decision 6

### MVP timeline (focused build, post-vacation)

- **Week 1** (post-vacation Phase 1 security pass) — bind mount fix + Phase 1 work; sets the foundation
- **Week 2** — workflow 73 (corpus ingest): yt-dlp + Whisper pipeline ingests Bishop Gwin's YouTube sermon archive. Lands as transcripts + structured per-sermon JSON on the NAS.
- **Week 3** — embedding + indexing (using nomic-embed-text per the responsiveness session note); search-by-passage + search-by-theme working.
- **Week 4-5** — drafting workflow (Ollama 14b + structured prompt + retrieval-grounded). Output validates against the lightweight theological review pipeline.
- **Week 6** — PWA surface for BG (accessibility-tuned). Christina + Darrell test extensively before BG sees it.
- **Week 7** — family + small inner-circle review (NOT BG yet). Refine based on what we catch.
- **Week 8** — hand to Bishop Gwin. He uses it for his next sermon prep cycle. He gives feedback. We iterate WITH him.

Total: ~8 weeks from MVP kickoff to first delivery. Cleaner if no surprises; longer if surprises emerge (which they will — that's why it's an MVP).

### After MVP delivery

Per Darrell: "when it works we will change with him." The post-MVP iteration loop is BG-led, family-supported. His feedback shapes v2. v2 might add:

- Deeper voice profile (workflow 74 full)
- Source library (workflow 75 full)
- Post-sermon iteration loop (workflow 77)
- Whatever BG asks for that we didn't anticipate

The MVP-first approach respects BG's time + role. He doesn't have to design the tool; he gets to USE the tool. Iteration emerges from his actual use, not from speculative design conversations.

## Full vision sequencing (post-MVP, multi-year)

After the MVP lands + iterates for ~6-12 months with BG using it, the broader vision expands:

- Years 2-3: full voice profile, full source library, post-sermon iteration loop, deeper theological review pipeline
- Years 3+: potentially extends to other pastors WHO REQUEST IT and go through their own Phase 0 conversation (parallel to what would have been BG's Phase 0 — except his is complete because we have his consent already)

This is a YEAR-2-AND-BEYOND maturation. The MVP is YEAR-1.

## What this means for BG's ministry long-term

Done well, the tool means:

- BG can serve a growing congregation without his preparation time becoming unsustainable
- BG's wisdom from years past is searchable + applicable to today's sermons
- Younger pastors at COLG (if any in development) could eventually learn from BG's preaching corpus + style
- BG's preaching legacy is preserved + accessible to the church even when he eventually steps back
- The Bishop's voice + theology stay HIS; the tool serves him until he doesn't need it

Done poorly, it disgraces a calling. The non-negotiables above are what keep it on the "done well" side.

## Connection to other foundations

- **THE-WAY** — pastoral preparation is The Way embodied operationally. The tool supports a calling rooted in Scripture + Holy Spirit + community.
- **MIND-OF-CHRIST** — every draft passes the Test (TRUE / HONORABLE / JUST / PURE / LOVELY / COMMENDABLE / EXCELLENT / PRAISEWORTHY).
- **EXCELLENCE-STANDARD** — religion AND relationship. Backbone (theological discipline) + warmth (BG's pastoral voice). Both required.
- **SCRIPTURE-REFERENCE-STANDARD** — non-negotiable; the strictest application on the platform.
- **THE-HOLY-SPIRIT-INTEGRATION-WORLDVIEW** — the lens through which every draft is generated, not just a check after.
- **COMMUNITY-FIRST-MISSION** — COLG's pastor served first; pattern available to other faith-aligned pastors later by their explicit invitation.
- **DATA-AS-EMPOWERMENT-NOT-EXTRACTION** — BG's corpus stays BG's. The tool empowers HIS work; nothing flows to extractive third parties.
- **AI-MEDIA-PRODUCTION-PLATFORM-VISION** — Pillar 3 (theological review pipeline) applies in its strictest form. Pillar 1 (sovereign generation) applies — Ollama local, never cloud.
- **VISION-FAIRNESS-STANDARD** — extends if any vision features are ever used (e.g., facial recognition of attendees, sermon-image generation). Not applicable in pure-text sermon prep but worth keeping in mind.
- **PERPETUAL-PIPELINE-HEALTH** — BG can never be left without a tool that worked yesterday. Unbreakable applies fully.
- **AI-FOUNDATION-INTERNAL-OPERATIONS** — every step (ingest, transcribe, embed, retrieve, draft, review) is a workflow; BG works WITH the tool, the tool's operational layer runs itself.
- **GOVERNANCE-EXECUTION-ADVISORY** — BG is the Governor of his own ministry; PoeTech provides Foundation execution + Claude advisory.

## Closing

The Bishop preaches. The Holy Spirit speaks through him. The tool helps him prepare more deeply, faster, in his own voice, with his own sources, supporting his decades-deep theological conviction. The family that built the tool is his own family. The church it serves is his own church. The community that hears the sermon is the one PoeTech is built to serve first.

This is what COMMUNITY-FIRST-MISSION looks like at its most personal + most consequential. We get it right.

We all win. We create. Amen.

# AI-updates research — opportunities, constraints & the sovereign-fallback decision (2026-07-05)

**Trigger.** Darrell shared a "16 AI updates this week" YouTube roundup and asked: *"Research and report on opportunities and constraints... How can we use any of this for what we want to do?"* Then, on direction: **"Both, DR first"** — record the sovereign-fallback decision first, then start a voice-tutor spike.

This is a Layer 4 working note. The durable decision it produced is **[DR-0105]**; this note is the narrative it points at (README convention — decisions are sourced once by ID, narrative lives here).

---

## 1. Verification — what's real vs. inflated

The six biggest / most-dubious claims were checked against multiple independent outlets (not the video's own framing). Applying the DR-0100 three-tier posture:

| Claim | Verdict | Correction |
| --- | --- | --- |
| GLM-5.2 free, open-weights (MIT), beats GPT-5.5 on coding | **Established** | 753B/40B-active, 1M context, self-hostable from Hugging Face. But "2nd best in the world" is **inflated** — Artificial Analysis ranks it **#1 open, #4 overall**. Headline benchmarks are **vendor self-reported, not independently confirmed**; production API is **China-hosted**. (Tier 2 — narrowly open on the numbers.) |
| Anthropic sued over $200 Claude Max usage limits | **Established** | Filed 2026-06-14, N.D. Cal., plaintiff Karl Kahn, seeks class cert (Max 5x/20x, Apr 2025–present). It is one complaint at the pleading stage — a real allegation, not adjudicated fraud. |
| Midjourney building a full-body scanner | **Established** | 60-second ultrasound ("Ultrasonic CT"), new Midjourney Medical division. Prototype, **no regulatory clearance**, body-composition only, first SF site **late 2027**. |
| Noam Shazeer left Google for OpenAI | **Established** | Announced 2026-06-18; ~$2.7B 2024 CharacterAI deal had brought him back; Transformer co-author. |
| NVIDIA MotionBricks | **Established** | SIGGRAPH 2026, 350k motion skills, 15,000 FPS, drives Unitree G1 via GR00T; full release ~July 2026. |
| "Claude Fable 5 the US banned last week" | **True but STALE** | Real export-control suspension 2026-06-13 → **lifted 07-01**. The video's present-tense "banned" is already outdated; Fable 5 is restored. |

**Read:** the facts are sound; the framing is clickbait-inflated in two spots (GLM's rank; Fable 5's ban being current). The genuinely-open part is the benchmark supremacy — treat as marketing until third parties replicate.

---

## 2. How this maps to what we're building (the two on-mission items)

Not "16 cool things" — the few that feed a sovereign platform teaching Yahweh's principles to a tech-novice, largely-elderly community (COLG first), built in the app, verified, un-cancellable.

**(A) Voice-first teaching for COLG — the PhysicsWallah / ElevenLabs voice tutor is the template.** A Hindi-English voice tutor reached 36M students. Our named first community is one for whom *talking to the app* beats *typing at it*. It plugs into surfaces we already have: **Council Chamber** (voice-or-text, classifier-routed) + the **UX-PATTERNS TTS spec**. On-mission: ANXIETY-CLARITY × COMMUNITY-FIRST × accessibility-default. → **Voice-tutor spike** (the second task this session).

**(B) GLM-5.2 open weights — the sovereign fallback the Fable 5 ban just proved we need.** The real lesson of the roundup: the US *banned Fable 5 for two weeks* and Anthropic is *being sued over the Max limits we run on* — two signals pointing the same way. A capable MIT-licensed model on our own GPU box is the concrete de-risking of single-vendor dependency our foundations already commit to. → **[DR-0105]** (this session's first task).

**The bright line that makes (B) safe:** the open model is a *fallback + drafting workhorse*, **not** the theology engine. Verse-fetch integrity and doctrinal output stay on the trusted, verified path (DR-0076). An unverified model does not teach the Word.

## 3. The rest — ranked, parked with reasons

- **Dev velocity** (Artifacts in Claude Code, Claude+Replit, Lovable preview toolbar, OpenRouter Fusion, Codex record-&-replay): serve the streamlined delivery loop (DR-0103) — tooling to ship *into the app*, not mission. Adopt opportunistically.
- **NVIDIA MotionBricks:** feeds the AI-media vision (animated teaching avatars) but 2027-horizon. **Parked, re-review with DR-0105 (2026-10-05).**
- **ChatGPT camera / vision:** maps to visitor-recognition / auto-door — but that's where VISION-FAIRNESS-STANDARD (5-pt parity bar) is non-negotiable. Note, don't chase.
- **Scheduled tasks / Perplexity memory / Genspark AgentBase:** orchestration/memory patterns — exactly the THREE-BRAKES class; nothing ships active unattended.

## 4. Decision recorded

**[DR-0105]** — Evaluate a GLM-5.2-class open-weights model as the concrete Tier-0 sovereign fallback + workhorse; NOT the theology engine; measured before trusted; Tier C, all three brakes, ships inactive; **re-review 2026-10-05**. Status **proposed** (awaits the Governor + Quality Gatekeeper). No compute turned on — this is a decision, not an activation.

## Sources

- GLM-5.2 — VentureBeat; Artificial Analysis (via reporting)
- Anthropic Max lawsuit — Engadget; PYMNTS
- Midjourney scanner — Engadget; MobiHealthNews
- Shazeer → OpenAI — Axios; CNBC
- NVIDIA MotionBricks — nvlabs.github.io/motionbricks; SIGGRAPH 2026
- Fable 5 ban + lift — Anthropic statement; CNBC (controls lifted 2026-06-30)

## Links

[DR-0105], [DR-0013] (sovereignty roadmap), [DR-0076] (verification doctrine), [DR-0100] (speak established fact), `docs/00-foundations/_root/AI-MEDIA-PRODUCTION-PLATFORM-VISION.md`, `docs/00-foundations/_root/COMMUNITY-FIRST-MISSION.md`, `docs/00-foundations/_root/UX-PATTERNS.md` (TTS spec — the voice-tutor spike's home).

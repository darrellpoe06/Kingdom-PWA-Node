# 2026-07-27 — Scribe-Function Research Review (process scribe + meeting scribe)

**Type:** research-review (Layer 4 working artifact)
**Prompted by:** Darrell 2026-07-27 — a scribe_hq (scribehow.com) Instagram ad: *"Can we build a scribe type function inside PoeTech or is there an open source usable version we can re-engineer?"* — expanded mid-session: *"I want to be able to record whole meetings and inside PoeTech like 30min... 1hr... etc long engaging content and conversations... opportunities and constraints."*
**Pairs with:** DR-0182 (sovereign OBS meetings), DR-0183 (meeting rooms), DR-0131 (one input surface / spoken word captured), DATA-AS-EMPOWERMENT, COMMUNITY-FIRST-MISSION, ANXIETY-CLARITY-PRINCIPLE, AI-MEDIA-PRODUCTION-PLATFORM-VISION, PERPETUAL-PIPELINE-HEALTH.

"Scribe" here is two distinct functions that share one sovereign backbone:

- **Track A — Process scribe** (what scribe_hq sells): watch a person do a task, auto-generate a step-by-step guide with screenshots and written instructions.
- **Track B — Meeting scribe**: record a 30min–1hr+ meeting or conversation, transcribe it, and turn it into minutes, teaching content, and searchable rows.

## Track B first — the meeting scribe rides rails we already own (~90% exists)

Reality-trace of what is already real in this repo:

| Stage | Real asset | Where |
|---|---|---|
| Browser audio capture | `voice-recording.js` (getUserMedia + MediaRecorder, tested) | `app/src/lib/voice-recording.js` |
| GPU transcription | whisper-gpu FastAPI server (faster-whisper, church RTX 4070) | `infra/church-gpu-node/whisper-gpu/server.py` |
| GPU arbitration | gpu-scheduler (ollama / voice-studio / whisper-gpu ports) | `infra/gpu-scheduler/` |
| Transcript storage | `video_transcripts` migration | `infra/supabase/migrations-auto/0058-video-transcripts.sql` |
| Transcript → content | harvest-from-transcripts, sermon-import, SME pipeline (service recording → transcript → local LLM → lessons, proven) | `scripts/`, `infra/nas-sme-pipeline/` |
| Meeting records | `ministry_meetings` + load rules (14 proven-to-catch tests) | DR-0182, migration 0097, `lib/ministry-meetings.js` |
| Sovereign LLM summarize | nas-llm | `infra/nas-llm/llm_server.py` |

**The gap is the seam, not the stages:** a long-session recorder surface + a sovereign ingest route + diarization + the minutes join back to `ministry_meetings`.

### Opportunities (Track B)

1. **Meeting minutes as real rows.** Schedule (exists) → record → whisper-gpu transcript → nas-llm minutes → rows attached to the `ministry_meetings` record. Ministry Ops (DR-0184) gets a searchable memory of every weekly-operations meeting.
2. **Engaging content from conversations.** The proven sermon/SME pipeline (recording → transcript → lessons) generalizes directly to meetings and long-form conversations — this IS the AI-MEDIA-PRODUCTION-PLATFORM-VISION's capture front end.
3. **Speaker diarization is one dependency away.** WhisperX / pyannote.audio drops into the existing whisper-gpu server for "who said what" — required for usable minutes.
4. **Consent-first posture is the moat.** Visible recording indicator, opt-in per participant, audit log, NAS-only storage — the structural opposite of cloud notetakers (DATA-AS-EMPOWERMENT).
5. **Open source to re-engineer, not adopt wholesale:** [Meetily](https://github.com/Zackriya-Solutions/meetily) (self-hosted Whisper/Parakeet live transcription + diarization + Ollama summaries; closest full stack, but a desktop app — we mine its pipeline shape), WhisperX (word timestamps + diarization; drop-in), faster-whisper (already ours).

### Constraints (Track B)

1. **Long-session browser recording needs hardening.** A 1hr opus/webm audio capture is only ~30–60MB (fine), but: mobile tab suspension kills recorders → needs Screen Wake Lock + foreground UX; upload must be **chunked every few minutes** so a crash loses minutes, not the hour (PERPETUAL-PIPELINE-HEALTH: idempotent, try-catch every I/O).
2. **Diarization VRAM + scheduling.** pyannote alongside faster-whisper fits a 12GB 4070 but must go through gpu-scheduler arbitration with voice-studio/ollama. Batch-after-meeting transcription is cheap (a 1hr file transcribes in minutes); **live** captions are a later tier, not the MVP.
3. **Multi-party remote capture waits on the OBS engine (Tier C, DR-0182, re-review 2026-09-01).** Until then the honest scope is one-room/one-mic capture (in-person meetings, conversations, teachings) or per-participant capture. Recording inside a Zoom/Teams fallback link is their platform's feature, not ours.
4. **Illinois is an all-party-consent state (720 ILCS 5/14, eavesdropping).** Recording private conversations requires every party's consent. A visible indicator + captured consent is a **build requirement**, not polish. (Flagged as a system claim to verify with counsel-grade sourcing before any COLG-facing rollout.)
5. **Storage/retention.** Audio is trivial; video is GBs/hour — bind-mount storage + a retention decision before video recording ships.
6. **Any auto-firing post-processing loop needs the three brakes** (budget, concurrency lock, kill-switch) proven-to-catch in CI before it ships active (DR-0068/DR-0225).

## Track A — the process scribe (step-by-step guide generator)

### Opportunities

1. **In-app scribe is very buildable with no extension.** For PoeTech's own surfaces the PWA can instrument its own clicks/navigation/DOM state (or embed [rrweb](https://github.com/rrweb-io/rrweb), MIT, the industrial-grade DOM record/replay primitive), then nas-llm writes the prose steps. Guides for **every PoeTech surface, auto-generated from a steward actually doing the task once.**
2. **This is COMMUNITY-FIRST-MISSION made concrete.** COLG's elderly tech-novice staff get what/when/why/how step guides (ANXIETY-CLARITY-PRINCIPLE) generated from real usage — the train-the-community commitment with a production line behind it.
3. **Runbook capture.** Darrell's repeated NAS/PowerShell/desktop procedures become captured, replayable guides instead of re-typed instructions.
4. **Open source exists to re-engineer:** [Mimik](https://westpoint.io/insights/mimik-open-source-local-first-alternative-scribe-tango-guidde) (MIT, local-first browser extension, no backend/telemetry — the closest true OSS Scribe clone; fork it for cross-app capture when needed). Chrome's built-in DevTools Recorder exports step JSON free.

### Constraints

1. **Browser security walls.** A PWA cannot see clicks or screens outside its own tab. Cross-app capture requires either a browser extension (separate artifact, store distribution, desktop-only) or `getDisplayMedia` screen capture (user permission, desktop browsers, frames without click metadata). **Mobile has no screen-capture path** — in-app capture only.
2. **Redaction before storage.** Captured screenshots/DOM can contain sensitive values; a redaction pass is required before a guide persists (DATA-AS-EMPOWERMENT).
3. **Guides rot.** A guide is a claim about the live UI; when a surface changes, its guide is stale. Regeneration/staleness detection is part of the design (DR-0075 — nothing stagnates silently), or the guides become painted trust-eroding artifacts (reality-trace).

## Recommendation (recommend-and-proceed default)

Phased, highest-value-per-lift first, all sovereign (plain Python/FastAPI on NAS/GPU — never a new n8n webhook, per the transport memory / DR-0132):

- **Phase 1 — Meeting-audio scribe on existing rails (Tier B).** Harden `voice-recording.js` for long sessions (wake lock, chunked upload), add a sovereign `/scribe/*` ingest route, whisper-gpu + WhisperX diarization, nas-llm minutes, rows joined to `ministry_meetings`. Consent capture + visible indicator in the same phase.
- **Phase 2 — In-app process scribe (Tier B).** Instrument PoeTech's own surfaces (rrweb or native event capture) → guide generator → a Guides surface, COLG-staff-first.
- **Phase 3 — Cross-app capture via a forked Mimik-style extension** (only if the need is proven outside PoeTech's own surfaces).
- **The OBS meeting engine stays the Tier-C target on its DR-0182 clock** — the scribe attaches to it when it lands; nothing here waits on it.

No code shipped this session — this is the research review; the build lands as its own PRs through the normal lane.

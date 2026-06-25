# Research-Review — Voicebox as the Sovereign Voice Layer

**Date:** 2026-06-24
**Type:** Research-review / eval (Layer 4 working artifact)
**Question (Darrell):** Can PoeTech use **Voicebox** — an open-source, LOCAL, privacy-first AI voice studio (voice cloning + TTS + system-wide dictation + MCP so agents can speak; a free alternative to ElevenLabs) — and if so, for what first, behind what guardrails, on what hardware?
**Posture:** research-first; current facts verified live (June 2026); decisions-with-rationale; verification doctrine (DR-0076) — every external claim is cited, hardware items not read off the real units are marked **TO CONFIRM**.

---

## 0. TL;DR — the call

**Yes — adopt Voicebox as PoeTech's sovereign voice layer, in phases, behind the seams the app already has.** It is the audio analog of the local-LLM sovereignty plan: free, MIT-licensed, runs entirely on our own CUDA hardware, and nothing leaves the family/church. It slots cleanly behind the provider abstraction the TTS engine was *already* built to swap (`app/src/lib/tts.js:11-13`).

**Use it FIRST on the two low-stakes, no-consent surfaces** (no real person's voice is synthesized, so the consent/labeling tripwire never fires):

1. **Lesson + Scripture + presenter read-aloud** — replace browser Web Speech / cloud TTS with a sovereign local engine (Kokoro or LuxTTS), behind the existing `useTextToSpeech` seam. This is real accessibility for elderly, low-literacy, and dyslexic members (COMMUNITY-FIRST-MISSION) and removes the browser-voice-quality lottery.
2. **Dictation / voice capture** — Voicebox's `transcribe` for the One-Voice input + Study + notes capture, upgrading the browser Web Speech recognition we use today (`app/src/lib/voice-dictation.js`).

**DEFER, behind explicit consent + "AI-generated voice" labeling (Tier C):** voice *cloning* of real people (BG, choir, family) and the MCP `speak` "let the agents talk" capability for announcements/presenter. These carry impersonation risk and ship only with the guardrails in §6.

**Hardware:** runs NOW on the church's 2× RTX 4070 boxes (CUDA) and the planned home 5090 box. The light engines (Kokoro, LuxTTS, Qwen3-TTS 0.6B) fit the 4070's ~12GB; only the heaviest models want 16GB+ (§5). **Disable the one cloud engine (HumeAI TADA)** — keeping the deployment 100% sovereign is the whole point.

**X not Y because Z:** Voicebox, **not** ElevenLabs, because the entire PoeTech thesis is sovereignty + no extraction (DATA-AS-EMPOWERMENT-NOT-EXTRACTION) — a per-character cloud subscription that ships congregation voices off-box is the opposite of the moat. ElevenLabs still wins the raw quality *ceiling* (§5), which is exactly why cloning stays deferred and the first uses are synthetic-voice read-aloud where "excellent local" already clears the bar.

---

## 1. Current voice/TTS state in the app (grounded, read-only)

What exists today, with provenance:

| Capability | Where it lives | What it is |
|---|---|---|
| **Read-aloud (TTS)** | `app/src/lib/tts.js` | The HEAR half of the see/hear accessibility pair. A reusable engine over the **browser Web Speech API** — segmented utterances (sidesteps Chrome's ~15s cutoff + iOS truncation), per-device speed/voice prefs, most-natural-voice picker. **Critically: built behind a provider seam on purpose** — "wrapped behind a small engine so a premium/sovereign provider can be swapped in later without touching feature code" (`tts.js:11-13`). |
| **TTS UI** | `app/src/components/TTSControl.jsx` | The control surface (speed steps, voice choice, play/pause/stop). |
| **TTS consumers** | `app/src/lib/scripture-teaching.js`, `poe-financial-mvp-v28.jsx`, lesson/Scripture surfaces | Where read-aloud is wired in today. |
| **Dictation (voice→text)** | `app/src/lib/voice-dictation.js` | Reusable "type OR speak" primitive over the **browser Web Speech *Recognition* API**. Mic appears only where the browser supports it; nothing leaves the device. |
| **Master input box** | `app/src/components/OneVoiceInput.jsx`, `InputCenter.jsx` | The "say it once" surface (Church Speak box, Thinking Space) — type or speak, classifier routes, person always confirms (MODE-ROUTING). Uses `useVoiceDictation`. |
| **Transcription (server-side)** | `infra/nas-sme-pipeline/transcribe.py`, n8n `wf37-whisper-stt-voice-input` | **faster-whisper INT8** in an isolated NAS container — the SME video→spec pipeline and voice-input workflow. This is our existing *sovereign* speech-to-text; manual-run only, CPU-slow (batch overnight), GPU makes it fast. |

**The honest read:** the *input* side (dictation, whisper) is already partly sovereign. The *output* side (read-aloud) is **not** — it rides whatever TTS voices the user's browser/OS ships, which is inconsistent across devices and, for some browsers, a cloud call (e.g. Google/online voices the picker ranks highest in `tts.js:117`). **Voicebox's biggest single win is making the output side sovereign and consistent**, using the seam already designed for it.

---

## 2. Voicebox — verified project facts (June 2026)

All from the live repo and docs (sources §9):

| Fact | Value |
|---|---|
| **Repo** | `github.com/jamiepine/voicebox` — by Jamie Pine (creator of Spacedrive). |
| **License** | **MIT** — permissive, sovereign-safe, commercial-OK. |
| **Maturity** | **33.9k GitHub stars**; zero→20k+ in ~3 months. Latest release **v0.5.0 (2026-04-25)** — pre-1.0, fast-moving. |
| **Stack** | TypeScript 54.7% / Python 33.6% (FastAPI) / Rust 9.2% — a **Tauri** desktop app with a local Python inference server. |
| **OS support** | macOS (Apple Silicon + Intel), **Windows**, Linux, Docker. **Linux has no pre-built binary yet** (build from source). |
| **GPU support** | **CUDA** (Win/Linux NVIDIA), MLX (Apple), ROCm (AMD), DirectML, Intel IPEX/XPU, **CPU fallback**. → runs on our 4070s and the 5090 box. |
| **TTS engines (7)** | Qwen3-TTS (0.6B/1.7B), Qwen CustomVoice, **Kokoro**, **LuxTTS** (100M, CPU-first, MIT), Chatterbox Multilingual, Chatterbox Turbo, **HumeAI TADA** (*the one cloud-API engine — optional, disable for sovereignty*). |
| **Voice cloning** | **Zero-shot** from a short reference sample (~3–5s of clean audio for basic cloning); 50+ curated preset voices. |
| **Dictation** | System-wide, global-hotkey dictation into any text field; a **bundled local Qwen3 LLM** cleans ums/stutters/false-starts and powers per-profile personas. |
| **MCP server** | Local MCP server exposing **`voicebox.speak`, `voicebox.transcribe`, `voicebox.list_captures`, `voicebox.list_profiles`** — so any MCP-aware agent can be given a voice and can speak/transcribe locally. |

**Positioning:** it is, fairly, "Ollama for audio" — a local-first studio that does both input (dictation/transcribe) and output (TTS/clone), bridged by a small local LLM, all on-machine. That maps almost exactly onto how we already think about local LLMs.

---

## 3. Alternatives (so the pick is informed, not defaulted)

Voicebox is best understood as a **bundler/front-end over several open TTS engines**. The engines are themselves the alternatives, and we could run them directly via the NAS/GPU box without the desktop app:

- **Kokoro** — 82M-param TTS, Apache-2.0, extremely light (runs near-realtime on CPU/modest GPU), surprisingly natural. *The leading candidate for our read-aloud default.* Available standalone (`kokoro` / ONNX) if we want it headless on the NAS rather than via the Voicebox desktop app.
- **Piper** (Rhasspy) — MIT, tiny, fast, fully offline, already the de-facto "local Pi/edge TTS." Lower ceiling than Kokoro but rock-solid and trivially embeddable as a service. Good fallback / wf-side engine.
- **Coqui XTTS v2** — already named in our media-platform vision (`AI-MEDIA-PRODUCTION-PLATFORM-VISION.md`, CUDA-first); strong multilingual cloning, heavier. The "studio-grade clone" option when consent-gated cloning is greenlit.
- **Chatterbox / Qwen3-TTS** — the higher-quality engines Voicebox bundles; want more VRAM.

**Why Voicebox over wiring an engine directly, for the pilot:** it gives us all of dictation + TTS + cloning + an **MCP server** in one MIT app on the hardware we already have, so we can *evaluate* the whole sovereign-voice idea this week without standing up a service. **Why we keep Kokoro/Piper-direct in our pocket:** for the *production* app-facing read-aloud, a headless TTS microservice on the NAS/GPU box (Kokoro or Piper) is a cleaner dependency than a desktop app — no GUI, no Tauri, just an HTTP endpoint the `tts.js` provider seam calls. **Recommendation: pilot with Voicebox, productionize read-aloud against a headless Kokoro/Piper endpoint behind the same seam.** Same abstraction, swappable.

---

## 4. Use-case mapping

| # | Use case | Voicebox capability | Sovereign engine | Consent needed? | Tier |
|---|---|---|---|---|---|
| **1** | **Read-aloud for lessons / Scripture / presenter** (replace browser/cloud TTS with sovereign) | TTS (`speak`) | Kokoro / LuxTTS (synthetic preset voice) | **No** — synthetic voice, no real person | **Pilot / Tier A-B** behind `tts.js` seam |
| **2** | **Dictation / voice capture** (Study, notes, One-Voice → app) | `transcribe` + local-LLM cleanup | Whisper/Voicebox local | **No** — user dictating their own words | **Pilot / Tier B** |
| **3** | **Voice CLONING for narration in trusted voices** (BG, choir, family) | Zero-shot clone | Coqui XTTS / Qwen3-TTS | **YES — explicit, written, per-person** | **Tier C — deferred** (§6) |
| **4** | **MCP "let the agents speak"** (announcements, presenter cues, orchestrator/Dispatch status read aloud) | MCP `speak` | Kokoro (synthetic) | **No** if synthetic + labeled; **YES** if a real cloned voice | **Tier C — deferred** (synthetic-only first) |

The first two are the wedge: pure benefit, no impersonation surface, and they upgrade two things we already ship. Maps to the read-aloud accessibility pair and the One-Voice input directly.

---

## 5. Hardware & sovereignty fit

- **Runs now on the church's 2× RTX 4070 boxes.** Per the COLG AV/GPU docs, the church already has 2 CUDA machines with RTX 4070 (~12–16GB VRAM, **TO CONFIRM** exact); retiring ProPresenter (Presenter project) frees one 4070 box fully for AI. Voicebox is CUDA-native → it runs there today.
- **Engine ↔ VRAM honesty:** Kokoro (82M), LuxTTS (100M, CPU-first), and Qwen3-TTS 0.6B fit comfortably in a 4070's ~12GB and even run CPU-real-time-ish. The heavy/highest-quality models (e.g. Voxtral 4B-class) want **16GB+ VRAM** — so a single 12GB 4070 caps you at the light/medium engines for now, which is exactly enough for read-aloud + dictation. The home 5090 (32GB) / dual-5090 box removes that ceiling for clone-grade work later.
- **Data stays local — the differentiator.** Every engine except HumeAI TADA runs fully on-box. **Action: disable HumeAI TADA** so no audio ever leaves the network. With it off, Voicebox is air-gappable, which is the whole sovereignty case (DATA-AS-EMPOWERMENT-NOT-EXTRACTION; NETWORK-SOVEREIGNTY).
- **Cost — the cost-efficiency screen.** $0 software (MIT) on hardware we already own/plan, vs ElevenLabs' per-character subscription that also *ships congregation voices to a third party*. For a church reading Scripture and lessons aloud at volume, the metered-cloud model is both a recurring bill and a data-extraction the mission forbids. Sovereign local wins on cost *and* on principle.

---

## 6. Binding guardrails (non-negotiable)

These are the bright lines. They are *not* optional polish — voice cloning of real people is an impersonation surface, and this is a church serving elders and minors.

1. **Voice cloning of a real person requires EXPLICIT, written, per-person CONSENT** — BG, Pastor Lee, any congregant, any family member, and **especially any minor** (a minor's voice is not clonable without guardian consent, and the default is *don't*). Consent is scoped (this voice, for these uses) and revocable. No consent → no clone. (QUALITY-OF-LIFE; COMMUNITY-FIRST-MISSION; VISION-FAIRNESS-STANDARD posture extended to voice.)
2. **All synthesized speech in a real person's voice is clearly LABELED "AI-generated voice."** Visible label on any surface that plays it; no exceptions for "it's obviously us."
3. **NEVER synthesize a real person saying words they did not say** in any deceptive or representational context — no fabricated "BG said…", no putting words in a pastor's or family member's mouth. Synthetic *preset* voices (Kokoro/Qwen) for reading lessons aloud are fine; *impersonation* is the line, and it is absolute.
4. **Pilot on low-stakes first; not a hard dependency.** Voicebox is pre-1.0 and fast-moving ("active development = occasionally disruptive for stability"). Read-aloud and dictation **degrade gracefully back to the current browser Web Speech path** — the seam stays, Voicebox is an *upgrade provider*, never a single point of failure. Don't rely on it for polished long-form or anything live-critical (e.g. service presenter) until it has soaked.
5. **Sovereign-only configuration.** HumeAI TADA (cloud) disabled. Voicebox runs on the LAN/Tailscale-reachable box only, no public surface — same access posture as the NAS sovereign surfaces.
6. **Quality honesty.** ElevenLabs still wins the raw quality ceiling; we adopt the local stack *because of sovereignty*, and we say so plainly rather than claiming parity (DR-0076).

Ties to the through-line: open-source stack + local-AI vision + accessibility. Read-aloud is **real** accessibility for kids, low-literacy, and dyslexic readers — not a gimmick.

---

## 7. Standard screens

- **Religion check (backbone):** sovereignty + consent guardrails are scripture-consistent stewardship — truthful representation (no bearing false witness via a fabricated voice; Exodus 20:16 posture), and serving "the least of these" (accessibility for elders/children; cf. Matthew 25:40, fetched-not-from-memory before any in-app citation).
- **Relationship check (warmth):** the heart is a grandmother who can't read the screen *hearing* the lesson in a warm, consistent voice; a member speaking a prayer request instead of typing it. Meets people where they are.
- **The Test (Phil 4:8):** TRUE (claims cited, quality stated honestly), HONORABLE (consent + labeling protect dignity), JUST (no extraction, no impersonation), PURE (no deceptive use), LOVELY/COMMENDABLE (accessibility-first), EXCELLENT (sovereign + free), PRAISEWORTHY (lifts the family AND the community, creates rather than extracts — GOVERNANCE-EXECUTION-ADVISORY "we all win, and we create").
- **Perpetual improvement (DR-0075):** this *is* a feel/flow upgrade to read-aloud and dictation; the deferred clone/MCP-speak items carry a re-review trigger (when the home 5090 box stands up + a consent workflow exists).
- **Three-brakes (autonomous automation):** if MCP `speak` is ever wired to the orchestrator/Dispatch for unattended announcements, it is timer/agent-triggered output and ships with budget + concurrency-lock + kill-switch — deferred until then.

---

## 8. Recommendation (decision)

**Adopt Voicebox as the sovereign voice layer, phased:**

- **Phase 1 (now, low-stakes, no consent surface):**
  1. Stand up Voicebox (or a headless Kokoro/Piper endpoint) on a church 4070 box with **HumeAI disabled**.
  2. Wire **read-aloud** through it behind the existing `tts.js` provider seam — synthetic preset voice for lessons/Scripture; browser Web Speech stays the graceful fallback.
  3. Evaluate **dictation/transcribe** against our current browser Web Speech recognition on the One-Voice/Study capture surfaces.
- **Phase 2 (production-harden):** if read-aloud proves out, productionize against a **headless Kokoro/Piper TTS microservice** on the NAS/GPU box (cleaner than a desktop app) behind the same seam.
- **Phase 3 (Tier C, consent-gated, deferred):** voice **cloning** of trusted voices and **MCP `speak`** for agent/announcement output — only after a written consent + labeling workflow exists and the home 5090 box is up.

**Build-it-in-the-app default (Layer 0):** the app surface for Phase 1 is the existing read-aloud control and One-Voice box — no new tab needed; the change is swapping the *provider* behind the seam. That is where the user lives, and it is the right place to ship this.

**Next concrete step (for the orchestrator to schedule, not blocking):** a spike to run Kokoro on a 4070 box and expose a `/speak` HTTP endpoint, then point a `tts.js` provider variant at it behind a feature flag. No app-user-facing change until the voice quality is verified on a real device (DR-0076 — verify, don't claim).

---

## 9. Sources (verified June 2026)

- Voicebox repo — `https://github.com/jamiepine/voicebox` (MIT license, 33.9k stars, v0.5.0 2026-04-25, stack, OS/GPU support, MCP tools, engine list, "Linux pre-built binaries not yet available").
- `https://voicebox.sh/` and `https://docs.voicebox.sh/` (product/docs).
- mindwiredai.com deep-dive (2026-04-26) — local-vs-cloud engine split (HumeAI TADA is the one external-API engine), Voxtral 4B 16GB+ VRAM gating, LuxTTS CPU-first/MIT, bundled local Qwen3 LLM for dictation cleanup + personas, "ElevenLabs still wins raw quality ceiling," "active development = occasionally disruptive for stability," 3–5s clone sample.
- Repo grounding: `app/src/lib/tts.js` (provider seam), `app/src/lib/voice-dictation.js`, `app/src/components/OneVoiceInput.jsx`, `infra/nas-sme-pipeline/transcribe.py` (faster-whisper), `docs/00-foundations/LOCAL-LLM-HARDWARE-RECOMMENDATION.md` (5090 box), `infra/seed-data/2026-06-24-colg-sanctuary-av-gpu-docs.*` (church 2× RTX 4070, VRAM TO CONFIRM).

---

*Layer 4 working artifact. No code changed; this is the eval that authorizes a Phase-1 spike. Voice cloning and MCP-speak remain deferred behind explicit consent + "AI-generated voice" labeling.*

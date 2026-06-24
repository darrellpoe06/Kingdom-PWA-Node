# Spec + Research-Review — Local-AI EQ/Mix ASSISTANT for the live sound board (before / during / after a service, ASSISTIVE-ONLY, sovereign, GPU-gated)

**Date:** 2026-06-24
**Author:** Claude (advisory; Darrell governs, Foundation executes — GOVERNANCE-EXECUTION-ADVISORY)
**Pattern:** research-first — reuse proven machinery, cite live sources for new tool choices, no live-audio control code written here. This is the design + research review that precedes any build.
**Status:** DRAFT for Darrell's review. **GPU-gated** (the heavy audio-ML pieces ship when the sovereign CUDA box lands; rough/offline analysis can run on the CPU NAS today).
**Builds on / sibling of:** the **TRAINING** half shipped alongside this spec — the self-paced **"Running the Board: Live Sound for the House of God"** Learn track (`app/src/lib/sound-board-class.js`) + its **sound-engineer SME pipeline lane** (`infra/nas-sme-pipeline/sound-engineer-to-lessons.sh`). The training teaches a human to mix; this assistant HELPS that human — it never replaces them.
**Sibling lanes (reuse, do not collide):** the SME video→knowledge pipeline (`infra/nas-sme-pipeline/`, lane local_eceef6e5 — music-listen / audio analysis), the choir-keyboardist music-listen lane, the keyboardist auto-fingering spec (`2026-06-24-keyboardist-music-lessons-and-auto-fingering-spec.md` — the GPU-gated audio-ML posture is shared), the Learn framework, the worship self-critique spec (the AFTER-review feedback tone-gate is reused).

---

## TL;DR

Darrell wants, for the church's live sound board, **two things**: (1) **TRAINING** the sound team to mix and EQ — **shipped now** as the "Running the Board" Learn track; and (2) a **LOCAL A.I. that ASSISTS** the operator with EQ/mixing **before, during, and after** a service. This spec is **part 2** — the assistant.

**The single binding rule, stated first because everything else bends to it:**

> **ASSISTIVE-ONLY. The A.I. SUGGESTS; a human operator DECIDES and ACTS. The A.I. NEVER autonomously changes the live audio.** A runaway on a live service mix — a feedback notch dropped wrong, a fader yanked, a EQ swept mid-sermon — is unacceptable. There is **no autonomous control path to the live board**, by design, not by config. (This is the live-audio application of `feedback_autonomous_automation_three_brakes` and the assistive-not-authority posture: the human governs the bright line.)

The assistant lives in the **three windows the training track already names** (lesson `snd7-before-during-after`):

- **BEFORE (soundcheck/setup):** listen to each input + the room, **suggest** gain-staging fixes, starting EQ moves (mud/harshness/thin), and — most valuably — **ring-out assistance**: identify the room's feedback-prone frequencies and **suggest** notch frequencies/depths for the operator to dial.
- **DURING (live monitoring + suggestions):** a real-time **advisory readout** — feedback-risk early warning (a frequency starting to ring), level/clip flags, "the lead vocal is getting buried," "low-mid mud building." **Suggestions surface on the operator's screen; the operator acts on the board.** Nothing is applied automatically.
- **AFTER (review of the recording):** analyze the recorded service mix and **suggest** specific, prioritized improvements for next time (a muddy 300 Hz buildup, a harsh cymbal, a buried vocal in the big songs, a hot monitor). This is the **improvement engine** and it ties directly into the **choir ad-lib/rendition + worship self-critique** work (same after-review loop, same gentle tone-gate).

**Compute reality (honest):** real-time spectral analysis + feedback detection + any ML mix-assist is **GPU work** for the responsive, full version. The **CPU-only NAS** (DS1621xs) can run **offline/rough** analysis today (the AFTER window, and a slow BEFORE pass) but is **too slow for dependable real-time** DURING-service assist. So: **AFTER + a basic BEFORE pass are buildable on CPU now; the real-time DURING assistant is GPU-gated** and ships with the CUDA box (same posture as the keyboardist auto-fingering spec and the rest of the GPU-era plan).

**Sovereign + local:** all analysis runs on PoeTech hardware (NAS now, CUDA box later); service audio never leaves the box; no third-party API; nothing trains an external model (DATA-AS-EMPOWERMENT).

---

## 0. Scriptural foundation (Word-first — cited by reference + theme, not a quoted translation)

- **1 Corinthians 14:40 — "decently and in order."** The whole point of mixing for worship: clarity and order so the gathering is not pulled out of worship. The assistant serves that order; it is not a novelty.
- **1 Corinthians 14:33 — God is not a God of confusion but of peace.** A runaway on a live mix is literal confusion in the room — which is exactly why the assistant is forbidden from acting on the live board.
- **1 Chronicles 15:22; Psalm 33:3 — the music leader was appointed because he was *skillful*; "play skillfully."** The assistant grows the operator's skill (training + suggestions), honoring the calling — it does not remove the human from the craft.
- **Colossians 3:23 — "work heartily, as for the Lord."** The hidden craft of the operator is worship; the tool serves the worshipper-operator, it doesn't replace them.

These are printed in the surface's copy, not merely implied. (Reference + theme gloss only; per SCRIPTURE-REFERENCE-STANDARD, fetch the actual translation if a quote is ever wanted — do not paraphrase as a translation.)

---

## 1. What this builds ON (proven pieces — reuse, do NOT rebuild)

| Proven piece | Where | Role here |
|---|---|---|
| **"Running the Board" training track** | `app/src/lib/sound-board-class.js` (shipped with this spec) | The human-skill foundation. The assistant's suggestions speak the SAME vocabulary the operator just learned (gain staging, the frequency ranges, ring-out, monitors-vs-house, choir blend, before/during/after). |
| **Sound-engineer SME pipeline lane** | `infra/nas-sme-pipeline/sound-engineer-to-lessons.sh` (+ prompts, CONSENT) | The engineer's real technique → lessons. The same captured expertise can later **tune the assistant's suggestion rubric** (what the engineer actually does for mud/feedback/choir). |
| **SME video→knowledge pipeline** | `infra/nas-sme-pipeline/` (NAS `/volume1/PoeTech/sme-pipeline/`), lane local_eceef6e5 | The local audio substrate (isolated whisper container, local Ollama, braked, manual-run, verified). The audio-analysis lane extends this — same sovereignty + brakes posture. |
| **Local Ollama (qwen2.5:14b)** | NAS `127.0.0.1:11434` | Turns the numeric analysis into plain, gentle, operator-readable SUGGESTIONS + the AFTER-review narrative. Minutes on CPU; fine for AFTER. |
| **Three-brakes rule** | `feedback_autonomous_automation_three_brakes`; LESSONS-LEARNED P10/P11/P12 | The governing safety frame. Any timer-driven/auto piece (e.g. a batch AFTER-review) ships **inactive**, Tier C, with budget + concurrency lock + kill-switch. The DURING assistant is advisory-only by design. |
| **Worship self-critique tone-gate** | `2026-06-24-keyboardist-music-lessons-and-auto-fingering-spec.md` §7 (spec) | The AFTER-review feedback reuses the **gentle, constructive, never-harsh** tone-gate (proven-to-catch). Suggestions encourage, never shame the operator or the worship team. |
| **GPU-era plan / CUDA box** | DR-0014; sovereign-ai-class diagrams (`vram-ladder`); keyboardist spec §10 | The real-time pieces ship when the GPU box lands. The church RTX 4070 machines are the only real GPUs today. |

**NOT built / honest reality-trace:**
- **No real-time audio capture path into the app exists yet** — the DURING assistant needs an audio tap (console USB/Dante/an interface feeding the analysis box). That's hardware integration, future.
- **No GPU box yet** — real-time analysis is gated on it. CPU NAS = offline/rough only.
- **No live-board control API is in scope, ever** — even if a console exposes one (many do via OSC/MIDI/manufacturer APIs), this design **does not connect to it for output**. Read-only audio in; suggestions to a screen out. (A future "apply this notch?" one-tap that sends an operator-confirmed command to the console is a **separate, explicitly-gated decision** — NOT this spec, and still human-confirmed per action.)

---

## 2. The binding safety model (assistive-only) — stated as architecture, not hope

Per the Verification Doctrine (make the safe path structural, not promised):

1. **No output path to the live audio.** The system's only outputs are **on-screen suggestions** and the **AFTER-review document**. There is no code path that writes to a console, a DSP, an amp, or a fader. This is enforced by **omission** (the capability is never built) and asserted by a **proven-to-catch test**: the analysis module exports only data/suggestions, never a control command.
2. **Human-in-the-loop is the only loop.** Every BEFORE/DURING suggestion is phrased as a suggestion the operator chooses to act on (or ignore). The operator is named, in copy, as the decider.
3. **Read-only audio in.** The assistant taps a **copy** of the audio (a monitor/record bus, an interface input) — it is downstream of the mix, never in the signal path of the mix. If the assistant box dies, **the service mix is completely unaffected** (it was never in the chain).
4. **Three brakes on anything that runs on a clock.** The AFTER batch-review (if scheduled) ships **inactive**, Tier C, with a token/wall-clock **budget**, a single-instance **concurrency lock**, and a **kill-switch** (`feedback_autonomous_automation_three_brakes`). The DURING assistant is **not** a self-triggering automation — it's a live advisory display a human is watching.
5. **No autonomous feedback "fix."** Auto-feedback-suppression hardware exists and acts on its own — but that is a **dedicated, bounded DSP appliance**, not our A.I. Our assistant **suggests** a notch; it never applies one. (If the church wants automatic suppression, that's a hardware FBX/DSP decision, evaluated separately — not an A.I. acting on the board.)
6. **Honest uncertainty.** Suggestions carry confidence and are framed as "consider," not "do." The operator's ears + the sound engineer are the authority; the A.I. can be wrong and says so.

**Proven-to-catch tests (DR-0076):** (a) the analysis API surface exposes no control/output method; (b) every suggestion object is advisory-typed (no "applied" state); (c) the AFTER-review feedback passes the gentle-tone gate (no harsh/shaming language about the operator or team).

---

## 3. BEFORE — soundcheck / setup assist

**Goal:** help the operator start the service prepared (the training track's BEFORE window), faster and more thoroughly.

- **Per-input analysis (offline-OK, CPU-now):** from a short capture of each source at performance level, **suggest**: a gain target (is it too low/noisy or near clipping?), a high-pass point, and obvious tonal fixes (a mud resonance to sweep-and-cut, a harsh presence peak to ease). Spectral features via **librosa**/**Essentia** (spectral centroid for brightness, band energy for mud/harsh). Output: a checklist of *suggested* moves, in the operator's learned vocabulary.
- **Ring-out assistance (the high-value BEFORE feature):** during a controlled ring-out, the assistant listens for the **sustained resonant peaks** as the operator raises level, and **suggests** the frequency + a notch depth for each — the operator dials the EQ. This is **detect-and-suggest**, never auto-notch. Aubio's pitch/peak tracking + an FFT peak-hold identifies the ringing modes; the suggestion is "consider a narrow cut around N Hz."
- **Scene sanity check:** compare today's suggested starting points against the last saved scene and flag drift ("input 4 gain is 12 dB hotter than your usual").

**Compute:** runs on the **CPU NAS today** (offline, a minute or two per pass). No GPU strictly required for the BEFORE window — it's not hard-real-time.

---

## 4. DURING — live monitoring + suggestions (GPU-gated)

**Goal:** a calm, advisory readout on the operator's screen while they mix — the assistant watches the spectrum and levels and **flags risks + opportunities**; the operator acts on the board.

**What it surfaces (suggestions only, on screen):**
- **Feedback early-warning:** a frequency beginning to ring (a narrow band rising and sustaining) → "⚠ possible feedback building ~2.5 kHz — consider easing that monitor / a narrow cut." This is the marquee real-time feature and the one that most needs **low latency** (catch it before the congregation hears it).
- **Level/clip flags:** an input clipping or a channel gone too hot/quiet.
- **Mix-balance hints:** "lead vocal masked under the band — consider +1–2 dB or a presence nudge," "low-mid mud building across the choir mics (~300 Hz)." (Masking/balance heuristics from band-energy + a simple loudness model.)
- **Loudness stewardship:** a running room-loudness estimate vs a target the operator sets (hearing-safety care, the training track's bright line) — a gentle "we're running hot for a while" flag, never an auto-trim.

**Why GPU-gated:** dependable **real-time** spectral analysis + feedback-onset detection + any ML balance model is continuous DSP under a tight latency budget. The **CPU NAS cannot reliably do hard-real-time** alongside its other jobs; this ships on the **sovereign CUDA box**. Until then, the DURING window is **training + the operator's ears**, and the assistant is BEFORE/AFTER only. (Stated honestly — not promised on hardware that isn't live.)

**Latency note (honest):** feedback runs away in well under a second; a useful early-warning must analyze in tens of milliseconds. That latency budget — not raw model size — is the real reason this is GPU/dedicated-DSP work, and why a CPU NAS juggling n8n/Ollama/files is the wrong host for it.

---

## 5. AFTER — review of the recorded mix (CPU-buildable now; the improvement engine)

**Goal:** the training track's AFTER window, made concrete — analyze the recorded service and **suggest** specific, prioritized fixes for next time. This is the **lowest-risk, highest-value, soonest-buildable** piece (offline, no real-time constraint, runs on the CPU NAS).

- **Offline spectral + loudness analysis** of the board-feed/room recording: long-term average spectrum (mud/harsh/thin tendencies), per-section loudness arc, vocal-intelligibility proxy (presence-band energy vs the mix), feedback events that occurred.
- **Local Ollama narrates it gently:** qwen2.5 turns the numbers into a short, **encouraging, prioritized** note — "Strong service. Two things for next time: the low-mids built up around 300 Hz in the full-choir songs (a touch more HPF on the choir mics), and the lead vocal dipped under the band in the last song (ride it up a dB). Everything else sat well." Affirm first, 1–3 concrete next steps, no scores, no shaming — the **worship self-critique tone-gate** (proven-to-catch) governs the wording.
- **Ties the choir ad-lib/rendition + worship self-critique work:** the same after-review loop the worship team uses for their *offering* now has a **sound-engineering** layer for the *mix* — both grace-centered, both formation-not-judgment, both feeding the next service. The operator can also share a suggestion with the worship team ("the choir blend would sit better if…") via the same gentle surface.
- **Feeds the saved scene + the operator's habits** — closes the perpetual-improvement loop (DR-0075): every service leaves the next one better, with evidence.

---

## 6. Research-review — local audio-analysis tooling (live sources, 2026-06-24)

All open-source, all runnable on PoeTech hardware (sovereign). **Honest finding:** there is **no single turnkey "real-time feedback-detection + auto-notch" open-source library** — feedback detection is a **technique** (FFT peak-hold / sustained-tone detection → notch coefficients) built **inside** a DSP framework, and commercial auto-suppressors (Sabine/dbx AFS, Behringer FBQ) are dedicated hardware. So our path is: **analysis libraries we already trust + a thin feedback-onset detector we write** — and **suggest**, never auto-apply.

| Tool | What it is | Sovereign fit | Role |
|---|---|---|---|
| **aubio** | Lightweight real-time audio analysis (onset, pitch, peak tracking); C + Python; BSD | Tiny; runs anywhere incl. CPU NAS | **Feedback-onset + pitch/peak detection** (the ring-out + DURING early-warning detector). Recommended core. |
| **librosa** | Python audio/music analysis; spectral_centroid, band energy, MFCC, STFT | CPU-fine for OFFLINE (AFTER + BEFORE pass) | **Offline spectral analysis** for the AFTER review + BEFORE per-input pass. Recommended for offline. |
| **Essentia** (MTG/UPF) | C++ (Python-wrapped) spectral/temporal/tonal descriptors; real-time-capable extractors | C++ core → fast enough for near-real-time on a GPU/strong CPU box | **DURING-window** spectral features when the GPU box lands; heavier-duty than librosa. |
| **JUCE** | C++ real-time audio app/plugin framework | The serious real-time host | If the DURING assistant becomes a true low-latency app, JUCE is the framework. GPU-era. |
| **SoX / ffmpeg** | Audio I/O, resample, capture, format | Everywhere | Plumbing — capture the record bus, segment for offline analysis. |
| **Auto-feedback-suppression appliances** (Sabine/dbx AFS, Behringer FBQ) | Dedicated hardware that detects + notches automatically | N/A (hardware) | **Noted, NOT adopted as "A.I."** If the church wants automatic suppression, it's a bounded DSP appliance decision — separate from this assistant, which only suggests. |

**Recommended sovereign stack:** **aubio** (real-time peak/onset → feedback-onset detector) + **librosa** (offline spectral for BEFORE/AFTER) + **Essentia** (DURING spectral on the GPU box) + **local Ollama qwen2.5** (numbers → gentle suggestions/AFTER narrative) + **SoX/ffmpeg** (capture/segment). All local; nothing leaves the box.

---

## 7. Compute, sovereignty, GPU-gating (summary)

| Window | Compute | Buildable when |
|---|---|---|
| **BEFORE** (per-input + ring-out suggestions) | CPU NAS (offline/near-offline; librosa + aubio) | **Now** (CPU), no real video/audio needed to stand up the analysis + suggestion engine on samples. |
| **DURING** (real-time feedback early-warning + balance hints) | **GPU box** (low-latency DSP; aubio/Essentia/JUCE) | **GPU-gated** — ships with the CUDA box. Needs an audio-tap into the analysis host (future hardware integration). |
| **AFTER** (recorded-mix review + gentle suggestions) | CPU NAS (offline; librosa + Ollama) | **Now** (CPU). Lowest-risk, highest-value first build. Any *scheduled* batch run = Tier C + three brakes, inactive on ship. |

**All windows, binding:** sovereign/local (PoeTech hardware), read-only audio in, **suggestions out — never live-board control**, gentle tone-gate on operator-facing narrative.

---

## 8. Tiering & rollout (RELEASE-TIERS)

- **AFTER review (CPU):** **Tier B** to build the offline analysis + the gentle suggestion surface; the worship-team-facing wording is **Tier C judgment** (the tone-gate proven-to-catch + family/engineer eyes). If a *scheduled* batch is added, **Tier C + three brakes, inactive on ship**.
- **BEFORE assist (CPU):** **Tier B** — advisory checklist; verify suggestions against the sound engineer's real practice (faithful, like the SME extraction).
- **DURING assist (GPU):** **GPU-gated**; when built, **Tier C** — it's a live-service surface; soak + sound-engineer sign-off; **assistive-only proven-to-catch** (no control path) is a merge gate.
- **Any console-control bridge ("apply this notch?")** — **explicitly out of scope here**; if ever pursued, its own DR + Tier C + per-action human confirm. Default posture: **no output to the board.**

---

## 9. Build order (when Darrell greenlights — NOT done here)

1. **AFTER offline analyzer** (CPU): librosa spectral/loudness over a recording → numeric report → Ollama gentle narrative (tone-gated). Verify on a sample recording (the way the SME profiles were verified on sample transcripts). *Cheap, ready now.*
2. **BEFORE per-input + ring-out suggester** (CPU): aubio peak/onset + librosa band energy → suggested gain/HPF/notch checklist. Proven-to-catch: suggestions are advisory-typed, no control output.
3. **In-app surface** (sound-team-scoped): a "Board Assist" panel that shows BEFORE checklist + AFTER review, in the operator's learned vocabulary, linked from the training track. Suggestions only; the operator is the decider (copy says so).
4. **DURING real-time assistant** (GPU box): aubio/Essentia feedback early-warning + balance hints → live advisory readout. Latency-budgeted. Assistive-only proven-to-catch is the merge gate. Audio-tap hardware integration.
5. **SME tie-in:** use the sound-engineer lesson extraction to tune the suggestion rubric (what the engineer actually does for mud/feedback/choir) — faithful, verified.

---

## 10. Honest constraints / what does NOT exist yet (reality-trace, Verification Doctrine)

- **No GPU box yet** → the real-time DURING assistant is genuinely gated on hardware that isn't live. CPU NAS = offline/rough only. Stated, not hidden.
- **No audio-tap into an analysis host yet** → DURING needs a record-bus/interface feed; that's future hardware integration.
- **No turnkey feedback-notch library exists** → we build a thin feedback-onset detector on aubio and **suggest**; we do not adopt auto-notch hardware as "our A.I."
- **Real-time feedback detection is latency-hard** → tens of ms; the reason it's GPU/dedicated-DSP work, not a CPU-NAS side job.
- **Full-band live audio is messy** → balance/masking hints are heuristic suggestions, not truth; the operator's ears govern.
- **No live-board control, ever (in this spec)** → suggestions to a screen; a human acts. By design, not config.
- Cited tools reflect live web sources (2026-06-24), provenance below; not training-data recall.

---

## 11. Institutional-Memory Event (church-work / sound)

```json
{
  "id": "evt-20260624-live-sound-eq-mix-ai-assist",
  "date": "2026-06-24",
  "type": "church-work",
  "title": "Spec: Local-AI EQ/Mix ASSISTANT for the live sound board (before/during/after, assistive-only, sovereign, GPU-gated) + shipped training track",
  "description": "Two-part request for the COLG live sound board: (1) TRAINING the sound team to run the board + EQ/mix -- SHIPPED as the self-paced 'Running the Board: Live Sound for the House of God' Learn track (app/src/lib/sound-board-class.js: 7 lessons -- signal chain, gain staging, EQ frequency ranges, taming feedback, monitors-vs-house, mixing the worship team + choir, before/during/after) on the shared Learn engine, sourced/verified by a NEW sound-engineer SME pipeline lane (infra/nas-sme-pipeline/sound-engineer-to-lessons.sh). (2) A local-A.I. ASSISTANT (this spec, GPU-gated) that HELPS the operator BEFORE (gain/EQ/ring-out suggestions), DURING (real-time feedback early-warning + level/balance hints), and AFTER (recorded-mix review + gentle prioritized suggestions, tied to the choir ad-lib/worship self-critique after-review loop). BINDING: assistive-only -- the A.I. suggests; a human operator decides and acts; NO autonomous control of the live board, by design (no output path); read-only audio in; sovereign/local; three brakes on any scheduled piece.",
  "resolution": "Training shipped (lib + host wiring + 22 passing tests + SME lane). Assistant is research-reviewed + specced, GPU-gated: AFTER + a basic BEFORE pass are CPU-NAS-buildable now (librosa offline spectral + aubio peak/onset + local Ollama gentle narrative, tone-gated); real-time DURING is GPU-box work (latency-hard) + needs an audio tap. Recommended sovereign stack: aubio (feedback-onset/ring-out) + librosa (offline BEFORE/AFTER) + Essentia (DURING on GPU) + Ollama qwen2.5 (numbers->suggestions) + SoX/ffmpeg. No turnkey feedback-notch lib exists -- we detect-and-suggest, never auto-notch; auto-suppression hardware noted but NOT adopted as 'A.I.' Assistive-only enforced structurally (no control output path) + proven-to-catch tests.",
  "tags": {
    "workflows": [],
    "modules": ["learn", "sound-board", "church", "choir", "worship", "sme-pipeline", "audio-analysis", "scripture"],
    "sector": ["church", "education", "community", "spiritual"],
    "senders": ["dpoe"]
  },
  "provenance": {
    "who": "Claude (advisory)",
    "when": "2026-06-24",
    "source_surface": "research-review + code survey (church-classes.js, living-lessons-class.js, ChurchLearn.jsx, learn-framework.js, infra/nas-sme-pipeline/*) + live web research (aubio, librosa, Essentia, JUCE, feedback-detection technique)"
  },
  "learnings": "1) Two halves: TRAINING ships now (Learn engine already does self-paced/levels/quiz/tutor); the live ASSISTANT is GPU-gated. 2) Assistive-only must be ARCHITECTURAL -- no output path to the live board, read-only audio in, proven-to-catch that the analysis module exposes no control command. A live-mix runaway is unacceptable. 3) The three windows (before/during/after) map to the training track's snd7 lesson -- same vocabulary, so suggestions speak what the operator just learned. 4) AFTER review is the soonest/safest/highest-value build (offline, CPU NAS, librosa + Ollama, tone-gated) + ties the worship self-critique after-review loop. 5) Real-time DURING is latency-hard (feedback runs away in <1s; need tens-of-ms analysis) -> GPU/dedicated-DSP, not a CPU NAS juggling other jobs. 6) No turnkey OSS feedback-notch lib; detection is a technique (FFT peak-hold/sustained-tone -> notch coeffs) inside a framework -> we suggest a notch, never auto-apply; auto-suppressor HARDWARE is a separate bounded-DSP decision, not our A.I. 7) Sovereign stack: aubio + librosa + Essentia + Ollama + SoX/ffmpeg, all local. 8) GPU box + an audio tap are the real prerequisites for DURING.",
  "related_artifacts": [
    "docs/99-session-notes/2026-06-24-live-sound-eq-mix-ai-assist-spec.md",
    "app/src/lib/sound-board-class.js",
    "app/src/__tests__/sound-board-class.test.js",
    "infra/nas-sme-pipeline/sound-engineer-to-lessons.sh",
    "infra/nas-sme-pipeline/SOUND-SOURCE.md",
    "docs/99-session-notes/2026-06-24-keyboardist-music-lessons-and-auto-fingering-spec.md",
    "https://github.com/aubio/aubio",
    "https://librosa.org/",
    "https://essentia.upf.edu/",
    "https://juce.com/"
  ],
  "status": "open"
}
```

---

## Sources (live research, 2026-06-24)

**Audio analysis libraries:**
- [aubio — real-time audio analysis (onset, pitch, peak)](https://github.com/aubio/aubio) · [aubio.org](https://aubio.org/)
- [librosa — audio & music signal analysis in Python](https://librosa.org/) · [librosa: Audio and Music Signal Analysis in Python (SciPy 2015 paper)](https://brianmcfee.net/papers/scipy2015_librosa.pdf)
- [Essentia (MTG/UPF) — C++/Python audio analysis](https://essentia.upf.edu/)
- [JUCE — C++ real-time audio framework](https://juce.com/)

**Feedback detection / live-sound DSP (technique, not a single library):**
- [Top open-source audio processing libraries (overview, 2026)](https://blog.fileformat.com/en/audio/top-7-open-source-audio-processing-libraries-in-2026/)
- [webprofusion/OpenAudio — open-source audio software list](https://github.com/webprofusion/OpenAudio)
- Acoustic feedback cancellation — the standard approach: detect the feedback frequency, convert to notch-filter coefficients (e.g., US Patent 7,664,275; US Patent 7,203,324). *We use the DETECT half and SUGGEST a notch; we do not auto-apply.*

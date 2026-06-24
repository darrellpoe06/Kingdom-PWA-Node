# Spec + Research-Review — Local-AI Live-Mix Engine for the COLG Yamaha QL booth: per-voice adaptive EQ + STAGED AUTONOMY (assistive → supervised → autonomous), hard safety bounds, human-on-the-loop, sovereign on the church 2× RTX 4070

**Date:** 2026-06-24 (revised same day with Darrell's grounding: real booth → Yamaha digital → already software-controlled → QL-series → autonomy direction-change → per-voice EQ core → sample-rate monitor → 2× RTX 4070 hardware)
**Author:** Claude (advisory; Darrell governs, Foundation executes — GOVERNANCE-EXECUTION-ADVISORY)
**Pattern:** research-first — reuse proven machinery, cite live sources for new tool choices, no live-board control code written here. Design + research review that precedes any build.
**Status:** DRAFT for Darrell's review. **Autonomy stages are armed one at a time, each behind the three brakes + Darrell's explicit go** (autonomous control of a live service board is the highest-stakes automation we have proposed — `feedback_autonomous_automation_three_brakes`).
**Builds on / sibling of:** the **TRAINING** half — the self-paced **"Running the Board: Live Sound for the House of God"** Learn track (`app/src/lib/sound-board-class.js`, now digital-/Yamaha-QL-aware) + its **sound-engineer SME pipeline lane** (`infra/nas-sme-pipeline/sound-engineer-to-lessons.sh`). A skilled human is required at EVERY autonomy stage (supervise / co-mix / take over) — so the training is permanently valuable, not a throwaway.
**Sibling lanes (reuse, do not collide):** the SME video→knowledge pipeline / music-listen + audio-analysis lane local_eceef6e5; the choir-keyboardist lane; the keyboardist auto-fingering spec (`2026-06-24-keyboardist-music-lessons-and-auto-fingering-spec.md`, shared audio-ML posture); the worship self-critique after-review tone-gate; the choir voices / renditions + ad-libs work (the per-voice learning data).

---

## TL;DR (read this first)

The church's booth is a **Yamaha QL-series digital console** (QL1 or QL5 — confirm by channel count) at back-of-house, **already controlled over the network today** via the Yamaha software (QL Editor / QL StageMix on iPad / ProVisionaire), alongside a multi-monitor switcher/stream rig + a laptop; the sanctuary has a stage with a drum kit and two side projection screens. Because the board is digital and **already software-controllable**, an A.I. can both **read console state** (EQ curves, levels, meters, scenes) and — in later, earned stages — **write** changes through that same control channel.

**Darrell's destination (direction-change, 2026-06-24):** the live-mix A.I. is **not assistive-only forever**. The GOAL is **autonomous live mixing** — once the parameters are set, a person isn't *needed* to mix; the local A.I. runs it and gets **better than a human over time** through training — **with a human able to take over or co-mix at any instant.** Human-on-the-loop is permanent; "unattended-capable" is the bar, not "unattended-and-unwatchable."

**The central mixing capability:** **per-mic, per-voice adaptive EQ** — for each mic channel, analyze the voice currently on it and dial EQ (+ basic dynamics) so THAT voice sounds its best (clarity, intelligibility, less boom/harshness/sibilance/feedback-prone bands), re-optimizing when the voice on a mic changes, optionally recognizing known voices (choir members, BG, soloists) and recalling their best profile. Goal = the best blend: each voice good individually *and* sitting in the whole mix.

**Because the board is controllable, restraint matters MORE, not less.** Autonomy is **earned in three stages**, each gated by **hard safety bounds** (level ceilings, feedback hard-stop, rate-limited moves, scene bounds, full logging), an **instant human takeover / co-mix**, the **three brakes** (budget, concurrency lock, kill-switch), and **Darrell's explicit go**.

**Hardware (recalibrated):** the church **already has 2× CUDA machines with RTX 4070 GPUs** (~12 GB VRAM each — confirm exact variant; two separate boxes). The audio-mix A.I. **does NOT wait on the weekend big-box purchase** — real-time-ish voice analysis, per-voice EQ inference, feedback detection, and faster-whisper all fit comfortably on a 4070. So **assistive (Stage 1) and supervised-auto (Stage 2) are buildable on existing church hardware NOW**; full autonomy (Stage 3) earns its stage via **proven performance + Darrell's go**, not a hardware gate. Only 70B+ frontier LLM work still wants the bigger box.

**Sovereign + local:** all analysis + control runs on PoeTech/church hardware; service audio + console state never leave the box; no third-party API; nothing trains an external model (DATA-AS-EMPOWERMENT).

---

## 0. Scriptural foundation (Word-first — cited by reference + theme, not a quoted translation)

- **1 Corinthians 14:40 — "decently and in order."** Clarity so the gathering is not pulled out of worship. The engine serves that order.
- **1 Corinthians 14:33 — God is not a God of confusion but of peace.** A runaway on a live mix is literal confusion in the room — which is precisely why the hard bounds + instant takeover exist before any autonomy.
- **1 Chronicles 15:22; Psalm 33:3 — appointed because *skillful*; "play skillfully."** The engine pursues skill (better mixing over time) and *raises* the human's skill; it never removes the human from the craft.
- **Colossians 3:23 — "work heartily, as for the Lord."** The hidden craft is worship; the tool serves the worship and the worshipper-operator.

(Reference + theme gloss only; per SCRIPTURE-REFERENCE-STANDARD, fetch the actual translation if a quote is ever wanted — never paraphrase as a translation.)

---

## 1. The REAL environment (reality-trace, DR-0076 — grounded in Darrell's photos + close-up)

| Element | What it is | Design implication |
|---|---|---|
| **Console** | **Yamaha QL-series digital console** (QL1 or QL5). Close-up shows the central **touchscreen** (on the **Parametric EQ** view), the **TOUCH AND TURN** encoder, the **Selected Channel** section, and channel strips with **SEL/ON** — the QL/CL-family signature. **Confirm QL1 vs QL5 by channel count** (QL1 = 32 mono + 2 st in; QL5 = 64 + 8 st) via SME capture. | Train + design around the **digital** workflow: recallable **scenes/snapshots**, **channel libraries**, per-channel **EQ/dynamics**, **Selected Channel** editing — not analog knob-only. |
| **Control today** | They **already adjust the board through software online** (remote). QL = **QL Editor** (Win/Mac), **QL StageMix** (iPad), **ProVisionaire**; Dante standard; separate IPs for network remote / remote head-amp / Dante. | A **live network control channel to the console exists today.** The A.I. can READ state through it now and (earned stages) WRITE through it later. |
| **Booth** | Multi-monitor back-of-house: an **audio software** screen (waveform/meters), a **video switcher / stream** screen, **camera/production feeds**, plus a **laptop**. | The A.I.'s suggestions surface **in/alongside the software they already watch**; multitrack capture (Dante/USB) is available for review + virtual soundcheck. |
| **Sanctuary** | Stage with a **drum kit** + **two side projection screens**. | Real sources to mix (drums = a multi-mic, feedback-and-bleed-heavy source); the two screens are a future surface for any operator-facing readout if desired. |

**Exact-integration gap (honest):** the precise QL model (QL1 vs QL5) and the exact remote-control protocol path (Yamaha QL Editor uses Yamaha's own console-link; third-party IP control on CL/QL is typically via Yamaha's remote protocol / SCP-style TCP, MIDI, or an OSC bridge) **must be confirmed** — by the SME capture naming the gear, or a board/menu close-up. **Design generically to the QL family now; tighten to the model + protocol once known.** Do NOT hard-code a protocol we haven't verified.

---

## 2. The destination, and WHY it is staged

**Destination (Darrell):** parameters set → the local A.I. mixes the service, unattended-*capable*, improving past human consistency over time, **with a human able to take over or co-mix at any moment.**

**Why staged, not switch-flipped:** autonomous control of a **live service board** is the single highest-stakes automation in this whole platform — live audio can **damage hearing and gear**, and a bad move lands on the whole congregation in real time, mid-worship. The 2026-06-06 runaway lesson (LESSONS-LEARNED P10/P11/P12) is the standing warning. So autonomy is **earned**, stage by stage, each one proving out before the next is armed — and each armed only behind the hard bounds, the three brakes, and Darrell's explicit go. This is not caution for its own sake; it is the only responsible path to the destination Darrell named.

---

## 3. The three autonomy stages (earn each with proven performance + Darrell's go)

| Stage | What the A.I. does | Human role | Hardware | Status |
|---|---|---|---|---|
| **1 · ASSISTIVE** | Reads QL state (EQ/levels/meters/scenes) + the audio; **SUGGESTS** per-voice EQ, level, and feedback fixes, in/alongside the booth software. | **Applies every change.** | **Church 2× RTX 4070 — NOW** (real-time-ish read + suggest); CPU NAS for offline AFTER review. | **Buildable now.** |
| **2 · SUPERVISED-AUTO** | **Makes the moves on the live mix WITHIN tight bounds** (per-voice EQ, gentle level rides, feedback notch), each move **rate-limited + logged**; proposes bigger moves for confirmation. | **Watches with one-touch override**; can veto or grab instantly; co-mixes. | **Church 2× RTX 4070 — pulled FORWARD** off existing hardware. | **Buildable on current church hardware; armed only after Stage 1 proves out + Darrell's go.** |
| **3 · AUTONOMOUS (human-on-the-loop)** | Parameters set; **runs the mix unattended-capable**; handles the service end to end within bounds. | **Can take over or co-mix anytime**; supervises; reviews logs. | 2× 4070 likely sufficient for the audio engine; a bigger box only if a larger model is needed. | **Earns its stage via proven Stage-2 performance + Darrell's explicit go — NOT a hardware gate.** |

**Gating rule (binding):** a stage is armed ONLY when (a) the prior stage has **proven performance** on real services (logged, measured — Verification Doctrine), (b) the **hard bounds + brakes are in force and proven-to-catch**, and (c) **Darrell explicitly says go**. Each higher-autonomy build ships **inactive** and is turned on **with someone watching** (never unattended-first, never while Darrell is traveling — `feedback_autonomous_automation_three_brakes`).

---

## 4. HARD SAFETY BOUNDS — the "parameters set" (non-negotiable, enforced structurally)

These are the bounds the A.I. **can never exceed**, at every stage that writes to the board. They are enforced as **structural limits + proven-to-catch gates** (DR-0076), not as model politeness:

1. **Output-level / SPL ceiling.** A hard maximum the A.I. can never exceed — **per-channel limits AND a master ceiling** — to protect the congregation's hearing and the gear. Tied to a room-SPL target. The A.I. cannot command a level above the ceiling; the attempt is clamped and logged.
2. **Feedback hard-stop.** Continuous feedback detection with **automatic suppression AND a hard stop** — a feedback runaway is **never** allowed to develop. (This is the one piece of genuine auto-action even at low stages, because a runaway is pure harm; it is bounded, dedicated, and logged.)
3. **Rate-limited moves.** No sudden jumps or cuts during worship — every parameter change is **smooth, bounded in size and speed**. A fader/EQ move is a ramp within a max delta-per-second, never a snap.
4. **Instant human takeover + co-mix (the mix kill-switch).** A physical/one-tap **override that freezes A.I. control immediately** and hands the board fully to the human — the dead-man's switch for the mix. **Co-mix mode** lets human + A.I. work the same board together (A.I. holds some channels, human holds others). Human-on-the-loop is always available, at every stage.
5. **Scene-bounded.** The A.I. operates **within recallable scene/snapshot bounds** — it can move within the safe envelope of a known-good scene, and a one-touch **scene recall** instantly restores a known state.
6. **Full observability.** **Every move is logged** (what, when, why, the analysis that drove it) — to the in-app surface (ties the OpsBoard / loop-health observability), so a human can review, trust, and correct. An unlogged move is a bug.
7. **The three brakes.** **Budget** (compute/time ceiling per run), **concurrency lock** (single instance — never two controllers on one board), **kill-switch** (auto-pause on overrun, repeated anomaly, lost heartbeat, or a failed bound check → freeze to the last safe scene + hand to human).

**Proven-to-catch (DR-0076), before ANY stage that writes:** tests that demonstrate the level ceiling clamps an over-ceiling command; the feedback hard-stop fires on a synthetic runaway; a too-fast/too-large move is rejected; the takeover freezes A.I. control within one control cycle; the kill-switch trips on a forced anomaly. **A bound that hasn't been shown to catch the break is not a bound.**

---

## 5. Human takeover + co-mix design

- **Takeover** = one physical/one-tap action that **immediately freezes** all A.I. writes and gives the human the board. Latency budget: within one control cycle (tens of ms). Independent of the A.I.'s health — if the A.I. hangs, takeover still works (it's a control-channel/relay-level cut, not an A.I. request).
- **Co-mix** = human and A.I. on the same board: the operator assigns which channels/buses the A.I. holds (e.g., "you ride the choir mics' per-voice EQ; I'll ride the band"), the A.I. stays in its lane, and either can hand a lane back. The A.I. never writes outside its assigned lane.
- **On-the-loop readout** = the booth software / a side surface shows what the A.I. is doing and why, so the human supervises with full context (no black box).

---

## 6. CENTRAL capability — per-mic, per-voice adaptive EQ

This is the heart of what Darrell wants: **make each voice on each mic sound its best, for the voice that's on it right now.**

**The loop, per mic channel:**
1. **Analyze the voice currently on the mic** — tonal profile (spectral balance), problem resonances (boom/mud ~200–400 Hz, honk ~800 Hz–1 kHz, harsh ~3–4 kHz), sibilance (~6–8 kHz), presence/intelligibility (~2–6 kHz), and feedback-prone bands for this mic/position.
2. **Derive the per-voice EQ (+ basic dynamics)** — a subtractive-first EQ curve + a sensible HPF + gentle compression/de-ess that make THAT voice clear and intelligible and sit in the mix — expressed in the QL's channel-EQ/dynamics terms so it maps straight onto the board.
3. **Adapt on voice change** — voices rotate per service (different singers/speakers on a mic). The engine **detects the voice changed** and **re-optimizes**, so each person sounds their best in the moment (not a stale curve from the last person).
4. **Optional voice profiles (ties the choir voices / renditions work)** — recognize **known voices** (choir members, BG, soloists) via a local speaker-embedding model and **recall their best profile** as the starting point; an **unknown voice → optimize from scratch**. Profiles improve over time from the rendition/multitrack history.
5. **Best blend** — optimize each voice **individually AND** for how it sits in the overall mix (masking-aware: keep the lead intelligible over band + choir).

**Within the staged autonomy + hard bounds:** Stage 1 **suggests** the per-voice curve (operator applies on the QL); Stage 2 **applies it within bounds** (rate-limited, level-capped, logged); Stage 3 runs it autonomously. **Never** exceeds level/feedback/rate limits; **human takeover always.** Christ-centered: the point is the **clarity of the worship and the Word** — every voice heard, the message understood.

**Honesty:** voice-adaptive EQ + voice-ID is ML — **real-time on the 4070s, offline analysis on CPU now.** It is presented as **suggestions first**, proven out, then promoted to higher autonomy.

---

## 7. The learning loop — "better than a human over time"

- **Trains on:** the **multitrack / rendition history** (Dante/USB virtual-soundcheck captures), **per-service feedback** (what the operator corrected, the AFTER-review findings), and the **choir renditions / ad-libs** (the per-voice data + how each voice should sit).
- **Per-voice profiles** sharpen each service; **mix decisions** (what worked, what the human overrode) become training signal — the override is gold: it's a labeled "the human preferred X."
- **The bar:** more **consistent** than a tired human at the end of a long service (the honest version of "better than a human" — consistency + tirelessness + instant feedback response, not artistry replacing the human).
- **Promotion discipline (binding):** a learned improvement ships into **higher autonomy ONLY after it proves out in supervised mode** on real services (Verification Doctrine — measured, logged, not claimed). Learning never silently widens the bounds.

---

## 8. Integration with the Yamaha QL (verified family capabilities; confirm model + protocol)

- **Read/write path:** the QL is controlled today via **QL Editor** (Win/Mac), **QL StageMix** (iPad), **ProVisionaire**, over the network. The engine reads console state + (earned stages) writes via the **Yamaha remote-control protocol** — the exact path (Yamaha's console protocol / a documented IP control / MIDI / an OSC bridge) is **to be confirmed** for QL specifically; design behind a thin **console-adapter** so the protocol can be pinned without touching the engine.
- **Scenes / snapshots / channel libraries:** the engine operates **within recallable scenes** (bound #5) and can recall a known-good scene instantly. Channel libraries hold per-voice/per-input starting points.
- **Dante / USB multitrack → virtual soundcheck:** QL has **Dante** standard + USB recording; multitrack captures drive the **AFTER review** and **virtual soundcheck** (mix the recorded service with the band absent) — the safe sandbox where the A.I.'s per-voice EQ + mix moves are **rehearsed and proven before they ever touch a live service** (this is the natural Stage-1→Stage-2 proving ground).
- **Selected Channel EQ/dynamics:** the QL's per-channel parametric EQ + dynamics are exactly the per-voice-EQ target surface (the close-up was on the PEQ view) — suggestions are expressed in those terms.

---

## 9. Proactive monitors / safeguards (future value — NOT a present incident)

An earlier screenshot showed a **"Sample Rate Mismatch on USB, Console: 48000 Hz"** warning. **Per Darrell, that (and the other issues in the stale screenshots) is ALREADY FIXED — the current rig is clean.** Do **not** treat it as a present incident or chase it.

**Keep it as a PROACTIVE MONITOR feature**, because the AFTER-review + virtual-soundcheck depend on clean multitrack: the system should **detect + surface** a USB/Dante **sample-rate mismatch** (device/DAW ≠ console 48 kHz) if it ever recurs, and state the **fix direction** (set the USB interface/DAW to match the console's 48 kHz, or the console to the device). It's a human/sound-tech fix; the system's job is to **flag it early** so a garbled capture never silently breaks a virtual soundcheck. Bundle with other proactive health checks (clock/sync, clip, dropped Dante device, hot channel).

---

## 10. Hardware + compute — recalibrated to the church's existing GPUs

| Workload | Fits on a **church RTX 4070** (~12 GB)? | Note |
|---|---|---|
| Real-time-ish **voice characterization + per-voice EQ inference** | **Yes** | The core audio engine fits comfortably. |
| **Feedback detection / hard-stop** (aubio + DSP) | **Yes** (light) | Latency-bound; a 4070 has ample headroom. |
| **Speaker-ID / voice embeddings** (pyannote / SpeechBrain / Resemblyzer) | **Yes** | pyannote 3.1 ≈ 2.5% real-time-factor on GPU — easily real-time on a 4070. |
| **faster-whisper** transcription | **Yes** | Already planned for the SME pipeline; fast on a 4070. |
| Mid-size **LLM (~7–14B)** for suggestion narration / AFTER review | **Yes** (quantized) | qwen2.5 7–14B fits; the AFTER narrative + gentle suggestions. |
| **70B+ frontier LLM** | **No** — needs the bigger box | Not required for the mix engine; only for unrelated frontier-reasoning tasks. |

**Timeline impact (the recalibration):** the audio-mix A.I. is **hardware-ready NOW** on the church's 2× RTX 4070 (two separate boxes; confirm exact 4070 variant + VRAM). **Assistive (Stage 1) and Supervised-Auto (Stage 2) are buildable on current church hardware** — the supervised stage is **pulled forward**, no longer waiting on the weekend purchase. **Full autonomy (Stage 3) is gated on proven performance + Darrell's go, NOT on hardware.** Two 4070s also allow splitting the load (e.g., one box: voice analysis + EQ; the other: speaker-ID + transcription) or a hot spare for resilience.

**Sovereign + local, every stage:** audio + console state stay on church hardware; no external API; nothing trains an outside model.

---

## 11. Research-review — local tooling (live sources, 2026-06-24)

All open-source / sovereign, all runnable on the church 4070s (real-time) or the CPU NAS (offline).

| Layer | Tool | Role |
|---|---|---|
| **Real-time analysis / feedback** | **aubio** (onset/pitch/peak; BSD) | Feedback-onset + ring-out detection + the hard-stop trigger. |
| **Spectral analysis** | **librosa** (offline) / **Essentia** (C++, near-real-time on GPU/strong CPU) | Per-voice tonal characterization, masking analysis, AFTER review. |
| **Voice-ID / embeddings** | **pyannote 3.1** (recommended; ~2.5% RTF on GPU), **SpeechBrain** (ECAPA embeddings), **Resemblyzer** (easiest, open-set), **NVIDIA NeMo** | Recognize known voices → recall best profile; unknown → from scratch. |
| **Per-voice EQ logic** | bespoke (subtractive-first rules informed by the SME's real practice) + ML over the rendition history | Derive the curve; the sound engineer's captured technique tunes the rubric (faithful, like the SME lessons). |
| **Real-time host** | **JUCE** (C++) if a true low-latency app is needed | The serious real-time DSP host for Stage 2/3. |
| **LLM narration** | local **Ollama** (qwen2.5 7–14B) | Turns analysis into gentle, plain suggestions + the AFTER narrative (tone-gated). |
| **Console control** | thin **console-adapter** over the Yamaha QL remote protocol (confirm) | Read state now; write within bounds in earned stages. |
| **Capture/plumbing** | **Dante** (standard on QL) / **SoX / ffmpeg** | Multitrack for virtual soundcheck + AFTER review. |

**Honest finding (unchanged):** there is **no turnkey open-source "real-time feedback-detection + auto-notch" library** — feedback handling is a technique (FFT peak-hold / sustained-tone → notch coefficients) built inside a framework. We build a thin detector on aubio; the **hard-stop** is a bounded, dedicated safeguard (bound #2). Commercial auto-suppressors are noted, not adopted as "the A.I."

---

## 12. Tiering & rollout (RELEASE-TIERS + three-brakes)

- **Stage 1 ASSISTIVE (read + suggest), AFTER review, per-voice-EQ SUGGESTIONS, proactive monitors:** **Tier B** to build (advisory; no writes); worship-team-facing wording is **Tier C judgment** (tone-gate proven-to-catch). Read-only console access. **Buildable now on the 4070s.**
- **The hard-bounds framework + console-adapter (read-only first) + the takeover/kill-switch + logging:** **build NOW alongside Stage 1**, even before any write — the bounds must exist and be proven-to-catch before a single write is enabled.
- **Stage 2 SUPERVISED-AUTO (bounded writes):** **Tier C, ships inactive**, armed only after Stage 1 proves out + the bounds are proven-to-catch + **Darrell's explicit go**; turned on with someone watching. Three brakes mandatory.
- **Stage 3 AUTONOMOUS:** **Tier C, ships inactive**, armed only after Stage 2 proven performance on real services + **Darrell's explicit go**; never unattended-first, never while Darrell travels.

---

## 13. Build order (when Darrell greenlights — NOT done here)

1. **Console-adapter (READ-ONLY) for the QL** — confirm model + protocol (SME capture / close-up), read EQ/levels/meters/scenes. Proven-to-catch: the adapter exposes read methods only; no write path compiled in yet.
2. **The hard-bounds + safety framework** — level ceiling, feedback hard-stop, rate-limiter, scene bounds, **instant takeover/kill-switch**, full logging, three brakes — **with proven-to-catch tests on each bound**, BEFORE any write capability exists.
3. **Stage 1 engine (4070):** real-time voice characterization (Essentia/aubio) + **per-voice EQ suggestion** + feedback detection → suggestions in the booth software; AFTER review (librosa + Ollama, tone-gated); proactive monitors (sample-rate/sync). Virtual-soundcheck sandbox for proving.
4. **Voice-ID + profiles** (pyannote/SpeechBrain/Resemblyzer) — recall best profile for known voices; ties the choir renditions/ad-libs data.
5. **Stage 2 SUPERVISED-AUTO** — enable **bounded** writes through the adapter (per-voice EQ + gentle rides + feedback notch), rate-limited + logged, one-touch override + co-mix; prove on virtual soundcheck, then live **with someone watching**; **Darrell's go** to arm.
6. **Learning loop** — train per-voice profiles + mix preferences on multitrack/rendition history + operator overrides; promote improvements to higher autonomy ONLY after supervised proof.
7. **Stage 3 AUTONOMOUS** — only after Stage 2 proven performance + **Darrell's go**; human-on-the-loop always.

---

## 14. Honest constraints / what does NOT exist yet (reality-trace, Verification Doctrine)

- **Exact QL model (QL1 vs QL5) + the write-control protocol path are unconfirmed** — design generically to the QL family; pin via SME capture / a board close-up before building the write adapter. Do not hard-code an unverified protocol.
- **No console-control code exists** — read-only adapter is step 1; writes are gated behind proven bounds + stages + Darrell's go.
- **Autonomous live mixing is genuinely hard + high-stakes** — staged, bounded, human-on-the-loop, earned. "Better than a human" = more consistent/tireless, proven on real services, not claimed.
- **Voice-adaptive EQ + voice-ID accuracy is real but imperfect** — suggestions first; the human's ears + the sound engineer govern; rotating/overlapping voices on one mic are a known hard case.
- **The sample-rate mismatch is FIXED / stale** — kept only as a future proactive monitor, not chased.
- **The church 4070 variant + VRAM should be confirmed** — design targets ~12 GB; verify (4070 vs 4070 Ti / Super changes VRAM).
- Cited tools + QL capabilities reflect live web sources (2026-06-24), provenance below; not training-data recall.

---

## 15. Institutional-Memory Event (church-work / sound)

```json
{
  "id": "evt-20260624-live-mix-ai-staged-autonomy-ql",
  "date": "2026-06-24",
  "type": "church-work",
  "title": "Spec (revised): Local-AI live-mix engine for the COLG Yamaha QL booth - per-voice adaptive EQ + staged autonomy (assistive->supervised->autonomous), hard safety bounds, human-on-the-loop, on the church 2x RTX 4070",
  "description": "Grounded in Darrell's photos/close-up: the booth is a Yamaha QL-series digital console (QL1/QL5, confirm by channel count) at back-of-house, ALREADY software-controlled over the network (QL Editor / StageMix / ProVisionaire), with a multi-monitor switcher/stream rig + laptop; sanctuary stage has a drum kit + two side screens. DIRECTION CHANGE: the live-mix A.I. is not assistive-only forever - the GOAL is AUTONOMOUS live mixing that gets better-than-human over time, WITH instant human takeover/co-mix (human-on-the-loop permanent). Specced the destination + a safe staged path: (1) ASSISTIVE read+suggest [now], (2) SUPERVISED-AUTO bounded writes while a human watches with one-touch override [now on 4070s, after Stage1 proves + Darrell's go], (3) AUTONOMOUS human-on-the-loop [earns its stage via proven perf + Darrell's go, NOT a hardware gate]. HARD BOUNDS (structural + proven-to-catch): SPL/output ceiling per-channel+master, feedback detect+auto-suppress+hard-stop, rate-limited moves, instant human takeover/co-mix (mix kill-switch), scene-bounded, full logging, three brakes (budget/concurrency-lock/kill-switch). CENTRAL capability: per-mic per-voice adaptive EQ - analyze the voice on each mic, dial EQ+dynamics for THAT voice, re-optimize on voice change, optional voice-ID (pyannote/SpeechBrain/Resemblyzer) recalls a known voice's best profile (ties choir renditions/ad-libs), unknown->from scratch, best individual + best blend. Learning loop trains on multitrack/rendition history + per-service feedback + operator overrides; improvements promote to higher autonomy ONLY after supervised proof. Sample-rate/USB-mismatch kept as a future PROACTIVE MONITOR (already fixed, not a present incident). HARDWARE recalibrated: church already has 2x RTX 4070 (~12GB, confirm variant) -> assistive + supervised buildable NOW on existing church hardware; only 70B+ LLM needs the bigger box.",
  "resolution": "Training half shipped (digital-/QL-aware 'Running the Board' track + sound-engineer SME lane). Live-mix engine = research-reviewed + specced, staged + bounded. Buildable now on the 4070s: read-only QL console-adapter, the hard-bounds+takeover+logging framework (proven-to-catch BEFORE any write), Stage-1 per-voice-EQ suggestions + feedback detection + AFTER review (librosa/Essentia/aubio + Ollama) + proactive sample-rate/sync monitor + virtual-soundcheck proving sandbox + voice-ID profiles. Stage 2 (bounded writes) + Stage 3 (autonomous) ship inactive, armed one at a time behind proven-to-catch bounds + three brakes + Darrell's explicit go. Recommended sovereign stack: aubio + librosa + Essentia + pyannote/SpeechBrain/Resemblyzer + JUCE (RT host) + Ollama qwen2.5 + Dante/SoX/ffmpeg + a thin Yamaha-QL console-adapter (protocol TBC).",
  "tags": {
    "workflows": [],
    "modules": ["learn", "sound-board", "live-mix-ai", "church", "choir", "worship", "sme-pipeline", "audio-analysis", "voice-id", "scripture"],
    "sector": ["church", "education", "community", "spiritual"],
    "senders": ["dpoe"]
  },
  "provenance": {
    "who": "Claude (advisory)",
    "when": "2026-06-24",
    "source_surface": "Darrell's booth photos + console close-up (Yamaha QL, PEQ view, TOUCH AND TURN/Selected Channel/SEL-ON) + live web research (Yamaha QL Editor/StageMix/Dante/virtual-soundcheck; pyannote/SpeechBrain/Resemblyzer; aubio/librosa/Essentia) + code survey"
  },
  "learnings": "1) Real env is a Yamaha QL digital console ALREADY software-controlled over the network -> read state now, earned writes later; design behind a console-adapter; confirm QL1 vs QL5 + the exact write protocol. 2) Direction change: destination is AUTONOMOUS live mixing better-than-human over time, human-on-the-loop permanent - but it's the highest-stakes automation, so it's EARNED in stages, each behind hard bounds + three brakes + Darrell's go. 3) Controllability makes RESTRAINT matter MORE: hard bounds (SPL ceiling, feedback hard-stop, rate-limit, scene bounds, instant takeover/co-mix, full logging, three brakes) must exist + be proven-to-catch BEFORE any write. 4) Central capability is per-mic per-voice adaptive EQ that re-optimizes when the voice on a mic changes + optional voice-ID profiles (ties choir renditions). 5) Learning trains on multitrack/rendition history + operator overrides (overrides are gold); improvements promote only after supervised proof. 6) HARDWARE: church 2x RTX 4070 make assistive+supervised buildable NOW (audio ML + voice-ID + whisper + 7-14B LLM all fit); autonomy is go-gated not hardware-gated; only 70B+ needs the bigger box. 7) Sample-rate mismatch already fixed -> keep as a proactive monitor, don't chase. 8) Virtual soundcheck (QL Dante multitrack) is the safe sandbox to PROVE A.I. moves before they touch a live service.",
  "related_artifacts": [
    "docs/99-session-notes/2026-06-24-live-sound-eq-mix-ai-assist-spec.md",
    "app/src/lib/sound-board-class.js",
    "app/src/__tests__/sound-board-class.test.js",
    "infra/nas-sme-pipeline/sound-engineer-to-lessons.sh",
    "infra/nas-sme-pipeline/SOUND-SOURCE.md",
    "https://usa.yamaha.com/products/proaudio/mixers/ql_series/features.html",
    "https://usa.yamaha.com/products/proaudio/software/ql_stagemix/index.html",
    "https://github.com/pyannote/pyannote-audio",
    "https://github.com/aubio/aubio",
    "https://librosa.org/",
    "https://essentia.upf.edu/"
  ],
  "status": "open"
}
```

---

## 16. Sources (live research, 2026-06-24)

**Yamaha QL console + control + virtual soundcheck:**
- [Yamaha QL Series — Features (USA)](https://usa.yamaha.com/products/proaudio/mixers/ql_series/features.html) · [Overview](https://usa.yamaha.com/products/proaudio/mixers/ql_series/index.html) · [FAQ](https://usa.yamaha.com/products/proaudio/mixers/ql_series/faq.html)
- [QL StageMix (iPad remote)](https://usa.yamaha.com/products/proaudio/software/ql_stagemix/index.html) · [CL/QL V4.1 Supplementary Manual (PDF)](https://data.yamaha.com/files/download/other_assets/5/834225/cl5_3_1_ql_5_1_en_sm_v41_a0.pdf) · [QL1 datasheet (PDF)](https://enlx.co.uk/wptemp/wp-content/uploads/2024/05/QL1_datasheet.pdf)

**Speaker-ID / voice embeddings (for per-voice profiles):**
- [pyannote-audio (diarization + embeddings)](https://github.com/pyannote/pyannote-audio) · [Top speaker-diarization libraries (2026 overview)](https://www.assemblyai.com/blog/top-speaker-diarization-libraries-and-apis) · [SpeechBrain](https://speechbrain.github.io/) · [Resemblyzer](https://github.com/resemble-ai/Resemblyzer)

**Audio analysis / real-time DSP:**
- [aubio](https://github.com/aubio/aubio) · [librosa](https://librosa.org/) · [Essentia (MTG/UPF)](https://essentia.upf.edu/) · [JUCE](https://juce.com/)

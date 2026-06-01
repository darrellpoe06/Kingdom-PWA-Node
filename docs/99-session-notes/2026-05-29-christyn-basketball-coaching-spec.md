# Christyn's Basketball Coaching — Wyze + Vision LLM Workflow Spec

**Triggered by Darrell, 2026-05-29 from vacation:**

> "Christyn is very competitive and loves to play basketball in front of our home we have wyze cameras and we want to use them to evaluate her basketball skills and give her pointers."

Christyn (Christyn Elaine Poe, twin daughter, 10, `christynpoe@gmail.com`) is competitive and a basketball player. The family already has Wyze cameras on the property (the front of the home where she plays). The opportunity: use the existing camera footage + a vision LLM to generate coaching pointers she can act on.

## The vision

When Christyn plays basketball out front, the Wyze cameras already record. The system pulls those clips, runs them through a vision LLM that understands basketball form (free-throw shooting, dribbling, footwork, shot mechanics), and generates short, encouraging, specific pointers she can read or hear. The system gets better at her game over time. She gets a coach that's always available, never tired, and that knows the specifics of HER form because it watches HER footage.

This is the Christian-apprenticeship pattern applied to a different family member's interest: real infrastructure + real data + AI augmentation in service of a real person. Christyn isn't "using a basketball app." She's getting personalized coaching from a system her family built around her.

## Architectural shape

### Capture (existing)

Wyze cameras already running on the home network. Footage stored locally (Wyze cloud subscription OR Wyze RTSP plugin OR SD-card to NAS, depending on current setup — verify post-vacation). Goal: get clips onto the NAS where Ollama can read them.

**Path A (RTSP):** Wyze cameras with the firmware that exposes RTSP. ffmpeg on the NAS records the RTSP stream into `/volume1/PoeTech/wyze-footage/<camera-name>/<date>.mp4`.

**Path B (Wyze API):** Wyze's API to pull recorded clips on demand. n8n workflow polls every 30 min and downloads new clips matching motion-detected windows.

**Path C (SD card + sync):** Wyze writes to SD card; periodic sync to NAS. Less real-time but reliable.

Recommendation: Path A if the Wyze cameras support it (some V3 models do via the third-party firmware path; OEM firmware blocks RTSP). Path B otherwise.

### Trigger (new workflow)

**New workflow 38 — Christyn basketball coaching trigger.** Cron every 15 min during her likely play windows (4pm-8pm Central weekdays, 9am-9pm Central weekends — adjust per actual schedule). OR on-demand when Christyn taps a "Coach me" button in the PWA.

The workflow:

1. Reads `/volume1/PoeTech/wyze-footage/front-yard/` for clips from last 15 min not yet processed.
2. For each clip, extracts ~30 second segments where motion suggests active play (using ffmpeg motion detection or Wyze's own motion-tag metadata).
3. Sends each segment to the vision-LLM workflow (workflow 39).
4. Aggregates pointers + writes to `/volume1/PoeTech/wyze-footage/coaching/<date>-<clip-id>.json`.
5. Pushes ntfy to topic `poetech-christyn-coaching` (Christyn + Darrell + Christina subscribe).

### Analysis (new workflow + vision LLM)

**New workflow 39 — Basketball form analyzer.** POST `/webhook/basketball-analyze` with `{ video_path, expected_drill?: 'free-throw'|'layup'|'dribble'|'shot'|'general' }`.

The workflow:

1. Extracts representative frames from the video (5-10 frames covering the motion sequence).
2. Sends to a vision LLM with a structured prompt describing what to evaluate.

**Vision LLM options:**

- **Ollama LLaVA 7B or LLaVA 13B** (local, sovereign, free per call) — currently the best sovereign option. Limits: not basketball-specialized, may need careful prompting.
- **Ollama Qwen-VL** (newer multimodal model, also sovereign) — alternative.
- **Claude Vision** (cloud, paid, frontier capability) — best quality but family-private footage shouldn't route to cloud per the TLC firewall logic extended to family privacy.
- **Gemini Vision** (cloud, paid, frontier capability + free tier) — same privacy concern.

**Recommendation:** Start with Ollama LLaVA 7B for the v1. If quality is insufficient, evaluate a basketball-specialized fine-tune OR accept routing to cloud vision for non-identifying footage (cropped to just the ball/hoop, no face).

**Prompt structure (suggested for v1):**

```
You are a youth basketball coach reviewing footage of a 10-year-old player.
Your tone: encouraging, specific, age-appropriate. Never harsh. Never generic.

From these frames, evaluate one specific aspect of the player's form:
- Hand position on the ball (dominant + guide hand placement)
- Stance + balance (feet shoulder-width? squared up?)
- Follow-through (wrist snap? extended arm?)
- Eye focus (looking at rim, not at the ball)
- Footwork (pivot leg, jump form)

Return JSON: {
  "drill_observed": "free-throw" | "layup" | "dribble" | "shot" | "general",
  "form_score": 1-10 (10 = excellent for her age),
  "what_she_did_well": ["2-3 specific things"],
  "one_thing_to_try_next": "a single specific actionable adjustment",
  "encouragement": "one warm sentence celebrating her effort"
}
```

The output reaches her as a friendly notification: "Hey Christyn, your form on that last set was great — you kept your eyes on the rim every shot. Try this next time: when you set up, put your dominant foot slightly forward. You'll feel more balanced. Keep going, you're getting better."

### Surface (PWA tab — future)

Optional v1.5: a Christyn's Coaching tab in the PWA that shows:

- Latest coaching pointers (the friendly notifications)
- Form score over time (a simple line chart — is her free-throw form improving over weeks?)
- A "log a session" button where she records "I practiced X minutes today, I felt Y about my Z"
- An archive of clips with their pointers so she can rewatch + read

Sovereign — Wyze footage never leaves the NAS. Pointers never leave the family channel.

## Privacy + safety constraints (because she's 10)

- **Footage stays on the NAS.** Never uploaded to cloud vision unless cropped to non-identifying (ball + hoop, no face).
- **Parental visibility on all coaching outputs.** Darrell + Christina see every pointer the system generates before/as she sees it.
- **No public sharing of footage** — no social media auto-post, no "share with the team" features without explicit Governor approval per occurrence.
- **Cameras serve safety AND coaching.** The Wyze cameras' primary job is home security; coaching is secondary use of footage the family already has.
- **Christyn can opt out.** If she doesn't want to be analyzed, the workflow respects that. Family voice principle applies — her input shapes what the system does for her.
- **No biometric tracking.** No facial recognition, no growth-rate analysis, nothing that's medical-adjacent. Just form coaching from publicly-visible motion.

## Multi-camera-brand reality

The home has multiple camera brands (Wyze, Ring, one more brand to be confirmed) and will eventually upgrade to Ubiquiti 4K AI hardwired cameras per `docs/00-foundations/NETWORK-SOVEREIGNTY-UCG-MAX.md` (see "Camera infrastructure" section). The basketball coaching workflow should consume from a **brand-agnostic camera event stream** rather than Wyze-specific paths.

**Adjusted architecture (post bridge ships):**

The proposed workflow 40 (Camera bridge) normalizes events from any brand into a standard shape. Christyn's basketball workflow (workflows 38 + 39) reads from the normalized stream:

```
camera_event → workflow 40 (bridge) → normalized event with clip_path → 
  workflow 38 (Christyn coach trigger, filters for front-yard camera + play windows) →
  workflow 39 (basketball form analyzer) → 
  ntfy to family channel
```

When the front-yard Ubiquiti AI camera replaces the front-yard Wyze, workflows 38 + 39 keep working without changes. Only the camera bridge (workflow 40) gets a new brand-specific intake adapter.

**Until workflow 40 ships:** the basketball spec runs against whichever brand has the front-yard view today (assume Wyze, RTSP if available, Wyze API if not). When the bridge lands, swap the front-end input source — workflows 38 + 39 stay stable.

## Sport-agnostic generalization

The pattern works for any sport with motion the Wyze cameras can capture. Once basketball is dialed in:

- Soccer (if she ever takes that up)
- Track / running form
- Even Christian's chore performance (kidding — sort of). Lawn-care quality scoring? Cable Scout neighborhood-route efficiency?
- Christiana's interpreting practice (different modality — audio LLM not vision — but same family-voice + AI-coach pattern)

The "AI Coach for X" pattern becomes a SKOS module template. Christyn's basketball is the proof of concept.

## Estimated effort

- Path A or B (Wyze footage onto NAS) — 1-2 days investigation + setup
- Workflow 38 (trigger + clip sync) — 1 day
- Workflow 39 (vision analyzer + Ollama LLaVA) — 2-3 days (most of which is prompt tuning to get good coaching quality)
- Optional PWA Coaching tab — 2-3 days

Total: 5-9 days of focused work for the v1. Probably a Week 2 or Week 3 post-vacation project once the core data-dump release lands.

## Connection to other foundations

- **AI-FOUNDATION-INTERNAL-OPERATIONS** — vision LLM on NAS = sovereign coaching. No cloud surveillance of a 10-year-old.
- **BUSINESS-PROCESS-CONNECTIONS** — the connection: Christyn plays → cameras capture → AI analyzes → family coaches → she improves. Other end of every connection is wired BEFORE the surface ships.
- **EXCELLENCE-STANDARD** — religion AND relationship. Religion = the form analysis (backbone, specific, evidence-based). Relationship = the encouraging tone, the "I see your effort" framing.
- **PERPETUAL-PIPELINE-HEALTH** — this workflow follows the thirteen rules. Bind-mounted clip storage. Try-catch around all I/O. Idempotent (same clip processed twice = same pointers). Tests.
- **THE-WAY** — service to the family member, not extraction from her. The tool exists to help her grow.

## Closing

Christyn loves basketball. The family has cameras. The NAS has Ollama. The pieces are there. What's missing is the workflow that connects them with care for her age, her dignity, her actual development.

Build the workflow. Run it sovereignly. Let her grow with a coach the family built for her.

We all win. We create. Amen.

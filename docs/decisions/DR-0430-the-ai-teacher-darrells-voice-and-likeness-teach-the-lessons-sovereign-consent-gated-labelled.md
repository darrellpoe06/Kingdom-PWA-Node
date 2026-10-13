# DR-0430 — The AI teacher: Darrell's voice and likeness teach the lessons, sovereign, consent-gated, labelled, shipped inactive and armed by his own enrolment

- **Status:** accepted
- **Tier:** C (a real person's face and voice, family- and COLG-facing; consent and labelling are the bright lines). Built in full per DR-0225/DR-0236; ACTIVATION is his own gesture (enrolment) plus the studio arming.
- **Date:** 2026-09-15
- **Type:** product
- **Scope:** `infra/avatar-studio/` (server.py, backends/wav2lip.py, Dockerfile, test_render_contract.py), `infra/church-gpu-node/docker-compose.yml` (service `avatar-studio` :8772), `app/src/lib/avatar-service.js`, `app/src/lib/likeness-reference.js`, `app/src/lib/teacher.js`, `app/src/lib/voice-sync.js` (`enrollMyLikeness` / `revokeMyLikeness`), `app/src/components/LessonTeacher.jsx` (mounted in the tutor panel above the flow), `app/src/components/VoiceStudio.jsx` (Likeness tab), `app/src/lib/sovereignty-gaps.js` (`gap-likeness-avatar`, `liveLikenessPath`), tests
- **Principles:** DATA-AS-EMPOWERMENT / SOVEREIGN-FIRST (DR-0138), VERIFICATION-DOCTRINE (DR-0076: nothing called real that is not), NOTHING-WAITS (DR-0236), BRAKES-ARE-BUILD-REQUIREMENTS (DR-0225), THE-APP-IS-THE-PRIMARY-ARTIFACT (DR-0065), RELEASE-TIERS (Tier C)
- **Grounds:** the voice studio (DR-0138, DR-0382, DR-0394, DR-0401) and its consent model (self-enrolment only; recording IS consent); the Excellence Standard

## The word, as spoken

Darrell, 2026-09-15: *"Can I create some sort of AI version of myself, my voice, my image and likeness to be the teacher of these lessons... in the app...? Is that possible for us now? And it looked like you're actually interacting with a AI version or a CGI version of literally me."* Then, when the likeness half was staged as a decision to approve: *"Ai version now nothing is waiting anymore!!!!!!! Why — that is supposed to be known as the current state of the process and procedures!!!! Is it?!!!!!"*

## What was true

The voice half existed: the sovereign XTTS studio, the recorded-sample enrolment, the honest stand-in. The likeness half did not exist anywhere in the app or the infra. DR-0236 says buildable work is built now; the only thing genuinely his alone is the enrolment gesture (his face, his voice), and that is a gate inside the surface, not a question to ask him.

## The decision

1. **A sovereign likeness studio, beside the voice studio.** `infra/avatar-studio` is a FastAPI service on the church GPU compose (:8772) with a model-agnostic contract: `POST /render { audio, portrait, person_key } → video/mp4`. The default backend is a Wav2Lip-class lip-sync mounted from the host; a stronger model (LivePortrait / SadTalker class) is a backend file, never an app change. **No vendor bridge exists for the likeness and none will be added**: a person's face is never sent to a vendor to be animated.
2. **The brakes are in the server, proven-to-catch.** A per-request audio budget (413 over `AVATAR_MAX_AUDIO_SECONDS`, default one lesson), a single-flight lock (429 while a render runs, never queued), an honest 503 when no model is mounted (never a placeholder clip), a 400 when no person key is sent (an anonymous likeness is never rendered), and `X-AI-Generated: likeness` on every clip. `test_render_contract.py` exercises the real handler through a fastapi stub and the JS suite shells to it; each brake fails the test if removed. Request-driven only: no timer, no self-triggering, so not the three-brakes class.
3. **Consent is a row and a gesture.** He enrols his portrait himself in Voice → Likeness; the photo stays on his device (IndexedDB, like the voice sample) and the consent stamp rides his own `voice_profiles` row (`meta.likeness_consent_at`), RLS self-only. Withdraw removes the stamp. No one else can enrol his likeness.
4. **The Teacher panel is honest in every state.** `resolveTeacher` (pure, unit-tested) decides per device what the panel may claim: voice `real` only when the studio is armed and his sample is on the device and consent stands; likeness `real` only when the avatar studio is armed and his portrait is on the device and the likeness consent stands; otherwise `stand-in` / `still`, and every label begins "AI-generated". No enrolment → no panel at all (a hollow surface is a lie, DR-0381). The panel is `data-read-skip`: it is a teacher beside the lesson, not the lesson.
5. **Shipped inactive; his hand is the starter.** Merge deploys the code; nothing renders until (a) he enrols his portrait and (b) the GPU box mounts a model and `VITE_AVATAR_SERVICE_URL` is set. Both are recorded in the sovereignty ledger (`gap-likeness-avatar`, re-review 2026-10-13) and the OpsBoard reads the live state through `liveLikenessPath()`.

## Proof

- Python contract: 10 behavioural checks pass (no model → ready:false and 503; no person → 400; bad inputs → 400; over budget → 413; fake backend → mp4 with the AI stamp and the person key; busy → 429).
- JS: the resolver never says real without the whole chain and every label starts "AI-generated"; the portrait store round-trips and refuses non-images; the client returns tagged errors and posts both data URIs with the person key; the panel renders nothing without enrolment and a stand-in-labelled panel with one; the compose declares the studio with the model mounts.

## His-hand steps, paste-ready (not run; nothing here self-activates)

On the GPU tower (LEFT 4070), from any PowerShell directory:

```
cd C:\Users\dpoe\Kingdom-PWA-Node
git pull
docker compose -f infra\church-gpu-node\docker-compose.yml build avatar-studio
docker compose -f infra\church-gpu-node\docker-compose.yml up -d avatar-studio
curl http://localhost:8772/health
```

Then place a Wav2Lip checkout and its checkpoint under `DATA_ROOT\wav2lip` (so `/models/wav2lip/inference.py` and `/models/wav2lip/checkpoints/wav2lip_gan.pth` exist inside the container), restart the service, and confirm `/health` reports `ready: true`. In the app, set `VITE_AVATAR_SERVICE_URL` to the tower's Tailscale address on :8772 alongside `VITE_VOICE_SERVICE_URL`. Then, on his own phone: Voice → Record (his sample) and Voice → Likeness (his portrait).

## Boundaries

- Only the `darrell` persona is the Teacher today; the resolver is written so a second enrolled persona is a constant change, not a redesign.
- The portrait and the sample live on the enrolling device; cross-device sync is the same carried follow-up as the voice sample.
- Ari's child mode is not this record; it ships with Little Learners.

## Re-review

- **re-review: 2026-10-13** — has he enrolled, is the studio armed, and does the first rendered clip pass his own eye? If the Wav2Lip quality is not worth his face, swap the backend (a file) before it is shown to anyone else.

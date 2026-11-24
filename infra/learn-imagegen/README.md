# learn-imagegen — Learn pictures from the church's own 4070

The Learn lesson covers (and future app pictures) are made on the church's own
GPU tower, `tlcmediadpt` (the left tower, the designated AI worker, DR-0579),
with an Apache-2.0 open model, instead of the paid BFL service.
Research and model choice: `docs/99-session-notes/2026-11-24-free-sovereign-image-generation-research.md`.

| Piece | File | State |
|---|---|---|
| Read-only probe of the tower | `probe.ps1`, `.github/workflows/learn-imagegen-tower.yml` | built |
| The ComfyUI graph (Z-Image-Turbo int8, 8 steps, 1920x1088) | `z-image-turbo.api.json` | built; API key names unverified until the first submit |
| Six comparison samples | samples mode of the same lane | after the probe is read |
| The permanent tower-run service | `tower-worker` (below) | designed here; built after the samples are approved |

## Why the permanent service runs from the tower, not from CI

Every CI road into the house rides one Tailscale auth key, and that key has gone dead
again and again (2026-10-28, 2026-11-04, 2026-11-10, 2026-11-23/24; DR-1283, DR-1298,
DR-1431, DR-1453). DR-1360 already decided the direction: the house initiates every
road, and a credential that expires is never again the only road to work the house does.
So the permanent service is one the tower starts itself.

## tower-worker (the permanent design)

1. **The job list lives in git, read over plain HTTPS.** The tower reads the next
   picture jobs from GitHub (a jobs file on `main`, or the review export), with a
   read-only fine-grained token kept on the tower only. No inbound road, no tailnet key.
2. **The tower generates locally.** ComfyUI on `127.0.0.1:8188` only (never on the LAN
   or the tailnet); the pipeline's existing `local` image provider, unchanged.
3. **Pictures go to the NAS over the LAN** (an SMB share or `scp` to the NAS on the
   church network), never through GitHub. The NAS `learn-thumbs-pull` reconcile then
   proves every picture is present (DR-1640's proof, extended to the tower's batches).
4. **The three brakes (Tier C; CLAUDE.md "Autonomous Automation Requires Three Brakes"):**
   - budget: a per-run picture count and wall-clock ceiling, and a per-night cap;
   - lock: one instance (a lock file); a second start skips;
   - auto-pause: before every picture it checks that no other program holds the GPU
     (voice studio, Whisper, Ollama, OpenClaw), that it is outside service and stream
     hours, and that the GPU is cool; three failures in a row, or a slow-down, pause it
     until a person resumes it.
5. **Shares the GPU politely.** It loads the model, makes its batch, then unloads
   (ComfyUI `/free`), so Ari's Ollama and the voice studio get the GPU back.
6. **Started by Windows Task Scheduler on the tower**, at night by default; switched on
   only while someone watches the first night (Tier C).

What it never does: buy anything, publish anything, or write to a lesson.

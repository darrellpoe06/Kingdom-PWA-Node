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

## One image service for the whole church app (owner, 2026-11-24)

Approved for testing as a SHARED service, not a Learn-only one. Learn is its first
project; Kids Zone, Bible Adventures, Teens Zone, course covers, lesson illustrations
and future features join as their own projects. The six Learn comparison samples come
first, and nothing here authorizes a full-library run before the owner approves it.

**Separate queues, one worker.** Each project has its own queue (`learn`, `kids`,
`bible-adventures`, `teens`, `courses`, ...). A job is
`{project, key, prompt, art_direction, seed, size, status}`. The worker takes jobs in a
fair rotation across projects, so one big backlog never starves the others, and a
project can be paused on its own.

**Resume without starting over or duplicating.** Every job has a deterministic key:
the sha256 of project + subject id + the full final prompt + model + size + seed.
- A job whose key already has a finished picture is never run again (the same rule the
  paid ledger already enforces: a finished picture is never bought twice).
- A picture is written to a temp name and renamed into place only when complete, then
  recorded; a crash mid-picture leaves nothing half-written, and the job simply runs again.
- A job leased by a worker that died returns to the queue after its lease expires.
- Changing a prompt makes a NEW key (a new picture), and the old one is kept.

**Each project keeps its own rules.** The art direction, the DR-1640 representation
check and the banned dark-look terms run per project before a job is queued: Learn uses
the approved bright photographic style; Kids Zone and Bible Adventures will carry their
own approved looks once those are decided.

**Dashboard (a surface in the app, read-only to start).** Per project: queued, running,
completed, failed (with reason), and approval status (review / approved / rejected);
the GPU (busy or free, which program holds it, temperature); generation time per picture
and per night; estimated savings against the paid service, computed from the measured
count times the list price (6 cents a picture today), stated as an estimate. It reads the
worker's own status file published to the NAS, the same "the house reports first" pattern
the NAS loops use, so it needs no inbound road.

**Order of work.** (1) the read-only tower probe; (2) the six Learn samples and the
side-by-side; (3) the owner's decision; (4) only then the shared worker, its queues and
the dashboard.

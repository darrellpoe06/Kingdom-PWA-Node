# SME Video -> Build Spec pipeline (sovereign, local, NAS)

Turns a subject-matter-expert video (Ray-Ban Meta Gen 2 captures, or any
video/audio) into a structured, build-ready **spec.md** -- entirely on the NAS.
Nothing leaves the box.

```
  video/audio  ->  faster-whisper (CPU/INT8, isolated container)  ->  transcript
               ->  local Ollama (qwen2.5:14b)                      ->  build spec
```

## Status

**Pre-built and ready to run.** It does NOT need Darrell's videos to exist yet.
The moment a video lands, point the script at it.

## Where it lives

- On the NAS: `/volume1/PoeTech/sme-pipeline/`
- Source of truth (this repo): `infra/nas-sme-pipeline/`

```
sme-pipeline/
  Dockerfile             isolated python-3.11 + faster-whisper image
  transcribe.py          baked into the image; CPU/INT8 transcription
  buildspec-prompt.md    the LLM extraction prompt (grounded, no fabrication)
  sme-video-to-spec.sh   the on-demand orchestrator (run THIS)
  sample-transcript.txt  fixture used to verify the LLM step
  models/                cached whisper model (~1.6GB, persists across runs)
  input/                 drop videos here
  output/<name>-<stamp>/ transcript.txt, transcript.json, spec.md
```

## Run it (when a video lands)

```
cd /volume1/PoeTech/sme-pipeline
./sme-video-to-spec.sh ./input/my-clip.mp4
# optional friendly name for the output folder:
./sme-video-to-spec.sh ./input/my-clip.mp4 church-checkin-flow
```

Output goes to `output/<name>-<timestamp>/`:
- `transcript.txt` -- clean transcript, one line per segment
- `transcript.json` -- segments with timestamps + media metadata
- `spec.md` -- the structured BUILD SPEC to pull into the build process

## What's installed (additive only)

- A dedicated Docker image `poetech/sme-whisper:cpu` (built from `python:3.11-slim`).
  It is **on-demand only** -- NOT in the n8n-stack compose, never auto-starts.
- The whisper model `large-v3-turbo` (INT8), cached under `models/`.
- No change to Ollama, n8n, ntfy, Caddy, Tailscale, or cloudflared.

The LLM step calls the **existing** local Ollama at `127.0.0.1:11434` with
`qwen2.5:14b-instruct-q4_K_M`. Ollama is not reconfigured.

## Behind the brakes

Manual-run only. **No cron, no watcher, no autonomous trigger.** A human runs it
on demand. This honors the three-brakes rule (no timer-driven automation without
budget + concurrency lock + kill-switch).

## CPU speed -- honest expectations

This NAS is **CPU-only** (DS1621xs, 8 cores). Transcription is the slow part:

- Budget roughly **1-3x the media length** for `large-v3-turbo` INT8 on CPU.
  A 10-minute clip is ~10-30 minutes; an hour of video can be a couple hours.
- The **first** run also downloads the model (~1.6GB) one time.
- The LLM step is usually a minute or three for a normal-length transcript.
- **Batch long jobs overnight.** Run them back-to-back; they're sequential and
  CPU-bound.
- When the **GPU box** arrives, the same script gets dramatically faster
  (change `WHISPER_COMPUTE` and point at a CUDA image) -- the pipeline shape
  does not change.

Long transcripts may exceed the LLM context window (`OLLAMA_NUM_CTX`, default
8192). For very long videos, raise it (`OLLAMA_NUM_CTX=16384 ./sme-video-to-spec.sh ...`)
or split the video first. Bigger context = slower + more RAM on CPU.

## Tunables (environment variables)

| Var | Default | Meaning |
|---|---|---|
| `WHISPER_MODEL` | `large-v3-turbo` | whisper model size |
| `WHISPER_COMPUTE` | `int8` | CPU quantization |
| `OLLAMA_MODEL` | `qwen2.5:14b-instruct-q4_K_M` | local LLM |
| `OLLAMA_NUM_CTX` | `8192` | LLM context window |
| `OLLAMA_URL` | `http://127.0.0.1:11434` | local Ollama |

## Rebuild the image (only if Dockerfile/transcribe.py change)

```
cd /volume1/PoeTech/sme-pipeline
sudo /usr/local/bin/docker build -t poetech/sme-whisper:cpu .
```

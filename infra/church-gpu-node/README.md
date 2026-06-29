# church-gpu-node

Three SOVEREIGN serving endpoints for a church **compute tower** (one of the two
towers beside the NovaStar; exact GPU/CPU/RAM are TBD -- NOT assumed to be any
specific card):

- **ollama** `:11434` -- local LLMs (model sized to the tower's real VRAM). Sovereign AI.
- **voice-studio** `:8770` -- XTTS-v2 voice clone (`POST /speak`). "Darrell hears Darrell."
- **whisper-gpu** `:8771` -- faster-whisper (`POST /transcribe`). Harvest no-caption fallback.

One `docker compose up -d --build` brings all three up headless, restart-on-boot, each
with a healthcheck and a GPU reservation (honored when a GPU is present, ignored on a
CPU-only tower). Bind LAN / Tailscale only -- never the public net.

**Setup runbook (his-hand, on-site -- physical install + inventory + standup):**
`docs/99-session-notes/2026-06-29-church-compute-towers-setup-runbook.md`

Role separation: the live-media tower that feeds the NovaStar -> wall stays separate
from AI-compute work; run heavy AI jobs off service hours (DR-0012 generalized).

Related: `infra/voice-studio/server.py` (the XTTS server this containerizes),
`infra/ai-orchestrator/node1/docker-compose.yml` (full Ollama + n8n + watchdog stack
if you want orchestration resident on the tower), `infra/nas-sme-pipeline/` (the CPU
transcription pipeline this GPU endpoint accelerates).

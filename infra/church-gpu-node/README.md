# church-gpu-node

The three SOVEREIGN serving endpoints for a church RTX 4070 (~12 GB VRAM):

- **ollama** `:11434` -- local LLMs (qwen2.5:14b fits 12 GB). Sovereign AI.
- **voice-studio** `:8770` -- XTTS-v2 voice clone (`POST /speak`). "Darrell hears Darrell."
- **whisper-gpu** `:8771` -- faster-whisper (`POST /transcribe`). Harvest no-caption fallback.

One `docker compose up -d --build` brings all three up headless, restart-on-boot, each
with a healthcheck and a GPU reservation. Bind LAN / Tailscale only -- never the public net.

**Setup runbook (his-hand, on-site):**
`docs/99-session-notes/2026-06-29-church-4070-gpu-node-setup-runbook.md`

Related: `infra/voice-studio/server.py` (the XTTS server this containerizes),
`infra/ai-orchestrator/node1/docker-compose.yml` (full Ollama + n8n + watchdog stack
if you want orchestration resident on the box), `infra/nas-sme-pipeline/` (the CPU
transcription pipeline this GPU endpoint accelerates).

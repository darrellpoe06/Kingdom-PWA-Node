# =============================================================================
# voice-studio (XTTS-v2) -- container image for the church RTX 4070 GPU node
# =============================================================================
# Wraps server.py (the SOVEREIGN /speak endpoint the app already targets via
# VITE_VOICE_SERVICE_URL). Few-shot XTTS-v2 on CUDA: ~3-4 GB VRAM at inference,
# fits a 4070's 12 GB easily. Nothing leaves the network -- expose on LAN /
# Tailscale only (DATA-AS-EMPOWERMENT).
#
# Build (driven by ../church-gpu-node/docker-compose.yml, not by hand):
#   docker compose -f infra/church-gpu-node/docker-compose.yml build voice-studio
#
# License note (honest): XTTS-v2 weights are CPML (non-commercial) -- fine for
# family/church sovereign use. The /speak contract is model-agnostic, so an MIT
# model (F5-TTS / OpenVoice v2) swaps in here with ZERO app change if commercial
# productization ever needs it.
#
# VERSION NOTE (DR-0076 -- verify, do not assume): the pytorch CUDA base tag and
# the Coqui TTS version below were the working pair at authoring time. Confirm the
# current tags at build (hub.docker.com/r/pytorch/pytorch/tags) before relying.

FROM pytorch/pytorch:2.3.1-cuda12.1-cudnn8-runtime

ENV PYTHONUNBUFFERED=1 \
    HF_HOME=/models \
    COQUI_TOS_AGREED=1 \
    VOICE_DEVICE=cuda \
    PORT=8770

# git is needed by some TTS model fetches; the rest are the server deps.
RUN apt-get update \
    && apt-get install -y --no-install-recommends git curl \
    && rm -rf /var/lib/apt/lists/* \
    && pip install --no-cache-dir "TTS==0.22.0" "fastapi>=0.110,<1" "uvicorn[standard]>=0.29,<1"

COPY server.py /app/server.py
WORKDIR /app

EXPOSE 8770
# server.py reads PORT + VOICE_DEVICE + VOICE_MODEL from the env.
CMD ["python", "/app/server.py"]

# =============================================================================
# whisper-gpu -- faster-whisper CUDA transcription endpoint (church compute tower)
# =============================================================================
# The harvest no-caption FALLBACK, served on the GPU. faster-whisper on CUDA needs
# cuBLAS + cuDNN present in the image, so we base on the NVIDIA cudnn-runtime image
# (NOT python-slim, which has no CUDA libs).
#
# Build (driven by ../docker-compose.yml):
#   docker compose -f infra/church-gpu-node/docker-compose.yml build whisper-gpu
#
# VERSION NOTE (DR-0076 -- verify, do not assume): confirm the current
# nvidia/cuda cudnn-runtime tag at build time (hub.docker.com/r/nvidia/cuda/tags).
# The 12.4.1 cudnn pairing below worked at authoring; CUDA/cuDNN tags move.

FROM nvidia/cuda:12.4.1-cudnn-runtime-ubuntu22.04

ENV PYTHONUNBUFFERED=1 \
    HF_HOME=/models \
    HUGGINGFACE_HUB_CACHE=/models \
    WHISPER_DEVICE=cuda \
    WHISPER_MODEL=large-v3-turbo \
    WHISPER_COMPUTE=float16 \
    PORT=8771

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-pip curl \
    && rm -rf /var/lib/apt/lists/* \
    && pip3 install --no-cache-dir "faster-whisper>=1.1.0,<2" "fastapi>=0.110,<1" "uvicorn[standard]>=0.29,<1" "python-multipart>=0.0.9"

COPY server.py /app/server.py
WORKDIR /app

EXPOSE 8771
CMD ["python3", "/app/server.py"]

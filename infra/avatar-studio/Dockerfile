# =============================================================================
# avatar-studio -- container image for the church GPU tower (talking portrait)
# =============================================================================
# Wraps server.py (the SOVEREIGN /render endpoint the app targets via
# VITE_AVATAR_SERVICE_URL). The lip-sync model is NOT baked in: mount a Wav2Lip
# checkout + checkpoint at WAV2LIP_DIR / WAV2LIP_CHECKPOINT (see backends/).
# Until they are mounted, /health says ready:false and the app shows the still
# portrait with the real voice, labelled a stand-in -- honest by construction.
#
# VERSION NOTE (DR-0076 -- verify, do not assume): the pytorch CUDA base tag
# below was the working pair at authoring time. Confirm at build.
FROM pytorch/pytorch:2.3.1-cuda12.1-cudnn8-runtime

ENV PYTHONUNBUFFERED=1 \
    AVATAR_MODEL=wav2lip \
    AVATAR_MAX_AUDIO_SECONDS=900 \
    PORT=8772

RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg curl \
    && rm -rf /var/lib/apt/lists/* \
    && pip install --no-cache-dir "fastapi>=0.110,<1" "uvicorn[standard]>=0.29,<1"

COPY server.py /app/server.py
COPY backends /app/backends
WORKDIR /app

EXPOSE 8772
CMD ["python", "/app/server.py"]

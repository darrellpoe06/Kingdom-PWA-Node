# Sovereign SME transcription image -- CPU / INT8 faster-whisper.
#
# ISOLATED + ADDITIVE: built and run ON-DEMAND only. It is NOT part of the
# n8n-stack docker-compose, never auto-starts, and touches no running service.
# faster-whisper pulls ctranslate2 + av (PyAV bundles ffmpeg for decoding) +
# tokenizers + huggingface-hub, so no system ffmpeg is required inside.
#
# Build:  sudo /usr/local/bin/docker build -t poetech/sme-whisper:cpu .
# Run is driven by ../sme-video-to-spec.sh (never call this image by hand).

FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    HF_HOME=/models \
    HUGGINGFACE_HUB_CACHE=/models \
    OMP_NUM_THREADS=8

RUN pip install --no-cache-dir "faster-whisper>=1.1.0,<2"

COPY transcribe.py /app/transcribe.py
WORKDIR /work
ENTRYPOINT ["python", "/app/transcribe.py"]

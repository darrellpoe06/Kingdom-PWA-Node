#!/usr/bin/env python3
"""
diarize_local.py -- who spoke when, measured on our own machine (DR-0706).

SOVEREIGN AND LIGHT: sherpa-onnx (onnxruntime only; no torch, no cloud, no
account, no gated model). Two small ONNX models, downloaded once by install.sh
into DATA/models/speakers/ from the k2-fsa/sherpa-onnx GitHub releases:
  segmentation.onnx  pyannote segmentation 3.0 (who is speaking in each frame)
  embedding.onnx     NeMo TitaNet small, English (one voice vector per voice)
It runs on the NAS CPU beside the Whisper CPU rung, and on the 4070 tower the
same way if it is ever moved there. A cp38 manylinux2014 wheel exists, so the
NAS's Python 3.8 venv takes it (measured 2026-09-30: sherpa_onnx-1.13.8-cp38).

WHAT IT RETURNS (pure data; speaker_turns.py does the labelling):
  {"turns": [{"start", "end", "speaker"}], "centroids": {speaker: vector}}
One centroid per voice: the mean of the embeddings of that voice's turns of at
least MIN_TURN_SECONDS, so enrolled voiceprints (DP, BG) can be matched.

ARMED BY RECORD (DR-0247, DR-0706): speakers_enabled() is true when both
models are on disk AND sherpa_onnx imports, unless
LESSON_VOICE_SPEAKERS=0 in /volume1/PoeTech/secrets/lesson-voice.env (the
stop-path). Anything missing -> false, and the transcript is written exactly
as before with "Speakers: not marked".
"""
import os

SAMPLE_RATE = 16000
MIN_TURN_SECONDS = 1.5
CLUSTER_THRESHOLD = float(os.environ.get("SPEAKER_CLUSTER_THRESHOLD", "0.9"))


def models_dir(data_dir):
    return os.path.join(data_dir, "models", "speakers")


def model_paths(data_dir):
    d = models_dir(data_dir)
    return os.path.join(d, "segmentation.onnx"), os.path.join(d, "embedding.onnx")


def speakers_enabled(data_dir, env=None):
    env = env if env is not None else os.environ
    if env.get("LESSON_VOICE_SPEAKERS", "1") == "0":
        return False
    seg, emb = model_paths(data_dir)
    if not (os.path.isfile(seg) and os.path.isfile(emb)):
        return False
    try:
        import importlib.util
        return importlib.util.find_spec("sherpa_onnx") is not None
    except Exception:
        return False


def load_audio(path):
    """float32 mono samples at 16 kHz. faster-whisper's decoder (PyAV) reads
    the app's webm/m4a; a plain 16-bit wav is read with the stdlib."""
    try:
        from faster_whisper.audio import decode_audio
        return decode_audio(path, sampling_rate=SAMPLE_RATE)
    except ImportError:
        pass
    import wave
    import numpy as np
    with wave.open(path, "rb") as w:
        if w.getsampwidth() != 2:
            raise ValueError("only 16-bit wav without faster-whisper")
        sr, ch = w.getframerate(), w.getnchannels()
        a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
    if ch > 1:
        a = a.reshape(-1, ch).mean(axis=1)
    if sr != SAMPLE_RATE:
        # linear resample; good enough for voice vectors, never used for words
        n = int(len(a) * SAMPLE_RATE / sr)
        a = np.interp(np.linspace(0, len(a) - 1, n), np.arange(len(a)), a).astype(np.float32)
    return a


def _extractor(emb_model):
    import sherpa_onnx
    return sherpa_onnx.SpeakerEmbeddingExtractor(
        sherpa_onnx.SpeakerEmbeddingExtractorConfig(model=emb_model, num_threads=2))


def embed(extractor, samples):
    stream = extractor.create_stream()
    stream.accept_waveform(sample_rate=SAMPLE_RATE, waveform=samples)
    stream.input_finished()
    return [float(x) for x in extractor.compute(stream)]


def diarize(path, data_dir, num_speakers=-1):
    """Who spoke when, and one voice vector per voice. Raises on a real failure
    (the caller reports it and writes the transcript unmarked)."""
    import sherpa_onnx
    seg_model, emb_model = model_paths(data_dir)
    config = sherpa_onnx.OfflineSpeakerDiarizationConfig(
        segmentation=sherpa_onnx.OfflineSpeakerSegmentationModelConfig(
            pyannote=sherpa_onnx.OfflineSpeakerSegmentationPyannoteModelConfig(model=seg_model),
            num_threads=2,
        ),
        embedding=sherpa_onnx.SpeakerEmbeddingExtractorConfig(model=emb_model, num_threads=2),
        clustering=sherpa_onnx.FastClusteringConfig(num_clusters=num_speakers, threshold=CLUSTER_THRESHOLD),
        min_duration_on=0.3,
        min_duration_off=0.5,
    )
    if not config.validate():
        raise RuntimeError("speaker models failed to validate: " + seg_model + ", " + emb_model)
    sd = sherpa_onnx.OfflineSpeakerDiarization(config)
    samples = load_audio(path)
    result = sd.process(samples).sort_by_start_time()
    turns = [{"start": round(r.start, 2), "end": round(r.end, 2), "speaker": int(r.speaker)} for r in result]
    return {"turns": turns, "centroids": centroids(samples, turns, emb_model)}


def centroids(samples, turns, emb_model):
    from speaker_turns import mean_vector
    ex = _extractor(emb_model)
    per = {}
    for t in turns:
        if t["end"] - t["start"] < MIN_TURN_SECONDS:
            continue
        a, b = int(t["start"] * SAMPLE_RATE), int(t["end"] * SAMPLE_RATE)
        per.setdefault(t["speaker"], []).append(embed(ex, samples[a:b]))
    return {spk: mean_vector(vs) for spk, vs in per.items()}

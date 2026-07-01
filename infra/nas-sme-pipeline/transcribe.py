#!/usr/bin/env python3
"""SME media -> transcript via faster-whisper (CPU, INT8).

Sovereign: runs fully local inside an isolated container. No audio, no text,
and no model traffic leaves the NAS once the model is cached under /models.

Driven by sme-video-to-spec.sh, but runnable standalone:
    python transcribe.py <input_media> <output_dir> [model] [compute_type]

Writes:
    <output_dir>/transcript.txt   one line per segment (clean text)
    <output_dir>/transcript.json  segments with timestamps + media metadata
"""
import json
import os
import sys
import time

from faster_whisper import WhisperModel


def main():
    if len(sys.argv) < 3:
        print(
            "usage: transcribe.py <input_media> <output_dir> [model] [compute_type]",
            file=sys.stderr,
        )
        sys.exit(2)

    inp = sys.argv[1]
    out_dir = sys.argv[2]
    model_size = sys.argv[3] if len(sys.argv) > 3 else os.environ.get("WHISPER_MODEL", "large-v3-turbo")
    # Device is env-driven (default cpu -> existing NAS pipeline UNCHANGED). On the
    # church RTX 4070 node set WHISPER_DEVICE=cuda for the GPU path; CTranslate2 wants
    # float16 (not int8) on CUDA, so default the compute type per device.
    device = os.environ.get("WHISPER_DEVICE", "cpu")
    default_compute = "float16" if device == "cuda" else "int8"
    compute_type = sys.argv[4] if len(sys.argv) > 4 else os.environ.get("WHISPER_COMPUTE", default_compute)
    cpu_threads = int(os.environ.get("WHISPER_THREADS", "0"))  # 0 = ctranslate2 default (all cores)

    if not os.path.exists(inp):
        print("ERROR: input not found: %s" % inp, file=sys.stderr)
        sys.exit(1)
    os.makedirs(out_dir, exist_ok=True)

    t0 = time.time()
    print(
        "[transcribe] loading model=%s compute=%s device=%s..." % (model_size, compute_type, device),
        file=sys.stderr,
    )
    # cpu_threads only applies on CPU; CTranslate2 ignores it on CUDA.
    model = WhisperModel(
        model_size, device=device, compute_type=compute_type, cpu_threads=cpu_threads
    )
    t_load = time.time() - t0
    print(
        "[transcribe] model ready in %.1fs; transcribing %s ..." % (t_load, inp),
        file=sys.stderr,
    )

    segments, info = model.transcribe(inp, beam_size=5, vad_filter=True)

    txt_path = os.path.join(out_dir, "transcript.txt")
    json_path = os.path.join(out_dir, "transcript.json")
    seg_list = []
    with open(txt_path, "w", encoding="utf-8") as f:
        for seg in segments:  # generator -> realizes transcription as we iterate
            line = seg.text.strip()
            if line:
                f.write(line + "\n")
            seg_list.append(
                {"start": round(seg.start, 2), "end": round(seg.end, 2), "text": line}
            )

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(
            {
                "language": info.language,
                "language_probability": round(info.language_probability, 3),
                "duration_sec": round(info.duration, 2),
                "model": model_size,
                "compute_type": compute_type,
                "segment_count": len(seg_list),
                "segments": seg_list,
            },
            f,
            indent=2,
        )

    dt = time.time() - t0
    print(
        "[transcribe] done: %d segments, lang=%s (%.2f), media=%.1fs, wall=%.1fs -> %s"
        % (len(seg_list), info.language, info.language_probability, info.duration, dt, txt_path),
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()

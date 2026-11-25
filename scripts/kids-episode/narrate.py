#!/usr/bin/env python3
"""Render the narration for a Bible Adventures episode with Kokoro (Apache-2.0).

Reads scripts/kids-episode/<id>.episode.json (the KJV lines are copied from the
in-repo corpus by the episode builder, never typed by hand), speaks every line
with one voice, or with the episode's cast ("cast": a voice per speaker, the
"who" of each line), and writes one WAV per line plus timings.json (seconds per
line), so the movie is timed to the voice and the captions to the words.

  python3 narrate.py <episode.json> <outDir> <voice|cast> [--sample]

--sample speaks only the first verse and one guide line (a short audition clip).
Runs where Hugging Face is reachable (a GitHub runner); the weights are fetched
once by the kokoro package.
"""

import json
import os
import sys

import numpy as np
import soundfile as sf
from kokoro import KPipeline

ep_path, out, voice = sys.argv[1], sys.argv[2], sys.argv[3]
sample = "--sample" in sys.argv
os.makedirs(out, exist_ok=True)
with open(ep_path) as fh:
    ep = json.load(fh)
# Pronunciations the G2P would guess wrong (misaki inline phonemes).
SAY = {
    "Yahweh": "[Yahweh](/jˈɑwˌeɪ/)",
    "Nineveh": "[Nineveh](/nˈɪnəvə/)",
    "Amittai": "[Amittai](/əmˈɪtaɪ/)",
    "Tarshish": "[Tarshish](/tˈɑɹʃɪʃ/)",
}


def prep(t):
    for k, v in SAY.items():
        t = t.replace(k, v)
    return t


CAST = ep.get("cast", {}) if voice == "cast" else {}
PACE = ep.get("pace", {})  # per beat: the scene's pace (storm quicker, prayer slower)
pipes = {}


def speak(text, v, speed):
    lang = "a" if v.startswith("a") else "b"
    if lang not in pipes:
        pipes[lang] = KPipeline(lang_code=lang)
    return [a for _, _, a in pipes[lang](prep(text), voice=v, speed=speed)]


SR = 24000
lines = [(b["id"], i, l) for b in ep["beats"] for i, l in enumerate(b["lines"])]
if sample:
    first_kjv = next(x for x in lines if x[2]["kind"] == "kjv")
    first_guide = next(x for x in lines if x[2]["kind"] != "kjv" and x[0] != "intro")
    lines = [first_kjv, first_guide]
timings = []
for bid, i, l in lines:
    who = l.get("who", "narrator")
    v = CAST.get(who, voice if voice != "cast" else "am_michael")
    if isinstance(v, list):  # several speakers together (the guides): the first voice
        v = v[0]
    speed = (0.88 if l["kind"] == "kjv" else 0.95) * PACE.get(bid, 1.0)
    chunks = speak(l["text"], v, speed)
    audio = (
        np.concatenate([np.asarray(c, dtype=np.float32) for c in chunks])
        if chunks
        else np.zeros(1, np.float32)
    )
    f = f"{bid}-{i:02d}.wav"
    sf.write(os.path.join(out, f), audio, SR)
    timings.append(
        {
            "beat": bid,
            "line": i,
            "file": f,
            "seconds": round(len(audio) / SR, 3),
            "kind": l["kind"],
            "who": who,
            "voice": v,
            "ref": l.get("ref"),
            "text": l["text"],
        }
    )
    print(f"{f} {len(audio) / SR:.2f}s", flush=True)
with open(os.path.join(out, "timings.json"), "w") as fh:
    json.dump(
        {"voice": voice, "sampleRate": SR, "lines": timings},
        fh,
        indent=1,
        ensure_ascii=False,
    )
if sample:
    gap = np.zeros(int(SR * 0.6), np.float32)
    parts = []
    for t in timings:
        a, _ = sf.read(os.path.join(out, t["file"]), dtype="float32")
        parts += [a, gap]
    sf.write(os.path.join(out, f"sample-{voice}.wav"), np.concatenate(parts), SR)

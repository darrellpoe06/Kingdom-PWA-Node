#!/usr/bin/env python3
"""
name_voice.py -- teach the NAS whose voice is whose (DR-0701). Run by hand,
once per voice, on the NAS (the voiceprints never leave it).

  1. LIST the voices in a recording the NAS already keeps:
       python3 name_voice.py --audio <file> --list [--speakers N]
     prints each voice (0, 1, 2, ...) with its talk time and its first turns'
     times and, when Whisper segments are at hand (--segments <json>, or the
     transcriber's saved DATA/segments/<row id>.json), the words of its longest
     turns (or --whisper base to write them now), so a person who was in the
     room can say "voice 0 is Bishop Gwin".
     The voices and their vectors are kept in DATA/voiceprints/pending.json.
  2. NAME them:
       python3 name_voice.py --name 0=BG --name 3=DP
     writes DATA/voiceprints/BG.json and DP.json from the listed vectors.
From then on the transcriber labels those voices BG and DP in every new
recording; every other voice stays S1, S2, ... (speaker_turns.py).

Only a person who knows the voices names them. Nothing here guesses.
"""
import argparse
import json
import os
import sys

import speaker_turns as st

DATA = os.environ.get("LESSON_VOICE_DATA", "/volume1/PoeTech/lesson-voice")


def summarize(diarized, segments=None, top=3):
    """[{voice, seconds, turns, first, lines}] per voice, most talk first. Pure."""
    per = {}
    for t in diarized.get("turns") or []:
        v = per.setdefault(t["speaker"], {"voice": t["speaker"], "seconds": 0.0, "turns": 0, "first": [], "spans": []})
        v["seconds"] += t["end"] - t["start"]
        v["turns"] += 1
        if len(v["first"]) < top:
            v["first"].append(f"{int(t['start'] // 60)}:{int(t['start'] % 60):02d}")
        v["spans"].append((t["end"] - t["start"], t["start"], t["end"]))
    for v in per.values():
        v["seconds"] = round(v["seconds"], 1)
        v["lines"] = []
        if segments:
            for _, a, b in sorted(v["spans"], reverse=True)[:top]:
                words = " ".join(s["text"].strip() for s in segments
                                 if st.overlap(float(s["start"]), float(s["end"]), a, b) > 0)
                if words:
                    v["lines"].append(words[:160])
        del v["spans"]
    return sorted(per.values(), key=lambda v: -v["seconds"])


def parse_names(pairs):
    out = {}
    for p in pairs or []:
        voice, _, initials = p.partition("=")
        if not voice.strip().isdigit() or not initials:
            raise ValueError(f"--name takes VOICE=INITIALS, e.g. 0=BG (got {p!r})")
        out[int(voice)] = initials.strip().upper()
    return out


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--audio")
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--segments")
    ap.add_argument("--whisper", help="write the words with local faster-whisper (e.g. base) when no --segments")
    ap.add_argument("--speakers", type=int, default=-1, help="the number of voices, when known")
    ap.add_argument("--name", action="append")
    ap.add_argument("--data", default=DATA)
    a = ap.parse_args(argv)
    pending = os.path.join(a.data, "voiceprints", "pending.json")

    if a.list:
        if not a.audio:
            ap.error("--list needs --audio")
        import diarize_local as dl
        diarized = dl.diarize(a.audio, a.data, num_speakers=a.speakers)
        segments = None
        if a.segments:
            with open(a.segments, encoding="utf-8") as f:
                segments = json.load(f)
        elif a.whisper:
            from faster_whisper import WhisperModel
            model = WhisperModel(a.whisper, device="cpu", compute_type="int8")
            segs, _ = model.transcribe(a.audio, beam_size=1, vad_filter=True)
            segments = [{"start": s.start, "end": s.end, "text": s.text} for s in segs]
        os.makedirs(os.path.dirname(pending), exist_ok=True)
        with open(pending, "w", encoding="utf-8") as f:
            json.dump({"audio": a.audio, "centroids": {str(k): v for k, v in diarized["centroids"].items()}}, f)
        for v in summarize(diarized, segments):
            print(f"voice {v['voice']}: {v['seconds']} s in {v['turns']} turns; first at {', '.join(v['first'])}")
            for line in v["lines"]:
                print(f"    {line}")
        print(f"\nNow name the ones you know, e.g.: python3 name_voice.py --name 0=BG --name 3=DP")
        return 0

    if a.name:
        names = parse_names(a.name)
        with open(pending, encoding="utf-8") as f:
            p = json.load(f)
        for voice, initials in names.items():
            vec = p["centroids"].get(str(voice))
            if not vec:
                print(f"voice {voice} has no vector (its turns were all under 1.5 s); pick another", file=sys.stderr)
                return 2
            path = st.save_voiceprint(a.data, initials, vec, source=p.get("audio", ""))
            print(f"{initials} ({st.KNOWN_VOICES.get(initials, 'a new voice')}) <- voice {voice}: {path}")
        return 0

    ap.print_help()
    return 1


if __name__ == "__main__":
    sys.exit(main())

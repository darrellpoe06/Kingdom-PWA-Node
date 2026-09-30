#!/usr/bin/env python3
"""
name_voice.py -- teach the NAS whose voice is whose (DR-0712). Run by hand,
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

  3. OR ENROLL BY WORDS a person who was there already attributed
     (enroll.json, committed; run once by install.sh on the NAS):
       python3 name_voice.py --enroll enroll.json
     Each entry names a recording, a label, and words that label is KNOWN to
     have said (Darrell's own account of L202: BG's testimony, DP's "I'm
     actually in technology"). The voice that carries those words gets the
     label. It refuses, and names no one, when the words are not found, when
     they fall across two voices, or when two labels land on one voice.

Only a person who knows the voices names them: directly (--name), or through
words they attributed (--enroll). Nothing here guesses.
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


def _tokens(text):
    import re
    return [w for w in re.findall(r"[a-z']+", (text or "").lower()) if len(w) > 2]


def find_words(segments, words, need=0.8):
    """(start, end) of the shortest run of consecutive segments that holds at
    least `need` of the distinctive words, or None. Whisper hears a phrase a
    little differently each time, so the match is by words, not characters."""
    want = set(_tokens(words))
    if not want:
        return None
    best = None
    segs = list(segments or [])
    for i in range(len(segs)):
        got = set()
        for j in range(i, min(i + 4, len(segs))):
            got |= set(_tokens(segs[j].get("text")))
            if len(want & got) >= need * len(want):
                span = (float(segs[i]["start"]), float(segs[j]["end"]))
                if best is None or span[1] - span[0] < best[1] - best[0]:
                    best = span
                break
    return best


def voice_for_span(turns, span, need=0.7):
    """The diarized voice that covers at least `need` of the span, or None
    (the words fall across two voices, or in a gap)."""
    a, b = span
    length = max(1e-6, b - a)
    per = {}
    for t in turns or []:
        ov = st.overlap(a, b, float(t["start"]), float(t["end"]))
        if ov > 0:
            per[t["speaker"]] = per.get(t["speaker"], 0.0) + ov
    if not per:
        return None
    voice, ov = max(per.items(), key=lambda kv: kv[1])
    return voice if ov / length >= need else None


def enroll_by_words(diarized, segments, entries):
    """{label: voice} for every entry whose words land on one voice, plus
    [reasons] for the rest. Refuses outright (returns {}, reasons) when two
    labels land on one voice: that is a wrong attribution, not a voice."""
    found, why = {}, []
    for e in entries:
        label = (e.get("label") or "").upper()
        span = find_words(segments, e.get("words", ""))
        if span is None:
            why.append(f"{label}: the words were not found ({e.get('words', '')[:60]!r})")
            continue
        voice = voice_for_span(diarized.get("turns"), span)
        if voice is None:
            why.append(f"{label}: the words at {span[0]:.1f}-{span[1]:.1f} s fall across voices")
            continue
        if not diarized.get("centroids", {}).get(voice):
            why.append(f"{label}: voice {voice} has no vector")
            continue
        found[label] = voice
    voices = list(found.values())
    if len(set(voices)) != len(voices):
        return {}, why + [f"two labels landed on one voice ({found}); nobody is enrolled"]
    return found, why


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
    ap.add_argument("--enroll", help="enroll.json: label a voice by words a person attributed")
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

    if a.enroll:
        return enroll(a.enroll, a.data, a.whisper or os.environ.get("LESSON_VOICE_ENROLL_MODEL", "base"))

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


def enroll(spec_path, data, whisper_model):
    """Run enroll.json on the NAS. Writes DATA/voiceprints/<LABEL>.json for each
    label found and DATA/enroll-result.json (what was found and why not), which
    the witness (voice-intake-health.yml) reads."""
    with open(spec_path, encoding="utf-8") as f:
        spec = json.load(f)
    have = st.load_voiceprints(data)
    result = {"enrolled": {}, "skipped": [], "why": []}
    by_audio = {}
    for e in spec.get("entries") or []:
        if (e.get("label") or "").upper() in have:
            result["skipped"].append(e.get("label"))
            continue
        by_audio.setdefault(e["audio"], []).append(e)
    import diarize_local as dl
    for audio, entries in by_audio.items():
        path = audio if os.path.isabs(audio) else os.path.join(data, "audio", audio)
        if not os.path.isfile(path):
            result["why"].append(f"no audio on the NAS at {path}")
            continue
        diarized = dl.diarize(path, data)
        seg_file = os.path.join(data, "segments", entries[0].get("row", "") + ".json")
        if entries[0].get("row") and os.path.isfile(seg_file):
            with open(seg_file, encoding="utf-8") as f:
                segments = json.load(f)
        else:
            from faster_whisper import WhisperModel
            model = WhisperModel(whisper_model, device="cpu", compute_type="int8")
            segs, _ = model.transcribe(path, beam_size=1, vad_filter=True)
            segments = [{"start": s.start, "end": s.end, "text": s.text} for s in segs]
        found, why = enroll_by_words(diarized, segments, entries)
        result["why"] += why
        for label, voice in found.items():
            st.save_voiceprint(data, label, diarized["centroids"][voice], source=audio)
            result["enrolled"][label] = voice
    with open(os.path.join(data, "enroll-result.json"), "w", encoding="utf-8") as f:
        json.dump(result, f)
    print(json.dumps(result))
    return 0 if result["enrolled"] or result["skipped"] else 2


if __name__ == "__main__":
    sys.exit(main())

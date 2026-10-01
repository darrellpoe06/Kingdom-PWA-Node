#!/usr/bin/env python3
"""
speaker_turns.py -- who is talking, written into the transcript (DR-0712).

Darrell 2026-09-30, after the Bible study he recorded in the app came back as
one unbroken block: "Differentiate between speakers... Bishop Gwin is BG...
Darrell Poe is DP... etc..." / "Other congregation members are called by
BG..." / "Make sure our process can tell who's talking moving forward...
makes sense?"

This module is PURE (stdlib only, no numpy, no model): it takes what the
local diarizer measured (diarize_local.py: who spoke when, and one voice
vector per voice) and what Whisper heard (segments with start/end/text), and
writes the transcript the lesson builder reads:

    Speakers: marked by voice on our own machine. BG = Bishop Gwin; DP =
    Darrell Poe; S1, S2 = voices not yet named.
    S2 = Janelle (Bishop Gwin called her by name just before she spoke).

    BG: Number four, God defines success.
    S1: Amen.
    DP: I love this question. I'm actually in technology...

THE RULES, each pinned in test_speaker_turns.py:
  1. A KNOWN voice gets its initials only when its voice vector matches an
     enrolled voiceprint (DATA/voiceprints/<INITIALS>.json) above
     MATCH_THRESHOLD, one voice to one voiceprint. DP = Darrell Poe,
     BG = Bishop Gwin (KNOWN_VOICES); more are enrolled the same way.
  2. Every other voice is S1, S2, ... in order of first appearance. A voice is
     never guessed into a name.
  3. A member is named only as the teacher (BG) calls them, and only where the
     transcript shows it: a BG turn that is nothing but a name, followed at
     once by an unknown voice, names that voice. The name goes in the header
     beside the S label; the lines keep the S label, so the raw record stays
     what the machine heard. Whether a lesson may USE the name is the builder's
     rule (DR-0711: a church session the church posts publicly; never health,
     giving, family trouble or a confidence).
  4. No diarizer, no speakers: the header says the speakers are not marked,
     and the words are exactly what Whisper heard (the old transcript).
"""
import json
import math
import os
import re

KNOWN_VOICES = {"DP": "Darrell Poe", "BG": "Bishop Gwin"}
TEACHER = "BG"
MATCH_THRESHOLD = float(os.environ.get("SPEAKER_MATCH_THRESHOLD", "0.55"))
# A Whisper segment with no diarized turn under it takes the nearest turn
# within this many seconds; farther than that it is left unlabelled (the
# honest '?' label), never guessed.
NEAREST_SECONDS = 1.0

UNMARKED_HEADER = ("Speakers: not marked. Whisper does not tell voices apart, so who spoke "
                   "is read from the recording's context and the sender's own account.")
LABEL_RE = re.compile(r"^(DP|BG|[A-Z]{2,3}|S\d+|\?): (.+)$")
TITLES = ("Elder", "Evangelist", "Sister", "Brother", "Mother", "Deacon", "Pastor",
          "Minister", "Deaconess", "Missionary", "Bishop", "Dr.")


# --- vectors -------------------------------------------------------------------

def cosine(a, b):
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    return dot / (na * nb) if na and nb else 0.0


def mean_vector(vectors):
    vs = [v for v in vectors if v]
    if not vs:
        return []
    n = len(vs[0])
    return [sum(v[i] for v in vs) / len(vs) for i in range(n)]


def match_voices(centroids, voiceprints, threshold=None):
    """{voice id: initials} for the voices that match an enrolled voiceprint.
    One to one, best pairs first; below the threshold a voice stays unknown."""
    threshold = MATCH_THRESHOLD if threshold is None else threshold
    pairs = []
    for vid, c in (centroids or {}).items():
        for initials, vp in (voiceprints or {}).items():
            pairs.append((cosine(c, vp), vid, initials))
    pairs.sort(key=lambda p: (-p[0], str(p[1]), p[2]))
    out, used = {}, set()
    for score, vid, initials in pairs:
        if score < threshold or vid in out or initials in used:
            continue
        out[vid] = initials
        used.add(initials)
    return out


# --- segments onto turns -------------------------------------------------------

def overlap(a0, a1, b0, b1):
    return max(0.0, min(a1, b1) - max(a0, b0))


def assign_segments(segments, turns):
    """Each Whisper segment takes the diarized voice it overlaps most; with no
    overlap, the nearest turn within NEAREST_SECONDS; otherwise None."""
    out = []
    for s in segments or []:
        s0, s1 = float(s.get("start", 0)), float(s.get("end", 0))
        best, best_ov = None, 0.0
        for t in turns or []:
            ov = overlap(s0, s1, float(t["start"]), float(t["end"]))
            if ov > best_ov:
                best, best_ov = t.get("speaker"), ov
        if best is None:
            near, gap = None, NEAREST_SECONDS
            for t in turns or []:
                g = min(abs(s0 - float(t["end"])), abs(float(t["start"]) - s1))
                if g <= gap:
                    near, gap = t.get("speaker"), g
            best = near
        out.append({"start": s0, "end": s1, "text": (s.get("text") or "").strip(), "voice": best})
    return out


def label_voices(assigned, known):
    """{voice id: label}: known initials first, every other voice S1, S2, ...
    by first appearance."""
    labels, n = {}, 0
    for s in assigned:
        v = s.get("voice")
        if v is None or v in labels:
            continue
        if v in (known or {}):
            labels[v] = known[v]
        else:
            n += 1
            labels[v] = f"S{n}"
    return labels


def merge_turns(assigned, labels):
    """[(label, text)]: consecutive segments of one voice joined into a turn."""
    turns = []
    for s in assigned:
        if not s["text"]:
            continue
        label = labels.get(s.get("voice"), "?") if s.get("voice") is not None else "?"
        if turns and turns[-1][0] == label:
            turns[-1] = (label, turns[-1][1] + " " + s["text"])
        else:
            turns.append((label, s["text"]))
    return turns


# --- a member named as the teacher calls them -----------------------------------

def bare_name(text):
    """The name a turn consists of, or ''. 'Janelle.' / 'Elder Mosley.' /
    'Sister Jones?' -> the name; anything with more to it -> ''."""
    t = (text or "").strip().rstrip(".!?,")
    words = t.split()
    if not 1 <= len(words) <= 3:
        return ""
    if not all(re.match(r"^[A-Z][a-z'\-]+\.?$", w) for w in words):
        return ""
    if len(words) > 1 and words[0] not in TITLES:
        return ""
    return t


def called_on(turns, teacher=TEACHER):
    """{S label: name} for each unknown voice the teacher called on by name
    immediately before it spoke. Two different names for one voice -> neither."""
    seen = {}
    for (who, text), (nxt, _) in zip(turns, turns[1:]):
        if who != teacher or not re.match(r"^S\d+$", nxt):
            continue
        name = bare_name(text)
        if name:
            seen.setdefault(nxt, set()).add(name)
    return {s: next(iter(names)) for s, names in seen.items() if len(names) == 1}


# --- the transcript --------------------------------------------------------------

def header(labels_used, named=None):
    used = [l for l in labels_used if l != "?"]
    known = [f"{l} = {KNOWN_VOICES[l]}" for l in sorted(set(used)) if l in KNOWN_VOICES]
    unknown = sorted({l for l in used if re.match(r"^S\d+$", l)}, key=lambda x: int(x[1:]))
    parts = ["Speakers: marked by voice on our own machine."]
    if known:
        parts.append("; ".join(known) + ".")
    if unknown:
        parts.append(", ".join(unknown) + (" = voices not yet named." if len(unknown) > 1 else " = a voice not yet named."))
    if "?" in labels_used:
        parts.append("? = words no voice could be placed on.")
    lines = [" ".join(parts)]
    for s, name in sorted((named or {}).items(), key=lambda kv: int(kv[0][1:])):
        lines.append(f"{s} = {name} (Bishop Gwin called them by name just before they spoke).")
    return "\n".join(lines)


def format_turns(turns):
    return "\n".join(f"{who}: {text}" for who, text in turns)


def speaker_transcript(segments, diarized, voiceprints):
    """The labelled transcript, or None when there is nothing to label.
    `diarized` = {"turns": [{start, end, speaker}], "centroids": {speaker: vector}}."""
    if not diarized or not diarized.get("turns") or not segments:
        return None
    known = match_voices(diarized.get("centroids") or {}, voiceprints or {})
    assigned = assign_segments(segments, diarized["turns"])
    labels = label_voices(assigned, known)
    turns = merge_turns(assigned, labels)
    if not turns:
        return None
    named = called_on(turns)
    used = []
    for who, _ in turns:
        if who not in used:
            used.append(who)
    return {
        "header": header(used, named),
        "text": format_turns(turns),
        "labels": used,
        "named": named,
        "known": sorted({l for l in used if l in KNOWN_VOICES}),
        "voices": len([l for l in used if l != "?"]),
    }


def parse_turns(text):
    """[(label, words)] from a labelled transcript; raises ValueError on a line
    that is not 'LABEL: words' (the builder and the app read this shape)."""
    out = []
    for line in (text or "").splitlines():
        if not line.strip():
            continue
        m = LABEL_RE.match(line)
        if not m:
            raise ValueError("not a speaker line: " + line[:60])
        out.append((m.group(1), m.group(2)))
    return out


# --- voiceprints on disk (the NAS keeps them; they never leave it) ---------------

def load_voiceprints(data_dir):
    d = os.path.join(data_dir, "voiceprints")
    out = {}
    try:
        names = os.listdir(d)
    except OSError:
        return out
    for n in sorted(names):
        m = re.match(r"^([A-Z]{2,3})\.json$", n)
        if not m:
            continue
        try:
            with open(os.path.join(d, n), encoding="utf-8") as f:
                v = json.load(f).get("vector") or []
            if v:
                out[m.group(1)] = [float(x) for x in v]
        except (OSError, ValueError):
            continue
    return out


def save_voiceprint(data_dir, initials, vector, source=""):
    if not re.match(r"^[A-Z]{2,3}$", initials or ""):
        raise ValueError("initials are two or three capital letters, e.g. DP, BG")
    d = os.path.join(data_dir, "voiceprints")
    os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, initials + ".json"), "w", encoding="utf-8") as f:
        json.dump({"initials": initials, "name": KNOWN_VOICES.get(initials, ""), "source": source,
                   "vector": [round(float(x), 6) for x in vector]}, f)
    return os.path.join(d, initials + ".json")

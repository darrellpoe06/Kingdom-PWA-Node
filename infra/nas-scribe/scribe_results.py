"""
scribe_results.py -- what a Scribe recording BECAME, read back (DR-0622).

The whole-system flow graph found the Scribe chain ending in the dark: a
recording went in (scribe_ingest_server.py), the consumer wrote transcript.json
and minutes.md into its session folder (scribe_queue_consumer.py), and nothing
ever read them back -- the person who recorded the meeting never saw the words.
These are the pure, stdlib-only readers the ingest server serves them with, so
they are tested without FastAPI (test_scribe_consumer.py).

Also the door's lock: the app's devices carry the FAMILY key (published by the
NAS itself, DR-0613; provisioned per device by lib/bridge-provision.js), not the
Scribe-only token the installer mints. Both are accepted, so the family can use
the Scribe without anyone pasting a second secret.
"""
import json
import os

FAMILY_KEY_FILE = "/volume1/PoeTech/secrets/chat-bridge-token.txt"


def read_key(path):
    try:
        with open(path, encoding="utf-8") as f:
            return f.read().strip()
    except OSError:
        return ""


def bearer_ok(header, tokens):
    """True when the Authorization header is `Bearer <one of tokens>`.
    With no token configured at all the door is closed, never open."""
    live = [t for t in (tokens or []) if t]
    if not live:
        return False
    h = str(header or "")
    return any(h == "Bearer " + t for t in live)


def _read_json(path):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return None


def _read_text(path, cap=200000):
    try:
        with open(path, encoding="utf-8") as f:
            return f.read(cap)
    except OSError:
        return ""


def transcript_text(transcript):
    """whisper-gpu answers {text} or {segments:[{text}]}; either becomes words."""
    if not isinstance(transcript, dict):
        return ""
    if str(transcript.get("text") or "").strip():
        return str(transcript["text"]).strip()
    segs = transcript.get("segments") or []
    return " ".join(str(s.get("text") or "").strip() for s in segs if isinstance(s, dict)).strip()


def session_summary(sdir, with_words=False):
    """One session folder -> where it stands. States, from files that exist:
    recording -> queued (manifest.json) -> transcribed (transcript.json)
    -> minuted (minutes.md). Never invents a state it cannot see."""
    record = _read_json(os.path.join(sdir, "session.json")) or {}
    if not record:
        return None
    transcript = _read_json(os.path.join(sdir, "transcript.json"))
    minutes = _read_text(os.path.join(sdir, "minutes.md")) if os.path.isfile(os.path.join(sdir, "minutes.md")) else ""
    state = "recording"
    if os.path.isfile(os.path.join(sdir, "manifest.json")):
        state = "queued"
    if transcript is not None:
        state = "transcribed"
    if minutes.strip():
        state = "minuted"
    out = {
        "sessionId": record.get("sessionId") or os.path.basename(sdir),
        "kind": record.get("kind") or "",
        "createdAt": record.get("createdAt") or "",
        "state": state,
    }
    if with_words:
        out["transcript"] = transcript_text(transcript)
        out["minutes"] = minutes
    return out


def list_sessions(data_dir, limit=50):
    """Every session, newest first, states only (no words: a list is a list)."""
    root = os.path.join(data_dir, "sessions")
    if not os.path.isdir(root):
        return []
    rows = []
    for name in os.listdir(root):
        s = session_summary(os.path.join(root, name))
        if s:
            rows.append(s)
    rows.sort(key=lambda r: r.get("createdAt") or "", reverse=True)
    return rows[: max(1, int(limit or 50))]

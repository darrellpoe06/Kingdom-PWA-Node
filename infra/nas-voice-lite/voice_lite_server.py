#!/usr/bin/env python3
# =============================================================================
# voice_lite_server -- a REAL-AUDIO reading voice on the NAS's own CPU (Piper)
# =============================================================================
# Darrell 2026-09-24, from his Android phone with a lesson reading: "Why doesn't
# the player remain playing in the background when I switch between apps?!!?
# Fix it."
#
# THE CAUSE, as far as it can be known from here. His screenshot says the voice
# was "Darrell Poe · AI (stand-in)" with "the studio is offline": the GPU studio
# (infra/voice-studio, XTTS on the 4070) was dark, so the reader fell back to
# the phone's own Web Speech engine. Web Speech is not media: Android Chrome
# stops it when the page leaves the screen, whatever the page does to stay
# alive. A real audio clip in an <audio> element is media, and a phone keeps
# media playing in the background like any music app. So the fix is not a
# cleverer keep-alive; it is a voice that is AUDIO even when the GPU is dark.
#
# This is that voice: Piper (rhasspy/piper, MIT, CPU, offline) behind the same
# bearer lock every sovereign door already uses. It never pretends to be a
# person's cloned voice -- it is the labelled stand-in, now as real audio.
#
# Contract (the Funnel mount /voice-lite is STRIPPED by tailscale, so the bare
# paths arrive; the prefixed spellings are served too, for a proxy that does
# not strip):
#   GET  /health, /voice-lite/health -> 200 {"ok":true,"voices":[ids..]} only
#        when the piper binary and at least one voice model are really on disk;
#        503 otherwise. Open (says nothing worth guarding).
#   GET  /voices, /voice-lite/voices -> 200 {"ok":true,"voices":[{id,label,
#        gender,accent,quality,note}], "aliases":{...}, "default":id} -- the
#        voices REALLY installed on this box, so the app lists what is there
#        and never a painted list (DR-0653). 503 when none. Open.
#   POST /speak,  /voice-lite/speak  -> Authorization: Bearer <family token>.
#        Body {"text": "...", "voice": "<model id>"|"male"|"female"}. Returns
#        audio/wav. 401 bad/missing bearer, 400 empty, 413 too long, 503 busy.
#
# Cached by sha256(model + text): a paragraph read twice is synthesized once.
#
# Brakes (request-driven, not the timer class; a public door still has bounds):
#   * MAX_INFLIGHT concurrent syntheses; the next gets 503 immediately.
#   * MAX_CHARS per request (the app sends a paragraph at a time).
#   * SYNTH_TIMEOUT seconds per synthesis; a hung piper hangs nobody.
#   * CACHE_MAX_BYTES on disk, oldest clips pruned first.
#
# Run:
#   python3 voice_lite_server.py --port 8772
#   python3 voice_lite_server.py --selftest    # offline, stdlib, no piper needed
# Installed + kept running by infra/nas-voice-lite/install.sh via services-sync.
# =============================================================================
import argparse
import hashlib
import hmac
import json
import os
import subprocess
import sys
import tempfile
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

TOKEN_FILE_DEFAULT = "/volume1/PoeTech/secrets/chat-bridge-token.txt"
HOME_DEFAULT = "/volume1/PoeTech/voice-lite"
MAX_INFLIGHT = int(os.environ.get("VOICE_LITE_MAX_INFLIGHT", "2"))
MAX_BODY = 64 * 1024
MAX_CHARS = int(os.environ.get("VOICE_LITE_MAX_CHARS", "1500"))
SYNTH_TIMEOUT = float(os.environ.get("VOICE_LITE_TIMEOUT", "90"))
CACHE_MAX_BYTES = int(os.environ.get("VOICE_LITE_CACHE_BYTES", str(400 * 1024 * 1024)))

# The voices the installer downloads (DR-0653, "Every voice is choosable").
# Darrell 2026-09-25: "I can only pic this fake dying voice!!!!!! Why
# limitations are built into the app!!!!! Fix it!!!!!" Two voices were all the
# house had. Every name below was checked against rhasspy/piper's own
# VOICES.md index of the rhasspy/piper-voices v1.0.0 files; install.sh fetches
# each model WITH its .onnx.json config, and a model only counts as installed
# when both are on disk.
#
# A HIGH model is a larger network: it reads more naturally and costs the NAS
# CPU more per paragraph. It is labelled, never blocked -- the listener chooses.
VOICES = {
    "en_US-ryan-medium": {"label": "Ryan", "gender": "male", "accent": "American", "quality": "medium"},
    "en_US-amy-medium": {"label": "Amy", "gender": "female", "accent": "American", "quality": "medium"},
    "en_US-lessac-medium": {"label": "Lessac", "gender": "female", "accent": "American", "quality": "medium"},
    "en_US-joe-medium": {"label": "Joe", "gender": "male", "accent": "American", "quality": "medium"},
    "en_US-hfc_male-medium": {"label": "HFC (man)", "gender": "male", "accent": "American", "quality": "medium"},
    "en_US-hfc_female-medium": {"label": "HFC (woman)", "gender": "female", "accent": "American", "quality": "medium"},
    "en_GB-alan-medium": {"label": "Alan", "gender": "male", "accent": "British", "quality": "medium"},
    "en_GB-northern_english_male-medium": {"label": "Northern English", "gender": "male", "accent": "British (Northern)", "quality": "medium"},
    "en_US-ryan-high": {"label": "Ryan (high quality)", "gender": "male", "accent": "American", "quality": "high"},
}
# The words the app sent before voices were named, kept working: a stand-in
# for a man reads in a man's voice (DR-0138); anything unknown gets the default.
ALIASES = {"male": "en_US-ryan-medium", "female": "en_US-amy-medium"}
DEFAULT_VOICE = "male"
DEFAULT_MODEL = ALIASES[DEFAULT_VOICE]


def resolve_voice(name):
    """The model id a request's `voice` means: an alias, a known model, or the default."""
    if name in ALIASES:
        return ALIASES[name]
    if name in VOICES:
        return name
    return DEFAULT_MODEL


def voice_note(meta):
    """The one-line truth the app shows beside this voice."""
    if meta.get("quality") == "high":
        return ("Most natural of the house voices, and the slowest: the NAS works harder, "
                "so the first paragraph takes longer. Keeps playing when you switch apps.")
    return "Real audio from the church's own server. Keeps playing when you switch apps."


def describe_voices(installed):
    """The /voices answer for the model ids really on disk, in catalog order."""
    out = []
    for vid, meta in VOICES.items():
        if vid in installed:
            out.append({"id": vid, "label": meta["label"], "gender": meta["gender"],
                        "accent": meta["accent"], "quality": meta["quality"], "note": voice_note(meta)})
    return out


SPEAK_PATHS = {"/speak", "/voice-lite/speak"}
HEALTH_PATHS = {"/health", "/voice-lite/health"}
VOICES_PATHS = {"/voices", "/voice-lite/voices"}


def expected_token(token_file=None):
    if os.environ.get("VOICE_BRIDGE_TOKEN"):
        return os.environ["VOICE_BRIDGE_TOKEN"].strip()
    try:
        with open(token_file or TOKEN_FILE_DEFAULT, "r", encoding="utf-8") as fh:
            return fh.read().strip()
    except OSError:
        return ""


def bearer_ok(header_value, expected):
    if not expected or not header_value or not header_value.lower().startswith("bearer "):
        return False
    return hmac.compare_digest(header_value[7:].strip(), expected)


class Piper:
    """The real synthesizer: the piper binary + a voice model, text on stdin."""

    def __init__(self, home):
        self.home = home
        self.binary = os.path.join(home, "piper", "piper")

    def model_path(self, model_id):
        return os.path.join(self.home, "voices", (model_id if model_id in VOICES else DEFAULT_MODEL) + ".onnx")

    def available_voices(self):
        """Model ids whose model AND config are both on disk (piper needs both)."""
        if not (os.path.isfile(self.binary) and os.access(self.binary, os.X_OK)):
            return []
        return [k for k in VOICES
                if os.path.isfile(self.model_path(k)) and os.path.isfile(self.model_path(k) + ".json")]

    def synthesize(self, text, model_id, out_path):
        model = self.model_path(model_id)
        if not os.path.isfile(model):
            model = self.model_path(DEFAULT_MODEL)
        subprocess.run(
            [self.binary, "--model", model, "--output_file", out_path],
            input=text.encode("utf-8"), check=True, timeout=SYNTH_TIMEOUT,
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )


def cache_key(voice, text):
    return hashlib.sha256((voice + "\n" + text).encode("utf-8")).hexdigest()


def prune_cache(cache_dir, max_bytes):
    try:
        files = [os.path.join(cache_dir, f) for f in os.listdir(cache_dir) if f.endswith(".wav")]
    except OSError:
        return 0
    files.sort(key=lambda p: os.path.getmtime(p))
    total = sum(os.path.getsize(p) for p in files)
    removed = 0
    while files and total > max_bytes:
        p = files.pop(0)
        try:
            total -= os.path.getsize(p)
            os.remove(p)
            removed += 1
        except OSError:
            pass
    return removed


def make_handler(engine, token, cache_dir, max_inflight=MAX_INFLIGHT):
    gate = threading.BoundedSemaphore(max_inflight)
    os.makedirs(cache_dir, exist_ok=True)

    class Handler(BaseHTTPRequestHandler):
        server_version = "poetech-voice-lite/1"
        protocol_version = "HTTP/1.1"

        def log_message(self, *a):  # never log text or tokens
            pass

        def _json(self, code, obj):
            data = json.dumps(obj).encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(data)

        def _wav(self, path):
            with open(path, "rb") as fh:
                data = fh.read()
            self.send_response(200)
            self.send_header("Content-Type", "audio/wav")
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "private, max-age=86400")
            self.end_headers()
            self.wfile.write(data)

        def do_GET(self):
            path = self.path.split("?", 1)[0]
            if path not in HEALTH_PATHS and path not in VOICES_PATHS:
                return self._json(404, {"error": "not-found"})
            voices = engine.available_voices()
            if not voices:
                return self._json(503, {"ok": False, "error": "piper-not-installed"})
            if path in VOICES_PATHS:
                default = DEFAULT_MODEL if DEFAULT_MODEL in voices else voices[0]
                return self._json(200, {"ok": True, "voices": describe_voices(voices),
                                        "aliases": dict(ALIASES), "default": default})
            return self._json(200, {"ok": True, "voices": voices, "aliases": dict(ALIASES)})

        def do_POST(self):
            path = self.path.split("?", 1)[0]
            if path not in SPEAK_PATHS:
                return self._json(404, {"error": "not-found"})
            if not bearer_ok(self.headers.get("Authorization"), token):
                return self._json(401, {"error": "unauthorized"})
            try:
                length = int(self.headers.get("Content-Length") or 0)
            except ValueError:
                length = 0
            if length <= 0:
                return self._json(400, {"error": "body-required"})
            if length > MAX_BODY:
                return self._json(413, {"error": "body-too-large"})
            try:
                body = json.loads(self.rfile.read(length) or b"{}")
            except ValueError:
                return self._json(400, {"error": "bad-json"})
            text = " ".join(str(body.get("text") or "").split())
            requested = body.get("voice")
            voice = resolve_voice(requested if isinstance(requested, str) else "")
            if not text:
                return self._json(400, {"error": "text-required"})
            if len(text) > MAX_CHARS:
                return self._json(413, {"error": "text-too-long", "max": MAX_CHARS})
            installed = engine.available_voices()
            if not installed:
                return self._json(503, {"ok": False, "error": "piper-not-installed"})
            # A voice picked in the app but not downloaded yet reads in the
            # default rather than failing (the app lists only installed ones).
            if voice not in installed:
                voice = DEFAULT_MODEL if DEFAULT_MODEL in installed else installed[0]
            out = os.path.join(cache_dir, cache_key(voice, text) + ".wav")
            if os.path.isfile(out) and os.path.getsize(out) > 44:
                try:
                    os.utime(out, None)  # recently used stays in the cache
                except OSError:
                    pass
                return self._wav(out)
            if not gate.acquire(blocking=False):
                return self._json(503, {"error": "busy", "max_inflight": max_inflight})
            try:
                fd, tmp = tempfile.mkstemp(suffix=".wav", dir=cache_dir)
                os.close(fd)
                try:
                    engine.synthesize(text, voice, tmp)
                    if os.path.getsize(tmp) <= 44:
                        raise RuntimeError("empty clip")
                    os.replace(tmp, out)
                except Exception:  # noqa: BLE001 -- any synth failure is one honest 502
                    try:
                        os.remove(tmp)
                    except OSError:
                        pass
                    return self._json(502, {"error": "synthesis-failed"})
                prune_cache(cache_dir, CACHE_MAX_BYTES)
                return self._wav(out)
            finally:
                gate.release()

    return Handler


# --- Selftest ----------------------------------------------------------------
def _selftest():
    """Offline behavioural checks with a fake synthesizer. Exit 1 on any miss."""
    import time
    from http.client import HTTPConnection

    failures = []

    def check(cond, msg):
        print(("  PASS " if cond else "  FAIL ") + msg)
        if not cond:
            failures.append(msg)

    RIFF = b"RIFF" + b"\x00" * 40 + b"\x01\x02" * 50

    class FakeEngine:
        def __init__(self):
            self.calls = 0
            self.installed = True
            self.slow = 0.0
            self.voices_seen = []
            # Which models are "on disk" -- a subset, as on a NAS mid-download.
            self.models = list(VOICES)

        def available_voices(self):
            return [m for m in VOICES if m in self.models] if self.installed else []

        def synthesize(self, text, voice, out_path):
            self.calls += 1
            self.voices_seen.append(voice)
            if self.slow:
                time.sleep(self.slow)
            with open(out_path, "wb") as fh:
                fh.write(RIFF)

    tmpdir = tempfile.mkdtemp()
    eng = FakeEngine()
    srv = ThreadingHTTPServer(("127.0.0.1", 0), make_handler(eng, "sekret", tmpdir, max_inflight=1))
    port = srv.server_address[1]
    threading.Thread(target=srv.serve_forever, daemon=True).start()

    def req(method, path, body=None, auth="Bearer sekret"):
        c = HTTPConnection("127.0.0.1", port, timeout=10)
        headers = {"Content-Type": "application/json"}
        if auth:
            headers["Authorization"] = auth
        data = json.dumps(body).encode() if body is not None else None
        c.request(method, path, body=data, headers=headers)
        r = c.getresponse()
        out = (r.status, r.getheader("Content-Type"), r.read())
        c.close()
        return out

    s, _, _ = req("GET", "/health", auth=None)
    check(s == 200, "health 200 when piper + voices are installed")
    s, _, _ = req("GET", "/voice-lite/health", auth=None)
    check(s == 200, "prefixed health spelling answers too")
    eng.installed = False
    s, _, b = req("GET", "/health", auth=None)
    check(s == 503 and b"piper-not-installed" in b, "health is 503, never a false 200, when piper is missing")
    s, _, _ = req("POST", "/speak", {"text": "Hello."})
    check(s == 503, "speak refuses honestly when piper is missing")
    eng.installed = True

    s, _, _ = req("POST", "/speak", {"text": "Hello."}, auth=None)
    check(s == 401, "no bearer -> 401")
    s, _, _ = req("POST", "/speak", {"text": "Hello."}, auth="Bearer wrong")
    check(s == 401, "wrong bearer -> 401")
    s, _, _ = req("POST", "/speak", {"text": "   "})
    check(s == 400, "empty text -> 400")
    s, _, _ = req("POST", "/speak", {"text": "x" * (MAX_CHARS + 1)})
    check(s == 413, "over-long text -> 413")

    s, ctype, b = req("POST", "/speak", {"text": "In the beginning was the Word.", "voice": "female"})
    check(s == 200 and ctype == "audio/wav" and b[:4] == b"RIFF", "speak returns a WAV clip")
    check(eng.voices_seen[-1] == "en_US-amy-medium", "the 'female' alias still reaches its model")
    calls = eng.calls
    s, _, b = req("POST", "/voice-lite/speak", {"text": "In the beginning  was the Word.", "voice": "female"})
    check(s == 200 and eng.calls == calls, "the same paragraph is served from the cache, not re-synthesized")
    req("POST", "/speak", {"text": "Unknown voice.", "voice": "robot"})
    check(eng.voices_seen[-1] == DEFAULT_MODEL, "an unknown voice falls back to the default")
    req("POST", "/speak", {"text": "Male alias.", "voice": "male"})
    check(eng.voices_seen[-1] == "en_US-ryan-medium", "the 'male' alias still reaches its model")

    # EVERY VOICE IS CHOOSABLE (DR-0653): a model named by id is the one used.
    req("POST", "/speak", {"text": "A British reader.", "voice": "en_GB-alan-medium"})
    check(eng.voices_seen[-1] == "en_GB-alan-medium", "a voice picked by model id reaches the synthesizer")
    s, _, b = req("GET", "/voices", auth=None)
    listed = json.loads(b) if s == 200 else {}
    ids = [v.get("id") for v in listed.get("voices", [])]
    check(s == 200 and ids == list(VOICES), "/voices lists every installed model, in catalog order")
    check(all(v.get("label") and v.get("note") and v.get("gender") for v in listed.get("voices", [])),
          "every listed voice carries a label, a gender and a one-line note")
    high = [v for v in listed.get("voices", []) if v.get("quality") == "high"]
    check(bool(high) and all("slow" in v["note"] for v in high), "a high model is labelled as slower, not hidden")
    check(listed.get("aliases") == ALIASES and listed.get("default") == DEFAULT_MODEL, "/voices reports the aliases and the default")
    s, _, _ = req("GET", "/voice-lite/voices", auth=None)
    check(s == 200, "prefixed /voices spelling answers too")

    # Mid-download: only what is really on disk is listed, and a pick of a
    # model not there yet reads in the default instead of failing.
    eng.models = ["en_US-ryan-medium", "en_US-joe-medium"]
    s, _, b = req("GET", "/voices", auth=None)
    ids = [v["id"] for v in json.loads(b)["voices"]] if s == 200 else []
    check(ids == ["en_US-ryan-medium", "en_US-joe-medium"], "/voices never lists a model that is not on disk")
    s, _, _ = req("POST", "/speak", {"text": "Not downloaded yet.", "voice": "en_GB-alan-medium"})
    check(s == 200 and eng.voices_seen[-1] == DEFAULT_MODEL, "a model not on disk yet reads in the default")
    eng.models = ["en_US-joe-medium"]
    s, _, b = req("GET", "/voices", auth=None)
    check(s == 200 and json.loads(b).get("default") == "en_US-joe-medium", "the default is one that is really installed")
    eng.models = list(VOICES)
    eng.installed = False
    s, _, _ = req("GET", "/voices", auth=None)
    check(s == 503, "/voices is 503, never an empty 200, when piper is missing")
    eng.installed = True

    # The real engine counts a model only when its config sits beside it.
    home = tempfile.mkdtemp()
    os.makedirs(os.path.join(home, "piper"))
    os.makedirs(os.path.join(home, "voices"))
    binp = os.path.join(home, "piper", "piper")
    with open(binp, "w") as fh:
        fh.write("#!/bin/sh\n")
    os.chmod(binp, 0o755)
    real = Piper(home)
    for m in ("en_US-ryan-medium", "en_GB-alan-medium"):
        with open(real.model_path(m), "wb") as fh:
            fh.write(b"x")
    with open(real.model_path("en_US-ryan-medium") + ".json", "w") as fh:
        fh.write("{}")
    check(real.available_voices() == ["en_US-ryan-medium"], "a model without its .onnx.json config is not counted as installed")

    # Busy: one slow synthesis holds the only slot; a second is refused at once.
    eng.slow = 1.0
    results = {}

    def slow_call():
        results["a"] = req("POST", "/speak", {"text": "A slow paragraph one."})[0]

    t = threading.Thread(target=slow_call)
    t.start()
    time.sleep(0.3)
    started = time.time()
    s2 = req("POST", "/speak", {"text": "A different paragraph two."})[0]
    check(s2 == 503 and time.time() - started < 0.8, "a second synthesis past the cap gets 503 immediately")
    t.join()
    check(results.get("a") == 200, "the in-flight synthesis still completes")
    eng.slow = 0.0

    # Cache pruning keeps the newest.
    d = tempfile.mkdtemp()
    for i in range(5):
        p = os.path.join(d, f"{i}.wav")
        with open(p, "wb") as fh:
            fh.write(b"0" * 100)
        os.utime(p, (1000 + i, 1000 + i))
    removed = prune_cache(d, 250)
    left = sorted(os.listdir(d))
    check(removed == 3 and left == ["3.wav", "4.wav"], "cache pruning removes the oldest clips first")

    s, _, _ = req("GET", "/nope", auth=None)
    check(s == 404, "unknown path -> 404")
    srv.shutdown()
    print("voice-lite selftest: " + ("OK" if not failures else f"{len(failures)} FAILURE(S)"))
    return 1 if failures else 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=8772)
    ap.add_argument("--home", default=os.environ.get("VOICE_LITE_HOME", HOME_DEFAULT))
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args()
    if a.selftest:
        sys.exit(_selftest())
    token = expected_token()
    if not token:
        print("voice-lite: no family bearer token -- refusing to start an unlocked door", file=sys.stderr)
        sys.exit(2)
    engine = Piper(a.home)
    srv = ThreadingHTTPServer(("127.0.0.1", a.port), make_handler(engine, token, os.path.join(a.home, "cache")))
    print(f"voice-lite on 127.0.0.1:{a.port}, voices: {engine.available_voices()}")
    srv.serve_forever()


if __name__ == "__main__":
    main()

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
#   GET  /health, /voice-lite/health -> 200 {"ok":true,"voices":[..]} only when
#        the piper binary and at least one voice model are really on disk;
#        503 otherwise. Open (says nothing worth guarding).
#   POST /speak,  /voice-lite/speak  -> Authorization: Bearer <family token>.
#        Body {"text": "...", "voice": "male"|"female", "format": "wav"|"opus",
#              "speed": 0.5..2.0 (the voice SPEAKS at that pace; see SPEED)}.
#        Returns audio/wav, or audio/ogg; codecs=opus when "opus" was asked
#        and ffmpeg with libopus is on this box (DR-0747; health lists
#        "formats"). 401 bad/missing bearer, 400 empty, 413 too long, 503 busy.
#
# Cached by sha256(voice + text): a paragraph read twice is synthesized once.
# A clip at a pace other than 1.0 is cached under its own key (voice + speed +
# text); the 1.0 key is unchanged so every clip already saved still answers.
#
# SPEED (Darrell 2026-10-07: "the voice mumbles at times when on faster
# speaking especially"). The app used to speed a clip up in the browser --
# playbackRate with pitch preserved -- which is a time-stretch, and at 2x and
# beyond a time-stretch smears consonants into exactly the mumble he hears.
# Piper can simply SPEAK faster: --length_scale is the duration multiplier of
# the voice itself (0.5 = twice the pace), and the words stay words. The app
# asks for its pace here (clamped to SPEED_MIN..SPEED_MAX, where Piper is still
# intelligible) and only stretches the small remainder itself.
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
import shutil
import subprocess
import sys
import tempfile
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

TOKEN_FILE_DEFAULT = "/volume1/PoeTech/secrets/chat-bridge-token.txt"

# THE ONLY ORIGIN THE VOICE ANSWERS CROSS-ORIGIN. Module level so the selftest
# pins the value the running Handler is built from, not a copy of it. Never
# "*": this road carries a bearer. See the CORS block on Handler for why it
# exists at all.
CORS_ALLOWED_ORIGINS = ("https://poetech.us",)
HOME_DEFAULT = "/volume1/PoeTech/voice-lite"
MAX_INFLIGHT = int(os.environ.get("VOICE_LITE_MAX_INFLIGHT", "2"))
MAX_BODY = 64 * 1024
MAX_CHARS = int(os.environ.get("VOICE_LITE_MAX_CHARS", "1500"))
SYNTH_TIMEOUT = float(os.environ.get("VOICE_LITE_TIMEOUT", "90"))
CACHE_MAX_BYTES = int(os.environ.get("VOICE_LITE_CACHE_BYTES", str(400 * 1024 * 1024)))

# The voices the installer downloads, by the word the app sends. A stand-in for
# a man reads in a man's voice (DR-0138); anything unknown gets the default.
VOICES = {
    "male": "en_US-ryan-medium",
    "female": "en_US-amy-medium",
}
DEFAULT_VOICE = "male"

SPEED_MIN = 0.5
SPEED_MAX = 2.0


def code_sha(path=None):
    """The sha of the file actually serving: /health names it so the outside
    witness can see which code the NAS runs (2026-10-07), not infer it."""
    try:
        with open(path or os.path.abspath(__file__), "rb") as fh:
            return hashlib.sha256(fh.read()).hexdigest()[:16]
    except OSError:
        return "unknown"


CODE_SHA = code_sha()


def clamp_speed(value):
    """The pace the voice is asked to speak at: a number in SPEED_MIN..SPEED_MAX, else 1.0."""
    try:
        v = float(value)
    except (TypeError, ValueError):
        return 1.0
    if v != v or v <= 0:  # NaN or nonsense
        return 1.0
    return round(min(SPEED_MAX, max(SPEED_MIN, v)), 3)


def length_scale_for(speed):
    """Piper's --length_scale is a DURATION multiplier: 2x pace = 0.5."""
    return round(1.0 / clamp_speed(speed), 4)


SPEAK_PATHS = {"/speak", "/voice-lite/speak"}
HEALTH_PATHS = {"/health", "/voice-lite/health"}


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

    def model_path(self, voice):
        return os.path.join(self.home, "voices", VOICES.get(voice, VOICES[DEFAULT_VOICE]) + ".onnx")

    def available_voices(self):
        if not (os.path.isfile(self.binary) and os.access(self.binary, os.X_OK)):
            return []
        return [k for k in VOICES if os.path.isfile(self.model_path(k))]

    def synthesize(self, text, voice, out_path, speed=1.0):
        model = self.model_path(voice)
        if not os.path.isfile(model):
            model = self.model_path(DEFAULT_VOICE)
        args = [self.binary, "--model", model, "--output_file", out_path]
        if clamp_speed(speed) != 1.0:
            args += ["--length_scale", str(length_scale_for(speed))]
        subprocess.run(
            args,
            input=text.encode("utf-8"), check=True, timeout=SYNTH_TIMEOUT,
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )


def cache_key(voice, text, speed=1.0):
    sp = clamp_speed(speed)
    head = voice if sp == 1.0 else "%s@%s" % (voice, sp)
    return hashlib.sha256((head + "\n" + text).encode("utf-8")).hexdigest()


# LIGHTER CLIPS (DR-0747; Darrell 2026-10-02, "Download every lesson" reading
# 31.3 GB with the voice: "Huge amount of data to download... can we make them
# lighter?"). A Piper clip is PCM WAV at 44,100 bytes a second. The same words
# in Opus at 24 kbit/s are 3,000 bytes a second: a fourteenth of the size, and
# a phone plays it like any music. When ffmpeg with libopus is on this box the
# server encodes each clip once and keeps both shapes in the cache; a device
# that asks for "opus" gets Ogg Opus, any other asks (or a box without
# ffmpeg) get WAV, and the Content-Type says which came. Never a refusal over
# the shape: the words always come.
OPUS_ARGS = ["-ac", "1", "-c:a", "libopus", "-b:a", "24k", "-vbr", "on", "-application", "audio", "-f", "ogg"]
FORMATS = ("wav", "opus")
AUDIO_TYPES = {"wav": "audio/wav", "opus": "audio/ogg; codecs=opus"}
FFMPEG_CANDIDATES = (
    "/usr/bin/ffmpeg", "/usr/local/bin/ffmpeg",
    "/var/packages/ffmpeg7/target/bin/ffmpeg", "/var/packages/ffmpeg6/target/bin/ffmpeg",
    "/var/packages/VideoStation/target/bin/ffmpeg",
)


def find_ffmpeg(home, env=None):
    """The first ffmpeg on this box whose encoders include libopus, else None."""
    env = os.environ if env is None else env
    candidates = [env.get("VOICE_LITE_FFMPEG"), os.path.join(home, "ffmpeg", "ffmpeg"), shutil.which("ffmpeg")]
    candidates.extend(FFMPEG_CANDIDATES)
    for c in candidates:
        if not c or not (os.path.isfile(c) and os.access(c, os.X_OK)):
            continue
        try:
            out = subprocess.run([c, "-hide_banner", "-encoders"], capture_output=True, timeout=20, check=False)
        except (OSError, subprocess.SubprocessError):
            continue
        if b"libopus" in (out.stdout or b""):
            return c
    return None


class OpusEncoder:
    """ffmpeg: one WAV clip -> one Ogg Opus clip, 24 kbit/s mono."""

    def __init__(self, binary):
        self.binary = binary

    def encode(self, wav_path, out_path):
        subprocess.run(
            [self.binary, "-y", "-loglevel", "error", "-i", wav_path] + OPUS_ARGS + [out_path],
            check=True, timeout=SYNTH_TIMEOUT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )


def prune_cache(cache_dir, max_bytes):
    try:
        files = [os.path.join(cache_dir, f) for f in os.listdir(cache_dir) if f.endswith((".wav", ".opus"))]
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


def make_handler(engine, token, cache_dir, max_inflight=MAX_INFLIGHT, encoder=None):
    gate = threading.BoundedSemaphore(max_inflight)
    os.makedirs(cache_dir, exist_ok=True)
    formats = ["wav", "opus"] if encoder else ["wav"]

    class Handler(BaseHTTPRequestHandler):
        server_version = "poetech-voice-lite/1"
        protocol_version = "HTTP/1.1"

        def log_message(self, *a):  # never log text or tokens
            pass

        # -- CORS, so the reading voice survives a dead Pages Function -------
        # MEASURED 2026-10-09. Every Cloudflare Pages Function on poetech.us
        # stopped being invoked. Darrell: "the voice reader doesn't work on the
        # Firestick anymore." All three voice roads the app knows are Pages
        # Functions -- /api/voice-speak, /voice and /voice-lite/speak -- so the
        # transport was gone. A phone can fall back to the browser's own
        # speech; a Fire TV cannot, because Silk exposes speechSynthesis and
        # does not deliver it (see TTSControl.jsx). The Firestick had no second
        # road, which is exactly why it is the device that went silent.
        #
        # Pointing the app straight at the Funnel is the remedy, and it needs
        # CORS the Funnel does not add: measured, /voice-lite answered
        # preflight 501 with allow-origin none. Injected at end_headers because
        # every response path here funnels through it -- json and audio alike.
        #
        # NEVER "*": this road carries a bearer. One origin is echoed, anything
        # else gets nothing, and Vary keeps a cache from crossing them.
        ALLOWED_ORIGINS = CORS_ALLOWED_ORIGINS

        def _cors_origin(self):
            o = self.headers.get("Origin")
            return o if o in self.ALLOWED_ORIGINS else None

        def end_headers(self):
            o = self._cors_origin()
            if o:
                self.send_header("Access-Control-Allow-Origin", o)
                self.send_header("Vary", "Origin")
                self.send_header("Access-Control-Expose-Headers",
                                 "Content-Length, Content-Type, Accept-Ranges")
            BaseHTTPRequestHandler.end_headers(self)

        def do_OPTIONS(self):
            if not self._cors_origin():
                self.send_response(403)
                self.send_header("Content-Length", "0")
                self.end_headers()
                return
            self.send_response(204)
            self.send_header("Access-Control-Allow-Methods", "GET, HEAD, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Authorization, Content-Type")
            self.send_header("Access-Control-Max-Age", "600")
            self.send_header("Content-Length", "0")
            self.end_headers()

        def _json(self, code, obj):
            data = json.dumps(obj).encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(data)

        def _audio(self, path, fmt="wav"):
            with open(path, "rb") as fh:
                data = fh.read()
            self.send_response(200)
            self.send_header("Content-Type", AUDIO_TYPES.get(fmt, AUDIO_TYPES["wav"]))
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "private, max-age=86400")
            self.end_headers()
            self.wfile.write(data)

        def _wav(self, path):
            return self._audio(path, "wav")

        def _opus_or_wav(self, wav_path, key):
            """Serve the Opus shape of a cached WAV, encoding it once; WAV when it cannot be made."""
            out = os.path.join(cache_dir, key + ".opus")
            if os.path.isfile(out) and os.path.getsize(out) > 0:
                try:
                    os.utime(out, None)
                except OSError:
                    pass
                return self._audio(out, "opus")
            fd, tmp = tempfile.mkstemp(suffix=".opus", dir=cache_dir)
            os.close(fd)
            try:
                encoder.encode(wav_path, tmp)
                if os.path.getsize(tmp) <= 0:
                    raise RuntimeError("empty clip")
                os.replace(tmp, out)
            except Exception:  # noqa: BLE001 -- a failed encode is a WAV, never a refusal
                try:
                    os.remove(tmp)
                except OSError:
                    pass
                return self._wav(wav_path)
            return self._audio(out, "opus")

        def do_GET(self):
            path = self.path.split("?", 1)[0]
            if path not in HEALTH_PATHS:
                return self._json(404, {"error": "not-found"})
            voices = engine.available_voices()
            if not voices:
                return self._json(503, {"ok": False, "error": "piper-not-installed"})
            return self._json(200, {"ok": True, "voices": voices, "formats": formats, "code": CODE_SHA})

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
            voice = body.get("voice") if body.get("voice") in VOICES else DEFAULT_VOICE
            # The shape asked for: "opus" is honoured only when this box can
            # make it; anything else, or no encoder, is WAV as before.
            want = body.get("format") if body.get("format") in FORMATS else "wav"
            if want == "opus" and not encoder:
                want = "wav"
            speed = clamp_speed(body.get("speed", 1.0))
            if not text:
                return self._json(400, {"error": "text-required"})
            if len(text) > MAX_CHARS:
                return self._json(413, {"error": "text-too-long", "max": MAX_CHARS})
            if not engine.available_voices():
                return self._json(503, {"ok": False, "error": "piper-not-installed"})
            key = cache_key(voice, text, speed)
            out = os.path.join(cache_dir, key + ".wav")
            if os.path.isfile(out) and os.path.getsize(out) > 44:
                try:
                    os.utime(out, None)  # recently used stays in the cache
                except OSError:
                    pass
                return self._opus_or_wav(out, key) if want == "opus" else self._wav(out)
            if not gate.acquire(blocking=False):
                return self._json(503, {"error": "busy", "max_inflight": max_inflight})
            try:
                fd, tmp = tempfile.mkstemp(suffix=".wav", dir=cache_dir)
                os.close(fd)
                try:
                    engine.synthesize(text, voice, tmp, speed)
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
                return self._opus_or_wav(out, key) if want == "opus" else self._wav(out)
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
            self.speeds_seen = []

        def available_voices(self):
            return list(VOICES) if self.installed else []

        def synthesize(self, text, voice, out_path, speed=1.0):
            self.calls += 1
            self.voices_seen.append(voice)
            self.speeds_seen.append(speed)
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

    s, _, b = req("GET", "/health", auth=None)
    check(s == 200, "health 200 when piper + voices are installed")
    check(json.loads(b).get("code") == code_sha() and len(code_sha()) == 16, "health names the sha of the code that is serving")
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
    check(eng.voices_seen[-1] == "female", "the requested voice reaches the synthesizer")
    calls = eng.calls
    s, _, b = req("POST", "/voice-lite/speak", {"text": "In the beginning  was the Word.", "voice": "female"})
    check(s == 200 and eng.calls == calls, "the same paragraph is served from the cache, not re-synthesized")
    req("POST", "/speak", {"text": "Unknown voice.", "voice": "robot"})
    check(eng.voices_seen[-1] == DEFAULT_VOICE, "an unknown voice falls back to the default")

    # SPEED: the voice speaks at the asked pace; a pace is its own clip in the
    # cache; the 1.0 key is the old key; nonsense and out-of-range are clamped.
    s, _, _ = req("POST", "/speak", {"text": "Quickly now.", "speed": 2})
    check(s == 200 and eng.speeds_seen[-1] == 2.0, "the asked pace reaches the synthesizer")
    calls = eng.calls
    s, _, _ = req("POST", "/speak", {"text": "Quickly now."})
    check(s == 200 and eng.calls == calls + 1 and eng.speeds_seen[-1] == 1.0, "the same words at normal pace are a different clip, not the fast one")
    s, _, _ = req("POST", "/speak", {"text": "Quickly now.", "speed": 2.0})
    check(s == 200 and eng.calls == calls + 1, "the fast clip is served from the cache the second time")
    check(cache_key("male", "x") == hashlib.sha256(b"male\nx").hexdigest(), "the 1.0 key is the old key: every saved clip still answers")
    check(cache_key("male", "x", 1.5) != cache_key("male", "x"), "a pace other than 1.0 has its own key")
    check(clamp_speed(9) == SPEED_MAX and clamp_speed(0.1) == SPEED_MIN and clamp_speed("fast") == 1.0 and clamp_speed(None) == 1.0, "speed is clamped to what Piper says clearly; nonsense is normal pace")
    check(length_scale_for(2.0) == 0.5 and length_scale_for(0.5) == 2.0 and length_scale_for(1.0) == 1.0, "length_scale is the inverse of the pace")
    req("POST", "/speak", {"text": "Clamped please.", "speed": 50})
    check(eng.speeds_seen[-1] == SPEED_MAX, "an out-of-range pace is clamped before it reaches the synthesizer")

    # LIGHTER CLIPS (DR-0747): without an encoder, "opus" is answered in WAV and
    # health lists wav alone; with one, the same words come once as Ogg Opus,
    # the second time from the cache, and a failed encode is a WAV, never a 5xx.
    s, ctype, b = req("POST", "/speak", {"text": "Lighter please.", "format": "opus"})
    check(s == 200 and ctype == "audio/wav" and b[:4] == b"RIFF", "asked for opus with no encoder on the box: WAV comes, honestly typed")
    s, _, b = req("GET", "/health", auth=None)
    check(s == 200 and json.loads(b).get("formats") == ["wav"], "health lists wav alone without an encoder")

    class FakeEncoder:
        def __init__(self):
            self.calls = 0
            self.fail = False

        def encode(self, wav_path, out_path):
            self.calls += 1
            if self.fail:
                raise RuntimeError("no libopus")
            with open(out_path, "wb") as fh:
                fh.write(b"OggS" + b"\x00" * 40)

    enc = FakeEncoder()
    tmpdir2 = tempfile.mkdtemp()
    srv2 = ThreadingHTTPServer(("127.0.0.1", 0), make_handler(eng, "sekret", tmpdir2, max_inflight=1, encoder=enc))
    port2 = srv2.server_address[1]
    threading.Thread(target=srv2.serve_forever, daemon=True).start()

    def req2(method, path, body=None, auth="Bearer sekret"):
        c = HTTPConnection("127.0.0.1", port2, timeout=10)
        headers = {"Content-Type": "application/json"}
        if auth:
            headers["Authorization"] = auth
        data = json.dumps(body).encode() if body is not None else None
        c.request(method, path, body=data, headers=headers)
        r = c.getresponse()
        out = (r.status, r.getheader("Content-Type"), r.read())
        c.close()
        return out

    s, _, b = req2("GET", "/health", auth=None)
    check(s == 200 and json.loads(b).get("formats") == ["wav", "opus"], "health lists opus when an encoder is on the box")
    s, ctype, b = req2("POST", "/speak", {"text": "Lighter please.", "format": "opus"})
    check(s == 200 and ctype == "audio/ogg; codecs=opus" and b[:4] == b"OggS" and enc.calls == 1, "asked for opus with an encoder: an Ogg Opus clip, encoded once")
    s, ctype, b = req2("POST", "/speak", {"text": "Lighter  please.", "format": "opus"})
    check(s == 200 and ctype == "audio/ogg; codecs=opus" and enc.calls == 1, "the same words again come from the cache, not re-encoded")
    s, ctype, b = req2("POST", "/speak", {"text": "Lighter please."})
    check(s == 200 and ctype == "audio/wav" and b[:4] == b"RIFF", "the WAV shape of the same words is still served from the same synthesis")
    kept = sorted(f.rsplit(".", 1)[1] for f in os.listdir(tmpdir2) if not f.startswith("."))
    check(kept == ["opus", "wav"], "both shapes of one clip share the cache under one key")
    enc.fail = True
    s, ctype, b = req2("POST", "/speak", {"text": "A fresh sentence.", "format": "opus"})
    check(s == 200 and ctype == "audio/wav" and b[:4] == b"RIFF", "a failed encode answers in WAV, never a refusal")
    srv2.shutdown()

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
        p = os.path.join(d, f"{i}.wav" if i != 2 else f"{i}.opus")
        with open(p, "wb") as fh:
            fh.write(b"0" * 100)
        os.utime(p, (1000 + i, 1000 + i))
    removed = prune_cache(d, 250)
    left = sorted(os.listdir(d))
    check(removed == 3 and left == ["3.wav", "4.wav"], "cache pruning removes the oldest clips first, in either shape")

    s, _, _ = req("GET", "/nope", auth=None)
    check(s == 404, "unknown path -> 404")

    # --- CORS: the reading voice survives a dead Pages Function -------------
    # 2026-10-09. Every Pages Function on poetech.us stopped being invoked and
    # the Firestick went silent, because Silk exposes speechSynthesis without
    # delivering it, so a Fire TV has no local fallback and these roads were
    # its only voice. Pointing the app at the Funnel needs CORS the Funnel does
    # not add (measured: /voice-lite preflight 501, allow-origin none).
    class _H:
        """The Handler's CORS decision, exercised without a socket."""
        ALLOWED_ORIGINS = ("https://poetech.us",)

        def __init__(self, origin):
            self._origin = origin

        @property
        def headers(self):
            return {"Origin": self._origin} if self._origin else {}

        def _cors_origin(self):
            o = self.headers.get("Origin")
            return o if o in self.ALLOWED_ORIGINS else None

    check(_H("https://poetech.us")._cors_origin() == "https://poetech.us",
          "the app's own origin is allowed")
    check(_H(None)._cors_origin() is None,
          "no Origin -> no CORS header (the same-origin path is unchanged)")
    check(_H("https://evil.example")._cors_origin() is None,
          "CATCHES a stranger's origin: refused, not echoed")
    check(_H("*")._cors_origin() is None,
          "CATCHES a wildcard origin: never allowed on a bearer road")
    check(_H("https://poetech.us.evil.example")._cors_origin() is None,
          "CATCHES a lookalike origin that merely starts with ours")
    check(_H("http://poetech.us")._cors_origin() is None,
          "CATCHES plain http: only the https origin is allowed")
    check("*" not in CORS_ALLOWED_ORIGINS,
          "the LIVE allowlist the Handler is built from holds no wildcard")
    check(tuple(CORS_ALLOWED_ORIGINS) == _H.ALLOWED_ORIGINS,
          "the LIVE allowlist is exactly what these checks pin")

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
    ffmpeg = find_ffmpeg(a.home)
    encoder = OpusEncoder(ffmpeg) if ffmpeg else None
    srv = ThreadingHTTPServer(("127.0.0.1", a.port), make_handler(engine, token, os.path.join(a.home, "cache"), encoder=encoder))
    print(f"voice-lite on 127.0.0.1:{a.port}, voices: {engine.available_voices()}, opus: {ffmpeg or 'no ffmpeg with libopus (WAV only)'}")
    srv.serve_forever()


if __name__ == "__main__":
    main()

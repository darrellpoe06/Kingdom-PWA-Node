#!/usr/bin/env python3
# =============================================================================
# nas_clone_server -- "My voice" made on the NAS's own CPU, so it never waits on
# the tower or on a key (DR-1538)
# =============================================================================
# Darrell 2026-11-18, on the personal voice still blocked on the tower's
# password and an expired tailnet key: fix it so we don't need anything.
#
# The XTTS studio (infra/voice-studio) clones on the 4070 tower, and the tower
# has never run it: no road from this house reaches the tower without a
# password only Darrell holds (DR-0721 Decision 5). DR-1360 set the direction:
# the NAS starts every road, and a system the house does not control is support,
# never the only way. So the NAS makes the voice itself:
#
#   1. Piper (already on this box for voice-lite) reads the words in the house
#      man's voice (en_US-ryan-medium);
#   2. OpenVoice V2's tone-color converter (myshell-ai/OpenVoice, MIT, verified
#      upstream 2026-11-18) moves that reading onto the timbre of the listener's
#      own recording, which rides every request as reference_audio.
#
# WHAT THIS IS NOT, said plainly: the words keep Piper's pacing and the voice
# takes the listener's color. It is not the XTTS clone. When the tower answers,
# the forwarder sends to the tower first, and this is the fallback.
#
# Contract (bound to 127.0.0.1 only; the forwarder in front holds the family key):
#   GET  /health -> 200 {"ok":true,"engine":"nas-clone",...} when Piper, ffmpeg,
#                   the converter and its weights are all on disk and loaded;
#                   503 {"ok":false,"reason":...} otherwise. Open.
#   POST /speak  -> {"text","reference_audio":"data:audio/...;base64,...","speed"}
#                   -> audio/wav (header X-Voice-Engine: nas-clone).
#                   400 text-required / reference-required / reference-unreadable,
#                   413 too long, 503 busy or not ready, 500 synthesis-failed.
#
# Brakes (request-driven, not the timer class; a door still has bounds):
#   * ONE synthesis at a time (a CPU box); a second waits up to WAIT_S, then 503.
#   * MAX_CHARS per request (the reader sends pieces of ~200 characters).
#   * SYNTH_TIMEOUT for Piper and ffmpeg; the converter runs under the same lock.
#   * CACHE_MAX_BYTES of clips on disk, oldest pruned first; one embedding per
#     recording, kept only on this box.
#
# Run:  python nas_clone_server.py --port 8773 --home /volume1/PoeTech/voice-clone
#       python3 nas_clone_server.py --selftest   (stdlib only, no torch needed)
# Installed and kept running by infra/nas-voice-clone/install.sh via services-sync.
# =============================================================================
import argparse
import base64
import binascii
import hashlib
import io
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import threading
import wave
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HOME_DEFAULT = "/volume1/PoeTech/voice-clone"
LITE_HOME_DEFAULT = "/volume1/PoeTech/voice-lite"
BASE_VOICE = "en_US-ryan-medium"
MAX_BODY = 16 * 1024 * 1024
MAX_CHARS = int(os.environ.get("VOICE_CLONE_MAX_CHARS", "600"))
MAX_REF_SECONDS = 30
SYNTH_TIMEOUT = float(os.environ.get("VOICE_CLONE_TIMEOUT", "120"))
WAIT_S = float(os.environ.get("VOICE_CLONE_WAIT", "90"))
CACHE_MAX_BYTES = int(os.environ.get("VOICE_CLONE_CACHE_BYTES", str(300 * 1024 * 1024)))
SPEED_MIN, SPEED_MAX = 0.5, 2.0
TAU = float(os.environ.get("VOICE_CLONE_TAU", "0.3"))

# The words Piper speaks once, in the house voice, so the converter learns the
# color it is moving AWAY from. Plain public-domain sentences of ordinary sounds.
BASE_SAMPLE_TEXT = (
    "In the beginning was the Word, and the Word was with God, and the Word was God. "
    "The same was in the beginning with God. All things were made by him. "
    "Thy word is a lamp unto my feet, and a light unto my path. "
    "Trust in the Lord with all thine heart, and lean not unto thine own understanding."
)

DATA_URI = re.compile(r"^data:([a-z0-9.+/-]+)?(?:;[a-z0-9=.+-]+)*;base64,(.*)$", re.I | re.S)


# --- Pure pieces (the selftest pins these without torch) ----------------------
def decode_reference(value):
    """A data URI or bare base64 -> (bytes, mime). Raises ValueError with a tag."""
    if not isinstance(value, str) or not value.strip():
        raise ValueError("reference-required")
    s = value.strip()
    m = DATA_URI.match(s)
    mime = ""
    if m:
        mime = (m.group(1) or "").lower()
        s = m.group(2)
    try:
        raw = base64.b64decode(re.sub(r"\s+", "", s), validate=True)
    except (binascii.Error, ValueError):
        raise ValueError("reference-unreadable")
    if len(raw) < 1024:
        raise ValueError("reference-unreadable")
    return raw, mime


def clamp_speed(value):
    try:
        v = float(value)
    except (TypeError, ValueError):
        return 1.0
    if v != v or v <= 0:
        return 1.0
    return max(SPEED_MIN, min(SPEED_MAX, v))


def clip_key(ref_sha, speed, text):
    return hashlib.sha256(("%s|%.2f|%s" % (ref_sha, speed, text)).encode("utf-8")).hexdigest()


def parse_request(body):
    """Validate a /speak body -> dict(text, ref, mime, ref_sha, speed). ValueError(tag) on refusal."""
    try:
        req = json.loads(body.decode("utf-8"))
    except (UnicodeDecodeError, ValueError):
        raise ValueError("body-not-json")
    if not isinstance(req, dict):
        raise ValueError("body-not-json")
    text = " ".join(str(req.get("text") or "").split())
    if not text:
        raise ValueError("text-required")
    if len(text) > MAX_CHARS:
        raise ValueError("text-too-long")
    ref, mime = decode_reference(req.get("reference_audio"))
    return {
        "text": text,
        "ref": ref,
        "mime": mime,
        "ref_sha": hashlib.sha256(ref).hexdigest(),
        "speed": clamp_speed(req.get("speed", 1.0)),
    }


def wav_seconds(data):
    try:
        with wave.open(io.BytesIO(data), "rb") as w:
            return w.getnframes() / float(w.getframerate() or 1)
    except (wave.Error, EOFError):
        return 0.0


def prune_cache(folder, max_bytes):
    try:
        files = [os.path.join(folder, f) for f in os.listdir(folder) if f.endswith(".wav")]
    except OSError:
        return 0
    files.sort(key=lambda p: os.path.getmtime(p))
    total = sum(os.path.getsize(p) for p in files)
    removed = 0
    while files and total > max_bytes:
        p = files.pop(0)
        total -= os.path.getsize(p)
        try:
            os.remove(p)
            removed += 1
        except OSError:
            pass
    return removed


def find_tool(candidates):
    for c in candidates:
        if c and os.path.isfile(c) and os.access(c, os.X_OK):
            return c
    return ""


# --- The engine (torch is imported only here, only when it is real) -----------
class Engine(object):
    """OpenVoice V2's converter, loaded from <home>/models/converter/{config.json,checkpoint.pth}."""

    def __init__(self, home, threads):
        import torch  # noqa: WPS433 -- deliberately lazy: the selftest has no torch
        from openvoice import utils
        from openvoice.mel_processing import spectrogram_torch
        from openvoice.models import SynthesizerTrn

        torch.set_num_threads(max(1, threads))
        cfg = os.path.join(home, "models", "converter", "config.json")
        ckpt = os.path.join(home, "models", "converter", "checkpoint.pth")
        hps = utils.get_hparams_from_file(cfg)
        model = SynthesizerTrn(
            len(getattr(hps, "symbols", [])),
            hps.data.filter_length // 2 + 1,
            n_speakers=hps.data.n_speakers,
            **hps.model,
        )
        state = torch.load(ckpt, map_location="cpu")
        model.load_state_dict(state["model"], strict=False)
        model.eval()
        self.torch = torch
        self.model = model
        self.hps = hps
        self.spec = spectrogram_torch

    def _spec(self, wav_path):
        import librosa  # noqa: WPS433

        audio, _ = librosa.load(wav_path, sr=self.hps.data.sampling_rate)
        y = self.torch.FloatTensor(audio).unsqueeze(0)
        d = self.hps.data
        return self.spec(y, d.filter_length, d.sampling_rate, d.hop_length, d.win_length, center=False)

    def embedding(self, wav_path):
        with self.torch.no_grad():
            spec = self._spec(wav_path)
            return self.model.ref_enc(spec.transpose(1, 2)).unsqueeze(-1)

    def convert(self, wav_path, src_se, tgt_se, tau=TAU):
        """Return 16-bit mono WAV bytes in the target's color."""
        with self.torch.no_grad():
            spec = self._spec(wav_path)
            lengths = self.torch.LongTensor([spec.size(-1)])
            audio = self.model.voice_conversion(spec, lengths, sid_src=src_se, sid_tgt=tgt_se, tau=tau)[0][0, 0]
            pcm = (audio.clamp(-1, 1) * 32767).short().numpy().tobytes()
        buf = io.BytesIO()
        with wave.open(buf, "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(int(self.hps.data.sampling_rate))
            w.writeframes(pcm)
        return buf.getvalue()

    def save(self, tensor, path):
        self.torch.save(tensor, path)

    def load(self, path):
        return self.torch.load(path, map_location="cpu")


class Clone(object):
    """Everything around the engine: Piper, ffmpeg, embeddings, the clip cache, the lock."""

    def __init__(self, home, lite_home, engine=None, piper="", ffmpeg="", voice_model=""):
        self.home = home
        self.engine = engine
        self.piper = piper
        self.ffmpeg = ffmpeg
        self.voice_model = voice_model
        self.lock = threading.Lock()
        self.reason = ""
        for sub in ("se", "cache", "tmp"):
            os.makedirs(os.path.join(home, sub), exist_ok=True)

    def ready(self):
        if not self.piper:
            return False, "piper is not on this box yet (the voice-lite install puts it there)"
        if not self.voice_model:
            return False, "the house voice %s is not on this box yet" % BASE_VOICE
        if not self.ffmpeg:
            return False, "ffmpeg is not on this box yet (needed to read a phone's recording)"
        if self.engine is None:
            return False, self.reason or "the converter has not loaded"
        return True, ""

    def _run(self, args, stdin=None):
        p = subprocess.run(args, input=stdin, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=SYNTH_TIMEOUT)
        if p.returncode != 0:
            raise RuntimeError("%s exited %s" % (os.path.basename(args[0]), p.returncode))

    def piper_wav(self, text, speed, out_path):
        self._run([self.piper, "--model", self.voice_model, "--output_file", out_path,
                   "--length_scale", "%.3f" % (1.0 / speed)], stdin=text.encode("utf-8"))
        if not os.path.isfile(out_path) or os.path.getsize(out_path) < 100:
            raise RuntimeError("piper produced no audio")

    def base_embedding(self):
        path = os.path.join(self.home, "se", "_base_%s.pt" % BASE_VOICE)
        if os.path.isfile(path):
            return self.engine.load(path)
        tmp = os.path.join(self.home, "tmp", "_base.wav")
        self.piper_wav(BASE_SAMPLE_TEXT, 1.0, tmp)
        se = self.engine.embedding(tmp)
        self.engine.save(se, path)
        return se

    def reference_embedding(self, ref, ref_sha):
        path = os.path.join(self.home, "se", ref_sha + ".pt")
        if os.path.isfile(path):
            return self.engine.load(path)
        with tempfile.TemporaryDirectory(dir=os.path.join(self.home, "tmp")) as d:
            raw = os.path.join(d, "ref.bin")
            wav = os.path.join(d, "ref.wav")
            with open(raw, "wb") as fh:
                fh.write(ref)
            try:
                self._run([self.ffmpeg, "-y", "-loglevel", "error", "-i", raw, "-ac", "1", "-ar", "22050",
                           "-t", str(MAX_REF_SECONDS), wav])
            except (RuntimeError, subprocess.TimeoutExpired):
                raise ValueError("reference-unreadable")
            se = self.engine.embedding(wav)
        self.engine.save(se, path)
        return se

    def speak(self, req):
        key = clip_key(req["ref_sha"], req["speed"], req["text"])
        cached = os.path.join(self.home, "cache", key + ".wav")
        if os.path.isfile(cached):
            os.utime(cached, None)
            with open(cached, "rb") as fh:
                return fh.read()
        if not self.lock.acquire(timeout=WAIT_S):
            raise BlockingIOError("busy")
        try:
            tgt = self.reference_embedding(req["ref"], req["ref_sha"])
            src = self.base_embedding()
            with tempfile.TemporaryDirectory(dir=os.path.join(self.home, "tmp")) as d:
                base = os.path.join(d, "base.wav")
                self.piper_wav(req["text"], req["speed"], base)
                audio = self.engine.convert(base, src, tgt)
        finally:
            self.lock.release()
        with open(cached + ".part", "wb") as fh:
            fh.write(audio)
        os.replace(cached + ".part", cached)
        prune_cache(os.path.join(self.home, "cache"), CACHE_MAX_BYTES)
        return audio


def make_handler(clone):
    class Handler(BaseHTTPRequestHandler):
        server_version = "poetech-voice-clone/1"
        protocol_version = "HTTP/1.1"

        def log_message(self, *a):  # never log bodies: a recording is a person's voice
            pass

        def _json(self, code, obj):
            data = json.dumps(obj).encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(data)

        def do_GET(self):
            if self.path.split("?", 1)[0] not in ("/health", "/voice-clone/health"):
                return self._json(404, {"error": "not-found"})
            ok, why = clone.ready()
            body = {"ok": ok, "engine": "nas-clone", "base": BASE_VOICE, "model": "openvoice-v2-converter"}
            # The speed the installer MEASURED on this box (seconds of work per
            # second of speech), never an estimate; absent until it has run.
            try:
                with open(os.path.join(clone.home, "status.json")) as fh:
                    measured = json.load(fh)
                if isinstance(measured, dict) and "rtf" in measured:
                    body["rtf"] = measured["rtf"]
                    body["measured_at"] = measured.get("at")
            except (OSError, ValueError):
                pass
            if not ok:
                body["reason"] = why
            return self._json(200 if ok else 503, body)

        def do_POST(self):
            if self.path.split("?", 1)[0] not in ("/speak", "/voice-clone/speak"):
                return self._json(404, {"error": "not-found"})
            try:
                length = int(self.headers.get("Content-Length") or 0)
            except ValueError:
                length = 0
            if length <= 0:
                return self._json(400, {"error": "body-required"})
            if length > MAX_BODY:
                self.close_connection = True
                return self._json(413, {"error": "body-too-large"})
            # The body is read before any refusal, so a kept-alive connection
            # never reads a recording's bytes as the next request line.
            raw = self.rfile.read(length)
            ok, why = clone.ready()
            if not ok:
                return self._json(503, {"error": "not-ready", "reason": why})
            try:
                req = parse_request(raw)
                audio = clone.speak(req)
            except ValueError as e:
                tag = str(e)
                return self._json(413 if tag == "text-too-long" else 400, {"error": tag})
            except BlockingIOError:
                return self._json(503, {"error": "busy"})
            except Exception as e:  # noqa: BLE001 -- one tagged answer, never a hung reader
                return self._json(500, {"error": "synthesis-failed", "why": type(e).__name__})
            self.send_response(200)
            self.send_header("Content-Type", "audio/wav")
            self.send_header("Content-Length", str(len(audio)))
            self.send_header("X-Voice-Engine", "nas-clone")
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(audio)

    return Handler


def build_clone(home, lite_home, threads):
    piper = find_tool([os.path.join(lite_home, "piper", "piper")])
    model = os.path.join(lite_home, "voices", BASE_VOICE + ".onnx")
    ffmpeg = find_tool([os.path.join(lite_home, "ffmpeg", "ffmpeg"), shutil.which("ffmpeg") or "",
                        "/usr/bin/ffmpeg", "/var/packages/ffmpeg7/target/bin/ffmpeg",
                        "/var/packages/ffmpeg6/target/bin/ffmpeg"])
    clone = Clone(home, lite_home, piper=piper, ffmpeg=ffmpeg, voice_model=model if os.path.isfile(model) else "")
    try:
        clone.engine = Engine(home, threads)
    except Exception as e:  # noqa: BLE001 -- a missing weight file is said, not crashed on
        clone.reason = "the converter did not load: %s" % type(e).__name__
    return clone


# --- Selftest (stdlib only; a fake engine stands in for torch) ----------------
def _selftest():
    import time
    from http.client import HTTPConnection

    failures = []

    def check(cond, msg):
        print(("  PASS " if cond else "  FAIL ") + msg)
        if not cond:
            failures.append(msg)

    def wav_bytes(seconds, rate=22050):
        buf = io.BytesIO()
        with wave.open(buf, "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(rate)
            w.writeframes(b"\x00\x00" * int(seconds * rate))
        return buf.getvalue()

    print("=== 1. the request is read strictly ===")
    ref = wav_bytes(1.0)
    uri = "data:audio/webm;codecs=opus;base64," + base64.b64encode(ref).decode()
    r = parse_request(json.dumps({"text": "  In the   beginning ", "reference_audio": uri, "speed": 9}).encode())
    check(r["text"] == "In the beginning", "text is trimmed and its spaces collapsed")
    check(r["ref"] == ref and r["mime"] == "audio/webm", "a data URI with parameters decodes to the recording and its type")
    check(r["speed"] == SPEED_MAX, "a speed out of range is clamped, not refused")
    for body, tag in [
        ({"text": "", "reference_audio": uri}, "text-required"),
        ({"text": "hi"}, "reference-required"),
        ({"text": "hi", "reference_audio": "data:audio/wav;base64,@@@"}, "reference-unreadable"),
        ({"text": "hi", "reference_audio": base64.b64encode(b"x" * 10).decode()}, "reference-unreadable"),
        ({"text": "x" * (MAX_CHARS + 1), "reference_audio": uri}, "text-too-long"),
    ]:
        try:
            parse_request(json.dumps(body).encode())
            check(False, "refuses with %s" % tag)
        except ValueError as e:
            check(str(e) == tag, "refuses with %s (got %s)" % (tag, e))
    check(clip_key("a", 1.0, "t") != clip_key("b", 1.0, "t"), "a clip is cached per recording, never shared between voices")
    check(clip_key("a", 1.0, "t") != clip_key("a", 1.25, "t"), "and per pace")

    class FakeEngine(object):
        calls = 0

        def embedding(self, path):
            return ("se", os.path.getsize(path))

        def convert(self, path, src, tgt, tau=TAU):
            FakeEngine.calls += 1
            time.sleep(0.3)
            return wav_bytes(0.5)

        def save(self, t, path):
            with open(path, "w") as fh:
                json.dump(list(t), fh)

        def load(self, path):
            with open(path) as fh:
                return tuple(json.load(fh))

    home = tempfile.mkdtemp(prefix="clone-selftest-")
    bindir = os.path.join(home, "bin")
    os.makedirs(bindir)
    piper = os.path.join(bindir, "piper")
    with open(piper, "w") as fh:
        fh.write("#!/bin/sh\nout=''\nwhile [ $# -gt 0 ]; do [ \"$1\" = --output_file ] && out=\"$2\"; shift; done\n"
                 "cat >/dev/null\nhead -c 4000 /dev/zero > \"$out\"\n")
    ff = os.path.join(bindir, "ffmpeg")
    with open(ff, "w") as fh:
        fh.write("#!/bin/sh\nfor a; do last=\"$a\"; done\nhead -c 2000 /dev/zero > \"$last\"\n")
    os.chmod(piper, 0o755)
    os.chmod(ff, 0o755)

    print("=== 2. not ready says why, and never claims the voice ===")
    c = Clone(home, home, engine=None, piper=piper, ffmpeg=ff, voice_model="m.onnx")
    c.reason = "the converter did not load: FileNotFoundError"
    srv = ThreadingHTTPServer(("127.0.0.1", 0), make_handler(c))
    port = srv.server_address[1]
    threading.Thread(target=srv.serve_forever, daemon=True).start()

    def call(method, path, body=None):
        h = HTTPConnection("127.0.0.1", port, timeout=10)
        h.request(method, path, body=body, headers={"Content-Type": "application/json"})
        resp = h.getresponse()
        data = resp.read()
        h.close()
        return resp.status, dict(resp.getheaders()), data

    s, _, d = call("GET", "/health")
    check(s == 503 and b"converter did not load" in d, "health 503 with the reason while the weights are missing")
    s, _, d = call("POST", "/speak", json.dumps({"text": "hi", "reference_audio": uri}).encode())
    check(s == 503 and b"not-ready" in d, "speak 503 not-ready, never a stand-in passed off as the voice")

    print("=== 3. ready: the voice is made, tagged, cached, and one at a time ===")
    c.engine = FakeEngine()
    s, _, d = call("GET", "/health")
    check(s == 200 and b'"engine": "nas-clone"' in d, "health 200 names the engine")
    body = json.dumps({"text": "The Word of Yahweh endures.", "reference_audio": uri}).encode()
    s, hdr, d = call("POST", "/speak", body)
    check(s == 200 and d[:4] == b"RIFF", "speak returns WAV audio")
    check(hdr.get("X-Voice-Engine") == "nas-clone", "and says which engine made it")
    check(wav_seconds(d) > 0.4, "the audio has real length (%.2fs)" % wav_seconds(d))
    n = FakeEngine.calls
    call("POST", "/speak", body)
    check(FakeEngine.calls == n, "the same words in the same voice are served from the cache")
    check(len(os.listdir(os.path.join(home, "se"))) == 2, "one embedding for the recording, one for the house voice")
    s, _, d = call("POST", "/speak", json.dumps({"text": "hi", "reference_audio": "nope"}).encode())
    check(s == 400 and b"reference-unreadable" in d, "an unreadable recording is a named 400")
    starts = []

    def one(i):
        starts.append(call("POST", "/speak", json.dumps({"text": "piece %d" % i, "reference_audio": uri}).encode())[0])

    ts = [threading.Thread(target=one, args=(i,)) for i in range(2)]
    t0 = time.time()
    [t.start() for t in ts]
    [t.join() for t in ts]
    check(starts == [200, 200], "two pieces at once both complete (the second waits its turn)")
    check(time.time() - t0 >= 0.55, "and they ran one after the other, not together, on a CPU box")

    print("=== 4. the cache stays inside its bound ===")
    cdir = os.path.join(home, "cache")
    for i in range(5):
        with open(os.path.join(cdir, "x%d.wav" % i), "wb") as fh:
            fh.write(b"0" * 1000)
    prune_cache(cdir, 2500)
    check(sum(os.path.getsize(os.path.join(cdir, f)) for f in os.listdir(cdir)) <= 2500, "oldest clips pruned to the limit")

    srv.shutdown()
    shutil.rmtree(home, ignore_errors=True)
    if failures:
        print("\nSELFTEST FAILED: %d check(s)" % len(failures))
        sys.exit(1)
    print("\nALL VOICE-CLONE CHECKS PASSED.")


def main():
    ap = argparse.ArgumentParser(description="My voice on the NAS's own CPU (Piper + OpenVoice V2 converter)")
    ap.add_argument("--port", type=int, default=int(os.environ.get("PORT", "8773")))
    ap.add_argument("--home", default=os.environ.get("VOICE_CLONE_HOME", HOME_DEFAULT))
    ap.add_argument("--lite-home", default=os.environ.get("VOICE_LITE_HOME", LITE_HOME_DEFAULT))
    ap.add_argument("--threads", type=int, default=max(1, (os.cpu_count() or 2) - 1))
    ap.add_argument("--selftest", action="store_true")
    args = ap.parse_args()
    if args.selftest:
        return _selftest()
    clone = build_clone(args.home, args.lite_home, args.threads)
    ok, why = clone.ready()
    print("voice-clone on 127.0.0.1:%d -- %s" % (args.port, "ready" if ok else "NOT READY: " + why), flush=True)
    ThreadingHTTPServer(("127.0.0.1", args.port), make_handler(clone)).serve_forever()


if __name__ == "__main__":
    main()

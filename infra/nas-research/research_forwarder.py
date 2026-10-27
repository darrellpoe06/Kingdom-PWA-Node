#!/usr/bin/env python3
# =============================================================================
# research_forwarder -- the locked door in front of Vane (DR-1101)
# =============================================================================
# Darrell 2026-10-18: "Go get all these repos and integrate them into our
# technology stacks..." and then "When should I expect those github
# repositories to be operational and test ready for me to use them and see
# their capabilities?" DR-1099 weighed ten tools and named Vane the first to
# bring home: research that searches the web and returns its sources, on our
# own SearxNG and our own model, with no vendor key. This is its door.
#
# WHY A DOOR AND NOT A PROXY. Vane has no login of any kind (its README lists
# login as a future feature). So nothing of Vane is passed through: not its
# pages, not its settings API, not its upload or chat routes. This forwarder
# serves exactly two things, and every other path is 404:
#   GET  /health, /research/health -> 200 only when Vane answers on loopback
#        AND offers a usable chat model and embedding model; 503 with the
#        reason otherwise. Open (says nothing worth guarding).
#   POST /ask, /research/ask -> Authorization: Bearer <family token>.
#        Body {"query": "...", "mode": "speed"|"balanced"|"quality",
#              "sources": ["web"|"academic"|"discussions", ...]}.
#        Returns {"answer", "sources": [{"title","url"}], "model", "verified":
#        false, "note"}. 401 bad/missing bearer, 400 empty or bad shape, 413
#        too long, 503 busy or Vane down, 504 slow.
# (The Funnel mount /research is STRIPPED by tailscale, so the bare paths
# arrive; the prefixed spellings are served too, for a proxy that does not.)
#
# NOT VERIFIED, AND SAYS SO (DR-0076). Vane's [n] citation marks are the model
# following a prompt; nothing checks that a source supports its sentence. Every
# answer leaves here marked "verified": false, and a research answer enters a
# lesson only through the verification gates, never straight from this road.
# Only http(s) source URLs are passed on, de-duplicated, at most SOURCES_MAX.
#
# Brakes (request-driven, not the timer class; a public door still has bounds):
#   * MAX_INFLIGHT questions at once (one: the tower's GPU answers one at a
#     time anyway); the next gets 503 immediately, never a queue.
#   * MAX_QUERY_CHARS per question.
#   * ASK_TIMEOUT seconds per answer; a hung model hangs nobody.
#
# Run:
#   python3 research_forwarder.py --port 8797
#   python3 research_forwarder.py --selftest    # offline, stdlib, no Vane needed
# Installed + kept running by infra/nas-research/install.sh via services-sync.
# =============================================================================
import argparse
import hashlib
import hmac
import json
import os
import socket
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

TOKEN_FILE_DEFAULT = "/volume1/PoeTech/secrets/chat-bridge-token.txt"
VANE_UPSTREAM_DEFAULT = "http://127.0.0.1:3017"
# NEVER "*": this road carries a bearer. One origin is echoed, anything else
# gets nothing (the voice-lite rule, measured on the Funnel 2026-10-09).
CORS_ALLOWED_ORIGINS = ("https://poetech.us",)

MAX_INFLIGHT = 1
# 4000, raised from 500 on 2026-10-27. MEASURED: a real research question sent
# from the app came back 413 "query is longer than 500 characters" — 500 chars is
# about eighty words, shorter than the questions this road actually carries, while
# the same file lets a READ take 24000 (MAX_READ_CHARS). The cap was bounding the
# wrong thing: the point of a per-question cap is to keep one caller from handing
# the tower's GPU an unbounded prompt, and 4000 chars is roughly a thousand tokens
# — nothing for a local model — so the brake still brakes.
# It stays well under MAX_BODY_BYTES ON PURPOSE. If the two met, an over-long
# question would be refused by the BODY check instead, and the self-test below
# (which sends MAX_QUERY_CHARS + 1) would still pass while no longer proving the
# thing it names. Keep this at most half of MAX_BODY_BYTES so the two bounds stay
# separately provable. `re-review: 2026-12-27` — raise again only on a measured
# refusal, not on a guess.
MAX_QUERY_CHARS = 4000
MAX_BODY_BYTES = 8192
ASK_TIMEOUT = 180
HEALTH_TIMEOUT = 6
SOURCES_MAX = 12
MODES = ("speed", "balanced", "quality")
SOURCE_KINDS = ("web", "academic", "discussions")

# The models DR-1099 named: qwen2.5:14b on the tower answers, nomic-embed-text
# ranks. Preferred first; any qwen / any embedder is the fallback, so a renamed
# tag does not take the road down.
CHAT_PREFERRED = ("qwen2.5:14b",)
CHAT_FALLBACK = ("qwen",)
EMBED_PREFERRED = ("nomic-embed-text",)
EMBED_FALLBACK = ("embed",)

# WHICH MACHINE ANSWERS, AND WHETHER IT MAY (2026-10-19). The first live
# witnesses timed out at 180 s with /health 200: the installer had fallen back
# to the NAS's own CPU Ollama, where a 14B model could not say "OK" in 150 s
# (measured), and /health only asked Vane for its model list, which says
# nothing about whether the model can answer. So the door now checks the
# tower itself, first and cheaply: the URL the installer chose (a GPU tower,
# never the NAS CPU), that tower answering /api/tags, and the DR-0012
# streaming hold -- while a service is live the CUDA towers belong to the
# stream. Any of those failing makes /health say why and /ask refuse in
# seconds instead of hanging three minutes.
OLLAMA_FILE_DEFAULT = "/volume1/docker/research/ollama.url"
HOLD_FILE_DEFAULT = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                 "..", "gpu-scheduler", "state", "STREAMING_HOLD")
TOWER_TIMEOUT = 4
LOOPBACK_HOSTS = ("127.0.0.1", "localhost", "::1")

ASK_PATHS = {"/ask", "/research/ask"}
# THE READING (DR-1199). Darrell, 2026-10-21, on an answered item that was a raw
# transcript: "What happens when we get the results from our Research? Did we
# create the systems I expected... opportunities and constraints... fix it."
# /read takes the WORDS an answer already holds (a transcript, a search answer)
# plus the sender's own note, and asks the tower -- no search -- for a reading
# in one fixed shape: what it is, the opportunities for the family's systems,
# the constraints, the next step, and where in PoeTech it lands. Unverified,
# like every answer; one at a time, like every ask.
READ_PATHS = {"/read", "/research/read"}
MAX_READ_CHARS = 24000            # one PART: what the tower reads at once
# A LONG PIECE IS READ IN PARTS (DR-1202, 2026-10-22). The reading used to read
# the first 24,000 characters and drop the rest, so an hour-long teaching was
# read for its first twenty minutes. Now the words are cut into parts at a
# paragraph or sentence edge, each part is read on its own, and the readings
# are merged so every part contributes. Eight parts is 192,000 characters --
# a long sermon or a full lecture -- inside one wall-clock budget, one tower,
# one at a time. Past eight parts, or past the budget, the reply says exactly
# how much was read (parts_read of parts); it never claims the whole.
MAX_READ_PARTS = 8
READ_BUDGET = 900                 # seconds for every part of one reading together
MAX_READ_BODY_BYTES = 400000 * 4 + 64 * 1024   # the link road's whole answer (400,000 characters) in UTF-8, with room; parts past eight are trimmed after
MAX_NOTE_CHARS = 500
READ_LIST_MAX = 5
READ_LINE_MAX = 300
# Where a reading may say a thing lands: the systems PoeTech has today.
LANDS = ("love-corner", "learn", "properties", "money", "recipes", "health", "games",
         "tv-time", "church", "tlc", "research", "unplaced")
READING_SYSTEM = (
    "You read material for a family that builds its own software (PoeTech): a Learn department of lessons, "
    "the Love Corner church app (weekly teaching and trivia for its people), Poe Properties (doors, tenants, workers), "
    "Money (the family books), Chef's Corner recipes, Road to 150 health, Games, TV Time, TLC. "
    "Answer ONLY with a JSON object with these keys: "
    "\"what\" (one sentence: what the material is), "
    "\"opportunities\" (up to 5 short strings: what the family could build, teach, or use from it), "
    "\"constraints\" (up to 5 short strings: cost, rights, dependencies, what it would undermine, what is unverified), "
    "\"next\" (one sentence: the single next step), "
    "\"lands\" (exactly one of: " + ", ".join(LANDS) + "). "
    "Never invent facts the material does not hold; say when something is uncertain."
)
HEALTH_PATHS = {"/health", "/research/health"}

UNVERIFIED_NOTE = ("Sources are what the search returned; the answer's [n] marks are the "
                   "model's, not checked. Read the source before relying on a sentence.")


def code_sha():
    try:
        with open(os.path.abspath(__file__), "rb") as fh:
            return hashlib.sha256(fh.read()).hexdigest()[:16]
    except OSError:
        return "unknown"


def expected_token(token_file=None):
    if os.environ.get("RESEARCH_BRIDGE_TOKEN"):
        return os.environ["RESEARCH_BRIDGE_TOKEN"].strip()
    try:
        with open(token_file or TOKEN_FILE_DEFAULT, "r", encoding="utf-8") as fh:
            return fh.read().strip()
    except OSError:
        return ""


def bearer_ok(header_value, expected):
    if not expected or not header_value or not header_value.lower().startswith("bearer "):
        return False
    return hmac.compare_digest(header_value[7:].strip(), expected)


def _pick(models, preferred, fallback):
    keys = [m.get("key") for m in (models or []) if isinstance(m, dict) and m.get("key")]
    for want in preferred:
        for k in keys:
            if k.startswith(want):
                return k
    for want in fallback:
        for k in keys:
            if want in k:
                return k
    return None


def choose_models(providers_doc):
    """From Vane's GET /api/providers, the provider + chat + embedding to ask with.

    Returns {"providerId", "chat", "embedding"} or None, with the reason, when
    no provider offers both. Vane gives its providers random ids on first start,
    so they are looked up every time, never written down.
    """
    providers = (providers_doc or {}).get("providers") or []
    for p in providers:
        chat = _pick(p.get("chatModels"), CHAT_PREFERRED, CHAT_FALLBACK)
        emb = _pick(p.get("embeddingModels"), EMBED_PREFERRED, EMBED_FALLBACK)
        if p.get("id") and chat and emb:
            return {"providerId": p["id"], "chat": chat, "embedding": emb}, None
    if not providers:
        return None, "Vane lists no model provider (OLLAMA_BASE_URL unset or unreachable at its start)"
    return None, "no provider offers both a chat model and an embedding model"


def clean_sources(raw):
    """Only http(s) URLs, de-duplicated in order, at most SOURCES_MAX."""
    out, seen = [], set()
    for s in raw or []:
        meta = (s or {}).get("metadata") or {}
        url = str(meta.get("url") or "").strip()
        if not (url.startswith("https://") or url.startswith("http://")) or url in seen:
            continue
        seen.add(url)
        out.append({"title": str(meta.get("title") or url)[:300], "url": url[:2000]})
        if len(out) >= SOURCES_MAX:
            break
    return out


def parse_ask(body_bytes):
    """Validate the question. Returns (request, None) or (None, (status, error))."""
    try:
        doc = json.loads(body_bytes.decode("utf-8") or "{}")
    except (UnicodeDecodeError, ValueError):
        return None, (400, "the body is not JSON")
    if not isinstance(doc, dict):
        return None, (400, "the body must be a JSON object")
    query = doc.get("query")
    if not isinstance(query, str) or not query.strip():
        return None, (400, "query is empty")
    query = query.strip()
    if len(query) > MAX_QUERY_CHARS:
        return None, (413, f"query is longer than {MAX_QUERY_CHARS} characters")
    mode = doc.get("mode", "speed")
    if mode not in MODES:
        return None, (400, f"mode must be one of {', '.join(MODES)}")
    sources = doc.get("sources", ["web"])
    if (not isinstance(sources, list) or not sources
            or any(s not in SOURCE_KINDS for s in sources)):
        return None, (400, f"sources must be a list drawn from {', '.join(SOURCE_KINDS)}")
    return {"query": query, "mode": mode, "sources": list(dict.fromkeys(sources))}, None


def parse_read(body_bytes):
    """Validate a reading request: the words, and the sender's note. Returns (request, None) or (None, (status, error))."""
    try:
        doc = json.loads(body_bytes.decode("utf-8") or "{}")
    except (UnicodeDecodeError, ValueError):
        return None, (400, "the body is not JSON")
    if not isinstance(doc, dict):
        return None, (400, "the body must be a JSON object")
    text = doc.get("text")
    if not isinstance(text, str) or len(text.strip()) < 40:
        return None, (400, "text is empty or too short to read (under 40 characters)")
    text = text.strip()
    parts = split_parts(text)
    truncated = len(parts) > MAX_READ_PARTS
    parts = parts[:MAX_READ_PARTS]
    note = doc.get("note", "")
    if note is None:
        note = ""
    if not isinstance(note, str):
        return None, (400, "note must be a string")
    note = note.strip()[:MAX_NOTE_CHARS]
    return {"text": parts[0], "parts": parts, "note": note, "truncated": truncated}, None


def split_parts(text, size=MAX_READ_CHARS):
    """Cut the words into parts of at most `size` characters, at a paragraph or sentence edge where one is near."""
    parts = []
    rest = text
    while len(rest) > size:
        cut = -1
        for edge in ("\n\n", "\n", ". ", "? ", "! "):
            i = rest.rfind(edge, int(size * 0.8), size)
            if i != -1:
                cut = i + len(edge)
                break
        if cut == -1:
            i = rest.rfind(" ", int(size * 0.8), size)
            cut = i + 1 if i != -1 else size
        parts.append(rest[:cut].strip())
        rest = rest[cut:].strip()
    if rest:
        parts.append(rest)
    return [p for p in parts if p]


def merge_readings(readings):
    """Several parts' readings -> one. What it is and the next step come from the opening part; the lists take
    from every part in turn, so a later part is never crowded out; it lands where most parts say it lands."""
    if not readings:
        return None
    if len(readings) == 1:
        return readings[0]

    def braid(key):
        out, seen = [], set()
        lists = [r.get(key) or [] for r in readings]
        for i in range(max(len(x) for x in lists)):
            for x in lists:
                if i < len(x) and x[i].lower() not in seen and len(out) < READ_LIST_MAX:
                    seen.add(x[i].lower())
                    out.append(x[i])
        return out

    placed = [r["lands"] for r in readings if r.get("lands") and r["lands"] != "unplaced"]
    lands = max(placed, key=lambda k: (placed.count(k), -placed.index(k))) if placed else "unplaced"
    first = readings[0]
    return {
        "what": first["what"],
        "opportunities": braid("opportunities"),
        "constraints": braid("constraints"),
        "next": first.get("next") or next((r.get("next") for r in readings if r.get("next")), ""),
        "lands": lands,
    }


def _short_list(value):
    out = []
    for x in (value if isinstance(value, list) else []):
        if isinstance(x, str) and x.strip():
            out.append(x.strip()[:READ_LINE_MAX])
        if len(out) >= READ_LIST_MAX:
            break
    return out


def clean_reading(obj):
    """The model's JSON -> the reading's fixed shape, or None when it is not one."""
    if not isinstance(obj, dict):
        return None
    what = obj.get("what")
    if not isinstance(what, str) or not what.strip():
        return None
    lands = obj.get("lands")
    lands = lands.strip().lower() if isinstance(lands, str) else ""
    if lands not in LANDS:
        lands = "unplaced"
    nxt = obj.get("next")
    return {
        "what": what.strip()[:READ_LINE_MAX],
        "opportunities": _short_list(obj.get("opportunities")),
        "constraints": _short_list(obj.get("constraints")),
        "next": (nxt.strip()[:READ_LINE_MAX] if isinstance(nxt, str) else ""),
        "lands": lands,
    }


def tower_chat(base, model, system, user, timeout):
    """One answer from the tower's own chat door (Ollama /api/chat), as JSON text. No search."""
    payload = {
        "model": model,
        "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
        "stream": False,
        "format": "json",
        "options": {"temperature": 0.2},
    }
    req = urllib.request.Request(base + "/api/chat", data=json.dumps(payload).encode("utf-8"), method="POST")
    req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=timeout) as r:
        doc = json.loads(r.read().decode("utf-8") or "{}")
    msg = doc.get("message") if isinstance(doc, dict) else None
    return str((msg or {}).get("content") or "")


class Vane:
    """The upstream, on loopback. Every call has a ceiling."""

    def __init__(self, base):
        self.base = base.rstrip("/")

    def _get(self, path, timeout):
        with urllib.request.urlopen(self.base + path, timeout=timeout) as r:
            return json.loads(r.read().decode("utf-8"))

    def providers(self):
        return self._get("/api/providers", HEALTH_TIMEOUT)

    def search(self, payload, timeout):
        req = urllib.request.Request(
            self.base + "/api/search",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read().decode("utf-8"))


class Tower:
    """The GPU tower Vane answers with, and whether it may answer right now."""

    def __init__(self, ollama_file=None, hold_file=None, timeout=TOWER_TIMEOUT, allow_loopback=False):
        self.ollama_file = ollama_file or os.environ.get("RESEARCH_OLLAMA_FILE", OLLAMA_FILE_DEFAULT)
        self.hold_file = hold_file or os.environ.get("RESEARCH_HOLD_FILE", HOLD_FILE_DEFAULT)
        self.timeout = timeout
        self.allow_loopback = allow_loopback  # the selftest's fake tower lives on loopback

    def base(self):
        try:
            with open(self.ollama_file, "r", encoding="utf-8") as fh:
                return fh.read().strip().rstrip("/")
        except OSError:
            return ""

    def state(self):
        """(True, host) when the tower may answer, else (False, the reason in plain words)."""
        if os.path.exists(self.hold_file):
            return False, "The AI towers are reserved for a live service right now (DR-0012). Ask again after the service."
        base = self.base()
        if not base:
            return False, "No AI tower was answering when the research road last looked; it looks again every 15 minutes."
        host = urllib.parse.urlparse(base).hostname or ""
        if host in LOOPBACK_HOSTS and not self.allow_loopback:
            return False, "The research road is set to the NAS's own processor, which cannot answer with a 14B model in time; it needs a GPU tower on."
        try:
            with urllib.request.urlopen(base + "/api/tags", timeout=self.timeout) as r:
                if r.status != 200:
                    raise OSError(f"answered {r.status}")
        except (urllib.error.URLError, socket.timeout, OSError, ValueError):
            return False, f"The AI tower ({host}) is not answering; it may be off or asleep."
        return True, host


def health(vane, tower=None):
    if tower is not None:
        ok, why = tower.state()
        if not ok:
            return 503, {"ok": False, "reason": why, "code": code_sha()}
    try:
        doc = vane.providers()
    except (urllib.error.URLError, socket.timeout, OSError, ValueError) as e:
        return 503, {"ok": False, "reason": f"Vane is not answering on loopback: {e}", "code": code_sha()}
    chosen, why = choose_models(doc)
    if not chosen:
        return 503, {"ok": False, "reason": why, "code": code_sha()}
    out = {"ok": True, "chat": chosen["chat"], "embedding": chosen["embedding"], "code": code_sha()}
    if tower is not None:
        out["tower"] = tower.state()[1]
    return 200, out


def make_handler(vane, token, ask_timeout=ASK_TIMEOUT, tower=None):
    inflight = threading.BoundedSemaphore(MAX_INFLIGHT)

    class Handler(BaseHTTPRequestHandler):
        server_version = "poetech-research"
        ALLOWED_ORIGINS = CORS_ALLOWED_ORIGINS

        def log_message(self, fmt, *args):  # a question is the family's business
            sys.stderr.write("research: %s %s\n" % (self.command, self.path.split("?")[0]))

        def _cors_origin(self):
            o = self.headers.get("Origin")
            return o if o in self.ALLOWED_ORIGINS else None

        def end_headers(self):
            o = self._cors_origin()
            if o:
                self.send_header("Access-Control-Allow-Origin", o)
                self.send_header("Vary", "Origin")
            BaseHTTPRequestHandler.end_headers(self)

        def _json(self, code, obj):
            data = json.dumps(obj).encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", "application/json")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        def _path(self):
            return self.path.split("?", 1)[0].rstrip("/") or "/"

        def do_OPTIONS(self):
            if not self._cors_origin():
                self.send_response(403)
                self.send_header("Content-Length", "0")
                self.end_headers()
                return
            self.send_response(204)
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Authorization, Content-Type")
            self.send_header("Access-Control-Max-Age", "600")
            self.send_header("Content-Length", "0")
            self.end_headers()

        def do_GET(self):
            if self._path() in HEALTH_PATHS:
                code, obj = health(vane, tower)
                return self._json(code, obj)
            return self._json(404, {"error": "not found"})

        def _read(self, raw):
            """The reading door (DR-1199): the words in, the fixed shape out; the tower alone, no search."""
            ask, err = parse_read(raw)
            if err:
                return self._json(err[0], {"error": err[1]})
            if tower is None:
                return self._json(503, {"error": "No AI tower is set for this road, so nothing can read."})
            ok, why = tower.state()
            if not ok:
                return self._json(503, {"error": why})
            if not inflight.acquire(blocking=False):
                return self._json(503, {"error": "a question is already being answered; ask again in a minute"})
            try:
                try:
                    chosen, why = choose_models(vane.providers())
                except (urllib.error.URLError, socket.timeout, OSError, ValueError) as e:
                    return self._json(503, {"error": f"Vane is not answering: {e}"})
                if not chosen:
                    return self._json(503, {"error": why})
                parts = ask["parts"]
                deadline = time.monotonic() + READ_BUDGET
                readings = []
                for n, part in enumerate(parts, 1):
                    left = deadline - time.monotonic()
                    if readings and left < 30:
                        break
                    label = "The material:" if len(parts) == 1 else f"The material, part {n} of {len(parts)} of one long piece (read this part):"
                    user = ("The sender wrote: " + (ask["note"] or "(nothing)") + "\n\n" + label + "\n" + part)
                    try:
                        content = tower_chat(tower.base(), chosen["chat"], READING_SYSTEM, user, max(30, min(ask_timeout, left)))
                    except socket.timeout:
                        if readings:
                            break
                        return self._json(504, {"error": f"no reading within {ask_timeout}s"})
                    except urllib.error.HTTPError as e:
                        if readings:
                            break
                        return self._json(502, {"error": f"the tower answered {e.code}"})
                    except (urllib.error.URLError, OSError, ValueError) as e:
                        if readings:
                            break
                        if "timed out" in str(e):
                            return self._json(504, {"error": f"no reading within {ask_timeout}s"})
                        return self._json(502, {"error": f"the tower failed: {e}"})
                    try:
                        one = clean_reading(json.loads(content or "{}"))
                    except ValueError:
                        one = None
                    if one is None:
                        if readings:
                            break
                        return self._json(502, {"error": "the model did not answer in the reading's shape"})
                    readings.append(one)
                reading = merge_readings(readings)
                return self._json(200, {
                    "reading": reading,
                    "truncated": ask["truncated"] or len(readings) < len(parts),
                    "parts": len(parts),
                    "parts_read": len(readings),
                    "model": chosen["chat"],
                    "verified": False,
                    "note": UNVERIFIED_NOTE,
                })
            finally:
                inflight.release()

        def do_POST(self):
            path = self._path()
            if path not in ASK_PATHS and path not in READ_PATHS:
                return self._json(404, {"error": "not found"})
            if not bearer_ok(self.headers.get("Authorization"), token):
                return self._json(401, {"error": "the family key is missing or wrong"})
            try:
                length = int(self.headers.get("Content-Length") or 0)
            except ValueError:
                length = -1
            cap = MAX_READ_BODY_BYTES if path in READ_PATHS else MAX_BODY_BYTES
            if length < 0 or length > cap:
                return self._json(413, {"error": "the body is too large"})
            if path in READ_PATHS:
                return self._read(self.rfile.read(length))
            ask, err = parse_ask(self.rfile.read(length))
            if err:
                return self._json(err[0], {"error": err[1]})
            if tower is not None:
                ok, why = tower.state()
                if not ok:
                    return self._json(503, {"error": why})
            if not inflight.acquire(blocking=False):
                return self._json(503, {"error": "a question is already being answered; ask again in a minute"})
            try:
                try:
                    chosen, why = choose_models(vane.providers())
                except (urllib.error.URLError, socket.timeout, OSError, ValueError) as e:
                    return self._json(503, {"error": f"Vane is not answering: {e}"})
                if not chosen:
                    return self._json(503, {"error": why})
                payload = {
                    "chatModel": {"providerId": chosen["providerId"], "key": chosen["chat"]},
                    "embeddingModel": {"providerId": chosen["providerId"], "key": chosen["embedding"]},
                    "optimizationMode": ask["mode"],
                    "sources": ask["sources"],
                    "query": ask["query"],
                    "history": [],
                    "stream": False,
                }
                try:
                    res = vane.search(payload, ask_timeout)
                except socket.timeout:
                    return self._json(504, {"error": f"no answer within {ask_timeout}s"})
                except urllib.error.HTTPError as e:
                    return self._json(502, {"error": f"Vane answered {e.code}"})
                except (urllib.error.URLError, OSError, ValueError) as e:
                    if "timed out" in str(e):
                        return self._json(504, {"error": f"no answer within {ask_timeout}s"})
                    return self._json(502, {"error": f"Vane failed: {e}"})
                return self._json(200, {
                    "answer": str((res or {}).get("message") or ""),
                    "sources": clean_sources((res or {}).get("sources")),
                    "model": chosen["chat"],
                    "verified": False,
                    "note": UNVERIFIED_NOTE,
                })
            finally:
                inflight.release()

    return Handler


# ---------------------------------------------------------------------------
# selftest: a fake Vane on loopback, the real Handler in front of it. Every
# refusal the door exists for is shown to fire (proven-to-catch, DR-0076).
# ---------------------------------------------------------------------------
def _selftest():
    failures = []

    def check(ok, what):
        print(("  ok   " if ok else "  FAIL ") + what)
        if not ok:
            failures.append(what)

    state = {"providers": None, "search_body": None, "search_delay": 0, "hold": None}
    good_providers = {"providers": [
        {"id": "p-openai", "name": "OpenAI", "chatModels": [{"key": "gpt-4o"}], "embeddingModels": []},
        {"id": "p-ollama", "name": "Ollama",
         "chatModels": [{"key": "llama3"}, {"key": "qwen2.5-coder:14b"}, {"key": "qwen2.5:14b-instruct-q4_K_M"}],
         "embeddingModels": [{"key": "qwen2.5:14b-instruct-q4_K_M"}, {"key": "nomic-embed-text:latest"}]},
    ]}

    class FakeVane(BaseHTTPRequestHandler):
        def log_message(self, *a):
            pass

        def _send(self, code, obj):
            data = json.dumps(obj).encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        def do_GET(self):
            if self.path == "/api/providers":
                return self._send(200, state["providers"])
            return self._send(200, {"page": "vane ui"})

        def do_POST(self):
            n = int(self.headers.get("Content-Length") or 0)
            state["search_body"] = json.loads(self.rfile.read(n).decode("utf-8"))
            if state["hold"] is not None:
                state["hold"].wait(5)
            return self._send(200, {
                "message": "Vane is an answer engine [1].",
                "sources": [
                    {"content": "a", "metadata": {"title": "One", "url": "https://example.org/one"}},
                    {"content": "b", "metadata": {"title": "One again", "url": "https://example.org/one"}},
                    {"content": "c", "metadata": {"title": "Bad", "url": "javascript:alert(1)"}},
                    {"content": "d", "metadata": {"title": "Local", "url": "file:///etc/passwd"}},
                    {"content": "e", "metadata": {"title": "Two", "url": "http://example.org/two"}},
                ],
            })

    up = ThreadingHTTPServer(("127.0.0.1", 0), FakeVane)
    threading.Thread(target=up.serve_forever, daemon=True).start()
    token = "selftest-family-key"

    # A fake GPU tower: an Ollama that answers GET /api/tags, and POST /api/chat
    # with whatever the reading case has staged (state["chat"]).
    class FakeTower(BaseHTTPRequestHandler):
        def log_message(self, *a):
            pass

        def do_GET(self):
            data = b'{"models": [{"name": "qwen2.5:14b-instruct-q4_K_M"}, {"name": "nomic-embed-text:latest"}]}'
            self.send_response(200 if self.path == "/api/tags" else 404)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        def do_POST(self):
            n = int(self.headers.get("Content-Length") or 0)
            state["chat_body"] = json.loads(self.rfile.read(n).decode("utf-8") or "{}")
            state["chat_calls"] = state.get("chat_calls", 0) + 1
            # A list stages one answer per call, so a reading in parts can be watched part by part.
            staged = state.get("chat")
            content = staged.pop(0) if isinstance(staged, list) and staged else staged
            data = json.dumps({"message": {"role": "assistant", "content": content if isinstance(content, str) else ""}}).encode("utf-8")
            self.send_response(200 if self.path == "/api/chat" else 404)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

    gpu = ThreadingHTTPServer(("127.0.0.1", 0), FakeTower)
    threading.Thread(target=gpu.serve_forever, daemon=True).start()
    import tempfile
    tmp = tempfile.mkdtemp(prefix="research-selftest-")
    url_file = os.path.join(tmp, "ollama.url")
    hold_file = os.path.join(tmp, "STREAMING_HOLD")
    tower_url = f"http://127.0.0.1:{gpu.server_port}"
    with open(url_file, "w", encoding="utf-8") as fh:
        fh.write(tower_url + "\n")
    tower = Tower(ollama_file=url_file, hold_file=hold_file, timeout=2, allow_loopback=True)
    srv = ThreadingHTTPServer(("127.0.0.1", 0), make_handler(Vane(f"http://127.0.0.1:{up.server_port}"), token, ask_timeout=10, tower=tower))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{srv.server_port}"

    def req(method, path, body=None, auth=token, origin=None):
        data = json.dumps(body).encode("utf-8") if isinstance(body, (dict, list)) else body
        r = urllib.request.Request(base + path, data=data, method=method)
        if auth:
            r.add_header("Authorization", f"Bearer {auth}")
        if data is not None:
            r.add_header("Content-Type", "application/json")
        if origin:
            r.add_header("Origin", origin)
        try:
            with urllib.request.urlopen(r, timeout=15) as res:
                return res.status, json.loads(res.read().decode("utf-8") or "{}"), dict(res.headers)
        except urllib.error.HTTPError as e:
            raw = e.read().decode("utf-8") or "{}"
            try:
                obj = json.loads(raw)
            except ValueError:
                obj = {}
            return e.code, obj, dict(e.headers)

    # --- models ----------------------------------------------------------
    chosen, _ = choose_models(good_providers)
    check(chosen == {"providerId": "p-ollama", "chat": "qwen2.5:14b-instruct-q4_K_M", "embedding": "nomic-embed-text:latest"},
          "choose_models picks the Ollama provider, qwen2.5:14b to answer and nomic-embed-text to rank")
    chosen, why = choose_models({"providers": [{"id": "x", "chatModels": [{"key": "qwen2.5:14b"}], "embeddingModels": []}]})
    check(chosen is None and "embedding" in why, "CATCHES a provider with no embedding model: refused, with the reason")
    chosen, why = choose_models({"providers": []})
    check(chosen is None and "OLLAMA_BASE_URL" in why, "CATCHES an empty provider list: names the missing setting")

    # --- health ----------------------------------------------------------
    state["providers"] = {"providers": []}
    s, b, _ = req("GET", "/health", auth=None)
    check(s == 503 and b.get("ok") is False, "health is 503 while Vane offers no usable models")
    state["providers"] = good_providers
    s, b, _ = req("GET", "/health", auth=None)
    check(s == 200 and b.get("ok") is True and b.get("chat", "").startswith("qwen2.5:14b"), "health is 200 with the model it will use")
    s, b, _ = req("GET", "/research/health", auth=None)
    check(s == 200, "the prefixed /research/health is served too (a proxy that does not strip)")
    check(len(b.get("code", "")) == 16, "health carries the forwarder's code sha (the running process follows the code)")

    # --- the door: nothing of Vane passes ---------------------------------
    for p in ("/", "/api/providers", "/api/config", "/api/search", "/research/api/search", "/c/123", "/library"):
        s, _, _ = req("GET", p)
        check(s == 404, f"CATCHES a reach for Vane's own {p} (GET): 404, never proxied")
    s, _, _ = req("POST", "/api/search", body={"query": "x"})
    check(s == 404, "CATCHES a direct POST to Vane's /api/search through the door: 404")

    # --- the bearer -------------------------------------------------------
    s, _, _ = req("POST", "/ask", body={"query": "What is Vane?"}, auth=None)
    check(s == 401, "CATCHES a question with no family key: 401")
    s, _, _ = req("POST", "/ask", body={"query": "What is Vane?"}, auth="wrong-key")
    check(s == 401, "CATCHES a question with the wrong key: 401")
    check(not bearer_ok("Bearer x", ""), "CATCHES an empty expected token: nothing matches an unset key")

    # --- the question's shape ---------------------------------------------
    s, _, _ = req("POST", "/ask", body={"query": "   "})
    check(s == 400, "CATCHES an empty question: 400")
    s, _, _ = req("POST", "/ask", body={"query": "x" * (MAX_QUERY_CHARS + 1)})
    check(s == 413, "CATCHES a question over the length cap: 413")
    # The cap was 500 and refused real questions (2026-10-27). Over-cap alone does
    # not prove a raise worked, so a question AT the cap must be ACCEPTED, and the
    # two bounds must stay separately provable: if MAX_QUERY_CHARS ever grew past
    # the body limit, the check above would pass on the BODY refusal and silently
    # stop testing the length cap at all.
    check(MAX_QUERY_CHARS * 2 <= MAX_BODY_BYTES,
          f"the length cap ({MAX_QUERY_CHARS}) stays provable under the body cap ({MAX_BODY_BYTES})")
    s, _, _ = req("POST", "/ask", body={"query": "x" * MAX_QUERY_CHARS})
    check(s == 200, f"a question AT the cap ({MAX_QUERY_CHARS} chars) is answered, not refused")
    s, _, _ = req("POST", "/ask", body={"query": "ok", "mode": "turbo"})
    check(s == 400, "CATCHES an unknown mode: 400")
    s, _, _ = req("POST", "/ask", body={"query": "ok", "sources": ["web", "files"]})
    check(s == 400, "CATCHES an unknown source kind: 400")
    s, _, _ = req("POST", "/ask", body=b"not json")
    check(s == 400, "CATCHES a body that is not JSON: 400")

    # --- a good question --------------------------------------------------
    s, b, _ = req("POST", "/ask", body={"query": "What is Vane?"})
    check(s == 200 and b.get("answer", "").startswith("Vane is"), "a question with the key returns the answer")
    urls = [x["url"] for x in b.get("sources", [])]
    check(urls == ["https://example.org/one", "http://example.org/two"],
          "sources are http(s) only and de-duplicated: CATCHES javascript: and file: URLs")
    check(b.get("verified") is False and "not checked" in b.get("note", ""), "every answer is marked unverified, in words")
    sb = state["search_body"] or {}
    check(sb.get("chatModel") == {"providerId": "p-ollama", "key": "qwen2.5:14b-instruct-q4_K_M"}
          and sb.get("embeddingModel", {}).get("key") == "nomic-embed-text:latest"
          and sb.get("stream") is False and sb.get("history") == [] and sb.get("sources") == ["web"],
          "Vane is asked with our models, no history, no streaming, web only by default")

    # --- the reading: the words in, the fixed shape out (DR-1199) ---------
    words = "The Maya built cities in the rainforest; Charnay visited after reading Stevens and Catherwood. " * 3
    s, _, _ = req("POST", "/read", body={"text": words}, auth=None)
    check(s == 401, "CATCHES a reading with no family key: 401")
    s, b, _ = req("POST", "/read", body={"text": "too short"})
    check(s == 400 and "too short" in b.get("error", ""), "CATCHES words too short to read: 400")
    s, b, _ = req("POST", "/read", body={"text": words, "note": 7})
    check(s == 400, "CATCHES a note that is not a string: 400")
    state["chat"] = json.dumps({"what": "A transcript about the Maya.", "opportunities": ["A History lesson on the Maya", "A Love Corner trivia week", "x", "y", "z", "one too many"],
                                "constraints": ["The transcript is unverified"], "next": "Draft the lesson.", "lands": "learn"})
    s, b, _ = req("POST", "/read", body={"text": words, "note": "We need this inside the Love Corner App each week."})
    r = b.get("reading") or {}
    check(s == 200 and r.get("what") == "A transcript about the Maya." and r.get("lands") == "learn" and len(r.get("opportunities", [])) == READ_LIST_MAX,
          "a reading comes back in the fixed shape, lists capped at five")
    check(b.get("verified") is False and "not checked" in b.get("note", ""), "every reading is marked unverified, in words")
    cb = state.get("chat_body") or {}
    check(cb.get("model", "").startswith("qwen2.5:14b") and cb.get("stream") is False and cb.get("format") == "json"
          and "Love Corner App" in (cb.get("messages") or [{}, {}])[1].get("content", "") and "Maya" in (cb.get("messages") or [{}, {}])[1].get("content", ""),
          "the tower is asked with our model, JSON only, the sender's note and the words together, no search")
    state["chat"] = json.dumps({"what": "x", "lands": "the moon"})
    s, b, _ = req("POST", "/read", body={"text": words})
    check(s == 200 and (b.get("reading") or {}).get("lands") == "unplaced", "CATCHES a landing outside the list: unplaced, never invented")
    state["chat"] = "I cannot answer in JSON, sorry."
    s, b, _ = req("POST", "/read", body={"text": words})
    check(s == 502 and "shape" in b.get("error", ""), "CATCHES a model that does not answer in the shape: 502, nothing written")
    state["chat"] = json.dumps({"what": "x", "lands": "learn"})
    # --- a long piece, read in parts (DR-1202) -----------------------------
    para = ("The cities of refuge were set a day's journey apart so that every slayer could reach one. " * 40).strip()
    long_words = "\n\n".join([para] * 18)          # 65,000 characters: three parts
    parts = split_parts(long_words)
    check(len(parts) == 3 and all(len(x) <= MAX_READ_CHARS for x in parts) and sum(len(x) for x in parts) >= len(long_words) - 200,
          "a long piece is cut into parts of at most one read each, nothing dropped")
    check(all(x.endswith(".") for x in parts[:-1]), "each part is cut at a paragraph or sentence edge, never mid-word")
    state["chat_calls"] = 0
    state["chat"] = [json.dumps({"what": "A teaching on the cities of refuge.", "opportunities": ["A lesson on distance"], "constraints": ["Unverified transcript"], "next": "Draft the lesson.", "lands": "learn"}),
                     json.dumps({"what": "part two", "opportunities": ["A Love Corner trivia week", "a lesson on distance"], "constraints": [], "lands": "love-corner"}),
                     json.dumps({"what": "part three", "opportunities": ["A family study night"], "constraints": ["Long"], "lands": "learn"})]
    s, b, _ = req("POST", "/read", body={"text": long_words})
    r = b.get("reading") or {}
    check(s == 200 and state["chat_calls"] == 3 and b.get("parts") == 3 and b.get("parts_read") == 3 and b.get("truncated") is False,
          "every part is read, one call each, and the reply says all three were read")
    check(r.get("what") == "A teaching on the cities of refuge." and r.get("next") == "Draft the lesson." and r.get("lands") == "learn",
          "what it is and the next step come from the opening part; it lands where most parts say")
    check(r.get("opportunities") == ["A lesson on distance", "A Love Corner trivia week", "A family study night"] and r.get("constraints") == ["Unverified transcript", "Long"],
          "every part contributes to the lists, a repeat is said once")
    cb = (state.get("chat_body") or {}).get("messages") or [{}, {}]
    check("part 3 of 3" in cb[1].get("content", ""), "each part is told which part of the piece it is")
    state["chat"] = [json.dumps({"what": "A teaching.", "lands": "learn"}), "not json"]
    s, b, _ = req("POST", "/read", body={"text": long_words})
    check(s == 200 and b.get("parts_read") == 1 and b.get("parts") == 3 and b.get("truncated") is True,
          "CATCHES a part that fails midway: what was read is kept, and the reply says 1 of 3, never the whole")
    state["chat"] = json.dumps({"what": "x", "lands": "learn"})
    s, b, _ = req("POST", "/read", body={"text": ("w " * (MAX_READ_CHARS // 2)) * (MAX_READ_PARTS + 1)})
    check(s == 200 and b.get("parts") == MAX_READ_PARTS and b.get("truncated") is True,
          "words past eight parts are read to eight parts and say so (truncated)")

    # --- one at a time ----------------------------------------------------
    hold = threading.Event()
    state["hold"] = hold
    first = {}
    t = threading.Thread(target=lambda: first.update(r=req("POST", "/ask", body={"query": "slow one"})))
    t.start()
    for _ in range(50):
        if state["search_body"] and state["search_body"].get("query") == "slow one":
            break
        threading.Event().wait(0.05)
    s, b, _ = req("POST", "/ask", body={"query": "second"})
    check(s == 503 and "already" in b.get("error", ""), "CATCHES a second question while one is answered: 503, never a queue")
    hold.set()
    t.join(10)
    state["hold"] = None
    check(first.get("r", (0,))[0] == 200, "the first question still finishes")

    # --- CORS -------------------------------------------------------------
    _, _, h = req("GET", "/health", auth=None, origin="https://poetech.us")
    check(h.get("Access-Control-Allow-Origin") == "https://poetech.us", "the app's own origin is allowed")
    for o in ("https://evil.example", "https://poetech.us.evil.example", "http://poetech.us", "*"):
        _, _, h = req("GET", "/health", auth=None, origin=o)
        check("Access-Control-Allow-Origin" not in h, f"CATCHES the origin {o}: refused, not echoed")
    check("*" not in CORS_ALLOWED_ORIGINS, "the LIVE allowlist holds no wildcard")

    # --- the tower: which machine answers, and whether it may -------------
    import time as _time

    def write_url(text):
        with open(url_file, "w", encoding="utf-8") as fh:
            fh.write(text)

    s, b, _ = req("GET", "/health", auth=None)
    check(s == 200 and b.get("tower") == "127.0.0.1", "health names the tower it will answer with")
    open(hold_file, "w").close()
    state["search_body"] = None
    s, b, _ = req("GET", "/health", auth=None)
    check(s == 503 and "live service" in b.get("reason", ""), "CATCHES the DR-0012 streaming hold: health 503 with the reason")
    t0 = _time.time()
    s, b, _ = req("POST", "/ask", body={"query": "while the service is live"})
    check(s == 503 and state["search_body"] is None and _time.time() - t0 < 2,
          "CATCHES a question during a live service: refused at once, Vane never asked")
    os.remove(hold_file)
    write_url("")
    s, b, _ = req("GET", "/health", auth=None)
    check(s == 503 and "No AI tower" in b.get("reason", ""), "CATCHES no tower chosen at install: health says so")
    write_url("http://127.0.0.1:9\n")
    t0 = _time.time()
    s, b, _ = req("POST", "/ask", body={"query": "tower asleep"})
    check(s == 503 and "not answering" in b.get("error", "") and state["search_body"] is None and _time.time() - t0 < 5,
          "CATCHES a tower that is off: refused in seconds, not a three-minute hang")
    write_url("http://127.0.0.1:11434\n")
    ok, why = Tower(ollama_file=url_file, hold_file=hold_file, timeout=2).state()
    check(not ok and "NAS's own processor" in why, "CATCHES the NAS CPU set as the model: never treated as able to answer")
    write_url(tower_url + "\n")
    s, b, _ = req("GET", "/health", auth=None)
    check(s == 200, "the road comes back the moment the tower answers again")
    gpu.shutdown()
    gpu.server_close()
    write_url(tower_url + "\n")

    # --- Vane down --------------------------------------------------------
    write_url("")  # with no tower check in the way, these measure Vane alone
    srv.RequestHandlerClass = make_handler(Vane(f"http://127.0.0.1:{up.server_port}"), token, ask_timeout=10)
    up.shutdown()
    up.server_close()
    s, b, _ = req("GET", "/health", auth=None)
    check(s == 503 and "not answering" in b.get("reason", ""), "health is 503 when Vane is down, and says so")
    s, _, _ = req("POST", "/ask", body={"query": "anyone there?"})
    check(s == 503, "a question while Vane is down: 503, not a hang")

    srv.shutdown()
    print("research selftest: " + ("OK" if not failures else f"{len(failures)} FAILURE(S)"))
    return 1 if failures else 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=int(os.environ.get("PORT", "8797")))
    ap.add_argument("--upstream", default=os.environ.get("VANE_UPSTREAM", VANE_UPSTREAM_DEFAULT))
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args()
    if a.selftest:
        sys.exit(_selftest())
    token = expected_token()
    if not token:
        print("research: no family bearer token -- refusing to start an unlocked door", file=sys.stderr)
        sys.exit(2)
    srv = ThreadingHTTPServer(("127.0.0.1", a.port), make_handler(Vane(a.upstream), token, tower=Tower()))
    print(f"research on 127.0.0.1:{a.port} -> {a.upstream} (code {code_sha()})")
    srv.serve_forever()


if __name__ == "__main__":
    main()

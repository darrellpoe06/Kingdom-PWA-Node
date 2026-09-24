#!/usr/bin/env python3
"""
lesson_voice_transcribe.py -- a lesson spoken into the app becomes words,
written by Whisper on our own machines (DR-0611).

Darrell 2026-09-24: "can whisper work for us?" / "Go build the Whisper intake" /
"Can we put whisper on multiple places for easy-to-use or support a better flow
or quality?"

THE ROAD (outbound only; the DR-0132 Supabase bus -- no inbound door opens):
  1. The app uploads the recording to the PRIVATE bucket `lesson-audio`
     (migration 0229) and files an agent_inbox row tagged
     lesson + voice + audio:<path>.
  2. This loop polls agent_inbox with the service role for voice rows that
     are neither transcribed nor failed, oldest first.
  3. It downloads the audio and KEEPS it on the NAS (DATA/audio/<path>).
  4. THE WHISPER LADDER: it tries each Whisper endpoint in WHISPER_URLS in
     order (default: the 4070 tower, large-v3-turbo on the GPU) and, when
     none answers, Whisper on this machine's own CPU (faster-whisper,
     WHISPER_LOCAL_MODEL, default "small") when it is installed. The first
     rung that returns words wins, and the transcript row NAMES the rung and
     the model, so quality can be compared across places.
  5. It files the transcript as a new agent_inbox row tagged
     lesson + voice-transcript + of:<row id> (same instance, same author),
     tags the original voice-transcribed, and deletes the cloud copy.
  6. The lesson reader builds the lesson from the transcript row.

IDEMPOTENT BY THE DATABASE: before writing, it asks whether a transcript row
for this id already exists (a crash between insert and tag cannot duplicate).
A row that fails MAX_ATTEMPTS times is tagged voice-failed and a
lesson + voice-failed row states the reason, so the failure reaches Darrell
instead of looping silently (DR-0076).

BRAKES (deterministic class, DR-0248: budget + lock): at most
MAX_ITEMS_PER_RUN rows and MAX_RUN_SECONDS per run; a lockfile makes it
single-flight (a live lock skips; a stale one is broken). The runner in
infra/nas-loops adds its own daily call cap and timeout on top.

Secrets (first found wins): env SUPABASE_URL + SUPABASE_SERVICE_KEY, else
/volume1/PoeTech/secrets/supabase.json {"url", "service_key"} -- the same file
load-transcripts.py has written 872 transcripts with.

    python3 lesson_voice_transcribe.py            # one run
    python3 -m unittest test_lesson_voice -v      # the proofs (CI runs these)
"""
import json
import os
import sys
import time
import urllib.parse
import urllib.request
import uuid

# WHICH DATABASE IS LIVE (DR-0614): the app follows REPOINT-ARMED to the NAS's
# own Supabase; so must this job. One resolver, shared by every NAS writer.
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "nas-supabase"))
from sovereign_target import resolve_target  # noqa: E402

BUCKET = "lesson-audio"
DATA = os.environ.get("LESSON_VOICE_DATA", "/volume1/PoeTech/lesson-voice")
SECRETS = os.environ.get("LESSON_VOICE_SECRETS", "/volume1/PoeTech/secrets/supabase.json")
WHISPER_URLS_DEFAULT = "http://tlcmediadpt:8771"
LOCAL_MODEL_DEFAULT = "small"
MAX_ITEMS_PER_RUN = int(os.environ.get("LESSON_VOICE_MAX_ITEMS", "3"))
MAX_RUN_SECONDS = int(os.environ.get("LESSON_VOICE_MAX_SECONDS", "1500"))
LOCK_MAX_AGE_SECONDS = int(os.environ.get("LESSON_VOICE_LOCK_MAX_AGE", "3600"))
MAX_ATTEMPTS = int(os.environ.get("LESSON_VOICE_MAX_ATTEMPTS", "3"))


# --- pure helpers --------------------------------------------------------------

def whisper_urls(env=None):
    """The ladder, in order. Comma-separated; blanks dropped; trailing slash trimmed."""
    env = env if env is not None else os.environ
    raw = env.get("WHISPER_URLS", WHISPER_URLS_DEFAULT)
    return [u.strip().rstrip("/") for u in raw.split(",") if u.strip()]


def audio_path_of(tags):
    """The storage path from an audio:<path> tag, or '' (path-guarded: no traversal)."""
    for t in tags or []:
        if isinstance(t, str) and t.startswith("audio:"):
            p = t[len("audio:"):]
            if p and ".." not in p and not p.startswith("/") and "\\" not in p:
                return p
    return ""


def needs_transcript(row):
    tags = row.get("tags") or []
    return ("lesson" in tags and "voice" in tags and bool(audio_path_of(tags))
            and "voice-transcribed" not in tags and "voice-failed" not in tags)


def transcript_body(text, rung, model, seconds):
    dur = ""
    if isinstance(seconds, (int, float)) and seconds > 0:
        s = int(round(seconds))
        dur = f", {s // 60}:{s % 60:02d}"
    return (f"Lesson. A spoken lesson, transcribed by Whisper ({model}) on {rung}{dur}. "
            f"These are his words as Whisper heard them.\n\n{text.strip()}")


def rung_name(url):
    host = urllib.parse.urlparse(url).hostname or url
    return "the 4070 tower" if host == "tlcmediadpt" else host


def multipart(field, filename, data, content_type):
    boundary = "----poetech" + uuid.uuid4().hex
    head = (f"--{boundary}\r\nContent-Disposition: form-data; name=\"{field}\"; filename=\"{filename}\"\r\n"
            f"Content-Type: {content_type}\r\n\r\n").encode("utf-8")
    body = head + data + f"\r\n--{boundary}--\r\n".encode("utf-8")
    return body, f"multipart/form-data; boundary={boundary}"


def content_type_for(path):
    ext = os.path.splitext(path)[1].lower()
    return {".m4a": "audio/mp4", ".ogg": "audio/ogg", ".wav": "audio/wav"}.get(ext, "audio/webm")


# --- the brakes ----------------------------------------------------------------

def acquire_lock(data_dir, now=None):
    now = now if now is not None else time.time()
    os.makedirs(data_dir, exist_ok=True)
    p = os.path.join(data_dir, "lesson-voice.lock")
    if os.path.isfile(p):
        try:
            age = now - os.path.getmtime(p)
        except OSError:
            age = 0
        if age <= LOCK_MAX_AGE_SECONDS:
            return False
        os.remove(p)
    with open(p, "w", encoding="utf-8") as f:
        f.write(str(os.getpid()))
    return True


def release_lock(data_dir):
    try:
        os.remove(os.path.join(data_dir, "lesson-voice.lock"))
    except OSError:
        pass


def read_attempts(data_dir):
    p = os.path.join(data_dir, "attempts.json")
    try:
        with open(p, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return {}


def write_attempts(data_dir, attempts):
    with open(os.path.join(data_dir, "attempts.json"), "w", encoding="utf-8") as f:
        json.dump(attempts, f, indent=2)


# --- the run -------------------------------------------------------------------

def run_once(io, data_dir=DATA, env=None, clock=time.monotonic):
    """One run. `io` carries every external call (list_rows, has_transcript,
    download, transcribe_ladder, insert_row, add_tags, delete_audio), so the
    tests prove the whole road without a network. Returns an honest report."""
    report = {"ran": False, "transcribed": [], "failed": [], "skipped": [], "stopped": ""}
    if not acquire_lock(data_dir):
        report["stopped"] = "locked-skip"
        return report
    try:
        report["ran"] = True
        started = clock()
        attempts = read_attempts(data_dir)
        done = 0
        for row in io.list_rows():
            if not needs_transcript(row):
                continue
            if done >= MAX_ITEMS_PER_RUN:
                report["stopped"] = "item-budget"
                break
            if clock() - started >= MAX_RUN_SECONDS:
                report["stopped"] = "time-budget"
                break
            rid = row["id"]
            path = audio_path_of(row.get("tags"))
            done += 1
            if io.has_transcript(rid):
                io.add_tags(row, ["voice-transcribed"])
                report["skipped"].append({"id": rid, "why": "transcript-already-filed"})
                continue
            try:
                local = io.download(path)
                result = io.transcribe_ladder(local)
                text = (result or {}).get("text", "").strip()
                if not text:
                    raise RuntimeError("empty-transcript: every Whisper rung returned no words")
                io.insert_row({
                    "instance_id": row["instance_id"],
                    "created_by": row["created_by"],
                    "body": transcript_body(text, result.get("rung", "?"), result.get("model", "?"), result.get("duration_sec")),
                    "tags": ["lesson", "voice-transcript", f"of:{rid}", f"whisper:{result.get('rung_key', 'unknown')}"],
                    "source": "lesson-voice-transcribe",
                })
                io.add_tags(row, ["voice-transcribed"])
                try:
                    io.delete_audio(path)
                except Exception as e:  # the transcript is safe; a leftover cloud copy is reported, not fatal
                    report["skipped"].append({"id": rid, "why": f"cloud-copy-kept: {e}"})
                attempts.pop(rid, None)
                report["transcribed"].append({"id": rid, "rung": result.get("rung"), "model": result.get("model")})
            except Exception as e:  # every external call is caught; the failure is counted and said
                n = int(attempts.get(rid, 0)) + 1
                attempts[rid] = n
                report["failed"].append({"id": rid, "attempt": n, "error": str(e)})
                if n >= MAX_ATTEMPTS:
                    try:
                        io.insert_row({
                            "instance_id": row["instance_id"],
                            "created_by": row["created_by"],
                            "body": (f"Lesson. A spoken lesson could not be transcribed after {n} tries. "
                                     f"Last reason: {e}. The recording is kept; send it again or type it."),
                            "tags": ["lesson", "voice-failed", f"of:{rid}"],
                            "source": "lesson-voice-transcribe",
                        })
                        io.add_tags(row, ["voice-failed"])
                        attempts.pop(rid, None)
                    except Exception as e2:
                        report["failed"].append({"id": rid, "error": f"could-not-report: {e2}"})
        write_attempts(data_dir, attempts)
        if not report["stopped"]:
            report["stopped"] = "queue-drained"
        return report
    finally:
        release_lock(data_dir)


# --- the real I/O (stdlib only) ------------------------------------------------

def load_live(path=SECRETS, resolver=resolve_target):
    """(source, url, key) of the database the APP reads (sovereign when armed)."""
    return resolver(path)


def load_hosted(path=SECRETS):
    """(url, key) of the hosted project named in the secrets file, or ('', '')."""
    try:
        with open(path, encoding="utf-8") as f:
            s = json.load(f)
        return (s.get("url") or "").rstrip("/"), s.get("service_key") or s.get("service_role_key") or ""
    except (OSError, ValueError):
        return "", ""


# THE MIRROR (DR-0614). The app writes to the NAS's own database, but the lesson
# reader runs in the cloud and can reach only the hosted project. So every
# lesson row the reader must see (a typed lesson, a transcript, a failure) is
# copied to the hosted agent_inbox under the SAME id (a repeat is a harmless
# duplicate refusal), and the original is tagged `mirrored`. A raw `voice` row
# is not copied: its words arrive as the transcript row.
MAX_MIRROR_PER_RUN = int(os.environ.get("LESSON_MIRROR_MAX", "20"))


def rows_to_mirror(rows):
    out = []
    for r in rows or []:
        tags = r.get("tags") or []
        if "lesson" not in tags or "mirrored" in tags:
            continue
        if "voice" in tags and "voice-transcript" not in tags and "voice-failed" not in tags:
            continue
        out.append(r)
    return out[:MAX_MIRROR_PER_RUN]


def mirror_once(list_live, insert_hosted, tag_live):
    """Copy what the cloud reader must see; returns {mirrored, failed}. Never raises."""
    report = {"mirrored": [], "failed": []}
    try:
        rows = rows_to_mirror(list_live())
    except Exception as e:
        report["failed"].append({"id": None, "error": f"list: {e}"})
        return report
    for r in rows:
        try:
            insert_hosted({k: r[k] for k in ("id", "instance_id", "created_by", "body", "tags", "source", "created_at") if k in r})
            tag_live(r, ["mirrored"])
            report["mirrored"].append(r["id"])
        except Exception as e:
            report["failed"].append({"id": r.get("id"), "error": str(e)})
    return report


class SupabaseIO:
    def __init__(self, url, key, data_dir=DATA, env=None):
        self.url, self.key, self.data_dir = url, key, data_dir
        self.env = env if env is not None else os.environ

    def _req(self, method, path, body=None, headers=None, timeout=60):
        h = {"apikey": self.key, "Authorization": "Bearer " + self.key}
        h.update(headers or {})
        req = urllib.request.Request(self.url + path, data=body, method=method, headers=h)
        with urllib.request.urlopen(req, timeout=timeout) as res:
            return res.read()

    def list_rows(self):
        q = "select=id,instance_id,created_by,tags,created_at&tags=cs." + urllib.parse.quote('["voice"]') + "&order=created_at.asc&limit=50"
        return json.loads(self._req("GET", "/rest/v1/agent_inbox?" + q).decode("utf-8"))

    def list_lesson_rows(self):
        q = "select=id,instance_id,created_by,body,tags,source,created_at&tags=cs." + urllib.parse.quote('["lesson"]') + "&order=created_at.asc&limit=100"
        return json.loads(self._req("GET", "/rest/v1/agent_inbox?" + q).decode("utf-8"))

    def insert_mirror(self, row):
        # Same id on the hosted side: a second copy is refused as a duplicate,
        # which ignore-duplicates turns into a quiet no-op.
        self._req("POST", "/rest/v1/agent_inbox?on_conflict=id", json.dumps(row).encode("utf-8"),
                  {"Content-Type": "application/json", "Prefer": "resolution=ignore-duplicates,return=minimal"})

    def has_transcript(self, rid):
        q = "select=id&tags=cs." + urllib.parse.quote(json.dumps(["voice-transcript", f"of:{rid}"])) + "&limit=1"
        return bool(json.loads(self._req("GET", "/rest/v1/agent_inbox?" + q).decode("utf-8")))

    def download(self, path):
        raw = self._req("GET", f"/storage/v1/object/{BUCKET}/" + urllib.parse.quote(path), timeout=300)
        local = os.path.join(self.data_dir, "audio", path)
        os.makedirs(os.path.dirname(local), exist_ok=True)
        with open(local, "wb") as f:
            f.write(raw)
        return local

    def transcribe_ladder(self, local):
        return transcribe_ladder(local, env=self.env)

    def insert_row(self, row):
        self._req("POST", "/rest/v1/agent_inbox", json.dumps(row).encode("utf-8"),
                  {"Content-Type": "application/json", "Prefer": "return=minimal"})

    def add_tags(self, row, extra):
        tags = list(row.get("tags") or [])
        for t in extra:
            if t not in tags:
                tags.append(t)
        self._req("PATCH", "/rest/v1/agent_inbox?id=eq." + urllib.parse.quote(row["id"]),
                  json.dumps({"tags": tags}).encode("utf-8"),
                  {"Content-Type": "application/json", "Prefer": "return=minimal"})
        row["tags"] = tags

    def delete_audio(self, path):
        self._req("DELETE", f"/storage/v1/object/{BUCKET}/" + urllib.parse.quote(path))


def post_whisper(url, local, timeout=900):
    with open(local, "rb") as f:
        data = f.read()
    body, ctype = multipart("file", os.path.basename(local), data, content_type_for(local))
    req = urllib.request.Request(url + "/transcribe", data=body, method="POST", headers={"Content-Type": ctype})
    with urllib.request.urlopen(req, timeout=timeout) as res:
        return json.loads(res.read().decode("utf-8"))


def local_whisper(local, model_size):
    from faster_whisper import WhisperModel  # installed by install.sh when the NAS can take it
    model = WhisperModel(model_size, device="cpu", compute_type="int8")
    segments, info = model.transcribe(local, beam_size=5, vad_filter=True)
    text = "\n".join((s.text or "").strip() for s in segments if (s.text or "").strip())
    return {"text": text, "model": model_size, "duration_sec": round(info.duration, 2)}


def transcribe_ladder(local, env=None, post=post_whisper, local_fn=local_whisper):
    """Each network rung in order, then this machine's CPU. First words win."""
    env = env if env is not None else os.environ
    errors = []
    for url in whisper_urls(env):
        try:
            out = post(url, local)
            if (out or {}).get("text", "").strip():
                return {**out, "rung": rung_name(url), "rung_key": urllib.parse.urlparse(url).hostname or "net"}
            errors.append(f"{url}: no words")
        except Exception as e:
            errors.append(f"{url}: {e}")
    if env.get("WHISPER_LOCAL", "1") != "0":
        try:
            out = local_fn(local, env.get("WHISPER_LOCAL_MODEL", LOCAL_MODEL_DEFAULT))
            if (out or {}).get("text", "").strip():
                return {**out, "rung": "the NAS CPU", "rung_key": "nas-cpu"}
            errors.append("nas-cpu: no words")
        except Exception as e:
            errors.append(f"nas-cpu: {e}")
    raise RuntimeError("no Whisper rung answered -- " + "; ".join(errors))


if __name__ == "__main__":
    source, url, key = load_live()
    if not (url and key):
        print(json.dumps({"ran": False, "stopped": "no Supabase credential on this NAS"}))
        sys.exit(0)
    live = SupabaseIO(url, key)
    out = {"target": source, "transcribe": run_once(live)}
    if source == "sovereign":
        hurl, hkey = load_hosted()
        if hurl and hkey and hurl != url:
            hosted = SupabaseIO(hurl, hkey)
            out["mirror"] = mirror_once(live.list_lesson_rows, hosted.insert_mirror, live.add_tags)
        else:
            out["mirror"] = {"skipped": "no hosted credential to mirror to"}
    print(json.dumps(out, indent=2))

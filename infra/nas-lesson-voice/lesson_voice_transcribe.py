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

RECORDED NOTES (DR-0624, 2026-09-24: "I tried to record a conversation ... it
would not even save the note"). The same road serves a conversation recorded
on the Notes box. Its row is tagged note + voice + audio:<path> + note:<id> +
consent:all-agreed. For a note the WORDS are written to the owner's own folder
of the private bucket (<audio path>.txt, readable only by that person under
0229's policy) and the agent_inbox row tagged note + voice-transcript +
of:<row id> carries the proof only (word count, rung, model), because every
member of a household can read agent_inbox. The app fills the note from the
.txt and removes it. Note rows never carry `lesson`, so they never reach the
lesson reader or the hosted mirror.

A RECORDING THAT FAILED IS WORKED ON AGAIN (HOLD-THE-HAND, DR-0621): when a
row is voice-failed and a rung answers again, it is retried; a retry that
fails is not re-announced. A long recording on the CPU rung is carried across
passes (partial/<id>.json keeps the words so far and the second reached).

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
# THE TOWER BY A NAME THE NAS CAN RESOLVE (measured 2026-09-24, failure row
# ffa896bb: "http://tlcmediadpt:8771: <urlopen error [Errno -2] Name or service
# not known>"). The bare host name does not resolve on the NAS; its tailnet
# MagicDNS name and tailnet address do (the same candidates voice-studio's
# installer uses for the 4070). NOT 127.0.0.1:8771: on the NAS that port is the
# reading-voice forwarder, not Whisper.
TOWER_KEYS = ("tlcmediadpt", "100.69.19.13")
WHISPER_URLS_DEFAULT = "http://tlcmediadpt.tail5a2f35.ts.net:8771,http://100.69.19.13:8771"
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


def kind_of(tags):
    """'lesson' (a spoken lesson for the lesson intake), 'note' (a recorded
    conversation or long note that belongs back in the person's own note,
    DR-0624), or '' (not ours)."""
    tags = tags or []
    if "lesson" in tags:
        return "lesson"
    if "note" in tags:
        return "note"
    return ""


def needs_transcript(row, retry_failed=False):
    """A voice row still owed its words. A voice-failed row is owed again only
    when retry_failed is set: a rung has come back since it failed, so the
    recording is worked on instead of being left for dead (HOLD-THE-HAND)."""
    tags = row.get("tags") or []
    if not ("voice" in tags and kind_of(tags) and audio_path_of(tags)):
        return False
    if "voice-transcribed" in tags:
        return False
    if "voice-failed" in tags:
        return bool(retry_failed)
    return True


def note_id_of(tags):
    for t in tags or []:
        if isinstance(t, str) and t.startswith("note:"):
            return t[len("note:"):]
    return ""


def transcript_text_path(audio_path):
    """Where a note's words wait for their owner: beside the audio, in the
    owner's own folder of the private bucket (0229's owner-folder policy), so
    only that person can read them. Never in agent_inbox, which every member
    of the household can read."""
    return audio_path + ".txt"


def word_count(text):
    return len([w for w in (text or "").split() if w.strip()])


def mmss(seconds):
    if isinstance(seconds, (int, float)) and seconds > 0:
        s = int(round(seconds))
        return f"{s // 60}:{s % 60:02d}"
    return ""


def transcript_body(text, rung, model, seconds):
    dur = mmss(seconds)
    dur = f", {dur}" if dur else ""
    return (f"Lesson. A spoken lesson, transcribed by Whisper ({model}) on {rung}{dur}. "
            f"These are his words as Whisper heard them.\n\n{text.strip()}")


def note_transcript_body(text, rung, model, seconds):
    """The inbox row for a NOTE carries the proof, never the words."""
    dur = mmss(seconds)
    dur = f" ({dur})" if dur else ""
    return (f"Recorded note transcribed{dur}: {word_count(text)} words, by Whisper ({model}) on {rung}. "
            f"The words are in the person's own note, not here.")


def rung_name(url):
    host = urllib.parse.urlparse(url).hostname or url
    return "the 4070 tower" if rung_key(url) == "tlcmediadpt" else host


def rung_key(url):
    host = urllib.parse.urlparse(url).hostname or url
    return "tlcmediadpt" if any(host == k or host.startswith(k + ".") for k in TOWER_KEYS) else host


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


# --- a long recording on the CPU rung, carried across passes ------------------
# A conversation can run an hour; the NAS CPU cannot write an hour of words
# inside one 400-second pass. So the CPU rung stops at the pass's deadline,
# the words so far and the second it reached are kept here, and the next pass
# resumes from that second. Nothing is thrown away and no pass overruns.

def read_partial(data_dir, rid):
    try:
        with open(os.path.join(data_dir, "partial", f"{rid}.json"), encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return None


def write_partial(data_dir, rid, partial):
    d = os.path.join(data_dir, "partial")
    os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, f"{rid}.json"), "w", encoding="utf-8") as f:
        json.dump(partial, f)


def clear_partial(data_dir, rid):
    try:
        os.remove(os.path.join(data_dir, "partial", f"{rid}.json"))
    except OSError:
        pass


def merge_partial(prev, result):
    """Join the words kept so far with this pass's words (prev may be None)."""
    before = (prev or {}).get("text", "").strip()
    now = (result or {}).get("text", "").strip()
    text = (before + "\n" + now).strip() if before and now else (before or now)
    return {**(result or {}), "text": text}


# --- the run -------------------------------------------------------------------

def failure_row(row, kind, n, reason):
    rid = row["id"]
    if kind == "note":
        body = (f"A recorded note could not be transcribed after {n} tries. Last reason: {reason}. "
                f"The recording is kept on our own machine and is tried again when a Whisper rung is back.")
        tags = ["note", "voice-failed", f"of:{rid}"]
    else:
        body = (f"Lesson. A spoken lesson could not be transcribed after {n} tries. "
                f"Last reason: {reason}. The recording is kept; send it again or type it.")
        tags = ["lesson", "voice-failed", f"of:{rid}"]
    return {"instance_id": row["instance_id"], "created_by": row["created_by"],
            "body": body, "tags": tags, "source": "lesson-voice-transcribe"}


def run_once(io, data_dir=DATA, env=None, clock=time.monotonic):
    """One run. `io` carries every external call (list_rows, has_transcript,
    download, transcribe_ladder, insert_row, add_tags, delete_audio, put_text,
    rung_available), so the tests prove the whole road without a network.
    Returns an honest report."""
    report = {"ran": False, "transcribed": [], "in_progress": [], "failed": [], "skipped": [], "stopped": ""}
    if not acquire_lock(data_dir):
        report["stopped"] = "locked-skip"
        return report
    try:
        report["ran"] = True
        started = clock()
        attempts = read_attempts(data_dir)
        done = 0
        rows = list(io.list_rows())
        # A failed recording is worked on again once a rung is back, instead
        # of being left for dead (checked once per pass, only when one waits).
        retry_failed = False
        if any("voice-failed" in (r.get("tags") or []) and "voice-transcribed" not in (r.get("tags") or []) for r in rows):
            try:
                retry_failed = bool(io.rung_available())
            except Exception:
                retry_failed = False
        report["retry_failed"] = retry_failed
        for row in rows:
            if not needs_transcript(row, retry_failed=retry_failed):
                continue
            if done >= MAX_ITEMS_PER_RUN:
                report["stopped"] = "item-budget"
                break
            if clock() - started >= MAX_RUN_SECONDS:
                report["stopped"] = "time-budget"
                break
            rid = row["id"]
            kind = kind_of(row.get("tags"))
            path = audio_path_of(row.get("tags"))
            done += 1
            if io.has_transcript(rid):
                io.add_tags(row, ["voice-transcribed"])
                report["skipped"].append({"id": rid, "why": "transcript-already-filed"})
                continue
            try:
                local = io.download(path)
                prev = read_partial(data_dir, rid)
                deadline = started + MAX_RUN_SECONDS - 20
                result = io.transcribe_ladder(local, resume_at=float((prev or {}).get("resume_at", 0.0)), deadline=deadline) or {}
                if (result.get("resumed_from") or 0) > 0:
                    result = merge_partial(prev, result)
                if result.get("done") is False:
                    # The CPU rung reached the pass's deadline mid-recording:
                    # keep the words so far and the second reached.
                    write_partial(data_dir, rid, {"text": result.get("text", ""), "resume_at": result.get("resume_at", 0.0),
                                                  "model": result.get("model"), "rung": result.get("rung")})
                    report["in_progress"].append({"id": rid, "resume_at": result.get("resume_at"), "rung": result.get("rung")})
                    report["stopped"] = "time-budget"
                    break
                text = result.get("text", "").strip()
                if not text:
                    raise RuntimeError("empty-transcript: every Whisper rung returned no words")
                rung, model, secs = result.get("rung", "?"), result.get("model", "?"), result.get("duration_sec")
                rung_tag = f"whisper:{result.get('rung_key', 'unknown')}"
                if kind == "note":
                    # The words go to the owner's own folder; the inbox row is the proof.
                    nid = note_id_of(row.get("tags"))
                    io.put_text(transcript_text_path(path), text)
                    io.insert_row({
                        "instance_id": row["instance_id"],
                        "created_by": row["created_by"],
                        "body": note_transcript_body(text, rung, model, secs),
                        "tags": ["note", "voice-transcript", f"of:{rid}", rung_tag] + ([f"note:{nid}"] if nid else []),
                        "source": "lesson-voice-transcribe",
                    })
                else:
                    io.insert_row({
                        "instance_id": row["instance_id"],
                        "created_by": row["created_by"],
                        "body": transcript_body(text, rung, model, secs),
                        "tags": ["lesson", "voice-transcript", f"of:{rid}", rung_tag],
                        "source": "lesson-voice-transcribe",
                    })
                io.add_tags(row, ["voice-transcribed"])
                clear_partial(data_dir, rid)
                try:
                    io.delete_audio(path)  # the NAS keeps its copy; the cloud one was only a waiting room
                except Exception as e:  # the transcript is safe; a leftover cloud copy is reported, not fatal
                    report["skipped"].append({"id": rid, "why": f"cloud-copy-kept: {e}"})
                attempts.pop(rid, None)
                report["transcribed"].append({"id": rid, "kind": kind, "rung": rung, "model": model})
            except Exception as e:  # every external call is caught; the failure is counted and said
                n = int(attempts.get(rid, 0)) + 1
                attempts[rid] = n
                report["failed"].append({"id": rid, "attempt": n, "error": str(e)})
                if n >= MAX_ATTEMPTS:
                    attempts.pop(rid, None)
                    if "voice-failed" in (row.get("tags") or []):
                        continue  # said once already; it waits for the next rung, never re-announced
                    try:
                        io.insert_row(failure_row(row, kind, n, e))
                        io.add_tags(row, ["voice-failed"])
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


# THE GOVERNOR'S WORD CARRIED OVER (DR-0635). A member's lesson is captured
# only when it carries `lesson-approved`, written in the app by the Governor's
# review (migration 0237). The reader sees only the hosted copy, which was made
# before the review, so each decided row's decision tag is merged onto its
# hosted copy (same id) and the live row is marked `review-mirrored`. A row not
# yet mirrored carries its decision over with the ordinary mirror.
REVIEW_TAGS = ("lesson-approved", "lesson-declined")
LOCAL_ONLY_TAGS = ("mirrored", "review-mirrored")


def rows_to_sync_review(rows):
    out = []
    for r in rows or []:
        tags = r.get("tags") or []
        if "lesson" not in tags or "review-mirrored" in tags or "mirrored" not in tags:
            continue
        if not any(t in tags for t in REVIEW_TAGS):
            continue
        out.append(r)
    return out[:MAX_MIRROR_PER_RUN]


def sync_reviews_once(list_live, merge_hosted_tags, tag_live):
    """Carry each decision to the hosted copy; returns {synced, failed}. Never raises."""
    report = {"synced": [], "failed": []}
    try:
        rows = rows_to_sync_review(list_live())
    except Exception as e:
        report["failed"].append({"id": None, "error": f"list: {e}"})
        return report
    for r in rows:
        try:
            merge_hosted_tags(r["id"], [t for t in r.get("tags") or [] if t not in LOCAL_ONLY_TAGS])
            tag_live(r, ["review-mirrored"])
            report["synced"].append(r["id"])
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

    def list_reviewed_rows(self):
        out = []
        for tag in REVIEW_TAGS:
            q = "select=id,tags&tags=cs." + urllib.parse.quote(json.dumps(["lesson", tag])) + "&order=created_at.asc&limit=100"
            out.extend(json.loads(self._req("GET", "/rest/v1/agent_inbox?" + q).decode("utf-8")))
        return out

    def merge_tags(self, rid, extra):
        """Union `extra` into the row's tags on THIS project (the hosted copy)."""
        q = "select=id,tags&id=eq." + urllib.parse.quote(rid)
        rows = json.loads(self._req("GET", "/rest/v1/agent_inbox?" + q).decode("utf-8"))
        if not rows:
            raise RuntimeError("no hosted copy of " + rid)
        self.add_tags(rows[0], extra)

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

    def transcribe_ladder(self, local, resume_at=0.0, deadline=None):
        return transcribe_ladder(local, env=self.env, resume_at=resume_at, deadline=deadline)

    def rung_available(self):
        return rung_available(env=self.env)

    def put_text(self, path, text):
        # Service role; x-upsert so a retried pass overwrites, never duplicates.
        self._req("POST", f"/storage/v1/object/{BUCKET}/" + urllib.parse.quote(path), text.encode("utf-8"),
                  {"Content-Type": "text/plain; charset=utf-8", "x-upsert": "true"})

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


def local_whisper(local, model_size, resume_at=0.0, deadline=None, now=time.monotonic):
    """faster-whisper on this machine's CPU. Segments arrive lazily, so the
    pass stops cleanly at `deadline` and says where it reached (done=False,
    resume_at); the next pass starts there with clip_timestamps."""
    from faster_whisper import WhisperModel  # installed by install.sh when the NAS can take it
    model = WhisperModel(model_size, device="cpu", compute_type="int8")
    kw = {"beam_size": 5, "vad_filter": True}
    if resume_at and resume_at > 0:
        kw["clip_timestamps"] = [float(resume_at)]
    segments, info = model.transcribe(local, **kw)
    return consume_segments(segments, info, model_size, resume_at, deadline, now)


def consume_segments(segments, info, model_size, resume_at=0.0, deadline=None, now=time.monotonic):
    """Pure over the segment iterator (the tests feed it fakes)."""
    words, reached = [], float(resume_at or 0.0)
    for s in segments:
        t = (getattr(s, "text", "") or "").strip()
        if t:
            words.append(t)
        reached = float(getattr(s, "end", reached) or reached)
        if deadline is not None and now() >= deadline:
            return {"text": "\n".join(words), "model": model_size, "duration_sec": round(getattr(info, "duration", 0) or 0, 2),
                    "done": False, "resume_at": reached, "resumed_from": float(resume_at or 0.0)}
    return {"text": "\n".join(words), "model": model_size, "duration_sec": round(getattr(info, "duration", 0) or 0, 2),
            "done": True, "resume_at": reached, "resumed_from": float(resume_at or 0.0)}


def health_ok(url, timeout=6):
    try:
        with urllib.request.urlopen(url + "/health", timeout=timeout) as res:
            return 200 <= res.status < 300
    except Exception:
        return False


def cpu_rung_installed():
    try:
        import importlib.util
        return importlib.util.find_spec("faster_whisper") is not None
    except Exception:
        return False


def rung_available(env=None, health=health_ok, cpu=cpu_rung_installed):
    """Is any Whisper rung able to answer right now? (Gates the retry of a
    recording that failed while every rung was dark.)"""
    env = env if env is not None else os.environ
    if any(health(u) for u in whisper_urls(env)):
        return True
    return env.get("WHISPER_LOCAL", "1") != "0" and bool(cpu())


def transcribe_ladder(local, env=None, post=post_whisper, local_fn=local_whisper, resume_at=0.0, deadline=None, health=None):
    """Each network rung in order, then this machine's CPU. First words win.
    A network rung transcribes the whole recording in one call; the CPU rung
    may stop at the pass's deadline and return done=False with the second it
    reached, which run_once keeps and resumes from."""
    env = env if env is not None else os.environ
    errors = []
    # A dark rung is skipped after a 6-second /health, never waited on for the
    # 900-second transcription timeout (that would spend the whole pass).
    if health is None:
        health = health_ok if post is post_whisper else (lambda u: True)
    for url in whisper_urls(env):
        if not health(url):
            errors.append(f"{url}: no answer on /health")
            continue
        try:
            out = post(url, local)
            if (out or {}).get("text", "").strip():
                return {**out, "done": True, "resumed_from": 0.0, "rung": rung_name(url),
                        "rung_key": rung_key(url)}
            errors.append(f"{url}: no words")
        except Exception as e:
            errors.append(f"{url}: {e}")
    if env.get("WHISPER_LOCAL", "1") != "0":
        try:
            model = env.get("WHISPER_LOCAL_MODEL", LOCAL_MODEL_DEFAULT)
            try:
                out = local_fn(local, model, resume_at=resume_at, deadline=deadline)
            except TypeError:  # an older local_fn that takes (local, model) only
                out = local_fn(local, model)
            out = out or {}
            if out.get("text", "").strip() or out.get("done") is False or (resume_at or 0) > 0:
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
            out["review"] = sync_reviews_once(live.list_reviewed_rows, hosted.merge_tags, live.add_tags)
        else:
            out["mirror"] = {"skipped": "no hosted credential to mirror to"}
    print(json.dumps(out, indent=2))

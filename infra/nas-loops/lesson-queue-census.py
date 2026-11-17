#!/usr/bin/env python3
# =============================================================================
# lesson-queue-census.py -- the NAS counts its own lesson queue (DR-1360)
# =============================================================================
# THE ROAD THIS REVERSES. `inbox-lessons-waiting.yml` answers "what is waiting?"
# by reaching INTO this machine: join the tailnet, ssh in, `docker exec psql`.
# DR-1360 decided that direction is backwards -- "the NAS initiates every road;
# the lane never reaches in... A runner road that carries work INTO the NAS is
# retired as each is reversed" -- and Darrell's reason for it: "Why would I
# willingly want to depend on other systems... That can and do fail!!!"
#
# MEASURED, TWICE. The runner's key expired 2026-11-04 and all 64 workflows that
# join on it went red for two days (DR-1360). It expired again by 2026-11-10:
# `inbox-lessons-waiting.yml` failed three runs straight (11-06, 11-09, 11-10),
# so the PRIORITY lane's queue could not be read at all, and the `measure` check
# went red on main for the same reason. The queue is ON this machine; nothing
# about counting it needs a tailnet, a runner, or GitHub to be alive.
#
# So this counts the queue locally and writes ONE row the app already reads
# (agent_inbox, tagged lesson-queue-census), exactly as heartbeat.py does. The
# lane then reads a written answer instead of opening a road inward.
#
# NOT YET PROVEN, AND SAID SO (P66). A durable driver counts as working only
# when its first run is seen doing real work. This rides the services-sync clock
# (install-clock.sh), so it outlives every session and survives a reboot -- but
# the session that wrote it cannot watch it run, because the only road from the
# cloud to this machine is the expired key that caused the problem. The proof is
# a stamp appearing where `lib/lesson-queue-census.js` reads it, and the ledger
# below is what tells "ran but could not write" from "never ran". Until that
# stamp exists this is shipped-and-armed, never working.
#
# NEVER A BODY. A lesson holds a person's words. This writes counts and tag
# shapes only -- no body, no per-row length, no ids. The same rule
# `lesson-inbox-waiting.sql` states for its own output.
#
# ONE DEFINITION OF "WAITING" (DR-0725). The exclusions below are the ones
# `scripts/lesson-inbox-waiting.sql` applies, and `test_lesson_queue_census.py`
# PARSES that file and fails if the two ever drift. That test exists because a
# census taken on 2026-11-10 used an abbreviated list from a routine prompt --
# it omitted `not-a-lesson` and `withdrawn` -- and so counted as "waiting" rows
# a person had marked not a lesson or TAKEN BACK (DR-1142). An overcount of the
# queue is a plan to build from words somebody withdrew.
#
# BRAKES (DR-0248, P10): BUDGET -- at most one read and one write per cycle, no
# retry loop, no pagination beyond the one request. LOCK -- one row, patched in
# place, so a second run in the same cycle overwrites rather than accumulates.
# STOP -- `enabled: false` on its registry entry, which is deterministic logic
# the clock reads, and a missing credential is a named quiet no-op (exit 0) that
# never crashes the clock for the services beside it.
import json
import os
import platform
import re
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
TAG = "lesson-queue-census"
# Shared with scripts/lesson-inbox-waiting.sql; the test pins them together.
REQUIRED_TAG = "lesson"
EXCLUDED_TAGS = (
    "lesson-captured",
    "lesson-building",
    "awaiting-review",
    "not-a-lesson",
    "withdrawn",
)
DEFAULT_CREATED_BY = "c2a6c39a-ae99-4ff7-83c6-b927e2e7f1cc"
DEFAULT_SECRETS = "/volume1/PoeTech/secrets/supabase.json"
DEFAULT_HOME = "/volume1/PoeTech/lesson-queue-census"
# How a waiting row is grouped. A row's road is what sent it, and the shapes are
# the ones the builders branch on, so the census answers "what kind of work
# waits?" without carrying a single word of anyone's teaching.
ROADS = ("thinking-space", "lesson-voice-transcribe", "research-inbox", "chat-split")

# THE NAS LESSON BUILDER'S OWN STATE (DR-1514). Three of the six rows waiting on
# 2026-11-17 had failed ON THE BUILDER, and the only road to its state was
# `lesson-builder-status.sh --nas` -- ssh, behind the Tailscale key that has been
# refused since 2026-11-04. So a session could see THAT builds failed and never
# whether the builder was even running. The census already runs ON the box, so
# it reads these four local paths with no key and no ssh at all.
#
# WHAT MAY TRAVEL. This receipt is read over the PUBLIC road, so nothing here is
# passed through: a closed set for the service word, a hex sha, counts, and from
# status.json only booleans, small integers and ISO-shaped timestamps under a
# whitelist. No free text ever -- a builder's error string can quote the
# teaching it failed on, which is a person's own words.
# WHICH CODE ANSWERED (DR-1517). Measured 2026-11-17 09:11: DR-1516 taught the
# census to tell a member's row from Darrell's, and minutes later the read came
# back with four rows reading `ready`. That is consistent with TWO different
# worlds -- the new code running and those rows being his own, OR the old code
# still on the box and the owner check not yet in play -- and nothing in the
# payload could tell them apart. An answer whose code version is unknown cannot
# be acted on (DR-0076 section 8), so the census now says which code wrote it:
# the mirror's HEAD, the same value replay-on-clock reads for the same reason.
CENSUS_REPO = "/volume1/PoeTech/repos/Kingdom-PWA-Node"
BUILDER_HOME = "/volume1/PoeTech/lesson-builder"
BUILDER_UNIT = "poetech-lesson-builder"
# systemd's own vocabulary; anything else reads as "unknown", never as stopped.
SERVICE_WORDS = ("active", "inactive", "failed", "activating", "deactivating", "reloading")
# Keys of status.json that may be published AT ALL, and only when their value
# passes the shape test below. A key outside this set is counted, never named.
STATUS_KEYS = ("at", "ok", "attempts", "built", "failed", "skipped", "cycle_seconds")
# A git sha and an ISO stamp are STRUCTURE, not prose: neither can carry a
# sentence, which is why these two are the only strings allowed through.
HEX_SHA = re.compile(r"^[0-9a-f]{7,40}$")
ISO_AT = re.compile(r"^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}")


def rest(url, key, method, path, body=None, extra_headers=None):
    headers = {
        "apikey": key,
        "Authorization": "Bearer " + key,
        "Content-Type": "application/json",
    }
    if extra_headers:
        headers.update(extra_headers)
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(
        url + "/rest/v1/" + path, data=data, headers=headers, method=method
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        raw = resp.read().decode("utf-8", "ignore")
    return json.loads(raw) if raw.strip() else None


def waiting_query(select="id,created_at,source,tags,created_by"):
    """The ONE definition, as PostgREST filters. Same five exclusions as the SQL."""
    parts = [
        "agent_inbox?select=" + select,
        "tags=cs." + urllib.parse.quote(json.dumps([REQUIRED_TAG])),
    ]
    for tag in EXCLUDED_TAGS:
        parts.append("tags=not.cs." + urllib.parse.quote(json.dumps([tag])))
    parts.append("order=created_at.asc")
    return "&".join(parts)


def shape_of(row):
    """What kind of waiting row this is, from its tags alone -- never its body."""
    tags = row.get("tags") or []
    tags = tags if isinstance(tags, list) else []
    if "voice-failed" in tags:
        return "voice-failed"
    if "voice-transcript" in tags:
        return "voice-transcript"
    if "voice" in tags:
        return "voice-waiting-for-words"
    if "build-failed" in tags:
        return "build-failed"
    if "newsletter-item" in tags:
        return "newsletter-item"
    if "canary" in tags:
        return "canary"
    return "plain"


# WHY A FAILED BUILD FAILED, AS A CLASS AND NEVER AS ITS TEXT (2026-11-12).
# Measured the same day: the census reported `build-failed: 3` for an hour while
# the tailnet was shut, and that number cannot be acted on. `rate-limited` and
# `transient` heal themselves -- lesson_builder.eligibility() reads the class
# back off the front of the tag and retries -- while anything else is stuck and
# wants a person. One word tells those apart; the count alone cannot.
#
# IT READS THE CLASSIFIER ONLY, never the reason's text. lesson_builder's
# reason_tag() puts the class FIRST precisely so it survives the 200-character
# cut, and the rest of that string can quote a gate error that carries a
# person's words -- so the rest is not read here and never leaves the house.
# A class name is a tag shape, which is what this file is permitted to emit.
STALLS = ("rate-limited", "transient")


def stall_of(row):
    """For a build-failed row: 'rate-limited', 'transient' or 'other'."""
    tags = row.get("tags") or []
    tags = tags if isinstance(tags, list) else []
    for t in tags:
        if not isinstance(t, str) or not t.startswith("build-reason:"):
            continue
        why = t[len("build-reason:"):].strip().lower()
        for cls in STALLS:
            if why.startswith(cls):
                return cls
        return "other"
    return "other"


# WHY A ROW IS STILL WAITING, AND HOW MANY TRIES IT HAS HAD (DR-1515).
# Measured 2026-11-17, the first read with 0327's builder block live: the
# builder was `active`, `building now: 0`, its own record 14 minutes fresh --
# and three teachings had waited five days. Reading
# lesson_builder.eligibility() explained it: past LESSON_BUILD_MAX_ATTEMPTS a
# row is "left for the hourly Routine" ON PURPOSE. The handoff works. Nothing
# on the public road said so, and four more rows read `plain`, which means only
# "none of the special tags" -- so a row nobody has touched looked exactly like
# one the builder had handed over and was waiting on. Those ask for different
# acts from a reader.
#
# THE THRESHOLD IS NOT COPIED HERE. MAX_ATTEMPTS is the builder's, settable by
# its own environment, and two files computing one number is how they drift
# (the lesson this repository already wrote about `Next ID`). So the ATTEMPT
# COUNT travels and the comparison is the reader's.
#
# Codes only, from the tags, never a reason's text: a verdict is a tag shape,
# which is what this file may emit.
WHYS = ("declined", "waits-for-governor", "deferred", "rate-limited", "failed", "ready")
# Darrell's own two accounts (lesson_builder.OWNER_IDS). A row from anyone else
# is a MEMBER's teaching and is never built without `lesson-approved` (DR-0635),
# so it is not the builder neglecting it -- it waits for the Governor. The ids
# are compared HERE and never published: what travels is one word.
OWNER_IDS = (
    "f13843f2-742b-4f8a-82af-7ecfbdc536ec",
    "c2a6c39a-ae99-4ff7-83c6-b927e2e7f1cc",
)


def attempts_of(row):
    """How many times a build of this row has FAILED, from its stage tags."""
    tags = row.get("tags") or []
    tags = tags if isinstance(tags, list) else []
    n = 0
    for tag in tags:
        if isinstance(tag, str) and tag.startswith("build:failed@"):
            n += 1
    return n


def why_of(row):
    """Why this row still waits, as one word from WHYS.

    Mirrors the ORDER of lesson_builder.eligibility()'s remaining branches for
    a row this census already counts as waiting (captured, withdrawn, building,
    awaiting-review and not-a-lesson are excluded before they reach here).
    `failed` carries no judgment about exhaustion -- `attempts` is published
    beside it so the reader compares against the builder's own threshold.

    `ready` means NOTHING IN THE TAGS OR THE OWNER CHECK BLOCKS IT -- not that
    the builder will certainly take it. One branch of eligibility() is
    deliberately NOT mirrored: it refuses a row with no words, and testing that
    would mean reading the body this file must never read. So `ready` can still
    be refused for emptiness, and that limit is stated rather than hidden.
    """
    tags = row.get("tags") or []
    tags = tags if isinstance(tags, list) else []
    if "lesson-declined" in tags:
        return "declined"
    # MEASURED AND CORRECTED 2026-11-17, the first read with verdicts live: four
    # rows said `ready` while the builder sat active and idle, which read as the
    # builder neglecting them. It was this branch missing. A member's row is
    # never built without `lesson-approved`, so `ready` was overclaiming on the
    # one case where it matters most -- somebody else's teaching.
    if str(row.get("created_by") or "") not in OWNER_IDS and "lesson-approved" not in tags:
        return "waits-for-governor"
    if any(isinstance(x, str) and x.startswith("build:deferred@") for x in tags):
        return "deferred"
    if attempts_of(row):
        return "rate-limited" if stall_of(row) == "rate-limited" else "failed"
    return "ready"


def _service_word(run):
    """systemd's word for the builder unit, or 'unknown'. Never 'inactive' on error."""
    try:
        out = run(["systemctl", "is-active", BUILDER_UNIT])
    # DELIBERATELY BLIND. The census must not die because it could not ask a
    # service word, and every outcome here is the same one: unknown, never
    # stopped. Narrowing this would only let a new exception type kill the
    # whole census for the least important field it publishes.
    except Exception:  # noqa: BLE001
        return "unknown"
    word = (out or "").strip().split("\n")[0].strip()
    return word if word in SERVICE_WORDS else "unknown"


def _status_fields(raw):
    """The publishable fields of status.json: whitelisted keys, shape-tested values.

    Returns (fields, dropped) where `dropped` counts what was refused, so a
    reader is told something was withheld rather than shown a short list that
    looks complete.
    """
    fields, dropped = {}, 0
    if not isinstance(raw, dict):
        return fields, dropped
    for k, v in raw.items():
        if k not in STATUS_KEYS:
            dropped += 1
            continue
        if isinstance(v, bool) or (isinstance(v, int) and -1 <= v <= 100000):
            fields[k] = v
        elif k == "at" and isinstance(v, str) and ISO_AT.match(v):
            # The stamp only, never a free string: a timestamp cannot carry a
            # sentence, and this one is what tells a reader whether the
            # builder's own record is current or stale.
            fields[k] = v
        else:
            dropped += 1
    return fields, dropped


def builder_state(home=BUILDER_HOME, run=None):
    """The builder's own state, read locally with no key (DR-1514).

    Every source is reported as read or NOT read. A path this cannot open is
    `null` with `read: false`, never a zero or a reassuring default: an
    unreadable builder is not an idle builder (DR-0076 section 8).
    """
    if run is None:

        def run(argv):
            # Imported here, not at the top: only the NAS path ever needs it.
            import subprocess

            return subprocess.run(
                argv, capture_output=True, text=True, timeout=10, check=False
            ).stdout

    state = {"service": _service_word(run), "read": {}}

    sha = None
    try:
        with open(os.path.join(home, ".code.sha"), encoding="utf-8") as fh:
            cand = fh.read().strip()
        sha = cand if HEX_SHA.match(cand) else None
        state["read"]["code_sha"] = True
    except OSError:
        state["read"]["code_sha"] = False
    state["code_sha"] = sha

    try:
        names = os.listdir(os.path.join(home, "locks"))
        # The COUNT, never the names: a lock file is named for the row it holds,
        # and a row this census did not count as waiting would otherwise be
        # published by a path nobody reviewed for it.
        state["building"] = len(names)
        state["read"]["building"] = True
    except OSError:
        state["building"] = None
        state["read"]["building"] = False

    try:
        with open(os.path.join(home, "status.json"), encoding="utf-8") as fh:
            raw = json.load(fh)
        fields, dropped = _status_fields(raw)
        state["status"] = fields
        state["status_withheld"] = dropped
        state["read"]["status"] = True
    except (OSError, ValueError):
        state["status"] = None
        state["status_withheld"] = None
        state["read"]["status"] = False

    return state


def census_code_sha(repo=None, run=None):
    """The mirror HEAD the census is running from, or None when it cannot be read.

    None rather than a guess: a reader must be able to tell "this came from code
    I can name" from "I do not know which code answered".
    """
    if run is None:

        def run(argv):
            # Imported here, not at the top: only the NAS path ever needs it.
            import subprocess

            return subprocess.run(
                argv, capture_output=True, text=True, timeout=10, check=False
            ).stdout

    try:
        out = run(["git", "-C", repo or CENSUS_REPO, "rev-parse", "HEAD"])
    # DELIBERATELY BLIND, as the service word is: the census must not die for
    # failing to name itself, and every failure means the same thing -- unknown.
    except Exception:  # noqa: BLE001
        return None
    cand = (out or "").strip().split("\n")[0].strip()
    return cand if HEX_SHA.match(cand) else None


def census_of(rows, now=None, builder=None, code_sha=None):
    """Counts by road and by shape, the oldest wait, and WHICH rows wait. No bodies, no tags."""
    rows = rows or []
    by_road = {}
    by_shape = {}
    by_stall = {}
    waiting = []
    for r in rows:
        road = r.get("source") or ""
        bucket = road if road in ROADS else "other"
        by_road[bucket] = by_road.get(bucket, 0) + 1
        shape = shape_of(r)
        by_shape[shape] = by_shape.get(shape, 0) + 1
        if shape == "build-failed":
            cls = stall_of(r)
            by_stall[cls] = by_stall.get(cls, 0) + 1
        # WHICH ROWS WAIT, not only how many (DR-1511). The counts could say
        # five teachings waited and never which five, so a session that cannot
        # join the tailnet could DESCRIBE the queue and not act on it -- it
        # could not even run the already-shipped sweep, which takes row ids.
        # The NAS road that names rows needs a Tailscale key; this receipt
        # rides the public road and does not (DR-1269's lesson, applied again).
        #
        # NEVER A TAG, and the reason is not tidiness: a tag can carry
        # `lesson-name:<a member's name>` (DR-0639), and this receipt is read
        # over the PUBLIC road. So the row's CLASS travels and its tags do
        # not. Never a body either -- the census never reads that column.
        entry = {
            "id": r.get("id"),
            "created_at": r.get("created_at"),
            # The BUCKETED road, the same one by_road counts, never the raw
            # column: an unexpected source string would otherwise be published
            # verbatim over the public road, and the two readings of the same
            # queue would disagree about which road a row came in by.
            "source": bucket,
            "shape": shape,
        }
        if shape == "build-failed":
            entry["stall"] = stall_of(r)
        # WHY it waits, and how many tries it has had (DR-1515). `ready` means
        # the builder should take it; `deferred` and an exhausted `failed` mean
        # it was handed to the hourly Routine on purpose.
        entry["why"] = why_of(r)
        entry["attempts"] = attempts_of(r)
        waiting.append(entry)
    oldest = None
    for r in rows:
        at = r.get("created_at")
        if isinstance(at, str) and at and (oldest is None or at < oldest):
            oldest = at
    utc = timezone.utc  # noqa: UP017
    stamped = (
        (now or datetime.now(utc)).astimezone(utc).isoformat().replace("+00:00", "Z")
    )
    return {
        "at": stamped,
        "host": platform.node(),
        "cycle": "services-sync",
        "total": len(rows),
        "by_road": by_road,
        "by_shape": by_shape,
        # Only the build-failed rows appear here, so it sums to by_shape's
        # build-failed count and is empty when nothing has failed.
        "by_stall": by_stall,
        "oldest_waiting": oldest,
        # id, created_at, source and class per row. No tags, no body.
        "waiting": waiting,
        # The builder's own state, so "3 build-failed" can be read against
        # whether the thing that builds is even running (DR-1514). Omitted
        # rather than faked when the caller did not gather it.
        **({"builder": builder} if builder is not None else {}),
        # WHICH CODE WROTE THIS (DR-1517). Without it a verdict cannot be read:
        # `ready` means different things before and after DR-1516's owner check,
        # and nothing else in the payload distinguishes them. Absent, never
        # faked, when the caller did not gather it.
        **({"code_sha": code_sha} if code_sha is not None else {}),
        # The definition travels WITH the count, so a reader can tell which
        # question was asked and never has to assume it was this one.
        "excludes": list(EXCLUDED_TAGS),
    }


def write_ledger(home, what, body=None, error=None):
    """last-run.json, so a cycle that ran but could not write is told from one that never ran."""
    try:
        os.makedirs(home, exist_ok=True)
        entry = json.loads(body) if body else {}
        entry.update({"what": what, "error": error})
        if "at" not in entry:
            entry["at"] = census_of([])["at"]
        tmp = os.path.join(home, "last-run.json.tmp")
        with open(tmp, "w", encoding="utf-8") as fh:
            json.dump(entry, fh)
        os.replace(tmp, os.path.join(home, "last-run.json"))
        return True
    except (OSError, ValueError):
        return False


def resolve_instance(url, key, slug):
    rows = rest(
        url, key, "GET", "instances?select=id&slug=eq." + urllib.parse.quote(slug)
    )
    return rows[0]["id"] if rows else None


def existing_row(url, key, instance_id):
    rows = rest(
        url,
        key,
        "GET",
        "agent_inbox?select=id&instance_id=eq."
        + instance_id
        + "&tags=cs."
        + urllib.parse.quote(json.dumps([TAG]))
        + "&order=created_at.desc&limit=1",
    )
    return rows[0]["id"] if rows else None


def publish(url, key, instance_id, body, created_by):
    """PATCH the existing census row, or INSERT the first. Returns 'patched' | 'inserted'."""
    row_id = existing_row(url, key, instance_id)
    if row_id:
        rest(
            url,
            key,
            "PATCH",
            "agent_inbox?id=eq." + row_id,
            body={"body": body, "created_at": json.loads(body)["at"]},
            extra_headers={"Prefer": "return=minimal"},
        )
        return "patched"
    rest(
        url,
        key,
        "POST",
        "agent_inbox",
        body=[
            {
                "instance_id": instance_id,
                "body": body,
                # lesson-captured so the census row can never itself read as a
                # waiting lesson: it carries no teaching and must not be built.
                "tags": [TAG, "lesson-captured"],
                "source": "nas-loops",
                "created_by": created_by,
            }
        ],
        extra_headers={"Prefer": "return=minimal"},
    )
    return "inserted"


def main():
    secrets = os.environ.get("SUPABASE_SECRETS", DEFAULT_SECRETS)
    home = os.environ.get("CENSUS_HOME", DEFAULT_HOME)
    sys.path.insert(0, os.path.join(HERE, "..", "nas-supabase"))
    try:
        from sovereign_target import load_target

        url, key = load_target(secrets, quiet=True)
    except (ImportError, OSError, ValueError, KeyError) as e:
        url = key = None
        why = e.__class__.__name__
    else:
        why = "empty target"
    if not url or not key:
        write_ledger(home, "no-credential", error=why)
        print(f"lesson-queue-census: no credential ({why}) - quiet no-op")
        return 0
    slug = os.environ.get("TRANSCRIPTS_SLUG", "colg")
    try:
        instance_id = resolve_instance(url, key, slug)
        if not instance_id:
            write_ledger(home, "no-instance", error=f"no instance with slug '{slug}'")
            print(f"lesson-queue-census: no instance with slug '{slug}'")
            return 1
        rows = rest(url, key, "GET", waiting_query()) or []
        body = json.dumps(
            census_of(rows, builder=builder_state(), code_sha=census_code_sha())
        )
        what = publish(
            url,
            key,
            instance_id,
            body,
            os.environ.get("CENSUS_CREATED_BY", DEFAULT_CREATED_BY),
        )
    except (OSError, ValueError, KeyError, IndexError) as e:
        write_ledger(home, "error", error=f"{e.__class__.__name__}: {e}"[:300])
        print(f"lesson-queue-census: error {e.__class__.__name__}: {e}")
        return 1
    write_ledger(home, what, body)
    print(f"lesson-queue-census: {what} {body}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

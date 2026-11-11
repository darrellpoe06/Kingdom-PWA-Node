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


def waiting_query(select="id,created_at,source,tags"):
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


def census_of(rows, now=None):
    """Counts by road and by shape, plus the oldest wait. No ids, no bodies."""
    rows = rows or []
    by_road = {}
    by_shape = {}
    for r in rows:
        road = r.get("source") or ""
        bucket = road if road in ROADS else "other"
        by_road[bucket] = by_road.get(bucket, 0) + 1
        shape = shape_of(r)
        by_shape[shape] = by_shape.get(shape, 0) + 1
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
        "oldest_waiting": oldest,
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
        body = json.dumps(census_of(rows))
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

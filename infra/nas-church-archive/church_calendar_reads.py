#!/usr/bin/env python3
# =============================================================================
# church_calendar_reads.py — the office's pictures onto the calendar's days,
# run ON THE NAS (DR-1628)
# =============================================================================
# Two halves around the read the runner makes (scripts/church-calendar-read.mjs):
#
#   pull <folder> [--max N]
#       Writes <folder>/manifest.json + <folder>/files/<sha256>.<ext> for the
#       calendars and flyers the church archive holds (0342: site, Wayback,
#       office uploads) that have NOT been read onto the calendar yet
#       (church_calendar_reads, 0343), newest month first, at most N.
#   file <folder>
#       Reads <folder>/reads.json ([{ sha256, events: [...] }]) and files each
#       through church_calendar_keep_read() (0343): once per picture, insert
#       only, never doubling an event already on its day.
#
# Talks only to kong on 127.0.0.1 with the box's own service key, read from
# the Supabase .env (never printed). Stdlib only. Exit 1 if anything failed,
# so the run is visibly red (DR-0076).
#
# Selftest (pure logic, no network):  python3 church_calendar_reads.py --selftest
# =============================================================================
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

KONG = os.environ.get("KONG_URL", "http://127.0.0.1:8800")
SUPA_ENV = os.environ.get("SUPABASE_DATA", "/volume1/docker/supabase") + "/.env"
BUCKET = "church-archive"
TIMEOUT_S = 30
MAX_DEFAULT = 6
PATH_RE = re.compile(r"^[0-9a-f-]{36}/[0-9a-f]{64}\.(jpeg|png|gif|webp)$")
SHA_RE = re.compile(r"^[0-9a-f]{64}$")


# ---- pure logic (the selftest pins all of it) --------------------------------


def env_value(text, name):
    """The value of NAME=... in a .env text, quotes stripped, or ''."""
    for line in text.splitlines():
        line = line.strip()
        if line.startswith(name + "="):
            return line[len(name) + 1 :].strip().strip('"').strip("'")
    return ""


def unread(rows, read_shas, limit):
    """Archive rows (calendar/flyer) not yet read, newest month first, calendars before flyers."""
    done = {str(s).lower() for s in read_shas}
    out = []
    for r in rows or []:
        if not isinstance(r, dict) or r.get("kind") not in ("calendar", "flyer"):
            continue
        sha = str(r.get("sha256", "")).lower()
        if not SHA_RE.match(sha) or sha in done:
            continue
        if not PATH_RE.match(str(r.get("storage_path", ""))):
            continue
        out.append(r)
    out.sort(
        key=lambda r: (
            -(int(r.get("for_year", 0)) * 12 + int(r.get("for_month", 1))),
            0 if r["kind"] == "calendar" else 1,
            r["sha256"],
        )
    )
    return out[: max(0, int(limit))]


def manifest_item(r):
    return {
        "kind": r["kind"],
        "sha256": r["sha256"].lower(),
        "title": r.get("title", ""),
        "for_year": int(r["for_year"]),
        "for_month": int(r["for_month"]),
        "content_type": r["content_type"],
        "file": r["storage_path"].split("/", 1)[1],
    }


def read_problem(entry):
    """Why a read may not be filed, or '' when it may."""
    if not isinstance(entry, dict):
        return "not an object"
    if not SHA_RE.match(str(entry.get("sha256", "")).lower()):
        return "no content hash"
    if not isinstance(entry.get("events"), list):
        return "events are not a list"
    if len(entry["events"]) > 120:
        return "more events than one picture holds"
    return ""


# ---- the network -------------------------------------------------------------


def call(method, path, key, body=None):
    data = None if body is None else json.dumps(body).encode("utf-8")
    req = urllib.request.Request(KONG + path, data=data, method=method)
    req.add_header("apikey", key)
    req.add_header("Authorization", "Bearer " + key)
    if body is not None:
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT_S) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()
    except Exception as e:  # noqa: BLE001 - every other failure is reported, never raised
        return 0, str(e).encode("utf-8")


def service_key():
    try:
        with open(SUPA_ENV, encoding="utf-8") as f:
            return env_value(f.read(), "SERVICE_ROLE_KEY")
    except OSError:
        return ""


def instance_of(slug, key):
    st, bd = call(
        "GET", "/rest/v1/instances?select=id&slug=eq." + urllib.parse.quote(slug), key
    )
    rows = json.loads(bd or b"[]") if st == 200 else []
    return rows[0]["id"] if rows else ""


def pull(folder, slug, limit):
    key = service_key()
    if not key:
        print(f"::error::SERVICE_ROLE_KEY not readable in {SUPA_ENV} - nothing pulled")
        return 2
    instance = instance_of(slug, key)
    if not instance:
        print(f"::error::no church instance with slug {slug}")
        return 4
    q = (
        "/rest/v1/church_site_archive?select=sha256,kind,title,for_year,for_month,"
        "content_type,storage_path&kind=in.(calendar,flyer)&instance_id=eq." + instance
    )
    st, bd = call("GET", q, key)
    if st != 200:
        print(f"::error::the archive could not be read (HTTP {st})")
        return 5
    rows = json.loads(bd or b"[]")
    st, bd = call(
        "GET",
        "/rest/v1/church_calendar_reads?select=sha256&instance_id=eq." + instance,
        key,
    )
    if st != 200:
        print(
            f"::error::church_calendar_reads could not be read (HTTP {st}); is 0343 applied?"
        )
        return 5
    done = [r["sha256"] for r in json.loads(bd or b"[]")]
    picked = unread(rows, done, limit)
    os.makedirs(os.path.join(folder, "files"), exist_ok=True)
    items, failed = [], []
    for r in picked:
        st, bd = call("GET", f"/storage/v1/object/{BUCKET}/{r['storage_path']}", key)
        if st != 200 or not bd:
            failed.append((r["sha256"], f"bytes not read (HTTP {st})"))
            continue
        it = manifest_item(r)
        with open(os.path.join(folder, "files", it["file"]), "wb") as f:
            f.write(bd)
        items.append(it)
    with open(os.path.join(folder, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump({"slug": slug, "items": items}, f, indent=2)
    total_unread = len(unread(rows, done, 10**6))
    print(
        f"PULL-RESULT archive={len(rows)} read-before={len(done)} unread={total_unread} pulled={len(items)} failed={len(failed)}"
    )
    for sha, why in failed:
        print(f"::error::{sha[:12]}: {why}")
    return 1 if failed else 0


def file_reads(folder, slug):
    key = service_key()
    if not key:
        print(f"::error::SERVICE_ROLE_KEY not readable in {SUPA_ENV} - nothing filed")
        return 2
    path = os.path.join(folder, "reads.json")
    if not os.path.exists(path):
        print("READ-RESULT filed=0 (no reads this run)")
        return 0
    with open(path, encoding="utf-8") as f:
        reads = json.load(f)
    filed = already = added = 0
    failed = []
    for entry in reads if isinstance(reads, list) else []:
        problem = read_problem(entry)
        if problem:
            failed.append((str(entry)[:40], problem))
            continue
        st, bd = call(
            "POST",
            "/rest/v1/rpc/church_calendar_keep_read",
            key,
            {
                "slug_in": slug,
                "item_in": {"sha256": entry["sha256"].lower()},
                "events_in": entry["events"],
            },
        )
        if st != 200:
            failed.append(
                (
                    entry["sha256"][:12],
                    "not filed (HTTP {}): {}".format(
                        st, bd[:160].decode("utf-8", "replace")
                    ),
                )
            )
            continue
        ans = json.loads(bd or b"{}")
        if ans.get("result") == "already":
            already += 1
        else:
            filed += 1
            added += int(ans.get("added", 0))
            print(
                f"filed: {entry['sha256'][:12]} read={ans.get('read')} added={ans.get('added')}"
            )
    print(
        f"READ-RESULT filed={filed} already={already} events-added={added} failed={len(failed)}"
    )
    for who, why in failed:
        print(f"::error::{who}: {why}")
    return 1 if failed else 0


# ---- selftest ----------------------------------------------------------------


def selftest():
    inst = "10000000-0000-4000-b000-000000000343"

    def row(kind, sha, y, m):
        return {
            "kind": kind,
            "sha256": sha * 64,
            "for_year": y,
            "for_month": m,
            "title": "t",
            "content_type": "image/jpeg",
            "storage_path": f"{inst}/{sha * 64}.jpeg",
        }

    rows = [
        row("flyer", "a", 2026, 11),
        row("calendar", "b", 2026, 11),
        row("calendar", "c", 2025, 11),
        row("letter", "d", 2026, 11),
        row("flyer", "e", 2026, 10),
        dict(row("flyer", "f", 2026, 12), storage_path="../../etc/passwd"),
    ]
    got = unread(rows, ["E" * 64], 10)
    assert [r["sha256"][0] for r in got] == ["b", "a", "c"], got
    assert [r["sha256"][0] for r in unread(rows, [], 2)] == ["b", "a"]
    assert unread(rows, [], 0) == []
    it = manifest_item(rows[1])
    assert it["file"] == "b" * 64 + ".jpeg" and it["kind"] == "calendar"
    assert read_problem({"sha256": "a" * 64, "events": []}) == ""
    assert read_problem({"sha256": "x", "events": []}) == "no content hash"
    assert read_problem({"sha256": "a" * 64, "events": {}}) == "events are not a list"
    assert (
        read_problem({"sha256": "a" * 64, "events": [{}] * 121})
        == "more events than one picture holds"
    )
    assert env_value('SERVICE_ROLE_KEY="k"', "SERVICE_ROLE_KEY") == "k"
    print("church_calendar_reads selftest: PASS")
    return 0


if __name__ == "__main__":
    args = sys.argv[1:]
    if args[:1] == ["--selftest"]:
        sys.exit(selftest())
    slug = os.environ.get("CHURCH_SLUG", "colg")
    if len(args) >= 2 and args[0] == "pull":
        n = MAX_DEFAULT
        if "--max" in args:
            n = int(args[args.index("--max") + 1])
        sys.exit(pull(args[1], slug, n))
    if len(args) >= 2 and args[0] == "file":
        sys.exit(file_reads(args[1], slug))
    print(
        "usage: church_calendar_reads.py pull <folder> [--max N] | file <folder> | --selftest"
    )
    sys.exit(2)

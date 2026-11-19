#!/usr/bin/env python3
# =============================================================================
# church_archive_keep.py — the daily reader's second half, run ON THE NAS
# (DR-1596)
# =============================================================================
# Given the folder the collector wrote (manifest.json + files/<sha256>.<ext>),
# keeps each picture in the sovereign Supabase the app reads:
#   1. the bytes into the private `church-archive` bucket at
#      <instance_id>/<sha256>.<ext> (an object already there is the same
#      content by construction: the name IS the hash, so it is not re-sent);
#   2. one row through church_site_archive_keep() (migration 0342), which
#      answers 'kept' for a picture not held before and 'seen' for one held.
# Bytes first, row second: a row never points at bytes that are not there.
#
# Talks only to kong on 127.0.0.1 with the box's own service key, read from
# the Supabase .env (never printed). Stdlib only. Exit 1 if any item failed,
# so the run is visibly red (DR-0076).
#
# Selftest (pure logic, no network):  python3 church_archive_keep.py --selftest
# =============================================================================
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

KONG = os.environ.get("KONG_URL", "http://127.0.0.1:8800")
SUPA_ENV = os.environ.get("SUPABASE_DATA", "/volume1/docker/supabase") + "/.env"
BUCKET = "church-archive"
TIMEOUT_S = 30
EXT = {"image/jpeg": "jpeg", "image/png": "png", "image/gif": "gif", "image/webp": "webp"}
KINDS = ("calendar", "letter", "flyer")


# ---- pure logic (the selftest pins all of it) --------------------------------

def env_value(text, name):
    """The value of NAME=... in a .env text, quotes stripped, or ''."""
    for line in text.splitlines():
        line = line.strip()
        if line.startswith(name + "="):
            return line[len(name) + 1:].strip().strip('"').strip("'")
    return ""


def object_name(instance_id, item):
    return "{}/{}.{}".format(instance_id, item["sha256"].lower(), EXT[item["content_type"]])


def item_problem(item):
    """Why an item may not be kept, or '' when it may."""
    if not isinstance(item, dict):
        return "not an object"
    if item.get("kind") not in KINDS:
        return "unknown kind"
    sha = str(item.get("sha256", ""))
    if len(sha) != 64 or any(c not in "0123456789abcdef" for c in sha.lower()):
        return "no content hash"
    if item.get("content_type") not in EXT:
        return "not a picture type"
    if item.get("file") != "{}.{}".format(sha.lower(), EXT[item["content_type"]]):
        return "file name is not its hash"
    if not str(item.get("source_path", "")).startswith("/uploads/"):
        return "not one of the site's own uploads"
    return ""


def already_there(status, body):
    """storage-api answers a duplicate object 409, or 400 with statusCode 409 / 'Duplicate' in the body."""
    if status == 409:
        return True
    text = body.decode("utf-8", "replace") if isinstance(body, bytes) else str(body)
    return status == 400 and ('"statusCode":"409"' in text or "Duplicate" in text or "already exists" in text)


def keep_payload(slug, item):
    row = {k: v for k, v in item.items() if k != "file"}
    return {"slug_in": slug, "item_in": row}


# ---- the network -------------------------------------------------------------

def call(method, path, key, body=None, headers=None):
    data = body if isinstance(body, (bytes, type(None))) else json.dumps(body).encode("utf-8")
    req = urllib.request.Request(KONG + path, data=data, method=method)
    req.add_header("apikey", key)
    req.add_header("Authorization", "Bearer " + key)
    if not isinstance(body, bytes) and body is not None:
        req.add_header("Content-Type", "application/json")
    for k, v in (headers or {}).items():
        req.add_header(k, v)
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT_S) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()
    except Exception as e:  # noqa: BLE001 - every other failure is reported, never raised
        return 0, str(e).encode("utf-8")


def main(folder):
    with open(os.path.join(folder, "manifest.json"), encoding="utf-8") as f:
        manifest = json.load(f)
    try:
        with open(SUPA_ENV, encoding="utf-8") as f:
            key = env_value(f.read(), "SERVICE_ROLE_KEY")
    except OSError:
        key = ""
    if not key:
        print("::error::SERVICE_ROLE_KEY not readable in {} - nothing kept".format(SUPA_ENV))
        return 2
    slug = manifest.get("slug", "colg")

    status, body = call("POST", "/storage/v1/bucket", key, {"id": BUCKET, "name": BUCKET, "public": False})
    if status not in (200, 201) and not already_there(status, body):
        print("::error::the {} bucket could not be made (HTTP {})".format(BUCKET, status))
        return 3
    status, body = call("GET", "/rest/v1/instances?select=id&slug=eq." + urllib.parse.quote(slug), key)
    rows = json.loads(body or b"[]") if status == 200 else []
    if not rows:
        print("::error::no church instance with slug {} (HTTP {})".format(slug, status))
        return 4
    instance = rows[0]["id"]

    kept = seen = 0
    failed = []
    for item in manifest.get("items", []):
        problem = item_problem(item)
        if problem:
            failed.append((item.get("source_path", "?"), problem))
            continue
        with open(os.path.join(folder, "files", item["file"]), "rb") as f:
            data = f.read()
        name = object_name(instance, item)
        st, bd = call("POST", "/storage/v1/object/{}/{}".format(BUCKET, name), key, data,
                      {"Content-Type": item["content_type"], "x-upsert": "false"})
        if st not in (200, 201) and not already_there(st, bd):
            failed.append((item["source_path"], "bytes not stored (HTTP {})".format(st)))
            continue
        st, bd = call("POST", "/rest/v1/rpc/church_site_archive_keep", key, keep_payload(slug, item))
        answer = bd.decode("utf-8", "replace").strip().strip('"') if st == 200 else ""
        if answer == "kept":
            kept += 1
            print("kept: {} {}-{:02d} {}".format(item["kind"], item["for_year"], item["for_month"], item["source_path"]))
        elif answer == "seen":
            seen += 1
        else:
            failed.append((item["source_path"], "row not kept (HTTP {}): {}".format(st, bd[:160].decode("utf-8", "replace"))))

    # PROOF, not a claim: the rows the church now holds, read back.
    st, bd = call("GET", "/rest/v1/church_site_archive?select=id&instance_id=eq." + instance, key)
    held = len(json.loads(bd or b"[]")) if st == 200 else "unread (HTTP {})".format(st)
    print("ARCHIVE-RESULT kept={} seen={} failed={} held-now={}".format(kept, seen, len(failed), held))
    for path, why in failed:
        print("::error::{}: {}".format(path, why))
    return 1 if failed else 0


# ---- selftest ----------------------------------------------------------------

def selftest():
    sha = "a" * 64
    item = {"kind": "flyer", "sha256": sha, "content_type": "image/jpeg", "file": sha + ".jpeg",
            "source_path": "/uploads/6/0/6/7/6067835/x.jpg", "for_year": 2026, "for_month": 11}
    assert env_value('A=1\nSERVICE_ROLE_KEY="k.e.y"\n', "SERVICE_ROLE_KEY") == "k.e.y"
    assert env_value("X=1", "SERVICE_ROLE_KEY") == ""
    assert object_name("inst", item) == "inst/{}.jpeg".format(sha)
    assert item_problem(item) == ""
    assert item_problem(dict(item, kind="sermon")) == "unknown kind"
    assert item_problem(dict(item, sha256="xyz")) == "no content hash"
    assert item_problem(dict(item, content_type="text/html")) == "not a picture type"
    assert item_problem(dict(item, file="other.jpeg")) == "file name is not its hash"
    assert item_problem(dict(item, source_path="/etc/passwd")) == "not one of the site's own uploads"
    assert already_there(409, b"")
    assert already_there(400, b'{"statusCode":"409","error":"Duplicate"}')
    assert not already_there(400, b'{"statusCode":"400","error":"bad"}')
    assert not already_there(500, b"Duplicate")
    p = keep_payload("colg", item)
    assert p["slug_in"] == "colg" and "file" not in p["item_in"] and p["item_in"]["sha256"] == sha
    print("church_archive_keep selftest: PASS")
    return 0


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--selftest":
        sys.exit(selftest())
    if len(sys.argv) < 2:
        print("usage: church_archive_keep.py <collector folder> | --selftest")
        sys.exit(2)
    sys.exit(main(sys.argv[1]))

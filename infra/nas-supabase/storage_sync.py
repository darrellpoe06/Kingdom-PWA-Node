#!/usr/bin/env python3
# =============================================================================
# storage_sync.py -- copy the BLOBS hosted -> sovereign, then measure parity
# =============================================================================
# The gap cutover_sync.py named and deferred (its header: "STORAGE OBJECTS ARE
# NOT COPIED... The 3 buckets / 455 objects stay a recorded NOT-done"). This is
# that follow-up, opened by the 2026-08-31 regression (DR-0317): the repoint
# moved the rows on 2026-08-19 and left the files behind, so from that deploy
# on every Storage read resolved at a backend that does not hold the file.
#
# MEASURED cost of the gap, both surfaces, both silent for twelve days:
#   moore-showcase          12 objects -- Shay's gallery, broken thumbnails
#   church-team-documents  184 rows    -- Christina's team library, unopenable
#   sermon-documents         (BG's .docx, admin-only)
# The public bucket got a client-side bridge (VITE_PUBLIC_STORAGE_URL) because
# a public object needs no key. The PRIVATE buckets cannot be bridged at all: a
# signed URL must be minted by the backend that HOLDS the file, and the user's
# session is now a sovereign JWT that the hosted project's RLS will never
# accept. For those, copying the bytes is the only fix. This script is it.
#
# WHY THE LIST COMES FROM THE DB, NOT THE STORAGE API: AGENT_DB_URL is already
# proven in this directory (cutover_sync/migrate_verify use it), storage.objects
# is the authoritative name list, and it needs no extra credential. Only the
# DOWNLOAD of a private object needs the hosted service key.
#
# IDEMPOTENT + RESUMABLE by design: an object already on the sovereign side at
# the same size is skipped, so an interrupted run is re-run, never restarted.
# Uploads set x-upsert, so a half-written object is overwritten cleanly.
#
# NOT the three-brakes class (P10/P11/P12): this is a hand-dispatched one-shot
# migration, not a timer-driven loop that spawns work. It has no schedule, no
# self-trigger, and exits when the copy is done.
#
# Selftest: python3 storage_sync.py --selftest   (pure logic, no network)
import json
import os
import ssl
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "nas-agent", ".vendor"))
sys.path.insert(0, HERE)

AGENT_ENV = "/volume1/docker/poetech/agent.env"
SUPA_ENV = os.environ.get("SUPABASE_DATA", "/volume1/docker/supabase") + "/.env"
CA_PATH = os.path.join(HERE, "..", "nas-agent", "supabase-prod-ca-2021.crt")
SOVEREIGN_URL = "http://127.0.0.1:8800"   # kong, as install.sh publishes it

from cutover_sync import env_value, build_ssl_context, connect  # noqa: E402


# ---- pure logic (everything below --selftest pins) --------------------------

def object_url(base, bucket, name):
    """The Storage object endpoint. Each path SEGMENT is encoded; the slashes
    inside an object name are structural (a name is `<folder>/<file>`) and must
    survive. Christina's names carry spaces, '+' and '@' -- encoding the whole
    name as one component would 404 every one of them."""
    from urllib.parse import quote
    encoded = "/".join(quote(seg, safe="") for seg in str(name).lstrip("/").split("/"))
    return "{}/storage/v1/object/{}/{}".format(base.rstrip("/"), bucket, encoded)


def bucket_url(base):
    return "{}/storage/v1/bucket".format(base.rstrip("/"))


def should_copy(src_size, dst_size):
    """Copy when the destination lacks the object, or holds a different number
    of bytes (a truncated earlier run). Equal sizes are skipped so a re-run is
    cheap. dst_size None = absent."""
    if dst_size is None:
        return True
    return int(src_size or 0) != int(dst_size)


def parity_verdict(src_counts, dst_counts):
    """GO only when every source bucket is present on the destination with at
    least as many objects. Reports per-bucket shortfalls by name -- a bucket
    that silently copied zero is the failure this must never call success."""
    short = {}
    for bucket, n in sorted(src_counts.items()):
        have = dst_counts.get(bucket, 0)
        if have < n:
            short[bucket] = {"source": n, "destination": have}
    return {"go": not short, "short": short,
            "matched": sorted(b for b in src_counts if b not in short)}


def content_type_of(metadata):
    """storage.objects.metadata is jsonb; a missing mimetype is not a guess."""
    if isinstance(metadata, str):
        try:
            metadata = json.loads(metadata)
        except ValueError:
            return "application/octet-stream"
    if isinstance(metadata, dict):
        return metadata.get("mimetype") or "application/octet-stream"
    return "application/octet-stream"


def size_of(metadata):
    if isinstance(metadata, str):
        try:
            metadata = json.loads(metadata)
        except ValueError:
            return 0
    if isinstance(metadata, dict):
        try:
            return int(metadata.get("size") or 0)
        except (TypeError, ValueError):
            return 0
    return 0


# ---- network ----------------------------------------------------------------

def http(method, url, key, body=None, ctype=None, timeout=120):
    import urllib.request
    import urllib.error
    req = urllib.request.Request(url, data=body, method=method)
    req.add_header("Authorization", "Bearer {}".format(key))
    req.add_header("apikey", key)
    if ctype:
        req.add_header("Content-Type", ctype)
    if method in ("POST", "PUT"):
        req.add_header("x-upsert", "true")
    ctx = build_ssl_context() if url.startswith("https") else None
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=ctx) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()
    except Exception as e:  # noqa: BLE001 - a dead host is a finding, not a crash
        return 0, str(e).encode()


def ensure_bucket(base, key, bucket, public):
    status, body = http("POST", bucket_url(base), key,
                        body=json.dumps({"id": bucket, "name": bucket,
                                         "public": bool(public)}).encode(),
                        ctype="application/json")
    # 409 = already there, which is success for our purposes.
    if status in (200, 201, 409):
        return True
    print("storage-sync: bucket {} not creatable (HTTP {}): {}".format(
        bucket, status, body[:200].decode("utf-8", "replace")))
    return False


def real_run(only_bucket=None, limit=0, dry_run=False):
    hosted_url = env_value(AGENT_ENV, "AGENT_DB_URL")
    hosted_api = env_value(AGENT_ENV, "HOSTED_SB_URL")
    hosted_key = env_value(AGENT_ENV, "HOSTED_SERVICE_ROLE_KEY")
    sov_key = env_value(SUPA_ENV, "SERVICE_ROLE_KEY")
    missing = [n for n, v in (("AGENT_DB_URL", hosted_url), ("HOSTED_SB_URL", hosted_api),
                              ("HOSTED_SERVICE_ROLE_KEY", hosted_key),
                              ("SERVICE_ROLE_KEY", sov_key)) if not v]
    if missing:
        print("storage-sync: missing {} - cannot run".format(", ".join(missing)))
        return 2

    src = connect(hosted_url, use_tls=True)
    try:
        buckets = {r[0]: r[1] for r in src.run(
            "SELECT id, public FROM storage.buckets ORDER BY id")}
        rows = src.run(
            "SELECT bucket_id, name, metadata FROM storage.objects "
            "WHERE name IS NOT NULL ORDER BY bucket_id, name")
    finally:
        src.close()

    if only_bucket:
        buckets = {b: p for b, p in buckets.items() if b == only_bucket}
        rows = [r for r in rows if r[0] == only_bucket]
    if limit:
        rows = rows[:limit]

    src_counts = {}
    for bucket, _name, _meta in rows:
        src_counts[bucket] = src_counts.get(bucket, 0) + 1
    print("storage-sync: source holds {} objects across {} buckets: {}".format(
        len(rows), len(src_counts), json.dumps(src_counts)))
    if dry_run:
        print("storage-sync: --dry-run, nothing written")
        return 0

    for bucket, public in buckets.items():
        ensure_bucket(SOVEREIGN_URL, sov_key, bucket, public)

    copied = skipped = failed = 0
    dst_counts = {}
    for bucket, name, meta in rows:
        want = size_of(meta)
        head_status, head_body = http("GET", object_url(SOVEREIGN_URL, bucket, name), sov_key)
        have = len(head_body) if head_status == 200 else None
        if not should_copy(want, have):
            skipped += 1
            dst_counts[bucket] = dst_counts.get(bucket, 0) + 1
            continue
        status, blob = http("GET", object_url(hosted_api, bucket, name), hosted_key)
        if status != 200:
            failed += 1
            print("storage-sync: DOWNLOAD failed {}/{} (HTTP {})".format(bucket, name, status))
            continue
        status, body = http("PUT", object_url(SOVEREIGN_URL, bucket, name), sov_key,
                            body=blob, ctype=content_type_of(meta))
        if status not in (200, 201):
            status, body = http("POST", object_url(SOVEREIGN_URL, bucket, name), sov_key,
                                body=blob, ctype=content_type_of(meta))
        if status in (200, 201):
            copied += 1
            dst_counts[bucket] = dst_counts.get(bucket, 0) + 1
        else:
            failed += 1
            print("storage-sync: UPLOAD failed {}/{} (HTTP {}): {}".format(
                bucket, name, status, body[:200].decode("utf-8", "replace")))

    verdict = parity_verdict(src_counts, dst_counts)
    print("storage-sync: copied {} skipped {} failed {}".format(copied, skipped, failed))
    print("storage-sync: parity " + json.dumps(verdict))
    print("storage-sync: verdict " + ("GO" if verdict["go"] and not failed else "NO-GO"))
    return 0 if (verdict["go"] and not failed) else 1


# ---- selftest ---------------------------------------------------------------

def selftest():
    passed = failed = 0

    def check(label, cond):
        nonlocal passed, failed
        if cond:
            passed += 1
            print("PASS " + label)
        else:
            failed += 1
            print("FAIL " + label)

    u = object_url("https://h.supabase.co/", "moore-showcase", "moore-divahs/sp-1.jpeg")
    check("object url keeps the bucket and the structural slash",
          u == "https://h.supabase.co/storage/v1/object/moore-showcase/moore-divahs/sp-1.jpeg")
    # Christina's real names carry spaces and '+' -- the 184 team documents die
    # if the name is encoded as one component or left raw.
    hard = object_url("https://h/", "church-team-documents",
                      "d9104bc6/_1099417840_mail.yahoo.com_/09 SEP+notes.docx")
    check("CATCHES a space and a plus in a real object name",
          hard.endswith("/09%20SEP%2Bnotes.docx"))
    check("CATCHES a name collapsed into one segment (the folder must survive)",
          hard.count("/") > 6 and "%2F" not in hard)

    check("absent on the destination is always copied", should_copy(100, None) is True)
    check("a size mismatch is re-copied (a truncated earlier run)", should_copy(100, 40) is True)
    check("an identical object is skipped (a re-run is cheap)", should_copy(100, 100) is False)

    v = parity_verdict({"a": 2, "b": 3}, {"a": 2, "b": 3})
    check("parity is GO only when every bucket is whole", v["go"] is True)
    v = parity_verdict({"a": 2, "b": 3}, {"a": 2})
    check("CATCHES a bucket that copied nothing at all",
          v["go"] is False and v["short"]["b"] == {"source": 3, "destination": 0})
    v = parity_verdict({"a": 2}, {"a": 1})
    check("CATCHES a partial bucket", v["go"] is False and v["short"]["a"]["destination"] == 1)

    check("mimetype is read from the row", content_type_of({"mimetype": "image/jpeg"}) == "image/jpeg")
    check("a missing mimetype is never guessed",
          content_type_of({}) == "application/octet-stream")
    check("metadata as a json STRING is parsed, not dropped",
          content_type_of('{"mimetype":"application/pdf","size":12}') == "application/pdf"
          and size_of('{"mimetype":"application/pdf","size":12}') == 12)
    check("a garbage size never becomes a false zero-length match",
          size_of({"size": "not-a-number"}) == 0)

    print("\n{}/{} passed".format(passed, passed + failed))
    return 1 if failed else 0


def arg_value(flag, default=None):
    for a in sys.argv:
        if a.startswith(flag + "="):
            return a.split("=", 1)[1]
    return default


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        sys.exit(selftest())
    sys.exit(real_run(only_bucket=arg_value("--bucket"),
                      limit=int(arg_value("--limit", "0")),
                      dry_run="--dry-run" in sys.argv))

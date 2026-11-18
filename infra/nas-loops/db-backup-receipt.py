#!/usr/bin/env python3
# =============================================================================
# db-backup-receipt.py -- the house says whether its database backup is good,
# with no key (DR-1360 / DR-1399 pattern, for DR-1113's backup)
# =============================================================================
# THE GAP. db_backup.sh (DR-1113) takes a verified pg_dump every night and a
# restore drill every week, and writes its verdict to status.json on the box.
# The only reader of that verdict is nas-health.yml, over ssh, behind the
# runner's Tailscale key -- refused since 2026-11-04. So "is there a confirmed
# backup?" -- the precondition Christina set on 2026-11-17 for any FOS Money
# migration -- could be answered only by a hand on the box.
#
# DR-1360: the NAS initiates every road. This rider reads status.json locally
# and patches ONE row into agent_inbox (tag db-backup-receipt, source
# nas-loops), the way heartbeat.py and lesson-queue-census.py do. Migration
# 0334's db_backup_receipt() reads it back over the public road, whitelisting
# every field, so the answer needs no runner, no tailnet and no key.
#
# WHAT IT CARRIES, AND WHAT IT WILL NOT. ok, the dump's time, its size, the
# archive entry count, how many dumps are kept, and the drill verdict reduced
# to passed / failed / skipped with the two counts the drill compares. Never a
# file name, a path, a host, or the error text (which can quote a database
# message): an error becomes the flag "error" and its words stay on the box.
#
# NOT YET PROVEN, AND SAID SO (P66). It rides the services-sync clock, so it
# outlives every session; it counts as working only when its first receipt is
# READ over the public road. Until then it is shipped-and-armed, never working.
#
# BRAKES (DR-0248): BUDGET -- one file read, two reads and one write per
# cycle, no retry. LOCK -- one row, patched in place. STOP -- enabled:false on
# its services.json entry; no credential or no status file is a named quiet
# no-op (exit 0) that never reds the clock for the services beside it.
# =============================================================================
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
TAG = "db-backup-receipt"
DEFAULT_CREATED_BY = "c2a6c39a-ae99-4ff7-83c6-b927e2e7f1cc"
DEFAULT_SECRETS = "/volume1/PoeTech/secrets/supabase.json"
DEFAULT_STATUS = "/volume1/PoeTech/backups/db/status.json"
DRILL_RE = re.compile(
    r"^(passed|FAILED): auth\.users (\d+|\?) of (\d+|\?), public tables (\d+|\?) of (\d+|\?)$"
)


def _int(v):
    return (
        v
        if isinstance(v, int) and not isinstance(v, bool) and 0 <= v < 10**15
        else None
    )


def _num(s):
    return int(s) if s and s.isdigit() else None


def receipt_of(status, drill_mtime=None):
    """The whitelisted receipt for one status.json object. Pure."""
    if not isinstance(status, dict):
        return {"seen": True, "readable": False}
    out = {"seen": True, "readable": True}
    if isinstance(status.get("ok"), bool):
        out["ok"] = status["ok"]
    at = status.get("at")
    if isinstance(at, str):
        try:
            out["at"] = (
                datetime.fromisoformat(at.replace("Z", "+00:00"))  # noqa: FURB162 -- the NAS runs Python 3.8
                .astimezone(timezone.utc)  # noqa: UP017 -- the NAS runs Python 3.8
                .isoformat()
            )
        except ValueError:
            pass
    for k in ("bytes", "toc_entries", "kept"):
        if _int(status.get(k)) is not None:
            out[k] = status[k]
    d = status.get("drill")
    if isinstance(d, str):
        m = DRILL_RE.match(d)
        if d in ("skipped", "not-run"):
            out["drill"] = {"verdict": "skipped"}
        elif m:
            out["drill"] = {
                "verdict": "passed" if m.group(1) == "passed" else "failed",
                "users": _num(m.group(2)),
                "users_live": _num(m.group(3)),
                "tables": _num(m.group(4)),
                "tables_live": _num(m.group(5)),
            }
        else:
            out["drill"] = {"verdict": "unknown"}
    if drill_mtime is not None:
        out["last_drill_at"] = datetime.fromtimestamp(
            drill_mtime,
            timezone.utc,  # noqa: UP017 -- the NAS runs Python 3.8
        ).isoformat()
    if isinstance(status.get("error"), str) and status["error"].strip():
        out["error"] = True  # the words stay on the box
    return out


def read_status(path):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return None
    except (OSError, ValueError):
        return "unreadable"


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
        raw = resp.read().decode("utf-8")
        return json.loads(raw) if raw.strip() else None


def publish(url, key, instance_id, body, created_by):
    """PATCH the existing receipt row, or INSERT the first. Returns 'patched' | 'inserted'."""
    q = (
        "agent_inbox?select=id&instance_id=eq."
        + instance_id
        + "&tags=cs."
        + urllib.parse.quote(json.dumps([TAG]))
        + "&order=created_at.desc&limit=1"
    )
    rows = rest(url, key, "GET", q)
    now = datetime.now(timezone.utc).isoformat()  # noqa: UP017 -- the NAS runs Python 3.8
    if rows:
        rest(
            url,
            key,
            "PATCH",
            "agent_inbox?id=eq." + rows[0]["id"],
            body={"body": body, "created_at": now},
            extra_headers={"Prefer": "return=minimal"},
        )
        return "patched"
    row = {
        "instance_id": instance_id,
        "body": body,
        "tags": [TAG, "lesson-captured"],
        "source": "nas-loops",
        "created_by": created_by,
    }
    rest(
        url,
        key,
        "POST",
        "agent_inbox",
        body=[row],
        extra_headers={"Prefer": "return=minimal"},
    )
    return "inserted"


def main():
    status_path = os.environ.get("BACKUP_STATUS", DEFAULT_STATUS)
    status = read_status(status_path)
    if status is None:
        print("db-backup-receipt: no status file yet - quiet no-op")
        return 0
    drill_file = os.path.join(os.path.dirname(status_path), ".last-drill")
    drill_mtime = os.path.getmtime(drill_file) if os.path.exists(drill_file) else None
    body = json.dumps(
        receipt_of(status if status != "unreadable" else None, drill_mtime)
    )
    sys.path.insert(0, os.path.join(HERE, "..", "nas-supabase"))
    try:
        from sovereign_target import load_target

        url, key = load_target(
            os.environ.get("SUPABASE_SECRETS", DEFAULT_SECRETS), quiet=True
        )
    except (ImportError, OSError, ValueError, KeyError):
        url = key = None
    if not url or not key:
        print("db-backup-receipt: no credential - quiet no-op")
        return 0
    try:
        rows = rest(
            url,
            key,
            "GET",
            "instances?select=id&slug=eq."
            + urllib.parse.quote(os.environ.get("TRANSCRIPTS_SLUG", "colg")),
        )
        if not rows:
            print("db-backup-receipt: no instance")
            return 1
        what = publish(
            url,
            key,
            rows[0]["id"],
            body,
            os.environ.get("CENSUS_CREATED_BY", DEFAULT_CREATED_BY),
        )
    except (OSError, ValueError, KeyError, IndexError) as e:
        print(f"db-backup-receipt: error {e.__class__.__name__}")
        return 1
    print(f"db-backup-receipt: {what} {body}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

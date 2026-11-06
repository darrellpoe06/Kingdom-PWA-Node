#!/usr/bin/env python3
# =============================================================================
# heartbeat.py -- the house's own witness (DR-1360)
# =============================================================================
# Darrell, 2026-11-06: "Why would I willingly want to depend on other systems...
# that can and do fail." The runner's probes of this NAS all died with the
# runner's tailnet key on 2026-11-04, because each ran on the same key as the
# work it watched. This writes ONE row from the NAS itself, on the
# services-sync clock, into the table the app already reads (agent_inbox,
# tagged nas-heartbeat), so the app shows "NAS last seen" with no runner, no
# GitHub and no tailnet between this machine and the reader.
#
# DURABLE, BRAKED DRIVER (P66, P10): it rides the services-sync clock the DSM
# scheduler already fires (install-clock.sh), so it outlives every session and
# survives a reboot; it counts as WORKING only when the app shows a stamp from
# it, which is the first-run proof this session cannot take from the cloud.
#
# ONE ROW, UPDATED IN PLACE. A row per cycle would be 96 rows a day forever;
# the newest row is the whole signal, so the existing heartbeat row is PATCHED
# and a row is INSERTED only when none exists. Read-only on everything else.
#
# BRAKES (DR-0248): one read and one write per cycle; no retry loop; no
# credential is a named quiet no-op (exit 0), never a crash of the clock.
import json
import os
import platform
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
TAG = "nas-heartbeat"
# The account the research-inbox road already writes Darrell's rows as; the
# app's read policy is created_by = auth.uid(), so the heartbeat is visible to
# the sign-in that owns it. Override with HEARTBEAT_CREATED_BY.
DEFAULT_CREATED_BY = "c2a6c39a-ae99-4ff7-83c6-b927e2e7f1cc"
DEFAULT_SECRETS = "/volume1/PoeTech/secrets/supabase.json"
# Its own ledger in its own home (the lesson-voice pattern): the loops witness
# (loops-health.yml) reads this file, so a cycle that ran but could not write
# its row ("no-credential", "no-instance", "error") is told apart from a cycle
# that never ran. Override with HEARTBEAT_HOME.
DEFAULT_HOME = "/volume1/PoeTech/nas-heartbeat"


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


def services_enabled(services_json_path):
    """How many services ride this clock, read from the registry on disk; -1 if unreadable."""
    try:
        with open(services_json_path, "r", encoding="utf-8") as fh:
            d = json.load(fh)
        items = d if isinstance(d, list) else d.get("services", [])
        return sum(1 for s in items if isinstance(s, dict) and s.get("enabled"))
    except (OSError, ValueError):
        return -1


def body_of(now=None, host=None, services=-1, cycle="services-sync"):
    """The stamp the app parses (lib/nas-heartbeat.js stampOf): at, host, services, cycle."""
    # timezone.utc, not datetime.UTC: the DSM runs Python 3.8 (UP017 is 3.11+).
    utc = timezone.utc  # noqa: UP017
    at = (now or datetime.now(utc)).astimezone(utc).isoformat().replace("+00:00", "Z")
    return json.dumps(
        {
            "at": at,
            "host": host or platform.node(),
            "services": services,
            "cycle": cycle,
        }
    )


def write_ledger(home, what, body=None, error=None):
    """last-run.json: {what, at, host, services, error}. Never raises: the ledger is a witness, not the work."""
    try:
        os.makedirs(home, exist_ok=True)
        entry = json.loads(body) if body else {}
        entry.update({"what": what, "error": error})
        if "at" not in entry:
            entry["at"] = json.loads(body_of())["at"]
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


def beat(url, key, instance_id, body, created_by):
    """PATCH the existing heartbeat row, or INSERT the first one. Returns 'patched' | 'inserted'."""
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
                "tags": [TAG],
                "source": "nas-loops",
                "created_by": created_by,
            }
        ],
        extra_headers={"Prefer": "return=minimal"},
    )
    return "inserted"


def main():
    secrets = os.environ.get("SUPABASE_SECRETS", DEFAULT_SECRETS)
    home = os.environ.get("HEARTBEAT_HOME", DEFAULT_HOME)
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
        print(f"nas-heartbeat: no credential ({why}) - quiet no-op")
        return 0
    slug = os.environ.get("TRANSCRIPTS_SLUG", "colg")
    body = body_of(services=services_enabled(os.path.join(HERE, "services.json")))
    try:
        instance_id = resolve_instance(url, key, slug)
        if not instance_id:
            write_ledger(
                home, "no-instance", body, error=f"no instance with slug '{slug}'"
            )
            print(
                f"nas-heartbeat: no instance with slug '{slug}' - nothing to write to"
            )
            return 1
        what = beat(
            url,
            key,
            instance_id,
            body,
            os.environ.get("HEARTBEAT_CREATED_BY", DEFAULT_CREATED_BY),
        )
    except (OSError, ValueError, KeyError, IndexError) as e:
        # urllib raises OSError subclasses (URLError, HTTPError); a cycle that
        # could not reach the table says so in its ledger and exits non-zero.
        write_ledger(home, "error", body, error=f"{e.__class__.__name__}: {e}"[:300])
        print(f"nas-heartbeat: error {e.__class__.__name__}: {e}")
        return 1
    write_ledger(home, what, body)
    print(f"nas-heartbeat: {what} {body}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

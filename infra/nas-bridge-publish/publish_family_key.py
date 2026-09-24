#!/usr/bin/env python3
"""
publish_family_key.py -- the NAS publishes the family key itself, so no
person ever pastes it (DR-0613).

Darrell 2026-09-24, on the Voice page's red "This device holds the family key"
row: "The voice needs an engineer to make work!!! Fix it so users can do it!!!"
Measured: family_secure_config held zero rows; the key lived only on the NAS.

Each services-sync cycle this reads the key the NAS installers already minted
(/volume1/PoeTech/secrets/chat-bridge-token.txt), the committed owner list
(owners.txt), and the service credential the NAS already uses, then calls
box_publish_family_bridge_token (migration 0231). The function writes only to
non-church instances a named family account owns or administers, and only when
the stored key differs; so a steady-state cycle writes nothing. Every family
device then provisions the key itself (lib/bridge-provision.js).

Standard library only. Every external call is injectable so the tests prove
the whole path without a network. Exit 0 with a named reason when anything is
missing (no key yet, no credential): a quiet, honest no-op, never a crash.

    python3 publish_family_key.py            # one publish
    python3 -m unittest test_publish_family_key -v
"""
import json
import os
import sys
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
# The key must land in the database the APP reads: the NAS's own Supabase when
# REPOINT-ARMED is merged (DR-0614), via the one resolver every NAS writer uses.
sys.path.insert(0, os.path.join(HERE, "..", "nas-supabase"))
from sovereign_target import resolve_target  # noqa: E402
TOKEN_FILE = os.environ.get("BRIDGE_TOKEN_FILE", "/volume1/PoeTech/secrets/chat-bridge-token.txt")
SECRETS = os.environ.get("BRIDGE_PUBLISH_SECRETS", "/volume1/PoeTech/secrets/supabase.json")
OWNERS = os.environ.get("BRIDGE_OWNERS_FILE", os.path.join(HERE, "owners.txt"))


def read_owners(path=OWNERS):
    try:
        with open(path, encoding="utf-8") as f:
            return [l.strip().lower() for l in f if l.strip() and not l.strip().startswith("#")]
    except OSError:
        return []


def read_token(path=TOKEN_FILE):
    try:
        with open(path, encoding="utf-8") as f:
            return f.read().strip()
    except OSError:
        return ""


def load_secrets(path=SECRETS, resolver=resolve_target):
    """(url, key) of the database the app reads; ('', '') when none is found."""
    source, url, key = resolver(path)
    return (url or ""), (key or "")


def call_rpc(url, key, token, owners, timeout=30):
    body = json.dumps({"p_token": token, "p_owner_emails": owners}).encode("utf-8")
    req = urllib.request.Request(
        url + "/rest/v1/rpc/box_publish_family_bridge_token", data=body, method="POST",
        headers={"apikey": key, "Authorization": "Bearer " + key, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as res:
        return json.loads(res.read().decode("utf-8") or "0")


def publish(token=None, owners=None, secrets=None, rpc=call_rpc):
    """One publish. Returns {ok, wrote, reason}; never raises."""
    token = read_token() if token is None else token
    owners = read_owners() if owners is None else owners
    url, key = load_secrets() if secrets is None else secrets
    if not token:
        return {"ok": False, "wrote": 0, "reason": "no key on this NAS yet (the photo and voice installers mint it)"}
    if not owners:
        return {"ok": False, "wrote": 0, "reason": "no family owners listed in owners.txt"}
    if not (url and key):
        return {"ok": False, "wrote": 0, "reason": "no Supabase service credential on this NAS"}
    try:
        wrote = int(rpc(url, key, token, owners) or 0)
    except Exception as e:  # the publish is retried next cycle; the reason is logged
        return {"ok": False, "wrote": 0, "reason": f"publish failed: {e}"}
    return {"ok": True, "wrote": wrote, "reason": "published" if wrote else "already current"}


if __name__ == "__main__":
    out = publish()
    # The key itself is never printed.
    print("family-key: " + json.dumps(out))

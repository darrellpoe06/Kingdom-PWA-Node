#!/usr/bin/env python3
# property-photos.py — read-only resolver: a property's Synology Chat photos.
# Deployed at /volume1/PoeTech/scripts/property-photos.py on the NAS.
# Forced-command target for the property-photos bridge key. Runs as dpoe
# (who can read the PhotoBackup thumbnails directly); only the psql read is
# elevated via `sudo -n -u postgres` (same pattern as the history bridge,
# which n8n's SSH node runs fine). The ONLY command that key can run.
#
# It maps each image post in a chat channel to its ALREADY-EXISTING Synology
# thumbnail (SYNOFILE_THUMB_M.jpg, ~20KB) in PhotoBackup — by parsing the
# capture date out of the original camera filename (20241206_*.jpg -> 2024/12).
# It NEVER touches the originals; it reads the small thumbnail Synology already
# made and base64-encodes it. Photos whose filename isn't a standard camera
# name (screenshots, downloads, other devices not backed up here) come back
# with thumb=null — listed honestly, not broken.
#
# Verb (from SSH_ORIGINAL_COMMAND, set by the n8n SSH node):
#   photos <channel> <limit> <offset>
#     -> JSON {count, photos:[{id,date,name,text,thumb}]}, newest first.
import base64
import glob
import json
import os
import re
import subprocess
import sys

PHOTOBACKUP_GLOB = "/volume1/homes/*/Drive/PhotoBackup/*/DCIM/Camera/{y}/{m}/@eaDir/{name}/SYNOFILE_THUMB_M.jpg"
SAFE_CHANNEL = re.compile(r"^[A-Za-z0-9._-]{1,64}$")
# 2026-06-12 hardening: [^/\\] (was .+) so a crafted chat file_props.name
# like "20241206_../../../etc.jpg" cannot climb out of the PhotoBackup root.
STD_NAME = re.compile(r"^(\d{4})(\d{2})\d{2}_[^/\\]+\.(jpg|jpeg|png)$", re.IGNORECASE)


def fail(msg):
    print(json.dumps({"error": msg, "photos": [], "count": 0}))
    sys.exit(0)


def parse_args():
    cmd = os.environ.get("SSH_ORIGINAL_COMMAND", "") or " ".join(sys.argv[1:])
    # n8n's SSH node prepends `cd <cwd> ;` when a working dir is set, so locate
    # the `photos` verb rather than assuming it is the first token.
    tokens = cmd.replace(";", " ").split()
    if "photos" not in tokens:
        fail("usage: photos <channel> <limit> <offset>")
    parts = tokens[tokens.index("photos"):]
    if len(parts) < 2:
        fail("usage: photos <channel> <limit> <offset>")
    channel = parts[1]
    if not SAFE_CHANNEL.match(channel):
        fail("bad channel")
    try:
        limit = max(1, min(48, int(parts[2]) if len(parts) > 2 else 24))
        offset = max(0, int(parts[3]) if len(parts) > 3 else 0)
    except ValueError:
        fail("bad limit/offset")
    return channel, limit, offset


def query_rows(channel, limit, offset):
    # psql as postgres; channel is whitelist-sanitized so interpolation is safe.
    sql = (
        "SELECT p.id, p.create_at, p.file_props->>'name', COALESCE(p.message,'') "
        "FROM posts p JOIN channels c ON c.id = p.channel_id "
        "WHERE c.name = '%s' AND (p.file_props->>'is_image') = 'true' "
        "AND COALESCE(p.delete_at,0) = 0 "
        "ORDER BY p.create_at DESC LIMIT %d OFFSET %d" % (channel, limit, offset)
    )
    out = subprocess.run(
        ["sudo", "-n", "-u", "postgres", "psql", "synochat", "-At",
         "-R", "\x1e", "-F", "\x1f", "-c", sql],
        stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
    )
    raw = out.stdout.decode("utf-8", "replace").strip("\x1e\n")
    if not raw:
        return []
    rows = []
    for rec in raw.split("\x1e"):
        cols = rec.split("\x1f")
        if len(cols) >= 4:
            rows.append(cols)
    return rows


def thumb_for(name):
    m = STD_NAME.match(name or "")
    if not m:
        return None
    y, mo = m.group(1), m.group(2)
    hits = glob.glob(PHOTOBACKUP_GLOB.format(y=y, m=mo, name=glob.escape(name)))
    if not hits:
        return None
    try:
        with open(hits[0], "rb") as fh:
            data = fh.read()
        if len(data) > 400000:  # thumbnails are ~20KB; guard against surprises
            return None
        return "data:image/jpeg;base64," + base64.b64encode(data).decode("ascii")
    except OSError:
        return None


def main():
    # Must run as root (forced command uses sudo) to read homes/ + run psql.
    channel, limit, offset = parse_args()
    photos = []
    for cid, create_at, name, text in query_rows(channel, limit, offset):
        try:
            ms = int(create_at)
            date = __import__("datetime").datetime.utcfromtimestamp(ms / 1000).strftime("%Y-%m-%d")
        except (ValueError, OverflowError):
            date = ""
        photos.append({
            "id": cid,
            "date": date,
            "name": name or "",
            "text": (text or "")[:280],
            "thumb": thumb_for(name),
        })
    print(json.dumps({"count": len(photos), "photos": photos}))


if __name__ == "__main__":
    main()

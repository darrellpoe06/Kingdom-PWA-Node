#!/usr/bin/env python3
"""gmail_ingest — BG's weekly PROCLAIM email + .docx attachments into the archive.

NAS job (DR-0083: plain Python, headless, braked by the nas-loops runner — this
script does the work; the runner owns budget/lock/kill-switch when scheduled).

FULL-HISTORY PAGINATION IS BINDING (DR-0083 recorded the lesson: the old wf18
fetched one frozen batch). This walks EVERY page of the query before it claims
completion, downloads each .docx attachment once (by messageId+filename), and is
idempotent — re-runs skip what's already on disk.

CREDENTIAL (the one human piece): a Gmail OAuth2 access token with
gmail.readonly scope, minted by Darrell, placed at the path in TOKEN_FILE
(default: ~/.church-golive/gmail_token.txt — a bare access or refresh-derived
token string). Without it this script EXITS CLEARLY — it never half-runs.

Usage:
  python gmail_ingest.py [--query 'from:bg@thechurchofthelivinggod.com has:attachment'] [--dest ./proclaim-archive]
"""
import base64
import json
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

RUN_EVENTS = Path(__file__).with_name("events.jsonl")
TOKEN_FILE = Path.home() / ".church-golive" / "gmail_token.txt"
API = "https://gmail.googleapis.com/gmail/v1/users/me"
DEFAULT_QUERY = "from:bg@thechurchofthelivinggod.com has:attachment"


def emit(ok, processed, note):
    with RUN_EVENTS.open("a") as ev:
        ev.write(json.dumps({"at": datetime.now(timezone.utc).isoformat(),
                             "script": "gmail_ingest", "ok": ok,
                             "processed": processed, "note": note}) + "\n")


def api_get(token, path, params=None):
    url = f"{API}/{path}"
    if params:
        url += "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def main():
    args = sys.argv[1:]
    query = args[args.index("--query") + 1] if "--query" in args else DEFAULT_QUERY
    dest = Path(args[args.index("--dest") + 1] if "--dest" in args else "proclaim-archive")

    if not TOKEN_FILE.exists():
        msg = f"NO CREDENTIAL: place a gmail.readonly OAuth token at {TOKEN_FILE} (Darrell holds this). Nothing fetched."
        print(msg)
        emit(False, 0, msg)
        return 2
    token = TOKEN_FILE.read_text().strip()
    dest.mkdir(parents=True, exist_ok=True)

    # 1) FULL pagination of the message list — every page, no frozen batch.
    ids, page = [], None
    while True:
        params = {"q": query, "maxResults": 100}
        if page:
            params["pageToken"] = page
        resp = api_get(token, "messages", params)
        ids += [m["id"] for m in resp.get("messages", [])]
        page = resp.get("nextPageToken")
        if not page:
            break
    print(f"query matched {len(ids)} messages (all pages walked)")

    # 2) Each message: subject + every .docx attachment, idempotent by name.
    saved = 0
    for mid in ids:
        msg = api_get(token, f"messages/{mid}", {"format": "full"})
        headers = {h["name"].lower(): h["value"] for h in msg["payload"].get("headers", [])}
        subject = headers.get("subject", "(no subject)")
        parts = msg["payload"].get("parts", []) or []
        for p in parts:
            fname = p.get("filename") or ""
            att_id = (p.get("body") or {}).get("attachmentId")
            if not fname.lower().endswith(".docx") or not att_id:
                continue
            out = dest / f"{mid[:8]}--{fname}"
            if out.exists():
                continue
            att = api_get(token, f"messages/{mid}/attachments/{att_id}")
            out.write_bytes(base64.urlsafe_b64decode(att["data"]))
            saved += 1
            print(f"  saved: {out.name}  ({subject[:60]})")

    emit(True, saved, f"{len(ids)} messages walked, {saved} new docx -> {dest}")
    print(f"done: {saved} new attachments in {dest} (re-runs skip existing)")
    return 0


if __name__ == "__main__":
    sys.exit(main())

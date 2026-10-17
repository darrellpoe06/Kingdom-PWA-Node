#!/usr/bin/env python3
# =============================================================================
# church_mail.py -- the church office's emails become the app's documents, on
# the NAS, by themselves (DR-1091)
# =============================================================================
# Darrell, 2026-10-17: "I don't want to need to bring over files!!!!! Why do we
# need to!!!?" and "Why make something have to work a way when an option that
# can get it done another way is available that works better?"
#
# WHAT WAS TRUE. The church office (bg@thechurchofthelivinggod.com) emails the
# weekly order of service, announcements, the calendar and the PROCLAIM sermon
# documents to Christina's mailbox. Two scripts on Darrell's PC
# (scripts/sermon-import/import-team.mjs, import.mjs) read that mailbox and
# filed them on the OLD hosted server, by hand, when someone ran them. The
# 2026-08-19 move brought the rows across and left the 443 files behind.
#
# WHAT THIS DOES, each pass:
#   * reads the office's emails from the mailbox itself (IMAP, read-only:
#     BODY.PEEK, nothing is marked read, moved or deleted);
#   * a team document (order of service, announcements, calendar) that has no
#     row is FILED: its file at the same path the PC script used, then its row;
#   * a team document whose row exists but whose file is not on the church
#     server is REFILLED at the exact path the row already names;
#   * a PROCLAIM sermon document whose row exists but whose file is missing is
#     REFILLED at its row's path (new sermons stay with the sermon import,
#     which names the sermon from the document; this only puts files back).
# So the files left on the old server come back from their ORIGINAL source,
# with no key from the old server, and every new week's email lands without
# anyone running anything.
#
# PATH PARITY. `safe()` reproduces the PC scripts' JavaScript exactly
# (String.replace(/[^A-Za-z0-9._ -]/g, '_').slice(0, 120), counted in UTF-16
# units), so a refilled file lands where its row already points.
#
# BRAKES (DR-0248, the deterministic class; build requirements, DR-0225):
#   * budget: --max-messages per pass (default 25) and --max-seconds (default
#     360, inside the services-sync installer's 480 s ceiling);
#   * single-flight lock (.church-mail.lock, PID-checked): a second pass skips;
#   * a message that fails 3 times is set aside in the state file with its
#     reason and never retried in a loop; the pass exits 3 so the cycle reds
#     (reel + ntfy) instead of failing quietly.
# Progress is saved after every message (UIDVALIDITY + last UID), so a pass cut
# off by its budget resumes where it stopped.
#
# No mailbox credential = a named, quiet no-op (exit 0). Stdlib only.
#   python3 church_mail.py --selftest       (pure logic, no network)
#   python3 church_mail.py --once [--dry-run] [--max-messages=N]
# =============================================================================
import email
import email.policy
import imaplib
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
AGENT_ENV = os.environ.get("AGENT_ENV", "/volume1/docker/poetech/agent.env")
SUPA_ENV = os.environ.get("SUPABASE_DATA", "/volume1/docker/supabase") + "/.env"
SOVEREIGN_URL = os.environ.get("SOVEREIGN_URL", "http://127.0.0.1:8800")  # kong
OUT = os.environ.get("CHURCH_MAIL_OUT", os.path.join(HERE, "out"))
STATE = os.path.join(OUT, ".church-mail.state.json")
LOCK = os.path.join(OUT, ".church-mail.lock")

SENDER = "bg@thechurchofthelivinggod.com"
MAILBOX = '"[Gmail]/All Mail"'
TEAM_BUCKET = "church-team-documents"
SERMON_BUCKET = "sermon-documents"
CHURCH_SLUG = "colg"
MAX_FAILS = 3

MONTHS = {m: i + 1 for i, m in enumerate(
    ["january", "february", "march", "april", "may", "june", "july",
     "august", "september", "october", "november", "december"])}


# ---- pure logic (the selftest and test_church_mail.py pin all of it) --------

def safe(s):
    """The PC scripts' safe(): replace each UTF-16 unit outside [A-Za-z0-9._ -]
    with '_' and keep the first 120 units. A character beyond the BMP is two
    units in JavaScript, so it becomes two underscores here too."""
    out = []
    for ch in str(s):
        if re.match(r"[A-Za-z0-9._ -]", ch):
            out.append(ch)
        else:
            out.append("__" if ord(ch) > 0xFFFF else "_")
    return "".join(out)[:120]


def classify(hay):
    """import-team.mjs classify(): which team document this is, or None."""
    if re.search(r"order of service", hay, re.I):
        return "order-of-service"
    if re.search(r"announcement", hay, re.I):
        return "announcements"
    if re.search(r"calendar", hay, re.I):
        return "calendar"
    return None


def parse_date(subject):
    """import-team.mjs parseDate(): '10-19-2026' or 'JUNE 2026' -> ISO date."""
    m = re.search(r"(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})", subject)
    if m:
        mo, d, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
        if y < 100:
            y += 2000
        if 1 <= mo <= 12 and 1 <= d <= 31:
            return "%04d-%02d-%02d" % (y, mo, d)
    m = re.search(r"([A-Za-z]+)\s+(\d{4})", subject)
    if m and m.group(1).lower() in MONTHS:
        return "%s-%02d-01" % (m.group(2), MONTHS[m.group(1).lower()])
    return None


def is_document(name):
    return bool(re.search(r"\.(docx?|pdf)$", name or "", re.I))


def read_message(raw):
    """Bytes -> {subject, message_id, attachments:[{filename, content, content_type}]}."""
    msg = email.message_from_bytes(raw, policy=email.policy.default)
    atts = []
    for part in msg.iter_attachments():
        name = part.get_filename()
        if not name:
            continue
        try:
            content = part.get_content()
        except Exception:  # noqa: BLE001 - an unreadable part is skipped, not fatal
            continue
        if isinstance(content, str):
            content = content.encode("utf-8")
        atts.append({"filename": name, "content": content,
                     "content_type": part.get_content_type()})
    return {"subject": str(msg.get("subject") or ""),
            "message_id": str(msg.get("message-id") or "").strip(),
            "attachments": atts}


def team_plan(parsed, uid, instance_id, existing):
    """What a team-document email asks for. `existing` is the row already filed
    for this email (or None). Returns a dict with `action` in
    {'skip', 'file', 'check'} and the path/row to act on."""
    files = [a for a in parsed["attachments"] if is_document(a["filename"])]
    kind = classify(parsed["subject"] + " " + " ".join(a["filename"] for a in files))
    if not kind or not files:
        return {"action": "skip", "why": "not a team document"}
    att = files[0]
    email_id = parsed["message_id"] or "seq-%s" % uid
    if existing:
        url = existing.get("document_url") or ""
        if re.match(r"^(https?:|data:)", url, re.I) or not url:
            return {"action": "skip", "why": "the row keeps its file outside the server"}
        return {"action": "check", "path": url, "attachment": att}
    path = "%s/%s/%s" % (instance_id, safe(email_id), safe(att["filename"]))
    row = {"instance_id": instance_id, "doc_date": parse_date(parsed["subject"]),
           "doc_type": kind, "title": parsed["subject"][:150], "document_url": path,
           "document_source": "email", "email_id": email_id}
    return {"action": "file", "path": path, "attachment": att, "row": row}


def sermon_targets(parsed, sermon_urls):
    """PROCLAIM documents whose sermon row already names a path for them."""
    if not re.search(r"proclaim", parsed["subject"], re.I):
        return []
    out = []
    for a in parsed["attachments"]:
        if not re.search(r"\.docx?$", a["filename"] or "", re.I):
            continue
        tail = "/" + safe(a["filename"])
        for url in sermon_urls:
            if url.endswith(tail):
                out.append({"path": url, "attachment": a})
    return out


def new_state(uidvalidity):
    return {"uidvalidity": uidvalidity, "last_uid": 0, "fails": {}, "set_aside": {}}


def next_uids(all_uids, state, limit):
    """UIDs after the last one handled, oldest first, at most `limit`."""
    return [u for u in sorted(all_uids) if u > state.get("last_uid", 0)][:limit]


def run_pass(mailbox, server, state, max_messages, max_seconds, now=time.time, dry_run=False):
    """One braked pass. `mailbox` has uids() and fetch(uid); `server` has
    church_id(), team_row(email_id), sermon_urls(), present(bucket, path),
    upload(bucket, path, att) and insert_team(row). Returns a tally."""
    tally = {"seen": 0, "filed": 0, "refilled": 0, "present": 0, "skipped": 0,
             "failed": 0, "set_aside": 0, "budget": ""}
    start = now()
    church = server.church_id()
    sermons = server.sermon_urls()
    for uid in next_uids(mailbox.uids(), state, max_messages):
        if now() - start > max_seconds:
            tally["budget"] = "time"
            break
        key = str(uid)
        try:
            parsed = read_message(mailbox.fetch(uid))
            plan = team_plan(parsed, uid, church,
                             server.team_row(parsed["message_id"] or "seq-%s" % uid))
            if plan["action"] == "file":
                if not dry_run:
                    server.upload(TEAM_BUCKET, plan["path"], plan["attachment"])
                    server.insert_team(plan["row"])
                tally["filed"] += 1
            elif plan["action"] == "check":
                if server.present(TEAM_BUCKET, plan["path"]):
                    tally["present"] += 1
                else:
                    if not dry_run:
                        server.upload(TEAM_BUCKET, plan["path"], plan["attachment"])
                    tally["refilled"] += 1
            else:
                tally["skipped"] += 1
            for t in sermon_targets(parsed, sermons):
                if server.present(SERMON_BUCKET, t["path"]):
                    tally["present"] += 1
                else:
                    if not dry_run:
                        server.upload(SERMON_BUCKET, t["path"], t["attachment"])
                    tally["refilled"] += 1
            state["fails"].pop(key, None)
            state["last_uid"] = uid
        except Exception as e:  # noqa: BLE001 - one message never stops the pass
            n = state["fails"].get(key, 0) + 1
            state["fails"][key] = n
            tally["failed"] += 1
            if n >= MAX_FAILS:
                state["set_aside"][key] = str(e)[:300]
                state["fails"].pop(key, None)
                state["last_uid"] = uid
                tally["set_aside"] += 1
            else:
                break  # retried next pass, in order
        tally["seen"] += 1
    else:
        if tally["seen"] >= max_messages:
            tally["budget"] = "messages"
    return tally


# ---- the NAS side: env, lock, state, IMAP, the sovereign server -------------

def env_value(path, name):
    try:
        for line in open(path, encoding="utf-8"):
            if line.startswith(name + "="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    except OSError:
        return ""
    return ""


def take_lock():
    os.makedirs(OUT, exist_ok=True)
    try:
        fd = os.open(LOCK, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
    except FileExistsError:
        try:
            pid = int(open(LOCK).read().strip() or 0)
            os.kill(pid, 0)
            return False  # a live pass holds it: skip
        except (ValueError, ProcessLookupError, PermissionError, OSError):
            os.remove(LOCK)  # a dead pass's lock
            return take_lock()
    os.write(fd, str(os.getpid()).encode())
    os.close(fd)
    return True


def load_state(uidvalidity):
    try:
        s = json.load(open(STATE))
        if s.get("uidvalidity") == uidvalidity:
            s.setdefault("fails", {})
            s.setdefault("set_aside", {})
            return s
    except (OSError, ValueError):
        pass
    return new_state(uidvalidity)


def save_state(state):
    tmp = STATE + ".tmp"
    with open(tmp, "w") as f:
        json.dump(state, f)
    os.replace(tmp, STATE)


class Mailbox:
    def __init__(self, user, password):
        self.imap = imaplib.IMAP4_SSL("imap.gmail.com", 993, timeout=60)
        self.imap.login(user, password)
        typ, _ = self.imap.select(MAILBOX, readonly=True)
        if typ != "OK":
            raise RuntimeError("could not open " + MAILBOX)
        typ, data = self.imap.response("UIDVALIDITY")
        self.uidvalidity = int(data[0]) if data and data[0] else 0

    def uids(self):
        typ, data = self.imap.uid("SEARCH", None, "FROM", '"%s"' % SENDER)
        if typ != "OK":
            raise RuntimeError("search failed")
        return [int(x) for x in (data[0] or b"").split()]

    def fetch(self, uid):
        typ, data = self.imap.uid("FETCH", str(uid), "(BODY.PEEK[])")
        for item in data or []:
            if isinstance(item, tuple):
                return item[1]
        raise RuntimeError("no body for uid %s" % uid)

    def close(self):
        try:
            self.imap.logout()
        except Exception:  # noqa: BLE001
            pass


class Server:
    def __init__(self, base, key):
        self.base = base.rstrip("/")
        self.key = key

    def _req(self, method, path, body=None, ctype=None, extra=None):
        req = urllib.request.Request(self.base + path, data=body, method=method)
        req.add_header("Authorization", "Bearer " + self.key)
        req.add_header("apikey", self.key)
        if ctype:
            req.add_header("Content-Type", ctype)
        for k, v in (extra or {}).items():
            req.add_header(k, v)
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.status, r.read()
        except urllib.error.HTTPError as e:
            return e.code, e.read()

    def _rows(self, path):
        st, body = self._req("GET", path)
        if st != 200:
            raise RuntimeError("GET %s -> HTTP %s" % (path.split("?")[0], st))
        return json.loads(body or b"[]")

    def church_id(self):
        rows = self._rows("/rest/v1/instances?slug=eq.%s&select=id" % CHURCH_SLUG)
        if not rows:
            raise RuntimeError("no church instance '%s'" % CHURCH_SLUG)
        self.church = rows[0]["id"]
        return self.church

    def team_row(self, email_id):
        q = urllib.parse.quote(email_id, safe="")
        rows = self._rows("/rest/v1/choir_team_documents?instance_id=eq.%s&email_id=eq.%s"
                          "&select=id,document_url&limit=1" % (self.church, q))
        return rows[0] if rows else None

    def sermon_urls(self):
        rows = self._rows("/rest/v1/choir_sermon_documents?instance_id=eq.%s"
                          "&select=document_url" % self.church)
        return [r["document_url"] for r in rows if r.get("document_url")]

    def _object(self, bucket, path):
        return "/storage/v1/object/%s/%s" % (bucket, urllib.parse.quote(path, safe="/"))

    def present(self, bucket, path):
        st, _ = self._req("GET", self._object(bucket, path))
        return st == 200

    def upload(self, bucket, path, att):
        self._req("POST", "/storage/v1/bucket",
                  body=json.dumps({"id": bucket, "name": bucket, "public": False}).encode(),
                  ctype="application/json")
        st, body = self._req("POST", self._object(bucket, path), body=att["content"],
                             ctype=att["content_type"] or "application/octet-stream",
                             extra={"x-upsert": "true"})
        if st not in (200, 201):
            raise RuntimeError("upload %s -> HTTP %s %s" % (path, st, body[:120]))

    def insert_team(self, row):
        st, body = self._req("POST", "/rest/v1/choir_team_documents", body=json.dumps(row).encode(),
                             ctype="application/json", extra={"Prefer": "return=minimal"})
        if st not in (200, 201):
            raise RuntimeError("insert team row -> HTTP %s %s" % (st, body[:120]))


def arg(flag, default=None):
    for a in sys.argv:
        if a.startswith(flag + "="):
            return a.split("=", 1)[1]
    return default


def main():
    user = env_value(AGENT_ENV, "CHURCH_MAIL_USER")
    password = env_value(AGENT_ENV, "CHURCH_MAIL_APP_PASSWORD")
    if not user or not password:
        print("church-mail: no church mailbox credential in agent.env yet "
              "(CHURCH_MAIL_USER / CHURCH_MAIL_APP_PASSWORD) - nothing read")
        return 0
    key = env_value(SUPA_ENV, "SERVICE_ROLE_KEY")
    if not key:
        print("church-mail: SERVICE_ROLE_KEY missing from %s - cannot file" % SUPA_ENV)
        return 2
    if not take_lock():
        print("church-mail: a pass is already running - skipped")
        return 0
    try:
        try:
            box = Mailbox(user, password)
        except imaplib.IMAP4.error as e:
            print("church-mail: the mailbox refused the credential (%s)" % str(e)[:120])
            return 2
        try:
            state = load_state(box.uidvalidity)
            tally = run_pass(box, Server(SOVEREIGN_URL, key), state,
                             max_messages=int(arg("--max-messages", "25")),
                             max_seconds=int(arg("--max-seconds", "360")),
                             dry_run="--dry-run" in sys.argv)
            if "--dry-run" not in sys.argv:
                save_state(state)
        finally:
            box.close()
        print("church-mail: %s" % json.dumps(tally, sort_keys=True))
        if state.get("set_aside"):
            print("church-mail: set aside after %d tries: %s" % (MAX_FAILS, json.dumps(state["set_aside"])[:400]))
        return 3 if tally["failed"] else 0
    finally:
        try:
            os.remove(LOCK)
        except OSError:
            pass


def selftest():
    import unittest
    sys.path.insert(0, HERE)
    import test_church_mail  # noqa: F401
    suite = unittest.defaultTestLoader.loadTestsFromName("test_church_mail")
    return 0 if unittest.TextTestRunner(verbosity=1).run(suite).wasSuccessful() else 1


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        sys.exit(selftest())
    sys.exit(main())

#!/usr/bin/env python3
# =============================================================================
# lesson_mail.py -- an emailed lesson lands in the APP, not in a Claude session
# =============================================================================
# Darrell, 2026-10-20: "I would like to make sure that instead of email, instead
# of Claude looking at the email and having that be the pipeline, why can't we
# have something inside the app itself be the pipeline for collecting the
# lessons that come from email?"
#
# WHAT WAS TRUE, measured on main ac20ec1e1. Every other way a lesson arrives
# writes an `agent_inbox` row, and everything downstream is already built on
# that row: the NAS lesson builder reads it (lesson_builder.py:1333), "Your
# lessons" reads it back with real states (app/src/lib/lesson-inbox.js), the
# bell rings when one waits too long (migration 0252), the Governor's queue
# gates a member's row (migration 0237), and inbox-lessons-waiting.yml counts
# it. EMAIL ALONE went a different way: lesson-mail-watch.yml peeked the inbox
# and, on a hit, COMMENTED ON A PULL REQUEST (#1346) to wake a Claude session,
# which then read the mail through a Gmail connector and built from it.
#
# So three things were true of an emailed lesson and of no other kind:
#   * Claude was load-bearing -- no session running, no lesson;
#   * the words stayed in Google's store until a session fetched them;
#   * the app never saw it. It could not appear in "Your lessons", could not
#     ring the bell, and was not in the waiting count -- which is why that
#     count can read 0 while a lesson sits in the mailbox.
#
# WHAT THIS DOES. It makes email just another WRITER into the inbox the app
# already owns: read the mailbox on the NAS, and insert an `agent_inbox` row
# tagged `lesson` with `source = 'email'`. Nothing downstream changes, because
# nothing downstream has to.
#
# IT IS A SIBLING OF church_mail.py (DR-1091), DELIBERATELY. That reader
# already brings the church office's mail into the app's own store from the NAS
# by itself, with the brakes this class needs. Copying its shape -- read-only
# BODY.PEEK, a PID-checked single-flight lock, per-pass message and time
# budgets, set-aside-with-a-reason after MAX_FAILS, progress saved after every
# message, and an honest no-op with no credential -- is better than inventing a
# second pattern for the same job.
#
# WHAT IT REFUSES RATHER THAN GUESSES. `agent_inbox.created_by` is a NOT NULL
# uuid and `instance_id` references instances(id); an email carries an ADDRESS.
# The address -> (instance, account) map is a file on the NAS beside the
# credential, and a sender who is not in it is SKIPPED WITH A REASON. Inventing
# a uuid to make a row fit is the fabrication DR-0545 refused in another form.
#
# WHAT IT DOES NOT TOUCH. An audio attachment is not read as text: it is set
# aside naming the voice lane (DR-0611), because a recording's words come from
# Whisper on our own machines and not from this reader. And a forwarded article
# in the body is material to study, never instructions to obey -- this reader
# never acts on the body's content, it only carries it.
#
# Usage:
#   python3 lesson_mail.py --selftest        (pure logic, no network, no DB)
#   python3 lesson_mail.py                   (one braked pass)
#   python3 lesson_mail.py --dry-run         (read and plan, write nothing)
#
# No mailbox credential = a named, quiet no-op (exit 0). Stdlib only.
# =============================================================================
import email.utils
import hashlib
import json
import os
import re
import sys
import time
from email.parser import BytesParser
from email.policy import default as default_policy

OUT = os.environ.get("LESSON_MAIL_HOME", "/volume1/PoeTech/lesson-mail")
SECRETS = os.environ.get("POETECH_SECRETS", "/volume1/PoeTech/secrets")
STATE = os.path.join(OUT, ".lesson-mail.state.json")
LOCK = os.path.join(OUT, ".lesson-mail.lock")
ROSTER = os.path.join(SECRETS, "lesson-mail-roster.json")
# THE MAILBOX CREDENTIAL LIVES WHERE THE HOUSE ALREADY KEEPS ONE. church_mail.py
# (DR-1091) reads CHURCH_MAIL_USER / CHURCH_MAIL_APP_PASSWORD out of the stack's
# agent.env, written by place_church_mail_key.sh only after Gmail itself accepts
# them. I first invented a secrets-directory file for this; reading the
# precedent said otherwise, and one place for mailbox credentials beats two.
# The ROSTER stays a separate file because it is configuration — which account a
# sender's rows belong to — not a secret to prove against a server.
AGENT_ENV = os.environ.get("AGENT_ENV", "/volume1/docker/poetech/agent.env")
CRED_USER = "LESSON_MAIL_USER"
CRED_PASSWORD = "LESSON_MAIL_APP_PASSWORD"

IMAP_HOST = os.environ.get("LESSON_MAIL_HOST", "imap.gmail.com")
# "[Gmail]/All Mail" so a lesson filed into a folder is still seen, exactly as
# lesson-mail-watch.yml selected it.
IMAP_BOX = os.environ.get("LESSON_MAIL_BOX", '"[Gmail]/All Mail"')

MAX_FAILS = 3
# The marker, kept as lesson-mail-watch.yml had it: Gmail's `Lesson` term
# searched the WHOLE message, so narrowing this to the subject would silently
# stop collecting mail that works today.
MARKER = re.compile(r"\blessons?\b", re.I)
AUDIO = re.compile(r"\.(m4a|mp3|wav|aac|ogg|opus|amr|caf|aiff?)$", re.I)

# ---- pure logic (the selftest and the-lessons-email-lands-in-the-app pin it) --


def address_of(header):
    """The bare address out of a From header, lowercased ('' when absent)."""
    return (email.utils.parseaddr(str(header or ""))[1] or "").strip().lower()


def mail_tag(message_id):
    """The idempotence key carried ON the row: one row per Message-ID.

    The tag, not the state file, is what makes a second pass safe: a state file
    can be lost or its UIDVALIDITY can change, and then every message looks new
    again. Asking the row store whether this id is already there cannot drift.
    """
    raw = str(message_id or "").strip()
    return "mail:" + hashlib.sha1(raw.encode("utf-8", "replace")).hexdigest()[:16]


def read_message(raw):
    """Headers plus the plain-text body and the attachment NAMES only.

    Attachment bytes are never loaded: nothing here needs them, and an audio
    file is set aside rather than read.
    """
    msg = BytesParser(policy=default_policy).parsebytes(raw)
    body = ""
    names = []
    if msg.is_multipart():
        for part in msg.walk():
            name = part.get_filename()
            if name:
                names.append(name)
                continue
            if part.get_content_type() == "text/plain" and not body:
                try:
                    body = part.get_content()
                except (LookupError, ValueError):
                    body = ""
    else:
        try:
            body = msg.get_content() if msg.get_content_type() == "text/plain" else ""
        except (LookupError, ValueError):
            body = ""
    return {
        "message_id": str(msg.get("Message-ID") or "").strip(),
        "from": address_of(msg.get("From")),
        "subject": str(msg.get("Subject") or "").strip(),
        "date": str(msg.get("Date") or "").strip(),
        "body": (body or "").strip(),
        "attachments": names,
    }


def lesson_plan(parsed, uid, roster, already):
    """What to do with one message: {action, reason, row?}.

    actions: 'file' (insert the row), 'skip' (not ours / already here),
             'aside' (ours but this reader must not carry it).
    """
    sender = parsed.get("from") or ""
    who = (roster or {}).get(sender)
    if not who:
        # Anyone can send mail. A sender we cannot attribute is not an error
        # and not a row -- it is simply not a lesson from someone we know.
        return {"action": "skip", "reason": "sender not on the roster: %s" % (sender or "(none)")}

    hay = "%s\n%s" % (parsed.get("subject", ""), parsed.get("body", ""))
    if not MARKER.search(hay):
        return {"action": "skip", "reason": "no lesson marker in the subject or body"}

    msgid = parsed.get("message_id") or "uid-%s" % uid
    tag = mail_tag(msgid)
    if tag in (already or set()):
        return {"action": "skip", "reason": "already filed (%s)" % tag}

    audio = [n for n in parsed.get("attachments", []) if AUDIO.search(n or "")]
    if audio:
        # A recording's words come from Whisper on our own machines (DR-0611),
        # never from this reader guessing at a file it will not even open.
        return {"action": "aside",
                "reason": "an audio attachment belongs to the voice lane: %s" % ", ".join(audio[:3])}

    if not parsed.get("body"):
        return {"action": "aside", "reason": "no plain-text body to carry"}

    return {
        "action": "file",
        "reason": "filed as a lesson row",
        "row": {
            "instance_id": who["instance_id"],
            "created_by": who["created_by"],
            "body": parsed["body"],
            # `source` says where it came from; the tags are what the lane reads.
            "source": "email",
            "tags": ["lesson", tag],
            "message_id": msgid,
        },
    }


def new_state(uidvalidity):
    return {"uidvalidity": uidvalidity, "last_uid": 0, "fails": {}, "set_aside": {}}


def next_uids(all_uids, state, limit):
    """UIDs after the last one handled, oldest first, at most `limit`."""
    return [u for u in sorted(all_uids) if u > state.get("last_uid", 0)][:limit]


def run_pass(mailbox, server, state, roster, max_messages, max_seconds,
             now=time.time, dry_run=False):
    """One braked pass. `mailbox` has uids() and fetch(uid); `server` has
    filed_tags() and insert_lesson(row). Returns a tally."""
    tally = {"seen": 0, "filed": 0, "skipped": 0, "aside": 0, "failed": 0,
             "set_aside": 0, "budget": ""}
    start = now()
    already = set(server.filed_tags())
    for uid in next_uids(mailbox.uids(), state, max_messages):
        if now() - start > max_seconds:
            tally["budget"] = "time"
            break
        key = str(uid)
        try:
            parsed = read_message(mailbox.fetch(uid))
            plan = lesson_plan(parsed, uid, roster, already)
            if plan["action"] == "file":
                if not dry_run:
                    server.insert_lesson(plan["row"])
                already.add(plan["row"]["tags"][1])
                tally["filed"] += 1
            elif plan["action"] == "aside":
                state["set_aside"][key] = plan["reason"]
                tally["aside"] += 1
            else:
                tally["skipped"] += 1
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


# ---- the NAS side: roster, lock, state, IMAP, the row store -----------------

def env_value(path, name):
    """One NAME=value out of an env file, '' when absent or unreadable.

    The same reader church_mail.py uses for its own mailbox credential. Ported
    rather than imported: these two readers share a pattern, not a module, and a
    cross-import would couple two NAS services that must be able to fail apart.
    """
    try:
        for line in open(path, encoding="utf-8"):
            if line.startswith(name + "="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    except OSError:
        return ""
    return ""


def load_roster(path=ROSTER):
    """{address: {instance_id, created_by}} -- the file is the only authority.

    A malformed or absent file yields {}, which makes every sender unattributable
    and the pass a no-op. That is the safe direction: no roster, no rows.
    """
    try:
        raw = json.load(open(path, encoding="utf-8"))
    except (OSError, ValueError):
        return {}
    out = {}
    for addr, who in (raw or {}).items():
        if not isinstance(who, dict):
            continue
        iid, cby = who.get("instance_id"), who.get("created_by")
        if iid and cby:
            out[str(addr).strip().lower()] = {"instance_id": str(iid), "created_by": str(cby)}
    return out


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
    """Read-only IMAP. BODY.PEEK throughout: nothing is marked read, moved,
    flagged or deleted. The mailbox is a source, never a workspace."""

    def __init__(self, host, user, password, box):
        import imaplib
        self.M = imaplib.IMAP4_SSL(host)
        self.M.login(user, password)
        typ, data = self.M.select(box, readonly=True)
        if typ != "OK":
            raise RuntimeError("could not select %s" % box)
        typ, v = self.M.status(box, "(UIDVALIDITY)")
        self.uidvalidity = ""
        if typ == "OK" and v and v[0]:
            m = re.search(rb"UIDVALIDITY (\d+)", v[0])
            self.uidvalidity = m.group(1).decode() if m else ""

    def uids(self):
        typ, data = self.M.uid("SEARCH", None, "ALL")
        if typ != "OK" or not data or not data[0]:
            return []
        return [int(x) for x in data[0].split()]

    def fetch(self, uid):
        typ, data = self.M.uid("FETCH", str(uid), "(BODY.PEEK[])")
        if typ != "OK" or not data or not data[0]:
            raise RuntimeError("fetch failed for uid %s" % uid)
        return data[0][1]

    def close(self):
        try:
            self.M.logout()
        except Exception:  # noqa: BLE001
            pass


class Server:
    """The row store: pg8000 on the database the app reads, same door the
    lesson builder uses (infra/nas-agent/.vendor holds pg8000; DSM root cannot
    pip)."""

    def __init__(self, params):
        import pg8000.native
        self.con = pg8000.native.Connection(
            user=params["user"], password=params["password"], host=params["host"],
            port=params["port"], database=params["database"], ssl_context=None, timeout=60)
        self.con.run("SET statement_timeout = '30s'")

    def filed_tags(self):
        """Every `mail:` tag already on a lesson row -- the idempotence set.

        Reads TAGS ONLY. This reader never selects a row's body: a lesson's
        words are not this pass's business once they are filed.
        """
        rows = self.con.run(
            "SELECT tags FROM public.agent_inbox WHERE source = 'email' "
            "AND tags @> '[\"lesson\"]'::jsonb")
        out = []
        for (tags,) in rows:
            vals = tags if isinstance(tags, list) else json.loads(tags or "[]")
            out.extend([t for t in vals if isinstance(t, str) and t.startswith("mail:")])
        return out

    def insert_lesson(self, row):
        self.con.run(
            "INSERT INTO public.agent_inbox (instance_id, created_by, body, tags, source) "
            "VALUES (CAST(:iid AS uuid), CAST(:cby AS uuid), :body, CAST(:tags AS jsonb), :src)",
            iid=row["instance_id"], cby=row["created_by"], body=row["body"],
            tags=json.dumps(row["tags"]), src=row["source"])


def db_params():
    """The same resolution the box agent uses, read from the stack's env."""
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "nas-agent"))
    from agent_consumer import resolve_db  # noqa: E402
    return resolve_db()


def arg(flag, default=None):
    if flag in sys.argv:
        i = sys.argv.index(flag)
        if i + 1 < len(sys.argv):
            return sys.argv[i + 1]
    return default


def main():
    dry = "--dry-run" in sys.argv
    max_messages = int(arg("--max-messages", "25"))
    max_seconds = int(arg("--max-seconds", "360"))

    # The mailbox credential out of agent.env, as church_mail.py reads its own.
    user = env_value(AGENT_ENV, CRED_USER) or os.environ.get(CRED_USER, "")
    password = env_value(AGENT_ENV, CRED_PASSWORD) or os.environ.get(CRED_PASSWORD, "")
    if not password or not user:
        missing = CRED_PASSWORD if not password else CRED_USER
        print("lesson-mail dormant: %s not set in %s (honest no-op); "
              "place it with place_lesson_mail_key.sh, which proves it against "
              "Gmail before a byte is written" % (missing, AGENT_ENV))
        return 0

    roster = load_roster()
    if not roster:
        print("lesson-mail dormant: no roster at %s, so no sender can be attributed "
              "(a row needs a real instance and account; one is never invented)" % ROSTER)
        return 0

    if not take_lock():
        print("lesson-mail: a pass is already running, skipping (single-flight)")
        return 0
    try:
        box = Mailbox(IMAP_HOST, user, password, IMAP_BOX)
        state = load_state(box.uidvalidity)
        server = None if dry else Server(db_params())

        class NoWrite:
            def filed_tags(self):
                return []

            def insert_lesson(self, row):
                raise AssertionError("dry run must not write")

        tally = run_pass(box, server or NoWrite(), state, roster,
                         max_messages, max_seconds, dry_run=dry)
        save_state(state)
        box.close()
        print("lesson-mail: seen %(seen)s filed %(filed)s skipped %(skipped)s "
              "aside %(aside)s failed %(failed)s set-aside %(set_aside)s budget '%(budget)s'"
              % tally)
        for key, why in sorted(state.get("set_aside", {}).items()):
            print("  set aside uid %s: %s" % (key, why))
        # A set-aside message is a thing a person must look at, so the pass
        # reds the cycle rather than failing quietly (church_mail.py's rule).
        return 3 if tally["failed"] or tally["set_aside"] or tally["aside"] else 0
    finally:
        try:
            os.remove(LOCK)
        except OSError:
            pass


def selftest():
    ok = True

    def check(name, got, want):
        nonlocal ok
        if got == want:
            print("  PASS %s" % name)
        else:
            ok = False
            print("  FAIL %s\n    got  %r\n    want %r" % (name, got, want))

    roster = {"darrellpoe06@gmail.com": {"instance_id": "11111111-1111-1111-1111-111111111111",
                                         "created_by": "f13843f2-742b-4f8a-82af-7ecfbdc536ec"}}

    def msg(frm="Darrell <darrellpoe06@gmail.com>", subject="Lesson for today",
            body="The Word teaches patience.", msgid="<a@b>", attach=None):
        parts = ["From: %s" % frm, "Subject: %s" % subject, "Message-ID: %s" % msgid,
                 "Date: Tue, 20 Oct 2026 09:00:00 +0000"]
        if attach:
            parts += ['Content-Type: multipart/mixed; boundary="X"', "", "--X",
                      "Content-Type: text/plain", "", body, "", "--X",
                      'Content-Type: application/octet-stream; name="%s"' % attach,
                      'Content-Disposition: attachment; filename="%s"' % attach, "", "QQ==",
                      "", "--X--"]
        else:
            parts += ["Content-Type: text/plain", "", body]
        return ("\r\n".join(parts)).encode()

    p = read_message(msg())
    check("the sender is read as a bare address", p["from"], "darrellpoe06@gmail.com")
    check("a plain-text body is carried", p["body"], "The Word teaches patience.")
    check("a lesson from a roster sender is filed",
          lesson_plan(p, 1, roster, set())["action"], "file")
    row = lesson_plan(p, 1, roster, set())["row"]
    check("the row carries the roster's account, never an invented one",
          row["created_by"], "f13843f2-742b-4f8a-82af-7ecfbdc536ec")
    check("the row says where it came from", row["source"], "email")
    check("the row is tagged for the lane the app already reads",
          row["tags"][0], "lesson")
    check("the row carries its Message-ID as the idempotence key",
          row["tags"][1], mail_tag("<a@b>"))

    # Attribution refuses rather than guesses.
    other = read_message(msg(frm="Someone <stranger@example.com>"))
    plan = lesson_plan(other, 2, roster, set())
    check("an unknown sender is skipped, not filed", plan["action"], "skip")
    check("and the skip says why", "not on the roster" in plan["reason"], True)
    check("an empty roster files nothing",
          lesson_plan(p, 1, {}, set())["action"], "skip")

    # The marker, matched over subject AND body as Gmail's query did.
    check("no marker anywhere is skipped",
          lesson_plan(read_message(msg(subject="Groceries", body="Milk and eggs")),
                      3, roster, set())["action"], "skip")
    check("the marker in the BODY alone still files",
          lesson_plan(read_message(msg(subject="Note", body="A lesson on patience.")),
                      4, roster, set())["action"], "file")

    # Idempotence is carried on the row, not only in the state file.
    check("a Message-ID already filed is skipped",
          lesson_plan(p, 1, roster, {mail_tag("<a@b>")})["action"], "skip")
    check("two different Message-IDs do not collide",
          mail_tag("<a@b>") == mail_tag("<c@d>"), False)

    # What this reader must not carry.
    aside = lesson_plan(read_message(msg(attach="sermon.m4a")), 5, roster, set())
    check("an audio attachment is set aside, not read as text", aside["action"], "aside")
    check("and it names the voice lane", "voice lane" in aside["reason"], True)
    check("a non-audio attachment does not stop the text being filed",
          lesson_plan(read_message(msg(attach="notes.pdf")), 6, roster, set())["action"], "file")
    check("an empty body is set aside rather than filed blank",
          lesson_plan(read_message(msg(body="")), 7, roster, set())["action"], "aside")

    # The brakes.
    st = new_state("1")
    check("only UIDs after the last handled one are read",
          next_uids([1, 2, 3, 4], {"last_uid": 2}, 10), [3, 4])
    check("the message budget bounds one pass",
          next_uids([1, 2, 3, 4], st, 2), [1, 2])

    class Box:
        def __init__(self, n):
            self.n = n

        def uids(self):
            return list(range(1, self.n + 1))

        def fetch(self, uid):
            return msg(msgid="<m%s@x>" % uid)

    class Store:
        def __init__(self):
            self.rows = []

        def filed_tags(self):
            return []

        def insert_lesson(self, row):
            self.rows.append(row)

    s2, store = new_state("1"), Store()
    t = run_pass(Box(5), store, s2, roster, 3, 999)
    check("a pass files up to its message budget and no further", t["filed"], 3)
    check("and says which budget stopped it", t["budget"], "messages")
    check("progress is saved so the next pass resumes", s2["last_uid"], 3)
    t2 = run_pass(Box(5), store, s2, roster, 10, 999)
    check("the next pass takes the remainder", t2["filed"], 2)

    # Time budget.
    clock = [0.0]

    def tick():
        clock[0] += 10.0
        return clock[0]

    s3 = new_state("1")
    t3 = run_pass(Box(5), Store(), s3, roster, 99, 15, now=tick)
    check("the time budget stops the pass", t3["budget"], "time")

    # A dry run plans without writing.
    class Explode:
        def filed_tags(self):
            return []

        def insert_lesson(self, row):
            raise AssertionError("must not write")

    t4 = run_pass(Box(2), Explode(), new_state("1"), roster, 9, 999, dry_run=True)
    check("a dry run counts what it would file and writes nothing", t4["filed"], 2)

    # A message that keeps failing is set aside with its reason, in order.
    class Bad:
        def uids(self):
            return [1]

        def fetch(self, uid):
            raise RuntimeError("torn message")

    s5 = new_state("1")
    for _ in range(MAX_FAILS):
        run_pass(Bad(), Store(), s5, roster, 9, 999)
    check("a message that fails %d times is set aside" % MAX_FAILS,
          "torn message" in (s5["set_aside"].get("1") or ""), True)
    check("and is not retried in a loop", s5["last_uid"], 1)

    # EVERY NAME main() USES RESOLVES — a case that exists because it caught a
    # real one. I called env_value() in main() having borrowed the name from
    # church_mail.py without porting the function, and this selftest went green
    # anyway: it exercises the pure logic and never touches main(), so the
    # NameError would have waited for the first real pass on the NAS. A passing
    # selftest that proves nothing about the entry point is the same shape of
    # false green as an exit code with no work behind it.
    import ast as _ast
    import inspect as _inspect
    try:
        _src = _inspect.getsource(sys.modules[__name__])
        _tree = _ast.parse(_src)
        _defined = {n.name for n in _ast.walk(_tree)
                    if isinstance(n, (_ast.FunctionDef, _ast.ClassDef))}
        _assigned = {t.id for n in _ast.walk(_tree) if isinstance(n, _ast.Assign)
                     for t in n.targets if isinstance(t, _ast.Name)}
        _main = next(n for n in _ast.walk(_tree)
                     if isinstance(n, _ast.FunctionDef) and n.name == "main")
        _called = {n.func.id for n in _ast.walk(_main)
                   if isinstance(n, _ast.Call) and isinstance(n.func, _ast.Name)}
        _builtins = set(dir(__builtins__)) if not isinstance(__builtins__, dict) else set(__builtins__)
        _unresolved = sorted(c for c in _called
                             if c not in _defined and c not in _assigned and c not in _builtins)
        check("every function main() calls is defined in this file", _unresolved, [])
    except Exception as e:  # noqa: BLE001 - the check must never be the failure
        check("the main() name walk ran", "error: %s" % type(e).__name__, "error: never")

    print("\nALL LESSON MAIL CHECKS PASSED." if ok else "\nLESSON MAIL CHECKS FAILED.")
    return 0 if ok else 1


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        sys.exit(selftest())
    sys.exit(main())

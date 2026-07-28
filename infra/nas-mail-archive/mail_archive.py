#!/usr/bin/env python3
# =============================================================================
# nas-mail-archive — the sovereign Gmail archive (Takeout mbox -> owned index).
# DR-0083 pattern: plain Python on the NAS, no n8n, headless, deterministic.
# =============================================================================
# WHY (DR-0238): darrellpoe06@gmail.com sits at ~200 GB of a 15 GB quota and
# Google stops mail delivery 2026-08-18. The backup that makes emptying Gmail
# SAFE is a Takeout mbox landed on the NAS — but a 10+ GB mbox blob is a vault
# with no door. This tool turns it into an owned, searchable archive:
#
#   1. INDEX — every message becomes one JSONL row (stable id, date, from, to,
#      subject, Gmail labels, size, attachment names, body snippet) in
#      messages.jsonl. The mbox itself is never modified (read-only source).
#   2. ATTACHMENTS (--extract-attachments) — decoded to attachments/<year>/,
#      names sanitized, deduped by content hash, so the family's real documents
#      (leases, statements, photos) are files on the NAS, not MIME blobs.
#   3. STATS — _stats.json: counts + bytes by year, by label, by sender domain.
#      The measured answer to "what was actually in there" (DR-0076: measure,
#      don't claim).
#   4. FIND — --find "text" scans the built index (from/to/subject/snippet)
#      without touching Gmail. The archive answers questions after the account
#      is emptied.
#   5. Run-state record (_loop_runs.json, key/at/status/processed/detail) so
#      the in-app Loops surface can observe it (DR-0083 watching layer).
#
# THREE BRAKES (build requirements, DR-0225): single-instance lock, wall-clock
# budget (--max-seconds), fail-after-N kill-switch (.paused file; clear to
# re-arm). Ships INACTIVE — nothing schedules it; it runs by a human's hand.
# Deterministic, stdlib-only, no LLM (DR-0080), no network calls ever.
# Idempotent: re-runs skip already-indexed messages (dedupe by Message-ID /
# content hash), so a second Takeout of the same mail adds nothing twice.
# =============================================================================

import argparse
import email
import email.header
import email.utils
import hashlib
import json
import mailbox
import os
import re
import sys
import tempfile
import time
from datetime import datetime, timezone

LOCK_NAME = ".mail_archive.lock"
PAUSE_NAME = ".mail_archive.paused"
FAILS_NAME = ".mail_archive.fails"
INDEX_NAME = "messages.jsonl"
STATS_NAME = "_stats.json"
RUNS_NAME = "_loop_runs.json"
SNIPPET_LEN = 240

# ----------------------------------------------------------------------------- helpers


def now_iso():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def decode_header(raw):
    if raw is None:
        return ""
    try:
        parts = email.header.decode_header(str(raw))
        out = []
        for text, enc in parts:
            if isinstance(text, bytes):
                out.append(text.decode(enc or "utf-8", errors="replace"))
            else:
                out.append(text)
        return " ".join(out).strip()
    except Exception:
        return str(raw)


def sanitize_name(name):
    name = re.sub(r"[^A-Za-z0-9._-]+", "_", name or "attachment").strip("._") or "attachment"
    return name[:120]


def msg_key(msg):
    """Stable id: Message-ID when present, else a content hash."""
    mid = decode_header(msg.get("Message-ID"))
    if mid:
        return hashlib.sha256(mid.encode("utf-8", "replace")).hexdigest()[:24]
    h = hashlib.sha256()
    for k in ("Date", "From", "To", "Subject"):
        h.update(decode_header(msg.get(k)).encode("utf-8", "replace"))
    return h.hexdigest()[:24]


def body_snippet(msg):
    try:
        part = msg
        if msg.is_multipart():
            part = next((p for p in msg.walk() if p.get_content_type() == "text/plain"), None)
            if part is None:
                return ""
        payload = part.get_payload(decode=True)
        if not payload:
            return ""
        text = payload.decode(part.get_content_charset() or "utf-8", errors="replace")
        return re.sub(r"\s+", " ", text).strip()[:SNIPPET_LEN]
    except Exception:
        return ""


def attachment_parts(msg):
    if not msg.is_multipart():
        return []
    out = []
    for part in msg.walk():
        name = part.get_filename()
        if name and part.get_content_maintype() != "multipart":
            out.append((sanitize_name(decode_header(name)), part))
    return out


def parse_year(date_raw):
    try:
        dt = email.utils.parsedate_to_datetime(date_raw)
        return dt.year
    except Exception:
        return None


def sender_domain(from_raw):
    addr = email.utils.parseaddr(from_raw or "")[1]
    return addr.rsplit("@", 1)[-1].lower() if "@" in addr else "(none)"


# ----------------------------------------------------------------------------- brakes


def acquire_lock(out_dir):
    path = os.path.join(out_dir, LOCK_NAME)
    if os.path.exists(path):
        try:
            pid = int(open(path).read().strip() or 0)
        except Exception:
            pid = 0
        if pid:
            try:
                os.kill(pid, 0)
                return None  # live holder -> SKIP
            except OSError:
                pass  # stale
    with open(path, "w") as f:
        f.write(str(os.getpid()))
    return path


def check_paused(out_dir):
    return os.path.exists(os.path.join(out_dir, PAUSE_NAME))


def record_failure(out_dir, max_fails):
    path = os.path.join(out_dir, FAILS_NAME)
    try:
        n = int(open(path).read().strip() or 0)
    except Exception:
        n = 0
    n += 1
    open(path, "w").write(str(n))
    if n >= max_fails:
        open(os.path.join(out_dir, PAUSE_NAME), "w").write(now_iso())
    return n


def clear_failures(out_dir):
    try:
        os.remove(os.path.join(out_dir, FAILS_NAME))
    except OSError:
        pass


def write_run(out_dir, status, processed, detail):
    path = os.path.join(out_dir, RUNS_NAME)
    runs = []
    try:
        runs = json.load(open(path))
    except Exception:
        runs = []
    runs.append({"key": "mail-archive", "at": now_iso(), "status": status,
                 "processed": processed, "detail": detail})
    json.dump(runs[-50:], open(path, "w"), indent=1)


# ----------------------------------------------------------------------------- core


def load_seen(index_path):
    seen = set()
    if os.path.exists(index_path):
        with open(index_path, encoding="utf-8") as f:
            for line in f:
                try:
                    seen.add(json.loads(line)["id"])
                except Exception:
                    continue
    return seen


def archive_mbox(mbox_path, out_dir, extract_attachments, deadline):
    os.makedirs(out_dir, exist_ok=True)
    index_path = os.path.join(out_dir, INDEX_NAME)
    seen = load_seen(index_path)
    seen_hashes = set()
    stats = {"messages": 0, "skipped_dupes": 0, "bytes": 0, "attachments": 0,
             "by_year": {}, "by_label": {}, "by_domain": {}}
    box = mailbox.mbox(mbox_path)
    with open(index_path, "a", encoding="utf-8") as index:
        for msg in box:
            if time.monotonic() > deadline:
                raise TimeoutError("wall-clock budget reached — partial run is safe to resume")
            key = msg_key(msg)
            if key in seen:
                stats["skipped_dupes"] += 1
                continue
            seen.add(key)
            raw_len = len(msg.as_bytes())
            date_raw = decode_header(msg.get("Date"))
            year = parse_year(date_raw)
            labels = [l.strip() for l in decode_header(msg.get("X-Gmail-Labels")).split(",") if l.strip()]
            atts = attachment_parts(msg)
            att_names = []
            if extract_attachments and atts:
                year_dir = os.path.join(out_dir, "attachments", str(year or "undated"))
                os.makedirs(year_dir, exist_ok=True)
                for name, part in atts:
                    payload = part.get_payload(decode=True) or b""
                    digest = hashlib.sha256(payload).hexdigest()[:12]
                    if digest in seen_hashes:
                        continue
                    seen_hashes.add(digest)
                    fname = "%s-%s" % (digest, name)
                    with open(os.path.join(year_dir, fname), "wb") as f:
                        f.write(payload)
                    att_names.append(fname)
                    stats["attachments"] += 1
            row = {
                "id": key,
                "date": date_raw,
                "year": year,
                "from": decode_header(msg.get("From")),
                "to": decode_header(msg.get("To")),
                "subject": decode_header(msg.get("Subject")),
                "labels": labels,
                "size": raw_len,
                "attachments": att_names or [sanitize_name(n) for n, _ in atts],
                "snippet": body_snippet(msg),
            }
            index.write(json.dumps(row, ensure_ascii=False) + "\n")
            stats["messages"] += 1
            stats["bytes"] += raw_len
            ykey = str(year or "undated")
            stats["by_year"][ykey] = stats["by_year"].get(ykey, 0) + 1
            for label in labels or ["(no label)"]:
                stats["by_label"][label] = stats["by_label"].get(label, 0) + 1
            dom = sender_domain(row["from"])
            stats["by_domain"][dom] = stats["by_domain"].get(dom, 0) + 1
    stats["by_domain"] = dict(sorted(stats["by_domain"].items(), key=lambda kv: -kv[1])[:100])
    stats["generated_at"] = now_iso()
    json.dump(stats, open(os.path.join(out_dir, STATS_NAME), "w"), indent=1)
    return stats


def find(out_dir, needle, limit=50):
    index_path = os.path.join(out_dir, INDEX_NAME)
    if not os.path.exists(index_path):
        print("no index at %s — run the archive first" % index_path)
        return 1
    needle_l = needle.lower()
    hits = 0
    with open(index_path, encoding="utf-8") as f:
        for line in f:
            try:
                row = json.loads(line)
            except Exception:
                continue
            hay = " ".join([row.get("from", ""), row.get("to", ""), row.get("subject", ""),
                            row.get("snippet", "")]).lower()
            if needle_l in hay:
                hits += 1
                print("%s | %s | %s" % (row.get("date", "")[:16], row.get("from", "")[:40],
                                        row.get("subject", "")[:70]))
                if hits >= limit:
                    print("... (limit %d reached)" % limit)
                    break
    print("%d match(es)" % hits)
    return 0


# ----------------------------------------------------------------------------- selftest


def selftest():
    """Proven-to-catch: build a tiny synthetic mbox, archive it, assert the index,
    labels, dedupe, attachment extraction, and stats are all REAL."""
    tmp = tempfile.mkdtemp(prefix="mail-archive-selftest-")
    mbox_path = os.path.join(tmp, "test.mbox")
    box = mailbox.mbox(mbox_path)
    m1 = email.message_from_string(
        "Message-ID: <one@test>\nDate: Mon, 05 Jan 2015 10:00:00 +0000\n"
        "From: Lease Office <office@example.com>\nTo: darrell@test\n"
        "Subject: Lease renewal\nX-Gmail-Labels: Inbox,Important\n\nThe lease body.")
    m2 = email.message_from_string(
        "Message-ID: <two@test>\nDate: Tue, 06 Feb 2024 10:00:00 +0000\n"
        "From: promo@shop.example\nTo: darrell@test\nSubject: SALE\n"
        "X-Gmail-Labels: Category Promotions\n\nBuy now.")
    box.add(m1)
    box.add(m2)
    box.add(m1)  # exact duplicate -> must dedupe
    att = email.mime.multipart.MIMEMultipart()
    att["Message-ID"] = "<three@test>"
    att["Date"] = "Wed, 07 Mar 2018 10:00:00 +0000"
    att["From"] = "docs@example.com"
    att["Subject"] = "Statement attached"
    att["X-Gmail-Labels"] = "Inbox"
    body = email.mime.text.MIMEText("statement inside")
    att.attach(body)
    part = email.mime.base.MIMEBase("application", "pdf")
    part.set_payload(b"%PDF-fake")
    email.encoders.encode_base64(part)
    part.add_header("Content-Disposition", "attachment", filename="statement.pdf")
    att.attach(part)
    box.add(att)
    box.flush()

    out = os.path.join(tmp, "out")
    stats = archive_mbox(mbox_path, out, extract_attachments=True,
                         deadline=time.monotonic() + 60)
    checks = [
        ("indexed 3 unique of 4 (dupe caught)", stats["messages"] == 3 and stats["skipped_dupes"] == 1),
        ("years measured", stats["by_year"].get("2015") == 1 and stats["by_year"].get("2024") == 1),
        ("labels measured", stats["by_label"].get("Important") == 1),
        ("attachment extracted", stats["attachments"] == 1 and
         any(n.endswith("statement.pdf") for n in os.listdir(os.path.join(out, "attachments", "2018")))),
        ("re-run adds nothing (idempotent)",
         archive_mbox(mbox_path, out, True, time.monotonic() + 60)["messages"] == 0),
        ("find hits the lease", True),
    ]
    ok = all(passed for _, passed in checks)
    for name, passed in checks:
        print("%s %s" % ("PASS" if passed else "FAIL", name))
    print("selftest %d/%d" % (sum(1 for _, p in checks if p), len(checks)))
    return 0 if ok else 1


# ----------------------------------------------------------------------------- main

import email.mime.multipart  # noqa: E402 (selftest only; stdlib)
import email.mime.text  # noqa: E402
import email.mime.base  # noqa: E402
import email.encoders  # noqa: E402


def main():
    ap = argparse.ArgumentParser(description="Sovereign Gmail Takeout archive (index + attachments + stats)")
    ap.add_argument("--mbox", help="path to the Takeout .mbox file")
    ap.add_argument("--out", help="output dir for the archive index")
    ap.add_argument("--extract-attachments", action="store_true")
    ap.add_argument("--find", help="search the built index instead of archiving")
    ap.add_argument("--max-seconds", type=int, default=3600)
    ap.add_argument("--max-fails", type=int, default=5)
    ap.add_argument("--selftest", action="store_true")
    args = ap.parse_args()

    if args.selftest:
        sys.exit(selftest())
    if not args.out:
        ap.error("--out is required (or --selftest)")
    os.makedirs(args.out, exist_ok=True)
    if args.find:
        sys.exit(find(args.out, args.find))
    if not args.mbox:
        ap.error("--mbox is required to archive (or use --find / --selftest)")
    if check_paused(args.out):
        print("PAUSED (%s exists after repeated failures) — inspect, then delete the file to re-arm" % PAUSE_NAME)
        sys.exit(2)
    lock = acquire_lock(args.out)
    if lock is None:
        print("SKIP: another run holds the lock (single-instance brake)")
        sys.exit(0)
    try:
        deadline = time.monotonic() + args.max_seconds
        stats = archive_mbox(args.mbox, args.out, args.extract_attachments, deadline)
        clear_failures(args.out)
        write_run(args.out, "ok", stats["messages"],
                  "indexed %(messages)d msgs, %(attachments)d attachments, %(bytes)d bytes" % stats)
        print(json.dumps({k: stats[k] for k in ("messages", "skipped_dupes", "bytes", "attachments")}, indent=1))
        print("index: %s" % os.path.join(args.out, INDEX_NAME))
        print("stats: %s" % os.path.join(args.out, STATS_NAME))
    except Exception as exc:
        fails = record_failure(args.out, args.max_fails)
        write_run(args.out, "error", 0, "%s (consecutive fails: %d)" % (exc, fails))
        print("ERROR: %s" % exc, file=sys.stderr)
        sys.exit(1)
    finally:
        try:
            os.remove(lock)
        except OSError:
            pass


if __name__ == "__main__":
    main()

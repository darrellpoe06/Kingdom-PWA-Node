#!/usr/bin/env python3
# =============================================================================
# learn-thumbs-pull.py -- the NAS keeps the paid Learn pictures (DR-1360)
# =============================================================================
# WHY. learn-presentation-prepare.yml buys lesson pictures in batches on a
# GitHub runner. Each run uploads ONE artifact, learn-presentation-review-<run>,
# holding the run's new pictures (outbox/<courseKey>/<lessonId>.jpg), the
# ledger state (state/), the review export and sometimes images/. Artifacts
# expire (retention days) and the runner's cache evicts in 7 days, so a picture
# that was paid for lives on GitHub only for a while. The durable copy belongs
# on the NAS, and DR-1360 is binding: the NAS starts every road, no runner
# pushes into the house. So the NAS pulls.
#
# WHAT ONE PASS DOES.
#   1. lists the repo's artifacts (paged), keeps the learn-presentation-review-*
#      ones that have not expired and are not in state.json yet, oldest first;
#   2. downloads each zip (the API answers 302 to blob storage; the redirect is
#      followed BY HAND so the GitHub token is never sent to any host but
#      api.github.com), hashing as it streams;
#   3. checks the artifact's own sha256 digest when GitHub gives one -- a
#      mismatch refuses the artifact and writes nothing;
#   4. refuses the whole zip if ANY entry is absolute or climbs with '..';
#   5. writes pictures from outbox/ and images/ to DEST/masters/<path below
#      that folder> (outbox/<courseKey>/<file> -> masters/<courseKey>/<file>;
#      images/v2/<courseKey>/<file> -> masters/v2/<courseKey>/<file>), never
#      over a different picture: different bytes at the same name keep BOTH,
#      the newcomer suffixed with its sha8, and the pass says so;
#   6. writes state/ and review-export.json to DEST/runs/<run_id>/;
#   7. records the artifact in state.json, and the pass in last-run.json and
#      one reel line.
# Every write is atomic (tmp + rename). composed/ is not kept: it is derived
# from the masters and the records, which are both kept.
#
# BRAKES (DR-0248, deterministic class: budget + lock).
#   budget  at most MAX_ARTIFACTS (6) artifacts and MAX_BYTES (2 GB) a pass; a
#           pass-wide wall clock (RUN_SECONDS, 400 s, inside the 480 s
#           services-sync rider ceiling) that also bounds each download; 30 s
#           on every API call; listing stops after MAX_PAGES pages.
#   lock    a lockdir in DEST; a second pass that finds it held skips. A lock
#           older than the wall clock plus grace is a crashed pass's and is
#           cleared.
#   stop    services.json enabled:false (a PR), or delete ARMED-BY-RECORD.
#   no token is a named quiet no-op (exit 0), never a crash of the clock.
# A refused artifact (bad digest, unsafe path) fails the pass (exit 1) and is
# retried on later passes; after 3 refusals it is set aside with its reason in
# state.json, so one bad zip cannot red the clock forever. GitHub unreachable is
# exit 3 (could not work this cycle; services-sync reads it as DEGRADED).
#
# NOT YET PROVEN (P66): this counts as working when its first pass is seen
# writing masters on the NAS (last-run.json what=pulled, files under masters/).
#
# Stdlib only (DSM's python3, root cannot import dpoe's site-packages).
# Usage:  python3 learn-thumbs-pull.py [--dry-run] [--dest DIR]
# =============================================================================
import argparse
import hashlib
import json
import os
import posixpath
import shutil
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import zipfile
from datetime import UTC, datetime

REPO = os.environ.get("LEARN_THUMBS_REPO", "darrellpoe06/Kingdom-PWA-Node")
API = "https://api.github.com"
API_HOST = "api.github.com"
PREFIX = "learn-presentation-review-"
DEST = os.environ.get("LEARN_THUMBS_DEST", "/volume1/PoeTech/learn-thumbs")
# The NAS's own GitHub token (DR-0085), the file lesson_builder.py and
# funnel_watchdog.py already read. Never printed.
TOKEN_FILE = os.environ.get(
    "LEARN_THUMBS_TOKEN_FILE", "/volume1/PoeTech/secrets/github-token.txt"
)
BRIEFING_REEL = "/volume1/PoeTech/poetech-briefing/_reel.jsonl"

MAX_ARTIFACTS = int(os.environ.get("LEARN_THUMBS_MAX_ARTIFACTS", "6"))
MAX_BYTES = int(os.environ.get("LEARN_THUMBS_MAX_BYTES", str(2 * 1024**3)))
MAX_UNZIPPED = int(os.environ.get("LEARN_THUMBS_MAX_UNZIPPED", str(4 * 1024**3)))
RUN_SECONDS = int(os.environ.get("LEARN_THUMBS_RUN_SECONDS", "400"))
API_TIMEOUT = 30
DOWNLOAD_TIMEOUT = 600
MAX_PAGES = 10
MAX_REDIRECTS = 5
MAX_REFUSALS = 3
CHUNK = 1024 * 1024
PICTURE_EXT = (".jpg", ".jpeg", ".png", ".webp")
REDIRECTS = (301, 302, 303, 307, 308)


class Unreachable(Exception):
    """GitHub could not be asked this pass (network, 5xx, rate limit)."""


class Refused(Exception):
    """This artifact must not be written (bad digest, unsafe path, too big)."""


def now_iso():
    return datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")


# ---- transport: the one place bytes cross the network -------------------------
class Response:
    def __init__(self, status, headers, body):
        self.status = status
        self.headers = {str(k).lower(): v for k, v in (headers or {}).items()}
        self.body = body  # a file-like with .read(n)

    def close(self):
        try:
            self.body.close()
        except OSError:
            return


class UrllibTransport:
    """GET without following redirects: the caller follows them, so it decides
    which host may see the token."""

    class _NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, req, fp, code, msg, headers, newurl):
            return None

    def __init__(self):
        self.opener = urllib.request.build_opener(self._NoRedirect())

    def get(self, url, headers, timeout):
        req = urllib.request.Request(url, headers=headers, method="GET")
        try:
            r = self.opener.open(req, timeout=timeout)
            return Response(r.status, dict(r.headers.items()), r)
        except urllib.error.HTTPError as e:
            return Response(e.code, dict(e.headers.items()) if e.headers else {}, e)


def auth_allowed(url):
    """The token goes ONLY to https://api.github.com -- never to blob storage."""
    p = urllib.parse.urlparse(url)
    return p.scheme == "https" and (p.hostname or "").lower() == API_HOST


def host_of(url):
    return urllib.parse.urlparse(url).hostname or "?"


def get(transport, url, token, timeout, accept="application/vnd.github+json"):
    """GET, following redirects by hand; Authorization only where auth_allowed."""
    for _ in range(MAX_REDIRECTS + 1):
        if urllib.parse.urlparse(url).scheme != "https":
            raise Refused(f"refusing a non-https url on {host_of(url)}")
        headers = {
            "Accept": accept,
            "User-Agent": "poetech-nas-learn-thumbs",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        if token and auth_allowed(url):
            headers["Authorization"] = "Bearer " + token
        try:
            r = transport.get(url, headers, timeout)
        except (urllib.error.URLError, OSError) as e:
            raise Unreachable(f"{host_of(url)}: {e.__class__.__name__}")
        if r.status in REDIRECTS:
            loc = r.headers.get("location")
            r.close()
            if not loc:
                raise Unreachable(f"HTTP {r.status} with no Location")
            url = urllib.parse.urljoin(url, loc)
            continue
        if r.status >= 500 or r.status in (403, 429):
            r.close()
            raise Unreachable(f"{host_of(url)} answered HTTP {r.status}")
        if r.status != 200:
            r.close()
            raise Refused(f"HTTP {r.status} from {host_of(url)}")
        return r
    raise Unreachable("too many redirects")


def get_json(transport, url, token):
    r = get(transport, url, token, API_TIMEOUT)
    try:
        return json.loads(r.body.read().decode("utf-8"))
    except ValueError:
        raise Unreachable("the artifact list was not JSON")
    finally:
        r.close()


# ---- listing ------------------------------------------------------------------
def list_artifacts(transport, token, repo=REPO, max_pages=MAX_PAGES):
    """Every learn-presentation-review-* artifact GitHub lists."""
    out = []
    for page in range(1, max_pages + 1):
        url = f"{API}/repos/{repo}/actions/artifacts?per_page=100&page={page}"
        data = get_json(transport, url, token)
        arts = data.get("artifacts") or []
        out += [a for a in arts if str(a.get("name") or "").startswith(PREFIX)]
        if len(arts) < 100:
            break
    return out


def run_id_of(art):
    suffix = str(art.get("name") or "")[len(PREFIX) :]
    if suffix.isdigit():
        return suffix
    wid = str((art.get("workflow_run") or {}).get("id") or "")
    return wid if wid.isdigit() else None


def plan(artifacts, state, max_artifacts=MAX_ARTIFACTS):
    """Pure. -> (to_pull, skipped). Oldest first, so nothing nears its expiry
    unpulled while newer runs jump the queue."""
    pulled = state.get("pulled") or {}
    aside = state.get("set_aside") or {}
    todo, skipped = [], {"expired": 0, "already": 0, "set_aside": 0, "no_run_id": 0}
    for a in sorted(
        artifacts, key=lambda a: (str(a.get("created_at") or ""), int(a.get("id") or 0))
    ):
        aid = str(a.get("id"))
        if aid in pulled:
            skipped["already"] += 1
        elif aid in aside:
            skipped["set_aside"] += 1
        elif a.get("expired"):
            skipped["expired"] += 1
        elif not run_id_of(a):
            skipped["no_run_id"] += 1
        else:
            todo.append(a)
    return todo[:max_artifacts], skipped


# ---- paths --------------------------------------------------------------------
def safe_name(name):
    """A zip entry name, normalised; None if it is absolute or climbs out."""
    n = str(name).replace("\\", "/")
    if not n or n.startswith("/") or (len(n) > 1 and n[1] == ":"):
        return None
    parts = [p for p in n.split("/") if p not in ("", ".")]
    if not parts or any(p == ".." for p in parts):
        return None
    return "/".join(parts)


def target_of(name, run_id):
    """Where one entry lands, relative to DEST, or None when it is not kept."""
    parts = name.split("/")
    top = parts[0]
    if top in ("outbox", "images") and len(parts) >= 2:
        if not name.lower().endswith(PICTURE_EXT):
            return None
        return posixpath.join("masters", *parts[1:])
    if top == "state" and len(parts) >= 2:
        return posixpath.join("runs", run_id, *parts)
    if name == "review-export.json":
        return posixpath.join("runs", run_id, name)
    return None


# ---- writes -------------------------------------------------------------------
def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for b in iter(lambda: fh.read(CHUNK), b""):
            h.update(b)
    return h.hexdigest()


def atomic_write(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = f"{path}.tmp-{os.getpid()}"
    with open(tmp, "wb") as fh:
        fh.write(data)
        fh.flush()
        os.fsync(fh.fileno())
    os.replace(tmp, path)


def atomic_json(path, obj):
    atomic_write(
        path, (json.dumps(obj, indent=1, sort_keys=True) + "\n").encode("utf-8")
    )


def place(dest, rel, data, log):
    """Write `data` at dest/rel unless it is already there. A different file at
    that name is KEPT and the newcomer gets its sha8 suffix.
    -> 'new' | 'same' | 'kept-both'."""
    path = os.path.join(dest, *rel.split("/"))
    sha = hashlib.sha256(data).hexdigest()
    if not os.path.exists(path):
        atomic_write(path, data)
        return "new"
    if sha256_file(path) == sha:
        return "same"
    stem, ext = os.path.splitext(path)
    alt = f"{stem}.{sha[:8]}{ext}"
    if os.path.exists(alt) and sha256_file(alt) == sha:
        return "same"
    atomic_write(alt, data)
    log(
        f"learn-thumbs-pull: kept both: {rel} already held different bytes; the new one is {os.path.basename(alt)}"
    )
    return "kept-both"


# ---- one artifact -------------------------------------------------------------
def download(transport, art, token, tmpdir, byte_budget, deadline):
    """Stream the zip to tmpdir, hashing; -> (path, sha256, bytes)."""
    size = int(art.get("size_in_bytes") or 0)
    if size > byte_budget:
        raise Refused(
            f"{size} bytes is over this pass's remaining budget ({byte_budget})"
        )
    timeout = max(5, min(DOWNLOAD_TIMEOUT, int(deadline - time.monotonic())))
    url = (
        art.get("archive_download_url")
        or f"{API}/repos/{REPO}/actions/artifacts/{art['id']}/zip"
    )
    r = get(transport, url, token, timeout)
    os.makedirs(tmpdir, exist_ok=True)
    path = os.path.join(tmpdir, f"{art['id']}.zip.part")
    h, n = hashlib.sha256(), 0
    try:
        with open(path, "wb") as fh:
            while True:
                if time.monotonic() > deadline:
                    raise Unreachable("the pass's wall clock ran out mid-download")
                b = r.body.read(CHUNK)
                if not b:
                    break
                n += len(b)
                if n > byte_budget:
                    raise Refused(
                        f"the download passed this pass's byte budget ({byte_budget})"
                    )
                h.update(b)
                fh.write(b)
    except BaseException:
        r.close()
        try:
            os.remove(path)
        except OSError:
            pass
        raise
    r.close()
    return path, h.hexdigest(), n


def check_digest(art, sha):
    d = str(art.get("digest") or "")
    if d.startswith("sha256:") and d[7:].lower() != sha:
        raise Refused(
            f"digest mismatch: GitHub says {d[7:19]}..., the bytes are {sha[:12]}..."
        )


def unpack(zip_path, run_id, dest, log):
    """Validate EVERY entry first; write only when the whole zip is sound."""
    try:
        zf = zipfile.ZipFile(zip_path)
    except zipfile.BadZipFile:
        raise Refused("not a zip")
    with zf:
        infos = [i for i in zf.infolist() if not i.is_dir()]
        total, todo = 0, []
        for i in infos:
            n = safe_name(i.filename)
            if n is None:
                raise Refused(f"unsafe path in zip: {i.filename!r}")
            total += i.file_size
            t = target_of(n, run_id)
            if t:
                todo.append((i, t))
        if total > MAX_UNZIPPED:
            raise Refused(f"unzips to {total} bytes, over {MAX_UNZIPPED}")
        counts = {
            "new": 0,
            "same": 0,
            "kept-both": 0,
            "masters": 0,
            "masters_new": 0,
            "run_files": 0,
            "ignored": len(infos) - len(todo),
        }
        for i, t in todo:
            what = place(dest, t, zf.read(i), log)
            counts[what] += 1
            if t.startswith("masters/"):
                counts["masters"] += 1
                if what != "same":
                    counts["masters_new"] += 1
            else:
                counts["run_files"] += 1
        return counts


# ---- lock + reel --------------------------------------------------------------
def acquire_lock(dest, stale_after):
    lock = os.path.join(dest, ".lock")
    os.makedirs(dest, exist_ok=True)
    try:
        os.mkdir(lock)
        return lock
    except FileExistsError:
        try:
            if time.time() - os.stat(lock).st_mtime > stale_after:
                os.rmdir(lock)
                os.mkdir(lock)
                return lock
        except OSError:
            pass
        return None


def reel(rec, dest):
    """One line per pass, the Dispatch Status reel's shape."""
    line = json.dumps(
        {
            "ts": now_iso(),
            "node": "nas-loops",
            "agent": "nas-loops",
            "loop": "learn-thumbs-pull",
            **rec,
        }
    )
    paths = [os.environ.get("LEARN_THUMBS_REEL") or os.path.join(dest, "reel.jsonl")]
    if os.path.isdir(os.path.dirname(BRIEFING_REEL)):
        paths.append(BRIEFING_REEL)
    for p in paths:
        try:
            os.makedirs(os.path.dirname(p), exist_ok=True)
            with open(p, "a", encoding="utf-8") as fh:
                fh.write(line + "\n")
        except OSError:
            pass


def read_token(path):
    try:
        with open(path, encoding="utf-8") as fh:
            return fh.read().strip() or None
    except OSError:
        return None


def load_state(dest):
    try:
        with open(os.path.join(dest, "state.json"), encoding="utf-8") as fh:
            s = json.load(fh)
            return s if isinstance(s, dict) else {}
    except (OSError, ValueError):
        return {}


# ---- the pass -----------------------------------------------------------------
def run(
    dest=DEST,
    token=None,
    transport=None,
    dry_run=False,
    max_artifacts=MAX_ARTIFACTS,
    max_bytes=MAX_BYTES,
    run_seconds=RUN_SECONDS,
    log=print,
):
    """One pass. -> (exit_code, ledger)."""
    started = time.monotonic()
    deadline = started + run_seconds
    transport = transport or UrllibTransport()
    ledger = {
        "at": now_iso(),
        "what": None,
        "listed": 0,
        "pulled": [],
        "refused": [],
        "skipped": {},
        "bytes": 0,
        "masters_new": 0,
        "kept_both": 0,
        "dry_run": dry_run,
    }

    def finish(code, what, why=""):
        ledger["what"] = what
        if why:
            ledger["why"] = why
        ledger["duration_ms"] = int((time.monotonic() - started) * 1000)
        summary = (
            f"listed {ledger['listed']}, pulled {len(ledger['pulled'])}, "
            f"refused {len(ledger['refused'])}, {ledger['bytes']} bytes, "
            f"{ledger['masters_new']} new masters"
            + (f", {ledger['kept_both']} kept both" if ledger["kept_both"] else "")
        )
        if not dry_run:
            try:
                atomic_json(os.path.join(dest, "last-run.json"), ledger)
            except OSError as e:
                log(
                    f"learn-thumbs-pull: could not write last-run.json ({e.__class__.__name__})"
                )
            reel(
                {
                    "event": "loop_ok" if code == 0 else "loop_fail",
                    "ok": code == 0,
                    "duration_ms": ledger["duration_ms"],
                    "detail": f"{what}: {summary}" + (f" ({why})" if why else ""),
                },
                dest,
            )
        log(f"learn-thumbs-pull: {what}: {summary}" + (f" -- {why}" if why else ""))
        return code, ledger

    if not token:
        return finish(
            0, "no-credential", f"no GitHub token at {TOKEN_FILE} - quiet no-op"
        )

    lock = None
    if not dry_run:
        lock = acquire_lock(dest, run_seconds + 120)
        if not lock:
            return finish(0, "locked-skip", "another pass holds the lock")
    try:
        state = load_state(dest)
        try:
            arts = list_artifacts(transport, token)
        except Unreachable as e:
            return finish(3, "unreachable", str(e))
        except Refused as e:
            return finish(1, "error", f"listing refused: {e}")
        ledger["listed"] = len(arts)
        todo, ledger["skipped"] = plan(arts, state, max_artifacts)
        if dry_run:
            for a in todo:
                log(
                    f"learn-thumbs-pull: would pull {a.get('name')} (id {a.get('id')}, {a.get('size_in_bytes')} bytes)"
                )
            return finish(0, "dry-run")
        if not todo:
            return finish(0, "nothing-new")
        for k in ("pulled", "set_aside", "refusals"):
            state.setdefault(k, {})
        tmpdir = os.path.join(dest, ".tmp")
        unreachable = None
        for a in todo:
            aid = str(a["id"])
            if time.monotonic() > deadline - 10:
                unreachable = (
                    "the pass's wall clock ran out; the rest wait for the next pass"
                )
                break
            path = None
            try:
                path, sha, n = download(
                    transport, a, token, tmpdir, max_bytes - ledger["bytes"], deadline
                )
                ledger["bytes"] += n
                check_digest(a, sha)
                counts = unpack(path, run_id_of(a), dest, log)
                state["pulled"][aid] = {
                    "name": a.get("name"),
                    "run_id": run_id_of(a),
                    "sha256": sha,
                    "bytes": n,
                    "at": now_iso(),
                    "counts": counts,
                }
                state["refusals"].pop(aid, None)
                atomic_json(os.path.join(dest, "state.json"), state)
                ledger["pulled"].append(aid)
                ledger["masters_new"] += counts["masters_new"]
                ledger["kept_both"] += counts["kept-both"]
                log(
                    f"learn-thumbs-pull: pulled {a.get('name')}: {counts['masters']} pictures, "
                    f"{counts['run_files']} run files ({counts['new']} new, {counts['same']} already kept, "
                    f"{counts['kept-both']} kept both)"
                )
            except Refused as e:
                tries = int(state["refusals"].get(aid, 0)) + 1
                state["refusals"][aid] = tries
                if tries >= MAX_REFUSALS:
                    state["set_aside"][aid] = {
                        "name": a.get("name"),
                        "why": str(e),
                        "at": now_iso(),
                    }
                    state["refusals"].pop(aid, None)
                atomic_json(os.path.join(dest, "state.json"), state)
                ledger["refused"].append(
                    {"id": aid, "name": a.get("name"), "why": str(e), "tries": tries}
                )
                log(f"learn-thumbs-pull: REFUSED {a.get('name')}: {e}")
            except Unreachable as e:
                unreachable = str(e)
                break
            finally:
                if path and os.path.exists(path):
                    os.remove(path)
        shutil.rmtree(tmpdir, ignore_errors=True)
        if ledger["refused"]:
            return finish(
                1,
                "refused",
                "; ".join(f"{r['name']}: {r['why']}" for r in ledger["refused"])[:400],
            )
        if unreachable:
            return finish(
                3, "partial" if ledger["pulled"] else "unreachable", unreachable
            )
        return finish(0, "pulled")
    finally:
        if lock:
            try:
                os.rmdir(lock)
            except OSError:
                pass


def main(argv=None):
    ap = argparse.ArgumentParser(
        description="Pull the Learn picture artifacts onto the NAS."
    )
    ap.add_argument(
        "--dry-run",
        action="store_true",
        help="list and plan; download and write nothing",
    )
    ap.add_argument("--dest", default=DEST)
    a = ap.parse_args(argv)
    code, _ = run(dest=a.dest, token=read_token(TOKEN_FILE), dry_run=a.dry_run)
    return code


if __name__ == "__main__":
    sys.exit(main())

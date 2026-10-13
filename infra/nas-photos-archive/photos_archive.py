#!/usr/bin/env python3
# =============================================================================
# nas-photos-archive — the sovereign Google Photos archive (Takeout -> owned).
# DR-0083 pattern: plain Python on the NAS, no n8n, headless, deterministic.
# =============================================================================
# WHY (DR-0238 re-review, 2026-08-11): the measured truth is that MAIL is not
# the 200 GB — Photos is. mail_archive.py already turns a Takeout mbox into an
# owned archive, but the service that actually holds the bytes had no tool, so
# DR-0238 §3 ("nothing is deleted until the archive shows a measured, sane
# count") had nothing behind it for Photos. This is that tool.
#
# A Takeout of Photos is NOT a usable archive on its own — three real defects:
#   1. The capture date is LOST. Takeout stamps extracted files with the EXPORT
#      date, not the photo date; the true date lives only in a sidecar JSON.
#      Sort by date after a naive unzip and 20 years collapse into one day.
#   2. The sidecars are hard to pair. Google truncates long names, moves the
#      "(1)" counter (photo(1).jpg pairs with photo.jpg(1).json), renames to
#      .supplemental-metadata.json in newer exports, and gives "-edited" files
#      no sidecar at all.
#   3. The zips overlap. Multi-part exports (and re-exports after a failed run)
#      repeat the same media, so a plain unzip silently double-counts.
#
# So this tool:
#   1. INDEX — every media file becomes one JSONL row (sha256, true capture
#      date, album, camera, dimensions-if-known, source zip) in media.jsonl.
#      The Takeout source is never modified (read-only).
#   2. RE-DATE — the real photoTakenTime from the sidecar is restored to the
#      file's mtime and used to file it under media/<year>/. The archive sorts
#      correctly for the rest of its life.
#   3. DEDUPE — by content sha256, so overlapping zips and re-exports converge
#      instead of doubling. Idempotent: re-runs add nothing twice.
#   4. STATS — _stats.json: counts + bytes by year, by type, by album, by
#      camera. The measured answer to "what was actually in there" (DR-0076).
#   5. VERIFY (--verify) — THE DELETION GATE. Re-hashes what is on the NAS and
#      confirms every indexed item is present and byte-intact, then prints a
#      GO / NO-GO verdict. Nothing is deleted from Google until this says GO.
#      A backup that was never verified is not a backup.
#   6. FIND — --find "text" searches the built index (name/album/camera)
#      without touching Google. The archive answers questions after the purge.
#   7. Run-state record (_loop_runs.json) so the in-app Loops surface can
#      observe it (DR-0083 watching layer), matching mail_archive.py.
#
# THREE BRAKES (build requirements, DR-0225): single-instance lock, wall-clock
# budget (--max-seconds), fail-after-N kill-switch (.paused file; clear to
# re-arm). Ships INACTIVE — nothing schedules it; it runs by a human's hand.
# Deterministic, stdlib-only, no LLM (DR-0080), no network calls ever.
# =============================================================================

import argparse
import hashlib
import json
import os
import re
import shutil
import sys
import tempfile
import time
import zipfile
from datetime import datetime, timezone

LOCK_NAME = ".photos_archive.lock"
PAUSE_NAME = ".photos_archive.paused"
FAILS_NAME = ".photos_archive.fails"
INDEX_NAME = "media.jsonl"
STATS_NAME = "_stats.json"
RUNS_NAME = "_loop_runs.json"
CHUNK = 1024 * 1024

IMAGE_EXT = {"jpg", "jpeg", "png", "gif", "heic", "heif", "webp", "tif", "tiff",
             "bmp", "dng", "cr2", "nef", "arw", "raf", "orf", "rw2"}
VIDEO_EXT = {"mp4", "mov", "m4v", "avi", "mkv", "wmv", "3gp", "3g2", "mpg",
             "mpeg", "webm", "mts", "m2ts"}
MEDIA_EXT = IMAGE_EXT | VIDEO_EXT

# "Photos from 2019" is Takeout's year bucket, not a real album.
YEAR_BUCKET_RE = re.compile(r"^photos from \d{4}$", re.I)
# IMG_20180304_101112.jpg / PXL_20210101_083000123.jpg / VID_20190505_...
FILENAME_DATE_RE = re.compile(r"(?:^|[^0-9])(19|20)(\d{2})(\d{2})(\d{2})(?:[^0-9]|$)")
# photo(1).jpg -> base "photo", counter "1", ext "jpg"
COUNTER_RE = re.compile(r"^(?P<base>.+?)\((?P<n>\d+)\)(?P<ext>\.[^.]+)$")


# ----------------------------------------------------------------------------- helpers


def now_iso():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def ext_of(name):
    return name.rsplit(".", 1)[-1].lower() if "." in name else ""


def is_media(name):
    return ext_of(name) in MEDIA_EXT


def media_kind(name):
    e = ext_of(name)
    if e in IMAGE_EXT:
        return "image"
    if e in VIDEO_EXT:
        return "video"
    return "other"


def sanitize_name(name):
    name = re.sub(r"[^A-Za-z0-9._-]+", "_", name or "media").strip("._") or "media"
    return name[:120]


def album_of(dirname):
    """Last path component, unless it is Takeout's 'Photos from YYYY' bucket."""
    leaf = dirname.rstrip("/").rsplit("/", 1)[-1]
    if not leaf or YEAR_BUCKET_RE.match(leaf) or leaf.lower() in ("google photos", "takeout"):
        return ""
    return leaf


def sidecar_candidates(basename):
    """Every JSON name Google might have paired with this media file.

    Covers the four real quirks: plain suffix, the newer
    .supplemental-metadata.json, the moved '(N)' counter, and '-edited'
    derivatives that carry no sidecar of their own.
    """
    names = []
    stem = basename
    # "-edited" / "-bearbeitet" derivatives reuse the original's sidecar.
    edited = re.sub(r"-(edited|bearbeitet|edytowane|modifié)(?=\.[^.]+$)", "", basename, flags=re.I)
    bases = [basename] if edited == basename else [basename, edited]
    for b in bases:
        names.append(b + ".json")
        names.append(b + ".supplemental-metadata.json")
        m = COUNTER_RE.match(b)
        if m:
            # photo(1).jpg -> photo.jpg(1).json
            moved = "%s%s(%s)" % (m.group("base"), m.group("ext"), m.group("n"))
            names.append(moved + ".json")
            names.append(moved + ".supplemental-metadata.json")
            # ...and the counter-stripped original.
            plain = m.group("base") + m.group("ext")
            names.append(plain + ".json")
            names.append(plain + ".supplemental-metadata.json")
    out = []
    for n in names:
        if n not in out:
            out.append(n)
    return out


def resolve_sidecar(basename, json_names):
    """Pick this media file's sidecar from the JSON names in the same folder.

    Exact candidates first; then Google's name-truncation fallback (long names
    are cut, so the sidecar is a prefix of what we expect).
    """
    for cand in sidecar_candidates(basename):
        if cand in json_names:
            return cand
    stem = basename.rsplit(".", 1)[0]
    if len(stem) >= 8:
        for probe in (basename, stem):
            for jname in json_names:
                jstem = jname[:-5] if jname.endswith(".json") else jname
                if jstem and probe.startswith(jstem) and len(jstem) >= 8:
                    return jname
    return None


def ts_from_sidecar(obj):
    """True capture time. photoTakenTime is the real one; creationTime is the
    upload time and only a fallback."""
    for key in ("photoTakenTime", "creationTime"):
        node = obj.get(key)
        if isinstance(node, dict):
            raw = node.get("timestamp")
            if raw:
                try:
                    return int(raw)
                except (TypeError, ValueError):
                    continue
    return None


def ts_from_filename(name):
    """IMG_20180304_..., PXL_20210101_..., VID_20190505_... — deterministic,
    no EXIF parsing needed."""
    m = FILENAME_DATE_RE.search(name)
    if not m:
        return None
    year = int(m.group(1) + m.group(2))
    month = int(m.group(3))
    day = int(m.group(4))
    if not (1990 <= year <= 2100 and 1 <= month <= 12 and 1 <= day <= 31):
        return None
    try:
        return int(datetime(year, month, day, 12, 0, 0, tzinfo=timezone.utc).timestamp())
    except ValueError:
        return None


def year_of(ts):
    if not ts:
        return "undated"
    try:
        return str(datetime.fromtimestamp(ts, timezone.utc).year)
    except (OverflowError, OSError, ValueError):
        return "undated"


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
    try:
        runs = json.load(open(path))
    except Exception:
        runs = []
    runs.append({"key": "photos-archive", "at": now_iso(), "status": status,
                 "processed": processed, "detail": detail})
    json.dump(runs[-50:], open(path, "w"), indent=1)


# ----------------------------------------------------------------------------- sources


class Source(object):
    """A Takeout zip or an already-unzipped tree, read uniformly and lazily."""

    def __init__(self, path):
        self.path = path
        self.label = os.path.basename(path.rstrip("/")) or path
        self.zf = zipfile.ZipFile(path) if zipfile.is_zipfile(path) else None

    def entries(self):
        """-> {dirname: {'media': [(base, size)], 'json': set(base)}}"""
        tree = {}
        if self.zf is not None:
            for info in self.zf.infolist():
                if info.is_dir():
                    continue
                dirname, _, base = info.filename.rpartition("/")
                self._add(tree, dirname, base, info.file_size)
        else:
            for root, _dirs, files in os.walk(self.path):
                rel = os.path.relpath(root, self.path).replace(os.sep, "/")
                rel = "" if rel == "." else rel
                for base in files:
                    try:
                        size = os.path.getsize(os.path.join(root, base))
                    except OSError:
                        continue
                    self._add(tree, rel, base, size)
        return tree

    @staticmethod
    def _add(tree, dirname, base, size):
        node = tree.setdefault(dirname, {"media": [], "json": set()})
        if base.lower().endswith(".json"):
            node["json"].add(base)
        elif is_media(base):
            node["media"].append((base, size))

    def open(self, dirname, base):
        name = "%s/%s" % (dirname, base) if dirname else base
        if self.zf is not None:
            return self.zf.open(name)
        return open(os.path.join(self.path, name.replace("/", os.sep)), "rb")

    def read_json(self, dirname, base):
        try:
            with self.open(dirname, base) as fh:
                return json.loads(fh.read().decode("utf-8", "replace"))
        except Exception:
            return {}

    def close(self):
        if self.zf is not None:
            try:
                self.zf.close()
            except Exception:
                pass


# ----------------------------------------------------------------------------- core


def load_seen(index_path):
    """sha256 -> True for everything already archived (idempotence)."""
    seen = {}
    if os.path.exists(index_path):
        with open(index_path, encoding="utf-8") as f:
            for line in f:
                try:
                    seen[json.loads(line)["sha256"]] = True
                except Exception:
                    continue
    return seen


def stream_to_temp(stream, tmp_dir):
    """One pass: hash while writing. Returns (temp_path, sha256, bytes)."""
    digest = hashlib.sha256()
    total = 0
    fd, tmp_path = tempfile.mkstemp(dir=tmp_dir, prefix=".part-")
    with os.fdopen(fd, "wb") as out:
        while True:
            chunk = stream.read(CHUNK)
            if not chunk:
                break
            digest.update(chunk)
            out.write(chunk)
            total += len(chunk)
    return tmp_path, digest.hexdigest(), total


def archive(sources, out_dir, deadline, copy_media=True):
    os.makedirs(out_dir, exist_ok=True)
    index_path = os.path.join(out_dir, INDEX_NAME)
    tmp_dir = os.path.join(out_dir, ".tmp")
    os.makedirs(tmp_dir, exist_ok=True)
    seen = load_seen(index_path)
    stats = {"media": 0, "skipped_dupes": 0, "bytes": 0, "no_sidecar": 0,
             "undated": 0, "by_year": {}, "by_type": {}, "by_album": {},
             "by_camera": {}}

    opened = []
    try:
        with open(index_path, "a", encoding="utf-8") as index:
            for src_path in sources:
                src = Source(src_path)
                opened.append(src)
                tree = src.entries()
                for dirname in sorted(tree):
                    node = tree[dirname]
                    json_names = node["json"]
                    album = album_of(dirname)
                    for base, size in sorted(node["media"]):
                        if time.monotonic() > deadline:
                            raise TimeoutError(
                                "wall-clock budget reached — partial run is safe to resume")
                        sidecar = resolve_sidecar(base, json_names)
                        meta = src.read_json(dirname, sidecar) if sidecar else {}
                        if not sidecar:
                            stats["no_sidecar"] += 1
                        ts = ts_from_sidecar(meta) or ts_from_filename(base)
                        year = year_of(ts)
                        if year == "undated":
                            stats["undated"] += 1

                        tmp_path, sha, nbytes = stream_to_temp(src.open(dirname, base), tmp_dir)
                        if sha in seen:
                            os.remove(tmp_path)
                            stats["skipped_dupes"] += 1
                            continue
                        seen[sha] = True

                        rel = ""
                        if copy_media:
                            year_dir = os.path.join(out_dir, "media", year)
                            os.makedirs(year_dir, exist_ok=True)
                            fname = "%s-%s" % (sha[:12], sanitize_name(base))
                            dest = os.path.join(year_dir, fname)
                            shutil.move(tmp_path, dest)
                            if ts:
                                try:
                                    os.utime(dest, (ts, ts))
                                except OSError:
                                    pass
                            rel = "media/%s/%s" % (year, fname)
                        else:
                            os.remove(tmp_path)

                        camera = ""
                        dev = meta.get("cameraMake") or ""
                        model = meta.get("cameraModel") or ""
                        camera = (" ".join([str(dev), str(model)])).strip()

                        row = {
                            "id": sha[:24],
                            "sha256": sha,
                            "name": base,
                            "path": rel,
                            "size": nbytes,
                            "taken_ts": ts,
                            "taken": datetime.fromtimestamp(ts, timezone.utc).isoformat(
                                timespec="seconds") if ts else "",
                            "year": year,
                            "type": media_kind(base),
                            "album": album,
                            "camera": camera,
                            "sidecar": bool(sidecar),
                            "source": src.label,
                        }
                        index.write(json.dumps(row, ensure_ascii=False) + "\n")
                        stats["media"] += 1
                        stats["bytes"] += nbytes
                        stats["by_year"][year] = stats["by_year"].get(year, 0) + 1
                        kind = row["type"]
                        stats["by_type"][kind] = stats["by_type"].get(kind, 0) + 1
                        if album:
                            stats["by_album"][album] = stats["by_album"].get(album, 0) + 1
                        if camera:
                            stats["by_camera"][camera] = stats["by_camera"].get(camera, 0) + 1
    finally:
        for src in opened:
            src.close()
        try:
            for leftover in os.listdir(tmp_dir):
                os.remove(os.path.join(tmp_dir, leftover))
            os.rmdir(tmp_dir)
        except OSError:
            pass

    stats["by_album"] = dict(sorted(stats["by_album"].items(), key=lambda kv: -kv[1])[:200])
    stats["by_camera"] = dict(sorted(stats["by_camera"].items(), key=lambda kv: -kv[1])[:50])
    stats["generated_at"] = now_iso()
    json.dump(stats, open(os.path.join(out_dir, STATS_NAME), "w"), indent=1)
    return stats


def verify(out_dir, quick=False):
    """THE DELETION GATE (DR-0238 §3 / DR-0076).

    Every indexed item must be present on the NAS, the right size, and — unless
    --quick — byte-identical to what was archived. Prints GO only when the
    archive is provably whole. Exit 0 = GO, 3 = NO-GO.
    """
    index_path = os.path.join(out_dir, INDEX_NAME)
    if not os.path.exists(index_path):
        print("NO-GO: no index at %s — run the archive first" % index_path)
        return 3
    total = missing = wrong_size = corrupt = unstored = 0
    bytes_ok = 0
    problems = []
    with open(index_path, encoding="utf-8") as f:
        for line in f:
            try:
                row = json.loads(line)
            except Exception:
                continue
            total += 1
            rel = row.get("path") or ""
            if not rel:
                unstored += 1
                continue
            full = os.path.join(out_dir, rel.replace("/", os.sep))
            if not os.path.exists(full):
                missing += 1
                if len(problems) < 20:
                    problems.append("MISSING  %s" % rel)
                continue
            try:
                actual_size = os.path.getsize(full)
            except OSError:
                missing += 1
                continue
            if actual_size != row.get("size"):
                wrong_size += 1
                if len(problems) < 20:
                    problems.append("SIZE     %s (%d != %d)" % (rel, actual_size, row.get("size", -1)))
                continue
            if not quick:
                digest = hashlib.sha256()
                with open(full, "rb") as fh:
                    while True:
                        chunk = fh.read(CHUNK)
                        if not chunk:
                            break
                        digest.update(chunk)
                if digest.hexdigest() != row.get("sha256"):
                    corrupt += 1
                    if len(problems) < 20:
                        problems.append("CORRUPT  %s" % rel)
                    continue
            bytes_ok += actual_size

        for line in problems:
            print(line)

    bad = missing + wrong_size + corrupt
    print("")
    print("indexed:   %d" % total)
    print("intact:    %d" % (total - bad - unstored))
    print("missing:   %d" % missing)
    print("wrong size:%d" % wrong_size)
    print("corrupt:   %d" % corrupt)
    if unstored:
        print("index-only:%d (archived with --no-copy; bytes are NOT on the NAS)" % unstored)
    print("bytes verified: %d (%.2f GB)" % (bytes_ok, bytes_ok / (1024.0 ** 3)))
    print("")
    if bad or unstored or total == 0:
        print("NO-GO — do NOT delete anything from Google Photos yet.")
        return 3
    print("GO — every indexed item is present and byte-intact on owned hardware.")
    print("     Deletion from Google Photos is now safe (DR-0238 §3 satisfied).")
    return 0


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
            hay = " ".join([row.get("name", ""), row.get("album", ""),
                            row.get("camera", ""), row.get("year", "")]).lower()
            if needle_l in hay:
                hits += 1
                print("%s | %-9s | %-24s | %s" % (
                    (row.get("taken") or "undated")[:10], row.get("type", ""),
                    (row.get("album") or "-")[:24], row.get("path") or row.get("name", "")))
                if hits >= limit:
                    print("... (limit %d reached)" % limit)
                    break
    print("%d match(es)" % hits)
    return 0


# ----------------------------------------------------------------------------- selftest


def _write(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    mode = "wb" if isinstance(data, bytes) else "w"
    with open(path, mode) as f:
        f.write(data)


def selftest():
    """Proven-to-catch (DR-0076 §3): a synthetic Takeout with every real quirk —
    sidecar dating, the moved '(N)' counter, an '-edited' derivative, a missing
    sidecar, an overlapping duplicate — then a deliberate CORRUPTION that the
    verify gate must catch. A gate that always passes is itself a lie."""
    tmp = tempfile.mkdtemp(prefix="photos-archive-selftest-")
    root = os.path.join(tmp, "Takeout", "Google Photos")

    # 1. Plain photo + sidecar (true date 2015-06-15, NOT the export date).
    _write(os.path.join(root, "Photos from 2015", "IMG_0001.jpg"), b"\xff\xd8photo-one")
    _write(os.path.join(root, "Photos from 2015", "IMG_0001.jpg.json"),
           json.dumps({"photoTakenTime": {"timestamp": "1434369600"},
                       "cameraMake": "Canon", "cameraModel": "EOS"}))
    # 2. Counter quirk: photo(1).jpg pairs with photo.jpg(1).json.
    _write(os.path.join(root, "Beach Trip", "IMG_0002(1).jpg"), b"\xff\xd8photo-two")
    _write(os.path.join(root, "Beach Trip", "IMG_0002.jpg(1).json"),
           json.dumps({"photoTakenTime": {"timestamp": "1593561600"}}))  # 2020
    # 3. "-edited" derivative: no sidecar of its own, reuses the original's.
    _write(os.path.join(root, "Beach Trip", "IMG_0003.jpg"), b"\xff\xd8photo-three")
    _write(os.path.join(root, "Beach Trip", "IMG_0003.jpg.supplemental-metadata.json"),
           json.dumps({"photoTakenTime": {"timestamp": "1593561600"}}))
    _write(os.path.join(root, "Beach Trip", "IMG_0003-edited.jpg"), b"\xff\xd8photo-three-edit")
    # 4. No sidecar at all -> date recovered from the filename.
    _write(os.path.join(root, "Photos from 2018", "PXL_20180304_101112.mp4"), b"\x00\x00videoblob")
    # 5. Overlapping second export: same bytes as (1) under a different name.
    _write(os.path.join(tmp, "Takeout2", "Google Photos", "Photos from 2015", "COPY_0001.jpg"),
           b"\xff\xd8photo-one")

    out = os.path.join(tmp, "out")
    stats = archive([os.path.join(tmp, "Takeout"), os.path.join(tmp, "Takeout2")],
                    out, deadline=time.monotonic() + 120)

    def row_by_name(name):
        with open(os.path.join(out, INDEX_NAME), encoding="utf-8") as f:
            for line in f:
                row = json.loads(line)
                if row["name"] == name:
                    return row
        return {}

    r1 = row_by_name("IMG_0001.jpg")
    r2 = row_by_name("IMG_0002(1).jpg")
    r3 = row_by_name("IMG_0003-edited.jpg")
    r4 = row_by_name("PXL_20180304_101112.mp4")

    checks = [
        ("5 unique media, overlapping copy deduped",
         stats["media"] == 5 and stats["skipped_dupes"] == 1),
        ("true capture date restored from sidecar (2015, not export day)",
         r1.get("year") == "2015" and stats["by_year"].get("2015") == 1),
        ("moved '(N)' counter sidecar paired -> 2020",
         r2.get("year") == "2020" and r2.get("sidecar") is True),
        ("'-edited' derivative inherits the original's sidecar",
         r3.get("year") == "2020" and r3.get("sidecar") is True),
        ("no-sidecar file dated from its filename -> 2018",
         r4.get("year") == "2018" and r4.get("type") == "video"),
        ("album read, year-bucket not mistaken for one",
         stats["by_album"].get("Beach Trip") == 3 and "Photos from 2015" not in stats["by_album"]),
        ("camera measured", stats["by_camera"].get("Canon EOS") == 1),
        ("mtime re-dated on disk (sorts correctly forever)",
         abs(os.path.getmtime(os.path.join(out, r1["path"])) - 1434369600) < 2),
        ("re-run adds nothing (idempotent)",
         archive([os.path.join(tmp, "Takeout")], out,
                 time.monotonic() + 120)["media"] == 0),
        ("verify says GO on an intact archive", verify(out, quick=False) == 0),
    ]

    # PROVEN-TO-CATCH: corrupt one byte; the gate must flip to NO-GO.
    victim = os.path.join(out, r1["path"])
    with open(victim, "r+b") as f:
        f.seek(0)
        f.write(b"\x00")
    checks.append(("verify CATCHES a corrupted byte -> NO-GO", verify(out, quick=False) == 3))
    # And catches an outright deletion.
    os.remove(victim)
    checks.append(("verify CATCHES a missing file -> NO-GO", verify(out, quick=False) == 3))

    ok = all(passed for _, passed in checks)
    print("")
    for name, passed in checks:
        print("%s %s" % ("PASS" if passed else "FAIL", name))
    print("selftest %d/%d" % (sum(1 for _, p in checks if p), len(checks)))
    shutil.rmtree(tmp, ignore_errors=True)
    return 0 if ok else 1


# ----------------------------------------------------------------------------- main


def main():
    ap = argparse.ArgumentParser(
        description="Sovereign Google Photos Takeout archive (re-date + dedupe + verify)")
    ap.add_argument("--source", action="append",
                    help="Takeout .zip or unzipped folder; repeat for each part")
    ap.add_argument("--out", help="output dir for the archive")
    ap.add_argument("--no-copy", action="store_true",
                    help="index only, do not copy media (dry inventory)")
    ap.add_argument("--verify", action="store_true",
                    help="THE DELETION GATE: re-hash the archive, print GO / NO-GO")
    ap.add_argument("--quick", action="store_true",
                    help="with --verify: check presence+size only, skip re-hashing")
    ap.add_argument("--find", help="search the built index instead of archiving")
    ap.add_argument("--max-seconds", type=int, default=21600)
    ap.add_argument("--max-fails", type=int, default=5)
    ap.add_argument("--selftest", action="store_true")
    args = ap.parse_args()

    if args.selftest:
        sys.exit(selftest())
    if not args.out:
        ap.error("--out is required (or --selftest)")
    os.makedirs(args.out, exist_ok=True)
    if args.verify:
        sys.exit(verify(args.out, quick=args.quick))
    if args.find:
        sys.exit(find(args.out, args.find))
    if not args.source:
        ap.error("--source is required to archive (or use --verify / --find / --selftest)")
    for path in args.source:
        if not os.path.exists(path):
            ap.error("source not found: %s" % path)
    if check_paused(args.out):
        print("PAUSED (%s exists after repeated failures) — inspect, then delete the file to re-arm"
              % PAUSE_NAME)
        sys.exit(2)
    lock = acquire_lock(args.out)
    if lock is None:
        print("SKIP: another run holds the lock (single-instance brake)")
        sys.exit(0)
    try:
        deadline = time.monotonic() + args.max_seconds
        stats = archive(args.source, args.out, deadline, copy_media=not args.no_copy)
        clear_failures(args.out)
        write_run(args.out, "ok", stats["media"],
                  "archived %(media)d media, %(skipped_dupes)d dupes, %(bytes)d bytes" % stats)
        print(json.dumps({k: stats[k] for k in
                          ("media", "skipped_dupes", "bytes", "no_sidecar", "undated")}, indent=1))
        print("by year: %s" % json.dumps(dict(sorted(stats["by_year"].items()))))
        print("index: %s" % os.path.join(args.out, INDEX_NAME))
        print("stats: %s" % os.path.join(args.out, STATS_NAME))
        print("")
        print("NEXT: python3 photos_archive.py --out %s --verify" % args.out)
        print("      Nothing is deleted from Google Photos until that prints GO.")
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

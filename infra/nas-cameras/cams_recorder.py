#!/usr/bin/env python3
"""cams_recorder.py -- recorded loops to the NAS, for as long as the owner says.

Darrell 2026-10-07: "Recorded loops for however long I want backed up to the
nas?" (DR-0775). Yes. This is the sovereign recorder beside the camera road
(DR-0756): one ffmpeg per enabled camera, copying go2rtc's RTSP stream into
ten-minute MP4 segments on the NAS disk, a retention the owner chooses per
camera, and ONE disk budget that prunes the oldest clip first across every
camera so the recorder can never fill the volume. No transcoding, no cloud,
no new program on the box: the ffmpeg is the one inside the go2rtc container
(the image ships it), run with `docker exec`, writing into the recordings
folder the compose file bind-mounts.

The owner steers it from the Cameras tab through the forwarder's bearer-locked
GET/PUT /recording (which writes recording.json beside go2rtc.yaml); this
service only READS that file and reconciles reality to it every few seconds:
start what should run, stop what should not, restart what died (with a
backoff, so a camera that is off does not spin the CPU), prune, and write a
status file the tab shows (clips, bytes, oldest, newest, disk free).

Brakes (DR-0248 deterministic class): the disk budget IS the budget; systemd
is the single-instance lock; stop-paths are `enabled:false` per camera, an
empty config, or the unit. Nothing here fires on its own clock beyond the
reconcile loop, and the loop does nothing when the config enables nothing.

Selftest: `python3 cams_recorder.py --selftest` runs the reconcile, restart,
prune and status logic against a temp dir with an injected process spawner.
"""
import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time

DATA_DEFAULT = os.environ.get("GO2RTC_DATA", "/volume1/docker/go2rtc")
RECORDINGS_DEFAULT = os.environ.get("CAMS_RECORDINGS", "/volume1/PoeTech/cameras/recordings")
CONTAINER = os.environ.get("CAMS_GO2RTC_CONTAINER", "poetech-go2rtc")
CONTAINER_RECORDINGS = "/recordings"           # the compose bind mount inside the container
RTSP = os.environ.get("CAMS_RTSP", "rtsp://127.0.0.1:8554")
SEGMENT_SECONDS = int(os.environ.get("CAMS_SEGMENT_SECONDS", "600"))
LOOP_SECONDS = float(os.environ.get("CAMS_RECORDER_LOOP_SECONDS", "10"))
RESTART_BACKOFF = (5, 15, 60, 300)             # seconds between restarts of a camera that keeps dying
RETENTION_MIN_DAYS, RETENTION_MAX_DAYS = 1, 365
BUDGET_MIN_GB = 5
CLIP_SUFFIX = ".mp4"
CAMERA_ID_OK = __import__("re").compile(r"^[A-Za-z0-9_.-]{1,64}$")


def code_sha(path=None):
    import hashlib
    try:
        with open(path or os.path.abspath(__file__), "rb") as fh:
            return hashlib.sha256(fh.read()).hexdigest()[:16]
    except OSError:
        return "unknown"


# --- config ------------------------------------------------------------------
def default_config():
    return {"disk_budget_gb": 200, "cameras": {}}


def normalize_config(raw):
    """Anything -> a valid config. Unknown keys dropped, bad values clamped,
    bad camera ids dropped. Never raises: a corrupt file records nothing
    rather than crashing the service (and the status says so)."""
    cfg = default_config()
    if not isinstance(raw, dict):
        return cfg
    try:
        b = float(raw.get("disk_budget_gb", cfg["disk_budget_gb"]))
        cfg["disk_budget_gb"] = max(BUDGET_MIN_GB, min(100000.0, b))
    except (TypeError, ValueError):
        pass
    cams = raw.get("cameras")
    if isinstance(cams, dict):
        for cid, c in cams.items():
            if not isinstance(cid, str) or not CAMERA_ID_OK.match(cid) or not isinstance(c, dict):
                continue
            try:
                days = int(c.get("retention_days", 14))
            except (TypeError, ValueError):
                days = 14
            cfg["cameras"][cid] = {"enabled": bool(c.get("enabled", False)), "retention_days": max(RETENTION_MIN_DAYS, min(RETENTION_MAX_DAYS, days))}
    return cfg


def load_config(path):
    try:
        with open(path, "r", encoding="utf-8") as fh:
            return normalize_config(json.load(fh)), None
    except FileNotFoundError:
        return default_config(), None
    except (OSError, ValueError) as e:
        return default_config(), "recording.json unreadable: %s" % e


# --- the clips on disk ---------------------------------------------------------
def clip_time(name):
    """'2026-10-07T06-40-00.mp4' -> epoch seconds (local), or None."""
    base = name[:-len(CLIP_SUFFIX)] if name.endswith(CLIP_SUFFIX) else name
    try:
        return time.mktime(time.strptime(base, "%Y-%m-%dT%H-%M-%S"))
    except ValueError:
        return None


def list_clips(root, cam):
    """[{name, bytes, start}] oldest first, for one camera."""
    d = os.path.join(root, cam)
    out = []
    try:
        names = os.listdir(d)
    except OSError:
        return out
    for n in names:
        if not n.endswith(CLIP_SUFFIX):
            continue
        t = clip_time(n)
        if t is None:
            continue
        try:
            size = os.path.getsize(os.path.join(d, n))
        except OSError:
            continue
        out.append({"name": n, "bytes": size, "start": int(t)})
    out.sort(key=lambda c: c["start"])
    return out


def all_clips(root):
    """{cam: [clips]} for every camera folder present (enabled or not: a
    camera switched off keeps its clips until retention or budget removes them)."""
    out = {}
    try:
        cams = [d for d in os.listdir(root) if CAMERA_ID_OK.match(d) and os.path.isdir(os.path.join(root, d))]
    except OSError:
        return out
    for cam in sorted(cams):
        out[cam] = list_clips(root, cam)
    return out


def prune(root, cfg, now=None, keep_open=None):
    """Delete (1) clips older than each camera's retention (14 d for a camera
    with no entry), then (2) the oldest clips across ALL cameras until the
    total is under the budget. The newest clip of a running camera is the
    one ffmpeg is writing: never deleted (keep_open = {cam: newest name}).
    Returns {"deleted": n, "freed": bytes, "total": bytes_after}."""
    now = now if now is not None else time.time()
    keep_open = keep_open or {}
    deleted, freed = 0, 0
    clips = all_clips(root)

    def remove(cam, clip):
        nonlocal deleted, freed
        if keep_open.get(cam) == clip["name"]:
            return False
        try:
            os.remove(os.path.join(root, cam, clip["name"]))
            deleted += 1
            freed += clip["bytes"]
            return True
        except OSError:
            return False

    for cam, lst in clips.items():
        days = cfg["cameras"].get(cam, {}).get("retention_days", 14)
        cutoff = now - days * 86400
        keep = []
        for c in lst:
            if c["start"] + SEGMENT_SECONDS < cutoff:
                if not remove(cam, c):
                    keep.append(c)
            else:
                keep.append(c)
        clips[cam] = keep
    budget = cfg["disk_budget_gb"] * 1e9
    total = sum(c["bytes"] for lst in clips.values() for c in lst)
    while total > budget:
        oldest_cam, oldest = None, None
        for cam, lst in clips.items():
            for c in lst:
                if keep_open.get(cam) == c["name"]:
                    continue
                if oldest is None or c["start"] < oldest["start"]:
                    oldest_cam, oldest = cam, c
                break  # lists are oldest-first; the first deletable is this camera's candidate
        if oldest is None:
            break
        if remove(oldest_cam, oldest):
            total -= oldest["bytes"]
        clips[oldest_cam] = [c for c in clips[oldest_cam] if c["name"] != oldest["name"]]
    return {"deleted": deleted, "freed": freed, "total": total}


# --- the ffmpeg per camera ---------------------------------------------------------
def docker_binary():
    for cand in ("docker", "/usr/local/bin/docker", "/var/packages/ContainerManager/target/usr/bin/docker"):
        path = shutil.which(cand) if "/" not in cand else (cand if os.path.exists(cand) else None)
        if path:
            return path
    return None


def ffmpeg_argv(cam, docker=None, rtsp=RTSP, segment=SEGMENT_SECONDS, container_root=CONTAINER_RECORDINGS):
    """The one command, as a list (never a shell): copy go2rtc's RTSP into
    time-named segments. Inside the container the recordings root is the
    compose bind mount; the host sees the same files under RECORDINGS."""
    out = "%s/%s/%%Y-%%m-%%dT%%H-%%M-%%S%s" % (container_root, cam, CLIP_SUFFIX)
    ff = ["ffmpeg", "-nostdin", "-hide_banner", "-loglevel", "error",
          "-rtsp_transport", "tcp", "-i", "%s/%s" % (rtsp, cam),
          "-c", "copy", "-f", "segment", "-segment_time", str(segment), "-segment_atclocktime", "1",
          "-reset_timestamps", "1", "-strftime", "1", "-movflags", "+faststart", out]
    if docker:
        return [docker, "exec", "-i", CONTAINER] + ff
    return ff


class Recorder:
    """Reconciles running ffmpeg processes to the config. `spawn(argv)` is
    injectable (returns an object with .poll() and .terminate()); the selftest
    passes a fake, production passes subprocess.Popen."""

    def __init__(self, root, config_path, status_path, spawn=None, docker=None, now=None):
        self.root = root
        self.config_path = config_path
        self.status_path = status_path
        self.spawn = spawn or self._popen
        self.docker = docker
        self.now = now or time.time
        self.procs = {}       # cam -> {proc, started, restarts, last_exit, next_try}
        self.last_prune = {}
        self.config_error = None

    @staticmethod
    def _popen(argv):
        return subprocess.Popen(argv, stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    def wanted(self, cfg):
        return sorted(cid for cid, c in cfg["cameras"].items() if c.get("enabled"))

    def reconcile(self, cfg):
        now = self.now()
        want = set(self.wanted(cfg))
        # stop what should not run
        for cam in list(self.procs):
            if cam not in want:
                self._stop(cam)
        # start / restart what should (sorted: a stable order for logs and tests)
        for cam in sorted(want):
            os.makedirs(os.path.join(self.root, cam), exist_ok=True)
            st = self.procs.get(cam)
            if st and st["proc"] is not None:
                code = st["proc"].poll()
                if code is None:
                    continue  # running
                st["last_exit"] = code
                st["proc"] = None
                st["restarts"] += 1
                back = RESTART_BACKOFF[min(st["restarts"] - 1, len(RESTART_BACKOFF) - 1)]
                st["next_try"] = now + back
            if st is None:
                st = self.procs[cam] = {"proc": None, "started": None, "restarts": 0, "last_exit": None, "next_try": 0}
            if st["proc"] is None and now >= st["next_try"]:
                st["proc"] = self.spawn(ffmpeg_argv(cam, docker=self.docker))
                st["started"] = now
        return sorted(self.procs)

    def _stop(self, cam):
        st = self.procs.pop(cam, None)
        if st and st["proc"] is not None and st["proc"].poll() is None:
            try:
                st["proc"].terminate()
            except OSError:
                pass

    def stop_all(self):
        for cam in list(self.procs):
            self._stop(cam)

    def open_clips(self):
        """{cam: newest clip name} for cameras recording right now (never pruned)."""
        out = {}
        for cam, st in self.procs.items():
            if st["proc"] is not None and st["proc"].poll() is None:
                lst = list_clips(self.root, cam)
                if lst:
                    out[cam] = lst[-1]["name"]
        return out

    def status(self, cfg, pruned=None):
        clips = all_clips(self.root)
        cams = {}
        total = 0
        for cam in sorted(set(clips) | set(cfg["cameras"])):
            lst = clips.get(cam, [])
            b = sum(c["bytes"] for c in lst)
            total += b
            st = self.procs.get(cam)
            running = bool(st and st["proc"] is not None and st["proc"].poll() is None)
            cams[cam] = {
                "enabled": bool(cfg["cameras"].get(cam, {}).get("enabled")),
                "retention_days": cfg["cameras"].get(cam, {}).get("retention_days"),
                "recording": running,
                "restarts": st["restarts"] if st else 0,
                "last_exit": st["last_exit"] if st else None,
                "clips": len(lst), "bytes": b,
                "oldest": lst[0]["start"] if lst else None,
                "newest": lst[-1]["start"] if lst else None,
            }
        free = None
        try:
            free = shutil.disk_usage(self.root).free
        except OSError:
            free = None
        return {"ok": True, "recorder": code_sha(), "at": int(self.now()), "root": self.root,
                "disk_budget_gb": cfg["disk_budget_gb"], "total_bytes": total, "disk_free_bytes": free,
                "cameras": cams, "config_error": self.config_error, "pruned": pruned,
                "segment_seconds": SEGMENT_SECONDS}

    def write_status(self, status):
        tmp = self.status_path + ".tmp"
        try:
            with open(tmp, "w", encoding="utf-8") as fh:
                json.dump(status, fh)
            os.replace(tmp, self.status_path)
        except OSError:
            pass

    def tick(self):
        cfg, err = load_config(self.config_path)
        self.config_error = err
        self.reconcile(cfg)
        pruned = prune(self.root, cfg, now=self.now(), keep_open=self.open_clips())
        status = self.status(cfg, pruned=pruned)
        self.write_status(status)
        return status


# --- selftest -------------------------------------------------------------------
class FakeProc:
    def __init__(self, argv):
        self.argv = argv
        self.code = None
        self.terminated = False

    def poll(self):
        return self.code

    def terminate(self):
        self.terminated = True
        self.code = -15


def _selftest():
    failures = []

    def check(cond, msg):
        print(("  PASS " if cond else "  FAIL ") + msg)
        if not cond:
            failures.append(msg)

    tmp = tempfile.mkdtemp(prefix="cams-rec-")
    root = os.path.join(tmp, "rec")
    os.makedirs(root)
    cfg_path = os.path.join(tmp, "recording.json")
    status_path = os.path.join(tmp, "recording.status.json")
    clock = {"now": time.mktime(time.strptime("2026-10-07T12-00-00", "%Y-%m-%dT%H-%M-%S"))}
    spawned = []

    def spawn(argv):
        p = FakeProc(argv)
        spawned.append(p)
        return p

    print("=== 1. config: anything in, a valid config out ===")
    c = normalize_config({"disk_budget_gb": "abc", "cameras": {"front": {"enabled": True, "retention_days": 9999}, "bad id": {"enabled": True}, "x": "nope"}})
    check(c["disk_budget_gb"] == 200 and c["cameras"] == {"front": {"enabled": True, "retention_days": 365}}, "bad budget kept at default, retention clamped, bad ids and shapes dropped: %r" % c)
    check(normalize_config(None) == default_config() and normalize_config({"disk_budget_gb": 1})["disk_budget_gb"] == BUDGET_MIN_GB, "a missing or tiny budget is floored")
    with open(cfg_path, "w") as fh:
        fh.write("{not json")
    cfg, err = load_config(cfg_path)
    check(cfg == default_config() and err and "unreadable" in err, "a corrupt file records nothing and says so")

    print("=== 2. the ffmpeg command: copy, segment, time-named, through docker exec when docker is present ===")
    argv = ffmpeg_argv("front", docker="/usr/local/bin/docker")
    check(argv[:4] == ["/usr/local/bin/docker", "exec", "-i", CONTAINER] and "-c" in argv and argv[argv.index("-c") + 1] == "copy", "docker exec into the go2rtc container, stream copy")
    check("%s/front" % RTSP in argv and argv[-1] == "/recordings/front/%Y-%m-%dT%H-%M-%S.mp4" and "-segment_time" in argv and argv[argv.index("-segment_time") + 1] == str(SEGMENT_SECONDS), "reads go2rtc's RTSP for the camera, writes time-named segments under the bind mount")
    check(ffmpeg_argv("front")[0] == "ffmpeg", "without docker, plain ffmpeg")

    print("=== 3. reconcile: start the enabled, leave the disabled, stop the removed ===")
    with open(cfg_path, "w") as fh:
        json.dump({"disk_budget_gb": 10, "cameras": {"front": {"enabled": True, "retention_days": 2}, "garage": {"enabled": False}, "yard": {"enabled": True, "retention_days": 1}}}, fh)
    rec = Recorder(root, cfg_path, status_path, spawn=spawn, docker=None, now=lambda: clock["now"])
    st = rec.tick()
    check(sorted(rec.procs) == ["front", "yard"] and len(spawned) == 2, "two enabled cameras -> two ffmpeg processes, the disabled one none")
    check(os.path.isdir(os.path.join(root, "front")) and os.path.isdir(os.path.join(root, "yard")), "a folder per recording camera")
    check(st["cameras"]["front"]["recording"] is True and st["cameras"]["garage"]["recording"] is False and st["cameras"]["garage"]["enabled"] is False, "status says who is recording")
    check(os.path.exists(status_path) and json.load(open(status_path))["disk_budget_gb"] == 10, "status file written, carries the budget")
    with open(cfg_path, "w") as fh:
        json.dump({"disk_budget_gb": 10, "cameras": {"front": {"enabled": True, "retention_days": 2}}}, fh)
    rec.tick()
    check(sorted(rec.procs) == ["front"] and spawned[1].terminated, "a camera switched off is stopped (terminated), its clips kept")

    print("=== 4. restart with backoff when ffmpeg dies ===")
    spawned[0].code = 1
    rec.tick()
    check(rec.procs["front"]["proc"] is None and rec.procs["front"]["restarts"] == 1 and rec.procs["front"]["last_exit"] == 1, "a dead ffmpeg is noticed, exit code kept, not restarted the same second")
    clock["now"] += RESTART_BACKOFF[0] - 1
    rec.tick()
    check(rec.procs["front"]["proc"] is None, "inside the backoff: still waiting")
    clock["now"] += 2
    rec.tick()
    check(rec.procs["front"]["proc"] is not None and len(spawned) == 3, "after the backoff: restarted")
    for i in range(3):
        rec.procs["front"]["proc"].code = 1
        rec.tick()
        clock["now"] += 1000
        rec.tick()
    check(rec.procs["front"]["restarts"] == 4, "every death counts (4 restarts recorded)")

    print("=== 5. prune: retention per camera, then the budget, oldest first, never the clip being written ===")
    def mk(cam, when, mb):
        os.makedirs(os.path.join(root, cam), exist_ok=True)
        name = time.strftime("%Y-%m-%dT%H-%M-%S", time.localtime(when)) + CLIP_SUFFIX
        with open(os.path.join(root, cam, name), "wb") as fh:  # sparse: size without the bytes
            fh.seek(max(1, int(mb * 1e6)) - 1); fh.write(b"\0")
        return name
    now = clock["now"]
    old_front = mk("front", now - 3 * 86400, 1)      # beyond 2-day retention
    keep_front = mk("front", now - 1 * 86400, 1)     # inside
    newest_front = mk("front", now - 60, 1)          # being written
    old_yard = mk("yard", now - 2 * 86400, 1)        # yard has no entry now -> default 14 d: kept by retention
    cfg = normalize_config({"disk_budget_gb": 10, "cameras": {"front": {"enabled": True, "retention_days": 2}}})
    r = prune(root, cfg, now=now, keep_open={"front": newest_front})
    names = lambda cam: [c["name"] for c in list_clips(root, cam)]
    check(old_front not in names("front") and keep_front in names("front") and newest_front in names("front"), "retention: the 3-day-old clip goes, the 1-day-old and the open one stay")
    check(old_yard in names("yard") and r["deleted"] == 1, "a camera with no entry keeps 14 days by default")
    # budget (floor 5 GB): two 3 GB clips + three small ones = over; oldest go first until under
    older_big = mk("yard", now - 5000, 3000)
    big = mk("yard", now - 1000, 3000)
    cfg = normalize_config({"disk_budget_gb": 5, "cameras": {"front": {"enabled": True, "retention_days": 2}}})
    r = prune(root, cfg, now=now, keep_open={"front": newest_front})
    check(old_yard not in names("yard") and keep_front not in names("front") and older_big not in names("yard") and big in names("yard") and newest_front in names("front"),
          "over budget: the oldest clips across cameras go first (yard's 2-day, front's 1-day, then the older 3 GB); the newer 3 GB and the open clip stay (%r)" % ({"yard": names("yard"), "front": names("front")},))
    check(r["total"] <= cfg["disk_budget_gb"] * 1e9 and r["deleted"] == 3, "the budget is met with exactly three deletions (%r)" % r)

    print("=== 6. status carries what the tab shows ===")
    st = rec.status(cfg)
    check(st["cameras"]["front"]["clips"] == 1 and st["cameras"]["yard"]["clips"] == 1 and st["total_bytes"] == sum(c["bytes"] for cam in ("front", "yard") for c in list_clips(root, cam)), "clips and bytes per camera, total")
    check(isinstance(st["disk_free_bytes"], int) and st["recorder"] == code_sha() and st["segment_seconds"] == SEGMENT_SECONDS, "disk free, the running code's sha, the segment length")

    rec.stop_all()
    shutil.rmtree(tmp, ignore_errors=True)
    if failures:
        print("\nSELFTEST FAILED: %d check(s)" % len(failures))
        for f in failures:
            print("  - " + f)
        sys.exit(1)
    print("\nALL CAMS RECORDER CHECKS PASSED.")


def main():
    ap = argparse.ArgumentParser(description="Recorded loops for the family cameras, to the NAS, for as long as the owner says (DR-0775)")
    ap.add_argument("--root", default=RECORDINGS_DEFAULT)
    ap.add_argument("--config", default=os.path.join(DATA_DEFAULT, "recording.json"))
    ap.add_argument("--status", default=os.path.join(DATA_DEFAULT, "recording.status.json"))
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--once", action="store_true", help="one reconcile + prune + status, then exit (leaves ffmpeg running)")
    args = ap.parse_args()
    if args.selftest:
        return _selftest()
    os.makedirs(args.root, exist_ok=True)
    docker = docker_binary()
    if not docker:
        print("cams-recorder: no docker binary found; ffmpeg must be on PATH", file=sys.stderr)
    rec = Recorder(args.root, args.config, args.status, docker=docker)
    print("cams-recorder %s: root=%s config=%s container=%s rtsp=%s segment=%ds" % (code_sha(), args.root, args.config, CONTAINER, RTSP, SEGMENT_SECONDS))
    try:
        while True:
            st = rec.tick()
            if args.once:
                print(json.dumps({"recording": [c for c, v in st["cameras"].items() if v["recording"]], "total_bytes": st["total_bytes"], "pruned": st["pruned"]}))
                return 0
            time.sleep(LOOP_SECONDS)
    except KeyboardInterrupt:
        pass
    finally:
        if not args.once:
            rec.stop_all()
    return 0


if __name__ == "__main__":
    sys.exit(main() or 0)

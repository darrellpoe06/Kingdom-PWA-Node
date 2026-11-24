#!/usr/bin/env python3
# Proven-to-catch tests for learn-thumbs-pull.py (DR-1360).
#
# No network: a fake transport answers the artifact list, the API's 302 and the
# blob host's zip, and records which headers each host was sent. The ones that
# matter most: the GitHub token never reaches the blob host, an unsafe zip or a
# wrong digest writes NOTHING, and a picture already kept is never overwritten.
# Run from this dir:  python3 -m unittest test_learn_thumbs_pull
import hashlib
import importlib.util
import io
import json
import os
import shutil
import tempfile
import unittest
import urllib.parse
import zipfile

_HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location(
    "learn_thumbs_pull", os.path.join(_HERE, "learn-thumbs-pull.py")
)
lt = importlib.util.module_from_spec(spec)
spec.loader.exec_module(lt)

BLOB = "https://productionresultssa0.blob.core.windows.net"
TOKEN = "ghs_test_token_never_real"


def make_zip(entries):
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as z:
        for name, data in entries.items():
            z.writestr(name, data)
    return buf.getvalue()


def good_zip(picture=b"JPEG-BYTES-1"):
    return make_zip(
        {
            "review-export.json": b'{"records": 1}',
            "state/jobs.jsonl": b'{"job": 1}\n',
            "state/records.json": b"{}",
            "state/topics.json": b"{}",
            "outbox/genesis/L1.jpg": picture,
            "images/v2/genesis/L1.jpg": b"V2-BYTES",
            "composed/genesis/L1.jpg": b"COMPOSED",
        }
    )


def artifact(
    aid, run_id, data, digest=True, expired=False, created="2026-11-20T00:00:00Z"
):
    return {
        "id": aid,
        "name": f"learn-presentation-review-{run_id}",
        "size_in_bytes": len(data),
        "expired": expired,
        "created_at": created,
        "archive_download_url": f"https://api.github.com/repos/o/r/actions/artifacts/{aid}/zip",
        "digest": ("sha256:" + hashlib.sha256(data).hexdigest()) if digest else None,
        "workflow_run": {"id": int(run_id)},
    }


class FakeTransport:
    """api.github.com lists and 302s; the blob host serves the zip bytes."""

    def __init__(self, arts, zips, other_names=()):
        self.arts = arts
        self.zips = zips  # artifact id -> bytes
        self.other = [
            {"id": 9000 + i, "name": n, "expired": False}
            for i, n in enumerate(other_names)
        ]
        self.calls = []

    def get(self, url, headers, timeout):
        self.calls.append((url, dict(headers), timeout))
        p = urllib.parse.urlparse(url)
        if p.hostname == "api.github.com" and "/actions/artifacts?" in url:
            body = json.dumps(
                {"total_count": len(self.arts), "artifacts": self.other + self.arts}
            ).encode()
            return lt.Response(
                200, {"Content-Type": "application/json"}, io.BytesIO(body)
            )
        if p.hostname == "api.github.com" and url.endswith("/zip"):
            aid = int(p.path.split("/")[-2])
            return lt.Response(
                302, {"Location": f"{BLOB}/a/{aid}.zip?sig=abc"}, io.BytesIO(b"")
            )
        if url.startswith(BLOB):
            aid = int(p.path.split("/")[-1].split(".")[0])
            return lt.Response(200, {}, io.BytesIO(self.zips[aid]))
        return lt.Response(404, {}, io.BytesIO(b""))


class Base(unittest.TestCase):
    def setUp(self):
        # dest sits inside its own outer dir, so a write that climbs out of
        # dest lands somewhere this test owns and can see.
        self.outer = tempfile.mkdtemp(prefix="learn-thumbs-test-")
        self.dest = os.path.join(self.outer, "dest")
        os.makedirs(self.dest)
        self.logs = []
        os.environ["LEARN_THUMBS_REEL"] = os.path.join(self.dest, "reel.jsonl")

    def tearDown(self):
        shutil.rmtree(self.outer, ignore_errors=True)
        os.environ.pop("LEARN_THUMBS_REEL", None)

    def run_pass(self, transport, **kw):
        return lt.run(
            dest=self.dest, token=TOKEN, transport=transport, log=self.logs.append, **kw
        )

    def p(self, *parts):
        return os.path.join(self.dest, *parts)

    def read(self, *parts):
        with open(self.p(*parts), "rb") as fh:
            return fh.read()

    def kept_files(self):
        out = []
        for root, _, files in os.walk(self.dest):
            for f in files:
                rel = os.path.relpath(os.path.join(root, f), self.dest)
                if rel not in (
                    "last-run.json",
                    "reel.jsonl",
                    "state.json",
                    "reconcile.json",
                ):
                    out.append(rel)
        return sorted(out)


class PullTest(Base):
    def test_a_new_artifact_lands_in_masters_and_runs(self):
        z = good_zip()
        t = FakeTransport(
            [artifact(11, "555", z)], {11: z}, other_names=["something-else"]
        )
        code, led = self.run_pass(t)
        self.assertEqual(code, 0)
        self.assertEqual(led["what"], "pulled")
        self.assertEqual(led["pulled"], ["11"])
        self.assertEqual(self.read("masters", "genesis", "L1.jpg"), b"JPEG-BYTES-1")
        self.assertEqual(self.read("masters", "v2", "genesis", "L1.jpg"), b"V2-BYTES")
        self.assertEqual(
            self.read("runs", "555", "review-export.json"), b'{"records": 1}'
        )
        self.assertEqual(
            self.read("runs", "555", "state", "jobs.jsonl"), b'{"job": 1}\n'
        )
        self.assertTrue(os.path.exists(self.p("runs", "555", "state", "topics.json")))
        # composed/ is derived and not kept; no tmp file is left behind
        self.assertFalse(any(f.startswith("composed") for f in self.kept_files()))
        self.assertFalse(
            any(".tmp" in f or f.endswith(".part") for f in self.kept_files())
        )
        state = json.loads(self.read("state.json"))
        self.assertEqual(state["pulled"]["11"]["sha256"], hashlib.sha256(z).hexdigest())
        ledger = json.loads(self.read("last-run.json"))
        self.assertEqual(ledger["what"], "pulled")
        reel = self.read("reel.jsonl").decode().strip().splitlines()
        self.assertEqual(len(reel), 1, "one reel line per pass")
        self.assertEqual(json.loads(reel[0])["loop"], "learn-thumbs-pull")

    def test_an_already_pulled_artifact_is_skipped(self):
        z = good_zip()
        t = FakeTransport([artifact(11, "555", z)], {11: z})
        self.assertEqual(self.run_pass(t)[0], 0)
        t2 = FakeTransport([artifact(11, "555", z)], {11: z})
        code, led = self.run_pass(t2)
        self.assertEqual((code, led["what"]), (0, "nothing-new"))
        self.assertEqual(led["skipped"]["already"], 1)
        self.assertFalse(
            any(u.endswith("/zip") or u.startswith(BLOB) for u, _, _ in t2.calls),
            "a pulled artifact is never downloaded again",
        )

    def test_an_expired_artifact_is_skipped(self):
        z = good_zip()
        t = FakeTransport([artifact(11, "555", z, expired=True)], {11: z})
        code, led = self.run_pass(t)
        self.assertEqual(
            (code, led["what"], led["skipped"]["expired"]), (0, "nothing-new", 1)
        )

    def test_PROVEN_TO_CATCH_a_climbing_or_absolute_path_refuses_the_whole_zip(self):
        for evil in (
            "../evil.jpg",
            "outbox/../../evil.jpg",
            "/etc/evil.jpg",
            "C:/evil.jpg",
            "outbox\\..\\..\\evil.jpg",
        ):
            with self.subTest(evil=evil):
                shutil.rmtree(self.dest, ignore_errors=True)
                os.makedirs(self.dest)
                z = make_zip({"outbox/genesis/L1.jpg": b"OK", evil: b"PWNED"})
                t = FakeTransport([artifact(12, "556", z)], {12: z})
                code, led = self.run_pass(t)
                self.assertEqual(code, 1)
                self.assertEqual(led["what"], "refused")
                self.assertIn("unsafe path", led["refused"][0]["why"])
                self.assertEqual(
                    self.kept_files(), [], "nothing is written from an unsafe zip"
                )
                self.assertEqual(
                    os.listdir(self.outer), ["dest"], "nothing climbed out of dest"
                )
                self.assertNotIn(
                    "12", json.loads(self.read("state.json")).get("pulled", {})
                )

    def test_PROVEN_TO_CATCH_a_digest_mismatch_writes_nothing(self):
        z = good_zip()
        art = artifact(13, "557", z)
        art["digest"] = "sha256:" + "0" * 64
        t = FakeTransport([art], {13: z})
        code, led = self.run_pass(t)
        self.assertEqual(code, 1)
        self.assertIn("digest mismatch", led["refused"][0]["why"])
        self.assertEqual(self.kept_files(), [])
        self.assertNotIn("13", json.loads(self.read("state.json")).get("pulled", {}))

    def test_a_missing_digest_is_allowed(self):
        z = good_zip()
        t = FakeTransport([artifact(14, "558", z, digest=False)], {14: z})
        self.assertEqual(self.run_pass(t)[0], 0)

    def test_PROVEN_TO_CATCH_an_existing_master_with_other_bytes_is_kept_and_the_new_one_suffixed(
        self,
    ):
        os.makedirs(self.p("masters", "genesis"))
        with open(self.p("masters", "genesis", "L1.jpg"), "wb") as fh:
            fh.write(b"THE-PICTURE-WE-PAID-FOR-FIRST")
        z = good_zip(picture=b"A-DIFFERENT-PICTURE")
        t = FakeTransport([artifact(15, "559", z)], {15: z})
        code, led = self.run_pass(t)
        self.assertEqual(code, 0)
        self.assertEqual(
            self.read("masters", "genesis", "L1.jpg"), b"THE-PICTURE-WE-PAID-FOR-FIRST"
        )
        sha8 = hashlib.sha256(b"A-DIFFERENT-PICTURE").hexdigest()[:8]
        self.assertEqual(
            self.read("masters", "genesis", f"L1.{sha8}.jpg"), b"A-DIFFERENT-PICTURE"
        )
        self.assertEqual(led["kept_both"], 1)
        self.assertTrue(any("kept both" in line for line in self.logs))

    def test_the_same_bytes_again_are_not_duplicated(self):
        os.makedirs(self.p("masters", "genesis"))
        with open(self.p("masters", "genesis", "L1.jpg"), "wb") as fh:
            fh.write(b"JPEG-BYTES-1")
        z = good_zip()
        t = FakeTransport([artifact(16, "560", z)], {16: z})
        code, led = self.run_pass(t)
        self.assertEqual((code, led["kept_both"]), (0, 0))
        self.assertEqual(sorted(os.listdir(self.p("masters", "genesis"))), ["L1.jpg"])

    def test_PROVEN_TO_CATCH_the_per_pass_artifact_cap_stops_after_n(self):
        arts, zips = [], {}
        for i in range(5):
            z = make_zip({f"outbox/c/L{i}.jpg": f"pic{i}".encode()})
            arts.append(
                artifact(100 + i, str(700 + i), z, created=f"2026-11-2{i}T00:00:00Z")
            )
            zips[100 + i] = z
        t = FakeTransport(arts, zips)
        code, led = self.run_pass(t, max_artifacts=2)
        self.assertEqual(code, 0)
        self.assertEqual(led["pulled"], ["100", "101"], "oldest first, and only two")
        downloads = [u for u, _, _ in t.calls if u.startswith(BLOB)]
        self.assertEqual(len(downloads), 2)
        code, led = self.run_pass(FakeTransport(arts, zips), max_artifacts=2)
        self.assertEqual(
            led["pulled"],
            ["102", "103"],
            "the next pass picks up where this one stopped",
        )

    def test_the_byte_budget_refuses_an_artifact_too_big_for_the_pass(self):
        z = good_zip()
        t = FakeTransport([artifact(17, "561", z)], {17: z})
        code, led = self.run_pass(t, max_bytes=10)
        self.assertEqual(code, 1)
        self.assertIn("budget", led["refused"][0]["why"])
        self.assertFalse(
            any(u.startswith(BLOB) for u, _, _ in t.calls), "never downloaded"
        )

    def test_PROVEN_TO_CATCH_the_token_is_never_sent_to_the_blob_host(self):
        z = good_zip()
        t = FakeTransport([artifact(18, "562", z)], {18: z})
        self.assertEqual(self.run_pass(t)[0], 0)
        api = [
            h
            for u, h, _ in t.calls
            if urllib.parse.urlparse(u).hostname == "api.github.com"
        ]
        blob = [
            h
            for u, h, _ in t.calls
            if urllib.parse.urlparse(u).hostname != "api.github.com"
        ]
        self.assertTrue(api and blob)
        for h in api:
            self.assertEqual(h.get("Authorization"), "Bearer " + TOKEN)
        for h in blob:
            self.assertNotIn("Authorization", {k.title() for k in h})
            self.assertNotIn(TOKEN, json.dumps(h))
        # and the rule itself: a lookalike host never qualifies
        self.assertFalse(lt.auth_allowed("https://api.github.com.evil.example/x"))
        self.assertFalse(lt.auth_allowed("http://api.github.com/x"))
        self.assertTrue(lt.auth_allowed("https://api.github.com/x"))

    def test_every_call_carries_a_timeout(self):
        z = good_zip()
        t = FakeTransport([artifact(19, "563", z)], {19: z})
        self.run_pass(t)
        for u, _, timeout in t.calls:
            self.assertTrue(timeout and timeout <= 600, u)
        self.assertEqual(t.calls[0][2], 30, "API calls wait 30 s")

    def test_no_token_is_a_named_quiet_no_op(self):
        code, led = lt.run(
            dest=self.dest,
            token=None,
            transport=FakeTransport([], {}),
            log=self.logs.append,
        )
        self.assertEqual((code, led["what"]), (0, "no-credential"))

    def test_a_held_lock_skips(self):
        os.makedirs(self.p(".lock"))
        z = good_zip()
        t = FakeTransport([artifact(20, "564", z)], {20: z})
        code, led = self.run_pass(t)
        self.assertEqual((code, led["what"]), (0, "locked-skip"))
        self.assertEqual(t.calls, [])

    def test_dry_run_downloads_and_writes_nothing(self):
        z = good_zip()
        t = FakeTransport([artifact(21, "565", z)], {21: z})
        code, led = self.run_pass(t, dry_run=True)
        self.assertEqual((code, led["what"]), (0, "dry-run"))
        self.assertFalse(any(u.startswith(BLOB) for u, _, _ in t.calls))
        self.assertEqual(os.listdir(self.dest), [])

    def test_github_unreachable_is_degraded_not_a_crash(self):
        class Down:
            def get(self, url, headers, timeout):
                raise OSError("network down")

        code, led = self.run_pass(Down())
        self.assertEqual((code, led["what"]), (3, "unreachable"))

    def test_a_zip_refused_three_times_is_set_aside_with_its_reason(self):
        z = make_zip({"../evil": b"x"})
        for n in range(3):
            code, _ = self.run_pass(FakeTransport([artifact(22, "566", z)], {22: z}))
            self.assertEqual(code, 1)
        code, led = self.run_pass(FakeTransport([artifact(22, "566", z)], {22: z}))
        self.assertEqual(
            (code, led["what"], led["skipped"]["set_aside"]), (0, "nothing-new", 1)
        )
        self.assertIn(
            "unsafe path", json.loads(self.read("state.json"))["set_aside"]["22"]["why"]
        )


def sha(b):
    return hashlib.sha256(b).hexdigest()


def job(key, kind, course, lesson, state="succeeded"):
    return json.dumps(
        {
            "idempotencyKey": key,
            "kind": kind,
            "courseKey": course,
            "lessonId": lesson,
            "state": state,
        }
    )


V1, V2, TOPIC, FAILED = b"V1-PAID", b"V2-PAID", b"TOPIC-PAID", b"NEVER-BOUGHT"
NUM = b"NUMBERS-PAID"


def ledger_zip(include=("v1", "v2", "topic"), extra_jobs=()):
    """A run's artifact whose cumulative ledger names three paid pictures: a
    lesson's earlier picture (imageV1), its current one (image), and a topic
    cover. `include` says which of them the zip actually carries."""
    jobs = [
        job("k1", "image", "genesis", "L1", "succeeded"),
        # latest row per idempotencyKey wins: queued, then succeeded = paid
        job("k6", "image", "numbers", "L2", "queued"),
        job("k6", "image", "numbers", "L2", "succeeded"),
        job("k2", "image-v2", "genesis", "L1", "needs-review"),
        job("k3", "topic-v2", "topics", "faith"),
        job("k4", "image", "exodus", "L9", "failed"),  # not paid
        job("k5", "text", "genesis", "L1"),  # not a picture
        *extra_jobs,
    ]
    records = {
        "genesis::L1": {
            "image": {"path": "v2/genesis/L1.jpg", "sha256": sha(V2)},
            "imageV1": {"path": "genesis/L1.jpg", "sha256": sha(V1)},
        },
        "numbers::L2": {"image": {"path": "numbers/L2.jpg", "sha256": sha(NUM)}},
        "exodus::L9": {"image": {"path": "exodus/L9.jpg", "sha256": sha(FAILED)}},
    }
    topics = {
        "faith": {
            "key": "faith",
            "image": {"path": "v2/topics/faith.jpg", "sha256": sha(TOPIC)},
        }
    }
    entries = {
        "state/jobs.jsonl": ("\n".join(jobs) + "\n").encode(),
        "state/records.json": json.dumps(records).encode(),
        "state/topics.json": json.dumps(topics).encode(),
    }
    if "v1" in include:
        entries["images/genesis/L1.jpg"] = V1
    if "v2" in include:
        entries["outbox/v2/genesis/L1.jpg"] = V2
    if "topic" in include:
        entries["outbox/v2/topics/faith.jpg"] = TOPIC
    entries["outbox/numbers/L2.jpg"] = NUM
    return make_zip(entries)


class ReconcileTest(Base):
    def reconcile_file(self):
        return json.loads(self.read("reconcile.json"))

    def test_expected_and_present_from_the_ledger_count_imageV1_and_topics(self):
        z = ledger_zip()
        code, led = self.run_pass(FakeTransport([artifact(31, "900", z)], {31: z}))
        self.assertEqual((code, led["what"]), (0, "pulled"))
        r = self.reconcile_file()
        self.assertEqual(r["from_run"], "900")
        # imageV1 + image + topic + numbers; the failed job and the text job are not paid
        self.assertEqual(
            (r["expected"], r["present_of_expected"], r["missing_count"]), (4, 4, 0)
        )
        self.assertEqual(r["missing"], [])
        self.assertEqual(
            (led["expected"], led["present"], led["missing_count"]), (4, 4, 0)
        )

    def test_expected_set_is_read_from_the_state_files(self):
        z = ledger_zip()
        self.run_pass(FakeTransport([artifact(32, "901", z)], {32: z}))
        exp, unresolved = lt.expected_pictures(self.p("runs", "901", "state"))
        self.assertEqual(
            exp,
            {
                sha(V1): "genesis/L1.jpg",
                sha(V2): "v2/genesis/L1.jpg",
                sha(TOPIC): "v2/topics/faith.jpg",
                sha(NUM): "numbers/L2.jpg",
            },
        )
        self.assertEqual(unresolved, 0)

    def test_PROVEN_TO_CATCH_a_missing_paid_picture_with_nothing_pending_is_incomplete(
        self,
    ):
        z = ledger_zip(
            include=("v2", "topic")
        )  # the imageV1 picture never reached the NAS
        code, led = self.run_pass(FakeTransport([artifact(33, "902", z)], {33: z}))
        self.assertEqual(code, 3)
        self.assertEqual(led["what"], "incomplete")
        self.assertIn("1 paid picture(s) of 4", led["why"])
        self.assertEqual(json.loads(self.read("last-run.json"))["what"], "incomplete")
        r = self.reconcile_file()
        self.assertEqual(r["missing_count"], 1)
        self.assertEqual(r["missing"], [{"sha256": sha(V1), "path": "genesis/L1.jpg"}])

    def test_a_missing_picture_with_an_artifact_still_pending_is_not_incomplete(self):
        z = ledger_zip(include=("v2", "topic"))
        later = make_zip({"images/genesis/L1.jpg": V1})
        arts = [
            artifact(34, "903", z, created="2026-11-20T00:00:00Z"),
            artifact(35, "904", later, created="2026-11-21T00:00:00Z"),
        ]
        code, led = self.run_pass(
            FakeTransport(arts, {34: z, 35: later}), max_artifacts=1
        )
        self.assertEqual((code, led["what"], led["pending"]), (0, "pulled", 1))
        self.assertEqual(led["missing_count"], 1)
        # the next pass brings it, and the proof closes
        code, led = self.run_pass(
            FakeTransport(arts, {34: z, 35: later}), max_artifacts=1
        )
        self.assertEqual((code, led["what"], led["missing_count"]), (0, "pulled", 0))

    def test_an_unreachable_listing_never_reads_as_incomplete(self):
        z = ledger_zip(include=("v2",))
        self.run_pass(
            FakeTransport(
                [artifact(36, "905", z), artifact(37, "906", z)], {36: z, 37: z}
            ),
            max_artifacts=1,
        )

        class Down:
            def get(self, url, headers, timeout):
                raise OSError("down")

        code, led = self.run_pass(Down())
        self.assertEqual((code, led["what"]), (3, "unreachable"))
        self.assertNotIn("pending", led)

    def test_the_newest_pulled_run_is_the_one_reconciled(self):
        old = ledger_zip()
        new = ledger_zip(
            extra_jobs=(job("k9", "image", "exodus", "L9"),)
        )  # L9 now paid, never pulled
        arts = [
            artifact(38, "907", old, created="2026-11-20T00:00:00Z"),
            artifact(39, "908", new, created="2026-11-21T00:00:00Z"),
        ]
        code, led = self.run_pass(FakeTransport(arts, {38: old, 39: new}))
        self.assertEqual((code, led["what"], led["from_run"]), (3, "incomplete", "908"))
        self.assertEqual(
            self.reconcile_file()["missing"],
            [{"sha256": sha(FAILED), "path": "exodus/L9.jpg"}],
        )

    def test_the_hash_cache_is_reused_when_size_and_mtime_are_unchanged(self):
        z = ledger_zip()
        self.run_pass(FakeTransport([artifact(40, "909", z)], {40: z}))
        self.assertEqual(self.reconcile_file()["hashed_this_pass"], 4)
        cache = json.loads(self.read("state.json"))["hash_cache"]
        self.assertEqual(cache["genesis/L1.jpg"]["sha256"], sha(V1))
        real = lt.sha256_file
        reads = []
        lt.sha256_file = lambda p: reads.append(p) or real(p)
        try:
            self.run_pass(FakeTransport([artifact(40, "909", z)], {40: z}))
            self.assertEqual(reads, [], "nothing changed, so nothing is re-read")
            self.assertEqual(self.reconcile_file()["hashed_this_pass"], 0)
            # a changed file (new size) IS re-read, and its new hash counts
            with open(self.p("masters", "genesis", "L1.jpg"), "wb") as fh:
                fh.write(b"SOMETHING-ELSE-ENTIRELY")
            code, led = self.run_pass(FakeTransport([artifact(40, "909", z)], {40: z}))
            self.assertEqual(len(reads), 1)
            self.assertEqual(
                (code, led["what"], led["missing_count"]), (3, "incomplete", 1)
            )
        finally:
            lt.sha256_file = real


class LedgerHeadTest(Base):
    def test_PROVEN_TO_CATCH_last_run_fits_the_witness_600_byte_read_verdict_first(
        self,
    ):
        # six refused zips with long reasons: the worst ledger a pass can write
        arts, zips = [], {}
        for i in range(6):
            z = make_zip({"../" + "x" * 200 + str(i): b"x"})
            arts.append(artifact(500 + i, str(800 + i), z))
            zips[500 + i] = z
        code, _ = self.run_pass(FakeTransport(arts, zips))
        self.assertEqual(code, 1)
        raw = self.read("last-run.json")
        self.assertLessEqual(len(raw), 600, "loops-health reads head -c 600")
        self.assertTrue(raw.startswith(b'{"what":"refused"'))
        self.assertEqual(json.loads(raw[:600])["refused"], 6)


class PathTest(unittest.TestCase):
    def test_safe_name(self):
        self.assertEqual(lt.safe_name("outbox/c/L1.jpg"), "outbox/c/L1.jpg")
        self.assertEqual(lt.safe_name("./outbox//c/L1.jpg"), "outbox/c/L1.jpg")
        for bad in ("../x", "a/../../x", "/abs", "C:\\x", "..", ""):
            self.assertIsNone(lt.safe_name(bad), bad)

    def test_target_of(self):
        self.assertEqual(
            lt.target_of("outbox/genesis/L1.jpg", "9"), "masters/genesis/L1.jpg"
        )
        self.assertEqual(
            lt.target_of("images/v2/genesis/L1.jpg", "9"), "masters/v2/genesis/L1.jpg"
        )
        self.assertEqual(
            lt.target_of("state/records.json", "9"), "runs/9/state/records.json"
        )
        self.assertEqual(
            lt.target_of("review-export.json", "9"), "runs/9/review-export.json"
        )
        self.assertIsNone(lt.target_of("composed/genesis/L1.jpg", "9"))
        self.assertIsNone(lt.target_of("outbox/genesis/notes.txt", "9"))


class SendRecorder:
    """Records each write; answers from a script of status codes."""

    def __init__(self, codes):
        self.codes = list(codes)
        self.calls = []

    def send(self, method, url, headers, body, timeout):
        self.calls.append((method, url, dict(headers), json.loads(body.decode())))
        return self.codes.pop(0)


REC = {
    "at": "2026-11-24T19:00:00Z",
    "from_run": "45443285162",
    "expected": 180,
    "present_of_expected": 180,
    "missing_count": 0,
    "missing": [{"sha256": "ab" * 32, "path": "masters/x/L1.jpg"}],
}


class PublishVerdictTest(unittest.TestCase):
    """The paid lane pauses unless the NAS publishes a verified backup verdict."""

    def test_updates_the_variable_with_counts_only(self):
        t = SendRecorder([204])
        self.assertEqual(lt.publish_verdict(t, TOKEN, REC), "published")
        method, url, headers, body = t.calls[0]
        self.assertEqual(method, "PATCH")
        self.assertEqual(headers["Authorization"], "Bearer " + TOKEN)
        self.assertEqual(
            url,
            "https://api.github.com/repos/darrellpoe06/Kingdom-PWA-Node/actions/variables/LEARN_THUMBS_RECONCILED",
        )
        v = json.loads(body["value"])
        self.assertEqual(v["present_of_expected"], 180)
        self.assertEqual(v["missing"], 0)
        # never a path or a sha: the variable is readable by every workflow
        self.assertNotIn("masters/", body["value"])
        self.assertNotIn("ab" * 32, body["value"])

    def test_creates_the_variable_the_first_time(self):
        t = SendRecorder([404, 201])
        self.assertEqual(lt.publish_verdict(t, TOKEN, REC), "published")
        self.assertEqual([c[0] for c in t.calls], ["PATCH", "POST"])

    def test_a_refusal_is_named_not_hidden(self):
        self.assertEqual(
            lt.publish_verdict(SendRecorder([403]), TOKEN, REC), "HTTP 403"
        )

    def test_no_token_or_no_writer_publishes_nothing(self):
        self.assertEqual(lt.publish_verdict(SendRecorder([204]), None, REC), "no-token")
        self.assertEqual(lt.publish_verdict(object(), TOKEN, REC), "unsupported")


if __name__ == "__main__":
    unittest.main()

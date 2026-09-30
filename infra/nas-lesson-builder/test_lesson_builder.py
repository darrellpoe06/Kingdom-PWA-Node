#!/usr/bin/env python3
"""
The proofs for the NAS lesson builder (DR-0669). Run from this directory:

    python3 -m unittest test_lesson_builder -v

Stdlib only (the repo's Python test convention: ci.yml runs unittest). Every
brake, the verse re-verification, the identical-prompt rule, the modes, the
never-auto-replace rule for backfill and the decision stage are each FIRED by
a test, and each has a proven-to-catch case (DR-0076 s3).
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile
import threading
import time
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, HERE)

import lesson_builder as lb  # noqa: E402
import lesson_gates as gates  # noqa: E402
import lesson_writer as lw  # noqa: E402

CORPUS = gates.Corpus(REPO)
# The fixtures below are small on purpose; the depth floors are proven on
# their own (Gates.test_PROVEN_TO_CATCH_a_thin_draft_fails_the_standard_floors).
STANDARD_FLOORS = dict(gates.FLOORS)
gates.FLOORS.update(lesson_words=50, band_words=20, spans=5, quiz=4, talkingPoints=4, benefits=6)
CLOSE = lw.CLOSING_LINE


def v(book, c, n):
    return CORPUS.verse_text(book, c, n)


def q(book, c, n, span=None):
    """A quotation with its reference, straight from the corpus."""
    t = span or v(book, c, n)
    return '"{}" ({} {}:{})'.format(t, book, c, n)


def make_lesson(drift=False, title="The Keeper Never Sleeps — the Watch, the Scale, and the Proof"):
    """A writer's draft built from real KJV text (so the gates pass unless we
    break it on purpose)."""
    keeper = q("Psalms", 121, 4)
    if drift:
        keeper = keeper.replace("slumber", "rest")
    scale = q("Proverbs", 20, 10)
    prove = q("1 Thessalonians", 5, 21)
    love = q("John", 3, 16)

    def band(label, extra):
        return ("The Keeper Never Sleeps: the watch, the scale, and the proof. {} Yahweh keeps His people: {}. "
                "He weighs with one scale: {}. We test what we hear: {}. {} {}").format(label, keeper, scale, prove, extra, CLOSE)
    return {
        "verdict": "lesson", "placement": "living-lessons", "title": title,
        "slug": "the-keeper-never-sleeps-the-watch-the-scale-and-the-proof",
        "bigIdea": "THE KEEPER NEVER SLEEPS. Darrell spoke this lesson. " + keeper,
        "inApp": "Spoken by Darrell and transcribed by Whisper on our own machines. Read Psalm 121 this week.",
        "anchor": {"ref": "Psalms 121:4; Proverbs 20:10; 1 Thessalonians 5:21", "theme": "Yahweh keeps, weighs and proves."},
        "benefits": ["Rest in the Keeper."] * 6,
        "levels": {"child": band("Child.", "Jesus loves you."), "youth": band("Youth.", "Trust Him."),
                   "teen": band("Teen.", "Hold fast."), "senior": band("Senior.", "Keep watch.")},
        "quiz": {"questions": [{"q": "Who never sleeps?", "options": ["Yahweh", "A guard"], "answer": 0,
                                "explain": keeper}] * 4},
        "facilitator": {"talkingPoints": ["Read " + keeper, "Weigh " + scale, "Prove " + prove, "Love " + love]},
        "lesson_intro": "THE KEEPER NEVER SLEEPS. Darrell spoke this teaching, and Whisper wrote it on our own machines.",
        "movements": [{"title": "The Keeper", "text": "Yahweh keeps: " + keeper},
                      {"title": "The scale", "text": "One weight: " + scale},
                      {"title": "The proof", "text": "Test it: " + prove}],
        "lesson_close": "He gave His Son: " + love + " " + CLOSE,
        "dr_summary": "A spoken teaching on the Keeper, the scale and the proof.",
    }


# --- fakes --------------------------------------------------------------------

class FakeRun:
    """subprocess.run stand-in: records argv/stdin, returns a scripted reply."""

    def __init__(self, reply=b"", code=0, stderr=b"", on_call=None):
        self.calls, self.reply, self.code, self.stderr, self.on_call = [], reply, code, stderr, on_call

    def __call__(self, argv, input=None, capture_output=True, timeout=None, cwd=None, env=None):
        self.calls.append({"argv": list(argv), "input": input, "cwd": cwd})
        if self.on_call:
            self.on_call(argv, cwd)
        out = self.reply if "--version" not in argv else b"1.0.0"
        return subprocess.CompletedProcess(argv, self.code if "--version" not in argv else 0, out, self.stderr)


class FakeOpener:
    def __init__(self, replies):
        self.replies, self.requests = list(replies), []

    def __call__(self, req, timeout=None):
        self.requests.append(req)
        body = self.replies.pop(0) if self.replies else {}
        test = self

        class R:
            def __enter__(self):
                return self

            def __exit__(self, *a):
                return False

            def read(self):
                return json.dumps(body).encode("utf-8")
        R.test = test
        return R()


class ScriptedWriter(lw.Writer):
    kind = "scripted"

    def __init__(self, name, reply, primary=False, reachable=True, mutate=False, delay=0.0, family="claude"):
        super().__init__({"name": name, "primary": primary, "family": family}, env={})
        self.reply, self.reachable, self.mutate, self.delay = reply, reachable, mutate, delay
        self.received = []

    def probe(self):
        return (True, "ok") if self.reachable else (False, lw.NOT_CONFIGURED + "scripted off")

    def render(self, prompt):
        return prompt + " (changed)" if self.mutate else prompt

    def transmit(self, wire, timeout):
        self.received.append(wire)
        if self.delay:
            time.sleep(self.delay)
        return (json.dumps(self.reply) if not isinstance(self.reply, str) else self.reply), {"input_tokens": 1}


class FakeDb:
    def __init__(self, rows=()):
        self.rows = {r["id"]: dict(r, tags=list(r.get("tags") or [])) for r in rows}
        self.versions_rows, self.decisions, self.log = [], {}, []
        self.st = None

    def pending(self):
        return [dict(r, tags=list(r["tags"])) for r in self.rows.values() if "lesson" in r["tags"] and "lesson-captured" not in r["tags"]]

    def claim(self, rid, ts):
        t = self.rows[rid]["tags"]
        if "lesson-building" in t or "lesson-captured" in t:
            return False
        t += ["lesson-building", lb.stage_tag("claimed", ts)]
        return True

    def add_tags(self, rid, tags):
        if rid not in self.rows:
            self.rows[rid] = {"id": rid, "tags": []}
        for x in tags:
            if x not in self.rows[rid]["tags"]:
                self.rows[rid]["tags"].append(x)

    def remove_tags(self, rid, names):
        self.rows[rid]["tags"] = [t for t in self.rows[rid]["tags"] if t not in names]

    def write_preview(self, rows):
        self.previews = getattr(self, "previews", []) + [rows]

    def insert_version(self, r):
        lb.refuse_published_backfill(r)
        rec = dict(r, id="v{}".format(len(self.versions_rows) + 1))
        self.versions_rows.append(rec)

    def versions(self, build_id):
        return [dict(x, gates=x.get("gate_results")) for x in self.versions_rows if x["build_id"] == build_id and not x.get("backfill")]

    def rows_by_build(self, build_id):
        return [r for r in self.rows.values() if "build-group:" + build_id in r["tags"]]

    def decision(self, did):
        return self.decisions.get(did)

    def claim_decision(self, did):
        d = self.decisions.get(did)
        if d and d["status"] == "decided":
            d["status"] = "building"
            return True
        return False

    def update_decision(self, did, **f):
        self.decisions[did].update(f)

    def settings(self):
        return self.st


class FakeGit:
    """A worktree made of COPIES of the real repo files a lesson touches."""
    FILES = [lb.LIVING, lb.DATES, lb.CROSSLIST, lb.INDEX] + [p for p, _ in lb.BASELINES]

    def __init__(self, push_fails=False, forbid=False):
        self.tmp = tempfile.mkdtemp(prefix="fakegit-")
        self.pushed, self.committed, self.push_fails, self.forbid = [], [], push_fails, forbid
        self.catalog = []

    def fetch(self):
        pass

    def catalog_texts(self):
        return self.catalog

    def max_numbers(self):
        return 195, 669

    def worktree_add(self, branch, build_id):
        if self.forbid:
            raise AssertionError("this road must never touch the repository")
        wt = os.path.join(self.tmp, build_id)
        for f in self.FILES:
            os.makedirs(os.path.dirname(os.path.join(wt, f)), exist_ok=True)
            shutil.copy(os.path.join(REPO, f), os.path.join(wt, f))
        return wt

    def worktree_remove(self, path):
        pass

    def read(self, wt, rel):
        with open(os.path.join(wt, rel), encoding="utf-8") as f:
            return f.read()

    def write(self, wt, rel, text):
        p = os.path.join(wt, rel)
        os.makedirs(os.path.dirname(p), exist_ok=True)
        with open(p, "w", encoding="utf-8") as f:
            f.write(text)

    def commit(self, wt, subject, body):
        if self.forbid:
            raise AssertionError("never commit here")
        self.committed.append(subject)

    def push(self, wt, branch):
        if self.forbid:
            raise AssertionError("never push here")
        if self.push_fails:
            raise RuntimeError("push refused by the remote")
        self.pushed.append(branch)


OWNER = lb.OWNER_IDS[0]


def row(rid, body, tags=("lesson",), who=OWNER, at="2026-09-29T05:00:00"):
    return {"id": rid, "instance_id": "i1", "created_by": who, "body": body, "tags": list(tags), "created_at": at}


TEACHING = ("Yahweh is the Keeper of Israel and He never sleeps. We weigh every claim with one honest scale "
            "and we prove all things before we hold them fast. That is how we keep watch in a sleeping world.")


def build(db, git, writers, group=None, **kw):
    b = lb.Build(group or list(db.rows.values()), db, git, writers, CORPUS, data_dir=tempfile.mkdtemp(),
                 today="2026-09-29", **kw)
    return b, b.run()


# =============================================================================
# the writers
# =============================================================================

class Writers(unittest.TestCase):
    def test_extract_json_tolerates_a_fence_and_a_sentence(self):
        self.assertEqual(lw.extract_json('Here:\n```json\n{"a": "b}"}\n```'), {"a": "b}"})
        with self.assertRaises(ValueError):
            lw.extract_json("no object here")

    def test_schema_sound_and_broken(self):
        self.assertEqual(lw.schema_problems(make_lesson()), [])
        bad = make_lesson()
        bad["levels"]["teen"] = "no closing line"
        del bad["movements"]
        p = lw.schema_problems(bad)
        self.assertTrue(any("teen" in x for x in p) and any("movements" in x for x in p))

    def test_cli_envelope(self):
        text, usage = lw.parse_cli_reply(json.dumps({"type": "result", "subtype": "success", "is_error": False,
                                                     "result": "{}", "usage": {"input_tokens": 3, "output_tokens": 4},
                                                     "total_cost_usd": 0.01}))
        self.assertEqual((text, usage["output_tokens"], usage["cost_usd"]), ("{}", 4, 0.01))
        with self.assertRaises(RuntimeError):
            lw.parse_cli_reply(json.dumps({"is_error": True, "result": "Invalid API key · Please run /login"}))

    def test_cli_local_runs_claude_p_json_with_the_prompt_on_stdin(self):
        env = json.dumps({"type": "result", "subtype": "success", "is_error": False, "result": "OK"}).encode()
        run = FakeRun(env)
        w = lw.CliLocal({"name": "c", "bin": sys.executable}, env={}, run=run)
        out = w.send("PROMPT", 10)
        call = run.calls[-1]
        at = call["argv"].index(sys.executable)
        self.assertEqual(call["argv"][at + 1:at + 4], ["-p", "--output-format", "json"])
        self.assertEqual(call["input"], b"PROMPT")
        self.assertEqual(out["text"], "OK")
        self.assertNotIn("--bare", call["argv"])  # --bare skips the subscription login (Claude Code docs)

    def test_the_probe_knows_installed_but_not_signed_in(self):
        class AuthRun(FakeRun):
            def __call__(self, argv, **kw):
                if argv[-2:] == ["auth", "status"]:
                    return subprocess.CompletedProcess(argv, 1, b'{"loggedIn": false}', b"")
                return super().__call__(argv, **kw)
        ok, why = lw.CliLocal({"name": "c", "bin": sys.executable}, env={}, run=AuthRun()).probe()
        self.assertFalse(ok)
        self.assertIn("NOT signed in", why)

    def test_the_cli_runs_with_no_tools_and_keeps_no_session(self):
        local = lw.cli_args({}, {})
        self.assertEqual(local[local.index("--tools") + 1], "")
        self.assertIn("--no-session-persistence", local)
        remote = lw.cli_args({}, {}, remote=True)
        self.assertNotIn("--tools", remote)  # an empty argument does not survive a remote shell
        self.assertEqual(remote[remote.index("--disallowedTools") + 1], "'*'")

    def test_cli_ssh_goes_to_the_configured_target(self):
        env = json.dumps({"type": "result", "subtype": "success", "result": "OK"}).encode()
        run = FakeRun(env)
        w = lw.CliSsh({"name": "tower", "target": "creed@tower.example"}, env={}, run=run)
        self.assertTrue(w.probe()[0])
        w.send("P", 10)
        self.assertIn("creed@tower.example", run.calls[-1]["argv"])
        self.assertIn("BatchMode=yes", run.calls[-1]["argv"])
        self.assertEqual(run.calls[-1]["input"], b"P")

    def test_api_writers_and_families(self):
        op = FakeOpener([{"content": [{"type": "text", "text": "A"}], "usage": {"input_tokens": 1, "output_tokens": 2}}])
        w = lw.Api({"name": "a", "model": "m-from-config", "key_env": "K"}, env={"K": "secret"}, opener=op)
        self.assertEqual(w.send("P", 5)["text"], "A")
        self.assertEqual(op.requests[0].headers.get("X-api-key"), "secret")
        self.assertEqual(w.family, "claude")

        op = FakeOpener([{"message": {"content": "O"}, "prompt_eval_count": 5, "eval_count": 6}])
        w = lw.Ollama({"name": "o", "model": "m", "url": "http://tower:11434"}, env={}, opener=op)
        self.assertEqual(w.send("P", 5)["usage"]["output_tokens"], 6)
        self.assertEqual(json.loads(op.requests[0].data)["keep_alive"], 0)
        self.assertEqual(w.family, "ollama")

        op = FakeOpener([{"choices": [{"message": {"content": "C"}}], "usage": {"prompt_tokens": 1, "completion_tokens": 2}}])
        w = lw.OpenAICompatible({"name": "g", "base_url": "http://x/v1", "model": "m", "max_tokens": 10}, env={}, opener=op)
        self.assertEqual(w.send("P", 5)["text"], "C")
        self.assertIn("max_tokens", json.loads(op.requests[0].data))
        self.assertEqual(w.family, "compat")

        op = FakeOpener([{"choices": [{"message": {"content": "C"}}], "usage": {}}])
        w = lw.OpenAIApi({"name": "gpt", "model": "m", "max_tokens": 10}, env={"OPENAI_API_KEY": "k"}, opener=op)
        self.assertTrue(w.probe()[0])
        w.send("P", 5)
        self.assertTrue(op.requests[0].full_url.startswith("https://api.openai.com/v1/chat/completions"))
        self.assertIn("max_completion_tokens", json.loads(op.requests[0].data))
        self.assertEqual(op.requests[0].headers.get("Authorization"), "Bearer k")
        self.assertEqual(w.family, "openai")

        op = FakeOpener([{"candidates": [{"content": {"parts": [{"text": "G"}]}}],
                          "usageMetadata": {"promptTokenCount": 7, "candidatesTokenCount": 8}}])
        w = lw.GeminiApi({"name": "gem", "model": "m1"}, env={"GEMINI_API_KEY": "gk"}, opener=op)
        out = w.send("P", 5)
        self.assertEqual((out["text"], out["usage"]["input_tokens"]), ("G", 7))
        self.assertIn(":generateContent?key=gk", op.requests[0].full_url)
        self.assertEqual(w.family, "gemini")

    def test_gemini_cli_headless_on_stdin_without_p(self):
        run = FakeRun(json.dumps({"response": "R", "stats": {"models": {}}}).encode())
        w = lw.GeminiCli({"name": "gcli", "bin": sys.executable, "model": "m"}, env={}, run=run)
        self.assertTrue(w.probe()[0])
        out = w.send("PROMPT", 5)
        argv = run.calls[-1]["argv"]
        self.assertEqual(out["text"], "R")
        self.assertIn("--output-format", argv)
        self.assertNotIn("-p", argv)  # -p text is appended to stdin and would change the prompt
        self.assertEqual(run.calls[-1]["input"], b"PROMPT")

    def test_codex_cli_exec_reads_stdin_and_the_last_message_file(self):
        def write_last(argv, cwd):
            if "exec" in argv:
                with open(argv[argv.index("--output-last-message") + 1], "w") as f:
                    f.write("X")
        run = FakeRun(b"", on_call=write_last)
        w = lw.CodexCli({"name": "codex", "bin": sys.executable}, env={}, run=run)
        self.assertTrue(w.probe()[0])
        self.assertEqual(w.send("PROMPT", 5)["text"], "X")
        argv = run.calls[-1]["argv"]
        for flag in ("exec", "--skip-git-repo-check", "--ephemeral", "--sandbox", "read-only"):
            self.assertIn(flag, argv)
        self.assertEqual(argv[-1], "-")
        self.assertEqual(run.calls[-1]["input"], b"PROMPT")

    def test_command_seam_and_openclaw_family(self):
        run = FakeRun(b"TEXT")
        w = lw.Command({"name": "openclaw-tower", "argv": [sys.executable, "x"]}, env={}, run=run)
        self.assertEqual((w.send("P", 5)["text"], w.family), ("TEXT", "openclaw"))

    def test_an_unconfigured_writer_is_reported_not_configured_never_an_error(self):
        for cls, cfg in ((lw.Api, {}), (lw.GeminiApi, {}), (lw.OpenAIApi, {}), (lw.CliSsh, {}),
                         (lw.Ollama, {}), (lw.OpenAICompatible, {}), (lw.Command, {})):
            ok, why = cls(dict(cfg, name=cls.kind), env={}).probe()
            self.assertFalse(ok)
            self.assertTrue(why.startswith(lw.NOT_CONFIGURED), (cls.kind, why))

    def test_the_seam_loads_another_lanes_adapter_by_kind(self):
        d = tempfile.mkdtemp()
        with open(os.path.join(d, "clawtest_writer.py"), "w") as f:
            f.write("import lesson_writer as lw\nclass W(lw.Writer):\n    kind='clawtest'\n"
                    "    def probe(self):\n        return True, 'ok'\n    def transmit(self, wire, t):\n        return 'hi', {}\nWRITER = W\n")
        ws, problems = lw.writers_from_configs([{"name": "c", "kind": "clawtest"}, {"name": "x", "kind": "nope"}], env={}, extra_paths=[d])
        self.assertEqual([w.kind for w in ws], ["clawtest"])
        self.assertEqual(problems[0]["writer"], "x")

    def test_no_model_identifier_lives_in_the_builder_code(self):
        for f in ("lesson_writer.py", "lesson_builder.py", "lesson_gates.py", "band_gates.mjs", "install.sh"):
            with open(os.path.join(HERE, f), encoding="utf-8") as fh:
                text = fh.read().lower()
            for bad in ("claude-3", "claude-sonnet", "claude-opus", "claude-haiku", "gpt-4", "gpt-5", "gemini-1", "gemini-2", "o3-", "qwen2"):
                self.assertNotIn(bad, text, "{} names a model ({}): models live in NAS config only".format(f, bad))


class SamePrompt(unittest.TestCase):
    def test_every_writer_receives_the_identical_prompt_in_parallel(self):
        ws = [ScriptedWriter("a", make_lesson(), primary=True, delay=0.3), ScriptedWriter("b", make_lesson(), delay=0.3),
              ScriptedWriter("c", make_lesson(), delay=0.3)]
        t0 = time.time()
        res, tried = lw.fan_out(ws, "THE PROMPT", 10)
        self.assertLess(time.time() - t0, 0.8, "writers ran one after another, not in parallel")
        self.assertEqual({w.received[0] for w in ws}, {"THE PROMPT"})
        self.assertTrue(all(r["identical_prompt"] and r["ok"] for r in res))
        self.assertEqual(len({r["prompt_sha256"] for r in res}), 1)

    def test_PROVEN_TO_CATCH_a_writer_that_alters_the_prompt_is_marked_and_cannot_ship(self):
        ws = [ScriptedWriter("honest", make_lesson(), primary=True), ScriptedWriter("mutator", make_lesson(), mutate=True)]
        res, _ = lw.fan_out(ws, "THE PROMPT", 10)
        bad = [r for r in res if r["writer"] == "mutator"][0]
        self.assertFalse(bad["ok"])
        self.assertIn("prompt-mismatch", bad["error"])

    def test_an_unreachable_writer_is_skipped_and_reported(self):
        res, tried = lw.fan_out([ScriptedWriter("a", make_lesson(), primary=True), ScriptedWriter("off", {}, reachable=False)], "P", 5)
        self.assertEqual([r["writer"] for r in res], ["a"])
        self.assertFalse([t for t in tried if t["writer"] == "off"][0]["configured"])


class FakeFixes:
    """Stands in for the parity loop's fixes package (infra/nas-lesson-parity,
    DR-0671): records every call so a test can prove who was passed through."""

    def __init__(self, raise_on=None):
        self.calls, self.raise_on = [], raise_on

    def apply_stage(self, stage, ctx):
        self.calls.append((stage, dict(ctx)))
        if stage == self.raise_on:
            raise RuntimeError("a broken fix")
        out = dict(ctx)
        if stage == "pre":
            out["prompt"] = ctx["prompt"] + "\n[VERSES RETRIEVED]"
        else:
            out["body"] = dict(ctx["body"], parity_marker="post-fixed")
        return out


class ParityWiring(unittest.TestCase):
    """The tower parity loop's fixes run for tower writers only (DR-0671 on
    DR-0669); the parity module is optional; a promoted writer is primary."""

    def mixed(self):
        return [ScriptedWriter("claude", make_lesson(), primary=True, family="claude"),
                ScriptedWriter("ollama", make_lesson(), family="ollama"),
                ScriptedWriter("claw", make_lesson(), family="openclaw"),
                ScriptedWriter("compat", make_lesson(), family="compat")]

    def test_tower_writers_get_the_pre_fix_and_claude_gets_the_builds_prompt(self):
        fx = FakeFixes()
        ws = self.mixed()
        res, _ = lw.fan_out(ws, "THE PROMPT", 10, fixes=fx, teaching=TEACHING)
        self.assertEqual(ws[0].received, ["THE PROMPT"])
        for w in ws[1:]:
            self.assertEqual(w.received, ["THE PROMPT\n[VERSES RETRIEVED]"], w.name)
        self.assertEqual(len(fx.calls), 3)
        self.assertTrue(all(c[0] == "pre" and c[1]["teaching"] == TEACHING for c in fx.calls))
        by = {r["writer"]: r for r in res}
        self.assertTrue(all(r["ok"] and r["identical_prompt"] for r in res))
        self.assertNotIn("parity_fixes", by["claude"])
        self.assertTrue(by["ollama"]["parity_fixes"][0]["prompt_changed"])
        # The build's prompt hash is the same for all; the fixed hash is kept beside it.
        self.assertEqual(len({r["prompt_sha256"] for r in res}), 1)
        self.assertEqual(by["ollama"]["parity_fixes"][0]["fixed_prompt_sha256"],
                         lw.sha256_text("THE PROMPT\n[VERSES RETRIEVED]"))

    def test_PROVEN_TO_CATCH_claude_is_never_passed_through_apply_stage(self):
        fx = FakeFixes()
        claude_only = [ScriptedWriter("cli-local", make_lesson(), primary=True, family="claude"),
                       ScriptedWriter("api", make_lesson(), family="claude")]
        lw.fan_out(claude_only, "P", 10, fixes=fx, teaching=TEACHING)
        self.assertEqual(fx.calls, [])
        self.assertEqual(lw.apply_post_fix(fx, {"family": "claude"}, TEACHING, {"a": 1}), {"a": 1})
        self.assertEqual(fx.calls, [])
        self.assertFalse(lw.is_tower("claude"))
        # the check itself catches: had it been passed through, a call is recorded
        lw.apply_fixes(fx, "pre", "ollama", {"teaching": "", "prompt": "P"})
        self.assertEqual(len(fx.calls), 1)

    def test_a_tower_that_alters_even_the_fixed_prompt_is_still_caught(self):
        w = ScriptedWriter("ollama", make_lesson(), family="ollama", mutate=True)
        res, _ = lw.fan_out([w], "P", 10, fixes=FakeFixes(), teaching=TEACHING)
        self.assertFalse(res[0]["ok"])
        self.assertIn("prompt-mismatch", res[0]["error"])

    def test_the_post_fix_repairs_tower_bodies_before_gates_and_never_claudes(self):
        fx = FakeFixes()
        db = FakeDb([row("r1", TEACHING)])
        ws = [ScriptedWriter("claude", make_lesson(), primary=True, family="claude"),
              ScriptedWriter("ollama", make_lesson(), family="ollama")]
        b, rep = build(db, FakeGit(), ws, mode="all-at-once", fixes=fx)
        self.assertEqual(rep["outcome"], "awaiting-review")
        stored = {r["writer"]: r for r in db.versions_rows}
        self.assertEqual(stored["ollama"]["body"].get("parity_marker"), "post-fixed")
        self.assertNotIn("parity_marker", stored["claude"]["body"])
        self.assertEqual([c[0] for c in fx.calls], ["pre", "post"])
        self.assertEqual([p["stage"] for p in stored["ollama"]["gate_results"]["parity_fixes"]], ["pre", "post"])
        self.assertNotIn("parity_fixes", stored["claude"]["gate_results"])

    def test_a_fix_that_raises_keeps_its_input_and_is_recorded(self):
        w = ScriptedWriter("ollama", make_lesson(), family="ollama")
        res, _ = lw.fan_out([w], "P", 10, fixes=FakeFixes(raise_on="pre"), teaching=TEACHING)
        self.assertEqual(w.received, ["P"])
        self.assertTrue(res[0]["ok"])
        self.assertFalse(res[0]["parity_fixes"][0]["applied"])
        self.assertIn("a broken fix", res[0]["parity_fixes"][0]["error"])

    def test_the_parity_module_is_optional(self):
        self.assertIsNone(lw.load_parity_fixes(os.path.join(tempfile.mkdtemp(), "nas-lesson-parity")))
        w = ScriptedWriter("ollama", make_lesson(), family="ollama")
        res, _ = lw.fan_out([w], "P", 10, fixes=None, teaching=TEACHING)
        self.assertEqual(w.received, ["P"])
        self.assertNotIn("parity_fixes", res[0])
        d = tempfile.mkdtemp()
        os.makedirs(os.path.join(d, "fixes"))
        with open(os.path.join(d, "fixes", "__init__.py"), "w") as f:
            f.write("def apply_stage(stage, ctx):\n    return ctx\n")
        saved = sys.modules.pop("fixes", None)
        try:
            mod = lw.load_parity_fixes(d)
            self.assertTrue(callable(mod.apply_stage))
        finally:
            sys.modules.pop("fixes", None)
            if saved is not None:
                sys.modules["fixes"] = saved
            if d in sys.path:
                sys.path.remove(d)

    def test_the_real_parity_package_loads_when_it_is_in_the_repo(self):
        path = os.path.join(REPO, "infra", "nas-lesson-parity")
        if not os.path.isfile(os.path.join(path, "fixes", "__init__.py")):
            self.skipTest("the parity loop (#1845) has not landed in this tree")
        saved = sys.modules.pop("fixes", None)
        try:
            self.assertTrue(callable(lw.load_parity_fixes(path).apply_stage))
        finally:
            sys.modules.pop("fixes", None)
            if saved is not None:
                sys.modules["fixes"] = saved

    def ws(self):
        out = [ScriptedWriter("cli-local", {}, primary=True, family="claude"),
               ScriptedWriter("tower-a", {}, family="ollama"), ScriptedWriter("tower-b", {}, family="compat")]
        for w in out:
            w.label = w.name  # the model label from NAS config
        return out

    def test_a_promoted_writer_is_primary(self):
        ws = self.ws()
        note = lw.promoted_primary(ws, [{"writer_family": "ollama", "model_label": "tower-a", "status": "primary", "held": False}])
        self.assertEqual(lw.primary_name(ws), "tower-a")
        self.assertEqual([w.primary for w in ws], [False, True, False])
        self.assertIn("promoted", note)
        ws2 = self.ws()
        lw.promoted_primary(ws2, [{"writer_family": "compat", "model_label": "", "status": "primary", "held": False}])
        self.assertEqual(lw.primary_name(ws2), "tower-b")

    def test_PROVEN_TO_CATCH_no_promotion_keeps_the_config_primary(self):
        for promos in (None, [], [{"writer_family": "ollama", "model_label": "tower-a", "status": "ready", "held": False}],
                       [{"writer_family": "ollama", "model_label": "tower-a", "status": "primary", "held": True}],
                       [{"writer_family": "ollama", "model_label": "another-model", "status": "primary", "held": False}]):
            ws = self.ws()
            note = lw.promoted_primary(ws, promos)
            self.assertEqual(lw.primary_name(ws), "cli-local", promos)
            self.assertIn("config", note)

    def test_an_absent_promotion_table_reads_as_none(self):
        class Con:
            def run(self, *_a, **_k):
                raise RuntimeError('relation "public.lesson_parity_promotion" does not exist')
        db = object.__new__(lb.Db)
        db.con = Con()
        self.assertIsNone(db.promotions())

        class Con2:
            def run(self, *_a, **_k):
                return [["ollama", "tower-a", "primary", False]]
        db.con = Con2()
        self.assertEqual(db.promotions()[0]["status"], "primary")


class Modes(unittest.TestCase):
    def setUp(self):
        self.ws = [ScriptedWriter("claude", {}, primary=True), ScriptedWriter("gemini", {}), ScriptedWriter("gpt", {})]

    def names(self, mode, sel=()):
        return [w.name for w in lw.select_writers(self.ws, mode, sel)[0]]

    def test_primary_selected_all(self):
        self.assertEqual(self.names("primary"), ["claude"])
        self.assertEqual(self.names("selected", ["gpt"]), ["claude", "gpt"])
        self.assertEqual(self.names("all-at-once"), ["claude", "gemini", "gpt"])

    def test_PROVEN_TO_CATCH_primary_mode_never_runs_a_second_writer(self):
        chosen = self.names("primary", ["gemini", "gpt"])
        self.assertEqual(len(chosen), 1)
        self.assertNotEqual(self.names("all-at-once"), chosen)

    def test_unknown_mode_falls_back_and_says_so(self):
        ws, note = lw.select_writers(self.ws, "everything")
        self.assertEqual(len(ws), 3)
        self.assertIn("unknown mode", note)

    def test_a_row_may_choose_its_own_run(self):
        self.assertEqual(lw.mode_for_row(["lesson", "writer-mode:selected", "writer:gemini"], "primary"), ("selected", ["gemini"]))
        self.assertEqual(lw.mode_for_row(["lesson"], "primary"), ("primary", []))


# =============================================================================
# the gates
# =============================================================================

class Gates(unittest.TestCase):
    def module(self, obj=None):
        return lb.lesson_module(obj or make_lesson(), 196)

    def test_a_real_lesson_passes_every_python_gate(self):
        g = gates.gate_version(make_lesson(), self.module(), CORPUS, lw.schema_problems)
        self.assertTrue(g["passed"], json.dumps(g)[:800])
        self.assertEqual(g["verse"]["verbatim"], g["verse"]["spans"])
        self.assertGreater(g["verse"]["spans"], 10)

    def test_PROVEN_TO_CATCH_one_changed_word_fails_the_verse_gate(self):
        g = gates.gate_version(make_lesson(drift=True), self.module(make_lesson(drift=True)), CORPUS, lw.schema_problems)
        self.assertFalse(g["verse_passed"])
        self.assertFalse(g["passed"])
        self.assertTrue(any(f["kind"] == "not-the-verse" and f["ref"] == "Psalms 121:4" for f in g["verse"]["faults"]))

    def test_the_standard_floors_are_the_newest_lessons(self):
        self.assertEqual((STANDARD_FLOORS["lesson_words"], STANDARD_FLOORS["band_words"], STANDARD_FLOORS["spans"],
                          STANDARD_FLOORS["quiz"], STANDARD_FLOORS["talkingPoints"], STANDARD_FLOORS["benefits"]),
                         (2000, 1000, 40, 6, 10, 12))

    def test_PROVEN_TO_CATCH_a_thin_draft_fails_the_standard_floors(self):
        m = self.module()
        probs = gates.depth_problems(m, 25, STANDARD_FLOORS)
        self.assertTrue(any("full lesson" in p for p in probs))
        self.assertTrue(any("child band" in p for p in probs))
        self.assertTrue(any("quotations" in p for p in probs))
        fat = dict(m, lesson=m["lesson"] + " word" * 2000,
                   levels={b: m["levels"][b] + " word" * 1000 for b in gates.FULL_BANDS},
                   quiz={"questions": m["quiz"]["questions"] * 2}, facilitator={"talkingPoints": ["t"] * 10},
                   benefits=["b"] * 12)
        self.assertEqual(gates.depth_problems(fat, 40, STANDARD_FLOORS), [])

    def test_the_apostrophe_glyph_is_set_to_the_corpus_and_a_wrong_word_still_fails(self):
        typed = "Joseph's day: \"And Joseph's master took him, and put him into the prison\" (Genesis 39:20)"
        fixed = gates.canonical_apostrophes({"lesson": typed})["lesson"]
        self.assertTrue(fixed.startswith("Joseph's day"))  # our prose untouched
        self.assertTrue(gates.verse_gate({"lesson": fixed}, CORPUS)["passed"])
        self.assertFalse(gates.verse_gate({"lesson": typed}, CORPUS)["passed"])
        wrong = gates.canonical_apostrophes({"lesson": typed.replace("master", "lord")})
        self.assertFalse(gates.verse_gate(wrong, CORPUS)["passed"])

    def test_unresolvable_and_shouted(self):
        self.assertEqual(gates.check_span(CORPUS, "x", "Psalms", "121", "99")["kind"], "unresolvable")
        self.assertEqual(gates.check_span(CORPUS, "Behold, he that keepeth Israel shall NEITHER slumber", "Psalms", "121", "4")["kind"], "shouted")
        self.assertIsNone(gates.check_span(CORPUS, "alike abomination to the LORD", "Proverbs", "20", "10"))

    def test_quotation_gate_catches_each_class(self):
        for text, needle in (('He said "hold fast" today.', "with a reference"),
                             ('"Prove all things ... good" (1 Thessalonians 5:21)', "ellipsis"),
                             ("See DR-0643.", "record id"), ("Half, 50 % of us.", "percentage"),
                             ("“Prove all things”", "curly")):
            m = {"lesson": text}
            probs = gates.quotation_gate(m)["problems"]
            self.assertTrue(any(needle in p for p in probs), (text, probs))

    def test_voice_gate(self):
        self.assertFalse(gates.voice_gate({"lesson": "God keeps us."})["passed"])
        self.assertTrue(gates.voice_gate({"lesson": 'Yahweh keeps us. "For God so loved the world" (John 3:16)'})["passed"])
        self.assertFalse(gates.voice_gate({"lesson": "Satan lost."})["passed"])
        self.assertFalse(gates.voice_gate({"lesson": "we follow jesus"})["passed"])

    def test_holy_names_in_step_with_typographic_theology(self):
        with open(os.path.join(REPO, "app/src/lib/typographic-theology.js"), encoding="utf-8") as f:
            js = f.read()
        block = js[js.index("HOLY_NAME_WORDS = ["):]
        block = block[:block.index("];")]
        import re
        self.assertEqual(tuple(re.findall(r"'([^']+)'", block)), gates.HOLY_NAME_WORDS)

    @unittest.skipIf(shutil.which("node") is None, "node not on this machine")
    def test_parity_the_repo_own_gates_agree_with_python_on_a_published_lesson(self):
        # L195, exported by node from the real catalog, gated by both layers.
        script = ("import('{}/app/src/lib/living-lessons-class.js').then(m => process.stdout.write("
                  "JSON.stringify(m.LIVING_LESSONS_MODULES.find(x => x.id.startsWith('ll195-')))))").format(REPO)
        mod = json.loads(subprocess.run(["node", "-e", script], capture_output=True, check=True).stdout)
        js = gates.node_band_gates(mod, repo=REPO)
        self.assertNotIn("skipped", js, js)
        py = gates.verse_gate(mod, CORPUS)
        self.assertEqual((py["spans"], py["verbatim"]), (js["verse"]["spans"], js["verse"]["verbatim"]))
        self.assertTrue(js["passed"], js)
        drift = json.loads(json.dumps(mod))
        drift["lesson"] = drift["lesson"].replace("shall stand for ever", "shall stand for all time")
        self.assertFalse(gates.node_band_gates(drift, repo=REPO)["verse"]["passed"])
        self.assertFalse(gates.verse_gate(drift, CORPUS)["passed"])


class Selection(unittest.TestCase):
    def v(self, name, passed=True, verse=True, verbatim=10):
        return {"writer": name, "elapsed_ms": 1, "gates": {"passed": passed, "verse_passed": verse,
                                                            "verse": {"verbatim": verbatim}, "structure": {"counts": {}}}}

    def test_primary_ships_when_it_passes(self):
        self.assertEqual(gates.select_version([self.v("b", verbatim=99), self.v("a")], "a")[0]["writer"], "a")

    def test_best_passing_when_primary_fails(self):
        c, why = gates.select_version([self.v("a", passed=False), self.v("b", verbatim=5), self.v("c", verbatim=9)], "a")
        self.assertEqual(c["writer"], "c")
        self.assertIn("did not pass", why)

    def test_PROVEN_TO_CATCH_a_verse_failed_version_never_ships_even_as_primary(self):
        c, _ = gates.select_version([self.v("a", passed=True, verse=False)], "a")
        self.assertIsNone(c)


# =============================================================================
# deterministic stages
# =============================================================================

class Stages(unittest.TestCase):
    def test_eligibility_mirrors_the_routine(self):
        cases = [(["lesson"], OWNER, True), (["lesson", "lesson-captured"], OWNER, False),
                 (["lesson", "voice"], OWNER, False), (["lesson", "voice", "voice-transcript"], OWNER, True),
                 (["lesson", "voice-failed"], OWNER, False), (["lesson"], "member", False),
                 (["lesson", "lesson-approved"], "member", True), (["lesson", "canary"], OWNER, False),
                 (["lesson", "awaiting-review"], OWNER, False),
                 (["lesson", "build:failed@2026-09-29T00:00:00Z", "build:failed@2026-09-29T01:00:00Z"], OWNER, False)]
        for tags, who, ok in cases:
            self.assertEqual(lb.eligibility(row("r", TEACHING, tags, who))[0], ok, tags)

    def test_one_teaching_groups_the_transcript_and_the_typed_copy(self):
        t = row("t", "Lesson. A spoken lesson, transcribed by Whisper. " + TEACHING, ["lesson", "voice-transcript", "of:orig"])
        typed = row("x", TEACHING, at="2026-09-29T05:01:00")
        other = row("o", "Joseph kept the grain for seven years and the famine came as the dream foretold it.")
        g = lb.group_teaching(t, [t, typed, other])
        self.assertEqual([r["id"] for r in g], ["t", "x"])
        self.assertEqual(lb.companion_ids(g), ["orig"])

    def test_already_built(self):
        fps = lb.fingerprints(TEACHING)
        self.assertTrue(lb.already_built(fps, lb.normalize_for_search("xx " + TEACHING + " yy")))
        self.assertFalse(lb.already_built(fps, "nothing like it"))

    def test_numbers_are_atomic_across_parallel_builds(self):
        state = os.path.join(tempfile.mkdtemp(), "numbers.json")
        got = []
        ts = [threading.Thread(target=lambda i=i: got.append(lb.reserve_numbers(state, 195, 669, "b%d" % i))) for i in range(12)]
        for t in ts:
            t.start()
        for t in ts:
            t.join()
        self.assertEqual(len({g[0] for g in got}), 12)
        self.assertEqual(len({g[1] for g in got}), 12)
        self.assertEqual(min(g[0] for g in got), 196)
        lb.release_numbers(state, "b0")
        with open(state) as f:
            self.assertNotIn("b0", json.load(f)["inflight"])

    def test_the_real_files_take_a_lesson(self):
        with open(os.path.join(REPO, lb.LIVING), encoding="utf-8") as f:
            src = f.read()
        m = lb.lesson_module(make_lesson(), 196)
        out = lb.insert_module(src, lb.module_js(m))
        out2, weeks = lb.bump_weeks(out, 196, m["title"], "2026-09-29")
        self.assertIn("id: 'll196-the-keeper", out2)
        self.assertEqual(out2.count("export const LIVING_LESSONS_MODULES"), 1)
        with open(os.path.join(REPO, lb.CROSSLIST), encoding="utf-8") as f:
            cross = f.read()
        cl, n = lb.bump_crosslist(cross, 196, m["title"], 670, "2026-09-29")
        if lb.counts_derived(src):
            # DR-0677: the real files derive their counts; the bumps edit nothing.
            self.assertEqual((out2, weeks), (out, None))
            self.assertEqual((cl, n), (cross, None))
        else:
            self.assertIn("toBe({})".format(n), cl)
            for path, key in lb.BASELINES:
                with open(os.path.join(REPO, path), encoding="utf-8") as f:
                    before = json.load(f)[key]
                    f.seek(0)
                    after = json.loads(lb.bump_json_count(f.read(), key))[key]
                self.assertEqual(after, before + 1, path)
        with open(os.path.join(REPO, lb.INDEX), encoding="utf-8") as f:
            idx = lb.update_index(f.read(), lb.index_row(670, "DR-0670-x.md", 196, m["title"], "s"), 670, "x", "2026-09-29")
        self.assertIn("[DR-0670](DR-0670-x.md)", idx)

    def test_derived_counts_are_detected_and_pinned_counts_still_bump(self):
        derived = "export const LIVING_LESSONS_META = {\n  get weeks() { return LIVING_LESSONS_MODULES.length; },\n};"
        pinned = "export const LIVING_LESSONS_META = {\n  weeks: 195, // L195 x (2026-09-28) · \n};"
        self.assertTrue(lb.counts_derived(derived))
        self.assertFalse(lb.counts_derived(pinned))
        self.assertEqual(lb.bump_weeks(derived, 196, "T", "2026-09-29"), (derived, None))
        # PROVEN TO CATCH: the pinned regime still bumps, so detection is not a blanket skip.
        out, n = lb.bump_weeks(pinned, 196, "T", "2026-09-29")
        self.assertEqual(n, 196)
        self.assertIn("weeks: 196, // L196 T", out)
        self.assertEqual(lb.bump_crosslist("expect(mounted).toBeGreaterThanOrEqual(SCHOOL_FLOOR.lessons);", 196, "T", 670, "d")[1], None)
        with self.assertRaises(ValueError):
            lb.bump_weeks("no count at all", 196, "T", "d")
        self.assertEqual(lb.bump_json_count('{"note": 1}', "measuredLessons"), '{"note": 1}')

    @unittest.skipIf(shutil.which("node") is None, "node not on this machine")
    def test_the_written_module_is_valid_javascript_and_round_trips(self):
        m = lb.lesson_module(make_lesson(), 196)
        m["lesson"] += " It’s the Keeper's watch \\ and a 'quote'."
        js = "const x = " + lb.js_value(m, 0) + "; process.stdout.write(JSON.stringify(x));"
        back = json.loads(subprocess.run(["node", "-e", js], capture_output=True, check=True).stdout)
        self.assertEqual(back, m)

    def test_the_stage_vocabulary_is_documented(self):
        with open(os.path.join(HERE, "lesson_builder.py"), encoding="utf-8") as f:
            doc = f.read().split('"""')[1]
        for s in lb.STAGES + lb.OTHER_STAGES:
            self.assertIn(s, doc, s)
        self.assertEqual(lb.stage_times([lb.stage_tag("pushed", "2026-09-29T05:00:01Z")]), {"pushed": "2026-09-29T05:00:01Z"})


# =============================================================================
# the road, end to end with fakes
# =============================================================================

class Road(unittest.TestCase):
    def test_one_writer_builds_pushes_then_marks_the_row(self):
        db = FakeDb([row("r1", TEACHING, ["lesson", "lesson-building"])])
        git = FakeGit()
        b, rep = build(db, git, [ScriptedWriter("claude", make_lesson(), primary=True)], mode="primary")
        tags = db.rows["r1"]["tags"]
        self.assertEqual(rep["outcome"], "published", rep)
        self.assertEqual(len(git.pushed), 1)
        for t in ("lesson-captured", "lesson-published", "lesson-id:" + rep["lesson_id"]):
            self.assertIn(t, tags)
        self.assertNotIn("lesson-building", tags)
        times = lb.stage_times(tags)
        for s in ("grouped", "writing", "gated", "numbered", "committed", "pushed", "published"):
            self.assertIn(s, times)
        self.assertTrue(times["pushed"] <= times["published"])
        self.assertEqual([x["published"] for x in db.versions_rows], [True])
        wt = os.path.join(git.tmp, b.build_id)
        with open(os.path.join(wt, "app/src/__tests__/living-lessons-l196-verses.test.js"), encoding="utf-8") as f:
            test = f.read()
        self.assertIn("PROVEN-TO-CATCH", test)
        self.assertIn(v("Psalms", 121, 4), test)

    def preview_build(self, previewer):
        db = FakeDb([row("r1", TEACHING, ["lesson", "lesson-building"])])
        git = FakeGit()
        b, rep = build(db, git, [ScriptedWriter("claude", make_lesson(), primary=True)], mode="primary", previewer=previewer)
        return db, git, rep

    def test_a_pushed_lesson_is_written_as_a_preview_through_the_publish_gate(self):
        calls = []

        def previewer(wt, course, lid, branch):
            calls.append((course, lid, branch, os.path.isdir(wt)))
            return {"passed": True, "rows": {"lessons": [{"lesson_id": lid, "status": "preview", "pr_url": "https://x/pr/1"}]}}
        db, git, rep = self.preview_build(previewer)
        self.assertEqual(rep["outcome"], "published")
        self.assertEqual(calls, [("living-lessons", rep["lesson_id"], rep["branch"], True)])
        self.assertEqual(len(db.previews), 1)
        times = lb.stage_times(db.rows["r1"]["tags"])
        self.assertTrue(times["pushed"] <= times["previewed"] <= times["published"])
        self.assertTrue(rep["preview"]["written"])

    def test_PROVEN_TO_CATCH_a_refused_preview_writes_nothing_and_never_blocks_the_lesson(self):
        db, git, rep = self.preview_build(lambda *a: {"passed": False, "fresh": ["verse :: ll196 :: drift"]})
        self.assertEqual(rep["outcome"], "published")
        self.assertEqual(len(git.pushed), 1)
        self.assertFalse(getattr(db, "previews", []))
        self.assertNotIn("previewed", lb.stage_times(db.rows["r1"]["tags"]))
        self.assertTrue(any("preview refused by the curriculum gate" in t for t in db.rows["r1"]["tags"]))
        for res in ({"skipped": "no node_modules"}, RuntimeError("boom")):
            def pv(*a, res=res):
                if isinstance(res, Exception):
                    raise res
                return res
            db, _, rep = self.preview_build(pv)
            self.assertEqual(rep["outcome"], "published")
            self.assertIn("skipped", rep["preview"])
            self.assertFalse(getattr(db, "previews", []))

    def test_the_node_previewer_says_so_without_node_modules(self):
        self.assertIn("no node_modules", lb.node_preview(tempfile.mkdtemp(), "living-lessons", "ll1-x", "b")["skipped"])

    def test_PROVEN_TO_CATCH_a_failed_push_never_marks_the_row_captured(self):
        db = FakeDb([row("r1", TEACHING, ["lesson", "lesson-building"])])
        _, rep = build(db, FakeGit(push_fails=True), [ScriptedWriter("claude", make_lesson(), primary=True)], mode="primary")
        tags = db.rows["r1"]["tags"]
        self.assertEqual(rep["outcome"], "failed")
        self.assertNotIn("lesson-captured", tags)
        self.assertIn("build-failed", tags)
        self.assertTrue(any(t.startswith("build-reason:") and "push refused" in t for t in tags))

    def test_PROVEN_TO_CATCH_a_verse_drift_fails_the_build_and_nothing_is_pushed(self):
        db = FakeDb([row("r1", TEACHING, ["lesson", "lesson-building"])])
        git = FakeGit()
        _, rep = build(db, git, [ScriptedWriter("claude", make_lesson(drift=True), primary=True)], mode="primary")
        self.assertEqual(rep["outcome"], "failed")
        self.assertEqual(git.pushed, [])
        self.assertNotIn("lesson-captured", db.rows["r1"]["tags"])
        self.assertTrue(any("Psalms 121:4" in t for t in db.rows["r1"]["tags"] if t.startswith("build-reason:")))

    def test_PROVEN_TO_CATCH_more_than_one_version_waits_for_Darrell_and_never_auto_ships(self):
        db = FakeDb([row("r1", TEACHING, ["lesson", "lesson-building"])])
        git = FakeGit(forbid=True)
        ws = [ScriptedWriter("claude", make_lesson(), primary=True), ScriptedWriter("gemini", make_lesson(), family="gemini")]
        _, rep = build(db, git, ws, mode="all-at-once")
        self.assertEqual(rep["outcome"], "awaiting-review")
        self.assertIn("awaiting-review", db.rows["r1"]["tags"])
        self.assertNotIn("lesson-captured", db.rows["r1"]["tags"])
        self.assertEqual(len(db.versions_rows), 2)
        self.assertFalse(any(x["published"] for x in db.versions_rows))
        self.assertEqual(len({x["prompt_sha256"] for x in db.versions_rows}), 1)
        # the same two writers in PRIMARY mode ship on their own
        db2 = FakeDb([row("r1", TEACHING, ["lesson", "lesson-building"])])
        _, rep2 = build(db2, FakeGit(), ws, mode="primary")
        self.assertEqual(rep2["outcome"], "published")

    def test_a_recorder_test_builds_nothing(self):
        d = {"verdict": "test-only"}
        db = FakeDb([row("r1", "just a test to see if I can get a lesson", ["lesson", "lesson-building"])])
        _, rep = build(db, FakeGit(forbid=True), [ScriptedWriter("claude", d, primary=True)])
        self.assertEqual(rep["outcome"], "skipped-test")
        self.assertIn("lesson-captured", db.rows["r1"]["tags"])

    def test_a_teaching_already_built_is_compared_not_rebuilt(self):
        db = FakeDb([row("r1", TEACHING, ["lesson", "lesson-building"])])
        git = FakeGit(forbid=True)
        git.catalog = ["lesson: '" + TEACHING + "'"]
        _, rep = build(db, git, [ScriptedWriter("claude", make_lesson(), primary=True)])
        self.assertEqual(rep["outcome"], "duplicate")
        self.assertIn("parallel-compared", db.rows["r1"]["tags"])

    def test_no_writer_fails_with_every_reason_named(self):
        db = FakeDb([row("r1", TEACHING, ["lesson", "lesson-building"])])
        _, rep = build(db, FakeGit(forbid=True), [ScriptedWriter("claude", {}, primary=True, reachable=False)])
        self.assertEqual(rep["outcome"], "failed")
        self.assertIn("claude", rep["why"])


# =============================================================================
# the brakes
# =============================================================================

class Retry(unittest.TestCase):
    def test_a_second_attempt_is_told_exactly_what_the_first_got_wrong(self):
        db = FakeDb([row("r1", TEACHING, ["lesson", "lesson-building"])])
        data = tempfile.mkdtemp()
        w1 = ScriptedWriter("claude", make_lesson(drift=True), primary=True)
        b1 = lb.Build(list(db.rows.values()), db, FakeGit(), [w1], CORPUS, data_dir=data, today="2026-09-29", mode="primary")
        self.assertEqual(b1.run()["outcome"], "failed")
        db.rows["r1"]["tags"].append("lesson-building")
        w2 = ScriptedWriter("claude", make_lesson(), primary=True)
        b2 = lb.Build(list(db.rows.values()), db, FakeGit(), [w2], CORPUS, data_dir=data, today="2026-09-29", mode="primary")
        self.assertEqual(b2.run()["outcome"], "published")
        self.assertIn("A PREVIOUS DRAFT OF THIS TEACHING FAILED", w2.received[0])
        self.assertIn("(Psalms 121:4) was quoted as", w2.received[0])
        self.assertNotIn("A PREVIOUS DRAFT", w1.received[0])


class Brakes(unittest.TestCase):
    def test_PROVEN_TO_CATCH_the_row_lock_refuses_a_second_holder(self):
        d = tempfile.mkdtemp()
        self.assertTrue(lb.acquire_row_lock(d, "row-1"))
        self.assertFalse(lb.acquire_row_lock(d, "row-1"))
        lb.release_row_lock(d, "row-1")
        self.assertTrue(lb.acquire_row_lock(d, "row-1"))

    def test_a_lock_left_by_a_dead_process_is_broken_once(self):
        d = tempfile.mkdtemp()
        os.makedirs(os.path.join(d, "locks"))
        with open(os.path.join(d, "locks", "row-2.lock"), "w") as f:
            f.write("999999 {}".format(int(time.time())))
        self.assertTrue(lb.acquire_row_lock(d, "row-2"))

    def test_the_database_claim_is_the_second_lock(self):
        db = FakeDb([row("r1", TEACHING)])
        self.assertTrue(db.claim("r1", "t"))
        self.assertFalse(db.claim("r1", "t"))

    def test_PROVEN_TO_CATCH_the_budget_ends_a_hung_build(self):
        t0 = time.time()
        res = lb.run_with_budget([sys.executable, "-c", "import time; time.sleep(30)"], 1)
        self.assertTrue(res["timed_out"])
        self.assertLess(time.time() - t0, 10)

    def test_a_hung_build_marks_its_rows_failed_with_the_reason(self):
        db = FakeDb([row("r1", TEACHING)])
        svc = lb.Service(db, data_dir=tempfile.mkdtemp(), ready=lambda: (True, {"state": "ready"}),
                         kill=lambda: (False, "armed"), spawn=lambda spec: {"timed_out": True, "code": None}, log=lambda *_: None)
        svc.consider("r1")
        for t in svc.threads:
            t.join(5)
        tags = db.rows["r1"]["tags"]
        self.assertIn("build-failed", tags)
        self.assertNotIn("lesson-building", tags)
        self.assertTrue(any(t.startswith("build-reason:budget") for t in tags))

    def test_the_same_row_is_never_built_twice_concurrently(self):
        db = FakeDb([row("r1", TEACHING)])
        gate = threading.Event()
        calls = []

        def spawn(spec):
            calls.append(spec)
            gate.wait(5)
            return {"timed_out": False, "code": 0}
        svc = lb.Service(db, data_dir=tempfile.mkdtemp(), ready=lambda: (True, {}), kill=lambda: (False, ""), spawn=spawn,
                         log=lambda *_: None)
        svc.consider("r1")
        db.rows["r1"]["tags"].remove("lesson-building")  # even if the tag were lost, the file lock holds
        svc.consider("r1")
        svc.consider(None)
        gate.set()
        for t in svc.threads:
            t.join(5)
        self.assertEqual(len(calls), 1)

    def test_a_claim_whose_build_is_gone_is_released_on_the_sweep_and_a_live_one_is_not(self):
        db = FakeDb([row("gone", TEACHING, ["lesson", "lesson-building"]),
                     row("live", "An entirely different teaching about the harvest and the seed and the field.", ["lesson", "lesson-building"])])
        data = tempfile.mkdtemp()
        self.assertTrue(lb.acquire_row_lock(data, "live"))  # a live build holds this one
        svc = lb.Service(db, data_dir=data, ready=lambda: (False, {"state": "waiting on a writer"}), kill=lambda: (False, ""),
                         log=lambda *_: None)
        self.assertEqual(svc.release_stale(db.pending()), ["gone"])
        self.assertNotIn("lesson-building", db.rows["gone"]["tags"])
        self.assertIn("lesson-building", db.rows["live"]["tags"])

    def test_no_count_cap_every_waiting_teaching_starts(self):
        import random
        rnd = random.Random(7)
        vocab = ("grace faith hope love watch light bread water vine shepherd door way truth life rock seed field "
                 "harvest lamp oil wine fig tree river mountain city gate wall stone crown robe ring feast").split()
        rows = [row("r%d" % i, " ".join(rnd.choice(vocab) for _ in range(40))) for i in range(25)]
        db = FakeDb(rows)
        svc = lb.Service(db, data_dir=tempfile.mkdtemp(), ready=lambda: (True, {}), kill=lambda: (False, ""),
                         spawn=lambda spec: {"timed_out": False, "code": 0}, log=lambda *_: None)
        started = svc.consider(None)
        for t in svc.threads:
            t.join(5)
        self.assertEqual(len(started), 25)

    def kill_mirror(self, armed=True, entry=True, enabled=True):
        d = tempfile.mkdtemp()
        os.makedirs(os.path.join(d, "infra", "nas-loops"))
        if armed:
            open(os.path.join(d, "infra", "nas-loops", "ARMED-BY-RECORD"), "w").close()
        svcs = [{"name": "lesson-builder", "enabled": enabled}] if entry else []
        with open(os.path.join(d, "infra", "nas-loops", "services.json"), "w") as f:
            json.dump({"services": svcs}, f)
        return d

    def test_PROVEN_TO_CATCH_each_stop_path(self):
        self.assertFalse(lb.kill_state(self.kill_mirror())[0])
        self.assertTrue(lb.kill_state(self.kill_mirror(armed=False))[0])
        self.assertTrue(lb.kill_state(self.kill_mirror(enabled=False))[0])
        self.assertTrue(lb.kill_state(self.kill_mirror(entry=False))[0])

    def test_PROVEN_TO_CATCH_a_stopped_service_claims_nothing(self):
        db = FakeDb([row("r1", TEACHING)])
        mirror = self.kill_mirror(enabled=False)
        svc = lb.Service(db, data_dir=tempfile.mkdtemp(), ready=lambda: (True, {}), kill=lambda: lb.kill_state(mirror),
                         spawn=lambda s: self.fail("a stopped service must not build"), log=lambda *_: None)
        self.assertEqual(svc.consider("r1"), [])
        self.assertNotIn("lesson-building", db.rows["r1"]["tags"])
        self.assertEqual(svc.status["state"], "stopped")

    def test_the_real_manifest_carries_the_builder_and_arms_it(self):
        self.assertFalse(lb.kill_state(REPO)[0], lb.kill_state(REPO)[1])

    def test_dormant_until_a_writer_claims_nothing_and_names_why(self):
        db = FakeDb([row("r1", TEACHING)])
        tok = tempfile.mkstemp()[1]
        ready = lambda: lb.readiness(env={}, writers=[ScriptedWriter("claude", {}, primary=True, reachable=False)], token_file=tok)  # noqa: E731
        svc = lb.Service(db, data_dir=tempfile.mkdtemp(), ready=ready, kill=lambda: (False, ""),
                         spawn=lambda s: self.fail("no writer: nothing may start"), log=lambda *_: None)
        self.assertEqual(svc.consider(None), [])
        self.assertEqual(svc.status["state"], "waiting on a writer")
        self.assertEqual(svc.status["writers"][0]["writer"], "claude")
        self.assertNotIn("lesson-building", db.rows["r1"]["tags"])


# =============================================================================
# Darrell's decision
# =============================================================================

class Decisions(unittest.TestCase):
    def setUp(self):
        self.db = FakeDb([row("r1", TEACHING, ["lesson", "awaiting-review", "build-group:B1"])])
        a, b = make_lesson(), make_lesson()
        b["movements"][1] = {"title": "The honest scale", "text": "Weigh it once: " + q("Proverbs", 20, 10)}
        for name, body in (("claude", a), ("gemini", b)):
            self.db.versions_rows.append({"id": name, "build_id": "B1", "writer": name, "family": name, "body": body,
                                          "prompt_sha256": "s", "prompt_text": "P", "gate_results": {}, "backfill": False})
        self.versions = {x["id"]: dict(x) for x in self.db.versions_rows}

    def test_assemble_merges_part_by_part_and_numbers_the_movements(self):
        body, src = lb.assemble({"version_id": "claude", "merge_map": {"movements.1": "gemini", "title": "claude"}}, self.versions)
        self.assertEqual(body["movements"][1]["title"], "The honest scale")
        self.assertEqual(src["movements.1"], "gemini")
        self.assertIn("\n\n2. The honest scale. ", lb.compose_lesson(body))

    def test_PROVEN_TO_CATCH_an_edit_may_not_touch_quoted_Scripture(self):
        old = self.versions["claude"]["body"]["lesson_intro"]
        ok, _ = lb.assemble({"version_id": "claude", "edits": {"lesson_intro": old + " A warmer word."}}, self.versions)
        self.assertTrue(ok["lesson_intro"].endswith("A warmer word."))
        text = self.versions["claude"]["body"]["movements"][0]["text"]
        with self.assertRaises(lb.DecisionError) as e:
            lb.assemble({"version_id": "claude", "edits": {"movements.0.text": text.replace("slumber", "doze")}}, self.versions)
        self.assertEqual(e.exception.part, "movements.0.text")

    def test_PROVEN_TO_CATCH_a_merged_part_with_a_one_word_drift_fails_on_that_part(self):
        self.versions["gemini"]["body"]["movements"][1]["text"] = "Weigh: " + q("Proverbs", 20, 10).replace("abomination", "offence")
        body, _ = lb.assemble({"version_id": "claude", "merge_map": {"movements.1": "gemini"}}, self.versions)
        g, failures = lb.gate_composite(body, CORPUS)
        self.assertFalse(g["verse_passed"])
        self.assertTrue(any(f["check"] == "verse:not-the-verse" and f["part"] == "movements.1" for f in failures), failures)

    def test_a_passing_decision_ships_and_records_the_lesson(self):
        self.db.decisions["D1"] = {"id": "D1", "build_id": "B1", "version_id": "claude",
                                   "merge_map": {"movements.1": "gemini"}, "edits": {}, "status": "decided"}
        git = FakeGit()
        out = lb.Decide("D1", self.db, git, CORPUS, data_dir=tempfile.mkdtemp(), pr_finder=lambda b: "https://example/pr/1").run()
        d = self.db.decisions["D1"]
        self.assertEqual((out["outcome"], d["status"]), ("shipped", "shipped"))
        self.assertTrue(d["lesson_id"].startswith("ll196-"))
        self.assertEqual(d["pr_url"], "https://example/pr/1")
        self.assertEqual(len(git.pushed), 1)
        tags = self.db.rows["r1"]["tags"]
        self.assertIn("lesson-published", tags)
        self.assertNotIn("awaiting-review", tags)
        published = [x for x in self.db.versions_rows if x.get("published")]
        self.assertEqual(len(published), 1)

    def test_PROVEN_TO_CATCH_a_failing_composite_ships_nothing_and_names_the_check(self):
        self.versions_bad = self.db.versions_rows[1]["body"]["movements"][1]
        self.versions_bad["text"] = "Weigh: " + q("Proverbs", 20, 10).replace("abomination", "offence")
        self.db.decisions["D2"] = {"id": "D2", "build_id": "B1", "version_id": "claude",
                                   "merge_map": {"movements.1": "gemini"}, "edits": {}, "status": "decided"}
        git = FakeGit(forbid=True)
        out = lb.Decide("D2", self.db, git, CORPUS, data_dir=tempfile.mkdtemp(), pr_finder=None).run()
        d = self.db.decisions["D2"]
        self.assertEqual(d["status"], "gate-failed")
        self.assertEqual(out["outcome"], "gate-failed")
        self.assertEqual(d["gate_result"]["failures"][0]["part"], "movements.1")
        self.assertNotIn("lesson-captured", self.db.rows["r1"]["tags"])

    def test_a_decision_is_read_once(self):
        self.db.decisions["D3"] = {"id": "D3", "build_id": "B1", "version_id": "claude", "status": "shipped"}
        self.assertEqual(lb.Decide("D3", self.db, FakeGit(forbid=True), CORPUS).run()["outcome"], "not-decided-or-taken")


# =============================================================================
# backfill: compare, never replace
# =============================================================================

class BackfillTests(unittest.TestCase):
    DR = "# DR-0643\n\n## The report\n\n" + " ".join(["word"] * 50) + " ll195-x\n\n## The decision\n\nx\n"

    def test_the_source_is_the_record_or_nothing(self):
        src, ref = lb.recorded_source("ll195-x", {"DR-0643-a.md": self.DR})
        self.assertTrue(src.startswith("word"))
        self.assertEqual(ref, "docs/decisions/DR-0643-a.md#The report")
        self.assertEqual(lb.recorded_source("ll1-nope", {"DR-0643-a.md": self.DR})[0], None)
        thin = "# DR\n\n## Context\n\nshort ll7-y\n"
        src, why = lb.recorded_source("ll7-y", {"DR-9.md": thin})
        self.assertIsNone(src)
        self.assertIn("no source section", why)

    def test_the_plan_skips_what_cannot_be_recovered_and_says_why(self):
        living = "  {\n    id: 'll195-x',\n    title: 'Keeps',\n  },\n  {\n    id: 'll7-y',\n    title: 'Other',\n  },\n"
        svc = lb.Service(None, data_dir=tempfile.mkdtemp())
        todo, skipped = svc.backfill_plan(living, {"DR-0643-a.md": self.DR})
        self.assertEqual([t[0] for t in todo], ["ll195-x"])
        self.assertEqual(skipped[0]["lesson_id"], "ll7-y")

    def test_PROVEN_TO_CATCH_a_backfill_version_can_never_be_published(self):
        self.assertFalse(lb.backfill_record({"published": True})["published"])
        with self.assertRaises(ValueError):
            lb.refuse_published_backfill({"backfill": True, "published": True})
        with self.assertRaises(ValueError):
            FakeDb().insert_version({"backfill": True, "published": True})

    def test_a_backfill_run_stores_every_version_for_comparison_only(self):
        db = FakeDb()
        ws = [ScriptedWriter("claude", make_lesson(), primary=True), ScriptedWriter("gemini", make_lesson(drift=True), family="gemini")]
        out = lb.Backfill("ll195-x", "Keeps", TEACHING, "docs/decisions/DR-0643-a.md#The report", db, ws, CORPUS,
                          mode="all-at-once").run()
        self.assertEqual(out["stored"], 2)
        self.assertTrue(all(x["backfill"] and not x["published"] for x in db.versions_rows))
        self.assertEqual({x["lesson_id"] for x in db.versions_rows}, {"ll195-x"})
        self.assertEqual([x["gate_results"]["verse_passed"] for x in db.versions_rows], [True, False])
        self.assertFalse(hasattr(lb.Backfill, "ship"))


class BellTests(unittest.TestCase):
    """DR-0697: a lesson row notification rings the bell once per burst, with a
    trailing ring, an hourly ceiling and a kill; never an id or a word."""

    def clock(self, start=1000.0):
        t = {"now": start}
        return t, (lambda: t["now"])

    def test_a_row_rings_once_and_a_burst_is_one_ring_plus_a_trailing_ring(self):
        t, clk = self.clock()
        sent = []
        bell = lb.Bell(post=lambda: (sent.append(1), (True, 204))[1], clock=clk, spacing=20, max_per_hour=30,
                       enabled=True, log=lambda *_: None)
        self.assertEqual(bell.ring(), "sent")
        t["now"] += 1
        self.assertEqual(bell.ring(), "wait")   # a burst: held, not dropped
        self.assertEqual(bell.ring(), "wait")
        self.assertEqual(len(sent), 1)
        self.assertGreater(bell.wait_seconds(), 0)
        t["now"] += 20
        self.assertEqual(bell.flush(), "sent")   # the trailing ring
        self.assertEqual(len(sent), 2)
        self.assertEqual(bell.flush(), "idle")
        self.assertIsNone(bell.wait_seconds())

    def test_PROVEN_TO_CATCH_the_hourly_ceiling_holds_the_ring_and_the_kill_drops_it(self):
        t, clk = self.clock()
        sent = []
        bell = lb.Bell(post=lambda: (sent.append(1), (True, 204))[1], clock=clk, spacing=0, max_per_hour=2,
                       enabled=True, log=lambda *_: None)
        bell.ring()
        bell.ring()
        self.assertEqual(bell.ring(), "budget")
        self.assertEqual(len(sent), 2)
        t["now"] += 3601
        self.assertEqual(bell.flush(), "sent")   # the held ring goes once the window frees
        off = lb.Bell(post=lambda: (sent.append(1), (True, 204))[1], clock=clk, enabled=False, log=lambda *_: None)
        self.assertEqual(off.ring(), "off")
        self.assertEqual(len(sent), 3)

    def test_the_dispatch_carries_no_id_and_no_words(self):
        tok = os.path.join(tempfile.mkdtemp(), "t")
        with open(tok, "w") as f:
            f.write("secret-token\n")
        seen = []

        def opener(req, timeout=None):
            seen.append(req)

            class R:
                status = 204

                def __enter__(self):
                    return self

                def __exit__(self, *a):
                    return False
            return R()
        ok, code = lb.bell_dispatch(token_file=tok, repo="o/r", opener=opener)
        self.assertTrue(ok)
        self.assertEqual(code, 204)
        body = json.loads(seen[0].data.decode("utf-8"))
        self.assertEqual(body, {"event_type": "lesson-saved", "client_payload": {"source": "nas-lesson-builder"}})
        self.assertTrue(seen[0].full_url.endswith("/repos/o/r/dispatches"))
        self.assertFalse(lb.bell_dispatch(token_file=tok + "-missing")[0])

    def test_the_listen_loop_flushes_the_trailing_ring_and_wakes_for_it(self):
        import inspect
        src = inspect.getsource(lb.Service.listen_forever)
        self.assertIn("self.bell.flush()", src)
        self.assertIn("self.bell.wait_seconds()", src)
        self.assertIn("Service(None, bell=bell)", inspect.getsource(lb.main))

    def test_the_service_rings_on_a_row_not_on_a_sweep_and_not_when_stopped(self):
        rings = []

        class B:
            def ring(self):
                rings.append(1)
        db = FakeDb([row("a", TEACHING)])
        svc = lb.Service(db, data_dir=tempfile.mkdtemp(), ready=lambda: (False, {"state": "waiting on a writer"}),
                         kill=lambda: (False, ""), log=lambda *_: None, bell=B())
        svc.consider("a")
        self.assertEqual(len(rings), 1)          # rings even with no writer ready
        svc.consider(None)
        svc.consider("decision:x")
        self.assertEqual(len(rings), 1)
        stopped = lb.Service(db, data_dir=tempfile.mkdtemp(), kill=lambda: (True, "enabled:false"),
                             log=lambda *_: None, bell=B())
        stopped.consider("a")
        self.assertEqual(len(rings), 1)


class Migration(unittest.TestCase):
    def test_the_migration_carries_the_shape_the_builder_writes(self):
        mig = [f for f in os.listdir(os.path.join(REPO, "infra/supabase/migrations-auto"))
               if f.startswith("0243-the-lesson-builder")]
        self.assertEqual(len(mig), 1)
        with open(os.path.join(REPO, "infra/supabase/migrations-auto", mig[0]), encoding="utf-8") as f:
            sql = f.read()
        for col in ("build_id", "teaching_row_id", "lesson_id", "writer", "family", "model_label", "prompt_sha256",
                    "prompt_text", "body", "gate_results", "elapsed_ms", "usage", "error", "published", "backfill", "source_ref"):
            self.assertIn("  " + col + " ", sql, col)
            if col != "writer":
                # ensured even when the parity loop's 0240 (applied first) created a narrower table
                self.assertRegex(sql, r"ADD COLUMN IF NOT EXISTS " + col + r"\s", col)
        self.assertIn("CHECK (NOT (backfill AND published))", sql)
        self.assertIn("pg_notify('lesson_inbox'", sql)
        self.assertIn("'decision:' || NEW.id::text", sql)
        for m in lw.MODES:
            self.assertIn("'{}'".format(m), sql)


if __name__ == "__main__":
    unittest.main()

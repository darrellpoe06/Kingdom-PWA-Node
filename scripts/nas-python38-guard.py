#!/usr/bin/env python3
# =============================================================================
# nas-python38-guard -- NAS-side Python must run on the NAS's Python (3.8.15)
# =============================================================================
# MEASURED 2026-11-24. infra/nas-loops/bg-message-lessons.py (DR-1543) shipped
# `from datetime import UTC`, which exists only from Python 3.11. The Synology
# runs Python 3.8.15 (DR-0306), so the loop raised ImportError on its first line
# of real work, every cycle. CI ran its tests under 3.11 and passed. The same
# sweep found infra/nas-openers/openers.py (`set[str]`, `str | None`) dead on
# import too, shipped disabled so nobody had felt it yet.
#
# This guard runs UNDER 3.8 (it refuses any other interpreter, so a green run
# under 3.11 cannot pass for it) over every .py in infra/nas-*/:
#   1. COMPILE   -- the real 3.8 grammar (match/case, parenthesised withs, ...).
#   2. STATIC    -- forms that only fail when a line RUNS, which an import can
#                   miss (inside a function, or a try that swallows the error):
#                   datetime.UTC, zoneinfo/graphlib/tomllib, str.removeprefix /
#                   removesuffix, list[...]/dict[...]-style builtin subscripts,
#                   and `X | Y` inside an annotation.
#   3. IMPORT    -- each module (not under a dot-directory) in a fresh 3.8
#                   process, 30 s ceiling. A ModuleNotFoundError for a known
#                   third-party package (fastapi, ...) is reported as "stopped
#                   at a third-party import"; steps 1-2 still judged that file.
#
#   python3.8 scripts/nas-python38-guard.py            # the repository
#   python3.8 scripts/nas-python38-guard.py --selftest # proven to catch
# Stdlib only. Exit 1 on any finding.
# =============================================================================
import ast
import os
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMPORT_TIMEOUT = 30
REMOVED_MODULES = {"zoneinfo": "3.9", "graphlib": "3.9", "tomllib": "3.11"}
NEW_STR_METHODS = {"removeprefix": "3.9", "removesuffix": "3.9"}
BUILTIN_GENERICS = {"list", "dict", "set", "frozenset", "tuple", "type"}
# Packages the NAS installs with pip into a service's own environment; a file
# that stops at one of these was still compiled and statically checked.
THIRD_PARTY = {
    "fastapi",
    "uvicorn",
    "pydantic",
    "starlette",
    "requests",
    "psycopg2",
    "multipart",
}

IMPORT_SNIPPET = r"""
import importlib.util, os, sys
p = sys.argv[1]
sys.path.insert(0, os.path.dirname(p))
s = importlib.util.spec_from_file_location("nas_py38_guard_target", p)
m = importlib.util.module_from_spec(s)
try:
    s.loader.exec_module(m)
except ModuleNotFoundError as e:
    print("MISSING:" + str(e.name or "").split(".")[0])
    raise
"""


def nas_files(root):
    out = []
    infra = os.path.join(root, "infra")
    for d in sorted(os.listdir(infra)):
        if not d.startswith("nas-"):
            continue
        for base, dirs, files in os.walk(os.path.join(infra, d)):
            dirs[:] = sorted(x for x in dirs if x != "__pycache__")
            out.extend(
                os.path.join(base, f) for f in sorted(files) if f.endswith(".py")
            )
    return out


def _annotation_nodes(tree):
    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            a = node.args
            for arg in a.posonlyargs + a.args + a.kwonlyargs + [a.vararg, a.kwarg]:
                if arg is not None and arg.annotation is not None:
                    yield arg.annotation
            if node.returns is not None:
                yield node.returns
        elif isinstance(node, ast.AnnAssign):
            yield node.annotation


def static_findings(src, name):
    try:
        tree = ast.parse(src, name)
    except SyntaxError:
        return []  # compile() reports it
    found = []

    def add(node, msg):
        found.append(f"{name}:{getattr(node, 'lineno', 0)}: {msg}")

    for node in ast.walk(tree):
        if (
            isinstance(node, ast.ImportFrom)
            and node.module == "datetime"
            and any(a.name == "UTC" for a in node.names)
        ):
            add(node, "datetime.UTC is 3.11+; use timezone.utc")
        if isinstance(node, ast.ImportFrom) and node.module and node.level == 0:
            top = node.module.split(".")[0]
            if top in REMOVED_MODULES:
                add(node, f"module {top} is {REMOVED_MODULES[top]}+")
        if isinstance(node, ast.Import):
            for a in node.names:
                top = a.name.split(".")[0]
                if top in REMOVED_MODULES:
                    add(node, f"module {top} is {REMOVED_MODULES[top]}+")
        if isinstance(node, ast.Attribute):
            if (
                node.attr == "UTC"
                and isinstance(node.value, ast.Name)
                and node.value.id == "datetime"
            ):
                add(node, "datetime.UTC is 3.11+; use timezone.utc")
            if node.attr in NEW_STR_METHODS:
                add(node, f"str.{node.attr} is {NEW_STR_METHODS[node.attr]}+")
        if (
            isinstance(node, ast.Subscript)
            and isinstance(node.value, ast.Name)
            and node.value.id in BUILTIN_GENERICS
        ):
            add(
                node,
                f"{node.value.id}[...] is 3.9+; use typing.{node.value.id.capitalize()}",
            )
    for ann in _annotation_nodes(tree):
        for sub in ast.walk(ann):
            if isinstance(sub, ast.BinOp) and isinstance(sub.op, ast.BitOr):
                add(sub, "X | Y in an annotation is 3.10+; use typing.Optional/Union")
                break
    return found


def import_finding(path, rel):
    try:
        r = subprocess.run(
            [sys.executable, "-I", "-B", "-c", IMPORT_SNIPPET, path],
            cwd=os.path.dirname(path),
            capture_output=True,
            text=True,
            timeout=IMPORT_TIMEOUT,
            check=False,
        )
    except subprocess.TimeoutExpired:
        return f"{rel}: import did not finish in {IMPORT_TIMEOUT}s", None
    if r.returncode == 0:
        return None, None
    missing = [ln[8:] for ln in r.stdout.splitlines() if ln.startswith("MISSING:")]
    if missing and missing[0] in THIRD_PARTY:
        return (
            None,
            f"{rel}: stopped at third-party import {missing[0]} (compiled + statically checked)",
        )
    tail = (r.stderr.strip().splitlines() or [f"exit {r.returncode}"])[-1]
    return f"{rel}: import fails on {sys.version.split()[0]}: {tail}", None


def check(files, root):
    findings, notes = [], []
    for path in files:
        rel = os.path.relpath(path, root)
        with open(path, "rb") as fh:
            raw = fh.read()
        try:
            compile(raw, rel, "exec", dont_inherit=True)
        except SyntaxError as e:
            findings.append(f"{rel}:{e.lineno}: does not compile on 3.8: {e.msg}")
            continue
        findings.extend(static_findings(raw.decode("utf-8", "replace"), rel))
        if any(part.startswith(".") for part in rel.split(os.sep)):
            continue  # vendored packages: compiled and checked, not imported alone
        f, note = import_finding(path, rel)
        if f:
            findings.append(f)
        if note:
            notes.append(note)
    return findings, notes


PLANTED = {
    # name: (source, the class that must be named)
    "utc_at_import.py": (
        "from datetime import UTC, datetime\nNOW = datetime.now(UTC)\n",
        "datetime.UTC",
    ),
    "utc_in_function.py": (
        "import datetime\ndef f():\n    return datetime.UTC\n",
        "datetime.UTC",
    ),
    "generic_in_try.py": (
        "try:\n    X: set[str] = set()\nexcept Exception:\n    X = None\n",
        "set[...]",
    ),
    "pep604_in_class.py": (
        "try:\n    class M:\n        kind: str | None = None\nexcept Exception:\n    M = None\n",
        "X | Y",
    ),
    "removeprefix.py": ("def f(s):\n    return s.removeprefix('a')\n", "removeprefix"),
    "zoneinfo_lazy.py": (
        "def f():\n    import zoneinfo\n    return zoneinfo\n",
        "zoneinfo",
    ),
    "match_case.py": (
        "def f(x):\n    match x:\n        case 1:\n            return 1\n",
        "does not compile",
    ),
}
CLEAN = "from datetime import datetime, timezone\nfrom typing import Optional, Set\nX: Set[str] = set()\ndef f(s: Optional[str]) -> str:\n    return (s or '')[1:]\nNOW = datetime.now(timezone.utc)\n"


def selftest():
    ok = True
    with tempfile.TemporaryDirectory() as tmp:
        d = os.path.join(tmp, "infra", "nas-planted")
        os.makedirs(d)
        for name, (src, _) in PLANTED.items():
            with open(os.path.join(d, name), "w") as fh:
                fh.write(src)
        with open(os.path.join(d, "clean.py"), "w") as fh:
            fh.write(CLEAN)
        findings, _ = check(nas_files(tmp), tmp)
        for name, (_, cls) in PLANTED.items():
            hit = [f for f in findings if name in f and cls in f]
            print(("CAUGHT  " if hit else "MISSED  ") + name + " -> " + cls)
            ok = ok and bool(hit)
        dirty = [f for f in findings if "clean.py" in f]
        print(
            ("CLEAN   " if not dirty else "FALSE+  ")
            + "clean.py"
            + ("" if not dirty else " " + "; ".join(dirty))
        )
        ok = ok and not dirty
    print("selftest: " + ("PASS" if ok else "FAIL"))
    return 0 if ok else 1


def main(argv):
    if sys.version_info[:2] != (3, 8):
        print(
            f"nas-python38-guard: must run under Python 3.8 (the NAS's), not {sys.version.split()[0]}"
        )
        return 2
    if "--selftest" in argv:
        return selftest()
    files = nas_files(ROOT)
    findings, notes = check(files, ROOT)
    for n in notes:
        print("note: " + n)
    for f in findings:
        print("FAIL: " + f)
    print(
        f"nas-python38-guard: {len(files)} files on {sys.version.split()[0]}, {len(findings)} finding(s)"
    )
    return 1 if findings else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

#!/usr/bin/env python3
# =============================================================================
# persistent-share.py — the deterministic "how firm is the app" counter.
# =============================================================================
# Darrell (2026-07-01, approved): track the share of the repo that is the
# tried-and-trusted PERSISTENT layer (SQL + Python + shell/PowerShell + CI
# guards) vs the frontend/monolith share. As we migrate loops off n8n onto
# Python/SQL and land new migrations, the persistent share climbs and the
# frontend share drops — that is the visible signal of the app "firming up."
#
# DOGFOOD + LANGUAGE RULE: this counter is Python (our persistent language),
# NOT JavaScript, and NOT an LLM. It is pure and deterministic — `git ls-files`,
# bucket by extension/path, count lines, write the percentages to a JSON the
# board reads. Same number every run for the same tree, so the metric is
# trustworthy (DR-0076: measure, don't claim). The app never recomputes this;
# it reads the committed JSON, exactly like legibility-health.json.
#
# BUCKETS (calibrated 2026-07-01 to Darrell's baseline 12.6% — SQL 6.5%,
# Python 0.4%, shell/PS/CI ~5.5%; frontend ~48.9%, config+docs ~38.5%):
#   PERSISTENT  = *.sql | *.py | *.sh/*.ps1/*.bash | *.mjs under scripts/ |
#                 *.yml/*.yaml under .github/   (the CI guards)
#   FRONTEND    = *.jsx/*.tsx/*.ts/*.css/*.scss/*.html | *.js
#   CONFIG_DOCS = everything else (*.md, *.json, config, assets, ...)
#
# Also emits the MODULE-LEDGER signal (monolith line count vs the frozen budget)
# so the same rollup shows the monolith shrinking as extractions land — the
# module-ledger lane's real artifact (scripts/monolith-budget.json), read here.
#
# Usage:
#   python scripts/persistent-share.py           # regenerate the JSON
#   python scripts/persistent-share.py --check    # print + non-zero if JSON stale
#
# Output: app/src/lib/persistent-share.json  (committed; the board imports it)
# =============================================================================
import json
import os
import subprocess
import sys
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "app", "src", "lib", "persistent-share.json")
BUDGET = os.path.join(ROOT, "scripts", "monolith-budget.json")
MONOLITH = os.path.join(ROOT, "app", "src", "poe-financial-mvp-v28.jsx")

BASELINE_PCT = 12.6   # Darrell's measured baseline, 2026-07-01 (fixed reference)
TARGET_PCT = 20.0     # initial firm-up target as loops migrate (adjustable)


def tracked_files():
    out = subprocess.run(
        ["git", "ls-files"], cwd=ROOT, capture_output=True, text=True, check=True
    ).stdout
    return [p for p in out.splitlines() if p]


def count_lines(path):
    full = os.path.join(ROOT, path)
    try:
        if os.path.getsize(full) == 0:
            return 0
        with open(full, "rb") as f:
            data = f.read()
        # wc -l semantics + a final non-newline-terminated line counts as one.
        n = data.count(b"\n")
        if not data.endswith(b"\n"):
            n += 1
        return n
    except OSError:
        return 0


def bucket(path):
    p = path.replace("\\", "/")
    ext = p.rsplit(".", 1)[-1].lower() if "." in os.path.basename(p) else ""
    if ext == "sql":
        return "sql"
    if ext == "py":
        return "python"
    if ext in ("sh", "ps1", "bash"):
        return "shell_ps"
    if ext == "mjs" and p.startswith("scripts/"):
        return "ci"
    if ext in ("yml", "yaml") and p.startswith(".github/"):
        return "ci"
    if ext in ("jsx", "tsx", "ts", "css", "scss", "html") or ext == "js":
        return "frontend"
    return "config_docs"


def pct(n, total):
    return round(100.0 * n / total, 2) if total else 0.0


def compute():
    files = tracked_files()
    lines = {}
    fcount = {}
    total = 0
    for p in files:
        n = count_lines(p)
        total += n
        b = bucket(p)
        lines[b] = lines.get(b, 0) + n
        fcount[b] = fcount.get(b, 0) + 1

    persistent_lines = (
        lines.get("sql", 0) + lines.get("python", 0)
        + lines.get("shell_ps", 0) + lines.get("ci", 0)
    )
    frontend_lines = lines.get("frontend", 0)
    config_lines = lines.get("config_docs", 0)

    monolith_lines = count_lines(os.path.relpath(MONOLITH, ROOT))
    frozen = None
    try:
        with open(BUDGET, "r", encoding="utf-8") as f:
            frozen = json.load(f).get("budget")
    except OSError:
        frozen = None

    return {
        "totalLines": total,
        "totalFiles": len(files),
        "persistentPct": pct(persistent_lines, total),
        "persistentLines": persistent_lines,
        "sub": {
            "sql": pct(lines.get("sql", 0), total),
            "python": pct(lines.get("python", 0), total),
            "shellPs": pct(lines.get("shell_ps", 0), total),
            "ci": pct(lines.get("ci", 0), total),
        },
        "frontendPct": pct(frontend_lines, total),
        "configDocsPct": pct(config_lines, total),
        "baselinePct": BASELINE_PCT,
        "targetPct": TARGET_PCT,
        "moduleLedger": {
            "monolithLines": monolith_lines,
            "frozenBudget": frozen,
        },
    }


def read_existing():
    try:
        with open(OUT, "r", encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return None


def main():
    check = "--check" in sys.argv
    result = compute()

    prev = read_existing()
    # Trend = current vs the LAST committed run (Darrell's "up/down since last run").
    # First run has no prior → previous = current (flat).
    prev_pct = prev.get("persistentPct") if prev else None
    result["previousPct"] = prev_pct if prev_pct is not None else result["persistentPct"]

    if check:
        cur = prev.get("persistentPct") if prev else None
        fresh = result["persistentPct"]
        print(f"persistent-share: committed={cur} fresh={fresh} "
              f"target={TARGET_PCT} baseline={BASELINE_PCT}")
        if cur is None or abs(cur - fresh) > 0.01:
            print("persistent-share: JSON is STALE — run `python scripts/persistent-share.py`")
            return 1
        print("persistent-share: OK — committed JSON matches the tree.")
        return 0

    result["generatedAt"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)
        f.write("\n")
    print(f"persistent-share: wrote {os.path.relpath(OUT, ROOT)} — "
          f"persistent {result['persistentPct']}% "
          f"(sql {result['sub']['sql']}%, python {result['sub']['python']}%, "
          f"shell/ps {result['sub']['shellPs']}%, ci {result['sub']['ci']}%), "
          f"frontend {result['frontendPct']}%, monolith "
          f"{result['moduleLedger']['monolithLines']} lines.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

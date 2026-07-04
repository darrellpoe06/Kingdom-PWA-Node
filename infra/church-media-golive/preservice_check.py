#!/usr/bin/env python3
"""preservice_check — Sunday GO/NO-GO, run by a human about an hour before service.

Reports; never changes anything. Checks whatever exists on the machine it runs on:
  disk free, GPU (nvidia-smi if present), tailnet peers (tailscale if present),
  and reachability of the targets in preservice_targets.json (optional file:
  {"targets": [{"name": "NAS", "host": "192.168.1.26"}, ...]}).

Usage: python preservice_check.py
Exit code 0 = all GO; 1 = at least one NO-GO (read the table).
"""
import json
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

RUN_EVENTS = Path(__file__).with_name("events.jsonl")
TARGETS_FILE = Path(__file__).with_name("preservice_targets.json")


def run(cmd, timeout=10):
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return r.returncode == 0, (r.stdout or r.stderr).strip()
    except FileNotFoundError:
        return None, "not installed"
    except subprocess.TimeoutExpired:
        return False, "timed out"


def main():
    checks = []

    total, _, free = shutil.disk_usage(Path.home())
    free_gb = free / 1e9
    checks.append(("Disk free", free_gb > 20, f"{free_gb:.0f} GB free"))

    ok, out = run(["nvidia-smi", "--query-gpu=name,temperature.gpu,utilization.gpu",
                   "--format=csv,noheader"])
    if ok is not None:
        checks.append(("GPU", bool(ok), out.splitlines()[0] if out else "no output"))

    ok, out = run(["tailscale", "status", "--json"])
    if ok:
        peers = json.loads(out).get("Peer", {}) or {}
        online = sum(1 for p in peers.values() if p.get("Online"))
        checks.append(("Tailnet", True, f"{online}/{len(peers)} peers online"))
    elif ok is not None:
        checks.append(("Tailnet", False, "tailscale not responding"))

    if TARGETS_FILE.exists():
        for t in json.loads(TARGETS_FILE.read_text()).get("targets", []):
            flag = "-n" if sys.platform == "win32" else "-c"
            ok, _ = run(["ping", flag, "1", t["host"]], timeout=8)
            checks.append((f"Reach {t['name']}", bool(ok), t["host"]))

    all_go = all(ok for _, ok, _ in checks)
    print(f"\nPRE-SERVICE CHECK — {datetime.now().strftime('%a %b %d %I:%M %p')}\n" + "-" * 46)
    for name, ok, detail in checks:
        print(f"  {'GO   ' if ok else 'NO-GO'}  {name:<14} {detail}")
    print("-" * 46)
    print("  ALL GO — have a great service. Wall = PRESET 1." if all_go
          else "  NO-GO above — fix or escalate before doors open.")

    with RUN_EVENTS.open("a") as ev:
        ev.write(json.dumps({"at": datetime.now(timezone.utc).isoformat(),
                             "script": "preservice_check", "ok": all_go,
                             "processed": len(checks),
                             "note": "; ".join(f"{n}:{'GO' if o else 'NO'}" for n, o, _ in checks)}) + "\n")
    return 0 if all_go else 1


if __name__ == "__main__":
    sys.exit(main())

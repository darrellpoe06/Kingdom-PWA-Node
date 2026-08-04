#!/usr/bin/env python3
# =============================================================================
# funnel_watchdog.py — sovereign-Python detect + bounded restore for the Funnel
# =============================================================================
# RECORDED-STATE: infra/nas-transport/RECORDED-STATE.md
#
# Born 2026-08-03 (DR-0268): site-health measured HTTP 525 on the photo/history
# hops at 22:11 AND 22:56 UTC — the public Funnel endpoint failing TLS while
# the site stayed green. Every app->NAS transport rides this one hop; nothing
# watched or restored it. Python per the Ways (DR-0083/DR-0132; Darrell
# 2026-08-03: "python?") — the .sh sibling is a thin shim, the scribe pattern.
#
# CONFORMANCE to the recorded baseline (the transport rules, DR-0250):
#   * FUNNEL, never `serve`; full DSM binary path (the CLI is not on the
#     non-login SSH PATH — diagnostic 30507928325).
#   * Restores ONLY the SOVEREIGN recorded rows (/mcp, /nas-photos) via
#     `funnel --bg --set-path` — additive, reversible. NEVER touches the n8n
#     root row `/` (DR-0218: we do not prop up what we are removing).
#   * Escalation is bounded: mounts re-asserted first; ONE synopkg restart of
#     the Tailscale package only if the endpoint is still dark after that;
#     never more per fire. Budget + single-flight live in the runner registry.
#
# Exit 0 = funnel answering (silent ok, or healed and says so).
# Exit 1 = still dark after the bounded restore — the runner writes loop_fail
#          + ntfy; the report names the by-hand line. Never silent.
import json
import os
import subprocess
import sys
import time
import urllib.request

FUNNEL_HOST = os.environ.get("FUNNEL_HOST", "https://poetech.tail5a2f35.ts.net")
PROBE_PATH = os.environ.get("FUNNEL_PROBE_PATH", "/nas-photos/healthz")
TIMEOUT = int(os.environ.get("FUNNEL_TIMEOUT", "10"))

# The SOVEREIGN rows of the recorded baseline (RECORDED-STATE.md table) — the
# only rows this watchdog may restore. The legacy n8n root is deliberately
# absent. Keep this list in lockstep with the file it cites.
SOVEREIGN_MOUNTS = [
    ("/mcp", "http://127.0.0.1:8795"),
    ("/nas-photos", "http://127.0.0.1:8099"),
]

TS_CANDIDATES = ["/var/packages/Tailscale/target/bin/tailscale", "tailscale"]
SYNOPKG = "/usr/syno/bin/synopkg"


def probe(url):
    """Return the HTTP status code, or 0 on any transport/TLS failure."""
    try:
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            return resp.status
    except urllib.error.HTTPError as e:
        return e.code  # an HTTP answer (401/404/...) means the funnel is UP
    except Exception:
        return 0


def tailscale_bin():
    for c in TS_CANDIDATES:
        if os.path.sep in c and os.access(c, os.X_OK):
            return c
        try:
            subprocess.run([c, "version"], capture_output=True, timeout=10)
            return c
        except Exception:
            continue
    return None


def run(cmd, timeout=30):
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return r.returncode, (r.stdout or "") + (r.stderr or "")
    except Exception as e:
        return 1, str(e)


def restore_sovereign_mounts(ts):
    """Rule 1 restore: re-assert each sovereign recorded row, additively."""
    for path, backend in SOVEREIGN_MOUNTS:
        code, out = run([ts, "funnel", "--bg", "--set-path", path, backend], timeout=30)
        state = "ok" if code == 0 else f"FAILED rc={code}"
        print(f"funnel-watchdog: re-assert {path} -> {backend}: {state}")
        if code != 0 and out.strip():
            print("  " + out.strip().splitlines()[-1][:200])


def main():
    url = FUNNEL_HOST + PROBE_PATH
    code = probe(url)
    if code:
        print(f"funnel-watchdog: funnel OK (HTTP {code} from {PROBE_PATH})")
        return 0

    print(f"funnel-watchdog: funnel DARK (no TLS/HTTP answer from {url})")
    ts = tailscale_bin()
    if not ts:
        print("funnel-watchdog: tailscale binary not found (PATH + DSM package path) — reporting only")
        print("  by hand: sudo /var/packages/Tailscale/target/bin/tailscale funnel status")
        return 1

    rc, status = run([ts, "funnel", "status"], timeout=20)
    for line in status.strip().splitlines()[:15]:
        print("  " + line[:200])

    # Step 1 (rule 1): re-assert the sovereign mounts — additive + reversible;
    # this also re-enables funnel serving when the config was lost/disabled.
    restore_sovereign_mounts(ts)
    time.sleep(10)
    code = probe(url)
    if code:
        print(f"funnel-watchdog: HEALED by mount re-assert (HTTP {code})")
        return 0

    # Step 2 (bounded escalation): ONE package restart, then re-assert again.
    if os.access(SYNOPKG, os.X_OK):
        print("funnel-watchdog: still dark — ONE Tailscale package restart")
        rc, out = run([SYNOPKG, "restart", "Tailscale"], timeout=90)
        if rc != 0:
            print(f"funnel-watchdog: synopkg restart rc={rc}")
        time.sleep(25)
        restore_sovereign_mounts(ts)
        time.sleep(10)
        code = probe(url)
        if code:
            print(f"funnel-watchdog: HEALED after package restart (HTTP {code})")
            return 0
    else:
        print("funnel-watchdog: no synopkg on this host — package restart skipped")

    print("funnel-watchdog: STILL DARK after the bounded restore — human eyes needed")
    print("  by hand: sudo /var/packages/Tailscale/target/bin/tailscale funnel status")
    return 1


if __name__ == "__main__":
    sys.exit(main())

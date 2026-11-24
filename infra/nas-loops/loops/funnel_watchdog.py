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
# DR-1619 (2026-11-24, Darrell: "Find another way!!!!! Sovereign!!!!!"): the
# watchdog was BLIND to the outage it exists for. It probed its own Funnel
# hostname FROM the NAS, which MagicDNS resolves to the box's own tailnet
# address (the public ingress is never touched), and it counted ANY HTTP code,
# a 502 included, as "UP". On 2026-11-24 the public road answered 502 to every
# runner for hours while this said "funnel OK". It now:
#   * judges by the PUBLIC road the family rides (poetech.us -> Cloudflare ->
#     Funnel -> this box); only a 2xx-4xx answer is up, 5xx/no answer is dark;
#   * restores EVERY recorded row (RECORDED-STATE), /sb (sign-in) included;
#   * brings a Stopped Tailscale back up, and a NeedsLogin one when a key file
#     is on the box (never a key in the repo);
#   * spaces its one package restart to once an hour (a Cloudflare-side fault
#     must not restart Tailscale every cycle);
#   * REPORTS OUT: when dark, and when it heals, it sends its own Tailscale
#     and Funnel state to GitHub (repository_dispatch, the lesson builder's
#     existing token), so the state can be read without the tailnet.
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
# The road the family actually rides (DR-1619). kong answers this keyless with
# its own 401 when the box is reachable; Cloudflare answers 502 when it is not.
PUBLIC_PROBES = [
    u
    for u in os.environ.get(
        "FUNNEL_PUBLIC_PROBES", "https://poetech.us/sb/auth/v1/health"
    ).split(",")
    if u.strip()
]
STATE_PATH = os.environ.get(
    "FUNNEL_STATE", "/volume1/PoeTech/nas-loops/state/funnel-watchdog.json"
)
TS_AUTHKEY_FILE = os.environ.get(
    "FUNNEL_TS_AUTHKEY_FILE", "/volume1/PoeTech/secrets/tailscale-authkey.txt"
)
GH_TOKEN_FILE = os.environ.get(
    "FUNNEL_GH_TOKEN_FILE", "/volume1/PoeTech/secrets/github-token.txt"
)
GH_REPO = os.environ.get("FUNNEL_GH_REPO", "darrellpoe06/Kingdom-PWA-Node")
REPORT_EVENT = "nas-funnel-report"
RESTART_SPACING = int(
    os.environ.get("FUNNEL_RESTART_SPACING", "3600")
)  # one package restart an hour, at most
REPORT_SPACING = int(
    os.environ.get("FUNNEL_REPORT_SPACING", "1800")
)  # one dark report per 30 min; a heal always reports

# The SOVEREIGN rows of the recorded baseline (RECORDED-STATE.md table) — the
# only rows this watchdog may restore. The legacy n8n root is deliberately
# absent. Keep this list in lockstep with the file it cites.
SOVEREIGN_MOUNTS = [
    ("/mcp", "http://127.0.0.1:8795"),
    ("/nas-photos", "http://127.0.0.1:8099"),
    # /taxes added 2026-09-06 (DR-0330). The install-day mount is not enough on
    # its own: a Funnel reset or a reboot drops it, and the only symptom is a
    # tax upload that says "could not reach the NAS upload service" weeks later
    # with nothing pointing at the transport. Healing it here is what makes the
    # route durable rather than merely once-correct.
    ("/taxes", "http://127.0.0.1:8790"),
    # /research added 2026-10-18 (DR-1101): the same reason as /taxes -- a
    # Funnel reset drops the mount and the only symptom is a question that
    # never answers.
    ("/research", "http://127.0.0.1:8797"),
    # /photo-backup added 2026-10-19 (DR-1120): the phones' background backup
    # door; a dropped mount is a phone that silently stops backing up.
    ("/photo-backup", "http://127.0.0.1:8803"),
    # /libraries added 2026-10-19 (DR-1121): the health door of the video and
    # audio libraries (the servers themselves are on the tailnet, not here).
    ("/libraries", "http://127.0.0.1:8802"),
    # DR-1619: the rows the 2026-11-24 outage actually hurt were never here.
    # /sb is sign-in itself; a Funnel reset that drops it locks the family out
    # and nothing restored it between services-sync installs.
    ("/sb", "http://127.0.0.1:8800"),
    ("/announce", "http://127.0.0.1:8796"),
    ("/cams", "http://127.0.0.1:8773"),
    ("/voice", "http://127.0.0.1:8771"),
    ("/voice-lite", "http://127.0.0.1:8772"),
    ("/scribe", "http://127.0.0.1:8791"),
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
        return e.code
    except Exception:
        return 0


def is_up(code):
    """An answer from the backend (2xx-4xx; kong's keyless 401 included) is up.
    A 5xx is the proxy in front saying it could not reach us; 0 is no answer.
    The old rule counted any code as up, which read a 502 as healthy."""
    return 200 <= int(code or 0) < 500


def public_codes(probe_fn=None, urls=None):
    probe_fn = probe_fn or probe
    return {u: probe_fn(u) for u in (urls if urls is not None else PUBLIC_PROBES)}


def public_up(codes):
    """Up only when EVERY public probe answered from the backend."""
    return bool(codes) and all(is_up(c) for c in codes.values())


def load_state(path=None):
    try:
        with open(path or STATE_PATH) as f:
            return json.load(f)
    except (OSError, ValueError):
        return {}


def save_state(state, path=None):
    path = path or STATE_PATH
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w") as f:
            json.dump(state, f)
    except OSError as e:  # never fail the watchdog over its own memory
        print("funnel-watchdog: could not save state: " + str(e))


def restart_allowed(state, now):
    return now - float(state.get("last_restart", 0) or 0) >= RESTART_SPACING


def report_due(state, now, result):
    """A heal always reports; a dark reading reports at most every REPORT_SPACING."""
    if result == "healed":
        return True
    if result != "dark":
        return False
    return now - float(state.get("last_report", 0) or 0) >= REPORT_SPACING


def backend_state(ts):
    _, out = run([ts, "status", "--json"], timeout=20)
    try:
        return json.loads(out).get("BackendState") or "unknown"
    except (ValueError, AttributeError):
        return "unreadable"


EXPIRY_WARN_DAYS = int(os.environ.get("FUNNEL_EXPIRY_WARN_DAYS", "21"))


def key_expiry_days(ts, now=None):
    """Days until this box's own tailnet key expires, read from the box itself
    (`tailscale status --json` -> Self.KeyExpiry). None = no expiry set (the
    wanted state) or unreadable. THE WARNING BEFORE THE LOCKOUT (DR-1624): a
    node key lapses silently and takes every road down with it; the box now
    counts its own days and says so three weeks ahead."""
    _, out = run([ts, "status", "--json"], timeout=20)
    return expiry_days_of(out, now)


def expiry_days_of(status_json, now=None):
    try:
        raw = (json.loads(status_json).get("Self") or {}).get("KeyExpiry")
        if not raw:
            return None
        # 2026-11-23T21:40:11Z or with fractional seconds / an offset
        stamp = raw.replace("Z", "+00:00")
        if "." in stamp:
            head, _, tail = stamp.partition(".")
            zone = tail[tail.find("+") :] if "+" in tail else ""
            stamp = head + zone
        import datetime as _dt  # noqa: PLC0415

        when = _dt.datetime.fromisoformat(stamp)
        if when.tzinfo is None:
            when = when.replace(tzinfo=_dt.timezone.utc)  # noqa: UP017 -- the NAS runs Python 3.8
        return int(
            (when.timestamp() - (now if now is not None else time.time())) // 86400
        )
    except (ValueError, AttributeError, TypeError):
        return None


def expiry_warning_due(state, now, days):
    """One warning a day while the key is inside the warning window."""
    if days is None or days > EXPIRY_WARN_DAYS:
        return False
    return now - float(state.get("last_expiry_warning", 0) or 0) >= 86400


def bring_up(ts, state_name, key_file=None):
    """Stopped -> `up`; NeedsLogin -> `up --authkey` ONLY with a key file on the
    box. Returns a word for the report. Never prints the key."""
    key_file = key_file or TS_AUTHKEY_FILE
    if state_name == "Stopped":
        rc, _ = run([ts, "up"], timeout=60)
        return "up rc=" + str(rc)
    if state_name == "NeedsLogin":
        try:
            with open(key_file) as f:
                key = f.read().strip()
        except OSError:
            return "needs-login, no key file at " + key_file
        if not key:
            return "needs-login, key file empty"
        rc, _ = run([ts, "up", "--authkey=" + key], timeout=60)
        return "up --authkey rc=" + str(rc)
    return "none"


def report_payload(result, bstate, codes, local_code, actions, status_text):
    return {
        "source": "nas-funnel-watchdog",
        "result": result,
        "backend_state": bstate,
        "public": {u: int(c or 0) for u, c in codes.items()},
        "local_code": int(local_code or 0),
        "actions": actions[:12],
        "funnel_status": (status_text or "")[:1500],
        # Darrell 2026-11-24: "The compute keeps restarting". Seconds since the
        # box last booted: a small number on every report means it is rebooting.
        "uptime_s": uptime_seconds(),
        "head": checkout_head(),
    }


def uptime_seconds(path="/proc/uptime"):
    try:
        with open(path) as f:
            return int(float(f.read().split()[0]))
    except (OSError, ValueError, IndexError):
        return -1


def send_report(payload, token_file=None, repo=None, opener=None):
    """One repository_dispatch to GitHub (the lesson builder's road). Returns
    (ok, code-or-reason). Never raises, never prints the token."""
    try:
        with open(token_file or GH_TOKEN_FILE) as f:
            token = f.read().strip()
    except OSError:
        return False, "no push credential"
    body = json.dumps({"event_type": REPORT_EVENT, "client_payload": payload}).encode(
        "utf-8"
    )
    req = urllib.request.Request(
        f"https://api.github.com/repos/{repo or GH_REPO}/dispatches",
        data=body,
        method="POST",
    )
    req.add_header("Authorization", "Bearer " + token)
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("Content-Type", "application/json")
    try:
        with (opener or urllib.request.urlopen)(req, timeout=15) as r:
            code = getattr(r, "status", None) or r.getcode()
            return code == 204, code
    except Exception as e:  # noqa: BLE001
        return False, getattr(e, "code", None) or type(e).__name__


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


def restore_sovereign_mounts(ts, budget_s=90):
    """Rule 1 restore: re-assert each sovereign recorded row, additively.
    BOUNDED (DR-1624): each call gets 10 s and the whole pass `budget_s`, so a
    hung tailscale CLI can never eat the rider's 480 s and kill the watchdog
    before it reports. Returns how many rows were tried."""
    started = time.time()
    done = 0
    for path, backend in SOVEREIGN_MOUNTS:
        if time.time() - started > budget_s:
            print(
                f"funnel-watchdog: restore budget of {budget_s}s spent after {done} rows, stopping"
            )
            break
        code, out = run([ts, "funnel", "--bg", "--set-path", path, backend], timeout=10)
        state = "ok" if code == 0 else f"FAILED rc={code}"
        print(f"funnel-watchdog: re-assert {path} -> {backend}: {state}")
        if code != 0 and out.strip():
            print("  " + out.strip().splitlines()[-1][:200])
        done += 1
    return done


def checkout_head(repo=None):
    """The commit this box is running, so a report says whether the mirror pulled."""
    repo = repo or os.environ.get(
        "POETECH_REPO", "/volume1/PoeTech/repos/Kingdom-PWA-Node"
    )
    try:
        with open(os.path.join(repo, ".git", "HEAD")) as f:
            head = f.read().strip()
        if head.startswith("ref: "):
            with open(os.path.join(repo, ".git", head[5:])) as f:
                head = f.read().strip()
        return head[:9]
    except OSError:
        return "unknown"


def main():
    now = time.time()
    state = load_state()
    local_code = probe(
        FUNNEL_HOST + PROBE_PATH
    )  # diagnostic only: resolves to this box
    codes = public_codes()
    if public_up(codes):
        was_dark = state.get("dark_since")
        print(
            "funnel-watchdog: public road OK "
            + json.dumps(codes)
            + " (local "
            + str(local_code)
            + ")"
        )
        if was_dark:
            state.pop("dark_since", None)
            ok, why = send_report(
                report_payload(
                    "healed",
                    "Running",
                    codes,
                    local_code,
                    ["public road answered again"],
                    "",
                )
            )
            print("funnel-watchdog: reported recovery to GitHub: " + str(why))
        ts_ok = tailscale_bin()
        days = key_expiry_days(ts_ok, now) if ts_ok else None
        if expiry_warning_due(state, now, days):
            ok, why = send_report(
                report_payload(
                    "expiring",
                    "Running",
                    codes,
                    local_code,
                    ["this box's tailnet key expires in " + str(days) + " day(s)"],
                    "",
                )
            )
            print("funnel-watchdog: key-expiry warning to GitHub: " + str(why))
            if ok:
                state["last_expiry_warning"] = now
        save_state(state)
        return 0

    print(
        "funnel-watchdog: PUBLIC road DARK "
        + json.dumps(codes)
        + " (local "
        + str(local_code)
        + ")"
    )
    state.setdefault("dark_since", now)
    actions = []
    ts = tailscale_bin()
    if not ts:
        print(
            "funnel-watchdog: tailscale binary not found (PATH + DSM package path) — reporting only"
        )
        actions.append("no tailscale binary")
        status = ""
        bstate = "no-binary"
    else:
        bstate = backend_state(ts)
        print("funnel-watchdog: tailscale BackendState=" + bstate)
        _, status = run([ts, "funnel", "status"], timeout=10)
        # REPORT FIRST, HEAL SECOND (DR-1624). The first version reported only
        # after the heal; with Tailscale down the heal could outlive the rider's
        # 480 s and the box, alive and online, said nothing for twelve hours.
        if report_due(state, now, "dark"):
            ok, why = send_report(
                report_payload(
                    "dark",
                    bstate,
                    codes,
                    local_code,
                    ["first reading, before any heal"],
                    status,
                )
            )
            print(
                "funnel-watchdog: first report to GitHub: "
                + ("sent" if ok else "NOT sent")
                + " ("
                + str(why)
                + ")"
            )
            if ok:
                state["last_report"] = now
                save_state(state)
        if bstate in ("Stopped", "NeedsLogin"):
            word = bring_up(ts, bstate)
            actions.append("bring-up: " + word)
            print("funnel-watchdog: bring-up " + word)
        for line in status.strip().splitlines()[:15]:
            print("  " + line[:200])
        # Step 1 (rule 1): re-assert every recorded row — additive + reversible;
        # this also re-enables funnel serving when the config was lost/disabled.
        # Skipped while the node is not Running: no mount can be set on a node
        # that is logged out, and each attempt would only hang.
        bstate = backend_state(ts)
        if bstate == "Running":
            actions.append(
                "re-asserted " + str(restore_sovereign_mounts(ts)) + " recorded rows"
            )
        else:
            actions.append("mounts not re-asserted: tailscale is " + bstate)
        time.sleep(10)
        codes = public_codes()
        if public_up(codes):
            print(
                "funnel-watchdog: HEALED by bring-up / mount re-assert "
                + json.dumps(codes)
            )
            result = "healed"
        elif os.access(SYNOPKG, os.X_OK) and restart_allowed(state, now):
            # Step 2 (bounded escalation): ONE package restart an hour, then re-assert.
            print("funnel-watchdog: still dark — ONE Tailscale package restart")
            rc2, _ = run([SYNOPKG, "restart", "Tailscale"], timeout=90)
            state["last_restart"] = now
            actions.append("package restart rc=" + str(rc2))
            time.sleep(25)
            if backend_state(ts) == "Running":
                restore_sovereign_mounts(ts)
            time.sleep(10)
            codes = public_codes()
            result = "healed" if public_up(codes) else "dark"
            if result == "healed":
                print(
                    "funnel-watchdog: HEALED after package restart " + json.dumps(codes)
                )
        else:
            actions.append(
                "package restart held (spacing "
                + str(RESTART_SPACING)
                + "s or no synopkg)"
            )
            result = "dark"
        if result == "dark":
            bstate = backend_state(ts)
    result = "healed" if (ts and public_up(codes)) else "dark"
    if result == "healed":
        state.pop("dark_since", None)
    if result == "healed" or actions:
        ok, why = send_report(
            report_payload(result, bstate, codes, local_code, actions, status)
        )
        print(
            "funnel-watchdog: report to GitHub: "
            + ("sent" if ok else "NOT sent")
            + " ("
            + str(why)
            + ")"
        )
        if ok:
            state["last_report"] = now
    save_state(state)
    if result == "healed":
        return 0
    print(
        "funnel-watchdog: STILL DARK after the bounded restore — the report names the state"
    )
    print("  by hand: sudo /var/packages/Tailscale/target/bin/tailscale funnel status")
    return 1


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""claude_login.py -- sign the Claude Code CLI in on THIS machine with no browser.

The NAS lesson builder's primary writer (DR-0669, cli-local) needs the CLI
signed in as dpoe. The CLI's login opens a browser; the NAS has none. Darrell,
2026-10-01: "You do it... cli... ssh". So this drives `claude auth login` under a
pseudo-terminal from the runner's SSH road (nas-claude-login.yml):

  start           run the login in the background; it prints the sign-in URL
                  into the log and waits for the code
  status          print the log (the URL) and `claude auth status`
  code <code>     hand the pasted code to the waiting login, then print status

Only the sign-in URL and the one-time code pass through here; no password,
no token is printed or stored by this script (the CLI keeps its own
credentials in the signed-in user's home, as it does on any machine).
"""
import json
import os
import pty
import re
import select
import signal
import subprocess
import sys
import time

HOME = os.path.expanduser("~")
CLI = os.path.join(HOME, ".local", "bin", "claude")
LOG = "/tmp/claude-login.out"
CODE = "/tmp/claude-login.code"
PID = "/tmp/claude-login.pid"
ANSI = re.compile(rb"\x1b\[[0-9;?]*[ -/]*[@-~]|\x1b\][^\x07]*\x07|\r")


def _kill_old():
    try:
        pid = int(open(PID).read().strip())
        os.kill(pid, signal.SIGTERM)
        time.sleep(0.5)
    except (OSError, ValueError):
        pass
    for p in (PID, CODE):
        try:
            os.unlink(p)
        except OSError:
            pass


def start():
    _kill_old()
    if not os.access(CLI, os.X_OK):
        print("claude is not installed at", CLI)
        return 2
    open(LOG, "wb").close()
    pid = os.fork()
    if pid:
        with open(PID, "w") as f:
            f.write(str(pid))
        print("login started; run `status` for the sign-in URL")
        return 0
    os.setsid()
    # Let go of the ssh session's pipes: the daemon inherited them, and ssh
    # waits for every holder to close before it returns, so the workflow's
    # `start` step hung for its whole timeout on the first run (2026-10-01).
    devnull = os.open(os.devnull, os.O_RDWR)
    for n in (0, 1, 2):
        os.dup2(devnull, n)
    if devnull > 2:
        os.close(devnull)
    child, fd = pty.fork()
    if child == 0:
        os.environ["TERM"] = "dumb"
        os.environ.pop("ANTHROPIC_API_KEY", None)
        os.execv(CLI, [CLI, "auth", "login", "--claudeai"])
    sent = False
    deadline = time.time() + 1800
    with open(LOG, "ab", 0) as log:
        while time.time() < deadline:
            r, _, _ = select.select([fd], [], [], 1.0)
            if r:
                try:
                    data = os.read(fd, 4096)
                except OSError:
                    break
                if not data:
                    break
                log.write(data)
            if not sent and os.path.exists(CODE):
                code = open(CODE).read().strip()
                os.unlink(CODE)
                if code:
                    os.write(fd, (code + "\n").encode())
                    log.write(b"\n[code handed to the login]\n")
                    sent = True
        try:
            os.waitpid(child, 0)
        except OSError:
            pass
    os._exit(0)


def _log_text():
    try:
        raw = open(LOG, "rb").read()
    except OSError:
        return ""
    return ANSI.sub(b"", raw).decode("utf-8", "replace")


def status():
    text = _log_text()
    urls = re.findall(r"https://\S+", text)
    print("----- login output -----")
    print(text[-3000:] if text else "(no login output yet)")
    print("----- end -----")
    if urls:
        print("SIGN-IN URL:", urls[-1])
    try:
        r = subprocess.run([CLI, "auth", "status", "--json"], capture_output=True, timeout=40)
        out = r.stdout.decode("utf-8", "replace").strip()
        print("auth status:", out or r.stderr.decode("utf-8", "replace").strip(), "(exit {})".format(r.returncode))
        try:
            if json.loads(out).get("loggedIn") is True:
                print("SIGNED IN")
        except ValueError:
            pass
    except Exception as e:  # noqa: BLE001
        print("auth status could not run:", e)
    return 0


def code(value):
    with open(CODE, "w") as f:
        f.write(value.strip())
    for _ in range(90):
        time.sleep(1)
        if "SIGNED IN" in _check():
            break
    return status()


def _check():
    try:
        r = subprocess.run([CLI, "auth", "status", "--json"], capture_output=True, timeout=40)
        return "SIGNED IN" if json.loads(r.stdout.decode("utf-8", "replace") or "{}").get("loggedIn") is True else ""
    except Exception:  # noqa: BLE001
        return ""


if __name__ == "__main__":
    step = sys.argv[1] if len(sys.argv) > 1 else "status"
    if step == "start":
        sys.exit(start())
    if step == "code":
        sys.exit(code(sys.argv[2] if len(sys.argv) > 2 else ""))
    sys.exit(status())

#!/usr/bin/env python3
# =============================================================================
# cf_tunnel.py — the NAS's second road out: a Cloudflare Tunnel (DR-1653)
# =============================================================================
# Decided in DR-1622 ("No outside system is the only door") after the
# 2026-11-23 and 2026-11-24 lockouts: both times the NAS was up and running
# but its Tailscale login lapsed, the Funnel closed, and sign-in, The Word,
# photos and cameras went dark together because the Funnel was the ONLY road.
#
# A Cloudflare Tunnel is dialled OUT by the NAS (nothing at home accepts calls
# in), so it is NAS-initiated like every road since DR-1360. It does not make
# the house depend on Cloudflare instead: Tailscale and the tunnel are each
# support, and either can fail without a lockout.
#
# What this does, each services-sync cycle:
#   * no token file -> says so and exits 0. That IS the off switch (and the
#     registry's `enabled` flag is the other). Nothing runs until Darrell's
#     own Cloudflare account mints a token and it is placed on the box.
#   * token present -> ensures ONE container, `poetech-cf-tunnel`, running a
#     pinned cloudflared with that token, on the host network so it reaches
#     the sovereign gateway at 127.0.0.1:8800. The public hostname -> service
#     mapping lives in the Cloudflare dashboard (a token tunnel is remotely
#     configured), recorded in infra/nas-transport/RECORDED-STATE.md.
#   * reads cloudflared's own /ready and writes one ledger line.
#
# Brakes (CLAUDE.md, the deterministic class): a BUDGET (every docker call is
# capped, the whole pass is capped well under the 480 s rider), a LOCK (one
# pass at a time; a second fire skips), and the off switch above. The token is
# never on a command line: it goes to a 0600 env file that docker reads.
# =============================================================================
import fcntl
import hashlib
import json
import os
import shutil
import subprocess
import sys
import time
import urllib.request

TOKEN_FILE = os.environ.get(
    "CF_TUNNEL_TOKEN_FILE", "/volume1/PoeTech/secrets/cloudflared-token.txt"
)
# Its own home, like nas-heartbeat and lesson-queue-census (loops-health reads it).
STATE_DIR = os.environ.get("CF_TUNNEL_STATE", "/volume1/PoeTech/cf-tunnel")
CONTAINER = "poetech-cf-tunnel"
# Pinned, never :latest (a moving tag is an unreviewed change on the box).
IMAGE = os.environ.get("CF_TUNNEL_IMAGE", "cloudflare/cloudflared:2024.12.2")
METRICS = "127.0.0.1:20241"
CALL_TIMEOUT_S = 60
PASS_BUDGET_S = 240


def find_docker(which=shutil.which, exists=os.path.exists):
    """The docker binary: PATH, then the DSM locations (nas-docker-path-guard)."""
    found = which("docker")
    if found:
        return found
    for c in ("/usr/local/bin/docker", "/usr/bin/docker"):
        if exists(c):
            return c
    return None


def read_token(path=None):
    try:
        with open(path or TOKEN_FILE) as f:
            tok = f.read().strip()
    except OSError:
        return None
    return tok or None


def token_hash(tok):
    return hashlib.sha256(tok.encode()).hexdigest()[:16]


class Budget:
    def __init__(self, seconds, clock=time.monotonic):
        self.clock = clock
        self.deadline = clock() + seconds

    def left(self):
        return max(0.0, self.deadline - self.clock())


def make_docker(run=subprocess.run, docker_bin=None):
    """Returns docker(args, budget) -> (code, stdout). Plain first, sudo -n if the
    daemon refuses the unprivileged user (install.sh: dpoe is denied the socket)."""
    binary = docker_bin or find_docker()
    if not binary:
        return None
    prefix = [binary]
    probe = run(
        [binary, "ps", "-q"], capture_output=True, text=True, timeout=CALL_TIMEOUT_S
    )
    if probe.returncode != 0:
        prefix = ["sudo", "-n", binary]

    def docker(args, budget):
        t = min(CALL_TIMEOUT_S, budget.left())
        if t <= 0:
            return 124, "budget spent"
        try:
            p = run(prefix + args, capture_output=True, text=True, timeout=t)
        except subprocess.TimeoutExpired:
            return 124, "timed out"
        return p.returncode, (p.stdout or "") + (p.stderr or "")

    return docker


def container_state(docker, budget):
    """'running' | 'stopped' | 'absent', and the token hash it was started with."""
    code, out = docker(
        [
            "inspect",
            "-f",
            '{{.State.Running}} {{index .Config.Labels "poetech.token"}}',
            CONTAINER,
        ],
        budget,
    )
    if code != 0:
        return "absent", None
    parts = out.strip().split()
    running = parts[0] if parts else "false"
    label = parts[1] if len(parts) > 1 else None
    return ("running" if running == "true" else "stopped"), label


def write_env_file(tok, state_dir=None):
    d = state_dir or STATE_DIR
    os.makedirs(d, exist_ok=True)
    path = os.path.join(d, "tunnel.env")
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w") as f:
        f.write("TUNNEL_TOKEN=" + tok + "\n")
    os.chmod(path, 0o600)
    return path


def start(docker, budget, tok, env_file):
    docker(["rm", "-f", CONTAINER], budget)
    return docker(
        [
            "run",
            "-d",
            "--name",
            CONTAINER,
            "--restart",
            "unless-stopped",
            "--network",
            "host",
            "--env-file",
            env_file,
            "--label",
            "poetech.token=" + token_hash(tok),
            IMAGE,
            "tunnel",
            "--no-autoupdate",
            "--metrics",
            METRICS,
            "run",
        ],
        budget,
    )


def ready(opener=urllib.request.urlopen):
    """cloudflared's own readiness: 200 only once it holds a live connection."""
    try:
        with opener("http://" + METRICS + "/ready", timeout=5) as r:
            return r.status == 200
    except (OSError, ValueError):  # URLError, timeouts and refused are all OSError
        return False


def write_ledger(result, state_dir=None, **fields):
    """ledger.jsonl keeps the history; last-run.json is the one line the
    witness (loops-health) reads, the nas-heartbeat convention."""
    d = state_dir or STATE_DIR
    row = dict(what=result, result=result, at=int(time.time()), **fields)
    try:
        os.makedirs(d, exist_ok=True)
        with open(os.path.join(d, "ledger.jsonl"), "a") as f:
            f.write(json.dumps(row) + "\n")
        with open(os.path.join(d, "last-run.json"), "w") as f:
            f.write(json.dumps(row) + "\n")
    except OSError:
        pass


def run_pass(
    *,
    token=None,
    docker=None,
    budget=None,
    is_ready=ready,
    state_dir=None,
    sleep=time.sleep,
):
    """One pass. Returns the result word; every path writes one ledger line."""
    tok = token if token is not None else read_token()
    if not tok:
        write_ledger("no-token", state_dir)
        return "no-token"
    budget = budget or Budget(PASS_BUDGET_S)
    if docker is None:
        docker = make_docker()
    if docker is None:
        write_ledger("no-docker", state_dir)
        return "no-docker"
    state, label = container_state(docker, budget)
    want = token_hash(tok)
    if state == "running" and label == want:
        result = "running" if is_ready() else "running-not-ready"
        write_ledger(result, state_dir)
        return result
    env_file = write_env_file(tok, state_dir)
    code, out = start(docker, budget, tok, env_file)
    if code != 0:
        write_ledger("start-failed", state_dir, code=code, detail=out.strip()[-300:])
        return "start-failed"
    # Give it a moment to connect; bounded by the same budget.
    for _ in range(6):
        if is_ready():
            write_ledger("started", state_dir, was=state)
            return "started"
        if budget.left() < 6:
            break
        sleep(5)
    write_ledger("started-not-ready", state_dir, was=state)
    return "started-not-ready"


def main():
    os.makedirs(STATE_DIR, exist_ok=True)
    with open(os.path.join(STATE_DIR, "lock"), "w") as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except OSError:
            print("cf-tunnel: a pass is already running - skipping")
            return 0
        result = run_pass()
    print("cf-tunnel: " + result)
    # Not ready is reported, never fatal: the rider must not fail the cycle.
    return 0


if __name__ == "__main__":
    sys.exit(main())

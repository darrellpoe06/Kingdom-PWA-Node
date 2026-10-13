#!/usr/bin/env python3
"""wyze_cloud.py -- the Wyze account's devices and actions, over Wyze's own
cloud API, independent of any video stream (DR-0777).

Darrell 2026-10-07: "I open the garage doors through the camera that supports
the switch... I want that functionality inside the PoeTech too", and: "The
video timeouts undermined opening the door at times... sometimes I don't need
to see to open the door... it still has to wait for video... why... I want a
button for garage that is independent of the video streaming being available."

The Wyze Garage Door Controller is an accessory on a Wyze Cam (dongle model
HL_CGDC). The Wyze app does not open it through the video connection at all:
it sends ONE cloud action, `run_action` with action_key `garage_door_trigger`,
to the camera's device record. So can we. This module is a small, dependency
free client for exactly that road, verified against the public wyzeapy
project's implementation (SecKatie/wyzeapy, services/base_service.py,
wyze_auth_lib.py, utils.py, const.py, types.py), which Home Assistant's Wyze
integration has used for years:

  login     POST https://auth-prod.api.wyze.com/api/user/login
            headers keyid / apikey (the API ID + API Key from the Wyze
            developer console, the same two the Cameras tab asks for; with
            them, no 2FA prompt), body {email, password: md5(md5(md5(pw)))}
            -> {access_token, refresh_token}
  devices   POST https://api.wyzecam.com/app/v2/home_page/get_object_list
            -> data.device_list [{mac, nickname, product_model, product_type,
            device_params{dongle_product_model, ...}, conn_state}]
  action    POST https://api.wyzecam.com/app/v2/auto/run_action
            {provider_key: product_model, instance_id: mac, action_key, ...}
  refresh   POST https://api.wyzecam.com/app/user/refresh_token (X-API-Key)
  codes     "1" ok, "1001" parameter error, "2001" access token expired
            (refresh and retry once), "3019" device offline.

Credentials come from the one place the family already typed them: the
Cameras tab's Wyze sign-in. The forwarder writes them to the root-only
secrets file on sign-in; before that lands they are read from go2rtc.yaml's
own wyze: block (go2rtc's /api/wyze wrote it). Nothing here logs a password,
key or token.

Brakes: one action per device per ACTION_MIN_SECONDS (a double tap never
cycles a door twice); every HTTP call bounded by TIMEOUT; the device list is
cached DEVICES_TTL seconds so a tab's refreshes do not hammer Wyze.

Selftest: `python3 wyze_cloud.py --selftest` against a fake Wyze cloud on
loopback (login, list, action, token refresh, offline, rate limit, the
credential readers).
"""
import argparse
import hashlib
import json
import os
import re
import sys
import threading
import time
import urllib.error
import urllib.request
import uuid

AUTH_URL = os.environ.get("WYZE_AUTH_URL", "https://auth-prod.api.wyze.com/api/user/login")
API_URL = os.environ.get("WYZE_API_URL", "https://api.wyzecam.com")
TIMEOUT = float(os.environ.get("WYZE_HTTP_TIMEOUT", "15"))
DEVICES_TTL = float(os.environ.get("WYZE_DEVICES_TTL", "60"))
ACTION_MIN_SECONDS = float(os.environ.get("WYZE_ACTION_MIN_SECONDS", "3"))
SECRETS_ENV = os.environ.get("WYZE_ENV", "/volume1/PoeTech/secrets/wyze.env")
GO2RTC_YAML = os.path.join(os.environ.get("GO2RTC_DATA", "/volume1/docker/go2rtc"), "go2rtc.yaml")

# App identity constants as wyzeapy sends them (const.py). These identify the
# client to Wyze's API; they are public in that project and in every Wyze
# integration built on it.
PHONE_SYSTEM_TYPE = "1"
APP_NAME = "com.hualai.WyzeCam"
APP_VERSION = "2.18.43"
APP_VER = "com.hualai.WyzeCam___2.18.43"
SC = "9f275790cab94a72bd206c8876429f3c"
SV = "9d74946e652647e9b6c9d59326aef104"
API_KEY_HEADER = "WMXHYf79Nr5gIlt3r0r7p9Tcw5bvs6BB4U8O8nGJ"  # wyzeapy const API_KEY, used on refresh_token
GARAGE_DONGLE = "HL_CGDC"
ACTIONS = {
    "garage": "garage_door_trigger",   # toggles: the controller has no open/close, only trigger
    "siren_on": "siren_on",
    "siren_off": "siren_off",
    "power_on": "power_on",
    "power_off": "power_off",
}
CODE_OK, CODE_PARAM, CODE_TOKEN, CODE_OFFLINE = "1", "1001", "2001", "3019"


class WyzeError(Exception):
    def __init__(self, kind, detail=""):
        super().__init__("%s: %s" % (kind, detail))
        self.kind = kind
        self.detail = detail


def hash_password(password):
    h = hashlib.md5(password.encode("utf-8")).hexdigest()
    h = hashlib.md5(h.encode("utf-8")).hexdigest()
    return hashlib.md5(h.encode("utf-8")).hexdigest()


# --- credentials ----------------------------------------------------------------
def read_env_file(path=SECRETS_ENV):
    """WYZE_EMAIL / WYZE_PASSWORD / WYZE_API_ID / WYZE_API_KEY from a sh-style env file."""
    out = {}
    try:
        with open(path, "r", encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                k = k.strip().replace("export ", "")
                v = v.strip()
                if len(v) >= 2 and v[0] == v[-1] and v[0] in "\"'":
                    v = v[1:-1].replace('\\"', '"')
                if k in ("WYZE_EMAIL", "WYZE_PASSWORD", "WYZE_API_ID", "WYZE_API_KEY"):
                    out[k.replace("WYZE_", "").lower()] = v
    except OSError:
        return None
    if all(out.get(k) for k in ("email", "password", "api_id", "api_key")):
        return out
    return None


def read_go2rtc_wyze_block(path=GO2RTC_YAML):
    """go2rtc's own wyze: block (written by its /api/wyze):
         wyze:
           "me@example.com":
             api_id: ...
             api_key: ...
             password: ...
    A minimal reader for exactly that shape; no YAML library on the box."""
    try:
        with open(path, "r", encoding="utf-8") as fh:
            lines = fh.read().splitlines()
    except OSError:
        return None
    i = 0
    while i < len(lines) and not re.match(r"^wyze:\s*$", lines[i]):
        i += 1
    if i >= len(lines):
        return None
    email, fields = None, {}
    for line in lines[i + 1:]:
        if line and not line.startswith(" ") and not line.startswith("\t"):
            break  # next top-level key
        m = re.match(r'^\s{1,3}["\']?([^"\':\s]+@[^"\':\s]+)["\']?:\s*$', line)
        if m:
            if email and all(fields.get(k) for k in ("api_id", "api_key", "password")):
                break
            email, fields = m.group(1), {}
            continue
        m = re.match(r'^\s{2,}(api_id|api_key|password):\s*["\']?(.*?)["\']?\s*$', line)
        if m and email:
            fields[m.group(1)] = m.group(2)
    if email and all(fields.get(k) for k in ("api_id", "api_key", "password")):
        return {"email": email, **fields}
    return None


def write_env_file(creds, path=SECRETS_ENV):
    """Persist the four values root-only (0600), atomically. Returns True on success."""
    try:
        os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
        tmp = path + ".tmp"
        fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            fh.write("# Wyze sign-in, written by the Cameras tab through cams_forwarder.py (DR-0770 / DR-0777). Root-only.\n")
            for k in ("email", "password", "api_id", "api_key"):
                fh.write('WYZE_%s="%s"\n' % (k.upper(), str(creds.get(k, "")).replace('"', '\\"')))
        os.replace(tmp, path)
        return True
    except OSError:
        return False


def load_credentials(env_path=SECRETS_ENV, yaml_path=GO2RTC_YAML):
    return read_env_file(env_path) or read_go2rtc_wyze_block(yaml_path)


# --- the client -------------------------------------------------------------------
def _post_json(url, payload, headers=None, timeout=TIMEOUT, opener=None):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="POST", headers={"Content-Type": "application/json", "User-Agent": "poetech-cams/1", **(headers or {})})
    open_fn = opener or urllib.request.urlopen
    try:
        with open_fn(req, timeout=timeout) as r:
            body = r.read(4 * 1024 * 1024)
    except urllib.error.HTTPError as e:
        raise WyzeError("http-%d" % e.code, e.read(512).decode("utf-8", "replace")[:200])
    except (urllib.error.URLError, OSError) as e:
        raise WyzeError("unreachable", str(getattr(e, "reason", e))[:200])
    try:
        return json.loads(body.decode("utf-8"))
    except ValueError:
        raise WyzeError("bad-json", body[:120].decode("utf-8", "replace"))


class WyzeCloud:
    """One account's cloud session. `opener` is injectable for the selftest."""

    def __init__(self, creds, opener=None, now=time.time, auth_url=AUTH_URL, api_url=API_URL):
        self.creds = creds
        self.opener = opener
        self.now = now
        self.auth_url = auth_url
        self.api_url = api_url.rstrip("/")
        self.phone_id = str(uuid.uuid4())
        self.access_token = None
        self.refresh_token = None
        self.lock = threading.Lock()
        self._devices = None
        self._devices_at = 0.0
        self._last_action = {}  # mac -> monotonic

    # -- auth --
    def login(self):
        c = self.creds
        if not c or not all(c.get(k) for k in ("email", "password", "api_id", "api_key")):
            raise WyzeError("no-credentials", "sign in to Wyze in the Cameras tab first")
        j = _post_json(self.auth_url, {"email": c["email"], "password": hash_password(c["password"])},
                       headers={"keyid": c["api_id"], "apikey": c["api_key"]}, opener=self.opener)
        if not j.get("access_token"):
            raise WyzeError("sign-in-refused", str(j.get("description") or j.get("errorMessage") or j.get("msg") or "no access token")[:200])
        self.access_token = j["access_token"]
        self.refresh_token = j.get("refresh_token")
        return True

    def _refresh(self):
        if not self.refresh_token:
            return self.login()
        j = _post_json(self.api_url + "/app/user/refresh_token",
                       {**self._base(), "refresh_token": self.refresh_token},
                       headers={"X-API-Key": API_KEY_HEADER}, opener=self.opener)
        data = j.get("data") or {}
        if j.get("code") == CODE_OK and data.get("access_token"):
            self.access_token = data["access_token"]
            self.refresh_token = data.get("refresh_token") or self.refresh_token
            return True
        return self.login()

    def _base(self):
        return {"phone_system_type": PHONE_SYSTEM_TYPE, "app_version": APP_VERSION, "app_ver": APP_VER,
                "sc": SC, "sv": SV, "ts": int(self.now()), "phone_id": self.phone_id, "app_name": APP_NAME,
                "access_token": self.access_token}

    def _call(self, path, extra):
        if not self.access_token:
            self.login()
        j = _post_json(self.api_url + path, {**self._base(), **extra}, opener=self.opener)
        code = str(j.get("code", ""))
        if code == CODE_TOKEN:
            self._refresh()
            j = _post_json(self.api_url + path, {**self._base(), **extra}, opener=self.opener)
            code = str(j.get("code", ""))
        if code == CODE_OK:
            return j
        if code == CODE_OFFLINE:
            raise WyzeError("device-offline", str(j.get("msg") or ""))
        if code == CODE_PARAM:
            raise WyzeError("parameter-error", str(j.get("msg") or ""))
        raise WyzeError("wyze-code-%s" % code, str(j.get("msg") or "")[:200])

    # -- devices --
    def devices(self, force=False):
        with self.lock:
            if not force and self._devices is not None and self.now() - self._devices_at < DEVICES_TTL:
                return self._devices
            j = self._call("/app/v2/home_page/get_object_list", {})
            raw = (j.get("data") or {}).get("device_list") or []
            out = []
            for d in raw:
                if not isinstance(d, dict):
                    continue
                params = d.get("device_params") if isinstance(d.get("device_params"), dict) else {}
                out.append({
                    "mac": str(d.get("mac") or ""),
                    "nickname": str(d.get("nickname") or ""),
                    "model": str(d.get("product_model") or ""),
                    "type": str(d.get("product_type") or ""),
                    "online": bool(d.get("conn_state") in (1, "1", True)),
                    "garage": params.get("dongle_product_model") == GARAGE_DONGLE,
                    "dongle": str(params.get("dongle_product_model") or ""),
                    "firmware": str(d.get("firmware_ver") or ""),
                })
            self._devices = out
            self._devices_at = self.now()
            return out

    def device(self, mac):
        for d in self.devices():
            if d["mac"] == mac:
                return d
        return None

    # -- actions --
    def run_action(self, mac, action):
        key = ACTIONS.get(action)
        if not key:
            raise WyzeError("unknown-action", action)
        d = self.device(mac)
        if not d:
            raise WyzeError("unknown-device", mac)
        if action == "garage" and not d["garage"]:
            raise WyzeError("no-garage-controller", d["nickname"] or mac)
        with self.lock:
            last = self._last_action.get(mac, 0.0)
            mono = time.monotonic()
            if mono - last < ACTION_MIN_SECONDS:
                raise WyzeError("too-soon", "%d s" % int(ACTION_MIN_SECONDS - (mono - last) + 1))
            self._last_action[mac] = mono
        self._call("/app/v2/auto/run_action", {"provider_key": d["model"], "instance_id": mac, "action_key": key,
                                               "action_params": {}, "custom_string": ""})
        return {"ok": True, "mac": mac, "nickname": d["nickname"], "action": action, "action_key": key}


# --- selftest ---------------------------------------------------------------------
def _selftest():
    import tempfile
    from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

    failures = []

    def check(cond, msg):
        print(("  PASS " if cond else "  FAIL ") + msg)
        if not cond:
            failures.append(msg)

    state = {"logins": 0, "token_calls": 0, "actions": [], "expire_next": False, "refreshes": 0}

    class FakeWyze(BaseHTTPRequestHandler):
        protocol_version = "HTTP/1.1"

        def log_message(self, *a):
            pass

        def _send(self, obj, code=200):
            b = json.dumps(obj).encode("utf-8")
            self.send_response(code); self.send_header("Content-Type", "application/json"); self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)

        def do_POST(self):
            n = int(self.headers.get("Content-Length") or 0)
            body = json.loads(self.rfile.read(n).decode("utf-8")) if n else {}
            if self.path == "/api/user/login":
                state["logins"] += 1
                if self.headers.get("keyid") != "id1" or self.headers.get("apikey") != "key1":
                    return self._send({"errorCode": 1000, "description": "api key required"}, 400)
                if body.get("email") != "d@example.com" or body.get("password") != hash_password("pw-secret"):
                    return self._send({"errorCode": 2003, "description": "Invalid user name or password"})
                return self._send({"access_token": "AT1", "refresh_token": "RT1"})
            if self.path == "/app/user/refresh_token":
                state["refreshes"] += 1
                if self.headers.get("X-API-Key") != API_KEY_HEADER or body.get("refresh_token") != "RT1":
                    return self._send({"code": "1001", "msg": "bad refresh"})
                return self._send({"code": "1", "data": {"access_token": "AT2", "refresh_token": "RT2"}})
            state["token_calls"] += 1
            if body.get("access_token") not in ("AT1", "AT2") or state["expire_next"]:
                state["expire_next"] = False
                return self._send({"code": "2001", "msg": "AccessTokenError"})
            if self.path == "/app/v2/home_page/get_object_list":
                check(body.get("sc") == SC and body.get("sv") == SV and body.get("app_ver") == APP_VER and body.get("phone_id"), "the device list call carries wyzeapy's app identity") if state["token_calls"] == 1 else None
                return self._send({"code": "1", "data": {"device_list": [
                    {"mac": "GD1", "nickname": "Garage Doors", "product_model": "WYZE_CAKP2JFUS", "product_type": "Camera", "conn_state": 1, "firmware_ver": "4.36.17.21", "device_params": {"dongle_product_model": "HL_CGDC"}},
                    {"mac": "FY1", "nickname": "Front Yard", "product_model": "WYZEC1-JZ", "product_type": "Camera", "conn_state": 0, "device_params": {}},
                    {"mac": "SC1", "nickname": "Wyze Scale", "product_model": "JA.SC", "product_type": "WyzeScale", "conn_state": 1},
                    "junk",
                ]}})
            if self.path == "/app/v2/auto/run_action":
                state["actions"].append((body.get("instance_id"), body.get("provider_key"), body.get("action_key")))
                if body.get("instance_id") == "OFF1":
                    return self._send({"code": "3019", "msg": "device offline"})
                return self._send({"code": "1", "data": {}})
            return self._send({"code": "1001", "msg": "no such path"})

    srv = ThreadingHTTPServer(("127.0.0.1", 0), FakeWyze)
    srv.daemon_threads = True
    port = srv.server_address[1]
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    base = "http://127.0.0.1:%d" % port

    print("=== 1. credentials: the secrets file first, go2rtc's own wyze: block second ===")
    tmp = tempfile.mkdtemp(prefix="wyze-cloud-")
    envp = os.path.join(tmp, "wyze.env")
    yamlp = os.path.join(tmp, "go2rtc.yaml")
    check(load_credentials(envp, yamlp) is None, "no file -> no credentials (never invented)")
    with open(yamlp, "w") as fh:
        fh.write('api:\n  listen: "127.0.0.1:1984"\nstreams:\n  front: wyze://1.2.3.4?uid=x\n\n# Wyze sign-in\nwyze:\n  "d@example.com":\n    api_id: "id1"\n    api_key: "key1"\n    password: "pw-secret"\nlog:\n  level: info\n')
    c = load_credentials(envp, yamlp)
    check(c == {"email": "d@example.com", "api_id": "id1", "api_key": "key1", "password": "pw-secret"}, "go2rtc.yaml's wyze: block is read exactly (%r)" % (c and {k: (v if k == "email" else "*") for k, v in c.items()}))
    check(write_env_file({"email": "e@x.org", "password": 'p"w', "api_id": "A", "api_key": "K"}, envp) and (os.stat(envp).st_mode & 0o777) == 0o600, "the secrets file is written root-only 0600")
    c = load_credentials(envp, yamlp)
    check(c == {"email": "e@x.org", "password": 'p"w', "api_id": "A", "api_key": "K"}, "...and read back first, a quote in the password intact (%r)" % (c and c.get("email")))
    check(hash_password("pw-secret") == hashlib.md5(hashlib.md5(hashlib.md5(b"pw-secret").hexdigest().encode()).hexdigest().encode()).hexdigest(), "the password is md5 three times, as Wyze's login expects")

    print("=== 2. login with the API key headers; a wrong password is said, never retried blindly ===")
    good = {"email": "d@example.com", "password": "pw-secret", "api_id": "id1", "api_key": "key1"}
    w = WyzeCloud(good, auth_url=base + "/api/user/login", api_url=base)
    check(w.login() and w.access_token == "AT1" and w.refresh_token == "RT1", "login -> tokens")
    bad = WyzeCloud({**good, "password": "nope"}, auth_url=base + "/api/user/login", api_url=base)
    try:
        bad.login(); check(False, "wrong password raises")
    except WyzeError as e:
        check(e.kind == "sign-in-refused" and "Invalid user name" in e.detail, "wrong password -> sign-in-refused with Wyze's words")
    try:
        WyzeCloud({"email": "x"}, auth_url=base, api_url=base).login(); check(False, "missing creds raise")
    except WyzeError as e:
        check(e.kind == "no-credentials", "no credentials -> says to sign in in the Cameras tab")

    print("=== 3. devices: cameras with the garage dongle are marked; junk skipped; cached ===")
    devs = w.devices()
    check([d["mac"] for d in devs] == ["GD1", "FY1", "SC1"], "every device record comes back, junk skipped (%r)" % [d["mac"] for d in devs])
    gd = w.device("GD1")
    check(gd["garage"] is True and gd["online"] is True and gd["model"] == "WYZE_CAKP2JFUS" and gd["dongle"] == "HL_CGDC", "the camera with the garage controller is marked garage (dongle HL_CGDC)")
    check(w.device("FY1")["garage"] is False and w.device("FY1")["online"] is False, "a camera without the dongle is not")
    calls = state["token_calls"]
    w.devices()
    check(state["token_calls"] == calls, "a second read inside the TTL is served from cache")

    print("=== 4. the garage action: one cloud call, no video; offline said; a double tap refused ===")
    r = w.run_action("GD1", "garage")
    check(r["ok"] and state["actions"][-1] == ("GD1", "WYZE_CAKP2JFUS", "garage_door_trigger"), "garage -> run_action garage_door_trigger with provider_key=model, instance_id=mac")
    try:
        w.run_action("GD1", "garage"); check(False, "double tap refused")
    except WyzeError as e:
        check(e.kind == "too-soon", "a second trigger inside %ds is refused (a door never cycles twice)" % ACTION_MIN_SECONDS)
    try:
        w.run_action("FY1", "garage"); check(False, "no dongle refused")
    except WyzeError as e:
        check(e.kind == "no-garage-controller", "a camera without the controller cannot be told to open a garage")
    try:
        w.run_action("FY1", "fly"); check(False, "unknown action refused")
    except WyzeError as e:
        check(e.kind == "unknown-action", "an unknown action is refused by name")
    try:
        w.run_action("ZZZ", "siren_on"); check(False, "unknown device refused")
    except WyzeError as e:
        check(e.kind == "unknown-device", "an unknown device is refused")
    w._devices.append({"mac": "OFF1", "nickname": "Shed", "model": "WYZE_CAKP2JFUS", "type": "Camera", "online": False, "garage": False, "dongle": "", "firmware": ""})
    try:
        w.run_action("OFF1", "siren_on"); check(False, "offline said")
    except WyzeError as e:
        check(e.kind == "device-offline", "Wyze's 3019 is said as device offline")

    print("=== 5. an expired token is refreshed once and the call retried ===")
    state["expire_next"] = True
    before = state["refreshes"]
    devs2 = w.devices(force=True)
    check(state["refreshes"] == before + 1 and w.access_token == "AT2" and len(devs2) == 3, "2001 -> refresh_token -> retry succeeds with the new token")

    srv.shutdown()
    import shutil
    shutil.rmtree(tmp, ignore_errors=True)
    if failures:
        print("\nSELFTEST FAILED: %d check(s)" % len(failures))
        for f in failures:
            print("  - " + f)
        sys.exit(1)
    print("\nALL WYZE CLOUD CHECKS PASSED.")


def main():
    ap = argparse.ArgumentParser(description="Wyze cloud devices + actions (garage, siren, power), independent of video (DR-0777)")
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--devices", action="store_true", help="print the account's devices (nicknames, models, garage flag); no secrets")
    args = ap.parse_args()
    if args.selftest:
        return _selftest()
    creds = load_credentials()
    if not creds:
        print("no Wyze credentials: sign in in the Cameras tab first", file=sys.stderr)
        return 2
    w = WyzeCloud(creds)
    if args.devices:
        for d in w.devices():
            print("%-32s %-18s %-8s %s%s" % (d["nickname"], d["model"], "online" if d["online"] else "offline", d["mac"][-4:], " GARAGE" if d["garage"] else ""))
    return 0


if __name__ == "__main__":
    sys.exit(main() or 0)

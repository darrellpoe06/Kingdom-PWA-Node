#!/usr/bin/env python3
# =============================================================================
# home_accounts_sync -- every family member's logins on the home servers are
# made for them, and shown to them in the app (DR-1121)
# =============================================================================
# Darrell 2026-10-19: "Your do everything so users can just use them... End to
# end workflows". A home server a person has to set up is not home. This loop
# closes that: it reads the family roster from the app's database, makes each
# person an account on each home server that is up -- Immich (photo backup),
# Jellyfin (the video library), Audiobookshelf (the audio shelf) -- and writes
# one row per (person, service) into home_accounts with the login, a first
# password and the server URL. The app's HomeAccounts panel shows a person
# their own rows; the phone then only signs in.
#
# ONE HOUSEHOLD'S ROSTER. Darrell 2026-10-19: "No my family does.... other
# users can do it on their server". This NAS makes accounts for the members
# of the household whose family bridge token EQUALS the token in this box's
# own secrets file (home_accounts_roster(p_bridge_token), migration 0303) --
# the key that already binds this box to this family -- and for nobody else.
#
# IDEMPOTENT, NEVER DELETES. A pass lists the server's users and the table's
# rows, creates only what is missing, and never removes or rewrites an account
# or a row. The server's own admin is made ONCE on first contact and its
# credentials kept in HOME_SECRETS (mode 600), written BEFORE the account is
# created so a crash between the two never loses the only copy.
#
# Brakes (DR-0248, the deterministic class: budget + lock):
#   * BUDGET_SECONDS wall clock per pass (SIGALRM), inside services-sync's
#     480 s installer ceiling;
#   * a single-flight mkdir lock; a pass that finds one live SKIPS;
#   * MAX_CREATES_PER_PASS accounts per pass, so a first run over a large
#     roster spreads over cycles instead of hammering a fresh server.
#
# Run:
#   python3 home_accounts_sync.py --run        # one pass; says what it did
#   python3 home_accounts_sync.py --status     # the last pass's ledger
#   python3 home_accounts_sync.py --selftest   # offline: fake servers, fake DB
# =============================================================================
import argparse
import json
import os
import secrets as _secrets
import signal
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "nas-supabase"))
try:
    from sovereign_target import resolve_target  # noqa: E402
except Exception:  # the selftest and a bare checkout: the DB is injected
    resolve_target = None

DB_SECRETS_DEFAULT = "/volume1/PoeTech/secrets/supabase.json"
TOKEN_FILE_DEFAULT = "/volume1/PoeTech/secrets/chat-bridge-token.txt"
HOME_SECRETS_DEFAULT = "/volume1/PoeTech/secrets/home-accounts.json"
STATE_DIR_DEFAULT = "/volume1/docker/home-accounts"
BUDGET_SECONDS = 240
MAX_CREATES_PER_PASS = 12
HTTP_TIMEOUT = 20
LOCK_STALE_SECONDS = 900

# What a person is told. The Funnel door for Immich carries the family key on
# its own header (DR-1120); Jellyfin and Audiobookshelf live on the tailnet
# only (DR-1121), reached by the household's devices on Tailscale.
SERVERS = {
    "immich": {"upstream": "http://127.0.0.1:2283", "server_url": "https://poetech.tail5a2f35.ts.net/photo-backup", "header_name": "X-Family-Key"},
    "jellyfin": {"upstream": "http://127.0.0.1:8096", "server_url": "https://poetech.tail5a2f35.ts.net:8096", "header_name": None},
    "audiobookshelf": {"upstream": "http://127.0.0.1:13378", "server_url": "https://poetech.tail5a2f35.ts.net:13378", "header_name": None},
}
JELLYFIN_AUTH = 'MediaBrowser Client="PoeTech", Device="NAS", DeviceId="poetech-nas", Version="1.0"'

# The shelves each server has mounted (infra/nas-libraries/docker-compose.yml),
# declared as libraries by this loop so nobody has to click through a wizard
# (DR-1121: "do everything so users can just use them"). Paths are the
# CONTAINER side of each mount. Idempotent by name; a library a person has
# made by hand under another name is left alone. Jellyfin's internet metadata
# providers stay OFF (the register: "they stay off until that is weighed");
# Audiobookshelf reads embedded tags and fetches nothing until a person
# presses Match.
LIBRARIES = {
    "jellyfin": (
        {"name": "Films", "path": "/media/video", "kind": "movies"},
        {"name": "Sermons and worship", "path": "/media/harvest", "kind": "homevideos"},
        {"name": "Spoken lessons", "path": "/media/lessons", "kind": "music"},
    ),
    "audiobookshelf": (
        {"name": "Audiobooks", "path": "/audiobooks", "kind": "book"},
        {"name": "Spoken lessons", "path": "/lessons", "kind": "book"},
        {"name": "Sermons and worship", "path": "/harvest", "kind": "podcast"},
    ),
}


def new_password(n=16):
    return _secrets.token_urlsafe(n)


def http(method, url, body=None, headers=None, timeout=HTTP_TIMEOUT):
    """(status, parsed-or-text). Never raises on an HTTP error status."""
    data = None
    h = dict(headers or {})
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        h.setdefault("Content-Type", "application/json")
    req = urllib.request.Request(url, data=data, method=method, headers=h)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            raw = r.read()
            status = r.status
    except urllib.error.HTTPError as e:
        raw = e.read()
        status = e.code
    txt = raw.decode("utf-8", "replace")
    try:
        return status, json.loads(txt) if txt else {}
    except ValueError:
        return status, txt


# ---------------------------------------------------------------------------
# the servers
# ---------------------------------------------------------------------------
class Immich:
    name = "immich"

    def __init__(self, base):
        self.base = base.rstrip("/")
        self.token = None

    def up(self):
        try:
            s, b = http("GET", self.base + "/api/server/ping", timeout=6)
        except (OSError, urllib.error.URLError):
            return False
        return s == 200 and isinstance(b, dict) and b.get("res") == "pong"

    def ensure_admin(self, creds):
        """creds are already saved on disk by the caller. On a fresh server the
        admin is made with them; on a server that has one, the sign-up is
        refused and the login below is the proof the saved creds are right."""
        s, cfg = http("GET", self.base + "/api/server/config", timeout=6)
        if isinstance(cfg, dict) and cfg.get("isInitialized") is False:
            s, b = http("POST", self.base + "/api/auth/admin-sign-up", {"email": creds["email"], "password": creds["password"], "name": creds.get("name", "PoeTech NAS")})
            if s not in (200, 201):
                raise RuntimeError(f"immich admin sign-up answered {s}: {str(b)[:120]}")
        s, b = http("POST", self.base + "/api/auth/login", {"email": creds["email"], "password": creds["password"]})
        if s not in (200, 201) or not isinstance(b, dict) or not b.get("accessToken"):
            raise RuntimeError(f"immich login answered {s}")
        self.token = b["accessToken"]
        return creds

    def _h(self):
        return {"Authorization": "Bearer " + self.token}

    def logins(self):
        s, b = http("GET", self.base + "/api/admin/users", headers=self._h())
        if s != 200 or not isinstance(b, list):
            raise RuntimeError(f"immich user list answered {s}")
        return {str(u.get("email", "")).lower() for u in b}

    def libraries(self):
        return None  # Immich has no shelves to declare: its library is the upload folder

    def create(self, person, password):
        login = person["email"].lower()
        s, b = http("POST", self.base + "/api/admin/users", {
            "email": login, "name": person["display_name"], "password": password, "shouldChangePassword": True,
        }, headers=self._h())
        if s not in (200, 201):
            raise RuntimeError(f"immich create answered {s}: {str(b)[:120]}")
        return login


class Jellyfin:
    name = "jellyfin"

    def __init__(self, base):
        self.base = base.rstrip("/")
        self.token = None

    def up(self):
        try:
            s, b = http("GET", self.base + "/System/Info/Public", timeout=6)
        except (OSError, urllib.error.URLError):
            return False
        return s == 200 and isinstance(b, dict) and "Version" in b

    def _h(self):
        auth = JELLYFIN_AUTH + (f', Token="{self.token}"' if self.token else "")
        return {"Authorization": auth, "X-Emby-Authorization": auth}

    def ensure_admin(self, creds):
        s, info = http("GET", self.base + "/System/Info/Public", timeout=6)
        if isinstance(info, dict) and info.get("StartupWizardCompleted") is False:
            for path, body in (
                    ("/Startup/Configuration", {"UICulture": "en-US", "MetadataCountryCode": "US", "PreferredMetadataLanguage": "en"}),
                    ("/Startup/User", {"Name": creds["username"], "Password": creds["password"]}),
                    ("/Startup/RemoteAccess", {"EnableRemoteAccess": True, "EnableAutomaticPortMapping": False}),
                ("/Startup/Complete", None),
            ):
                if path == "/Startup/User":
                    http("GET", self.base + "/Startup/User", headers=self._h())
                s, b = http("POST", self.base + path, body if body is not None else {}, headers=self._h())
                if s not in (200, 204):
                    raise RuntimeError(f"jellyfin {path} answered {s}: {str(b)[:120]}")
        s, b = http("POST", self.base + "/Users/AuthenticateByName", {"Username": creds["username"], "Pw": creds["password"]}, headers=self._h())
        if s != 200 or not isinstance(b, dict) or not b.get("AccessToken"):
            raise RuntimeError(f"jellyfin login answered {s}")
        self.token = b["AccessToken"]
        return creds

    def logins(self):
        s, b = http("GET", self.base + "/Users", headers=self._h())
        if s != 200 or not isinstance(b, list):
            raise RuntimeError(f"jellyfin user list answered {s}")
        return {str(u.get("Name", "")).lower() for u in b}

    def libraries(self):
        s, b = http("GET", self.base + "/Library/VirtualFolders", headers=self._h())
        if s != 200 or not isinstance(b, list):
            raise RuntimeError(f"jellyfin library list answered {s}")
        return {str(v.get("Name", "")) for v in b}

    def declare(self, lib):
        q = urllib.parse.urlencode({"name": lib["name"], "collectionType": lib["kind"], "refreshLibrary": "true"})
        body = {"LibraryOptions": {"PathInfos": [{"Path": lib["path"]}], "EnableInternetProviders": False,
                                   "EnableAutomaticSeriesGrouping": False, "SaveLocalMetadata": False}}
        s, b = http("POST", self.base + "/Library/VirtualFolders?" + q, body, headers=self._h())
        if s not in (200, 204):
            raise RuntimeError(f"jellyfin declare {lib['name']} answered {s}: {str(b)[:120]}")

    def create(self, person, password):
        login = person["email"].split("@", 1)[0].lower()
        s, b = http("POST", self.base + "/Users/New", {"Name": login, "Password": password}, headers=self._h())
        if s != 200:
            raise RuntimeError(f"jellyfin create answered {s}: {str(b)[:120]}")
        return login


class Audiobookshelf:
    name = "audiobookshelf"

    def __init__(self, base):
        self.base = base.rstrip("/")
        self.token = None

    def up(self):
        try:
            s, b = http("GET", self.base + "/status", timeout=6)
        except (OSError, urllib.error.URLError):
            return False
        return s == 200 and isinstance(b, dict) and "isInit" in b

    def ensure_admin(self, creds):
        s, st = http("GET", self.base + "/status", timeout=6)
        if isinstance(st, dict) and not st.get("isInit"):
            s, b = http("POST", self.base + "/init", {"newRoot": {"username": creds["username"], "password": creds["password"]}})
            if s != 200:
                raise RuntimeError(f"audiobookshelf init answered {s}: {str(b)[:120]}")
        s, b = http("POST", self.base + "/login", {"username": creds["username"], "password": creds["password"]})
        tok = (b.get("user") or {}).get("token") if isinstance(b, dict) else None
        if s != 200 or not tok:
            raise RuntimeError(f"audiobookshelf login answered {s}")
        self.token = tok
        return creds

    def _h(self):
        return {"Authorization": "Bearer " + self.token}

    def logins(self):
        s, b = http("GET", self.base + "/api/users", headers=self._h())
        if s != 200 or not isinstance(b, dict):
            raise RuntimeError(f"audiobookshelf user list answered {s}")
        return {str(u.get("username", "")).lower() for u in (b.get("users") or [])}

    def libraries(self):
        s, b = http("GET", self.base + "/api/libraries", headers=self._h())
        if s != 200 or not isinstance(b, dict):
            raise RuntimeError(f"audiobookshelf library list answered {s}")
        return {str(v.get("name", "")) for v in (b.get("libraries") or [])}

    def declare(self, lib):
        s, b = http("POST", self.base + "/api/libraries",
                    {"name": lib["name"], "folders": [{"fullPath": lib["path"]}], "mediaType": lib["kind"]}, headers=self._h())
        if s != 200:
            raise RuntimeError(f"audiobookshelf declare {lib['name']} answered {s}: {str(b)[:120]}")

    def create(self, person, password):
        login = person["email"].split("@", 1)[0].lower()
        s, b = http("POST", self.base + "/api/users", {"username": login, "password": password, "type": "user", "isActive": True}, headers=self._h())
        if s != 200:
            raise RuntimeError(f"audiobookshelf create answered {s}: {str(b)[:120]}")
        return login


# ---------------------------------------------------------------------------
# the app's database (PostgREST, service role)
# ---------------------------------------------------------------------------
class Db:
    def __init__(self, url, key):
        self.url, self.key = url.rstrip("/"), key

    def _h(self, extra=None):
        h = {"apikey": self.key, "Authorization": "Bearer " + self.key}
        h.update(extra or {})
        return h

    def roster(self, bridge_token):
        s, b = http("POST", self.url + "/rest/v1/rpc/home_accounts_roster", {"p_bridge_token": bridge_token}, headers=self._h())
        if s != 200 or not isinstance(b, list):
            raise RuntimeError(f"roster rpc answered {s}: {str(b)[:120]}")
        return [p for p in b if p.get("user_id") and p.get("email")]

    def existing(self):
        s, b = http("GET", self.url + "/rest/v1/home_accounts?select=user_id,service", headers=self._h())
        if s != 200 or not isinstance(b, list):
            raise RuntimeError(f"home_accounts read answered {s}")
        return {(r["user_id"], r["service"]) for r in b}

    def insert(self, row):
        s, b = http("POST", self.url + "/rest/v1/home_accounts", row, headers=self._h({"Prefer": "return=minimal"}))
        if s not in (200, 201):
            raise RuntimeError(f"home_accounts insert answered {s}: {str(b)[:120]}")


# ---------------------------------------------------------------------------
# secrets, lock, budget
# ---------------------------------------------------------------------------
def load_secrets(path):
    try:
        with open(path, "r", encoding="utf-8") as fh:
            return json.load(fh)
    except (OSError, ValueError):
        return {}


def save_secrets(path, doc):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as fh:
        json.dump(doc, fh, indent=1)
    os.chmod(tmp, 0o600)
    os.replace(tmp, path)


class Lock:
    def __init__(self, state_dir):
        self.path = os.path.join(state_dir, "home-accounts.lock")

    def __enter__(self):
        os.makedirs(os.path.dirname(self.path), exist_ok=True)
        try:
            if time.time() - os.path.getmtime(self.path) > LOCK_STALE_SECONDS:
                os.rmdir(self.path)
        except OSError:
            pass
        try:
            os.mkdir(self.path)
        except FileExistsError:
            return None
        return self

    def __exit__(self, *a):
        try:
            os.rmdir(self.path)
        except OSError:
            pass


def _budget_alarm(signum, frame):
    raise TimeoutError("budget")


# ---------------------------------------------------------------------------
# one pass
# ---------------------------------------------------------------------------
def ensure_libraries(srv, entry):
    """Declares every mounted shelf the server does not yet list, by name.
    Writes entry["libraries"] = {"have": [...], "declared": [...]} or
    entry["library_error"]; never raises, so the accounts still get made."""
    wanted = LIBRARIES.get(srv.name) or ()
    if not wanted:
        return
    try:
        have = srv.libraries()
        if have is None:
            return
        declared = []
        for lib in wanted:
            if lib["name"] in have:
                continue
            srv.declare(lib)
            have.add(lib["name"])
            declared.append(lib["name"])
        entry["libraries"] = {"have": sorted(have), "declared": declared}
    except TimeoutError:
        raise
    except Exception as e:
        entry["library_error"] = str(e)[:200]


def run_once(db, servers, home_secrets_path, state_dir, bridge_token, max_creates=MAX_CREATES_PER_PASS, budget=BUDGET_SECONDS):
    """Returns the ledger of the pass. servers: list of server objects;
    bridge_token: this NAS's family key, which names the household."""
    ledger = {"at": int(time.time()), "skipped": None, "roster": 0, "servers": {}, "created": 0, "errors": []}
    if not str(bridge_token or "").strip():
        ledger["skipped"] = "no family key on this NAS, so no household to serve"
        return ledger
    lock = Lock(state_dir)
    if lock.__enter__() is None:
        ledger["skipped"] = "a pass is already running"
        return ledger
    if budget and hasattr(signal, "SIGALRM"):
        signal.signal(signal.SIGALRM, _budget_alarm)
        signal.alarm(budget)
    try:
        secrets_doc = load_secrets(home_secrets_path)
        roster = db.roster(bridge_token.strip())
        ledger["roster"] = len(roster)
        existing = db.existing()
        created = 0
        for srv in servers:
            entry = {"up": False, "accounts": 0, "created": 0, "error": None}
            ledger["servers"][srv.name] = entry
            try:
                if not srv.up():
                    entry["error"] = "not answering on loopback"
                    continue
                entry["up"] = True
                creds = dict(secrets_doc.get(srv.name) or {})
                fresh = not creds.get("email") and not creds.get("username")
                if fresh:
                    # The admin's credentials are written before the account is
                    # made, so a crash between the two never loses the only copy.
                    probe = {"immich": {"email": "admin@poetech.home", "password": new_password(), "name": "PoeTech NAS"},
                             "jellyfin": {"username": "poetech", "password": new_password()},
                             "audiobookshelf": {"username": "root", "password": new_password()}}[srv.name]
                    secrets_doc[srv.name] = probe
                    save_secrets(home_secrets_path, secrets_doc)
                    creds = dict(probe)
                srv.ensure_admin(creds)
                ensure_libraries(srv, entry)
                have = srv.logins()
                entry["accounts"] = len(have)
                meta = SERVERS[srv.name]
                for person in roster:
                    key = (person["user_id"], srv.name)
                    login_guess = person["email"].lower() if srv.name == "immich" else person["email"].split("@", 1)[0].lower()
                    if key in existing or login_guess in have:
                        if key not in existing and login_guess in have:
                            # The account exists but the person has no row: tell
                            # them where it is; the password is theirs already.
                            db.insert({"user_id": person["user_id"], "instance_id": person["instance_id"], "service": srv.name,
                                       "login": login_guess, "initial_password": None, "server_url": meta["server_url"],
                                       "header_name": meta["header_name"]})
                            existing.add(key)
                        continue
                    if created >= max_creates:
                        break
                    pw = new_password()
                    login = srv.create(person, pw)
                    db.insert({"user_id": person["user_id"], "instance_id": person["instance_id"], "service": srv.name,
                               "login": login, "initial_password": pw, "server_url": meta["server_url"],
                               "header_name": meta["header_name"]})
                    existing.add(key)
                    have.add(login)
                    created += 1
                    entry["created"] += 1
            except TimeoutError:
                entry["error"] = "budget reached"
                ledger["errors"].append(f"{srv.name}: budget reached")
                break
            except Exception as e:  # one server's failure never stops the others
                entry["error"] = str(e)[:200]
                ledger["errors"].append(f"{srv.name}: {str(e)[:200]}")
        ledger["created"] = created
    except TimeoutError:
        ledger["errors"].append("budget reached before the roster was read")
    except Exception as e:
        ledger["errors"].append(str(e)[:200])
    finally:
        if budget and hasattr(signal, "SIGALRM"):
            signal.alarm(0)
        lock.__exit__(None, None, None)
    try:
        os.makedirs(state_dir, exist_ok=True)
        with open(os.path.join(state_dir, "last-pass.json"), "w", encoding="utf-8") as fh:
            json.dump(ledger, fh, indent=1)
    except OSError:
        pass
    return ledger


def default_servers():
    return [Immich(SERVERS["immich"]["upstream"]), Jellyfin(SERVERS["jellyfin"]["upstream"]), Audiobookshelf(SERVERS["audiobookshelf"]["upstream"])]


def status(state_dir):
    try:
        with open(os.path.join(state_dir, "last-pass.json"), "r", encoding="utf-8") as fh:
            return json.load(fh)
    except (OSError, ValueError):
        return {"at": None, "note": "no pass recorded yet"}


# ---------------------------------------------------------------------------
# selftest: fake servers and a fake PostgREST on loopback, two passes.
# ---------------------------------------------------------------------------
def _selftest():
    import tempfile
    import threading
    from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

    failures = []

    def check(ok, what):
        print(("  ok   " if ok else "  FAIL ") + what)
        if not ok:
            failures.append(what)

    world = {"immich_users": [], "immich_admin": None, "jf_users": [], "jf_wizard": False, "abs_users": [], "abs_root": None,
             "jf_libs": [], "abs_libs": [{"name": "Grandpa's tapes", "kind": "book", "paths": ["/audiobooks/tapes"]}],
             "rows": [], "roster": [
                 {"user_id": "u1", "instance_id": "i1", "email": "Darrell@example.org", "display_name": "Darrell"},
                 {"user_id": "u2", "instance_id": "i1", "email": "kid@example.org", "display_name": "Kid"},
             ], "calls": []}

    class Fake(BaseHTTPRequestHandler):
        def log_message(self, *a):
            pass

        def _body(self):
            n = int(self.headers.get("Content-Length") or 0)
            return json.loads(self.rfile.read(n).decode("utf-8") or "{}") if n else {}

        def _send(self, code, obj):
            data = json.dumps(obj).encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        def do_GET(self):
            p = self.path.split("?")[0]
            world["calls"].append(("GET", p))
            auth = self.headers.get("Authorization", "")
            # immich
            if p == "/api/server/ping":
                return self._send(200, {"res": "pong"})
            if p == "/api/server/config":
                return self._send(200, {"isInitialized": world["immich_admin"] is not None})
            if p == "/api/admin/users":
                if auth != "Bearer immich-token":
                    return self._send(401, {})
                return self._send(200, [{"email": e} for e in world["immich_users"]])
            # jellyfin
            if p == "/System/Info/Public":
                return self._send(200, {"Version": "12.2.0", "StartupWizardCompleted": world["jf_wizard"]})
            if p == "/Startup/User":
                return self._send(200, {"Name": "", "Password": ""})
            if p == "/Users":
                if 'Token="jf-token"' not in auth:
                    return self._send(401, {})
                return self._send(200, [{"Name": n} for n in world["jf_users"]])
            if p == "/Library/VirtualFolders":
                if 'Token="jf-token"' not in auth:
                    return self._send(401, {})
                return self._send(200, [{"Name": v["name"], "Locations": v["paths"], "CollectionType": v["kind"]} for v in world["jf_libs"]])
            # audiobookshelf
            if p == "/status":
                return self._send(200, {"isInit": world["abs_root"] is not None, "serverVersion": "2.37.1"})
            if p == "/api/users":
                if auth != "Bearer abs-token":
                    return self._send(401, {})
                return self._send(200, {"users": [{"username": n} for n in world["abs_users"]]})
            if p == "/api/libraries":
                if auth != "Bearer abs-token":
                    return self._send(401, {})
                return self._send(200, {"libraries": [{"name": v["name"], "folders": [{"fullPath": f} for f in v["paths"]], "mediaType": v["kind"]} for v in world["abs_libs"]]})
            # postgrest
            if p == "/rest/v1/home_accounts":
                if self.headers.get("apikey") != "service-key":
                    return self._send(401, {})
                return self._send(200, [{"user_id": r["user_id"], "service": r["service"]} for r in world["rows"]])
            return self._send(404, {"path": p})

        def do_POST(self):
            p = self.path.split("?")[0]
            b = self._body()
            world["calls"].append(("POST", p))
            auth = self.headers.get("Authorization", "")
            if p == "/api/auth/admin-sign-up":
                if world["immich_admin"]:
                    return self._send(400, {"message": "The server already has an admin"})
                world["immich_admin"] = b
                return self._send(201, {"id": "a"})
            if p == "/api/auth/login":
                if world["immich_admin"] and b.get("email") == world["immich_admin"]["email"] and b.get("password") == world["immich_admin"]["password"]:
                    return self._send(201, {"accessToken": "immich-token"})
                return self._send(401, {})
            if p == "/api/admin/users":
                if auth != "Bearer immich-token":
                    return self._send(401, {})
                world["immich_users"].append(b["email"])
                world.setdefault("immich_bodies", []).append(b)
                return self._send(201, {"id": "x"})
            if p.startswith("/Startup/"):
                if p == "/Startup/User":
                    world["jf_admin"] = b
                if p == "/Startup/Complete":
                    world["jf_wizard"] = True
                    world["jf_users"].append(world["jf_admin"]["Name"])
                return self._send(204, {})
            if p == "/Users/AuthenticateByName":
                a = world.get("jf_admin") or {}
                if b.get("Username") == a.get("Name") and b.get("Pw") == a.get("Password"):
                    return self._send(200, {"AccessToken": "jf-token"})
                return self._send(401, {})
            if p == "/Users/New":
                if 'Token="jf-token"' not in auth:
                    return self._send(401, {})
                world["jf_users"].append(b["Name"])
                return self._send(200, {"Id": "y"})
            if p == "/Library/VirtualFolders":
                if 'Token="jf-token"' not in auth:
                    return self._send(401, {})
                q = dict(urllib.parse.parse_qsl(self.path.partition("?")[2]))
                opts = (b.get("LibraryOptions") or {})
                world["jf_libs"].append({"name": q.get("name"), "kind": q.get("collectionType"),
                                         "paths": [x.get("Path") for x in opts.get("PathInfos") or []],
                                         "internet": opts.get("EnableInternetProviders")})
                return self._send(204, {})
            if p == "/init":
                world["abs_root"] = b["newRoot"]
                world["abs_users"].append(b["newRoot"]["username"])
                return self._send(200, {})
            if p == "/login":
                r = world["abs_root"] or {}
                if b.get("username") == r.get("username") and b.get("password") == r.get("password"):
                    return self._send(200, {"user": {"token": "abs-token"}})
                return self._send(401, {})
            if p == "/api/users":
                if auth != "Bearer abs-token":
                    return self._send(401, {})
                world["abs_users"].append(b["username"])
                return self._send(200, {"user": {"id": "z"}})
            if p == "/api/libraries":
                if auth != "Bearer abs-token":
                    return self._send(401, {})
                world["abs_libs"].append({"name": b.get("name"), "kind": b.get("mediaType"), "paths": [f.get("fullPath") for f in b.get("folders") or []]})
                return self._send(200, {"id": "L"})
            if p == "/rest/v1/rpc/home_accounts_roster":
                world["roster_tokens"] = world.get("roster_tokens", []) + [b.get("p_bridge_token")]
                return self._send(200, world["roster"] if b.get("p_bridge_token") == "family-key" else [])
            if p == "/rest/v1/home_accounts":
                if self.headers.get("apikey") != "service-key":
                    return self._send(401, {})
                world["rows"].append(b)
                return self._send(201, {})
            return self._send(404, {"path": p})

    up = ThreadingHTTPServer(("127.0.0.1", 0), Fake)
    threading.Thread(target=up.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{up.server_port}"
    tmp = tempfile.mkdtemp(prefix="home-accounts-selftest-")
    secrets_path = os.path.join(tmp, "secrets", "home-accounts.json")
    state = os.path.join(tmp, "state")
    db = Db(base, "service-key")
    servers = [Immich(base), Jellyfin(base), Audiobookshelf(base)]

    led = run_once(db, servers, secrets_path, state, "family-key", budget=0)
    check(led["roster"] == 2 and not led["errors"], f"first pass reads the roster and finishes without error ({led['errors']})")
    check(world["immich_admin"] is not None and world["jf_wizard"] and world["abs_root"] is not None,
          "first contact makes each server's admin: Immich sign-up, Jellyfin's wizard, Audiobookshelf's root")
    doc = load_secrets(secrets_path)
    check(doc.get("immich", {}).get("password") == world["immich_admin"]["password"]
          and doc.get("jellyfin", {}).get("password") == world["jf_admin"]["Password"]
          and doc.get("audiobookshelf", {}).get("password") == world["abs_root"]["password"],
          "the admin credentials kept on disk are the ones the servers were given")
    check(oct(os.stat(secrets_path).st_mode & 0o777) == "0o600", "the secrets file is mode 600")
    sign_i = [i for i, c in enumerate(world["calls"]) if c == ("POST", "/api/auth/admin-sign-up")][0]
    check(sign_i > 0, "the admin is made after the roster is read")
    check(sorted(world["immich_users"]) == ["darrell@example.org", "kid@example.org"], "Immich gets one account per person, by email, lowercased")
    check(sorted(world["jf_users"]) == ["darrell", "kid", "poetech"], "Jellyfin gets one account per person by the email's local part, beside the admin")
    check(sorted(world["abs_users"]) == ["darrell", "kid", "root"], "Audiobookshelf gets one account per person beside root")
    check(all(b.get("shouldChangePassword") is True for b in world.get("immich_bodies", [])), "Immich accounts must change their first password on login")
    rows = world["rows"]
    check(len(rows) == 6 and len({(r["user_id"], r["service"]) for r in rows}) == 6, "six rows: two people times three servers")
    im = [r for r in rows if r["service"] == "immich" and r["user_id"] == "u1"][0]
    check(im["login"] == "darrell@example.org" and im["header_name"] == "X-Family-Key" and im["server_url"].endswith("/photo-backup") and len(im["initial_password"]) >= 16,
          "a row carries the login, a first password, the server URL and (for Immich) the header name")
    jf = [r for r in rows if r["service"] == "jellyfin" and r["user_id"] == "u2"][0]
    check(jf["header_name"] is None and ":8096" in jf["server_url"], "Jellyfin's row names the tailnet port and no header")
    check(led["created"] == 6 and all(v["created"] == 2 for v in led["servers"].values()), "the ledger counts six created, two per server")
    jl = {v["name"]: v for v in world["jf_libs"]}
    check(set(jl) == {"Films", "Sermons and worship", "Spoken lessons"}
          and jl["Sermons and worship"]["paths"] == ["/media/harvest"] and jl["Films"]["kind"] == "movies" and jl["Spoken lessons"]["paths"] == ["/media/lessons"],
          "Jellyfin's three mounted shelves are declared as libraries by name, path and kind, with no wizard")
    check(bool(world["jf_libs"]) and all(v["internet"] is False for v in world["jf_libs"]), "Jellyfin's internet metadata providers are OFF on every declared library (nothing leaves the network)")
    al = {v["name"]: v for v in world["abs_libs"]}
    check(set(al) == {"Grandpa's tapes", "Audiobooks", "Spoken lessons", "Sermons and worship"}
          and al["Spoken lessons"]["paths"] == ["/lessons"] and al["Sermons and worship"]["kind"] == "podcast",
          "Audiobookshelf's three shelves are declared beside the library a person made by hand, which is left alone")
    check((led["servers"]["jellyfin"].get("libraries") or {}).get("declared") == ["Films", "Sermons and worship", "Spoken lessons"]
          and sorted((led["servers"]["audiobookshelf"].get("libraries") or {}).get("have") or []) == ["Audiobooks", "Grandpa's tapes", "Sermons and worship", "Spoken lessons"]
          and "libraries" not in led["servers"]["immich"],
          "the ledger names what each server has and what this pass declared; Immich declares nothing")
    acct_i = [i for i, c in enumerate(world["calls"]) if c == ("POST", "/Users/New")][0]
    lib_i = ([i for i, c in enumerate(world["calls"]) if c == ("POST", "/Library/VirtualFolders")] or [10 ** 9])[0]
    check(lib_i < acct_i, "the shelves are declared before the first account is made, so a new login opens on a full library")

    # second pass: nothing new
    n_calls = len(world["calls"])
    led2 = run_once(db, servers, secrets_path, state, "family-key", budget=0)
    check(led2["created"] == 0 and not led2["errors"] and len(world["rows"]) == 6 and len(world["immich_users"]) == 2,
          "a second pass creates nothing and writes no row (idempotent)")
    check(("POST", "/api/auth/admin-sign-up") not in world["calls"][n_calls:], "the admin is never made twice")
    check(("POST", "/Library/VirtualFolders") not in world["calls"][n_calls:] and ("POST", "/api/libraries") not in world["calls"][n_calls:]
          and len(world["jf_libs"]) == 3 and len(world["abs_libs"]) == 4 and (led2["servers"]["jellyfin"].get("libraries") or {}).get("declared") == [],
          "a library is never declared twice (idempotent by name)")
    check(load_secrets(secrets_path) == doc, "the secrets file is left exactly as it was")

    # a new person joins: only their accounts are made
    world["roster"].append({"user_id": "u3", "instance_id": "i1", "email": "new@example.org", "display_name": "New"})
    led3 = run_once(db, servers, secrets_path, state, "family-key", budget=0)
    check(led3["created"] == 3 and len(world["rows"]) == 9, "a new member gets three accounts and three rows, nobody else is touched")

    # an account that exists on a server with no row: the row is written without a password
    world["immich_users"].append("old@example.org")
    world["roster"].append({"user_id": "u4", "instance_id": "i1", "email": "old@example.org", "display_name": "Old"})
    led4 = run_once(db, servers, secrets_path, state, "family-key", budget=0)
    old = [r for r in world["rows"] if r["user_id"] == "u4" and r["service"] == "immich"]
    check(len(old) == 1 and old[0]["initial_password"] is None and led4["servers"]["immich"]["created"] == 0,
          "an account that already exists gets a row with no password and is never re-created")

    # a shelf that will not declare: named in the ledger, the accounts still made
    class StubbornJellyfin(Jellyfin):
        def declare(self, lib):
            raise RuntimeError("jellyfin declare answered 500: disk not mounted")
    world["jf_libs"].clear()
    world["roster"].append({"user_id": "u5", "instance_id": "i1", "email": "five@example.org", "display_name": "Five"})
    led45 = run_once(db, [StubbornJellyfin(base)], secrets_path, state, "family-key", budget=0)
    e45 = led45["servers"]["jellyfin"]
    check("disk not mounted" in (e45.get("library_error") or "") and e45["created"] == 1 and not led45["errors"],
          "CATCHES a shelf that will not declare: the why is in the ledger and the person's account is still made")

    # the cap per pass
    for i in range(20):
        world["roster"].append({"user_id": f"m{i}", "instance_id": "i1", "email": f"m{i}@example.org", "display_name": f"M{i}"})
    led5 = run_once(db, servers, secrets_path, state, "family-key", max_creates=5, budget=0)
    check(led5["created"] == 5, "CATCHES a large roster: at most the cap per pass, the rest on the next cycle")

    # the lock
    os.mkdir(os.path.join(state, "home-accounts.lock"))
    led6 = run_once(db, servers, secrets_path, state, "family-key", budget=0)
    check(led6["skipped"] == "a pass is already running", "CATCHES a pass already running: skipped, never stacked")
    os.rmdir(os.path.join(state, "home-accounts.lock"))

    # a server down: the others still get their accounts
    world["roster"].append({"user_id": "u9", "instance_id": "i1", "email": "nine@example.org", "display_name": "Nine"})
    servers_down = [Immich("http://127.0.0.1:9"), Jellyfin(base), Audiobookshelf(base)]
    led7 = run_once(db, servers_down, secrets_path, state, "family-key", max_creates=50, budget=0)
    check(led7["servers"]["immich"]["up"] is False and "not answering" in led7["servers"]["immich"]["error"]
          and led7["servers"]["jellyfin"]["up"] and led7["servers"]["jellyfin"]["created"] >= 1,
          "a server that is down is named and skipped; the others are still served")

    st = status(state)
    check(st.get("at") == led7["at"], "--status reads the last pass's ledger")

    # the household is named by the key: a wrong key lists nobody, no key serves nobody
    before_rows = len(world["rows"])
    led8 = run_once(db, servers, secrets_path, state, "some-other-household", max_creates=50, budget=0)
    check(led8["roster"] == 0 and led8["created"] == 0 and len(world["rows"]) == before_rows,
          "CATCHES another household's key: the roster is empty and nothing is made (one NAS, one family)")
    led9 = run_once(db, servers, secrets_path, state, "", budget=0)
    check(led9["skipped"] is not None and "no family key" in led9["skipped"], "CATCHES a NAS with no family key: skipped, with the why")
    check(all(t == "family-key" or t == "some-other-household" for t in world["roster_tokens"]), "the roster is always asked with this NAS's own key")

    up.shutdown()
    print("home-accounts selftest: " + ("OK" if not failures else f"{len(failures)} FAILURE(S)"))
    return 1 if failures else 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--run", action="store_true")
    ap.add_argument("--status", action="store_true")
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--db-secrets", default=os.environ.get("HOME_ACCOUNTS_DB_SECRETS", DB_SECRETS_DEFAULT))
    ap.add_argument("--home-secrets", default=os.environ.get("HOME_ACCOUNTS_SECRETS", HOME_SECRETS_DEFAULT))
    ap.add_argument("--state", default=os.environ.get("HOME_ACCOUNTS_STATE", STATE_DIR_DEFAULT))
    ap.add_argument("--token-file", default=os.environ.get("HOME_ACCOUNTS_TOKEN_FILE", TOKEN_FILE_DEFAULT))
    a = ap.parse_args()
    if a.selftest:
        sys.exit(_selftest())
    if a.status:
        print(json.dumps(status(a.state), indent=1))
        return
    if not a.run:
        ap.print_help()
        return
    if resolve_target is None:
        print("home-accounts: sovereign_target.py not found beside this checkout -- nothing done", file=sys.stderr)
        sys.exit(0)
    source, url, key = resolve_target(a.db_secrets)
    if not url or not key:
        print("home-accounts: no database credential (env, sovereign, or secrets file) -- quiet no-op", file=sys.stderr)
        sys.exit(0)
    print(f"home-accounts: database {source} ({url})", file=sys.stderr)
    try:
        with open(a.token_file, "r", encoding="utf-8") as fh:
            bridge_token = fh.read().strip()
    except OSError:
        bridge_token = ""
    led = run_once(Db(url, key), default_servers(), a.home_secrets, a.state, bridge_token)
    print(json.dumps(led, indent=1))
    sys.exit(0)


if __name__ == "__main__":
    main()

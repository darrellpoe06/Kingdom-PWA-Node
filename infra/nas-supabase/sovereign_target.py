#!/usr/bin/env python3
# =============================================================================
# sovereign_target.py -- the NAS writers follow the repoint record (DR-0442)
# =============================================================================
# The app follows infra/nas-supabase/REPOINT-ARMED (DR-0310): when that record
# exists, the deploy builds against the sovereign stack. The NAS ingest scripts
# did not: each read /volume1/PoeTech/secrets/supabase.json, which names the
# HOSTED project, so from 2026-08-19 every new message was filed into a database
# the app no longer reads (measured 2026-09-16: 4 September services missing).
#
# One resolver, shared by every loader. Precedence, first found wins:
#   1. env SUPABASE_URL + SUPABASE_SERVICE_KEY           (explicit operator intent)
#   2. REPOINT-ARMED beside this file  AND  the sovereign stack's own .env is
#      readable here (SERVICE_ROLE_KEY)  -> kong loopback on THIS box
#   3. the secrets JSON file the loader was given          (the old behaviour)
# (2) is true only ON the NAS with the record merged -- a tower or a laptop has
# no /volume1/docker/supabase/.env and keeps reading its secrets file, so this
# can never point a stray machine at a loopback it cannot reach.
#
# Selftest: python3 sovereign_target.py --selftest  (temp files, no network)
# =============================================================================
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ARMED_PATH = os.path.join(HERE, "REPOINT-ARMED")
SUPA_ENV = os.environ.get("SUPABASE_DATA", "/volume1/docker/supabase") + "/.env"
SOVEREIGN_REST_URL = os.environ.get("SOVEREIGN_SB_URL", "http://127.0.0.1:8800")


def _env_value(path, key):
    try:
        with open(path) as f:
            for line in f:
                if line.startswith(key + "="):
                    return line.rstrip("\n").split("=", 1)[1].strip().strip('"')
    except OSError:
        return None
    return None


def resolve_target(secrets_path, env=None, armed_path=ARMED_PATH, supa_env=SUPA_ENV,
                   sovereign_url=SOVEREIGN_REST_URL):
    """-> (source, url, key). source is 'env' | 'sovereign' | 'secrets-file' | None."""
    env = os.environ if env is None else env
    url = env.get("SUPABASE_URL")
    key = env.get("SUPABASE_SERVICE_KEY")
    if url and key:
        return "env", url.rstrip("/"), key
    if os.path.exists(armed_path):
        sk = _env_value(supa_env, "SERVICE_ROLE_KEY")
        if sk:
            return "sovereign", sovereign_url.rstrip("/"), sk
    if secrets_path and os.path.exists(secrets_path):
        try:
            with open(secrets_path, "r") as fh:
                d = json.load(fh)
            url = (d.get("url") or "").rstrip("/")
            key = d.get("service_key") or d.get("service_role_key")
            if url and key:
                return "secrets-file", url, key
        except (OSError, ValueError):
            pass
    return None, None, None


def load_target(secrets_path, quiet=False):
    """Drop-in for the loaders' load_secrets(path): (url, key), and one line to
    stderr naming WHICH backend the run will write to (DR-0076: say where it went)."""
    source, url, key = resolve_target(secrets_path)
    if source and not quiet:
        print("supabase target: {} ({})".format(source, url), file=sys.stderr)
    return url, key


def selftest():
    import tempfile
    passed = failed = 0

    def check(label, cond):
        nonlocal passed, failed
        if cond:
            passed += 1
            print("PASS " + label)
        else:
            failed += 1
            print("FAIL " + label)

    with tempfile.TemporaryDirectory() as d:
        armed = os.path.join(d, "REPOINT-ARMED")
        senv = os.path.join(d, ".env")
        secrets = os.path.join(d, "supabase.json")
        with open(secrets, "w") as f:
            json.dump({"url": "https://hosted.example.supabase.co/", "service_key": "hosted-key"}, f)
        # no record, no sovereign env -> the old behaviour
        check("without the record the secrets file wins (a tower keeps working)",
              resolve_target(secrets, env={}, armed_path=armed, supa_env=senv)
              == ("secrets-file", "https://hosted.example.supabase.co", "hosted-key"))
        # record present but no sovereign .env beside us -> still the file
        open(armed, "w").close()
        check("the record alone is not enough: no local sovereign .env -> secrets file",
              resolve_target(secrets, env={}, armed_path=armed, supa_env=senv)[0] == "secrets-file")
        # record + sovereign env -> sovereign, on THIS box
        with open(senv, "w") as f:
            f.write("POSTGRES_PASSWORD=x\nSERVICE_ROLE_KEY=sov-key\nANON_KEY=anon\n")
        check("CATCHES the case that bit: record + sovereign .env -> the sovereign door",
              resolve_target(secrets, env={}, armed_path=armed, supa_env=senv,
                             sovereign_url="http://127.0.0.1:8800/")
              == ("sovereign", "http://127.0.0.1:8800", "sov-key"))
        # explicit env still outranks everything
        check("explicit SUPABASE_URL + key outranks the record",
              resolve_target(secrets, env={"SUPABASE_URL": "https://x/", "SUPABASE_SERVICE_KEY": "k"},
                             armed_path=armed, supa_env=senv) == ("env", "https://x", "k"))
        # a sovereign .env without the key falls through honestly
        with open(senv, "w") as f:
            f.write("POSTGRES_PASSWORD=x\n")
        check("a sovereign .env missing SERVICE_ROLE_KEY falls through to the file, never a blank key",
              resolve_target(secrets, env={}, armed_path=armed, supa_env=senv)[0] == "secrets-file")
        os.remove(secrets)
        check("nothing configured -> (None, None, None), never an invented target",
              resolve_target(secrets, env={}, armed_path=armed, supa_env=senv) == (None, None, None))
    print("\n{}/{} passed".format(passed, passed + failed))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(selftest() if "--selftest" in sys.argv else 0)

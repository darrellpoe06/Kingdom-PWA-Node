#!/usr/bin/env python3
# =============================================================================
# cutover_sync.py -- copy the 23 accounts hosted -> sovereign, then measure
# parity with migrate_verify (independent reader, DR-0076)
# =============================================================================
# Darrell 2026-08-15: "drive it now until done." Runs on the NAS (python 3.8,
# stdlib + the repo-vendored pg8000 the box agent already proved live), only
# after replay_migrations.sh reports its ledger complete.
#
# COPY AS-IS (the ensemble-locked decision): auth.users and auth.identities
# rows transfer byte-faithfully -- UUIDs, encrypted password hashes, phone
# rows -- with NO identity merging in flight. Column lists are intersected
# between the two GoTrue versions so a schema drift can never invent values.
#
# STORAGE OBJECTS ARE NOT COPIED (named gap, not silence): storage.objects
# rows point at blob files that live in the hosted backend; copying rows
# without blobs fabricates working-looking links. The 3 buckets / 455 objects
# stay a recorded NOT-done with its own follow-up (DR-0307).
#
# Selftest: python3 cutover_sync.py --selftest   (pure logic, no network)
import json
import os
import ssl
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "nas-agent", ".vendor"))
sys.path.insert(0, HERE)

AGENT_ENV = "/volume1/docker/poetech/agent.env"
SUPA_ENV = os.environ.get("SUPABASE_DATA", "/volume1/docker/supabase") + "/.env"
CA_PATH = os.path.join(HERE, "..", "nas-agent", "supabase-prod-ca-2021.crt")

COPY_TABLES = ["users", "identities"]  # auth.<t>, in FK order


def env_value(path, key):
    try:
        with open(path) as f:
            for line in f:
                if line.startswith(key + "="):
                    return line.rstrip("\n").split("=", 1)[1]
    except OSError:
        return None
    return None


def intersect_columns(src_cols, dst_cols):
    """Ordered intersection: destination column order, only columns both hold.
    Pure -- the selftest pins that drift never invents or reorders values."""
    src = set(src_cols)
    return [c for c in dst_cols if c in src]


def copy_plan(src_cols, dst_cols, table):
    cols = intersect_columns(src_cols, dst_cols)
    col_list = ", ".join('"{}"'.format(c) for c in cols)
    select = 'SELECT {} FROM auth."{}"'.format(col_list, table)
    placeholders = ", ".join(":p{}".format(i) for i in range(len(cols)))
    insert = ('INSERT INTO auth."{}" ({}) VALUES ({}) '
              "ON CONFLICT DO NOTHING").format(table, col_list, placeholders)
    return cols, select, insert


def build_ssl_context():
    ctx = ssl.create_default_context()
    if os.path.exists(CA_PATH):
        ctx.load_verify_locations(cafile=CA_PATH)
    return ctx


def connect(url, use_tls):
    import pg8000.native
    from urllib.parse import urlparse
    u = urlparse(url)
    return pg8000.native.Connection(
        user=u.username, password=u.password, host=u.hostname,
        port=u.port or 5432, database=(u.path or "/postgres").lstrip("/"),
        ssl_context=build_ssl_context() if use_tls else None, timeout=30)


def table_columns(con, table):
    rows = con.run(
        "SELECT column_name FROM information_schema.columns "
        "WHERE table_schema='auth' AND table_name=:t "
        "AND is_generated='NEVER' ORDER BY ordinal_position", t=table)
    return [r[0] for r in rows]


def copy_table(src, dst, table):
    cols, select, insert = copy_plan(table_columns(src, table),
                                     table_columns(dst, table), table)
    rows = src.run(select)
    copied = 0
    for row in rows:
        params = {"p{}".format(i): v for i, v in enumerate(row)}
        dst.run(insert, **params)
        copied += 1
    return copied, len(rows)


def parity(con, queries):
    out = {}
    for name, q in queries.items():
        try:
            out[name] = con.run(q)[0][0]
        except Exception as e:  # noqa: BLE001 - a missing schema is a finding, not a crash
            out[name] = None
            print("parity: {} unmeasurable: {}".format(name, e))
    return out


def real_run(accounts_only=False):
    from migrate_verify import PARITY_QUERIES, compare_counts
    hosted_url = env_value(AGENT_ENV, "AGENT_DB_URL")
    pw = env_value(SUPA_ENV, "POSTGRES_PASSWORD")
    if not hosted_url or not pw:
        print("cutover-sync: missing AGENT_DB_URL or POSTGRES_PASSWORD - cannot run")
        return 2
    src = connect(hosted_url, use_tls=True)
    dst = connect("postgres://supabase_admin:{}@127.0.0.1:5433/postgres".format(pw),
                  use_tls=False)
    try:
        for t in COPY_TABLES:
            copied, total = copy_table(src, dst, t)
            print("cutover-sync: auth.{} copied {} rows (source holds {})".format(t, copied, total))
        # --accounts-only: the replay's hosted-baseline restore calls this
        # FIRST (DR-0308 measured 2026-08-18: pg_dump re-creates public FKs
        # after its data with immediate validation, and they reference
        # auth.users -- so the AS-IS account copy must land before the
        # public data does). Parity waits for the full run after replay.
        if accounts_only:
            print("cutover-sync: accounts-only copy complete")
            return 0
        s = parity(src, PARITY_QUERIES)
        d = parity(dst, PARITY_QUERIES)
        verdict = compare_counts(
            {k: v for k, v in s.items() if v is not None},
            {k: v for k, v in d.items() if v is not None})
        print("cutover-sync: parity " + json.dumps(
            {"matched": len(verdict["matched"]),
             "missing": verdict["missing"], "extra": verdict["extra"]}))
        print("cutover-sync: verdict " + ("GO" if verdict["go"] else "NO-GO"))
        return 0 if verdict["go"] else 1
    finally:
        src.close()
        dst.close()


def selftest():
    passed = failed = 0

    def check(label, cond):
        nonlocal passed, failed
        if cond:
            passed += 1
            print("PASS " + label)
        else:
            failed += 1
            print("FAIL " + label)

    check("intersection keeps destination order",
          intersect_columns(["b", "a", "c"], ["a", "b", "d"]) == ["a", "b"])
    check("CATCHES source-only columns (never invented on the target)",
          "c" not in intersect_columns(["c"], ["a", "b"]))
    cols, select, insert = copy_plan(["id", "email", "gone"], ["id", "email", "new"], "users")
    check("plan copies only shared columns", cols == ["id", "email"])
    check("insert is conflict-safe (re-runs never duplicate)",
          "ON CONFLICT DO NOTHING" in insert)
    check("select and insert carry identical column lists",
          '"id", "email"' in select and '"id", "email"' in insert)
    print("\n{}/{} passed".format(passed, passed + failed))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(selftest() if "--selftest" in sys.argv
             else real_run(accounts_only="--accounts-only" in sys.argv))

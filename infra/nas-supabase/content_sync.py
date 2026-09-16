#!/usr/bin/env python3
# =============================================================================
# content_sync.py -- carry the rows the NAS pipelines filed on the HOSTED project
# across to the SOVEREIGN database the app actually reads (DR-0442)
# =============================================================================
# WHAT BROKE (measured 2026-09-16). The Word -> Migdal showed "0 of 901
# messages . September 2026" while the church's own channel had four September
# services. The app has read the sovereign stack since REPOINT-ARMED landed on
# 2026-08-19 (DR-0310). The NAS ingest (youtube_load.py, proclaim_load.py, the
# transcript loaders) kept writing to /volume1/PoeTech/secrets/supabase.json,
# which names the HOSTED project. Hosted: 911 choir_sermons, newest 2026-09-13.
# Sovereign: 901. Hosted also carried 699 video_transcripts rows the sovereign
# database never saw. Third instance of one class: the repoint moved the
# readers (DR-0310), not the blobs (DR-0317), not the migrations (the replay
# lane), and not the WRITERS (this file).
#
# WHAT THIS DOES. For an explicit list of content tables, read BOTH databases
# independently, plan the difference by primary key, and carry it across:
#   * a row hosted has and sovereign lacks       -> INSERT ... ON CONFLICT DO NOTHING
#   * a row both hold where hosted was edited later (updated_at) -> UPDATE
# Columns are intersected by name so schema drift can never invent a value.
# Rows the SOVEREIGN side holds and hosted lacks (the app has written there
# since the repoint) are never touched and never counted as drift.
#
# HONEST BY CONSTRUCTION (DR-0076): dry-run by default and prints the plan;
# --commit writes; counts are re-read after writing; the verdict is GO only
# when nothing hosted-only remains. A table that could not be measured is a
# named finding, never a silent zero. Runs on the NAS (python 3.8, the vendored
# pg8000 beside nas-agent) exactly like cutover_sync.py.
#
# Selftest:  python3 content_sync.py --selftest        (pure logic, no network)
# Dry run:   python3 content_sync.py                    (reads both, writes nothing)
# Apply:     python3 content_sync.py --commit [--table choir_sermons]
# =============================================================================
import json
import os
import ssl
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "nas-agent", ".vendor"))

AGENT_ENV = "/volume1/docker/poetech/agent.env"
SUPA_ENV = os.environ.get("SUPABASE_DATA", "/volume1/docker/supabase") + "/.env"
CA_PATH = os.path.join(HERE, "..", "nas-agent", "supabase-prod-ca-2021.crt")

# FK order matters for inserts: a sermon points at its speaker, a transcript at
# its instance (present on both sides since the baseline). Self-references
# (choir_sermons.source_sermon_id) are satisfied by inserting oldest-first.
# FK order: a table is listed after every table it points at, so an insert never
# arrives before its parent. Self-references (choir_sermons.source_sermon_id,
# instances.parent_instance_id) are satisfied by inserting oldest-first.
CONTENT_TABLES = [
    "instances",
    "entities",
    "church_speakers",
    "choir_sermons",
    "sermon_prep",
    "video_transcripts",
    "sermon_video_stats",
    "video_harvests",
    "tlc_onboarding_invites",
    "tlc_jobs",
    "person_links",
]

# NOT CARRIED, AND NEVER SILENTLY (DR-0076 / DR-0443). These three tables hold
# rows the hosted project has and the sovereign side lacks, and copying them
# would be wrong rather than merely unnecessary. The report prints this list on
# every run so the gap is named rather than missing.
EXCLUDED_TABLES = {
    "ops_commands": "an operational command queue the NAS runner reads, not "
                    "content the family reads; a carried row is bookkeeping for "
                    "a run that happened on the other stack",
    "agent_tasks": "the same: a task queue with its own status column, whose "
                   "rows belong to the stack that ran them",
    "_sync_tokens": "a delta-read watermark. Carried into a database with "
                    "different contents it would make a delta reader SKIP rows "
                    "it has never seen, which is the one thing worse than a gap",
}

# NATURAL KEYS -- the break the first apply run found (2026-09-16, run
# 35097143467). choir_sermons and church_speakers carried across cleanly, and
# video_transcripts died on "duplicate key value violates unique constraint
# video_transcripts_uniq, Key (instance_id, video_id)": both sides held the
# same transcript under DIFFERENT primary keys, because the hosted row and the
# sovereign row were each minted by their own insert. Keyed by id, such a row
# reads as missing for ever -- a permanent NO-GO that is not a real gap -- and
# the insert aborts the table. So a table with a natural unique key is planned
# by THAT key, and every insert is conflict-safe against ANY unique index.
NATURAL_KEYS = {
    "video_transcripts": ["instance_id", "video_id"],
    "sermon_video_stats": ["instance_id", "video_id"],
    # Read from the live constraint catalogue 2026-09-16, never guessed:
    "instances": ["slug"],                      # tenants_slug_key
    "entities": ["instance_id", "slug"],        # entities_tenant_id_slug_key
    "tlc_onboarding_invites": ["token"],        # tlc_onboarding_invites_token_key
    "person_links": ["primary_user", "door_user"],  # its primary key; no id column
}
CHUNK = 50


def env_value(path, key):
    try:
        with open(path) as f:
            for line in f:
                if line.startswith(key + "="):
                    return line.rstrip("\n").split("=", 1)[1].strip()
    except OSError:
        return None
    return None


# --- pure planning (selftested) ----------------------------------------------

def intersect_columns(src_cols, dst_cols):
    """Destination order, only names both sides hold. Never invents a column."""
    src = set(src_cols)
    return [c for c in dst_cols if c in src]


def plan_sync(src_index, dst_index):
    """src/dst index: {id: updated_at-or-None}. Returns the ids to insert (hosted
    only) and the ids to update (both hold it, hosted edited later). Sovereign-only
    rows are deliberately absent from the plan: they are the app's own writes."""
    inserts = sorted(i for i in src_index if i not in dst_index)
    updates = []
    for i, su in src_index.items():
        if i not in dst_index or su is None:
            continue
        du = dst_index[i]
        if du is None or su > du:
            updates.append(i)
    return inserts, sorted(updates)


def key_expr(key_cols):
    """The SQL that renders a row's key as one text value. Used identically for
    the index read, the row fetch and the update's WHERE, so the three can never
    disagree about what identifies a row."""
    if key_cols == ["id"]:
        return "id::text"
    return "concat_ws('|', {})".format(", ".join('"{}"::text'.format(c) for c in key_cols))


def key_cols_for(table, cols):
    """The natural key when the table has one AND this copy carries every one of
    its columns; otherwise the primary key. A natural key we cannot fully read is
    never guessed at, and a table with neither returns None so the caller reports
    it as unmeasurable rather than copying rows it cannot identify.
    (person_links and _sync_tokens have no id column at all, which is why this
    cannot simply assume one -- DR-0443.)"""
    nat = NATURAL_KEYS.get(table)
    if nat and all(c in cols for c in nat):
        return list(nat)
    if "id" in cols:
        return ["id"]
    return None


def insert_sql(table, cols):
    col_list = ", ".join('"{}"'.format(c) for c in cols)
    placeholders = ", ".join(":p{}".format(i) for i in range(len(cols)))
    # Bare ON CONFLICT DO NOTHING, not ON CONFLICT (id): a row already present
    # under a different primary key collides on the table's natural unique index,
    # and that must SKIP rather than abort the whole table (the 2026-09-16 break).
    return ('INSERT INTO public."{}" ({}) VALUES ({}) ON CONFLICT DO NOTHING'
            .format(table, col_list, placeholders))


def update_sql(table, cols, key_cols):
    # id is never in the SET: on a natural-key match the two sides hold different
    # primary keys, and rewriting one would break every row that references it.
    sets = ", ".join('"{}" = :p{}'.format(c, i) for i, c in enumerate(cols) if c != "id")
    return 'UPDATE public."{}" SET {} WHERE {} = :k'.format(table, sets, key_expr(key_cols))


def chunks(items, n):
    for i in range(0, len(items), n):
        yield items[i:i + n]


def verdict(report):
    """GO only when every measured table has nothing hosted-only left and no
    table was unmeasurable. Copying zero when hosted holds more is never GO."""
    for t in report.values():
        if t.get("error"):
            return False
        if t.get("missing_after", 0) > 0 or t.get("stale_after", 0) > 0:
            return False
    return True


# --- database ---------------------------------------------------------------

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
        ssl_context=build_ssl_context() if use_tls else None, timeout=60)


def table_columns(con, table):
    rows = con.run(
        "SELECT column_name FROM information_schema.columns "
        "WHERE table_schema='public' AND table_name=:t "
        "AND is_generated='NEVER' ORDER BY ordinal_position", t=table)
    return [r[0] for r in rows]


def read_index(con, table, has_updated, key_cols):
    """{key: newest updated_at for that key}. MAX, not last-row-wins: a natural
    key can cover several rows on one side (hosted allows what a sovereign unique
    index forbids), and an arbitrary pick would make the plan flap day to day."""
    q = ('SELECT {} AS k, {} FROM public."{}"'
         .format(key_expr(key_cols), "max(updated_at)" if has_updated else "NULL", table))
    q += " GROUP BY 1" if has_updated else ""
    return {r[0]: r[1] for r in con.run(q)}


def fetch_rows(con, table, cols, keys, order_col, key_cols):
    col_list = ", ".join('"{}"'.format(c) for c in cols)
    order = ' ORDER BY "{}" ASC NULLS FIRST, id::text'.format(order_col) if order_col else " ORDER BY id::text"
    return con.run('SELECT {} FROM public."{}" WHERE {} = ANY(:keys){}'
                   .format(col_list, table, key_expr(key_cols), order), keys=keys)


def sync_table(src, dst, table, commit):
    out = {"table": table}
    src_cols = table_columns(src, table)
    dst_cols = table_columns(dst, table)
    if not src_cols or not dst_cols:
        out["error"] = "table missing on {}".format("hosted" if not src_cols else "sovereign")
        return out
    cols = intersect_columns(src_cols, dst_cols)
    key_cols = key_cols_for(table, cols)
    if key_cols is None:
        out["error"] = "no shared key: neither an id column nor a known natural key"
        return out
    has_updated = "updated_at" in cols
    order_col = "created_at" if "created_at" in cols else None
    s_idx = read_index(src, table, has_updated, key_cols)
    d_idx = read_index(dst, table, has_updated, key_cols)
    inserts, updates = plan_sync(s_idx, d_idx)
    out.update({"hosted": len(s_idx), "sovereign_before": len(d_idx),
                "missing": len(inserts), "stale": len(updates),
                "copied": 0, "updated": 0, "columns": len(cols),
                "keyed_by": "+".join(key_cols)})
    if commit:
        ins = insert_sql(table, cols)
        for batch in chunks(inserts, CHUNK):
            for row in fetch_rows(src, table, cols, batch, order_col, key_cols):
                dst.run(ins, **{"p{}".format(i): v for i, v in enumerate(row)})
                out["copied"] += 1
        upd = update_sql(table, cols, key_cols)
        key_at = [cols.index(c) for c in key_cols]
        for batch in chunks(updates, CHUNK):
            for row in fetch_rows(src, table, cols, batch, order_col, key_cols):
                params = {"p{}".format(i): v for i, v in enumerate(row) if cols[i] != "id"}
                params["k"] = "|".join("" if row[i] is None else str(row[i]) for i in key_at)
                dst.run(upd, **params)
                out["updated"] += 1
        d2 = read_index(dst, table, has_updated, key_cols)
        s2 = read_index(src, table, has_updated, key_cols)
        i2, u2 = plan_sync(s2, d2)
        out.update({"sovereign_after": len(d2), "missing_after": len(i2), "stale_after": len(u2)})
    else:
        out.update({"sovereign_after": len(d_idx), "missing_after": len(inserts), "stale_after": len(updates)})
    return out


def real_run(commit, only_table=None):
    hosted_url = env_value(AGENT_ENV, "AGENT_DB_URL")
    pw = env_value(SUPA_ENV, "POSTGRES_PASSWORD")
    if not hosted_url or not pw:
        print("content-sync: missing AGENT_DB_URL ({}) or POSTGRES_PASSWORD ({}) - cannot measure"
              .format(AGENT_ENV, SUPA_ENV))
        return 2
    tables = [only_table] if only_table else CONTENT_TABLES
    src = connect(hosted_url, use_tls=True)
    dst = connect("postgres://supabase_admin:{}@127.0.0.1:5433/postgres".format(pw), use_tls=False)
    report = {}
    try:
        for t in tables:
            try:
                r = sync_table(src, dst, t, commit)
            except Exception as e:  # noqa: BLE001 - a table that cannot be measured is a finding
                r = {"table": t, "error": str(e)[:200]}
            report[t] = r
            if r.get("error"):
                print("content-sync: {} UNMEASURABLE: {}".format(t, r["error"]))
            else:
                print("content-sync: {} hosted={} sovereign_before={} missing={} stale={} copied={} updated={} sovereign_after={} missing_after={} stale_after={}"
                      .format(t, r["hosted"], r["sovereign_before"], r["missing"], r["stale"],
                              r["copied"], r["updated"], r["sovereign_after"], r["missing_after"], r["stale_after"]))
    finally:
        src.close()
        dst.close()
    go = verdict(report)
    for t, why in sorted(EXCLUDED_TABLES.items()):
        print("content-sync: NOT CARRIED {} -- {}".format(t, why))
    print("content-sync: mode " + ("COMMIT" if commit else "DRY-RUN"))
    print("content-sync: summary " + json.dumps(report, default=str))
    print("content-sync: verdict " + ("GO" if go else "NO-GO"))
    return 0 if go else 1


# --- selftest ---------------------------------------------------------------

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

    check("intersection keeps destination order and never invents a column",
          intersect_columns(["b", "a", "gone"], ["a", "b", "new"]) == ["a", "b"])
    ins, upd = plan_sync({"a": None, "b": None, "c": None}, {"a": None})
    check("CATCHES rows hosted has and sovereign lacks", ins == ["b", "c"])
    check("rows without updated_at are never updates", upd == [])
    ins, upd = plan_sync({"a": 2, "b": 1}, {"a": 1, "b": 1})
    check("CATCHES a row hosted edited after sovereign", upd == ["a"] and ins == [])
    ins, upd = plan_sync({"a": 1}, {"a": 1, "z": 9})
    check("sovereign-only rows (the app's own writes) are never in the plan",
          ins == [] and upd == [] )
    ins, upd = plan_sync({"a": 1}, {"a": None})
    check("a sovereign row with no updated_at yields to a dated hosted edit", upd == ["a"])
    ins, upd = plan_sync({"a": 1}, {"a": 5})
    check("a sovereign edit NEWER than hosted is left alone", upd == [])
    check("insert is conflict-safe (re-runs never duplicate)",
          "ON CONFLICT DO NOTHING" in insert_sql("choir_sermons", ["id", "title"]))
    check("CATCHES the 2026-09-16 break: the insert must not name only the primary "
          "key, or a row present under a different id aborts the whole table",
          "ON CONFLICT (id)" not in insert_sql("video_transcripts", ["id", "video_id"]))
    check("update never rewrites the key",
          '"id" =' not in update_sql("choir_sermons", ["id", "title"], ["id"]).split("WHERE")[0])
    # Natural keys: the same break, on the planning side.
    check("a table with a natural key is planned by it, not by id",
          key_cols_for("video_transcripts", ["id", "instance_id", "video_id", "text"])
          == ["instance_id", "video_id"])
    check("a natural key we cannot fully read is never guessed at",
          key_cols_for("video_transcripts", ["id", "video_id"]) == ["id"])
    check("a table with no natural key keeps the primary key",
          key_cols_for("choir_sermons", ["id", "title"]) == ["id"])
    check("the key expression is identical for the index, the fetch and the update",
          key_expr(["instance_id", "video_id"])
          == "concat_ws('|', \"instance_id\"::text, \"video_id\"::text)"
          and key_expr(["instance_id", "video_id"]) in update_sql(
              "video_transcripts", ["id", "instance_id", "video_id", "text"],
              ["instance_id", "video_id"]))
    check("CATCHES the false permanent gap: a row held on BOTH sides under "
          "different ids reads as present, never as missing for ever",
          plan_sync({"inst|vid": None}, {"inst|vid": None}) == ([], []))
    check("chunking covers every id exactly once",
          sum(len(c) for c in chunks(list(range(123)), CHUNK)) == 123)
    check("verdict GO when nothing hosted-only remains",
          verdict({"t": {"missing_after": 0, "stale_after": 0}}))
    check("CATCHES a table that copied zero while hosted holds more (never GO)",
          not verdict({"t": {"missing": 4, "copied": 0, "missing_after": 4, "stale_after": 0}}))
    check("CATCHES an unmeasurable table (never a silent zero)",
          not verdict({"t": {"error": "table missing on sovereign"}}))
    check("the content list starts with the FK parents",
          CONTENT_TABLES.index("instances") < CONTENT_TABLES.index("entities")
          and CONTENT_TABLES.index("church_speakers") < CONTENT_TABLES.index("choir_sermons")
          < CONTENT_TABLES.index("sermon_prep")
          and CONTENT_TABLES.index("instances") == 0)
    # Tables with no id column at all (person_links, _sync_tokens) -- the second
    # thing the live catalogue read on 2026-09-16 turned up.
    check("a table with NO id column is keyed by its natural key, not skipped",
          key_cols_for("person_links", ["primary_user", "door_user", "created_at"])
          == ["primary_user", "door_user"])
    check("CATCHES a table with neither an id nor a known natural key: None, so "
          "the caller reports it unmeasurable rather than copying rows it cannot identify",
          key_cols_for("some_unknown_table", ["a", "b"]) is None)
    check("an UPDATE on a no-id table still never names id in its SET",
          '"id"' not in update_sql("person_links", ["primary_user", "door_user"],
                                   ["primary_user", "door_user"]))
    # The exclusions are a decision, and they are printed rather than silent.
    check("the queues and the watermark are NOT in the carry list",
          all(t not in CONTENT_TABLES for t in ("ops_commands", "agent_tasks", "_sync_tokens")))
    check("every exclusion carries a stated reason",
          all(len(v) > 40 for v in EXCLUDED_TABLES.values()))
    check("the watermark exclusion names the skip-rows danger, not just tidiness",
          "SKIP" in EXCLUDED_TABLES["_sync_tokens"])
    print("\n{}/{} passed".format(passed, passed + failed))
    return 1 if failed else 0


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        sys.exit(selftest())
    only = None
    if "--table" in sys.argv:
        only = sys.argv[sys.argv.index("--table") + 1]
    sys.exit(real_run(commit="--commit" in sys.argv, only_table=only))

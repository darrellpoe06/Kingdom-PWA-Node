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

# FOREIGN KEYS, READ FROM THE LIVE CATALOGUE 2026-09-16 (never guessed).
#
# THE BREAK THIS CLOSES. The first full apply run carried nine tables and died
# on three, with two distinct causes. The first: `entities` failed
# `entities_tenant_id_fkey` on Key (instance_id)=(3f222e86-...), and
# `tlc_onboarding_invites` failed the same way. Both parents were MATCHED --
# their `instances` row exists on the sovereign side under its natural key
# (slug) -- but sovereign minted it with a DIFFERENT PRIMARY KEY. So the child's
# instance_id pointed at an id the sovereign database has never held, and the
# insert was correctly refused.
#
# A natural-key match therefore implies a possible id TRANSLATION for every row
# that points at that parent. This map is what makes the translation possible:
# child table -> {column: parent table}. A table is its own parent where it
# self-references, and that case is handled by computing the remap BEFORE the
# table's own insert loop, so it reflects the rows that already matched.
FK_COLUMNS = {
    "instances": {"parent_instance_id": "instances"},
    "entities": {"instance_id": "instances", "parent_entity_id": "entities"},
    "church_speakers": {"instance_id": "instances"},
    "choir_sermons": {"instance_id": "instances", "speaker_id": "church_speakers",
                      "source_speaker_id": "church_speakers",
                      "source_sermon_id": "choir_sermons"},
    "sermon_prep": {"instance_id": "instances", "sermon_id": "choir_sermons"},
    "video_transcripts": {"instance_id": "instances"},
    "sermon_video_stats": {"instance_id": "instances"},
    "video_harvests": {"instance_id": "instances"},
    "tlc_onboarding_invites": {"instance_id": "instances"},
    "tlc_jobs": {"instance_id": "instances"},
}


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


def json_placeholder(col, i, json_cols):
    """The bind marker for one column. A json/jsonb column carries an explicit
    cast, which is the second half of the 2026-09-16 break: pg8000 sends a
    Python list as a POSTGRES ARRAY literal, so `requirements = []` arrived in a
    jsonb column as `{}` -- an empty OBJECT -- and tlc_jobs_requirements_check
    (jsonb_typeof = 'array') refused it. Bound as JSON TEXT with a cast, `[]`
    stays an array."""
    return ":p{}::{}".format(i, json_cols[col]) if col in json_cols else ":p{}".format(i)


def bind_value(value, is_json):
    """What actually goes on the wire for one value. A json column is sent as
    JSON TEXT; a value pg8000 already handed back as text is passed through
    rather than encoded twice."""
    if not is_json or value is None:
        return value
    if isinstance(value, str):
        return value
    return json.dumps(value)


def bind_row(row, cols, json_cols):
    return [bind_value(v, cols[i] in json_cols) for i, v in enumerate(row)]


def join_key(parts):
    """The text key EXACTLY as concat_ws('|', ...) renders it in SQL: a NULL
    component is SKIPPED, not written as empty. (The old update path joined a
    null component as '', which could never match the row it meant -- fixed
    here by having one renderer instead of two.)"""
    return "|".join(p for p in parts if p is not None)


def translate_key(parts, key_cols, table, remaps):
    """THE KEY ITSELF is translated, not only the row (2026-09-16, second pass).
    A natural key that CONTAINS a foreign key -- entities is
    (instance_id, slug) -- cannot be compared across the two databases until
    that component is in the destination's terms. Untranslated, hosted's
    (hosted_inst | slug) and sovereign's (sov_inst | slug) NEVER match, so the
    row reads as missing for ever: the same false-permanent-gap the natural-key
    fix closed, one level up. Measured in run 35111252952: entities reported
    copied=2 while sovereign_after stayed 6, because the insert then collided
    on entities_tenant_id_slug_key and did nothing."""
    fks = FK_COLUMNS.get(table) or {}
    out = []
    for i, c in enumerate(key_cols):
        v = parts[i]
        parent = fks.get(c)
        if parent and v is not None:
            v = remaps.get(parent, {}).get(str(v), v)
        out.append(None if v is None else str(v))
    return tuple(out)


def build_remap(src_ids, dst_ids):
    """{hosted id: sovereign id} for every row the two sides hold under the SAME
    natural key and a DIFFERENT primary key. Inputs are {key: id} per side.
    Rows that agree are absent (nothing to translate); a row only hosted has is
    absent too (its parent rides across with its own id)."""
    out = {}
    for k, sid in src_ids.items():
        did = dst_ids.get(k)
        if did is not None and sid is not None and str(did) != str(sid):
            out[str(sid)] = did
    return out


def remap_row(row, cols, table, remaps):
    """Translate this row's foreign keys through the parents' id maps. A value
    with no translation is passed through unchanged -- that is the common case
    (the two sides agree) and also the honest one (an unknown parent must fail
    the FK, not be silently re-pointed at something else)."""
    fks = FK_COLUMNS.get(table)
    if not fks:
        return list(row)
    out = list(row)
    for i, c in enumerate(cols):
        parent = fks.get(c)
        if not parent or out[i] is None:
            continue
        mapped = remaps.get(parent, {}).get(str(out[i]))
        if mapped is not None:
            out[i] = mapped
    return out


def insert_sql(table, cols, json_cols=None):
    json_cols = json_cols or {}
    col_list = ", ".join('"{}"'.format(c) for c in cols)
    placeholders = ", ".join(json_placeholder(c, i, json_cols) for i, c in enumerate(cols))
    # Bare ON CONFLICT DO NOTHING, not ON CONFLICT (id): a row already present
    # under a different primary key collides on the table's natural unique index,
    # and that must SKIP rather than abort the whole table (the 2026-09-16 break).
    # RETURNING 1 so the caller can tell a real insert from a conflict SKIP.
    # Without it, `copied` counted rows ON CONFLICT DO NOTHING had discarded --
    # a false number in the tool whose whole job is measurement (run
    # 35111252952 reported entities copied=2 with sovereign_after unchanged).
    return ('INSERT INTO public."{}" ({}) VALUES ({}) ON CONFLICT DO NOTHING RETURNING 1'
            .format(table, col_list, placeholders))


def update_sql(table, cols, key_cols, json_cols=None):
    # id is never in the SET: on a natural-key match the two sides hold different
    # primary keys, and rewriting one would break every row that references it.
    json_cols = json_cols or {}
    sets = ", ".join('"{}" = {}'.format(c, json_placeholder(c, i, json_cols))
                     for i, c in enumerate(cols) if c != "id")
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
        # A row the database refused is a finding even when the re-count happens
        # to come out even (a refused UPDATE leaves the row present but stale-by
        # -content, which the key-based re-count cannot see).
        if t.get("refused", 0) > 0:
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
    return [c for c, _ in table_columns_typed(con, table)]


def table_columns_typed(con, table):
    """[(name, data_type)] in ordinal order. The TYPE is read because a
    json/jsonb column has to be bound differently (json_placeholder) -- reading
    it is the alternative to a second hand-kept list of which columns are json,
    and this repo has already paid for one of those (DR-0443's note on
    crm_capture_lead)."""
    rows = con.run(
        "SELECT column_name, data_type FROM information_schema.columns "
        "WHERE table_schema='public' AND table_name=:t "
        "AND is_generated='NEVER' ORDER BY ordinal_position", t=table)
    return [(r[0], r[1]) for r in rows]


def read_id_map(con, table, key_cols):
    """{natural key: primary key}. One row per key (the newest id wins by text
    order, deterministically), so a key covering several rows cannot make the
    translation flap. Returns {} for a table keyed by id -- there is nothing to
    translate when both sides use the same primary key by definition."""
    if key_cols == ["id"]:
        return {}
    q = ('SELECT {} AS k, max(id::text) FROM public."{}" GROUP BY 1'
         .format(key_expr(key_cols), table))
    return {r[0]: r[1] for r in con.run(q)}


def read_index(con, table, has_updated, key_cols):
    """{(component, ...): newest updated_at for that key}.

    The components are read SEPARATELY rather than pre-joined, so a key that
    CONTAINS a foreign key can be translated into the other database's terms
    before the two sides are compared (translate_key). MAX, not last-row-wins:
    a natural key can cover several rows on one side (hosted allows what a
    sovereign unique index forbids), and an arbitrary pick would make the plan
    flap day to day."""
    n = len(key_cols)
    parts = ("id::text" if key_cols == ["id"]
             else ", ".join('"{}"::text'.format(c) for c in key_cols))
    q = ('SELECT {}, {} FROM public."{}"'
         .format(parts, "max(updated_at)" if has_updated else "NULL", table))
    if has_updated:
        q += " GROUP BY " + ", ".join(str(i + 1) for i in range(n))
    return {tuple(r[:n]): r[n] for r in con.run(q)}


def fetch_rows(con, table, cols, keys, order_col, key_cols):
    col_list = ", ".join('"{}"'.format(c) for c in cols)
    order = ' ORDER BY "{}" ASC NULLS FIRST, id::text'.format(order_col) if order_col else " ORDER BY id::text"
    return con.run('SELECT {} FROM public."{}" WHERE {} = ANY(:keys){}'
                   .format(col_list, table, key_expr(key_cols), order), keys=keys)


def parent_remap(src, dst, table, remaps):
    """Fill `remaps[table]` with that parent's {hosted id: sovereign id}, once.
    Read from whatever key the parent is actually planned by, so the map can
    never disagree with the plan about what identifies a row."""
    if table in remaps:
        return remaps[table]
    cols = intersect_columns(table_columns(src, table), table_columns(dst, table))
    key_cols = key_cols_for(table, cols)
    if not key_cols or key_cols == ["id"]:
        remaps[table] = {}
    else:
        remaps[table] = build_remap(read_id_map(src, table, key_cols),
                                    read_id_map(dst, table, key_cols))
    return remaps[table]


def sync_table(src, dst, table, commit, remaps=None):
    remaps = {} if remaps is None else remaps
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
    # Which of the carried columns are json/jsonb, by type rather than by name.
    types = dict(table_columns_typed(dst, table))
    json_cols = {c: types[c] for c in cols if types.get(c) in ("json", "jsonb")}
    # THE PARENTS' ID MAPS ARE NEEDED BEFORE THE PLAN, not only before the
    # write: a key containing a foreign key cannot be compared across the two
    # databases until that component is translated (translate_key). Computing
    # them here also means a DRY RUN reports the real gap rather than a phantom
    # one. A self-reference is still computed before this table's own inserts.
    for parent in sorted(set(FK_COLUMNS.get(table, {}).values())):
        try:
            parent_remap(src, dst, parent, remaps)
        except Exception as e:  # noqa: BLE001 - an unreadable parent is reported, not fatal
            out.setdefault("remap_warnings", []).append("{}: {}".format(parent, str(e)[:120]))
    translated_parents = sum(1 for p in set(FK_COLUMNS.get(table, {}).values()) if remaps.get(p))
    if translated_parents:
        out["parents_translated"] = translated_parents

    def plan_now():
        """(inserts, updates, src_key_of, hosted_count, sovereign_count).
        The plan is computed in the DESTINATION'S key terms; `src_key_of` maps
        each back to the hosted key the row is fetched by, so the fetch and the
        WHERE can never drift apart."""
        s_parts = read_index(src, table, has_updated, key_cols)
        d_parts = read_index(dst, table, has_updated, key_cols)
        d_keys = {join_key(p): u for p, u in d_parts.items()}
        s_keys = {}
        back = {}
        for parts, upd in s_parts.items():
            t = join_key(translate_key(parts, key_cols, table, remaps))
            s_keys[t] = upd
            back[t] = join_key(parts)
        i, u = plan_sync(s_keys, d_keys)
        return i, u, back, len(s_keys), len(d_keys)

    inserts, updates, src_key_of, s_count, d_count = plan_now()
    out.update({"hosted": s_count, "sovereign_before": d_count,
                "missing": len(inserts), "stale": len(updates),
                "copied": 0, "updated": 0, "columns": len(cols),
                "keyed_by": "+".join(key_cols)})
    if commit:
        ins = insert_sql(table, cols, json_cols)
        out["refused"] = 0
        out["skipped_existing"] = 0
        for batch in chunks([src_key_of[k] for k in inserts], CHUNK):
            for row in fetch_rows(src, table, cols, batch, order_col, key_cols):
                row = bind_row(remap_row(row, cols, table, remaps), cols, json_cols)
                # ONE BAD ROW MUST NOT HIDE THE TABLE (2026-09-16). The first
                # apply run lost every measurement for video_transcripts because
                # a single conflicting row raised out of the whole table. A row
                # the database refuses is now COUNTED and named, the rest are
                # carried, and the re-count below still decides the verdict -- so
                # nothing is rounded to zero either way (DR-0076).
                try:
                    wrote = dst.run(ins, **{"p{}".format(i): v for i, v in enumerate(row)})
                    # RETURNING 1 came back empty => ON CONFLICT DO NOTHING
                    # discarded it. That is NOT a copy, and calling it one is
                    # the kind of false number this tool exists to prevent.
                    if wrote:
                        out["copied"] += 1
                    else:
                        out["skipped_existing"] += 1
                except Exception as e:  # noqa: BLE001
                    out["refused"] += 1
                    out.setdefault("refused_reason", str(e)[:200])
        upd = update_sql(table, cols, key_cols, json_cols)
        key_at = [cols.index(c) for c in key_cols]
        for batch in chunks(updates, CHUNK):
            for row in fetch_rows(src, table, cols, [src_key_of[k] for k in batch],
                                  order_col, key_cols):
                # The WHERE must name the row in the DESTINATION'S terms, so the
                # key is translated exactly as the plan translated it.
                parts = tuple(None if row[i] is None else str(row[i]) for i in key_at)
                k = join_key(translate_key(parts, key_cols, table, remaps))
                vals = bind_row(remap_row(row, cols, table, remaps), cols, json_cols)
                params = {"p{}".format(i): v for i, v in enumerate(vals) if cols[i] != "id"}
                params["k"] = k
                try:
                    dst.run(upd, **params)
                    out["updated"] += 1
                except Exception as e:  # noqa: BLE001
                    out["refused"] += 1
                    out.setdefault("refused_reason", str(e)[:200])
        i2, u2, _, _, d2 = plan_now()
        out.update({"sovereign_after": d2, "missing_after": len(i2), "stale_after": len(u2)})
    else:
        out.update({"sovereign_after": d_count, "missing_after": len(inserts),
                    "stale_after": len(updates)})
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
    remaps = {}
    try:
        for t in tables:
            try:
                r = sync_table(src, dst, t, commit, remaps)
            except Exception as e:  # noqa: BLE001 - a table that cannot be measured is a finding
                r = {"table": t, "error": str(e)[:200]}
            report[t] = r
            if r.get("error"):
                print("content-sync: {} UNMEASURABLE: {}".format(t, r["error"]))
            else:
                line = ("content-sync: {} hosted={} sovereign_before={} missing={} stale={} copied={} updated={} sovereign_after={} missing_after={} stale_after={}"
                        .format(t, r["hosted"], r["sovereign_before"], r["missing"], r["stale"],
                                r["copied"], r["updated"], r["sovereign_after"], r["missing_after"], r["stale_after"]))
                if r.get("refused"):
                    line += " refused={}".format(r["refused"])
                if r.get("parents_translated"):
                    line += " parents_translated={}".format(r["parents_translated"])
                print(line)
                if r.get("refused_reason"):
                    print("content-sync: {} refused a row: {}".format(t, r["refused_reason"]))
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

    # ---- the FIRST of the two 2026-09-16 apply-run causes: a matched parent
    # held under a different primary key, so its children pointed at ids the
    # sovereign database has never had (entities, tlc_onboarding_invites).
    HOSTED_INST = "3f222e86-0000-0000-0000-000000000001"
    SOV_INST = "9c111111-0000-0000-0000-000000000002"
    remaps = {"instances": {HOSTED_INST: SOV_INST}}
    check("CATCHES the FK break: a child's instance_id is translated to the id "
          "the sovereign side actually holds that parent under",
          remap_row(("row-1", HOSTED_INST, "poe-properties"),
                    ["id", "instance_id", "slug"], "entities", remaps)
          == ["row-1", SOV_INST, "poe-properties"])
    check("a foreign key with no translation is passed through unchanged, so an "
          "unknown parent fails its FK rather than being re-pointed silently",
          remap_row(("row-1", "other-inst"), ["id", "instance_id"], "entities", remaps)[1]
          == "other-inst")
    check("a null foreign key is left null",
          remap_row(("row-1", None), ["id", "instance_id"], "entities", remaps)[1] is None)
    check("a table with no foreign keys is untouched",
          remap_row(("a", "b"), ["primary_user", "door_user"], "person_links", remaps)
          == ["a", "b"])
    check("a self-reference is translated through the table's OWN map",
          remap_row(("kid", HOSTED_INST), ["id", "parent_entity_id"], "entities",
                    {"entities": {HOSTED_INST: SOV_INST}})[1] == SOV_INST)
    check("every FK column names a table that is actually carried",
          all(parent in CONTENT_TABLES
              for fks in FK_COLUMNS.values() for parent in fks.values()))
    check("every FK child is carried AFTER its parent, or is its own parent",
          all(child == parent or CONTENT_TABLES.index(parent) < CONTENT_TABLES.index(child)
              for child, fks in FK_COLUMNS.items() for parent in fks.values()))
    check("the id map is built only where the two sides disagree",
          build_remap({"k1": "a", "k2": "same"}, {"k1": "b", "k2": "same"}) == {"a": "b"})
    check("a parent only hosted has is not in the map (it rides across as itself)",
          build_remap({"k1": "a"}, {}) == {})
    check("a table keyed by id needs no translation at all",
          build_remap({}, {}) == {})

    # ---- the SECOND cause: tlc_jobs_requirements_check refused `[]` because
    # pg8000 sends a Python list as a POSTGRES ARRAY literal, so an empty list
    # arrived in jsonb as `{}` -- an empty OBJECT, not an array.
    check("CATCHES the jsonb break: a json column is bound as json text, so an "
          "empty list stays an ARRAY and the requirements check passes",
          bind_value([], True) == "[]")
    check("a json object survives the crossing as an object",
          bind_value({"a": 1}, True) == '{"a": 1}')
    check("text pg8000 already handed back as json is not encoded twice",
          bind_value('{"a": 1}', True) == '{"a": 1}')
    check("a null json value stays null", bind_value(None, True) is None)
    check("a NON-json column is never json-encoded (a text[] must stay an array)",
          bind_value(["a", "b"], False) == ["a", "b"])
    check("the insert casts a jsonb column and nothing else",
          "VALUES (:p0, :p1::jsonb) ON CONFLICT DO NOTHING"
          in insert_sql("tlc_jobs", ["id", "requirements"], {"requirements": "jsonb"}))
    check("the update casts it the same way, through the one placeholder builder",
          '"requirements" = :p1::jsonb' in update_sql(
              "tlc_jobs", ["id", "requirements"], ["id"], {"requirements": "jsonb"}))
    check("a json (not jsonb) column is cast to its own type, not coerced",
          ":p1::json" in insert_sql("t", ["id", "doc"], {"doc": "json"}))
    check("bind_row binds every column by its own type",
          bind_row(("x", [], "plain"), ["id", "requirements", "title"], {"requirements": "jsonb"})
          == ["x", "[]", "plain"])

    # ---- one bad row must not cost the whole table's measurement
    check("CATCHES a refused row: never GO, even when the key re-count comes out even",
          not verdict({"t": {"missing_after": 0, "stale_after": 0, "refused": 1}}))
    check("no refusals is still GO",
          verdict({"t": {"missing_after": 0, "stale_after": 0, "refused": 0}}))

    # ---- THE SECOND PASS, from run 35111252952: entities reported copied=2
    # while sovereign_after stayed 6 and missing_after stayed 2. Two defects.
    #
    # (a) A natural key that CONTAINS a foreign key was compared UNTRANSLATED,
    #     so hosted's (hosted_inst | slug) never matched sovereign's
    #     (sov_inst | slug) and the row read as missing for ever -- the same
    #     false-permanent-gap the natural-key fix closed, one level up.
    KEY_COLS = ["instance_id", "slug"]
    rm = {"instances": {HOSTED_INST: SOV_INST}}
    check("CATCHES the untranslated key: a key containing a foreign key is "
          "compared in the DESTINATION'S terms, so the row is seen as present",
          join_key(translate_key((HOSTED_INST, "poe-properties"), KEY_COLS, "entities", rm))
          == "{}|poe-properties".format(SOV_INST))
    check("and with the translation the plan finds NOTHING missing, where "
          "before it found a permanent phantom gap",
          plan_sync({join_key(translate_key((HOSTED_INST, "poe-properties"), KEY_COLS, "entities", rm)): None},
                    {"{}|poe-properties".format(SOV_INST): None}) == ([], []))
    check("a key component with no translation is left exactly as it is",
          translate_key(("other-inst", "x"), KEY_COLS, "entities", rm) == ("other-inst", "x"))
    check("a key column that is NOT a foreign key is never translated",
          translate_key((HOSTED_INST, HOSTED_INST), ["instance_id", "slug"], "entities", rm)
          == (SOV_INST, HOSTED_INST))
    check("the key renderer matches concat_ws: a NULL component is SKIPPED, "
          "not written as an empty string (the old update path joined it as '')",
          join_key(("a", None, "b")) == "a|b" and join_key((None,)) == "")
    check("an id-keyed table's key is one component and is never translated",
          translate_key(("row-9",), ["id"], "entities", rm) == ("row-9",)
          and join_key(("row-9",)) == "row-9")

    # (b) `copied` counted rows ON CONFLICT DO NOTHING had thrown away -- a
    #     false number in the tool whose entire job is measurement.
    check("CATCHES the false copy count: the insert RETURNS, so a conflict "
          "skip can be told apart from a real write",
          "RETURNING 1" in insert_sql("entities", ["id", "slug"]))
    check("a conflict skip is never GO by itself -- the re-count still decides",
          not verdict({"t": {"missing_after": 2, "stale_after": 0, "skipped_existing": 2}}))
    print("\n{}/{} passed".format(passed, passed + failed))
    return 1 if failed else 0


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        sys.exit(selftest())
    only = None
    if "--table" in sys.argv:
        only = sys.argv[sys.argv.index("--table") + 1]
    sys.exit(real_run(commit="--commit" in sys.argv, only_table=only))

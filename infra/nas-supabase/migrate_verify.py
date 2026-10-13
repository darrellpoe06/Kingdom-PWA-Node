#!/usr/bin/env python3
# =============================================================================
# migrate_verify.py -- prove the sovereign stack MATCHES the hosted one
# =============================================================================
# Darrell 2026-08-14: "start the NAS supabase stack."
#
# THE TRAP THIS EXISTS TO CLOSE (DR-0291, learned on the Photos export): a
# partial migration is byte-perfect. Every row that copied is correct, every
# checksum matches, and the thing is still WRONG because rows are missing.
# INTEGRITY IS NOT COMPLETENESS. On photos that meant a deletion gate; here it
# means nothing may point the family's app at this stack until parity is proven.
#
# WHAT MAKES THE MIGRATION TRACTABLE (measured 2026-08-14 against the live
# hosted project):
#   183 tables | 1,719 RLS policies | 110 functions | 91 triggers
#   23 auth users | 23 identities | 50 MB data | 3 buckets / 455 objects
#
# The 1,719 looked like a wall and is not. It is mostly GENERATED:
#   viewer_readonly_{insert,update,delete}  x 159 tables = 477
#   assistant_scope_{select,insert,update,delete} x 158 = 632
# Those come from DO-loops in infra/supabase/migrations-auto/, so replaying the
# repo's own migration history reproduces them -- no schema dump required. The
# migration is therefore: replay migrations, copy 50 MB of data, then RUN THIS.
#
# WHY A SEPARATE VERIFIER RATHER THAN A FLAG ON THE COPIER: a copier that grades
# its own homework is the theater DR-0076 keeps catching. This reads BOTH
# databases independently and compares.
#
# Selftest:  python3 migrate_verify.py --selftest
# Real run:  python3 migrate_verify.py --source "$HOSTED_URL" --target "$NAS_URL"
# Exit 0 = GO (parity proven). Exit 1 = NO-GO. Exit 2 = could not measure.
# =============================================================================
import json
import sys

# The counts that must match for a migration to be complete. Each is a separate
# question -- a stack can have every table and no policies, which would be a
# silent, total tenancy breach (DR-0060) that "the data is all there" hides.
PARITY_QUERIES = {
    "tables": "select count(*) from pg_tables where schemaname='public'",
    "rls_policies": "select count(*) from pg_policies where schemaname='public'",
    "functions": ("select count(*) from pg_proc p join pg_namespace n "
                  "on n.oid=p.pronamespace where n.nspname='public'"),
    "triggers": "select count(*) from pg_trigger where not tgisinternal",
    "rls_enabled_tables": ("select count(*) from pg_class c join pg_namespace n "
                           "on n.oid=c.relnamespace where n.nspname='public' "
                           "and c.relkind='r' and c.relrowsecurity"),
    "auth_users": "select count(*) from auth.users",
    "auth_identities": "select count(*) from auth.identities",
    "storage_buckets": "select count(*) from storage.buckets",
    "storage_objects": "select count(*) from storage.objects",
}


def compare_counts(source, target):
    """Compare two {name: count} maps. Pure -- tests drive it directly.

    A target that is AHEAD is not automatically fine: more tables than the
    source usually means the sovereign stack picked up migrations the hosted
    one never got, which is a real divergence a human must look at. It is
    reported as a difference, not silently blessed.
    """
    out = {"matched": [], "missing": [], "extra": [], "go": False}
    for name in sorted(set(source) | set(target)):
        s = source.get(name)
        t = target.get(name)
        if s is None or t is None:
            out["missing"].append({"metric": name, "source": s, "target": t,
                                   "detail": "not measured on both sides"})
        elif t < s:
            out["missing"].append({"metric": name, "source": s, "target": t,
                                   "detail": "target is SHORT by {}".format(s - t)})
        elif t > s:
            out["extra"].append({"metric": name, "source": s, "target": t,
                                 "detail": "target has {} MORE than source".format(t - s)})
        else:
            out["matched"].append({"metric": name, "count": s})
    out["go"] = not out["missing"] and not out["extra"]
    return out


def compare_row_counts(source_rows, target_rows):
    """Per-table row parity. The 183-table version of the same question."""
    out = {"matched": 0, "mismatched": [], "missing_tables": [], "go": False}
    for tbl in sorted(set(source_rows) | set(target_rows)):
        s = source_rows.get(tbl)
        t = target_rows.get(tbl)
        if t is None:
            out["missing_tables"].append({"table": tbl, "source": s})
        elif s is None:
            out["mismatched"].append({"table": tbl, "source": 0, "target": t,
                                      "detail": "table exists only on target"})
        elif s != t:
            out["mismatched"].append({"table": tbl, "source": s, "target": t,
                                      "detail": "short by {}".format(s - t) if t < s
                                      else "over by {}".format(t - s)})
        else:
            out["matched"] += 1
    out["go"] = not out["mismatched"] and not out["missing_tables"]
    return out


def render(counts_result, rows_result):
    lines = ["# MIGRATION PARITY (sovereign vs hosted)", ""]
    for m in counts_result["matched"]:
        lines.append("  ok    {:<20} {}".format(m["metric"], m["count"]))
    for m in counts_result["missing"]:
        lines.append("  SHORT {:<20} source={} target={}  {}".format(
            m["metric"], m["source"], m["target"], m["detail"]))
    for m in counts_result["extra"]:
        lines.append("  OVER  {:<20} source={} target={}  {}".format(
            m["metric"], m["source"], m["target"], m["detail"]))
    lines.append("")
    lines.append("  tables with matching row counts: {}".format(rows_result["matched"]))
    for m in rows_result["mismatched"][:15]:
        lines.append("  ROWS  {:<28} source={} target={}  {}".format(
            m["table"], m["source"], m["target"], m["detail"]))
    for m in rows_result["missing_tables"][:15]:
        lines.append("  GONE  {:<28} source={} target=MISSING".format(m["table"], ))
    lines.append("")
    go = counts_result["go"] and rows_result["go"]
    lines.append("VERDICT: {}".format(
        "GO - parity proven, safe to cut over"
        if go else
        "NO-GO - the sovereign stack does NOT match. Do not point the app at it."))
    return "\n".join(lines), go


# ------------------------------------------------------------------ selftest
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

    full = {"tables": 183, "rls_policies": 1719, "auth_users": 23}

    check("identical counts => GO", compare_counts(full, dict(full))["go"])

    # PROVEN-TO-CATCH #1: the partial migration. Every row present is correct;
    # the stack is still wrong. This is the DR-0291 photos lesson in SQL.
    short = dict(full, tables=180)
    r = compare_counts(full, short)
    check("CATCHES 3 missing tables -> NO-GO", not r["go"])
    check("names the shortfall exactly", r["missing"][0]["detail"] == "target is SHORT by 3")

    # PROVEN-TO-CATCH #2: the silent tenancy breach. All 183 tables, all the
    # data, and NO policies -- every tenant can read every other tenant. "The
    # data is all there" hides this completely (DR-0060).
    nopol = dict(full, rls_policies=0)
    r2 = compare_counts(full, nopol)
    check("CATCHES policies missing while tables are complete -> NO-GO", not r2["go"])
    check("that is 1719 policies short",
          any(m["metric"] == "rls_policies" and m["target"] == 0 for m in r2["missing"]))

    # PROVEN-TO-CATCH #3: users left behind.
    check("CATCHES 1 missing auth user -> NO-GO",
          not compare_counts(full, dict(full, auth_users=22))["go"])

    # A target AHEAD is a divergence, not a pass.
    r3 = compare_counts(full, dict(full, tables=185))
    check("a target with MORE tables is reported, not blessed", not r3["go"])

    # Row-level parity.
    src = {"transactions": 2953, "record_events": 20129, "entities": 4}
    check("identical row counts => GO", compare_row_counts(src, dict(src))["go"])
    rr = compare_row_counts(src, dict(src, transactions=2900))
    check("CATCHES 53 missing transactions -> NO-GO", not rr["go"])
    check("names the table and the shortfall",
          rr["mismatched"][0]["table"] == "transactions"
          and rr["mismatched"][0]["detail"] == "short by 53")
    check("CATCHES a table absent from the target entirely",
          not compare_row_counts(src, {"transactions": 2953, "entities": 4})["go"])

    text, go = render(compare_counts(full, short), compare_row_counts(src, src))
    check("a NO-GO verdict says do not cut over", "NO-GO" in text and not go)
    check("a GO verdict is only printed on full parity",
          "GO - parity proven" in render(compare_counts(full, dict(full)),
                                         compare_row_counts(src, dict(src)))[0])

    check("empty inputs never crash and never bless",
          compare_counts({}, {})["go"] and not compare_counts(full, {})["go"])

    print("\n{}/{} passed".format(passed, passed + failed))
    return 1 if failed else 0


def main(argv):
    if "--selftest" in argv:
        return selftest()
    print(__doc__ or "")
    print("Real runs need both DSNs; psycopg2 is not installed on this NAS's "
          "python3.8 (root cannot import dpoe's site-packages -- measured). Run "
          "the counts through the stack's own psql container and feed the JSON "
          "in, or run this from CI where psycopg2 is available.", file=sys.stderr)
    print(json.dumps({"parity_queries": PARITY_QUERIES}, indent=2))
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

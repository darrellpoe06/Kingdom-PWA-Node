#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Stdlib tests for prep_from_transcript's PURE logic (no network). Run:
    python3 test_prep_from_transcript.py
Pins the eligibility gate (email prep NEVER touched, the age wait, transcript
required), the deterministic scripture sweep, and the draft-row shape."""
import sys
from datetime import date
from prep_from_transcript import find_refs, is_eligible, build_prep, _age_days

def check(name, cond):
    print(("ok  " if cond else "FAIL ") + name)
    return cond

ok = True
TODAY = date(2026, 7, 14)

# find_refs — written chapter:verse only, de-duped, order-preserving; no guessing.
ok &= check("ref colon", find_refs("turn to Isaiah 61:7 today") == ["Isaiah 61:7"])
ok &= check("ref period style", find_refs("MATTHEW 5.13-16 NIV") == ["MATTHEW 5:13-16"])
ok &= check("ref numeral book", find_refs("see 1 John 4:8") == ["1 John 4:8"])
ok &= check("dedupe + order", find_refs("Ps 23:1 ... Ps 23:1 ... John 3:16") == ["Ps 23:1", "John 3:16"])
ok &= check("no spoken-only ref", find_refs("first John four eight") == [])

# _age_days — whole-day age, undated -> None.
ok &= check("age 4 days", _age_days("2026-07-10", TODAY) == 4)
ok &= check("age same day", _age_days("2026-07-14", TODAY) == 0)
ok &= check("age undated None", _age_days(None, TODAY) is None)
ok &= check("age bad None", _age_days("not-a-date", TODAY) is None)

sermon_old = {"id": "s1", "video_id": "v1", "service_date": "2026-07-10"}   # 4 days old
sermon_fresh = {"id": "s2", "video_id": "v2", "service_date": "2026-07-13"} # 1 day old
sermon_undated = {"id": "s3", "video_id": "v3", "service_date": None}

# is_eligible — the core gate.
ok &= check("eligible: old, has transcript, no prep",
            is_eligible(sermon_old, None, True, TODAY, 3) is True)
ok &= check("NOT eligible: too fresh (wait not met)",
            is_eligible(sermon_fresh, None, True, TODAY, 3) is False)
ok &= check("NOT eligible: no transcript",
            is_eligible(sermon_old, None, False, TODAY, 3) is False)
ok &= check("NOT eligible: undated (can't age-gate)",
            is_eligible(sermon_undated, None, True, TODAY, 3) is False)
# THE HARD STOP: an email prep is BG's own outline — never drafted over.
ok &= check("NOT eligible: email prep exists (ground truth untouched)",
            is_eligible(sermon_old, {"source": "email"}, True, TODAY, 3) is False)
# a transcript/manual prep MAY be refreshed.
ok &= check("eligible: transcript prep may refresh",
            is_eligible(sermon_old, {"source": "transcript"}, True, TODAY, 3) is True)
ok &= check("eligible: manual prep may refresh",
            is_eligible(sermon_old, {"source": "manual"}, True, TODAY, 3) is True)
# exactly the boundary: age == min_age_days is eligible.
ok &= check("eligible: exactly min-age boundary",
            is_eligible({"id": "sb", "service_date": "2026-07-11"}, None, True, TODAY, 3) is True)

# build_prep — the draft row shape.
transcript = "He said turn to Isaiah 61:7 and also Romans 8:28 for your double."
row = build_prep("s1", "inst-1", transcript, "Positioned for Purpose", [])
ok &= check("row source transcript", row["source"] == "transcript")
ok &= check("row needs_review true (draft)", row["needs_review"] is True)
ok &= check("row scriptures from transcript", row["scriptures"] == ["Isaiah 61:7", "Romans 8:28"])
ok &= check("row scriptures-only when no Ari points", row["points"] == [])
ok &= check("row theme carried", row["theme"] == "Positioned for Purpose")
ok &= check("row raw_text excerpt kept", row["raw_text"].startswith("He said turn to"))

# build_prep with Ari points — a point's own refs roll into the surface feed.
pts = [{"n": 1, "text": "God restores the double", "scriptures": ["Job 42:10"]}]
row2 = build_prep("s1", "inst-1", "Isaiah 61:7 double portion", "Double", pts)
ok &= check("row keeps Ari points", len(row2["points"]) == 1)
ok &= check("row merges point refs into feed",
            row2["scriptures"] == ["Isaiah 61:7", "Job 42:10"])

print("\nALL PASS" if ok else "\nFAILURES ABOVE")
sys.exit(0 if ok else 1)

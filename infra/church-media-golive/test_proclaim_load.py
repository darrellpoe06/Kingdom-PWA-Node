#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Stdlib tests for proclaim_load's PURE parsing (no network). Run:
    python3 test_proclaim_load.py
Pins the deterministic layer that turns an indexed PROCLAIM entry into the
choir_sermons + sermon_prep rows — ground truth, points from real openers only,
scriptures evidence-backed (DR-0076)."""
import sys
from proclaim_load import (
    find_refs, structure_points, normalize_headline_ref, entry_to_rows, _service_type,
)

def check(name, cond):
    print(("ok  " if cond else "FAIL ") + name)
    return cond

ok = True

# find_refs — BG's "MATTHEW 5.13-16 NIV" period style + numeral books.
ok &= check("ref period-style", find_refs("MATTHEW 5.13-16 NIV") == ["MATTHEW 5:13-16"])
ok &= check("ref numeral book", find_refs("read 1 JOHN 4.8 today") == ["1 JOHN 4:8"])
ok &= check("ref colon style too", find_refs("Matthew 5:14") == ["Matthew 5:14"])
ok &= check("no false ref", find_refs("LET GO AND LET GOD") == [])

# structure_points — numbered openers only; a ref-only line is NOT a point.
pts = structure_points([
    "MATTHEW 5:13-16 NIV",                      # headline ref — not a point
    "1. You are the salt of the earth. Matthew 5:13",
    "2. You are the light of the world.",
    "Matthew 5:14",                             # trailing ref -> attaches to point 2
    "3. Let your light shine. Matthew 5:16",
])
ok &= check("three points", len(pts) == 3)
ok &= check("point 1 text", pts[0]["text"].startswith("You are the salt"))
ok &= check("point 1 scripture", pts[0]["scriptures"] == ["Matthew 5:13"])
ok &= check("point 2 gathers trailing ref", pts[1]["scriptures"] == ["Matthew 5:14"])
ok &= check("sequential numbering", [p["n"] for p in pts] == [1, 2, 3])

ok &= check("headline normalize", normalize_headline_ref("MATTHEW 5.13-16 NIV") == "MATTHEW 5:13-16")

# service_type from the preached date.
ok &= check("sunday", _service_type("2026-06-14") == "sunday")
ok &= check("wednesday", _service_type("2026-06-17") == "wednesday")

# entry_to_rows — the full mapping (ground truth flags).
sermon, prep = entry_to_rows({
    "file": "06-17-2026 PROCLAIM SCRIPTURES AND POINTS - I'M SALTY! - MATTHEW 5.13-16 NIV - PASTOR AARON FORMAN.docx",
    "date": "2026-06-17", "scripture": "MATTHEW 5.13-16 NIV",
    "preacher": "Pastor Aaron Forman", "title": "I'M SALTY!",
    "paragraphs": ["MATTHEW 5:13-16 NIV", "1. Salt of the earth. Matthew 5:13", "2. Light of the world. Matthew 5:14"],
}, "colg-1")
ok &= check("sermon date", sermon["service_date"] == "2026-06-17")
ok &= check("sermon ref", sermon["scripture_ref"] == "MATTHEW 5:13-16")
ok &= check("sermon speaker", sermon["speaker"] == "Pastor Aaron Forman")
ok &= check("sermon ground truth source", sermon["source"] == "email")
ok &= check("sermon ships draft", sermon["status"] == "draft")
ok &= check("prep points", len(prep["points"]) == 2)
ok &= check("prep needs_review false", prep["needs_review"] is False)
ok &= check("prep scriptures headline-first", prep["scriptures"][0] == "MATTHEW 5:13-16")
ok &= check("default speaker is BG", entry_to_rows({"title": "X", "date": "2026-06-14", "paragraphs": []}, "i")[0]["speaker"] == "Bishop Lloyd E. Gwin")

print("PASS" if ok else "SOME FAILED")
sys.exit(0 if ok else 1)

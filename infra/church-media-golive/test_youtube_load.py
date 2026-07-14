#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Stdlib tests for youtube_load's PURE parsing (no network). Run:
    python3 test_youtube_load.py
Pins the deterministic layer that turns a youtube-index video into a
choir_sermons row: date ALWAYS (title, else upload fallback), off-cycle
conference/funeral classified from the title, email rows never overwritten."""
import sys
from youtube_load import (
    classify_service_type, parse_service_title, video_to_row, _merge_for_existing,
)

def check(name, cond):
    print(("ok  " if cond else "FAIL ") + name)
    return cond

ok = True

# classify_service_type — ONE rule with app/src/lib/service-day.js. Title wins.
ok &= check("sunday default", classify_service_type('6 -10 - 2026 Bishop E. Gwin "LET GO"') == "sunday")
ok &= check("wednesday bible study", classify_service_type('6 -3 - 2026 Bishop Gwin Wednesday Bible Study "X"') == "wednesday")
ok &= check("funeral homegoing", classify_service_type("Roline Brumfield Homegoing Service") == "funeral")
ok &= check("funeral celebration of life", classify_service_type("Celebration of Life for Mother Jones") == "funeral")
ok &= check("conference convocation", classify_service_type("2026 Holy Convocation Night 1") == "conference")
ok &= check("conference plain", classify_service_type("Men's Conference Tuesday") == "conference")

# parse_service_title — dates in every observed shape, quoted title, speaker.
p1 = parse_service_title('6 -10 - 2026 Bishop E. Gwin  "LET GO AND LET GOD HELP YOU"')
ok &= check("sunday date parse", p1["service_date"] == "2026-06-10")
ok &= check("sunday type", p1["service_type"] == "sunday")
ok &= check("quoted title", p1["title"] == "LET GO AND LET GOD HELP YOU")
ok &= check("speaker Gwin", p1["speaker"] == "Bishop E. Gwin")

p2 = parse_service_title('5/28/2026 Bishop Gwin Wednesday Bible Study "Y"')
ok &= check("slash date", p2["service_date"] == "2026-05-28")
ok &= check("wednesday type", p2["service_type"] == "wednesday")

p3 = parse_service_title('3 26 25 Bishop Lloyd Gwin Wednesday Bible Study "YOU CANT"')
ok &= check("space date 2-digit year", p3["service_date"] == "2025-03-26")

p4 = parse_service_title("Black History Month at The Love Corner")
ok &= check("no date in title", p4["service_date"] is None)

# HTML entities decoded (harvested titles arrive entity-encoded).
p5 = parse_service_title("6 -10 - 2026 Bishop E. Gwin &quot;LET GO&quot;")
ok &= check("entity-decoded title", p5["title"] == "LET GO")

# video_to_row — date ALWAYS. Title date is primary.
r1 = video_to_row({"id": "vid11111111", "title": '6 -10 - 2026 Bishop E. Gwin "LET GO"'}, "inst-1")
ok &= check("row date from title", r1["service_date"] == "2026-06-10")
ok &= check("row source youtube", r1["source"] == "youtube")
ok &= check("row url", r1["youtube_url"] == "https://www.youtube.com/watch?v=vid11111111")
ok &= check("row video_id", r1["video_id"] == "vid11111111")

# Upload-date FALLBACK — a dateless title still archives, dated from `published`.
r2 = video_to_row({"id": "vid22222222", "title": "Sunday Worship", "published": "2026-07-12"}, "inst-1")
ok &= check("row date from upload fallback", r2["service_date"] == "2026-07-12")
ok &= check("dateless title still has readable title", r2["title"] == "Sunday Worship")

# No date ANYWHERE -> reported/skipped (None), never guessed.
r3 = video_to_row({"id": "vid33333333", "title": "Choir rehearsal clip"}, "inst-1")
ok &= check("no date anywhere -> None", r3 is None)

# No id -> None.
ok &= check("no id -> None", video_to_row({"title": "6 -10 - 2026 x"}, "inst-1") is None)

# Conference / funeral off-cycle streams land under the right label.
rc = video_to_row({"id": "vidconf1234", "title": "2026 Holy Convocation", "published": "2026-07-15"}, "inst-1")
ok &= check("conference row type", rc["service_type"] == "conference")
rf = video_to_row({"id": "vidfune1234", "title": "Homegoing Service", "published": "2026-07-16"}, "inst-1")
ok &= check("funeral row type", rf["service_type"] == "funeral")

# _merge_for_existing — an EMAIL row (BG's authored outline) is ground truth:
# the loader only attaches the video, never overwrites the human title.
row = video_to_row({"id": "vidmerge123", "title": '6 -10 - 2026 Bishop E. Gwin "VIDEO TITLE"'}, "inst-1")
email_existing = {"source": "email", "speaker": "Bishop Lloyd E. Gwin", "service_type": "sunday"}
patch = _merge_for_existing(row, email_existing)
ok &= check("email row: only video attached", set(patch.keys()) == {"video_id", "youtube_url"})
ok &= check("email row: title NOT overwritten", "title" not in patch)

# An email row missing speaker gets it filled (blank-fill only).
email_blank = {"source": "email", "speaker": None, "service_type": None}
patch2 = _merge_for_existing(row, email_blank)
ok &= check("email row: blank speaker filled", patch2.get("speaker") == row["speaker"])

# A youtube row is ours to refresh in place.
yt_existing = {"source": "youtube", "speaker": None, "service_type": "sunday"}
patch3 = _merge_for_existing(row, yt_existing)
ok &= check("youtube row: full refresh", patch3 is row)

print("\nALL PASS" if ok else "\nFAILURES ABOVE")
sys.exit(0 if ok else 1)

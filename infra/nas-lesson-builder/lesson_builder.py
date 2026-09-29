#!/usr/bin/env python3
"""
lesson_builder.py -- a lesson starts THE MOMENT the words land (DR-0669).

Darrell 2026-09-29: "Do we need claude? Can we build the workflows inside the
PoeTech App?" -> "Yes build it all in the app!!!"; "Voice recordings are
another lane!!!!!!! No limits!!!!"; "Why have any cap?!... If I push through
1000 in a day get it done... period!!!!!!"; "I'm not trying to cut any
quality...".

THE TRIGGER (no polling interval). Migration 0240 puts a trigger on
agent_inbox: a row tagged `lesson` (and not yet `lesson-captured`) that is
inserted, or whose tags change, calls pg_notify('lesson_inbox', <row id>).
This service LISTENs on the NAS's own Postgres -- the database the app writes
to (REPOINT-ARMED) and the database the Whisper loop files transcripts into --
so a typed lesson, a Whisper transcript and a Governor's approval all ring the
builder the instant they are written. One sweep runs at start, after every
reconnect, and on SIGHUP (the installer sends one each services-sync cycle as
a safety net for a notification missed while the service was down).

THE STAGES (deterministic, except `writing`). Each stage writes its time back
to the row as a tag `build:<stage>@<UTC ISO time>` -- the vocabulary the
in-app "Your lessons" screen (DR-0668) reads:

  claimed, grouped, verses-fetched, writing, written, gated, selected,
  numbered, files-written, test-generated, reconciled, tested, committed,
  pushed, published
  -- and on the other roads: failed, released, deferred, duplicate,
     skipped-test, awaiting-review (more than one version: Darrell decides in
     the app), decided (his decision row was read)

plus: lesson-building (held while a build owns the row), build-group:<id>,
build-writer:<name>, build-prompt:<sha256 first 16>, build-lesson:L<n>,
build-dr:DR-<n>, build-reason:<text> (why it failed / was deferred),
build-failed; and after the push SUCCEEDS: lesson-captured, lesson-published,
lesson-id:<id>. Nothing is marked captured before the push.

THE BRAKES (the amended three-brakes law, DR-0247 / DR-0248 / DR-0667):
  no count cap        every waiting teaching is built (Darrell).
  budget              each build runs in its own process with a wall-clock
                      budget (LESSON_BUILD_MAX_SECONDS, default 2700). A hung
                      build is killed, and its rows are marked failed with the
                      reason; they are never left looking busy.
  lock                per row, twice: an O_EXCL lock file on the NAS and the
                      atomic claim in the database (tag lesson-building, set
                      only WHERE the row does not already carry it).
  kill                the stop-paths of the deterministic fleet: services.json
                      lesson-builder enabled:false, or ARMED-BY-RECORD removed
                      from infra/nas-loops. Checked before every build.

DORMANT UNTIL A WRITER. With no writer reachable (no signed-in Claude Code CLI
on the NAS or over SSH, no key for any optional writer) the service arms,
claims NOTHING, writes status.json "waiting on a writer" naming every writer
it tried and why, and the hourly Routine remains the builder.
"""
import argparse
import datetime
import errno
import fcntl
import json
import os
import re
import select
import signal
import subprocess
import sys
import threading
import time
import uuid

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
# pg8000 is committed under infra/nas-agent/.vendor (DSM root cannot pip).
sys.path.insert(1, os.path.join(HERE, "..", "nas-agent", ".vendor"))
import lesson_gates as gates  # noqa: E402
import lesson_writer as writer  # noqa: E402

DATA = os.environ.get("LESSON_BUILDER_DATA", "/volume1/PoeTech/lesson-builder")
MIRROR = os.environ.get("POETECH_REPO", "/volume1/PoeTech/repos/Kingdom-PWA-Node")
REMOTE_URL = os.environ.get("LESSON_BUILDER_REMOTE", "https://github.com/darrellpoe06/Kingdom-PWA-Node.git")
TOKEN_FILE = os.environ.get("LESSON_BUILDER_TOKEN_FILE", "/volume1/PoeTech/secrets/github-token.txt")
RUN_AS = os.environ.get("LESSON_BUILDER_USER", "dpoe")
SERVICE_NAME = "lesson-builder"
CHANNEL = "lesson_inbox"
# Darrell's two accounts (DR-0667 s4): his rows are built without approval.
OWNER_IDS = ("f13843f2-742b-4f8a-82af-7ecfbdc536ec", "c2a6c39a-ae99-4ff7-83c6-b927e2e7f1cc")
BUILD_MAX_SECONDS = int(os.environ.get("LESSON_BUILD_MAX_SECONDS", "2700"))
WRITER_MAX_SECONDS = int(os.environ.get("LESSON_WRITER_MAX_SECONDS", "1500"))
MAX_ATTEMPTS = int(os.environ.get("LESSON_BUILD_MAX_ATTEMPTS", "2"))
PARALLEL = int(os.environ.get("LESSON_BUILD_PARALLEL", "3"))
SIMILAR = float(os.environ.get("LESSON_SIMILAR", "0.5"))

LIVING = "app/src/lib/living-lessons-class.js"
DATES = "app/src/lib/living-lessons-dates.js"
CROSSLIST = "app/src/__tests__/learn-crosslist.test.js"
INDEX = "docs/decisions/INDEX.md"
# The counts a new Living Lesson moves (the set L192-L195 moved, DR-0643).
BASELINES = (
    ("app/src/lib/band-differentiation-baseline.json", "measuredLessons"),
    ("app/src/lib/course-quotation-integrity-baseline.json", "measuredLessons"),
    ("app/src/lib/full-levels-baseline.json", "measuredLessons"),
    ("app/src/lib/reading-level-baseline.json", "measuredLessons"),
    ("app/src/lib/stage-reaches-reader-baseline.json", "lessons"),
    ("app/src/lib/title-in-narrative-baseline.json", "measuredLessons"),
)
DUP_SOURCES_PREFIX = ("app/src/lib/", "docs/decisions/")

STAGES = ("claimed", "grouped", "verses-fetched", "writing", "written", "gated", "selected", "numbered",
          "files-written", "test-generated", "reconciled", "tested", "committed", "pushed", "published")
OTHER_STAGES = ("failed", "released", "deferred", "duplicate", "skipped-test", "awaiting-review", "decided")


# =============================================================================
# pure: time and tags
# =============================================================================

def utc_now():
    return datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")


def stage_tag(stage, ts):
    assert stage in STAGES or stage in OTHER_STAGES, stage
    return "build:{}@{}".format(stage, ts)


def stage_times(tags):
    """{stage: last ISO time} from a row's tags -- what 'Your lessons' shows."""
    out = {}
    for t in tags or []:
        m = re.match(r"^build:([a-z-]+)@(\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ)$", str(t))
        if m:
            out[m.group(1)] = m.group(2)
    return out


def failed_attempts(tags):
    return sum(1 for t in tags or [] if str(t).startswith("build:failed@"))


def reason_tag(text):
    return "build-reason:" + re.sub(r"\s+", " ", str(text)).strip()[:200]


# =============================================================================
# pure: which rows are ours to build (the hourly Routine's rules, as code)
# =============================================================================

def eligibility(row, owners=OWNER_IDS, max_attempts=MAX_ATTEMPTS):
    """(ok, why). Mirrors the in-app Routine's rules (DR-0608/0610/0611/0635)."""
    tags = row.get("tags") or []
    if "lesson" not in tags:
        return False, "not a lesson row"
    if "lesson-captured" in tags:
        return False, "already captured"
    if "lesson-building" in tags:
        return False, "a build holds it"
    if "awaiting-review" in tags:
        return False, "its versions wait for Darrell's decision"
    if "canary" in tags:
        return False, "canary rows are the Routine's"
    if "voice-failed" in tags:
        return False, "voice-failed: the Routine reports it"
    if "voice" in tags and "voice-transcript" not in tags:
        return False, "waiting for its words (the transcript row carries them)"
    if "build:deferred@" in " ".join(str(t) for t in tags) or any(str(t).startswith("build:deferred@") for t in tags):
        return False, "deferred to the hourly Routine"
    if failed_attempts(tags) >= max_attempts:
        return False, "failed {} times: left for the hourly Routine".format(failed_attempts(tags))
    if "lesson-declined" in tags:
        return False, "declined by the Governor"
    if str(row.get("created_by") or "") not in owners and "lesson-approved" not in tags:
        return False, "a member's lesson waits for the Governor"
    if not (row.get("body") or "").strip():
        return False, "no words"
    return True, "eligible"


# =============================================================================
# pure: one teaching, one lesson (DR-0610)
# =============================================================================

def words(text):
    return re.findall(r"[a-z0-9']+", (text or "").lower())


def shingle_set(text, k=5):
    w = words(text)
    return set(tuple(w[i:i + k]) for i in range(max(0, len(w) - k + 1)))


def similarity(a, b):
    sa, sb = shingle_set(a), shingle_set(b)
    if not sa or not sb:
        return 0.0
    return len(sa & sb) / float(min(len(sa), len(sb)))


def group_teaching(seed, pending, owners=OWNER_IDS, threshold=SIMILAR):
    """The seed row plus every other eligible pending row carrying the SAME
    teaching (a Whisper transcript and a typed copy; the same text sent twice).
    Sorted oldest first."""
    group = [seed]
    for r in pending:
        if r.get("id") == seed.get("id"):
            continue
        ok, _ = eligibility(r, owners)
        if ok and similarity(seed.get("body", ""), r.get("body", "")) >= threshold:
            group.append(r)
    return sorted(group, key=lambda r: str(r.get("created_at") or ""))


def companion_ids(group):
    """The original voice rows a transcript came from (of:<id>): they are
    tagged captured with the lesson, never built on their own."""
    out = []
    for r in group:
        for t in r.get("tags") or []:
            if str(t).startswith("of:") and t[3:] not in out:
                out.append(t[3:])
    return out


def teaching_of(group):
    """The words to teach from: the fullest body in the group."""
    return max((r.get("body") or "" for r in group), key=len)


def normalize_for_search(text):
    return re.sub(r"[^a-z0-9]+", " ", (text or "").lower()).strip()


def fingerprints(text, n=3, min_words=8):
    sents = [normalize_for_search(s) for s in re.split(r"[.!?\n]+", text or "")]
    sents = [s for s in sents if len(s.split()) >= min_words]
    return sorted(set(sents), key=len, reverse=True)[:n]


def already_built(fps, corpus_norm):
    """The teaching's longest sentences already stand in a lesson catalog or a
    decision record (the Routine's DR-0610 check, deterministic)."""
    if not fps:
        return False
    hits = sum(1 for s in fps if s in corpus_norm)
    return hits >= min(2, len(fps))


# =============================================================================
# pure: numbers (taken atomically, never colliding with a parallel build)
# =============================================================================

LL_ID = re.compile(r"id: 'll(\d+)-")
DR_NUM = re.compile(r"DR-(\d{4})")


def max_ll(texts):
    return max([int(m) for t in texts for m in LL_ID.findall(t or "")] or [0])


def max_dr(texts):
    return max([int(m) for t in texts for m in DR_NUM.findall(t or "")] or [0])


def reserve_numbers(state_path, repo_ll, repo_dr, build_id):
    """Under an exclusive file lock: next = 1 + max(what the repo and every
    recent branch hold, what an in-flight build on this NAS holds). The
    reservation is kept until release_numbers(); parallel builds on this box
    can never take the same number."""
    os.makedirs(os.path.dirname(state_path), exist_ok=True)
    with open(state_path + ".lock", "a+") as lk:
        fcntl.flock(lk, fcntl.LOCK_EX)
        try:
            try:
                with open(state_path, encoding="utf-8") as f:
                    state = json.load(f)
            except (OSError, ValueError):
                state = {}
            inflight = state.get("inflight") or {}
            ll = max([repo_ll] + [v[0] for v in inflight.values()]) + 1
            dr = max([repo_dr] + [v[1] for v in inflight.values()]) + 1
            inflight[build_id] = [ll, dr]
            state["inflight"] = inflight
            tmp = state_path + ".tmp"
            with open(tmp, "w", encoding="utf-8") as f:
                json.dump(state, f)
            os.replace(tmp, state_path)
            return ll, dr
        finally:
            fcntl.flock(lk, fcntl.LOCK_UN)


def release_numbers(state_path, build_id):
    try:
        with open(state_path + ".lock", "a+") as lk:
            fcntl.flock(lk, fcntl.LOCK_EX)
            try:
                with open(state_path, encoding="utf-8") as f:
                    state = json.load(f)
                (state.get("inflight") or {}).pop(build_id, None)
                with open(state_path, "w", encoding="utf-8") as f:
                    json.dump(state, f)
            finally:
                fcntl.flock(lk, fcntl.LOCK_UN)
    except (OSError, ValueError):
        pass


# =============================================================================
# pure: the files a Living Lesson changes
# =============================================================================

def js_str(s):
    s = str(s).replace("\\", "\\\\").replace("'", "\\'").replace("\r", "").replace("\n", "\\n")
    s = s.replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")
    return "'" + s + "'"


def js_value(v, indent):
    pad, inner = " " * indent, " " * (indent + 2)
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return str(v)
    if isinstance(v, str):
        return js_str(v)
    if isinstance(v, list):
        if not v:
            return "[]"
        return "[\n" + "".join(inner + js_value(x, indent + 2) + ",\n" for x in v) + pad + "]"
    if isinstance(v, dict):
        return "{\n" + "".join("{}{}: {},\n".format(inner, k, js_value(x, indent + 2)) for k, x in v.items()) + pad + "}"
    raise TypeError("cannot write {!r} as JS".format(type(v)))


def lesson_id(ll, slug):
    slug = "-".join(slug.split("-")[:14])
    return "ll{}-{}".format(ll, slug)


def compose_lesson(obj):
    """The full lesson string from its parts: intro, the numbered movements
    (numbered HERE, so a merge of movements from different writers still reads
    1, 2, 3...), and the close."""
    mv = ["{}. {}. {}".format(i, m["title"].strip().rstrip("."), m["text"].strip())
          for i, m in enumerate(obj["movements"], 1)]
    return "\n\n".join([obj["lesson_intro"].strip()] + mv + [obj["lesson_close"].strip()])


def lesson_module(obj, ll):
    """The committed lesson object, in the series' key order."""
    q = [{"q": x["q"], "options": list(x["options"]), "answer": int(x["answer"]), "explain": x["explain"]}
         for x in obj["quiz"]["questions"]]
    return {
        "id": lesson_id(ll, obj["slug"]),
        "title": obj["title"],
        "bigIdea": obj["bigIdea"],
        "inApp": obj["inApp"],
        "anchor": {"ref": obj["anchor"]["ref"], "theme": obj["anchor"]["theme"]},
        "benefits": list(obj["benefits"]),
        "levels": {b: obj["levels"][b] for b in gates.FULL_BANDS},
        "quiz": {"questions": q},
        "facilitator": {"talkingPoints": list(obj["facilitator"]["talkingPoints"])},
        "lesson": compose_lesson(obj),
    }


def module_js(module):
    return "  " + js_value(module, 2) + ",\n"


def insert_module(src, js):
    start = src.index("export const LIVING_LESSONS_MODULES = [")
    end = src.index("\n];\n", start)
    return src[:end + 1] + js + src[end + 1:]


def bump_weeks(src, ll, title, date):
    m = re.search(r"weeks: (\d+), // ", src)
    if not m:
        raise ValueError("LIVING_LESSONS_META.weeks not found")
    n = int(m.group(1)) + 1
    return src[:m.start()] + "weeks: {}, // L{} {} ({}) · ".format(n, ll, title, date) + src[m.end():], n


def insert_date(src, lid, date, dr):
    start = src.index("export const LIVING_LESSONS_ADDED = {")
    end = src.index("\n};", start)
    line = "\n  {}: '{}', // added with the lesson on the NAS (DR-{:04d})".format(js_str(lid), date, dr)
    return src[:end] + line + src[end:]


def bump_json_count(text, key):
    m = re.search(r'"{}": (\d+)'.format(re.escape(key)), text)
    if not m:
        raise ValueError("{} not found".format(key))
    return text[:m.start(1)] + str(int(m.group(1)) + 1) + text[m.end(1):]


CROSS_A = re.compile(r"(courseLessonCount\(c\), 0\)\)\.toBe\()(\d+)(\))")
CROSS_B = re.compile(r"(d\.lessons, 0\)\)\.toBe\()(\d+)(\))")


def bump_crosslist(text, ll, title, dr, date):
    a, b = CROSS_A.search(text), CROSS_B.search(text)
    if not (a and b) or a.group(2) != b.group(2):
        raise ValueError("learn-crosslist totals not found or not equal")
    n = int(a.group(2)) + 1
    line_start = text.rfind("\n", 0, a.start()) + 1
    indent = re.match(r"\s*", text[line_start:]).group(0)
    note = "{}// And to {} on {} for L{} ({}, DR-{:04d}), built on the NAS,\n{}// a lesson into the existing Living Lessons course, so only the total moves.\n".format(
        indent, n, date, ll, title.replace("\n", " ")[:80], dr, indent)
    text = text[:line_start] + note + text[line_start:]
    text = CROSS_A.sub(lambda m: m.group(1) + str(n) + m.group(3), text, count=1)
    text = CROSS_B.sub(lambda m: m.group(1) + str(n) + m.group(3), text, count=1)
    return text, n


def dr_filename(dr, slug):
    return "DR-{:04d}-{}.md".format(dr, "-".join(slug.split("-")[:14]))


def dr_markdown(dr, ll, module, version, versions, group, date, provenance):
    lines = [
        "# DR-{:04d} — L{}: {}".format(dr, ll, module["title"]),
        "",
        "- **Status:** accepted",
        "- **Tier:** B",
        "- **Type:** word",
        "- **Date:** {}".format(date),
        "- **Scope:** `{}` (L{}, `{}`); `{}`; `app/src/__tests__/living-lessons-l{}-verses.test.js` (new); the counts a new lesson moves (`learn-crosslist.test.js` and the six baselines).".format(
            LIVING, ll, module["id"], DATES, ll),
        "- **Principles:** WORD-FIRST, VERIFICATION-DOCTRINE, SPOKEN-TEACHINGS-ARE-BUILD-INPUT, DECISION-RECORDS",
        "- **Grounds:** DR-0669 (the NAS lesson builder), DR-0610 (one teaching, one lesson), DR-0611 (spoken lessons), DR-0076 (every verse verbatim, proven-to-catch).",
        "",
        "## Context",
        "",
        provenance,
        "",
        "## What was measured",
        "",
        "The same prompt (sha256 `{}`) went to {} writer(s). Every version was gated the same way; the verse gate is a hard stop.".format(
            version["prompt_sha256"], len(versions)),
        "",
        "| Writer | Family | Verse spans verbatim | Gates | Elapsed |",
        "| --- | --- | --- | --- | --- |",
    ]
    for v in versions:
        g = v.get("gates") or {}
        vg = g.get("verse") or {}
        lines.append("| {} | {} | {} / {} | {} | {} ms |".format(
            v.get("writer"), v.get("family"), vg.get("verbatim", 0), vg.get("spans", 0),
            "passed" if g.get("passed") else "failed" if v.get("ok") else "no draft: " + str(v.get("error", ""))[:60].replace("|", "/"),
            v.get("elapsed_ms", 0)))
    lines += [
        "",
        "## Impact",
        "",
        "The teaching reaches the reader as L{} without waiting for the hourly check; the other versions stay stored in `lesson_versions` for comparison.".format(ll),
        "",
        "## Decision",
        "",
        "**Placement: Living Lessons, L{}.** Shipped version: **{}** ({}). {}".format(ll, version["writer"], version.get("selection_why", ""), version["body"].get("dr_summary", "")),
        "",
        "Movements, Word first:",
        "",
    ]
    for i, mv in enumerate(version["body"].get("movements") or [], 1):
        lines.append("{}. {}".format(i, mv.get("title", "") if isinstance(mv, dict) else mv))
    lines += [
        "",
        "## Verification",
        "",
        "- Every quoted span re-verified against `app/public/bible/kjv` before the push: {} of {} verbatim.".format(
            (version["gates"].get("verse") or {}).get("verbatim"), (version["gates"].get("verse") or {}).get("spans")),
        "- Pinned in `living-lessons-l{}-verses.test.js`, with a proven-to-catch one-word change.".format(ll),
        "- Rows: {}.".format(", ".join("`{}`".format(r["id"]) for r in group)),
        "- re-review: {}".format((datetime.date.fromisoformat(date) + datetime.timedelta(days=30)).isoformat()),
        "",
    ]
    return "\n".join(lines)


def index_row(dr, fname, ll, title, summary):
    s = re.sub(r"\s+", " ", summary).replace("|", "/").strip()[:400]
    return "| [DR-{:04d}]({}) | **L{}: {}.** Built on the NAS lesson builder (DR-0669). {} | accepted | B | Living Lessons | WORD-FIRST, VERIFICATION-DOCTRINE |".format(
        dr, fname, ll, title.replace("|", "/"), s)


def update_index(text, row, dr, slug, date):
    rows = [(int(m.group(1)), m.start()) for m in re.finditer(r"^\| \[DR-(\d{4})\]", text, re.M)]
    if not rows:
        raise ValueError("INDEX.md has no DR rows")
    top = max(rows)
    # Directly after the highest-numbered row, where the newest rows gather
    # (the table below it is older rows kept in the order they merged).
    line_end = text.index("\n", top[1])
    text = text[:line_end + 1] + row + "\n" + text[line_end + 1:]
    m = re.search(r"\*\*Next ID:\*\* DR-(\d{4})\.", text)
    if m:
        # business-systems-guard: the pointer is the newest record + 1, exactly.
        nxt = max(top[0], dr) + 1
        text = text[:m.start()] + "**Next ID:** DR-{:04d}. (DR-{:04d} = {}, {}, built on the NAS.)".format(
            nxt, dr, slug, date) + text[m.end():]
    return text


# =============================================================================
# pure: the pinned verse test
# =============================================================================

def pick_catch(module):
    """(field, span, mutated) for the proven-to-catch: a quoted span in the
    lesson body (or a band) with one word of four letters or more changed."""
    fields = [("lesson", module["lesson"])] + [("levels." + b, module["levels"][b]) for b in gates.FULL_BANDS]
    for field, text in fields:
        for m in gates.SPAN_WITH_REFERENCE.finditer(text):
            span = m.group(1)
            w = re.search(r"\b[a-z]{4,}\b", span)
            if w:
                return field, span, span[:w.start()] + "xyzzy" + span[w.end():]
    return None


def verse_test_js(module, ll, dr, date, rows, version):
    spans = []
    for s in gates.referenced_spans(module):
        if s["quoted"] not in spans:
            spans.append(s["quoted"])
    catch = pick_catch(module)
    if not catch:
        raise ValueError("no quoted span to prove the gate with")
    field, span, mutated = catch
    if field == "lesson":
        broken = "{ ...L(), lesson: L().lesson.replace(%s, %s) }" % (js_str(span), js_str(mutated))
    else:
        band = field.split(".")[1]
        broken = "{ ...L(), levels: { ...L().levels, %s: L().levels.%s.replace(%s, %s) } }" % (
            band, band, js_str(span), js_str(mutated))
    head = [
        "// @vitest-environment node",
        "// =============================================================================",
        "// L{} — {}".format(ll, module["title"]),
        "// =============================================================================",
        "// Built on the NAS by the lesson builder (DR-0669; this lesson DR-{:04d}) from".format(dr),
        "// agent_inbox row(s) {}.".format(", ".join(r["id"] for r in rows)),
        "// Written by {} ({}); every quoted span was re-verified against the in-repo".format(version["writer"], version.get("family", "")),
        "// KJV (app/public/bible/kjv) before the push. Every span is pinned below so a",
        "// later edit cannot soften it, and a one-word change is proven to fail.",
        "import { describe, it, expect } from 'vitest';",
        "import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';",
        "import { LIVING_LESSONS_ADDED } from '../lib/living-lessons-dates.js';",
        "import { scanQuotedVerses } from '../../../scripts/quoted-verse-is-the-verse.mjs';",
        "import { quotedTexts } from '../../../scripts/quotation-integrity.mjs';",
        "import { measureFullness, FULL_BANDS, FULL_FLOOR } from '../../../scripts/full-levels.mjs';",
        "import { measureLesson, isInverted, breachesChildCeiling, NEW_LESSON_CHILD_CEILING } from '../../../scripts/reading-level.mjs';",
        "import { measureDifferentiation, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';",
        "import { namesItsLesson } from '../../../scripts/title-in-narrative.mjs';",
        "",
        "const ID = {};".format(js_str(module["id"])),
        "const L = () => {",
        "  const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);",
        "  expect(m, 'L{} must be in the series').toBeTruthy();".format(ll),
        "  return m;",
        "};",
        "const ALL = () => quotedTexts(L()).map(([, t]) => t).join(' ');",
        "const SPANS = " + js_value(spans, 0) + ";",
        "",
        "describe('L{} is really in the series', () => {{".format(ll),
        "  it('carries all the fields and four authored bands', () => {",
        "    const m = L();",
        "    expect(m.title).toBe({});".format(js_str(module["title"])),
        "    for (const f of ['bigIdea', 'inApp', 'lesson']) expect(typeof m[f]).toBe('string');",
        "    expect(m.quiz.questions.length).toBe({});".format(len(module["quiz"]["questions"])),
        "    expect(m.facilitator.talkingPoints.length).toBe({});".format(len(module["facilitator"]["talkingPoints"])),
        "    for (const b of FULL_BANDS) expect(typeof m.levels[b], `${b} must be authored`).toBe('string');",
        "  });",
        "",
        "  it('the week count equals the module count, and the lesson carries its day', () => {",
        "    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);",
        "    expect(LIVING_LESSONS_ADDED[ID]).toBe('{}');".format(date),
        "  });",
        "});",
        "",
        "describe('every quoted span is the verse it names', () => {",
        "  it('the whole lesson resolves verbatim, on every surface', () => {",
        "    const scan = scanQuotedVerses([L()], quotedTexts);",
        "    expect(scan.spans).toBeGreaterThanOrEqual({});".format(len(spans)),
        "    expect(scan.faults.map((f) => `${f.where} :: ${f.kind} :: ${f.ref || ''}`)).toEqual([]);",
        "    expect(scan.verbatim).toBe(scan.spans);",
        "  });",
        "",
        "  it('every double-quoted span carries its reference; straight quotes; no ellipsis, record id or percentage', () => {",
        "    for (const [where, text] of quotedTexts(L())) {",
        "      const quotes = (String(text).match(/\"([^\"]+)\"/g) || []).length;",
        "      const withRef = (String(text).match(/\"([^\"]+)\"\\s*\\(([1-3]?\\s?[A-Za-z]+(?: of [A-Za-z]+)*)\\s+(\\d+):([\\d\\-,\\s]+)\\)/g) || []).length;",
        "      expect(withRef, `${where}: ${quotes} quoted spans, ${withRef} with a reference`).toBe(quotes);",
        "      for (const span of String(text).matchAll(/\"([^\"]+)\"/g)) expect(/\\.\\.\\.|…/.test(span[1]), `${where} elides`).toBe(false);",
        "      expect(/DR-\\d{4}/.test(text), `${where} recites a record id`).toBe(false);",
        "      expect(/\\d\\s*%/.test(text), `${where} states a percentage`).toBe(false);",
        "    }",
        "    expect(ALL().includes('\u201c') || ALL().includes('\u201d')).toBe(false);",
        "  });",
        "",
        "  it('every span it was built with is still in the lesson, word for word', () => {",
        "    for (const s of SPANS) expect(ALL()).toContain(s);",
        "  });",
        "",
        "  it('PROVEN-TO-CATCH: one changed word inside a quotation fails the verse gate', () => {",
        "    const broken = {};".format(broken),
        "    expect(scanQuotedVerses([broken], quotedTexts).faults.length).toBeGreaterThan(0);",
        "  });",
        "});",
        "",
        "describe('our voice keeps the bindings', () => {",
        "  it('says Yahweh in our own voice: no generic \"God\" and no capitalised adversary name outside a quotation', () => {",
        "    const prose = ALL().replace(/\"[^\"]*\"/g, ' ');",
        "    expect(prose.match(/\\bGod\\b/g)).toBe(null);",
        "    expect(/\\b(Satan|Lucifer|Devil|Baal)\\b/.test(prose)).toBe(false);",
        "  });",
        "",
        "  it('every band and the lesson end with the confession', () => {",
        "    for (const t of [L().lesson, ...FULL_BANDS.map((b) => L().levels[b])]) {",
        "      expect(t.trimEnd().endsWith('Jesus is the Lamb of Yahweh and the Eternal Son of Yahweh.')).toBe(true);",
        "    }",
        "  });",
        "});",
        "",
        "describe('the register is ordered, and measured rather than asserted', () => {",
        "  it('every band clears its full-levels floor', () => {",
        "    const f = measureFullness(L());",
        "    for (const b of FULL_BANDS) expect(f.bands[b].share, b).toBeGreaterThanOrEqual(FULL_FLOOR[b]);",
        "  });",
        "  it('the grades ascend and the child band is held to the age', () => {",
        "    const m = measureLesson(L());",
        "    expect(isInverted(m), JSON.stringify(m.bands)).toBe(false);",
        "    expect(breachesChildCeiling(m, NEW_LESSON_CHILD_CEILING)).toBe(false);",
        "  });",
        "  it('the four bands are genuinely different texts', () => {",
        "    const d = measureDifferentiation(L());",
        "    expect(d).toBeTruthy();",
        "    expect(d.worst).toBeLessThan(DIFF_CEILING);",
        "  });",
        "  it('every band names its own lesson near its start', () => {",
        "    for (const b of FULL_BANDS) expect(namesItsLesson(L().title, L().levels[b]), b).toBe(true);",
        "  });",
        "});",
        "",
    ]
    return "\n".join(head)


def failure_lines(gate_results, limit=30):
    """What a failed draft got wrong, in words a writer can act on -- read from
    the stored gate results, deterministic."""
    g = gate_results or {}
    out = []
    for f in (g.get("verse") or {}).get("faults") or []:
        if f.get("kind") == "not-the-verse":
            out.append('({}) was quoted as "{}" but the verse reads: {}'.format(f.get("ref"), f.get("quoted"), f.get("verse")))
        else:
            out.append("({}) {}".format(f.get("ref"), f.get("kind")))
    for k in ("quotation", "voice", "depth", "structure"):
        out.extend((g.get(k) or {}).get("problems") or [])
    rg = g.get("repo_gates") or {}
    if (rg.get("fullLevels") or {}).get("passed") is False:
        out.append("these bands are too short against the full lesson (own words, quotations removed): "
                   + ", ".join(rg["fullLevels"].get("short") or []))
    if (rg.get("title") or {}).get("passed") is False:
        out.append("these bands do not name the lesson's title near their start: " + ", ".join(rg["title"].get("unnamed") or []))
    if (rg.get("readingLevel") or {}).get("passed") is False:
        out.append("reading levels must rise child < youth < teen < senior, and the child band must read at grade 5 or below")
    if (rg.get("differentiation") or {}).get("passed") is False:
        out.append("the bands repeat each other; each band must be its own telling")
    return out[:limit]


def previous_failures(group, data_dir, current_build):
    """The failure lines of this teaching's earlier builds on this NAS."""
    out = []
    for r in group:
        for t in r.get("tags") or []:
            if not str(t).startswith("build-group:") or t[12:] == current_build:
                continue
            try:
                with open(os.path.join(data_dir, "versions", t[12:] + ".json"), encoding="utf-8") as f:
                    for rec in json.load(f):
                        out.extend(failure_lines(rec.get("gate_results")))
            except (OSError, ValueError):
                continue
    seen, uniq = set(), []
    for x in out:
        if x not in seen:
            seen.add(x)
            uniq.append(x)
    return uniq[:30]


def provenance_text(group, owners=OWNER_IDS):
    parts = []
    for r in group:
        tags = r.get("tags") or []
        who = "Darrell" if str(r.get("created_by")) in owners else "a member (approved by the Governor)"
        how = "spoken and transcribed by Whisper on our own machines" if "voice-transcript" in tags else "typed"
        rung = next((t[8:] for t in tags if str(t).startswith("whisper:")), "")
        parts.append("Row `{}` ({}, {}{}, {}).".format(r["id"], who, how, " on " + rung if rung else "", str(r.get("created_at", ""))[:19]))
    return ("On the day it was sent, the teaching reached the NAS lesson builder the moment its words were written. "
            + " ".join(parts) + " The rows are one teaching (DR-0610).")


# =============================================================================
# the brakes
# =============================================================================

def kill_state(mirror=MIRROR):
    """(stopped, why) -- the deterministic stop-paths (DR-0248)."""
    armed = os.path.join(mirror, "infra", "nas-loops", "ARMED-BY-RECORD")
    if not os.path.isfile(armed):
        return True, "ARMED-BY-RECORD is gone from infra/nas-loops: the fleet is disarmed by record"
    try:
        with open(os.path.join(mirror, "infra", "nas-loops", "services.json"), encoding="utf-8") as f:
            doc = json.load(f)
    except (OSError, ValueError) as e:
        return True, "services.json unreadable ({}): stopping rather than guessing".format(e)
    entry = next((s for s in doc.get("services", []) if s.get("name") == SERVICE_NAME), None)
    if not entry:
        return True, "services.json has no {} entry".format(SERVICE_NAME)
    if not entry.get("enabled"):
        return True, "services.json {} is enabled:false".format(SERVICE_NAME)
    return False, "armed by record"


def _pid_alive(pid):
    try:
        os.kill(pid, 0)
        return True
    except OSError as e:
        return e.errno == errno.EPERM


def acquire_row_lock(data_dir, row_id, now=None, max_age=BUILD_MAX_SECONDS + 120):
    """O_EXCL lock file per row: True if we hold it now. A lock whose process
    is gone, or that is older than the build budget, is broken once."""
    now = now if now is not None else time.time()
    d = os.path.join(data_dir, "locks")
    os.makedirs(d, exist_ok=True)
    p = os.path.join(d, re.sub(r"[^A-Za-z0-9-]", "", row_id) + ".lock")
    for _ in range(2):
        try:
            fd = os.open(p, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o644)
            with os.fdopen(fd, "w") as f:
                f.write("{} {}".format(os.getpid(), int(now)))
            return True
        except OSError as e:
            if e.errno != errno.EEXIST:
                raise
            try:
                with open(p) as f:
                    pid_s, t_s = (f.read().split() + ["0", "0"])[:2]
                pid, t = int(pid_s), int(t_s)
            except (OSError, ValueError):
                pid, t = 0, 0
            if (pid and _pid_alive(pid)) and now - t <= max_age:
                return False
            try:
                os.remove(p)
            except OSError:
                return False
    return False


def release_row_lock(data_dir, row_id):
    try:
        os.remove(os.path.join(data_dir, "locks", re.sub(r"[^A-Za-z0-9-]", "", row_id) + ".lock"))
    except OSError:
        pass


def run_with_budget(argv, seconds, stdin_bytes=b"", env=None):
    """Run a build in its own process group with a wall-clock budget.
    Returns {"timed_out": bool, "code": int|None, "stdout": str, "stderr": str}.
    On overrun the WHOLE group is killed (a hung writer cannot outlive it)."""
    p = subprocess.Popen(argv, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                         start_new_session=True, env=env)
    try:
        out, err = p.communicate(stdin_bytes, timeout=seconds)
        return {"timed_out": False, "code": p.returncode, "stdout": out.decode("utf-8", "replace"),
                "stderr": err.decode("utf-8", "replace")}
    except subprocess.TimeoutExpired:
        try:
            os.killpg(p.pid, signal.SIGKILL)
        except OSError:
            p.kill()
        out, err = p.communicate()
        return {"timed_out": True, "code": None, "stdout": (out or b"").decode("utf-8", "replace"),
                "stderr": (err or b"").decode("utf-8", "replace")}


# =============================================================================
# the build (one teaching). Every external call goes through `db`, `git`,
# `writers` and `hosted`, so the tests drive the whole road without a network.
# =============================================================================

class BuildFailed(Exception):
    pass


class Build:
    def __init__(self, group, db, git, writers, corpus, data_dir=DATA, owners=OWNER_IDS, hosted=None,
                 band_gates=None, local_tests=None, today=None, build_id=None, now=utc_now,
                 writer_timeout=WRITER_MAX_SECONDS, mode=writer.DEFAULT_MODE, selected=()):
        self.group, self.db, self.git, self.writers, self.corpus = group, db, git, writers, corpus
        self.data_dir, self.owners, self.hosted = data_dir, owners, hosted
        self.band_gates, self.local_tests, self.now = band_gates, local_tests, now
        self.today = today or datetime.date.today().isoformat()
        self.build_id = build_id or str(uuid.uuid4())
        self.writer_timeout = writer_timeout
        # The row may choose its own run (writer-mode:/writer: tags); else the default.
        self.mode, self.selected = writer.mode_for_row(
            [t for r in group for t in (r.get("tags") or [])], mode, selected)
        self.ids = [r["id"] for r in group]
        self.companions = [c for c in companion_ids(group) if c not in self.ids]
        self.numbers = os.path.join(data_dir, "numbers.json")
        self.report = {"build_id": self.build_id, "rows": self.ids, "stages": {}, "outcome": ""}
        self.worktree = None

    # -- tags --------------------------------------------------------------
    def stage(self, name, extra=()):
        ts = self.now()
        self.report["stages"][name] = ts
        for rid in self.ids:
            self.db.add_tags(rid, [stage_tag(name, ts)] + list(extra))

    def finish(self, add, remove=("lesson-building",), companions_add=(), hosted_add=()):
        for rid in self.ids:
            self.db.add_tags(rid, list(add))
            self.db.remove_tags(rid, list(remove))
        for cid in self.companions:
            if companions_add:
                self.db.add_tags(cid, list(companions_add))
        if self.hosted and hosted_add:
            for rid in self.ids + self.companions:
                try:
                    self.hosted.merge_tags(rid, list(hosted_add))
                except Exception:  # noqa: BLE001 -- not mirrored yet: the mirror carries the tags later
                    pass

    def fail(self, why, stage="failed"):
        ts = self.now()
        self.report["stages"][stage] = ts
        self.report["outcome"] = stage
        self.report["why"] = str(why)
        add = [stage_tag(stage, ts), reason_tag(why)] + (["build-failed"] if stage == "failed" else [])
        self.finish(add)
        release_numbers(self.numbers, self.build_id)
        self._drop_worktree()
        return self.report

    def _drop_worktree(self):
        if self.worktree:
            try:
                self.git.worktree_remove(self.worktree)
            except Exception:  # noqa: BLE001
                pass
            self.worktree = None

    # -- the road ----------------------------------------------------------
    def run(self):
        try:
            return self._run()
        except BuildFailed as e:
            return self.fail(e)
        except Exception as e:  # noqa: BLE001 -- every crash is a stated failure on the row
            return self.fail("{}: {}".format(type(e).__name__, e))

    def _run(self):
        self.stage("grouped", ["build-group:" + self.build_id])
        self.git.fetch()
        # One teaching, one lesson (DR-0610): already built -> compare, build nothing.
        teaching = teaching_of(self.group)
        corpus_norm = normalize_for_search(" ".join(self.git.catalog_texts()))
        if already_built(fingerprints(teaching), corpus_norm):
            ts = self.now()
            self.report["outcome"] = "duplicate"
            self.finish([stage_tag("duplicate", ts), "lesson-captured", "parallel-compared"],
                        companions_add=["lesson-captured"], hosted_add=["lesson-captured", "parallel-compared"])
            return self.report

        verses = gates.cited_references(teaching, self.corpus)
        self.stage("verses-fetched")
        feedback = previous_failures(self.group, self.data_dir, self.build_id)
        prompt = writer.build_prompt(teaching, self.group, self.owners, verses, feedback=feedback)
        sha = writer.sha256_text(prompt)
        run_writers, mode_note = writer.select_writers(self.writers, self.mode, self.selected)
        self.report["mode"] = mode_note
        self.stage("writing", ["build-prompt:" + sha[:16], "build-mode:" + self.mode])
        results, tried = writer.fan_out(run_writers, prompt, self.writer_timeout)
        self.report["writers_tried"] = tried
        if not results:
            raise BuildFailed("no writer reachable: " + "; ".join("{} ({})".format(t["writer"], t["why"]) for t in tried))
        self.stage("written")

        versions = []
        for r in results:
            v = dict(r)
            v["build_id"], v["prompt_text"] = self.build_id, prompt
            obj, module = None, None
            if r["ok"]:
                try:
                    obj = gates.canonical_apostrophes(writer.extract_json(r["text"]))
                except ValueError as e:
                    v["ok"], v["error"] = False, "unreadable reply: {}".format(e)
            v["body"] = obj
            if isinstance(obj, dict) and obj.get("verdict") == "lesson" and not writer.schema_problems(obj):
                module = lesson_module(obj, 0)
            v["gates"] = gates.gate_version(obj, module, self.corpus, writer.schema_problems,
                                            band_gates=self.band_gates) if obj is not None else {"passed": False, "verse_passed": False}
            v["family"] = r.get("family")
            versions.append(v)
        self.stage("gated")
        self.report["versions"] = [{"writer": v["writer"], "ok": v["ok"], "passed": v["gates"].get("passed"),
                                    "verse": (v["gates"].get("verse") or {}).get("verbatim"),
                                    "error": v.get("error", "")} for v in versions]

        drafts = [v for v in versions if isinstance(v.get("body"), dict)]
        verdicts = [v["body"].get("verdict") for v in drafts]
        primary = writer.primary_name(self.writers)
        if drafts and all(x in ("test-only", "not-a-lesson") for x in verdicts):
            self._store(versions, None)
            ts = self.now()
            self.report["outcome"] = "skipped-test"
            self.finish([stage_tag("skipped-test", ts), "lesson-captured", reason_tag("the writers read it as " + verdicts[0])],
                        companions_add=["lesson-captured"], hosted_add=["lesson-captured"])
            return self.report

        lessons = [v for v in drafts if v["body"].get("verdict") == "lesson"]
        if self.mode != "primary" and len(lessons) > 1:
            # MORE THAN ONE VERSION: Darrell decides (2026-09-29: "those end in
            # PoeTech for me to review their and the decide on which one or merge
            # 2 of them or all of them"). Nothing ships until his decision row.
            self._store(versions, None)
            ts = self.now()
            self.report["outcome"] = "awaiting-review"
            self.finish([stage_tag("awaiting-review", ts), "awaiting-review"],
                        hosted_add=["awaiting-review"])
            return self.report

        chosen, why = gates.select_version(versions, primary)
        if chosen is None:
            self._store(versions, None)
            raise BuildFailed(why + ": " + "; ".join(
                "{} {}".format(v["writer"], v.get("error") or self._gate_summary(v["gates"])) for v in versions))
        chosen["selection_why"] = why
        placement = chosen["body"].get("placement")
        if placement != "living-lessons":
            self._store(versions, None)
            ts = self.now()
            self.report["outcome"] = "deferred"
            self.finish([stage_tag("deferred", ts), reason_tag(
                "placement {} is built by the hourly Routine; this builder writes Living Lessons".format(placement))])
            return self.report
        self.stage("selected", ["build-writer:" + chosen["writer"]])
        return self.ship(chosen, versions)

    def ship(self, chosen, versions, on_stored=None, store=None):
        """numbered -> files-written -> test-generated -> reconciled -> tested ->
        committed -> pushed -> published. Shared by the one-writer build and the
        decision stage (a chosen or merged composite). The verse gate is re-run
        on the exact committed object first; a failure raises and nothing ships."""
        repo_ll, repo_dr = self.git.max_numbers()
        ll, dr = reserve_numbers(self.numbers, repo_ll, repo_dr, self.build_id)
        self.stage("numbered", ["build-lesson:L{}".format(ll), "build-dr:DR-{:04d}".format(dr)])

        module = lesson_module(chosen["body"], ll)
        final = gates.gate_version(chosen["body"], module, self.corpus, writer.schema_problems, band_gates=self.band_gates)
        if not (final.get("verse_passed") and final.get("passed")):
            raise BuildFailed("the gates failed on the committed object: " + self._gate_summary(final))
        chosen["gates"] = final
        branch = "claude/lesson-l{}-{}".format(ll, "-".join(chosen["body"]["slug"].split("-")[:6]))
        self.worktree = self.git.worktree_add(branch, self.build_id)
        self._write_files(module, ll, dr, chosen, versions)
        self.stage("files-written")
        self.stage("test-generated")
        self._reconcile(module, ll, dr)
        self.stage("reconciled")
        if self.local_tests:
            ok, detail = self.local_tests(self.worktree, ll)
            if ok is False:
                raise BuildFailed("local tests failed: " + detail)
            self.stage("tested", [] if ok else ["build-tests:ci-only"])
        subject = "Living Lessons L{}: {} (DR-{:04d})".format(ll, module["title"], dr)
        body = ("Built on the NAS by the lesson builder (DR-0669) the moment the words landed.\n"
                "Rows: {}. Writer: {} ({}). Prompt sha256 {}.\n"
                "Every quoted span re-verified against app/public/bible/kjv: {} of {} verbatim.").format(
            ", ".join(self.ids), chosen["writer"], chosen.get("family"), chosen.get("prompt_sha256", ""),
            final["verse"]["verbatim"], final["verse"]["spans"])
        self.git.commit(self.worktree, subject, body)
        self.stage("committed")
        self.git.push(self.worktree, branch)  # raises on failure: nothing below runs
        self.stage("pushed")
        self._store(versions if store is None else store, chosen, module["id"])
        if on_stored:
            on_stored(module["id"], branch)
        ts = self.now()
        self.report["outcome"] = "published"
        self.report.update(lesson_id=module["id"], branch=branch, ll=ll, dr=dr, writer=chosen["writer"])
        add = [stage_tag("published", ts), "lesson-captured", "lesson-published", "lesson-id:" + module["id"]]
        self.finish(add, remove=("lesson-building", "awaiting-review"), companions_add=["lesson-captured"],
                    hosted_add=["lesson-captured", "lesson-published", "lesson-id:" + module["id"]])
        release_numbers(self.numbers, self.build_id)
        self._drop_worktree()
        return self.report

    @staticmethod
    def _gate_summary(g):
        bits = []
        for k in ("structure", "verse", "quotation", "voice", "depth"):
            x = g.get(k) or {}
            if x and not x.get("passed"):
                faults = x.get("faults") or x.get("problems") or []
                first = faults[0] if faults else ""
                if isinstance(first, dict):
                    first = "{} {}".format(first.get("kind"), first.get("ref"))
                bits.append("{} failed ({})".format(k, first))
        rg = g.get("repo_gates") or {}
        if rg and rg.get("skipped") is None and not rg.get("passed"):
            bits.append("repo gates failed ({})".format(",".join(k for k, x in rg.items() if isinstance(x, dict) and not x.get("passed"))))
        return "; ".join(bits) or "did not pass"

    def _store(self, versions, chosen, lid=None):
        """Every version is kept: the database (lesson_versions) and a copy on
        the NAS. A storage failure is reported, never allowed to lose a lesson."""
        recs = []
        for v in versions:
            recs.append({
                "build_id": self.build_id, "teaching_row_id": self.ids[0], "instance_id": self.group[0].get("instance_id"),
                "lesson_id": lid if (chosen is not None and v is chosen) else None,
                "writer": v["writer"], "family": v.get("family"), "model_label": v.get("model_label"),
                "prompt_sha256": v["prompt_sha256"], "prompt_text": v["prompt_text"],
                "body": v.get("body"), "gate_results": v.get("gates"), "elapsed_ms": v.get("elapsed_ms"),
                "usage": v.get("usage"), "error": v.get("error") or None,
                "published": bool(chosen is not None and v is chosen),
                "backfill": False, "source_ref": None,
            })
        d = os.path.join(self.data_dir, "versions")
        os.makedirs(d, exist_ok=True)
        with open(os.path.join(d, self.build_id + ".json"), "w", encoding="utf-8") as f:
            json.dump(recs, f, indent=1)
        try:
            for r in recs:
                self.db.insert_version(r)
            self.report["versions_stored"] = len(recs)
        except Exception as e:  # noqa: BLE001
            self.report["versions_stored"] = "database: {} (kept on the NAS at versions/{}.json)".format(e, self.build_id)

    def _write_files(self, module, ll, dr, chosen, versions):
        wt = self.worktree
        src = self.git.read(wt, LIVING)
        src = insert_module(src, module_js(module))
        src, _ = bump_weeks(src, ll, module["title"], self.today)
        self.git.write(wt, LIVING, src)
        self.git.write(wt, DATES, insert_date(self.git.read(wt, DATES), module["id"], self.today, dr))
        self.git.write(wt, "app/src/__tests__/living-lessons-l{}-verses.test.js".format(ll),
                       verse_test_js(module, ll, dr, self.today, self.group, chosen))
        fname = dr_filename(dr, chosen["body"]["slug"])
        self.git.write(wt, "docs/decisions/" + fname,
                       dr_markdown(dr, ll, module, chosen, versions, self.group, self.today, provenance_text(self.group, self.owners)))
        self.git.write(wt, INDEX, update_index(self.git.read(wt, INDEX),
                                               index_row(dr, fname, ll, module["title"], chosen["body"].get("dr_summary", "")),
                                               dr, chosen["body"]["slug"], self.today))

    def _reconcile(self, module, ll, dr):
        wt = self.worktree
        for path, key in BASELINES:
            self.git.write(wt, path, bump_json_count(self.git.read(wt, path), key))
        text, _ = bump_crosslist(self.git.read(wt, CROSSLIST), ll, module["title"], dr, self.today)
        self.git.write(wt, CROSSLIST, text)


# =============================================================================
# the real I/O
# =============================================================================

def _run(argv, cwd=None, env=None, timeout=600, input_bytes=None):
    r = subprocess.run(argv, cwd=cwd, env=env, capture_output=True, timeout=timeout, input=input_bytes)
    if r.returncode != 0:
        raise RuntimeError("{} exit {}: {}".format(" ".join(argv[:3]), r.returncode,
                                                   ((r.stdout or b"") + (r.stderr or b""))[-400:].decode("utf-8", "replace")))
    return r.stdout.decode("utf-8", "replace")


class Git:
    """The builder's OWN clone at DATA/repo (never the services-sync mirror, so
    a build can never leave the mirror dirty)."""

    def __init__(self, data_dir=DATA, remote=REMOTE_URL, token_file=TOKEN_FILE):
        self.clone = os.path.join(data_dir, "repo")
        self.wt_dir = os.path.join(data_dir, "worktrees")
        self.remote, self.token_file, self.data_dir = remote, token_file, data_dir

    def g(self, *args, cwd=None, timeout=600, env=None):
        return _run(["git", "-C", cwd or self.clone] + list(args), env=env, timeout=timeout)

    def ensure(self):
        if not os.path.isdir(os.path.join(self.clone, ".git")):
            os.makedirs(self.data_dir, exist_ok=True)
            _run(["git", "clone", "--no-tags", self.remote, self.clone], timeout=1800)
        self.g("config", "user.name", "PoeTech NAS lesson builder")
        self.g("config", "user.email", "darrellpoe06@gmail.com")

    def fetch(self):
        self.ensure()
        self.g("fetch", "--prune", "--no-tags", "origin", "+refs/heads/*:refs/remotes/origin/*", timeout=900)

    def show(self, ref, path):
        try:
            return self.g("show", "{}:{}".format(ref, path), timeout=120)
        except RuntimeError:
            return ""

    def recent_refs(self, days=21):
        out = self.g("for-each-ref", "--format=%(refname) %(committerdate:unix)", "refs/remotes/origin")
        cutoff = time.time() - days * 86400
        refs = []
        for line in out.splitlines():
            parts = line.split()
            if len(parts) == 2 and parts[1].isdigit() and int(parts[1]) >= cutoff and not parts[0].endswith("/HEAD"):
                refs.append(parts[0])
        return refs

    def max_numbers(self):
        """The highest lesson and DR numbers on main AND every branch pushed in
        the last three weeks (the lanes in flight), plus INDEX.md's claims."""
        ll, dr = 0, 0
        for ref in ["refs/remotes/origin/main"] + self.recent_refs():
            try:
                hits = self.g("grep", "-h", "-E", "id: 'll[0-9]+-", ref, "--", LIVING, timeout=120)
            except RuntimeError:
                hits = ""
            ll = max(ll, max_ll([hits]))
            try:
                names = self.g("ls-tree", "--name-only", ref, "docs/decisions/", timeout=120)
            except RuntimeError:
                names = ""
            dr = max(dr, max([int(m) for m in re.findall(r"DR-(\d{4})-", names)] or [0]))
        dr = max(dr, max_dr([self.show("refs/remotes/origin/main", INDEX)]))
        return ll, dr

    def catalog_texts(self):
        files = self.g("ls-tree", "-r", "--name-only", "refs/remotes/origin/main", "app/src/lib", "docs/decisions", timeout=120)
        out = []
        for p in files.splitlines():
            if p.startswith(DUP_SOURCES_PREFIX) and (p.endswith("-class.js") or p.endswith(".md")):
                out.append(self.show("refs/remotes/origin/main", p))
        return out

    def worktree_add(self, branch, build_id):
        os.makedirs(self.wt_dir, exist_ok=True)
        path = os.path.join(self.wt_dir, build_id)
        self.g("worktree", "add", "-B", branch, path, "refs/remotes/origin/main", timeout=600)
        nm = os.path.join(self.clone, "app", "node_modules")
        if os.path.isdir(nm) and not os.path.exists(os.path.join(path, "app", "node_modules")):
            os.symlink(nm, os.path.join(path, "app", "node_modules"))
        return path

    def worktree_remove(self, path):
        self.g("worktree", "remove", "--force", path, timeout=300)

    def read(self, wt, rel):
        with open(os.path.join(wt, rel), encoding="utf-8") as f:
            return f.read()

    def write(self, wt, rel, text):
        p = os.path.join(wt, rel)
        os.makedirs(os.path.dirname(p), exist_ok=True)
        with open(p, "w", encoding="utf-8") as f:
            f.write(text)

    def commit(self, wt, subject, body):
        self.g("add", "-A", cwd=wt)
        self.g("commit", "-q", "-m", subject, "-m", body, cwd=wt)

    def push(self, wt, branch):
        if not os.path.isfile(self.token_file):
            raise BuildFailed("no GitHub token at {} to push with".format(self.token_file))
        askpass = os.path.join(self.data_dir, "askpass.sh")
        if not os.path.isfile(askpass):
            with open(askpass, "w") as f:
                f.write('#!/bin/sh\ncase "$1" in Username*) echo x-access-token ;; *) cat "{}" ;; esac\n'.format(self.token_file))
            os.chmod(askpass, 0o700)
        env = dict(os.environ, GIT_ASKPASS=askpass, GIT_TERMINAL_PROMPT="0")
        self.g("push", "-u", "origin", "{0}:refs/heads/{0}".format(branch), cwd=wt, env=env, timeout=600)


def local_tests(wt, ll):
    """The new pin and the count suites, when node_modules is on the box.
    Returns (True, ''), (False, why), or (None, 'ci-only: ...')."""
    vitest = os.path.join(wt, "app", "node_modules", ".bin", "vitest")
    if not os.path.exists(vitest):
        return None, "ci-only: no node_modules in the builder clone"
    files = ["src/__tests__/living-lessons-l{}-verses.test.js".format(ll), "src/__tests__/learn-crosslist.test.js"]
    r = subprocess.run([vitest, "run"] + files, cwd=os.path.join(wt, "app"), capture_output=True, timeout=900)
    if r.returncode != 0:
        return False, (r.stdout + r.stderr)[-600:].decode("utf-8", "replace")
    return True, ""


class Db:
    """pg8000 on the database the app reads (agent_consumer.resolve_db: the
    sovereign stack when REPOINT-ARMED, the same door the box agent uses)."""

    def __init__(self, params):
        import pg8000.native  # vendored under infra/nas-agent/.vendor
        self.con = pg8000.native.Connection(
            user=params["user"], password=params["password"], host=params["host"], port=params["port"],
            database=params["database"], ssl_context=None, timeout=60)
        self.con.run("SET statement_timeout = '30s'")

    def pending(self):
        rows = self.con.run(
            "SELECT id::text, instance_id::text, created_by::text, body, tags, created_at::text FROM public.agent_inbox "
            "WHERE tags @> '[\"lesson\"]'::jsonb AND NOT tags @> '[\"lesson-captured\"]'::jsonb ORDER BY created_at ASC")
        return [{"id": r[0], "instance_id": r[1], "created_by": r[2], "body": r[3],
                 "tags": r[4] if isinstance(r[4], list) else json.loads(r[4] or "[]"), "created_at": r[5]} for r in rows]

    def claim(self, rid, ts):
        """Atomic: the row is ours only if no one holds it and it is not captured."""
        rows = self.con.run(
            "UPDATE public.agent_inbox SET tags = tags || CAST(:add AS jsonb) WHERE id = CAST(:id AS uuid) "
            "AND NOT (tags ?| array['lesson-building','lesson-captured']) RETURNING id::text",
            add=json.dumps(["lesson-building", stage_tag("claimed", ts)]), id=rid)
        return bool(rows)

    def add_tags(self, rid, tags):
        self.con.run(
            "UPDATE public.agent_inbox SET tags = tags || (SELECT coalesce(jsonb_agg(x), '[]'::jsonb) "
            "FROM jsonb_array_elements(CAST(:add AS jsonb)) x WHERE NOT agent_inbox.tags @> jsonb_build_array(x)) "
            "WHERE id = CAST(:id AS uuid)", add=json.dumps(list(tags)), id=rid)

    def remove_tags(self, rid, names):
        self.con.run("UPDATE public.agent_inbox SET tags = tags - CAST(:names AS text[]) WHERE id = CAST(:id AS uuid)",
                     names=list(names), id=rid)

    def insert_version(self, r):
        refuse_published_backfill(r)
        self.con.run(
            "INSERT INTO public.lesson_versions (build_id, teaching_row_id, instance_id, lesson_id, writer, family, "
            "model_label, prompt_sha256, prompt_text, body, gate_results, elapsed_ms, usage, error, published, backfill, source_ref) VALUES "
            "(CAST(:build_id AS uuid), CAST(:teaching_row_id AS uuid), CAST(:instance_id AS uuid), :lesson_id, :writer, "
            ":family, :model_label, :prompt_sha256, :prompt_text, CAST(:body AS jsonb), CAST(:gate_results AS jsonb), "
            ":elapsed_ms, CAST(:usage AS jsonb), :error, :published, :backfill, :source_ref)",
            build_id=r["build_id"], teaching_row_id=r["teaching_row_id"], instance_id=r["instance_id"],
            lesson_id=r["lesson_id"], writer=r["writer"], family=r["family"], model_label=r["model_label"],
            prompt_sha256=r["prompt_sha256"], prompt_text=r["prompt_text"], body=json.dumps(r["body"]),
            gate_results=json.dumps(r["gate_results"]), elapsed_ms=r["elapsed_ms"], usage=json.dumps(r["usage"] or {}),
            error=r["error"], published=r["published"], backfill=bool(r.get("backfill")),
            source_ref=r.get("source_ref"))

    def settings(self):
        """(mode, selected, backfill_requested) from public.lesson_builder_settings,
        the Governor's in-app control. Absent table/row -> None."""
        try:
            rows = self.con.run("SELECT writer_mode, selected_writers, backfill_requested_at::text, "
                                "backfill_done_at::text, backfill_scope FROM public.lesson_builder_settings WHERE id = 1")
        except Exception:  # noqa: BLE001 -- the migration has not reached this database yet
            return None
        if not rows:
            return None
        r = rows[0]
        return {"mode": r[0], "selected": list(r[1] or []), "backfill_requested_at": r[2],
                "backfill_done_at": r[3], "backfill_scope": r[4]}

    def publish_status(self, status):
        """What the service sees (writers tried, state) -- for the app's tick-boxes."""
        try:
            self.con.run("INSERT INTO public.lesson_builder_settings (id, service_status, service_status_at) "
                         "VALUES (1, CAST(:s AS jsonb), now()) ON CONFLICT (id) DO UPDATE SET "
                         "service_status = EXCLUDED.service_status, service_status_at = now()", s=json.dumps(status))
        except Exception:  # noqa: BLE001
            pass

    def backfill_done(self, summary):
        self.con.run("UPDATE public.lesson_builder_settings SET backfill_done_at = now(), "
                     "backfill_summary = CAST(:s AS jsonb) WHERE id = 1", s=json.dumps(summary))

    # -- decisions (public.lesson_decisions, written by the app) -------------
    DECISION_COLS = ("id", "build_id", "teaching_row_id", "version_id", "merge_map", "edits", "status")

    def decision(self, did):
        rows = self.con.run("SELECT id::text, build_id::text, teaching_row_id::text, version_id::text, merge_map, edits, status "
                            "FROM public.lesson_decisions WHERE id = CAST(:id AS uuid)", id=did)
        if not rows:
            return None
        d = dict(zip(self.DECISION_COLS, rows[0]))
        for k in ("merge_map", "edits"):
            if isinstance(d[k], str):
                d[k] = json.loads(d[k])
        return d

    def pending_decisions(self):
        return [r[0] for r in self.con.run(
            "SELECT id::text FROM public.lesson_decisions WHERE status = 'decided' ORDER BY decided_at ASC")]

    def claim_decision(self, did):
        return bool(self.con.run("UPDATE public.lesson_decisions SET status = 'building' WHERE id = CAST(:id AS uuid) "
                                 "AND status = 'decided' RETURNING id", id=did))

    def update_decision(self, did, **f):
        sets, args = ["processed_at = now()"], {"id": did}
        for k, v in f.items():
            if k not in ("status", "gate_result", "lesson_id", "branch", "pr_url"):
                raise ValueError(k)
            sets.append("{0} = {1}".format(k, "CAST(:gate_result AS jsonb)" if k == "gate_result" else ":" + k))
            args[k] = json.dumps(v) if k == "gate_result" else v
        self.con.run("UPDATE public.lesson_decisions SET " + ", ".join(sets) + " WHERE id = CAST(:id AS uuid)", **args)

    def versions(self, build_id):
        rows = self.con.run("SELECT id::text, writer, family, model_label, prompt_sha256, prompt_text, body, gate_results "
                            "FROM public.lesson_versions WHERE build_id = CAST(:b AS uuid) AND NOT backfill", b=build_id)
        out = []
        for r in rows:
            body = r[6] if not isinstance(r[6], str) else json.loads(r[6])
            g = r[7] if not isinstance(r[7], str) else json.loads(r[7])
            out.append({"id": r[0], "writer": r[1], "family": r[2], "model_label": r[3], "prompt_sha256": r[4],
                        "prompt_text": r[5], "body": body, "gates": g, "ok": body is not None})
        return out

    def rows_by_build(self, build_id):
        rows = self.con.run(
            "SELECT id::text, instance_id::text, created_by::text, body, tags, created_at::text FROM public.agent_inbox "
            "WHERE tags @> CAST(:t AS jsonb) ORDER BY created_at ASC", t=json.dumps(["build-group:" + build_id]))
        return [{"id": r[0], "instance_id": r[1], "created_by": r[2], "body": r[3],
                 "tags": r[4] if isinstance(r[4], list) else json.loads(r[4] or "[]"), "created_at": r[5]} for r in rows]

    def listen(self):
        self.con.run("LISTEN " + CHANNEL)

    def socket(self):
        for attr in ("_usock", "_sock"):
            s = getattr(self.con, attr, None)
            if s is not None and hasattr(s, "fileno"):
                return s
        return None

    def drain(self):
        """Pump the connection and return every notified row id."""
        self.con.run("SELECT 1")
        out = []
        while self.con.notifications:
            n = self.con.notifications.popleft()
            out.append(n[2] if isinstance(n, (tuple, list)) else getattr(n, "payload", ""))
        return [x for x in out if x]


def resolve_db_params():
    sys.path.insert(0, os.path.join(HERE, "..", "nas-agent"))
    from agent_consumer import resolve_db  # noqa: E402 -- also puts the vendored pg8000 on sys.path
    return resolve_db()


def resolve_hosted():
    sys.path.insert(0, os.path.join(HERE, "..", "nas-lesson-voice"))
    try:
        import lesson_voice_transcribe as lv  # noqa: E402
        source, url, _ = lv.load_live()
        hurl, hkey = lv.load_hosted()
        if source == "sovereign" and hurl and hkey and hurl != url:
            return {"url": hurl, "key": hkey}
    except Exception:  # noqa: BLE001
        pass
    return None


class Hosted:
    """The hosted copy the hourly Routine reads (DR-0614): the builder carries
    its outcome tags there so the Routine never builds the same teaching."""

    def __init__(self, url, key):
        sys.path.insert(0, os.path.join(HERE, "..", "nas-lesson-voice"))
        import lesson_voice_transcribe as lv  # noqa: E402
        self.io = lv.SupabaseIO(url, key)

    def merge_tags(self, rid, tags):
        self.io.merge_tags(rid, tags)




# =============================================================================
# THE DECISION STAGE -- Darrell's choice or merge, gated again, then shipped
# =============================================================================
# Darrell 2026-09-29: "When we have all same lessons those end in PoeTech for
# me to review their and the decide on which one or merge 2 of them or all of
# them..." The app writes public.lesson_decisions (DR-0669 documents the
# shape): a version_id (take one), and/or a merge_map {part: version_id}, and
# edits {part: text}. Quoted Scripture is LOCKED: an edit may not change,
# add or drop a quoted span. The composite is assembled here, EVERY gate runs
# on it again, and only a composite that passes them all ships.

import copy  # noqa: E402

PART_KEYS = ("title", "slug", "placement", "bigIdea", "inApp", "anchor", "benefits", "levels.child",
             "levels.youth", "levels.teen", "levels.senior", "quiz", "facilitator", "lesson_intro",
             "movements", "lesson_close", "dr_summary")


class DecisionError(Exception):
    def __init__(self, part, why):
        super().__init__("{}: {}".format(part, why))
        self.part, self.why = part, why


def _part_path(key):
    if key in PART_KEYS:
        return key.split(".")
    m = re.match(r"^movements\.(\d+)(?:\.(title|text))?$", key)
    if m:
        return ["movements", int(m.group(1))] + ([m.group(2)] if m.group(2) else [])
    raise DecisionError(key, "not a part of a lesson")


def get_part(body, key):
    cur = body
    for k in _part_path(key):
        try:
            cur = cur[k]
        except (KeyError, IndexError, TypeError):
            raise DecisionError(key, "the version has no such part")
    return cur


def set_part(body, key, value):
    path = _part_path(key)
    cur = body
    for k in path[:-1]:
        cur = cur[k]
    last = path[-1]
    if isinstance(cur, list) and isinstance(last, int):
        if last < len(cur):
            cur[last] = value
        elif last == len(cur):
            cur.append(value)
        else:
            raise DecisionError(key, "movement {} would leave a gap".format(last))
    else:
        cur[last] = value


def quoted_spans_of(value):
    """Every (quoted text, reference) in a part, in order -- the lock on His words."""
    texts = []

    def walk(v):
        if isinstance(v, str):
            texts.append(v)
        elif isinstance(v, list):
            for x in v:
                walk(x)
        elif isinstance(v, dict):
            for x in v.values():
                walk(x)
    walk(value)
    out = []
    for t in texts:
        for m in gates.QUOTED.finditer(t):
            out.append(m.group(1))
    return out


def assemble(decision, versions_by_id):
    """(composite body, sources {part: version id}). Raises DecisionError naming
    the part. Unmapped parts come from the base version: version_id, else the
    version the merge map names for its first part."""
    mm = decision.get("merge_map") or {}
    base = decision.get("version_id") or next(iter(mm.values()), None)
    if not base or base not in versions_by_id:
        raise DecisionError("version_id", "the decision names no stored version of this teaching")
    body = copy.deepcopy(versions_by_id[base].get("body") or {})
    if body.get("verdict") != "lesson":
        raise DecisionError("version_id", "the base version is not a lesson draft")
    sources = {k: base for k in PART_KEYS}
    for key in sorted(mm, key=lambda k: (0 if k in PART_KEYS else 1, k)):
        vid = mm[key]
        if vid not in versions_by_id or not isinstance(versions_by_id[vid].get("body"), dict):
            raise DecisionError(key, "version {} is not a stored draft of this teaching".format(vid))
        set_part(body, key, copy.deepcopy(get_part(versions_by_id[vid]["body"], key)))
        sources[key] = vid
    for key, text in (decision.get("edits") or {}).items():
        old = get_part(body, key)
        if not isinstance(old, str) or not isinstance(text, str):
            raise DecisionError(key, "an edit replaces text, and this part is not text")
        if quoted_spans_of(old) != quoted_spans_of(text):
            raise DecisionError(key, "the edit changes quoted Scripture; His words are locked")
        set_part(body, key, text)
        sources[key] = "edit"
    body["verdict"] = "lesson"
    return body, sources


def part_of(where, quoted, body):
    """Map a gate's `where` (quotation-integrity field names) to the lesson part
    Darrell chose, so a failure names what to fix."""
    if where.startswith("levels.") or where in ("bigIdea", "inApp"):
        return where
    if where == "anchor.theme":
        return "anchor"
    for prefix, part in (("quiz", "quiz"), ("talkingPoints", "facilitator"), ("benefits", "benefits")):
        if where.startswith(prefix):
            return part
    if where == "lesson":
        if quoted and quoted in (body.get("lesson_intro") or ""):
            return "lesson_intro"
        for i, m in enumerate(body.get("movements") or []):
            if quoted and quoted in "{} {}".format(m.get("title", ""), m.get("text", "")):
                return "movements.{}".format(i)
        if quoted and quoted in (body.get("lesson_close") or ""):
            return "lesson_close"
        return "lesson"
    return where


def composite_failures(g, body):
    """[{check, part, detail}] -- the exact failing check and the part it failed on."""
    out = []
    for f in (g.get("verse") or {}).get("faults") or []:
        out.append({"check": "verse:" + f.get("kind", ""), "part": part_of(f.get("where", ""), f.get("quoted"), body),
                    "detail": "({}) {}".format(f.get("ref"), f.get("quoted", ""))[:300]})
    for k in ("quotation", "voice"):
        for pr in (g.get(k) or {}).get("problems") or []:
            where = pr.split(":", 1)[0]
            out.append({"check": k, "part": part_of(where, None, body), "detail": pr[:300]})
    for pr in (g.get("depth") or {}).get("problems") or []:
        m = re.search(r"the (child|youth|teen|senior) band", pr)
        out.append({"check": "depth", "part": "levels." + m.group(1) if m else "lesson", "detail": pr})
    for pr in (g.get("structure") or {}).get("problems") or []:
        out.append({"check": "structure", "part": "structure", "detail": pr})
    rg = g.get("repo_gates") or {}
    if rg and rg.get("skipped") is None and not rg.get("passed"):
        for k, x in rg.items():
            if isinstance(x, dict) and x.get("passed") is False:
                out.append({"check": "repo:" + k, "part": "levels" if k in ("fullLevels", "readingLevel", "differentiation", "title") else k,
                            "detail": json.dumps({kk: vv for kk, vv in x.items() if kk != "passed"})[:300]})
    return out


def gate_composite(body, corpus, band_gates=None):
    try:
        module = lesson_module(body, 0) if not writer.schema_problems(body) else None
    except (KeyError, TypeError) as e:
        module = None
    g = gates.gate_version(body, module, corpus, writer.schema_problems, band_gates=band_gates)
    return g, composite_failures(g, body)


def find_pr(branch, opener=None, tries=6, wait=20):
    """The PR the lane opened for this branch (auto-open-pr.yml), or ''."""
    import urllib.request as ur
    opener = opener or ur.urlopen
    url = "https://api.github.com/repos/darrellpoe06/Kingdom-PWA-Node/pulls?state=all&head=darrellpoe06:" + branch
    for i in range(tries):
        try:
            with opener(url, timeout=15) as res:
                prs = json.loads(res.read().decode("utf-8"))
            if prs:
                return prs[0].get("html_url", "")
        except Exception:  # noqa: BLE001
            pass
        if i + 1 < tries:
            time.sleep(wait)
    return ""


class Decide:
    """One decision row -> the composite -> every gate -> ship, or say exactly
    which check failed on which part and ship nothing."""

    def __init__(self, decision_id, db, git, corpus, data_dir=DATA, hosted=None, band_gates=None,
                 local_tests=None, now=utc_now, pr_finder=find_pr):
        self.id, self.db, self.git, self.corpus = decision_id, db, git, corpus
        self.data_dir, self.hosted, self.band_gates = data_dir, hosted, band_gates
        self.local_tests, self.now, self.pr_finder = local_tests, now, pr_finder

    def run(self):
        d = self.db.decision(self.id)
        if not d:
            return {"decision": self.id, "outcome": "missing"}
        if not self.db.claim_decision(self.id):
            return {"decision": self.id, "outcome": "not-decided-or-taken"}
        versions = {v["id"]: v for v in self.db.versions(d["build_id"])}
        try:
            body, sources = assemble(d, versions)
        except DecisionError as e:
            res = {"passed": False, "failures": [{"check": "assemble", "part": e.part, "detail": e.why}]}
            self.db.update_decision(self.id, status="gate-failed", gate_result=res)
            return {"decision": self.id, "outcome": "gate-failed", "gate_result": res}
        g, failures = gate_composite(body, self.corpus, self.band_gates)
        if not (g.get("passed") and g.get("verse_passed")):
            res = {"passed": False, "failures": failures or [{"check": "gates", "part": "lesson", "detail": "did not pass"}],
                   "gates": g, "sources": sources}
            self.db.update_decision(self.id, status="gate-failed", gate_result=res)
            return {"decision": self.id, "outcome": "gate-failed", "gate_result": res}
        group = self.db.rows_by_build(d["build_id"])
        if not group:
            self.db.update_decision(self.id, status="failed", gate_result={"passed": True, "why": "no teaching row carries this build"})
            return {"decision": self.id, "outcome": "failed"}
        first = next(iter(versions.values()))
        used = sorted(set(v for v in sources.values() if v != "edit"))
        chosen = {"writer": versions[used[0]]["writer"] if len(used) == 1 and "edit" not in sources.values() else "composite",
                  "family": versions[used[0]].get("family") if len(used) == 1 else "merge",
                  "model_label": "decision " + self.id, "body": body, "gates": g,
                  "prompt_sha256": first.get("prompt_sha256"), "prompt_text": first.get("prompt_text"),
                  "elapsed_ms": 0, "usage": {}, "selection_why": "Darrell's decision {} ({} version(s){})".format(
                      self.id, len(used), ", edited" if "edit" in sources.values() else "")}
        b = Build(group, self.db, self.git, [], self.corpus, data_dir=self.data_dir, hosted=self.hosted,
                  band_gates=self.band_gates, local_tests=self.local_tests, now=self.now)
        b.stage("decided", ["build-decision:" + self.id])
        for r in group:
            self.db.add_tags(r["id"], ["lesson-building"])
            self.db.remove_tags(r["id"], ["awaiting-review"])
        try:
            self.git.fetch()
            report = b.ship(chosen, list(versions.values()) + [chosen], store=[chosen])
        except Exception as e:  # noqa: BLE001
            report = b.fail(e)
        if report.get("outcome") != "published":
            self.db.update_decision(self.id, status="failed", gate_result={"passed": True, "gates": g, "why": report.get("why")})
            return {"decision": self.id, "outcome": "failed", "why": report.get("why")}
        pr = self.pr_finder(report["branch"]) if self.pr_finder else ""
        self.db.update_decision(self.id, status="shipped", lesson_id=report["lesson_id"], branch=report["branch"],
                                pr_url=pr or None, gate_result={"passed": True, "gates": g, "sources": sources})
        return {"decision": self.id, "outcome": "shipped", "lesson_id": report["lesson_id"], "branch": report["branch"], "pr": pr}

# =============================================================================
# BACKFILL: existing lessons through the writers -- for comparison ONLY
# =============================================================================
# Darrell 2026-09-29: "Or just do all lessons from all LLMs at the same time...
# also as an option..." A published lesson's prompt is rebuilt ONLY from its
# recorded source (the source section of the decision record that names it).
# A lesson whose source cannot be recovered faithfully is SKIPPED with the
# reason; nothing is invented. Backfill versions are stored with backfill=true
# and published=false -- ALWAYS: the code path has no file write and no push,
# Db.insert_version refuses a published backfill row, and the table carries
# CHECK (NOT (backfill AND published)). A backfill never replaces a lesson.

SOURCE_HEADINGS = ("The report", "Context", "The source", "What was sent", "The teaching", "What Darrell sent")
MIN_SOURCE_WORDS = 40
LESSON_HEAD = re.compile(r"id: '(ll\d+-[a-z0-9-]+)',\n\s+title: '((?:[^'\\]|\\.)*)'")


def split_sections(md):
    out, head, buf = [], None, []
    for line in (md or "").splitlines():
        m = re.match(r"^##\s+(.+?)\s*$", line)
        if m:
            if head is not None:
                out.append((head, "\n".join(buf).strip()))
            head, buf = m.group(1), []
        elif head is not None:
            buf.append(line)
    if head is not None:
        out.append((head, "\n".join(buf).strip()))
    return out


def recorded_source(lesson_id, dr_texts):
    """(source, source_ref) or (None, why). Only a recorded source section of a
    decision record that names the lesson; never a reconstruction."""
    names = sorted(n for n, t in dr_texts.items() if lesson_id in (t or ""))
    if not names:
        return None, "no decision record names this lesson"
    for name in names:
        for heading, text in split_sections(dr_texts[name]):
            if heading in SOURCE_HEADINGS and len(text.split()) >= MIN_SOURCE_WORDS:
                return text, "docs/decisions/{}#{}".format(name, heading)
    return None, "the record(s) {} carry no source section of {} words or more".format(", ".join(names), MIN_SOURCE_WORDS)


def published_lessons(living_src):
    return [(m.group(1), m.group(2).replace("\\'", "'")) for m in LESSON_HEAD.finditer(living_src or "")]


def backfill_record(base):
    """The ONE place a backfill row is shaped: published is forced False."""
    rec = dict(base)
    rec["backfill"] = True
    rec["published"] = False
    return rec


def refuse_published_backfill(rec):
    if rec.get("backfill") and rec.get("published"):
        raise ValueError("a backfill version can never be published: it would replace a lesson")


class Backfill:
    def __init__(self, lesson_id, title, source, source_ref, db, writers, corpus, mode=writer.DEFAULT_MODE,
                 selected=(), band_gates=None, owners=OWNER_IDS, writer_timeout=WRITER_MAX_SECONDS, build_id=None):
        self.lesson_id, self.title, self.source, self.source_ref = lesson_id, title, source, source_ref
        self.db, self.writers, self.corpus = db, writers, corpus
        self.mode, self.selected, self.band_gates, self.owners = mode, selected, band_gates, owners
        self.writer_timeout = writer_timeout
        self.build_id = build_id or str(uuid.uuid4())

    def run(self):
        verses = gates.cited_references(self.source, self.corpus)
        prompt = writer.build_prompt(self.source, [], self.owners, verses, title_hint=(
            "{} -- BACKFILL: this lesson is already published; write it fresh from its recorded source, "
            "for comparison only".format(self.title)))
        run_writers, note = writer.select_writers(self.writers, self.mode, self.selected)
        results, tried = writer.fan_out(run_writers, prompt, self.writer_timeout)
        stored, errors = 0, []
        for r in results:
            obj = None
            if r["ok"]:
                try:
                    obj = gates.canonical_apostrophes(writer.extract_json(r["text"]))
                except ValueError as e:
                    r["error"] = "unreadable reply: {}".format(e)
            module = lesson_module(obj, 0) if (isinstance(obj, dict) and obj.get("verdict") == "lesson"
                                              and not writer.schema_problems(obj)) else None
            g = gates.gate_version(obj, module, self.corpus, writer.schema_problems, band_gates=self.band_gates) \
                if obj is not None else {"passed": False, "verse_passed": False}
            rec = backfill_record({
                "build_id": self.build_id, "teaching_row_id": None, "instance_id": None, "lesson_id": self.lesson_id,
                "writer": r["writer"], "family": r.get("family"), "model_label": r.get("model_label"),
                "prompt_sha256": r["prompt_sha256"], "prompt_text": prompt, "body": obj, "gate_results": g,
                "elapsed_ms": r.get("elapsed_ms"), "usage": r.get("usage"), "error": r.get("error") or None,
                "source_ref": self.source_ref})
            try:
                self.db.insert_version(rec)
                stored += 1
            except Exception as e:  # noqa: BLE001
                errors.append("{}: {}".format(r["writer"], e))
        return {"lesson_id": self.lesson_id, "source_ref": self.source_ref, "mode": note, "tried": tried,
                "written": len(results), "stored": stored, "errors": errors}

# =============================================================================
# the service: LISTEN, claim, spawn a budgeted build per teaching
# =============================================================================

def readiness(env=None, writers=None, token_file=TOKEN_FILE):
    """(ready, status). Ready = at least one writer reachable AND a push
    credential on the box. Status names every writer tried and why; a writer
    nobody configured reads "not configured", never an error."""
    env = env if env is not None else os.environ
    if writers is None:
        writers, problems = writer.writers_from_configs(writer.load_writer_configs(env), env=env,
                                                         extra_paths=writer_paths(env))
    else:
        problems = []
    tried = list(problems)
    reachable = []
    for w in writers:
        try:
            ok, why = w.probe()
        except Exception as e:  # noqa: BLE001
            ok, why = False, "probe raised: {}".format(e)
        tried.append({"writer": w.name, "kind": w.kind, "family": w.family, "primary": w.primary, "ok": ok, "why": why,
                      "configured": not str(why).startswith(writer.NOT_CONFIGURED)})
        if ok:
            reachable.append(w.name)
    push = os.path.isfile(token_file)
    state = "ready" if (reachable and push) else "waiting on a writer" if not reachable else "waiting on a push credential"
    return bool(reachable and push), {"state": state, "writers": tried, "reachable": reachable,
                                      "push_credential": "present" if push else "missing at " + token_file}


def writer_paths(env):
    return [p for p in env.get("LESSON_WRITER_PATHS", "").split(":") if p]


def job_of(payload):
    """What a notification asks for: ('sweep', None) | ('row', id) |
    ('decision', id) | ('backfill', None)."""
    if not payload:
        return "sweep", None
    if payload.startswith("decision:"):
        return "decision", payload[len("decision:"):]
    if payload == "backfill":
        return "backfill", None
    return "row", payload


class Service:
    def __init__(self, db, data_dir=DATA, parallel=PARALLEL, spawn=None, ready=readiness, kill=kill_state,
                 now=utc_now, log=print, budget=None):
        self.db, self.data_dir, self.parallel = db, data_dir, parallel
        self.spawn = spawn or self._spawn_child
        self.ready, self.kill, self.now, self.log = ready, kill, now, log
        self.budget = budget if budget is not None else BUILD_MAX_SECONDS
        self.sem = threading.Semaphore(parallel)
        self.lock = threading.Lock()
        self.active = set()
        self.status = {}
        self.threads = []

    def write_status(self, extra):
        self.status.update(extra, at=self.now())
        os.makedirs(self.data_dir, exist_ok=True)
        tmp = os.path.join(self.data_dir, "status.json.tmp")
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(self.status, f, indent=1)
        os.replace(tmp, os.path.join(self.data_dir, "status.json"))
        publish = getattr(self.db, "publish_status", None)
        if publish:
            publish(self.status)

    def _ready_cached(self, ttl=60):
        """Probing a writer runs a command; a burst of notifications shares one
        probe a minute. A NOT-ready answer is re-probed every time, so a writer
        coming back is seen at once."""
        now = time.monotonic()
        c = getattr(self, "_ready_cache", None)
        if c and c[0] and now - c[2] < ttl:
            return c[0], c[1]
        ready, st = self.ready()
        self._ready_cache = (ready, st, now)
        return ready, st

    def _start(self, target, *args):
        t = threading.Thread(target=target, args=args, daemon=True)
        t.start()
        self.threads.append(t)

    def consider(self, payload=None):
        """One notification (or a sweep). Returns what was started. Never raises."""
        started = []
        try:
            stopped, why = self.kill()
            if stopped:
                self.write_status({"state": "stopped", "why": why})
                return started
            ready, st = self._ready_cached()
            self.write_status(st)
            kind, ident = job_of(payload)
            if kind in ("sweep", "decision") and os.path.isfile(TOKEN_FILE):
                ids = [ident] if kind == "decision" else list(getattr(self.db, "pending_decisions", lambda: [])())
                for did in ids:
                    key = "decision-" + did
                    with self.lock:
                        if key in self.active or not acquire_row_lock(self.data_dir, key):
                            continue
                        self.active.add(key)
                    self._start(self._run_job, [key], {"mode": "decide", "decision_id": did})
                    started.append(key)
            if kind in ("sweep", "backfill") and ready:
                st2 = getattr(self.db, "settings", lambda: None)() or {}
                req, done = st2.get("backfill_requested_at"), st2.get("backfill_done_at")
                if req and (not done or done < req) and "backfill" not in self.active:
                    with self.lock:
                        self.active.add("backfill")
                    self._start(self._run_backfill, st2)
                    started.append("backfill")
            if kind == "sweep":
                self.release_stale(self.db.pending())
            if kind not in ("sweep", "row") or not ready:
                return started
            pending = self.db.pending()
            seeds = [r for r in pending if (ident is None or r["id"] == ident)]
            for seed in seeds:
                if not eligibility(seed)[0]:
                    continue
                with self.lock:
                    if seed["id"] in self.active:
                        continue
                    group = [r for r in group_teaching(seed, pending) if r["id"] not in self.active]
                    held = [r for r in group if acquire_row_lock(self.data_dir, r["id"])]
                    ts = self.now()
                    claimed = [r for r in held if self.db.claim(r["id"], ts)]
                    for r in held:
                        if r not in claimed:
                            release_row_lock(self.data_dir, r["id"])
                    if not claimed or seed not in claimed:
                        for r in claimed:
                            self.db.remove_tags(r["id"], ["lesson-building"])
                            release_row_lock(self.data_dir, r["id"])
                        continue
                    for r in claimed:
                        self.active.add(r["id"])
                self._start(self._run_job, [r["id"] for r in claimed], {"mode": "build", "group": claimed})
                started.append([r["id"] for r in claimed])
        except Exception as e:  # noqa: BLE001
            self.log("lesson-builder: consider failed: {}".format(e))
        return started

    def release_stale(self, pending):
        """A claim whose build is gone (the service restarted mid-build and
        systemd ended its process group) is released on the sweep, so the
        teaching is built again instead of looking busy for ever. A claim this
        process is running is never touched."""
        released = []
        for r in pending:
            if "lesson-building" not in (r.get("tags") or []) or r["id"] in self.active:
                continue
            if not acquire_row_lock(self.data_dir, r["id"]):
                continue  # a live build holds it
            try:
                self.db.add_tags(r["id"], [stage_tag("released", self.now()),
                                           reason_tag("the build that held it was gone; released for a new build")])
                self.db.remove_tags(r["id"], ["lesson-building"])
                released.append(r["id"])
            finally:
                release_row_lock(self.data_dir, r["id"])
        return released

    def _run_job(self, keys, spec):
        """Every job runs in its own process under the wall-clock budget."""
        with self.sem:
            try:
                res = self.spawn(spec)
                failed_why = ""
                if res.get("timed_out"):
                    failed_why = "budget: the build passed its wall-clock budget of {} s and was ended".format(self.budget)
                elif res.get("code") not in (0, 1):
                    failed_why = "the build process crashed (exit {}): {}".format(res.get("code"), (res.get("stderr") or "")[-160:])
                if failed_why and spec.get("mode") == "build":
                    ts = self.now()
                    for rid in keys:
                        self.db.add_tags(rid, [stage_tag("failed", ts), "build-failed", reason_tag(failed_why)])
                        self.db.remove_tags(rid, ["lesson-building"])
                elif failed_why and spec.get("mode") == "decide":
                    self.db.update_decision(spec["decision_id"], status="failed", gate_result={"passed": False, "why": failed_why})
                self.log("lesson-builder: {} -> {}".format(keys, failed_why or (res.get("stdout") or "")[-300:]))
                return res
            finally:
                for k in keys:
                    release_row_lock(self.data_dir, k)
                with self.lock:
                    for k in keys:
                        self.active.discard(k)

    def backfill_plan(self, living_src, dr_texts, scope="all"):
        """[(lesson_id, title, source, source_ref)], [skipped {lesson_id, why}]."""
        wanted = None if scope in (None, "", "all") else set(x.strip() for x in scope.split(",") if x.strip())
        todo, skipped = [], []
        for lid, title in published_lessons(living_src):
            if wanted is not None and lid not in wanted:
                continue
            src, ref = recorded_source(lid, dr_texts)
            if src is None:
                skipped.append({"lesson_id": lid, "why": ref})
            else:
                todo.append((lid, title, src, ref))
        return todo, skipped

    def _run_backfill(self, settings, git=None):
        try:
            git = git or Git(self.data_dir)
            git.fetch()
            living = git.show("refs/remotes/origin/main", LIVING)
            names = git.g("ls-tree", "--name-only", "refs/remotes/origin/main", "docs/decisions/").splitlines()
            dr_texts = {os.path.basename(n): git.show("refs/remotes/origin/main", n) for n in names if n.endswith(".md")}
            todo, skipped = self.backfill_plan(living, dr_texts, settings.get("backfill_scope"))
            results = []

            def one(item):
                lid, title, src, ref = item
                key = "backfill-" + lid
                if not acquire_row_lock(self.data_dir, key):
                    results.append({"lesson_id": lid, "outcome": "locked"})
                    return
                res = self._run_job([key], {"mode": "backfill", "lesson_id": lid, "title": title, "source": src,
                                            "source_ref": ref, "writer_mode": settings.get("mode"),
                                            "selected": settings.get("selected") or []})
                results.append({"lesson_id": lid, "timed_out": res.get("timed_out"), "code": res.get("code")})
            threads = [threading.Thread(target=one, args=(it,), daemon=True) for it in todo]
            for t in threads:
                t.start()
            for t in threads:
                t.join()
            summary = {"at": self.now(), "planned": len(todo), "skipped": skipped, "results": results}
            with open(os.path.join(self.data_dir, "backfill-last.json"), "w", encoding="utf-8") as f:
                json.dump(summary, f, indent=1)
            done = getattr(self.db, "backfill_done", None)
            if done:
                done(summary)
        except Exception as e:  # noqa: BLE001
            self.log("lesson-builder: backfill failed: {}".format(e))
        finally:
            with self.lock:
                self.active.discard("backfill")

    def _spawn_child(self, spec):
        source, params = resolve_db_params()
        spec = dict(spec, db=params, hosted=resolve_hosted(), build_id=spec.get("build_id") or str(uuid.uuid4()))
        argv = [sys.executable, os.path.abspath(__file__), "--child"]
        if hasattr(os, "geteuid") and os.geteuid() == 0 and RUN_AS:
            # sudo resets the environment: carry the NAS config (LESSON_*) across.
            carry = ["{}={}".format(k, v) for k, v in os.environ.items() if k.startswith("LESSON_")]
            argv = ["sudo", "-n", "-u", RUN_AS, "-H", "--", "/usr/bin/env",
                    "LESSON_BUILDER_DATA=" + self.data_dir, "POETECH_REPO=" + MIRROR] + carry + argv
        return run_with_budget(argv, self.budget, json.dumps(spec).encode("utf-8"))

    def listen_forever(self, connect):
        sweep = {"now": True}
        signal.signal(signal.SIGHUP, lambda *_: sweep.update(now=True))
        backoff = 5
        while True:
            try:
                db = connect()
                self.db = db
                db.listen()
                self.log("lesson-builder: listening on {}".format(CHANNEL))
                backoff = 5
                sweep["now"] = True
                sock = db.socket()
                while True:
                    if sweep["now"]:
                        sweep["now"] = False
                        self.consider(None)
                    if sock is not None:
                        select.select([sock], [], [], 300)
                    else:
                        time.sleep(1)
                    for payload in db.drain():
                        self.consider(payload)
            except Exception as e:  # noqa: BLE001 -- reconnect, then sweep what was missed
                self.log("lesson-builder: connection lost ({}); reconnecting in {} s".format(e, backoff))
                time.sleep(backoff)
                backoff = min(backoff * 2, 60)


# =============================================================================
# entry points
# =============================================================================

def child(spec, env=None):
    """--child: one job, as the signed-in user, inside the budget."""
    env = env if env is not None else os.environ
    data = env.get("LESSON_BUILDER_DATA", DATA)
    db = Db(spec["db"])
    hosted = Hosted(spec["hosted"]["url"], spec["hosted"]["key"]) if spec.get("hosted") else None
    git = Git(data)
    git.ensure()
    corpus = gates.Corpus(git.clone)
    band = lambda m: gates.node_band_gates(m, repo=git.clone)  # noqa: E731
    if spec["mode"] == "decide":
        return Decide(spec["decision_id"], db, git, corpus, data_dir=data, hosted=hosted, band_gates=band,
                      local_tests=local_tests).run()
    ws, _ = writer.writers_from_configs(writer.load_writer_configs(env), env=env, extra_paths=writer_paths(env))
    st = db.settings() or {}
    cfg_mode, cfg_sel = writer.config_mode(env)
    mode = spec.get("writer_mode") or st.get("mode") or cfg_mode
    selected = spec.get("selected") or st.get("selected") or cfg_sel
    if spec["mode"] == "backfill":
        return Backfill(spec["lesson_id"], spec["title"], spec["source"], spec["source_ref"], db, ws, corpus,
                        mode=mode, selected=selected, band_gates=band, build_id=spec.get("build_id")).run()
    return Build(spec["group"], db, git, ws, corpus, data_dir=data, hosted=hosted, band_gates=band,
                 local_tests=local_tests, build_id=spec.get("build_id"), mode=mode, selected=selected).run()


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--listen", action="store_true")
    ap.add_argument("--child", action="store_true")
    ap.add_argument("--status", action="store_true")
    a = ap.parse_args(argv)
    if a.child:
        report = child(json.loads(sys.stdin.read()))
        print(json.dumps(report))
        return 0 if report.get("outcome") in ("published", "duplicate", "skipped-test", "deferred", "awaiting-review",
                                              "shipped", "gate-failed", None) else 1
    if a.status:
        stopped, why = kill_state()
        ready, st = readiness()
        st["kill"] = {"stopped": stopped, "why": why}
        print(json.dumps(st, indent=1))
        return 0
    if a.listen:
        source, params = resolve_db_params()
        if not source:
            print("lesson-builder: no database door (REPOINT-ARMED + the sovereign .env) -- nothing to listen on")
            return 0
        Service(None).listen_forever(lambda: Db(params))
    ap.print_help()
    return 2


if __name__ == "__main__":
    sys.exit(main())

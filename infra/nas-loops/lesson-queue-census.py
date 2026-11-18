#!/usr/bin/env python3
# =============================================================================
# lesson-queue-census.py -- the NAS counts its own lesson queue (DR-1360)
# =============================================================================
# THE ROAD THIS REVERSES. `inbox-lessons-waiting.yml` answers "what is waiting?"
# by reaching INTO this machine: join the tailnet, ssh in, `docker exec psql`.
# DR-1360 decided that direction is backwards -- "the NAS initiates every road;
# the lane never reaches in... A runner road that carries work INTO the NAS is
# retired as each is reversed" -- and Darrell's reason for it: "Why would I
# willingly want to depend on other systems... That can and do fail!!!"
#
# MEASURED, TWICE. The runner's key expired 2026-11-04 and all 64 workflows that
# join on it went red for two days (DR-1360). It expired again by 2026-11-10:
# `inbox-lessons-waiting.yml` failed three runs straight (11-06, 11-09, 11-10),
# so the PRIORITY lane's queue could not be read at all, and the `measure` check
# went red on main for the same reason. The queue is ON this machine; nothing
# about counting it needs a tailnet, a runner, or GitHub to be alive.
#
# So this counts the queue locally and writes ONE row the app already reads
# (agent_inbox, tagged lesson-queue-census), exactly as heartbeat.py does. The
# lane then reads a written answer instead of opening a road inward.
#
# NOT YET PROVEN, AND SAID SO (P66). A durable driver counts as working only
# when its first run is seen doing real work. This rides the services-sync clock
# (install-clock.sh), so it outlives every session and survives a reboot -- but
# the session that wrote it cannot watch it run, because the only road from the
# cloud to this machine is the expired key that caused the problem. The proof is
# a stamp appearing where `lib/lesson-queue-census.js` reads it, and the ledger
# below is what tells "ran but could not write" from "never ran". Until that
# stamp exists this is shipped-and-armed, never working.
#
# NEVER A BODY. A lesson holds a person's words. This writes counts and tag
# shapes only -- no body, no per-row length, no ids. The same rule
# `lesson-inbox-waiting.sql` states for its own output.
#
# ONE DEFINITION OF "WAITING" (DR-0725). The exclusions below are the ones
# `scripts/lesson-inbox-waiting.sql` applies, and `test_lesson_queue_census.py`
# PARSES that file and fails if the two ever drift. That test exists because a
# census taken on 2026-11-10 used an abbreviated list from a routine prompt --
# it omitted `not-a-lesson` and `withdrawn` -- and so counted as "waiting" rows
# a person had marked not a lesson or TAKEN BACK (DR-1142). An overcount of the
# queue is a plan to build from words somebody withdrew.
#
# BRAKES (DR-0248, P10): BUDGET -- at most TWO reads and one write per cycle, no
# retry loop, no pagination beyond those requests. (It was one read until
# DR-1519 added the empty-body FILTER, which asks for ids only and whose own
# failure is caught so a refusal costs that one answer and not the census.)
# LOCK -- one row, patched in
# place, so a second run in the same cycle overwrites rather than accumulates.
# STOP -- `enabled: false` on its registry entry, which is deterministic logic
# the clock reads, and a missing credential is a named quiet no-op (exit 0) that
# never crashes the clock for the services beside it.
import json
import os
import platform
import re
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
TAG = "lesson-queue-census"
# Shared with scripts/lesson-inbox-waiting.sql; the test pins them together.
REQUIRED_TAG = "lesson"
EXCLUDED_TAGS = (
    "lesson-captured",
    "lesson-building",
    "awaiting-review",
    "not-a-lesson",
    "withdrawn",
)
DEFAULT_CREATED_BY = "c2a6c39a-ae99-4ff7-83c6-b927e2e7f1cc"
DEFAULT_SECRETS = "/volume1/PoeTech/secrets/supabase.json"
DEFAULT_HOME = "/volume1/PoeTech/lesson-queue-census"
# How a waiting row is grouped. A row's road is what sent it, and the shapes are
# the ones the builders branch on, so the census answers "what kind of work
# waits?" without carrying a single word of anyone's teaching.
ROADS = ("thinking-space", "lesson-voice-transcribe", "research-inbox", "chat-split")

# THE NAS LESSON BUILDER'S OWN STATE (DR-1514). Three of the six rows waiting on
# 2026-11-17 had failed ON THE BUILDER, and the only road to its state was
# `lesson-builder-status.sh --nas` -- ssh, behind the Tailscale key that has been
# refused since 2026-11-04. So a session could see THAT builds failed and never
# whether the builder was even running. The census already runs ON the box, so
# it reads these four local paths with no key and no ssh at all.
#
# WHAT MAY TRAVEL. This receipt is read over the PUBLIC road, so nothing here is
# passed through: a closed set for the service word, a hex sha, counts, and from
# status.json only booleans, small integers and ISO-shaped timestamps under a
# whitelist. No free text ever -- a builder's error string can quote the
# teaching it failed on, which is a person's own words.
# WHICH CODE ANSWERED (DR-1517). Measured 2026-11-17 09:11: DR-1516 taught the
# census to tell a member's row from Darrell's, and minutes later the read came
# back with four rows reading `ready`. That is consistent with TWO different
# worlds -- the new code running and those rows being his own, OR the old code
# still on the box and the owner check not yet in play -- and nothing in the
# payload could tell them apart. An answer whose code version is unknown cannot
# be acted on (DR-0076 section 8), so the census now says which code wrote it:
# the mirror's HEAD, the same value replay-on-clock reads for the same reason.
CENSUS_REPO = "/volume1/PoeTech/repos/Kingdom-PWA-Node"
BUILDER_HOME = "/volume1/PoeTech/lesson-builder"
BUILDER_UNIT = "poetech-lesson-builder"
# systemd's own vocabulary; anything else reads as "unknown", never as stopped.
SERVICE_WORDS = ("active", "inactive", "failed", "activating", "deactivating", "reloading")
# Keys of status.json that may be published AT ALL, and only when their value
# passes the shape test below. A key outside this set is counted, never named.
STATUS_KEYS = ("at", "ok", "attempts", "built", "failed", "skipped", "cycle_seconds", "state",
               "writers")
# A git sha and an ISO stamp are STRUCTURE, not prose: neither can carry a
# sentence, which is why these two are the only strings allowed through.
HEX_SHA = re.compile(r"^[0-9a-f]{7,40}$")
ISO_AT = re.compile(r"^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}")
# `state` rides by an ALLOWLIST, not a shape -- and the difference is the whole
# reason it may ride at all (DR-1522). DR-1514's shape test is right to refuse a
# free string: a shape like ^[a-z_]+$ is SATISFIED by `error_from_mary_smith`,
# which is how a member's name would reach a public endpoint. An allowlist
# cannot be satisfied that way. These four are every value readiness() and
# consider() can produce (lesson_builder.py:2251, :2516), and the census
# publishes one of ITS OWN constants after an identity match -- so the bytes on
# the road are chosen here, never passed through from the builder. Anything else
# -- a new state, a reworded one, a hostile one -- is withheld and counted.
BUILDER_STATES = ("ready", "waiting on a writer", "waiting on a push credential", "stopped")
# WHICH writer, by the same allowlist discipline (DR-1524). `state` says no
# writer is reachable; it cannot say whether NONE IS CONFIGURED (nothing was
# ever set up) or one is configured and FAILING (a lapsed sign-in) -- and those
# are different jobs for a person. readiness() already answers it per writer,
# but its entry is {writer, kind, family, primary, ok, why, configured} and two
# of those must NEVER ride: `why` is a probe's own words (`claude --version exit
# 1: <stderr>`), and `writer` is a NAME out of lesson-writers.json, which a
# person could have called anything. So only `kind`, `ok` and `configured` are
# published -- the adapter kinds below are every `kind` in lesson_writer.py,
# matched by identity exactly as BUILDER_STATES is, and the two flags are
# booleans. An entry whose kind is not one of these is counted, never named.
WRITER_KINDS = ("api", "base", "cli-local", "cli-ssh", "codex-cli", "command",
                "gemini-api", "gemini-cli", "ollama", "openai", "openai-api")
WRITER_FLAGS = ("ok", "configured")


def rest(url, key, method, path, body=None, extra_headers=None):
    headers = {
        "apikey": key,
        "Authorization": "Bearer " + key,
        "Content-Type": "application/json",
    }
    if extra_headers:
        headers.update(extra_headers)
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(
        url + "/rest/v1/" + path, data=data, headers=headers, method=method
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        raw = resp.read().decode("utf-8", "ignore")
    return json.loads(raw) if raw.strip() else None


def waiting_query(select="id,created_at,source,tags,created_by"):
    """The ONE definition, as PostgREST filters. Same five exclusions as the SQL."""
    parts = [
        "agent_inbox?select=" + select,
        "tags=cs." + urllib.parse.quote(json.dumps([REQUIRED_TAG])),
    ]
    for tag in EXCLUDED_TAGS:
        parts.append("tags=not.cs." + urllib.parse.quote(json.dumps([tag])))
    parts.append("order=created_at.asc")
    return "&".join(parts)


def empty_body_query():
    """The ids of waiting rows WITH NO WORDS, asked as a FILTER (DR-1519).

    WHY A FILTER AND NOT A COLUMN. `eligibility()` refuses a row whose body is
    empty -- "no words" -- and DR-1516 left that branch unmirrored because
    testing it looked like it needed the body. It does not: PostgREST can ask
    the question as a `where` and return only IDS, which already ride this road.
    The first design on the table was a generated `body_length` column, a schema
    change on the table holding people's teachings, for an answer a filter gives
    for free.
    
    NO WORDS CROSS THE WIRE, not even to be measured. The census never selects
    `body` -- here or anywhere -- so there is nothing to leak and nothing to
    forget to drop.
    
    ITS LIMIT, STATED: `eligibility()` also refuses a body that is only
    whitespace, and PostgREST cannot express `btrim(body) = ''` as a filter. A
    whitespace-only row therefore still reads `ready`. Narrower than the
    builder, never wider, and said out loud rather than discovered.
    """
    parts = [
        "agent_inbox?select=id",
        "tags=cs." + urllib.parse.quote(json.dumps([REQUIRED_TAG])),
    ]
    for tag in EXCLUDED_TAGS:
        parts.append("tags=not.cs." + urllib.parse.quote(json.dumps([tag])))
    # NULL or the empty string; the two the builder's `or ""` collapses together.
    parts.append("or=(body.is.null,body.eq.)")
    return "&".join(parts)


def shape_of(row):
    """What kind of waiting row this is, from its tags alone -- never its body."""
    tags = row.get("tags") or []
    tags = tags if isinstance(tags, list) else []
    if "voice-failed" in tags:
        return "voice-failed"
    if "voice-transcript" in tags:
        return "voice-transcript"
    if "voice" in tags:
        return "voice-waiting-for-words"
    if "build-failed" in tags:
        return "build-failed"
    if "newsletter-item" in tags:
        return "newsletter-item"
    if "canary" in tags:
        return "canary"
    return "plain"


# WHY A FAILED BUILD FAILED, AS A CLASS AND NEVER AS ITS TEXT (2026-11-12).
# Measured the same day: the census reported `build-failed: 3` for an hour while
# the tailnet was shut, and that number cannot be acted on. `rate-limited` and
# `transient` heal themselves -- lesson_builder.eligibility() reads the class
# back off the front of the tag and retries -- while anything else is stuck and
# wants a person. One word tells those apart; the count alone cannot.
#
# IT READS THE CLASSIFIER ONLY, never the reason's text. lesson_builder's
# reason_tag() puts the class FIRST precisely so it survives the 200-character
# cut, and the rest of that string can quote a gate error that carries a
# person's words -- so the rest is not read here and never leaves the house.
# A class name is a tag shape, which is what this file is permitted to emit.
STALLS = ("rate-limited", "transient")
# A CLASS THAT HEALS ITSELF. lesson_builder.rate_limited() reads BOTH of the
# above off the front of the tag and waits the row out with
# MAX_ATTEMPTS + RATE_LIMIT_RETRIES tries, not MAX_ATTEMPTS. Measured here
# 2026-11-18: why_of() asked only for 'rate-limited', so a `transient` row read
# `failed` with 2 attempts and a reader comparing against MAX_ATTEMPTS=2 would
# have called exhausted a row the builder would still offer twice more.
SELF_HEALING = STALLS

# WHICH FAILURE SITE, BY IDENTITY AGAINST THE BUILDER'S OWN PROSE (2026-11-18).
# MEASURED on run 44242079320: `Failed because -- other: 6, transient: 1`.
# Six teachings, five days old, and `other` names nothing -- it says only "not
# one of the two that retry themselves", which is where 0322 left the reader:
# knowing a person is wanted and not what for. A missing writer, a draft the
# gates refuse, a red test and a missing push token are four different jobs.
#
# WHY A PREFIX MATCH IS SAFE HERE WHEN A SHAPE IS NOT. The pairs below are
# lesson_builder's OWN authored openings, at every site that composes a
# BuildFailed or a _run_job failure. What is published is the right-hand word --
# this file's own constant -- so the row's string never rides even when it
# matches, and the tail (which can quote a gate error carrying a person's words)
# is not read at all. A shape such as ^[a-z- ]+$ would be satisfied by
# `no words from mary smith`; byte-identity with a literal below is not.
#
# ITS LIMIT, PUBLISHED RATHER THAN DISCOVERED: lesson_builder.py:1029 tags an
# unexpected crash as `<ExceptionType>: <message>`, whose opening is a class
# name and not a fixed literal, so such a row stays `other`. Naming it wants a
# class word at the SOURCE (reason_tag), which is a builder change and reaches
# only failures after it ships -- it cannot re-class the six already tagged.
FAILURE_SITES = (
    ("no writer reachable", "no-writer"),
    ("no version passed every gate", "gates"),
    ("the gates failed on the committed object", "gates"),
    ("local tests failed", "tests"),
    ("no github token at", "no-push-token"),
    ("bible-study-session.js has no", "catalog"),
    ("budget:", "budget"),
    ("the build process crashed (exit", "crashed"),
)
SITE_CLASSES = tuple(sorted({cls for _, cls in FAILURE_SITES}))

# =============================================================================
# THE CAUSE ITSELF, WITHOUT A HAND (2026-11-18; DR-1537's question answered the
# other way round)
# =============================================================================
# DR-1537 built the direct read for road 2 and left the answer waiting on
# Darrell's ssh. His own words that afternoon, relayed from another session:
# "Fix it!!!!!! So we don't need anything!!!!!!! For all of these.... obviously"
# A step that waits on a hand is the defect, so the box writes its own answer on
# the receipt it already publishes.
#
# TWO SOURCES, BOTH ALREADY ON THE BOX, AND NEITHER IS FREE TEXT WHEN PUBLISHED:
#
#   1. The GATE NAMES from the builder's own stored records
#      (versions/<build_id>.json, written by lesson_builder._store). A gate's
#      name is a fixed word; a fault's TEXT quotes the draft and the verse and
#      is never read here. Names and counts only.
#   2. The EXCEPTION CLASS NAME from a `<Type>: <message>` build reason, which
#      is what lesson_builder.py:1029 writes for an unhandled crash -- the one
#      site 0334 publishes as `other` because its opening is a class name and
#      not a fixed literal. It rides ONLY when the name is a real exception
#      class: identity against the interpreter's own builtins plus a short list
#      of the stdlib exceptions this builder can reach. `MarySmith` is not an
#      exception class, so it cannot pass; what rides is the matched name.
GATE_NAMES = ("verse", "quotation", "voice", "depth", "structure", "band",
              "bands", "curriculum", "placement", "shape", "title", "scripture")
# The stdlib exceptions the builder's own imports can raise, whose names are not
# in builtins. Extend deliberately; an unlisted type reads as unknown, never as
# no-crash (DR-0076 section 8).
STDLIB_EXCEPTIONS = ("CalledProcessError", "TimeoutExpired", "JSONDecodeError",
                     "HTTPError", "URLError", "SSLError", "SSLCertVerificationError",
                     "RemoteDisconnected", "IncompleteRead", "BadStatusLine")


def _exception_names():
    """Every name the INTERPRETER itself says is an exception class, plus the
    short stdlib list. Built from `builtins`, so the allowlist is not a list
    this file maintains and cannot drift from Python."""
    import builtins

    got = {n: n for n in STDLIB_EXCEPTIONS}
    for name in dir(builtins):
        obj = getattr(builtins, name, None)
        if isinstance(obj, type) and issubclass(obj, BaseException):
            got[name] = name
    # A MAP, not a set, so a lookup returns THIS FILE'S OWN string rather than
    # the bytes that came off the row -- the same discipline 0333 keeps with
    # k_kinds[array_position(...)].
    return got


EXCEPTION_NAMES = _exception_names()


def exception_of(row):
    """The exception CLASS NAME a crashed build left on the row, or None.

    lesson_builder.py:1029 tags an unhandled crash `<Type>: <message>`. The
    token before the first colon is published only when it IS an exception
    class name; the message after it is never read.
    """
    tags = row.get("tags") or []
    tags = tags if isinstance(tags, list) else []
    for t in tags:
        if not isinstance(t, str) or not t.startswith("build-reason:"):
            continue
        why = t[len("build-reason:"):].strip()
        # The allowlist's own string is returned, never the row's bytes.
        return EXCEPTION_NAMES.get(why.split(":", 1)[0].strip())
    return None


def stored_gates(home, limit=400):
    """{teaching_row_id: [gate names that did not pass]} from the builder's own
    records on the box. Read ONCE per census, not per row.

    NAMES AND NOTHING ELSE. Each record also holds `body` (the drafted lesson)
    and `prompt_text` (which quotes the teaching); neither is opened here, and a
    gate's `faults` quote both the draft and the verse, so only the gate's NAME
    travels. An unreadable record is skipped rather than counted as passing.
    """
    out = {}
    d = os.path.join(home, "versions")
    try:
        names = sorted(os.listdir(d))[-limit:]
    except OSError:
        return out
    for n in names:
        if not n.endswith(".json"):
            continue
        try:
            with open(os.path.join(d, n), encoding="utf-8") as fh:
                recs = json.load(fh)
        except (OSError, ValueError):
            continue
        if not isinstance(recs, list):
            continue
        for rec in recs:
            if not isinstance(rec, dict):
                continue
            rid = rec.get("teaching_row_id")
            gates = rec.get("gate_results")
            if not isinstance(rid, str) or not isinstance(gates, dict):
                continue
            failed = []
            for g in GATE_NAMES:
                sub = gates.get(g)
                if not isinstance(sub, dict):
                    continue
                faults = sub.get("faults") if isinstance(sub.get("faults"), list) else []
                probs = sub.get("problems") if isinstance(sub.get("problems"), list) else []
                if sub.get("passed") is False or faults or probs:
                    failed.append(g)
            if failed:
                have = out.setdefault(rid, [])
                for g in failed:
                    if g not in have:
                        have.append(g)
    return out


def stall_of(row):
    """For a build-failed row: a word from STALLS, one from SITE_CLASSES, or
    'other' when its reason matches no site this file knows."""
    tags = row.get("tags") or []
    tags = tags if isinstance(tags, list) else []
    for t in tags:
        if not isinstance(t, str) or not t.startswith("build-reason:"):
            continue
        why = t[len("build-reason:"):].strip().lower()
        for cls in STALLS:
            if why.startswith(cls):
                return cls
        for opening, cls in FAILURE_SITES:
            if why.startswith(opening):
                return cls
        return "other"
    return "other"


# WHY A ROW IS STILL WAITING, AND HOW MANY TRIES IT HAS HAD (DR-1515).
# Measured 2026-11-17, the first read with 0327's builder block live: the
# builder was `active`, `building now: 0`, its own record 14 minutes fresh --
# and three teachings had waited five days. Reading
# lesson_builder.eligibility() explained it: past LESSON_BUILD_MAX_ATTEMPTS a
# row is "left for the hourly Routine" ON PURPOSE. The handoff works. Nothing
# on the public road said so, and four more rows read `plain`, which means only
# "none of the special tags" -- so a row nobody has touched looked exactly like
# one the builder had handed over and was waiting on. Those ask for different
# acts from a reader.
#
# THE THRESHOLD IS NOT COPIED HERE. MAX_ATTEMPTS is the builder's, settable by
# its own environment, and two files computing one number is how they drift
# (the lesson this repository already wrote about `Next ID`). So the ATTEMPT
# COUNT travels and the comparison is the reader's.
#
# Codes only, from the tags, never a reason's text: a verdict is a tag shape,
# which is what this file may emit.
WHYS = ("declined", "waits-for-governor", "no-words", "deferred", "rate-limited", "failed", "ready")
# Darrell's own two accounts (lesson_builder.OWNER_IDS). A row from anyone else
# is a MEMBER's teaching and is never built without `lesson-approved` (DR-0635),
# so it is not the builder neglecting it -- it waits for the Governor. The ids
# are compared HERE and never published: what travels is one word.
OWNER_IDS = (
    "f13843f2-742b-4f8a-82af-7ecfbdc536ec",
    "c2a6c39a-ae99-4ff7-83c6-b927e2e7f1cc",
)


def attempts_of(row):
    """How many times a build of this row has FAILED, from its stage tags."""
    tags = row.get("tags") or []
    tags = tags if isinstance(tags, list) else []
    n = 0
    for tag in tags:
        if isinstance(tag, str) and tag.startswith("build:failed@"):
            n += 1
    return n


def why_of(row, empty_ids=()):
    """Why this row still waits, as one word from WHYS.

    Mirrors the ORDER of lesson_builder.eligibility()'s remaining branches for
    a row this census already counts as waiting (captured, withdrawn, building,
    awaiting-review and not-a-lesson are excluded before they reach here).
    `failed` carries no judgment about exhaustion -- `attempts` is published
    beside it so the reader compares against the builder's own threshold.

    `ready` means NOTHING IN THE TAGS OR THE OWNER CHECK BLOCKS IT -- not that
    the builder will certainly take it. One branch of eligibility() is
    deliberately NOT mirrored: it refuses a row with no words, and testing that
    would mean reading the body this file must never read. So `ready` can still
    be refused for emptiness, and that limit is stated rather than hidden.
    """
    tags = row.get("tags") or []
    tags = tags if isinstance(tags, list) else []
    if "lesson-declined" in tags:
        return "declined"
    # MEASURED AND CORRECTED 2026-11-17, the first read with verdicts live: four
    # rows said `ready` while the builder sat active and idle, which read as the
    # builder neglecting them. It was this branch missing. A member's row is
    # never built without `lesson-approved`, so `ready` was overclaiming on the
    # one case where it matters most -- somebody else's teaching.
    if str(row.get("created_by") or "") not in OWNER_IDS and "lesson-approved" not in tags:
        return "waits-for-governor"
    # NO WORDS YET (DR-1519). eligibility()'s last branch, mirrored at last: the
    # research road can write a row before its words arrive, and such a row read
    # `ready` while the builder refused it -- which is how an idle builder came
    # to look like a neglectful one. `empty_ids` comes from a FILTER; no body is
    # ever read to learn this.
    if row.get("id") in (empty_ids or ()):
        return "no-words"
    if any(isinstance(x, str) and x.startswith("build:deferred@") for x in tags):
        return "deferred"
    if attempts_of(row):
        # BOTH self-healing classes, not just the one named 'rate-limited'
        # (corrected 2026-11-18). eligibility() refuses such a row with
        # "rate-limited {n} times", in those words, for a `transient` failure
        # too -- so this is the builder's own vocabulary, and asking only for
        # 'rate-limited' here under-reported a row that still had tries left.
        return "rate-limited" if stall_of(row) in SELF_HEALING else "failed"
    return "ready"


def _service_word(run):
    """systemd's word for the builder unit, or 'unknown'. Never 'inactive' on error."""
    try:
        out = run(["systemctl", "is-active", BUILDER_UNIT])
    # DELIBERATELY BLIND. The census must not die because it could not ask a
    # service word, and every outcome here is the same one: unknown, never
    # stopped. Narrowing this would only let a new exception type kill the
    # whole census for the least important field it publishes.
    except Exception:  # noqa: BLE001
        return "unknown"
    word = (out or "").strip().split("\n")[0].strip()
    return word if word in SERVICE_WORDS else "unknown"


def _writer_entries(raw):
    """(kept, lost) for readiness()'s `writers` list -- kind, ok, configured only.

    `kind` rides by IDENTITY against WRITER_KINDS and what is published is the
    census's OWN constant, the same discipline `state` uses. `ok` and
    `configured` ride only as real booleans. Every other field of the entry is
    dropped WITHOUT being examined, because the dangerous ones are prose.

    An entry that keeps nothing at all is counted in `lost`: a short list must
    never read as a complete one (DR-0076 section 8).
    """
    if not isinstance(raw, list):
        return [], 1
    kept, lost = [], 0
    for item in raw:
        if not isinstance(item, dict):
            lost += 1
            continue
        match = [k for k in WRITER_KINDS if k == item.get("kind")]
        if not match:
            # Without the kind the entry says nothing a reader can act on, and
            # a kind we do not recognise is exactly the case to withhold.
            lost += 1
            continue
        entry = {"kind": match[0]}
        for flag in WRITER_FLAGS:
            if isinstance(item.get(flag), bool):
                entry[flag] = item[flag]
        kept.append(entry)
    return kept, lost


def _status_fields(raw):
    """The publishable fields of status.json: whitelisted keys, shape-tested values.

    Returns (fields, dropped) where `dropped` counts what was refused, so a
    reader is told something was withheld rather than shown a short list that
    looks complete.
    """
    fields, dropped = {}, 0
    if not isinstance(raw, dict):
        return fields, dropped
    for k, v in raw.items():
        if k not in STATUS_KEYS:
            dropped += 1
            continue
        if k == "state":
            # By IDENTITY against the allowlist, and what is published is the
            # census's OWN constant -- `v` itself never reaches the row. So a
            # value that merely LOOKS like a state cannot ride, and the field is
            # checked here, ahead of the generic branches, so `state` has
            # exactly one way through this function and no other.
            match = [s for s in BUILDER_STATES if s == v]
            if match:
                fields[k] = match[0]
            else:
                dropped += 1
        elif k == "writers":
            # REBUILT ENTRY BY ENTRY, never passed through (DR-1524). Each kept
            # entry is a NEW dict holding at most three fields, so no sibling key
            # of readiness()'s entry -- `why`, `writer`, `family` -- can ride by
            # accident, now or when that entry grows a field.
            #
            # It is written HERE, inside `status`, because that is where
            # status.json puts it -- and the receipt publishes it one level UP,
            # at builder.writers, beside `service` and `building`. That hoist
            # lives in migration 0333 and is deliberate; both depths are pinned
            # by tests so neither drifts quietly.
            kept, lost = _writer_entries(v)
            if kept:
                fields[k] = kept
            dropped += lost
        elif isinstance(v, bool) or (isinstance(v, int) and -1 <= v <= 100000):
            fields[k] = v
        elif k == "at" and isinstance(v, str) and ISO_AT.match(v):
            # The stamp only, never a free string: a timestamp cannot carry a
            # sentence, and this one is what tells a reader whether the
            # builder's own record is current or stale.
            fields[k] = v
        else:
            dropped += 1
    return fields, dropped


def builder_state(home=BUILDER_HOME, run=None):
    """The builder's own state, read locally with no key (DR-1514).

    Every source is reported as read or NOT read. A path this cannot open is
    `null` with `read: false`, never a zero or a reassuring default: an
    unreadable builder is not an idle builder (DR-0076 section 8).
    """
    if run is None:

        def run(argv):
            # Imported here, not at the top: only the NAS path ever needs it.
            import subprocess

            return subprocess.run(
                argv, capture_output=True, text=True, timeout=10, check=False
            ).stdout

    state = {"service": _service_word(run), "read": {}}

    sha = None
    try:
        with open(os.path.join(home, ".code.sha"), encoding="utf-8") as fh:
            cand = fh.read().strip()
        sha = cand if HEX_SHA.match(cand) else None
        state["read"]["code_sha"] = True
    except OSError:
        state["read"]["code_sha"] = False
    state["code_sha"] = sha

    try:
        names = os.listdir(os.path.join(home, "locks"))
        # The COUNT, never the names: a lock file is named for the row it holds,
        # and a row this census did not count as waiting would otherwise be
        # published by a path nobody reviewed for it.
        state["building"] = len(names)
        state["read"]["building"] = True
    except OSError:
        state["building"] = None
        state["read"]["building"] = False

    try:
        with open(os.path.join(home, "status.json"), encoding="utf-8") as fh:
            raw = json.load(fh)
        fields, dropped = _status_fields(raw)
        state["status"] = fields
        state["status_withheld"] = dropped
        state["read"]["status"] = True
    except (OSError, ValueError):
        state["status"] = None
        state["status_withheld"] = None
        state["read"]["status"] = False

    return state


def _head_from_files(repo):
    """The mirror's HEAD read as FILES, with no subprocess at all.

    WHY NOT git (DR-1518, measured): DR-1517 shipped this as
    `git -C <repo> rev-parse HEAD` and the field stayed ABSENT for 59 minutes
    across about four services-sync cycles, while DR-1511's census change had
    reached the box in 16. So the shell-out was failing on the NAS, not waiting
    on a pull. Every likely cause is a property of calling git as whichever user
    the clock runs the census as -- `git` not on that user's PATH, or git
    refusing the mirror it does not own with "fatal: detected dubious
    ownership", which my shape test correctly turned into unknown rather than
    publishing prose.
    
    Reading the files sidesteps all of it: `.git/HEAD` is a symbolic ref, the
    ref file holds the sha, and `.git/packed-refs` holds it when the loose ref
    has been packed away. No PATH, no ownership check, no subprocess.
    """
    try:
        with open(os.path.join(repo, ".git", "HEAD"), encoding="utf-8") as fh:
            head = fh.read().strip()
    except OSError:
        return None
    if HEX_SHA.match(head):
        return head  # a detached HEAD holds the sha itself
    if not head.startswith("ref: "):
        return None
    ref = head[len("ref: "):].strip()
    try:
        with open(os.path.join(repo, ".git", *ref.split("/")), encoding="utf-8") as fh:
            cand = fh.read().strip()
        if HEX_SHA.match(cand):
            return cand
    except OSError:
        pass
    # The loose ref can be packed away; packed-refs is the same answer, written
    # as "<sha> <ref>" lines with comments and peeled tags mixed in.
    try:
        with open(os.path.join(repo, ".git", "packed-refs"), encoding="utf-8") as fh:
            for line in fh:
                if line.startswith(("#", "^")):
                    continue
                parts = line.split()
                if len(parts) == 2 and parts[1] == ref and HEX_SHA.match(parts[0]):
                    return parts[0]
    except OSError:
        pass
    return None


def census_code_sha(repo=None, run=None):
    """The mirror HEAD the census is running from, or None when unreadable.

    None rather than a guess: a reader must be able to tell "this came from code
    I can name" from "I do not know which code answered" (DR-1517). The FILES
    are asked first and `git` only as a fallback, for the reasons in
    _head_from_files -- the subprocess is the part that failed in practice.
    """
    sha = _head_from_files(repo or CENSUS_REPO)
    if sha:
        return sha
    if run is None:

        def run(argv):
            # Imported here, not at the top: only the NAS path ever needs it.
            import subprocess

            return subprocess.run(
                argv, capture_output=True, text=True, timeout=10, check=False
            ).stdout

    try:
        out = run(["git", "-C", repo or CENSUS_REPO, "rev-parse", "HEAD"])
    # DELIBERATELY BLIND, as the service word is: the census must not die for
    # failing to name itself, and every failure means the same thing -- unknown.
    except Exception:  # noqa: BLE001
        return None
    cand = (out or "").strip().split("\n")[0].strip()
    return cand if HEX_SHA.match(cand) else None


def census_of(rows, now=None, builder=None, code_sha=None, empty_ids=(), gates=None):
    """Counts by road and by shape, the oldest wait, and WHICH rows wait. No bodies, no tags.

    `gates` is {row id: [gate names that did not pass]} from stored_gates(), or
    None when the caller did not read the builder's records -- absent is NOT
    "no gate failed" (DR-0076 section 8), so nothing is published for a row the
    caller could not look up.
    """
    rows = rows or []
    gates = gates if isinstance(gates, dict) else {}
    by_road = {}
    by_shape = {}
    by_stall = {}
    waiting = []
    for r in rows:
        road = r.get("source") or ""
        bucket = road if road in ROADS else "other"
        by_road[bucket] = by_road.get(bucket, 0) + 1
        shape = shape_of(r)
        by_shape[shape] = by_shape.get(shape, 0) + 1
        if shape == "build-failed":
            cls = stall_of(r)
            by_stall[cls] = by_stall.get(cls, 0) + 1
        # WHICH ROWS WAIT, not only how many (DR-1511). The counts could say
        # five teachings waited and never which five, so a session that cannot
        # join the tailnet could DESCRIBE the queue and not act on it -- it
        # could not even run the already-shipped sweep, which takes row ids.
        # The NAS road that names rows needs a Tailscale key; this receipt
        # rides the public road and does not (DR-1269's lesson, applied again).
        #
        # NEVER A TAG, and the reason is not tidiness: a tag can carry
        # `lesson-name:<a member's name>` (DR-0639), and this receipt is read
        # over the PUBLIC road. So the row's CLASS travels and its tags do
        # not. Never a body either -- the census never reads that column.
        entry = {
            "id": r.get("id"),
            "created_at": r.get("created_at"),
            # The BUCKETED road, the same one by_road counts, never the raw
            # column: an unexpected source string would otherwise be published
            # verbatim over the public road, and the two readings of the same
            # queue would disagree about which road a row came in by.
            "source": bucket,
            "shape": shape,
        }
        if shape == "build-failed":
            entry["stall"] = stall_of(r)
            # THE CAUSE, not only the class (2026-11-18). `other` told a reader
            # that a person was wanted and never what for, and the answer was
            # on the box the whole time. Both of these are vocabulary, never
            # prose: gate NAMES from the builder's stored records, and an
            # exception CLASS NAME the interpreter itself recognises. Absent
            # when unknown -- an absent cause is unread, never "no cause".
            failed = gates.get(r.get("id"))
            if failed:
                entry["gates"] = failed
            exc = exception_of(r)
            if exc:
                entry["exception"] = exc
        # WHY it waits, and how many tries it has had (DR-1515). `ready` means
        # the builder should take it; `deferred` and an exhausted `failed` mean
        # it was handed to the hourly Routine on purpose.
        entry["why"] = why_of(r, empty_ids)
        entry["attempts"] = attempts_of(r)
        waiting.append(entry)
    oldest = None
    for r in rows:
        at = r.get("created_at")
        if isinstance(at, str) and at and (oldest is None or at < oldest):
            oldest = at
    utc = timezone.utc  # noqa: UP017
    stamped = (
        (now or datetime.now(utc)).astimezone(utc).isoformat().replace("+00:00", "Z")
    )
    return {
        "at": stamped,
        "host": platform.node(),
        "cycle": "services-sync",
        "total": len(rows),
        "by_road": by_road,
        "by_shape": by_shape,
        # Only the build-failed rows appear here, so it sums to by_shape's
        # build-failed count and is empty when nothing has failed.
        "by_stall": by_stall,
        "oldest_waiting": oldest,
        # id, created_at, source and class per row. No tags, no body.
        "waiting": waiting,
        # The builder's own state, so "3 build-failed" can be read against
        # whether the thing that builds is even running (DR-1514). Omitted
        # rather than faked when the caller did not gather it.
        **({"builder": builder} if builder is not None else {}),
        # WHICH CODE WROTE THIS (DR-1517). Without it a verdict cannot be read:
        # `ready` means different things before and after DR-1516's owner check,
        # and nothing else in the payload distinguishes them. Absent, never
        # faked, when the caller did not gather it.
        **({"code_sha": code_sha} if code_sha is not None else {}),
        # The definition travels WITH the count, so a reader can tell which
        # question was asked and never has to assume it was this one.
        "excludes": list(EXCLUDED_TAGS),
    }


def write_ledger(home, what, body=None, error=None):
    """last-run.json, so a cycle that ran but could not write is told from one that never ran."""
    try:
        os.makedirs(home, exist_ok=True)
        entry = json.loads(body) if body else {}
        entry.update({"what": what, "error": error})
        if "at" not in entry:
            entry["at"] = census_of([])["at"]
        tmp = os.path.join(home, "last-run.json.tmp")
        with open(tmp, "w", encoding="utf-8") as fh:
            json.dump(entry, fh)
        os.replace(tmp, os.path.join(home, "last-run.json"))
        return True
    except (OSError, ValueError):
        return False


def resolve_instance(url, key, slug):
    rows = rest(
        url, key, "GET", "instances?select=id&slug=eq." + urllib.parse.quote(slug)
    )
    return rows[0]["id"] if rows else None


def existing_row(url, key, instance_id):
    rows = rest(
        url,
        key,
        "GET",
        "agent_inbox?select=id&instance_id=eq."
        + instance_id
        + "&tags=cs."
        + urllib.parse.quote(json.dumps([TAG]))
        + "&order=created_at.desc&limit=1",
    )
    return rows[0]["id"] if rows else None


def publish(url, key, instance_id, body, created_by):
    """PATCH the existing census row, or INSERT the first. Returns 'patched' | 'inserted'."""
    row_id = existing_row(url, key, instance_id)
    if row_id:
        rest(
            url,
            key,
            "PATCH",
            "agent_inbox?id=eq." + row_id,
            body={"body": body, "created_at": json.loads(body)["at"]},
            extra_headers={"Prefer": "return=minimal"},
        )
        return "patched"
    rest(
        url,
        key,
        "POST",
        "agent_inbox",
        body=[
            {
                "instance_id": instance_id,
                "body": body,
                # lesson-captured so the census row can never itself read as a
                # waiting lesson: it carries no teaching and must not be built.
                "tags": [TAG, "lesson-captured"],
                "source": "nas-loops",
                "created_by": created_by,
            }
        ],
        extra_headers={"Prefer": "return=minimal"},
    )
    return "inserted"


def main():
    secrets = os.environ.get("SUPABASE_SECRETS", DEFAULT_SECRETS)
    home = os.environ.get("CENSUS_HOME", DEFAULT_HOME)
    sys.path.insert(0, os.path.join(HERE, "..", "nas-supabase"))
    try:
        from sovereign_target import load_target

        url, key = load_target(secrets, quiet=True)
    except (ImportError, OSError, ValueError, KeyError) as e:
        url = key = None
        why = e.__class__.__name__
    else:
        why = "empty target"
    if not url or not key:
        write_ledger(home, "no-credential", error=why)
        print(f"lesson-queue-census: no credential ({why}) - quiet no-op")
        return 0
    slug = os.environ.get("TRANSCRIPTS_SLUG", "colg")
    try:
        instance_id = resolve_instance(url, key, slug)
        if not instance_id:
            write_ledger(home, "no-instance", error=f"no instance with slug '{slug}'")
            print(f"lesson-queue-census: no instance with slug '{slug}'")
            return 1
        rows = rest(url, key, "GET", waiting_query()) or []
        # ONE extra request, ids only, and the BUDGET says so (two reads and one
        # write per cycle now). A refusal here must not cost the whole census,
        # so an unanswered question leaves empty_ids empty -- which means a row
        # with no words reads `ready` rather than the census dying. Narrower
        # than the truth, never wider.
        try:
            empty = rest(url, key, "GET", empty_body_query()) or []
            empty_ids = tuple(r.get("id") for r in empty if isinstance(r, dict) and r.get("id"))
        except (OSError, ValueError, KeyError):
            empty_ids = ()
        body = json.dumps(
            census_of(
                rows,
                builder=builder_state(),
                code_sha=census_code_sha(),
                empty_ids=empty_ids,
                # The builder's own stored records, read on the box with no key.
                # A read that fails leaves this empty, so a row's cause goes
                # ABSENT rather than reading as "no gate failed".
                gates=stored_gates(BUILDER_HOME),
            )
        )
        what = publish(
            url,
            key,
            instance_id,
            body,
            os.environ.get("CENSUS_CREATED_BY", DEFAULT_CREATED_BY),
        )
    except (OSError, ValueError, KeyError, IndexError) as e:
        write_ledger(home, "error", error=f"{e.__class__.__name__}: {e}"[:300])
        print(f"lesson-queue-census: error {e.__class__.__name__}: {e}")
        return 1
    write_ledger(home, what, body)
    print(f"lesson-queue-census: {what} {body}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

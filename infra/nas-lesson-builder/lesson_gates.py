#!/usr/bin/env python3
"""
lesson_gates.py -- the deterministic gates every written version passes
through, the same way, before anything ships (DR-0669).

Darrell 2026-09-29: "I want to be able to use any LLM? To see the difference
between lessons after they receive the same prompts... and have both versions
of the same lessons to validate against." So every writer's draft is gated by
the SAME functions here, and the results are stored beside the draft
(public.lesson_versions) for the side-by-side view.

Two layers, both recorded:
  1. PYTHON (always runs, stdlib only, Python 3.8 on the NAS):
     verse       every "quoted span" (Book C:V) is verbatim in the verse it
                 names in app/public/bible/kjv (a port of
                 scripts/quoted-verse-is-the-verse.mjs checkSpan, including
                 the 'shouted' and 'unresolvable' classes);
     quotation   every double-quoted span carries its reference; no ellipsis
                 inside a quotation; straight quotes only; no record id and no
                 percentage printed at the reader;
     voice       no generic "God" and no capitalised adversary name in our own
                 voice; His names never lowered (HOLY_NAME_WORDS);
     structure   the writer's schema, four bands, quiz and talking-point counts,
                 and the movement count.
  2. THE REPO'S OWN GATES on the draft, when node is on the box
     (band_gates.mjs imports scripts/quoted-verse-is-the-verse.mjs,
     quotation-integrity.mjs, full-levels.mjs, reading-level.mjs,
     band-differentiation.mjs, title-in-narrative.mjs -- the very functions
     the pinned test and CI run). Absent node, this layer says "skipped" and
     never reads as passed (DR-0076 section 8).

THE VERSE GATE IS A HARD STOP. A version whose verse gate failed never ships,
whichever writer wrote it.
"""
import json
import os
import re
import subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
REPO_DEFAULT = os.path.abspath(os.path.join(HERE, "..", ".."))

FULL_BANDS = ("child", "youth", "teen", "senior")
READER_FIELDS = ("lesson", "bigIdea", "inApp")
# The same regex as SPAN_WITH_REFERENCE in scripts/quoted-verse-is-the-verse.mjs.
SPAN_WITH_REFERENCE = re.compile(r'"([^"]+)"\s*\(([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*)\s+(\d+):([\d\-,\s]+)\)')
QUOTED = re.compile(r'"([^"]+)"')
ELLIPSIS = re.compile(r"\.\.\.|…")
# app/src/lib/typographic-theology.js HOLY_NAME_WORDS (derived there; kept in
# step by test_lesson_builder.HolyNamesInStep, which reads the JS file).
HOLY_NAME_WORDS = ("yahweh", "jesus", "christ", "messiah", "godhead", "holy spirit", "holy ghost")
ADVERSARY_CAPITALISED = re.compile(r"\b(Satan|Lucifer|Devil|Baal)\b")


def norm(s):
    return re.sub(r"\s+", " ", str(s)).strip()


# --- the corpus ----------------------------------------------------------------

class Corpus:
    """The repository's own KJV (app/public/bible/kjv/<Book>.json)."""

    def __init__(self, repo=REPO_DEFAULT):
        self.dir = os.path.join(repo, "app", "public", "bible", "kjv")
        self._files = None
        self._books = {}

    def files(self):
        if self._files is None:
            self._files = set(f[:-5] for f in os.listdir(self.dir) if f.endswith(".json") and f != "index.json")
        return self._files

    def book_file(self, book):
        k = re.sub(r"\s+", "", str(book))
        if k in self.files():
            return k
        if k + "s" in self.files():
            return k + "s"
        return None

    def verse_text(self, book, chapter, verse_label):
        f = self.book_file(book)
        if not f:
            return None
        if f not in self._books:
            with open(os.path.join(self.dir, f + ".json"), encoding="utf-8") as fh:
                self._books[f] = json.load(fh)
        chapters = self._books[f].get("chapters") or []
        try:
            chap = chapters[int(chapter) - 1]
        except (IndexError, ValueError):
            return None
        nums = []
        for part in str(verse_label).split(","):
            p = part.strip()
            if not p:
                continue
            m = re.match(r"^(\d+)\s*-\s*(\d+)$", p)
            if m:
                a, b = int(m.group(1)), int(m.group(2))
                if b < a:
                    return None
                nums.extend(range(a, b + 1))
            elif p.isdigit():
                nums.append(int(p))
            else:
                return None
        if not nums:
            return None
        parts = []
        for n in nums:
            if n < 1 or n > len(chap):
                return None
            parts.append(chap[n - 1])
        return norm(" ".join(parts))


REF_IN_TEXT = re.compile(r"\b((?:[1-3]\s?)?(?:Song of Solomon|[A-Z][a-z]+))\s+(\d+):(\d+(?:\s*-\s*\d+)?)")


def cited_references(text, corpus):
    """Every Book C:V a teaching mentions that resolves in the corpus, in order,
    unique -- fetched verbatim BEFORE the model writes (stage verses-fetched)."""
    out, seen = [], set()
    for m in REF_IN_TEXT.finditer(text or ""):
        book, chap, verses = m.group(1), m.group(2), re.sub(r"\s+", "", m.group(3))
        ref = "{} {}:{}".format(book, chap, verses)
        if ref in seen:
            continue
        t = corpus.verse_text(book, chap, verses)
        if t is not None:
            seen.add(ref)
            out.append((ref, t))
    return out


# --- the texts a reader meets (quotation-integrity.mjs quotedTexts) -------------

def reader_texts(module):
    out = []
    for f in READER_FIELDS:
        if isinstance(module.get(f), str):
            out.append((f, module[f]))
    for b in FULL_BANDS:
        t = (module.get("levels") or {}).get(b)
        if isinstance(t, str):
            out.append(("levels." + b, t))
    a = module.get("anchor") or {}
    if isinstance(a.get("theme"), str):
        out.append(("anchor.theme", a["theme"]))
    return out


def quoted_texts(module):
    out = reader_texts(module)
    for i, x in enumerate(module.get("benefits") or []):
        if isinstance(x, str):
            out.append(("benefits[{}]".format(i), x))
    for i, q in enumerate(((module.get("quiz") or {}).get("questions")) or []):
        if not isinstance(q, dict):
            continue
        if isinstance(q.get("q"), str):
            out.append(("quiz[{}].q".format(i), q["q"]))
        if isinstance(q.get("explain"), str):
            out.append(("quiz[{}].explain".format(i), q["explain"]))
        for j, o in enumerate(q.get("options") or []):
            if isinstance(o, str):
                out.append(("quiz[{}].options[{}]".format(i, j), o))
    for i, x in enumerate(((module.get("facilitator") or {}).get("talkingPoints")) or []):
        if isinstance(x, str):
            out.append(("talkingPoints[{}]".format(i), x))
    return out


# --- one deterministic canonicalisation, before any gate ----------------------

def canonical_apostrophes(obj):
    """The repository's KJV writes every apostrophe as U+2019 (measured: 1,997
    curly, 0 straight). A writer that types a straight one inside a quotation
    has the right WORDS in the wrong glyph; inside REFERENCED quotations only,
    the glyph is set to the corpus's, and the verse gate then checks every
    word. Nothing else is touched -- not our prose, not a letter of the verse."""
    def fix(text):
        return SPAN_WITH_REFERENCE.sub(lambda m: m.group(0).replace(m.group(1), m.group(1).replace("'", "\u2019"), 1), text)
    if isinstance(obj, str):
        return fix(obj)
    if isinstance(obj, list):
        return [canonical_apostrophes(x) for x in obj]
    if isinstance(obj, dict):
        return {k: canonical_apostrophes(x) for k, x in obj.items()}
    return obj


# --- gate 1: the verse ----------------------------------------------------------

def shouted_words(quoted, verse):
    theirs = set(re.findall(r"\b[A-Z]{2,}\b", verse))
    return sorted(set(w for w in re.findall(r"\b[A-Z]{2,}\b", quoted) if w not in theirs))


def check_span(corpus, quoted, book, chapter, verses):
    ref = "{} {}:{}".format(book, chapter, verses)
    verse = corpus.verse_text(book, chapter, verses)
    if verse is None:
        return {"kind": "unresolvable", "ref": ref, "quoted": quoted}
    shouted = shouted_words(quoted, verse)
    if shouted:
        return {"kind": "shouted", "ref": ref, "quoted": quoted, "words": shouted}
    sides = [norm(p).strip(",;:") for p in re.split(r"\s*(?:\.\.\.|…)\s*", quoted)]
    sides = [s.strip(",;:").strip() for s in sides if s.strip(",;:").strip()]
    missing = [s for s in sides if s not in verse]
    if missing:
        return {"kind": "not-the-verse", "ref": ref, "quoted": quoted, "missing": missing, "verse": verse}
    return None


def verse_gate(module, corpus):
    spans, verbatim, faults = 0, 0, []
    for where, text in quoted_texts(module):
        for m in SPAN_WITH_REFERENCE.finditer(str(text)):
            spans += 1
            f = check_span(corpus, m.group(1), m.group(2).strip(), m.group(3), m.group(4).strip())
            if f:
                f["where"] = where
                faults.append(f)
            else:
                verbatim += 1
    return {"passed": spans > 0 and not faults, "spans": spans, "verbatim": verbatim,
            "faults": faults[:40], "fault_count": len(faults),
            "why": "" if spans else "no referenced Scripture span at all"}


def referenced_spans(module):
    out = []
    for where, text in quoted_texts(module):
        for m in SPAN_WITH_REFERENCE.finditer(str(text)):
            out.append({"where": where, "quoted": m.group(1),
                        "ref": "{} {}:{}".format(m.group(2).strip(), m.group(3), m.group(4).strip())})
    return out


# --- gate 2: quotation integrity ------------------------------------------------

def quotation_gate(module):
    problems = []
    for where, text in quoted_texts(module):
        t = str(text)
        quotes = len(QUOTED.findall(t))
        with_ref = len(SPAN_WITH_REFERENCE.findall(t))
        if quotes != with_ref:
            problems.append("{}: {} quoted spans, {} with a reference".format(where, quotes, with_ref))
        for span in QUOTED.findall(t):
            if ELLIPSIS.search(span):
                problems.append("{}: an ellipsis inside a quotation".format(where))
        if "“" in t or "”" in t:
            problems.append("{}: curly double quotation marks (straight quotes only)".format(where))
        if re.search(r"DR-\d{4}", t):
            problems.append("{}: recites a record id at the reader".format(where))
        if re.search(r"\d\s*%", t):
            problems.append("{}: states a percentage".format(where))
    return {"passed": not problems, "problems": problems[:40], "problem_count": len(problems)}


# --- gate 3: our voice ----------------------------------------------------------

def our_voice(text):
    return QUOTED.sub(" ", str(text))


def voice_gate(module):
    problems = []
    for where, text in quoted_texts(module):
        ours = our_voice(text)
        if re.search(r"\bGod\b", ours):
            problems.append("{}: the generic \"God\" in our own voice (say Yahweh)".format(where))
        m = ADVERSARY_CAPITALISED.search(ours)
        if m:
            problems.append("{}: capitalises {}".format(where, m.group(1)))
        for name in HOLY_NAME_WORDS:
            if re.search(r"\b" + re.escape(name) + r"\b", ours):
                problems.append("{}: writes {} in lower case".format(where, name))
    return {"passed": not problems, "problems": problems[:40], "problem_count": len(problems)}


# --- gate 4: structure ----------------------------------------------------------

# The standard's floors, measured on the newest lessons (L193-L195: lesson
# 2180-6770 words, bands 1022-3322, 124-460 quotations, quiz 6, talking points
# 10-12, benefits 12-14). NAS config may raise them; lowering them is a
# decision, never a default (Darrell: "I'm not trying to cut any quality").
FLOORS = {
    "lesson_words": int(os.environ.get("LESSON_FLOOR_LESSON_WORDS", "2000")),
    "band_words": int(os.environ.get("LESSON_FLOOR_BAND_WORDS", "1000")),
    "spans": int(os.environ.get("LESSON_FLOOR_SPANS", "40")),
    "quiz": 6, "talkingPoints": 10, "benefits": 12,
}


def depth_problems(module, spans, floors=None):
    f = floors or FLOORS
    out = []
    lw_ = len(str(module.get("lesson", "")).split())
    if lw_ < f["lesson_words"]:
        out.append("the full lesson is {} words; the standard is at least {}".format(lw_, f["lesson_words"]))
    for b in FULL_BANDS:
        n = len(str((module.get("levels") or {}).get(b, "")).split())
        if n < f["band_words"]:
            out.append("the {} band is {} words; the standard is at least {}".format(b, n, f["band_words"]))
    if spans < f["spans"]:
        out.append("{} referenced Scripture quotations; the standard is at least {}".format(spans, f["spans"]))
    for key, path in (("quiz", ("quiz", "questions")), ("talkingPoints", ("facilitator", "talkingPoints"))):
        n = len(((module.get(path[0]) or {}).get(path[1])) or [])
        if n < f[key]:
            out.append("{} {}; the standard is {}".format(n, key, f[key]))
    if len(module.get("benefits") or []) < f["benefits"]:
        out.append("{} benefits; the standard is {}".format(len(module.get("benefits") or []), f["benefits"]))
    return out


# TALK ABOUT IT TOGETHER (DR-0733). Darrell 2026-10-01: every lesson prompts
# parents toward their children, children toward their parents, and friend
# toward friend. The JS layer (band_gates.mjs, app/src/lib/talk-together.js) is
# the reference; this mirrors its three patterns so a NAS without node still
# refuses a draft that sends the reader to no one.
_TALK_PARENTS = re.compile(r"\b(parents?|mom|dad|mother|father|grown-?ups?|guardians?)\b[^.!?]{0,90}\b(ask|talk|discuss|read|share|sit|teach|listen)\b[^.!?]{0,80}\b(child|children|kids?|son|daughter|young|family)\b", re.I)
_TALK_CHILDREN = re.compile(r"\b(ask|tell|talk (?:to|with)|share with|read (?:this |it )?(?:to|with)|discuss (?:this |it )?with|show)\b[^.!?]{0,50}\b(?:your|a) (?:parents?|mom|dad|mother|father|grown-?up|grandparents?|grandma|grandpa|family)\b", re.I)
_TALK_FRIENDS = re.compile(r"\b(friends?|one another|each other|a brother or sister|someone you trust|relationship to relationship)\b[^.!?]{0,90}\b(ask|tell|talk|discuss|share|sharpen|pray|listen|read)\b|\b(ask|tell|talk (?:to|with)|share with|pray with|read (?:this |it )?with)\b[^.!?]{0,40}\b(?:a|your) (?:friend|brother or sister in Christ|neighbou?r)\b", re.I)


def talk_together_gate(module):
    """(passed, missing): which of the three directions the lesson's own words lack."""
    m = module or {}
    levels = m.get("levels") or {}
    adult = " ".join(str(x) for x in [m.get("lesson", ""), m.get("bigIdea", ""), m.get("inApp", ""), levels.get("senior", "")] + list(((m.get("facilitator") or {}).get("talkingPoints")) or []) + list(m.get("benefits") or []))
    young = " ".join(str(levels.get(b, "")) for b in ("child", "youth", "teen"))
    everything = adult + " " + young
    missing = []
    if not _TALK_PARENTS.search(adult):
        missing.append("parents")
    if not _TALK_CHILDREN.search(young or everything):
        missing.append("children")
    if not _TALK_FRIENDS.search(everything):
        missing.append("friends")
    return (not missing, missing)


def structure_gate(obj, schema_problems):
    problems = list(schema_problems(obj))
    counts = {}
    if isinstance(obj, dict) and obj.get("verdict") == "lesson":
        counts = {
            "movements": len(obj.get("movements") or []),
            "bands": sum(1 for b in FULL_BANDS if isinstance((obj.get("levels") or {}).get(b), str)),
            "quiz": len(((obj.get("quiz") or {}).get("questions")) or []),
            "talkingPoints": len(((obj.get("facilitator") or {}).get("talkingPoints")) or []),
            "benefits": len(obj.get("benefits") or []),
        }
    return {"passed": not problems, "problems": problems, "counts": counts}


# --- layer 2: the repo's own gates, on the draft --------------------------------

def node_band_gates(module, repo=REPO_DEFAULT, node="node", run=subprocess.run, timeout=120):
    """Run band_gates.mjs (the repo's own gate functions) on the draft. Returns
    its JSON, or {"skipped": why} -- never a pass it did not measure."""
    # The harness beside THIS code (it imports ../../scripts from there), so the
    # gates that run are the ones this code was merged with.
    harness = os.path.join(HERE, "band_gates.mjs")
    try:
        r = run([node, harness], input=json.dumps(module).encode("utf-8"), capture_output=True, timeout=timeout)
    except FileNotFoundError:
        return {"skipped": "node is not on this machine"}
    except Exception as e:  # noqa: BLE001
        return {"skipped": "band gates could not run: {}".format(e)}
    if r.returncode != 0:
        return {"skipped": "band gates exit {}: {}".format(r.returncode, (r.stderr or b"")[-300:].decode("utf-8", "replace"))}
    try:
        return json.loads(r.stdout.decode("utf-8"))
    except ValueError:
        return {"skipped": "band gates printed no JSON"}


# --- all gates, one version -----------------------------------------------------

def gate_version(obj, module, corpus, schema_problems, band_gates=None):
    """Every gate, in one record, for one writer's draft. `module` is the lesson
    object as it would be committed (None when the draft is not a lesson)."""
    res = {"structure": structure_gate(obj, schema_problems)}
    if module is None:
        res["passed"] = False
        res["verse_passed"] = False
        return res
    res["verse"] = verse_gate(module, corpus)
    depth = depth_problems(module, res["verse"]["spans"])
    res["depth"] = {"passed": not depth, "problems": depth}
    res["quotation"] = quotation_gate(module)
    res["voice"] = voice_gate(module)
    talk_ok, talk_missing = talk_together_gate(module)
    res["talk_together"] = {"passed": talk_ok, "missing": talk_missing}
    bg = band_gates(module) if band_gates else {"skipped": "not run"}
    res["repo_gates"] = bg
    ran = bg.get("skipped") is None
    repo_ok = (not ran) or bool(bg.get("passed"))
    # Both verse scans must pass when both ran: ours, and the repo's own.
    res["verse_passed"] = bool(res["verse"]["passed"] and ((not ran) or (bg.get("verse") or {}).get("passed")))
    res["passed"] = bool(res["structure"]["passed"] and res["verse_passed"] and res["quotation"]["passed"]
                         and res["voice"]["passed"] and res["depth"]["passed"] and res["talk_together"]["passed"] and repo_ok)
    return res


def score(version):
    """Rank passing versions: more verbatim Scripture, then fuller structure,
    then faster. Deterministic; ties break on writer name."""
    g = version.get("gates") or {}
    c = (g.get("structure") or {}).get("counts") or {}
    return ((g.get("verse") or {}).get("verbatim", 0), c.get("movements", 0), c.get("quiz", 0),
            -int(version.get("elapsed_ms") or 0))


def select_version(versions, primary):
    """WHICH VERSION SHIPS (DR-0669 s5).
    1. The primary writer's version, if it passed every gate.
    2. Otherwise the best-gated passing version (score above).
    3. Never a version whose verse gate failed -- even if it is primary and
       every other gate passed. Returns (version or None, why)."""
    ok = [v for v in versions if (v.get("gates") or {}).get("passed") and (v.get("gates") or {}).get("verse_passed")]
    for v in ok:
        if v.get("writer") == primary:
            return v, "primary writer {} passed every gate".format(primary)
    if not ok:
        return None, "no version passed every gate ({} written)".format(len(versions))
    best = sorted(ok, key=lambda v: (score(v), v.get("writer", "")), reverse=True)[0]
    return best, "primary {} did not pass; best-gated passing version is {}".format(primary, best.get("writer"))

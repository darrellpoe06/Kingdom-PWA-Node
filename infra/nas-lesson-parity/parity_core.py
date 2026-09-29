#!/usr/bin/env python3
"""
parity_core.py -- the deterministic measures of the tower parity loop (DR-0671).

Darrell, 2026-09-29: "The final goal is to not need any no local model... we
need to make more workflows that produce the same outcome from claude based on
the process being used... claude needs to create the specific algorithmic fixes
for our workflows to work on the towers etc..."

The end state: lessons are written on our own towers, by local models plus
deterministic code, at the SAME quality Claude writes them today. Claude's
version is the reference; this module measures how far a tower version is from
it, names each shortfall as a fixable class, and cross-references every version
of a teaching against every other.

EVERY NUMBER HERE IS DETERMINISTIC AND EXPLAINABLE. No LLM judges a score. Each
measure is a count, a set comparison or a formula, and every section returns
the evidence it was computed from (the missing verses, the unmatched
movements, the band word counts), so a reader can recompute it by hand.

The formulas that already gate the house corpus are PORTED, not reinvented, and
pinned against the JavaScript originals by app/src/__tests__/tower-parity.test.js:
  - Flesch-Kincaid grade + syllables + "our prose only"  <- scripts/reading-level.mjs
  - band words, share of the adult lesson, FULL_FLOOR    <- scripts/full-levels.mjs
  - a quoted span with its reference is the verse         <- scripts/quoted-verse-is-the-verse.mjs

Pure: no network, no database, no clock. The KJV is read from
app/public/bible/kjv (the in-repo corpus), or from KJV_DIR.

THE GENERAL INTERFACE (so other workflows can join later, see workflows.py):
a workflow supplies measure(reference, candidate) -> sections, hard_floors(),
classify(sections) -> gaps, and pairwise(a, b). Lessons are the only workflow
implemented now.
"""
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
KJV_DIR = os.environ.get("KJV_DIR", os.path.join(REPO, "app", "public", "bible", "kjv"))

# Bump when a formula changes, so old rows are never compared with new ones.
MEASURE_VERSION = "parity-v1"

# ---------------------------------------------------------------------------
# Constants mirrored from the JS gates (pinned by the cross-language test).
# ---------------------------------------------------------------------------
BAND_ORDER = ["child", "youth", "teen", "senior"]
FULL_FLOOR = {"child": 0.5, "youth": 0.6, "teen": 0.6, "senior": 0.6}
NEW_LESSON_CHILD_CEILING = 5.0

# Parity-specific tolerances (DR-0671 records why each is set where it is).
READING_DELTA_MAX = 1.5      # grade levels a band may drift from the reference
LENGTH_RATIO_BAND = (0.75, 1.33)  # words per band, candidate / reference
THEME_MATCH_MIN = 0.5        # token recall for a movement theme to count as covered
VERSE_COVERAGE_MIN = 0.8     # below this, the version is missing verse retrieval
MOVEMENT_COVERAGE_MIN = 0.8
STRUCTURE_MIN = 0.9

# Section weights of the parity score. They sum to 1.0.
WEIGHTS = {
    "gates": 0.20,
    "coverage": 0.25,
    "structure": 0.15,
    "bands": 0.15,
    "quiz": 0.10,
    "reading": 0.10,
    "length": 0.05,
}

STOP = set("""
a an and are as at be been but by for from has have he her him his i in is it its
of on or our so that the their them then there these they this those to was we
were what when which who why will with you your yours thee thou thy thine ye unto
shall hath doth not no nor all any one two three first second third how into over
out up do does did can may must also only more most than very just every each
""".split())


# ---------------------------------------------------------------------------
# The KJV corpus and references.
# ---------------------------------------------------------------------------
_book_files = None
_book_cache = {}
_book_names = None


def _files():
    global _book_files
    if _book_files is None:
        _book_files = set(
            f[:-5] for f in os.listdir(KJV_DIR) if f.endswith(".json") and f != "index.json"
        )
    return _book_files


def book_file(book):
    """The corpus file for a book name, the same rule as bookFile() in JS."""
    k = re.sub(r"\s+", "", str(book))
    if k in _files():
        return k
    if (k + "s") in _files():
        return k + "s"
    return None


def book_name(file_key):
    """The display name of a corpus file ('1Thessalonians' -> '1 Thessalonians')."""
    global _book_names
    if _book_names is None:
        _book_names = {}
        try:
            with open(os.path.join(KJV_DIR, "index.json"), encoding="utf-8") as f:
                for b in json.load(f):
                    _book_names[b["file"]] = b["name"]
        except (OSError, ValueError):
            pass
    return _book_names.get(file_key, file_key)


def _chapter(file_key, chapter):
    if file_key not in _book_cache:
        with open(os.path.join(KJV_DIR, file_key + ".json"), encoding="utf-8") as f:
            _book_cache[file_key] = json.load(f)
    chs = _book_cache[file_key].get("chapters") or []
    c = int(chapter)
    return chs[c - 1] if 1 <= c <= len(chs) else None


def _norm(s):
    return re.sub(r"\s+", " ", str(s)).strip()


def verse_numbers(label):
    """'1-3, 5' -> [1, 2, 3, 5]; None when a range runs backwards."""
    nums = []
    for part in str(label).split(","):
        p = part.strip()
        if not p:
            continue
        m = re.match(r"^(\d+)\s*[-–]\s*(\d+)$", p)
        if m:
            a, b = int(m.group(1)), int(m.group(2))
            if b < a:
                return None
            nums.extend(range(a, b + 1))
        elif p.isdigit():
            nums.append(int(p))
        else:
            return None
    return nums or None


def verse_text(book, chapter, label):
    fk = book_file(book)
    if not fk:
        return None
    chap = _chapter(fk, chapter)
    nums = verse_numbers(label)
    if chap is None or nums is None:
        return None
    parts = []
    for n in nums:
        if n < 1 or n > len(chap):
            return None
        parts.append(chap[n - 1])
    return _norm(" ".join(parts))


# A book-named reference anywhere in the text: "Psalms 12:6-7", "1 Peter 1:23-25",
# "Song of Solomon 2:1", "Jeremiah 36:23, 28, 32".
REF_RE = re.compile(
    r"\b([1-3]?\s?[A-Z][a-z]+(?: of [A-Z][a-z]+)*)\s+(\d+):(\d+(?:\s*[-–]\s*\d+)?(?:\s*,\s*\d+(?:\s*[-–]\s*\d+)?)*)"
)
# A quoted span with its reference, the house form (same as SPAN_WITH_REFERENCE).
SPAN_RE = re.compile(r'"([^"]+)"\s*\(([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*)\s+(\d+):([\d\-,\s]+)\)')


def refs_in(text):
    """Every verse a text names, expanded to single-verse keys 'Book C:V'."""
    out = []
    for m in REF_RE.finditer(str(text or "")):
        fk = book_file(m.group(1).strip())
        if not fk:
            continue
        nums = verse_numbers(m.group(3))
        chap = _chapter(fk, m.group(2))
        if not nums or chap is None:
            continue
        for n in nums:
            if 1 <= n <= len(chap):
                out.append("%s %s:%d" % (book_name(fk), int(m.group(2)), n))
    return out


# ---------------------------------------------------------------------------
# The lesson body: which strings a reader reads.
# ---------------------------------------------------------------------------
READER_FIELDS = ["lesson", "bigIdea", "inApp"]


def reader_texts(body):
    """[where, text] for every reader-facing string (mirrors quotedTexts in JS)."""
    b = body or {}
    out = [[f, b[f]] for f in READER_FIELDS if isinstance(b.get(f), str)]
    levels = b.get("levels") or {}
    for band in BAND_ORDER:
        if isinstance(levels.get(band), str):
            out.append(["levels." + band, levels[band]])
    anchor = b.get("anchor") or {}
    if isinstance(anchor.get("theme"), str):
        out.append(["anchor.theme", anchor["theme"]])
    for i, x in enumerate(b.get("benefits") or []):
        if isinstance(x, str):
            out.append(["benefits[%d]" % i, x])
    for i, q in enumerate(((b.get("quiz") or {}).get("questions")) or []):
        if isinstance(q.get("q"), str):
            out.append(["quiz[%d].q" % i, q["q"]])
        if isinstance(q.get("explain"), str):
            out.append(["quiz[%d].explain" % i, q["explain"]])
        for j, o in enumerate(q.get("options") or []):
            if isinstance(o, str):
                out.append(["quiz[%d].options[%d]" % (i, j), o])
    for i, x in enumerate(((b.get("facilitator") or {}).get("talkingPoints")) or []):
        if isinstance(x, str):
            out.append(["talkingPoints[%d]" % i, x])
    return out


def cited_verses(body):
    """The set of single verses a lesson cites: its anchor.ref plus every reference in its text."""
    s = set()
    anchor = (body or {}).get("anchor") or {}
    for r in refs_in(anchor.get("ref") or ""):
        s.add(r)
    for _, t in reader_texts(body):
        for r in refs_in(t):
            s.add(r)
    return s


# ---------------------------------------------------------------------------
# The verse gate (a quoted span is the verse it names).
# ---------------------------------------------------------------------------

def check_span(quoted, book, chapter, verses):
    ref = "%s %s:%s" % (book, chapter, verses.strip())
    verse = verse_text(book, chapter, verses.strip())
    if verse is None:
        return {"kind": "unresolvable", "ref": ref}
    theirs = set(re.findall(r"\b[A-Z]{2,}\b", verse))
    shouted = sorted(set(w for w in re.findall(r"\b[A-Z]{2,}\b", quoted) if w not in theirs))
    if shouted:
        return {"kind": "shouted", "ref": ref, "words": shouted}
    sides = [re.sub(r"^[,;:]+|[,;:]+$", "", _norm(p)) for p in re.split(r"\s*(?:\.\.\.|…)\s*", quoted)]
    missing = [p for p in sides if p and p not in verse]
    if missing:
        return {"kind": "not-the-verse", "ref": ref, "missing": missing[:3]}
    return None


def verse_gate(body):
    """Quoted spans checked verbatim against the KJV. passed needs >= 1 span and 0 faults."""
    spans = 0
    faults = []
    for where, text in reader_texts(body):
        for m in SPAN_RE.finditer(str(text)):
            spans += 1
            f = check_span(m.group(1), m.group(2).strip(), m.group(3), m.group(4))
            if f:
                f["where"] = where
                faults.append(f)
    return {"spans": spans, "verbatim": spans - len(faults), "faults": faults,
            "passed": spans > 0 and not faults}


# ---------------------------------------------------------------------------
# Reading level + band fullness (ported from the JS gates, pinned by test).
# ---------------------------------------------------------------------------

def syllables(word):
    w = re.sub(r"[^a-z]", "", str(word).lower())
    if not w:
        return 0
    if len(w) <= 3:
        return 1
    t = re.sub(r"(?:[^laeiouy]es|ed|[^laeiouy]e)$", "", w)
    t = re.sub(r"^y", "", t)
    return len(re.findall(r"[aeiouy]{1,2}", t)) or 1


def our_prose_only(text):
    return re.sub(r'"[^"]*"', " ", str(text or ""))


def fk_grade(text):
    t = str(text or "")
    words = re.findall(r"[A-Za-z’']+", t)
    if not words:
        return None
    sentences = len(re.findall(r"[.!?]+", t)) or 1
    syl = sum(syllables(w) for w in words)
    return 0.39 * (len(words) / sentences) + 11.8 * (syl / len(words)) - 15.59


def _js_round1(n):
    """Math.round(n * 10) / 10, the JS way (half rounds toward +infinity)."""
    import math
    return None if n is None else math.floor(n * 10 + 0.5) / 10


def reading_levels(body):
    levels = (body or {}).get("levels") or {}
    out = {}
    for band in BAND_ORDER:
        t = levels.get(band)
        if isinstance(t, str) and t:
            out[band] = _js_round1(fk_grade(our_prose_only(t)))
    if isinstance((body or {}).get("lesson"), str) and body["lesson"]:
        out["adult"] = _js_round1(fk_grade(our_prose_only(body["lesson"])))
    return out


def word_count(s):
    return len(s.split()) if isinstance(s, str) else 0


def prose_words(s):
    return word_count(our_prose_only(s if isinstance(s, str) else ""))


def fullness(body):
    b = body or {}
    levels = b.get("levels") or {}
    adult = prose_words(b.get("lesson")) or prose_words(levels.get("standard"))
    bands = {}
    for band in BAND_ORDER:
        n = prose_words(levels.get(band))
        share = round(n / adult, 2) if adult else None
        bands[band] = {"words": n, "share": share, "present": n > 0,
                       "full": n > 0 and (not adult or (share is not None and share >= FULL_FLOOR[band]))}
    return {"adultWords": adult, "bands": bands}


# ---------------------------------------------------------------------------
# Movements: the lesson's numbered points.
# ---------------------------------------------------------------------------
# A lesson body may carry explicit movements [{theme|title, text}]. When it does
# not (the whole house corpus today), they are the ALL-CAPS lead clauses the
# house writes its points with -- the same convention lesson-format.js numbers.
CAPS_LEAD = re.compile(r"(?:^|(?<=[.!?\"]\s))([A-Z][A-Z'’\-, ]{4,68}?)([.:—])(?=\s|$)")


def tokens(text):
    out = []
    for w in re.findall(r"[a-z]+", str(text or "").lower()):
        if len(w) < 3 or w in STOP:
            continue
        for suf in ("ing", "ed", "es", "s"):
            if w.endswith(suf) and len(w) - len(suf) >= 3:
                w = w[: -len(suf)]
                break
        out.append(w)
    return out


def movements(body):
    b = body or {}
    explicit = b.get("movements")
    if isinstance(explicit, list) and explicit:
        out = []
        for m in explicit:
            if isinstance(m, dict):
                theme = m.get("theme") or m.get("title") or ""
                text = m.get("text") or m.get("body") or ""
            else:
                theme, text = str(m), ""
            out.append({"theme": _norm(theme), "text": text, "verses": sorted(set(refs_in(theme + " " + text)))})
        return out
    lesson = b.get("lesson") if isinstance(b.get("lesson"), str) else ""
    heads = []
    for m in CAPS_LEAD.finditer(lesson):
        clause = m.group(1).strip()
        if len(clause.split()) < 2 or not re.search(r"[A-Z]{2}", clause):
            continue
        heads.append((m.start(1), clause))
    out = []
    for i, (pos, clause) in enumerate(heads):
        end = heads[i + 1][0] if i + 1 < len(heads) else len(lesson)
        text = lesson[pos:end]
        out.append({"theme": clause.title(), "text": text, "verses": sorted(set(refs_in(text)))})
    return out


def theme_match(ref_m, cand_ms):
    """Best match of one reference movement in the candidate's movements.
    Covered when theme-token recall >= THEME_MATCH_MIN, or when half of the
    reference movement's verses appear in one candidate movement."""
    want = set(tokens(ref_m["theme"]))
    want_v = set(ref_m.get("verses") or [])
    best = {"covered": False, "recall": 0.0, "verseOverlap": 0.0, "matched": None}
    for c in cand_ms:
        have = set(tokens(c["theme"] + " " + c["text"][:400]))
        recall = (len(want & have) / len(want)) if want else 0.0
        vo = (len(want_v & set(c.get("verses") or [])) / len(want_v)) if want_v else 0.0
        if (recall, vo) > (best["recall"], best["verseOverlap"]):
            best = {"covered": recall >= THEME_MATCH_MIN or vo >= 0.5, "recall": round(recall, 3),
                    "verseOverlap": round(vo, 3), "matched": c["theme"]}
    return best


# ---------------------------------------------------------------------------
# Quiz: count and correctness against the cited verses.
# ---------------------------------------------------------------------------

def quiz_check(body, cited=None):
    """Each question is CORRECT when it is well formed (>= 2 distinct options, the
    answer index in range) AND grounded: its explanation names at least one
    verse the lesson cites, and every quoted span in it is that verse verbatim."""
    cited = cited if cited is not None else cited_verses(body)
    qs = (((body or {}).get("quiz") or {}).get("questions")) or []
    rows = []
    for i, q in enumerate(qs):
        opts = [o for o in (q.get("options") or []) if isinstance(o, str)]
        ans = q.get("answer")
        problems = []
        if len(opts) < 2 or len(set(o.strip().lower() for o in opts)) != len(opts):
            problems.append("options")
        if not isinstance(ans, int) or isinstance(ans, bool) or not (0 <= ans < len(opts)):
            problems.append("answer-index")
        explain = str(q.get("explain") or "") + " " + str(q.get("q") or "")
        named = set(refs_in(explain))
        if not named:
            problems.append("no-verse")
        elif not (named & cited):
            problems.append("verse-not-in-lesson")
        for m in SPAN_RE.finditer(explain):
            if check_span(m.group(1), m.group(2).strip(), m.group(3), m.group(4)):
                problems.append("misquoted")
                break
        rows.append({"i": i, "correct": not problems, "problems": problems,
                     "answer": opts[ans] if isinstance(ans, int) and not isinstance(ans, bool) and 0 <= ans < len(opts) else None,
                     "verses": sorted(named)})
    return {"count": len(qs), "correct": sum(1 for r in rows if r["correct"]), "questions": rows}


# ---------------------------------------------------------------------------
# Structure.
# ---------------------------------------------------------------------------
REQUIRED_FIELDS = ["title", "bigIdea", "inApp", "anchor.ref", "anchor.theme|anchor.text",
                   "benefits", "levels", "quiz.questions", "facilitator.talkingPoints", "lesson"]


def _has(body, path):
    for alt in path.split("|"):
        cur = body
        ok = True
        for k in alt.split("."):
            if not isinstance(cur, dict) or k not in cur:
                ok = False
                break
            cur = cur[k]
        if ok and cur not in (None, "", [], {}):
            return True
    return False


def structure_counts(body):
    b = body or {}
    return {
        "benefits": len(b.get("benefits") or []),
        "talkingPoints": len(((b.get("facilitator") or {}).get("talkingPoints")) or []),
        "movements": len(movements(b)),
        "quiz": len(((b.get("quiz") or {}).get("questions")) or []),
    }


# ---------------------------------------------------------------------------
# Gate results as the builder stored them.
# ---------------------------------------------------------------------------

def normalize_gates(gate_results):
    """Accept {name: bool}, {name: {pass|passed|ok: bool}} or [{name, pass|passed|ok}]."""
    out = {}
    if isinstance(gate_results, dict):
        items = gate_results.items()
    elif isinstance(gate_results, list):
        items = [(g.get("name") or g.get("gate") or str(i), g) for i, g in enumerate(gate_results) if isinstance(g, dict)]
    else:
        items = []
    for name, v in items:
        if isinstance(v, bool):
            out[str(name)] = v
        elif isinstance(v, dict):
            for k in ("pass", "passed", "ok", "green"):
                if isinstance(v.get(k), bool):
                    out[str(name)] = v[k]
                    break
    return out


def stored_verse_gate_failed(gate_results):
    g = normalize_gates(gate_results)
    return any((not ok) for name, ok in g.items() if "verse" in name.lower() or "kjv" in name.lower())


# ---------------------------------------------------------------------------
# One version, measured on its own.
# ---------------------------------------------------------------------------

def profile(version):
    body = version.get("body") or {}
    cited = cited_verses(body)
    return {
        "body": body,
        "cited": cited,
        "verseGate": verse_gate(body),
        "movements": movements(body),
        "reading": reading_levels(body),
        "fullness": fullness(body),
        "quiz": quiz_check(body, cited),
        "counts": structure_counts(body),
        "fields": {f: _has(body, f) for f in REQUIRED_FIELDS},
        "gates": normalize_gates(version.get("gate_results")),
    }


def _ratio(c, r):
    if r <= 0:
        return 1.0
    return min(c / r, 1.0)


# ---------------------------------------------------------------------------
# Candidate against the reference.
# ---------------------------------------------------------------------------

def compare(reference, candidate):
    """The parity report of one tower version against the reference version.
    Returns {score, passed, sections, floors, gaps}."""
    R, C = profile(reference), profile(candidate)
    sec = {}

    # 1. gates, side by side
    rg, cg = R["gates"], C["gates"]
    ref_passed = [g for g, ok in rg.items() if ok]
    lost = [g for g in ref_passed if cg.get(g) is not True]
    own = C["verseGate"]
    gate_score = (_ratio(len(ref_passed) - len(lost), len(ref_passed)) if ref_passed else 1.0)
    verse_score = (own["verbatim"] / own["spans"]) if own["spans"] else 0.0
    sec["gates"] = {"score": round(0.5 * gate_score + 0.5 * verse_score, 4),
                    "sideBySide": {g: {"reference": rg.get(g), "candidate": cg.get(g)} for g in sorted(set(rg) | set(cg))},
                    "lostGates": lost, "verseGate": {"reference": _vg(R["verseGate"]), "candidate": _vg(own)}}

    # 2. coverage: each reference verse and movement theme, present or missing
    missing_v = sorted(R["cited"] - C["cited"])
    v_cov = (1 - len(missing_v) / len(R["cited"])) if R["cited"] else 1.0
    mv = []
    for m in R["movements"]:
        hit = theme_match(m, C["movements"])
        mv.append({"theme": m["theme"], **hit})
    m_cov = (sum(1 for x in mv if x["covered"]) / len(mv)) if mv else 1.0
    sec["coverage"] = {"score": round(0.6 * v_cov + 0.4 * m_cov, 4),
                       "verses": {"reference": len(R["cited"]), "present": len(R["cited"]) - len(missing_v),
                                  "missing": missing_v, "extra": sorted(C["cited"] - R["cited"]), "coverage": round(v_cov, 4)},
                       "movements": {"reference": len(mv), "covered": sum(1 for x in mv if x["covered"]),
                                     "detail": mv, "coverage": round(m_cov, 4)}}

    # 3. structure
    fields_missing = [f for f, ok in C["fields"].items() if not ok and R["fields"].get(f)]
    ref_fields = sum(1 for ok in R["fields"].values() if ok) or 1
    f_score = 1 - len(fields_missing) / ref_fields
    ratios = {k: round(_ratio(C["counts"][k], R["counts"][k]), 4) for k in R["counts"]}
    sec["structure"] = {"score": round(0.5 * f_score + 0.5 * (sum(ratios.values()) / len(ratios)), 4),
                        "missingFields": fields_missing, "counts": {"reference": R["counts"], "candidate": C["counts"]},
                        "countRatios": ratios}

    # 4. band completeness
    fb = C["fullness"]["bands"]
    missing_b = [b for b in BAND_ORDER if not fb[b]["present"]]
    short_b = [b for b in BAND_ORDER if fb[b]["present"] and not fb[b]["full"]]
    sec["bands"] = {"score": round(sum(1 for b in BAND_ORDER if fb[b]["full"]) / len(BAND_ORDER), 4),
                    "missing": missing_b, "short": short_b, "floor": FULL_FLOOR,
                    "candidate": C["fullness"], "reference": R["fullness"]}

    # 5. quiz count and correctness. "errors" are absolute (a malformed question,
    # a verse the lesson never cites, a misquote). Grounding (the explanation
    # names its verse) is held RELATIVE to the reference: measured 2026-09-29,
    # 71 of the 127 four-band house lessons carry questions whose explanation
    # names no verse, so an absolute floor would fail Claude's own lessons.
    q, rq = C["quiz"], R["quiz"]
    q_ratio = _ratio(q["count"], rq["count"])
    errs = [x for x in q["questions"] if set(x["problems"]) - {"no-verse"}]
    well = ((q["count"] - len(errs)) / q["count"]) if q["count"] else 0.0
    g_c = _grounded_share(q)
    g_r = _grounded_share(rq)
    g_ratio = 1.0 if g_r == 0 else min(g_c / g_r, 1.0)
    sec["quiz"] = {"score": round(q_ratio * well * g_ratio, 4), "count": q["count"], "referenceCount": rq["count"],
                   "correct": q["correct"], "wellFormed": q["count"] - len(errs),
                   "grounded": {"candidate": round(g_c, 4), "reference": round(g_r, 4)},
                   "errors": [{"i": e["i"], "problems": e["problems"]} for e in errs]}

    # 6. reading level
    checks = []
    rl, cl = R["reading"], C["reading"]
    child = cl.get("child")
    # Held to the new-lesson ceiling, or to the reference when the reference is
    # itself above it (the tower is asked to match Claude, not to beat it).
    ceiling = max(NEW_LESSON_CHILD_CEILING, rl.get("child") or 0)
    checks.append({"check": "child<=ceiling", "ok": child is not None and child <= ceiling,
                   "value": child, "ceiling": ceiling})
    present = [b for b in BAND_ORDER if cl.get(b) is not None]
    inverted = any(cl[present[i]] > cl[present[i + 1]] for i in range(len(present) - 1))
    rpresent = [b for b in BAND_ORDER if rl.get(b) is not None]
    ref_inverted = any(rl[rpresent[i]] > rl[rpresent[i + 1]] for i in range(len(rpresent) - 1))
    inverted = inverted and not ref_inverted
    checks.append({"check": "bands-in-order", "ok": not inverted})
    for b in BAND_ORDER + ["adult"]:
        if rl.get(b) is None:
            continue
        v = cl.get(b)
        checks.append({"check": "delta:" + b, "ok": v is not None and abs(v - rl[b]) <= READING_DELTA_MAX,
                       "reference": rl[b], "candidate": v})
    sec["reading"] = {"score": round(sum(1 for c in checks if c["ok"]) / len(checks), 4), "checks": checks,
                      "inverted": inverted}

    # 7. length per band
    lengths = []
    rf = R["fullness"]
    for b in BAND_ORDER:
        rw, cw = rf["bands"][b]["words"], fb[b]["words"]
        if not rw:
            continue
        ratio = cw / rw
        lo, hi = LENGTH_RATIO_BAND
        s = 1.0 if lo <= ratio <= hi else (ratio / lo if ratio < lo else hi / ratio)
        lengths.append({"band": b, "reference": rw, "candidate": cw, "ratio": round(ratio, 3), "score": round(max(0.0, s), 4)})
    ra, ca = rf["adultWords"], C["fullness"]["adultWords"]
    if ra:
        ratio = ca / ra
        lo, hi = LENGTH_RATIO_BAND
        s = 1.0 if lo <= ratio <= hi else (ratio / lo if ratio < lo else hi / ratio)
        lengths.append({"band": "adult", "reference": ra, "candidate": ca, "ratio": round(ratio, 3), "score": round(max(0.0, s), 4)})
    sec["length"] = {"score": round(sum(x["score"] for x in lengths) / len(lengths), 4) if lengths else 1.0,
                     "bands": lengths}

    score = round(sum(WEIGHTS[k] * sec[k]["score"] for k in WEIGHTS), 4)
    floors = {
        "verseGateClean": own["passed"],
        "noLostGate": not lost,
        "allBandsPresent": not missing_b,
        "quizSound": q["count"] > 0 and not errs and g_c >= g_r,
        "quizComplete": q["count"] >= rq["count"],
        "versesCovered": v_cov >= VERSE_COVERAGE_MIN,
        # Added from measurement (DR-0671): cutting a band to a third, doubling
        # every band by repeating it, or writing the child band at an adult
        # grade scored above the threshold on 112, 127 and 25 of the 127
        # four-band house lessons. Quality is not cut, so all three are floors.
        "bandsInLength": all(LENGTH_RATIO_BAND[0] <= x["ratio"] <= LENGTH_RATIO_BAND[1] for x in lengths),
        "childReadable": checks[0]["ok"] and not inverted,
    }
    report = {"score": score, "passed": all(floors.values()), "sections": sec, "floors": floors, "weights": WEIGHTS,
              "measureVersion": MEASURE_VERSION}
    report["gaps"] = classify(report)
    return report


def _grounded_share(quiz):
    qs = quiz["questions"]
    return (sum(1 for x in qs if "no-verse" not in x["problems"]) / len(qs)) if qs else 0.0


def _vg(g):
    return {"spans": g["spans"], "verbatim": g["verbatim"], "passed": g["passed"],
            "faults": [{k: f[k] for k in ("kind", "ref", "where") if k in f} for f in g["faults"]][:10]}


# ---------------------------------------------------------------------------
# Name the gaps: each shortfall is a fixable class with its evidence.
# ---------------------------------------------------------------------------
# class -> the kind of algorithmic fix that closes it (the Claude fix step reads this).
GAP_CLASSES = {
    "gate-failure": "run the failing house gate inside the tower pipeline and repair before storing",
    "misquoted-verse": "quote verses only from the corpus: fetch the verse text by reference and insert it verbatim",
    "missing-verse-retrieval": "deterministic topic-to-verse retrieval over app/public/bible/kjv (+ xref) fed into the prompt",
    "missing-movement": "movement scaffold generator: fix the points and their verses before the model writes prose",
    "weak-structure": "a schema-first scaffold that fills every required field and count",
    "missing-band": "band-rewrite template: write each age band from the adult lesson",
    "short-band": "band-rewrite template with a word floor per band",
    "reading-level": "reading-level post-pass: shorten sentences and words until the band meets its grade",
    "band-order-inverted": "reading-level post-pass ordered child < youth < teen < senior",
    "quiz-count": "quiz generator constrained to the cited verses, one question per movement",
    "quiz-errors": "quiz generator constrained to cited verses, answer index and quote checked",
    "quiz-ungrounded": "quiz generator that names the cited verse in every explanation",
    "length-short": "band-rewrite template with a length target taken from the reference ratio",
    "length-long": "trim pass that keeps quoted verses and movement heads",
}


def classify(report):
    s = report["sections"]
    gaps = []

    def add(cls, evidence):
        gaps.append({"class": cls, "fix": GAP_CLASSES[cls], "evidence": evidence})

    if s["gates"]["lostGates"]:
        add("gate-failure", {"lost": s["gates"]["lostGates"]})
    vg = s["gates"]["verseGate"]["candidate"]
    if vg["faults"]:
        add("misquoted-verse", {"spans": vg["spans"], "faults": vg["faults"][:5]})
    cov = s["coverage"]
    if cov["verses"]["coverage"] < VERSE_COVERAGE_MIN or vg["spans"] == 0:
        add("missing-verse-retrieval", {"coverage": cov["verses"]["coverage"], "missing": cov["verses"]["missing"][:25]})
    if cov["movements"]["coverage"] < MOVEMENT_COVERAGE_MIN:
        add("missing-movement", {"coverage": cov["movements"]["coverage"],
                                 "missing": [m["theme"] for m in cov["movements"]["detail"] if not m["covered"]]})
    if s["structure"]["score"] < STRUCTURE_MIN:
        add("weak-structure", {"score": s["structure"]["score"], "missingFields": s["structure"]["missingFields"],
                               "countRatios": s["structure"]["countRatios"]})
    if s["bands"]["missing"]:
        add("missing-band", {"missing": s["bands"]["missing"]})
    if s["bands"]["short"]:
        add("short-band", {"short": s["bands"]["short"]})
    bad_reading = [c for c in s["reading"]["checks"] if not c["ok"] and c["check"] != "bands-in-order"]
    if bad_reading:
        add("reading-level", {"checks": bad_reading})
    if s["reading"]["inverted"]:
        add("band-order-inverted", {})
    if s["quiz"]["count"] < s["quiz"]["referenceCount"]:
        add("quiz-count", {"count": s["quiz"]["count"], "reference": s["quiz"]["referenceCount"]})
    if s["quiz"]["errors"]:
        add("quiz-errors", {"errors": s["quiz"]["errors"]})
    g = s["quiz"]["grounded"]
    if g["candidate"] < g["reference"]:
        add("quiz-ungrounded", g)
    lens = s["length"]["bands"]
    if any(x["ratio"] < LENGTH_RATIO_BAND[0] for x in lens):
        add("length-short", {"bands": [x for x in lens if x["ratio"] < LENGTH_RATIO_BAND[0]]})
    if any(x["ratio"] > LENGTH_RATIO_BAND[1] for x in lens):
        add("length-long", {"bands": [x for x in lens if x["ratio"] > LENGTH_RATIO_BAND[1]]})
    return gaps


# ---------------------------------------------------------------------------
# Cross-reference: every version against every other, and the consensus.
# ---------------------------------------------------------------------------

def _jaccard(a, b):
    a, b = set(a), set(b)
    return round(len(a & b) / len(a | b), 4) if (a | b) else 1.0


def _answer_tokens(p):
    return [set(tokens(q["answer"] or "")) for q in p["quiz"]["questions"] if q["answer"]]


def pairwise(pa, pb):
    """Deterministic agreement between two version profiles (symmetric)."""
    ma = [theme_match(m, pb["movements"])["covered"] for m in pa["movements"]]
    mb = [theme_match(m, pa["movements"])["covered"] for m in pb["movements"]]
    mv = (sum(ma) + sum(mb)) / (len(ma) + len(mb)) if (ma or mb) else 1.0
    fa = {f for f, ok in pa["fields"].items() if ok}
    fb = {f for f, ok in pb["fields"].items() if ok}
    common = set(pa["gates"]) & set(pb["gates"])
    gate_agree = (sum(1 for g in common if pa["gates"][g] == pb["gates"][g]) / len(common)) if common else None
    aa, ab = _answer_tokens(pa), _answer_tokens(pb)
    matched = 0
    used = set()
    for ta in aa:
        for j, tb in enumerate(ab):
            if j in used or not (ta | tb):
                continue
            if len(ta & tb) / len(ta | tb) >= 0.5:
                matched += 1
                used.add(j)
                break
    quiz_agree = (matched / min(len(aa), len(ab))) if aa and ab else None
    qa = set(v for q in pa["quiz"]["questions"] for v in q["verses"])
    qb = set(v for q in pb["quiz"]["questions"] for v in q["verses"])
    return {
        "verses": _jaccard(pa["cited"], pb["cited"]),
        "movements": round(mv, 4),
        "structure": _jaccard(fa, fb),
        "gates": None if gate_agree is None else round(gate_agree, 4),
        "quizAnswers": None if quiz_agree is None else round(quiz_agree, 4),
        "quizVerses": _jaccard(qa, qb),
        "verseGateBoth": pa["verseGate"]["passed"] and pb["verseGate"]["passed"],
    }


def _bucket(count, n):
    if count == n:
        return "all"
    if count * 2 > n:
        return "most"
    if count == 1:
        return "one"
    return "some"


def crossref(versions, reference_family="claude"):
    """All pairs, plus the consensus of the versions that pass the verse gate.
    versions: [{id, writer, writer_family?, model_label, body, gate_results}]."""
    profs = []
    for v in versions:
        p = profile(v)
        profs.append({"id": v.get("id"), "writer": v.get("writer"), "family": writer_family(v),
                      "model": v.get("model_label"), "p": p})
    matrix = []
    for i in range(len(profs)):
        for j in range(i + 1, len(profs)):
            matrix.append({"a": profs[i]["id"], "b": profs[j]["id"],
                           "aWriter": profs[i]["family"], "bWriter": profs[j]["family"],
                           **pairwise(profs[i]["p"], profs[j]["p"])})
    excluded = []
    eligible = []
    for x in profs:
        stored_fail = stored_verse_gate_failed(next((v.get("gate_results") for v in versions if v.get("id") == x["id"]), None))
        if not x["p"]["verseGate"]["passed"] or stored_fail:
            excluded.append({"id": x["id"], "writer": x["family"],
                             "why": "verse gate failed" + (" (stored gate)" if stored_fail else " (quoted span not the verse, or none quoted)")})
        else:
            eligible.append(x)
    n = len(eligible)
    verses = {}
    for x in eligible:
        for v in x["p"]["cited"]:
            verses.setdefault(v, []).append(x["family"])
    by = {"all": [], "most": [], "some": [], "one": []}
    for v in sorted(verses):
        by[_bucket(len(verses[v]), n)].append({"verse": v, "writers": sorted(verses[v])})
    # themes: greedy clusters by token overlap, deterministic in version order
    clusters = []
    for x in eligible:
        for m in x["p"]["movements"]:
            toks = set(tokens(m["theme"]))
            if not toks:
                continue
            hit = None
            for c in clusters:
                if len(toks & c["tokens"]) / len(toks | c["tokens"]) >= 0.34:
                    hit = c
                    break
            if hit is None:
                clusters.append({"theme": m["theme"], "tokens": set(toks), "writers": {x["family"]}})
            else:
                hit["writers"].add(x["family"])
    themes = {"all": [], "most": [], "some": [], "one": []}
    for c in clusters:
        themes[_bucket(len(c["writers"]), n) if n else "one"].append({"theme": c["theme"], "writers": sorted(c["writers"])})
    insights = ([{"kind": "verse", "item": x["verse"], "writer": x["writers"][0]} for x in by["one"]] +
                [{"kind": "theme", "item": x["theme"], "writer": x["writers"][0]} for x in themes["one"]]) if n > 1 else []
    consensus_set = set(x["verse"] for x in by["all"] + by["most"])
    ref = next((x for x in eligible if x["family"] == reference_family), None)
    ref_vs = None
    if ref is not None:
        ref_vs = {"verseJaccard": _jaccard(ref["p"]["cited"], consensus_set),
                  "consensusMissedByReference": sorted(consensus_set - ref["p"]["cited"]),
                  "referenceOutsideConsensus": sorted(ref["p"]["cited"] - consensus_set)}
    return {
        "versions": [{"id": x["id"], "writer": x["family"], "model": x["model"]} for x in profs],
        "matrix": matrix,
        "consensus": {"eligible": n, "verses": by, "themes": themes,
                      "note": "a contribution only one writer brought is a candidate insight, never an error"},
        "insights": insights,
        "excluded": excluded,
        "referenceVsConsensus": ref_vs,
        "measureVersion": MEASURE_VERSION,
    }


# ---------------------------------------------------------------------------
# Writers and promotion.
# ---------------------------------------------------------------------------
FAMILIES = ("claude", "gemini", "openai", "ollama", "openclaw", "compat")


def writer_family(version):
    """The writer family label: the builder's `family` column (DR-0669), else
    read from the writer label ('claude-cli' -> claude, 'ollama:tower' -> ollama)."""
    fam = str(version.get("writer_family") or version.get("family") or "").strip().lower()
    if fam in FAMILIES:
        return fam
    w = str(version.get("writer") or "").strip().lower()
    for f in FAMILIES:
        if w == f or w.startswith(f + "-") or w.startswith(f + ":") or w.startswith(f + "_") or w.startswith(f + " "):
            return f
    if w.startswith("anthropic"):
        return "claude"
    if w.startswith("chatgpt") or w.startswith("gpt"):
        return "openai"
    return "compat" if w else "compat"


def is_tower(family):
    """Our own towers: local models (ollama, openclaw) and any OpenAI-compatible endpoint we host."""
    return family in ("ollama", "openclaw", "compat")


# Measured choices, recorded in DR-0671 with the reasoning.
PROMOTION_THRESHOLD = float(os.environ.get("PARITY_THRESHOLD", "0.95"))
PROMOTION_N = int(os.environ.get("PARITY_N", "14"))


def promotion(outcomes, threshold=PROMOTION_THRESHOLD, n=PROMOTION_N, held=False):
    """outcomes: [{teaching, score, passed(floors), measured_at}] oldest first,
    one per teaching. A teaching counts toward the streak when score >= threshold
    AND every hard floor held. status: reference-only -> ready -> primary.
    'primary' needs the streak AND no Governor hold (agreed work starts itself;
    his hold is the brake). One miss resets the streak and drops a primary writer
    back to reference-only."""
    streak = 0
    for o in outcomes:
        ok = bool(o.get("passed")) and float(o.get("score") or 0) >= threshold
        streak = streak + 1 if ok else 0
    ready = streak >= n
    status = "primary" if ready and not held else ("ready" if ready else "reference-only")
    return {"streak": streak, "required": n, "threshold": threshold, "ready": ready, "held": bool(held),
            "status": status, "teachings": len(outcomes)}


def recurring_gaps(parity_rows, min_count=3, window=10):
    """Gap classes seen in >= min_count of a writer family's last `window`
    teachings. Returns {(family, class): {count, example}} -- example is the most
    recent row carrying the class, so the fix is proven on a stored case."""
    by_fam = {}
    for r in sorted(parity_rows, key=lambda r: str(r.get("measured_at") or "")):
        by_fam.setdefault(r.get("writer_family") or "compat", []).append(r)
    out = {}
    for fam, rows in by_fam.items():
        last = rows[-window:]
        for r in last:
            for cls in r.get("gap_classes") or []:
                k = (fam, cls)
                cur = out.setdefault(k, {"count": 0, "example": None})
                cur["count"] += 1
                cur["example"] = r
    return {k: v for k, v in out.items() if v["count"] >= min_count}


if __name__ == "__main__":
    import sys
    # --measure <file.json>: print this module's reading levels + fullness for
    # every lesson body in the file (used by the cross-language pin test).
    if len(sys.argv) >= 3 and sys.argv[1] == "--measure":
        with open(sys.argv[2], encoding="utf-8") as f:
            bodies = json.load(f)
        print(json.dumps([{"id": b.get("id"), "reading": reading_levels(b), "fullness": fullness(b),
                           "cited": sorted(cited_verses(b)), "verseGate": verse_gate(b)["passed"]} for b in bodies]))
    elif len(sys.argv) >= 3 and sys.argv[1] == "--calibrate":
        # --calibrate <file.json>: every four-band lesson against itself, and
        # each against the next (a different lesson). The numbers DR-0671 cites.
        with open(sys.argv[2], encoding="utf-8") as f:
            full = [b for b in json.load(f) if all(((b.get("levels") or {}).get(x)) for x in BAND_ORDER)]
        selfs = [compare({"body": b}, {"body": b}) for b in full]
        cross = [compare({"body": a}, {"body": b}) for a, b in zip(full, full[1:])]
        cs = sorted(r["score"] for r in cross)
        print(json.dumps({
            "lessons": len(full),
            "selfMin": min(r["score"] for r in selfs) if selfs else None,
            "selfGaps": sum(len(r["gaps"]) for r in selfs),
            "selfFloorFailures": sum(1 for r in selfs if not r["passed"]),
            "crossMedian": cs[len(cs) // 2] if cs else None,
            "crossMax": cs[-1] if cs else None,
            "crossCounted": sum(1 for r in cross if r["passed"] and r["score"] >= PROMOTION_THRESHOLD),
        }))
    else:
        print("usage: parity_core.py --measure|--calibrate <bodies.json>")

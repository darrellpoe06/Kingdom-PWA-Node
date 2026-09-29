#!/usr/bin/env python3
"""
fixes/verse_retrieval.py -- gap class `missing-verse-retrieval` (DR-0671).

The first algorithmic fix of the tower parity loop, and the worked example of
the fix interface every later fix follows (see fixes/__init__.py).

THE GAP. A local model asked to teach from the Word names fewer of the verses
the reference names: it has no concordance in its head, only what its weights
recall. Claude brings the verses; the tower forgets them.

THE FIX (deterministic, no model): before the tower writes, retrieve the
verses from our own corpus and hand them to it in the prompt.
  1. explicit -- every reference the teaching itself names (Darrell often
     names the verse he is teaching from);
  2. neighbors -- for each explicit verse, its cross-references from
     app/public/bible/xref, strongest votes first;
  3. keywords -- TF-IDF over every KJV verse for the teaching's own content
     words, highest score first.
Every candidate carries its reason and score, ties broken by canonical order,
so the same teaching always yields the same list.

Proven by test_lesson_parity.py: on the stored example the verse coverage of
the reference is re-measured before (the tower's own citations) and after
(the tower's citations plus the verses this pass puts in the prompt).
"""
import json
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
import parity_core as pc  # noqa: E402

GAP_CLASS = "missing-verse-retrieval"
STAGE = "pre"  # runs before the tower writes: it changes the prompt, not the output

XREF_DIR = os.environ.get("XREF_DIR", os.path.join(pc.REPO, "app", "public", "bible", "xref"))

_index = None


def _all_verses():
    with open(os.path.join(pc.KJV_DIR, "index.json"), encoding="utf-8") as f:
        books = json.load(f)
    for b in books:
        with open(os.path.join(pc.KJV_DIR, b["file"] + ".json"), encoding="utf-8") as f:
            chapters = json.load(f).get("chapters") or []
        for ci, chap in enumerate(chapters):
            for vi, text in enumerate(chap):
                yield "%s %d:%d" % (b["name"], ci + 1, vi + 1), text


def index():
    """{df, n, docs: [(key, {token: tf})]} built once per process."""
    global _index
    if _index is None:
        docs = []
        df = {}
        for key, text in _all_verses():
            tf = {}
            for t in pc.tokens(text):
                tf[t] = tf.get(t, 0) + 1
            docs.append((key, tf))
            for t in tf:
                df[t] = df.get(t, 0) + 1
        _index = {"df": df, "n": len(docs), "docs": docs}
    return _index


def keyword_hits(text, k=24):
    ix = index()
    q = {}
    for t in pc.tokens(text):
        q[t] = q.get(t, 0) + 1
    # Words that are everywhere in the Bible say nothing about this teaching.
    idf = {t: math.log(ix["n"] / (1 + ix["df"].get(t, 0))) for t in q if ix["df"].get(t)}
    scored = []
    for key, tf in ix["docs"]:
        s = 0.0
        for t, w in idf.items():
            if t in tf:
                s += w * q[t] * (1 + math.log(tf[t]))
        if s > 0:
            scored.append((-round(s, 6), key))
    scored.sort()
    return [(key, -neg) for neg, key in scored[:k]]


def xref_neighbors(verse_key, k=6):
    book, cv = verse_key.rsplit(" ", 1)
    fk = pc.book_file(book)
    if not fk:
        return []
    try:
        with open(os.path.join(XREF_DIR, fk + ".json"), encoding="utf-8") as f:
            refs = (json.load(f).get("refs") or {}).get(cv) or []
    except (OSError, ValueError):
        return []
    out = []
    for ref, votes in sorted(refs, key=lambda r: (-r[1], r[0]))[:k]:
        for v in pc.refs_in(ref)[:3]:  # a long range contributes its first verses only
            out.append((v, votes))
    return out


def retrieve(teaching, k_keywords=24, k_xref=6):
    """Ranked candidate verses for a teaching: [{verse, reason, score, text}]."""
    seen = {}
    for v in pc.refs_in(teaching):
        seen.setdefault(v, {"verse": v, "reason": "explicit", "score": 1e6})
    for v in list(seen):
        for n, votes in xref_neighbors(v, k_xref):
            seen.setdefault(n, {"verse": n, "reason": "xref:" + v, "score": float(votes)})
    for v, s in keyword_hits(teaching, k_keywords):
        seen.setdefault(v, {"verse": v, "reason": "keyword", "score": s})
    ranked = sorted(seen.values(), key=lambda x: (-x["score"], x["verse"]))
    for x in ranked:
        book, cv = x["verse"].rsplit(" ", 1)
        ch, vs = cv.split(":")
        x["text"] = pc.verse_text(book, ch, vs)
    return ranked


def apply(ctx):
    """The fix interface. ctx = {teaching, prompt, ...}. Returns a new ctx whose
    prompt carries the retrieved verses verbatim, and `supplied`, the verse keys."""
    found = retrieve(ctx.get("teaching") or "")
    lines = ['%s -- "%s"' % (x["verse"], x["text"]) for x in found if x["text"]]
    block = ("\n\nVERSES FROM THE KJV CORPUS FOR THIS TEACHING (quote only these words, verbatim, "
             "with the reference in parentheses):\n" + "\n".join(lines)) if lines else ""
    out = dict(ctx)
    out["prompt"] = (ctx.get("prompt") or "") + block
    out["supplied"] = [x["verse"] for x in found]
    return out


if __name__ == "__main__":
    text = sys.stdin.read()
    print(json.dumps(retrieve(text), indent=1))

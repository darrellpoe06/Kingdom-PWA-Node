#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =============================================================================
# worship-song-harvest.py -- the MISSING producer for the "Worship songs" harvest
# =============================================================================
# Root cause it fixes: the coverage ledger's "Worship songs" row read 0 of 135
# because NOTHING ever produced choir_songs. Message / Events-as-data auto-derive
# from each choir_sermons row (135 -> 135 each); songs only light when real
# choir_songs rows exist, and no extractor wrote them. transcript-harvest.js mines
# lessons/discernment/testimony/trivia but has no song extractor.
#
# What this does (deterministic-first, NO n8n, sovereign -- runs on the NAS):
#   For every church instance that has ingested services + real transcripts, it
#   reads video_transcripts, extracts the worship/choir songs it can honestly make
#   out, and writes them to choir_songs where the Choir tab + coverage ledger read.
#
# HONESTY (DR-0076 verification doctrine + Darrell 2026-07-02):
#   ASR mangles sung lyrics ([music] is mid-sentence noise; opening songs are lost),
#   so pure lyric-scraping is unreliable. The reliable signal is DISTINCTIVE spoken
#   references: a song's unique lyric hook, or an explicit "song ... by <artist>"
#   announcement. Every emitted row is GROUNDED in a verbatim evidence phrase that
#   literally appears in the transcript -- never invented. Every row is a clearly
#   marked DRAFT (source='harvest-transcript', confidence='low', needs_review=true,
#   and an "[auto-draft:v1]" tag in notes)
#   so the choir team CORRECTS from the parse instead of starting from a blank card.
#   Empty is worse than a marked rough guess; a confident fabrication is worse than
#   empty. We do neither: grounded drafts, honestly flagged.
#
# LEARNING LOOP (noted, not built here -- Darrell 2026-07-02): every human edit to
#   a draft is training signal. Drafts carry the machine tag "[auto-draft:v1]" in
#   notes; a later job can diff the original auto-title vs the human-corrected title
#   to fine-tune the CUDA-box title model. That capture hook is intentionally left
#   for the GPU lane; this script only produces the corrigible starting point.
#
# COMPUTE SPLIT (Darrell 2026-07-02): the local NAS CPU LLM (hermes3:8b ~42s,
#   qwen2.5:14b ~52s) is too slow AND failed to name a clean gospel snippet, so it
#   is NOT used in this batch. LLM title-ID / recall enrichment moves to the church
#   CUDA boxes later; this deterministic pass ships now and needs no GPU.
#
# Multi-tenant: scoped per instance_id (no COLG hardcode) -- processes whatever
#   instances have a corpus. Idempotent: a service's existing auto-drafts are left
#   alone (re-running never duplicates).
#
# Usage (on the NAS):
#   python3 worship-song-harvest.py            # dry-run: report only, write nothing
#   python3 worship-song-harvest.py --write    # insert the draft rows
#   python3 worship-song-harvest.py --write --instance <uuid>   # one instance only
# =============================================================================
import json
import os
import re
import sys
import argparse
import time
import urllib.request
import urllib.parse

SECRET_PATH = "/volume1/PoeTech/secrets/supabase.json"

# --- distinctive, song-UNIQUE lyric hooks (deliberately NOT bare scripture -------
# phrases a preacher quotes, e.g. "wait on the Lord" / "the goodness of God"). Each
# hook is a multi-word line strongly identified with ONE song. General worship /
# Black-gospel canon -- channel-agnostic, not COLG-specific.
REPERTOIRE = {
    "Way Maker": ["way maker miracle worker", "promise keeper light in the darkness"],
    "My Worship (Bishawn Mitchell)": ["my worship is for real", "you don t know my story"],
    "Total Praise": ["you are the source of my strength you are the strength of my life"],
    "Never Would Have Made It": ["never would have made it"],
    "I Need You To Survive": ["i need you you need me", "i need you to survive", "i pray for you you pray for me"],
    "Break Every Chain": ["break every chain break every chain", "power in the name of jesus to break every chain"],
    "Goodness of God": ["all my life you have been faithful", "you have been so so good to me", "you have been so good to me and all my life"],
    "Great Is Thy Faithfulness": ["morning by morning new mercies i see"],
    "The Blood Will Never Lose Its Power": ["the blood will never lose its power", "it reaches to the highest mountain and it flows"],
    "Every Praise": ["every praise is to our god"],
    "We Fall Down": ["we fall down we get up", "a saint is just a sinner who fell down"],
    "Take Me To The King": ["take me to the king i don t have much to bring"],
    "For Every Mountain": ["for every mountain you have brought me over", "for every mountain you brought me over"],
    "You Deserve It (JJ Hairston)": ["you deserve it you deserve it all the glory"],
    "Awesome (Charles Jenkins)": ["my god is awesome he can move mountains"],
    "Grateful": ["i m grateful i m so grateful"],
    "It's Working (William Murphy)": ["it s working it s working"],
    "Nobody Greater": ["nobody greater nobody greater"],
    "I Won't Complain": ["i ve had some good days i ve had some hills to climb"],
    "How Great Is Our God": ["how great is our god sing with me"],
}

# artist-attribution announcement: "...song ... by <First Last>". Captures a real
# song reference even when we can't name the title -- a grounded draft the team names.
ANN_ARTIST = re.compile(r"song[^.]{0,60}\bby ([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)")


def norm(s):
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9 ]", " ", s.lower())).strip()


def evidence_window(raw, hook_norm):
    """Return a ~verbatim snippet around the hook's first occurrence in raw text,
    or None if the hook doesn't actually appear (anti-fabrication check)."""
    pat = re.compile(r"[^a-z0-9]+".join(re.escape(w) for w in hook_norm.split()), re.I)
    m = pat.search(raw)
    if not m:
        return None
    snip = raw[max(0, m.start() - 45): m.end() + 45]
    return re.sub(r"\s+", " ", snip).strip()


def extract_songs(raw_text):
    """Deterministic best-effort. Returns a list of draft dicts:
    { title, soloist, confidence, evidence }. Only grounded rows -- each carries a
    verbatim evidence phrase that appears in raw_text."""
    nt = norm(raw_text)
    out = []
    seen = set()

    # 1) distinctive named-song hooks
    for title, hooks in REPERTOIRE.items():
        hits = 0
        evidence = None
        for h in hooks:
            hn = norm(h)
            c = nt.count(hn)
            if c:
                hits += c
                if not evidence:
                    evidence = evidence_window(raw_text, hn)
        if hits and evidence:  # require a real, locatable evidence window
            key = norm(title)
            if key in seen:
                continue
            seen.add(key)
            # repeated distinctive hook -> a bit more trustworthy, but still a draft.
            out.append({"title": title, "soloist": None,
                        "confidence": "low", "evidence": evidence})

    # 2) artist-attribution announcements without a named title
    named_blob = norm(" ".join(d["title"] + " " + d["evidence"] for d in out))
    for m in ANN_ARTIST.finditer(raw_text):
        artist = m.group(1).strip()
        # skip obvious non-artist captures
        if artist.lower() in ("the", "a", "an", "him", "her", "god", "jesus", "us"):
            continue
        # skip if this artist is already covered by a named song (avoid a dup row
        # for the same reference, e.g. "My Worship" + "Song led by <that artist>")
        if norm(artist) in named_blob:
            continue
        title = "Song led by %s (title to confirm)" % artist
        key = norm(title)
        if key in seen:
            continue
        seen.add(key)
        snip = re.sub(r"\s+", " ", m.group(0)).strip()[:110]
        out.append({"title": title, "soloist": artist,
                    "confidence": "low", "evidence": snip})
    return out


# --- Supabase REST (PostgREST) via service role, read from the NAS secret --------
def load_creds():
    # DR-0442: the writers follow the repoint record (env -> sovereign door ->
    # this secrets file). Same (url, key) shape as before.
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "nas-supabase"))
    from sovereign_target import load_target
    url, key = load_target(SECRET_PATH)
    if not (url and key):
        raise SystemExit("no Supabase credentials (env, sovereign .env, or %s)" % SECRET_PATH)
    return url, key


def rest_get(base, key, path, params):
    q = urllib.parse.urlencode(params)
    req = urllib.request.Request(base + "/rest/v1/" + path + "?" + q)
    req.add_header("apikey", key)
    req.add_header("Authorization", "Bearer " + key)
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read().decode("utf-8"))


def rest_insert(base, key, path, rows):
    body = json.dumps(rows).encode("utf-8")
    req = urllib.request.Request(base + "/rest/v1/" + path, data=body, method="POST")
    req.add_header("apikey", key)
    req.add_header("Authorization", "Bearer " + key)
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=minimal")
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.status


def budget_spent(started, chunk, time_budget, seen):
    """Pure. Has this cycle spent its budget? (DR-1065)

    Deliberately checked BEFORE starting a service rather than after finishing
    one: a run that starts a service it cannot finish inside the runner's
    timeout gets killed mid-insert, and a killed insert is the one way this
    idempotent script could do harm. `0` means no cap, which is the by-hand
    default -- so adding the brake did not change how a steward runs it.
    """
    if chunk and seen >= chunk:
        return True
    if time_budget and (time.time() - started) >= time_budget:
        return True
    return False


def selftest():
    """CI merge gate. Pure logic only -- no network, no database, no secrets."""
    checks = []

    def ok(name, cond):
        checks.append((name, bool(cond)))

    # The budget is a real brake, and 0 really means "no cap" so the by-hand
    # invocation this script has always had behaves exactly as it did.
    now = time.time()
    ok("no cap by default", not budget_spent(now, 0, 0, 10 ** 6))
    ok("chunk stops at the chunk", budget_spent(now, 5, 0, 5))
    ok("chunk does not stop early", not budget_spent(now, 5, 0, 4))
    ok("time budget stops when spent", budget_spent(now - 300, 0, 240, 0))
    ok("time budget does not stop early", not budget_spent(now, 0, 240, 0))
    ok("either brake alone is enough", budget_spent(now - 300, 5, 240, 0) and budget_spent(now, 5, 240, 5))

    # The extractor must stay grounded: every draft carries a verbatim phrase
    # that really appears in the text it was given. A song invented from nothing
    # is the failure this whole file was written to avoid.
    heard = ("and then the choir sang way maker miracle worker promise keeper "
             "light in the darkness my god that is who you are")
    drafts = extract_songs(heard)
    ok("a distinctive hook is heard", any(d["title"] == "Way Maker" for d in drafts))
    ok("every draft is grounded in the text",
       all(norm(d["evidence"]) in norm(heard) for d in drafts))
    ok("silence yields nothing", extract_songs("") == [])
    ok("ordinary preaching yields nothing",
       extract_songs("turn with me to the book of romans chapter eight verse one") == [])

    bad = [n for n, c in checks if not c]
    for n, c in checks:
        print("%s %s" % ("ok  " if c else "FAIL", n))
    print("worship-song-harvest selftest: %d/%d" % (len(checks) - len(bad), len(checks)))
    return 1 if bad else 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true", help="insert rows (default: dry-run)")
    ap.add_argument("--instance", default=None, help="limit to one instance_id")
    # DR-1065 -- THE BUDGET BRAKE. Until this rode a clock it was run by hand and
    # could take as long as it liked. On the services-sync clock it is a
    # deterministic loop, and a deterministic loop carries a budget and a lock
    # (DR-0248); the lock and the outer timeout live in the nas-loops runner, so
    # these two are this script's half. Newest services first, so each new Sunday
    # is harvested on the first cycle after its row exists and the backlog drains
    # behind it.
    ap.add_argument("--chunk", type=int, default=0,
                    help="at most N services with a transcript per run (0 = no cap, the by-hand default)")
    ap.add_argument("--time-budget", type=int, default=0, dest="time_budget",
                    help="stop starting new services after N seconds (0 = no cap)")
    ap.add_argument("--selftest", action="store_true", help="pure-logic gate (CI)")
    args = ap.parse_args()
    if args.selftest:
        return selftest()

    base, key = load_creds()

    # discover instances that have ingested sermons (multi-tenant, no hardcode)
    serms = rest_get(base, key, "choir_sermons",
                     {"select": "instance_id,video_id,service_date,service_type,title,youtube_url",
                      "video_id": "not.is.null", "order": "service_date.desc"})
    instances = {}
    for s in serms:
        instances.setdefault(s["instance_id"], []).append(s)
    if args.instance:
        instances = {k: v for k, v in instances.items() if k == args.instance}

    grand_rows = 0
    grand_services = 0
    started = time.time()
    for inst, isms in instances.items():
        trs = rest_get(base, key, "video_transcripts",
                       {"select": "video_id,text", "instance_id": "eq." + inst})
        tmap = {t["video_id"]: t.get("text", "") for t in trs if (t.get("text") or "").strip()}

        # existing auto-drafts, so re-runs never duplicate (idempotent per video)
        existing = rest_get(base, key, "choir_songs",
                            {"select": "video_id,title,source",
                             "instance_id": "eq." + inst,
                             "source": "eq.harvest-transcript"})
        have = set((e.get("video_id"), norm(e.get("title", ""))) for e in existing)

        new_rows = []
        svc_hit = 0
        svc_seen = 0
        print("\n=== instance %s : %d services, %d with transcript ==="
              % (inst, len(isms), len(tmap)))
        for s in isms:
            if budget_spent(started, args.chunk, args.time_budget, svc_seen):
                print("  -> budget reached; the rest drain on the next cycle")
                break
            vid = s.get("video_id")
            raw = tmap.get(vid, "")
            if not raw:
                continue
            svc_seen += 1
            drafts = extract_songs(raw)
            if not drafts:
                continue
            svc_hit += 1
            print("  %s %-9s %s" % (s["service_date"], s["service_type"], vid))
            for i, dft in enumerate(drafts):
                dedupe_key = (vid, norm(dft["title"]))
                if dedupe_key in have:
                    print("      (skip, already drafted) %s" % dft["title"])
                    continue
                have.add(dedupe_key)
                note = ("[auto-draft:v1] Auto-drafted from the service transcript by "
                        "the worship-song harvester -- please verify or correct the "
                        "title. Heard in the recording: \"%s\"" % dft["evidence"])
                row = {
                    "instance_id": inst,
                    "title": dft["title"],
                    "service_date": s["service_date"],
                    "service_type": s.get("service_type") or "sunday",
                    "youtube_url": s.get("youtube_url"),
                    "video_id": vid,
                    "source_video_id": vid,
                    "source": "harvest-transcript",
                    "confidence": dft["confidence"],
                    "needs_review": True,
                    "soloist": dft["soloist"],
                    "notes": note,
                    "status": "active",
                    "sort_order": i,
                    "created_by": None,
                }
                new_rows.append(row)
                print("      + DRAFT: %s   ev: %s" % (dft["title"], dft["evidence"][:70]))

        grand_rows += len(new_rows)
        grand_services += svc_hit
        if new_rows and args.write:
            # insert in one batch per instance
            status = rest_insert(base, key, "choir_songs", new_rows)
            print("  -> inserted %d draft rows (HTTP %s)" % (len(new_rows), status))
        elif new_rows:
            print("  -> DRY-RUN: %d draft rows would be inserted (use --write)" % len(new_rows))

    print("\n===================================================")
    print("TOTAL: %d draft song rows across %d services%s"
          % (grand_rows, grand_services, "" if args.write else " (dry-run)"))
    print("===================================================")


if __name__ == "__main__":
    # DR-1065. main() RETURNS the selftest's exit code, and this line used to
    # discard it -- so --selftest printed "FAIL" and exited 0. Wired into CI
    # unchanged, that is a merge gate that can never fail, which is worse than
    # no gate because it reads green (DR-0076 s3). Found by running the two
    # mutations rather than by reading the file.
    sys.exit(main() or 0)

#!/usr/bin/env python3
# =============================================================================
# bg-message-lessons.py -- every message Bishop Gwin preaches becomes a lesson (DR-1433)
# =============================================================================
# Darrell 2026-11-12, in substance: lessons should be made from BG's latest
# messages, especially on Wednesdays but Sundays too; go back through the old
# ones and make sure the new ones are caught; he has been teaching the history
# of the church here in Champaign, and he sprinkles it into each weekly message;
# and find or create a better way.
#
# WHY A NEW ROAD. The old road reached INTO this machine: a GitHub runner joined
# the tailnet to fetch a transcript (source-transcript-nas.yml), and a session
# wrote the lesson by hand. The runner's key expired 2026-11-04 and again by
# 2026-11-10 ("invalid key: API key does not exist"), so no new message could
# reach a session at all. Measured the same day: of Bishop Gwin's 16 messages
# since 2026-08-01, 2 had a lesson. DR-1360 already set the direction: the NAS
# starts every road. So the NAS does it here, with nothing outside it alive:
#
#   1. reads the church's archive (choir_sermons) for messages whose recorded
#      speaker is Bishop Gwin, since `since` in bg-message-lessons.json;
#   2. skips one that already has a lesson (`done`) or was already sent (its
#      own agent_inbox row, tagged bg-message:<video id>);
#   3. for each that has its words (video_transcripts, filed here by the
#      transcript-trickle), files ONE agent_inbox row tagged `lesson`, which
#      rings the lesson builder on this same machine (migration 0243's
#      trigger). The builder writes the lesson, pushes it with the NAS's own
#      GitHub token and opens its pull request. No tailnet, no runner.
#
# It rides the ALREADY-ARMED services-sync clock (bg-message-lessons-install.sh,
# run once per cycle). Wednesdays first, then the newest. A message with no transcript yet is
# counted as waiting for its words and tried again next cycle.
#
# WHAT THE ROW TELLS THE WRITER (lesson_writer.row_rules, tag `bg-message`):
# this is Bishop Gwin's own message, named as such by the archive and the
# channel; call him Bishop Gwin or BG; gather every piece of the church's
# history he tells, as he tells it, under FROM THE HOUSE'S HISTORY; never add
# what he did not say.
#
# BRAKES (DR-0248): BUDGET -- at most `per_cycle` rows a cycle (default 4), so a
# backfill paces into the builder over a few cycles instead of landing at once;
# four reads, no retry loop. LOCK -- a message is sent once: its own row is the
# record, checked before every send. STOP -- `enabled: false` in services.json;
# no credential is a named quiet no-op. The ledger (last-run.json) says what
# each cycle did, so "ran and sent nothing" is told from "never ran".
#
# NOT YET PROVEN (P66): this counts as working when its first row is seen
# building. The session that wrote it cannot watch it run, for the same expired
# key that is the reason it exists.
# =============================================================================
import json
import os
import sys
import urllib.parse
import urllib.request

# timezone.utc, not datetime.UTC: the NAS runs Python 3.8.15 (DR-0306) and
# datetime.UTC exists only from 3.11. The 3.8 import guard in CI holds this.
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
CONFIG = os.path.join(HERE, "bg-message-lessons.json")
TAG = "bg-message"
DEFAULT_SECRETS = "/volume1/PoeTech/secrets/supabase.json"
DEFAULT_HOME = "/volume1/PoeTech/bg-message-lessons"
# Darrell's own sign-in, as lesson-queue-census files its row: the lesson shows
# in his "Your lessons" receipt. The writer is told by the bg-message tag that
# the words are Bishop Gwin's, never Darrell's.
DEFAULT_CREATED_BY = "c2a6c39a-ae99-4ff7-83c6-b927e2e7f1cc"
SPEAKER_TAG = "voice:BG"


def load_config(path=CONFIG):
    with open(path, encoding="utf-8") as fh:
        cfg = json.load(fh)
    return {
        "since": str(cfg.get("since") or "2026-08-01"),
        "speaker_match": [str(s) for s in (cfg.get("speaker_match") or ["Gwin"])],
        "per_cycle": max(1, int(cfg.get("per_cycle") or 4)),
        "done": dict(cfg.get("done") or {}),
    }


def is_bg(message, speaker_match):
    """The archive names Bishop Gwin as the speaker. A message with no speaker is
    never assumed to be his (DR-0719: never assume who taught)."""
    who = str(message.get("speaker") or "")
    return any(m.lower() in who.lower() for m in speaker_match)


def sent_ids(rows):
    """Video ids already sent, read from the rows' own bg-message:<id> tags."""
    out = set()
    for r in rows or []:
        for t in r.get("tags") or []:
            t = str(t)
            if t.startswith(TAG + ":"):
                out.add(t[len(TAG) + 1 :])
    return out


MIRROR_PER_CYCLE = 6
TRANSCRIPT_SOURCES = ("youtube-asr", "whisper-nas", "manual", "rss-feed", "rss-whisper")


def mirror_rows(transcripts, hosted_have, hosted_instance, limit=MIRROR_PER_CYCLE):
    """Pure. Bishop Gwin's transcripts the hosted copy lacks, as rows to insert
    there (DR-1543): the words a cloud session can read with no tailnet key, so a
    lesson waits on nobody's hand. Only transcripts with words; at most `limit`."""
    rows = []
    for t in transcripts or []:
        vid = t.get("video_id")
        text = str(t.get("text") or "").strip()
        if (
            not vid
            or vid in hosted_have
            or not text
            or (t.get("words") or 0) <= 0
            or t.get("error")
        ):
            continue
        rows.append(
            {
                "instance_id": hosted_instance,
                "video_id": vid,
                "text": text,
                "words": int(t.get("words") or 0),
                # The table allows five sources (a CHECK); the copy keeps the
                # original's, so a refused insert can never come from a new word.
                "source": t.get("source")
                if t.get("source") in TRANSCRIPT_SOURCES
                else "youtube-asr",
                "lang": t.get("lang") or "en",
            }
        )
        if len(rows) >= limit:
            break
    return rows


def hosted_target(secrets_path):
    """(url, key) of the hosted project from the secrets file, or (None, None)."""
    try:
        with open(secrets_path, encoding="utf-8") as fh:
            d = json.load(fh)
    except (OSError, ValueError):
        return None, None
    url = str(d.get("url") or "").rstrip("/")
    key = d.get("service_key") or d.get("service_role_key")
    return (url, key) if url and key else (None, None)


def plan(messages, transcripts, sent, cfg):
    """Pure. -> (to_send, waiting, skipped). Wednesdays first, then newest.
    to_send holds (message, transcript) pairs, at most cfg['per_cycle']."""
    words = {}
    for t in transcripts or []:
        vid = t.get("video_id")
        if (
            vid
            and (t.get("words") or 0) > 0
            and str(t.get("text") or "").strip()
            and not t.get("error")
        ):
            words[vid] = t
    ready, waiting, skipped = [], [], []
    seen = set()
    for m in messages or []:
        vid = m.get("video_id")
        if not vid or vid in seen:
            continue
        seen.add(vid)
        if (
            not is_bg(m, cfg["speaker_match"])
            or str(m.get("service_date") or "") < cfg["since"]
        ):
            continue
        if vid in cfg["done"] or vid in sent:
            skipped.append(vid)
        elif vid in words:
            ready.append((m, words[vid]))
        else:
            waiting.append(m)
    # Two stable sorts: newest first, then Wednesdays ahead of Sundays.
    ready.sort(key=lambda p: str(p[0].get("service_date") or ""), reverse=True)
    ready.sort(key=lambda p: p[0].get("service_type") != "wednesday")
    return ready[: cfg["per_cycle"]], waiting, skipped


def service_name(message):
    return (
        "Wednesday Bible Study"
        if message.get("service_type") == "wednesday"
        else "Sunday message"
    )


def row_for(message, transcript, instance_id, created_by):
    """The agent_inbox row that rings the lesson builder."""
    vid = message["video_id"]
    date = str(message.get("service_date") or "")
    head = (
        "Bishop Lloyd E. Gwin -- {title} -- {when}, {date}, The Church of the Living God, Champaign, Illinois.\n"
        "Recording: https://www.youtube.com/watch?v={vid} (the church's channel names him as the speaker).\n"
        "Speakers: not marked. The words below are the recording's captions.\n\n"
    ).format(
        title=str(message.get("title") or "").strip(),
        when=service_name(message),
        date=date,
        vid=vid,
    )
    tags = [
        "lesson",
        TAG,
        f"{TAG}:{vid}",
        SPEAKER_TAG,
        "church-session-public",
        "service-date:" + date,
        "service-type:" + str(message.get("service_type") or ""),
    ]
    return {
        "instance_id": instance_id,
        "body": head + str(transcript.get("text") or "").strip(),
        "tags": tags,
        "source": "bg-message-lessons",
        "created_by": created_by,
    }


def rest(url, key, method, path, body=None, prefer=None):
    headers = {
        "apikey": key,
        "Authorization": "Bearer " + key,
        "Content-Type": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(
        url + "/rest/v1/" + path, data=data, headers=headers, method=method
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        raw = resp.read().decode("utf-8", "ignore")
    return json.loads(raw) if raw.strip() else None


def write_ledger(home, entry):
    try:
        os.makedirs(home, exist_ok=True)
        entry = dict(entry)
        entry.setdefault(
            "at", datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        )
        tmp = os.path.join(home, "last-run.json.tmp")
        with open(tmp, "w", encoding="utf-8") as fh:
            json.dump(entry, fh)
        os.replace(tmp, os.path.join(home, "last-run.json"))
        return True
    except (OSError, ValueError):
        return False


def mirror_to_hosted(sovereign_url, transcripts):
    """Copy his transcripts the hosted project lacks (DR-1543). Returns what was
    done, in words, for the ledger. A failure here never stops the lesson road."""
    hurl, hkey = hosted_target(os.environ.get("SUPABASE_SECRETS", DEFAULT_SECRETS))
    if not hurl or not hkey:
        return "no hosted credential"
    if hurl == (sovereign_url or "").rstrip("/"):
        return "the target is the hosted project already"
    try:
        slug = os.environ.get("TRANSCRIPTS_SLUG", "colg")
        inst = rest(
            hurl, hkey, "GET", "instances?select=id&slug=eq." + urllib.parse.quote(slug)
        )
        if not inst:
            return "no hosted instance " + slug
        vids = sorted(
            {t.get("video_id") for t in transcripts or [] if t.get("video_id")}
        )
        if not vids:
            return "0"
        have = (
            rest(
                hurl,
                hkey,
                "GET",
                "video_transcripts?select=video_id&instance_id=eq."
                + inst[0]["id"]
                + "&video_id=in.("
                + ",".join(urllib.parse.quote(v) for v in vids)
                + ")",
            )
            or []
        )
        rows = mirror_rows(
            transcripts, {r.get("video_id") for r in have}, inst[0]["id"]
        )
        if rows:
            rest(
                hurl,
                hkey,
                "POST",
                "video_transcripts?on_conflict=instance_id,video_id",
                body=rows,
                prefer="resolution=merge-duplicates,return=minimal",
            )
        return str(len(rows))
    except (OSError, ValueError, KeyError, IndexError) as e:
        return f"failed: {e.__class__.__name__}"


def main():
    home = os.environ.get("BG_LESSONS_HOME", DEFAULT_HOME)
    sys.path.insert(0, os.path.join(HERE, "..", "nas-supabase"))
    try:
        from sovereign_target import load_target

        url, key = load_target(
            os.environ.get("SUPABASE_SECRETS", DEFAULT_SECRETS), quiet=True
        )
    except (ImportError, OSError, ValueError, KeyError) as e:
        url = key = None
        why = e.__class__.__name__
    else:
        why = "empty target"
    if not url or not key:
        write_ledger(home, {"what": "no-credential", "error": why})
        print(f"bg-message-lessons: no credential ({why}) - quiet no-op")
        return 0
    try:
        cfg = load_config()
        slug = os.environ.get("TRANSCRIPTS_SLUG", "colg")
        inst = rest(
            url, key, "GET", "instances?select=id&slug=eq." + urllib.parse.quote(slug)
        )
        if not inst:
            write_ledger(
                home, {"what": "no-instance", "error": "no instance with slug " + slug}
            )
            print("bg-message-lessons: no instance with slug " + slug)
            return 1
        instance_id = inst[0]["id"]
        messages = (
            rest(
                url,
                key,
                "GET",
                "choir_sermons?select=video_id,title,speaker,service_date,service_type"
                "&status=neq.draft&video_id=not.is.null&service_date=gte."
                + urllib.parse.quote(cfg["since"])
                + "&order=service_date.desc",
            )
            or []
        )
        mine = [m for m in messages if is_bg(m, cfg["speaker_match"])]
        sent = sent_ids(
            rest(
                url,
                key,
                "GET",
                "agent_inbox?select=tags&tags=cs."
                + urllib.parse.quote(json.dumps([TAG])),
            )
        )
        # Every message of his without a built lesson, sent or not: the words
        # are mirrored for the cloud even when the NAS builder has the row.
        vids = sorted({m["video_id"] for m in mine if m["video_id"] not in cfg["done"]})
        transcripts = []
        if vids:
            transcripts = (
                rest(
                    url,
                    key,
                    "GET",
                    "video_transcripts?select=video_id,text,words,error,lang,source&video_id=in.("
                    + ",".join(urllib.parse.quote(v) for v in vids)
                    + ")",
                )
                or []
            )
        to_send, waiting, skipped = plan(mine, transcripts, sent, cfg)
        created_by = os.environ.get("BG_LESSONS_CREATED_BY", DEFAULT_CREATED_BY)
        for m, t in to_send:
            rest(
                url,
                key,
                "POST",
                "agent_inbox",
                body=[row_for(m, t, instance_id, created_by)],
                prefer="return=minimal",
            )
        mirrored = mirror_to_hosted(url, transcripts)
    except (OSError, ValueError, KeyError, IndexError) as e:
        write_ledger(
            home,
            {"what": "error", "error": f"{e.__class__.__name__}: {e}"[:300]},
        )
        print(f"bg-message-lessons: error {e.__class__.__name__}: {e}")
        return 1
    entry = {
        "what": "sent" if to_send else "nothing-new",
        "sent": [
            {
                "video_id": m["video_id"],
                "date": m.get("service_date"),
                "title": m.get("title"),
            }
            for m, _ in to_send
        ],
        "waiting_for_words": [
            {"video_id": m["video_id"], "date": m.get("service_date")} for m in waiting
        ],
        "already_have_a_lesson": len(skipped),
        "mirrored_to_hosted": mirrored,
        "since": cfg["since"],
    }
    write_ledger(home, entry)
    print(
        "bg-message-lessons: {} -- sent {}, waiting for words {}, already done {}".format(
            entry["what"], len(to_send), len(waiting), len(skipped)
        )
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())

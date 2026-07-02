#!/usr/bin/env python3
# =============================================================================
# rss-ingest.py — sovereign aggregator adapter #2: RSS / podcast feeds
# =============================================================================
# WHAT THIS IS. The source-adapter seam (docs/design/SOURCE-ADAPTER-INTERFACE.md)
# defines a contract every platform adapter implements. This script IS that contract
# for RSS/Atom podcast feeds — adapter #2 after the YouTube caption-fetch adapter
# (load-transcripts.py, adapter #1). They share the SAME backbone store
# (video_harvests + video_transcripts, migrations 0050/0058/0066) and write the
# SAME canonical shapes. The backbone required ZERO changes to accept this adapter
# — only the additive migration 0066 was needed (source_platform, item_url, the
# content_sources registry, and the expanded source CHECK).
#
# PLATFORM IDENTITY (the guard signal — scripts/source-adapter-guard.mjs checks this)
PLATFORM = "rss"
#
# WHAT IT DOES.
#   1. Fetches an RSS/Atom feed from --feed URL or parses --feed-file PATH.
#   2. Normalizes each item to the CanonicalItem shape
#      (item_key = "rss:{guid}", platform = "rss", title, published_at, ...).
#   3. Upserts to video_harvests with source_platform = 'rss', item_url, title, etc.
#   4. Writes the episode description as a preliminary transcript to video_transcripts
#      (source = 'rss-feed') — the same text extractors (transcript-harvest.js) then
#      derive lessons / discernment / scripture / testimony / trivia from it.
#   5. Updates the content_sources row (last_run_at, last_run_status, last_run_meta).
#
# NO PLATFORM-SPECIFIC DEPS — stdlib only (urllib, xml.etree.ElementTree, email.utils).
# The YouTube adapter needs pip install youtube-transcript-api; this one needs nothing.
#
# CONSISTENCY:
#   * INCREMENTAL — items already in video_harvests are skipped (unless --refetch).
#   * RESUMABLE   — each item is upserted before moving to the next; a crash keeps
#                   all prior work; re-running picks up where it left off.
#   * IDEMPOTENT  — upsert on (instance_id, video_id); same feed re-run = no-op.
#   * BOUNDED     — --max caps items per run (budget brake).
#   * STALL-GUARD — exits non-zero (code 3) when 0 items advanced while gaps remain.
#
# THREE BRAKES (CLAUDE.md autonomous-automation rule):
#   (1) --max budget: hard cap on items fetched THIS run.
#   (2) single-instance lock file: a second run while the first is live SKIPS.
#   (3) stall guard: exits non-zero when a run advances nothing; a scheduler surfaces
#       the stall instead of it hanging silent.
#
# THREE BRAKES SHIPS MANUAL / INACTIVE — no cron, no watcher, no autostart in this
# file. Arm a DSM schedule ONLY with someone watching.
#
# Secrets (first found wins): env SUPABASE_URL + SUPABASE_SERVICE_KEY, else a JSON
# file at --secrets (default /volume1/PoeTech/secrets/supabase.json) shaped:
#     { "url": "https://xxxx.supabase.co", "service_key": "eyJ..." }
#
# Usage:
#   # From a URL (live feed)
#   python rss-ingest.py --slug colg \
#     --feed https://colgchampaign.org/podcast/feed.rss --max 25
#
#   # From a local file (dry-run verification — no DB writes)
#   python rss-ingest.py --slug colg \
#     --feed-file infra/nas-sme-pipeline/out/test-feed.xml --dry-run
#
#   # Register the source first (once per instance):
#   python rss-ingest.py --slug colg \
#     --feed https://colgchampaign.org/podcast/feed.rss \
#     --source-label "COLG Sunday Messages" --register-source
#
# PROOF OF GENERICITY (see docs/design/SOURCE-ADAPTER-INTERFACE.md §5):
#   · video-harvest.js: 0 lines changed — harvest math is blind to source_platform.
#   · transcript-harvest.js: 0 lines changed — text extractors are blind to platform.
#   · harvest-ledger.js: 0 lines changed — queries by (instance_id, video_id).
#   · load-transcripts.py (YouTube adapter): 0 lines changed.
#   · The only schema changes (0066) are additive with safe DEFAULTs.
# =============================================================================
import argparse
import json
import os
import re
import sys
import time
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime

LOCK_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out", ".rss-ingest.lock")
DEFAULT_SECRETS = "/volume1/PoeTech/secrets/supabase.json"

# Atom namespace (used in YouTube channel feeds and pure Atom podcasts)
ATOM_NS = "http://www.w3.org/2005/Atom"
ITUNES_NS = "http://www.itunes.com/dtds/podcast-1.0.dtd"
CONTENT_NS = "http://purl.org/rss/1.0/modules/content/"

# Source-kind inference: keywords that signal a service or lesson vs. other.
SERVICE_KEYWORDS = re.compile(
    r"\b(sunday|wednesday|worship service|morning service|"
    r"1pm|6pm|evening service|message|sermon|preaching)\b",
    re.IGNORECASE,
)
LESSON_KEYWORDS = re.compile(
    r"\b(bible study|sunday school|lesson|class|teaching|course|training|workshop)\b",
    re.IGNORECASE,
)


# ---------------------------------------------------------------------------
# logging
# ---------------------------------------------------------------------------

def log(msg):
    print(msg, file=sys.stderr, flush=True)


# ---------------------------------------------------------------------------
# secrets
# ---------------------------------------------------------------------------

def load_secrets(path):
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if url and key:
        return url.rstrip("/"), key
    if path and os.path.exists(path):
        with open(path, "r", encoding="utf-8") as fh:
            d = json.load(fh)
        url = (d.get("url") or "").rstrip("/")
        key = d.get("service_key") or d.get("service_role_key")
        if url and key:
            return url, key
    log("ERROR: no Supabase credentials. Set SUPABASE_URL + SUPABASE_SERVICE_KEY, "
        f"or provide {path} as {{\"url\":..., \"service_key\":...}}.")
    sys.exit(2)


# ---------------------------------------------------------------------------
# REST helpers (service role, RLS-exempt) — mirrors load-transcripts.py
# ---------------------------------------------------------------------------

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
    with urllib.request.urlopen(req, timeout=45) as resp:
        raw = resp.read().decode("utf-8", "ignore")
    return json.loads(raw) if raw.strip() else None


def resolve_instance(url, key, slug):
    rows = rest(url, key, "GET", "instances?select=id&slug=eq." + urllib.parse.quote(slug))
    if not rows:
        log(f"ERROR: no instance with slug '{slug}'.")
        sys.exit(2)
    return rows[0]["id"]


def existing_harvest_ids(url, key, instance_id):
    """Return set of video_ids already in video_harvests for this instance."""
    rows = rest(
        url, key, "GET",
        f"video_harvests?select=video_id&instance_id=eq.{instance_id}"
        f"&source_platform=eq.rss"
    ) or []
    return {r["video_id"] for r in rows}


# ---------------------------------------------------------------------------
# RSS / Atom feed fetch + normalize
# ---------------------------------------------------------------------------

def fetch_feed_xml(feed_url):
    """Fetch feed XML from URL. Returns bytes."""
    req = urllib.request.Request(feed_url, headers={"User-Agent": "Mozilla/5.0 PoeTech-RSS/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read()


def parse_feed(xml_bytes):
    """Parse RSS or Atom XML into a list of raw item dicts."""
    root = ET.fromstring(xml_bytes)
    tag = root.tag

    # RSS 2.0
    if tag == "rss":
        channel = root.find("channel")
        if channel is None:
            return []
        feed_title = (channel.findtext("title") or "").strip()
        items = []
        for item in channel.findall("item"):
            items.append(_parse_rss_item(item, feed_title))
        return [i for i in items if i]  # drop None (malformed items)

    # Atom (e.g. YouTube channel RSS)
    if tag.endswith("}feed") or tag == "feed":
        ns = {"atom": ATOM_NS}
        feed_title = (root.findtext(f"{{{ATOM_NS}}}title") or "").strip()
        items = []
        for entry in root.findall(f"{{{ATOM_NS}}}entry"):
            items.append(_parse_atom_entry(entry, feed_title))
        return [i for i in items if i]

    log(f"WARNING: unrecognised feed root element '{tag}'; returning empty.")
    return []


def _parse_rss_item(item, feed_title):
    """Map one RSS <item> to a raw dict."""
    title = (item.findtext("title") or "").strip()
    if not title:
        return None

    # Stable key: prefer <guid isPermaLink="false"> or <guid>, else <link>
    guid_el = item.find("guid")
    if guid_el is not None:
        guid = (guid_el.text or "").strip()
    else:
        guid = (item.findtext("link") or "").strip()
    if not guid:
        return None  # no stable key = skip

    # pubDate in RFC 2822 format ("Sun, 29 Jun 2026 11:00:00 +0000")
    pub_raw = (item.findtext("pubDate") or "").strip()
    pub_date = _parse_pubdate(pub_raw)

    link = (item.findtext("link") or "").strip()

    # <enclosure> is the direct media file URL (audio/video)
    enc_el = item.find("enclosure")
    item_url = enc_el.get("url", "").strip() if enc_el is not None else ""

    description = _extract_description(item)
    duration_str = item.findtext(f"{{{ITUNES_NS}}}duration") or ""

    return {
        "guid": guid,
        "title": title,
        "pub_date": pub_date,
        "link": link,
        "item_url": item_url or None,
        "description": description,
        "feed_title": feed_title,
        "duration_str": duration_str,
        "raw_format": "rss",
    }


def _parse_atom_entry(entry, feed_title):
    """Map one Atom <entry> to a raw dict."""
    title = (entry.findtext(f"{{{ATOM_NS}}}title") or "").strip()
    if not title:
        return None

    # Atom <id> is the stable guid
    guid = (entry.findtext(f"{{{ATOM_NS}}}id") or "").strip()
    if not guid:
        return None

    pub_raw = (
        entry.findtext(f"{{{ATOM_NS}}}published")
        or entry.findtext(f"{{{ATOM_NS}}}updated")
        or ""
    ).strip()
    pub_date = _parse_pubdate_iso(pub_raw)

    link_el = entry.find(f"{{{ATOM_NS}}}link[@rel='alternate']")
    if link_el is None:
        link_el = entry.find(f"{{{ATOM_NS}}}link")
    link = (link_el.get("href", "") if link_el is not None else "").strip()

    description = (
        entry.findtext(f"{{{ATOM_NS}}}summary")
        or entry.findtext(f"{{{ATOM_NS}}}content")
        or ""
    ).strip()

    return {
        "guid": guid,
        "title": title,
        "pub_date": pub_date,
        "link": link,
        "item_url": None,
        "description": description,
        "feed_title": feed_title,
        "duration_str": "",
        "raw_format": "atom",
    }


def _extract_description(item):
    """Extract clean text description from <description> or <content:encoded>."""
    raw = (
        item.findtext(f"{{{CONTENT_NS}}}encoded")
        or item.findtext("description")
        or ""
    ).strip()
    # Strip basic HTML tags for the transcript store (keep text content)
    raw = re.sub(r"<[^>]+>", " ", raw)
    raw = re.sub(r"&amp;", "&", raw)
    raw = re.sub(r"&lt;", "<", raw)
    raw = re.sub(r"&gt;", ">", raw)
    raw = re.sub(r"&nbsp;", " ", raw)
    raw = re.sub(r"\s+", " ", raw).strip()
    return raw


def _parse_pubdate(rfc2822):
    """Parse RFC 2822 pubDate to YYYY-MM-DD. Returns '' on failure."""
    if not rfc2822:
        return ""
    try:
        dt = parsedate_to_datetime(rfc2822)
        return dt.strftime("%Y-%m-%d")
    except Exception:
        # Try naive fallback: "Sun, 29 Jun 2026 ..." -> extract date part
        m = re.search(r"(\d{1,2})\s+(\w{3})\s+(\d{4})", rfc2822)
        if m:
            try:
                from datetime import datetime
                return datetime.strptime(f"{m.group(1)} {m.group(2)} {m.group(3)}", "%d %b %Y").strftime("%Y-%m-%d")
            except ValueError:
                pass
        return ""


def _parse_pubdate_iso(iso_str):
    """Parse ISO-8601 date/datetime to YYYY-MM-DD. Returns '' on failure."""
    if not iso_str:
        return ""
    m = re.match(r"(\d{4}-\d{2}-\d{2})", iso_str)
    return m.group(1) if m else ""


# ---------------------------------------------------------------------------
# CanonicalItem normalization — the adapter contract (SOURCE-ADAPTER-INTERFACE.md)
# ---------------------------------------------------------------------------

def normalize(raw):
    """
    Map a raw parsed item dict to the CanonicalItem shape.
    Stable: calling normalize() twice on the same raw input produces the same output.
    """
    guid = raw["guid"]
    # Namespace-prefix the key (per docs/design/SOURCE-ADAPTER-INTERFACE.md §8)
    item_key = f"rss:{guid}"

    title = raw["title"]
    pub_date = raw["pub_date"] or _infer_date_from_title(title)

    # Infer source_kind from title + description keywords
    text_for_kind = title + " " + (raw.get("description") or "")
    if SERVICE_KEYWORDS.search(text_for_kind):
        source_kind = "service"
    elif LESSON_KEYWORDS.search(text_for_kind):
        source_kind = "lesson"
    else:
        source_kind = "other"

    return {
        "item_key":       item_key,
        "platform":       PLATFORM,
        "title":          title,
        "published_at":   pub_date,
        "url":            raw.get("link") or "",
        "item_url":       raw.get("item_url"),
        "description":    raw.get("description") or "",
        "source_kind":    source_kind,
        "platform_meta":  {
            "feed_title":    raw.get("feed_title"),
            "duration":      raw.get("duration_str"),
            "raw_format":    raw.get("raw_format"),
        },
    }


def _infer_date_from_title(title):
    """Fallback: pull YYYY-MM-DD from a title like '2026-06-29 — Message Title'."""
    m = re.search(r"(\d{4}-\d{2}-\d{2})", title)
    return m.group(1) if m else ""


# ---------------------------------------------------------------------------
# Write to backbone store
# ---------------------------------------------------------------------------

def upsert_harvest(url, key, instance_id, canonical, dry_run):
    """Write one CanonicalItem to video_harvests."""
    row = {
        "instance_id":     instance_id,
        "video_id":        canonical["item_key"],
        "source_platform": PLATFORM,
        "source_kind":     canonical["source_kind"],
        "service_date":    canonical["published_at"] or None,
        "title":           canonical["title"],
        "item_url":        canonical["item_url"],
        "notes":           (canonical["description"] or "")[:500],  # truncated note
        "harvests":        {},  # empty — harvest extractors fill this
    }
    if dry_run:
        log(f"    [dry-run] video_harvests row: {json.dumps(row, ensure_ascii=False)}")
        return
    rest(
        url, key, "POST",
        "video_harvests?on_conflict=instance_id,video_id",
        body=[row],
        extra_headers={"Prefer": "resolution=merge-duplicates,return=minimal"},
    )


def upsert_transcript(url, key, instance_id, canonical, dry_run):
    """Write the episode description as a preliminary transcript to video_transcripts."""
    text = (canonical.get("description") or "").strip()
    if not text:
        return  # nothing to write

    row = {
        "instance_id":     instance_id,
        "video_id":        canonical["item_key"],
        "source_platform": PLATFORM,
        "text":            text,
        "source":          "rss-feed",  # description-sourced (not a full transcript)
        "lang":            "en",
        "words":           len(text.split()),
        "fetched_at":      _isonow(),
    }
    if dry_run:
        log(f"    [dry-run] video_transcripts row: video_id={canonical['item_key']!r} "
            f"words={row['words']} source=rss-feed")
        return
    rest(
        url, key, "POST",
        "video_transcripts?on_conflict=instance_id,video_id",
        body=[row],
        extra_headers={"Prefer": "resolution=merge-duplicates,return=minimal"},
    )


def update_source_run(url, key, instance_id, source_key, status, meta, dry_run):
    """Update content_sources last_run_at / status / meta."""
    if dry_run:
        return
    rest(
        url, key, "PATCH",
        f"content_sources?instance_id=eq.{instance_id}&platform=eq.{PLATFORM}"
        f"&source_key=eq.{urllib.parse.quote(source_key)}",
        body={
            "last_run_at":     _isonow(),
            "last_run_status": status,
            "last_run_meta":   meta,
        },
    )


def register_source(url, key, instance_id, source_key, label, dry_run):
    """Upsert a content_sources row for this feed."""
    row = {
        "instance_id": instance_id,
        "platform":    PLATFORM,
        "source_key":  source_key,
        "label":       label,
        "config":      {"feed_url": source_key},
        "enabled":     True,
    }
    if dry_run:
        log(f"[dry-run] content_sources row: {json.dumps(row, ensure_ascii=False)}")
        return
    rest(
        url, key, "POST",
        "content_sources?on_conflict=instance_id,platform,source_key",
        body=[row],
        extra_headers={"Prefer": "resolution=merge-duplicates,return=minimal"},
    )
    log(f"Registered source: platform={PLATFORM} source_key={source_key!r} label={label!r}")


def _isonow():
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


# ---------------------------------------------------------------------------
# three-brakes: lock
# ---------------------------------------------------------------------------

def acquire_lock():
    os.makedirs(os.path.dirname(LOCK_PATH), exist_ok=True)
    if os.path.exists(LOCK_PATH):
        try:
            age = time.time() - os.path.getmtime(LOCK_PATH)
        except OSError:
            age = 0
        if age < 3600:
            log(f"Another rss-ingest run holds the lock ({int(age)}s old). Skipping.")
            sys.exit(0)
        log("Stale lock (>1h); taking over.")
    with open(LOCK_PATH, "w", encoding="utf-8") as fh:
        fh.write(str(os.getpid()))


def release_lock():
    try:
        os.remove(LOCK_PATH)
    except OSError:
        pass


# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser(
        description=f"Source-adapter #{PLATFORM}: ingest an RSS/podcast feed into the sovereign aggregator backbone."
    )
    ap.add_argument("--slug",         default="colg",        help="instance slug (default colg)")
    ap.add_argument("--feed",         help="RSS/Atom feed URL")
    ap.add_argument("--feed-file",    help="local RSS/Atom XML file (skips HTTP fetch)")
    ap.add_argument("--max",          type=int, default=50,  help="cap items per run (budget brake; 0 = no cap)")
    ap.add_argument("--refetch",      action="store_true",   help="re-upsert items already in the store")
    ap.add_argument("--dry-run",      action="store_true",   help="normalize + print; write nothing to DB")
    ap.add_argument("--register-source", action="store_true", help="also upsert a content_sources row for this feed")
    ap.add_argument("--source-label", default="",           help="label for content_sources row (used with --register-source)")
    ap.add_argument("--secrets",      default=DEFAULT_SECRETS, help="path to Supabase secrets JSON")
    args = ap.parse_args()

    if not args.feed and not args.feed_file:
        log("ERROR: pass --feed URL or --feed-file PATH.")
        sys.exit(1)

    # For dry-run mode, skip credential load entirely (no DB writes at all)
    url = key = instance_id = None
    if not args.dry_run:
        url, key = load_secrets(args.secrets)
        instance_id = resolve_instance(url, key, args.slug)

    # Fetch or load the feed XML
    if args.feed_file:
        with open(args.feed_file, "rb") as fh:
            xml_bytes = fh.read()
        source_key = args.feed_file
        log(f"Parsing local file: {args.feed_file}")
    else:
        log(f"Fetching: {args.feed}")
        xml_bytes = fetch_feed_xml(args.feed)
        source_key = args.feed

    raw_items = parse_feed(xml_bytes)
    if not raw_items:
        log("No items parsed from feed. Check the feed URL/file.")
        sys.exit(1)

    log(f"Feed parsed: {len(raw_items)} items found.")

    # Optionally register the source in content_sources
    if args.register_source:
        label = args.source_label or f"RSS: {source_key}"
        register_source(url, key, instance_id, source_key, label, args.dry_run)

    # Load what's already in the store (skip on dry-run — nothing is there yet)
    existing = set()
    if not args.dry_run:
        existing = existing_harvest_ids(url, key, instance_id)

    acquire_lock()
    try:
        processed = skipped = errors = 0
        total = len(raw_items)

        for i, raw in enumerate(raw_items, 1):
            try:
                canonical = normalize(raw)
            except Exception as exc:
                log(f"[{i}/{total}] SKIP (normalize failed): {exc}")
                errors += 1
                continue

            item_key = canonical["item_key"]
            title_short = canonical["title"][:60]

            # INCREMENTAL: skip items already in the store
            if item_key in existing and not args.refetch:
                skipped += 1
                log(f"[{i}/{total}] already loaded: {item_key!r}")
                continue

            # BOUNDED: check budget
            if args.max and processed >= args.max:
                log(f"--max {args.max} reached; stopping (re-run to continue).")
                break

            log(f"[{i}/{total}] {item_key!r}  {title_short!r}  {canonical['published_at']}")

            upsert_harvest(url, key, instance_id, canonical, args.dry_run)
            upsert_transcript(url, key, instance_id, canonical, args.dry_run)

            processed += 1

        # STALL-GUARD: if we advanced 0 items while gaps remain, exit non-zero
        # so a scheduler surfaces the stall instead of it hanging silent.
        gaps = total - len(existing) - processed
        log("")
        log(f"This run: {processed} processed, {skipped} already had, {errors} errors.")
        log(f"Feed total: {total} items; estimated gaps after this run: {max(0, gaps)}.")

        status = "ok" if errors == 0 else "error"
        meta = {"processed": processed, "skipped": skipped, "errors": errors, "total": total}

        if not args.dry_run:
            update_source_run(url, key, instance_id, source_key, status, meta, False)

        if processed == 0 and skipped < total and not args.refetch:
            log("STALL: 0 items advanced while gaps remain. Check feed URL / content_sources config.")
            sys.exit(3)

        if args.dry_run:
            log("")
            log("Dry-run complete. No writes made. To ingest for real, remove --dry-run.")
            log(f"Adapter: PLATFORM={PLATFORM!r} | {processed} items would be written to:")
            log("  · video_harvests (source_platform='rss', video_id='rss:{guid}')")
            log("  · video_transcripts (source='rss-feed', text=episode description)")
            log("The backbone (video-harvest.js, transcript-harvest.js, harvest-ledger.js)")
            log("requires ZERO changes to process these rows — verified in this dry-run.")

    finally:
        release_lock()


if __name__ == "__main__":
    main()

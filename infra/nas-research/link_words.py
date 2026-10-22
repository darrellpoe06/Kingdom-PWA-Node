#!/usr/bin/env python3
"""link_words -- a link he sends gets its words, on our own machines.

WHY THIS EXISTS. Darrell 2026-10-22, with two links in the Research list: one
"Could not be looked into" (2026-10-21 22:43) and an Instagram reel marked
Lesson still "Waiting to be looked into" (2026-10-22 00:42). Asked why no road
turned a video's audio into words: "why not?!!!!!!!!!!" The measured answer:
research-inbox.yml (DR-1172) read YouTube captions only, and for every other
link wrote "the item held a link that is not one this road can reach" -- run
39697937798 did exactly that to the 22:43 link. Whisper already turned his
spoken recordings into words (infra/nas-lesson-voice, the tower then the NAS
CPU); it had never been wired to a link. This wires it.

WHAT IT DOES, on the NAS (the residential IP and the tailnet the runner
cannot be):
  1. Refuses anything but an https link on a known public video host (no
     internal address, no file:, no javascript:; yt-dlp's generic extractor
     never sees an arbitrary URL).
  2. Reads the post's metadata with the NAS's own pinned yt-dlp (DR-0723):
     title, who posted it, the caption under the post, the length.
  3. Fetches the audio (or the smallest whole file when there is no separate
     audio), capped in length and bytes.
  4. Hands the file to the SAME Whisper ladder the spoken lessons ride
     (lesson_voice_transcribe.transcribe_ladder: the 4070 tower, then the
     NAS CPU). First words win; the result names the rung and model.
  5. Deletes the media. Writes one JSON result.

BRAKES (request-driven: one link per call, called by research-inbox.yml's one
item per run; no timer, no loop): MAX_SECONDS of video, MAX_BYTES of file, a
timeout on every subprocess, a whole-call budget the CPU rung stops at
(partial words are kept and say so), and the media is never kept.

Run:
  python3 link_words.py --url URL --out /tmp/link.json     (on the NAS)
  python3 link_words.py --render /tmp/link.json            (the answer text)
  python3 link_words.py --selftest                         (offline, stdlib)
"""
import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))

YTDLP_DEFAULT = "/volume1/PoeTech/yt-dlp/yt-dlp"
# Capacity, not a gate (Darrell 2026-10-22: "We wanted all capacity and
# capabilities"). Four hours holds a whole service; a GB holds its audio many
# times over. These exist only so one stuck download cannot hold the box.
MAX_SECONDS = int(os.environ.get("LINK_WORDS_MAX_SECONDS", str(4 * 3600)))
MAX_BYTES = int(os.environ.get("LINK_WORDS_MAX_BYTES", str(1024 * 1024 * 1024)))
META_TIMEOUT = 120
FETCH_TIMEOUT = 1800
BUDGET_SECONDS = int(os.environ.get("LINK_WORDS_BUDGET_SECONDS", "2400"))
MAX_TEXT = 400000
# BOTTLENECK GUARD (DR-1202): items run side by side, and when the tower is
# asleep every one of them lands on the NAS CPU. At most SLOTS transcriptions
# run on this box at once; the rest WAIT for a slot (inside their budget)
# rather than all grinding the CPU together. A slot is a held file lock, so a
# crashed holder frees its slot the moment its process ends.
SLOTS = int(os.environ.get("LINK_WORDS_SLOTS", "2"))
SLOT_DIR = os.environ.get("LINK_WORDS_SLOT_DIR") or os.path.expanduser("~/research-work/.slots")
MAX_CAPTION = 8000

# Known hosts get a friendly name; ANY public https host is read (yt-dlp knows
# well over a thousand sites). YouTube included: a video with no captions now
# falls through to its audio instead of stopping.
NAMES = {
    "instagram.com": "Instagram", "tiktok.com": "TikTok", "facebook.com": "Facebook",
    "fb.watch": "Facebook", "vimeo.com": "Vimeo", "x.com": "X", "twitter.com": "X",
    "threads.net": "Threads", "rumble.com": "Rumble", "youtube.com": "YouTube",
    "youtu.be": "YouTube",
}
# Security, not capability: the road never reads inside the house or the
# tailnet, so a link cannot be used to reach the NAS's own neighbours.
PRIVATE_SUFFIXES = (".local", ".lan", ".home", ".internal", ".localdomain", ".ts.net", ".arpa")


def _is_private_ip(text):
    try:
        import ipaddress
        ip = ipaddress.ip_address(text)
    except ValueError:
        return None
    return not ip.is_global


def resolves_public(host, resolve=None):
    """Every address the host resolves to is public. Unknown is refused."""
    import socket
    resolve = resolve or (lambda h: [a[4][0] for a in socket.getaddrinfo(h, 443)])
    try:
        addrs = resolve(host)
    except Exception:
        return False
    return bool(addrs) and all(_is_private_ip(a) is False for a in addrs)


def site_of(url, resolve=None):
    """The site name for a link this road reads, or '' (refused)."""
    if not isinstance(url, str) or len(url) > 2048 or any(c.isspace() for c in url):
        return ""
    try:
        p = urllib.parse.urlparse(url)
        port = p.port
    except Exception:
        return ""
    if p.scheme != "https" or not p.hostname or p.username or p.password or port not in (None, 443):
        return ""
    host = p.hostname.lower().rstrip(".")
    if host == "localhost" or "." not in host or host.endswith(PRIVATE_SUFFIXES):
        return ""
    literal = _is_private_ip(host)
    if literal is True:
        return ""
    if resolve is not False and not resolves_public(host, resolve):
        return ""
    for h, name in NAMES.items():
        if host == h or host.endswith("." + h):
            return name
    return host


def clean_url(url):
    """Drop share-tracking queries (?xtok=, ?igsh=, utm_*) but keep what names
    the video (YouTube's ?v=, a start time)."""
    p = urllib.parse.urlparse(url)
    keep = [(k, v) for k, v in urllib.parse.parse_qsl(p.query) if k in ("v", "t", "list", "index")]
    return urllib.parse.urlunparse((p.scheme, p.netloc, p.path, "", urllib.parse.urlencode(keep), ""))


def fail(why, **extra):
    return {"ok": False, "why": why, **extra}


def default_runner(args, timeout):
    r = subprocess.run(args, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=timeout)
    return r.returncode, r.stdout.decode("utf-8", "replace"), r.stderr.decode("utf-8", "replace")


def short_err(text, limit=240):
    lines = [l.strip() for l in (text or "").splitlines() if l.strip()]
    errs = [l for l in lines if "ERROR" in l] or lines[-1:]
    return (errs[-1] if errs else "")[:limit]


def read_meta(url, ytdlp, runner):
    code, out, err = runner([ytdlp, "--no-playlist", "--no-warnings", "-J", url], META_TIMEOUT)
    if code != 0:
        return None, "the post could not be read (" + (short_err(err) or "yt-dlp exit %d" % code) + ")"
    try:
        meta = json.loads(out)
    except Exception:
        return None, "the post's details came back unreadable"
    if not isinstance(meta, dict):
        return None, "the post's details came back unreadable"
    return meta, ""


def fetch_media(url, ytdlp, workdir, runner):
    tmpl = os.path.join(workdir, "media.%(ext)s")
    code, _out, err = runner([ytdlp, "--no-playlist", "--no-warnings", "--no-part",
                              "-f", "bestaudio/worst[acodec!=none]/best",
                              "--max-filesize", str(MAX_BYTES), "-o", tmpl, url], FETCH_TIMEOUT)
    files = [f for f in os.listdir(workdir) if f.startswith("media.")]
    if code != 0 or not files:
        return "", "the audio could not be fetched (" + (short_err(err) or "yt-dlp exit %d" % code) + ")"
    path = os.path.join(workdir, files[0])
    if os.path.getsize(path) > MAX_BYTES:
        return "", "the file was larger than this road takes"
    return path, ""


# --- ROAD 5: a web page's own words (DR-1202) ---------------------------------
# Measured on run 39705324897: the features link was an mt27.org message page,
# not a video, and yt-dlp said "Unsupported URL". A page is read for what it
# says: its title, its description, and its visible text. Every redirect is
# checked by the same door as the link, so a page can never send this road
# inside the house.
MAX_PAGE_BYTES = 3 * 1024 * 1024
PAGE_TIMEOUT = 30
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"


def page_text(html_text):
    """(title, description, text) from HTML. Pure (stdlib html.parser)."""
    from html.parser import HTMLParser  # noqa: PLC0415

    class P(HTMLParser):
        SKIP = {"script", "style", "noscript", "svg", "template", "head"}
        BLOCK = {"p", "div", "li", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "article", "section", "br", "tr", "pre"}

        def __init__(self):
            super().__init__(convert_charrefs=True)
            self.skip = 0
            self.in_title = False
            self.title = ""
            self.meta = {}
            self.parts = []

        def handle_starttag(self, tag, attrs):
            a = dict(attrs)
            if tag == "meta":
                k = (a.get("property") or a.get("name") or "").lower()
                if k in ("og:title", "og:description", "description", "twitter:description", "twitter:title") and a.get("content"):
                    self.meta.setdefault(k, a["content"].strip())
            if tag == "title":
                self.in_title = True
            if tag in self.SKIP:
                self.skip += 1
            if tag in self.BLOCK:
                self.parts.append("\n")

        def handle_endtag(self, tag):
            if tag == "title":
                self.in_title = False
            if tag in self.SKIP and self.skip:
                self.skip -= 1
            if tag in self.BLOCK:
                self.parts.append("\n")

        def handle_data(self, data):
            if self.in_title:
                self.title += data
            elif not self.skip:
                self.parts.append(data)

    p = P()
    try:
        p.feed(html_text)
    except Exception:  # noqa: BLE001 -- a broken page still gives what it gave
        pass
    title = (p.meta.get("og:title") or p.title or p.meta.get("twitter:title") or "").strip()
    desc = (p.meta.get("og:description") or p.meta.get("description") or p.meta.get("twitter:description") or "").strip()
    lines = [re.sub(r"[ \t\r\f\v]+", " ", l).strip() for l in "".join(p.parts).split("\n")]
    text = "\n".join(l for l in lines if l)
    return title[:300], desc[:MAX_CAPTION], text[:MAX_TEXT]


def redirect_door(resolve=None):
    """A redirect handler that re-checks every hop with the link's own door."""
    import urllib.request  # noqa: PLC0415

    class Door(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, req, fp, code, msg, headers, newurl):
            if not site_of(newurl, resolve):
                raise ValueError("the page redirected inside the house or off https, so it was not followed")
            return super().redirect_request(req, fp, code, msg, headers, newurl)

    return Door()


def default_fetch(url, resolve=None):
    """(status, content_type, body bytes) with every redirect re-checked."""
    import urllib.request  # noqa: PLC0415

    opener = urllib.request.build_opener(redirect_door(resolve))
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html,text/plain;q=0.9,*/*;q=0.1"})
    with opener.open(req, timeout=PAGE_TIMEOUT) as res:
        return res.status, res.headers.get("Content-Type", ""), res.read(MAX_PAGE_BYTES + 1)


def read_page(url, fetch=None, resolve=None):
    """(result dict, why). The page's words, or why not."""
    fetch = fetch or (lambda u: default_fetch(u, resolve))
    try:
        status, ctype, body = fetch(url)
    except Exception as e:  # noqa: BLE001
        return None, "the page could not be fetched (%s)" % str(e)[:200]
    if status != 200:
        return None, "the page answered %s" % status
    if len(body) > MAX_PAGE_BYTES:
        body = body[:MAX_PAGE_BYTES]
    ct = (ctype or "").lower()
    if ct and not ("html" in ct or "text/plain" in ct or "xml" in ct):
        return None, "the link is a %s file, not a page or a video" % ct.split(";")[0]
    m = re.search(r"charset=([\w-]+)", ct)
    try:
        html_text = body.decode(m.group(1) if m else "utf-8", "replace")
    except LookupError:
        html_text = body.decode("utf-8", "replace")
    if "text/plain" in ct:
        title, desc, text = "", "", html_text[:MAX_TEXT]
    else:
        title, desc, text = page_text(html_text)
    if len(text) < 40 and not desc:
        return None, "the page gave almost no readable words (it may draw them with script)"
    return {"title": title, "caption": desc, "words": text}, ""


def take_slot(deadline, slots=SLOTS, slot_dir=SLOT_DIR, now=time.monotonic, sleep=time.sleep):
    """An open file holding an exclusive lock on one of `slots` slot files, or
    None when none freed before the deadline. Never raises."""
    try:
        import fcntl  # noqa: PLC0415 -- POSIX only; without it there is no gate
        os.makedirs(slot_dir, exist_ok=True)
    except Exception:
        return "no-gate"
    while True:
        for i in range(max(1, slots)):
            f = open(os.path.join(slot_dir, "slot-%d" % i), "a")
            try:
                fcntl.flock(f, fcntl.LOCK_EX | fcntl.LOCK_NB)
                return f
            except OSError:
                f.close()
        if now() >= deadline:
            return None
        sleep(5)


def default_ladder(path, deadline):
    # The script may run from a copy (the lane carries it to /tmp so a branch
    # can be proven before it merges); the ladder is always the NAS's own.
    sys.path.insert(0, os.environ.get("LINK_WORDS_LADDER_DIR") or os.path.join(HERE, "..", "nas-lesson-voice"))
    import lesson_voice_transcribe as lv  # the same ladder the spoken lessons ride
    return lv.transcribe_ladder(path, deadline=deadline)


def link_words(url, ytdlp=YTDLP_DEFAULT, runner=default_runner, ladder=default_ladder, now=time.monotonic, resolve=None,
               media=None, meta=None, fetch=None):
    """media/meta: the SECOND ROAD. When the NAS's own fetch is turned away
    (a site that refuses one address), the lane fetches from a runner's address
    and hands the file and its details here, and they ride the same Whisper
    ladder to the same result shape. One process, more than one road in."""
    site = site_of(url, resolve)
    if not site:
        return fail("this link points inside the house or is not an https link, so it is not read")
    url = clean_url(url)
    started = now()
    if meta is None:
        meta, why = read_meta(url, ytdlp, runner)
        if meta is None:
            # Not a video this road can fetch: read it as a page instead.
            page, pwhy = read_page(url, fetch=fetch, resolve=resolve)
            if page:
                return {"ok": True, "kind": "page", "url": url, "site": site, "by": "", "duration": None,
                        "title": page["title"], "caption": page["caption"], "words": page["words"],
                        "rung": "the page itself", "model": "", "partial": False, "note": ""}
            return fail("%s; read as a page: %s" % (why, pwhy), url=url, site=site)
    duration = meta.get("duration")
    base = {
        "url": url, "site": site,
        "title": str(meta.get("title") or "")[:300],
        "by": str(meta.get("uploader") or meta.get("channel") or meta.get("uploader_id") or "")[:200],
        "caption": str(meta.get("description") or "")[:MAX_CAPTION],
        "duration": round(float(duration), 1) if isinstance(duration, (int, float)) else None,
    }
    if isinstance(duration, (int, float)) and duration > MAX_SECONDS:
        return {**fail("the video runs %d minutes; this road takes up to %d" % (duration // 60, MAX_SECONDS // 60)), **base}
    # On the volume the lane names (never the NAS's small system partition).
    work_root = os.environ.get("LINK_WORDS_WORK") or None
    if work_root:
        os.makedirs(work_root, exist_ok=True)
    workdir = tempfile.mkdtemp(prefix="link-words-", dir=work_root)
    try:
        if media:
            path, why = (media, "") if os.path.isfile(media) and os.path.getsize(media) <= MAX_BYTES else ("", "the file handed over could not be read")
        else:
            path, why = fetch_media(url, ytdlp, workdir, runner)
        if not path:
            if base["caption"]:
                return {**base, "ok": True, "words": "", "rung": "", "model": "", "partial": False,
                        "note": why + "; the caption under the post is what was read"}
            return {**fail(why), **base}
        deadline = started + BUDGET_SECONDS
        slot = take_slot(deadline) if ladder is default_ladder else "no-gate"
        if slot is None:
            out = {"error": "every transcription slot on this box stayed busy past the budget"}
        else:
            try:
                out = ladder(path, deadline) or {}
            except Exception as e:
                out = {"error": str(e)[:300]}
            finally:
                if hasattr(slot, "close"):
                    slot.close()
        words = (out.get("text") or "").strip()[:MAX_TEXT]
        if not words and not base["caption"]:
            return {**fail("no words came back from Whisper (" + (out.get("error") or "nothing heard") + ")"), **base}
        return {**base, "ok": True, "words": words, "rung": out.get("rung") or "", "model": out.get("model") or "",
                "partial": out.get("done") is False,
                "note": "" if words else "no speech was heard; the caption under the post is what was read"}
    finally:
        shutil.rmtree(workdir, ignore_errors=True)


def render(result):
    """The answer text the Research list shows (the lane prepends the
    unverified line). Plain lines; never invents a field it did not get."""
    if not result.get("ok"):
        return ""
    lines = []
    head = result.get("title") or "A post"
    lines.append("%s (%s)" % (head, result.get("site") or "a link"))
    if result.get("by"):
        lines.append("Posted by: " + result["by"])
    if result.get("duration"):
        s = int(result["duration"])
        lines.append("Length: %d:%02d" % (s // 60, s % 60))
    lines.append("Link: " + (result.get("url") or ""))
    if result.get("caption"):
        lines += ["", "The caption under the post:", result["caption"]]
    if result.get("words") and result.get("kind") == "page":
        lines += ["", "What the page says (read from the page itself on our own machine):", result["words"]]
    elif result.get("words"):
        how = "Whisper (%s) on %s" % (result.get("model") or "model", result.get("rung") or "our machines")
        lines += ["", "What is said in it (transcribed by %s%s):" % (how, ", stopped early -- the rest was not reached" if result.get("partial") else ""),
                  result["words"]]
    if result.get("note"):
        lines += ["", "Note: " + result["note"]]
    return "\n".join(lines) + "\n"


# --- proofs ---------------------------------------------------------------------

def selftest():
    checks = []

    def check(name, cond):
        checks.append((name, bool(cond)))

    pub = lambda h: ["157.240.1.1"]
    inside = lambda h: ["192.168.1.26"]
    check("instagram reel accepted", site_of("https://www.instagram.com/reel/Dem5dUqiOqb/?xtok=MXE3", pub) == "Instagram")
    check("tiktok accepted", site_of("https://www.tiktok.com/@a/video/1", pub) == "TikTok")
    check("youtube accepted (audio when no captions)", site_of("https://www.youtube.com/watch?v=abcdefghijk", pub) == "YouTube")
    check("any public video host accepted", site_of("https://videos.example.org/watch/9", pub) == "videos.example.org")
    check("http refused", site_of("http://www.instagram.com/reel/x/", pub) == "")
    check("javascript refused", site_of("javascript:alert(1)", pub) == "")
    check("file refused", site_of("file:///etc/passwd", pub) == "")
    check("a house address refused", site_of("https://192.168.1.26/x", pub) == "")
    check("loopback refused", site_of("https://127.0.0.1/x", pub) == "")
    check("localhost refused", site_of("https://localhost/x", pub) == "")
    check("a tailnet name refused", site_of("https://poetech.tail5a2f35.ts.net/x", pub) == "")
    check("a public name that resolves inside refused", site_of("https://sneaky.example.com/x", inside) == "")
    check("a name that does not resolve refused", site_of("https://nowhere.example.com/x", lambda h: []) == "")
    check("userinfo refused", site_of("https://user:pw@www.instagram.com/reel/x", pub) == "")
    check("odd port refused", site_of("https://www.instagram.com:8443/reel/x", pub) == "")
    check("tracking query dropped", clean_url("https://www.instagram.com/reel/Dem5dUqiOqb/?xtok=MXE3") == "https://www.instagram.com/reel/Dem5dUqiOqb/")
    check("youtube video id kept", clean_url("https://www.youtube.com/watch?v=abcdefghijk&si=zz") == "https://www.youtube.com/watch?v=abcdefghijk")

    meta = {"title": "Faith that works", "uploader": "someone", "description": "Read James 2.", "duration": 74.2}

    def runner_ok(args, timeout):
        if "-J" in args:
            return 0, json.dumps(meta), ""
        out = args[args.index("-o") + 1].replace("%(ext)s", "m4a")
        with open(out, "wb") as f:
            f.write(b"\0" * 64)
        return 0, "", ""

    seen = {}

    def ladder_ok(path, deadline):
        seen["path"] = path
        seen["existed"] = os.path.exists(path)
        return {"text": "Faith without works is dead.", "model": "large-v3-turbo", "rung": "the 4070 tower", "done": True}

    r = link_words("https://www.instagram.com/reel/Dem5dUqiOqb/?xtok=MXE3", ytdlp="yt", runner=runner_ok, ladder=ladder_ok, resolve=pub)
    check("a reel gives its words", r.get("ok") and r.get("words") == "Faith without works is dead.")
    check("the rung is named", r.get("rung") == "the 4070 tower" and r.get("model") == "large-v3-turbo")
    check("the caption is kept", r.get("caption") == "Read James 2.")
    check("the ladder got the real file", seen.get("existed") is True)
    check("the media is deleted after", not os.path.exists(seen.get("path", "/nonexistent-x")) and not os.path.exists(os.path.dirname(seen.get("path", "/nonexistent-x/y"))))
    text = render(r)
    check("render names title, site, caption and words", all(s in text for s in ("Faith that works (Instagram)", "Posted by: someone", "Length: 1:14", "Read James 2.", "Faith without works is dead.", "Whisper (large-v3-turbo) on the 4070 tower")))

    long_meta = dict(meta, duration=MAX_SECONDS + 60)
    r = link_words("https://www.instagram.com/reel/x/", runner=lambda a, t: (0, json.dumps(long_meta), ""), ladder=ladder_ok, resolve=pub)
    check("a video over the four-hour hold says so", not r.get("ok") and "this road takes up to" in r.get("why", ""))

    r = link_words("https://www.instagram.com/reel/x/", runner=lambda a, t: (1, "", "ERROR: [Instagram] x: login required"), ladder=ladder_ok, resolve=pub)
    check("a post that cannot be read says why", not r.get("ok") and "login required" in r.get("why", ""))

    def runner_nofile(args, timeout):
        if "-J" in args:
            return 0, json.dumps(meta), ""
        return 1, "", "ERROR: no formats"
    r = link_words("https://www.instagram.com/reel/x/", runner=runner_nofile, ladder=ladder_ok, resolve=pub)
    check("no audio but a caption still answers, and says so", r.get("ok") and r.get("words") == "" and "caption under the post is what was read" in r.get("note", ""))

    r = link_words("https://www.instagram.com/reel/x/", runner=runner_ok, ladder=lambda p, d: {"text": "half of it", "done": False, "model": "small", "rung": "the NAS CPU"}, resolve=pub)
    check("a pass that stopped early says so", r.get("partial") is True and "stopped early" in render(r))

    def boom(p, d):
        raise RuntimeError("no Whisper rung answered -- tower: no answer on /health")
    no_cap = dict(meta, description="")
    r = link_words("https://www.instagram.com/reel/x/", runner=lambda a, t: runner_ok(a, t) if "-J" not in a else (0, json.dumps(no_cap), ""), ladder=boom, resolve=pub)
    check("no rung and no caption fails with the ladder's reason", not r.get("ok") and "no Whisper rung answered" in r.get("why", ""))

    check("a failed result renders nothing", render({"ok": False, "why": "x"}) == "")
    r = link_words("https://10.0.0.5/x", runner=runner_ok, ladder=ladder_ok, resolve=pub)
    check("an inside host never reaches yt-dlp", not r.get("ok") and "inside the house" in r.get("why", ""))

    # ROAD 5: a page that is not a video is read for its words.
    html_doc = ('<html><head><title>Trivia</title><meta property="og:description" content="Weekly questions">'
                '<script>var x = "never this";</script><style>.a{}</style></head>'
                '<body><h1>Love Corner trivia</h1><p>Question one: who built the ark?</p><p>Question two.</p></body></html>')
    unsupported = lambda a, t: (1, "", "ERROR: Unsupported URL: https://mt27.org/msg/x")
    r = link_words("https://mt27.org/msg/x", runner=unsupported, ladder=ladder_ok, resolve=pub,
                   fetch=lambda u: (200, "text/html; charset=utf-8", html_doc.encode()))
    check("a page that is not a video is read for its words", r.get("ok") and r.get("kind") == "page" and "who built the ark" in r.get("words", ""))
    check("the page's title and description are kept", r.get("title") == "Trivia" and r.get("caption") == "Weekly questions")
    check("a page's script and style are never its words", "never this" not in r.get("words", "") and ".a{}" not in r.get("words", ""))
    check("a page renders as what the page says", "What the page says (read from the page itself" in render(r))
    r = link_words("https://mt27.org/msg/x", runner=unsupported, ladder=ladder_ok, resolve=pub,
                   fetch=lambda u: (200, "text/html", b"<html><body><div id=app></div><script>render()</script></body></html>"))
    check("a page drawn by script says so, never an empty answer", not r.get("ok") and "almost no readable words" in r.get("why", ""))
    r = link_words("https://mt27.org/msg/x", runner=unsupported, ladder=ladder_ok, resolve=pub,
                   fetch=lambda u: (200, "application/zip", b"PK"))
    check("a file that is neither page nor video says what it is", not r.get("ok") and "application/zip" in r.get("why", ""))
    import urllib.request as _ur
    door = redirect_door(pub)
    req0 = _ur.Request("https://mt27.org/msg/x")
    refused = ""
    try:
        door.redirect_request(req0, None, 302, "Found", {}, "https://192.168.1.26/admin")
    except ValueError as e:
        refused = str(e)
    check("PROVEN-TO-CATCH: a redirect inside the house is never followed", "inside the house" in refused)
    hop = door.redirect_request(req0, None, 302, "Found", {}, "https://mt27.org/msg/y")
    check("a redirect that stays public is followed", hop is not None and hop.full_url == "https://mt27.org/msg/y")

    # The second road: a file and details fetched elsewhere ride the same ladder.
    tmp = tempfile.mkdtemp(prefix="lw-test-")
    handed = os.path.join(tmp, "media.m4a")
    with open(handed, "wb") as f:
        f.write(b"\0" * 64)
    never = lambda a, t: (_ for _ in ()).throw(AssertionError("the second road must not call yt-dlp"))
    r = link_words("https://www.instagram.com/reel/Dem5dUqiOqb/", runner=never, ladder=ladder_ok, resolve=pub, media=handed, meta=meta)
    check("the second road gives the same result shape", r.get("ok") and r.get("words") == "Faith without works is dead." and r.get("title") == "Faith that works")
    check("the second road still refuses an inside link", not link_words("https://10.1.1.1/x", runner=never, ladder=ladder_ok, resolve=pub, media=handed, meta=meta).get("ok"))
    shutil.rmtree(tmp, ignore_errors=True)

    # The slot gate: two holders take the two slots; a third waits, then gets
    # None at its deadline; a freed slot is taken again.
    sd = tempfile.mkdtemp(prefix="lw-slots-")
    clock = {"t": 0.0}
    a1 = take_slot(10, slots=2, slot_dir=sd, now=lambda: clock["t"])
    a2 = take_slot(10, slots=2, slot_dir=sd, now=lambda: clock["t"])

    def tick(_s):
        clock["t"] += 5
    a3 = take_slot(10, slots=2, slot_dir=sd, now=lambda: clock["t"], sleep=tick)
    check("two slots are taken by two holders", hasattr(a1, "close") and hasattr(a2, "close"))
    check("a third holder waits and gives up at its deadline", a3 is None and clock["t"] >= 10)
    a1.close()
    a4 = take_slot(clock["t"] + 10, slots=2, slot_dir=sd, now=lambda: clock["t"])
    check("a freed slot is taken again", hasattr(a4, "close"))
    a2.close()
    a4.close()
    shutil.rmtree(sd, ignore_errors=True)

    bad = [n for n, ok in checks if not ok]
    for n, ok in checks:
        print(("ok   " if ok else "FAIL ") + n)
    if bad:
        print("LINK WORDS SELFTEST: FAIL (%d)" % len(bad))
        return 1
    print("LINK WORDS SELFTEST: OK (%d checks)" % len(checks))
    return 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url")
    ap.add_argument("--url-file", help="read the link from a file (never on a command line)")
    ap.add_argument("--media", help="a file another road fetched")
    ap.add_argument("--meta", help="that road's yt-dlp -J details, as a file")
    ap.add_argument("--out")
    ap.add_argument("--ytdlp", default=os.environ.get("LINK_WORDS_YTDLP", YTDLP_DEFAULT))
    ap.add_argument("--render")
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args()
    if a.selftest:
        return selftest()
    if a.render:
        with open(a.render) as f:
            sys.stdout.write(render(json.load(f)))
        return 0
    url = a.url
    if a.url_file:
        with open(a.url_file, encoding="utf-8") as f:
            m = re.search(r"https?://[^\s<>\"']+", f.read())
        url = m.group(0).rstrip(".,;:)]}") if m else ""
    if not (url and a.out):
        ap.error("a link (--url or --url-file) and --out are required")
    ytdlp = a.ytdlp if os.path.exists(a.ytdlp) else (shutil.which("yt-dlp") or a.ytdlp)
    meta = None
    if a.meta:
        try:
            with open(a.meta, encoding="utf-8") as f:
                meta = json.load(f)
        except Exception:
            meta = None
    try:
        result = link_words(url, ytdlp=ytdlp, media=a.media, meta=meta if isinstance(meta, dict) else None)
    except Exception as e:  # the road says why; it never dies silently
        result = fail("the link road broke: %s" % str(e)[:200])
    with open(a.out, "w") as f:
        json.dump(result, f)
    print(json.dumps({k: result.get(k) for k in ("ok", "site", "duration", "rung", "model", "partial", "why")}))
    return 0


if __name__ == "__main__":
    sys.exit(main())

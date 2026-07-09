#!/usr/bin/env python3
"""youtube_index — list the church channel's uploads into the whisper queue.

Tower job (the published services ARE the program output — both the transcription
source and, long-game, the switching ground truth). Uses yt-dlp's flat playlist
mode (metadata only — downloads nothing here); if yt-dlp isn't installed it says
so and exits. The whisper stage consumes the queue file this writes.

Usage:
  python youtube_index.py <channel-or-playlist-url> [--out whisper-queue.json]
"""
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

RUN_EVENTS = Path(__file__).with_name("events.jsonl")


def emit(ok, processed, note):
    with RUN_EVENTS.open("a") as ev:
        ev.write(json.dumps({"at": datetime.now(timezone.utc).isoformat(),
                             "script": "youtube_index", "ok": ok,
                             "processed": processed, "note": note}) + "\n")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    url = sys.argv[1]
    out_path = Path(sys.argv[sys.argv.index("--out") + 1]) if "--out" in sys.argv else Path("whisper-queue.json")
    try:
        r = subprocess.run(["yt-dlp", "--flat-playlist", "-J", url],
                           capture_output=True, text=True, timeout=300)
    except FileNotFoundError:
        msg = "yt-dlp not installed (pip install yt-dlp). Nothing indexed."
        print(msg)
        emit(False, 0, msg)
        return 2
    if r.returncode != 0:
        emit(False, 0, r.stderr.strip()[:200])
        print(r.stderr.strip()[:500])
        return 1
    data = json.loads(r.stdout)
    videos = [{"id": e.get("id"), "title": e.get("title"), "url": e.get("url"),
               "duration": e.get("duration"), "transcribed": False}
              for e in data.get("entries", []) if e]
    out_path.write_text(json.dumps({"generated": datetime.now(timezone.utc).isoformat(),
                                    "channel": url, "count": len(videos),
                                    "videos": videos}, indent=2))
    emit(True, len(videos), f"-> {out_path}")
    print(f"indexed {len(videos)} videos -> {out_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

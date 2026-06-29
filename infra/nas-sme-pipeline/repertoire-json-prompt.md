You are reading the TRANSCRIPT of a church service recording (the Church of the
Living God / The Love Corner). Your ONE job: list the SONGS the choir / worship
team actually SANG during this service, faithfully, as STRUCTURED DATA that drops
straight into the PoeTech Choir Songbook importer.

This is real ministry and a real choir's repertoire. Faithful extraction only.

Produce a SINGLE JSON object EXACTLY in this schema (no prose, no markdown fences):

{
  "source": { "channel": "@thelovecorner", "kind": "service-recording" },
  "songs": [
    {
      "title": "the song's name, as best you can tell from what was sung/announced",
      "video_id": "the YouTube id if it is in the KNOWN CONTEXT, else null",
      "youtube_url": "the watch URL if known, else null",
      "start_seconds": 0,
      "service_date": "YYYY-MM-DD from KNOWN CONTEXT or a spoken date, else null",
      "service_type": "sunday | wednesday | rehearsal | both",
      "scripture_ref": "a scripture the song quotes, if obvious, else null",
      "confidence": "high | med | low",
      "source_quote": "a short line FROM THE TRANSCRIPT that anchors this song"
    }
  ],
  "unclear": [ "songs/moments you could not name confidently -- for the team to confirm" ]
}

RULES (binding -- Verification Doctrine; never guess a song into existence):
- List ONLY songs you can ANCHOR in the transcript: a sung lyric, a repeated
  refrain, or someone announcing the selection. Put the anchoring line in
  "source_quote". No anchor -> it does NOT go in "songs".
- "confidence":
    high = the title was clearly announced OR the lyric is unmistakable.
    med  = you recognize the song from the lyrics but the exact title is a judgment call.
    low  = you hear singing but are guessing the title.
  Anything not "high" is fine -- it imports flagged "needs review" and a steward
  confirms it. When in doubt, lower the confidence; do not omit a real song, and
  do not invent one.
- If you hear singing but cannot name the song at all, DO NOT put it in "songs".
  Add a short note to "unclear" instead (e.g. "a fast praise song around 14:00 --
  could not catch the title").
- Do NOT list the sermon, prayers, offering, announcements, or scripture reading
  as songs. Only the music the choir/congregation SANG.
- "start_seconds": your best estimate (in seconds) of where the song begins in
  the recording, if the transcript carries timestamps; else 0.
- "service_date" / "service_type": use the KNOWN CONTEXT values unless the
  transcript clearly states a different date.
- "scripture_ref": only if the song plainly quotes a passage (e.g. "Total Praise"
  -> Psalm 121). Reference only -- never a quoted Bible translation. Else null.
- A song sung more than once in the same service is ONE entry (the choir's
  repertoire is by song, not by repeat).
- Output VALID JSON only. No commentary before or after.

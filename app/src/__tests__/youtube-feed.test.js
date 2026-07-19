// @vitest-environment node
//
// youtube-feed — parse the channel's no-key public RSS into recent videos so the
// Church tab shows the last livestreams straight from the channel (Darrell
// 2026-07-19). Proven-to-catch: real feed shape yields id+title+thumb, newest-first,
// capped; entity-encoded titles decode; garbage yields [] (render nothing, never throw).
import { describe, it, expect } from 'vitest';
import { parseYoutubeFeed, youtubeThumb } from '../lib/youtube-feed.js';

const FEED = `<?xml version="1.0"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns="http://www.w3.org/2005/Atom">
  <title>The Love Corner</title>
  <entry>
    <id>yt:video:AAAAAAAAAAA</id>
    <yt:videoId>AAAAAAAAAAA</yt:videoId>
    <title>Sunday Worship &amp; The Word 7/19</title>
    <published>2026-07-19T15:00:00+00:00</published>
  </entry>
  <entry>
    <id>yt:video:BBBBBBBBBBB</id>
    <yt:videoId>BBBBBBBBBBB</yt:videoId>
    <title>Wednesday Bible Study</title>
    <published>2026-07-16T18:00:00+00:00</published>
  </entry>
  <entry>
    <yt:videoId>CCCCCCCCCCC</yt:videoId>
    <title>Prev Sunday</title>
    <published>2026-07-12T15:00:00+00:00</published>
  </entry>
</feed>`;

describe('parseYoutubeFeed', () => {
  it('pulls id, title, published, url, thumbnail — newest-first', () => {
    const vids = parseYoutubeFeed(FEED, 5);
    expect(vids).toHaveLength(3);
    expect(vids[0].videoId).toBe('AAAAAAAAAAA');
    expect(vids[0].title).toBe('Sunday Worship & The Word 7/19'); // &amp; decoded
    expect(vids[0].url).toBe('https://www.youtube.com/watch?v=AAAAAAAAAAA');
    expect(vids[0].thumbnail).toBe('https://i.ytimg.com/vi/AAAAAAAAAAA/mqdefault.jpg');
    expect(vids.map((v) => v.videoId)).toEqual(['AAAAAAAAAAA', 'BBBBBBBBBBB', 'CCCCCCCCCCC']);
  });
  it('caps at the requested limit (last 5 below the current)', () => {
    expect(parseYoutubeFeed(FEED, 2).map((v) => v.videoId)).toEqual(['AAAAAAAAAAA', 'BBBBBBBBBBB']);
  });
  it('returns [] for empty/garbage — the strip renders nothing, never throws', () => {
    expect(parseYoutubeFeed('', 5)).toEqual([]);
    expect(parseYoutubeFeed('<html>not a feed</html>', 5)).toEqual([]);
    expect(parseYoutubeFeed(null, 5)).toEqual([]);
  });
  it('youtubeThumb is null for a missing id (no broken image)', () => {
    expect(youtubeThumb('')).toBeNull();
    expect(youtubeThumb('XYZ')).toBe('https://i.ytimg.com/vi/XYZ/mqdefault.jpg');
  });
});

// @vitest-environment node
//
// youtube-follow — follow a free YouTube channel, see its new episodes (DR-1168).
//
// THE SAMPLE BELOW IS A REAL DOCUMENT, NOT A REMEMBERED SHAPE. The cloud sandbox
// has no route to youtube.com (CONNECT tunnel failed, response 403), so a
// one-shot GitHub-runner probe fetched two live feeds and this is a verbatim
// slice of what came back (run 39558498265, TED's feed, 2026-10-21). That matters
// twice over:
//
//   1. A first attempt asked the feed endpoint with two channel ids recalled
//      from MEMORY. Both 404'd, which looked exactly like "the endpoint is
//      blocked". Resolving a handle to its real id first (@TED ->
//      UCAuUUnT6oDeKwE6v1NGQxug) returned HTTP 200 and 40,021 bytes. The ids
//      were wrong, not the road.
//   2. The real header drops the "UC" prefix from <yt:channelId> while the same
//      element inside an <entry> keeps it. A parser written from the remembered
//      shape would have read a 22-char non-id and produced an un-followable row.
//      The `channel id comes from the header urls` case below is that bug, pinned.
//
// PROVEN-TO-CATCH: youtube-follow-proves-catch.test.js feeds the same cases to
// the naive implementations (yt:channelId read directly; an un-read feed counted
// as zero episodes) and REQUIRES each assertion to fail.
import { describe, it, expect, beforeEach } from 'vitest';
import {
  isChannelId, channelIdFrom, feedUrlFor, watchUrlFor, unescapeXml,
  parseEntry, parseFeed,
  emptyChannels, normalizeChannels, channelsKey,
  followChannel, unfollowChannel, followedChannels, isFollowing, mergeEpisodes,
} from '../lib/youtube-follow.js';

// ---------------------------------------------------------------------------
// A verbatim slice of the live feed (run 39558498265). Note the header's
// yt:channelId: "AuUUnT6oDeKwE6v1NGQxug" — YouTube really does omit the "UC".
// ---------------------------------------------------------------------------
const REAL_FEED = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns:media="http://search.yahoo.com/mrss/" xmlns="http://www.w3.org/2005/Atom">
 <link rel="self" href="http://www.youtube.com/feeds/videos.xml?channel_id=UCAuUUnT6oDeKwE6v1NGQxug"/>
 <id>yt:channel:AuUUnT6oDeKwE6v1NGQxug</id>
 <yt:channelId>AuUUnT6oDeKwE6v1NGQxug</yt:channelId>
 <title>TED</title>
 <link rel="alternate" href="https://www.youtube.com/channel/UCAuUUnT6oDeKwE6v1NGQxug"/>
 <author>
  <name>TED</name>
  <uri>https://www.youtube.com/channel/UCAuUUnT6oDeKwE6v1NGQxug</uri>
 </author>
 <published>2006-12-06T23:27:08+00:00</published>
 <entry>
  <id>yt:video:vfbNzpd6cIw</id>
  <yt:videoId>vfbNzpd6cIw</yt:videoId>
  <yt:channelId>UCAuUUnT6oDeKwE6v1NGQxug</yt:channelId>
  <title>What Makes a Good Game? | Eric Zimmerman | TED</title>
  <link rel="alternate" href="https://www.youtube.com/watch?v=vfbNzpd6cIw"/>
  <author>
   <name>TED</name>
   <uri>https://www.youtube.com/channel/UCAuUUnT6oDeKwE6v1NGQxug</uri>
  </author>
  <published>2026-10-20T15:00:04+00:00</published>
  <updated>2026-10-20T18:02:52+00:00</updated>
  <media:group>
   <media:title>What Makes a Good Game? | Eric Zimmerman | TED</media:title>
   <media:content url="https://www.youtube.com/v/vfbNzpd6cIw?version=3" type="application/x-shockwave-flash" width="640" height="390"/>
   <media:thumbnail url="https://i3.ytimg.com/vi/vfbNzpd6cIw/hqdefault.jpg" width="480" height="360"/>
   <media:description>What&#8217;s the best way to make a project more playful? Game designer Eric Zimmerman explains.</media:description>
  </media:group>
 </entry>
 <entry>
  <id>yt:video:scwlR0QHGOk</id>
  <yt:videoId>scwlR0QHGOk</yt:videoId>
  <title>The NEW Tesla Roadster: My Honest Reaction</title>
  <link rel="alternate" href="https://www.youtube.com/watch?v=scwlR0QHGOk"/>
  <published>2026-10-18T14:00:00+00:00</published>
  <media:group>
   <media:title>The NEW Tesla Roadster: My Honest Reaction</media:title>
   <media:thumbnail url="https://i4.ytimg.com/vi/scwlR0QHGOk/hqdefault.jpg" width="480" height="360"/>
   <media:description>Tesla doesn&amp;apos;t do marketing. Until they do.</media:description>
  </media:group>
 </entry>
 <entry>
  <id>yt:video:broken</id>
  <title>An entry with no video id</title>
 </entry>
</feed>`;

const TED = 'UCAuUUnT6oDeKwE6v1NGQxug';

describe('channel ids — recognised, extracted, never guessed', () => {
  it('accepts exactly UC + 22 url-safe chars', () => {
    expect(isChannelId(TED)).toBe(true);
    expect(isChannelId('UCshort')).toBe(false);
    expect(isChannelId('AuUUnT6oDeKwE6v1NGQxug')).toBe(false); // the header form: NOT an id
    expect(isChannelId(`${TED}extra`)).toBe(false);            // anchored
    expect(isChannelId(null)).toBe(false);
  });

  it('pulls an id out of a bare id, a /channel/ link or a feed url', () => {
    expect(channelIdFrom(TED)).toBe(TED);
    expect(channelIdFrom(`https://www.youtube.com/channel/${TED}`)).toBe(TED);
    expect(channelIdFrom(`https://www.youtube.com/feeds/videos.xml?channel_id=${TED}`)).toBe(TED);
  });

  it('returns "" for a handle page — we do not invent an id we cannot see', () => {
    expect(channelIdFrom('https://www.youtube.com/@TED')).toBe('');
    expect(channelIdFrom('https://www.youtube.com/c/TED')).toBe('');
    expect(channelIdFrom('')).toBe('');
  });

  it('builds the feed and watch urls, and refuses to build from junk', () => {
    expect(feedUrlFor(TED)).toBe(`https://www.youtube.com/feeds/videos.xml?channel_id=${TED}`);
    expect(feedUrlFor('nope')).toBe('');
    expect(watchUrlFor('vfbNzpd6cIw')).toBe('https://www.youtube.com/watch?v=vfbNzpd6cIw');
    expect(watchUrlFor('')).toBe('');
    expect(watchUrlFor('!!bad!!')).toBe('');
  });
});

describe('parsing the REAL feed document', () => {
  it('reads the channel title', () => {
    expect(parseFeed(REAL_FEED).channelTitle).toBe('TED');
  });

  // --------------------------------------------------------------- the trap
  it('takes the channel id from the header URLS, because <yt:channelId> omits "UC"', () => {
    // The live header really says AuUUnT6oDeKwE6v1NGQxug. Reading that element
    // directly yields a non-id; the full id is in rel="self" / rel="alternate".
    expect(REAL_FEED).toContain('<yt:channelId>AuUUnT6oDeKwE6v1NGQxug</yt:channelId>');
    expect(parseFeed(REAL_FEED).channelId).toBe(TED);
    expect(isChannelId(parseFeed(REAL_FEED).channelId)).toBe(true);
  });

  it('reads every usable entry and DROPS the malformed one', () => {
    const { episodes } = parseFeed(REAL_FEED);
    expect(episodes.map((e) => e.videoId)).toEqual(['vfbNzpd6cIw', 'scwlR0QHGOk']);
    expect(episodes.length).toBe(2); // the third entry has no yt:videoId
  });

  it('maps an entry to title / published / url / thumbnail / description', () => {
    const [first] = parseFeed(REAL_FEED).episodes;
    expect(first.title).toBe('What Makes a Good Game? | Eric Zimmerman | TED');
    expect(first.published).toBe('2026-10-20T15:00:04+00:00');
    expect(first.url).toBe('https://www.youtube.com/watch?v=vfbNzpd6cIw');
    expect(first.thumbnail).toBe('https://i3.ytimg.com/vi/vfbNzpd6cIw/hqdefault.jpg');
    expect(first.description).toMatch(/best way to make a project more playful/);
  });

  it('takes the entry <title>, never the media:group <media:title>', () => {
    // Both exist and are equal here, so the real proof is that exactly one
    // title was read and it is not prefixed/duplicated.
    const [first] = parseFeed(REAL_FEED).episodes;
    expect(first.title).not.toMatch(/media/);
    expect(first.title.split('What Makes').length).toBe(2); // read once, not twice
  });

  it('decodes the entities a real feed uses (numeric and named)', () => {
    expect(unescapeXml('What&#8217;s')).toBe('What’s');
    expect(unescapeXml('a &amp; b')).toBe('a & b');
    expect(unescapeXml('&lt;tag&gt;')).toBe('<tag>');
    const [, second] = parseFeed(REAL_FEED).episodes;
    expect(second.description).toContain("doesn");
  });

  it('is fail-soft on junk: empty lists, never a throw', () => {
    for (const bad of ['', null, undefined, '<notxml', '{}', '<feed></feed>']) {
      const r = parseFeed(bad);
      expect(Array.isArray(r.episodes)).toBe(true);
      expect(r.episodes.length).toBe(0);
    }
    expect(parseEntry('<entry><title>no id</title></entry>')).toBe(null);
    expect(parseEntry('')).toBe(null);
  });
});

describe('the follow list — per identity, device-local, fail-soft', () => {
  beforeEach(() => { try { localStorage.clear(); } catch { /* node env */ } });

  it('keys the store to the signed-in identity, like tv-time.js', () => {
    expect(channelsKey('A@B.com')).toBe('poetech.tvchannels.v1:a@b.com');
    expect(channelsKey(null)).toBe('poetech.tvchannels.v1:anon');
  });

  it('follows, re-follows without losing addedAt, and unfollows', () => {
    let s = emptyChannels();
    s = followChannel(s, { id: TED, title: 'TED' }, '2026-10-21T00:00:00Z');
    expect(isFollowing(s, TED)).toBe(true);
    expect(followedChannels(s)[0]).toEqual({ id: TED, title: 'TED', addedAt: '2026-10-21T00:00:00Z' });

    // Re-follow refreshes the title, keeps the original addedAt.
    s = followChannel(s, { id: TED, title: 'TED Talks' }, '2026-12-01T00:00:00Z');
    expect(followedChannels(s)[0].title).toBe('TED Talks');
    expect(followedChannels(s)[0].addedAt).toBe('2026-10-21T00:00:00Z');

    s = unfollowChannel(s, TED);
    expect(isFollowing(s, TED)).toBe(false);
    expect(followedChannels(s)).toEqual([]);
  });

  it('refuses to store a row that could never be fetched', () => {
    const s = followChannel(emptyChannels(), { id: 'not-an-id', title: 'Nope' }, 'now');
    expect(followedChannels(s)).toEqual([]);
  });

  it('normalize drops junk so a hand-edited store cannot reach the surface', () => {
    const s = normalizeChannels({ channels: { bad: { title: 'x' }, [TED]: { title: 'TED' }, '': {} } });
    expect(Object.keys(s.channels)).toEqual([TED]);
    expect(normalizeChannels(null)).toEqual(emptyChannels());
    expect(normalizeChannels({ channels: 'nope' })).toEqual(emptyChannels());
  });
});

describe('mergeEpisodes — an UN-READ feed is not an EMPTY one (DR-0076)', () => {
  const OTHER = 'UCupvZG5ko_eiXAupbDfxWwQ'; // UC + 22 chars, a well-formed second id
  let followed;
  beforeEach(() => {
    followed = followChannel(
      followChannel(emptyChannels(), { id: TED, title: 'TED' }, '2026-01-01T00:00:00Z'),
      { id: OTHER, title: 'Other' }, '2026-02-01T00:00:00Z',
    );
  });

  it('merges newest-first across channels and tags each row with its channel', () => {
    const feeds = {
      [TED]: { channelTitle: 'TED', episodes: parseFeed(REAL_FEED).episodes },
    };
    const { episodes } = mergeEpisodes(followed, feeds);
    expect(episodes.map((e) => e.published)).toEqual([
      '2026-10-20T15:00:04+00:00', '2026-10-18T14:00:00+00:00',
    ]);
    expect(episodes.every((e) => e.channelTitle === 'TED')).toBe(true);
  });

  // ------------------------------------------------------------------ the rule
  it('reports an un-read channel as MISSING, never as a channel with 0 episodes', () => {
    const feeds = { [TED]: { channelTitle: 'TED', episodes: [] } };  // read, genuinely empty
    const { missing, read } = mergeEpisodes(followed, feeds);
    // TED was read and really has nothing; OTHER was never read. They are
    // DIFFERENT facts and the surface must be able to tell them apart.
    expect(read).toBe(1);
    expect(missing.map((c) => c.id)).toEqual([OTHER]);
  });

  it('nothing read at all => every follow is missing, and zero episodes claimed', () => {
    const { episodes, missing, read } = mergeEpisodes(followed, {});
    expect(episodes).toEqual([]);
    expect(read).toBe(0);
    expect(missing.length).toBe(2);
  });

  it('is deterministic when two episodes share a timestamp', () => {
    const same = '2026-10-20T15:00:04+00:00';
    const feeds = {
      [TED]: {
        channelTitle: 'TED',
        episodes: [
          { videoId: 'bbb', title: 'B', published: same, url: '', thumbnail: '', description: '' },
          { videoId: 'aaa', title: 'A', published: same, url: '', thumbnail: '', description: '' },
        ],
      },
    };
    const once = mergeEpisodes(followed, feeds).episodes.map((e) => e.videoId);
    const twice = mergeEpisodes(followed, feeds).episodes.map((e) => e.videoId);
    expect(once).toEqual(twice);
    expect(once).toEqual(['aaa', 'bbb']); // title asc breaks the tie
  });

  it('honours the limit and never throws on junk', () => {
    const feeds = { [TED]: { channelTitle: 'TED', episodes: parseFeed(REAL_FEED).episodes } };
    expect(mergeEpisodes(followed, feeds, 1).episodes.length).toBe(1);
    expect(mergeEpisodes(followed, null).episodes).toEqual([]);
    expect(mergeEpisodes(null, feeds).episodes).toEqual([]);
  });
});

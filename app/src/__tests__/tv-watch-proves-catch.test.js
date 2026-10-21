// @vitest-environment node
//
// PROVEN-TO-CATCH for DR-1168 (DR-0076 §3: a gate that always passes is itself
// a lie). Each case re-implements the WRONG version of a behaviour and REQUIRES
// the guarding assertion to fail against it. If one of these ever stops failing,
// the assertion in the sibling test has stopped meaning anything.
//
// The four breaks pinned here are not hypothetical. Three of them are mistakes
// that were actually made during this build and caught by measurement:
//
//   1. "not available" instead of unknown — the exact phrasing DR-0076 forbids,
//      and the one a reasonable author writes without thinking.
//   2. Pluto TV's `/search/<q>` path form — MY FIRST GUESS. A GitHub-runner
//      probe showed it silently serves the home page and drops the query.
//   3. Reading the feed's <yt:channelId> directly — the live document omits the
//      "UC" prefix there, so the naive read yields an un-followable row.
//   4. Counting an UN-READ feed as a channel with zero episodes — collapsing
//      "we could not look" into "there is nothing", which is the same class of
//      defect as DR-1053's "you are not on the roster".
import { describe, it, expect } from 'vitest';
import { whereToWatch, FREE_SERVICES } from '../lib/tv-where-to-watch.js';
import { parseFeed, followChannel, emptyChannels, mergeEpisodes, channelIdFrom } from '../lib/youtube-follow.js';

const TED = 'UCAuUUnT6oDeKwE6v1NGQxug';

// A verbatim slice of the live header (run 39558498265): yt:channelId has no "UC".
const REAL_HEADER = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns:media="http://search.yahoo.com/mrss/" xmlns="http://www.w3.org/2005/Atom">
 <link rel="self" href="http://www.youtube.com/feeds/videos.xml?channel_id=${TED}"/>
 <id>yt:channel:AuUUnT6oDeKwE6v1NGQxug</id>
 <yt:channelId>AuUUnT6oDeKwE6v1NGQxug</yt:channelId>
 <title>TED</title>
 <link rel="alternate" href="https://www.youtube.com/channel/${TED}"/>
 <entry>
  <yt:videoId>vfbNzpd6cIw</yt:videoId>
  <title>An episode</title>
  <published>2026-10-20T15:00:04+00:00</published>
 </entry>
</feed>`;

describe('break 1: "not available" instead of unknown', () => {
  // The wrong transform: no answer is reported as a NO.
  const wrongWhereToWatch = (meta) => {
    const service = (meta && meta.webChannel) || '';
    return service
      ? { state: 'streaming', service, say: `Streaming on ${service}.` }
      : { state: 'none', service: '', say: 'Not available on any streaming service.' };
  };

  it('the real transform says unknown; the wrong one says not available', () => {
    const meta = { id: '1', title: 'Imported Show', network: '' };

    // The assertion that guards the real code.
    const assertUnknownIsNotANo = (w) => {
      expect(w.say.toLowerCase()).not.toContain('not available');
      expect(w.state).not.toBe('none');
    };

    assertUnknownIsNotANo(whereToWatch(meta));          // real code: passes
    expect(() => assertUnknownIsNotANo(wrongWhereToWatch(meta))).toThrow(); // wrong code: CAUGHT
  });
});

describe('break 2: Pluto TV’s path form, which silently drops the query', () => {
  // My first guess, measured wrong: https://pluto.tv/en/search/<q> served the
  // home page and ignored the title entirely.
  const wrongPluto = (q) => `https://pluto.tv/en/search/${encodeURIComponent(q)}`;

  it('the shipped route carries the query in ?q=; the wrong one does not', () => {
    const real = FREE_SERVICES.find((s) => s.key === 'pluto').search('The Office');

    const assertQueryIsInTheParam = (url) => {
      expect(url).toContain('?q=The%20Office');
      expect(url).not.toMatch(/\/search\/The/);
    };

    assertQueryIsInTheParam(real);                                   // shipped: passes
    expect(() => assertQueryIsInTheParam(wrongPluto('The Office'))).toThrow(); // CAUGHT
  });
});

describe('break 3: reading <yt:channelId> directly, which omits the "UC"', () => {
  // The naive parser: take the element the feed appears to offer for this.
  const wrongChannelId = (xml) => {
    const m = /<yt:channelId>([^<]+)<\/yt:channelId>/.exec(xml || '');
    return m ? m[1] : '';
  };

  it('the real parser returns a usable id; the naive read returns a non-id', () => {
    const assertUsableId = (id) => {
      expect(id).toBe(TED);
      expect(channelIdFrom(id)).toBe(TED);
    };

    assertUsableId(parseFeed(REAL_HEADER).channelId);                 // real: passes
    expect(() => assertUsableId(wrongChannelId(REAL_HEADER))).toThrow(); // CAUGHT

    // And name exactly what the naive read produced, so the trap is on record.
    expect(wrongChannelId(REAL_HEADER)).toBe('AuUUnT6oDeKwE6v1NGQxug');
    expect(channelIdFrom(wrongChannelId(REAL_HEADER))).toBe('');
  });
});

describe('break 4: an un-read feed counted as a channel with zero episodes', () => {
  // The wrong merge: every follow contributes whatever is in the map, and a
  // channel with no fetched entry is simply treated as having no episodes.
  const wrongMerge = (state, byChannel) => {
    const rows = [];
    for (const ch of Object.values(state.channels)) {
      const got = (byChannel || {})[ch.id] || { episodes: [] };   // <-- the lie
      for (const ep of got.episodes) rows.push(ep);
    }
    return { episodes: rows, missing: [], read: Object.keys(state.channels).length };
  };

  it('the real merge reports the un-read channel; the wrong one hides it', () => {
    const OTHER = 'UCupvZG5ko_eiXAupbDfxWwQ';
    const followed = followChannel(
      followChannel(emptyChannels(), { id: TED, title: 'TED' }, '2026-01-01T00:00:00Z'),
      { id: OTHER, title: 'Other' }, '2026-02-01T00:00:00Z',
    );
    const feeds = { [TED]: { channelTitle: 'TED', episodes: parseFeed(REAL_HEADER).episodes } };

    const assertUnreadIsNamed = (r) => {
      expect(r.missing.map((c) => c.id)).toEqual([OTHER]);
      expect(r.read).toBe(1);
    };

    assertUnreadIsNamed(mergeEpisodes(followed, feeds));             // real: passes
    expect(() => assertUnreadIsNamed(wrongMerge(followed, feeds))).toThrow(); // CAUGHT
  });
});

describe('break 5: shipping Freevee, a service that no longer exists', () => {
  // Darrell named Freevee, and a reasonable build ships it. Its home 404s
  // (measured, run 39558010050): Amazon folded it into Prime Video in 2025.
  const wrongServices = [
    ...FREE_SERVICES,
    { key: 'freevee', name: 'Freevee', kind: 'search', search: (q) => `https://www.amazon.com/adlp/freevee?k=${q}` },
  ];

  it('the shipped list has no Freevee; a list that adds it is caught', () => {
    const assertNoDeadService = (list) => {
      expect(JSON.stringify(list).toLowerCase()).not.toContain('freevee');
    };

    assertNoDeadService(FREE_SERVICES);                              // shipped: passes
    expect(() => assertNoDeadService(wrongServices)).toThrow();      // CAUGHT
  });
});

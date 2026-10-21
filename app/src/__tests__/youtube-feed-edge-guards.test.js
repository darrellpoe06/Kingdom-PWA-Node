// @vitest-environment node
//
// /api/youtube-feed — the edge road's SAFETY DECISIONS (DR-1168).
//
// The handler itself cannot run here (no `caches.default`, no edge runtime), but
// the two decisions that keep it from becoming something it should not be CAN,
// and those are the part that deserves a standing gate rather than a check
// somebody ran once by hand.
//
// WHY THIS MATTERS. The function takes a URL from the caller. That is the shape
// of an open proxy and of a server-side request forgery, so the host allow-list
// is the whole defence: a family app's edge must not be usable to fetch
// `169.254.169.254`, a lookalike domain, or a `file://` path. The `channel_id`
// form is safer still — the feed url is built by us from a validated id and the
// caller's string never becomes a url at all.
import { describe, it, expect } from 'vitest';
import { isYouTubePage, channelIdFromPage, CHANNEL_ID } from '../../functions/api/youtube-feed.js';

const TED = 'UCAuUUnT6oDeKwE6v1NGQxug';

describe('the channel-id shape is exact', () => {
  it('accepts only UC + 22 url-safe characters, anchored', () => {
    expect(CHANNEL_ID.test(TED)).toBe(true);
    // The live feed header's own form omits the "UC" — it must NOT pass here,
    // or the function would build a 404-ing feed url from it.
    expect(CHANNEL_ID.test('AuUUnT6oDeKwE6v1NGQxug')).toBe(false);
    for (const bad of [
      'UCshort', `${TED}extra`, `${TED}&x=1`, `${TED}/../../x`,
      '../../etc/passwd', 'UC../../../etc/passwd/xxxxx', '', 'UC' + 'a'.repeat(21),
    ]) {
      expect(CHANNEL_ID.test(bad), `${bad} must be rejected`).toBe(false);
    }
  });
});

describe('the host allow-list is the whole defence against an open proxy', () => {
  it('allows only YouTube channel pages', () => {
    for (const ok of [
      'https://www.youtube.com/@TED',
      'https://youtube.com/c/Google',
      'https://m.youtube.com/@someone',
      'https://youtu.be/abc',
      'http://youtube.com/@TED',
    ]) expect(isYouTubePage(ok), `${ok} should be allowed`).toBe(true);
  });

  it('refuses a lookalike domain, a non-http scheme and the cloud metadata address', () => {
    for (const bad of [
      'https://youtube.com.evil.com/x',          // subdomain trick
      'https://www.youtube.com.attacker.net/@x', // suffix trick
      'https://notyoutube.com/@TED',             // prefix trick
      'https://evil.com/?x=youtube.com',         // the name only in the query
      'http://169.254.169.254/latest/meta-data/',// cloud metadata — the SSRF prize
      'http://127.0.0.1:8080/',                  // loopback
      'http://[::1]/',                           // loopback, v6
      'file:///etc/passwd',                       // not http at all
      'javascript:alert(1)',
      'ftp://youtube.com/x',
      '//youtube.com/@TED',                      // scheme-relative: not a URL
      'youtube.com/@TED',                        // bare host: not a URL
      '', 'not a url', null, undefined,
    ]) expect(isYouTubePage(bad), `${JSON.stringify(bad)} must be refused`).toBe(false);
  });
});

describe('reading a channel id out of a channel page', () => {
  it('finds it in the page’s own RSS link, canonical url or embedded json', () => {
    // The form MEASURED on the live page (run 39558498265): @Google carried
    // channel_id=UCK8sQmJBp8GCxrOtXWBpyEA in its own feed link.
    expect(channelIdFromPage(`<link rel="alternate" type="application/rss+xml" href="https://www.youtube.com/feeds/videos.xml?channel_id=${TED}">`)).toBe(TED);
    expect(channelIdFromPage(`<link rel="canonical" href="https://www.youtube.com/channel/${TED}">`)).toBe(TED);
    expect(channelIdFromPage(`{"channelId":"${TED}"}`)).toBe(TED);
    expect(channelIdFromPage(`{"externalId":"${TED}"}`)).toBe(TED);
    expect(channelIdFromPage(`<a href="/channel/${TED}">x</a>`)).toBe(TED);
  });

  it('returns "" rather than inventing an id it cannot see', () => {
    for (const none of ['', null, undefined, '<html>no id here</html>', '{"channelId":"UCshort"}', 'channel_id=AuUUnT6oDeKwE6v1NGQxug']) {
      expect(channelIdFromPage(none)).toBe('');
    }
  });

  it('never returns something the id guard would reject', () => {
    const got = channelIdFromPage(`<a href="/channel/${TED}">x</a>`);
    expect(CHANNEL_ID.test(got)).toBe(true);
  });
});

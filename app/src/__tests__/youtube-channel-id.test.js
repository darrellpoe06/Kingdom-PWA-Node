// @vitest-environment node
//
// /api/youtube-channel-id — the ONE new road, and its safety decisions (DR-1168).
//
// WHY THIS ROUTE IS SMALL. The feed itself is already served by
// `/api/church-recent?channel=UC…`, the Church tab's same-origin proxy (live
// since 2026-07-19). An earlier draft of DR-1168 shipped a SECOND proxy doing the
// identical job — same `UC`+22 guard, same server-built feed url, same ~10-minute
// Cache API, same User-Agent — and only the merge of main revealed the original.
// Two roads to one truth drift (DR-0621; DR-1151 and DR-1152 are the same lesson
// paid for twice), so the duplicate is deleted and what remains is the one thing
// nothing on main could do: turn a pasted `youtube.com/@handle` into a channel id.
//
// WHAT A TEST CAN ACTUALLY RUN. The handler needs `caches.default` and an edge
// runtime, so it cannot be invoked here — but its SAFETY DECISIONS can, and those
// are the part that deserves a standing gate rather than a check somebody ran by
// hand. The route takes a URL from the caller, which is the shape of an open proxy
// and of a server-side request forgery, so the host allow-list IS the defence.
import { describe, it, expect } from 'vitest';
import { isYouTubePage, channelIdFromPage, CHANNEL_ID } from '../../functions/api/youtube-channel-id.js';

const TED = 'UCAuUUnT6oDeKwE6v1NGQxug';

describe('the channel-id shape is exact', () => {
  it('accepts only UC + 22 url-safe characters, anchored', () => {
    expect(CHANNEL_ID.test(TED)).toBe(true);
    // The live feed header's own form OMITS the "UC" (measured, run 39558498265).
    // It must not pass here, or church-recent would be handed a 404-ing id.
    expect(CHANNEL_ID.test('AuUUnT6oDeKwE6v1NGQxug')).toBe(false);
    for (const bad of [
      'UCshort', `${TED}extra`, `${TED}&channel=x`, `${TED}/../../x`,
      '../../etc/passwd', '', `UC${'a'.repeat(21)}`,
    ]) expect(CHANNEL_ID.test(bad), `${bad} must be rejected`).toBe(false);
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
      'https://youtube.com.evil.com/x',           // subdomain trick
      'https://www.youtube.com.attacker.net/@x',  // suffix trick
      'https://notyoutube.com/@TED',              // prefix trick
      'https://evil.com/?x=youtube.com',          // the name only in the query
      'http://169.254.169.254/latest/meta-data/', // cloud metadata — the SSRF prize
      'http://127.0.0.1:8080/',                   // loopback
      'http://[::1]/',                            // loopback, v6
      'file:///etc/passwd',
      'javascript:alert(1)',
      'ftp://youtube.com/x',
      '//youtube.com/@TED',                       // scheme-relative: not a URL
      'youtube.com/@TED',                         // bare host: not a URL
      '', 'not a url', null, undefined,
    ]) expect(isYouTubePage(bad), `${JSON.stringify(bad)} must be refused`).toBe(false);
  });
});

describe('reading a channel id out of a channel page', () => {
  it('finds it in the page’s own RSS link, canonical url or embedded json', () => {
    // The form MEASURED on the live page (run 39558498265): youtube.com/@Google
    // returned 200 and carried channel_id=UCK8sQmJBp8GCxrOtXWBpyEA.
    expect(channelIdFromPage(`<link rel="alternate" type="application/rss+xml" href="https://www.youtube.com/feeds/videos.xml?channel_id=${TED}">`)).toBe(TED);
    expect(channelIdFromPage(`<link rel="canonical" href="https://www.youtube.com/channel/${TED}">`)).toBe(TED);
    expect(channelIdFromPage(`{"channelId":"${TED}"}`)).toBe(TED);
    expect(channelIdFromPage(`{"externalId":"${TED}"}`)).toBe(TED);
    expect(channelIdFromPage(`<a href="/channel/${TED}">x</a>`)).toBe(TED);
  });

  it('returns "" rather than inventing an id it cannot see', () => {
    for (const none of [
      '', null, undefined, '<html>no id here</html>',
      '{"channelId":"UCshort"}',
      'channel_id=AuUUnT6oDeKwE6v1NGQxug',   // the UC-less form again
    ]) expect(channelIdFromPage(none)).toBe('');
  });

  it('never returns something the id guard would reject', () => {
    const got = channelIdFromPage(`<a href="/channel/${TED}">x</a>`);
    expect(CHANNEL_ID.test(got)).toBe(true);
  });
});

describe('the duplicate road is gone, and stays gone', () => {
  it('there is no second YouTube feed proxy beside /api/church-recent', async () => {
    const { existsSync } = await import('node:fs');
    const { join, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const fns = join(dirname(fileURLToPath(import.meta.url)), '../../functions/api');
    // church-recent is the feed road. A file reintroducing a parallel one is the
    // regression this case exists to stop.
    expect(existsSync(join(fns, 'church-recent.js'))).toBe(true);
    expect(existsSync(join(fns, 'youtube-feed.js'))).toBe(false);
  });
});

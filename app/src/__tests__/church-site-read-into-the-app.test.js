// =============================================================================
// The church website is read into the app (DR-1550): the parser on the site's
// REAL markup (captured by church-site-probe.yml on 2026-11-18), the digest the
// surfaces render, the loader's honesty when a page fails, and the relay's
// walls (one host, listed pages, pictures only under the site's own uploads).
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  siteIsTheChurchs,
  textOf,
  monthFrom,
  assetSrc,
  flyerName,
  parseChurchPage,
  digestChurchSite,
  digestHasNews,
  loadChurchSite,
} from '../lib/church-site.js';
import { pageUrl, assetUrl, contentRegion, uploadPictures, PAGES } from '../../functions/api/church-site.js';

// Captured from https://www.thechurchofthelivinggod.com/calendar.html, 2026-11-18 14:48Z (runner log).
const CALENDAR_HTML = `<div id="wsite-content" class="wsite-elements wsite-not-footer">
\t<div class="wsite-section-wrap">
\t<div class="wsite-section wsite-body-section wsite-section-bg-color wsite-background-165" style="background-color: #ffffff;background-image: none;" >
\t\t<div class="wsite-section-content">
\t\t\t\t\t<div class="container">
\t\t\t<div class="wsite-section-elements">
\t\t\t\t<h2 class="wsite-content-title" style="text-align:center;"><font color="#a82e2e" size="7">november 2026</font></h2>

<div><div class="wsite-image wsite-image-border-none " style="padding-top:10px;padding-bottom:10px;margin-left:0px;margin-right:0px;text-align:right">
<a>
<img src="/uploads/6/0/6/7/6067835/11-november-2026-calendar_orig.jpg" alt="Picture" style="width:auto;max-width:100%" />
</a>
<div style="display:block;font-size:90%"></div>
</div></div>
\t\t\t</div>
\t\t</div>
\t\t\t\t</div>
\t</div>
</div>`;
const LETTER_HTML = `<div id="wsite-content"><div class="wsite-section-elements"><div><div class="wsite-image wsite-image-border-none " style="text-align:center">
<a>
<img src="/uploads/6/0/6/7/6067835/october-2026-letter_orig.jpg" alt="Picture" style="width:auto;max-width:100%" />
</a>
<div style="display:block;font-size:90%"></div>
</div></div></div></div>`;
const EVENTS_HTML = `<div id="wsite-content"><h2 class="wsite-content-title" style="text-align:center;">Current Events</h2>
<div class="paragraph">At The Church Of The Living God, we know that church is more than just Sunday service! That&rsquo;s why we offer powerful, spirit-filled programming throughout the week.</div>
<div class="paragraph">Take a look at what&rsquo;s happening now at The Love Corner .</div>
<div id='595716572137909136-slideshow'></div></div>`;
const HOME_HTML = `<div id="wsite-content"><div class="paragraph" style="text-align:center;"><strong><font color="#2a2a2a"><font size="4"><u>&#8203;&#8203;JOIN US IN-PERSON OR ONLINE</u></font></font></strong><strong><font color="#2a2a2a"><font size="4"><br /><br /><br />SUNDAY WORSHIP EXPERIENCE : 11:00 AM&nbsp;&nbsp;<br /><br />WEDNESDAY BIBLE STUDY : 1:00 &amp; 6:00 PM&nbsp;<br /><br /></font></font></strong></div></div>`;
// A whole page as the relay sees it: head metas, nav, content, footer, a slideshow script naming the flyers.
const WHOLE_PAGE = `<!DOCTYPE html><html><head><title>CURRENT EVENTS - THE LOVE CORNER</title>
<meta property="og:image" content="https://www.thechurchofthelivinggod.com/uploads/6/0/6/7/6067835/battle-cry-sunday-veterans-flyer-3.jpg" />
<meta property="og:image" content="https://www.thechurchofthelivinggod.com/uploads/6/0/6/7/6067835/editor/na-logo-background-removed.png?1719990644" />
<meta property="og:image" content="https://www.thechurchofthelivinggod.com/uploads/6/0/6/7/6067835/published/icons8-call-100.png?1719991713" />
<script>var nav = 1;</script></head><body><div class="wsite-menu-wrap"><a href="/calendar.html">CALENDAR</a></div>
${EVENTS_HTML}
<script>_W.slideshows = [{"images":[{"url":"/uploads/6/0/6/7/6067835/battle-cry-sunday-veterans-flyer-3.jpg"},{"url":"/uploads/6/0/6/7/6067835/thanksgiving-dinner-2026.jpg"}]}];</script>
<div id="footer"><div class="paragraph">CONTACT US 312 E. Bradley Avenue</div></div></body></html>`;

const relay = (page, html, images = []) => ({
  page,
  url: `https://www.thechurchofthelivinggod.com/${page}.html`,
  fetchedAt: '2026-11-18T14:48:30.000Z',
  html,
  images,
});

describe("the parser reads the site's real markup", () => {
  it("knows the church's own website and no other", () => {
    expect(siteIsTheChurchs('https://thechurchofthelivinggod.com')).toBe(true);
    expect(siteIsTheChurchs('https://www.thechurchofthelivinggod.com/calendar.html')).toBe(true);
    expect(siteIsTheChurchs('https://example.org')).toBe(false);
    expect(siteIsTheChurchs('')).toBe(false);
  });
  it('turns markup into words: breaks kept, tags and entities gone', () => {
    expect(textOf('<strong>A&rsquo;s<br />B&nbsp;&amp; C</strong>')).toBe('A’s\nB & C');
  });
  it('finds the month in a heading or a file name', () => {
    expect(monthFrom('november 2026')).toEqual({ month: 11, year: 2026, label: 'November 2026' });
    expect(monthFrom('/uploads/6/0/6/7/6067835/october-2026-letter_orig.jpg').label).toBe('October 2026');
    expect(monthFrom('11-november-2026-calendar_orig.jpg').month).toBe(11);
    expect(monthFrom('no date here')).toBeNull();
  });
  it('names a flyer from its file and addresses a picture through the relay', () => {
    expect(flyerName('/uploads/6/0/6/7/6067835/battle-cry-sunday-veterans-flyer-3.jpg')).toBe('Battle Cry Sunday Veterans');
    expect(assetSrc('/uploads/6/0/6/7/6067835/x.jpg')).toBe('/api/church-site?asset=%2Fuploads%2F6%2F0%2F6%2F7%2F6067835%2Fx.jpg');
  });
  it('reads the calendar page: the month heading and the one calendar picture', () => {
    const p = parseChurchPage(relay('calendar', CALENDAR_HTML));
    expect(p.headings).toEqual(['november 2026']);
    expect(p.pictures).toEqual([{ path: '/uploads/6/0/6/7/6067835/11-november-2026-calendar_orig.jpg', alt: '' }]);
  });
  it('reads the letter, the events intro and the home service times', () => {
    expect(parseChurchPage(relay('letters-from-bg', LETTER_HTML)).pictures[0].path).toMatch(/october-2026-letter_orig\.jpg$/);
    const ev = parseChurchPage(relay('current-events', EVENTS_HTML));
    expect(ev.headings).toEqual(['Current Events']);
    expect(ev.paragraphs[0]).toMatch(/^At The Church Of The Living God, we know that church is more than just Sunday service! That’s why/);
    const home = parseChurchPage(relay('home', HOME_HTML));
    expect(home.paragraphs[0].split('\n')).toEqual([
      'JOIN US IN-PERSON OR ONLINE',
      'SUNDAY WORSHIP EXPERIENCE : 11:00 AM',
      'WEDNESDAY BIBLE STUDY : 1:00 & 6:00 PM',
    ]);
  });
  it('a relay answer that is not a page reads as nothing, never a crash', () => {
    expect(parseChurchPage(null).pictures).toEqual([]);
    expect(parseChurchPage({ html: 42, images: 'x' })).toMatchObject({ headings: [], paragraphs: [], pictures: [], images: [] });
  });
});

describe('the digest the surfaces render', () => {
  it('carries the month calendar, the latest letter, the flyers and the service times, each from its page', () => {
    const d = digestChurchSite({
      calendar: parseChurchPage(relay('calendar', CALENDAR_HTML)),
      letters: parseChurchPage(relay('letters-from-bg', LETTER_HTML)),
      events: parseChurchPage(
        relay('current-events', EVENTS_HTML, [
          '/uploads/6/0/6/7/6067835/battle-cry-sunday-veterans-flyer-3.jpg',
          '/uploads/6/0/6/7/6067835/thanksgiving-dinner-2026.jpg',
        ])
      ),
      home: parseChurchPage(relay('home', HOME_HTML)),
    });
    expect(d.calendar).toMatchObject({
      label: 'November 2026',
      path: '/uploads/6/0/6/7/6067835/11-november-2026-calendar_orig.jpg',
      sourceUrl: 'https://www.thechurchofthelivinggod.com/calendar.html',
    });
    expect(d.calendar.src).toBe(assetSrc(d.calendar.path));
    expect(d.letter).toMatchObject({ label: 'October 2026 letter', path: '/uploads/6/0/6/7/6067835/october-2026-letter_orig.jpg' });
    expect(d.events.flyers.map((f) => f.name)).toEqual(['Battle Cry Sunday Veterans', 'Thanksgiving Dinner 2026']);
    expect(d.events.intro).toMatch(/Take a look at what’s happening now/);
    expect(d.serviceTimes).toEqual(['SUNDAY WORSHIP EXPERIENCE : 11:00 AM', 'WEDNESDAY BIBLE STUDY : 1:00 & 6:00 PM']);
    expect(d.fetchedAt).toBe('2026-11-18T14:48:30.000Z');
    expect(digestHasNews(d)).toBe(true);
  });
  it('a page that did not read is null in the digest; nothing is invented', () => {
    const d = digestChurchSite({ calendar: null, letters: null, events: null, home: null });
    expect(d).toEqual({ calendar: null, letter: null, events: null, serviceTimes: [], fetchedAt: '' });
    expect(digestHasNews(d)).toBe(false);
    expect(digestHasNews(null)).toBe(false);
  });
  it('the loader asks the relay for the four pages and keeps going when one fails or times out', async () => {
    const asked = [];
    const fetchImpl = async (url) => {
      asked.push(url);
      if (url.includes('page=calendar')) return { ok: true, json: async () => relay('calendar', CALENDAR_HTML) };
      if (url.includes('page=letters-from-bg')) return { ok: false, status: 502, json: async () => ({ error: 'site-unreachable' }) };
      if (url.includes('page=current-events')) throw new Error('timeout');
      return { ok: true, json: async () => relay('home', HOME_HTML) };
    };
    const d = await loadChurchSite({ fetchImpl, timeoutMs: 50 });
    expect(asked.sort()).toEqual([
      '/api/church-site?page=calendar',
      '/api/church-site?page=current-events',
      '/api/church-site?page=home',
      '/api/church-site?page=letters-from-bg',
    ]);
    expect(d.calendar.label).toBe('November 2026');
    expect(d.letter).toBeNull();
    expect(d.events).toBeNull();
    expect(d.serviceTimes.length).toBe(2);
  });
  it('without a fetch at all the loader answers an empty digest', async () => {
    expect(digestHasNews(await loadChurchSite({ fetchImpl: null }))).toBe(false);
  });
});

describe("the relay's walls (functions/api/church-site.js)", () => {
  it('serves only the listed pages of the one host', () => {
    expect(Object.keys(PAGES).sort()).toEqual(['calendar', 'current-events', 'home', 'letters-from-bg', 'previous-events']);
    expect(pageUrl('calendar')).toBe('https://www.thechurchofthelivinggod.com/calendar.html');
    expect(pageUrl('home')).toBe('https://www.thechurchofthelivinggod.com/');
    for (const bad of ['', 'admin', '../etc', 'https://evil.example/', 'calendar.html', null]) expect(pageUrl(bad)).toBeNull();
  });
  it("serves a picture only under the site's own /uploads/ with a picture extension", () => {
    expect(assetUrl('/uploads/6/0/6/7/6067835/11-november-2026-calendar_orig.jpg')).toBe(
      'https://www.thechurchofthelivinggod.com/uploads/6/0/6/7/6067835/11-november-2026-calendar_orig.jpg'
    );
    for (const bad of [
      '/uploads/6/0/6/7/6067835/../../x.jpg',
      '/uploads/6/0/6/7/6067835//x.jpg',
      'https://evil.example/uploads/6/0/6/7/6067835/x.jpg',
      '/uploads/6/0/6/7/6067835/x.html',
      '/files/main_style.css',
      '/uploads/x.jpg',
      '',
      `/uploads/6/0/6/7/6067835/${'a'.repeat(300)}.jpg`,
    ]) {
      expect(assetUrl(bad)).toBeNull();
    }
  });
  it('hands the client the content region without scripts, and every flyer the whole page names, icons left out', () => {
    const region = contentRegion(WHOLE_PAGE);
    expect(region.startsWith('<div id="wsite-content">')).toBe(true);
    expect(region).not.toMatch(/<script|CONTACT US|wsite-menu-wrap/);
    expect(region).toMatch(/Current Events/);
    expect(uploadPictures(WHOLE_PAGE)).toEqual([
      '/uploads/6/0/6/7/6067835/battle-cry-sunday-veterans-flyer-3.jpg',
      '/uploads/6/0/6/7/6067835/thanksgiving-dinner-2026.jpg',
    ]);
    expect(contentRegion('<p>no weebly here</p><script>x</script>')).toBe('<p>no weebly here</p>');
  });
});

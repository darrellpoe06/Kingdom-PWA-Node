// =============================================================================
// What the church office posts is kept (DR-1596): which picture is what, one
// copy per content, the month view, an office "Remove" of a past event that
// ARCHIVES it, the daily reader's collector against a fake site and a fake
// Wayback, and the app's reads. Each new rule carries a PROVEN TO CATCH case.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import {
  sniffType,
  storagePath,
  churchMonthOf,
  archiveCandidates,
  dedupeByContent,
  archiveMonths,
  archiveYears,
  monthSummary,
  removalOutcome,
} from '../lib/church-archive.js';
import { parseChurchPage } from '../lib/church-site.js';
import { fromOfficeRows } from '../lib/church-calendar.js';
import { readCalendarRows } from '../lib/church-calendar-sync.js';
import { readArchiveRows, signArchivePaths } from '../lib/church-archive-sync.js';
import { collect, parseCdx, waybackIso, manifestItem } from '../../../scripts/church-site-archive-collect.mjs';

const U = '/uploads/6/0/6/7/6067835';
// The site's real markup shapes (church-site-read-into-the-app.test.js captured them on 2026-11-18).
const CALENDAR_HTML = `<div id="wsite-content"><h2 class="wsite-content-title"><font>november 2026</font></h2>
<div class="wsite-image"><a><img src="${U}/11-november-2026-calendar_orig.jpg" alt="Picture" /></a></div></div>`;
const LETTER_HTML = `<div id="wsite-content"><div class="wsite-image"><a><img src="${U}/october-2026-letter_orig.jpg" alt="Picture" /></a></div></div>`;
const EVENTS_PAGE = `<html><head><meta property="og:image" content="https://www.thechurchofthelivinggod.com${U}/battle-cry-sunday-veterans-flyer-3.jpg" /></head><body>
<div id="wsite-content"><h2 class="wsite-content-title">Current Events</h2><div class="paragraph">Take a look.</div></div>
<script>_W.slideshows = [{"images":[{"url":"${U}/battle-cry-sunday-veterans-flyer-3.jpg"},{"url":"${U}/thanksgiving-dinner-2026.jpg"}]}];</script></body></html>`;
const page = (name, html, images = []) => parseChurchPage({ page: name, url: `https://x/${name}`, fetchedAt: '2026-11-19T15:00:00Z', html, images });

const JPEG = (n) => new Uint8Array([0xff, 0xd8, 0xff, 0xe0, n, n, n, n]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1]);
const sha = (b) => createHash('sha256').update(b).digest('hex');

describe('which picture on which page is what', () => {
  const pages = {
    calendar: page('calendar', CALENDAR_HTML),
    'letters-from-bg': page('letters-from-bg', LETTER_HTML),
    'current-events': page('current-events', '<div id="wsite-content"></div>', [
      `${U}/battle-cry-sunday-veterans-flyer-3.jpg`,
      `${U}/thanksgiving-dinner-2026.jpg`,
    ]),
    'previous-events': null,
  };
  const got = archiveCandidates(pages, { seenAt: '2026-11-19T15:00:00Z' });
  it('the calendar and the letter carry the month they were FOR, read from the file name', () => {
    const cal = got.find((c) => c.kind === 'calendar');
    expect(cal).toMatchObject({
      sourcePath: `${U}/11-november-2026-calendar_orig.jpg`,
      forYear: 2026,
      forMonth: 11,
      monthFrom: 'file',
      title: 'November 2026 calendar',
    });
    // October's letter is filed under October even though it was read in November.
    expect(got.find((c) => c.kind === 'letter')).toMatchObject({ forYear: 2026, forMonth: 10, monthFrom: 'file', title: 'October 2026 Letter from BG' });
  });
  it('a flyer that names no month is filed under the day it was first seen, and says so', () => {
    const flyers = got.filter((c) => c.kind === 'flyer');
    expect(flyers.map((f) => f.title)).toEqual(['Battle Cry Sunday Veterans', 'Thanksgiving Dinner 2026']);
    expect(flyers.every((f) => f.forYear === 2026 && f.forMonth === 11 && f.monthFrom === 'first-seen')).toBe(true);
  });
  it('the page heading names the month when the file does not', () => {
    const p = page('calendar', CALENDAR_HTML.replace('11-november-2026-calendar_orig', 'calendar-final'));
    expect(archiveCandidates({ calendar: p }, { seenAt: '2026-12-02T15:00:00Z' })[0]).toMatchObject({ forMonth: 11, monthFrom: 'page' });
  });
  it('the church’s own day decides the month: 11 pm on Nov 30 in Chicago is still November', () => {
    expect(churchMonthOf('2026-12-01T04:30:00Z')).toEqual({ year: 2026, month: 11 });
    expect(churchMonthOf('not a time')).toBeNull();
  });
  it('a page that did not read gives nothing; nothing is invented', () => {
    expect(archiveCandidates({}, { seenAt: '2026-11-19T15:00:00Z' })).toEqual([]);
  });
});

describe('one copy per content', () => {
  const a = {
    kind: 'flyer',
    sourcePath: `${U}/battle-cry.jpg`,
    sha256: sha(JPEG(1)),
    seenAt: '2026-11-19T15:00:00Z',
    forYear: 2026,
    forMonth: 11,
    monthFrom: 'first-seen',
  };
  it('PROVEN TO CATCH: the same flyer seen twice (re-posted under a new name) is ONE archive item', () => {
    const again = { ...a, sourcePath: `${U}/battle-cry-2.jpg`, seenAt: '2026-11-20T15:00:00Z' };
    // Without the rule there are two items, which is what a path-keyed archive would keep.
    expect([a, again]).toHaveLength(2);
    const kept = dedupeByContent([a, again]);
    expect(kept).toHaveLength(1);
    expect(kept[0]).toMatchObject({ sourcePath: a.sourcePath, seenAt: a.seenAt, seenCount: 2 });
  });
  it('the earliest sighting is kept, and a stated month replaces an inferred one', () => {
    const earlier = { ...a, seenAt: '2026-10-30T15:00:00Z', forMonth: 10, monthFrom: 'page' };
    expect(dedupeByContent([a, earlier])[0]).toMatchObject({ seenAt: '2026-10-30T15:00:00Z', forMonth: 10, monthFrom: 'page' });
  });
  it('different pictures stay separate; an item with no hash is dropped', () => {
    expect(dedupeByContent([a, { ...a, sha256: sha(JPEG(2)) }, { ...a, sha256: 'nope' }])).toHaveLength(2);
  });
  it('the bytes decide what a file is, never its name or the server', () => {
    expect(sniffType(JPEG(1))).toBe('image/jpeg');
    expect(sniffType(PNG)).toBe('image/png');
    expect(sniffType(new TextEncoder().encode('<html>'))).toBe('');
    expect(storagePath('inst-1', 'AB'.repeat(32), 'image/jpeg')).toBe(`inst-1/${'ab'.repeat(32)}.jpeg`);
  });
});

describe('the month view', () => {
  const rows = [
    {
      id: '1',
      kind: 'calendar',
      title: 'November 2026 calendar',
      for_year: 2026,
      for_month: 11,
      storage_path: 'i/1.jpeg',
      first_seen_at: '2026-11-02T10:00:00Z',
    },
    {
      id: '2',
      kind: 'letter',
      title: 'November 2026 Letter from BG',
      for_year: 2026,
      for_month: 11,
      storage_path: 'i/2.jpeg',
      first_seen_at: '2026-11-03T10:00:00Z',
    },
    { id: '3', kind: 'flyer', title: 'Battle Cry', for_year: 2026, for_month: 11, storage_path: 'i/3.jpeg', first_seen_at: '2026-11-04T10:00:00Z' },
    { id: '4', kind: 'flyer', title: 'Thanksgiving', for_year: 2026, for_month: 11, storage_path: 'i/4.jpeg', first_seen_at: '2026-11-05T10:00:00Z' },
    { id: '5', kind: 'flyer', title: 'Veterans', for_year: 2026, for_month: 11, storage_path: 'i/5.jpeg', first_seen_at: '2026-11-06T10:00:00Z' },
    {
      id: '6',
      kind: 'calendar',
      title: 'October 2026 calendar',
      for_year: 2026,
      for_month: 10,
      storage_path: 'i/6.jpeg',
      first_seen_at: '2026-10-02T10:00:00Z',
    },
    {
      id: '7',
      kind: 'calendar',
      title: 'December 2025 calendar',
      for_year: 2025,
      for_month: 12,
      storage_path: 'i/7.jpeg',
      first_seen_at: '2025-12-02T10:00:00Z',
    },
  ];
  const months = archiveMonths(rows, []);
  it('reads "November 2026: the calendar, the letter, 3 flyers", newest month first', () => {
    expect(months.map((m) => m.key)).toEqual(['2026-11', '2026-10', '2025-12']);
    expect(monthSummary(months[0])).toBe('November 2026: the calendar, the letter, 3 flyers');
    expect(monthSummary(months[1])).toBe('October 2026: the calendar');
  });
  it('groups by year, newest first', () => {
    expect(archiveYears(months).map((y) => [y.year, y.months.length])).toEqual([
      [2026, 2],
      [2025, 1],
    ]);
  });
  it('a row of an unknown kind or month is left out, not guessed into a month', () => {
    expect(
      archiveMonths([
        { kind: 'sermon', for_year: 2026, for_month: 11 },
        { kind: 'flyer', for_year: 2026, for_month: 13 },
      ])
    ).toEqual([]);
  });
});

describe('nothing disappears by accident', () => {
  it('Remove archives an event that began before today and deletes one from today on', () => {
    expect(removalOutcome({ date: '2026-08-29' }, '2026-11-19')).toBe('archive');
    expect(removalOutcome({ date: '2026-11-19' }, '2026-11-19')).toBe('delete');
    expect(removalOutcome({ date: '2026-12-06' }, '2026-11-19')).toBe('delete');
    expect(removalOutcome({ date: '2026-12-06' }, 'not a day')).toBe('archive');
  });
  it('PROVEN TO CATCH: a past event "removed" by the office is still in history', () => {
    const rows = [
      { id: 'r1', ministry: 'calendar', title: 'Gospel Fest', week_of: '2026-08-29', archived_at: '2026-11-19T16:00:00Z' },
      { id: 'r2', ministry: 'calendar', title: 'Advent', week_of: '2026-12-06' },
    ];
    const got = fromOfficeRows(rows);
    // Off the calendar's views...
    expect(got.events.map((e) => e.name)).toEqual(['Advent']);
    // ...and kept, with when, in the archive's August.
    expect(got.archived).toEqual([expect.objectContaining({ name: 'Gospel Fest', date: '2026-08-29', archivedAt: '2026-11-19T16:00:00Z', rowId: 'r1' })]);
    const aug = archiveMonths([], got.archived).find((m) => m.key === '2026-08');
    expect(monthSummary(aug)).toBe('August 2026: 1 archived event');
    // The old reading (archived_at ignored) would show it on the calendar as if nothing happened.
    expect(fromOfficeRows(rows.map(({ archived_at, ...r }) => r)).events.map((e) => e.name)).toContain('Gospel Fest');
  });
});

// ── the daily reader's collector against a fake site ────────────────────────
function fakeSite(routes) {
  const asked = [];
  const fetchImpl = async (url) => {
    asked.push(url);
    const r = routes[url];
    if (!r) return { ok: false, status: 404, headers: new Map(), text: async () => '', json: async () => null, arrayBuffer: async () => new ArrayBuffer(0) };
    const body = r.body;
    return {
      ok: true,
      status: 200,
      headers: new Map([['content-length', String(r.length ?? (body.length || 0))]]),
      text: async () => String(body),
      json: async () => body,
      arrayBuffer: async () => (body instanceof Uint8Array ? body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength) : new ArrayBuffer(0)),
    };
  };
  return { fetchImpl, asked };
}
const SITE = 'https://www.thechurchofthelivinggod.com';

describe('the collector (scripts/church-site-archive-collect.mjs)', () => {
  it('reads the four pages, keeps each picture once by content, and names its month', async () => {
    const { fetchImpl } = fakeSite({
      [`${SITE}/calendar.html`]: { body: CALENDAR_HTML },
      [`${SITE}/letters-from-bg.html`]: { body: LETTER_HTML },
      [`${SITE}/current-events.html`]: { body: EVENTS_PAGE },
      [`${SITE}${U}/11-november-2026-calendar_orig.jpg`]: { body: JPEG(1) },
      [`${SITE}${U}/october-2026-letter_orig.jpg`]: { body: JPEG(2) },
      [`${SITE}${U}/battle-cry-sunday-veterans-flyer-3.jpg`]: { body: JPEG(3) },
      // The same bytes as Battle Cry: a re-post is not a second copy.
      [`${SITE}${U}/thanksgiving-dinner-2026.jpg`]: { body: JPEG(3) },
    });
    const r = await collect({ fetchImpl, now: '2026-11-19T15:00:00Z' });
    expect(r.pages).toEqual({ calendar: 'read', 'letters-from-bg': 'read', 'current-events': 'read', 'previous-events': 'failed' });
    expect(r.items.map((i) => [i.kind, i.forYear, i.forMonth])).toEqual([
      ['calendar', 2026, 11],
      ['letter', 2026, 10],
      ['flyer', 2026, 11],
    ]);
    expect(r.files.size).toBe(3);
    const m = manifestItem(r.items[0]);
    expect(m).toMatchObject({
      kind: 'calendar',
      for_year: 2026,
      for_month: 11,
      month_from: 'file',
      content_type: 'image/jpeg',
      source_page: 'calendar',
      found_via: 'site',
    });
    expect(m.file).toBe(`${m.sha256}.jpeg`);
  });
  it('a page that is not a picture, or is too big, is skipped and named, never kept', async () => {
    const { fetchImpl } = fakeSite({
      [`${SITE}/calendar.html`]: { body: CALENDAR_HTML },
      [`${SITE}/letters-from-bg.html`]: { body: LETTER_HTML },
      [`${SITE}${U}/11-november-2026-calendar_orig.jpg`]: { body: new TextEncoder().encode('<html>not found</html>') },
      [`${SITE}${U}/october-2026-letter_orig.jpg`]: { body: JPEG(2), length: 50 * 1024 * 1024 },
    });
    const r = await collect({ fetchImpl, now: '2026-11-19T15:00:00Z' });
    expect(r.items).toEqual([]);
    expect(r.skipped.map((s) => s.reason).sort()).toEqual(['not-a-picture', 'too-big']);
  });
  it('the budget caps how many pictures one run fetches', async () => {
    const { fetchImpl } = fakeSite({
      [`${SITE}/current-events.html`]: { body: EVENTS_PAGE },
      [`${SITE}${U}/battle-cry-sunday-veterans-flyer-3.jpg`]: { body: JPEG(3) },
      [`${SITE}${U}/thanksgiving-dinner-2026.jpg`]: { body: JPEG(4) },
    });
    const r = await collect({ fetchImpl, now: '2026-11-19T15:00:00Z', maxItems: 1 });
    expect(r.items).toHaveLength(1);
    expect(r.skipped).toEqual([{ path: `${U}/thanksgiving-dinner-2026.jpg`, reason: 'budget' }]);
  });
  it('wayback: a past snapshot recovers a month the site replaced, dated by the snapshot', async () => {
    const cdx = `https://web.archive.org/cdx/search/cdx?url=thechurchofthelivinggod.com/calendar.html&output=json&fl=timestamp,original&filter=statuscode:200&collapse=digest&limit=40`;
    const old = CALENDAR_HTML.replace(/november 2026/, 'august 2026').replace('11-november-2026-calendar_orig', '08-august-2026-calendar_orig');
    const { fetchImpl } = fakeSite({
      [cdx]: {
        body: [
          ['timestamp', 'original'],
          ['20260805120000', 'https://www.thechurchofthelivinggod.com/calendar.html'],
        ],
      },
      ['https://web.archive.org/web/20260805120000id_/https://www.thechurchofthelivinggod.com/calendar.html']: { body: old },
      // Gone from the site; the Archive still holds the picture.
      [`https://web.archive.org/web/20260805120000im_/${SITE}${U}/08-august-2026-calendar_orig.jpg`]: { body: JPEG(8) },
    });
    const r = await collect({ fetchImpl, mode: 'wayback' });
    expect(r.items).toEqual([expect.objectContaining({ kind: 'calendar', forYear: 2026, forMonth: 8, foundVia: 'wayback', seenAt: '2026-08-05T12:00:00Z' })]);
  });
  it('reads the Wayback index honestly', () => {
    expect(waybackIso('20260805120000')).toBe('2026-08-05T12:00:00Z');
    expect(waybackIso('2026')).toBe('');
    expect(
      parseCdx([
        ['timestamp', 'original'],
        ['20260901000000', 'https://a/b'],
        ['20260801000000', 'https://a/b'],
        ['bad', 'https://a/b'],
      ]).map((s) => s.timestamp)
    ).toEqual(['20260801000000', '20260901000000']);
    expect(parseCdx(null)).toEqual([]);
  });
});

// ── the app's reads ──────────────────────────────────────────────────────────
const session = { data: { session: { user: { id: 'u1' } } } };
const church = (value) => async () => ({ ok: true, value });

describe('the app reads', () => {
  it('the calendar still reads before 0342 applies (archived_at not yet a column)', async () => {
    const selects = [];
    const client = {
      auth: { getSession: async () => session },
      from: () => {
        const q = {
          select: (s) => (selects.push(s), q),
          eq: () => q,
          order: () => q,
          // Before 0342 there is no archived_at (and so none of 0343's columns either).
          then: (ok) => Promise.resolve(/archived_at/.test(selects[selects.length - 1]) ? { error: { code: '42703' } } : { data: [{ id: 'a' }], error: null }).then(ok),
        };
        return q;
      },
    };
    const got = await readCalendarRows({ client, resolveChurch: church('c') });
    expect(got).toEqual({ status: 'ok', rows: [{ id: 'a' }] });
    expect(selects[0]).toMatch(/archived_at/);
    expect(selects[selects.length - 1]).not.toMatch(/archived_at/);
  });
  it('the archive is read for the reader’s own church; a failed read is unavailable, never empty', async () => {
    const calls = [];
    const mk = (res) => ({
      auth: { getSession: async () => session },
      from: (t) => {
        calls.push(['from', t]);
        const q = { select: () => q, eq: (k, v) => (calls.push(['eq', k, v]), q), order: () => q, then: (ok) => Promise.resolve(res).then(ok) };
        return q;
      },
    });
    expect(await readArchiveRows({ client: mk({ data: [{ id: 1 }], error: null }), resolveChurch: church('church-1') })).toEqual({
      status: 'ok',
      rows: [{ id: 1 }],
    });
    expect(calls).toContainEqual(['from', 'church_site_archive']);
    expect(calls).toContainEqual(['eq', 'instance_id', 'church-1']);
    expect((await readArchiveRows({ client: mk({ error: { message: 'x' } }), resolveChurch: church('c') })).status).toBe('unavailable');
    expect((await readArchiveRows({ client: { auth: { getSession: async () => ({ data: {} }) } } })).status).toBe('signed-out');
  });
  it('pictures are opened by signed addresses from the private bucket, only the ones that signed', async () => {
    let asked;
    const client = {
      storage: {
        from: (b) => ({
          createSignedUrls: async (paths) => (
            (asked = [b, paths]),
            {
              data: [
                { path: 'i/1.jpeg', signedUrl: 'https://s/1' },
                { path: 'i/2.jpeg', error: 'gone' },
              ],
            }
          ),
        }),
      },
    };
    expect(await signArchivePaths(['i/1.jpeg', 'i/2.jpeg', 'i/1.jpeg'], { client })).toEqual({ 'i/1.jpeg': 'https://s/1' });
    expect(asked).toEqual(['church-archive', ['i/1.jpeg', 'i/2.jpeg']]);
    expect(await signArchivePaths([], { client })).toEqual({});
  });
});

// @vitest-environment node
// =============================================================================
// the-word-months-fill-from-the-channel — a new service lands in its month (DR-1427)
// =============================================================================
// Darrell 2026-11-11, The Word -> Migdal, the stepper on October 2026 and five
// November services in a "Just posted" strip outside the months: "the months
// are not populating in the next month!!!! Fix it for all months... this was
// an issue before". The archive import lane had failed every day since
// 2026-11-04 (expired runner tailnet key); the page already held the November
// services from the channel feed, but outside the month list. Now they are rows
// in their month, whatever the import lane is doing.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { channelRow, withChannelRows } from '../lib/the-word-channel-rows.js';

const month = (rows) => [...new Set(rows.map((r) => String(r.serviceDate || '').slice(0, 7)).filter(Boolean))].sort();

// The archive as the screenshot showed it: October is the newest month.
const ARCHIVE = [
  { id: 'a1', videoId: 'RRrpX8kBDA8', title: 'IF GOD SAID I CAN DO IT', serviceDate: '2026-10-28', status: 'active' },
  { id: 'a2', videoId: 'm7nkYOzj1-k', title: 'He Shall & I Will: I Will & He Shall', serviceDate: '2026-10-18', status: 'active' },
];
// The channel feed as /api/church-recent returns it (the screenshot's titles).
const FEED = [
  { videoId: 'nov11vid001', title: '11 - 11 - 2026 Bishop Lloyd E. Gwin "I CAN DO ALL THINGS THROUGH JESUS"', published: '2026-11-11T23:10:00+00:00', url: 'https://www.youtube.com/watch?v=nov11vid001' },
  { videoId: 'iVmQ0ioX6Bc', title: '"I Can Do All Things Through Christ Who Strenghthens Me!" - Bishop Lloyd E. Gwin', published: '2026-11-09T01:05:00+00:00', url: 'https://www.youtube.com/watch?v=iVmQ0ioX6Bc' },
  { videoId: '7aCAdw5W-Nc', title: '11 - 4 - 2026 Bishop Lloyd E. Gwin Wednesday Bible Study " I AM SOMEBODY!"', published: '2026-11-05T02:00:00+00:00', url: 'https://www.youtube.com/watch?v=7aCAdw5W-Nc' },
  { videoId: 'vtY09rV2JEc', title: '"I Am Somebody!" - Bishop Lloyd E. Gwin', published: '2026-11-02T22:00:00+00:00', url: 'https://www.youtube.com/watch?v=vtY09rV2JEc' },
  { videoId: 'RRrpX8kBDA8', title: '10- 28 - 2026 Bishop Lloyd E. Gwin Wednesday Bible Study " IF GOD SAID I CAN DO IT"', published: '2026-10-29T02:00:00+00:00', url: 'https://www.youtube.com/watch?v=RRrpX8kBDA8' },
];

describe('a channel video becomes a row dated into its month', () => {
  it('the Bishop’s dated title gives the date; a title with no date falls back to the publish day', () => {
    expect(channelRow(FEED[2]).serviceDate).toBe('2026-11-04');
    expect(channelRow(FEED[3]).serviceDate).toBe('2026-11-02');
    const r = channelRow(FEED[0]);
    expect(r).toMatchObject({ id: 'yt-nov11vid001', fromChannel: true, status: 'active', serviceDate: '2026-11-11' });
  });

  it('November appears beside October, every November service is in it, and nothing already archived is doubled', () => {
    const rows = withChannelRows(ARCHIVE, FEED);
    expect(month(rows)).toEqual(['2026-10', '2026-11']);
    expect(rows.filter((r) => r.serviceDate && r.serviceDate.startsWith('2026-11'))).toHaveLength(4);
    expect(rows.filter((r) => r.videoId === 'RRrpX8kBDA8')).toHaveLength(1);
    expect(rows.find((r) => r.videoId === 'RRrpX8kBDA8').fromChannel).toBeUndefined();
  });

  it('PROVEN TO CATCH: the archive alone (the lane down) has no November at all, which is what Darrell saw', () => {
    expect(month(ARCHIVE)).toEqual(['2026-10']);
  });

  it('every month, not only November: a service posted across the year boundary lands in January', () => {
    const rows = withChannelRows(ARCHIVE, [{ videoId: 'jan1vid0001', title: 'Watch Night Service', published: '2027-01-01T05:30:00+00:00' }]);
    expect(month(rows)).toContain('2027-01');
  });

  it('an archived row with no date borrows the same video’s channel date, so it never falls out of every month', () => {
    const rows = withChannelRows([{ id: 'u1', youtubeUrl: 'https://www.youtube.com/watch?v=iVmQ0ioX6Bc', title: 'I Can Do All Things', serviceDate: null, status: 'active' }], FEED);
    const u = rows.find((r) => r.id === 'u1');
    expect(u.serviceDate).toBe('2026-11-09');
    expect(u.fromChannel).toBeUndefined();
    expect(rows.filter((r) => r.videoId === 'iVmQ0ioX6Bc')).toHaveLength(0); // the archive row stands; no channel twin
  });

  it('an empty or failed feed changes nothing', () => {
    expect(withChannelRows(ARCHIVE, [])).toEqual(ARCHIVE);
    expect(withChannelRows(ARCHIVE, null)).toEqual(ARCHIVE);
  });
});

describe('The Word’s library uses it', () => {
  const src = readFileSync(join(process.cwd(), 'src', 'components', 'Pulpit.jsx'), 'utf8');
  it('the month list is built from the archive plus the channel, and the panel gets the whole feed', () => {
    expect(src).toMatch(/const history = withChannelRows\(list\.filter\(\(s\) => s\.status !== 'draft'\), justPosted\);/);
    expect(src).toMatch(/justPosted=\{channelFresh\}/);
  });
  it('the separate strip outside the months is gone, and a channel row is marked and read-only', () => {
    expect(src).not.toMatch(/joins the archive shortly/);
    expect(src).toMatch(/canEdit=\{canEdit && !s\.fromChannel\}/);
    expect(src).toMatch(/New · from the channel/);
  });
});

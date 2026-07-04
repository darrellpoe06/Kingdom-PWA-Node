// tv-time-import-zip — the TV Time GDPR (.zip) migration path (Darrell + Christina
// 2026-07-04: the real export is a zip of CSVs and had nowhere to go). Pins the
// PURE halves against fixtures that mirror the REAL export headers (verified from
// Christina's actual file), plus a round-trip through our store's normalize().
import { describe, it, expect } from 'vitest';
import {
  parseCsv, gdprRowsToTvState, importedShowId, importSummary, looksLikeZip,
} from '../lib/tv-time-import-zip.js';
import { normalize } from '../lib/tv-time.js';

// Fixtures mirror the real column order/names from the export.
const FOLLOWED = [
  'tv_show_id,created_at,diffusion,notification_type,archived,notification_offset,tv_show_name,user_id,active,folder_id,updated_at',
  '121361,2017-10-31 03:39:36,original,2,0,-60,Game of Thrones,16420170,1,,2017-10-31 03:39:36',
  '71489,2017-10-31 03:40:21,original,2,0,-60,Law & Order: Criminal Intent,16420170,1,,2017-10-31 03:40:21',
  '99999,2018-01-01 00:00:00,original,2,0,-60,An Archived Show,16420170,0,,2018-01-01 00:00:00',
].join('\n');

const SHOWDATA = [
  'user_id,tv_show_id,is_followed,is_favorited,nb_episodes_seen,tv_show_name',
  '16420170,121361,1,1,67,Game of Thrones',
  '16420170,71489,1,0,0,Law & Order: Criminal Intent',
].join('\n');

const SEEN = [
  'user_id,episode_id,source,created_at,updated_at,tv_show_name,episode_season_number,episode_number',
  '16420170,4709830,episode-detail,2018-06-14 12:41:03,2018-06-14 12:41:03,Game of Thrones,1,1',
  '16420170,4856815,season-detail,2018-09-16 05:24:47,2018-09-16 05:24:47,Game of Thrones,1,2',
  '16420170,5168879,season-detail,2018-09-16 05:24:48,2018-09-16 05:24:48,Game of Thrones,2,1',
].join('\n');

const RATE = [
  'user_id,tv_show_id,rating,created_at,updated_at,tv_show_name',
  '16420170,121361,10,2018-08-25 20:32:45,2018-08-25 20:32:45,Game of Thrones',
].join('\n');

const filesOf = () => ({
  'followed_tv_show.csv': parseCsv(FOLLOWED),
  'user_tv_show_data.csv': parseCsv(SHOWDATA),
  'seen_episode_source.csv': parseCsv(SEEN),
  'tv_show_rate.csv': parseCsv(RATE),
});

describe('parseCsv — real-shaped rows', () => {
  it('keys each row by header and keeps embedded punctuation in names', () => {
    const rows = parseCsv(FOLLOWED);
    expect(rows).toHaveLength(3);
    expect(rows[1].tv_show_name).toBe('Law & Order: Criminal Intent');
    expect(rows[0].active).toBe('1');
  });
  it('handles quoted fields with an embedded comma', () => {
    const rows = parseCsv('a,b\n"x, y",z');
    expect(rows[0].a).toBe('x, y');
    expect(rows[0].b).toBe('z');
  });
  it('handles escaped "" quotes and a missing final newline', () => {
    const rows = parseCsv('a\n"she said ""hi"""');
    expect(rows[0].a).toBe('she said "hi"');
  });
  it('is empty-safe', () => {
    expect(parseCsv('')).toEqual([]);
    expect(parseCsv(null)).toEqual([]);
  });
});

describe('importedShowId — stable, collision-proof slug', () => {
  it('slugs a title and prefixes so it never collides with a catalog id', () => {
    expect(importedShowId('Game of Thrones')).toBe('tvt-game-of-thrones');
    expect(importedShowId('Law & Order: Criminal Intent')).toBe('tvt-law-order-criminal-intent');
  });
  it('is empty for an empty title', () => {
    expect(importedShowId('   ')).toBe('');
  });
});

describe('gdprRowsToTvState — the real mapping', () => {
  const state = gdprRowsToTvState(filesOf());

  it('imports followed (active) shows and drops archived ones', () => {
    const titles = Object.values(state.custom).map((c) => c.title).sort();
    expect(titles).toEqual(['Game of Thrones', 'Law & Order: Criminal Intent']);
    expect(titles).not.toContain('An Archived Show');
  });
  it('turns seen episodes into SxE watched checkmarks + synthesized seasons', () => {
    const got = state.shows[importedShowId('Game of Thrones')];
    expect(got.watched).toEqual({ '1x1': true, '1x2': true, '2x1': true });
    const custom = state.custom[importedShowId('Game of Thrones')];
    expect(custom.seasons.map((s) => s.season)).toEqual([1, 2]);
    expect(custom.seasons[0].episodes.map((e) => e.number)).toEqual([1, 2]);
  });
  it('folds TV Time\'s 0-10 rating to our 0-5 stars', () => {
    expect(state.shows[importedShowId('Game of Thrones')].rating).toBe(5); // 10 -> 5
  });
  it('marks a show with watched episodes as "watching", an unwatched one as "want"', () => {
    expect(state.shows[importedShowId('Game of Thrones')].status).toBe('watching');
    expect(state.shows[importedShowId('Law & Order: Criminal Intent')].status).toBe('want');
  });
  it('is robust to entirely missing files', () => {
    const empty = gdprRowsToTvState({});
    expect(empty).toEqual({ shows: {}, custom: {} });
  });
});

describe('round-trips through the store normalize() unharmed', () => {
  it('survives normalize with every show + watched key intact', () => {
    const state = gdprRowsToTvState(filesOf());
    const norm = normalize(state);
    expect(Object.keys(norm.custom)).toHaveLength(2);
    expect(norm.shows[importedShowId('Game of Thrones')].watched['2x1']).toBe(true);
    expect(norm.custom[importedShowId('Game of Thrones')].kind).toBe('show');
  });
});

describe('importSummary — honest counts', () => {
  it('counts shows and total watched episodes', () => {
    const s = importSummary(gdprRowsToTvState(filesOf()));
    expect(s.shows).toBe(2);
    expect(s.episodes).toBe(3);
  });
});

describe('looksLikeZip — magic-byte detection', () => {
  it('recognizes the PK header and rejects JSON', () => {
    const zip = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0, 0]).buffer;
    const json = new TextEncoder().encode('{"app":"poetech-tv-time"}').buffer;
    expect(looksLikeZip(zip)).toBe(true);
    expect(looksLikeZip(json)).toBe(false);
  });
});

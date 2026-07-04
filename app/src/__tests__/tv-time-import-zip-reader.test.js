// @vitest-environment node
//
// tv-time-import-zip (reader) — proves the ACTUAL zip path end-to-end, not just
// the pure CSV mapping: builds a minimal real DEFLATE zip in-process (node:zlib)
// and drives importTvTimeZip through unzipEntries → parseCsv → gdprRowsToTvState.
// This is the independent, adversarial check (DR-0076) that the byte-level reader
// works — the risk the pure tests can't cover. Guarded on DecompressionStream
// (Node 18+ ships it; skip cleanly if a runner somehow lacks it).
import { describe, it, expect } from 'vitest';
import { deflateRawSync } from 'node:zlib';
import { importTvTimeZip, unzipEntries } from '../lib/tv-time-import-zip.js';

// Build a minimal, spec-correct zip (method 8 = deflate) from { name: text }.
// CRC is left 0 — the reader does not verify it (it reads sizes/offsets from the
// central directory), which is exactly the shape a real archive presents.
function buildZip(entries) {
  const enc = new TextEncoder();
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const [name, text] of Object.entries(entries)) {
    const nameBytes = enc.encode(name);
    const raw = enc.encode(text);
    const comp = deflateRawSync(raw);
    const lh = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(lh.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0, true);
    lv.setUint16(8, 8, true);         // method: deflate
    lv.setUint32(14, 0, true);        // crc (unverified)
    lv.setUint32(18, comp.length, true);
    lv.setUint32(22, raw.length, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    lh.set(nameBytes, 30);
    const localOffset = offset;
    locals.push(lh, comp);
    offset += lh.length + comp.length;

    const ch = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(ch.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(10, 8, true);        // method
    cv.setUint32(16, 0, true);        // crc
    cv.setUint32(20, comp.length, true);
    cv.setUint32(24, raw.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint32(42, localOffset, true);
    ch.set(nameBytes, 46);
    centrals.push(ch);
  }
  const cdStart = offset;
  let cdSize = 0;
  for (const c of centrals) cdSize += c.length;
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, centrals.length, true);
  ev.setUint16(10, centrals.length, true);
  ev.setUint32(12, cdSize, true);
  ev.setUint32(16, cdStart, true);
  const parts = [...locals, ...centrals, eocd];
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let p = 0;
  for (const part of parts) { out.set(part, p); p += part.length; }
  return out.buffer;
}

const FILES = {
  'followed_tv_show.csv':
    'tv_show_id,created_at,diffusion,notification_type,archived,notification_offset,tv_show_name,user_id,active,folder_id,updated_at\n'
    + '121361,2017-10-31 03:39:36,original,2,0,-60,Game of Thrones,16420170,1,,2017-10-31 03:39:36\n',
  'user_tv_show_data.csv':
    'user_id,tv_show_id,is_followed,is_favorited,nb_episodes_seen,tv_show_name\n'
    + '16420170,121361,1,1,67,Game of Thrones\n',
  'seen_episode_source.csv':
    'user_id,episode_id,source,created_at,updated_at,tv_show_name,episode_season_number,episode_number\n'
    + '16420170,4709830,episode-detail,2018-06-14 12:41:03,2018-06-14 12:41:03,Game of Thrones,1,1\n'
    + '16420170,4856815,season-detail,2018-09-16 05:24:47,2018-09-16 05:24:47,Game of Thrones,1,2\n',
  'tv_show_rate.csv':
    'user_id,tv_show_id,rating,created_at,updated_at,tv_show_name\n'
    + '16420170,121361,10,2018-08-25 20:32:45,2018-08-25 20:32:45,Game of Thrones\n',
  // a decoy CSV we never read, to prove selective extraction
  'ip_address.csv': 'ip\n127.0.0.1\n',
};

const hasDS = typeof DecompressionStream !== 'undefined';

describe.skipIf(!hasDS)('importTvTimeZip — real deflate zip, end to end', () => {
  it('inflates the CSVs and maps them into the store shape', async () => {
    const ab = buildZip(FILES);
    const { state, summary, ok } = await importTvTimeZip(ab);
    expect(ok).toBe(true);
    expect(summary.shows).toBe(1);
    expect(summary.episodes).toBe(2);
    expect(Object.values(state.custom)[0].title).toBe('Game of Thrones');
    expect(state.shows['tvt-game-of-thrones'].watched).toEqual({ '1x1': true, '1x2': true });
    expect(state.shows['tvt-game-of-thrones'].rating).toBe(5);
  });

  it('unzipEntries extracts only the requested names (selective)', async () => {
    const ab = buildZip(FILES);
    const got = await unzipEntries(ab, new Set(['followed_tv_show.csv']));
    expect(Object.keys(got)).toEqual(['followed_tv_show.csv']);
    expect(got['followed_tv_show.csv']).toContain('Game of Thrones');
  });

  it('a non-zip buffer yields nothing (fail-soft, no throw)', async () => {
    const junk = new TextEncoder().encode('not a zip').buffer;
    const { ok, summary } = await importTvTimeZip(junk);
    expect(ok).toBe(false);
    expect(summary.shows).toBe(0);
  });
});

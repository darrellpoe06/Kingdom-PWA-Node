// @vitest-environment node
// =============================================================================
// The archive does not cross the wire to print eight lines (DR-1057)
// =============================================================================
// Darrell, 2026-10-15: "We need to find out why it takes long to populating
// these tabs... opportunities and constraints..."
//
// TRACED. Pulpit (The Word) ran this on arrival, for every signed-in member:
//
//     supabase.from('video_transcripts').select('video_id,text');
//
// No WHERE, no LIMIT — the FULL CAPTION TEXT of every service the church has
// posted, downloaded to a phone before the outline could render. The speaker
// chips on his screenshot count 232 messages for Bishop Gwin alone.
//
// What made that worth fixing rather than tuning is what the bytes were FOR:
//   - the transcript is the THIRD precedence in sermon-points.js — BG's prep
//     outline wins, then the harvest row, then the captions;
//   - the derivation yields at most EIGHT short strings
//     (extractSermonPoints limit: 8).
// So for every message that already had prep, the whole transcript was read
// and thrown away.
//
// And the discipline was already in this repo one call site over: Choir.jsx
// fetched transcripts only on a tap, and cached them — though it still pulled
// the whole archive to read one. Same function, two call sites, opposite
// habits, both now asking by name.
//
// These cases pin the saving as a PROPERTY rather than a claim: the set that
// crosses the wire is exactly what the cheap sources did not answer.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { videosNeedingTranscript, TRANSCRIPT_BATCH_CAP } from '../lib/sermon-library-sync.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const read = (rel) => readFileSync(join(HERE, '..', rel), 'utf8');
const LIB = read('lib/sermon-library-sync.js');
const PULPIT = read('components/Pulpit.jsx');
const CHOIR = read('components/Choir.jsx');
const GIVE = read('lib/call-to-give-sync.js');

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { if (name !== 'node_modules') walk(p, acc); }
    else if (/\.(jsx?|mjs)$/.test(name)) acc.push(p);
  }
  return acc;
}

const sermon = (id, videoId) => ({ id, videoId });
const many = (n) => Array.from({ length: n }, (_, i) => sermon(`s${i}`, `v${i}`));

describe('the unbounded read is gone, and cannot come back quietly', () => {
  it('no transcript read without a WHERE', () => {
    // PROVEN-TO-CATCH: this is the exact line that shipped.
    expect(LIB.includes("from('video_transcripts').select('video_id,text');"),
      'the unbounded transcript read is back').toBe(false);
    // What replaced it must name its ids.
    expect(LIB).toMatch(/from\('video_transcripts'\)\.select\('video_id,text'\)\.in\('video_id', ids\)/);
  });

  it('the expensive source is not in the eager bundle any more', () => {
    // fetchPointsData is what The Word calls on arrival. It must carry only
    // the two cheap sources now.
    const bundle = LIB.slice(LIB.indexOf('export async function fetchPointsData'));
    expect(bundle).toContain('fetchPrepBySermon()');
    expect(bundle).toContain('fetchHarvestsByVideo()');
    expect(bundle.includes('fetchTranscripts'), 'transcripts are back in the arrival bundle').toBe(false);
  });

  it('every call site asks by name', () => {
    expect(PULPIT).toContain('fetchTranscriptsFor(missing)');
    expect(CHOIR).toContain('fetchTranscriptsFor([song.videoId])');
    expect(GIVE).toContain('fetchTranscriptsFor(ids, { cap: ids.length })');
  });

  it('PROVEN-TO-CATCH, THE WAY I BROKE IT: no file anywhere still imports the removed function', () => {
    // THE DEFECT THIS CHECK EXISTS FOR, and it was mine. The first version of
    // this suite asserted the old name was absent from the lib and the two
    // components I had edited — and call-to-give-sync.js, which I had not
    // read, still imported it. Lint passed (ESLint does not resolve a
    // cross-module named import) and 187 tests passed (nothing imported that
    // file), and ONLY the production build caught it, as a masked ENOENT three
    // layers deep in a vite plugin.
    //
    // A check scoped to the files its author touched can only confirm what its
    // author already knew. This one reads the WHOLE tree.
    const offenders = [];
    for (const f of walk(join(HERE, '..'))) {
      if (f.includes('__tests__')) continue;
      if (readFileSync(f, 'utf8').includes('fetchTranscriptsByVideo')) offenders.push(f);
    }
    expect(offenders, 'a file still reaches for the removed whole-archive read').toEqual([]);
  });
});

describe('videosNeedingTranscript — only what the cheap sources did not answer', () => {
  it('a message with BG’s prep needs NOTHING, whatever else it has', () => {
    const need = videosNeedingTranscript([sermon('s1', 'v1')], {
      prepBySermon: { s1: { points: [] } }, harvestsByVideo: {},
    });
    expect(need).toEqual([]);
  });

  it('a message with a harvest row needs nothing either', () => {
    const need = videosNeedingTranscript([sermon('s1', 'v1')], {
      prepBySermon: {}, harvestsByVideo: { v1: { videoId: 'v1' } },
    });
    expect(need).toEqual([]);
  });

  it('a message with neither is the ONLY kind that costs anything', () => {
    expect(videosNeedingTranscript([sermon('s1', 'v1')], {})).toEqual(['v1']);
  });

  it('THE SAVING, on the real shape: prep covers most, so most cost nothing', () => {
    // 232 messages, prep on all but three — the shape the church actually has.
    const all = many(232);
    const prepBySermon = {};
    for (const s of all.slice(3)) prepBySermon[s.id] = { points: [] };
    const need = videosNeedingTranscript(all, { prepBySermon, harvestsByVideo: {} });
    expect(need).toEqual(['v0', 'v1', 'v2']);
    // 3 transcripts instead of 232 — and each is tens of kilobytes of caption
    // text, which is why this is the lever and the row count is not.
    expect(need.length).toBe(3);
    expect(all.length - need.length).toBe(229);
  });

  it('a message with no video id is skipped — there is nothing to key by', () => {
    expect(videosNeedingTranscript([sermon('s1', null), sermon('s2', '')], {})).toEqual([]);
  });

  it('it is capped, so the worst case is bounded too', () => {
    // The honest worst case: no prep anywhere. It must still not ask for the
    // whole archive — that is the defect, not a rare path.
    const need = videosNeedingTranscript(many(500), {});
    expect(need.length).toBe(TRANSCRIPT_BATCH_CAP);
    expect(TRANSCRIPT_BATCH_CAP).toBeLessThan(500);
  });

  it('newest first — the cap keeps what a person is most likely to open', () => {
    // The library is ordered newest-first before it gets here, so the cap takes
    // from the front rather than an arbitrary slice.
    const need = videosNeedingTranscript(many(100), {}, {});
    expect(need[0]).toBe('v0');
    expect(need[need.length - 1]).toBe(`v${TRANSCRIPT_BATCH_CAP - 1}`);
  });

  it('bad input never throws on a church surface', () => {
    expect(videosNeedingTranscript(null, {})).toEqual([]);
    expect(videosNeedingTranscript(undefined)).toEqual([]);
    expect(videosNeedingTranscript([null, undefined], {})).toEqual([]);
  });
});

describe('nothing a person sees changes', () => {
  it('the derivation is still the THIRD precedence, untouched', () => {
    const points = read('lib/sermon-points.js');
    // prep -> harvest -> transcript -> title, in that order. This change moved
    // WHEN the transcript arrives, never whether it wins.
    expect(points).toMatch(/prep\s*->\s*harvest\s*->\s*transcript\s*->\s*title/);
  });

  it('a missing transcript still degrades to the title scriptures', () => {
    // pointsForVideo accepts transcript: null by contract — which is what makes
    // deferring it safe rather than a gamble.
    const points = read('lib/sermon-points.js');
    expect(points).toMatch(/transcript = null/);
  });
});

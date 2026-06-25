// Tests for lib/worship-presenter.js — the worship-presentation model (the
// "ProPresenter brain": set list -> cues -> NDI program payloads, with verse/chorus
// advance, the master-program adapter, and the honest parity map).
//
// PROVEN-TO-CATCH (DR-0076 anti-theater): the load-bearing claims these guard are
//   (1) the ARRANGEMENT actually drives advance order + chorus repeats (a song's
//       lyrics show in the right order, choruses repeat without re-entry),
//   (2) each cue maps to the RIGHT NDI payload kind (lyrics render big, Scripture as
//       Scripture) so the screens show parity-correct content, and
//   (3) the parity map stays HONEST (gaps are still gaps — reliability + library are
//       NOT claimed done). Flip the arrangement handling, the cue->payload mapping, or
//       paint a gap green, and a case below fails.
import { describe, it, expect } from 'vitest';
import {
  buildSong, scriptureItem, slideItem, announcementItem, lowerThirdItem, holdItem,
  songCues, buildCues, advanceCue, cueToProgram, cueOperatorLabel,
  setListToPresentable, masterProgramToSetList,
  PROPRESENTER_PARITY, PARITY, parityRollup,
} from '../lib/worship-presenter.js';

const AMAZING_GRACE = buildSong({
  title: 'Amazing Grace',
  ccli: '12345',
  sections: {
    v1: { label: 'Verse 1', lines: ['Amazing grace how sweet the sound', 'That saved a wretch like me'] },
    c: { label: 'Chorus', lines: ['My chains are gone', 'I have been set free'] },
    v2: { label: 'Verse 2', lines: ['Twas grace that taught my heart to fear', 'And grace my fears relieved'] },
  },
  arrangement: ['v1', 'c', 'v2', 'c'],
});

describe('songCues — arrangement drives order + chorus repeats', () => {
  it('expands the arrangement in order, repeating the chorus', () => {
    const cues = songCues(AMAZING_GRACE);
    expect(cues.map((c) => c.sectionId)).toEqual(['v1', 'c', 'v2', 'c']);
    // the chorus appears twice without the lines being re-entered
    const choruses = cues.filter((c) => c.sectionId === 'c');
    expect(choruses).toHaveLength(2);
    expect(choruses[0].lines).toEqual(['My chains are gone', 'I have been set free']);
    expect(choruses[1].lines).toEqual(choruses[0].lines);
  });

  it('auto-slices a long section into multiple advanceable cues', () => {
    const longSong = buildSong({
      title: 'Long', linesPerSlide: 2,
      sections: { v: { label: 'Verse', lines: ['l1', 'l2', 'l3', 'l4', 'l5'] } },
      arrangement: ['v'],
    });
    const cues = songCues(longSong);
    expect(cues).toHaveLength(3); // 5 lines / 2 per slide -> 3 cues
    expect(cues[0].lines).toEqual(['l1', 'l2']);
    expect(cues[2].lines).toEqual(['l5']);
    expect(cues[0].partLabel).toBe('Verse (1/3)');
  });

  it('defaults the arrangement to declared section order when none given', () => {
    const s = buildSong({ title: 'X', sections: { a: { label: 'A', lines: ['x'] }, b: { label: 'B', lines: ['y'] } } });
    expect(songCues(s).map((c) => c.sectionId)).toEqual(['a', 'b']);
  });
});

describe('buildCues + advanceCue — the operator clicker walk', () => {
  const setList = [AMAZING_GRACE, scriptureItem({ ref: 'John 3:16', text: 'For God so loved...' }), holdItem({ title: 'Offering' })];
  const cues = buildCues(setList);

  it('flattens the whole service into one ordered cue list with positions', () => {
    // 4 song cues + 1 scripture + 1 hold = 6
    expect(cues).toHaveLength(6);
    expect(cues[0].cueTotal).toBe(6);
    expect(cues[4].itemKind).toBe('scripture');
    expect(cues[5].itemKind).toBe('hold');
  });

  it('advance clamps at both ends (pressing past the end holds the last cue)', () => {
    expect(advanceCue(cues, 0, -1)).toBe(0);       // before start -> 0
    expect(advanceCue(cues, 5, 1)).toBe(5);        // past end -> last
    expect(advanceCue(cues, 2, 1)).toBe(3);
    expect(advanceCue([], 0, 1)).toBe(0);          // empty never throws
  });
});

describe('cueToProgram — each cue maps to the right NDI payload kind', () => {
  it('a song cue becomes a lyric payload (lyrics render big)', () => {
    const cue = songCues(AMAZING_GRACE)[0];
    const p = cueToProgram(cue);
    expect(p.kind).toBe('lyric');
    expect(p.title).toBe('Amazing Grace');
    expect(p.lines).toEqual(['Amazing grace how sweet the sound', 'That saved a wretch like me']);
  });

  it('scripture/slide/lower-third/hold map to their payloads', () => {
    expect(cueToProgram(buildCues([scriptureItem({ ref: 'Ps 23:1', text: 'The Lord is my shepherd' })])[0]).kind).toBe('scripture');
    expect(cueToProgram(buildCues([slideItem({ title: 'Welcome' })])[0]).kind).toBe('slide');
    expect(cueToProgram(buildCues([announcementItem({ title: 'Picnic', body: 'Saturday' })])[0]).kind).toBe('slide');
    const lt = cueToProgram(buildCues([lowerThirdItem({ name: 'Bishop Gwin', role: 'Senior Pastor' })])[0]);
    expect(lt.kind).toBe('lower-third');
    expect(lt.key).toBe(true); // keyed/transparent for the switcher
    expect(cueToProgram(null).kind).toBe('hold');
  });

  it('operator label is descriptive and never leaks to the audience payload', () => {
    const cue = songCues(AMAZING_GRACE)[1];
    expect(cueOperatorLabel(cue)).toBe('Amazing Grace — Chorus');
    expect(cueToProgram(cue)).not.toHaveProperty('operator');
  });
});

describe('setListToPresentable — reuse the universal Presenter (#306) + no-leak', () => {
  const pres = setListToPresentable([AMAZING_GRACE, scriptureItem({ ref: 'John 3:16', text: 'For God so loved...' })], { title: 'Sunday', targetMin: 25 });

  it('produces a valid presentable: id/title/targetMin + scenes', () => {
    expect(pres.title).toBe('Sunday');
    expect(pres.targetMin).toBe(25);
    expect(pres.scenes).toHaveLength(5);
    expect(pres.scenes[0].indexLabel).toBe('1 of 5');
  });

  it('audience scene carries room-facing copy; operator detail stays in notes (no leak)', () => {
    const songScene = pres.scenes[0];
    expect(songScene.audience.title).toBe('Amazing Grace');
    expect(songScene.audience.lead).toContain('Amazing grace');
    // CCLI / operator readout must NOT be in the audience block
    expect(JSON.stringify(songScene.audience)).not.toMatch(/Operator/);
    expect(songScene.notes[0].heading).toBe('Operator');
  });
});

describe('masterProgramToSetList — the order-of-service seam', () => {
  it('maps program rows to set-list items by type', () => {
    const rows = [
      { type: 'song', title: 'Grace', sections: { v1: { label: 'V1', lines: ['a'] } }, arrangement: ['v1'] },
      { type: 'scripture', ref: 'John 1:1', text: 'In the beginning' },
      { type: 'announcement', title: 'Picnic', body: 'Sat' },
      { type: 'lower-third', name: 'BG', role: 'Pastor' },
    ];
    const set = masterProgramToSetList(rows);
    expect(set.map((i) => i.kind)).toEqual(['song', 'scripture', 'slide', 'lower-third']);
    // end-to-end: program -> set list -> cues -> payloads, no re-entry
    const cues = buildCues(set);
    expect(cues[0].itemKind).toBe('song');
    expect(cueToProgram(cues[1]).kind).toBe('scripture');
  });

  it('unknown / missing type falls back to a hold (never crashes a service)', () => {
    const set = masterProgramToSetList([{ type: 'mystery' }, null, {}]);
    expect(set.every((i) => i.kind === 'hold')).toBe(true);
  });
});

describe('ProPresenter parity map — honest have/partial/gap', () => {
  it('the reliability + library + transitions items are NOT claimed done', () => {
    const byFeature = Object.fromEntries(PROPRESENTER_PARITY.map((r) => [r.feature, r.status]));
    expect(byFeature['Reliability: no white-screen, crash recovery, graceful fallback']).toBe(PARITY.GAP);
    expect(byFeature['Song / slide LIBRARY (stored, searchable, reusable)']).toBe(PARITY.GAP);
    expect(byFeature['Smooth transitions (crossfade)']).toBe(PARITY.GAP);
  });

  it('the NDI output + lyrics + scripture ARE done (the shipped core)', () => {
    const byFeature = Object.fromEntries(PROPRESENTER_PARITY.map((r) => [r.feature, r.status]));
    expect(byFeature['Live NDI output to switcher + screens']).toBe(PARITY.HAVE);
    expect(byFeature['Song lyrics (verse/chorus advance)']).toBe(PARITY.HAVE);
  });

  it('rollup counts add up and there are still open gaps (not a finished claim)', () => {
    const r = parityRollup();
    expect(r.have + r.partial + r.gap).toBe(r.total);
    expect(r.gap).toBeGreaterThan(0);
    expect(r.total).toBe(PROPRESENTER_PARITY.length);
  });
});

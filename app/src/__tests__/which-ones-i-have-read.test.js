// =============================================================================
// WHICH ONES I HAVE READ — AND WHICH VERSION (DR-1255)
// =============================================================================
// Darrell 2026-10-27, with the lesson list on his tablet: "Why can't I tell
// which ones I've already read?!!!!!!!!!!!!!!!! Even which version so I can
// try the one I didn't read!!!!!! Fix it!!!!!!"
//
// MEASURED before this change (DR-0076 §4): a finish counted the LESSON — the
// place carried done/finishes and nothing named the words; a lesson read on
// one device said nothing on another; and a lesson finished then opened
// again (which clears `done` so it can start from the top) showed no mark at
// all. PROVEN-TO-CATCH (§3): each case below fails against that code.
// =============================================================================
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  recordPlace, finishPlace, getPlaceFor, versionsRead, versionReads, READ_VERSION_IDS, placeFinishes,
} from '../lib/learn-resume.js';
import { versionRead, deckVersion, readMark, readMarkLabel, readMarkSays, VERSION_LABEL } from '../lib/lesson-read-mark.js';
import { READING_VERSIONS, lessonVersions } from '../lib/learn-organize.js';
import { AGE_BANDS } from '../lib/learn-framework.js';

const src = (f) => readFileSync(join(process.cwd(), 'src', f), 'utf8');

function store() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}
const C = 'living-lessons';
const L = 'll263-not-one-stone';
let storage;
beforeEach(() => { storage = store(); });
const place = () => getPlaceFor(C, L, { storage });

describe('the ids are one set, everywhere', () => {
  it('the place, the picker and the age bands name the same five versions, in the same order', () => {
    expect(READ_VERSION_IDS).toEqual(READING_VERSIONS.map((b) => b.id));
    expect(READ_VERSION_IDS).toEqual(AGE_BANDS.map((b) => b.id));
    expect(Object.keys(VERSION_LABEL)).toEqual(READ_VERSION_IDS);
  });
});

describe('the place counts the VERSION read to the end', () => {
  it('a finish that names its version counts that version; nothing lowers it', () => {
    recordPlace({ courseKey: C, lessonId: L, stage: 0, step: 3 }, { storage });
    finishPlace({ courseKey: C, lessonId: L, version: 'adult' }, { storage });
    expect(versionsRead(place())).toEqual(['adult']);
    expect(versionReads(place(), 'adult')).toBe(1);
    // Read again, as a child this time (the reader moved, so `done` cleared).
    recordPlace({ courseKey: C, lessonId: L, sentence: 4, version: 'child' }, { storage });
    expect(place().done).toBe(false);
    expect(versionsRead(place()), 'moving again does not forget a version read').toEqual(['adult']);
    expect(place().version, 'the version being read is noted').toBe('child');
    finishPlace({ courseKey: C, lessonId: L }, { storage });
    expect(versionsRead(place())).toEqual(['child', 'adult']);
    expect(versionReads(place(), 'child'), 'a finish with no version named counts the version being read').toBe(1);
    expect(versionReads(place(), 'adult')).toBe(1);
    expect(placeFinishes(place())).toBe(2);
    // Starting over keeps the count.
    recordPlace({ courseKey: C, lessonId: L, stage: 0, step: 0 }, { storage });
    expect(versionsRead(place())).toEqual(['child', 'adult']);
  });

  it('the reader notes the version it is reading, and a later finish counts it', () => {
    recordPlace({ courseKey: C, lessonId: L, started: true }, { storage });
    recordPlace({ version: 'teen' }, { storage }); // TTSControl: once per reading
    recordPlace({ sentence: 9, sentenceKey: 'abc' }, { storage });
    expect(place().version).toBe('teen');
    finishPlace({}, { storage });
    expect(versionsRead(place())).toEqual(['teen']);
  });

  it('a version the app does not know is never stored; an older finish reads as read, version unknown', () => {
    finishPlace({ courseKey: C, lessonId: L, version: 'grown-up' }, { storage });
    expect(place().version).toBe('');
    expect(versionsRead(place())).toEqual([]);
    expect(placeFinishes(place())).toBe(1);
    // A place written before versions existed: done, no versions.
    storage.setItem('poe-learn-places', JSON.stringify({ v: 1, last: `${C}::old`, byLesson: { [`${C}::old`]: { courseKey: C, lessonId: 'old', done: true, at: 5 } } }));
    const old = getPlaceFor(C, 'old', { storage });
    expect(placeFinishes(old)).toBe(1);
    expect(versionsRead(old)).toEqual([]);
    expect(old.versions).toEqual({});
  });

  it('the finish on the same lesson from a different finish edge counts only once per edge (no double count)', () => {
    finishPlace({ courseKey: C, lessonId: L, version: 'adult' }, { storage });
    finishPlace({ courseKey: C, lessonId: L, version: 'adult' }, { storage });
    expect(versionReads(place(), 'adult'), 'over is over: a second finish without a move is not a second reading').toBe(1);
  });
});

describe('the words a reading serves', () => {
  const ALL = { id: 'x', lesson: 'Adult words, written in full.', levels: { child: 'Child words.', youth: 'Youth words.', teen: 'Teen words.', senior: 'Senior words.' } };
  it('each band reads its own version; the adult reads the lesson itself', () => {
    expect(versionRead(ALL, 'child')).toBe('child');
    expect(versionRead(ALL, 'youth')).toBe('youth');
    expect(versionRead(ALL, 'teen')).toBe('teen');
    expect(versionRead(ALL, 'adult')).toBe('adult');
    expect(versionRead(ALL, 'senior')).toBe('senior');
  });
  it('a band handed another version has read THAT version — honestly, so its own can still be offered', () => {
    const teenOnly = { id: 'y', lesson: 'Adult words.', levels: { teen: 'Teen words.' } };
    expect(versionRead(teenOnly, 'child'), 'child falls back to the teen words').toBe('teen');
    expect(versionRead(teenOnly, 'youth')).toBe('teen');
    expect(versionRead(teenOnly, 'senior'), 'senior falls back to the lesson itself').toBe('adult');
    const one = { id: 'z', lesson: 'One version for everyone.' };
    expect(versionRead(one, 'child')).toBe('adult');
    expect(lessonVersions(one)).toEqual(['adult']);
  });
  it('a depth override wins, as it does on the page', () => {
    expect(versionRead(ALL, 'adult', 'child')).toBe('child');
  });
  it('the deck reads the lesson itself (the adult words) in every register; a lesson with no `lesson` reads the register', () => {
    expect(deckVersion(ALL, 'child')).toBe('adult');
    expect(deckVersion(ALL, 'everyone')).toBe('adult');
    const bands = { id: 'b', bigIdea: 'The idea.', levels: { child: 'Child words.', teen: 'Teen words.', senior: 'Senior words.' } };
    expect(deckVersion(bands, 'child')).toBe('child');
    expect(deckVersion(bands, 'adult')).toBe('senior');
    expect(deckVersion(bands, 'everyone')).toBe(null);
    expect(deckVersion(null)).toBe(null);
  });
});

describe('the mark on a row', () => {
  const V = ['child', 'youth', 'teen', 'adult', 'senior'];
  it('from the device: read as an adult, four versions still to read', () => {
    finishPlace({ courseKey: C, lessonId: L, version: 'adult' }, { storage });
    const m = readMark({ place: place(), versions: V });
    expect(m).toMatchObject({ read: true, times: 1, fromRecord: false, readIds: ['adult'], unreadIds: ['child', 'youth', 'teen', 'senior'], known: true });
    expect(readMarkLabel(m)).toBe('✓ READ · Adult');
    expect(readMarkSays(m, 'Not One Stone')).toBe('You read the Adult version of Not One Stone on this device. Not read yet: Child, Youth, Teen, Senior — tap one to read it.');
  });
  it('from the record alone (another device): read, with the versions the record carries', () => {
    const m = readMark({ place: null, record: { completedAt: '2026-10-20T00:00:00.000Z', versionsRead: ['child', 'adult'] }, versions: V });
    expect(m).toMatchObject({ read: true, times: 0, fromRecord: true, readIds: ['child', 'adult'], unreadIds: ['youth', 'teen', 'senior'] });
    expect(readMarkLabel(m)).toBe('✓ READ · Child, Adult');
    expect(readMarkSays(m, 'X')).toMatch(/in your record\./);
  });
  it('device and record are one answer; a version is never counted twice', () => {
    finishPlace({ courseKey: C, lessonId: L, version: 'adult' }, { storage });
    finishPlace({ courseKey: C, lessonId: L, version: 'adult' }, { storage });
    recordPlace({ courseKey: C, lessonId: L, sentence: 2 }, { storage });
    finishPlace({ courseKey: C, lessonId: L, version: 'adult' }, { storage });
    const m = readMark({ place: place(), record: { completedAt: 'x', versionsRead: ['adult', 'teen'] }, versions: V });
    expect(m.readIds).toEqual(['teen', 'adult']);
    expect(m.times).toBe(2);
    expect(readMarkLabel(m)).toBe('✓ READ ×2 · Teen, Adult');
    expect(readMarkSays(m, 'X')).toMatch(/on this device and in your record/);
  });
  it('a finish with no version recorded says so, and offers every version', () => {
    finishPlace({ courseKey: C, lessonId: L }, { storage });
    const m = readMark({ place: place(), versions: V });
    expect(m).toMatchObject({ read: true, known: false, readIds: [], unreadIds: V });
    expect(readMarkLabel(m)).toBe('✓ READ · version not recorded');
    const one = readMark({ place: place(), versions: ['adult'] });
    expect(one, 'a lesson written once was read in its one version').toMatchObject({ readIds: ['adult'], unreadIds: [], known: true });
    expect(readMarkLabel(one), 'a one-version lesson has nothing to name').toBe('✓ READ');
    expect(readMarkSays(one, 'X')).toBe('You read X on this device.');
  });
  it('every version read: nothing left to offer, and it says so', () => {
    const m = readMark({ record: { completedAt: 'x', versionsRead: V }, versions: V });
    expect(m.unreadIds).toEqual([]);
    expect(readMarkSays(m, 'X')).toMatch(/Every version is read\./);
  });
  it('proven-to-catch: a lesson finished, then opened again, is still READ (the flag clears, the count does not)', () => {
    finishPlace({ courseKey: C, lessonId: L, version: 'adult' }, { storage });
    recordPlace({ courseKey: C, lessonId: L, stage: 0, step: 0 }, { storage });
    expect(place().done).toBe(false);
    expect(readMark({ place: place(), versions: V }).read).toBe(true);
  });
  it('nothing read, nothing marked; an unknown record version is ignored', () => {
    expect(readMark({ place: null, record: null, versions: V }).read).toBe(false);
    expect(readMark({ record: { completedAt: null, versionsRead: ['adult'] }, versions: V }).readIds).toEqual(['adult']);
    expect(readMark({ record: { completedAt: 'x', versionsRead: ['grown-up'] }, versions: V }).readIds).toEqual([]);
  });
});

describe('the wiring is real (source contracts)', () => {
  it('the lesson space names the version its reading serves, the reader notes it, the deck names its own', () => {
    const learn = src('components/ChurchLearn.jsx');
    expect(learn).toMatch(/version: versionRead\(module, ageBand, levelOverride\),/);
    expect(learn).toMatch(/finishPlace\(\{ courseKey: course\.key, lessonId: presentLesson\.id, version: deckVersion\(presentLesson, end && end\.age\) \}\)/);
    expect(learn).toMatch(/toggleModule\(p\.lessonId, course\.key, \{ versionsRead: read \}\)/);
    const tts = src('components/TTSControl.jsx');
    expect(tts).toMatch(/recordPlace\(\{ version: t\.version \}\);/);
    expect(tts).toMatch(/recordPlace\(\{ sentence: absIndex, sentenceKey: sentenceKeyOf\(text\) \}\);/);
    const target = src('lib/read-target.js');
    expect(target).toMatch(/version: target && typeof target\.version === 'string'/);
    const deck = src('components/Presenter.jsx');
    expect(deck).toMatch(/fn\(\{ age: ageRef\.current \}\)/);
  });
});

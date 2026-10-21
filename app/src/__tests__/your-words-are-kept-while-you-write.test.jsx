// =============================================================================
// Your words are kept while you write them (DR-1181)
// =============================================================================
// Darrell, 2026-10-21: "Where did my text and typing go?!!!!!!!!!!!!!!!!"
//
// Measured: the app has had a draft keeper since 2026-07-10 (Christina's ask —
// "automatically save your notes like a google doc without hitting save"), and
// it protects exactly ONE box, the Thinking Space's OneVoiceInput. The
// perspective form on a lesson — a title, a verse, "Who lived it" and a
// SIX-ROW story body — held its words in React state alone;
// `perspectiveDraftFor` is by its own docstring "The empty form for a new
// perspective" and persists nothing. The form's copy promised "Saved on this
// device... nothing is lost", which was true only AFTER a submit that failed to
// reach the queue. Before the Share tap, nothing was on the device at all.
import { describe, it, expect, beforeEach } from 'vitest';
import {
  readFormDraft, writeFormDraft, clearDraft, hasWords, draftWrittenAt,
  WORD_FIELDS, NEVER_RESTORED, draftKey,
} from '../lib/draft-autosave.js';

// A storage that behaves, and one that throws the way a private window does.
const makeWin = () => {
  const map = new Map();
  return { localStorage: {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, v),
    removeItem: (k) => map.delete(k),
  }, _map: map };
};
const THROWS = { localStorage: {
  getItem() { throw new Error('denied'); },
  setItem() { throw new Error('denied'); },
  removeItem() { throw new Error('denied'); },
} };

const BLANK = { kind: 'testimony', tone: 'solemn', title: '', verse: 'Psalms 90:12', body: '', source: '', consent: false, target_lesson_id: 'll257' };
let win;
beforeEach(() => { win = makeWin(); });

describe('a form of several fields is kept, not just one box', () => {
  it('keeps the story body and gives it back', () => {
    const typed = { ...BLANK, title: 'The calendar', body: 'He had been counting his Christmases.' };
    expect(writeFormDraft('s', typed, win)).toBe(true);
    const back = readFormDraft('s', BLANK, win);
    expect(back.body).toBe('He had been counting his Christmases.');
    expect(back.title).toBe('The calendar');
  });

  it('keeps every field a person types in, not only the body', () => {
    const typed = { ...BLANK, title: 'T', verse: 'Job 14:5', body: 'B', source: 'A friend' };
    writeFormDraft('s', typed, win);
    const back = readFormDraft('s', BLANK, win);
    for (const k of ['title', 'verse', 'body', 'source']) expect(back[k]).toBe(typed[k]);
  });

  it('an UNTOUCHED form is not a draft — only the defaults is not writing', () => {
    expect(hasWords(BLANK, BLANK)).toBe(false);
    expect(writeFormDraft('s', BLANK, win, undefined, BLANK)).toBe(false);
    expect(win._map.has(draftKey('s'))).toBe(false);
  });

  it('an EMPTIED form clears the draft, so nothing comes back from the dead', () => {
    writeFormDraft('s', { ...BLANK, body: 'something' }, win);
    expect(win._map.has(draftKey('s'))).toBe(true);
    writeFormDraft('s', { ...BLANK, body: '   ' }, win, undefined, BLANK);
    expect(win._map.has(draftKey('s'))).toBe(false);
  });

  it('records WHEN it was kept, so a surface can say how old the words are', () => {
    writeFormDraft('s', { ...BLANK, body: 'x' }, win, '2026-10-21T13:00:00.000Z');
    expect(draftWrittenAt('s', win)).toBe('2026-10-21T13:00:00.000Z');
  });
});

describe('the attestation is never restored, only the words', () => {
  it('gives back the story and leaves the consent box UNTICKED', () => {
    // "I lived this, or the person who did has agreed to share it, and it may
    // be shown to my space with this name." Restoring a tick from storage would
    // re-make that promise days later without the person looking at it.
    writeFormDraft('s', { ...BLANK, body: 'a true story', source: 'Me', consent: true }, win);
    const back = readFormDraft('s', BLANK, win);
    expect(back.body).toBe('a true story');
    expect(back.source).toBe('Me');
    expect(back.consent).toBe(false);
    expect(NEVER_RESTORED).toContain('consent');
  });
});

describe('it never costs anybody their words by failing', () => {
  it('a private window that throws gives back the blank form, never an error', () => {
    expect(() => writeFormDraft('s', { ...BLANK, body: 'x' }, THROWS)).not.toThrow();
    expect(writeFormDraft('s', { ...BLANK, body: 'x' }, THROWS)).toBe(false);
    expect(readFormDraft('s', BLANK, THROWS)).toEqual(BLANK);
  });

  it('a corrupt draft is the blank form, not a half-filled one', () => {
    win.localStorage.setItem(draftKey('s'), '{not json');
    expect(readFormDraft('s', BLANK, win)).toEqual(BLANK);
  });

  it('a draft from an OLDER form shape cannot smuggle in a key this form lacks', () => {
    win.localStorage.setItem(draftKey('s'), JSON.stringify({ form: { body: 'kept', gone_field: 'x' }, at: 'z' }));
    const back = readFormDraft('s', BLANK, win);
    expect(back.body).toBe('kept');
    expect(back.gone_field).toBeUndefined();
  });

  it('WORD_FIELDS is what decides a draft exists, and the scaffolding is not words', () => {
    expect(WORD_FIELDS).toContain('body');
    expect(WORD_FIELDS).not.toContain('kind');
    expect(WORD_FIELDS).not.toContain('tone');
    expect(hasWords({ kind: 'parable', tone: 'light', target_lesson_id: 'll1' })).toBe(false);
    // And the courtesy verse the app offers is not the person's writing.
    expect(hasWords({ ...BLANK }, BLANK)).toBe(false);
    expect(hasWords({ ...BLANK, verse: 'Job 14:5' }, BLANK)).toBe(true);
  });

  it('clearing is the ONLY thing that forgets — and only the one surface', () => {
    writeFormDraft('a', { ...BLANK, body: 'first' }, win);
    writeFormDraft('b', { ...BLANK, body: 'second' }, win);
    clearDraft('a', win);
    expect(readFormDraft('a', BLANK, win).body).toBe('');
    expect(readFormDraft('b', BLANK, win).body).toBe('second');
  });
});

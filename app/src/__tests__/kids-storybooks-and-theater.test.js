// @vitest-environment node
// =============================================================================
// The storybooks are the Word, word for word; the questions' answers are in
// the verses just read; every line of our own voice passes the content gate;
// the Theater never calls an episode watchable before it is (DR-1508).
// Each proof is shown to catch.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseRef } from '../lib/bible-kjv.js';
import {
  STORYBOOKS,
  storybookById,
  storybookVoiceLines,
  answerKeywords,
  gradeStoryAnswer,
  storyProgress,
  orderShuffle,
  gradeOrder,
} from '../lib/kids/storybooks.js';
import { trailFor, trailProgress, stopTap, activityRecord, TRAIL_COURSES } from '../lib/kids/trail.js';
import { KIDS_ROSTER, namesPerson } from '../lib/kids/who-am-i.js';
import { checkVoice, checkVoices, FANTASY_DEVICES } from '../lib/kids/voice-gate.js';
import { EPISODES, validateEpisodes, watchable, shelfLabel, nowShowing, theaterVoiceLines, mediaKind } from '../lib/kids/theater.js';
import { SHOT_LIST } from '../lib/kids/guides.js';
import { COLG_DEFAULT_CHURCH } from '../lib/default-church.js';

const KJV = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'bible', 'kjv');
const books = new Map();
function verse(ref) {
  const p = parseRef(ref);
  if (!p) throw new Error(`unparseable reference: ${ref}`);
  if (!books.has(p.file)) books.set(p.file, JSON.parse(readFileSync(join(KJV, `${p.file}.json`), 'utf8')));
  const ch = books.get(p.file).chapters[p.chapter - 1];
  const parts = [];
  for (let v = p.v1; v <= p.v2; v += 1) parts.push(ch[v - 1]);
  return parts.join(' ');
}

describe('the storybooks are the Word', () => {
  it('three books of eight pages, every page a real verse that opens in the in-repo KJV', () => {
    expect(STORYBOOKS.map((b) => b.id)).toEqual(['jonah', 'noah', 'david']);
    for (const b of STORYBOOKS) {
      expect(b.pages.length).toBe(8);
      for (const p of b.pages) {
        expect(verse(p.ref).length, `${b.id} ${p.ref}`).toBeGreaterThan(10);
        expect(['girl', 'boy']).toContain(p.who);
      }
    }
  });
  it("every page's shot is in the artwork collection, so no page waits on a render nobody asked for", () => {
    const ids = new Set(SHOT_LIST.map((s) => s.id));
    for (const b of STORYBOOKS) for (const p of b.pages) expect(ids.has(p.shot), `${b.id}: ${p.shot}`).toBe(true);
  });
  it("PROVEN: every right answer's words are in the verse it points to; the proof catches an answer that is not", () => {
    for (const b of STORYBOOKS) {
      expect(b.questions.length).toBe(3);
      for (const qq of b.questions) {
        const text = verse(qq.from).toLowerCase();
        const words = answerKeywords(qq.options[qq.answer]);
        expect(words.length).toBeGreaterThan(0);
        for (const w of words) expect(text.includes(w), `${b.id}: "${w}" is not in ${qq.from}`).toBe(true);
        expect(new Set(qq.options).size).toBe(qq.options.length);
      }
    }
    const bad = answerKeywords('A golden chariot');
    expect(bad.every((w) => verse('Jonah 1:17').toLowerCase().includes(w))).toBe(false);
  });
  it('a wrong tap says not yet, never wrong; progress counts pages read', () => {
    const b = storybookById('jonah');
    expect(gradeStoryAnswer(b.questions[0], 0).right).toBe(true);
    const wrong = gradeStoryAnswer(b.questions[0], 1);
    expect(wrong.right).toBe(false);
    expect(wrong.says).toMatch(/not yet/i);
    expect(wrong.says).not.toMatch(/\bwrong\b/i);
    expect(storyProgress(b, 3)).toEqual({ read: 3, total: 8, done: false });
    expect(storyProgress(b, 8).done).toBe(true);
    expect(storybookById('nope')).toBeNull();
  });
});

describe('the content gate over our own voice', () => {
  it('every caption, question and option in the storybooks and the Theater passes', () => {
    expect(checkVoices(storybookVoiceLines())).toEqual([]);
    expect(checkVoices(theaterVoiceLines())).toEqual([]);
    expect(storybookVoiceLines().length).toBeGreaterThan(40);
  });
  it("PROVEN-TO-CATCH: a fantasy device in a caption is named, and Scripture is never the gate's business", () => {
    const r = checkVoice('Jonah waved his magic wand and made a wish');
    expect(r.ok).toBe(false);
    expect(r.hits).toEqual(['magic', 'wand', 'wish']);
    expect(checkVoices([{ where: 'x', text: 'A lucky charm' }])[0].hits).toContain('lucky');
    expect(FANTASY_DEVICES).toContain('occult');
    // The gate runs over OUR lines only: the verse text is loaded verbatim and is not passed through it.
    expect(checkVoice('Yahweh prepared a great fish; it was His doing, a miracle').ok).toBe(true);
  });
});

describe('the Theater is honest', () => {
  it('no episode is published yet, so nothing is watchable and the shelf says planned or in production', () => {
    expect(validateEpisodes()).toEqual([]);
    expect(EPISODES.some(watchable)).toBe(false);
    expect(EPISODES.map(shelfLabel)).toEqual(['COMING SOON', 'COMING SOON', 'COMING SOON']);
    for (const e of EPISODES)
      expect(
        STORYBOOKS.some((b) => b.id === e.storybook),
        e.id
      ).toBe(true);
  });
  it("now showing is the church's own channel from the record until an episode is published", () => {
    const now = nowShowing(COLG_DEFAULT_CHURCH);
    expect(now.kind).toBe('channel');
    expect(now.url).toBe(COLG_DEFAULT_CHURCH.media.youtube);
    expect(nowShowing({ media: {} }).kind).toBe('none');
    const live = [{ ...EPISODES[0], status: 'published', source: 'https://www.youtube.com/watch?v=abc' }];
    expect(nowShowing(COLG_DEFAULT_CHURCH, live).kind).toBe('episode');
  });
  it('PROVEN-TO-CATCH: an episode marked published without a source is refused; a source on an unpublished one too', () => {
    const bad1 = [{ ...EPISODES[0], status: 'published', source: null }];
    expect(validateEpisodes(bad1)[0]).toMatch(/no playable source/);
    const bad2 = [{ ...EPISODES[1], source: 'https://www.youtube.com/watch?v=x' }];
    expect(validateEpisodes(bad2)[0]).toMatch(/not published/);
    expect(validateEpisodes([{ ...EPISODES[0], status: 'live' }])[0]).toMatch(/unknown status/);
    expect(watchable({ status: 'published', source: 'http://example.com/video' })).toBe(false);
  });
});

describe('J1 of the Jonah adventure (DR-1523): the hero, the verses and the order game', () => {
  it("every book's memory verse and key verse open in the KJV, and its hero is on the Who am I? roster with clues that name the hero", () => {
    for (const b of STORYBOOKS) {
      expect(verse(b.memory).length, `${b.id} memory ${b.memory}`).toBeGreaterThan(10);
      expect(verse(b.keyVerse).length, `${b.id} key ${b.keyVerse}`).toBeGreaterThan(10);
      const hero = KIDS_ROSTER.find((p) => p.name === b.hero);
      expect(hero, `${b.id}: ${b.hero} is not on the roster`).toBeTruthy();
      for (const ref of hero.clues) expect(namesPerson(verse(ref), b.hero)).toBe(true);
    }
    expect(storybookById('jonah').memory).toBe('Jonah 2:9');
    expect(verse('Jonah 2:9')).toMatch(/Salvation is of the LORD\.$/);
  });
  it('the shuffle is a permutation of the pages, never the answer, the same for the same seed; the grade is kind and names where to look', () => {
    const b = storybookById('jonah');
    for (let seed = 0; seed < 40; seed += 1) {
      const o = orderShuffle(b, seed);
      expect([...o].sort((x, y) => x - y)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
      expect(
        o.every((v, i) => v === i),
        `seed ${seed} handed the child the answer`
      ).toBe(false);
      expect(orderShuffle(b, seed)).toEqual(o);
    }
    expect(gradeOrder(b, [0, 1, 2, 3, 4, 5, 6, 7])).toMatchObject({ right: true, complete: true, firstWrong: -1 });
    const slip = gradeOrder(b, [0, 1, 3, 2, 4, 5, 6, 7]);
    expect(slip.right).toBe(false);
    expect(slip.firstWrong).toBe(2);
    expect(slip.says).toMatch(/not yet/i);
    expect(slip.says).not.toMatch(/\bwrong\b/i);
    expect(gradeOrder(b, [0, 1]).complete).toBe(false);
    expect(gradeOrder(b, [1, 0]).firstWrong).toBe(0);
  });
});

describe('the trail lights from rows and unlocks in order (DR-1523)', () => {
  const jonah = storybookById('jonah');
  const row = (lessonId, courseKey) => ({ lessonId, courseKey, completedAt: '2026-11-14T10:00:00Z' });
  it('five stops, each recorded under its course; the episode stop reads coming soon until the episode is published', () => {
    const t = trailFor(jonah);
    expect(t.map((s) => s.id)).toEqual(['read', 'order', 'verse', 'hero', 'watch']);
    expect(t.map((s) => s.lessonId)).toEqual(['storybook-jonah', 'order-jonah', 'memory-jonah', 'whoami-jonah', 'episode-jonah']);
    expect(t.map((s) => s.courseKey)).toEqual([TRAIL_COURSES.read, 'kids-games', 'kids-memory', 'kids-games', 'kids-theater']);
    expect(t[4].available).toBe(false);
    expect(t[4].how).toBe('Coming soon');
    const live = [{ ...EPISODES[0], status: 'published', source: 'lovecorner/kids/episodes/jonah.mp4' }];
    expect(trailFor(jonah, live)[4].available).toBe(true);
  });
  it('no rows: nothing lit, the first stop is next, the rest locked; a storybook row lights exactly its stop and moves next along', () => {
    const none = trailProgress(jonah, []);
    expect(none.stops.map((s) => s.state)).toEqual(['next', 'locked', 'locked', 'locked', 'soon']);
    expect(none).toMatchObject({ lit: 0, total: 4, next: 0, done: false });
    const one = trailProgress(jonah, [row('storybook-jonah', 'kids-storybooks')]);
    expect(one.stops.map((s) => s.state)).toEqual(['lit', 'next', 'locked', 'locked', 'soon']);
    expect(one.lit).toBe(1);
    // A row for another book lights nothing here; a row with no completion lights nothing.
    expect(trailProgress(jonah, [row('storybook-noah', 'kids-storybooks')]).lit).toBe(0);
    expect(trailProgress(jonah, [{ lessonId: 'storybook-jonah', courseKey: 'kids-storybooks', completedAt: null }]).lit).toBe(0);
    // Out of order rows still light their own stop; next is the first unlit.
    const skip = trailProgress(jonah, [row('memory-jonah', 'kids-memory')]);
    expect(skip.stops.map((s) => s.state)).toEqual(['next', 'locked', 'lit', 'locked', 'soon']);
    const all = trailProgress(jonah, [row('storybook-jonah'), row('order-jonah'), row('memory-jonah'), row('whoami-jonah')]);
    expect(all).toMatchObject({ lit: 4, total: 4, next: -1, done: true });
  });
  it('a tap opens a lit or next stop, says kindly what to finish first for a locked one, and never blocks on coming soon', () => {
    const p = trailProgress(jonah, [row('storybook-jonah')]);
    expect(stopTap(p, 0).open).toBe('story:jonah');
    expect(stopTap(p, 1).open).toBe('order:jonah');
    const locked = stopTap(p, 2);
    expect(locked.open).toBeNull();
    expect(locked.says).toMatch(/Finish "Put it in order" first/);
    expect(stopTap(p, 4).open).toBeNull();
    expect(stopTap(p, 4).says).toMatch(/coming soon/i);
    expect(stopTap(p, 9).open).toBeNull();
    const rec = activityRecord({ lessonId: 'order-jonah', courseKey: 'kids-games', at: '2026-11-17T00:00:00Z' });
    expect(rec).toMatchObject({
      lessonId: 'order-jonah',
      courseKey: 'kids-games',
      ageBand: 'child',
      completedAt: '2026-11-17T00:00:00Z',
      quiz: { passed: true, pct: 100 },
    });
  });
});

describe('the Theater plays a file of our own beside YouTube (DR-1523)', () => {
  it('a same-origin MP4 or WebM under the episodes folder is playable; anything else is not', () => {
    expect(mediaKind('lovecorner/kids/episodes/jonah.mp4')).toBe('file');
    expect(mediaKind('/lovecorner/kids/episodes/jonah.webm')).toBe('file');
    expect(mediaKind('https://www.youtube.com/watch?v=abc')).toBe('youtube');
    expect(mediaKind('https://example.com/jonah.mp4')).toBeNull();
    expect(mediaKind('lovecorner/kids/jonah.mp4')).toBeNull();
    expect(mediaKind('lovecorner/kids/episodes/../../x.mp4')).toBeNull();
    const live = [{ ...EPISODES[0], status: 'published', source: 'lovecorner/kids/episodes/jonah.mp4', captions: 'lovecorner/kids/episodes/jonah.en.vtt' }];
    expect(validateEpisodes(live)).toEqual([]);
    expect(watchable(live[0])).toBe(true);
    expect(nowShowing(COLG_DEFAULT_CHURCH, live)).toMatchObject({ kind: 'episode', media: 'file' });
    expect(shelfLabel(live[0])).toBe('WATCH');
  });
  it('PROVEN-TO-CATCH: captions must be a WebVTT file in the episodes folder, and ride only a file of our own', () => {
    const badVtt = [{ ...EPISODES[0], status: 'published', source: 'lovecorner/kids/episodes/jonah.mp4', captions: 'lovecorner/kids/episodes/jonah.srt' }];
    expect(validateEpisodes(badVtt)[0]).toMatch(/WebVTT/);
    const onYoutube = [
      { ...EPISODES[0], status: 'published', source: 'https://www.youtube.com/watch?v=abc', captions: 'lovecorner/kids/episodes/jonah.en.vtt' },
    ];
    expect(validateEpisodes(onYoutube)[0]).toMatch(/only a file of our own/);
    expect(EPISODES.every((e) => e.poster === null && e.captions === null)).toBe(true);
  });
});

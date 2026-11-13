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
import { STORYBOOKS, storybookById, storybookVoiceLines, answerKeywords, gradeStoryAnswer, storyProgress } from '../lib/kids/storybooks.js';
import { checkVoice, checkVoices, FANTASY_DEVICES } from '../lib/kids/voice-gate.js';
import { EPISODES, validateEpisodes, watchable, shelfLabel, nowShowing, theaterVoiceLines } from '../lib/kids/theater.js';
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
  it('PROVEN-TO-CATCH: a fantasy device in a caption is named, and Scripture is never the gate\'s business', () => {
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
    expect(EPISODES.map(shelfLabel)).toEqual(['IN PRODUCTION', 'PLANNED', 'PLANNED']);
    for (const e of EPISODES) expect(STORYBOOKS.some((b) => b.id === e.storybook), e.id).toBe(true);
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

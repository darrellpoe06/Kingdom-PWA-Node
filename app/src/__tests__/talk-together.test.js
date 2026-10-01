// @vitest-environment node
// Every lesson sends you to someone (DR-0733): parents to children, children to
// parents, friend to friend, until we all see Yahweh has been right.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ownPrompts, hasAllThree, talkTogetherFor, talkTogetherCoverage, mustCarryOwn, TALK_TOGETHER_VERSES, TALK_TOGETHER_AIM, TALK_TOGETHER_METHOD } from '../lib/talk-together.js';
import { buildCatalogCourseDescriptors } from '../lib/learn-catalog.js';
import baseline from '../lib/talk-together-baseline.json';

const HERE = dirname(fileURLToPath(import.meta.url));
const verse = (b, c, v) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${b.replace(/ /g, '')}.json`), 'utf8')).chapters[c - 1][v - 1];

const FULL = {
  title: 'A Lesson — With Its Own Prompts',
  lesson: 'Parents, ask your children what this shows about Yahweh and listen before you teach. Friends, tell each other one thing you saw.',
  levels: { child: 'Ask your mom or dad what this means to them. Tell them one thing you saw.', youth: 'Ask your parents what they think.', teen: 'Talk with your parents about it.', senior: 'Sit with your grandchildren and ask them.' },
};

describe('the three directions are found in a lesson\'s own words', () => {
  it('parents to children, children to parents, friend to friend', () => {
    const o = ownPrompts(FULL);
    expect(o.parents).toMatch(/^Parents, ask your children/);
    expect(o.children).toMatch(/^Ask your mom or dad/);
    expect(o.friends).toMatch(/^Friends, tell each other/);
    expect(hasAllThree(FULL)).toBe(true);
  });
  it('a lesson with none gets the standing prompts, marked as not its own, built from its title', () => {
    const t = talkTogetherFor({ title: 'Dying to Live — The Seed', lesson: 'Prose with no prompt.' });
    expect(t.allOwn).toBe(false);
    expect(t.prompts.map((p) => p.to)).toEqual(['Parents', 'Children', 'Friends']);
    for (const p of t.prompts) { expect(p.own).toBe(false); expect(p.text).toContain('Dying to Live'); }
    expect(t.aim).toBe(TALK_TOGETHER_AIM);
    expect(t.verse.ref).toBe('Deuteronomy 6:7');
    // The method rides every standing prompt: a skill (ask, listen, retell,
    // teach one verse) and a rhythm (once today, in a place of Deuteronomy 6:7;
    // one friend this week), on Luke 2:52's frame of growing.
    expect(t.method).toBe(TALK_TOGETHER_METHOD);
    expect(t.prompts[0].text).toMatch(/Listen to the end before you teach, then teach one verse back/);
    expect(t.prompts[0].text).toMatch(/Once today/);
    expect(t.prompts[1].text).toMatch(/in your own words/);
    expect(t.prompts[2].text).toMatch(/one friend this week/i);
    expect(TALK_TOGETHER_METHOD.growth).toContain('Luke 2:52');
  });
  it('PROVEN TO CATCH: two directions are not three', () => {
    const two = { ...FULL, lesson: 'Parents, ask your children what this shows.' };
    expect(hasAllThree(two)).toBe(false);
    expect(ownPrompts(two).friends).toBe('');
  });
  it('every verse the surface quotes is the King James text, verbatim', () => {
    for (const v of TALK_TOGETHER_VERSES) {
      const [, book, c, n] = /^(.+) (\d+):(\d+)$/.exec(v.ref);
      expect(v.text, v.ref).toBe(verse(book, Number(c), Number(n)));
    }
  });
  it('the rule binds lessons added on or after 2026-10-01', () => {
    expect(mustCarryOwn('2026-09-30')).toBe(false);
    expect(mustCarryOwn('2026-10-01')).toBe(true);
    expect(mustCarryOwn(undefined)).toBe(false);
  });
});

describe('the gate: every new lesson carries its own three, and the catalog never loses one', () => {
  const modules = buildCatalogCourseDescriptors().flatMap((c) => (c.schedule || []).map((s) => ({ m: s.module || s, added: (s.module || s).added || s.added || null }))).filter((x) => x.m && (x.m.lesson || x.m.levels));
  it('a lesson added on or after the rule\'s day carries all three directions in its own words', () => {
    const due = modules.filter((x) => mustCarryOwn(x.added));
    const missing = due.filter((x) => !hasAllThree(x.m)).map((x) => `${x.m.id}: ${JSON.stringify(ownPrompts(x.m))}`);
    expect(missing, 'new lessons without all three prompts').toEqual([]);
  });
  it('the count of lessons with their own three prompts never falls below the baseline', () => {
    const c = talkTogetherCoverage(modules.map((x) => x.m));
    expect(c.lessons).toBeGreaterThanOrEqual(baseline.lessons);
    expect(c.all).toBeGreaterThanOrEqual(baseline.all);
  });
});

// =============================================================================
// A shared lesson is a NOTE with a link, never the lesson (DR-0698)
// =============================================================================
// Darrell 2026-09-30: "the shares should be a link with a short clarification
// of how to read the lessons like push play button to hear etc at the end and
// a note with title and a short summary of the lesson... not the full lesson."
//
// These walk EVERY lesson in EVERY mounted course (not a sample), because the
// failure this replaces was a message built from whatever the lesson carried:
// the whole big idea, some of them past 600 characters.
// =============================================================================
import { describe, it, expect, vi } from 'vitest';
import { lessonSharePayload, sectionSharePayload, shareLink } from '../lib/lesson-links.js';
import { tlcLessonSharePayload } from '../lib/tlc-lesson-links.js';
import {
  SHARE_HOW_TO, lessonSummary, sentences, newShareToken, withShareToken, readShareToken, isShareToken, SUMMARY_MAX_CHARS,
} from '../lib/lesson-share.js';
import { LEARN_CATALOG } from '../lib/learn-catalog.js';
import { allTracks } from '../lib/tlc-lessons.js';

const URL = 'https://poetech.us/lovecorner/app/?view=church&sub=learn&course=living-lessons&lesson=ll1';

const everyLesson = () => {
  const out = [];
  for (const c of LEARN_CATALOG) {
    for (const m of c.buildScheduleRows() || []) out.push({ course: c, m });
  }
  return out;
};

describe('the message: title, summary, link, and the how-to LAST', () => {
  const m = {
    id: 'll1',
    title: 'Rest Is a Gift',
    bigIdea: 'Yahweh made the Sabbath for man, not man for the Sabbath. Rest is received, not earned. The third sentence must not travel. Nor the fourth.',
    lesson: 'THE WHOLE BODY OF THE LESSON, which is long and must never be in a share. '.repeat(20),
  };
  const token = 'Tok3nAbcdE12';
  const p = lessonSharePayload(m, { url: URL, courseTitle: 'Living Lessons', token, courseKey: 'living-lessons', lessonId: 'll1' });

  it('carries the title, a short summary, the link with its token, and ends with the how-to', () => {
    expect(p.title).toBe('Rest Is a Gift');
    const link = `${URL}&s=${token}`;
    expect(p.url).toBe(link);
    const iTitle = p.text.indexOf('Rest Is a Gift');
    const iSummary = p.text.indexOf('Yahweh made the Sabbath for man, not man for the Sabbath. Rest is received, not earned.');
    const iLink = p.text.indexOf(link);
    const iHow = p.text.indexOf(SHARE_HOW_TO.church);
    expect(iTitle).toBe(0);
    expect(iSummary).toBeGreaterThan(iTitle);
    expect(iLink).toBeGreaterThan(iSummary);
    expect(iHow).toBeGreaterThan(iLink);
    expect(p.text.endsWith(SHARE_HOW_TO.church)).toBe(true);
    expect(p.text).toContain('Living Lessons · The Love Corner');
  });

  it('says how to read it: no account, ▶ Play to hear it, download needs an account', () => {
    expect(SHARE_HOW_TO.church).toMatch(/no account needed/);
    expect(SHARE_HOW_TO.church).toMatch(/Press ▶ Play to hear it read aloud/);
    expect(SHARE_HOW_TO.church).toMatch(/Downloading the lesson needs a free account/);
  });

  it('never carries the lesson body, and never more than two sentences of the big idea', () => {
    expect(p.text).not.toContain('THE WHOLE BODY OF THE LESSON');
    expect(p.text).not.toContain('The third sentence must not travel');
  });

  it('carries what the record needs', () => {
    expect(p).toMatchObject({ token, courseKey: 'living-lessons', lessonId: 'll1', kind: 'lesson', door: 'church' });
  });
});

describe('every lesson in every course shares a note, not the lesson', () => {
  const all = everyLesson();
  it('the catalog is really there (a vacuous pass is not a pass)', () => {
    expect(LEARN_CATALOG.length).toBeGreaterThan(10);
    expect(all.length).toBeGreaterThan(200);
  });

  it('each share: title first, a summary of at most two sentences / SUMMARY_MAX_CHARS, the link, the how-to last, no body', () => {
    const bad = [];
    for (const { course, m } of all) {
      const url = `https://poetech.us/?course=${course.key}&lesson=${m.id}`;
      const p = lessonSharePayload(m, { url, courseTitle: course.meta.title, token: 'abcdEFGH1234', courseKey: course.key, lessonId: m.id });
      const summary = lessonSummary(m);
      const why = [];
      if (!p.text.startsWith(p.title)) why.push('title not first');
      if (!p.text.endsWith(SHARE_HOW_TO.church)) why.push('how-to not last');
      if (!p.text.includes(`${url}&s=abcdEFGH1234`)) why.push('no link');
      if (summary.length > SUMMARY_MAX_CHARS) why.push(`summary ${summary.length} chars`);
      if (sentences(summary).length > 2) why.push('summary over two sentences');
      const body = String(m.lesson || '').trim();
      if (body.length > 400 && p.text.includes(body.slice(0, 400))) why.push('carries the body');
      if (p.text.length > 1100) why.push(`text ${p.text.length} chars`);
      if (why.length) bad.push(`${course.key}/${m.id}: ${why.join(', ')}`);
    }
    expect(bad).toEqual([]);
  });
});

describe('the summary is cut at a sentence, cleanly', () => {
  it('two sentences when they fit, one when they do not', () => {
    expect(lessonSummary({ bigIdea: 'One. Two. Three.' })).toBe('One. Two.');
    const long = `First sentence here. ${'Word '.repeat(80)}ends.`;
    expect(lessonSummary({ bigIdea: long })).toBe('First sentence here.');
  });
  it('does not break on initialisms or book abbreviations', () => {
    expect(sentences('The A.I. runs here. Read 1 Cor. 13 today. Done.')).toEqual(['The A.I. runs here.', 'Read 1 Cor. 13 today.', 'Done.']);
  });
  it('a first sentence longer than the cap is cut at a word and marked', () => {
    const s = lessonSummary({ bigIdea: `${'word '.repeat(120)}end.` });
    expect(s.length).toBeLessThanOrEqual(SUMMARY_MAX_CHARS);
    expect(s.endsWith('…')).toBe(true);
    expect(s).not.toMatch(/wor…$/);
  });
  it('falls back to the in-app step, then the lesson, and strips authored markup', () => {
    expect(lessonSummary({ inApp: '**Open** the reader. Then listen.' })).toBe('Open the reader. Then listen.');
    expect(lessonSummary({ lesson: '## Heading\nThe body starts here. It goes on. And on.' })).toBe('Heading The body starts here. It goes on.');
  });
});

describe('the token', () => {
  it('is 12 URL-safe characters, rides as s=, and reads back', () => {
    const t = newShareToken();
    expect(isShareToken(t)).toBe(true);
    expect(t).toHaveLength(12);
    const u = withShareToken('https://x.test/?a=1&s=oldToken99#h', t);
    expect(u).toBe(`https://x.test/?a=1&s=${t}#h`);
    expect(readShareToken(u.slice(u.indexOf('?'), u.indexOf('#')))).toBe(t);
    expect(readShareToken('?s=bad')).toBe('');
  });
});

describe('the share sheet gets the message with the link inside it, once', () => {
  it('navigator.share gets title + text (no separate url, so the link is not printed twice or after the how-to)', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const p = lessonSharePayload({ title: 'T', bigIdea: 'One. Two.' }, { url: URL, token: 'abcdEFGH1234' });
    expect(await shareLink(p, { share })).toBe('shared');
    expect(share).toHaveBeenCalledWith({ title: 'T', text: p.text });
  });
  it('the clipboard fallback copies the whole message, not only the link', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const p = lessonSharePayload({ title: 'T', bigIdea: 'One. Two.' }, { url: URL, token: 'abcdEFGH1234' });
    expect(await shareLink(p, { clipboard: { writeText } })).toBe('copied');
    expect(writeText).toHaveBeenCalledWith(p.text);
  });
  it('a section share keeps its section text and also ends with the how-to', () => {
    const p = sectionSharePayload({ id: 'll1', title: 'Rest' }, { label: 'The big idea', text: 'A line.', url: URL, courseTitle: 'Living Lessons', token: 'abcdEFGH1234', courseKey: 'living-lessons' });
    expect(p.text.endsWith(SHARE_HOW_TO.church)).toBe(true);
    expect(p.text.indexOf(p.url)).toBeLessThan(p.text.indexOf(SHARE_HOW_TO.church));
    expect(p).toMatchObject({ kind: 'section', lessonId: 'll1', courseKey: 'living-lessons' });
  });
});

describe('TLC lessons share the same note, promising only what the TLC door does', () => {
  it('title, summary, link, how-to last; no Play and no download promised (the TLC visitor page has neither)', () => {
    const track = allTracks()[0];
    const m = track.modules[0];
    const p = tlcLessonSharePayload(m, { url: 'https://poetech.us/tlc/app/?tlc=1&course=c&lesson=l', courseTitle: track.title, token: 'abcdEFGH1234', courseKey: track.key });
    expect(p.text.startsWith(m.title)).toBe(true);
    expect(p.text.endsWith(SHARE_HOW_TO.tlc)).toBe(true);
    expect(p.text).toContain('TLC Therapy Solutions');
    expect(p.text).toContain('&s=abcdEFGH1234');
    expect(SHARE_HOW_TO.tlc).not.toMatch(/Play|[Dd]ownload/);
    expect(p).toMatchObject({ door: 'tlc', courseKey: track.key, lessonId: m.id });
  });
});

// @vitest-environment node
// =============================================================================
// Links to the EXACT lesson, and copy blocks that carry their citation
// =============================================================================
// Darrell 2026-08-10: "copy paste options for each section... etc... links to
// the exact lessons... etc?"
//
// Before this the URL carried only the Learn TAB, so handing someone one lesson
// meant sending them to a course picker; and copying a witness section by hand
// on a phone loses either the citation or the verse. These pin both, including
// the two things a copy block may never do: quote Scripture it cannot verify,
// or drop the expert.
import { describe, it, expect, vi } from 'vitest';
import {
  lessonQuery, lessonUrl, parseLessonLink, witnessCopyBlock, lessonCopyBlock, copyText,
} from '../lib/lesson-links.js';
import { WITNESS_SOURCES, witnessVerse } from '../lib/third-witness.js';
import { buildHealthyLivingSchedule, HEALTHY_LIVING_CARE_NOTE } from '../lib/healthy-living-course.js';
import verses from '../lib/godhead-study-verses.json';

describe('a link that opens exactly one lesson', () => {
  it('carries the course AND the lesson, on top of the tab the shell already parses', () => {
    const q = lessonQuery({ courseKey: 'healthy-living', lessonId: 'hl-w3-sleep-memory' });
    expect(q).toContain('view=church');
    expect(q).toContain('sub=learn');
    expect(q).toContain('course=healthy-living');
    expect(q).toContain('lesson=hl-w3-sleep-memory');
  });

  it('round-trips: what we build is what we read back', () => {
    const q = lessonQuery({ courseKey: 'world-issues', lessonId: 'wi-issue-8' });
    expect(parseLessonLink(q)).toEqual({ courseKey: 'world-issues', lessonId: 'wi-issue-8' });
  });

  it('a course link (no lesson) is valid on its own', () => {
    expect(parseLessonLink(lessonQuery({ courseKey: 'healthy-living' })))
      .toEqual({ courseKey: 'healthy-living', lessonId: null });
  });

  it('builds an absolute URL on the app’s own path, injectable for tests', () => {
    expect(lessonUrl({ courseKey: 'healthy-living', lessonId: 'hl-x', origin: 'https://poetech.us', path: '/poetech-app/' }))
      .toBe('https://poetech.us/poetech-app/?view=church&sub=learn&course=healthy-living&lesson=hl-x');
  });

  it('ids with awkward characters survive the round trip', () => {
    const q = lessonQuery({ courseKey: 'a b&c', lessonId: 'x/y?z' });
    expect(parseLessonLink(q)).toEqual({ courseKey: 'a b&c', lessonId: 'x/y?z' });
  });

  it('no course, no link — and a malformed query is simply nothing deep-linked', () => {
    expect(lessonQuery({})).toBe('');
    expect(lessonUrl({})).toBe('');
    expect(parseLessonLink('%%%')).toEqual({ courseKey: null, lessonId: null });
    expect(parseLessonLink(undefined)).toEqual({ courseKey: null, lessonId: null });
  });
});

describe('a copied witness section carries what makes it trustworthy', () => {
  const src = WITNESS_SOURCES[0];
  const block = witnessCopyBlock(src, {
    verseFor: witnessVerse,
    care: HEALTHY_LIVING_CARE_NOTE,
    url: lessonUrl({ courseKey: 'healthy-living', lessonId: `hl-${src.id}`, origin: 'https://poetech.us', path: '/' }),
  });

  it('the expert, credential and work — never an anonymous "studies show"', () => {
    expect(block).toContain(src.source.expert);
    expect(block).toContain(src.source.credential);
    expect(block).toContain(src.source.work);
  });

  it('every verse VERBATIM from the verified corpus', () => {
    for (const p of src.pairs) {
      for (const r of p.refs) {
        const text = verses[r];
        if (text) expect(block).toContain(text);
      }
    }
  });

  it('the claim, where it sits in the work, and the bridge', () => {
    const p = src.pairs[0];
    expect(block).toContain(p.claim);
    expect(block).toContain(p.bridge);
    expect(block).toContain(p.cite);
  });

  it('the care note and the link back to the exact lesson', () => {
    expect(block).toContain(HEALTHY_LIVING_CARE_NOTE);
    expect(block).toContain(`lesson=hl-${src.id}`);
  });

  it('a verse the corpus does NOT hold is named, never invented and never dropped', () => {
    const madeUp = {
      id: 'w3-x', topic: 'T', source: { expert: 'E', credential: 'C', work: 'W' }, summary: 'S',
      pairs: [{ id: 'p', claim: 'C', cite: '1:00', refs: ['Habakkuk 2:2'], bridge: 'B' }],
    };
    const out = witnessCopyBlock(madeUp, { verseFor: () => '' });
    expect(out).toContain('Habakkuk 2:2 — read it in your Bible.');
    expect(out).not.toMatch(/“\s*”/); // never an empty quotation
  });

  it('no source, no block — never a crash', () => {
    expect(witnessCopyBlock(null)).toBe('');
  });
});

describe('a copied lesson is the lesson', () => {
  const lesson = buildHealthyLivingSchedule()[0];
  it('title, Word-first big idea, the body, the anchor, and the link', () => {
    const block = lessonCopyBlock(lesson, { url: 'https://poetech.us/?view=church&sub=learn&course=healthy-living&lesson=' + lesson.id });
    expect(block.startsWith(lesson.title)).toBe(true);
    expect(block).toContain(lesson.bigIdea);
    expect(block).toContain(lesson.levels.standard);
    expect(block).toContain(`Anchor — ${lesson.anchor.ref}`);
    expect(block).toContain(lesson.id);
  });

  it('honors the reader’s own level', () => {
    const teen = lessonCopyBlock(lesson, { level: 'teen' });
    expect(teen).toContain(lesson.levels.teen);
  });

  it('no module, no block', () => {
    expect(lessonCopyBlock(null)).toBe('');
  });
});

describe('copying reports the truth', () => {
  it('true when the clipboard took it', async () => {
    const nav = { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } };
    await expect(copyText('hello', nav)).resolves.toBe(true);
    expect(nav.clipboard.writeText).toHaveBeenCalledWith('hello');
  });

  it('FALSE — not a silent no-op — when the device has no clipboard', async () => {
    await expect(copyText('hello', {})).resolves.toBe(false);
    await expect(copyText('hello', null)).resolves.toBe(false);
  });

  it('false when the browser refuses (permission), never a thrown error', async () => {
    const nav = { clipboard: { writeText: () => Promise.reject(new Error('NotAllowedError')) } };
    await expect(copyText('hello', nav)).resolves.toBe(false);
  });

  it('empty text is never "copied"', async () => {
    const nav = { clipboard: { writeText: vi.fn() } };
    await expect(copyText('', nav)).resolves.toBe(false);
    expect(nav.clipboard.writeText).not.toHaveBeenCalled();
  });
});

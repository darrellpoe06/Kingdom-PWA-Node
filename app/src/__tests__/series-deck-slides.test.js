// =============================================================================
// The SERIES deck is a slide deck, not a wall of prose
// =============================================================================
// Darrell 2026-09-12, with the series presenter open on poetech.us at Week 3 of
// 139 and a full paragraph filling the screen: "looks good however it's supposed
// to open to the power points... the play button". Then, on the band row and the
// clock underneath it: "also adjusting to the age etc and time clock are good
// kpi's".
//
// WHAT WAS ACTUALLY WRONG. coursePresentable put the module's `bigIdea` on the
// wall RAW as the slide lead — 887 characters for ll3. slideOutline (main idea +
// bullets) had existed since 2026-07-19 for exactly this complaint, but it was
// only ever wired into lessonPresentable; the series deck never went through it.
// The same omission left the scenes with no leadByAge, so Presenter's
// `canRepitch` was false and the Everyone/Children/Teens/Adults buttons Darrell
// just called good KPIs changed NOTHING on this deck. They rendered; they did
// not adjust.
//
// AND A SECOND DEFECT THE FIX SURFACED: the sentence splitter treated every
// period as a full stop, so "roughly 1.5 billion years ago" made the headline
// "Science tells an origin story: roughly 1." — a slide whose title ends in a
// decimal point. Both builders shared that regex, so both were wrong.
//
// These tests measure the real series, not a fixture, so a lesson authored
// tomorrow is held to the same shape.
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  splitSentences, slideOutline, coursePresentable, bandTextsForModule, splitTeachingText,
} from '../lib/presentable.js';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';

const flat = (s) => String(s || '').replace(/\s+/g, ' ').trim();
const deck = coursePresentable({ meta: { key: 'll', title: 'Living Lessons' }, schedule: LIVING_LESSONS_MODULES });

describe('splitSentences — a number is not a sentence boundary', () => {
  it('keeps a decimal whole (the ll3 break, verbatim)', () => {
    const out = splitSentences('Science tells an origin story: roughly 1.5 billion years ago a cell swallowed another. It changed everything.');
    expect(out).toHaveLength(2);
    expect(out[0]).toContain('1.5 billion');
  });

  it('keeps common abbreviations whole', () => {
    expect(splitSentences('Dr. Poe teaches it. The room listens.')).toHaveLength(2);
    expect(splitSentences('Use it, e.g. on Sunday. Then again midweek.')).toHaveLength(2);
    expect(splitSentences('Give $4.99 today. It adds up.')).toHaveLength(2);
  });

  it('still splits ordinary sentences, including ! and ?', () => {
    expect(splitSentences('Stop. Look! Do you see? Yes.')).toHaveLength(4);
  });

  it('loses no word and invents none', () => {
    for (const m of LIVING_LESSONS_MODULES) {
      const src = flat(m.bigIdea || '');
      if (!src) continue;
      expect(flat(splitSentences(src).join(' ')), `${m.id} lost or gained words in the split`).toBe(src);
    }
  });

  it('splitTeachingText rejoins to the same words too', () => {
    const src = 'One thing happened 1.5 times. Then a second. Then a third. Then a fourth.';
    expect(flat(splitTeachingText(src).join(' '))).toBe(flat(src));
  });
});

describe('every week in the series deck is shaped like a slide', () => {
  it('a multi-sentence big idea becomes a headline plus bullets — never one block', () => {
    const blocks = deck.scenes.filter((s, i) => {
      const big = LIVING_LESSONS_MODULES[i].bigIdea || '';
      return splitSentences(big).length > 1 && (s.audience.points || []).length === 0;
    });
    expect(blocks.map((s) => s.id), 'these weeks still project a paragraph').toEqual([]);
  });

  it('the headline is ONE sentence, not the whole paragraph', () => {
    const essays = deck.scenes.filter((s, i) => {
      const big = flat(LIVING_LESSONS_MODULES[i].bigIdea || '');
      return big && splitSentences(big).length > 1 && flat(s.audience.lead) === big;
    });
    expect(essays.map((s) => s.id), 'the lead is still the entire big idea').toEqual([]);
  });

  it('no bullet is invented — every point is text the lesson already wrote', () => {
    deck.scenes.forEach((s, i) => {
      const big = flat(LIVING_LESSONS_MODULES[i].bigIdea || '');
      for (const pt of s.audience.points || []) {
        expect(big.includes(flat(pt)), `${s.id} projects a point the lesson never wrote: ${pt}`).toBe(true);
      }
    });
  });

  it('outlining never deletes: the full big idea rides in the presenter notes', () => {
    deck.scenes.forEach((s, i) => {
      const big = flat(LIVING_LESSONS_MODULES[i].bigIdea || '');
      if (!big || flat(s.audience.lead) === big) return;   // the slide IS the whole thing
      const carried = (s.notes || []).some((n) => flat(n.body) === big);
      expect(carried, `${s.id} outlines its big idea but the speaker never gets the full text`).toBe(true);
    });
  });
});

describe('the age band actually re-pitches the series deck (the KPI Darrell named)', () => {
  // Presenter gates the band row on exactly this shape (components/Presenter.jsx
  // `canRepitch`), so an empty leadByAge is a dead button, not a cosmetic miss.
  it('every week carries a child, teen and adult lead', () => {
    const inert = deck.scenes.filter((s) => {
      const l = s.audience.leadByAge || {};
      return !(l.child && l.teen && l.adult);
    });
    expect(inert.map((s) => s.id), 'the band buttons would do nothing on these weeks').toEqual([]);
  });

  it('a lesson with authored child prose pitches the child band differently from adults', () => {
    const withChild = LIVING_LESSONS_MODULES
      .map((m, i) => ({ m, s: deck.scenes[i] }))
      .filter(({ m }) => (m.levels?.child || '').trim() && (m.levels?.senior || '').trim());
    expect(withChild.length).toBeGreaterThan(100);
    for (const { m, s } of withChild) {
      expect(s.audience.leadByAge.child, `${m.id} serves children the adult text`)
        .not.toBe(s.audience.leadByAge.adult);
    }
  });

  it('the band text is the lesson\'s own authored rewrite, shared with the single-lesson deck', () => {
    const m = LIVING_LESSONS_MODULES.find((x) => (x.levels?.child || '').trim());
    const bands = bandTextsForModule(m);
    expect(bands.child).toBe(m.levels.child);
    expect(bands.adult).toBe(m.levels.senior || m.bigIdea);
    expect(slideOutline(bands.child).lead).toBe(
      deck.scenes[LIVING_LESSONS_MODULES.indexOf(m)].audience.leadByAge.child,
    );
  });
});

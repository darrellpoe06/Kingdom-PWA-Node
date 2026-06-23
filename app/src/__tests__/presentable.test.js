import { describe, it, expect } from 'vitest';
import { MODULES, CLASS_META, buildSchedule } from '../lib/church-classes.js';
import {
  TEACH_CHANNEL, formatClock, DEFAULT_KICKER,
  buildSlideForScene, holdingSlide,
  coursePresentable, wordPresentable,
  ageHint, PRESENT_AGE_BANDS, DEFAULT_PRESENT_AGE,
} from '../lib/presentable.js';

describe('presentable — generic present-mode contract', () => {
  it('re-exports the shared channel + clock so callers import one module', () => {
    expect(TEACH_CHANNEL).toBe('poe-teach-v1');
    expect(formatClock(65)).toBe('01:05');
  });

  it('buildSlideForScene emits an audience-only slide with a generic index label', () => {
    const scenes = [
      { id: 's1', indexLabel: 'Week 1 of 2', dateLabel: 'July 11, 2026',
        audience: { title: 'A', lead: 'lead', detail: 'do', detailLabel: 'In the app', anchorRef: 'Ref', anchorTheme: 'theme' },
        notes: [{ kind: 'body', heading: 'secret', body: 'NOTES' }] },
      { id: 's2', audience: { title: 'B' }, notes: [] },
    ];
    const s = buildSlideForScene(scenes, 0, { kicker: 'COLG' });
    expect(s.type).toBe('slide');
    expect(s.index).toBe(1);
    expect(s.total).toBe(2);
    expect(s.indexLabel).toBe('Week 1 of 2');
    expect(s.title).toBe('A');
    expect(s.kicker).toBe('COLG');
    // back-compat: generic + legacy field names both present
    expect(s.lead).toBe('lead');
    expect(s.bigIdea).toBe('lead');
    expect(s.detail).toBe('do');
    expect(s.inApp).toBe('do');
    expect(s.detailLabel).toBe('In the app');
  });

  it('buildSlideForScene NEVER carries presenter notes (no leak to the projector)', () => {
    const scenes = [{ id: 's1', audience: { title: 'A' }, notes: [{ kind: 'body', heading: 'h', body: 'SECRET' }] }];
    const s = buildSlideForScene(scenes, 0);
    expect(s).not.toHaveProperty('notes');
    expect(JSON.stringify(s)).not.toContain('SECRET');
  });

  it('buildSlideForScene returns null past the end (audience keeps last good slide)', () => {
    const scenes = [{ id: 's1', audience: { title: 'A' } }];
    expect(buildSlideForScene(scenes, 1)).toBeNull();
    expect(buildSlideForScene(scenes, -1)).toBeNull();
    expect(buildSlideForScene(null, 0)).toBeNull();
  });

  it('buildSlideForScene falls back to a default index label + kicker', () => {
    const s = buildSlideForScene([{ id: 'x', audience: { title: 'T' } }], 0);
    expect(s.indexLabel).toBe('1 of 1');
    expect(s.kicker).toBe(DEFAULT_KICKER);
  });

  it('holdingSlide is an intentional placeholder carrying the kicker', () => {
    expect(holdingSlide().type).toBe('hold');
    expect(holdingSlide('X', 'K').title).toBe('X');
    expect(holdingSlide('X', 'K').kicker).toBe('K');
    expect(holdingSlide().kicker).toBe(DEFAULT_KICKER);
  });
});

describe('coursePresentable — any Learn course becomes presentable', () => {
  const course = { meta: { ...CLASS_META, key: 'ai' }, schedule: buildSchedule('2026-07-11') };
  const p = coursePresentable(course);

  it('maps every module to a scene with a real per-week date label', () => {
    expect(p.scenes.length).toBe(MODULES.length);
    expect(p.title).toBe(CLASS_META.title);
    expect(p.scenes[0].indexLabel).toBe(`Week 1 of ${MODULES.length}`);
    expect(p.scenes[0].dateLabel).toContain('July 11');
    expect(p.scenes[1].dateLabel).toContain('July 18'); // +7 days, computed not painted
  });

  it('carries learner copy to the audience and facilitator copy to presenter notes', () => {
    const sc = p.scenes[0];
    expect(sc.audience.title).toBe(MODULES[0].title);
    expect(sc.audience.lead).toBe(MODULES[0].bigIdea);
    expect(sc.audience.anchorRef).toBe(MODULES[0].anchor.ref);
    // facilitator guide flows into presenter-only notes (never the audience payload)
    const headings = sc.notes.map((n) => n.heading);
    expect(headings).toContain('Say this');
    expect(headings).toContain('Run of show');
    // the broadcast slide built from this scene leaks none of it
    const slide = buildSlideForScene(p.scenes, 0, { kicker: p.kicker });
    expect(JSON.stringify(slide)).not.toContain(MODULES[0].facilitator.talkingPoints[0]);
  });

  it('handles a bare course (no facilitator/lesson) without inventing notes', () => {
    const bare = coursePresentable({ meta: { title: 'X', key: 'x' }, schedule: [{ id: 'a', title: 'A', bigIdea: 'idea', week: 1 }] });
    expect(bare.scenes[0].notes).toEqual([]);
    expect(bare.scenes[0].audience.title).toBe('A');
  });
});

describe('wordPresentable — the sermon library becomes presentable', () => {
  const sermons = [
    { id: 'm1', title: 'Faith Over Fear', serviceDate: '2026-06-21', serviceType: 'sunday', speaker: 'Bishop Lloyd E. Gwin', scriptureRef: '1 Peter 5', notes: 'cast your cares', status: 'active' },
    { id: 'm2', title: 'Older', serviceDate: '2026-06-14', serviceType: 'wednesday', speaker: 'Guest', scriptureRef: 'Psalm 23', status: 'active' },
    { id: 'd1', title: 'A Draft', serviceDate: '2026-07-01', status: 'draft' },
  ];
  const p = wordPresentable(sermons);

  it('drops drafts and orders newest-first', () => {
    expect(p.scenes.length).toBe(2); // draft excluded
    expect(p.scenes[0].audience.title).toBe('Faith Over Fear'); // newest first
    expect(p.scenes[0].indexLabel).toBe('Message 1 of 2');
  });

  it('puts the scripture on the audience anchor and the speaker/theme in notes', () => {
    const sc = p.scenes[0];
    expect(sc.audience.anchorRef).toBe('1 Peter 5');
    expect(sc.audience.anchorTheme).toContain('Bishop');
    const headings = sc.notes.map((n) => n.heading);
    expect(headings).toContain('Delivered by');
    expect(headings).toContain('Text');
  });

  it('is empty-safe', () => {
    expect(wordPresentable(null).scenes).toEqual([]);
    expect(wordPresentable([]).scenes).toEqual([]);
  });
});

describe('age-adaptive presenter hook', () => {
  it('exposes child/teen/adult bands with a coaching hint each', () => {
    expect(PRESENT_AGE_BANDS.map((b) => b.id)).toEqual(['child', 'teen', 'adult']);
    expect(ageHint('child')).toMatch(/one idea/i);
    expect(ageHint('nonsense')).toBe(ageHint(DEFAULT_PRESENT_AGE)); // falls back
  });
});

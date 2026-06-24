import { describe, it, expect } from 'vitest';
import { MODULES, CLASS_META, buildSchedule } from '../lib/church-classes.js';
import {
  TEACH_CHANNEL, formatClock, DEFAULT_KICKER,
  buildSlideForScene, holdingSlide,
  coursePresentable, wordPresentable,
  ageHint, PRESENT_AGE_BANDS, DEFAULT_PRESENT_AGE,
  DEFAULT_SCENE_MIN, PRIORITY,
  withSceneTiming, fullContentMin, fitToBudget, deterministicSkipRanker,
  makeScene, addScene, editScene,
  loadOverlay, saveOverlay, applyOverlay, overlayKey, EMPTY_OVERLAY,
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

// -----------------------------------------------------------------------------
// time-adaptive: contract additions + fit-to-budget + skip-suggest
// -----------------------------------------------------------------------------
const scene = (id, estimatedMin, priority) => ({ id, estimatedMin, priority, audience: { title: id }, notes: [] });
// Two core (10+10) + two supplementary (10+5) = 35 min full curriculum.
const CURRICULUM = [
  scene('A', 10, PRIORITY.CORE),
  scene('B', 10, PRIORITY.CORE),
  scene('C', 10, PRIORITY.SUPPLEMENTARY),
  scene('D', 5, PRIORITY.SUPPLEMENTARY),
];
const byId = (rows, id) => rows.find((r) => r.id === id);

describe('scene timing contract (estimatedMin + priority) with backfill', () => {
  it('withSceneTiming supplies defaults without mutating + normalizes priority', () => {
    const bare = { id: 'x', audience: { title: 'X' } };
    const t = withSceneTiming(bare);
    expect(t.estimatedMin).toBe(DEFAULT_SCENE_MIN);
    expect(t.priority).toBe(PRIORITY.CORE);    // un-annotated -> core (protected)
    expect(bare.estimatedMin).toBeUndefined(); // non-mutating
    expect(withSceneTiming({ id: 'y', estimatedMin: 0 }, { defaultMin: 7 }).estimatedMin).toBe(7);
    expect(withSceneTiming({ id: 'z', priority: 'supplementary' }).priority).toBe(PRIORITY.SUPPLEMENTARY);
  });

  it('fullContentMin sums the whole curriculum', () => {
    expect(fullContentMin(CURRICULUM)).toBe(35);
    expect(fullContentMin([{ id: 'a' }, { id: 'b' }], { defaultMin: 4 })).toBe(8);
  });

  it('the course + word adapters now carry timing fields (back-compat)', () => {
    const p = wordPresentable([{ id: 'm1', title: 'T', serviceDate: '2026-06-21', status: 'active' }]);
    expect(p.scenes[0].estimatedMin).toBeGreaterThan(0);
    expect(p.scenes[0].priority).toBe(PRIORITY.CORE);
  });
});

describe('fitToBudget — reflow into the time available', () => {
  it('keeps everything when the full curriculum fits (no skips, own estimates)', () => {
    const r = fitToBudget(CURRICULUM, 60);
    expect(r.fits).toBe(true);
    expect(r.overBudget).toBe(false);
    expect(r.compressed).toBe(false);
    expect(r.skipped).toHaveLength(0);
    expect(r.keptMin).toBe(35);
    expect(r.summary).toMatch(/full curriculum/i);
  });

  it('drops supplementary first to fit, never core', () => {
    const r = fitToBudget(CURRICULUM, 30);          // 35 -> needs to shed 5+
    expect(r.fits).toBe(false);
    expect(r.overBudget).toBe(false);
    // largest supplementary (C=10) dropped first; D (5) retained; both core kept
    expect(byId(r.plan, 'C').skipped).toBe(true);
    expect(byId(r.plan, 'C').skipReason).toBe('auto');
    expect(byId(r.plan, 'D').skipped).toBe(false);
    expect(byId(r.plan, 'A').skipped).toBe(false);
    expect(byId(r.plan, 'B').skipped).toBe(false);
    expect(r.counts).toMatchObject({ coreKept: 2, suppKept: 1, suppSkipped: 1, coreSkipped: 0 });
    expect(r.keptMin).toBeLessThanOrEqual(30);
    expect(r.summary).toMatch(/core understanding still lands/i);
  });

  it('protects core: when core alone exceeds budget it compresses, never skips core', () => {
    const r = fitToBudget(CURRICULUM, 15);          // core is 20 > 15
    expect(r.overBudget).toBe(true);
    expect(r.compressed).toBe(true);
    expect(r.counts.coreSkipped).toBe(0);            // core NEVER auto-skipped
    expect(byId(r.plan, 'A').skipped).toBe(false);
    expect(byId(r.plan, 'B').skipped).toBe(false);
    // both supplementary dropped, core compressed proportionally to fit 15
    expect(byId(r.plan, 'A').allocatedMin).toBeCloseTo(7.5, 5);
    expect(r.keptMin).toBeCloseTo(15, 5);
    expect(r.summary).toMatch(/core/i);
  });

  it('honors a forced KEEP of a supplementary scene (survives auto-skip)', () => {
    const r = fitToBudget(CURRICULUM, 20, { overrides: { C: 'keep' } });
    expect(byId(r.plan, 'C').skipped).toBe(false);   // user override wins
    expect(byId(r.plan, 'D').skipped).toBe(true);    // the other supplementary goes
  });

  it('honors a forced SKIP (even of a core scene — the user decides)', () => {
    const r = fitToBudget(CURRICULUM, 100, { overrides: { A: 'skip' } });
    expect(r.fits).toBe(true);                        // full content fits the 100
    expect(byId(r.plan, 'A').skipped).toBe(true);
    expect(byId(r.plan, 'A').skipReason).toBe('forced');
    expect(r.counts.coreSkipped).toBe(1);
  });

  it('treats no/!finite budget as "keep all"', () => {
    const r = fitToBudget(CURRICULUM, 0);
    expect(r.budgetMin).toBe(35);
    expect(r.skipped).toHaveLength(0);
  });

  it('NEVER leaks notes through the slide built from a kept scene', () => {
    const scenes = [{ id: 's', estimatedMin: 5, priority: 'core', audience: { title: 'A' }, notes: [{ kind: 'body', heading: 'h', body: 'SECRET' }] }];
    const r = fitToBudget(scenes, 30);
    const slide = buildSlideForScene(r.kept, 0);
    expect(JSON.stringify(slide)).not.toContain('SECRET');
  });

  it('deterministicSkipRanker orders largest-time-first, stable on ties', () => {
    const cands = [
      { _key: 'a', _i: 0, estimatedMin: 5 },
      { _key: 'b', _i: 1, estimatedMin: 10 },
      { _key: 'c', _i: 2, estimatedMin: 5 },
    ];
    expect(deterministicSkipRanker(cands)).toEqual(['b', 'a', 'c']);
  });

  it('accepts an adaptive ranker seam (opts.rankSkips) and falls back safely', () => {
    // a custom ranker that drops D before C (opposite of the default largest-first)
    const r = fitToBudget(CURRICULUM, 30, { rankSkips: () => ['D'] });
    expect(byId(r.plan, 'D').skipped).toBe(true);
    expect(byId(r.plan, 'C').skipped).toBe(false);
    // a throwing ranker must not break the reflow (deterministic fallback engages)
    const safe = fitToBudget(CURRICULUM, 30, { rankSkips: () => { throw new Error('llm down'); } });
    expect(safe.skipped.length).toBeGreaterThan(0);
  });
});

// -----------------------------------------------------------------------------
// user-extensible curriculum: add / edit a section + persisted overlay
// -----------------------------------------------------------------------------
function memStorage(seed = {}) {
  const m = { ...seed };
  return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = v; }, _store: m };
}

describe('living curriculum — add + edit scenes', () => {
  it('makeScene builds a well-formed, audience-shaped, timed scene from minimal input', () => {
    const s = makeScene({ uid: '1', title: 'Closing prayer', note: 'send them out', estimatedMin: 3, priority: 'supplementary' });
    expect(s.audience.title).toBe('Closing prayer');
    expect(s.estimatedMin).toBe(3);
    expect(s.priority).toBe(PRIORITY.SUPPLEMENTARY);
    expect(s.userAdded).toBe(true);
    expect(s.notes[0].body).toBe('send them out');
    // missing fields fall back sanely
    const bare = makeScene({});
    expect(bare.audience.title).toBe('New section');
    expect(bare.estimatedMin).toBe(DEFAULT_SCENE_MIN);
    expect(bare.priority).toBe(PRIORITY.CORE);
  });

  it('addScene appends (or inserts) and grows the curriculum', () => {
    const grown = addScene(CURRICULUM, { uid: 'x', title: 'New', estimatedMin: 4 });
    expect(grown).toHaveLength(5);
    expect(grown[4].audience.title).toBe('New');
    const inserted = addScene(CURRICULUM, { uid: 'y', title: 'Front' }, 0);
    expect(inserted[0].audience.title).toBe('Front');
    expect(inserted).toHaveLength(5);
  });

  it('editScene upgrades a scene in place (audience merge + retime) without touching others', () => {
    const edited = editScene(CURRICULUM, 'A', { audience: { lead: 'deeper idea' }, estimatedMin: 12, priority: 'supplementary' });
    expect(byId(edited, 'A').audience.title).toBe('A');     // preserved
    expect(byId(edited, 'A').audience.lead).toBe('deeper idea');
    expect(byId(edited, 'A').estimatedMin).toBe(12);
    expect(byId(edited, 'A').priority).toBe(PRIORITY.SUPPLEMENTARY);
    expect(byId(edited, 'B').audience.lead).toBeUndefined(); // untouched
  });

  it('an added section never leaks its note to the audience slide', () => {
    const grown = addScene(CURRICULUM, { uid: 'z', title: 'Visible title', note: 'PRIVATE-NOTE' });
    const slide = buildSlideForScene(grown, grown.length - 1);
    expect(slide.title).toBe('Visible title');
    expect(JSON.stringify(slide)).not.toContain('PRIVATE-NOTE');
  });
});

describe('living curriculum — persisted overlay (storage-injected)', () => {
  it('save -> load round-trips the overlay under a per-presentable key', () => {
    const store = memStorage();
    const overlay = { added: [makeScene({ uid: '1', title: 'Extra' })], edits: { A: { estimatedMin: 8 } } };
    expect(saveOverlay('course:ai', overlay, store)).toBe(true);
    expect(Object.keys(store._store)).toContain(overlayKey('course:ai'));
    const loaded = loadOverlay('course:ai', store);
    expect(loaded.added[0].audience.title).toBe('Extra');
    expect(loaded.edits.A.estimatedMin).toBe(8);
  });

  it('loadOverlay is empty-safe without storage or on bad JSON', () => {
    expect(loadOverlay('k', null)).toEqual(EMPTY_OVERLAY);
    expect(loadOverlay('k', memStorage({ [overlayKey('k')]: '{not json' }))).toEqual(EMPTY_OVERLAY);
  });

  it('applyOverlay layers edits then additions onto the base (base unmutated)', () => {
    const overlay = { added: [makeScene({ uid: '9', title: 'Appended' })], edits: { A: { estimatedMin: 99 } } };
    const result = applyOverlay(CURRICULUM, overlay);
    expect(result).toHaveLength(5);
    expect(byId(result, 'A').estimatedMin).toBe(99);
    expect(result[4].audience.title).toBe('Appended');
    expect(CURRICULUM[0].estimatedMin).toBe(10); // base untouched
    // and the reflow consumes the grown curriculum end-to-end
    const fit = fitToBudget(result, 40);
    expect(fit.counts.total).toBe(5);
  });
});

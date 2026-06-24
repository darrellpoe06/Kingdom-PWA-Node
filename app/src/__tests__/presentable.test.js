import { describe, it, expect } from 'vitest';
import { MODULES, CLASS_META, buildSchedule } from '../lib/church-classes.js';
import {
  TEACH_CHANNEL, formatClock, DEFAULT_KICKER,
  buildSlideForScene, holdingSlide,
  coursePresentable, wordPresentable,
  studyPresentable, conferencePresentable, documentPresentable,
  stripTags, splitHtmlSections,
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

// -----------------------------------------------------------------------------
// studyPresentable — Darrell's Study reflections become presentable
// -----------------------------------------------------------------------------
describe('studyPresentable — a reflection becomes presentable, deep source stays back', () => {
  const entries = [
    { id: 'r1', kind: 'reflection', title: 'Metanoia', scripture: 'Rom 12:2',
      plain: 'Real change starts in how you think.', deep: 'SECRET-DEEP-SOURCE about the nous', tags: ['mind'], createdAt: '2026-06-16T00:00:00Z', pinned: false },
    { id: 'r2', kind: 'research', title: 'For a wide room', scripture: '1 Cor 9:22',
      plain: 'One truth, reworked to reach a culture.', deep: 'CONFIDENTIAL research notes', culture: 'campus students', createdAt: '2026-06-15T00:00:00Z', pinned: true },
    { id: 'r3', kind: 'reflection', title: 'Undistilled', plain: '', deep: 'only a deep source, no plain yet', createdAt: '2026-06-14T00:00:00Z' },
  ];
  const p = studyPresentable(entries, { title: "Darrell's Study" });

  it('only presents entries that have a plain (audience) layer', () => {
    expect(p.scenes.length).toBe(2); // r3 (no plain) is skipped
    expect(p.title).toBe("Darrell's Study");
  });

  it('pinned-first then newest-first order', () => {
    expect(p.scenes[0].audience.title).toBe('For a wide room'); // pinned wins
    expect(p.scenes[1].audience.title).toBe('Metanoia');
    expect(p.scenes[0].indexLabel).toBe('Reflection 1 of 2');
  });

  it('puts the plain layer on the audience and the scripture on the anchor', () => {
    const sc = p.scenes[1];
    expect(sc.audience.lead).toBe('Real change starts in how you think.');
    expect(sc.audience.anchorRef).toBe('Rom 12:2');
    expect(sc.audience.anchorTheme).toBe('Reflection');
  });

  it('NEVER leaks the deep source to the projected slide (no-leak)', () => {
    p.scenes.forEach((_, i) => {
      const slide = buildSlideForScene(p.scenes, i, { kicker: p.kicker });
      expect(JSON.stringify(slide)).not.toContain('SECRET-DEEP-SOURCE');
      expect(JSON.stringify(slide)).not.toContain('CONFIDENTIAL');
    });
    // the deep source is present, but only in presenter notes
    const metanoia = p.scenes.find((s) => s.audience.title === 'Metanoia');
    expect(JSON.stringify(metanoia.notes)).toContain('SECRET-DEEP-SOURCE');
  });

  it('is empty-safe', () => {
    expect(studyPresentable(null).scenes).toEqual([]);
    expect(studyPresentable([]).scenes).toEqual([]);
  });
});

// -----------------------------------------------------------------------------
// conferencePresentable — a session agenda becomes presentable
// -----------------------------------------------------------------------------
describe('conferencePresentable — the agenda becomes presentable, logistics stay back', () => {
  const sessions = [
    { id: 's2', title: 'Evening Worship', day: 'Tue Jul 15', time: '7:00 PM', speaker: 'Bishop Gwin',
      sessionType: 'main_service', capacity: 800, sortOrder: 1, status: 'active' },
    { id: 's1', title: 'Welcome Breakout', day: 'Tue Jul 15', time: '5:00 PM', speaker: 'Host',
      sessionType: 'breakout', capacity: 60, sortOrder: 0, status: 'active' },
    { id: 's3', title: 'Archived', sessionType: 'other', sortOrder: 2, status: 'archived' },
  ];
  const p = conferencePresentable(sessions, {
    title: 'The Assembly',
    resolveRoom: (s) => (s.id === 's2' ? 'South Campus · Main Sanctuary' : null),
    resolveSermon: (s) => (s.id === 's2' ? 'Faith Over Fear' : null),
    resolveSongs: (s) => (s.id === 's2' ? ['Total Praise', 'Way Maker'] : []),
  });

  it('drops archived sessions and orders by sortOrder', () => {
    expect(p.scenes.length).toBe(2);
    expect(p.scenes[0].audience.title).toBe('Welcome Breakout'); // sortOrder 0
    expect(p.scenes[1].audience.title).toBe('Evening Worship');
    expect(p.title).toBe('The Assembly');
  });

  it('audience sees title/speaker/when-where + the linked message & music', () => {
    const sc = p.scenes[1];
    expect(sc.audience.lead).toBe('Bishop Gwin');
    expect(sc.audience.detail).toContain('Tue Jul 15');
    expect(sc.audience.detail).toContain('Main Sanctuary');
    expect(sc.audience.anchorRef).toBe('Faith Over Fear');
    expect(sc.audience.anchorTheme).toContain('Total Praise');
  });

  it('keeps capacity/type off the projected slide (presenter-only)', () => {
    const slide = buildSlideForScene(p.scenes, 1, { kicker: p.kicker });
    expect(JSON.stringify(slide)).not.toContain('800'); // capacity not projected
    // capacity rides in presenter notes instead
    expect(JSON.stringify(p.scenes[1].notes)).toContain('800');
  });

  it('is empty-safe and resolver-optional', () => {
    expect(conferencePresentable(null).scenes).toEqual([]);
    const bare = conferencePresentable([{ id: 'x', title: 'Bare', status: 'active' }]);
    expect(bare.scenes[0].audience.title).toBe('Bare');
    expect(bare.scenes[0].audience.anchorRef).toBeNull();
  });
});

// -----------------------------------------------------------------------------
// documentPresentable — a created document becomes presentable (HTML -> slides)
// -----------------------------------------------------------------------------
describe('stripTags + splitHtmlSections — pure HTML helpers (no DOM)', () => {
  it('stripTags decodes entities and inserts block spacing', () => {
    expect(stripTags('<p>Hello<br>there</p><p>friend &amp; co</p>')).toBe('Hello there friend & co');
    expect(stripTags('')).toBe('');
    expect(stripTags('<h1>Title</h1>')).toBe('Title');
  });

  it('splitHtmlSections splits on H1/H2 with a preamble section', () => {
    const html = '<p>Intro line.</p><h1>First</h1><p>Body one.</p><h2>Second</h2><p>Body two.</p>';
    const secs = splitHtmlSections(html);
    expect(secs.map((s) => s.heading)).toEqual([null, 'First', 'Second']);
    expect(secs[0].text).toBe('Intro line.');
    expect(secs[1].text).toBe('Body one.');
    expect(secs[2].level).toBe(2);
  });

  it('a document with no headings is one heading-less section', () => {
    const secs = splitHtmlSections('<p>Just one paragraph.</p>');
    expect(secs.length).toBe(1);
    expect(secs[0].heading).toBeNull();
    expect(secs[0].text).toBe('Just one paragraph.');
    expect(splitHtmlSections('')).toEqual([]);
  });
});

describe('documentPresentable — a document becomes a deck', () => {
  it('splits a headed document into a title slide + one slide per heading', () => {
    const ws = { id: 'w1', title: 'My Plan', content: '<p>Opening.</p><h1>Vision</h1><p>The why.</p><h2>Steps</h2><ul><li>One</li><li>Two</li></ul>' };
    const p = documentPresentable(ws);
    expect(p.title).toBe('My Plan');
    expect(p.id).toBe('doc:w1');
    expect(p.scenes.map((s) => s.audience.title)).toEqual(['My Plan', 'Vision', 'Steps']);
    expect(p.scenes[0].audience.lead).toBe('Opening.'); // preamble on the title slide
    expect(p.scenes[1].indexLabel).toBe('Section 1 of 2');
    expect(p.scenes[2].audience.lead).toContain('One');
  });

  it('a heading-less document collapses to a single slide', () => {
    const p = documentPresentable({ id: 'w2', title: 'Note', content: '<p>One thought, no headings.</p>' });
    expect(p.scenes.length).toBe(1);
    expect(p.scenes[0].audience.title).toBe('Note');
    expect(p.scenes[0].audience.lead).toBe('One thought, no headings.');
  });

  it('every document scene carries no presenter notes (nothing to leak)', () => {
    const p = documentPresentable({ id: 'w3', title: 'T', content: '<h1>A</h1><p>x</p><h2>B</h2><p>y</p>' });
    p.scenes.forEach((s) => expect(s.notes).toEqual([]));
  });

  it('handles an empty / untitled document safely', () => {
    const p = documentPresentable({});
    expect(p.title).toBe('Untitled document');
    expect(p.scenes.length).toBe(1);
    expect(p.scenes[0].audience.title).toBe('Untitled document');
  });
});

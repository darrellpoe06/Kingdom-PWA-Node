import { describe, it, expect } from 'vitest';
import { MODULES, CLASS_META, buildSchedule } from '../lib/church-classes.js';
import {
  TEACH_CHANNEL, formatClock, DEFAULT_KICKER,
  buildSlideForScene, holdingSlide, resolveAudienceLead,
  slideOutline, resolveAudiencePoints, scriptureRefsInText,
  coursePresentable, lessonPresentable, wordLibrary, messagePresentable, parseRunOfShow,
  studyPresentable, conferencePresentable, documentPresentable,
  stripTags, splitHtmlSections,
  ageHint, PRESENT_AGE_BANDS, DEFAULT_PRESENT_AGE,
  DEFAULT_SCENE_MIN, PRIORITY,
  withSceneTiming, estimateSceneMinutes, fullContentMin, fitToBudget, deterministicSkipRanker,
  importanceSkipRanker, DEFAULT_IMPORTANCE,
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
    // the run-of-show is NO LONGER a static note — it is reflowable scene.runOfShow
    expect(headings).not.toContain('Run of show');
    expect(Array.isArray(sc.runOfShow)).toBe(true);
    expect(sc.runOfShow.length).toBeGreaterThan(0);
    expect(sc.runOfShow[0]).toMatchObject({ name: expect.any(String) });
    // the broadcast slide built from this scene leaks neither notes NOR the run-of-show
    const slide = buildSlideForScene(p.scenes, 0, { kicker: p.kicker });
    expect(JSON.stringify(slide)).not.toContain(MODULES[0].facilitator.talkingPoints[0]);
    expect(slide).not.toHaveProperty('runOfShow');
  });

  it('handles a bare course (no facilitator/lesson) without inventing notes', () => {
    const bare = coursePresentable({ meta: { title: 'X', key: 'x' }, schedule: [{ id: 'a', title: 'A', bigIdea: 'idea', week: 1 }] });
    expect(bare.scenes[0].notes).toEqual([]);
    expect(bare.scenes[0].audience.title).toBe('A');
  });
});

describe('lessonPresentable — ONE lesson, timed to itself (not the 607-min series)', () => {
  const lesson = {
    id: 'mit1',
    title: 'The Design in Time',
    bigIdea: 'God made us to grow through stages.',
    inApp: 'Feed your stage the Word this week.',
    anchor: { ref: 'Ecclesiastes 3:1', theme: 'a time to every purpose' },
    levels: {
      child: 'God made you to grow. That is on purpose!',
      teen: 'You are still forming, on purpose. Feed it well.',
      senior: 'Every stage is His design. Honor the frame He gave.',
    },
    facilitator: {
      talkingPoints: ['Growth is design, not deficiency.'],
      discussionPrompts: ['Where have you treated a normal stage as a flaw?'],
      howToRun: 'Open in prayer + read the Scripture (3): Ecclesiastes 3:1 | The big idea (15): the maturing brain as witness | Go deeper (10): what changes | Reflect together (8): use the prompts | Take it with you (2): one input',
    },
  };

  it('leads with a TITLE card, then its parts + a closing Scripture recap', () => {
    const p = lessonPresentable(lesson);
    expect(p.id).toBe('lesson:mit1');
    expect(p.title).toBe('The Design in Time');
    // a title card + 5 authored segments + the "The Word we stood on" recap = 7 scenes
    expect(p.scenes.length).toBe(7);
    // the FIRST slide is the lesson TITLE — the standing background until the speaker begins
    expect(p.scenes[0].id).toMatch(/-title$/);
    expect(p.scenes[0].audience.title).toBe('The Design in Time');
    expect(p.scenes[0].indexLabel).toBe('Part 1 of 7');
    expect(p.scenes[6].audience.title).toBe('The Word we stood on');
    // targetMin is THIS lesson's TEACHING length (3+15+10+8+2 + 2 recap = 40) — the
    // title card is a standing background, NOT counted in the teaching time.
    expect(p.targetMin).toBe(40);
  });

  it('shows the anchor Word VERBATIM on the opener class screen and repeats it as a recap', () => {
    const p = lessonPresentable(lesson);
    const opener = p.scenes.find((s) => /open in prayer/i.test(s.audience.title));
    // opener carries the verbatim anchor on the audience payload (the room reads it)
    expect(opener.audience.scripture).toContain('Ecclesiastes 3:1');
    // Ecclesiastes 3:1 is in the fetched KJV store, so the actual verse text rides along
    expect(opener.audience.scripture).toMatch(/to every thing there is a season/i);
    // the closing recap repeats the sourced Scriptures for a refresher
    const recap = p.scenes[p.scenes.length - 1];
    expect(recap.audience.scripture).toMatch(/to every thing there is a season/i);
    // and the built slide carries scripture through to the projector
    const openerIdx = p.scenes.indexOf(opener);
    expect(buildSlideForScene(p.scenes, openerIdx, {}).scripture).toBeTruthy();
  });

  it('a time budget reflows THIS lesson only (45 min lands per-part, not ~2.8)', () => {
    const p = lessonPresentable(lesson);
    const fit = fitToBudget(p.scenes, 45);
    // every part keeps a real share of 45 — the heavy "big idea" gets the most,
    // and no part is crushed to a 2.8-min series-slice
    const big = fit.plan.find((s) => /big idea/i.test(s.audience?.title || ''));
    expect(big.allocatedMin).toBeGreaterThan(10);
    expect(fit.plan.every((s) => s.skipped || s.allocatedMin >= 1)).toBe(true);
  });

  it('pitches the teaching to the chosen pace and puts the anchor on the opener', () => {
    const p = lessonPresentable(lesson, { level: 'child' });
    const big = p.scenes.find((s) => /big idea/i.test(s.audience.title));
    // the big-idea part shows the FIRST half of the child lesson (whole lesson scales)
    expect(big.audience.lead).toBe('God made you to grow.');
    expect(p.scenes[0].audience.anchorRef).toBe('Ecclesiastes 3:1');
    // talking points ride as presenter-only notes on the teaching part
    expect(big.notes.some((n) => n.heading === 'Say this')).toBe(true);
    // discussion prompts land on the reflect part
    const reflect = p.scenes.find((s) => /reflect/i.test(s.audience.title));
    expect(reflect.notes.some((n) => n.heading === 'Ask the room')).toBe(true);
  });

  it('scales the WHOLE lesson — go-deeper carries the rest of the age text, not one scaled slide', () => {
    const p = lessonPresentable(lesson);
    const deeper = p.scenes.find((s) => /deeper/i.test(s.audience.title));
    // go-deeper is a teaching beat too: it re-pitches per band (second half of the text)
    expect(deeper.audience.leadByAge).toBeTruthy();
    expect(resolveAudienceLead(deeper.audience, 'child')).toBe('That is on purpose!');
    expect(resolveAudienceLead(deeper.audience, 'adult')).toBe('Honor the frame He gave.');
  });

  it('the ADULT band presents the senior rewrite (the whole lesson at the class level)', () => {
    const p = lessonPresentable(lesson);
    const big = p.scenes.find((s) => /big idea/i.test(s.audience.title));
    // adult -> senior rewrite (first half), NOT the generic big idea
    expect(resolveAudienceLead(big.audience, 'adult')).toBe('Every stage is His design.');
    expect(resolveAudienceLead(big.audience, 'child')).toBe('God made you to grow.');
    expect(resolveAudienceLead(big.audience, 'teen')).toBe('You are still forming, on purpose.');
    // the opener carries the anchor Scripture note for the minister to read
    const opener = p.scenes.find((s) => /open in prayer/i.test(s.audience.title));
    const sn = opener.notes.find((n) => /Scriptures to read/i.test(n.heading || ''));
    expect(sn).toBeTruthy();
  });

  it('falls back to a title card + a single content scene when a lesson has no run-of-show', () => {
    const bare = lessonPresentable({ id: 'x', title: 'X', bigIdea: 'idea' });
    expect(bare.scenes.length).toBe(2); // title card + the lesson
    expect(bare.scenes[0].id).toMatch(/-title$/);
    const content = bare.scenes.find((s) => !String(s.id).endsWith('-title'));
    expect(content.audience.lead).toBe('idea');
    expect(bare.targetMin).toBe(45); // sensible default, not 0 and not 607 (title untimed)
  });
});

describe('slideOutline + concise audience slides (Darrell 2026-07-19: not-too-wordy + points)', () => {
  it('splits prose into a main-idea lead + bullet points, capped', () => {
    const o = slideOutline('The main idea here. First supporting detail. Second detail. Third detail.');
    expect(o.lead).toBe('The main idea here.');
    expect(o.points).toEqual(['First supporting detail.', 'Second detail.', 'Third detail.']);
    // single sentence -> all lead, no points; empty -> empty
    expect(slideOutline('Just one thought.')).toEqual({ lead: 'Just one thought.', points: [] });
    expect(slideOutline('')).toEqual({ lead: '', points: [] });
    // caps the number of points so the screen never becomes a wall
    const many = slideOutline('Lead. A. B. C. D. E. F. G. H.', { maxPoints: 3 });
    expect(many.lead).toBe('Lead.');
    expect(many.points).toEqual(['A.', 'B.', 'C.']);
  });

  it('resolveAudiencePoints re-pitches bullets by band, falling back to base', () => {
    const a = { points: ['base1'], pointsByAge: { child: ['kid1', 'kid2'], adult: ['grown1'] } };
    expect(resolveAudiencePoints(a, 'child')).toEqual(['kid1', 'kid2']);
    expect(resolveAudiencePoints(a, 'adult')).toEqual(['grown1']);
    expect(resolveAudiencePoints(a, 'teen')).toEqual(['base1']); // no teen variant -> base
    expect(resolveAudiencePoints({}, 'child')).toEqual([]);      // nothing -> empty
  });

  it('a LONG teaching beat projects a SHORT main idea + points, with the full beat text in notes', () => {
    const longText = 'The one thing to hold is this. Pride is the first danger. Frustration is the second. '
      + 'The body coming together is God to grant. Self-control is a fruit not willpower. '
      + 'Accountability is never the judge bench. The standard must be equal. '
      + 'The greatest servant is the king.';
    const lesson = {
      id: 'wordy', title: 'A wordy lesson', bigIdea: 'idea',
      anchor: { ref: 'Psalm 1:1', theme: 't' },
      levels: { child: longText, teen: longText, senior: longText },
      facilitator: { howToRun: 'Open (3): pray | The big idea (15): teach it | Go deeper (10): more | Take it with you (2): go' },
    };
    const p = lessonPresentable(lesson, { level: 'adult' });
    const big = p.scenes.find((s) => /big idea/i.test(s.audience.title));
    // the ROOM sees a short main idea (one sentence) + bullet points, NOT the paragraph
    expect(big.audience.lead).toBe('The one thing to hold is this.');
    expect(big.audience.lead.length).toBeLessThan(60);
    expect(Array.isArray(big.audience.points)).toBe(true);
    expect(big.audience.points.length).toBeGreaterThan(0);
    big.audience.points.forEach((pt) => expect(longText).toContain(pt)); // real sentences, not invented
    // the full beat text rides in presenter notes (nothing lost), longer than the lead
    const teachNote = big.notes.find((n) => /the teaching/i.test(n.heading || ''));
    expect(teachNote).toBeTruthy();
    expect(teachNote.body.startsWith('The one thing to hold is this.')).toBe(true);
    expect(teachNote.body.length).toBeGreaterThan(big.audience.lead.length);
    // the projected slide carries lead + points for the room
    const slide = buildSlideForScene(p.scenes, p.scenes.indexOf(big), { age: 'adult' });
    expect(slide.lead).toBe('The one thing to hold is this.');
    expect(Array.isArray(slide.points) && slide.points.length > 0).toBe(true);
  });
});

describe('cited Scripture — the room reads the Word directly (Darrell 2026-07-19)', () => {
  it('scriptureRefsInText pulls the cited references, deduped + capped', () => {
    const refs = scriptureRefsInText('the body (1 Corinthians 12:18); build the house (Psalm 127:1); great (Mark 10:43-45); again (Psalm 127:1)');
    expect(refs).toEqual(['1 Corinthians 12:18', 'Psalm 127:1', 'Mark 10:43-45']); // Psalm 127:1 deduped
    expect(scriptureRefsInText('no scripture here at all')).toEqual([]);
    expect(scriptureRefsInText('Mark 1:1 John 2:2 Luke 3:3 Acts 4:4 James 5:5', { max: 3 })).toHaveLength(3);
    // multi-word + numbered books resolve
    expect(scriptureRefsInText('see Song of Solomon 2:1 and 2 Timothy 1:7')).toEqual(['Song of Solomon 2:1', '2 Timothy 1:7']);
  });

  it('a teaching beat carries the Scriptures it cites, and they flow to the built slide', () => {
    const lesson = {
      id: 'cite', title: 'Cited', bigIdea: 'idea',
      anchor: { ref: 'Psalm 1:1', theme: 't' },
      levels: {
        child: 'God sets the body (1 Corinthians 12:18). And more here.',
        teen: 'God sets the body (1 Corinthians 12:18). And more here.',
        senior: 'God sets the body (1 Corinthians 12:18). Except the LORD build the house (Psalm 127:1). And more here.',
      },
      facilitator: { howToRun: 'Open (3): pray | The big idea (15): teach | Take it with you (2): go' },
    };
    const p = lessonPresentable(lesson, { level: 'adult' });
    const big = p.scenes.find((s) => /big idea/i.test(s.audience.title));
    expect(big.audience.citedRefs).toContain('1 Corinthians 12:18');
    const slide = buildSlideForScene(p.scenes, p.scenes.indexOf(big), { age: 'adult' });
    expect(slide.citedRefs).toContain('1 Corinthians 12:18'); // rides to the projector payload
  });

  it('builds a RUNNING scripture list (cumulative, deduped) + a lesson total', () => {
    const lesson = {
      id: 'run', title: 'Running', bigIdea: 'idea',
      anchor: { ref: 'Psalm 1:1', theme: 't' },
      levels: {
        child: 'God sets the body (1 Corinthians 12:18). More here.',
        teen: 'God sets the body (1 Corinthians 12:18). More here.',
        senior: 'God sets the body (1 Corinthians 12:18). Except the LORD build the house (Psalm 127:1). More here.',
      },
      facilitator: { howToRun: 'Open (3): pray | The big idea (15): teach | Take it with you (2): go' },
    };
    const p = lessonPresentable(lesson, { level: 'adult' });
    const bigIdx = p.scenes.findIndex((s) => /big idea/i.test(s.audience.title));
    const s0 = buildSlideForScene(p.scenes, 0, { age: 'adult' });       // title (carries the anchor)
    const sBig = buildSlideForScene(p.scenes, bigIdx, { age: 'adult' }); // after teaching
    expect(s0.scripturesSoFar).toContain('Psalm 1:1');                  // anchor shown from the title
    expect(sBig.scripturesSoFar).toEqual(expect.arrayContaining(['Psalm 1:1', '1 Corinthians 12:18']));
    expect(sBig.scripturesSoFar.length).toBeGreaterThanOrEqual(s0.scripturesSoFar.length); // grows
    expect(sBig.scripturesSoFar.filter((r) => r === 'Psalm 1:1')).toHaveLength(1);          // deduped
    expect(sBig.scripturesTotal).toBeGreaterThanOrEqual(sBig.scripturesSoFar.length);       // running of total
  });
});

describe('resolveAudienceLead — live age re-pitch of one slide', () => {
  it('returns the band variant when present, else the base lead', () => {
    const a = { lead: 'base', leadByAge: { child: 'kid', teen: 'teen', adult: 'grown' } };
    expect(resolveAudienceLead(a, 'child')).toBe('kid');
    expect(resolveAudienceLead(a, 'adult')).toBe('grown');
    expect(resolveAudienceLead(a, 'missing')).toBe('base'); // unknown band -> base
    expect(resolveAudienceLead({ lead: 'base' }, 'child')).toBe('base'); // no variants -> base
    expect(resolveAudienceLead(null, 'child')).toBe(''); // safe on empty
  });
});

describe('parseRunOfShow — facilitator run-of-show into reflowable weighted segments', () => {
  it('parses "Name (min): detail | ..." with the minutes as the weight', () => {
    const segs = parseRunOfShow('Prayer + the anchor (5): open in prayer | Hands-on in the app (25): everyone tries it | Send-off (5): solo task');
    expect(segs.length).toBe(3);
    expect(segs[0]).toMatchObject({ name: 'Prayer + the anchor', estimatedMin: 5 });
    expect(segs[0].detail).toContain('open in prayer');
    expect(segs[1].estimatedMin).toBe(25);    // Hands-on is heaviest, by the authored minutes
    // these weights drive the proportional reflow directly
    const fit = fitToBudget(segs, 14);        // half of 35 -> each ~halves, Hands-on stays biggest
    const handsOn = fit.plan.find((s) => s.name === 'Hands-on in the app');
    expect(handsOn.allocatedMin).toBeGreaterThan(fit.plan.find((s) => s.name === 'Prayer + the anchor').allocatedMin);
  });

  it('is empty-safe and tolerates a segment with no (min) hint', () => {
    expect(parseRunOfShow('')).toEqual([]);
    expect(parseRunOfShow(null)).toEqual([]);
    const segs = parseRunOfShow('Welcome: greet the room');
    expect(segs[0].name).toBe('Welcome');
    expect(segs[0].estimatedMin).toBeUndefined();  // backfilled by fitToBudget later
  });
});

describe('The Word — a LIBRARY of messages, each its OWN presentation', () => {
  const sermons = [
    { id: 'm1', title: 'Faith Over Fear', serviceDate: '2026-06-21', serviceType: 'sunday', speaker: 'Bishop Lloyd E. Gwin', scriptureRef: '1 Peter 5', notes: 'cast your cares', status: 'active' },
    { id: 'm2', title: 'Older', serviceDate: '2026-06-14', serviceType: 'wednesday', speaker: 'Guest', scriptureRef: 'Psalm 23', status: 'active' },
    { id: 'd1', title: 'A Draft', serviceDate: '2026-07-01', status: 'draft' },
  ];

  it('wordLibrary lists pickable published messages, newest-first, drafts dropped', () => {
    const lib = wordLibrary(sermons);
    expect(lib.length).toBe(2);                  // draft excluded
    expect(lib[0].id).toBe('m1');                // newest first
    // dayLabel is the KIND now (not a weekday word) — the dateLabel carries the
    // real weekday, so the label can never contradict the date (2026-07-02 fix).
    expect(lib[0].dayLabel).toBe('Service');
    expect(lib[1].dayLabel).toBe('Bible study');
    expect(wordLibrary(null)).toEqual([]);
  });

  it('messagePresentable builds ONE message into its OWN slides (not all messages)', () => {
    const p = messagePresentable(sermons[0]);
    // its scenes are THIS message's own slides (opening / text / message) — a few, not 163
    expect(p.scenes.length).toBe(3);
    expect(p.id).toBe('message:m1');
    expect(p.title).toBe('Faith Over Fear');
    expect(p.scenes[0].indexLabel).toBe('Opening');
    expect(p.scenes[1].audience.title).toBe('1 Peter 5');   // the text slide
    // the pager walks THIS message's 3 slides (not 163 messages)
    const slide = buildSlideForScene(p.scenes, 0, { kicker: p.kicker });
    expect(slide.total).toBe(3);
    expect(slide.index).toBe(1);
    expect(slide.indexLabel).toBe('Opening');
    // speaker/theme stay presenter-side (no leak to the projected slide)
    expect(JSON.stringify(slide)).not.toContain('cast your cares');
  });

  it('messagePresentable is minimal-safe for a bare message (title only)', () => {
    const p = messagePresentable({ id: 'x', title: 'Just a title' });
    expect(p.scenes.length).toBe(1);             // only the opening slide
    expect(p.scenes[0].audience.title).toBe('Just a title');
  });
});

describe('age-adaptive presenter hook', () => {
  it('exposes EVERY authored version — everyone (the big idea) + child/teen/adult — each with a hint', () => {
    expect(PRESENT_AGE_BANDS.map((b) => b.id)).toEqual(['everyone', 'child', 'teen', 'adult']);
    expect(DEFAULT_PRESENT_AGE).toBe('everyone'); // a mixed room is the common case
    expect(ageHint('child')).toMatch(/one idea/i);
    expect(ageHint('everyone')).toMatch(/mixed room|anyone/i);
    expect(ageHint('nonsense')).toBe(ageHint(DEFAULT_PRESENT_AGE)); // falls back
  });

  it('lessonPresentable exposes the "everyone" register (the general big idea) alongside the ages', () => {
    const lesson = {
      id: 'reg', title: 'Registers', bigIdea: 'The general big idea, for anyone. It has a second sentence.',
      anchor: { ref: 'Psalm 1:1', theme: 't' },
      levels: { child: 'Kid text here. And more.', teen: 'Teen text here. And more.', senior: 'Senior text here. And more.' },
      facilitator: { howToRun: 'Open (3): pray | The big idea (15): teach | Take it with you (2): go' },
    };
    const p = lessonPresentable(lesson);
    const big = p.scenes.find((s) => /big idea/i.test(s.audience.title));
    // all four registers are present on the same slide, so the speaker can pick any live
    expect(Object.keys(big.audience.leadByAge).sort()).toEqual(['adult', 'child', 'everyone', 'teen']);
    // the "everyone" register is the general big idea; "adult" is the senior rewrite
    expect(resolveAudienceLead(big.audience, 'everyone')).toBe('The general big idea, for anyone.');
    expect(resolveAudienceLead(big.audience, 'adult')).toBe('Senior text here.');
    expect(resolveAudienceLead(big.audience, 'child')).toBe('Kid text here.');
  });
});

// -----------------------------------------------------------------------------
// time-adaptive: weight contract + PROPORTIONAL fit-to-budget + floors + skip
// -----------------------------------------------------------------------------
// scene(id, weight, priority, floor) — floor optional (defaults via withSceneTiming).
const scene = (id, estimatedMin, priority, minMin) => ({ id, estimatedMin, priority, minMin, audience: { title: id }, notes: [] });
// Two core (10+10) + two supplementary (10+5) = 35 min full curriculum; floors default to 2.
const CURRICULUM = [
  scene('A', 10, PRIORITY.CORE),
  scene('B', 10, PRIORITY.CORE),
  scene('C', 10, PRIORITY.SUPPLEMENTARY),
  scene('D', 5, PRIORITY.SUPPLEMENTARY),
];
const byId = (rows, id) => rows.find((r) => r.id === id);

describe('scene weight contract (estimatedMin + priority + floor) with backfill', () => {
  it('withSceneTiming supplies a weight, priority, and floor without mutating', () => {
    const bare = { id: 'x', audience: { title: 'X' } };
    const t = withSceneTiming(bare);
    expect(t.estimatedMin).toBe(DEFAULT_SCENE_MIN);  // content estimate clamps up to 5
    expect(t.priority).toBe(PRIORITY.CORE);          // un-annotated -> core (protected)
    expect(t.minMin).toBe(2);                        // default floor, clamped <= weight
    expect(bare.estimatedMin).toBeUndefined();       // non-mutating
    expect(withSceneTiming({ id: 'y', estimatedMin: 0 }, { defaultMin: 7 }).estimatedMin).toBe(7);
    expect(withSceneTiming({ id: 'z', priority: 'supplementary' }).priority).toBe(PRIORITY.SUPPLEMENTARY);
    // a floor never exceeds the section's own weight
    expect(withSceneTiming({ id: 'w', estimatedMin: 3, minMin: 9 }).minMin).toBe(3);
  });

  it('estimateSceneMinutes weights deeper content heavier (non-uniform default)', () => {
    const rich = estimateSceneMinutes({ audience: { lead: 'x'.repeat(300) }, notes: [{ kind: 'steps', items: [1, 2, 3, 4] }, { kind: 'list', items: ['a', 'b'] }] });
    const thin = estimateSceneMinutes({ audience: { title: 'a' }, notes: [] });
    expect(rich).toBeGreaterThan(thin);
  });

  it('fullContentMin sums the whole curriculum', () => {
    expect(fullContentMin(CURRICULUM)).toBe(35);
    expect(fullContentMin([{ id: 'a' }, { id: 'b' }], { defaultMin: 4 })).toBe(8);
  });

  it('adapters carry weight + floor, and course weights are NON-uniform by content', () => {
    const p = messagePresentable({ id: 'm1', title: 'T', serviceDate: '2026-06-21', status: 'active' });
    expect(p.scenes[0].estimatedMin).toBeGreaterThan(0);
    expect(p.scenes[0].minMin).toBeGreaterThan(0);
    expect(p.scenes[0].priority).toBe(PRIORITY.CORE);
    // a week's weight = its real session length (sum of its run-of-show minutes), so a
    // longer-run week weighs more than a thin one with no timed run-of-show
    const cp = coursePresentable({ meta: { key: 'x', title: 'X' }, schedule: [
      { id: 'a', title: 'A', bigIdea: 'idea', week: 1, facilitator: { howToRun: 'Teach (10): x | Hands-on (20): y' } },
      { id: 'b', title: 'B', bigIdea: 'x', week: 2 },
    ] });
    expect(cp.scenes[0].estimatedMin).toBe(30);                       // 10 + 20
    expect(cp.scenes[0].estimatedMin).toBeGreaterThan(cp.scenes[1].estimatedMin);
  });
});

describe('fitToBudget — PROPORTIONAL reflow (weight-preserving + floors + skip)', () => {
  it('with MORE time than needed, each section runs to its own weight (no padding)', () => {
    const r = fitToBudget(CURRICULUM, 60);
    expect(r.fits).toBe(true);
    expect(r.compressed).toBe(false);
    expect(r.skipped).toHaveLength(0);
    expect(r.keptMin).toBe(35);
    expect(byId(r.plan, 'A').allocatedMin).toBe(10); // its weight, not stretched
    expect(byId(r.plan, 'D').allocatedMin).toBe(5);
    expect(r.summary).toMatch(/own weight/i);
  });

  it('shrinks PROPORTIONALLY — every section keeps the same percentage of the clock', () => {
    const r = fitToBudget(CURRICULUM, 20);           // 20 of 35; floors (2 each) fit, no skip
    expect(r.skipped).toHaveLength(0);
    expect(r.compressed).toBe(true);
    expect(r.counts.atFloor).toBe(0);
    // weight share preserved: A is 10/35 = 28.6% of content -> 28.6% of 20 ≈ 5.7 min
    expect(byId(r.plan, 'A').allocatedMin).toBeCloseTo(5.7, 1);
    expect(byId(r.plan, 'D').allocatedMin).toBeCloseTo(2.9, 1);
    const shareWeight = 10 / 35;
    const shareTime = byId(r.plan, 'A').allocatedMin / r.keptMin;
    expect(shareTime).toBeCloseTo(shareWeight, 2);   // SAME percentage
    expect(r.keptMin).toBeCloseTo(20, 1);
    expect(r.summary).toMatch(/keeps its share/i);
  });

  it('honors a per-section FLOOR: a light section pins to its floor, rest re-split', () => {
    const FLOORY = [scene('A', 90, PRIORITY.CORE, 5), scene('B', 10, PRIORITY.CORE, 5)]; // full 100, floors 5
    const r = fitToBudget(FLOORY, 20);               // B's proportional 2 < floor 5 -> pin to 5
    expect(r.skipped).toHaveLength(0);
    expect(byId(r.plan, 'B').allocatedMin).toBe(5);
    expect(byId(r.plan, 'B').atFloor).toBe(true);
    expect(byId(r.plan, 'A').allocatedMin).toBe(15); // gets the remainder
    expect(byId(r.plan, 'A').atFloor).toBe(false);
    expect(r.counts.atFloor).toBe(1);
    expect(r.overBudget).toBe(false);
  });

  it('falls back to SKIP only when floors overflow the budget — supplementary first, core protected', () => {
    const TIGHT = [
      scene('A', 10, PRIORITY.CORE, 8), scene('B', 10, PRIORITY.CORE, 8),
      scene('C', 10, PRIORITY.SUPPLEMENTARY, 8), scene('D', 10, PRIORITY.SUPPLEMENTARY, 8),
    ]; // floors 8 each = 32 > budget
    const r = fitToBudget(TIGHT, 20);                // 32 floor-min > 20 -> must skip supplementary
    expect(byId(r.plan, 'C').skipped).toBe(true);
    expect(byId(r.plan, 'C').skipReason).toBe('auto');
    expect(byId(r.plan, 'D').skipped).toBe(true);
    expect(byId(r.plan, 'A').skipped).toBe(false);   // core protected
    expect(byId(r.plan, 'B').skipped).toBe(false);
    expect(r.counts).toMatchObject({ coreKept: 2, suppSkipped: 2, coreSkipped: 0 });
    expect(r.overBudget).toBe(false);                // after skipping, A+B floors (16) fit 20
    expect(r.keptMin).toBeCloseTo(20, 1);
    expect(r.summary).toMatch(/skipping 2 supplementary/i);
  });

  it('protects core even when its floors overflow: compresses below floor, never skips core', () => {
    const CORETIGHT = [scene('A', 10, PRIORITY.CORE, 8), scene('B', 10, PRIORITY.CORE, 8)]; // floors 16
    const r = fitToBudget(CORETIGHT, 10);            // 16 floor-min > 10, nothing droppable
    expect(r.overBudget).toBe(true);
    expect(r.counts.coreSkipped).toBe(0);
    expect(byId(r.plan, 'A').skipped).toBe(false);
    expect(byId(r.plan, 'A').allocatedMin).toBeCloseTo(5, 1); // proportional, below floor
    expect(r.summary).toMatch(/below their floor/i);
  });

  it('honors a forced KEEP of a supplementary scene (survives auto-skip)', () => {
    const TIGHT = [
      scene('A', 10, PRIORITY.CORE, 8), scene('B', 10, PRIORITY.CORE, 8),
      scene('C', 10, PRIORITY.SUPPLEMENTARY, 8), scene('D', 10, PRIORITY.SUPPLEMENTARY, 8),
    ];
    const r = fitToBudget(TIGHT, 20, { overrides: { C: 'keep' } });
    expect(byId(r.plan, 'C').skipped).toBe(false);   // user override wins
    expect(byId(r.plan, 'D').skipped).toBe(true);    // the other supplementary goes
  });

  it('honors a forced SKIP (even of a core scene — the user decides)', () => {
    const r = fitToBudget(CURRICULUM, 100, { overrides: { A: 'skip' } });
    expect(r.fits).toBe(true);
    expect(byId(r.plan, 'A').skipped).toBe(true);
    expect(byId(r.plan, 'A').skipReason).toBe('forced');
    expect(r.counts.coreSkipped).toBe(1);
  });

  it('treats no/!finite budget as "full weights"', () => {
    const r = fitToBudget(CURRICULUM, 0);
    expect(r.budgetMin).toBe(35);
    expect(r.skipped).toHaveLength(0);
    expect(byId(r.plan, 'A').allocatedMin).toBe(10); // natural weight
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
    const RANKABLE = [
      scene('A', 10, PRIORITY.CORE, 5), scene('B', 10, PRIORITY.CORE, 5),
      scene('C', 10, PRIORITY.SUPPLEMENTARY, 5), scene('D', 10, PRIORITY.SUPPLEMENTARY, 5),
    ]; // floors 5 each = 20
    // budget 16 needs ONE supplementary dropped; custom ranker drops D (not the default C)
    const r = fitToBudget(RANKABLE, 16, { rankSkips: () => ['D'] });
    expect(byId(r.plan, 'D').skipped).toBe(true);
    expect(byId(r.plan, 'C').skipped).toBe(false);
    // a throwing ranker must not break the reflow (deterministic fallback engages)
    const safe = fitToBudget(RANKABLE, 16, { rankSkips: () => { throw new Error('llm down'); } });
    expect(safe.skipped.length).toBeGreaterThan(0);
  });
});

// scene with an explicit importance (lesson weight)
const wscene = (id, estimatedMin, priority, minMin, importance) => ({ id, estimatedMin, priority, minMin, importance, audience: { title: id }, notes: [] });

describe('fitToBudget — IMPORTANCE-weighted (lesson weights protect the essential)', () => {
  it('importance defaults to 1 and is honored when set (backfill)', () => {
    expect(withSceneTiming({ id: 'x', audience: {} }).importance).toBe(DEFAULT_IMPORTANCE);
    expect(withSceneTiming({ id: 'x', importance: 3, audience: {} }).importance).toBe(3);
    expect(withSceneTiming({ id: 'x', importance: -2, audience: {} }).importance).toBe(1); // bad -> default
  });

  it('uniform importance reflows EXACTLY like the time-proportional model (no regression)', () => {
    const UNI = [wscene('A', 10, PRIORITY.CORE), wscene('B', 10, PRIORITY.CORE), wscene('C', 10, PRIORITY.SUPPLEMENTARY), wscene('D', 5, PRIORITY.SUPPLEMENTARY)];
    const r = fitToBudget(UNI, 20);                 // 20 of 35; floors fit
    expect(r.weighted).toBe(false);
    expect(byId(r.plan, 'A').allocatedMin).toBeCloseTo(5.7, 1); // same as the proportional test
    expect(r.skipped).toHaveLength(0);
  });

  it('the most essential material is PROTECTED and gets the minutes; low-weight compresses', () => {
    // A (weight 3) + B (weight 1), both need 10 min; budget 15 (< 20 full)
    const r = fitToBudget([wscene('A', 10, PRIORITY.CORE, 2, 3), wscene('B', 10, PRIORITY.CORE, 2, 1)], 15);
    expect(r.weighted).toBe(true);
    // A's importance-weighted share (30/40*15=11.25) is capped at its natural need (10);
    // B takes the remainder and compresses to 5.
    expect(byId(r.plan, 'A').allocatedMin).toBe(10);
    expect(byId(r.plan, 'A').atCap).toBe(true);
    expect(byId(r.plan, 'B').allocatedMin).toBeCloseTo(5, 1);
    expect(byId(r.plan, 'A').allocatedMin).toBeGreaterThan(byId(r.plan, 'B').allocatedMin);
  });

  it('drops by ASCENDING importance — least essential first, weightiest protected', () => {
    // floors 6 each (sum 24) > budget 20 -> drop exactly ONE supplementary
    const DROP = [
      wscene('A', 10, PRIORITY.CORE, 6, 1), wscene('B', 10, PRIORITY.CORE, 6, 1),
      wscene('C', 10, PRIORITY.SUPPLEMENTARY, 6, 0.5), wscene('D', 10, PRIORITY.SUPPLEMENTARY, 6, 5),
    ];
    const r = fitToBudget(DROP, 20);
    expect(byId(r.plan, 'C').skipped).toBe(true);   // least essential (0.5) goes first
    expect(byId(r.plan, 'D').skipped).toBe(false);  // weightiest supplementary protected
    expect(byId(r.plan, 'A').skipped).toBe(false);  // core never dropped
    expect(byId(r.plan, 'B').skipped).toBe(false);
    expect(r.summary).toMatch(/least-essential/i);
  });

  it('importanceSkipRanker orders ascending importance, tie-break largest-time; uniform == deterministic', () => {
    const cands = [
      { _key: 'a', _i: 0, estimatedMin: 5, importance: 2 },
      { _key: 'b', _i: 1, estimatedMin: 10, importance: 1 },
      { _key: 'c', _i: 2, estimatedMin: 5, importance: 1 },
    ];
    expect(importanceSkipRanker(cands)).toEqual(['b', 'c', 'a']); // imp 1s first (largest-time b before c), then imp 2
    const uni = cands.map((c) => ({ ...c, importance: 1 }));
    expect(importanceSkipRanker(uni)).toEqual(deterministicSkipRanker(uni)); // uniform == old order
  });

  it('coursePresentable passes a module importance weight through to the scene', () => {
    const cp = coursePresentable({ meta: { key: 'x', title: 'X' }, schedule: [
      { id: 'a', title: 'A', bigIdea: 'i', week: 1, importance: 4, facilitator: { howToRun: 'Teach (10): x' } },
      { id: 'b', title: 'B', bigIdea: 'i', week: 2, facilitator: { howToRun: 'Teach (10): y' } },
    ] });
    expect(byId(cp.scenes, 'a').importance).toBe(4);
    expect(byId(cp.scenes, 'b').importance).toBe(1); // default
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

// Darrell 2026-11-26, on the Relationships section: "maybe we have a premium level of
// Relationships?" -- premium in depth, never in price (DR-0536). DR-1702: three guided
// tracks built from the shelf's own lessons, each line the lesson's own words, progress
// from the reader's own places. Every gate here is shown to catch its break.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { learnInventory } from '../lib/learn-presentation/integrity.js';
import { RELATIONSHIP_LESSONS, presentationIndex, presentLesson } from '../lib/learn-presentation/presentation.js';
import { RELATIONSHIP_TRACKS, relationshipTracks, trackAction, whyIsTheLessons, promptFrom } from '../lib/learn-presentation/relationship-tracks.js';
import { placeLookup } from '../lib/lesson-progress.js';
import LearnStudio from '../components/learn-studio/LearnStudio.jsx';
import RECORDS from '../lib/learn-presentation/presentation-records.json';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const COURSES = learnInventory().map((c) => ({ key: c.key, meta: { ...(c.meta || {}), key: c.key }, schedule: c.lessons }));
// The shipped records, as the app builds its index (LearnStudioPreview).
const INDEX = presentationIndex(RECORDS.records);
const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public');
const BY_ID = new Map(COURSES.flatMap((c) => c.schedule.map((l) => [l.id, { lesson: l, course: c }])));
// The new look presents with `preview` on (LearnStudioPreview); every record is still `review` (measured 2026-11-26).
const track = (id, opts) => relationshipTracks(COURSES, INDEX, { preview: true, ...opts }).find((t) => t.id === id);
const COUPLES = RELATIONSHIP_TRACKS.find((t) => t.id === 'couples');
const firstIds = (id) => track(id).steps.map((s) => s.x.lesson.id);
const L346 = 'll346-better-than-he-that-taketh-a-city-ruling-your-spirit-when';

describe('the tracks are built from real lessons, in their own words (DR-1702)', () => {
  it('three tracks: Couples (six weeks), Parents, Repair', () => {
    expect(RELATIONSHIP_TRACKS.map((t) => t.id)).toEqual(['couples', 'parents', 'repair']);
    expect(COUPLES.steps).toHaveLength(6);
    expect(track('couples').total).toBe(6);
  });

  it('every step is a mounted lesson already on the Relationships shelf (a lesson still in review is marked whenMounted)', () => {
    for (const t of RELATIONSHIP_TRACKS) {
      const ids = t.steps.map((s) => s.id);
      expect(new Set(ids).size, t.id).toBe(ids.length);
      for (const s of t.steps) {
        if (s.whenMounted && !BY_ID.has(s.id)) continue;
        expect(BY_ID.has(s.id), s.id).toBe(true);
        expect(RELATIONSHIP_LESSONS, s.id).toContain(s.id);
      }
    }
  });

  it("every why is a span of the lesson's own bigIdea, and every talk prompt is one of its own discussion prompts", () => {
    for (const t of RELATIONSHIP_TRACKS)
      for (const s of t.steps) {
        const hit = BY_ID.get(s.id);
        if (!hit) continue;
        expect(whyIsTheLessons(hit.lesson, s.why), `${s.id}: "${s.why}"`).toBe(true);
        expect(promptFrom(hit.lesson, s.prompt), s.id).toBeTruthy();
        expect(hit.lesson.facilitator.discussionPrompts).toContain(promptFrom(hit.lesson, s.prompt));
      }
    for (const t of relationshipTracks(COURSES, INDEX, { preview: true })) for (const s of t.steps) expect(s.why && s.prompt, s.x.lesson.id).toBeTruthy();
  });

  it('proven to catch: an invented why is refused and dropped, a missing prompt is empty', () => {
    const real = BY_ID.get(COUPLES.steps[0].id).lesson;
    expect(whyIsTheLessons(real, 'Every husband must earn more than his wife.')).toBe(false);
    expect(whyIsTheLessons(real, '')).toBe(false);
    expect(promptFrom(real, 99)).toBe('');
    // The lesson rewritten so the span is gone: the step stays, the stale line does not show.
    const rewritten = COURSES.map((c) => ({
      ...c,
      schedule: c.schedule.map((l) => (l.id === real.id ? { ...l, bigIdea: 'A different big idea.' } : l)),
    }));
    const t = relationshipTracks(rewritten, INDEX, { preview: true }).find((x) => x.id === 'couples');
    expect(t.steps[0].x.lesson.id).toBe(real.id);
    expect(t.steps[0].why).toBe('');
  });

  it("each track wears one of its own lessons' own covers: current (not stale), and the file ships", () => {
    for (const def of RELATIONSHIP_TRACKS) {
      expect(
        def.steps.map((s) => s.id),
        def.id
      ).toContain(def.cover);
      const { lesson, course } = BY_ID.get(def.cover);
      const p = presentLesson(lesson, course, INDEX, { preview: true });
      expect(p.stale, def.id).toBe(false);
      expect(p.image && p.image.src, def.id).toMatch(/^learn-thumbs\//);
      expect(existsSync(join(PUBLIC, p.image.src)), p.image.src).toBe(true);
      expect(track(def.id).cover.p.image.src).toBe(p.image.src);
    }
  });

  it('L346 joins Repair as its last step the moment it is in the catalog, and is absent before', () => {
    const repair = RELATIONSHIP_TRACKS.find((t) => t.id === 'repair');
    const def = repair.steps.find((s) => s.id === L346);
    expect(def && def.whenMounted).toBe(true);
    const mounted = BY_ID.has(L346);
    expect(firstIds('repair').includes(L346)).toBe(mounted);
    if (mounted) return;
    // The lesson's own words (PR #2959), so the span and prompt resolve once it lands.
    const ll346 = {
      id: L346,
      title: 'Better Than He That Taketh a City',
      bigIdea:
        'BETTER THAN HE THAT TAKETH A CITY: RULING YOUR SPIRIT WHEN THE WORD IS TWISTED. The sting comes from loving the truth, and that is not the sin; what we do next is the test.',
      facilitator: { discussionPrompts: ['a', 'b', 'Who is one person you love who believes differently?'] },
    };
    const withIt = COURSES.map((c) => (c.key === 'living-lessons' ? { ...c, schedule: [...c.schedule, ll346] } : c));
    const t = relationshipTracks(withIt, INDEX, { preview: true }).find((x) => x.id === 'repair');
    expect(t.steps.at(-1).x.lesson.id).toBe(L346);
    expect(t.steps.at(-1).why).toBe(def.why);
    expect(t.steps.at(-1).prompt).toBe('Who is one person you love who believes differently?');
  });
});

describe('progress comes from the reader’s own places and record, never painted (DR-0076)', () => {
  const ids = COUPLES.steps.map((s) => s.id);
  const place = (lessonId, extra) => ({ courseKey: BY_ID.get(lessonId).course.key, lessonId, at: 1, ...extra });

  it('nothing saved: Not started, Start opens step 1', () => {
    const t = track('couples');
    expect(t.started).toBe(false);
    expect(t.finishedCount).toBe(0);
    expect(trackAction(t)).toBe('Start');
    expect(t.next.number).toBe(1);
  });

  it('a step-only place (nothing measured) is not progress', () => {
    const t = track('couples', { findPlace: placeLookup([place(ids[0], { stage: 1, step: 3 })]) });
    expect(t.started).toBe(false);
    expect(t.steps[0].progress).toBeNull();
  });

  it('a measured place begins the track and Continue stays on that step', () => {
    const t = track('couples', { findPlace: placeLookup([place(ids[0], { seen: 0.4 })]) });
    expect(t.started).toBe(true);
    expect(t.steps[0].progress.percent).toBe(40);
    expect(trackAction(t)).toBe('Continue step 1');
  });

  it('read lessons (the record, or a place read to the end) count; Continue goes to the first unread step', () => {
    const t = track('couples', { done: new Set([ids[0]]), findPlace: placeLookup([place(ids[1], { done: true })]) });
    expect(t.finishedCount).toBe(2);
    expect(trackAction(t)).toBe('Continue step 3');
    expect(t.next.step.x.lesson.id).toBe(ids[2]);
  });

  it('every step read: Walk it again opens step 1', () => {
    const t = track('couples', { done: new Set(ids) });
    expect(t.complete).toBe(true);
    expect(trackAction(t)).toBe('Walk it again');
    expect(t.next.number).toBe(1);
  });
});

describe('on the Relationships page, at the top, as pictures (DR-1702)', () => {
  let container, root;
  beforeEach(() => {
    try {
      window.localStorage.clear();
    } catch {
      /* no storage */
    }
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });
  const $ = (id) => container.querySelector(`[data-testid="${id}"]`);
  const click = (n) => act(() => n.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  const openRelationships = (props = {}) => {
    const onRead = vi.fn();
    act(() => root.render(<LearnStudio courses={COURSES} index={INDEX} preview onRead={onRead} {...props} />));
    expect($('ls-relationship-tracks')).toBeNull(); // not on the home page
    click([...$('ls-relationships').querySelectorAll('button')].find((b) => b.textContent.includes('See All')));
    return onRead;
  };

  it('the three tracks sit above the lessons, each wearing its cover', () => {
    openRelationships();
    const tracks = $('ls-relationship-tracks');
    expect(tracks).toBeTruthy();
    const grid = container.querySelector('.ls-grid');
    expect(tracks.compareDocumentPosition(grid) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    for (const def of RELATIONSHIP_TRACKS) {
      const card = $(`ls-track-${def.id}`);
      expect(card, def.id).toBeTruthy();
      const img = card.querySelector('.ls-track-thumb img');
      expect(img.getAttribute('src')).toBe(track(def.id).cover.p.image.src);
      expect(card.querySelector('[data-testid="ls-track-count"]').textContent).toBe(`Not started · ${track(def.id).total} steps`);
      expect(card.querySelector('.ls-track-thumb [data-testid="lesson-progress"]')).toBeNull();
    }
    // Every step shows its why and its talk-together prompt.
    const step3 = $('ls-track-step-couples-3');
    expect(step3.textContent).toContain('Love, in the Word, is fifteen verbs and not one feeling.');
    expect(step3.textContent).toContain('Talk about it together:');
  });

  it('Start opens step 1 in the Lesson Experience; a step opens that step', () => {
    const onRead = openRelationships();
    const couples = $('ls-track-couples');
    const go = couples.querySelector('[data-testid="ls-track-go"]');
    expect(go.textContent).toBe('Start');
    click(go);
    expect(onRead).toHaveBeenLastCalledWith(BY_ID.get(COUPLES.steps[0].id).lesson, BY_ID.get(COUPLES.steps[0].id).course, undefined);
    click($('ls-track-step-couples-3').querySelector('button'));
    expect(onRead.mock.calls.at(-1)[0].id).toBe(COUPLES.steps[2].id);
  });

  it('with step 1 on the record, it says 1 of 6 read and Continue step 2 opens step 2', () => {
    const onRead = openRelationships({ done: new Set([COUPLES.steps[0].id]) });
    const couples = $('ls-track-couples');
    expect(couples.querySelector('[data-testid="ls-track-count"]').textContent).toBe('1 of 6 read');
    expect(Number(couples.querySelector('.ls-track-thumb [data-testid="lesson-progress"]').dataset.progress)).toBeCloseTo(1 / 6);
    const go = couples.querySelector('[data-testid="ls-track-go"]');
    expect(go.textContent).toBe('Continue step 2');
    click(go);
    expect(onRead.mock.calls.at(-1)[0].id).toBe(COUPLES.steps[1].id);
  });
});

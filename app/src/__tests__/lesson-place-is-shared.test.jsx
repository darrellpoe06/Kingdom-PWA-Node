// DR-1672: the lesson screen keeps the SAME place as the classic page, and its sections are
// the classic page's sections, so "chapter 6 of 12" is where you come back to, from either view.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import LessonExperience, { readingTextFor, mapSegmentsToParagraphs } from '../components/learn-studio/LessonExperience.jsx';
import { readSections } from '../components/learn-studio/ReadSections.jsx';
import { segmentText } from '../lib/tts.js';
import { recordPlace, getPlaceFor, sentenceKeyOf } from '../lib/learn-resume.js';
import { learnInventory } from '../lib/learn-presentation/integrity.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const LESSONS = learnInventory().flatMap((c) => (c.lessons || []).map((l) => ({ l, courseKey: c.key })));
const pick = (prefix) => LESSONS.find((x) => x.l.id && x.l.id.startsWith(prefix));
const L140 = pick('ll140-the-people-of-judah');
const L136 = pick('ll136-touched-with-the-feeling');

let container, root, landed;
beforeEach(() => {
  window.localStorage.clear();
  window.speechSynthesis = { speaking: false, pending: false, paused: false, speak() {}, cancel() {}, pause() {}, resume() {}, getVoices: () => [], addEventListener() {}, removeEventListener() {} };
  window.SpeechSynthesisUtterance = function U(t) {
    this.text = t;
  };
  landed = [];
  Element.prototype.scrollIntoView = function spy() {
    landed.push([...container.querySelectorAll('.le-book-p')].indexOf(this));
  };
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  delete Element.prototype.scrollIntoView;
});
const openRead = ({ l, courseKey }) =>
  act(() => root.render(<LessonExperience lesson={l} record={{ courseKey }} onExit={() => {}} initialMode="read" createNarrator={() => ({ status: 'idle', load() {}, play() {}, pause() {}, resume() {}, stop() {}, setRate() {}, onBoundary() {} })} />));
const shape = (l) => {
  const text = readingTextFor(l, 'adult');
  const paragraphs = text.split(/\n\n+/).filter(Boolean);
  const segments = segmentText(text);
  return { paragraphs, segments, ...mapSegmentsToParagraphs(paragraphs, segments) };
};

describe('one place for the lesson, whichever view saved it (DR-1672)', () => {
  it('lesson 140 has the classic page\'s sections, and a place saved at section 6 opens Read on section 6', () => {
    const s = shape(L140.l);
    const sections = readSections(s.paragraphs);
    expect(sections.length).toBeGreaterThanOrEqual(12);
    const six = sections[5].at;
    const sentence = s.firstSeg[six];
    recordPlace({ courseKey: L140.courseKey, lessonId: L140.l.id, sentence, sentenceKey: sentenceKeyOf(s.segments[sentence]) });
    openRead(L140);
    expect(landed[0]).toBe(six);
    expect(container.querySelector('[data-testid="le-read-sections-toggle"]').textContent).toMatch(new RegExp(`${sections.length} sections · you are in 6`));
  });

  it('reading in the lesson screen writes the shared place the classic page reads', async () => {
    openRead(L140);
    const s = shape(L140.l);
    const sections = readSections(s.paragraphs);
    act(() => container.querySelector('[data-testid="le-read-sections-toggle"]').dispatchEvent(new MouseEvent('click', { bubbles: true })));
    act(() => container.querySelector('[data-testid="le-read-section-4"]').dispatchEvent(new MouseEvent('click', { bubbles: true })));
    const place = getPlaceFor(L140.courseKey, L140.l.id);
    expect(place).toBeTruthy();
    expect(place.sentenceKey).toBe(sentenceKeyOf(s.segments[s.firstSeg[sections[3].at]]));
  });

  it('the 55-minute High Priest lesson lists all twelve of its numbered sections, not one', () => {
    const leads = readSections(shape(L136.l).paragraphs).map((x) => x.lead);
    for (const n of ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE']) {
      expect(leads.some((l) => l.startsWith(`${n}. `))).toBe(true);
    }
  });
});
